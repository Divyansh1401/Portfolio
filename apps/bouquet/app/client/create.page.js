/**
 * @file Client entry for / — the sender's page. One design per flower:
 * picking a flower re-themes the page and the live bouquet. Rose is free
 * while the site is under its free-message limit; the other flowers (and
 * Rose after the limit) go through the pay-what-you-want sheet. Optional
 * extras: gifts (photos, link, gift card, ticket/file), open-on-date and a
 * secret question. Draft state persists to sessionStorage (never the
 * secret answer); `?reply=<id>` preselects that bouquet's flower.
 */

import { MODES, DEFAULT_MODE, MODE_IDS } from '../../packages/modes/modes.js';
import { FREE_FLOWER, AMOUNTS } from '../../packages/pricing/pricing.js';
import { mountReveal } from './reveal.js';
import { createHero } from './create/hero.js';
import { createFocusTrap } from './create/dialog.js';
import { loadDraft, saveDraft } from './create/draft.js';
import { reencodeImage, checkFile, uploadBlob } from './gifts/media.js';
import { validateLink, validateCode, localDateTimeToUnix } from './gifts/validate.js';
import { collapseStage } from './stage-collapse.js';
import { renderGifts } from './gifts/view.js';
import {
  fetchPricing, startCheckout, pretendConfirm, sendAsRose, detectCurrency, saveCurrency, formatAmount,
} from './pay/pay.js';
import { graphemes } from '../server/text.js';

const MESSAGE_MAX = 280;
const NAME_MAX = 24;
const MAX_GIFTS = 8;
const MAX_PHOTOS = 6;

function reducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

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
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Tomorrow at 00:00 local, as the date/time inputs want it. */
function tomorrowMidnight() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: '00:00' };
}

/**
 * ARIA radio-group arrow keys: Left/Up and Right/Down move focus AND
 * selection (wrapping); Home/End jump to the ends. Every chip stays in the
 * Tab order on purpose (see app/test/a11y.test.mjs).
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

function showError(field, box, text) {
  if (box) {
    box.textContent = text;
    box.hidden = false;
  }
  if (field) field.setAttribute('aria-invalid', 'true');
}

function clearError(field, box) {
  if (box) {
    box.textContent = '';
    box.hidden = true;
  }
  if (field) field.removeAttribute('aria-invalid');
}

function main() {
  const root = document.getElementById('create-root');
  if (!root) return;
  const reduce = reducedMotion();

  // ---- draft state -----------------------------------------------------
  const restored = loadDraft() || {};
  const draft = {
    mode: (MODE_IDS.includes(restored.mode) && restored.mode) || DEFAULT_MODE,
    message: typeof restored.message === 'string' ? restored.message : '',
    from_name: typeof restored.from_name === 'string' ? restored.from_name : '',
    client_nonce: restored.client_nonce || newNonce(),
    // The reply link lives in the URL; a restored draft never carries one.
    reply_of: null,
    gifts: Array.isArray(restored.gifts) ? restored.gifts.filter((g) => g && g.kind) : [],
    unlock: restored.unlock && typeof restored.unlock === 'object' ? restored.unlock : { on: false },
    secret: { on: !!(restored.secret && restored.secret.on), q: (restored.secret && restored.secret.q) || '' },
  };
  let secretAnswer = ''; // never persisted
  /** Local object URLs for previewing uploads (not persistable). */
  const localSrc = new Map();

  /** A 202 needs_payment left a draft on the server; reused only while nothing changed. */
  let pendingDraft = null;

  function persist() {
    saveDraft({
      mode: draft.mode,
      message: draft.message,
      from_name: draft.from_name,
      client_nonce: draft.client_nonce,
      gifts: draft.gifts.filter((g) => g.state !== 'uploading' && g.state !== 'error').map(({ state, ...g }) => g),
      unlock: draft.unlock,
      secret: { on: draft.secret.on, q: draft.secret.q },
    });
  }

  /** Any edit after a needs_payment reply means the saved draft no longer matches. */
  function changed() {
    if (pendingDraft) {
      pendingDraft = null;
      draft.client_nonce = newNonce();
    }
    persist();
  }

  // ---- pricing ---------------------------------------------------------
  let pricing = { freeRemaining: 0, freeLimit: 100, amounts: AMOUNTS };
  let currency = detectCurrency();
  const banner = document.getElementById('launch-banner');
  const flowerHint = document.getElementById('flower-hint');

  function roseIsFree() {
    return pricing.freeRemaining > 0;
  }

  function minPrice() {
    const list = (pricing.amounts && pricing.amounts[currency]) || AMOUNTS[currency];
    return formatAmount(currency, list[0]);
  }

  function refreshPriceLabels() {
    for (const [id, btn] of modeButtons) {
      const badge = btn.querySelector('.chip__price');
      if (!badge) continue;
      badge.textContent = id === FREE_FLOWER && roseIsFree() ? 'Free' : `from ${minPrice()}`;
    }
    if (banner) {
      if (roseIsFree()) {
        banner.textContent = `Rose is free for the first ${pricing.freeLimit} bouquets: ${pricing.freeRemaining} left.`;
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    }
    if (flowerHint) {
      flowerHint.textContent =
        draft.mode === FREE_FLOWER && roseIsFree()
          ? 'Rose is free right now. Gifts, a date and a secret question are free too.'
          : `Pay what you like, from ${minPrice()}. One payment covers this one bouquet.`;
    }
  }

  fetchPricing().then((r) => {
    if (r.ok) pricing = r.data;
    refreshPriceLabels();
  });

  // ---- hero preview ----------------------------------------------------
  const heroCanvas = document.querySelector('[data-hero-canvas]');
  let hero = null;
  try {
    hero = heroCanvas ? createHero(heroCanvas, { modeId: draft.mode, reducedMotion: reduce }) : null;
  } catch {
    hero = null; // the page works without the live bouquet
  }

  // ---- flower chips ------------------------------------------------------
  const modeGroup = document.getElementById('mode-group');
  const modeButtons = new Map();
  if (modeGroup) {
    for (const mode of MODES) {
      const btn = el('button', 'chip chip--flower');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(mode.id === draft.mode));
      btn.dataset.modeId = mode.id;
      btn.style.setProperty('--dot', mode.bouquet.petals[1]);
      const dot = el('span', 'chip__dot');
      dot.setAttribute('aria-hidden', 'true');
      btn.append(dot, el('span', 'chip__name', mode.name), el('span', 'chip__price'));
      btn.addEventListener('click', () => selectMode(mode.id));
      modeGroup.append(btn);
      modeButtons.set(mode.id, btn);
    }
  }

  function selectMode(id) {
    if (!MODE_IDS.includes(id)) return;
    const was = draft.mode;
    draft.mode = id;
    document.documentElement.dataset.mode = id;
    for (const [modeId, btn] of modeButtons) btn.setAttribute('aria-checked', String(modeId === id));
    if (hero) hero.setMode(id);
    refreshPriceLabels();
    if (was !== id) changed();
  }

  wireRadioArrows(modeGroup, modeButtons, selectMode);
  document.documentElement.dataset.mode = draft.mode;
  refreshPriceLabels();

  // ---- note + from -------------------------------------------------------
  const messageField = document.getElementById('message-field');
  const messageCounter = document.getElementById('message-counter');
  const messageError = document.getElementById('message-error');
  const fromField = document.getElementById('from-field');
  const fromError = document.getElementById('from-error');

  function updateCounter() {
    const n = graphemes(messageField.value);
    messageCounter.textContent = `${n} / ${MESSAGE_MAX}`;
    messageCounter.classList.toggle('is-near-limit', n >= MESSAGE_MAX - 20);
  }

  messageField.value = draft.message;
  updateCounter();
  messageField.addEventListener('input', () => {
    const t = truncateGraphemes(messageField.value, MESSAGE_MAX);
    if (t !== messageField.value) messageField.value = t;
    draft.message = messageField.value;
    updateCounter();
    if (draft.message.trim()) clearError(messageField, messageError);
    changed();
  });

  fromField.value = draft.from_name;
  fromField.addEventListener('input', () => {
    const t = truncateGraphemes(fromField.value, NAME_MAX);
    if (t !== fromField.value) fromField.value = t;
    draft.from_name = fromField.value;
    clearError(fromField, fromError);
    changed();
  });

  // ---- extras: expand / collapse ----------------------------------------
  function wireToggle(toggleId, panelId, onOpen) {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      toggle.querySelector('.extra__plus').textContent = open ? '−' : '+';
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      set(open);
      if (open && onOpen) onOpen();
    });
    return set;
  }

  // ---- gifts ---------------------------------------------------------------
  const giftList = document.getElementById('gift-list');
  const giftCount = document.getElementById('gift-count');
  const giftsError = document.getElementById('gifts-error');
  const setGiftsOpen = wireToggle('gift-toggle', 'gift-panel');

  const photoCount = () => draft.gifts.filter((g) => g.kind === 'photo').length;
  const uploading = () => draft.gifts.some((g) => g.state === 'uploading');

  function giftSummary() {
    const n = draft.gifts.length;
    giftCount.textContent = n
      ? `${n} of ${MAX_GIFTS} added${photoCount() ? `, ${photoCount()} of ${MAX_PHOTOS} photos` : ''}.`
      : `Up to ${MAX_GIFTS} things, including up to ${MAX_PHOTOS} photos.`;
    const meta = document.querySelector('#gift-toggle .extra__meta');
    if (meta) meta.textContent = n ? `${n} added` : 'Photos, a link, a gift card or a ticket';
  }

  function removeGift(g) {
    draft.gifts = draft.gifts.filter((x) => x !== g);
    if (g.upload_key && localSrc.has(g.upload_key)) {
      URL.revokeObjectURL(localSrc.get(g.upload_key));
      localSrc.delete(g.upload_key);
    }
    renderGiftList();
    changed();
  }

  function textInput(label, value, onInput, opts = {}) {
    const wrap = el('div', 'field gift-item__field');
    const id = `g-${Math.random().toString(36).slice(2, 9)}`;
    const lab = el('label', null, label);
    lab.htmlFor = id;
    const input = el('input');
    input.id = id;
    input.type = opts.type || 'text';
    input.value = value || '';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.maxLength) input.maxLength = opts.maxLength;
    if (opts.inputmode) input.inputMode = opts.inputmode;
    input.addEventListener('input', () => {
      onInput(input.value);
      changed();
    });
    wrap.append(lab, input);
    return wrap;
  }

  function renderGiftList() {
    giftList.textContent = '';
    for (const g of draft.gifts) {
      const li = el('li', `gift-item gift-item--${g.kind}`);
      const head = el('div', 'gift-item__head');
      const kindName = { photo: 'Photo', link: 'Link', code: 'Gift card', file: 'Ticket or file' }[g.kind];
      if (g.kind === 'photo') {
        const src = g.upload_key && localSrc.get(g.upload_key);
        const thumb = el('span', 'gift-item__thumb');
        if (src) {
          const img = el('img');
          img.src = src;
          img.alt = '';
          thumb.append(img);
        }
        head.append(thumb);
      }
      const title = el('span', 'gift-item__title', g.kind === 'file' || g.kind === 'photo' ? g.name || kindName : kindName);
      head.append(title);
      if (g.state === 'uploading') head.append(el('span', 'gift-item__state', 'Uploading…'));
      if (g.state === 'error') head.append(el('span', 'gift-item__state gift-item__state--error', g.error || 'Upload failed'));
      const rm = el('button', 'gift-item__remove', 'Remove');
      rm.type = 'button';
      rm.setAttribute('aria-label', `Remove ${kindName.toLowerCase()}${g.name ? ` ${g.name}` : ''}`);
      rm.addEventListener('click', () => removeGift(g));
      head.append(rm);
      li.append(head);

      if (g.kind === 'link') {
        li.append(
          textInput('Link', g.url, (v) => { g.url = v; }, { type: 'url', placeholder: 'https://', inputmode: 'url' }),
          textInput('What is it? (optional)', g.label, (v) => { g.label = v; }, { placeholder: 'Our playlist', maxLength: 60 }),
        );
      } else if (g.kind === 'code') {
        li.append(
          textInput('Gift card name', g.label, (v) => { g.label = v; }, { placeholder: 'Amazon gift card', maxLength: 60 }),
          textInput('Code', g.code, (v) => { g.code = v; }, { maxLength: 64 }),
          textInput('Redeem link (optional)', g.url, (v) => { g.url = v; }, { type: 'url', placeholder: 'https://', inputmode: 'url' }),
        );
      } else if (g.kind === 'file' && g.state !== 'uploading') {
        li.append(textInput('What is it? (optional)', g.label, (v) => { g.label = v; }, { placeholder: 'Concert tickets', maxLength: 60 }));
      }
      giftList.append(li);
    }
    giftSummary();
  }

  function roomFor(kind) {
    if (draft.gifts.length >= MAX_GIFTS) return `You can add up to ${MAX_GIFTS} things.`;
    if (kind === 'photo' && photoCount() >= MAX_PHOTOS) return `You can add up to ${MAX_PHOTOS} photos.`;
    return null;
  }

  async function addUpload(file, kind) {
    const full = roomFor(kind);
    if (full) return showError(null, giftsError, full);
    const bad = checkFile(file, kind);
    if (bad) return showError(null, giftsError, bad);
    clearError(null, giftsError);
    const g = { kind, name: file.name, state: 'uploading' };
    draft.gifts.push(g);
    renderGiftList();
    try {
      const blob = kind === 'photo' ? await reencodeImage(file) : file;
      const r = await uploadBlob(blob, file.name);
      if (!r.ok) throw new Error(r.data && r.data.error ? r.data.error : 'Upload failed');
      Object.assign(g, { upload_key: r.data.key, mime: r.data.mime, bytes: r.data.bytes, state: 'done' });
      localSrc.set(r.data.key, URL.createObjectURL(blob));
      delete g.state;
      changed();
    } catch (err) {
      g.state = 'error';
      g.error = err && err.message ? err.message : 'Upload failed';
    }
    renderGiftList();
  }

  document.getElementById('add-photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const f of files) await addUpload(f, 'photo');
  });
  document.getElementById('add-file').addEventListener('change', async (e) => {
    const [f] = e.target.files;
    e.target.value = '';
    if (f) await addUpload(f, 'file');
  });
  function addTyped(kind) {
    const full = roomFor(kind);
    if (full) return showError(null, giftsError, full);
    clearError(null, giftsError);
    draft.gifts.push(kind === 'link' ? { kind, url: '', label: '' } : { kind, code: '', label: '', url: '' });
    renderGiftList();
    changed();
    const inputs = giftList.querySelectorAll('li:last-child input');
    if (inputs[0]) inputs[0].focus();
  }
  document.getElementById('add-link').addEventListener('click', () => addTyped('link'));
  document.getElementById('add-code').addEventListener('click', () => addTyped('code'));
  // Uploads from an earlier visit have no local preview; drop half-done ones.
  draft.gifts = draft.gifts.filter((g) => !((g.kind === 'photo' || g.kind === 'file') && !g.upload_key));
  if (draft.gifts.length) setGiftsOpen(true);
  renderGiftList();

  // ---- open on a date ------------------------------------------------------
  const unlockDate = document.getElementById('unlock-date');
  const unlockTime = document.getElementById('unlock-time');
  const unlockLine = document.getElementById('unlock-line');
  const unlockError = document.getElementById('unlock-error');

  function unlockSeconds() {
    return draft.unlock.on ? localDateTimeToUnix(draft.unlock.date, draft.unlock.time) : null;
  }

  function refreshUnlockLine() {
    const t = unlockSeconds();
    const meta = document.querySelector('#date-toggle .extra__meta');
    if (!draft.unlock.on || !t) {
      unlockLine.textContent = '';
      if (meta) meta.textContent = 'A countdown until the moment you pick';
      return;
    }
    const when = new Date(t * 1000).toLocaleString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    unlockLine.textContent = `Opens ${when}, your time.`;
    if (meta) meta.textContent = `Opens ${when}`;
  }

  const setDateOpen = wireToggle('date-toggle', 'date-panel', () => {
    if (!draft.unlock.date) Object.assign(draft.unlock, tomorrowMidnight());
    draft.unlock.on = true;
    unlockDate.value = draft.unlock.date;
    unlockTime.value = draft.unlock.time;
    refreshUnlockLine();
    changed();
  });
  for (const input of [unlockDate, unlockTime]) {
    input.addEventListener('input', () => {
      draft.unlock.date = unlockDate.value;
      draft.unlock.time = unlockTime.value;
      clearError(null, unlockError);
      refreshUnlockLine();
      changed();
    });
  }
  document.getElementById('date-remove').addEventListener('click', () => {
    draft.unlock = { on: false };
    setDateOpen(false);
    refreshUnlockLine();
    changed();
    document.getElementById('date-toggle').focus();
  });
  if (draft.unlock.on) {
    setDateOpen(true);
    unlockDate.value = draft.unlock.date || '';
    unlockTime.value = draft.unlock.time || '';
    refreshUnlockLine();
  }

  // ---- secret question ----------------------------------------------------
  const secretQ = document.getElementById('secret-q');
  const secretA = document.getElementById('secret-a');
  const secretError = document.getElementById('secret-error');
  const setSecretOpen = wireToggle('secret-toggle', 'secret-panel', () => {
    draft.secret.on = true;
    changed();
    secretQ.focus();
  });
  secretQ.value = draft.secret.q;
  secretQ.addEventListener('input', () => {
    draft.secret.q = secretQ.value;
    clearError(secretQ, secretError);
    changed();
  });
  secretA.addEventListener('input', () => {
    secretAnswer = secretA.value;
    clearError(secretA, secretError);
    changed();
  });
  document.getElementById('secret-remove').addEventListener('click', () => {
    draft.secret = { on: false, q: '' };
    secretAnswer = '';
    secretQ.value = '';
    secretA.value = '';
    setSecretOpen(false);
    changed();
    document.getElementById('secret-toggle').focus();
  });
  if (draft.secret.on) setSecretOpen(true);

  // ---- reply line (?reply=<id>) --------------------------------------------
  const replyLine = document.getElementById('reply-line');
  const replyId = new URLSearchParams(location.search).get('reply');
  if (replyId) {
    draft.reply_of = replyId;
    fetch(`/api/bouquet/${encodeURIComponent(replyId)}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((summary) => {
        if (!summary) return;
        if (summary.mode && MODE_IDS.includes(summary.mode)) selectMode(summary.mode);
        replyLine.textContent = summary.from_name ? `Sending one back to ${summary.from_name}` : 'Sending one back';
        replyLine.hidden = false;
      })
      .catch(() => {});
  }

  // ---- building the request ------------------------------------------------
  function collectGifts() {
    const out = [];
    for (const g of draft.gifts) {
      if (g.kind === 'photo' || g.kind === 'file') {
        if (!g.upload_key) continue;
        out.push({ kind: g.kind, upload_key: g.upload_key, label: g.label || undefined });
      } else if (g.kind === 'link') {
        const v = validateLink(g.url);
        if (!v.ok) return { error: `Link: ${v.error}` };
        out.push({ kind: 'link', url: v.url, label: g.label || undefined });
      } else if (g.kind === 'code') {
        const v = validateCode(g.code);
        if (!v.ok) return { error: `Gift card: ${v.error}` };
        let url;
        if (g.url && g.url.trim()) {
          const l = validateLink(g.url);
          if (!l.ok) return { error: `Redeem link: ${l.error}` };
          url = l.url;
        }
        out.push({ kind: 'code', code: v.code, label: g.label || undefined, url });
      }
    }
    return { gifts: out };
  }

  function buildRequest() {
    const message = messageField.value.trim();
    if (!message) {
      showError(messageField, messageError, 'Say something, even one word');
      messageField.focus();
      return null;
    }
    const g = collectGifts();
    if (g.error) {
      setGiftsOpen(true);
      showError(null, giftsError, g.error);
      return null;
    }
    let unlockAt;
    if (draft.unlock.on) {
      unlockAt = unlockSeconds();
      if (!unlockAt || unlockAt * 1000 < Date.now() + 60 * 1000) {
        setDateOpen(true);
        showError(null, unlockError, 'Pick a date and time in the future.');
        return null;
      }
    }
    let secret;
    if (draft.secret.on && (draft.secret.q.trim() || secretAnswer.trim())) {
      if (!draft.secret.q.trim() || !secretAnswer.trim()) {
        setSecretOpen(true);
        showError(!draft.secret.q.trim() ? secretQ : secretA, secretError, 'Add both a question and its answer, or remove the question.');
        return null;
      }
      secret = { question: draft.secret.q, answer: secretAnswer };
    }
    return {
      mode: draft.mode,
      message,
      from_name: draft.from_name || '',
      reply_of: draft.reply_of,
      client_nonce: draft.client_nonce,
      gifts: g.gifts,
      unlock_at: unlockAt,
      secret,
    };
  }

  // ---- preview ---------------------------------------------------------------
  const previewDialog = document.getElementById('preview-dialog');
  const previewRoot = document.getElementById('preview-root');
  const previewMessageBox = document.getElementById('preview-message');
  const previewMessageText = document.getElementById('preview-message-text');
  const previewMessageFrom = document.getElementById('preview-message-from');
  const previewGifts = document.getElementById('preview-gifts');
  const previewNote = document.getElementById('preview-note');
  let previewReveal = null;
  let previewTrap = null;
  let cancelFold = null;

  function closePreview() {
    if (previewReveal) previewReveal.destroy();
    previewReveal = null;
    if (cancelFold) cancelFold();
    cancelFold = null;
    previewDialog.hidden = true;
    previewMessageBox.hidden = true;
    previewGifts.textContent = '';
    const stage = previewRoot.querySelector('[data-reveal-stage]');
    stage.classList.remove('is-revealed');
    for (const n of previewRoot.querySelectorAll('.preview-hint, [data-reveal-open]')) n.hidden = false;
    if (previewTrap) previewTrap.close();
  }

  function previewGiftData() {
    return draft.gifts
      .filter((g) => (g.kind !== 'photo' && g.kind !== 'file') || (g.upload_key && localSrc.has(g.upload_key)))
      .map((g, i) => ({
        ...g,
        id: `p${i}`,
        src: g.upload_key ? localSrc.get(g.upload_key) : undefined,
        url: g.url && validateLink(g.url).ok ? validateLink(g.url).url : undefined,
      }))
      .filter((g) => g.kind !== 'link' || g.url);
  }

  function openPreview() {
    previewDialog.hidden = false;
    previewNote.hidden = !(draft.unlock.on || draft.secret.on);
    if (!previewTrap) previewTrap = createFocusTrap(previewDialog, { onClose: closePreview });
    previewTrap.open();
    previewReveal = mountReveal(previewRoot, { mode: draft.mode }, {
      preview: true,
      onEvent(name) {
        if (name !== 'revealed') return;
        previewMessageText.textContent = draft.message;
        previewMessageFrom.textContent = draft.from_name ? `— ${draft.from_name}` : '';
        previewMessageFrom.hidden = !draft.from_name;
        previewMessageBox.hidden = false;
        renderGifts(previewGifts, previewGiftData());
        for (const n of previewRoot.querySelectorAll('.preview-hint, [data-reveal-open]')) n.hidden = true;
        cancelFold = collapseStage(previewRoot.querySelector('[data-reveal-stage]'), previewReveal);
      },
    });
  }

  document.getElementById('preview-btn').addEventListener('click', openPreview);
  document.getElementById('preview-close').addEventListener('click', closePreview);

  // ---- pay sheet ---------------------------------------------------------------
  const sheet = document.getElementById('pay-sheet');
  const payTitle = document.getElementById('pay-title');
  const amountGroup = document.getElementById('amount-group');
  const currencySwitch = document.getElementById('currency-switch');
  const payBtn = document.getElementById('pay-btn');
  const asRoseBtn = document.getElementById('as-rose-btn');
  const choosePanel = document.getElementById('pay-choose');
  const checkoutPanel = document.getElementById('checkout-panel');
  const checkoutTotal = document.getElementById('checkout-total');
  const payStatus = document.getElementById('pay-status');
  let sheetTrap = null;
  let chosen = null;
  let order = null;

  function renderAmounts() {
    amountGroup.textContent = '';
    const buttons = new Map();
    const list = (pricing.amounts && pricing.amounts[currency]) || AMOUNTS[currency];
    for (const amount of list) {
      const b = el('button', 'chip pay-amount', formatAmount(currency, amount));
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(chosen === amount));
      b.addEventListener('click', () => pick(amount));
      amountGroup.append(b);
      buttons.set(amount, b);
    }
    function pick(amount) {
      chosen = amount;
      for (const [a, b] of buttons) b.setAttribute('aria-checked', String(a === amount));
      payBtn.disabled = false;
      payBtn.textContent = `Pay ${formatAmount(currency, amount)}`;
    }
    wireRadioArrows(amountGroup, buttons, pick);
    payBtn.disabled = chosen === null;
    payBtn.textContent = chosen === null ? 'Pick an amount' : `Pay ${formatAmount(currency, chosen)}`;
    currencySwitch.textContent = currency === 'INR' ? 'Paying from outside India? Show $' : 'Paying from India? Show ₹';
  }

  currencySwitch.addEventListener('click', () => {
    currency = currency === 'INR' ? 'USD' : 'INR';
    saveCurrency(currency);
    chosen = null;
    renderAmounts();
    refreshPriceLabels();
  });

  function openSheet(reason) {
    chosen = null;
    order = null;
    payStatus.textContent = '';
    choosePanel.hidden = false;
    checkoutPanel.hidden = true;
    payTitle.textContent =
      reason === 'free_limit_reached' ? 'Rose is no longer free: pay what you like' : 'Pay what you like for this bouquet';
    asRoseBtn.hidden = !(reason === 'paid_flower' && roseIsFree());
    renderAmounts();
    sheet.hidden = false;
    if (!sheetTrap) sheetTrap = createFocusTrap(sheet, { onClose: closeSheet });
    sheetTrap.open();
  }

  function closeSheet() {
    sheet.hidden = true;
    if (sheetTrap) sheetTrap.close();
  }

  function done(id) {
    draft.client_nonce = newNonce();
    draft.message = '';
    draft.gifts = [];
    draft.unlock = { on: false };
    draft.secret = { on: false, q: '' };
    draft.reply_of = null;
    pendingDraft = null;
    persist();
    location.assign(`/b/${id}/sent`);
  }

  payBtn.addEventListener('click', async () => {
    if (!pendingDraft || chosen === null) return;
    payBtn.disabled = true;
    payStatus.textContent = 'Starting checkout…';
    const r = await startCheckout(pendingDraft.id, currency, chosen);
    payBtn.disabled = false;
    if (r.status === 409 && r.data.id) return done(r.data.id);
    if (!r.ok) {
      payStatus.textContent = r.data.error || "Couldn't start checkout. Try again.";
      return;
    }
    order = r.data;
    payStatus.textContent = '';
    choosePanel.hidden = true;
    checkoutPanel.hidden = false;
    checkoutTotal.textContent = `${formatAmount(order.currency, order.amount)} for one bouquet`;
    document.getElementById('checkout-pay').focus();
  });

  async function confirm(outcome) {
    if (!order || !pendingDraft) return;
    payStatus.textContent = outcome === 'paid' ? 'Paying…' : '';
    const r = await pretendConfirm(pendingDraft.id, order.order_id, outcome);
    if (r.ok && r.data.id) return done(r.data.id);
    payStatus.textContent = "Payment didn't go through. Your bouquet is saved; try again.";
    order = null;
    checkoutPanel.hidden = true;
    choosePanel.hidden = false;
    renderAmounts();
    payBtn.focus();
  }
  document.getElementById('checkout-pay').addEventListener('click', () => confirm('paid'));
  document.getElementById('checkout-fail').addEventListener('click', () => confirm('failed'));

  asRoseBtn.addEventListener('click', async () => {
    if (!pendingDraft) return;
    const r = await sendAsRose(pendingDraft.id);
    if (r.ok && r.data.id) return done(r.data.id);
    payStatus.textContent = r.data.error || "Couldn't switch to Rose.";
    asRoseBtn.hidden = true;
  });

  document.getElementById('pay-close').addEventListener('click', closeSheet);

  // ---- create link ---------------------------------------------------------------
  const createBtn = document.getElementById('create-btn');
  const submitStatus = document.getElementById('submit-status');

  async function submit() {
    submitStatus.textContent = '';
    if (uploading()) {
      submitStatus.textContent = 'Wait for your uploads to finish.';
      return;
    }
    if (pendingDraft) {
      openSheet(pendingDraft.reason);
      return;
    }
    const body = buildRequest();
    if (!body) return;
    clearError(messageField, messageError);
    clearError(fromField, fromError);

    createBtn.disabled = true;
    createBtn.textContent = 'Creating…';
    try {
      const res = await fetch('/api/bouquet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) return done(data.id);
      if (res.status === 202 && data.needs_payment) {
        pendingDraft = { id: data.draft_id, reason: data.reason };
        fetchPricing().then((r) => {
          if (r.ok) pricing = r.data;
          refreshPriceLabels();
          openSheet(data.reason);
        });
        return;
      }
      if (res.status === 422) {
        const text = data.error || 'Something needs fixing.';
        if (data.field === 'message') showError(messageField, messageError, text);
        else if (data.field === 'from_name') showError(fromField, fromError, text);
        else if (data.field === 'gifts') {
          setGiftsOpen(true);
          showError(null, giftsError, text);
        } else if (data.field === 'unlock_at') {
          setDateOpen(true);
          showError(null, unlockError, text);
        } else if (data.field === 'secret') {
          setSecretOpen(true);
          showError(null, secretError, text);
        } else submitStatus.textContent = text;
        return;
      }
      submitStatus.textContent = "Couldn't create your link. Try again.";
    } catch {
      submitStatus.textContent = "Couldn't reach the server. Your note is still here; try again.";
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = 'Create link';
    }
  }

  createBtn.addEventListener('click', submit);
}

main();
