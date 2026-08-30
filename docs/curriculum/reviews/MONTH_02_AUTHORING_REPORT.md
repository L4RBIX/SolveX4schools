# Month 2 · Қазан — authoring report

Loops and lists. PDF p.7.

## What the source requires

| Requirement | Verbatim (PDF p.7) | Where it landed |
|---|---|---|
| Topic | «Қайталау және деректер жиыны: циклдер мен тізімдер (массивтер)» | the month's title |
| Mastery | for/while, loop counter, collecting into a list, index access, one full traversal, strings as sequences, simple nested loops | `m2.u1`–`m2.u3`, 8 skills |
| Step execution | «Басты құрал - бағдарламаның қадамдық орындалуы» | 6 `trace_code` blocks; the animation itself does not exist — see §Gaps |
| Index trainer | «**Бөлек тренажер** индекстерді көзге көрінетін етеді» | `m2.l4.b2`, a `visual_simulation` — renders as the honest "not ready" card today |
| Four typical errors | шексіз цикл · соңғы элементті өткізіп жіберу · индекстің шекарадан шығуы · жинақтаушыға қате бастапқы мән | one block each in `m2.l9`, plus `m2.l2.b4`, `m2.l3.b5`, `m2.l4.b5` |
| Extra block | «Қосымша - цикл мен индекс қатесін табу және қолмен трассалау» | `m2.u4` / `m2.l9`, a unit the stub did not have |
| Task count | «шамамен 38 тапсырма» | **86 authored** |
| Monthly check | hand-step an unfamiliar loop and list; solve a loop-and-list problem alone; explain why the loop stops and why the indices stay in bounds | `m2.as.b1` `manual_trace`, `m2.as.b2` `unseen_problem`, `m2.as.b4` `oral_explanation` — three modes, three graded tasks, which is what the sentence names |

## Volume

| | |
|---|---|
| Units | 5 (two of them new: `m2.u4` errors-and-tracing, `m2.u5` independent practice) |
| Lessons | 10 |
| Blocks | 100 |
| **Attempt-bearing blocks (tasks)** | **86** against 38 promised |
| Reference solutions executed | 37 |
| Test cases executed | 247 (184 of them hidden) |

### By block type

| Type | n | | Type | n |
|---|---|---|---|---|
| `write_code` | 31 | | `multiple_choice` | 5 |
| `fill_blank` | 12 | | `worked_example` | 4 |
| `prediction` | 8 | | `modify_code` | 4 |
| `find_bug` | 8 | | `reorder_code` | 3 |
| `concept` | 8 | | `explain` | 3 |
| `trace_code` | 6 | | `verify` | 3 |
| `test_case` | 2 | | `visual_simulation` | 2 |
| `challenge` | 1 | | | |

`concept`, `worked_example` and `visual_simulation` are **not** tasks and are
not counted in the 86. Blank editors are 31 of 86 tasks — 36% — so the month is
not the wall of empty editors the September audit found.

### Provenance

57 blocks `curriculum-derived` (each citing p.7 or, for the general
verification methods, p.6); 43 `product-authored`. Nothing claims the programme
said something it did not.

## Differentiation

Three genuinely different routes, measured through `publicLesson` /
`publicAssessment` — the projection the browser is actually served.

| Route | Blocks | Tasks | Assembling & completing | Blank editors |
|---|---|---|---|---|
| Қолдау (support) | 84 | 70 | **33** | **18** |
| Негізгі (core) | 86 | 72 | 24 | 29 |
| Тереңдетілген (advanced) | 91 | 77 | 24 | 32 |

That is the programme's rule («дайын кодты құрастыру мен толықтыру **көбірек**,
нөлден жазу азырақ») as an arithmetic fact, not a label: support gets nine more
assembly blocks and eleven fewer blank editors than core.

- **Nine scaffolded twins**, one per teaching lesson, each on the same problem
  as the task it substitutes for, each named `<id>s`.
- **Advanced-only**: `m2.l2.b8`, `m2.l8.b9` (written defence — `explain`),
  `m2.l5.b9`, `m2.l7.b9`, `m2.p10`.
- **Core + advanced, withheld from support without substitution**: `m2.l8.b8`
  (a `challenge`) and `m2.p9` (a practice-bank top rung). Both are genuinely
  harder problems rather than removed core work.
- The monthly check is **identical on all three routes**. A support learner
  passing an easier assessment would produce evidence that reads the same as a
  core learner's and means something else.

Enforced by `tests/school/tracks-every-month.test.ts`, which knows no block ids
and runs the same properties over every authored month.

## Technical correctness

Every reference solution in the month was executed by real Python against every
one of its own cases, compared with `checkOutput` — the same function that
grades a learner:

```
npx tsx scripts/check-blocks.ts schools/curriculum/months/m02/*.ts
  100 blocks · 37 reference solutions · 247 cases executed
  ✓ clean
npx vitest run tests/school/content-execution.test.ts   302 passed
npm run curriculum:validate                             0 errors
npx vitest run tests/nova/construct-context.test.ts     24 passed
```

Also proven, not asserted: every `prediction`'s stored answer is what Python
prints; every `find_bug`'s two programs visibly differ on a declared
`symptomInput`; every snippet the learner sees compiles; no block uses a
construct October has not taught.

### Defects found and corrected

| Where | What | Fix |
|---|---|---|
| `m2.l3.b8s` | its editable starting program was the byte-identical reference solution of `m2.l3.b7`, the from-scratch task support meets one card earlier | starts from `m2.l3.b6`'s digit counter, which the learner has already completed |
| `m2.l1.b8` / `b8s` | the task and its twin were the program the worked example `m2.l1.b7` prints one card earlier, with two of the twin's three answers stated in b7's prose | both now sum squares; copying b7 fails the **visible** sample (15 where 55 is expected) |
| `m2.l5.b6s` | the reorder was solvable by sorting on indentation — three lines already in place under the deterministic shuffle, the rest ordered by indent | a seventh line: two `print`s at indent 0 whose order only the prompt gives. Zero of seven now land in place |
| `tracks.test.ts` | bound to September, so October's nine twins were asserted about by no line of code | `tracks-every-month.test.ts`, id-free, over every authored month |
| `practice.ts` | header comment miscounted the twins (ten, not nine) and named a task that had moved | corrected |
| `m2.as.b3` | the written `explain` asked the learner's own program why it stopped and why `a[i]` stayed in range — the two questions `m2.as.b4` then asked out loud one screen later, and a fourth graded task in a check stated at 20 minutes | deleted; its one un-recitable idea, *reason about the program **you** wrote*, is now question (3) of `m2.as.b4`, in the mode the PDF names |

## Prerequisites

`npx vitest run tests/nova/construct-context.test.ts` — 24 passed. No block in
October uses a construct the curriculum has not shown by that point.

The month's construct budget is enforced mechanically by
`scripts/check-blocks.ts`, and the withholding is deliberate:

> `sorted()`, `reversed()`, `sum()`, `min()`, `max()`, `set()`, `dict()`,
> `enumerate()` are **not available in October**.

«Тізімдегі максимум мен минимум», «қосынды және орташа мән» and «тізімді кері
аудару» are this month's traversal exercises. A builtin would delete all three.
They arrive in December, where the learner has already written them by hand.
`s[::-1]` is likewise absent from every solution: the palindrome is a two-index
walk because that is what the month teaches.

## Localisation

All 100 blocks carry `kk` and `ru`. `content-execution.test.ts` asserts, for
every attempt block, that both exist and that the Russian is not a byte copy of
the Kazakh. Every program prints English tokens (`yes`/`no`, `even`/`odd`) named
in both prompts, so no learner can match glyphs instead of reasoning.

**Not yet verified by a native speaker.** The Kazakh and Russian reviewers were
launched but the session that ran them was interrupted; only the differentiation
dimension returned. Both languages remain the largest open item — see below.

## Human review required

1. **Kazakh and Russian, by native speakers.** Naturalness, register for a
   14-year-old, terminology against Kazakh school textbooks, and — the check
   that matters most — that the two languages describe the same problem, with
   the same numbers and boundaries, block by block.
2. **September's written-defence gap.** All three of September's `explain`
   blocks go to every route, so Тереңдетілген is asked for nothing in writing
   that Негізгі is not. That contradicts PDF p.6 («шешімді жазбаша қорғау
   міндетті»). Inherited, not introduced here. `tracks-every-month.test.ts`
   asserts the exemption in reverse, so closing it makes the test ask for the
   exemption to be deleted. **Whether to re-cut a frozen month's
   differentiation is a curriculum decision, not a test's.**
3. **Timing.** The monthly check is authored to fit 20 minutes; nobody has sat
   it with a stopwatch. September's original check timed at 32+ minutes against
   a stated 20.
4. **Difficulty calibration for a real Grade 9 cohort.** 86 tasks against a
   promised 38 is deliberate over-delivery, but no fourteen-year-old has
   attempted any of it.

## Known gaps

- **The index trainer the PDF names does not animate.** `m2.l4.b2` declares
  `visual_simulation`, and eight of the nine visualisers render an honest "not
  ready" card. Six `trace_code` blocks carry the same ground with the learner
  writing the values down instead of watching them. Recorded in
  `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1.
- **Seven of the eight review dimensions did not report.** Technical
  correctness, prerequisites, Kazakh, Russian, assessment, edge cases and
  beginner solvability were launched adversarially and interrupted. The
  automated gates above all pass, but automated gates are not the same as a
  reviewer trying to break the month, and this report does not claim they are.

## Status

`implemented`. **Not** `published`: publication here is a gate with an approval
row and a content hash (`schools/curriculum/gate.ts`, migration 0013), and
automated validation is not a human signing off on a fourteen-year-old's school
year.
