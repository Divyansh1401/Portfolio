#!/usr/bin/env node
// throttle.mjs — CPU-throttled frame-time bench for the reference bouquet
// renderer, run in real headless Chromium via CDP's
// Emulation.setCPUThrottlingRate. Not a test: it prints one JSON array of
// {rate, scenario, frames, median, p95, max} objects to stdout and exits.
//
// Scenarios (mirrors run()'s three phases, but drives the renderer's own
// setP/setQ/setYaw/draw directly rather than calling run(), so the bench
// measures the renderer's per-frame cost in isolation from the driver's
// scroll/rAF plumbing):
//   fly-in       120 frames, p: 0..1, yaw: -540*(1-p) -> 0
//   reveal       120 frames, q: 0..1 (p=1, yaw=0 already landed)
//   landed-idle  120 frames of plain draw() at rest (p=1, yaw=0, q=0)
//
// Each frame's timed window is just the renderer calls for that frame
// (setYaw/setP, or setQ, or draw) — NOT the rAF wait — matching what a
// throttled main thread actually has to do per frame.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { chromiumTarget } from '../../../scripts/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/renderer — same document root pixel-harness.mjs uses, so
// throttle-page.html's "../../reference/bouquet-loader.ref.js" resolves the
// same way.
const RENDERER_ROOT = path.resolve(here, '..');

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
        if (rel === '/') rel = '/bench/pages/throttle-page.html';
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
 * Runs one scenario's frame loop in-page and returns the per-frame call
 * durations (ms), timed with performance.now() around just that frame's
 * renderer calls.
 *
 * @param {import('playwright-core').Page} page
 * @param {'fly-in'|'reveal'|'landed-idle'} scenario
 * @returns {Promise<number[]>}
 */
async function runScenario(page, scenario) {
  return page.evaluate(async (name) => {
    const canvas = document.getElementById('stage').querySelector('canvas');
    const api = window.BouquetLoader.mount(canvas);
    const rafFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const times = [];

    if (name === 'fly-in') {
      for (let i = 0; i <= 120; i++) {
        const p = i / 120;
        await rafFrame();
        const t0 = performance.now();
        api.setYaw(-540 * (1 - p));
        api.setP(p);
        times.push(performance.now() - t0);
      }
    } else if (name === 'reveal') {
      api.setYaw(0);
      api.setP(1);
      for (let i = 0; i <= 120; i++) {
        const q = i / 120;
        await rafFrame();
        const t0 = performance.now();
        api.setQ(q);
        times.push(performance.now() - t0);
      }
    } else if (name === 'landed-idle') {
      api.setYaw(0);
      api.setP(1);
      api.setQ(0);
      for (let i = 0; i < 120; i++) {
        await rafFrame();
        const t0 = performance.now();
        api.draw();
        times.push(performance.now() - t0);
      }
    } else {
      throw new Error(`unknown scenario: ${name}`);
    }

    return times;
  }, scenario);
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

async function main() {
  const server = await startStaticServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const pageUrl = `http://127.0.0.1:${port}/bench/pages/throttle-page.html`;

  const browser = await chromium.launch({
    ...chromiumTarget(),
    args: ['--disable-gpu', '--no-sandbox'],
  });

  const rates = [4, 6];
  const scenarios = ['fly-in', 'reveal', 'landed-idle'];
  const results = [];

  try {
    for (const rate of rates) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1.5,
      });
      try {
        const page = await context.newPage();
        await page.goto(pageUrl, { waitUntil: 'load' });
        const client = await context.newCDPSession(page);
        await client.send('Emulation.setCPUThrottlingRate', { rate });

        for (const scenario of scenarios) {
          const times = await runScenario(page, scenario);
          results.push({
            rate,
            scenario,
            frames: times.length,
            ...summarize(times),
          });
        }

        await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
