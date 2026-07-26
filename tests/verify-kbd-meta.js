/**
 * verify-kbd-meta.js — keyboard, focus-management and metadata invariants.
 *
 * Guards the a11y contracts listed in CLAUDE.md "Accessibility & performance
 * invariants": real anchor CTAs, focus-managed dialogs (focus in, Tab trap,
 * focus restore), keyboard-operable polaroid, global :focus-visible, and the
 * share/meta tags on BOTH documents.
 *
 * Run:  node tests/verify-kbd-meta.js [baseUrl]
 * Headless Puppeteer only — the in-app browser pane cannot drive this site.
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const results = [];
const check = (label, pass, detail) => results.push({ label, pass: !!pass, detail });
const wait = ms => new Promise(r => setTimeout(r, ms));
const SETTLE = 1100;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const errors = [];

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => errors.push('[desktop] ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[desktop] ' + m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(SETTLE);

  // ── 1-2: case-study CTAs are REAL links, not JS-only buttons ───────────
  const ctas = await page.evaluate(() =>
    [...document.querySelectorAll('.cs2-cta')].map(a => ({ tag: a.tagName, href: a.getAttribute('href') })));
  check('case-study CTAs exist', ctas.length > 0, ctas.length + ' found');
  check('every case CTA is an <a href="#slug">',
        ctas.length > 0 && ctas.every(c => c.tag === 'A' && /^#/.test(c.href || '')),
        JSON.stringify(ctas.map(c => c.href)));

  // ── 3-4: polaroid is keyboard-operable ─────────────────────────────────
  const pol = await page.evaluate(() => {
    const el = document.getElementById('heroPolaroid');
    return el && { role: el.getAttribute('role'), tabindex: el.getAttribute('tabindex'), label: !!el.getAttribute('aria-label') };
  });
  check('#heroPolaroid has role=button + tabindex', pol && pol.role === 'button' && pol.tabindex !== null,
        pol && ('role=' + pol.role + ' tabindex=' + pol.tabindex));
  check('#heroPolaroid carries an aria-label', pol && pol.label);

  const darkNow = () => page.evaluate(() =>
    getComputedStyle(document.getElementById('alter-ego-content')).display !== 'none');

  // Enter should flip worlds
  await page.evaluate(() => document.getElementById('heroPolaroid').focus());
  await page.keyboard.press('Enter');
  await wait(SETTLE + 600);
  check('Enter on the polaroid flips to the dark world', await darkNow());

  // Space should flip back
  await page.evaluate(() => document.getElementById('heroPolaroid').focus());
  await page.keyboard.press('Space');
  await wait(SETTLE + 600);
  check('Space on the polaroid flips back to light', !(await darkNow()));

  // ── 6-11: overlay dialog semantics + focus management ──────────────────
  const trigger = await page.evaluate(() => {
    const a = document.querySelector('a.cs2-cta[href="#settlr"]');
    if (!a) return null;
    a.id = a.id || '__cta_probe';
    a.focus();
    return document.activeElement.id;
  });
  check('a real CTA can take focus before opening', !!trigger, trigger);

  await page.evaluate(() => { location.hash = '#settlr'; });
  await wait(SETTLE);

  const dlg = await page.evaluate(() => {
    const o = document.getElementById('caseOverlay');
    return {
      role: o.getAttribute('role'),
      modal: o.getAttribute('aria-modal'),
      hidden: o.getAttribute('aria-hidden'),
      label: o.getAttribute('aria-label'),
      focusInside: o.contains(document.activeElement),
      activeCls: document.activeElement && String(document.activeElement.className),
    };
  });
  check('overlay is role=dialog aria-modal=true', dlg.role === 'dialog' && dlg.modal === 'true');
  check('overlay aria-label names the case study', /settlr/i.test(dlg.label || ''), dlg.label);
  check('focus moved INTO the overlay on open', dlg.focusInside, dlg.activeCls);

  // Tab trap: 30 tabs must never escape the dialog
  let escaped = false;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.getElementById('caseOverlay').contains(document.activeElement));
    if (!inside) { escaped = true; break; }
  }
  check('Tab is trapped inside the open dialog (30 presses)', !escaped);

  // Shift+Tab likewise
  let escapedBack = false;
  for (let i = 0; i < 15; i++) {
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    const inside = await page.evaluate(() =>
      document.getElementById('caseOverlay').contains(document.activeElement));
    if (!inside) { escapedBack = true; break; }
  }
  check('Shift+Tab is trapped too (15 presses)', !escapedBack);

  // Escape closes, and focus is RESTORED to the trigger
  await page.keyboard.press('Escape');
  await wait(SETTLE);
  const afterClose = await page.evaluate(() => ({
    open: document.getElementById('caseOverlay').classList.contains('is-open'),
    hidden: document.getElementById('caseOverlay').getAttribute('aria-hidden'),
    activeId: document.activeElement && document.activeElement.id,
    unlocked: document.body.style.overflow !== 'hidden',
  }));
  check('Escape closes the dialog', !afterClose.open);
  check('closed dialog is aria-hidden=true', afterClose.hidden === 'true', afterClose.hidden);
  check('focus restored to the triggering element', afterClose.activeId === trigger, afterClose.activeId);
  check('body scroll lock released on close', afterClose.unlocked);

  // ── 12: same-origin iframe forwards Escape to the parent ───────────────
  await page.evaluate(() => { location.hash = '#settlr'; });
  await wait(SETTLE + 900);
  const iframeEsc = await page.evaluate(async () => {
    const f = document.querySelector('.overlay-body iframe');
    if (!f) return 'no-iframe';
    try {
      const d = f.contentDocument;
      if (!d) return 'no-access';
      d.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 900));
      return document.getElementById('caseOverlay').classList.contains('is-open') ? 'still-open' : 'closed';
    } catch (e) { return 'threw:' + e.message; }
  });
  check('Escape inside a same-origin iframe closes the overlay', iframeEsc === 'closed', iframeEsc);
  await page.evaluate(() => { location.hash = ''; });
  await wait(SETTLE);

  // ── 13: global :focus-visible outline exists ───────────────────────────
  const fv = await page.evaluate(() =>
    [...document.styleSheets].some(ss => {
      try { return [...ss.cssRules].some(r => r.selectorText && r.selectorText.includes(':focus-visible')); }
      catch { return false; }
    }));
  check('a :focus-visible rule is defined', fv);

  // ── 14-16: share/meta tags on BOTH documents ──────────────────────────
  async function meta(url, tag) {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push('[' + tag + '] ' + e.message));
    // Both docs ship a viewport router that redirects across the 1024px line,
    // so size the window to match the document under test or it bounces.
    await pg.setViewport(tag === 'mobile' ? { width: 420, height: 900 } : { width: 1440, height: 900 });
    await pg.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(600);
    const m = await pg.evaluate(() => ({
      landed: location.pathname,
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      twitter: document.querySelector('meta[name="twitter:card"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      themeColor: document.querySelector('meta[name="theme-color"]')?.content,
      jsonLd: !!document.querySelector('script[type="application/ld+json"]'),
    }));
    await pg.close();
    return m;
  }

  const dm = await meta(BASE + '/', 'desktop');
  check('desktop: title + description + theme-color present',
        !!dm.title && !!dm.desc && !!dm.themeColor);
  check('desktop: OG title/image/url + twitter card + canonical + JSON-LD',
        !!dm.ogTitle && !!dm.ogImage && !!dm.ogUrl && !!dm.twitter && !!dm.canonical && dm.jsonLd,
        'ogImage=' + dm.ogImage);
  check('desktop: og:image is an ABSOLUTE url', /^https?:\/\//.test(dm.ogImage || ''), dm.ogImage);

  const mm = await meta(BASE + '/mobile.html', 'mobile');
  check('mobile: OG + twitter + canonical + JSON-LD present',
        !!mm.ogTitle && !!mm.ogImage && !!mm.twitter && !!mm.canonical && mm.jsonLd,
        'landed=' + mm.landed);

  // ── Report ─────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  results.forEach(r => console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.label + (r.detail ? '  [' + r.detail + ']' : '')));
  console.log('\n' + passed + '/' + results.length + ' passed');
  console.log('console/page errors: ' + errors.length);
  errors.slice(0, 10).forEach(e => console.log('  ! ' + e));

  await browser.close();
  process.exit(passed === results.length && errors.length === 0 ? 0 : 1);
})();
