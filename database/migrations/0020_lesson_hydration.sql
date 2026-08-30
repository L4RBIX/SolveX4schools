-- 0020 — lesson state rehydration
--
-- ── The defect ──────────────────────────────────────────────────────────────
--
-- A learner answered a block, the server graded it, signed it, wrote the
-- events and settled the submission. Then the learner pressed F5 and the
-- lesson rendered as though none of it had happened.
--
-- The cause was one line — `useState<Record<string, BlockState>>({})` in
-- `SchoolLesson` — but the consequences were not cosmetic:
--
--   * The progress readout showed `0/9` for a learner who had solved nine of
--     nine, and the completion CTA bounced them back to block 1, because both
--     read the empty client map. The lesson became unfinishable without
--     redoing it, while `/api/learning/complete` would have accepted the
--     completion on the evidence it already held.
--   * Every post-refresh Check minted a fresh episode id, and every counter
--     that gates pedagogy is keyed on the episode: the hint rung
--     (`interventions.level`), the reveal counter (`verdict_received` rows),
--     the attempt gate. A refresh mid-task threw all three back to zero.
--   * Worse in the other direction: `solveEvidence` reads
--     `assistance_delivered` `where episode_id = $1`. Four hints on episode A,
--     a refresh, then a solve on episode B — and the solve carries no record
--     of the help. `scheduleFor` files it as `independent_milestone` and
--     `activityBuckets` counts it as `solved_solo`. The system fabricated
--     "solved independently" about a child who had been handed the answer.
--   * A re-submission after refresh re-ran the judge, because the client's
--     idempotency key died with the tab. Real money, for a verdict already on
--     disk.
--
-- ── What this migration does ────────────────────────────────────────────────
--
-- Nothing to the shape of the data. Every fact the lesson page now restores
-- was already being written; none of it was reachable by block. This adds the
-- one index that makes it reachable, and corrects a comment that would
-- otherwise license deleting the rows the fix depends on.

begin;

-- ── The index ───────────────────────────────────────────────────────────────
--
-- `learning_submissions` has a primary key of `(subject_id, submission_id)`
-- and exactly one other index, `idx_learning_submissions_inflight`, which is
-- partial on `settled_at is null` — the opposite of what hydration reads.
--
-- Opening a lesson asks: for this subject and these N block ids, what is the
-- latest SETTLED submission? Without an index that is a prefix scan of every
-- submission the learner has made all year, filtered in memory, on the render
-- path of the page a child opens twenty times a week.
--
-- `settled_at desc` in the index, `distinct on (block_id)` in the query. The
-- partial predicate matches the query's own `settled_at is not null` and keeps
-- in-flight claims — which are transient and numerous — out of the index
-- entirely.
create index if not exists idx_learning_submissions_settled
  on learning_submissions (subject_id, block_id, settled_at desc)
  where settled_at is not null;

-- ── The retention contract, corrected ───────────────────────────────────────
--
-- Migration 0019 said, in its header and in this comment: "NOT evidence — the
-- record of every attempt is learning_events", and went on to say that a sweep
-- deleting rows older than a day "would cost nothing except the ability to
-- collapse a very late retry".
--
-- The first half is still true and matters: nothing derives a skill level, a
-- percentage or any claim about a learner from these rows. `learning_events`
-- remains the evidence, and the teacher console and the Learning Intelligence
-- reducer read it and not this.
--
-- The second half is now false, and leaving it would be an invitation. The
-- lesson page reads the settled `response` to restore what the learner was
-- already shown — their verdict, the reveal they had earned, the author's
-- justification of their specific wrong answer. None of that is reconstructible
-- from `learning_events`: the payload allowlist in
-- `packages/learning-contracts` has no key for a reveal, and RE-DERIVING one is
-- precisely the thing 0019 forbade, because `revealFor` consults a failure
-- count that has moved on and can open an answer the learner had not earned.
--
-- Two consequences a future sweep must respect, stated so nobody has to infer
-- them from the query:
--
--   * Deleting a settled row does not lose evidence, but it does lose UI. The
--     block degrades to the coarse `learning_events` projection — attempted,
--     and accepted or not — with no reveal and no justification. A learner
--     mid-task loses the reveal they had earned.
--   * The row is also where the block's episode id is found. Losing it splits
--     the next attempt into a new episode, which is the independence-laundering
--     defect above, arriving through the back door.
--
-- If a sweep is ever written, the safe rule is: keep the latest settled row
-- per (subject_id, block_id), delete the rest.
comment on table learning_submissions is
  'Dedup ledger for POST /api/learning/submit AND the lesson page''s hydration '
  'source. One row per submission id per subject: claimed before the judge '
  'runs, settled with the response afterwards, so a retry replays the verdict '
  'instead of writing a second set of learning events, and a refresh restores '
  'what the learner was already shown. NOT evidence — the record of every '
  'attempt is learning_events, and that is what the teacher console and the '
  'reducer read. A retention sweep must keep the latest settled row per '
  '(subject_id, block_id); see migration 0020.';

comment on column learning_submissions.response is
  'The submit response, replayed verbatim to a duplicate and to the lesson '
  'page on hydration. Verdict, episode id, test counts, curriculum reveal, '
  'author justification. No learner free text — hydration replays this and '
  'never recomputes it, because revealFor consults a failure count that has '
  'since moved on.';

commit;
