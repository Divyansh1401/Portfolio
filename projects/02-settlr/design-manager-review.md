# Settlr Project Review — Design Manager's Hiring Lens

*Reviewing as if I'm a design hiring manager scanning your portfolio with 8 minutes of attention. Here's what I'd flag, what would make me pause, and what would land you in the "yes" pile or kill the conversation.*

---

## Top-line verdict

**Strong potential, fragile execution risk.** The project is genuinely impressive in scope (research → system → 34 screens solo) and the AI-workflow angle is differentiated. But the documentation has 4–5 credibility leaks that a sharp reviewer will catch immediately, and if even one of them lands wrong, the whole thing reads as "ambitious student project that overclaims."

If you fix the issues below, this is a hire-worthy case study. As written, it's a coin flip depending on who reads it.

---

## 🔴 Critical content problems (fix before publishing)

### 1. The "user testing not done" problem is structurally unresolved
You're aware of this — flagged in `case-study-plan.md` as a warning. But the project arc still implies cause-and-effect: *"research found problems → Settlr fixes them."* Without validation, every "Settlr Decision" column in your bridge table is a **hypothesis**, not an outcome.

A senior reviewer's read: *"He did rigorous research, then built 34 screens based on his own interpretation of that research, and called it done."* That's a designer who confuses output with outcome — the #1 flag I look for.

**What to do:** Stop calling them "decisions" — call them "design hypotheses traceable to research." Add a clear "Validation: planned, not done" section above the fold. Or run lightweight testing on the top 2 flows (Add Expense + Settle Up) before publishing. Even n=3 with a thinkaloud is enough to convert hypothesis → finding.

### 2. The Splitwise research is a 10-day academic project being stretched into a foundation for a redesign
The research is genuinely well-structured (HTA + SHERPA + NASA-TLX + SUS is more rigor than most portfolios show). But:
- **Sample size is missing.** How many participants? If it's 5, say 5. If it's 3, that's a yellow flag.
- **NASA-TLX and SUS scores aren't in the doc.** You reference them but the actual numbers are "see image." A reviewer who can't see the numbers assumes they're weak.
- **"Highest cognitive demand"** for Task 3 — what's the absolute score? Without numbers, this is unfalsifiable.

A senior designer will trust process *or* numbers. Right now you have neither cleanly stated.

### 3. The four "verbatim user observations" feel quoted but aren't attributed
> *"At first glance they were confused since there was no homepage."*

Who said this? A user? An observer? Yourself reading observer notes? The plan doc admits some of these are "observer notes." That distinction matters — observer notes are paraphrase, not verbatim. Calling them verbatim and putting them in quote marks is a small integrity issue that a thorough reader will spot and won't forgive.

### 4. The AI workflow narrative is the strongest differentiator and the riskiest
*"Claude wasn't generating screens. It was executing a fully defined system."* — great line. But the doc swings between two messages:

- **Message A (good):** "I built a system disciplined enough that AI could execute without guessing."
- **Message B (risky):** "Weeks instead of months."

Message B is the trap. A hiring manager hears "weeks instead of months" and asks: *"So if you can do this in weeks with AI, why do I need to hire you full-time?"* You're inadvertently arguing for your own automation.

**Reframe:** The product wasn't the screens — it was the workflow. Sell yourself as someone who can stand up a design system + AI workflow for a team of 5 engineers. That's a $200K skillset right now. "Solo 34 screens in weeks" reads as student bragging.

### 5. The "67 issues found in design review" line is a self-inflicted wound
This is in your own docs — 18 P0, 19 P1, 16 P2, 14+ P3 issues. **Forty hardcoded hex colors bypassing the token system you spent the entire case study evangelizing.** If a reviewer reads this verbatim, the whole "no hardcoded values, ever" claim collapses.

Either:
- Fix the issues before publishing the case study (and move that section to "Lessons learned: shipping a system is harder than designing one")
- Don't surface the audit in the case study; keep it as internal QA

Don't have it both ways. The doc currently has it both ways.

---

## 🟡 Design-of-the-case-study problems

### 6. "Capability-first" narrative ordering will work *only* if your screens carry it
Your plan opens with "3–5 key screens." If those screens look generic (most fintech UIs do at a glance), the hook fails and you've spent your above-the-fold real estate on something forgettable. The hook needs a strong visual identity move — olive + Unbounded amounts is a real choice; show it in *one* hero composition that telegraphs the brand instantly. Don't use a 4-screen grid as the hook unless one of those screens is unmistakably yours.

### 7. The story is two stories pretending to be one
- Story 1: "I researched Splitwise and redesigned it."
- Story 2: "I built a design system using AI to test a new workflow."

These point in different directions. Story 1 is a UX redesign case study. Story 2 is a tooling/process case study. Right now the doc tries to be both, with the seams visible: "the app wasn't the point — it was the test environment."

If the app wasn't the point, **don't make it the cover image and the navigation entry.** Either commit to "redesign of Splitwise, with a system as deliverable" or "design system + AI workflow, with Splitwise as the demo domain." The hybrid weakens both.

### 8. Findings → Decisions table is dense and academic
The bridge table in `project-docs.md` is the best content in the doc — but it's prose-heavy. The case study plan does a better job (3-column: text | Splitwise mockup | Settlr screen). Make sure the website version uses the visual layout, not the prose table. Reviewers don't read 200-word table cells.

### 9. Some design rationale claims are unsupported
- *"3 is the right default for recent groups"* — based on what? An observation? Heuristic? Industry pattern? Currently asserted as fact.
- *"1:1 expenses take the same effort to log in Settlr as to settle via UPI"* — interesting hypothesis, but presented as a foregone conclusion that justifies omitting an entire feature category (individual expenses). A reviewer will probe this.
- *"Most users don't have more than 4 active groups"* — citation needed.

These are reasonable design intuitions, but stated as facts they invite "how do you know?" questions in interviews. State them as design bets with rationale, not facts.

### 10. The "⚠️ still in design — ask Divyansh" comment is in the docs
Line 48 of `project-docs.md`. This is a doc-as-source-of-truth issue. If anyone other than you reads this (including future you), it's an unfinished thought that undermines confidence. Resolve it or remove it before this doc is shared.

---

## 🟢 What's genuinely strong (don't lose this)

1. **Methodology rigor** — HTA + SHERPA + NASA-TLX + Cognitive Walkthrough is real research stack, not vibes.
2. **Token architecture** — 3-tier with explicit primitive/semantic/component split is actually correct, and most portfolios fumble this.
3. **The olive/coral color rationale** — these two paragraphs alone show senior-level thinking. Why olive (not blue/purple) and why coral (not red) is exactly the kind of opinionated, defensible choice a design manager wants to see. Lead with these, not bury them.
4. **The "click moment"** — concrete, specific, memorable. First component with zero hardcoded values is a great anecdote.
5. **Scope and self-discipline** — 27 components × 34 screens × 100+ semantic tokens, solo. That's a real body of work.
6. **Behavioral framing** — "uneven splits are the common case, not the edge case" — this is the level of thinking that distinguishes a senior IC from a junior. More of this, please.

---

## 🎯 What I'd want to see in an interview based on this case study

If I were interviewing you and read this doc, I'd ask:

1. **"Show me one Splitwise screen and the corresponding Settlr screen and walk me through every micro-decision."** — test if you can defend specifics, not just narrate the arc.
2. **"You haven't tested it — what's your top hypothesis that would falsify your home dashboard design?"** — test if you can think against your own work.
3. **"Walk me through one of the 18 P0 issues from your design review."** — test self-awareness vs. self-promotion.
4. **"What would Settlr v2 do differently, knowing what you know now from building it?"** — test reflection.
5. **"If I gave you a junior designer for 6 months, what part of this workflow could they replicate, and what part is bespoke to you?"** — test whether you understand which skills are leveraged vs. defensible.

If any of these would fluster you, prepare them before publishing.

---

## Priority order for fixes (if you only fix three things)

1. **Resolve the testing claim** — either run lightweight validation or reframe everything as hypothesis with traceability. This is the single biggest credibility risk.
2. **Pick one story** — UX redesign or AI/system-building case study. Subordinate one to the other. Don't sell both.
3. **Get the NASA-TLX/SUS numbers in the doc** — without them, the research half loses 50% of its weight.

Everything else is polish. These three are the difference between "yes, let's interview" and "interesting but not quite ready."

---

**Hire signal as currently written: 6.5/10.** Strong portfolio noise around it could push to 7.5. With the three fixes above: 8.5/10 — the kind of project that gets you on the shortlist for senior IC roles at product-led companies.
