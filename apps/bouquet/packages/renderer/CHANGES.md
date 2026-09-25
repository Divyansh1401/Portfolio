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
