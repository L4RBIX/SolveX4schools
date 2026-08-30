# Execution classification

What happens when a learner presses Check, for all **587** graded tasks from September to May.

Every category below is read off the code that settles the block — `schools/learning/checking.ts` for the deterministic path, `src/app/api/learning/submit/route.ts:278` for the executed one — not inferred from whether the answer happens to be a program. An earlier version of this document inferred it, and put 263 machine-graded tasks in a bucket named after a human.

**No execution infrastructure was modified.** No provider, no environment, no `provider.ts`.

## The five categories

| | Settled by | Count |
|---|---|---|
| **1** `DETERMINISTIC_AUTO_GRADED` | `checkBlock` compares against a declared answer. No execution, no provider, no teacher. | **263** |
| **2** `SERVER_CODE_JUDGED` | The submit route runs the block's cases through the trusted provider. | **262** |
| **3** `HUMAN_REVIEW_REQUIRED` | `checkBlock` returns `unknown` unconditionally and the block carries `expectedPoints`; nothing but a teacher can turn it into evidence. | **48** |
| **4** `OPTIONAL_HUMAN_INTERACTION` | — | **0** |
| **5** `SPECIAL_UNMEASURED` | Settles `correct` or `unknown`, never `wrong`. | **14** |
| | | **587** |

### Why category 4 is empty

Not an oversight. A block is either settled by a machine, or it declares `expectedPoints` for a teacher to mark against, or it is `test_case`. There is no authored type where a teacher's involvement is available-but-unnecessary — help exists in this product as Nova's hint ladder and the reveal, which are properties of any block rather than a class of them. Reporting 0 rather than moving something in is the honest result.

### The correction to 261

**262, not 261.** The predicate that produced 261 listed the `verify` modes expected to be executable — `unseen_problem`, `delayed_resolve` — instead of asking what the submit route asks, which is whether the block has cases at all. `m1.as.b2` is `verify:find_bug` with six cases and a fixed program, and the route runs it. The route's own comment says as much: *"the modes that no machine should score have no `cases` and fall through this branch untouched."*

The proven result stands and grows by one: **262/262 have cases, a reference or fixed solution, and a usable checker** — 230 `token`, 31 `exact`, 1 `numeric`.

## Per month

| Month | 1 Deterministic | 2 Server-judged | 3 Human | 4 Optional | 5 Special | Total |
|---|---|---|---|---|---|---|
| 1 Қыркүйек | 17 | 31 | 4 | 0 | 2 | 54 |
| 2 Қазан | 42 | 37 | 4 | 0 | 2 | 85 |
| 3 Қараша | 38 | 30 | 5 | 0 | 1 | 74 |
| 4 Желтоқсан | 30 | 32 | 4 | 0 | 1 | 67 |
| 5 Қаңтар | 38 | 28 | 4 | 0 | 2 | 72 |
| 6 Ақпан | 32 | 26 | 7 | 0 | 1 | 66 |
| 7 Наурыз | 29 | 23 | 7 | 0 | 1 | 60 |
| 8 Сәуір | 24 | 23 | 5 | 0 | 3 | 55 |
| 9 Мамыр | 13 | 32 | 8 | 0 | 1 | 54 |
| **Year** | **263** | **262** | **48** | **0** | **14** | **587** |

Union of the three routes. One learner sees fewer — see the teacher load below.

## The 48 that need a teacher

28 in lessons, 20 in monthly checks.

| Month | Block | Type | Where |
|---|---|---|---|
| 1 | `m1.l6.b4` | explain | m1.l6 |
| 1 | `m1.l8.b3` | explain | m1.l8 |
| 1 | `m1.as.b3` | explain | **monthly check** |
| 1 | `m1.as.b4` | verify:oral_explanation | **monthly check** |
| 2 | `m2.l2.b8` | explain | m2.l2 |
| 2 | `m2.l8.b9` | explain | m2.l8 |
| 2 | `m2.as.b1` | verify:manual_trace | **monthly check** |
| 2 | `m2.as.b4` | verify:oral_explanation | **monthly check** |
| 3 | `m3.l5.b9` | explain | m3.l5 |
| 3 | `m3.l6.b8` | explain | m3.l6 |
| 3 | `m3.l7.b8` | explain | m3.l7 |
| 3 | `m3.as.b2` | explain | **monthly check** |
| 3 | `m3.as.b4` | verify:oral_explanation | **monthly check** |
| 4 | `m4.l2.b8` | explain | m4.l2 |
| 4 | `m4.l6.b9` | explain | m4.l6 |
| 4 | `m4.as.b2` | explain | **monthly check** |
| 4 | `m4.as.b4` | verify:oral_explanation | **monthly check** |
| 5 | `m5.l7.b9` | explain | m5.l7 |
| 5 | `m5.l5.b9` | explain | m5.l5 |
| 5 | `m5.as.b3` | verify:manual_trace | **monthly check** |
| 5 | `m5.as.b4` | verify:oral_explanation | **monthly check** |
| 6 | `m6.l3.b10` | explain | m6.l3 |
| 6 | `m6.l4.b10` | explain | m6.l4 |
| 6 | `m6.l6.b9` | explain | m6.l6 |
| 6 | `m6.l5.b9` | explain | m6.l5 |
| 6 | `m6.as.b2` | verify:manual_trace | **monthly check** |
| 6 | `m6.as.b3` | explain | **monthly check** |
| 6 | `m6.as.b4` | verify:oral_explanation | **monthly check** |
| 7 | `m7.l1.b11` | explain | m7.l1 |
| 7 | `m7.l5.b10` | explain | m7.l5 |
| 7 | `m7.l3.b10` | explain | m7.l3 |
| 7 | `m7.l4.b10` | explain | m7.l4 |
| 7 | `m7.as.b2` | verify:manual_trace | **monthly check** |
| 7 | `m7.as.b3` | explain | **monthly check** |
| 7 | `m7.as.b4` | verify:oral_explanation | **monthly check** |
| 8 | `m8.l1.b10` | explain | m8.l1 |
| 8 | `m8.l2.b10` | explain | m8.l2 |
| 8 | `m8.l4.b11` | explain | m8.l4 |
| 8 | `m8.as.b1` | explain | **monthly check** |
| 8 | `m8.as.b4` | verify:oral_explanation | **monthly check** |
| 9 | `m9.l1.b5` | explain | m9.l1 |
| 9 | `m9.l2.b8` | explain | m9.l2 |
| 9 | `m9.l3.b5` | explain | m9.l3 |
| 9 | `m9.l4.b4` | explain | m9.l4 |
| 9 | `m9.l4.b5` | explain | m9.l4 |
| 9 | `m9.l4.b7` | verify:oral_explanation | m9.l4 |
| 9 | `m9.as.b6` | verify:oral_explanation | **monthly check** |
| 9 | `m9.as.b7` | verify:oral_explanation | **monthly check** |

## What this costs a teacher

Mandatory human reviews, per learner, per month — these are blocks the learner cannot have graded any other way.

| Month | Support | Core | Advanced |
|---|---|---|---|
| 1 Қыркүйек | 4 | 4 | 4 |
| 2 Қазан | 2 | 2 | 4 |
| 3 Қараша | 3 | 3 | 5 |
| 4 Желтоқсан | 2 | 2 | 4 |
| 5 Қаңтар | 2 | 2 | 4 |
| 6 Ақпан | 4 | 4 | 7 |
| 7 Наурыз | 5 | 5 | 7 |
| 8 Сәуір | 3 | 3 | 5 |
| 9 Мамыр | 7 | 7 | 8 |
| **Year** | **32** | **32** | **48** |

### A class of 18

Taking the core route, which is where most of a class sits:

| | |
|---|---|
| Per learner, per month | **2 to 7**, mean 3.6 |
| **Class of 18, per month** | **36 to 126**, mean **64** |
| **Class of 18, per year** | **576** |
| If the whole class took the advanced route | 864 a year |

Two of those per learner per month are the monthly check's own written and oral parts, which a teacher was always going to sit with. The rest are the `explain` blocks inside lessons — 28 across the year, one or two a month, each carrying `expectedPoints` for the teacher to mark against.

64 pieces of prose and speech a month for one class is a real number and it is not a small one. It is also the programme's own design: PDF p.6 names oral explanation as one of five verification methods, and «жазбаша түсіндіру» is what September's own assessment sentence asks for. Nothing here can be automated without deleting the thing being measured.

## Audit A — 15 optional tasks on the independent-evidence surface

`surfaceForBlock` routes any `mN.pK` id to `independent_evidence` on a positional rule. Fifteen of those ids carry `bank`, meaning a learner may skip them:

`m2.l8.b8`, `m2.p1`, `m2.p3`, `m2.p5`, `m2.p7`, `m2.p8`, `m2.p9`, `m2.p10`, `m3.p3`, `m3.p4`, `m3.p6`, `m3.p8`, `m4.p9`, `m7.p1`, `m7.p10`

### What completing one actually does — traced

| Consumer | Does bank membership reach it? | Effect |
|---|---|---|
| **LearnerState independence** | **No.** `independenceWeight` is computed from `maxAssistance` and `solutionRevealed` in `episode.ts:361`. It has never seen a block id. | A completed bank task yields `independence_weight: 1` exactly like a required one. |
| **Skill credit / mastery** | **No.** `submit/route.ts:324` credits `codeBlock.skillRefs` on an accepted verdict, with no reference to `bank`. | Its skills are credited in full. |
| **Required curriculum evidence** | **Yes — this is the one place it is correct.** `requirementFor` exempts it, `blocksForTrack`/`publicLesson` mark it `optional`, and `skill-matrix.ts` counts core independent evidence with `isRequired`. | Completion does not depend on it, and no report counts it as required-path evidence. |
| **Teacher analytics** | **No.** `classroom.ts` and `evidence.ts` contain no reference to `bank`. | Bank work appears as ordinary work. |
| **Leaderboard** | **N/A.** There is no leaderboard in this product. | — |

### Is it semantically correct?

**Partly, and the incorrect part is narrow.**

Correct: completion, and every curriculum report. A learner who skips all 18 bank tasks completes every lesson, and no document counts their skipped work as required-path evidence.

Incorrect: the Learning Intelligence side treats a bank solve as identical to a required one. So a learner who does only bank tasks accumulates `independence_weight: 1` episodes and full skill credit for work the required path never asked for — and the teacher's console shows unaided solves that the curriculum considers optional.

This is not a leak of trust: the verdict is a real server verdict about a real program the learner really wrote. It is a **category error**: the reducer measures *how* the learner solved it, and nothing tells it *whether the curriculum required it*.

Whether to teach the evidence model about `bank` is an execution/LI decision, not a curriculum one. Two ways it could go, and they are genuinely different products:

1. **Bank work is evidence.** A learner who solves an optional problem unaided demonstrated exactly what the skill model measures, and the curriculum's opinion about who *had* to do it is beside the point.
2. **Bank work is practice.** The programme's «~100 толық дербес шешім» is a promise about a required path, and evidence drawn from optional work inflates it.

The reporting scripts already chose (2). The evidence model has never been asked.

## Audit B — `capabilityFor(client_local).checkProducesEvidence === true`

### Can it report the system ready with no trusted judge? — No.

Traced through both consumers with `trustedProviderConfigured: false`:

| | |
|---|---|
| `releaseCapability` mode | **`LOCAL_PILOT`**, never `HYBRID_PRODUCTION` |
| `trustedJudge` | **`false`** |
| Summary | "No trusted judge is configured…" |
| `ops/health.ts` | pushes a problem: "EXEC_PROVIDER=none: there is no trusted judge, so Submit produces no evidence" |
| `submitProducesEvidence` | `false` — asked of `independent_evidence`, which is `server_verified` |

**Not a release blocker.** Nothing reports ready, and the one headline number an operator reads — `submitProducesEvidence` — is correct.

### What it does get wrong

`surfacesWithoutEvidence` is computed from `checkProducesEvidence`, which returns `true` for any `client_local` surface regardless of the provider. So with no judge it reports:

> "**4 of 6** surfaces produce no evidence"

when the truth is 6 of 6. A code task on `lesson_guided` produces no verdict without a provider: the submit route leaves it `unknown` and `toLearningVerdictName("unknown")` returns `null`, so no `verdict_received` is emitted at all. **138 program tasks on `lesson_guided` are covered by that understatement.**

**Flagged, not fixed.** The fix is one condition in `capabilityFor` — a `client_local` surface produces evidence only for blocks that need no execution — and `trust-policy.ts` is execution infrastructure that the Judge0 workstream is actively changing. Two branches editing the same function is how a correct fix becomes a merge conflict nobody reads.

**For whoever owns execution:** `capabilityFor` conflates "this surface tolerates a local run" with "a Check here produces evidence". They coincide for the 263 deterministic tasks and diverge for the 138 code tasks on the same surface. The honest signal needs the block, not just the surface.
