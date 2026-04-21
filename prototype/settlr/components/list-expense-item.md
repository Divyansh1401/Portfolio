# List / Expense Item

**Figma ID:** `148:9834` | **Variants:** 4

## Properties
| Property | Type | Options |
|----------|------|---------|
| State | VARIANT | Default, Pressed |
| Balance | VARIANT | Lent, Owe |
| Show Comment | BOOLEAN | true/false |

## Layout
- **Direction:** Horizontal
- **Gap:** 12px
- **Padding:** 12px top/bottom, 16px left/right
- **Size:** 393×64
- **Border:** 1px bottom — `--contact-divider`

## Structure
```
[ Illustration (40×40) ][ Text Column ][ Amount Column ]
                         ├─ Title       ├─ Amount (bold)
                         ├─ Subtitle    └─ Balance badge (Labels SM)
                         └─ Comment (optional)
```

## Text Styles
| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|------------|
| Title | Plus Jakarta Sans | 14px | SemiBold | intrinsic |
| Subtitle | Plus Jakarta Sans | 12px | Regular | 19px |
| Comment | Plus Jakarta Sans | 11px | Regular | 17px |
| Amount | Unbounded | 13px | SemiBold | 18px |

## Amount Column
- **Direction:** Vertical
- **Align:** flex-end (right-aligned)
- **Gap:** 4px

## Badge
- Uses **Labels** component (Size=SM, Status=Success for Lent / Status=Error for Owe)
- Padding: 2px top/bottom, 8px left/right
- Border radius: `--radius-full`
- Font: 12px Medium

## Colors
| State | Background |
|-------|-----------|
| Default | transparent |
| Pressed | `--contact-bg-selected` (olive/50) |

| Balance | Amount FG | Badge BG | Badge FG |
|---------|----------|----------|----------|
| Lent | `--expense-lent-fg` (green/500) | `--expense-lent-bg` (green/100) | `--expense-lent-fg` (green/500) |
| Owe | `--expense-owe-fg` (coral/500) | `--expense-owe-bg` (coral/100) | `--expense-owe-fg` (coral/500) |

## Notes
- Uses **Illustration** component (138:9447, 40×40) instead of Avatar
- Comment appears below Subtitle when `Show Comment = true`
- Pressed state is for touch feedback — uses same olive/50 as contact selected state
- Both Default states have no background fill (transparent)
