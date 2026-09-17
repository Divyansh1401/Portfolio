/**
 * tests/beats/beat-1.test.js — "One brick size. Everything else follows from that."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-1's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-1', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-1 exists with the fixed markup', await page.evaluate(() => {
    const s = document.getElementById('beat-1');
    if (!s || s.dataset.beat !== '1') return false;
    if (!s.querySelector('.beat__pin')) return false;
    if (!s.querySelector('header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__stage');
    if (!stage || !stage.querySelector('canvas')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is <= 14 words and prose <= 60 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    const s = document.getElementById('beat-1');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('BouquetExplainer.beats["1"] registered with sizes/positions/cubes hooks', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['1'];
    return !!(b && typeof b.sizes === 'function' && typeof b.positions === 'function' && typeof b.cubes === 'function');
  }));

  // ---- canvas is DPR-sized ----
  const dprCheck = await page.evaluate(() => {
    const cv = document.querySelector('#beat-1 canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    return { width: cv.width, expected: Math.round(rect.width * dpr) };
  });
  ok('canvas.width === Math.round(clientWidth * dpr)', dprCheck.width === dprCheck.expected, JSON.stringify(dprCheck));

  // ---- Phase A: p ~ 0.3 -> squares not all size 1 yet ----
  await scrollBandFraction(page, 0.3);
  await wait(700);
  let sizes = await page.evaluate(() => BouquetExplainer.beats['1'].sizes());
  ok('p~0.3: 12 sizes exposed, not all snapped to 1', sizes.length === 12 && sizes.some(s => Math.abs(s - 1) > 0.01), JSON.stringify(sizes));

  // ---- Phase A end: p = 0.55 -> all size 1, all on-grid ----
  // (waits long enough for the harness's own eased scrub to fully settle
  // PLUS the counter's own 240ms tick tween to finish landing on its value)
  await scrollBandFraction(page, 0.55);
  await wait(1400);
  sizes = await page.evaluate(() => BouquetExplainer.beats['1'].sizes());
  ok('p=0.55: all 12 sizes are exactly 1', sizes.length === 12 && sizes.every(s => s === 1), JSON.stringify(sizes));
  const positions = await page.evaluate(() => BouquetExplainer.beats['1'].positions());
  ok('p=0.55: all 12 positions are on integer grid points', positions.length === 12 && positions.every(p => Number.isInteger(p.gx) && Number.isInteger(p.gz)), JSON.stringify(positions));
  let counterText = await page.evaluate(() => ({
    sizes: document.querySelector('#beat-1 .counter b[data-name="sizes"]').textContent,
    grid: document.querySelector('#beat-1 .counter b[data-name="grid"]').textContent
  }));
  ok('p=0.55: counters read 1 / 12', counterText.sizes === '1' && counterText.grid === '12', JSON.stringify(counterText));

  // ---- Phase B end: p = 1 -> 15 cubes, painter-sorted by gx+gz (ties by gy) ----
  await scrollBandFraction(page, 1);
  await wait(1400);
  const cubes = await page.evaluate(() => BouquetExplainer.beats['1'].cubes());
  ok('p=1: 15 cubes total', cubes.length === 15, 'count=' + cubes.length);
  const sorted = cubes.every((c, i) => i === 0 || cubes[i - 1].depth <= c.depth || (cubes[i - 1].depth === c.depth));
  let painterOk = true;
  for (let i = 1; i < cubes.length; i++){
    if (cubes[i].depth < cubes[i - 1].depth) { painterOk = false; break; }
    if (cubes[i].depth === cubes[i - 1].depth && cubes[i].gy < cubes[i - 1].gy) { painterOk = false; break; }
  }
  ok('p=1: cubes() is painter-sorted (depth ascending, gy ascending within a depth)', painterOk, JSON.stringify(cubes.map(c => [c.depth, c.gy])));
  ok('p=1: exactly 3 cubes at gy=1 (the stacked ones)', cubes.filter(c => c.gy === 1).length === 3);
  counterText = await page.evaluate(() => ({
    sizes: document.querySelector('#beat-1 .counter b[data-name="sizes"]').textContent,
    grid: document.querySelector('#beat-1 .counter b[data-name="grid"]').textContent
  }));
  ok('p=1: counters still read 1 / 12', counterText.sizes === '1' && counterText.grid === '12', JSON.stringify(counterText));
  const captionText = await page.evaluate(() => document.querySelector('#beat-1 .beat-1__caption').textContent);
  ok('p=1: caption reads the Phase B line', captionText === 'same bricks, seen from the corner', captionText);

  // ---- calm() after leave: back to Phase A start, sizes mixed again ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  sizes = await page.evaluate(() => BouquetExplainer.beats['1'].sizes());
  ok('onLeave calms back to mixed sizes (not all 1)', sizes.some(s => Math.abs(s - 1) > 0.01), JSON.stringify(sizes));
  counterText = await page.evaluate(() => ({
    sizes: document.querySelector('#beat-1 .counter b[data-name="sizes"]').textContent,
    grid: document.querySelector('#beat-1 .counter b[data-name="grid"]').textContent
  }));
  ok('onLeave: counters reset to 5 / 0', counterText.sizes === '5' && counterText.grid === '0', JSON.stringify(counterText));
  const captionAfterLeave = await page.evaluate(() => document.querySelector('#beat-1 .beat-1__caption').textContent);
  ok('onLeave: caption cleared', captionAfterLeave === '');

  // ---- idle cost zero: no rAF once fully off-screen ----
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-1 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- no horizontal overflow at 375 ----
  {
    const browser = page.browser();
    const mp = await browser.newPage();
    const mErrors = [];
    mp.on('console', m => { if (m.type() === 'error') mErrors.push(m.text()); });
    mp.on('pageerror', e => mErrors.push('pageerror: ' + e.message));
    await mp.setViewport({ width: 375, height: 812 });
    await mp.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok('375px: no horizontal overflow', !overflow);
    ok('375px: zero console errors', mErrors.length === 0, mErrors.join(' | ').slice(0, 300));
    await mp.close();
  }

  // ---- reduced motion: static Phase B end state, counters 1 / 12 ----
  {
    const browser = page.browser();
    const pr = await browser.newPage();
    const rErrors = [];
    pr.on('console', m => { if (m.type() === 'error') rErrors.push(m.text()); });
    pr.on('pageerror', e => rErrors.push('pageerror: ' + e.message));
    await pr.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pr.setViewport({ width: 1440, height: 900 });
    await pr.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    const rCubes = await pr.evaluate(() => BouquetExplainer.beats['1'].cubes());
    ok('reduced motion: static Phase B end (15 cubes)', rCubes.length === 15, 'count=' + rCubes.length);
    const rCounters = await pr.evaluate(() => ({
      sizes: document.querySelector('#beat-1 .counter b[data-name="sizes"]').textContent,
      grid: document.querySelector('#beat-1 .counter b[data-name="grid"]').textContent
    }));
    ok('reduced motion: counters read 1 / 12', rCounters.sizes === '1' && rCounters.grid === '12', JSON.stringify(rCounters));
    ok('reduced motion: exactly one .is-hot counter', await pr.evaluate(() =>
      document.querySelectorAll('#beat-1 .counter b.is-hot').length === 1));

    // scrolling must not move it — no scrub wiring under reduced motion
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-1').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const rCubes2 = await pr.evaluate(() => BouquetExplainer.beats['1'].cubes());
    ok('reduced motion: scrolling does not change the static state', rCubes2.length === 15, 'count=' + rCubes2.length);
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }
};
