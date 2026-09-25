// palette.js — pure colour math for mode transitions. Zero imports, no DOM.
//
// `model.setPalette(triples)` (core.js) swaps the renderer's material
// colours instantly. A caller animating a mode change (e.g. rose -> marigold
// over 300ms) computes an in-between palette each frame with `mixPalettes`
// and feeds it to `setPalette`; this file owns none of that timing, only the
// per-channel colour lerp.

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

/** @param {string} hex '#rrggbb' */
function hex2rgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Uppercase '#RRGGBB', matching the `'#rrggbb' uppercase` convention
 * `packages/modes/modes.js`'s `triple()` and `MODES` use, so
 * `mixPalettes(a, b, 0)`/`mixPalettes(a, b, 1)` round-trip to the exact
 * input strings, not just the same colour.
 * @param {number[]} rgb
 */
function rgb2hex(rgb) {
  return (
    '#' +
    rgb
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function assertHexTriple(t, label) {
  if (!Array.isArray(t) || t.length !== 3) {
    throw new TypeError(`bouquet: ${label} must be a [top, +x, +z] triple`);
  }
  for (const s of t) {
    if (typeof s !== 'string' || !HEX6_RE.test(s)) {
      throw new TypeError(`bouquet: ${label} colours must be #rrggbb strings`);
    }
  }
}

/**
 * Per-channel RGB lerp between two hex colours.
 * @param {string} a '#rrggbb'
 * @param {string} b '#rrggbb'
 * @param {number} t 0..1 (not clamped — callers pass an already-eased t)
 * @returns {string} '#rrggbb'
 */
export function mixHex(a, b, t) {
  const ca = hex2rgb(a);
  const cb = hex2rgb(b);
  return rgb2hex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t));
}

/**
 * Per-channel RGB lerp between two palettes of the SAME shape (each an array
 * of `[top, +x, +z]` hex triples — 10 or 11 entries, as `core.js`'s
 * `createModel`/`setPalette` accept). `mixPalettes(a, b, 0)` deep-equals `a`
 * (as hex strings) and `mixPalettes(a, b, 1)` deep-equals `b`.
 * @param {Array<[string,string,string]>} a
 * @param {Array<[string,string,string]>} b
 * @param {number} t 0..1 (not clamped)
 * @returns {Array<[string,string,string]>}
 */
export function mixPalettes(a, b, t) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new TypeError('bouquet: mixPalettes requires two palettes of equal length');
  }
  return a.map((triple, i) => {
    const other = b[i];
    assertHexTriple(triple, `palette a[${i}]`);
    assertHexTriple(other, `palette b[${i}]`);
    return [
      mixHex(triple[0], other[0], t),
      mixHex(triple[1], other[1], t),
      mixHex(triple[2], other[2], t),
    ];
  });
}
