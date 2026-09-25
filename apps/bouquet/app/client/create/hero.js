/**
 * @file The create page's live bouquet preview (top of page / left column).
 * A landed (p=1, q=0), slowly-turning bouquet reused across the flower and
 * shape pickers. Owns its own rAF loop, throttled to ~20fps by frame
 * skipping, paused via visibilitychange. Mode switches cross-fade the
 * material palette over 300ms with `mixPalettes` (instant under reduced
 * motion); shape switches rebuild the geometry in place via `model.params`.
 * Reduced motion: no idle turn at all.
 */

import { createModel } from '../../../packages/renderer/src/core.js';
import { paint, assertPaintable } from '../../../packages/renderer/src/painter-canvas.js';
import { paletteFor } from '../../../packages/modes/modes.js';
import { mixPalettes } from '../../../packages/renderer/src/palette.js';
import { SHAPES, DEFAULT_SHAPE } from '../../../packages/renderer/src/shapes.js';

const FRAME_MS = 1000 / 20; // ~20fps
const TRANSITION_MS = 300;
const YAW_DEG_PER_SEC = 8;

/** Cap DPR the same way the loader/driver/reveal do. */
function capDpr(raw) {
  return Math.min(raw || 1, 2);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{modeId: string, shapeId: string, reducedMotion: boolean}} opts
 * @returns {{setMode: (id: string) => void, setShape: (id: string) => void, destroy: () => void}}
 */
export function createHero(canvas, opts) {
  const reducedMotion = !!opts.reducedMotion;
  let currentModeId = opts.modeId;
  let currentShapeId = opts.shapeId;

  let displayedPalette = paletteFor(currentModeId);
  const model = createModel({
    palette: displayedPalette,
    params: SHAPES[currentShapeId] || SHAPES[DEFAULT_SHAPE],
  });

  const ctx = canvas.getContext('2d', { alpha: true });

  let yaw = 0;
  /** @type {{from: Array, to: Array, start: number}|null} */
  let transition = null;
  let destroyed = false;
  let rafId = null;
  let lastPaintTs = 0;
  let visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';

  function measure() {
    const parent = canvas.parentNode;
    const cssW = parent && parent.clientWidth ? parent.clientWidth : canvas.width || 1;
    const cssH = parent && parent.clientHeight ? parent.clientHeight : cssW;
    return { cssW, cssH, dpr: capDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1) };
  }

  function applySize(vp) {
    canvas.style.width = vp.cssW + 'px';
    canvas.style.height = vp.cssH + 'px';
    canvas.width = Math.max(1, Math.round(vp.cssW * vp.dpr));
    canvas.height = Math.max(1, Math.round(vp.cssH * vp.dpr));
  }

  const vp0 = measure();
  applySize(vp0);
  assertPaintable(canvas, ctx);
  model.layout(vp0);

  function paintNow() {
    model.set({ p: 1, q: 0, yaw });
    paint(ctx, model.frame());
  }

  paintNow();

  function tick(ts) {
    if (destroyed) return;
    rafId = requestAnimationFrame(tick);
    if (!visible) return;
    if (lastPaintTs && ts - lastPaintTs < FRAME_MS) return;
    const dt = lastPaintTs ? ts - lastPaintTs : FRAME_MS;
    lastPaintTs = ts;

    yaw += (YAW_DEG_PER_SEC * dt) / 1000;
    if (yaw > 180) yaw -= 360;

    if (transition) {
      const t = Math.min(1, (ts - transition.start) / TRANSITION_MS);
      const mixed = mixPalettes(transition.from, transition.to, t);
      model.setPalette(mixed);
      displayedPalette = mixed;
      if (t >= 1) transition = null;
    }

    paintNow();
  }

  if (!reducedMotion) {
    rafId = requestAnimationFrame(tick);
  }

  function onVisibility() {
    visible = document.visibilityState !== 'hidden';
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  /** @param {string} id */
  function setMode(id) {
    if (id === currentModeId) return;
    currentModeId = id;
    const target = paletteFor(id);
    if (reducedMotion) {
      model.setPalette(target);
      displayedPalette = target;
      transition = null;
      paintNow();
    } else {
      transition = { from: displayedPalette, to: target, start: performance.now() };
    }
  }

  /** @param {string} id */
  function setShape(id) {
    if (id === currentShapeId) return;
    currentShapeId = id;
    model.params(SHAPES[id] || SHAPES[DEFAULT_SHAPE]);
    paintNow();
  }

  let resizeTimer = null;
  function handleResize() {
    resizeTimer = null;
    if (destroyed) return;
    const vp = measure();
    applySize(vp);
    model.relayout(vp);
    paintNow();
  }
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    });
    ro.observe(canvas.parentNode || canvas);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    if (ro) ro.disconnect();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
  }

  return { setMode, setShape, destroy };
}
