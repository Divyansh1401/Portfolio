# Portfolio Website — Divyansh Rastogi

## Project Overview
Portfolio for Divyansh Rastogi, product designer (IDC IIT Bombay, AIR 5).
Goal: **get hired**. Experimental/creative vibe with a dual-persona concept:
the light "day job" world flips (via the hero polaroid) into a dark
"alter ego" world of films, photography, and art.

Live at **https://www.divyanshrastogi.in** — GitHub Pages, repo
`Divyansh1401/Portfolio`, branch `main`. "Push to git" = stage + commit +
push (see Deployment below for the one-time force-push requirement).

> This file was rewritten 2026-07-16 to match the shipped site, and
> corrected 2026-07-26 (two stale gotchas removed — see Gotchas; eased
> scroll + last-card recede documented). Companion docs:
> `PROJECT-INDEX.md` (file/system map), `design-system.md` (tokens, type,
> buttons, motion rules), `TODO.md` (work log + backlog).

## Architecture
Two hand-written documents, no build step:

- **`index.html`** — the desktop site (viewport ≥1024px). Everything lives
  here: light world, dark world (`#alter-ego-content`, `display:none` until
  flipped), case-study overlays (templates in the `caseStudies` JS object),
  resume overlay, photography lightbox. One giant `<script>` block at the end.
- **`mobile.html`** — the "pocket feed" (<1024px). Independent document,
  same design language. First visit always opens on the WORK feed (dark mode
  here is a *content switch* — `html.dark` hides `.world-light` — so
  prefers-color-scheme is deliberately ignored; only a saved `feed-theme`
  localStorage choice applies).
- Each page's first head script redirects across the 1024px line **and
  forwards `location.hash`** (mutually exclusive media queries, no loop).

## Deep links — the hash is the source of truth (index.html)
`routeHash()` + `hashchange` drive all overlay/world state; UI triggers set
the hash. Supported: `#settlr` `#refer-earn` `#resume` `#hobbies`
`#photo-N` (dark world + lightbox, 1-based) `#kinko` (scroll to locked card)
`#connect` (native anchor). Back/Forward correctly open/close overlays;
polaroid flips and lightbox browsing sync the URL via `replaceState` (no
history spam). The initial `routeHash(true)` call is the LAST line of the
script — keep it there (it needs every init before it).

## Scroll (index.html only)
Wheel input is **eased** by a hand-rolled lerp loop (no dependency, in the
main script after `initCardStack`). It moves a virtual `target` and lerps the
**real** scroll position toward it via `scrollTo` — never a transformed
wrapper. That is deliberate: driving native scroll is why `position: sticky`,
both card stacks, IntersectionObservers, scrollbar drag and hash routing keep
working untouched; they just receive a smoothed stream. Tuning lives in two
constants: `EASE` (fraction of remaining distance per frame) and `MAX_STEP`
(px cap per notch).

Left native on purpose: keyboard, scrollbar drag, programmatic scrolls,
horizontal intent, ctrl+wheel zoom, and **anything inside a nested scroller**
(`.overlay-body`, horizontal rails, iframes — walked by
`overNestedScroller`). Off entirely under reduced motion and on coarse
pointers (touch momentum beats any lerp). `mobile.html` has none of this.

**Testing implication:** `window.scrollTo` from a test is adopted by the loop
and behaves natively, so existing scripted-scroll tests are unaffected — but
a synthetic `wheel` event goes through the lerp, so wait for it to settle
(~600ms at current tuning) before asserting.

## Dev workflow
- **Server**: `npx serve -p 3457 .` (launch.json name `portfolio-v2`).
  `serve.json` sets `cleanUrls:false` + a root rewrite — do not remove it;
  it matches GitHub Pages behavior and keeps the Settlr prototype's `<base>`
  shim race-free (removing it brings back a 72-error 404 storm).
- **Verification**: the in-app browser pane throttles rAF and CANNOT drive
  this site (card stack collapses, scrolls hang). Always verify with
  headless Puppeteer (require from `/Users/divyanshrastogi/Desktop/settlr/node_modules/puppeteer`).
  Existing suites in the session scratchpad: `verify-deeplinks.js` (20),
  `verify-kbd-meta.js` (16), `fingerprint.js` (computed-style snapshot).
- Both suites + zero console errors is the bar for any interaction change.

## Accessibility & performance invariants (don't regress these)
- Case-study CTAs are real `<a href="#slug">` links; overlays are
  focus-managed dialogs (focus in, Tab trap, focus restore); same-origin
  iframes forward Escape to the parent.
- `#heroPolaroid` is keyboard-operable (`role="button"`, Enter/Space).
- Global `:focus-visible` outline on both pages.
- `PREFERS_REDUCED_MOTION` gates: cursor (off + native cursor CSS), polaroid
  tilt/flip, stacks, rotor effects, blob wipe, **eased scroll** (falls back to
  native wheel and hands `scroll-behavior` back to the browser), nav
  typewriter (sets text instantly, no caret).
- Every rAF loop idles: settle-skip style writes; the 3D rotor renders only
  while `alterEgoMode` is true. Overlay/rotor images are lazy.

## Gotchas (current and real)
1. **Polaroid inline transform**: markup ships `rotateY(180deg)` inline; the
   polaroid tick's FIRST write corrects it (`firstWriteDone` flag). Don't
   make the settle-skip unconditional.
2. **Dark receipt foil**: both footers run `initReceiptFooter` at load; the
   dark one is hidden (0×0 canvas) — a ResizeObserver redraws the foil when
   it gains size. Same pattern applies to anything initialized inside
   `#alter-ego-content`.
3. **Settlr embed**: `prototype/settlr/` runs offline in seed-data mode.
   `icons/` is deliberately excluded (37MB) — phosphor `@import`s are removed
   from `tokens/index.css`; re-syncing the mirror must re-apply that patch
   (full re-sync recipe in project memory).
4. **Case overlay body scroll** is `scroll-behavior: smooth` — set it to
   `auto` before scripted scrolling in tests.
5. **overlayBody injection** adds `loading="lazy" decoding="async"` to all
   template images via string replace — keep that when touching `openOverlay`.
6. `#kinko` is intentionally gated (NDA) — the hash scrolls to the locked
   card. There is **no `caseStudies.kinko` template**; the object holds
   exactly two keys, `settlr` and `'refer-earn'`. Nothing to un-gate.
7. **Scroll events are dispatched ASYNCHRONOUSLY.** A "am I writing right
   now?" boolean around a `scrollTo` is always `false` again by the time the
   event lands, so a scroll-driving loop reads its own write as user input.
   Compare positions (`lastWritten`) instead — this exact bug killed the
   eased-scroll loop after one frame (page moved 15px and stopped).
8. **`transform` writes do not dirty layout**, so the card stack's
   `getBoundingClientRect()` reads next to `style.transform` writes are NOT
   layout thrash (measured: 30 layouts / 180 scroll frames). Don't "fix" it.
9. **Card-stack trailing spacer has a side effect**: appending
   `.card-stack__end` makes the last slot match
   `:not(:last-child)`, so the LAST panel also inherits the 30vh slot
   margin — and sticky pin/release points shift by that margin (margins
   shrink the sticky constraint box). `initCardStack` measures it at runtime;
   don't hardcode it.

## Analytics (PostHog, cookieless)
Both documents carry an inert PostHog loader in `<head>`, immediately **below**
the viewport router. Set `PH_KEY` in BOTH files to switch it on; empty = no
script, no request, no globals.

- `cookieless_mode: 'always'` — no cookies, no local/sessionStorage, **no
  consent banner required**. Costs: no `identify()`, no session replay, no
  cross-visit stitching, and PostHog's IP-based **GeoIP and bot detection do
  not enrich events** (expect no country data and some crawler noise).
- **The loader MUST stay below the router and re-check the media query.**
  index.html replaces the document under 1024px and mobile.html above it, so
  initialising first logs a phantom pageview + instant bounce for every visitor
  on the other form factor and wrecks the desktop/mobile split.
- Case studies are hash routes, invisible to autocapture — hence explicit
  `track()` calls. Events: `case_study_opened` `resume_opened` `world_flipped`
  `photo_opened` `email_clicked` `outbound_clicked` `desktop_case_study_copied`.
- `window.track()` is defined as a no-op before load, so the ~9 call sites are
  always safe to invoke. Guarded by `tests/verify-analytics.js`.
- GitHub Pages is static and **cannot reverse-proxy**, so ad blockers will drop
  a share of traffic — biased toward exactly this site's design/tech audience.
  Treat the numbers as directional.
- Cost when enabled: ~73 KB brotli (measured, not the docs' 52 KB figure).

## Deployment
- GitHub Pages serves the repo root; pushing `main` updates the live site.
- ⚠️ **Git history was rewritten 2026-07-16** (scrubbed `projects/`,
  `.claude/`, `kinko-design-system-report.md` — they remain on disk,
  gitignored). **The next push must be
  `git push --force-with-lease origin main`**; normal pushes after that.
  Pre-scrub backup: `~/Desktop/portfolio-pre-scrub-backup.bundle`.
- All pushes are held until the project thumbnail images are final
  (owner's call, tracked in TODO.md). Partly closed 2026-07-25: the desktop
  featured cards now carry real photography; `mobile.html` still uses the
  older `thumbnail.webp` set.
- `main` has **no upstream tracking ref locally** (fallout of the rewrite), so
  `git log origin/main..HEAD` returns nothing — fetch before trying to diff
  against the remote.
- `dump/` is gitignored: raw photo drops land there and are converted to webp
  into `assets/images/` before use. Pages serves the repo ROOT, so any stray
  file that gets committed becomes a public URL — check `git status` for
  scratch files (e.g. `_section-redesign-test.html`) before pushing.

## Pending work
See `TODO.md` (backlog + work log) and the audit report artifact
(2026-07-16) for the full prioritized list.

Owner decisions already made (2026-07-16) — do NOT re-propose:
- APPLIED: hero credential line, case-study end CTAs, AA contrast pass,
  one orange (#E06B2D), Settlr cover retouch (backtick + 40→43).
- DECLINED, keep as-is: motion curation (small-card cursor-chase,
  polaroid ±30° tilt, 34px stack drift all stay) and photo curation
  (rotor keeps all 42 shots; mobile Cars/More keep 17 each). The
  suspected Hydrone/Cyanotype mislabels were checked and are NOT
  mislabels.
- DECLINED 2026-07-26: **Connect section redesign.** Three directions were
  built and reviewed; owner kept the current design ("keep as is, i like
  current one"). The ~350px of empty space bottom-left is accepted. Do not
  re-propose.

Shipped since (do not re-propose as "pending"): radius token scale · nav
world-toggle + flip choreography (typewriter title, blob-synced bar sweep,
sliding thumb) · Settlr case-study refresh from the project's own
`CASE-STUDY-REPORT.md`, counts unified on the report's numbers (60 primitives
/ 190+ tokens / 41 components) · featured-card photography carousels ·
card-stack last-card recede · eased scroll.

**Verified DONE despite what older notes claim** (checked 2026-07-26, don't
redo the analysis):
- Responsiveness: **zero horizontal overflow** at 1024/1280/1366/1440/1512/
  1728/1920, card panels fit every viewport. TODO §1 overstates the problem.
  (The only element past the right edge is the parked case-study overlay — by
  design.) Tablet 768–1023px on `mobile.html` is the one real gap.
- One orange: consolidated to `#E06B2D` (was gotcha 5).
- Kinko placeholders: template deleted entirely (was gotcha 7).
- UX/Hobbies toggle: shipped as the Work / After-hours nav switch (TODO §19).
- og-image: **already correct.** The 1200×630 card at
  `assets/images/og-image.png` carries the credential line ("Product Designer
  II at Head Digital Works · IDC IIT Bombay · AIR 5 · Open to full-time
  roles"). The long-standing "og-image refresh to pick up the credential line"
  note was stale — it's in there. It's a personal card, not project-specific,
  so case-study edits don't invalidate it.
- Scroll performance: already 60fps before eased scroll (p50 16.7ms, 0 frames
  >20ms); only 7 elements are genuinely promoted layers. **No perf pass
  needed** — don't chase `will-change` counts, they're CSS declarations, not
  layers. The nav's `backdrop-filter: blur(18px)` does re-blur every scrolled
  frame; that is inherent to the glass look and changing it is a DESIGN call,
  not a perf fix.

Still open: mobile thumbnails · third carousel slide per card · Splitwise
research images + copy · the Tier-3 design work in TODO.md (Connect,
Philosophy density, Refer & Earn layout, Settlr title/embed container, tablet
768–1023px) · rebuild the deep-link + kbd-meta suites (they lived in a session
scratchpad and are gone) · then the one-time force-push.
