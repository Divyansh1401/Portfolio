/**
 * @file Validation and security helpers for what a sender tucks inside a
 * bouquet: gifts (photos, links, gift codes, files), the open-on-date lock,
 * the secret question, file-type sniffing for uploads, and the short-lived
 * token that lets a recipient fetch gift files after answering the secret.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { graphemes, normalise } from './text.js';

export const LIMITS = {
  gifts: 8,
  photos: 6,
  photoBytes: 5 * 1024 * 1024,
  fileBytes: 10 * 1024 * 1024,
  label: 60,
  url: 2048,
  code: 64,
  question: 120,
  answer: 60,
  unlockMinAhead: 60,
  unlockMaxAhead: 400 * 24 * 3600,
};

const ALPHANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Random base62 key of `len` chars (never derived from user input). */
export function randomKey(len = 22) {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHANUM[bytes[i] % ALPHANUM.length];
  return out;
}

/**
 * Identify an upload by its first bytes, never by name or client type.
 * @param {Buffer} buf
 * @returns {'image/jpeg'|'image/png'|'image/webp'|'application/pdf'|null}
 */
export function sniffType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return null;
}

/** A filename safe for Content-Disposition and display. */
export function safeName(name, fallback = 'file') {
  const cleaned = String(name || '')
    .replace(/[\\/]/g, '_')
    .replace(/["\r\n\t]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

/**
 * @param {string} str
 * @returns {{ok:true, url:string}|{ok:false}}
 */
export function checkHttpsUrl(str) {
  if (typeof str !== 'string') return { ok: false };
  const trimmed = str.trim();
  if (!trimmed || trimmed.length > LIMITS.url) return { ok: false };
  let u;
  try {
    u = new URL(trimmed);
  } catch {
    return { ok: false };
  }
  if (u.protocol !== 'https:' || !u.hostname) return { ok: false };
  return { ok: true, url: u.toString() };
}

function cleanLabel(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false };
  const v = normalise(raw).replace(/\n/g, ' ');
  if (graphemes(v) > LIMITS.label) return { ok: false };
  return { ok: true, value: v || null };
}

/**
 * Validate the gifts array of a create request. Upload keys must exist,
 * be unclaimed and match the gift kind.
 * @param {unknown} input
 * @param {(key:string) => (object|undefined)} lookupUpload
 * @returns {{ok:true, gifts:Array<object>}|{ok:false, error:string}}
 */
export function validateGifts(input, lookupUpload) {
  if (input === undefined || input === null) return { ok: true, gifts: [] };
  if (!Array.isArray(input)) return { ok: false, error: 'gifts must be a list' };
  if (input.length > LIMITS.gifts) return { ok: false, error: `at most ${LIMITS.gifts} gifts` };
  const out = [];
  const seenKeys = new Set();
  let photos = 0;
  for (const g of input) {
    if (!g || typeof g !== 'object') return { ok: false, error: 'invalid gift' };
    const label = cleanLabel(g.label);
    if (!label.ok) return { ok: false, error: `labels are at most ${LIMITS.label} characters` };
    const base = { id: randomKey(12), kind: g.kind, label: label.value };

    if (g.kind === 'photo' || g.kind === 'file') {
      const key = typeof g.upload_key === 'string' ? g.upload_key : '';
      const up = key ? lookupUpload(key) : undefined;
      if (!up || up.bouquet_id || seenKeys.has(key)) return { ok: false, error: 'that upload is missing or already used' };
      seenKeys.add(key);
      if (g.kind === 'photo') {
        photos++;
        if (photos > LIMITS.photos) return { ok: false, error: `at most ${LIMITS.photos} photos` };
        if (!up.mime.startsWith('image/')) return { ok: false, error: 'photos must be images' };
        if (up.bytes > LIMITS.photoBytes) return { ok: false, error: 'a photo is too large' };
      }
      out.push({ ...base, upload_key: key, mime: up.mime, bytes: up.bytes, name: up.name });
    } else if (g.kind === 'link') {
      const u = checkHttpsUrl(g.url);
      if (!u.ok) return { ok: false, error: 'links must start with https://' };
      out.push({ ...base, url: u.url });
    } else if (g.kind === 'code') {
      const code = typeof g.code === 'string' ? g.code.trim() : '';
      if (!code || code.length > LIMITS.code || /[\x00-\x1f\x7f]/.test(code)) {
        return { ok: false, error: `gift codes are 1 to ${LIMITS.code} characters` };
      }
      let url = null;
      if (g.url) {
        const u = checkHttpsUrl(g.url);
        if (!u.ok) return { ok: false, error: 'redeem links must start with https://' };
        url = u.url;
      }
      out.push({ ...base, code, url });
    } else {
      return { ok: false, error: 'unknown gift type' };
    }
  }
  return { ok: true, gifts: out };
}

/**
 * @param {unknown} raw
 * @param {number} now epoch seconds
 * @returns {{ok:true, value:number|null}|{ok:false, error:string}}
 */
export function validateUnlock(raw, now) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return { ok: false, error: 'invalid date' };
  const t = Math.floor(raw);
  if (t < now + LIMITS.unlockMinAhead) return { ok: false, error: 'pick a time in the future' };
  if (t > now + LIMITS.unlockMaxAhead) return { ok: false, error: 'pick a date within about 13 months' };
  return { ok: true, value: t };
}

/** Normalise an answer so case, spacing and width don't matter. */
export function normaliseAnswer(s) {
  return String(s).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashAnswer(answer, saltHex) {
  return scryptSync(normaliseAnswer(answer), Buffer.from(saltHex, 'hex'), 32).toString('hex');
}

/**
 * @param {unknown} raw {question, answer}
 * @returns {{ok:true, value:null|{q:string, hash:string, salt:string}}|{ok:false, error:string}}
 */
export function validateSecret(raw) {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  if (typeof raw !== 'object') return { ok: false, error: 'invalid secret question' };
  const q = normalise(typeof raw.question === 'string' ? raw.question : '').replace(/\n/g, ' ');
  const a = typeof raw.answer === 'string' ? normaliseAnswer(raw.answer) : '';
  if (!q && !a) return { ok: true, value: null };
  if (!q || graphemes(q) > LIMITS.question) return { ok: false, error: `the question is 1 to ${LIMITS.question} characters` };
  if (!a || graphemes(a) > LIMITS.answer) return { ok: false, error: `the answer is 1 to ${LIMITS.answer} characters` };
  const salt = randomBytes(16).toString('hex');
  return { ok: true, value: { q, hash: hashAnswer(a, salt), salt } };
}

/** Constant-time check of an answer against the stored hash. */
export function checkAnswer(row, answer) {
  if (typeof answer !== 'string' || !row.secret_hash || !row.secret_salt) return false;
  const got = Buffer.from(hashAnswer(answer, row.secret_salt), 'hex');
  const want = Buffer.from(row.secret_hash, 'hex');
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Short-lived tokens that let a recipient who answered the secret fetch
 * gift files. HMAC over id + expiry with a per-process secret (or BQ_SECRET).
 */
export function createTokenSigner(secret) {
  const key = secret || process.env.BQ_SECRET || randomBytes(32).toString('hex');
  const sign = (id, exp) => createHmac('sha256', key).update(`${id}:${exp}`).digest('base64url');
  return {
    issue(id, now, ttl = 6 * 3600) {
      const exp = now + ttl;
      return `${exp}.${sign(id, exp)}`;
    },
    verify(id, token, now) {
      if (typeof token !== 'string') return false;
      const [expStr, sig] = token.split('.');
      const exp = Number(expStr);
      if (!Number.isFinite(exp) || exp <= now || !sig) return false;
      const want = Buffer.from(sign(id, exp));
      const got = Buffer.from(sig);
      return got.length === want.length && timingSafeEqual(got, want);
    },
  };
}

/** Tiny fixed-window rate limiter kept in memory (local server only). */
export function createLimiter({ max, windowS }) {
  const hits = new Map();
  return {
    /** @returns {number} 0 if allowed, else seconds until the window resets */
    hit(key, now) {
      const e = hits.get(key);
      if (!e || now >= e.reset) {
        hits.set(key, { n: 1, reset: now + windowS });
        return 0;
      }
      e.n++;
      return e.n > max ? e.reset - now : 0;
    },
    peek(key, now) {
      const e = hits.get(key);
      return e && now < e.reset && e.n >= max ? e.reset - now : 0;
    },
  };
}
