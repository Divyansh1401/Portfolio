# OTP Input

**CSS file:** `css/otp.css`
**Class prefixes:** `.otp-digit`, `.otp-group`

## Changelog
### 2026-03-20
- Fixed digit font-size: `16px` → `var(--font-size-20)` (Figma: 20px — was wrong size)
- Fixed digit padding: `12px` → `var(--spacing-12)` (hardcoded → token)
- Fixed base font-weight: `semibold` → `regular` (empty/placeholder state is regular)
- Added `.otp-digit--filled` font-weight: `semibold` (filled digits are semibold per Figma)
- Added focus state `border-width: var(--border-large)` (Figma: 2px on focus)
- Fixed group label: `12px / 19px` → `var(--font-size-10) / var(--line-height-14)`
- Fixed group helper: `11px / 17px` → `var(--font-size-10) / var(--line-height-14)`
- Bound padding to `spacing/12` in Figma for all 5 digit states
- Shared `--input-*` tokens with Input Field and Search Field

---

## OTP Digit `75:4855`
**Variants:** 5 (Empty, Focus, Filled, Error, Disabled)

### Layout
- **Size:** 44×44px (derived: padding 12px × 2 + text 20px = 44px)
- **Direction:** Center / Center
- **Padding:** `--spacing-12` (12px all sides) — bound in Figma
- **Corner Radius:** `--radius-8` (8px)

### State Specs
| State | Background | Border | Border Width | Text Color | Weight |
|-------|-----------|--------|-------------|-----------|--------|
| Empty | `--input-bg` | `--input-border-default` | `--border-small` | `--input-fg-default` | regular |
| Focus | `--input-bg-focused` | `--input-border-focused` | `--border-large` (2px) | — (cursor shown) | — |
| Filled | `--input-bg` | `--input-border-default` | `--border-small` | `--input-fg-active` | semibold |
| Error | `--input-bg-error` | `--input-border-error` | `--border-small` | `--input-fg-active` | semibold |
| Disabled | `--input-bg` | `--input-border-default` | `--border-small` | `--input-fg-default` | regular |

### Typography
- **Digit:** `--font-size-20` (20px), regular (empty) / semibold (filled), `line-height: normal`

---

## OTP 6-Digit Group `75:4866`
**Variants:** 5 (Default, Focus, Filled, Error, Disabled)

### Layout
- **Size:** 328px wide
- **Direction:** Vertical
- **Gap:** `--spacing-4` (4px) between label → digits → helper row
- **Contains:** 6 × OTP Digit in a horizontal row (`justify-content: space-between`)

### Typography (shared with Input Field)
| Element | Size | Weight | Line Height | Color Token |
|---------|------|--------|-------------|-------------|
| Label ("Enter OTP") | `--font-size-10` (10px) | regular | `--line-height-14` | `--input-label` |
| Helper text | `--font-size-10` (10px) | regular | `--line-height-14` | `--input-helper` |
| Helper (error) | `--font-size-10` (10px) | regular | `--line-height-14` | `--input-helper-error` |

### Resend OTP Link
- Font: `--font-size-12`, `--weight-medium`
- Color: `--input-border-focused` (olive/600)
- Style: underline (border-bottom)

---

## Token Sharing
OTP, Input Field, and Search Field all share the same `--input-*` semantic tokens, ensuring visual consistency across all form controls.

---

## Usage

### Single OTP Digit
```html
<!-- Empty -->
<input class="otp-digit" type="text" maxlength="1" placeholder="–" />

<!-- Focus -->
<input class="otp-digit otp-digit--focus" type="text" maxlength="1" />

<!-- Filled -->
<input class="otp-digit otp-digit--filled" type="text" maxlength="1" value="4" />

<!-- Error -->
<input class="otp-digit otp-digit--error otp-digit--filled" type="text" maxlength="1" value="4" />

<!-- Disabled -->
<input class="otp-digit otp-digit--disabled" type="text" maxlength="1" disabled />
```

### 6-Digit OTP Group
```html
<div class="otp-group">
  <label class="otp-group__label">Enter OTP</label>
  <div class="otp-group__digits">
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
    <input class="otp-digit" type="text" maxlength="1" placeholder="–" />
  </div>
  <div class="otp-group__helper">
    <span>Didn't receive pin code?</span>
    <a href="#">Resend OTP</a>
  </div>
</div>
```
