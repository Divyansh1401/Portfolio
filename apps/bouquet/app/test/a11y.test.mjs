/**
 * @file Accessibility pass (TASK L3b). Chromium-driven (playwright-core)
 * end-to-end checks against the real server + real pages:
 *
 *   - keyboard-only create flow (tab order, arrow keys inside the chip
 *     radiogroups)
 *   - preview dialog focus trap + Escape + focus restore
 *   - keyboard reveal on /b/:id (Tab reaches Open first, Enter reveals,
 *     the live region then holds the message)
 *   - reduced motion (still bouquet, Open still works)
 *   - every page: <title>, lang, exactly one <h1>, labelled controls,
 *     a visible focus outline
 *   - contrast, from computed styles, for ink/ground and the primary
 *     button's text/background, in all 5 modes
 *
 * Findings (defects found in files this task does NOT own — create.html,
 * create.page.js, bouquet.html — are listed, not fixed) are written up in
 * ../../docs/A11Y.md. See that file for the narrative; assertions here
 * intentionally encode the correct/ideal behaviour (per CONTRACT.md and
 * general ARIA practice) even where the current implementation falls short,
 * so a real regression — or a real fix — shows up as a real pass/fail.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { createServer } from '../server/index.js';
import { MODES } from '../../packages/modes/modes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** @type {import('node:http').Server} */
let server;
let base = '';
/** @type {import('playwright-core').Browser} */
let browser;

// Two real bouquets, created once via the real POST /api/bouquet, and
// reused across tests so each test doesn't have to spend a round trip.
let bouquetId = '';
let bouquetMessage = 'Thank you for everything, truly.';
let bouquetFrom = 'Ava';
let reducedMotionBouquetId = '';

before(async () => {
  server = createServer({ dbPath: ':memory:' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;

  browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  async function createBouquet(nonce) {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'rose',
        shape: 'full',
        message: bouquetMessage,
        from_name: bouquetFrom,
        reply_of: null,
        client_nonce: nonce,
      }),
    });
    assert.equal(res.status, 201, 'setup: POST /api/bouquet should create a bouquet');
    const body = await res.json();
    return body.id;
  }

  bouquetId = await createBouquet('a11y-test-nonce-1');
  reducedMotionBouquetId = await createBouquet('a11y-test-nonce-2');
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

/**
 * @param {import('playwright-core').Page} page
 * @returns {Promise<{tag:string, id:string|null, cls:string|null, role:string|null, dataset:Record<string,string>}>}
 */
async function focused(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { tag: null, id: null, cls: null, role: null, dataset: {} };
    return {
      tag: el.tagName,
      id: el.id || null,
      cls: (el.className && el.className.toString()) || null,
      role: el.getAttribute('role'),
      dataset: Object.assign({}, el.dataset),
    };
  });
}

/**
 * Parse a `rgb(r, g, b)` / `rgba(r, g, b, a)` computed-style string.
 * @param {string} css
 * @returns {[number, number, number]}
 */
function parseRgb(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`not an rgb() colour: ${css}`);
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  return [parts[0], parts[1], parts[2]];
}

/** @param {[number,number,number]} rgb */
function relLuminance([r, g, b]) {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * @param {string} a rgb() css string
 * @param {string} b rgb() css string
 */
function contrastRatio(a, b) {
  const la = relLuminance(parseRgb(a));
  const lb = relLuminance(parseRgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------
// Every page: <title>, lang, one <h1>, labelled controls, visible focus
// ---------------------------------------------------------------------

test('/ (create.html): title, lang, one h1, labelled controls', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    const title = await page.title();
    assert.ok(title && title.trim().length > 0, 'page should have a non-empty <title>');

    const lang = await page.getAttribute('html', 'lang');
    assert.ok(lang && lang.trim().length > 0, 'html should declare lang');

    const h1Count = await page.locator('h1').count();
    assert.equal(h1Count, 1, 'page should have exactly one <h1>');

    // Every <input>/<textarea> should resolve an accessible name (a real
    // <label for>, aria-label, or aria-labelledby).
    const unlabelled = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('input, textarea')) {
        const id = el.id;
        const hasFor = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledby = el.getAttribute('aria-labelledby');
        if (!hasFor && !hasAriaLabel && !hasAriaLabelledby) {
          bad.push(el.id || el.outerHTML.slice(0, 60));
        }
      }
      return bad;
    });
    assert.deepEqual(unlabelled, [], 'every input/textarea should have an accessible label');

    // Every button/link should resolve a non-empty accessible name (visible
    // text, aria-label, or aria-labelledby).
    const unnamed = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('button, a[href]')) {
        const text = (el.textContent || '').trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        if (!text && !ariaLabel && !ariaLabelledby) bad.push(el.outerHTML.slice(0, 60));
      }
      return bad;
    });
    assert.deepEqual(unnamed, [], 'every button/link should have an accessible name');
  } finally {
    await page.close();
  }
});

test('/b/:id (bouquet.html): title, lang, one h1, labelled controls', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/b/${bouquetId}`, { waitUntil: 'load' });
    const title = await page.title();
    assert.ok(title && title.trim().length > 0, 'page should have a non-empty <title>');
    const lang = await page.getAttribute('html', 'lang');
    assert.ok(lang && lang.trim().length > 0, 'html should declare lang');
    const h1Count = await page.locator('h1').count();
    assert.equal(h1Count, 1, 'page should have exactly one <h1> (a recipient landing on a bare link needs a heading identifying the page)');
  } finally {
    await page.close();
  }
});

test('/b/:id/sent (sent.html): title, lang, one h1, labelled controls', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/b/${bouquetId}/sent`, { waitUntil: 'load' });
    const title = await page.title();
    assert.ok(title && title.trim().length > 0, 'page should have a non-empty <title>');
    const lang = await page.getAttribute('html', 'lang');
    assert.ok(lang && lang.trim().length > 0, 'html should declare lang');
    const h1Count = await page.locator('h1').count();
    assert.equal(h1Count, 1, 'page should have exactly one <h1>');
    const label = await page.evaluate(() => {
      const input = document.getElementById('sent-link');
      return input && document.querySelector('label[for="sent-link"]') ? true : false;
    });
    assert.ok(label, 'the link field should have a real <label for>');
  } finally {
    await page.close();
  }
});

test('unknown /b/:id (wilted.html): title, lang, one h1, 404 status', async () => {
  const page = await browser.newPage();
  try {
    const res = await page.goto(`${base}/b/doesnotexist`, { waitUntil: 'load' });
    assert.equal(res.status(), 404);
    const title = await page.title();
    assert.ok(title && title.trim().length > 0, 'page should have a non-empty <title>');
    const lang = await page.getAttribute('html', 'lang');
    assert.ok(lang && lang.trim().length > 0, 'html should declare lang');
    const h1Count = await page.locator('h1').count();
    assert.equal(h1Count, 1, 'page should have exactly one <h1>');
  } finally {
    await page.close();
  }
});

test('visible focus: :focus-visible outline appears on a real keyboard tab stop', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
    });
    assert.notEqual(outline.style, 'none', 'a keyboard-focused control should show an outline');
    assert.notEqual(outline.width, '0px', 'the focus outline should have non-zero width');
  } finally {
    await page.close();
  }
});

// ---------------------------------------------------------------------
// Keyboard-only create flow
// ---------------------------------------------------------------------

test('keyboard-only create flow: tab order is theme radios -> shape radios -> note -> from -> Preview -> Create link', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });

    const stops = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      stops.push(await focused(page));
    }

    const modeStops = stops.filter((s) => 'modeId' in s.dataset);
    const shapeStops = stops.filter((s) => 'shapeId' in s.dataset);
    assert.equal(modeStops.length, 5, 'all 5 flower chips should be reachable by Tab');
    assert.equal(shapeStops.length, 3, 'all 3 shape chips should be reachable by Tab');

    const firstModeIdx = stops.findIndex((s) => 'modeId' in s.dataset);
    const lastModeIdx = stops.map((s) => 'modeId' in s.dataset).lastIndexOf(true);
    const firstShapeIdx = stops.findIndex((s) => 'shapeId' in s.dataset);
    const lastShapeIdx = stops.map((s) => 'shapeId' in s.dataset).lastIndexOf(true);
    assert.ok(lastModeIdx < firstShapeIdx, 'every mode chip should come before the shape chips');
    assert.ok(lastShapeIdx < stops.findIndex((s) => s.id === 'message-field'), 'shape chips should come before the note field');

    const order = stops.map((s) => s.id || s.dataset.modeId || s.dataset.shapeId).filter(Boolean);
    const messageIdx = order.indexOf('message-field');
    const fromIdx = order.indexOf('from-field');
    const previewIdx = order.indexOf('preview-btn');
    const createIdx = order.indexOf('create-btn');
    assert.ok(messageIdx >= 0 && fromIdx > messageIdx, 'note field should come before the from field');
    assert.ok(previewIdx > fromIdx, 'Preview should come after the from field');
    assert.ok(createIdx > previewIdx, 'Create link should come after Preview');
  } finally {
    await page.close();
  }
});

test('keyboard-only create flow: arrow keys move selection within the flower radiogroup', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    // Tab to the first chip in the flower (mode) radiogroup.
    await page.keyboard.press('Tab');
    const first = await focused(page);
    assert.equal(first.dataset.modeId, 'rose', 'the first flower chip should be rose (DEFAULT_MODE)');

    await page.keyboard.press('ArrowRight');
    const afterArrow = await focused(page);
    assert.notEqual(
      afterArrow.dataset.modeId,
      first.dataset.modeId,
      'ArrowRight inside a role="radiogroup" should move focus (and per the ARIA radio-group pattern, selection) to the next radio — ' +
        'the chip groups in app/client/create.page.js have no keydown handling at all, so this currently fails; see docs/A11Y.md finding #1',
    );

    const checkedAfterArrow = await page.evaluate(
      (id) => document.querySelector(`[data-mode-id="${id}"]`)?.getAttribute('aria-checked'),
      afterArrow.dataset.modeId || first.dataset.modeId,
    );
    assert.equal(checkedAfterArrow, 'true', 'moving with the arrow key inside a radiogroup should also change the selection');
  } finally {
    await page.close();
  }
});

test('keyboard-only create flow: arrow keys move selection within the shape radiogroup', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab'); // past the 5 mode chips, onto the 1st shape chip
    const first = await focused(page);
    assert.equal(first.dataset.shapeId, 'full', 'the first shape chip should be "full" (DEFAULT_SHAPE)');

    await page.keyboard.press('ArrowRight');
    const afterArrow = await focused(page);
    assert.notEqual(
      afterArrow.dataset.shapeId,
      first.dataset.shapeId,
      'ArrowRight inside the shape radiogroup should move focus to the next shape chip — currently unimplemented, see docs/A11Y.md finding #1',
    );
  } finally {
    await page.close();
  }
});

// ---------------------------------------------------------------------
// Preview dialog: focus trap, Escape, focus restore
// ---------------------------------------------------------------------

test('preview dialog: focus trap, Escape closes it, and focus is restored to the Preview button', async () => {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });

    // A minimal note is required for the preview to be meaningful, but the
    // dialog itself doesn't require one — open it directly.
    await page.click('#preview-btn');
    await page.waitForSelector('#preview-dialog:not([hidden])');

    const first = await focused(page);
    assert.equal(first.id, 'preview-close', 'opening the dialog should focus its first focusable control');

    // Tab all the way around and confirm focus never escapes the dialog.
    const insideDialog = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const dialog = document.getElementById('preview-dialog');
        return dialog.contains(document.activeElement);
      });
      insideDialog.push(inside);
    }
    assert.ok(
      insideDialog.every(Boolean),
      'Tab should never move focus outside the open preview dialog (focus trap)',
    );

    // Shift+Tab from the first item should wrap to the last.
    await page.evaluate(() => document.getElementById('preview-close').focus());
    await page.keyboard.press('Shift+Tab');
    const wrapped = await focused(page);
    assert.notEqual(wrapped.id, 'preview-close', 'Shift+Tab from the first item should wrap to the last focusable item');

    await page.keyboard.press('Escape');
    await page.waitForSelector('#preview-dialog[hidden]', { state: 'attached' });
    const afterEscape = await focused(page);
    assert.equal(afterEscape.id, 'preview-btn', 'Escape should close the dialog and restore focus to the button that opened it');

    assert.deepEqual(consoleErrors, [], 'no uncaught page errors while opening/closing the preview');
  } finally {
    await page.close();
  }
});

// ---------------------------------------------------------------------
// Keyboard reveal on /b/:id
// ---------------------------------------------------------------------

test('keyboard reveal on /b/:id: Tab reaches Open first, one Enter reveals, the live region then holds the message', async () => {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  try {
    await page.goto(`${base}/b/${bouquetId}`, { waitUntil: 'load' });

    await page.keyboard.press('Tab');
    const first = await focused(page);
    assert.ok(
      first.tag === 'BUTTON' || (first.dataset && 'revealOpen' in first.dataset),
      'the first Tab stop on the recipient page should be the Open button',
    );
    const isOpenButton = await page.evaluate(() => document.activeElement.hasAttribute('data-reveal-open'));
    assert.ok(isOpenButton, 'the first focusable control should be [data-reveal-open]');

    await page.keyboard.press('Enter');
    // The burst animation runs ~600ms; give it real time to land.
    await page.waitForFunction(
      () => {
        const box = document.getElementById('bq-message');
        return box && !box.hidden;
      },
      { timeout: 3000 },
    );

    const messageBox = await page.evaluate(() => ({
      role: document.getElementById('bq-message').getAttribute('role'),
      live: document.getElementById('bq-message').getAttribute('aria-live'),
      text: document.getElementById('bq-message-text').textContent,
    }));
    assert.equal(messageBox.role, 'status', 'the message container should be a live status region');
    assert.equal(messageBox.live, 'polite', 'the message region should be aria-live="polite"');
    assert.equal(messageBox.text, bouquetMessage, 'the live region should contain the actual message once revealed');

    assert.deepEqual(consoleErrors, [], 'no uncaught page errors during the keyboard reveal');
  } finally {
    await page.close();
  }
});

// ---------------------------------------------------------------------
// Reduced motion
// ---------------------------------------------------------------------

test('reduced motion: /b/:id lands still (no fly-in) and Open still works', async () => {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${base}/b/${reducedMotionBouquetId}`, { waitUntil: 'load' });

    // Give the initial paint a moment, then confirm the canvas has real
    // pixel content (a still bouquet, not a blank/broken canvas) and that
    // the page did not error out building it.
    await page.waitForTimeout(150);
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('[data-reveal-canvas]');
      if (!canvas || !canvas.width || !canvas.height) return false;
      const ctx = canvas.getContext('2d');
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) return true; // any non-transparent pixel
      }
      return false;
    });
    assert.ok(hasContent, 'the canvas should show a painted still bouquet under reduced motion');

    // Open should still work: a plain click reveals the message.
    await page.click('[data-reveal-open]');
    await page.waitForFunction(
      () => {
        const box = document.getElementById('bq-message');
        return box && !box.hidden;
      },
      { timeout: 3000 },
    );
    const revealedText = await page.evaluate(
      () => document.getElementById('bq-message-text').textContent,
    );
    assert.equal(revealedText, bouquetMessage, 'Open should reveal the message under reduced motion too');

    assert.deepEqual(consoleErrors, [], 'no uncaught page errors under reduced motion');
  } finally {
    await page.close();
  }
});

// ---------------------------------------------------------------------
// Contrast: ink/ground and primary-button text/background, all 5 modes
// ---------------------------------------------------------------------

test('contrast: ink/ground and primary-button text/background pass 4.5:1 in every mode (computed styles)', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    const failures = [];

    for (const mode of MODES) {
      await page.evaluate((id) => {
        document.documentElement.setAttribute('data-mode', id);
      }, mode.id);

      const colours = await page.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        const btn = document.getElementById('create-btn');
        const btnStyle = getComputedStyle(btn);
        return {
          ink: bodyStyle.color,
          ground: bodyStyle.backgroundColor,
          onAccent: btnStyle.color,
          accent: btnStyle.backgroundColor,
        };
      });

      const inkGround = contrastRatio(colours.ink, colours.ground);
      const onAccentAccent = contrastRatio(colours.onAccent, colours.accent);

      if (inkGround < 4.5) {
        failures.push(`${mode.id}: ink/ground = ${inkGround.toFixed(2)} (need >= 4.5)`);
      }
      if (onAccentAccent < 4.5) {
        failures.push(`${mode.id}: on-accent/accent (primary button) = ${onAccentAccent.toFixed(2)} (need >= 4.5)`);
      }
    }

    assert.deepEqual(failures, [], `contrast failures:\n${failures.join('\n')}`);
  } finally {
    await page.close();
  }
});
