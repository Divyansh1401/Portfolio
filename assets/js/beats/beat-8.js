/* beat-8.js — "A dial, not a movie"
 *
 * One renderer, one slider. The fly-in progress p is a single number; the
 * scroll-scrub drives the slider and the slider drives setP() — a user drag
 * takes over until the section is left. Zoomed out (fill 0.4) so the cubes
 * are visible around the frame edges while they are still flying in.
 * (The earlier split with a scripted "physics" ghost half was cut 2026-09-17:
 * it read as a second, broken bouquet rather than as the point.)
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-8');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var style = document.createElement('style');
  style.textContent =
    '#beat-8 .beat__dial{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);' +
    'width:220px;max-width:60%;height:16px;margin:0;padding:0;background:transparent;' +
    '-webkit-appearance:none;appearance:none;cursor:pointer;z-index:2}' +
    '#beat-8 .beat__dial:disabled{cursor:default;opacity:.45}' +
    '#beat-8 .beat__dial::-webkit-slider-runnable-track{height:2px;background:var(--rule);border-radius:1px}' +
    '#beat-8 .beat__dial::-moz-range-track{height:2px;background:var(--rule);border-radius:1px}' +
    '#beat-8 .beat__dial::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;' +
    'border-radius:50%;background:var(--text);border:0;box-shadow:none;margin-top:-6px}' +
    '#beat-8 .beat__dial::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--text);' +
    'border:0;box-shadow:none}' +
    '#beat-8 .beat__dial:focus-visible{outline:2px solid var(--orange);outline-offset:3px}';
  document.head.appendChild(style);

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.4,                 // zoomed out: the swarm at the frame edges is the picture
    counters: [
      { name: 'p', label: 'p', hot: true, decimals: 2 }
    ]
  });

  var api = mounted.api;
  api.tune({ turns: 1, ms: 4200 });
  api.setQ(0);
  api.setYaw(0);

  var slider = mounted.stage ? mounted.stage.querySelector('.beat__dial') : null;

  var dragging = false;      // a manual drag takes over from the scroll-scrub

  // applyP(p): the single place that drives the renderer from one number.
  function applyP(p, instant){
    p = BouquetExplainer.clamp01(p);
    api.setP(p);
    mounted.counter('p', p, { instant: !!instant });
    if (slider && slider.value !== String(p)) slider.value = String(p);
  }

  if (REDUCED){
    // Static "after" state: landed at p=1, dial disabled there.
    api.setP(1);
    mounted.counter('p', 1, { instant: true });
    if (slider){ slider.value = '1'; slider.disabled = true; }
  } else {
    applyP(0, true);

    if (slider){
      slider.addEventListener('input', function(){
        dragging = true;
        applyP(parseFloat(slider.value));
      });
    }

    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){
        if (dragging) return;   // the user's drag owns p until the beat is left
        applyP(p);
      },
      onLeave: function(){
        mounted.counter.cancelAll();
        dragging = false;
        api.setQ(0);
        api.setP(1);            // landed, not reset to 0 — see plan note on beat 8
        mounted.counter('p', 1, { instant: true });
        if (slider) slider.value = '1';
      }
    });
  }

  BouquetExplainer.beats['8'] = mounted;
})();
