# Portfolio Development TODO

## 1. Core Experience & Responsiveness
- [ ] **Responsiveness**: Implement full fluid layouts for all desktop and laptop screen sizes (13", 14", 16", etc.).

## 2. Glitch Fixes & Functional Refinement
- [ ] **Glitches**:
    - [ ] Fix "Featured Projects" title behavior/visibility after theme switch.
    - [ ] Fix Scratch Card functionality and implement a full redesign of the card.
    - [ ] Fix Resume button: Ensure it's not solid black when the "hole" (SVG mask) is over it.
- [ ] **Cursor Interaction**: Disable "Hold to Peel" as soon as a side sheet or any modal opens (prevents cursor sticking/interference).

## 3. Section Redesigns
- [ ] **Connect Section**: Complete redesign of the contact/social section.
- [ ] **Philosophy Section**: Reduce text density and replace with visual illustrations.
- [ ] **Refer and Earn**: Reduce text and redesign for a more visually appealing layout.

## 4. Navigation & Page Structure
- [ ] **UX/Hobbies Toggle**: Add a clear toggle or profile button to help users distinguish between UX/Work and Photography/Art/Hobbies pages.
- [ ] **Photography**: Upload and integrate more photography assets.
- [ ] **Settlr Title**: Add a specific title/header section for the Settlr case study.

## 5. UI Consistency & CTAs
- [ ] **Button Consistency**: Ensure all "View Project" buttons use the same system-wide styling.
- [ ] **Navigation Icons**: Add redirection icons to the "More Work" thumbnails.
- [ ] **Settlr Case Study**:
    - [ ] Update "View on Behance" CTA to "View Research on Behance".
    - [ ] Refresh the Settlr prototype embed and design a better container/section for it.
- [ ] **Thumbnail Upgrades**: Use actual project thumbnails across the board.

## 6. Project Content Updates
- [ ] **Kinko Insurance**:
    - [ ] Populate with initial project data.
    - [ ] Explicitly mention "Coming Soon".
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
- [ ] **Update Settlr prototype folder** (`prototype/settlr/`): re-sync from the latest source app, regenerate screenshots, and update the case-study documentation to match the newer app work. (See re-sync recipe in MEMORY.)

### Deferred (agreed to revisit)
- [ ] **Single-URL merge**: optionally fold `mobile.html` into `index.html` as one responsive document so phones keep the clean root URL (instead of `/mobile.html`). Deferred from the 2026-07-13 merge.

### Claude's suggested additions (for review)
- [ ] **Fix embedded-prototype 404s**: on load, the Settlr SPA embed requests `prototype/css/screens/*` and `prototype/js/*` (missing the `settlr/` path segment) → ~60 404s; the phone/playground may be rendering incompletely. Likely resolved by the folder re-sync above, but verify the iframe's asset base path.
- [ ] **Audit mobile art/photo categorization**: Hydrone carousel's 1st image is a car render and Cyanotype's 1st is a 3D render — some assets look mislabeled / in the wrong folder; also re-check the motorcycle + night-car placements.
- [ ] **Curate the big mobile carousels**: Cars (17) and More (17) have busy 17-dot rows and long swipes — trim to a tight best-of (~8) or split into sub-themes.
- [x] **Resume button = always preview (never download)**: DONE — mobile buttons now open the Drive `/view` in a new tab (download URL removed); desktop already opens the overlay panel. _(2026-07-13, Antigravity + verified)_
- [ ] **Tablet (768–1023px) polish for `mobile.html`**: it renders as a 520px centred column on tablets; decide whether it needs a wider tablet layout.
- [x] **Share/meta tags**: DONE — description, theme-color, apple-web-app, OG, Twitter card + inline-SVG favicon added to both `index.html` and `mobile.html`. _(2026-07-13, Antigravity + verified)_ · TODO: swap the placeholder `og:image` for a real 1200×630 share image.
- [ ] **Deploy**: publish to Netlify once the above land (single `index.html` + `mobile.html` + assets, drag-and-drop).

---
*Section 7 added 2026-07-13. Sections 1–6 generated by Antigravity 2026-04-21.*
