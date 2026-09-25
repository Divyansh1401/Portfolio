// load-reference.mjs — runs the vendored reference loader
// (../../reference/bouquet-loader.ref.js) inside a node:vm sandbox and
// mounts it against a fake canvas backed by the recording context from
// ./recorder.mjs. This is the "numbers before pixels" oracle: it drives the
// SAME renderer code the browser runs, but every draw() call is captured as
// a stream of ops instead of pixels.
//
// Nothing here imports or reads anything outside apps/bouquet at runtime —
// the reference file vendored into this package is the only link to the
// portfolio's shipping loader.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { makeRecorder } from './recorder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_PATH = path.join(__dirname, '..', '..', 'reference', 'bouquet-loader.ref.js');
const REFERENCE_SOURCE = readFileSync(REFERENCE_PATH, 'utf8');

/**
 * @param {{cssW: number, cssH: number, dpr: number}} opts
 * @returns {{api: object, rec: {ops: Array<any[]>, reset: () => void}}}
 */
export function loadReference({ cssW, cssH, dpr }) {
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

  return { api, rec };
}
