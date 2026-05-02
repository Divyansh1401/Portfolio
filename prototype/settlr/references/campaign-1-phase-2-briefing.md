# Campaign 1 — Phase 2 Briefing (Screen Sweep)

> Read this file before doing any screen migrations. It applies to ALL Phase 2 agents.

## Context

Phase 1 just landed: 8 new components + extensions to `avatar` (`--xl`) and `icon-button` (`--overlay`) + a `confetti.css` utility. All registered in `code-index.json`. All semantic tokens added.

Phase 2 = sweep production screens to remove ~150 custom-styled instances by:
- Swapping to existing canonical components, OR
- Swapping to new Phase 1 components, OR
- Leaving truly screen-unique markup as-is.

## CRITICAL — Hard Rules

- **DO NOT modify shared files**: `tokens/*.css`, `.claude/indexes/*.json`, `css/*.css`, `components/*.md`
- **ONLY edit your assigned `screens/*.html` files**
- **Preserve every `id="*"` attr** — inline JS uses `getElementById` extensively
- **Preserve every `data-*` attr** — JS uses these as selectors and behavior flags
- **Preserve inline `<script>` blocks** — but UPDATE selectors inside if you renamed a class they target
- **Do NOT touch screen-unique style blocks** — see "leave-as-is" list below
- **No new tokens** — if a value doesn't have a token, leave the inline style alone (orchestrator will handle in a follow-up)
- **No primitives in component CSS, but inline screen styles may keep them for now** — focus is structural, not full token compliance

## Leave-as-is (truly screen-unique inline styles)

| Screen | Keep inline (don't touch) |
|---|---|
| splash | `.shapes`, `.shape`, `.splash`, `.splash__*` |
| welcome | `.feature-card`, `.feature-card__*`, `.welcome-content`, `.welcome-icon` |
| login | `.country-code`, `.phone-field`, `.phone-input-box`, `.divider-or`, `.social-btn`, `.login-hero` |
| otp | `.security-note`, `.resend-row`, `.resend-timer`, `.resend-btn`, `.otp-hero` |
| home-dashboard | `.hero` (custom balance section, NOT the hero-section component), `.cards-row`, `.expense-list` |
| people | `.chips-row`, `.person-list` |
| activity | `.chips-row` |
| settings | `.profile-hero`, `.profile-hero__*`, `.app-version`, `.content` |
| edit-profile | `.id-banner`, `.id-banner__*`, `.avatar-section`, `.avatar-wrap`, `.avatar-camera`, `.avatar-hint`, `.form-section` |
| group-detail | `.txn-item`, `.balance-row`, `.tab-panel`, `.info-section` |
| individual-detail | `.txn-item`, `.balance-row`, `.group-row` (the inline group-list-item, not the contact-row pattern), `.tab-panel`, `.info-section` |
| expense-detail | `.expense-hero`, `.expense-hero__*`, `.split-section`, `.split-person`, `.comment-item`, `.comment-input`, `.btn-edit`, `.btn-delete` (these are screen-unique for now — Campaign 2 may extract some) |
| add-amount | `.amount-area`, `.amount-row`, `.amount-prefix`, `.amount-field`, `.amount-error`, `.title-area`, `.title-input`, `.category-area`, `.cat-grid`, `.cat-item` |
| add-split | `.split-summary`, `.participant-list`, `.participant-item`, `.total-bar`, `.split-error`, `.paid-by`, `.payer-row`, `.sheet-total`, `.sheet-cta` |
| add-review | `.expense-hero`, `.split-section`, `.split-person`, `.section-divider` |
| edit-expense | `.amount-area`, `.amount-input-wrap`, `.currency-badge`, `.chips-section`, `.chips-row`, `.cat-chip` |
| settle-amount | `.person-preview`, `.amount-display`, `.amount-display .cursor`, `.full-amount-chip`, `.numpad`, `.numpad__*` |
| settle-method | `.summary-card` IS being replaced (use new component), but `.method-option` becomes `.detail-row.detail-row--selectable` |
| settle-success | `.success-content` group becomes `.success-state.success-state--confirmation`, but the screen-specific layout inside the info-card stays |
| create-group-done | `.success-content` group becomes `.success-state.success-state--celebration`, but the inline group info stays |
| search | `.search-bar` (custom screen header), `.recents-row`, `.result-row`, `.result-avatar`, `.result-text`, `.result-amount`, `.result-chevron`, `.section-divider`, `.no-results` (replace with `.empty-state`), `mark` highlight |
| edit-group | `.danger-card`, `.danger-row`, `.emoji-grid`, `.emoji-btn`, `.members-list`, `.member-row`, `.add-member-row` |

## REPLACEMENT TABLE — Custom → Existing Component

These are STRAIGHT swaps. Class rename in HTML + remove the matching inline `<style>` rules.

| Custom pattern | Replace with | Notes |
|---|---|---|
| `.bottom-cta`, `.bottom-actions`, `.bottom-dock`, `.sticky-actions` | `.screen-footer` | The footer wraps `.btn` children. Remove inline footer styles. |
| `.field`, `.field__label`, `.field__input`, `.field__helper` | `.input-field` family — see existing usage in screens/login.html line ~95 if needed | |
| `.search-wrap` + custom `.search-input`/`.search-field`/`.search-box` | canonical `.search-input` | |
| `.contact-row`, `.person-row` (list rows in people/contacts contexts) | `.person-item` | Keep `--input` modifier for input variants |
| `.group-row` when used as a contact-list-style row in settle-select | `.person-item` (with --chevron) | The "Common Groups" group-row in individual-detail is screen-unique (leave it) |
| Custom 96px avatars (`.avatar`, `.avatar-md` at 96px, `.profile-hero__avatar`, `.group-avatar`, `.person-avatar`) | `.avatar.avatar--xl` | Preserve all existing JS-targeted ids on these elements |
| Custom `.checkbox`, `.check`, `.checkbox--checked` (square checkbox patterns) | `.checkbox-control` (use as a child checkbox in person-item rows) | |
| Custom `.sheet`, `.sheet-overlay` | `.bottom-sheet` | |
| `.top-bar` (header element) | `.top-app-bar` | Preserve back/title/right-action structure |
| `.btn-start`, `.btn-explore`, `.btn-next`, `.btn-create`, `.btn-save`, `.btn-edit`, `.btn-delete`, `.add-btn`, `.copy-btn`, `.btn-done`, `.btn-view`, `.btn-home` | `.btn` + variants (`--primary/secondary/ghost/destructive` × `--sm/md/lg` × optional `--full`) | Pick the variant that matches existing visual intent |
| `.sel-chip` removable member chip | `.member-pill member-pill--removable` | |
| `.recent-chip` | `.chip chip--sm` | |
| `.no-results` | `.empty-state` | |
| `.notif-badge` | `.badge` | |

## REPLACEMENT TABLE — Custom → New Phase 1 Component

| Custom class | New component | Variant/Modifier |
|---|---|---|
| `.hero-photo` (group-detail) | `.hero-section` | (none) |
| `.hero-banner` (individual-detail) | `.hero-section` | (none) |
| `.hero` (edit-group) | `.hero-section` | (none) |
| `.hero-btn` | `.icon-btn.icon-btn--overlay` | (none) — also add `.icon-btn__icon` to the inner `<i>` |
| `.toggle`, `.toggle__track`, `.toggle__thumb` | `.toggle-control`, `.toggle-control__track`, `.toggle-control__thumb` | Add `role="switch"` + `aria-checked` |
| `.detail-row`, `.selector-row`, `.method-option` | `.detail-row` | `--clickable` if has chevron, `--selectable` if radio-like |
| `.notes-card`, `.field__textarea` (notes-only) | `.notes-card` | `--readonly` for display, `--editable` for textarea |
| `.summary-card` (settle-method), `.success-details`+`.success-avatar`+`.success-summary`+`.success-amount`+`.success-method` (settle-success) | `.summary-card` | `--success` for settle-success |
| `.success-content`+`.success-icon`+`.success-heading`+`.success-info`+`.success-name`+`.success-type`+`.success-timestamp` (create-group-done) | `.success-state` | `--celebration` |
| `.success-content`+`.success-check`+`.success-heading`+`.success-amount`+`.success-method`+`.success-timestamp` (settle-success) | `.success-state` | `--confirmation` |
| `.invite-banner` (create-group-members) | `.invite-banner` | Already correctly named — just remove inline CSS block |
| `.confetti`, `.confetti__dot` (welcome, create-group-done, settle-success) | (utility — keep class names) | Just remove the `@keyframes confettiFall` + `.confetti` + `.confetti__dot` rules from inline `<style>` since they're now in `css/confetti.css`. Welcome's slow variant: add `.confetti--slow` modifier. |

## Settings.html (special)

`.settings-section/.settings-card/.settings-row/...` are now canonical (`css/settings-row.css`). Settings.html already uses the right class names. Just:
1. REMOVE the inline `<style>` block defining `.settings-section`, `.settings-section__label`, `.settings-card`, `.settings-row*`, and `.toggle*`
2. Migrate `<label class="toggle">` → `<label class="toggle-control" role="switch" aria-checked="...">` and the inner `__track`/`__thumb` similarly
3. Keep `.profile-hero`, `.profile-hero__*`, `.app-version`, `.content` rules inline (screen-unique)

## Output Format

Return a structured markdown report:

```
## Screen: <name>
- Files modified: screens/<name>.html
- Classes replaced: N (list highlights)
- Inline CSS rules removed: N
- JS hooks preserved: list any
- Status: ✓ migrated cleanly | ⚠️ needs review: <reason>

## Screen: <name>
…
```

If you encounter a class not in any table, leave it and report under "needs review".
