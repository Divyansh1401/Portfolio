import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const RENDERER_ROOT = path.resolve(path.dirname(__filename), '..');
const LINT_SCRIPT = path.resolve(RENDERER_ROOT, 'scripts/lint-no-dom.mjs');
const CORE_PATH = path.resolve(RENDERER_ROOT, 'src/core.js');

test('lint-no-dom.mjs exits 0 (clean) on src/core.js and src/painter-canvas.js', () => {
  let status = 0;
  try {
    execFileSync(process.execPath, [LINT_SCRIPT], { cwd: RENDERER_ROOT, stdio: 'pipe' });
  } catch (err) {
    status = err.status;
    console.error(err.stdout ? err.stdout.toString() : '');
    console.error(err.stderr ? err.stderr.toString() : '');
  }
  assert.equal(status, 0, 'lint-no-dom.mjs must exit 0 with no violations');
});

/**
 * Import src/core.js inside a fresh Node vm context that has NO window,
 * document, or other DOM globals, to prove it is truly DOM-free at runtime.
 */
async function importCoreInIsolatedVm() {
  const source = readFileSync(CORE_PATH, 'utf8');

  if (/^\s*import\b/m.test(source)) {
    throw new Error('src/core.js must have zero imports');
  }

  // Bare context: no window/document/navigator etc. Node's node:vm module
  // only supports ESM via vm.SourceTextModule, which requires the
  // --experimental-vm-modules flag we cannot pass through `node --test`.
  // Since core.js has zero imports (required by contract) and a single
  // named export, strip the `export` keyword and run it as a plain script
  // inside the DOM-free context instead -- runtime behaviour is identical.
  const stripped = source.replace(/^export\s+(?=function\b|const\b|class\b)/m, '');
  const wrapped = `${stripped}\nmodule.exports = { createModel };`;

  const sandbox = { console, module: { exports: {} } };
  sandbox.exports = sandbox.module.exports;
  vm.createContext(sandbox);

  const script = new vm.Script(wrapped, { filename: CORE_PATH });
  script.runInContext(sandbox);
  return sandbox.module.exports;
}

test('src/core.js runs with no window/document globals and produces the desktop parity count', async () => {
  const { createModel } = await importCoreInIsolatedVm();
  assert.equal(typeof createModel, 'function');

  const model = createModel();
  model.layout({ cssW: 1440, cssH: 900, dpr: 2 });
  model.set({ p: 1, q: 0, yaw: 0 });
  const frame = model.frame();
  assert.equal(frame.n, 602, 'landed 1440x900@DPR2 frame.n must be 602');
});

test('src/core.js produces a nonzero frame at a phone layout', async () => {
  const { createModel } = await importCoreInIsolatedVm();
  const model = createModel();
  model.layout({ cssW: 390, cssH: 844, dpr: 1.5 });
  model.set({ p: 1, q: 0, yaw: 0 });
  const frame = model.frame();
  assert.ok(frame.n > 0, `expected frame.n > 0 at phone layout, got ${frame.n}`);
});
