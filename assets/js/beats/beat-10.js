/* beat-10.js — "Scroll is the dial too"
 *
 * The dispersal is driven by the scroll scalar q, not time: this beat proves
 * it by wiring the scroll-scrub straight to setQ() on the landed bouquet.
 * Registered into BouquetExplainer.beats['10'] for the test suite.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-10');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.72,
    counters: [
      { name: 'q', label: 'q', hot: true, decimals: 2 },
      { name: 'onscreen', label: 'cubes on screen' }
    ]
  });

  var api = mounted.api;
  api.tune({ turns: 1, ms: 4200 });
  api.setP(1);

  function paint(q, instant){
    api.setQ(q);
    var st = api.state();
    mounted.counter('q', q, { instant: instant });
    mounted.counter('onscreen', st.onscreen, { instant: instant });
  }

  if (REDUCED){
    // The dial has nothing to show without motion, so the static "after"
    // state for THIS beat is the landed bouquet at q = 0 — not the scrub's
    // usual "jump to the end" — which is why scrub() is never called here.
    paint(0, true);
  } else {
    paint(0, true);
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){ paint(p); },
      onLeave: function(){
        mounted.counter.cancelAll();
        paint(0, true);
      }
    });
  }

  BouquetExplainer.beats['10'] = mounted;
})();
