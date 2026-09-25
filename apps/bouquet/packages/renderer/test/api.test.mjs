// api.test.mjs — product API added on top of the parity-proven core, for
// W2a: model.relayout, model.setDpr, model.landed, and the
// assertPaintable/RendererUnavailableError paint guard. None of this exists
// in the reference loader (see CHANGES.md); parity.test.mjs stays the
// contract for everything that DOES.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createModel } from '../src/core.js';
import { assertPaintable } from '../src/painter-canvas.js';
import { RendererUnavailableError } from '../src/errors.js';

test('relayout() rebuilds flight so a resize mid-flight matches a fresh model at the new size', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });

  model.relayout({ cssW: 390, cssH: 844, dpr: 1.5 });
  model.set({ p: 0 });
  const frame = model.frame();

  const fresh = createModel();
  fresh.layout({ cssW: 390, cssH: 844, dpr: 1.5 });
  fresh.set({ p: 0 });
  const freshFrame = fresh.frame();

  assert.equal(frame.onscreen, freshFrame.onscreen);
  // Not literally 0 (a handful of cubes near the pivot can already be
  // onscreen at p=0 even for a freshly-laid-out model), but tiny — nothing
  // like the ~982 the bug report measured for a stale-flight resize onto a
  // much smaller canvas.
  assert.ok(frame.onscreen < 20, `expected a small onscreen count, got ${frame.onscreen}`);
});

// At the driver's real fly-in start pose (p=0, yaw=yawIn=-540) a correctly
// laid-out model has NOTHING onscreen. After a resize, relayout() must keep
// that true, whereas a second layout() (stale flight geometry) does not.
for (const [from, to] of [
  [{ cssW: 1440, cssH: 900, dpr: 2 }, { cssW: 390, cssH: 844, dpr: 1.5 }],
  [{ cssW: 390, cssH: 844, dpr: 1.5 }, { cssW: 1440, cssH: 900, dpr: 2 }],
]) {
  test(`relayout() ${from.cssW}x${from.cssH} -> ${to.cssW}x${to.cssH}: onscreen is 0 at p=0 (start pose)`, () => {
    const model = createModel();
    model.layout(from);
    model.relayout(to);
    model.set({ p: 0, q: 0, yaw: -540 });
    assert.equal(model.frame().onscreen, 0);

    const stale = createModel();
    stale.layout(from);
    stale.layout(to);
    stale.set({ p: 0, q: 0, yaw: -540 });
    assert.ok(stale.frame().onscreen > 0, 'control: layout() twice reuses stale flight geometry');
  });
}

test('relayout() applies the new viewport size (width/height/dpr)', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  const dims = model.relayout({ cssW: 390, cssH: 844, dpr: 1.5 });

  assert.equal(dims.dpr, 1.5);
  assert.equal(dims.width, Math.round(390 * 1.5));
  assert.equal(dims.height, Math.round(844 * 1.5));
  assert.equal(model.state().width, dims.width);
  assert.equal(model.state().height, dims.height);
});

test('relayout() requires no prior layout() call (bootstraps laidOut like layout())', () => {
  const model = createModel();
  assert.doesNotThrow(() => model.relayout({ cssW: 1440, cssH: 900, dpr: 2 }));
  assert.doesNotThrow(() => model.frame());
});

test('setDpr() caps the device pixel ratio at 2', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 1 });
  const dims = model.setDpr(3);
  assert.equal(dims.dpr, 2);
  assert.equal(dims.width, 1440 * 2);
  assert.equal(dims.height, 900 * 2);
});

test('setDpr() keeps the current cssW/cssH from the last layout/relayout', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.relayout({ cssW: 390, cssH: 844, dpr: 1.5 });
  const dims = model.setDpr(2);
  assert.equal(dims.width, 390 * 2);
  assert.equal(dims.height, 844 * 2);
});

test('setDpr() before any layout() throws', () => {
  const model = createModel();
  assert.throws(() => model.setDpr(2), /layout\(\) must be called first/);
});

test('landed() is false before flight/dispersal completes', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.set({ p: 0, q: 0 });
  assert.equal(model.landed(), false);
});

test('landed() is true once p>=1 and q<=0', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.set({ p: 1, q: 0 });
  assert.equal(model.landed(), true);
});

test('landed() is false while dispersed (p>=1 but q>0)', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.set({ p: 1, q: 0.5 });
  assert.equal(model.landed(), false);
});

test('landed() goes back to true once dispersal fully retracts (q back to 0)', () => {
  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.set({ p: 1, q: 0.5 });
  assert.equal(model.landed(), false);
  model.set({ q: 0 });
  assert.equal(model.landed(), true);
});

test('assertPaintable throws RendererUnavailableError for a null context', () => {
  const canvas = { width: 100, height: 100 };
  assert.throws(() => assertPaintable(canvas, null), RendererUnavailableError);
});

test('assertPaintable throws RendererUnavailableError for an undefined context', () => {
  const canvas = { width: 100, height: 100 };
  assert.throws(() => assertPaintable(canvas, undefined), RendererUnavailableError);
});

test('assertPaintable throws RendererUnavailableError for a 0x0 canvas, even with a real ctx', () => {
  const canvas = { width: 0, height: 0 };
  const ctx = {};
  assert.throws(() => assertPaintable(canvas, ctx), RendererUnavailableError);
});

test('assertPaintable throws for a canvas with zero width only', () => {
  const canvas = { width: 0, height: 100 };
  const ctx = {};
  assert.throws(() => assertPaintable(canvas, ctx), RendererUnavailableError);
});

test('assertPaintable throws for a canvas with zero height only', () => {
  const canvas = { width: 100, height: 0 };
  const ctx = {};
  assert.throws(() => assertPaintable(canvas, ctx), RendererUnavailableError);
});

test('assertPaintable does not throw for a nonzero canvas and a real ctx', () => {
  const canvas = { width: 100, height: 100 };
  const ctx = {};
  assert.doesNotThrow(() => assertPaintable(canvas, ctx));
});

test('RendererUnavailableError is a proper Error subclass with the right name', () => {
  const err = new RendererUnavailableError('nope');
  assert.ok(err instanceof Error);
  assert.ok(err instanceof RendererUnavailableError);
  assert.equal(err.name, 'RendererUnavailableError');
  assert.equal(err.message, 'nope');
});

test('compat.js resize() still calls model.layout(), not relayout() (guards parity)', async () => {
  // relayout/setDpr are new entry points alongside layout(); compat.js's
  // resize() must keep calling layout() so compat.mount()'s behaviour (and
  // parity.test.mjs, which is pinned to it) is untouched by W2a. This reads
  // the source rather than the compiled function since "does it call
  // relayout instead" isn't observable from mount()'s public surface alone.
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const compatPath = fileURLToPath(new URL('../src/compat.js', import.meta.url));
  const src = readFileSync(compatPath, 'utf8');
  const resizeFn = src.slice(src.indexOf('resize:'), src.indexOf('resize:') + 300);
  assert.match(resizeFn, /model\.layout\(/);
  assert.doesNotMatch(resizeFn, /model\.relayout\(/);
});
