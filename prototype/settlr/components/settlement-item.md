# Settlement Item

**Figma node:** `208:15867`
**CSS file:** `css/settlement-item.css`
**Class prefix:** `.settlement-item`

---

## Variants

| Variant | Balance | Button |
|---------|---------|--------|
| `Balance=Lent` | Owes you (green) | Remind (Secondary SM) |
| `Balance=Owe` | You owe (coral) | Settle Up (Primary SM) |

---

## Anatomy

```
┌─────────────────────────────────────────────┐  ← border-bottom contact/divider
│  [Avatar MD]  Name          [Single Button]  │
│               Amount                         │
└─────────────────────────────────────────────┘
```

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Width | 355px | — |
| Padding V | 12px | `spacing/12` |
| Padding H | 16px | `spacing/16` |
| Gap | 12px | `spacing/12` |
| Gap (text column) | 2px | — |
| Border bottom | 1px solid | `contact/divider` (neutral/300) |

---

## Colors & Typography

| Element | Style | Token |
|---------|-------|-------|
| Name | Label/Label-MD — Plus Jakarta Sans SemiBold 14px | `contact/name` (neutral/900) |
| Amount (owes you) | Amount/Amount-XS — Unbounded SemiBold 13px | `expense/lent/fg` → `color/green/500` |
| Amount (you owe) | Amount/Amount-XS — Unbounded SemiBold 13px | `expense/owe/fg` → `color/coral/500` |
| Avatar | MD (40px), initials | `contact/avatar/bg`, `contact/avatar/fg` |

---

## Buttons

| Variant | Button label | Button variant | Size |
|---------|-------------|----------------|------|
| Person Item (owes you) | Remind | Secondary | SM (36px) |
| Variant2 (you owe) | Settle Up | Primary | SM (36px) |

One button per item only — never combined.

---

## Usage

```html
<!-- Owes you → Remind -->
<div class="settlement-item">
  <div class="avatar avatar--md avatar--initials">JW</div>
  <div class="settlement-item__info">
    <span class="settlement-item__name">Johnnie Walker</span>
    <span class="settlement-item__amount settlement-item__amount--lent">Owes you ₹1200</span>
  </div>
  <button class="btn btn--sm btn--secondary">Remind</button>
</div>

<!-- You owe → Settle Up -->
<div class="settlement-item">
  <div class="avatar avatar--md avatar--initials">JW</div>
  <div class="settlement-item__info">
    <span class="settlement-item__name">Johnnie Walker</span>
    <span class="settlement-item__amount settlement-item__amount--owe">You Owe ₹1200</span>
  </div>
  <button class="btn btn--sm btn--primary">Settle Up</button>
</div>
```

---

## Notes

- Settled state not in this component — will be designed separately when needed
- Uses existing `.avatar`, `.btn` components — no new dependency
