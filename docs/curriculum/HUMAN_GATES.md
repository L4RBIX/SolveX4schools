# Human gates

Nine things this workstream cannot certify. Each is written so a person can act on it without reading the rest of the repository.

Nothing below is marked done. A gate closes when the named person signs it.

---

## 1. Native Kazakh quality — BLOCKING

1768 learner-facing string pairs, every one written by an AI agent, none read by a native speaker. Four mechanical signals compare the two languages and report three things to look at; that establishes the pairing is sound and nothing about whether the Kazakh is Kazakh a fourteen-year-old reads.

**Package:** `l10n/KK_NATIVE_REVIEW.md`, prioritised by what it costs to get wrong. **Sign-off table is at the end of it and is empty.**

**Sharpest risk:** boundary language. «кемінде», «аспайды», «кем емес» — a great many tasks are graded on exactly the boundary those words state, so a wrong one makes the hidden cases wrong rather than the sentence awkward.

## 2. Native Russian quality — BLOCKING

As above. `l10n/RU_NATIVE_REVIEW.md`. The Russian is the parallel route, not a gloss: where it is thinner than the Kazakh that is a defect in the Russian, and no signal catches it.

## 3. Learner timing — BLOCKING for the workload claim

Nobody has timed a learner. Under the expected estimates every month fits its 510-minute budget except May; under the slow ones none do, and October runs out when a learner is 8% of the way from average toward slow.

September's monthly check is the specific case: PDF p.7 states twenty minutes and then names four written sub-questions plus two graded programs, which price at 30. Either the estimates are too pessimistic or the source's own check does not fit the source's own clock.

**What settles it:** one timed session, real Grade 9 learners, one month. `FULL_YEAR_WORKLOAD.md`, `ASSESSMENT_TIMING.md`.

## 4. What a monthly check is for — BLOCKING for two open findings

Two questions, asked in different months, that no amount of analysis resolves:

- **May a 20-minute check sample only part of what a month taught?** An unseen problem costs 12 of the 20, so a check holds one technique plus an explanation. Five months teach a named technique their own check never touches.
- **May a skill be signed off on the support route with no independent evidence at all?** Exactly one block in the programme asks a learner to produce a route from nothing — `m7.l4.b8`, `tracks: ["core","advanced"]`. A support learner meets `graph.path_restore` in eight blocks and writes none of them.

`MONTHLY_ASSESSMENT_COVERAGE_REVIEW.md`.

## 5. A wrong answer is a dead end — BLOCKING, and the largest open defect

`footerMode` returns `retry` for a wrong answer; the retry arm binds Get help and Try again and no forward control, and the top bar's forward arrow is hardcoded off. Code tasks are never revealed, by design.

Measured: **219 of 222 lesson/route pairs** contain a required code task where a wrong answer leaves the learner with no way forward.

The completion policy disagrees with the interface. `levelFromVerdict("wrong")` is `measured`, `attemptFloor` is `attempted`, so the policy considers the block **satisfied** — and `completion.ts`'s own docstring says gating on correctness would leave "a fourteen-year-old who struggles permanently locked out of the next lesson by the lesson they most needed".

Not fixed here. Whether a learner may move on after failing is a pedagogical decision about the core lesson loop of every lesson in the product, and it predates this branch.

## 6. A hundred blocks graded by the learner's own browser — needs a decision

`isIndependent` counts 209 blocks as whole programs written from nothing. `surfaceForBlock` puts 109 on an evidence surface; the other **100 sit on `lesson_guided`**, where `requiredCheckTrust: "client_local"` means a Pyodide pass in the learner's own browser settles the block. `m1.l1.b5`, `m1.l2.b3`, `m1.l3.b4` among them.

Two different questions — evidence versus integrity — and they are allowed to differ. The comment claiming they were the same has been corrected. **What needs deciding is whether a school can defend "independent evidence" that a browser reported.** Widening the boundary means a trusted provider for a hundred ordinary lesson tasks.

## 7. Eight lessons advertising coverage they lack — editorial

Eight lessons declare a skill no block inside them carries. The validator warns on each. Nothing derives coverage from the lesson-level list, so no figure is inflated — it misleads a reader, and it misled an audit into calling `m7.l6` a coverage gap.

Whether to trim each declaration or author the missing block is an editorial call. `MONTHLY_ASSESSMENT_COVERAGE_REVIEW.md`.

## 8. September's two redundant tasks — editorial

`m1.p2` and `m1.p4`, both with correctly named earlier siblings. Not moved: September is the only month a human has audited and accepted, and it is the baseline the relative-density reading rests on. Leaving it uncut makes every other month look lighter than it is, so the bias errs toward pruning **less** elsewhere. `FULL_YEAR_REDUNDANCY_AUDIT.md`.

## 9. Curriculum owner approval — BLOCKING

Nobody has signed off that this implements the programme. Every claim of source fidelity in this repository rests on comments citing PDF pages, and **the PDF is not in the repository**. One of those citations was checked against its own block during this pass and had already drifted — the check has since been reverted to match it.

A person with the PDF should read p.2 (year-end outcomes), p.3 (task types), p.5 (the time budget), p.6 (the five verification methods), p.7–p.10 (the monthly paragraphs) and p.11 (the year totals) against `schools/curriculum/source-of-truth.ts`, which is where those figures live as data.

---

## Sign-off

| Gate | Owner | Blocking | Signed | Date |
|---|---|---|---|---|
| 1 Kazakh | | yes | | |
| 2 Russian | | yes | | |
| 3 Timing | | yes | | |
| 4 Check philosophy | | yes | | |
| 5 Wrong-answer dead end | | yes | | |
| 6 Execution trust | | no | | |
| 7 Lesson declarations | | no | | |
| 8 September redundancy | | no | | |
| 9 Curriculum owner | | yes | | |

Six blocking. **This curriculum must not be described as reviewed, validated or ready for learners until the blocking rows are signed.**
