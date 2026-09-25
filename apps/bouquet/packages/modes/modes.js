/**
 * @file Flower colour "modes" — the design-system palette presets for the
 * bouquet app. Each mode drives both the renderer's bouquet material
 * palette and the page's UI colour tokens (see build-mode-css.mjs).
 *
 * IMPORTANT: `paletteFor('rose')` returns the reference loader's ORIGINAL
 * 10 triples verbatim (slots 0-9), copied here from
 * ../renderer/src/core.js's DEFAULT_PALETTE, so the default render stays
 * byte-identical to today. core.js does not export DEFAULT_PALETTE, so it
 * is copied rather than imported (see CONTRACT.md item 1: "check" whether
 * it is exported — it is not).
 */

/** @typedef {`#${string}`} HexColor */

/**
 * @typedef {Object} BouquetColours
 * @property {[HexColor, HexColor, HexColor]} petals deep, mid, light
 * @property {[HexColor, HexColor, HexColor]} centres deep, mid, light
 * @property {HexColor} ribbon
 */

/**
 * @typedef {Object} UiColours
 * @property {HexColor} ground page background
 * @property {HexColor} surface card/panel background
 * @property {HexColor} ink primary text
 * @property {HexColor} muted secondary text
 * @property {HexColor} accent primary action colour
 * @property {HexColor} onAccent text/icon colour drawn on `accent`
 * @property {HexColor} focus focus ring colour
 * @property {HexColor} border hairline colour
 */

/**
 * @typedef {Object} Mode
 * @property {string} id
 * @property {string} name
 * @property {BouquetColours} bouquet
 * @property {UiColours} ui
 */

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Exact copy of the reference loader's material palette
 * (../renderer/src/core.js DEFAULT_PALETTE). Used verbatim as slots 0-9 of
 * `paletteFor('rose')` so the default render is byte-identical to today.
 * @type {Array<[HexColor, HexColor, HexColor]>}
 */
const REFERENCE_PALETTE = [
  ['#C41E5A', '#981746', '#6F1133'], // 0 crimson petal (deep petal)
  ['#7A1338', '#5F0E2B', '#450A1F'], // 1 crimson centre (deep centre)
  ['#FB6F92', '#D15D7A', '#A94B62'], // 2 rose mid petal
  ['#9C455B', '#763444', '#522430'], // 3 rose mid centre
  ['#FFB3C6', '#DB9AAA', '#B8818F'], // 4 rose light petal
  ['#9E6F7B', '#7D5861', '#5E4249'], // 5 rose light centre
  ['#F1E6D6', '#D2C9BB', '#B5ACA0'], // 6 cream paper
  ['#5F8C30', '#4B6E26', '#39531D'], // 7 olive
  ['#3E6B25', '#2E4F1B', '#1E3512'], // 8 dark green
  ['#8FBF4A', '#78A03E', '#628233'], // 9 bright green
];

/**
 * Parse a '#rrggbb' string into [r, g, b] (0-255 each).
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function parseHex(hex) {
  if (!HEX6_RE.test(hex)) {
    throw new Error(`invalid hex colour: ${JSON.stringify(hex)}`);
  }
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Format [r, g, b] (0-255 each) as an uppercase '#RRGGBB' string.
 * @param {[number, number, number]} rgb
 * @returns {HexColor}
 */
function formatHex(rgb) {
  return (
    '#' +
    rgb
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0').toUpperCase())
      .join('')
  );
}

/**
 * Per-channel multiply a base colour to derive a deep/mid/light shading
 * triple: [hex, hex*0.78, hex*0.56].
 * @param {HexColor} hex
 * @returns {[HexColor, HexColor, HexColor]}
 */
function triple(hex) {
  const [r, g, b] = parseHex(hex);
  return [
    formatHex([r, g, b]),
    formatHex([r * 0.78, g * 0.78, b * 0.78]),
    formatHex([r * 0.56, g * 0.56, b * 0.56]),
  ];
}

/**
 * @type {Mode[]}
 */
const MODES = [
  {
    id: 'rose',
    name: 'Rose',
    bouquet: {
      petals: ['#C41E5A', '#FB6F92', '#FFB3C6'],
      centres: ['#7A1338', '#9C455B', '#9E6F7B'],
      ribbon: '#C41E5A',
    },
    ui: {
      ground: '#FBF1F3',
      surface: '#F6E4E8',
      ink: '#3A1320',
      muted: '#6E4450',
      accent: '#C41E5A',
      onAccent: '#FFFFFF',
      focus: '#C41E5A',
      border: '#E4CBD1',
    },
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    bouquet: {
      petals: ['#E0A000', '#F5C518', '#FFD84D'],
      centres: ['#5A3A12', '#5A3A12', '#5A3A12'],
      ribbon: '#6B3F12',
    },
    ui: {
      ground: '#FFF8E1',
      surface: '#FBEFC6',
      ink: '#2E2106',
      muted: '#5C4A16',
      accent: '#8A5A00',
      onAccent: '#FFFFFF',
      focus: '#8A5A00',
      border: '#E9D9A0',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    bouquet: {
      petals: ['#6B4AA8', '#8E6CC4', '#C9B6EC'],
      centres: ['#3B2760', '#3B2760', '#3B2760'],
      ribbon: '#F1E6D6',
    },
    ui: {
      ground: '#F5F1FB',
      surface: '#E9E0F5',
      ink: '#241A36',
      muted: '#4F3D6E',
      accent: '#6B4AA8',
      onAccent: '#FFFFFF',
      focus: '#6B4AA8',
      border: '#D8CBEC',
    },
  },
  {
    id: 'marigold',
    name: 'Marigold',
    bouquet: {
      petals: ['#D9531A', '#F28C28', '#FFB347'],
      centres: ['#7A300A', '#7A300A', '#7A300A'],
      ribbon: '#C41E5A',
    },
    ui: {
      ground: '#FFF3E6',
      surface: '#FBE2C8',
      ink: '#33190A',
      muted: '#6B3616',
      accent: '#C4530F',
      onAccent: '#FFFFFF',
      focus: '#C4530F',
      border: '#EFCFA9',
    },
  },
  {
    id: 'hydrangea',
    name: 'Hydrangea',
    bouquet: {
      petals: ['#2F5FA8', '#5B8DD9', '#A9C6F0'],
      centres: ['#1E3A6B', '#1E3A6B', '#1E3A6B'],
      ribbon: '#F1E6D6',
    },
    ui: {
      ground: '#F0F5FC',
      surface: '#DDE9F8',
      ink: '#14233D',
      muted: '#3C5478',
      accent: '#2F5FA8',
      onAccent: '#FFFFFF',
      focus: '#2F5FA8',
      border: '#C4D6ED',
    },
  },
];

/** @type {string} */
const DEFAULT_MODE = 'rose';

/** @type {string[]} */
const MODE_IDS = MODES.map((m) => m.id);

/**
 * Look up a mode by id, falling back to the default ('rose') mode when the
 * id is unknown.
 * @param {string} id
 * @returns {Mode}
 */
function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES.find((m) => m.id === DEFAULT_MODE);
}

/**
 * Build the 11-slot renderer material palette for a mode.
 * Slots: 0 deep petal, 1 deep centre, 2 mid petal, 3 mid centre,
 * 4 light petal, 5 light centre, 6 paper, 7 olive, 8 dark green,
 * 9 bright green, 10 ribbon.
 * @param {Mode|string} modeOrId
 * @returns {Array<[HexColor, HexColor, HexColor]>}
 */
function paletteFor(modeOrId) {
  const mode = typeof modeOrId === 'string' ? getMode(modeOrId) : modeOrId;

  if (mode.id === 'rose') {
    // Exact parity with the reference loader: slots 0-9 verbatim, slot 10
    // is a copy of slot 0.
    return [...REFERENCE_PALETTE.map((t) => t.slice()), REFERENCE_PALETTE[0].slice()];
  }

  const { petals, centres, ribbon } = mode.bouquet;
  return [
    triple(petals[0]), // 0 deep petal
    triple(centres[0]), // 1 deep centre
    triple(petals[1]), // 2 mid petal
    triple(centres[1]), // 3 mid centre
    triple(petals[2]), // 4 light petal
    triple(centres[2]), // 5 light centre
    REFERENCE_PALETTE[6].slice(), // 6 paper
    REFERENCE_PALETTE[7].slice(), // 7 olive
    REFERENCE_PALETTE[8].slice(), // 8 dark green
    REFERENCE_PALETTE[9].slice(), // 9 bright green
    triple(ribbon), // 10 ribbon
  ];
}

export { MODES, DEFAULT_MODE, MODE_IDS, getMode, triple, paletteFor, REFERENCE_PALETTE };
