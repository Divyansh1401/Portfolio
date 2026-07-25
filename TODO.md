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
- [ ] **Connect Section**: Complete redesign of the contact/social section.
- [ ] **Philosophy Section**: Reduce text density and replace with visual illustrations.
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
*Section 7 added 2026-07-13. Sections 1–6 generated by Antigravity 2026-04-21. Section 8 added 2026-07-18. Section 9 added 2026-07-25.*
