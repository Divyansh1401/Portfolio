/**
 * verify-bouquet-doc.js — the bouquet making-of page (bouquet.html) + its nav icons.
 * LOCAL DRAFT: gitignored alongside the page; not in run-all until it goes live.
 * Run:  node tests/verify-bouquet-doc.js [baseUrl]
 */
const puppeteer = require('/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer');
const BASE = process.argv[2] || 'http://localhost:3457';
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (l, c, d) => { if (!c) failures++; console.log((c ? 'PASS  ' : 'FAIL  ') + l + (d ? '  [' + d + ']' : '')); };
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE + '/bouquet.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.hero && hero.state().p >= 1, { timeout: 8000 });
  const s = await page.evaluate(() => hero.state());
  ok('hero lands front-on with the culled set (602 with the hollow filled)', s.drawn === 602 && s.yaw === 0, JSON.stringify(s));
  ok('title rises with the assembly', await page.evaluate(() => document.getElementById('heroTitle').classList.contains('is-in')));
  ok('hero has no eyebrow, sub or replay bar; title is "The making of"', await page.evaluate(() => !document.querySelector('.hero .eyebrow, .hero .sub, .hero .bar') && document.querySelector('#heroTitle h1').textContent.trim() === 'The making of'));
  ok('loader bench panel present, OPEN by default (owner 2026-09-18), top right of the hero, four tabs', await page.evaluate(() => { const b = document.getElementById('bench'); const r = b.getBoundingClientRect(); return !b.classList.contains('min') && r.right > innerWidth * 0.8 && r.top >= 64 && r.top < 120 && r.height > 400 && document.querySelectorAll('#bench .tab').length === 4; }));
  ok('fold collapses the panel, and the chevron sits centred in its button', await page.evaluate(() => { const f = document.getElementById('fold'); const fb = f.getBoundingClientRect(), sb = f.querySelector('svg').getBoundingClientRect(); const centred = Math.abs((sb.left + sb.right) / 2 - (fb.left + fb.right) / 2) < 1 && Math.abs((sb.top + sb.bottom) / 2 - (fb.top + fb.bottom) / 2) < 1; f.click(); const b = document.getElementById('bench'); const ok = b.classList.contains('min') && b.getBoundingClientRect().height < 200; f.click(); return centred && ok; }));
  ok('replay restarts from the panel', await page.evaluate(async () => { document.getElementById('replay').click(); await new Promise(r => setTimeout(r, 300)); return hero.state().p < 0.5; }));
  await page.waitForFunction(() => hero.state().p >= 1, { timeout: 8000 });
  ok('scroll drives the burst over the pinned hero', await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 400); await new Promise(r => setTimeout(r, 200)); const q1 = hero.state().q; const pinned = document.querySelector('.hero').getBoundingClientRect().top === 0; window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200)); return q1 > 0.4 && q1 < 0.6 && pinned && hero.state().q < 0.02; }));
  ok('side-scroll revolves the camera without scrolling the page', await page.evaluate(async () => { const el = document.querySelector('.hero'); el.dispatchEvent(new WheelEvent('wheel', { deltaX: 200, deltaY: 0, bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 50)); return Math.abs(hero.state().yaw) > 30 && scrollY < 2; }));
  ok('nine beats in narrative order (1 2 3 5 6 tp 7 8 10), eyebrows 1–9, nothing else below the hero', await page.evaluate(() => {
    const ids = [...document.querySelectorAll('.beat')].map(s => s.dataset.beat);
    const eyebrows = [...document.querySelectorAll('.beat .eyebrow')].map(e => e.textContent.trim());
    const inOrder = ids.join(' ') === '1 2 3 5 6 tp 7 8 10' && eyebrows.every((t, i) => t === (i + 1) + ' / 9');
    return inOrder && !document.querySelector('#rig, main, #bqB, .strip, #state, details, #history, #workflow');
  }));
  ok('no stray rig iframe request (assets/bouquet/ is gone)', await page.evaluate(() => !document.querySelector('iframe')));
  ok('no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  for (const [url, w] of [['/', 1440]]) {
    const p = await browser.newPage(); await p.setViewport({ width: w, height: 900 });
    await p.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await wait(500);
    ok('nav icon links to bouquet.html in a new tab on ' + url, await p.evaluate(() => { const a = document.querySelector('.nav-icon[href="bouquet.html"]'); return a && a.getBoundingClientRect().width > 0 && a.target === '_blank' && /noopener/.test(a.rel); }));
    ok('spray icon opens spray.html in a new tab on ' + url, await p.evaluate(() => { const a = document.querySelector('.nav-icon[href="spray.html"]'); return a && a.target === '_blank' && /noopener/.test(a.rel); }));
    await p.close();
  }
  { const p = await browser.newPage(); await p.setViewport({ width: 390, height: 900 }); await p.goto(BASE + '/mobile.html', { waitUntil: 'domcontentloaded' }); await wait(400);
    ok('mobile.html carries no tool icons (desktop-only interactions)', await p.evaluate(() => document.querySelectorAll('.nav-icon').length === 0)); await p.close(); }
  { const sp = await browser.newPage(); await sp.setViewport({ width: 1440, height: 900 });
    const se = []; sp.on('console', m => { if (m.type() === 'error') se.push(m.text()); }); sp.on('pageerror', e => se.push(e.message)); sp.on('response', r => { if (r.status() >= 400) se.push(r.status() + ' ' + r.url()); });
    await sp.goto(BASE + '/spray.html', { waitUntil: 'load' }); await wait(600);
    // the can starts empty: five direction reversals of >15px load a colour
    await sp.mouse.move(600, 400); for (let i = 0; i < 12; i++) { await sp.mouse.move(600 + (i % 2 ? 80 : -80), 400); await wait(25); }
    await sp.mouse.move(600, 400); await sp.mouse.down(); for (let i = 0; i < 12; i++) { await sp.mouse.move(600 + i * 12, 400 + i * 6); await wait(30); } await sp.mouse.up(); await wait(300);
    const ink = await sp.evaluate(() => { const c = document.getElementById('spray-canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; });
    ok('spray.html paints on hold-and-drag', ink > 0, ink + ' px');
    ok('spray.html: "Back to portfolio" is the last dock item and links home without the loader', await sp.evaluate(() => { const items = document.querySelectorAll('#dock .dock__item'); const a = items[items.length - 1]; return a.tagName === 'A' && /index\.html\?noloader$/.test(a.getAttribute('href')) && a.dataset.label === 'Back to portfolio'; }));
    ok('spray.html: zero console errors / 4xx', se.length === 0, se.join(' | ').slice(0, 300));
    await sp.close(); }
  ok('zero console errors / 4xx', errors.length === 0, errors.join(' | ').slice(0, 300));
  await browser.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
