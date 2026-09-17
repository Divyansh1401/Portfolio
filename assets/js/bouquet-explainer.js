/* bouquet-explainer.js — the harness for the twelve scroll-scrubbed "beats"
 * on bouquet.html. Vanilla JS, no dependencies. Read
 * .claude/BOUQUET-EXPLAINER-PLAN.md §1 first — every choice below is that
 * contract, not a preference.
 *
 * This file builds NOTHING that the markup doesn't already contain. Each
 * beat is hand-authored HTML dropped in at its `<!-- beat-N -->` marker in
 * bouquet.html, following the FIXED pattern below; a beat's own
 * `assets/js/beats/beat-N.js` calls into this file to mount the renderer(s),
 * wire the scroll-scrub, and drive counters.
 *
 * ── THE MARKUP PATTERN (every beat, verbatim) ──────────────────────────────
 *   <section class="beat" id="beat-N" data-beat="N">
 *    <div class="beat__pin">              <!-- sticky: head + stage pin while scrubbing -->
 *     <header class="beat__head">
 *       <p class="eyebrow">N / 12</p>
 *       <h2 class="beat__title">…kid sentence, ≤ 14 words…</h2>
 *       <p class="beat__prose">…≤ 60 words…</p>
 *     </header>
 *     <div class="beat__stage" aria-label="…">
 *       <canvas></canvas>
 *       <div class="beat__counters"></div>
 *       <button class="beat__replay" type="button" hidden>replay</button>
 *     </div>
 *    </div>
 *   </section>
 *
 * A SPLIT beat replaces the single <canvas> with two halves inside a
 * `.beat__stage.is-split`:
 *       <figure class="beat__half is-ghost"><canvas></canvas><figcaption>…</figcaption></figure>
 *       <figure class="beat__half"><canvas></canvas><figcaption>…</figcaption></figure>
 * `split()` below adds `.is-split` / `.is-ghost` for you if the markup
 * didn't already carry them.
 *
 * ── SCROLL-SCRUB MAPPING (scrub()) ─────────────────────────────────────────
 * The `.beat__pin` (head + stage) is position:sticky at `--pin-top` (the nav
 * height). scrub() makes the section taller than the pin by
 * `band * innerHeight` (default 0.6), so the pinned card stays FULLY on
 * screen while the page scrolls through that extra height:
 *
 *   scrubPx = band * innerHeight
 *   target  = clamp01((pinTop + margin - sectionRect.top) / scrubPx)
 *
 * target is 0 the instant the pin sticks (section top at pinTop), 1 the
 * instant it un-sticks (section bottom at pin bottom). Before that the card
 * scrolls in at its 0 state, after it scrolls out at its 1 state. Scrolling
 * back retraces the same line exactly. `BouquetExplainer.seek(section, f)`
 * scrolls instantly to the scrollY where target == f (tests, replay).
 *
 * ⚠ onLeave FIRES ONCE AT LOAD for any section below the fold (the observer
 * reports "not intersecting" on first observe), and calm() is what keeps the
 * page idle. So a beat must NOT rely on one-time setup that calm()/onLeave
 * resets (yaw, show(), tint) — re-assert constant state in `onEnter`, or set
 * it inside onProgress like beat-5 does.
 *
 * That target is EASED toward a `current` value every animation frame,
 * lerp-style, at the same fraction-of-remaining-distance feel as the home
 * page's scroll (`current += (target - current) * 0.14`) — and the loop
 * performs a settle-skip: once |target - current| < 0.001 it snaps current
 * to target, fires onProgress once more, and stops requesting frames. There
 * is no idle rAF anywhere in this file. A page-level `scroll` listener only
 * *restarts* a stopped loop; it never itself changes state.
 *
 * `prefers-reduced-motion: reduce` (checked once, at load, matching the
 * project's other PREFERS_REDUCED_MOTION gates) skips the lerp and the
 * scroll wiring entirely: on enter, progress jumps straight to 1 (the
 * "explained" end state) with a single onProgress(1) call. Individual beats
 * for which "1" isn't the right static picture (beat 10's dial makes no
 * sense frozen mid-scrub) skip calling scrub() under reduced motion and
 * paint their own static frame instead — see beat-10.js.
 *
 * onLeave fires from an IntersectionObserver at threshold 0 (the section has
 * left the viewport on either edge). At that instant this file forces
 * current AND target to 0, cancels any in-flight rAF (main loop and any
 * counter tick), fires one final onProgress(0), then calls the beat's own
 * onLeave() for anything else it wants to reset (yaw, etc — "calm()" in the
 * plan's language). This is a deliberate hard reset for idle-cost-zero, not
 * a "freeze at last position" — matching "Off-screen: setYaw(0), stop."
 *
 * ── RENDERER HOOKS USED ─────────────────────────────────────────────────────
 * Only what ships in bouquet-loader.js TODAY: mount(canvas) ->
 * {setP, setQ, setYaw, fit, tune, dtune, ftune, state, resize, draw, bench}.
 * Nothing here depends on a hook that isn't in that list.
 */
(function(){
  'use strict';

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var EASE_FRAC = 0.14;      // fraction of remaining distance closed per frame
  var SETTLE = 0.001;        // |target - current| below this: snap + stop (no idle loop)
  var TICK_MS = 240;         // counter tween duration

  function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }

  // ---------------------------------------------------------------------
  // ease(): cubic-bezier(.2,.7,.2,1), solved by Newton-Raphson (8 passes)
  // for t(x) then evaluated at y(t) — the same curve CSS would draw for
  // that bezier, approximated rather than table-sampled.
  // ---------------------------------------------------------------------
  function makeBezier(x1,y1,x2,y2){
    function A(a1,a2){ return 1 - 3*a2 + 3*a1; }
    function B(a1,a2){ return 3*a2 - 6*a1; }
    function C(a1){ return 3*a1; }
    function calc(t,a1,a2){ return ((A(a1,a2)*t + B(a1,a2))*t + C(a1))*t; }
    function slope(t,a1,a2){ return 3*A(a1,a2)*t*t + 2*B(a1,a2)*t + C(a1); }
    return function(x){
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++){
        var dx = calc(t, x1, x2) - x;
        var d = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= dx / d;
      }
      return calc(t, y1, y2);
    };
  }
  var ease = makeBezier(0.2, 0.7, 0.2, 1);

  // fmt(n, decimals): with no `decimals`, thousands separators for whole
  // numbers and two decimals for fractional ones (a scrub progress like q
  // reads "0.63", a cube count reads "1,519"). Pass `decimals` to force a
  // fixed number of places regardless of value — a 0..1 dial like q should
  // always read "1.00", not "1", once it lands on a whole number.
  function fmt(n, decimals){
    if (!isFinite(n)) return String(n);
    if (decimals != null) return n.toFixed(decimals);
    if (Number.isInteger(n)) return n.toLocaleString('en-US');
    return n.toFixed(2);
  }

  // ---------------------------------------------------------------------
  // scrub(section, {band, margin, onProgress, onEnter, onLeave})
  // See the mapping documented at the top of this file.
  // Returns {calm(), progress()} — calm() forces the section straight to
  // its off-screen rest state (used internally on leave; exposed in case a
  // beat needs to force it, e.g. when a "replay" should also stop a scrub).
  // ---------------------------------------------------------------------
  function scrub(section, opts){
    opts = opts || {};
    var band = opts.band != null ? opts.band : 0.6;
    var margin = opts.margin || 0;
    var onProgress = opts.onProgress || function(){};
    var onEnter = opts.onEnter;
    var onLeave = opts.onLeave;

    var current = 0, raf = null, inView = false;

    // ── Pinned mapping (2026-09-16). The section is taller than its
    //    `.beat__pin` (head + stage) by `band × innerHeight`; the pin is
    //    position:sticky at --pin-top, so the card is FULLY on screen for the
    //    whole scrub. progress 0 = pin just stuck, 1 = section bottom reaches
    //    the pin's bottom (the exact frame it un-sticks). Before/after that
    //    window the card enters/leaves at its 0 / 1 state.
    var pin = section.querySelector('.beat__pin') || section;
    function pinTop(){ var t = parseFloat(getComputedStyle(pin).top); return isFinite(t) ? t : 0; }
    function scrubPx(){ return Math.max(1, band * innerHeight); }
    // The pin must FIT the viewport: cap the stage at what's left under the
    // nav after the head (title + prose), a 16px pin padding and ~56px for
    // captions/notes under the stage. CSS aspect-ratio still sets the
    // preferred height; this only clamps it (min 260px so phones stay usable).
    var head = pin.querySelector('.beat__head'), stage = pin.querySelector('.beat__stage');
    // Under 600px the CSS turns .beat__pin into display:contents and pins the
    // STAGE alone (the head scrolls away, like the card stack on the home
    // page) — a phone can't hold title + prose + a usable stage at once.
    // `lead()` is how far the pinned element sits below the section's top.
    function stageOnly(){ return getComputedStyle(pin).display === 'contents'; }
    function lead(){ return stageOnly() && head && stage ? head.offsetHeight + (parseFloat(getComputedStyle(stage).marginTop) || 0) : 0; }
    function layout(){
      var so = stageOnly();
      if (stage){
        var avail = innerHeight - pinTop() - (so || !head ? 0 : head.offsetHeight) - 16 - 64;
        stage.style.maxHeight = Math.max(260, Math.floor(avail)) + 'px';
        // the renderers were mounted at the pre-clamp size: re-fit them now
        var apis = section.__bqApis || [];
        for (var i = 0; i < apis.length; i++) if (apis[i] && apis[i].resize) apis[i].resize();
      }
      var pinH = so && stage ? lead() + stage.offsetHeight : pin.offsetHeight;
      section.style.minHeight = (pinH + scrubPx()) + 'px';
    }
    layout();
    var rz = 0;
    addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(function(){ layout(); kick(); }, 120); });

    function target(){
      var rect = section.getBoundingClientRect();
      return clamp01((pinTop() + margin - (rect.top + lead())) / scrubPx());
    }
    // instant seek to a progress fraction (tests, replay buttons) — inverse of target()
    section.__bqSeek = function(frac){
      var rect = section.getBoundingClientRect();
      window.scrollTo(0, scrollY + rect.top + lead() - pinTop() - margin + clamp01(frac) * scrubPx());
    };

    var reached = false;   // analytics: fire bouquet_beat_reached once, at half the scrub
    function noteReached(v){
      if (reached || v < 0.5) return;
      reached = true;
      try { if (typeof window.track === 'function') window.track('bouquet_beat_reached', { beat: section.dataset.beat, index: [].indexOf.call(document.querySelectorAll('.beat'), section) + 1 }); } catch (e) {}
    }
    function frame(){
      var t = target();
      var d = t - current;
      noteReached(current);
      if (Math.abs(d) < SETTLE){
        current = t;
        onProgress(current);
        raf = null;             // settle-skip: no idle loop
        return;
      }
      current += d * EASE_FRAC;
      onProgress(current);
      raf = requestAnimationFrame(frame);
    }

    function kick(){
      if (raf == null && inView && !REDUCED) raf = requestAnimationFrame(frame);
    }

    function onScroll(){ kick(); }
    addEventListener('scroll', onScroll, { passive: true });

    function calm(){
      if (raf != null){ cancelAnimationFrame(raf); raf = null; }
      current = 0;
      onProgress(0);
    }

    var io = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++){
        var e = entries[i];
        if (e.isIntersecting){
          inView = true;
          if (onEnter) onEnter();
          if (REDUCED){
            current = 1;
            onProgress(1);
            noteReached(1);
          } else {
            kick();
          }
        } else {
          inView = false;
          calm();
          if (onLeave) onLeave();
        }
      }
    }, { threshold: 0 });
    io.observe(section);

    return { calm: calm, progress: function(){ return current; }, seek: section.__bqSeek };
  }

  // seek(sectionOrId, frac): scroll instantly so that section's scrub reads `frac`.
  function seek(sec, frac){
    var el = typeof sec === 'string' ? document.getElementById(sec) : sec;
    if (!el || !el.__bqSeek) return false;
    el.__bqSeek(frac); return true;
  }

  // ---------------------------------------------------------------------
  // Counter primitive: ticks a <b data-name> over TICK_MS with tabular
  // nums (CSS handles the tabular-nums; this only formats the digits).
  // Reduced motion or {instant:true} skip the tween. Each element tracks
  // its own in-flight rAF id so it can be cancelled (onLeave uses this so
  // a tick started right before leaving can't still be ticking after).
  // ---------------------------------------------------------------------
  function cancelTick(el){
    if (el && el.__bqRaf != null){ cancelAnimationFrame(el.__bqRaf); el.__bqRaf = null; }
  }
  function tickTo(el, value, instant, decimals){
    if (!el) return;
    cancelTick(el);
    if (REDUCED || instant){ el.textContent = fmt(value, decimals); return; }
    var from = parseFloat(String(el.textContent).replace(/,/g, ''));
    if (!isFinite(from)) from = 0;
    if (from === value){ el.textContent = fmt(value, decimals); return; }
    var t0 = performance.now();
    (function step(){
      var t = clamp01((performance.now() - t0) / TICK_MS);
      var v = from + (value - from) * ease(t);
      el.textContent = fmt(t >= 1 ? value : v, decimals);
      el.__bqRaf = t < 1 ? requestAnimationFrame(step) : null;
    })();
  }

  // ---------------------------------------------------------------------
  // mountBeat(sectionEl, {renderer, fill, counters, replay})
  //   renderer: true (one canvas), 2 (split — two canvases), false (none,
  //             e.g. an SVG-only beat)
  //   fill:     passed to api.fit(fill) on every mounted canvas
  //   counters: [{name, label, hot, decimals}] — rendered into .beat__counters;
  //             `decimals` forces a fixed number of places (a 0..1 dial
  //             should read "1.00", not "1", once it lands on a whole number)
  //   replay:   true unhides .beat__replay (the beat wires its own click)
  // Returns {api, apis, counter(name, value, opts), caption(text), stage}
  // ---------------------------------------------------------------------
  function mountBeat(sectionEl, opts){
    opts = opts || {};
    var stage = sectionEl.querySelector('.beat__stage');
    var apis = [];
    if (opts.renderer){
      var canvases = stage ? stage.querySelectorAll('canvas') : [];
      for (var i = 0; i < canvases.length; i++){
        var a = window.BouquetLoader.mount(canvases[i]);
        if (opts.fill !== undefined) a.fit(opts.fill);
        apis.push(a);
      }
    }

    var countersEl = stage ? stage.querySelector('.beat__counters') : null;
    var els = {};
    if (countersEl && opts.counters){
      for (var c = 0; c < opts.counters.length; c++){
        var spec = opts.counters[c];
        var span = document.createElement('span');
        span.className = 'counter';
        var b = document.createElement('b');
        b.dataset.name = spec.name;
        b.textContent = '0';
        if (spec.hot) b.classList.add('is-hot');
        var lab = document.createElement('i');
        lab.textContent = spec.label;
        span.appendChild(b);
        span.appendChild(lab);
        countersEl.appendChild(span);
        els[spec.name] = { el: b, decimals: spec.decimals };
      }
    }

    function counter(name, value, copts){
      var entry = els[name];
      if (!entry) return;
      tickTo(entry.el, value, !!(copts && copts.instant), entry.decimals);
    }
    counter.cancelAll = function(){
      for (var k in els) if (els.hasOwnProperty(k)) cancelTick(els[k].el);
    };

    if (opts.replay){
      var btn = stage ? stage.querySelector('.beat__replay') : null;
      if (btn) btn.hidden = false;
    }

    function caption(text){
      if (!stage) return;
      var fig = stage.querySelector('.beat__half figcaption');
      if (fig) fig.textContent = text;
    }

    if (apis.length){
      var resizeAll = function(){ for (var r = 0; r < apis.length; r++) apis[r].resize(); };
      addEventListener('resize', resizeAll);
    }

    sectionEl.__bqApis = apis;   // scrub()'s layout() re-fits the renderers after it clamps the stage height
    return { api: apis[0], apis: apis, counter: counter, caption: caption, stage: stage };
  }

  // ---------------------------------------------------------------------
  // split(sectionEl, opts) — convenience over mountBeat for the two-canvas
  // pattern: adds .is-split / .is-ghost on the left half if the markup
  // didn't already, mounts renderer:2, and labels the halves.
  // ---------------------------------------------------------------------
  function split(sectionEl, opts){
    opts = opts || {};
    var stage = sectionEl.querySelector('.beat__stage');
    if (stage) stage.classList.add('is-split');
    var mounted = mountBeat(sectionEl, Object.assign({}, opts, { renderer: 2 }));
    var halves = stage ? Array.prototype.slice.call(stage.querySelectorAll('.beat__half')) : [];
    if (halves[0]) halves[0].classList.add('is-ghost');
    mounted.halves = halves;
    mounted.ghost = mounted.apis[0];
    mounted.keep = mounted.apis[1];
    return mounted;
  }

  // ---------------------------------------------------------------------
  // diff(canvasA, canvasB) -> {count, heat}
  // count = number of pixels where any channel differs by > 8.
  // heat  = an offscreen canvas the same size, differing pixels painted
  //         #E06B2D on a transparent ground, everything else left clear.
  // ---------------------------------------------------------------------
  function diff(canvasA, canvasB){
    var w = Math.min(canvasA.width, canvasB.width);
    var h = Math.min(canvasA.height, canvasB.height);
    var actx = canvasA.getContext('2d', { willReadFrequently: true });
    var bctx = canvasB.getContext('2d', { willReadFrequently: true });
    var ad = actx.getImageData(0, 0, w, h).data;
    var bd = bctx.getImageData(0, 0, w, h).data;
    var heat = document.createElement('canvas');
    heat.width = w; heat.height = h;
    var hctx = heat.getContext('2d', { willReadFrequently: true });
    var out = hctx.createImageData(w, h);
    var count = 0;
    for (var i = 0; i < ad.length; i += 4){
      var dr = Math.abs(ad[i] - bd[i]);
      var dg = Math.abs(ad[i+1] - bd[i+1]);
      var db = Math.abs(ad[i+2] - bd[i+2]);
      if (dr > 8 || dg > 8 || db > 8){
        count++;
        out.data[i]   = 0xE0;
        out.data[i+1] = 0x6B;
        out.data[i+2] = 0x2D;
        out.data[i+3] = 255;
      }
    }
    hctx.putImageData(out, 0, 0);
    return { count: count, heat: heat };
  }

  window.BouquetExplainer = {
    beats: {},
    scrub: scrub,
    seek: seek,
    mountBeat: mountBeat,
    split: split,
    diff: diff,
    clamp01: clamp01,
    ease: ease,
    fmt: fmt
  };
})();
