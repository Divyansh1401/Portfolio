/**
 * verify-bouquet-loader.js — the first-paint bouquet loader on index.html.
 *
 * The loader skips itself under navigator.webdriver so every other suite is
 * unaffected; this one forces it with ?loader and checks the lifecycle: overlay
 * first, scroll locked, lands, waits for scroll, wheel scrubs q both ways
 * without moving the page, hands off, unlocks. Plus the skip rules a visitor
 * hits: deep link, reduced motion, once per tab.
 *
 * Run:  node tests/verify-bouquet-loader.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');
const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto(BASE + '/?loader', { waitUntil: 'domcontentloaded' });
  ok('overlay is the first child of body', await page.evaluate(() => document.body.firstElementChild.id === 'bq-loader'));
  ok('overlay visible', await page.evaluate(() => !document.getElementById('bq-loader').hidden));
  ok('scroll locked', await page.evaluate(() => document.documentElement.classList.contains('bq-lock')));
  ok('overlay above the nav and cursor', await page.evaluate(() => +getComputedStyle(document.getElementById('bq-loader')).zIndex > Math.max(...[...document.querySelectorAll('#main-nav,#custom-cursor,#cursor-ring')].map(e => +getComputedStyle(e).zIndex || 0))));
  await page.waitForFunction(() => document.getElementById('bq-loader').__state().phase === 'scroll', { timeout: 8000 });
  ok('lands and waits for scroll', true);
  await wait(1200);
  ok('does not leave on its own', await page.evaluate(() => !!document.getElementById('bq-loader')));
  const st = () => page.evaluate(() => document.getElementById('bq-loader').__state());
  await page.mouse.move(700, 450);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel({ deltaY: 100 }); await wait(40); }
  await wait(500);
  const s1 = await st(); ok('wheel down scrubs the dispersal', s1.qShown > 0.1 && s1.qShown < 0.8, 'q ' + s1.qShown.toFixed(3));
  ok('page did not scroll', (await page.evaluate(() => scrollY)) === 0);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel({ deltaY: -100 }); await wait(40); }
  await wait(500);
  const s2 = await st(); ok('wheel up reassembles', s2.qShown < s1.qShown - 0.1, 'q ' + s2.qShown.toFixed(3));
  for (let i = 0; i < 14; i++) { await page.mouse.wheel({ deltaY: 200 }); await wait(30); }
  await page.waitForFunction(() => !document.getElementById('bq-loader'), { timeout: 6000 });
  ok('hands off once scrolled through', true);
  ok('scroll unlocked', await page.evaluate(() => !document.documentElement.classList.contains('bq-lock')));
  ok('remembered for this tab', await page.evaluate(() => sessionStorage.getItem('bq-seen') === '1'));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await wait(300);
  const d = await page.evaluate(() => BouquetLoader.shouldRun());
  ok('second load in the same tab skips', !d.run && /bq-seen/.test(d.why), d.why);

  const skip = async (url, rm) => { const p = await browser.newPage(); if (rm) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await p.goto(url, { waitUntil: 'domcontentloaded' }); await wait(300); const gone = await p.evaluate(() => !document.getElementById('bq-loader')); await p.close(); return gone; };
  ok('deep link #settlr skips', await skip(BASE + '/?loader#settlr'));
  ok('reduced motion skips', await skip(BASE + '/?loader', true));
  ok('plain headless load skips (webdriver) so the other suites are untouched', await skip(BASE + '/'));
  ok('zero console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
  await browser.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
