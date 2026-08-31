/**
 * Withdraw a month from production.
 *
 * The inverse of `publish-curriculum.ts`, and it did not exist. `withdrawCurriculum`
 * has been in the store since migration 0013 gave the table a `withdrawn_at`
 * column, is covered by `tests/school/publication-gate.test.ts`, and had exactly
 * one caller: that test. So the supported way to pull a month back out of a
 * classroom was a hand-written UPDATE against the production database, typed by
 * whoever was awake — which is not a rollback procedure, it is the absence of
 * one.
 *
 *   npx tsx scripts/unpublish-curriculum.ts \
 *     --school gymnasium-5 --month 3 --reviewer aigul --i-am-the-reviewer
 *
 * ## What it deliberately refuses
 *
 * A month index that is not a month. Every month at once — there is no `--all`,
 * because the shape of this command's worst mistake is "closed the whole year
 * during a lesson" and no flag should make that one keystroke. And running
 * without `--i-am-the-reviewer`, for the same reason publishing refuses:
 * withdrawing content from a classroom in progress is a human act.
 *
 * ## Idempotent, and honest about it
 *
 * Withdrawing an already-withdrawn month changes nothing and says so. The
 * before/after counts are read from the database on both sides rather than
 * inferred from the update's row count, so what is printed is the state that is
 * actually there.
 *
 * ## Scope
 *
 * `curriculum_publications` has no `school_id` — publication is a property of
 * the DEPLOYMENT, not of a school, and the whole deployment serves one
 * curriculum. `--school` therefore scopes the REVIEWER (usernames are unique
 * per school, not globally) and never the effect. The command says so out loud
 * before it acts, because an operator who believes they are closing one school's
 * October is an operator about to be surprised.
 */
import { MONTH_BY_INDEX } from "./../schools/curriculum/months";
import { authenticateReviewer, openOperatorDb } from "./operator";
import { promptSecret } from "./prompt-secret";

function arg(flag: string, fallback?: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`missing --${flag}`);
}
const has = (flag: string) => process.argv.slice(2).includes(`--${flag}`);

interface LiveRow {
  publication_id: string;
  curriculum_hash: string;
  note: string | null;
}

async function main() {
  if (has("all")) {
    console.log(
      "\n  There is no --all. Withdraw one month at a time.\n" +
        "  Closing the whole year is not something a single flag should do.\n",
    );
    process.exitCode = 2;
    return;
  }

  const raw = arg("month");
  const monthIndex = Number(raw);
  if (!Number.isInteger(monthIndex) || !MONTH_BY_INDEX.has(monthIndex)) {
    console.log(`\n  Not a month: ${JSON.stringify(raw)}. Expected 1-9.\n`);
    process.exitCode = 2;
    return;
  }

  const reviewerUsername = arg("reviewer");
  const schoolId = arg("school", process.env.SCHOOL_ID ?? "pilot-school");
  const dataDir = arg("data-dir", process.env.LEARNING_DATA_DIR ?? ".data/learning");
  const month = MONTH_BY_INDEX.get(monthIndex)!;

  const db = await openOperatorDb(dataDir);

  const before = await db.query<LiveRow>(
    `select publication_id, curriculum_hash, note
       from curriculum_publications
      where month_index = $1 and withdrawn_at is null`,
    [monthIndex],
  );

  console.log(`\n  Month ${monthIndex} — ${month.monthName.kk} / ${month.monthName.ru}`);
  console.log(`  Live publications right now: ${before.rows.length}`);
  for (const row of before.rows) {
    console.log(`    · ${row.curriculum_hash.slice(0, 16)}…${row.note ? `  ${row.note}` : ""}`);
  }

  if (before.rows.length === 0) {
    console.log("\n  Nothing to withdraw. Month is already closed.\n");
    await db.close();
    return;
  }

  console.log(
    "\n  This closes the month for EVERY learner on this deployment immediately.\n" +
      "  Publication is deployment-wide: --school identifies YOU, not the scope.\n" +
      "  Work already submitted is kept and reappears if the month is published again.\n",
  );

  if (!has("i-am-the-reviewer")) {
    console.log("  Refusing to continue without --i-am-the-reviewer.\n");
    await db.close();
    process.exitCode = 2;
    return;
  }

  const password = await promptSecret(`  Password for ${reviewerUsername}: `);
  const auth = await authenticateReviewer(db, schoolId, reviewerUsername, password);
  if (!auth.ok) {
    console.log(`\n  Not withdrawn: ${auth.reason}.\n`);
    await db.close();
    process.exitCode = 1;
    return;
  }

  /* Who and when, on the row itself. The same columns migration 0013 added for
     this and that nothing has ever written. */
  await db.query(
    `update curriculum_publications
        set withdrawn_at = now(), withdrawn_by = $2
      where month_index = $1 and withdrawn_at is null`,
    [monthIndex, auth.reviewer.userId],
  );

  const after = await db.query<{ n: number }>(
    `select count(*)::int as n from curriculum_publications
      where month_index = $1 and withdrawn_at is null`,
    [monthIndex],
  );
  await db.close();

  const remaining = Number(after.rows[0]?.n ?? 0);
  if (remaining !== 0) {
    console.log(`\n  Withdrawal did not take: ${remaining} publication(s) still live.\n`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\n  Withdrawn. Month ${monthIndex} closed by ${auth.reviewer.displayName}.\n` +
      `  ${before.rows.length} publication(s) marked withdrawn; 0 live.\n` +
      `  Learners are served the remaining published months only.\n`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
