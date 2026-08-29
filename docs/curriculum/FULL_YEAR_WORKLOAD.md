# Full-year workload

**Not validated.** Nobody has watched a fourteen-year-old in Kazakhstan work through any of this. Every minute below is an estimate made by people who have not met the learner it describes. The three columns are the honest width of that uncertainty, not three measurements — and the release gate that closes this question is a timed pilot, not another script.

Regenerate with `npx tsx scripts/workload.ts`. The per-block estimates live in one table at the top of that file so that arguing with them is cheap.

## The budget

PDF p.5 gives a month «шамамен 2,5 сағат» of theory and «шамамен 6 сағат» of practice — **150 + 360 = 510 minutes**. p.2 states the same thing weekly: two 45-minute lessons plus «кемінде шамамен 40 минут» on the platform.

Bank tasks are excluded from every figure. That is what the field means, and since `bank-is-optional.test.ts` it is what the completion policy enforces.

## The three learners

| | |
|---|---|
| **Fast** | Has understood the lesson. Writes the loop correctly first time, one submission per task. A curriculum that overruns here is broken. |
| **Expected** | Understands after the worked example, gets a task wrong once or twice, re-reads the statement. Who the programme is aimed at. |
| **Slow** | Needs the concept twice, meets a real bug on most from-scratch tasks, loses ten minutes to an off-by-one at least once a month. Not a struggling outlier — the bottom third of an ordinary class, who are being assigned this curriculum too. |

The spread is widest where production happens. Re-reading a concept costs a small multiple; being stuck on a from-scratch problem has no ceiling, and 2.5× is already an optimistic way to model no ceiling.

## Required minutes

Programme budget per month (PDF p.5): **150 min theory + 360 min practice = 510 min**. Bank tasks are excluded — a learner may skip them.

| Month | Route | Fast | Expected | Slow | Expected vs budget | Slow vs budget |
|---|---|---|---|---|---|---|
| 1 Қыркүйек | support | 221 | **360** | 826 | -150 | +316 |
| 1 Қыркүйек | core | 263 | **432** | 1012 | -78 | +502 |
| 1 Қыркүйек | advanced | 279 | **459** | 1079 | -51 | +569 |
| 2 Қазан | support | 237 | **386** | 864 | -124 | +354 |
| 2 Қазан | core | 281 | **464** | 1073 | -46 | +563 |
| 2 Қазан | advanced | 294 | **484** | 1117 | -26 | +607 |
| 3 Қараша | support | 197 | **317** | 697 | -193 | +187 |
| 3 Қараша | core | 248 | **407** | 932 | -103 | +422 |
| 3 Қараша | advanced | 265 | **435** | 999 | -75 | +489 |
| 4 Желтоқсан | support | 204 | **335** | 756 | -175 | +246 |
| 4 Желтоқсан | core | 242 | **401** | 933 | -109 | +423 |
| 4 Желтоқсан | advanced | 275 | **453** | 1051 | -57 | +541 |
| 5 Қаңтар | support | 219 | **359** | 804 | -151 | +294 |
| 5 Қаңтар | core | 263 | **437** | 1006 | -73 | +496 |
| 5 Қаңтар | advanced | 279 | **461** | 1057 | -49 | +547 |
| 6 Ақпан | support | 202 | **331** | 752 | -179 | +242 |
| 6 Ақпан | core | 231 | **382** | 885 | -128 | +375 |
| 6 Ақпан | advanced | 256 | **421** | 973 | -89 | +463 |
| 7 Наурыз | support | 183 | **300** | 678 | -210 | +168 |
| 7 Наурыз | core | 213 | **351** | 808 | -159 | +298 |
| 7 Наурыз | advanced | 219 | **359** | 822 | -151 | +312 |
| 8 Сәуір | support | 175 | **284** | 635 | -226 | +125 |
| 8 Сәуір | core | 211 | **347** | 801 | -163 | +291 |
| 8 Сәуір | advanced | 224 | **367** | 845 | -143 | +335 |
| 9 Мамыр | support | 299 | **482** | 1125 | -28 | +615 |
| 9 Мамыр | core | 325 | **527** | 1239 | +17 | +729 |
| 9 Мамыр | advanced | 332 | **537** | 1257 | +27 | +747 |

## What this says

**Fast: 0 of 27 month/route combinations over budget.** Nothing is over-stuffed on its face.

**Expected: 2 of 27.** Both are May, whose own structure is a 90-minute final tournament the programme specifies on p.10; the overrun is +17 and +27 minutes against 510, which is inside the width of any estimate here. Every other month/route fits, most with 15–40% headroom.

**Slow: 27 of 27.** Every month, every route, roughly double. September — the month a human audited and accepted — is 1012 minutes against 510 on the core route.

The third line is the finding, and the interesting question is how pessimistic the slow column has to be for it to hold. Not very. Sliding a learner from the expected estimates toward the slow ones, the month overruns 510 at:

| Month | how far toward "slow" before it overruns |
|---|---|
| 1 Қыркүйек | 13% |
| 2 Қазан | 8% |
| 3 Қараша | 20% |
| 4 Желтоқсан | 21% |
| 5 Қаңтар | 13% |
| 6 Ақпан | 25% |
| 7 Наурыз | 35% |
| 8 Сәуір | 36% |
| 9 Мамыр | already over |

October runs out of budget when a learner is 8% of the way from "understands after the worked example" to "needs the concept twice". So the conclusion does not rest on the slow column being right — it rests on there being any meaningful distance between a fast learner and an average one, which there certainly is. What the slow column contributes is the size of the overrun, not its existence.

## The support track does not close the gap

The obvious answer to "a slow learner needs twice the time" is that a slow learner takes the support route. Measured:

| Month | Support as % of core (expected) | Support route, slow, vs 510 |
|---|---|---|
| 1 Қыркүйек | 83% | 826 (162%) |
| 2 Қазан | 83% | 864 (169%) |
| 3 Қараша | 78% | 697 (137%) |
| 4 Желтоқсан | 84% | 756 (148%) |
| 5 Қаңтар | 82% | 804 (158%) |
| 6 Ақпан | 87% | 752 (147%) |
| 7 Наурыз | 86% | 678 (133%) |
| 8 Сәуір | 82% | 635 (125%) |
| 9 Мамыр | 92% | 1125 (221%) |

The support route costs **84% of the core route** over the year — a 16% reduction, ranging from 78% in November to 92% in May. A learner who needs twice as long needs roughly half, and gets a sixth.

That is a design fact about the differentiation, not a bug in it. The support twins substitute an easier form of the same task — a `fill_blank` where core writes from nothing — so they reduce difficulty and reduce time only as a side effect. Nothing in the curriculum reduces the NUMBER of things a support learner must do.

Whether that is acceptable is a decision for whoever runs the pilot, and it has at least three answers: the support route drops tasks as well as scaffolding them; the school gives slower learners more weeks per month; or the programme accepts that its bottom third works four hours a week rather than two. This document does not pick one. It exists so that the choice is made deliberately instead of discovered in November.

## Relative density

A second reading that does not depend on the absolute estimates at all. September is the only month a human has audited, remediated and accepted, so a month priced above it by the same table is heavier than a size somebody already judged acceptable — and that ratio is stable under any consistent cost table, because one table prices both.

    support   m2 113%  m3 90%  m4 97%  m5 106%  m6 97%  m7 87%  m8 80%  m9 36%
    core      m2 112%  m3 97%  m4 96%  m5 106%  m6 92%  m7 84%  m8 81%  m9 37%
    advanced  m2 109%  m3 97%  m4 103%  m5 105%  m6 96%  m7 80%  m8 81%  m9 37%


**This is relative density, not workload validation.** It says a month is heavier or lighter than September. It does not say September is the right size — September has never been timed either — and it cannot say any month fits in 510 minutes. Treating it as validation is a mistake this workstream made once already, and it is why the three-scenario table above exists.

On that reading two months sit above September: October by 12% and January by 6%, on all three routes, with December a third above it on the advanced route alone. Every month from March onwards is materially lighter.

## What would actually settle this

A timed pilot: real Grade 9 learners, a stopwatch, one month. Until then the honest statement is the one at the top of this file.
