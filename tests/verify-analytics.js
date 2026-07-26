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
 * 4. track() REACHES posthog. ~9 call sites invoke it; if the wiring breaks
 *    they fail silently and the hash-routed case studies go unmeasured.
 *
 * Run:  node tests/verify-analytics.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

const PH_HOST = /i\.posthog\.com/i;

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });

  // ── Desktop: loads, stays cookieless, track() reaches posthog ──────────
  {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    const reqs = [], errs = [];
    p.on('request', r => { if (PH_HOST.test(r.url())) reqs.push(r.url()); });
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
