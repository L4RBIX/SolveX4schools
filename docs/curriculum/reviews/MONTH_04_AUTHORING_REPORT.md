# Month 4 · Желтоқсан — authoring report

Speed, sorting and precomputation. PDF p.8.

## What the source requires

| Requirement | Verbatim (PDF p.8) | Where it landed |
|---|---|---|
| Topic | «Бағдарламаның жылдамдығы: сұрыптау және алдын ала есептеу» | the month's title |
| The idea | «дұрыс жауап тым кеш шықса, қабылданбайды» | `m4.l1.b1`, with the 10⁷–10⁸ steps-per-second rule stated once and used all month |
| The device | «Айдың басты тәсілі - бір есептің екі шешімін салыстыру» | `m4.l2` — both programs on screen, both correct, one impossible |
| Task type 1 | «осы бағдарлама үлгере ме?» | `m4.l1.b4`, `m4.l1.b5`, `m4.l1.b7`, `m4.as.b1` |
| Task type 2 | «үлгермейтін мысал ойлап тап» | `m4.l2.b5`, a `test_case` — `breakingInputs` names the size |
| Families | сандарды реттеу · үшінші мәнді табу · әртүрлі мәндер саны · ең жиі кездесетін сан · тізім бөлігінің қосындысы · медиананы табу | `m4.l3`, `m4.l4`, `m4.l7`, `m4.l5`, and the practice bank |
| Task count | «шамамен 32 тапсырма» | **67 authored** |
| Monthly check | «Шартты алған соң кодқа отырмас бұрын қай шешім уақыт бойынша үлгеретінін айтып, таңдауын негіздейді» | `m4.as.b1` judgement → `b2` written justification → `b3` the code → `b4` oral |

The seventh lesson, `m4.l7`, is new. Three of the six named families —
«тізімдегі әртүрлі мәндер саны», «ең жиі кездесетін сан», «медиананы табу» —
are all *sort, then walk the sorted list*, which is a different move from
*sorting makes the extremes easy*. `set()` and `dict()` stay forbidden precisely
so that those two remain the exercise the programme put in the sorting month
rather than a one-liner.

## Volume

| | |
|---|---|
| Units | 4 |
| Lessons | 8 (7 teaching + 1 practice bank) |
| Blocks | 79 |
| **Attempt-bearing blocks (tasks)** | **67** against 32 promised |
| Reference solutions executed | 32 |
| Test cases executed | 256 (194 hidden) |

### By block type

| Type | n | | Type | n |
|---|---|---|---|---|
| `write_code` | 24 | | `find_bug` | 5 |
| `multiple_choice` | 8 | | `trace_code` | 3 |
| `prediction` | 7 | | `explain` | 3 |
| `fill_blank` | 7 | | `verify` | 2 |
| `concept` | 6 | | `test_case` | 1 |
| `worked_example` | 6 | | `challenge` | 1 |
| `modify_code` | 6 | | | |

42 blocks `curriculum-derived`, 37 `product-authored`.

The high `multiple_choice` count is the month's shape rather than an accident:
«үлгере ме?» is a judgement, and a judgement is a choice between two correct
solutions of different cost — not a program.

## Differentiation

| Route | Blocks | Tasks | Assembling & completing | Blank editors |
|---|---|---|---|---|
| Қолдау (support) | 65 | 53 | **21** | **13** |
| Негізгі (core) | 67 | 55 | 14 | 22 |
| Тереңдетілген (advanced) | 72 | 60 | 14 | 25 |

Seven scaffolded twins (`m4.l1.b8s`, `l2.b7s`, `l3.b7s`, `l4.b7s`, `l5.b8s`,
`l6.b7s`, `l7.b8s`). Five advanced-only blocks, two of them the written defence
the programme makes compulsory for Тереңдетілген.

## Technical correctness

```
npx tsx scripts/check-blocks.ts schools/curriculum/months/m04/*.ts
  79 blocks · 32 reference solutions · 256 cases executed
  ✓ clean
npm run curriculum:validate                              0 errors
npx vitest run tests/school/constructs-are-taught.test.ts  2 passed
npx vitest run tests/school/tracks-every-month.test.ts     passed
```

December is clean under the **stricter** checker introduced after October's
review — the one that refuses any reference solution byte-identical to a program
the learner has been shown, reading sibling lesson files to do it.

### The one enforceable clock in the whole year

`m4.l2.b6` is the only block in the programme where a time limit actually bites.
`EXECUTION_LIMITS.timeLimitMs` is 5 s and `time_limit_exceeded` is a real status,
so a task with a tiny input and enormous work is genuinely enforceable. Its
author measured the loop at ~0.9 s for n = 10⁷ on this machine and set the bound
at 10⁹ — about 90 s for the loop, instant for the formula. 10⁸ would have landed
near the limit, which is a coin toss dressed as a lesson.

Everywhere else the constraint is stated in the prompt and only correctness is
graded. See `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §3.

### Defects found and corrected

| Where | What | Fix |
|---|---|---|
| `m4.as.b2`, `m4.as.b4` | the check declared 20 minutes and cost ~38: a multiple choice, a from-scratch coding problem, and **eight** written or spoken sub-answers | both trimmed to two questions; the marking points cut to match rather than left asking a teacher to score answers nobody was asked for. 38 → 22 min |

The trim is the same defect the reviewers found in October and November and that
September shipped with. It is now caught by `validate.ts`, which costs an
`explain` prompt per *question*.

## Prerequisites

`sorted()`, `.sort()`, `reversed()`, `min()`, `max()` and `sum()` **arrive this
month**, and the withholding was the point: «тізімдегі максимум мен минимум» is
October's traversal exercise and «максимум мен минимум функциясы» is November's.
A builtin in either month would have deleted the task the programme names. By
December the learner has written them twice by hand.

They are announced in `m4.l1.b1` and `m4.l3.b1` in prose. That matters for a
reason worth recording: the first version of
`tests/school/constructs-are-taught.test.ts` read only `code` fields and
reported all four as never-taught — four false alarms out of eight findings. The
test now reads backticked spans in prose too.

`set()`, `dict()` and every import remain forbidden.

## Localisation

All 79 blocks carry `kk` and `ru`, asserted distinct for every attempt block.
Programs print English tokens named in both prompts.

**Not yet verified by a native speaker.**

## Human review required

1. **Kazakh and Russian, by native speakers.** The same open item as every other
   month. The reviewers who covered October and November returned six grammar
   findings between them; December has not been read at all.
2. **Nine blocks whose expected output spans several lines under a `token`
   checker** — `m4.l1.b7`, `m4.l5.b8`, `m4.l5.b8s`, `m4.l6.b4`, `m4.l6.b6`,
   `m4.l6.b7`, `m4.l6.b7s`, `m4.l6.b8`, `m4.p8`. `token` accepts them all on one
   line. Whether that is right depends on whether each prompt claims a layout,
   which is an author's judgement the checker cannot make. Flagged by
   `check-blocks` as warnings.
3. **Timing.** 22 estimated minutes against a stated 20 is within the model's
   noise, but nobody has sat the check with a stopwatch.
4. **The 10⁷–10⁸ steps-per-second figure** is a teaching simplification. A
   maths-literate reviewer should confirm it is the right lie to tell a
   fourteen-year-old.

## Known gaps

- **`precompute.prefix` is practised but never assessed.** Prefix sums are one
  of December's three units and one of the families the PDF names by hand, and
  the monthly check does not touch them: `m4.as.b3`'s unseen problem is sort +
  traverse. Found by `scripts/skill-matrix.ts`, which derives the column.
  Not fixed here, deliberately — `m4.as.b1` is a well-built judgement block and
  degrading it to cover prefix sums would be worse than recording the gap. The
  fix for a future revision is to make the assessment's unseen problem a
  range-query problem, so the same block covers both. Recorded in
  `docs/curriculum/FULL_YEAR_CONTENT_AUDIT.md`.
- **The two-solution race does not exist.** «Платформа баяу және жылдам шешімді
  үлкен деректерде қатар іске қосып, айырманы оқушыға көзбен көрсетеді» — there
  is no visualiser for it and no enum value it could use. The comparison happens
  in the content instead: both programs on screen, step counts stated,
  `m4.l2.b5` asking for the input that breaks the slow one.
  `RUNTIME_INTEGRATION_REQUIREMENTS.md` §1 and §3.
- **No adversarial review has run against this month.** The gates pass; the
  gates passed October too, and six reviewers then found 24 things.

## Status

`implemented`. Not `published`.
