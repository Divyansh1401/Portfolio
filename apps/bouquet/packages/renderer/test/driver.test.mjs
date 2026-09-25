// driver.test.mjs — unit tests for src/driver.js's createPlayer(), run with
// injected now()/raf()/caf() fakes and a fake canvas/parent pair, so timing
// is fully deterministic and no real DOM/rAF is needed.
//
// Nothing here imports or reads anything outside apps/bouquet at runtime.

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { makeRecorder } from './oracle/recorder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRIVER_PATH = path.join(__dirname, '..', 'src', 'driver.js');

async function importDriver() {
  return import(DRIVER_PATH);
}

/** A minimal EventTarget-like object: addEventListener/removeEventListener/dispatch. */
function makeTarget(extra) {
  const listeners = new Map();
  return Object.assign(
    {
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        const set = listeners.get(type);
        if (set) set.delete(fn);
      },
      dispatch(type, evt) {
        const set = listeners.get(type);
        if (!set) return;
        for (const fn of Array.from(set)) fn(evt);
      },
      _listenerCount(type) {
        const set = listeners.get(type);
        return set ? set.size : 0;
      },
    },
    extra
  );
}

/** @param {number} cssW @param {number} cssH */
function makeFakeCanvasAndParent(cssW, cssH) {
  const rec = makeRecorder();
  const parent = makeTarget({ clientWidth: cssW, clientHeight: cssH });
  const canvas = makeTarget({
    style: {},
    width: 0,
    height: 0,
    parentNode: parent,
    getContext() {
      return rec.ctx;
    },
  });
  return { canvas, parent, rec };
}

/** A controllable clock: now() reads a mutable counter, advance() moves it. */
function makeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}

/** A single-slot fake scheduler: only one pending callback at a time. */
function makeScheduler() {
  let pending = null;
  let nextId = 1;
  return {
    raf(cb) {
      const id = nextId++;
      pending = { id, cb };
      return id;
    },
    caf(id) {
      if (pending && pending.id === id) pending = null;
    },
    hasPending: () => pending !== null,
    fire() {
      if (!pending) throw new Error('fire(): no pending raf callback');
      const { cb } = pending;
      pending = null;
      cb();
    },
  };
}

function countClears(rec) {
  return rec.ops.filter((op) => op[0] === 'clear').length;
}

test('exactly one paint happens per rAF tick', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, rec } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();

  const player = createPlayer(canvas, {
    flyMs: 1000,
    yawIn: -180,
    reducedMotion: false,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
  });

  rec.reset(); // drop the constructor's initial frame
  player.play();
  assert.equal(sched.hasPending(), true, 'play() should schedule a rAF callback');

  clock.advance(16);
  sched.fire();
  assert.equal(countClears(rec), 1, 'one tick must produce exactly one clearRect (one paint)');

  rec.reset();
  clock.advance(16);
  sched.fire();
  assert.equal(countClears(rec), 1, 'the next tick must also produce exactly one paint');

  player.destroy();
});

test("each step's delta is capped, so a huge stall does not land in one tick", async () => {
  const { createPlayer } = await importDriver();
  const { canvas } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();
  let landedCalls = 0;

  const player = createPlayer(canvas, {
    flyMs: 300, // 3+ ticks needed at a 120ms cap
    yawIn: -90,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
    onLanded: () => { landedCalls++; },
  });

  player.play();

  // A single enormous stall: without capping this alone would land the flight.
  clock.advance(1_000_000);
  sched.fire();
  assert.equal(landedCalls, 0, 'a single huge tick must not land the flight (delta must be capped)');
  assert.equal(sched.hasPending(), true, 'the loop must keep going after a capped tick');

  // Two more capped ticks (120ms each) finish the remaining ~180ms.
  clock.advance(120);
  sched.fire();
  clock.advance(120);
  sched.fire();
  assert.equal(landedCalls, 1, 'onLanded must fire exactly once once elapsed time reaches flyMs');

  player.destroy();
});

test('skip() lands immediately, fires onLanded once, and cancels the pending raf', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, rec } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();
  let landedCalls = 0;

  const player = createPlayer(canvas, {
    flyMs: 4200,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
    onLanded: () => { landedCalls++; },
  });

  player.play();
  assert.equal(sched.hasPending(), true);

  rec.reset();
  player.skip();
  assert.equal(sched.hasPending(), false, 'skip() must cancel the in-flight rAF');
  assert.equal(landedCalls, 1, 'skip() must fire onLanded exactly once');
  assert.equal(countClears(rec), 1, 'skip() paints exactly once');

  // A second skip (e.g. another trusted event slipping through) must be a no-op.
  player.skip();
  assert.equal(landedCalls, 1, 'onLanded must not fire again once landed');

  player.destroy();
});

test('destroy() cancels any pending rAF and leaves nothing scheduled', async () => {
  const { createPlayer } = await importDriver();
  const { canvas } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();

  const player = createPlayer(canvas, {
    flyMs: 4200,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
  });

  player.play();
  assert.equal(sched.hasPending(), true);

  player.destroy();
  assert.equal(sched.hasPending(), false, 'destroy() must cancel the pending raf');

  // The clock/scheduler must be fully quiescent: nothing left to fire.
  assert.throws(() => sched.fire(), /no pending raf callback/);
});

test('destroy() removes every skip listener it registered on canvas and parent', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, parent } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();

  const player = createPlayer(canvas, {
    flyMs: 4200,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
  });

  assert.ok(canvas._listenerCount('pointerdown') > 0);
  assert.ok(parent._listenerCount('wheel') > 0);

  player.destroy();

  assert.equal(canvas._listenerCount('pointerdown'), 0);
  assert.equal(canvas._listenerCount('keydown'), 0);
  assert.equal(canvas._listenerCount('wheel'), 0);
  assert.equal(parent._listenerCount('pointerdown'), 0);
  assert.equal(parent._listenerCount('keydown'), 0);
  assert.equal(parent._listenerCount('wheel'), 0);
});

test('a trusted pointerdown on the canvas skips straight to landed', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, rec } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();
  let landedCalls = 0;

  const player = createPlayer(canvas, {
    flyMs: 4200,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
    onLanded: () => { landedCalls++; },
  });

  player.play();
  rec.reset();
  canvas.dispatch('pointerdown', { isTrusted: true });

  assert.equal(landedCalls, 1, 'a trusted pointerdown must skip to landed');
  assert.equal(sched.hasPending(), false, 'skipping must cancel the in-flight rAF');

  player.destroy();
});

test('an untrusted (synthetic) event never triggers skip', async () => {
  const { createPlayer } = await importDriver();
  const { canvas } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();
  let landedCalls = 0;

  const player = createPlayer(canvas, {
    flyMs: 4200,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
    onLanded: () => { landedCalls++; },
  });

  player.play();
  canvas.dispatch('keydown', { isTrusted: false });

  assert.equal(landedCalls, 0, 'a synthetic event must not skip the flight');
  assert.equal(sched.hasPending(), true, 'the flight must keep running');

  player.destroy();
});

test('reducedMotion never animates: a single landed frame, canvas kept', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, rec } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();
  let landedCalls = 0;

  const player = createPlayer(canvas, {
    flyMs: 4200,
    reducedMotion: true,
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
    onLanded: () => { landedCalls++; },
  });

  assert.equal(landedCalls, 1, 'reducedMotion must land immediately');
  assert.equal(countClears(rec), 1, 'reducedMotion paints exactly one frame');
  assert.equal(sched.hasPending(), false, 'reducedMotion must never schedule a rAF loop');
  assert.ok(canvas.width > 0 && canvas.height > 0, 'the canvas must never be removed/zeroed');

  player.play(); // must stay a no-op
  assert.equal(sched.hasPending(), false);

  player.destroy();
});

test('setQ() repaints exactly once and does not touch the fly clock', async () => {
  const { createPlayer } = await importDriver();
  const { canvas, rec } = makeFakeCanvasAndParent(400, 300);
  const clock = makeClock(0);
  const sched = makeScheduler();

  const player = createPlayer(canvas, {
    flyMs: 4200,
    reducedMotion: true, // already landed, isolates setQ's own paint
    now: clock.now,
    raf: sched.raf,
    caf: sched.caf,
  });

  rec.reset();
  player.setQ(0.5);
  assert.equal(countClears(rec), 1, 'setQ() must paint exactly once');
  assert.equal(sched.hasPending(), false, 'setQ() must not start the rAF loop');

  player.destroy();
});
