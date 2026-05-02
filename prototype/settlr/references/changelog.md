# Settlr Design System — Changelog

## 2026-04-29

**Campaign 1 — Phase 2 + 3: Screen Sweep & Final Sync (~150 custom classes consolidated across 27 screens)**

7 parallel agents migrated 22 production screens (5 already canonical, no edits needed). Zero behavior changes — pure compliance refactor preserving every `id`, `data-*`, and JS hook.

Per-screen migrations (highlights):
- splash, welcome — `.btn-start`/`.btn-explore` → `.btn` variants. welcome got `.confetti--slow` modifier.
- login, otp — `.bottom-cta` → `.screen-footer`. Screen-unique kept.
- home-dashboard — `.top-bar` → `.top-app-bar`, `.notif-badge` → `.badge`. `.hero` balance section kept.
- people, activity — already canonical.
- search — `.recent-chip` → `.chip chip--sm`, `.no-results` → `.empty-state`.
- group-detail — `.hero-photo`+`.hero-btn`+`.group-avatar` → `.hero-section.hero-section--tall` + `.icon-btn--overlay` + `.avatar--xl`.
- individual-detail — `.hero-banner`+`.hero-btn`+`.person-avatar` → `.hero-section` + `.icon-btn--overlay` + `.avatar--xl`.
- expense-detail — `.top-bar` → `.top-app-bar`, `.bottom-actions` → `.screen-footer`. `.detail-row`/`.notes-card` markup kept (canonical CSS now applies).
- settings — full settings-row/toggle migration. `.toggle` → `.toggle-control` with ARIA. Profile-hero avatar → `.avatar--xl`.
- edit-profile — `.top-bar` → `.top-app-bar`, `.field` → `.input-field`, bio → `.notes-card--editable`, `.save-cta` → `.screen-footer`.
- add-friend — `.copy-btn`/`.add-btn`/`.person-row` → canonical. QR section kept.
- create-group-name — `.field` → `.input-field`, footer migrated.
- create-group-members — `.search-box` → `.search-input`, `.contact-row` → `.person-item`, `.check` → `.checkbox-control`, `.sel-chip` → `.member-pill--removable`. invite-banner inline removed.
- create-group-done — `.success-content` family → `.success-state.success-state--celebration`. Confetti shared.
- edit-group — `.hero` → `.hero-section.hero-section--short`, full `.field`/`.sheet` migration.
- add-amount — already canonical.
- add-group — full search/contact/checkbox/member-pill migration. `.bottom-dock` → `.screen-footer`.
- add-split — `.sheet*` → `.bottom-sheet`, custom checkbox/avatar canonicalised.
- add-review — inline `.detail-row`+`.notes-card` CSS removed.
- edit-expense — heaviest: `.top-bar`+`.field`+`.field__textarea`+`.selector-row`+`.cat-chip`+`.currency-badge`+`.bottom-cta` all migrated.
- settle-select — `.section-label` → `.heading`.
- settle-amount — `.bottom-cta` → `.screen-footer`. Numpad kept. `.currency-badge` retained (no caret variant in canonical).
- settle-method — `.method-option` → `.detail-row.detail-row--selectable`. summary-card markup kept.
- settle-success — `.success-content` → `.success-state--confirmation`, `.success-details` → `.summary-card--success`.

Hero size variants added:
- `tokens/semantic.css`: `--hero-section-height-tall: 300px`, `--hero-section-height-short: 200px`
- `css/hero-section.css`: `.hero-section--tall` / `.hero-section--short` modifiers
- group-detail `--tall`, edit-group `--short`, individual-detail default (240px)

Manifest sync:
- All 8 new components now have populated `componentUsage` arrays
- 11 existing components got expanded usage arrays (top-app-bar, screen-footer, member-pill, checkbox, avatar, bottom-sheet, input-field, person-item, icon-button, search-input, heading)

Verification:
- Global Grep — zero deprecated classes in production screens (component-docs.html still shows old patterns for reference)
- 5 representative screens preview-verified: settings, group-detail, settle-success, edit-profile, create-group-done — zero console errors

Flagged for Campaign 2 (UX Hardening):
- edit-profile `.top-app-bar__done` is ghost-text (was pill) — minor visual delta on inline Save
- edit-profile `.input-field--disabled` removes border (vs subtle border before)
- settle-amount `.currency-badge` intentionally retained
- expense-detail `.btn-edit`/`.btn-delete` left as screen-unique

## 2026-04-29

**Campaign 1 — Phase 1: Foundation (8 new components + avatar XL + confetti utility)**

Built 8 new components and extended 2 existing ones to absorb ~150 custom-styled instances scattered across 26 production screens. No screen migrations yet (Phase 2). Foundation is in place; existing screens unchanged.

New components (CSS + spec + code-index entries):
- `hero-section` (`.hero-section` + sub-elements) — replaces `.hero-photo` (group-detail), `.hero-banner` (individual-detail), `.hero` (edit-group)
- `toggle` (`.toggle-control` family) — replaces inline `.toggle` in settings; supports `role="switch"` + `aria-checked`
- `settings-row` (`.settings-section` + `.settings-card` + `.settings-row` family with 4 icon-wrap variants and 3 row modifiers) — replaces inline settings markup
- `detail-row` (`.detail-row` with `--clickable`, `--selectable` variants) — replaces `.detail-row`/`.selector-row`/`.method-option` patterns
- `notes-card` (`.notes-card` with `--readonly`, `--editable` variants + char counter) — replaces inline notes markup in expense-detail/add-review/edit-expense
- `summary-card` (`.summary-card` with `--success` variant + amount-direction modifiers) — replaces `.summary-card`/`.success-details` in settle flows
- `success-state` (`.success-state` with `--celebration`/`--confirmation` variants) — replaces `.success-content` patterns in create-group-done/settle-success
- `invite-banner` (`.invite-banner`) — replaces inline `.invite-banner` in create-group-members

Extensions to existing components:
- `avatar` — added `--xl` size (96px, font-size 30px, letter-spacing -0.90px) for hero/profile usage
- `icon-button` — added `--overlay` variant for circular buttons over hero sections (44x44, white/text-primary)

Utility added:
- `confetti.css` (CSS-only) — extracted shared `.confetti` + `.confetti__dot` keyframe animation; `--slow` modifier for 2.5s welcome variant

Token additions:
- `tokens/typography.css`: `--font-size-15`, `--font-size-28`, `--line-height-22`, `--line-height-34` primitives
- `tokens/semantic.css`: ~85 new L3 component tokens (avatar-xl, hero-section, icon-btn-overlay, toggle, settings-row family, detail-row, notes-card, summary-card, success-state, invite-banner)

Index/manifest:
- `code-index.json`: totalComponents 32 → 40, added 8 new entries, updated `avatar.sizes` and `icon-button.variants`
- `screen-manifest.json`: initialized empty componentUsage arrays for the 8 new components (will populate in Phase 2 sweep)
- `css/index.css`: appended 9 new @import lines

Verified: existing settings.html still renders; all 14 spot-checked new tokens resolve (`--toggle-track-bg-on: #31401A`, `--hero-section-height: 240px`, etc.); zero console errors.

Phase 2 (screen sweep) and Phase 3 (final sync + verify) pending. Plan in `references/campaign-1-plan.md`.

## 2026-04-29

**Audit Pass — Broken Tokens, Manifest Sync, Deprecated Screen Cleanup**

Fixes applied:
- `screens/settings.html` — removed references to deleted `--label-warning-*` and `--label-info-*` tokens (deleted 2026-04-10 with yellow/jay palettes). Renamed icon-wrap variants `--yellow` → `--neutral` (uses `--surface-input` + `--text-tertiary`) and `--jay` → `--brand` (uses `--action-muted` + `--action-dark`). Logout label color changed from `--label-warning-fg` to `--text-primary`.
- `screens/search.html` — `.result-avatar--group` migrated from `--label-info-bg/fg` to `--action-muted` + `--action-dark`.
- `screens/notifications.html` — **deleted** (was marked deprecated 2026-04-15; activity feed now serves notifications via Updates chip).

Manifest sync (`.claude/indexes/screen-manifest.json`):
- Removed `notifications` screen entry.
- `badge` componentUsage: was `[]` → now `[settings, edit-group, settle-amount, edit-expense, preview-group-detail-full, component-docs]`.
- `avatar-stack` componentUsage: was `[]` → now `[preview-stacked-avatars, preview-group-detail-full, component-docs]`.
- `currency-chip` componentUsage: was `[]` → now `[add-amount]`.
- meta.lastUpdated bumped.

Index sync (`.claude/indexes/code-index.json`):
- `totalScreens`: 37 → 36.
- meta.lastUpdated bumped.

True orphans remaining (kept by user request): `header-chips`, `faq-item` — defined but used in zero screens. `faq-item` retained for future Help/FAQ screen.

## 2026-04-29

**Hero Texture Overlay — Open Issue Closed**
The 2026-04-16 open issue ("rgba() texture overlay on `::before` hero pseudo-elements") is resolved. Verified state:
- `tokens/semantic.css:54` — `--surface-hero-texture-overlay: rgba(255, 255, 255, 0.06)` exists
- `screens/group-detail.html` (lines 85–88) and `screens/individual-detail.html` (lines 72–75) — both `::before` overlays consume `var(--surface-hero-texture-overlay)`, no raw `rgba()` in either screen.

Result: zero open issues. All hero overlays are now token-compliant.

## 2026-04-20

**Typography Restoration — Path B Rollback**
Cancelled `path-b-typography-refactor.md`. The previous agent completed Phase 3 (strip font props from CSS) but NOT Phase 4 (add `text-*` classes to HTML), leaving all screens unstyled. Additionally, `text-display-lg` was incorrectly deleted despite being actively used in `add-amount.html`.

Fix applied (CSS-only, zero HTML changes):
- `tokens/typography.css`: restored `--font-size-40`, `--line-height-44` primitives and `.text-display-lg` class (40px/Black/Unbounded)
- `css/button.css`: restored font props on `.btn--sm/md/lg`
- `css/chip.css`: restored font props on `.chip--sm/md/lg`
- `css/currency-chip.css`: restored font props on `.currency-chip`
- `css/navigation.css`: restored `.bottom-nav__tab-label` block + `.segment-item` font props
- `css/heading.css`: restored `.heading__title` font props
- `css/top-app-bar.css`: restored `.top-app-bar__title`, `.top-app-bar__done` font props + added compound override `.top-app-bar--bordered .top-app-bar__title, .top-app-bar--nav .top-app-bar__title` (20px for detail screens vs 24px base)
- `css/bottom-sheet.css`: restored `.sheet__title` font props
- `css/empty-state.css`: restored `.empty-state__title` + `.empty-state__body` font props
- `css/input-field.css`: restored label/input/helper font props
- `css/otp.css`: restored digit/label/helper font props
- `css/avatar.css`: restored xs/sm/md/lg size font props + `.member-pill__name` font props
- `css/list-items.css`: restored person-item/expense-item font props + added base `.expense-item__label` rule
- `css/cards.css`: restored card-group name/members/amount font props
- `css/settlement-item.css`: restored name font props + restored full base `.settlement-item__amount` rule (was fully deleted)
- `css/toast.css`: restored title/body font props
- `css/radio.css`: restored label/boxed-label/description font props
- `css/checkbox.css`: restored label font props
- `css/update-item.css`: restored text/time/tag font props

Verified in preview: home-dashboard, add-amount (₹ 40px confirmed), group-detail, activity, people, settle-select, preview-toast — all rendering correctly.

## 2026-04-18

**3-Layer Token System**
File changed: `tokens/semantic.css` only — zero changes to component CSS or screens.

Structure:
- **L1** `tokens/colors.css` — 72 color primitives (unchanged)
- **L2** `tokens/semantic.css` top section — ~35 role-based general semantics aliasing primitives directly
  - `--action-{surface/muted/secondary/accent/mid/primary/dark/strong}` — olive scale
  - `--error-{action/action-pressed/strong/fg/subtle/surface/border}` — coral scale
  - `--success-{fg/strong/mid/subtle/surface/border}` — green scale
  - `--surface-{bg/primary/card/input/track}` + hero tokens — neutral/gray scale
  - `--text-{primary/secondary/tertiary/placeholder/strong/label/faint/brand/inverse}` — content roles
  - `--border-{default/subtle/strong}` — border weights
  - `--neutral-{surface/fg/border/mid}` + `--disabled-{fg/border/selected-bg}` — gray status
- **L3** `tokens/semantic.css` bottom section — all 130 component tokens, same names, now pointing to L2

No renames. All component token names are identical to before. css/*.css and screens untouched.

## 2026-04-16

**Quality Pass — 2026-04-16**
Screens changed: add-group, add-split, add-review, group-detail, individual-detail, home-dashboard, activity
New component: update-item (`css/update-item.css`, `components/update-item.md`)
New tokens: `--surface-hero-gradient`, `--avatar-border-on-hero`, `--spacing-96`, `--label-lent/owe/settled-bg/fg`, `--surface-bg`
New CSS classes: `.balance-pill--lent/owe/settled` (`css/label.css`)

Key changes:
- **add-group**: validation UX (`validateGroupName`), disabled Next button, search empty-state
- **add-split**: inline error messages, rounding guards (0.01/0.5 tolerance), payer sheet scroll (60vh)
- **add-review**: balance pill CSS classes replacing inline JS styles, context guard for sessionStorage (`settlr_new_expense`), notes char counter (280)
- **group-detail + individual-detail**: `--surface-hero-gradient`, `--spacing-96`, `--avatar-border-on-hero` tokens; Store null guards with empty-state
- **home-dashboard**: `Store.getNetBalance()` wired to hero, date sections via `Store.groupExpensesByDate()`, empty states for no-groups/no-activity
- **activity**: 5th "Updates" chip with mutual exclusion, update-item component rendered from `UPDATES_DATA` (7 mock events), `Store.getUpdates()` pattern in inline data
- **notifications screen deprecated**: events now in activity via Updates chip
- **expense-detail**: already compliant, no changes needed
- Updated `screen-manifest.json`: `update-item` added to activity components + componentUsage; `notifications` marked `"status": "deprecated"`; `notifications` removed from button/chip/status-bar componentUsage arrays
- Updated `code-index.json`: label component modifiers updated with `.balance-pill--lent/owe/settled`; meta.lastUpdated bumped to 2026-04-16

Open issue (user approval pending): `rgba()` texture overlay on `::before` hero pseudo-elements in group-detail + individual-detail — needs `--surface-hero-texture-overlay` semantic token before it can be made compliant.

## 2026-04-14
- Created `screen-footer` component — unified fixed sticky footer replacing all per-screen `.sticky-actions`, `.bottom-dock`, `.bottom-cta`, `.sticky-footer` patterns
  - Two variants: double (2 equal buttons) and single (1 full-width button)
  - Top border transparent by default; revealed via `.is-scrolled` when content scrolls underneath
  - Scroll detection JS snippet included in each screen
  - New semantic tokens: `--screen-footer-bg` (neutral/50), `--screen-footer-border` (neutral/200)
  - New CSS file: `css/screen-footer.css` | Spec: `components/screen-footer.md`
- Applied `screen-footer` to 8 screens: `group-detail`, `individual-detail`, `add-review`, `add-amount`, `add-split`, `edit-group`, `preview-action-button-row`, `preview-group-detail-full`
- Updated `code-index.json`, `screen-manifest.json`, `references/changelog.md`
- `action-button-row` marked legacy in code-index (prefer `screen-footer`)

## 2026-04-10
- Removed Yellow and Jay color palettes entirely from the design system
  - Deleted `--color-yellow-*` (10 steps) and `--color-jay-*` (9 steps) from `tokens/colors.css`
  - Removed `--label-warning-*`, `--label-info-*`, `--toast-warning-*`, `--toast-info-*` from `tokens/semantic.css`
  - Removed `.label--warning`, `.label--info` from `css/labels.css`
  - Removed `.toast--warning`, `.toast--info` from `css/toast.css`
  - Cleaned yellow/jay primitives and warning/info tokens from `screens/tokens.css`
  - Removed warning/info variants from `screens/preview-toast.html` and `screens/component-docs.html`
  - Updated `code-index.json`: label, badge, toast variant lists pruned
- Palette now: Neutral · Gray · Olive · Green · Coral only

## 2026-03-20
- Added `--font-size-*` CSS variables (16 sizes: 10px–64px) to `tokens/typography.css`
- Added `--line-height-*` CSS variables (23 values: 12px–68px) to `tokens/typography.css`
- Added generic semantic tokens to `tokens/semantic.css`: `--surface-primary`, `--surface-card`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-brand`, `--text-inverse`, `--border-default`, `--border-subtle`
- Created 4 enforcer skills in `.claude/skills/`:
  - `settlr-text-style-enforcer` — 32 text styles, font-size/weight variables, 2 font families
  - `settlr-color-enforcer` — 72 primitives + 100+ semantic tokens, zero hardcoded colors
  - `settlr-spacing-enforcer` — spacing, radius, border, shadow, opacity, overlay, icon sizes
  - `settlr-component-enforcer` — component structure, spec/CSS consistency, state model
- Created `figma-enforcer.md` orchestrator — routes to enforcers, owns Figma API ops, 6-step component workflow
- Created `references/changelog.md` (this file)
- Added Skill Summoning Protocol to `CLAUDE.md` (Section 8)
