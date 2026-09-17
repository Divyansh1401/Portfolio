/* beat-7.js — "A recipe, not a drawing"
 *
 * One landed renderer plus a chip row. Two scroll-scrubbed phases share the
 * same 0..1 progress:
 *   GROW  (p 0.00–0.60)  the model is built already (setP(1)/setQ(0) never
 *          move), so "growing" here means REVEALING it: cells are grouped by
 *          their generator `part` and shown five groups at a time via
 *          tint()/alpha() — the group currently filling in is tinted orange
 *          and partially alpha'd in cell-by-cell (in the renderer's own
 *          far-to-near painter order), later groups are alpha(0) (not yet
 *          grown), earlier groups are alpha(1) at their real colour. Each
 *          growth chip lights once its group is fully shown.
 *   DIAL  (p 0.60–1.00)  a scripted demo drives params(): nBlooms 52 -> 20
 *          (thins the crown) -> back to 52, then domeCone 0.55 -> 0 (the
 *          flat-crown bug from the notes) -> back to 0.55, landing on the
 *          original recipe exactly at p = 1. From p = 1 on, the two dial
 *          chips are live buttons: click (or Enter/Space, they're <button>s)
 *          toggles that one override on/off; params() is only ever called
 *          when the requested override actually changes.
 *
 * PART names come straight from the loader (bouquet-loader.js's PART enum:
 * BLOOM/LEAF/PAPER/RIBBON/STEM — five values, not seven). The generator has
 * no separate "handle" or "bow" part: the handle is drawn as PAPER cells
 * (a shell around the stems) and the bow is drawn as RIBBON cells (see the
 * loader's own comments above its collar/handle/bow code). So this beat's
 * five chips are STEMS / PAPER / GREENERY(=LEAF) / BLOOMS / RIBBON, in that
 * generator order — the handle visibly grows inside the PAPER chip's turn
 * and the bow inside RIBBON's, which is truthful even though they don't get
 * their own chip.
 *
 * Registered into BouquetExplainer.beats['7'] for the test suite.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-7');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var ORANGE = '#E06B2D';

  // Scoped CSS for the one element the fixed harness markup doesn't provide:
  // the chip row. Tokens only, no new colours — chips borrow the same
  // active/inactive language as the site's own buttons (#bench .btn).
  var style = document.createElement('style');
  style.textContent =
    '#beat-7 .beat__chips{position:absolute;top:20px;left:24px;right:24px;' +
    'display:flex;flex-wrap:wrap;gap:8px;pointer-events:auto}' +
    '#beat-7 .chip{display:inline-flex;align-items:center;gap:6px;' +
    'padding:6px 10px;background:var(--surface);border:1px solid var(--rule);' +
    'border-radius:999px;font:600 11px/1 var(--mono);letter-spacing:.06em;' +
    'text-transform:uppercase;color:var(--text);cursor:default;' +
    'transition:background .15s,color .15s}' +
    '#beat-7 .chip[hidden]{display:none}' +
    '#beat-7 .chip:disabled{opacity:1}' +
    '#beat-7 .chip.chip--dial:not(:disabled){cursor:pointer}' +
    '#beat-7 .chip.chip--dial:not(:disabled):hover{background:rgba(12,12,11,.06)}' +
    '#beat-7 .chip.is-active{background:var(--text);color:var(--bg);border-color:var(--text)}' +
    '#beat-7 .chip__value{font-variant-numeric:tabular-nums;opacity:.75}' +
    '#beat-7 .chip.is-active .chip__value{opacity:1}' +
    '@media (max-width:600px){#beat-7 .beat__chips{position:static;margin-bottom:12px}}';
  document.head.appendChild(style);

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.72,
    counters: [
      { name: 'cubes', label: 'cubes grown', hot: true },
      { name: 'blooms', label: 'blooms' }
    ]
  });

  var api = mounted.api;
  api.tune({ turns: 1, ms: 4200 });
  api.setP(1);
  api.setQ(0);

  // ---- chip row -----------------------------------------------------------
  var GROWTH_PARTS  = [4, 2, 1, 0, 3];                              // STEM, PAPER, LEAF, BLOOM, RIBBON
  var GROWTH_LABELS = ['STEMS', 'PAPER', 'GREENERY', 'BLOOMS', 'RIBBON'];
  var GROWTH_KEYS   = ['stems', 'paper', 'greenery', 'blooms', 'ribbon'];
  var DIAL_OVERRIDE = { nBlooms: 20, domeCone: 0 };

  function makeChip(key, label, value, isDial){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (isDial ? ' chip--dial' : '');
    btn.dataset.key = key;
    btn.disabled = true;               // growth chips: indicator-only, always disabled;
    if (isDial) btn.hidden = true;     // dial chips: hidden until the dial phase, then enabled
    var lab = document.createElement('span');
    lab.className = 'chip__label';
    lab.textContent = label;
    var val = document.createElement('span');
    val.className = 'chip__value';
    val.textContent = String(value);
    btn.appendChild(lab);
    btn.appendChild(val);
    return btn;
  }

  var chipsEl = mounted.stage ? mounted.stage.querySelector('.beat__chips') : null;
  var growthChipEls = GROWTH_LABELS.map(function(label, gi){
    var chip = makeChip(GROWTH_KEYS[gi], label, 0, false);
    if (chipsEl) chipsEl.appendChild(chip);
    return chip;
  });
  var dialChipEls = {
    nBlooms: makeChip('nBlooms', 'nBlooms', 52, true),
    domeCone: makeChip('domeCone', 'domeCone', '0.55', true)
  };
  if (chipsEl){ chipsEl.appendChild(dialChipEls.nBlooms); chipsEl.appendChild(dialChipEls.domeCone); }

  // ---- part grouping (rebuilt whenever params() has changed the geometry) -
  var CELL_INDEX = {};      // cell.i -> {gi, ordinal}  (ordinal = far-to-near position within its group)
  var GROUP_LENS = [];
  var TOTAL_VISIBLE = 0;
  var groupsDirty = true;

  function buildGroupsIfNeeded(){
    if (!groupsDirty) return;
    var partToGi = {};
    GROWTH_PARTS.forEach(function(partVal, gi){ partToGi[partVal] = gi; });
    var groups = GROWTH_PARTS.map(function(){ return []; });
    var cells = api.cells();
    for (var k = 0; k < cells.length; k++){
      var c = cells[k];
      if (!c.visible) continue;
      var gi = partToGi[c.part];
      if (gi === undefined) continue;
      groups[gi].push(c.i);
    }
    CELL_INDEX = {};
    GROUP_LENS = groups.map(function(g){ return g.length; });
    groups.forEach(function(g, gi){
      g.forEach(function(i, ordinal){ CELL_INDEX[i] = { gi: gi, ordinal: ordinal }; });
    });
    TOTAL_VISIBLE = GROUP_LENS.reduce(function(a, b){ return a + b; }, 0);
    for (var gi2 = 0; gi2 < growthChipEls.length; gi2++){
      growthChipEls[gi2].querySelector('.chip__value').textContent = BouquetExplainer.fmt(GROUP_LENS[gi2]);
    }
    groupsDirty = false;
  }

  function updateGrowthChips(revealCounts){
    for (var gi = 0; gi < growthChipEls.length; gi++){
      growthChipEls[gi].classList.toggle('is-active', revealCounts[gi] === GROUP_LENS[gi] && GROUP_LENS[gi] > 0);
    }
  }

  // ---- GROW phase (p in [0, 0.6], local s in [0,1]) ------------------------
  // Reveal counts are computed per group from the raw growth index rather
  // than compared against a single float threshold: a scroll-driven `s` that
  // lands a hair under an exact part boundary (sub-pixel scroll rounding)
  // must still read as "that part is fully grown" once Math.ceil() has
  // already revealed every one of its cells — an index-only comparison would
  // leave the chip unlit and the part still tinted for one dead frame.
  function applyGrowth(s, instant){
    buildGroupsIfNeeded();
    var nParts = GROWTH_PARTS.length;
    var raw = s * nParts;
    var currentIdx = Math.min(nParts - 1, Math.floor(raw));
    var frac = BouquetExplainer.clamp01(raw - currentIdx);
    var revealCounts = GROUP_LENS.map(function(len, gi){
      if (gi < currentIdx) return len;
      if (gi > currentIdx) return 0;
      return Math.min(len, Math.ceil(frac * len));
    });
    var allDone = revealCounts.every(function(r, gi){ return r === GROUP_LENS[gi]; });

    if (allDone){
      api.tint(null);
      api.alpha(null);
    } else {
      // The group currently filling in is the first one not yet fully
      // revealed — found freshly each call rather than assumed to be
      // `currentIdx`, so a group that has already ceil()'d up to 100% right
      // at a boundary hands the orange highlight straight to the next one.
      var growingGi = -1;
      for (var g = 0; g < nParts; g++){ if (revealCounts[g] < GROUP_LENS[g]){ growingGi = g; break; } }
      api.tint(function(cell){
        var m = CELL_INDEX[cell.i];
        return (m && m.gi === growingGi) ? ORANGE : null;
      });
      api.alpha(function(cell){
        var m = CELL_INDEX[cell.i];
        if (!m) return 1;
        return m.ordinal < revealCounts[m.gi] ? 1 : 0;
      });
    }
    updateGrowthChips(revealCounts);
    var shown = revealCounts.reduce(function(a, b){ return a + b; }, 0);
    mounted.counter('cubes', shown, { instant: instant });
  }

  // ---- DIAL phase (p in [0.6, 1], then interactive) ------------------------
  var BASELINE = null;         // {nBlooms, domeCone} — read once, see below
  var overrides = {};          // key -> override value currently applied
  var lastAppliedSerial = 'null';
  var demoLocked = false;      // true once p has reached 1: hands control to the chips

  function serialize(o){
    if (!o) return 'null';
    var keys = Object.keys(o).sort();
    if (!keys.length) return 'null';
    return keys.map(function(k){ return k + ':' + o[k]; }).join(',');
  }

  function updateDialUI(P, instant){
    dialChipEls.nBlooms.querySelector('.chip__value').textContent = BouquetExplainer.fmt(P.nBlooms);
    dialChipEls.domeCone.querySelector('.chip__value').textContent = P.domeCone.toFixed(2);
    dialChipEls.nBlooms.classList.toggle('is-active', P.nBlooms !== BASELINE.nBlooms);
    dialChipEls.domeCone.classList.toggle('is-active', P.domeCone !== BASELINE.domeCone);
    mounted.counter('blooms', P.nBlooms, { instant: instant });
  }

  // params() costs ~30ms, so this only calls it when the requested override
  // actually differs from what's already applied — never per frame.
  function applyOverride(desired, instant){
    var s = serialize(desired);
    if (s === lastAppliedSerial) return;
    lastAppliedSerial = s;
    var hasKeys = !!(desired && Object.keys(desired).length);
    var result = api.params(hasKeys ? desired : null);
    api.setP(1);
    api.setQ(0);
    overrides = {};
    if (hasKeys) Object.keys(desired).forEach(function(k){ overrides[k] = desired[k]; });
    groupsDirty = true;   // geometry changed under the grow-phase mapping
    updateDialUI(result, instant);
  }

  // A tiny margin below the mathematical edge: sub-pixel scroll/layout
  // rounding on some displays can leave the eased progress settled at, say,
  // 0.998 instead of bit-exact 1 — this still reads as "reached the end".
  var END_EPS = 0.005;

  function desiredForP(p){
    if (p < 0.7) return null;
    if (p < 0.85) return { nBlooms: 20 };
    if (p < 0.9) return null;
    if (p < 1 - END_EPS) return { domeCone: 0 };
    return null;
  }

  function setDialInteractive(on){
    dialChipEls.nBlooms.disabled = !on;
    dialChipEls.domeCone.disabled = !on;
  }
  function showDialChips(){
    dialChipEls.nBlooms.hidden = false;
    dialChipEls.domeCone.hidden = false;
  }
  function hideDialChips(){
    dialChipEls.nBlooms.hidden = true;
    dialChipEls.domeCone.hidden = true;
    setDialInteractive(false);
  }

  function applyDial(p, instant){
    showDialChips();
    if (demoLocked) return;   // control has passed to the chips; scroll no longer drives params()
    applyOverride(desiredForP(p), instant);
    if (p >= 1 - END_EPS){
      demoLocked = true;
      setDialInteractive(true);
    }
  }

  function onChipClick(chip){
    if (chip.disabled) return;
    var key = chip.dataset.key;
    var next = {};
    Object.keys(overrides).forEach(function(k){ next[k] = overrides[k]; });
    if (next.hasOwnProperty(key)) delete next[key];
    else next[key] = DIAL_OVERRIDE[key];
    applyOverride(Object.keys(next).length ? next : null, false);
  }
  dialChipEls.nBlooms.addEventListener('click', function(){ onChipClick(dialChipEls.nBlooms); });
  dialChipEls.domeCone.addEventListener('click', function(){ onChipClick(dialChipEls.domeCone); });

  // ---- phase dispatch -------------------------------------------------------
  var mode = 'growth';   // 'growth' | 'dial'

  function resetDial(instant){
    demoLocked = false;
    hideDialChips();
    applyOverride(null, instant);
  }

  function paint(p, instant){
    if (p < 0.6){
      if (mode !== 'growth'){ mode = 'growth'; resetDial(instant); }
      applyGrowth(BouquetExplainer.clamp01(p / 0.6), instant);
    } else {
      if (mode !== 'dial'){ mode = 'dial'; applyGrowth(1, instant); }
      applyDial(p, instant);
    }
  }

  function calm(){
    mounted.counter.cancelAll();
    api.tint(null);
    api.alpha(null);
    applyOverride(null, true);
    api.setP(1);
    api.setQ(0);
    mode = 'growth';
    demoLocked = false;
    hideDialChips();
    updateGrowthChips(0);
    mounted.counter('cubes', 0, { instant: true });
    groupsDirty = true;
  }

  // One-time read of the generator's own defaults — params() is the only way
  // to read P back out, so this single call (not repeated per frame) grounds
  // the dial chips' starting numbers in the real values instead of literals.
  var origP = api.params(null);
  BASELINE = { nBlooms: origP.nBlooms, domeCone: origP.domeCone };
  dialChipEls.nBlooms.querySelector('.chip__value').textContent = BouquetExplainer.fmt(BASELINE.nBlooms);
  dialChipEls.domeCone.querySelector('.chip__value').textContent = BASELINE.domeCone.toFixed(2);
  buildGroupsIfNeeded();
  mounted.counter('cubes', 0, { instant: true });
  mounted.counter('blooms', BASELINE.nBlooms, { instant: true });

  if (REDUCED){
    // Static "after" state: fully grown, chips lit, dial chips visible and
    // already interactive — it's a click, not motion, so the dial still works.
    paint(1, true);
  } else {
    paint(0, true);
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){ paint(p); },
      onLeave: calm
    });
  }

  BouquetExplainer.beats['7'] = mounted;
})();
