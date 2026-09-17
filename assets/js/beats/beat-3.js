/* beat-3.js — "Paint the far things first"
 *
 * One landed, tilted (yaw 28) renderer, show('surface'). Scroll drives
 * drawLimit(n) with n = round(progress * total) where total is the surface
 * cell count (api.sets().surface) — the far-to-near painter reveals itself
 * cube by cube. The cube at position n-1 — the one just painted, sitting at
 * the front of what's drawn so far — is tinted orange; everything already
 * painted stays in its own colour.
 *
 * WORKAROUND, and why it matters: no hook exposes the renderer's internal
 * sorted draw list, and that list is NOT the same as cells()'s own order.
 * cells() reports cells in a fixed yaw-0 painter order (sorted once by
 * x+y+z at build time). But bouquet-loader.js's draw() re-sorts every frame
 * whenever yaw != 0 (see its "WHEN TO SORT" comment), by a screen-space
 * depth key computed from the ROTATED (ax, az):
 *   d = ax*(cosYaw - sinYaw) + az*(cosYaw + sinYaw) + y
 * where ax = x - pivotX, az = z - pivotZ. The pivot is a constant offset
 * subtracted from every cell, so it never changes the ORDER of the sort —
 * only x*(cosYaw-sinYaw) + z*(cosYaw+sinYaw) + y matters for ranking. At
 * yaw 28 that reweights x and z unevenly (0.4134 / 1.3524 instead of the
 * yaw-0 sort's 1 / 1), so cells() order and the true paint order at yaw 28
 * genuinely diverge — using cells() index order directly would highlight
 * the wrong cube (checked: it does not sit at the front of what's painted).
 * This file re-sorts the surface cells by that exact key itself, so the
 * highlighted cube always matches what the renderer actually painted last.
 * The on-screen "depth" counter still reads plain x+y+z off that cell, as
 * specced — that value is what the title's "sorted by distance" refers to,
 * even though the SORT that placed the cube is the rotated key above; the
 * two agree at yaw 0 and diverge only in the reweighting, which is why the
 * counter is not perfectly monotonic sampled against the true draw order
 * (see this beat's test, which samples every 50th cell and reports it).
 *
 * Registered into BouquetExplainer.beats['3'] for the test suite.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-3');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var YAW = 28;
  var YAW_RAD = YAW * Math.PI / 180;
  var CT = Math.cos(YAW_RAD), ST = Math.sin(YAW_RAD);
  var KX = CT - ST, KZ = CT + ST;   // the renderer's own rotated depth weights at yaw 28

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.72,
    counters: [
      { name: 'painted', label: 'painted', hot: true },
      { name: 'depth', label: 'distance from camera', decimals: 1 }
    ]
  });

  var api = mounted.api;
  api.tune({ turns: 1, ms: 4200 });
  api.setP(1);
  api.setQ(0);
  api.show('surface');
  api.setYaw(YAW);

  // Built once: the true far-to-near draw order at yaw 28, re-derived from
  // cells() rather than trusted from it (see the file header). Exposed as
  // _drawOrder for the test — the single source of truth for what "n-1"
  // means, so the test isn't re-implementing the same formula blind.
  var ORDER = null;
  function buildOrder(){
    if (ORDER) return ORDER;
    var surface = api.cells().filter(function(c){ return c.surface; });
    ORDER = surface.slice().sort(function(a, b){
      var da = a.x * KX + a.z * KZ + a.y;
      var db = b.x * KX + b.z * KZ + b.y;
      return da - db;
    });
    return ORDER;
  }
  mounted._drawOrder = buildOrder;

  function depthOf(cell){ return cell.x * KX + cell.y + cell.z * KZ; }   // the renderer's own sort key at this yaw — monotonic over the paint order

  function paint(p, instant){
    var order = buildOrder();
    var total = order.length;
    var frac = BouquetExplainer.clamp01(p);
    var n = Math.round(frac * total);

    if (n >= total){
      api.drawLimit(null);
      api.tint(null);
      mounted.counter('painted', total, { instant: instant });
      mounted.counter('depth', total ? depthOf(order[total - 1]) : 0, { instant: instant });
      return;
    }

    api.drawLimit(n);
    if (n > 0){
      var lastCell = order[n - 1];
      var lastIndex = lastCell.i;
      api.tint(function(c){ return c.i === lastIndex ? '#E06B2D' : null; });
      mounted.counter('depth', depthOf(lastCell), { instant: instant });
    } else {
      api.tint(null);
      mounted.counter('depth', 0, { instant: instant });
    }
    mounted.counter('painted', n, { instant: instant });
  }

  function calm(){
    mounted.counter.cancelAll();
    api.drawLimit(null);
    api.tint(null);
    api.setYaw(0);
    api.show('auto');
  }

  // The section usually starts below the fold, so the harness's own
  // IntersectionObserver fires onLeave -> calm() once immediately on load
  // (idle-cost-zero, by design) — which resets yaw to 0 and show to 'auto'
  // before this beat is ever scrolled into view. Nothing in paint() re-sets
  // them (yaw stays 28 for the whole scrub, per the spec, so it isn't
  // per-progress state), so onEnter re-asserts both every time the section
  // (re)enters view, undoing whatever the last calm() left behind.
  function enter(){
    api.show('surface');
    api.setYaw(YAW);
  }

  if (REDUCED){
    // Static "after" state: ~60% painted, the mid-paint frame with the
    // currently-painting cube still highlighted — the explanatory one,
    // rather than the finished (and therefore unremarkable) picture.
    enter();
    paint(0.6, true);
  } else {
    paint(0, true);
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onEnter: enter,
      onProgress: function(p){ paint(p); },
      onLeave: calm
    });
  }

  BouquetExplainer.beats['3'] = mounted;
})();
