# Chip

**Figma ID:** `98:7939` | **Variants:** 6

## Changelog
### 2026-03-20
- Removed fixed heights — size is now defined by padding + content (hug)
- Snapped padding/gap values to nearest spacing tokens (original values 6/10/14/18px not in scale)
- SM padding: 6/10px → `--spacing-8`/`--spacing-12`
- MD padding: 8/14px → `--spacing-8`/`--spacing-16`
- LG padding: 10/18px → `--spacing-12`/`--spacing-20`
- SM/MD gap: 6px → `--spacing-4`; LG gap: 8px → `--spacing-8`
- Fixed SM font-weight: medium → semibold (matches text-title-xs)
- Fixed LG font-weight: semibold → bold (matches text-title-md)
- Added line-height tokens (18/20/24px) for all sizes
- Bound icon Vector fills to chip fg variable (icons now inherit correct color)

---

## Properties
| Property | Type | Options |
|----------|------|---------||
| Size | VARIANT | SM, MD, LG |
| On | VARIANT | true, false |

## Layout
- **Direction:** Horizontal
- **Alignment:** Center / Center
- **Corner Radius:** 9999px (full pill) — `--radius-full`
- **Border:** 1px solid — `--border-small`
- **Sizing:** Hug content (both axes) — no fixed height or width

## Size Specs
| Size | Padding V | Padding H | Gap | Text Style | Font Size | Line Height |
|------|-----------|-----------|-----|------------|-----------|-------------|
| SM | `--spacing-8` | `--spacing-12` | `--spacing-4` | text-title-xs | `--font-size-12` | `--line-height-18` |
| MD | `--spacing-8` | `--spacing-16` | `--spacing-4` | text-title-sm | `--font-size-14` | `--line-height-20` |
| LG | `--spacing-12` | `--spacing-20` | `--spacing-8` | text-title-md | `--font-size-16` | `--line-height-24` |

## Color Specs
| State | Background | Border | Foreground |
|-------|-----------|--------|------------|
| Off | `--chip-bg-off` (neutral/100) | `--chip-border-off` (neutral/300) | `--chip-fg-off` (neutral/800) |
| On | `--chip-bg-on` (olive/600) | `--chip-border-on` (olive/600) | `--chip-fg-on` (white) |

## Token Mapping
| Property | Token |
|----------|-------|
| Border radius | `--radius-full` |
| Border width | `--border-small` |
| Font family | `--font-body` |
| Icon color | `currentColor` (inherits chip foreground) |
