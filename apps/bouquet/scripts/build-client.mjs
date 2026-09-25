#!/usr/bin/env node
/**
 * @file Bundles every app/client/*.page.js entry to app/dist/<name>.js
 * with esbuild (esm, minified, sourcemapped, target es2022). Skips
 * gracefully (prints a note, exits 0) if no *.page.js entries exist yet.
 */

import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..', 'app');
const CLIENT_DIR = path.join(APP_DIR, 'client');
const DIST_DIR = path.join(APP_DIR, 'dist');

async function main() {
  let entries = [];
  try {
    const files = await readdir(CLIENT_DIR);
    entries = files.filter((f) => f.endsWith('.page.js'));
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    console.log('build-client: no *.page.js entries in app/client/ yet, skipping.');
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });

  for (const entry of entries) {
    const name = entry.replace(/\.page\.js$/, '');
    const entryPath = path.join(CLIENT_DIR, entry);
    const outPath = path.join(DIST_DIR, `${name}.js`);
    // eslint-disable-next-line no-await-in-loop
    await esbuild.build({
      entryPoints: [entryPath],
      outfile: outPath,
      bundle: true,
      format: 'esm',
      minify: true,
      sourcemap: true,
      target: 'es2022',
      logLevel: 'info',
    });
    console.log(`build-client: ${entry} -> dist/${name}.js`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
