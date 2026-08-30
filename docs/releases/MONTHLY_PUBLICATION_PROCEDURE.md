# Publishing a month

The pilot launches with September and nothing else. October through May are
technically ready and deliberately closed. This is the procedure for opening
one of them, and the point of writing it down is that publishing October in
November should take **minutes, not another engineering project**.

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

Abort at the password prompt (Ctrl-C) if you only wanted the hash.

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

## 9. Future months remain closed

Try a lesson URL from the next unpublished month directly. It must not serve
content. Publishing month N must never open month N+1.

---

## Rolling a month back

There is no operator command for this yet — `withdrawCurriculum()` exists in the
store and is tested, but nothing calls it. Until that is closed:

```sql
update curriculum_publications
   set withdrawn_at = now(),
       withdrawn_by = (select user_id from school_accounts
                        where school_id = '<school-id>' and username = '<reviewer>')
 where month_index = <n> and withdrawn_at is null;
```

Learners are served only published months, so this closes the month at the next
request. Verified working during acceptance.

Withdrawing does **not** delete learner work in that month. Anything already
submitted stays, and reappears if the month is published again.

---

## What this procedure deliberately does not do

**It does not publish several months at once.** Each month is a separate human
approval of specific content. A loop over `--month 2..9` would be one person
asserting they had read nine months of material.

**It does not run from CI.** A publish step that can be scripted is a publish step
an automation will eventually perform, and approving material for
fourteen-year-olds is a human act. That is why the command refuses to run
non-interactively.
