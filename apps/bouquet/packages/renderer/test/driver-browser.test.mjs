// driver-browser.test.mjs — headless-Chromium check that src/driver.js's
// createPlayer(), run to completion with real rAF/now, lands on EXACTLY the
// same pixels as src/compat.js's mount() at the same canvas size (compat's
// model starts already landed — p=1, q=0, yaw=0 — per CONTRACT.md §1.2).
//
// Nothing here reads or imports anything outside apps/bouquet at runtime:
// the static server below only ever serves this package's own
// packages/renderer directory.

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { chromiumTarget } from '../../../scripts/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/renderer — driver-page.html lives at <root>/test/browser/driver-page.html
// and imports "../../src/driver.js" and "../../src/compat.js", i.e. <root>/src/....
const RENDERER_ROOT = path.resolve(here, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        let rel = decodeURIComponent(url.pathname);
        if (rel === '/') rel = '/test/browser/driver-page.html';
        if (rel === '/favicon.ico') {
          res.writeHead(204).end();
          return;
        }
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

test('createPlayer(), run to completion, lands on the same pixels as compat.mount()', async () => {
  const server = await startStaticServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const pageUrl = `http://127.0.0.1:${port}/test/browser/driver-page.html`;

  const browser = await chromium.launch({
    ...chromiumTarget(),
    args: ['--disable-gpu', '--no-sandbox'],
  });

  const consoleErrors = [];
  const pageErrors = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 600, height: 400 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      pageErrors.push(String(err));
    });

    await page.goto(pageUrl, { waitUntil: 'load' });

    const result = await page.evaluate(async ({ cssW, cssH }) => {
      function makeStage(id) {
        const el = document.createElement('div');
        el.id = id;
        el.className = 'stage';
        el.style.width = `${cssW}px`;
        el.style.height = `${cssH}px`;
        const canvas = document.createElement('canvas');
        el.appendChild(canvas);
        document.body.appendChild(el);
        return { el, canvas };
      }

      const { createPlayer, mount } = window.__bouquetDriverTest;

      const driverStage = makeStage('__driver_stage');
      const compatStage = makeStage('__compat_stage');

      const landed = new Promise((resolve) => {
        const player = createPlayer(driverStage.canvas, {
          flyMs: 250,
          onLanded: () => resolve(player),
        });
        player.play();
      });
      const player = await landed;

      // compat.mount()'s model starts at PROG=1, Q=0, YAW=0 — already the
      // landed pose (CONTRACT.md §1.2) — so its very first draw is it.
      const compatApi = mount(compatStage.canvas);

      const dW = driverStage.canvas.width, dH = driverStage.canvas.height;
      const cW = compatStage.canvas.width, cH = compatStage.canvas.height;

      let diffPixels = 0;
      if (dW !== cW || dH !== cH) {
        diffPixels = Math.max(dW * dH, cW * cH);
      } else {
        const driverData = driverStage.canvas.getContext('2d').getImageData(0, 0, dW, dH).data;
        const compatData = compatStage.canvas.getContext('2d').getImageData(0, 0, cW, cH).data;
        for (let i = 0; i < driverData.length; i += 4) {
          if (
            driverData[i] !== compatData[i] ||
            driverData[i + 1] !== compatData[i + 1] ||
            driverData[i + 2] !== compatData[i + 2] ||
            driverData[i + 3] !== compatData[i + 3]
          ) {
            diffPixels++;
          }
        }
      }

      player.destroy();
      driverStage.el.remove();
      compatStage.el.remove();

      return { diffPixels, dW, dH, cW, cH };
    }, { cssW: 600, cssH: 400 });

    assert.equal(result.dW, result.cW, 'driver and compat canvases must land on the same backing width');
    assert.equal(result.dH, result.cH, 'driver and compat canvases must land on the same backing height');
    assert.equal(
      result.diffPixels,
      0,
      `driver's landed frame must pixel-match compat.mount()'s landed frame (${result.diffPixels} differing pixels)`
    );
    assert.deepEqual(consoleErrors, [], `zero console errors expected, got: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(pageErrors, [], `zero page errors expected, got: ${pageErrors.join(' | ')}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }
});
