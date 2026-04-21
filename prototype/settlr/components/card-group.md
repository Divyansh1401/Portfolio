# Card / Group Item

**Figma ID:** `151:9925` | **Variants:** 2

## Properties
| Property | Type | Options |
|----------|------|---------|
| Balance | VARIANT | Lent, Owe |

## Layout
- **Direction:** Vertical
- **Size:** 161×206
- **Corner Radius:** 8px
- **Padding:** 0 (structured internally)

## Structure
```
┌────────────────────┐
│   Image Area       │  ← card/group/image/bg (gray/200)
│   (top portion)    │
├────────────────────┤
│   Group Name       │  ← Title-SM
│   Member count     │  ← Caption-SM
│   Balance amount   │  ← Amount-XS (green or coral)
└────────────────────┘
```

## Colors
| Balance | Border |
|---------|--------|
| Lent | `--card-group-lent-border` (green/100) |
| Owe | `--card-group-owe-border` (coral/100) |

- **Image BG:** `--card-group-image-bg` (gray/200)

---

# Card / Create New Group

**Figma ID:** `151:9859` | **Variants:** 1

## Layout
- **Direction:** Vertical
- **Gap:** 10px
- **Size:** 160×200
- **Corner Radius:** 8px

## Colors
- **Background:** `--card-create-bg` (olive/50)
- **Border:** `--card-create-border` (olive/200) — dashed style
- **Icon BG:** `--card-create-icon-bg` (olive/100)
- **Text:** `--card-create-fg` (olive/500)
