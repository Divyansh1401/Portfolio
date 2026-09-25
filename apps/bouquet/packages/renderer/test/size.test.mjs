import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const RENDERER_ROOT = path.resolve(path.dirname(__filename), '..');
const SIZE_SCRIPT = path.resolve(RENDERER_ROOT, 'scripts/size.mjs');

test('size.mjs exits 0 (under budget) for src/index.js', () => {
  let status = 0;
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [SIZE_SCRIPT], {
      cwd: RENDERER_ROOT,
      stdio: 'pipe',
    }).toString();
  } catch (err) {
    status = err.status;
    stdout = err.stdout ? err.stdout.toString() : '';
    console.error(err.stderr ? err.stderr.toString() : '');
  }

  assert.equal(status, 0, `size.mjs must exit 0 (under budget); stdout: ${stdout}`);

  const line = stdout.trim().split('\n').pop();
  const result = JSON.parse(line);
  assert.equal(result.ok, true);
  assert.ok(result.gzipBytes <= result.budget);
});

test('measure() reports a well-formed result for src/index.js', async () => {
  const { measure, BUDGET_GZIP } = await import(SIZE_SCRIPT);
  const result = await measure();
  assert.equal(typeof result.minBytes, 'number');
  assert.equal(typeof result.gzipBytes, 'number');
  assert.equal(typeof result.brotliBytes, 'number');
  assert.equal(result.budget, BUDGET_GZIP);
  assert.ok(result.minBytes > 0);
  assert.ok(result.gzipBytes > 0 && result.gzipBytes <= result.brotliBytes * 2);
});
