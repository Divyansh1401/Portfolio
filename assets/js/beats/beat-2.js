/* beat-2.js — "A cube is three flat shapes"
 *
 * SVG-only reveal beat (no BouquetLoader renderer — see the SVG cube spec
 * in .claude/BOUQUET-EXPLAINER-PLAN.md's beat-builder preamble). The three
 * visible faces (data-face="top|x|z") are drawn once in bouquet.html at
 * their assembled position; this file slides them apart, blinks each one
 * flat, ghosts in the three faces that are never drawn (computed by point-
 * mirroring the visible faces through the shared centre), then reassembles.
 *
 * Reveal-type beat: scroll-scrub is used only to trigger the sequence once
 * (progress >= 0.15) and to calm() on leave — the sequence itself runs on
 * its own clock (2.4s), not on scroll position, per the beat spec.
 */
(function(){
  'use strict';
  if (!window.BouquetExplainer) return;

  var section = document.getElementById('beat-2');
  if (!section) return;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  // The shared .beat__stage CSS only styles <canvas>; this beat is SVG-only,
  // so it carries its own tiny scoped stylesheet (per the beat-builder brief:
  // never touch bouquet.html's own <style> block).
  var style = document.createElement('style');
  style.textContent =
    '#beat-2 .beat__stage svg{position:absolute;inset:24px;width:calc(100% - 48px);height:calc(100% - 48px);display:block}' +
    '#beat-2 .beat__stage text{font-family:var(--mono);text-transform:uppercase}';
  document.head.appendChild(style);

  var mounted = BouquetExplainer.mountBeat(section, {
    renderer: false,
    counters: [
      { name: 'shapes', label: 'shapes drawn', hot: true },
      { name: 'faces', label: 'faces in a cube' }
    ],
    replay: true
  });

  var svg = section.querySelector('.beat__stage svg');
  var top = svg.querySelector('[data-face="top"]');
  var xFace = svg.querySelector('[data-face="x"]');
  var zFace = svg.querySelector('[data-face="z"]');
  var hidden = svg.querySelector('#b2-hidden');
  var lblTop = svg.querySelector('#b2-lbl-top');
  var lblX = svg.querySelector('#b2-lbl-x');
  var lblZ = svg.querySelector('#b2-lbl-z');
  var lblNever = svg.querySelector('#b2-lbl-never');

  // ---- geometry: the same S/cos30 basis as the spec's face paths ----
  var S = 100;
  var COS30 = Math.cos(Math.PI / 6);
  var D_TOP = { x: 0, y: -0.55 * S };
  var D_X = { x: 0.45 * S * COS30, y: 0.45 * S * 0.5 };
  var D_Z = { x: -0.45 * S * COS30, y: 0.45 * S * 0.5 };

  var BASE = { top: '#FB6F92', x: '#C45772', z: '#8D3E52' };
  var WHITE = '#FFFFFF';

  function hexToRgb(h){
    h = h.replace('#', '');
    return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
  }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function lerpColor(h1, h2, t){
    var a = hexToRgb(h1), b = hexToRgb(h2);
    return 'rgb(' + Math.round(lerp(a.r, b.r, t)) + ',' + Math.round(lerp(a.g, b.g, t)) + ',' + Math.round(lerp(a.b, b.b, t)) + ')';
  }
  function setFace(el, d, t){
    el.setAttribute('transform', 'translate(' + (d.x * t) + ',' + (d.y * t) + ')');
  }
  function setBlink(el, base, amt){
    el.setAttribute('fill', amt > 0 ? lerpColor(base, WHITE, amt) : base);
    el.setAttribute('stroke', 'rgba(12,12,11,' + lerp(0.18, 1, amt) + ')');
  }
  function opacity(el, v){ if (el) el.setAttribute('opacity', String(v)); }

  var ease = BouquetExplainer.ease;
  var TOTAL = 2400;
  var raf = null, startTime = 0, triggered = false, tickFired = false;

  // ---- the assembled (idle / final / off-screen) state ----
  function assembled(){
    setFace(top, D_TOP, 0);
    setFace(xFace, D_X, 0);
    setFace(zFace, D_Z, 0);
    setBlink(top, BASE.top, 0);
    setBlink(xFace, BASE.x, 0);
    setBlink(zFace, BASE.z, 0);
    opacity(lblTop, 0); opacity(lblX, 0); opacity(lblZ, 0);
    opacity(hidden, 0); opacity(lblNever, 0);
  }

  // ---- the reduced-motion static "after" state (step 1's end, held) ----
  function exploded(){
    setFace(top, D_TOP, 1);
    setFace(xFace, D_X, 1);
    setFace(zFace, D_Z, 1);
    setBlink(top, BASE.top, 0);
    setBlink(xFace, BASE.x, 0);
    setBlink(zFace, BASE.z, 0);
    opacity(lblTop, 1); opacity(lblX, 1); opacity(lblZ, 1);
  }

  function resetInstant(){
    if (raf != null){ cancelAnimationFrame(raf); raf = null; }
    assembled();
    mounted.counter.cancelAll();
    mounted.counter('shapes', 0, { instant: true });
    mounted.counter('faces', 6, { instant: true });
  }

  function staticReduced(){
    exploded();
    opacity(hidden, 1); opacity(lblNever, 1);
    mounted.counter('shapes', 3, { instant: true });
    mounted.counter('faces', 6, { instant: true });
  }

  function step(now){
    var elapsed = now - startTime;

    if (elapsed >= TOTAL){
      assembled();
      raf = null;
      return;
    }

    if (elapsed <= 600){
      // 0-600ms: the three faces slide apart; per-face labels fade in.
      var te = ease(elapsed / 600);
      setFace(top, D_TOP, te);
      setFace(xFace, D_X, te);
      setFace(zFace, D_Z, te);
      opacity(lblTop, te); opacity(lblX, te); opacity(lblZ, te);
      opacity(hidden, 0); opacity(lblNever, 0);
    } else if (elapsed <= 1400){
      // 600-1400ms: hold exploded; one 400ms fill/stroke blink; counter ticks.
      setFace(top, D_TOP, 1);
      setFace(xFace, D_X, 1);
      setFace(zFace, D_Z, 1);
      opacity(lblTop, 1); opacity(lblX, 1); opacity(lblZ, 1);
      opacity(hidden, 0); opacity(lblNever, 0);
      if (!tickFired){
        tickFired = true;
        mounted.counter('shapes', 3);
      }
      if (elapsed <= 1000){
        var bt = (elapsed - 600) / 400;
        var amt = bt < 0.5 ? bt * 2 : (1 - bt) * 2;
        setBlink(top, BASE.top, amt);
        setBlink(xFace, BASE.x, amt);
        setBlink(zFace, BASE.z, amt);
      } else {
        setBlink(top, BASE.top, 0);
        setBlink(xFace, BASE.x, 0);
        setBlink(zFace, BASE.z, 0);
      }
    } else if (elapsed <= 2000){
      // 1400-2000ms: the never-drawn faces ghost in, hold, fade out.
      var hg = elapsed - 1400;
      var gOp = hg <= 100 ? hg / 100 : (hg <= 500 ? 1 : 1 - (hg - 500) / 100);
      opacity(hidden, gOp); opacity(lblNever, gOp);
    } else {
      // 2000-2400ms: slide back and reassemble; labels fade with them.
      var rt = ease((elapsed - 2000) / 400);
      setFace(top, D_TOP, 1 - rt);
      setFace(xFace, D_X, 1 - rt);
      setFace(zFace, D_Z, 1 - rt);
      opacity(lblTop, 1 - rt); opacity(lblX, 1 - rt); opacity(lblZ, 1 - rt);
      opacity(hidden, 0); opacity(lblNever, 0);
    }

    raf = requestAnimationFrame(step);
  }

  function play(){
    triggered = true;
    tickFired = false;
    if (raf != null) cancelAnimationFrame(raf);
    startTime = performance.now();
    raf = requestAnimationFrame(step);
  }

  resetInstant();

  if (REDUCED){
    staticReduced();
  } else {
    BouquetExplainer.scrub(section, {
      band: 0.6,
      onProgress: function(p){
        if (!triggered && p >= 0.15) play();
      },
      onLeave: function(){
        triggered = false;
        resetInstant();
      }
    });
  }

  var replayBtn = section.querySelector('.beat__replay');
  if (replayBtn){
    replayBtn.addEventListener('click', function(){
      if (REDUCED){ staticReduced(); return; }
      resetInstant();
      play();
    });
  }

  BouquetExplainer.beats['2'] = mounted;
})();
