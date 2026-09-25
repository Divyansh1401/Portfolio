/**
 * @file Text normalisation and grapheme counting for user-submitted
 * bouquet messages / names.
 */

const MAX_LINE_BREAKS = 6;

/**
 * Count Unicode grapheme clusters (handles ZWJ sequences, flags, combining
 * marks, Devanagari conjuncts, etc.) via Intl.Segmenter.
 * @param {string} str
 * @returns {number}
 */
export function graphemes(str) {
  if (!str) return 0;
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  let n = 0;
  // eslint-disable-next-line no-unused-vars
  for (const _ of seg.segment(str)) n++;
  return n;
}

/**
 * Normalise free-text input:
 * - CRLF -> LF
 * - strip C0/C1 control chars except \n
 * - strip Unicode format chars (Cf) except ZWJ (U+200D)
 * - collapse 3+ consecutive newlines to 2
 * - cap total line breaks at MAX_LINE_BREAKS (drop trailing lines beyond it)
 * - trim leading/trailing whitespace
 * @param {string} str
 * @returns {string}
 */
export function normalise(str) {
  if (typeof str !== 'string') return '';

  let out = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip control chars (C0 0x00-0x1F excl. \n=0x0A, C1 0x7F-0x9F), keep \n.
  out = Array.from(out)
    .filter((ch) => {
      const cp = ch.codePointAt(0);
      if (cp === 0x0a) return true;
      if (cp <= 0x1f) return false;
      if (cp >= 0x7f && cp <= 0x9f) return false;
      return true;
    })
    .join('');

  // Strip Cf (format) category chars except ZWJ (U+200D).
  out = Array.from(out)
    .filter((ch) => {
      if (ch === '‍') return true;
      return !isFormatChar(ch);
    })
    .join('');

  // Collapse 3+ newlines to 2.
  out = out.replace(/\n{3,}/g, '\n\n');

  // Cap total line breaks.
  const lines = out.split('\n');
  if (lines.length - 1 > MAX_LINE_BREAKS) {
    out = lines.slice(0, MAX_LINE_BREAKS + 1).join('\n');
  }

  return out.trim();
}

const FORMAT_CHAR_RE = /\p{Cf}/u;

/**
 * @param {string} ch single code point
 * @returns {boolean}
 */
function isFormatChar(ch) {
  return FORMAT_CHAR_RE.test(ch);
}
