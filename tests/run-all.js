/**
 * run-all.js — the pre-push gate.
 *
 * CLAUDE.md: "Both suites + zero console errors is the bar for any
 * interaction change." This runs them in sequence and exits non-zero if any
 * check fails, so it can gate a push.
 *
 *   node tests/run-all.js [baseUrl]      # default http://localhost:3457
 *
 * Requires the dev server: npx serve -p 3457 .
 */
const { spawnSync } = require('child_process');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:3457';
const SUITES = ['verify-deeplinks.js', 'verify-kbd-meta.js', 'verify-eased-scroll.js', 'verify-cards.js', 'verify-mobile-cta.js', 'verify-statusbar.js', 'verify-fonts.js', 'verify-payload.js'];

// Fail fast with a clear message rather than 4 confusing navigation timeouts.
const probe = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', BASE + '/'], { encoding: 'utf8' });
if (probe.stdout.trim() !== '200') {
  console.error('Dev server not answering at ' + BASE + ' (got "' + probe.stdout.trim() + '").');
  console.error('Start it with:  npx serve -p 3457 .');
  process.exit(2);
}

let failed = 0;

// Copy guard: no unapproved reader-facing em dashes (see emdash-inventory.js).
{
  console.log('\n' + '='.repeat(68) + '\n  emdash-inventory.js --check\n' + '='.repeat(68));
  const r = spawnSync(process.execPath, [path.join(__dirname, 'emdash-inventory.js'), '--check'], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

for (const s of SUITES) {
  console.log('\n' + '='.repeat(68) + '\n  ' + s + '\n' + '='.repeat(68));
  const r = spawnSync(process.execPath, [path.join(__dirname, s), BASE], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

console.log('\n' + '='.repeat(68));
console.log(failed === 0
  ? 'ALL SUITES PASSED — clear to push.'
  : failed + ' suite(s) FAILED — do not push.');
process.exit(failed === 0 ? 0 : 1);
