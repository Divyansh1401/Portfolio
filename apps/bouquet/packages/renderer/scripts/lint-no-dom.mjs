#!/usr/bin/env node
// No-DOM lint for src/core.js and src/painter-canvas.js.
// See CONTRACT.md §5.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Identifiers that must never appear (as whole words) in the DOM-free files. */
export const FORBIDDEN = [
  'window', 'document', 'globalThis', 'self',
  'navigator', 'devicePixelRatio', 'innerWidth', 'innerHeight',
  'clientWidth', 'clientHeight', 'parentNode', 'getContext',
  'requestAnimationFrame', 'cancelAnimationFrame', 'performance',
  'setTimeout', 'setInterval', 'localStorage', 'sessionStorage',
  'matchMedia', 'addEventListener', 'HTMLCanvasElement',
  'OffscreenCanvas', 'Image', 'fetch', 'Date',
];

const __filename = fileURLToPath(import.meta.url);
const RENDERER_ROOT = path.resolve(path.dirname(__filename), '..');
const DEFAULT_TARGETS = ['src/core.js', 'src/painter-canvas.js'];

/**
 * Strip `//` and `/* *\/` comments plus '...', "..." and `...` string/template
 * literals from a source string, replacing each stripped span with spaces of
 * the same length (so line numbers and column offsets are preserved).
 * @param {string} source
 * @returns {string}
 */
function stripCommentsAndStrings(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const c2 = source[i + 1];

    // Line comment
    if (c === '/' && c2 === '/') {
      let j = i;
      while (j < n && source[j] !== '\n') j++;
      out += ' '.repeat(j - i);
      i = j;
      continue;
    }

    // Block comment
    if (c === '/' && c2 === '*') {
      let j = i + 2;
      while (j < n && !(source[j] === '*' && source[j + 1] === '/')) j++;
      j = Math.min(j + 2, n);
      // preserve newlines inside the comment so line numbers stay correct
      for (let k = i; k < j; k++) out += source[k] === '\n' ? '\n' : ' ';
      i = j;
      continue;
    }

    // String / template literals
    if (c === '\'' || c === '"' || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < n && source[j] !== quote) {
        if (source[j] === '\\') {
          j += 2;
        } else {
          j++;
        }
      }
      j = Math.min(j + 1, n);
      for (let k = i; k < j; k++) out += source[k] === '\n' ? '\n' : ' ';
      i = j;
      continue;
    }

    out += c;
    i++;
  }
  return out;
}

const IDENT_RE = new RegExp('\\b(' + FORBIDDEN.join('|') + ')\\b', 'g');
const STYLE_RE = /\.style\b/g;
const MATH_RANDOM_RE = /Math\.random\b/g;
const IMPORT_RE = /\bimport\b\s*(?:\(|[^=])/g;

/**
 * @param {string} source
 * @param {string} [file]
 * @returns {Array<{name:string, line:number, file:string}>}
 */
export function lintSource(source, file = '<source>') {
  const cleaned = stripCommentsAndStrings(source);
  const lines = cleaned.split('\n');
  const violations = [];

  function lineOf(index) {
    // count newlines before index
    let line = 1;
    for (let i = 0; i < index; i++) {
      if (cleaned[i] === '\n') line++;
    }
    return line;
  }

  // Faster line lookup using cumulative offsets.
  const lineStarts = [0];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '\n') lineStarts.push(i + 1);
  }
  function lineOfFast(index) {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
  void lineOf; // unused fallback kept for clarity, avoid lint complaints

  let m;
  IDENT_RE.lastIndex = 0;
  while ((m = IDENT_RE.exec(cleaned))) {
    violations.push({ name: m[1], line: lineOfFast(m.index), file });
  }

  STYLE_RE.lastIndex = 0;
  while ((m = STYLE_RE.exec(cleaned))) {
    violations.push({ name: '.style', line: lineOfFast(m.index), file });
  }

  MATH_RANDOM_RE.lastIndex = 0;
  while ((m = MATH_RANDOM_RE.exec(cleaned))) {
    violations.push({ name: 'Math.random', line: lineOfFast(m.index), file });
  }

  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(cleaned))) {
    violations.push({ name: 'import', line: lineOfFast(m.index), file });
  }

  violations.sort((a, b) => a.line - b.line);
  void lines;
  return violations;
}

/**
 * @param {string[]} paths absolute or relative-to-cwd paths
 * @returns {Array<{name:string, line:number, file:string}>}
 */
export function lintFiles(paths) {
  const all = [];
  for (const p of paths) {
    const source = readFileSync(p, 'utf8');
    all.push(...lintSource(source, p));
  }
  return all;
}

function isMain() {
  return import.meta.url === `file://${process.argv[1]}`;
}

if (isMain()) {
  const args = process.argv.slice(2);
  const targets = (args.length > 0 ? args : DEFAULT_TARGETS).map((t) =>
    path.isAbsolute(t) ? t : path.resolve(RENDERER_ROOT, t)
  );

  let missing = false;
  for (const t of targets) {
    try {
      readFileSync(t, 'utf8');
    } catch {
      console.error(`lint-no-dom: missing target ${t}`);
      missing = true;
    }
  }
  if (missing) {
    process.exit(2);
  }

  const violations = lintFiles(targets);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(`${v.file}:${v.line}: forbidden identifier "${v.name}"`);
    }
    console.error(`lint-no-dom: ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log('lint-no-dom: clean');
  process.exit(0);
}
