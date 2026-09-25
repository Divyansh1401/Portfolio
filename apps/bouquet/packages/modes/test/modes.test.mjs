import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODES,
  MODE_IDS,
  DEFAULT_MODE,
  getMode,
  triple,
  paletteFor,
  REFERENCE_PALETTE,
} from '../modes.js';
import { lintModes } from '../lint-modes.mjs';

const HEX6_RE = /^#[0-9A-F]{6}$/;

test('lintModes(MODES) returns no failures', () => {
  const failures = lintModes(MODES);
  assert.deepEqual(failures, []);
});

test('MODES has exactly 5 modes in contract order', () => {
  assert.equal(MODES.length, 5);
  assert.deepEqual(
    MODES.map((m) => m.id),
    ['rose', 'sunflower', 'lavender', 'marigold', 'hydrangea']
  );
  assert.deepEqual(MODE_IDS, MODES.map((m) => m.id));
});

test('DEFAULT_MODE is rose', () => {
  assert.equal(DEFAULT_MODE, 'rose');
});

test('every mode has the contract shape', () => {
  const bouquetKeys = ['petals', 'centres', 'ribbon'];
  const uiKeys = ['ground', 'surface', 'ink', 'muted', 'accent', 'onAccent', 'focus', 'border'];
  for (const mode of MODES) {
    assert.equal(typeof mode.id, 'string');
    assert.equal(typeof mode.name, 'string');
    assert.ok(mode.bouquet && typeof mode.bouquet === 'object');
    assert.ok(mode.ui && typeof mode.ui === 'object');
    for (const k of bouquetKeys) assert.ok(k in mode.bouquet, `${mode.id}.bouquet.${k}`);
    for (const k of uiKeys) assert.ok(k in mode.ui, `${mode.id}.ui.${k}`);
    assert.equal(mode.bouquet.petals.length, 3);
    assert.equal(mode.bouquet.centres.length, 3);
    for (const hex of [...mode.bouquet.petals, ...mode.bouquet.centres, mode.bouquet.ribbon]) {
      assert.match(hex, HEX6_RE, `${mode.id} bouquet hex ${hex}`);
    }
    for (const k of uiKeys) {
      assert.match(mode.ui[k], HEX6_RE, `${mode.id} ui.${k} ${mode.ui[k]}`);
    }
  }
});

test('getMode returns the mode by id and falls back to rose', () => {
  assert.equal(getMode('sunflower').id, 'sunflower');
  assert.equal(getMode('does-not-exist').id, 'rose');
  assert.equal(getMode(undefined).id, 'rose');
});

test('triple() multiplies per-channel by 1, 0.78, 0.56 and rounds', () => {
  assert.deepEqual(triple('#FFFFFF'), ['#FFFFFF', '#C7C7C7', '#8F8F8F']);
  assert.deepEqual(triple('#000000'), ['#000000', '#000000', '#000000']);
  // Round-trip: every produced hex is valid uppercase '#rrggbb'.
  for (const mode of MODES) {
    for (const hex of [...mode.bouquet.petals, ...mode.bouquet.centres, mode.bouquet.ribbon]) {
      for (const t of triple(hex)) assert.match(t, HEX6_RE);
    }
  }
});

test('paletteFor returns 11 triples for every mode', () => {
  for (const mode of MODES) {
    const palette = paletteFor(mode);
    assert.equal(palette.length, 11);
    for (const t of palette) {
      assert.equal(t.length, 3);
      for (const hex of t) assert.match(hex, HEX6_RE);
    }
  }
});

test('paletteFor accepts a mode id string as well as a mode object', () => {
  assert.deepEqual(paletteFor('rose'), paletteFor(getMode('rose')));
});

test("paletteFor('rose') slots 0-9 deep-equal the reference loader palette, slot 10 copies slot 0", () => {
  const rose = paletteFor('rose');
  for (let i = 0; i < 10; i++) {
    assert.deepEqual(rose[i], REFERENCE_PALETTE[i], `slot ${i}`);
  }
  assert.deepEqual(rose[10], REFERENCE_PALETTE[0]);
  assert.notStrictEqual(rose[10], REFERENCE_PALETTE[0], 'slot 10 must be a copy, not the same array reference');
});

test('non-rose palettes are not aliased to REFERENCE_PALETTE', () => {
  const sunflower = paletteFor('sunflower');
  assert.notDeepEqual(sunflower[0], REFERENCE_PALETTE[0]);
});
