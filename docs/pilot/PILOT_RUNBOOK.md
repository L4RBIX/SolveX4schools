# Pilot Runbook

For the teacher and whoever is on call during the September pilot. One class,
eighteen students, one teacher, one private school.

Written to be read in a hurry, in a classroom, when something is not working.
Everything here is a command you can run or a decision you can make — nothing
in it requires reading the source.

---

## Before class

Five minutes, once. Run these from the deployment host.

### 1. Is the app healthy?

```
curl -s https://<host>/api/health | jq
```

Expect `"status": "ok"`. The response covers the web app, the database, the
execution provider, the Nova provider and which curriculum version is published.
It never contains a secret — no URLs with credentials, no key material.

If any component is `down`, do not start the lesson without reading
**During class** below: some failures are survivable and some are not.

### 2. Is the judge actually running?

The health route reports whether the judge answered. That is not the same as
"the judge is fast enough for eighteen people at once", so once — before the
first lesson, not before every lesson — run a real submission and time it.

A judge that answers in under about a second per test case is comfortable. Over
about two seconds, a four-case submit makes a learner wait eight seconds and
they will press the button again.

**Sizing, measured:** peak concurrency is roughly **2 × class size**, not class
size — Run and Submit share the judge and neither waits for the other. For
eighteen students, size the judge for at least 48 concurrent jobs.

### 3. Is the curriculum published?

```
curl -s https://<host>/api/health | jq '.curriculum'
```

If September is not published, **students see "this month is not open yet" and
no lessons at all.** That is the gate working, not a bug. It is also the single
most likely reason a first lesson does not start. Publishing is a human action —
see `docs/reviews/SEPTEMBER_HUMAN_SIGNOFF.md`.

Note: editing the curriculum lapses its approval automatically. If someone
changed a task this morning, the month is closed until it is re-approved.

### 4. Do the accounts exist?

Sign in as the teacher and open `/teacher`. You should see your class and every
enrolled student, including ones who have done nothing — a learner missing from
that list is not enrolled and will not be able to work.

To add the class in the first place:

```
npm run school:provision -- --school <school> --class <class> \
  --class-name "9А" --teacher-name "<name>" --students 18
```

Credentials print **once** and are stored nowhere. Write them down or hand them
out immediately. Every account must change its password at first sign-in.

**The app must be stopped while this runs** if the deployment uses the embedded
database — it is single-writer. With a real Postgres this does not apply.

### 5. Backups

Whatever your database backup schedule is, confirm a backup exists from before
today. The learning ledger is the school's record; a lesson is replayable, a
lost ledger is not.

---

## During class

### The judge is unavailable

**The lesson keeps working.** Code tasks show "the code service is not connected"
and settle as *unmeasured* — the learner is **never marked wrong** because the
judge failed. That distinction is enforced in the code and tested.

What to do:
- Let the class continue. Predictions, tracing, bug-finding, multiple choice and
  the written blocks all still grade.
- Tell students their code answers are saved but not yet checked. That is true.
- Do not have them re-submit repeatedly; it will not help and it inflates their
  attempt counts.

**What you lose:** the monthly assessment cannot complete while the judge is
down, by design — the completion policy requires every machine-gradable
assessment block to have actually been graded. A completed check with no
evidence would be a lie in a school record. Reschedule the check.

### Nova is unavailable

The lesson keeps working. The help panel shows a status and a retry rather than
spinning. Nothing a learner does is lost. Carry on; help is a support, not a
dependency.

### A student is blocked

Ask what they see, then:

| What they see | What it means | What to do |
|---|---|---|
| "This month is not open yet" | Curriculum not published, or just edited | Check §3 above |
| Sign-in fails repeatedly | Wrong password, or rate-limited after 8 tries | Wait a minute; if it persists, re-provision that one account |
| "Change your password" every time | The change did not save | They are signing in again after the change — that is expected once |
| Code task says "not connected" | Judge down | See above |
| Nothing loads at all | App or database down | Check `/api/health` |
| A task marks them wrong and they are sure they are right | Possible content defect | **Record the block id.** Do not edit content mid-lesson |

### No data loss

Every graded answer is written server-side when it happens. A learner who
refreshes, closes the laptop, or moves to another machine and signs in again
finds the same progress — the subject follows the account, not the browser.

If a save fails, the product says so rather than pretending. A learner who sees a
save error should retry the block; if it persists, the database is the problem
and the class should stop rather than accumulate work that is not being recorded.

---

## After class

### 1. Class summary

Open `/teacher`. For each learner you get: episodes, solved unaided, solved with
help, failures the system could not explain, last activity, and any signals.

Read the signals as prompts to look, not as diagnoses. "Unexplained failures"
means precisely that the system could **not** work out what went wrong — it is a
reason for a human to look, which is the opposite of a machine's opinion about a
child.

### 2. Written and oral responses

Explanations from the monthly check and post-help explanations are visible to
the class's teacher. They are never machine-scored, and they never become a
mastery claim. They are there to be read.

### 3. Anything unresolved

- A student whose work was unmeasured because the judge was down: their code is
  saved. Re-run the block with them when the judge is back.
- A suspected content defect: record the block id and the input. It goes through
  the amendment rule in `docs/releases/SEPTEMBER_V1_FREEZE.md` §4 — reason,
  finding, tests, changelog. September is frozen; a task is not edited because
  one learner disliked it.

### 4. Export

The learning ledger is the record. A per-learner and per-class export for the
school is produced from it, not from anything a browser held.

---

## Things that are true and worth knowing

- **A lesson completes when every required block has been *attempted*, not
  passed.** Gating on correctness would lock a struggling learner out using the
  lesson they most needed. The assessment is stricter: every block must carry
  the learner's own work, and everything a machine can grade must have been.
- **Help is not free.** After substantial help, the learner is asked to explain
  the solution in their own words, and the solve is not recorded as independent.
- **The answer is not given away on the first wrong try.** It opens on the third
  failed attempt. This is the programme's rule, not a UX choice.
- **A learner is one person across devices.** Signing in on a second machine
  continues the same history.
- **Nothing a browser says is trusted.** Every verdict is computed on the server
  against the curriculum, and the answer keys are not in the page.

---

## Escalation

| Symptom | First check | Then |
|---|---|---|
| App will not start | Boot logs — it refuses to start on an invalid config, deliberately | `docs/deployment/PRODUCTION_ENVIRONMENT.md` |
| Every code task unmeasured | `EXEC_PROVIDER` and `PISTON_URL` | Judge host |
| Teacher sees an empty class | Enrolment | Re-run provisioning for the missing students |
| Month closed unexpectedly | Someone edited the curriculum | Re-approve, or revert the edit |
| Progress looks wrong for one learner | Whether they were signed in | The ledger is authoritative; the browser is not |
