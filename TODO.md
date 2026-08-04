# Portfolio Development TODO

## 1. Core Experience & Responsiveness
- [ ] **Responsiveness**: Implement full fluid layouts for all desktop and laptop screen sizes (13", 14", 16", etc.).

## 2. Glitch Fixes & Functional Refinement
- [ ] **Glitches**:
    - [x] Fix "Featured Projects" title behavior/visibility after theme switch. — OBSOLETE 2026-07-16: the light world is fully hidden in dark mode since the rework; flips verified clean both ways.
    - [x] Fix Scratch Card functionality — DONE 2026-07-16 (receipt foil works in both worlds; dark-footer init bug fixed). Full redesign = open design call if still wanted.
    - [x] Fix Resume button SVG-mask issue — OBSOLETE 2026-07-16: no SVG mask/hole system exists in the current build.
- [x] **Cursor Interaction**: "Hold to Peel" — OBSOLETE 2026-07-16: feature no longer exists (zero references in the code).

## 3. Section Redesigns
- [x] **Connect Section**: **DECLINED 2026-07-26 — owner reviewed three directions and kept the current design.** Do not re-propose. (Mockups: contact-rows / availability-ledger / email-as-hero, all keeping the receipt and filling the bottom-left space. Owner: "keep as is, i like current one.") Explorations left on disk in the gitignored `_connect-explorations.html`.
- [x] **Philosophy Section**: DONE 2026-07-26 — rebuilt as Proposal A (editorial list). See §19.
- [x] **Refer and Earn**: **PREMISE WAS STALE — closed differently 2026-07-27.** The item (written 2026-04-21) asked to "reduce text and redesign for a more visually appealing layout"; measurement showed the opposite. At **972 words / 14 images it is 69 words-per-image vs Settlr's 76** — marginally *less* text-dense than the flagship, and the two sections that looked image-less are the strongest (a real conversion funnel with per-stage drop-offs, and a three-lens research grid with user quotes). Cutting would have destroyed good work. The actual gap was that a case study built on a broken funnel **never said whether it worked**. Closed by adding an honest outcome section instead — see §21.

## 4. Navigation & Page Structure
- [ ] **UX/Hobbies Toggle**: Add a clear toggle or profile button to help users distinguish between UX/Work and Photography/Art/Hobbies pages.
- [ ] **Photography**: Upload and integrate more photography assets.
- [x] **Settlr Title**: **DONE 2026-07-27, reframed.** The visible design already carries the title (it's set in the cover art). The real defect was structural and applied to BOTH case studies: **16 h2s under no `<h1>`**, with the project name existing only as pixels. Added an `sr-only` h1 to each and rewrote the hero `alt` to describe the image rather than repeat the title (no double announcement). Zero visual change. See §22.

## 5. UI Consistency & CTAs
- [x] **Button Consistency**: DONE 2026-07-16 — both featured CTAs are now identical real links (a.cs2-cta); dead button systems purged.
- [x] **Navigation Icons**: DONE — More-work card titles carry Redirect.svg icons.
- [ ] **Settlr Case Study**:
    - [x] Update "View on Behance" CTA — already reads "View Research on Behance" (verified 2026-07-16).
    - [x] **ALREADY DONE — verified 2026-07-27.** The mirror was re-synced 2026-07-16 and commit `f4cefcf` polished the embed layout. Current state: dark rounded container, the live shipping build in a phone frame, "The real app. Running right here.", a 6-of-24 jump-to-screen pill grid, and an honest "this is the shipping build, not a mockup" caption. Measured 0 console errors, 0 4xx. Nothing to do.
- [ ] **Thumbnail Upgrades**: Use actual project thumbnails across the board.

## 6. Project Content Updates
- [ ] **Kinko Insurance**:
    - [ ] Populate with initial project data.
    - [x] Explicitly mention "Coming Soon" — DONE (mobile Kinko veil says Coming Soon; desktop card is the Under-NDA lock).
- [ ] **Settlr / Splitwise**:
    - [ ] Add images for the Splitwise research section.
    - [ ] Refine the "What Splitwise taught us" section and sharpen the copy.
- [ ] **Art Section**: Add more data and artwork assets.

---

## 7. Mobile + Merge + Settlr (batch — 2026-07-13, push together)

### From this session (user-raised)
- [x] **Sticky Settlr prototype**: DONE — the whole "Try It" viewer (phone + switcher) is now `position: sticky` and pins to the viewport for ~400px while you interact, then releases. Switched `.cs-proto-section--dark` from `overflow:hidden`→`visible` (it was capturing the sticky) + `min-height:140vh` dwell. _(2026-07-13)_
- [x] **Sticky playground**: DONE — same pattern: `.cs-lib-frame` is `position: sticky` with `.cs-lib-section { min-height:150vh }` dwell; pins ~400px while you explore. Both fit fully in view when pinned; no console errors. _(2026-07-13)_
- [x] **Doc-sheet shrink order (desktop)**: DONE — `--cs-peek` is now `clamp(40px, calc(100vw - 1320px), 120px)`, so the sheet holds its 1160px reference size while the left peek collapses 120→40px (viewport 1440→1360), and only below 1360px does the sheet shrink (peek held at 40). Verified: 1440→1160/120, 1400→1160/80, 1360→1160/40, 1280→1080/40. _(2026-07-13)_
- [x] **"More Work" cards — responsive + mobile links**: DONE. Desktop — moved the 80px stagger off inline styles onto `.small-grid .small-card:nth-child(2/4)` and reset it at ≤1280px, so the 3-col/2-col grids align cleanly (stagger only in the 4-col layout). Mobile — replaced the generic "More in the archive" post with a tappable 2×2 `.mw-grid` (Prosper / Angel One / Whack A Math / Creative Burnout), each an `<a>` to its Behance gallery + "View all on Behance". _(2026-07-13)_
- [x] **Mobile footer redesign**: DONE — the receipt look was already ported; added the **scratch-to-settle interaction** to `mobile.html`'s receipt (`.rt-scratch-*` + `initScratch()`): a silver "SCRATCH" foil canvas you scratch with a finger (pointer events, touch-friendly), revealing "one coffee ☕ — on me / REDEEM →" at >45% cleared, marking the receipt `settled` (cue struck through) with a confetti burst. Verified both states + reveal in dark mode, no console errors. _(2026-07-13)_
- [x] **Stacked-card interaction (desktop Featured + Film)**: DONE — reworked to the ScrollStack behavior (progressive scale to baseScale 0.85, 30px stagger peek, no brightness/dim), fixed the last-card-not-pinning bug with a trailing spacer. Same properties for both stacks. _(2026-07-13)_
- [x] **Update Settlr prototype folder**: DONE 2026-07-16 — mirror re-synced from the Jul-16 source build (new: settle-amount/method/success + settlement-detail + onboarding-welcome views, renamed unsplash group covers converted to jpg), all 13 gallery screenshots regenerated, embed verified 0 404s. NOTE for owner: review whether the case-study TEXT should mention the newer app work.

### Deferred (agreed to revisit)
- [ ] **Single-URL merge**: optionally fold `mobile.html` into `index.html` as one responsive document so phones keep the clean root URL (instead of `/mobile.html`). Deferred from the 2026-07-13 merge.

### Claude's suggested additions (for review)
- [x] **Fix embedded-prototype 404s**: DONE 2026-07-16 — root cause was serve's clean-URL redirect racing the <base> shim; fixed with serve.json (cleanUrls:false + root rewrite) + phosphor imports removed from the mirror. 0 errors verified.
- [x] **Audit mobile art/photo categorization**: CHECKED 2026-07-16 — not mislabels. Hydrone's five images are all the octocopter concept renders; Cyanotype's lead is a genuine cyanotype print of car photos. No changes needed.
- [x] **Curate the big mobile carousels**: REVIEWED 2026-07-16 — owner saw a full keep/cut proposal (17→8 each + rotor 42→34 + motion curation) and chose to keep everything as is. Decision recorded in CLAUDE.md; don't re-propose.
- [x] **Resume button = always preview (never download)**: DONE — mobile buttons now open the Drive `/view` in a new tab (download URL removed); desktop already opens the overlay panel. _(2026-07-13, Antigravity + verified)_
- [x] **Tablet (768–1023px) polish for `mobile.html`**: DONE 2026-07-27 — column now scales with the viewport instead of sitting at a hard 520px. See §23.
- [x] **Share/meta tags**: DONE — description, theme-color, apple-web-app, OG, Twitter card + inline-SVG favicon added to both `index.html` and `mobile.html`. _(2026-07-13, Antigravity + verified)_ · og:image DONE _(2026-07-16)_: real 1200×630 card at `assets/images/og-image.png`, absolute URLs, og:url + canonical + JSON-LD Person added to both pages.
- [ ] **Deploy**: live site is GitHub Pages (Divyansh1401/Portfolio), NOT Netlify. Held until thumbnails land; first push must be `git push --force-with-lease origin main` (history rewritten 2026-07-16).

---

## 8. Nav flip choreography (2026-07-18)
- [x] **Nav rides above the world-flip**: DONE — lowered the blob-wipe overlay (`#ego-transition-overlay`) z-index 9800→740 (just below `#main-nav` at 750) so the nav restyles visibly on top of the wave instead of behind it; case-study (800) and resume (950) overlays still cover the nav. Added a `#main-nav::before` skin layer whose dark bar-style is revealed via `clip-path` on the same 840ms `cubic-bezier(0.22,1,0.36,1)` as the blob enter, sweeping right→left in sync with the blob edge; foreground colors (buttons/toggle/name) crossfade staggered by horizontal position.
- [x] **Typewriter nav title**: DONE — the left title backspaces and retypes between "Product Designer" ↔ "not just a product designer" with a blinking caret (~2.5–3s, theatrical, continues after the wave settles); generation-counter guards make rapid re-flips seamless; deep-link (`#hobbies`) and reduced-motion paths set the text instantly with no caret; the roll is `aria-hidden` so character churn never hits the a11y tree.
- [x] **Sliding toggle thumb**: DONE — the Work / After-hours segmented toggle's filled state now glides between labels (resizing to fit) with a slight-overshoot 320ms ease; measured from the active button, no first-paint flash, re-measured on resize + `document.fonts.ready`; reduced motion makes it jump.
- Verified headless: existing deep-link (20/20) and kbd-meta (16/16) suites still green, plus a new 26-check nav-flip spot-check green; zero console errors.

---

## 9. Settlr case-study content refresh (2026-07-25)
Source of truth: `/Desktop/settlr/CASE-STUDY-REPORT.md` (snapshot 18 Jul 2026) + `STATUS-AND-NEXT-STEPS.md`.
Answers the open note in §7 ("review whether the case-study TEXT should mention the newer app work").
- [x] **Overview**: leads with what Settlr *is* (live, India-first, PWA, no framework, no app server, Play-packaged); settlrapp.in linked from the Status meta row and inline; chips 5→7 (+ Installable PWA, Zero framework; "Supabase backend"→"Supabase + RLS").
- [x] **From Prototype to Product cards**: card 1 reframed to the zero-framework compiled-SPA build (24 screens → one file via a 213-line Python script, one npm dep, View Transitions); ghost card retitled **"Connect ≠ fold"** with the JSONB sum-on-collision detail; identity card now says email + changeable @handle, phone/OTP/contact-import gone, three phases shipped in a day; audit card spells out the owner/participant/stranger/hijack impersonation matrix.
- [x] **Distribution band** (new): the Play listing's own feature graphic (`assets/images/settlr/play-feature-graphic.webp`, converted from `store-assets/feature-graphic.png`, 25 KB) over a Web / Android / Store-ready trio; the old inline footnote kept, trimmed.
- [x] **Workflow section**: 3 items → 6 (2×3) — CLAUDE.md constitution, enforcer skills as a plain-English token linter, 1-variant scaling, the Figma→code authority flip, 4-agent adversarial pre-deploy review, and the honest "the system drifts too" note.
- [x] **Card copy**: featured stack panel + `mobile.html` post 01 now say the design system was *shipped* as a live multi-user app.
- Verified headless (Puppeteer, :3457): overlay opens, all new blocks render, 6 workflow items, feature graphic loads lazily, 0 console errors, 0 4xx.
- [x] **Counts unified on the report's numbers** (owner decision 2026-07-25): 60 primitives · 6 families / ~40 L2 + 150+ L3 = 190+ tokens / 41 components / ~20 text styles / 13 spacing values — applied across the overview stats grid, tier diagram, semantic-layer header, palette title (now "6 families. 60 primitives." + a line noting gray/gold round out the four shown), buttons/type footnotes, docs card, file tree, featured card, theatre caption, and `mobile.html`. "120 variants" kept (report doesn't contest it). **`thumbnail.webp` retouched in-place** (stats "43→41", "290+→190+", body "43→41-component") using the site's own Unbounded/Jakarta TTFs, calibrated against the untouched "24" (exact match at Unbounded 700/64px); original backed up in the session scratchpad as `thumbnail-ORIGINAL-backup.webp`. Verified headless: no stale strings in the rendered overlay, 0 console errors, 0 4xx.

---

## 10. Featured-card photography (2026-07-25)
Owner supplied 4 shots in `dump/`; converted to webp in `assets/images/`.
- [x] **Settlr card theatre → 2 new slides**: `settlr/featured-couch.webp` (phone on leather sofa, caption "Live on settlrapp.in") + `settlr/featured-playground.webp` (playground on a laptop). Replaces the thumbnail/Components/codebase trio; dots 3→2.
- [x] **Refer & Earn card → 2-slide theatre** (was a single parallax image): `refer-earn/featured-handheld-1/2.webp` (handheld A23 Rummy referral screen + post-referral earnings state). Reused the `.cs2-theatre` markup/JS (already initialized per-instance); added a light idle-dot override for `--refer` (dots sit over the near-black hand).
- [ ] **Third slide per card** — owner will supply later; carousel deliberately kept at two.
- Old `refer-earn/thumbnail.webp` still used by mobile.html + og; Settlr `thumbnail.webp`/`Components.webp` still used in the case study + mobile. Nothing orphaned.
- Verified headless: both theatres cycle via dots, captions update, images load, 0 console errors, 0 4xx.

---

## 11. Card-stack last-card recede (2026-07-26)
- [x] **Last card now settles into the deck before the stack scrolls out** (Featured + Film — shared `initCardStack`). It used to exit at scale(1) while the cards behind sat receded, because each card's recede is driven by the NEXT card's approach and the last card has none. Now its recede is driven by the stack container's bottom edge across the pinned dwell (pin → sticky release → scale 1 → 0.91), so the whole deck exits settled together. Trailing spacer 12vh→40vh (= the recede's scroll distance).
- Gotcha encoded in a comment: the appended `.card-stack__end` makes the last slot match `:not(:last-child)`, so the last card ALSO carries the 30vh slot margin — and sticky pin/release points shift by that margin (margins shrink the sticky constraint box). The recede math measures it at runtime.
- Verified headless on both stacks: scale walks 1→0.9325→0.91 across the dwell, card stays pinned throughout, releases at settle; earlier cards' behavior unchanged; 0 console errors.

---

## 12. Eased scroll (2026-07-26)
- [x] **Hand-rolled eased scroll** (~70 lines, zero dependency, in the main script after `initCardStack`). Wheel input feeds a virtual `target`; a rAF loop lerps the **real** scroll position toward it via `scrollTo`. Driving native scroll (not a transformed wrapper, the Locomotive approach) is why sticky, both card stacks, IntersectionObservers, scrollbar drag and hash routing all keep working untouched — they just get a smoothed scroll stream. `EASE = 0.11` (~330ms to cover 90% of a notch), `MAX_STEP = 140px` per notch.
- **Not hijacked, by design:** keyboard, scrollbar drag, programmatic scrolls, horizontal intent, ctrl+wheel (zoom), anything inside a nested scroller (`.overlay-body`, horizontal rails, iframes — walked via `overNestedScroller`), and the whole thing is off under `prefers-reduced-motion` and on coarse pointers (touch momentum already beats any lerp).
- **Two real bugs found and fixed during verification, both worth remembering:**
  1. `e.target` is `window`/`document` for synthetic wheel events → `getComputedStyle` threw. Normalize to an Element before walking ancestors.
  2. **Scroll events fire ASYNCHRONOUSLY**, so an "am I writing right now?" boolean is already `false` when the event lands — the loop read its own write as user input and killed itself after one frame (page moved 15px and stopped). Fixed by comparing `window.scrollY` against `lastWritten` (±1.5px) instead of a flag.
- **Perf pass: nothing to do — measured, not assumed.** Scroll already held 60fps before the change (p50 16.7ms, 0 frames >20ms); the card-stack `getBoundingClientRect()` reads do NOT force reflow because `transform` writes don't dirty layout (30 layouts / 180 frames). Only 7 elements are actually promoted layers in the light world and all are genuinely animated (the ego overlay is `visibility:hidden`, so it costs nothing) — the "13 will-change" count was CSS declarations, not layers. **Left alone deliberately:** the nav's `backdrop-filter: blur(18px)` re-blurs every scrolled frame — inherent to the glass look, invisible in headless (GPU rasterization), and only worth revisiting if it struggles on an integrated-GPU laptop. Changing it is a design call, not a perf fix.
- Verified: 9/9 eased-scroll checks (eases over 32 frames, monotonic, overlay wheel NOT hijacked, page frozen behind open overlay, scroll-lock intact, `#resume` deep link, reduced-motion falls back to native), settles exactly at page end with no overshoot, script cost 0.06ms; case-study/theatre/last-card suites all still green; 0 console errors.

---

## 13. Phase 1 — pre-launch gate (2026-07-26)
- [x] **Committed test suites in `tests/`** (68 checks, 4 suites + `run-all.js` runner + README). The old `verify-deeplinks`/`verify-kbd-meta` suites lived in a session scratchpad and were **lost**; they now live in the repo so that can't recur. `node tests/run-all.js` exits non-zero and is the pre-push gate.
  - `verify-deeplinks.js` (21) · `verify-kbd-meta.js` (22) · `verify-eased-scroll.js` (10) · `verify-cards.js` (15).
- [x] **Real bug the new suite caught: `mobile.html` was missing the JSON-LD Person block** — TODO §7 claimed it was "added to both pages" and that was wrong. Added, mirroring index.html, validated as parseable JSON.
- [x] **`_section-redesign-test.html` gitignored, NOT deleted** — it contains Philosophy + From-Prototype-to-Product redesign *proposals* (Proposal A editorial list etc.), which is exactly the Phase-3 Philosophy work. Deleting it would have thrown away directly relevant design work; gitignoring gets the launch safety (Pages serves the repo root, so a committed stray file becomes a public URL) without the loss. `_explorations/` ignored too.
- Test-harness gotchas worth keeping (now in `tests/README.md`): never `networkidle2` on this site (42 rotor shots + 30 imgs/overlay = network never idles inside 30s → use `domcontentloaded` + settle); `alterEgoMode` is a script-scope `let`, probe `#alter-ego-content` display instead; synthetic `wheel` events go through the eased lerp so wait ~600ms before asserting.
- [x] **CLAUDE.md corrected**: 2 false gotchas removed (two-oranges → consolidated; kinko placeholder template → deleted, only `settlr`+`refer-earn` keys exist), 3 real ones added (async scroll events, transform-writes-don't-dirty-layout, trailing-spacer margin side effect), new Scroll section, eased scroll added to the reduced-motion invariant list, stale pending-work list replaced with measured findings.
- [x] **og-image needs no work** — it already carries the credential line; that "refresh" note was stale for weeks.

---
## 14. Mobile thumbnails (2026-07-26) — closes the push hold
- [x] **Real photography on the mobile feed**, purpose-cropped. Mobile square-crops every card
  (`.post-media img { aspect-ratio:1/1; object-fit:cover; object-position:left center }`), so
  shipping **already-square** assets sidesteps the left-anchor crop entirely rather than fighting
  `object-position`. Built from the originals in `dump/` at **900px square** (column is ~484px →
  ~460px display, so 900 covers 2×): `settlr/mobile-couch|playground|cover.webp`,
  `refer-earn/mobile-handheld-1|2.webp`, `kinko/mobile-cover.webp`. Crop centre (`cx`) hand-picked
  per frame so the subject survives: 0.48 couch, 0.58 laptop (it sits right of centre), 0.265
  stats-card (keeps all four stats legible), 0.33 Kinko (was cutting the word "Kinko" in half).
- [x] **Fixed a real content bug: the Refer & Earn carousel was the SAME image three times**
  (`refer-earn/thumbnail.webp` ×3, alt text "Refer & Earn 1/2/3") behind three dots implying
  variety. Now two distinct real shots + two dots. Add a third dot only alongside a third real shot.
- [x] Settlr feed carousel → couch photo · playground photo · stats cover (3 distinct, was
  thumbnail/Components/cover-phone). Polaroid-back project strip + Kinko card also on mobile assets.
- **Payload:** the feed was pulling 3840px-wide images for a ~460px square (`refer-earn/thumbnail`
  alone is 369 KB at 3840px, shown 3× = same bytes re-decoded). Project imagery over the wire on a
  390px viewport is now **~111 KB total**. Desktop keeps its own larger assets untouched.
- Verified on a 390×844 phone viewport: all slides distinct, dot count matches slide count, every
  image loaded, all assets square, no horizontal overflow, 0 console errors, 0 4xx. Desktop gate
  (68 checks) still green.
- [x] **Owner removed the Settlr stats-card slide** (2026-07-26): the mobile Settlr carousel is now
  2 slides (couch + playground), matching the desktop card; dots 3→2. `settlr/mobile-cover.webp`
  became orphaned and was deleted rather than left in the repo.
- [x] **Mobile case-study CTAs now say "View case study on desktop"** (owner request, 2026-07-26) — and
  the tap was fixed, not just relabelled. It was a **dead bounce**: `href="index.html#settlr"` hit
  index.html's viewport router, which sends anything under 1024px back to `mobile.html#settlr` — i.e.
  right back to the post the reader was already on (verified empirically). Now the href is the
  canonical `https://www.divyanshrastogi.in/#slug`, the tap copies it and toasts "Link copied — open
  it on a desktop", and it stays a real `<a>` so long-press Share/Copy-link still works.
  **Deliberately NOT `navigator.share`:** it exists in some webviews but never settles, so awaiting it
  leaves the tap with zero feedback — it hung the test harness for 2 minutes. Clipboard is
  deterministic. `.post-actions` got `flex-wrap` + the label `white-space: nowrap` so the pair stacks
  at 360/390px instead of stranding the monitor glyph beside two wrapped lines.
- [x] New suite `tests/verify-mobile-cta.js` (9 checks) added to the runner — gate is now **77 checks**.
  It was briefly flaky (a fixed settle raced the click handler on cold runs); replaced with
  `waitForFunction` and proven stable over 3 consecutive runs.
- [ ] **Remaining for the owner:** third slide per card (desktop + mobile) when shots exist.

---
## 27. The gate is flaky under load — fix it before it stops being read (2026-08-04)

**Observed while verifying §26.A: `node tests/run-all.js` failed 2 of 4 full
runs on unchanged, correct code.** §22 added a one-shot retry on the belief
that a single retry absorbs load contention. It does not — run 3 had a suite
fail **twice** and then pass cleanly minutes later.

| Run | Conditions | Result |
|---|---|---|
| 1 | MCP queries + curl running alongside | 1 suite failed (identity lost, see Lesson) |
| 2 | moderate | ALL PASSED |
| 3 | after a server stop/restart | kbd-meta + payload flaked and recovered on retry; analytics failed **twice** |
| 4 | quiet, nothing competing | ALL PASSED, **zero retries needed** |

`verify-analytics.js` standalone: 113/113. The code was never the problem —
green when the machine is quiet, red when it is not. Eight sequential Chrome
launches against one `npx serve` is the load.

- [ ] **Raise the retry to 2, or add a cooldown between suites.** One retry
  demonstrably is not enough. A short inter-suite pause may beat more retries,
  since the failure mode is contention, not randomness.
- [ ] **Fix the three specific flake signatures seen**, all of which look like
  real failures in the log and are not:
  - `net::ERR_CONNECTION_RESET` — the local server dropped the connection
    mid-run. Worth checking whether `http-server` is stable across eight
    consecutive Chrome launches, or whether the suites should share one browser.
  - `mobile: total transfer under 700 KB [832 KB]` — a 19% overshoot that
    passed on retry, so it is a measurement artifact, not a payload regression
    (no assets changed). §18's per-page cache-disabled context may not be
    fully isolating under contention.
  - `deep link #resume: no console/page errors` fails on a **report-only**
    CSP notice from Google's resume embed (`Framing 'https://drive.google.com/'
    violates ... frame-ancestors 'self'`). Third-party, non-blocking, and not
    ours — it belongs on a console allowlist, not counted as an error.
- [ ] **Print a per-suite roll-up at the end**, so the failing suite survives
  truncation.

**Lesson (self-inflicted, worth not repeating): never pipe `run-all.js`
through `tail`.** Doing so cost the identity of run 1's failing suite — the
per-suite summary scrolled past the window — **and silently masked the exit
code**, because a pipeline reports the exit status of its *last* command and
`tail` always succeeds. The run printed "1 suite(s) FAILED — do not push" while
the shell reported `EXIT=0`. Redirect to a file and read it.

---

## 26. Analytics — open items (paused 2026-08-04)

Paused mid-flight: **the site works and analytics are collecting.** Everything
below is refinement or cleanup, none of it blocking. Deployed through
`c296cca`. Gate: `node tests/run-all.js` = **209 checks**.

### A. Finish the swap fix (do these first — small, and one is scaffolding)
- [x] **Instant-scroll fix CONFIRMED against production 2026-08-04.** Verified
  without a manual click and without waiting for PostHog: the bug was a DOM
  scroll bug that analytics merely revealed, so it is measurable directly.
  Drove the real production build headlessly — read Settlr to scrollTop 17727
  of 19787, clicked "Next case study" — and sampled `overlayBody.scrollTop`
  across the window where the glide used to happen: **0 at rAF and at every
  sample after**, versus the pre-fix trace of 10321 → 3586 mid-glide. Zero
  `case_study_progress` fired. The false 100% read is gone.
  **Critically, the script never sets `scrollBehavior = 'auto'` near the swap**
  — that override is precisely what blinded the committed suite (see Lessons).
- [x] **Scaffolding stripped** (the age guard, the four `d_*` keys, and the
  whole `case_progress_suppressed` event). The TODO's expectation of "no
  `case_progress_suppressed` at all" was **slightly wrong, and the difference
  is what proved the guard redundant**: one stray tick does still arrive on a
  swap, but it reported `scroll_top: 0`, `would_have_been_pct: 9` — below the
  25% milestone, so it emits nothing. The reset is synchronous and scroll
  events are asynchronous, so a post-swap event can only ever observe the
  already-reset position. Timing no longer needs guarding; position speaks for
  itself. Still to do: hide the `case_progress_suppressed` event definition in
  PostHog (owner-only, same treatment as the probes).
- [x] **Audited every other programmatic scroll — clean, nothing to fix.**
  All nine remaining scroll writes across both documents pass an **explicit**
  `behavior`, so CSS `scroll-behavior: smooth` cannot surprise any of them:
  `overlayBody.scrollTo({behavior:'smooth'})` (back-to-top button),
  `kinkoCard.scrollIntoView({behavior: isLoad ? 'auto' : 'smooth'})`, the nav
  anchor and both to-top calls (all explicitly smooth, all intentional), and
  mobile.html's single reduced-motion-aware `scrollTo`. The overlay reset was
  the only implicit one. Two things also checked and cleared: the eased-scroll
  loop's `window.scrollTo(0, y)` is safe because `setEnabled` neutralises
  `scroll-behavior` to `auto` while the loop owns scrolling and hands it back
  when off; and there is **no scroll-restore bug class here at all**, because
  overlays freeze the page with `body.style.overflow = 'hidden'`, which
  preserves scroll position rather than needing a restoring write.
- [ ] **Known data artefact:** four bogus `case_study_progress` bursts on
  2026-08-04 (~14:05, 14:27, 14:31, 14:48) inflate read depth for that day.
  Left in place — not worth deleting at this volume, but don't be misled.

### B. Owner-only (no agent can do these)
- [ ] **UTM-tag the LinkedIn / Behance / resume-PDF / email-signature links.**
  Highest-leverage item remaining. Only works now that the router forwards
  `location.search`. Suggested: `?utm_source=linkedin&utm_medium=profile`.
- [ ] Delete the `direct_probe` and `probe_AFTER_SETTING` event definitions at
  eu.posthog.com/project/233134/data-management/events (MCP cannot delete
  definitions; they are only hidden).

### C. Decisions parked
- [ ] **`vercel.json` PostHog reverse proxy** — full draft, loader changes,
  required test updates and the id-collapse risk are in
  `.claude/vercel-proxy-draft/`. Recovers ad-blocked traffic. Must be validated
  on a Vercel preview URL, never localhost.
- [ ] **DEF-1: hoist `<meta charset>` + `<meta name="viewport">` above the
  router** in both files. The router reads the pre-meta layout viewport, so
  iPads at tablet widths land on the phone feed *stably* (the ping-pong is
  fixed, this isn't). Charset also sits ~3000 bytes deep, past the spec's
  1024-byte limit. Needs a real iPad in Safari to verify — cannot be done
  headlessly.
- [ ] **Fullscreen false-positive in the crawler filter.** `before_send` drops
  events when `innerWidth >= 1024 && innerWidth === screen.width &&
  innerHeight === screen.height`. The justifying comment claims browser chrome
  always costs 50–130px of height — false in fullscreen (F11 / macOS green
  button). Could not reproduce headlessly, so unquantified. A portfolio is a
  plausible thing to view fullscreen.
- [ ] **Hot lead alert.** Currently fires on `resume_downloaded`,
  `email_clicked`, LinkedIn outbound, or `case_study_progress pct >= 100`.
  Owner's call (correct): someone who reads a case study deeply *then* clicks
  through to the next one is genuinely hot — worth making that an **explicit**
  signal rather than something arriving by accident.
- [ ] **DEF-5** `test_account_filters_default_checked` is `null`, so ph-2b's
  filters only apply where someone ticks the box. Setting `true` applies them
  by default.
- [ ] **DEF-3** `strict_script_versioning: true` would pin the two lazy chunks
  as well as `array.js`. Untested; could 404 if those paths are GC'd.
- [ ] **DEF-8** `PH_VER` bump policy. `/static/1.300.1/` already 404s, so
  PostHog garbage-collects old versions — the pin cannot sit untouched forever.
  Needs a deliberate periodic bump plus a re-run of the analytics suite.

### Hard-won lessons (read before touching read-depth again)
- **The suite was blind to the swap bug by construction.** Tests set
  `scrollBehavior = 'auto'` before scripted scrolling — correct for driving a
  scroll, but it disables the exact behaviour that caused the bug. Three fixes
  shipped and failed before diagnostics in production found it. If something
  cannot be reproduced locally, **ship diagnostics, don't ship theories.**
- **A green regression test can be worthless.** The first guard passed
  identically with and without the fix. Verify a new guard actually fails
  against the broken code before trusting it.

## 25. Analytics correctness pass (2026-08-04)
- **The buffering race was the headline bug.** `window.track()` was a no-op until
  `array.js` loaded, but `routeHash()` runs on the last line of the body script — so a
  cold `/#settlr` fired `case_study_opened` at ~1.2–2.1s while the real wrapper installed
  at ~1.9–4.3s. Every deep-linked case study, resume open, photo open and world flip since
  go-live was silently discarded. Replaced with a 50-slot buffer flushed after
  `posthog.init`, replaying each call with its ORIGINAL timestamp so a queued event is not
  reordered after events it preceded.
- **The router loops.** "Mutually exclusive media queries, no loop" was wrong: a real iPad
  at viewport 1210 produced 7 pageviews in 3.5 minutes, and the sweep reproduces headlessly
  (1440→1010→1210→1010→1210 = 5 full navigations). The two documents read *different*
  widths. Fixed with asymmetric thresholds (1023.98 down / 1064 up, leaving a dead band)
  plus a per-tab 8s hop cooldown. **Root cause only partly addressed** — the router still
  runs above `<meta name="viewport">`, so it reads the pre-meta layout viewport. Hoisting
  the charset + viewport metas above it is the real fix and is deliberately NOT done here.
- **The router ate `location.search`**, destroying every UTM tag for anyone who crossed the
  1024px line — which also meant the new `?nostats=1` owner opt-out could not have worked.
- **`photo_opened` could not fire from a real photo click.** The capture lived in the
  deep-link-only wrapper; 42 rotor cards called `openLightbox` directly. Moved, and the
  payload changed from an unstable `{index}` to `{src, alt, source}`.
- New events: `case_study_progress` (25/50/75/100, fired as crossed, never batched to close
  time — the best reader is the one who closes the tab with the overlay open),
  `case_study_closed`, `resume_downloaded`, `work_viewed` (mobile).
- **Docs were wrong about four things** and are corrected in CLAUDE.md: the host is Vercel
  not GitHub Pages (so a reverse proxy IS available); client-side bot *blocking* is real
  while query-time `$virt_is_bot` is dead, meaning **every real human classifies as a bot
  and an "exclude bots" filter returns a confident zero**; the payload is ~86 KB across 4
  requests, not 73 KB; and the router does loop.
- SDK pinned to 1.410.5 (the unversioned path is a rolling "latest" with `max-age=14400`
  and drifted six releases in nine days). `defaults: '2026-05-30'` pinned with a warning:
  at `'2026-06-25'` PostHog silently strips URL fragments, which would collapse every
  hash-routed case study into one `/` pageview.
- PostHog side: 6 retroactive actions over existing autocapture data, authorized domains
  (unlocks the 51 already-recorded heatmap clicks), replaced the permanently-inert
  cohort-based test-account filter, a "Hot lead" daily alert and a Monday digest of
  qualified sessions (4 of 18 sessions qualify), and an annotation for the 2026-07-28 build.
- `tests/verify-analytics.js` grew from 13 checks to 110 (whole gate 105 → **206**),
  including an in-page capture trap (PostHog can never send an ingestion request under
  Puppeteer, so network assertions are impossible) and a cookieless storage **allowlist**
  rather than a `/posthog|^ph_/` grep. The allowlist has three entries: `feed-theme`,
  `vp-hop`, and `settlr_data` — that last one was *found* by the new check, not introduced
  by it. The `#settlr` overlay embeds the Settlr prototype in a same-origin iframe, so the
  prototype's offline seed store lands in the page's localStorage the moment the overlay
  opens. Functional demo data, no visitor information, predates this pass, and does not
  touch the no-consent-banner posture (which rests on PostHog storing nothing).
- **Still open:** UTM-tagging the LinkedIn / Behance / resume-PDF / email-signature links
  (owner-only, and it only pays off now that the router forwards `location.search`); the
  `vercel.json` reverse proxy; hoisting the viewport meta above the router.

## 23. Tablet band, 768–1023px (2026-07-27)
- **Measured the actual problem:** the hard 520px `.col` used 68% of a 768px viewport (fine) but only **51% at 1023px — 252px of dead gutter each side**, reading as a phone screenshot pasted onto a tablet. So the gap was real but concentrated at the TOP of the band, not across it.
- **Fix:** `@media (min-width: 700px) { .col { max-width: clamp(520px, 68vw, 640px) } }`. Scales instead of jumping — 522px at 768 (unchanged, it already read as a feed), 567 at 834 (iPad Air portrait), 640 at 1023. Usage now a consistent **63–68%**.
- **Why 640 is the ceiling:** line length, not available space. The cap is a typographic decision, and it turned out the design already anticipated this — `.post-body p` carries `max-width: 46ch`, so **body copy stays at 455px / ~64 chars per line at every tablet width** while only the imagery grows (media 491 → 610px). Widening the column therefore cannot degrade readability, which is exactly the property that made this safe.
- Verified at 390 / 768 / 834 / 900 / 1023: 0 horizontal overflow at every width, gate 105/105. Phone layout untouched (media query starts at 700px).

## 22. Settlr pair — both items reframed (2026-07-27)
- **Prototype embed container: already done.** Investigated before building (third stale item in a row). The section is a dark rounded container with the live shipping build, a 6-of-24 jump-to-screen pill grid, and an honest caption; 0 console errors, 0 4xx. CLAUDE.md's re-sync note and commit `f4cefcf` already covered it.
- **Settlr title: real defect, but not the one described.** The item asked for a title/header *section*; the cover art already shows the title. The actual gap was structural and affected **both** case studies: **no `<h1>` at all** — 16 headings (Settlr) and 9 (R&E) hanging under nothing, with the project name only ever rendered as pixels.
- [x] Added `sr-only` `<h1>` to both, and rewrote each hero `alt` to describe the image instead of repeating the title, so a screen reader doesn't announce the same words twice. **Zero visual change** — hero screenshots identical.
- [x] **Gate hardened:** a batch run failed once while all eight suites passed individually — load contention from eight sequential Chrome launches, not a real failure. `run-all.js` now retries a failed suite once and announces it; a genuinely broken suite fails twice and still blocks the push. Flaky gates are worse than no gate, so this is announced rather than silent.

## 21. Refer & Earn — honest close (2026-07-27)
- **Diagnosis first, and it contradicted the task.** Measured before building: R&E is 972 words / 14 images (69 w/img) vs Settlr 2,873 / 38 (76 w/img). Not text-heavy — just a third the depth (7 sections vs 16). The "zero image" sections turned out to be the best ones: a conversion funnel with drop-off percentages at every stage, and a three-lens research grid with verbatim quotes. Reported this rather than executing the redesign as written.
- **The real gap:** the case study opens on 1.2M users → 2,609 conversions, walks through research → exploration → iterations → final design → multi-brand rollout, then ends on a *concept* marked "not yet shipped." No outcome. For a conversion brief that is the first thing a hiring manager scrolls for.
- [x] **Added "What I'd Measure Next"** (owner chose the honest version over inventing numbers). States plainly that post-launch measurement was out of scope and refuses to claim an unverified lift, then names three metrics — **referral initiation rate** (baseline −83.37%), **reward comprehension** (baseline 45% unclear), **referrals per referrer** (baseline 72% single) — each tied to a baseline *already established earlier in the same case study*, so it closes the narrative loop. Ends with how to read the results: which combination implicates motivation vs clarity vs incentive design.
- Reuses the existing `cs-research-methods` pattern rather than inventing markup. Verified: renders at 653px, 3 columns, 0 horizontal overflow, 0 console errors, JS template literal intact (0 backticks / 0 `${`), 0 em dashes in the new copy, gate 105/105.

## 24. Analytics live + dashboard (2026-07-27)
- **The bug was never in our code.** Events were sent correctly but silently discarded: PostHog requires **"Cookieless server hash mode"** enabled in project settings or cookieless events are dropped after a 200 response. Enabled (Stateful, owner-approved) via MCP. Diagnosis path: `curl` → ingested ✅ · browser any config → ❌ · browser + non-cookieless → ✅. That isolated it to one server-side toggle.
- **Two traps cost real time, both worth remembering:**
  1. **`posthog-js` blocks capture when `navigator.webdriver` is true.** Every headless test silently no-op'd (`capture()` returned undefined, zero transport). Headless CANNOT verify delivery without masking it. Corollary: the earlier "verified analytics" claim was too strong — it proved `capture` was *called*, never that anything was *delivered*.
  2. **Forgot `setViewport` in a probe** → Puppeteer's 800×600 default tripped our own viewport router, so tests silently ran against `mobile.html`. Ironic given the router guard is the thing the integration is built around.
- **Bot noise concern is resolved twice over:** posthog-js blocks bots client-side, and PostHog ships `$virt_is_bot` / `$virt_traffic_type` (Regular/Bot/AI Agent/Automation) for filtering. No custom bot guard needed — the Phase 2 plan for one is cancelled.
- **GeoIP may work after all:** `$geoip_*` properties are present in the taxonomy despite the cookieless docs implying otherwise. Unconfirmed until real traffic lands — do not re-assert either way without checking.
- [x] **Cleanup:** all 3 diagnostic persons deleted (events queued async). Verified every event first — all traceable to the test window, no genuine visit touched. Project annotation added at the cutover so lingering rows can't be misread.
- [x] **Dashboard "Portfolio — is it working?"** with 5 tiles: the hiring funnel (landed → case study → reached out, 1-day window, contact steps grouped since email and LinkedIn are the same outcome), desktop vs mobile by `$pathname` (truer than `$device_type` here — the two documents *are* the split), which case study wins, alter-ego discovery rate, and referring domain.

## 20. Analytics — PostHog, cookieless (2026-07-26)
- [x] **Integrated but inert.** Loader in both documents' `<head>`; set `PH_KEY` in BOTH to switch on. Owner chose cookieless/no-banner over session replay.
- **Three site-specific traps found before writing any code**, each of which would have silently corrupted the data:
  1. **Phantom pageviews.** The viewport router `location.replace()`s across 1024px. Initialising above it logs a desktop pageview + instant bounce for EVERY mobile visitor (and vice versa), wrecking the desktop/mobile split. Loader sits below the router and re-checks the media query.
  2. **Invisible case studies.** They're hash routes (`#settlr`), not pages — autocapture never sees them. Wired explicit `track()` calls into `openOverlay`, `openResume`, `setAlterEgoMode`, `openPhotoLightbox`, plus mailto/outbound delegation.
  3. **No reverse proxy possible.** GitHub Pages is static, so the standard ad-blocker workaround is unavailable. Data is directional, and biased against this site's own audience.
- **Honest costs, measured not assumed:** ~**73 KB brotli** (the docs' 52.4 KB is a different build — I curl'd the real asset). Cookieless mode also disables **GeoIP and bot detection**, so no country data and some crawler noise.
- [x] `tests/verify-analytics.js` (13 checks). **Its first version was fake-green:** with `PH_KEY` empty the loader returns before the media-query check, so "no tracker injected" proved nothing about the router guard. Now it rewrites the key **in flight** and reloads at the opposite viewport. That exposed a second test bug — `evaluateOnNewDocument` re-runs after the redirect, so a bare count credited the destination page's legitimate tracker to the origin. Fixed by recording `location.pathname` at injection time. Gate is now **105 checks**.
- [x] **ENABLED 2026-07-27.** Owner created an EU project; key pasted into both documents. Verified live-contract behaviour, not just config:
  - **Zero cookies, zero local/sessionStorage keys** on both documents — this is the assertion that replaces a consent banner, so `verify-analytics.js` now guards it as its most important check.
  - Loads from the EU region; `case_study_opened` confirmed firing on a real hash-route open; `track()` confirmed reaching `posthog.capture`.
  - Router guard holds with the key live: the document that redirects away never loads the tracker (verified by attributing each injection to `location.pathname`).
  - **Audited what it actually fetches (84 KB):** no session recorder (correctly disabled). Turned OFF `advanced_disable_feature_flags` + `disable_web_experiments` — unused, and flags cost a network round-trip on every pageview. Kept `capture_performance` (3 KB: real-user Core Web Vitals, the only way to know the perf pass helps actual devices) and `capture_dead_clicks` (7 KB: catches visitors clicking decorative elements expecting a response, a real risk on a site this hover-reactive).
  - Payload after: desktop 1,555/1,700 KB, mobile 656/700 KB — both inside the budgets set before enabling.

## 19. Phase B1 — Philosophy section (2026-07-26)
- [x] **Owner picked Proposal A (editorial list)** from the two mockups sitting in the gitignored `_section-redesign-test.html` since 2026-07-19 (kept, not deleted, precisely for this).
- Replaced the 5-across `.cs-principles-grid` card wall with a two-column layout: a left lede holding the argument, and the five principles as a numbered list with the specimen visuals alternating side to side. All five principles kept — Proposal B cut to three, which would have dropped "System over screens", the one that demonstrates systems thinking (what design-system roles hire for).
- Reused the existing `.cs-phil-viz` / `.cs-viz-*` specimen visuals verbatim; only the layout around them changed. Old `.cs-principle-*` CSS removed (0 references left).
- **Bug caught by measuring rather than eyeballing:** the specimen slot was 140px but the Equally/Amount/% segment control measures **166px**, so it overflowed into the body text (6px overlap on row 04) and the token chip wrapped on row 05. Slot widened to 180px — sized to real measured content. Re-measured: all five rows now 0 overflow, 0 overlap.
- Responsive: below 1180px the lede stacks above the list and the mirroring drops (alternation only reads as rhythm with room for three columns).
- Verified at 1440 and 1280: 0 horizontal overflow, 0 console errors, gate 92/92.

## 18. Phase A — performance finishers (2026-07-26)
- [x] **A1/A2 · Font subsetting.** All three variable fonts subset to only the characters the site renders. Method that made it safe: collected glyphs at RUNTIME across every state (light, dark, both injected case-study overlays, resume, lightbox, nav typewriter, mobile light+dark), unioned with printable ASCII and every non-ASCII char in either document, then **intersected with each font's own cmap** — so nothing the font lacks is "lost". That check is what proved the card suits `♠♣♦` are absent from Unbounded and already fell back to a system face, i.e. excluding them changes nothing.
  - Unbounded **252 → 44 KB** woff2 (1138 → 114 codepoints), Jakarta 58 → 25 KB, Jakarta Italic 63 → 28 KB. TTF fallbacks subset in step. **Fonts over the wire: 376 → 100 KB.**
  - Weight axis (200–900) and all variation tables (fvar/gvar/HVAR/MVAR/STAT/avar) preserved — verified.
  - **Proved by pixel-diff, not assertion:** rendered hero / featured / case-study / mobile-feed with original vs subset fonts. Three were byte-identical; hero differed by 30 px scattered over a 2000px span with **max channel delta 1** (antialiasing dither, not a glyph). First run showed false diffs until `setInterval` was frozen — the carousels were auto-advancing between captures.
- [x] **A3 · Kinko thumbnail 128 → 34 KB.** It renders under `filter: blur(14px)`, so source detail is destroyed at paint: 960×540 q62 is indistinguishable. Verified by diffing the *rendered blurred card* — 32% of pixels shift but max channel delta **4/255**, imperceptible.
- [x] **A4 · `tests/verify-payload.js`** — cold-load budget per page (total/images/fonts + no single asset >300 KB). Ceilings ~15% above measured. Caught its own measurement bug first: Puppeteer shares an HTTP cache across pages, so mobile initially reported **0 KB of fonts**; now a fresh cache-disabled context per page.
- [x] **`tests/verify-fonts.js`** — coverage guard so new copy can't silently fall back: walks all states, asks `document.fonts.check()` per rendered character, requires anything uncovered to be on the documented `KNOWN_FALLBACK` list. Also asserts the weight axis still varies. Gate is now **92 checks**.
- [x] **Removed 4.2 MB of unreferenced static font files** (`fonts/*/static/`, 22 files) — never referenced by any `@font-face`, but Pages serves the repo root so they were public URLs.
- **Net:** desktop **2,796 → 1,468 KB (−47%)**, mobile **847 → 571 KB (−33%)**, LCP 184ms desktop / 112ms mobile, CLS ~0, zero long tasks on mobile.
- **Re-subset recipe** if copy ever needs a new glyph: rerun the runtime collector, union with ASCII + document non-ASCII, intersect with the *original* font cmaps (backups needed — current files are already subset), then `python3 -m fontTools.subset FONT --text-file=CHARS --flavor=woff2 --layout-features='*' --name-IDs='*' --glyph-names --notdef-outline`. `verify-fonts.js` fails loudly if you forget.

## 17. Load audit + payload pass (2026-07-26)
Measured with CDP network tracking + PerformanceObserver (LCP/CLS/longtasks), both pages.
- **Before:** desktop 2,796 KB / 28 req (images 2,325 KB). Mobile was already healthy: 847 KB, CLS 0.
- **Fixed:** `small-cards/angel-one.webp` was **4320×7680 (33 MP, 308 KB) shown at ~616px** → 1080×1920, 47 KB, matching its siblings. Three YouTube `maxresdefault` film posters (~300 KB, external) were **eager-loading inside the display:none dark world on every light-world load** → `loading="lazy" decoding="async"` (mobile already had this; only desktop leaked). Featured-carousel photography re-encoded **from the PNG masters in `dump/`** (no generational loss) at q78: 1,243 → 823 KB, text-on-screen verified crisp at 1:1.
- **After:** desktop **1,838 KB / 25 req (−34%)**, CLS 0.0622 → **0**, LCP 240ms (hero), zero long tasks on mobile.
- **Checked and left alone:** mobile topbar avatar reuses the 97 KB hero portrait — same URL as the hero polaroid, so it's ONE fetch serving both; not waste. Slide-2 carousel images are in-viewport (opacity:0), so `loading=lazy` can't defer them and a data-src swap isn't worth it for a 2s cycle. Fonts (376 KB) are preloaded, cached, and core to the design.
- **Optional future wins, owner's call:** subset Unbounded (253 KB variable font; latin+₹+→+≠ subset ≈ 60–80 KB, needs glyph-coverage care) · quality pass on `kinko/thumbnail.webp` (128 KB).

## 15. Em-dash copy pass (2026-07-26) — 70 → 1
Ran as a 21-agent workflow: 7 read-only section proposers → 14 adversarial reviewers (mechanics lens + voice lens) → applied serially. Agents were **read-only by design**: `index.html` is one 11k-line file, so parallel writers would clobber each other.
- **Scope:** reader-facing copy only (rendered prose, case-study templates, meta/OG/alt/aria). Excluded: the ~141 code comments, `prototype/settlr/` (616 — mirrored app, its own re-sync recipe overwrites edits), and the .md docs.
- **Result: 70 in-scope → 1**, on a documented allowlist (`Scroll — each project stacks over the last.` — a colon after a bare imperative reads as instruction-manual register).
- **The adversarial pass caught a FACTUAL error**, not just style: rewriting "…enforces every permission itself — packaged as an Android app" to "all packaged as" would have claimed the Postgres backend ships inside the Android app. Only the PWA is Play-packaged. It also blocked two typographic swaps (a bold comma colliding with an emoji at 700 weight in the scratch reveal).
- **19 of 67 "accepted" edits carried unresolved nits** because the merge rule only blocked on `severity: blocker`, and several nits argued the edit read *worse* than the original. All 22 judgment cases were reviewed by hand, mostly taking the reviewer's `suggested_after` over the original proposal. **Lesson: a nit that ships a suggested rewrite is a rejection, not a note.**
- **Partitioned agents produced cross-section inconsistencies** — the same duplicated component (light footer / dark footer / mobile) got different treatments: three "is itemized" variants, two `title="Redeem …"`, two `.cs-next-case` spacings, and mobile's scratch reveal left with *no* punctuation ("one coffee ☕ on me"). Unified afterwards. **A whole-file consistency sweep must follow any partitioned copy pass.**
- **New tooling:** `tests/emdash-inventory.js` (comment-state-aware census; `--json`, `--check`), wired into `run-all.js` as a copy guard. Its first version had a bug where skipping a `/*` delimiter shifted the state array so CSS comments reported as visible copy — caught before the agents ran, or four of them would have been sent to edit comments.
- Verified: gate 77/77 + copy guard, 0 console errors, the `caseStudies` template literal still parses (45 edits landed inside it), no hyphen-as-dash regressions, mobile overflow 0, screenshots reviewed at desktop and 390px.

## 16b. iOS status-bar plate — the scrim in §16 was inert in Safari (2026-07-26)
- **§16's diagnosis was wrong for the reported context.** The scrim keyed off `env(safe-area-inset-top)`, which is **0 in portrait Safari** (Apple forums #699415) — it only exists in installed-PWA/landscape contexts. Owner re-tested on device after the push: still bleeding. The headless "verification" faked the inset, which proved the CSS, not the phone.
- **Real mechanism:** when Safari's address bar minimizes, the OS paints the document canvas *above the layout viewport* behind the status bar (soft system blur). The strip isn't the page's viewport at all, so no `viewport-fit` change can touch it — the lever is to paint INTO that region.
- **Fix:** the plate now hangs at `top:-80px; height:calc(80px + env(safe-area-inset-top,0px))` — permanently offscreen in layout (bottom edge exactly at y=0 when env=0), rendering only inside Safari's above-viewport bleed, filling it with `var(--bg)`. env() term kept for PWA contexts.
- Topbar opacity reverted 94% → **86%** per owner ("keep it as it was"); the suite now guards the revert.
- `tests/verify-statusbar.js` rewritten to assert the geometry contract and to say plainly what it cannot see: **the on-device look needs a human eye.** ✅ **Owner confirmed on device 2026-07-26: status bar is clean**, light and dark.

## 16. iOS status-bar scrim (2026-07-26) — reported from a real device
- **Bug:** `mobile.html` ships `viewport-fit=cover` (deliberate — the feed runs edge to edge), so page content scrolls **under** the iOS status bar. The `.topbar` is `translateY(-100%)` until you scroll past the hero, so across the whole hero there was nothing behind the clock/battery: they sat directly on top of moving copy. Owner caught it on device; headless never would, because `env(safe-area-inset-top)` reports **0** there.
- **Fix:** a permanent `body::before` scrim — fixed, full width, `height: env(safe-area-inset-top, 0px)`, `background: var(--bg)`, `z-index: 49` (just under the topbar's 50 so the bar's blur still reads over it), transitioning with the light/dark flip. Collapses to zero height on devices with no inset, so it costs nothing elsewhere.
- Also raised `.topbar` from **86% → 94%** opacity (+ `saturate(115%)`): 86% was sheer enough that dense feed copy read through the bar.
- **Verified by faking the inset**, since headless can't produce one: with the scrim disabled the 47px strip showed 20–30 distinct colours (the hero portrait running under it); with it, 6 — subpixel noise in flat cream. Before/after screenshots confirm it.
- New suite `tests/verify-statusbar.js` wired into the runner. Gate is now **79 checks**.

---
*Section 7 added 2026-07-13. Sections 1–6 generated by Antigravity 2026-04-21. Section 8 added 2026-07-18. Sections 9–10 added 2026-07-25. Sections 11–13 added 2026-07-26. Sections 14–15 added 2026-07-26. Sections 25–26 added 2026-08-04.*
