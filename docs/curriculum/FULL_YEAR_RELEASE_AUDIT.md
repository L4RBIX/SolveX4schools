# Release audit — Grade 9 competitive programming, Kazakh

Nine months, September to May. What is verified, what is not, and what only a person can close.

Nothing in this document is marked human-reviewed. Where a gate needs a human, it says so and stays open.

## Machine gates

| Gate | Command | State |
|---|---|---|
| Lint | `npm run lint` | **pass** — 0 errors, 23 warnings, all pre-existing unused-import notices |
| Types | `npm run typecheck` | **pass** — clean for the first time on this branch; see below |
| Curriculum validator | `npm run curriculum:validate` | **pass** — 0 errors across all nine months |
| Reference solutions | `npx tsx scripts/check-blocks.ts schools/curriculum/months/m0*/*.ts` | **pass** — every reference solution executed against every case, real Python |
| Answer-key leaks | `tests/school/payload-privacy.test.ts` | **pass** — the single source of truth for leak detection, unmodified |
| Test suite | `npx vitest run` | **3918 pass, 5 fail** — all five pre-existing, none curriculum; itemised below |
| Production build | `npm run build` | **pass** — all routes generated, after a real defect this branch introduced; see below |
| Client bundle | `npm run check:bundle` | **pass** — 70 client files, no secret values. Only the hardcoded-key pattern runs without secrets in the environment; CI must run it with the real values set. |

### Typecheck

`runServer`'s `timeLimitMs` defaulted from `EXECUTION_LIMITS`, which is `as const`, so the parameter narrowed to the literal `5000` and the two fixtures that override the budget could not be passed. Annotated `number`. Not this workstream's bug; it had been failing the gate since the runaway-loop fixture was written.

### The build, and a symlink this branch committed

`npm run build` failed in the worktree with `Cannot find module '@vercel/turbopack/postcss'` and succeeded in the main checkout, which is the shape of an environment problem and was not one.

This branch's baseline snapshot committed `node_modules` — a symlink to one machine's absolute path. `.gitignore` said `node_modules/`, with a trailing slash, which does not match a symlink of that name. Untracked, and the bare name added to `.gitignore` beneath the slashed one. The build then passes and generates every route.

Worth naming because of what it would have done: a tracked symlink pointing at `/Users/kydyrbekbekarys/...` is broken on every other machine, and it would have arrived in the merge rather than in a build anybody ran.

### The five remaining failures

All in product code this workstream does not touch, and all failing identically at this branch's baseline `fc88245`:

| Test | What it says |
|---|---|
| `ops-health` — five teacher capabilities | The health route reports six; `running_code` was added and the test not updated. The health route is the teacher backend. |
| `pyodide-boundary` × 4 | Structural assertions about `src/lib/pyodide` — the worker's message shape, its forbidden imports, its network reach. |

One failure in that file **was** this workstream's and is fixed: eight months of new content gave the answer-key scan a collision, because `m3.l6.b6`'s blank answer is `return c` and `runner.ts` returns something starting with a c. Resolved by excluding short code-shaped secrets from *that scan only* — 1.8% of it — rather than raising `secretStringsOf`'s floor, which would have weakened leak detection everywhere and would have been wrong on the facts besides: most short secrets are data, and data is what a debugging paste leaves behind.

## What the corpus is

Core route. These nine figures are kept apart on purpose; see `TASK_COUNT_RECONCILIATION.md` for the year of misleading reporting that came of collapsing them.

| | |
|---|---|
| Blocks, all nine months | 614 |
| PDF-comparable practice tasks | **447** against a promised 279 |
| Written from nothing | **159** against a promised ~100 |
| Monthly-check tasks | 36 |
| May contest problems | 20 |
| Optional bank | 18 |

## Open findings, by who can close them

### Only a human can close these

| # | Finding | Where |
|---|---|---|
| 1 | **Nobody who speaks Kazakh or Russian has read any of this.** 1441 string pairs, all agent-written. Mechanical pairing checks are clean and that is all they establish. | `l10n/KK_NATIVE_REVIEW.md`, `l10n/RU_NATIVE_REVIEW.md` — both unsigned |
| 2 | **Nobody has timed a learner.** Under the expected estimates every month fits its 510-minute budget except May. Under the slow ones, none do. October runs out of budget when a learner is 8% of the way from average toward slow. | `FULL_YEAR_WORKLOAD.md` |
| 3 | **The support route reduces difficulty, not quantity** — 83% of core's time, where a learner needing twice as long needs half. Three ways to answer that, none of them this workstream's to pick. | `FULL_YEAR_WORKLOAD.md` |
| 4 | **September's monthly check costs 30 minutes against a stated 20.** Its own restructuring comment says p.7 asks for one unseen problem plus an explanation, and it ships a bug hunt and a four-question written block on top. The cut that finishes it: drop `m1.as.b2`, take `m1.as.b3` to two questions. Lands at 20. September is human-authored, so this is a human's edit. | `FULL_YEAR_SKILL_MATRIX.md` |
| 5 | **Five months teach a named technique their own check never touches** — prefix sums, two pointers, exhaustive enumeration, depth-first search, path restoration. A 20-minute check holds one unseen problem; covering a second technique displaces the first. A decision about what a monthly check is for. | `FULL_YEAR_SKILL_MATRIX.md` |
| 6 | **September carries two redundant tasks** (`m1.p2`, `m1.p4`), both with correctly named earlier siblings. Not moved: September is the only month a human has accepted and the baseline the relative-density reading rests on. Leaving it uncut makes every other month look lighter than it is, so the bias errs toward pruning less elsewhere. | `FULL_YEAR_REDUNDANCY_AUDIT` (this file's §Core and bank) |

### Closed by this workstream

| Finding | Resolution |
|---|---|
| "475 tasks against 279" was not a comparison | Units established from three places in the PDF that agree; 447 against 279. `TASK_COUNT_RECONCILIATION.md` |
| `bank` was a label the completion policy never saw | One boolean crosses to the browser; `requirementFor` exempts banked tasks; asserted in both directions and mutation-tested. `tests/school/bank-is-optional.test.ts` |
| Core-vs-bank had only ever been asked of October, and for the wrong reason | All 521 required tasks re-audited against the uniqueness test, one owner per month, no target. 17 findings, 14 applied, 1 rejected on the merits, 2 held for a human. |
| A banked task cited a sibling arriving two lessons later | `m2.l6.b8` returned to core; the ordering rule and self-citation now fail as tests |
| The workload model priced one hypothetical learner | Three scenarios, per-block estimates written out per learner |
| "20 never assessed skills" was three findings in one word | Split; a third of the middle group verified as declaration artifacts by extracting constructs from every assessment program |
| January's check cost 29 minutes against a stated 20 | Restructured to 21 by removing the written explanation the oral defence already makes |
| The skill matrix compared its own totals against the PDF's | Removed. `reconcile-counts.ts` is the only script allowed that comparison |

## Core and bank

521 required tasks were each asked: if this disappeared from the required path, what unique educational evidence or progression role would be lost? A redundancy verdict was admissible only when it named specific earlier tasks on the same route that already carry the evidence.

| Month | Findings | Applied |
|---|---|---|
| 1 Қыркүйек | 2 | 0 — held for a human, see #6 |
| 2 Қазан | 1 | 1 |
| 3 Қараша | 4 | 4 |
| 4 Желтоқсан | 1 | 1 |
| 5 Қаңтар | 1 | 1 |
| 6 Ақпан | 2 | 2 |
| 7 Наурыз | 5 | 5 |
| 8 Сәуір | 1 | 0 — rejected |
| 9 Мамыр | 0 | 0 |

The rejected one, `m8.p5`, leans on `m8.l5.b6`, which is a `find_bug` — the learner repairs a program there, they do not produce one. April's other from-nothing running-best scan uses the empty-allowed convention; `m8.p5` uses the non-empty one, which has no other home on the required path. A different block type is usually a different task, which is a rule written for the auditors and not waivable for a tidier count.

3.3% of the required path came out. That is what a year of careful authoring leaves behind, and no target was set.

## Not audited

- **Whether the difficulty curve is right for a fourteen-year-old.** `FULL_YEAR_DIFFICULTY_AUDIT.md` says the curve rises and how steeply — a median from-scratch program of 2 lines in September and 38 in March. It cannot say March is reachable from November.
- **Whether the Kazakh is good Kazakh.** See #1.
- **Anything about Nova, execution providers, auth or the teacher backend.** Out of scope by instruction, and untouched apart from the two test fixes above.
