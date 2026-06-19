# Kinko — Project Docs (verified data)
> Single source of verified facts for the Kinko case study, extracted from the native project docs at `/Desktop/Kinko_Design/` (copied into `source-docs/` on 2026-06-17).
> Use this for copy and stats. Where source docs disagree (numbers grew over the project), the **most recent value is canonical** and the growth path is noted.

---

## 1. What Kinko is
- **Product:** Kinko — a B2C **health-insurance platform** for the Indian market. Brand/entity: **Kinko / A23 Coverly**, built at **Head Digital Works**.
- **Surfaces:** mobile (390px), iPad (768px+), desktop (1280px+), and **FHD (1920px+)** — four breakpoints, single light theme (no dark mode).
- **Positioning:** trust, clarity, professionalism — "this is an insurance product; avoid playful or decorative patterns that undermine credibility" (CLAUDE.md §5).
- **Mascot:** a koala — "smart companion" personality: calm, intelligent, approachable. Logo work deliberately abstracts it, never literal.

### The three user questions the product answers
1. *"Is my existing policy enough?"* → **Policy Analyser**
2. *"What should I buy?"* → **Coverage Calculator**
3. *"Why should I even care?"* → **Life Simulator**

---

## 2. Policy Analyser — the flagship flow (richest material)
> Source: `source-docs/policy-analyser/Policy_Analyser_Product_Spec_v2_0.md` (PRD, May 2026), README, CHANGELOG.

### What it is
A **public, top-of-funnel lead-acquisition tool** for people who are **not yet Kinko users**. Upload your health-policy PDF → get a free score + your top 2 gaps → submit a phone number to unlock the full report + three Kinko next steps.
> Verbatim: *"The goal is qualified lead acquisition, not user education. Education is the bait; lead capture is the hook."*

### The strategic reframe (v1 → v2) — a real product-thinking story
- **v1.0 (Mar 2026):** a post-purchase *education feature* inside the app. Basic analysis + simple report.
- **v2.0 (May 2026):** reframed as a **marketing acquisition tool**. Added the gated-preview lead model, fixed the scoring math (weights now sum to 100%), made the document-storage carve-out explicit, designed the three-CTA ending, and introduced **neutral-analysis / branded-action separation**.
- This pivot — from "feature that educates users" to "funnel that acquires leads" — is the headline product narrative.

### The 7-stage funnel
| Stage | Screen | What happens |
|---|---|---|
| 1 | `stage-1-landing` | Cold-traffic landing. One job: upload. Trust signals + sample-report thumbnail + existing-user escape hatch. No nav. |
| 2 | `stage-2-upload` | Drag-drop / picker. PDF only, <10MB. Parser pulls **only identifiers** (insurer + plan + sum insured). |
| 3 | `stage-3-confirm` | Read-only policy block + minimal context (who's covered, members, city, age). "Not my policy?" → manual fallback. |
| 4 | `stage-4-preview` | **The hook.** Big score /100 + one-word category + 2 gaps shown, rest teased. Lead with weaknesses. No Kinko products here. |
| 5 | `stage-5-lead-capture` | Phone (required) + name + email (optional). Trust line: "No spam, no third parties. One call only if you want it." No OTP (friction kills funnel). |
| 6 | `stage-6-full-report` | Full breakdown: What's Good / Not Good / Missing + 18-feature table + recommendations. **Neutral language, no Kinko pitch.** |
| 7 | `stage-7-ctas` | Three equal-weight CTAs: **Talk to an advisor** · **See Kinko plans that fix these gaps** · **Download the report.** |

> **The lead is captured at Stage 5; everything after is conversion optimisation but the lead is already won.**

### Three quotable design insights
1. **Gated preview** — *"It has to give enough value to feel real, while leaving enough behind that the user pays the phone-number price for the rest."*
2. **Lead with weaknesses, not strengths** — hiding the strengths behind the gate makes the user feel something's wrong and they need to find out.
3. **Neutral analysis, branded action** — the report uses neutral language; only the final CTAs are Kinko-branded. *"This separation is deliberate. It preserves the credibility of the analysis, which is the whole reason the user gave up their phone number."*

### The scoring engine (fixed math)
- **18 features** across **4 weighted categories** (weights sum to 100%):
  - Core Financial Protection — **35%** (Sum Insured 20% is the single biggest feature)
  - Waiting Periods — **40%** (PED Waiting Period **30%** — the dominant driver)
  - Treatment Coverage — **15%**
  - Value-Added Benefits — **10%**
- Each feature scores **1.0 / 0.5 / 0.0** (meets / acceptable / missing). `Score = Σ(points × weight%)`.
- **Score bands:** 85–100 Excellent · 70–84 Good · 50–69 Average · <50 Poor.
- Benchmarks are sourced (IRDAI reports, top-20 retail products, city-tier cost data) and **reviewed every 6 months** — framed as an ongoing ops dependency, not a one-time setup.

### Bespoke components built for this flow (5)
Score Display (circular, 4 category variants) · Upload Zone (drag-drop, 5 states) · Gap Card (high/medium/low/strength) · Feature Table (18-row status table) · Recommendation Card (priority-coded). All composed on top of the core Kinko design system, zero hardcoded values.

### Trust-as-design (the conversion levers)
- Landing trust line: *"Free • No login • Your PDF is deleted after the analysis."* — without these, *"upload rates fall off a cliff for cold traffic."*
- Storage carve-out, explicit & bounded: **PDF deleted after 7 days**; lead data held **90 days** in CRM; auto-delete cron with audit trail.
- Manual fallback for the ~10% of policies not matched to the catalog — protects the long tail and is its own small lead path.

### Success metrics — TARGETS, not results (frame carefully)
3-month post-launch targets: Landing→Upload **25%** · Upload→Confirm **80%** · Confirm→Preview **95%** · Preview→Lead **40%** · **overall lead rate 8%** · Lead→CTA click **50%**. Lead quality: connect rate **>85%**, cost-per-qualified-lead **<₹500**, CPA **<₹4,000** (vs stated industry CAC ₹2,000–3,000).
> ⚠️ These are design/business targets in the PRD. **Never present as achieved outcomes** unless real analytics confirm them.

### Engineering dependencies (production handoff — shows real delivery)
PDF parser (identifier-only) · policy-catalog DB for top ~20 insurers (~80% market; <70% coverage = not launch-ready) · lead→CRM with full context · PDF report generation · calendar booking (advisor CTA) · pre-filtered marketplace view · 7-day auto-delete cron · quarterly benchmark refresh.

---

## 3. The other product flows
- **Coverage Calculator** (`screens/coverage-calculator/`) — blank-slate recommendation: "how much sum insured should I buy?" The mirror of the Analyser (which audits an *existing* policy).
- **Life Simulator** (`screens/life-simulator/`) — *"A life in 60 seconds."* Make choices for **Aarav** from age 25 → 60; watch each decision hit his savings and peace of mind. Insurance value made **felt**, not explained. "Skip anytime" (low friction).
- **Login flow** (`screens/login-flow.html`) — splash + OTP + micro-interactions (ripple, digit bounce, checkmark draw, confetti).
- **Onboarding prototype** (`screens/onboarding-prototype.html`) — multi-screen carousel, mobile-first.
- **Concepts** (`concepts/`) — editorial (premium policy-detail narrative, later promoted to a canonical screen), coverage-gap (interactive gap explainer), support-card.

---

## 4. The design system (the proof-of-depth layer)
> Source: `kinko-design-system-report.md` (2026-05-05, most recent) reconciled with `design-system.md`, `CLAUDE.md`, README.

### Canonical stats (most-recent values; growth path noted)
| Metric | Canonical | Growth path / notes |
|---|---|---|
| Components | **~50** | 45 with shipped CSS at the 2026-04-29 audit; 50 per the 2026-05-05 system report |
| Color primitives | **142** | 13 families (green/navy/grey + secondary teal/steel-blue/mint + tertiary peach/yellow/coral/purple + system success/info/warning/error) |
| Semantic tokens | **87** | grew 35 → 64 → 87 over the project |
| Typography styles | **19 named** | grew from 16; Plus Jakarta Sans only |
| Breakpoints | **4** | 390 · 768 · 1280 · 1920 (FHD) |
| Token tiers | **3** | Primitive → Semantic → Component (~40 per-component Figma collections) |
| Figma file key | `IDT7FF4CnWEMLfuwSCFQoa` | — |

### Brand foundations
- **Green** `#009b1a` (`primary/green/500`, `--action-primary`) — primary/CTA.
- **Navy** `#0b2b40` (`primary/navy/500`, `--action-secondary`) — authority.
- **Green tint** `#e6f5e8` (green-50) — brand surface. Cool-leaning grey neutrals (no warm greys).
- Font: **Plus Jakarta Sans** (Regular → ExtraBold). No other fonts.

### The non-negotiable rules (CLAUDE.md) — proof of rigor
- **Zero hardcoded values.** Every color/space/radius/shadow/type references a token.
- **3-tier token architecture is mandatory** for every interactive component — component tokens alias *semantic* tokens, never primitives, in their own Figma collection. One documented exception class: terminal "final-card" compositions (e.g. Insurer Card).
- **Icon-holder hard rule** — every icon must be wrapped in `.icon-holder`; never a bare `<svg>`.
- **Figma-first** — every change is completed and visually verified in Figma *before* any code change.

---

## 5. The workflow (differentiator — keep brief vs Settlr)
- **Figma MCP + Claude**, governed by **6 custom enforcer skills**: color, component, layout, spacing, text-style, and a token-extractor — plus a Figma orchestrator. Claude doesn't guess; it executes against enforced rules.
- **Bidirectional sync:** Figma is source of truth; CSS mirrors it; JSON token exports keep them aligned. Two indexes (`code-index.json`, `figma-index.json`) map every component/node.
- **Code Connect: pending** — all components currently `codeConnect: false`. (Don't claim it's done.)
- Honest hygiene note: a 2026-04-29 audit (`Discrepancies.md`) found index drift (5 components missing from `figma-index.json`, stale `lastUpdated`) — the codebase itself was internally consistent (45 specs = 45 CSS = 45 imports). Useful as a "rigorous enough to audit itself" point, not a weakness to hide.

---

## 6. Brand / logo work (optional case-study texture)
- **25 logo concepts across 5 directions** (`source-docs/references/logo-explorations.md`): Clarity Lens · Guided Path · Smart Companion Abstraction (koala) · Typographic Intelligence · Modular Knowledge Blocks.
- Each rated for app-icon fit, 24px legibility, reversibility, brand-fit.
- Self-recommended shortlist: **D1 Accent K** (wordmark, green second "k") + **C1 Specs Bridge** (abstract koala specs) — the classic "wordmark + small mark" system.

---

## 7. Number reconciliation (so the case study stays accurate)
Numbers grew across the project; sources captured different snapshots. Canonical = most recent:
- Components: README "core pending" (early) → design-system.md ~28 in table → Discrepancies 45 CSS (Apr 29) → **report 50 (May 5)**.
- Semantic tokens: README **35** → CLAUDE.md **64** → report **87**.
- Typography: design-system.md **16** → report **19**.
- Breakpoints: design-system.md **3** → CLAUDE.md **4 (adds FHD)**.
Always cite the canonical (recent) figure; mention growth only if it strengthens the "system that scaled" story.

---

## 8. Source docs copied into this folder
`source-docs/` (copied from `/Desktop/Kinko_Design/`, 2026-06-17):
- Top level: `CLAUDE.md`, `README.md`, `design-system.md`, `design-reference.md`, `Discrepancies.md`, `figma-enforcer.md`
- `references/`: `changelog.md` (~100KB history), `figma-api.md`, `figma-component-playbook.md`, `logo-explorations.md`
- `policy-analyser/`: `Policy_Analyser_Product_Spec_v2_0.md`, `CHANGELOG.md`, `QUICKSTART.md`, `README.md`, `docs/DEVELOPER_GUIDE.md`
- (Skipped: 60 granular component specs + 6 token-enforcer skills — already summarized in `../../kinko-design-system-report.md`. Can fetch on request.)
