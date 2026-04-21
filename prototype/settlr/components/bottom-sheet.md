# Bottom Sheet

**Figma ID:** `75:4841` | **Standalone component**

## Layout
- **Size:** 360×350
- **Direction:** Vertical
- **Gap:** 0
- **Corner Radius:** 16px top-left, 16px top-right, 0 bottom

## Colors
- **Background:** `--sheet-bg` (neutral/50)
- **Top Border:** `--sheet-border` (olive/600) — 2px
- **Header Text:** `--sheet-header` (neutral/900) — Title-LG
- **Close Icon:** `--sheet-icon` (neutral/900)
- **Slot BG:** `--sheet-slot-bg` (neutral/200)
- **Divider:** `--sheet-divider` (neutral/300) — 1px

## Structure
```
┌─────────────────────────┐  ← 16px rounded corners top
│ ══ Handle bar ══        │  ← centered, slot/bg colored
├─────────────────────────┤
│ Header      [X close]   │  ← sheet/header + sheet/icon
├─────────────────────────┤  ← sheet/divider 1px
│                         │
│ Content area            │
│                         │
└─────────────────────────┘
```

## Usage
- Appears from bottom of screen
- Background overlay: `--overlay-50` (rgba 0,0,0,0.5)
