/**
 * @file Recipient-side views: the gifts inside a bouquet (photo album with
 * a full-screen viewer, link cards, a gift-code card that is revealed on
 * tap, ticket/file cards), the open-on-date countdown and the secret
 * question. Framework-free; every piece of user text goes in via
 * textContent, and links are only ever https (checked by the server).
 */

import { formatCountdown } from './validate.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function withToken(src, token) {
  return token ? `${src}${src.includes('?') ? '&' : '?'}t=${encodeURIComponent(token)}` : src;
}

function prettyBytes(n) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Full-screen photo viewer: prev/next, Escape, swipe, focus returned. */
function openLightbox(photos, start) {
  const opener = document.activeElement;
  let i = start;
  const dlg = el('div', 'gift-lightbox');
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-label', 'Photos');
  const img = el('img', 'gift-lightbox__img');
  const count = el('p', 'gift-lightbox__count');
  const prev = el('button', 'btn btn-ghost gift-lightbox__prev', 'Previous');
  const next = el('button', 'btn btn-ghost gift-lightbox__next', 'Next');
  const close = el('button', 'btn btn-primary gift-lightbox__close', 'Close');
  for (const b of [prev, next, close]) b.type = 'button';
  const bar = el('div', 'gift-lightbox__bar');
  bar.append(prev, count, next);
  dlg.append(close, img, bar);

  function show() {
    const p = photos[i];
    img.src = p.src;
    img.alt = p.alt;
    count.textContent = `${i + 1} of ${photos.length}`;
    prev.disabled = photos.length < 2;
    next.disabled = photos.length < 2;
  }
  const go = (d) => {
    i = (i + d + photos.length) % photos.length;
    show();
  };
  function done() {
    document.removeEventListener('keydown', onKey, true);
    dlg.remove();
    if (opener && typeof opener.focus === 'function') opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      done();
    } else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      const f = [close, prev, next].filter((b) => !b.disabled);
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }
  let x0 = null;
  dlg.addEventListener('pointerdown', (e) => {
    x0 = e.clientX;
  });
  dlg.addEventListener('pointerup', (e) => {
    if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1);
    x0 = null;
  });
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  close.addEventListener('click', done);
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(dlg);
  show();
  close.focus();
}

/**
 * @param {HTMLElement} container
 * @param {Array<object>} gifts from the server (or the create-page preview)
 * @param {{token?: string|null}} [opts]
 */
export function renderGifts(container, gifts, { token = null } = {}) {
  container.textContent = '';
  if (!gifts || !gifts.length) return;
  container.append(el('h2', 'gifts__title', gifts.length === 1 ? 'Your gift' : 'Your gifts'));

  const photos = gifts
    .filter((g) => g.kind === 'photo')
    .map((g, n) => ({ src: withToken(g.src, token), alt: g.label || `Photo ${n + 1}` }));
  if (photos.length) {
    const grid = el('div', `gift-album gift-album--${Math.min(photos.length, 3)}`);
    photos.forEach((p, n) => {
      const b = el('button', 'gift-album__item');
      b.type = 'button';
      b.setAttribute('aria-label', `Open photo ${n + 1} of ${photos.length}`);
      const img = el('img');
      img.src = p.src;
      img.alt = '';
      img.loading = 'lazy';
      b.append(img);
      b.addEventListener('click', () => openLightbox(photos, n));
      grid.append(b);
    });
    container.append(grid);
  }

  for (const g of gifts) {
    if (g.kind === 'link') {
      const a = el('a', 'gift-card gift-card--link');
      a.href = g.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      let host = '';
      try {
        host = new URL(g.url).hostname.replace(/^www\./, '');
      } catch {
        host = '';
      }
      a.append(el('span', 'gift-card__kicker', 'Link'), el('span', 'gift-card__title', g.label || host), el('span', 'gift-card__meta', `${host} ↗`));
      container.append(a);
    } else if (g.kind === 'code') {
      const card = el('div', 'gift-card gift-card--code');
      card.append(el('span', 'gift-card__kicker', 'Gift card'), el('span', 'gift-card__title', g.label || 'A gift code for you'));
      const codeBox = el('div', 'gift-code');
      const cover = el('button', 'gift-code__cover', 'Tap to reveal the code');
      cover.type = 'button';
      const value = el('code', 'gift-code__value', g.code);
      value.hidden = true;
      const copy = el('button', 'btn btn-ghost gift-code__copy', 'Copy code');
      copy.type = 'button';
      copy.hidden = true;
      const status = el('span', 'gift-code__status');
      status.setAttribute('role', 'status');
      cover.addEventListener('click', () => {
        cover.hidden = true;
        value.hidden = false;
        copy.hidden = false;
        copy.focus();
      });
      copy.addEventListener('click', async () => {
        status.textContent = (await copyText(g.code)) ? 'Copied' : 'Select the code to copy it';
      });
      codeBox.append(cover, value);
      card.append(codeBox, copy, status);
      if (g.url) {
        const redeem = el('a', 'gift-card__action', 'Redeem it ↗');
        redeem.href = g.url;
        redeem.target = '_blank';
        redeem.rel = 'noopener noreferrer';
        card.append(redeem);
      }
      container.append(card);
    } else if (g.kind === 'file') {
      const card = el('div', 'gift-card gift-card--file');
      const isPdf = g.mime === 'application/pdf';
      card.append(
        el('span', 'gift-card__kicker', isPdf ? 'Ticket' : 'File'),
        el('span', 'gift-card__title', g.label || g.name || 'Your ticket'),
        el('span', 'gift-card__meta', [g.name, prettyBytes(g.bytes)].filter(Boolean).join(' · ')),
      );
      const actions = el('div', 'gift-card__actions');
      const view = el('a', 'btn btn-ghost', 'View');
      view.href = withToken(g.src, token);
      view.target = '_blank';
      view.rel = 'noopener noreferrer';
      const dl = el('a', 'btn btn-ghost', 'Download');
      dl.href = withToken(`${g.src}?download=1`, token);
      if (g.name) dl.download = g.name;
      actions.append(view, dl);
      card.append(actions);
      container.append(card);
    }
  }
}

/**
 * Live countdown to `until` using the server's clock (so a wrong phone
 * clock can't open it early or late). Screen readers get a minute-level
 * update, not every second.
 * @param {HTMLElement} container
 * @param {{until:number, serverNow:number, icsHref?:string, label?:string|null, onDone:() => void}} opts
 * @returns {{destroy: () => void}}
 */
export function renderCountdown(container, { until, serverNow, icsHref, label = null, onDone }) {
  container.textContent = '';
  const offset = serverNow * 1000 - Date.now();
  const opens = new Date(until * 1000);
  if (label) {
    container.append(el('p', 'countdown__kicker', 'Counting down to'), el('p', 'countdown__label-big', label));
  } else {
    container.append(el('p', 'countdown__kicker', 'Opens in'));
  }
  const clock = el('div', 'countdown__clock');
  clock.setAttribute('aria-hidden', 'true');
  const units = ['days', 'hours', 'minutes', 'seconds'].map((name) => {
    const box = el('div', 'countdown__unit');
    const num = el('span', 'countdown__num', '0');
    box.append(num, el('span', 'countdown__label', name));
    clock.append(box);
    return num;
  });
  const live = el('p', 'visually-hidden');
  live.setAttribute('aria-live', 'polite');
  const when = el(
    'p',
    'countdown__when',
    opens.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }),
  );
  container.append(clock, live, when);
  if (icsHref) {
    const cal = el('a', 'btn btn-ghost countdown__cal', 'Add to calendar');
    cal.href = icsHref;
    container.append(cal);
  }
  let lastLabel = '';
  let finished = false;
  function tick() {
    const left = until - (Date.now() + offset) / 1000;
    const f = formatCountdown(left);
    [f.d, f.h, f.m, f.s].forEach((v, k) => {
      units[k].textContent = String(v).padStart(k === 0 ? 1 : 2, '0');
    });
    if (f.label !== lastLabel) {
      lastLabel = f.label;
      live.textContent = `Opens in ${f.label}`;
    }
    if (left <= 0 && !finished) {
      finished = true;
      clearInterval(timer);
      onDone();
    }
  }
  const timer = setInterval(tick, 1000);
  tick();
  return { destroy: () => clearInterval(timer) };
}

/**
 * @param {HTMLElement} container
 * @param {{question:string, onSubmit:(answer:string) => Promise<{ok:boolean, error?:string}>}} opts
 */
export function renderSecret(container, { question, onSubmit }) {
  container.textContent = '';
  const form = el('form', 'secret');
  form.noValidate = true;
  form.append(el('p', 'secret__kicker', 'One question first'));
  const label = el('label', 'secret__question', question);
  label.htmlFor = 'secret-answer';
  const input = el('input', 'secret__input');
  input.id = 'secret-answer';
  input.type = 'text';
  input.autocomplete = 'off';
  input.setAttribute('aria-describedby', 'secret-error');
  const error = el('p', 'secret__error');
  error.id = 'secret-error';
  error.setAttribute('role', 'alert');
  const btn = el('button', 'btn btn-primary', 'Open');
  btn.type = 'submit';
  form.append(label, input, error, btn);
  container.append(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.value.trim()) {
      error.textContent = 'Type your answer.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    btn.disabled = true;
    const r = await onSubmit(input.value);
    btn.disabled = false;
    if (!r.ok) {
      error.textContent = r.error || 'Not quite. Try again.';
      input.setAttribute('aria-invalid', 'true');
      input.select();
    }
  });
  input.focus();
}
