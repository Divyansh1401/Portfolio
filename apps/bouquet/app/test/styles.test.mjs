import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODE_IDS } from '../../packages/modes/modes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES_DIR = path.join(__dirname, '..', 'styles');

const REQUIRED_VARS = [
  '--ground',
  '--surface',
  '--ink',
  '--muted',
  '--accent',
  '--on-accent',
  '--accent-strong',
  '--focus',
  '--border',
];

test('modes.css contains a block for every mode id with all 9 vars', async () => {
  const css = await readFile(path.join(STYLES_DIR, 'modes.css'), 'utf8');

  for (const id of MODE_IDS) {
    const re = new RegExp(`html\\[data-mode=["']${id}["']\\]\\s*\\{([^}]*)\\}`);
    const match = css.match(re);
    assert.ok(match, `expected a html[data-mode="${id}"] block in modes.css`);
    const body = match[1];
    for (const v of REQUIRED_VARS) {
      assert.ok(
        new RegExp(`${v}\\s*:`).test(body),
        `expected ${v} in the ${id} block`
      );
    }
  }
});

test('modes.css also sets a default :root block with all 9 vars', async () => {
  const css = await readFile(path.join(STYLES_DIR, 'modes.css'), 'utf8');
  const match = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(match, 'expected a :root block in modes.css');
  const body = match[1];
  for (const v of REQUIRED_VARS) {
    assert.ok(new RegExp(`${v}\\s*:`).test(body), `expected ${v} in :root`);
  }
});

test('base.css contains no hex colours', async () => {
  const css = await readFile(path.join(STYLES_DIR, 'base.css'), 'utf8');
  // Strip comments so any hex mentioned only in prose doesn't false-positive.
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const hexMatch = withoutComments.match(/#[0-9a-fA-F]{3,8}\b/);
  assert.equal(hexMatch, null, `found a hex colour in base.css: ${hexMatch}`);
});

test('base.css uses --accent-strong (not --accent) for text links, focus rings, and the border of filled buttons/selected chips', async () => {
  const css = await readFile(path.join(STYLES_DIR, 'base.css'), 'utf8');
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

  const linkBlock = withoutComments.match(/(^|\n)a\s*\{([^}]*)\}/);
  assert.ok(linkBlock, 'expected an `a { ... }` rule');
  assert.match(linkBlock[2], /color:\s*var\(--accent-strong\)/, 'link text colour should be --accent-strong');

  const focusVisible = withoutComments.match(/:focus-visible\s*\{([^}]*)\}/);
  assert.ok(focusVisible, 'expected a `:focus-visible { ... }` rule');
  assert.match(
    focusVisible[1],
    /outline:\s*2px solid var\(--focus\)/,
    ':focus-visible outline should use --focus (== --accent-strong)'
  );

  const btnPrimary = withoutComments.match(/\.btn-primary\s*\{([^}]*)\}/);
  assert.ok(btnPrimary, 'expected a `.btn-primary { ... }` rule');
  assert.match(
    btnPrimary[1],
    /border(-color)?:\s*(1px solid )?var\(--accent-strong\)/,
    '.btn-primary border should be --accent-strong (WCAG 1.4.11 non-text 3:1 boundary)'
  );

  const selectedChip = withoutComments.match(/\.chip\[aria-pressed='true'\][^{]*\{([^}]*)\}/);
  assert.ok(selectedChip, "expected a `.chip[aria-pressed='true'] { ... }` rule");
  assert.match(
    selectedChip[1],
    /border-color:\s*var\(--accent-strong\)/,
    "selected chip's border should be --accent-strong"
  );
});
