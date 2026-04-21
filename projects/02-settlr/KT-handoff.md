# KT Document — Settlr Case Study Work
> Knowledge Transfer for new chat. Date: 2026-04-09
> This picks up from the session that ran out of context.

---

## What This Project Is

**Portfolio website** at `/Users/divyanshrastogi/Desktop/Website/index.html` — single HTML file, no build step.
**Preview server**: `npx serve -p 3456 .` — use `mcp__Claude_Preview__preview_start` with name `"portfolio"`.

Divyansh Rastogi, product designer, IDC IIT Bombay AIR 5. Goal: get hired.

---

## Where We Left Off

### Last session tasks (in order):
1. ✅ Fetched updated Settlr prototype screens from `/Desktop/Settlr/` into `Website/prototype/settlr/`
2. ✅ Built Settlr case study in `index.html` — phone row (4 iframes), findings section (4 findings with Splitwise mockups + Settlr iframes), full gallery (24 screens in 6 rows)
3. ✅ Replaced coded Splitwise HTML mockups with **real Splitwise screenshots** (`sw-settle-up.png`, `sw-groups.png`, `sw-friends-home.png`, `sw-add-expense.png`) in the cs-finding-trio sections
4. ✅ User put all research documentation in `/projects/02-settlr/Splitwise Screens/Research Documentation/` — **26 image files**
5. 🔲 **LAST TASK (incomplete):** Read all research images → consolidate into a text file → revise case study plan

The session cut out while reading the research images. **This KT doc IS the consolidation** — everything extracted from the images is below. The next task is to use this data to improve the case study copy and docs.

---

## Research Documentation — Full Extract

### File locations
All in: `/Users/divyanshrastogi/Desktop/Website/projects/02-settlr/Splitwise Screens/Research Documentation/`

| File | Content |
|------|---------|
| `Section 1.png` | 5 task definitions (exact task descriptions used in testing) |
| `Tasks & Questions.png` | Full testing protocol: Screen Qs, Pre-test Qs, In-test Qs, Post-test Qs + SUS 10 items |
| `HTA 1.png` | Task 1 HTA (Create Group) |
| `HTA 2.png` | Task 2 HTA (Split Rs.1846 unequally) |
| `HTA 3.png` | Task 3 HTA (Add expense cafe 92, Rs.340, 2 friends) |
| `HTA 4.png` | Task 4 HTA (Add comment in friend's transaction) |
| `HTA 5.png` | Task 5 HTA (Settle up Rs.500 to Anuj) |
| `HTA Complete.png` | Full Splitwise IA map — all navigation paths |
| `Sherpa.png` | Full SHERPA matrix — all users × all tasks |
| `SHERPA Analysis.png` | Per-user SHERPA grid (SU01–SU08, Tasks 1–5) |
| `SHERPA Observation.png` | Written analysis per task (most common error codes + summary) |
| `SHERPA Organised.png` | Tables: SHERPA codes by task by step (cleaner reference) |
| `Cognitive Walkthrough.png` | Full CW for all 5 tasks |
| `Heuristic Evaluation.png` | 3 heuristic violations found |
| `User Feedback.png` | Post-test quotes from SU06, SU07, SU10, SU11 |
| `Group 142.png` | Task 3 combined: CW + HTA + SHERPA |
| `Group 143.png` | Task 4 combined: CW + HTA + SHERPA |
| `Group 144.png` | Task 5 combined: CW + HTA + SHERPA |
| `Group 145.png` | Task 2 combined: CW + HTA + SHERPA |
| `Group 179.png` | Task 1 combined: CW + HTA + SHERPA |
| `Insights.png` | Solution insights (Raghav + DHAIRYA) |
| `Insights-1.png` | 8 pain point stickies (Raghav Samodia) |
| `Payment Flow.png` | Splitwise Settle Up + Add Expense flow diagram |
| `Sign Up.png` | Splitwise Sign Up + Onboarding flow diagram |
| `Slide 16_9 - 28.png` | User Evaluations summary + Final Inference + Redesign screenshots |
| `Slide 16_9 - 29.png` | Project cover / title slide |

---

### Exact Task Definitions (Section 1.png)

- **Task 1:** Open Splitwise → Create group name it as **"Ghar"** → Add 5 family members: Vaibhav, Mukul, Abhishek, Samarth, Raghav
- **Task 2:** Open Group "Ghar" → Add entry named **"Dmart"** of Rs.1846 and split: you(Dhairya) pay 30%, Vaibhav pays 20%, Mukul pays 50%
- **Task 3:** Add expense + split equally → Title: **"Cafe 92"** → Paid by: You → Split only between Divyansh Rastogi IDC, Raghav Samodia IDC → Expense: Rs. 340
- **Task 4:** In Friends, open a transaction named **"Household"** with Raghav Samodia → Add a comment to the transaction saying "please pay me asap"
- **Task 5:** Settle Up an Expense. Expense Name: **"Test"** → You Owe: Rs. 500 → to Anuj

---

### Users Tested
8–11 users (names visible): SU01 Stuti, SU02 Lakshya, SU03 Kritvi, SU04 Aviral, SU05 Dia, SU06 Sakshi, SU07 Divesh, SU08 Limesh, SU10, SU11

---

### Testing Protocol (Tasks & Questions.png)

**1 Screen Questions** (asked on arrival):
- How old are you?
- What's your internet transaction level?
- What's the last time you used the app?
- What features do you use most?
- How much time do you spend on the app?

**2 Pre-test Questions:**
- What specifically do you use the app for? How often?
- Which features do you use most?
- How satisfied are you with available workflow? (SUS scale: 1 Satisfied → 4 Somewhat Dis. → 5 Dissatisfied)
- What other apps did you use or research before choosing this?
- Why did you choose this?

**3 In-Test Questions:**
- When you go on, what's the first thing you do? Is there another way to complete this task?
- How do you use it features?
- What parts of the website/app do you use the most? Why?
- Which part of the app interface? Is it easy to use?
- Do you think about how information and features are laid out?
- How easy do you think it is? How easy is it to find? (scale 1–10)

**4 Post-Test Questions:**
1. Overall, what's your experience been with the app?
2. If you could change one thing about the app, what would it be? Why?
3. What parts of the website / app do you use the most? Why?
4. What are you most excited about with the app? Why?
5. Why will you continue to use this app? What will stop you from using this app in the future?
6. How likely are you to refer this app? Why or why not? (scale 1/10)

**SUS 10 Items (read verbatim):**
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

---

### SHERPA Error Codes Reference
- **A1** = Wrong action on right object
- **A2** = Action performed in wrong order
- **A3** = Wrong action on wrong object
- **A4** = Right action at wrong time / wrong direction
- **A6** = Action omitted (step skipped)
- **A7** = Wrong direction / wrong section navigated to
- **A10** = Right operation performed in wrong direction
- **S1** = Information not communicated / not obtained
- **S2** = Information selected wrong / selection made incorrectly
- **I1** = Operation took too long / too many steps
- **I2** = Omission — step not done
- **R1** = Wrong action — right intention, wrong execution
- **R2** = Action reversed / repeated
- **C3** = Confusion — unsure what to do next
- **ER** = Error / task failure

---

### SHERPA Per-Task Analysis (SHERPA Observation.png)

**Task 1 (Create Group):**
Most users encountered A1/A2, S2 (wrong direction communicated), A10 (wrong operation direction), S2 (selection made incorrectly).
- Wrong options selected → confused between navigation items
- Wrong action — went to wrong section instead of Groups
- **Summary**: Wrong information communicated (A1), wrong information (A3), wrong direction (A10), selection made wrong (S2).

**Task 2 (Split Unequally):**
S1 — "option to create group not visible to them". A2 — confused + → created expense button with wrong direction. Users thought + button = "Add Group". Wrong section entered, error propagated.
- **Summary**: S1 (info not obtained), A2 (confused about expand button), S2 (wrong direction, wrong section). Users thought + was "Add Group" option — error thinking persists through the task.

**Task 3 (Add Expense with Custom Split):**
S2 (wrong operation on right object), S1 (info not obtained), I1 (operation too long, ran out of time). A3 (wrong direction in navigation). A7 (wrong selection made). TASK FAIL in multiple users.
- **Summary**: S2 + I1 + A3. Wrong selection while adding up. Task failed for users who couldn't find the percentage split option.

**Task 4 (Add Comment):**
A1 (wrong operation on right object), S1 (information was not communicated). Some A2 (information too much, overwhelming). Right operation but wrong direction — found friend but went to wrong transaction.
- **Summary**: A1 (right object, wrong action), S1 (info not obtained), A2 (operation in wrong direction overall).

**Task 5 (Settle Up):**
A1 (operation too long), A2 (wrong operation on wrong object), A4 (right operation, wrong direction). A10 (right operation wrong direction). Most errors of any task.
- **Summary**: Most errors here. Users repeatedly: went to Add Expense instead of Settle Up; couldn't find settle up in the Friends tab; wrong action direction persisted.

---

### SHERPA Organised — Codes by Task by Step

**Task 1:**
| Step | SHERPA Codes |
|------|-------------|
| T1 | S2 |
| T1.1 | A1, A3, A10, I1, R1, S2 |
| T1.1.3 | C3 |
| T1.1.4 | R1 |

**Task 2:**
| Step | SHERPA Codes |
|------|-------------|
| T2.3 | A3, A10, R1, R2 |
| T2.3.2 | S2, R1 |
| T2.3.3 | A3, R1, R2 |

**Task 3:**
| Step | SHERPA Codes |
|------|-------------|
| T3.2.1 | A10, R1, S2, I2, A3, A7 |
| T3.2 | A10, A1 |
| T3.3 | A1, R1, ER |

**Task 4:**
| Step | SHERPA Codes |
|------|-------------|
| T4.1 | A7, R1, A10, S2, A9, A3 |
| T4.2.1 | A7, I1 |
| T4.2.3 | R1 |

**Task 5:**
| Step | SHERPA Codes |
|------|-------------|
| T5.1 | A1, A4, A10, I2, A6 |
| T5.2 | A7 |
| T5.3 | A7, R1 |

---

### SHERPA Per-User Grid (SHERPA Analysis.png — user-level view)

| User | T1 | T2 | T3 | T4 | T5 |
|------|----|----|----|----|-----|
| SU01 Stuti | Wrong options selected (A1), Wrong action (A3), Wrong direction (A10) | Tried to find the expense via "Groups" — wrong direction. Wrong balance, wrong direction | Unable to find and enable people, taps options on the top | Unable to find the option from "Friends" — task fail | Messed up the form, added an expense to settle — **TASK FAIL** |
| SU02 Lakshya | Clicked + to create group — wrong section | Added group, calculated expense manually — TASK FAIL | Limited wrong groups | User wrong way: Comment not found | Task Successful |
| SU03 Kritvi | Clicked + to create group | Done Successfully | Added an expense in the wrong group, then individual group not selected — **TASK FAIL** | Scrolled the group section, then selected group | Added an expense to settle up — **TASK FAIL** |
| SU04 Aviral | Clicked + to create group. Wrong direction wrong function. Used incorrectly | Wrong class, wrong direction, wrong calculator. Wrong balance mentioned | Wrong selection went by the group members and used wrong method | Task Successful | Wrong method: Added to a transaction, not able to do the settle up |
| SU05 Dia | Done Successfully | Done, wrong click, wrong balance | Done Successfully | Wrong Click and button fail | Tried to add a + run on the add members search bar — **ERR** |
| SU06 Sakshi | Tried button, nothing. Wrong step | Declined Wrong. Wrong step. Added Expense without being able to add more. Not able to find add more. Long process | Wrong click → wrong menu → wrong selection → long process | Task Successful by accident | App needs home page |
| SU07 Divesh | Wrong step, wrong direction etc. | Wrong steps. Task failed at wrong group from wrong steps | Explored the app → wrong steps | Task Successful, by accident | Did. Needs home page mention |
| SU08 Limesh | Dr = number of members | Type nothing. Shortcut splitting | Multiple filters in SCI | Edited expense — SCI (clicked, then had to keep looking without keep clicking) | Add Expense + missing methods: Rs. 500 |

---

### Heuristic Evaluation (3 violations found)

1. **Visibility Heuristic** — App fails to give an overall view to access different information. Doesn't provide the right information for the distribution of amount once added in "Add Expense."
2. **Natural Mapping** — App addresses a very friendly language. However, terms like "you owe" or "you're owed" could be at times confusing.
3. **User Control and Freedom** — App provides a close button in "Add Expense" to redirect to the main page. (This one was a positive finding.)

---

### User Feedback (Post-Test Quotes)

**SU06 (Sakshi):**
- "The app is very useful but a little complex to use."
- "I am not sure if I will use this app because I rarely need to split the amount. But if required, I will have to definitely use this."
- "I would like if there are any guidelines or demo to use this app, especially for a new user."
- "I would not recommend this app right now because it is complicated."
- "The information on the app is difficult to understand, doesn't seem friendly at glance."

**SU07 (Divesh):**
- "The overall experience of the app seemed complex to use. Not very easy to use."
- "The information looks very crowded on the app, not very readable."
- "Several features seemed difficult to access."
- "The purpose of the application is very exciting for the new user. It will be easy to keep a track on my expenses."
- "I am very neutral to suggest this app."

**SU10:**
- "I use this app frequently, and it seems fine to me."
- "The information and view could be better. Information is too complexly shown."
- "I like how this app helps me to keep track of the expenses without calculations."
- "I am most likely to suggest this app to my friends."

**SU11:**
- "I use it frequently for a specific group and task."
- "Connect it to Gpay and also provide the search system for free because that is basic necessity."
- "I can keep track of expenses easily even when it is not paid."
- "I would like the system is a little less complex."
- "It will also be better if I can remind people to pay me back as soon as possible."
- "I will most likely suggest people to use it."

---

### Insights — Solution Ideas (Insights.png)

**From Raghav Samodia:**
- Merge groups and friends in one section (rational: user is now accustomed to UI of messaging apps and tends to find them together)
- Solve confusion between "settle" and "add expense"
- Settle option in add expense page

**From DHAIRYA:**
- A clear Add Expense option once a group is created inside the group
- A visible + to the search bar to add more people while putting an expense
- A home page to accessible options
- Linking payment methods to Settling Up, or putting cash as payment method

---

### Pain Points — Stickies (Insights-1.png, Raghav Samodia)

1. Cannot cancel member once selected
2. Can't get suggestions to settle expenses
3. Can't settle a particular transactions
4. Multiple selected while adding up
5. Not able to find 'create a group'
6. Not able to find name title easily
7. Unclear who pays whom
8. Not able to find 'add expense' after opening the app

---

### Splitwise IA Map (HTA Complete.png — summary)

The full Splitwise information architecture visible in the diagram:

**Bottom Nav:** Activity | Groups | [+ button] | Friends | Account

**Activity:** Recent Activity → Group Activity, search, Activity → Who paid, who saw, chart, comments, bill photo → Add a comment, delete

**Groups:** Start a new group → Name/Type/Photo/Calendar/Group Names → Group Created → Add Group Members, Share Group links, Add Expense. Contact List → New Contact → Name, Phone Number → Next → Verify Contact Info → Add Contact

**+ (Create):** Select: Note / Date / Group Name → with "You and" → Photo / Take Photo / Import from gallery. Friends Groups → Category / Name / Currency / Amount. Split: Equally / Random Amount / Percent / Shares / Adjustment. Currency: all types → Scan Code / My code.

**Friends:** Find friends/group → Filter → Add contact → Add expense → Search. If not found → Show more → Feedback flow → Redirecting to mail

**Account → Profile:** Logout, Passcode, Are you sure? → Confirm / Enter passcode. App Settings → Notification Settings, Preferences → E-mail Setting → Groups & Friends / Expenses / News & Updates / Save Changes.

**Payment Flow (Payment Flow.png):**
Settle Up entry → Balances / Totals / White Board / Export / Expenses → You lent / You Borrowed → Check → Select a Balance to Settle / Select a Payer → Payment Amount. Add Expense: Description / Amount / Split Options → Equal Split / Full Amount / Else Paid / More Options → Equally / Unequally / By Percentage / By Shares / By Adjustment.

**Sign Up Flow (Sign Up.png):**
Open Splitwise → Sign up / Log in / Sign in with Google → New users: Welcome, Explain, Let's get started → Add apartment / Add group trip / Skip setup → Add Apartment / Add Trip → Group name, Type (add settle up reminders) → Done → Home page (Groups) / Close (App closes)

---

### Final Inference (from Slide 16_9 - 28)

4 key final inferences from the study:
1. **Foundation issues** — especially navigation motion (wrong section errors)
2. **Significance issues** — crowded information, following in wrong flow
3. **Rollout suggest** — no overall design / no visual preferences, visual attention errors
4. **Sketching** — for time frames needed / user cannot use certain tasks quickly

**Design Suggestions (same slide):**
The slide shows a redesign preview with 3 phone mockups (redesigned screens). Design suggestions shown:
- "Suggestions to settle the payments while adding the expense"
- "Changes to the Activity Section"

---

## Current State of the Case Study (in index.html)

### What's BUILT in the Settlr case study:

**Section 1 — Hero** (cover image, phone mockup)
**Section 2 — Phone row** — 4 live iframes of Settlr screens (scale 0.631, `top: -30px` for status bar crop)
  - Screens: `home-dashboard.html`, `add-split.html`, `settle-success.html`, `group-detail.html`
**Section 3 — Design System stats** (27 components, 34 screens, 72 color primitives, 100+ tokens)
**Section 4 — Workflow section** (Figma MCP + Claude, 3-tier token architecture)
**Section 5 — Research section** (methodology overview)
**Section 6 — Findings section** (4 cs-finding-trio blocks with real Splitwise screenshots)
  - `.cs-finding-trio` = 3-col layout: [left: finding card] [middle: Splitwise screenshot] [right: Settlr iframe]
  - Finding 01: Settle Up buried → `sw-settle-up.png` + `settle-select.html`
  - Finding 02: Two separate worlds → `sw-groups.png` + `people.html`
  - Finding 03: No home screen → `sw-friends-home.png` + `home-dashboard.html`
  - Finding 04: Split method hidden → `sw-add-expense.png` + `add-split.html`
**Section 7 — Full Gallery** — 24 live iframes in 6 horizontally-scrollable rows (318×650px tiles, scale 0.8085)

### Splitwise Screenshots used (in assets/images/):
- `sw-settle-up.png` — Anuj Ambhore friend detail, Settle Up accessible only after navigation
- `sw-groups.png` — Groups tab (separate world)
- `sw-friends-home.png` — flat Friends list "home"
- `sw-add-expense.png` — Add Expense form, "Paid by you and split equally" chips

---

## What Needs To Be Done Next

### Primary task (the one we were building up to):
**Improve the case study copy and documentation** using the research data extracted above.

### Specific improvements identified (from the planning discussion):

**1. Research section — add real data**
- Add exact SHERPA error counts per task (Task 5 has the most, Task 3 = TASK FAIL in multiple users)
- Name the actual methods used with one-line descriptions (HTA, SHERPA, Cognitive Walkthrough, Heuristic Evaluation, NASA-TLX, SUS)
- Add SUS score if readable from Slide 16_9 - 28 (currently unclear — the image is small)
- Add NASA-TLX finding: Task 3 (Add Expense with split) = highest cognitive load

**2. Findings section — strengthen each finding with real evidence**

| Finding | Add this data |
|---------|--------------|
| 01 Settle Up | SHERPA T5.1: A1, A4, A10, I2, A6 (5 error types in one step). Multiple TASK FAILs. Quote: *"messed up the form, added an expense to settle"* |
| 02 Two worlds | SHERPA T1.1 wrong section errors (A10, S2) + T5.2 = A7 (wrong section). Users navigated to Friends for settle, Groups for create — neither was right. |
| 03 No home screen | Every task starts with orientation confusion. SU07: "overall complex... not very easy to use". SU06: "doesn't seem friendly at glance". Observer: "at first glance they were confused since there was no homepage" |
| 04 Split method hidden | T3 = most TASK FAILs. SHERPA T3.2.1 = A10, R1, S2, I2, A3, A7 (6 error types). SU04: added wrong amounts. Multiple users couldn't find percentage split. |

**3. User quotes — use verbatim from research (not paraphrased)**
Now confirmed exact quotes available:
- *"The app is difficult to understand, doesn't seem friendly at glance"* — SU06
- *"The information looks very crowded on the app, not very readable"* — SU07
- *"I would not recommend this app right now because it is complicated"* — SU06
- *"Several features seemed difficult to access"* — SU07
- *"Cannot cancel member once selected"* (pain point)
- *"Not able to find 'add expense' after opening the app"* (pain point)
- *"Unclear who pays whom"* (pain point)

**4. Update project-docs.md with extracted research data**
The `research-splitwise.md` file already has a lot. But `project-docs.md` is the source of truth for case study copy. It should reference the new pain points, exact SHERPA codes, and user quotes.

**5. NASA-TLX / SUS scores**
The actual numbers are in `Slide 16_9 - 28.png` but too small to read precisely. The slide is visible but scores are not legible at this resolution. This is a known gap.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/Users/divyanshrastogi/Desktop/Website/index.html` | The entire site |
| `/Users/divyanshrastogi/Desktop/Website/CLAUDE.md` | Full design system, what's built, gotchas |
| `/Users/divyanshrastogi/Desktop/Website/projects/02-settlr/project-docs.md` | Source of truth for Settlr case study copy |
| `/Users/divyanshrastogi/Desktop/Website/projects/02-settlr/case-study-plan.md` | Narrative structure plan |
| `/Users/divyanshrastogi/Desktop/Website/projects/02-settlr/research-splitwise.md` | Existing research data (has content — may need merging with this doc) |
| `/Users/divyanshrastogi/Desktop/Website/prototype/settlr/screens/` | 24+ Settlr screen HTML files |

---

## Important Constraints (Do Not Violate)

1. **Desktop-only** — no responsive layout changes until desktop is finalised
2. **All Settlr screens are PLACEHOLDERS** — Divyansh hasn't finished the Settlr project. Do not treat current screens as final.
3. **User testing NOT done** — frame all Settlr decisions as "designed-to-solve", not "proven-to-solve". Never add user testing validation claims.
4. **The + FAB behaviour in Settlr is still undecided** — don't add copy about it.
5. **NASA-TLX / SUS exact scores** — don't invent numbers. Known: Task 3 = highest cognitive load. Actual scores unclear from available images.

---

## Suggested Next Steps for New Chat

1. **Read** `project-docs.md` and `case-study-plan.md` for full context
2. **Update `project-docs.md`** — merge in the pain points, verbatim quotes, and SHERPA counts from this doc. The "Raw User Observations" section needs expanding with the real data.
3. **Update the case study copy in `index.html`** — specifically:
   - Research section: add method list with evidence counts
   - Findings: add SHERPA code references + user quotes per finding
   - Stats: verify if any numbers can be added (n=8 users tested, 5 tasks, etc.)
4. **Ask Divyansh** for higher-res `Slide 16_9 - 28.png` if NASA-TLX/SUS scores are needed
5. **Start Kinko case study** when Settlr copy is solid

---

*Generated: 2026-04-09 | Session: 35a94fd1*
