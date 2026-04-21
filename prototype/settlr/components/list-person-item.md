# List / Person Item

**Figma ID:** `140:9645` | **Variants:** 8
**CSS file:** `css/list-items.css`
**Class prefix:** `.person-item`

---

## Properties
| Property | Type | Options |
|----------|------|---------|
| Action | VARIANT | Chevron, Radio, Checkbox, Input, Lent, Owe, Settled, None |

## Layout
- **Direction:** Horizontal
- **Gap:** 12px
- **Padding:** 12px top/bottom, 16px left/right
- **Size:** 355×64

## Structure
```
[ Avatar (MD 40×40) ][ Text Column ][ Action ]
                      ├─ Name
                      └─ Subtext
```

---

## Colors
- **Background (default):** `--contact-bg-default` (white)
- **Background (selected):** `--contact-bg-selected` (olive/50)
- **Name:** `--contact-name` (neutral/900) — Title-SM
- **Subtext:** `--contact-subtext` (neutral/600) — Body-SM
- **Icon:** `--contact-icon` (neutral/700)
- **Divider:** `--contact-divider` (neutral/300) — 1px bottom border

---

## Action Variants

| Action | Right Element | Class modifier |
|--------|--------------|----------------|
| Chevron | Right-pointing chevron icon (neutral/700) | — |
| Radio | Radio Control component | — |
| Checkbox | Checkbox control | — |
| Input | Mini amount input box (120×40) | `.person-item--input` |
| Lent | Balance column: "You Lent" + green amount | `.person-item--lent` |
| Owe | Balance column: "You Owe" + coral amount | `.person-item--owe` |
| Settled | Balance column: "Settled" + muted amount | `.person-item--settled` |
| None | Nothing | — |

---

## Balance display (Lent / Owe / Settled)

Used when the right side shows a balance label and amount.

```html
<!-- Lent -->
<div class="person-item person-item--lent">
  <div class="avatar avatar--md">...</div>
  <div class="person-item__text">
    <span class="person-item__name">Alex</span>
    <span class="person-item__subtext">@alex</span>
  </div>
  <div class="person-item__balance">
    <span class="person-item__balance-label">You Lent</span>
    <span class="person-item__balance-amount">₹500</span>
  </div>
</div>

<!-- Owe -->
<div class="person-item person-item--owe">
  ...
  <div class="person-item__balance">
    <span class="person-item__balance-label">You Owe</span>
    <span class="person-item__balance-amount">₹200</span>
  </div>
</div>

<!-- Settled -->
<div class="person-item person-item--settled">
  ...
  <div class="person-item__balance">
    <span class="person-item__balance-label">Settled</span>
    <span class="person-item__balance-amount">₹0</span>
  </div>
</div>
```

### Balance token usage
| State | Amount color token | Value |
|-------|--------------------|-------|
| Lent | `--expense-lent-fg` | green/500 |
| Owe | `--expense-owe-fg` | coral/500 |
| Settled | `--contact-settled-fg` | neutral/400 |

---

## Amount Input (split row)

Used in split screens where each person has an editable amount.

```html
<div class="person-item person-item--input">
  <div class="avatar avatar--md">...</div>
  <div class="person-item__text">
    <span class="person-item__name">Alex</span>
    <span class="person-item__subtext">@alex</span>
  </div>
  <div class="person-item__input-box">
    <span>₹500</span>
    <svg class="person-item__input-icon">...</svg>
  </div>
</div>
```

Input box: 120×40px, `--input-bg` / `--input-border-default` / `--radius-8`, value text `--input-fg-default`.

---

## Rules

- Always place `.person-item--lent` / `--owe` / `--settled` when displaying balance info — never manually color amounts.
- The `.person-item__balance-amount` font is **Unbounded** (display) — always use `.font-display` / `var(--font-display)`.
- For the Input variant, use `.person-item__input-box` — do not reuse `.input-field` (different sizing).
- Only use `.chip.chip--sm` / avatar / radio within person items — no other embedded components.
