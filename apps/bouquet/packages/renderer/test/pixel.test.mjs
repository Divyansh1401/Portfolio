// pixel.test.mjs — headless-Chromium pixel oracle tests.
//
// 1. Reference vs itself (two separate mounts/canvases) must diff to zero
//    pixels across the whole matrix — this is the harness's own self-test.
// 2. Running the whole matrix in two SEPARATE Chromium launches must
//    produce identical refSha256 values per case — determinism on Linux.
// 3. If BQ_CANDIDATE names a module path, it is diffed against the
//    reference too and must also come back at zero pixels everywhere.
//
// This suite launches real headless Chromium (playwright-core) and can take
// a while — it is intentionally excluded from nothing, `npm test`'s glob
// picks it up along with every other suite under packages/renderer/test.

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pixelDiff } from './browser/pixel-harness.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const goldensPath = path.join(here, 'browser', 'pixel-goldens.json');

test('reference vs reference: zero pixel diff across the whole matrix', async () => {
  const results = await pixelDiff({ candidate: 'reference' });
  assert.ok(results.length > 0, 'MATRIX produced no cases to check');

  for (const r of results) {
    assert.equal(
      r.diffPixels,
      0,
      `viewport=${r.viewport} state=${r.state} diffPixels=${r.diffPixels} of ${r.width}x${r.height}`
    );
  }

  await writeFile(
    goldensPath,
    `${JSON.stringify(
      results.map((r) => ({ viewport: r.viewport, state: r.state, refSha256: r.refSha256 })),
      null,
      2
    )}\n`
  );
});

test('reference pixel hash is deterministic across two separate Chromium launches', async () => {
  const runA = await pixelDiff({ candidate: 'reference' });
  const runB = await pixelDiff({ candidate: 'reference' });

  assert.equal(runA.length, runB.length, 'matrix size changed between launches');
  for (let i = 0; i < runA.length; i++) {
    assert.equal(runA[i].viewport, runB[i].viewport);
    assert.equal(runA[i].state, runB[i].state);
    assert.equal(
      runA[i].refSha256,
      runB[i].refSha256,
      `viewport=${runA[i].viewport} state=${runA[i].state}: refSha256 differs across launches`
    );
  }
});

const candidatePath = process.env.BQ_CANDIDATE ? path.resolve(process.env.BQ_CANDIDATE) : null;

test(
  'candidate renderer (BQ_CANDIDATE) matches the reference pixel-for-pixel',
  { skip: candidatePath ? false : 'BQ_CANDIDATE env var not set' },
  async () => {
    const results = await pixelDiff({ candidate: candidatePath });
    assert.ok(results.length > 0, 'MATRIX produced no cases to check');
    for (const r of results) {
      assert.equal(
        r.diffPixels,
        0,
        `viewport=${r.viewport} state=${r.state} diffPixels=${r.diffPixels} of ${r.width}x${r.height}`
      );
    }
  }
);
