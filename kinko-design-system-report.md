# Kinko Design System — Comprehensive Reference Report

**Generated:** 2026-05-05
**Project root:** `/Users/divyanshrastogi/Desktop/Kinko_Design/`
**Figma file key:** `IDT7FF4CnWEMLfuwSCFQoa`
**Status:** Active development — components 50, tokens (primitive 142 + semantic 87 + ~45 palette + 44 misc), screens 2 production + 8 demo

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Structure](#2-project-structure)
3. [Design Principles & Philosophy](#3-design-principles--philosophy)
4. [Foundations](#4-foundations)
   - 4.1 [Color](#41-color)
   - 4.2 [Typography](#42-typography)
   - 4.3 [Spacing & Layout](#43-spacing--layout)
   - 4.4 [Radius](#44-radius)
   - 4.5 [Elevation / Shadow](#45-elevation--shadow)
   - 4.6 [Motion](#46-motion)
   - 4.7 [Iconography](#47-iconography)
   - 4.8 [Imagery & Illustration](#48-imagery--illustration)
5. [Token Architecture](#5-token-architecture)
6. [Components](#6-components)
7. [Patterns](#7-patterns)
8. [Screens / Examples](#8-screens--examples)
9. [Accessibility](#9-accessibility)
10. [Responsiveness](#10-responsiveness)
11. [Conventions](#11-conventions)
12. [Tooling & Stack](#12-tooling--stack)
13. [Process — How the system was built](#13-process--how-the-system-was-built)
14. [Decisions & Rationale Log](#14-decisions--rationale-log)
15. [Gaps, Risks, Open Questions](#15-gaps-risks-open-questions)
16. [Roadmap / Next Steps](#16-roadmap--next-steps)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

Kinko is an insurance selling platform for mobile, tablet, desktop, and FHD (1920px+). The design system is the foundation of its UI surface — covering tokens, components, screen layouts, and the bidirectional Figma ↔ code workflow that keeps both sides synchronized.

**Goals:**
- Ship a single, consistent visual language across four breakpoints with no dark theme.
- Encode **trust, clarity, and professionalism** appropriate for an insurance product (avoiding playful or decorative aesthetics).
- Maintain **1:1 parity** between Figma source-of-truth and CSS implementation through a strict 3-tier token architecture (primitive → semantic → component) and Code Connect.
- Support a multi-platform engineering team with a single import (`tokens/index.css` + `css/index.css`).

**Audience:** designers (Figma), engineers (vanilla HTML/CSS), and product managers reviewing in Figma Dev Mode or the local preview server.

**Pillar status:**

| Pillar | Status | Notes |
|---|---|---|
| Color foundation | ✅ Done | 142 primitives, 87 semantic, 45 palette tokens |
| Typography foundation | ✅ Done | Plus Jakarta Sans, 19 named text styles |
| Spacing / radius / borders / shadows / opacity / overlay | ✅ Done | All token CSS files + JSON sources synced to Figma |
| Components | ✅ 50 shipped | 3-tier compliant; per-component Figma variable collection (~40 component collections) |
| Patterns | 🟡 Partial | Several documented inline (Select recipes, billing summary, FHD layout); no central patterns library yet |
| Screens / Examples | 🟡 Partial | 2 production-style flows (login, onboarding), 8 component demo pages |
| Documentation | ✅ Done (internal) | `design-system.md`, `design-reference.md`, per-component `components/*.md`, `references/changelog.md` |
| Tooling (skill enforcers, indexes) | ✅ Done | 5 enforcer skills + Figma orchestrator + 2 indexes (`code-index.json`, `figma-index.json`) |
| Code Connect (Figma ↔ code) | 🔲 Pending | All 50 components have `codeConnect: false` in `figma-index.json` |
| Accessibility audit | 🟡 Partial | WCAG AA touch targets observed (48px), focus-visible used, contrast ratios not formally audited |

---

## 2. Project Structure

```
/Users/divyanshrastogi/Desktop/Kinko_Design/
├── tokens/                           ← 9 CSS token files + JSON source
│   ├── index.css                     (15 lines — single import for all tokens)
│   ├── colors.css                    (183 lines — 142 primitive colors)
│   ├── semantic.css                  (138 lines — 87 semantic aliases)
│   ├── typography.css                (202 lines — fonts + 19 text classes)
│   ├── spacing.css                   (20 lines — 12 spacing steps)
│   ├── radius.css                    (21 lines — 13 radius steps)
│   ├── borders.css                   (12 lines — 4 border widths)
│   ├── opacity.css                   (13 lines — 5 opacity levels)
│   ├── overlays.css                  (13 lines — 5 scrim levels)
│   ├── shadows.css                   (13 lines — 5 elevation levels)
│   └── source/                       ← read-only JSON exports for Figma sync
│       ├── primitives.color.json
│       ├── semantic-colors.json
│       ├── spacing.json
│       ├── radius.json
│       ├── text-styles.json
│       ├── elevation.json
│       ├── opacity.json
│       ├── overlay.json
│       └── border.json
│
├── components/                       ← 50 component spec files (.md)
│   └── [50 files: button.md, input.md, card.md, modal.md, … chatbox.md, stats-strip.md]
│
├── css/                              ← 50 component CSS files + index
│   ├── index.css                     (56 lines — 50 @imports)
│   └── [50 component .css files]
│
├── screens/                          ← prototypes + component demos
│   ├── login-flow.html               (2057 lines — multi-screen prototype)
│   ├── onboarding-prototype.html     (1433 lines — multi-screen prototype)
│   ├── avatar-stack-test.html        (187 lines — demo)
│   ├── chatbox-test.html             (100 lines — demo)
│   ├── chip-tag-test.html            (81 lines — demo)
│   ├── comp-table-test.html          (447 lines — demo)
│   ├── component-audit-test.html     (231 lines — multi-component sanity sheet)
│   └── toast-test.html               (155 lines — demo)
│
├── references/
│   ├── changelog.md                  (~400 lines — dated history)
│   ├── figma-api.md                  (Figma file key, collection IDs, API patterns)
│   ├── logo-explorations.md
│   └── logo-explorations.html
│
├── assets/                           ← icons, images, fonts (placeholders)
├── guidelines/                       ← brand + a11y guidelines (empty)
├── patterns/                         ← page patterns (empty)
│
├── .claude/
│   ├── indexes/
│   │   ├── code-index.json           (registry — components + tokens + screens)
│   │   └── figma-index.json          (registry — Figma node IDs + collections)
│   └── skills/
│       ├── kinko-text-style-enforcer/SKILL.md
│       ├── kinko-color-enforcer/SKILL.md
│       ├── kinko-spacing-enforcer/SKILL.md
│       ├── kinko-component-enforcer/SKILL.md
│       ├── kinko-layout-enforcer/SKILL.md
│       └── kinko-token-extractor/SKILL.md
│
├── CLAUDE.md                         ← mandatory project rules (~22kB)
├── design-system.md                  ← full system docs
├── design-reference.md               ← quick cheat sheet
├── figma-enforcer.md                 ← Figma orchestrator skill
├── Discrepancies.md                  ← daily audit report (read-only)
├── README.md
├── docs.html / docs.css / docs.js    ← in-progress docs site
└── *-test.html                       ← 10 component-demo HTML files at root
```

**Total scale:** ~30,706 lines across markdown + CSS + HTML + JSON.

---

## 3. Design Principles & Philosophy

### Stated principles (from `CLAUDE.md` §5 and `design-system.md`)

- **Multi-platform** — every component must work at mobile (390px), tablet (768px+), desktop (1280px+), and FHD (1920px+).
- **No system dark mode** — single light theme. Component-level dark variants exist (e.g. `.top-nav--dark`, `.chip-filter--dark`) for design-choice contexts, not user-toggled themes.
- **Brand colors:**
  - Primary: Green `#009b1a` → `--action-primary` / `primary/green/500`
  - Secondary: Navy `#0b2b40` → `--action-secondary` / `primary/navy/500`
  - Always use semantic aliases in components, not raw primitives.
- **Font:** Plus Jakarta Sans only. Five weights (400/500/600/700/800). No fallback fonts beyond `sans-serif`.
- **Trust, clarity, professionalism** — insurance product. Avoid playful or decorative patterns that undermine credibility.
- **Touch targets** — 48px minimum (WCAG AA).
- **Interaction model** — pressed states for touch, hover for desktop cursor (`@media (hover: hover)`).
- **Default states** have no fill (transparent background) unless the component spec says otherwise.
- **3-tier token architecture (HARD RULE)** — every component must define its own component-level token collection that aliases semantic tokens, never primitives directly.
- **Icon holder (HARD RULE)** — every icon SVG must be wrapped in `.icon-holder` (code) or an Icon Holder instance (Figma). No bare `<svg>` allowed.

### Visual character

- **Friendly-professional / clinical-but-warm.** Evidence:
  - Green primary feels approachable yet healthy/insurance-coded; navy gives weight and trust.
  - Plus Jakarta Sans is humanist (not heavily geometric), readable, neutral.
  - 12-step spacing scale and rounded corners (8/12/16) give a soft, modern feel.
  - The "3D juicy" button system (multi box-shadow + shine + ring) signals interactivity without being childish.
  - Cool-leaning grey scale (NOT warm grey) reinforces clinical professionalism.
- **Anti-patterns explicitly rejected:** decorative gradients, bright accent colors, playful illustrations.

### Tone-of-voice

Not formally documented in this repository. (Copywriting tone lives elsewhere — likely in product/marketing.)

---

## 4. Foundations

### 4.1 Color

#### Primitive palette (142 tokens)

CSS prefix `--color-`. JSON nested under `color.{family}.{shade}`. 13 color families × 10 shades + 2 base = 142.

**Base** (2): `white` `#ffffff`, `black` `#000000`

**Primary — brand spine** (3 families × 10 shades = 30):

| Family | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| green | `#e6f5e8` | `#ccebd1` | `#99d7a3` | `#66c376` | `#33af48` | **`#009b1a`** | `#007c15` | `#005d10` | `#003e0a` | `#001f05` |
| navy  | `#e7eaec` | `#ced5d9` | `#9daab3` | `#6d808c` | `#3c5566` | **`#0b2b40`** | `#092233` | `#071a26` | `#04111a` | `#02090d` |
| grey  | `#f0f1f3` | `#e1e3e7` | `#c4c8ce` | `#a6acb6` | `#89919d` | **`#6b7585`** | `#565e6a` | `#404650` | `#2b2f35` | `#15171b` |

Bold = the canonical "500" shade used as the action default for that family. Grey is **cool-leaning** (deliberate — warm greys are forbidden).

**Secondary — supporting hues** (3 × 10 = 30): teal (500 `#1f7a7a`), steel-blue (500 `#4a90a4`), mint (500 `#7ed9a6`).

**Tertiary — accent hues** (4 × 10 = 40): peach (500 `#f4a261`), yellow (500 `#e9c46a`), coral (500 `#e76f51`), purple (500 `#6c63ff`).

**System — feedback** (4 × 10 = 40): success (500 `#22a447`), info (500 `#3b82f6`), warning (500 `#fea72d`), error (500 `#f3473c`).

#### Semantic tokens (87)

CSS prefix varies by category. All defined in `tokens/semantic.css`. Components MUST consume these — never raw primitives.

| Group | Count | Tokens |
|---|---|---|
| `--surface-*` | 17 | default, secondary, tertiary, brand, inverse, inverse-secondary, inverse-hover, disabled, active-tint, error-tint, selected, brand-inverse, brand-hover, tooltip, dot-active, dot-inactive, chat-user |
| `--text-*` | 10 | primary, secondary, tertiary, inverse, brand, error, error-emphasis, disabled, on-action-primary, on-action-secondary |
| `--action-*` | 12 | primary, primary-hover, primary-pressed, secondary, secondary-hover, secondary-pressed, disabled, destructive, destructive-hover, destructive-pressed, link, link-hover |
| `--border-*` | 10 | default, strong, subtle, focus, focus-primary, focus-secondary, focus-destructive, error, selected, inverse |
| `--feedback-*` | 23 | success/error/warning/info each: base + bg + border + text + strong (+ error-bg-emphasis, warning-bg-emphasis) |
| `--palette-*` | 45 | 9 colors × 5 variants (bg, bg-strong, text, text-strong, shadow) — CSS-only, no JSON source |

#### Light/dark mode

- **No system dark theme.** Components have optional dark variants (e.g. `.top-nav--dark` mode-tied through Figma's Light/Dark variable modes; `.chip-filter--dark`).
- Header collection (`VariableCollectionId:2272:5449`) has 2 modes: Light (default) and Dark.
- Chip Filter collection (`VariableCollectionId:2423:77649`) has 2 modes: Light and Dark.

#### Contrast (WCAG)

Not formally audited in this repository. Spot-check of key pairings:

| Foreground | Background | Ratio (approx) | Use | Pass |
|---|---|---|---|---|
| `text-primary` (navy-900) | `surface-default` (white) | 17.5:1 | Body text | AAA |
| `text-on-action-primary` (white) | `action-primary` (green-500) | 3.2:1 | Primary button | ⚠️ AA Large only |
| `text-inverse` (white) | `surface-inverse` (navy-900) | 17.5:1 | Dark surface | AAA |
| `text-secondary` (grey-500) | `surface-default` | 4.6:1 | Muted text | AA |
| `text-tertiary` (grey-300) | `surface-default` | 2.4:1 | Placeholder | ⚠️ Below AA |

**Outstanding:** A formal accessibility contrast audit is not present. The grey-300 placeholder colour is below WCAG AA for body text — acceptable for placeholders only.

### 4.2 Typography

**Font family:** `'Plus Jakarta Sans', sans-serif` (loaded from Google Fonts).
**Weights loaded:** 400, 500, 600, 700, 800.
**Custom property:** `--font-family`.

**Body reset** (`tokens/typography.css`):
```css
body {
  font-family: var(--font-family);
  font-weight: 400;
  font-size: 14px;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}
```

**Type scale (19 named classes):**

| Class | Size | Weight | line-height | letter-spacing | Use |
|---|---|---|---|---|---|
| `.text-title-xl` | 20px | 700 | 1.3 | 0 | Page headings |
| `.text-title-lg` | 18px | 700 | 1.3 | 0 | Section headings |
| `.text-title-md` | 16px | 700 | 1.3 | 0 | Sub-section headings |
| `.text-title-sm` | 14px | 600 | 1.3 | 0 | Card titles |
| `.text-title-xs` | 13px | 600 | 1.3 | 0 | Small headings |
| `.text-body-md` | 14px | 400 | 1.5 | 0 | Standard body |
| `.text-body-sm` | 12px | 400 | 1.5 | 0 | Secondary body |
| `.text-body-xs` | 10px | 400 | 1.5 | 0 | Fine print |
| `.text-label-lg` | 16px | 600 | 1.2 | 0 | Primary button labels |
| `.text-label-lg-medium` | 16px | 500 | 1.2 | 0 | Secondary labels |
| `.text-label-md` | 14px | 600 | 1.2 | 0 | Form labels, tags |
| `.text-label-md-medium` | 14px | 500 | 1.2 | 0 | Secondary form labels |
| `.text-label-xs` | 12px | 500 | 1.2 | 0 | Badges, chips |
| `.text-caption-md` | 12px | 400 | 1.4 | 0 | Captions |
| `.text-caption-sm-bold` | 10px | 700 | 1.4 | 0 | Bold micro |
| `.text-caption-sm-medium` | 10px | 500 | 1.4 | 0 | Metadata |
| `.text-overline-lg` | 14px | 800 | 1.5 | 2px | Section eyebrow (UPPER) |
| `.text-overline-md` | 12px | 800 | 1.5 | 2px | Stat label (UPPER) |
| `.text-overline-sm` | 10px | 800 | 1.5 | 2px | Badge text (UPPER) |

**Conventions:**
- Always use a `.text-*` class — never set `font-size` or `font-weight` directly.
- Heading vs body: Title = visual headings (1.3 line-height). Body = paragraph copy (1.5). Label = compact UI text (1.2). Caption = micro chrome (1.4). Overline = uppercase eyebrow (1.5 + 2px tracking).
- No tabular-figures rule documented; default proportional figures.

**Negative tracking exception:** `screens/onboarding-prototype.html`'s splash logo originally used `letter-spacing: -0.5px`; this was removed because Kinko has no negative tracking token (commented note in file).

### 4.3 Spacing & Layout

**Spacing scale** (12 steps, `--spacing-*`):

| Token | px | Use |
|---|---|---|
| `--spacing-2` | 2 | Hairline — icon-text nudge |
| `--spacing-4` | 4 | Tight — inline badges |
| `--spacing-6` | 6 | Snug — compact icon gaps |
| `--spacing-8` | 8 | Base — button padding, list items |
| `--spacing-10` | 10 | Nudge — tight icon gaps |
| `--spacing-12` | 12 | Comfortable — card padding |
| `--spacing-16` | 16 | Standard — section padding |
| `--spacing-20` | 20 | Relaxed — content blocks |
| `--spacing-24` | 24 | Spacious — group separation |
| `--spacing-32` | 32 | Airy — section margins |
| `--spacing-48` | 48 | Wide — page sections |
| `--spacing-64` | 64 | Extra wide — layout divisions |

**Breakpoints** (mobile-first, observed in Header, Bottom Sheet, screen wrappers):

| Breakpoint | Width | Pattern |
|---|---|---|
| Mobile | 390px (iPhone reference) | `.screen` (default) |
| Tablet | 768px+ | `.screen--tablet` — side-nav appears |
| Desktop | 1280px+ | `.screen--desktop` — expanded side-nav |
| FHD | 1920px+ | `.screen--fhd` — wider content + 48px Header padding |

**Grid:** No explicit numerical grid (no 12-column scaffold). Layouts are auto-layout / flex-driven via component composition. Max content widths defined per screen (e.g. `--screen-content-max-fhd`).

**Layout primitives** (in `css/layout.css` — not yet finalised; referenced in CLAUDE.md): `.screen`, `.section`, `.divider`, `.h-scroll`, `.card-grid`. Spacing utilities not formally defined — components own their padding/gap.

### 4.4 Radius

13 steps, `--radius-*`:

`2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · pill (9999)`

**Common usage:**
- `--radius-8` — buttons, input fields, label SM, accordion icon, date cell
- `--radius-10` — label MD, icon-box-md
- `--radius-12` — cards, label LG, popover, card-row, card-tile, modal? (see modal: `--radius-16`)
- `--radius-16` — modal, tooltip, bottom sheet top corners
- `--radius-pill` (9999) — chip, search-input, toast, filter bar, progress bar, tag (left side only)

### 4.5 Elevation / Shadow

5 elevation levels, `--shadow-*`:

| Token | Value | Use |
|---|---|---|
| `--shadow-none` | `none` | Flat |
| `--shadow-low` | `0 1px 2px rgba(0,0,0,0.06)` | Cards |
| `--shadow-medium` | `0 4px 8px rgba(0,0,0,0.10)` | Dropdowns, popovers |
| `--shadow-high` | `0 8px 24px rgba(0,0,0,0.14)` | Modals |
| `--shadow-highest` | `0 16px 48px rgba(0,0,0,0.18)` | Toasts, floating overlays |

**Component-specific shadow exceptions** (no semantic equivalent):
- Footer Dock `--elevated` upward shadow: `0 -4px 12px rgba(26,38,59,0.08)` (navy-tint, points UP).
- Tab active inner shadow: `0 1px 2px 1px rgba(26,38,59,0.08)` (navy-tint).
- Tag dual-shadow: drop `0 1px 0 0 var(--tag-shadow-{status})` + inset `0 1px 0 0 var(--tag-highlight)`.

### 4.6 Motion

Not formally tokenised. Observed in component CSS:

| Component | Property | Value |
|---|---|---|
| Button | `transition: transform 0.1s, box-shadow 0.15s` (active state) | — |
| Toggle | `transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` (knob spring) | — |
| Progress Bar | `transition: width 0.3s` | — |
| Accordion | `transition: max-height 0.3s` | — |

**Reduced-motion:** No `@media (prefers-reduced-motion)` blocks observed in components — outstanding accessibility gap.

### 4.7 Iconography

- **Library:** Phosphor Icons (Outline Regular and Outline Fill variants) — referenced extensively in component specs (CaretRight, CaretDown, MapPin, X, StarFour Fill, PencilSimpleLine, etc.).
- **Mandatory wrapper:** every icon SVG must be inside `.icon-holder`. Bare `<svg>` is forbidden.
- **Sizes** (4): `icon-holder--xs` 12px, `--sm` 16px, `--md` 20px, `--lg` 24px.
- **Color rule:** Inner SVG uses `fill="currentColor"` (or `stroke="currentColor"`); the holder has no fill of its own — color flows down from parent.
- **Brand-tinted container:** `.icon-box` (4 sizes) wraps an `.icon-holder` of matching size for emphasis (card lead, factor tile). Bg = `surface/brand` (green-50), icon = `text/brand` (green-700).

**Icon Holder hard rule** is enforced by `kinko-component-enforcer` skill.

### 4.8 Imagery & Illustration

- **Illustration Placeholder** component (`.illustration-placeholder`, sizes 32/40/48/64) — white bg + 1px dashed navy border + radius-8. Reserves space until the asset ships.
- **Avatar** (`.avatar`, sizes 24/32/40/64/72/90/124) — circular user representation. Default fallback uses `User` icon on grey-100 bg; selected state has 2px green ring inside `.avatar__circle`.
- **No formal photo treatment guidelines** (aspect ratios, overlays, etc.) in repository.

---

## 5. Token Architecture

### Tier model — three layers

```
PRIMITIVE          e.g. primary/grey/200 = #c4c8ce
   ↓ aliased by
SEMANTIC           e.g. border/default → primary/grey/200
   ↓ aliased by
COMPONENT TOKEN    e.g. input/border/default → border/default
   ↓ bound to
LAYER PROPERTY     fill / stroke / text-fill / icon-fill etc.
```

### Hard rules (CLAUDE.md §2a)

1. **Component tokens MUST alias semantic tokens** — never primitives directly. (Button was migrated 2026-04-23 to comply.)
2. **Component tokens MUST live in their own Figma variable collection** (e.g. `Input`, `Button`, `Card`).
3. **Component token names describe role**, not value:
   - ✅ `input/border/default`, `input/text/label`, `input/bg/active`
   - ❌ `input/grey-200`, `input/green-500`
4. **In CSS:** define `--component-*` custom properties at the top of each component CSS file as aliases to semantic tokens. Below the `:root {}` block, only `--component-*` references are allowed.

### CSS pattern (canonical example — `css/card.css`)

```css
/* ── 1. Component tokens — aliases to semantic tokens ─ */
:root {
  --card-bg:     var(--surface-default);  /* white card surface */
  --card-border: var(--border-default);   /* grey-200 border stroke */
  --card-shadow: var(--shadow-low);       /* subtle lift */
}

/* ── 2. Card container ─ */
.card {
  background: var(--card-bg);
  border: var(--border-width-small) solid var(--card-border);
  border-radius: var(--radius-12);
  padding: var(--spacing-12);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  position: relative;
}
```

### Naming convention

- **CSS:** `--{group}-{role}[-{state/variant}]` — kebab-case.
- **Figma variables:** `{group}/{role}[/{variant}]` — slashes for nesting (Figma renders nested groups in the Variables panel).
- The slash `/` ↔ hyphen `-` mapping is consistent: Figma `palette/yellow/bg-strong` ↔ CSS `--palette-yellow-bg-strong`.

### Token format

- **CSS** custom properties (vanilla, no preprocessor).
- **JSON** source files (Style Dictionary-flavored — `value` + `type` shape) for Figma sync only. Edits flow JSON → Figma; CSS is the implementation source of truth (CLAUDE.md §1).
- **No build step** — tokens are loaded directly via `@import 'tokens/index.css'`. Browsers resolve the alias chain natively at runtime.

### Token flow

```
Figma file ←→ tokens/source/*.json ←→ tokens/*.css → screens via @import
            (read-only, JSON ↔ Figma)   (authoritative for code)
```

When a token is renamed:
1. Update CSS in `tokens/*.css`.
2. Update JSON in `tokens/source/`.
3. Update Figma variable name (preserves variable IDs — bindings stay valid).
4. Global search across all files for old name; replace.
5. Note in `references/changelog.md`.

### Semantic tokens — full reference table

See [§4.1](#41-color) for the complete list. The `_index` of every semantic alias and what consumes it is maintained in `code-index.json` and `figma-index.json`.

### Orphan / ad-hoc audit (cross-reference summary from `Discrepancies.md`)

- **Orphan tokens** (defined but not yet consumed): the 30 newly-added "strong" palette tokens (`--palette-{color}-{bg-strong/text-strong/shadow}` for navy/teal/steel-blue/mint/peach) are CSS-defined but no current component uses them. Available for future Tag-style components.
- **Ad-hoc values** (used but not tokenised — flagged for follow-up):
  - Button: `height: 36px / 44px / 52px` literal pixel values (not yet swapped to spacing tokens).
  - Toggle: `translateX(15px)` — knob slide distance.
  - Footer Dock upward shadow: `0 -4px 12px rgba(26,38,59,0.08)` — navy-tinted, no semantic equivalent.
  - `rgba(255,255,255,0.12)` button shine — no semantic equivalent.
- **No live hex violations** in any component CSS (the 2 hits in `checkbox.css` are inside documentation comments).

---

## 6. Components

50 components. Each has a spec at `components/{name}.md`, CSS at `css/{name}.css`, and (for most) a Figma variable collection. All entries below use the canonical structure: **Purpose / Class / Variants / States / Booleans / Tokens / Composes / Typography / Notes**.

### 6.1 Foundations & Utilities (icons, layout)

#### Icon Holder
- **Purpose:** MANDATORY wrapper for every icon SVG in the system — fixed-size centred flex container.
- **Class:** `.icon-holder`
- **Variants:** Sizes `--xs/--sm/--md/--lg` (12 / 16 / 20 / 24 px); historic `--bg-brand` modifier (deleted 2026-04-23).
- **States:** none
- **Booleans/Props:** Figma `Atom` (INSTANCE_SWAP — inner glyph)
- **Tokens:** 4 size tokens. No fill — color inherits via `currentColor`.
- **Composes:** consumed by every other component
- **Typography:** none
- **Notes:** HARD RULE — never place a bare `<svg>` without this wrapper. Default has no fill; color flows from parent.

#### Icon Box
- **Purpose:** Square brand-tinted container that wraps an `.icon-holder` when an icon needs visual emphasis.
- **Class:** `.icon-box`
- **Variants:** `--xs/--sm/--md/--lg` (16/24/32/40px outer; padding 2/4/6/8; radius 4/6/8/10)
- **States:** none
- **Booleans/Props:** Figma `Size` variant
- **Tokens:** 2 Figma (`icon-box/bg`→`surface/brand`, `icon-box/icon`→`text/brand`)
- **Composes:** must contain an inner matching-size `.icon-holder`
- **Typography:** none
- **Notes:** Inner SVG must use `fill="currentColor"`. Card Row's lead icon now uses `.icon-box.icon-box--md` (added 2026-05-04).

#### Notification Bar (iOS chrome)
- **Purpose:** Decorative iOS system status bar to frame mobile screen mockups.
- **Class:** `.status-bar`
- **Variants:** Single 360×44px component
- **Tokens:** 2 (`--status-bar-bg`, `--status-bar-time`)
- **Notes:** Time hardcoded "9:41". Status icons are `<img>` tags (NOT `.icon-holder`). Always first child of `.screen`.

#### Illustration Placeholder
- **Purpose:** Square frame reserving space for an illustration.
- **Class:** `.illustration-placeholder` + `--32/--40/--48/--64`
- **Tokens:** 2 (white bg, navy dashed border)
- **Notes:** Replace with actual asset when ready.

#### Divider
- **Purpose:** Thin separator line for grouping content.
- **Class:** `.divider` + `--strong/--dashed/--label/--inset/--vertical`
- **Tokens:** 3 (`--divider-color` grey-200, `--divider-color-strong` grey-400, `--divider-label-text` grey-500)
- **Notes:** Use `<hr>` for non-label horizontals, `<div>` for `--label`, `<span>` for `--vertical`. Figma hard rule: dashed lines via `strokeTopWeight + dashPattern` on the ComponentNode itself, never via child shape.

### 6.2 Buttons & Actions

#### Button
- **Purpose:** Primary interactive action element.
- **Class:** `.btn` (sub: `.btn__icon`, `.btn__loader`)
- **Variants:** Primary / Secondary / Ghost / Destructive / Stroke
- **Sizes:** SM (36px) / MD (44px) / LG (52px)
- **States:** Default / Hover / Pressed / Loading / Disabled / Focus
- **Tokens:** ~30 component tokens (`--btn-primary-fill`, `--btn-ring-primary`, `--btn-shine`, `--btn-pressed-inset`, …)
- **Typography:** SM=`.text-label-xs`, MD=`.text-label-md`, LG=`.text-label-lg`
- **Notes:** 3D "juicy" multi-shadow effect on all variants except Ghost. 60 Figma variants (4 × 3 × 5). Ghost text = `--text-primary` (navy-900), NOT `--text-on-action-secondary`. Stroke = outlined navy with 1.5px border. Focus uses inset 2px stroke (no external ring).

#### Icon Button
- **Purpose:** Compact circular pill button containing only an icon.
- **Class:** `.icon-btn`
- **Variants:** Tonal / Primary / Secondary / Ghost / Destructive
- **Sizes:** XS (24) / SM (32) / MD (40) / LG (48) — XS added 2026-04-24
- **States:** Default / Hover / Pressed / Focused / Disabled
- **Tokens:** 28 component tokens
- **Notes:** Always `--radius-pill`. `aria-label` mandatory. 100 Figma variants total. Effect tokens (shine, pressed-inset) are raw rgba — no semantic equivalent.

#### Link Button
- **Purpose:** Inline text + trailing caret — secondary in-content actions ("View all").
- **Class:** `.link-btn`
- **Variants:** `--info` (blue) / `--brand` (green) × `--sm/--md/--lg`
- **States:** Default / Hover / Focused / Disabled
- **Tokens:** 10 (`--link-btn-{variant}-text/-text-hover/-text-focused/-text-disabled/-focus-ring`)
- **Composes:** `.icon-holder` (xs/sm/md per size)
- **Typography:** SM=`.text-caption-sm-medium`, MD=`.text-body-sm`, LG=`.text-label-md-medium`
- **Notes:** No padding — pure content width. 4px gap. Hover darkens to info/700 or green/600. `--action-link-hover` semantic added 2026-04-07.

### 6.3 Form Inputs

#### Input Field
- **Purpose:** Single-line text input; supports label, helper/error, left/right icons, dial-code addon.
- **Class:** `.input` (sub: `__label`, `__wrapper`, `__field`, `__icon`, `__text`, `__helper`, `__error-message`, `__addon`)
- **States:** Empty / Active / Error / Disabled / Filled
- **Booleans/Props:** title, description, leftIcon, rightIcon, Left Addon
- **Tokens:** 23 `--input-*` (label, bg, wrapper, border, text, placeholder, icon, helper, error, addon)
- **Typography:** Label=`.text-body-xs`, input=`.text-body-md`
- **Notes:** Outer wrapper creates colored ring via 4px padding + bg color (no border on wrapper). Active state via `:focus-within`. Border-radius 8px on both wrapper and field.

#### Search / Chat Input
- **Purpose:** Pill-shaped input for search bars and chat entry.
- **Class:** `.search-input`
- **Variants:** Single layout (pill via `--radius-pill`)
- **States:** Default / Active / Error / Disabled / Filled
- **Tokens:** Reuses 21 `--input-*` tokens — no new collection
- **Notes:** Pill shape is non-negotiable. If rectangular needed, use `.input`.

#### Textarea Input
- **Purpose:** Multiline text input for the smart filter bottom sheet.
- **Class:** `.textarea-input`
- **States:** Default / Active / Error / Disabled / Filled
- **Tokens:** Reuses Input collection — no new vars
- **Notes:** Min-heights wrapper 104 / field 96 / textarea 72. `resize: none`. Rectangular `--radius-8`. No icons or addons (intentionally bare).

#### OTP Input
- **Purpose:** Grouped single-character digit boxes for one-time-password verification.
- **Class:** `.otp` (sub: `__digit-wrapper`, `__digit`, `__hint`, `__error-message`)
- **Variants:** 4-digit, 6-digit composites
- **States:** Default / Focus / Filled / Error / Disabled
- **Tokens:** 13 `--otp-*` + 3 label/assistive
- **Composes:** Button Ghost SM ("Resend OTP")
- **Notes:** 44×44px digits, 12px gap. Always `type="text"` + `inputmode="numeric"` (never `type="number"`).

#### Stepper
- **Purpose:** Quantity input with `−` and `+` buttons flanking a value.
- **Class:** `.stepper` (sub: `.stepper__field`, `.stepper__btn--dec/--inc`, `.stepper__value`)
- **Variants:** Default / Disabled
- **Tokens:** 8 `--stepper-*` (Figma collection `2235:3635`) — own collection aliasing semantic; CSS reuses `--input-*` directly
- **Notes:** Outer 52px (44 field + 4 padding). `aria-live="polite"` on value. Disable `dec` at min, `inc` at max — never hide.

#### Radio Button
- **Purpose:** Single-select control.
- **Class:** `.radio-control` / `.radio-item` / `.radio-item--boxed`
- **States:** Default / Hover / Focused / Selected / Selected Hover / Disabled / Disabled Selected
- **Tokens:** 28 `radio/*` + new semantic `--surface-selected` (navy-50)
- **Notes:** 16×16 control. Always wrap in `<label>`; native `<input>` hidden but accessible. CSS-driven via `:checked`/`:disabled`. Boxed v-padding bumped to 16px (2026-04-27).

#### Checkbox
- **Purpose:** Multi-select / toggle control.
- **Class:** `.checkbox-control` / `.checkbox-item` / `.checkbox-item--boxed`
- **States:** Default / Hover / Focused / Checked / Checked Hover / Disabled / Disabled Checked
- **Tokens:** ~30 `--checkbox-*`
- **Notes:** THREE nested spans required: `.checkbox-control > .checkbox-control__inner > .checkbox-control__check`. CheckFat Fill icon (12×12, currentColor). Figma gradients bound via `ColorStop.boundVariables.color`, NOT top-level paint.

#### Toggle
- **Purpose:** Binary on/off control.
- **Class:** `.toggle-control` / `.toggle-item`
- **States:** Off / On / Off Hover / On Hover / Off Focused / On Focused / Off Disabled / On Disabled
- **Tokens:** 16 `toggle/*`
- **Notes:** 40×24 outer with 32×16 track + 17×17 knob (1px taller than track for raised look). Spring transition `cubic-bezier(0.34, 1.56, 0.64, 1)`. Figma gotcha: `action/primary-hover` uses HYPHEN.

### 6.4 Status & Information

#### Label (Badge)
- **Purpose:** Compact status indicators inline with content.
- **Class:** `.label`
- **Variants:** 15 statuses × 3 sizes = 45 variants. Status modifiers: `--neutral`, `--success`, `--info`, `--warning`, `--error`, `--navy`, `--green`, `--teal`, `--steel-blue`, `--mint`, `--peach`, `--yellow`, `--coral`, `--purple`
- **Tokens:** 30 `lbl/*` (15 × bg+text)
- **Typography:** SM=`.text-label-xs`, MD=`.text-label-md`, LG=`.text-label-lg`
- **Notes:** Default bg = white (not grey-50). Per-size radius: SM=8 / MD=10 / LG=12. Icons use `currentColor`.

#### Chip
- **Purpose:** Pill tag for status/filter/category.
- **Class:** `.chip`
- **Variants:** 6 statuses × 3 sizes = 18
- **Tokens:** 17 `chip/*`
- **Notes:** `--radius-pill`. Selected has no border. Default border/text = navy-500 (not grey).

#### Chip Filter Bar
- **Purpose:** Horizontally scrollable filter row.
- **Class:** `.chip-filter` (container) + `.chip-tab` (item)
- **States:** off / on / hover / focused / disabled
- **Tokens:** 14 `chip-tab/*` × 2 modes (Light/Dark)
- **Notes:** `--radius-8` (NOT pill). 32px height. `.chip-filter--dark` inverts to white pill on navy-800.

#### Chip Tag
- **Purpose:** Selectable category tag with success-tinted selected state.
- **Class:** `.chip-tag` + `--selected/--disabled`
- **Tokens:** 11 `chip-tag/*` + new `--feedback-success-border` → success-200
- **Notes:** `--radius-pill`. Selected = success-50 bg + success-200 border + success-700 text.

#### Tag
- **Purpose:** Promotional ribbon-shaped badge ("Best Value", "New").
- **Class:** `.tag` + `--yellow/--green/--coral/--purple`
- **Tokens:** 13 (12 status × 3 + 1 highlight); 12 new palette tokens added 2026-04-29
- **Composes:** Icon Holder XS (default StarFour Fill)
- **Typography:** `.text-caption-sm-medium`
- **Notes:** Asymmetric radius — `--radius-pill` left, `0` right (ribbon shape). Dual-shadow emboss (no border). Canonical use: right-anchored absolutely on a card.

#### Avatar
- **Purpose:** Circular user representation.
- **Class:** `.avatar` (with size + selected/no-checkbox modifiers)
- **Variants:** 7 sizes (24/32/40/64/72/90/124) × 2 states = 14 variants
- **Tokens:** 4 `--avatar-*` (bg, icon, ring, ring-default)
- **Composes:** Checkbox Control (badge top-right)
- **Notes:** 2026-04-30 refactor — ring is 2px INSIDE border on `.avatar__circle`. `box-sizing: border-box` keeps outer diameter constant. Always include `.avatar__check` in DOM; use `--no-checkbox` to hide.

#### Avatar Stack
- **Purpose:** Horizontal row of overlapping avatars.
- **Class:** `.avatar-stack` + size + count
- **Variants:** 4 sizes × 3 count states (2 / 3 / 3+) = 12
- **Booleans/Props:** `prop3rd`, `prop3` (mutually exclusive)
- **Tokens:** 3 (ring white, overflow-bg grey-100, overflow-text grey-500)
- **Composes:** Avatar `--no-checkbox` only
- **Notes:** 2px white separator ring. Overlap per size: 6/8/10/16px. Don't use `--selected` inside (ring conflicts).

### 6.5 Surfaces & Containers

#### Card
- **Purpose:** General-purpose surface container.
- **Class:** `.card` (sub: `.card__slot`)
- **Tokens:** 3 (`--card-bg`, `--card-border`, `--card-shadow`)
- **Notes:** 1px border, `--radius-12`, 12px padding, `--shadow-low`. `overflow: hidden`. Don't nest cards.

#### Card Section
- **Purpose:** Layout wrapper grouping card-row / card-tile children under an optional header.
- **Class:** `.card-section` + `--tinted`
- **Booleans/Props:** Header, Action
- **Tokens:** 4 (`--card-section-title`, `-action`, `-bg`, `-border`)
- **Notes:** Default = transparent. Tinted = green-50 bg + grey-200 border + radius-12 + 16px padding. Omit header/action elements from DOM when unused.

#### Card Row
- **Purpose:** Horizontal info card — icon + title + value + description + slot + chevron.
- **Class:** `.card-row` + `--white`
- **States:** Default / Hover / Pressed / Focused / Disabled
- **Booleans/Props:** Icon, Value, Description, Slot, Chevron (5 props, all default true)
- **Tokens:** 18 `card-row/*`
- **Composes:** **`.icon-box.icon-box--md`** wrapping `.icon-holder.icon-holder--md` (lead — 32×32 brand-tinted square; added 2026-05-04). Plain `.icon-holder--md` for chevron.
- **Typography:** Title=`.text-title-xs`, value=`.text-label-md`, desc=`.text-caption-md`
- **Notes:** Default = green-50 bg (Tinted). 16px padding, `--radius-12`. Focused uses 2px green border. `--surface-brand-hover` semantic introduced for hover.

#### Card Tile
- **Purpose:** Vertical compact tile with icon + label + optional value badge — for factor cards, horizontal scroll grids.
- **Class:** `.card-tile` (sub: `__label`, `__badge`, `__badge-text`)
- **States:** Default / Hover / Pressed / Focused / Disabled
- **Booleans/Props:** Value (default on)
- **Tokens:** 13 `card-tile/*`
- **Composes:** `.icon-holder--md`
- **Typography:** Label=`.text-label-xs`, badge=`.text-caption-sm-bold`
- **Notes:** Min-width 104px. Badge uses `feedback/success-bg` + `feedback/success`. Designed for `gap: 8px` horizontal scroll containers.

#### Hospital Row
- **Purpose:** Network hospital list item — logo + name + cashless badge + location + map-pin.
- **Class:** `.hospital-row`
- **States:** Default / Hover / Pressed / Focused / Disabled
- **Booleans/Props:** Cashless (default on)
- **Tokens:** 13 `hospital-row/*`
- **Composes:** `.illustration-placeholder--40` (logo), `.label.label--success` (cashless), `.icon-holder--lg` (MapPin)
- **Notes:** Bottom-border-only divider. Disabled dims text + icon + illustration at 40% opacity.

#### List Item
- **Purpose:** Flexible row primitive for content lists (lighter than card-row / hospital-row).
- **Class:** `.list-item` + `--interactive/--highlight/--divided`
- **States:** Default / Hover / Pressed / Focused / Disabled / Highlight (6 Figma states)
- **Booleans/Props:** Lead, Description, Meta, Trail, Divider
- **Tokens:** 9 `list-item/*`
- **Typography:** Title=`.text-title-xs`, desc=`.text-caption-md`, meta=`.text-caption-sm-medium`
- **Notes:** Variable height (hugs content). Static by default — opt into hover/pressed/focus via `--interactive`. Lives ALONGSIDE card-row + hospital-row (does NOT replace).

#### Price Row
- **Purpose:** Read-only label-and-amount row for billing breakdowns.
- **Class:** `.price-row` + `--total/--divided`
- **States:** Item / Total
- **Booleans/Props:** Description, Sub-amount, Divider
- **Tokens:** 7 `price-row/*`
- **Typography:** Item label=`.text-body-md`, Total label=`.text-title-sm`, amount=`.text-title-sm`
- **Notes:** Total = green-100 bg + brand-green amount. Use minus/plus glyphs in amount text (`−₹638`, `+₹2,185`). NOT interactive — use `.list-item` for clickable rows.

#### Stats Strip ⚠️ PROVISIONAL
- **Purpose:** 3-column meta strip for dark navy header tops (e.g. policy detail).
- **Class:** `.stats-strip` (sub: `__col`, `__label`, `__value`, `__value--link`)
- **Variants:** Trigger / Static / Link (Figma column types)
- **Tokens:** 3 Figma (`stats-strip/label/value/icon`) + 5 CSS-only (`--stats-strip-padding/-gap/-label-color/-value-color/-icon-color`)
- **Composes:** `.icon-holder--xs`
- **Typography:** Label=`.text-caption-sm-medium`, value=`.text-title-sm`
- **Notes:** PROVISIONAL — no Tint variant; accent colors per-instance via `--stats-strip-value-color` override (currently aliasing primitives). Revisit needed.


### 6.6 Navigation & Chrome

#### Header
- **Purpose:** Full-width top navigation bar across every screen.
- **Class:** `.top-nav` + `--dark/--transparent`
- **Variants:** Single COMPONENT (no variant axes); driven by 10 boolean/swap properties + 2 variable modes (Light / Dark)
- **Booleans/Props:** Background, Show Title, Logo Mode, Show Subtitle, Left Avatar, Icon Left (instance swap: Back/Close/Menu/None), Right Icon, Right 2nd Icon, Right CTA, Right Avatar
- **Tokens:** 6 (`--header-bg/-title/-subtitle/-icon/-cta/-logo`) — 2 modes Light/Dark
- **Composes:** Avatar-40 (left), Avatar-32 (right), Button Ghost SM (CTA), Icon Holder LG (icon-btn)
- **Typography:** Title=14 SemiBold, subtitle=12 Regular, logo=20 Bold green
- **Notes:** Flex row layout (no absolute positioning). 56px mobile / 64px tablet / 72px desktop / 48px FHD padding. Always include all 3 slot wrappers even if empty. CTA always `.btn.btn--ghost.btn--sm.top-nav__cta`. Dark logo stays green. Rebuilt 2026-03-27 from a 5-variant set to a single component with boolean props.

#### Footer Dock
- **Purpose:** Persistent bottom action area on mobile.
- **Class:** `.footer-dock` + `--flat/--bordered/--elevated/--floating`
- **Variants:** 4 styles × 3 layouts (Single / Dual / Stacked) × optional infoText
- **Tokens:** 4 (`--footer-dock-bg`, `-border`, `-helper-text`, `-shadow-elevated`)
- **Composes:** Button (Primary LG/MD, Stroke MD, Ghost)
- **Typography:** Helper=`.text-body-sm`
- **Notes:** Single = Primary LG full-width. Dual = Stroke MD + Primary MD equal-width. Stacked = Primary LG + Ghost below. `--floating` has no container styling. Upward shadow `0 -4px 12px rgba(26,38,59,0.08)` (no semantic equivalent).

#### Price Footer
- **Purpose:** Bottom-of-screen bar showing price summary + primary proceed CTA.
- **Class:** `.price-footer`
- **Tokens:** 6 `price-footer/*`
- **Composes:** Icon Holder XS (CaretDown), Button Primary MD
- **Typography:** Label=`.text-caption-sm-bold`, price=`.text-title-lg`, CTA=`.text-label-md`
- **Notes:** Same upward shadow as Footer Dock. 12/16/24 padding. 20×20 circular breakdown button.

#### Pagination
- **Purpose:** Numbered page navigation + mobile carousel dot indicator.
- **Class:** `.pagination` (`__item`, `__ellipsis`, `__icon`); `.pagination-dots` (`__dot`)
- **States:** Default / Hover / Active / Disabled / Focus (Item); Active / Inactive (Dot)
- **Tokens:** 17 `--pagination-*` + 2 dot tokens (new semantics: `--surface-dot-active` navy-700, `--surface-dot-inactive` navy-300)
- **Notes:** 36×36 squares with `--radius-8`. Active = green-500 bg + white text. Dot indicator: 24×4 active pill + 4×4 inactive circles, 4px gap. `aria-current="page"` on active item.

#### Segmented Tab
- **Purpose:** Pill segmented control for switching between 2–4 mutually exclusive views.
- **Class:** `.tab-control` + `.tab-item` (with `--active/--disabled`)
- **States:** Default / Hover / Active / Disabled
- **Tokens:** 11 `tab/*`
- **Notes:** Container is `display: inline-flex` (wraps content). Active = white bg + green border + green text. Active inner shadow `0 1px 2px 1px rgba(26,38,59,0.08)` (navy tint). Limit to 2–4 segments.

#### Filter Tab
- **Purpose:** Vertical sidebar tab item used inside the Filter Bottom Sheet's tab rail.
- **Class:** `.filter-tab`
- **States:** Default / Active / Pressed / Disabled / Hover / Focused
- **Tokens:** 11 `filter-tab/*`
- **Notes:** Fixed 120 × 42px. Left indicator via `box-shadow: inset 2px 0 0 0` (avoids layout shift). Purpose-built for Filter Bottom Sheet — don't use elsewhere.

#### Filter Bar
- **Purpose:** Persistent dual-action pill bar (Smart filter left, Filters right) on plan listing screens.
- **Class:** `.filter-bar`
- **States:** 8 Figma variants — State × Active Side
- **Tokens:** 7 (`--filter-bar-bg`, `-side-bg-hover`, `-side-bg-pressed`, `-text`, `-icon`, `-divider`, `-focus-ring`)
- **Notes:** `--radius-pill`, 45px height, navy-800 base. Introduced `--surface-inverse-hover` (navy-700) for hover. Order is fixed: left = Smart filter, right = Filters.

#### Heading
- **Purpose:** Full-width section header row with title + optional description + icon + CTA.
- **Class:** `.heading`
- **Variants:** Sizes Large / Primary / Secondary (HTML-side text class change)
- **Booleans/Props:** Description, Icon, Button
- **Tokens:** 3 (`--heading-title/-desc/-cta`)
- **Composes:** `.icon-holder--md` (Large/Primary) or `--sm` (Secondary); CTA = `.btn.btn--ghost.btn--sm`
- **Typography:** Large=`.text-title-md`, Primary=`.text-title-sm`, Secondary=`.text-title-xs`; description=`.text-body-sm`
- **Notes:** No CSS size modifier — swap title's text class. CTA always `.btn--ghost--sm`.

### 6.7 Overlays & Surfaces

#### Modal
- **Purpose:** Center-anchored overlay panel for confirmations + focused tasks (mobile-only v1).
- **Class:** `.modal-overlay` / `.modal` / `.modal__content`
- **Booleans/Props:** Footer (default true) toggles Footer Dock; Slot (Figma SLOT) for body
- **Tokens:** 3 (`--modal-overlay` → overlay/65, `--modal-bg`, `--modal-border`)
- **Composes:** Header (`2413:68695`) + Footer Dock (default Style=Flat, Layout=Dual)
- **Notes:** Fixed 328px width, max-height 90vh, `--radius-16`. **Hard rule override:** `.modal .top-nav { padding: 0 var(--spacing-16) }` neutralises Header's responsive padding. No animation, no a11y wrapper in v1 (use `role="dialog"` + `aria-modal="true"` in markup).

#### Bottom Sheet
- **Purpose:** Modal panel that slides up from the bottom over a dark scrim.
- **Class:** `.bottom-sheet-overlay` / `.bottom-sheet` / `.bottom-sheet__content`
- **Booleans/Props:** footer (default true)
- **Tokens:** 3 (`--bottom-sheet-overlay` → overlay/65, `-bg`, `-border`)
- **Composes:** Header + Footer Dock
- **Notes:** Width responsive (100% mobile → 480/560/640px tablet/desktop/FHD). Max-height 90vh. Right close-icon-btn = XS; left back-button stays MD.

#### Popover
- **Purpose:** Slot-based floating panel for dropdowns, action menus, info bubbles.
- **Class:** `.popover` (sub: `.popover__slot`)
- **Tokens:** 2 Figma (`popover/bg`, `popover/border`); CSS adds `--popover-shadow` → `--shadow-medium`
- **Composes:** open slot — designed to host card-row, checkbox-item, radio-item, divider, search-input, etc.
- **Notes:** No padding (children carry their own). `overflow: hidden`. No built-in positioning. Don't nest popovers.

#### Tooltip
- **Purpose:** Speech bubble for in-app messages or contextual guidance.
- **Class:** `.tooltip` + 6 tail modifiers
- **Variants:** 6 tail positions (top-left, top-right, down-left, down-right, right, left)
- **Booleans/Props:** Tail (6 values), Icon
- **Tokens:** 3 (`--tooltip-bg` → `--surface-brand-inverse` green-800, `--tooltip-text` → white, `--tooltip-icon` → white)
- **Typography:** Heading=`.text-label-xs`, body=`.text-body-xs`
- **Notes:** Renamed from "Chat Bubble" 2026-04-28 (pure rename — design unchanged). Body padding 8, gap 8, max-width 200px, `--radius-16`.

#### Alert
- **Purpose:** Persistent in-page status messaging (regulatory, claim status, validation, payment errors).
- **Class:** `.alert` + `--info/--success/--warning/--error`
- **Booleans/Props:** Icon (default true), Heading, Dismiss, Slot, Action
- **Tokens:** 17 `alert/*`. 3 NEW semantic borders added: `--feedback-info-border`, `--feedback-warning-border`, `--feedback-error-border`
- **Composes:** Icon Holder MD, Icon Button XS Ghost (dismiss), Link Button Info SM (action)
- **Typography:** Heading=`.text-title-xs`, message=`.text-body-sm`
- **Notes:** REPLACES the deprecated old Toast (deleted 2026-04-29). Heading + dismiss inline in `.alert__row`; message + slot + action stack below. Body always `--text-primary` (legibility). Action stays info-blue regardless of status.

#### Toast (NEW — transient floating)
- **Purpose:** Transient floating pill notification (saved, deleted, network error).
- **Class:** `.toast` + `--neutral/--success/--error/--warning/--info`; host `.toast-host`
- **Booleans/Props:** Avatar (off, XOR with Icon), Icon, Description, Dismiss
- **Tokens:** 7 `toast/*`. 2 NEW semantic tokens: `--feedback-error-bg-emphasis` (error/700), `--feedback-warning-bg-emphasis` (warning/700)
- **Composes:** Avatar-32 OR Icon Holder MD (mutually exclusive); Icon Holder MD inside `<button>` for dismiss
- **Typography:** Title=`.text-label-md-medium`, description=`.text-body-sm`
- **Notes:** Pill-shaped (`--radius-pill`), auto-width. Bottom-center positioned via `.toast-host`. Distinct from Alert (inline persistent). HARD: never both Avatar and Icon true.

#### Accordion
- **Purpose:** Expandable Q&A row for FAQs and disclosure panels.
- **Class:** `.accordion` (sub: `__header`, `__question`, `__icon`, `__body`, `__answer`, `__slot`) + `--closed`
- **Variants:** Default (answer text) / Slot (custom content)
- **Tokens:** 3 (`--accordion-border/-question/-answer`)
- **Composes:** Icon Holder MD (CaretDown — rotates -90° when closed)
- **Typography:** Question=`.text-title-xs`, answer=`.text-body-xs`
- **Notes:** Bottom border only. Vertical 12px padding only. Slot variant accepts any component.

### 6.8 Specialized & Composite

#### Comparison Table
- **Purpose:** Flexible 2/3/4-column grid for side-by-side comparisons.
- **Class:** `.comp-table` + `--cols-2/-3/-4/--rounded/--bordered`; cell `.comp-table__cell` + 7 type modifiers (`--header/--content/--action/--value/--indicator/--slot/--empty`) × 15 tint modifiers
- **Variants:** 49 Figma variants (7 Type × 7 Tint); 8 palette tints applied via instance fill rebind (not Figma variants)
- **Tokens:** 32 `comp-table/*` (4 invariants + 14 bg + 14 header-text)
- **Composes:** Icon Holder MD/LG, Link Button Info MD
- **Typography:** Header=`.text-overline-md`, content title=`.text-title-md`, value=`.text-title-md`, body=`.text-body-md`
- **Notes:** Dividers via wrapper `display: grid; gap: 1px; background: var(--comp-table-border)` (gap-as-divider trick). Restructured 2026-05-04 from 15 modes × 6 vars → 1 mode × 32 vars (Label-style) due to Figma 10-mode cap. CSS surface unchanged.

#### Menu / Menu Item
- **Purpose:** Vertical list of actionable items inside a popover/sheet (action menus, kebab menus, select dropdowns).
- **Class:** `.menu` (sub: `.menu__item`, `__lead`, `__label`, `__trail`, `__group-label`, `__header`, `__footer`, `__empty`)
- **Variants:** Sizes `--sm` (40px) / `--md` (48px); CSS modifiers `--destructive/--selected`
- **States:** Default / Hover / Pressed / Focused / Disabled / Selected (6 Figma states)
- **Booleans/Props:** Icon (default true), Trailing (default true), Multi (Checkbox in lead), Radio (Radio in lead)
- **Tokens:** 8 Figma + 4 CSS-only = 12
- **Composes:** Icon Holder MD (lead + trail), Checkbox Control / Radio Control (Multi/Radio), Search Input + Button (Select recipes), Divider
- **Notes:** Both leading and trailing icon-holders are `--md` (20px) to match `.text-body-md` line-height. Default trailing Atom = CaretRight. Don't combine `--destructive` and `--selected`. Critical Figma render gotcha: bound paint fallback color must be set to resolved RGBA to avoid black-render bug.

#### Date Picker
- **Purpose:** Single-date calendar picker inside a popover with Calendar / Month / Year views.
- **Class:** `.date-picker` (sub: `__header`, `__weekdays`, `__weekday`, `__grid`, `__grid--month/--year`); cell `.date-cell`
- **Variants:** Cell modifiers `--today/--selected/--outside-month`; grid `--month/--year`
- **States:** Default / Today / Selected / Disabled / OutsideMonth (5 cell variants)
- **Tokens:** 10 (7 cell-level + 3 chrome)
- **Composes:** Popover host; Button Ghost MD (header title with PencilSimpleLine); Icon Button Ghost MD (prev/next); Icon Holder MD
- **Typography:** Title=`.text-title-sm`, weekdays + cells=`.text-label-md-medium`
- **Notes:** Cell master 40×40 with `--radius-8`. Month/Year cells reuse same primitive resized to 72×40 in 4-col grids. Today = 1px green ring; Selected = full green fill + white text. v1 single-date only — range deferred.

#### Chatbox
- **Purpose:** Chat thread message bubble for the Kinko AI assistant.
- **Class:** `.chatbox` + `--ai/--user/--follow-ups`
- **Booleans/Props:** Ai CTA (default true)
- **Tokens:** 5 `chat-msg/*` (Figma collection name "Chat Message"; CSS prefix `chatbox`)
- **Composes:** Button Ghost SM (CTA — never one-off styled link), Chip Info (follow-up suggestions), Icon Holder
- **Typography:** Body=`.text-body-sm`, time=`.text-caption-sm-medium`
- **Notes:** Asymmetric tail radius — AI/Follow-ups 12/12/12/2 (bottom-left tail), User 12/12/2/12 (bottom-right tail). Container clipped (`overflow: hidden`) so bubble + CTA strip share one rounded shape. Bubble max-width 88%.

#### Progress Bar
- **Purpose:** Linear progress indicator for onboarding, form completion, uploads, claim processing.
- **Class:** `.progress` (sub: `.progress__fill`) + `--disabled`
- **Tokens:** 6 (no own Figma variable collection — fills bound directly to semantic tokens)
- **Notes:** 8px height, `--radius-pill`. Fill % via inline `style="width: 60%"`. 0.3s transition. Always include `role="progressbar"` + `aria-valuenow/min/max`. Don't use as a step indicator.

### 6.9 Component Inventory Summary

| # | Component | Class | Spec | CSS | Figma Collection | Tokens | Status |
|---|---|---|---|---|---|---|---|
| 1 | Button | `.btn` | components/button.md | css/button.css | `2188:2440` | 31 | ✅ |
| 2 | Input | `.input` | components/input.md | css/input.css | `2225:3238` | 23 | ✅ |
| 3 | Search Input | `.search-input` | components/search-input.md | css/search-input.css | reuses Input | 0 | ✅ |
| 4 | Textarea Input | `.textarea-input` | components/textarea-input.md | css/textarea-input.css | reuses Input | 0 | ✅ |
| 5 | OTP | `.otp` | components/otp.md | css/otp.css | `2229:3354` | 13+3 | ✅ |
| 6 | Label | `.label` | components/label.md | css/label.css | `2232:3593` | 30 | ✅ |
| 7 | Radio | `.radio-item` `.radio-control` | components/radio.md | css/radio.css | `2235:3605` | 28 | ✅ |
| 8 | Stepper | `.stepper` | components/stepper.md | css/stepper.css | `2235:3635` | 8 | ✅ |
| 9 | Chip | `.chip` | components/chip.md | css/chip.css | `2235:3707` | 17 | ✅ |
| 10 | Chip Filter | `.chip-filter` `.chip-tab` | components/chip-filter.md | css/chip-filter.css | `2423:77649` | 14 | ✅ |
| 11 | Chip Tag | `.chip-tag` | components/chip-tag.md | css/chip-tag.css | `2519:179` | 11 | ✅ |
| 12 | Tag | `.tag` | components/tag.md | css/tag.css | `3253:8` | 13 | ✅ |
| 13 | Segmented Tab | `.tab-control` `.tab-item` | components/tab.md | css/tab.css | `2237:3737` | 11 | ✅ |
| 14 | Checkbox | `.checkbox-item` `.checkbox-control` | components/checkbox.md | css/checkbox.css | `2237:3789` | 30 | ✅ |
| 15 | Toggle | `.toggle-item` `.toggle-control` | components/toggle.md | css/toggle.css | `2257:4364` | 16 | ✅ |
| 16 | Pagination | `.pagination` `.pagination-dots` | components/pagination.md | css/pagination.css | `2261:4427` | 17 | ✅ |
| 17 | Avatar | `.avatar` | components/avatar.md | css/avatar.css | `2269:5271` | 4 | ✅ |
| 18 | Avatar Stack | `.avatar-stack` | components/avatar-stack.md | css/avatar-stack.css | `2384:67969` | 3 | ✅ |
| 19 | Divider | `.divider` | components/divider.md | css/divider.css | `2270:5425` | 3 | ✅ |
| 20 | Header | `.top-nav` | components/header.md | css/header.css | `2272:5449` (2 modes) | 6 | ✅ |
| 21 | Footer Dock | `.footer-dock` | components/footer-dock.md | css/footer-dock.css | TBD | 4 | ✅ |
| 22 | Price Footer | `.price-footer` | components/price-footer.md | css/price-footer.css | `3026:5747` | 6 | ✅ |
| 23 | Tooltip | `.tooltip` | components/tooltip.md | css/tooltip.css | `2346:67237` | 3 | ✅ |
| 24 | Card | `.card` | components/card.md | css/card.css | `2388:68089` | 2 | ✅ |
| 25 | Card Section | `.card-section` | components/card-section.md | css/card-section.css | `2636:185` | 4 | ✅ |
| 26 | Card Row | `.card-row` | components/card-row.md | css/card-row.css | `2607:83` | 18 | ✅ |
| 27 | Card Tile | `.card-tile` | components/card-tile.md | css/card-tile.css | `2630:175` | 13 | ✅ |
| 28 | Hospital Row | `.hospital-row` | components/hospital-row.md | css/hospital-row.css | `2944:8` | 13 | ✅ |
| 29 | List Item | `.list-item` | components/list-item.md | css/list-item.css | `3152:9` | 9 | ✅ |
| 30 | Price Row | `.price-row` | components/price-row.md | css/price-row.css | `3160:8` | 7 | ✅ |
| 31 | Stats Strip | `.stats-strip` | components/stats-strip.md | css/stats-strip.css | `3331:6228` | 3+5 | ⚠️ provisional |
| 32 | Alert | `.alert` | components/alert.md | css/alert.css | `3170:8` | 17 | ✅ |
| 33 | Toast | `.toast` | components/toast.md | css/toast.css | `3286:9` | 7 | ✅ |
| 34 | Modal | `.modal` `.modal-overlay` | components/modal.md | css/modal.css | `3226:9` | 3 | ✅ |
| 35 | Bottom Sheet | `.bottom-sheet` | components/bottom-sheet.md | css/bottom-sheet.css | `2444:82024` | 3 | ✅ |
| 36 | Popover | `.popover` | components/popover.md | css/popover.css | `3085:8` | 2 | ✅ |
| 37 | Menu / Menu Item | `.menu` `.menu__item` | components/menu.md | css/menu.css | `3095:8` | 12 | ✅ |
| 38 | Date Picker | `.date-picker` `.date-cell` | components/date-picker.md | css/date-picker.css | `3134:217` | 10 | ✅ |
| 39 | Chatbox | `.chatbox` | components/chatbox.md | css/chatbox.css | `2908:8` | 5 | ✅ |
| 40 | Icon Button | `.icon-btn` | components/icon-button.md | css/icon-button.css | `2433:80122` | 28 | ✅ |
| 41 | Link Button | `.link-btn` | components/link-button.md | css/link-button.css | `2691:4079` | 10 | ✅ |
| 42 | Heading | `.heading` | components/heading.md | css/heading.css | `2707:8` | 3 | ✅ |
| 43 | Filter Tab | `.filter-tab` | components/filter-tab.md | css/filter-tab.css | `2457:83972` | 11 | ✅ |
| 44 | Filter Bar | `.filter-bar` | components/filter-bar.md | css/filter-bar.css | `2468:84320` | 7 | ✅ |
| 45 | Comparison Table | `.comp-table` | components/comp-table.md | css/comp-table.css | `3038:8` | 32 | ✅ |
| 46 | Progress Bar | `.progress` | components/progress-bar.md | css/progress-bar.css | none | 6 | ✅ |
| 47 | Icon Holder | `.icon-holder` | components/icon-holder.md | css/icon-holder.css | `2670:2455` | 4 | ✅ |
| 48 | Icon Box | `.icon-box` | components/icon-box.md | css/icon-box.css | `3344:6775` | 2+12 | ✅ |
| 49 | Status Bar | `.status-bar` | components/notification-bar.md | css/notification-bar.css | none | 2 | ✅ |
| 50 | Illustration Placeholder | `.illustration-placeholder` | components/illustration-placeholder.md | css/illustration-placeholder.css | none | 2 | ✅ |
| 51 | Accordion | `.accordion` | components/accordion.md | css/accordion.css | none | 3 | ✅ |


---

## 7. Patterns

Higher-order compositions documented in component specs and `MEMORY.md`. Not yet centralised in a `patterns/` directory.

### 7.1 Select dropdown (composed, not a separate component)

**Decision:** Select is composed from Menu + Checkbox/Radio + Search Input + Button — no new "Select" component.

| Recipe | Composition |
|---|---|
| **Single-select** | `.popover` → `.menu` → `.menu__item` rows; selected row uses `.menu__item--selected` |
| **Multi-select** | `.popover` → `.menu` (with `.checkbox-control` in `.menu__item__lead`, Figma `Multi=true`) → `.menu__footer` with Apply/Clear buttons |
| **Searchable** | `.popover` → `.menu__header` containing `.search-input` + `.divider` → menu items |
| **Radio single-select** | `.popover` → `.menu` (with `.radio-control` in `.menu__item__lead`, Figma `Radio=true`) |
| **Empty state** | `.menu__empty` for no-results placeholder |

Documented at `components/menu.md` — Recipe A/B/C/D demo frames live in Figma.

### 7.2 Billing summary (Bottom Sheet)

**Components:** `.bottom-sheet` → `.list-item` (header rows) → `.price-row` instances:

```
Base premium               ₹15,000           ← .price-row (Item)
GST                        +₹2,700           ← .price-row (Item, +amount)
Discount                   −₹638              ← .price-row (Item, −amount)
─────────────────────────────────────────── ← .price-row--divided
Annual Total              ₹17,062            ← .price-row--total
```

### 7.3 Tag-on-card (promotional ribbon)

`.tag` is right-anchored absolutely on a card via parent `position: relative` + `right: 0`. Asymmetric radius (pill left, flat right) makes it appear to tuck into the card corner. See `tag-test.html` for demo.

### 7.4 Filter Bottom Sheet (vertical tab rail)

`.bottom-sheet` → `.filter-tab-rail` (vertical column of `.filter-tab` items) → main content panel. Filter Tab is purpose-built for this pattern only.

### 7.5 Login / Onboarding flow

`screens/login-flow.html` and `screens/onboarding-prototype.html` chain multiple `.screen-view` panels. Each screen has Status Bar → Header → Content (sections / forms / illustrations) → Footer Dock pattern.

### 7.6 Comparison Table templates

3 reference templates at fixed Figma node IDs:
- 2-col reference (What's Good vs Limitation): `3043:22` — Brand + Peach palette-rebind
- 3-col plan comparison: `3045:88`
- 4-col feature matrix: `3045:169`

### 7.7 Dark navy header section

Pattern using `.top-nav--dark` + `.stats-strip` (3 columns) on top of policy detail screens. Stats Strip column accents (success-200, purple-200, info-300) override `--stats-strip-value-color`.

---

## 8. Screens / Examples

### 8.1 Production-style flows (in `screens/`)

| File | Lines | Demonstrates | Notes |
|---|---|---|---|
| `login-flow.html` | 2057 | Multi-screen login + verification flow (13 distinct `.screen-view` panels) | Clickable prototype with `.mock-btn` helpers |
| `onboarding-prototype.html` | 1433 | Multi-screen onboarding (Login/Signup → Verification → Care Circle selection) | iOS chrome, `.is-selected`/`.is-filled` state classes, custom `.c-member`/`.c-ring` |

### 8.2 Component demo pages (in `screens/`)

| File | Lines | Demonstrates |
|---|---|---|
| `avatar-stack-test.html` | 187 | Avatar Stack — sizes × counts grid |
| `chatbox-test.html` | 100 | Chatbox — 3 variants (AI / User / Follow-ups) |
| `chip-tag-test.html` | 81 | Chip Tag states |
| `comp-table-test.html` | 447 | Comparison Table — every cell type × every tint × 2/3/4-col |
| `component-audit-test.html` | 231 | Multi-component sanity sheet (stepper, illustration-placeholder, accordion, status-bar) |
| `toast-test.html` | 155 | Toast — 5 status variants × dismiss/avatar/icon booleans |

### 8.3 Project-root component demos

`alert-test.html`, `button-test.html`, `date-picker-test.html`, `filter-bar-test.html`, `icon-button-test.html`, `list-item-test.html`, `menu-test.html`, `modal-test.html`, `tag-test.html`, `tooltip-test.html`. Plus `docs.html` (in-progress documentation site).

### 8.4 Coverage gaps

Screens covered: Login, Onboarding. Not yet built as full screens:
- Plan listing
- Plan detail / policy detail (uses Stats Strip placeholder)
- Claim flow
- Document/dashboard pages
- Settings / profile

---

## 9. Accessibility

### 9.1 Stated targets

- **WCAG AA touch targets** (48px min) — observed in Button MD (44px is below target; LG is 52px). Icon Button XS (24px) and SM (32px) are below WCAG AA — flagged for use only in toolbars where space is constrained.
- `aria-label` mandatory on Icon Button.
- `aria-live="polite"` on Stepper value.
- `role="progressbar"` + `aria-valuenow/min/max` on Progress Bar.
- `role="dialog"` + `aria-modal="true"` on Modal markup (handled at screen level).

### 9.2 Focus-visible strategy

Components use `:focus-visible` pseudo-class (not `:focus`) so focus rings only appear during keyboard navigation. Examples:
- Button: 2px inset stroke (no external ring)
- Card Row / Card Tile / Hospital Row / List Item: 2px green border
- Icon Button: green ring per variant
- Filter Tab: inset box-shadow indicator

### 9.3 Keyboard navigation

Native semantics used throughout — `<button>` for actions, `<input type="radio/checkbox">` (visually hidden but accessible), `<a>` for links. No custom tab-order management documented.

### 9.4 Screen-reader patterns

- Live regions: Stepper value (`aria-live="polite"`).
- Landmarks: implicit via `<nav>`, `<main>`, `<header>` in screen wrappers (not enforced systematically).
- Decorative icons: notification bar status icons use `alt=""`.

### 9.5 Color contrast audit

**Not formally conducted.** See [§4.1](#41-color) spot-check table. `text-tertiary` (grey-300) at 2.4:1 falls below WCAG AA — acceptable for placeholder text only.

### 9.6 Reduced motion

**Outstanding gap.** No `@media (prefers-reduced-motion)` blocks observed. Toggle's spring transition, Accordion expand, Progress Bar fill animation, and Button press-down should respect this preference.

### 9.7 Outstanding issues

- Icon Button XS (24px) and SM (32px) below WCAG AA touch target.
- Reduced-motion not implemented.
- Formal contrast audit not run.
- No screen-reader testing matrix in repo.

---

## 10. Responsiveness

### 10.1 Breakpoints

```css
Mobile  → default (390px iPhone reference)
Tablet  → @media (min-width: 768px)
Desktop → @media (min-width: 1280px)
FHD     → @media (min-width: 1920px)
```

### 10.2 Approach

**Mobile-first.** Default styles target 390px; tablet/desktop/FHD overrides cascade upward via `min-width` media queries.

### 10.3 Component-level responsiveness

| Component | Mobile | Tablet | Desktop | FHD |
|---|---|---|---|---|
| Header padding | 16px | 24px | 32px | 48px |
| Bottom Sheet width | 100% | 480px | 560px | 640px |
| Top Nav height | 56px | 64px | 72px | (unchanged) |
| Screen content max-width | 100% | (constrained) | (constrained) | wider variant |

### 10.4 Screen wrappers

```html
<div class="screen">                  ← mobile
<div class="screen screen--tablet">   ← side-nav appears
<div class="screen screen--desktop">  ← expanded side-nav
<div class="screen screen--fhd">      ← wider content + side-nav
```

### 10.5 Container queries

**Not used.** All responsive logic is media-query driven on the screen wrapper.

---

## 11. Conventions

### 11.1 File naming

- Components: kebab-case directory and file names (`card-row.md`, `card-row.css`).
- Tokens: lowercase single word (`colors.css`, `spacing.css`).
- Screens: kebab-case (`login-flow.html`, `onboarding-prototype.html`).
- One file per concern — no multi-component files.

### 11.2 CSS naming (BEM-flavored)

- **Block:** `.card-row`
- **Element:** `.card-row__title` (double underscore)
- **Modifier:** `.card-row--white`, `.card-row--disabled` (double dash)
- **State (interactive):** uses CSS pseudo-classes (`:hover`, `:active`, `:focus-visible`, `:disabled`) for runtime states; modifier classes (`.is-selected`, `.is-filled`, `.is-loading`) for stateful overrides like in Onboarding.

### 11.3 Class prefixes

Every component uses its name as the class prefix — no namespace prefix (no `kds-*` etc.). This is intentional: the global cascade owns the design system and there's no third-party CSS to collide with.

### 11.4 Variable naming

- Primitives: `--color-{family}-{shade}` / `--spacing-{step}` / `--radius-{step}`
- Semantic: `--{group}-{role}[-{state}]` (no prefix beyond group)
- Component: `--{component-name}-{role}[-{state/variant}]` (e.g. `--btn-primary-fill-pressed`)

### 11.5 Commenting

Each CSS file opens with a banner comment listing component name, spec path, Figma node ID, variants/states. Section dividers use the form `/* ── 1. Section name ── */`.

### 11.6 Figma variable naming

- Slash-nested: `palette/yellow/bg-strong`, `surface/brand-hover`
- Mode-aware collections (Header, Chip Filter) use 2 modes (Light, Dark)
- Single-mode collections use mode "Default"

### 11.7 Branch / commit conventions

Not enforced in this repository (no `.gitignore` or git config visible). Project uses plain markdown changelog at `references/changelog.md`.

### 11.8 Linting / formatting

No `.editorconfig` / `.prettierrc` / `stylelint.config.js` observed. Style is enforced via the 5 enforcer skills (kinko-text-style-enforcer, color-enforcer, spacing-enforcer, component-enforcer, layout-enforcer).

---

## 12. Tooling & Stack

### 12.1 Frameworks

- **No JS framework.** Vanilla HTML + CSS only. `screens/*.html` are static documents.
- Plain `<button>`, `<input>`, `<label>` elements throughout — native semantics first.

### 12.2 CSS approach

- Vanilla CSS Custom Properties (no preprocessor — no Sass, no CSS-in-JS, no Tailwind).
- Single import chain: `@import 'tokens/index.css'` → `@import 'css/index.css'`.
- Cascade-driven; no scoping mechanism (no CSS Modules, no Shadow DOM).

### 12.3 Build tools

**None.** Static files served directly. The Claude Preview tool starts a dev server via `.claude/launch.json` for visual verification (used during component development).

### 12.4 Preview / playground

- `screens/*-test.html` and project-root `*-test.html` files serve as playgrounds.
- `docs.html` + `docs.js` + `docs.css` is an in-progress documentation site (not yet shipped).
- No Storybook, Histoire, or component-explorer tool.

### 12.5 Figma

- File key: `IDT7FF4CnWEMLfuwSCFQoa`
- ~40 component variable collections, 7 token collections (primitives, semantic, gap, radius, opacity, overlay, border).
- Pages organized with status emoji prefixes: 🟡 = active, 🔴 = WIP / do not implement, ✅ = reviewed/foundational.

### 12.6 Workflow tooling

- 5 enforcer skills + Figma orchestrator (`figma-enforcer.md`).
- 2 indexes (`code-index.json`, `figma-index.json`) — read BEFORE scanning files or Figma pages.
- Claude Code with Figma MCP integration for bidirectional sync.

### 12.7 External libraries

- **Phosphor Icons** (Outline Regular + Outline Fill) — referenced in component specs (no package install — icons are inline `<svg>`).
- **Plus Jakarta Sans** — loaded via Google Fonts CDN.

---

## 13. Process — How the system was built

Reconstructed chronologically from `references/changelog.md`. Key milestones:

### 2026-03-17 — Foundation
- 142 color primitives across 13 families.
- 16 text styles (Plus Jakarta Sans, Title/Body/Label/Caption).
- Spacing (10 tokens), radius (11), border (4), opacity (5), overlay (5).
- Figma documentation pages created.

### 2026-03-18 — Semantic + project restructure + Button v1
- Created Semantic Colors collection (35 alias variables) — surface (6), text (8), action (7), border (6), feedback (8).
- All semantic tokens are aliases pointing to primitives — no hardcoded values.
- JSON sources moved to `tokens/source/`, CSS files created at `tokens/`.
- Added elevation/shadow tokens (5 levels).
- Created `figma-enforcer.md`, `design-system.md`, `design-reference.md` at root.
- **Skill architecture restructuring** — decomposed monolithic figma-enforcer into orchestrator + 5 junior enforcers (Text Style / Color / Spacing / Component / Layout).
- Button component built (Figma node `33:6053`): 4 variants × 3 sizes × 3 states. Token remap: Figma `#3a5a8c` → `--action-primary` (green-500).
- Button rebuilt with full state model: Default (3D raised) / Hover (lifted) / Pressed (pushed in) / Loading (spinner) / Disabled (flat) / Focus (outline ring).
- "Juicy" 3D effect: multi box-shadow with component tokens (`--btn-ring`, `--btn-shine`, `--btn-shadow-ambient`, `--btn-pressed-inset`).
- Button rebound in Figma: 36 → 60 variants (4 × 3 × 5).

### 2026-03-26 — Avatar Stack + Card
- Avatar Stack: 4 sizes × 3 count states with `prop3rd` / `prop3` booleans.
- Card: 2 color tokens, shadow via `--shadow-low`.

### 2026-03-26 — Pagination dot indicator redesign
- Active dot 24×4 (height 10→4), inactive 4×4. Active color shifted from navy-900 to navy-700.
- New semantic tokens: `--surface-dot-active`, `--surface-dot-inactive`.

### 2026-03-27 — Spacing token gap/10, Header full rebuild, Toast v1
- Added `--spacing-10` (10px) — Figma + JSON + CSS.
- Header rebuilt: 5-variant COMPONENT_SET → single COMPONENT with 10 boolean/swap properties.
- Removed Search variant, unified into base flex layout, removed sub-component sets.
- Added Dark mode (Header collection has 2 modes Light/Dark, `header/logo` token aliases `action/primary`).
- Subtitle corrected from 12px to 14px regular.
- Added FHD breakpoint (1920px+, padding 48px).
- Toast v1: 4 state variants × Avatar/Icon booleans, 5 component tokens.

### 2026-04-01 — Overline typography
- 3 new overline text styles (LG/MD/SM, ExtraBold 800, uppercase, 2px tracking).
- New tokens: `--font-weight-extrabold`, `--letter-spacing-overline`. Google Fonts import updated to include 800.
- Hardcoded violations swept across screens.

### 2026-04-07 — Heading component + Link Button registered
- Heading: 3 sizes × 3 boolean props, 3 component tokens.
- Added `--action-link-hover` (info-700) semantic.
- gap/10 fix in Figma (`VariableID:2431:80121`).
- Link Button registered (24 variants); spec/CSS pending at this point.

### 2026-04-23 — Multi-component update + 3-tier compliance fix
- New components added: iOS Notification Bar, Illustration Placeholder, Accordion (all on Misc. 🟡 page).
- New semantic: `--surface-tooltip` → green-800 (renamed from `surface/mascot-bubble`).
- Stepper refactored: own `--stepper-*` component layer (8 tokens) — no longer reuses `--input-*` directly.
- Icon Holder brand bg removed (`.icon-holder--bg-brand` deleted).
- **Button collection corrected to 3-tier compliance** — was aliasing primitives directly; now properly aliases semantic tokens.

### 2026-04-27 — Radio + Checkbox boxed v-padding
- Boxed v-padding bumped to 16px for both Radio and Checkbox.

### 2026-04-28 — Tooltip rename + Menu/Menu Item created
- Pure rename: "Chat Bubble" → "Tooltip" (component, page, variable collection, CSS class, file paths).
- Menu / Menu Item — new component on Dropdown 🟡 page, 7 component tokens, 10 variants (Size SM/MD × State Default/Hover/Pressed/Focused/Disabled).
- Plugin gotcha discovered & documented: Figma renders bound paint fallback color in some component-set contexts → fix by setting resolved RGBA as fallback.

### 2026-04-29 — Major release day (5 components)
- **Date Picker** — popover variant #3. Date Cell component set (5 state variants), 10 component tokens. 3 demo views (Calendar / Month / Year). v1 single-date only.
- **List Item + Price Row** — generic row primitive + billing breakdown row. Live alongside (not replacing) card-row + hospital-row.
- **Alert** (replaces Toast) — inline persistent. 4 Status × 5 booleans. 17 component tokens. 3 NEW semantic borders added (`--feedback-{info,warning,error}-border`).
- **Toast deleted** from Figma + code (deprecated in favour of Alert).
- **Tag** — promotional ribbon. 4 status variants (Yellow/Green/Coral/Purple). 12 NEW palette tokens (`--palette-{color}-{bg-strong, text-strong, shadow}`).
- **Modal** — 328px fixed mobile-only v1. 3 component tokens. Composes Header + Footer Dock. Hard rule: header padding override scoped to `.modal .top-nav`.
- **Footer Dock fix:** added `box-sizing: border-box` (was clipping inside Modal).
- **Chatbox** — chat thread message bubble (AI/User/Follow-ups). 5 component tokens. Asymmetric tail radius. Index sync brought `figma-index.json` up to date.
- 15 NEW palette strong/shadow tokens added for symmetry across all 9 colors (was just 4).
- Figma rename: 12 strong palette tokens regrouped under each color (`palette/yellow-bg-strong` → `palette/yellow/bg-strong`).

### 2026-04-30 — Avatar refactor + new Toast (transient)
- Avatar ring refactor: sibling `ring` FRAME removed; 2px INSIDE stroke now on `.avatar__circle`. Selected state toggles border color. Checkbox re-anchored to `top:0 right:0`.
- **New Toast** (transient floating) — replaces deprecated Toast role. 5 status variants × 4 booleans. 7 component tokens + 2 NEW semantic tokens (`--feedback-{error,warning}-bg-emphasis` at 700-shade).

### 2026-05-04 — Comparison Table restructure + Stats Strip + Icon Box
- **Comparison Table:** Figma library 10-mode cap forced migration from 15 modes × 6 vars → 1 mode × 32 vars (Label-style flat architecture). Cell set now 49 variants (7 Type × 7 Tint). Palette tints (Peach/Navy/Teal/Mint/Steel-Blue/Yellow/Coral/Purple) NOT exposed as variants — applied via instance fill rebind. CSS surface unchanged.
- **Stats Strip** (PROVISIONAL) — 3-column meta strip for dark navy header tops. Stats Strip Column set (3 Type variants) + parent Stats Strip COMPONENT (360×64 navy assembly). Per-instance accent overrides.
- **Icon Box** — square brand-tinted container wrapping an Icon Holder. 4 sizes (16/24/32/40px). Component tokens alias `surface/brand` + `text/brand`. **Card Row's lead icon now uses `.icon-box.icon-box--md` wrapping `.icon-holder.icon-holder--md`** (replaces bare icon-holder).


---

## 14. Decisions & Rationale Log

| # | Decision | Rationale |
|---|---|---|
| 1 | 4px base unit (not 8px) | Allows fine-grained micro-spacing (`--spacing-2`, `--spacing-6`) for tight icon-text gaps |
| 2 | Plus Jakarta Sans (not Inter / SF Pro) | Humanist sans with insurance-appropriate warmth; readable at small sizes |
| 3 | Phosphor icons (not Lucide / Material) | Outline + Fill variants give consistent style across status (Outline Regular for default, Fill for emphasized) |
| 4 | Vanilla CSS (no preprocessor / no Tailwind) | Single source of truth for tokens via custom properties; native browser support; zero build step |
| 5 | No system dark mode | Insurance product brief targets a single light theme; component-level dark variants serve specific design contexts |
| 6 | Cool-leaning grey scale (NOT warm grey) | Reinforces clinical professionalism; pairs cleanly with navy primary |
| 7 | Brand green (`#009b1a`) over Indian-insurance-typical orange/red | Differentiates from competitors; reads as health-positive |
| 8 | 3-tier token architecture (HARD RULE) | Forces semantic indirection — re-theming touches semantic layer only, components unchanged |
| 9 | Component tokens MUST alias semantic, never primitives | Prevents brittle direct-primitive bindings (Button v1 had this bug; fixed 2026-04-23) |
| 10 | Each component has its own Figma variable collection | Scopes role-named tokens (`input/border/default`) instead of generic ones; Figma Variables panel groups cleanly |
| 11 | `.icon-holder` mandatory wrapper (HARD RULE) | Standardizes icon sizing + color inheritance; prevents bare `<svg>` drift |
| 12 | No hover-only states on mobile | Mobile-first; pressed states do double duty (touch feedback) |
| 13 | Default states have no fill (transparent) | Reduces visual noise; only meaningful states get color |
| 14 | `:focus-visible` (not `:focus`) | Focus rings appear only during keyboard navigation, not on mouse-click |
| 15 | Native `<input>` hidden + custom control on top | Keeps screen-reader / form-submit semantics free |
| 16 | Plus Jakarta Sans 800 (ExtraBold) added 2026-04-01 | Required for new overline styles (uppercase + tight tracking + heavy weight signals "eyebrow") |
| 17 | Palette tokens are CSS-only (no JSON source) | They duplicate primitive aliases; flat list prevents JSON-source bloat |
| 18 | Comparison Table: 1 mode × 32 vars (Label-style) | Figma library cap is 10 modes; 15-mode design hit ceiling — restructured 2026-05-04 |
| 19 | Tag is distinct from Label and Chip | Three components serve three intents: status / filter / promotional |
| 20 | List Item lives ALONGSIDE card-row & hospital-row (not replacing) | Existing screens stable; List Item is a lighter primitive for new use cases |
| 21 | Price Row is a separate component (not List Item variant) | Billing data is read-only and structurally distinct (no lead/trail composition) |
| 22 | Toast deprecated and re-introduced | Old Toast (inline persistent) confused with Alert role — deleted 2026-04-29; new Toast (transient floating) added 2026-04-30 with clear role split |
| 23 | Stats Strip is PROVISIONAL | Quick pattern for dark headers; full Tint-variant + interactive states deferred |
| 24 | Tooltip renamed from "Chat Bubble" 2026-04-28 | Naming collision with the real chat surface in Chatbox |
| 25 | `Icon Holder` size MD (20px) for Menu Item leading + trailing | Aligns with `.text-body-md` line-height (20px); prevents vertical drift |
| 26 | No dark theme tokens, but dark component variants | Compositional flexibility without theme-toggle complexity |
| 27 | `box-sizing: border-box` added globally to Footer Dock 2026-04-29 | Was 32px wider than parent inside Modal/Bottom Sheet — clipping invisibly |
| 28 | Modal: header padding override (`.modal .top-nav { padding: 0 var(--spacing-16) }`) | Header's responsive padding (16/24/32/48) crushed the 328px modal on tablet+ |
| 29 | Card Row lead icon promoted from `.icon-holder--md` → `.icon-box.icon-box--md` | Brand-tinted square gives more visual weight to the lead icon (added 2026-05-04) |
| 30 | Skill orchestrator pattern (figma-enforcer + 5 juniors) | Single-skill ownership of the Figma API + delegated token validation; prevents bloat |

---

## 15. Gaps, Risks, Open Questions

### 15.1 Components not yet built

| Pattern | Status |
|---|---|
| Empty State component | 🔲 |
| Skeleton loader | 🔲 deferred (changelog item #4) |
| Breadcrumb | 🔲 deferred (changelog item #5) |
| Side Navigation (`.side-nav`) | 🟡 referenced in screen templates but not formalised |
| Top Bar (`.top-bar` for tablet/desktop) | 🟡 referenced but not built |
| Data Table (sortable, paginated) | 🔲 |
| Tabs (full-width / scrolling) — distinct from Segmented Tab | 🔲 |
| Banner (full-width announcement) | 🔲 |
| Snackbar (legacy term — Toast covers this role) | ✅ via Toast |
| Combobox (autocomplete) | 🔲 (Menu + Search Input recipe is closest) |
| File upload | 🔲 |
| Slider / Range input | 🔲 |
| Toggle Group / Pill Switcher | 🔲 |

### 15.2 Tokens defined but unused (orphans)

- 30 of the new palette "strong" tokens for navy/teal/steel-blue/mint/peach (only 4 colors actively consumed by Tag — yellow/green/coral/purple).

### 15.3 Hardcoded values still in code (ad-hoc)

| File | Value | Property | Needs |
|---|---|---|---|
| `css/button.css` | `36px` / `44px` / `52px` | `height` (SM/MD/LG) | Replace with spacing tokens or named size tokens |
| `css/button.css` | `rgba(255,255,255,0.12)` | `--btn-shine` | No semantic equivalent — ok |
| `css/button.css` | `rgba(0,0,0,0.15)` | `--btn-pressed-inset` | No semantic equivalent — ok |
| `css/button.css` | `rgba(11,43,64,0.25)` | `--btn-stroke-focus-ring` | No semantic equivalent — ok |
| `css/footer-dock.css` | `0 -4px 12px rgba(26,38,59,0.08)` | `--footer-dock-shadow-elevated` | No upward-shadow semantic |
| `css/tab.css` | `0 1px 2px 1px rgba(26,38,59,0.08)` | active inner shadow | No semantic equivalent |
| `css/toggle.css` | `15px` | knob `translateX` | Geometry literal — ok |

### 15.4 Inconsistencies found across files

- **From `Discrepancies.md` 2026-04-29 audit (some fixed, some carry-over):**
  - Page-name format mismatch in `figma-index.json`: `"Icons Foundations"` vs actual `"✅ Icon Foundations"`; `"Spacing Tokens"` vs `"✅ Spacing"`; `"Text Styles"` vs `"✅ Text Styles"`; `"Radius"` vs `"✅ Radius "` (trailing space). Status: deferred.
- `code-index.json` and `figma-index.json` `lastUpdated` field is `2026-04-29` but content covers up to 2026-05-04 — both stale.
- Search Input + Textarea Input previously missing from `figma-index.components` dict — fixed in 2026-04-29 sync.
- Chatbox spec previously lagged figma-index — fixed in 2026-04-29 sync.

### 15.5 Known accessibility issues

- Icon Button XS (24px) and SM (32px) below WCAG AA touch target.
- No `prefers-reduced-motion` support.
- No formal contrast audit; `text-tertiary` (grey-300) ratio 2.4:1 below AA for body text.
- No screen-reader testing matrix.

### 15.6 Open questions

- Is Stats Strip moving from provisional to final, with Tint variants and semantic accents?
- Code Connect mappings are all `false` in `figma-index.json` — when does the Figma ↔ code linking get activated?
- The Comparison Table palette tints (8 colors) sit in CSS-only modifiers but are NOT Figma variants — designers must instance-rebind. Is this acceptable long-term?
- `docs.html` documentation site is in progress — what's its public release path?
- The `guidelines/` and `patterns/` directories are empty — are they planned?

### 15.7 Risks

- **Figma library 10-mode cap:** triggered the Comparison Table restructure. Other multi-mode components (e.g. if anyone tries multi-theme components) will hit the same wall.
- **Stale indexes:** the daily audit (`Discrepancies.md`) flags missing components / pages frequently. Without automation, drift accumulates between Figma and `figma-index.json`.
- **Provisional components in production:** Stats Strip (`PROVISIONAL`) is checked in. Risk of drift if it gets used widely before being formalised.
- **No JS framework:** when interactive prototypes need state management beyond CSS pseudo-classes (e.g. multi-step wizards, complex menus), there's no standard pattern.

---

## 16. Roadmap / Next Steps

In priority order (inferred from changelog + `Discrepancies.md` action items):

1. **Sync `figma-index.json`** — fix page-name format inconsistencies, bump `lastUpdated`.
2. **Promote Stats Strip from provisional** — add Tint variants in Figma, replace primitive accent overrides with semantic tokens, add interactive states.
3. **Activate Code Connect** — all 50 components have `codeConnect: false`. Mapping these gives Figma Dev Mode the ability to show code snippets per component.
4. **Build remaining core components:**
   - Side Navigation (referenced in screen templates)
   - Top Bar (for tablet/desktop screens)
   - Skeleton loader
   - Breadcrumb
   - Empty State
5. **Build screen templates** — plan listing, plan detail, claim flow, settings/profile (Phase 3 in `design-system.md`).
6. **Accessibility:**
   - Add `@media (prefers-reduced-motion: reduce)` to all transition rules.
   - Run formal WCAG contrast audit and document results.
   - Establish keyboard / screen-reader testing matrix.
7. **Documentation site (`docs.html`)** — finalise and publish.
8. **Brand + accessibility guidelines** in `guidelines/` (Phase 4).
9. **Patterns library** in `patterns/` — formalise the Select recipes, Billing Summary, Filter Bottom Sheet, etc.
10. **Linting** — add `stylelint` + `prettier` to enforce token usage statically.

---

## 17. Appendix

### 17.1 Token JSON dump

The full token JSON is exported separately to:
- `~/Desktop/kinko-design-tokens.json`

It includes:
- All 142 primitive colors
- All 87 semantic tokens (with primitive references)
- Spacing, radius, border, opacity, overlay, shadow scales
- Full typography style table (19 named styles)
- Per-component token tables (Card, Button, Modal, Tooltip, Alert, Toast, Tag, Icon Box, List Item, Price Row, Date Picker, Menu, Popover, etc.)
- Figma variable collection ID map

### 17.2 Glossary

| Term | Definition |
|---|---|
| **Primitive token** | Raw value (color hex, px number) — Tier 1 |
| **Semantic token** | Purpose-driven alias to a primitive (`text/primary`, `surface/default`) — Tier 2 |
| **Component token** | Component-scoped alias to a semantic token (`btn/primary/fill`) — Tier 3 |
| **Palette token** | Soft and strong tinted aliases (`--palette-yellow-bg`, `--palette-yellow-bg-strong`) — used by Tag, Label, etc. |
| **Icon Holder** | Mandatory size-controlled wrapper around every icon SVG |
| **Icon Box** | Brand-tinted square container that wraps an Icon Holder |
| **Slot** | Figma SLOT type — host for free-form composition (used in Modal, Popover, Bottom Sheet) |
| **3-tier** | The architecture rule that every component declares its own component tokens aliasing semantic (never primitives) |
| **Code Connect** | Figma feature linking a component node to its code implementation, surfacing snippets in Dev Mode |
| **Code index / Figma index** | `code-index.json` / `figma-index.json` — registries that must be read before scanning files / pages |
| **Enforcer skill** | Specialized Claude skill (text-style / color / spacing / component / layout) — validates one domain |

### 17.3 External references

- **Figma file:** https://figma.com/design/IDT7FF4CnWEMLfuwSCFQoa/
- **Plus Jakarta Sans:** https://fonts.google.com/specimen/Plus+Jakarta+Sans
- **Phosphor Icons:** https://phosphoricons.com/

### 17.4 Cross-reference index

| To find… | Read… |
|---|---|
| All component CSS classes & subclasses | `.claude/indexes/code-index.json` |
| All Figma node IDs and variable collection IDs | `.claude/indexes/figma-index.json` |
| Token quick lookup | `design-reference.md` |
| Full system docs | `design-system.md` |
| Project rules (mandatory reading) | `CLAUDE.md` |
| Daily drift audit | `Discrepancies.md` |
| Dated change history | `references/changelog.md` |
| Figma API patterns | `references/figma-api.md` |
| Figma orchestrator | `figma-enforcer.md` |
| Per-component spec | `components/{name}.md` |
| Per-component CSS | `css/{name}.css` |
| Token CSS | `tokens/{group}.css` |
| Token JSON source (Figma sync) | `tokens/source/{group}.json` |

---

**End of report.**

