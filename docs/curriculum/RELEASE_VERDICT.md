# Release verdict

# READY WITH EXPLICIT CONTENT BLOCKERS

Every machine gate that can pass, passes. Six human gates are open and none of them can be closed from inside this repository. The curriculum must not be described as reviewed, validated or ready for learners until they are signed.

---

## 1–7. What the corpus is

Core route. These figures are kept apart on purpose; `TASK_COUNT_RECONCILIATION.md` is the account of what collapsing them cost.

| | |
|---|---|
| 1. Total blocks | **614** (700 across all three routes) |
| 2. Attempt tasks | **501** |
| 3. PDF-comparable practice tasks | **452** against a promised 279 |
| 4. Core-required tasks | **483** — every attempt task that is not in the bank |
| 5. Bank tasks | **18** (23 across all routes) |
| 6. Assessments | **9 checks, 36 graded tasks** |
| 7. Contests | **4 practice contests + the final tournament, 20 problems** |

Of the 452, **144 are whole programs written from nothing** against a promised ~100.

## 8. All 29 optional-task routes — PASS

29 lesson×route pairs contain a bank task. All 29 pass, under three learners:

| Learner | Result |
|---|---|
| Does every required task, declines every optional one | 78/78 lessons and checks completable, all 3 routes |
| Does everything | 78/78 |
| Tries every optional task and gets it wrong | 78/78 |

The third learner is the one that mattered. `optional` was consulted only on an unchecked verdict, so attempting a bank task and failing took away the way past it. Fixed, and the walk that would have caught it now exists — restoring the old behaviour fails on all three routes.

Skip settles nothing, submits nothing, reveals nothing, counts toward nothing, and leaves the task reachable.

## 9. False-accept regressions — PASS, 20 of 20

20 programs that were wrong and scored full marks, each an executable fixture. For each: the reference still answers the witness correctly, the wrong program still does not, and the declared cases still reject it. **62 assertions, 0 still accepted.**

Six were in a graded monthly check. `FALSE_ACCEPT_REGISTER.md`.

The finding inside the finding: a case that kills one *spelling* of a wrong idea has not addressed the idea. March's first guard case killed the depth-first fill written with the reference's direction order and nothing else; 32508 random maps later, no single map defeats all 24 orderings, and two were needed.

## 10. Assessment wrong-solution audit — 9 of 9 audited

Every coding task in every monthly check, against the most plausible incorrect algorithm a Grade 9 learner would actually write. Four new false accepts found — three in January, one in March — all fixed and enforced. Each audit also verified an alternative *correct* algorithm passes, which is the check against the opposite defect.

`WHAT_A_TASK_TESTS.md` records the rule these audits ran under: a task tests correct behaviour, not authorship of the reference. 17 of the 20 registered programs are simply wrong; 2 invoke the narrow technique-required exception and both state that requirement in their own prompt.

## 11. Monthly check coverage — 0 clear gaps

One agent per month. **Zero clear implementation gaps in all nine checks.** Every omission classified; nothing auto-fixed. Two human decisions remain, both about what a check is for. `MONTHLY_ASSESSMENT_COVERAGE_REVIEW.md`.

Fixed along the way: eight lessons declared a skill no block inside them carried. The validator warns on each now.

## 12. Assessment timing — 6 over, 1 real

| Month | Stated | Estimated |
|---|---|---|
| 1 Қыркүйек | 20 | **30** |
| 2, 6 | 20 | 23 |
| 4 | 20 | 22 |
| 5, 7 | 20 | 21 |
| 3, 8 | 20 | 20 |
| 9 | 90 | 78 |

Only September's source states a duration, so only September is a defect against the source. It was cut to 26 during this pass and **the cut was reverted**: the comment above the block quotes p.7 verbatim and names four things, and two of the removals were source-named requirements. January's earlier 29 is resolved at 21.

Nothing else removed. `ASSESSMENT_TIMING.md`.

## 13. Reference-solution execution — PASS

**262 reference solutions against 2143 cases**, real Python, every one. `check-blocks` covers months 2–9 (628 blocks); `content-execution.test.ts` covers the whole year including September, whose file exports a `Month` and cannot be read by `check-blocks` at all.

## 14. Worked examples — PASS, 40 of 40

All 40 executed. Three checks each: every printed number appears in the stated result, **in the order printed, per language**, and every short non-numeric output line appears verbatim.

## 15. Privacy — PASS

`payload-privacy.test.ts` over the whole year, unmodified since this branch's baseline, no second detector added. Zero hidden cases, hidden expectations, reference solutions, unrevealed answers or teacher-only diagnostic rationale in a learner payload. `bank.why` was added to the collector — it names sibling block ids, which is a map to an equivalent answer.

## 16. Prerequisites — PASS

No skill is practised before the month that introduces it. No block shows Python the curriculum has not yet taught, enforced continuously by `constructs-are-taught.test.ts` with the three September-inherited constructs declared in reverse.

## 17. Support / Core / Advanced — PASS

All three routes traverse every month. The differentiation ordering holds on independent work in every month, with two ties. The support route costs **84% of core** — a fact, and one of the open questions: a learner who needs twice as long gets a sixth.

## 18. Human decisions — 9, of which 6 blocking

| | Blocking |
|---|---|
| 1. Native Kazakh quality — 1768 pairs, none read by a speaker | **yes** |
| 2. Native Russian quality | **yes** |
| 3. Learner timing — nobody has been timed | **yes** |
| 4. What a 20-minute check is for | **yes** |
| 5. A wrong answer is a dead end in 219 of 222 lesson/route pairs | **yes** |
| 6. 100 blocks counted as independent evidence are settled by the learner's browser | no |
| 7. Eight lessons' skill declarations | no |
| 8. September's two redundant tasks | no |
| 9. Curriculum owner approval — the PDF is not in the repository | **yes** |

`HUMAN_GATES.md`. Gate 5 is the largest open defect and it is not a content problem: `footerMode` gives a wrong answer no forward control while the completion policy considers that block satisfied, and the policy's own docstring warns against exactly this.

## 19. Tests

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors, 23 warnings |
| `npm run typecheck` | clean |
| `npm run curriculum:validate` | 0 errors, 18 warnings |
| `npx tsx scripts/check-blocks.ts` (m02–m09) | 628 blocks clean |
| `npm run build` | all routes generated |
| `npm run check:bundle` | 70 client files, no secrets |
| `npx vitest run` | **4066 passed, 5 failed, 9 skipped** |

The five failures are pre-existing and fail identically at this branch's baseline `fc88245`: four structural assertions in `tests/execution/pyodide-boundary.test.ts` about `src/lib/pyodide`, and `ops-health.test.ts` expecting five teacher capabilities where the route reports six. None is curriculum.

The guarantee suites added in this pass: **157 assertions, all passing** — route traversal, optional-task skippability, the post-skip contract, the counters, the false-accept register and the document drift guard.

## 20. SHA

```
ba7c6b3c0a70a2aaecb8e7b1df5624842b0f8adf
```

Branch `curriculum-months-2-9`, not merged.

---

## Why this verdict and not another

**Not NOT READY.** Every defect found in this pass is fixed and enforced by a test that fails if it returns. The corpus executes, the routes traverse, the payloads are clean, and 20 wrong programs that used to score full marks now do not.

**Not READY FOR HUMAN SIGN-OFF.** That phrasing implies the remaining work is a signature. It is not. Nobody who speaks Kazakh has read a word of this; nobody has timed a learner; and a learner who gets a required code task wrong cannot finish the lesson in 219 of 222 lesson/route pairs while the policy says they have done enough.

Three of the blockers are things this workstream could never have closed. Two are decisions someone must make about what the product is for. One — gate 5 — is a defect anybody could fix in an afternoon and nobody should fix without deciding what it means for a fourteen-year-old to be stuck.

*Counts refreshed 2026-09-05:2026-09-05: 452 / 144 / 506 / 625 after September's beginner lessons — `m1.l0`, `m1.l13` — and the seven code tasks that gained a starter frame; a guided task is not an independent one. See TASK_COUNT_RECONCILIATION.md.*
