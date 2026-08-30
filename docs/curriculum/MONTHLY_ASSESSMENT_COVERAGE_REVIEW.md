# Monthly assessment coverage review

For every month: what it teaches, what has independent evidence before the check, what the check samples, what the PDF's own «Айлық сынақ» sentence asks for, and what is left out.

**Every omission is classified, and nothing was auto-fixed.** One agent per month, each reading that month's source sentence, its assessment blocks and its lesson content, and each required to justify a classification rather than assert one.

## The three classifications

| | |
|---|---|
| **INTENTIONAL / SOURCE-CONSISTENT** | The PDF's sentence for this month's check names what it contains and this skill is not part of it — or the skill is foundational and the check's own code demonstrably uses it. The second reading had to be shown by extracting constructs from the assessment programs, not asserted. |
| **REQUIRES HUMAN DECISION** | A real coverage question turning on curriculum philosophy: how much a 20-minute check should sample, whether a technique taught in week 3 must be checked in week 4 or may wait. |
| **CLEAR IMPLEMENTATION GAP** | The check demonstrably fails to test something the month's own outcome or the PDF's sentence requires, and fixing it needs no philosophy. |

## Result

| Month | Skills taught | Sampled in its own check | Omitted | Clear gaps | Human decisions |
|---|---|---|---|---|---|
| 1 Қыркүйек | 10 | 6 | 4 | **0** | 1 |
| 2 Қазан | 15 | 7 | 8 | **0** | 1 |
| 3 Қараша | 19 | 7 | 12 | **0** | 1 |
| 4 Желтоқсан | 19 | 7 | 12 | **0** | 1 |
| 5 Қаңтар | 22 | 5 | 17 | **0** | 1 |
| 6 Ақпан | 17 | 6 | 11 | **0** | 4 |
| 7 Наурыз | 19 | 5 | 14 | **0** | 1 |
| 8 Сәуір | 20 | 6 | 14 | **0** | 4 |
| 9 Мамыр | 39 | 20 | 19 | **0** | 1 |

**Zero clear implementation gaps in any of the nine checks.** Each agent was asked to look for one specifically and each reports that it could not make one stand up.

## What the human decisions actually are

They collapse to two questions asked in different months.

**1. May a 20-minute check sample only part of what a month taught?** Five months teach a named technique their own check never touches — prefix sums in December, two pointers in January, exhaustive enumeration in February, depth-first search and route restoration in March. The arithmetic in `ASSESSMENT_TIMING.md` is the constraint: an unseen problem costs 12 of the 20 minutes, so a check holds one technique plus an explanation. Sampling a second means displacing the first.

**2. May a skill be signed off on the support route with no independent evidence at all?** March's `graph.path_restore` is the sharpest case. Exactly one block in the whole programme asks a learner to produce a route from nothing — `m7.l4.b8`, which carries `tracks: ["core","advanced"]`. A support learner gets eight blocks on the skill and not one of them is a program they write. The counterargument is real: substituting scaffolded work for independent work is what the support route is *for*. The question is whether "differentiated" may mean "never demonstrates it once".

Neither is a defect anybody can fix without deciding what a monthly check is for. Both are on the release register.

## One thing that was fixed

Eight lessons declared a skill that no block inside them carries:

| Lesson | Declares, uncarried |
|---|---|
| `m1.l3` | `arith.basic` |
| `m3.l9` | `scope.local_global`, `loops.for` |
| `m4.l8` | `func.define` |
| `m7.l6` | `graph.dfs`, `graph.path_restore` |
| `m8.l6` | `sort.basic` |
| `m9.c1` | `contest.time_split`, `contest.verdict_reading` |
| `m9.c2` | `contest.time_split`, `contest.verdict_reading` |
| `m9.c4` | `contest.upsolving`, `contest.time_split` |

Nothing derives coverage from the lesson-level list, so no reported figure was inflated. What it does is mislead a reader — `m7.l6` advertises route restoration that none of its ten blocks carries, and that is what led one audit to call it a coverage gap.

`npm run curriculum:validate` now warns on each. A **warning** rather than an error, because the two declarations answer different questions and are allowed to differ: a block's `skillRefs` says what the learner is graded on, a lesson's says what the lesson is about, and May's contest lessons legitimately declare `contest.time_split` — splitting your time is what a contest *is* — while no single problem inside grades it. Which of the eight to trim is an editorial call, now visible instead of silent.

## A correction this review forced

September's check was cut from 30 minutes to 26 earlier in this pass by removing two of the four sub-questions in `m1.as.b3`. The coverage audit read the comment above that block, which quotes PDF p.7 verbatim and names four things: why an integer or fractional type was chosen, and where division, the condition boundary, or very large numbers give a wrong result. The four questions were those four things. Two of them are source-named requirements and the cut removed them — and `m1.as.b3` is the only block in any assessment all year declaring `types.int_float`.

Reverted. September stands at 30 against a source-stated 20, which is the largest overrun in the year and cannot be reduced by removing anything the source asks for.
