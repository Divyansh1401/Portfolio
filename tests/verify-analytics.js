/**
 * verify-analytics.js — the PostHog integration's safety contract.
 *
 * Two things this guards, both of which fail silently in production:
 *
 * 1. INERT WITHOUT A KEY. The integration ships with PH_KEY empty. It must
 *    fetch nothing, define no PostHog globals, and make no network calls. If
 *    someone later hardcodes a key by accident, or the guard regresses, the
 *    site starts phoning a third party on every visit.
 *
 * 2. THE ROUTER GUARD. index.html replaces the document on <1024px and
 *    mobile.html replaces it on >=1024px. Initialising analytics ahead of that
 *    redirect logs a phantom pageview plus an instant bounce for EVERY visitor
 *    on the other form factor, which silently corrupts the desktop/mobile
 *    split — the number most worth knowing on a two-document site.
 *
 * It also checks that track() is always callable, since ~9 call sites invoke it
 * unconditionally; if it were ever undefined those would throw mid-interaction.
 *
 * Run:  node tests/verify-analytics.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

const PH_HOSTS = /posthog\.com|i\.posthog|posthog\.io/i;

async function load(browser, path, vw) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(vw);
  const thirdParty = [];
  const errs = [];
  p.on('request', r => { if (PH_HOSTS.test(r.url())) thirdParty.push(r.url()); });
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await wait(2500);
  return { p, ctx, thirdParty, errs };
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });

  // ── 1. Desktop, no key: fully inert ────────────────────────────────────
  {
    const { p, ctx, thirdParty, errs } = await load(b, '/', { width: 1440, height: 900 });
    ok('desktop: no PostHog request while PH_KEY is empty', thirdParty.length === 0, thirdParty[0] || 'none');
    const g = await p.evaluate(() => ({
      posthog: typeof window.posthog,
      track: typeof window.track,
      scripts: [...document.querySelectorAll('script[src]')].filter(s => /posthog/i.test(s.src)).length,
    }));
    ok('desktop: no posthog global defined', g.posthog === 'undefined', g.posthog);
    ok('desktop: no posthog script tag injected', g.scripts === 0, String(g.scripts));
    ok('desktop: track() is always callable (9 call sites depend on it)', g.track === 'function', g.track);
    const threw = await p.evaluate(() => { try { window.track('probe', { a: 1 }); return false; } catch (e) { return true; } });
    ok('desktop: calling track() with a key unset does not throw', !threw);
    ok('desktop: no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── 2. Mobile document, no key: inert ──────────────────────────────────
  {
    const { p, ctx, thirdParty, errs } = await load(b, '/mobile.html',
      { width: 390, height: 844, isMobile: true, hasTouch: true });
    ok('mobile: no PostHog request while PH_KEY is empty', thirdParty.length === 0, thirdParty[0] || 'none');
    const t = await p.evaluate(() => typeof window.track);
    ok('mobile: track() is always callable', t === 'function', t);
    ok('mobile: no console/page errors', errs.length === 0, errs[0] || 'none');
    await p.close(); await ctx.close();
  }

  // ── 3. THE ROUTER GUARD, with a key simulated ──────────────────────────
  // Rewrite the empty key to a fake one in flight, then load index.html at a
  // PHONE viewport. The router redirects to mobile.html; the guard must stop
  // index.html from initialising first. If it doesn't, every mobile visitor
  // produces a phantom desktop pageview.
  for (const [label, path, vw, phantomFrom] of [
    ['index.html at a phone viewport', '/', { width: 390, height: 844, isMobile: true, hasTouch: true }, 'desktop'],
    ['mobile.html at a desktop viewport', '/mobile.html', { width: 1440, height: 900 }, 'mobile'],
  ]) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport(vw);
    await p.setRequestInterception(true);
    const phRequests = [];
    p.on('request', async req => {
      if (PH_HOSTS.test(req.url())) { phRequests.push(req.url()); return req.abort(); }
      // Rewrite the empty key to a fake one IN FLIGHT. Without this the loader
      // returns at `if (!PH_KEY)` and the router guard is never exercised — the
      // test would pass while proving nothing.
      if (req.resourceType() === 'document') {
        try {
          const res = await fetch(req.url());
          let html = await res.text();
          const before = html;
          html = html.replace(/var PH_KEY\s*=\s*''/, "var PH_KEY = 'phc_TESTKEY_not_a_real_project'");
          if (html === before) return req.respond({ status: 500, body: 'key placeholder not found' });
          return req.respond({ status: 200, contentType: 'text/html', body: html });
        } catch (e) { return req.continue(); }
      }
      req.continue();
    });
    await p.evaluateOnNewDocument(() => {
      const orig = document.createElement.bind(document);
      // survives the redirect so injections from BOTH documents are recorded
      window.__phScripts = (window.name && window.name.startsWith('[')) ? JSON.parse(window.name) : [];
      const persist = () => { try { window.name = JSON.stringify(window.__phScripts); } catch (e) {} };
      window.addEventListener('beforeunload', persist);
      setInterval(persist, 120);
      document.createElement = function (tag) {
        const el = orig(tag);
        if (String(tag).toLowerCase() === 'script') {
          Object.defineProperty(el, 'src', {
            // Record WHICH document injected it. After location.replace the
            // destination page legitimately loads its own tracker, so a bare
            // count would flag correct behaviour as a failure.
            set(v) { if (/posthog/i.test(v)) window.__phScripts.push(location.pathname); el.setAttribute('src', v); },
            get() { return el.getAttribute('src'); },
          });
        }
        return el;
      };
    });
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await wait(2500);
    const froms = await p.evaluate(() => window.__phScripts || []).catch(() => []);
    // The guard's job: the document that redirects AWAY must never inject.
    const doomed = path === '/' ? ['/', '/index.html'] : ['/mobile.html'];
    const phantom = froms.filter(f => doomed.includes(f));
    ok(`router guard: ${label} injects no phantom ${phantomFrom} tracker`,
        phantom.length === 0,
        'injected from: [' + froms.join(', ') + ']  phantom: ' + phantom.length);
    const landed = await p.evaluate(() => location.pathname).catch(() => '?');
    ok(`router guard: ${label} actually redirected`, landed !== path || path === '/', 'landed ' + landed);
    await p.close(); await ctx.close();
  }

  console.log('\n' + (failures ? failures + ' FAILED' : 'analytics contract OK (inert until PH_KEY is set)'));
  await b.close();
  process.exit(failures === 0 ? 0 : 1);
})();
