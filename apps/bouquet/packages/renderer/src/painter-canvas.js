// painter-canvas.js — paints a core.js Frame onto a Canvas2D context.
//
// Op-for-op port of reference/bouquet-loader.ref.js draw()'s canvas half
// (ref 1018-1048). Zero imports; touches nothing but `ctx` and `frame`.
// See CONTRACT.md section 2.

/**
 * Thrown when a paint target (canvas/context pair) cannot be used to render:
 * a null/undefined 2D context, or a canvas with zero width or height.
 * Defined HERE (not in errors.js) so this file keeps zero imports
 * (CONTRACT.md section 2, scripts/lint-no-dom.mjs); src/errors.js re-exports
 * this same class, so there is exactly one class identity for instanceof.
 */
export class RendererUnavailableError extends Error {
  constructor(message = 'bouquet: renderer unavailable for this canvas/context') {
    super(message);
    this.name = 'RendererUnavailableError';
  }
}

/**
 * Guard callers (the driver) are expected to call BEFORE building or
 * painting a model against a given canvas/context: a null/undefined 2D
 * context, or a canvas with zero width or height, can never be painted to,
 * so fail fast with a typed error instead of building a model for nothing.
 * Not part of the reference loader — see CHANGES.md.
 * @param {{width?:number, height?:number}} canvas
 * @param {CanvasRenderingContext2D|null|undefined} ctx
 */
export function assertPaintable(canvas, ctx){
  if(ctx === null || ctx === undefined){
    throw new RendererUnavailableError('bouquet: 2D context unavailable');
  }
  const w = canvas ? canvas.width : 0;
  const h = canvas ? canvas.height : 0;
  if(!w || !h){
    throw new RendererUnavailableError('bouquet: canvas has zero width or height');
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./core.js').Frame} f
 * @returns {undefined}
 */
export function paint(ctx, f){
  const b = f.basis, ExX=b.ExX, ExY=b.ExY, EzX=b.EzX, EzY=b.EzY, EyY=b.EyY;
  ctx.clearRect(0,0,f.width,f.height);
  ctx.lineWidth=1; ctx.lineJoin='miter';
  for(let k=0;k<f.n;k++){
    const X=f.X[k], Y=f.Y[k], t=f.tone[f.pal[k]];
    const bxX = b.vxp ? X+ExX : X, bxY = b.vxp ? Y+ExY : Y;
    const bzX = b.vzp ? X+EzX : X, bzY = b.vzp ? Y+EzY : Y;
    if(b.drawXFace) q4(ctx, bxX, bxY, bxX, bxY+EyY, bxX+EzX, bxY+EyY+EzY, bxX+EzX, bxY+EzY, t[1]);
    if(b.drawZFace) q4(ctx, bzX, bzY, bzX, bzY+EyY, bzX+ExX, bzY+EyY+ExY, bzX+ExX, bzY+ExY, t[2]);
    q4(ctx, X, Y+EyY, X+ExX, Y+EyY+ExY, X+ExX+EzX, Y+EyY+ExY+EzY, X+EzX, Y+EyY+EzY, t[0]);
  }
}

// scalar args, no arrays (ref 1041-1048)
function q4(ctx, x1,y1,x2,y2,x3,y3,x4,y4,fill){
  ctx.beginPath();
  ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.lineTo(x4,y4);
  ctx.closePath();
  ctx.fillStyle=fill; ctx.fill();
  // stroke seals the seams between THIS cube's three quads
  ctx.strokeStyle=fill; ctx.stroke();
}
