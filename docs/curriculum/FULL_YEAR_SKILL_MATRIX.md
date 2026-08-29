# Full-year skill evidence

48 skills, every column computed from the authored content rather than declared. Regenerate with `npx tsx scripts/skill-matrix.ts --markdown`.

| Column | What it means |
|---|---|
| **Introduced** | The month `skills.ts` assigns it, from the PDF's own per-month paragraphs. The only declared column. |
| **Practised** | Every month with an attempt block referencing it. A `concept` mentioning a skill is not practice. |
| **Independent** | Every month with a **core** block referencing it where the learner writes a whole program from nothing. Bank tasks do not count: a skill whose only from-nothing evidence is optional has none for the learner who does the required path and stops. |
| **Assessed** | Every month whose check or final tournament references it. |

## The three findings, kept apart

An earlier version of this script reported "20 never assessed skills" as one number. That was three different findings wearing one word, and they have different severities and different remedies.

### 1. Not monthly assessed — 3 skills

`loops.nested`, `graph.regions`, `contest.defend`.

Covered by May's final tournament, which declares twenty skills where a monthly check declares five or six. The learner does produce assessed evidence of these. What is true is that no single month's own check asked for it. That is an observation about the monthly checks, not a hole in the year.

### 2. Never assessed anywhere — 12 skills, of which 4 are not real

Nothing the learner is graded on, all year, declares these. But the list divides sharply.

**Declaration artifacts, not gaps — 4 skills.** `arith.basic`, `compare.operators`, `arith.remainder`, `strings.sequence`. An assessment block declares the three or four skills that are its *subject*, not every skill it touches. These four are touched constantly. Checked by extracting the constructs from every assessment program in the year:

| Skill | Constructs actually present in assessment code |
|---|---|
| `compare.operators` | `cmp.lt` (m2, m3, m5, m7, m8, m9), `cmp.gt` (m5, m8, m9), `cmp.le` (m1, m5, m6), `cmp.ge` (m1, m2, m6, m7, m9), `cmp.eq` (m3, m5, m7, m9) |
| `arith.basic` | `op.add` (all nine), `op.sub` (m5–m9), `op.mul` (m1, m6, m8, m9) |
| `arith.remainder` | `op.mod` (m3, m9) |
| `strings.sequence` | `builtin.len` (m2, m3, m5, m7, m8, m9), `literal.str` (m1, m5, m6, m7, m9) |

A learner cannot pass eight of the nine checks without using comparison operators. Adding `compare.operators` to every assessment's `skillRefs` would close the metric and change nothing about what anyone is asked to do, which is why this document does not recommend it.

**Real findings — 5 skills.** A month teaches a named technique and its own check never touches it:

| Skill | Taught | The month's check is about |
|---|---|---|
| `precompute.prefix` | 4 Желтоқсан | sorting |
| `twopointers.core` | 5 Қаңтар | binary search |
| `enumerate.all` | 6 Ақпан | recursion |
| `graph.dfs` | 7 Наурыз | BFS and shortest paths |
| `graph.path_restore` | 7 Наурыз | BFS and shortest paths |

These are genuine. Each is a technique the month spends lessons on, and a learner could pass that month's check having never demonstrated it. Not fixed here: a monthly check is 20 minutes and holds one unseen problem plus an explanation, so covering a second technique means displacing the first — a design decision about what each check is *for*, not a metric to close. January's check is a worked instance of that constraint.

**May's process skills — 3 skills.** `contest.time_split`, `contest.verdict_reading`, `contest.upsolving`. May's assessment is the final tournament, which grades five unseen problems and two oral defences. It exercises all three of these — a tournament is where time-splitting and verdict-reading happen — and declares only `contest.defend`. This is closer to a declaration gap than a coverage gap, but unlike group one it is not verifiable from code, because these skills leave no construct behind.

### 3. No independent evidence anywhere — 1 skill

`contest.verdict_reading`. Eight tasks, none of them a whole program written from nothing.

This one is a defect in the metric, not in the curriculum. "Independent evidence" is defined as a from-nothing program, which is the right definition for a technique and the wrong one for a judgement. There is no program you can write that demonstrates you can read a verdict correctly; what demonstrates it is choosing the right response to one, which is what all eight of those tasks ask. The metric should exclude judgement skills, and until it does this row will keep appearing.

## Prerequisites

No skill is practised before the month `skills.ts` introduces it — the matrix checks this and reports nothing. Construct-level ordering is enforced separately and continuously by `tests/school/constructs-are-taught.test.ts`, which asserts that no block shows Python the curriculum has not yet taught, with the three September-inherited constructs declared in reverse so the exemption cannot silently grow.

## The matrix

| Skill | Introduced | Practised | Independent evidence | Assessed | Tasks |
|---|---|---|---|---|---|
| `io.read` — Деректерді оқу | 1 | 1, 2, 3, 4, 5, 9 | 1, 2, 4, 9 | 1, 4 | 26 |
| `io.print` — Жауапты шығару | 1 | 1, 4, 5 | 1, 4, 5 | 4 | 7 |
| `types.int_float` — Бүтін және бөлшек сандар | 1 | 1 | 1 | 1 | 7 |
| `arith.basic` — Арифметикалық амалдар | 1 | 1, 2, 4 | 1, 2, 4 | — | 11 |
| `arith.integer_division` — Бүтін бөлу | 1 | 1, 2, 3, 4, 5, 6, 8, 9 | 1, 2, 3, 4, 5, 6, 8, 9 | 1, 9 | 38 |
| `arith.remainder` — Қалдық | 1 | 1, 2, 3, 4, 6, 8, 9 | 1, 2, 3, 4, 6, 8, 9 | — | 43 |
| `compare.operators` — Салыстыру амалдары | 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 9 | — | 37 |
| `cond.if_elif_else` — if / elif / else шарттары | 1 | 1, 2, 3, 4, 9 | 1, 2, 3, 4, 9 | 1, 9 | 36 |
| `logic.and_or_not` — Логикалық амалдар (and, or, not) | 1 | 1, 3, 4, 5, 9 | 1, 3, 9 | 1 | 16 |
| `debug.boundary` — Шарт шекарасы | 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 5, 6, 7, 8, 9 | 140 |
| `loops.for` — for циклі | 2 | 2, 3, 4, 5, 7, 8, 9 | 2, 3, 4, 5, 8, 9 | 2, 3, 4 | 65 |
| `loops.while` — while циклі | 2 | 2, 3, 5, 6, 7 | 2, 3, 5 | 2, 5 | 42 |
| `loops.counter` — Цикл санағышы | 2 | 2, 3, 4, 5, 7, 9 | 2, 3, 4, 5, 7, 9 | 2, 9 | 45 |
| `loops.accumulator` — Жинақтаушы айнымалы | 2 | 2, 3, 4, 5, 8, 9 | 2, 3, 4, 5, 8, 9 | 2, 9 | 54 |
| `lists.index` — Тізім индексі | 2 | 2, 3, 4, 5, 6, 7, 8, 9 | 2, 3, 4, 5, 6, 9 | 2, 5, 9 | 106 |
| `lists.traverse` — Тізімді толық қарап шығу | 2 | 2, 3, 4, 5, 6, 8, 9 | 2, 3, 4, 5, 8, 9 | 2, 3, 4, 8, 9 | 87 |
| `strings.sequence` — Жолды таңбалар тізбегі ретінде өңдеу | 2 | 2, 3, 6, 9 | 2, 3, 6, 9 | — | 24 |
| `loops.nested` — Ішкі циклдер | 2 | 2, 4, 6, 7, 8, 9 | 2, 4, 6, 7, 8, 9 | 9 | 49 |
| `func.define` — Функция жазу | 3 | 3, 5, 6, 7, 9 | 3, 5, 6, 7, 9 | 3, 6 | 61 |
| `func.parameters` — Параметр беру | 3 | 3, 5, 6 | 3, 6 | 3 | 56 |
| `func.return` — return арқылы нәтиже қайтару | 3 | 3, 5, 6, 7, 9 | 3, 6, 7, 9 | 3, 6 | 77 |
| `func.reuse` — Функцияны бірнеше рет шақыру | 3 | 3, 5, 7, 9 | 3, 5, 7, 9 | 3 | 39 |
| `scope.local_global` — Жергілікті және жаһандық айнымалы | 3 | 3 | 3 | 3 | 15 |
| `perf.time_estimate` — Уақытқа үлгеруді бағалау | 4 | 4, 5, 6, 8, 9 | 4, 6, 8, 9 | 4, 9 | 45 |
| `sort.basic` — Сандарды реттеу | 4 | 4, 5, 8, 9 | 4, 5, 8, 9 | 4, 9 | 59 |
| `precompute.prefix` — Алдын ала есептеу | 4 | 4, 8, 9 | 4, 9 | — | 26 |
| `perf.compare_solutions` — Екі шешімді салыстыру | 4 | 4, 5, 7, 8 | 4, 5, 8 | 4, 7 | 26 |
| `bsearch.core` — Екіге бөліп іздеу | 5 | 5, 9 | 5, 9 | 5, 9 | 33 |
| `bsearch.boundary` — Іздеу шекаралары | 5 | 5, 9 | 5, 9 | 5, 9 | 31 |
| `twopointers.core` — Екі шекара әдісі | 5 | 5, 7, 9 | 5, 9 | — | 33 |
| `enumerate.all` — Барлық нұсқаны тексеру | 6 | 6, 8, 9 | 6, 8, 9 | — | 40 |
| `recursion.core` — Өзін-өзі шақыратын функция | 6 | 6, 7, 8, 9 | 6, 7, 9 | 6 | 48 |
| `recursion.base_case` — Тоқтату шарты | 6 | 6, 9 | 6, 9 | 6 | 25 |
| `recursion.call_tree` — Шақырулар ағашы | 6 | 6 | 6 | 6 | 17 |
| `grid.cells` — Ұяшық және көрші ұяшық | 7 | 7, 8, 9 | 7, 8, 9 | 7, 9 | 40 |
| `graph.bfs` — Толқын әдісі (BFS) | 7 | 7, 9 | 7, 9 | 7, 9 | 37 |
| `graph.dfs` — Тереңдікке өту (DFS) | 7 | 7, 9 | 7, 9 | — | 10 |
| `graph.regions` — Байланысқан аймақтар | 7 | 7, 9 | 7, 9 | 9 | 17 |
| `graph.shortest_path` — Ең қысқа жол | 7 | 7, 9 | 7, 9 | 7 | 16 |
| `graph.path_restore` — Маршрутты қалпына келтіру | 7 | 7 | 7 | — | 8 |
| `greedy.core` — Әр қадамда тиімді таңдау | 8 | 8, 9 | 8, 9 | 8, 9 | 22 |
| `greedy.counterexample` — Қарсы мысал іздеу | 8 | 8, 9 | 8, 9 | 8, 9 | 18 |
| `dp.core` — Алдыңғы жауаптар арқылы шешу | 8 | 8, 9 | 8, 9 | 8, 9 | 35 |
| `dp.table` — Қадамдап толтырылатын кесте | 8 | 8, 9 | 8, 9 | 8, 9 | 34 |
| `contest.time_split` — Есептер арасында уақыт бөлу | 9 | 9 | 9 | — | 10 |
| `contest.verdict_reading` — Тексеру жүйесінің хабарламасын оқу | 9 | 9 | — | — | 8 |
| `contest.upsolving` — Жарыстан кейін толық шешу | 9 | 9 | 9 | — | 8 |
| `contest.defend` — Шешімді ауызша қорғау | 9 | 9 | 9 | 9 | 8 |
