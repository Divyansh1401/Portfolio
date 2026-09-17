/**
 * tests/beats/beat-5.test.js — "Of 3,014 cubes, only 710 ever reach your eyes."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-5's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-5', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-5 exists with the fixed markup', await page.evaluate(() => {
    const s = document.getElementById('beat-5');
    if (!s || s.dataset.beat !== '5') return false;
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
    const s = document.getElementById('beat-5');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('prose states the model\'s own numbers (3,014 / 1,495 / 809 / 710) and they add up', await page.evaluate(() => {
    const t = document.querySelector('#beat-5 .beat__prose').textContent;
    return ['3,014', '1,495', '809', '710'].every(n => t.indexOf(n) !== -1) && 3014 - 1495 - 809 === 710;
  }));
  ok('BouquetExplainer.beats["5"] registered with a live api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['5'];
    return !!(b && b.api && typeof b.api.state === 'function');
  }));

  // ---- ftune(fillHollow:false) landed the counters' truth: 3014/1519/710 ----
  const sets = await page.evaluate(() => BouquetExplainer.beats['5'].api.sets());
  ok('sets() reads 3014 / 1519 / 710 for this beat\'s own canvas', sets.all === 3014 && sets.surface === 1519 && sets.visible === 710, JSON.stringify(sets));

  // ---- the four stage states, driven by scrolling the real page ----
  await scrollBandFraction(page, 0.15);
  await wait(700);
  let st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('Stage A (p~0.10): show="all", drawn = all count', st.show === 'all' && st.drawn === sets.all, JSON.stringify(st));

  await scrollBandFraction(page, 0.45);
  await wait(700);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('Stage B (p~0.35): show="surface", drawn = surface count', st.show === 'surface' && st.drawn === sets.surface, JSON.stringify(st));

  await scrollBandFraction(page, 0.75);
  await wait(700);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('Stage C pre-cut (p~0.60): show="surface" still, drawn = surface count', st.show === 'surface' && st.drawn === sets.surface, JSON.stringify(st));

  await scrollBandFraction(page, 0.95);
  await wait(700);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('Stage C post-cut (p~0.72): show="visible", drawn = visible count', st.show === 'visible' && st.drawn === sets.visible, JSON.stringify(st));
  ok('Stage C post-cut: yaw stays at 0', st.yaw === 0, 'yaw=' + st.yaw);

  await scrollBandFraction(page, 0.90);
  await wait(700);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('end (p~0.90 → still stage C): show="visible", drawn = visible count', st.show === 'visible' && st.drawn === sets.visible, JSON.stringify(st));
  ok('no rotation stage any more: yaw stays 0', st.yaw === 0, 'yaw=' + st.yaw);

  // ---- yaw 28 at p = 1 ----
  await scrollBandFraction(page, 1);
  await wait(700);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('p=1: yaw is 0 (front-on)', st.yaw === 0, 'yaw=' + st.yaw);
  ok('p=1: no caption (rotation stage removed)', await page.evaluate(() =>
    document.querySelector('#beat-5 .beat-5__caption').textContent === ''));

  // ---- the < 2% diff claim: show('surface') vs show('visible'), both at
  // yaw 0 with no tint/alpha overrides, should differ by < 2% of pixels
  // (the diagonally-hidden cubes were always fully covered from this angle;
  // the loader's own notes put the true difference around ~1,422px of 168k). ----
  const diffFraction = await page.evaluate(() => {
    const beat = BouquetExplainer.beats['5'];
    const api = beat.api;
    const cv = beat.stage.querySelector('canvas');
    api.setYaw(0); api.tint(null); api.alpha(null);

    api.show('surface');
    const a = document.createElement('canvas'); a.width = cv.width; a.height = cv.height;
    a.getContext('2d').drawImage(cv, 0, 0);

    api.show('visible');
    const b = document.createElement('canvas'); b.width = cv.width; b.height = cv.height;
    b.getContext('2d').drawImage(cv, 0, 0);

    const total = cv.width * cv.height;
    const d = BouquetExplainer.diff(a, b);
    return d.count / total;
  });
  ok('show("surface") vs show("visible") at yaw 0 differ by < 2% of pixels', diffFraction < 0.02, 'fraction=' + diffFraction.toFixed(4));

  // ---- calm() after leave: yaw 0, show 'auto' ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  st = await page.evaluate(() => BouquetExplainer.beats['5'].api.state());
  ok('onLeave calms to yaw 0, show "auto"', st.yaw === 0 && st.show === 'auto', JSON.stringify(st));
  ok('onLeave clears the caption', await page.evaluate(() =>
    document.querySelector('#beat-5 .beat-5__caption').textContent === ''));

  // ---- scrubbing back must reverse cleanly: 0 -> 1 -> 0 restores Stage A's frame ----
  await scrollBandFraction(page, 0);
  await wait(700);
  const frameAtZero = await page.evaluate(() => BouquetExplainer.beats['5'].stage.querySelector('canvas').toDataURL());
  await scrollBandFraction(page, 1);
  await wait(700);
  await scrollBandFraction(page, 0);
  await wait(700);
  const frameAfterRoundTrip = await page.evaluate(() => BouquetExplainer.beats['5'].stage.querySelector('canvas').toDataURL());
  ok('0 -> 1 -> 0 restores the exact Stage A frame', frameAtZero === frameAfterRoundTrip);

  // ---- idle cost zero: no rAF once fully off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300);
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-5 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- reduced motion: static Stage D end state, all three counters shown ----
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
    const rst = await pr.evaluate(() => BouquetExplainer.beats['5'].api.state());
    ok('reduced motion: static end (front-on, show visible)', rst.yaw === 0 && rst.show === 'visible', JSON.stringify(rst));
    const counterText = await pr.evaluate(() => ({
      all: document.querySelector('#beat-5 .counter b[data-name="all"]').textContent,
      surface: document.querySelector('#beat-5 .counter b[data-name="surface"]').textContent,
      visible: document.querySelector('#beat-5 .counter b[data-name="visible"]').textContent
    }));
    ok('reduced motion: all three counters shown (all/surface/visible)',
      counterText.all === '3,014' && counterText.surface === '1,519' && counterText.visible === '710',
      JSON.stringify(counterText));
    ok('reduced motion: exactly one .is-hot counter', await pr.evaluate(() =>
      document.querySelectorAll('#beat-5 .counter b.is-hot').length === 1));

    // scrolling must not move it — no scrub wiring under reduced motion
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-5').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const rst2 = await pr.evaluate(() => BouquetExplainer.beats['5'].api.state());
    ok('reduced motion: scrolling does not change the static state', rst2.yaw === 0 && rst2.show === 'visible', JSON.stringify(rst2));
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }
};
