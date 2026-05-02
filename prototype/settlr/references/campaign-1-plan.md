# Campaign 1 — Component Compliance Sweep

**Goal:** Eliminate ~150 custom classes across 26 screens by (a) replacing with existing components where possible, and (b) adding 10 new components/utilities for genuine gaps. Zero behavior changes — pure compliance refactor.

**Constraint:** No new screens. No UX changes (those are Campaign 2). Every screen must end with zero classes outside `code-index.json`.

---

## Phase 1 — Foundation: Build new components & avatar size

10 deliverables, grouped to minimize file conflicts. Each item produces:
- `css/{name}.css` (component styles, only L3 tokens — no primitives)
- `components/{name}.md` (spec)
- A list of L3 semantic tokens it needs (added to `tokens/semantic.css` after all agents complete)

| ID | Component | Used By |
|----|-----------|---------|
| 1 | `.avatar--xl` (96px size) | edit-profile, group-detail, individual-detail, add-group, add-split |
| 2 | `.hero-section` | group-detail, individual-detail, edit-group |
| 3 | `.icon-btn--overlay` (variant) | group-detail, individual-detail, edit-group |
| 4 | `.toggle-control` | settings, future preferences |
| 5 | `.settings-row` family (`-section`, `-card`, `-row`) | settings, future settings sub-screens |
| 6 | `.detail-row` | expense-detail, add-review, edit-expense, settle-method |
| 7 | `.notes-card` | expense-detail, add-review, edit-expense |
| 8 | `.summary-card` | settle-method, settle-success |
| 9 | `.success-state` | create-group-done, settle-success |
| 10 | `.invite-banner` | create-group-members, add-group |
| (util) | `.confetti` CSS utility | welcome, create-group-done, settle-success |

### Phase 1 batches (4 parallel agents)
- **Agent A (Hero family):** items 2, 3, plus Avatar `--xl` (1)
- **Agent B (Settings family):** items 4, 5
- **Agent C (Content rows):** items 6, 7, 8
- **Agent D (States/utilities):** items 9, 10, confetti utility

### Phase 1 integration (sequential, after agents return)
1. Aggregate all reported semantic tokens → add to `tokens/semantic.css` (L3 component layer)
2. Add all components to `code-index.json`
3. Initialize componentUsage entries in `screen-manifest.json`
4. Update `css/index.css` to `@import` new component CSS files
5. Verify all new components render in `screens/preview-*` via `preview_inspect`

---

## Phase 2 — Screen Sweep (parallel after Phase 1)

6 parallel agents, partitioned by zero-overlap screen groups:

| Group | Screens | # |
|-------|---------|---|
| B1 — Onboarding/Auth | splash, welcome, login, otp | 4 |
| B2 — Main | home-dashboard, people, activity | 3 |
| B3 — Detail | group-detail, individual-detail, expense-detail | 3 |
| B4 — Settings/Search | settings, edit-profile, search | 3 |
| B5 — Add Flow | add-friend, create-group-name, create-group-members, create-group-done, edit-group, add-amount, add-group, add-split, add-review, edit-expense | 10 |
| B6 — Settle Flow | settle-select, settle-amount, settle-method, settle-success | 4 |

Each agent receives:
- Its screen list
- The replacement table (Part 1A from audit)
- The new-component table (Part 1B from audit)
- Strict instruction: zero behavior change, only class swaps + token compliance

---

## Phase 3 — Final sync & verify

1. Sweep `code-index.json` and `screen-manifest.json` to reflect new component usage everywhere
2. Run preview across one screen per group, verify no console errors, no broken layouts
3. Update `references/changelog.md` (single dated entry for the campaign)
4. Update `MEMORY.md` if any key decisions changed

---

## Risk register

- **Shared-file conflicts:** `tokens/semantic.css`, `code-index.json`, `screen-manifest.json`, `css/index.css` — all touched by multiple agents. Mitigation: agents report deltas only; user (orchestrator) integrates sequentially.
- **Behavior drift:** screens have inline JS tied to specific class names. Mitigation: every refactor must preserve `data-*` attrs, `id`s, and JS-targeted class hooks. Agents must scan inline scripts before renaming classes.
- **Missing modifiers:** new components must support every modifier the old custom classes had (e.g., `--destructive`, `--logout`, `--no-pointer` for settings-row). Mitigation: agents log every modifier discovered.

---

## Status

- Phase 1: in progress (4 parallel agents launched)
- Phase 2: pending
- Phase 3: pending
