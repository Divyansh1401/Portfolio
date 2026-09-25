// shapes.js — named `params()` overrides for the product's shape picker.
// Zero imports, no DOM. Each entry is a plain object of the SAME shape as
// `createModel({params})`'s `opts.params` (core.js's `DEFAULT_P`
// merge/validation, CONTRACT.md §1.2): unknown keys are ignored, so a shape
// only needs to list the params it actually changes from the built-in
// defaults. `createModel({params: SHAPES[id]})` must produce finite,
// non-empty geometry for every id here (packages/renderer/test/shapes.test.mjs).

/**
 * @typedef {Object} ShapeParams
 * A partial `DEFAULT_P` override — see `core.js`'s `applyParamsPatch`.
 */

/** Today's default look: no override at all. @type {ShapeParams} */
const full = {};

/**
 * A smaller, rounder hand-tied bunch: roughly half the blooms of `full` on a
 * visibly smaller dome, with every canopy/collar/handle radius scaled down
 * to match so nothing pokes out past the smaller dome's silhouette.
 *
 * The bow (`ribY`/`ribR`/`bow*`) is NOT scaled down by the same ~0.75 ratio
 * as the dome/collar: `bow`'s "loop" is a fixed-footprint voxel ring drawn
 * by core.js (`RING`, 4 wide × 4 tall, not itself parameterised by size) —
 * only its position (`bowSpread`, `bowOut`, `bowY`) is. Shrinking
 * `bowSpread` in step with the smaller dome pulls the two loops closer
 * together than that fixed ring width allows, and they fuse into one solid
 * blob with no visible knot/holes (tried during polish, see the render at
 * `packages/renderer/test/out/render-shapes.mjs`'s output). So `bowSpread`
 * and `bowOut` stay at `full`'s values — enough for the two loops to read
 * as separate — while `tailLen` (shorter tails) and `ribR` (a narrower band
 * matching the narrower `handleR`) scale down normally.
 * @type {ShapeParams}
 */
const posy = {
  nBlooms: 26,
  domeCY: 15,
  domeR: 7,
  foliageR: 6.6,
  foliageDrop: 1.3,
  underfillR: 6.4,
  wrapY0: 8, wrapY1: 13,
  wrapTop: 6.4, wrapBot: 2.7, wrapThick: 1.6,
  handleY0: 1, handleY1: 8,
  handleR: 2.2, handleThick: 0.9,
  ribY: 3, ribH: 2, ribR: 2.7,
  bowY: 5, bowOut: 3, bowSpread: 4, tailLen: 7,
  stemY0: -5, stemTop: 9, stemR: 1.3,
};

/**
 * A single bloom (occasionally read as three, per `nBlooms: 3`) held high on
 * a tall bare stem, with only a small paper wrap/handle at the base instead
 * of a full collar. `underfill` is off: the reference generator fills every
 * gridpoint between the collar top and the canopy underside with greenery,
 * which on a stem this tall would draw a solid green pillar instead of a
 * visible stem — see CHANGES.md.
 * @type {ShapeParams}
 */
const stem = {
  nBlooms: 3,
  domeCY: 33, domeR: 3.2,
  foliage: true, foliageR: 3.4, foliageBand: 1, foliageDrop: 1.2,
  underfill: false,
  wrapY0: 1, wrapY1: 4,
  wrapTop: 1.8, wrapBot: 1.1, wrapThick: 1.0, wrapStep: 2,
  handleY0: 1, handleY1: 4,
  handleR: 1.5, handleThick: 0.8,
  ribY: 2, ribH: 1, ribR: 1.9,
  bow: true, bowY: 3, bowOut: 1.6, bowSpread: 2, tailLen: 5,
  stemY0: -6, stemTop: 29, stemR: 1.1,
};

/** @type {{full: ShapeParams, posy: ShapeParams, stem: ShapeParams}} */
export const SHAPES = { full, posy, stem };

/** @type {string[]} */
export const SHAPE_IDS = ['full', 'posy', 'stem'];

/** @type {string} */
export const DEFAULT_SHAPE = 'full';
