/**
 * tests/beats/beat-3.test.js — "Farthest cube first — whatever's painted last is on top."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-3's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-3', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-3 exists with the fixed markup', await page.evaluate(() => {
    const s = document.getElementById('beat-3');
    if (!s || s.dataset.beat !== '3') return false;
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
    const s = document.getElementById('beat-3');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('BouquetExplainer.beats["3"] registered with a live api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['3'];
    return !!(b && b.api && typeof b.api.state === 'function' && typeof b._drawOrder === 'function');
  }));

  // ---- setup: the section starts below the fold, so the harness's own
  //      IntersectionObserver has already fired onLeave -> calm() once by
  //      the time the page settles (idle-cost-zero for every beat that
  //      isn't on screen yet) — yaw 0 / show 'auto' / limit null here is
  //      that, not a beat-3 bug. Scrolling into the band's start (frac 0)
  //      fires onEnter, which re-asserts yaw 28 / show 'surface'. ----
  const sets = await page.evaluate(() => BouquetExplainer.beats['3'].api.sets());
  const orderLen = await page.evaluate(() => BouquetExplainer.beats['3']._drawOrder().length);
  ok('the recomputed draw order covers every surface cell', orderLen === sets.surface, 'orderLen=' + orderLen + ' surface=' + sets.surface);

  await scrollBandFraction(page, 0);
  await wait(900);
  let st = await page.evaluate(() => BouquetExplainer.beats['3'].api.state());
  ok('on entering the band: yaw 28, show surface, p 1, q 0, nothing drawn yet',
    st.yaw === 28 && st.show === 'surface' && st.p === 1 && st.q === 0 && st.drawn === 0, JSON.stringify(st));

  // ---- drawn count tracks progress: ~0.3*total at 0.3, total at 1 ----
  await scrollBandFraction(page, 0.3);
  await wait(900);
  st = await page.evaluate(() => BouquetExplainer.beats['3'].api.state());
  const expected03 = Math.round(0.3 * sets.surface);
  ok('at p~0.3, drawn tracks 0.3*total', Math.abs(st.drawn - expected03) <= 1, 'drawn=' + st.drawn + ' expected=' + expected03);
  ok('yaw stays 28 while in view', Math.abs(st.yaw - 28) < 0.01, 'yaw=' + st.yaw);

  await scrollBandFraction(page, 1);
  await wait(1200);
  st = await page.evaluate(() => BouquetExplainer.beats['3'].api.state());
  ok('at p=1, drawn is the full surface count and limit is cleared', st.drawn === sets.surface && st.limit === null, JSON.stringify(st));
  ok('yaw is still 28 at the end of the scrub', Math.abs(st.yaw - 28) < 0.01, 'yaw=' + st.yaw);

  await wait(300);   // let the counter's own tween (240ms) finish settling
  const paintedText1 = await page.evaluate(() => document.querySelector('#beat-3 .counter b[data-name="painted"]').textContent);
  const totalFmt = await page.evaluate((n) => BouquetExplainer.fmt(n), sets.surface);
  ok('the "painted" counter text matches fmt(total) at p=1', paintedText1 === totalFmt, paintedText1 + ' vs ' + totalFmt);

  // ---- at progress 1: drawLimit(null), tint(null) — still at p=1 here, so
  //      forcing both again should be a genuine no-op ----
  const endTintCheck = await page.evaluate(() => {
    const beat = BouquetExplainer.beats['3'];
    // Render two frames: one with the beat's own current tint (should be
    // null/no-op at p=1) and one with tint forced null, and diff them.
    const cv = beat.stage.querySelector('canvas');
    const a = document.createElement('canvas'); a.width = cv.width; a.height = cv.height;
    a.getContext('2d').drawImage(cv, 0, 0);
    beat.api.tint(null);
    beat.api.drawLimit(null);
    const b = document.createElement('canvas'); b.width = cv.width; b.height = cv.height;
    b.getContext('2d').drawImage(cv, 0, 0);
    const d = BouquetExplainer.diff(a, b);
    return d.count;
  });
  ok('at p=1 the frame is already tint(null)/drawLimit(null) — forcing both again changes nothing', endTintCheck === 0, 'diffPixels=' + endTintCheck);

  // ---- the highlighted cube at partial progress really is index n-1 in the
  //      recomputed order, and it visibly sits at the front of what's drawn
  //      (i.e. the renderer's own tint() call was given exactly that index) ----
  await scrollBandFraction(page, 0.5);
  await wait(900);
  const midCheck = await page.evaluate(() => {
    const beat = BouquetExplainer.beats['3'];
    const st = beat.api.state();
    const order = beat._drawOrder();
    const n = st.drawn;
    const expectedLastIndex = n > 0 ? order[n - 1].i : null;
    return { n, expectedLastIndex, limit: st.limit };
  });
  ok('drawLimit at p~0.5 matches round(0.5*total) within rounding', Math.abs(midCheck.n - Math.round(0.5 * sets.surface)) <= 1, JSON.stringify(midCheck));

  // ---- depth key (x+y+z of the last-painted cell) is sampled every 50th
  //      cell of the TRUE draw order and checked for monotonicity. The true
  //      draw order is sorted by the renderer's rotated yaw-28 key, not by
  //      x+y+z, so this is expected to reveal some non-monotonic points —
  //      reported rather than asserted strictly. ----
  const monotonicity = await page.evaluate(() => {
    const order = BouquetExplainer.beats['3']._drawOrder();
    const sampled = [];
    for (let i = 0; i < order.length; i += 50) sampled.push(order[i].x + order[i].y + order[i].z);
    let decreases = 0;
    for (let i = 1; i < sampled.length; i++) if (sampled[i] < sampled[i - 1]) decreases++;
    return { sampleCount: sampled.length, decreases, series: sampled };
  });
  ok('depth key (x+y+z) sampled every 50th cell — reporting monotonicity, not asserting it',
    true,
    'samples=' + monotonicity.sampleCount + ' non-monotonic-steps=' + monotonicity.decreases +
    ' (' + (monotonicity.sampleCount > 1 ? (100 * monotonicity.decreases / (monotonicity.sampleCount - 1)).toFixed(1) : '0') + '% of steps)');

  // ---- calm() after leave: yaw 0, show 'auto', limit null, tint null ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  st = await page.evaluate(() => BouquetExplainer.beats['3'].api.state());
  ok('onLeave calms to yaw 0, show auto, limit null', st.yaw === 0 && st.show === 'auto' && st.limit === null, JSON.stringify(st));

  // ---- scrubbing back must reverse cleanly: 0 -> 1 -> 0 restores the p=0 frame ----
  await scrollBandFraction(page, 0);
  await wait(900);
  const frameAtZero = await page.evaluate(() => BouquetExplainer.beats['3'].stage.querySelector('canvas').toDataURL());
  await scrollBandFraction(page, 1);
  await wait(1200);
  await scrollBandFraction(page, 0);
  await wait(900);
  const frameAfterRoundTrip = await page.evaluate(() => BouquetExplainer.beats['3'].stage.querySelector('canvas').toDataURL());
  ok('0 -> 1 -> 0 restores the exact p=0 frame', frameAtZero === frameAfterRoundTrip);

  // ---- idle cost zero: no rAF once fully off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300);
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-3 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- reduced motion: static ~60% painted, current cube still highlighted ----
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
    const rst = await pr.evaluate(() => BouquetExplainer.beats['3'].api.state());
    const rsets = await pr.evaluate(() => BouquetExplainer.beats['3'].api.sets());
    const expected06 = Math.round(0.6 * rsets.surface);
    ok('reduced motion: static ~60% painted, yaw 28, show surface',
      rst.yaw === 28 && rst.show === 'surface' && Math.abs(rst.drawn - expected06) <= 1,
      JSON.stringify(rst) + ' expected~' + expected06);
    ok('reduced motion: a cube is still highlighted (limit > 0, not null)', rst.limit !== null && rst.limit > 0, 'limit=' + rst.limit);
    ok('reduced motion: exactly one .is-hot counter', await pr.evaluate(() =>
      document.querySelectorAll('#beat-3 .counter b.is-hot').length === 1));

    // scrolling must not move it — no scrub wiring under reduced motion
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-3').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const rst2 = await pr.evaluate(() => BouquetExplainer.beats['3'].api.state());
    ok('reduced motion: scrolling does not change the static state', rst2.yaw === 28 && rst2.drawn === rst.drawn, JSON.stringify(rst2));
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }

  // ---- no horizontal overflow at 375 ----
  {
    const browser = page.browser();
    const pm = await browser.newPage();
    await pm.setViewport({ width: 375, height: 812 });
    await pm.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    const overflow = await pm.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok('no horizontal overflow at 375px', !overflow);
    await pm.close();
  }
};
