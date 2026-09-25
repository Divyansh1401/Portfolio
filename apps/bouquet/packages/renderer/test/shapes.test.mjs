// shapes.test.mjs — SHAPES/SHAPE_IDS/DEFAULT_SHAPE (shapes.js). New product
// surface; none of this exists in the reference loader (see CHANGES.md).

import test from 'node:test';
import assert from 'node:assert/strict';

import { createModel } from '../src/core.js';
import { SHAPES, SHAPE_IDS, DEFAULT_SHAPE } from '../src/shapes.js';

const VP = { cssW: 390, cssH: 844, dpr: 1.5 };
const LANDED = { p: 1, q: 0, yaw: 0 };

test('SHAPE_IDS/DEFAULT_SHAPE line up with SHAPES', () => {
  assert.deepStrictEqual(SHAPE_IDS, ['full', 'posy', 'stem']);
  assert.ok(SHAPE_IDS.includes(DEFAULT_SHAPE));
  assert.equal(DEFAULT_SHAPE, 'full');
  for (const id of SHAPE_IDS) {
    assert.ok(id in SHAPES, `SHAPES has an entry for "${id}"`);
    assert.equal(typeof SHAPES[id], 'object');
  }
});

test('SHAPES.full is the built-in default (no override)', () => {
  assert.deepStrictEqual(SHAPES.full, {});
});

for (const id of SHAPE_IDS) {
  test(`SHAPES.${id} produces finite, non-empty, fully-onscreen landed geometry`, () => {
    const model = createModel({ params: SHAPES[id] });

    model.layout(VP);
    model.set(LANDED);

    const st = model.state();
    assert.ok(Number.isFinite(st.S) && st.S > 0, `state().S is a finite positive number, got ${st.S}`);
    assert.ok(st.N > 0, `state().N (surface cube count) is > 0, got ${st.N}`);

    const frame = model.frame();
    assert.ok(frame.n > 0, `frame().n is > 0, got ${frame.n}`);

    for (let k = 0; k < frame.n; k++) {
      assert.ok(Number.isFinite(frame.X[k]), `frame().X[${k}] is finite`);
      assert.ok(Number.isFinite(frame.Y[k]), `frame().Y[${k}] is finite`);
    }

    // Landed (p=1, q=0, yaw=0): every painted cube should read as onscreen —
    // no shape should be laid out so large, or so offset, that part of it
    // renders off the canvas at rest.
    assert.equal(
      frame.onscreen,
      frame.n,
      `landed shape "${id}" has ${frame.n - frame.onscreen} of ${frame.n} cubes off-canvas`,
    );
  });
}

test('each shape id round-trips through createModel({params}) -> model.params() unchanged keys', () => {
  for (const id of SHAPE_IDS) {
    const model = createModel({ params: SHAPES[id] });
    // {} (not null/undefined) is a no-op patch — see applyParamsPatch's
    // restore-on-null/undefined branch in core.js — so this reads back the
    // already-applied SHAPES[id] params without resetting to the built-ins.
    const p = model.params({}, VP);
    for (const [k, v] of Object.entries(SHAPES[id])) {
      assert.equal(p[k], v, `SHAPES.${id}.${k} was applied (got ${p[k]}, expected ${v})`);
    }
  }
});
