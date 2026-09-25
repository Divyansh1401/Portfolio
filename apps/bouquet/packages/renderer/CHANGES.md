# CHANGES — intentional divergences from the reference

Wave 1 (`core.js` / `painter-canvas.js` / `compat.js`) copies
`reference/bouquet-loader.ref.js` byte-for-behaviour: parity is proven by
`test/parity.test.mjs` and it must stay green forever. Everything below is
wave-2 (task W2a) product API added **on top of** that parity-proven core —
none of it exists in the reference loader, none of it is exercised by
`compat.mount()`, and none of it changes a single byte of the parity op
stream. Each entry says what was added/changed and why.

## 1. `model.relayout({cssW, cssH, dpr})` — new, fixes a real bug

The reference's `resize()`/wave-1's `compat.resize()` call `layout()` again,
which re-runs `fitCanvas()` but only calls `buildFlight()` **once**, at the
model's first layout (see CONTRACT.md §1.3 — "flight is built once"). Every
later `layout()` call (i.e. every resize) reuses the FR0/FA0/FW entry
geometry computed for the ORIGINAL viewport, even though `fitCanvas()` just
recomputed `ENTRY_R`/`ENTRY_V` (and hence what "off-screen" means) for the
NEW one. Resizing mid-flight — e.g. rotating a phone, or the viewport router
handing off between `index.html` and `mobile.html` mid-loader — leaves cubes
entering from a radius sized for the old canvas, so a chunk of them are
already inside the new, usually smaller, canvas the moment `p` moves off 0.
Measured locally: laying out at 1440x900@2 then calling `layout()` again at
390x844@1.5 and reading `frame().onscreen` at `p=0` gives dozens of onscreen
cubes (66 at the fly-in start pose `p=0, yaw=-540`; 980 for the reverse
390x844@1.5 -> 1440x900@2 resize) instead of the 0 a model freshly laid out
at the new size shows (`test/api.test.mjs` asserts exactly 0 after
`relayout()`, in both directions).

`relayout()` is a new entry point that does what `layout()` does PLUS an
unconditional `buildFlight()`, so entry geometry always matches the viewport
currently in effect. It is intentionally **not** wired into
`compat.resize()` — `compat.resize()` still calls `model.layout()` exactly as
before (checked by `test/api.test.mjs`'s
`"compat.js resize() still calls model.layout(), not relayout()"` case), so
`test/parity.test.mjs`'s resize sequence is byte-identical to the reference.
`relayout()` is for a caller (the driver) that wants the fixed behaviour and
is not bound by parity.

## 2. `model.setDpr(dpr)` — new

Thin convenience over `relayout()`: re-lays out at the last known
`cssW`/`cssH` with a new device-pixel-ratio, capped at 2 (same cap
`fitCanvas()` already applies via `Math.min(vp.dpr || 1, 2)`). Requires a
prior `layout()`/`relayout()` call, same as `fit()` and `tune()` already do
for their own state.

## 3. `model.landed()` — new

`true` once `p >= 1 && q <= 0`: the flight-in has fully completed and any
dispersal has fully retracted. Exposed because the driver needs this exact
predicate for its own state machine rather than re-deriving it from
`state()`'s raw `p`/`q`.

## 4. `src/errors.js` + `painter-canvas.js`'s `assertPaintable(canvas, ctx)` — new

`RendererUnavailableError` (in the new `src/errors.js`) is thrown by the new
`assertPaintable(canvas, ctx)` guard when `ctx` is null/undefined, or when
the canvas has zero width or zero height. Callers (the driver) call it
BEFORE building or laying out a model against a given canvas, so a
not-yet-attached or zero-sized canvas fails fast with a typed error instead
of silently building a model no `paint()` call can ever use.

`painter-canvas.js` keeps **zero imports** (CONTRACT.md §2, enforced by
`scripts/lint-no-dom.mjs` / `test/no-dom.test.mjs`): the
`RendererUnavailableError` class is *defined* in `painter-canvas.js` next to
the guard that throws it, and `src/errors.js` simply re-exports it
(`export { RendererUnavailableError } from './painter-canvas.js'`). There is
therefore exactly one class identity — `instanceof RendererUnavailableError`
holds whether a caller imports the class from `errors.js` or from
`painter-canvas.js`. Neither file touches a DOM global; `core.js` and
`compat.js` are untouched. (An earlier draft imported the class from
`errors.js` into `painter-canvas.js`, which broke the no-imports lint; the
Gate-2 review inverted the direction.)

## 5. Dropped explainer surface (pre-existing wave-1 decision, documented here)

The reference loader's `mount()` also backs `bouquet.html`'s scroll-scrubbed
"beats" explainer via a set of tuning hooks (`cells sets show tint alpha
drawLimit sortInFlight params path order rank legacy project basis`, per
`.claude/BOUQUET-EXPLAINER-PLAN.md` / the portfolio's `bouquet-loader.js`
API block). Wave 1 ships only the subset the product driver actually needs
— `params`, `project` and `basis` are real; `compat.state()` hardcodes
`show: 'auto', limit: null, sortInFlight: false` as inert stubs rather than
wiring up `cells`, `sets`-driven visibility toggles, `tint`/`alpha`
overrides, `drawLimit`, `sortInFlight`, `path`, `order`/`rank` or `legacy`
mode. None of those are used by `compat.mount()`'s own draw loop, so
dropping them does not affect op-stream/pixel/API parity — but any consumer
that expected the reference's full explainer API from this package (there is
none inside `apps/bouquet`; the portfolio's own `bouquet-explainer.js` reads
`assets/js/bouquet-loader.js` directly, not this package) will not find it
here.

## 6. 11th material slot (ribbon), `model.setPalette()`, `palette.js`, `shapes.js` (task L1b)

New product surface for `mode` colour presets and `shape` variants (the
"create" app's colour picker / bouquet-shape picker). None of this exists in
the reference loader; none of it changes a single byte of the parity op
stream when the palette is left at its default.

- **11th material slot.** `PALETTE`/`RAMP`/`COL` now always hold 11 entries
  internally: materials 0-9 are unchanged, and slot 10 is the ribbon
  band/bow/tails material (previously hardcoded to reuse slot 0, the crimson
  petal colour). `build()`'s ribbon-band and bow/tails cells now write
  palette index 10 (`10 | (PART.RIBBON<<4)`) instead of `0`. `createModel`'s
  `palette` option accepts either 10 triples (materials 0-9; slot 10 is set
  to an exact copy of slot 0, the same rule the reference always implicitly
  followed) or 11 (materials 0-9 plus an explicit ribbon colour) — a 10-triple
  palette therefore paints byte-identically to before this change, which is
  what keeps `test/parity.test.mjs` green (the reference and the default
  `DEFAULT_PALETTE` never distinguished ribbon from petal colour). Every
  place that iterated `PALETTE.length`/`RAMP` (prewarm, `frame()`'s per-frame
  `COL` fill, `toneFor`) already scaled off the palette's own length, so no
  fixed "10" was hardcoded anywhere that needed changing beyond `build()`'s
  ribbon writes.
- **`model.setPalette(triples)`** (10 or 11 triples, same validation/padding
  as construction) swaps colour only: it never touches `SRC`/`VOL`/`SURFACE`
  or the `AX/AY/AZ/APAL/APART/ACULL` geometry, so a caller can recolour a
  landed (or mid-flight) bouquet without rebuilding it. It mutates
  `PALETTE`/`RAMP`/`COL` **in place** (`.length = 0` then re-push) rather
  than reassigning those `const` bindings, specifically so the `toneFor`
  closure created once in `makeToneFor(RAMP, TONE_CACHE)` keeps seeing the
  new values with no re-wiring; it clears `TONE_CACHE` (stale shade-quantised
  entries from the old palette) and re-prewarms every `(material, shade)`
  pair, same as construction. Callers must not call it mid-paint (mid a
  `frame()`/`paint()` pair) — it is meant to be called between frames, e.g.
  once per rAF tick with `mixPalettes(from, to, easedT)` while animating a
  mode change.
- **`src/palette.js`** (new file, zero imports): `mixPalettes(a, b, t)`
  per-channel RGB-lerps two same-shaped palettes (10 or 11 triples each);
  `mixHex(a, b, t)` is the single-colour primitive it's built from. Output is
  uppercase `#RRGGBB` (matching `packages/modes/modes.js`'s `triple()`
  convention) so `mixPalettes(a, b, 0)`/`mixPalettes(a, b, 1)` round-trip to
  the exact input strings, not merely the same colour.
- **`src/shapes.js`** (new file, zero imports): `SHAPES = {full, posy, stem}`,
  `SHAPE_IDS = ['full', 'posy', 'stem']`, `DEFAULT_SHAPE = 'full'`. Each value
  is a partial `params()` override in the same shape `createModel({params})`
  already accepts (CONTRACT.md §1.2) — `full` is `{}` (today's default
  geometry, byte-identical). `posy` scales the bloom count and every
  canopy/collar/handle radius down together (~60% of `full`'s surface cube
  count) for a smaller, rounder hand-tied bunch. `stem` drops to 3 blooms on
  a tall dome (`domeCY` raised well above the default) with a tiny paper
  collar and **`underfill: false`**: the reference generator's underfill
  pass fills every gridpoint between the collar top and the canopy underside
  with greenery for ANY gap, and on a stem this tall that pass draws a solid
  green pillar instead of a visible stem, so it has to be turned off rather
  than merely shrunk. All three were checked visually (not just
  geometrically): `test/out/render-shapes.mjs` (gitignored, run manually)
  bundles `src/index.js`, renders each shape landed at 390×844@1.5 in
  headless Chromium, and screenshots the canvas — `posy` reads as a smaller
  round bunch and `stem` reads as one-to-three blooms on a tall stem with a
  small wrap and bow.
- `src/index.js` does NOT re-export `palette.js` / `shapes.js`: doing so
  pushed the bundle to 8072 B gzip, past `scripts/size.mjs`'s 8000 B budget
  (Gate L1 fix). Import them directly from `src/palette.js` and
  `src/shapes.js` (the server already does). With the ribbon slot and
  `setPalette`, `src/index.js` measures 7533 B gzip.
