-- 0007 — school adapter
--
-- Three fixes the imported schema needs before it can hold school data. Each
-- one is a real defect found by reading the shipped migrations, not a
-- preference:
--
--   1. `attempt_episodes.task_kind` has a CHECK that rejects 'lesson'. Every
--      insert from the lesson runtime fails, loudly, at the database.
--   2. `solvex_forget_user()` calls `beta_analytics_forget_user()`, which is
--      defined in migration 0001. That migration is not part of the export, so
--      the function does not exist and consent revocation errors out. The
--      programme commits to deleting a child's data on request (PDF p.4), so
--      this is not optional.
--   3. Nothing scopes a subject to a school or a class. Without it there is no
--      way to express "a teacher sees their own class" — only "an admin sees
--      everyone", which is exactly the access model a school cannot accept.
--
-- Safe to run more than once.

begin;

-- ── 1. task_kind ────────────────────────────────────────────────────────────
--
-- Replaced rather than widened in place, because the constraint name is what
-- the next reader will grep for and an unnamed inline CHECK is invisible.

alter table attempt_episodes
  drop constraint if exists attempt_episodes_task_kind_check;

alter table attempt_episodes
  add constraint attempt_episodes_task_kind_check
  check (task_kind in (
    -- imported vocabulary, kept so CP content still fits
    'cp_problem', 'mission', 'challenge', 'duel',
    -- school vocabulary
    'lesson',      -- a block inside a taught lesson
    'practice',    -- independent practice, no worked example precedes it
    'assessment',  -- the monthly check
    'contest'      -- a timed round
  ));

comment on constraint attempt_episodes_task_kind_check on attempt_episodes is
  'Widened by 0007. The shipped constraint rejected every school task kind.';


-- ── 2. consent revocation ───────────────────────────────────────────────────
--
-- Redefined to tolerate the absent beta-analytics function instead of failing.
-- Deliberately still calls it when present: a deployment that later applies
-- 0001 must not quietly stop deleting those rows.

create or replace function solvex_forget_user(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  learn_result record;
  beta_json    jsonb := null;
begin
  if to_regprocedure('beta_analytics_forget_user(uuid)') is not null then
    execute 'select to_jsonb(t) from beta_analytics_forget_user($1) t'
      into beta_json using target;
  end if;

  select * into learn_result from learning_forget_user(target);

  return jsonb_build_object(
    'beta_analytics', coalesce(beta_json, '"not_installed"'::jsonb),
    'learning', jsonb_build_object(
      'events_deleted',        learn_result.events_deleted,
      'episodes_deleted',      learn_result.episodes_deleted,
      'interventions_deleted', learn_result.interventions_deleted
    )
  );
end;
$$;

comment on function solvex_forget_user(uuid) is
  'Erases a learner. 0007 made the beta-analytics half optional: migration 0001 '
  'is not part of the learning-intelligence export, and the hard call made '
  'consent revocation fail outright.';


-- ── 3. school scoping ───────────────────────────────────────────────────────
--
-- One row per subject, saying which school and class it belongs to. A separate
-- table rather than columns on `learning_subjects` so the imported table stays
-- byte-identical to the export and its own migrations keep applying cleanly.

create table if not exists school_subject_scope (
  subject_id  uuid primary key references learning_subjects(subject_id) on delete cascade,
  school_id   uuid not null,
  class_id    uuid not null,
  created_at  timestamptz not null default now()
);

create index if not exists school_subject_scope_class_idx
  on school_subject_scope (class_id);
create index if not exists school_subject_scope_school_idx
  on school_subject_scope (school_id);

comment on table school_subject_scope is
  'Which school and class a learning subject belongs to. Every teacher-facing '
  'query joins through here. There is deliberately no flat admin path that '
  'reads across schools.';

commit;
