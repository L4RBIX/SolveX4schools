# Teacher command centre — information hierarchy audit

Walked through every route in a browser against the seeded 20-learner class
(`pilot-school` / `grade-9a`, Postgres). BEFORE frames at 1440/1280/1024/768 are
in `docs/teacher/screenshots/before/`.

The analytics are not in question. What follows is about what the eye reaches
first, and in what order.

---

## 0. What is wrong globally

Five faults, all of them presentational, all of them repeated on every route.

**F1 — The chrome is 250px tall and identical everywhere.**
Eyebrow («МҰҒАЛІМ КАБИНЕТІ») → 32px class name → month chip → publication chip →
a period row → a freshness sentence → a tab row. Seven stacked bands before a
single fact about a child. On a 768px viewport that is a third of the screen,
spent re-stating what the teacher already knew when they clicked.

**F2 — The development banner is the loudest object on the page.**
A full-bleed amber strip with 13px medium text. It outranks the attention queue.
It is a note to whoever is running the dev server, rendered at the same weight as
"this child has not logged in for three weeks".

**F3 — ALL CAPS is the default, not the exception.**
`b-eyebrow` is on every metric label, every section sub-heading, every
recommendation prefix. `НЕ ІСТЕУГЕ БОЛАДЫ`, `ОҚУШЫ`, `КЕЗЕҢДЕ БЕЛСЕНДІ`,
`ЖАУАПТА БОЛУЫ ТИІС`. Caps at 12px in Cyrillic — with Kazakh's ә ғ қ ң ө ұ ү һ і
— is slower to read than sentence case, and when everything shouts, the
hierarchy is flat.

**F4 — Secondary ink is too faint.**
`text-b-fg/40`, `/45`, `/50` carry real content: window labels, denominators,
"last active", the counts under a share. On the light theme `/40` on
`#f5f3f1` is roughly 2.6:1 — under the 4.5:1 floor for the text it is being used
for.

**F5 — Every section opens with two sentences of prose.**
Honest, and correct to have written. Wrong to render on every visit forever. A
teacher who has read "not started means absence of measurement, not a poor
result" once does not need 50px of it every morning.

---

## 1. `/teacher` — Overview

**Primary question:** *What needs my attention before class?*

**Secondary:** Is the class improving? Which concept is weakest? Did anyone sit
the check? Who is ready for more?

| | |
|---|---|
| **Too prominent** | Eight identical stat tiles in two rows of four — a KPI wall that answers no question a teacher actually asks first. `ОҚУШЫ 20` is the least useful number on the screen and it is in position one. |
| | The per-row recommendation box: a full-width tinted panel inside every attention row. Five rows of it reads as a stack of incident logs. |
| **Too hidden** | The attention queue itself starts ~700px down at 1280. It is the reason the page exists. |
| | «Дәлелін көру» — the evidence affordance — is a small link at the bottom of one row. It is the product's whole integrity claim. |
| **Collapse** | The two-sentence section descriptions. The trend comparison strip's four labels. |
| **Tooltip / disclosure** | "How the attention queue is ordered". The window semantics on each metric. |
| **Verdict** | Invert. Situation line → attention → trend → patterns → metrics rail last. |

## 2. `/teacher/students` — Roster

**Primary question:** *Where is each learner, and who is stuck?*

| | |
|---|---|
| **Too prominent** | Eleven columns at equal weight. Attempts, practice minutes, days and help all compete with status and current topic. |
| | Six filter chips rendered identically to each other and to the search field. |
| **Too hidden** | The findings under a learner's name — the *why* — are one muted line at 13px `/50`. |
| **Collapse** | Attempts / practice / days / help into an expandable row. They are drill-down facts, not scan facts. |
| **Verdict** | Six primary columns. Secondary data on row expand. Filters become one quiet segmented row with counts. |

## 3. `/teacher/students/[subjectId]` — Student detail

**Primary question:** *What is going on with this child, and what do I do?*

| | |
|---|---|
| **Too prominent** | Nine sections of equal visual weight, each with its own heading and description. It reads as a report to be filed, not a briefing to be acted on. |
| **Too hidden** | The single most important fact — the main issue and the main positive — is buried in section two among the rest. |
| **Collapse** | The windowed/cumulative explanation (correct, essential, and needed once). |
| **Verdict** | Lead with a two-column *needs attention / going well* summary directly under the name. Everything else keeps its order and drops in weight. |

## 4. `/teacher/skills` — Skills

**Primary question:** *Which concept is the class weakest on?*

| | |
|---|---|
| **Too prominent** | The class × skill matrix is the default view, and its column headers are twenty full names rotated 90°. At 768 the header alone is 132px of vertical text. It is analytical tooling shown to someone who asked a one-line question. |
| **Too hidden** | The per-skill distribution — the thing that actually answers the primary question — is below the matrix. |
| **Verdict** | Swap the default. Skills as rows with a distribution bar; matrix demoted to a second tab for deep analysis, with initials in the header and full names on hover. |

## 5. `/teacher/lessons` — Lessons

**Primary question:** *Which lesson is causing trouble — the learners or the content?*

| | |
|---|---|
| **Too prominent** | Eight numeric columns at equal weight. Nothing says which lesson is the problem. |
| **Too hidden** | Completion *rate*: the reader has to divide 0/5 in their head, per row. |
| **Collapse** | Block-level analytics into the existing expand. |
| **Verdict** | A completion bar per row does the arithmetic. Small-sample rows say so rather than implying a verdict. |

## 6. `/teacher/assessments` — Assessment

**Primary question:** *Did the class sit the check, and what happened?*

| | |
|---|---|
| **Broken** | The learner table forces a 1290px minimum and escapes its scroll region at 1280 and below. |
| **Too prominent** | The status distribution is a full-width 4px bar with four labels beneath — precise, and unreadable at a glance. |
| **Too hidden** | `unmeasuredCoding` and `unreadableResponses` — the two honest limits — sit in body text below the fold. |
| **Verdict** | Distribution becomes a compact four-row count list. Per-block columns collapse into one status strip per learner. The human-review limitation becomes a stated product boundary, not a warning panel. |

## 7. `/teacher/leaderboard` — Leaderboard

**Primary question:** *Who is doing well, on a basis I can defend to a parent?*

| | |
|---|---|
| **Too prominent** | The formula panel: a large tinted box above the table, read once and then in the way forever. |
| **Too hidden** | Rank 1 is styled identically to rank 12. |
| **Verdict** | Formula moves into a "How ranking works" disclosure. Top three get typographic weight — not medals. |

---

## The design response

**Direction: a briefing, not a report.** The teacher has three minutes. A
briefing opens with the situation and the names; a report opens with its methodology.
The old page was a report.

Concretely:

1. **One control bar.** Class · month · publication · period · language on a
   single line, ~64px, with the tabs beneath it. Saves ~150px on every route.
2. **The dev banner becomes a chip** in that bar, in the dev build only.
3. **Sentence case.** Caps survive only on a 11px metadata label, and only where
   a number needs naming.
4. **Contrast floor.** Secondary ink `/70`, tertiary `/55`. Nothing carrying
   content below `/55`.
5. **The attention row gets a spine** — a 2px vertical rule in the status tone —
   instead of a card with a tinted box inside it. Name and status on one line,
   the reason in body ink, context as metadata, and the recommendation as one
   indented line after a `→`. This is the signature element.
6. **Explanations move into a `Hint` disclosure** — a small "?" that opens the
   sentence. The caveats that change how a number is *read* stay visible.
7. **Metrics become a rail, not a wall**: four headline figures, then a thin
   secondary line. Numbers get weight; labels lose it.
8. **One chart** — the class trend, already present, kept and made calmer.

**Not doing:** severity tiers on attention. `LearnerStatus` has one attention
state and inventing HIGH/MEDIUM/LOW would be a severity the data does not
support. The queue's *order* already encodes priority via `FINDING_WEIGHT`, and
that ordering is real.
