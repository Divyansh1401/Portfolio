/**
 * @file Local HTTP server for the bouquet app. node:http on PORT (default
 * 4321), HOST 0.0.0.0. Plain SQLite storage (portable to D1 later).
 */

import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

import { MODE_IDS, getMode } from '../../packages/modes/modes.js';
import { SHAPE_IDS, DEFAULT_SHAPE } from '../../packages/renderer/src/shapes.js';
import { openDb, insertBouquet, getById, markOpened } from './db.js';
import { makeId, isValidId } from './ids.js';
import { normalise, graphemes } from './text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(APP_DIR, 'pages');
const DIST_DIR = path.join(APP_DIR, 'dist');
const STYLES_DIR = path.join(APP_DIR, 'styles');
const DEFAULT_DB_PATH = path.join(APP_DIR, '.data', 'bouquet.sqlite');

const MESSAGE_MAX = 280;
const NAME_MAX = 24;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/**
 * @param {string} p
 * @returns {string}
 */
function contentTypeFor(p) {
  return CONTENT_TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

/**
 * Resolve `requestPath` under `rootDir`, refusing traversal outside it.
 * @param {string} rootDir
 * @param {string} requestPath url-decoded path, relative to rootDir
 * @returns {string|null} absolute path, or null if it escapes rootDir
 */
function safeJoin(rootDir, requestPath) {
  const resolvedRoot = path.resolve(rootDir);
  const target = path.resolve(resolvedRoot, `.${requestPath}`);
  if (target !== resolvedRoot && !target.startsWith(resolvedRoot + path.sep)) {
    return null;
  }
  return target;
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} name page template name ('bouquet' | 'sent' | 'wilted')
 * @param {{mode:string, data?:object}} vars
 * @returns {Promise<string>}
 */
async function renderPage(name, vars) {
  const filePath = path.join(PAGES_DIR, `${name}.html`);
  const template = await readFile(filePath, 'utf8');
  const dataJson = JSON.stringify(vars.data ?? {}).replace(/</g, '\\u003c');
  const mode = vars.mode ?? 'rose';
  // Function replacers: a string replacement would expand `$'`, `$&`, `$``
  // patterns from user text (e.g. a message containing "$'") into template HTML.
  return template
    .replaceAll('{{MODE}}', () => mode)
    .replaceAll('{{DATA_JSON}}', () => dataJson);
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {object} body
 */
function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': buf.length,
  });
  res.end(buf);
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} html
 */
function sendHtml(res, status, html) {
  const buf = Buffer.from(html, 'utf8');
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': buf.length,
  });
  res.end(buf);
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<any>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    const MAX = 64 * 1024;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX) {
        reject(Object.assign(new Error('payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(Object.assign(new Error('invalid json'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

async function sendWilted(res, status = 404) {
  const html = await renderPage('wilted', { mode: 'rose' });
  sendHtml(res, status, html);
}

/**
 * @param {{dbPath?: string}} [opts]
 * @returns {import('node:http').Server}
 */
export function createServer(opts = {}) {
  const dbPath = opts.dbPath ?? DEFAULT_DB_PATH;
  const db = openDb(dbPath);

  const server = createHttpServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return sendHtml(res, 400, 'bad request');
      }
      const method = req.method || 'GET';

      // GET /
      if (method === 'GET' && pathname === '/') {
        const filePath = path.join(PAGES_DIR, 'create.html');
        if (!existsSync(filePath)) return sendHtml(res, 404, 'not found');
        const html = await readFile(filePath, 'utf8');
        return sendHtml(res, 200, html);
      }

      // GET /assets/*  -> app/dist/*
      if (method === 'GET' && pathname.startsWith('/assets/')) {
        const rel = pathname.slice('/assets'.length);
        const filePath = safeJoin(DIST_DIR, rel);
        if (!filePath || !existsSync(filePath)) return sendHtml(res, 404, 'not found');
        const buf = await readFile(filePath);
        res.writeHead(200, { 'content-type': contentTypeFor(filePath), 'content-length': buf.length });
        return res.end(buf);
      }

      // GET /styles/*
      if (method === 'GET' && pathname.startsWith('/styles/')) {
        const rel = pathname.slice('/styles'.length);
        const filePath = safeJoin(STYLES_DIR, rel);
        if (!filePath || !existsSync(filePath)) return sendHtml(res, 404, 'not found');
        const buf = await readFile(filePath);
        res.writeHead(200, { 'content-type': contentTypeFor(filePath), 'content-length': buf.length });
        return res.end(buf);
      }

      // POST /api/bouquet
      if (method === 'POST' && pathname === '/api/bouquet') {
        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return sendJson(res, err.statusCode === 413 ? 413 : 400, { error: 'invalid body' });
        }

        const mode = typeof body.mode === 'string' ? body.mode : '';
        const shape = typeof body.shape === 'string' && body.shape ? body.shape : DEFAULT_SHAPE;
        const rawMessage = typeof body.message === 'string' ? body.message : '';
        const rawFromName = typeof body.from_name === 'string' ? body.from_name : '';
        const replyOf = typeof body.reply_of === 'string' && body.reply_of ? body.reply_of : null;
        const clientNonce = typeof body.client_nonce === 'string' && body.client_nonce ? body.client_nonce : null;

        if (!MODE_IDS.includes(mode)) {
          return sendJson(res, 422, { error: 'invalid mode', field: 'mode' });
        }
        if (!SHAPE_IDS.includes(shape)) {
          return sendJson(res, 422, { error: 'invalid shape', field: 'shape' });
        }

        const message = normalise(rawMessage);
        if (message.length === 0 || graphemes(message) > MESSAGE_MAX) {
          return sendJson(res, 422, { error: 'invalid message', field: 'message' });
        }

        const fromName = rawFromName ? normalise(rawFromName) : '';
        if (fromName && graphemes(fromName) > NAME_MAX) {
          return sendJson(res, 422, { error: 'invalid from_name', field: 'from_name' });
        }

        if (replyOf && !isValidId(replyOf)) {
          return sendJson(res, 422, { error: 'invalid reply_of', field: 'reply_of' });
        }

        const id = makeId();
        const row = insertBouquet(db, {
          id,
          mode,
          shape,
          message,
          fromName: fromName || null,
          replyOf,
          clientNonce,
        });
        return sendJson(res, 201, { id: row.id, url: `/b/${row.id}` });
      }

      // GET /api/bouquet/:id/summary
      let m = pathname.match(/^\/api\/bouquet\/([^/]+)\/summary$/);
      if (method === 'GET' && m) {
        const row = getById(db, m[1]);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, { id: row.id, mode: row.mode, shape: row.shape, from_name: row.from_name });
      }

      // GET /api/bouquet/:id/status
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/status$/);
      if (method === 'GET' && m) {
        const row = getById(db, m[1]);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, { opened_at: row.opened_at, opens: row.opens });
      }

      // POST /api/open/:id
      m = pathname.match(/^\/api\/open\/([^/]+)$/);
      if (method === 'POST' && m) {
        try {
          await readJsonBody(req);
        } catch {
          // Body is ignored beyond parsing; malformed body still 204s.
        }
        markOpened(db, m[1]);
        res.writeHead(204);
        return res.end();
      }

      // GET /b/:id/sent
      m = pathname.match(/^\/b\/([^/]+)\/sent$/);
      if (method === 'GET' && m) {
        const row = getById(db, m[1]);
        if (!row) return sendWilted(res, 404);
        const mode = getMode(row.mode).id;
        const data = { id: row.id, mode: row.mode, shape: row.shape, from_name: row.from_name, url: `/b/${row.id}` };
        const html = await renderPage('sent', { mode, data });
        return sendHtml(res, 200, html);
      }

      // GET /b/:id
      m = pathname.match(/^\/b\/([^/]+)$/);
      if (method === 'GET' && m) {
        const row = getById(db, m[1]);
        if (!row) return sendWilted(res, 404);
        const mode = getMode(row.mode).id;
        const data = {
          id: row.id,
          mode: row.mode,
          shape: row.shape,
          message: row.message,
          from_name: row.from_name,
          reply_of: row.reply_of,
        };
        const html = await renderPage('bouquet', { mode, data });
        return sendHtml(res, 200, html);
      }

      return sendHtml(res, 404, 'not found');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return sendJson(res, 500, { error: 'internal error' });
    }
  });

  server.once('close', () => {
    try {
      db.close();
    } catch {
      // already closed
    }
  });

  return server;
}

/**
 * Print the local + LAN URLs a server is listening on.
 * @param {import('node:http').Server} server
 * @param {number} port
 */
function printUrls(server, port) {
  // eslint-disable-next-line no-console
  console.log(`bouquet dev server:`);
  // eslint-disable-next-line no-console
  console.log(`  local:  http://localhost:${port}/`);
  try {
    const nets = networkInterfaces();
    for (const ifaceList of Object.values(nets)) {
      for (const iface of ifaceList || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // eslint-disable-next-line no-console
          console.log(`  LAN:    http://${iface.address}:${port}/`);
        }
      }
    }
  } catch {
    // best-effort only
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const PORT = Number(process.env.PORT) || 4321;
  const HOST = process.env.HOST || '0.0.0.0';
  const server = createServer({});
  server.listen(PORT, HOST, () => printUrls(server, PORT));
}
