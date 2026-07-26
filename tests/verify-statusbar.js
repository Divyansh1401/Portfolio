/**
 * verify-statusbar.js — the iOS status-bar plate on mobile.html.
 *
 * The bug (reported from a real device, 2026-07-26): when iOS Safari's address
 * bar minimizes on scroll, the OS paints the document canvas ABOVE the layout
 * viewport behind the status bar, so scrolled-past copy shows crisp under the
 * clock. env(safe-area-inset-top) is 0 in portrait Safari (Apple forums thread
 * 699415), so an inset-height scrim is inert there — the first attempt at this
 * fix made exactly that mistake. The shipped fix is a fixed plate hung at
 * top:-80px that only ever renders inside Safari's above-viewport bleed,
 * filling it with flat page background.
 *
 * Headless cannot reproduce the bleed, so this suite asserts the GEOMETRY
 * CONTRACT instead: the plate exists, hangs fully above the viewport (bottom
 * edge exactly at y=0 when the inset is 0, so it can never cover layout
 * content), tracks the page background through the world flip, and stays
 * under the topbar. The on-device look still needs a human eye.
 *
 * Run:  node tests/verify-statusbar.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.getElementById('topbar'), { timeout: 8000 });

  const plate = await p.evaluate(() => {
    const s = getComputedStyle(document.body, '::before');
    return { pos: s.position, top: s.top, height: s.height, z: s.zIndex,
             bg: s.backgroundColor, bodyBg: getComputedStyle(document.body).backgroundColor };
  });
  ok('plate is fixed at top:-80px', plate.pos === 'fixed' && plate.top === '-80px', plate.pos + ' ' + plate.top);
  // height = 80px + env(inset-top); headless inset is 0 => exactly 80px, i.e.
  // the bottom edge sits at y=0 and the plate can never cover layout content.
  ok('plate bottom edge lands exactly at viewport top (env=0 => 80px tall)', plate.height === '80px', plate.height);
  ok('plate paints the page background', plate.bg === plate.bodyBg, plate.bg);
  ok('plate sits under the topbar (z 49 < 50)', plate.z === '49', 'z' + plate.z);

  // The topbar's own treatment was reverted to the original 86% on owner
  // instruction — guard against it silently creeping back up.
  const bar = await p.evaluate(() => getComputedStyle(document.getElementById('topbar')).backgroundColor);
  ok('topbar opacity is the original 86%', /0\.86\)/.test(bar), bar);

  // Dark world: the plate must follow the flip, or the bleed strip flashes
  // cream over the dark feed.
  await p.evaluate(() => document.documentElement.classList.add('dark'));
  await new Promise(r => setTimeout(r, 700));
  const dark = await p.evaluate(() => ({
    plate: getComputedStyle(document.body, '::before').backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
  }));
  ok('plate follows the dark world', dark.plate === dark.body, dark.plate);

  console.log('\nconsole errors: ' + errs.length);
  errs.slice(0, 5).forEach(e => console.log('  ! ' + e));
  console.log(failures ? failures + ' FAILED' : 'status-bar plate contract OK — on-device look still needs a human eye');
  await b.close();
  process.exit(failures === 0 && errs.length === 0 ? 0 : 1);
})();
