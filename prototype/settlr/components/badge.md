# Badge

A pill-shaped status indicator. Used to communicate a semantic state (success, warning, error, info) or a neutral default. Supports three sizes and optional left/right icons.

**Figma node:** `75:4093` (Component Set "Badge", file `eEoeGLJO7fTeV2gD7CjVZ2`)
**CSS file:** `css/badge.css`
**Class prefix:** `.badge`

---

## Variants

### Size × Status matrix

| Size | Statuses |
|------|----------|
| SM   | success · warning · error · info · default |
| MD   | success · warning · error · info · default |
| LG   | success · warning · error · info · default |

---

## Sizes

| Size | Font    | Padding (V/H)  | Gap    | Icon size |
|------|---------|---------------|--------|-----------|
| SM   | 10px    | 2px / 8px     | 2px    | 16px (`--icon-sm`) |
| MD   | 14px    | 4px / 12px    | 8px    | 20px (`--icon-md`) |
| LG   | 16px    | 8px / 16px    | 8px    | 24px (`--icon-lg`) |

All sizes: `font-weight: semibold`, `border-radius: full`, `font-family: Plus Jakarta Sans`.

---

## Color tokens

Badge reuses the `label/*` semantic tokens (as defined in Figma). No separate `badge/*` tokens exist.

| Status  | Background token       | Foreground token       |
|---------|------------------------|------------------------|
| success | `--label-success-bg`   | `--label-success-fg`   |
| warning | `--label-warning-bg`   | `--label-warning-fg`   |
| error   | `--label-error-bg`     | `--label-error-fg`     |
| info    | `--label-info-bg`      | `--label-info-fg`      |
| default | `--label-neutral-bg`   | `--label-neutral-fg`   |

---

## Usage

### Base class
Always apply `.badge` + a size modifier + a status modifier.

```html
<!-- SM -->
<span class="badge badge--sm badge--success">Success</span>
<span class="badge badge--sm badge--warning">Warning</span>
<span class="badge badge--sm badge--error">Error</span>
<span class="badge badge--sm badge--info">Info</span>
<span class="badge badge--sm badge--default">Default</span>

<!-- MD -->
<span class="badge badge--md badge--success">Success</span>

<!-- LG -->
<span class="badge badge--lg badge--error">Error</span>
```

### With icons

Icons are hidden by default. Add `.badge--has-icon-left` and/or `.badge--has-icon-right` to reveal them.

```html
<span class="badge badge--md badge--success badge--has-icon-left">
  <svg class="badge__icon badge__icon-left" ...></svg>
  Paid
</span>

<span class="badge badge--md badge--error badge--has-icon-right">
  Overdue
  <svg class="badge__icon badge__icon-right" ...></svg>
</span>
```

---

## Rules

- Always combine `.badge` with exactly **one** size modifier and **one** status modifier.
- Never hardcode colors — use the `--label-*` semantic tokens via the status modifier class.
- Icons are optional; add `.badge--has-icon-left` / `.badge--has-icon-right` only when needed.
- Do not use Badge where Label is already correct — use Badge for larger, more prominent status display.
