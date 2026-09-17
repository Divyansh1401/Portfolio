/* beat-6.js — "Every face gets one of five shades, and the light moves
 * with the camera."
 *
 * Rebuilt 2026-09-17 per owner feedback on the first cut: the old left half
 * was a split-screen renderer canvas faking a "spinning model" — the fake
 * read as broken, not illustrative. This version drops the split-renderer
 * fake entirely. Both halves are now real:
 *
 *   LEFT  — a single inline SVG cube (no renderer, no canvas) whose three
 *           visible faces are shaded with the renderer's OWN shade values
 *           at the current yaw, recomputed every frame in this file from
 *           the constants verified in bouquet-loader.js (see SHADE MATH
 *           below). A small top-down diagram under the cube shows the
 *           mechanism: the cube's two side normals (+x, +z) are drawn
 *           FIXED, and the light is a dot that MOVES around a circle as
 *           yaw changes — because that is the actual truth (the light is
 *           attached to the camera, the model's face normals never move).
 *           A tiny table lists all five distinct shade values that exist
 *           in the whole model (top, +x, -x, +z, -z) for the current yaw.
 *   RIGHT — the real BouquetLoader renderer, landed, driven by setYaw()
 *           only — nothing faked. This IS the renderer's own behaviour.
 *
 * SHADE MATH (verified against bouquet-loader.js, not assumed):
 *   AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21   (loader's own constants,
 *   ~line 139: "const AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21")
 *   shTop            = AMB + LY                              = 1.00 (constant)
 *   shade(+x, yaw)   = AMB + (LX*cos(yaw) - LZ*sin(yaw))
 *   shade(+z, yaw)   = AMB + (LX*sin(yaw) + LZ*cos(yaw))
 *   shade(-x, yaw)   = AMB - (LX*cos(yaw) - LZ*sin(yaw))
 *   shade(-z, yaw)   = AMB - (LX*sin(yaw) + LZ*cos(yaw))
 * These are the loader's draw() dot products (~line 980-982) BEFORE the
 * sgnX/sgnZ sign flip it applies there. That flip exists in the real
 * renderer to pick which of +x/-x (or +z/-z) is the one CURRENTLY facing
 * the camera across a full 360deg orbit — it fires exactly where the two
 * projected face widths cross (yaw = +-45/+-135deg), which is invisible on
 * screen because the outgoing face's width is collapsing to zero exactly
 * as the incoming one grows from zero (loader's own "THE FIX for full 360"
 * comment). This beat's SVG cube is a fixed, non-reprojected silhouette
 * (per the plan: "the cube's silhouette doesn't change with yaw in an
 * isometric orbit — that's a property of the projection"), so it always
 * shows the SAME two faces (+x, +z) rather than swapping identity — the
 * sign flip is therefore deliberately NOT reproduced here; using the raw
 * (unflipped) dot product keeps the label ("+x"/"+z") honest about which
 * physical face is drawn, and keeps the tone continuous across the whole
 * -60..+60 sweep instead of jumping at +-45. The RIGHT half needs no such
 * decision — it's the actual renderer code, sign flip included.
 *
 * Registered into BouquetExplainer.beats['6'] for the test suite.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer || !window.BouquetLoader) return;

  var section = document.getElementById('beat-6');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  // ---- scoped styles: size the two inline SVGs to fill the left half the
  // way a canvas does (the harness only has a tag rule for <canvas>), and
  // reserve room at the stage's bottom-left so the (position:absolute)
  // counters never sit on top of the diagram text or the captions — the
  // harness floats counters at left:24/bottom:20 over whatever is there,
  // which is fine over a canvas's pixels but not over readable text. ----
  var style = document.createElement('style');
  style.textContent =
    '#beat-6 .beat__stage.is-split{padding-bottom:72px}' +
    '#beat-6 .beat__half svg.beat-6__cube{display:block;width:100%;flex:1;min-height:0}' +
    '#beat-6 .beat__half svg.beat-6__diagram{display:block;width:100%;height:104px;flex:none}';
  document.head.appendChild(style);

  // ---- the loader's own shading constants (verified, see header) ----
  var AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21;
  var SH_TOP = AMB + LY; // 1.00, constant for every yaw
  var ROSE = [0xFB, 0x6F, 0x92]; // the sampled rose-mid material, at shade 1.00

  function mulRGB(rgb, m){
    function ch(v){ return Math.max(0, Math.min(255, Math.round(v * m))); }
    return 'rgb(' + ch(rgb[0]) + ',' + ch(rgb[1]) + ',' + ch(rgb[2]) + ')';
  }
  function f2(n){ return n.toFixed(2); }

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: true,
    fill: 0.62,
    counters: [
      { name: 'yaw', label: 'yaw °', hot: true, decimals: 0 },
      { name: 'shadevalues', label: 'shade values' }
    ]
  });

  var api = mounted.api; // the single canvas — right half, real renderer
  api.tune({ turns: 1, ms: 4200 });
  api.setP(1);
  api.setQ(0);

  // ---- left-half SVG element refs ----
  var faceTop = section.querySelector('.beat-6__cube path[data-face="top"]');
  var faceX   = section.querySelector('.beat-6__cube path[data-face="x"]');
  var faceZ   = section.querySelector('.beat-6__cube path[data-face="z"]');
  var labelTop = section.querySelector('.beat-6__cube text[data-label="top"]');
  var labelX   = section.querySelector('.beat-6__cube text[data-label="x"]');
  var labelZ   = section.querySelector('.beat-6__cube text[data-label="z"]');
  var lightDot  = section.querySelector('.beat-6__diagram [data-el="light-dot"]');
  var lightLine = section.querySelector('.beat-6__diagram [data-el="light-line"]');
  var tableVisible = section.querySelector('.beat-6__diagram [data-el="table-visible"]');
  var tableHidden  = section.querySelector('.beat-6__diagram [data-el="table-hidden"]');

  // the diagram's own local coordinate space (matches the markup's circle)
  var DIAG_CX = 62, DIAG_CY = 0, DIAG_R = 26;
  var L_MAG = Math.sqrt(LX * LX + LZ * LZ); // constant: a pure rotation of (LX,LZ)

  var currentYaw = 0;

  // yawFor(p): -60deg at p=0, 0deg at p=0.5 (exactly), +60deg at p=1 — same
  // two-halves-eased stitch as the previous cut, so the camera passes
  // dead-on at the scrub's exact halfway point.
  function yawFor(p){
    var yaw;
    if (p <= 0.5){
      var t = BouquetExplainer.ease(p / 0.5);
      yaw = -60 + 60 * t;
    } else {
      var t2 = BouquetExplainer.ease((p - 0.5) / 0.5);
      yaw = 60 * t2;
    }
    return Math.abs(yaw) < 0.005 ? 0 : yaw;
  }

  function applyYaw(yaw, instant){
    currentYaw = yaw;
    api.setYaw(yaw); // the real renderer — its own sign-flip logic, untouched

    var rad = yaw * Math.PI / 180, ct = Math.cos(rad), st = Math.sin(rad);
    var plusX  = AMB + (LX * ct - LZ * st);
    var minusX = AMB - (LX * ct - LZ * st);
    var plusZ  = AMB + (LX * st + LZ * ct);
    var minusZ = AMB - (LX * st + LZ * ct);

    if (faceTop) faceTop.setAttribute('fill', mulRGB(ROSE, SH_TOP));
    if (faceX)   faceX.setAttribute('fill', mulRGB(ROSE, plusX));
    if (faceZ)   faceZ.setAttribute('fill', mulRGB(ROSE, plusZ));
    if (labelTop) labelTop.textContent = 'top ' + f2(SH_TOP);
    if (labelX)   labelX.textContent = '+x ' + f2(plusX);
    if (labelZ)   labelZ.textContent = '+z ' + f2(plusZ);
    // A low shade turns the face near-black, at which point var(--text)
    // (near-black itself) disappears into it — flip the label to white
    // below the point where the material's own contrast breaks down.
    if (labelX) labelX.setAttribute('fill', plusX < 0.4 ? '#FFFFFF' : 'var(--text)');
    if (labelZ) labelZ.setAttribute('fill', plusZ < 0.4 ? '#FFFFFF' : 'var(--text)');
    // split visible/hidden across two lines — the five-value string doesn't
    // fit legibly on one line at the diagram's width, and grouping this way
    // (the three faces on screen, then the two that never are) is a more
    // useful read than a flat list anyway.
    if (tableVisible) tableVisible.textContent =
      'top ' + f2(SH_TOP) + ' · +x ' + f2(plusX) + ' · +z ' + f2(plusZ);
    if (tableHidden) tableHidden.textContent =
      '−x ' + f2(minusX) + ' · −z ' + f2(minusZ);

    // the light dot: fixed normals, moving light — its angle is exactly the
    // yaw-rotated (LX,LZ), the same rotation the loader applies to get
    // shX/shZ, at constant radius (a pure rotation of a fixed vector).
    var lx = (LX * ct - LZ * st) / L_MAG, lz = (LX * st + LZ * ct) / L_MAG;
    var dotX = DIAG_CX + DIAG_R * lx, dotY = DIAG_CY + DIAG_R * lz;
    if (lightDot){ lightDot.setAttribute('cx', dotX); lightDot.setAttribute('cy', dotY); }
    if (lightLine){
      lightLine.setAttribute('x1', dotX); lightLine.setAttribute('y1', dotY);
      lightLine.setAttribute('x2', DIAG_CX); lightLine.setAttribute('y2', DIAG_CY);
    }

    mounted.counter('yaw', yaw, { instant: !!instant });
  }

  function paint(p, instant){
    applyYaw(yawFor(BouquetExplainer.clamp01(p)), instant);
  }

  function calm(){
    mounted.counter.cancelAll();
    applyYaw(0, true);
  }

  if (REDUCED){
    // Static "after" state: yaw 35, matching the other beats' reduced-
    // motion convention (a mid-sweep angle so both faces read as lit, not
    // the 0 rest state which would look identical to "nothing happened").
    mounted.counter('shadevalues', 5, { instant: true });
    applyYaw(35, true);
  } else {
    mounted.counter('shadevalues', 5, { instant: true });
    paint(0, true); // sets the initial (off-screen) frame at yaw -60

    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){ paint(p); },
      onLeave: calm
    });
  }

  BouquetExplainer.beats['6'] = mounted;
})();
