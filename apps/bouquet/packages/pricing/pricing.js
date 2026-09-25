/**
 * @file Pure pricing rules for the bouquet app (pay-what-you-want,
 * free-flower/free-limit gating). No I/O, no DOM, no deps — safe to import
 * from both server code and node:test files. See PRICING / CHECKOUT
 * CONTRACT P1 in the build brief for the exact shape this module must have.
 */

/** The one flower mode that can be free. */
export const FREE_FLOWER = 'rose';

/** Every other mode is paid from day one. */
export const PAID_FLOWERS = ['sunflower', 'lavender', 'marigold', 'hydrangea'];

/** How many LIVE (non-draft) messages the site allows for free before the
 * free flower also starts requiring payment. */
export const DEFAULT_FREE_LIMIT = 100;

/** Pay-what-you-want amount ladders, in the currency's smallest *display*
 * unit (whole rupees / whole dollars — this product never charges paise or
 * cents). All amounts unlock the same message. */
export const AMOUNTS = {
  INR: [30, 50, 100, 150],
  USD: [2, 5, 10, 15],
};

/** Currency symbol used by `formatAmount`. */
export const CURRENCY_SYMBOL = {
  INR: '₹',
  USD: '$',
};

/**
 * Whether creating a bouquet in `mode` requires payment right now.
 * @param {{mode:string, liveCount:number, freeLimit?:number}} opts
 * @returns {boolean}
 */
export function needsPayment({ mode, liveCount, freeLimit = DEFAULT_FREE_LIMIT }) {
  if (mode !== FREE_FLOWER) return true;
  return liveCount >= freeLimit;
}

/**
 * @param {string} currency 'INR' | 'USD'
 * @param {number} amount
 * @returns {boolean}
 */
export function isValidAmount(currency, amount) {
  const ladder = AMOUNTS[currency];
  if (!ladder) return false;
  return ladder.includes(amount);
}

/**
 * Best-effort guess at which currency ladder to show a visitor, from
 * client-reported locale hints. Defaults to USD for everyone outside India.
 * @param {{timeZone?:string, languages?:string[]}} hints
 * @returns {'INR'|'USD'}
 */
export function guessCurrency({ timeZone, languages } = {}) {
  if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return 'INR';
  if (Array.isArray(languages) && languages.some((l) => typeof l === 'string' && /-IN$/i.test(l))) {
    return 'INR';
  }
  return 'USD';
}

/**
 * @param {string} currency 'INR' | 'USD'
 * @param {number} amount
 * @returns {string} e.g. '₹30' or '$2'
 */
export function formatAmount(currency, amount) {
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  return `${symbol}${amount}`;
}
