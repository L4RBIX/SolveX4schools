-- 0009 — school and class identifiers are not UUIDs
--
-- Migration 0007 declared `school_subject_scope.school_id` and `class_id` as
-- `uuid`. That was wrong, and wrong in a way that only shows up when a real
-- school is involved: a class is "9А", or "grade-9a", or whatever the roster
-- calls it. Forcing a UUID means either inventing an identifier nobody at the
-- school recognises, or carrying a second lookup table whose only job is to
-- translate back to the name the teacher actually uses.
--
-- Caught by pointing the teacher route at the pilot's own class id and getting
-- `invalid input syntax for type uuid: "grade-9a"`.
--
-- Fixed forward rather than by editing 0007, which may already be applied.

begin;

alter table school_subject_scope
  alter column school_id type text using school_id::text,
  alter column class_id  type text using class_id::text;

comment on column school_subject_scope.school_id is
  'The school''s own identifier. Text, not uuid — see migration 0009.';
comment on column school_subject_scope.class_id is
  'The class as the school names it ("9А"). Text, not uuid — see migration 0009.';

commit;
