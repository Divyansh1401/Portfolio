/**
 * tests/beats/beat-tp.test.js — "The bouquet never moves. The camera and its light go around it."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-tp's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-tp', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

const TP_YAW = 35;

// Pixel probes: share of non-transparent pixels on a canvas, and whether any
// pixel is (close to) the site's one orange, #E06B2D.
const INK = `(cv) => { const c = cv.getContext('2d', { willReadFrequently: true });
  const d = c.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n / (cv.width * cv.height); }`;
// (minAlpha: the marker is drawn at 45% alpha while it is on the far side
// of the bouquet, so a "behind" frame is probed with a lower bar.)
const ORANGE = `(cv, minAlpha) => { const c = cv.getContext('2d', { willReadFrequently: true });
  const d = c.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i+3] > minAlpha && Math.abs(d[i]-224) < 16 && Math.abs(d[i+1]-107) < 16 && Math.abs(d[i+2]-45) < 16) n++;
  return n; }`;

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-tp exists with the fixed markup', await page.evaluate(() => {
    const s = document.getElementById('beat-tp');
    if (!s || s.dataset.beat !== 'tp') return false;
    if (!s.querySelector('.beat__pin > header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__pin > .beat__stage');
    if (!stage || !stage.querySelector('canvas')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is <= 14 words and prose <= 55 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    const s = document.getElementById('beat-tp');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 55;
  }));
  ok('BouquetExplainer.beats["tp"] registered with a live api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['tp'];
    return !!(b && b.api && typeof b.api.state === 'function' && typeof b.api.project === 'function');
  }));
  ok('three stacked canvases: grid < renderer < marks, all the same size', await page.evaluate(() => {
    const b = BouquetExplainer.beats['tp'];
    const cvs = Array.from(b.stage.querySelectorAll('canvas'));
    if (cvs.length !== 3) return false;
    const rc = b.api.canvas();
    if (cvs[0] !== b.grid || cvs[1] !== rc || cvs[2] !== b.marks) return false;
    return [b.grid, b.marks].every(c => c.width === rc.width && c.height === rc.height &&
      c.style.width === rc.style.width && c.style.height === rc.style.height);
  }));
  ok('exactly one .is-hot counter', await page.evaluate(() =>
    document.querySelectorAll('#beat-tp .counter b.is-hot').length === 1));
  ok('project() of the bouquet\'s axis point lands inside the stage canvas', await page.evaluate(() => {
    const b = BouquetExplainer.beats['tp'];
    const bs = b.api.basis(), cv = b.api.canvas();
    const o = b.api.project(bs.pivX, b.geom.midY, bs.pivZ);
    return o.X > 0 && o.X < cv.width && o.Y > 0 && o.Y < cv.height;
  }));

  // ---- the grid planes have ink ----
  const gridInk = await page.evaluate(`(${INK})(BouquetExplainer.beats['tp'].grid)`);
  ok('grid canvas has ink (> 1% of its area)', gridInk > 0.01, 'fraction=' + gridInk.toFixed(4));

  // ---- the three phases, driven by scrolling the real page ----
  await scrollBandFraction(page, 0.2);
  await wait(1200);
  let st = await page.evaluate(() => BouquetExplainer.beats['tp'].api.state());
  let cam = await page.evaluate(() => BouquetExplainer.beats['tp'].camAng());
  ok('p~0.2 (assembly): renderer yaw is 35', st.yaw === TP_YAW, 'yaw=' + st.yaw);
  ok('p~0.2 (assembly): p ~ 0.44, q = 0', Math.abs(st.p - 0.444) < 0.02 && st.q === 0, JSON.stringify({ p: st.p, q: st.q }));
  ok('p~0.2 (assembly): camera marker mid-lap (~ -200 deg)', Math.abs(cam + 200) < 8, 'cam=' + cam);
  ok('p~0.2 caption reads "assembling"', await page.evaluate(() =>
    document.querySelector('#beat-tp .beat-tp__caption').textContent === 'assembling'));

  await scrollBandFraction(page, 0.6);
  await wait(1200);
  st = await page.evaluate(() => BouquetExplainer.beats['tp'].api.state());
  cam = await page.evaluate(() => BouquetExplainer.beats['tp'].camAng());
  ok('p~0.6 (circling): renderer yaw is 35', st.yaw === TP_YAW, 'yaw=' + st.yaw);
  ok('p~0.6 (circling): landed, p = 1 and q = 0', st.p === 1 && st.q === 0, JSON.stringify({ p: st.p, q: st.q }));
  ok('p~0.6 (circling): camera marker on its second lap (~216 deg)', Math.abs(cam - 216) < 8, 'cam=' + cam);
  ok('p~0.6 caption reads "camera circling"', await page.evaluate(() =>
    document.querySelector('#beat-tp .beat-tp__caption').textContent === 'camera circling'));
  const orangeAt06 = await page.evaluate(`(${ORANGE})(BouquetExplainer.beats['tp'].marks, 80)`);
  ok('marks canvas carries orange pixels (the light, faded: it is behind the bouquet here)', orangeAt06 > 0, 'orange=' + orangeAt06);
  const counters = await page.evaluate(() => ({
    camera: document.querySelector('#beat-tp .counter b[data-name="camera"]').textContent,
    onscreen: document.querySelector('#beat-tp .counter b[data-name="onscreen"]').textContent
  }));
  ok('counters: camera reads cumulative degrees (~576), cubes on screen = state().onscreen',
    Math.abs(parseFloat(counters.camera) - 576) < 8 && parseFloat(counters.onscreen.replace(/,/g, '')) === st.onscreen,
    JSON.stringify(counters) + ' onscreen=' + st.onscreen);

  await scrollBandFraction(page, 0.9);
  await wait(1200);
  st = await page.evaluate(() => BouquetExplainer.beats['tp'].api.state());
  cam = await page.evaluate(() => BouquetExplainer.beats['tp'].camAng());
  ok('p~0.9 (dispersal): renderer yaw is 35', st.yaw === TP_YAW, 'yaw=' + st.yaw);
  ok('p~0.9 (dispersal): p = 1, q ~ 0.67', st.p === 1 && Math.abs(st.q - 0.667) < 0.02, JSON.stringify({ p: st.p, q: st.q }));
  ok('p~0.9 (dispersal): camera marker holds at 360', cam === 360, 'cam=' + cam);
  ok('p~0.9 caption reads "dispersing"', await page.evaluate(() =>
    document.querySelector('#beat-tp .beat-tp__caption').textContent === 'dispersing'));
  const orangeAt09 = await page.evaluate(`(${ORANGE})(BouquetExplainer.beats['tp'].marks, 200)`);
  ok('marks canvas carries full-alpha orange pixels (the light, in front)', orangeAt09 > 0, 'orange=' + orangeAt09);

  // ---- scrubbing back must reverse cleanly: 0 -> 1 -> 0 restores the frame ----
  await scrollBandFraction(page, 0);
  await wait(1200);
  const frameAtZero = await page.evaluate(() => BouquetExplainer.beats['tp'].api.canvas().toDataURL());
  const marksAtZero = await page.evaluate(() => BouquetExplainer.beats['tp'].marks.toDataURL());
  await scrollBandFraction(page, 1);
  await wait(1200);
  await scrollBandFraction(page, 0);
  await wait(1200);
  const frameAfter = await page.evaluate(() => BouquetExplainer.beats['tp'].api.canvas().toDataURL());
  const marksAfter = await page.evaluate(() => BouquetExplainer.beats['tp'].marks.toDataURL());
  ok('0 -> 1 -> 0 restores the exact renderer frame', frameAtZero === frameAfter);
  ok('0 -> 1 -> 0 restores the exact marker frame', marksAtZero === marksAfter);

  // ---- calm after leave: landed, q 0, yaw still 35, marker at 0 ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  st = await page.evaluate(() => BouquetExplainer.beats['tp'].api.state());
  cam = await page.evaluate(() => BouquetExplainer.beats['tp'].camAng());
  ok('onLeave calms to p 1, q 0, yaw 35, camera 0', st.p === 1 && st.q === 0 && st.yaw === TP_YAW && cam === 0, JSON.stringify({ p: st.p, q: st.q, yaw: st.yaw, cam }));
  ok('onLeave clears the caption', await page.evaluate(() =>
    document.querySelector('#beat-tp .beat-tp__caption').textContent === ''));

  // ---- idle cost zero: no rAF once fully off-screen ----
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-tp is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- reduced motion: static landed state, camera parked at 40 ----
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
    const rst = await pr.evaluate(() => Object.assign(BouquetExplainer.beats['tp'].api.state(), { cam: BouquetExplainer.beats['tp'].camAng() }));
    ok('reduced motion: static landed state (p 1, q 0, yaw 35, camera 40)',
      rst.p === 1 && rst.q === 0 && rst.yaw === TP_YAW && rst.cam === 40, JSON.stringify(rst));
    const rGrid = await pr.evaluate(`(${INK})(BouquetExplainer.beats['tp'].grid)`);
    const rOrange = await pr.evaluate(`(${ORANGE})(BouquetExplainer.beats['tp'].marks, 200)`);
    ok('reduced motion: grids drawn and the light attached', rGrid > 0.01 && rOrange > 0, 'grid=' + rGrid.toFixed(4) + ' orange=' + rOrange);

    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-tp').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t + 200), secTop);
    await wait(500);
    const rst2 = await pr.evaluate(() => Object.assign(BouquetExplainer.beats['tp'].api.state(), { cam: BouquetExplainer.beats['tp'].camAng() }));
    ok('reduced motion: scrolling does not change the static state',
      rst2.p === 1 && rst2.q === 0 && rst2.yaw === TP_YAW && rst2.cam === 40, JSON.stringify(rst2));
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }

  // ---- 375: no horizontal overflow; the orbit (camera AND light) stays inside the canvas ----
  {
    const browser = page.browser();
    const pm = await browser.newPage();
    const mErrors = [];
    pm.on('console', m => { if (m.type() === 'error') mErrors.push(m.text()); });
    pm.on('pageerror', e => mErrors.push('pageerror: ' + e.message));
    await pm.setViewport({ width: 375, height: 812 });
    await pm.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(500);
    ok('375px: no horizontal overflow', await pm.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const fit = await pm.evaluate(() => {
      const b = BouquetExplainer.beats['tp'];
      const bs = b.api.basis(), cv = b.api.canvas(), rho = b.orbitRadius();
      let inside = true, worst = 0;
      for (let a = 0; a < 360; a += 15) {
        const phi = a * Math.PI / 180;
        const l = b.api.project(bs.pivX + (rho + 3) * Math.cos(phi), b.geom.midY + 4, bs.pivZ + (rho + 3) * Math.sin(phi));
        const c = b.api.project(bs.pivX + rho * Math.cos(phi), b.geom.midY, bs.pivZ + rho * Math.sin(phi));
        for (const p of [l, c]) {
          if (p.X < 12 || p.X > cv.width - 12 || p.Y < 12 || p.Y > cv.height - 12) inside = false;
          worst = Math.max(worst, Math.abs(p.X - cv.width / 2) / (cv.width / 2));
        }
      }
      return { inside, worst, rho, orbit: b.geom.orbit, cv: [cv.width, cv.height] };
    });
    ok('375px: camera and light markers stay inside the canvas at every angle', fit.inside, JSON.stringify(fit));
    ok('375px: zero console errors', mErrors.length === 0, mErrors.join(' | ').slice(0, 300));
    await pm.close();
  }
};
