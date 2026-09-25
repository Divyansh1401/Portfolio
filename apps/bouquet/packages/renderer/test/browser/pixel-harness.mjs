// pixel-harness.mjs — headless-Chromium pixel oracle for the bouquet
// renderer. Launches Chromium once per call, serves this package's own
// `packages/renderer` directory over a throwaway node:http static server (no
// external deps — just node:http/fs), opens pixel-page.html (which loads the
// pinned reference renderer as a classic script, exactly like the portfolio
// does), mounts the reference and a candidate renderer into two sibling
// canvases per matrix case, applies the same state to both, and diffs their
// pixels byte-by-byte INSIDE the page.
//
// Nothing here reads or imports anything outside apps/bouquet at runtime:
// the only file served is this package's own renderer directory, and a
// candidate module (an absolute path someone hands us) is streamed back
// as-is over a dedicated route rather than resolved on disk relative to
// anything outside this package.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/renderer — the static server's document root. pixel-page.html
// lives at <root>/test/browser/pixel-page.html and loads the reference via
// "../../reference/bouquet-loader.ref.js", i.e. <root>/reference/....
const RENDERER_ROOT = path.resolve(here, '..', '..');

// TODO(oracle/matrix.mjs): task W0? owns `../oracle/matrix.mjs`, a shared
// viewport/state matrix for every oracle consumer. That file did not exist
// yet when this harness was written, so the SAME shape is duplicated here.
// Once it lands, replace this local MATRIX with:
//   import { MATRIX } from '../oracle/matrix.mjs';
// and delete the block below.
export const MATRIX = [
  {
    viewport: { name: 'desktop-1440x900@2', cssW: 1440, cssH: 900, dpr: 2 },
    state: { name: 'landed', p: 1, yaw: 0, q: 0 },
  },
  {
    viewport: { name: 'desktop-1440x900@2', cssW: 1440, cssH: 900, dpr: 2 },
    state: { name: 'landed-yaw30', p: 1, yaw: 30, q: 0 },
  },
  {
    viewport: { name: 'desktop-1440x900@2', cssW: 1440, cssH: 900, dpr: 2 },
    state: { name: 'flying-mid', p: 0.5, yaw: -90, q: 0 },
  },
  {
    viewport: { name: 'desktop-1440x900@2', cssW: 1440, cssH: 900, dpr: 2 },
    state: { name: 'disperse-mid', p: 1, yaw: 0, q: 0.5 },
  },
  {
    viewport: { name: 'desktop-1728x1080@2', cssW: 1728, cssH: 1080, dpr: 2 },
    state: { name: 'landed', p: 1, yaw: 0, q: 0 },
  },
  {
    viewport: { name: 'laptop-1280x800@1', cssW: 1280, cssH: 800, dpr: 1 },
    state: { name: 'landed', p: 1, yaw: 0, q: 0 },
  },
  {
    viewport: { name: 'tablet-1024x900@2', cssW: 1024, cssH: 900, dpr: 2 },
    state: { name: 'flying-start', p: 0.05, yaw: -500, q: 0 },
  },
  {
    viewport: { name: 'desktop-1440x900@2', cssW: 1440, cssH: 900, dpr: 2 },
    state: { name: 'zero', p: 0, yaw: 0, q: 0 },
  },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/**
 * @param {string|null} candidatePath absolute path to a candidate ES module,
 *   or null when the candidate is 'reference' (no extra route needed).
 * @returns {Promise<import('node:http').Server>}
 */
function startStaticServer(candidatePath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');

        if (url.pathname === '/__candidate.mjs') {
          if (!candidatePath) {
            res.writeHead(404).end('no candidate configured');
            return;
          }
          const buf = await readFile(candidatePath);
          res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
          res.end(buf);
          return;
        }

        let rel = decodeURIComponent(url.pathname);
        if (rel === '/') rel = '/test/browser/pixel-page.html';
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
 * Runs the pixel oracle: reference renderer vs a candidate (or reference vs
 * itself), across every case in MATRIX, in one Chromium launch.
 *
 * @param {{candidate: 'reference'|string}} opts `candidate` is either the
 *   literal string 'reference' (compares reference against itself, in two
 *   separate canvases/mounts) or an absolute path to an ES module exporting
 *   `mount(canvas)` with the same setP/setQ/setYaw/draw API as the
 *   reference.
 * @returns {Promise<Array<{
 *   viewport: string,
 *   state: string,
 *   diffPixels: number,
 *   width: number,
 *   height: number,
 *   refSha256: string,
 * }>>}
 */
export async function pixelDiff({ candidate }) {
  const candidatePath = candidate === 'reference' ? null : candidate;
  const server = await startStaticServer(candidatePath);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const pageUrl = `http://127.0.0.1:${port}/test/browser/pixel-page.html`;

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXECUTABLE,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  /** @type {Array<{viewport:string,state:string,diffPixels:number,width:number,height:number,refSha256:string}>} */
  const results = [];

  try {
    for (const testCase of MATRIX) {
      const { viewport, state } = testCase;
      const context = await browser.newContext({
        viewport: { width: viewport.cssW, height: viewport.cssH },
        deviceScaleFactor: viewport.dpr,
      });
      try {
        const page = await context.newPage();
        await page.goto(pageUrl, { waitUntil: 'load' });

        const result = await page.evaluate(
          async ({ cssW, cssH, state, candidateUrl }) => {
            function makeContainer(id) {
              const existing = document.getElementById(id);
              if (existing) existing.remove();
              const el = document.createElement('div');
              el.id = id;
              el.style.position = 'absolute';
              el.style.left = '0';
              el.style.top = '0';
              el.style.width = `${cssW}px`;
              el.style.height = `${cssH}px`;
              const canvas = document.createElement('canvas');
              el.appendChild(canvas);
              document.body.appendChild(el);
              return { el, canvas };
            }

            const ref = makeContainer('__pixel_ref');
            const cand = makeContainer('__pixel_cand');

            const refApi = window.BouquetLoader.mount(ref.canvas);
            let candApi;
            if (candidateUrl) {
              const mod = await import(/* webpackIgnore: true */ candidateUrl);
              candApi = mod.mount(cand.canvas);
            } else {
              candApi = window.BouquetLoader.mount(cand.canvas);
            }

            refApi.setYaw(state.yaw);
            refApi.setP(state.p);
            refApi.setQ(state.q);
            candApi.setYaw(state.yaw);
            candApi.setP(state.p);
            candApi.setQ(state.q);

            const w = ref.canvas.width;
            const h = ref.canvas.height;
            const w2 = cand.canvas.width;
            const h2 = cand.canvas.height;

            const refData = ref.canvas.getContext('2d').getImageData(0, 0, w, h).data;

            let diffPixels = 0;
            if (w !== w2 || h !== h2) {
              // A dimension mismatch means the two canvases are not
              // comparable pixel-for-pixel; report it as a total mismatch
              // rather than throwing, so the caller sees it in diffPixels.
              diffPixels = Math.max(w * h, w2 * h2);
            } else {
              const candData = cand.canvas.getContext('2d').getImageData(0, 0, w2, h2).data;
              for (let i = 0; i < refData.length; i += 4) {
                if (
                  refData[i] !== candData[i] ||
                  refData[i + 1] !== candData[i + 1] ||
                  refData[i + 2] !== candData[i + 2] ||
                  refData[i + 3] !== candData[i + 3]
                ) {
                  diffPixels++;
                }
              }
            }

            const digestBuf = await crypto.subtle.digest(
              'SHA-256',
              refData.buffer.slice(refData.byteOffset, refData.byteOffset + refData.byteLength)
            );
            const refSha256 = Array.from(new Uint8Array(digestBuf))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');

            ref.el.remove();
            cand.el.remove();

            return { diffPixels, width: w, height: h, refSha256 };
          },
          {
            cssW: viewport.cssW,
            cssH: viewport.cssH,
            state,
            candidateUrl: candidatePath ? '/__candidate.mjs' : null,
          }
        );

        results.push({
          viewport: viewport.name,
          state: state.name,
          diffPixels: result.diffPixels,
          width: result.width,
          height: result.height,
          refSha256: result.refSha256,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }

  return results;
}
