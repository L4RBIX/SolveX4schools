# Full-year skill evidence

48 skills, every column computed from the authored content rather than declared. Regenerate with `npx tsx scripts/skill-matrix.ts --markdown`.

| Column | What it means |
|---|---|
| **Introduced** | The month `skills.ts` assigns it, from the PDF's own per-month paragraphs. The only declared column. |
| **Practised** | Every month with an attempt block referencing it. A `concept` mentioning a skill is not practice. |
| **Independent** | Every month with a **core** block referencing it where the learner writes a whole program from nothing. Bank tasks do not count: a skill whose only from-nothing evidence is optional has none for the learner who does the required path and stops. |
| **Assessed** | Every month whose check or final tournament references it. |

## The one finding that could block a release

**Evidence and sampling are different questions, and only one of them can block.**

A skill with no whole-program evidence anywhere on the required path is one the curriculum cannot show a learner can use unaided — which is the programme's own headline promise, «Бөтен шешімді көшірмей, бағдарламаны өз бетінше жазады». A skill missing from one 20-minute check is a question about what a check is for.

Across 48 skills:

| | |
|---|---|
| **Evidence findings** | **1** |
| Sampling findings | 15 |

The single evidence finding is `contest.verdict_reading`, and it is a defect in the metric rather than in the curriculum. "Independent evidence" is defined as a whole program written from nothing, which is the right definition for a technique and the wrong one for a judgement: there is no program that demonstrates you can read a verdict correctly. What demonstrates it is choosing the right response to one, which is what all eight of its tasks ask, and the matrix records them as guided evidence in month 9.

**No skill has its only independent evidence in the optional bank.** That was checked separately, because a skill whose from-nothing task a learner may skip has no evidence for the learner who does the required path and stops.

## The six categories

Every column is computed from the authored content.

| Category | What it means |
|---|---|
| **Taught** | The month `skills.ts` assigns it, from the PDF's own per-month paragraphs. The only declared column. |
| **Guided** | The learner acts, but the program is not theirs to produce whole — a starter, a template, someone else's code to repair or reorder. Real evidence; not the «толық дербес шешім» the programme counts. |
| **Core independent** | A whole program from nothing, on the required path. This is what backs the promised ~100. |
| **Optional independent** | The same, in a bank task the learner may skip. |
| **Monthly assessed** | Sampled by that month's own «Айлық сынақ». |
| **Later assessed** | Sampled by a later check or by May's final tournament, but not by its own month's. |

## The three findings, kept apart

An earlier version of this script reported "20 never assessed skills" as one number. That was three different findings wearing one word, and they have different severities and different remedies.

### 1. Not monthly assessed — 3 skills

`loops.nested`, `graph.regions`, `contest.defend`.

Covered by May's final tournament, which declares twenty skills where a monthly check declares five or six. The learner does produce assessed evidence of these. What is true is that no single month's own check asked for it. That is an observation about the monthly checks, not a hole in the year.

### 2. Never assessed anywhere — 12 skills, of which 4 are not real

Nothing the learner is graded on, all year, declares these. But the list divides sharply.

**Declaration artifacts, not gaps — 3 skills.** `arith.basic`, `compare.operators`, `strings.sequence`. (`arith.remainder` was in this group and does not belong: `op.mod` reaches only 2 of the 9 assessments, so unlike the other three it is not pervasive enough for the argument below to carry it. It is a real finding, of the same kind as the five below.) An assessment block declares the three or four skills that are its *subject*, not every skill it touches. These three are touched constantly. Checked by extracting the constructs from every assessment program in the year:

| Skill | Constructs actually present in assessment code |
|---|---|
| `compare.operators` | `cmp.lt` (m2, m3, m5, m7, m8, m9), `cmp.gt` (m5, m8, m9), `cmp.le` (m1, m5, m6), `cmp.ge` (m1, m2, m6, m7, m9), `cmp.eq` (m3, m5, m7, m9) |
| `arith.basic` | `op.add` (all nine), `op.sub` (m5–m9), `op.mul` (m1, m6, m8, m9) |
| `strings.sequence` | `builtin.len` (m2, m3, m5, m7, m8, m9), `literal.str` (m1, m5, m6, m7, m9) |

A learner cannot pass eight of the nine checks without using comparison operators, and addition appears in all nine. Adding `compare.operators` to every assessment's `skillRefs` would close the metric and change nothing about what anyone is asked to do, which is why this document does not recommend it.

`arith.remainder` failed this same test and is why the test is worth running rather than asserting: `op.mod` reaches only two of the nine assessments, so it does not belong with the other three and sits below instead.

**Real findings — 6 skills.** Five where a month teaches a named technique and its own check never touches it, plus `arith.remainder`, which is practised in seven months and reaches assessment code in only two:

| Skill | Taught | The month's check is about |
|---|---|---|
| `precompute.prefix` | 4 Желтоқсан | sorting |
| `twopointers.core` | 5 Қаңтар | binary search |
| `enumerate.all` | 6 Ақпан | recursion |
| `graph.dfs` | 7 Наурыз | BFS and shortest paths |
| `graph.path_restore` | 7 Наурыз | BFS and shortest paths |
| `arith.remainder` | 1 Қыркүйек | — practised in seven months; `op.mod` reaches only m3 and m9 assessment code |

These are genuine. Each is a technique the month spends lessons on, and a learner could pass that month's check having never demonstrated it. Not fixed here: a monthly check is 20 minutes and holds one unseen problem plus an explanation, so covering a second technique means displacing the first — a design decision about what each check is *for*, not a metric to close. January's check is a worked instance of that constraint.

**May's process skills — 3 skills.** `contest.time_split`, `contest.verdict_reading`, `contest.upsolving`. May's assessment is the final tournament, which grades five unseen problems and two oral defences. It exercises all three of these — a tournament is where time-splitting and verdict-reading happen — and declares only `contest.defend`. This is closer to a declaration gap than a coverage gap, but unlike group one it is not verifiable from code, because these skills leave no construct behind.

### 3. No independent evidence anywhere — 1 skill

`contest.verdict_reading`. Eight tasks, none of them a whole program written from nothing.

This one is a defect in the metric, not in the curriculum. "Independent evidence" is defined as a from-nothing program, which is the right definition for a technique and the wrong one for a judgement. There is no program you can write that demonstrates you can read a verdict correctly; what demonstrates it is choosing the right response to one, which is what all eight of those tasks ask. The metric should exclude judgement skills, and until it does this row will keep appearing.

## Prerequisites

No skill is practised before the month `skills.ts` introduces it — the matrix checks this and reports nothing. Construct-level ordering is enforced separately and continuously by `tests/school/constructs-are-taught.test.ts`, which asserts that no block shows Python the curriculum has not yet taught, with the three September-inherited constructs declared in reverse so the exemption cannot silently grow.

## The matrix

| Skill | Taught | Guided | Core independent | Optional independent | Monthly assessed | Later assessed |
|---|---|---|---|---|---|---|
| `io.read` — Деректерді оқу | m1 | 1, 3, 4, 5, 9 | 1, 2, 4, 9 | — | 1, 4 | — |
| `io.print` — Жауапты шығару | m1 | 1 | 1, 4, 5 | — | 4 | — |
| `types.int_float` — Бүтін және бөлшек сандар | m1 | 1 | 1 | — | 1 | — |
| `arith.basic` — Арифметикалық амалдар | m1 | 1 | 1, 2, 4 | 2 | — | — |
| `arith.integer_division` — Бүтін бөлу | m1 | 1, 2, 3, 4, 5, 6 | 1, 2, 3, 4, 5, 6, 8, 9 | 3 | 1 | 9 |
| `arith.remainder` — Қалдық | m1 | 1, 2, 3, 6 | 1, 2, 3, 4, 6, 8, 9 | 2, 3 | — | — |
| `compare.operators` — Салыстыру амалдары | m1 | 1, 3, 5, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 9 | 2, 3 | — | — |
| `cond.if_elif_else` — if / elif / else шарттары | m1 | 1, 3 | 1, 2, 3, 4, 9 | — | 1 | 9 |
| `logic.and_or_not` — Логикалық амалдар (and, or, not) | m1 | 1, 4, 5 | 1, 3, 9 | — | 1 | — |
| `debug.boundary` — Шарт шекарасы | m1 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 2 | 1, 2, 5, 6, 7, 8 | 9 |
| `loops.for` — for циклі | m2 | 2, 3, 4, 7, 8 | 2, 3, 4, 5, 8, 9 | 2 | 2, 3, 4 | — |
| `loops.while` — while циклі | m2 | 2, 3, 5, 6, 7 | 2, 3, 5 | 3 | 2, 5 | — |
| `loops.counter` — Цикл санағышы | m2 | 2, 4, 9 | 2, 3, 4, 5, 7, 9 | 2, 7 | 2 | 9 |
| `loops.accumulator` — Жинақтаушы айнымалы | m2 | 2, 3, 4, 5, 9 | 2, 3, 4, 5, 8, 9 | 2, 4 | 2 | 9 |
| `lists.index` — Тізім индексі | m2 | 2, 3, 4, 5, 6, 7, 8, 9 | 2, 3, 4, 5, 6, 9 | 2, 3, 4 | 2, 5 | 9 |
| `lists.traverse` — Тізімді толық қарап шығу | m2 | 2, 3, 4, 5, 6, 8, 9 | 2, 3, 4, 5, 8, 9 | 2, 3 | 2, 3, 4, 8 | 9 |
| `strings.sequence` — Жолды таңбалар тізбегі ретінде өңдеу | m2 | 2, 3, 6, 9 | 2, 3, 6, 9 | 2, 3 | — | — |
| `loops.nested` — Ішкі циклдер | m2 | 2, 4, 6, 7, 8, 9 | 2, 4, 6, 7, 8, 9 | 2, 6, 7 | — | 9 |
| `func.define` — Функция жазу | m3 | 3, 5 | 3, 5, 6, 7, 9 | 3, 7 | 3, 6 | — |
| `func.parameters` — Параметр беру | m3 | 3, 5, 6 | 3, 6 | 3 | 3 | — |
| `func.return` — return арқылы нәтиже қайтару | m3 | 3, 5, 6 | 3, 6, 7, 9 | 3, 7 | 3, 6 | — |
| `func.reuse` — Функцияны бірнеше рет шақыру | m3 | 3 | 3, 5, 7, 9 | 3, 7 | 3 | — |
| `scope.local_global` — Жергілікті және жаһандық айнымалы | m3 | 3 | 3 | — | 3 | — |
| `perf.time_estimate` — Уақытқа үлгеруді бағалау | m4 | 4, 5, 6, 9 | 4, 6, 8, 9 | 4, 6 | 4 | 9 |
| `sort.basic` — Сандарды реттеу | m4 | 4, 5, 8, 9 | 4, 5, 8, 9 | 4 | 4 | 9 |
| `precompute.prefix` — Алдын ала есептеу | m4 | 4, 8, 9 | 4, 9 | — | — | — |
| `perf.compare_solutions` — Екі шешімді салыстыру | m4 | 4, 5, 7 | 4, 5, 8 | — | 4, 7 | — |
| `bsearch.core` — Екіге бөліп іздеу | m5 | 5 | 5, 9 | — | 5 | 9 |
| `bsearch.boundary` — Іздеу шекаралары | m5 | 5 | 5, 9 | — | 5 | 9 |
| `twopointers.core` — Екі шекара әдісі | m5 | 5, 7, 9 | 5, 9 | — | — | — |
| `enumerate.all` — Барлық нұсқаны тексеру | m6 | 6, 8, 9 | 6, 8, 9 | 6 | — | — |
| `recursion.core` — Өзін-өзі шақыратын функция | m6 | 6, 7, 8 | 6, 7, 9 | 7 | 6 | — |
| `recursion.base_case` — Тоқтату шарты | m6 | 6 | 6, 9 | — | 6 | — |
| `recursion.call_tree` — Шақырулар ағашы | m6 | 6 | 6 | — | 6 | — |
| `grid.cells` — Ұяшық және көрші ұяшық | m7 | 7, 8 | 7, 8, 9 | 7 | 7 | 9 |
| `graph.bfs` — Толқын әдісі (BFS) | m7 | 7 | 7, 9 | 7 | 7 | 9 |
| `graph.dfs` — Тереңдікке өту (DFS) | m7 | 7 | 7, 9 | 7 | — | — |
| `graph.regions` — Байланысқан аймақтар | m7 | 7 | 7, 9 | 7 | — | 9 |
| `graph.shortest_path` — Ең қысқа жол | m7 | 7 | 7, 9 | 7 | 7 | — |
| `graph.path_restore` — Маршрутты қалпына келтіру | m7 | 7 | 7 | — | — | — |
| `greedy.core` — Әр қадамда тиімді таңдау | m8 | 8, 9 | 8, 9 | — | 8 | 9 |
| `greedy.counterexample` — Қарсы мысал іздеу | m8 | 8, 9 | 8, 9 | — | 8 | 9 |
| `dp.core` — Алдыңғы жауаптар арқылы шешу | m8 | 8 | 8, 9 | — | 8 | 9 |
| `dp.table` — Қадамдап толтырылатын кесте | m8 | 8 | 8, 9 | — | 8 | 9 |
| `contest.time_split` — Есептер арасында уақыт бөлу | m9 | 9 | 9 | — | — | — |
| `contest.verdict_reading` — Тексеру жүйесінің хабарламасын оқу | m9 | 9 | — | — | — | — |
| `contest.upsolving` — Жарыстан кейін толық шешу | m9 | 9 | 9 | — | — | — |
| `contest.defend` — Шешімді ауызша қорғау | m9 | 9 | 9 | — | — | 9 |
