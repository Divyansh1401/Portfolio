/**
 * @file sessionStorage persistence for the in-progress bouquet draft
 * (CONTRACT §create). Every read/write is wrapped in try/catch — a private
 * window, blocked storage, or a full quota must never break the form.
 */

const KEY = 'bouquet-draft';

/**
 * @typedef {Object} Draft
 * @property {string} mode
 * @property {string} shape
 * @property {string} message
 * @property {string} from_name
 * @property {string} client_nonce
 * @property {string|null} reply_of
 */

/**
 * @returns {Draft|null}
 */
export function loadDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignored — a missing/broken draft just means starting fresh
  }
  return null;
}

/**
 * @param {Draft} draft
 */
export function saveDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // best-effort only — the form still works without persistence
  }
}
