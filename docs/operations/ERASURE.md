# Erasing one learner

The school asks; you run one command; you show them what was removed.

This is the operational half of the sentence in the privacy policy — «Деректерді
жою мектептің сұрауы бойынша қолмен орындалады» / «Удаление данных выполняется
вручную по запросу школы». Until 2026-09, that sentence had nothing behind it:
no script, no runbook, and the function anyone would find first
(`learning_forget_user`) erased the learning ledger and kept the child.

## The command

```bash
# 1. Look, change nothing. This is the default.
DATABASE_URL=… npx tsx --conditions=react-server scripts/erase-learner.ts \
  --school <school-uuid> --username grade9a-04

# 2. Erase, naming the request.
DATABASE_URL=… npx tsx --conditions=react-server scripts/erase-learner.ts \
  --school <school-uuid> --username grade9a-04 \
  --confirm grade9a-04 --reason "parental request, 2026-09-04, letter on file"
```

`--user-id <uuid>` works instead of `--school`/`--username` when you have the id
from the teacher dashboard. Without `DATABASE_URL` it targets the local PGlite
directory, which is single-writer — stop the app first.

## What it prints, and what to keep

The dry run lists every table that currently names this learner and how many
rows. The real run lists what was removed, per table, and ends with
`Residual scan: clean.`

**Keep that output.** Nothing about the erasure is written to the database: a
row saying "this child was erased on this date" is the thing being erased. The
operator's record is the terminal output plus whatever the school filed.

## What it will not do

- **Teachers.** `curriculum_publications.reviewer_id` and `withdrawn_by` name the
  adult who approved a month of curriculum for children. Erasing a teacher
  destroys that trail, so the script refuses. Disable the account instead —
  `disabled_at` takes effect on the next request, not the next login.
- **Partial work.** Everything runs in one transaction, and the residual scan
  runs *before* the commit. If any table still names the learner, the whole
  thing rolls back and prints which table. A half-erased learner is worse than
  an un-erased one, because nobody can tell which half.

## If it says ERASURE INCOMPLETE

The schema has a table the erasure does not reach. That is a defect, not an
operational hiccup:

1. The message names the table and column.
2. Add it to `TABLE_DISPOSITION` in `schools/legal/erasure.ts` — as erased, or
   as retained with a reason.
3. If it holds learner data, add the delete to `school_forget_user` in a new
   migration (see `database/migrations/0025_complete_erasure.sql`).
4. `tests/school/erasure.test.ts` will fail until both are done.

Nothing was deleted when this happens. Re-run after the fix.

## Where the parts are

| | |
|---|---|
| The deletion | `school_forget_user(uuid)` — migration 0025. One definition, reachable from psql. |
| The ledger half | `learning_forget_user(uuid)` — the imported subsystem's, called by the above. |
| Everything around it | `schools/legal/erasure.ts` — who is meant, what is retained and why, the residual scan. |
| The command | `scripts/erase-learner.ts` |
| The proof | `tests/school/erasure.test.ts` — seeds a learner in every table, erases, scans the live schema. |

## What erasure does not cover

Read this before telling a school "everything is gone".

- **Application logs.** `console` lines carry ids that `learning_forget_user`
  cannot reach — see the notes in `schools/ops/counters.ts` and
  `src/app/api/auth/login/route.ts`. Vercel's log retention is what bounds them.
- **Nova's provider.** A prompt sent to DeepSeek has left this system. What is
  sent is documented in `schools/nova/prompt.ts`; what the provider retains is
  their policy, and item 4 of `docs/legal/PRIVACY_LEGAL_REVIEW.md` is the open
  question about it.
- **Database backups.** A managed Postgres keeps point-in-time backups. An
  erased learner is still in yesterday's snapshot until it ages out. Agree the
  window with the school rather than implying it is zero.
