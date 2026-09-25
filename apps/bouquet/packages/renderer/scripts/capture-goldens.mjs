#!/usr/bin/env node
// capture-goldens.mjs — sweeps VIEWPORTS x STATES against the reference
// renderer and writes small, human-diffable golden facts (hashes and
// counts, never full op streams) to
// packages/renderer/test/goldens/goldens.json.
//
// Usage:
//   node packages/renderer/scripts/capture-goldens.mjs           write goldens.json
//   node packages/renderer/scripts/capture-goldens.mjs --check   recompute and diff
//                                                                 against goldens.json,
//                                                                 exit 1 on any difference

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadReference } from '../test/oracle/load-reference.mjs';
import { VIEWPORTS, STATES, applyState } from '../test/oracle/matrix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = path.join(__dirname, '..', 'test', 'goldens');
const GOLDENS_PATH = path.join(GOLDENS_DIR, 'goldens.json');

const PATH_SAMPLE_INDICES = [0, 100, 500, 1000, 1288];
const PATH_SAMPLES = 32;

function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}

function opsHash(ops) {
  return sha256(JSON.stringify(ops));
}

/**
 * Runs the full viewport x state sweep against a fresh mount every time, and
 * returns the golden fact structure (hashes/counts only).
 */
export function captureGoldens() {
  const runs = [];

  for (const viewport of VIEWPORTS) {
    // Fresh mount per viewport, used for the per-viewport path()/cells()
    // facts (these are independent of dispersal state — path() reads the
    // flight build, cells() reads the model — but we still need a live api
    // and a landed draw for cells()/sets() counts).
    const { api: vApi } = loadReference(viewport);

    const paths = {};
    for (const i of PATH_SAMPLE_INDICES) {
      const p = vApi.path(i, PATH_SAMPLES);
      paths[i] = sha256(JSON.stringify(p));
    }

    vApi.setYaw(0);
    vApi.setP(1);
    vApi.setQ(0);
    const landedCellsCount = vApi.cells().length;

    for (const state of STATES) {
      // Fresh mount for every viewport x state combination, so each run is
      // isolated from any state left behind by a previous run.
      const { api, rec } = loadReference(viewport);
      applyState(api, state);
      rec.reset();
      api.draw();

      const ops = rec.ops;
      const fillCount = ops.filter((op) => op[0] === 'fill').length;

      runs.push({
        viewport: viewport.name,
        state: state.name,
        opsSha256: opsHash(ops),
        opCount: ops.length,
        fillCount,
        rendererState: api.state(),
        sets: api.sets(),
      });
    }

    runs.push({
      viewport: viewport.name,
      state: '__viewport_facts__',
      paths,
      landedCellsCount,
    });
  }

  return { generatedBy: 'capture-goldens.mjs', runs };
}

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

async function main() {
  const check = process.argv.includes('--check');
  const fresh = captureGoldens();

  if (!check) {
    mkdirSync(GOLDENS_DIR, { recursive: true });
    writeFileSync(GOLDENS_PATH, JSON.stringify(fresh, null, 2) + '\n');
    console.log(`Wrote ${GOLDENS_PATH} (${fresh.runs.length} runs)`);
    return;
  }

  if (!existsSync(GOLDENS_PATH)) {
    console.error(`--check: ${GOLDENS_PATH} does not exist. Run without --check first.`);
    process.exit(1);
  }
  const stored = JSON.parse(readFileSync(GOLDENS_PATH, 'utf8'));
  const diffs = diff(stored, fresh);
  if (diffs.length) {
    console.error(`--check: ${diffs.length} difference(s) from goldens.json:`);
    for (const d of diffs.slice(0, 50)) console.error(`  ${d}`);
    process.exit(1);
  }
  console.log('--check: goldens.json matches a fresh capture.');
}

// Only run main() when this file is the entry point (tests import
// captureGoldens() directly instead).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
