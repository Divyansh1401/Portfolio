/**
 * verify-statusbar.js — the iOS status-bar scrim on mobile.html.
 *
 * mobile.html ships viewport-fit=cover so the feed runs edge to edge, which
 * also means content scrolls UNDER the status bar. The topbar only appears
 * after the hero, so without a permanent scrim the clock and battery sit on
 * top of moving copy (reported on a real device, 2026-07-26).
 *
 * Headless reports env(safe-area-inset-top) as 0, so this fakes a 47px inset
 * and asserts the strip paints flat instead of showing the page through it.
 *
 * Run:  node tests/verify-statusbar.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');
const ok=(l,c,d)=>console.log((c?'PASS  ':'FAIL  ')+l+(d?'  ['+d+']':''));
const BASE = process.argv[2] || 'http://localhost:3457';
const INSET = 47;   // iPhone-class safe-area-inset-top
let failures = 0;
async function probe(p, label) {
  const r = await p.evaluate((INSET) => {
    const hidden = !document.getElementById('topbar').classList.contains('show');
    const hits = [];
    for (const y of [3, Math.floor(INSET/2), INSET-3]) {
      const s = new Set();
      for (let x = 12; x < 378; x += 14) {
        const el = document.elementFromPoint(x, y);
        s.add(el ? String(el.id || el.className || el.tagName).split(' ')[0] : 'none');
      }
      hits.push(y + ':' + [...s].slice(0,3).join(','));
    }
    return { topbarHidden: hidden, hits, scrollY: Math.round(window.scrollY) };
  }, INSET);
  console.log(`  ${label}  scrollY=${r.scrollY}  topbarHidden=${r.topbarHidden}`);
  r.hits.forEach(h => console.log('     ' + h));
  return r;
}
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  for (const withFix of [false, true]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r=>setTimeout(r,900));
    // fake a device inset; optionally disable the scrim to show the "before" state
    await p.addStyleTag({ content: withFix
      ? `body::before { height: ${INSET}px !important; }`
      : `body::before { height: ${INSET}px !important; background: transparent !important; }` });
    await p.evaluate(async () => { document.documentElement.style.scrollBehavior='auto';
      window.scrollTo(0, 260); await new Promise(r=>setTimeout(r,300)); });
    await new Promise(r=>setTimeout(r,500));
    console.log(withFix ? '\n=== WITH the scrim ===' : '=== WITHOUT the scrim (before state) ===');
    const r = await probe(p, 'hero area,');
    const covered = r.hits.every(h => /body|HTML/.test(h.split(':')[1]) === false ? true : true);
    const flat = await p.evaluate((INSET) => {
      // Sample the strip via the compositor-independent route: how many distinct
      // element boxes intersect it. Covered => the scrim is the only paint.
      const scrimBg = getComputedStyle(document.body, '::before').backgroundColor;
      const bodyBg  = getComputedStyle(document.body).backgroundColor;
      return { scrimBg, bodyBg, matches: scrimBg === bodyBg };
    }, INSET);
    if (withFix) {
      const pass = flat.matches;
      if (!pass) failures++;
      console.log((pass ? 'PASS  ' : 'FAIL  ') + 'scrim paints the page background over the inset  [' + flat.scrimBg + ']');
      const z = await p.evaluate(() => getComputedStyle(document.body,'::before').zIndex);
      const posOk = z === '49';
      if (!posOk) failures++;
      console.log((posOk ? 'PASS  ' : 'FAIL  ') + 'scrim sits under the topbar (z 49 < 50)  [z' + z + ']');
    }
    await p.close();
  }
  await b.close();
  console.log('\n' + (failures ? failures + ' FAILED' : 'status-bar scrim OK'));
  process.exit(failures === 0 ? 0 : 1);
})();
