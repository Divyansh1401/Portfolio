/* beat-5.js — "Don't draw what nobody can see"
 *
 * Four scroll-scrubbed stages on one landed, non-rotating-until-Stage-D
 * renderer:
 *   A (p 0.00–0.25)  show('all'), surface ghosted translucent, the buried
 *                    interior tinted orange through the shell.
 *   B (p 0.25–0.50)  show('surface'), no overrides — identical to a normal
 *                    render; the interior is simply gone.
 *   C (p 0.50–0.75)  still show('surface') at yaw 0: the diagonally-hidden
 *                    cubes tint orange and their covering neighbours go
 *                    translucent so the orange shows through; at p ≈ 0.70
 *                    it CUTS to show('visible') with all overrides cleared
 *                    — pixel-identical to Stage B's end, because those
 *                    cubes were always fully covered from this angle.
 *   D (p 0.75–1.00)  still show('visible') (the forced culled set); yaw
 *                    eases 0 → 28° and the gaps left by the hidden cubes
 *                    appear.
 *
 * Registered into BouquetExplainer.beats['5'] for the test suite.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-5');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  // The harness's caption() only targets `.beat__half figcaption`, which a
  // single-canvas (non-split) beat like this one doesn't have. Stage D needs
  // one short caption line, so this beat carries its own tiny scoped rule
  // instead of touching bouquet.html's <style> — kept to the one element it
  // needs, styled with the harness's own tokens.
  var style = document.createElement('style');
  style.textContent =
    '#beat-5 .beat-5__caption{position:absolute;top:20px;right:24px;margin:0;' +
    'max-width:52%;text-align:right;font:500 11px/1.3 var(--mono);' +
    'letter-spacing:.06em;text-transform:uppercase;color:var(--grey)}' +
    '#beat-5 .beat-5__caption:empty{display:none}';
  document.head.appendChild(style);

  // Non-negotiable: at most one .is-hot counter. The animated version ticks
  // a single "cubes" counter through all/surface/visible as the stages pass;
  // reduced motion instead shows all three numbers at once (see below), so
  // it needs its own counter set.
  var counters = REDUCED
    ? [
        { name: 'all', label: 'all cubes' },
        { name: 'surface', label: 'on the surface' },
        { name: 'visible', label: 'reach your eyes', hot: true }
      ]
    : [
        { name: 'cubes', label: 'cubes drawn', hot: true }
      ];

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.72,
    counters: counters
  });

  var api = mounted.api;

  // This beat's title states the original model's numbers (3,014 / 1,519 /
  // 710). The loader's owner default plugs the hollow collar/handle with
  // paper, which changes those counts. ftune() here only touches THIS
  // beat's own mount() instance (one renderer per canvas) — every other
  // beat's canvas is unaffected.
  api.ftune({ fillHollow: false });
  api.tune({ turns: 1, ms: 4200 });
  api.setP(1);

  var SETS = api.sets(); // {all, surface, visible} -> 3014 / 1519 / 710

  var captionEl = document.createElement('p');
  captionEl.className = 'beat-5__caption';
  if (mounted.stage) mounted.stage.appendChild(captionEl);

  var A_END = 0.33, B_END = 0.62, C_CUT = 0.9, C_END = 1.01;   // no Stage D: the rotation stage read as distortion (owner, 2026-09-17)
  var CAPTION_D = 'from the side, the skipped cubes are missing';

  function isSurface(c){ return !!c.surface; }
  function isInterior(c){ return !c.surface; }
  function isHiddenSurface(c){ return c.surface && !c.visible; }
  function isFrontSurface(c){ return !!c.visible; }

  function paint(p, instant){
    if (p < A_END){
      // Stage A — the ghost shell: everything drawn, surface translucent,
      // the buried interior glowing orange through it.
      api.show('all');
      api.alpha(function(c){ return isSurface(c) ? 0.18 : 1; });
      api.tint(function(c){ return isInterior(c) ? '#E06B2D' : null; });
      api.setYaw(0);
      captionEl.textContent = '';
      mounted.counter('cubes', SETS.all, { instant: instant });
    } else if (p < B_END){
      // Stage B — surface only, no overrides: identical to a normal render.
      api.show('surface');
      api.alpha(null);
      api.tint(null);
      api.setYaw(0);
      captionEl.textContent = '';
      mounted.counter('cubes', SETS.surface, { instant: instant });
    } else if (p < C_CUT){
      // Stage C, pre-cut — surface still fully drawn; the diagonally hidden
      // cubes light up orange, showing through their translucent covering
      // neighbour.
      api.show('surface');
      api.tint(function(c){ return isHiddenSurface(c) ? '#E06B2D' : null; });
      api.alpha(function(c){ return isFrontSurface(c) ? 0.18 : 1; });
      api.setYaw(0);
      captionEl.textContent = '';
      mounted.counter('cubes', SETS.surface, { instant: instant });
    } else if (p < C_END){
      // Stage C, post-cut — the culled set only, no overrides: pixel-
      // identical to Stage B's end, because the hidden cubes were always
      // fully covered from this angle.
      api.show('visible');
      api.tint(null);
      api.alpha(null);
      api.setYaw(0);
      captionEl.textContent = '';
      mounted.counter('cubes', SETS.visible, { instant: instant });
    } else {
      // (former Stage D — the camera turn — removed; the beat ends on the
      //  culled set, front-on, at 710)
      api.show('visible'); api.tint(null); api.alpha(null); api.setYaw(0);
      captionEl.textContent = '';
      mounted.counter('cubes', SETS.visible, { instant: instant });
    }
  }

  function calm(){
    mounted.counter.cancelAll();
    api.tint(null);
    api.alpha(null);
    api.setYaw(0);
    api.show('auto');
    captionEl.textContent = '';
  }

  if (REDUCED){
    // Static "after" state: yaw 28, the culled set, all three counts shown
    // at once — a single ticking counter has nothing to tick without motion.
    api.show('visible');
    api.tint(null);
    api.alpha(null);
    api.setYaw(0);
    captionEl.textContent = '';
    mounted.counter('all', SETS.all, { instant: true });
    mounted.counter('surface', SETS.surface, { instant: true });
    mounted.counter('visible', SETS.visible, { instant: true });
  } else {
    paint(0, true);
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){ paint(p); },
      onLeave: calm
    });
  }

  BouquetExplainer.beats['5'] = mounted;
})();
