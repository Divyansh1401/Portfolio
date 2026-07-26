/**
 * verify-payload.js — over-the-wire payload budget.
 *
 * A regression guard, not a micro-optimizer. It exists because an oversized
 * asset is invisible in review: `small-cards/angel-one.webp` shipped at
 * 4320x7680 (33 megapixels, 308 KB) to fill a 616px slot and nobody noticed
 * until a load audit. This fails the build if a page's total transfer, or any
 * single asset, crosses a documented ceiling.
 *
 * Budgets are set ~15% above the measured post-optimization figures, so
 * ordinary content edits pass and a genuine mistake trips it.
 *
 * Run:  node tests/verify-payload.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');

const BASE = process.argv[2] || 'http://localhost:3457';
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };

const PAGES = [
  // Ceilings are ~15% above the measured cold-load figures of 2026-07-26
  // (desktop 1468/1273/100, mobile 571/453/100), so routine content edits pass
  // and a genuine mistake trips it. Re-baseline deliberately, not reflexively.
  { path: '/',            label: 'desktop', vw: { width: 1440, height: 900, deviceScaleFactor: 2 },
    totalKB: 1700, imagesKB: 1470, fontsKB: 120 },
  { path: '/mobile.html', label: 'mobile',  vw: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    totalKB: 660,  imagesKB: 525, fontsKB: 120 },
];
const MAX_SINGLE_ASSET_KB = 300;   // no one file should dominate a page load

(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  for (const pg of PAGES) {
    // Fresh, cache-disabled context per page: without this the second page
    // reuses the first's cached fonts and reports a fictitiously light load.
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setCacheEnabled(false);
    await p.setViewport(pg.vw);
    const cdp = await p.target().createCDPSession();
    await cdp.send('Network.enable');
    const reqs = new Map();
    cdp.on('Network.requestWillBeSent', e => reqs.set(e.requestId, { url: e.request.url, type: e.type, size: 0 }));
    cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) r.size = e.encodedDataLength; });

    await p.goto(BASE + pg.path, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3500));   // let lazy/idle work settle
    await p.close();
    await ctx.close();

    const all = [...reqs.values()].filter(r => r.size > 0);
    const kb = n => Math.round(n / 1024);
    const sum = f => kb(all.filter(f).reduce((a, r) => a + r.size, 0));
    const total = sum(() => true), imgs = sum(r => r.type === 'Image'), fonts = sum(r => r.type === 'Font');

    console.log(`\n--- ${pg.label} (${all.length} requests) ---`);
    ok(`${pg.label}: total transfer under ${pg.totalKB} KB`, total <= pg.totalKB, total + ' KB');
    ok(`${pg.label}: images under ${pg.imagesKB} KB`, imgs <= pg.imagesKB, imgs + ' KB');
    ok(`${pg.label}: fonts under ${pg.fontsKB} KB (subset — see verify-fonts.js)`, fonts <= pg.fontsKB, fonts + ' KB');

    const fat = all.filter(r => r.size > MAX_SINGLE_ASSET_KB * 1024)
                   .sort((a, c) => c.size - a.size)
                   .map(r => kb(r.size) + 'KB ' + r.url.split('/').pop().slice(0, 40));
    ok(`${pg.label}: no single asset over ${MAX_SINGLE_ASSET_KB} KB`, fat.length === 0, fat.join(', ') || 'ok');
  }

  console.log('\n' + (failures ? failures + ' FAILED — see budgets in tests/verify-payload.js' : 'payload within budget'));
  await b.close();
  process.exit(failures === 0 ? 0 : 1);
})();
