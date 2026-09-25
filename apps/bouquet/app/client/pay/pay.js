/**
 * @file Client side of pricing and the (pretend, for now) checkout. The
 * server decides prices and whether payment is needed; this only asks.
 */

import { guessCurrency, formatAmount } from '../../../packages/pricing/pricing.js';

export { formatAmount };

const CURRENCY_KEY = 'bq-currency';

async function call(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Couldn't reach the server." } };
  }
}

export const fetchPricing = () => call('GET', '/api/pricing');
export const startCheckout = (id, currency, amount) => call('POST', `/api/checkout/${encodeURIComponent(id)}`, { currency, amount });
export const pretendConfirm = (id, orderId, outcome) =>
  call('POST', `/api/checkout/${encodeURIComponent(id)}/confirm`, { order_id: orderId, outcome });
export const sendAsRose = (id) => call('POST', `/api/bouquet/${encodeURIComponent(id)}/as-rose`);

/** @returns {'INR'|'USD'} the saved choice, else a guess from time zone + languages */
export function detectCurrency() {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved === 'INR' || saved === 'USD') return saved;
  } catch {
    // storage blocked: fall back to the guess
  }
  let timeZone;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  return guessCurrency({ timeZone, languages: navigator.languages || [navigator.language] });
}

/** @param {'INR'|'USD'} currency */
export function saveCurrency(currency) {
  try {
    localStorage.setItem(CURRENCY_KEY, currency);
  } catch {
    // best-effort only
  }
}
