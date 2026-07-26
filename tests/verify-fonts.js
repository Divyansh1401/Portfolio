/**
 * verify-fonts.js — subset webfont coverage guard.
 *
 * The three variable fonts are SUBSET to only the characters the site renders
 * (Unbounded 1138 -> 114 codepoints, 252 -> 44 KB). That is a large win and a
 * standing hazard: new copy using a glyph outside the subset renders in a
 * fallback face, which looks broken and is easy to miss.
 *
 * This walks every state (light, dark, both case overlays, resume, lightbox,
 * mobile feed light + dark), collects the characters actually rendered in each
 * webfont, and asks the browser via document.fonts.check() whether the loaded
 * font really covers them. Anything uncovered must be on KNOWN_FALLBACK —
 * characters the ORIGINAL fonts never had either, so they fell back before the
 * subset too and nothing regressed.
 *
 * If this fails: either re-run the subset including the new glyph (see
 * TODO §18 for the pipeline), or change the copy.
 *
 * Run:  node tests/verify-fonts.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

// Characters absent from the ORIGINAL fonts too — verified against each font's
// cmap at subset time. They fell back to a system face before this change and
// still do; excluding them from the subset changed nothing.
const KNOWN_FALLBACK = '⇄─═☕♠♣♥♦✓✕︎📁';

const COLLECT = `(() => {
  const out = {};
  const add = (fam, s) => { (out[fam] = out[fam] || new Set()); for (const c of s) if (c.trim()) out[fam].add(c); };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue; if (!t || !t.trim()) continue;
    const el = n.parentElement; if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), t);
  }
  for (const el of document.querySelectorAll('*')) {
    for (const ps of ['::before', '::after']) {
      const cs = getComputedStyle(el, ps);
      const m = (cs.content || '').match(/^"(.*)"$/s); if (!m) continue;
      add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), m[1]);
    }
  }
  const r = {}; for (const k in out) r[k] = [...out[k]].join('');
  return r;
})()`;

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const acc = {};
  const merge = o => { for (const k in o) { acc[k] = acc[k] || new Set(); for (const c of o[k]) acc[k].add(c); } };
  const errs = [];

  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.fonts.ready);
  await wait(1200);
  merge(await p.evaluate(COLLECT));
  for (const h of ['#settlr', '#refer-earn', '#resume', '#hobbies', '#photo-3']) {
    await p.evaluate(x => { location.hash = x; }, h);
    await wait(1700);
    merge(await p.evaluate(COLLECT));
  }
  await p.evaluate(() => { location.hash = ''; });
  await wait(3000);                       // let the nav typewriter cycle both strings
  merge(await p.evaluate(COLLECT));

  // Ask the browser whether the LOADED font covers each collected character.
  const verdict = await p.evaluate(async (families) => {
    await document.fonts.ready;
    const res = {};
    for (const [fam, chars] of Object.entries(families)) {
      const bad = [];
      for (const ch of chars) if (!document.fonts.check(`700 16px "${fam}"`, ch)) bad.push(ch);
      res[fam] = bad.join('');
    }
    return res;
  }, Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, [...v].join('')])));
  await p.close();

  // mobile feed, both worlds
  const m = await b.newPage();
  await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errs.push(e.message));
  await m.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
  await m.evaluate(() => document.fonts.ready);
  await wait(1200);
  const mAcc = {};
  const mMerge = o => { for (const k in o) { mAcc[k] = mAcc[k] || new Set(); for (const c of o[k]) mAcc[k].add(c); } };
  mMerge(await m.evaluate(COLLECT));
  await m.evaluate(() => document.documentElement.classList.add('dark'));
  await wait(1200);
  mMerge(await m.evaluate(COLLECT));
  const mVerdict = await m.evaluate(async (families) => {
    await document.fonts.ready;
    const res = {};
    for (const [fam, chars] of Object.entries(families)) {
      const bad = [];
      for (const ch of chars) if (!document.fonts.check(`700 16px "${fam}"`, ch)) bad.push(ch);
      res[fam] = bad.join('');
    }
    return res;
  }, Object.fromEntries(Object.entries(mAcc).map(([k, v]) => [k, [...v].join('')])));
  await m.close();

  const WEBFONTS = ['Unbounded', 'Plus Jakarta Sans'];
  for (const [label, v, coll] of [['desktop', verdict, acc], ['mobile', mVerdict, mAcc]]) {
    for (const fam of WEBFONTS) {
      if (!(fam in v)) continue;
      const uncovered = [...(v[fam] || '')].filter(c => !KNOWN_FALLBACK.includes(c));
      ok(`${label}: ${fam} covers every rendered glyph (${coll[fam].size} distinct)`,
         uncovered.length === 0, uncovered.length ? 'UNCOVERED: ' + uncovered.join('') : 'ok');
    }
  }

  // The weight axis must survive subsetting — the site animates 200..900.
  const axis = await (async () => {
    const q = await b.newPage();
    await q.setViewport({ width: 1440, height: 900 });
    await q.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await q.evaluate(() => document.fonts.ready);
    const r = await q.evaluate(() => {
      const el = document.createElement('span');
      el.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-family:Unbounded;font-size:64px';
      el.textContent = 'Divyansh';
      document.body.appendChild(el);
      const widths = [200, 400, 700, 900].map(w => { el.style.fontWeight = w; return el.offsetWidth; });
      el.remove();
      return widths;
    });
    await q.close();
    return r;
  })();
  const monotonic = axis.every((w, i, a) => i === 0 || w >= a[i - 1]) && axis[3] > axis[0];
  ok('Unbounded weight axis still varies 200->900', monotonic, axis.join(' < '));

  console.log('\nconsole errors: ' + errs.length);
  console.log(failures ? failures + ' FAILED' : 'font subset coverage OK');
  await b.close();
  process.exit(failures === 0 && errs.length === 0 ? 0 : 1);
})();
