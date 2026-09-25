# Renderer contract: wave 1 (core / painter / compat)

Status: binding for wave 1. Written 2026-09-25 against
`reference/bouquet-loader.ref.js` (sha256 `dd391b5e…6bae01`). Line numbers
below refer to that file. When this document and the reference disagree about
*behaviour*, the reference wins. When they disagree about *interface*, this
document wins.

Wave 1 splits `mount()` (ref lines 103–1140) into three modules and deletes
everything the product does not ship. **Every pixel stays the same.** Wave 1
fixes no bugs. It copies code; it does not improve it. Anything that looks
wrong in the reference (resize not rebuilding the flight, `toneFor`'s
in-loop `s > cps[0][0]` check, `buildTones()` being a no-op, and so on) is
copied as it is. Fixes come in wave 2, and each needs its own parity waiver.

```
packages/renderer/src/
  core.js            createModel(opts)  -> Model       pure math, no DOM, no imports
  painter-canvas.js  paint(ctx, frame)                  Canvas2D ops only, no imports
  compat.js          mount(canvas, win?) -> loader API  the ONLY file that touches the DOM
  index.js           export { createModel } from './core.js';
                     export { paint } from './painter-canvas.js';
                     export { mount } from './compat.js';
```

Plain ESM (`apps/bouquet/package.json` has `"type":"module"`), JSDoc types,
named exports only, no default exports. Do not add a `package.json` under
`packages/renderer` in wave 1.

---

## 0. Parity: the definition of done

A wave-1 build is correct when **all** of these hold:

1. **Op-stream parity (Node).** For every viewport `V` in
   `test/oracle/matrix.mjs` `VIEWPORTS` and every state `s` in `STATES`,
   mount the reference (`loadReference(V)`) and `compat.mount` on an
   identical fake canvas with its own recorder (`test/oracle/recorder.mjs`).
   Then run `applyState(api, s)` followed by `api.draw()`. The **full**
   recorded op stream, from the mount's own draw to the last draw,
   `assert.deepStrictEqual`s the reference's. Strict equality uses
   `Object.is`, so `-0` versus `0` and every float bit count.
2. **Pixel parity (Chromium).** Bundle `src/index.js` to one ESM file and
   diff it against the reference with `test/browser/pixel-harness.mjs`. The
   diff is `diffPixels === 0` for every case in the harness's own `MATRIX`
   and for every oracle `VIEWPORTS × STATES` case.
3. **API parity.** After each case in (1), `compat.state()`, `sets()`,
   `basis()`, `canvas.width/height`, `canvas.style.width/height` and
   `project(x,y,z)` for a few lattice points all deep-equal the reference.
   The reference's returned objects come from the vm realm, so spread them
   (`{...o}`) before `deepStrictEqual`.
4. **Core-level parity.** Use the fresh-state sequence
   `createModel()` → `layout(V)` → `set(s)` → `paint(rec.ctx, frame())`.
   Its ops `deepStrictEqual` the reference's ops for one `api.draw()` after
   `applyState(api, s); rec.reset()`.
5. **Known facts.** At 1440×900@2, `sets()` is `{all:3259, surface:1289,
   visible:602}` and the landed frame (`p=1, q=0, yaw=0`) has `n === 602`.

The following differences are allowed and never tested:
- Behaviour of the dropped API surface (§4).
- `setP(undefined)` and similar non-numeric garbage. The reference stores
  `undefined`, while core treats `undefined` as "key absent".

---

## 1. `src/core.js`: `createModel(opts)`

Pure and deterministic. **Zero imports.** No DOM, no timers, no
`Math.random`, no `Date`, no module-level mutable state. Every closure
variable in `mount()` becomes per-model state, including `TONE_CACHE`, which
becomes per-model because the palette is per-model. Module-level `const`
tables (`BLOOM`, `PETAL`, `CSEQ`, `PART`, `COS30`, `AMB/LX/LY/LZ`,
`S_TOP/S_PX/S_PZ`, the default `PALETTE` and `P`) are fine as long as they
are never mutated. Copy them before use when a model needs a mutable copy,
as `P` does.

### 1.1 Types

```js
/** @typedef {{cssW:number, cssH:number, dpr:number}} Viewport  // dpr is RAW (uncapped) */
/** @typedef {[string,string,string]} Tone        // [top, +x side, +z side], '#rrggbb' */
/**
 * @typedef {Object} FrameBasis   // per-frame constants of draw(), ref 964–979
 * @property {number} ExX @property {number} ExY
 * @property {number} EzX @property {number} EzY
 * @property {number} EyY
 * @property {boolean} vxp @property {boolean} vzp
 * @property {boolean} drawXFace @property {boolean} drawZFace
 */
/**
 * @typedef {Object} Frame
 * @property {number} n              cubes to paint, in paint order (far first)
 * @property {Float64Array} X        length >= n; X[k] = cube k's anchor X, backing px
 * @property {Float64Array} Y        length >= n
 * @property {Uint8Array} pal        length >= n; palette index of cube k
 * @property {Tone[]} tone           one Tone per palette entry, for THIS frame's yaw
 * @property {FrameBasis} basis
 * @property {number} onscreen       ref 1019+1027 count, over all n cubes
 * @property {number} width          backing-store px (== layout().width)
 * @property {number} height
 */
```

`X`, `Y`, `pal` and `tone` **may be reused** between `frame()` calls, the way
`COL` is. A consumer reads only indices `[0, n)` and must not keep them past
the next `frame()`. `basis` is a fresh object each frame.

### 1.2 `createModel(opts = {})`

| opt | default | meaning |
|---|---|---|
| `params` | `{}` | merged over the default `P` (ref 186–213) with **exactly** `setParams`' validation (ref 1059–1065): unknown keys ignored, booleans `!!v`, non-finite numbers dropped, `domeR`/`wrapStep` clamped `>= 1`. `P_ORIG` stays the **built-in** defaults, so `params(null)` restores the built-ins, not `opts.params`. |
| `palette` | ref `PALETTE` (111–122) | exactly 10 entries, each 3 strings matching `/^#[0-9a-fA-F]{6}$/`, otherwise throw `TypeError`. Deep-copied. `RAMP` is derived from it with ref 148–154. |
| `turns` | `1` | initial `TURNS` |
| `ms` | `4200` | initial `T_TOTAL` |
| `fill` | `0.69` | initial `FILL` |

Construction runs the reference's order without the layout-dependent part:
`prewarmTones()` → `SRC = build()` → `setFill(true)` (so `VOL` and `SURFACE`
are set) → `computePivot(SURFACE)` → `pack(SURFACE)`. Flight and dispersal
**are not built yet**, because they need a layout (§1.4).

Model state initial values: `PROG = 1`, `Q = 0`, `YAW = 0`, `DPR = 1`,
`HOLLOW_FILLED = true`, `PART_ORDER = [4,3,2,1,0]`, `F` and `D` as in ref
659 and 824.

### 1.3 Methods

| method | reference equivalent | returns |
|---|---|---|
| `layout(vp)` | `resize()` minus DOM and draw: fitCanvas math, then `buildDisperse()`. On the **first** call only, it also runs `buildFlight()` before `buildDisperse()` (the tail of `rebuild()`). | `{width, height, dpr}` (`dpr` = the capped DPR) |
| `set({p,q,yaw})` | state only. A key that is absent or `undefined` is left unchanged. `p` → `clamp01(p)`; `q` → `Math.max(0, q)`; `yaw` → the `while(d>180)d-=360; while(d<-180)d+=360` loop from ref 1096. No build, no frame. | `undefined` |
| `frame()` | ref 937–1036 minus every `ctx.*` call (§1.5) | `Frame` |
| `state()` | superset of the loader's `state()` | `{N, surface, voxels, drawn, onscreen, S, DPR, p, q, yaw, fill, fillHollow, width, height}`. `drawn`/`onscreen` come from the last `frame()` (0 before any). `width`/`height` are 0 before layout. |
| `sets()` | ref 1107 | `{all: VOL.size, surface: N, visible: NVIS}` |
| `project(x,y,z)` | ref 1131–1135 verbatim | `{X, Y}` backing px |
| `basis()` | ref 1136 verbatim. **Not** `Frame.basis`. | `{S, OX, OY, yaw, pivX, pivZ, cos30}` |
| `params(o, vp?)` | `setParams` (ref 1057–1068): validate/assign (or restore on `null`/`undefined`), `SRC=build()`, `setFill(HOLLOW_FILLED)`, then `rebuild()` minus draw: `computePivot`, `pack`, fitCanvas math with `vp ?? lastVp`, `buildFlight`, `buildDisperse` | `{...P}` |
| `tune(o)` | ref 1100 minus draw: `turns`→`TURNS`, `ms`→`T_TOTAL` (when `!== undefined`), `buildFlight()` | `{TURNS, T_TOTAL}` |
| `fit(f, vp?)` | ref 1097 minus DOM/draw: `if(f!==undefined) FILL=f`, fitCanvas math with `vp ?? lastVp`, `buildFlight`, `buildDisperse` | `FILL` |
| `dtune(o)` | ref 1098 minus draw: `Object.assign(D, o\|\|{})`, `buildDisperse` | `{...D}` |
| `ftune(o, vp?)` | ref 1099 minus draw: `Object.assign(F, o)`; `o.order` → `setOrder`. **`o.ease` is ignored**, and easing is always smoothstep. If `o.fillHollow !== undefined && !!o.fillHollow !== HOLLOW_FILLED`, then `setFill(o.fillHollow)` + full rebuild (as `params`, using `vp ?? lastVp`); otherwise `buildFlight()` | `{...F, order: PART_ORDER.slice(), fillHollow: HOLLOW_FILLED}` |

**Before the first `layout()`:** `frame()`, `project()` and `fit()` throw
`Error('bouquet: layout() must be called first')`. `params`, `tune`,
`ftune` and `dtune` apply their config and model rebuild (build/setFill/
pivot/pack) immediately. They skip the layout, flight and dispersal steps,
which the first `layout()` then runs in full (fitCanvas, `buildFlight`,
`buildDisperse`). `lastVp` is the viewport of the most recent
`layout()`/`fit()`/`params()`/`ftune()` call that received or used one.

### 1.4 fitCanvas math (ref 596–632) inside `layout`/`fit`/`params`/`ftune`

```js
DPR = Math.min(vp.dpr || 1, 2);
width  = Math.round(vp.cssW * DPR);     // replaces cv.width  everywhere
height = Math.round(vp.cssH * DPR);     // replaces cv.height everywhere
// then ref 610–632 verbatim with cv.width/cv.height -> width/height:
// RCYL, rAt, YMINs/YMAXs, sxHalf, hw/hh, wU/hU, S, OX, OY, ENTRY_R, ENTRY_V
```

`disperseRange` (ref 841–842) likewise reads `width`/`height` in place of
`cv.width`/`cv.height`.

### 1.5 Moved verbatim (the same expressions, the same evaluation order, the same types)

The rule for this section is that no expression may be reordered,
re-associated, hoisted differently or "simplified", because floating-point
addition is not associative.

- **Tones**: `hex2rgb`, `rgb2hex`, `RAMP`, `toneFor` (with its quirk),
  `prewarmTones`. These run over the model's palette.
- **Generator**: `key`, `domeY`, `greenAt`, `BLOOM`, `addBloom`, `build`,
  `filledVolume`, `srcAt`, `surfaceOf`, `setFill`. That includes the
  `'x,y,z'` string keys and **Map insertion order**, which fixes `SURFACE`
  order and therefore the frozen draw order.
- **pack** (ref 549–573), **surface part only**: the
  `list.slice().sort((a,b)=>(a0+a1+a2)-(b0+b1+b2))` stable sort, then
  `AX, AY, AZ` as **Float32Array**, `APAL, APART, ACULL` as **Uint8Array**,
  `ACULL[i] = srcAt(x+1,y+1,z+1)` (tested against the whole `VOL`), and
  `NVIS`. Set `NT = N`. The interior (`inner`), `ORDER`, `CELL`/`CELLS` and
  `ensureCells` are **dropped**. The reference schedules the interior over
  its own index range (`flightRange(N,NT)`, `disperseRange(N,NT)`), so the
  first `N` entries do not depend on it.
- **computePivot**, **h32**, **rnd**, **setOrder**, `STAGGER`.
- **buildFlight/flightRange** for the range `(0, N)` only, **non-legacy
  branches only**: `FW = (TURNS + (rnd(i,9)-0.5)*F.angJit)*2π`, plus the
  `rH/rV` clearance. `FR0, FA0, FW, FR, FA, FY0, FDLY` are **Float32Array**.
  `side` is an Int8Array with the Fisher–Yates shuffle, and `keyOf`/`idx.sort`
  stay exactly as they are.
- **flightAt** with `EASE_FN = smooth` (`x*x*(3-2*x)`). The scratch
  `_uv` is a plain `[0,0,0]` (or Float64Array). It is **never** a
  Float32Array.
- **buildDisperse/disperseRange** for `(0, N)`, and **disperseAt**.
  `DU, DV, DUP, DDLY` are **Float32Array**.
- **frame()** = ref 938–1036 with these exact edits:
  - The first `const` is `const th = YAW*Math.PI/180, ct = Math.cos(th), st = Math.sin(th);`.
  - `flying = PROG < 1; doSort = !flying || YAW !== 0;` (with `SORT_FLY`
    gone).
  - `useCull = PROG >= 1 && Q <= 0 && YAW === 0;` (the `'auto'` branch
    only).
  - The basis, `drawXFace/drawZFace`, `sgnX/sgnZ` and `shTop/shX/shZ`
    expressions stay verbatim. `tone[i] = [toneFor(i,shTop), toneFor(i,shX), toneFor(i,shZ)]`
    for `i` in `0..9`.
  - The gather loop is `for(let k=0;k<N;k++){ const i=k; if(useCull && ACULL[i]) continue; …list.push({i, u:xr-zr, v:xr+zr, y:_uv[2], pal:APAL[i], d:xr + _uv[2] + zr}); }`
    verbatim (with `if(q > 0) disperseAt(...)`), then
    `if(doSort) list.sort(function(a,b){ return a.d-b.d; });`. Wave 1 keeps
    the per-frame object list. Removing that allocation is wave 2 work.
  - For each `k < list.length`, in list order:
    `X[k] = OX + c.u*COS30*S;` and `Y[k] = OY + (c.v*0.5 - c.y)*S;`
    (ref 1025–1026 with the `+ pinDX` term removed; that term is `+0`, and
    `OX > 0` means no `-0` can arise). `pal[k] = c.pal`. Then
    `onscreen` uses `M = 2.2*S` and the ref 1027 test, with `width/height` in
    place of `cv.width/cv.height`.
  - Record `drawn = n = list.length` and `onscreen` for `state()`.
  - There is **no** `ctx` anywhere in this function, and no tint, alpha,
    limit, `LAST_LIST` or `FRAME_NO`.
- The `X`/`Y`/`pal` buffers are (re)allocated in `pack()` with capacity `N`.

---

## 2. `src/painter-canvas.js`: `paint(ctx, frame)`

**Zero imports.** It touches nothing but `ctx` and `frame`. It returns
`undefined`. It reproduces ref 1018–1048 **op for op**:

```js
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
// q4 = ref 1041–1048: beginPath; moveTo; lineTo; lineTo; lineTo; closePath;
//      fillStyle=fill; fill(); strokeStyle=fill; stroke();
```

The argument expressions are copied character for character, because
`bxY+EyY+EzY` means `(bxY+EyY)+EzY`. The painter never writes
`globalAlpha`, never calls `save/restore/setTransform`, and does not count
`onscreen`.

---

## 3. `src/compat.js`: `mount(canvas, win = globalThis.window)`

This is the only DOM-aware file. It imports only `./core.js` and
`./painter-canvas.js`. The optional `win` exists for Node tests: it is any
object with `devicePixelRatio`, `innerWidth` and `innerHeight`. It is
captured once at mount.

```js
const ctx = canvas.getContext('2d', {alpha:true});   // exactly once, these options
const model = createModel();                        // defaults
function measure(){                                 // ref 597–603, DOM half
  const dpr  = win.devicePixelRatio;                 // raw; core caps with (|| 1) and min 2
  const cssW = canvas.parentNode.clientWidth  || win.innerWidth;
  const cssH = canvas.parentNode.clientHeight || win.innerHeight;
  return {cssW, cssH, dpr};
}
function applySize(vp, width, height){             // after the core call, from core's numbers
  canvas.style.width = vp.cssW + 'px'; canvas.style.height = vp.cssH + 'px';
  canvas.width = width; canvas.height = height;
}
function draw(){ paint(ctx, model.frame()); }
// at mount: vp = measure(); applySize(vp, ...model.layout(vp) dims); draw();
```

The canvas's backing dimensions come from core (`layout()`'s return value,
or `model.state().width/height` after `fit`/`params`/`ftune`). Compat never
recomputes them. The rule is that **every reference path that calls
`fitCanvas()` re-measures the DOM**. Compat does `measure()`, passes that
`vp` to core, and then calls `applySize`.

Returned object (exactly these keys):

| key | behaviour |
|---|---|
| `setP(v)` | `model.set({p:v}); draw();` |
| `setQ(v)` | `model.set({q:v}); draw();` |
| `setYaw(d)` | `model.set({yaw:d}); draw();` |
| `fit(f)` | `vp=measure(); r=model.fit(f, vp); applySize(...); draw(); return r;` |
| `resize()` | `vp=measure(); applySize(vp, model.layout(vp)…); draw();`. This rebuilds the dispersal and **not** the flight, which is the loader's current behaviour and is kept for parity. |
| `tune(o)` | `r=model.tune(o); draw(); return r;` |
| `dtune(o)` | `r=model.dtune(o); draw(); return r;` |
| `ftune(o)` | If `o` will trigger a rebuild (`o && o.fillHollow !== undefined && !!o.fillHollow !== model.state().fillHollow`), measure first and pass `vp`, then `applySize`. `draw()`; return core's value. |
| `params(o)` | `vp=measure(); r=model.params(o, vp); applySize(...); draw(); return r;` |
| `state()` | the loader's shape and key order: `{N, surface, voxels, drawn, onscreen, S, DPR, p, q, yaw, show:'auto', limit:null, sortInFlight:false}` |
| `sets()`, `project(x,y,z)`, `basis()` | pass-through to the model |
| `draw()` | as above, returns `undefined` |
| `canvas()` | returns `canvas` |

---

## 4. Dropped from the product (do not port)

`tint`, `alpha`, `drawLimit`, `sortInFlight`, `show` (the behaviour is
always `'auto'`), `cells`, `order`, `rank`, `path`, `legacy` and the
`LEGACY` branches, `snapshot`, `bench`, `EASES` (smoothstep only; `ftune`
ignores `ease`), `BEATS_F`, `FLIGHT()`, `parseColour`, `tintTones`,
`TINT_CACHE`, `ensureCells`, the interior cells (`N..NT-1`), `ORDER`,
`buildTones` (it is a no-op), and the whole driver: `run()`, `shouldRun()`,
`window.BouquetLoader`. On the compat object, the dropped names are simply
absent. They are not stubbed.

---

## 5. Tooling contracts (for W1c, and so W1a knows the rules)

**`scripts/lint-no-dom.mjs`** exports `FORBIDDEN` (the list below),
`lintSource(source, file?) -> Array<{name, line, file}>` and
`lintFiles(paths) -> same`. Its CLI default targets are `src/core.js` and
`src/painter-canvas.js`. It prints the violations and exits 1 when there are
any, 0 when there are none, and 2 when a target is missing.

The check strips `//` and `/* */` comments plus `'…'`, `"…"` and
`` `…` `` literals first, so comments may mention `window`. It then matches:
- the identifiers `\bNAME\b` for: `window document globalThis self
  navigator devicePixelRatio innerWidth innerHeight clientWidth
  clientHeight parentNode getContext requestAnimationFrame
  cancelAnimationFrame performance setTimeout setInterval localStorage
  sessionStorage matchMedia addEventListener HTMLCanvasElement
  OffscreenCanvas Image fetch Date`;
- the member patterns `\.style\b` and `Math\.random\b`;
- any `import` statement or `import(` call, because both files have zero
  imports.

W1a therefore must not use any of these as local names in core or the
painter (for example, no variable called `self`).

**`scripts/size.mjs`** exports `BUDGET_GZIP = 8000` and
`measure(entry = src/index.js) -> Promise<{entry, minBytes, gzipBytes,
brotliBytes, budget, ok}>`. It uses esbuild `build({entryPoints:[entry],
bundle:true, format:'esm', minify:true, platform:'neutral',
target:'es2020', write:false})`, `zlib.gzipSync(level 9)` and
`zlib.brotliCompressSync` at the default quality. The CLI (`npm run size`)
prints one JSON line and exits 1 when over budget or 2 when the entry is
missing.

The budget is based on a measurement. The reference `mount()` with its
explainer hooks (ref 103–1140, esbuild-minified) is 18,861 B raw, 8,177 B
gzip and 7,379 B brotli. The product ships less than that, so it must weigh
less.

The tests do not skip when `src/` files are missing. A missing target is a
failure.

---

## 6. File ownership for wave 1

| builder | owns (create/edit only these) | must not touch |
|---|---|---|
| **W1a** | `src/core.js`, `src/painter-canvas.js`, `src/compat.js`, `src/index.js` | everything else |
| **W1b** | `test/parity.test.mjs` (§0 items 1, 3, 4 and 5, plus the sequence test below), `test/pixel-candidate.test.mjs` | `src/**`, `test/oracle/**`, `test/browser/**`, `test/pixel.test.mjs` |
| **W1c** | `scripts/lint-no-dom.mjs`, `scripts/size.mjs`, `test/no-dom.test.mjs`, `test/size.test.mjs` | `src/**`, other tests |

All paths are relative to `apps/bouquet/packages/renderer/`. Nobody edits
`reference/**`, the oracle, the goldens, the harness,
`apps/bouquet/package.json` or anything outside `apps/bouquet`.

**W1b details.**
- The fake canvas is built inline exactly as `load-reference.mjs` builds its
  own: `getContext()` returns `rec.ctx`, `style` is `{}`, `width` and
  `height` are 0, and `parentNode` is `{clientWidth, clientHeight}`. The
  window is `{devicePixelRatio, innerWidth, innerHeight}` and is passed as
  `mount(canvas, win)`.
- **Sequence test** (desktop and phone): one reference mount and one compat
  mount step through all `STATES` in order, then `tune({turns:2})`,
  `fit(0.5)`, and `resize()` after changing both `parentNode` sizes and
  `win.innerWidth`/`innerHeight`. Then `setP(0.3)`, `dtune({outK:2.2})`,
  `ftune({within:'depth'})`, `ftune({fillHollow:false})`,
  `params({nBlooms:40})` and `params(null)`. After each call, the new ops and
  the return values (spread) deep-equal.
- **`pixel-candidate.test.mjs`**:
  - The candidate module is `process.env.BQ_CANDIDATE` when that is set. It
    must be a single self-contained ESM file exporting `mount`, because the
    harness serves one file at `/__candidate.mjs` and relative imports would
    404.
  - Otherwise the test esbuild-bundles `src/index.js`
    (`bundle:true, format:'esm', platform:'browser', minify:false`) into an
    `fs.mkdtemp(os.tmpdir())` file and uses that.
  - It runs `pixelDiff({candidate})` over the harness `MATRIX`. It then
    replaces the exported `MATRIX` array's contents **in place** with the
    oracle `VIEWPORTS × STATES` cases, as
    `{viewport:{name,cssW,cssH,dpr}, state}`, and runs `pixelDiff` again.
    Finally it restores `MATRIX`.
  - Every `diffPixels` must be 0. Set a generous timeout.
  - Do not edit the harness.

**Acceptance, per builder** (run from `apps/bouquet`):
`npm test` (the whole suite, including the reference and pixel suites), plus
`node packages/renderer/scripts/lint-no-dom.mjs` and `npm run size` for
W1a/W1c. Each builder reports the real output. A suite that depends on
another builder's unlanded file fails with "missing". Report that failure;
do not stub around it.
