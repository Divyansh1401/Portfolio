/**
 * @file Client entry for /b/:id — the recipient page. Reads the embedded
 * bouquet data. A locked bouquet first shows its gate (countdown to the
 * open date, then the secret question); the note and gifts are fetched
 * from POST /api/bouquet/:id/unlock only then, because the server never
 * puts locked content in the HTML. Once there is content it mounts the
 * reveal gesture; on reveal it shows the note and gifts and folds the
 * empty stage away. The open ping (POST /api/open/:id) goes on the first
 * trusted reveal input, so only after unlocking.
 */

import { mountReveal } from './reveal.js';
import { collapseStage } from './stage-collapse.js';
import { renderGifts, renderCountdown, renderSecret } from './gifts/view.js';

/**
 * @returns {{id?:string, mode?:string, from_name?:string|null, reply_of?:string|null,
 *   locked?:{until:number|null, secret:string|null}, server_now?:number,
 *   content?:{message:string, token:string|null, gifts:Array<object>}|null}}
 */
function readData() {
  const el = document.getElementById('bq-data');
  try {
    return JSON.parse(el ? el.textContent : '{}');
  } catch {
    return {};
  }
}

const $ = (id) => document.getElementById(id);

function main() {
  const data = readData();
  const root = $('bq-root');
  if (!root || !data.id) return;
  const idPath = encodeURIComponent(data.id);

  const stage = $('bq-stage');
  const gate = $('bq-gate');
  const gateStatus = $('bq-gate-status');
  const countdownBox = $('bq-countdown');
  const secretBox = $('bq-secret');
  const messageBox = $('bq-message');
  const messageText = $('bq-message-text');
  const messageFrom = $('bq-message-from');
  const giftsBox = $('bq-gifts');
  const after = $('bq-after');
  const sendBack = $('bq-send-back');

  if (sendBack) sendBack.href = `/?reply=${idPath}`;
  if (data.from_name) $('bq-gate-from').textContent = `From ${data.from_name}`;

  let openReported = false;
  function reportInput() {
    if (openReported) return;
    openReported = true;
    try {
      fetch(`/api/open/${idPath}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'input' }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // best-effort only — the reveal itself never depends on this
    }
  }

  function showContent(content) {
    messageText.textContent = content.message || '';
    if (data.from_name) {
      messageFrom.textContent = `— ${data.from_name}`;
      messageFrom.hidden = false;
    } else {
      messageFrom.hidden = true;
    }
    messageBox.hidden = false;
    renderGifts(giftsBox, content.gifts || [], { token: content.token });
    after.hidden = false;
  }

  /** Mount the reveal once the content is in hand. */
  function startReveal(content) {
    gate.hidden = true;
    stage.hidden = false;
    let reveal = null;
    let done = false;
    function onRevealed() {
      if (done) return;
      done = true;
      const openBtn = root.querySelector('[data-reveal-open]');
      const hadFocus = openBtn && document.activeElement === openBtn;
      for (const el of root.querySelectorAll('.bq-hint, [data-reveal-open]')) el.hidden = true;
      showContent(content);
      if (hadFocus) messageBox.setAttribute('tabindex', '-1');
      collapseStage(stage, reveal, () => {
        const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        if (hadFocus) messageBox.focus({ preventScroll: true });
      });
    }
    reveal = mountReveal(root, { ...data, message: content.message }, {
      preview: false,
      onEvent(name) {
        if (name === 'input') reportInput();
        else if (name === 'revealed') onRevealed();
      },
    });
  }

  let serverNow = data.server_now || Math.floor(Date.now() / 1000);
  let countdown = null;

  /** POST unlock; resolves {ok, content?, error?}. Handles 425 by re-gating. */
  async function unlock(answer) {
    let res;
    let body = {};
    try {
      res = await fetch(`/api/bouquet/${idPath}/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(answer === undefined ? {} : { answer }),
      });
      body = await res.json().catch(() => ({}));
    } catch {
      return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
    }
    if (res.status === 200 && body.content) return { ok: true, content: body.content };
    if (res.status === 200 && body.wrong) return { ok: false, error: 'Not quite. Try again.' };
    if (res.status === 425) {
      serverNow = body.server_now || serverNow;
      showCountdown(body.until);
      return { ok: false, early: true };
    }
    if (res.status === 429) {
      const mins = Math.max(1, Math.ceil((body.retry_after || 60) / 60));
      return { ok: false, error: `Too many tries. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` };
    }
    return { ok: false, error: 'Something went wrong. Try again.' };
  }

  function showSecret() {
    countdownBox.hidden = true;
    secretBox.hidden = false;
    $('bq-gate-title').textContent = 'Answer to open it';
    renderSecret(secretBox, {
      question: data.locked.secret,
      async onSubmit(answer) {
        const r = await unlock(answer);
        if (r.ok) startReveal(r.content);
        return r.early ? { ok: true } : r;
      },
    });
  }

  async function afterTime() {
    if (countdown) countdown.destroy();
    countdown = null;
    if (data.locked && data.locked.secret) return showSecret();
    gateStatus.textContent = 'Opening…';
    const r = await unlock();
    if (r.ok) {
      gateStatus.textContent = '';
      startReveal(r.content);
    } else if (!r.early) {
      gateStatus.textContent = r.error;
    }
  }

  function showCountdown(until) {
    gate.hidden = false;
    stage.hidden = true;
    secretBox.hidden = true;
    countdownBox.hidden = false;
    $('bq-gate-title').textContent = 'A bouquet is waiting for you';
    if (countdown) countdown.destroy();
    countdown = renderCountdown(countdownBox, {
      until,
      serverNow,
      icsHref: `/b/${idPath}/calendar.ics`,
      label: data.locked && data.locked.label,
      onDone: afterTime,
    });
  }

  if (data.content) {
    startReveal(data.content);
  } else if (data.locked && data.locked.until) {
    showCountdown(data.locked.until);
  } else if (data.locked && data.locked.secret) {
    gate.hidden = false;
    stage.hidden = true;
    showSecret();
  }
}

main();
