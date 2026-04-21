# Design System — Divyansh Rastogi Portfolio

> Single source of truth for visual language, tokens, components, and interaction patterns.

---

## 1. Colour

### Base Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--c-orange` | `#EA7623` | Primary accent, CTAs, links, highlights |
| `--c-light` | `#F2F0F0` | Page background, light surfaces |
| `--c-dark` | `#1B1C1A` | Primary text, dark backgrounds |
| `--c-mid` | `#888886` | Muted/secondary text, placeholders |
| `--c-surface` | `#E6E4E4` | Project info panels (P1, P3), chips |
| `--c-dark2` | `#2E2F2D` | Reserved for dark surfaces |
| `--c-dark3` | `#444541` | CTA section background |

### Opacity Usage
- Text muted: `opacity: 0.65` (project descriptions)
- Meta labels: `opacity: 0.45`
- Decorative/footer: `opacity: 0.25–0.35`
- Disabled/subtle: `opacity: 0.4`

### Overlay / Transparency
- Backdrop blur: `rgba(27,28,26, 0.55)` + `backdrop-filter: blur(10px)`
- Nav border: `rgba(27,28,26, 0.08)`
- Dividers: `rgba(27,28,26, 0.08)`
- Box shadows: `rgba(27,28,26, 0.14–0.28)`

### Accent Hover
- Orange hover: `#D46820` (darkened ~8%)
- Black hover on dark buttons: `#000000`

---

## 2. Typography

### Fonts
```css
--f-heading: 'Montserrat', sans-serif;
--f-body:    'Plus Jakarta Sans', sans-serif;
```

### Scale & Usage

| Use | Font | Size | Weight | Notes |
|-----|------|------|--------|-------|
| Hero name | Montserrat | `clamp(40px, 5vw, 64px)` | 800 | `letter-spacing: -0.02em` |
| Section title | Montserrat | `clamp(22px, 2vw, 28px)` | 800 | `letter-spacing: -0.02em` |
| Project title | Montserrat | `clamp(24px, 2.5vw, 36px)` | 800 | `letter-spacing: -0.02em` |
| CS section title | Montserrat | `clamp(22px, 2.5vw, 32px)` | 800 | `letter-spacing: -0.02em` |
| CTA heading | Montserrat | `clamp(36px, 5vw, 64px)` | 800 | `letter-spacing: -0.03em` |
| Nav name | Montserrat | `15px` | 800 | `letter-spacing: -0.02em` |
| Card title (small) | Montserrat | `15px` | 700 | — |
| Footer brand | Montserrat | `16px` | 800 | — |
| Body / tagline | Plus Jakarta Sans | `15px` | 400 | `font-style: italic` for tagline |
| Project desc | Plus Jakarta Sans | `14px` | 400 | `line-height: 1.75` |
| CS body | Plus Jakarta Sans | `15px` | 400 | `line-height: 1.8`, `max-width: 72ch` |
| CS dark desc | Plus Jakarta Sans | `16px` | 400 | `line-height: 1.7`, `max-width: 60ch`, `opacity: 0.6` |
| Buttons | Plus Jakarta Sans | `13px` | 500 | `letter-spacing: 0.01em` |
| Labels / meta | Plus Jakarta Sans | `10–11px` | 500–700 | `text-transform: uppercase`, `letter-spacing: 0.12–0.14em` |
| Small print | Plus Jakarta Sans | `11–12px` | 400 | Footer, captions |

### Line Heights
- Headings: `1.05–1.15`
- Body: `1.75–1.8`
- Meta: `1.5`

---

## 3. Spacing & Layout

### Core Spacing
| Use | Value |
|-----|-------|
| Page horizontal padding | `80px` |
| Nav horizontal padding | `48px` |
| Section vertical padding | `100px` (small projects) / `140px` (CTA) |
| Hero top padding | `calc(var(--nav-h) + 80px)` |
| Project info padding | `72px 64px` |
| Footer padding | `48px 80px` |
| Overlay body padding | `80px 80px 120px` (top / sides / bottom) |

### Nav
- Height: `--nav-h: 64px`
- Fixed, `z-index: 500`

### Grid Patterns
| Section | Grid |
|---------|------|
| Featured projects | `1fr 1fr`, `min-height: 72vh` |
| Small projects | `repeat(4, 1fr)`, `gap: 28px`, `overflow: visible` |
| Footer | `2fr 1fr 1fr`, `gap: 32px` |
| CS overview | `220px 1fr`, `gap: 64px` |
| CS screens | `repeat(3, 1fr)`, `gap: 16px` |
| CS before/after | `1fr 1fr 1fr`, `column-gap: 20px` — BEFORE label col 1, AFTER label cols 2–4 |
| CS treasure features | `repeat(3, 1fr)`, `gap: 0 40px` — horizontal feature row |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Small elements |
| `--radius-md` | `16px` | General cards (not small project cards) |
| `--radius-pill` | `100px` | Buttons, chips, tags |
| Small project cards | `10px` | `.small-card` (not using token) |
| Polaroid | `3px` | Hero photo wrap |
| Overlay panel | `20px 0 0 20px` | Left edge only (slides from right) |
| CS hero image | `10px` | Case study hero |
| CS screens | `8px` | Screenshot placeholders |

---

## 5. Components

### Button — Outline
```css
background: transparent;
border: 1.5px solid var(--c-dark);
color: var(--c-dark);
padding: 9px 22px;
border-radius: var(--radius-pill);
font-size: 13px; font-weight: 500;
/* hover */
background: var(--c-dark); color: var(--c-light);
```

### Button — Filled (Primary)
```css
background: var(--c-orange);
border: 1.5px solid var(--c-orange);
color: #fff;
padding: 9px 22px;  /* CTA: 14px 32px */
border-radius: var(--radius-pill);
font-size: 13px; font-weight: 500;
/* hover */
background: #D46820; border-color: #D46820;
```

### Overlay Action — Circle (`.oa-btn`)
```css
width: 42px; height: 42px;
border-radius: 50%;
background: var(--c-dark); color: var(--c-light);
box-shadow: 0 2px 16px rgba(27,28,26,0.22);
/* close hover: background #000; transform: rotate(90deg) */
/* top hover: background var(--c-orange) */
```

### Overlay Actions Layout
```css
.overlay-actions {
  position: fixed;
  top: 36px; bottom: 36px; right: 20px;
  display: flex; flex-direction: column;
  justify-content: space-between;  /* X at top, ↑ at bottom */
}
```
Case study overlay: only ✕ close + ↑ scroll-to-top (always visible). No LinkedIn/email pills.
Resume overlay: ✕ close + ↓ download pill.

### Tag / Chip
```css
padding: 6px 14px;
border-radius: var(--radius-pill);
background: var(--c-surface);
font-size: 12px; font-weight: 500;
```

### Case Study Meta Row
```css
/* Label */
font-size: 10px; text-transform: uppercase;
letter-spacing: 0.12em; font-weight: 600; opacity: 0.4;

/* Value */
font-size: 13px; line-height: 1.5;

/* Separator */
border-top: 1px solid rgba(27,28,26,0.08);
padding: 14px 0;
```

### Polaroid Photo Card
```css
padding: 20px 20px 64px;   /* thick bottom = tape area */
background: #fff;
border-radius: 3px;
box-shadow: 0 8px 40px rgba(27,28,26,0.14), 0 2px 8px rgba(27,28,26,0.06);
transform: rotate(1.2deg);
/* hover */
transform: translateY(0) rotate(0deg) scale(1.01) !important;
```

---

## 6. Interactions & Animation

### Cursor
- Custom orange dot (`12px`) + lagging ring (`36px`, orange border)
- On hover `a/button`: dot grows to `20px`, ring to `56px`
- Ring follows with lerp `0.14` via `requestAnimationFrame`

### Scroll Reveal
```css
.reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
```
Triggered by IntersectionObserver at `threshold: 0.12`, staggered `i * 60ms`.

**Exception — Polaroid:** Must preserve rotation. Overrides:
```css
.hero-photo-wrap.reveal        { transform: translateY(32px) rotate(1.2deg); }
.hero-photo-wrap.reveal.visible { transform: translateY(0) rotate(1.2deg); opacity: 1; }
.hero-photo-wrap:hover          { transform: translateY(0) rotate(0deg) scale(1.01) !important; }
```

### Scroll-driven: Name → Nav
```
scrollY 0%      → hero name full, tagline visible, nav name hidden
scrollY 0–20%   → tagline fades out + drifts up 12px
scrollY 10–40%  → hero name fades + scales(0.92) + drifts up 24px
                → nav name fades in + drifts into place
scrollY >40%    → hero name gone, nav name fully visible
```
Uses `lerp(a, b, t)` for smooth interpolation. Scroll listener `{ passive: true }`.

### Project Image Hover
```css
.project-img-inner { transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.project-row:hover .project-img-inner { transform: scale(1.04); }
```

### P3 FG Parallax
```javascript
// mousemove on .project-row.p3
// moves #p3-fg up to 18px towards cursor
p3Fg.style.transform = `translate(calc(-50% + ${dx * 18}px), calc(-50% + ${dy * 18}px))`;
// mouseleave resets to translate(-50%, -50%)
// CSS transition: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Small Card Interactions
```css
/* Image scale on hover — CSS */
.small-card:hover .small-card-bg,
.small-card:hover .small-card-color { transform: scale(1.05); }

/* Frame parallax — JS (overrides CSS transform on the card element) */
/* mousemove: card.style.transform = `translate(${dx*14}px, ${dy*10 - 6}px)` */
/* mouseleave: card.style.transform = '' */
/* max movement: ±14px horizontal, ±10px vertical */
```
Color reveal: JS lerps `clip-path: circle(R%)` from cursor entry point using rAF.

### Overlay Open/Close
- Backdrop: `opacity 0.5s ease`
- Panel: `transform 0.65s cubic-bezier(0.32, 0.72, 0, 1)` — slides from `translateX(100%)` to `translateX(0)`
- Action buttons: fade in at `0.42s` delay after panel starts moving

### Easing Reference
| Curve | Value | Usage |
|-------|-------|-------|
| Standard ease | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Image zoom, small card, P3 parallax |
| Snappy slide | `cubic-bezier(0.32, 0.72, 0, 1)` | Overlay panel |
| Spring expand | `cubic-bezier(0.34, 1.1, 0.64, 1)` | Pill button width |
| Linear | `linear` | Nav name opacity/transform |

---

## 7. Project Row Colour System

| Row | Image bg | Info bg | Text |
|-----|----------|---------|------|
| P1 (Kinko) | `#A8A7A4` | `--c-surface` | Dark |
| P2 (Settlr) | `#5A5955` | `--c-dark` | Light |
| P3 (Refer & Earn) | CSS bg-image (thumbnail-bg.png) + FG img | `--c-surface` | Dark |

P2 uses `direction: rtl` on the row to flip image to the right side.

---

## 8. Overlay System

### Case Study Overlay Anatomy
```
.case-overlay (fixed, inset 0, z-index 800)
├── .overlay-backdrop (blur + dark tint, full screen)
├── .overlay-actions (fixed, top:36px bottom:36px right:20px, z-index 820)
│   ├── ✕  .oa-close  (top)
│   └── ↑  .oa-top    (bottom, always visible when overlay open)
└── .overlay-panel (width: calc(100vw * 5/6), right: 0, slides from right)
    └── .overlay-body (scrollable, padding: 80px 80px 120px)
```

### Overlay Panel
- `width: calc(100vw * 5/6); right: 0` — 1/6 of homepage visible on left
- `border-radius: 20px 0 0 20px` — soft left edge
- `box-shadow: -16px 0 80px rgba(27,28,26,0.28)`
- Closed state: `transform: translateX(100%)`

### Hash Routing
- `#kinko` → Kinko Insurance case study
- `#settlr` → Settlr case study
- `#refer-earn` → Refer & Earn case study
- Works on direct page load (shareable links)

### Refer & Earn Case Study Content (in order)
1. `.cs-hero` — hero image (`re-banner.png`)
2. `.cs-overview` — 2-col: meta sidebar (role/company/timeline/mentors/tools) + problem statement + chips
3. `.cs-divider`
4. `.cs-section` — "The Numbers": stats grid + conversion funnel table
5. `.cs-section` — "Research": quote cards + method cards
6. `.cs-section` — "Exploration": direction chips + 2 approach cards
7. `.cs-section` — "Iterations": iteration grid + "why it worked" callout
8. `.cs-section` — "Final Design": 5-decision list
9. `.cs-section` — "Multi-Brand System": phone trio (Rummy / Poker / Adda52)
10. `.cs-divider`
11. `.cs-before-after` — 3-column grid: BEFORE img | AFTER img 1 | AFTER img 2
12. `.cs-dark-section` — Treasure Referrals: tag → title → desc → phones → feature row
13. `.cs-divider`
14. `.cs-footer` — Behance link

---

## 9. Rules & Principles

1. **No layout breakpoints yet.** Desktop-only until all desktop work is finalised.
2. **Heading hierarchy**: Use `--f-heading` (Montserrat 800) only for h1/h2/h3 level headings. Body copy is always `--f-body`.
3. **Orange sparingly**: Only for links, CTAs, active states, and accent highlights. Never for large fills.
4. **Shadows are warm**: All shadows use `rgba(27,28,26, ...)` — no cold grey shadows.
5. **Transforms compound**: Never set `transform` on an element that already has a transform from a class. Either override the full transform string or use a wrapper element.
6. **Cursor**: All interactive elements must have `cursor: none`. The custom cursor handles feedback.
7. **z-index ladder**: Custom cursor `9999/9998` → Overlay actions `820` → Overlay `800` → Nav `500`.
8. **Content width**: Long-form text capped at `max-width: 72ch`. Project descriptions: `max-width: 38ch`.
9. **Small card grid overflow**: `.small-grid` must have `overflow: visible` so frame parallax movement isn't clipped at grid boundaries.
