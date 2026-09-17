/**
 * verify-bouquet-explainer.js — the twelve-beat scroll explainer on
 * bouquet.html. For now this only exercises beat 10 (the harness's proof)
 * plus the harness primitives (diff, reduced motion, idle-cost-zero); later
 * beats extend this file as they land. Same shape as verify-bouquet-doc.js.
 *
 * Run:  node tests/verify-bouquet-explainer.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');
const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

// scroll beat-10's own document so its top sits `fromBottom` px above the
// bottom of the viewport (fromBottom = innerHeight -> section top AT the
// bottom edge -> progress 0; fromBottom = innerHeight - band*innerHeight ->
// progress 1). Mirrors the mapping documented in bouquet-explainer.js.
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-10', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });

  await page.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.hero && hero.state().p >= 1, { timeout: 8000 });

  // ---- harness present, beat-10 mounted with the fixed markup ----
  ok('BouquetExplainer exposes the documented API', await page.evaluate(() =>
    !!(window.BouquetExplainer && BouquetExplainer.scrub && BouquetExplainer.mountBeat &&
       BouquetExplainer.split && BouquetExplainer.diff && BouquetExplainer.fmt && BouquetExplainer.ease)));
  ok('#beat-10 exists with the fixed markup', await page.evaluate(() => {
    const s = document.getElementById('beat-10');
    if (!s || s.dataset.beat !== '10') return false;
    if (!s.querySelector('header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__stage');
    if (!stage || !stage.querySelector('canvas')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is ≤ 14 words and prose ≤ 60 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    const s = document.getElementById('beat-10');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('beat title does not inherit the page h2 rule (no border-top)', await page.evaluate(() =>
    getComputedStyle(document.querySelector('#beat-10 .beat__title')).borderTopWidth === '0px'));
  ok('BouquetExplainer.beats["10"] registered with a live api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['10'];
    return !!(b && b.api && typeof b.api.state === 'function');
  }));

  // ---- capture the initial landed frame (q=0) before any scrubbing ----
  const initialFrame = await page.evaluate(() => {
    BouquetExplainer.beats['10'].api.setQ(0);
    return BouquetExplainer.beats['10'].stage.querySelector('canvas').toDataURL();
  });

  // ---- scrub 0 -> 1 -> 0 by scrolling the real page ----
  await scrollBandFraction(page, 0);
  await wait(900);
  const atStart = await page.evaluate(() => BouquetExplainer.beats['10'].api.state().q);
  ok('q starts at 0 before the band', atStart === 0, 'q=' + atStart);

  await scrollBandFraction(page, 1);
  await wait(1400);   // lerp settle (~800 ms from a cold seek) + the counter's 240 ms tick
  const atEnd = await page.evaluate(() => BouquetExplainer.beats['10'].api.state().q);
  ok('scrolling through the band drives q to ≥ 0.95', atEnd >= 0.95, 'q=' + atEnd);
  const qText = await page.evaluate(() => document.querySelector('#beat-10 .counter b[data-name="q"]').textContent);
  ok('the counter shows 1.00 at the end of the band', qText === '1.00', qText);

  await scrollBandFraction(page, 0);
  await wait(900);
  const backToZero = await page.evaluate(() => BouquetExplainer.beats['10'].api.state().q);
  ok('scrolling back drives q back to 0', backToZero === 0, 'q=' + backToZero);

  const endFrame = await page.evaluate(() =>
    BouquetExplainer.beats['10'].stage.querySelector('canvas').toDataURL());
  ok('end frame after 0→1→0 is byte-identical to the initial landed frame', endFrame === initialFrame);

  // ---- diff() ----
  const diffRes = await page.evaluate(() => {
    const cv = BouquetExplainer.beats['10'].stage.querySelector('canvas');
    const api = BouquetExplainer.beats['10'].api;
    api.setQ(0);
    const same = document.createElement('canvas'); same.width = cv.width; same.height = cv.height;
    same.getContext('2d').drawImage(cv, 0, 0);
    const identical = BouquetExplainer.diff(cv, same);
    api.setQ(0.3);
    const changed = document.createElement('canvas'); changed.width = cv.width; changed.height = cv.height;
    changed.getContext('2d').drawImage(cv, 0, 0);
    api.setQ(0); // leave the renderer landed for what follows
    const differing = BouquetExplainer.diff(same, changed);
    return { identicalCount: identical.count, differingCount: differing.count, heatIsCanvas: differing.heat instanceof HTMLCanvasElement };
  });
  ok('diff() returns count 0 for identical canvases', diffRes.identicalCount === 0, 'count=' + diffRes.identicalCount);
  ok('diff() returns count > 0 for q=0 vs q=0.3', diffRes.differingCount > 0, 'count=' + diffRes.differingCount);
  ok('diff() heat is a canvas', diffRes.heatIsCanvas);

  // ---- idle cost zero: no rAF once fully off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300); // let the IntersectionObserver leave-callback land
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-10 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- no horizontal overflow at 1440 / 375 ----
  ok('no horizontal overflow at 1440', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  { const p375 = await browser.newPage(); await p375.setViewport({ width: 375, height: 812 });
    await p375.goto(BASE + '/bouquet.html', { waitUntil: 'load' }); await wait(400);
    ok('no horizontal overflow at 375', await p375.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p375.close(); }

  // ---- reduced motion: q stays 0, static, no scrub ----
  { const pr = await browser.newPage();
    await pr.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pr.setViewport({ width: 1440, height: 900 });
    const rErrors = [];
    pr.on('console', m => { if (m.type() === 'error') rErrors.push(m.text()); });
    pr.on('pageerror', e => rErrors.push(e.message));
    await pr.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(300);
    const before = await pr.evaluate(() => BouquetExplainer.beats['10'].api.state().q);
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-10').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const after = await pr.evaluate(() => BouquetExplainer.beats['10'].api.state().q);
    ok('reduced motion: q stays at 0 and the beat is static', before === 0 && after === 0, 'before=' + before + ' after=' + after);
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close(); }

  // ── per-beat checks: tests/beats/beat-N.test.js, each `module.exports = async ({page, ok, wait, BASE}) => {}`.
  //    A fresh page per beat so one beat's scroll state can't leak into the next. ──
  const fs = require('fs'), path = require('path');
  const beatDir = path.join(__dirname, 'beats');
  const beatTests = fs.existsSync(beatDir) ? fs.readdirSync(beatDir).filter(f => /^beat-\d+\.test\.js$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])) : [];
  for (const f of beatTests) {
    const bp = await browser.newPage();
    await bp.setViewport({ width: 1440, height: 900 });
    const bErrors = [];
    bp.on('console', m => { if (m.type() === 'error') bErrors.push(m.text()); });
    bp.on('pageerror', e => bErrors.push('pageerror: ' + e.message));
    bp.on('response', r => { if (r.status() >= 400) bErrors.push(r.status() + ' ' + r.url()); });
    await bp.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    // the hero's own fly-in issues rAFs for ~4.5 s; let it land so idle-cost checks see a quiet page
    await bp.waitForFunction(() => window.hero && hero.state().p >= 1, { timeout: 10000 }).catch(() => {});
    await wait(300);
    console.log('── ' + f);
    try { await require(path.join(beatDir, f))({ page: bp, ok, wait, BASE }); }
    catch (e) { ok(f + ' threw', false, e.message); }
    ok(f + ': zero console errors / 4xx', bErrors.length === 0, bErrors.join(' | ').slice(0, 300));
    await bp.close();
  }

  ok('verify-bouquet-explainer: zero console errors / 4xx', errors.length === 0, errors.join(' | ').slice(0, 300));
  await browser.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
