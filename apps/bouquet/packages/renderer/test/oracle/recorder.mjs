// recorder.mjs — a fake CanvasRenderingContext2D that records every call it
// receives into `rec.ops`, verbatim, so the renderer's draw output can be
// asserted on as data (numbers) rather than as pixels.
//
// Recorded op shapes:
//   ['clear', x, y, w, h]                     — clearRect(x,y,w,h)
//   ['fill', fillStyle, ...pathCoords]         — fill(), path coords flattened
//                                                 as the moveTo/lineTo args
//                                                 recorded since the last
//                                                 beginPath(), in order
//   ['stroke', strokeStyle, lineWidth, lineJoin, ...pathCoords] — stroke()
//   ['alpha', value]                           — a globalAlpha assignment
//
// fillStyle/strokeStyle are recorded as whatever plain value was assigned —
// no colour normalisation, no canonicalisation.

/**
 * @returns {{
 *   ctx: object,
 *   ops: Array<any[]>,
 *   reset: () => void,
 *   getImageData: () => {data: Uint8ClampedArray},
 * }}
 */
export function makeRecorder() {
  const rec = {
    ops: [],
    reset() {
      rec.ops.length = 0;
    },
  };

  // Path state, tracked since the last beginPath().
  let pathCoords = [];

  // Style state, as plain assigned values (no normalisation).
  let fillStyle = '#000000';
  let strokeStyle = '#000000';
  let lineWidth = 1;
  let lineJoin = 'miter';
  let globalAlpha = 1;

  const ctx = {
    clearRect(x, y, w, h) {
      rec.ops.push(['clear', x, y, w, h]);
    },
    beginPath() {
      pathCoords = [];
    },
    moveTo(x, y) {
      pathCoords.push(x, y);
    },
    lineTo(x, y) {
      pathCoords.push(x, y);
    },
    closePath() {
      // no-op for recording purposes: fill()/stroke() below capture the
      // path as accumulated since the last beginPath().
    },
    fill() {
      rec.ops.push(['fill', fillStyle, ...pathCoords]);
    },
    stroke() {
      rec.ops.push(['stroke', strokeStyle, lineWidth, lineJoin, ...pathCoords]);
    },
    getImageData() {
      return { data: new Uint8ClampedArray(4) };
    },
    // Methods the loader may call that don't need to be observed for the
    // oracle's purposes, but must exist so mount()/draw() never throws.
    save() {},
    restore() {},
    translate() {},
    scale() {},
    rotate() {},
    setTransform() {},
    rect() {},
    arc() {},
    measureText() {
      return { width: 0 };
    },
    fillText() {},
    strokeText() {},
    drawImage() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };

  Object.defineProperty(ctx, 'fillStyle', {
    get() {
      return fillStyle;
    },
    set(v) {
      fillStyle = v;
    },
  });
  Object.defineProperty(ctx, 'strokeStyle', {
    get() {
      return strokeStyle;
    },
    set(v) {
      strokeStyle = v;
    },
  });
  Object.defineProperty(ctx, 'lineWidth', {
    get() {
      return lineWidth;
    },
    set(v) {
      lineWidth = v;
    },
  });
  Object.defineProperty(ctx, 'lineJoin', {
    get() {
      return lineJoin;
    },
    set(v) {
      lineJoin = v;
    },
  });
  Object.defineProperty(ctx, 'globalAlpha', {
    get() {
      return globalAlpha;
    },
    set(v) {
      globalAlpha = v;
      rec.ops.push(['alpha', v]);
    },
  });

  rec.ctx = ctx;
  rec.getImageData = ctx.getImageData;
  return rec;
}
