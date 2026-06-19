# Policy Analyser — Product Spec v2.0

**Product:** Kinko / A23 Coverly
**Document type:** PRD
**Status:** Draft for Review
**Date:** May 2026

**Changes from v1.0:** Reframed as a top-of-funnel marketing acquisition tool, not a post-issuance education feature. Lead capture model added (gated preview). Score math fixed (weights now consistent and add to 100%). Document storage carve-out made explicit. CTAs designed around three options the user picks. Neutral analysis / branded action separation introduced.

---

## 1. What This Is

A public landing-page tool for **people who are not Kinko users yet**. They upload their existing health insurance policy PDF, get a free score and the top 2 gaps in their coverage, then submit phone/email to unlock the full report and three Kinko-branded next steps.

The goal is **qualified lead acquisition**, not user education. Education is the bait; lead capture is the hook.

### What this is not
- Not for existing Kinko users (they have the Calculator, the Marketplace chatbot, and their own My Policies page)
- Not a substitute for the Health Coverage Calculator — the analyser checks adequacy of an existing policy; the Calculator recommends what to buy from scratch
- Not a post-issuance education feature inside the app — that would dilute its sharper marketing purpose
- Not a generic "compare policies" tool — single policy input, single output

### Why it sits outside the locked "no documents" principle

CLAUDE.md and the Claims Module v1.1 lock the rule that *Kinko does not collect or store user documents*. This tool is a deliberate carve-out from that principle, because:

- The Claims module rule exists to keep Kinko out of the claims-execution loop (where storage = liability)
- The analyser sits in the marketing funnel, not the claims process
- The PDF is only needed to identify the policy SKU and pull a few values — it is not retained as a "policy vault" the user comes back to

The carve-out is bounded: PDFs are stored for the minimum time needed to run the analysis and follow up on the lead, then deleted. See Section 9 for the storage policy.

---

## 2. The Funnel — End to End

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1   LANDING PAGE                                         │
│            Hero + value prop + upload CTA                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2   UPLOAD                                               │
│            Drag-drop or file picker (mobile-friendly)           │
│            Parser reads identifiers + a few values              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 3   CONFIRM                                              │
│            User confirms 5–6 details                            │
│            System fills the rest from policy catalog DB         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 4   FREE PREVIEW                                         │
│            Score + top 2 gaps                                   │
│            "See full report →" CTA                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 5   LEAD CAPTURE                                         │
│            Phone (required) + name + email (optional)           │
│            Trust line: no spam, we only call about your policy  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 6   FULL REPORT                                          │
│            Full feature breakdown                                │
│            What's good / Not good / Missing                     │
│            Generic recommendations (neutral language)           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 7   THREE CTAs                                           │
│            [ Talk to an advisor ]                                │
│            [ See Kinko plans that fix these gaps ]               │
│            [ Download the report ]                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                       LEAD IN CRM
```

The user can drop off at any stage. The lead is captured at Stage 5; everything after is conversion optimisation but the lead is already won.

---

## 3. Stage 1 — Landing Page

The landing page is the entire top-of-funnel surface. It has to convert cold traffic from search ads, paid social, and shared links into uploads.

### Layout (mobile-first)

```
┌──────────────────────────────────────┐
│  Kinko logo                          │
│                                      │
│  Is your health insurance            │
│  actually enough?                    │
│                                      │
│  Upload your policy. Get a free      │
│  score in 30 seconds. Find out       │
│  what's covered, what's not, and     │
│  where you have gaps.                │
│                                      │
│  ┌────────────────────────────────┐  │
│  │   📄  Upload Policy PDF        │  │
│  │   Tap to choose your policy    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ── Trust line ──────────────────    │
│  Free • No login • Your PDF is       │
│  deleted after the analysis          │
│                                      │
│  ── How it works ────────────────    │
│  1. Upload your policy               │
│  2. Confirm a few details            │
│  3. Get your free score              │
│                                      │
│  ── Sample report ───────────────    │
│  [Thumbnail preview of a report]     │
│                                      │
│  Already a Kinko user?               │
│  [Open in app →]                     │
└──────────────────────────────────────┘
```

### Things that need to be on this page
- **One job**: upload your policy. No nav, no other CTAs above the fold.
- **Trust signals**: free, no login, PDF deleted post-analysis. Without these, upload rates fall off a cliff for cold traffic.
- **A sample report thumbnail** below the fold. People want to see what they're getting before they upload.
- **Existing-user escape hatch**: a small link redirecting to the app for users who landed here by accident.

### What this page does *not* do
- Does not explain the scoring methodology in detail (that lives on a /how-it-works page linked from the footer for the curious)
- Does not pitch Kinko products at all (the page is about *the user's policy*, not Kinko)
- Does not gate the upload behind email/phone

---

## 4. Stage 2 — Upload

### Input

| Constraint | Value | Fallback when violated |
|---|---|---|
| File type | PDF only | "We only support PDF right now. JPG/PNG support is coming — try converting." |
| Max size | 10 MB | "This file is too large. Compress it at smallpdf.com or try a different copy." |
| Page count | No hard limit | None — parser handles any length |
| Language | English (Hindi support in v1.2) | "We only support English policies right now." |

### What the parser does

The parser is **deliberately scoped down**. It is not asked to read 30 pages of legal text. It pulls only what's needed to identify the policy and pre-fill a couple of fields:

| Field | Source in PDF | Required? |
|---|---|---|
| Insurer name | First page / cover sheet | Required for SKU match |
| Plan / product name | First page / schedule | Required for SKU match |
| Policy number | Schedule | Optional |
| Sum Insured | Schedule / declarations page | Required (for sanity check) |
| Policyholder name | Schedule | Optional |
| Number of members covered | Schedule | Optional |

Everything else — waiting periods, room rent cap, co-pay, day-care list, OPD, maternity, etc. — comes from the **policy catalog DB**, not the PDF. So parser accuracy on rare clauses doesn't matter; only the identifier match does.

### SKU matching against the catalog

```
PDF parsed → (Insurer + Plan Name + Sum Insured)
                            │
                            ▼
                    Catalog DB lookup
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    Match found (90% case)       No match (10% case)
    Pull 20 features from DB     Fall back to manual flow
                            (see Section 5.3 below)
```

### Engineering dependency

The catalog DB must hold structured policy features for the **top ~20 retail health insurers** in India, covering ~80% of policies in market. This is a hard prerequisite. The product team owns this dependency; if catalog coverage is below 70%, the tool is not launch-ready.

---

## 5. Stage 3 — Confirm

A short screen where the user confirms what was extracted, adds the small set of context the scoring engine needs (city, family composition), and triggers the analysis.

### Layout

```
┌──────────────────────────────────────┐
│  ← Back                              │
│                                      │
│  We've found your policy.            │
│  Just a few quick details.           │
│                                      │
│  Your policy                         │
│  Star Health — Family Health         │
│  Optima                              │
│  Sum Insured: ₹10,00,000             │
│  [Not my policy?]                    │
│                                      │
│  ── Your situation ──────────────    │
│                                      │
│  Who's covered?                      │
│  ( ) Just me                         │
│  (•) Me + family                     │
│                                      │
│  How many members?                   │
│  [ 3  ]                              │
│                                      │
│  Where do you live?                  │
│  [ Bangalore        ▼ ]              │
│                                      │
│  Your age                            │
│  [ 34  ]                             │
│                                      │
│              [Analyse My Policy →]   │
└──────────────────────────────────────┘
```

### Design notes

- **The policy block is read-only**. If the SKU match is wrong, the user clicks "Not my policy?" and goes to the manual fallback flow. Don't let them edit the SKU directly — it breaks DB lookup.
- **Only ask what the score actually needs**. City and family size affect the Sum Insured benchmark. Age affects PED relevance. Nothing else asked at this stage.
- **No phone/email here**. That's Stage 5. Asking now kills conversion.

### Section 5.3 — Manual Fallback (no SKU match)

When the parser can't match the policy to the catalog, the analyser doesn't fail — it offers a manual flow:

> "We couldn't find your specific policy in our database. You can still get an analysis — just answer a few questions about your coverage."

The manual flow asks the user 6–8 key questions (sum insured, PED waiting period, room rent cap, co-pay, OPD coverage Y/N, maternity Y/N, restoration Y/N, day-care procedures Y/N). The analysis runs on these self-reported values, and the report is clearly labelled "Based on what you told us — verify with your policy document."

This protects the user experience for the long-tail of policies and is a small lead-gen path in its own right.

---

## 6. Stage 4 — Free Preview (The Hook)

This is the most important screen in the funnel. It has to give enough value to feel real, while leaving enough behind that the user pays the phone-number price for the rest.

### Layout

```
┌──────────────────────────────────────┐
│  Your policy score                   │
│                                      │
│        ┌──────────────────┐          │
│        │                  │          │
│        │      62          │          │
│        │     /100         │          │
│        │                  │          │
│        │     AVERAGE      │          │
│        └──────────────────┘          │
│                                      │
│  Your policy has strong core         │
│  coverage but two significant        │
│  gaps that could cost you when       │
│  you claim.                          │
│                                      │
│  ── Top 2 gaps in your policy ──     │
│                                      │
│  ⚠ Long waiting period for           │
│     pre-existing conditions          │
│     Your policy waits 4 years        │
│     before covering pre-existing     │
│     conditions like diabetes or      │
│     high BP. Most modern policies    │
│     wait 2–3 years.                  │
│                                      │
│  ⚠ Your sum insured may be too low   │
│     ₹10L for a family of 3 in        │
│     Bangalore is below what we'd     │
│     recommend. A single major        │
│     hospitalisation could exhaust    │
│     your cover.                      │
│                                      │
│  ── 5 more findings in your full ──  │
│      report including 3 things       │
│      your policy does well           │
│                                      │
│   ┌────────────────────────────────┐ │
│   │   See full report →            │ │
│   └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Design notes

- **The score is the headline**. Big, central, with a one-word category beneath it (Excellent / Good / Average / Poor).
- **One-line summary under the score**. This needs to feel personal — generated based on which categories scored well or poorly, not a generic template.
- **Show 2 gaps free, hide the rest behind a teaser**. The teaser tells them what's still hidden ("3 things your policy does well" + "5 more findings") so the upgrade feels worth it.
- **Lead with weaknesses, not strengths**. Hiding the strengths behind the gate makes the user feel something is wrong with their policy and they need to find out more.
- **No Kinko products mentioned here**. The page is still about *the user's policy*. The pitch is Stage 7.

### Picking which 2 gaps to show

Highest-priority recommendations (see Section 8) — typically the ones with the biggest financial impact at claim time. PED waiting period and Sum Insured adequacy will usually be the top 2.

---

## 7. Stage 5 — Lead Capture

A short, well-defined moment. The user has been hooked; the form needs to feel like a small unlock, not a paywall.

### Layout

```
┌──────────────────────────────────────┐
│  See your full policy analysis       │
│                                      │
│  We'll send your full report and a   │
│  one-time call from a licensed       │
│  advisor if you want help fixing     │
│  the gaps.                           │
│                                      │
│  Your name                           │
│  [ Rajesh                       ]    │
│                                      │
│  Phone number  (required)            │
│  +91 [ XXXXXXXXXX                ]   │
│                                      │
│  Email  (optional)                   │
│  [ rajesh@example.com           ]    │
│                                      │
│         [ Unlock Full Report →  ]    │
│                                      │
│  ── No spam, no third parties.       │
│     One call only if you want it.    │
└──────────────────────────────────────┘
```

### What we ask
- **Phone**: required. This is the asset.
- **Name**: required, makes the call meaningful and the report personal
- **Email**: optional, secondary channel for the PDF and drip

### What we promise
The trust line is doing real work here. Two specific promises:
- No spam, no third parties — concrete and verifiable
- One call only if you want it — sets the expectation that they're in control

### Validation
- Phone: Indian 10-digit number, basic format check
- OTP verification: **not required at this stage**. Friction kills the funnel. We accept the number as-is, then validate it via the actual outreach call. Fake numbers get filtered downstream.

### Engineering dependency
- Lead must land in CRM (the marketing/sales tool, whatever that is) within 30 seconds of submission, tagged with: policy SKU, score, top 3 gaps, city, age, family size
- Without this, the sales team is calling blind

---

## 8. Stage 6 — The Full Report

Unlocked after lead capture. This is the user's reward and the lead's qualification record.

### Layout (scroll page)

```
┌──────────────────────────────────────┐
│  Star Health — Family Health Optima  │
│  Analysis for Rajesh                  │
│  Generated: 11 May 2026               │
│                                       │
│  ── YOUR SCORE ─────────────────      │
│  62 / 100   Average                   │
│  [bar chart visual]                   │
│                                       │
│  ── AT A GLANCE ────────────────      │
│  ✓ 3 strengths                        │
│  ⚠ 2 weaknesses                       │
│  ✗ 3 missing benefits                 │
│                                       │
│  ── WHAT'S GOOD ─────────────────     │
│  [3 strengths with explanation]       │
│                                       │
│  ── WHAT'S NOT GOOD ─────────────     │
│  [2 weaknesses with explanation]      │
│                                       │
│  ── WHAT'S MISSING ──────────────     │
│  [3 gaps with explanation + cost      │
│   context]                            │
│                                       │
│  ── FULL FEATURE BREAKDOWN ──────     │
│  [Table of 18 features with status]   │
│                                       │
│  ── RECOMMENDATIONS ─────────────     │
│  3 things you could consider, in      │
│  order of impact                      │
│                                       │
│  ── WHAT NEXT? ──────────────────     │
│  [ Talk to an advisor ]               │
│  [ See Kinko plans that fix these ]   │
│  [ Download the report ]              │
│                                       │
│  ── DISCLAIMER ─────────────────      │
│  [Legal disclaimer]                   │
└──────────────────────────────────────┘
```

### Section 8.1 — What's Good / Not Good / Missing

Plain language, with a one-line explanation of why it matters. Sample:

**What's Good**
> ✓ **No room rent cap**
> Your policy doesn't restrict your room category. In a Bangalore hospital this matters — single rooms cost ₹8,000–15,000/day and you won't have a portion of your bill disallowed just for the room choice.

**What's Not Good**
> ⚠ **4-year waiting period for pre-existing conditions**
> Industry standard is 2–3 years. If you have diabetes, high BP, asthma, or any condition you had before buying this policy, treatment for it isn't covered until year 5 of your policy.

**What's Missing**
> ✗ **No OPD cover**
> Your policy doesn't cover doctor consultations, lab tests, or diagnostics outside hospital admission. These add up: a typical family of three spends ₹15,000–30,000 a year on outpatient costs.

### Section 8.2 — Full Feature Breakdown

A scannable table of all 18 features the system checks, with each marked ✓ (meets benchmark), ⚠ (below benchmark but okay), or ✗ (missing or poor). Tap any row to see detail.

| Feature | Your policy | Benchmark | Status |
|---|---|---|---|
| Sum Insured | ₹10L | ₹25L+ (metro family of 3) | ⚠ |
| Room Rent Cap | None | None | ✓ |
| Co-Payment | 10% | 0% | ⚠ |
| Restoration | 100% | 100% | ✓ |
| No Claim Bonus | 50% max | 50%+ | ✓ |
| PED Waiting | 4 years | 2–3 years | ✗ |
| Specific Illness Waiting | 2 years | 1–2 years | ✓ |
| Day Care Procedures | 540+ | 500+ | ✓ |
| Modern Treatments | Covered | Covered | ✓ |
| AYUSH | Covered | Covered | ✓ |
| Organ Donation | ₹1L | ₹1L+ | ✓ |
| Domiciliary Hospitalization | Covered | Covered | ✓ |
| Pre/Post Hospitalization | 30/60 days | 30/60 days | ✓ |
| OPD Cover | Not covered | ₹25K+ | ✗ |
| Mental Health | Covered | Covered | ✓ |
| Maternity | Not covered | Covered | ✗ |
| Newborn | Not covered | Covered | ✗ |
| Daily Cash | ₹1,000/day | ₹1,000+ | ✓ |

### Section 8.3 — Recommendations

Now we can recommend (license covers this). But framing matters — we keep these as **observations the user can act on**, not specific product pitches. The product pitches happen in the CTAs below.

> 🔴 **HIGH PRIORITY — Reduce your PED waiting period**
> Your 4-year waiting period is the single biggest weakness in this policy. If you're going to switch policies anyway, the porting rule lets you carry forward the waiting period you've already served, so a port to a 2-year PED plan immediately credits 2 years of your existing wait.
>
> *Things to consider:* Port to a plan with shorter PED. Look for plans that specifically waive PED for lifestyle conditions.

> 🟡 **MEDIUM PRIORITY — Top up your sum insured**
> For a Bangalore family of 3, ₹10L can be exhausted by a single major surgery. The cheapest fix is a super top-up (a policy that kicks in above a deductible threshold), which gives you ₹50L–1Cr of extra cover for ₹5,000–8,000 a year.
>
> *Things to consider:* Buy a super top-up with a ₹10L deductible. Or upgrade your base plan to ₹25L+ sum insured.

> 🟢 **LOW PRIORITY — Add an OPD rider for recurring expenses**
> OPD is rare in Indian retail health insurance and expensive to add — most families self-fund it. But if you have school-age children or regular specialist visits, it can pay back.

### Recommendations design rule
- **The analysis section is neutral**. No Kinko mentions.
- **The CTAs (next section) are explicitly Kinko-branded**.
- This separation is deliberate. It preserves the credibility of the analysis, which is the whole reason the user gave up their phone number.

---

## 9. Stage 7 — The Three CTAs

Three buttons, stacked, after the recommendations. The user picks one (or none). All three are conversion paths to Kinko.

### CTA 1 — Talk to an advisor
> **What it does:** Books a call. User sees a calendar widget with slots in the next 48 hours. On booking, an SMS + email confirmation is sent. The Kinko advisor calls at the scheduled time with the analysis already in hand.
>
> **Best for:** Users who are confused, have a complex situation, or want a human to walk them through options.

### CTA 2 — See Kinko plans that fix these gaps
> **What it does:** Routes to a filtered marketplace view, with filters pre-set based on the gaps found:
> - If PED waiting is the gap → filter for plans with PED ≤ 3 years
> - If Sum Insured is the gap → filter for plans matching the benchmark for their city/family
> - If a missing benefit (OPD, maternity) is the gap → filter for plans covering it
>
> **Best for:** Users who already know they want to switch and want to browse options themselves.

### CTA 3 — Download the report
> **What it does:** Generates a branded PDF with the full report, sends it to the user's email. Sets up a 7-day drip email sequence (Day 1: "Did you get a chance to read it?", Day 4: "Most people who upload have these gaps — here's why", Day 7: "Want a 15-min call?").
>
> **Best for:** Users not ready to act now but want to think about it. The drip keeps them warm.

### CTA presentation order
Stacked vertically, in this order:
1. Talk to an advisor (highest-intent conversion path)
2. See Kinko plans (medium intent)
3. Download the report (lowest commitment, broadest catch)

Equal visual weight — no buttons more prominent than others. The user picks based on their style, not because we nudged.

---

## 10. Scoring — Fixed Math

The original spec had three contradictory weighting schemes. This version locks one.

### Master weighting scheme

| Category | Weight |
|---|---|
| Core Financial Protection | 35% |
| Waiting Periods | 40% |
| Treatment Coverage | 15% |
| Value-Added Benefits | 10% |
| **Total** | **100%** |

### Individual feature weights (within each category)

| Category | Feature | Weight |
|---|---|---|
| **Core Financial (35%)** | Sum Insured | 20% |
| | Room Rent Cap | 5% |
| | Co-Payment | 5% |
| | Restoration | 3% |
| | No Claim Bonus | 2% |
| **Waiting Periods (40%)** | PED Waiting Period | 30% |
| | Specific Illness Waiting | 10% |
| **Treatment Coverage (15%)** | Day Care Procedures | 4% |
| | Modern Treatments | 3% |
| | AYUSH | 2% |
| | Organ Donation | 2% |
| | Domiciliary Hospitalization | 2% |
| | Pre/Post Hospitalization | 2% |
| **Value-Added (10%)** | OPD Cover | 3% |
| | Mental Health | 2% |
| | Maternity Cover | 2% |
| | Newborn Cover | 2% |
| | Daily Cash | 1% |
| | **Total** | **100%** |

### How a feature scores

| Points | Meaning | Example |
|---|---|---|
| 1.0 | Meets or exceeds benchmark | PED waiting = 2 years (benchmark 2–3) |
| 0.5 | Below benchmark but acceptable | PED waiting = 3 years (benchmark 2–3) |
| 0.0 | Missing or significantly below | PED waiting = 4 years, or OPD not covered |

### The formula

```
Score = Σ (feature_points × feature_weight%)
        where feature_points ∈ {0, 0.5, 1.0}

Max possible score = 1.0 × 100% = 100
```

### Worked example

A policy with the table-of-features values from Section 8.2:

| Feature | Points | Weight | Contribution |
|---|---|---|---|
| Sum Insured | 0.5 | 20% | 10 |
| Room Rent Cap | 1.0 | 5% | 5 |
| Co-Payment | 0.5 | 5% | 2.5 |
| Restoration | 1.0 | 3% | 3 |
| No Claim Bonus | 1.0 | 2% | 2 |
| PED Waiting | 0.0 | 30% | 0 |
| Specific Illness Waiting | 1.0 | 10% | 10 |
| Day Care | 1.0 | 4% | 4 |
| Modern Treatments | 1.0 | 3% | 3 |
| AYUSH | 1.0 | 2% | 2 |
| Organ Donation | 1.0 | 2% | 2 |
| Domiciliary | 1.0 | 2% | 2 |
| Pre/Post Hospitalization | 1.0 | 2% | 2 |
| OPD Cover | 0.0 | 3% | 0 |
| Mental Health | 1.0 | 2% | 2 |
| Maternity | 0.0 | 2% | 0 |
| Newborn | 0.0 | 2% | 0 |
| Daily Cash | 1.0 | 1% | 1 |
| **Total Score** | | **100%** | **50.5** |

This matches the visual example earlier (62 was illustrative; here the math gives 50.5 for these exact inputs). The example illustrates that the dominant driver is the 30% PED weight scoring 0 — drops the score by 30 points alone.

### Score categories

| Range | Label | Colour |
|---|---|---|
| 85–100 | Excellent | Green |
| 70–84 | Good | Green |
| 50–69 | Average | Yellow |
| Below 50 | Poor | Red |

### Open question — limitations and exclusions

The original spec had a Category 5 ("Limitations & Exclusions") which the new master scheme drops. There are two ways to bring it back:

- **Option A — Score modifier**: deduct up to 10 points from the 0–100 score for the presence of harsh exclusions (e.g. ailment sub-limits, broad permanent exclusions). Keeps the main 100% scheme clean.
- **Option B — Sixth weighted category**: add Limitations as a 5% weighted category, reduce the others proportionally.

A is cleaner and easier to explain to the user. I've assumed A for now. Confirm.

### Benchmark sources

Benchmarks per feature are not invented — they come from a documented reference list:

- IRDAI annual reports (for industry averages)
- Top 20 retail health insurance products sold in India (manually curated and reviewed quarterly)
- Healthcare cost data per city tier (sourced from public data + insurer claims data where available)

The benchmark list is owned by the product team and reviewed every 6 months. **This is a real ops dependency, not a one-time setup.** Benchmarks drift; if they're not refreshed, the analyser's credibility erodes.

---

## 11. What We Store, For How Long, And Why

This section makes the document storage carve-out explicit.

| Data | Stored where | Retention | Why |
|---|---|---|---|
| Uploaded PDF | Encrypted object storage (S3 or equivalent) | 7 days from upload | Needed during analysis and the immediate follow-up window. Auto-deleted after. |
| Extracted policy values | Database, tied to lead record | 90 days from lead capture | Sales/CRM team needs context to follow up. After 90 days, lead goes cold; data purged. |
| Score and report | Database | 90 days | Same as above. |
| Lead profile (name, phone, email) | CRM | Standard CRM retention (governed by Kinko's existing privacy policy) | Standard marketing lead lifecycle |
| Analytics events (anonymous) | Analytics platform | Indefinite | For product improvement, no PII |

### Privacy commitments shown to the user
- PDF is deleted 7 days after upload
- We will not sell or share your data with third parties
- You can ask us to delete your record at any time (link in any email we send)

### Why this is acceptable as a carve-out from the "no docs" rule
- Storage is bounded and short
- The PDF is not surfaced back to the user as a vault — they don't return to view it
- It is not used in the claims path (where the rule still applies)
- The user is explicitly told what we keep and for how long

### Engineering dependency
- Auto-delete cron job on day 7 must actually work, and have a verifiable audit trail. The privacy promise is only as good as the system behind it.

---

## 12. The 18 Features We Analyse

Same as v1.0 minus the "Limitations & Exclusions" category (now handled as score modifier — see Section 10's open question). Listed here as a reference for engineering. Detail in Sections 8 and 10.

**Core Financial Protection (35%)**
1. Sum Insured
2. Room Rent Cap
3. Co-Payment
4. Restoration Benefit
5. No Claim Bonus

**Waiting Periods (40%)**
6. PED Waiting Period
7. Specific Illness Waiting Period

**Treatment Coverage (15%)**
8. Day Care Procedures
9. Modern Treatments
10. AYUSH
11. Organ Donation
12. Domiciliary Hospitalization
13. Pre/Post Hospitalization

**Value-Added Benefits (10%)**
14. OPD Cover
15. Mental Health
16. Maternity Cover
17. Newborn Cover
18. Daily Cash

---

## 13. Engineering Dependencies

| Capability | Dependency | Critical for Day 1? |
|---|---|---|
| PDF parser scoped to identification (insurer + plan + sum insured) | ML or rule-based parser | Yes |
| Policy catalog DB covering top 15–20 insurers with 18 structured features per SKU | Product ops + content team | Yes — without this, the tool can't work |
| Manual fallback flow for unmatched SKUs | Frontend forms | Yes |
| Lead capture → CRM integration with full context (score, gaps, profile) | CRM/marketing tech stack | Yes |
| PDF report generation | PDF generation service | Yes (CTA 3) |
| Calendar booking widget for advisor calls | Calendar tool (Calendly etc.) | Yes (CTA 1) |
| Marketplace filtered view, pre-set from analyser gaps | Marketplace integration | Yes (CTA 2) |
| Drip email sequence | Marketing automation tool | Yes (CTA 3) |
| Auto-delete cron for PDFs at day 7 | Backend job | Yes |
| Benchmark refresh process (quarterly review) | Product ops process | Ongoing, not Day 1 blocker |

---

## 14. Success Metrics

The right metrics for a marketing acquisition tool — not engagement metrics.

### Funnel metrics

| Stage | Metric | Target (3 months post-launch) |
|---|---|---|
| Landing | Landing → Upload start | 25% |
| Upload | Upload → Confirm | 80% |
| Confirm | Confirm → Free preview shown | 95% |
| Preview | Preview → Lead capture submitted | 40% |
| Capture | **Lead capture rate (landing → lead)** | **8%** |
| Post-lead | Lead → at least one CTA clicked | 50% |
| CTA 1 | Advisor call booked → call completed | 60% |
| CTA 1 | Call completed → policy purchase | 15% |

### Lead quality

- % of leads with phone number that connects (not fake/wrong) — target: >85%
- Cost per qualified lead (paid traffic / leads with real phone) — target: under ₹500
- Cost per acquisition (paid traffic / policies sold) — target: under ₹4,000 (well below industry CAC of ₹2,000–3,000 per the business plan)

### What we don't measure (deliberately)
- MAU / engagement on the tool — irrelevant; this is a one-time use for any given user
- Net Promoter Score — irrelevant; user doesn't have an ongoing relationship with the tool
- "Time spent" — irrelevant; faster is better, not worse

---

## 15. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Catalog coverage is below 70% — many users hit fallback | High | High | Sequence the launch behind catalog build; cap launch geography until coverage holds |
| PDF parser fails to identify the policy even when it's in the catalog | Medium | Medium | Manual fallback flow catches this; track parser miss rate and improve |
| Lead capture rate is below 40% from the preview | Medium | High | A/B test the preview design, the gap selection, the trust line, the form length |
| Users feel the score is judging them and bounce | Medium | Medium | Soften the language; never show "Poor" without an immediate positive (you can fix this) |
| Advisor team isn't ready to take volume from CTA 1 | Medium | High | Scale advisor capacity in step with paid traffic; throttle if overwhelmed |
| The tool gets used by existing Kinko users by accident, dilutes the marketing funnel | Low | Low | Existing-user redirect link on the landing page; deduplicate against existing user DB at lead capture |
| Regulator views the recommendations as broker advice without licensed advisor sign-off | Low | High | Confirmed: Kinko has the broker license. Disclaimer still required on the report. |

---

## 16. Open Questions

| # | Question | Decision needed by | Owner |
|---|---|---|---|
| 1 | Limitations / exclusions — score modifier (Option A) or 6th category (Option B)? | Pre-build | Product |
| 2 | Phone OTP at lead capture — friction vs lead quality. Default: no OTP. | Pre-build | Product + Marketing |
| 3 | Catalog coverage threshold for launch (70%? 80%?) | Pre-launch | Product + Ops |
| 4 | Hindi / regional language support — when? | v2.x | Product |
| 5 | What happens if a user uploads the same policy twice (already a lead) — block, re-show, refresh? | Pre-launch | Product |
| 6 | Drip sequence — content, frequency, opt-out flow | Pre-launch | Marketing |

---

## 17. Out of Scope for v2.0

Listed explicitly so they don't sneak back in:

- Existing Kinko user flows (they have Calculator and Marketplace)
- Multi-policy household analysis (one policy at a time)
- Side-by-side comparison of two policies
- Real-time integration with insurer APIs for policy data
- Insurer API for live policy verification
- Mobile app version (this is web-first; an in-app version can come later if needed)
- Saving an analysis to revisit later (one-shot tool by design)

---

*Version 2.0 — May 2026*
*Supersedes v1.0*
*Companion documents: A23 Coverly Business Plan v2.0, Health Coverage Calculator (when published)*
