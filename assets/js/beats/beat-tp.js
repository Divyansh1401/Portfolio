/* beat-tp.js — "The bouquet never moves. The camera and its light go around it."
 *
 * A third-person view: the renderer runs at ONE fixed external yaw
 * (TP_YAW = 35°, never tweened) inside a room of three grid planes, while a
 * marker for the main page's camera — with its light attached — orbits the
 * stationary bouquet. Three scroll-scrubbed phases on one renderer:
 *   assembly   (p 0.00–0.45)  setP(p/0.45), q 0; the camera marker makes one
 *                             full lap (−360° → 0°) while the cubes fly in.
 *   circling   (p 0.45–0.70)  landed, q 0; the marker laps once more
 *                             (0° → 360°) with nothing else moving — that lap
 *                             IS the turn you see on the home page.
 *   dispersal  (p 0.70–1.00)  setQ((p−0.7)/0.3); the marker holds; the cubes
 *                             scatter around the bouquet's own axis in place.
 *
 * Three stacked canvases fill the stage (grid below, renderer, marks on top);
 * the two overlays are sized to the renderer's canvas and draw in ITS
 * projection through api.project(), so grids and markers share the bouquet's
 * exact isometric basis. Registered into BouquetExplainer.beats['tp'].
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-tp');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var TP_YAW = 35;                 // the fixed third-person camera — never changes
  var A_END = 0.45, B_END = 0.70;  // phase boundaries in scrub progress
  var ORANGE = '#E06B2D', TEXT = '#0C0C0B', GREY = '#6E6E6C';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  var LINE_FAINT = 'rgba(12,12,11,.10)', LINE_AXIS = 'rgba(12,12,11,.22)', LINE_MARK = 'rgba(12,12,11,.35)';

  // Scoped CSS: the caption line (same pattern as beat 5) and the two overlay
  // canvases, which must never catch pointer events meant for the page.
  var style = document.createElement('style');
  style.textContent =
    '#beat-tp .beat-tp__caption{position:absolute;top:20px;right:24px;margin:0;' +
    'max-width:52%;text-align:right;font:500 11px/1.3 var(--mono);' +
    'letter-spacing:.06em;text-transform:uppercase;color:var(--grey)}' +
    '#beat-tp .beat-tp__caption:empty{display:none}' +
    '#beat-tp .tp-grid,#beat-tp .tp-marks{pointer-events:none}';
  document.head.appendChild(style);

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.5,
    counters: [
      { name: 'camera', label: 'camera turned, °', hot: true, decimals: 0 },
      { name: 'onscreen', label: 'cubes on screen' }
    ]
  });

  var api = mounted.api;
  api.tune({ turns: 1, ms: 4200 });
  api.setYaw(TP_YAW);
  api.setP(1);

  // The two overlay canvases bracket the renderer's canvas in DOM order, so
  // absolute positioning stacks them grid < renderer < marks.
  var rc = api.canvas();
  var grid = document.createElement('canvas');
  grid.className = 'tp-grid';
  grid.setAttribute('aria-hidden', 'true');
  rc.parentNode.insertBefore(grid, rc);
  var marks = document.createElement('canvas');
  marks.className = 'tp-marks';
  marks.setAttribute('aria-hidden', 'true');
  rc.parentNode.insertBefore(marks, rc.nextSibling);

  var captionEl = document.createElement('p');
  captionEl.className = 'beat-tp__caption';
  if (mounted.stage) mounted.stage.appendChild(captionEl);

  // ---- room geometry, from the model itself (computed once: the model never
  //      changes in this beat — no params() calls) ----
  var cells = api.cells(), basis = api.basis();
  var minY = Infinity, maxY = -Infinity, rad = 0;
  for (var i = 0; i < cells.length; i++){
    var c = cells[i];
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
    var d = Math.hypot(c.x - basis.pivX, c.z - basis.pivZ);
    if (d > rad) rad = d;
  }
  var FLOOR_Y = minY - 1;            // one cell below the lowest cube
  var TOP_Y = maxY + 4;              // the back walls rise to the top + 4
  var MID_Y = (minY + maxY) / 2;     // the main camera's height
  var R = Math.ceil(rad) + 6;        // half-extent of the room, in cells
  var ORBIT = R + 3;                 // the main camera's orbit radius (may shrink on narrow stages)
  var GEOM = { minY: minY, maxY: maxY, radius: rad, floorY: FLOOR_Y, topY: TOP_Y, midY: MID_Y, R: R, orbit: ORBIT };

  // Lattice point relative to the bouquet's axis -> canvas px, at the
  // renderer's current yaw/S/origin.
  function P(u, y, w){ return api.project(basis.pivX + u, y, basis.pivZ + w); }

  // The orbit must stay inside the canvas on a tall-portrait phone stage:
  // the light sits 3 cells beyond the camera, and a horizontal circle of
  // radius r projects to a half-width of r·√2·cos30 = 1.2247 r.
  function orbitRadius(){
    var st = api.state();
    var halfW = rc.width / 2, margin = 30 * st.DPR;
    var maxLight = (halfW - margin) / (1.2247 * st.S);     // cells, for the LIGHT
    var rho = Math.min(ORBIT, maxLight - 3);
    return Math.max(rad + 2, rho);
  }

  function setup2d(cv){
    var st = api.state();
    var ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(st.DPR, 0, 0, st.DPR, 0, 0);   // draw in CSS px
    return { ctx: ctx, dpr: st.DPR };
  }
  function seg(ctx, dpr, a, b){
    ctx.beginPath();
    ctx.moveTo(a.X / dpr, a.Y / dpr);
    ctx.lineTo(b.X / dpr, b.Y / dpr);
    ctx.stroke();
  }

  // ---- the three grid planes: floor XZ at y = FLOOR_Y, back walls at
  //      z = −R (XY) and x = −R (ZY). At yaw 35° the −x/−z corner is the
  //      farthest point of the room, so those two walls sit behind the bouquet.
  function drawGrid(){
    var s = setup2d(grid), g = s.ctx, dpr = s.dpr;
    g.lineWidth = 1;
    g.strokeStyle = LINE_FAINT;
    var u, w, y;
    for (u = -R; u <= R; u += 2){
      seg(g, dpr, P(u, FLOOR_Y, -R), P(u, FLOOR_Y, R));   // floor, lines along z
      seg(g, dpr, P(u, FLOOR_Y, -R), P(u, TOP_Y, -R));    // XY wall verticals
    }
    for (w = -R; w <= R; w += 2){
      seg(g, dpr, P(-R, FLOOR_Y, w), P(R, FLOOR_Y, w));   // floor, lines along x
      seg(g, dpr, P(-R, FLOOR_Y, w), P(-R, TOP_Y, w));    // ZY wall verticals
    }
    for (y = FLOOR_Y; y <= TOP_Y; y += 2){
      seg(g, dpr, P(-R, y, -R), P(R, y, -R));             // XY wall horizontals
      seg(g, dpr, P(-R, y, -R), P(-R, y, R));             // ZY wall horizontals
    }
    g.strokeStyle = LINE_AXIS;
    seg(g, dpr, P(-R, FLOOR_Y, 0), P(R, FLOOR_Y, 0));     // x axis
    seg(g, dpr, P(0, FLOOR_Y, -R), P(0, FLOOR_Y, R));     // z axis
    seg(g, dpr, P(0, FLOOR_Y, 0), P(0, TOP_Y, 0));        // y axis (up the bouquet's own axis)
    g.font = '500 10px ' + MONO;
    g.fillStyle = GREY;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var lx = P(R + 1.5, FLOOR_Y, 0), lz = P(0, FLOOR_Y, R + 1.5), ly = P(0, TOP_Y + 1.5, 0);
    g.fillText('x', lx.X / dpr, lx.Y / dpr);
    g.fillText('z', lz.X / dpr, lz.Y / dpr);
    g.fillText('y', ly.X / dpr, ly.Y / dpr);
  }

  // ---- the main camera and its light, on the top canvas ----
  var camAng = 0;
  function drawMarks(){
    var s = setup2d(marks), m = s.ctx, dpr = s.dpr;
    var cssW = marks.width / dpr;
    var rho = orbitRadius();
    var phi = (45 + camAng) * Math.PI / 180;      // world angle: yaw θ on the main page puts its camera at 45° + θ
    var cos = Math.cos(phi), sin = Math.sin(phi);
    var cam = P(rho * cos, MID_Y, rho * sin);
    var lig = P((rho + 3) * cos, MID_Y + 4, (rho + 3) * sin);
    var axis = P(0, MID_Y, 0);
    var cx = cam.X / dpr, cy = cam.Y / dpr, lx = lig.X / dpr, ly = lig.Y / dpr, ax = axis.X / dpr, ay = axis.Y / dpr;
    // On the far side of the bouquet the marker is drawn fainter, so it
    // reads as "behind" even though this canvas sits above the renderer.
    var behind = Math.cos(phi - (45 + TP_YAW) * Math.PI / 180) < 0;
    m.globalAlpha = behind ? 0.45 : 1;

    // view line: camera -> the bouquet's axis point at its mid-height
    m.strokeStyle = LINE_MARK; m.lineWidth = 1;
    m.setLineDash([4, 3]);
    m.beginPath(); m.moveTo(cx, cy); m.lineTo(ax, ay); m.stroke();
    m.setLineDash([]);
    // attachment: light -> camera
    m.beginPath(); m.moveTo(lx, ly); m.lineTo(cx, cy); m.stroke();

    // camera body: 14px rounded rectangle, lens on the side facing the axis
    var ang = Math.atan2(ay - cy, ax - cx);
    m.save();
    m.translate(cx, cy); m.rotate(ang);
    m.fillStyle = TEXT;
    roundRect(m, -7, -5, 14, 10, 2.5); m.fill();
    m.beginPath(); m.arc(8, 0, 3, 0, Math.PI * 2); m.fill();
    m.restore();

    // light: orange disc with six short rays
    m.fillStyle = ORANGE; m.strokeStyle = ORANGE; m.lineWidth = 1.2;
    m.beginPath(); m.arc(lx, ly, 5, 0, Math.PI * 2); m.fill();
    for (var k = 0; k < 6; k++){
      var a = k * Math.PI / 3 + Math.PI / 6, c1 = Math.cos(a), s1 = Math.sin(a);
      m.beginPath(); m.moveTo(lx + c1 * 7.5, ly + s1 * 7.5); m.lineTo(lx + c1 * 11, ly + s1 * 11); m.stroke();
    }

    // labels, kept inside the canvas on narrow stages
    m.font = '500 11px ' + MONO; m.textBaseline = 'middle';
    label(m, 'camera', cx, cy + 12, TEXT, cssW);   // below the body, so it never stacks on "light"
    label(m, 'light', lx, ly - 11, ORANGE, cssW);
    m.globalAlpha = 1;
  }
  function label(m, text, x, y, colour, cssW){
    var tw = m.measureText(text).width, tx = x + 12;
    if (tx + tw > cssW - 4) tx = x - 12 - tw;      // flip to the left near the right edge
    if (tx < 4) tx = 4;
    m.textAlign = 'left'; m.fillStyle = colour;
    m.fillText(text, tx, y);
  }
  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The overlays mirror the renderer canvas's CSS size and backing store,
  // so a projected point lands on the same pixel in all three.
  function sizeOverlays(){
    if (api.state().yaw !== TP_YAW) api.setYaw(TP_YAW);
    [grid, marks].forEach(function(cv){
      cv.style.width = rc.style.width;
      cv.style.height = rc.style.height;
      cv.width = rc.width;
      cv.height = rc.height;
    });
    drawGrid();
    drawMarks();
  }

  function paint(p, instant){
    var st = api.state();
    if (st.yaw !== TP_YAW){ api.setYaw(TP_YAW); st = api.state(); }
    var text;
    if (p < A_END){
      var pp = p / A_END;
      api.setP(pp);
      if (st.q !== 0) api.setQ(0);
      camAng = -360 + 360 * pp;
      text = 'assembling';
    } else if (p < B_END){
      if (st.p !== 1) api.setP(1);
      if (st.q !== 0) api.setQ(0);
      camAng = 360 * ((p - A_END) / (B_END - A_END));
      text = 'camera circling';
    } else {
      if (st.p !== 1) api.setP(1);
      api.setQ((p - B_END) / (1 - B_END));
      camAng = 360;
      text = 'dispersing';
    }
    drawMarks();
    captionEl.textContent = text;
    mounted.counter('camera', Math.round(camAng + 360), { instant: instant });   // cumulative: two laps read 720
    mounted.counter('onscreen', api.state().onscreen, { instant: instant });
  }

  function calm(){
    mounted.counter.cancelAll();
    var st = api.state();
    if (st.yaw !== TP_YAW) api.setYaw(TP_YAW);
    if (st.p !== 1) api.setP(1);
    if (st.q !== 0) api.setQ(0);
    camAng = 0;
    drawMarks();
    captionEl.textContent = '';
    mounted.counter('camera', 0, { instant: true });
    mounted.counter('onscreen', api.state().onscreen, { instant: true });
  }

  if (REDUCED){
    // Static "after" state: the landed bouquet in its room, the camera and
    // light parked at 40°.
    api.setP(1); api.setQ(0);
    camAng = 40;
    sizeOverlays();
    captionEl.textContent = 'camera circling';
    mounted.counter('camera', 40, { instant: true });
    mounted.counter('onscreen', api.state().onscreen, { instant: true });
  } else {
    sizeOverlays();
    paint(0, true);
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){ paint(p); },
      onEnter: function(){ if (api.state().yaw !== TP_YAW) api.setYaw(TP_YAW); drawGrid(); drawMarks(); },
      onLeave: calm
    });
    // scrub()'s layout() may have clamped the stage height: refit to it.
    api.resize();
    sizeOverlays();
  }

  var rz = 0;
  addEventListener('resize', function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ api.resize(); sizeOverlays(); }, 160);
  });

  mounted.geom = GEOM;
  mounted.TP_YAW = TP_YAW;
  mounted.grid = grid;
  mounted.marks = marks;
  mounted.camAng = function(){ return camAng; };
  mounted.orbitRadius = orbitRadius;
  BouquetExplainer.beats['tp'] = mounted;
})();
