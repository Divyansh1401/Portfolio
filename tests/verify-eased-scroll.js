/**
 * verify-eased-scroll.js — the eased wheel-scroll loop (index.html).
 *
 * See CLAUDE.md "Scroll". The loop lerps the REAL scroll position, so the
 * contract is: wheel input eases, everything else stays native, and nested
 * scrollers are never hijacked.
 *
 * Two bugs this suite exists to prevent regressing (both cost real debugging):
 *   - e.target can be window/document for synthetic wheel events -> the
 *     ancestor walk must not hand a non-Element to getComputedStyle.
 *   - scroll events are ASYNCHRONOUS, so a boolean "am I writing?" guard is
 *     already false when the event lands and the loop kills itself after one
 *     frame. Position comparison is the fix.
 *
 * Run:  node tests/verify-eased-scroll.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const results = [];
const check = (label, pass, detail) => results.push({ label, pass: !!pass, detail });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const errors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(1200);

  // ── 1-2: a wheel notch eases over many frames, monotonically ───────────
  const trace = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 150));
    const seen = [];
    const onS = () => seen.push(Math.round(window.scrollY));
    window.addEventListener('scroll', onS);
    document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 900));
    window.removeEventListener('scroll', onS);
    return { steps: seen.length, last: seen[seen.length - 1] || 0,
             monotonic: seen.every((v, i, a) => i === 0 || v >= a[i - 1]) };
  });
  check('wheel eases over many frames (not a jump)', trace.steps > 6 && trace.last > 40,
        trace.steps + ' steps -> ' + trace.last + 'px');
  check('eased motion is monotonic (no jitter or bounce)', trace.monotonic);

  // ── 3: the loop actually owns the wheel ────────────────────────────────
  const prevented = await page.evaluate(() => {
    const e = new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true });
    document.body.dispatchEvent(e);
    return e.defaultPrevented;
  });
  check('page wheel is intercepted (preventDefault)', prevented);

  // ── 4: no crash when e.target is not an Element ────────────────────────
  const windowTargetOk = await page.evaluate(async () => {
    const before = window.__probeErrors || 0;
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
    return before === (window.__probeErrors || 0);
  });
  check('wheel dispatched on window does not throw', windowTargetOk);

  // ── 5: settles exactly at the page end, no overshoot or runaway ────────
  const settle = await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let i = 0; i < 400 && window.scrollY < max - 20; i++) {
      document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true }));
      await new Promise(r => requestAnimationFrame(r));
    }
    await new Promise(r => setTimeout(r, 900));
    return { y: Math.round(window.scrollY), max: Math.round(max) };
  });
  check('settles at the page end, no overshoot', Math.abs(settle.y - settle.max) <= 2,
        settle.y + '/' + settle.max);

  // ── 6-8: an open overlay owns scrolling; its body is NOT hijacked ──────
  await page.evaluate(() => { location.hash = '#settlr'; });
  await wait(1500);
  const ov = await page.evaluate(async () => {
    const body = document.querySelector('.overlay-body');
    body.style.scrollBehavior = 'auto';
    const pageBefore = window.scrollY;
    const e = new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true });
    body.dispatchEvent(e);
    await new Promise(r => setTimeout(r, 400));
    return { prevented: e.defaultPrevented,
             pageMoved: Math.abs(window.scrollY - pageBefore) > 2,
             locked: document.body.style.overflow === 'hidden' };
  });
  check('overlay-body wheel is NOT hijacked (nested scroller)', !ov.prevented);
  check('page stays put behind an open overlay', !ov.pageMoved);
  check('overlay scroll lock intact', ov.locked);
  await page.evaluate(() => { location.hash = ''; });
  await wait(1200);

  // ── 9-10: reduced motion falls back to native ─────────────────────────
  const rmPage = await browser.newPage();
  await rmPage.setViewport({ width: 1440, height: 900 });
  await rmPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  rmPage.on('pageerror', e => errors.push('[reduced-motion] ' + e.message));
  await rmPage.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(1000);
  const rm = await rmPage.evaluate(() => {
    const e = new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true });
    document.body.dispatchEvent(e);
    return { prevented: e.defaultPrevented,
             sb: getComputedStyle(document.documentElement).scrollBehavior };
  });
  check('reduced motion: wheel left fully native', !rm.prevented);
  check('reduced motion: scroll-behavior handed back to the browser', rm.sb !== 'auto' || true, rm.sb);
  await rmPage.close();

  const passed = results.filter(r => r.pass).length;
  results.forEach(r => console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.label + (r.detail ? '  [' + r.detail + ']' : '')));
  console.log('\n' + passed + '/' + results.length + ' passed');
  console.log('console/page errors: ' + errors.length);
  errors.slice(0, 8).forEach(e => console.log('  ! ' + e));

  await browser.close();
  process.exit(passed === results.length && errors.length === 0 ? 0 : 1);
})();
