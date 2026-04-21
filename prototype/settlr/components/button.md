# Button

**Figma ID:** `96:7064` | **Variants:** 21

## Changelog
### 2026-03-20
- Removed explicit fixed heights — size is now defined by padding + content (hug)
- Fixed SM content gap to 4px (was 8px)
- Added LG letter-spacing: -0.16px (matches text-title-md)
- All font-size and line-height values now reference tokens
- Icon color explicitly set to `currentColor` (inherits from button text color)

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| Variant | VARIANT | Primary, Secondary, Ghost, Destructive |
| Size | VARIANT | SM, MD, LG |
| State | VARIANT | Default, Pressed |
| Left button | BOOLEAN | true/false |
| Right button | BOOLEAN | true/false |
| label | BOOLEAN | true/false |

## Layout
- **Direction:** Horizontal
- **Alignment:** Center / Center
- **Corner Radius:** `--radius-full` (9999px)
- **Sizing:** Hug content (both axes) — no fixed height or width

## Size Specs
| Size | Padding V | Padding H | Gap | Text Style | Font Size | Line Height | Icon Size |
|------|-----------|-----------|-----|------------|-----------|-------------|-----------|
| SM | `--spacing-8` | `--spacing-12` | `--spacing-4` | text-title-xs | `--font-size-12` | `--line-height-18` | `--icon-sm` |
| MD | `--spacing-12` | `--spacing-16` | `--spacing-8` | text-title-sm | `--font-size-14` | `--line-height-20` | `--icon-md` |
| LG | `--spacing-12` | `--spacing-20` | `--spacing-8` | text-title-md | `--font-size-16` | `--line-height-24` | `--icon-lg` |

## Color Specs
| Variant | BG Default | BG Pressed | Foreground |
|---------|-----------|-----------|------------|
| Primary | `--btn-primary-bg` (olive/600) | `--btn-primary-bg-pressed` (olive/700) | `--btn-primary-fg` (white) |
| Secondary | `--btn-secondary-bg` (olive/200) | `--btn-secondary-bg-pressed` (olive/300) | `--btn-secondary-fg` (olive/700) |
| Ghost | transparent | — | `--btn-ghost-fg` (olive/600) |
| Destructive | `--btn-destructive-bg` (coral/400) | `--btn-destructive-bg-pressed` (coral/500) | `--btn-destructive-fg` (white) |

## Token Mapping
| Property | Token |
|----------|-------|
| Border radius | `--radius-full` |
| Font family | `--font-body` |
| Disabled opacity | `--opacity-disabled` |
| Icon color | `currentColor` (inherits button foreground) |

## Notes
- Ghost variant has **no padding, no background** — auto-sizes both axes
- Icons inherit color from the button's foreground token via `currentColor`
- Full-width: add `.btn--full` for `width: 100%`
- LG only: `letter-spacing: -0.16px`
- No Ghost pressed state (matches Figma)
