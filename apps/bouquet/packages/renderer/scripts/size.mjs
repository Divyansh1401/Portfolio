#!/usr/bin/env node
// Size budget for the bundled renderer. See CONTRACT.md §5.

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const RENDERER_ROOT = path.resolve(path.dirname(__filename), '..');

/** Budget, in gzip bytes, for the bundled `src/index.js`. */
export const BUDGET_GZIP = 8000;

/**
 * Bundle `entry` (esm, minified, in memory) and measure its raw/gzip/brotli sizes.
 * @param {string} [entry] path relative to the renderer root, or absolute
 * @returns {Promise<{entry:string, minBytes:number, gzipBytes:number, brotliBytes:number, budget:number, ok:boolean}>}
 */
export async function measure(entry = 'src/index.js') {
  const entryPath = path.isAbsolute(entry) ? entry : path.resolve(RENDERER_ROOT, entry);

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'neutral',
    target: 'es2020',
    write: false,
  });

  const code = result.outputFiles[0].contents; // Uint8Array
  const buf = Buffer.from(code);
  const minBytes = buf.length;
  const gzipBytes = zlib.gzipSync(buf, { level: 9 }).length;
  const brotliBytes = zlib.brotliCompressSync(buf).length;

  return {
    entry: entryPath,
    minBytes,
    gzipBytes,
    brotliBytes,
    budget: BUDGET_GZIP,
    ok: gzipBytes <= BUDGET_GZIP,
  };
}

function isMain() {
  return import.meta.url === `file://${process.argv[1]}`;
}

if (isMain()) {
  const entryArg = process.argv[2];
  let result;
  try {
    result = await measure(entryArg);
  } catch (err) {
    console.error(`size: entry missing or failed to bundle: ${err && err.message ? err.message : err}`);
    process.exit(2);
  }

  console.log(JSON.stringify(result));

  if (!result.ok) {
    console.error(`size: over budget (${result.gzipBytes} > ${result.budget} gzip bytes)`);
    process.exit(1);
  }
  process.exit(0);
}
