/**
 * @file End-to-end browser test for the whole bouquet loop, driven with
 * real Chromium (playwright-core) against a live `createServer` instance
 * (`dbPath: ':memory:'`).
 *
 * Covers (CONTRACT.md §§3, 5, 6):
 *  - the sender flow on / (pick a mode, write a note, pay if needed, create
 *    a link) at 390x844 (hasTouch, isMobile) and at 1440x900;
 *  - the recipient page (a port of the owner's birthday page): the Open
 *    gate, the fly-in, then scrolling the whole timeline (script scroll on
 *    the phone, the mouse wheel on desktop) down to "send one back";
 *  - the recipient always opens the link in a FRESH browser context (no
 *    sender-side storage/session carries over);
 *  - the note shown one word per scroll + from-name, the reply link's href, and
 *    that following it preselects the replied-to bouquet's mode on /;
 *  - GET /api/bouquet/:id/summary never includes the message;
 *  - zero console errors / page errors on every page visited;
 *  - for each of the 5 modes, html[data-mode] and the dome colour match the
 *    flower, with the page's ink readable on both the dome and white;
 *  - a gift under the scratch foil (keyboard reveal).
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

/** WCAG contrast of two #rrggbb colours. */
function contrastHex(a, b) {
  const lum = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Opens the recipient gate and waits for the fly-in to land (scroll unlocks).
 * @param {import('playwright-core').Page} page
 */
async function openBouquet(page) {
  await page.click('#open');
  await page.waitForFunction(() => !document.documentElement.classList.contains('locked'), null, { timeout: 12000 });
}

/**
 * Scrolls the recipient timeline and collects every word that became
 * visible, in order.
 * @param {import('playwright-core').Page} page
 * @param {'script'|'wheel'} how
 */
async function scrollThrough(page, how) {
  const seen = [];
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y <= total + vh; y += Math.round(vh * 0.25)) {
    if (how === 'wheel') await page.mouse.wheel(0, Math.round(vh * 0.25));
    else await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
    const w = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#words b')].find((x) => parseFloat(x.style.opacity) > 0.5);
      return b ? b.textContent : null;
    });
    if (w && seen[seen.length - 1] !== w) seen.push(w);
  }
  return seen;
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
 * @param {{viewport: {width:number, height:number}, hasTouch?: boolean, isMobile?: boolean, revealMethod: 'script'|'wheel', mode: string, message: string, fromName: string}} opts
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
  await recipientPage.waitForSelector('#open');
  assert.match(await recipientPage.textContent('#gate-from'), new RegExp(fromName, 'i'));
  await openBouquet(recipientPage);
  if (revealMethod === 'wheel') {
    const box = await recipientPage.evaluate(() => [innerWidth / 2, innerHeight / 2]);
    await recipientPage.mouse.move(box[0], box[1]);
  }
  const seen = await scrollThrough(recipientPage, revealMethod);
  const expected = [...message.split(/\s+/), 'from', ...fromName.split(/\s+/)];
  assert.deepEqual(seen, expected, 'every word of the note shows, in order, one per scroll beat');

  // No countdown and no gifts: the page ends on "send one back".
  await recipientPage.waitForFunction(() => document.getElementById('end').classList.contains('live'), null, { timeout: 5000 });
  const replyHref = await recipientPage.getAttribute('#send-back', 'href');
  assert.equal(replyHref, `/?reply=${encodeURIComponent(id)}`);

  assert.deepEqual(
    recipientErrors,
    [],
    `recipient page (/b/${id}) had console/page errors:\n${recipientErrors.join('\n')}`,
  );

  // ---- follow "Send one back" and assert the reply preselect on / ----
  await recipientPage.click('#send-back');
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
  'full loop: 390x844 touch device, open then scroll',
  { timeout: 60000 },
  async () => {
    await runFullLoop({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      revealMethod: 'script',
      mode: 'sunflower',
      message: 'Thinking of you today, sending flowers.',
      fromName: 'Ada',
    });
  },
);

test(
  'full loop: 1440x900 desktop, open then mouse wheel',
  { timeout: 60000 },
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

test('every mode: html[data-mode] and the dome match the flower; the ink reads on the dome and on white', { timeout: 30000 }, async () => {
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
    await page.waitForSelector('#open');

    // eslint-disable-next-line no-await-in-loop
    const dataMode = await page.getAttribute('html', 'data-mode');
    assert.equal(dataMode, mode.id);

    // eslint-disable-next-line no-await-in-loop
    const c = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return { blush: cs.getPropertyValue('--blush').trim(), ink: cs.getPropertyValue('--ink').trim(), strong: cs.getPropertyValue('--ink-strong').trim() };
    });
    assert.equal(c.blush.toLowerCase(), mode.bouquet.petals[2].toLowerCase(), `the dome is ${mode.id}'s light petal colour`);
    for (const bg of [c.blush, '#ffffff']) {
      assert.ok(contrastHex(c.ink, bg) >= 3, `${mode.id}: word ink ${c.ink} on ${bg} is ${contrastHex(c.ink, bg).toFixed(2)} (need 3 for large text)`);
      assert.ok(contrastHex(c.strong, bg) >= 4.5, `${mode.id}: label ink ${c.strong} on ${bg} is ${contrastHex(c.strong, bg).toFixed(2)} (need 4.5)`);
    }

    assert.deepEqual(errors, [], `console/page errors for mode "${mode.id}":\n${errors.join('\n')}`);

    // eslint-disable-next-line no-await-in-loop
    await context.close();
  }
});

test('a gift: the card waits under the foil at the end, and a key takes the foil off', { timeout: 60000 }, async () => {
  const id = await createLive({
    mode: 'rose',
    message: 'For you',
    gifts: [{ kind: 'code', label: 'Book voucher', code: 'READ-4471' }],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = trackErrors(page);
  await page.goto(`${base}/b/${id}`);
  await openBouquet(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => parseFloat(document.getElementById('cardWrap').style.opacity) > 0.95, null, { timeout: 5000 });
  assert.equal(await page.$eval('#scratch', (el) => el.classList.contains('done')), false, 'the foil is on');
  await page.focus('#scratch');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('end').classList.contains('live'), null, { timeout: 5000 });
  assert.equal(await page.textContent('.face__code'), 'READ-4471');
  assert.deepEqual(errors, [], errors.join('\n'));
  await context.close();
});
