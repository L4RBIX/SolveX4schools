-- 0016 — the explanation a learner owes after substantial help
--
-- The approved programme: «Кез келген көмектен соң оқушы шешімді өз сөзімен
-- түсіндіруге… міндетті» — after help, the learner is OBLIGED to explain the
-- solution in their own words. It was one of the independence checks with
-- nothing behind it: a learner could take four hints, arrive at the answer and
-- close the task without ever having to say what they had just done.
--
-- ── What this table may hold, and what it must never hold ───────────────────
--
-- There is no score column. No grade, no percentage, no "quality", no boolean
-- called `correct`, and no column for anything a model said about the text.
-- That absence is the mechanism, exactly as in migration 0011: a rule that
-- explanations are never auto-graded is a rule someone eventually works around;
-- a schema with nowhere to write a grade is not.
--
-- `schools/learning/checking.ts` already settles every `explain` block as
-- `unknown` and says why — prose in a learner's own words cannot be
-- machine-graded and must not pretend otherwise. This follows that precedent
-- rather than inventing a second one.
--
-- Nova is allowed to react to what the learner wrote. That reaction is a
-- message in a chat panel and it stops there. It does not reach this table,
-- because there is nowhere in this table for it to go.
--
-- ── The three statuses ──────────────────────────────────────────────────────
--
--   submitted           the learner's words are on the record and the
--                       requirement is discharged; nothing has read them
--   teacher_reviewable  the same, plus routed to a human, because the block
--                       declares `expectedPoints` and a marker therefore has a
--                       standard to read it against
--   unmeasured          the requirement fired and produced no answer — the
--                       learner completed the work and skipped the explanation
--
-- All three mean "not measured". The vocabulary is closed by a CHECK so a
-- fourth one cannot be added by a route; adding one is a schema change with a
-- migration and a reviewer, which is the point.
--
-- ── Why a row with no response exists at all ────────────────────────────────
--
-- Without it, "they were asked and did not answer" and "they were never asked"
-- are the same absence, and the teacher cannot tell a learner who is skipping
-- the reflection from one who never needed it. `response is null` is therefore
-- a legal, meaningful row, pinned to `status = 'unmeasured'` by a CHECK.
--
-- ── Why this is not derivable from learning_events ──────────────────────────
--
-- The payload allowlist in `packages/learning-contracts` keeps learner free
-- text out of the event stream, deliberately and permanently. The learner's own
-- sentence therefore cannot live in the ledger, so it lives here — the same
-- reasoning that put a learner's note in `learner_error_dictionary`.

begin;

create table if not exists post_help_explanations (
  subject_id      uuid not null references learning_subjects(subject_id) on delete cascade,

  -- The attempt this explanation belongs to. Not a foreign key to
  -- `attempt_episodes` for the same reason `interventions.episode_id` is not:
  -- that table is a projection the reducer fills in on a sweep, so requiring a
  -- row there would make the write fail whenever the sweep is behind.
  episode_id      uuid not null,

  -- 'm1.l4.b5'. Resolved against the curriculum before it gets here — an
  -- explanation for a block that does not exist is a forged request.
  block_id        text not null check (char_length(block_id) between 1 and 64),

  -- ── the assistance context ────────────────────────────────────────────────
  -- Why the explanation was owed. Stored so a teacher reading it knows how much
  -- help preceded it, and so the threshold can be changed later without making
  -- the existing rows unreadable.
  assistance_level int  not null check (assistance_level between 0 and 4),
  intervention_id  uuid references interventions(intervention_id) on delete set null,

  -- ── the learner's own words ───────────────────────────────────────────────
  -- The ONLY free-text column, and it holds nothing but what the learner typed.
  -- NULL means the gate fired and they did not answer.
  response        text check (char_length(response) between 1 and 1000),

  status          text not null check (status in ('submitted', 'teacher_reviewable', 'unmeasured')),

  -- No answer implies unmeasured. Stated as a constraint rather than trusted to
  -- the route, because a route that forgot it would file an unanswered
  -- obligation as a discharged one.
  constraint post_help_no_response_is_unmeasured
    check (response is not null or status = 'unmeasured'),

  created_at      timestamptz not null default now(),

  -- One explanation per task per learner. Written once: the first answer is the
  -- one given at the moment the help was fresh, and letting a later pass
  -- overwrite it would quietly rewrite what a teacher already read.
  primary key (subject_id, episode_id, block_id)
);

create index if not exists idx_post_help_subject
  on post_help_explanations (subject_id, created_at desc);

-- The teacher queue: everything with criteria to mark it against, oldest first.
create index if not exists idx_post_help_reviewable
  on post_help_explanations (status, created_at)
  where status = 'teacher_reviewable';

comment on table post_help_explanations is
  'One row per task where assistance crossed the threshold. Holds the learner''s '
  'own words and the assistance context, and deliberately has no column for a '
  'grade, a score, or anything a model said about the text.';

comment on column post_help_explanations.status is
  'submitted | teacher_reviewable | unmeasured. All three mean not measured. '
  'None of them is a mastery claim and there is no fourth.';

comment on column post_help_explanations.response is
  'The learner''s own words, or NULL when the requirement fired and they did '
  'not answer. Never anything the system or a model composed.';

-- ── Deletion ────────────────────────────────────────────────────────────────
--
-- The cascade from `learning_subjects` carries these rows out with the rest, so
-- `learning_forget_user` needs no new statement. A bare foreign key here would
-- instead make consent revocation fail outright — the defect migration 0007 had
-- to go back and fix.

alter table post_help_explanations enable row level security;
revoke all on post_help_explanations from anon, authenticated;

commit;
