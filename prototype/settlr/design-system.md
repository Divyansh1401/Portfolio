# Settlr Design System — Full Token & Component Inventory

## Variable Collections (8 collections, 205 total variables)

### Primitives (72 color tokens)
| Family | Shades | Example 50 → 900 |
|--------|--------|-------------------|
| neutral | 50–900 (10) | rgb(254,249,238) → rgb(26,24,16) — warm beige tones |
| gray | 0–1000 (12) | rgb(255,255,255) → rgb(0,0,0) — pure neutrals |
| olive | 50–900 (10) | rgb(242,244,235) → rgb(10,16,5) — brand green |
| green | 50–900 (10) | rgb(232,250,240) → rgb(9,26,13) — success/lent |
| coral | 50–900 (10) | rgb(251,240,238) → rgb(28,11,7) — error/owe |
| yellow | 50–900 (10) | rgb(255,250,232) → rgb(28,19,2) — warning |
| jay | 50–900 (10) | rgb(235,244,247) → rgb(2,10,14) — info/blue |

### Spacing (10 tokens, collection: "Spacing")
| Token | Value | Variable ID |
|-------|-------|-------------|
| spacing/2 | 2px | VariableID:10:1516 |
| spacing/4 | 4px | VariableID:10:1517 |
| spacing/8 | 8px | VariableID:10:1518 |
| spacing/12 | 12px | VariableID:10:1519 |
| spacing/16 | 16px | VariableID:10:1520 |
| spacing/20 | 20px | VariableID:10:1521 |
| spacing/24 | 24px | VariableID:10:1522 |
| spacing/32 | 32px | VariableID:10:1523 |
| spacing/48 | 48px | VariableID:10:1524 |
| spacing/64 | 64px | VariableID:10:1525 |

### Other Collections
- **Radius**: 11 tokens
- **Opacity**: 5 tokens
- **Overlay**: 5 tokens
- **Border**: 3 tokens
- **Icon**: 5 tokens

---

## Component Tokens (94 tokens, collection: "Component")
All are VARIABLE_ALIAS referencing primitives.

### Buttons
| Token | Alias |
|-------|-------|
| button/primary/bg/default | olive/600 |
| button/primary/bg/pressed | olive/700 |
| button/primary/fg | gray/0 |
| button/secondary/bg/default | olive/200 |
| button/secondary/bg/pressed | olive/300 |
| button/secondary/fg | olive/700 |
| button/ghost/fg | olive/600 |
| button/destructive/bg/default | coral/400 |
| button/destructive/bg/pressed | coral/500 |
| button/destructive/fg | gray/0 |
| button/icon/bg | olive/700 |
| button/icon/fg | gray/0 |

### Chips
| Token | Alias |
|-------|-------|
| chip/off/bg | neutral/100 |
| chip/off/border | neutral/300 |
| chip/off/fg | neutral/800 |
| chip/on/bg | olive/600 |
| chip/on/border | olive/600 |
| chip/on/fg | gray/0 |

### Labels (Status)
| Token | Alias |
|-------|-------|
| label/success/bg, fg | green/100, green/600 |
| label/warning/bg, fg | yellow/50, yellow/600 |
| label/error/bg, fg | coral/100, coral/600 |
| label/info/bg, fg | jay/50, jay/600 |
| label/neutral/bg, fg | gray/100, gray/700 |

### Input Fields
| Token | Alias |
|-------|-------|
| input/bg/default | neutral/100 |
| input/bg/focused | gray/0 |
| input/bg/error | coral/50 |
| input/text/default | neutral/400 |
| input/text/active | neutral/900 |
| input/border/default | neutral/300 |
| input/border/focused | olive/600 |
| input/border/error | coral/400 |
| input/label | neutral/700 |
| input/helper | neutral/500 |
| input/helper/error | coral/600 |

### Radio/Checkbox Controls
| Token | Alias |
|-------|-------|
| control/bg/default | transparent |
| control/bg/selected | olive/600 |
| control/bg/disabled | gray/100 |
| control/bg/disabled-selected | gray/300 |
| control/border/default | neutral/300 |
| control/border/selected | olive/600 |
| control/border/disabled | gray/200 |
| control/dot | gray/0 |
| control/label | neutral/800 |
| control/description | neutral/500 |
| control/label/disabled | gray/400 |
| container/bg/default | gray/0 |
| container/bg/selected | olive/50 |
| container/border/default | neutral/300 |
| container/border/selected | olive/600 |
| container/border/disabled | gray/200 |

### Tabs / Segment Control
| Token | Alias |
|-------|-------|
| tab/bg/track | neutral/200 |
| tab/bg/active | gray/0 |
| tab/border/active | neutral/300 |
| tab/fg/active | neutral/900 |
| tab/fg/default | neutral/600 |
| tab/fg/disabled | neutral/300 |

### Sheet/Modal
| Token | Alias |
|-------|-------|
| sheet/bg | neutral/50 |
| sheet/border | olive/600 |
| sheet/header | neutral/900 |
| sheet/icon | neutral/900 |
| slot/bg | neutral/200 |
| slot/divider | neutral/300 |

### Contact / Person Item
| Token | Alias |
|-------|-------|
| contact/bg/default | gray/0 |
| contact/bg/selected | olive/50 |
| contact/avatar/bg | olive/200 |
| contact/avatar/fg | olive/600 |
| contact/name | neutral/900 |
| contact/subtext | neutral/600 |
| contact/icon | neutral/700 |
| contact/divider | neutral/300 |

### FAB
| Token | Alias |
|-------|-------|
| fab/bg | olive/300 |
| fab/fg | olive/700 |

### Navigation Bar
| Token | Alias |
|-------|-------|
| nav/bar/bg | gray/0 |
| nav/tab/bg/active | gray/200 |
| nav/tab/fg/active | neutral/900 |
| nav/tab/fg/default | neutral/900 |

### List Items
| Token | Alias |
|-------|-------|
| list/remove/bg | coral/100 |
| list/remove/fg | coral/500 |

### Expense Tracking
| Token | Alias |
|-------|-------|
| expense/lent/fg | green/500 |
| expense/lent/bg | green/100 |
| expense/owe/fg | coral/500 |
| expense/owe/bg | coral/100 |

### Card / Group
| Token | Alias |
|-------|-------|
| card/group/owe/border | coral/100 |
| card/group/lent/border | green/100 |
| card/group/image/bg | gray/200 |
| card/create/bg | olive/50 |
| card/create/icon/bg | olive/100 |
| card/create/fg | olive/500 |
| card/create/border | olive/200 |

---

## Text Styles (32 total, Plus Jakarta Sans unless noted)

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Display/Display-XL | Unbounded | 64px | Black |
| Display/Display-LG | Unbounded | 48px | Black |
| Display/Display-MD | Unbounded | 36px | Bold |
| Display/Display-SM | Unbounded | 28px | Bold |
| Display/Display-XS | Unbounded | 24px | Bold |
| Heading/Heading-XL | Unbounded | 28px | Black |
| Heading/Heading-LG | Unbounded | 24px | Black |
| Heading/Heading-MD | Unbounded | 20px | Bold |
| Heading/Heading-SM | Unbounded | 18px | Bold |
| Heading/Heading-XS | Unbounded | 16px | Bold |
| Title/Title-LG | Plus Jakarta Sans | 18px | SemiBold |
| Title/Title-MD | Plus Jakarta Sans | 16px | SemiBold |
| Title/Title-SM | Plus Jakarta Sans | 14px | SemiBold |
| Title/Title-XS | Plus Jakarta Sans | 13px | SemiBold |
| Body/Body-LG | Plus Jakarta Sans | 16px | Regular |
| Body/Body-MD | Plus Jakarta Sans | 14px | Regular |
| Body/Body-SM | Plus Jakarta Sans | 13px | Regular |
| Body/Body-XS | Plus Jakarta Sans | 12px | Regular |
| Label/Label-LG | Plus Jakarta Sans | 16px | SemiBold |
| Label/Label-MD | Plus Jakarta Sans | 14px | SemiBold |
| Label/Label-XS | Plus Jakarta Sans | 12px | Medium |
| Caption/Caption-MD | Plus Jakarta Sans | 12px | Regular |
| Caption/Caption-SM | Plus Jakarta Sans | 11px | Regular |
| Overline/Overline-LG | Plus Jakarta Sans | 12px | SemiBold |
| Overline/Overline-MD | Plus Jakarta Sans | 11px | Medium |
| Overline/Overline-SM | Plus Jakarta Sans | 10px | Medium |
| Amount/Amount-XL | Unbounded | 48px | Regular |
| Amount/Amount-LG | Unbounded | 36px | Regular |
| Amount/Amount-MD | Unbounded | 24px | Regular |
| Amount/Amount-SM | Unbounded | 18px | Regular |
| Amount/Amount-XS | Unbounded | 13px | Regular |
| Amount/Amount-XXS | Unbounded | 13px | Regular |

---

## Built Components (on Components Final page)

### Buttons / Chips section (128:9136)
| Component | ID | Variants |
|-----------|-----|----------|
| Button | 96:7064 | 21 variants (Primary/Secondary/Ghost/Destructive × Default/Pressed/Disabled + sizes) |
| Chip | 98:7939 | 6 variants |
| Icon Button | 151:9927 | 3 variants (Size=SM/MD/LG) |

### Inputs section (128:9140)
| Component | ID | Variants |
|-----------|-----|----------|
| Input Fields | 75:4729 | 5 variants |

### Forms section (128:9142)
| Component | ID | Variants |
|-----------|-----|----------|
| Forms / Input / OTP / Digit | 75:4855 | 5 variants |
| Forms / Input / OTP / 6 Digit | 75:4866 | 5 variants |
| Forms / Radio / Control | 75:4927 | 4 variants |
| Forms / Radio / Item | 75:4938 | 4 variants |
| Forms / Radio / Item Boxed | 75:4960 | 4 variants |

### Labels & Badges section (128:9144)
| Component | ID | Variants |
|-----------|-----|----------|
| Labels | 75:4093 | 15 variants |

### Avatars section (128:9146)
| Component | ID | Variants |
|-----------|-----|----------|
| Avatar | 84:5841 | 8 variants |

### List Items section (128:9148)
| Component | ID | Variants |
|-----------|-----|----------|
| List / Person Item | 140:9645 | 5 variants (Action=Chevron/Radio/Checkbox/Input/None) |
| List / Expense Item | 148:9834 | 4 variants (State×Balance) + Show Comment boolean — 393×64 |

### Cards section (128:9150)
| Component | ID | Variants |
|-----------|-----|----------|
| Card / Group Item | 151:9925 | 2 variants (Balance=Lent/Owe) |
| Card / Create New Group | 151:9859 | 1 variant |

### Navigation section (128:9154)
| Component | ID | Variants |
|-----------|-----|----------|
| Bottom Nav Bar | 130:9281 | 3 variants (Active=Home/People/Activity) |
| Navigation / Tabs / Segment / Item | 135:9343 | 3 variants |

### Utilities section (128:9160)
| Component | ID | Variants |
|-----------|-----|----------|
| FAB | 130:9213 | 1 variant (64×64, glassmorphism) |

### Placeholders section (93:6726)
| Component | ID | Description |
|-----------|-----|-------------|
| Illustration | 138:9447 | 40×40 rounded gray placeholder |

### Icon Components (shared across system)
| Component | ID | Size |
|-----------|-----|------|
| Icon small cont | 84:6233 | 16×16 |
| Icon mid Cont | 84:6234 | 20×20 |
| Icon large cont | 84:6235 | 24×24 |

---

## Remaining Components to Build
1. Top App Bar — back arrow + title + optional right action
2. Settlement Item — avatar + name + amount + action buttons
3. Group Detail Header — group image + name + member avatars
4. Friend Detail Header — large avatar + name + total owed
5. Action Button Row — "Add Expense" + "Settle Up" buttons
6. Split Mode Selector — tab-style: Equally / Amount / Percentage / Shares
7. Toggle — on/off switch
8. Expense Detail Card — category + amount + currency
9. Currency Badge — flag + currency code
10. Banner / Image Upload — group creation placeholder
11. Empty State — placeholder for empty lists
