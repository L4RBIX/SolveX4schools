# Student timing validation — the protocol

**Status: NOT PERFORMED.** No estimate in this curriculum has been measured
against a real student. Everything below is a model.

## What is modelled, and by how much it disagrees

`schools/curriculum/cost.ts` prices every block type and sums them.
`docs/curriculum/ASSESSMENT_TIMING.md` carries the per-block table; this is the
month-level summary, re-derived from live code on 2026-08-31:

| Month | Stated | Model | Δ | Blocks |
|---|---|---|---|---|
| September | 20 | **30.0** | **+10.0** | 4 |
| October | 20 | 23.0 | +3.0 | 3 |
| November | 20 | 20.0 | 0 | 3 |
| December | 20 | 21.5 | +1.5 | 4 |
| January | 20 | 21.0 | +1.0 | 3 |
| February | 20 | 23.0 | +3.0 | 4 |
| March | 20 | 21.0 | +1.0 | 4 |
| April | 20 | 20.0 | 0 | 4 |
| May (tournament) | 90 | 78.0 | −12.0 | 7 |

September is the outlier and the one that ships first. The overrun is **b3**
(8 min, four numbered sub-questions) and **b2** (6 min); neither can be cut
without loss — b3 is the assessment's only carrier of `types.int_float`, and b2
is the program b4 asks the learner to explain. With all four blocks present the
arithmetic floor is **22 minutes**, so no honest 20-minute September check
exists. That is why this protocol exists rather than a content edit.

## One fact that bounds the stakes

**No learner is currently told twenty minutes.** `PublicAssessment` carries
`minutes` and `description`, and the player renders neither —
`src/components/brilliant/lesson/assessment-route.tsx` builds its prop from
`id`, `title` and `blocks` alone. The figure is shown only to a teacher, beside
the measured median, labelled an estimate.

So the risk is a teacher planning a 20-minute slot for something that takes 30,
not a child being cut off at 20. That is a real scheduling problem and not a
broken promise to a learner.

## The measurement

Change nothing to run this. The protocol measures the content as shipped;
adjusting content to match an estimate before measuring it is how an estimate
becomes self-fulfilling.

### Sample

Eight to twelve learners per figure, spanning the class: at least two who
usually finish early, at least two who usually need support. A median from five
strong learners is not a class median.

### Lessons

- Record wall-clock from opening the lesson to the Finish button.
- Record it per lesson, not per block. Block-level timing needs instrumentation
  that does not exist and would need to be built and reviewed.
- Note interruptions and discard the reading, rather than subtracting a guess.

### Monthly checks

- The full check, uninterrupted, in one sitting.
- Record the time to the last submission, and separately whether the learner
  reached the end at all. "Did not finish" is the number that matters most:
  the part a learner does not reach is recorded as the part they could not do.
- Record which block they were on when the slot ended.

### May's contests

Different question, because these now have a real clock (45 minutes,
`schools/learning/contest.ts`). Do not measure how long the contest takes —
that is fixed. Measure:

- how many of the five problems were attempted;
- how many were deferred with «Вернусь позже» and returned to;
- whether the learner ran out of time, and on which problem.

The month's declared skills are «уақытты бөлу» and «тұрып қалған есепті
уақытында тастау». The thing to find out is whether 45 minutes and five
problems teach that, or merely produce five unfinished problems.

### Reporting

For each figure: n, median, range, and the count who did not finish. A median
alone hides the learner this is for.

## What to do with the answer

- **Model within a few minutes of measured** — record it and move on. The
  estimate is fit for planning.
- **Measured well over stated, and learners do not finish** — a curriculum
  decision, not a code one. Either shorten the check or restate the budget, and
  either way say so in the month's own source.
- **Measured well under stated** — also worth knowing. A check that takes ten
  minutes of a twenty-minute slot is not measuring what it was scoped to.

An edit to a published month lapses its approval and closes it until it is
published again. See [`../MONTHLY_PUBLICATION_PROCEDURE.md`](../MONTHLY_PUBLICATION_PROCEDURE.md).

## Sign-off

```
Measured by:            ____________________________________
School / class:         ____________________________________
Learners in sample:     ______
Months covered:         ____________________________________
Date range:             ____________________________________
Findings filed at:      ____________________________________
Signature:              ____________________________________
```
