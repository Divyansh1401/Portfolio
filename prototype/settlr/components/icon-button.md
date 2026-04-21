# Icon Button

**Figma ID:** `151:9927` | **Variants:** 3

## Changelog
### 2026-03-20
- Fixed semantic token aliases: `button/icon/bg` → neutral/100, `button/icon/fg` → neutral/900
- Bound padding to spacing tokens (SM: spacing-12, MD: spacing-16, LG: spacing-20)
- Bound corner radius to radius-full on all variants
- Bound icon Vector fills to `button/icon/fg` variable
- Removed hardcoded width/height from CSS — size is defined by padding + icon (hug)
- Added icon `color: currentColor` inheritance rule

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| Size | VARIANT | SM, MD, LG |

## Layout
- **Direction:** Horizontal
- **Alignment:** Center / Center
- **Corner Radius:** `--radius-full` (9999px — circle)
- **Sizing:** Hug content — size defined by padding + icon

## Size Specs
| Size | Padding (all sides) | Icon Size | Resulting Size |
|------|---------------------|-----------|----------------|
| SM | `--spacing-12` | `--icon-sm` (16px) | 40×40px |
| MD | `--spacing-16` | `--icon-md` (20px) | 52×52px |
| LG | `--spacing-20` | `--icon-lg` (24px) | 64×64px |

## Color Specs
| Property | Token | Value |
|----------|-------|-------|
| Background | `--btn-icon-bg` | neutral/100 |
| Icon color | `--btn-icon-fg` | neutral/900 |
