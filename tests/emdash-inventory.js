/**
 * emdash-inventory.js — deterministic em-dash census for the two shipped docs.
 *
 * Classifies every em dash as comment / attribute / visible so a copy pass can
 * target only what a reader actually sees. Comment state is tracked across
 * lines (CSS/JS block comments and HTML comments span lines), because a
 * per-line "does it start with *" guess misclassifies continuation lines.
 *
 *   node tests/emdash-inventory.js            # summary
 *   node tests/emdash-inventory.js --json     # full records
 *   node tests/emdash-inventory.js --check    # exit 1 on any UNAPPROVED reader-facing one
 */
const fs = require('fs');
const path = require('path');

const FILES = ['index.html', 'mobile.html'];

// Em dashes we deliberately KEPT after the 2026-07-26 copy pass, because a
// reviewer argued removal made the copy worse. Matched by content, not line
// number, so edits elsewhere don't invalidate the allowlist. Adding to this
// list should be a conscious decision, not a way to silence the check.
const APPROVED = [
  'Scroll — each project stacks over the last.',  // bare imperative, beat, payoff:
                                                 // a colon here reads as instruction-manual register
];
const ROOT = path.join(__dirname, '..');
const DASH = '—';

// Attributes whose text reaches a reader (search results, link previews, AT).
const TEXT_ATTRS = /(?:alt|aria-label|title|content|data-caption|placeholder)="([^"]*)"/g;

function classify(src) {
  const out = [];
  let inBlock = false;   // /* ... */
  let inHtml = false;    // <!-- ... -->
  const lines = src.split('\n');

  lines.forEach((line, idx) => {
    // Walk the line character by character so a dash's own position decides
    // its class — one line can hold both code and a trailing comment.
    let i = 0, state = [];
    // Every consumed character MUST push exactly one state entry, delimiters
    // included: skipping them shifts the array left and misclassifies every
    // dash after it on the line (CSS comments read as visible copy).
    const push = (n, kind) => { for (let k = 0; k < n; k++) state.push(kind); i += n; };
    while (i < line.length) {
      const two = line.slice(i, i + 2);
      if (!inBlock && !inHtml && line.slice(i, i + 4) === '<!--') { inHtml = true; push(4, 'comment'); continue; }
      if (inHtml && line.slice(i, i + 3) === '-->') { inHtml = false; push(3, 'comment'); continue; }
      if (!inHtml && !inBlock && two === '/*') { inBlock = true; push(2, 'comment'); continue; }
      if (inBlock && two === '*/') { inBlock = false; push(2, 'comment'); continue; }
      // `//` is a comment only outside a string/URL — require whitespace or
      // line start before it so "https://" never counts.
      if (!inBlock && !inHtml && two === '//' && /(^|\s)$/.test(line.slice(0, i))) {
        state.push(...Array(line.length - i).fill('comment'));
        break;
      }
      state.push(inBlock || inHtml ? 'comment' : 'code');
      i++;
    }
    while (state.length < line.length) state.push(inBlock || inHtml ? 'comment' : 'code');

    // Attribute spans get re-marked over the top of 'code'.
    let m;
    TEXT_ATTRS.lastIndex = 0;
    while ((m = TEXT_ATTRS.exec(line))) {
      const start = m.index + m[0].indexOf('"') + 1;
      for (let k = start; k < start + m[1].length; k++) if (state[k] === 'code') state[k] = 'attr';
    }

    for (let c = 0; c < line.length; c++) {
      if (line[c] !== DASH) continue;
      const kind = state[c] === 'comment' ? 'comment' : state[c] === 'attr' ? 'attr' : 'visible';
      // Decorative separators: the site's own idiom is `·`, so flag them
      // separately from prose — they need a different fix.
      const around = line.slice(Math.max(0, c - 12), c + 13);
      const decorative = /&nbsp;—&nbsp;|·\s*—|—\s*·/.test(around);
      out.push({ line: idx + 1, col: c + 1, kind, decorative,
                 context: line.trim().slice(0, 160) });
    }
  });
  return out;
}

const all = {};
for (const f of FILES) all[f] = classify(fs.readFileSync(path.join(ROOT, f), 'utf8'));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(all, null, 2));
} else {
  let targets = 0;
  for (const f of FILES) {
    const r = all[f];
    const by = k => r.filter(x => x.kind === k).length;
    const inScope = r.filter(x => x.kind !== 'comment');
    targets += inScope.length;
    console.log(`${f}: ${r.length} total — visible ${by('visible')}, attr ${by('attr')}, comment ${by('comment')}` +
                `  |  IN SCOPE: ${inScope.length} (decorative ${inScope.filter(x => x.decorative).length})`);
  }
  console.log(`\nIn-scope total (visible + attr, comments excluded): ${targets}`);
  if (process.argv.includes('--check')) {
    const unapproved = [];
    for (const f of FILES) {
      for (const r of all[f].filter(x => x.kind !== 'comment')) {
        if (!APPROVED.some(a => r.context.includes(a))) unapproved.push(`${f}:${r.line}  ${r.context.slice(0, 110)}`);
      }
    }
    if (unapproved.length) {
      console.log(`\nCHECK FAIL — ${unapproved.length} unapproved reader-facing em dash(es):`);
      unapproved.forEach(u => console.log('  ' + u));
    } else {
      console.log(`\nCHECK PASS — ${targets} reader-facing em dash(es), all on the approved list.`);
    }
    process.exit(unapproved.length === 0 ? 0 : 1);
  }
}
