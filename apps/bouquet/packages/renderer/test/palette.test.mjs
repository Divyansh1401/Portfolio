// palette.test.mjs — model.setPalette (core.js) and mixPalettes (palette.js).
// Neither exists in the reference loader; see CHANGES.md. This file owns
// only itself — it reads (never edits) ./oracle/recorder.mjs.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createModel } from '../src/core.js';
import { paint } from '../src/painter-canvas.js';
import { mixPalettes, mixHex } from '../src/palette.js';
import { makeRecorder } from './oracle/recorder.mjs';

const VP = { cssW: 1440, cssH: 900, dpr: 2 };
const LANDED = { p: 1, q: 0, yaw: 0 };

const DEFAULT_PALETTE_10 = [
  ['#C41E5A', '#981746', '#6F1133'],
  ['#7A1338', '#5F0E2B', '#450A1F'],
  ['#FB6F92', '#D15D7A', '#A94B62'],
  ['#9C455B', '#763444', '#522430'],
  ['#FFB3C6', '#DB9AAA', '#B8818F'],
  ['#9E6F7B', '#7D5861', '#5E4249'],
  ['#F1E6D6', '#D2C9BB', '#B5ACA0'],
  ['#5F8C30', '#4B6E26', '#39531D'],
  ['#3E6B25', '#2E4F1B', '#1E3512'],
  ['#8FBF4A', '#78A03E', '#628233'],
];

const SUNFLOWER_11 = [
  ['#E0A000', '#B38000', '#866000'],
  ['#5A3A12', '#48300F', '#37260C'],
  ['#F5C518', '#C49E13', '#93770E'],
  ['#5A3A12', '#48300F', '#37260C'],
  ['#FFD84D', '#CCAD3D', '#99822E'],
  ['#5A3A12', '#48300F', '#37260C'],
  ['#F1E6D6', '#D2C9BB', '#B5ACA0'],
  ['#5F8C30', '#4B6E26', '#39531D'],
  ['#3E6B25', '#2E4F1B', '#1E3512'],
  ['#8FBF4A', '#78A03E', '#628233'],
  ['#6B3F12', '#56320E', '#41260B'],
];

function paintRec(model) {
  const rec = makeRecorder();
  paint(rec.ctx, model.frame());
  return rec.ops;
}

function fillStylesOf(ops) {
  return ops.filter((o) => o[0] === 'fill').map((o) => o[1]);
}

function opShapesOf(ops) {
  // Everything except the fillStyle/strokeStyle string, so geometry can be
  // compared independently of colour.
  return ops.map((o) => {
    if (o[0] === 'fill') return ['fill', ...o.slice(2)];
    if (o[0] === 'stroke') return ['stroke', ...o.slice(2)];
    return o;
  });
}

test('setPalette() changes fillStyle strings but leaves geometry/op count untouched', () => {
  const model = createModel();
  model.layout(VP);
  model.set(LANDED);

  const before = paintRec(model);
  assert.ok(before.length > 0, 'sanity: the landed frame paints something');

  const changed = model.setPalette(SUNFLOWER_11);
  assert.equal(changed.length, 11);

  const after = paintRec(model);

  assert.equal(after.length, before.length, 'op count is unchanged by a palette swap');
  assert.deepStrictEqual(
    opShapesOf(after),
    opShapesOf(before),
    'every op\'s non-colour arguments (path coords, clear rect, alpha) are byte-identical',
  );

  const beforeFills = fillStylesOf(before);
  const afterFills = fillStylesOf(after);
  assert.equal(afterFills.length, beforeFills.length);
  let anyDifferent = false;
  for (let i = 0; i < beforeFills.length; i++) {
    if (beforeFills[i] !== afterFills[i]) anyDifferent = true;
  }
  assert.ok(anyDifferent, 'at least one fillStyle actually changed colour');
});

test('setPalette(default) restores the exact default op stream', () => {
  const fresh = createModel();
  fresh.layout(VP);
  fresh.set(LANDED);
  const freshOps = paintRec(fresh);

  const swapped = createModel();
  swapped.layout(VP);
  swapped.set(LANDED);
  swapped.setPalette(SUNFLOWER_11);
  swapped.setPalette(DEFAULT_PALETTE_10);
  const restoredOps = paintRec(swapped);

  assert.deepStrictEqual(restoredOps, freshOps);
});

test('setPalette() accepts a bare 10-triple palette (slot 10 defaults to a copy of slot 0)', () => {
  const model = createModel();
  model.layout(VP);
  model.set(LANDED);
  const restored = model.setPalette(DEFAULT_PALETTE_10);
  assert.equal(restored.length, 11);
  assert.deepStrictEqual(restored[10], restored[0]);
});

test('mixPalettes(a, b, 0) equals a and mixPalettes(a, b, 1) equals b', () => {
  const a = DEFAULT_PALETTE_10;
  const b = SUNFLOWER_11.slice(0, 10).concat([SUNFLOWER_11[10]]); // same 11 shape below
  const a11 = a.concat([a[0]]);

  assert.deepStrictEqual(mixPalettes(a11, SUNFLOWER_11, 0), a11);
  assert.deepStrictEqual(mixPalettes(a11, SUNFLOWER_11, 1), SUNFLOWER_11);
  void b;
});

test('mixPalettes(a, b, 0.5) is the per-channel midpoint of each triple', () => {
  assert.equal(mixHex('#000000', '#FFFFFF', 0.5), '#808080');
  const a = [['#000000', '#000000', '#000000']];
  const b = [['#FFFFFF', '#FFFFFF', '#FFFFFF']];
  assert.deepStrictEqual(mixPalettes(a, b, 0.5), [['#808080', '#808080', '#808080']]);
});

test('11-triple ribbon colour (slot 10) appears only on ribbon cubes, never on any other material', () => {
  // A slot-10 hue no other material shares, so its three SHADED tones
  // (frame.tone[10]) cannot collide with any of materials 0-9's own shaded
  // tones for the same frame.
  const palette = DEFAULT_PALETTE_10.slice();
  palette.push(['#3355FF', '#22409F', '#12245A']);

  const model = createModel({ palette });
  model.layout(VP);
  model.set(LANDED);
  const frame = model.frame();

  const ribbonTones = new Set(frame.tone[10]);
  const otherTones = new Set();
  for (let m = 0; m < 10; m++) for (const t of frame.tone[m]) otherTones.add(t);
  for (const t of ribbonTones) {
    assert.ok(!otherTones.has(t), `slot 10's shaded tone ${t} collides with a non-ribbon material`);
  }

  const ribbonCubeCount = Array.from(frame.pal.slice(0, frame.n)).filter((p) => p === 10).length;
  assert.ok(ribbonCubeCount > 0, 'some painted cubes are palette index 10 (the ribbon/bow/tails)');

  const ops = paintRec(model);
  const fills = new Set(fillStylesOf(ops));
  let sawRibbonTone = false;
  for (const t of ribbonTones) {
    if (fills.has(t)) sawRibbonTone = true;
  }
  assert.ok(sawRibbonTone, 'the ribbon/bow/tails actually painted with one of slot 10\'s shaded tones');

  // No fillStyle used anywhere in the frame is one of slot 10's tones unless
  // it came from a palette-index-10 cube: since every fillStyle is
  // frame.tone[frame.pal[k]][face], and ribbonTones never intersects
  // otherTones (checked above), any fill equal to a ribbon tone can only
  // have been produced by a pal===10 cube.
  for (const f of fills) {
    if (ribbonTones.has(f)) assert.ok(!otherTones.has(f));
  }
});
