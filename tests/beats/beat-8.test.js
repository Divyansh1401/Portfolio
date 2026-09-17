/**
 * beat-8.test.js — "A dial, not a movie": one renderer, one slider p.
 * Single-canvas version (2026-09-17); the ghost half and its checks are gone.
 * Run through tests/verify-bouquet-explainer.js (auto-discovered) or the
 * scratchpad run-one-beat.js runner.
 */
async function scrollBandFraction(page, frac) {
  await page.evaluate((frac) => {
    document.documentElement.style.scrollBehavior = 'auto';
    BouquetExplainer.seek('beat-8', frac);   // pinned mapping — see bouquet-explainer.js
  }, frac);
}

async function setSlider(page, value) {
  await page.evaluate((v) => {
    const el = document.querySelector('#beat-8 .beat__dial');
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

module.exports = async ({ page, ok, wait, BASE }) => {
  ok('#beat-8 exists with the fixed single-canvas markup + a range dial', await page.evaluate(() => {
    const s = document.getElementById('beat-8');
    if (!s || s.dataset.beat !== '8') return false;
    const stage = s.querySelector('.beat__pin > .beat__stage');
    return !!(s.querySelector('.beat__pin > .beat__head > .eyebrow') && s.querySelector('.beat__head > h2.beat__title') &&
      s.querySelector('.beat__head > p.beat__prose') && stage && stage.querySelector(':scope > canvas') &&
      stage.querySelector(':scope > .beat__counters') && stage.querySelector(':scope > input.beat__dial[type="range"]') &&
      !stage.classList.contains('is-split') && !stage.querySelector('.beat__half'));
  }));
  ok('title <= 16 words, prose <= 60 words (plain register)', await page.evaluate(() => {
    const w = s => s.textContent.trim().split(/\s+/).length;
    return w(document.querySelector('#beat-8 .beat__title')) <= 16 && w(document.querySelector('#beat-8 .beat__prose')) <= 60;
  }));
  ok('BouquetExplainer.beats["8"] registered with one api', await page.evaluate(() => {
    const b = BouquetExplainer.beats['8']; return !!(b && b.api && typeof b.api.setP === 'function');
  }));
  ok('exactly one .is-hot counter (p)', await page.evaluate(() =>
    document.querySelectorAll('#beat-8 .counter b.is-hot').length === 1 &&
    document.querySelector('#beat-8 .counter b.is-hot').dataset.name === 'p'));
  ok('zoomed out: fill is 0.4 so the swarm is visible around the frame', await page.evaluate(() => Math.abs(BouquetExplainer.beats['8'].api.fit() - 0.4) < 1e-9));

  // ---- the slider drives p, and a drag owns p until leave ----
  await scrollBandFraction(page, 0.3);
  await wait(900);
  await setSlider(page, 0.5);
  await wait(320);   // the counter ticks over 240 ms
  const p1 = await page.evaluate(() => BouquetExplainer.beats['8'].api.state().p);
  ok('dragging the slider to 0.5 sets p to 0.5', Math.abs(p1 - 0.5) < 1e-6, 'p=' + p1);
  const counterText = await page.evaluate(() => document.querySelector('#beat-8 .counter b[data-name="p"]').textContent);
  ok('the p counter reads 0.50', counterText === '0.50', counterText);
  await scrollBandFraction(page, 0.9);
  await wait(900);
  const p2 = await page.evaluate(() => BouquetExplainer.beats['8'].api.state().p);
  ok('once dragged, scrolling the band no longer moves p', Math.abs(p2 - 0.5) < 1e-6, 'p=' + p2);

  // ---- a formula of p: 0.5 -> 1 -> 0.5 is byte-identical ----
  const start = await page.evaluate(() => BouquetExplainer.beats['8'].api.canvas().toDataURL());
  await setSlider(page, 1); await wait(120);
  await setSlider(page, 0.5); await wait(120);
  const end = await page.evaluate(() => BouquetExplainer.beats['8'].api.canvas().toDataURL());
  ok('frame at p=0.5 is byte-identical after 0.5 -> 1 -> 0.5', start === end);

  // ---- mid-flight, cubes are on screen around the edges (zoomed out) ----
  await setSlider(page, 0.3); await wait(60);
  const mid = await page.evaluate(() => BouquetExplainer.beats['8'].api.state());
  ok('at p=0.3 the swarm is inside the frame, still unassembled (zoomed out)', mid.onscreen > 300 && mid.p < 1, 'onscreen=' + mid.onscreen);

  // ---- idle cost zero off-screen ----
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await wait(400);
  const rafCount = await page.evaluate(() => new Promise(res => {
    let c = 0; const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = f => { c++; return orig(f); };
    setTimeout(() => { window.requestAnimationFrame = orig; res(c); }, 2000);
  }));
  ok('no rAF callbacks fire for 2s once beat-8 is off-screen', rafCount === 0, 'count=' + rafCount);
  const calm = await page.evaluate(() => ({ p: BouquetExplainer.beats['8'].api.state().p, slider: document.querySelector('#beat-8 .beat__dial').value }));
  ok('onLeave calm: lands at p=1 and the slider follows', calm.p === 1 && calm.slider === '1', JSON.stringify(calm));

  // ---- reduced motion: static, landed, dial disabled ----
  { const pr = await page.browser().newPage();
    await pr.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pr.setViewport({ width: 1440, height: 900 });
    const rErrors = [];
    pr.on('console', m => { if (m.type() === 'error') rErrors.push(m.text()); });
    pr.on('pageerror', e => rErrors.push(e.message));
    await pr.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    const rst = await pr.evaluate(() => ({ p: BouquetExplainer.beats['8'].api.state().p, disabled: document.querySelector('#beat-8 .beat__dial').disabled, v: document.querySelector('#beat-8 .beat__dial').value }));
    ok('reduced motion: static at p=1, slider disabled at 1', rst.p === 1 && rst.disabled === true && rst.v === '1', JSON.stringify(rst));
    ok('reduced motion: zero console errors', rErrors.length === 0, rErrors.join(' | ').slice(0, 300));
    await pr.close(); }

  // ---- 375: no overflow ----
  { const pm = await page.browser().newPage();
    await pm.setViewport({ width: 375, height: 812 });
    await pm.goto(BASE + '/bouquet.html', { waitUntil: 'load' });
    await wait(400);
    ok('no horizontal overflow at 375', await pm.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await pm.close(); }
};
