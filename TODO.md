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
- [ ] **Refer and Earn**: Reduce text and redesign for a more visually appealing layout.

## 4. Navigation & Page Structure
- [ ] **UX/Hobbies Toggle**: Add a clear toggle or profile button to help users distinguish between UX/Work and Photography/Art/Hobbies pages.
- [ ] **Photography**: Upload and integrate more photography assets.
- [ ] **Settlr Title**: Add a specific title/header section for the Settlr case study.

## 5. UI Consistency & CTAs
- [x] **Button Consistency**: DONE 2026-07-16 — both featured CTAs are now identical real links (a.cs2-cta); dead button systems purged.
- [x] **Navigation Icons**: DONE — More-work card titles carry Redirect.svg icons.
- [ ] **Settlr Case Study**:
    - [x] Update "View on Behance" CTA — already reads "View Research on Behance" (verified 2026-07-16).
    - [ ] Refresh the Settlr prototype embed and design a better container/section for it.
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
- [ ] **Tablet (768–1023px) polish for `mobile.html`**: it renders as a 520px centred column on tablets; decide whether it needs a wider tablet layout.
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
## 20. Analytics — PostHog, cookieless (2026-07-26)
- [x] **Integrated but inert.** Loader in both documents' `<head>`; set `PH_KEY` in BOTH to switch on. Owner chose cookieless/no-banner over session replay.
- **Three site-specific traps found before writing any code**, each of which would have silently corrupted the data:
  1. **Phantom pageviews.** The viewport router `location.replace()`s across 1024px. Initialising above it logs a desktop pageview + instant bounce for EVERY mobile visitor (and vice versa), wrecking the desktop/mobile split. Loader sits below the router and re-checks the media query.
  2. **Invisible case studies.** They're hash routes (`#settlr`), not pages — autocapture never sees them. Wired explicit `track()` calls into `openOverlay`, `openResume`, `setAlterEgoMode`, `openPhotoLightbox`, plus mailto/outbound delegation.
  3. **No reverse proxy possible.** GitHub Pages is static, so the standard ad-blocker workaround is unavailable. Data is directional, and biased against this site's own audience.
- **Honest costs, measured not assumed:** ~**73 KB brotli** (the docs' 52.4 KB is a different build — I curl'd the real asset). Cookieless mode also disables **GeoIP and bot detection**, so no country data and some crawler noise.
- [x] `tests/verify-analytics.js` (13 checks). **Its first version was fake-green:** with `PH_KEY` empty the loader returns before the media-query check, so "no tracker injected" proved nothing about the router guard. Now it rewrites the key **in flight** and reloads at the opposite viewport. That exposed a second test bug — `evaluateOnNewDocument` re-runs after the redirect, so a bare count credited the destination page's legitimate tracker to the origin. Fixed by recording `location.pathname` at injection time. Gate is now **105 checks**.
- [ ] **Owner action to enable:** create a PostHog project, paste the publishable key into `PH_KEY` in `index.html` AND `mobile.html`, keep `PH_HOST`/`PH_CDN` in the same region (EU set by default).

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
*Section 7 added 2026-07-13. Sections 1–6 generated by Antigravity 2026-04-21. Section 8 added 2026-07-18. Sections 9–10 added 2026-07-25. Sections 11–13 added 2026-07-26. Sections 14–15 added 2026-07-26.*
