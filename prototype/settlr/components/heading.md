# Heading

**Figma ID:** `158:10402` | **CSS:** `css/heading.css` | **Class prefix:** `.heading`

---

## Variants

| Variant | Text style | Size | Weight |
|---------|-----------|------|--------|
| `Property 1=Default` (Secondary) | Heading-XS (Unbounded) | 16px Bold | 700 |
| `Property 1=Variant2` (Primary) | Heading-SM (Unbounded) | 18px Bold | 700 |
| `Property 1=Variant3` (Tertiary) | Title/Title-XS (Plus Jakarta Sans) | 12px SemiBold | 600 |

All three use `--heading-fg` → `neutral/900`.

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  Section Title                  View all →│
└──────────────────────────────────────────┘
```

- **Left:** heading text (`.heading__text`)
- **Right:** optional action (`.heading__action`) — typically a `.btn.btn--ghost`

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Padding V | 12px | `--spacing-12` |
| Padding H | 16px | `--spacing-16` |
| Width | 100% | — |
| Layout | `space-between` | — |

---

## Colors

| Element | Token | Value |
|---------|-------|-------|
| Text | `--heading-fg` → `neutral/900` | `#1A1810` |

### Figma Variable

| Variable | Alias |
|----------|-------|
| `heading/fg` | `color/neutral/900` |

---

## Usage

```html
<!-- No action -->
<div class="heading">
  <span class="heading__text">Recent Groups</span>
</div>

<!-- With "View all" action -->
<div class="heading">
  <span class="heading__text">Activity</span>
  <div class="heading__action">
    <button class="btn btn--ghost">
      <span class="btn__content">
        <span class="btn__label">View all</span>
        <span class="btn__icon"><!-- chevron-right icon --></span>
      </span>
    </button>
  </div>
</div>
```

---

## Notes

- `heading.css` uses `.heading__text` for all three Figma variants — swap font size in context if needed
- The Figma component has 3 named variants; in code, font scale is typically set at the screen level
- `heading__action` uses `flex-shrink: 0` to prevent text truncation
