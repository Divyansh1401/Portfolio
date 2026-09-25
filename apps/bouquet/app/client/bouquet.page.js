/**
 * @file Client entry for /b/:id — the recipient reveal page. Reads the
 * embedded bouquet data, mounts the reveal gesture (reveal.js), and on the
 * first trusted input posts /api/open/:id {kind:'input'} once (fetch
 * keepalive, never in preview — this page is never a preview). On reveal it
 * fills the message card and shows the post-reveal actions.
 */

import { mountReveal } from './reveal.js';

/**
 * @returns {{id?:string, mode?:string, shape?:string, message?:string, from_name?:string|null, reply_of?:string|null}}
 */
function readData() {
  const el = document.getElementById('bq-data');
  try {
    return JSON.parse(el ? el.textContent : '{}');
  } catch {
    return {};
  }
}

function main() {
  const data = readData();
  const root = document.getElementById('bq-root');
  if (!root) return;

  const messageBox = document.getElementById('bq-message');
  const messageText = document.getElementById('bq-message-text');
  const messageFrom = document.getElementById('bq-message-from');
  const after = document.getElementById('bq-after');
  const sendBack = document.getElementById('bq-send-back');

  if (sendBack && data.id) {
    sendBack.href = `/?reply=${encodeURIComponent(data.id)}`;
  }

  let openReported = false;
  function reportInput() {
    if (openReported || !data.id) return;
    openReported = true;
    try {
      fetch(`/api/open/${encodeURIComponent(data.id)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'input' }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // best-effort only — the reveal itself never depends on this
    }
  }

  function showReveal() {
    if (messageText) messageText.textContent = data.message || '';
    if (messageFrom) {
      if (data.from_name) {
        messageFrom.textContent = `— ${data.from_name}`;
        messageFrom.hidden = false;
      } else {
        messageFrom.hidden = true;
      }
    }
    if (messageBox) messageBox.hidden = false;
    if (after) after.hidden = false;
    // Retire the pre-reveal affordances and bring the note into view — the
    // stage fills the viewport, so otherwise the note sits below the fold
    // (review-gate fix).
    const openBtn = root.querySelector('[data-reveal-open]');
    const hadFocus = openBtn && document.activeElement === openBtn;
    for (const el of root.querySelectorAll('.bq-hint, [data-reveal-open]')) el.hidden = true;
    if (hadFocus && sendBack) sendBack.focus({ preventScroll: true });
    if (messageBox) {
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      messageBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  }

  mountReveal(root, data, {
    preview: false,
    onEvent(name) {
      if (name === 'input') reportInput();
      else if (name === 'revealed') showReveal();
    },
  });
}

main();
