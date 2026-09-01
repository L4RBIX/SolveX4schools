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

| Month | PDF «тапсырма» | Practice (comparable) | · independent | · guided coding | · other interaction | Explanation | Assessment | Contest | Bank | Attempt | All blocks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 Қыркүйек | 36 | **43** (+7) | 17 | 9 | 17 | 18 | 4 | 0 | 0 | 47 | 65 |
| 2 Қазан | 38 | **60** (+22) | 22 | 3 | 35 | 15 | 3 | 0 | 8 | 71 | 86 |
| 3 Қараша | 34 | **55** (+21) | 18 | 4 | 33 | 14 | 3 | 0 | 4 | 62 | 76 |
| 4 Желтоқсан | 32 | **50** (+18) | 21 | 2 | 27 | 12 | 4 | 0 | 1 | 55 | 67 |
| 5 Қаңтар | 30 | **58** (+28) | 19 | 5 | 34 | 12 | 3 | 0 | 1 | 62 | 74 |
| 6 Ақпан | 30 | **50** (+20) | 18 | 3 | 29 | 10 | 4 | 0 | 1 | 55 | 65 |
| 7 Наурыз | 26 | **45** (+19) | 15 | 2 | 28 | 10 | 4 | 0 | 3 | 52 | 62 |
| 8 Сәуір | 28 | **43** (+15) | 17 | 1 | 25 | 13 | 4 | 0 | 0 | 47 | 60 |
| 9 Мамыр | 25 | **42** (+17) | 4 | 2 | 16 | 9 | 7 | 20 | 0 | 49 | 58 |
| **Year** | **279** | **446** | **151** | 31 | 244 | 113 | 36 | 20 | 18 | **500** | 613 |

## What it says

**446 comparable practice tasks against a promised 279, and 151 independent
solutions against a promised ~100.** Both are about 60% above the figure the
programme states.

(These are the figures after the core-vs-bank re-audit moved fourteen tasks off
the required path. At the content freeze they were 457 and 166 — the freeze
document records that state and is not updated, because it is a record of a
commit.)

Two things follow, and they point in opposite directions.

The over-delivery is **real, not an artifact of the old bad comparison**.
Correcting the units moved the number from 475 to 457; it did not move it to
279, and the redundancy audit that followed moved it only to 447, and one route fix to 446. Every month
still carries 14 to 28 more comparable tasks than its own paragraph names.

But over-delivery is **not by itself a defect**, because p.11 calls its own
figures a minimum and anticipates additional problems. The question the counts
cannot answer is whether the required path still fits the hours the programme
allots — 2,5 сағат theory and 6 сағат practice a month (p.5). That is a question
about minutes, not tasks, and it is answered in
`docs/curriculum/FULL_YEAR_WORKLOAD.md`.

## Numbers that must not be collapsed again

| Figure | Year total (core route) |
|---|---|
| Total blocks | 613 |
| Attempt blocks | 500 |
| **PDF-comparable practice tasks** | **446** |
| — of which independent solutions | 151 |
| — of which guided coding | 23 |
| — of which other interaction | 244 |
| — of which May's contest problems | 20 |
| Explanation blocks (not tasks) | 113 |
| Assessment tasks | 36 |
| Contest tasks | 20 |
| Optional bank tasks | 18 |

Regenerate with `npx tsx scripts/reconcile-counts.ts`.
