import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PINNED_SHA256 =
  'dd391b5ede0c39d5878621733ecb3b583bd786da656160921b6241445e6bae01';

const here = path.dirname(fileURLToPath(import.meta.url));
const refPath = path.join(here, '..', 'reference', 'bouquet-loader.ref.js');

/** @param {string} filePath */
async function sha256Of(filePath) {
  const buf = await readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

test('reference copy hash matches the pinned hash', async () => {
  const actual = await sha256Of(refPath);
  assert.equal(
    actual,
    PINNED_SHA256,
    'apps/bouquet/packages/renderer/reference/bouquet-loader.ref.js has drifted ' +
      'from the pinned reference hash — it must never be hand-edited; re-vendor ' +
      'deliberately from assets/js/bouquet-loader.js and update PROVENANCE.md ' +
      'plus this pinned hash together, then re-capture goldens.'
  );
});

test('portfolio loader drift check (optional, non-fatal)', async () => {
  // This is the one intentionally allowed read outside apps/bouquet: it only
  // *compares* against the live portfolio loader to warn on drift. It never
  // fails the suite and nothing under apps/bouquet imports this path at
  // runtime.
  const portfolioLoaderPath = path.join(
    here,
    '..',
    '..',
    '..',
    '..',
    '..',
    'assets',
    'js',
    'bouquet-loader.js'
  );

  let portfolioBuf;
  try {
    portfolioBuf = await readFile(portfolioLoaderPath);
  } catch {
    // Portfolio loader isn't present in this checkout (e.g. a sparse or
    // isolated apps/bouquet-only checkout) — nothing to compare, skip quietly.
    return;
  }

  const portfolioHash = createHash('sha256').update(portfolioBuf).digest('hex');
  if (portfolioHash !== PINNED_SHA256) {
    console.warn('portfolio loader drifted from the pinned reference');
  }
});
