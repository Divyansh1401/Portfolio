# Settlr — Project Changelog

> Tracks substantive changes to the Settlr design system, prototype, and case study documentation.
> Source repo: `/Users/divyanshrastogi/Desktop/settlr/`
> Website mirror: `/Users/divyanshrastogi/Desktop/website 2/prototype/settlr/`

---

## 2026-05-02 — Prototype + Docs Resync

### Context
The website's prototype mirror had been frozen at Apr 9. The source repo advanced through "Campaign 1" between Apr 29 and May 1, with structural component additions and a system-wide screen sweep. This release brings the website fully in sync.

### Design System

**Components (Campaign 1 — 8 new):**
- `hero-section` — large header card with status (default 240px, `--tall` 300px for group-detail, `--short` 200px for edit-group)
- `toggle` — boolean switch
- `settings-row` — label + control row used in settings/edit-profile
- `detail-row` — read-only key/value row used in expense-detail and review screens
- `notes-card` — comment / note container
- `summary-card` — total / breakdown card used in review and settle-amount
- `success-state` — full-screen confirmation pattern (settle-success, create-group-done)
- `invite-banner` — share / invite group prompt

**Variants & utilities:**
- `avatar` — added `--xl` size
- `icon-btn` — added `--overlay` variant for dark/photo backgrounds
- `confetti` — utility for success states
- New patterns: `screen-footer` (sticky bottom CTA pattern), `update-item` (activity feed row)

**Sweep:** 22 screens swept; ~150 custom one-off classes consolidated back into shared components.

**Total:** 27 → **40 components**.

### Tokens
- Color primitives: 50 → **57** (5 palettes: olive, coral, green, gray, neutral)
- Semantic tokens: 100+ → **290+** (semantic.css)
- 3-tier architecture unchanged (primitive → semantic → component); MEMORY notes a new L2 "general semantic" tier between primitives and L3 component tokens (added 2026-04-18).

### Screens
- **Removed:** `notifications.html` — all events now go through `activity.html` via an "Updates" filter chip. One screen, one mental model.
- **Updated:** majority of screens swept Apr 29 to use new components (`hero-section`, `screen-footer`, `summary-card`, `success-state`).
- Total user-facing screens: **31** (+9 dev/preview pages).

### Prototype Mirror (`prototype/settlr/`)
- `screens/`, `css/`, `tokens/`, `icons/`, `js/` mirrored from source via `rsync -a --delete`.
- New: `components/` (41 markdown component specs), `references/`, `design-system.md`, `conventions.md` copied in.
- Verified: home-dashboard renders cleanly in preview (port 3457). All key files return 200.

### Website (`index.html`)
Stats updated across the Settlr case study section:
- "By the Numbers" stat grid: 27/24/50/100+ → **40/31/57/290+**
- Prototype section heading: "24 screens" → **"31 screens"**
- Token tier labels: 50 primitives / 100+ component tokens → **57 / 290+**
- Component showcase: "27 components" → **"40 components"** (3 places)
- Component docs: "27 .md files" → **"40 .md files"**
- File tree comment: "50 color primitives · 5 palettes · 10 steps each" → **"57 color primitives · 5 palettes · olive/coral/green/gray/neutral"**
- Full gallery: "All 34 Screens" / "24 screens" → **"All 31 Screens" / "31 screens"**

### Docs Updated
- `case-study-plan.md` — System Stats section, Section 2 stats copy, Section 6 gallery callout (notes notifications removal)
- `project-docs.md` — Project Arc summary, Act 3 narrative (added Campaign 1 paragraph), Token Architecture block, Source Files table
- `KT-handoff.md` — added 2026-05-02 update banner pointing to this changelog

### Open Items (from MEMORY.md, Campaign 2)
- `edit-profile` Save button visual delta
- `.input-field--disabled` border treatment
- `.btn-edit` / `.btn-delete` in `expense-detail`
- `.currency-badge` in `settle-amount`

---

## 2026-04-09 — Earlier Sync (pre-Campaign 1)

Reference: `KT-handoff.md` captures the state up to this date.
- Initial prototype copy from `/Desktop/Settlr/` into website
- Settlr case study section built in `index.html`: phone row, findings, full gallery
- Splitwise mockups replaced with real screenshots
- Research documentation (26 image files) extracted into `KT-handoff.md`
