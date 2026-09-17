# Portfolio Website — Divyansh Rastogi

## Project Overview
Portfolio for Divyansh Rastogi, product designer (IDC IIT Bombay, AIR 5).
Goal: **get hired**. Experimental/creative vibe with a dual-persona concept:
the light "day job" world flips (via the hero polaroid) into a dark
"alter ego" world of films, photography, and art.

Live at **https://www.divyanshrastogi.in** — Vercel (serving the repo root from
the `main` branch), repo
`Divyansh1401/Portfolio`, branch `main`. "Push to git" = stage + commit +
push. A plain `git push origin main` — see Deployment below; the old
force-push requirement is spent.

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
- Each page's first head script redirects across the 1024px line and forwards
  **both `location.search` and `location.hash`** (search matters: it carries
  UTM tags and the `?nostats=1` analytics opt-out).
- ⚠️ **"Mutually exclusive media queries, no loop" was WRONG.** A real iPad
  reporting viewport width 1210 ping-ponged between the two documents — 7
  pageviews in 3.5 minutes — because the two documents read different widths,
  not because the queries overlapped. Two defences now: **asymmetric
  thresholds** (index.html leaves at `max-width: 1023.98px`, mobile.html
  returns only at `min-width: 1064px`, leaving a 1024–1063.98px dead band where
  neither redirects) and a **one-hop-per-8s `sessionStorage` cooldown** per
  tab. Do not "tidy" the asymmetry to 1024/1024 — that is the bug.
  Root cause is only partly addressed: the router still runs **before**
  `<meta name="viewport">`, so it reads the pre-meta layout viewport. See
  "Deferred" in `.claude/ANALYTICS-PLAN.md`.

## First-paint loader (index.html only)
`assets/js/bouquet-loader.js` + `#bq-loader` as the FIRST child of `<body>`:
the voxel bouquet from `~/Desktop/Vyomi's Birthday/Experiments/bouquet/` flies
in (4.2 s, **turns 1**, camera sweep `yawIn` −540° → 0, landing culled), then a
scroll-scrubbed dispersal (wheel/touch/keys drive q both ways, page never
moves) hands off to the hero. **ON for visitors since 2026-09-18**
(`ENABLED = true`). Skips on any `#hash`, reduced motion, `?noloader`, under
webdriver, and **once per browser** (`localStorage bq-seen`, sessionStorage
fallback — functional like `vp-hop`; the owner's "once the site is cached, no
loader"). `?loader` forces it. `run()`'s `turns` fallback is **1** — it was 0
until 2026-09-18, which is why the live loader looked flatter and slower than
`bouquet.html`'s hero (proved byte-identical at equal p after the change; the
old 0 dated from when TURNS was a *minimum*). Events: `loader_shown`,
`loader_done {exit, seconds}`, `loader_skipped {why}`. Bench:
`_bouquet-loader-test.html` (gitignored) and the "Loader bench" panel on
`bouquet.html`'s hero (open by default, owner's call). Plan and the renderer
bugs fixed on the way: `.claude/BOUQUET-LOADER-PLAN.md`. Not on `mobile.html`.

## The two tool pages (live 2026-09-18, desktop-only by design)
Both open from `a.nav-icon` links in `index.html`'s nav (**new tab**,
`tool_opened {tool}`), neither is linked from `mobile.html` (pointer/wheel
interactions; owner decision 2026-09-11). Both carry a copy of the PostHog
loader (`doc_surface: bouquet | spray`) and the standard OG/canonical set with
stills at `assets/images/og-bouquet.jpg` / `og-spray.jpg`. Both are in
`verify-payload.js`'s budget.

- **`bouquet.html` — the making-of explainer.** Hero = the shipping loader
  module with the bench panel; then **nine scroll-scrubbed "beats"** (ids
  `beat-1 2 3 5 6 tp 7 8 10`, eyebrows renumbered 1–9; four were cut on
  2026-09-17 as history-not-mechanism), each a `.beat` card driven by
  `assets/js/bouquet-explainer.js` (harness: `scrub`, `mountBeat`, `split`,
  `diff`, `seek`) and its own `assets/js/beats/beat-N.js`. The plain-register
  copy rules, colour roles and the **pinned mapping** (card sticky under the
  nav; on phones only the STAGE pins and the head scrolls away) are in
  `.claude/BOUQUET-EXPLAINER-PLAN.md` §1 — read it before touching a beat.
  The renderer exposes explainer hooks (`cells sets show tint alpha drawLimit
  sortInFlight params path order rank legacy project basis`, documented in the
  loader's API block); every hook defaults to today's frame byte-for-byte.
  Gotchas: `onLeave` fires once at load for below-fold sections (re-assert
  constants in `onEnter`); `cells()` order ≠ paint order at yaw ≠ 0; the
  stage's `aspect-ratio` + height clamp would shrink its WIDTH and sit left —
  it is `width:100%` on purpose. Events: `bouquet_beat_reached {beat, index}`,
  `bouquet_bench_changed {control}`, `bouquet_replay`. Suites:
  `verify-bouquet-doc.js` (hero, bench, nav icons, spray smoke) and
  `verify-bouquet-explainer.js` (harness + `tests/beats/beat-N.test.js`,
  auto-discovered, one fresh page each; ~5 min).
- **`spray.html` — the spray can.** Owner-built; the dock's last item is
  "Back to portfolio" (`index.html?noloader`). Events: `spray_first_stroke
  {seconds}`, `spray_action {action}`.

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
  The suites live in `tests/` and are committed — an older note called them
  lost to a session scratchpad, which was wrong: `verify-deeplinks.js` (21)
  and `verify-kbd-meta.js` (22) both run green today. `node tests/run-all.js`
  runs the whole gate (13 suites incl. the two bouquet suites, ~15 min, each
  suite retried once on failure). `verify-bouquet-loader.js` (21) forces the loader with `?loader`;
  every other suite never sees it because it skips under `navigator.webdriver`. Only `fingerprint.js` (computed-style snapshot) is genuinely gone.
- The full gate passing + zero console errors is the bar for any interaction
  change.

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
   don't hardcode it. **And don't zero it on the last panel** (tried
   2026-09-18 to shorten the gap before "More work"): every panel releases at
   its own bottom + its own margin, so unequal margins release the deck OUT
   OF ORDER — Refer & Earn un-pinned 240px before Kinko finished receding.
   The dead space is cancelled with a negative margin on the stack instead
   (`cancelTrailingMargin()`), which lives outside the sticky box.

## Analytics (PostHog, cookieless)
Both documents carry an inert PostHog loader in `<head>`, immediately **below**
the viewport router. Set `PH_KEY` in BOTH files to switch it on; empty = no
script, no request, no globals.

- `cookieless_mode: 'always'` — **PostHog** writes no cookies and no
  local/sessionStorage, so **no consent banner is required**. (The viewport
  router does write one sessionStorage key, `vp-hop`, and mobile.html writes
  `feed-theme` in localStorage. Both are *functional* keys — a redirect
  cooldown and a saved theme — not analytics identifiers, and neither changes
  the no-banner posture.)
  Costs: no `identify()`, no session replay, no cross-**visit** stitching.
  Sessions themselves still work: the SDK never builds a client-side session id
  under cookieless (it throws if you try), so events carry no `$session_id` and
  PostHog sessionizes them **server-side** (`cookieless_server_hash_mode: 2`,
  "Stateful"). Session-scoped funnels and durations are available; only the
  returning-visitor link is lost.
- **Bot detection — read this before touching any insight.** Two different
  mechanisms get confused:
  - **Client-side blocking is REAL and it runs.** posthog-js checks the UA
    against a blocklist and ends with `return !!navigator.webdriver`. That is
    why headless Puppeteer never sends a single ingestion request — useful for
    the test gate, but it means automated checks can never assert on network
    traffic.
  - **Query-time `$virt_is_bot` is dead here.** It is derived from
    server-side/IP enrichment, which cookieless plus `anonymize_ips: true`
    switches off. With no enrichment, **every real human on this site
    classifies as a bot.** ⚠️ **NEVER add an "exclude bots" filter to an
    insight, funnel or dashboard — it returns a confident zero.** The site's
    actual crawler defence is the `before_send` filter in both loaders, which
    drops the one signature that dominated the sample (viewport height ==
    screen height at >=1024px wide).
  - Also absent for the same reason: GeoIP, so there is no country data.
- **The loader MUST stay below the router and re-check the media query.**
  index.html replaces the document under 1024px and mobile.html above it, so
  initialising first logs a phantom pageview + instant bounce for every visitor
  on the other form factor and wrecks the desktop/mobile split.
- Case studies are hash routes, invisible to autocapture — hence explicit
  `track()` calls. Events: `case_study_opened` `case_study_progress`
  `loader_shown` `loader_done` `loader_skipped` `tool_opened`
  `bouquet_beat_reached` `bouquet_bench_changed` `bouquet_replay`
  `spray_first_stroke` `spray_action`
  `case_study_closed` `resume_opened` `resume_downloaded` `world_flipped`
  `photo_opened` `email_clicked` `outbound_clicked` `work_viewed` (mobile only)
  `desktop_case_study_copied`.
- `window.track()` is a **50-slot buffer** before load, not a no-op: it queues
  `[name, props, timestamp]` and the flush after `posthog.init` replays each
  call with its ORIGINAL timestamp. The no-op silently threw away every event
  fired on a cold deep link — which was the most valuable event on the site.
  It never throws, so the ~11 call sites are always safe to invoke. Guarded by
  `tests/verify-analytics.js`.
- `?nostats=1` on either document suppresses PostHog entirely (no script, no
  globals) and survives the viewport redirect. It is the only owner opt-out
  that works on the production domain: cookieless creates no persons, so
  PostHog's cohort-based "filter internal users" is structurally inert, and
  `internal_or_test_user_hostname` only covers localhost. **Sticky since
  2026-09-17**: `?nostats=1` once writes localStorage `nostats` and every
  later plain visit from that browser profile is silent; `?nostats=0` clears
  it. Per device/profile, never in incognito. Guarded by the "sticky" checks
  in `tests/verify-analytics.js`; `nostats` is on that suite's storage
  allowlist next to `vp-hop` / `feed-theme`.
- **The site is hosted on Vercel, not GitHub Pages** (confirmed 2026-08-04 from
  the live response headers). The old "GitHub Pages is static and cannot
  reverse-proxy" line was wrong on both counts. Ad blockers still drop a share
  of traffic — biased toward exactly this site's design/tech audience, so treat
  the numbers as directional — **but that is now fixable**: a `vercel.json`
  rewrite from a first-party path to `eu.i.posthog.com`, plus matching
  `api_host` / `ui_host` in both loaders, would recover it. That is the single
  largest source of undercounting on this site. There is no `vercel.json` in
  the repo today. Staged separately — see the note in
  `.claude/ANALYTICS-PLAN.md`; it needs a post-deploy check that a fresh
  visitor still gets a DISTINCT cookieless id, or every visitor collapses into
  one person.
- Cost when enabled: **~86 KB brotli across 4 requests** (measured 2026-08-04:
  array.js 75 + dead-clicks-autocapture 7 + web-vitals 3 + remote config 1).
  Not the docs' 52 KB, and not the 73 KB an earlier note claimed. The SDK is
  pinned to a version (`PH_VER`) in both files; that pins array.js only — the
  lazy chunks still come from the rolling path with a `?v=` cache-buster.

## Deployment
- Vercel (serving the repo root from the `main` branch) serves the repo root;
  pushing `main` updates the live site.
- Git history was rewritten 2026-07-16 (scrubbed `projects/`, `.claude/`,
  `kinko-design-system-report.md` — they remain on disk, gitignored).
  ✅ **That force-push has already happened; normal pushes from here.** The
  long-standing "the next push MUST be `git push --force-with-lease origin
  main`" warning was stale and is retired — verified 2026-08-04:
  `origin/main` was at `34a0874`, a direct ancestor of local `HEAD`, and
  `git push --dry-run` reported a plain fast-forward (`34a0874..f8e61a5`).
  **Do not reinstate it.** If you ever genuinely need to know, ask git rather
  than this file: `git fetch origin && git merge-base --is-ancestor
  origin/main HEAD` exits 0 when a normal push suffices.
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
768–1023px). The "rebuild the deep-link + kbd-meta suites" and "one-time
force-push" items are **both closed** — the suites were in `tests/` all along
and the force-push is spent.
