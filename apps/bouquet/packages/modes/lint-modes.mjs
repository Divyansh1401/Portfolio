#!/usr/bin/env node
/**
 * @file Contrast + shape lint for packages/modes/modes.js.
 *
 * Checks (see CONTRACT.md §1 for the exact source of truth):
 *  - WCAG 2.x relative-luminance contrast ratios for the UI token pairs.
 *  - Bouquet shading triples go deep -> mid -> light (luminance strictly
 *    increases; top > mid > deep is required as "top > +x > +z").
 *  - Every colour slot is a valid '#rrggbb' string.
 *  - `paletteFor` returns 11 triples for every mode.
 *  - `paletteFor('rose')` slots 0-9 deep-equal the reference loader's
 *    DEFAULT_PALETTE (copied into modes.js as REFERENCE_PALETTE).
 */

import { MODES, paletteFor, REFERENCE_PALETTE } from './modes.js';

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * @typedef {Object} LintFailure
 * @property {string} mode
 * @property {string} check
 * @property {*} value
 * @property {*} required
 */

/**
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * WCAG relative luminance of an sRGB '#rrggbb' colour.
 * @param {string} hex
 * @returns {number}
 */
function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two '#rrggbb' colours.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Run every check against every mode and return the list of failures.
 * @param {import('./modes.js').Mode[]} modes
 * @returns {LintFailure[]}
 */
function lintModes(modes) {
  /** @type {LintFailure[]} */
  const failures = [];

  const push = (mode, check, value, required, ok) => {
    if (!ok) failures.push({ mode, check, value, required });
  };

  const CONTRAST_RULES = [
    ['ink/ground', (ui) => contrast(ui.ink, ui.ground), 4.5],
    ['ink/surface', (ui) => contrast(ui.ink, ui.surface), 4.5],
    ['muted/ground', (ui) => contrast(ui.muted, ui.ground), 4.5],
    ['onAccent/accent', (ui) => contrast(ui.onAccent, ui.accent), 4.5],
    ['accent/ground', (ui) => contrast(ui.accent, ui.ground), 3],
    ['focus/ground', (ui) => contrast(ui.focus, ui.ground), 3],
    ['border/ground', (ui) => contrast(ui.border, ui.ground), 1.3],
  ];

  for (const mode of modes) {
    // 1. hex validity for every declared colour slot.
    const allColours = [
      ...mode.bouquet.petals,
      ...mode.bouquet.centres,
      mode.bouquet.ribbon,
      mode.ui.ground,
      mode.ui.surface,
      mode.ui.ink,
      mode.ui.muted,
      mode.ui.accent,
      mode.ui.onAccent,
      mode.ui.focus,
      mode.ui.border,
    ];
    for (const c of allColours) {
      push(mode.id, `hex:${c}`, c, HEX6_RE.source, HEX6_RE.test(c));
    }

    // 2. contrast rules.
    for (const [check, fn, min] of CONTRAST_RULES) {
      const value = fn(mode.ui);
      push(mode.id, check, Number(value.toFixed(3)), `>= ${min}`, value >= min);
    }

    // 3. shading: within each rendered material triple [top, mid, dark],
    // luminance must strictly decrease (top > mid > dark) so the renderer's
    // shading gradient reads correctly. Checked on the actual paletteFor()
    // output (not the raw petals/centres arrays) since e.g. single-centre
    // modes legitimately reuse one hex for all three "levels" — it is
    // `triple()`'s own .78/.56 falloff that must shade correctly.
    const palette = paletteFor(mode);
    palette.forEach(([top, mid, dark], i) => {
      const lTop = relativeLuminance(top);
      const lMid = relativeLuminance(mid);
      const lDark = relativeLuminance(dark);
      push(
        mode.id,
        `shading:slot${i}`,
        `${lTop.toFixed(4)} > ${lMid.toFixed(4)} > ${lDark.toFixed(4)}`,
        'top > mid > dark',
        lTop > lMid && lMid > lDark
      );
    });

    // 4. paletteFor returns 11 triples of valid hex colours.
    push(mode.id, 'paletteFor:length', palette.length, 11, palette.length === 11);
    const allTriplesValid = palette.every(
      (triple) => Array.isArray(triple) && triple.length === 3 && triple.every((h) => HEX6_RE.test(h))
    );
    push(mode.id, 'paletteFor:validHex', allTriplesValid, true, allTriplesValid);
  }

  // 5. rose parity with the reference loader palette (slots 0-9 verbatim).
  const rosePalette = paletteFor('rose');
  const referenceMatches = REFERENCE_PALETTE.every((triple, i) =>
    triple.every((h, j) => rosePalette[i][j] === h)
  );
  push('rose', 'paletteFor:referenceParity', referenceMatches, true, referenceMatches);

  return failures;
}

function printTable(failures) {
  if (failures.length === 0) {
    console.log('lint-modes: all checks passed.');
    return;
  }
  console.log('lint-modes: FAILURES');
  console.log('mode'.padEnd(12) + 'check'.padEnd(28) + 'value'.padEnd(30) + 'required');
  for (const f of failures) {
    console.log(
      String(f.mode).padEnd(12) +
        String(f.check).padEnd(28) +
        String(f.value).padEnd(30) +
        String(f.required)
    );
  }
}

// CLI entry point.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const failures = lintModes(MODES);
  printTable(failures);
  process.exit(failures.length === 0 ? 0 : 1);
}

export { lintModes, contrast, relativeLuminance };
