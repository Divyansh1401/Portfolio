/**
 * @file /b/:id — the recipient page. A port of the owner's birthday page
 * (reference/birthday/birthday.html): same gate, same 5 s fly-in, same
 * scroll timeline (hold, disperse, dome, one word per scroll, countdown),
 * same scratch-foil card with tilt and confetti. What changes:
 *
 * - the bouquet is our renderer (the same v6 code) drawn straight onto a
 *   canvas, in the sender's flower colours, instead of an iframe;
 * - the words are the sender's note (then "from <name>");
 * - the countdown counts to the sender's date ("until <occasion>") and is
 *   skipped when there is none;
 * - under the foil is the first gift, with every gift one tap away;
 * - a quiz (the secret question) sits on the gate when the sender set one.
 *
 * What is locked is decided by the server: a quiz keeps the note and gifts
 * out of the page until answered; a countdown keeps only the gifts out
 * until it ends. `/preview` runs this same page, filled over postMessage by
 * the create page.
 */

import { createModel } from '../../packages/renderer/src/core.js';
import { paint } from '../../packages/renderer/src/painter-canvas.js';
import { MODES, paletteFor } from '../../packages/modes/modes.js';
import { renderGifts } from './gifts/view.js';

// ---------------------------------------------------------------------------
// Timeline — the birthday page's, in viewport-heights of scroll.
// ---------------------------------------------------------------------------
const FLY_MS = 5000;   // birthday page: 5000 ms, 1 turn (measured smoother than 3000)
const YAW_IN = -540;   // the loader's camera sweep
const T = {
  holdEnd: 0.70,   // bouquet sits still
  dispEnd: 1.90,   // q 0 -> 1, cubes leave the frame
  bulgeIn: 1.78,   // the dome starts just before the last cube goes
  bulgeEnd: 3.40,  // 1.6 viewports for the swell, deliberately slow
  wordStart: 3.40,
  wordSpan: 0.75,  // per word, deliberately slow (shortened for long notes)
};

const $ = (s) => document.querySelector(s);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const soft = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
const lerp = (a, b, u) => a + (b - a) * u;
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Colour: the birthday page's crimson-on-blush, per flower.
// ---------------------------------------------------------------------------
function rgbOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
function mix(hex, toward, amt) {
  const a = rgbOf(hex);
  const b = rgbOf(toward);
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * amt).toString(16).padStart(2, '0')).join('')}`;
}

function themeFor(modeId) {
  const mode = MODES.find((m) => m.id === modeId) || MODES[0];
  const blush = mode.bouquet.petals[2];
  const crimson = mode.bouquet.petals[0];
  const paper = '#ffffff';
  // The words and the pill sit on the dome AND on white: the birthday page
  // measured crimson at 3.40:1 on blush, which clears large text (3.0).
  const pick = (list, min) => list.find((c) => contrast(c, blush) >= min && contrast(c, paper) >= min) || mode.ui.ink;
  const ink = pick([crimson, mode.ui.accent, mode.ui.accentStrong, mode.ui.ink], 3);
  const inkStrong = pick([mode.ui.accentStrong, mode.ui.ink], 4.5);
  return { mode, blush, crimson, paper, ink, inkStrong, cream: '#F1E6D6' };
}

function applyTheme(th) {
  const r = document.documentElement.style;
  r.setProperty('--blush', th.blush);
  r.setProperty('--crimson', th.crimson);
  r.setProperty('--ink', th.ink);
  r.setProperty('--ink-strong', th.inkStrong);
  r.setProperty('--shadow-rgb', rgbOf(th.inkStrong).join(', '));
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
function readData() {
  try {
    return JSON.parse(document.getElementById('bq-data').textContent || '{}');
  } catch {
    return {};
  }
}

// Same-origin frames talk with their own origin as the target. An opaque
// origin ("null", e.g. a sandboxed host) cannot be named as a target, so it
// falls back to "*"; every receiver still checks the sender's window.
const FRAME_TARGET = location.origin === 'null' ? '*' : location.origin;

function fromParent(e) {
  return e.source === parent && e.origin === location.origin;
}

function waitForPreviewData() {
  return new Promise((resolve) => {
    addEventListener('message', function onMsg(e) {
      if (!fromParent(e) || !e.data || e.data.type !== 'bq-preview') return;
      removeEventListener('message', onMsg);
      resolve(e.data.payload);
    });
    try {
      parent.postMessage({ type: 'bq-preview-ready' }, FRAME_TARGET);
    } catch {
      // not framed
    }
  });
}

async function main() {
  let data = readData();
  const preview = !!data.preview;
  if (preview) data = { ...(await waitForPreviewData()), preview: true };
  run(data, preview);
}

function run(data, preview) {
  const th = themeFor(data.mode);
  document.documentElement.dataset.mode = th.mode.id;
  applyTheme(th);
  const idPath = encodeURIComponent(data.id || '');

  // ---- state ---------------------------------------------------------------
  let content = data.content || null; // {message, token, gifts|null}
  let answer = null;                  // kept in memory to fetch gifts later
  let until = data.locked && data.locked.until ? data.locked.until : null;
  const label = data.locked && data.locked.label ? data.locked.label : null;
  const serverOffset = data.server_now ? data.server_now * 1000 - Date.now() : 0;
  const hasClock = !!until;

  // DAY latches when the clock runs out; HAND is the clock-to-card handover,
  // 0 to 1. Without a clock the card is simply there (HAND = 1).
  let DAY = !hasClock;
  let HAND = hasClock ? 0 : 1;

  // ---- the end pill ---------------------------------------------------------
  const sendBack = $('#send-back');
  if (preview) {
    sendBack.removeAttribute('href');
    $('#make-own').removeAttribute('href');
  } else if (data.id) {
    sendBack.href = `/?reply=${idPath}`;
  }

  // ---- gate ------------------------------------------------------------------
  const gate = $('#gate');
  const openBtn = $('#open');
  const quiz = $('#quiz');
  const quizInput = $('#quiz-answer');
  const quizError = $('#quiz-error');
  document.documentElement.classList.add('locked');
  if (data.from_name) {
    $('#gate-from').textContent = `from ${data.from_name}`;
    $('#gate-from').hidden = false;
  }
  const needsQuiz = !preview && !content && data.locked && data.locked.secret;
  if (needsQuiz) {
    quiz.hidden = false;
    $('#quiz-q').textContent = data.locked.secret;
  }

  async function postUnlock(ans) {
    try {
      const res = await fetch(`/api/bouquet/${idPath}/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ans === null || ans === undefined ? {} : { answer: ans }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 200 && body.content) return { ok: true, body };
      if (res.status === 200 && body.wrong) return { ok: false, error: 'not quite, try again' };
      if (res.status === 429) {
        const mins = Math.max(1, Math.ceil((body.retry_after || 60) / 60));
        return { ok: false, error: `too many tries, wait ${mins} min` };
      }
      return { ok: false, error: 'something went wrong, try again' };
    } catch {
      return { ok: false, error: 'no connection, try again' };
    }
  }

  // ---- words ----------------------------------------------------------------
  const wordsBox = $('#words');
  let wordEls = [];
  let wordSpan = T.wordSpan;

  function buildWords() {
    const words = String(content.message || '').split(/\s+/).filter(Boolean);
    if (data.from_name) words.push('from', ...String(data.from_name).split(/\s+/).filter(Boolean));
    wordsBox.textContent = '';
    wordEls = words.map((w) => {
      const b = document.createElement('b');
      b.textContent = w;
      wordsBox.appendChild(b);
      return b;
    });
    // A long note keeps each word a real scroll beat but caps the section at
    // about twelve viewports.
    wordSpan = wordEls.length > 16 ? Math.max(0.4, 12 / wordEls.length) : T.wordSpan;
    const sr = $('#note-sr');
    sr.textContent = '';
    const p = document.createElement('p');
    p.textContent = content.message || '';
    sr.append(p);
    if (data.from_name) {
      const f = document.createElement('p');
      f.textContent = `From ${data.from_name}`;
      sr.append(f);
    }
    sr.hidden = false;
    fitWords();
    layoutTrack();
  }

  // Size to the LONGEST word, measured at a known size (advance is linear in
  // font-size), so the widest fits with air. One size for all: calmer.
  function fitWords() {
    if (!wordEls.length) return;
    const BASE = 100;
    const AIR = 0.86;
    const MAX_H = 0.22;
    const root = document.documentElement.style;
    root.setProperty('--wordSize', `${BASE}px`);
    let maxW = 0;
    for (const el of wordEls) maxW = Math.max(maxW, el.scrollWidth);
    if (!maxW) return;
    const size = Math.min((BASE * (innerWidth * AIR)) / maxW, innerHeight * MAX_H, 176);
    root.setProperty('--wordSize', `${size.toFixed(1)}px`);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);

  let wordEnd = T.wordStart;
  let cdIn = T.wordStart + 0.55;
  function layoutTrack() {
    wordEnd = T.wordStart + wordEls.length * wordSpan;
    cdIn = wordEnd + 0.55;
    const track = cdIn + 1.3;
    document.documentElement.style.setProperty('--track', `${(track + 1) * 100}vh`);
  }
  layoutTrack();

  // ---- clock ------------------------------------------------------------------
  const cdEl = $('#cd');
  $('#cdTitle').textContent = `until ${label || 'the day'}`;
  const cal = $('#cal');
  if (hasClock && !preview && data.id) cal.href = `/b/${idPath}/calendar.ics`;
  else cal.hidden = true;
  const UNITS = [['days', 2], ['hours', 2], ['minutes', 2], ['seconds', 2]];
  const cells = UNITS.map(([name, width]) => {
    const u = document.createElement('div');
    u.className = 'unit';
    const n = document.createElement('div');
    n.className = 'num';
    const digs = Array.from({ length: width }, () => {
      const d = document.createElement('span');
      d.className = 'dig';
      n.appendChild(d);
      return d;
    });
    const c = document.createElement('div');
    c.className = 'cap';
    c.textContent = name;
    u.append(n, c);
    $('#clock').appendChild(u);
    return digs;
  });
  let lastLive = '';
  let clockBooted = false;
  let clockTimer = null;

  function tickClock() {
    if (!hasClock) return;
    const ms = until * 1000 - (Date.now() + serverOffset);
    const s = Math.max(0, Math.floor(ms / 1000));
    const v = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    cells.forEach((digs, i) => {
      const str = String(v[i]).padStart(digs.length, '0');
      digs.forEach((d, j) => {
        if (d.textContent !== str[j]) d.textContent = str[j];
      });
    });
    const live = v[0] ? `${v[0]} days ${v[1]} hours left` : v[1] ? `${v[1]} hours ${v[2]} minutes left` : `${v[2]} minutes left`;
    if (live !== lastLive) {
      lastLive = live;
      $('#cd-live').textContent = live;
    }
    if (ms <= 0 && !DAY) {
      DAY = true;
      clearInterval(clockTimer);
      // Watching it run out: animate. Opened after it already had: done.
      dayArrived(clockBooted);
    }
  }
  if (hasClock) {
    tickClock();
    clockBooted = true;
    clockTimer = setInterval(tickClock, 250);
  }

  // The day came: fetch the gifts (the server kept them out until now).
  let dayPending = false;
  async function dayArrived(animate) {
    // Ran out while they were still on the quiz: finish once it's answered.
    if (!content) {
      dayPending = true;
      return;
    }
    if (preview || content.gifts) return giftsReady(animate);
    for (let attempt = 0; attempt < 6; attempt++) {
      const r = await postUnlock(answer);
      if (r.ok && r.body.content.gifts) {
        content = r.body.content;
        return giftsReady(animate);
      }
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
  }

  // ---- card -------------------------------------------------------------------
  const wrapEl = $('#cardWrap');
  const qcardEl = $('#qcard');
  const cvEl = $('#scratch');
  const cctx = cvEl.getContext('2d', { willReadFrequently: true });
  const endEl = $('#end');
  let revealed = false;
  let painting = false;
  let lastPt = null;
  let cardReady = false;

  const HEART = new Path2D(
    'M50 86 C26 68 10 53 10 36 C10 21 21 12 32 12 C41 12 47 17 50 24 C53 17 59 12 68 12 C79 12 90 21 90 36 C90 53 74 68 50 86 Z',
  );

  function gifts() {
    return (content && content.gifts) || [];
  }

  function withToken(src) {
    const t = content && content.token;
    return t ? `${src}${src.includes('?') ? '&' : '?'}t=${encodeURIComponent(t)}` : src;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /** What sits under the foil: the first gift, laid out for the card. */
  function buildFace() {
    const face = $('#face');
    face.textContent = '';
    face.className = 'face';
    const list = gifts();
    const g = list[0];
    const qtop = $('#qtop');
    qtop.textContent = list.length > 1 ? `1 of ${list.length} gifts` : 'for you';
    if (!g) return;
    if (g.kind === 'photo') {
      face.classList.add('face--photo');
      const img = el('img', 'face__photo');
      img.src = withToken(g.src);
      img.alt = g.label || 'A photo for you';
      face.append(img);
    } else if (g.kind === 'link') {
      const a = el('a', 'pill pill--small', 'open ↗');
      a.href = g.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      face.append(el('p', 'face__kicker', 'a link for you'), el('p', 'face__title', g.label || hostOf(g.url)), el('p', 'face__meta', hostOf(g.url)), a);
    } else if (g.kind === 'code') {
      const code = el('code', 'face__code', g.code);
      const copy = el('button', 'pill pill--small', 'copy');
      copy.type = 'button';
      const status = el('p', 'face__status');
      status.setAttribute('role', 'status');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(g.code);
          status.textContent = 'copied';
        } catch {
          status.textContent = 'select the code to copy it';
        }
      });
      const actions = el('div', 'face__actions');
      actions.append(copy);
      if (g.url) {
        const r = el('a', 'pill pill--small', 'redeem ↗');
        r.href = g.url;
        r.target = '_blank';
        r.rel = 'noopener noreferrer';
        actions.append(r);
      }
      face.append(el('p', 'face__kicker', 'gift card'), el('p', 'face__title', g.label || 'a gift for you'), code, actions, status);
    } else if (g.kind === 'file') {
      const isPdf = g.mime === 'application/pdf';
      const view = el('a', 'pill pill--small', 'view');
      view.href = withToken(g.src);
      view.target = '_blank';
      view.rel = 'noopener noreferrer';
      const dl = el('a', 'pill pill--small', 'download');
      dl.href = withToken(`${g.src}?download=1`);
      if (g.name) dl.download = g.name;
      const actions = el('div', 'face__actions');
      actions.append(view, dl);
      face.append(el('p', 'face__kicker', isPdf ? 'your ticket' : 'a file for you'), el('p', 'face__title', g.label || g.name || 'your ticket'), actions);
    }
    const qcap = $('#qcap');
    if (list.length > 1) {
      qcap.textContent = `see all ${list.length} gifts`;
      qcap.hidden = false;
    } else if (g.kind === 'photo') {
      qcap.textContent = 'view photo';
      qcap.hidden = false;
    }
  }

  function paintCoat() {
    const r = qcardEl.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 3);
    cvEl.width = Math.round(w * dpr);
    cvEl.height = Math.round(h * dpr);
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cctx.globalCompositeOperation = 'source-over';
    cctx.clearRect(0, 0, w, h);

    const base = th.crimson;
    const g = cctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, mix(base, '#ffffff', 0.22));
    g.addColorStop(0.34, base);
    g.addColorStop(0.52, mix(base, '#000000', 0.14));
    g.addColorStop(0.72, base);
    g.addColorStop(1, mix(base, '#000000', 0.28));
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, w, h);

    const step = w / 3.6; // hearts, tiled and barely there
    cctx.save();
    cctx.globalAlpha = 0.085;
    cctx.fillStyle = '#FFF1F5';
    for (let row = -1, i = 0; row * step < h + step; row++, i++) {
      for (let col = -1; col * step < w + step; col++) {
        cctx.save();
        cctx.translate(col * step + (i % 2 ? step / 2 : 0), row * step);
        cctx.translate(step * 0.33, step * 0.3);
        cctx.scale((step * 0.34) / 100, (step * 0.34) / 100);
        cctx.fill(HEART);
        cctx.restore();
      }
    }
    cctx.restore();

    const sh = cctx.createLinearGradient(0, h, w, 0); // one soft sheen band
    sh.addColorStop(0.36, 'rgba(255,255,255,0)');
    sh.addColorStop(0.5, 'rgba(255,255,255,.17)');
    sh.addColorStop(0.64, 'rgba(255,255,255,0)');
    cctx.fillStyle = sh;
    cctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 1800; i++) { // tooth, so it reads as foil
      cctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})`;
      cctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }

    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillStyle = 'rgba(255,241,245,.94)';
    const fs = Math.max(13, w * 0.052);
    cctx.font = `${fs}px 'Mon Cheri', Georgia, serif`;
    cctx.letterSpacing = `${fs * 0.3}px`;
    cctx.fillText('SCRATCH ME', w / 2 + fs * 0.15, h / 2 + fs * 1.5);
    cctx.save();
    cctx.translate(w / 2 - (w * 0.085) / 2, h / 2 - w * 0.1);
    cctx.scale((w * 0.085) / 100, (w * 0.085) / 100);
    cctx.fill(HEART);
    cctx.restore();

    painting = false;
    lastPt = null;
  }

  function scratchAt(x, y) {
    cctx.globalCompositeOperation = 'destination-out';
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';
    cctx.lineWidth = Math.max(30, Math.min(qcardEl.clientWidth, qcardEl.clientHeight) * 0.17);
    cctx.beginPath();
    if (lastPt) cctx.moveTo(lastPt.x, lastPt.y);
    else cctx.moveTo(x - 0.1, y - 0.1);
    cctx.lineTo(x, y);
    cctx.stroke();
    lastPt = { x, y };
  }

  // Coarse grid: reading every pixel on every pointermove makes it lag.
  function clearedFraction() {
    const w = cvEl.width;
    const h = cvEl.height;
    if (!w) return 0;
    const d = cctx.getImageData(0, 0, w, h).data;
    let clear = 0;
    let seen = 0;
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        if (d[(y * w + x) * 4 + 3] < 24) clear++;
        seen++;
      }
    }
    return clear / seen;
  }

  // ---- tilt (React Bits' TiltedCard spring: k 100, c 30, m 2) ---------------
  const TILT = { amp: 10, hoverScale: 1.05, k: 100, c: 30, m: 2 };
  const tilt = { rx: 0, ry: 0, sc: 1, vx: 0, vy: 0, vs: 0, tx: 0, ty: 0, ts: 1 };
  let tiltRaf = 0;
  let tiltLast = 0;

  function tiltStep(now) {
    const dt = Math.min(0.032, (now - tiltLast) / 1000) || 0.016;
    tiltLast = now;
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const hh = dt / steps;
    for (let i = 0; i < steps; i++) {
      for (const [pos, vel, target] of [['rx', 'vx', 'tx'], ['ry', 'vy', 'ty'], ['sc', 'vs', 'ts']]) {
        const a = (-TILT.k * (tilt[pos] - tilt[target]) - TILT.c * tilt[vel]) / TILT.m;
        tilt[vel] += a * hh;
        tilt[pos] += tilt[vel] * hh;
      }
    }
    qcardEl.style.transform = `rotateX(${tilt.rx.toFixed(3)}deg) rotateY(${tilt.ry.toFixed(3)}deg) scale(${tilt.sc.toFixed(4)})`;
    const settled =
      Math.abs(tilt.rx - tilt.tx) < 0.01 && Math.abs(tilt.ry - tilt.ty) < 0.01 &&
      Math.abs(tilt.sc - tilt.ts) < 0.0005 && Math.abs(tilt.vx) < 0.01 &&
      Math.abs(tilt.vy) < 0.01 && Math.abs(tilt.vs) < 0.001;
    tiltRaf = settled ? 0 : requestAnimationFrame(tiltStep);
  }
  function tiltTo(rx, ry, sc) {
    tilt.tx = rx;
    tilt.ty = ry;
    tilt.ts = sc;
    if (!tiltRaf) {
      tiltLast = performance.now();
      tiltRaf = requestAnimationFrame(tiltStep);
    }
  }
  if (!REDUCED) {
    wrapEl.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = wrapEl.getBoundingClientRect();
      const ox = e.clientX - r.left - r.width / 2;
      const oy = e.clientY - r.top - r.height / 2;
      tiltTo((oy / (r.height / 2)) * -TILT.amp, (ox / (r.width / 2)) * TILT.amp, TILT.hoverScale);
    });
    wrapEl.addEventListener('pointerleave', () => tiltTo(0, 0, 1));
  }

  // Screen point -> card point on a leaning card: the perspective + rotate +
  // scale chain on a plane is a 3x3 homography; invert it (exact).
  function cardHomography() {
    const P = new DOMMatrix();
    P.m34 = -1 / 800;
    const M = P.multiply(new DOMMatrix().rotateAxisAngle(1, 0, 0, tilt.rx).rotateAxisAngle(0, 1, 0, tilt.ry).scale(tilt.sc));
    return [M.m11, M.m21, M.m41, M.m12, M.m22, M.m42, M.m14, M.m24, M.m44];
  }
  function inv3(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h;
    const B = -(d * i - f * g);
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    if (!det) return null;
    const s = 1 / det;
    return [A * s, -(b * i - c * h) * s, (b * f - c * e) * s, B * s, (a * i - c * g) * s, -(a * f - c * d) * s, C * s, -(a * h - b * g) * s, (a * e - b * d) * s];
  }
  function ptOf(e) {
    const r = wrapEl.getBoundingClientRect();
    const W = r.width;
    const H = r.height;
    const sx = e.clientX - r.left - W / 2;
    const sy = e.clientY - r.top - H / 2;
    const inv = inv3(cardHomography());
    if (!inv) return { x: sx + W / 2, y: sy + H / 2 };
    const w = inv[6] * sx + inv[7] * sy + inv[8];
    return { x: (inv[0] * sx + inv[1] * sy + inv[2]) / w + W / 2, y: (inv[3] * sx + inv[4] * sy + inv[5]) / w + H / 2 };
  }

  cvEl.addEventListener('pointerdown', (e) => {
    if (revealed) return;
    painting = true;
    lastPt = null;
    try {
      cvEl.setPointerCapture(e.pointerId);
    } catch {
      // best-effort
    }
    const q = ptOf(e);
    scratchAt(q.x, q.y);
  });
  cvEl.addEventListener('pointermove', (e) => {
    if (!painting || revealed) return;
    const q = ptOf(e);
    scratchAt(q.x, q.y);
  });
  cvEl.addEventListener('pointerup', () => {
    painting = false;
    lastPt = null;
    if (revealed) return;
    // Half is the mark; the confetti takes the rest of the foil.
    if (clearedFraction() >= 0.5) revealCard();
  });
  // Keyboard / assistive tech: the foil can also be taken off with a key.
  cvEl.tabIndex = 0;
  cvEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      revealCard();
    }
  });

  function revealCard() {
    if (revealed) return;
    revealed = true;
    if (!REDUCED) confettiBurst();
    cvEl.classList.add('done');
    cvEl.tabIndex = -1;
    wrapEl.classList.add('done');
    endEl.classList.add('live');
    render();
    const first = $('#face').querySelector('a, button') || $('#qcap');
    if (first && !first.hidden) first.focus({ preventScroll: true });
  }

  // ---- confetti: the page's colours, thrown from the card -----------------
  const conf = $('#confetti');
  const cctx2 = conf.getContext('2d');
  const CONF_COLS = [th.crimson, th.blush, th.inkStrong, th.cream, '#FFFFFF'];
  let confBits = [];
  let confRaf = 0;
  let confLast = 0;
  function confettiBurst() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    conf.style.display = 'block';
    conf.width = Math.round(innerWidth * dpr);
    conf.height = Math.round(innerHeight * dpr);
    cctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = wrapEl.getBoundingClientRect();
    const ox = r.left + r.width / 2;
    const oy = r.top + r.height / 2;
    confBits = [];
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 260 + Math.random() * 620;
      confBits.push({
        x: ox + (Math.random() - 0.5) * r.width * 0.8,
        y: oy + (Math.random() - 0.5) * r.height * 0.5,
        vx: Math.cos(a) * sp * 0.55,
        vy: Math.sin(a) * sp - 260,
        w: 5 + Math.random() * 7,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 12,
        col: CONF_COLS[(Math.random() * CONF_COLS.length) | 0],
        life: 1,
      });
    }
    confLast = performance.now();
    if (!confRaf) confRaf = requestAnimationFrame(confStep);
  }
  function confStep(now) {
    const dt = Math.min(0.032, (now - confLast) / 1000) || 0.016;
    confLast = now;
    cctx2.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const b of confBits) {
      b.vy += 1350 * dt;
      b.vx *= 0.988;
      b.vy *= 0.992;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.y > innerHeight + 40) b.life = 0;
      else b.life = Math.max(0, b.life - dt * 0.28);
      if (b.life <= 0) continue;
      alive++;
      cctx2.save();
      cctx2.translate(b.x, b.y);
      cctx2.rotate(b.rot);
      cctx2.globalAlpha = Math.min(1, b.life * 1.6);
      cctx2.fillStyle = b.col;
      const k = Math.abs(Math.cos(b.rot * 1.7));
      cctx2.fillRect(-b.w / 2, (-b.h / 2) * k, b.w, b.h * k);
      cctx2.restore();
    }
    if (alive) confRaf = requestAnimationFrame(confStep);
    else {
      confRaf = 0;
      conf.style.display = 'none';
      cctx2.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  // ---- all gifts in a sheet ---------------------------------------------------
  const sheet = $('#gift-sheet');
  let sheetOpener = null;
  function openSheet() {
    sheetOpener = document.activeElement;
    renderGifts($('#gift-sheet-body'), gifts(), { token: content && content.token });
    sheet.hidden = false;
    $('#gift-sheet-close').focus();
  }
  function closeSheet() {
    sheet.hidden = true;
    if (sheetOpener && sheetOpener.focus) sheetOpener.focus({ preventScroll: true });
  }
  $('#qcap').addEventListener('click', openSheet);
  $('#gift-sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.querySelector('.gift-lightbox')) closeSheet();
  });

  // ---- handover: clock -> card, driven by the clock, not by scroll ----------
  const HAND_MS = 1100;
  function giftsReady(animate) {
    const hasGifts = gifts().length > 0;
    if (hasGifts && !cardReady) {
      cardReady = true;
      buildFace();
      wrapEl.classList.add('live');
      requestAnimationFrame(paintCoat); // needs the card laid out
    }
    if (!hasGifts) endEl.classList.add('centre');
    if (!animate || REDUCED) {
      HAND = 1;
      render();
      return;
    }
    const t0 = performance.now();
    (function step() {
      const e = performance.now() - t0;
      HAND = soft(Math.min(1, e / HAND_MS));
      render();
      if (e < HAND_MS) requestAnimationFrame(step);
    })();
  }

  // ---- the bouquet ----------------------------------------------------------
  const canvas = $('#bq');
  const ctx = canvas.getContext('2d', { alpha: true });
  const model = createModel({ palette: paletteFor(th.mode.id), turns: 1, ms: FLY_MS });
  let P = 0;
  let Q = 0;
  let YAW = 0;
  let flying = false;
  let flyDone = false;
  let QMAX = 1;
  let dirty = true;

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const vp = { cssW: innerWidth, cssH: innerHeight, dpr };
    canvas.width = Math.round(vp.cssW * dpr);
    canvas.height = Math.round(vp.cssH * dpr);
    model.layout(vp);
    dirty = true;
  }
  function draw() {
    const yaw = flying ? YAW_IN * (1 - P) : YAW;
    model.set({ p: P, q: Q, yaw });
    paint(ctx, model.frame());
    dirty = false;
  }
  // The smallest q with nothing left on screen: past it the scroll would do
  // nothing (the birthday page measured a fifth of the dispersal dead).
  function measureClearQ() {
    const onscreenAt = (q) => {
      model.set({ p: 1, q, yaw: YAW });
      return model.frame().onscreen;
    };
    if (onscreenAt(1) > 0) {
      QMAX = 1;
      return;
    }
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      if (onscreenAt(mid) === 0) hi = mid;
      else lo = mid;
    }
    QMAX = Math.min(1, hi + 0.02);
    dirty = true;
  }
  layout();

  function unlockScroll() {
    document.documentElement.classList.remove('locked');
    flyDone = true;
    render();
  }

  function startFly() {
    if (REDUCED) {
      P = 1;
      draw();
      measureClearQ();
      unlockScroll();
      return;
    }
    flying = true;
    const t0 = performance.now();
    (function fly() {
      const e = performance.now() - t0;
      P = Math.min(1, e / FLY_MS);
      draw();
      if (e < FLY_MS) requestAnimationFrame(fly);
      else {
        flying = false;
        P = 1;
        measureClearQ();
        draw();
        unlockScroll();
      }
    })();
  }

  let opened = false;
  function openIt() {
    if (opened) return;
    opened = true;
    buildWords();
    if (!hasClock) giftsReady(false);
    gate.classList.add('go');
    if (!preview && data.id) {
      try {
        fetch(`/api/open/${idPath}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kind: 'input' }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // best-effort only
      }
    }
    // wait for the fade before the first cube moves, so the two never overlap
    const wait = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gate-ms')) || 620;
    setTimeout(startFly, REDUCED ? 0 : wait);
    setTimeout(() => gate.setAttribute('hidden', ''), wait + 50);
  }

  openBtn.addEventListener('click', async () => {
    if (content) return openIt();
    if (!needsQuiz) return;
    quiz.requestSubmit();
  });
  quiz.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = quizInput.value;
    if (!val.trim()) {
      quizError.textContent = 'type your answer';
      quizInput.focus();
      return;
    }
    openBtn.disabled = true;
    const r = await postUnlock(val);
    openBtn.disabled = false;
    if (!r.ok) {
      quizError.textContent = r.error;
      quiz.classList.remove('is-wrong');
      void quiz.offsetWidth;
      quiz.classList.add('is-wrong');
      quizInput.select();
      return;
    }
    answer = val;
    content = r.body.content;
    openIt();
    if (dayPending) dayArrived(false);
  });

  // ---- scroll -> state ------------------------------------------------------
  let raf = 0;
  let hidden = false;
  const hintEl = $('#hint');
  const bulgeEl = $('#bulge');
  const clipEl = $('#bqclip');

  function render() {
    raf = 0;
    const t = scrollY / innerHeight;

    // 1. dispersal
    if (flyDone) {
      const q = seg(t, T.holdEnd, T.dispEnd) * QMAX;
      if (Math.abs(q - Q) > 0.0005 || dirty) {
        Q = q;
        if (!hidden) draw();
      }
    }

    // 2. the hint fades the moment they start
    hintEl.style.opacity = flyDone ? (1 - seg(t, 0.04, 0.3)).toFixed(3) : '0';

    // 3. the dome
    const bu = soft(seg(t, T.bulgeIn, T.bulgeEnd));
    bulgeEl.style.transform = `scaleY(${bu.toFixed(4)})`;
    const shouldHide = bu >= 0.78; // the dome covers the viewport from 0.722
    if (shouldHide !== hidden) {
      hidden = shouldHide;
      clipEl.style.visibility = hidden ? 'hidden' : 'visible';
      if (!hidden) dirty = true;
    }

    // 4. the note, one word per scroll
    for (let i = 0; i < wordEls.length; i++) {
      const a = T.wordStart + i * wordSpan;
      const u = seg(t, a, a + wordSpan);
      const inU = seg(u, 0, 0.34);
      const outU = seg(u, 0.66, 1);
      const w = wordEls[i];
      if (u <= 0 || u >= 1) {
        if (w.style.opacity !== '0') w.style.opacity = '0';
        continue;
      }
      w.style.opacity = (soft(inU) * (1 - soft(outU))).toFixed(3);
      if (!REDUCED) {
        const y = lerp(30, -30, soft(u));
        const s = lerp(0.978, 1.022, u);
        w.style.transform = `translateY(${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
      }
    }

    // 5. the countdown arrives on scroll and leaves on the clock
    const cd = soft(seg(t, cdIn - 0.55, cdIn));
    if (hasClock) {
      const o = cd * (1 - HAND);
      cdEl.style.opacity = o.toFixed(3);
      cdEl.classList.toggle('live', o > 0.9);
      if (!REDUCED) cdEl.style.transform = `translateY(${lerp(26, 0, cd).toFixed(1)}px)`;
    }

    // 6. the card takes the beat the clock just left
    const show = cd * HAND;
    if (cardReady) {
      wrapEl.style.opacity = show.toFixed(3);
      wrapEl.style.pointerEvents = show > 0.9 ? 'auto' : 'none';
      if (!REDUCED) wrapEl.style.transform = `translate(-50%,-50%) translateY(${lerp(18, 0, HAND).toFixed(1)}px)`;
      endEl.style.opacity = revealed ? show.toFixed(3) : '0';
      endEl.classList.toggle('live', revealed && show > 0.9);
    } else if (DAY) {
      endEl.style.opacity = show.toFixed(3);
      endEl.classList.toggle('live', show > 0.9);
    }
  }

  // ---- yaw: horizontal drag / wheel turns the bouquet; vertical is scroll --
  const stage = $('#stage');
  const YAW_PER_PX = 0.42;
  const LOCK_PX = 12;
  let ydrag = null;
  function yawTo(v) {
    YAW = v;
    if (!hidden) draw();
  }
  stage.addEventListener('pointerdown', (e) => {
    if (hidden || !flyDone) return;
    if (e.target.closest && e.target.closest('#cardWrap, #end, #cd')) return;
    ydrag = { x: e.clientX, y: e.clientY, yaw0: YAW, axis: null };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!ydrag) return;
    const dx = e.clientX - ydrag.x;
    const dy = e.clientY - ydrag.y;
    if (ydrag.axis === null) {
      if (Math.hypot(dx, dy) < LOCK_PX) return;
      ydrag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (ydrag.axis !== 'x') return;
    e.preventDefault();
    yawTo(ydrag.yaw0 + dx * YAW_PER_PX);
  }, { passive: false });
  const endYaw = () => {
    ydrag = null;
  };
  stage.addEventListener('pointerup', endYaw);
  stage.addEventListener('pointercancel', endYaw);
  stage.addEventListener('wheel', (e) => {
    if (hidden || !flyDone) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    yawTo(YAW + e.deltaX * 0.25);
  }, { passive: false });

  addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(render);
  }, { passive: true });
  let resizeT = null;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      layout();
      fitWords();
      if (flyDone) measureClearQ();
      if (!flying) draw();
      if (cardReady && !revealed) paintCoat();
      render();
    }, 100);
  });

  // ---- preview: skip the countdown -------------------------------------------
  if (preview) {
    const skip = $('#skip-cd');
    if (hasClock) {
      $('#preview-bar').hidden = false;
      skip.hidden = false;
      skip.addEventListener('click', () => {
        until = Math.floor((Date.now() + serverOffset) / 1000);
        skip.hidden = true;
        tickClock();
      });
    }
    addEventListener('message', (e) => {
      if (fromParent(e) && e.data && e.data.type === 'bq-preview-close') {
        clearInterval(clockTimer);
      }
    });
    // Escape closes the preview (key events do not cross the frame).
    addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !sheet.hidden || document.querySelector('.gift-lightbox')) return;
      try {
        parent.postMessage({ type: 'bq-preview-escape' }, FRAME_TARGET);
      } catch {
        // not framed
      }
    });
  }

  draw();
  render();
}

main();
