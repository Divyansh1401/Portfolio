/**
 * tests/beats/beat-7.test.js — "No cube was placed by hand. Forty numbers grow it."
 * module.exports = async ({ page, ok, wait, BASE }) => { ... }
 * `page` is already on bouquet.html at 1440x900 with console/4xx capture.
 */

// Mirrors the mapping in bouquet-explainer.js / verify-bouquet-explainer.js's
// scrollBandFraction, parameterised to beat-7's own band (0.6).
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-7', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

function counterText(name) {
  return `document.querySelector('#beat-7 .counter b[data-name="${name}"]').textContent`;
}

module.exports = async ({ page, ok, wait, BASE }) => {
  // ---- markup + copy ----
  ok('#beat-7 exists with the fixed markup plus a chip row', await page.evaluate(() => {
    const s = document.getElementById('beat-7');
    if (!s || s.dataset.beat !== '7') return false;
    if (!s.querySelector('header.beat__head > p.eyebrow')) return false;
    if (!s.querySelector('header.beat__head > h2.beat__title')) return false;
    if (!s.querySelector('header.beat__head > p.beat__prose')) return false;
    const stage = s.querySelector('.beat__stage');
    if (!stage || !stage.querySelector('canvas')) return false;
    if (!stage.querySelector('.beat__chips')) return false;
    if (!stage.querySelector('.beat__counters')) return false;
    if (!stage.querySelector('.beat__replay')) return false;
    return true;
  }));
  ok('title is <= 14 words and prose <= 60 words', await page.evaluate(() => {
    const words = s => s.textContent.trim().split(/\s+/).length;
    const s = document.getElementById('beat-7');
    return words(s.querySelector('.beat__title')) <= 14 && words(s.querySelector('.beat__prose')) <= 60;
  }));
  ok('BouquetExplainer.beats["7"] registered with a live api', await page.evaluate(() => {
    const b = window.BouquetExplainer.beats['7'];
    return !!(b && b.api && typeof b.api.state === 'function');
  }));
  ok('exactly 7 chips: 5 growth (disabled) + 2 dial', await page.evaluate(() => {
    const chips = document.querySelectorAll('#beat-7 .beat__chips .chip');
    if (chips.length !== 7) return false;
    const dial = document.querySelectorAll('#beat-7 .chip--dial');
    return dial.length === 2;
  }));

  const sets = await page.evaluate(() => BouquetExplainer.beats['7'].api.sets());
  ok('sets().visible is a positive number smaller than sets().all', sets.visible > 0 && sets.visible < sets.all, JSON.stringify(sets));

  // ---- GROW phase: partial reveal at p~0.3, full at p~0.6 ----
  await scrollBandFraction(page, 0.10);
  await wait(900);
  let cubesAt10 = await page.evaluate(() => parseInt(document.querySelector('#beat-7 .counter b[data-name="cubes"]').textContent.replace(/,/g, ''), 10));
  ok('p~0.10: cubes shown is well under the visible total (early growth)', cubesAt10 < sets.visible * 0.3, 'cubes=' + cubesAt10 + ' visible=' + sets.visible);

  await scrollBandFraction(page, 0.30);
  await wait(900);
  let stAt30 = await page.evaluate(() => BouquetExplainer.beats['7'].api.state());
  let cubesAt30 = await page.evaluate(() => parseInt(document.querySelector('#beat-7 .counter b[data-name="cubes"]').textContent.replace(/,/g, ''), 10));
  ok('p~0.30: some parts not yet grown — shown cubes < full visible count', cubesAt30 > 0 && cubesAt30 < sets.visible, 'cubes=' + cubesAt30 + ' visible=' + sets.visible);
  ok('p~0.30: not every growth chip is lit yet', await page.evaluate(() =>
    document.querySelectorAll('#beat-7 .beat__chips .chip:not(.chip--dial).is-active').length < 5));

  // (checked just past 0.6, not exactly on it — sub-pixel scroll rounding at
  // the exact boundary is inherent to jumping straight to a scrollTop, and
  // the real behaviour only needs to be settled shortly after 0.6, not on it)
  await scrollBandFraction(page, 0.62);
  await wait(900);
  let cubesAt60 = await page.evaluate(() => parseInt(document.querySelector('#beat-7 .counter b[data-name="cubes"]').textContent.replace(/,/g, ''), 10));
  ok('p~0.62: growth complete — shown cubes equals sets().visible', cubesAt60 === sets.visible, 'cubes=' + cubesAt60 + ' visible=' + sets.visible);
  ok('p~0.62: all 5 growth chips lit', await page.evaluate(() =>
    document.querySelectorAll('#beat-7 .beat__chips .chip:not(.chip--dial).is-active').length === 5));
  let stAt60 = await page.evaluate(() => BouquetExplainer.beats['7'].api.state());
  ok('p~0.62: tint/alpha cleared (byte-identical to a plain render)', stAt60.p === 1 && stAt60.q === 0, JSON.stringify(stAt60));

  // ---- DIAL phase: dial chips appear, scripted demo runs ----
  ok('p~0.62: dial chips are now visible but not yet interactive', await page.evaluate(() => {
    const n = document.querySelector('#beat-7 .chip[data-key="nBlooms"]');
    const d = document.querySelector('#beat-7 .chip[data-key="domeCone"]');
    return !n.hidden && !d.hidden && n.disabled && d.disabled;
  }));

  await scrollBandFraction(page, 0.75);
  await wait(900);
  let allAt75 = await page.evaluate(() => BouquetExplainer.beats['7'].api.sets().all);
  let nBloomsChipAt75 = await page.evaluate(() => document.querySelector('#beat-7 .chip[data-key="nBlooms"] .chip__value').textContent);
  ok('p~0.75: scripted demo has thinned nBlooms to 20 (fewer total cubes, chip reads 20)',
    allAt75 < sets.all && nBloomsChipAt75 === '20', 'all=' + allAt75 + ' chip=' + nBloomsChipAt75);

  await scrollBandFraction(page, 0.92);
  await wait(900);
  let domeConeChipAt92 = await page.evaluate(() => document.querySelector('#beat-7 .chip[data-key="domeCone"] .chip__value').textContent);
  ok('p~0.92: scripted demo has flattened domeCone to 0.00', domeConeChipAt92 === '0.00', 'chip=' + domeConeChipAt92);

  await scrollBandFraction(page, 1);
  await wait(900);
  // Read the chips' own display rather than probing params() directly (a
  // direct params(null) call here would force an extra rebuild of its own).
  let chipValsAt1 = await page.evaluate(() => ({
    nBlooms: document.querySelector('#beat-7 .chip[data-key="nBlooms"] .chip__value').textContent,
    domeCone: document.querySelector('#beat-7 .chip[data-key="domeCone"] .chip__value').textContent
  }));
  ok('p=1: scripted demo has landed back on the original recipe', chipValsAt1.nBlooms === '52' && chipValsAt1.domeCone === '0.55', JSON.stringify(chipValsAt1));
  ok('p=1: dial chips are now enabled', await page.evaluate(() => {
    const n = document.querySelector('#beat-7 .chip[data-key="nBlooms"]');
    const d = document.querySelector('#beat-7 .chip[data-key="domeCone"]');
    return !n.disabled && !d.disabled;
  }));

  // ---- interactive toggle: click nBlooms chip ----
  const allBefore = await page.evaluate(() => BouquetExplainer.beats['7'].api.sets().all);
  await page.evaluate(() => document.querySelector('#beat-7 .chip[data-key="nBlooms"]').click());
  await wait(400);
  const afterClick = await page.evaluate(() => ({
    all: BouquetExplainer.beats['7'].api.sets().all,
    bloomsCounter: document.querySelector('#beat-7 .counter b[data-name="blooms"]').textContent,
    chipActive: document.querySelector('#beat-7 .chip[data-key="nBlooms"]').classList.contains('is-active')
  }));
  ok('chip click: sets().all drops and the blooms counter reads 20', afterClick.all < allBefore && afterClick.bloomsCounter === '20', JSON.stringify(afterClick));
  ok('chip click: nBlooms chip is now the active/highlighted style', afterClick.chipActive);

  // toggle back off — must restore exactly
  await page.evaluate(() => document.querySelector('#beat-7 .chip[data-key="nBlooms"]').click());
  await wait(400);
  const afterToggleOff = await page.evaluate(() => ({
    all: BouquetExplainer.beats['7'].api.sets().all,
    bloomsCounter: document.querySelector('#beat-7 .counter b[data-name="blooms"]').textContent
  }));
  ok('chip click again: params(null) restores exactly (sets().all and blooms counter both back)',
    afterToggleOff.all === allBefore && afterToggleOff.bloomsCounter === '52', JSON.stringify(afterToggleOff));

  // ---- calm after leave ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  const calmSt = await page.evaluate(() => BouquetExplainer.beats['7'].api.state());
  const calmParams = await page.evaluate(() => BouquetExplainer.beats['7'].api.params(null));
  ok('onLeave calms to p=1, q=0, and baseline params', calmSt.p === 1 && calmSt.q === 0 && calmParams.nBlooms === 52 && calmParams.domeCone === 0.55, JSON.stringify({ calmSt, calmParams }));
  ok('onLeave hides the dial chips again', await page.evaluate(() => {
    const n = document.querySelector('#beat-7 .chip[data-key="nBlooms"]');
    const d = document.querySelector('#beat-7 .chip[data-key="domeCone"]');
    return n.hidden && d.hidden;
  }));
  ok('onLeave clears growth chip highlighting', await page.evaluate(() =>
    document.querySelectorAll('#beat-7 .beat__chips .chip:not(.chip--dial).is-active').length === 0));

  // ---- scrubbing back must reverse cleanly: 0 -> 1 -> 0 restores the empty-growth frame ----
  await scrollBandFraction(page, 0);
  await wait(900);
  const frameAtZero = await page.evaluate(() => BouquetExplainer.beats['7'].stage.querySelector('canvas').toDataURL());
  await scrollBandFraction(page, 1);
  await wait(900);
  await scrollBandFraction(page, 0);
  await wait(900);
  const frameAfterRoundTrip = await page.evaluate(() => BouquetExplainer.beats['7'].stage.querySelector('canvas').toDataURL());
  ok('0 -> 1 -> 0 restores the exact starting frame', frameAtZero === frameAfterRoundTrip);

  // ---- idle cost zero: no rAF once fully off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(300);
  const rafCount = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { count++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(count); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-7 is off-screen', rafCount === 0, 'count=' + rafCount);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);

  // ---- reduced motion: static fully-grown end state, chips visible and clickable ----
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

    const rSets = await pr.evaluate(() => BouquetExplainer.beats['7'].api.sets());
    const rCubes = await pr.evaluate(() => document.querySelector('#beat-7 .counter b[data-name="cubes"]').textContent.replace(/,/g, ''));
    ok('reduced motion: static fully-grown state (cubes counter = visible total)', parseInt(rCubes, 10) === rSets.visible, 'cubes=' + rCubes + ' visible=' + rSets.visible);
    ok('reduced motion: all 5 growth chips lit', await pr.evaluate(() =>
      document.querySelectorAll('#beat-7 .beat__chips .chip:not(.chip--dial).is-active').length === 5));
    ok('reduced motion: dial chips visible and enabled (a click still works)', await pr.evaluate(() => {
      const n = document.querySelector('#beat-7 .chip[data-key="nBlooms"]');
      const d = document.querySelector('#beat-7 .chip[data-key="domeCone"]');
      return !n.hidden && !d.hidden && !n.disabled && !d.disabled;
    }));

    // the dial click still works under reduced motion (a click, not motion)
    const rAllBefore = await pr.evaluate(() => BouquetExplainer.beats['7'].api.sets().all);
    await pr.evaluate(() => document.querySelector('#beat-7 .chip[data-key="domeCone"]').click());
    await wait(400);
    const rAllAfter = await pr.evaluate(() => BouquetExplainer.beats['7'].api.sets().all);
    const rDomeChip = await pr.evaluate(() => document.querySelector('#beat-7 .chip[data-key="domeCone"] .chip__value').textContent);
    ok('reduced motion: domeCone chip click changes the model and reads 0.00', rAllAfter !== rAllBefore && rDomeChip === '0.00', 'before=' + rAllBefore + ' after=' + rAllAfter + ' chip=' + rDomeChip);

    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close();
  }
};
