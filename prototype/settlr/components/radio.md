# Radio / Checkbox Controls

**Figma node:** `128:9142`
**CSS file:** `css/radio.css`
**Class prefixes:** `.radio-control`, `.radio-item`, `.radio-item-boxed`

## Changelog
### 2026-03-20
- Fixed hardcoded values in CSS: replaced all `px` sizes with spacing/typography tokens
- Radio control dot size: `6px` → `var(--spacing-4)` (4px)
- Radio item padding: `4px 0` → `var(--spacing-4) 0`
- Radio item label: hardcoded `14px / 23px` → `var(--font-size-14) / var(--line-height-23)`
- Radio item boxed padding: `12px 16px` → `var(--spacing-12) var(--spacing-16)`
- Radio item boxed gap: `12px` → `var(--spacing-12)`
- Radio item boxed text gap: `2px` → `var(--spacing-2)`
- Radio item boxed label: hardcoded `14px / 23px` → token vars
- Radio item boxed description: hardcoded `13px / 21px` → token vars
- Selected border-width: hardcoded `2px` → `var(--border-large)`
- Created **Radio Item Boxed — Illustration** variant: 4 states (Figma node `257:6718`)

---

## Radio Control `75:4927`
**Variants:** 4 (Default, Selected, Disabled, Disabled Selected)

### Layout
- **Size:** 16×16
- **Corner Radius:** `--radius-full` (9999px — circle)
- **Border:** `--border-small` (1px)

### State Specs
| State | Background | Border | Dot |
|-------|-----------|--------|-----|
| Default | transparent | `--control-border-default` (neutral/300) | hidden |
| Selected | `--control-bg-selected` (olive/600) | `--control-border-selected` (olive/600) | `--control-dot` (white) |
| Disabled | `--control-bg-disabled` (gray/100) | `--control-border-disabled` (gray/200) | hidden |
| Disabled Selected | `--control-bg-disabled-selected` (gray/300) | `--control-border-disabled` (gray/200) | `--control-dot` (white) |

### Dot Size
- `var(--spacing-4)` × `var(--spacing-4)` (4×4px)

---

## Radio Item `75:4938`
**Variants:** 4 (Default, Selected, Disabled, Disabled Selected)

### Layout
- **Direction:** Horizontal
- **Alignment:** Center
- **Gap:** `--spacing-8` (8px)
- **Padding:** `--spacing-4` top/bottom, 0 left/right

### Content
Radio Control + Label text

| Property | Token | Value |
|----------|-------|-------|
| Label color | `--control-label` | neutral/800 |
| Disabled label | `--control-label-disabled` | gray/400 |
| Font size | `--font-size-14` | 14px |
| Line height | `--line-height-23` | 23px |
| Font weight | `--weight-regular` | 400 |

---

## Radio Item Boxed `75:4960`
**Variants:** 4 (Default, Selected, Disabled, Disabled Selected)
**Boolean props:** Supporting text

### Layout
- **Direction:** Horizontal
- **Alignment:** Center
- **Gap:** `--spacing-12` (12px)
- **Padding:** `--spacing-12` V × `--spacing-16` H (12px 16px)
- **Corner Radius:** `--radius-8` (8px)
- **Border:** `--border-small` (1px) default, `--border-large` (2px) selected

### Container State Specs
| State | Background | Border | Border Width |
|-------|-----------|--------|-------------|
| Default | `--container-bg-default` (white) | `--container-border-default` (neutral/300) | `--border-small` |
| Selected | `--container-bg-selected` (olive/50) | `--container-border-selected` (olive/600) | `--border-large` |
| Disabled | `--container-bg-default` (white) | `--container-border-disabled` (gray/200) | `--border-small` |

### Text Content
| Element | Token | Value |
|---------|-------|-------|
| Label font size | `--font-size-14` | 14px |
| Label line height | `--line-height-23` | 23px |
| Label color | `--control-label` | neutral/800 |
| Description font size | `--font-size-13` | 13px |
| Description line height | `--line-height-21` | 21px |
| Description color | `--control-description` | neutral/500 |
| Text column gap | `--spacing-2` | 2px |

---

## Radio Item Boxed — Illustration `257:6718`
**Variants:** 4 (Default, Selected, Disabled, Disabled Selected)

Layout: `[Illustration] [Text] [Radio Control]`
Radio control is on the **right** (end of row), illustration on the **left**.

### Layout
- **Direction:** Horizontal
- **Alignment:** Center
- **Gap:** `--spacing-12` (12px)
- **Padding:** `--spacing-12` V × `--spacing-16` H (same as Radio Item Boxed)
- **Corner Radius:** `--radius-8` (8px)

### Illustration Placeholder
- **Size:** `--icon-xl` × `--icon-xl` (40×40px)
- **Corner Radius:** `--radius-8` (8px)
- **Background:** `--color-neutral-200` (placeholder — will be replaced with real illustrations)

### Container States
Same as Radio Item Boxed — uses identical `--container-*` tokens.

### CSS Modifier
Add `.radio-item-boxed--illus` alongside `.radio-item-boxed`:
```html
<div class="radio-item-boxed radio-item-boxed--illus">
  <div class="radio-item-boxed__illus"></div>
  <div class="radio-item-boxed__text">
    <span class="radio-item-boxed__label">Label</span>
    <span class="radio-item-boxed__description">Description</span>
  </div>
  <div class="radio-control">
    <div class="radio-control__dot"></div>
  </div>
</div>
```

---

## Usage

### Radio Control (standalone)
```html
<!-- Default -->
<div class="radio-control">
  <div class="radio-control__dot"></div>
</div>

<!-- Selected -->
<div class="radio-control radio-control--selected">
  <div class="radio-control__dot"></div>
</div>

<!-- Disabled -->
<div class="radio-control radio-control--disabled">
  <div class="radio-control__dot"></div>
</div>

<!-- Disabled Selected -->
<div class="radio-control radio-control--disabled-selected">
  <div class="radio-control__dot"></div>
</div>
```

### Radio Item
```html
<div class="radio-item">
  <div class="radio-control is-selected">
    <div class="radio-control__dot"></div>
  </div>
  <span class="radio-item__label">Option label</span>
</div>
```

### Radio Item Boxed
```html
<div class="radio-item-boxed is-selected">
  <div class="radio-control is-selected">
    <div class="radio-control__dot"></div>
  </div>
  <div class="radio-item-boxed__text">
    <span class="radio-item-boxed__label">Label</span>
    <span class="radio-item-boxed__description">Supporting text</span>
  </div>
</div>
```

### Radio Item Boxed — Illustration
```html
<div class="radio-item-boxed radio-item-boxed--illus is-selected">
  <div class="radio-item-boxed__illus"></div>
  <div class="radio-item-boxed__text">
    <span class="radio-item-boxed__label">Label</span>
    <span class="radio-item-boxed__description">Supporting text</span>
  </div>
  <div class="radio-control is-selected">
    <div class="radio-control__dot"></div>
  </div>
</div>
```
