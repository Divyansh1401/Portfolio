# Header Chips

A horizontally scrollable strip of SM Chips placed directly below the Top App Bar. Used to surface filter or category options at the top of a screen.

**Figma node:** `75:4797` (Component "Header chips", file `eEoeGLJO7fTeV2gD7CjVZ2`)
**CSS file:** `css/header-chips.css`
**Class prefix:** `.header-chips`

---

## Structure

```
.header-chips
  └── .chip.chip--sm  (×N — any number of chips)
```

The container handles layout only. Each chip inside is a standard `.chip.chip--sm` instance — no new variants.

---

## Layout

| Property | Value | Token |
|----------|-------|-------|
| Direction | Horizontal | — |
| Padding (top/bottom) | 12px | `--spacing-12` |
| Padding (left/right) | 16px | `--spacing-16` |
| Gap | 12px | `--spacing-12` |
| Border | 1px bottom | `--border-small` + `--border-default` |
| Overflow | scroll-x, no scrollbar | — |

---

## Token usage

No new component tokens. Colors come from the `.chip` component's existing `--chip-*` tokens. The bottom border uses the screen-level `--border-default` (neutral/300).

---

## Usage

```html
<div class="header-chips">
  <button class="chip chip--sm chip--on">All</button>
  <button class="chip chip--sm">Food</button>
  <button class="chip chip--sm">Transport</button>
  <button class="chip chip--sm">Accommodation</button>
  <button class="chip chip--sm">Activities</button>
</div>
```

---

## Rules

- Always place `.header-chips` directly below a `.top-app-bar` — the bottom border acts as a divider between the two.
- Only use `.chip.chip--sm` inside — never MD or LG chips.
- Never add vertical scrolling — this is a single-row horizontal strip only.
- The container has no background fill — it inherits the screen background.
