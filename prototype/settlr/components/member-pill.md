# Member Pill

A compact pill showing a member's avatar and name. Used in group creation and expense flows to display selected members, with an optional remove (×) action.

**Figma node:** `260:6943`
**CSS file:** `css/avatar.css`
**Class prefix:** `.member-pill`

---

## Variants

| Variant | Description |
|---------|-------------|
| `Removable=False` | Avatar + name only — used for display |
| `Removable=True` | Avatar + name + × icon — used when member can be removed |

---

## Layout

Both variants share the same base layout:

- **Direction:** Horizontal
- **Alignment:** Center
- **Gap:** `--spacing-2` (2px)
- **Padding:** `--spacing-4` top/bottom
- **Padding left:** `--spacing-4` (4px — tight against avatar)
- **Padding right:** `--spacing-8` (8px, non-removable) / `--spacing-4` (4px, removable)
- **Corner radius:** `--radius-full` (9999px — fully pill-shaped)
- **Background:** `--member-pill-bg` (neutral/100)

---

## Children

```
.member-pill
  ├── .avatar .avatar--sm .avatar--initials   (28×28)
  ├── .member-pill__name                      (12px Regular)
  └── .member-pill__remove                    (16×16, Removable=True only)
```

---

## Token Usage

| Element | Token | Value |
|---------|-------|-------|
| Pill background | `--member-pill-bg` | neutral/100 |
| Name text | `--member-pill-fg` | neutral/800 |
| Avatar background | `--contact-avatar-bg` | olive/200 |
| Avatar initials | `--contact-avatar-fg` | olive/600 |
| Remove icon | `--contact-subtext` | neutral/600 |
| Name font size | `--font-size-12` | 12px |
| Name line height | `--line-height-19` | 19px |
| Name weight | `--weight-regular` | 400 |
| Avatar size | SM — 28×28px | — |
| Avatar initials size | `--font-size-10` | 10px |
| Remove icon size | `--icon-sm` | 16px |

---

## Usage

### Non-removable (display only)

```html
<div class="member-pill">
  <div class="avatar avatar--sm avatar--initials">AB</div>
  <span class="member-pill__name">Ankit</span>
</div>
```

### Removable (with × action)

```html
<div class="member-pill">
  <div class="avatar avatar--sm avatar--initials">AB</div>
  <span class="member-pill__name">Ankit</span>
  <button class="member-pill__remove" aria-label="Remove Ankit">
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
</div>
```

### Horizontal group (member selection row)

```html
<div class="h-scroll" style="gap: var(--spacing-8)">
  <div class="member-pill">
    <div class="avatar avatar--sm avatar--initials">AB</div>
    <span class="member-pill__name">Ankit</span>
    <button class="member-pill__remove" aria-label="Remove Ankit">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
  <div class="member-pill">
    <div class="avatar avatar--sm avatar--initials">PR</div>
    <span class="member-pill__name">Priya</span>
    <button class="member-pill__remove" aria-label="Remove Priya">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</div>
```

---

## Rules

- Always use `.avatar--sm` (28×28) inside a member pill — never other sizes.
- The remove button (`.member-pill__remove`) is a `<button>` element, not a `<div>`, for accessibility.
- Always include `aria-label="Remove [Name]"` on the remove button.
- Omit `.member-pill__remove` entirely when the pill is display-only — do not hide it with CSS.
- Pill width is content-driven (auto) — never set a fixed width.
