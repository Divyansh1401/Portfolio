# Settlr — Case Study Plan
> Narrative structure for the portfolio case study overlay.
> Agreed approach: **capability-first, product-first**. Lead with the fact that Settlr shipped — a real, deployed, multi-user app — then prove *how* it was built (system + AI workflow) and *why* it looks the way it does (research). Viewers won't scroll the whole thing, so the strongest proof (a solo designer shipped a production product) goes up top.
> Last updated: 2026-07-01 (post June migration: static prototype → live SPA + Supabase backend + multi-user shared ledger)

---

## The New Thesis (what changed since the May plan)

The old plan framed Settlr as **"a design system + an AI workflow experiment."** That undersold it. Since then Settlr:

- Migrated from **31 standalone HTML screens → a single-file SPA** (`index.html` shell + 24 `js/views/*` + `router-spa.js`).
- Got a **real backend** — Supabase, live since 2026-06-16 (auth, persistence, hydrate-then-sync store).
- Became a **multi-user product** — groups, expenses, and settlements are shared across real accounts (canonical-row model, participant-scoped RLS), with ghost contacts, phone/QR/invite discovery, and cross-user comments.
- **Deployed** to Cloudflare Pages at **settlrapp.in**, now packaged as an Android TWA (`in.settlrapp.in`) and in **Play Store internal testing**.

So the case study arc is now three proofs of seniority, not two:
1. **Research rigor** — it started as a 10-day cognitive-ergonomics study of Splitwise.
2. **Systems thinking** — a production, tokenized design system built with a Figma-MCP + Claude workflow.
3. **It ships** — a solo designer took it from research to a live, secure, multi-user product.

⚠️ **Honesty guardrails (do not overclaim):**
- Say **"live web app / deployed"**, not "on the App Store" — it's in **Play Store internal testing**, not public.
- Real **SMS OTP is still mocked** (`123456`); phone-verified identity ships at public launch.
- **v1 is tracking-only** (manual settle-up; no real money movement).
- **Formal usability testing of Settlr is still pending.** The research is on Splitwise; Settlr's decisions are *designed-to-solve, traceable to research*, not yet *proven-to-solve*.

---

## Agreed Narrative Order

### 1. Hook — The Live App (above the fold)
- 3–5 key screens from the built app + the line that it's **live**.
- Feel of the brand: warm, earthy, clean.
- One-line reframe: *"Not a mockup. A deployed, multi-user product."*
- Candidates: `home-dashboard`, `group-detail`, `add-split`, `settle-success`.

### 2. What It Is Now — Product at a Glance
- Reframed "By the Numbers" — mix **product facts** with **system facts**:
  - **Live** web app (settlrapp.in) · Android TWA in Play Store internal testing
  - **Supabase backend** — real auth (Google + email/password), persistence
  - **Multi-user shared ledger** — groups/expenses/settlements shared across accounts
  - **43 components** · **24 SPA views** · **57 color primitives** · **290+ semantic tokens** · **3-tier token architecture**
- Visual: keep the token-architecture diagram; add a small "shipped" badge row.

### 3. Try It — Live SPA Prototype
- The embedded phone iframe now runs the **real SPA** (same router as production), not static screens.
- Switcher pills drive `SettlrRouterSPA.navigate(slug)` directly (same-origin).
- Heading update: ~~"The prototype. 31 screens. Live."~~ → **"The real app. Running right here."**

### 4. The System — Design System at a Glance
- 43 components, each with a `.md` spec, each traceable to a screen.
- 3-tier tokens (primitive → semantic → component), nothing hardcoded.
- Palette (olive/coral/green/gray/neutral), typography (Plus Jakarta Sans + Unbounded), accessibility.

### 5. The Workflow — Figma MCP + Claude
- Most differentiating build section; unchanged thesis.
- Hook line: *"Claude wasn't generating screens. It was executing a fully defined system."*
- Points: live Figma MCP connection · custom skills per stage · Figma-first · designer-in-control review loop · 3-tier tokens · code mirrors design.

### 6. From Prototype to Product — The June Leap *(NEW SECTION)*
- The story that makes this senior-level: a design prototype became a **real, secure, multi-user product**.
- Beats:
  1. **SPA migration** — 31 static screens collapsed into one app shell + a client router (shared transitions, real history, instant nav).
  2. **A real backend** — Supabase; hydrate-then-sync store keeps getters synchronous while writes persist optimistically.
  3. **Multi-user shared ledger** — the *canonical-row* model (one row per expense/settlement, participant-scoped RLS). **Tie back to research:** this is the structural answer to Splitwise Finding 02 (friends vs groups split) and to the shared-balance mental model.
  4. **Identity & discovery** — Google/email auth, verified phone as the identity key, **ghost contacts** (add someone before they join; auto-merge on signup; unlink as the safety net), contact-picker import, QR + invite links with auto-connect.
  5. **Security posture** — participant RLS (A/B/C isolation tested), rate-limited lookups, stored-XSS escaping, account-deletion Edge Function.
- Tone: engineering maturity in service of the product, not a tech brag. Frame each as *a product decision with a user reason*.

### 7. Research (Brief) — Where It Started
- Origin: college project, 10-day study of Splitwise.
- Methods: HTA · SHERPA · Cognitive Walkthrough · NASA-TLX · SUS (2–3 sentences each, not a deep dive).
- End with: *"The findings were too good to leave in a report."*

### 8. Findings → Decisions Bridge
**BUILT** — 3-column layout: left text | middle Splitwise mockup | right Settlr live iframe.

| # | Finding | Splitwise mockup | Settlr screen |
|---|---------|-----------------|---------------|
| 01 | Settle up — highest error rate (SHERPA T5.1) | Friend detail, Settle Up buried at bottom | `settle-select` |
| 02 | Friends/Groups as separate tabs — wrong-section errors | Friends list + two-tab bottom nav | `people` |
| 03 | No home screen — flat friends list as opening state | Friends list "home", balance as tiny text | `home-dashboard` |
| 04 | Add expense overloaded — split method as two tiny words | Add Expense form, "split equally" annotated | `add-split` |

Verbatim quotes (unchanged):
- 01: *"messed up the form, added an expense to settle"*
- 03: *"At first glance they were confused since there was no homepage."*
- 04: *"There was no clear callout for different split methods."*

⚠️ Frame as **designed-to-solve, traceable to research** — not proven-to-solve. Settlr user testing pending.

### 9. Full Gallery — The Screens
- Scrollable grid of the app's screens (now SPA views, ~24 user-facing).
- Groups: Onboarding → Home → Groups → Expenses → People → Settlements.
- Heading fix: ~~"All 31 Screens"~~ → **"Every screen. Built in Figma. Shipped as code."**

### 10. Honest Status — Shipped vs Pending *(NEW, short)*
- **Shipped:** live web app, Supabase backend, multi-user ledger, security-tested, Android package in internal testing.
- **Pending before public launch:** real SMS OTP (currently mocked), formal usability testing of Settlr, Play Store production review.
- One tasteful line, not a disclaimer wall. Shows judgment and honesty.

---

## Visual Hierarchy Notes
- Sections 1–4 = above the fold (hook + product + system).
- Sections 5–6 = the "how I built it" proof (workflow + product leap).
- Sections 7–8 = the "why" (research), digestible not academic.
- Section 9 = proof of execution; make it satisfying to scroll.
- Section 10 = a short, honest close.

---

## Copy Stubs

### Section 1 hook
> Settlr — group expense splitting, rebuilt from scratch. Live at settlrapp.in.

### Section 2 stats copy
> "Not a prototype anymore. A live, multi-user product with a real backend — 43 components, 24 screens, 290+ tokens, all connected, nothing hardcoded."

### Section 3 prototype lead
> "The real app, running right here. Same router as production."

### Section 5 workflow lead
> "The real project wasn't the app. It was building a system where Claude could execute the way a designer thinks."

### Section 6 product-leap lead
> "Then it stopped being a prototype. Real backend, real accounts, real shared balances — a solo designer's app that other people can actually use together."

### Section 7 research lead
> "It started as a 10-day college project. HTA, SHERPA, Cognitive Walkthrough, NASA-TLX, SUS — the whole toolkit, applied to Splitwise."

### Section 8 bridge lead
> "Three methods. One clear picture. Here's what the research found, and what Settlr changed because of it."

### Section 10 status close
> "v1 tracks; it doesn't move money. Real phone verification and user testing come before public launch. Everything you see is live today."

---

## Key Copy Lines (Locked In)
- **Why olive:** "Most fintech apps go blue or purple. Settlr is about splitting with friends, not banking. Olive is warm and personal, trustworthy without being institutional."
- **Why coral:** "Owing money between friends is normal. It shouldn't feel like an error. Coral is uncomfortable enough without being alarming."
- **The real question:** "Can a designer build a production-quality *product* solo, with AI as the executor, not the author?" — and the answer is now a deployed, multi-user app.
- **The click moment:** "The first component that came out of Claude with zero hardcoded values — every color, spacing, radius back through the token system. That's when it became real."
- **The shipping moment (NEW):** "The first time two separate accounts saw the same shared balance update — that's when it stopped being a design file and became a product."
- **Time:** "Weeks instead of months."

---

## Assets Still Needed
- [x] Hero / cover image — DONE (wooden-hands iPhone mockup)
- [x] Before/After Splitwise → Settlr mockups — DONE (inline HTML, 3-col)
- [ ] Refreshed app screenshots from the **SPA** at 393×852 (regen via puppeteer per MEMORY)
- [ ] A "multi-user" visual — two phones / two accounts, one shared balance (for Section 6)
- [ ] NASA-TLX / SUS exact scores (higher-res `part 3.png`)
- [ ] Figma component-library screenshot (design-system section)

---

## What NOT to do
- Don't say "on the App Store" — it's in **internal testing**. Say "live web app / in testing".
- Don't claim user validation of Settlr — testing is on Splitwise; Settlr is designed-to-solve.
- Don't open with research methods; too academic.
- Don't bury the product/shipping story; it's the strongest proof now.
- Don't turn Section 6 into a backend brag — every technical beat needs a user reason.
- Don't say "I used AI"; say "I built a system where AI could execute without guessing."
