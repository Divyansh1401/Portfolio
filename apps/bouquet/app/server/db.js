/**
 * @file SQLite storage for bouquets. Plain SQLite (node:sqlite
 * DatabaseSync) so the schema/queries port to D1 later unchanged.
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bouquets (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  shape TEXT NOT NULL,
  message TEXT NOT NULL,
  from_name TEXT,
  reply_of TEXT,
  client_nonce TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  opened_at INTEGER,
  opens INTEGER NOT NULL DEFAULT 0
);
`;

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
  db.exec(SCHEMA);
  return db;
}

/**
 * @typedef {Object} BouquetRow
 * @property {string} id
 * @property {string} mode
 * @property {string} shape
 * @property {string} message
 * @property {string|null} from_name
 * @property {string|null} reply_of
 * @property {string|null} client_nonce
 * @property {number} created_at
 * @property {number|null} opened_at
 * @property {number} opens
 */

/**
 * Insert a bouquet, or return the existing row if `client_nonce` already
 * exists (idempotent create).
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{id:string, mode:string, shape:string, message:string, fromName:?string, replyOf:?string, clientNonce:?string}} input
 * @returns {BouquetRow}
 */
export function insertBouquet(db, input) {
  const { id, mode, shape, message, fromName = null, replyOf = null, clientNonce = null } = input;

  if (clientNonce) {
    const existing = getByNonce(db, clientNonce);
    if (existing) return existing;
  }

  const createdAt = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(
    `INSERT INTO bouquets (id, mode, shape, message, from_name, reply_of, client_nonce, created_at, opened_at, opens)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)`
  );
  try {
    stmt.run(id, mode, shape, message, fromName, replyOf, clientNonce, createdAt);
  } catch (err) {
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
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} clientNonce
 * @returns {BouquetRow|undefined}
 */
export function getByNonce(db, clientNonce) {
  return db.prepare('SELECT * FROM bouquets WHERE client_nonce = ?').get(clientNonce);
}

/**
 * Mark a bouquet opened: sets opened_at (epoch seconds) if it was null, and
 * always increments opens. No-op (returns false) if the id does not exist.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {boolean}
 */
export function markOpened(db, id) {
  const row = getById(db, id);
  if (!row) return false;
  const openedAt = row.opened_at ?? Math.floor(Date.now() / 1000);
  db.prepare('UPDATE bouquets SET opened_at = ?, opens = opens + 1 WHERE id = ?').run(openedAt, id);
  return true;
}
