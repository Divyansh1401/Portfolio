# FAQ / Accordion

**CSS file:** `css/faq.css`
**Class prefix:** `.faq-item`
**Figma node:** `75:4820` (Faq/Variant2)

---

## Anatomy

```
.faq-item                   ← container, bottom border
  .faq-item__trigger        ← row: question + icon
    .faq-item__question     ← question text
    .faq-item__icon         ← +/− toggle icon (20×20)
  .faq-item__answer         ← answer text (hidden when collapsed)
```

---

## Usage

```html
<!-- Collapsed -->
<div class="faq-item">
  <div class="faq-item__trigger">
    <span class="faq-item__question">What is Settlr?</span>
    <span class="faq-item__icon">+</span>
  </div>
</div>

<!-- Expanded -->
<div class="faq-item">
  <div class="faq-item__trigger">
    <span class="faq-item__question">What is Settlr?</span>
    <span class="faq-item__icon">−</span>
  </div>
  <p class="faq-item__answer">Settlr helps you track shared expenses and settle up with friends.</p>
</div>
```

---

## Tokens

| Token | Value | Role |
|-------|-------|------|
| `--faq-border` | `var(--border-default)` → `neutral/300` | bottom divider |
| `--faq-question-fg` | `var(--color-neutral-800)` | question text color |
| `--faq-answer-fg` | `var(--text-secondary)` → `neutral/600` | answer text color |
| `--faq-icon-fg` | `var(--color-neutral-800)` | toggle icon color |

---

## Typography

| Element | Style |
|---------|-------|
| Question | Plus Jakarta Sans, 13px, SemiBold, `--faq-question-fg` |
| Answer | Plus Jakarta Sans, 10px, Regular, `--faq-answer-fg` |

---

## Notes

- No variants currently. One default state only.
- Toggle open/closed state is managed by JS (add/remove `.faq-item__answer` from DOM, or toggle `display: none`).
- Icon should switch between `+` (collapsed) and `−` (expanded).
- The bottom border acts as a list divider; the last item in a list may omit `border-bottom` via `:last-child`.
