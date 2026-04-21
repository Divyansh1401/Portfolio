# Checkbox Control

A 16×16 square checkbox with four states. Visually identical to Radio Control except for shape (rounded square instead of circle) and indicator (checkmark instead of dot).

**Figma node:** `268:8508` (Component Set "Forms / Checkbox / Control", file `eEoeGLJO7fTeV2gD7CjVZ2`)
**CSS file:** `css/checkbox.css`
**Class prefix:** `.checkbox-control`

---

## Variants

| State | Class modifiers | Background | Border | Check |
|-------|----------------|-----------|--------|-------|
| Default | — | transparent | `--control-border-default` (neutral/300) | hidden |
| Selected | `.is-selected` | `--control-bg-selected` (olive/600) | `--control-border-selected` (olive/600) | visible, white |
| Disabled | `.is-disabled` | `--control-bg-disabled` (gray/100) | `--control-border-disabled` (gray/200) | hidden |
| Disabled Selected | `.is-disabled .is-selected` | `--control-bg-disabled-selected` (gray/300) | `--control-border-disabled` (gray/200) | visible, white |

---

## Token usage

Reuses all `--control-*` tokens from Radio — no new tokens needed.

| Token | Value |
|-------|-------|
| `--control-bg-default` | transparent |
| `--control-bg-selected` | olive/600 |
| `--control-bg-disabled` | gray/100 |
| `--control-bg-disabled-selected` | gray/300 |
| `--control-border-default` | neutral/300 |
| `--control-border-selected` | olive/600 |
| `--control-border-disabled` | gray/200 |
| `--control-dot` | white (reused for checkmark color) |

---

## Shape

- **Size:** 16×16px
- **Border-radius:** `--radius-4` (4px) — distinguishes from circular radio
- **Border-width:** `--border-small` (1px)

---

## Usage

```html
<!-- Default -->
<div class="checkbox-control">
  <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
    <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>

<!-- Selected -->
<div class="checkbox-control is-selected">
  <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
    <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>

<!-- Disabled -->
<div class="checkbox-control is-disabled">
  <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
    <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>

<!-- Disabled Selected -->
<div class="checkbox-control is-disabled is-selected">
  <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
    <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
```

---

## In a person-item (checkbox action)

```html
<div class="person-item">
  <div class="avatar avatar--md">...</div>
  <div class="person-item__text">
    <span class="person-item__name">Alex</span>
    <span class="person-item__subtext">@alex</span>
  </div>
  <div class="person-item__action">
    <div class="checkbox-control is-selected">
      <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
        <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</div>
```

---

## Rules

- Always include the `.checkbox-control__check` SVG inside — it's hidden until `.is-selected` is added.
- Never skip `.is-disabled` when the control is non-interactive — it sets `pointer-events: none` and the correct visual state.
- Use `.checkbox-control` for multi-select contexts; use `.radio-control` for single-select (mutually exclusive) contexts.

---

# Checkbox Item

A horizontal row of Checkbox Control + label text. Mirrors `.radio-item` exactly.

**Figma node:** `271:8528` (Component Set "Forms / Checkbox / Item", file `eEoeGLJO7fTeV2gD7CjVZ2`)
**CSS file:** `css/checkbox.css`
**Class prefix:** `.checkbox-item`

---

## Variants

| State | Modifier | Label color |
|-------|----------|-------------|
| Default | — | `--control-label` |
| Selected | `.is-selected` | `--control-label` |
| Disabled | `.is-disabled` | `--control-label-disabled` |
| Disabled Selected | `.is-disabled .is-selected` | `--control-label-disabled` |

---

## Layout

- **Direction:** Horizontal
- **Alignment:** Center
- **Gap:** `--spacing-8` (8px)
- **Padding:** `--spacing-4` top/bottom, 0 left/right

---

## Usage

```html
<!-- Default -->
<div class="checkbox-item">
  <div class="checkbox-control">
    <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
      <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <span class="checkbox-item__label">Option label</span>
</div>

<!-- Selected -->
<div class="checkbox-item is-selected">
  <div class="checkbox-control is-selected">
    <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
      <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <span class="checkbox-item__label">Option label</span>
</div>

<!-- Disabled Selected -->
<div class="checkbox-item is-disabled is-selected">
  <div class="checkbox-control is-disabled is-selected">
    <svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">
      <polyline points="0,5 4,9 12,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <span class="checkbox-item__label">Option label</span>
</div>
```
