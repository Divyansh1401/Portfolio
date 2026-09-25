import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(__dirname, '..', 'pages');

// pages/create.html, bouquet.html, sent.html are owned by parallel tasks
// (client/pages work); if they are not present yet, the tests that exercise
// them are skipped rather than failed, so this suite stays green regardless
// of build order.
const HAS_CREATE = existsSync(path.join(PAGES_DIR, 'create.html'));
const HAS_BOUQUET_PAGE = existsSync(path.join(PAGES_DIR, 'bouquet.html'));
const HAS_SENT_PAGE = existsSync(path.join(PAGES_DIR, 'sent.html'));

/**
 * @returns {Promise<{server: import('node:http').Server, base: string}>}
 */
async function startServer() {
  const server = createServer({ dbPath: ':memory:' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

/**
 * @param {import('node:http').Server} server
 */
function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('GET / serves create.html when present', { skip: !HAS_CREATE && 'app/pages/create.html not built yet' }, async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
  } finally {
    await stopServer(server);
  }
});

test('GET /b/:id for an unknown id returns 404 wilted page', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/b/nopenope`);
    assert.equal(res.status, 404);
    const body = await res.text();
    assert.match(body, /wilted/i);
  } finally {
    await stopServer(server);
  }
});

test('GET /b/:id/sent for an unknown id returns 404 wilted page', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/b/nopenope/sent`);
    assert.equal(res.status, 404);
    const body = await res.text();
    assert.match(body, /wilted/i);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: 422 on invalid mode', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'not-a-mode', shape: 'full', message: 'hi' }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.field, 'mode');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: 422 on invalid shape', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'rose', shape: 'not-a-shape', message: 'hi' }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.field, 'shape');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: 422 on empty message', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'rose', shape: 'full', message: '   ' }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.field, 'message');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: 422 on message over 280 graphemes', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'rose', shape: 'full', message: 'a'.repeat(281) }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.field, 'message');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: 422 on from_name over 24 graphemes', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'rose', shape: 'full', message: 'hi', from_name: 'a'.repeat(25) }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.field, 'from_name');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: valid input creates a bouquet', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'sunflower', shape: 'posy', message: 'hello!', from_name: 'D' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.match(body.id, /^[0-9A-Za-z]{8}$/);
    assert.equal(body.url, `/b/${body.id}`);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bouquet: idempotent on client_nonce', async () => {
  const { server, base } = await startServer();
  try {
    const payload = {
      mode: 'rose',
      shape: 'full',
      message: 'same nonce twice',
      client_nonce: 'nonce-abc',
    };
    const res1 = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body1 = await res1.json();

    const res2 = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body2 = await res2.json();

    assert.equal(body1.id, body2.id);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/bouquet/:id/summary never contains the message', async () => {
  const { server, base } = await startServer();
  try {
    const createRes = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'lavender', shape: 'stem', message: 'a secret message', from_name: 'Alex' }),
    });
    const { id } = await createRes.json();

    const res = await fetch(`${base}/api/bouquet/${id}/summary`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, id);
    assert.equal(body.mode, 'lavender');
    assert.equal(body.shape, 'stem');
    assert.equal(body.from_name, 'Alex');
    assert.equal('message' in body, false);
    assert.equal(JSON.stringify(body).includes('secret'), false);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/bouquet/:id/summary: 404 for unknown id', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet/nopenope/summary`);
    assert.equal(res.status, 404);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/open/:id sets opened_at and increments opens; status reflects it', async () => {
  const { server, base } = await startServer();
  try {
    const createRes = await fetch(`${base}/api/bouquet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'marigold', shape: 'full', message: 'open me' }),
    });
    const { id } = await createRes.json();

    const before = await (await fetch(`${base}/api/bouquet/${id}/status`)).json();
    assert.equal(before.opened_at, null);
    assert.equal(before.opens, 0);

    const openRes = await fetch(`${base}/api/open/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'input' }),
    });
    assert.equal(openRes.status, 204);

    const after = await (await fetch(`${base}/api/bouquet/${id}/status`)).json();
    assert.notEqual(after.opened_at, null);
    assert.equal(after.opens, 1);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/open/:id always 204, even for an unknown id', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/open/nopenope`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'input' }),
    });
    assert.equal(res.status, 204);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/bouquet/:id/status: 404 for unknown id', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/bouquet/nopenope/status`);
    assert.equal(res.status, 404);
  } finally {
    await stopServer(server);
  }
});

test(
  'GET /b/:id renders the bouquet page for a known id',
  { skip: !HAS_BOUQUET_PAGE && 'app/pages/bouquet.html not built yet' },
  async () => {
    const { server, base } = await startServer();
    try {
      const createRes = await fetch(`${base}/api/bouquet`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'hydrangea', shape: 'full', message: 'render me' }),
      });
      const { id } = await createRes.json();

      const res = await fetch(`${base}/b/${id}`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, /hydrangea/);
    } finally {
      await stopServer(server);
    }
  }
);

test(
  'GET /b/:id/sent renders the sent page for a known id',
  { skip: !HAS_SENT_PAGE && 'app/pages/sent.html not built yet' },
  async () => {
    const { server, base } = await startServer();
    try {
      const createRes = await fetch(`${base}/api/bouquet`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'rose', shape: 'full', message: 'sent test' }),
      });
      const { id } = await createRes.json();

      const res = await fetch(`${base}/b/${id}/sent`);
      assert.equal(res.status, 200);
    } finally {
      await stopServer(server);
    }
  }
);

// fetch()/the URL parser collapse literal ".." segments before the request
// ever leaves the client, so encode the dots (%2e%2e) to make sure the
// traversal attempt actually reaches the server's own safeJoin() guard.
test('GET /assets/%2e%2e/server/db.js does not escape the dist directory (path traversal)', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/assets/%2e%2e/server/db.js`);
    assert.equal(res.status, 404);
  } finally {
    await stopServer(server);
  }
});

test('GET /styles/%2e%2e/server/db.js does not escape the styles directory (path traversal)', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/styles/%2e%2e/server/db.js`);
    assert.equal(res.status, 404);
  } finally {
    await stopServer(server);
  }
});
