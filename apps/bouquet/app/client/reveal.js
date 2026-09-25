/**
 * @file mountReveal(root, data, {preview, onEvent}) — the recipient reveal
 * gesture (CONTRACT.md §6). Owns its own rAF loop (ONE paint per frame),
 * driven by reveal-machine.js's pure state machine. Zero timing/animation
 * logic lives here beyond translating DOM input into machine events and the
 * fly-in clock itself (ported from driver.js's timeline, not driver.js
 * itself: driver.js is the create-page hero, this is the recipient page,
 * and the two need different DOM/lifecycle wiring around the same core.js
 * + painter-canvas.js primitives).
 *
 * Reduced motion: no fly-in (lands still at p=1/yaw=0 immediately) and the
 * Open button is the only way to reveal (no wheel/scrub — CONTRACT.md
 * "landed still, no fly-in, Open reveals instantly" folded into the machine
 * by feeding it a synthetic flyDone before any input can reach it).
 */

import { createModel } from '../../packages/renderer/src/core.js';
import { paint, assertPaintable } from '../../packages/renderer/src/painter-canvas.js';
import { paletteFor } from '../../packages/modes/modes.js';
import { SHAPES, DEFAULT_SHAPE } from '../../packages/renderer/src/shapes.js';
import { createRevealMachine } from './reveal-machine.js';

const FLY_MS = 4200;
const YAW_IN = -540;
const MAX_STEP_MS = 120;

/** Cap DPR the same way the shipping loader/driver do. */
function capDpr(raw) {
  return Math.min(raw || 1, 2);
}

function defaultReducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * @typedef {Object} RevealData
 * @property {string} mode
 * @property {string} shape
 */

/**
 * @param {HTMLElement} root container: expected to hold `[data-reveal-stage]`
 *   (a wrapper around the canvas), `canvas[data-reveal-canvas]` and
 *   `[data-reveal-open]` (the always-present Open button). Anything else
 *   (hint text, message card) is looked up by the caller, not here.
 * @param {RevealData} data
 * @param {{preview?: boolean, onEvent?: (name: string) => void}} [opts]
 * @returns {{destroy: () => void}}
 */
export function mountReveal(root, data, opts = {}) {
  const preview = !!opts.preview;
  const onEvent = typeof opts.onEvent === 'function' ? opts.onEvent : () => {};

  const stage = root.querySelector('[data-reveal-stage]');
  const canvas = root.querySelector('[data-reveal-canvas]');
  const openBtn = root.querySelector('[data-reveal-open]');
  if (!stage || !canvas) {
    throw new Error('bouquet: mountReveal requires [data-reveal-stage] and [data-reveal-canvas]');
  }

  const reducedMotion = defaultReducedMotion();
  const now = () => performance.now();
  const machine = createRevealMachine({ now });

  const palette = paletteFor(data.mode || 'rose');
  const params = SHAPES[data.shape] || SHAPES[DEFAULT_SHAPE] || {};
  const model = createModel({ palette, params });

  const ctx = canvas.getContext('2d', { alpha: true });

  let destroyed = false;
  let rafId = null;
  let lastTs = 0;
  let elapsedMs = 0;
  let revealed = false;

  function measure() {
    return {
      cssW: stage.clientWidth,
      cssH: stage.clientHeight,
      dpr: capDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1),
    };
  }

  function applySize(vp) {
    canvas.style.width = vp.cssW + 'px';
    canvas.style.height = vp.cssH + 'px';
    canvas.width = Math.round(vp.cssW * vp.dpr);
    canvas.height = Math.round(vp.cssH * vp.dpr);
  }

  function paintFrame(p, yaw, q) {
    model.set({ p, q, yaw });
    paint(ctx, model.frame());
  }

  const initialVp = measure();
  applySize(initialVp);
  assertPaintable(canvas, ctx);
  model.layout(initialVp);

  function fireRevealedEffects() {
    if (revealed) return;
    revealed = true;
    // Once revealed the stage stops swallowing scroll/touch so the message
    // card below it is reachable (review-gate fix).
    stage.style.touchAction = '';
    stage.classList.add('is-revealed');
    root.dispatchEvent(new CustomEvent('bouquet:revealed', { bubbles: true }));
    onEvent('revealed');
  }

  function applyState(state) {
    let p;
    let yaw;
    if (reducedMotion) {
      p = 1;
      yaw = 0;
    } else if (state.phase === 'fly' && !state.skipFly) {
      p = elapsedMs / FLY_MS < 1 ? elapsedMs / FLY_MS : 1;
      yaw = YAW_IN * (1 - p);
    } else {
      p = 1;
      yaw = 0;
    }
    paintFrame(p, yaw, state.q);
    if (state.phase === 'revealed') fireRevealedEffects();
  }

  // ---- reduced motion: land still immediately, no fly-in ----
  if (reducedMotion) {
    machine.send({ type: 'flyDone' });
    applyState(machine.getState());
  } else {
    applyState(machine.getState()); // paint the initial fly pose before rAF starts
  }

  // ---- rAF loop: drives the fly-in clock, then re-paints on every tick so
  // holding/scrubbing/bursting (driven by discrete events below) animate
  // smoothly even though those events themselves never advance time. ----
  function frameLoop(ts) {
    if (destroyed) return;
    let dt = lastTs ? ts - lastTs : 0;
    lastTs = ts;
    if (dt < 0) dt = 0;
    if (dt > MAX_STEP_MS) dt = MAX_STEP_MS;

    const state = machine.getState();
    if (!reducedMotion && state.phase === 'fly' && !state.skipFly) {
      elapsedMs += dt;
      if (elapsedMs >= FLY_MS) {
        elapsedMs = FLY_MS;
        const next = machine.send({ type: 'flyDone' });
        applyState(next);
      } else {
        applyState(state);
      }
    } else {
      const ticked = machine.send({ type: 'tick', t: ts });
      applyState(ticked);
    }

    if (!destroyed) rafId = requestAnimationFrame(frameLoop);
  }
  if (!reducedMotion) rafId = requestAnimationFrame(frameLoop);

  // ---- input wiring ----
  function send(event) {
    if (destroyed) return;
    let state = machine.send(event);
    // Reduced motion has no rAF loop to tick a burst forward, so finish it
    // in one step: the burst was anchored at now(), so a tick one burst
    // length (plus slack) later lands it at its target (review-gate fix).
    if (reducedMotion && state.phase === 'bursting') {
      state = machine.send({ type: 'tick', t: now() + 1000 });
    }
    applyState(state);
  }

  function onPointerDown(e) {
    stage.setPointerCapture && canvas.setPointerCapture && trySetCapture(e.pointerId);
    send({ type: 'pointerdown', id: e.pointerId });
  }
  function trySetCapture(id) {
    try {
      canvas.setPointerCapture(id);
    } catch {
      // best-effort only
    }
  }
  let downY = null;
  function onPointerDownTrack(e) {
    // A press on the Open button must stay a button press: capturing the
    // pointer to the canvas would retarget the click away from it
    // (review-gate fix: mouse clicks on Open never fired).
    if (openBtn && e.target instanceof Node && openBtn.contains(e.target)) return;
    downY = e.clientY;
    onPointerDown(e);
  }
  function onPointerMove(e) {
    if (downY === null) return;
    send({ type: 'pointermove', id: e.pointerId, dy: e.clientY - downY });
  }
  function onPointerUp(e) {
    downY = null;
    send({ type: 'pointerup', id: e.pointerId });
  }
  function onPointerCancel() {
    downY = null;
    send({ type: 'pointercancel' });
  }
  function onWheel(e) {
    if (revealed) return; // let the page scroll to the message
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    send({ type: 'wheel', dy });
  }
  const KEY_TARGETS = new Set(['ArrowDown', 'PageDown', ' ', 'Space', 'Spacebar', 'Enter']);
  function onKeyDown(e) {
    if (revealed || !KEY_TARGETS.has(e.key)) return;
    const active = document.activeElement;
    if (active && active !== stage && active !== document.body && !stage.contains(active)) return;
    e.preventDefault();
    // Enter anywhere, or Space on the focused Open button (native button
    // semantics), opens; other keys nudge q (review-gate fix).
    if (e.key === 'Enter' || (active === openBtn && (e.key === ' ' || e.key === 'Spacebar'))) {
      send({ type: 'open' });
    } else {
      send({ type: 'key', key: e.key });
    }
  }
  function onOpenClick() {
    send({ type: 'open' });
  }

  stage.style.touchAction = 'none';
  stage.addEventListener('pointerdown', onPointerDownTrack);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerCancel);
  stage.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);
  if (openBtn) openBtn.addEventListener('click', onOpenClick);

  // ---- first trusted input -> POST /api/open (unless preview) ----
  let openedReported = false;
  function reportFirstInput(e) {
    if (openedReported || preview) return;
    if (e && e.isTrusted === false) return;
    openedReported = true;
    onEvent('input');
  }
  const INPUT_EVENTS = ['pointerdown', 'wheel', 'keydown'];
  for (const type of INPUT_EVENTS) {
    stage.addEventListener(type, reportFirstInput);
  }
  if (openBtn) openBtn.addEventListener('click', reportFirstInput);
  document.addEventListener('keydown', reportFirstInput);

  // ---- resize: relayout without restarting anything ----
  let resizeTimer = null;
  function handleResize() {
    resizeTimer = null;
    if (destroyed) return;
    const vp = measure();
    applySize(vp);
    model.relayout(vp);
    applyState(machine.getState());
  }
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    });
    ro.observe(stage);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    if (ro) ro.disconnect();
    stage.removeEventListener('pointerdown', onPointerDownTrack);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', onPointerUp);
    stage.removeEventListener('pointercancel', onPointerCancel);
    stage.removeEventListener('wheel', onWheel);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keydown', reportFirstInput);
    if (openBtn) {
      openBtn.removeEventListener('click', onOpenClick);
      openBtn.removeEventListener('click', reportFirstInput);
    }
    for (const type of INPUT_EVENTS) {
      stage.removeEventListener(type, reportFirstInput);
    }
  }

  return { destroy };
}
