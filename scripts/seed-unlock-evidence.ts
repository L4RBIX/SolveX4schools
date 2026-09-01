/**
 * Unlock months 1..N for one learner in a TEST database.
 *
 * Browser acceptance has to open a lesson in every month, and months 2..9 are
 * gated on the learner's own progress: `unlocked(N) = unlocked(N-1) AND
 * complete(N-1) AND demonstrated(N-1)`. A fresh account can only reach
 * September, so a sweep that just navigates to `/lesson/m5.l1` measures a 404
 * and calls it a failure — which is what happened before this existed.
 *
 * So this writes the evidence the gate reads, in the shape the product writes
 * it: every completable of each month in `lesson_completions`, and one
 * ACCEPTED verdict at `source_trust = 'judge'` on each month's independence
 * block. Nothing weaker would do — `blockAttempts` computes `accepted` with
 * that trust level in the SQL itself.
 *
 * ## Not for production, and structurally so
 *
 * It refuses to run against a database whose URL does not name a test
 * database. Seeding progress a child did not earn is the exact failure the
 * trust model exists to prevent, and a script that can do it by accident on
 * the wrong DSN is a liability however clearly its comment is worded.
 *
 *   DATABASE_URL=postgres://localhost/solvex_cpp17_e2e \
 *   npx tsx scripts/seed-unlock-evidence.ts --user grade9a-01 --through 8
 */
import { randomUUID } from "node:crypto";
import pg from "pg";
import { MONTHS } from "../schools/curriculum/months";
import { monthCompletables } from "../schools/curriculum/inventory";
import { allIndependenceBlocks } from "../schools/policies/unlock";
import { CURRICULUM_VERSION } from "../schools/curriculum/source-of-truth";

const url = process.env.DATABASE_URL ?? "";
if (!/e2e|test|_dev\b/.test(url)) {
  console.error(`refusing: DATABASE_URL does not look like a test database (${url.replace(/:[^:@]*@/, ":***@")})`);
  process.exit(2);
}

const arg = (f: string, d?: string): string => {
  const i = process.argv.indexOf(`--${f}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  if (d !== undefined) return d;
  throw new Error(`missing --${f}`);
};

const username = arg("user");
const through = Number(arg("through", "8"));

async function main(): Promise<void> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();

  const acct = await c.query<{ user_id: string }>(
    `select user_id from school_accounts where lower(username) = lower($1)`,
    [username],
  );
  if (acct.rows.length === 0) throw new Error(`no account ${username}`);
  const userId = acct.rows[0].user_id;

  const subj = await c.query<{ subject_id: string }>(
    `select subject_id from learning_subject_aliases
      where alias_kind = 'user_id' and alias_value = $1 and curriculum_version = $2`,
    [userId, CURRICULUM_VERSION],
  );
  if (subj.rows.length === 0) {
    throw new Error(`no ${CURRICULUM_VERSION} subject for ${username} — sign in once first`);
  }
  const subjectId = subj.rows[0].subject_id;

  const independence = new Set(allIndependenceBlocks(MONTHS));
  let completions = 0;
  let verdicts = 0;

  for (const month of MONTHS) {
    if (month.index > through) break;

    for (const completable of monthCompletables(month)) {
      await c.query(
        `insert into lesson_completions (subject_id, lesson_id, correct, wrong, unmeasured, attempts, completed_at)
         values ($1,$2,1,0,0,1, now())
         on conflict (subject_id, lesson_id) do nothing`,
        [subjectId, completable.id],
      );
      completions += 1;
    }

    /* One independence block per month is enough: `hasDemonstratedIndependence`
       is `some`, not `every` — May authors five and the programme states a YEAR
       minimum rather than a monthly count. */
    const blockId = allIndependenceBlocks([month])[0];
    if (!blockId || !independence.has(blockId)) continue;

    const episodeId = randomUUID();
    for (const [seq, name, trust, payload] of [
      [1, "episode_opened", "server", { task_ref: `sx-lesson:${blockId}`, task_kind: "lesson" }],
      [2, "verdict_received", "judge", { task_ref: `sx-lesson:${blockId}`, verdict: "accepted", task_kind: "lesson" }],
    ] as const) {
      await c.query(
        `insert into learning_events
           (event_id, subject_id, episode_id, session_id, seq, event_name, occurred_at,
            received_at, source_trust, environment, cohort, route, payload)
         values ($1,$2,$3,$4,$5,$6, now(), now(), $7, 'development', 'public', '/seed', $8::jsonb)
         on conflict (event_id) do nothing`,
        [randomUUID(), subjectId, episodeId, randomUUID(), seq, name, trust, JSON.stringify(payload)],
      );
    }
    verdicts += 1;
  }

  console.log(
    `  seeded ${completions} completions and ${verdicts} accepted independence verdicts ` +
      `for ${username} (subject ${subjectId.slice(0, 8)}…, ${CURRICULUM_VERSION}), months 1..${through}`,
  );
  await c.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
