import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, insertBouquet, getById, getByNonce, markOpened } from '../server/db.js';

test('schema: bouquets table accepts a full row', () => {
  const db = openDb(':memory:');
  const row = insertBouquet(db, {
    id: 'AbCd1234',
    mode: 'rose',
    shape: 'full',
    message: 'hello there',
    fromName: 'Divyansh',
    replyOf: null,
    clientNonce: 'nonce-1',
  });
  assert.equal(row.id, 'AbCd1234');
  assert.equal(row.mode, 'rose');
  assert.equal(row.shape, 'full');
  assert.equal(row.message, 'hello there');
  assert.equal(row.from_name, 'Divyansh');
  assert.equal(row.opened_at, null);
  assert.equal(row.opens, 0);
  assert.equal(typeof row.created_at, 'number');
  db.close();
});

test('getById returns undefined for missing id', () => {
  const db = openDb(':memory:');
  assert.equal(getById(db, 'nopenope'), undefined);
  db.close();
});

test('insertBouquet is idempotent on client_nonce', () => {
  const db = openDb(':memory:');
  const a = insertBouquet(db, {
    id: 'id000001',
    mode: 'rose',
    shape: 'full',
    message: 'hi',
    clientNonce: 'same-nonce',
  });
  const b = insertBouquet(db, {
    id: 'id000002',
    mode: 'sunflower',
    shape: 'posy',
    message: 'different',
    clientNonce: 'same-nonce',
  });
  assert.equal(a.id, b.id);
  assert.equal(b.mode, 'rose'); // returns the original row, not the new attempt
  db.close();
});

test('getByNonce finds an inserted row', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idnonce1', mode: 'rose', shape: 'full', message: 'x', clientNonce: 'n1' });
  const row = getByNonce(db, 'n1');
  assert.equal(row.id, 'idnonce1');
  db.close();
});

test('markOpened sets opened_at once and increments opens each call', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idopen01', mode: 'rose', shape: 'full', message: 'x' });

  assert.equal(markOpened(db, 'idopen01'), true);
  const first = getById(db, 'idopen01');
  assert.equal(first.opens, 1);
  assert.notEqual(first.opened_at, null);

  assert.equal(markOpened(db, 'idopen01'), true);
  const second = getById(db, 'idopen01');
  assert.equal(second.opens, 2);
  assert.equal(second.opened_at, first.opened_at); // unchanged on later opens

  db.close();
});

test('markOpened returns false for unknown id', () => {
  const db = openDb(':memory:');
  assert.equal(markOpened(db, 'ghost001'), false);
  db.close();
});

test('openDb creates a missing parent folder (fresh checkout / rm -rf app/.data)', async () => {
  const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'bq-db-'));
  try {
    const file = join(dir, 'nested', '.data', 'bouquet.sqlite');
    const db = openDb(file);
    db.close();
    assert.ok(existsSync(file));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
