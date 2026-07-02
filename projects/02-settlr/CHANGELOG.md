# Settlr — Project Changelog

> Tracks substantive changes to the Settlr design system, prototype, and case study documentation.
> Source repo: `/Users/divyanshrastogi/Desktop/settlr/`
> Website mirror: `/Users/divyanshrastogi/Desktop/website 2/prototype/settlr/`

---

## 2026-07-01 — Shipped-Product Resync (SPA + Supabase + Multi-User)

### Context
Since the May sync, Settlr stopped being a static design prototype and became a **live, deployed, multi-user product**. The source repo migrated the app architecture, added a real backend, and shipped. The portfolio docs + case study were frozen at the Campaign 1 (static-screens) state; this release re-plans the case study around the "shipped real product" arc and brings all Settlr docs current.

### App changes being documented (from `settlr/` MEMORY + `references/changelog.md`)
- **Architecture: static → SPA.** 31 standalone `screens/*.html` collapsed into a single-file SPA — `index.html` shell + **24 `js/views/*`** + `js/router-spa.js` (client router, shared view transitions, real history). Old standalone screens retired.
- **Backend live (2026-06-16).** Supabase — auth (Google OAuth + email/password), persistence, **hydrate-then-sync** store (`js/store.js`): synchronous getters, optimistic local writes, serialized fire-and-forget remote writes.
- **Multi-user shared ledger.** Groups, expenses, and settlements are shared across real accounts via a **canonical-row model** with participant-scoped RLS (owner-or-participant SELECT, owner/author-only writes). Cross-user **comments** (XSS-hardened).
- **Identity & discovery.** Verified phone as identity key (OTP currently **mocked** `123456`); **ghost contacts** (add-before-join, auto-merge/rekey on signup, unlink safety net, duplicate-contact fold); contact-picker import + **QR / invite links** with auto-connect.
- **Security posture.** Participant RLS isolation A/B/C tested; rate-limited handle/phone/ghost lookups; account-deletion Edge Function; Digital Asset Links live.
- **Onboarding polish.** Group templates (`type-chip`), get-started checklist, empty-state icons.
- **Deployed.** Cloudflare Pages at **settlrapp.in**; Android TWA (`in.settlrapp.twa`) in **Play Store internal testing** (not public).

### Count drift corrected
- Components: 40 → **43** component specs
- Screens: 31 standalone screens → **24 SPA views** (+ standalone auth screens: login / signup / complete-profile)
- Tokens: **57** color primitives / **290+** semantic — unchanged

### Docs Updated
- `case-study-plan.md` — **rewritten** around the product-first arc: new thesis, two new sections (§6 "From Prototype to Product", §10 "Honest Status"), reframed hook/stats/prototype/gallery, honesty guardrails (internal-testing not App-Store, OTP mocked, tracking-only, Settlr user-testing still pending).
- `project-docs.md` — Act 3/4 execution chapter, corrected component/screen counts, SPA + Supabase + multi-user architecture, source-files table.
- `KT-handoff.md` — 2026-07-01 update banner pointing here.
- `index.html` — Settlr case study stats + new shipped/multi-user narrative + prototype/gallery copy (site).
- portfolio `CLAUDE.md` — Settlr file-tree + pending-work refreshed (prototype viewer already built; app is SPA).

### Honesty guardrails (carried into all copy)
- "Live web app / in internal testing" — **not** "on the App Store".
- Real SMS OTP still mocked; **v1 is tracking-only** (no money movement).
- Research is on Splitwise; Settlr decisions are **designed-to-solve, traceable to research**, not yet user-validated.

### Prototype mirror re-sync (embedded iframe)
- `prototype/settlr/` re-synced from the **Jun-21 source build** (was frozen at Jun-17). Brings in the onboarding polish: home-dashboard **"Get started" checklist** + onboarding **group-type templates** (type-chip). Updated `js/` (views + store/render/router), `css/`, and the inlined-views `index.html`.
- Portfolio patches re-applied: `<base>` shim, stripped PWA head block + `pwa.js`/`feedback.js` script tags + supabase/CDN preconnects, `supabase-config.js` kept neutralized (`YOUR_*` → offline seed mode), `store.js` asset paths rewritten relative (group covers webp→jpg).
- Verified in-iframe offline: boots to home-dashboard, `SettlrAuth.configured===false`, router + view transitions work, **zero broken images**, checklist + 15 onboarding type-chips present, no console errors.
- **13 landing-screen gallery shots regenerated** from the SPA (2× webp) via `screenshot-spa.js`. Mid-flow draft tiles and 4 retired auth tiles (login/otp/splash/welcome) left as-is.

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
