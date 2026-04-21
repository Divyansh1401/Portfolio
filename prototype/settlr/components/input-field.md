# Input Field

**Figma ID:** `75:4729` | **Variants:** 5
**CSS file:** `css/input-field.css`
**Class prefix:** `.input-field`

## Changelog
### 2026-03-20
- Fixed `border-radius`: `var(--radius-8)` → `var(--radius-full)` (pill shape — matches Figma `radius/9999`)
- Fixed padding: `8px 12px` → `var(--spacing-12) var(--spacing-16)` (V=12, H=16)
- Fixed inner gap: `var(--spacing-8)` → `var(--spacing-4)` (icon-to-text gap is 4px)
- Fixed label: `12px / 19px` → `var(--font-size-10) / var(--line-height-14)` (Figma: 10px regular)
- Fixed helper: `11px / 17px` → `var(--font-size-10) / var(--line-height-14)` (Figma: 10px regular)
- Tokenized input text: `14px` → `var(--font-size-14)`, `23px` → `var(--line-height-23)`
- Shared `--input-*` tokens with OTP and Search Field

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| Property 1 | VARIANT | Empty, Active, Filled, Error, Disabled |
| Title | BOOLEAN | true/false |
| Description | BOOLEAN | true/false |
| Right Icon | BOOLEAN | true/false |
| Left Icon | BOOLEAN | true/false |

---

## Layout
- **Direction:** Vertical
- **Gap:** `--spacing-4` (4px) between label → input box → helper
- **Input box padding:** `--spacing-12` V × `--spacing-16` H (12px top/bottom, 16px left/right)
- **Input box inner gap:** `--spacing-4` (4px) between icon and text
- **Corner Radius:** `--radius-full` (9999px — pill)
- **Border:** `--border-small` (1px) default, `--border-large` (2px) on focus/active

---

## State Specs
| State | Background | Border | Text Color | Helper Color |
|-------|-----------|--------|-----------|-------------|
| Empty | `--input-bg` (neutral/100) | `--input-border-default` (neutral/300) | `--input-fg-default` (neutral/400) | `--input-helper` (neutral/500) |
| Active | `--input-bg-focused` (white) | `--input-border-focused` (olive/600) | `--input-fg-active` (neutral/900) | `--input-helper` (neutral/500) |
| Filled | `--input-bg` (neutral/100) | `--input-border-default` (neutral/300) | `--input-fg-active` (neutral/900) | `--input-helper` (neutral/500) |
| Error | `--input-bg-error` (coral/50) | `--input-border-error` (coral/400) | `--input-fg-active` (neutral/900) | `--input-helper-error` (coral/600) |
| Disabled | `--input-bg` (neutral/100) | none (transparent) | `--input-fg-default` (neutral/400) | — |

---

## Typography
| Element | Size | Weight | Line Height | Color Token |
|---------|------|--------|-------------|-------------|
| Label | `--font-size-10` (10px) | regular | `--line-height-14` | `--input-label` |
| Input text | `--font-size-14` (14px) | regular | `--line-height-23` | `--input-fg-active` |
| Placeholder | `--font-size-14` (14px) | regular | `--line-height-23` | `--input-fg-default` |
| Helper | `--font-size-10` (10px) | regular | `--line-height-14` | `--input-helper` |

---

## Token Sharing
Input Field, Search Field, and OTP all share the same `--input-*` semantic tokens for colors and layout, ensuring visual consistency across all form controls.

---

## Usage
```html
<div class="input-field">
  <label class="input-field__label">Field title</label>
  <div class="input-field__box">
    <svg class="input-field__icon"><!-- icon --></svg>
    <input type="text" placeholder="Input Field Text" />
  </div>
  <span class="input-field__helper">Sub-line for description</span>
</div>

<!-- Error state -->
<div class="input-field input-field--error">
  <label class="input-field__label">Field title</label>
  <div class="input-field__box">
    <input type="text" value="Input Field Text" />
  </div>
  <span class="input-field__helper">Error message displayed here</span>
</div>

<!-- Disabled state -->
<div class="input-field input-field--disabled">
  <label class="input-field__label">Field title</label>
  <div class="input-field__box">
    <input type="text" placeholder="Input Field Text" disabled />
  </div>
</div>
```
