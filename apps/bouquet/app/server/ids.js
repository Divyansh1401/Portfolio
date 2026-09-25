/**
 * @file Short opaque ids for bouquets: 8-character base62 strings drawn
 * from a CSPRNG.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 8;

/**
 * Generate an 8-character base62 id using crypto.getRandomValues.
 * @returns {string}
 */
export function makeId() {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Matches a valid id shape (does not check it exists). */
export const ID_RE = /^[0-9A-Za-z]{8}$/;

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isValidId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}
