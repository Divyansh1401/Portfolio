import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../server/index.js';

// Pricing, pretend checkout, gifts, uploads, the open-on-date lock and the
// secret question. The clock is injected so locks can be tested without
// waiting.

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function start(opts = {}) {
  const uploadDir = mkdtempSync(path.join(tmpdir(), 'bq-up-'));
  const clock = { t: 1_800_000_000 };
  const server = createServer({ dbPath: ':memory:', uploadDir, now: () => clock.t, ...opts });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    clock,
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      rmSync(uploadDir, { recursive: true, force: true });
    },
  };
}

async function post(base, p, payload) {
  const res = await fetch(`${base}${p}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  return { status: res.status, body: await res.json().catch(() => ({})), headers: res.headers };
}

async function upload(base, buf, name) {
  const res = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream', 'x-filename': encodeURIComponent(name) },
    body: buf,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test('GET /api/pricing: Rose free with the launch allowance; four paid flowers; both currencies', async () => {
  const s = await start({ freeLimit: 3 });
  try {
    const r = await (await fetch(`${s.base}/api/pricing`)).json();
    assert.equal(r.freeFlower, 'rose');
    assert.deepEqual([...r.paidFlowers].sort(), ['hydrangea', 'lavender', 'marigold', 'sunflower']);
    assert.equal(r.freeLimit, 3);
    assert.equal(r.freeRemaining, 3);
    assert.deepEqual(r.amounts.INR, [30, 50, 100, 150]);
    assert.deepEqual(r.amounts.USD, [2, 5, 10, 15]);
  } finally {
    await s.stop();
  }
});

test('checkout: a failed payment keeps the draft; paying publishes it; confirm is idempotent', async () => {
  const s = await start();
  try {
    const draft = await post(s.base, '/api/bouquet', { mode: 'sunflower', message: 'for you' });
    assert.equal(draft.status, 202);
    const id = draft.body.draft_id;

    const bad = await post(s.base, `/api/checkout/${id}`, { currency: 'INR', amount: 42 });
    assert.equal(bad.status, 422, 'only the four listed amounts are accepted');

    const o1 = await post(s.base, `/api/checkout/${id}`, { currency: 'INR', amount: 100 });
    assert.equal(o1.status, 201);
    assert.equal(o1.body.provider, 'pretend');
    const fail = await post(s.base, `/api/checkout/${id}/confirm`, { order_id: o1.body.order_id, outcome: 'failed' });
    assert.equal(fail.body.status, 'failed');
    assert.equal((await fetch(`${s.base}/b/${id}`)).status, 404, 'still a draft after a failed payment');

    const o2 = await post(s.base, `/api/checkout/${id}`, { currency: 'USD', amount: 5 });
    const paid = await post(s.base, `/api/checkout/${id}/confirm`, { order_id: o2.body.order_id, outcome: 'paid' });
    assert.equal(paid.status, 200);
    assert.equal(paid.body.id, id);
    const again = await post(s.base, `/api/checkout/${id}/confirm`, { order_id: o2.body.order_id, outcome: 'paid' });
    assert.equal(again.status, 200, 'confirming twice is harmless');

    assert.equal((await fetch(`${s.base}/b/${id}`)).status, 200);
    const status = await (await fetch(`${s.base}/api/bouquet/${id}/status`)).json();
    assert.deepEqual({ amount: status.payment.amount, currency: status.payment.currency }, { amount: 5, currency: 'USD' });

    const late = await post(s.base, `/api/checkout/${id}`, { currency: 'INR', amount: 30 });
    assert.equal(late.status, 409, 'a live bouquet cannot be paid for again');
  } finally {
    await s.stop();
  }
});

test('free limit: after N live bouquets Rose needs payment too; send-as-Rose is refused then', async () => {
  const s = await start({ freeLimit: 1 });
  try {
    const first = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'one' });
    assert.equal(first.status, 201);
    const second = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'two' });
    assert.equal(second.status, 202);
    assert.equal(second.body.reason, 'free_limit_reached');

    const lav = await post(s.base, '/api/bouquet', { mode: 'lavender', message: 'three' });
    const asRose = await post(s.base, `/api/bouquet/${lav.body.draft_id}/as-rose`);
    assert.equal(asRose.status, 409);
  } finally {
    await s.stop();
  }
});

test('send-as-Rose publishes a paid-flower draft as Rose while Rose is free', async () => {
  const s = await start();
  try {
    const d = await post(s.base, '/api/bouquet', { mode: 'marigold', message: 'x' });
    const r = await post(s.base, `/api/bouquet/${d.body.draft_id}/as-rose`);
    assert.equal(r.status, 200);
    const summary = await (await fetch(`${s.base}/api/bouquet/${r.body.id}/summary`)).json();
    assert.equal(summary.mode, 'rose');
  } finally {
    await s.stop();
  }
});

test('uploads: sniffed by content, not name; unknown bytes are refused', async () => {
  const s = await start();
  try {
    const ok = await upload(s.base, PNG, 'photo.jpg');
    assert.equal(ok.status, 201);
    assert.equal(ok.body.mime, 'image/png', 'type comes from the bytes, not the .jpg name');
    const bad = await upload(s.base, Buffer.from('<html><script>alert(1)</script></html>'), 'x.png');
    assert.equal(bad.status, 415);
  } finally {
    await s.stop();
  }
});

test('gifts: validated on create; a used upload key cannot be reused', async () => {
  const s = await start();
  try {
    const up = await upload(s.base, PNG, 'a.png');
    const gifts = [
      { kind: 'photo', upload_key: up.body.key },
      { kind: 'link', url: 'https://example.com/playlist', label: 'Our playlist' },
      { kind: 'code', label: 'Gift card', code: 'ABCD-1234', url: 'https://example.com/redeem' },
    ];
    const r = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'gifts', gifts });
    assert.equal(r.status, 201);
    const status = await (await fetch(`${s.base}/api/bouquet/${r.body.id}/status`)).json();
    assert.equal(status.gift_count, 3);

    const reuse = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'again', gifts: [gifts[0]] });
    assert.equal(reuse.status, 422);
    assert.equal(reuse.body.field, 'gifts');

    const http = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'x', gifts: [{ kind: 'link', url: 'http://example.com' }] });
    assert.equal(http.status, 422, 'links must be https');
    const js = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'x', gifts: [{ kind: 'link', url: 'javascript:alert(1)' }] });
    assert.equal(js.status, 422);
    const nine = Array.from({ length: 9 }, () => ({ kind: 'link', url: 'https://example.com' }));
    assert.equal((await post(s.base, '/api/bouquet', { mode: 'rose', message: 'x', gifts: nine })).status, 422);
  } finally {
    await s.stop();
  }
});

test('open-on-date: nothing locked is in the page; unlock is 425 until the time, then 200', async () => {
  const s = await start();
  try {
    const up = await upload(s.base, PNG, 'a.png');
    const until = s.clock.t + 3600;
    const r = await post(s.base, '/api/bouquet', {
      mode: 'rose',
      message: 'TOP-SECRET-NOTE',
      unlock_at: until,
      unlock_label: 'Your birthday; party, cake',
      gifts: [{ kind: 'code', code: 'CODE-XYZ' }, { kind: 'photo', upload_key: up.body.key }],
    });
    assert.equal(r.status, 201);
    const id = r.body.id;

    const html = await (await fetch(`${s.base}/b/${id}`)).text();
    assert.equal(html.includes('TOP-SECRET-NOTE'), false, 'the note must not be in a locked page');
    assert.equal(html.includes('CODE-XYZ'), false, 'gift codes must not be in a locked page');

    const early = await post(s.base, `/api/bouquet/${id}/unlock`);
    assert.equal(early.status, 425);
    assert.equal(early.body.until, until);
    assert.equal(early.headers.get('retry-after'), '3600');
    assert.equal((await post(s.base, `/api/open/${id}`, { kind: 'input' })).status, 204);
    assert.equal((await (await fetch(`${s.base}/api/bouquet/${id}/status`)).json()).opened_at, null, 'opening early is not counted');

    assert.match(html, /Your birthday; party, cake/, 'the occasion is shown with the countdown');
    const ics = await fetch(`${s.base}/b/${id}/calendar.ics`);
    assert.match(ics.headers.get('content-type') || '', /text\/calendar/);
    assert.match(await ics.text(), /SUMMARY:Open your bouquet: Your birthday\\; party\\, cake/, 'ICS text is escaped');
    const st = await (await fetch(`${s.base}/api/bouquet/${id}/status`)).json();
    assert.equal(st.unlock_label, 'Your birthday; party, cake');
    const long = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'x', unlock_at: until, unlock_label: 'x'.repeat(41) });
    assert.equal(long.status, 422);
    assert.equal(long.body.field, 'unlock_label');

    s.clock.t = until;
    const open = await post(s.base, `/api/bouquet/${id}/unlock`);
    assert.equal(open.status, 200);
    assert.equal(open.body.content.message, 'TOP-SECRET-NOTE');
    const photo = open.body.content.gifts.find((g) => g.kind === 'photo');
    const img = await fetch(`${s.base}${photo.src}`);
    assert.equal(img.status, 200, 'no secret, so after the date the photo needs no token');
    assert.equal(img.headers.get('x-content-type-options'), 'nosniff');
  } finally {
    await s.stop();
  }
});

test('secret question: answer is normalised, wrong answers are rate limited, files need the token', async () => {
  const s = await start();
  try {
    const up = await upload(s.base, PNG, 'a.png');
    const r = await post(s.base, '/api/bouquet', {
      mode: 'rose',
      message: 'hidden note',
      secret: { question: 'Where did we meet?', answer: 'Pune' },
      gifts: [{ kind: 'photo', upload_key: up.body.key }],
    });
    const id = r.body.id;
    const page = await (await fetch(`${s.base}/b/${id}`)).text();
    assert.equal(page.includes('hidden note'), false);
    assert.match(page, /Where did we meet\?/);

    const wrong = await post(s.base, `/api/bouquet/${id}/unlock`, { answer: 'Mumbai' });
    assert.equal(wrong.status, 200);
    assert.equal(wrong.body.wrong, true);
    assert.equal(wrong.body.content, undefined);

    const right = await post(s.base, `/api/bouquet/${id}/unlock`, { answer: '  pUNE ' });
    assert.equal(right.body.content.message, 'hidden note');
    const photo = right.body.content.gifts[0];
    assert.equal((await fetch(`${s.base}${photo.src}`)).status, 404, 'no token, no file');
    assert.equal((await fetch(`${s.base}${photo.src}?t=1.forged`)).status, 404);
    const ok = await fetch(`${s.base}${photo.src}?t=${encodeURIComponent(right.body.content.token)}`);
    assert.equal(ok.status, 200);

    for (let i = 0; i < 5; i++) await post(s.base, `/api/bouquet/${id}/unlock`, { answer: 'nope' });
    const limited = await post(s.base, `/api/bouquet/${id}/unlock`, { answer: 'Pune' });
    assert.equal(limited.status, 429, 'too many wrong answers lock it for a while, even for the right answer');
  } finally {
    await s.stop();
  }
});

test('expiry: a bouquet is gone after a year', async () => {
  const s = await start();
  try {
    const r = await post(s.base, '/api/bouquet', { mode: 'rose', message: 'x' });
    s.clock.t += 365 * 24 * 3600;
    assert.equal((await fetch(`${s.base}/b/${r.body.id}`)).status, 404);
  } finally {
    await s.stop();
  }
});
