# Kinko Design System

Kinko is an insurance selling platform for mobile and desktop. This document describes the full design system — token architecture, component guidelines, usage rules, and phase roadmap.

---

## Architecture

```
tokens/
├── index.css          ← import this in every screen/component
├── colors.css         ← 142 primitive color variables
├── semantic.css       ← 41 semantic aliases (USE THESE in components)
├── spacing.css        ← 10 spacing steps
├── radius.css         ← 11 radius steps
├── typography.css     ← font imports + 16 text style classes
├── borders.css        ← 4 border widths
├── opacity.css        ← 5 opacity levels
├── overlays.css       ← 5 scrim levels
├── shadows.css        ← 5 elevation levels
└── source/            ← read-only JSON exports (Figma source of truth)

components/            ← component specs (.md) — one file per component
css/                   ← component CSS — one file per component
screens/               ← screen HTML files
```

---

## Token Layers

### Layer 1: Primitives (`colors.css`)

Raw color values. 142 variables across 13 families.

```
base/white · base/black
primary/green/50–900 · primary/navy/50–900 · primary/grey/50–900
secondary/teal/50–900 · secondary/steel-blue/50–900 · secondary/mint/50–900
tertiary/peach/50–900 · tertiary/yellow/50–900 · tertiary/coral/50–900 · tertiary/purple/50–900
system/success/50–900 · system/info/50–900 · system/warning/50–900 · system/error/50–900
```

CSS naming: `--color-primary-green-500`, `--color-system-error-50`, etc.

### Layer 2: Semantic (`semantic.css`)

Purpose-driven aliases. **Always prefer these in components.** Never skip to primitives unless no semantic exists.

| Group | Variables |
|-------|-----------|
| `surface/*` | default, secondary, tertiary, brand, inverse, inverse-secondary, **disabled**, **active-tint**, **error-tint** |
| `text/*` | primary, secondary, tertiary, inverse, brand, error, **error-emphasis**, **disabled**, on-action-primary, on-action-secondary |
| `action/*` | primary, primary-hover, primary-pressed, secondary, secondary-hover, secondary-pressed, disabled, destructive, destructive-hover, **destructive-pressed**, link |
| `border/*` | default, strong, subtle, focus, error, selected |
| `feedback/*` | success, success-bg, error, error-bg, warning, warning-bg, info, info-bg |

CSS naming: `--surface-default`, `--text-primary`, `--action-primary`, etc.

---

## Typography

Font: **Plus Jakarta Sans** — 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold). No other fonts.

19 named styles. Always use a class — never set `font-size` or `font-weight` directly.

| Class | Size | Weight | Use |
|-------|------|--------|-----|
| `.text-title-xl` | 20px | Bold | Page headings |
| `.text-title-lg` | 18px | Bold | Section headings |
| `.text-title-md` | 16px | Bold | Sub-section headings |
| `.text-title-sm` | 14px | SemiBold | Card titles |
| `.text-title-xs` | 13px | SemiBold | Small headings |
| `.text-body-md` | 14px | Regular | Standard body text |
| `.text-body-sm` | 12px | Regular | Secondary body text |
| `.text-body-xs` | 10px | Regular | Fine print |
| `.text-label-lg` | 16px | SemiBold | Primary button labels, nav items |
| `.text-label-lg-medium` | 16px | Medium | Secondary labels |
| `.text-label-md` | 14px | SemiBold | Form labels, tags |
| `.text-label-md-medium` | 14px | Medium | Secondary form labels |
| `.text-label-xs` | 12px | Medium | Badges, chips |
| `.text-caption-md` | 12px | Regular | Captions, timestamps |
| `.text-caption-sm-bold` | 10px | Bold | Bold micro text |
| `.text-caption-sm-medium` | 10px | Medium | Metadata |
| `.text-overline-lg` | 14px | ExtraBold | Large eyebrow / section label (UPPERCASE) |
| `.text-overline-md` | 12px | ExtraBold | Standard overline / stat label (UPPERCASE) |
| `.text-overline-sm` | 10px | ExtraBold | Small overline / badge text (UPPERCASE) |

---

## Spacing

12-step scale. Use `--spacing-*` in all padding, gap, and margin properties.

| Token | Value | Use |
|-------|-------|-----|
| `--spacing-2` | 2px | Icon–text nudge |
| `--spacing-4` | 4px | Tight inline |
| `--spacing-6` | 6px | Snug — compact icon gaps, tight list items |
| `--spacing-8` | 8px | Button padding, list items |
| `--spacing-12` | 12px | Card padding |
| `--spacing-16` | 16px | Section padding |
| `--spacing-20` | 20px | Content blocks |
| `--spacing-24` | 24px | Group separation |
| `--spacing-32` | 32px | Section margins |
| `--spacing-48` | 48px | Page sections |
| `--spacing-64` | 64px | Layout divisions |

---

## Radius

13-step scale. Use `--radius-*` for all `border-radius` values.

`2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · pill (9999)`

---

## Border Widths

| Token | Value |
|-------|-------|
| `--border-width-hairline` | 0.5px |
| `--border-width-small` | 1px |
| `--border-width-medium` | 1.5px |
| `--border-width-large` | 2px |

---

## Elevation / Shadows

| Token | Shadow | Use |
|-------|--------|-----|
| `--shadow-none` | none | Flat elements |
| `--shadow-low` | 0 1px 2px rgba(0,0,0,0.06) | Cards |
| `--shadow-medium` | 0 4px 8px rgba(0,0,0,0.10) | Dropdowns |
| `--shadow-high` | 0 8px 24px rgba(0,0,0,0.14) | Modals |
| `--shadow-highest` | 0 16px 48px rgba(0,0,0,0.18) | Floating overlays |

---

## Opacity & Overlays

**Opacity** (apply to element `opacity` property):
`--opacity-subtle` (0.10) · `--opacity-medium` (0.25) · `--opacity-strong` (0.50) · `--opacity-disabled` (0.75) · `--opacity-backdrop` (0.90)

**Overlays** (rgba black — use as `background-color` on scrim divs):
`--overlay-20` · `--overlay-35` · `--overlay-50` · `--overlay-65` · `--overlay-80`

---

## Screen Structure

Every screen must import `tokens/index.css` and follow this HTML structure.

### Mobile (390px)
```html
<div class="screen">
  <div class="status-bar"></div>
  <div class="top-nav">...</div>
  <div class="screen__content">
    <div class="section">...</div>
  </div>
  <nav class="bottom-nav">...</nav>
</div>
```

### iPad (768px+)
```html
<div class="screen screen--tablet">
  <nav class="side-nav">...</nav>
  <div class="screen__body">
    <div class="top-bar">...</div>
    <div class="screen__content">...</div>
  </div>
</div>
```

### Desktop (1280px+)
```html
<div class="screen screen--desktop">
  <nav class="side-nav side-nav--expanded">...</nav>
  <div class="screen__body">
    <div class="top-bar">...</div>
    <div class="screen__content">...</div>
  </div>
</div>
```

---

## Component Inventory

| Component | Spec | CSS | Class prefix | Status |
|-----------|------|-----|--------------|--------|
| Button | `components/button.md` | `css/button.css` | `.btn` | ✅ Done |
| Input Field | `components/input.md` | `css/input.css` | `.input` | ✅ Done |
| OTP Input | `components/otp.md` | `css/otp.css` | `.otp` | ✅ Done |
| Label (Badge) | `components/label.md` | `css/label.css` | `.label` | ✅ Done |
| Radio Button | `components/radio.md` | `css/radio.css` | `.radio-item` `.radio-control` | ✅ Done |
| Stepper | `components/stepper.md` | `css/stepper.css` | `.stepper` | ✅ Done |
| Chip | `components/chip.md` | `css/chip.css` | `.chip` | ✅ Done |
| Segmented Tab | `components/tab.md` | `css/tab.css` | `.tab-control` `.tab-item` | ✅ Done |
| Checkbox | `components/checkbox.md` | `css/checkbox.css` | `.checkbox-item` `.checkbox-control` | ✅ Done |
| Toggle | `components/toggle.md` | `css/toggle.css` | `.toggle-item` `.toggle-control` | ✅ Done |
| Pagination | `components/pagination.md` | `css/pagination.css` | `.pagination` `.pagination-dots` | ✅ Done |
| Avatar | `components/avatar.md` | `css/avatar.css` | `.avatar` | ✅ Done |
| Avatar Stack | `components/avatar-stack.md` | `css/avatar-stack.css` | `.avatar-stack` | ✅ Done |
| Card | `components/card.md` | `css/card.css` | `.card` | ✅ Done |
| Alert | `components/alert.md` | `css/alert.css` | `.alert` | ✅ Done |
| Divider | `components/divider.md` | `css/divider.css` | `.divider` | ✅ Done |
| Header | `components/header.md` | `css/header.css` | `.top-nav` | ✅ Done |
| Footer Dock | `components/footer-dock.md` | `css/footer-dock.css` | `.footer-dock` | ✅ Done |
| Tooltip | `components/tooltip.md` | `css/tooltip.css` | `.tooltip` | ✅ Done |
| Icon Button | `components/icon-button.md` | `css/icon-button.css` | `.icon-btn` | ✅ Done |
| Bottom Sheet | `components/bottom-sheet.md` | `css/bottom-sheet.css` | `.bottom-sheet-overlay` `.bottom-sheet` | ✅ Done |
| Modal | `components/modal.md` | `css/modal.css` | `.modal-overlay` `.modal` | ✅ Done |
| Filter Tab | `components/filter-tab.md` | `css/filter-tab.css` | `.filter-tab` | ✅ Done |
| Chip Tag | `components/chip-tag.md` | `css/chip-tag.css` | `.chip-tag` | ✅ Done |
| Tag | `components/tag.md` | `css/tag.css` | `.tag` | ✅ Done |
| Progress Bar | `components/progress-bar.md` | `css/progress-bar.css` | `.progress` | ✅ Done |

## Component Guidelines

- Component specs live in `components/[name].md`
- Component CSS lives in `css/[name].css`
- CSS classes use the component name as a prefix: `.btn`, `.input-*`, `.card-*`
- All CSS must use token variables — zero hardcoded values
- New components must be added to `css/index.css`
- States: default, pressed (mobile touch feedback), disabled, focus, error (no hover-only states on mobile)

---

## Design Principles

- **Multi-platform** — mobile (390px), iPad (768px+), desktop (1280px+)
- **No dark mode** — single light theme
- **Brand:** Primary green `#009b1a` (`--action-primary`), Secondary navy `#0b2b40` (`--action-secondary`)
- **Trust and clarity** — insurance product; professional, not playful
- **Touch targets** — 48px minimum (WCAG AA)
- **Interaction model** — pressed states for touch, hover for desktop cursor

---

## Phase Status

| Phase | Status |
|-------|--------|
| Primitive tokens (142 colors + spacing + radius + border + opacity + overlay) | ✅ Done |
| Semantic tokens (47 aliases — added `surface/brand-inverse` for Tooltip) | ✅ Done |
| Elevation tokens | ✅ Done |
| CSS token files | ✅ Done |
| Button component (Primary, Secondary, Ghost, Destructive × SM/MD/LG) | ✅ Done |
| OTP component (4-digit + 6-digit, 13 tokens, 5 states) | ✅ Done |
| Label component (5 statuses × 3 sizes, 10 tokens) | ✅ Done |
| Radio Button component (Control + Item + Item Boxed, 28 tokens, 7 states) | ✅ Done |
| Stepper component (quantity input, reuses input tokens, Default + Disabled) | ✅ Done |
| Chip component (6 statuses × 3 sizes, 17 tokens, pill shape) | ✅ Done |
| Segmented Tab component (Default/Hover/Active/Disabled, 9 tokens) | ✅ Done |
| Checkbox component (Control + Item + Item Boxed, 17 tokens, 7 states) | ✅ Done |
| Toggle component (Control + Item, 16 tokens, 8 states) | ✅ Done |
| Pagination component (Item + Dot + Dot Indicator, 17 tokens, 4 states) | ✅ Done |
| Avatar component (7 sizes × 2 states, 3 tokens, Checkbox badge) | ✅ Done |
| Avatar Stack component (4 sizes × 3 count states, 3 tokens, overflow badge) | ✅ Done |
| Divider component (6 variants: Horizontal ×5 + Vertical, 3 tokens) | ✅ Done |
| Header component (14 variants, 5 tokens, reuses Avatar + Button) | ✅ Done |
| Footer Dock component (4 styles × 3 layouts × optional infoText, 4 tokens) | ✅ Done |
| Tooltip component (6 tail variants × 2 icon states, 3 tokens — renamed from Chat Bubble 2026-04-28) | ✅ Done |
| Card component (surface container, 2 color tokens + shadow-low) | ✅ Done |
| Alert component (4 Status variants × 5 boolean props, 17 tokens; replaces deprecated Toast 2026-04-29; adds 3 new feedback/*-border semantic tokens) | ✅ Done |
| Icon Button component (5 variants × 3 sizes × 5 states = 75 variants, 28 tokens, 3D effects) | ✅ Done |
| Bottom Sheet component (overlay + panel, footer boolean, 3 tokens, 4 breakpoints) | ✅ Done |
| Modal component (single mobile size 328px, 3 tokens, composes Header + Footer Dock) | ✅ Done |
| Filter Tab component (6 states: Default/Active/Pressed/Disabled/Hover/Focused, 11 tokens) | ✅ Done |
| Chip Tag component (5 states: on/off/hover/focused/disabled, 11 tokens, pill shape, success-tint) | ✅ Done |
| Progress Bar component (2 variants: Default/Disabled, 4 color tokens + 2 dimension tokens, pill shape) | ✅ Done |
| Content Card component (172×218 article tile, 5 states × 4 booleans + 1 SLOT, 11 tokens) | ✅ Done |
| Social Proof component (avatar stack + statement + optional rating + optional Link Button, Tinted variant + 3 booleans, 5 tokens) | ✅ Done |
| Insurer Card component (235×154 insurer-listing tile, 4 booleans, 6 tokens, radial wash bg + 2px inset top highlight, static / Link Button owns interaction) | ✅ Done |
| Contact Us Card component (328×136 support hero, dark green radial wash + 3 brand-tinted action tiles with paper-emboss inset shadow, final-card exception — no component tokens) | ✅ Done |
| Remaining core components (navigation, etc.) | 🔲 Phase 2 |
| Screen templates (22+ screens across 5 flows) | 🔲 Phase 3 |
| Documentation pages & guidelines | 🔲 Phase 4 |
