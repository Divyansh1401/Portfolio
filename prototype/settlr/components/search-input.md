# Search Input

**CSS:** `css/search-input.css` | **Class prefix:** `.search-input`

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  🔍  Search people...                    │
└──────────────────────────────────────────┘
    └── .search-input (pill shape, full-width)
```

| Element | Class |
|---------|-------|
| Outer wrapper (padding) | `.search-wrap` |
| Pill container | `.search-input` |
| Search icon | `.search-input__icon` |
| Native input | `input` (inside `.search-input`) |

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Height | 44px | — |
| Padding H | 16px | `--spacing-16` |
| Wrapper padding | 12px 16px | `--spacing-12` / `--spacing-16` |
| Border radius | full | `--radius-full` |
| Gap | 8px | `--spacing-8` |

---

## Colors

| Element | Token |
|---------|-------|
| Background | `--input-bg` |
| Border | `--input-border-default` |
| Icon color | `--input-fg-default` |
| Placeholder | `--input-fg-default` |
| Text | `--text-primary` |
| Wrapper bg | `--surface-primary` |

---

## Usage

```html
<div class="search-wrap">
  <div class="search-input">
    <span class="search-input__icon">
      <i class="ph ph-magnifying-glass"></i>
    </span>
    <input type="text" placeholder="Search people">
  </div>
</div>
```

---

## Notes

- `.search-wrap` provides the standard 12px top/bottom and 16px horizontal padding from the screen edge
- Border radius is `--radius-full` (pill shape)
- Icon uses `--icon-sm` (16px)
