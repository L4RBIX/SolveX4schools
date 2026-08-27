-- 0015 — which rule admitted this completion
--
-- Migration 0010 made a finished lesson a server-side fact. It did not make it
-- an EXPLAINED fact, and the audit said so in as many words
-- (`SEPTEMBER_REMEDIATION_REPORT.md` §7, P1-10):
--
--   > a lesson still completes on reaching the last block […] completion is
--   > "attempted all", not "passed a bar", and that is a policy the school
--   > should set, not one I should invent
--
-- The rule now exists, as data plus a pure function, in
-- `schools/policies/completion.ts`. This column records WHICH rule was
-- satisfied when the row was written.
--
-- ── Why the id is worth a column ────────────────────────────────────────────
--
-- Because the rule is configurable, and a configurable rule with no record of
-- which version applied produces a table whose rows mean different things
-- depending on when they were written — and nothing on the row says so. A
-- school looking at a January record needs to know whether "complete" then
-- meant what it means now. That is not hypothetical: `lesson.v1` and
-- `assessment.v1` already differ from each other, and the allowance knob exists
-- precisely so a school can change one.
--
-- It is a plain text id and NOT a foreign key to a policies table. There is no
-- such table and there should not be: the policies are code, they are reviewed
-- as code, and a database row that could redefine what "finished" means without
-- passing a test is a worse idea than a slightly denormalised column.
--
-- ── Why nullable ────────────────────────────────────────────────────────────
--
-- Rows written before this migration were admitted by the old implicit rule —
-- "the learner reached the last block". Backfilling them with 'lesson.v1' would
-- assert that a policy which did not exist had been checked, which is the kind
-- of small lie that makes a school record untrustworthy. Null means "recorded
-- before the policy was written down", and it is honest.
--
-- Every row written from now on carries one: `/api/learning/complete` refuses
-- the request outright when the policy is not satisfied, so there is no path
-- that inserts without evaluating it.

begin;

alter table lesson_completions
  add column if not exists policy_id text
    check (policy_id is null or char_length(policy_id) between 1 and 32);

comment on column lesson_completions.policy_id is
  'The completion policy satisfied when this row was written — see '
  'schools/policies/completion.ts. Null on rows predating the policy, which '
  'were admitted by the old implicit "reached the last block" rule.';

commit;
