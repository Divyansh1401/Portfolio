/**
 * verify-cards.js — featured/film card stacks + the media theatres.
 *
 * Covers two behaviours that were both bugs at some point:
 *   - the LAST card in a stack must recede into the deck before the stack
 *     scrolls out (nothing drives it automatically — there is no next card to
 *     cover it, so initCardStack drives it from the container's bottom edge).
 *   - the featured cards' 2-slide theatres must cycle, and their images must
 *     actually load (they are real photography, not the old thumbnails).
 *
 * Run:  node tests/verify-cards.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const results = [];
const check = (label, pass, detail) => results.push({ label, pass: !!pass, detail });
const wait = ms => new Promise(r => setTimeout(r, ms));

// Walk a stack's last card to a given fraction of its pinned dwell.
async function atDwell(page, stackId, frac) {
  return page.evaluate(({ id, frac }) => {
    const stack = document.getElementById(id);
    const panels = [...stack.querySelectorAll('.card-stack__panel')];
    const last = panels[panels.length - 1];
    const pinTop = parseFloat(getComputedStyle(last).top);
    const mb = parseFloat(getComputedStyle(last).marginBottom) || 0;
    const spacer = stack.querySelector('.card-stack__end').offsetHeight;
    const releaseAt = pinTop + last.offsetHeight + mb;
    const targetBottom = releaseAt + spacer - frac * spacer;
    const cur = stack.getBoundingClientRect().bottom;
    window.scrollTo(0, window.scrollY + (cur - targetBottom));
    return null;
  }, { id: stackId, frac });
}

const scaleOf = (page, stackId, idx) => page.evaluate(({ id, idx }) => {
  const p = document.querySelectorAll('#' + id + ' .card-stack__panel');
  const el = idx < 0 ? p[p.length + idx] : p[idx];
  const m = /scale\(([\d.]+)\)/.exec(el.style.transform || '');
  return m ? parseFloat(m[1]) : null;
}, { id: stackId, idx });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const errors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(1300);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  // ── Theatres: two slides each, all images decoded, dots cycle ──────────
  const theatres = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.cs2-theatre').forEach(t => {
      const panel = t.closest('.cs2-panel');
      out.push({
        panel: (String(panel.className).match(/cs2-panel--(\w+)/) || [])[1],
        slides: [...t.querySelectorAll('.cs2-slide img')].map(i => ({
          src: i.getAttribute('src'), loaded: i.complete && i.naturalWidth > 0 })),
        dots: t.querySelectorAll('.cs2-dot').length,
      });
    });
    return out;
  });
  check('both featured cards run a theatre', theatres.length === 2,
        theatres.map(t => t.panel).join(', '));
  theatres.forEach(t => {
    check(t.panel + ': 2 slides + 2 dots', t.slides.length === 2 && t.dots === 2,
          t.slides.length + ' slides / ' + t.dots + ' dots');
    check(t.panel + ': every slide image loaded', t.slides.every(s => s.loaded),
          t.slides.map(s => s.src.split('/').pop()).join(', '));
  });

  // Dot click advances and updates the caption
  const dotNav = await page.evaluate(async () => {
    const t = document.querySelector('.cs2-panel--settlr .cs2-theatre');
    const before = t.querySelector('.cs2-cap-text').textContent;
    t.querySelectorAll('.cs2-dot')[1].click();
    await new Promise(r => setTimeout(r, 1200));
    const after = t.querySelector('.cs2-cap-text').textContent;
    const onIdx = [...t.querySelectorAll('.cs2-slide')].findIndex(s => s.classList.contains('on'));
    const pressed = t.querySelectorAll('.cs2-dot')[1].getAttribute('aria-pressed');
    return { changed: before !== after, onIdx, pressed, after };
  });
  check('dot nav advances the slide + caption', dotNav.changed && dotNav.onIdx === 1, dotNav.after);
  check('active dot reports aria-pressed=true', dotNav.pressed === 'true', dotNav.pressed);

  // ── Last-card recede, both stacks ──────────────────────────────────────
  for (const stackId of ['featuredStack', 'filmStack']) {
    if (stackId === 'filmStack') {
      // Film lives in the dark world — enter it first.
      await page.evaluate(() => { location.hash = '#hobbies'; });
      await wait(1800);
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    }
    const exists = await page.evaluate(id => !!document.getElementById(id), stackId);
    if (!exists) { check(stackId + ' present', false); continue; }

    await atDwell(page, stackId, 0);    await wait(320);
    const atPin = await scaleOf(page, stackId, -1);
    await atDwell(page, stackId, 0.5);  await wait(320);
    const atMid = await scaleOf(page, stackId, -1);
    await atDwell(page, stackId, 1);    await wait(320);
    const atEnd = await scaleOf(page, stackId, -1);

    check(stackId + ': last card starts at full size when it pins',
          atPin !== null && atPin > 0.985, String(atPin));
    check(stackId + ': last card is mid-recede halfway through the dwell',
          atMid !== null && atMid < atPin - 0.01 && atMid > atEnd + 0.005,
          atPin + ' -> ' + atMid + ' -> ' + atEnd);
    check(stackId + ': last card reaches deck scale before release',
          atEnd !== null && atEnd < 0.93, String(atEnd));

    // Earlier cards must already be settled and NOT regress
    const first = await scaleOf(page, stackId, 0);
    check(stackId + ': earlier cards stay settled in the deck',
          first !== null && first < 0.87, String(first));
  }

  const passed = results.filter(r => r.pass).length;
  results.forEach(r => console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.label + (r.detail ? '  [' + r.detail + ']' : '')));
  console.log('\n' + passed + '/' + results.length + ' passed');
  console.log('console/page errors: ' + errors.length + '   4xx/5xx: ' + bad.length);
  errors.slice(0, 8).forEach(e => console.log('  ! ' + e));
  bad.slice(0, 8).forEach(e => console.log('  ! ' + e));

  await browser.close();
  process.exit(passed === results.length && errors.length === 0 && bad.length === 0 ? 0 : 1);
})();
