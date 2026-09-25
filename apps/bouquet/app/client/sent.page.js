/**
 * @file Client entry for /b/:id/sent. Renders a landed still of the
 * bouquet, offers copy/share/WhatsApp actions on the full link, and polls
 * /api/bouquet/:id/status while the tab is visible, stopping once opened.
 */

import { formatAmount } from '../../packages/pricing/pricing.js';
import { paintStill } from './still.js';

/** Default poll interval while the tab is visible and unopened. */
const DEFAULT_POLL_MS = 15000;

/**
 * @returns {{id:string, mode:string, from_name:string|null, url:string}}
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

const DATE_FMT = { day: 'numeric', month: 'long', year: 'numeric' };
const DATE_TIME_FMT = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };

/**
 * The sender's receipt: what is inside, any lock, what they paid and how
 * long the link lasts. Built from /status, never from the page data.
 * @param {HTMLElement|null} dl
 * @param {{unlock_at?:number|null, has_secret?:boolean, gift_count?:number,
 *   expires_at?:number|null, paid?:number|boolean, payment?:{amount:number, currency:string}|null}} s
 */
function renderDetails(dl, s) {
  if (!dl) return;
  const rows = [];
  if (s.gift_count) rows.push(['Inside', `${s.gift_count} gift${s.gift_count === 1 ? '' : 's'}`]);
  if (s.unlock_at) {
    const when = new Date(s.unlock_at * 1000).toLocaleString(undefined, DATE_TIME_FMT);
    rows.push(['Opens', s.unlock_label ? `${when} (${s.unlock_label})` : when]);
  }
  if (s.has_secret) rows.push(['Secret question', "On. Make sure they'll know the answer."]);
  if (s.payment) rows.push(['Paid', `${formatAmount(s.payment.currency, s.payment.amount)} (test payment)`]);
  else rows.push(['Paid', 'Free']);
  if (s.expires_at) rows.push(['Link works until', new Date(s.expires_at * 1000).toLocaleDateString(undefined, DATE_FMT)]);
  dl.textContent = '';
  for (const [k, v] of rows) {
    const row = document.createElement('div');
    row.className = 'sent__detail';
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    row.append(dt, dd);
    dl.append(row);
  }
  dl.hidden = false;
}

function main() {
  const data = readData();
  const fullUrl = data.url ? new URL(data.url, location.origin).toString() : location.href;

  const canvas = document.getElementById('sent-still');
  if (canvas) {
    try {
      paintStill(canvas, data.mode || 'rose');
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
    let detailsShown = false;

    async function checkStatus() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/bouquet/${encodeURIComponent(data.id)}/status`);
        if (res.ok) {
          const body = await res.json();
          if (!detailsShown) {
            detailsShown = true;
            renderDetails(document.getElementById('sent-details'), body);
          }
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
