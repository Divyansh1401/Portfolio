/* ============================================================
   Settlr — QR helper
   Thin wrapper over the vendored qrcode-generator lib (js/lib/qrcode.js,
   MIT, Kazuhiko Arase). Generates an offline, PWA-friendly QR with NO
   backend and exposes a single helper:

     window.SettlrQR.svgDataUri(text) → 'data:image/svg+xml,…'

   Used to render a per-user invite QR at runtime (replacing the old
   hardcoded /assets/qr/divyansh.svg). Returns '' if the lib is missing
   or generation fails, so callers can fall back gracefully.
   ============================================================ */
(function () {
  'use strict';

  function svgDataUri(text) {
    if (typeof window.qrcode !== 'function' || !text) return '';
    try {
      // typeNumber 0 = auto-size to fit the data; 'M' = medium error correction.
      var qr = window.qrcode(0, 'M');
      qr.addData(String(text));
      qr.make();
      // scalable:true drops fixed px width/height so the SVG fills its box via
      // viewBox; cellSize/margin keep the modules crisp.
      var svg = qr.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    } catch (e) {
      return '';
    }
  }

  window.SettlrQR = { svgDataUri: svgDataUri };
})();
