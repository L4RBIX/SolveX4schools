# Which written explanations a teacher must actually read

33 `explain` blocks. Written responses persist and a teacher can mark them `reviewed` or `needs_followup` (migrations 0021, 0022), so the question is no longer *can* a teacher read one — it is **must** they.

`expectedPoints` is not the answer to that. Every explain block has them; they are the author's rubric, not proof that reading is required. Classifying on their presence is what produced the earlier claim that all 33 need a teacher.

## Result

| Category | Count |
|---|---|
| **A** `ASSESSMENT_HUMAN_REVIEW_REQUIRED` | **4** |
| **B** `REPAIR_OR_REASONING_REVIEW_REQUIRED` | **0** |
| **C** `REFLECTION_NO_REQUIRED_REVIEW` | **0** |
| **D** `SAMPLE_FOR_TEACHER` | **11** |
| **E** `REDUNDANT_HUMAN_REVIEW` | **18** |
| | **33** |

Nine agents classified a month each; a tenth attacked every A and B verdict, since each costs a class of 18 eighteen reads a month. **It overturned 6 of 10** — two A's fell and all four B's fell. What survived did so for one structural reason.

## The rule that fell out

> A written explanation earns a mandatory read only when it is about **the learner's own program on an unseen problem**, and the month's own «Айлық сынақ» sentence names that explanation as the evidence.

All four survivors meet it. None of the six overturned does.

| Block | Month's check sentence asks for | Why nothing else can settle it |
|---|---|---|
| `m3.as.b2` | «әр функцияның міндетін және параметр мен return байланысын түсіндіру» | The learner's own decomposition. A flat no-`def` program passes `m3.as.b1`'s cases 8/8 — the case set cannot see functions at all. |
| `m6.as.b3` | «салынған ағаш бойынша шақыру ретін түсіндіру» | The call order of the learner's own recursion. Output is identical whatever order they believe in. |
| `m7.as.b3` | «табылған жолдың неге шынымен ең қысқа екенін түсіндіру» | Why *their* number is shortest. This is the month whose check accepted a DFS-depth program for full marks — the case set proving the number is one thing, the learner knowing why is another. |
| `m8.as.b1` | «әр аралық нәтиженің нені білдіретінін сөзбен тұжырымдау» | What `dp[i]` holds, stated **before any code exists**. There is no program to run. |

All four are in a monthly check, all four are on every route, and all four sit in a session where the teacher is already conducting an oral defence. **Zero lesson blocks queue for anybody.**

## Two overturns worth naming

**`m4.as.b2`: A → E.** The month agent's case was that `m4.as.b4` (oral) asks different questions and "never the step counts or the seconds comparison". `m4.as.b4`'s first marking point asks for exactly that — 20 000 000 000 steps at n = 200 000, and whether it fits a second — collected orally from every learner in the same check. December's sentence says «**айтып**», telling, not writing.

**`m1.as.b3`: A → D.** Every other survivor asks something whose answer depends on what the learner wrote. All four of its sub-questions have one fixed answer determined by the problem statement, and three are already measured by mapped diagnostics in `m1.l10`. September's sentence does promise «**жазбаша** түсіндіру», which is why it is D and not E — the promise is real, the block as authored does not discharge it.

## The three workloads — all routes vs core, kept apart

The earlier report mixed them. The figures below never do.

### All routes (the classification itself)

| | |
|---|---|
| `explain` blocks | **33** — A 4, D 11, E 18 |
| `oral_explanation` + `manual_trace` | **15** |

### Core route

An advanced learner sees all 33 written blocks; a core or support learner sees 16, because 17 of the `D` and `E` blocks are `tracks: ["advanced"]`. All 15 oral blocks are on every route.

| | Per learner / year | Per learner / month | Class of 18 / month | Class of 18 / year |
|---|---|---|---|---|
| **MANDATORY WRITTEN** (A) | **4** | 0.44 | **8** | **72** |
| **SAMPLED WRITTEN** (D) | **4** | 0.44 | 8 *if all read* | 72 |
| No obligation (E) | 8 | — | **0** | **0** |
| **ORAL IN CLASS** | **15** | 1.67 | **30** | **270** |

### Resolving the reported inconsistency

> "4 + 4 + 9 = 17 visible on Core, but the workload table used 15 oral interactions and reported 30/class/month."

They count **different block types** and were never in competition. 16 is `explain` blocks on core; 15 is `verify` blocks with mode `oral_explanation` or `manual_trace`. A core learner meets **31 human-touched blocks** in the year: 16 written and 15 spoken.

The 17 became 16 in this pass: `m1.l8.b3` was scoped to `advanced` by the P0 fix, so it no longer reaches a core learner. `4 + 4 + 8 = 16`.

### Workload bands, core

| | 30s | 1m | 2m | 5m |
|---|---|---|---|---|
| Mandatory written, min/month | 4 | **8** | 16 | 40 |
| Mandatory written, h/year | 0.6 | 1.2 | 2.4 | 6.0 |
| Oral, min/month | 15 | **30** | 60 | 150 |
| Oral, h/year | 2.2 | 4.5 | 9.0 | 22.5 |
| **Mandatory total, min/month** | **19** | **38** | **76** | 190 |

Sampled written work adds nothing to these: it is never a queue item. Reading every one anyway would add 8 minutes a month at a minute apiece.

## Arithmetic, checked

```
all routes    A 4 + B 0 + C 0 + D 11 + E 18 = 33   ✓
core-visible  A 4 + D 4 + E  8              = 16   ✓   (17 before the P0 fix)
core oral     15, all routes                = 15   ✓   (a different block type)
core human-touched blocks  16 + 15          = 31   ✓
class of 18   mandatory 4 x 18              = 72 / year, 8 / month   ✓
```

**Correction to the previous report.** It said "17 written responses per learner per month on core, 306 for a class of 18, 10 hours a month". 17 is the year total; per month it is 1.89. 306 is per year. 10.2 hours at two minutes is per year. Inflated ninefold, and it was the figure the conclusion rested on.

## Answer

**Yes — comfortably.** At a minute apiece, one class costs a teacher **38 minutes a month**, of which 30 is oral work inside sessions they are already running. The genuine asynchronous queue is **8 reads a month**, all of them a learner's account of their own program on an unseen problem.

That is a sparse, high-value shape, and it did not come from removing anything. It came from asking of each block: *if nobody ever read this, what would the curriculum fail to know?* For 18 of the 33 the answer is "nothing a graded task has not already established."

## The integration contract

`schools/curriculum/review-policy.ts` exports the frozen classification and one entry point:

```ts
reviewObligationFor(block): ReviewObligation | null
reviewObligations(track): ReviewObligation[]
```

`ReviewObligation` carries three booleans, and the teacher product should read them rather than infer anything from the block type or from `expectedPoints`:

| Field | Meaning |
|---|---|
| `mandatoryQueue` | Put it in the pending queue and count it. **True for exactly 4 blocks.** |
| `sampleEligible` | May appear in analytics or a rotating sample. **Must never increase the mandatory pending count.** True for 11 (4 on core). |
| `oralInClass` | Live exchange. No queue, no sample, nothing to read later. True for 15. |

A block that creates no obligation returns `null` — including every graded task, so a `write_code` can never reach a teacher's queue whatever else changes.

`tests/school/review-policy.test.ts` holds nine assertions, and the load-bearing one is that no obligation is ever both `sampleEligible` and `mandatoryQueue`. Making a sample count as pending takes a class of 18 from 72 mandatory reads a year to 270, and nothing in the product would announce it; the mutation is tested.

### Required of the integrated teacher workstream

1. Read `reviewObligationFor`. Do not classify from block type.
2. `SAMPLE_FOR_TEACHER` must not increment any pending-review counter.
3. `ORAL_IN_CLASS` must not create an async item at all.
4. `REDUNDANT_HUMAN_REVIEW` responses may still be stored and shown on request — they simply oblige nobody.
5. The teacher dashboard is absent or stale in this worktree and was **not modified**. The contract is exposed; the wiring belongs to that workstream.

## The route defect, fixed

`m1.l8.b3` asked «Соңғы есепте неге **екі нұсқаны** да тексеру керек болды?» — why the last problem needed both orientations. The wardrobe, `m1.l8.b2`, is `tracks: ["advanced"]`. `b3` carried no `tracks` at all.

Projection before:

| Route | Blocks |
|---|---|
| support | `m1.l8.b3` — one block, about work it cannot reach |
| core | `m1.l8.b1`, `m1.l8.b3` — asked about two orientations in a day-of-week problem that has none |
| advanced | `b1`, `b2`, `b3` — correct |

`m1.l8` was **the only lesson in the year** projecting fewer than two blocks on any route.

**Root cause.** Every other September lesson that scopes blocks by track pairs them with a support twin — `l2.b3s`, `l5.b3s`, `l6.b3s`, `l7.b4s`. `m1.l8` scoped two blocks and paired neither, and the all-routes `b3` was standing in for the missing support path.

**Fix, in two parts, both restoring the authored convention.**

1. `b3` → `tracks: ["advanced"]`, matching its referent exactly.
2. `m1.l8.b1s` — the support twin the lesson never had. A `write_code` with the reading and printing given, so what remains is the wrap-around itself. Not a widened `b1`: support meets **no `challenge` block in any ordinary lesson all year** — 0 of 19, the rest being May's contests where every route gets the same problems.

Projection after:

| Route | Blocks |
|---|---|
| support | `m1.l8.b1s` |
| core | `m1.l8.b1` |
| advanced | `b1`, `b2`, `b3` |

**Proof.**

| | |
|---|---|
| No route asks about unseen work | A scan of every backward-referring prompt on every route finds none without a preceding task |
| All three routes traverse | 838 assertions green, no dead end, no blank lesson |
| Skill coverage | Support **gained** `arith.remainder`; core and advanced unchanged |
| Task id churn | None. 59 lines added, 0 removed, 0 modified. One new id, `m1.l8.b1s`, following the `<id>s` convention |

## Not decided here

Whether the 11 `D` blocks should surface as a rotating sample, as analytics only, or not at all. That is a product decision about what a teacher's console is for, and the classification exists to let it be made cheaply.

## Per-block

| # | Block | Route | Where | Agent | **Mine** |
|---|---|---|---|---|---|
| 1 | `m1.l6.b4` | all | lesson | E | **E** |
| 2 | `m1.l8.b3` | all | lesson | D | **E** ⬇ |
| 3 | `m1.as.b3` | all | check | A | **D** ⬇ |
| 4 | `m2.l2.b8` | adv | lesson | E | **E** |
| 5 | `m2.l8.b9` | adv | lesson | D | **D** |
| 6 | `m3.l5.b9` | adv | lesson | E | **E** |
| 7 | `m3.l6.b8` | all | lesson | D | **D** |
| 8 | `m3.l7.b8` | adv | lesson | E | **E** |
| 9 | `m3.as.b2` | all | check | A | **A** ✓ |
| 10 | `m4.l2.b8` | adv | lesson | E | **E** |
| 11 | `m4.l6.b9` | adv | lesson | D | **D** |
| 12 | `m4.as.b2` | all | check | A | **E** ⬇⬇ |
| 13 | `m5.l5.b9` | adv | lesson | B | **D** ⬇ |
| 14 | `m5.l7.b9` | adv | lesson | E | **E** |
| 15 | `m6.l3.b10` | adv | lesson | E | **E** |
| 16 | `m6.l4.b10` | adv | lesson | D | **D** |
| 17 | `m6.l5.b9` | adv | lesson | B | **D** ⬇ |
| 18 | `m6.l6.b9` | all | lesson | E | **E** |
| 19 | `m6.as.b3` | all | check | A | **A** ✓ |
| 20 | `m7.l1.b11` | adv | lesson | E | **E** |
| 21 | `m7.l3.b10` | all | lesson | E | **E** |
| 22 | `m7.l4.b10` | adv | lesson | D | **D** |
| 23 | `m7.l5.b10` | all | lesson | E | **E** |
| 24 | `m7.as.b3` | all | check | A | **A** ✓ |
| 25 | `m8.l1.b10` | adv | lesson | E | **E** |
| 26 | `m8.l2.b10` | all | lesson | B | **D** ⬇ |
| 27 | `m8.l4.b11` | adv | lesson | E | **E** |
| 28 | `m8.as.b1` | all | check | A | **A** ✓ |
| 29 | `m9.l1.b5` | all | lesson | E | **E** |
| 30 | `m9.l2.b8` | all | lesson | E | **E** |
| 31 | `m9.l3.b5` | all | lesson | D | **D** |
| 32 | `m9.l4.b4` | all | lesson | E | **E** |
| 33 | `m9.l4.b5` | adv | lesson | B | **D** ⬇ |
