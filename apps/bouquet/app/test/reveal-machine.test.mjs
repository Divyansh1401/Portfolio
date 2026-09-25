import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRevealMachine } from '../client/reveal-machine.js';

/** A controllable fake clock: now() reads the current value, advance(ms) moves it forward. */
function makeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      t += ms;
      return t;
    },
    get t() {
      return t;
    },
  };
}

function tick(machine, clock, ms) {
  clock.advance(ms);
  return machine.send({ type: 'tick', t: clock.t });
}

test('initial state is fly, q=0, skipFly=false', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  const s = machine.getState();
  assert.equal(s.phase, 'fly');
  assert.equal(s.q, 0);
  assert.equal(s.skipFly, false);
});

test('flyDone lands normally without setting skipFly', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  const s = machine.send({ type: 'flyDone' });
  assert.equal(s.phase, 'landed');
  assert.equal(s.skipFly, false);
  assert.equal(s.q, 0);
});

test('skip-fly: pointerdown during fly lands and sets skipFly, and does NOT start a hold', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  const s = machine.send({ type: 'pointerdown', id: 1 });
  assert.equal(s.phase, 'landed');
  assert.equal(s.skipFly, true);
  assert.equal(s.q, 0);

  // Because the pointerdown was consumed as the skip trigger, this same
  // pointer id did NOT start a hold: a pointerup for it should be a no-op,
  // and ticking should not accumulate any hold time.
  const afterUp = machine.send({ type: 'pointerup', id: 1 });
  assert.equal(afterUp.phase, 'landed');
  const afterTick = tick(machine, clock, 900);
  assert.equal(afterTick.phase, 'landed');
  assert.equal(afterTick.q, 0);
});

test('skip-fly: wheel/key/open during fly also just land (no q bump from that same event)', () => {
  for (const event of [{ type: 'wheel', dy: 1000 }, { type: 'key', key: 'ArrowDown' }, { type: 'open' }]) {
    const clock = makeClock();
    const machine = createRevealMachine({ now: clock.now });
    const s = machine.send(event);
    assert.equal(s.phase, 'landed', `phase after ${event.type}`);
    assert.equal(s.skipFly, true, `skipFly after ${event.type}`);
    assert.equal(s.q, 0, `q after ${event.type}`);
  }
});

test('hold 900ms drives q to ~1 and reveals', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  machine.send({ type: 'pointerdown', id: 1 });

  let s = tick(machine, clock, 450);
  assert.equal(s.phase, 'holding');
  assert.ok(Math.abs(s.q - 0.5) < 0.02, `q should be ~0.5, got ${s.q}`);

  s = tick(machine, clock, 450);
  assert.ok(Math.abs(s.q - 1) < 0.02, `q should be ~1, got ${s.q}`);
  assert.equal(s.phase, 'revealed');
});

test('release below 0.5 springs back to 0 over time, without bursting', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  machine.send({ type: 'pointerdown', id: 1 });
  let s = tick(machine, clock, 200); // q ~ 0.222, below 0.5
  assert.ok(s.q < 0.5);
  const qAtRelease = s.q;

  s = machine.send({ type: 'pointerup', id: 1 });
  assert.equal(s.phase, 'landed');
  assert.equal(s.q, qAtRelease); // no jump at the instant of release

  // Partway through the spring, q should have decreased but not hit 0 yet.
  s = tick(machine, clock, 50);
  assert.equal(s.phase, 'landed');
  assert.ok(s.q < qAtRelease && s.q > 0, `q mid-spring: ${s.q}`);

  // Long enough for the spring to finish.
  s = tick(machine, clock, 1000);
  assert.equal(s.phase, 'landed');
  assert.equal(s.q, 0);
});

test('drag up > 12px switches holding -> scrubbing and q follows the drag', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  machine.send({ type: 'pointerdown', id: 1 });

  // Small move stays in 'holding'.
  let s = machine.send({ type: 'pointermove', id: 1, dy: -8 });
  assert.equal(s.phase, 'holding');

  // Crossing the 12px threshold (upward, dy negative) switches to scrubbing
  // with no jump in q.
  s = machine.send({ type: 'pointermove', id: 1, dy: -20 });
  assert.equal(s.phase, 'scrubbing');
  assert.ok(Math.abs(s.q - 0) < 1e-9, `q should be unchanged at the switch instant, got ${s.q}`);

  // Dragging further up increases q (up = open).
  const before = s.q;
  s = machine.send({ type: 'pointermove', id: 1, dy: -100 });
  assert.equal(s.phase, 'scrubbing');
  assert.ok(s.q > before, `q should increase as the drag continues up: ${before} -> ${s.q}`);

  // Dragging back down decreases q again.
  const higher = s.q;
  s = machine.send({ type: 'pointermove', id: 1, dy: -20 });
  assert.ok(s.q < higher, `q should decrease when dragging back down: ${higher} -> ${s.q}`);
});

test('release from scrubbing at q >= 0.5 bursts to revealed over ~600ms', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  machine.send({ type: 'pointerdown', id: 1 });
  machine.send({ type: 'pointermove', id: 1, dy: -20 }); // enters scrubbing, q=0
  let s = machine.send({ type: 'pointermove', id: 1, dy: -140 }); // drag up, but not all the way to reveal
  assert.equal(s.phase, 'scrubbing');
  assert.ok(s.q >= 0.5 && s.q < 1, `expected 0.5 <= q < 1 before release, got ${s.q}`);

  s = machine.send({ type: 'pointerup', id: 1 });
  assert.equal(s.phase, 'bursting');

  s = tick(machine, clock, 300);
  assert.equal(s.phase, 'bursting');
  assert.ok(s.q > 0.5 && s.q < 1.2, `mid-burst q: ${s.q}`);

  s = tick(machine, clock, 400); // total 700ms > 600ms burst duration
  assert.equal(s.phase, 'revealed');
});

test('wheel accumulates q and can reveal on its own', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });

  let s = machine.send({ type: 'wheel', dy: 60 });
  assert.equal(s.phase, 'landed');
  assert.ok(s.q > 0 && s.q < 1, `q after one wheel tick: ${s.q}`);

  for (let i = 0; i < 10 && s.phase !== 'revealed'; i++) {
    s = machine.send({ type: 'wheel', dy: 60 });
  }
  assert.equal(s.phase, 'revealed');
});

test('key: ArrowDown/PageDown/Space add to q; other keys are ignored', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });

  let s = machine.send({ type: 'key', key: 'a' });
  assert.equal(s.q, 0, 'unrelated key must not move q');

  s = machine.send({ type: 'key', key: 'ArrowDown' });
  const afterOne = s.q;
  assert.ok(afterOne > 0);

  s = machine.send({ type: 'key', key: 'PageDown' });
  assert.ok(s.q > afterOne);

  s = machine.send({ type: 'key', key: ' ' });
  assert.ok(s.q > afterOne);
});

test('open button bursts straight to revealed from landed', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });

  let s = machine.send({ type: 'open' });
  assert.equal(s.phase, 'bursting');
  assert.equal(s.q, 0);

  s = tick(machine, clock, 700);
  assert.equal(s.phase, 'revealed');
});

test('pointercancel behaves exactly like a release (burst or spring depending on q)', () => {
  // Case 1: cancel with q >= 0.5 -> bursts.
  {
    const clock = makeClock();
    const machine = createRevealMachine({ now: clock.now });
    machine.send({ type: 'flyDone' });
    machine.send({ type: 'pointerdown', id: 1 });
    let s = tick(machine, clock, 600); // q ~0.667
    assert.ok(s.q >= 0.5);
    s = machine.send({ type: 'pointercancel' });
    assert.equal(s.phase, 'bursting');
  }

  // Case 2: cancel with q < 0.5 -> springs back.
  {
    const clock = makeClock();
    const machine = createRevealMachine({ now: clock.now });
    machine.send({ type: 'flyDone' });
    machine.send({ type: 'pointerdown', id: 1 });
    let s = tick(machine, clock, 100); // q ~0.111
    assert.ok(s.q < 0.5);
    s = machine.send({ type: 'pointercancel' });
    assert.equal(s.phase, 'landed');
    s = tick(machine, clock, 1000);
    assert.equal(s.q, 0);
  }
});

test('revealed is terminal: further events and ticks are ignored', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  machine.send({ type: 'open' });
  let s = tick(machine, clock, 700);
  assert.equal(s.phase, 'revealed');
  const revealedQ = s.q;

  s = machine.send({ type: 'pointerdown', id: 99 });
  assert.equal(s.phase, 'revealed');
  assert.equal(s.q, revealedQ);

  s = machine.send({ type: 'wheel', dy: 500 });
  assert.equal(s.phase, 'revealed');

  s = tick(machine, clock, 5000);
  assert.equal(s.phase, 'revealed');
  assert.equal(s.q, revealedQ);
});

test('burst keeps advancing q past the revealed latch until it reaches 1.2 over 600ms', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });

  let s = machine.send({ type: 'open' }); // bursts from q=0
  assert.equal(s.phase, 'bursting');

  // q crosses 1 partway through (1 / 1.2 of the way, i.e. 500ms in), well
  // before 600ms: phase latches to 'revealed' but the burst must keep
  // running.
  s = tick(machine, clock, 550);
  assert.equal(s.phase, 'revealed');
  assert.ok(s.q < 1.2, `q should still be mid-burst, got ${s.q}`);
  assert.ok(s.q > 1, `q should already be past the reveal threshold, got ${s.q}`);

  // Tick the remaining time to complete the full 600ms burst.
  s = tick(machine, clock, 50);
  assert.equal(s.phase, 'revealed');
  assert.ok(Math.abs(s.q - 1.2) < 1e-9, `q should finish at exactly 1.2, got ${s.q}`);

  // Further ticks past the burst's end are a genuine no-op.
  s = tick(machine, clock, 1000);
  assert.equal(s.phase, 'revealed');
  assert.equal(s.q, 1.2);
});

test('multiple pointers: a second pointerdown while one is active is ignored', () => {
  const clock = makeClock();
  const machine = createRevealMachine({ now: clock.now });
  machine.send({ type: 'flyDone' });
  let s = machine.send({ type: 'pointerdown', id: 1 });
  assert.equal(s.phase, 'holding');

  s = machine.send({ type: 'pointerdown', id: 2 });
  assert.equal(s.phase, 'holding'); // unchanged, second pointer ignored

  // Moves from the ignored pointer id do nothing.
  s = machine.send({ type: 'pointermove', id: 2, dy: -100 });
  assert.equal(s.phase, 'holding');
  assert.equal(s.q, 0);

  // A pointerup from the ignored pointer id does not release the real hold.
  s = machine.send({ type: 'pointerup', id: 2 });
  assert.equal(s.phase, 'holding');

  // The real pointer id still works.
  s = tick(machine, clock, 500);
  assert.ok(s.q > 0);
  s = machine.send({ type: 'pointerup', id: 1 });
  assert.ok(s.phase === 'bursting' || s.phase === 'landed');
});
