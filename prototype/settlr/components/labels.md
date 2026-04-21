# Labels (Status Badges)

**Figma ID:** `75:4093` | **Variants:** 15

## Changelog
### 2026-03-20
- **Badge audit** (node `75:4093`): fixed 5 token mismatches found by comparing Figma variable aliases to semantic.css
- Fixed `--label-error-fg`: `coral/600` → `coral/700` (Figma: `#5c271b`)
- Fixed `--label-warning-bg`: `yellow/50` → `yellow/100` (Figma: `#fff1b0`)
- Fixed `--label-info-bg`: `jay/50` → `jay/100` (Figma: `#c8e3ec`)
- Fixed Info fg Figma binding: all 3 Info text nodes (SM/MD/LG) rebound from broken external-library variable `color/status/info/text` → `label/info/fg` (jay/600)
- Fixed SM size: `12px medium` → `10px semibold` (Label/Label-XS — matches Figma)
- Removed hardcoded heights (`20px`, `28px`, `40px`) — badges now hug content via padding
- Tokenized all hardcoded px values: `padding`, `gap`, `font-size` now use CSS custom properties
- Added **Expense Status** text-only variant (node `217:16307`): `.label--expense` + `.label--owe` / `.label--lent` / `.label--settled`
- Created `expense/settled/fg` → `color/neutral/500` in Figma Component collection
- Bound Settled text node to `expense/settled/fg` variable (was using primitive directly)
- Added `--expense-settled-fg` semantic token to `tokens/semantic.css`

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| Status | VARIANT | Success, Warning, Error, Info, Default |
| Size | VARIANT | SM, MD, LG |
| Icon Left | BOOLEAN | true/false |
| Icon Right | BOOLEAN | true/false |

## Layout
- **Direction:** Horizontal
- **Alignment:** Center / Center
- **Corner Radius:** 9999px (full pill)

## Size Specs
| Size | Padding V | Padding H | Gap | Icon | Text Style |
|------|-----------|-----------|-----|------|-----------|
| SM | `--spacing-2` (2px) | `--spacing-8` (8px) | `--spacing-2` | `--icon-xs` (16px) | Label/Label-XS — 10px semibold |
| MD | `--spacing-4` (4px) | `--spacing-12` (12px) | `--spacing-8` | `--icon-sm` (20px) | Label/Label-MD — 14px semibold |
| LG | `--spacing-8` (8px) | `--spacing-16` (16px) | `--spacing-8` | `--icon-md` (24px) | Label/Label-LG — 16px semibold |

Height is hugged by content — no fixed height set.

## Color Specs
| Status | Background | Foreground |
|--------|-----------|------------|
| Success | `--label-success-bg` (green/100) | `--label-success-fg` (green/600) |
| Warning | `--label-warning-bg` (yellow/100) | `--label-warning-fg` (yellow/600) |
| Error | `--label-error-bg` (coral/100) | `--label-error-fg` (coral/700) |
| Info | `--label-info-bg` (jay/100) | `--label-info-fg` (jay/600) |
| Default | `--label-neutral-bg` (gray/100) | `--label-neutral-fg` (gray/700) |

---

## Expense Status Labels `217:16307`

Text-only labels (no background, no pill) used inline in expense list items and contact list items.

### Variants
| Variant | Text | Color Token | Primitive |
|---------|------|-------------|-----------|
| You owe | "You owe" | `--expense-owe-fg` | coral/500 |
| You Lent | "You Lent" | `--expense-lent-fg` | green/500 |
| Settled | "Settled" | `--expense-settled-fg` | neutral/500 |

### Typography
Label/Label-XS — 10px, semibold (`--font-size-10`, `--weight-semibold`), `line-height: normal`

### CSS
```html
<span class="label label--expense label--owe">You owe</span>
<span class="label label--expense label--lent">You lent</span>
<span class="label label--expense label--settled">Settled</span>
```

The `.label--expense` modifier removes background, padding, height, and border-radius. The color modifier (`.label--owe`, `.label--lent`, `.label--settled`) applies the text color.
