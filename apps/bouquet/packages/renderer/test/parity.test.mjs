// parity.test.mjs — op-stream / API / core-level parity between the
// vendored reference loader and this package's src/ wave-1 split, per
// CONTRACT.md §0 and §6 ("W1b details").
//
// Nothing here imports or reads anything outside apps/bouquet at runtime.
// `src/*` is a sibling task's output (W1a); if it has not landed yet these
// tests fail with a clear "missing" message rather than being stubbed out.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

import { VIEWPORTS, STATES, applyState } from './oracle/matrix.mjs';
import { makeRecorder } from './oracle/recorder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_PATH = path.join(__dirname, '..', 'reference', 'bouquet-loader.ref.js');
const REFERENCE_SOURCE = readFileSync(REFERENCE_PATH, 'utf8');

/**
 * Mounts the reference loader exactly as ./oracle/load-reference.mjs does,
 * but also returns the fake canvas (load-reference.mjs keeps it private),
 * since this suite needs canvas.width/height/style parity per
 * CONTRACT.md §0 item 3.
 * @param {{cssW:number, cssH:number, dpr:number}} viewport
 */
function loadReference({ cssW, cssH, dpr }) {
  const rec = makeRecorder();

  const canvas = {
    getContext() {
      return rec.ctx;
    },
    style: {},
    width: 0,
    height: 0,
    parentNode: {
      clientWidth: cssW,
      clientHeight: cssH,
    },
  };

  const window = {
    devicePixelRatio: dpr,
    innerWidth: cssW,
    innerHeight: cssH,
  };

  const sandbox = {
    window,
    Math,
    Map,
    Set,
    Float32Array,
    Float64Array,
    Int32Array,
    Uint8Array,
    Int8Array,
    Array,
    Object,
    String,
    Number,
    JSON,
    Promise,
    URLSearchParams,
    performance,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(REFERENCE_SOURCE, context, { filename: REFERENCE_PATH });

  const api = sandbox.window.BouquetLoader.mount(canvas);

  return { api, rec, canvas, window };
}
const COMPAT_PATH = path.join(__dirname, '..', 'src', 'compat.js');
const CORE_PATH = path.join(__dirname, '..', 'src', 'core.js');
const PAINTER_PATH = path.join(__dirname, '..', 'src', 'painter-canvas.js');

const SRC_PRESENT =
  existsSync(COMPAT_PATH) && existsSync(CORE_PATH) && existsSync(PAINTER_PATH);

// Import lazily / conditionally so a missing src/ produces one clear failure
// per test rather than a module-load crash for the whole file.
let mount, createModel, paint;
if (SRC_PRESENT) {
  ({ mount } = await import('../src/compat.js'));
  ({ createModel } = await import('../src/core.js'));
  ({ paint } = await import('../src/painter-canvas.js'));
}

/**
 * Builds a fake canvas exactly as load-reference.mjs builds its own (see
 * CONTRACT.md §6, "W1b details").
 * @param {{ctx: object}} rec
 * @param {{cssW: number, cssH: number}} viewport
 */
function makeFakeCanvas(rec, viewport) {
  return {
    getContext() {
      return rec.ctx;
    },
    style: {},
    width: 0,
    height: 0,
    parentNode: {
      clientWidth: viewport.cssW,
      clientHeight: viewport.cssH,
    },
  };
}

/** @param {{cssW:number, cssH:number, dpr:number}} viewport */
function makeFakeWindow(viewport) {
  return {
    devicePixelRatio: viewport.dpr,
    innerWidth: viewport.cssW,
    innerHeight: viewport.cssH,
  };
}

/**
 * Mounts the candidate (src/compat.js) against a fresh fake canvas/recorder,
 * with a stubbed globalThis.window restored afterwards — matching the
 * reference mount's reliance on an ambient `window` as closely as possible
 * while also exercising compat's own explicit `win` parameter.
 * @param {{cssW:number, cssH:number, dpr:number}} viewport
 */
function mountCandidate(viewport) {
  const rec = makeRecorder();
  const canvas = makeFakeCanvas(rec, viewport);
  const win = makeFakeWindow(viewport);

  const prevWindow = globalThis.window;
  globalThis.window = win;
  let api;
  try {
    api = mount(canvas, win);
  } finally {
    globalThis.window = prevWindow;
  }
  return { api, rec, canvas, win };
}

/**
 * Compares two op streams and, on mismatch, reports the first differing
 * index plus both ops at that index (per the task's ask), rather than
 * dumping the whole (potentially huge) arrays.
 * @param {Array<any[]>} referenceOps
 * @param {Array<any[]>} candidateOps
 * @param {string} label
 */
function assertOpsEqual(referenceOps, candidateOps, label) {
  const len = Math.max(referenceOps.length, candidateOps.length);
  for (let i = 0; i < len; i++) {
    const r = referenceOps[i];
    const c = candidateOps[i];
    let same = true;
    try {
      assert.deepStrictEqual(c, r);
    } catch {
      same = false;
    }
    if (!same) {
      assert.fail(
        `${label}: op stream differs at index ${i} of ${len}\n` +
          `  reference[${i}] = ${JSON.stringify(r)}\n` +
          `  candidate[${i}] = ${JSON.stringify(c)}`
      );
    }
  }
  assert.equal(candidateOps.length, referenceOps.length, `${label}: op count differs`);
}

/**
 * The reference's `state()`/`sets()`/`basis()`/`tune()`/`dtune()`/`ftune()`
 * /`params()` results (and anything nested in them, like `ftune()`'s
 * `order` array) are created inside the vm sandbox's own realm, so they
 * carry that realm's Object.prototype / Array.prototype rather than this
 * module's — a shallow `{...o}` fixes only the top level. Rebuild the value
 * recursively out of plain host objects/arrays before a strict deepEqual,
 * which also compares prototypes (CONTRACT.md §0 item 3).
 * @param {*} v
 */
function plain(v) {
  // Array.isArray() correctly recognises a cross-realm (vm sandbox) array,
  // but `v.map(plain)` would inherit that realm's Array via species
  // resolution and reproduce the exact prototype mismatch this function
  // exists to fix. Array.from(v, plain), called on the *host* Array,
  // always builds a genuine host-realm array.
  if (Array.isArray(v)) return Array.from(v, plain);
  if (v !== null && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = plain(v[k]);
    return out;
  }
  return v;
}

const LATTICE_POINTS = [
  [0, 0, 0],
  [1, 2, 3],
  [-1, 0, 2],
  [4, -3, 1],
  [0, 5, -5],
];

function assertApiParity(refApi, candApi, refCanvas, candCanvas, label) {
  assert.deepEqual(plain(refApi.state()), plain(candApi.state()), `${label}: state()`);
  assert.deepEqual(plain(refApi.sets()), plain(candApi.sets()), `${label}: sets()`);
  assert.deepEqual(plain(refApi.basis()), plain(candApi.basis()), `${label}: basis()`);
  assert.equal(candCanvas.width, refCanvas.width, `${label}: canvas.width`);
  assert.equal(candCanvas.height, refCanvas.height, `${label}: canvas.height`);
  assert.equal(
    candCanvas.style.width,
    refCanvas.style.width,
    `${label}: canvas.style.width`
  );
  assert.equal(
    candCanvas.style.height,
    refCanvas.style.height,
    `${label}: canvas.style.height`
  );
  for (const [x, y, z] of LATTICE_POINTS) {
    assert.deepEqual(
      plain(refApi.project(x, y, z)),
      plain(candApi.project(x, y, z)),
      `${label}: project(${x},${y},${z})`
    );
  }
}

test('src/compat.js exists', () => {
  assert.ok(
    SRC_PRESENT,
    `missing one of src/compat.js, src/core.js, src/painter-canvas.js under ` +
      `${path.join(__dirname, '..')} — this suite depends on W1a's unlanded output`
  );
});

test(
  'op-stream, state()/sets()/basis()/canvas/project() parity across VIEWPORTS x STATES',
  { skip: SRC_PRESENT ? false : 'src/ missing, see "src/compat.js exists"' },
  () => {
    for (const viewport of VIEWPORTS) {
      for (const state of STATES) {
        const label = `${viewport.name}/${state.name}`;

        const { api: refApi, rec: refRec, canvas: refCanvas } = loadReference(viewport);
        const { api: candApi, rec: candRec, canvas: candCanvas } = mountCandidate(viewport);

        // Full recorded op stream, from each mount's own draw, through the
        // three setters in applyState(), through one final explicit draw().
        applyState(refApi, state);
        refApi.draw();
        applyState(candApi, state);
        candApi.draw();

        assertOpsEqual(refRec.ops, candRec.ops, `${label} op stream`);
        assertApiParity(refApi, candApi, refCanvas, candCanvas, label);
      }
    }
  }
);

test(
  'params(): rebuild parity and params(null) restores the fresh landed op stream',
  { skip: SRC_PRESENT ? false : 'src/ missing, see "src/compat.js exists"' },
  () => {
    const viewport = VIEWPORTS.find((v) => v.name === 'desktop');
    const landed = STATES.find((s) => s.name === 'landed');
    assert.ok(viewport && landed, 'matrix.mjs must have a "desktop" viewport and "landed" state');

    // Baseline: a completely fresh mount, landed, one draw.
    function freshLandedOps(mountFn) {
      const { api, rec } = mountFn(viewport);
      applyState(api, landed);
      rec.reset();
      api.draw();
      return rec.ops;
    }
    const freshRefOps = freshLandedOps(loadReference);
    const freshCandOps = freshLandedOps(mountCandidate);
    assertOpsEqual(freshRefOps, freshCandOps, 'fresh landed baseline');

    // Fresh mounts, params({nBlooms:26}), then landed, then a single draw.
    const { api: refApi, rec: refRec } = loadReference(viewport);
    const { api: candApi, rec: candRec } = mountCandidate(viewport);

    const refParamsOut = refApi.params({ nBlooms: 26 });
    const candParamsOut = candApi.params({ nBlooms: 26 });
    assert.deepEqual(plain(refParamsOut), plain(candParamsOut), 'params({nBlooms:26}) return value');

    applyState(refApi, landed);
    applyState(candApi, landed);
    refRec.reset();
    candRec.reset();
    refApi.draw();
    candApi.draw();
    assertOpsEqual(refRec.ops, candRec.ops, 'params({nBlooms:26}) -> landed op stream');

    // params(null) restores the built-in defaults.
    const refRestoreOut = refApi.params(null);
    const candRestoreOut = candApi.params(null);
    assert.deepEqual(plain(refRestoreOut), plain(candRestoreOut), 'params(null) return value');

    applyState(refApi, landed);
    applyState(candApi, landed);
    refRec.reset();
    candRec.reset();
    refApi.draw();
    candApi.draw();

    assertOpsEqual(refRec.ops, candRec.ops, 'params(null) -> landed op stream (ref vs cand)');
    assertOpsEqual(freshRefOps, refRec.ops, 'params(null) -> landed op stream (ref vs its own fresh baseline)');
    assertOpsEqual(freshCandOps, candRec.ops, 'params(null) -> landed op stream (cand vs its own fresh baseline)');
  }
);

test(
  'core-level parity: createModel().layout().set().paint() matches the reference draw()',
  { skip: SRC_PRESENT ? false : 'src/ missing, see "src/compat.js exists"' },
  () => {
    const viewport = VIEWPORTS.find((v) => v.name === 'desktop');
    const state = STATES.find((s) => s.name === 'landed');

    const { api: refApi, rec: refRec } = loadReference(viewport);
    applyState(refApi, state);
    refRec.reset();
    refApi.draw();

    const model = createModel();
    model.layout({ cssW: viewport.cssW, cssH: viewport.cssH, dpr: viewport.dpr });
    model.set({ p: state.p, q: state.q, yaw: state.yaw });
    const candRec = makeRecorder();
    paint(candRec.ctx, model.frame());

    assertOpsEqual(refRec.ops, candRec.ops, 'core-level draw');
  }
);

test(
  'known facts: 1440x900@2 sets() and landed cube count',
  { skip: SRC_PRESENT ? false : 'src/ missing, see "src/compat.js exists"' },
  () => {
    const viewport = { cssW: 1440, cssH: 900, dpr: 2 };

    const model = createModel();
    model.layout(viewport);
    assert.deepEqual({ ...model.sets() }, { all: 3259, surface: 1289, visible: 602 });

    model.set({ p: 1, q: 0, yaw: 0 });
    const frame = model.frame();
    assert.equal(frame.n, 602);

    const { api: candApi } = mountCandidate(viewport);
    assert.deepEqual({ ...candApi.sets() }, { all: 3259, surface: 1289, visible: 602 });
    candApi.setYaw(0);
    candApi.setP(1);
    candApi.setQ(0);
    assert.equal(candApi.state().drawn, 602);

    const { api: refApi } = loadReference(viewport);
    assert.deepEqual({ ...refApi.sets() }, { all: 3259, surface: 1289, visible: 602 });
    refApi.setYaw(0);
    refApi.setP(1);
    refApi.setQ(0);
    assert.equal(refApi.state().drawn, 602);
  }
);

test(
  'sequence parity: STATES walk, tune/fit/resize, dtune/ftune/params, on desktop and phone',
  { skip: SRC_PRESENT ? false : 'src/ missing, see "src/compat.js exists"' },
  () => {
    for (const viewportName of ['desktop', 'phone']) {
      const viewport = VIEWPORTS.find((v) => v.name === viewportName);
      const label = `sequence/${viewportName}`;

      const { api: refApi, rec: refRec, canvas: refCanvas } = loadReference(viewport);
      const { api: candApi, rec: candRec, canvas: candCanvas, win: candWin } = mountCandidate(viewport);

      // Initial mount draws already differ in recorder contents from here
      // on; only compare NEW ops after each step below.
      refRec.reset();
      candRec.reset();

      function step(fn, what) {
        refRec.reset();
        candRec.reset();
        const refOut = fn(refApi);
        const candOut = fn(candApi);
        if (refOut !== undefined || candOut !== undefined) {
          assert.deepEqual(plain(refOut ?? {}), plain(candOut ?? {}), `${label}: ${what} return value`);
        }
        assertOpsEqual(refRec.ops, candRec.ops, `${label}: ${what} ops`);
      }

      for (const state of STATES) {
        step((api) => api.setYaw(state.yaw), `setYaw(${state.yaw}) [${state.name}]`);
        step((api) => api.setP(state.p), `setP(${state.p}) [${state.name}]`);
        step((api) => api.setQ(state.q), `setQ(${state.q}) [${state.name}]`);
      }

      step((api) => api.tune({ turns: 2 }), 'tune({turns:2})');
      step((api) => api.fit(0.5), 'fit(0.5)');

      // Resize: change both parentNode sizes and win.innerWidth/innerHeight
      // before calling resize().
      const newCssW = viewport.cssW + 80;
      const newCssH = viewport.cssH + 40;
      refCanvas.parentNode.clientWidth = newCssW;
      refCanvas.parentNode.clientHeight = newCssH;
      candCanvas.parentNode.clientWidth = newCssW;
      candCanvas.parentNode.clientHeight = newCssH;
      candWin.innerWidth = newCssW;
      candWin.innerHeight = newCssH;
      step((api) => api.resize(), 'resize()');

      step((api) => api.setP(0.3), 'setP(0.3)');
      step((api) => api.dtune({ outK: 2.2 }), 'dtune({outK:2.2})');
      step((api) => api.ftune({ within: 'depth' }), "ftune({within:'depth'})");
      step((api) => api.ftune({ fillHollow: false }), 'ftune({fillHollow:false})');
      step((api) => api.params({ nBlooms: 40 }), 'params({nBlooms:40})');
      step((api) => api.params(null), 'params(null)');

      assertApiParity(refApi, candApi, refCanvas, candCanvas, `${label}: final`);
    }
  }
);
