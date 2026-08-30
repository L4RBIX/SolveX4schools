# Execution classification

What *should* happen when a learner presses Check, for every graded task from September to May.

Derived from curriculum intent — block type, assessment role, independence role, bank membership — and deliberately **not** from `surfaceForBlock`, so that the shipped implementation can be found disagreeing with the pedagogy rather than defining it. Regenerate with `npx tsx scripts/execution-classification.ts --markdown`.

**No execution infrastructure was modified.** No provider, no environment, no `provider.ts`. This document classifies; it changes nothing about how anything runs.

## The four classes

| | |
|---|---|
| **A** `LOCAL_PRACTICE_ONLY` | Pyodide may give immediate feedback. The result must not create trusted mastery or independence evidence. |
| **B** `SERVER_VERIFIED_PROGRESS` | Must reach the trusted server judge before it can create trusted Learning Intelligence evidence. |
| **C** `SERVER_VERIFIED_ASSESSMENT` | Always the trusted judge. A browser-local pass is never assessment evidence. |
| **D** `NO_JUDGE` | Not a runnable program-verdict task. Never sent to a judge — which is **not** the same as read by a human. |

## Counts

Across all three routes — the union, not one learner's path.

| Class | Count |
|---|---|
| A LOCAL_PRACTICE_ONLY | **18** |
| B SERVER_VERIFIED_PROGRESS | **210** |
| C SERVER_VERIFIED_ASSESSMENT | **33** |
| D NO_JUDGE | **326** |
| **Total graded tasks** | **587** |

**261 are program tasks** (A + B + C). All 261 have cases, all 261 have a reference or fixed solution, and all 261 resolve through the canonical submission contract.

## The critical question, traced

> For the 138 `lesson_guided` program tasks, does client-local correctness only drive immediate UI, or does it enter LearnerState / mastery / independence / teacher analytics as trusted evidence?

**Answer: (1). It only drives immediate UI. NOT A RELEASE BLOCKER.**

I said the opposite earlier in this session — that for 138 of 261 tasks "the judge is the learner's browser". That was wrong. It was read off the *names* in `trust-policy.ts` rather than off the path a Check actually takes, and the path refuses a browser verdict at five independent layers.

### The trace, layer by layer

**1. The player always submits.** `school-lesson.tsx`'s `check()` calls `onSubmit` for every attempt block. There is no branch on surface or trust — `trustedProviderConfigured` reaches only the Run panel, where it changes what the learner is *told*, not whether Check posts.

**2. The submit route grades server-side, always.** `src/app/api/learning/submit/route.ts:290` fetches the provider and runs the block's own cases with the block's own checker. The Pyodide result is never read. The comment on that branch is the design in one sentence:

> There is a perfectly good Python result sitting in the learner's browser and it is NOT consulted here, because the browser is the party being assessed. A local pass is feedback; it is not a grade, and the one line of code that would make it one is the line this branch exists to not write.

With no provider: `noTrustedJudge = true`, the verdict stays `unknown`, and `toLearningVerdictName("unknown")` returns `null` — so **no `verdict_received` event is emitted at all.** Nothing is invented.

**3. Ingest cannot carry a verdict.** `src/app/api/learning/events/route.ts` stamps `sourceTrust: "browser"` server-side, never from the body, and `isClientReportable` refuses `verdict_received`, `failure_attributed`, `code_diff_classified`, `assistance_requested` and `assistance_delivered` outright. A browser may report that it opened an episode, went idle or pressed Run — context it is the rightful author of.

**4. The reducer discards an untrusted verdict.** `packages/learning-intelligence-core/src/episode.ts` — `isTrustedOutcome` admits only `judge`, `verifier`, `server`, and the `verdict_received` case breaks before recording anything:

> An untrusted verdict is not a weaker verdict; it is not a verdict.

Since `verdicts` is what makes an episode `accepted`, an untrusted row cannot produce an accepted episode, an `independence_weight` of 1, or an unaided solve in the teacher's console.

**5. The store filters again at the point of use.** `blockAttempts`'s `accepted` predicate requires `source_trust = 'judge'` — deliberately a second time, because rows forged before layer 3 existed may sit in a pilot database, and a filter at the point of USE survives someone adding a third write path.

Layer 4's own doc comment records that this was once a real bug: a forged `verdict_received` became an accepted episode and a unaided solve. It was found and fixed before this workstream started. The defence is now five deep.

### What `client_local` actually means

Not "the browser settles it". `trustSatisfies`, `policyFor` and `capabilityFor` are consumed by exactly three places — `presentation/labels.ts`, `execution/release-mode.ts` and `ops/health.ts`. **The trust policy is a reporting and messaging subsystem. It is not in the grading path at all.** Enforcement lives in the four layers above.

## How each graded task is actually checked

`NO_JUDGE` is not `HUMAN_REVIEW`, and the first version of this document called it that — putting four out of five machine-graded tasks under a human's name. The real split:

| | Count |
|---|---|
| Runs a program — needs the judge | **261** |
| String-compared automatically, nothing executed | **263** |
| Read by a teacher | **62** |
| `verify:find_bug` — graded from its own cases | 1 |
| **Total graded tasks** | **587** |

**524 of 587 — 89% — are graded automatically.** The 62 a teacher reads are `explain`, `oral_explanation` and `manual_trace`, plus `test_case` and `arena_problem`: an oral defence has no program, and a hand trace would be answered for the learner by running it.

The 263 string-compared ones — `prediction`, `multiple_choice`, `fill_blank`, `reorder_code`, `find_bug`, `trace_code` — are checked against a declared answer with no execution at all. They need no provider and are unaffected by anything about Judge0.

## The classification rules, and why

**C — assessment.** Everything in a monthly check or in a contest lesson. A contest exists to produce a verdict the learner did not produce themselves; a check exists to be independent of the learner's own machine.

**A — optional.** Bank tasks. A learner may skip them, so crediting them toward required-path mastery would let work nobody has to do stand in for work everybody does. They should still run locally: feedback on optional practice is the point of it.

**B — everything else on the required path.** Both from-nothing programs and guided ones. The distinction the curriculum draws between them is about *independence*, which `independence_weight` already measures from assistance rather than from block type — it is not a reason to trust one less than the other.

**D — no program to run.** `explain` and `oral_explanation` have no program. `manual_trace` makes the learner the computer, so running it would answer the question for them. `test_case` asks for an INPUT and settles correct-or-unknown, never wrong. `arena_problem` is marked by a human. The string-compared types — `prediction`, `multiple_choice`, `fill_blank`, `reorder_code`, `find_bug` — execute nothing.

## Is the checking correct?

A separate question from "does a judge run", and one the classification cannot answer on its own.

**Eleven tasks promised a layout their checker did not enforce.** Their prompts say «әр жауап жеке жолда» — each answer on its own line — and the default `token` checker tokenises on whitespace, so a program printing everything on one line passed. Verified by flattening every expected output and re-checking: all eleven accepted it.

`check-blocks` has always warned about a multi-line expectation under a token checker. What it could not know is whether the PROMPT claimed a layout, which is what turns a forgiving checker into a broken promise.

All eleven now declare `{ kind: "exact" }`, and every reference solution passes every case unchanged under it — checked before the change, not after. `tests/school/stated-layout-is-enforced.test.ts` fails if a prompt ever promises a line layout again while its checker accepts the output flattened; removing one of the eleven declarations trips it.

Eight more tasks have multi-line expectations under `token` and say nothing about layout in their prompts. Those are left alone: whitespace forgiveness is the right default, and a task that does not promise a shape has not broken a promise.

**Checkers now in use across the 261:** 229 `token`, 31 `exact`, 1 `numeric`.

## Where the pedagogy and the shipped surface disagree

Two disagreements, neither a blocker, both worth a decision.

### 135 tasks classified B sit on `lesson_guided`

Every required program task in a lesson. On the reading that `lesson_guided` means "the browser settles it", this would be the release blocker of the whole audit. It is not that, because the trust policy is not in the grading path — see the trace above. What it is: **the surface names describe an intent the enforcement layer does not consult.** Renaming or removing them is a judgement for whoever owns execution.

The one substantive consequence is a reporting one. `capabilityFor` returns `checkProducesEvidence: true` for any `client_local` surface **even with no trusted provider** — and with no provider a code task on that surface produces no verdict at all, because the submit route leaves it `unknown` and `toLearningVerdictName` returns `null`. So the admin health view and `release-mode.ts` will report that Check produces evidence on `lesson_guided` when, for the 138 program tasks there, it does not. Misleading an operator, not a learner.

### 15 optional tasks sit on `independent_evidence`

`surfaceForBlock` routes any `mN.pK` id to `independent_evidence` positionally. Fifteen of those ids are bank tasks — work a learner may skip:

`m2.l8.b8`, `m2.p1`, `m2.p3`, `m2.p5`, `m2.p7`, `m2.p8`, `m2.p9`, `m2.p10`, `m3.p3`, `m3.p4`, `m3.p6`, `m3.p8`, `m4.p9`, `m7.p1`, `m7.p10`

This is the sharper of the two, because it points the wrong way: optional work is routed to the surface whose entire purpose is trusted independence evidence, so a learner who does only bank tasks accumulates evidence on the surface that backs the programme's «~100 толық дербес шешім» — for skills the required path never evidenced. The reporting scripts already exclude bank from independent evidence; the execution surface does not know the field exists.

Positional rules cannot see `bank`. Whether to teach `surfaceForBlock` about it is an execution decision and is on the register.

## The submission contract

Verified against `findBlock` and `checkerProblem` for all 261:

| | |
|---|---|
| Resolve through `findBlock` | 261 / 261 |
| Have at least one case | 261 / 261 |
| Declare a usable checker | 261 / 261 |
| `token` (default) | 240 |
| `exact` | 20 |
| `numeric` | 1 |

Nothing in the curriculum blocks a Judge0 integration. Every program task is a source string, a case list and a checker the grading path already supports.

| Month | Block | Type | Lesson | Class | Surface | Local run | Server required | Trusted LI evidence | Assessment | Cases | Reference | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `m1.l1.b2` | prediction | m1.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l1.b4` | find_bug | m1.l1 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 1 | `m1.l1.b5` | write_code | m1.l1 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l11.b2` | write_code | m1.l11 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l11.b3` | find_bug | m1.l11 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 1 | `m1.l2.b1a` | prediction | m1.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l2.b2` | fill_blank | m1.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l2.b3s` | fill_blank | m1.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l2.b3` | write_code | m1.l2 | **B** | lesson_guided | yes | yes | yes | — | 3 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l2.b3a` | write_code | m1.l2 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l2.b4` | test_case | m1.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 1 | `m1.l10.b2` | prediction | m1.l10 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l10.b4` | multiple_choice | m1.l10 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l10.b5` | write_code | m1.l10 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l3.b3` | prediction | m1.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l3.b4` | write_code | m1.l3 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l3.b5` | write_code | m1.l3 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l4.b2` | trace_code | m1.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l4.b3` | reorder_code | m1.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l4.b4` | write_code | m1.l4 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l4.b5` | write_code | m1.l4 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l5.b2` | prediction | m1.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l5.b3s` | fill_blank | m1.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l5.b3` | write_code | m1.l5 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l5.b3b` | write_code | m1.l5 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l5.b4` | find_bug | m1.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 1 | `m1.l12.b2` | write_code | m1.l12 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l12.b3` | write_code | m1.l12 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l6.b2` | multiple_choice | m1.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l6.b2a` | multiple_choice | m1.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l6.b2b` | write_code | m1.l6 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l6.b3s` | modify_code | m1.l6 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 1 | `m1.l6.b3` | write_code | m1.l6 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l6.b4` | explain | m1.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 1 | `m1.l7.b2` | test_case | m1.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 1 | `m1.l7.b3` | modify_code | m1.l7 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 1 | `m1.l7.b4s` | reorder_code | m1.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 1 | `m1.l7.b4` | write_code | m1.l7 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l8.b1` | challenge | m1.l8 | **B** | independent_evidence | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l8.b2` | challenge | m1.l8 | **B** | independent_evidence | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.l8.b3` | explain | m1.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 1 | `m1.p1` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p2` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p3` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 3 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p4` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 3 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p5` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p6` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p7` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 3 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p9` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.p8` | write_code | m1.l9 | **B** | independent_evidence | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 1 | `m1.as.b1` | verify:unseen_problem | m1.assessment | **C** | assessment | yes | yes | yes | yes | 7 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 1 | `m1.as.b2` | verify:find_bug | m1.assessment | **D** | assessment | no | no | **no** | yes | 6 | yes | string-compared against a declared answer; no program is executed |
| 1 | `m1.as.b3` | explain | m1.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 1 | `m1.as.b4` | verify:oral_explanation | m1.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 2 | `m2.l1.b2` | prediction | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b3` | trace_code | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b4` | multiple_choice | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b5` | fill_blank | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b6` | reorder_code | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b8s` | fill_blank | m2.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l1.b8` | write_code | m2.l1 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l1.b9` | write_code | m2.l1 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l2.b3` | prediction | m2.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l2.b4` | find_bug | m2.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l2.b5` | modify_code | m2.l2 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 2 | `m2.l2.b6` | write_code | m2.l2 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l2.b6s` | fill_blank | m2.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l2.b7` | write_code | m2.l2 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l2.b8` | explain | m2.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 2 | `m2.l3.b2` | prediction | m2.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l3.b3` | trace_code | m2.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l3.b4` | find_bug | m2.l3 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l3.b5` | test_case | m2.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 2 | `m2.l3.b6` | fill_blank | m2.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l3.b7` | write_code | m2.l3 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l3.b8` | write_code | m2.l3 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l3.b8s` | modify_code | m2.l3 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 2 | `m2.l4.b3` | prediction | m2.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l4.b4` | multiple_choice | m2.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l4.b5` | find_bug | m2.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l4.b6` | fill_blank | m2.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l4.b7` | write_code | m2.l4 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l4.b8s` | fill_blank | m2.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l4.b8` | write_code | m2.l4 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l5.b3` | prediction | m2.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l5.b4` | trace_code | m2.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l5.b5` | fill_blank | m2.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l5.b6s` | reorder_code | m2.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l5.b6` | write_code | m2.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l5.b7` | write_code | m2.l5 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l5.b8` | write_code | m2.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l5.b9` | write_code | m2.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l6.b2` | prediction | m2.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l6.b3` | multiple_choice | m2.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l6.b4` | fill_blank | m2.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l6.b5` | find_bug | m2.l6 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l6.b6` | write_code | m2.l6 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l6.b7` | write_code | m2.l6 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l6.b7s` | fill_blank | m2.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l6.b8` | write_code | m2.l6 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l7.b2` | prediction | m2.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l7.b3` | multiple_choice | m2.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l7.b4` | trace_code | m2.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l7.b6` | fill_blank | m2.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l7.b7` | write_code | m2.l7 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l7.b8s` | reorder_code | m2.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l7.b8` | write_code | m2.l7 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l7.b9` | write_code | m2.l7 | **A** | lesson_guided | yes | no | **no** | — | 6 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.l8.b2` | prediction | m2.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l8.b3` | multiple_choice | m2.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l8.b4` | find_bug | m2.l8 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l8.b5` | modify_code | m2.l8 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 2 | `m2.l8.b6` | write_code | m2.l8 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l8.b6s` | fill_blank | m2.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l8.b7` | write_code | m2.l8 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l8.b8` | challenge | m2.l8 | **A** | independent_evidence | yes | no | **no** | — | 9 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.l8.b9` | explain | m2.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 2 | `m2.l9.b2` | trace_code | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l9.b3` | find_bug | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l9.b4` | find_bug | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l9.b5` | find_bug | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 2 | `m2.l9.b6` | test_case | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 2 | `m2.l9.b7` | trace_code | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.l9.b8` | modify_code | m2.l9 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 2 | `m2.l9.b9` | write_code | m2.l9 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.l9.b9s` | fill_blank | m2.l9 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 2 | `m2.p1` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 5 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p2` | write_code | m2.l10 | **B** | independent_evidence | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.p3` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 6 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p4` | write_code | m2.l10 | **B** | independent_evidence | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.p5` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 6 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p6` | write_code | m2.l10 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 2 | `m2.p7` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 8 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p8` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p9` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.p10` | write_code | m2.l10 | **A** | independent_evidence | yes | no | **no** | — | 8 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 2 | `m2.as.b1` | verify:manual_trace | m2.assessment | **D** | assessment | no | no | **no** | yes | — | — | the learner is the computer here; running it would answer the question for them |
| 2 | `m2.as.b2` | verify:unseen_problem | m2.assessment | **C** | assessment | yes | yes | yes | yes | 8 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 2 | `m2.as.b4` | verify:oral_explanation | m2.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 3 | `m3.l1.b3` | prediction | m3.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l1.b4` | multiple_choice | m3.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l1.b5` | reorder_code | m3.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l1.b6` | fill_blank | m3.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l1.b7` | write_code | m3.l1 | **B** | lesson_guided | yes | yes | yes | — | 4 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l1.b8s` | fill_blank | m3.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l1.b8` | write_code | m3.l1 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l2.b3` | trace_code | m3.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l2.b4` | prediction | m3.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l2.b5` | fill_blank | m3.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l2.b6` | find_bug | m3.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l2.b7` | write_code | m3.l2 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l2.b8` | write_code | m3.l2 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l2.b8s` | fill_blank | m3.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b3` | prediction | m3.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b4` | multiple_choice | m3.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b5` | find_bug | m3.l3 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b6` | find_bug | m3.l3 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b7` | fill_blank | m3.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l3.b8` | write_code | m3.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l3.b9` | write_code | m3.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l3.b9s` | modify_code | m3.l3 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 3 | `m3.l8.b3` | prediction | m3.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l8.b4` | trace_code | m3.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l8.b5` | fill_blank | m3.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l8.b6` | write_code | m3.l8 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l8.b7` | write_code | m3.l8 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l8.b8` | modify_code | m3.l8 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 3 | `m3.l8.b8s` | fill_blank | m3.l8 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l8.b9` | write_code | m3.l8 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l4.b2` | prediction | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b3` | multiple_choice | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b4` | trace_code | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b5` | find_bug | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b6` | fill_blank | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b7` | modify_code | m3.l4 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 3 | `m3.l4.b8s` | fill_blank | m3.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l4.b8` | write_code | m3.l4 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l5.b3` | prediction | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l5.b4` | multiple_choice | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l5.b5` | find_bug | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l5.b6` | find_bug | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l5.b7` | modify_code | m3.l5 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 3 | `m3.l5.b8s` | fill_blank | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l5.b8` | write_code | m3.l5 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l5.b9` | explain | m3.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 3 | `m3.l6.b3` | multiple_choice | m3.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l6.b4` | reorder_code | m3.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l6.b5` | modify_code | m3.l6 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 3 | `m3.l6.b6` | fill_blank | m3.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l6.b7s` | fill_blank | m3.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l6.b7` | write_code | m3.l6 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l6.b8` | explain | m3.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 3 | `m3.l7.b2` | prediction | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l7.b3` | trace_code | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l7.b4` | find_bug | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 3 | `m3.l7.b5` | test_case | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 3 | `m3.l7.b6` | write_code | m3.l7 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l7.b6s` | fill_blank | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 3 | `m3.l7.b7` | challenge | m3.l7 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.l7.b8` | explain | m3.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 3 | `m3.p1` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.p2` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.p3` | write_code | m3.l9 | **A** | independent_evidence | yes | no | **no** | — | 8 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 3 | `m3.p4` | write_code | m3.l9 | **A** | independent_evidence | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 3 | `m3.p5` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.p6` | write_code | m3.l9 | **A** | independent_evidence | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 3 | `m3.p7` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.p8` | write_code | m3.l9 | **A** | independent_evidence | yes | no | **no** | — | 8 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 3 | `m3.p9` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.p10` | write_code | m3.l9 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 3 | `m3.as.b1` | verify:unseen_problem | m3.assessment | **C** | assessment | yes | yes | yes | yes | 8 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 3 | `m3.as.b2` | explain | m3.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 3 | `m3.as.b4` | verify:oral_explanation | m3.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 4 | `m4.l1.b3` | prediction | m4.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l1.b4` | multiple_choice | m4.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l1.b5` | multiple_choice | m4.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l1.b6` | trace_code | m4.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l1.b7` | write_code | m4.l1 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l1.b8` | write_code | m4.l1 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l1.b8s` | fill_blank | m4.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l2.b3` | prediction | m4.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l2.b4` | multiple_choice | m4.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l2.b5` | test_case | m4.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 4 | `m4.l2.b6` | modify_code | m4.l2 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l2.b7` | write_code | m4.l2 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l2.b7s` | fill_blank | m4.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l2.b8` | explain | m4.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 4 | `m4.l3.b2` | prediction | m4.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l3.b3` | find_bug | m4.l3 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 4 | `m4.l3.b4` | multiple_choice | m4.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l3.b5` | fill_blank | m4.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l3.b6` | write_code | m4.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l3.b7` | write_code | m4.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l3.b7s` | modify_code | m4.l3 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l3.b8` | write_code | m4.l3 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l4.b3` | prediction | m4.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l4.b4` | multiple_choice | m4.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l4.b5` | find_bug | m4.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 4 | `m4.l4.b6` | fill_blank | m4.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l4.b7s` | fill_blank | m4.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l4.b7` | write_code | m4.l4 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l4.b8` | write_code | m4.l4 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l7.b3` | prediction | m4.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l7.b4` | trace_code | m4.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l7.b5` | find_bug | m4.l7 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 4 | `m4.l7.b6` | fill_blank | m4.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l7.b7` | write_code | m4.l7 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l7.b8` | write_code | m4.l7 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l7.b8s` | modify_code | m4.l7 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l5.b3` | prediction | m4.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l5.b4` | trace_code | m4.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l5.b5` | multiple_choice | m4.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l5.b6` | fill_blank | m4.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l5.b7` | find_bug | m4.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 4 | `m4.l5.b8` | write_code | m4.l5 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l5.b8s` | modify_code | m4.l5 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l5.b9` | write_code | m4.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l6.b2` | multiple_choice | m4.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l6.b3` | prediction | m4.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.l6.b4` | modify_code | m4.l6 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l6.b5` | find_bug | m4.l6 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 4 | `m4.l6.b6` | write_code | m4.l6 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l6.b7` | write_code | m4.l6 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l6.b7s` | modify_code | m4.l6 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 4 | `m4.l6.b8` | challenge | m4.l6 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.l6.b9` | explain | m4.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 4 | `m4.p1` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p2` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p3` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p4` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p5` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p6` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p7` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p8` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.p9` | write_code | m4.l8 | **A** | independent_evidence | yes | no | **no** | — | 9 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 4 | `m4.p10` | write_code | m4.l8 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 4 | `m4.as.b1` | multiple_choice | m4.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | string-compared against a declared answer; no program is executed |
| 4 | `m4.as.b2` | explain | m4.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 4 | `m4.as.b3` | verify:unseen_problem | m4.assessment | **C** | assessment | yes | yes | yes | yes | 10 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 4 | `m4.as.b4` | verify:oral_explanation | m4.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 5 | `m5.l1.b4` | prediction | m5.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l1.b5` | trace_code | m5.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l1.b6` | multiple_choice | m5.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l1.b7` | fill_blank | m5.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l1.b8` | modify_code | m5.l1 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l1.b9` | write_code | m5.l1 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l1.b9s` | modify_code | m5.l1 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l2.b2` | prediction | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l2.b3` | trace_code | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l2.b4` | find_bug | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l2.b5` | find_bug | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l2.b6` | fill_blank | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l2.b7` | modify_code | m5.l2 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l2.b8` | test_case | m5.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 5 | `m5.l2.b9` | write_code | m5.l2 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l2.b9s` | modify_code | m5.l2 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l6.b2` | trace_code | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b3` | trace_code | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b4` | find_bug | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b5` | find_bug | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b6` | find_bug | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b7` | test_case | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 5 | `m5.l6.b7s` | prediction | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b8` | multiple_choice | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b9` | fill_blank | m5.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l6.b10` | modify_code | m5.l6 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l3.b3` | prediction | m5.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l3.b4` | multiple_choice | m5.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l3.b5` | fill_blank | m5.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l3.b6` | trace_code | m5.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l3.b7` | modify_code | m5.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l3.b8` | write_code | m5.l3 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l3.b9` | write_code | m5.l3 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l3.b9s` | fill_blank | m5.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b3` | prediction | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b4` | trace_code | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b5` | multiple_choice | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b6` | fill_blank | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b7` | find_bug | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l4.b8` | write_code | m5.l4 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l4.b9` | write_code | m5.l4 | **B** | lesson_guided | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l4.b9s` | fill_blank | m5.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b3` | prediction | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b4` | trace_code | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b5` | find_bug | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b6` | fill_blank | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b7s` | fill_blank | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l7.b7` | write_code | m5.l7 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l7.b8` | modify_code | m5.l7 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 5 | `m5.l7.b9` | explain | m5.l7 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 5 | `m5.l5.b2` | prediction | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l5.b3` | trace_code | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l5.b4` | multiple_choice | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l5.b5` | find_bug | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 5 | `m5.l5.b6` | write_code | m5.l5 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l5.b7` | write_code | m5.l5 | **B** | lesson_guided | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l5.b7s` | fill_blank | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 5 | `m5.l5.b8` | challenge | m5.l5 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.l5.b9` | explain | m5.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 5 | `m5.p1` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p2` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 13 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p3` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p4` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p5` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 14 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p6` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p7` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p8` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p9` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.p10` | write_code | m5.l8 | **B** | independent_evidence | yes | yes | yes | — | 13 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 5 | `m5.as.b1` | verify:unseen_problem | m5.assessment | **C** | assessment | yes | yes | yes | yes | 18 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 5 | `m5.as.b3` | verify:manual_trace | m5.assessment | **D** | assessment | no | no | **no** | yes | — | — | the learner is the computer here; running it would answer the question for them |
| 5 | `m5.as.b4` | verify:oral_explanation | m5.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.l1.b3` | prediction | m6.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l1.b4` | multiple_choice | m6.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l1.b5` | find_bug | m6.l1 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 6 | `m6.l1.b6` | fill_blank | m6.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l1.b7` | trace_code | m6.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l1.b8` | write_code | m6.l1 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l1.b9s` | modify_code | m6.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 6 | `m6.l1.b9` | write_code | m6.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l2.b2` | multiple_choice | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l2.b3` | prediction | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l2.b4` | trace_code | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l2.b5` | find_bug | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 6 | `m6.l2.b6` | modify_code | m6.l2 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 6 | `m6.l2.b7` | test_case | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 6 | `m6.l2.b8` | write_code | m6.l2 | **A** | lesson_guided | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 6 | `m6.l2.b8s` | fill_blank | m6.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b4` | prediction | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b5` | multiple_choice | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b6` | trace_code | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b7` | fill_blank | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b8` | write_code | m6.l3 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l3.b9` | write_code | m6.l3 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l3.b9s` | reorder_code | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l3.b10` | explain | m6.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.l4.b2` | prediction | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b3` | find_bug | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b4` | find_bug | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b5` | multiple_choice | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b6` | fill_blank | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b7` | trace_code | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b8` | write_code | m6.l4 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l4.b8s` | fill_blank | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l4.b9` | write_code | m6.l4 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l4.b10` | explain | m6.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.l6.b3` | prediction | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l6.b4` | trace_code | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l6.b5` | multiple_choice | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l6.b6` | fill_blank | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l6.b7` | modify_code | m6.l6 | **B** | lesson_guided | yes | yes | yes | — | 5 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 6 | `m6.l6.b8s` | fill_blank | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l6.b8` | modify_code | m6.l6 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 6 | `m6.l6.b9` | explain | m6.l6 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.l6.b10` | challenge | m6.l6 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l5.b2` | prediction | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l5.b3` | trace_code | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l5.b4` | multiple_choice | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l5.b5` | find_bug | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 6 | `m6.l5.b6` | write_code | m6.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l5.b7` | write_code | m6.l5 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l5.b8s` | fill_blank | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 6 | `m6.l5.b8` | challenge | m6.l5 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.l5.b9` | explain | m6.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.p1` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p2` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p3` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p4` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p5` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p6` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p7` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p8` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p9` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.p10` | write_code | m6.l7 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 6 | `m6.as.b1` | verify:unseen_problem | m6.assessment | **C** | assessment | yes | yes | yes | yes | 12 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 6 | `m6.as.b2` | verify:manual_trace | m6.assessment | **D** | assessment | no | no | **no** | yes | — | — | the learner is the computer here; running it would answer the question for them |
| 6 | `m6.as.b3` | explain | m6.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 6 | `m6.as.b4` | verify:oral_explanation | m6.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.l1.b3` | prediction | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b4` | multiple_choice | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b5` | find_bug | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b6` | find_bug | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b7` | fill_blank | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b8` | trace_code | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l1.b9` | write_code | m7.l1 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l1.b10` | write_code | m7.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l1.b10s` | modify_code | m7.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 7 | `m7.l1.b11` | explain | m7.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.l2.b3` | prediction | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l2.b4` | multiple_choice | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l2.b5` | trace_code | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l2.b6` | find_bug | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l2.b7` | fill_blank | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l2.b8` | write_code | m7.l2 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l2.b9` | write_code | m7.l2 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l2.b10` | write_code | m7.l2 | **A** | lesson_guided | yes | no | **no** | — | 10 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 7 | `m7.l2.b10s` | fill_blank | m7.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b2` | trace_code | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b3` | prediction | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b4` | find_bug | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b5` | find_bug | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b6` | multiple_choice | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b7` | fill_blank | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b8` | modify_code | m7.l5 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 7 | `m7.l5.b9` | test_case | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 7 | `m7.l5.b9s` | multiple_choice | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l5.b10` | explain | m7.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.l3.b4` | prediction | m7.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l3.b5` | trace_code | m7.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l3.b6` | multiple_choice | m7.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l3.b7` | fill_blank | m7.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l3.b8` | write_code | m7.l3 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 7 | `m7.l3.b9` | write_code | m7.l3 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l3.b9s` | modify_code | m7.l3 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 7 | `m7.l3.b10` | explain | m7.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.l4.b3` | prediction | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b4` | trace_code | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b5` | find_bug | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b6` | find_bug | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b7` | fill_blank | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b8s` | fill_blank | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 7 | `m7.l4.b8` | write_code | m7.l4 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l4.b9` | challenge | m7.l4 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.l4.b10` | explain | m7.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.p1` | write_code | m7.l6 | **A** | independent_evidence | yes | no | **no** | — | 7 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 7 | `m7.p2` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p3` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p4` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p5` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p6` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p7` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p8` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p9` | write_code | m7.l6 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 7 | `m7.p10` | write_code | m7.l6 | **A** | independent_evidence | yes | no | **no** | — | 10 | yes | optional. A learner may skip it, so crediting it toward required-path mastery would let work nobody has to do stand in for work everybody does |
| 7 | `m7.as.b1` | verify:unseen_problem | m7.assessment | **C** | assessment | yes | yes | yes | yes | 12 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 7 | `m7.as.b2` | verify:manual_trace | m7.assessment | **D** | assessment | no | no | **no** | yes | — | — | the learner is the computer here; running it would answer the question for them |
| 7 | `m7.as.b3` | explain | m7.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 7 | `m7.as.b4` | verify:oral_explanation | m7.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 8 | `m8.l1.b3` | prediction | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l1.b4` | multiple_choice | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l1.b5` | trace_code | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l1.b6` | fill_blank | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l1.b7` | find_bug | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 8 | `m8.l1.b8` | write_code | m8.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l1.b8s` | modify_code | m8.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 8 | `m8.l1.b9` | write_code | m8.l1 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l1.b10` | explain | m8.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 8 | `m8.l2.b3` | test_case | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 8 | `m8.l2.b4` | prediction | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l2.b5` | test_case | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 8 | `m8.l2.b6` | modify_code | m8.l2 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 8 | `m8.l2.b7` | multiple_choice | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l2.b9` | write_code | m8.l2 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l2.b9s` | fill_blank | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l2.b10` | explain | m8.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 8 | `m8.l3.b4` | multiple_choice | m8.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l3.b5` | prediction | m8.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l3.b6` | trace_code | m8.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l3.b7` | find_bug | m8.l3 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 8 | `m8.l3.b8` | fill_blank | m8.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l3.b9` | write_code | m8.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l3.b9s` | modify_code | m8.l3 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 8 | `m8.l5.b3` | multiple_choice | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b4` | prediction | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b5` | trace_code | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b6` | find_bug | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b7` | fill_blank | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b8` | write_code | m8.l5 | **B** | lesson_guided | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l5.b9s` | reorder_code | m8.l5 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l5.b9` | write_code | m8.l5 | **B** | lesson_guided | yes | yes | yes | — | 9 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l4.b2` | prediction | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l4.b5` | multiple_choice | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l4.b6` | trace_code | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l4.b7` | find_bug | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 8 | `m8.l4.b8` | fill_blank | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 8 | `m8.l4.b9` | write_code | m8.l4 | **B** | lesson_guided | yes | yes | yes | — | 14 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l4.b9s` | modify_code | m8.l4 | **B** | lesson_guided | yes | yes | yes | — | 12 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 8 | `m8.l4.b10` | challenge | m8.l4 | **B** | independent_evidence | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.l4.b11` | explain | m8.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 8 | `m8.p1` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p2` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p3` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p4` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p5` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p6` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p7` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 12 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p8` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 8 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p9` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.p10` | write_code | m8.l6 | **B** | independent_evidence | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 8 | `m8.as.b1` | explain | m8.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 8 | `m8.as.b2` | verify:unseen_problem | m8.assessment | **C** | assessment | yes | yes | yes | yes | 12 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 8 | `m8.as.b3` | test_case | m8.assessment | **D** | lesson_guided | no | no | **no** | yes | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 8 | `m8.as.b4` | verify:oral_explanation | m8.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l1.b2` | multiple_choice | m9.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l1.b3` | multiple_choice | m9.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l1.b4` | prediction | m9.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l1.b5` | explain | m9.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l1.b7` | write_code | m9.l1 | **B** | lesson_guided | yes | yes | yes | — | 6 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 9 | `m9.l1.b8` | write_code | m9.l1 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 9 | `m9.l1.b8s` | fill_blank | m9.l1 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b2` | multiple_choice | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b3` | multiple_choice | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b4` | find_bug | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b5` | find_bug | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | yes | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b6` | test_case | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is an INPUT the learner invented; it settles correct or unknown and never wrong |
| 9 | `m9.l2.b6s` | multiple_choice | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l2.b7` | modify_code | m9.l2 | **B** | lesson_guided | yes | yes | yes | — | 7 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 9 | `m9.l2.b8` | explain | m9.l2 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l3.b3` | verify:delayed_resolve | m9.l3 | **B** | assessment | yes | yes | yes | — | 10 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 9 | `m9.l3.b4` | multiple_choice | m9.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l3.b5` | explain | m9.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l3.b6` | modify_code | m9.l3 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | graded work on the required path; evidence of the skill, though not of independence |
| 9 | `m9.l3.b7` | write_code | m9.l3 | **B** | lesson_guided | yes | yes | yes | — | 11 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 9 | `m9.l3.b7s` | reorder_code | m9.l3 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.c1.p1` | challenge | m9.c1 | **C** | independent_evidence | yes | yes | yes | yes | 9 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c1.p2` | challenge | m9.c1 | **C** | independent_evidence | yes | yes | yes | yes | 9 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c1.p3` | challenge | m9.c1 | **C** | independent_evidence | yes | yes | yes | yes | 11 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c1.p4` | challenge | m9.c1 | **C** | independent_evidence | yes | yes | yes | yes | 10 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c1.p5` | challenge | m9.c1 | **C** | independent_evidence | yes | yes | yes | yes | 11 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c2.p1` | challenge | m9.c2 | **C** | independent_evidence | yes | yes | yes | yes | 11 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c2.p2` | challenge | m9.c2 | **C** | independent_evidence | yes | yes | yes | yes | 12 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c2.p3` | challenge | m9.c2 | **C** | independent_evidence | yes | yes | yes | yes | 11 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c2.p4` | challenge | m9.c2 | **C** | independent_evidence | yes | yes | yes | yes | 11 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c2.p5` | challenge | m9.c2 | **C** | independent_evidence | yes | yes | yes | yes | 12 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c3.p1` | challenge | m9.c3 | **C** | independent_evidence | yes | yes | yes | yes | 7 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c3.p2` | challenge | m9.c3 | **C** | independent_evidence | yes | yes | yes | yes | 7 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c3.p3` | challenge | m9.c3 | **C** | independent_evidence | yes | yes | yes | yes | 8 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c3.p4` | challenge | m9.c3 | **C** | independent_evidence | yes | yes | yes | yes | 7 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c3.p5` | challenge | m9.c3 | **C** | independent_evidence | yes | yes | yes | yes | 8 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c4.p1` | challenge | m9.c4 | **C** | independent_evidence | yes | yes | yes | yes | 10 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c4.p2` | challenge | m9.c4 | **C** | independent_evidence | yes | yes | yes | yes | 10 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c4.p3` | challenge | m9.c4 | **C** | independent_evidence | yes | yes | yes | yes | 8 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c4.p4` | challenge | m9.c4 | **C** | independent_evidence | yes | yes | yes | yes | 10 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.c4.p5` | challenge | m9.c4 | **C** | independent_evidence | yes | yes | yes | yes | 10 | yes | a contest problem; the whole point is a verdict the learner did not produce |
| 9 | `m9.l4.b3` | multiple_choice | m9.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l4.b4` | explain | m9.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l4.b5` | explain | m9.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.l4.b6` | write_code | m9.l4 | **B** | lesson_guided | yes | yes | yes | — | 10 | yes | a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім» |
| 9 | `m9.l4.b6s` | fill_blank | m9.l4 | **D** | lesson_guided | no | no | **no** | — | — | — | string-compared against a declared answer; no program is executed |
| 9 | `m9.l4.b7` | verify:oral_explanation | m9.l4 | **D** | assessment | no | no | **no** | — | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.as.b1` | verify:unseen_problem | m9.assessment | **C** | assessment | yes | yes | yes | yes | 10 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 9 | `m9.as.b2` | verify:unseen_problem | m9.assessment | **C** | assessment | yes | yes | yes | yes | 9 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 9 | `m9.as.b3` | verify:unseen_problem | m9.assessment | **C** | assessment | yes | yes | yes | yes | 9 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 9 | `m9.as.b4` | verify:unseen_problem | m9.assessment | **C** | assessment | yes | yes | yes | yes | 13 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 9 | `m9.as.b5` | verify:unseen_problem | m9.assessment | **C** | assessment | yes | yes | yes | yes | 11 | yes | a monthly check or the final tournament — a browser-local pass is never assessment evidence |
| 9 | `m9.as.b6` | verify:oral_explanation | m9.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
| 9 | `m9.as.b7` | verify:oral_explanation | m9.assessment | **D** | assessment | no | no | **no** | yes | — | — | the answer is prose or speech; there is no program to run |
