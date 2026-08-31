# Published, unlocked, completed

Three words that sound alike and mean different things. Getting them confused is
how the previous release shipped a gate that a learner could walk around, so
they are defined here once, in plain language, with the code that decides each.

---

## The one-line version

| | Question it answers | Whose property | Decided by |
|---|---|---|---|
| **PUBLISHED** | Does this month exist in production at all? | The **deployment**'s | A human, running `curriculum:publish` |
| **UNLOCKED** | May *this learner* open it? | The **learner**'s | Their own completed work |
| **COMPLETED** | Has this learner finished it? | The **learner**'s | Every lesson and the monthly check done |

**Publication is not permission.** All nine months are published. That does not
mean a learner may open all nine.

---

## PUBLISHED

A month is published when a named teacher or admin has run:

```bash
npm run curriculum:unpublish --help   # the inverse; see the manifest
DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
  --school <school> --month <n> --reviewer <username> \
  --note "Reviewed <date>" --i-am-the-reviewer
```

This writes one row in `curriculum_publications` carrying the reviewer, the
moment, and the **sha256 of exactly the month object approved**. Edit the
curriculum afterwards and the hash stops matching, the approval lapses, and the
month closes on its own — an approval cannot silently outlive the content it
approved.

It is a property of the **deployment**, not of a school: the table has no
`school_id`, because one deployment serves one curriculum. `--school` on the
command identifies the *reviewer*, never the scope.

**All nine months are published for the pilot.** That is a deliberate product
decision: SolveX is self-paced as well as taught, and a learner who is ahead of
their class must not have to wait for an engineer to publish October.

Where it is enforced: `schools/curriculum/gate.ts`, on the lesson page, the
assessment page, the month board, and `POST /api/learning/submit`.

---

## UNLOCKED

Whether **this learner** may open a published month.

> **September is unlocked for everybody, from the first login.
> Month N unlocks when month N−1 is COMPLETED.**

That is the whole rule. It is in `schools/policies/unlock.ts`, it is pure, and
it defines nothing itself — "completed" is the existing definition, below.

Where it is enforced, on both sides:

- **Read**: `/lesson/[id]` and `/assessment/[month]` return 404; `/course/[n]`
  renders the month as closed, with a sentence saying what opens it.
- **Write**: `POST /api/learning/submit` and `POST /api/learning/complete`
  return 404 before grading, before the judge, and before any ledger write.

Both, because one is what failed last time: the gate lived on the page, and
`POST /api/learning/submit` for a May block returned `200 … "attested": true` on
a database where only September was published.

### Why 404 and not "locked"

A distinct status for "exists but is closed" would let anyone read the shape of
the year, and another learner's progress, off a status code. The month board is
the one place that says a month is closed, because a learner is entitled to see
that October is there and waiting.

---

## COMPLETED

A month is completed when **every one of its completables** has a row in
`lesson_completions`.

Its completables are `monthCompletables()` in
`schools/curriculum/inventory.ts`: every authored lesson, **plus the monthly
check**. The check counts — a learner who finished all 72 lessons and none of
the nine checks has not finished the programme, and the `/program` progress bar
already said so before the gate did. They read the same set, deliberately.

A `lesson_completions` row is written only by `POST /api/learning/complete`,
which evaluates `schools/policies/completion.ts` against the ledger and refuses
a claim the evidence does not support. So the unlock rule inherits all of this
without restating any of it:

- **Optional and bank tasks never count.** They are blocks inside a completable,
  and `isMandatory` already excludes them.
- **Correctness is never required.** The shipped policies ask for `attempted`,
  never `passed`. A learner who attempts every task in a lesson and gets half of
  them wrong has finished it. Gating progress on getting it right would lock a
  struggling fourteen-year-old out at exactly the lesson they most needed.
- **The learner's route is honoured.** Support, core and advanced each have
  their own projection, so an advanced-only task cannot block a support learner.
- **The monthly check is stricter, on purpose.** It needs `answered` for written
  work and `measured` for anything a machine grades — a completed check with no
  evidence behind it is a lie in a school's record, and an incomplete one is
  merely an outage.

---

## Worked examples

**A learner on their first day.** September is open. Everything else is closed,
and `/course/2` says "it opens when you finish the previous month's lessons and
monthly check". Typing `/lesson/m5.l1` gives a 404. Posting to
`/api/learning/submit` for `m9.l1.b2` gives a 404 and records nothing.

**A learner who has done every September lesson but not the check.** October is
still closed. `remainingIn()` names exactly one thing outstanding:
`m1.assessment`. This is the case the progress bar got wrong for a year.

**A learner who got every September answer wrong.** October opens. They
attempted the work, which is what the policy asks; what they got right is in
`learning_events` in full, where a teacher can read it. It does not belong in a
gate.

**A learner who ignores the bank tasks.** October opens. Bank tasks are not
completables and never enter the calculation.

**A learner racing ahead in the holidays.** They can finish September on Monday
and be in December by Friday, with no engineer, no redeploy, no environment
change and nothing to publish. Verified: 83 completables, 500 submissions,
September through May, and May still open after a re-login from a clean browser
with no client state.

**Two learners in one class.** One is in March, one is in September. Both are
correct. The class is not a gate; the learner's own record is.

---

## What is deliberately NOT here

**No teacher override.** There is none today, and this policy does not remove
one — the teacher surface is analytics plus the human-review write, and it has
never controlled which content a learner may open. Introducing self-paced
access therefore takes nothing away from a teacher. If a school later wants to
hold a class back, that is a feature to design, not a regression to fix.

**No client state.** Not `localStorage`, not a cookie, not a URL parameter. All
of them are per-device and learner-writable, and a gate a learner can edit is
not a gate. The answer comes from `lesson_completions` on every request.

**No time.** Nothing expires, nothing is due, and no month opens on a date. The
programme is a path, not a calendar.
