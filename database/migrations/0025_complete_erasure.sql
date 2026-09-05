-- 0025 — Erasure that removes the child, not only their ledger
--
-- ── The defect, measured ────────────────────────────────────────────────────
--
-- `learning_forget_user` is the erasure path. It is thorough about the
-- learning ledger — events, episodes, interventions, aliases, and the nineteen
-- tables that cascade from `learning_subjects` — and it has never touched the
-- school side of the schema, which is where the child's NAME is.
--
-- Seeded one learner with a row in every table and called it. What survived:
--
--     school_accounts       1   -- username, display name, password hash
--     school_sessions       1   -- a live session: an erased learner stays signed in
--     class_enrolments      1   -- which class this child was in
--     account_preferences   1
--     nova_usage            1   -- per-day request counts, keyed by subject
--     rate_limit_bucket     2   -- keys built from the user and subject ids
--
-- So "we erased them" removed the evidence of what a child did and kept the
-- record of who they were. `schools/legal/documents.ts` promises a parent that
-- data is erased on the school's request; this is the gap between that sentence
-- and the database.
--
-- ── Why nova_usage and rate_limit_bucket were missed ────────────────────────
--
-- Both are subject- or identifier-keyed and neither has a foreign key: they are
-- counters, added later, in different migrations, by people reasonably not
-- thinking about deletion. That is the shape of every future miss too, which is
-- why `schools/legal/erasure.ts` ends its run with a scan derived from
-- `information_schema` rather than from this file — a table added next term
-- shows up as a number rather than as silence.
--
-- ── The shape of the fix ────────────────────────────────────────────────────
--
-- `learning_forget_user` keeps its job and its signature: the imported
-- subsystem's ledger. `school_forget_user` is the complete one — it removes the
-- school-side rows, calls the ledger function, and returns a per-table count so
-- the operator running it has something to show. `solvex_forget_user` (the
-- top-level "erase this person") now calls it, so no caller can get the partial
-- behaviour by picking the obvious name.
--
-- Teachers: `curriculum_publications.reviewer_id` and `withdrawn_by` name the
-- adult who approved a month of curriculum for children. Erasing a teacher
-- would destroy that trail, so the operator tool refuses and points at
-- `disabled_at`, which takes effect immediately. This function does not refuse
-- — a school that must erase an adult can, deliberately, from psql.

begin;

-- ── The other half of "which subjects" ──────────────────────────────────────
--
-- `learning_forget_user` collected subjects with `where user_id = target`, and
-- that is one of the two bindings. The imported subsystem finds a subject
-- through `learning_subject_aliases` under `alias_kind = 'user_id'` — see
-- `LearningStore.resolveSubjectForUser` — and a subject whose `user_id` column
-- was cleared by a merge is still that child's work. It would have been left
-- behind, still joinable to the account through the alias row.
--
-- Same signature, same ledger-only job. Only the derivation of `subjs` changes,
-- and it now matches `findLearner` in `schools/legal/erasure.ts`, so the
-- residual scan and the deletion cannot disagree about who is being erased.

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
  select coalesce(array_agg(subject_id), '{}')
    into subjs
    from (
      select subject_id from learning_subjects where user_id = target
      union
      select subject_id from learning_subject_aliases
       where alias_kind = 'user_id' and alias_value = target::text
    ) s;

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

create or replace function school_forget_user(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  subjs uuid[];
  counts jsonb := '{}'::jsonb;
  n bigint;
  learn record;
begin
  -- The same union `learning_forget_user` uses, for the same reason: a subject
  -- bound only through the alias table is still this child's.
  select coalesce(array_agg(subject_id), '{}')
    into subjs
    from (
      select subject_id from learning_subjects where user_id = target
      union
      select subject_id from learning_subject_aliases
       where alias_kind = 'user_id' and alias_value = target::text
    ) s;

  -- Subject-keyed and NOT cascaded: these would survive the delete of
  -- `learning_subjects` below, because they carry no foreign key to it.
  delete from nova_usage where subject_id = any(subjs);
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('nova_usage', n);

  -- Counters whose KEY is the identifier — `submit:<subject>`,
  -- `password-change:<user>`, the login-failure key. The row holds no content,
  -- so what this removes is the last copy of the id itself.
  delete from rate_limit_bucket
   where bucket_key like '%' || target::text || '%'
      or exists (select 1 from unnest(subjs) s where bucket_key like '%' || s::text || '%');
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('rate_limit_bucket', n);

  -- The ledger, and everything that cascades from a subject.
  select * into learn from learning_forget_user(target);
  counts := counts || jsonb_build_object(
    'learning_events', learn.events_deleted,
    'attempt_episodes', learn.episodes_deleted,
    'interventions', learn.interventions_deleted,
    -- Reported from the list this function resolved, because the ledger
    -- function does not return it. An operator reading the output must not
    -- have to wonder why the subject row is missing from a list that named it
    -- in the dry run — silence there reads as "not erased".
    'learning_subjects', coalesce(array_length(subjs, 1), 0)
  );

  delete from account_preferences where user_id = target;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('account_preferences', n);

  delete from class_enrolments where user_id = target;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('class_enrolments', n);

  delete from class_teachers where user_id = target;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('class_teachers', n);

  -- Sessions before the account, and both here rather than by cascade, so the
  -- count is real. A live session outliving an erasure is not a data-retention
  -- footnote: it is a signed-in browser belonging to a child who was deleted.
  delete from school_sessions where user_id = target;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('school_sessions', n);

  delete from school_accounts where user_id = target;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('school_accounts', n);

  return counts;
end;
$$;

comment on function school_forget_user(uuid) is
  'Erases one person completely: the school account, its sessions, enrolment '
  'and preferences, the subject-keyed counters that carry no foreign key, and '
  'the whole learning ledger via learning_forget_user. Returns per-table '
  'counts. Run it through scripts/erase-learner.ts, which adds a dry run, a '
  'residual scan derived from information_schema, and a rollback if anything '
  'is left.';

-- The top-level name now means what it says.
create or replace function solvex_forget_user(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  beta_json jsonb := null;
begin
  if to_regprocedure('beta_analytics_forget_user(uuid)') is not null then
    execute 'select to_jsonb(t) from beta_analytics_forget_user($1) t'
      into beta_json using target;
  end if;

  return jsonb_build_object(
    'beta_analytics', coalesce(beta_json, '"not_installed"'::jsonb),
    'school', school_forget_user(target)
  );
end;
$$;

comment on function solvex_forget_user(uuid) is
  'Erase this person. 0025 pointed it at school_forget_user: it used to call '
  'learning_forget_user alone, which removed what a child DID and kept the '
  'record of who they WERE — account, sessions, enrolment, preferences.';

commit;
