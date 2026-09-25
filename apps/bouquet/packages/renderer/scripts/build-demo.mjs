#!/usr/bin/env node
// build-demo.mjs — bundles demo/main.js with esbuild and inlines the result
// into demo/src.html's bundle marker, writing a single self-contained
// demo/dist/playground.html. No external requests at load: no CDN scripts,
// no web fonts, no separate .js/.css files next to the output.
//
// Usage: node packages/renderer/scripts/build-demo.mjs

import esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_DIR = path.join(__dirname, '..');
const DEMO_DIR = path.join(RENDERER_DIR, 'demo');
const ENTRY = path.join(DEMO_DIR, 'main.js');
const SRC_HTML = path.join(DEMO_DIR, 'src.html');
const OUT_DIR = path.join(DEMO_DIR, 'dist');
const OUT_HTML = path.join(OUT_DIR, 'playground.html');

const MARKER = '<!--BOUQUET_DEMO_BUNDLE-->';

async function main() {
  const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
  });

  const jsFile = result.outputFiles.find((f) => f.path.endsWith('.js') || f.path === '<stdout>');
  if (!jsFile) {
    throw new Error('build-demo: esbuild produced no JS output');
  }
  // Guard against a stray "</script" inside the bundle prematurely closing
  // the inline <script> tag.
  const code = jsFile.text.replace(/<\/(script)/gi, '<\\/$1');

  const html = readFileSync(SRC_HTML, 'utf8');
  if (!html.includes(MARKER)) {
    throw new Error(`build-demo: marker ${MARKER} not found in ${SRC_HTML}`);
  }
  const out = html.replace(MARKER, () => `<script>\n${code}\n</script>`); // fn replacer: no $-pattern expansion

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, out, 'utf8');

  const bytes = Buffer.byteLength(out, 'utf8');
  console.log(`build-demo: wrote ${path.relative(process.cwd(), OUT_HTML)} (${bytes} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
