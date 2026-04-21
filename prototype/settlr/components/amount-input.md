# Amount Input

**Figma source:** node `314:9120` — "Amount input" section
**CSS file:** `css/amount-input.css`
**Class prefix:** `.amount-input`

---

## Purpose

A compact, icon-annotated numeric input used in split breakdowns. Shows the unit context (₹, %, shares) adjacent to the editable value so users always know what type they're entering.

---

## Anatomy

```
┌──────────────────────────────┐  40px tall
│  [icon]  [  value input  ]   │  8px padding, 4px gap
└──────────────────────────────┘  radius-8, border neutral-400
```

| Element | Class | Notes |
|---------|-------|-------|
| Container | `.amount-input` | Flex row, `height: 40px`, focus-within states |
| Numeric input | `.amount-input__field` | `flex: 1`, right-aligned, no spinner arrows |
| Icon / unit slot | `.amount-input__icon` | `20×20px`, holds ₹/% symbol or SVG icon |

---

## Variants

| Modifier | Layout | Used for |
|----------|--------|----------|
| `.amount-input--currency` | ₹ left · value right | Custom amount mode (₹) |
| `.amount-input--percent` | value right · % right | Percentage split mode |
| `.amount-input--shares` | value right · unit text right | Shares split mode |
| `.amount-input--stepper` | ± left · value center · ± right | Equal stepper (future) |

---

## Tokens

| Token | Value | Role |
|-------|-------|------|
| `--amount-input-bg` | `--color-neutral-100` | Default background |
| `--amount-input-bg-focused` | `--color-gray-0` | Focused background |
| `--amount-input-border` | `--color-neutral-400` | Default border (stronger than standard input) |
| `--amount-input-border-focused` | `--color-olive-600` | Focused border |
| `--amount-input-fg` | `--color-neutral-900` | Input text color |
| `--amount-input-icon-fg` | `--color-neutral-600` | Icon / unit label color |

---

## HTML Examples

### Currency (₹)
```html
<div class="amount-input amount-input--currency">
  <span class="amount-input__icon">₹</span>
  <input class="amount-input__field" type="number" min="0" step="0.01" value="400">
</div>
```

### Percent (%)
```html
<div class="amount-input amount-input--percent">
  <input class="amount-input__field" type="number" min="0" max="100" step="1" value="33">
  <span class="amount-input__icon">%</span>
</div>
```

### Shares
```html
<div class="amount-input amount-input--shares">
  <input class="amount-input__field" type="number" min="1" step="1" value="1">
  <span class="amount-input__icon">sh</span>
</div>
```

### Stepper (equal split)
```html
<div class="amount-input amount-input--stepper">
  <span class="amount-input__icon" role="button">−</span>
  <input class="amount-input__field" type="number" value="3">
  <span class="amount-input__icon" role="button">+</span>
</div>
```

---

## States

| State | Visual change |
|-------|--------------|
| Default | `--amount-input-bg` background, `--amount-input-border` border |
| `:focus-within` | `--amount-input-bg-focused` + `--amount-input-border-focused` |

---

## Usage Rules

- Width is **not set by the component** — set it from the parent context.
- Do **not** show browser spinner arrows on number inputs (CSS suppresses them).
- Icon slot is always `20×20px`; for the `--shares` variant the `width: auto` modifier accommodates short text labels.
- Always pair with a `<label>` or visually obvious context (column heading) — the icon alone does not replace accessible labelling.
