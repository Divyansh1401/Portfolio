# Settlr — Full Project Documentation
> Unified record of the complete arc: Splitwise research → Settlr redesign.
> Source of truth for case study copy. Updated with design rationale, story arc, and research-to-decision mappings.

---

## Project Arc (One-Line Summary)
A college ergonomics study of Splitwise revealed real usability failures — so instead of stopping at a report, the findings were used to build Settlr: an independent redesign of the group expense splitting experience, complete with a full design system and 34 built screens.

---

## The Real Story Arc
> Use this when writing the narrative. This is the honest version — 3 acts.

### Act 1 — Frustration (the research)
It started with Splitwise's Add Expense flow. The split method selector was buried and unclear — users couldn't figure out how to split unequally without hunting through the interface. This wasn't a hypothesis. It was observed directly in user testing, and confirmed by NASA-TLX: Task 3 (Add Expense) scored as the most cognitively demanding task of the five studied. That's the moment the project stopped being academic.

### Act 2 — Experiment (the question behind the app)
The research was complete. The findings could have lived in a report. Instead, Settlr became the answer to a bigger question: *can you build a production-quality design system and 34 screens solo, using AI as the executor rather than the author?* The app wasn't the point — it was the test environment. Settlr was built to learn how a 3-tier token system actually works in practice, and to figure out what a disciplined Figma MCP + Claude workflow looks like when the designer stays in control.

### Act 3 — Execution (the build)
The workflow compressed what would have been months of solo design work into weeks. The "click moment" was the first component that came out of Claude with zero hardcoded values — every color, spacing, and radius tracing back through the token system. From there, the system scaled: 27 components, 34 screens, 100+ semantic tokens, all connected. Every design decision in the app traces back to a specific failure observed in the Splitwise research. The app itself is still in progress — user testing is planned once the build is complete.

---

## Research → Design Decisions (The Bridge)
> The most important section for the case study. Each finding maps directly to a Settlr decision.
> Updated with verbatim user observations from testing sessions.

### Raw User Observations (verbatim, from testing)
1. **No home screen** — "At first glance they were confused since there was no homepage." Splitwise opens to a Friends list — there is no overview, no balance summary, no sense of where you are.
2. **Add expense: split method invisible** — "There was no clear callout for different split methods. Users struggled to find options to split." In Splitwise, the split method is two small tappable words — "Paid by **you** and split **equally**" — buried at the bottom of the form. Not a choice, not a prompt. Easy to miss entirely.
3. **Split calculation friction** — "When users got to the split page, they struggled with calculating the expenses before putting the exact number or percentage." Users were expected to arrive with the math already done. No help, no calculator, no smart defaults.
4. **+ button confusion** — "When asked to create a group, most users clicked the bottom + button which was the Add Expense button and then got confused." The global + in Splitwise opens Add Expense, not Create Group. Users' mental model was: + = create something = create a group. The app violated that expectation silently.

### Screenshots captured (before assets — in hand)
- `splitwise-home.png` — Friends list as home. No dashboard. Balance shown as one line of text at top.
- `splitwise-add-expense.png` — Add Expense form. Split method = "Paid by you and split equally" as two tiny tappable chips at bottom of form.

### Finding → Decision Table

| Finding (observed) | Evidence | Settlr Decision |
|---------|----------|----------------|
| No home screen — users had no spatial anchor | First observation in all 5 tasks; users repeatedly lost orientation | Settlr opens to a **real dashboard** — named "Settlr" in large type as an explicit anchor. Profile icon top-right follows familiar convention. Layout: (1) **Total balance** at top — insight before action; this is expense *tracking*, users need to understand their position before they act. Planned: lent vs. owed breakdown. (2) **Two primary actions under balance** — Add Expense (most frequent) + Settle Up. (3) **Settle Up as batch action** — people settle at end of month or end of trip, not per-expense. Settle Up shows all outstanding balances at once — one place to close everything. (4) **Recent Groups (3)** — most users don't have more than 4 active groups; 3 is the right default. Create Group option alongside. (5) **No individual expense list** — deliberate omission. 1:1 expenses take the same effort to log in Settlr as to just settle via UPI. Groups are where the app adds real value. (6) Recent activity below. |
| Split method buried as two small words | Directly observed in Task 3; NASA-TLX: highest cognitive demand score | Split method is a **dedicated screen** in the add expense flow — not a hidden option. Uneven splits are the common case, not the edge case. Making it a dedicated step means users get **behaviourally anchored** — they learn to expect it there and stop hunting. The Splitwise failure mode: users moved past the form and only realised the split option was on the *previous* page. By then, they were confused and had to go back. |
| Users had no help calculating split amounts | Observed on split screen — users froze, had to use calculator app | Settlr calculates live — "Equally" mode shows **₹X per person** in real time as a summary pill above the list. User picks method, app does the math. The green pill also solves a second problem: even if the user chooses "Equally" and makes no change, the screen **doesn't feel like a wasted step** — it's showing them something useful. It's information, not just a form. |
| Every expense needs a "who paid" clarification | Even equal splits require knowing who paid before any debt can be calculated | The split screen handles both problems in one place: split *method* (how to divide) and split *by* (who paid). The screen serves all users, not just those splitting unevenly. |
| + button opened Add Expense, not Create Group | Observed when users tried to create a group — wrong action triggered | In Settlr, group creation lives inside the **People tab** — not triggered by the FAB. The + FAB on the home screen adds an expense (most frequent action). ⚠️ **Still in design** — ask Divyansh about the final FAB behaviour once the project is complete. |
| Friends and Groups are separate tabs | SHERPA errors Tasks 1 and 5: users accessed wrong section | Merged into a unified **People tab** — friends and groups in one list. Mental model: WhatsApp doesn't separate "people" from "groups" — conversations are conversations. Same logic here: the user is looking for someone to settle with or view, not for a category. Bottom nav: Home · People · Activity. |
| No review step — users submitted expenses they immediately wanted to change | Post-task observation: users frequently had to re-open expenses to correct amounts or descriptions | Settlr adds a **Review screen** at the end of the add expense flow — framed like a final bill. User sees the full transaction (amount, split breakdown, who paid) before it's saved. Also allows adding a comment. The metaphor shifts from "form submission" to "confirm your order" — lower anxiety, fewer mistakes. |
| Settlement flow had most SHERPA errors — and wrong entry point | Task 5 (Settle Up): T5.1 = A1, A4, A10, I2, A6 (wrong path, repeated action, omission); T5.2 = A7 (wrong section); T5.3 = A7, R1 (wrong action, confusion). Sticky note quotes: *"messed up the form, added an expense to settle"* / *"Added an expense to settle up — TASK FAIL"* / *"Wrong action direction, clicked overtime add expense ERR"*. Root cause: Splitwise settle-up was buried in the Friends tab — users had to navigate there, find a specific friend, then find the settle option. Many couldn't find it at all and tried to use the + button instead. | Settlr settle flow solves two distinct problems: (1) **Entry point** — Settle Up is a primary action on the home screen (batch view of everyone you owe/are owed by). Also accessible contextually from individual person page or group page — two mental models served. (2) **The flow itself** — Select person → Enter amount → Select payment method → Confirmed. Key details: users can enter a **partial amount** (partial settlement — realistic, not all users have the full sum ready) or tap a button to auto-fill the full amount. Payment method selection is currently UI-level (no live payment integration yet) — records the method and adjusts the balance. No Splitwise ambiguity about whether this is an "expense" or a "settlement". |

---

## Design Rationale
> Why the design looks and works the way it does. Use these when writing design system sections.

### Colour — Why Olive?
Most fintech apps go blue or purple — it signals trust, authority, establishment. Olive was a deliberate contrast. Settlr is about splitting expenses with friends, not banking. The brand needed to feel personal and warm, not corporate and cold. Olive is earthy and grounded — it reads as trustworthy without reading as institutional.

### Colour — Why Coral for "Owe" instead of Red?
Red signals error. Danger. Something went wrong. Owing money between friends is normal — it's the entire point of the app. Coral is warm and honest without being alarming. The amount is sometimes uncomfortable enough; the colour shouldn't amplify anxiety. Coral sits in the same warm family as the rest of the palette. Red would have felt like a foreign object.

### Typography — Why Unbounded for amounts?
Amounts are the most important data in any finance app. Unbounded's wide letterforms and tight tracking make numbers feel heavy and intentional — not just rendered text. Plus Jakarta Sans handles all UI text. The two fonts create a clear hierarchy: UI chrome vs. the data that matters.

### Token Architecture — How it came together
The 3-tier structure (primitive → semantic → component) didn't arrive fully formed. There was a rough idea from studying how systems like Material Design and Polaris work. But the exact structure was refined through building — specifically through the pain of changing something in one place and having to chase it through 20 files. The rule "nothing hardcoded, ever" was the constraint that forced the architecture to work properly.

---

## The Figma MCP + Claude Workflow
> Use this for the workflow section of the case study.

### What it replaced
Previously: multiple AI tools generating screens fast but inconsistently. Components that looked different from each other. No shared visual language. Outputs that couldn't be compared or built on.

### What changed
The foundation fixed the inconsistency. Once the token system and rules were defined upfront, Claude stopped guessing and started executing. The workflow:
1. **Figma MCP live connection** — Claude reads the Figma file directly. Components, tokens, structure. Not screenshots. Actual understanding of the system.
2. **Custom skills per stage** — Skills defined what to do at each step. No re-briefing. No lost context.
3. **Figma first, always** — Component built in Figma before a line of code. Auto layout, dimensions, tokens.
4. **Live review loop** — Designer reviews in real time. Adjust until exact. Designer stays in control.
5. **Token cleanup before code** — Claude refreshes all tokens, removes unused ones. Then writes code.
6. **Code mirrors design exactly** — Primitive CSS file → Semantic CSS file → Component CSS file. One source of truth.

### The click moment
The first component that came out of Claude with zero hardcoded values. Every colour, spacing, and border radius traced back through the token system. That's when the workflow became real.

### Result
Weeks instead of months. A design system that a developer could actually implement — because the code structure mirrors the design structure exactly.

---

## User Testing Status
⚠️ **Settlr has not been tested with users yet.** The app is still in progress.

Every design decision is grounded in the Splitwise research findings — not assumed to work, but intentionally designed to address specific, observed failures. The hypothesis is clear. User testing is planned once the build is complete.

### What to test (planned)
- Task 3 equivalent: Add expense with unequal split — does the dedicated split screen reduce cognitive load vs Splitwise?
- Task 5 equivalent: Settle up — can users find and complete the flow without confusion?
- Navigation: does merging Friends + Groups into People tab reduce wrong-section errors?
- Overall SUS score — baseline comparison against Splitwise's score from the original study.

---

---

## Phase 1 — Splitwise Cognitive Ergonomics Assessment

### Meta
- **Type**: Academic Project
- **Duration**: 10 Days
- **Guide**: Dr. Wricha Mishra
- **App studied**: Splitwise (group expense-sharing app)

### Introduction
Splitwise is a popular **expense-sharing app** designed to simplify financial arrangements among friends, roommates, and groups. Users input expenses, categorise them, and Splitwise calculates each person's share, making it easy to settle debts without hassle.

### Aim
Understand the **usability and cognitive ergonomics** of Splitwise and find scope for improvement based on user study.

---

### Research Methodology — 4-Step Process

| Step | Name | Sub-tasks |
|------|------|-----------|
| 1 | Primary Research | User Definition, Literature Review |
| 2 | User Flow Exploration | HTA, SHERPA, Cognitive Walkthrough, Heuristic Analysis |
| 3 | User Evaluation | User Testing, SUS, NASA-TLX, SHERPA Validation |
| 4 | Design Intervention | Design Suggestions, User Validation |

---

### User Definition
Splitwise targets **tech-savvy users aged 16–30**, fluent in English, in **urban areas**, comfortable with technology. Use cases: roommates, friends, couples, travelers, students, family, coworkers, event organisers.

---

### Literature Review — Key Insight
**Simplicity**: Overloading a finance app with details and complex features overwhelms users. A well-designed finance app should appear minimalistic and straightforward. Complexity deters users and leads to dissatisfaction.

---

### User Flow Explorations
After defining the user and learning what matters in a financial app, user flow explorations were done to understand how Splitwise is currently structured, where it lacks, and where interventions are needed.

---

### Heuristic Analysis
A usability evaluation method where expert evaluators examine the interface against predefined usability principles ("heuristics") to identify issues and areas for improvement.

---

### 5 Defined Tasks

#### Task 1 — Create a group of family members

**Cognitive Walkthrough**
1. Open app → recognisable icon, launches swiftly
2. Navigate to "Groups" in bottom nav (label/icon makes it easy)
3. Find "Create New Group" — button or plus icon, intuitive
4. Name the group (clear text field, e.g. "Family")
5. Add Members → contacts or email entry
6. Review and confirm → "Create" / "Confirm," app provides feedback

**HTA**
- T1: Access Groups Section
  - T1.1: Create a New Group
    - T1.1.1: Enter group name + type
    - T1.1.2: Add Members (search, select, confirm)
  - T1.4: Save/Review → confirm via "Save"

**SHERPA**
| Step | Codes |
|------|-------|
| T1 | S2 |
| T1.1 | A1, A3, A10, E, R1, S2 |
| T1.1.4 | B1 |

---

#### Task 2 — Edit amount in any Activity

**Cognitive Walkthrough**
1. Open app
2. Go to Activity feed (bottom nav)
3. Find the specific activity by name/description
4. Edit amount (tap field or "Edit" button)
5. Save changes (confirm)
6. Notification confirms update in activity feed

**HTA**
- T2.1: Access Expense Creation / Select Friends
- T2.2: Access dropdown (expense)
- T2.3: Enter / Allocate expense details → Choose Group
- T2.4: Verify expense details
- T2.5: Save → confirm in activity feed

**SHERPA**
| Step | Codes |
|------|-------|
| T2.3 | A3, A10, R1, R2 |
| T2.3.2 | S2, R1 |
| T2.3.3 | A3, R1, R2 |

---

#### Task 3 — Split $100 between 3 friends

**Cognitive Walkthrough**
1. Open app
2. Go to Expenses section (bottom nav)
3. Tap "Add Expense" → enter $100 + description
4. Select friends → Scroll to "Split equally," adjust method
5. Customise percentages per friend
6. Save expense

**HTA**
- T3.1: Access Expenses
  - T3.1.1: Enter expense details ($100, description)
  - T3.3.1: Create Expense button
- T3.2: Access Friend Tab
  - T3.2.1: Select Friends
  - T3.2.2: Access Expense Creation
  - T3.2.3: Select Friends / Allocate Percentages (split equally section)
  - T3.3.2: Add another friend
  - T3.3.3: Verify expense details
- T3.6: Save Expense

**SHERPA**
| Step | Codes |
|------|-------|
| T3.2.1 | A10, R1, S2, A3, A7 |
| T3.2 | A10, A1 |
| T3.3 | A1, R1, E8 |

---

#### Task 4 — Add a comment in a friend's transaction

**Cognitive Walkthrough**
1. Open app
2. Go to Activity/Transactions (bottom nav)
3. Find friend's transaction
4. Tap "Add Comment" → text field opens
5. Type comment (e.g. "will repay next week")
6. Tap "Save" / "Post"

**HTA**
- T4: Access Friend Transaction to leave a comment
  - T4.1: Access transaction in Activity / Friend tab
  - T4.2: View Transaction Details
  - T4.3.1: Add Comment (tap "Comment" → text field)
  - T4.3.1: Enter Comment text
  - T4.4: Save Comment (Post/Save button)

**SHERPA**
| Step | Codes |
|------|-------|
| T4.1 | AT, R1, A10, S2, A9, A3 |
| T4.2.1 | AT, I1 |
| T4.2.3 | R1 |

---

#### Task 5 — Settle up a group

**Cognitive Walkthrough**
1. Open app
2. Go to Groups section
3. Select the group to settle
4. Tap "Settle Up"
5. Review balances (who owes whom, amounts)
6. Confirm settlement → notification confirms, activity feed updates

**HTA**
- T5.1: Settle up an expense (confirm screen + time period)
- T5.2: Access Activity Section / Friends tab
- T5.7: Access Friends Section
- T5.3: Select the Friend to Settle Up
- T5.2.1: Review Settle Up Details
- T5.3.1: Initiate Settle Up
- T5.4: Confirm Settle Up

**SHERPA**
| Step | Codes |
|------|-------|
| T5.1 | A1, A4, A10, I2, A6 |
| T5.2 | AT |
| T5.3 | AT, R1 |

---

### User Evaluations

#### NASA Task Load Index (NASA-TLX)
Multi-dimensional assessment tool that rates **perceived workload** to assess task/system/team effectiveness or compare workloads across conditions.

#### SUS (System Usability Scale)
Standard questionnaire measuring perceived usability.

#### SHERPA Validation
Errors found in user testing were compared against pre-defined SHERPA codes to validate predictions.

*(Exact scores for NASA-TLX and SUS — see `/Users/divyanshrastogi/Downloads/part 3.png`)*

---

### Design Suggestions (from Research)
Four interventions proposed based on findings:

1. **Home Page** — Create a unified home page to view necessary information and perform key actions in one place
2. **Updated Add Expense Menu** — Redesign the add expense flow
3. **Merged Friends + Groups** — Combine Friends and Groups into a single view
4. **Activity Section Changes** — Restructure the Activity feed

---

### Source Files
| File | Contents |
|------|----------|
| `/Users/divyanshrastogi/Downloads/splitwise/Group 184.png` | Task 1 — HTA + SHERPA + Cognitive Walkthrough |
| `/Users/divyanshrastogi/Downloads/splitwise/Group 185.png` | Task 5 — HTA + SHERPA + Cognitive Walkthrough |
| `/Users/divyanshrastogi/Downloads/splitwise/Group 186.png` | Task 4 — HTA + SHERPA + Cognitive Walkthrough |
| `/Users/divyanshrastogi/Downloads/splitwise/Group 187.png` | Task 3 — HTA + SHERPA + Cognitive Walkthrough |
| `/Users/divyanshrastogi/Downloads/splitwise/Group 188.png` | Task 2 — HTA + SHERPA + Cognitive Walkthrough |
| `/Users/divyanshrastogi/Downloads/part 3.png` | User Evaluations + Design Suggestions |
| Figma node 2030:5938 | Overview, intro, methodology, primary research, literature review, heuristic analysis |

---
---

## Phase 2 — Settlr (The Redesign)

### Meta
- **Type**: UX Audit & Redesign (independent project extending the Splitwise research)
- **Timeline**: Sept 2023 (and ongoing)
- **Guide**: Prof. Wricha Mishra
- **Tools**: Figma, Claude, Figma MCP, Notion
- **Role**: UX Designer

### What it is
Settlr is an independent redesign of the group expense splitting experience. The Splitwise research findings were used as the foundation — the IA was restructured, user flows were simplified, and an entirely new design system was built from scratch.

---

### Design Principles
- **Mobile only** — 393px (iPhone 15 Pro), no hover states, use Pressed for feedback
- **No dark mode** — single light theme
- **Brand color**: Olive (earthy green-tinted)
- **Fonts**: Plus Jakarta Sans (body/UI) + Unbounded (display/headings/amounts)
- **Warm palette** — neutrals are beige-warm, not cool gray

---

### Design System — Color Primitives (7 palettes, 10 steps each)

| Palette | Purpose | Key Colors |
|---------|---------|------------|
| Neutral | Warm beige backgrounds/surfaces | 50=#FEF9EE → 900=#1A1810 |
| Gray | Pure neutral text/UI | 0=#FFFFFF → 1000=#000000 |
| Olive | Brand green (primary) | 50=#F2F4EB → 900=#0A1005; **600=#31401A** is primary |
| Green | Success / Lent money | 50=#E8FAF0 → 900=#091A0D |
| Coral | Error / Owe money | 50=#FBF0EE → 900=#1C0B07 |
| Yellow | Warning | 50=#FFFAE8 → 900=#1C1302 |
| Jay | Info / Blue | 50=#EBF4F7 → 900=#020A0E |

---

### Design System — Typography

| Category | Font | Sizes |
|----------|------|-------|
| Display | Unbounded (Black/Bold) | 24–64px, tight letter-spacing |
| Heading | Unbounded (Black/Bold) | 16–28px |
| Title | Plus Jakarta Sans (SemiBold/Bold) | 13–18px |
| Body | Plus Jakarta Sans (Regular) | 12–16px |
| Label | Plus Jakarta Sans (Medium/SemiBold) | 12–16px |
| Caption | Plus Jakarta Sans (Regular) | 11–12px |
| Overline | Plus Jakarta Sans (Medium/SemiBold) | 10–12px, wide letter-spacing |
| Amount | Unbounded (Regular/Bold/Black) | 13–48px, negative letter-spacing |

---

### Design System — Spacing, Radius, Other Scales

**Spacing**: 2, 4, 8, 12, 16, 20, 24, 32, 48, 64px

**Radius**: 2, 4, 8, 12, 16, 20, 24, 32, 48, 64, 9999px (pill)

**Border Width**: 1px (small), 1.5px (medium), 2px (large)

**Icon Sizes**: 12, 16, 20, 24, 32px

**Opacity**: 10% (subtle), 25% (medium), 50% (strong), 75% (disabled), 90% (backdrop)

**Shadows**: xs through xl (layered, warm-tinted)

---

### Design System — Key Component Tokens

| Component | Key Tokens |
|-----------|-----------|
| Button Primary | bg: olive/600, fg: gray/0 |
| Button Secondary | bg: olive/200, fg: olive/700 |
| Button Ghost | fg: olive/600, no fill |
| Button Destructive | bg: coral/400, fg: gray/0 |
| Chip Off | bg: neutral/100, border: neutral/300, fg: neutral/800 |
| Chip On | bg: olive/600, border: olive/600, fg: gray/0 |
| Label Success | bg: green/50, fg: green/600 |
| Label Error | bg: coral/50, fg: coral/600 |
| Label Warning | bg: yellow/50, fg: yellow/600 |
| Label Info | bg: jay/50, fg: jay/600 |
| Input Default | bg: neutral/100, border: neutral/300 |
| Input Focused | bg: gray/0, border: olive/600 |
| Input Error | bg: coral/50, border: coral/400 |
| FAB | bg: olive/300, fg: olive/700 |
| Bottom Nav | bg: gray/0, active pill: gray/200 |
| Card Group Lent | border: green/100 |
| Card Group Owe | border: coral/100 |
| Sheet | bg: neutral/50, top border: olive/600 (2px) |
| Avatar initials | bg: olive/200, fg: olive/600 |

---

### 27 Components Built

| Component | CSS Class Prefix | Key Variants |
|-----------|-----------------|--------------|
| Button | `.btn` | Primary, Secondary, Ghost, Destructive × SM/MD/LG |
| Icon Button | `.icon-btn` | SM (40px), MD (52px), LG (64px) |
| Chip | `.chip` | SM/MD/LG × On/Off |
| Type Chip | `.type-chip` | — |
| Input Field | `.input-field` | Empty, Active, Filled, Error, Disabled |
| Labels/Badges | `.label` | Success, Warning, Error, Info, Neutral × SM/MD/LG |
| Badge | `.badge` | — |
| Avatar | `.avatar` | XS(20), SM(28), MD(40), LG(56) × Initials/Photo |
| Member Pill | `.member-pill` | — |
| Radio Control | `.radio-control` | Default, Selected, Disabled |
| Radio Item | `.radio-item` | Default, Selected, Disabled |
| Radio Item Boxed | `.radio-item-boxed` | Default, Selected, Disabled |
| Checkbox | `.checkbox-control` | — |
| OTP Input | `.otp-digit` / `.otp-group` | 6-digit, states: Empty/Focus/Filled/Error |
| Person Item | `.person-item` | Action variants: Chevron, Radio, Checkbox, Input, None |
| Expense Item | `.expense-item` | Lent / Owe × Default / Pressed |
| Group Card | `.card-group` | Lent / Owe |
| Create Group Card | `.card-create` | Default |
| Bottom Nav | `.bottom-nav` | Active: Home / People / Activity |
| Segment Control | `.segment-control` / `.segment-item` | Default, Active, Disabled |
| FAB | `.fab` | 64×64, circle |
| Heading | `.heading` | Default, Variant2 |
| Bottom Sheet | `.sheet` / `.sheet-overlay` | — |
| Top App Bar | `.top-app-bar` | — |
| Action Button Row | `.action-btn-row` | — |
| Settlement Item | `.settlement-item` | — |
| Avatar Stack | `.avatar-stack` | — |
| Empty State | `.empty-state` | — |
| Toast | `.toast` | — |

---

### 34 Screens Built

**Auth / Onboarding**
- splash.html
- welcome.html
- login.html
- otp.html

**Main App**
- home-dashboard.html
- people.html
- activity.html
- settings.html

**Group Flows**
- group-detail.html
- create-group-name.html
- create-group-members.html
- create-group-done.html
- edit-group.html
- add-group.html

**Expense Flows**
- add-amount.html
- add-split.html
- add-review.html
- expense-detail.html
- edit-expense.html

**Individual / Person**
- individual-detail.html

**Settlement Flows**
- settle-select.html
- settle-amount.html
- settle-method.html
- settle-success.html

**Component Previews (dev-only)**
- component-docs.html
- preview-action-button-row.html
- preview-empty-state.html
- preview-group-detail-full.html
- preview-remaining-components.html
- preview-settlement-item.html
- preview-stacked-avatars.html
- preview-toast.html
- preview-top-app-bar.html

---

### Token Architecture (Rule: No Primitives in Components)
```
tokens/colors.css → primitives (72 colors)
tokens/semantic.css → component-level aliases (100+)
css/*.css → components (use semantic tokens only)
screens/*.html → screens (use semantic tokens only)
```

---

### Figma File
- **File Key**: eEoeGLJO7fTeV2gD7CjVZ2 ("MCP test 1")
- **Components Final page**: node 128:9135
- Built with: Figma Plugin API, figma_execute, figma_capture_screenshot

---

### Design Review Status (as of 2026-03-28)
67+ issues found across all screens and components.

| Severity | Count |
|----------|-------|
| Critical (P0) | 18 |
| High (P1) | 19 |
| Medium (P2) | 16 |
| Low (P3) | 14+ |

**Main categories of issues:**
- 40+ hardcoded hex/rgb colors bypassing token system
- 25+ hardcoded spacing values
- 15+ hardcoded typography declarations
- 8+ hardcoded border-radius values
- Primitive color tokens used in screens (should go through semantic layer)
- Missing empty states, form validation, loading states, success toasts
- Custom component CSS redefined per-screen instead of using shared files

---

### Source Files
| Path | Contents |
|------|----------|
| `/Users/divyanshrastogi/Desktop/Settlr/CLAUDE.md` | Full project rules and workflow |
| `/Users/divyanshrastogi/Desktop/Settlr/settlr-design.md` | Master design system reference (colors, type, spacing, all 27 components) |
| `/Users/divyanshrastogi/Desktop/Settlr/design-system.md` | Token and component inventory |
| `/Users/divyanshrastogi/Desktop/Settlr/references/changelog.md` | Change log (from 2026-03-20) |
| `/Users/divyanshrastogi/Desktop/Settlr/references/design-review-report.md` | Full 67-issue design review |
| `/Users/divyanshrastogi/Desktop/Settlr/tokens/` | colors.css, semantic.css, spacing.css, radius.css, typography.css, shadows.css |
| `/Users/divyanshrastogi/Desktop/Settlr/css/` | 26 CSS component files |
| `/Users/divyanshrastogi/Desktop/Settlr/components/` | 27 component spec markdown files |
| `/Users/divyanshrastogi/Desktop/Settlr/screens/` | 34 built screen HTML files |

---
---

## Existing Case Study Copy (in website)
> Already written in index.html, for reference when developing final copy.

**Homepage project card description:**
> "Evolved from a college ergonomic study of Splitwise into an independent redesign of group expense splitting. Conducted HTA, NASA TLX, and SHERPA analyses, refined the IA and user flows, then built a complete design system as an experimental ground for systems thinking."

**Problem statement (overlay):**
> "Group expense splitting shouldn't feel like a chore."

**Problem body:**
> "Started as an ergonomic evaluation of Splitwise — a college course project. But the findings were too good to leave in a report. Splitwise had real usability gaps: cognitive load in settlement flows, unclear information hierarchy, and an onboarding experience that assumed too much prior knowledge."

**Research section title:**
> "Three methods. One clear picture."

**Redesign section title:**
> "Cleaner IA. Smarter flows. A complete design system."

**Redesign body:**
> "Used this project as an experimental ground for design systems thinking — built a full component library using Figma, Claude, and Figma MCP integration."

**Chips shown:** HTA analysis · NASA TLX · SHERPA · Competitive analysis · Full design system

---

## The Workflow (Figma MCP + Claude — Key Pointers)
> Source: LinkedIn post series documenting the same workflow used for Settlr.

### The Core Enabler
Figma's MCP server integration with Claude. Claude reads the Figma file directly — components, tokens, structure — as **live structured data**. Not screenshots. Not exports. Actual understanding of the system.

### Why it was needed
Multiple AI tools were generating screens fast but inconsistently — cramped layouts, tiny fonts, no accessibility, outputs that looked nothing like each other. Couldn't compare directions. Couldn't lock in a look and feel. The foundation (design system + rules) fixed the inconsistency completely.

### Token Architecture — 3 Tiers
1. **Primitive tokens** — raw values only. Every color, spacing, font size, radius, shadow. No meaning attached.
   - e.g. `color-blue-500`, `spacing-4`, `radius-md`
2. **Semantic tokens** — primitives get assigned purpose/meaning.
   - e.g. `color-background-primary → color-blue-500`, `color-text-danger → color-red-600`
3. **Component tokens** — scoped to each component, reference the semantic layer only.
   - e.g. `button-background → color-background-primary`

**Why 3 tiers**: When something changes (and it always does) — change it in one place, it flows through the entire system automatically. That's what makes it scalable. That's what makes it a source of truth.

### Component Build Approach
- All rules defined upfront: which token goes where, which text style, which padding, which icon size
- Claude wasn't guessing — it was executing a fully defined vision
- Hand it one component design → it creates every state, every size, every variant with the right properties
- Then generates complete code for all of it
- Design control stays with the designer. Grunt work automated.
- WCAG accessibility tested. Industry standards applied. Every token and property optimised.
- Nothing hardcoded. Nothing detached. Every component connected to the token system.

### The Refined Step-by-Step Workflow (Post 6)

1. **Figma MCP connection** — Claude reads the Figma file live. Components, tokens, structure. No manual exports. No lost context.

2. **Custom skills** — Skills created to tell Claude exactly what to do at each stage. Which tools to use, in what order, for what purpose. No guessing. No getting overwhelmed.

3. **Figma first, always** — Before writing a single line of code, Claude builds the component directly in Figma. Auto layout, dimensions, tokens — all as described.

4. **Live review + iterate** — Designer reviews in real time. Padding off → fix it. Wrong color → describe the change. Auto layout wrong → adjust. Repeat until it looks exactly right.

5. **Designer approves → token cleanup** — Claude refreshes all tokens used in that component. Removes unused tokens. Ensures no color is pulled from the semantic layer directly — every value has a proper component-level token.

6. **Only then: write the code** — Code structure mirrors the design system exactly:
   - Primitive tokens → one CSS file
   - Semantic tokens → one CSS file
   - Each component → its own MD or CSS file referencing the semantic layer

7. **Dev stack described upfront** — Full context of how the dev team works provided at the start, so every export lands ready to use. No translation. No interpretation. Just implementation.

8. **Right-sized chunks** — Enough context for Claude to work well, not so much it loses the thread. Sequenced carefully.

### The Result
"A workflow that felt less like using a tool — and more like working with someone who understood the system as well as I did."

---

## What's Still Needed (for case study)
- Written content: research findings (what HTA/NASA-TLX/SHERPA revealed specifically)
- Written content: redesign decisions (what changed in IA, what flows restructured)
- Screenshots of built screens (from `/screens/`)
- Hero image for case study overlay
- Before/After comparisons (Splitwise vs Settlr screens)
- Exact NASA-TLX and SUS scores (from `part 3.png` — needs higher-res image)
