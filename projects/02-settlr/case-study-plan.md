# Settlr — Case Study Plan
> Narrative structure for the portfolio case study overlay.
> Agreed approach: capability-first. Show the system and workflow up top — viewers won't scroll the whole thing, so lead with what proves your skill level.

---

## Agreed Narrative Order

### 1. Hook — Final App Screens (above the fold)
- 3–5 key screens from the built app
- Feel of the brand: warm, earthy, clean
- No explanation yet — just "oh, this looks good"
- Candidates: `home-dashboard.html`, `group-detail.html`, `add-split.html`, `settle-success.html`

### 2. System Stats — Design System at a Glance
- Numbers that prove scale:
  - 27 components
  - 34 screens
  - 72 color primitives (7 palettes × 10 steps)
  - 3-tier token architecture
  - 100+ semantic tokens
- Visual: token architecture diagram (Primitive → Semantic → Component)
- A quick glimpse at the component library (grid of component previews)

### 3. The Workflow — Figma MCP + Claude
- This is the most differentiating section — builds credibility
- Hook line: "Claude wasn't generating screens. It was executing a fully defined system."
- Key points to hit:
  1. Figma MCP live connection (not screenshots, not exports — structured data)
  2. Custom skills for each stage (no guessing, no prompt engineering each time)
  3. Figma-first: build in Figma before any code
  4. Designer in control: live review → approve → token cleanup → code
  5. 3-tier token system: one source of truth, changes flow through automatically
  6. Code mirrors design exactly: primitive → semantic → component CSS files
- Tone: confident, specific, not "I used AI" but "here's how I built a system that made AI useful"

### 4. Research (Brief) — Where it Started
- Origin story: college project, 10-day study of Splitwise
- Methods used: HTA · SHERPA · Cognitive Walkthrough · NASA-TLX · SUS
- Keep this tight — 2–3 sentences per method, not a deep dive
- End with: "The findings were too good to leave in a report."

### 5. Findings → Decisions Bridge
**BUILT** — 3-column layout: left text | middle Splitwise mockup | right Settlr live iframe.

4 findings, each with:
- Finding number + title
- Verbatim user quote (where available) in orange-bordered callout
- Research evidence (SHERPA codes, NASA-TLX, cognitive walkthrough observation)
- "SETTLR FIXED IT" label + decision rationale

| # | Finding | Splitwise mockup | Settlr screen |
|---|---------|-----------------|---------------|
| 01 | Settle up — highest error rate (SHERPA T5.1: A1,A4,A10,I2,A6) | Friend detail page, Settle Up buried at bottom | `settle-select.html` |
| 02 | Friends/Groups as separate tabs — wrong section errors | Friends list + two-tab bottom nav | `people.html` |
| 03 | No home screen — flat friends list as opening state | Friends list "home", balance as tiny text | `home-dashboard.html` |
| 04 | Add expense overloaded — split method as two tiny words at bottom | Add Expense form, "Paid by you and split equally" annotated | `add-split.html` |

Verbatim quotes used:
- 01: *"messed up the form, added an expense to settle"* — user testing, Task 5 fail
- 03: *"At first glance they were confused since there was no homepage."* — observer note
- 04: *"There was no clear callout for different split methods. Users struggled to find options to split."* — observer note, Task 3

⚠️ **Frame as designed-to-solve, not proven-to-solve** — user testing pending. The research is rigorous; the design rationale is traceable. The hypothesis is clear. Don't overstate validation.

### 6. Full Gallery — All 34 Screens
- Scrollable grid of all built screens
- Groups: Auth → Home → Groups → Expenses → People → Settlements
- No captions needed — the screens speak for themselves
- Link to Figma file or live preview if available

---

## Visual Hierarchy Notes
- Sections 1–3 should be above the fold or close to it (the "don't need to scroll far" content)
- Sections 4–5 are for viewers who want the "why" — should be digestible, not academic
- Section 6 is for people who want proof of execution — make it satisfying to scroll through

---

## Copy Stubs (to be written)

### Section 1 hook copy
> TBD — probably just the project title + 1 line tagline. Let screens do the talking.

### Section 2 stats copy
> "A complete design system. Built ground-up. 27 components, 34 screens, 100+ semantic tokens — all connected, nothing hardcoded."

### Section 3 workflow lead
> "The real project wasn't the app. It was building a system where Claude could work the way a designer thinks."

### Section 4 research lead
> "It started as a 10-day college project. HTA, SHERPA, Cognitive Walkthrough, NASA-TLX, SUS — the whole toolkit applied to Splitwise."

### Section 5 bridge lead
> "Three methods. One clear picture. Here's what the research found — and what Settlr changed because of it."

---

## Assets Still Needed
- [x] Hero / cover image — DONE (Figma export, wooden hands iPhone mockup)
- [x] Before/After: Splitwise mockups → Settlr — **DONE** as HTML mockups in 3-col layout
  - Splitwise mockups are inline HTML (Splitwise green #1db373), not screenshots
  - Real Splitwise screenshots would replace these if/when available
  - Covers: Settle Up buried flow, Friends/Groups split, flat friends list home, Add Expense form
- [ ] NASA-TLX and SUS scores (exact numbers from `part 3.png` — higher res needed)
  - Known: Task 3 (Add Expense) = most cognitively demanding task
- [ ] Figma component library screenshot (for design system section)
- [ ] Token architecture diagram (can be built as HTML/CSS — already partially done)

---

## Key Copy Lines (Locked In)
> These came from the design rationale interview. Use verbatim or close to it.

- **Why olive:** "Most fintech apps go blue or purple. Settlr is about splitting with friends, not banking. Olive is warm and personal — trustworthy without being institutional."
- **Why coral:** "Owing money between friends is normal. It shouldn't feel like an error. Coral is uncomfortable enough without being alarming."
- **The real question:** "The app wasn't the point. It was the test environment for a bigger question: can a designer build a production-quality system solo, with AI as the executor — not the author?"
- **The click moment:** "The first component that came out of Claude with zero hardcoded values. Every color, spacing, border radius — back through the token system. That's when it became real."
- **Time:** "Weeks instead of months."
- **User testing:** ⚠️ Not done yet — Settlr is still in progress. User testing planned once build is complete. Do not include user validation claims in the case study until testing is done.

---

## What NOT to do
- Don't open with the research methods — too academic, viewers disengage
- Don't bury the design system stats — they're proof of scale
- Don't overexplain the AI workflow — be specific and confident, not defensive
- Don't include every SHERPA code and HTA table in the case study — that's in `research-splitwise.md`
- Don't say "I used AI" — say "I built a system where AI could execute without guessing"
