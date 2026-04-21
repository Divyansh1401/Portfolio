# Status Bar

**CSS:** `css/status-bar.css` | **Class prefix:** `.status-bar`

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  9:41                    ▌▌▌  ))) [===]  │
└──────────────────────────────────────────┘
```

| Element | Class |
|---------|-------|
| Container | `.status-bar` |
| Time text | `.status-bar__time` |
| Icons group | `.status-bar__icons` |

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Height | 48px | `--spacing-48` |
| Padding H | 16px | `--spacing-16` |

---

## Colors

| Element | Token |
|---------|-------|
| Background | `--surface-primary` |
| Time + icons | `--text-primary` |

---

## Usage

```html
<div class="status-bar">
  <span class="status-bar__time">9:41</span>
  <div class="status-bar__icons">
    <!-- signal SVG -->
    <!-- wifi SVG -->
    <!-- battery SVG -->
  </div>
</div>
```

---

## Notes

- Shared across all screens — do NOT redefine inline
- SVG icons are inline (signal, wifi, battery) using `currentColor`
- Height uses `--spacing-48` (48px), closest token to iOS 44px native bar
