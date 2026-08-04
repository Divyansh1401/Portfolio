/**
 * verify-analytics.js — the PostHog integration's live contract.
 *
 * PH_KEY is now set, so this asserts the ACTIVE behaviour rather than the
 * inert one. Four things matter, and all four fail silently in production:
 *
 * 1. COOKIELESS. The whole reason this site needs no consent banner is that
 *    cookieless_mode:'always' writes nothing to cookies or local/sessionStorage.
 *    If a PostHog upgrade or a config typo re-enabled persistence, the site
 *    would quietly start needing a GDPR banner it does not have. This is the
 *    single most important assertion in the file.
 *
 * 2. THE ROUTER GUARD. index.html replaces the document below 1024px and
 *    mobile.html above it. Loading analytics before that redirect logs a
 *    phantom pageview plus an instant bounce for EVERY visitor on the other
 *    form factor, silently corrupting the desktop/mobile split.
 *
 * 3. IT ACTUALLY LOADS. A wrong region, a typo'd key or a blocked CDN leaves
 *    the site looking fine while collecting nothing.
 *
 * 4. track() REACHES posthog. ~11 call sites invoke it; if the wiring breaks
 *    they fail silently and the hash-routed case studies go unmeasured.
 *
 * Run:  node tests/verify-analytics.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

// eu-assets.i.posthog.com ALSO matches /i\.posthog\.com/, so the old single
// regex counted CDN asset loads as if they were event ingestion. Two hosts,
// two meanings — keep them apart. Do not merge them back.
const PH_ASSETS = /eu-assets\.i\.posthog\.com/i;   // library bundle + remote config
const PH_INGEST = /\/\/eu\.i\.posthog\.com/i;       // the event endpoint (/i/v0/e/)

// ⚠ PostHog NEVER sends an ingestion request under Puppeteer, and that is not
// a bug in this harness. TWO independent gates cause it:
//   (a) posthog-js 1.410's bot check ends in `return !!navigator.webdriver`,
//       which Puppeteer always sets, so has_opted_out_capturing() === true;
//   (b) internal_or_test_user_hostname (auto-enabled by defaults >= 2026-01-30)
//       suppresses capture on localhost / 127.0.0.1 outright.
// Measured 2026-08-04: 4 requests to eu-assets, 0 to eu.i.posthog.com, even for
// a forced posthog.capture(), on BOTH the baseline and the patched build.
//   • Never assert "an ingestion request was made" — it can never pass.
//     Assert on the in-page capture trap below instead.
//   • DO NOT spoof navigator.webdriver to "make ingestion work". That would
//     fire REAL events into production project 233134 on every single run.
//     The opt-out is load-bearing: it is why this gate is free to run.

// ── The capture trap ────────────────────────────────────────────────────
// Installed via evaluateOnNewDocument, so it is in place before ANY page
// script runs. It intercepts window.posthog at assignment time and replaces
// `capture` with an accessor whose getter always returns a recording wrapper.
// That survives posthog.init() replacing the method, and — the whole point —
// it records events that were queued before the library existed and flushed
// afterwards.
//
// DO NOT "simplify" this to `window.posthog.capture = wrapper` after load.
// A post-load patch cannot see buffered deep-link events, which is precisely
// the regression this file exists to catch. Verified working 2026-08-04.
const TRAP = () => {
  window.__cap = [];
  let _ph;
  Object.defineProperty(window, 'posthog', {
    configurable: true,
    get() { return _ph; },
    set(v) {
      _ph = v;
      let _real = v.capture;              // prototype method at assignment time
      try {
        Object.defineProperty(v, 'capture', {
          configurable: true,
          get() {
            return function (name, props) {
              // $autocapture props carry serialized DOM — keep them out.
              window.__cap.push({ n: name, p: /^\$/.test(name) ? null : (props || {}) });
              return _real ? _real.apply(this, arguments) : undefined;
            };
          },
          set(fn) { _real = fn; },
        });
      } catch (e) { window.__trapErr = e.message; }
    },
  });
};

const DESKTOP = { width: 1440, height: 900 };
const PHONE   = { width: 390, height: 844, isMobile: true, hasTouch: true };

// Every page in this file gets the trap.
async function trapped(b, vw) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(vw);
  await p.evaluateOnNewDocument(TRAP);
  return { ctx, p };
}
const names    = p => p.evaluate(() => window.__cap.map(e => e.n));
const full     = p => p.evaluate(() => window.__cap.filter(e => e.p).map(e => ({ n: e.n, p: e.p })));
const clearCap = p => p.evaluate(() => { window.__cap.length = 0; });
const settle   = 1600;   // overlay/blob transitions run 650–900ms; don't race them

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });

  // ── Desktop: loads, stays cookieless, track() reaches posthog ──────────
  {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    const reqs = [], errs = [];
    p.on('request', r => { if (PH_ASSETS.test(r.url())) reqs.push(r.url()); });
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);

    ok('desktop: posthog library loaded', await p.evaluate(() => !!(window.posthog && window.posthog.__loaded)));
    ok('desktop: requests go to the EU region', reqs.length > 0 && reqs.every(u => /eu[-.]/.test(u)),
       reqs.length + ' reqs, first: ' + (reqs[0] || 'none').slice(0, 60));

    // THE cookieless assertion — this is what replaces a consent banner.
    const cookies = await p.cookies();
    const phCookies = cookies.filter(c => /posthog|^ph_/i.test(c.name));
    ok('desktop: writes NO PostHog cookies (this is why no consent banner is needed)',
       phCookies.length === 0, phCookies.map(c => c.name).join(', ') || 'none');
    ok('desktop: writes NO cookies at all', cookies.length === 0,
       cookies.map(c => c.name).join(', ') || 'none');

    const storage = await p.evaluate(() => {
      const hits = [];
      for (const store of ['localStorage', 'sessionStorage']) {
        try {
          for (let i = 0; i < window[store].length; i++) {
            const k = window[store].key(i);
            if (/posthog|^ph_/i.test(k)) hits.push(store + ':' + k);
          }
        } catch (e) {}
      }
      return hits;
    });
    ok('desktop: writes NO PostHog local/sessionStorage keys', storage.length === 0, storage.join(', ') || 'none');

    // track() must actually reach posthog.capture
    const wired = await p.evaluate(() => {
      if (typeof window.track !== 'function') return 'track is not a function';
      let got = null;
      const real = window.posthog.capture.bind(window.posthog);
      window.posthog.capture = (n, props) => { got = n; return real(n, props); };
      window.track('__selftest__', { probe: true });
      window.posthog.capture = real;
      return got;
    });
    ok('desktop: track() reaches posthog.capture', wired === '__selftest__', String(wired));

    // a real user action must produce a captured event
    const captured = await p.evaluate(async () => {
      const seen = [];
      const real = window.posthog.capture.bind(window.posthog);
      window.posthog.capture = (n, props) => { seen.push(n); return real(n, props); };
      location.hash = '#settlr';
      await new Promise(r => setTimeout(r, 1800));
      window.posthog.capture = real;
      return seen;
    });
    ok('desktop: opening a case study fires case_study_opened',
       captured.includes('case_study_opened'), captured.join(', ') || 'nothing captured');

    ok('desktop: no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── THE regression this whole plan hinges on: the track() buffering race ──
  // On a cold deep link the track() call happens BEFORE the PostHog wrapper
  // installs, so without a buffer the event evaporates silently. These four
  // events are exactly the ones that have never once fired in production.
  // This block MUST be red before the buffering fix and green after. If it
  // ever starts passing without a code change, check the TRAP is still armed.
  for (const [hash, evt] of [
    ['#settlr',     'case_study_opened'],
    ['#refer-earn', 'case_study_opened'],
    ['#resume',     'resume_opened'],
    ['#photo-3',    'photo_opened'],
    ['#hobbies',    'world_flipped'],
  ]) {
    const { ctx, p } = await trapped(b, DESKTOP);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

    await p.goto(BASE + '/' + hash, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(3000);                    // give the buffer time to flush

    const seen = await names(p);
    const hits = seen.filter(n => n === evt).length;

    // Prove the UI genuinely reached the state, so a green result can never
    // mean "nothing happened, so nothing was expected".
    const reached = await p.evaluate(h => {
      if (h === '#settlr' || h === '#refer-earn')
        return document.getElementById('caseOverlay').classList.contains('is-open');
      if (h === '#resume')
        return document.getElementById('resumeOverlay').classList.contains('is-open');
      if (h === '#photo-3')
        return document.getElementById('photo-lightbox').classList.contains('active');
      return getComputedStyle(document.getElementById('alter-ego-content')).display !== 'none';
    }, hash);

    ok('deep link ' + hash + ': the UI state actually happened', reached);
    ok('deep link ' + hash + ': ' + evt + ' survives the pre-load buffer',
       hits >= 1, seen.join(', ') || 'nothing captured');
    ok('deep link ' + hash + ': ' + evt + ' is not double-counted on flush',
       hits <= 1, hits + ' copies');
    ok('deep link ' + hash + ': no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // The trap itself must be intact — a silent trap would make every check above
  // pass-by-vacuum on the "not double-counted" half and fail confusingly.
  {
    const { ctx, p } = await trapped(b, DESKTOP);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4000);
    ok('harness: the capture trap installed cleanly',
       (await p.evaluate(() => window.__trapErr || null)) === null,
       await p.evaluate(() => window.__trapErr || 'clean'));
    ok('harness: the trap sees PostHog’s own events (proof it is wired)',
       (await names(p)).includes('$pageview'), (await names(p)).join(', '));
    await p.close(); await ctx.close();
  }

  // ── Custom events, driven the way a visitor drives them ─────────────────
  {
    const { ctx, p } = await trapped(b, DESKTOP);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);

    // Each step: [label, expected event, in-page driver]. Run in this order —
    // #hobbies must precede any rotor interaction, the dark world is
    // display:none until then.
    const steps = [
      ['case study opened via CTA click', 'case_study_opened',
       () => { document.querySelector('a.cs2-cta[href="#settlr"]').click(); }],
      ['resume opened via #resume',       'resume_opened',
       () => { location.hash = '#resume'; }],
      ['world flipped via #hobbies',      'world_flipped',
       () => { location.hash = '#hobbies'; }],
      ['photo opened via #photo-3',       'photo_opened',
       () => { location.hash = '#photo-3'; }],
      // Real click on a rotor card — the bug region C fixes.
      ['photo opened via a real rotor click', 'photo_opened',
       () => { document.getElementById('lightbox-close').click();
               document.querySelectorAll('a.card-3d')[2].click(); }],
      // Explicit selectors, not "the first match": the first
      // a[target=_blank][href^=http] in the document is the settlrapp.in badge
      // inside a featured card, and the first mailto may sit inside a template.
      ['email CTA clicked',               'email_clicked',
       () => { document.querySelector('a.connect-link[href^="mailto:"]').click(); }],
      // preventDefault ONLY — do NOT removeAttribute('target'). The production
      // handler matches a[target="_blank"][href^="http"], and its document-level
      // capture listener runs BEFORE this anchor's own listener, so stripping
      // target makes the selector miss and the test asserts nothing. Measured:
      // target removed -> ["$autocapture"]; target kept -> ["outbound_clicked",
      // "$autocapture"]. preventDefault alone already stops the navigation.
      ['outbound profile link clicked',   'outbound_clicked',
       () => { const a = document.querySelector('a.btn-outline[href*="linkedin"]');
               a.addEventListener('click', ev => ev.preventDefault(), true);
               a.click(); }],
    ];

    for (const [label, evt, driver] of steps) {
      await clearCap(p);
      await p.evaluate(new Function('return (' + driver.toString() + ')()'));
      await wait(settle);
      const seen = await names(p);
      ok('desktop: ' + label + ' fires ' + evt,
         seen.includes(evt), seen.join(', ') || 'nothing captured');
    }

    // Props matter: a slug-less case_study_opened cannot answer "which study?",
    // and a sourceless one cannot answer "what brought them in?".
    await clearCap(p);
    await p.evaluate(() => { location.hash = ''; location.hash = '#refer-earn'; });
    await wait(settle);
    const withProps = (await full(p)).find(e => e.n === 'case_study_opened');
    ok('desktop: case_study_opened carries the slug',
       !!withProps && withProps.p.slug === 'refer-earn', JSON.stringify(withProps || null));
    ok('desktop: case_study_opened carries a source from the documented enum',
       !!withProps && ['card', 'cta', 'next_case', 'deeplink', 'nav'].includes(withProps.p.source),
       JSON.stringify(withProps && withProps.p));

    ok('desktop: no console/page errors across every event path',
       errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── mobile.html's events ────────────────────────────────────────────────
  {
    const { ctx, p } = await trapped(b, PHONE);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);

    // Selectors verified against mobile.html: heroPolaroid -> toggleTheme (1510),
    // .pa-link-cta--desktop (1563), #copyEmail (1576).
    // Payloads are accumulated INSIDE the loop: each iteration starts with a
    // clearCap, so anything read after the loop would only ever see the last
    // step's events and the slug assertion below would silently vacuum out.
    const mobileSeen = [];
    for (const [label, evt, sel] of [
      ['polaroid flip',        'world_flipped',            '#heroPolaroid'],
      ['desktop-only case CTA','desktop_case_study_copied','.pa-link-cta--desktop'],
      ['copy-email button',    'email_clicked',            '#copyEmail'],
    ]) {
      await clearCap(p);
      const found = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
      await wait(settle);
      const seen = await names(p);
      mobileSeen.push(...(await full(p)));
      ok('mobile: ' + label + ' fires ' + evt,
         found && seen.includes(evt), found ? (seen.join(', ') || 'nothing') : 'selector ' + sel + ' not found');
    }

    // The slug must match desktop's caseStudies key, not the old Title Case.
    const copied = mobileSeen.find(e => e.n === 'desktop_case_study_copied');
    ok('mobile: desktop_case_study_copied uses the desktop slug vocabulary',
       !!copied && ['settlr', 'refer-earn'].includes(copied.p.slug),
       JSON.stringify(copied && copied.p));

    ok('mobile: no console/page errors across every event path', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── The four new events ──────────────────────────────────────────────────
  // PROPERTY CONTRACT — these names are what the code emits. If you change
  // either side, change both in the same commit:
  //   case_study_progress { slug, pct }                     pct ∈ {25,50,75,100}
  //   case_study_closed   { slug, seconds_open, max_pct, reached_end }
  //   resume_downloaded   { variant }  variant ∈ {download, open_in_drive}
  //   work_viewed         { slug, slide }                   MOBILE ONLY
  {
    const { ctx, p } = await trapped(b, DESKTOP);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);

    // case_study_progress — .overlay-body is scroll-behavior:smooth, so a
    // scripted scrollTop ANIMATES and immediate reads are stale. Force auto
    // first. (Documented gotcha — do not remove this line.)
    await clearCap(p);
    await p.evaluate(() => { location.hash = '#settlr'; });
    await wait(settle);
    await p.evaluate(() => {
      const body = document.getElementById('overlayBody');
      body.style.scrollBehavior = 'auto';
      const max = body.scrollHeight - body.clientHeight;
      [0.25, 0.5, 0.75, 1].forEach(f => {
        body.scrollTop = max * f;
        body.dispatchEvent(new Event('scroll'));
      });
    });
    await wait(settle);
    const prog = (await full(p)).filter(e => e.n === 'case_study_progress');
    ok('desktop: scrolling a case study fires case_study_progress',
       prog.length > 0, prog.length + ' fired');
    ok('desktop: case_study_progress reports a milestone pct',
       prog.length > 0 && prog.every(e => [25, 50, 75, 100].includes(e.p.pct)),
       JSON.stringify(prog.map(e => e.p)));
    ok('desktop: case_study_progress is milestone-gated, not one-per-scroll-event',
       prog.length <= 4, prog.length + ' fired for 4 milestones');
    ok('desktop: case_study_progress carries the slug',
       prog.length > 0 && prog.every(e => e.p.slug === 'settlr'),
       JSON.stringify(prog.map(e => e.p.slug)));

    // case_study_closed — once, with dwell + depth, on Escape.
    await clearCap(p);
    await p.keyboard.press('Escape');
    await wait(settle);
    const closed = (await full(p)).filter(e => e.n === 'case_study_closed');
    ok('desktop: closing a case study fires case_study_closed exactly once',
       closed.length === 1, closed.length + ' fired');
    ok('desktop: case_study_closed carries slug + seconds_open + max_pct + reached_end',
       closed.length === 1 &&
       closed[0].p.slug === 'settlr' &&
       typeof closed[0].p.seconds_open === 'number' &&
       typeof closed[0].p.max_pct === 'number' &&
       typeof closed[0].p.reached_end === 'boolean',
       JSON.stringify(closed[0] && closed[0].p));

    // The overlay-to-overlay swap must also close the old session exactly once
    // — that path never calls closeOverlay at all.
    await p.evaluate(() => { location.hash = '#settlr'; });
    await wait(settle);
    await clearCap(p);
    await p.evaluate(() => { location.hash = '#refer-earn'; });
    await wait(settle);
    const swapClosed = (await full(p)).filter(e => e.n === 'case_study_closed');
    ok('desktop: a case-to-case swap closes the old session exactly once',
       swapClosed.length === 1 && swapClosed[0].p.slug === 'settlr',
       JSON.stringify(swapClosed.map(e => e.p)));
    await p.keyboard.press('Escape');
    await wait(settle);

    // resume_downloaded — the Download anchor inside the resume overlay.
    // It is ALSO a[target=_blank][href^=http], but the handler returns early
    // on purpose so it does NOT double-count as outbound_clicked. Assert both.
    await p.evaluate(() => { location.hash = '#resume'; });
    await wait(settle);
    await clearCap(p);
    await p.evaluate(() => {
      const a = document.querySelector('.resume-actions a.btn-icon-expand');
      // preventDefault keeps the click in this tab. Do NOT also remove the
      // target attribute — the handler selects on a[target="_blank"], so
      // removing it makes resume_downloaded silently never fire.
      a.addEventListener('click', e => e.preventDefault(), true);
      a.click();
    });
    await wait(settle);
    const afterResume = await full(p);
    const rd = afterResume.find(e => e.n === 'resume_downloaded');
    ok('desktop: the resume Download button fires resume_downloaded',
       !!rd && rd.p.variant === 'download', JSON.stringify(rd || (await names(p))));
    ok('desktop: resume_downloaded does NOT also fire outbound_clicked',
       !afterResume.some(e => e.n === 'outbound_clicked'),
       JSON.stringify(afterResume.map(e => e.n)));

    // The "Open in Drive" fallback link is the other variant.
    await clearCap(p);
    await p.evaluate(() => {
      const a = document.querySelector('.resume-fallback a');
      // Same rule as above: keep target="_blank", preventDefault only.
      a.addEventListener('click', e => e.preventDefault(), true);
      a.click();
    });
    await wait(settle);
    const rd2 = (await full(p)).find(e => e.n === 'resume_downloaded');
    ok('desktop: the Open-in-Drive fallback reports variant open_in_drive',
       !!rd2 && rd2.p.variant === 'open_in_drive', JSON.stringify(rd2 || null));

    ok('desktop: new-event block produced no console/page errors',
       errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── work_viewed is MOBILE ONLY (region D). There is no desktop equivalent —
  //    do not "add" one on #featuredStack; the desktop signal is
  //    case_study_opened + case_study_progress. ──────────────────────────────
  {
    const { ctx, p } = await trapped(b, PHONE);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);
    await clearCap(p);

    // Swipe the #settlr carousel to slide 2, twice, to prove it counts once.
    const swept = await p.evaluate(() => {
      const post = document.getElementById('settlr');
      if (!post) return 'no #settlr article';
      const sc = post.querySelector('.cards-scroller');
      if (!sc) return 'no .cards-scroller';
      sc.style.scrollBehavior = 'auto';
      sc.scrollLeft = sc.clientWidth;  sc.dispatchEvent(new Event('scroll'));
      sc.scrollLeft = 0;               sc.dispatchEvent(new Event('scroll'));
      sc.scrollLeft = sc.clientWidth;  sc.dispatchEvent(new Event('scroll'));
      return 'ok';
    });
    await wait(settle);
    const wv = (await full(p)).filter(e => e.n === 'work_viewed');
    ok('mobile: swiping a work card past slide 1 fires work_viewed',
       swept === 'ok' && wv.length >= 1, swept === 'ok' ? JSON.stringify(wv.map(e => e.p)) : swept);
    ok('mobile: work_viewed fires once per slide per pageview, not once per swipe',
       wv.length === 1, wv.length + ' fired');
    ok('mobile: work_viewed carries the desktop slug and a 1-based slide',
       wv.length >= 1 && wv[0].p.slug === 'settlr' && wv[0].p.slide === 2,
       JSON.stringify(wv[0] && wv[0].p));

    // The dark world's photo carousels must stay silent.
    await clearCap(p);
    await p.evaluate(() => {
      document.querySelectorAll('.world-dark .cards-scroller, html.dark .cards-scroller')
        .forEach(sc => { sc.scrollLeft = sc.clientWidth; sc.dispatchEvent(new Event('scroll')); });
    });
    await wait(800);
    ok('mobile: photo carousels do not emit work_viewed',
       !(await names(p)).includes('work_viewed'), (await names(p)).join(', ') || 'none');

    ok('mobile: work_viewed block produced no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── Viewport band: the 1024–1210 zone where a real iPad ping-ponged ──────
  const DEAD_BAND = [1024, 1064];   // index escapes below [0]; mobile escapes at/above [1]

  // 1. static landings
  for (const [w, want] of [[1023, '/mobile.html'], [1024, '/index.html'], [1100, '/index.html'], [1210, '/index.html'], [1440, '/index.html']]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    const nav = [];
    p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url().replace(BASE, '')); });
    await p.setViewport({ width: w, height: 900 });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3000);
    const final = await p.evaluate(() => location.pathname);
    ok('viewport ' + w + ': settles on ' + want,
       (final === want || (want === '/index.html' && final === '/')), final);
    ok('viewport ' + w + ': settles after at most one redirect',
       nav.length <= 2, nav.length + ' navs ' + JSON.stringify(nav));
    await p.close(); await ctx.close();
  }

  // 2. the dead band — neither document may bounce out of it.
  //    Each case STARTS on a width where its own document is stable, then
  //    drifts into the band. Starting a mobile.html case above 1064 would
  //    just redirect first and test nothing.
  for (const [start, startW] of [['/', 1440], ['/mobile.html', 900]]) {
    const mid = Math.round((DEAD_BAND[0] + DEAD_BAND[1]) / 2);   // 1044
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: startW, height: 900 });
    await p.goto(BASE + start, { waitUntil: 'domcontentloaded' });
    await wait(2000);
    const before = await p.evaluate(() => location.pathname);
    const nav = [];
    p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url().replace(BASE, '')); });
    await p.setViewport({ width: mid, height: 900 });   // drift into the dead band
    await wait(3000);
    ok('dead band ' + mid + 'px: a page that started at ' + before + ' does not redirect',
       nav.length === 0, nav.length + ' navs ' + JSON.stringify(nav));
    await p.close(); await ctx.close();
  }

  // 3. mobile.html's escape threshold is 1064, not 1024.
  for (const [w, shouldLeave] of [[1023, false], [1050, false], [1063, false], [1064, true], [1210, true]]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: w, height: 900 });
    await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
    await wait(2500);
    const left = (await p.evaluate(() => location.pathname)) !== '/mobile.html';
    ok('mobile.html at ' + w + 'px: ' + (shouldLeave ? 'escapes to index' : 'stays put'),
       left === shouldLeave, await p.evaluate(() => location.pathname));
    await p.close(); await ctx.close();
  }

  // 4. THE loop. Sweep across the breakpoint the way an iPad does when it is
  //    rotated, resized in Stage Manager, or when the URL bar collapses.
  {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    const nav = [];
    p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url().replace(BASE, '')); });
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(1500);
    for (const w of [1010, 1210, 1010, 1210]) {
      await p.setViewport({ width: w, height: 900 });
      await wait(1200);
    }
    await wait(2000);
    // Measured 2026-08-04 BEFORE the fix: 5 navigations. One crossing may
    // legitimately move the reader once; a sweep that lands back where it
    // started must not have churned through four documents to get there.
    // The whole sweep runs inside the router's 8s cooldown by design.
    ok('resize sweep across the breakpoint does not ping-pong',
       nav.length <= 2, nav.length + ' navs ' + JSON.stringify(nav));
    await p.close(); await ctx.close();
  }

  // ── ?nostats=1 — the opt-out anyone can use, including the owner while
  //    testing his own site. If this leaks, every QA pass pollutes the data.
  for (const [label, path, vw] of [
    ['desktop', '/',            DESKTOP],
    ['mobile',  '/mobile.html', PHONE],
  ]) {
    // opted OUT
    {
      const ctx = await b.createBrowserContext();
      const p = await ctx.newPage();
      await p.setViewport(vw);
      const reqs = [];
      p.on('request', r => { if (/posthog/i.test(r.url())) reqs.push(r.url()); });
      await p.goto(BASE + path + '?nostats=1', { waitUntil: 'domcontentloaded' });
      await wait(4000);
      ok(label + ' ?nostats=1: no posthog global',
         (await p.evaluate(() => typeof window.posthog)) === 'undefined',
         await p.evaluate(() => typeof window.posthog));
      ok(label + ' ?nostats=1: zero network requests to posthog',
         reqs.length === 0, reqs.length + ': ' + (reqs[0] || 'none'));
      // ~11 call sites invoke track() unconditionally — it must stay callable.
      ok(label + ' ?nostats=1: window.track is still a safe no-op',
         (await p.evaluate(() => { try { window.track('x', { y: 1 }); return typeof window.track; } catch (e) { return 'THREW ' + e.message; } })) === 'function');
      await p.close(); await ctx.close();
    }
    // opted IN — proves the check above is not passing because the loader is
    // simply broken. Do not delete this half.
    {
      const ctx = await b.createBrowserContext();
      const p = await ctx.newPage();
      await p.setViewport(vw);
      const reqs = [];
      p.on('request', r => { if (PH_ASSETS.test(r.url())) reqs.push(r.url()); });
      await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      await wait(4000);
      ok(label + ' (control, no flag): posthog still loads',
         reqs.length > 0, reqs.length + ' asset reqs');
      // And it is the PINNED bundle, not the rolling "latest".
      ok(label + ' (control): array.js comes from the pinned version path',
         reqs.some(u => /\/static\/\d+\.\d+\.\d+\/array\.js/.test(u)),
         reqs.join(' | '));
      await p.close(); await ctx.close();
    }
  }

  // ── The router must carry the query string, not just the hash ────────────
  for (const [label, from, vw, to] of [
    ['index.html -> mobile.html', '/index.html',  PHONE,   '/mobile.html'],
    ['mobile.html -> index.html', '/mobile.html', DESKTOP, '/index.html'],
  ]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport(vw);
    await p.goto(BASE + from + '?nostats=1&utm_source=probe&utm_campaign=x#settlr',
                 { waitUntil: 'domcontentloaded' });
    await wait(3000);
    const url = await p.evaluate(() => location.pathname + location.search + location.hash);
    ok(label + ': redirects to ' + to, url.startsWith(to), url);
    ok(label + ': forwards the full query string', /nostats=1/.test(url) && /utm_source=probe/.test(url) && /utm_campaign=x/.test(url), url);
    ok(label + ': still forwards the hash', /#settlr$/.test(url), url);
    // The forwarded opt-out must still be honoured at the destination.
    ok(label + ': forwarded ?nostats=1 still suppresses posthog',
       (await p.evaluate(() => typeof window.posthog)) === 'undefined',
       await p.evaluate(() => typeof window.posthog));
    await p.close(); await ctx.close();
  }

  // ── The cookieless contract — this is what replaces a consent banner ─────
  // cookieless_mode:'always' is the ONLY reason this site ships no GDPR
  // banner. If a PostHog upgrade or a config typo re-enables persistence, the
  // site quietly becomes non-compliant and nothing else would notice.
  //
  // ALLOWLIST POLICY: exact key names only, no patterns.
  //   feed-theme  : mobile.html's saved light/dark choice (functional)
  //   vp-hop      : the viewport router's one-hop-per-8s cooldown (functional;
  //                 sessionStorage, per tab, holds a timestamp and nothing else)
  //   settlr_data : the EMBEDDED SETTLR PROTOTYPE's local seed-data store
  //                 (prototype/settlr/js/store.js:9, `const LS_KEY =
  //                 'settlr_data'`). The #settlr case-study overlay hosts that
  //                 prototype in a SAME-ORIGIN iframe, so its localStorage is
  //                 this document's localStorage. It appears only after the
  //                 overlay is opened, holds the offline demo's own mock
  //                 expense data, and is written by the prototype's disconnected
  //                 seed-data mode — it is not an analytics identifier, carries
  //                 nothing about the visitor, and long predates this pass.
  //                 Added deliberately 2026-08-04; recorded in the commit.
  // None of these is an analytics identifier and none requires consent. A
  // PostHog key appearing here is a compliance incident, not a test to update.
  const STORAGE_ALLOWLIST = ['feed-theme', 'vp-hop', 'settlr_data'];

  for (const [label, path, vw, exercise] of [
    ['desktop', '/', DESKTOP, async p => {
      await p.evaluate(() => { location.hash = '#settlr'; });   await wait(1200);
      await p.evaluate(() => { location.hash = '#resume'; });   await wait(1200);
      await p.evaluate(() => { location.hash = '#hobbies'; });  await wait(1200);
      await p.evaluate(() => { location.hash = '#photo-2'; });  await wait(1200);
      await p.evaluate(() => { document.querySelector('a[href^="mailto:"]').click(); });
    }],
    ['mobile', '/mobile.html', PHONE, async p => {
      await p.evaluate(() => { document.getElementById('heroPolaroid').click(); }); await wait(1200);
      await p.evaluate(() => { document.getElementById('copyEmail').click(); });
    }],
  ]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport(vw);
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 })
           .catch(() => {});
    await wait(2500);
    await exercise(p);
    await wait(2500);

    const cookies = await p.cookies();
    ok(label + ' cookieless: zero cookies after exercising every event path',
       cookies.length === 0, cookies.map(c => c.name).join(', ') || 'none');

    const keys = await p.evaluate(() => {
      const out = [];
      for (const store of ['localStorage', 'sessionStorage']) {
        try {
          for (let i = 0; i < window[store].length; i++) out.push(store + ':' + window[store].key(i));
        } catch (e) {}
      }
      return out;
    });
    const stray = keys.filter(k => !STORAGE_ALLOWLIST.includes(k.split(':')[1]));
    ok(label + ' cookieless: only allowlisted storage keys (' + STORAGE_ALLOWLIST.join(', ') + ')',
       stray.length === 0, stray.join(', ') || 'none');

    // And the config that guarantees it is still in force.
    const cfg = await p.evaluate(() => {
      const c = window.posthog && window.posthog.config;
      return c ? { cookieless: c.cookieless_mode, host: c.api_host, rec: c.disable_session_recording } : null;
    });
    ok(label + ' cookieless: posthog is running with cookieless_mode "always"',
       !!cfg && cfg.cookieless === 'always', JSON.stringify(cfg));
    ok(label + ': api_host is still the EU region',
       !!cfg && cfg.host === 'https://eu.i.posthog.com', (cfg && cfg.host) || 'none');
    await p.close(); await ctx.close();
  }

  // ── Mobile document ────────────────────────────────────────────────────
  {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.posthog && window.posthog.__loaded, { timeout: 15000 }).catch(() => {});
    await wait(2000);
    ok('mobile: posthog loaded', await p.evaluate(() => !!(window.posthog && window.posthog.__loaded)));
    const cookies = await p.cookies();
    ok('mobile: writes no cookies', cookies.length === 0, cookies.map(c => c.name).join(', ') || 'none');
    ok('mobile: no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── Router guard: the document that redirects AWAY must never load PostHog ──
  for (const [label, path, vw, doomed] of [
    ['index.html at a phone viewport', '/', { width: 390, height: 844, isMobile: true, hasTouch: true }, ['/', '/index.html']],
    ['mobile.html at a desktop viewport', '/mobile.html', { width: 1440, height: 900 }, ['/mobile.html']],
  ]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport(vw);
    // Record WHICH document injected the loader. After location.replace the
    // destination page legitimately loads its own — a bare count would flag
    // correct behaviour as a failure.
    await p.evaluateOnNewDocument(() => {
      const orig = document.createElement.bind(document);
      window.__phFrom = [];
      document.createElement = function (tag) {
        const el = orig(tag);
        if (String(tag).toLowerCase() === 'script') {
          Object.defineProperty(el, 'src', {
            set(v) { if (/posthog/i.test(v)) window.__phFrom.push(location.pathname); el.setAttribute('src', v); },
            get() { return el.getAttribute('src'); },
          });
        }
        return el;
      };
    });
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await wait(2500);
    const from = await p.evaluate(() => window.__phFrom || []).catch(() => []);
    const phantom = from.filter(f => doomed.includes(f));
    ok(`router guard: ${label} logs no phantom pageview`, phantom.length === 0,
       'loaded from: [' + from.join(', ') + ']');
    await p.close(); await ctx.close();
  }

  console.log('\n' + (failures ? failures + ' FAILED' : 'analytics live contract OK — collecting, cookieless, router-safe'));
  await b.close();
  process.exit(failures === 0 ? 0 : 1);
})();
