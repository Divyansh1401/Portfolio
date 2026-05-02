# Campaign 2 — UX Hardening

**Goal:** Resolve the 25 Critical/High/Medium UX issues surfaced by the original screen audit + items flagged during Phase 2 sweep. Move the prototype from "compliant" to "ready for usability testing."

**Constraint:** Preserve all current visual identity. No new screens. Where possible, fix at the component level so improvements propagate.

---

## Issue Inventory (25 items, prioritized)

### CRITICAL — touch / affordance / accessibility (6)
| # | Screen(s) | Issue |
|---|---|---|
| C1 | add-friend (`.add-btn`), edit-group (member-remove) | Touch targets <44px |
| C2 | group-detail, individual-detail (tab panels) | Missing `role="tablist"/"tab"`, `aria-selected`, keyboard nav |
| C3 | settings (3 toggles) | `aria-checked` is static; no JS click handler updating it; `<input>` checked state not synced to ARIA |
| C4 | expense-detail (Delete), edit-group (Delete Group), settings (Log Out / Delete Account) | Native `confirm()` dialogs — should be bottom-sheet confirmations |
| C5 | settings (Phone row), edit-profile (Phone field) | Disabled fields with chevron — looks tappable |
| C6 | create-group-name, create-group-members, add-group, edit-expense | Disabled CTAs use only `opacity: 0.4` — no helper text explaining what's blocking |

### HIGH — validation / state feedback (7)
| # | Screen(s) | Issue |
|---|---|---|
| H1 | settings (UPI ID), edit-profile (UPI ID) | No `@` format validation, no helper text on format |
| H2 | edit-profile (avatar upload) | `accept="image/*"` but no file size cap — 10MB images possible |
| H3 | edit-profile (Bio textarea) | Char counter shows `120/120` at limit but no warning state, no submit block |
| H4 | add-amount, settle-amount, edit-expense | Amount inputs lack thousand-separator formatting (₹123456789 displays raw) |
| H5 | add-split (total-bar), settle-method (selected option), expense-detail (split-person amounts) | State indicated by color only — color-blind unsafe |
| H6 | settle-select, add-group, create-group-members | Search filtering uses `display: none` with no "no results" state |
| H7 | expense-detail (comments), settle-success (recordSettlement) | No loading/skeleton states for async actions |

### MEDIUM — info hierarchy / consistency / polish (12)
| # | Screen(s) | Issue |
|---|---|---|
| M1 | otp | Security note placed at bottom — would be more reassuring near OTP input |
| M2 | home-dashboard | Hero `.btn--sm` actions need ≥44px touch verification |
| M3 | individual-detail (Common Groups tab) | Group rows lack visible chevron — unclear they're tappable |
| M4 | activity | `.update-item--unread` only has the green dot now (after recent fix); needs subtle visual weight (e.g., bold sender name) |
| M5 | edit-expense | Save vs Discard same visual weight — primary unclear |
| M6 | create-group-done, settle-success | Animation stagger ~1.2s feels slow on low-end devices |
| M7 | search | `autofocus` doesn't guarantee mobile keyboard popup; `<mark>` only highlights name field, not meta |
| M8 | add-split | Segment-control mode change doesn't update visible inputs without re-tap |
| M9 | edit-profile | Save button now ghost-text (was pill primary) — Phase 2 flagged |
| M10 | edit-profile | `.input-field--disabled` removes border vs subtle border before — Phase 2 flagged |
| M11 | expense-detail | `.btn-edit` (full-width) + `.btn-delete` (icon) treatment is screen-unique — verify still desired or canonicalise |
| M12 | settle-amount | `.currency-badge` retained for no-caret variant — decide: add `.currency-chip--static` modifier or keep |

---

## Phase A — Foundation (component-level fixes that propagate)

7 deliverables. Fix once, propagate everywhere.

### A1. Toggle JS behavior + ARIA sync
- Add a tiny global `js/toggle.js` (or inline pattern) that wires every `.toggle-control input[type="checkbox"]` to:
  - Toggle `aria-checked` on the parent label on change
  - Toggle `aria-disabled` if `<input disabled>`
- Document the pattern in `components/toggle.md`
- Resolves: **C3**

### A2. Confirmation Sheet component
- New CSS-only addition: `.confirm-sheet` variant of `.bottom-sheet` (or extend bottom-sheet with `--confirm` modifier)
- Pattern: title + body + `.screen-footer`-style action row (cancel + destructive)
- Add a small `js/confirm.js` helper: `Settlr.confirm({title, body, destructive: 'Delete'}).then(...)`
- Replace `confirm()` calls in expense-detail, edit-group, settings (4 sites)
- Resolves: **C4**

### A3. Disabled CTA helper text pattern
- Add `.btn--blocked` modifier (or extend existing `.btn:disabled`) — keeps existing 0.4 opacity
- Add `.screen-footer__hint` element to put a small helper line above the disabled button (e.g. "Add ≥1 contact to continue")
- Document in `components/screen-footer.md`
- Resolves: **C6**

### A4. Form field validation utilities
- Add `.input-field__hint` (positive) + extend `.input-field__helper--error` (negative) — already exists
- Add a JS helper `Settlr.validate.upi(str)`, `Settlr.validate.fileSize(file, mb)`, `Settlr.validate.charLimit(str, max)`
- Wire into edit-profile (UPI, bio, avatar), settings (UPI)
- Resolves: **H1, H2, H3**

### A5. Amount input formatting
- Add `Settlr.format.amount(n)` returning thousand-separated string with locale (`en-IN` for ₹)
- Apply to amount-input component on `input` event (preserve raw value separately from display)
- Resolves: **H4**

### A6. Empty-state for filtered search
- Add a "no results" inline empty-state pattern: small variant of `.empty-state` shown when filter yields 0 results
- Document a JS pattern: when filter callback returns 0 visible rows, show the empty-state
- Apply to settle-select, add-group, create-group-members
- Resolves: **H6**

### A7. Loading skeleton component
- New CSS-only `.skeleton` utility with shimmer keyframe
- Variants: `.skeleton--text` (line), `.skeleton--circle`, `.skeleton--block`
- Apply to expense-detail comments-section while comments load, settle-success while recording
- Resolves: **H7**

### Phase A integration (sequential after parallel builds)
- Aggregate any new L3 tokens (likely few)
- Add to `code-index.json`: `confirm-sheet`, `skeleton` (or as utilities)
- Add new `js/` folder + entries to relevant screens
- Update `css/index.css`

### Phase A parallel agent split
- **Agent A1+A2**: Toggle ARIA + Confirmation Sheet (related: bottom-sheet variants)
- **Agent A3+A6**: Disabled CTA helper + filtered empty-state (both screen-footer adjacent)
- **Agent A4+A5**: Validation utils + Amount formatter (pure JS)
- **Agent A7**: Skeleton component (CSS only)

---

## Phase B — Screen-level UX patches (parallel by group)

After Phase A foundation lands, sweep screens for remaining issues.

### B1 — Auth/Onboarding (4 screens)
- M1: otp — move security-note above OTP input
- (no other items)

### B2 — Detail screens (3 screens)
- C2: group-detail + individual-detail tab ARIA + keyboard nav
- M3: individual-detail Common Groups → add visible chevron
- C4: expense-detail — replace `confirm()` (uses A2)
- H7: expense-detail — comments loading skeleton (uses A7)
- H5: expense-detail split-person amount — add icon prefix beyond color
- M11: expense-detail btn-edit/btn-delete — decide canonicalise or keep

### B3 — Main + Search (4 screens)
- M2: home-dashboard hero buttons — verify ≥44px (likely a CSS tweak to btn--sm padding in this context)
- M4: activity — bold sender name on `.update-item--unread`
- M7: search — autofocus + match highlighting in meta

### B4 — Settings + Profile (2 screens)
- C3: settings toggles (uses A1)
- C4: settings Log Out / Delete Account (uses A2)
- C5: settings + edit-profile phone field — remove chevron when disabled, add explicit "can't change" helper text
- H1: settings + edit-profile UPI ID validation (uses A4)
- H2: edit-profile avatar size cap (uses A4)
- H3: edit-profile bio counter warning (uses A4)
- M9, M10: edit-profile Save button + disabled border — restore visual intent

### B5 — Group flows (5 screens)
- C1: add-friend `.add-btn` to ≥44px height
- C1: edit-group member-remove buttons to ≥44px
- C4: edit-group — replace `confirm()` (uses A2)
- C6: create-group-name, create-group-members Next/Create buttons — add helper text via A3

### B6 — Add expense flows (5 screens)
- H4: add-amount, edit-expense amount formatter (uses A5)
- H5: add-split total-bar, split-person — add icon-based status (✓/✗)
- M5: edit-expense Save vs Discard — make Save primary, Discard ghost
- M8: add-split segment-control mode change — re-render inputs eagerly
- C6: add-group, edit-expense disabled CTA helpers (uses A3)
- H6: add-group filtered list empty state (uses A6)

### B7 — Settle flow (4 screens)
- H4: settle-amount amount formatter (uses A5)
- H5: settle-method selected indicator — add ✓ icon beyond bg color
- H6: settle-select filtered list empty state (uses A6)
- H7: settle-success — loading state during `Store.recordSettlement` (uses A7)
- M6: settle-success + create-group-done — tighten animation timing (1.2s → 0.6s)
- M12: settle-amount currency-badge — decide

---

## Phase C — Verify & finalize

1. **Manual a11y pass**: keyboard nav, screen reader (VoiceOver) on iOS, color-blind simulation
2. **Lighthouse audit** on at least 5 representative screens (home, group-detail, settings, add-amount, settle-success)
3. **Touch target audit**: assert all interactive elements ≥44px via JS sweep
4. **Update `CLAUDE.md`** with conventions:
   - "Never use native `confirm()` — use `Settlr.confirm()`"
   - "Disabled CTAs require helper text via `.screen-footer__hint`"
   - "All toggles must have `role="switch"` + JS-synced `aria-checked`"
5. **Changelog + MEMORY** update
6. **Tag a release** in git (if repo) — `v0.2.0-prototype-ready`

---

## Estimated parallelism

- **Phase A**: 4 parallel agents, ~30 min
- **Phase B**: 7 parallel agents, ~60 min
- **Phase C**: ~30 min sequential
- **Total wall time**: ~2 hours for full Campaign 2

---

## Risk register

| Risk | Mitigation |
|---|---|
| Adding JS introduces complexity for a static prototype | Keep JS small (<100 lines total), no build step, no dependencies |
| Toggle `<input>` can't have `aria-checked` directly (must be on parent) | Document in toggle.md; sync via JS on change event |
| `confirm()` is sync; bottom-sheet replacement is async — refactor flows | Provide promise-based API; any code path using confirm becomes `await` |
| Touch target fixes may shift layouts | Verify with screenshot diff per affected screen |
| Color-blind icon additions may crowd small UI | Use minimal SVG checkmarks/x marks, 12-16px |

---

## Status

- Phase A: pending
- Phase B: pending
- Phase C: pending

Plan written. Awaiting approval to launch.
