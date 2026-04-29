# Settlr — Research Data (Working Reference)
> Single file. All research data from the Splitwise cognitive ergonomics study.
> Easy to scan. Use this when writing case study copy.
> Source: 26 research images in `Splitwise Screens/Research Documentation/` + KT-handoff.md

---

## STUDY OVERVIEW

- **What**: Cognitive Ergonomics Assessment of Splitwise (academic project)
- **Duration**: 10 days
- **Guide**: Dr. Wricha Mishra
- **Users tested**: 8–11 participants (SU01–SU11, some gaps)
- **Methods**: HTA → SHERPA → Cognitive Walkthrough → Heuristic Evaluation → User Testing → NASA-TLX → SUS

---

## PARTICIPANTS

| ID | Name |
|----|------|
| SU01 | Stuti |
| SU02 | Lakshya |
| SU03 | Kritvi |
| SU04 | Aviral |
| SU05 | Dia |
| SU06 | Sakshi |
| SU07 | Divesh |
| SU08 | Limesh |
| SU10 | (name unclear) |
| SU11 | (name unclear) |

**User profile**: Tech-savvy, aged 16–30, urban, English-fluent, comfortable with apps.

---

## 5 TASKS (exact definitions used in testing)

| # | Task |
|---|------|
| T1 | Open Splitwise → Create group named **"Ghar"** → Add 5 family members: Vaibhav, Mukul, Abhishek, Samarth, Raghav |
| T2 | Open Group "Ghar" → Add entry named **"Dmart"** of Rs.1846 → Split: you (Dhairya) pay 30%, Vaibhav 20%, Mukul 50% |
| T3 | Add expense titled **"Cafe 92"** → Paid by: You → Split only between Divyansh Rastogi IDC + Raghav Samodia IDC → Rs.340 |
| T4 | In Friends, open transaction named **"Household"** with Raghav Samodia → Add comment: "please pay me asap" |
| T5 | Settle Up. Expense: **"Test"** → You Owe Rs.500 → to Anuj |

---

## SHERPA ERROR CODES (reference)

| Code | Meaning |
|------|---------|
| A1 | Wrong action on right object |
| A2 | Action performed in wrong order |
| A3 | Wrong action on wrong object |
| A4 | Right action at wrong time / wrong direction |
| A6 | Action omitted (step skipped) |
| A7 | Wrong direction / wrong section navigated to |
| A10 | Right operation performed in wrong direction |
| S1 | Information not communicated / not obtained |
| S2 | Information selected wrong / selection made incorrectly |
| I1 | Operation took too long / too many steps |
| I2 | Omission — step not done |
| R1 | Wrong action — right intention, wrong execution |
| R2 | Action reversed / repeated |
| C3 | Confusion — unsure what to do next |
| ER | Error / task failure |

---

## SHERPA BY TASK — CODES PER STEP

### Task 1 — Create Group
| Step | Codes |
|------|-------|
| T1 | S2 |
| T1.1 | A1, A3, A10, I1, R1, S2 |
| T1.1.3 | C3 |
| T1.1.4 | R1 |

**Summary**: Wrong info communicated (A1), wrong object (A3), wrong direction (A10), wrong selection (S2). Users confused about navigation — went to wrong section instead of Groups.

### Task 2 — Split Unequally (Rs.1846)
| Step | Codes |
|------|-------|
| T2.3 | A3, A10, R1, R2 |
| T2.3.2 | S2, R1 |
| T2.3.3 | A3, R1, R2 |

**Summary**: S1 (option to create group not visible). A2 (+ button confusion — users thought it = "Add Group", not "Add Expense"). Wrong section entered, errors cascaded.

### Task 3 — Add Expense with Custom Split ⚠️ HIGHEST FAILURE RATE
| Step | Codes |
|------|-------|
| T3.2.1 | A10, R1, S2, I2, A3, A7 — **6 error types in one step** |
| T3.2 | A10, A1 |
| T3.3 | A1, R1, ER |

**Summary**: S2 + I1 + A3. Split method not found. Multiple users hit TASK FAIL. Highest cognitive load in NASA-TLX.

### Task 4 — Add Comment
| Step | Codes |
|------|-------|
| T4.1 | A7, R1, A10, S2, A9, A3 |
| T4.2.1 | A7, I1 |
| T4.2.3 | R1 |

**Summary**: A1 (right object, wrong action), S1 (info not obtained). Found friend but went to wrong transaction.

### Task 5 — Settle Up ⚠️ MOST ERRORS OVERALL
| Step | Codes |
|------|-------|
| T5.1 | A1, A4, A10, I2, A6 — **5 error types in one step** |
| T5.2 | A7 |
| T5.3 | A7, R1 |

**Summary**: Most errors of any task. Users repeatedly: went to Add Expense instead of Settle Up; couldn't find Settle Up in the Friends tab; wrong action direction persisted through the task.

---

## PER-USER SHERPA GRID

| User | T1 | T2 | T3 | T4 | T5 |
|------|----|----|----|----|-----|
| SU01 Stuti | Wrong options (A1), wrong action (A3), wrong direction (A10) | Tried via "Groups" — wrong direction. Wrong balance | Unable to find and enable people, taps options at top | Unable to find option from "Friends" — task fail | **TASK FAIL** — messed up form, added an expense to settle |
| SU02 Lakshya | Clicked + to create group — wrong section | Added group, calculated manually — TASK FAIL | Limited wrong groups | User wrong way — comment not found | Task Successful |
| SU03 Kritvi | Clicked + to create group | Done successfully | Added expense in wrong group — **TASK FAIL** | Scrolled group section, then selected | **TASK FAIL** — added an expense to settle up |
| SU04 Aviral | Clicked +, wrong direction, wrong function | Wrong class, wrong direction, wrong calc, wrong balance | Wrong selection, wrong group members, wrong method | Task Successful | Wrong method — added to transaction, couldn't settle up |
| SU05 Dia | Done successfully | Done, wrong click, wrong balance | Done successfully | Wrong click, button fail | **ERR** — tried to add + in members search bar |
| SU06 Sakshi | Tried button, nothing. Wrong step | Declined wrong. Added expense without more. Long process | Wrong click → wrong menu → wrong selection → long | Task Successful by accident | "App needs home page" — couldn't settle |
| SU07 Divesh | Wrong step, wrong direction | Wrong steps. TASK FAIL from wrong group | Explored app → wrong steps | Task successful, by accident | Did. "Needs home page mention" |
| SU08 Limesh | Wrong number of members | Shortcut splitting attempt | Multiple filters in SCI | Edited expense — SCI | Add Expense + missing methods for Rs.500 |

---

## HEURISTIC VIOLATIONS (3 found)

1. **Visibility** — App fails to give an overall view for accessing different information. Doesn't show distribution of amount once added in "Add Expense."
2. **Natural Mapping** — Language is friendly, but "you owe" / "you're owed" can be confusing at times.
3. **User Control & Freedom** — App provides a Close button in "Add Expense" to redirect to main page. *(Positive finding.)*

---

## USER QUOTES (verbatim, post-test)

### SU06 (Sakshi):
- *"The app is very useful but a little complex to use."*
- *"I am not sure if I will use this app because I rarely need to split the amount."*
- *"I would like if there are any guidelines or demo to use this app, especially for a new user."*
- *"I would not recommend this app right now because it is complicated."*
- **"The information on the app is difficult to understand, doesn't seem friendly at glance."** ← strong quote

### SU07 (Divesh):
- *"The overall experience of the app seemed complex to use. Not very easy to use."*
- **"The information looks very crowded on the app, not very readable."** ← strong quote
- *"Several features seemed difficult to access."*
- *"The purpose of the application is very exciting for the new user."*
- *"I am very neutral to suggest this app."*

### SU10:
- *"I use this app frequently, and it seems fine to me."*
- *"The information and view could be better. Information is too complexly shown."*
- *"I like how this app helps me to keep track of the expenses without calculations."*
- *"I am most likely to suggest this app to my friends."*

### SU11:
- *"I use it frequently for a specific group and task."*
- *"Connect it to Gpay and also provide the search system for free because that is basic necessity."*
- *"I can keep track of expenses easily even when it is not paid."*
- *"I would like the system is a little less complex."*
- *"It will also be better if I can remind people to pay me back as soon as possible."*
- *"I will most likely suggest people to use it."*

---

## OBSERVER NOTES (during testing)

- *"At first glance they were confused since there was no homepage."*
- *"There was no clear callout for different split methods. Users struggled to find options to split."*
- *"When asked to create a group, most users clicked the bottom + button which was the Add Expense button and then got confused."*
- *"When users got to the split page, they struggled with calculating the expenses before putting the exact number or percentage."*

---

## PAIN POINTS — Stickies (Raghav Samodia, Insights-1.png)

1. Cannot cancel member once selected
2. Can't get suggestions to settle expenses
3. Can't settle a particular transaction
4. Multiple selections made while adding up (error-prone)
5. Not able to find 'create a group'
6. Not able to find name/title easily
7. Unclear who pays whom
8. **Not able to find 'add expense' after opening the app** ← key pain point

---

## SOLUTION IDEAS (from team, Insights.png)

**Raghav Samodia:**
- Merge groups and friends in one section (mental model: messaging apps keep them together)
- Solve confusion between "settle" and "add expense"
- Settle option inside the add expense page

**Dhairya:**
- Clear Add Expense option once inside a group
- Visible + to search bar to add more people during expense entry
- A home page with accessible actions
- Linking payment methods to Settle Up, or putting cash as a payment option

---

## FINAL INFERENCES (from study)

1. **Foundation issues** — especially navigation motion (wrong section errors dominate)
2. **Significance issues** — crowded information, wrong flow sequence
3. **Rollout suggest** — no overall design structure / visual attention errors
4. **Sketching** — users cannot complete certain tasks quickly; time pressure compounds confusion

---

## KEY NUMBERS FOR CASE STUDY

- **Users tested**: 8–11
- **Tasks**: 5
- **Task 3** (Add Expense with split): most TASK FAILs, highest NASA-TLX cognitive load
- **Task 5** (Settle Up): most SHERPA errors total — 5 error types in T5.1 alone (A1, A4, A10, I2, A6)
- **Task 3, Step T3.2.1**: 6 error types in a single step (A10, R1, S2, I2, A3, A7)
- **SHERPA violations confirmed in user testing**: errors in T2, T3, T5 directly observed
- **Heuristic violations**: 3 found
- **Methods used**: HTA, SHERPA, Cognitive Walkthrough, Heuristic Evaluation, NASA-TLX, SUS

⚠️ **Exact NASA-TLX and SUS scores**: visible in `Slide 16_9 - 28.png` but too small to read. Do not invent numbers. Ask Divyansh for a higher-res image if scores are needed.

---

## SPLITWISE IA MAP (summary)

**Bottom Nav**: Activity | Groups | [+] | Friends | Account

**+ button** opens: Add Expense (NOT Create Group — this is the root cause of T1/T2 errors)

**Add Expense split options** (buried): "Paid by you and split equally" as two small tappable chips at the bottom of the form

**Settle Up entry**: Only accessible from inside a specific Friend's page — not from home, not from any primary nav

---

## RESEARCH → SETTLR DECISIONS (quick bridge)

| Problem observed | Settlr fix |
|-----------------|-----------|
| No home screen — users lost from app open | Real dashboard: balance → primary actions → recent groups → activity |
| + button = Add Expense (users expected Create Group) | Group creation in People tab; + FAB = Add Expense (most frequent action) |
| Split method buried as two tiny chips | Dedicated split screen in add expense flow |
| Users had to calculate split amounts manually | Live ₹X/person pill updates in real time on split screen |
| Settle Up buried inside Friends tab | Settle Up as primary home action + contextual from person/group page |
| Friends and Groups as separate tabs | Merged into single People tab (WhatsApp mental model) |
| No review before submitting expense | Review screen added — "final bill" metaphor |

---

## GAPS (things we don't have yet)

- Exact NASA-TLX scores per task (image too small)
- Exact SUS score for Splitwise (image too small)
- SU09 data missing from grid (9 in sequence but not present)
- Higher-res version of `Slide 16_9 - 28.png` needed for scores

---

*Compiled: 2026-04-09 | Sources: KT-handoff.md, research-splitwise.md, project-docs.md*
