# Database

Three migrations, in order. They are **verbatim copies** of the SolveX
originals — not reconstructions — because the CHECK constraints, index
predicates and RLS posture are load-bearing and a "cleaned up" rewrite would
silently drop one.

```
migrations/
  0003_learning_events.sql        the ledger, subjects, episodes, interventions
  0004_failure_attribution.sql    attribution columns + coverage views
  0006_learner_state.sql          the L4/L5/L6 projections
```

The numbering gaps are real. `0001`/`0002` are beta product analytics and
`0005` is a feedback system; neither is part of Learning Intelligence. Apply
`0003 → 0004 → 0006` and nothing else.

---

## 1. Read this before you apply anything

### Two CHECK constraints will reject school data

Not "will need adapting later" — will reject the insert.

**`attempt_episodes.task_kind`** (`0003_learning_events.sql:149`)

```sql
task_kind text not null default 'cp_problem'
          check (task_kind in ('cp_problem', 'mission', 'challenge', 'duel'))
```

A lesson, a practice block or an assessment is none of those. Inserting one
raises `23514 check_violation`. Fix before first write:

```sql
alter table attempt_episodes drop constraint attempt_episodes_task_kind_check;
alter table attempt_episodes add  constraint attempt_episodes_task_kind_check
  check (task_kind in (
    'cp_problem', 'mission', 'challenge', 'duel',        -- keep if you share a database with SolveX CP
    'lesson', 'practice', 'assessment', 'verification'   -- yours
  ));
```

(Confirm the generated constraint name with `\d attempt_episodes` — Postgres
names it from the table and column, but an existing database may differ.)

**`learning_subject_aliases.alias_kind`** (`0003_learning_events.sql:53`)

```sql
alias_kind text not null check (alias_kind in ('anon_id', 'user_id', 'cf_handle'))
```

If students are identified by a school roster id rather than a Supabase auth
uid, add your kind the same way. `cf_handle` is Codeforces-specific and safe to
drop from the list *if* no SolveX CP data shares the table.

### What is NOT constrained, deliberately

`learning_events.event_name` has only a length check (`between 1 and 48`), not
an enum. **New school event names insert without a migration.** The taxonomy is
enforced in application code (`packages/learning-contracts/src/events.ts`), not
by the database — so adding `lesson_started` is a one-line change to
`LEARNING_EVENTS`, not a schema change.

Same for `learning_events.payload` — a jsonb column filtered by the application
allowlist. See §4.

### One function will fail to create

`0003` defines `solvex_forget_user(uuid)`, which calls
`beta_analytics_forget_user(uuid)` from migration `0001`. If you are not
applying `0001`, this `create or replace function` fails.

`learning_forget_user(uuid)` — the one that actually deletes learning data — is
standalone and works. Either drop the `solvex_forget_user` wrapper from your
copy of `0003`, or write your own that calls `learning_forget_user` plus
whatever else your product stores. **Do not skip GDPR/COPPA deletion because a
wrapper failed to compile**; schools carry stricter deletion obligations than
SolveX ever did.

---

## 2. Tables

### REQUIRED — the core cannot run without these

| Table | Migration | Why | School-ready? |
|---|---|---|---|
| `learning_subjects` | 0003 | The opaque `subject_id` everything keys on | Drop/ignore `cf_handle` |
| `learning_subject_aliases` | 0003 | Maps an account or device to a subject | Extend `alias_kind` |
| `learning_events` | 0003 | The ledger. **Source of truth** — every projection is recomputable from it | Yes |
| `attempt_episodes` | 0003 | L2 projection. A cache; rebuildable | Extend `task_kind` |
| `learner_state` | 0006 | L4. What `decide()` reads | Yes, unchanged |
| `learner_skill_state` | 0006 | L4 per-skill, holds misconceptions | Yes, unchanged |

`learning_events` is listed REQUIRED, not MAYBE. Every other table is a
projection that gets recomputed when a `*_VERSION` constant is bumped; if the
ledger is gone, a version bump destroys history instead of rebuilding it.

### REQUIRED IF you use interventions or action memory

| Table | Migration | Why |
|---|---|---|
| `interventions` | 0003 | L3. One row per hint given |
| `intervention_outcomes` | 0003 | L3. What happened after each hint |
| `learning_actions` | 0006 | L5. Decisions issued, so they can be verified later |
| `learning_action_outcomes` | 0006 | L6. Whether an action worked |

Skipping these costs `hintEffectiveness`, the assisted-vs-independent split, and
`REDUCE_ASSISTANCE` — which is the highest-priority action in the engine. If
Nova gives hints in your product, you need them.

### OPTIONAL

| Table | Migration | Notes |
|---|---|---|
| `code_blobs` | 0003 | Source text under retention, content-addressed. Only needed if learners write code AND you want diff classification. Lessons with multiple-choice answers do not need it. |

### DO NOT COPY

| Table | Why |
|---|---|
| `beta_events`, `beta_feedback` (0001) | Product funnel analytics, unrelated |
| Everything in `0005_feedback_intelligence.sql` | A separate user-feedback product |
| Backend SQLite tables (`solvex-backend`) | Codeforces catalogue, verified packs, contest data. See `SOLVEX_ADAPTER_REFERENCE.md`. |

---

## 3. Views

`0004` and `0006` create views. All are read-only aggregates over the tables
above; none are required for the core to function, and all are safe to keep.

| View | Migration | Answers |
|---|---|---|
| `learning_failure_attributions` | 0004 | Every attributed failure, flattened out of the event stream |
| `learning_attribution_coverage` | 0004 | **What share of failures we can explain.** The number the whole system's honesty rests on — watch it |
| `learning_outcomes_daily` | 0006 | Outcomes per day |
| `learning_action_effectiveness` | 0006 | Did action type X actually work |
| `learning_dependency_trend` | 0006 | Hint dependency over time |

`learning_attribution_coverage` is the one to wire into a dashboard on day one.
If it reads near zero, the engine will answer `DIAGNOSE` for everybody and the
product will feel like it knows nothing — which will be correct, and you will
want to know it is the pipeline rather than the learners.

---

## 4. Security posture — inherit this, do not re-derive it

Every learning table is created with **RLS enabled and zero policies**. That is
not an oversight and not a to-do:

```sql
alter table learning_events enable row level security;
-- (no policies follow)
```

With RLS on and no policies, the anon and authenticated Postgres roles can read
nothing. Only the **service role** — which bypasses RLS — can touch these
tables, and it lives exclusively in server-side route handlers. A browser
holding a valid user JWT still gets zero rows.

This is why the read path is an API route (`/api/learning/state/me`) rather than
a direct Supabase query from the client. Keep it that way. Schools amplify the
stakes: one permissive policy written to "make the dashboard easier" exposes
every child's failure history to every other logged-in account.

Two more inherited properties worth preserving:

- **Source code never enters `learning_events.payload`.** It travels under a
  transport-only key, is hashed, stored in `code_blobs` under retention, and
  only `blob_hash` is written to the payload. Enforced in `sanitizePayload`.
- **Retention is explicit**: raw events 180 days, projections longer. `0003`
  carries the purge function.

---

## 5. Order and idempotency

```
0003_learning_events.sql
0004_failure_attribution.sql     -- alters attempt_episodes; needs 0003
0006_learner_state.sql           -- FKs to learning_subjects; needs 0003
```

Every statement uses `if not exists` / `create or replace`, so re-running is
safe. `0004` and `0006` both depend on `0003`; neither depends on the other.

---

## 6. Minimal school starting point

If you want the smallest thing that runs, apply `0003` + `0006`, skip `0004`,
apply the two `ALTER`s from §1, and drop the `solvex_forget_user` wrapper.

You then have: an event ledger, episodes, learner state and the decision
engine's inputs. You will **not** have attribution — every failure will be
`unattributed_failure`, every learner will get `DIAGNOSE`, and Nova will ask
questions rather than teach. That is the honest degraded mode and it is safe;
it is also exactly what SolveX itself does for ~75% of failures today.

Add `0004` when you have a deterministic evidence extractor that can say *why*
a learner got something wrong. `SOLVEX4SCHOOLS_ADAPTER_SPEC.md` §3 covers what
that has to look like.
