// pixel-candidate.test.mjs — pixel parity between the reference loader and
// src/index.js (the wave-1 bundle), via the browser pixel harness. Per
// CONTRACT.md §6 "W1b details": never edit test/browser/pixel-harness.mjs;
// bundle src/index.js to a single self-contained ESM file first, because the
// harness serves a candidate at one static URL and relative imports 404.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pixelDiff, MATRIX } from './browser/pixel-harness.mjs';
import { VIEWPORTS, STATES } from './oracle/matrix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.join(__dirname, '..', 'src', 'index.js');

const GENEROUS_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Resolves the candidate module path per CONTRACT.md §6: BQ_CANDIDATE when
 * set (already a single self-contained ESM file), otherwise an esbuild
 * bundle of src/index.js written to a temp file.
 * @returns {Promise<{candidatePath: string, cleanup: () => Promise<void>}>}
 */
async function resolveCandidate() {
  if (process.env.BQ_CANDIDATE) {
    const candidatePath = path.resolve(process.env.BQ_CANDIDATE);
    return { candidatePath, cleanup: async () => {} };
  }

  if (!existsSync(INDEX_PATH)) {
    throw new Error(
      `missing ${INDEX_PATH} — this suite depends on W1a's unlanded src/index.js ` +
        `(or set BQ_CANDIDATE to a pre-bundled single-file ESM module)`
    );
  }

  const esbuild = await import('esbuild');
  const dir = await mkdtemp(path.join(tmpdir(), 'bq-candidate-'));
  const outfile = path.join(dir, 'candidate.mjs');

  await esbuild.build({
    entryPoints: [INDEX_PATH],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: false,
  });

  return {
    candidatePath: outfile,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

function assertAllZero(results, label) {
  assert.ok(results.length > 0, `${label}: produced no cases to check`);
  for (const r of results) {
    assert.equal(
      r.diffPixels,
      0,
      `${label}: viewport=${r.viewport} state=${r.state} diffPixels=${r.diffPixels} of ${r.width}x${r.height}`
    );
  }
}

test(
  'candidate (src/index.js) matches the reference pixel-for-pixel, over the harness MATRIX and the oracle VIEWPORTS x STATES',
  { timeout: GENEROUS_TIMEOUT_MS },
  async () => {
    const { candidatePath, cleanup } = await resolveCandidate();
    // Snapshot MATRIX's original contents so it can be restored exactly,
    // since it is a `const` array mutated in place, not reassigned.
    const originalMatrix = MATRIX.slice();

    try {
      const harnessResults = await pixelDiff({ candidate: candidatePath });
      assertAllZero(harnessResults, 'harness MATRIX');

      /** @type {Array<{viewport: object, state: object}>} */
      const oracleCases = [];
      for (const viewport of VIEWPORTS) {
        for (const state of STATES) {
          oracleCases.push({
            viewport: { name: viewport.name, cssW: viewport.cssW, cssH: viewport.cssH, dpr: viewport.dpr },
            state,
          });
        }
      }

      MATRIX.splice(0, MATRIX.length, ...oracleCases);
      const oracleResults = await pixelDiff({ candidate: candidatePath });
      assertAllZero(oracleResults, 'oracle VIEWPORTS x STATES');
    } finally {
      MATRIX.splice(0, MATRIX.length, ...originalMatrix);
      await cleanup();
    }
  }
);
