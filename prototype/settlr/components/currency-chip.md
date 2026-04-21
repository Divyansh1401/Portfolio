# Currency Chip

**CSS file:** `css/currency-chip.css`
**Class prefix:** `.currency-chip`
**Figma node:** `303:9106` (Currency Chip)

---

## Anatomy

```
.currency-chip              ← pill button: bg + border + flex row
  (text)                    ← currency label e.g. "₹ INR"
  .currency-chip__caret     ← chevron-down icon (icon-xs)
```

---

## Usage

```html
<button class="currency-chip" onclick="openCurrencySheet()">
  ₹ INR
  <svg class="currency-chip__caret" viewBox="0 0 16 16" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 6l4 4 4-4"/>
  </svg>
</button>
```

---

## Tokens

| Token | Source | Role |
|-------|--------|------|
| `--chip-bg-off` | `neutral/100` | background |
| `--chip-border-off` | `neutral/300` | border |
| `--chip-fg-off` | `neutral/800` | text + icon color |

---

## Typography

| Element | Style |
|---------|-------|
| Label | Plus Jakarta Sans, 12px, SemiBold, `--chip-fg-off` |

---

## Notes

- Reuses `chip/off` color tokens — no new semantic tokens needed.
- Tap opens a currency selection bottom sheet (managed by JS).
- The caret icon uses `currentColor` so it inherits the chip foreground.
- Icon size: `--icon-xs` (12px).
