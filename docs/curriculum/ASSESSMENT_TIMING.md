# Assessment timing

Every monthly check, priced by `schools/curriculum/cost.ts` under the EXPECTED learner — the same table `scripts/workload.ts` uses and `npm run curriculum:validate` warns on. Regenerate the figures with either.

**The model is not validated.** No fourteen-year-old in Kazakhstan has been timed working any of these. That is the whole reason this document exists rather than a commit removing content.

## Where every check stands

| Month | Stated | Estimated | Over | Blocks |
|---|---|---|---|---|
| 1 Қыркүйек | 20 | **26** | +6 | unseen 12 · find_bug 6 · written ×2q 4 · oral ×2q 4 |
| 2 Қазан | 20 | 23 | +3 | trace 5 · unseen 12 · oral ×3q 6 |
| 3 Қараша | 20 | 20 | — | unseen 12 · written ×2q 4 · oral ×2q 4 |
| 4 Желтоқсан | 20 | 22 | +2 | mcq 1.5 · written ×2q 4 · unseen 12 · oral ×2q 4 |
| 5 Қаңтар | 20 | 21 | +1 | unseen 12 · trace 5 · oral ×2q 4 |
| 6 Ақпан | 20 | 23 | +3 | unseen 12 · trace 5 · written ×2q 4 · oral 2 |
| 7 Наурыз | 20 | 21 | +1 | unseen 12 · trace 5 · written 2 · oral 2 |
| 8 Сәуір | 20 | 20 | — | written 2 · unseen 12 · test_case 4 · oral 2 |
| 9 Мамыр | 90 | 78 | −12 | five unseen problems 60 · two oral defences 18 |

## The arithmetic that constrains all of this

An unseen problem costs 12 of the 20. That single figure decides the shape of every check in the year: whatever else a twenty-minute check contains has eight minutes to do it in, which buys one trace, or four written sub-questions, or one repair with two minutes left over.

Every month whose source sentence names three components therefore lands near 22, and no arrangement of those components lands on 20. That is a fact about the budget, not about any month's authoring.

## Which of these is a defect

Only one month's source states a duration. PDF p.7, September: «**Жиырма минуттық тексеріс**: бұрын талданбаған бір есеп, бөтен бағдарламадағы қатені түзету және шешімнің неге дұрыс екенін жазбаша түсіндіру.» — a twenty-minute check: one previously unanalysed problem, a bug fixed in someone else's program, and a written explanation of why the solution is correct.

Every other month's `minutes: 20` is inherited from that sentence. Their own «Айлық сынақ» paragraphs name components and state no time.

So:

- **September — a real overrun against an explicit source figure.** 30 when this pass started.
- **October, December, January, February, March — 1 to 3 minutes over a figure the source does not state**, on a model whose own error bar is 2.5×. Marked **HUMAN TIMING VALIDATION REQUIRED**. Nothing removed.

## What was removed from September, and what it cost

30 → 26, by cutting two of the four sub-questions in `m1.as.b3`, the written explanation. Both removals are justified on their own merits, not by arithmetic:

| Removed | Why | Educational cost |
|---|---|---|
| (1) «уақытты неге бүтін санмен санадың, бөлшек сан керек пе еді?» | Substantially answered by (2), which asks what changes if `//` replaces `/`. The two expected points said the same thing from different ends: minutes and hours are whole quantities, and `/` produces a fraction where `//` does not. | Low. The surviving question now carries both halves — it asks what changes AND whether division is needed here at all. |
| (4) «сағат саны өте үлкен болса не болар еді?» | An extension. Its expected point is that Python integers are unbounded, which is true, interesting, and not one of September's named skills. | Real but small. Nothing else in September asks it, and nothing in September depends on it. |

The two that remain are the month's named skills: `arith.integer_division` and `debug.boundary` — the `/` versus `//` distinction, and where exactly the boundary falls between 17:30 answering yes and 17:31 answering no.

## What was NOT removed from September, and why

The obvious way to reach 20 is to drop `m1.as.b4`, the oral explanation, worth 4 minutes. It was not dropped.

The argument for dropping it is that September's source sentence says «**жазбаша** түсіндіру» — explain in *writing* — so an oral block is an addition the sentence does not name.

The argument against, which wins: `m1.as.b4` asks why the repaired program needs `and` rather than `or`, and what breaks if the condition changes. It is the correctness defence of `m1.as.b2`, which the source **does** name. Removing it would delete the only place a learner argues for the repair they just made, to reach a round number, on an unvalidated model. That is exactly the trade this document exists to refuse.

**September therefore remains 6 minutes over an explicitly stated 20, and that is HUMAN TIMING VALIDATION REQUIRED like the rest.** The gap cannot be closed further without removing a source-named component or trusting minute estimates nobody has checked.

## January, for the record

January was the other real overrun: 29 against 20, resolved before this pass. Its written explanation and its oral defence made the same argument twice — the invariant, why halving never loses the answer — and p.9's sentence names that once. The written one was removed and the oral's first question, which asked about the trace `m5.as.b3` already grades, went with it. 29 → 21.

## What would settle this

One timed session. Real Grade 9 learners, a stopwatch, one monthly check. Until then every figure in the first table is an estimate about a child made by people who have not watched one, and the six over-runs are six statements of that uncertainty rather than six defects.
