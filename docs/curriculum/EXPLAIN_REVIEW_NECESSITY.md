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

## The three workloads, core route

Kept separate as asked. `A` is the only mandatory async queue.

### 1. MANDATORY WRITTEN REVIEW

| | |
|---|---|
| Per learner / year | **4** |
| Per learner / month | **0.44** |
| Class of 18 / month | **8** |
| Class of 18 / year | **72** |

| | 30s | 1m | 2m | 5m |
|---|---|---|---|---|
| min / month | 4 | 8 | 16 | 40 |
| h / year | 0.6 | 1.2 | 2.4 | 6.0 |

### 2. OPTIONAL / SAMPLED WRITTEN EVIDENCE

11 blocks across all routes; **4 of them reach a core learner**. Never a queue item — analytics, or a rotating sample.

| | |
|---|---|
| Per learner / year | **4** |
| Class of 18 / month | **8** if every one were read |
| Class of 18 / year | **72** |

Same bands as above: 4 / 8 / 16 / 40 minutes a month. Sampling a third takes it to 3 / 5 minutes.

### 3. ORAL IN CLASS

Unchanged from the earlier audit and reported separately because it is not a dashboard job at all.

| | |
|---|---|
| Per learner / year | **15** |
| Class of 18 / month | **30** |
| Class of 18 / year | **270** |

| | 30s | 1m | 2m | 5m |
|---|---|---|---|---|
| min / month | 15 | 30 | 60 | 150 |
| h / year | 2.2 | 4.5 | 9.0 | 22.5 |

14 of a learner's 15 happen inside a monthly check.

### Mandatory total — A plus oral

| | 30s | 1m | 2m | 5m |
|---|---|---|---|---|
| min / month | **19** | **38** | **76** | 190 |
| h / year | 2.9 | 5.7 | 11.4 | 28.5 |

## Arithmetic, checked

```
all routes    A 4 + B 0 + C 0 + D 11 + E 18 = 33   ✓
core-visible  A 4 + D 4 + E 9               = 17   ✓
```

**Correction to the previous report.** It said "17 written responses per learner per month on core, 306 for a class of 18, 10 hours a month". 17 is the year total; per month it is 1.89. 306 is per year. 10.2 hours at two minutes is per year. Inflated ninefold, and it was the figure the conclusion rested on.

## Answer

**Yes — comfortably.** At a minute apiece, one class costs a teacher **38 minutes a month**, of which 30 is oral work inside sessions they are already running. The genuine asynchronous queue is **8 reads a month**, all of them a learner's account of their own program on an unseen problem.

That is a sparse, high-value shape, and it did not come from removing anything. It came from asking of each block: *if nobody ever read this, what would the curriculum fail to know?* For 18 of the 33 the answer is "nothing a graded task has not already established."

## A defect found on the way

`m1.l8.b3` has no `tracks` field, so it renders on all three routes. The problem it asks about — `m1.l8.b2`, the wardrobe — is `tracks: ["advanced"]`, and `m1.l8.b1` is `["core","advanced"]`.

- A **core** learner is asked to explain a problem they were never shown.
- A **support** learner opens lesson `m1.l8` and finds it contains nothing but this explain block.

Verified in `month-01-september.ts`. Not fixed — content is frozen pending this report — and it would matter far more if the block were mandatory, which it is not.

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
