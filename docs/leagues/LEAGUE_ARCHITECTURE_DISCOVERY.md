# SolveX Leagues — architecture discovery

Written before any implementation, per §0 of the brief. Everything below was
traced against the **current working tree**, not against a prior report. Where a
document in `docs/` disagrees with the code, the code is quoted and the document
is named as stale.

---

## 1. Does any of this already exist?

**No XP. No league. No streak. No achievements. No points. No ranks.**

Searched `schools/`, `src/`, `packages/`, `database/migrations/`, `tests/`,
`contracts/`. What exists is adjacent and must not be confused with it:

| Thing | Where | What it actually is |
|---|---|---|
| Teacher leaderboard | `schools/teacher/leaderboard.ts` | Teacher-only, class-only, four counted lenses over `attempt_episodes`. Derived at read time. No stored score. |
| `AppHeader.xp` prop | `src/components/brilliant/app/app-header.tsx:65-77` | A prop whose doc comment says *"this product has no XP"*. **Every** call site passes `null`. |
| `HomeRail.xp` / `xpGoal` | `src/components/brilliant/app/home-rail.tsx:37-38` | Dead props from the Brilliant clone, defaulted `0` / `175`, never fed. |
| `HomeRail.streak` | `home-rail.tsx:30-34` | A **count of active days**, explicitly *not* a streak. |
| `--color-b-pear` | `globals.css` | "filled streak bolt" — a cloned Brilliant token. |

Two comments in the product state the absence as a **decision**, and both become
false the moment this ships. They are part of the diff, not collateral:

> *"An XP league is not part of this product and inventing one would be a
> fabricated metric."* — `home-rail.tsx:49-50`

> *"The reference shows an XP counter; this product has no XP, and a pill that
> reads `0 ⚡` on every screen forever is a counter for a mechanic that does not
> exist."* — `app-header.tsx:70-72`

### 1.1 The policy this feature reverses

The project has refused student-visible ranking **in writing, four times**:

- `docs/pilot/PRIVACY_DATA_FLOWS.md:318` — *"The class list is not sorted by score, because there is no score"*
- deleted `schools/presentation/classroom.ts:262-265` — *"ranking children by one is the thing this whole model exists to avoid"*
- `schools/teacher/leaderboard.ts:9-59` — both of the above, quoted, then narrowed
- `docs/PRODUCTION_PRODUCT_AUDIT.md:127-132` — the streak was **removed** because nothing recorded activity days

The existing leaderboard survives that refusal on four conditions, stated in its
own header. **A student-facing weekly league inherits every one of them**:

1. Rank only a **counted, auditable** quantity — never a composite invented score.
2. Publish the formula **on screen**, next to the table.
3. Never add two different units together.
4. Class-scoped. No cross-class, no cross-school.

This is a policy change, not merely a feature. It is recorded here so that it is
made deliberately rather than by accident.

---

## 2. Identity, and what a league row may be keyed on

Three layers, and they are **not** interchangeable:

- `school_accounts.user_id` (0012) — the person. `display_name` is the **only**
  name the product holds. No email, no DOB, no contact details.
- `learning_subjects.subject_id` (0003) — the ledger key. Every evidence table
  is keyed on it `on delete cascade`.
- `learning_subject_aliases` — binds one to the other. **Not** a nickname table.

**Decision: league rows key on `subject_id`, `references learning_subjects(subject_id) on delete cascade`.**

Keying on `user_id` puts the rows **outside the erasure path entirely** —
`learning_forget_user` never deletes the `school_accounts` row (accounts are
disabled, never deleted, per 0012), so a cascade from `school_accounts` never
fires. `nova_usage` and `rate_limit_bucket` already leak this way and are logged
as open finding #6 in `PRIVACY_DATA_FLOWS.md:559`. The league will not be the third.

### 2.1 How a route gets the learner

`requireLearner()` (`schools/auth/guard.ts:113`) returns `{user, subjectId, classId}`
and resolves the subject **from the session** — there is no browser-supplied
parameter to tamper with. It is currently **dead code**: every learning route
uses `checkLearningAccess()` + `resolveIdentity()`, which falls back to an
anonymous subject in development.

**Decision: league routes use `requireLearner()`.** A league must not serve an
anonymous development subject, and this is the guard written for exactly that.
The league will be its first production caller.

---

## 3. The trust boundary

`source_trust` is a first-class column: `'server' | 'judge' | 'verifier' | 'browser'`.

**Exactly one** code path mints a trusted accepted verdict:
`src/app/api/learning/submit/route.ts:394-421`, writing `sourceTrust: "judge"`,
after the server re-graded the answer itself against the curriculum
(`gradeBlock`) or ran it on a configured judge (`runCases`).

Everything else is structurally incapable of it:

- `POST /api/exec/run` (Pyodide / Run) **writes nothing at all**.
- `POST /api/learning/events` stamps `sourceTrust: "browser"` unconditionally and
  drops `verdict_received` via `isClientReportable`.
- Human review (`human_reviews`, 0022) has **no score column by design** and is
  not in the evidence stream.

**Decision: XP is awarded only inside the transaction that writes a trusted
verdict.** Run cannot produce XP because Run produces no row.

---

## 4. The one call site

`LearningStore.appendEventsAndSettle` (`schools/store/learning-store.ts:401-460`)
is a single `sql.tx` that inserts the events **and** settles the submission, or
commits neither. It already throws `SubmissionAlreadySettledError` when a racing
owner settled first, rolling the events back.

**Decision: the XP write goes inside that transaction, after the settle guard.**
It is the only point at which "this submission is settled by *me*" is established.

### 4.1 Why not the reducer

`runSweep` re-reduces every episode whose `reducer_version` is stale. An XP write
triggered from the sweep is re-executed on every `REDUCER_VERSION` bump. The
unique award key would absorb it, but the sweep is still the wrong home: it is a
projection rebuild, and XP is not a projection of an episode.

### 4.2 Why XP must never be a `learning_events` row

`reduceEpisode` derives three fields from the **shape and timing of the whole
ordered event array**, not from any named key:

- `event_count: ordered.length` (`episode.ts:355`)
- `active_seconds` via `activeTime(ordered)` (`:379`)
- `struggle_class` via `classifyStruggle(ordered, …)`, which calls `longestGap(ordered)`

Writing an `xp_awarded` event would therefore silently change `active_seconds`,
`struggle_class` and `event_count` for **real episodes**, even though no branch
reads the word "xp". The contract file says the same thing from the other side:

> *"An event is admissible only if you can name the decision it changes. 'It
> would be interesting to know' is not a decision."* — `events.ts:12-14`

XP changes no pedagogical decision. It fails the admission rule by construction.

**Decision: XP lives in its own table and emits no learning event, ever.**

---

## 5. The anti-farming invariant

There is **no first-solve ledger**. `learning_submissions` dedups only identical
`(subject_id, submission_id)`; the id lives in a client `useRef` that is *not*
seeded from hydration, and `hydration.ts:190-217` deliberately withholds the
episode id once a block is accepted. So today:

> reload → resubmit the same correct answer → **new `submissionId`, new
> `episodeId`, a second accepted `verdict_received` row**.

That is the primary farming vector and it is open right now.

**Decision — the invariant the whole design rests on:**

> **Every XP source is keyed to a curriculum entity, and the curriculum is
> finite and fixed. There is no repeatable source of XP at all.**

Award identity is `(subject_id, achievement, entity_id)` with a **UNIQUE
constraint**. A second solve of the same block hits the constraint and awards
nothing. Total lifetime XP is bounded by the size of the curriculum; weekly XP is
bounded by how much *new* curriculum a learner covers that week.

Consequence to accept openly: a learner who has exhausted the published month
earns nothing further that week. Months are gated, so this is bounded — but it is
real, and it is why relegation must be gentle.

---

## 6. Independence

`independenceWeight(maxAssistanceLevel, solutionRevealed)` is an **exported pure
function** (`packages/learning-intelligence-core/src/episode.ts:197-205`).
Independent means `maxAssistanceLevel < 0` **and** not revealed.

**Decision: call that function.** Do not invent a third definition. Two already
exist and disagree — `activityBuckets` uses `max_assistance_level < 0` while the
whole teacher surface uses `independence_weight >= 1`, and they differ on a
revealed solution.

### 6.1 A pre-existing defect this feature must not inherit

**Nothing in `src/` or `schools/` ever emits a `solution_revealed` event.**
`reduceEpisode` reads it (`episode.ts:322`) but no producer exists, so
`attempt_episodes.solution_revealed` is *always false* and `independence_weight`
**never reaches 0 through the reveal path**.

The teacher leaderboard's own header claims otherwise:

> *"`independence_weight` is 0 for a revealed solution, so it is assisted
> everywhere."* — `leaderboard.ts:46`

It is not. A learner who fails three times, is shown the reveal, and submits it
is currently recorded as an **independent** solve.

**Decision: the league's independence rule does not depend on that broken
signal.** It is computed at award time from (a) no `assistance_delivered` event
on the episode and (b) whether a reveal was served for this block, which is
derivable server-side from the prior-failure count that `revealFor` itself uses.
The defect is reported, not silently inherited and not silently fixed.

---

## 7. The week

The codebase forbids a second definition of "this week" in three places
(`activity-window.ts:7-16`, `teacher/period.ts:1-55`, `TEACHER_METRICS.md`).
There is exactly one: `windowFor(period, offset, now)` — **UTC, Monday-anchored,
half-open**.

There is **no canonical product timezone**. "Almaty" appears only in prose about
latency and DeepSeek peak pricing, never as a tz identifier.

The brief recommends anchoring the competition to `Asia/Almaty`. Measured, that
recommendation is unnecessary here:

```
UTC week starts Mon 00:00Z   ->  Almaty Mon 05:00
UTC week ends   Sun 23:59Z   ->  Almaty Mon 04:59
```

Kazakhstan is **UTC+5 with no DST** (unified onto a single zone in March 2024).
So the existing UTC boundary already lands at **Almaty Monday 05:00** — after any
plausible study session and before the school day. It is a good local boundary
that happens to be spelled in UTC.

**Decision: reuse `windowFor`. Do not fork the week.**

Forking would put five hours of every Sunday evening into the competition's week
but last week's chart, on two cards of the same screen. The cost of the
alternative — moving `windowFor` to Almaty — is `/you`, the home rail, the
teacher console, the leaderboard, and every existing test's expected bucket keys,
for a boundary that is already correct in practice.

Pinned by test: a fixture asserts the Almaty-local meaning of the boundary, so
the choice is a recorded decision rather than an accident, and a future move to a
real tz is a test change rather than a discovery.

---

## 8. Concurrency, on this stack

| Hazard | The rule here |
|---|---|
| Nested transactions | **Never** `sql.tx` inside `sql.tx`. PGlite's `tx` passes `this` and issues a bare `begin` — the inner commit commits the outer work. Use a free function taking `t: SqlExecutor`, as `insertEvents` does. |
| `rowCount` | Lies differently on the two drivers. Use `returning <col>` and test `rows.length`. |
| Read-then-write | Must be one statement behind a unique constraint. `resolveSubjectForUser` records a real 500 served to a child on their first answer because this was got wrong. |
| `select … for update` | Locks nothing when the row does not exist. `rate-limit.ts:35` has this hole. |
| Periodic work | No advisory locks anywhere. Copy `claimReducerLease` — a TTL row with `do update … where expires_at < now() returning owner`. |
| Arrays | Never `= any($1)` uncast. Use `= any($1::uuid[])`. |
| PGlite | Single-writer. A race that is impossible in development is live in production Postgres. |

---

## 9. Population

`store.subjectsInClass` / `isInClass` / `lastActivityForClass` filter on
`class_id` **alone** against `school_subject_scope`, which has no FK to
`school_classes` and no cross-school unique constraint. `config.pilot.classId`
defaults to the literal `"grade-9a"`, so two deployments collide and one school's
children appear in the other's list. Two existing tests **pin this defect as
still present**.

**Decision: the league population comes from `class_enrolments`, keyed
`(school_id, class_id)`.** Never from `school_subject_scope`.

This also excludes teachers: `resolveIdentity` mints a `learning_subject` for
any signed-in user who opens a lesson, **including a teacher or admin**, with no
role check. A league sourced from subject scope would rank the teacher alongside
the children.

---

## 10. Pilot reality

One private school, one class, **eighteen students**, one teacher, September
(`docs/pilot/PILOT_RUNBOOK.md`). `school_classes`' own comment: *"the pilot has
eighteen students, which is a fact about the pilot and not about the product."*

Provisioned display names are `Оқушы 1` … `Оқушы 18` — already pseudonymous.
`display_name` is documented as *"Shown to the teacher"*, and the student surface
currently shows **nothing whatsoever** about other students.

**Decision: one league group per class for the pilot.** Cross-school competition
is refused: migrations 0007 and 0012 both state *"There is deliberately no flat
admin path that reads across schools"*, and a cross-school leaderboard would
violate a stated architectural commitment. Group capacity is ~30 with soft
underfill; **no bots, no synthetic members, ever.**

---

## 11. Constraints inherited verbatim

- Migrations are the only schema definition. Next free number is **0023** (0002 and 0005 are gaps).
- Every new table: `begin;`/`commit;`, `create table if not exists`, `enable row level security`, `revoke all … from anon, authenticated`, `comment on table`.
- Participate in erasure by `on delete cascade` from `learning_subjects` and add **nothing** to `learning_forget_user`.
- No new methods on `LearningStore` — a new subsystem takes `sql: SqlExecutor` and lives in its own module (`schools/teacher/queries.ts:8-13` sets this precedent).
- `import "server-only";` is the first line of every file in this layer.
- Every visible string is a `Localized {kk, ru}` in `schools/presentation/labels.ts`. `product-surface.test.ts` fails an empty arm **and** `kk === ru` unless allowlisted as `shared`.
- Never `text-white` / `bg-white` / `border-white` — `theme.test.ts` walks all of `src/`. Use `b-*` tokens; the student ground is `bg-sx-page` (`sx-bg` has no light arm).
- Cards are `rounded-[20px] sx-card border-2 border-b-fg/20`. The `sx-*` type/radius scales are effectively unused by the student surface.
- Colour never travels alone — every state carries an icon or a word.
- `AppTab` is a closed union **and** `ICONS` is a 3-key map; adding a nav entry without extending both is a runtime crash.
- `OPS_COUNTERS` is a closed `as const` array; `bump()` will not compile with an unlisted name. No PII in any log field.
- No zod. Hand-narrow, and export the predicate next to the type.
- 404, not 403, for anything that would otherwise become an enumeration oracle.
- Shape-check any UUID before it reaches a `::uuid` cast, or Postgres 22P02 escapes as a 500.
- A failed store write is a 503 with `retryable`, never a 500.
- Feature flags for a pilot must be `=== "true"` (default OFF), and `config` reads `process.env` **once** at import — so the flag must be a pure function of its inputs to be testable.

---

## 12. Things that are not there and were assumed to be

- **No cron.** `LEARNING_CRON_SECRET` has zero consumers and `/api/learning/reduce` does not exist despite `.env.example` telling operators to point a cron at it. A settlement job is infrastructure being **built**, not used.
- **No browser E2E harness.** Playwright is a devDependency used only to scrape the reference site.
- **CI does not run the tests.** `.github/workflows/ci.yml` runs lint, typecheck and build only. A new suite is green in CI whether it passes or not.
- **No `TZ` pinned in the test runner.** Week-boundary tests must set it.
- **No `schools` table.** `school_id` is unregistered text in five tables. A per-school toggle has nowhere to live without a new table.
- **`docs/deployment/PRODUCTION_ENVIRONMENT.md` is stale** in at least three places. Read `schools/config.ts`.
