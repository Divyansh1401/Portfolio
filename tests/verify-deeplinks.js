/**
 * verify-deeplinks.js — 20 checks on hash routing (index.html).
 *
 * The hash is the source of truth for all overlay/world state (see CLAUDE.md
 * "Deep links"). This suite asserts every supported target, both as a cold
 * load and as a live hashchange, plus Back/Forward and history hygiene.
 *
 * Run:  node tests/verify-deeplinks.js            (expects the dev server up)
 *       node tests/verify-deeplinks.js http://localhost:3457
 *
 * The in-app browser pane throttles rAF and CANNOT drive this site — always
 * headless Puppeteer. Resolved from the settlr project's node_modules.
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const results = [];
const check = (label, pass, detail) => results.push({ label, pass: !!pass, detail });

// Overlay transitions + the alter-ego blob wipe are ~650-900ms; give routing
// room to finish rather than racing it.
const SETTLE = 1100;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function state(page) {
  return page.evaluate(() => ({
    hash: location.hash,
    caseOpen: document.getElementById('caseOverlay').classList.contains('is-open'),
    caseSlug: document.querySelector('.overlay-body').dataset.case || null,
    caseAriaHidden: document.getElementById('caseOverlay').getAttribute('aria-hidden'),
    resumeOpen: document.getElementById('resumeOverlay').classList.contains('is-open'),
    // `alterEgoMode` is a script-scope `let`, NOT on window — probe the DOM
    // signal instead: setAlterEgoMode swaps display on the two world roots.
    alterEgo: getComputedStyle(document.getElementById('alter-ego-content')).display !== 'none',
    bodyLocked: document.body.style.overflow === 'hidden',
    lightboxOpen: document.getElementById('photo-lightbox').classList.contains('active'),
  }));
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const errors = [];

  async function fresh(hash) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('pageerror', e => errors.push('[' + (hash || 'root') + '] ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('[' + (hash || 'root') + '] ' + m.text()); });
    // domcontentloaded, NOT networkidle2: the dark world lazy-loads 42 rotor
    // shots and the case overlays 30+ images each, so the network never goes
    // idle inside the default 30s. Routing only needs the script to have run.
    await page.goto(BASE + '/' + hash, { waitUntil: 'domcontentloaded' });
    await wait(SETTLE + 400); // cold load also runs routeHash(true) after every init
    return page;
  }

  // ── 1-6: cold loads land in the right state ────────────────────────────
  let p = await fresh('#settlr');
  let s = await state(p);
  check('cold #settlr opens the Settlr overlay', s.caseOpen && s.caseSlug === 'settlr', s.caseSlug);
  check('cold #settlr locks body scroll', s.bodyLocked);
  check('cold #settlr sets aria-hidden=false', s.caseAriaHidden === 'false', s.caseAriaHidden);
  await p.close();

  p = await fresh('#refer-earn');
  s = await state(p);
  check('cold #refer-earn opens that overlay', s.caseOpen && s.caseSlug === 'refer-earn', s.caseSlug);
  await p.close();

  p = await fresh('#resume');
  s = await state(p);
  check('cold #resume opens the resume overlay', s.resumeOpen && !s.caseOpen);
  await p.close();

  p = await fresh('#hobbies');
  s = await state(p);
  check('cold #hobbies enters the dark world', s.alterEgo);
  await p.close();

  // ── 7-8: #photo-N enters dark world AND opens the lightbox (1-based) ────
  p = await fresh('#photo-3');
  s = await state(p);
  check('cold #photo-3 enters the dark world', s.alterEgo);
  check('cold #photo-3 opens the lightbox', s.lightboxOpen);
  await p.close();

  // ── 9-10: #kinko is gated — scrolls to the card, opens NO overlay ───────
  p = await fresh('#kinko');
  s = await state(p);
  check('#kinko opens no overlay (NDA-gated)', !s.caseOpen && !s.resumeOpen);
  const kinkoVisible = await p.evaluate(() => {
    const el = document.getElementById('cs2-kinko-title');
    if (!el) return false;
    const b = el.getBoundingClientRect();
    return b.top > -200 && b.top < window.innerHeight + 200;
  });
  check('#kinko scrolled the locked card into view', kinkoVisible);
  await p.close();

  // ── 11: #connect is a native anchor — no overlay, page scrolled ─────────
  p = await fresh('#connect');
  s = await state(p);
  const scrolled = await p.evaluate(() => window.scrollY > 100);
  check('#connect scrolls natively, opens nothing', !s.caseOpen && !s.resumeOpen && scrolled);
  await p.close();

  // ── 12-20: live hashchange routing on one long-lived page ──────────────
  p = await fresh('');
  const setHash = async h => { await p.evaluate(x => { location.hash = x; }, h); await wait(SETTLE); };

  await setHash('#settlr');
  s = await state(p);
  check('live #settlr opens overlay', s.caseOpen && s.caseSlug === 'settlr');

  // Case -> case must swap content, not stack overlays
  await setHash('#refer-earn');
  s = await state(p);
  check('case -> case swaps slug in place', s.caseOpen && s.caseSlug === 'refer-earn', s.caseSlug);

  // Case -> resume must close the case first
  await setHash('#resume');
  s = await state(p);
  check('case -> resume closes the case', s.resumeOpen && !s.caseOpen);

  // Resume -> dark world
  await setHash('#hobbies');
  s = await state(p);
  check('resume -> #hobbies closes resume, enters dark', s.alterEgo && !s.resumeOpen);

  // Dark -> #kinko must return to the LIGHT world (card lives there)
  await setHash('#kinko');
  s = await state(p);
  check('#kinko from dark world returns to light', !s.alterEgo);

  // Empty hash closes everything
  await setHash('#settlr');
  await setHash('');
  s = await state(p);
  check('empty hash closes all overlays', !s.caseOpen && !s.resumeOpen);
  check('empty hash releases body scroll lock', !s.bodyLocked);

  // ── Back / Forward ─────────────────────────────────────────────────────
  await setHash('#settlr');
  await p.goBack({ waitUntil: 'domcontentloaded' }); await wait(SETTLE);
  s = await state(p);
  check('Back closes the overlay', !s.caseOpen, s.hash);

  await p.goForward({ waitUntil: 'domcontentloaded' }); await wait(SETTLE);
  s = await state(p);
  check('Forward re-opens the overlay', s.caseOpen && s.caseSlug === 'settlr', s.hash);

  // ── History hygiene: a polaroid flip must replaceState, not push ────────
  const lenBefore = await p.evaluate(() => history.length);
  await p.evaluate(() => { location.hash = ''; });
  await wait(SETTLE);
  await p.evaluate(() => {
    const pol = document.getElementById('heroPolaroid');
    if (pol) pol.click();
  });
  await wait(SETTLE + 500);
  const lenAfter = await p.evaluate(() => history.length);
  check('polaroid flip does not spam history (replaceState)', lenAfter - lenBefore <= 1,
        'history ' + lenBefore + ' -> ' + lenAfter);
  await p.close();

  // ── Report ─────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  results.forEach(r => console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.label + (r.detail ? '  [' + r.detail + ']' : '')));
  console.log('\n' + passed + '/' + results.length + ' passed');
  console.log('console/page errors: ' + errors.length);
  errors.slice(0, 10).forEach(e => console.log('  ! ' + e));

  await browser.close();
  process.exit(passed === results.length && errors.length === 0 ? 0 : 1);
})();
