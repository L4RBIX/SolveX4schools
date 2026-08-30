# Assessment timing

Every monthly check, priced by `schools/curriculum/cost.ts` under the EXPECTED learner — the same table `scripts/workload.ts` uses and `npm run curriculum:validate` warns on. Regenerate the figures with either.

**The model is not validated.** No fourteen-year-old in Kazakhstan has been timed working any of these. That is the whole reason this document exists rather than a commit removing content.

## Where every check stands

| Month | Stated | Estimated | Over | Blocks |
|---|---|---|---|---|
| 1 Қыркүйек | 20 | **30** | +10 | unseen 12 · find_bug 6 · written ×4q 8 · oral ×2q 4 |
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

## September: what I removed, and why I put it back

September's check was cut from 30 to 26 in this pass, by removing two of the four sub-questions in `m1.as.b3`. **That cut has been reverted.** The reasoning behind it was wrong, and the way it was wrong is worth recording.

The argument was that question (1) — «уақытты неге бүтін санмен санадың, бөлшек сан керек пе еді?» — duplicated question (2) about `//` versus `/`, and that question (4), about very large hour counts, was an extension beyond September's named skills. Both readings are defensible on the text of the block alone.

Neither survives the comment sitting six lines above it, which quotes PDF p.7 verbatim:

> «бүтін немесе бөлшек типті неге таңдағанын **және** бөлу, шарт шекарасы **немесе өте үлкен сандар** қай жерде қате нәтиже беруі мүмкін екенін түсіндіреді»

The source names four things: why an integer or fractional type was chosen, and where **division**, the **condition boundary**, or **very large numbers** could produce a wrong result. The block's four questions are those four things in order. Removing (1) and (4) removed the type-choice requirement and the large-numbers requirement — two of the four the source states — on a redundancy argument that never looked at the source.

`m1.as.b3` also carries `types.int_float`, which no other assessment in the year declares. The cut would have left that skill sampled nowhere.

**September therefore stands at 30 against a source-stated 20, with every component named by p.7.** That is the largest overrun in the year and it cannot be reduced by removing anything the source asks for. The remaining candidate is `m1.as.b4`, the oral defence of the repair, which p.7 does not name — and which is the only place a learner argues for the correction they just made. Cutting it to reach a round number, on minute estimates nobody has validated, is the trade this document exists to refuse.

**HUMAN TIMING VALIDATION REQUIRED**, and for September specifically it is a real question with real stakes: p.7 states twenty minutes and names four written sub-questions plus two graded programs. Either the estimates are too pessimistic, or the source's own check does not fit the source's own clock. A stopwatch settles it; nothing in this repository can.

## January, for the record

January was the other real overrun: 29 against 20, resolved before this pass. Its written explanation and its oral defence made the same argument twice — the invariant, why halving never loses the answer — and p.9's sentence names that once. The written one was removed and the oral's first question, which asked about the trace `m5.as.b3` already grades, went with it. 29 → 21.

## What would settle this

One timed session. Real Grade 9 learners, a stopwatch, one monthly check. Until then every figure in the first table is an estimate about a child made by people who have not watched one, and the six over-runs are six statements of that uncertainty rather than six defects.
