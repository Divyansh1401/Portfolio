/**
 * tests/beats/beat-6.test.js — "Every face gets one of five shades, and
 * the light moves with the camera."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-6's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-6', frac); // pinned mapping — see bouquet-explainer.js
  }, frac);
}

// The progress fraction that lands yaw at `target` degrees, using the SAME
// two-halves-eased formula as beat-6.js's own yawFor() (-60 at p=0, 0 at
// p=0.5, +60 at p=1) — inverted here via binary search on the harness's
// public BouquetExplainer.ease, since yawFor() itself is private to the beat.
async function pForYaw(page, target) {
  return page.evaluate((target) => {
    function invertEase(t) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (BouquetExplainer.ease(mid) < t) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    if (target <= 0) return 0.5 * invertEase((target + 60) / 60);
    return 0.5 + 0.5 * invertEase(target / 60);
  }, target);
}

// The SAME shade constants verified from bouquet-loader.js (AMB/LX/LY/LZ,
// ~line 139) and used by beat-6.js's own applyYaw() — independently
// recomputed here, not read back from the page, so this is a real check.
const AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21;
function shTop() { return AMB + LY; }
function shPlusX(yawDeg) {
  const r = yawDeg * Math.PI / 180;
  return AMB + (LX * Math.cos(r) - LZ * Math.sin(r));
}
function shPlusZ(yawDeg) {
  const r = yawDeg * Math.PI / 180;
  return AMB + (LX * Math.sin(r) + LZ * Math.cos(r));
}

async function faceLabels(page) {
  return page.evaluate(() => ({
    top: document.querySelector('#beat-6 .beat-6__cube text[data-label="top"]').textContent,
    x: document.querySelector('#beat-6 .beat-6__cube text[data-label="x"]').textContent,
    z: document.querySelector('#beat-6 .beat-6__cube text[data-label="z"]').textContent
  }));
}
async function faceFills(page) {
  return page.evaluate(() => ({
    top: document.querySelector('#beat-6 .beat-6__cube path[data-face="top"]').getAttribute('fill'),
    x: document.querySelector('#beat-6 .beat-6__cube path[data-face="x"]').getAttribute('fill'),
    z: document.querySelector('#beat-6 .beat-6__cube path[data-face="z"]').getAttribute('fill')
  }));
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // The hero's own fly-in can still be issuing rAF calls right after load;
  // wait for it to land before later asserting beat-6 costs zero rAF
  // off-screen (a false failure otherwise, not a beat-6 bug — same wait
  // verify-bouquet-explainer.js and the other beat tests use).
  await page.waitForFunction(() => window.hero && hero.state().p >= 1, { timeout: 8000 });

  // ---- markup + copy ----
  ok('#beat-6 exists with the fixed SPLIT markup, no is-ghost anywhere', await page.evaluate(() => {
    const s = document.getElementById('beat-6');
    if (!s || s.dataset.beat !== '6') return false;
    if (!s.querySelector('header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__stage');
    if (!stage || !stage.classList.contains('is-split')) return false;
    const halves = stage.querySelectorAll('.beat__half');
    if (halves.length !== 2) return false;
    if (s.querySelector('.is-ghost')) return false; // both halves are real now
    if (!halves[0].querySelector('svg.beat-6__cube')) return false;
    if (!halves[1].querySelector('canvas')) return false;
    if (!halves[0].querySelector('figcaption') || !halves[1].querySelector('figcaption')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is <= 14 words and true on its own', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    return words(document.querySelector('#beat-6 .beat__title')) <= 14;
  }));
  ok('prose is <= 60 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    return words(document.querySelector('#beat-6 .beat__prose')) <= 60;
  }));
  ok('BouquetExplainer.beats["6"] registered with the real renderer api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['6'];
    return !!(b && b.api && typeof b.api.state === 'function');
  }));
  ok('exactly one .is-hot counter (yaw)', await page.evaluate(() =>
    document.querySelectorAll('#beat-6 .counter b.is-hot').length === 1 &&
    document.querySelector('#beat-6 .counter b.is-hot').dataset.name === 'yaw'));
  ok('"shade values" counter present, not hot, reads 5', await page.evaluate(() => {
    const el = document.querySelector('#beat-6 .counter b[data-name="shadevalues"]');
    return !!el && !el.classList.contains('is-hot') && el.textContent.trim() === '5';
  }));

  // ---- the SVG cube: three named faces + live labels ----
  ok('left SVG cube present with exactly three [data-face] paths (top, x, z)', await page.evaluate(() => {
    const svg = document.querySelector('#beat-6 .beat-6__cube');
    if (!svg) return false;
    const faces = Array.from(svg.querySelectorAll('path[data-face]')).map(p => p.dataset.face).sort();
    return faces.join(',') === 'top,x,z';
  }));

  // ---- the five-value table (visible/hidden rows) + orbit diagram ----
  ok('five-value table present with all five directions labelled', await page.evaluate(() => {
    const vis = document.querySelector('#beat-6 .beat-6__diagram [data-el="table-visible"]');
    const hid = document.querySelector('#beat-6 .beat-6__diagram [data-el="table-hidden"]');
    if (!vis || !hid) return false;
    const v = vis.textContent, h = hid.textContent;
    return /top\s*[\d.\-]+/.test(v) && /\+x\s*[\d.\-]+/.test(v) && /\+z\s*[\d.\-]+/.test(v) &&
      /−x\s*[\d.\-]+/.test(h) && /−z\s*[\d.\-]+/.test(h);
  }));
  ok('the light dot and its arrow to centre are present', await page.evaluate(() => {
    return !!document.querySelector('#beat-6 .beat-6__diagram [data-el="light-dot"]') &&
      !!document.querySelector('#beat-6 .beat-6__diagram [data-el="light-line"]');
  }));

  // ---- scroll the beat: progress 0.5 -> yaw ~ 0 on the right (real) renderer ----
  await scrollBandFraction(page, 0.5);
  await wait(900);
  let yawAtHalf = await page.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
  ok('at progress 0.5 the right half reports yaw ~ 0', Math.abs(yawAtHalf) < 1, 'yaw=' + yawAtHalf);

  // ---- progress 1 -> yaw ~ 60 ----
  await scrollBandFraction(page, 1);
  await wait(900);
  let yawAtEnd = await page.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
  ok('at progress 1 the right half reports yaw ~ 60', Math.abs(yawAtEnd - 60) < 1, 'yaw=' + yawAtEnd);
  const yawText = await page.evaluate(() => document.querySelector('#beat-6 .counter b[data-name="yaw"]').textContent);
  ok('the yaw counter reads 60 (0 decimals, unit in the label)', yawText === '60', yawText);

  // ---- the face fills + labels actually change between yaw 0 and yaw 40 ----
  await scrollBandFraction(page, 0.5); // yaw 0
  await wait(900);
  const fillsAt0 = await faceFills(page);
  const labelsAt0 = await faceLabels(page);
  ok('at yaw 0 the labels read top 1.00 / +x 0.78 / +z 0.56 (2 decimals)',
    labelsAt0.top === 'top 1.00' && labelsAt0.x === '+x 0.78' && labelsAt0.z === '+z 0.56',
    JSON.stringify(labelsAt0));

  const pAt40 = await pForYaw(page, 40);
  await scrollBandFraction(page, pAt40);
  await wait(900);
  const yawCheck = await page.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
  ok('the seeked progress actually lands yaw near 40 (sanity)', Math.abs(yawCheck - 40) < 1.5, 'yaw=' + yawCheck);
  const fillsAt40 = await faceFills(page);
  const labelsAt40 = await faceLabels(page);
  ok('face fills change between yaw 0 and yaw 40 (x and z faces recolour)',
    fillsAt0.x !== fillsAt40.x && fillsAt0.z !== fillsAt40.z && fillsAt0.top === fillsAt40.top,
    JSON.stringify({ at0: fillsAt0, at40: fillsAt40 }));

  const expX40 = shPlusX(40).toFixed(2), expZ40 = shPlusZ(40).toFixed(2), expTop = shTop().toFixed(2);
  ok('face labels match AMB + n·L to 2 decimals at yaw ~ 40',
    labelsAt40.top === ('top ' + expTop) && labelsAt40.x === ('+x ' + expX40) && labelsAt40.z === ('+z ' + expZ40),
    JSON.stringify({ got: labelsAt40, expected: { top: expTop, x: expX40, z: expZ40 } }));

  // ---- scroll back to 0 -> yaw back to -60 (retraces exactly) ----
  await scrollBandFraction(page, 0);
  await wait(900);
  let yawAtStart = await page.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
  ok('scrolling back to progress 0 returns yaw to ~ -60', Math.abs(yawAtStart + 60) < 1, 'yaw=' + yawAtStart);

  // ---- idle cost zero: no rAF once fully off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300);
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-6 is off-screen', rafCount === 0, 'count=' + rafCount);

  // ---- onLeave calm: renderer lands at yaw 0 ----
  const calmYaw = await page.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
  ok('onLeave calm: the right half lands at yaw 0', calmYaw === 0, 'yaw=' + calmYaw);

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- no horizontal overflow at 375 (halves stack) ----
  {
    const browser = page.browser();
    const pm = await browser.newPage();
    const mErrors = [];
    pm.on('console', m => { if (m.type() === 'error') mErrors.push(m.text()); });
    pm.on('pageerror', e => mErrors.push('pageerror: ' + e.message));
    await pm.setViewport({ width: 375, height: 800 });
    await pm.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await pm.waitForFunction(() => window.hero && hero.state().p >= 1, { timeout: 8000 });
    const secTop = await pm.evaluate(() => document.getElementById('beat-6').getBoundingClientRect().top + scrollY);
    await pm.evaluate((t) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, t); }, secTop);
    await wait(400);
    const overflow = await pm.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok('no horizontal overflow at 375px', !overflow);
    const stacked = await pm.evaluate(() => getComputedStyle(document.querySelector('#beat-6 .beat__stage')).flexDirection === 'column');
    ok('the two halves stack (flex-direction: column) under 600px', stacked);
    ok('375px test page: zero console errors', mErrors.length === 0, mErrors.join(' | ').slice(0, 300));
    await pm.close();
  }

  // ---- reduced motion: static at yaw 35 ----
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
    const rst = await pr.evaluate(() => ({
      yaw: BouquetExplainer.beats['6'].api.state().yaw,
      captionsVisible: Array.from(document.querySelectorAll('#beat-6 figcaption')).every(f => f.textContent.trim().length > 0)
    }));
    ok('reduced motion: static at yaw 35', rst.yaw === 35, JSON.stringify(rst));
    ok('reduced motion: captions visible', rst.captionsVisible);

    // scrolling must not move it — no scrub wiring under reduced motion
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-6').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const rst2 = await pr.evaluate(() => BouquetExplainer.beats['6'].api.state().yaw);
    ok('reduced motion: scrolling does not change the static state', rst2 === 35, 'yaw=' + rst2);
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }
};
