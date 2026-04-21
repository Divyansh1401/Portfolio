# Toast

A floating notification component used to surface feedback messages — confirmations, errors, warnings, and status updates. Appears overlaid on screen content (typically at top or bottom) and disappears automatically.

**CSS file:** `css/toast.css`
**Class prefix:** `.toast`
**Figma node:** `292:8850`

---

## Structure

```
.toast  .toast--{color}
  ├── .toast__illustration   (optional — 40×40 image placeholder)
  ├── .toast__icon           (optional — 16×16 SVG icon)
  └── .toast__text
        ├── .toast__title    (optional — 14px SemiBold)
        └── .toast__body     (13px Regular)
```

All three top-level children are optional. Omit the element from the DOM to hide it.

---

## Color Variants

| Modifier | Background | Text | Border |
|----------|-----------|------|--------|
| `.toast--neutral` | `--toast-neutral-bg` (gray/100) | `--toast-neutral-fg` (gray/700) | `--toast-neutral-border` (gray/300) |
| `.toast--brand` | `--toast-brand-bg` (olive/100) | `--toast-brand-fg` (olive/800) | `--toast-brand-border` (olive/300) |
| `.toast--success` | `--toast-success-bg` (green/100) | `--toast-success-fg` (green/700) | `--toast-success-border` (green/300) |
| `.toast--warning` | `--toast-warning-bg` (yellow/100) | `--toast-warning-fg` (yellow/700) | `--toast-warning-border` (yellow/300) |
| `.toast--error` | `--toast-error-bg` (coral/100) | `--toast-error-fg` (coral/700) | `--toast-error-border` (coral/300) |
| `.toast--info` | `--toast-info-bg` (jay/100) | `--toast-info-fg` (jay/700) | `--toast-info-border` (jay/300) |

---

## Token Usage

| Property | Token |
|----------|-------|
| Background | `--toast-{color}-bg` |
| Text color | `--toast-{color}-fg` |
| Border color | `--toast-{color}-border` |
| Border width | `--border-small` (1px) |
| Border radius | `--radius-12` |
| Shadow | `--shadow-lg` |
| Gap between children | `--spacing-8` |
| Padding (vertical) | `--spacing-12` |
| Padding (horizontal) | `--spacing-16` |
| Text gap (title → body) | `--spacing-4` |
| Illustration size | 40×40px |
| Illustration radius | `--radius-8` |
| Illustration bg | `--expense-item-illus-bg` (gray/200) |
| Icon size | `--icon-sm` (16px) |
| Title size | `--font-size-14` / `--weight-semibold` / `--line-height-20` |
| Body size | `--font-size-13` / `--weight-regular` / `--line-height-21` |

---

## Usage

### Text only (most common)

```html
<div class="toast toast--success">
  <div class="toast__text">
    <p class="toast__title">Expense added</p>
    <p class="toast__body">₹450 split across 3 people</p>
  </div>
</div>
```

### Icon + text

```html
<div class="toast toast--error">
  <svg class="toast__icon" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <div class="toast__text">
    <p class="toast__title">Payment failed</p>
    <p class="toast__body">Please check your connection and try again</p>
  </div>
</div>
```

### Illustration + icon + text (full variant)

```html
<div class="toast toast--brand">
  <div class="toast__illustration">
    <img src="path/to/image.png" alt="" width="40" height="40" />
  </div>
  <svg class="toast__icon" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="toast__text">
    <p class="toast__title">Group created</p>
    <p class="toast__body">Goa Trip is ready to go</p>
  </div>
</div>
```

### Body only (no title)

```html
<div class="toast toast--neutral">
  <div class="toast__text">
    <p class="toast__body">Copied to clipboard</p>
  </div>
</div>
```

---

## Rules

- Width is fixed at 361px (393px screen − 16px margin on each side). Never set `width: 100%`.
- Color token controls both text and border — all text elements inherit via `color: currentColor`.
- Icon SVGs must use `currentColor` for stroke/fill so they inherit the variant color.
- Illustration placeholder uses `--expense-item-illus-bg` (gray/200) — never hardcode the gray.
- To position on-screen, wrap in a fixed/absolute container outside the normal flow. The component itself has no positioning — the parent handles placement.
- Show icon, illustration, title, and body independently by including or omitting those elements — no modifier classes needed.
- Always include `.toast__body`. `.toast__title` is optional.
- Never use `.toast--neutral` for error/warning feedback — choose the semantically correct variant.
