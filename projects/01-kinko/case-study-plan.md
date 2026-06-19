# Kinko — Case Study Plan
> Narrative structure for the portfolio case study overlay (`data-project="kinko"`, `#kinko`).
> Agreed angle: **both, layered** — lead with the product problem and the smart product solutions (the hook), then reveal the design system + workflow underneath as proof of execution depth.
> Company: Head Digital Works · A23 Coverly. Real industry work, all public (no NDA limits).
> Created: 2026-06-17.

---

## The One-Line Thesis
> Kinko proves two things at once: **product thinking** (turning a scary, opaque purchase into a trustworthy, conversion-smart flow) and **execution depth** (a 50-component, 4-breakpoint production design system kept 1:1 with Figma).

Don't let it become "Settlr part 2." Settlr owns the research → redesign + AI-workflow story. **Kinko's distinct claim is real industry delivery at scale:** a live B2C product, conversion-driven funnels, four breakpoints (390 → 1920), and a bigger system. See "What NOT to do" at the bottom.

---

## Agreed Narrative Order

### 1. Hook — The Product (above the fold)
- Project title + one line: *insurance, made to feel less like a gamble.*
- Company chip: **Head Digital Works · A23**
- 3–5 hero screens, no explanation yet — just "this looks trustworthy and polished":
  - Policy Analyser landing / score-preview
  - Life Simulator ("A life in 60 seconds")
  - A clean core product screen (policy detail / plan comparison)
- Feel of the brand: professional, calm, green `#009b1a` + navy `#0b2b40`, no playfulness.

### 2. The Problem — Why insurance UX is hard
Keep tight (3–4 beats). Insurance is:
- **Opaque** — a single policy hides 20+ features (waiting periods, room-rent caps, co-pay, PED, restoration…). Most people can't read their own policy.
- **High-stakes & low-trust** — "Will this actually cover me? Am I getting scammed? Will they call me forever?"
- **Sticky by inertia** — people keep policies they don't understand because switching feels risky.

Frame it as three real user questions Kinko had to answer:
1. *"Is my existing policy enough?"*
2. *"What should I buy?"*
3. *"Why should I even care?"*

### 3. The Solutions — Three flows, one trust strategy (the smart part)
This is the product-thinking showcase. Each flow = a user question answered.

**3a. Policy Analyser — the conversion engine** *(the strongest single artifact)*
- 7-stage funnel: landing → upload PDF → confirm parsed details → **free score + top-2 gaps** → lead capture (phone) → full report → 3 branded next steps.
- The key design insight to spotlight: **the gated-preview mechanic** — give enough value at the score screen to feel real, leave enough behind that a phone number feels worth paying. The lead is won at the preview, not the report.
- Second insight: **neutral analysis, branded action** — the gap report uses neutral language; only the final CTAs are Kinko-branded. Builds credibility before the pitch.
- Screens: `screens/PolicyAnalyser/stage-1` … `stage-7`.

**3b. Coverage Calculator — "what should I buy?"**
- Blank-slate recommendation: takes the user's situation → recommends a sum-insured. The mirror of the Analyser (which audits an *existing* policy).
- Screen: `screens/coverage-calculator/index.html`.

**3c. Life Simulator — "why should I even care?"**
- *"A life in 60 seconds."* Make choices for Aarav from 25 → 60; watch each decision hit his savings and peace of mind.
- The point: insurance value made **felt**, not explained. Narrative over calculator. Low friction ("skip anytime").
- Screen: `screens/life-simulator/index.html`.

### 4. Trust-first design decisions
Short, punchy rationale blocks — design choices that map directly to the trust problem:
- **Trust signals as UI**, not afterthought: *"Free · No login · Your PDF is deleted after the analysis."* (Cold-traffic upload rates fall off a cliff without these.)
- **Professional, not playful** — color/type choices: green for action, navy for authority, Plus Jakarta Sans, generous spacing. Calm conveys competence.
- **Touch-first interaction model** — pressed states for touch (no hover-only feedback), so nothing feels broken on mobile.
- **No dark mode** — single light theme; light reads as transparent/honest for a trust product.

### 5. Underneath — the design system (proof of depth)
The "and it scaled" reveal. This is where the craft credibility lands.
- Stats that prove scale:
  - **50 components** (3-tier compliant)
  - **142 color primitives + 87 semantic tokens**
  - **3-tier token architecture** (primitive → semantic → component) — zero hardcoded values
  - **4 breakpoints**: 390 (mobile) · 768 (iPad) · 1280 (desktop) · 1920 (FHD) — every component designed for all four
  - **19 named text styles**, Plus Jakarta Sans
- Visuals:
  - Token architecture diagram (Primitive → Semantic → Component)
  - Component library grid (a glimpse of the 50)
- Workflow sub-beat (keep SHORT — Settlr owns the deep AI story): the system is kept **1:1 between Figma and code** via the Figma MCP workflow — Figma is source of truth, CSS mirrors it, nothing drifts. One or two sentences, not a section.

### 6. Scale & gallery — industry delivery
- Frame: this is **shipped industry work**, not a personal project. What you owned: the full design system + the product flows above, across four breakpoints, with documented production handoff (PDF parser, policy-catalog DB, CRM, calendar booking as engineering dependencies).
- Scrollable gallery: Policy Analyser 7 stages + Coverage Calculator + Life Simulator + key system screens.
- Optional: live prototype iframe (same pattern as the planned Settlr viewer) for Policy Analyser or Life Simulator.

---

## Visual Hierarchy Notes
- Sections 1–3 are the "don't need to scroll far" content — product polish + smart thinking. Lead with these.
- Section 4 is digestible rationale for viewers who want the "why."
- Section 5 is the proof-of-execution payload for people who care about craft/scale.
- Section 6 rewards the scroller and anchors the industry-credibility claim.

---

## Copy Stubs (to be written)

### Section 1 hook
> TBD. Project title + one line. Let the screens talk. Candidate: *"Kinko — buying insurance, minus the gamble."*

### Section 2 problem lead
> *"A health policy hides twenty-plus features behind one number. Most people can't read their own coverage — and they don't trust whoever's selling them more of it."*

### Section 3 solutions lead
> *"Three questions stand between a person and the right policy: Is mine enough? What should I buy? Why should I care? Kinko answers each with its own flow."*

### Section 3a Policy Analyser
> *"Upload your policy, get a free score and your two biggest gaps. The full report costs one thing: a phone number. The trick was giving away enough to feel real, and holding back enough to be worth it."*

### Section 5 system lead
> *"Underneath the product: a 50-component system, four breakpoints, and a strict three-tier token architecture. Nothing hardcoded, nothing drifting from Figma."*

---

## Assets Still Needed
- [ ] **Homepage thumbnail** — only `assets/images/kinko/thumbnail.webp` exists; confirm it's the final P1 card image.
- [ ] **Hero screens (3–5)** — export from `Kinko_Design/screens/` (Policy Analyser landing + score, Life Simulator, a core product screen).
- [ ] **Policy Analyser 7-stage strip** — screenshots of `stage-1` … `stage-7`.
- [ ] **Coverage Calculator + Life Simulator** screenshots.
- [ ] **Token architecture diagram** — build as HTML/CSS (reuse Settlr approach) or export from Figma.
- [ ] **Component library grid** — Figma frame screenshot of the 50 components.
- [ ] **(Optional)** live prototype iframe source(s) — mirror flows into `prototype/kinko/` if we want an interactive viewer like Settlr's planned one.

---

## Key Copy Lines (framing rules — read before writing copy)
- **Metrics are targets, not results.** The spec defines funnel targets (e.g. landing→upload, preview→lead). Frame any number as a **design target / hypothesis**, never a proven outcome, unless real analytics are confirmed. (Same discipline as the Settlr plan.)
- **The conversion mechanic is the headline product insight** — the free-score → gated-report model. Lead with it in 3a.
- **"Neutral analysis, branded action"** is a quotable design-ethics line — credibility before the pitch.
- **Trust signals are design, not legal fine print** — "PDF deleted after analysis" is a conversion lever, frame it that way.
- **Industry scale is the differentiator vs Settlr** — say "shipped at Head Digital Works across four breakpoints," not "I built a system."

---

## What NOT to do
- **Don't repeat the Settlr story.** Keep the AI/Figma-MCP workflow to 1–2 sentences here. Settlr is the deep-dive on that; Kinko's distinct claim is *industry scale + product/conversion thinking*.
- **Don't open with the design system.** The token counts are proof, not the hook. Product problem and the three flows come first.
- **Don't overstate outcomes.** No invented conversion/retention numbers. Targets are targets.
- **Don't dump the full component inventory or token tables** — that lives in `kinko-design-system-report.md`. The case study shows scale, not the spec.
- **Don't make it academic.** The Policy Analyser logic is interesting; show the *insight* (gated preview, neutral-then-branded), not the 7-stage spec table.

---

## Source material map (where the substance lives)
| Need | Source |
|------|--------|
| Full design-system spec (tokens, 50 components, breakpoints) | `/Users/divyanshrastogi/Desktop/website 2/kinko-design-system-report.md` |
| Design system summary | `/Users/divyanshrastogi/Desktop/Kinko_Design/design-system.md` |
| Policy Analyser funnel logic (7 stages, lead model, parser/catalog) | `Kinko_Design/screens/PolicyAnalyser/Policy_Analyser_Product_Spec_v2_0.md` |
| Product flows (HTML) | `Kinko_Design/screens/` — `PolicyAnalyser/`, `life-simulator/`, `coverage-calculator/`, `login-flow.html`, `onboarding-prototype.html` |
| Concepts / prototypes | `Kinko_Design/concepts/` — editorial, coverage-gap, support-card |
| Principles & rules | `Kinko_Design/CLAUDE.md`, `design-reference.md` |
| Decision history | `Kinko_Design/references/changelog.md` |

---

## Next steps after this plan is approved
1. Lock hero screen selection (export 3–5 from source).
2. Write `project-docs.md` — the unified arc with real copy (Settlr-style).
3. Build into the `caseStudies` object in `index.html` (`#kinko`).
4. (Optional) mirror flows into `prototype/kinko/` for an interactive viewer.
