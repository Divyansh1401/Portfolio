/**
 * @file SQLite storage for bouquets, gifts, uploads and payments. Plain
 * SQLite (node:sqlite DatabaseSync) so the schema/queries port to D1 later
 * unchanged. All times are epoch SECONDS.
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** Every bouquet link lasts one year. */
export const LINK_LIFETIME_S = 365 * 24 * 3600;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bouquets (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'full',
  message TEXT NOT NULL,
  from_name TEXT,
  reply_of TEXT,
  client_nonce TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  opened_at INTEGER,
  opens INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  bouquet_id TEXT NOT NULL REFERENCES bouquets(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('photo','link','code','file')),
  label TEXT,
  url TEXT,
  code TEXT,
  upload_key TEXT,
  mime TEXT,
  bytes INTEGER,
  name TEXT
);
CREATE INDEX IF NOT EXISTS gifts_bouquet ON gifts(bouquet_id, pos);
CREATE TABLE IF NOT EXISTS uploads (
  key TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL,
  bouquet_id TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  bouquet_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'pretend',
  order_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created','paid','failed')),
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS payments_bouquet ON payments(bouquet_id);
`;

/** Columns added after the first release; added idempotently on open. */
const ADDED_COLUMNS = [
  ['status', "TEXT NOT NULL DEFAULT 'live'"],
  ['paid', 'INTEGER NOT NULL DEFAULT 0'],
  ['expires_at', 'INTEGER'],
  ['unlock_at', 'INTEGER'],
  ['unlock_label', 'TEXT'],
  ['secret_q', 'TEXT'],
  ['secret_hash', 'TEXT'],
  ['secret_salt', 'TEXT'],
];

/**
 * @param {string} dbPath file path or ':memory:'
 * @returns {import('node:sqlite').DatabaseSync}
 */
export function openDb(dbPath) {
  // A fresh checkout (or a reset: `rm -rf app/.data`) has no data folder;
  // SQLite will not create parent directories itself.
  if (dbPath !== ':memory:' && !dbPath.startsWith('file:')) {
    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  const have = new Set(db.prepare('PRAGMA table_info(bouquets)').all().map((c) => c.name));
  for (const [name, type] of ADDED_COLUMNS) {
    if (!have.has(name)) db.exec(`ALTER TABLE bouquets ADD COLUMN ${name} ${type}`);
  }
  db.exec("UPDATE bouquets SET expires_at = created_at + " + LINK_LIFETIME_S + " WHERE expires_at IS NULL");
  return db;
}

/**
 * @typedef {Object} BouquetRow
 * @property {string} id
 * @property {string} mode
 * @property {string} message
 * @property {string|null} from_name
 * @property {string|null} reply_of
 * @property {string|null} client_nonce
 * @property {number} created_at
 * @property {number|null} opened_at
 * @property {number} opens
 * @property {'draft'|'live'} status
 * @property {number} paid
 * @property {number} expires_at
 * @property {number|null} unlock_at
 * @property {string|null} unlock_label what the countdown is counting down to
 * @property {string|null} secret_q
 * @property {string|null} secret_hash
 * @property {string|null} secret_salt
 */

/**
 * Insert a bouquet (and its gifts, claiming their uploads) in one
 * transaction, or return the existing row if `clientNonce` already exists
 * (idempotent create).
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{id:string, mode:string, message:string, fromName?:?string, replyOf?:?string,
 *   clientNonce?:?string, status?:'draft'|'live', unlockAt?:?number,
 *   secret?:?{q:string, hash:string, salt:string}, gifts?:Array<object>, now?:number}} input
 * @returns {BouquetRow}
 */
export function insertBouquet(db, input) {
  const {
    id, mode, message, fromName = null, replyOf = null, clientNonce = null,
    status = 'live', unlockAt = null, unlockLabel = null, secret = null, gifts = [],
  } = input;
  const now = input.now ?? Math.floor(Date.now() / 1000);

  if (clientNonce) {
    const existing = getByNonce(db, clientNonce);
    if (existing) return existing;
  }

  db.exec('BEGIN');
  try {
    db.prepare(
      // shape is legacy (one design per flower now); written as 'full' so
      // databases created before the column got a default still accept rows.
      `INSERT INTO bouquets (id, mode, shape, message, from_name, reply_of, client_nonce, created_at,
         opened_at, opens, status, paid, expires_at, unlock_at, unlock_label, secret_q, secret_hash, secret_salt)
       VALUES (?, ?, 'full', ?, ?, ?, ?, ?, NULL, 0, ?, 0, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, mode, message, fromName, replyOf, clientNonce, now,
      status, now + LINK_LIFETIME_S, unlockAt, unlockAt ? unlockLabel : null,
      secret ? secret.q : null, secret ? secret.hash : null, secret ? secret.salt : null,
    );
    const insertGift = db.prepare(
      `INSERT INTO gifts (id, bouquet_id, pos, kind, label, url, code, upload_key, mime, bytes, name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const claim = db.prepare('UPDATE uploads SET bouquet_id = ? WHERE key = ? AND bouquet_id IS NULL');
    gifts.forEach((g, pos) => {
      insertGift.run(
        g.id, id, pos, g.kind, g.label ?? null, g.url ?? null, g.code ?? null,
        g.upload_key ?? null, g.mime ?? null, g.bytes ?? null, g.name ?? null,
      );
      if (g.upload_key) claim.run(id, g.upload_key);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    // Race: another request inserted the same nonce between our check and
    // insert. Return that row instead of failing.
    if (clientNonce && /UNIQUE constraint failed/i.test(String(err && err.message))) {
      const existing = getByNonce(db, clientNonce);
      if (existing) return existing;
    }
    throw err;
  }
  return getById(db, id);
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {BouquetRow|undefined}
 */
export function getById(db, id) {
  return db.prepare('SELECT * FROM bouquets WHERE id = ?').get(id);
}

/**
 * A bouquet anyone may see: live and not past its one-year lifetime.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {number} now epoch seconds
 * @returns {BouquetRow|undefined}
 */
export function getLive(db, id, now) {
  const row = getById(db, id);
  if (!row || row.status !== 'live') return undefined;
  if (row.expires_at && now >= row.expires_at) return undefined;
  return row;
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} clientNonce
 * @returns {BouquetRow|undefined}
 */
export function getByNonce(db, clientNonce) {
  return db.prepare('SELECT * FROM bouquets WHERE client_nonce = ?').get(clientNonce);
}

/** Live bouquets created so far — what the free-launch limit counts. */
export function countLive(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM bouquets WHERE status = 'live'").get().n;
}

/** @returns {Array<object>} gifts of a bouquet in order */
export function getGifts(db, bouquetId) {
  return db.prepare('SELECT * FROM gifts WHERE bouquet_id = ? ORDER BY pos').all(bouquetId);
}

export function getGift(db, bouquetId, giftId) {
  return db.prepare('SELECT * FROM gifts WHERE bouquet_id = ? AND id = ?').get(bouquetId, giftId);
}

export function insertUpload(db, { key, mime, bytes, name, now }) {
  db.prepare('INSERT INTO uploads (key, mime, bytes, name, created_at, bouquet_id) VALUES (?, ?, ?, ?, ?, NULL)')
    .run(key, mime, bytes, name ?? null, now);
}

export function getUpload(db, key) {
  return db.prepare('SELECT * FROM uploads WHERE key = ?').get(key);
}

/**
 * Mark a bouquet opened: sets opened_at if it was null, and always
 * increments opens. No-op (returns false) if the id does not exist.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {number} [now] epoch seconds
 * @returns {boolean}
 */
export function markOpened(db, id, now = Math.floor(Date.now() / 1000)) {
  const row = getById(db, id);
  if (!row || row.status !== 'live') return false;
  const openedAt = row.opened_at ?? now;
  db.prepare('UPDATE bouquets SET opened_at = ?, opens = opens + 1 WHERE id = ?').run(openedAt, id);
  return true;
}

// ---- payments ---------------------------------------------------------------

export function insertPayment(db, { id, bouquetId, orderId, amount, currency, now }) {
  db.prepare(
    `INSERT INTO payments (id, bouquet_id, provider, order_id, amount, currency, status, created_at)
     VALUES (?, ?, 'pretend', ?, ?, ?, 'created', ?)`,
  ).run(id, bouquetId, orderId, amount, currency, now);
}

export function getPaymentByOrder(db, orderId) {
  return db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
}

export function getPaidPayment(db, bouquetId) {
  return db
    .prepare("SELECT * FROM payments WHERE bouquet_id = ? AND status = 'paid' ORDER BY paid_at DESC LIMIT 1")
    .get(bouquetId);
}

/** Mark a payment paid and its draft bouquet live, atomically. */
export function markPaid(db, orderId, now) {
  const p = getPaymentByOrder(db, orderId);
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE order_id = ? AND status != 'paid'").run(now, orderId);
    // The year starts when the bouquet goes live, not when the draft was saved.
    db.prepare("UPDATE bouquets SET status = 'live', paid = 1, expires_at = ? WHERE id = ?")
      .run(now + LINK_LIFETIME_S, p.bouquet_id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function markFailed(db, orderId) {
  db.prepare("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'created'").run(orderId);
}

/** Switch a draft to the free flower and publish it. */
export function publishAsFree(db, id, mode, now = Math.floor(Date.now() / 1000)) {
  db.prepare("UPDATE bouquets SET mode = ?, status = 'live', expires_at = ? WHERE id = ? AND status = 'draft'")
    .run(mode, now + LINK_LIFETIME_S, id);
}

// ---- cleanup ------------------------------------------------------------------

/**
 * Delete drafts older than 24 h (with their gifts) and uploads that were
 * never claimed within 24 h. Returns the upload keys whose files should be
 * removed from disk.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {number} now epoch seconds
 * @returns {string[]}
 */
export function sweep(db, now) {
  const cutoff = now - 24 * 3600;
  const stale = db.prepare("SELECT id FROM bouquets WHERE status = 'draft' AND created_at < ?").all(cutoff);
  const keys = [];
  for (const { id } of stale) {
    for (const u of db.prepare('SELECT key FROM uploads WHERE bouquet_id = ?').all(id)) keys.push(u.key);
    db.prepare('DELETE FROM uploads WHERE bouquet_id = ?').run(id);
    db.prepare('DELETE FROM gifts WHERE bouquet_id = ?').run(id);
    db.prepare('DELETE FROM payments WHERE bouquet_id = ?').run(id);
    db.prepare('DELETE FROM bouquets WHERE id = ?').run(id);
  }
  for (const u of db.prepare('SELECT key FROM uploads WHERE bouquet_id IS NULL AND created_at < ?').all(cutoff)) {
    keys.push(u.key);
  }
  db.prepare('DELETE FROM uploads WHERE bouquet_id IS NULL AND created_at < ?').run(cutoff);
  return keys;
}
