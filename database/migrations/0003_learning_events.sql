-- SolveX learning intelligence — Phase 1: the process stream.
--
-- WHY THIS EXISTS
-- Outcome data is already captured five ways (beta_events, solving_events,
-- session_events, product_events, problem_episodes). Process data is captured
-- zero ways: src/components/arena/ArenaLayout.tsx holds every run, edit and
-- test case in `useState<ArenaEvent[]>` and drops them on page unload. This
-- migration gives that stream somewhere to land.
--
-- Phase 1 is instrumentation ONLY. There is deliberately no skill model, no
-- misconception table and no belief here — those are Phase 2, and building
-- them before there is data to fit them is how a product ends up with
-- confident output from thin evidence.
--
-- WHERE THIS LIVES
-- The same Supabase Postgres project as beta_events, written only by the
-- server through /api/learning/*, using the service role. Never the Railway
-- SQLite volume: analytics load must never touch the judging hot path, which
-- is the rule 0001_beta_analytics.sql already established.
--
-- SEPARATE FROM beta_events ON PURPOSE
-- beta_events answers product questions and its 24-key prop allowlist is a
-- privacy guarantee worth keeping intact. This stream answers learning
-- questions and needs richer payloads, so it gets its own allowlist, its own
-- retention window, and its own review. They join at the subject level only.

-- ─── Subjects: one learner, four keys ────────────────────────────────────────
--
-- SolveX identifies a learner four different ways — anon_id, internal user_id,
-- Codeforces handle, anon coach key — and every existing store picks one and is
-- blind to the rest. This is the join, and it is what lets a visitor's
-- pre-signup Arena work attach to the account they create afterwards.

create table if not exists learning_subjects (
  subject_id      uuid        primary key,
  user_id         uuid        unique,      -- soft ref; `users` lives in Railway SQLite
  primary_anon_id uuid,                     -- first device that claimed this subject
  cf_handle       text,                     -- a data source, never an identity
  cohort          text        not null default 'public'
                  check (cohort in ('beta', 'internal', 'public')),
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  -- Merge, never reassign: one device can host several accounts, and history
  -- must not be retroactively handed to whoever signed in second.
  merged_into     uuid        references learning_subjects(subject_id)
);

create index if not exists idx_ls_user   on learning_subjects (user_id) where user_id is not null;
create index if not exists idx_ls_handle on learning_subjects (cf_handle) where cf_handle is not null;
create index if not exists idx_ls_live   on learning_subjects (last_seen_at desc) where merged_into is null;

create table if not exists learning_subject_aliases (
  alias_kind  text        not null check (alias_kind in ('anon_id', 'user_id', 'cf_handle')),
  alias_value text        not null,
  subject_id  uuid        not null references learning_subjects(subject_id),
  bound_at    timestamptz not null default now(),
  primary key (alias_kind, alias_value)
);

create index if not exists idx_lsa_subject on learning_subject_aliases (subject_id);

-- ─── Code blobs: content-addressed ───────────────────────────────────────────
--
-- A learner produces 30-50 near-identical snapshots in one episode. Storing
-- them by hash makes keeping the full history cheap enough that nobody has to
-- propose sampling it away.
--
-- `ast_shape` is a normalised structural fingerprint kept in its own column so
-- diff classification survives the deletion of the text. A learner who
-- exercises deletion loses their code, not the shape of their learning history.

create table if not exists code_blobs (
  blob_hash     text        primary key,        -- sha256 of normalised content
  content       text,                            -- dropped by retention; hash and shape persist
  content_len   int         not null,
  line_count    int         not null default 0,
  language      text        not null,
  ast_shape     text        not null default '',
  first_seen_at timestamptz not null default now()
);

create index if not exists idx_cb_seen on code_blobs (first_seen_at)
  where content is not null;

-- ─── L1: the raw stream ──────────────────────────────────────────────────────
--
-- NOT PARTITIONED, deliberately. Declarative partitioning would force the
-- partition key into the primary key, and the only stable candidate is the
-- client clock — which would mean a retried beacon lands in a different
-- partition and defeats the idempotency that `event_id` exists to provide.
-- With a 20-person beta the table is small; partition it on received_at when
-- volume justifies the operational cost, and accept a dedupe window then.

create table if not exists learning_events (
  -- Client-generated, one per logical action. This is the idempotency key: a
  -- retried beacon or a double-fired effect collapses to one row.
  event_id      uuid        primary key,

  subject_id    uuid        not null references learning_subjects(subject_id),
  episode_id    uuid,                             -- null only for pre-episode events
  session_id    uuid        not null,
  seq           int         not null default 0,   -- client-assigned order within an episode

  event_name    text        not null check (char_length(event_name) between 1 and 48),
  event_version smallint    not null default 1,

  -- Two clocks. occurred_at is the client's and is forgeable; received_at is
  -- ours. Anything ordered for analysis uses received_at, anything ordered
  -- within an episode uses seq.
  occurred_at   timestamptz not null,
  received_at   timestamptz not null default now(),

  -- Copied from session_events.source_trust, which already got this right.
  -- The evidence reducer in Phase 2 will ignore 'browser' for anything that
  -- raises a belief; a browser may add colour, never proof.
  source_trust  text        not null default 'browser'
                check (source_trust in ('server', 'judge', 'verifier', 'browser')),

  -- Stamped server-side from VERCEL_ENV and the roster. Not readable from the
  -- request body, so a preview deploy cannot claim to be production and a
  -- visitor cannot opt into the beta cohort.
  environment   text        not null check (environment in ('production', 'preview', 'development')),
  cohort        text        not null default 'public' check (cohort in ('beta', 'internal', 'public')),

  route         text        not null default '/',
  payload       jsonb       not null default '{}'::jsonb
);

create index if not exists idx_le_episode on learning_events (episode_id, seq)
  where episode_id is not null;
create index if not exists idx_le_subject on learning_events (subject_id, received_at desc);
create index if not exists idx_le_name    on learning_events (event_name, received_at desc);
-- The reducer's only hot query: episodes that have closed and not been reduced.
create index if not exists idx_le_closed  on learning_events (received_at desc)
  where event_name = 'episode_closed';

-- ─── L2: episodes ────────────────────────────────────────────────────────────
--
-- One row per (subject, task, attempt). A CACHE: every column is recomputable
-- from learning_events by replay, which is what makes `reducer_version` safe —
-- bump it and stale rows are recomputed rather than reinterpreted. Deleting
-- every row here costs a recomputation and loses no facts.

create table if not exists attempt_episodes (
  episode_id      uuid        primary key,
  subject_id      uuid        not null references learning_subjects(subject_id),
  task_ref        text        not null,           -- 'cf:1234A' | 'solvex:xyz' | 'duel:<id>'
  task_kind       text        not null default 'cp_problem'
                  check (task_kind in ('cp_problem', 'mission', 'challenge', 'duel')),
  attempt_ordinal int         not null default 1,

  opened_at       timestamptz not null,
  closed_at       timestamptz,
  -- Wall clock lies: a tab left open overnight is not an eight-hour episode.
  -- Gaps over IDLE_CEILING are excluded.
  active_seconds  int         not null default 0,
  resume_count    int         not null default 0,

  outcome         text        not null default 'in_progress'
                  check (outcome in ('in_progress', 'accepted', 'abandoned', 'expired', 'solution_revealed')),

  -- The reasoning trace, compacted. verdict_sequence is what happened;
  -- diff_class_sequence is what they did about it. Read together they are the
  -- episode.
  verdict_sequence    jsonb not null default '[]'::jsonb,
  diff_class_sequence jsonb not null default '[]'::jsonb,

  submissions         int not null default 0,
  runs                int not null default 0,
  self_authored_tests int not null default 0,
  statement_revisits  int not null default 0,
  language            text,

  -- Assistance provenance, server-observed. Mirrors the rule in backend
  -- migration 033: a solo claim is refused if any assisted invocation exists.
  max_assistance_level smallint not null default -1,   -- -1 = none requested
  intervention_count   int      not null default 0,
  solution_revealed    boolean  not null default false,

  -- Derived. Phase 2's skill model hangs on this; written now so the history
  -- exists when the model arrives.
  independence_weight  real not null default 1.0
                       check (independence_weight between 0 and 1),

  struggle_class  text check (struggle_class in
                  ('flow', 'productive_struggle', 'thrash', 'stuck', 'disengaged')),

  event_count     int not null default 0,
  reducer_version int not null,
  reduced_at      timestamptz not null default now()
);

-- attempt_ordinal is NOT unique per (subject, task), deliberately.
-- episode_id is already the primary key, so uniqueness here buys nothing the
-- table does not already have. What it would cost is real: the ordinal is
-- derived from opened_at ordering, so a late-arriving older episode renumbers
-- the ones after it, and a unique constraint turns that ordinary renumbering
-- into a mid-sweep collision the reducer has to dance around. The ordinal is a
-- reading convenience ("their third go at this problem"), not an identity.

create index if not exists idx_ae_attempt  on attempt_episodes (subject_id, task_ref, opened_at);
create index if not exists idx_ae_subject on attempt_episodes (subject_id, opened_at desc);
create index if not exists idx_ae_task    on attempt_episodes (task_ref, closed_at desc);
create index if not exists idx_ae_recent  on attempt_episodes (opened_at desc);
-- Supports the invalidation sweep after a reducer bump without a table scan.
create index if not exists idx_ae_stale   on attempt_episodes (reducer_version, reduced_at);

-- ─── L3 (partial): the intervention ledger ───────────────────────────────────
--
-- The table that makes "does the AI actually help?" answerable. It does not
-- exist today in any form: help_level is written to copilot_messages and never
-- read back against what happened next.
--
-- The pre_* columns are the whole point. Without the learner's state at the
-- moment we intervened, "the hint worked" is a claim with nothing to check it
-- against.

create table if not exists interventions (
  intervention_id uuid        primary key,
  subject_id      uuid        not null references learning_subjects(subject_id),
  episode_id      uuid        not null,

  kind            text        not null check (kind in
                  ('hint', 'nova_utterance', 'builder_patch', 'counterexample', 'solution')),
  level           smallint    check (level between 0 and 4),
  trigger         text        not null default 'learner_requested'
                  check (trigger in ('learner_requested', 'nova_offered', 'policy_auto')),
  mode            text,                            -- CopilotMode, for Phase 4 slicing

  -- The counterfactual anchor.
  pre_attempts       int     not null default 0,
  pre_runs           int     not null default 0,
  pre_active_seconds int     not null default 0,
  pre_last_verdict   text,
  pre_diff_class     text,
  pre_code_hash      text,

  -- What we said, structurally. The prose stays in copilot_messages under its
  -- existing consent gate; this stream stores the shape, not the words.
  evidence_type   text,                            -- CopilotEvidenceType, verbatim
  contains_code   boolean     not null default false,
  content_hash    text,
  content_len     int         not null default 0,
  model           text,

  -- Experiment arm. Nothing randomises in Phase 1, but the columns ship now:
  -- starting an experiment is nearly free and back-filling one is impossible.
  experiment_key  text,
  arm             text,

  delivered_at    timestamptz not null default now()
);

create index if not exists idx_iv_episode on interventions (episode_id, delivered_at);
create index if not exists idx_iv_subject on interventions (subject_id, delivered_at desc);
create index if not exists idx_iv_arm     on interventions (experiment_key, arm)
  where experiment_key is not null;

create table if not exists intervention_outcomes (
  intervention_id uuid        primary key references interventions(intervention_id) on delete cascade,

  -- Fixed BEFORE anyone looks at the data, and stored on the row so it cannot
  -- be quietly widened later to make a number look better.
  window_spec     text        not null default 'same_episode/20min_active/3_submissions',

  outcome         text        not null check (outcome in (
                    'resolved_independently',  -- AC after a real edit, low overlap with the hint
                    'resolved_by_transfer',    -- AC, but the diff is largely the hint's own code
                    'progressed',              -- no AC, but got further
                    'escalated',               -- asked for the next level
                    'stalled',                 -- no edit above cosmetic
                    'regressed',               -- got worse: the most expensive thing we can do
                    'abandoned')),

  post_diff_class    text,
  delta_tests_passed int,
  seconds_to_outcome int,
  reducer_version    int not null,
  computed_at        timestamptz not null default now()
);

create index if not exists idx_ivo_outcome on intervention_outcomes (outcome, computed_at desc);

-- ─── RLS: server-only, matching 0001 and backend 015/033/035 ─────────────────
-- RLS enabled with zero policies: anon and authenticated get nothing, the
-- service role bypasses. Clients read through /api/learning/*, which resolves
-- ownership from a verified bearer token.

alter table learning_subjects        enable row level security;
alter table learning_subject_aliases enable row level security;
alter table code_blobs               enable row level security;
alter table learning_events          enable row level security;
alter table attempt_episodes         enable row level security;
alter table interventions            enable row level security;
alter table intervention_outcomes    enable row level security;

revoke all on learning_subjects        from anon, authenticated;
revoke all on learning_subject_aliases from anon, authenticated;
revoke all on code_blobs               from anon, authenticated;
revoke all on learning_events          from anon, authenticated;
revoke all on attempt_episodes         from anon, authenticated;
revoke all on interventions            from anon, authenticated;
revoke all on intervention_outcomes    from anon, authenticated;

-- ─── Deletion, export, retention ─────────────────────────────────────────────
--
-- One deletion path, not two. beta_analytics_forget_user() already handles the
-- anon-id join correctly for beta_events; this covers the learning stream, and
-- solvex_forget_user() below calls both so a new table can never be added to
-- one path and forgotten in the other.

create or replace function learning_forget_user(target uuid)
returns table (events_deleted bigint, episodes_deleted bigint, interventions_deleted bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  subj uuid;
  ev bigint := 0;
  ep bigint := 0;
  iv bigint := 0;
begin
  select subject_id into subj from learning_subjects where user_id = target;
  if subj is null then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  delete from intervention_outcomes
   where intervention_id in (select intervention_id from interventions where subject_id = subj);
  delete from interventions where subject_id = subj;
  get diagnostics iv = row_count;

  delete from learning_events where subject_id = subj;
  get diagnostics ev = row_count;

  delete from attempt_episodes where subject_id = subj;
  get diagnostics ep = row_count;

  -- Aliases go too: an anon_id left behind would still let the device be
  -- re-identified by joining events from the same browser.
  delete from learning_subject_aliases where subject_id = subj;
  delete from learning_subjects where subject_id = subj;

  return query select ev, ep, iv;
end;
$$;

create or replace function solvex_forget_user(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  beta_result record;
  learn_result record;
begin
  select * into beta_result from beta_analytics_forget_user(target);
  select * into learn_result from learning_forget_user(target);
  return jsonb_build_object(
    'beta_events_deleted',      beta_result.events_deleted,
    'beta_feedback_deleted',    beta_result.feedback_deleted,
    'learning_events_deleted',  learn_result.events_deleted,
    'episodes_deleted',         learn_result.episodes_deleted,
    'interventions_deleted',    learn_result.interventions_deleted
  );
end;
$$;

create or replace function learning_export_user(target uuid)
returns setof learning_events
language sql
stable
as $$
  select e.* from learning_events e
   where e.subject_id in (select subject_id from learning_subjects where user_id = target)
   order by e.received_at;
$$;

-- Raw events: 180 days, matching beta_analytics_purge. Episodes and
-- interventions are small, are the learner's actual record, and are kept.
create or replace function learning_events_purge(older_than interval default interval '180 days')
returns bigint
language plpgsql
as $$
declare deleted bigint;
begin
  delete from learning_events where received_at < now() - older_than;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- Code text: 90 days. The hash, length and ast_shape survive, so diff
-- classification and episode replay structure keep working after the text is
-- gone. Consent-gated retention of the text itself is Phase 4, when there is a
-- training pipeline to justify it.
create or replace function code_blobs_drop_content(older_than interval default interval '90 days')
returns bigint
language plpgsql
as $$
declare cleared bigint;
begin
  update code_blobs set content = null
   where content is not null and first_seen_at < now() - older_than;
  get diagnostics cleared = row_count;
  return cleared;
end;
$$;
