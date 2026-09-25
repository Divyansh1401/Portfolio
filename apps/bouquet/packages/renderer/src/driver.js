// driver.js — the product fly-in player. NEW code: it does not port the
// reference loader's run() (that timeline is bespoke to the shipping
// portfolio loader, gated behind ENABLED/localStorage/etc). This driver is a
// standalone rAF loop built on top of core.js's model and
// painter-canvas.js's paint(), for apps/bouquet's own hero.
//
// Zero DOM assumptions beyond: `canvas` is a canvas-like object with
// `getContext('2d')`, `style`, `width`/`height`, and a `parentNode` that is
// itself an EventTarget-like object exposing `clientWidth`/`clientHeight`
// and `addEventListener`/`removeEventListener`. That is enough to run this
// file, unmodified, against a real <canvas> in a browser or a fake one in a
// Node unit test.

import { createModel } from './core.js';
import { paint, assertPaintable } from './painter-canvas.js';

const DEFAULT_FLY_MS = 4200;
const DEFAULT_YAW_IN = -540;
const DEFAULT_TURNS = 1;
const DEFAULT_FILL = 0.69;

// A ResizeObserver batch is ignored when it changes ONLY the parent's
// height, by less than this many px — mobile browsers grow/shrink the
// viewport by their own chrome (URL bar show/hide) on scroll, which must
// not restart the flight geometry mid-flight or mid-idle.
const RESIZE_IGNORE_HEIGHT_PX = 120;
const RESIZE_DEBOUNCE_MS = 150;

// Each rAF step's delta is capped here before it is added to the fly clock,
// so a dropped-frame stall (tab throttled, a long GC pause, a debugger
// breakpoint) cannot make the bouquet jump most of the way home in one tick.
const MAX_STEP_MS = 120;

const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel'];

function defaultReducedMotion() {
  try {
    return (
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

function capDpr(raw) {
  return Math.min(raw || 1, 2);
}

/**
 * @typedef {Object} PlayerOpts
 * @property {number} [flyMs]
 * @property {number} [yawIn]
 * @property {number} [turns]
 * @property {number} [fill]
 * @property {boolean} [reducedMotion]
 * @property {() => void} [onLanded]
 * @property {() => number} [now]
 * @property {(cb: FrameRequestCallback) => number} [raf]
 * @property {(id: number) => void} [caf]
 */

/**
 * @param {HTMLCanvasElement|object} canvas
 * @param {PlayerOpts} [opts]
 * @returns {{play: () => void, skip: () => void, setQ: (q: number) => void, destroy: () => void}}
 */
export function createPlayer(canvas, opts = {}) {
  const flyMs = opts.flyMs !== undefined ? opts.flyMs : DEFAULT_FLY_MS;
  const yawIn = opts.yawIn !== undefined ? opts.yawIn : DEFAULT_YAW_IN;
  const turns = opts.turns !== undefined ? opts.turns : DEFAULT_TURNS;
  const fill = opts.fill !== undefined ? opts.fill : DEFAULT_FILL;
  const reducedMotion =
    opts.reducedMotion !== undefined ? opts.reducedMotion : defaultReducedMotion();
  const onLanded = typeof opts.onLanded === 'function' ? opts.onLanded : null;
  const now = opts.now || (() => performance.now());
  const raf = opts.raf || ((cb) => requestAnimationFrame(cb));
  const caf = opts.caf || ((id) => cancelAnimationFrame(id));

  const parent = canvas.parentNode;
  const ctx = canvas.getContext('2d', { alpha: true });

  const model = createModel({ turns, ms: flyMs, fill });

  let destroyed = false;
  let running = false;
  let landedFlag = false;
  let wasRunningBeforeHidden = false;
  let rafId = null;
  let lastTs = 0;
  let elapsedMs = 0;
  let currentP = 0;
  let currentYaw = yawIn;
  let currentQ = 0;

  function measure() {
    const dpr = capDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
    return { cssW: parent.clientWidth, cssH: parent.clientHeight, dpr };
  }

  function applySize(vp) {
    canvas.style.width = vp.cssW + 'px';
    canvas.style.height = vp.cssH + 'px';
    canvas.width = Math.round(vp.cssW * vp.dpr);
    canvas.height = Math.round(vp.cssH * vp.dpr);
  }

  function paintOnce() {
    model.set({ p: currentP, q: currentQ, yaw: currentYaw });
    paint(ctx, model.frame());
  }

  function markLanded() {
    if (landedFlag) return;
    landedFlag = true;
    if (onLanded) onLanded();
  }

  // ---- size, guard, build (in that order — see CONTRACT.md §1.3/§2) ----
  const initialVp = measure();
  applySize(initialVp);
  assertPaintable(canvas, ctx);
  model.layout(initialVp);
  let lastCssW = initialVp.cssW;
  let lastCssH = initialVp.cssH;

  if (reducedMotion) {
    currentP = 1;
    currentYaw = 0;
    paintOnce();
    markLanded();
  } else {
    // an initial frame at the flight's starting pose, so the canvas is never
    // blank while a caller decides when to call play().
    paintOnce();
  }

  // ---- fly-in clock ----
  function tick() {
    if (destroyed || !running) return;
    const ts = now();
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt < 0) dt = 0;
    if (dt > MAX_STEP_MS) dt = MAX_STEP_MS;
    elapsedMs += dt;

    const p = flyMs > 0 ? Math.min(1, elapsedMs / flyMs) : 1;
    currentP = p;
    currentYaw = yawIn * (1 - p);
    paintOnce();

    if (p >= 1) {
      running = false;
      rafId = null;
      markLanded();
      return;
    }
    rafId = raf(tick);
  }

  function startLoop() {
    lastTs = now();
    running = true;
    rafId = raf(tick);
  }

  function play() {
    if (destroyed || reducedMotion || landedFlag || running) return;
    startLoop();
  }

  function skip() {
    if (destroyed) return;
    if (rafId !== null) {
      caf(rafId);
      rafId = null;
    }
    running = false;
    elapsedMs = flyMs;
    currentP = 1;
    currentYaw = 0;
    paintOnce();
    markLanded();
  }

  function setQ(q) {
    if (destroyed) return;
    currentQ = q;
    paintOnce();
  }

  // ---- skip-to-landed on the first trusted interaction ----
  const skipListeners = [];
  function onSkipEvent(e) {
    if (landedFlag || destroyed) return;
    if (e && e.isTrusted === false) return; // untrusted (synthetic) events never skip
    skip();
  }
  for (const el of [canvas, parent]) {
    if (!el || typeof el.addEventListener !== 'function') continue;
    for (const type of SKIP_EVENTS) {
      el.addEventListener(type, onSkipEvent);
      skipListeners.push([el, type, onSkipEvent]);
    }
  }

  // ---- pause while hidden, resume without a jump ----
  function onVisibilityChange() {
    if (destroyed || typeof document === 'undefined') return;
    if (document.hidden) {
      if (running) {
        wasRunningBeforeHidden = true;
        running = false;
        if (rafId !== null) {
          caf(rafId);
          rafId = null;
        }
      }
    } else if (wasRunningBeforeHidden && !landedFlag) {
      wasRunningBeforeHidden = false;
      startLoop(); // lastTs is re-read from now() here, so the hidden gap is never counted
    }
  }
  const hasVisibilityApi = typeof document !== 'undefined' && typeof document.addEventListener === 'function';
  if (hasVisibilityApi) {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // ---- debounced relayout on parent resize ----
  let resizeTimer = null;
  function handleResize() {
    resizeTimer = null;
    if (destroyed) return;
    const vp = measure();
    const widthChanged = vp.cssW !== lastCssW;
    const heightChanged = vp.cssH !== lastCssH;
    if (!widthChanged && !heightChanged) return;
    if (!widthChanged && heightChanged && Math.abs(vp.cssH - lastCssH) < RESIZE_IGNORE_HEIGHT_PX) {
      return;
    }
    lastCssW = vp.cssW;
    lastCssH = vp.cssH;
    applySize(vp);
    model.relayout(vp);
    paintOnce();
  }
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(parent);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    running = false;
    if (rafId !== null) {
      caf(rafId);
      rafId = null;
    }
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    if (ro) {
      ro.disconnect();
      ro = null;
    }
    for (const [el, type, fn] of skipListeners) {
      el.removeEventListener(type, fn);
    }
    skipListeners.length = 0;
    if (hasVisibilityApi) {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  }

  return { play, skip, setQ, destroy };
}
