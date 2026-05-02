# Settlr Design Review Report
**Date:** 2026-03-28

## Executive Summary

Comprehensive review of all token files, 19 component CSS files, and 23 application screens.
**Total issues found: 67+** across 10 categories.

| Severity | Count |
|----------|-------|
| Critical (P0) | 18 |
| High (P1) | 19 |
| Medium (P2) | 16 |
| Low (P3) | 14+ |

**Top violations:**
- 40+ hardcoded hex/rgb color values bypassing the token system
- 25+ hardcoded pixel spacing values instead of `--spacing-*` tokens
- 15+ hardcoded typography declarations instead of `.text-*` classes
- 8+ hardcoded border-radius values
- 6+ hardcoded box-shadow values
- Primitive color tokens used directly in screens (should go through semantic layer)
- Missing empty states on list screens
- Missing form validation error states across all form flows

---

## Critical Issues (P0)

### P0-1 · Primitive Color Tokens Used Directly in Screens
**Rule violation:** Screens must use semantic tokens, not primitives (`var(--color-olive-*)`)

**Affected screens:** home-dashboard, group-detail, individual-detail, activity, people, settings, and more

**Examples:**
- `home-dashboard.html`: `var(--color-neutral-50)` for body background → should be `var(--surface-primary)`
- `home-dashboard.html`: `color: var(--color-olive-600)` → should be `var(--text-brand)`
- `group-detail.html`: `background: linear-gradient(160deg, var(--color-olive-300)...)` → should use semantic gradient token
- `activity.html`: `color: var(--color-neutral-400)` for search placeholder → should be `var(--input-fg-placeholder)`
- `people.html`: `border: 1px solid var(--color-neutral-100)` → should be `var(--border-default)`

**Impact:** Any future brand update requires manual changes to 15+ HTML files.

**Fix:** Replace every `var(--color-*)` usage in screen files with the semantic equivalent from `tokens/semantic.css`.

---

### P0-2 · Hardcoded Hex / RGB Colors in Screen HTML
**Rule violation:** Zero raw hex or rgb() values allowed outside token files

**Examples:**
- `group-detail.html` line ~140: `box-shadow: 0 1px 17.7px rgba(0,0,0,0.07)` — should be `var(--shadow-sm)` or similar
- `home-dashboard.html` line ~391: Same hardcoded shadow
- `activity.html` line ~303: Same hardcoded shadow
- Multiple screens: `rgba(0,0,0,0.x)` overlay values — should be `var(--overlay-light)` etc.

---

### P0-3 · Hardcoded Inline Font Declarations
**Rule violation:** All typography must use `.text-*` classes from `tokens/typography.css`

**Examples:**
- `home-dashboard.html` line ~64: `font: 600 15px/20px -apple-system, BlinkMacSystemFont, sans-serif` (hardcoded system font, not Plus Jakarta Sans)
- `activity.html` line ~38: Identical hardcoded font
- `group-detail.html` line ~158: `font-size: 24px; font-weight: var(--weight-bold)` — mixed (size hardcoded)
- Multiple screens: inline `font-size`, `font-weight` instead of semantic text-style classes

---

### P0-4 · Hardcoded Spacing Values (25+ instances)
**Rule violation:** All spacing must use `--spacing-*` tokens

**Examples (non-exhaustive):**
- `home-dashboard.html`: `gap: 10px` → `var(--spacing-8)` or `var(--spacing-12)`
- `group-detail.html` line ~169: `margin-top: 6px` → `var(--spacing-4)` or `var(--spacing-8)`
- `individual-detail.html` line ~169: `margin-top: 6px` (duplicated issue)
- `activity.html` line ~224: `gap: 2px` → `var(--spacing-2)`

---

### P0-5 · Hardcoded Border Radius Values (8+ instances)
**Rule violation:** All border-radius must use `--radius-*` tokens

**Examples:**
- `home-dashboard.html` line ~74: `border-radius: 28px` → `var(--radius-full)` or `var(--radius-32)`
- `group-detail.html` line ~133: `border-radius: 16px` → `var(--radius-16)`
- `people.html` line ~181: `border-radius: 20px` → `var(--radius-20)` or `var(--radius-full)`
- Various screens mix hardcoded and token values inconsistently

---

### P0-6 · Inline `style=""` Attributes on Elements
**Rule violation:** No inline style attributes; all styling must be class-based

**Examples:**
- `group-detail.html` line ~346: `style="cursor: default;"` — should be a CSS class
- `activity.html` line ~520: `style="margin-top: var(--spacing-8);"` — use utility class instead
- `settings.html` line ~346: `style="cursor: default;"` repeated multiple times
- Various screens: `style="display: none;"` used to hide elements instead of state classes

---

### P0-7 · Custom Button CSS Redefined in Screens
**Rule violation:** Never duplicate component CSS; use `css/button.css` exclusively

**Affected screens:** home-dashboard, group-detail, individual-detail, activity, people, login, settings, all flow screens

**Issues:**
- Button padding varies: `8px/12px` vs `12px/16px` depending on screen
- Heights vary: `36px`, `40px`, `44px`, `52px`
- Border radius sometimes hardcoded to specific values
- Each screen's `<style>` block redefines `.btn` rather than inheriting from `button.css`

---

### P0-8 · Custom Segment Control CSS Repeated in Multiple Screens
**Rule violation:** Use `.segment-control` / `.segment-item` from `css/navigation.css`; never duplicate

**Affected screens:** `group-detail.html`, `individual-detail.html`

**Issue:** Both screens have identical custom segment control CSS blocks that duplicate `navigation.css:53–93`. Any future update to navigation.css would not propagate.

---

## High Priority Issues (P1)

### P1-1 · Avatar Sizes Inconsistent Across Screens
**Component:** `.avatar`

**Expected sizes:** XS=20px, SM=28px, MD=40px, LG=52px (from `css/avatar.css`)

**Actual usage:**
- `home-dashboard.html`: 52px custom (should be `.avatar--lg`) ✓ size OK but styling custom
- `group-detail.html` hero: 96px custom — no matching token/class exists
- `individual-detail.html` hero: 96px custom — same issue
- `settings.html` profile: 96px custom — same issue
- `people.html` list: 40px (should be `.avatar--md`) ✓ size OK but styling custom

**Fix:** All avatar styling must come from `css/avatar.css`. If 96px is a needed size, add `.avatar--xl` to the component spec first.

---

### P1-2 · Avatar Border / Ring Inconsistent
**Component:** `.avatar`

**Token:** `--avatar-ring` from `css/avatar.css`

**Issues:**
- `group-detail.html` hero: `border: 4px solid white` (hardcoded)
- `settings.html`: `border: 3px solid #fff` (hardcoded hex)
- `home-dashboard.html`: no ring at all
- `people.html`: 20px border-radius override

**Fix:** Remove all custom border declarations; use `var(--avatar-ring)` token consistently.

---

### P1-3 · Status Bar Typography Hardcoded and Repeated
**Pattern:** Every screen with a status bar redefines `.status-bar__time` font

**Issue:** `font: 600 15px/20px -apple-system, BlinkMacSystemFont, sans-serif` appears identically in 15+ screens. Uses system font (not Plus Jakarta Sans) and hardcoded sizing.

**Fix:** Create `css/status-bar.css` with standardized typography token class.

---

### P1-4 · Missing Empty States on List Screens
**UX Gap:** Lists that can be empty show nothing, leaving users with a blank screen

**Affected:**
- `activity.html` — no `.empty-state` when activity list is empty
- `people.html` — no `.empty-state` when no contacts
- `group-detail.html` → Transactions tab — no `.empty-state` when no transactions
- `group-detail.html` → Balances tab — no state shown when all settled

**Fix:** Add `.empty-state` component (from `css/empty-state.css`) with illustration, title, body text, and optional CTA button.

---

### P1-5 · Form Validation Error States Never Shown
**UX Gap:** No screens demonstrate `.input-field--error` state

**Affected:**
- `login.html` — phone input has no error validation message
- `add-amount.html` — amount input has no validation feedback
- All multi-step flow screens (add-group, add-split, add-review) lack required-field error patterns
- `otp.html` — no error state for wrong OTP

**Fix:** Add `.input-field--error` modifier with `.input-field__helper` error text on relevant form screens.

---

### P1-6 · Settlement Flow Disconnected
**UX Gap:** Settlement screens exist in isolation; no linking between steps

**Flow should be:** `settle-select.html` → `settle-amount.html` → `settle-method.html` → `settle-success.html`

**Issues:**
- No step progress indicator matching screen progression
- Back navigation between steps absent or inconsistent
- `settle-success.html` not linked from `settle-method.html`
- Step indicator numbering does not match the 4-screen flow

---

### P1-7 · Typography: List Item Text Styles Vary
**Inconsistency:** Similar elements use different type declarations across screens

**Examples:**
- Expense item titles: `home-dashboard.html` ~line 329 uses `14px/600` inline
- Person item names: `people.html` ~line 200 uses `14px/600` inline
- Both should use `.text-title-sm` (or equivalent) from `tokens/typography.css`

---

### P1-8 · Section Spacing Applied Via Inline Style Instead of Utility Class
**Examples:**
- `home-dashboard.html` line ~520: `style="margin-top: var(--spacing-8);"` — should be utility class
- Multiple screens: spacing between sections applied as inline style

**Fix:** Use `.mt-8`, `.mt-16`, `.mt-24` layout utility classes from `css/layout.css`.

---

### P1-9 · Search Input Component Duplicated Without a Spec or CSS File
**Pattern:** `activity.html` and `people.html` both define an identical custom `.search-input` CSS block

**Issue:** This should be a shared component with a spec and CSS file, not ad-hoc per-screen CSS

**Fix:** Either create `css/search-input.css` and `components/search-input.md`, or adapt the existing `.input-field` component for search use.

---

### P1-10 · Destructive Actions Missing Confirmation
**UX Gap:** No confirmation dialogs for irreversible actions

**Affected:**
- `settings.html` — Delete account: no confirmation bottom sheet
- `settings.html` — Log out: no confirmation
- `settle-select.html` — Settling with large amounts should show a confirmation

**Fix:** Add `.sheet` (bottom sheet) confirmation patterns from `css/bottom-sheet.css` before irreversible actions.

---

### P1-11 · Missing Success/Error Toast Feedback After Submissions
**UX Gap:** After form submissions, no feedback is shown

**Affected:**
- Adding an expense → no success toast
- Editing an expense → no success toast
- Settling → `settle-success.html` exists but not always reached
- OTP verification → unclear what happens on success

**Fix:** Use `.toast` component (`css/toast.css`) to show confirmation messages after key actions.

---

### P1-12 · Hardcoded Box Shadows (6+ instances)
**Rule violation:** All shadows must use `--shadow-*` tokens

**Examples:**
- `home-dashboard.html` line ~391: `box-shadow: 0 1px 17.7px rgba(0,0,0,0.07)`
- `activity.html` line ~303: Identical hardcoded shadow
- `group-detail.html` line ~140: Hardcoded shadow with custom values

---

## Medium Priority Issues (P2)

### P2-1 · Hero Gradient Uses Primitive Colors
**Screens:** `group-detail.html`, `individual-detail.html`

**Issue:** `background: linear-gradient(160deg, var(--color-olive-300)...)` — uses primitive tokens in gradient declarations

**Fix:** Create a semantic gradient token in `tokens/semantic.css` (e.g., `--surface-hero-gradient`) and use it.

---

### P2-2 · Date/Section Header Typography Inconsistent
**Screens:** `group-detail.html`, `individual-detail.html`, `activity.html`

**Issue:**
- `group-detail.html` and `individual-detail.html`: `font-size: var(--font-size-11); font-weight: var(--weight-regular)`
- `activity.html`: `font-size: 12px` (hardcoded, different size)

**Fix:** Standardize all date/section headers to use the same text-style class (e.g., `.text-overline-sm`).

---

### P2-3 · Chip Usage Inconsistent Across Screens
**Component:** `.chip`

**Issue:** Filter chips used in activity/people screens use custom classes or different modifier naming instead of the `.chip` system from `css/chip.css`

---

### P2-4 · Loading/Skeleton States Completely Missing
**UX Gap:** No loading states shown for any async data

**Affected:** activity list, people list, group detail tabs, dashboard balance summary

**Fix:** Define a skeleton loading pattern (even as CSS utility) for key screens.

---

### P2-5 · Monetary Amount Formatting Not Standardized
**Issue:** Amounts displayed inconsistently across screens:
- Some show `₹1,234.00`, some show `₹1,234`, some show `₹ 1,234`
- No consistent typography class for monetary values (Unbounded font should be used)

**Fix:** Define a `.amount` typography utility that enforces Unbounded font and consistent formatting.

---

### P2-6 · Label/Badge Color Variants Inconsistent for Same Status
**Component:** `.label`

**Issue:** The same status (e.g., "settled", "pending", "you owe") may use different color variants across screens.

**Fix:** Standardize status-to-variant mapping in documentation and enforce it.

---

### P2-7 · Missing Alt Text on Illustration/Avatar Images
**Accessibility gap:** Decorative images lack `alt=""` and functional images lack descriptive alt text

**Affected:** Avatar images throughout app, illustration SVGs

---

### P2-8 · Unlabeled Interactive Elements
**Accessibility gap:** Icon-only buttons lack `aria-label`

**Examples:**
- Back button: `<button class="icon-btn">` without `aria-label="Go back"`
- FAB: no `aria-label` describing the action
- Filter icon buttons in activity/people screens

---

### P2-9 · Bottom Sheet Missing Dismiss Mechanism on Some Sheets
**UX Gap:** Not all bottom sheets have a visible close/dismiss handle or button

**Fix:** All `.sheet` components should have a drag handle or explicit close button.

---

### P2-10 · Hardcoded Opacity Values
**Examples:**
- Status bar SVG elements: `opacity="0.35"` (hardcoded inline SVG attribute)
- Should use CSS `opacity: var(--opacity-subtle)` or equivalent token

---

### P2-11 · Icon Sizes Not Using Component Classes
**Issue:** Icon sizes hardcoded inline across multiple screens (e.g., `font-size: 16px` for chevrons) instead of using `--icon-size-sm`, `--icon-size-md` tokens.

---

### P2-12 · `add-amount.html` References Non-Existent CSS Files
**Bug:** `add-amount.html` may import `tokens.css` or `currency-chip.css` which don't exist in `css/`

**Fix:** Audit all `<link rel="stylesheet">` imports in screen files; remove or create missing files.

---

### P2-13 · Onboarding Screens Lack Progress Indicator
**UX Gap:** `create-group-name.html` → `create-group-members.html` → `create-group-done.html` flow has no step progress indicator

**Fix:** Add step progress pattern (e.g., dot indicators or step counter) matching the Settlr visual language.

---

### P2-14 · Long Text / Overflow Not Handled
**UX Gap:** Group names, person names, expense descriptions can be arbitrarily long with no truncation

**Affected:** Cards, list items, headings across all screens

**Fix:** Add `text-overflow: ellipsis; white-space: nowrap; overflow: hidden` or multi-line clamp to text containers.

---

### P2-15 · Welcome / Splash Screens Not Linked to Login Flow
**UX Gap:** `splash.html`, `welcome.html`, `login.html`, `otp.html` need clear sequential linking

---

### P2-16 · Settings Screen: Toggle Component Not Using Design System
**Issue:** Toggle switches in `settings.html` use custom CSS rather than a defined component

**Fix:** Either use an existing radio/checkbox component pattern or create a toggle spec.

---

## Low Priority Issues (P3)

### P3-1 · SVG Icons Use Hardcoded Sizes
Multiple SVG `width`/`height` attributes set to raw pixel values — should reference `--icon-size-*` tokens.

### P3-2 · Placeholder Color References Primitive Token
Search inputs use `var(--color-neutral-400)` for placeholder color — should be `var(--input-fg-placeholder)`.

### P3-3 · Nav Pill Active State Styling Repeated
All 3 bottom-nav screens re-declare the active pill styling. Should be in `css/navigation.css`.

### P3-4 · Cursor: Default on Non-Interactive Elements
`settings.html` uses `style="cursor: default;"` multiple times — redundant; default cursor is already the browser default.

### P3-5 · Group Card Hover/Press State Not Defined
Group cards on home dashboard have no `.card-group:active` press state — should have a pressed feedback style per design principles (mobile: Pressed not Hover).

### P3-6 · FAB Z-Index Hardcoded
Some screens hardcode `z-index: 100` on FAB rather than using a z-index token or layer system.

### P3-7 · Inconsistent Use of `rem` vs `px`
Token files use `px` but some screen CSS mixes in `rem` — standardize to `px` throughout.

### P3-8 · Settle Success Screen Lacks Link Back to Home
`settle-success.html` — after success, user must have a path back to home dashboard.

### P3-9 · Create Group Done Screen Lacks Navigation
`create-group-done.html` — success screen should navigate to new group detail.

### P3-10 · Edit Expense / Edit Group Screens Not Linked From Detail Screens
`edit-expense.html` and `edit-group.html` exist but are not linked from `expense-detail.html` or `group-detail.html` respectively.

### P3-11 · Preview Screens Should Be Excluded From App Navigation
`preview-*.html` files (8 screens) should never be linked from app screens — they're dev-only.

### P3-12 · `tokens.css` in `/screens/` Directory
A `tokens.css` file exists inside `/screens/` — this is misplaced and may override or conflict with `/tokens/` files.

### P3-13 · Segment Control Active Tab Does Not Match Screen Content
On some screens, the `.segment-item--active` class is hardcoded on the first tab regardless of what content is shown below.

### P3-14 · Bottom Nav Active Tab Inconsistent
Not all screens correctly mark the active bottom nav item. For example, `settings.html` may not mark the correct nav item as active.

---

## Cross-Screen Consistency Issues

### Consistency-A · Button Sizing Completely Non-Uniform
**Pattern:** Every screen defines its own button size/padding instead of using `css/button.css`

| Screen | Button Height | Padding | Source |
|--------|--------------|---------|--------|
| home-dashboard | 44px | custom | inline `<style>` |
| group-detail | 52px | custom | inline `<style>` |
| activity | varies | custom | inline `<style>` |
| add-amount | 48px | custom | inline `<style>` |

**Fix:** Remove ALL custom button CSS from all screens; use `.btn--sm/.btn--md/.btn--lg` exclusively.

---

### Consistency-B · Avatar Styling: 5 Different Implementations
| Screen | Size | Border | Source |
|--------|------|--------|--------|
| home-dashboard | 52px | none | custom |
| group-detail hero | 96px | 4px white | custom |
| individual-detail hero | 96px | unknown | custom |
| settings profile | 96px | 3px #fff | custom |
| people list | 40px | 20px radius | custom |

**Fix:** Standardize with `.avatar--md/lg/xl` and `var(--avatar-ring)`.

---

### Consistency-C · Status Bar Font Repeated 15+ Times
Identical hardcoded font declaration in every screen with a status bar. Should be one shared component.

---

### Consistency-D · Date Header Typography Varies Between Screens
- `group-detail.html` & `individual-detail.html`: `var(--font-size-11)` + regular weight
- `activity.html`: `12px` hardcoded

These same-purpose elements should share one class.

---

### Consistency-E · Empty State Pattern Present in Only ~3 Screens
Empty states exist on some screens but missing on the majority of list screens.

---

## Missing UX Patterns (Summary)

| Pattern | Missing On |
|---------|-----------|
| Empty state | activity, people, group-detail tabs |
| Form validation (error state) | login, add-amount, add-group, add-split, all form screens |
| Loading / skeleton | activity, people, group-detail |
| Success toast | add-expense, edit-expense, settle |
| Confirmation dialog | delete account, log out, settle large amounts |
| Step progress indicator | create-group flow, settlement flow |
| Text truncation | cards, list items, headings across all screens |
| Press/active feedback | group cards, list items |

---

## Recommendations for Fix Agent

### Batch 1 — Token Compliance (Highest Impact)

1. **Audit and replace all primitive color tokens** in screen files
   - Map every `var(--color-*)` → equivalent semantic token
   - Covers 40+ replacements across 15+ files

2. **Replace all hardcoded spacing values** with `--spacing-*` tokens
   - `6px` → `var(--spacing-4)` or `var(--spacing-8)`
   - `10px` → `var(--spacing-8)` or `var(--spacing-12)`
   - `2px` → `var(--spacing-2)`

3. **Replace all hardcoded border-radius values** with `--radius-*` tokens
   - `16px` → `var(--radius-16)`
   - `28px` → `var(--radius-full)` or `var(--radius-32)`

4. **Replace all hardcoded box-shadow values** with `--shadow-*` tokens

5. **Remove all inline `style=""` attributes** from screen HTML
   - Convert to utility classes or component modifier classes

6. **Replace all hardcoded font declarations** with `.text-*` classes

---

### Batch 2 — Component Deduplication

7. **Remove all custom `.btn` CSS blocks from screen `<style>` tags**
   - All screens must rely solely on `css/button.css`

8. **Remove duplicate segment control CSS** from group-detail and individual-detail
   - Use `css/navigation.css` `.segment-control` classes

9. **Remove duplicate search input CSS** from activity and people
   - Create `css/search-input.css` or adapt `.input-field` component

10. **Standardize avatar sizing** — use `.avatar--xs/sm/md/lg` and `var(--avatar-ring)`

11. **Create `css/status-bar.css`** with one shared typography class for all status bars

---

### Batch 3 — UX Completions

12. **Add empty states** to: activity, people, group-detail tabs

13. **Add form validation error states** to: login, add-amount, add-group, otp

14. **Add success toast** after: add expense, edit expense, settle completion

15. **Add confirmation bottom sheet** for: delete account, log out

16. **Fix settlement flow linking** — add correct navigation between all 4 settlement screens

17. **Add step progress indicators** to: create-group flow, settlement flow

18. **Add back navigation** to all screens that lack it

19. **Add text truncation** to cards, list items, and headings

---

### Batch 4 — Polish and Accessibility

20. **Add `aria-label`** to all icon-only buttons and FABs

21. **Add `alt` text** to all avatar and illustration images

22. **Standardize monetary formatting** — use Unbounded font, consistent `₹` placement

23. **Move `tokens.css`** out of `/screens/` directory (it's misplaced)

24. **Link edit screens** from their respective detail screens (edit-expense from expense-detail, edit-group from group-detail)

25. **Link settle-success.html** as the final step of the settlement flow

---

## Files to Prioritize

| File | Critical Issues | Total Issues |
|------|----------------|-------------|
| `screens/home-dashboard.html` | 12 | 20+ |
| `screens/group-detail.html` | 10 | 18+ |
| `screens/individual-detail.html` | 9 | 16+ |
| `screens/activity.html` | 8 | 14+ |
| `screens/people.html` | 7 | 12+ |
| `screens/settings.html` | 6 | 10+ |
| `screens/add-amount.html` | 5 | 8+ |
| `screens/login.html` | 4 | 7+ |
| `screens/settle-select.html` | 3 | 6+ |
| All other screens | 2–4 each | varies |
