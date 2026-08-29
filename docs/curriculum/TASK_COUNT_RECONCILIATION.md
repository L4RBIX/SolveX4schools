# Task-count reconciliation

**The comparison this workstream reported for most of its life — "475 authored
against 279 promised" — was not a comparison.** The two numbers were different
units. 279 is the sum of the PDF's nine per-month «Практика: шамамен N
тапсырма» figures. 475 was every attempt-bearing block in the repository, with
monthly checks, May's contest problems and the deliberately-optional extras all
folded in. Nothing that compares those two can be right in either direction.

This page replaces it.

## What the programme means by «тапсырма»

The document is explicit in three places, and they agree.

**p.3, «Тапсырма түрлері»** enumerates the task types outright:

> Нөлден жазу ғана емес: дайын бөліктерден құрастыру, бөтен кодтан қате іздеу,
> нәтижені болжау, жетіспейтін жолды толықтыру.

Writing from scratch, assembling from ready parts, finding a bug in someone
else's code, predicting the result, completing a missing line. That is our block
taxonomy almost one-to-one — `write_code`, `reorder_code`, `find_bug`,
`prediction`, `fill_blank` — so «тапсырма» is **not** "coding problem". It is
any block the learner acts on, which is exactly `ATTEMPT_BLOCK_TYPES`.

**Each month** states «Практика: шамамен N тапсырма» and then, in a separate
paragraph, «Айлық сынақ». The monthly check sits outside the practice count.

**p.11** gives the year as «шамамен 250 оқу тапсырмасы, оның ішінде шамамен 100
толық дербес шешім» — about 250 tasks, *of which* about 100 are complete
independent solutions. A 250 that already contains the 100 only makes sense on
the reading above: a mixed total of everything the learner does, with
from-scratch solutions as a subset.

The same row carries the qualifier that decides where optional work sits:

> Бұл минимум жиын; платформада **қосымша есептер** бар және белсенді оқушы
> бұдан көбірек шығарады.

A floor, with additional problems beyond it anticipated by the document itself.
That is what the `bank` field marks, and it is why bank tasks are excluded from
the comparable figure rather than counted against the promise.

## The mapping

| PDF | Implementation |
|---|---|
| «Практика: шамамен N тапсырма» | attempt blocks **in lessons**, core route, **not** in the bank |
| «толық дербес шешім» | `write_code` with no starter, `challenge`, `verify(unseen_problem)` |
| «Айлық сынақ» | `month.assessment.blocks` — counted separately, as the PDF counts it |
| «қосымша есептер» (p.11) | blocks carrying `bank` |
| «Түсіндіру» | `concept`, `worked_example`, `visual_simulation` — not tasks |
| May's «Практика: төрт 45 минуттық жаттығу жарысы…» | the contest blocks ARE May's practice, so they are included |

## The corrected comparison

| Month | PDF «тапсырма» | Practice (comparable) | · independent | · guided coding | · other interaction | Explanation | Assessment | Contest | Bank | All blocks |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 Қыркүйек | 36 | **44** (+8) | 25 | 1 | 18 | 18 | 4 | 0 | 0 | 66 |
| 2 Қазан | 38 | **60** (+22) | 21 | 3 | 36 | 15 | 3 | 0 | 8 | 86 |
| 3 Қараша | 34 | **59** (+25) | 22 | 4 | 33 | 14 | 3 | 0 | 0 | 76 |
| 4 Желтоқсан | 32 | **51** (+19) | 22 | 2 | 27 | 12 | 4 | 0 | 0 | 67 |
| 5 Қаңтар | 30 | **59** (+29) | 19 | 5 | 35 | 12 | 4 | 0 | 0 | 75 |
| 6 Ақпан | 30 | **51** (+21) | 19 | 3 | 29 | 10 | 4 | 0 | 0 | 65 |
| 7 Наурыз | 26 | **48** (+22) | 17 | 2 | 29 | 10 | 4 | 0 | 0 | 62 |
| 8 Сәуір | 28 | **43** (+15) | 17 | 1 | 25 | 13 | 4 | 0 | 0 | 60 |
| 9 Мамыр | 25 | **42** (+17) | 4 | 2 | 16 | 9 | 7 | 20 | 0 | 58 |
| **Year** | **279** | **457** | **166** | 23 | 248 | 113 | 37 | 20 | 8 | 615 |

## What it says

**457 comparable practice tasks against a promised 279, and 166 independent
solutions against a promised ~100.** Both are about 64% above the figure the
programme states.

Two things follow, and they point in opposite directions.

The over-delivery is **real, not an artifact of the old bad comparison**.
Correcting the units moved the number from 475 to 457; it did not move it to
279. Every month carries 15 to 29 more comparable tasks than its own paragraph
names.

But over-delivery is **not by itself a defect**, because p.11 calls its own
figures a minimum and anticipates additional problems. The question the counts
cannot answer is whether the required path still fits the hours the programme
allots — 2,5 сағат theory and 6 сағат practice a month (p.5). That is a question
about minutes, not tasks, and it is answered in
`docs/curriculum/FULL_YEAR_WORKLOAD_MODEL.md`.

## Numbers that must not be collapsed again

| Figure | Year total (core route) |
|---|---|
| Total blocks | 615 |
| Attempt blocks | 502 |
| **PDF-comparable practice tasks** | **457** |
| — of which independent solutions | 166 |
| — of which guided coding | 23 |
| — of which other interaction | 248 |
| Explanation blocks (not tasks) | 113 |
| Assessment tasks | 37 |
| Contest tasks | 20 |
| Optional bank tasks | 8 |

Regenerate with `npx tsx scripts/reconcile-counts.ts`.
