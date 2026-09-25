#!/usr/bin/env node
// report.mjs — TASK W2d: perf + size report.
//
// Compares, in real headless Chromium:
//   (a) REFERENCE (reference/bouquet-loader.ref.js), driven the way the
//       shipping loader's own run() drives it: each fly-in frame calls
//       setYaw() then setP() — two setter calls, each of which internally
//       calls the reference's private draw() — i.e. two draws per frame.
//   (b) NEW driver/core (src/core.js + src/painter-canvas.js, the same
//       math driver.js's tick() uses): each frame does ONE model.set()
//       covering p/q/yaw, then ONE paint() call — one paint per frame.
//
// across three scenarios (fly-in, reveal, landed-idle), three DPRs
// (1, 1.5, 2) and two CPU throttle rates (4x, 6x), then also runs
// scripts/size.mjs, and writes both into docs/P0-REPORT.md.
//
// Not a test: prints progress to stderr, writes the report file, and exits
// 0 on success.

import http from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { measure as measureSize } from '../scripts/size.mjs';

import { chromiumTarget } from '../../../scripts/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/renderer — same document root throttle.mjs uses, so
// report-page.html's "../../reference/..." and "../../src/..." resolve
// the same way.
const RENDERER_ROOT = path.resolve(here, '..');
const DOCS_DIR = path.join(RENDERER_ROOT, 'docs');
const REPORT_PATH = path.join(DOCS_DIR, 'P0-REPORT.md');
const REPORT_DATE = '2026-09-25';
const MACHINE_NOTE =
  'cloud container, headless Chromium 141, --disable-gpu; relative numbers only';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        let rel = decodeURIComponent(url.pathname);
        if (rel === '/') rel = '/bench/pages/report-page.html';
        const filePath = path.join(RENDERER_ROOT, rel);
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(RENDERER_ROOT)) {
          res.writeHead(403).end('forbidden');
          return;
        }
        const st = await stat(resolved).catch(() => null);
        if (!st || !st.isFile()) {
          res.writeHead(404).end(`not found: ${rel}`);
          return;
        }
        const buf = await readFile(resolved);
        const ext = path.extname(resolved);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
        res.end(buf);
      } catch (err) {
        res.writeHead(500).end(String((err && err.stack) || err));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/**
 * Runs one (mode, scenario) frame loop in-page and returns the per-frame
 * call durations (ms), timed with performance.now() around just that
 * frame's renderer calls — matching what a throttled main thread actually
 * has to do per frame.
 *
 * @param {import('playwright-core').Page} page
 * @param {'ref'|'new'} mode
 * @param {'fly-in'|'reveal'|'landed-idle'} scenario
 * @returns {Promise<number[]>}
 */
async function runScenario(page, mode, scenario) {
  return page.evaluate(
    async ({ mode, scenario }) => {
      const rafFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const times = [];

      if (mode === 'ref') {
        const canvas = document.getElementById('stage-ref').querySelector('canvas');
        const api = window.BouquetLoader.mount(canvas);

        if (scenario === 'fly-in') {
          for (let i = 0; i <= 120; i++) {
            const p = i / 120;
            await rafFrame();
            const t0 = performance.now();
            api.setYaw(-540 * (1 - p)); // draw() #1
            api.setP(p); // draw() #2
            times.push(performance.now() - t0);
          }
        } else if (scenario === 'reveal') {
          api.setYaw(0);
          api.setP(1);
          for (let i = 0; i <= 120; i++) {
            const q = i / 120;
            await rafFrame();
            const t0 = performance.now();
            api.setQ(q);
            times.push(performance.now() - t0);
          }
        } else if (scenario === 'landed-idle') {
          api.setYaw(0);
          api.setP(1);
          api.setQ(0);
          for (let i = 0; i < 120; i++) {
            await rafFrame();
            const t0 = performance.now();
            api.draw();
            times.push(performance.now() - t0);
          }
        }
      } else {
        // mode === 'new' — src/core.js + src/painter-canvas.js, driven the
        // way driver.js's tick()/paintOnce() drives it: one model.set()
        // covering p/q/yaw, then one paint() call, per frame.
        const { createModel, paint } = window.__new;
        const canvas = document.getElementById('stage-new').querySelector('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });
        const model = createModel();
        const parent = canvas.parentNode;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = { cssW: parent.clientWidth, cssH: parent.clientHeight, dpr };
        const dims = model.layout(vp);
        canvas.style.width = vp.cssW + 'px';
        canvas.style.height = vp.cssH + 'px';
        canvas.width = dims.width;
        canvas.height = dims.height;
        const paintOnce = () => paint(ctx, model.frame());
        paintOnce(); // initial frame, same as compat/driver mount

        if (scenario === 'fly-in') {
          for (let i = 0; i <= 120; i++) {
            const p = i / 120;
            await rafFrame();
            const t0 = performance.now();
            model.set({ p, yaw: -540 * (1 - p) });
            paintOnce();
            times.push(performance.now() - t0);
          }
        } else if (scenario === 'reveal') {
          model.set({ p: 1, yaw: 0 });
          paintOnce();
          for (let i = 0; i <= 120; i++) {
            const q = i / 120;
            await rafFrame();
            const t0 = performance.now();
            model.set({ q });
            paintOnce();
            times.push(performance.now() - t0);
          }
        } else if (scenario === 'landed-idle') {
          model.set({ p: 1, yaw: 0, q: 0 });
          paintOnce();
          for (let i = 0; i < 120; i++) {
            await rafFrame();
            const t0 = performance.now();
            paintOnce();
            times.push(performance.now() - t0);
          }
        }
      }

      return times;
    },
    { mode, scenario },
  );
}

/**
 * @param {number[]} times
 * @returns {{median: number, p95: number, max: number}}
 */
function summarize(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))];
  return {
    median: Number(at(0.5).toFixed(3)),
    p95: Number(at(0.95).toFixed(3)),
    max: Number(sorted[sorted.length - 1].toFixed(3)),
  };
}

async function runBenchMatrix() {
  const server = await startStaticServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const pageUrl = `http://127.0.0.1:${port}/bench/pages/report-page.html`;

  const browser = await chromium.launch({
    ...chromiumTarget(),
    args: ['--disable-gpu', '--no-sandbox'],
  });

  const dprs = [1, 1.5, 2];
  const rates = [4, 6];
  const modes = ['ref', 'new'];
  const scenarios = ['fly-in', 'reveal', 'landed-idle'];
  const results = [];

  try {
    for (const dpr of dprs) {
      for (const rate of rates) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: dpr,
        });
        try {
          const page = await context.newPage();
          await page.goto(pageUrl, { waitUntil: 'load' });
          const client = await context.newCDPSession(page);
          await client.send('Emulation.setCPUThrottlingRate', { rate });

          for (const mode of modes) {
            for (const scenario of scenarios) {
              process.stderr.write(
                `bench: dpr=${dpr} rate=${rate}x mode=${mode} scenario=${scenario}\n`,
              );
              const times = await runScenario(page, mode, scenario);
              results.push({
                dpr,
                rate,
                mode,
                scenario,
                frames: times.length,
                ...summarize(times),
              });
            }
          }

          await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }

  return results;
}

function fmt(n) {
  return n.toFixed(2);
}

function buildMarkdown(results, sizeResult) {
  const dprs = [1, 1.5, 2];
  const rates = [4, 6];
  const scenarios = ['fly-in', 'reveal', 'landed-idle'];

  const byKey = new Map();
  for (const r of results) {
    byKey.set(`${r.dpr}|${r.rate}|${r.mode}|${r.scenario}`, r);
  }

  const lines = [];
  lines.push('# P0 report — perf + size');
  lines.push('');
  lines.push(`Date: ${REPORT_DATE}`);
  lines.push('');
  lines.push(`Machine: ${MACHINE_NOTE}`);
  lines.push('');
  lines.push(
    '(a) REFERENCE = `reference/bouquet-loader.ref.js`, driven the way the ' +
      "shipping loader's own `run()` drives it (fly-in: `setYaw()` then " +
      '`setP()` per frame — two internal `draw()` calls). (b) NEW = ' +
      '`src/core.js` + `src/painter-canvas.js`, driven the way ' +
      "`driver.js`'s `tick()`/`paintOnce()` drives it (one `model.set()` " +
      'covering p/q/yaw, then one `paint()` — one paint per frame). All ' +
      'times are frame-call durations in ms (renderer calls only, not the ' +
      'rAF wait), 120 (or 121) frames per cell, at 390x844.',
  );
  lines.push('');

  for (const dpr of dprs) {
    lines.push(`## DPR ${dpr}`);
    lines.push('');
    for (const rate of rates) {
      lines.push(`### CPU throttle ${rate}x`);
      lines.push('');
      lines.push('| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |');
      lines.push('|---|---|---|---|---|---|---|');
      for (const scenario of scenarios) {
        const ref = byKey.get(`${dpr}|${rate}|ref|${scenario}`);
        const nw = byKey.get(`${dpr}|${rate}|new|${scenario}`);
        if (!ref || !nw) {
          lines.push(`| ${scenario} | (missing) | | | | | |`);
          continue;
        }
        lines.push(
          `| ${scenario} | ${fmt(ref.median)} | ${fmt(ref.p95)} | ${fmt(ref.max)} | ` +
            `${fmt(nw.median)} | ${fmt(nw.p95)} | ${fmt(nw.max)} |`,
        );
      }
      lines.push('');
    }
  }

  lines.push('## Bundle size (`scripts/size.mjs`, `src/index.js`)');
  lines.push('');
  lines.push('| min (bytes) | gzip (bytes) | brotli (bytes) | budget (gzip) | ok |');
  lines.push('|---|---|---|---|---|');
  lines.push(
    `| ${sizeResult.minBytes} | ${sizeResult.gzipBytes} | ${sizeResult.brotliBytes} | ` +
      `${sizeResult.budget} | ${sizeResult.ok ? 'yes' : 'NO'} |`,
  );
  lines.push('');

  // ---- 5-line summary ----
  const flyInDeltas = [];
  for (const dpr of dprs) {
    for (const rate of rates) {
      const ref = byKey.get(`${dpr}|${rate}|ref|fly-in`);
      const nw = byKey.get(`${dpr}|${rate}|new|fly-in`);
      if (ref && nw) flyInDeltas.push({ dpr, rate, ref: ref.median, nw: nw.median });
    }
  }
  const worstRef = results
    .filter((r) => r.mode === 'ref')
    .reduce((a, b) => (b.p95 > (a ? a.p95 : -Infinity) ? b : a), null);
  const worstNew = results
    .filter((r) => r.mode === 'new')
    .reduce((a, b) => (b.p95 > (a ? a.p95 : -Infinity) ? b : a), null);

  lines.push('## Summary');
  lines.push('');
  lines.push(
    `1. Worst-case REFERENCE frame: ${worstRef ? `${fmt(worstRef.p95)}ms p95 (${worstRef.scenario}, DPR ${worstRef.dpr}, ${worstRef.rate}x throttle)` : 'n/a'}.`,
  );
  lines.push(
    `2. Worst-case NEW frame: ${worstNew ? `${fmt(worstNew.p95)}ms p95 (${worstNew.scenario}, DPR ${worstNew.dpr}, ${worstNew.rate}x throttle)` : 'n/a'}.`,
  );
  const flyInSummary = flyInDeltas
    .map((d) => `DPR${d.dpr}/${d.rate}x: ref ${fmt(d.ref)} vs new ${fmt(d.nw)}`)
    .join('; ');
  lines.push(
    `3. Fly-in (two draws/frame for ref, one paint/frame for new) medians — ${flyInSummary || 'n/a'}.`,
  );
  lines.push(
    `4. Bundle: ${sizeResult.gzipBytes} gzip bytes vs an ${sizeResult.budget}-byte budget — ${sizeResult.ok ? 'within budget' : 'OVER BUDGET'}.`,
  );
  lines.push(
    '5. Numbers are relative (headless cloud container, no GPU) — use them to compare ref vs new and DPR/throttle trends, not as absolute frame budgets on real hardware.',
  );
  lines.push('');

  return lines.join('\n');
}

async function main() {
  process.stderr.write('report: running bench matrix (dpr x throttle x mode x scenario)...\n');
  const results = await runBenchMatrix();

  process.stderr.write('report: running scripts/size.mjs...\n');
  const sizeResult = await measureSize();

  const markdown = buildMarkdown(results, sizeResult);

  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(REPORT_PATH, markdown, 'utf8');

  process.stderr.write(`report: wrote ${REPORT_PATH}\n`);
  console.log(JSON.stringify({ results, size: sizeResult }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
