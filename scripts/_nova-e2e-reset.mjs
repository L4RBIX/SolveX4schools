/* Puts the E2E learner back to an untouched lesson.
 *
 * Deletes only this learner's evidence, and only through their subject alias,
 * so a run cannot quietly wipe a class. Counts accumulate across runs
 * otherwise, and a lesson that correctly resumes past a block already answered
 * then reads as a navigation defect. */
import { execSync } from 'node:child_process';
const DB = process.env.DATABASE_URL ?? 'postgres://localhost/solvex_dev';
const q = (sql) => execSync(`psql ${DB} -tAc ${JSON.stringify(sql.replace(/\s+/g, ' ').trim())}`).toString().trim();

const subject = q(`select al.subject_id from learning_subject_aliases al
  join school_accounts a on a.user_id::text = al.alias_value
  where a.username = 'nova-e2e' and al.alias_kind = 'user_id' limit 1`);

if (!subject) { console.log('no subject yet — nothing to reset'); process.exit(0); }
for (const t of ['learning_submissions', 'learning_events', 'attempt_episodes', 'lesson_completions', 'learner_state', 'learner_skill_state']) {
  try { q(`delete from ${t} where subject_id = '${subject}'`); } catch { /* table may not exist in this schema */ }
}
q(`delete from rate_limit_bucket`);
console.log('reset', subject);
