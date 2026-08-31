# Curriculum owner sign-off

**Status: NOT PERFORMED for all nine months.**

Publishing a month records a named person as having reviewed exactly that
content — the `curriculum_publications` row carries the reviewer, the moment,
and the sha256 of the month object. During the production-closure pass all nine
months were published by the pilot teacher account so the deployment could be
validated end to end. **That is a technical publication, not a pedagogical
sign-off**, and this file is the difference between the two.

Edit any month and its hash changes, the approval lapses, and the month closes
until it is published again. So a sign-off recorded here and a publication in
the database stay honest together.

## What the machine already established

Do not re-derive these. They are measured, and they are not what this checklist
is for.

- All nine months build; `npm run curriculum:validate` reports **0 errors**.
- **0** runnable code tasks anywhere lack test cases or a reference solution.
- Every reference solution passes every one of its own cases — 263 blocks,
  executed against real Python in CI.
- Support / core / advanced all traverse every lesson of every month.
- No construct is required by any task before the curriculum has shown it —
  over all 701 blocks, with no exemptions.
- No reference solution or hidden case reaches a learner-facing payload.
- Mandatory written review is exactly four blocks in the year: `m3.as.b2`,
  `m6.as.b3`, `m7.as.b3`, `m8.as.b1`.
- 1,409 learner-visible strings, **0** missing Kazakh or Russian.

## What only you can decide

For each month, the questions a test cannot ask.

### Per month

```
MONTH: ______________          Reviewer: ______________  Date: __________

[ ] The month teaches what the programme says this month teaches.
[ ] The order is right — nothing needs an idea introduced later.
[ ] The difficulty curve is right for a fourteen-year-old in this school.
[ ] The monthly check measures what the month taught, and not more.
[ ] The tasks are worth a learner's time. None is busywork.
[ ] Nothing in it is culturally or contextually wrong for this classroom.
[ ] The Kazakh has been read by a Kazakh speaker (see KK_REVIEW_PACKAGE.md).
[ ] The timing is acceptable, or the overrun is accepted knowingly
    (see STUDENT_TIMING_PROTOCOL.md).

Signature: ____________________
```

### September, which ships first, additionally

```
[ ] The monthly check is priced by the model at 30 minutes against a stated 20.
    I accept this / I require it shortened.        (circle one)

[ ] I have read `m1.p8` (clock angle). Its reference solution was rewritten
    during the closure pass to take the absolute value with if/else rather than
    `abs()`, because September does not teach `abs()`. Verified identical on all
    720 clock positions.
    Accepted / needs another look.                 (circle one)

[ ] I have read the four operator additions made during the closure pass:
    `!=` and `<=` written into `m1.l6.b1`, a float literal into `m1.l10.b1`.
    They were required by September tasks and first written in October before.
    Accepted / needs another look.                 (circle one)
```

### May, which was the one month a prior audit marked NOT READY

```
[ ] The four contests now have a real 45-minute clock and a "come back later"
    control. I have seen one and it matches what the month is trying to teach.
    Accepted / needs another look.                 (circle one)

[ ] A prior audit found that no test case exercises the contest-scale
    constraints May's tasks declare — a naive O(n·q) solution passes. This was
    NOT changed during the closure pass.
    Accept for the pilot / must be fixed before May opens.   (circle one)
```

## Year sign-off

Only when every month above is signed.

```
Curriculum owner:   ____________________________________
Role:               ____________________________________
Months signed:      ____ / 9
Date:               ____________________________________
Signature:          ____________________________________
```

## What signing does NOT cover

- **The artwork.** Nineteen brilliant.org-derived assets still render on
  production routes. That is a separate workstream and no signature here
  clears it.
- **Native Kazakh quality.** Separate package, separate signature.
- **Measured student timing.** Separate protocol, separate signature.
