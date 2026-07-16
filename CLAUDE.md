# Portfolio Website — Divyansh Rastogi

## Project Overview
Portfolio for Divyansh Rastogi, product designer (IDC IIT Bombay, AIR 5).
Goal: **get hired**. Experimental/creative vibe with a dual-persona concept:
the light "day job" world flips (via the hero polaroid) into a dark
"alter ego" world of films, photography, and art.

Live at **https://www.divyanshrastogi.in** — GitHub Pages, repo
`Divyansh1401/Portfolio`, branch `main`. "Push to git" = stage + commit +
push (see Deployment below for the one-time force-push requirement).

> This file was rewritten 2026-07-16 to match the shipped site. Companion
> docs: `PROJECT-INDEX.md` (file/system map), `design-system.md` (tokens,
> type, buttons, motion rules), `TODO.md` (work log + backlog).

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
  tilt/flip, stacks, rotor effects, blob wipe.
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
5. **Two oranges are live** (`--orange #E06B2D` vs `--c-orange #EA7623`) —
   known inconsistency, consolidation is a pending DESIGN decision.
6. **overlayBody injection** adds `loading="lazy" decoding="async"` to all
   template images via string replace — keep that when touching `openOverlay`.
7. `#kinko` is intentionally gated (NDA) — the hash scrolls to the card, the
   `caseStudies.kinko` template is unreachable and still contains
   placeholders (delete or finish before ever un-gating).

## Deployment
- GitHub Pages serves the repo root; pushing `main` updates the live site.
- ⚠️ **Git history was rewritten 2026-07-16** (scrubbed `projects/`,
  `.claude/`, `kinko-design-system-report.md` — they remain on disk,
  gitignored). **The next push must be
  `git push --force-with-lease origin main`**; normal pushes after that.
  Pre-scrub backup: `~/Desktop/portfolio-pre-scrub-backup.bundle`.
- All pushes are held until the project thumbnail images are final
  (owner's call, tracked in TODO.md).

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

Still open: radius scale, og-image refresh (could pick up the
credential line), thumbnails (owner does last), then the one-time
force-push.
