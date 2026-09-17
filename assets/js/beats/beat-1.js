/* beat-1.js — "Same brick, always on the grid"
 *
 * Two-phase 2D canvas beat — NOT the BouquetLoader renderer (mountBeat is
 * called with renderer:false; this file owns its own drawing).
 *
 * Phase A (p 0.00–0.55, "top-down"): twelve mismatched, off-grid squares
 * (deterministic seeded sizes/jitter, no Math.random) ease toward one
 * uniform size and snap onto a dot grid. Each square gets its own staggered
 * snap window (see squareFactor) so they land one after another instead of
 * all at once — that stagger is what gives the "on the grid" counter
 * something to count up through.
 *
 * Phase B (p 0.55–1.00, "tilt to isometric"): a crossfade (not a camera
 * tween — the plan's "cut between camera languages" applies even to a
 * crossfade transition) from the flat squares into isometric cubes drawn
 * at the same grid cells, using the SVG-cube-spec geometry translated to
 * canvas paths. From p 0.7–1 three more cubes stack on top (gy=1) to show
 * interlocking, ending at 15 cubes total.
 *
 * Registered into BouquetExplainer.beats['1'] for the test suite, with
 * three extra methods beyond the harness's own mounted object:
 *   sizes()      -> [n, ...] current size multiplier per square (12)
 *   positions()  -> [{gx,gz}, ...] current grid-space position per square
 *   cubes()      -> [{gx,gz,gy,depth,color,alpha}, ...] painter-sorted
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-1');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  // mountBeat's caption() only targets `.beat__half figcaption` (split
  // beats); this is a single-canvas beat, so it carries its own tiny scoped
  // rule instead of touching bouquet.html's <style> — same pattern as
  // beat-5's `.beat-5__caption`.
  var style = document.createElement('style');
  style.textContent =
    '#beat-1 .beat-1__caption{position:absolute;top:20px;right:24px;margin:0;' +
    'max-width:52%;text-align:right;font:500 11px/1.3 var(--mono);' +
    'letter-spacing:.06em;text-transform:uppercase;color:var(--grey)}' +
    '#beat-1 .beat-1__caption:empty{display:none}';
  document.head.appendChild(style);

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: false,
    counters: [
      { name: 'sizes', label: 'brick sizes', hot: true },
      { name: 'grid', label: 'on the grid' }
    ]
  });

  var stage = mounted.stage;
  var canvas = stage ? stage.querySelector('canvas') : null;
  if (!canvas){ BouquetExplainer.beats['1'] = mounted; return; }
  var ctx = canvas.getContext('2d');

  var captionEl = document.createElement('p');
  captionEl.className = 'beat-1__caption';
  stage.appendChild(captionEl);

  // ---- palette: the bouquet's own five, cycled deterministically ----
  var PALETTE = ['#FB6F92', '#FFB3C6', '#F3E9D8', '#5F8F3E', '#C41E5A'];

  // ---- the 12-cell footprint: a diamond cluster (bouquet silhouette) ----
  var CELLS = [
    { gx: 1, gz: 0 }, { gx: 2, gz: 0 }, { gx: 3, gz: 0 },
    { gx: 0, gz: 1 }, { gx: 1, gz: 1 }, { gx: 2, gz: 1 }, { gx: 3, gz: 1 }, { gx: 4, gz: 1 },
    { gx: 1, gz: 2 }, { gx: 2, gz: 2 }, { gx: 3, gz: 2 },
    { gx: 2, gz: 3 }
  ];
  var N = CELLS.length; // 12
  var STACK = [4, 5, 6]; // the three central cells of the wide row get a second cube (gy=1)
  var GXC = 2, GZC = 1.5; // bounding-box centre, for the flat-grid phase

  // ---- deterministic seed hash (no Math.random) ----
  function seeded(i, salt){
    var x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  var SIZE0 = [], DX0 = [], DZ0 = [];
  for (var i0 = 0; i0 < N; i0++){
    SIZE0[i0] = 0.6 + seeded(i0, 1) * (1.7 - 0.6);      // mixed sizes 0.6–1.7 cells
    DX0[i0] = (seeded(i0, 2) - 0.5) * 0.8;               // off-grid jitter
    DZ0[i0] = (seeded(i0, 3) - 0.5) * 0.8;
  }

  // Eased approach for 0–90% of a square's own window, a crisp linear snap
  // for the last 10% (per the beat spec: "eased, with the last 10% a crisp
  // snap").
  function snapFactor(t){
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (t < 0.9) return BouquetExplainer.ease(t / 0.9) * 0.85;
    return 0.85 + 0.15 * ((t - 0.9) / 0.1);
  }

  // Each square gets its own snap window spread across Phase A's local
  // progress so they land one after another — the "on the grid" counter
  // has something to tick up through instead of jumping 0→12 in one frame.
  var STAGGER = 0.5;
  function squareFactor(i, t){
    var start = (i / (N - 1)) * STAGGER;
    var span = 1 - STAGGER;
    var local = span > 0 ? BouquetExplainer.clamp01((t - start) / span) : 1;
    return snapFactor(local);
  }

  function shade(hex, mult){
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgb(' + Math.round(r * mult) + ',' + Math.round(g * mult) + ',' + Math.round(b * mult) + ')';
  }

  var COS30 = 0.8660;
  var SEAM = 'rgba(12,12,11,.18)';
  var RULE = (function(){
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--rule').trim();
      return v || 'rgba(12,12,11,.14)';
    } catch (e){ return 'rgba(12,12,11,.14)'; }
  })();

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var cssW = 0, cssH = 0;

  function sizeCanvas(){
    var rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    var w = Math.round(cssW * DPR);
    var h = Math.round(cssH * DPR);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var A_END = 0.55, FADE_END = 0.7;
  var lastP = 0;
  var state = { sizes: [], positions: [], cubes: [] };

  function computeSquares(p){
    var t = BouquetExplainer.clamp01(p / A_END);
    var sizes = [], positions = [];
    for (var i = 0; i < N; i++){
      var f = squareFactor(i, t);
      var size = f >= 1 ? 1 : SIZE0[i] + (1 - SIZE0[i]) * f;
      var gx = f >= 1 ? CELLS[i].gx : CELLS[i].gx + DX0[i] * (1 - f);
      var gz = f >= 1 ? CELLS[i].gz : CELLS[i].gz + DZ0[i] * (1 - f);
      sizes.push(size);
      positions.push({ gx: gx, gz: gz, f: f });
    }
    return { t: t, sizes: sizes, positions: positions };
  }

  function computeCubes(p){
    var squareAlpha = p <= A_END ? 1 : p >= FADE_END ? 0 : 1 - (p - A_END) / (FADE_END - A_END);
    var baseAlpha = p <= A_END ? 0 : p >= FADE_END ? 1 : (p - A_END) / (FADE_END - A_END);
    var extraAlpha = p <= FADE_END ? 0 : BouquetExplainer.clamp01((p - FADE_END) / (1 - FADE_END));
    var list = [];
    var i, idx;
    for (i = 0; i < N; i++){
      if (baseAlpha > 0.001){
        list.push({ gx: CELLS[i].gx, gz: CELLS[i].gz, gy: 0, depth: CELLS[i].gx + CELLS[i].gz, color: PALETTE[i % PALETTE.length], alpha: baseAlpha });
      }
    }
    for (i = 0; i < STACK.length; i++){
      if (extraAlpha > 0.001){
        idx = STACK[i];
        list.push({ gx: CELLS[idx].gx, gz: CELLS[idx].gz, gy: 1, depth: CELLS[idx].gx + CELLS[idx].gz, color: PALETTE[idx % PALETTE.length], alpha: extraAlpha });
      }
    }
    list.sort(function(a, b){ return (a.depth - b.depth) || (a.gy - b.gy); });
    return { squareAlpha: squareAlpha, list: list };
  }

  function drawDotGrid(cell, ox, oy, alpha){
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = RULE;
    var cols = Math.ceil(cssW / cell) + 2;
    var rows = Math.ceil(cssH / cell) + 2;
    var startX = ((ox % cell) + cell) % cell - cell;
    var startY = ((oy % cell) + cell) % cell - cell;
    for (var r = -1; r <= rows; r++){
      for (var c = -1; c <= cols; c++){
        var x = startX + c * cell;
        var y = startY + r * cell;
        if (x < -cell || x > cssW + cell || y < -cell || y > cssH + cell) continue;
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawSquares(cell, ox, oy, squares, alpha){
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (var i = 0; i < N; i++){
      var pos = squares.positions[i];
      var size = squares.sizes[i] * cell;
      var x = ox + pos.gx * cell - size / 2;
      var y = oy + pos.gz * cell - size / 2;
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = SEAM;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, size - 1), Math.max(0, size - 1));
    }
    ctx.restore();
  }

  // The SVG cube spec (top/right/left faces), drawn as canvas paths instead
  // of <path> elements. cx,cy is the shared vertex where all three faces
  // meet (screen space); S is the cube edge.
  function drawCube(cx, cy, S, color){
    var top = [[cx, cy - S], [cx + S * COS30, cy - S / 2], [cx, cy], [cx - S * COS30, cy - S / 2]];
    var right = [[cx, cy], [cx + S * COS30, cy - S / 2], [cx + S * COS30, cy + S / 2], [cx, cy + S]];
    var left = [[cx - S * COS30, cy - S / 2], [cx, cy], [cx, cy + S], [cx - S * COS30, cy + S / 2]];
    function face(pts, fill){
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = SEAM;
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    face(top, shade(color, 1.00));
    face(right, shade(color, 0.78));
    face(left, shade(color, 0.56));
  }

  // Standard ground-plane iso projection (given by the beat spec) plus a
  // height term this file adds: each unit of gy raises the cube by one
  // full edge S, since the cube's local origin (cx,cy) is the shared
  // vertex of its three faces, and stacking cubes cleanly requires exactly
  // that offset.
  function isoXY(gx, gz, gy, S){
    return {
      x: (gx - gz) * COS30 * S,
      y: (gx + gz) * 0.5 * S - gy * S
    };
  }

  function isoOrigin(S){
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var i, p;
    for (i = 0; i < N; i++){
      p = isoXY(CELLS[i].gx, CELLS[i].gz, 0, S);
      minX = Math.min(minX, p.x - S * COS30); maxX = Math.max(maxX, p.x + S * COS30);
      minY = Math.min(minY, p.y - S); maxY = Math.max(maxY, p.y + S);
    }
    for (i = 0; i < STACK.length; i++){
      p = isoXY(CELLS[STACK[i]].gx, CELLS[STACK[i]].gz, 1, S);
      minY = Math.min(minY, p.y - S); maxY = Math.max(maxY, p.y + S);
    }
    return { x: cssW / 2 - (minX + maxX) / 2, y: cssH / 2 - (minY + maxY) / 2 };
  }

  function drawCubes(list, S, ox, oy){
    for (var i = 0; i < list.length; i++){
      var cb = list[i];
      var p = isoXY(cb.gx, cb.gz, cb.gy, S);
      ctx.save();
      ctx.globalAlpha = cb.alpha;
      drawCube(ox + p.x, oy + p.y, S, cb.color);
      ctx.restore();
    }
  }

  function paint(p, instant){
    lastP = p;
    sizeCanvas();
    ctx.clearRect(0, 0, cssW, cssH);

    var cell = cssW / 14;
    var flatOx = cssW / 2 - GXC * cell;
    var flatOy = cssH / 2 - GZC * cell;

    var squares = computeSquares(p);
    var cubeInfo = computeCubes(p);

    drawDotGrid(cell, flatOx, flatOy, cubeInfo.squareAlpha);
    drawSquares(cell, flatOx, flatOy, squares, cubeInfo.squareAlpha);

    if (cubeInfo.list.length){
      var origin = isoOrigin(cell);
      drawCubes(cubeInfo.list, cell, origin.x, origin.y);
    }

    captionEl.textContent = p > A_END ? 'same bricks, seen from the corner' : '';

    state.sizes = squares.sizes.slice();
    state.positions = squares.positions.map(function(pos){ return { gx: pos.gx, gz: pos.gz }; });
    state.cubes = cubeInfo.list.map(function(c){ return { gx: c.gx, gz: c.gz, gy: c.gy, depth: c.depth, color: c.color, alpha: c.alpha }; });

    var doneCount = 0;
    for (var i = 0; i < squares.positions.length; i++) if (squares.positions[i].f >= 1) doneCount++;
    var sizesReadout = Math.max(1, Math.round(5 - 4 * squares.t));
    mounted.counter('sizes', sizesReadout, { instant: instant });
    mounted.counter('grid', doneCount, { instant: instant });
  }

  addEventListener('resize', function(){ paint(lastP, true); });

  mounted.sizes = function(){ return state.sizes.slice(); };
  mounted.positions = function(){ return state.positions.map(function(p){ return { gx: p.gx, gz: p.gz }; }); };
  mounted.cubes = function(){ return state.cubes.map(function(c){ return { gx: c.gx, gz: c.gz, gy: c.gy, depth: c.depth, color: c.color, alpha: c.alpha }; }); };

  if (REDUCED){
    // Static "after" state: Phase B's end (all 15 cubes interlocked),
    // counters at their final 1 / 12.
    paint(1, true);
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

  BouquetExplainer.beats['1'] = mounted;
})();
