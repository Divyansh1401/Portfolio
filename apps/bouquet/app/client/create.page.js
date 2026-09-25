/**
 * @file Client entry for / — the sender's page. Wires the flower/shape
 * pickers to the live hero preview, the note field's grapheme counter, the
 * preview dialog (mountReveal in preview mode) and the create-link submit
 * flow. Draft state persists to sessionStorage; a `?reply=<id>` query
 * preselects that bouquet's mode and shows a reply line.
 */

import { MODES, DEFAULT_MODE, MODE_IDS } from '../../packages/modes/modes.js';
import { SHAPES, SHAPE_IDS, DEFAULT_SHAPE } from '../../packages/renderer/src/shapes.js';
import { mountReveal } from './reveal.js';
import { createHero } from './create/hero.js';
import { createFocusTrap } from './create/dialog.js';
import { loadDraft, saveDraft } from './create/draft.js';
import { graphemes } from '../server/text.js';

const MESSAGE_MAX = 280;
const NAME_MAX = 24;

const SHAPE_LABELS = { full: 'Full', posy: 'Posy', stem: 'Single stem' };

function reducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Truncate `str` to at most `max` grapheme clusters.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncateGraphemes(str, max) {
  if (!str) return '';
  if (graphemes(str) <= max) return str;
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  let out = '';
  let n = 0;
  for (const { segment } of seg.segment(str)) {
    if (n >= max) break;
    out += segment;
    n++;
  }
  return out;
}

function newNonce() {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID (still unique
    // enough for a client-side idempotency key kept in one tab's session).
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * ARIA radio-group arrow keys: Left/Up and Right/Down move focus AND
 * selection to the previous/next chip (wrapping); Home/End jump to the ends.
 * Every chip stays in the Tab order on purpose (see app/test/a11y.test.mjs).
 * @param {HTMLElement | null} group
 * @param {Map<string, HTMLElement>} buttons
 * @param {(id: string) => void} select
 */
function wireRadioArrows(group, buttons, select) {
  if (!group) return;
  group.addEventListener('keydown', (e) => {
    const ids = [...buttons.keys()];
    const idx = ids.findIndex((id) => buttons.get(id) === e.target);
    if (idx < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % ids.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    else return;
    e.preventDefault();
    select(ids[next]);
    buttons.get(ids[next]).focus();
  });
}

function main() {
  const root = document.getElementById('create-root');
  if (!root) return;

  const reduce = reducedMotion();

  // ---- draft state -----------------------------------------------------
  const restored = loadDraft();
  /** @type {import('./create/draft.js').Draft} */
  const draft = {
    mode: (restored && MODE_IDS.includes(restored.mode) && restored.mode) || DEFAULT_MODE,
    shape: (restored && SHAPE_IDS.includes(restored.shape) && restored.shape) || DEFAULT_SHAPE,
    message: (restored && typeof restored.message === 'string' && restored.message) || '',
    from_name: (restored && typeof restored.from_name === 'string' && restored.from_name) || '',
    client_nonce: (restored && restored.client_nonce) || newNonce(),
    // The reply link lives in the URL (?reply=<id>, set below); a restored
    // draft must not carry a stale reply_of onto a plain visit to /.
    reply_of: null,
  };

  function persist() {
    saveDraft(draft);
  }
  persist();

  // ---- hero preview ------------------------------------------------------
  const heroCanvas = document.querySelector('[data-hero-canvas]');
  const hero = heroCanvas
    ? createHero(heroCanvas, { modeId: draft.mode, shapeId: draft.shape, reducedMotion: reduce })
    : null;

  // ---- flower (mode) chips ------------------------------------------------
  const modeGroup = document.getElementById('mode-group');
  const modeButtons = new Map();
  if (modeGroup) {
    for (const mode of MODES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(mode.id === draft.mode));
      btn.dataset.modeId = mode.id;
      btn.style.setProperty('--dot', mode.bouquet.petals[1]);
      const dot = document.createElement('span');
      dot.className = 'chip__dot';
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(mode.name));
      btn.addEventListener('click', () => selectMode(mode.id));
      modeGroup.appendChild(btn);
      modeButtons.set(mode.id, btn);
    }
  }

  function selectMode(id) {
    if (!MODE_IDS.includes(id)) return;
    draft.mode = id;
    document.documentElement.dataset.mode = id;
    for (const [modeId, btn] of modeButtons) {
      btn.setAttribute('aria-checked', String(modeId === id));
    }
    if (hero) hero.setMode(id);
    persist();
  }

  // ---- shape chips ---------------------------------------------------------
  const shapeGroup = document.getElementById('shape-group');
  const shapeButtons = new Map();
  if (shapeGroup) {
    for (const id of SHAPE_IDS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(id === draft.shape));
      btn.dataset.shapeId = id;
      const dot = document.createElement('span');
      dot.className = 'chip__dot';
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(SHAPE_LABELS[id] || id));
      btn.addEventListener('click', () => selectShape(id));
      shapeGroup.appendChild(btn);
      shapeButtons.set(id, btn);
    }
  }

  function selectShape(id) {
    if (!SHAPE_IDS.includes(id)) return;
    draft.shape = id;
    for (const [shapeId, btn] of shapeButtons) {
      btn.setAttribute('aria-checked', String(shapeId === id));
    }
    if (hero) hero.setShape(id);
    persist();
  }

  wireRadioArrows(modeGroup, modeButtons, selectMode);
  wireRadioArrows(shapeGroup, shapeButtons, selectShape);

  document.documentElement.dataset.mode = draft.mode;

  // ---- note field ------------------------------------------------------
  const messageField = document.getElementById('message-field');
  const messageCounter = document.getElementById('message-counter');
  const messageError = document.getElementById('message-error');

  function updateCounter() {
    if (!messageField || !messageCounter) return;
    const n = graphemes(messageField.value);
    messageCounter.textContent = `${n} / ${MESSAGE_MAX}`;
    messageCounter.classList.toggle('is-near-limit', n >= MESSAGE_MAX - 20);
  }

  function clearMessageError() {
    if (!messageField || !messageError) return;
    messageError.hidden = true;
    messageError.textContent = '';
    messageField.removeAttribute('aria-invalid');
  }

  function showMessageError(text) {
    if (!messageField || !messageError) return;
    messageError.textContent = text;
    messageError.hidden = false;
    messageField.setAttribute('aria-invalid', 'true');
  }

  if (messageField) {
    messageField.value = draft.message;
    updateCounter();
    messageField.addEventListener('input', () => {
      const truncated = truncateGraphemes(messageField.value, MESSAGE_MAX);
      if (truncated !== messageField.value) messageField.value = truncated;
      draft.message = messageField.value;
      updateCounter();
      if (draft.message.trim()) clearMessageError();
      persist();
    });
  }

  // ---- from-name field ---------------------------------------------------
  const fromField = document.getElementById('from-field');
  const fromError = document.getElementById('from-error');

  function clearFromError() {
    if (!fromField || !fromError) return;
    fromError.hidden = true;
    fromError.textContent = '';
    fromField.removeAttribute('aria-invalid');
  }

  function showFromError(text) {
    if (!fromField || !fromError) return;
    fromError.textContent = text;
    fromError.hidden = false;
    fromField.setAttribute('aria-invalid', 'true');
  }

  if (fromField) {
    fromField.value = draft.from_name;
    fromField.addEventListener('input', () => {
      const truncated = truncateGraphemes(fromField.value, NAME_MAX);
      if (truncated !== fromField.value) fromField.value = truncated;
      draft.from_name = fromField.value;
      clearFromError();
      persist();
    });
  }

  // ---- reply line (?reply=<id>) -------------------------------------------
  const replyLine = document.getElementById('reply-line');
  const params = new URLSearchParams(location.search);
  const replyId = params.get('reply');
  if (replyId) {
    draft.reply_of = replyId;
    persist();
    fetch(`/api/bouquet/${encodeURIComponent(replyId)}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((summary) => {
        if (!summary) return;
        if (summary.mode && MODE_IDS.includes(summary.mode)) selectMode(summary.mode);
        if (replyLine) {
          replyLine.textContent = summary.from_name
            ? `Sending one back to ${summary.from_name}`
            : 'Sending one back';
          replyLine.hidden = false;
        }
      })
      .catch(() => {
        // The reply line is a nice-to-have; the form still works without it.
      });
  }

  // ---- preview dialog ------------------------------------------------------
  const previewBtn = document.getElementById('preview-btn');
  const previewDialog = document.getElementById('preview-dialog');
  const previewClose = document.getElementById('preview-close');
  const previewRoot = document.getElementById('preview-root');
  const previewMessageBox = document.getElementById('preview-message');
  const previewMessageText = document.getElementById('preview-message-text');
  const previewMessageFrom = document.getElementById('preview-message-from');

  let previewReveal = null;
  let trap = null;

  function closePreview() {
    if (previewReveal) {
      previewReveal.destroy();
      previewReveal = null;
    }
    if (previewDialog) previewDialog.hidden = true;
    if (previewMessageBox) previewMessageBox.hidden = true;
    if (previewRoot) {
      const stage = previewRoot.querySelector('[data-reveal-stage]');
      if (stage) stage.classList.remove('is-revealed');
      const openBtn = previewRoot.querySelector('[data-reveal-open]');
      const hint = previewRoot.querySelector('.preview-hint');
      if (openBtn) openBtn.hidden = false;
      if (hint) hint.hidden = false;
    }
    if (trap) trap.close();
  }

  function openPreview() {
    if (!previewDialog || !previewRoot) return;
    previewDialog.hidden = false;
    if (!trap) {
      trap = createFocusTrap(previewDialog, { onClose: closePreview });
    }
    trap.open();
    previewReveal = mountReveal(
      previewRoot,
      { mode: draft.mode, shape: draft.shape },
      {
        preview: true,
        onEvent(name) {
          if (name !== 'revealed') return;
          if (previewMessageText) previewMessageText.textContent = draft.message;
          if (previewMessageFrom) {
            if (draft.from_name) {
              previewMessageFrom.textContent = `— ${draft.from_name}`;
              previewMessageFrom.hidden = false;
            } else {
              previewMessageFrom.hidden = true;
            }
          }
          if (previewMessageBox) previewMessageBox.hidden = false;
          if (previewRoot) {
            for (const el of previewRoot.querySelectorAll('.preview-hint, [data-reveal-open]')) {
              el.hidden = true;
            }
          }
        },
      },
    );
  }

  if (previewBtn) previewBtn.addEventListener('click', openPreview);
  if (previewClose) previewClose.addEventListener('click', closePreview);

  // ---- create link ---------------------------------------------------------
  const createBtn = document.getElementById('create-btn');
  const submitStatus = document.getElementById('submit-status');

  function setSubmitStatus(text) {
    if (submitStatus) submitStatus.textContent = text || '';
  }

  async function submit() {
    const message = (messageField ? messageField.value : draft.message).trim();
    if (!message) {
      showMessageError('Say something, even one word');
      if (messageField) messageField.focus();
      return;
    }
    clearMessageError();
    clearFromError();
    setSubmitStatus('');

    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating…';
    }

    try {
      const res = await fetch('/api/bouquet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: draft.mode,
          shape: draft.shape,
          message,
          from_name: draft.from_name || '',
          reply_of: draft.reply_of,
          client_nonce: draft.client_nonce,
        }),
      });

      if (res.status === 201) {
        const body = await res.json();
        // This draft is now spent: the next bouquet from this tab ("Make
        // another" on /sent, or Back) must get a fresh idempotency key,
        // otherwise the server hands back THIS bouquet's id again. Keep the
        // sender's flower/shape/name, drop the note and the reply link.
        draft.client_nonce = newNonce();
        draft.message = '';
        draft.reply_of = null;
        persist();
        location.assign(`/b/${body.id}/sent`);
        return;
      }

      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if (body.field === 'message') showMessageError(body.error || 'That note is too long.');
        else if (body.field === 'from_name') showFromError(body.error || 'That name is too long.');
        else setSubmitStatus(body.error || 'Something about this bouquet needs fixing.');
      } else {
        setSubmitStatus("Couldn't create your link — try again.");
      }
    } catch {
      setSubmitStatus("Couldn't reach the server — your note is still here, try again.");
    } finally {
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = 'Create link';
      }
    }
  }

  if (createBtn) createBtn.addEventListener('click', submit);
}

main();
