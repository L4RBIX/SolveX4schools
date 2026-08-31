-- The learner's submitted work, kept beside the verdict it produced.
--
-- ## The gap this closes
--
-- `learning_submissions` recorded what the SERVER said — verdict, case counts,
-- reveal, why — and nothing about what the LEARNER wrote. Proven against a live
-- row: the `response` jsonb holds `{verdict, cases, reveal, why, episodeId,
-- saved, unmeasuredReason, attested}` and there was no column for an answer.
--
-- So a learner submitted code, was told "correct", refreshed, and found an
-- empty editor. The verdict survived and the work did not. For a written
-- explanation the loss is worse: the learner is told a teacher will read it,
-- and there was nothing left to read.
--
-- ## Why a column here rather than a new table
--
-- This row already IS the record of one settled submission. It is written in
-- `appendEventsAndSettle`, inside the one transaction that also appends the
-- events, guarded by `settled_at is null` so a settle can never overwrite a
-- settle. Putting the artifact anywhere else would mean a second write that
-- could fail on its own — producing exactly the split state (verdict without
-- work, or work without verdict) this phase exists to prevent. A column
-- inherits the atomicity and the idempotency for free.
--
-- ## Shape
--
-- `BlockAnswer` from `schools/learning/checking.ts`, verbatim: a discriminated
-- union that already covers every block type and already prefers stable ids
-- over authored content — `{kind:"option", id}` not the option's text,
-- `{kind:"order", ids}` not the pieces. It is the value the route already
-- receives and grades, so nothing new is modelled and nothing can drift.
--
--   {kind:"none"} | {kind:"option",id} | {kind:"text",value}
--   {kind:"blanks",values} | {kind:"order",ids} | {kind:"line",line}
--   {kind:"grid",cells} | {kind:"acknowledged"}
--
-- It holds WHAT THE LEARNER SUBMITTED and never what the correct answer is.
-- No answer-key material may be written here for convenience.
--
-- ## Nullable, deliberately
--
-- Every row settled before this migration has no artifact and never will.
-- Hydration must treat `null` as "this predates artifact storage", restore the
-- verdict, and leave the editor empty — not invent source. A NOT NULL column
-- with a synthetic default would make a legacy row indistinguishable from a
-- learner who submitted an empty answer.
alter table learning_submissions
  add column if not exists answer jsonb;

comment on column learning_submissions.answer is
  'The learner''s submitted BlockAnswer, verbatim. Null for rows settled before '
  '0021. Never contains answer-key material.';
