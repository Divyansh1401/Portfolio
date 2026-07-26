/**
 * verify-mobile-cta.js — the desktop-only case-study CTAs on mobile.html.
 *
 * index.html's head router sends any viewport under 1024px back to
 * mobile.html, so a plain <a href="index.html#slug"> BOUNCES the reader to the
 * post they are already reading. These CTAs say "on desktop" and copy the
 * canonical URL instead.
 *
 * Deliberately not navigator.share: it exists in some webviews but never
 * settles, leaving the tap with no feedback at all (it hung this very harness
 * for two minutes). Clipboard is deterministic.
 *
 * Run:  node tests/verify-mobile-cta.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');
const BASE = process.argv[2] || 'http://localhost:3457';
let failures = 0;
const ok = (l,c,d) => { if (!c) failures++; console.log((c?'PASS  ':'FAIL  ')+l+(d?'  ['+d+']':'')); };
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
  // Wait for the handler to actually be attached rather than guessing a delay:
  // a fixed settle raced the script on cold runs and made this suite flaky.
  await p.waitForFunction(() => !!document.querySelector('.pa-link-cta--desktop') &&
                                !!document.getElementById('toast'), { timeout: 8000 });
  await new Promise(r => setTimeout(r, 400));

  const ctas = await p.evaluate(() => [...document.querySelectorAll('.pa-link-cta--desktop')].map(a => ({
    text: a.textContent.trim(), href: a.getAttribute('href'), name: a.dataset.desktopCase })));
  ok('two desktop-only CTAs present', ctas.length === 2, ctas.length + '');
  ok('label says it opens on desktop', ctas.every(c => /on desktop$/i.test(c.text)), ctas.map(c=>c.text).join(' | '));
  ok('href is the canonical absolute URL', ctas.every(c => /^https:\/\/www\.divyanshrastogi\.in\/#/.test(c.href)),
     ctas.map(c=>c.href).join(' | '));
  ok('still a real <a> (long-press share/copy works)', await p.evaluate(() =>
     [...document.querySelectorAll('.pa-link-cta--desktop')].every(a => a.tagName === 'A')));

  // Stub clipboard.writeText: headless can't readText without a focused
  // document, and what we actually care about is the value the page passes.
  await p.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = v => { window.__copied = v; return Promise.resolve(); };
  });

  // Tap: must NOT navigate, must copy + toast
  const before = p.url();
  await p.evaluate(() => document.querySelector('#settlr .pa-link-cta--desktop').click());
  await p.waitForFunction(() => document.getElementById('toast').classList.contains('show'),
                          { timeout: 4000 }).catch(() => {});
  const after = p.url();
  ok('tap does NOT bounce back to the feed', before === after, before + ' -> ' + after);

  const toast = await p.evaluate(() => {
    const t = document.getElementById('toast');
    return { shown: t.classList.contains('show'), text: t.textContent };
  });
  ok('toast confirms the copy', toast.shown && /desktop/i.test(toast.text), toast.text);

  const clip = await p.evaluate(() => window.__copied);
  ok('clipboard holds the desktop case-study URL', clip === 'https://www.divyanshrastogi.in/#settlr', clip);

  // toast auto-hides, and email copy still works afterwards
  await new Promise(r => setTimeout(r, 2300));
  ok('toast auto-hides', !(await p.evaluate(() => document.getElementById('toast').classList.contains('show'))));
  await p.evaluate(() => document.getElementById('copyEmail').click());
  await new Promise(r => setTimeout(r, 500));
  const em = await p.evaluate(() => ({ t: document.getElementById('toast').textContent,
                                       shown: document.getElementById('toast').classList.contains('show') }));
  ok('email copy still works (shared toast not broken)', em.shown && /email/i.test(em.t), em.t);

  console.log('\nconsole errors: ' + errors.length);
  errors.slice(0,5).forEach(e=>console.log('  ! '+e));
  await p.evaluate(() => document.getElementById('settlr').scrollIntoView({block:'center'}));
  await new Promise(r=>setTimeout(r,400));
  await b.close();
  process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
})();
