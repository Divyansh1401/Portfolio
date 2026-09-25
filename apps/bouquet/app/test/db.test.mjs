import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  openDb, insertBouquet, getById, getByNonce, markOpened, getLive, countLive, getGifts,
  insertUpload, getUpload, insertPayment, markPaid, publishAsFree, sweep, LINK_LIFETIME_S,
} from '../server/db.js';

test('schema: bouquets table accepts a full row', () => {
  const db = openDb(':memory:');
  const row = insertBouquet(db, {
    id: 'AbCd1234',
    mode: 'rose',
    message: 'hello there',
    fromName: 'Divyansh',
    replyOf: null,
    clientNonce: 'nonce-1',
  });
  assert.equal(row.id, 'AbCd1234');
  assert.equal(row.mode, 'rose');
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
    message: 'hi',
    clientNonce: 'same-nonce',
  });
  const b = insertBouquet(db, {
    id: 'id000002',
    mode: 'sunflower',
    message: 'different',
    clientNonce: 'same-nonce',
  });
  assert.equal(a.id, b.id);
  assert.equal(b.mode, 'rose'); // returns the original row, not the new attempt
  db.close();
});

test('getByNonce finds an inserted row', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idnonce1', mode: 'rose', message: 'x', clientNonce: 'n1' });
  const row = getByNonce(db, 'n1');
  assert.equal(row.id, 'idnonce1');
  db.close();
});

test('markOpened sets opened_at once and increments opens each call', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idopen01', mode: 'rose', message: 'x' });

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

test('a live bouquet lasts one year; getLive hides it after that', () => {
  const db = openDb(':memory:');
  const row = insertBouquet(db, { id: 'idyear01', mode: 'rose', message: 'x', now: 1000 });
  assert.equal(row.expires_at, 1000 + LINK_LIFETIME_S);
  assert.ok(getLive(db, 'idyear01', 1000 + LINK_LIFETIME_S - 1));
  assert.equal(getLive(db, 'idyear01', 1000 + LINK_LIFETIME_S), undefined);
  db.close();
});

test('drafts are not live and do not count toward the free limit', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'iddraft1', mode: 'sunflower', message: 'x', status: 'draft', now: 10 });
  insertBouquet(db, { id: 'idlive01', mode: 'rose', message: 'x', now: 10 });
  assert.equal(getLive(db, 'iddraft1', 20), undefined);
  assert.equal(countLive(db), 1);
  db.close();
});

test('markPaid publishes the draft and starts its year at payment time', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idpay001', mode: 'lavender', message: 'x', status: 'draft', now: 100 });
  insertPayment(db, { id: 'pay1', bouquetId: 'idpay001', orderId: 'order_1', amount: 50, currency: 'INR', now: 100 });
  markPaid(db, 'order_1', 5000);
  const row = getById(db, 'idpay001');
  assert.equal(row.status, 'live');
  assert.equal(row.paid, 1);
  assert.equal(row.expires_at, 5000 + LINK_LIFETIME_S);
  db.close();
});

test('publishAsFree switches the flower to the free one and publishes', () => {
  const db = openDb(':memory:');
  insertBouquet(db, { id: 'idfree01', mode: 'marigold', message: 'x', status: 'draft', now: 100 });
  publishAsFree(db, 'idfree01', 'rose', 900);
  const row = getById(db, 'idfree01');
  assert.equal(row.mode, 'rose');
  assert.equal(row.status, 'live');
  assert.equal(row.expires_at, 900 + LINK_LIFETIME_S);
  db.close();
});

test('gifts are stored in order and claim their uploads', () => {
  const db = openDb(':memory:');
  insertUpload(db, { key: 'up1', mime: 'image/png', bytes: 10, name: 'a.png', now: 1 });
  insertBouquet(db, {
    id: 'idgift01', mode: 'rose', message: 'x', now: 2,
    gifts: [
      { id: 'g1', kind: 'photo', upload_key: 'up1', mime: 'image/png', bytes: 10, name: 'a.png' },
      { id: 'g2', kind: 'link', url: 'https://example.com/' },
    ],
  });
  assert.deepEqual(getGifts(db, 'idgift01').map((g) => g.id), ['g1', 'g2']);
  assert.equal(getUpload(db, 'up1').bouquet_id, 'idgift01');
  db.close();
});

test('sweep removes day-old drafts and unclaimed uploads, and returns their keys', () => {
  const db = openDb(':memory:');
  const day = 24 * 3600;
  insertUpload(db, { key: 'orphan', mime: 'image/png', bytes: 1, name: 'o.png', now: 0 });
  insertUpload(db, { key: 'drafted', mime: 'image/png', bytes: 1, name: 'd.png', now: 0 });
  insertUpload(db, { key: 'fresh', mime: 'image/png', bytes: 1, name: 'f.png', now: day });
  insertBouquet(db, {
    id: 'idold001', mode: 'sunflower', message: 'x', status: 'draft', now: 0,
    gifts: [{ id: 'g1', kind: 'photo', upload_key: 'drafted', mime: 'image/png', bytes: 1, name: 'd.png' }],
  });
  insertBouquet(db, { id: 'idkeep01', mode: 'rose', message: 'x', now: 0 });
  const keys = sweep(db, day + 10);
  assert.deepEqual(keys.sort(), ['drafted', 'orphan']);
  assert.equal(getById(db, 'idold001'), undefined);
  assert.ok(getById(db, 'idkeep01'), 'live bouquets are never swept');
  assert.ok(getUpload(db, 'fresh'), 'uploads younger than a day stay');
  db.close();
});
