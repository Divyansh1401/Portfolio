/**
 * @file A single landed still (p=1, q=0, yaw=0) of a flower's bouquet,
 * painted onto a canvas sized to its parent's width. Used by the sent
 * page and the flower catalogue cards on the create page.
 */

import { createModel } from '../../packages/renderer/src/core.js';
import { paint } from '../../packages/renderer/src/painter-canvas.js';
import { paletteFor } from '../../packages/modes/modes.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mode
 */
export function paintStill(canvas, mode) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const palette = paletteFor(mode);
  const model = createModel({ palette });
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.parentNode ? canvas.parentNode.clientWidth || canvas.width : canvas.width;
  const cssH = cssW;
  if (!cssW) return;
  const dims = model.layout({ cssW, cssH, dpr });
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = dims.width;
  canvas.height = dims.height;
  model.set({ p: 1, q: 0, yaw: 0 });
  paint(ctx, model.frame());
}
