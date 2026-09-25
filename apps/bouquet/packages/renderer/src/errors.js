// errors.js — error types for the bouquet renderer product API.
//
// Not part of the reference loader; introduced by W2a for callers (the
// driver) that need to distinguish "the canvas/context this renderer was
// asked to paint into isn't usable" from any other failure mode. See
// CHANGES.md for why.
//
// The class itself lives in painter-canvas.js so that file (whose
// assertPaintable() throws it) keeps ZERO imports, as CONTRACT.md section 2
// and scripts/lint-no-dom.mjs require. Re-exporting it here keeps a single
// class identity: `instanceof RendererUnavailableError` holds whichever
// module a caller imports it from.

export { RendererUnavailableError } from './painter-canvas.js';
