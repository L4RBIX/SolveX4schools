# Native Kazakh review — the package

**Status: NOT PERFORMED.** No Kazakh speaker has reviewed this curriculum. This
file exists so that one can, and so nobody can mistake the absence for a pass.

## What the machine can and cannot say

The build asserts that both languages are **structurally present**: every
learner-visible string has a `kk` and a `ru`, and there are 1,409 of them across
the nine months with **zero missing on either side**. That is a statement about
fields.

It says nothing about whether the Kazakh is correct, natural, age-appropriate,
or says the same thing as the Russian. The audit trail already holds two cases
where it did not — `m1.p8` asked in Kazakh for the angle «тіл мен сан
аралығында», between a hand and a *number*, which is not the task the Russian
sets and not a task the block grades; and `m1.l8.b2`'s Kazakh described a room
where the graded solution reads a wardrobe. Both were found by a human reading
them. Neither could have been found any other way.

## The sheets

One per month, in `kk-strings/`. September first, because September ships first.

| Month | Strings | Sheet |
|---|---|---|
| September | 136 | [`kk-strings/month-01.md`](kk-strings/month-01.md) |
| October | 178 | [`kk-strings/month-02.md`](kk-strings/month-02.md) |
| November | 167 | [`kk-strings/month-03.md`](kk-strings/month-03.md) |
| December | 165 | [`kk-strings/month-04.md`](kk-strings/month-04.md) |
| January | 160 | [`kk-strings/month-05.md`](kk-strings/month-05.md) |
| February | 165 | [`kk-strings/month-06.md`](kk-strings/month-06.md) |
| March | 149 | [`kk-strings/month-07.md`](kk-strings/month-07.md) |
| April | 138 | [`kk-strings/month-08.md`](kk-strings/month-08.md) |
| May | 151 | [`kk-strings/month-09.md`](kk-strings/month-09.md) |
| **Total** | **1,409** | |

Each row carries the block id, the field, the Kazakh as shipped, and the Russian
beside it — because the most valuable check is not "is this Kazakh correct" but
"do these two sentences set the same problem".

## What to look for, in priority order

1. **Do the two languages ask the same question?** A task whose Kazakh sets a
   different problem is unsolvable for a Kazakh-track learner, and the grader
   will mark them wrong for answering the question they were asked.
2. **Is anything in the prompt required to solve it, and present in only one
   language?** Input order, units, output format.
3. **Is the register right for a fourteen-year-old?** Not a translation
   question — a teaching one.
4. **Are the technical terms the ones a Kazakh school actually uses?** Where a
   term has no settled Kazakh form, note what you would say aloud in class.
5. **Everything else.** Grammar, naturalness, typography.

Items 1 and 2 are the ones that make a task impossible. If time is short, do
those on all nine months before doing anything else on one.

## How to return it

Fill the `Correction` and `OK` columns in place and commit the sheet, or send it
back however is easiest. A correction is applied by editing
`schools/curriculum/months/`, and `npm run curriculum:validate` must stay green
afterwards.

**Editing a published month changes its content hash and lapses its approval** —
the month closes until it is published again. That is deliberate. Expect to
re-run `curriculum:publish` for every month you touch, and see
[`../MONTHLY_PUBLICATION_PROCEDURE.md`](../MONTHLY_PUBLICATION_PROCEDURE.md).

## Sign-off

This section is the only thing that turns NOT PERFORMED into PERFORMED. It is
not filled in by anyone building the software.

```
Reviewer (name):            ____________________________________
Native Kazakh speaker:      yes / no
Role:                       ____________________________________
Months reviewed:            ____________________________________
Strings read (of 1,409):    ______
Corrections returned:       ______
Date:                       ____________________________________
Signature:                  ____________________________________
```
