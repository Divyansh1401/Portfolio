/**
 * @file Local HTTP server for the bouquet app. node:http on PORT (default
 * 4321), HOST 0.0.0.0. Plain SQLite storage (portable to D1 later).
 */

import { createServer as createHttpServer } from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync, mkdirSync, createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

import { MODE_IDS, getMode } from '../../packages/modes/modes.js';
import {
  AMOUNTS, DEFAULT_FREE_LIMIT, FREE_FLOWER, PAID_FLOWERS, isValidAmount, needsPayment,
} from '../../packages/pricing/pricing.js';
import {
  openDb, insertBouquet, getById, getLive, markOpened, countLive, getGifts, getGift,
  insertUpload, getUpload, insertPayment, getPaymentByOrder, getPaidPayment, markPaid,
  markFailed, publishAsFree, sweep,
} from './db.js';
import {
  LIMITS, randomKey, sniffType, safeName, validateGifts, validateUnlock, validateUnlockLabel, validateSecret,
  checkAnswer, createTokenSigner, createLimiter,
} from './gifts.js';
import { makeId, isValidId } from './ids.js';
import { normalise, graphemes } from './text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(APP_DIR, 'pages');
const DIST_DIR = path.join(APP_DIR, 'dist');
const STYLES_DIR = path.join(APP_DIR, 'styles');
const DEFAULT_DB_PATH = path.join(APP_DIR, '.data', 'bouquet.sqlite');
const DEFAULT_UPLOAD_DIR = path.join(APP_DIR, '.data', 'uploads');

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
 * Read a raw request body up to `max` bytes.
 * @param {import('node:http').IncomingMessage} req
 * @param {number} max
 * @returns {Promise<Buffer>}
 */
function readRawBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > max) {
        done = true;
        reject(Object.assign(new Error('payload too large'), { statusCode: 413 }));
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!done) resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      if (!done) reject(err);
    });
  });
}

function clientIp(req) {
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

/**
 * The recipient-safe view of a bouquet. While locked (by date or by a
 * secret question) the note and gifts are NOT included at all.
 * @param {object} row
 * @param {object[]} gifts
 * @param {{unlocked: boolean, token?: string|null, now: number}} opts
 */
function publicData(row, gifts, { unlocked, token = null, now }) {
  return {
    id: row.id,
    mode: row.mode,
    from_name: row.from_name,
    reply_of: row.reply_of,
    locked: {
      until: row.unlock_at && now < row.unlock_at ? row.unlock_at : null,
      label: row.unlock_at && now < row.unlock_at ? row.unlock_label || null : null,
      secret: row.secret_q || null,
    },
    server_now: now,
    content: unlocked ? contentOf(row, gifts, token) : null,
  };
}

function contentOf(row, gifts, token) {
  return {
    message: row.message,
    token,
    gifts: gifts.map((g) => {
      const out = { id: g.id, kind: g.kind, label: g.label };
      if (g.kind === 'link') out.url = g.url;
      if (g.kind === 'code') {
        out.code = g.code;
        out.url = g.url;
      }
      if (g.kind === 'photo' || g.kind === 'file') {
        out.mime = g.mime;
        out.bytes = g.bytes;
        out.name = g.name;
        out.src = `/api/bouquet/${row.id}/gift/${g.id}`;
      }
      return out;
    }),
  };
}

/** Escape a TEXT value for an iCalendar line (RFC 5545 §3.3.11). */
function icsText(s) {
  return String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/[\r\n]+/g, ' ');
}

function timeLocked(row, now) {
  return !!(row.unlock_at && now < row.unlock_at);
}

/**
 * @param {{dbPath?: string, uploadDir?: string, now?: () => number,
 *   freeLimit?: number, secret?: string}} [opts]
 *   `now` returns epoch SECONDS (injectable for tests).
 * @returns {import('node:http').Server}
 */
export function createServer(opts = {}) {
  const dbPath = opts.dbPath ?? DEFAULT_DB_PATH;
  const uploadDir = opts.uploadDir ?? DEFAULT_UPLOAD_DIR;
  const nowSec = opts.now ?? (() => Math.floor(Date.now() / 1000));
  const envLimit = Number(process.env.BQ_FREE_LIMIT);
  const freeLimit = opts.freeLimit ?? (Number.isFinite(envLimit) && envLimit >= 0 ? envLimit : DEFAULT_FREE_LIMIT);
  const db = openDb(dbPath);
  mkdirSync(uploadDir, { recursive: true });

  const tokens = createTokenSigner(opts.secret);
  const uploadLimiter = createLimiter({ max: 40, windowS: 600 });
  const answerLimiter = createLimiter({ max: 5, windowS: 600 });

  async function runSweep() {
    for (const key of sweep(db, nowSec())) {
      await unlink(path.join(uploadDir, key)).catch(() => {});
    }
  }
  runSweep().catch(() => {});
  const sweepTimer = setInterval(() => runSweep().catch(() => {}), 3600 * 1000);
  sweepTimer.unref();

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
      const now = nowSec();

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

      // GET /api/pricing
      if (method === 'GET' && pathname === '/api/pricing') {
        const liveCount = countLive(db);
        return sendJson(res, 200, {
          freeFlower: FREE_FLOWER,
          paidFlowers: PAID_FLOWERS,
          freeLimit,
          liveCount,
          freeRemaining: Math.max(0, freeLimit - liveCount),
          amounts: AMOUNTS,
        });
      }

      // POST /api/upload  (raw body; type decided by magic bytes)
      if (method === 'POST' && pathname === '/api/upload') {
        const wait = uploadLimiter.hit(clientIp(req), now);
        if (wait) {
          res.setHeader('retry-after', String(wait));
          return sendJson(res, 429, { error: 'too many uploads, try again soon' });
        }
        let buf;
        try {
          buf = await readRawBody(req, LIMITS.fileBytes);
        } catch (err) {
          if (err.statusCode === 413) return sendJson(res, 413, { error: 'that file is larger than 10 MB' });
          throw err;
        }
        const mime = sniffType(buf);
        if (!mime) return sendJson(res, 415, { error: 'only JPEG, PNG, WebP images and PDFs can be added' });
        const key = randomKey(22);
        await writeFile(path.join(uploadDir, key), buf);
        let name = null;
        try {
          name = safeName(decodeURIComponent(String(req.headers['x-filename'] || '')), null) || null;
        } catch {
          name = null;
        }
        insertUpload(db, { key, mime, bytes: buf.length, name, now });
        return sendJson(res, 201, { key, mime, bytes: buf.length });
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
        const rawMessage = typeof body.message === 'string' ? body.message : '';
        const rawFromName = typeof body.from_name === 'string' ? body.from_name : '';
        const replyOf = typeof body.reply_of === 'string' && body.reply_of ? body.reply_of : null;
        const clientNonce = typeof body.client_nonce === 'string' && body.client_nonce ? body.client_nonce : null;

        if (!MODE_IDS.includes(mode)) {
          return sendJson(res, 422, { error: 'invalid flower', field: 'mode' });
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
        const gifts = validateGifts(body.gifts, (k) => getUpload(db, k));
        if (!gifts.ok) return sendJson(res, 422, { error: gifts.error, field: 'gifts' });
        const unlock = validateUnlock(body.unlock_at, now);
        if (!unlock.ok) return sendJson(res, 422, { error: unlock.error, field: 'unlock_at' });
        const unlockLabel = validateUnlockLabel(body.unlock_label);
        if (!unlockLabel.ok) return sendJson(res, 422, { error: unlockLabel.error, field: 'unlock_label' });
        const secret = validateSecret(body.secret);
        if (!secret.ok) return sendJson(res, 422, { error: secret.error, field: 'secret' });

        // An idempotent retry returns what the first request made.
        if (clientNonce) {
          const existing = db.prepare('SELECT * FROM bouquets WHERE client_nonce = ?').get(clientNonce);
          if (existing) return respondCreated(res, existing);
        }

        const pay = needsPayment({ mode, liveCount: countLive(db), freeLimit });
        const row = insertBouquet(db, {
          id: makeId(),
          mode,
          message,
          fromName: fromName || null,
          replyOf,
          clientNonce,
          status: pay ? 'draft' : 'live',
          unlockAt: unlock.value,
          unlockLabel: unlockLabel.value,
          secret: secret.value,
          gifts: gifts.gifts,
          now,
        });
        return respondCreated(res, row);
      }

      function respondCreated(res2, row) {
        if (row.status === 'live') return sendJson(res2, 201, { id: row.id, url: `/b/${row.id}` });
        // 202, not 402: the draft IS saved, it just isn't published until
        // paid (and a 402 prints a console error in every browser).
        const reason = row.mode === FREE_FLOWER ? 'free_limit_reached' : 'paid_flower';
        return sendJson(res2, 202, { draft_id: row.id, needs_payment: true, reason });
      }

      // POST /api/checkout/:id  {currency, amount}  (pretend provider)
      let m = pathname.match(/^\/api\/checkout\/([^/]+)$/);
      if (method === 'POST' && m) {
        const row = getById(db, m[1]);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        if (row.status === 'live') return sendJson(res, 409, { error: 'already paid', id: row.id, url: `/b/${row.id}` });
        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          return sendJson(res, 400, { error: 'invalid body' });
        }
        const currency = body.currency;
        const amount = Number(body.amount);
        if (!isValidAmount(currency, amount)) return sendJson(res, 422, { error: 'pick one of the amounts', field: 'amount' });
        const orderId = `order_${randomKey(16)}`;
        insertPayment(db, { id: randomKey(16), bouquetId: row.id, orderId, amount, currency, now });
        return sendJson(res, 201, { order_id: orderId, amount, currency, provider: 'pretend' });
      }

      // POST /api/checkout/:id/confirm  {order_id, outcome}  (pretend webhook)
      m = pathname.match(/^\/api\/checkout\/([^/]+)\/confirm$/);
      if (method === 'POST' && m) {
        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          return sendJson(res, 400, { error: 'invalid body' });
        }
        const payment = getPaymentByOrder(db, String(body.order_id || ''));
        if (!payment || payment.bouquet_id !== m[1]) return sendJson(res, 404, { error: 'unknown order' });
        if (payment.status === 'paid') return sendJson(res, 200, { id: m[1], url: `/b/${m[1]}` });
        if (body.outcome === 'failed') {
          markFailed(db, payment.order_id);
          return sendJson(res, 200, { status: 'failed' });
        }
        if (body.outcome !== 'paid' || payment.status !== 'created') return sendJson(res, 409, { error: 'order cannot be paid' });
        markPaid(db, payment.order_id, now);
        return sendJson(res, 200, { id: m[1], url: `/b/${m[1]}` });
      }

      // POST /api/bouquet/:id/as-rose  (draft -> free flower, while it is free)
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/as-rose$/);
      if (method === 'POST' && m) {
        const row = getById(db, m[1]);
        if (!row || row.status !== 'draft') return sendJson(res, 409, { error: 'not a draft' });
        if (needsPayment({ mode: FREE_FLOWER, liveCount: countLive(db), freeLimit })) {
          return sendJson(res, 409, { error: 'Rose is no longer free' });
        }
        publishAsFree(db, row.id, FREE_FLOWER, now);
        return sendJson(res, 200, { id: row.id, url: `/b/${row.id}` });
      }

      // GET /api/bouquet/:id/summary
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/summary$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, { id: row.id, mode: row.mode, from_name: row.from_name });
      }

      // GET /api/bouquet/:id/status  (sender's view on the sent page)
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/status$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        const pay = row.paid ? getPaidPayment(db, row.id) : null;
        return sendJson(res, 200, {
          opened_at: row.opened_at,
          opens: row.opens,
          unlock_at: row.unlock_at,
          unlock_label: row.unlock_label || null,
          has_secret: !!row.secret_q,
          gift_count: getGifts(db, row.id).length,
          expires_at: row.expires_at,
          paid: !!row.paid,
          payment: pay
            ? { amount: pay.amount, currency: pay.currency, paid_at: pay.paid_at, order_id: pay.order_id }
            : null,
        });
      }

      // POST /api/bouquet/:id/unlock  {answer?}
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/unlock$/);
      if (method === 'POST' && m) {
        const row = getLive(db, m[1], now);
        if (!row) return sendJson(res, 404, { error: 'not found' });
        if (timeLocked(row, now)) {
          res.setHeader('retry-after', String(row.unlock_at - now));
          return sendJson(res, 425, { error: 'not yet', until: row.unlock_at, server_now: now });
        }
        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          return sendJson(res, 400, { error: 'invalid body' });
        }
        if (row.secret_q) {
          const key = `${row.id}|${clientIp(req)}`;
          const wait = answerLimiter.peek(key, now);
          if (wait) {
            res.setHeader('retry-after', String(wait));
            return sendJson(res, 429, { error: 'too many tries', retry_after: wait });
          }
          if (!checkAnswer(row, body.answer)) {
            answerLimiter.hit(key, now);
            // 200, not 401: a wrong answer is an ordinary outcome, and a 4xx
            // prints a console error in every browser.
            return sendJson(res, 200, { wrong: true });
          }
        }
        const token = tokens.issue(row.id, now);
        return sendJson(res, 200, { content: contentOf(row, getGifts(db, row.id), token) });
      }

      // GET /api/bouquet/:id/gift/:giftId
      m = pathname.match(/^\/api\/bouquet\/([^/]+)\/gift\/([^/]+)$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        const gift = row ? getGift(db, row.id, m[2]) : undefined;
        const allowed = row && gift && gift.upload_key && !timeLocked(row, now)
          && (!row.secret_q || tokens.verify(row.id, url.searchParams.get('t'), now));
        if (!allowed) return sendJson(res, 404, { error: 'not found' });
        const filePath = path.join(uploadDir, gift.upload_key);
        if (!existsSync(filePath)) return sendJson(res, 404, { error: 'not found' });
        const name = safeName(gift.name, gift.mime === 'application/pdf' ? 'ticket.pdf' : 'photo');
        const download = url.searchParams.get('download') === '1';
        res.writeHead(200, {
          'content-type': gift.mime,
          'content-length': statSync(filePath).size,
          'x-content-type-options': 'nosniff',
          'content-security-policy': "default-src 'none'; sandbox",
          'cache-control': 'private, max-age=3600',
          'content-disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
        });
        return createReadStream(filePath).pipe(res);
      }

      // POST /api/open/:id
      m = pathname.match(/^\/api\/open\/([^/]+)$/);
      if (method === 'POST' && m) {
        try {
          await readJsonBody(req);
        } catch {
          // Body is ignored beyond parsing; malformed body still 204s.
        }
        const row = getLive(db, m[1], now);
        if (row && !timeLocked(row, now)) markOpened(db, m[1], now);
        res.writeHead(204);
        return res.end();
      }

      // GET /b/:id/calendar.ics
      m = pathname.match(/^\/b\/([^/]+)\/calendar\.ics$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        if (!row || !row.unlock_at) return sendHtml(res, 404, 'not found');
        const stamp = (t) => new Date(t * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const host = req.headers.host || 'localhost';
        const ics = [
          'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bouquet//EN', 'BEGIN:VEVENT',
          `UID:${row.id}@bouquet`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(row.unlock_at)}`,
          `DTEND:${stamp(row.unlock_at + 900)}`, `SUMMARY:${icsText(row.unlock_label ? `Open your bouquet: ${row.unlock_label}` : 'Open your bouquet')}`,
          `URL:http://${host}/b/${row.id}`, 'END:VEVENT', 'END:VCALENDAR', '',
        ].join('\r\n');
        res.writeHead(200, {
          'content-type': 'text/calendar; charset=utf-8',
          'content-disposition': 'attachment; filename="bouquet.ics"',
        });
        return res.end(ics);
      }

      // GET /b/:id/sent
      m = pathname.match(/^\/b\/([^/]+)\/sent$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        if (!row) return sendWilted(res, 404);
        const mode = getMode(row.mode).id;
        const data = { id: row.id, mode: row.mode, from_name: row.from_name, url: `/b/${row.id}` };
        const html = await renderPage('sent', { mode, data });
        return sendHtml(res, 200, html);
      }

      // GET /b/:id
      m = pathname.match(/^\/b\/([^/]+)$/);
      if (method === 'GET' && m) {
        const row = getLive(db, m[1], now);
        if (!row) return sendWilted(res, 404);
        const mode = getMode(row.mode).id;
        const unlocked = !timeLocked(row, now) && !row.secret_q;
        const data = publicData(row, unlocked ? getGifts(db, row.id) : [], { unlocked, now });
        const html = await renderPage('bouquet', { mode, data });
        return sendHtml(res, 200, html);
      }

      return sendHtml(res, 404, 'not found');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      if (!res.headersSent) return sendJson(res, 500, { error: 'internal error' });
      res.end();
    }
  });

  server.once('close', () => {
    clearInterval(sweepTimer);
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
