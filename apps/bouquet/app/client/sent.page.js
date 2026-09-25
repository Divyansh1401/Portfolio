/**
 * @file Client entry for /b/:id/sent. Renders a landed still of the
 * bouquet, offers copy/share/WhatsApp actions on the full link, and polls
 * /api/bouquet/:id/status while the tab is visible, stopping once opened.
 */

import { createModel } from '../../packages/renderer/src/core.js';
import { paint } from '../../packages/renderer/src/painter-canvas.js';
import { paletteFor } from '../../packages/modes/modes.js';
import { SHAPES, DEFAULT_SHAPE } from '../../packages/renderer/src/shapes.js';

/** Default poll interval while the tab is visible and unopened. */
const DEFAULT_POLL_MS = 15000;

/**
 * @returns {{id:string, mode:string, shape:string, from_name:string|null, url:string}}
 */
function readData() {
  const el = document.getElementById('bouquet-data');
  try {
    return JSON.parse(el ? el.textContent : '{}');
  } catch {
    return {};
  }
}

/**
 * Paint a single landed (p=1, q=0, yaw=0) still of the bouquet onto `canvas`.
 * @param {HTMLCanvasElement} canvas
 * @param {string} mode
 * @param {string} shape
 */
function paintStill(canvas, mode, shape) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const palette = paletteFor(mode);
  const params = SHAPES[shape] || SHAPES[DEFAULT_SHAPE] || {};
  const model = createModel({ palette, params });
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.parentNode ? canvas.parentNode.clientWidth || canvas.width : canvas.width;
  const cssH = cssW;
  const dims = model.layout({ cssW, cssH, dpr });
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = dims.width;
  canvas.height = dims.height;
  model.set({ p: 1, q: 0, yaw: 0 });
  paint(ctx, model.frame());
}

/**
 * Copy `text` to the clipboard, falling back to a hidden textarea + execCommand
 * when the async Clipboard API is unavailable or rejects.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function main() {
  const data = readData();
  const fullUrl = data.url ? new URL(data.url, location.origin).toString() : location.href;

  const canvas = document.getElementById('sent-still');
  if (canvas) {
    try {
      paintStill(canvas, data.mode || 'rose', data.shape || DEFAULT_SHAPE);
    } catch {
      // Rendering the still is decorative; the page still works without it.
    }
  }

  const linkInput = document.getElementById('sent-link');
  if (linkInput) linkInput.value = fullUrl;

  const openYourself = document.getElementById('sent-open-yourself');
  if (openYourself && data.url) openYourself.href = data.url;

  const copyStatus = document.getElementById('sent-copy-status');
  const copyBtn = document.getElementById('sent-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(fullUrl);
      if (copyStatus) copyStatus.textContent = ok ? 'Copied' : 'Could not copy — select and copy manually';
    });
  }

  const shareBtn = document.getElementById('sent-share');
  if (shareBtn) {
    if (typeof navigator.share === 'function') {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', () => {
        // Never awaited in a way that blocks the UI; a rejection (e.g. the
        // person cancels the share sheet) is swallowed.
        navigator
          .share({ title: 'A bouquet for you', text: 'A bouquet for you', url: fullUrl })
          .catch(() => {});
      });
    }
  }

  const whatsapp = document.getElementById('sent-whatsapp');
  if (whatsapp) {
    const text = `A bouquet for you: ${fullUrl}`;
    whatsapp.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  const openedLine = document.getElementById('sent-opened-line');
  if (openedLine && data.id) {
    const params = new URLSearchParams(location.search);
    const pollOverride = Number(params.get('poll'));
    const pollMs = Number.isFinite(pollOverride) && pollOverride > 0 ? pollOverride : DEFAULT_POLL_MS;

    let stopped = false;
    let timer = null;

    async function checkStatus() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/bouquet/${encodeURIComponent(data.id)}/status`);
        if (res.ok) {
          const body = await res.json();
          if (body.opened_at) {
            openedLine.textContent = 'Opened';
            stopped = true;
            if (timer) clearInterval(timer);
            return;
          }
        }
      } catch {
        // network hiccup — try again on the next tick
      }
    }

    function startPolling() {
      if (stopped || timer) return;
      timer = setInterval(checkStatus, pollMs);
      checkStatus();
    }

    function stopPolling() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    });

    if (document.visibilityState === 'visible') startPolling();
  }
}

main();
