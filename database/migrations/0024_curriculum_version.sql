-- 0024 — Curriculum version: make Python-era evidence structurally incapable of
--        satisfying C++ progression
--
-- ── The defect ──────────────────────────────────────────────────────────────
--
-- Python block `m1.as.b1` and C++ block `m1.as.b1` share a logical id. Every
-- progression read is `subject_id + block_id`:
--
--     lesson_completions   primary key (subject_id, lesson_id)
--     blockAttempts        learning_events, split_part(task_ref) = block_id
--
-- so an accepted Python-era verdict on `m1.as.b1` satisfied the C++
-- independence requirement for the same month, and the next C++ month unlocked.
-- A learner would be credited for demonstrating in C++ something they had only
-- ever done in Python.
--
-- It had not materialised — production holds zero accepted independence blocks
-- — but "currently zero" is a fact about today's data, not an architecture.
--
-- ── Why the SUBJECT carries the version, and not every evidence table ───────
--
-- The alternative was a `curriculum_version` column on lesson_completions,
-- learning_submissions, learning_events, artifacts and the rest, plus a
-- predicate on every query that reads them.
--
-- That design is only as strong as the next query somebody writes. It leaks the
-- day a developer adds a read and forgets the WHERE clause, and nothing fails
-- loudly when they do — the number just quietly includes the wrong curriculum.
--
-- Scoping the SUBJECT makes the leak unrepresentable instead. One subject per
-- (account, curriculum version) means a C++ subject id has no Python rows
-- anywhere in the database. Every existing `where subject_id = $1` is therefore
-- correct by construction, and a future query cannot forget a predicate that
-- does not exist. The evidence tables are untouched by this migration, which is
-- also why it is small enough to review.
--
-- The cost, stated plainly: one account now has two subject rows, so anything
-- that assumed account→subject was 1:1 has to say WHICH subject it means. That
-- is `learning_subjects.user_id unique`, the alias primary key, and the class
-- roster. All three are handled below.
--
-- ── What this migration does NOT do ─────────────────────────────────────────
--
-- It does not mutate any existing row into C++. Every pre-versioning row is
-- backfilled to 'python-year1-v1' and stays there.
--
-- READ THIS BEFORE BELIEVING THE BACKFILL: 'python-year1-v1' is the FAIL-CLOSED
-- bucket for everything that predates versioning. It is NOT a claim that every
-- backfilled row was written in Python. Production contains a handful of rows
-- created while acceptance-testing the C++ build against the production
-- database (m1.l1.b2, m1.l1.b4, m1.l1.b5 verdicts — all lesson blocks, no
-- independence blocks). Those rows are C++ in origin and are being quarantined
-- anyway, deliberately: they are test data, they must not credit a real
-- learner, and a bucket that errs toward "does not count" is the only safe
-- default when the true provenance was never recorded. Erring the other way
-- would hand out exactly the credit this migration exists to prevent.
--
-- The version is never INFERRED. Nothing here inspects source code for
-- `#include` or `print(` — provenance guessed from syntax is not provenance.

begin;

-- ── learning_subjects ───────────────────────────────────────────────────────

alter table learning_subjects
  add column if not exists curriculum_version text;

-- Backfill, then enforce. Split in two so the column can be added to a table
-- that already has rows without a default that outlives the migration.
update learning_subjects
   set curriculum_version = 'python-year1-v1'
 where curriculum_version is null;

alter table learning_subjects
  alter column curriculum_version set not null;

-- The DEFAULT is the ACTIVE curriculum, and it is set AFTER the backfill above
-- so it cannot touch a single existing row.
--
-- Going without one was the first attempt and it was wrong. Every direct
-- inserter — test fixtures, `scripts/seed-teacher-demo.ts`, the league load
-- harness — is creating a subject for the curriculum being run right now, so a
-- missing default does not make them think about the question; it makes
-- fourteen files hand-copy the same string literal, which is strictly more
-- places for the next version bump to be got wrong.
--
-- The hazard a default introduces is that it goes STALE: bump
-- `CURRICULUM_VERSION` in the code and this line keeps minting subjects for the
-- old one, silently. `tests/learning/curriculum-version-isolation.test.ts` pins
-- the database default against the constant precisely so that cannot happen —
-- changing the constant without writing the migration that moves the default
-- fails the suite.
alter table learning_subjects
  alter column curriculum_version set default 'cpp17-year1-v1';
-- Guarded rather than `add constraint if not exists`, which Postgres does not
-- have. The migration runner records applied files, so a re-run is already
-- prevented — but a migration that only works once is a migration that cannot
-- be replayed onto a restored snapshot, and that is exactly when somebody needs
-- it to work.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'learning_subjects_curriculum_version_check'
       and conrelid = 'learning_subjects'::regclass
  ) then
    alter table learning_subjects
      add constraint learning_subjects_curriculum_version_check
      check (curriculum_version in ('python-year1-v1', 'cpp17-year1-v1'));
  end if;
end $$;

-- `user_id unique` becomes `(user_id, curriculum_version) unique`.
--
-- NULL user_id (anonymous subjects) still does not conflict with anything:
-- Postgres treats NULLs as distinct in a unique index, exactly as the old
-- single-column constraint did.
alter table learning_subjects
  drop constraint if exists learning_subjects_user_id_key;

create unique index if not exists learning_subjects_user_version_key
  on learning_subjects (user_id, curriculum_version);

create index if not exists learning_subjects_version_idx
  on learning_subjects (curriculum_version);

-- ── learning_subject_aliases ────────────────────────────────────────────────
--
-- The real linchpin. Its primary key was (alias_kind, alias_value), so one
-- user_id resolved to exactly ONE subject and the version could never be
-- expressed. Signing in would have handed a learner whichever subject they got
-- first, regardless of which curriculum they were opening.

alter table learning_subject_aliases
  add column if not exists curriculum_version text;

update learning_subject_aliases
   set curriculum_version = 'python-year1-v1'
 where curriculum_version is null;

alter table learning_subject_aliases
  alter column curriculum_version set not null;

-- Same reasoning, same ordering: after the backfill, so no existing row moves.
alter table learning_subject_aliases
  alter column curriculum_version set default 'cpp17-year1-v1';

-- Replace the two-column primary key with the three-column one, but ONLY if it
-- is still the two-column version. Dropping and re-adding unconditionally would
-- work on a second run too, yet it would briefly leave the table without a
-- primary key on every replay; checking first keeps the constraint continuous.
do $$
begin
  if exists (
    select 1
      from pg_constraint c
     where c.conname   = 'learning_subject_aliases_pkey'
       and c.conrelid  = 'learning_subject_aliases'::regclass
       and array_length(c.conkey, 1) = 2
  ) then
    alter table learning_subject_aliases drop constraint learning_subject_aliases_pkey;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname  = 'learning_subject_aliases_pkey'
       and conrelid = 'learning_subject_aliases'::regclass
  ) then
    alter table learning_subject_aliases
      add primary key (alias_kind, alias_value, curriculum_version);
  end if;
end $$;

-- ── school_subject_scope ────────────────────────────────────────────────────
--
-- Deliberately UNCHANGED. It keys on subject_id, which is now version-specific,
-- so it inherits the scoping for free — adding a column here would duplicate a
-- value the join already determines.
--
-- One consequence has to be handled in code rather than schema: a learner who
-- has both a Python and a C++ subject has TWO rows here, so a class roster that
-- reads `select subject_id from school_subject_scope where class_id = $1` would
-- list them twice. `subjectsInClass` therefore joins to learning_subjects and
-- filters on the active curriculum version. See schools/store/learning-store.ts.

comment on column learning_subjects.curriculum_version is
  'Which body of curriculum content this subject''s evidence was earned against. '
  'Distinct from language: a future C++ revision is still cpp17 but is not the '
  'same curriculum. One subject per (account, curriculum_version) is what makes '
  'cross-curriculum credit unrepresentable rather than merely filtered.';

comment on column learning_subject_aliases.curriculum_version is
  'Part of the primary key. Without it one user_id resolves to one subject and '
  'the version cannot be expressed at sign-in.';

-- ── Erasure must follow the account, not one of its subjects ────────────────
--
-- `learning_forget_user` (migration 0003) opened with:
--
--     select subject_id into subj from learning_subjects where user_id = target;
--
-- A plpgsql `select … into` a scalar takes ONE row and does not complain when
-- the query returns more. That was correct while an account had exactly one
-- subject, and this migration is what makes it false: a learner with a Python
-- subject and a C++ subject would have had ONE of them erased — arbitrarily,
-- whichever the planner returned first — leaving the other subject''s events,
-- episodes, interventions and aliases in the database, still joinable to the
-- device that produced them.
--
-- Erasure is a promise to a child and their parents, so this ships in the same
-- migration as the schema change rather than in a follow-up: there must be no
-- window in which the version split exists and erasure only half works.
--
-- Redefined to iterate every subject the account owns, in ONE statement per
-- table rather than a loop, so the row counts it returns stay truthful.

create or replace function learning_forget_user(target uuid)
returns table (events_deleted bigint, episodes_deleted bigint, interventions_deleted bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  subjs uuid[];
  ev bigint := 0;
  ep bigint := 0;
  iv bigint := 0;
begin
  -- EVERY subject for this account, across every curriculum version.
  select coalesce(array_agg(subject_id), '{}')
    into subjs
    from learning_subjects
   where user_id = target;

  if array_length(subjs, 1) is null then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  delete from intervention_outcomes
   where intervention_id in (
     select intervention_id from interventions where subject_id = any(subjs)
   );
  delete from interventions where subject_id = any(subjs);
  get diagnostics iv = row_count;

  delete from learning_events where subject_id = any(subjs);
  get diagnostics ev = row_count;

  delete from attempt_episodes where subject_id = any(subjs);
  get diagnostics ep = row_count;

  -- Aliases go too: an anon_id left behind would still let the device be
  -- re-identified by joining events from the same browser.
  delete from learning_subject_aliases where subject_id = any(subjs);
  delete from learning_subjects where subject_id = any(subjs);

  return query select ev, ep, iv;
end;
$$;

commit;
