-- 0008 — school runtime
--
-- What the shipped subsystem never needed because a human clicked a button.
-- This product must reduce without anyone clicking anything, must rate-limit a
-- classroom that shares one NAT gateway, and must not hand every logged-in
-- account the map of which child is in which class.

begin;

-- ── 1. The sweep lease ──────────────────────────────────────────────────────
--
-- Three things can start a sweep: an in-process interval, an opportunistic hook
-- after ingest, and an external cron. Exactly one may run at a time or episodes
-- get reduced twice concurrently and the projections race.
--
-- A lease rather than an advisory lock: an advisory lock dies with its
-- connection, which is right for a crash and wrong for a deploy — the new
-- process should be able to take over on a schedule, not immediately, or a
-- rolling restart has two sweepers for the overlap.

create table if not exists reducer_lease (
  id         text primary key,
  owner      text        not null,
  expires_at timestamptz not null
);

comment on table reducer_lease is
  'Single-row mutex for the reducer sweep. A crashed holder expires rather than wedging.';

-- ── 2. Rate limiting, keyed on the learner ──────────────────────────────────
--
-- NOT on client IP. One school behind one NAT gateway is one address, so an IP
-- bucket means the most active student throttles the whole classroom — which
-- reads to eighteen children as the platform being broken.

create table if not exists rate_limit_bucket (
  bucket_key text primary key,          -- 'exec:<subject_id>', 'nova:<subject_id>'
  tokens     real        not null,
  updated_at timestamptz not null default now()
);

comment on table rate_limit_bucket is
  'Token buckets keyed on subject, never on IP. See the table comment on why.';

-- ── 3. The episode's primary skill ─────────────────────────────────────────
--
-- `reduceEpisode` produces `skill_id` and `buildLearnerState` refuses to use an
-- episode without one — but `attempt_episodes` has no column for it, so the
-- value was being computed and dropped. Every episode would have arrived at the
-- learner state with `skill: null` and contributed nothing, and the whole model
-- would have stayed empty with nothing raising an error.
--
-- Nullable on purpose. Null is the honest value for an episode that produced no
-- verdict — an explanation, a reflection, a coding task with no sandbox — and
-- it is what keeps ungraded work out of the skill model.

alter table attempt_episodes add column if not exists skill_id text;
create index if not exists idx_ae_skill on attempt_episodes (skill_id)
  where skill_id is not null;

-- ── 4. Attributions survive the round-trip ─────────────────────────────────
--
-- `reduceEpisode` produces `attributions` and `attributed_failures`, and
-- `buildLearnerState` builds every misconception from them. `attempt_episodes`
-- had nowhere to put either, so they were computed, written nowhere, and read
-- back as empty.
--
-- The consequence was silent and total: no misconception could ever be
-- observed, `observationConfidence` could never rise, nothing could ever become
-- actionable, and the Decision Engine would answer DIAGNOSE forever to a
-- learner it was structurally incapable of learning anything about. Every
-- number on screen would have looked reasonable.
--
-- Caught by reading the database after a real attempt rather than the screen.

alter table attempt_episodes add column if not exists attributions jsonb not null default '[]'::jsonb;
alter table attempt_episodes add column if not exists attributed_failures int not null default 0;
alter table attempt_episodes add column if not exists statement_revisits_after_failure int not null default 0;

-- ── 5. Lock down the scope table ────────────────────────────────────────────
--
-- `school_subject_scope` shipped in 0007 with neither RLS nor a revoke — the
-- only table in the set with neither. On a stock managed Postgres the default
-- grants hand `anon` and `authenticated` everything, which means any logged-in
-- account could read the table mapping every child to their school and class.

alter table school_subject_scope enable row level security;
revoke all on school_subject_scope from anon, authenticated;
alter table reducer_lease     enable row level security;
alter table rate_limit_bucket enable row level security;
revoke all on reducer_lease     from anon, authenticated;
revoke all on rate_limit_bucket from anon, authenticated;

commit;
