# Month 3 · Қараша — authoring report

Functions, parameters, return, scope. PDF p.8.

## What the source requires

November is the only month in the programme whose paragraph **counts** things,
so it is the only month where "met the requirement" is checkable rather than
arguable.

| Requirement | Verbatim (PDF p.8) | Where it landed |
|---|---|---|
| Lesson count | «**Сегіз** қысқа сабақ» | **8 teaching lessons** — the stub had 7 |
| Worked examples | «**алты** толық талданған мысал» | **6** — `m3.l1.b2`, `m3.l2.b2`, `m3.l3.b2`, `m3.l8.b2`, `m3.l5.b2`, `m3.l6.b2` |
| Mastery | split repeated logic into a function; parameters; `return`; call repeatedly; local vs global; why misplaced global state is dangerous | `m3.u1`–`m3.u3`, 5 skills |
| Named question 1 | «неге бұл айнымалы мұнда көрінбейді?» | `m3.l4`, the lesson is built around it |
| Named question 2 | «неге global күтпеген нәтиже берді?» | `m3.l5` — the only appearance of `global` in the whole year |
| Task count | «шамамен 34 тапсырма» | **75 authored** |
| Monthly check | write a program of at least 2–3 functions alone; explain each function's job and the parameter/return relationship; plus a scope question and one risk of using a global | `m3.as.b1`–`b4` |
| Prohibition | «**OOP-ке дейінгі** процедуралық база» | no `class`, no objects, anywhere |

The eighth lesson, `m3.l8`, is taught **fourth** — straight after `return` —
because helper functions over lists and strings are what `return` is for, and
three of the PDF's eight practice families live there. Its id is 8 because 8 was
the next free number; September set that convention when it inserted `m1.l10`,
`m1.l11` and `m1.l12` mid-month rather than renumbering everything after them.

The practice bank at `m3.l9` is deliberately **not** one of the eight. The PDF
counts «қысқа сабақ» — short explanation lessons — and a bank of unscaffolded
problems explains nothing. September has the same shape at `m1.l9`.

## Volume

| | |
|---|---|
| Units | 4 |
| Lessons | 9 (8 teaching + 1 practice bank) |
| Blocks | 89 |
| **Attempt-bearing blocks (tasks)** | **75** against 34 promised |
| Reference solutions executed | 30 |
| Test cases executed | 205 |

### By block type

| Type | n | | Type | n |
|---|---|---|---|---|
| `write_code` | 23 | | `multiple_choice` | 5 |
| `fill_blank` | 13 | | `explain` | 4 |
| `concept` | 8 | | `trace_code` | 4 |
| `prediction` | 7 | | `verify` | 3 |
| `find_bug` | 7 | | `reorder_code` | 2 |
| `worked_example` | 6 | | `test_case` | 1 |
| `modify_code` | 5 | | `challenge` | 1 |

48 blocks `curriculum-derived` (citing p.8, or p.6 for the general verification
methods); 41 `product-authored`.

## Differentiation

| Route | Blocks | Tasks | Assembling & completing | Blank editors |
|---|---|---|---|---|
| Қолдау (support) | 75 | 61 | **30** | **13** |
| Негізгі (core) | 77 | 63 | 23 | 22 |
| Тереңдетілген (advanced) | 81 | 67 | 23 | 24 |

Support gets seven more assembly blocks and nine fewer blank editors than core —
«дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ» as arithmetic.
Advanced carries `explain` blocks core does not, which is «шешімді жазбаша қорғау
міндетті». All three routes sit the same monthly check.

Enforced by `tests/school/tracks-every-month.test.ts`, which knows no block ids.

## Technical correctness

```
npx tsx scripts/check-blocks.ts schools/curriculum/months/m03/*.ts
  89 blocks · 30 reference solutions · 205 cases executed
  ✓ clean
npm run curriculum:validate                             0 errors · 215/279 built
npx vitest run tests/nova/construct-context.test.ts     24 passed
npx vitest run tests/school/tracks-every-month.test.ts  22 passed
```

### Defects found and corrected

| Where | What | Fix |
|---|---|---|
| `m3.p10` | shipped the same visible case twice (`10 → 4`), so one of them tested nothing | now `n = 11`, hidden: keeps what the duplicate was for (9 is below it, so a primality test that only rejects evens still fails) and adds the boundary «ҚАТАҢ кіші» actually turns on — 11 is prime, so a loop running to `n` inclusive answers 5 |
| months 3–8 | the practice-bank lessons hardcoded `status: "implemented"` while their block arrays were empty placeholders, so the validator reported ten errors about scaffolding rather than content | status derived from the bank's length, the way `buildLesson` already does it |
| `m03/practice.ts.tmp.*` | an atomic-write temporary from a crashed writer was committed as junk | removed; `*.ts.tmp.*` added to `.gitignore`. The real `practice.ts` was verified complete first — all ten ids present, check-blocks clean |

The lesson agents also caught several near-misses in their own drafts before
returning: `m3.l6.b1`'s concept program duplicated `m3.l8.b2`'s worked example,
`m3.l6.b4` echoed `m3.l5`'s, `m3.l6.b6`'s wiring was transcribable from the
worked example above it, and `m3.l6.b7s`'s filled template was byte-identical to
`m3.l6.b7`'s reference solution — the exact defect the October review found.
All four were rewritten before the file landed, and a byte-comparison of all
programs in the month against each other found zero duplicates.

## Prerequisites

`construct-context` passes: nothing in November uses a construct the curriculum
has not shown by that point.

The withholding that matters this month:

> `sorted()`, `.sort()`, `reversed()`, `sum()`, `min()`, `max()` are **still
> forbidden**, for one more month.

November's own practice list asks the learner to write «максимум мен минимум
функциясы» — the max/min *function*. A builtin here would delete the task the
programme names. They arrive in December, after the learner has written them
twice by hand: once as a loop in October, once as a function here.

`global` appears exactly once in the year, in `m3.l5`, as the failure to be
analysed. It is in no reference solution as a recommended technique.

## Localisation

All 89 blocks carry `kk` and `ru`, asserted distinct for every attempt block.
Programs print English tokens named in both prompts.

**Not yet verified by a native speaker** — the same open item as October.

## Human review required

1. **Kazakh and Russian, by native speakers.** Naturalness, register, school
   terminology, and that the two languages describe the same problem block by
   block.
2. **Timing.** The monthly check is authored to fit 20 minutes; nobody has sat
   it with a stopwatch.
3. **Difficulty calibration.** 75 tasks against 34 promised is deliberate
   over-delivery; no fourteen-year-old has attempted any of it.
4. **Whether eight teaching lessons is the right reading.** The PDF says «сегіз
   қысқа сабақ»; this implementation counts the eight explanation lessons and
   excludes the practice bank. A curriculum reviewer should confirm that is what
   the school meant.

## Known gaps

- **The call visualiser does not exist.** The programme asks the platform to
  show «қандай параметр мәндері кіретінін, қандай жергілікті айнымалылар пайда
  болатынын және return кезінде не қайтатынын». Four `trace_code` blocks carry
  that ground with the learner writing the values down instead of watching them.
  Recorded in `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1.
- **No adversarial review has run against this month.** October's review found
  three answer leaks that every automated gate passed; November has had the
  gates but not the reviewers. Its lesson agents applied October's two findings
  pre-emptively, which is not the same thing.

## Status

`implemented`. Not `published`.
