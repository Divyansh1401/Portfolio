# Action Button Row

**Figma node:** `207:15824`
**CSS file:** `css/action-button-row.css`
**Class prefix:** `.action-btn-row`

## Changelog
### 2026-03-20
- Created semantic tokens: `action-btn-row/bg` → neutral/100, `action-btn-row/border` → neutral/200
- Fixed CSS: `--border-width-small` → `--border-small`
- Fixed CSS background: `color-gray-0` (white) → `--action-btn-row-bg` (neutral/100)
- Fixed CSS: buttons now `flex: 1` to fill row equally (matches Figma `layoutGrow: 1`)
- Updated spec note: buttons ARE equal-width (not naturally sized)

---

## Variants

| Prop | Values | Description |
|------|--------|-------------|
| `secondaryBtn` | `true` / `false` | Shows Add Expense (Secondary) button alongside Settle Up |

---

## Anatomy

```
┌──────────────────────────────────────────────┐  ← border-top neutral/200
│  [Secondary: Add Expense]  [Primary: Settle Up] │
└──────────────────────────────────────────────┘
```

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Padding V | 12px | `spacing/12` |
| Padding H | 16px | `spacing/16` |
| Gap | 16px | `spacing/16` |
| Border top | 1px solid | `border-width/small`, `neutral/200` |
| Button size | LG (52px height) | — |

---

## Buttons

| Button | Variant | Size |
|--------|---------|------|
| Add Expense | Secondary | LG |
| Settle Up | Primary | LG |

Buttons use **`flex: 1`** — they stretch to fill the row equally (each takes 50% minus half the gap).

---

## Typography (buttons)

Title/Title-MD — Plus Jakarta Sans Bold, 16px, line-height 24px, letter-spacing -0.16px

---

## Usage

```html
<!-- Both buttons -->
<div class="action-btn-row">
  <button class="btn btn--lg btn--secondary">
    <span class="btn__content">
      <!-- icon -->
      Add Expense
    </span>
  </button>
  <button class="btn btn--lg btn--primary">
    <span class="btn__content">
      <!-- icon -->
      Settle Up
    </span>
  </button>
</div>

<!-- Settle Up only -->
<div class="action-btn-row">
  <button class="btn btn--lg btn--primary">
    <span class="btn__content">
      <!-- icon -->
      Settle Up
    </span>
  </button>
</div>
```

---

## Notes

- Always anchored to the bottom of the screen, above the bottom nav or safe area
- Buttons are naturally sized — not equal-width flex children
- Uses existing `.btn` component — no new button styles needed
