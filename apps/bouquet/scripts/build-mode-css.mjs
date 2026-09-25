#!/usr/bin/env node
/**
 * @file Generates app/styles/modes.css from packages/modes/modes.js.
 *
 * Writes a `:root` block carrying the default (rose) UI tokens, followed by
 * one `html[data-mode="<id>"] { ... }` block per mode in MODES order, each
 * setting the same 9 custom properties: --ground --surface --ink --muted
 * --accent --on-accent --accent-strong --focus --border.
 *
 * Run: `node scripts/build-mode-css.mjs` (also wired as `npm run build:css`).
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, DEFAULT_MODE } from '../packages/modes/modes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'app', 'styles', 'modes.css');

/**
 * Render the 8 custom-property declarations for a mode's `ui` block.
 * @param {import('../packages/modes/modes.js').UiColours} ui
 * @returns {string}
 */
function declBlock(ui) {
  return [
    `  --ground: ${ui.ground};`,
    `  --surface: ${ui.surface};`,
    `  --ink: ${ui.ink};`,
    `  --muted: ${ui.muted};`,
    `  --accent: ${ui.accent};`,
    `  --on-accent: ${ui.onAccent};`,
    `  --accent-strong: ${ui.accentStrong};`,
    `  --focus: ${ui.focus};`,
    `  --border: ${ui.border};`,
  ].join('\n');
}

/**
 * Build the full CSS text for the given modes.
 * @param {import('../packages/modes/modes.js').Mode[]} modes
 * @param {string} defaultModeId
 * @returns {string}
 */
function buildCss(modes, defaultModeId) {
  const defaultMode = modes.find((m) => m.id === defaultModeId) || modes[0];

  const header =
    '/**\n' +
    ' * GENERATED FILE — do not edit by hand.\n' +
    ' * Produced by scripts/build-mode-css.mjs from packages/modes/modes.js.\n' +
    ' * Re-run `node scripts/build-mode-css.mjs` after changing a mode.\n' +
    ' */\n\n';

  const rootBlock = `:root {\n${declBlock(defaultMode.ui)}\n}\n`;

  const modeBlocks = modes
    .map((mode) => `html[data-mode="${mode.id}"] {\n${declBlock(mode.ui)}\n}`)
    .join('\n\n');

  return `${header}${rootBlock}\n${modeBlocks}\n`;
}

async function main() {
  const css = buildCss(MODES, DEFAULT_MODE);
  await writeFile(OUT_PATH, css, 'utf8');
  console.log(`Wrote ${OUT_PATH} (${MODES.length} modes)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

export { buildCss, declBlock };
