/**
 * @file Pure input checks shared by the create page (and node tests):
 * https links, gift codes, local date+time to epoch seconds, countdowns.
 */

/**
 * @param {string} str
 * @returns {{ok:true, url:string, host:string}|{ok:false, error:string}}
 */
export function validateLink(str) {
  const s = String(str || '').trim();
  if (!s) return { ok: false, error: 'Paste a link.' };
  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, error: 'That doesn’t look like a link.' };
  }
  if (u.protocol !== 'https:') return { ok: false, error: 'Links must start with https://' };
  return { ok: true, url: u.toString(), host: u.hostname.replace(/^www\./, '') };
}

/** @returns {{ok:true, code:string}|{ok:false, error:string}} */
export function validateCode(str) {
  const s = String(str || '').trim();
  if (!s) return { ok: false, error: 'Add the code.' };
  if (s.length > 64) return { ok: false, error: 'Codes are at most 64 characters.' };
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(s)) return { ok: false, error: 'That code has hidden characters.' };
  return { ok: true, code: s };
}

/**
 * 'YYYY-MM-DD' + 'HH:MM' in the browser's own time zone -> epoch seconds.
 * @returns {number|null}
 */
export function localDateTimeToUnix(dateStr, timeStr) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr || '');
  if (!d || !t) return null;
  const when = new Date(+d[1], +d[2] - 1, +d[3], +t[1], +t[2], 0, 0);
  const ms = when.getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

/**
 * @param {number} seconds remaining (clamped at 0)
 * @returns {{d:number, h:number, m:number, s:number, label:string}}
 */
export function formatCountdown(seconds) {
  let r = Math.max(0, Math.floor(seconds));
  const d = Math.floor(r / 86400);
  r -= d * 86400;
  const h = Math.floor(r / 3600);
  r -= h * 3600;
  const m = Math.floor(r / 60);
  const s = r - m * 60;
  const parts = [];
  if (d) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  if (d || h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  return { d, h, m, s, label: parts.join(', ') };
}
