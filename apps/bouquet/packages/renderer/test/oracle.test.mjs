import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadReference } from './oracle/load-reference.mjs';
import { VIEWPORTS, STATES, applyState } from './oracle/matrix.mjs';
import { captureGoldens } from '../scripts/capture-goldens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS_PATH = path.join(__dirname, 'goldens', 'goldens.json');

function diff(expected, actual, prefix = '') {
  const diffs = [];
  if (expected === null || typeof expected !== 'object') {
    if (expected !== actual) diffs.push(`${prefix}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    return diffs;
  }
  if (actual === null || typeof actual !== 'object') {
    diffs.push(`${prefix}: expected object, got ${JSON.stringify(actual)}`);
    return diffs;
  }
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of keys) {
    diffs.push(...diff(expected[key], actual[key], prefix ? `${prefix}.${key}` : key));
  }
  return diffs;
}

test('goldens.json exists', () => {
  assert.ok(existsSync(GOLDENS_PATH), `${GOLDENS_PATH} is missing — run npm run goldens`);
});

test('a fresh capture matches goldens.json (--check logic)', () => {
  const stored = JSON.parse(readFileSync(GOLDENS_PATH, 'utf8'));
  const fresh = captureGoldens();
  const diffs = diff(stored, fresh);
  assert.deepEqual(diffs, [], `goldens drifted:\n${diffs.slice(0, 20).join('\n')}`);
});

test('determinism: two fresh mounts of the same viewport/state produce identical op arrays', () => {
  const viewport = VIEWPORTS.find((v) => v.name === 'desktop');
  for (const state of STATES) {
    const run1 = loadReference(viewport);
    applyState(run1.api, state);
    run1.rec.reset();
    run1.api.draw();

    const run2 = loadReference(viewport);
    applyState(run2.api, state);
    run2.rec.reset();
    run2.api.draw();

    assert.deepEqual(run1.rec.ops, run2.rec.ops, `ops differ between two fresh mounts for state ${state.name}`);
  }
});

test('sets() at desktop matches known facts', () => {
  const { api } = loadReference({ cssW: 1440, cssH: 900, dpr: 2 });
  // api.sets() is an object literal created inside the vm sandbox's own
  // realm, so it carries that realm's Object.prototype rather than this
  // module's — copy its own enumerable props into a plain host object
  // before a strict deepEqual, which also compares prototypes.
  assert.deepEqual({ ...api.sets() }, { all: 3259, surface: 1289, visible: 602 });
});

test('landed desktop draws 602 cubes', () => {
  const { api, rec } = loadReference({ cssW: 1440, cssH: 900, dpr: 2 });
  api.setYaw(0);
  api.setP(1);
  api.setQ(0);
  rec.reset();
  api.draw();
  assert.equal(api.state().drawn, 602);
});
