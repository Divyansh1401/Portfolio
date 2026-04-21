# Segment Control

**CSS:** `css/navigation.css` | **Class prefix:** `.segment-control` / `.segment-item`

---

## Segment Item `135:9343`

**Variants:** Default · Active · Disabled

### Properties

| Property | Type | Options |
|----------|------|---------|
| Type | VARIANT | Segment |
| State | VARIANT | Default, Active, Disabled |
| Icon | BOOLEAN | true/false |
| Label | TEXT | "Segment" |

### State Specs

| State | Radius | Background | Foreground | Border |
|-------|--------|-----------|------------|--------|
| Default | 0 | transparent | `--tab-fg-default` → neutral/600 | none |
| Active | `--radius-8` | `--tab-bg-active` → gray/0 | `--tab-fg-active` → neutral/900 | `--tab-border-active` → neutral/300 |
| Disabled | 0 | transparent | `--tab-fg-disabled` → neutral/300 | none |

### Figma Variables

| Variable | Alias |
|----------|-------|
| `tab/bg/active` | `color/gray/0` |
| `tab/fg/active` | `color/neutral/900` |
| `tab/fg/default` | `color/neutral/600` |
| `tab/fg/disabled` | `color/neutral/300` |

---

## Segment Control (Container) `135:9360`

### Layout

| Property | Value | Token |
|----------|-------|-------|
| Direction | Horizontal | — |
| Gap | 4px | `--spacing-4` |
| Padding | 2px all | `--spacing-2` |
| Corner radius | 12px | `--radius-12` |
| Background | `--tab-bg-track` → neutral/200 | — |

---

## Typography

| Element | Style | Size | Weight |
|---------|-------|------|--------|
| Segment label | Label/Label-MD (Plus Jakarta Sans) | 14px | SemiBold (600) |

---

## Usage

```html
<!-- 2-tab segment -->
<div class="segment-control">
  <button class="segment-item is-active">Transactions</button>
  <button class="segment-item">Balances</button>
</div>

<!-- 3-tab segment with disabled -->
<div class="segment-control">
  <button class="segment-item is-active">All</button>
  <button class="segment-item">Following</button>
  <button class="segment-item segment-item--disabled" disabled>Saved</button>
</div>
```

---

## Notes

- Container uses `--radius-12` (not `--radius-full`) to maintain the pill-within-pill look
- Item gap/padding: `--spacing-8` / `--spacing-8 --spacing-12` (nearest tokens to Figma's 6px gap, 7px/12px padding)
- The active item gets `--radius-8` inner pill and a 1px ring shadow via `--tab-border-active`
