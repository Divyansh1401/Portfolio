# Type Chip

**Figma ID:** `241:19118` (Section with 2 frames — Off, On)

## Changelog
### 2026-03-20
- New component — group/expense type selection tile
- Created 6 semantic tokens: `type-chip/bg/off`, `type-chip/border/off`, `type-chip/fg/off`, `type-chip/bg/on`, `type-chip/border/on`, `type-chip/fg/on`
- All tokens bound in Figma (fills, strokes, stroke-weight, padding, gap, radius)
- Gap snapped: 5px → `--spacing-4` (4px, nearest in scale)
- Illustration area is a placeholder (`--icon-xl` × `--icon-xl`) — illustration TBD

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| State | CLASS | default (off), `.is-selected` (on) |

## Layout
- **Direction:** Vertical (column)
- **Alignment:** Center
- **Corner Radius:** `--radius-12`
- **Sizing:** Hug content
- **Gap:** `--spacing-4`
- **Padding:** `--spacing-12` all sides

## Color Specs
| State | Background | Border | Border Width | Text |
|-------|-----------|--------|--------------|------|
| Off | `--type-chip-bg-off` (neutral/50) | `--type-chip-border-off` (neutral/400) | `--border-small` (1px) | `--type-chip-fg-off` (neutral/800) |
| On | `--type-chip-bg-on` (olive/100) | `--type-chip-border-on` (olive/700) | `--border-large` (2px) | `--type-chip-fg-on` (neutral/900) |

## Illustration Placeholder
- Size: `--icon-xl` × `--icon-xl` (32×32px)
- Radius: `--radius-8`
- Background: `--color-neutral-200` (placeholder — illustration TBD)

## Label
- Font: `--font-body` (Plus Jakarta Sans)
- Size: `--font-size-10` (10px)
- Weight: `--weight-semibold` (600)
- Line height: `--line-height-14`
- Text style: Label/Label-XS
