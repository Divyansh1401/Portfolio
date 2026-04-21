# Avatar Stack

**Figma node (Item):** `209:15922`
**Figma node (Stack):** `209:16013`
**CSS file:** `css/avatar-stack.css`
**Class prefix:** `.avatar-stack`

---

## Variants

### Avatar Stack / Item
| Variant | Description |
|---------|-------------|
| `Size=XS, Type=Initials` | 20px circle, olive bg, initials text |
| `Size=SM, Type=Initials` | 28px circle, olive bg, initials text |
| `Size=MD, Type=Initials` | 40px circle, olive bg, initials text |
| `Size=XS, Type=Overflow` | 20px circle, gray/100 bg, +N text |
| `Size=SM, Type=Overflow` | 28px circle, gray/100 bg, +N text |
| `Size=MD, Type=Overflow` | 40px circle, gray/100 bg, +N text |

### Avatar Stack
| Variant | Members |
|---------|---------|
| `Size=XS/SM/MD, Members=2` | 2 initials |
| `Size=XS/SM/MD, Members=3` | 3 initials |
| `Size=XS/SM/MD, Members=4` | 4 initials |
| `Size=XS/SM/MD, Members=3+` | 3 initials + overflow bubble |

---

## Overlap per size

| Size | Dimensions | Overlap (negative gap) |
|------|-----------|------------------------|
| XS | 20×20 | -5px |
| SM | 28×28 | -8px |
| MD | 40×40 | -12px |

---

## Colors

| Element | Token | Value |
|---------|-------|-------|
| Initials bg | `contact/avatar/bg` → olive/200 | `#BFCB9A` |
| Initials fg | `contact/avatar/fg` → olive/600 | `#31401A` |
| Overflow bg | `color/gray/100` | `#ECEFF1` |
| Overflow fg | `color/neutral/600` | `#756C55` |
| Border (gap) | `color/gray/0` | `#FFFFFF`, 2px outside |

---

## Usage

```html
<!-- XS stack with label (group header) -->
<div class="avatar-stack-group">
  <div class="avatar-stack avatar-stack--xs">
    <div class="avatar-stack__item">RK</div>
    <div class="avatar-stack__item">PS</div>
    <div class="avatar-stack__item">AJ</div>
    <div class="avatar-stack__overflow">+5</div>
  </div>
  <span class="avatar-stack-group__label">8 members</span>
</div>

<!-- MD standalone -->
<div class="avatar-stack avatar-stack--md">
  <div class="avatar-stack__item">RK</div>
  <div class="avatar-stack__item">PS</div>
  <div class="avatar-stack__item">AJ</div>
</div>
```
