# Top App Bar

**Figma node:** `206:15660`
**CSS file:** `css/top-app-bar.css`
**Class prefix:** `.top-app-bar`

---

## Variants

| Variant | Description |
|---------|-------------|
| `Default` | Back icon button + left-aligned title + right icon button |
| `Variant2` | Back icon button + left-aligned title + "Done" ghost text button |

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  [icon-btn]  Screen Title        [action] │
└──────────────────────────────────────────┘
```

- **Back button**: `.icon-btn` (existing component, MD size)
- **Title**: Display/Display-SM — left-aligned, fills remaining space
- **Right action**: `.icon-btn` (Default) or ghost text "Done" (Variant2)

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Width | 100% (full screen) | — |
| Padding V | 8px | `spacing/8` |
| Padding H | 16px | `spacing/16` |
| Gap | 8px | `spacing/8` |

---

## Colors

| Element | Token | Value |
|---------|-------|-------|
| Background | `--top-app-bar-bg` → `neutral/50` | `#FEF9EE` |
| Title | `--top-app-bar-title` → `olive/800` | `#16200A` |
| Done text | `--btn-ghost-fg` → `olive/600` | `#31401A` |
| Bordered modifier | `--nav-bar-border` → `neutral/200` | `#EFE4C4` |

### Figma Variables

| Variable | Alias |
|----------|-------|
| `top-app-bar/title` | `color/olive/800` |

---

## Typography

| Element | Style | Size | Weight |
|---------|-------|------|--------|
| Title | Display/Display-SM (Unbounded) | 24px | Bold (700) |
| Done action | Title/Title-XS (Plus Jakarta Sans) | 12px | SemiBold (600) |

---

## Usage

```html
<!-- Default: back + title + icon action -->
<nav class="top-app-bar">
  <button class="icon-btn icon-btn--md" aria-label="Go back"><!-- chevron-left icon --></button>
  <span class="top-app-bar__title">Screen Title</span>
  <button class="icon-btn icon-btn--md" aria-label="More options"><!-- ellipsis icon --></button>
</nav>

<!-- Variant2: back + title + Done text -->
<nav class="top-app-bar">
  <button class="icon-btn icon-btn--md" aria-label="Go back"><!-- chevron-left icon --></button>
  <span class="top-app-bar__title">Screen Title</span>
  <button class="top-app-bar__done">Done</button>
</nav>

<!-- Back only (no right action) -->
<nav class="top-app-bar">
  <button class="icon-btn icon-btn--md" aria-label="Go back"><!-- chevron-left icon --></button>
  <span class="top-app-bar__title">Screen Title</span>
</nav>
```

---

## Notes

- Title is **left-aligned**, not centered — it sits directly after the back button
- The back button uses the existing `.icon-btn` component
- No bottom border by default; add `top-app-bar--bordered` modifier when needed
