# Portfolio Website — Divyansh Rastogi

## Project Overview
Single-file HTML/CSS/JS portfolio for Divyansh Rastogi, product designer (IDC IIT Bombay, AIR 5). Goal: get hired. Experimental/creative vibe. Desktop-only for now — no responsive layout changes until desktop is finalised.

## File Structure
```
/Users/divyanshrastogi/Desktop/Website/
├── index.html          ← entire site (single file, no build step)
├── design-system.md    ← full design system reference
├── assets/
│   └── images/
│       └── refer-earn/           ← all P3 assets (16 in use, 14 in folder unused)
│           ├── thumbnail-bg.png  ← P3 homepage BG layer (CSS background, left-aligned)
│           ├── thumbnail-fg.png  ← P3 homepage FG layer (centered, parallax)
│           ├── thumbnail.png     ← P3 original thumbnail (unused)
│           ├── cover.png         ← case study hero image
│           ├── approach-1.png    ← Ideation: Minimal UI + Gamification Layer
│           ├── approach-2.png    ← Ideation: Contextual Primary CTA
│           ├── infographic-v1.png ← Iteration v1 (light list)
│           ├── infographic-v2.png ← Iteration v2 (dark two-column grid)
│           ├── infographic-v3.png ← Iteration v3 — selected (dark numbered steps)
│           ├── screen-before.png ← Before/After: original screen
│           ├── screen-tooltip.png ← Before/After: tooltip state
│           ├── screen-final.png  ← Before/After: final redesign
│           ├── screen-rummy.png  ← Multi-brand: A23 Rummy
│           ├── screen-poker.png  ← Multi-brand: A23 Poker
│           ├── screen-adda52.png ← Multi-brand: Adda52
│           ├── treasure-1.png    ← Treasure Referrals: chest modal mockup
│           ├── treasure-2.png    ← Treasure Referrals: contacts list mockup
│           └── [13 more unused]  ← see projects/03-refer-earn/docs.md for full list
├── prototype/
│   └── settlr/                   ← interactive prototype (copied from /Desktop/Settlr/)
│       ├── tokens/               ← primitive + semantic CSS tokens
│       ├── css/                  ← component CSS files
│       ├── icons/                ← Phosphor icons (regular/bold/fill, ~1.6MB)
│       └── screens/              ← 24 app screens (all .html, relative paths resolve via ../)
├── projects/                     ← per-project documentation
│   ├── 01-kinko/
│   │   └── docs.md               ← placeholder (content + thumbnail pending)
│   ├── 02-settlr/
│   │   ├── research-splitwise.md ← raw Splitwise research (HTA/SHERPA/NASA-TLX, 3 parts)
│   │   ├── project-docs.md       ← unified Settlr arc (Phase 1 research + Phase 2 redesign + workflow)
│   │   └── case-study-plan.md    ← agreed narrative plan (capability-first)
│   └── 03-refer-earn/
│       └── docs.md               ← full asset inventory + built section map
└── .claude/
    └── launch.json     ← preview server config (npx serve -p 3456)
```

## Preview Server
```
npx serve -p 3456 .
```
Use `mcp__Claude_Preview__preview_start` with name `"portfolio"` to launch.

---

## Design System

> Full design system reference: `/Users/divyanshrastogi/Desktop/Website/design-system.md`

### Typography
- **Headings**: Montserrat (800 weight primary, 700/600 secondary)
- **Body**: Plus Jakarta Sans (400/500/600)
- Loaded via Google Fonts @import

### Colour Tokens
```css
--c-orange:  #EA7623   /* accent / CTA */
--c-light:   #F2F0F0   /* page background */
--c-dark:    #1B1C1A   /* primary text */
--c-mid:     #888886   /* muted text */
--c-surface: #E6E4E4   /* project info bg (p1, p3) */
--c-dark2:   #2e2f2d
--c-dark3:   #444541   /* CTA section bg */
```

### Spacing / Radius
```css
--radius-sm: 8px
--radius-md: 16px
--radius-pill: 100px
--nav-h: 64px
```

---

## What's Built

### ✅ Nav
- Fixed top, `justify-content: space-between`
- Left: `.nav-name` (hidden at top, fades in on scroll as hero name disappears)
- Right: Resume (`<button id="resumeTrigger">`) + Let's connect (filled orange) buttons
- Resume button triggers the resume overlay (no external redirect)
- Box shadow appears after 20px scroll

### ✅ Hero
- Full viewport height (`min-height: 100vh`)
- `display: flex; justify-content: space-between` — gap auto-grows on wider screens
- Left: Name (h1), tagline (italic), education (IDC IIT Bombay AIR 5, Monash University)
- Right: Polaroid-style photo placeholder
  - `padding: 20px 20px 64px` (thick bottom = polaroid)
  - `border-radius: 3px; rotate(1.2deg)`
  - Hover: straightens to 0deg + subtle scale
  - **Critical**: `.hero-photo-wrap.reveal` and `.hero-photo-wrap.reveal.visible` override the generic `.reveal` class to preserve the rotation in the transform

### ✅ Scroll Animation (name → nav)
- Uses `lerp()` for smooth interpolation
- Tagline fades out in first 20% of hero height
- Hero name fades + shrinks between 10–40% of hero height
- Nav name fades in simultaneously
- All driven by `window.addEventListener('scroll', ...)` with `{ passive: true }`

### ✅ Featured Projects (3 rows, alternating layout)
- `grid-template-columns: 1fr 1fr; min-height: 72vh`
- P2 uses `direction: rtl` trick to flip image to right
- Colors: P1 `var(--c-surface)`, P2 `var(--c-dark)`, P3 `var(--c-surface)`
- Image zones have hover zoom (`scale(1.04)` on `.project-img-inner`)

**P3 (Refer & Earn) thumbnail — layered approach:**
- BG layer: `background-image: url('thumbnail-bg.png')` on `.project-img-inner`, `background-size: auto 100%; background-position: left center; background-repeat: no-repeat` — preserves ratio, left-aligned
- FG layer: `<img id="p3-fg">` absolutely centered (`top:50%; left:50%; transform:translate(-50%,-50%)`), `height:100%; width:auto`
- FG parallax: JS mousemove on `.project-row.p3` moves FG up to 18px towards cursor. `transition: transform 0.4s cubic-bezier(...)` on the img.

| # | Project | Company | Link trigger |
|---|---------|---------|-------------|
| 01 | Kinko Insurance | Head Digital Works | `data-project="kinko"` |
| 02 | Settlr | UX Audit & Redesign | `data-project="settlr"` |
| 03 | Refer & Earn | Head Digital Works · A23 | `data-project="refer-earn"` |

### ✅ Smaller Projects Grid (4 cards)
- `grid-template-columns: repeat(4, 1fr); gap: 28px; overflow: visible`
- Cards 2 & 4 have `margin-top: 80px` for staggered feel
- `aspect-ratio: 9/16` (tall portrait), `border-radius: 10px`
- Each card is an `<a>` tag linking to Behance (opens in new tab)
- Real Behance CDN thumbnails used as `<img class="small-card-bg">` (grayscale by default)
- Second `<img class="small-card-color">` sits on top, clipped to `circle(0%)` — on hover, JS lerps the radius open from cursor position (color reveals from where cursor enters)
- Gradient overlay at bottom with title + subtitle
- **Frame parallax**: JS moves the entire card frame ±14px horizontal, ±10px vertical towards cursor on mousemove. `overflow: visible` on `.small-grid` allows horizontal overflow.

| Project | Behance URL | CDN Thumbnail |
|---------|-------------|---------------|
| Prosper | `/gallery/189640719/Prosper-Game-Design` | `c3f2bd189640719.Y3JvcCw4MDgsNjMyLDAsMA.png` |
| Angel One | `/gallery/213230177/Mutual-Funds-for-Next-Billion-Users` | `814c77213230177.Y3JvcCwxMTE3LDg3NCwyLDA.png` |
| AI/VR Trial Room | `/gallery/197680757/AIVR-Trial-Room-UIUX-Design-Case-Study` | `2f30d6197680757.Y3JvcCwxNDg2LDExNjIsNzMsMjU.png` |
| Creative Burnout | `/gallery/235938071/Creative-Burnout-in-Design-Students-System-Design` | `3046d9235938071.Y3JvcCw3Njc2LDYwMDQsMCww.jpg` |

All CDN URLs are prefixed with: `https://mir-s3-cdn-cf.behance.net/projects/404/`

### ✅ CTA Section
- Dark bg (`--c-dark3`) with orange radial glow
- Links to `mailto:divyanshr.iitb@gmail.com`

### ✅ Footer
- 3-col grid: brand + Work links + Connect links
- LinkedIn: `https://linkedin.com/in/divyanshriitb`
- Behance: `https://www.behance.net/divyansh_rastogi`
- Email: `divyanshr.iitb@gmail.com`

### ✅ Custom Cursor
- Orange dot (`#cursor`) + lagging ring (`#cursor-ring`)
- rAF loop with lerp factor 0.14
- Grows on hover over `a, button, .small-card, .project-row`

### ✅ Scroll Reveal
- `.reveal` → `.visible` via IntersectionObserver (threshold: 0.12)
- Staggered with `setTimeout(i * 60ms)`

### ✅ Case Study Overlay System
Full-page overlay slides in **from the right** over the homepage.

**Structure:**
```html
<div id="caseOverlay" class="case-overlay">
  <div class="overlay-backdrop">        <!-- blurred bg, full screen -->
  <div class="overlay-actions">         <!-- floating buttons, fixed right edge -->
    ✕ close (top) | ↑ scroll-to-top (bottom)
  <div class="overlay-panel">           <!-- width: 5/6 vw, right: 0, slides from right -->
    <div class="overlay-body">          <!-- scrollable content -->
```

**Panel:** `width: calc(100vw * 5/6); right: 0` — 1/6 of homepage visible on left. `border-radius: 20px 0 0 20px`. `transform: translateX(100%)` when closed.

**Floating action buttons (`.overlay-actions`):**
- `position: fixed; top: 36px; bottom: 36px; right: 20px`
- `flex-direction: column; justify-content: space-between` — X at top, ↑ at bottom
- Fade in after panel arrives (0.42s delay)
- `oa-close`: 42px circle, rotates 90° on hover
- `oa-top`: always visible when overlay is open (no scroll threshold). Scrolls to top on click.
- **No LinkedIn or email pills** in case study overlay (removed)

**Overlay body padding:** `80px 80px 120px` (80px sides)

**Hash routing:** `#kinko`, `#settlr`, `#refer-earn` — works on direct load too.

**Content:** Templates in `caseStudies` JS object. Each has: hero image, meta grid (role/company/timeline/tools), problem/approach/outcome sections, screen placeholders, Behance link.

### ✅ Resume Overlay
Slides in from the right, same visual language as case study overlay.

**Structure:**
```html
<div id="resumeOverlay" class="resume-overlay">
  <div class="resume-backdrop">          <!-- blurred bg -->
  <div class="resume-actions">           <!-- floating buttons, fixed top-right, z-index 970 -->
    ✕ close | ↓ Download pill
  <div class="resume-panel">             <!-- width: 2/3 viewport, right: 0 -->
    <div class="resume-frame-wrap">      <!-- padding-right: 88px for FAB clearance -->
      <iframe id="resumeFrame">          <!-- Google Drive /preview embed -->
```

**Key specs:**
- Panel: `width: calc(100vw * 2/3); right: 0` — 1/3 of homepage visible on left
- `border-radius: 20px 0 0 20px`
- Iframe src set on open: `https://drive.google.com/file/d/1KgYi6ZdNP7QKaseUvkf09Z1subnG62Rv/preview`
- Download link: `https://drive.google.com/uc?export=download&id=1KgYi6ZdNP7QKaseUvkf09Z1subnG62Rv`
- `padding-right: 88px` on `.resume-frame-wrap` to clear FABs
- Iframe src cleared on close (after 420ms for animation)
- Reuses `.oa-btn`, `.oa-close`, `.oa-pill` button styles
- Backdrop + panel fade/slide independently; actions fade in at 0.42s delay
- Escape key + backdrop click both close

### ✅ Refer & Earn Case Study (fully built)

All images verified loading in preview (naturalWidth > 0, zero broken). Full section map:

1. **Hero** — `cover.png` full-width banner
2. **The Challenge** — stats + copy (no images)
3. **Research** — user quotes + IA Audit / PRD Alignment / Hallway Testing cards (no images)
4. **Ideation** — `approach-1.png` (Minimal UI + Gamification) · `approach-2.png` (Contextual CTA)
5. **Iteration** — `infographic-v1.png` · `infographic-v2.png` · `infographic-v3.png` (v3 marked ✓ Selected)
6. **Design Decisions** — stats/copy blocks (no images)
7. **Before/After** — 3-col grid: `screen-before.png` | `screen-tooltip.png` | `screen-final.png`
   - "BEFORE" label: `grid-column: 1` | "AFTER" label: `grid-column: 2 / 4`; static, no animation
8. **Multi-Brand** — `screen-rummy.png` · `screen-poker.png` · `screen-adda52.png`
9. **Treasure Referrals** (`.cs-dark-section`) — single-column stacked (NOT a 2-col grid)
   - Order: `.cs-tag` → `h2.cs-section-title` → `.cs-dark-desc` → `.cs-treasure-mockups` → `.cs-treasure-points`
   - `.cs-dark-desc`: `font-size: 16px; line-height: 1.7; opacity: 0.6; max-width: 60ch`
   - `.cs-treasure-mockups`: `display: flex; gap: 32px; align-items: flex-end; justify-content: center; margin-top: 48px`
   - `.cs-treasure-points`: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 40px; margin-top: 48px; border-top: 1px solid rgba(255,255,255,0.1)`
   - Images: `treasure-1.png` (chest modal) + `treasure-2.png` (contacts list)

---

## Pending Work

### 🔲 Content to fill in
- Case study text (user writes): replace `<!-- Add... -->` comments in JS `caseStudies` object
- Real project thumbnail images for Kinko and Settlr
- Hero portrait photo → replace `.photo-placeholder` with `<img>`
- Footer work links → wire to `#kinko`, `#settlr`, `#refer-earn`

### 🔲 Settlr Prototype Viewer (in-case-study interactive prototype)
- Files are ready at `prototype/settlr/` — 24 screens + tokens + css + icons
- **Still to build:** Add iframe phone frame + screen switcher section to the Settlr case study in `index.html`
- Approach: a `.cs-section` with a phone-framed `<iframe>` (393×852 aspect ratio) + buttons to switch between key screens
- Screens to feature in switcher: `home-dashboard.html`, `group-detail.html`, `add-split.html`, `settle-success.html`, `activity.html`, `settle-select.html`
- iframe `src` set to `prototype/settlr/screens/home-dashboard.html` initially
- Switcher buttons styled as pills (`.cs-chip` style), update iframe src on click
- Optional: scale the iframe down (CSS `transform: scale(0.5); transform-origin: top center`) so 393px phone fits in a smaller display area

### 🔲 Alter Ego Dark Page
- Triggered by flipping the polaroid portrait (3D CSS flip interaction)
- Separate dark-mode page for filmmaking / photography / art work
- Page transition: flip animation → dark page slides in
- Status: **not started**

### 🔲 Deployment
- Target: Netlify
- Single `index.html` + `assets/` folder → drag-and-drop deploy
- Custom domain TBD

### 🔲 Responsive Layout
- Currently desktop-only (no media query layout changes)
- To be added after desktop is finalised

---

## Known Patterns / Gotchas

1. **Polaroid rotation + reveal class conflict**: The generic `.reveal` sets `transform: translateY(32px)` which overwrites `rotate(1.2deg)`. Fixed with specific overrides on `.hero-photo-wrap.reveal` and `.hero-photo-wrap.reveal.visible`. The hover state uses `!important` to win over both.

2. **Overlay actions z-index**: `overlay-actions` is at `z-index: 820`, above case study overlay panel (`z-index: 800`). Resume actions at `z-index: 970`, above resume overlay (`z-index: 950`). Both use `position: fixed` so not clipped by panel's `overflow: hidden`. `pointer-events: none` on parent hides them when overlay is closed.

3. **Scroll listener on window vs overlayBody**: The main page scroll drives the nav animation. The case study overlay `overlayBody` scroll listener is present but empty (↑ button is always visible now — no scroll threshold).

4. **Eval in preview**: Always wrap multi-statement evals in an IIFE `(() => { ... })()` to avoid illegal return statements.

5. **Small card color reveal + parallax**: Each card has two identical `<img>` tags — `.small-card-bg` (grayscale) and `.small-card-color` (color, `clip-path: circle(0%)`). Color reveal: JS lerps clip-path radius. Frame parallax: JS moves the `.small-card` element itself ±14px H / ±10px V towards cursor. CSS scale(1.05) still applies to images on hover via `.small-card:hover .small-card-bg/.small-card-color`. `overflow: visible` on `.small-grid` allows horizontal card overflow.

6. **Resume iframe lazy load**: `resumeFrame.src` is set to the Drive preview URL only when the overlay opens, and cleared after close animation (420ms timeout).

7. **P3 thumbnail parallax**: FG image (`#p3-fg`) is centered with `transform: translate(-50%, -50%)`. JS mousemove on `.project-row.p3` adds cursor offset to that base transform: `translate(calc(-50% + Xpx), calc(-50% + Ypx))`. Uses CSS `transition: transform 0.4s cubic-bezier(...)` for smooth follow.

8. **Case study overlay panel**: No longer uses `left: var(--overlay-strip)`. Now uses `width: calc(100vw * 5/6); right: 0`. The `--overlay-strip` token is still in `:root` but only the resume overlay conceptually uses the "strip" idea. Transform for close state: `translateX(100%)`.
