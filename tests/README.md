# tests/ — the pre-push gate

Headless Puppeteer suites for `index.html` / `mobile.html`. **CLAUDE.md's bar
for any interaction change is: all suites pass, zero console errors.**

These used to live in a session scratchpad and were lost. They live in the repo
now so that can't happen again — if you change interaction code, run them.

## Run

```bash
npx serve -p 3457 .          # in one shell (launch.json name: portfolio-v2)
node tests/run-all.js        # in another — exits non-zero if anything fails
```

`run-all.js` also runs `emdash-inventory.js --check` as a copy guard: it fails on
any reader-facing em dash that isn't on the explicit `APPROVED` allowlist. Comments
are exempt by design. Adding to that allowlist should be a deliberate choice.

Individual suites take an optional base URL: `node tests/verify-deeplinks.js http://localhost:3457`.

## Suites

| File | Checks | Covers |
|---|---|---|
| `verify-deeplinks.js` | 21 | Hash routing — the source of truth for all overlay/world state. Every target (`#settlr` `#refer-earn` `#resume` `#hobbies` `#photo-N` `#kinko` `#connect`) as a cold load *and* a live `hashchange`, cross-transitions (case→case swaps in place, case→resume closes first, dark→`#kinko` returns to light), Back/Forward, and `replaceState` history hygiene on polaroid flip |
| `verify-kbd-meta.js` | 22 | A11y + metadata. Case CTAs are real `<a href="#slug">`; polaroid is Enter/Space operable; overlay is a focus-managed dialog (focus in → Tab **and** Shift+Tab trapped → Escape → focus restored to trigger → scroll lock released); Escape forwarded out of same-origin iframes; `:focus-visible` exists; share/OG/twitter/canonical/JSON-LD on **both** documents |
| `verify-eased-scroll.js` | 10 | The eased wheel loop: eases over many frames, monotonic, settles exactly at page end, nested scrollers (`.overlay-body`) never hijacked, page frozen behind an open overlay, reduced motion falls back to native, and no throw when `e.target` isn't an Element |
| `verify-mobile-cta.js` | 9 | The desktop-only case-study CTAs on `mobile.html`. index.html's router sends sub-1024px viewports back to mobile.html, so a plain `href="index.html#slug"` **bounces** the reader to the post they're already on — these say "on desktop" and copy the canonical URL. Asserts the label, absolute href, that it's still a real `<a>`, no navigation on tap, the toast, the copied value, and that email-copy still shares the toast |
| `verify-statusbar.js` | 2 | The iOS status-bar scrim on `mobile.html`. `viewport-fit=cover` lets the feed run edge to edge, so content scrolls **under** the status bar and the topbar only appears after the hero — reported on a real device as the clock/battery sitting on moving copy. Headless reports `env(safe-area-inset-top)` as 0, so the suite fakes a 47px inset and asserts the scrim paints the page background and stays under the topbar (z 49 < 50) |
| `verify-fonts.js` | 5 | Subset-webfont coverage. The three variable fonts are subset to the characters the site renders (Unbounded 1138 → 114 codepoints), so new copy using an outside glyph would silently render in a fallback face. Walks every state, collects rendered characters per font, and asks `document.fonts.check()` whether the loaded font truly covers them; anything uncovered must be on `KNOWN_FALLBACK` (absent from the ORIGINAL fonts too). Also asserts the 200→900 weight axis still varies |
| `verify-payload.js` | 8 | Over-the-wire budget per page (total / images / fonts / no single asset >300 KB), measured cold with a fresh cache-disabled context per page. Exists because a 33-megapixel image shipped unnoticed to fill a 616px slot |
| `verify-cards.js` | 15 | Both featured theatres (2 slides, images decoded, dot nav + `aria-pressed`) and the last-card recede on **both** stacks (full size at pin → mid-recede → deck scale before release, with earlier cards staying settled) |

## Notes for whoever runs these next

- **Always headless.** The in-app browser pane throttles rAF and cannot drive
  this site (card stacks collapse, scrolls hang). Puppeteer is resolved from
  `/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer`.
- **Never `networkidle2`** on this site — the dark world lazy-loads 42 rotor
  shots and each case overlay 30+ images, so the network never goes idle inside
  the default 30s timeout. Use `domcontentloaded` plus an explicit settle wait.
- **`alterEgoMode` is a script-scope `let`, not on `window`.** Probe the dark
  world via `getComputedStyle(document.getElementById('alter-ego-content')).display`.
- **`.overlay-body` is `scroll-behavior: smooth`** — set it to `auto` before any
  scripted scrolling or reads return stale values.
- **Synthetic `wheel` events go through the eased-scroll lerp**, so wait ~600ms
  for a notch to settle before asserting. `window.scrollTo` is adopted by the
  loop and behaves natively, so scripted scrolls need no special handling.
- Overlay transitions and the alter-ego blob wipe run 650–900ms; the suites use
  a ~1100ms settle rather than racing them.
- **`navigator.share` exists in headless Chrome but never settles** — awaiting it
  hangs indefinitely (it hung this harness for two minutes). Don't rely on it in
  page code, and don't await it in a test.
- **Disable the cache per page when measuring payload.** Puppeteer shares an HTTP
  cache across pages in one browser, so the second page measured reports ~0 KB of
  fonts and a fictitiously light total. `verify-payload.js` uses a fresh
  `createBrowserContext()` with `setCacheEnabled(false)` for each page.
- **Freeze `setInterval` before pixel-diffing.** The featured/mobile media
  theatres auto-advance every 2s, so unfrozen runs diff on which slide is showing
  rather than on the thing under test.
- **Prefer `waitForFunction` over fixed delays.** `verify-mobile-cta.js` was
  briefly flaky because a fixed settle raced the script attaching its click
  handler on cold runs. A flaky gate is worse than no gate.
- `tests/` totals **92 checks**; a full `run-all.js` pass takes ~60–90s.
