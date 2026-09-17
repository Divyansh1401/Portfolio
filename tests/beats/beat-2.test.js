/**
 * tests/beats/beat-2.test.js — "Every cube is just three diamonds in the right spot."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 *
 * Beat 2 is SVG-only (no BouquetLoader renderer) and is a reveal: scroll
 * only triggers the ~2.4s sequence once (progress >= 0.15); the sequence
 * itself runs on its own clock, so this test seeks past the threshold and
 * waits real wall-clock time rather than re-seeking scroll fractions.
 */

async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-2', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-2 exists with the fixed markup (svg in place of canvas)', await page.evaluate(() => {
    const s = document.getElementById('beat-2');
    if (!s || s.dataset.beat !== '2') return false;
    if (!s.querySelector('div.beat__pin')) return false;
    if (!s.querySelector('header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__stage');
    if (!stage || !stage.querySelector('svg')) return false;
    if (stage.querySelector('canvas')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is <= 14 words and prose <= 60 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    const s = document.getElementById('beat-2');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('three [data-face] paths present (top, x, z)', await page.evaluate(() => {
    const s = document.getElementById('beat-2');
    const faces = Array.from(s.querySelectorAll('[data-face]')).map(el => el.getAttribute('data-face'));
    return faces.length === 3 && ['top', 'x', 'z'].every(f => faces.indexOf(f) !== -1);
  }));
  ok('BouquetExplainer.beats["2"] registered', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['2'];
    return !!(b && b.stage && typeof b.counter === 'function');
  }));

  // ---- idle / initial state: assembled cube, no labels, hidden group hidden, counters 0/6 ----
  let st = await page.evaluate(() => {
    const s = document.getElementById('beat-2');
    return {
      top: s.querySelector('[data-face="top"]').getAttribute('transform'),
      x: s.querySelector('[data-face="x"]').getAttribute('transform'),
      z: s.querySelector('[data-face="z"]').getAttribute('transform'),
      hiddenOp: s.querySelector('#b2-hidden').getAttribute('opacity'),
      shapes: document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent,
      faces: document.querySelector('#beat-2 .counter b[data-name="faces"]').textContent
    };
  });
  ok('initial state: faces at identity transform', st.top === 'translate(0,0)' && st.x === 'translate(0,0)' && st.z === 'translate(0,0)', JSON.stringify(st));
  ok('initial state: hidden group at opacity 0', st.hiddenOp === '0', st.hiddenOp);
  ok('initial state: counters read 0 / 6', st.shapes === '0' && st.faces === '6', JSON.stringify(st));

  // ---- trigger the sequence by scrolling past progress 0.15, then let the
  //      2.4s clock (not scroll) run it to completion ----
  await scrollBandFraction(page, 0.5);
  await wait(2700);
  st = await page.evaluate(() => {
    const s = document.getElementById('beat-2');
    return {
      top: s.querySelector('[data-face="top"]').getAttribute('transform'),
      x: s.querySelector('[data-face="x"]').getAttribute('transform'),
      z: s.querySelector('[data-face="z"]').getAttribute('transform'),
      hiddenOp: s.querySelector('#b2-hidden').getAttribute('opacity'),
      lblNeverOp: s.querySelector('#b2-lbl-never').getAttribute('opacity'),
      shapes: document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent,
      faces: document.querySelector('#beat-2 .counter b[data-name="faces"]').textContent
    };
  });
  ok('after the sequence: faces reassembled at identity transform', st.top === 'translate(0,0)' && st.x === 'translate(0,0)' && st.z === 'translate(0,0)', JSON.stringify(st));
  ok('after the sequence: hidden ("never drawn") group ends hidden', st.hiddenOp === '0' && st.lblNeverOp === '0', JSON.stringify(st));
  ok('after the sequence: counters read 3 / 6', st.shapes === '3' && st.faces === '6', JSON.stringify(st));
  ok('exactly one .is-hot counter', await page.evaluate(() =>
    document.querySelectorAll('#beat-2 .counter b.is-hot').length === 1));

  // ---- replay: counter drops to 0, then returns to 3 ----
  await page.evaluate(() => document.querySelector('#beat-2 .beat__replay').click());
  await wait(50);
  const midShapes = await page.evaluate(() => document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent);
  ok('replay: counter drops to 0 right after clicking', midShapes === '0', midShapes);
  await wait(2700);
  const endShapes = await page.evaluate(() => document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent);
  const endFaces = await page.evaluate(() => document.querySelector('#beat-2 .counter b[data-name="faces"]').textContent);
  ok('replay: counter returns to 3 (faces stays 6)', endShapes === '3' && endFaces === '6', endShapes + '/' + endFaces);

  // ---- onLeave: reset to assembled cube, counters 0/6, instantly ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300);
  st = await page.evaluate(() => {
    const s = document.getElementById('beat-2');
    return {
      top: s.querySelector('[data-face="top"]').getAttribute('transform'),
      shapes: document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent,
      faces: document.querySelector('#beat-2 .counter b[data-name="faces"]').textContent
    };
  });
  ok('onLeave: reset to assembled cube, counters 0 / 6', st.top === 'translate(0,0)' && st.shapes === '0' && st.faces === '6', JSON.stringify(st));

  // ---- idle cost zero: no rAF once fully off-screen ----
  await wait(300);
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-2 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);

  // ---- scrolling back in and past threshold again re-triggers (onLeave reset the flag) ----
  await scrollBandFraction(page, 0.5);
  await wait(2700);
  const retrigger = await page.evaluate(() => document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent);
  ok('re-entering and re-crossing the threshold replays the sequence', retrigger === '3', retrigger);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
  await wait(200);

  // ---- no horizontal overflow at 375 ----
  {
    const browser = page.browser();
    const p375 = await browser.newPage();
    await p375.setViewport({ width: 375, height: 812 });
    await p375.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    ok('no horizontal overflow at 375', await p375.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p375.close();
  }

  // ---- reduced motion: static exploded state, labels + ghosts visible, counters 3/6 ----
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
    const rst = await pr.evaluate(() => {
      const s = document.getElementById('beat-2');
      return {
        top: s.querySelector('[data-face="top"]').getAttribute('transform'),
        hiddenOp: s.querySelector('#b2-hidden').getAttribute('opacity'),
        lblTopOp: s.querySelector('#b2-lbl-top').getAttribute('opacity'),
        shapes: document.querySelector('#beat-2 .counter b[data-name="shapes"]').textContent,
        faces: document.querySelector('#beat-2 .counter b[data-name="faces"]').textContent
      };
    });
    ok('reduced motion: faces exploded (not identity)', rst.top !== 'translate(0,0)', rst.top);
    ok('reduced motion: hidden ("never drawn") group and labels visible', rst.hiddenOp === '1' && rst.lblTopOp === '1', JSON.stringify(rst));
    ok('reduced motion: counters read 3 / 6 statically', rst.shapes === '3' && rst.faces === '6', JSON.stringify(rst));

    // scrolling must not move it — no scrub wiring / no re-trigger under reduced motion
    await pr.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const secTop = await pr.evaluate(() => document.getElementById('beat-2').getBoundingClientRect().top + scrollY);
    await pr.evaluate((t) => window.scrollTo(0, t - 300), secTop);
    await wait(500);
    const rst2 = await pr.evaluate(() => document.getElementById('beat-2').querySelector('[data-face="top"]').getAttribute('transform'));
    ok('reduced motion: scrolling does not change the static state', rst2 === rst.top, rst2);
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }
};
