# Publishing a month

**All nine months are already published.** This procedure is therefore not the
gate on a learner reaching October — that is
[`SELF_PACED_UNLOCK_POLICY.md`](SELF_PACED_UNLOCK_POLICY.md), and it depends on
their own work rather than on an engineer.

What this is for now:

- **re-publishing a month after editing it.** Editing content changes the
  month's hash, the approval lapses, and the month closes on its own. Every
  correction from the Kazakh review or the timing protocol will need this.
- **publishing a month for the first time** on a new deployment.
- the human decisions in steps 1, 2 and 5, which no amount of publishing
  automates.

The point of writing it down is unchanged: doing this should take **minutes,
not another engineering project**.

Nine steps. Steps 1, 2 and 5 are human judgement and cannot be automated; the
rest are commands.

---

## 0. Before you start

You need: the `DATABASE_URL` for the production database, and the credentials of
a `teacher` or `admin` account **in the school being published to**. The most
common failure of this procedure is "credentials rejected", and the usual cause
is the wrong `--school`, not the wrong password.

---

## 1. Native / content review complete — HUMAN

Someone who reads Kazakh natively has read every learner-visible string in the
month. Nothing in this repository can establish this and nothing should claim to;
the validator checks that both `kk` and `ru` are *present*, which is a statement
about structure, not about whether the Kazakh is good.

Record who did it and when. If it has not been done, stop here — the month is
`READY WITH HUMAN GATE`, not `READY`.

## 2. Timing review status checked — HUMAN

`npm run curriculum:validate` estimates lesson and assessment durations and warns
when they overrun. Those estimates have never been measured against real students.
An assessment that overruns is one a learner cannot finish, and the part they do
not reach is recorded as the part they could not do — so an overrun warning is a
teaching risk, not a code defect.

Decide explicitly: accept the estimate, or shorten the assessment. Do not publish
past an overrun warning without a decision.

## 3. Record the curriculum hash

```bash
DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
  --school <school-id> --month <n> --reviewer <username> --i-am-the-reviewer
```

Before prompting for a password it prints the month, its lesson and block counts,
and the **sha256 of exactly the month object being approved**. Write that hash
into the change record. It is what makes the approval falsifiable: edit the
content afterwards and the hash stops matching, the approval lapses, and the gate
closes on its own.

Abort at the password prompt (Ctrl-C) if you only wanted the hash. The prompt
does not echo, so nothing typed there reaches the scrollback.

## 4. Tests green

```bash
npm run lint && npm run typecheck && npm run curriculum:validate && npm test
```

`npm run curriculum:validate` must report **no errors**. Warnings are classified
in the release report; errors are not publishable.

## 5. Authorised reviewer signs off — HUMAN

The curriculum owner accepts the month for a real classroom. This is a person
taking responsibility, which is why the command refuses to run without
`--i-am-the-reviewer` and reads the password from the terminal rather than a flag.

## 6. Publish

```bash
DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
  --school <school-id> --month <n> --reviewer <username> \
  --note "Reviewed <date> by <name>" --i-am-the-reviewer
```

Expect: `Published. Month <n> approved by <display name>.`

Verify:

```sql
select month_index, left(curriculum_hash, 16), note, withdrawn_at
  from curriculum_publications order by month_index;
```

The hash must match the one recorded in step 3.

## 7. Smoke-test the newly opened month

As a real learner, in the browser, against production:

- the month's **first lesson** opens and its first block renders;
- a **middle lesson** opens;
- the month's **assessment** opens;
- one coding task in the month returns a truthful verdict from Check.

## 8. Previous months remain available

Open a lesson from an already-published month. Publication is additive — one row
per month — so this should be unaffected. Verify it rather than assuming it.

## 9. Learner access is unchanged by publishing

Publishing a month does not open it for anybody. Confirm with a learner account
that has not earned it: `/lesson/m<n>.l1` must still 404, and
`POST /api/learning/submit` for one of its blocks must 404 and record nothing.

This is the invariant the release before last did not hold — the gate was on the
page and the grading route ignored it, so a month could be graded and attested
by anyone who opened a network tab.

---

## Rolling a month back

There is a command now. The previous release had only hand-written SQL, which is
not a rollback procedure.

```bash
DATABASE_URL=… npm run curriculum:unpublish -- \
  --school <school-id> --month <n> --reviewer <username> --i-am-the-reviewer
```

It refuses a month index that is not a month, has no `--all` — closing the whole
year should not be one keystroke — refuses to run without the same explicit
human assertion publishing requires, and is idempotent: withdrawing an already
closed month changes nothing and says so. It records `withdrawn_at` and
`withdrawn_by`, and reads the before and after counts from the database on both
sides rather than inferring them.

Learners are served only published months, so this closes the month at the next
request. Exercised end to end against a real Postgres: invalid month, `--all`,
withdraw-before-publish, publish, missing flag, wrong school, withdraw,
double-withdraw, republish.

Withdrawing does **not** delete learner work in that month. Anything already
submitted stays, and reappears if the month is published again.

### One thing to know before withdrawing

A learner who has already finished the month keeps their `lesson_completions`
rows, so **the months after it stay unlocked for them**. Withdrawing closes the
door for everyone, including learners who are past it; it does not rewind
anyone's progress. If a month is withdrawn for a correction and re-published,
those learners are unaffected.

---

## What this procedure deliberately does not do

**It does not publish several months at once.** Each month is a separate human
approval of specific content. A loop over `--month 2..9` would be one person
asserting they had read nine months of material.

**It does not run from CI.** A publish step that can be scripted is a publish step
an automation will eventually perform, and approving material for
fourteen-year-olds is a human act. That is why the command refuses to run
non-interactively.
