/**
 * @file End-to-end browser test for the whole bouquet loop, driven with
 * real Chromium (playwright-core) against a live `createServer` instance
 * (`dbPath: ':memory:'`).
 *
 * Covers (CONTRACT.md §§3, 5, 6):
 *  - the sender flow on / (pick a mode, write a note, create a link) at
 *    390x844 (hasTouch, isMobile) finishing with a synthetic HOLD gesture
 *    on the recipient stage, and again at 1440x900 finishing with wheel;
 *  - the recipient always opens the link in a FRESH browser context (no
 *    sender-side storage/session carries over);
 *  - the revealed message text + from-name, the reply link's href, and
 *    that following it preselects the replied-to bouquet's mode on /;
 *  - GET /api/bouquet/:id/summary never includes the message;
 *  - zero console errors / page errors on every page visited;
 *  - for each of the 5 modes, html[data-mode] and the computed body
 *    background match that mode's ui.ground.
 *
 * Builds app/dist (esbuild bundles) and app/styles/modes.css first if
 * either is missing, the same way `npm run dev` would.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { createServer } from '../server/index.js';
import { MODES } from '../../packages/modes/modes.js';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_DIR, '..');
const DIST_DIR = path.join(APP_DIR, 'dist');
const MODES_CSS = path.join(APP_DIR, 'styles', 'modes.css');

/** @type {import('node:http').Server} */
let server;
/** @type {string} */
let base;
/** @type {import('playwright-core').Browser} */
let browser;

/**
 * @param {string} hex '#rrggbb'
 * @returns {string} the CSS `rgb(r, g, b)` string a browser normalises to
 */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Collects console-error and uncaught page-error messages for `page`.
 * @param {import('playwright-core').Page} page
 * @returns {string[]}
 */
function trackErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error on ${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    errors.push(`page error on ${page.url()}: ${err && err.message ? err.message : err}`);
  });
  return errors;
}

/**
 * Waits for the recipient page's message card to be shown (i.e. the reveal
 * machine has crossed q >= 1 and reveal.js has un-hidden #bq-message).
 * @param {import('playwright-core').Page} page
 */
async function waitForRevealed(page) {
  await page.waitForFunction(
    () => {
      const box = document.getElementById('bq-message');
      return !!box && !box.hidden;
    },
    { timeout: 8000 },
  );
}

before(async () => {
  const hasDist =
    existsSync(path.join(DIST_DIR, 'create.js')) &&
    existsSync(path.join(DIST_DIR, 'bouquet.js')) &&
    existsSync(path.join(DIST_DIR, 'sent.js'));
  if (!hasDist) {
    execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'build-client.mjs')], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  }
  if (!existsSync(MODES_CSS)) {
    execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'build-mode-css.mjs')], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  }

  server = createServer({ dbPath: ':memory:' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  base = `http://127.0.0.1:${address.port}`;

  browser = await chromium.launch({
    executablePath: CHROMIUM_EXECUTABLE,
    args: ['--disable-gpu', '--no-sandbox'],
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

/** POST JSON to the test server. */
async function postJson(p, payload) {
  const res = await fetch(`${base}${p}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

/** Create a live bouquet over the API, paying for non-Rose flowers. */
async function createLive(payload) {
  const r = await postJson('/api/bouquet', payload);
  if (r.status === 201) return r.body.id;
  assert.equal(r.status, 202);
  const order = await postJson(`/api/checkout/${r.body.draft_id}`, { currency: 'INR', amount: 30 });
  const paid = await postJson(`/api/checkout/${r.body.draft_id}/confirm`, { order_id: order.body.order_id, outcome: 'paid' });
  assert.equal(paid.status, 200);
  return paid.body.id;
}

/**
 * Runs the full sender -> recipient -> reply loop once, at a given viewport
 * and reveal method.
 * @param {{viewport: {width:number, height:number}, hasTouch?: boolean, isMobile?: boolean, revealMethod: 'hold'|'wheel', mode: string, message: string, fromName: string}} opts
 */
async function runFullLoop(opts) {
  const { viewport, hasTouch = false, isMobile = false, revealMethod, mode, message, fromName } = opts;

  // ---- sender: create a bouquet through the real / form ----
  const senderContext = await browser.newContext({ viewport, hasTouch, isMobile });
  const senderPage = await senderContext.newPage();
  const senderErrors = trackErrors(senderPage);

  await senderPage.goto(`${base}/`);
  await senderPage.waitForSelector(`#mode-group .flower-card[data-mode-id="${mode}"]`);
  await senderPage.click(`#mode-group .flower-card[data-mode-id="${mode}"]`);
  await senderPage.fill('#message-field', message);
  await senderPage.fill('#from-field', fromName);
  await senderPage.click('#create-btn');
  if (mode !== 'rose') {
    // Paid flower: pay-what-you-like sheet -> pretend checkout.
    await senderPage.waitForSelector('#pay-sheet:not([hidden])');
    await senderPage.click('#amount-group .chip:nth-child(2)');
    await senderPage.click('#pay-btn');
    await senderPage.waitForSelector('#checkout-panel:not([hidden])');
    await senderPage.click('#checkout-pay');
  }
  await senderPage.waitForURL(/\/b\/[^/]+\/sent$/, { timeout: 10000 });

  const sentPath = new URL(senderPage.url()).pathname; // /b/<id>/sent
  const id = sentPath.split('/')[2];
  assert.ok(id, 'a bouquet id was extracted from the /sent redirect');

  assert.deepEqual(senderErrors, [], `sender page (/) had console/page errors:\n${senderErrors.join('\n')}`);
  await senderContext.close();

  // ---- the summary endpoint must never leak the message ----
  const summaryRes = await fetch(`${base}/api/bouquet/${id}/summary`);
  assert.equal(summaryRes.status, 200);
  const summary = await summaryRes.json();
  assert.equal(summary.id, id);
  assert.equal(summary.mode, mode);
  assert.equal(summary.from_name, fromName);
  assert.ok(!('message' in summary), `summary leaked the message: ${JSON.stringify(summary)}`);

  // ---- recipient: always a FRESH browser context ----
  const recipientContext = await browser.newContext({ viewport, hasTouch, isMobile });
  const recipientPage = await recipientContext.newPage();
  const recipientErrors = trackErrors(recipientPage);

  await recipientPage.goto(`${base}/b/${id}`);
  await recipientPage.waitForSelector('[data-reveal-stage]');

  const box = await recipientPage.locator('[data-reveal-stage]').boundingBox();
  assert.ok(box, 'the reveal stage has a bounding box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await recipientPage.mouse.move(cx, cy);

  if (revealMethod === 'hold') {
    // Any input during the fly-in only skips it (the machine explicitly
    // does not also start a hold from that same event) — so the first
    // down/up just lands the bouquet, and a SECOND press is the real hold.
    await recipientPage.mouse.down();
    await recipientPage.mouse.up();
    await recipientPage.mouse.down();
    await recipientPage.waitForTimeout(1200);
    await waitForRevealed(recipientPage);
    await recipientPage.mouse.up();
  } else if (revealMethod === 'wheel') {
    // The first wheel tick during the fly-in only skips it too; the
    // following ticks are the ones that actually fill q (WHEEL_DIVISOR
    // = 240px of dy per full q, so a handful of 250px notches clears it).
    await recipientPage.mouse.wheel(0, 50);
    for (let i = 0; i < 6; i++) {
      // eslint-disable-next-line no-await-in-loop
      await recipientPage.mouse.wheel(0, 250);
    }
    await waitForRevealed(recipientPage);
  } else {
    throw new Error(`unknown revealMethod: ${revealMethod}`);
  }

  const revealedText = (await recipientPage.textContent('#bq-message-text')) || '';
  assert.equal(revealedText.trim(), message);

  const revealedFrom = (await recipientPage.textContent('#bq-message-from')) || '';
  assert.equal(revealedFrom.trim(), `— ${fromName}`);

  const replyHref = await recipientPage.getAttribute('#bq-send-back', 'href');
  assert.equal(replyHref, `/?reply=${encodeURIComponent(id)}`);

  assert.deepEqual(
    recipientErrors,
    [],
    `recipient page (/b/${id}) had console/page errors:\n${recipientErrors.join('\n')}`,
  );

  // ---- follow "Send one back" and assert the reply preselect on / ----
  await recipientPage.click('#bq-send-back');
  await recipientPage.waitForURL(/\/\?reply=/, { timeout: 10000 });
  await recipientPage.waitForFunction(
    (expectedMode) => document.documentElement.dataset.mode === expectedMode,
    mode,
    { timeout: 8000 },
  );
  const chipChecked = await recipientPage.getAttribute(`#mode-group .flower-card[data-mode-id="${mode}"]`, 'aria-checked');
  assert.equal(chipChecked, 'true', 'the replied-to bouquet’s mode is preselected on /');

  assert.deepEqual(
    recipientErrors,
    [],
    `recipient page (/?reply=${id}) had console/page errors:\n${recipientErrors.join('\n')}`,
  );

  await recipientContext.close();
}

test(
  'full loop: 390x844 touch device, HOLD to reveal',
  { timeout: 30000 },
  async () => {
    await runFullLoop({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      revealMethod: 'hold',
      mode: 'sunflower',
      message: 'Thinking of you today, sending flowers.',
      fromName: 'Ada',
    });
  },
);

test(
  'full loop: 1440x900 desktop, wheel to reveal',
  { timeout: 30000 },
  async () => {
    await runFullLoop({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
      isMobile: false,
      revealMethod: 'wheel',
      mode: 'lavender',
      message: 'Congratulations on the launch!',
      fromName: 'Priya',
    });
  },
);

test('every mode: html[data-mode] and body background match ui.ground', { timeout: 30000 }, async () => {
  for (const mode of MODES) {
    // Created directly through the API — this loop is about the mode's
    // rendered colors, not the create form (already exercised above).
    // eslint-disable-next-line no-await-in-loop
    const id = await createLive({
      mode: mode.id,
      message: `A ${mode.name} bouquet for the palette check.`,
      client_nonce: `e2e-mode-check-${mode.id}`,
    });

    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    const errors = trackErrors(page);

    // eslint-disable-next-line no-await-in-loop
    await page.goto(`${base}/b/${id}`);
    // eslint-disable-next-line no-await-in-loop
    await page.waitForSelector('[data-reveal-stage]');

    // eslint-disable-next-line no-await-in-loop
    const dataMode = await page.getAttribute('html', 'data-mode');
    assert.equal(dataMode, mode.id);

    // eslint-disable-next-line no-await-in-loop
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, hexToRgb(mode.ui.ground), `body background for mode "${mode.id}"`);

    assert.deepEqual(errors, [], `console/page errors for mode "${mode.id}":\n${errors.join('\n')}`);

    // eslint-disable-next-line no-await-in-loop
    await context.close();
  }
});
