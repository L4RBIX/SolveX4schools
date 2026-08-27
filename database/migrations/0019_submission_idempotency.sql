-- 0019 — submission idempotency
--
-- Renumbered from 0017: another migration claimed that number concurrently.
-- The runner keys on FILENAME, so both would have applied — but two migrations
-- sharing a number leaves a reader unable to tell which was meant to come
-- first, and that ambiguity is the thing worth removing while it is cheap.
--
-- ── The defect ──────────────────────────────────────────────────────────────
--
-- `/api/learning/submit` had no idempotency key. Every call appended a fresh
-- `verdict_received` and, on a wrong answer, a fresh `failure_attributed` —
-- and the route derives the learner's prior-failure count by COUNTING those
-- rows. So a submission that reached the route twice was two attempts by the
-- same child, and the consequences are not cosmetic:
--
--   * The failure count inflates. `buildLearnerState` reads attempts and solves
--     out of the same rows, so a doubled attempt is a halved solve rate for a
--     learner who did nothing twice.
--   * The reveal policy advances. `revealFor` opens the answer at
--     ATTEMPTS_BEFORE_REVEAL failures, and the programme requires that the idea
--     of the solution be withheld until several genuine attempts have passed
--     (PDF p.4: «шешім идеясы бірнеше әрекеттен соң ғана ашылады»). A retry
--     that the learner never made can hand them the answer.
--   * The reducer folds an attempt that did not happen, and `thrash` /
--     `regressed` are computed from consecutive attempts.
--
-- None of that requires an attacker. A double-click on Check, a mobile network
-- that reconnects and replays, a browser that retries a POST whose response was
-- lost on the wire — all three produce it, and all three are ordinary.
--
-- ── What this table is ──────────────────────────────────────────────────────
--
-- One row per submission the client claimed, keyed by an id the client mints
-- once per Check press. It is a CLAIM first and a RESULT second: the row is
-- inserted before the judge runs so that two concurrent copies of the same
-- submission can settle which of them owns the write, and it is filled in with
-- the graded response afterwards so the loser (and every later retry) can be
-- handed the same verdict instead of re-grading.
--
-- Re-grading would be wrong twice over. It would write a second set of events —
-- the defect above — and it would spend a judge slot re-running a program whose
-- answer is already known, on a service sized for eighteen learners pressing
-- Check at the same time.
--
-- ── Why the key is (subject_id, submission_id) and not submission_id ────────
--
-- Because a submission id arrives in a request body, and a request body is the
-- browser's word. A single-column key would mean one learner's id could satisfy
-- another learner's submission: post a classmate's id and receive their verdict
-- and their episode id, while your own answer is never graded and never
-- recorded. Scoping the key to the subject — which comes from an httpOnly
-- cookie or a session and cannot be forged — makes that structurally
-- impossible rather than merely unlikely. It is the same reasoning as
-- `ownedEpisodeId` in `schools/learning/episode-scope.ts`.
--
-- ── What may go in `response`, and what may not ─────────────────────────────
--
-- `response` is the exact JSON body the route returned, replayed byte-for-byte
-- to a duplicate. That is deliberate: recomputing the reveal for a duplicate
-- would consult a failure count that has moved on since, so a retry could open
-- an answer the original submission had not earned.
--
-- It holds a verdict, an episode id, per-test counts, the curriculum's own
-- reveal payload and the author's justification prose. It holds NO learner free
-- text — the route never puts the answer in its response, and nothing may start
-- doing so. `learning_events.payload` is allowlisted by
-- `packages/learning-contracts` for exactly that reason and this column has no
-- allowlist, so the rule has to be kept by the route rather than by the schema.
-- Anything that wants to add learner-authored text to the submit response must
-- change this comment first.
--
-- ── Retention ───────────────────────────────────────────────────────────────
--
-- These rows are dedup bookkeeping, not evidence. Nothing downstream reads them
-- to build a skill level, a percentage or any claim about a learner: the
-- authoritative record of every attempt is `learning_events`, written by the
-- same request. A sweep that deleted everything here older than a day would
-- cost nothing except the ability to collapse a very late retry.

begin;

create table if not exists learning_submissions (
  subject_id    uuid not null references learning_subjects(subject_id) on delete cascade,

  -- Minted by the client, once per Check press, and held for as long as the
  -- answer is unchanged. See `SchoolLesson.submissionFor` — the rule is that a
  -- submission id identifies one (block, exact answer) pair, so "the same
  -- submission retried" and "a second genuine attempt" are distinguishable
  -- without anyone having to guess at network semantics.
  submission_id uuid not null,

  -- The curriculum block. Recorded so a duplicate that names a DIFFERENT block
  -- under a reused id is visible as the client bug it is, rather than silently
  -- returning the other block's verdict.
  block_id      text not null check (char_length(block_id) between 1 and 64),

  -- The episode the owning request wrote its events into. A duplicate is handed
  -- this id back inside `response`, so a retried submission stays in one episode
  -- instead of fragmenting one attempt across two.
  episode_id    uuid not null,

  -- When the claim was taken. The row exists from this moment; `settled_at` is
  -- null until the events are written, which is the window a concurrent
  -- duplicate has to wait out.
  claimed_at    timestamptz not null default now(),
  settled_at    timestamptz,

  -- Denormalised out of `response` so the dedup path is inspectable with a
  -- `select` and so a constraint can hold. `unknown` is a real outcome — an
  -- ungraded explanation, or a judge that did not answer — and is never a
  -- failure; see `schools/learning/checking.ts`.
  verdict       text check (verdict in ('correct', 'wrong', 'partial', 'unknown')),

  -- The response body, replayed verbatim. Null while the claim is in flight.
  response      jsonb,

  -- Both halves of the answer to "have I already graded this?", and the reason
  -- one learner's id can never satisfy another's.
  primary key (subject_id, submission_id),

  -- A settled row has all three, an in-flight row has none. Without this a
  -- half-written settle would look settled and replay `null` as a verdict.
  constraint learning_submissions_settled_together check (
    (settled_at is null and verdict is null and response is null) or
    (settled_at is not null and verdict is not null and response is not null)
  )
);

-- In-flight claims only. Two uses, both narrow: finding a claim whose owner
-- died so it can be taken over rather than locking the learner out of that
-- answer forever, and answering "is anything stuck" during a pilot.
create index if not exists idx_learning_submissions_inflight
  on learning_submissions (claimed_at)
  where settled_at is null;

comment on table learning_submissions is
  'Dedup ledger for POST /api/learning/submit. One row per submission id per '
  'subject: the row is claimed before the judge runs and settled with the '
  'response afterwards, so a retry replays the verdict instead of writing a '
  'second set of learning events. NOT evidence — the record of every attempt '
  'is learning_events.';

comment on column learning_submissions.submission_id is
  'Client-minted, once per Check press, held while the answer is unchanged. '
  'Scoped by subject_id in the primary key because it arrives in a request '
  'body and a request body is the browser''s word.';

comment on column learning_submissions.response is
  'The submit response, replayed verbatim to a duplicate. Verdict, episode id, '
  'test counts, curriculum reveal, author justification. No learner free text.';

-- ── Deletion ────────────────────────────────────────────────────────────────
--
-- No new erasure path. The cascade from `learning_subjects` means
-- `learning_forget_user` already takes these rows with it — the same rule
-- migrations 0010 and 0011 follow, and the defect 0007 had to go back and fix:
-- a bare foreign key here would make consent revocation fail outright, so a
-- child asking to be forgotten would be refused by a dedup table.

alter table learning_submissions enable row level security;
revoke all on learning_submissions from anon, authenticated;

commit;
