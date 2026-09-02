/**
 * Grant a learner XP so Leagues can be looked at, through the product's own
 * award path.
 *
 * ## Why not raw INSERTs
 *
 * `awardXp` does more than write rows: it writes the awards FIRST and creates
 * the week's membership only if at least one landed, which is what makes "every
 * member holds at least one point" true and is why the ranking code never has to
 * decide what a zero-XP member means. Hand-written INSERTs would produce awards
 * with no membership — a learner with XP who is in no group, which is a state the
 * product cannot reach on its own and therefore does not render.
 *
 * So this calls the real engine. It also inherits the anti-farming primary key
 * `(subject_id, achievement, entity_id)` for free: run it twice and the second
 * run grants nothing, because those exact credits already exist.
 *
 * ## Which subject
 *
 * An account has one subject PER CURRICULUM VERSION since migration 0024. XP
 * written against the Python-era subject is invisible to a learner working the
 * C++ year, so this resolves the ACTIVE curriculum's subject and refuses if that
 * subject does not exist yet — the learner has to have signed in once.
 *
 * ## The entity ids are real
 *
 * Credits are keyed to actual September lesson and block ids, not invented
 * strings. That keeps the ledger honest: every row names a curriculum entity
 * that exists, so the finite-curriculum property the anti-farming design rests on
 * still holds after this runs.
 *
 * ## Reversing it
 *
 *   delete from league_xp_awards where subject_id = '<id>';
 *   delete from league_memberships where subject_id = '<id>';
 *
 * Both are safe: nothing else references them, and `learning_forget_user`
 * already cascades them for a real erasure.
 *
 *   DATABASE_URL=<dsn> npx tsx --tsconfig tsconfig.scripts.json \
 *     scripts/grant-league-xp.ts --user grade9a-01 --school innovation-tech
 *
 * `--dry-run` prints what it would grant and writes nothing.
 */
import pg from "pg";
import { MONTHS } from "../schools/curriculum/months";
import { awardXp, type XpCredit } from "../schools/leagues/engine";
import { XP_AMOUNTS } from "../schools/leagues/xp-policy";
import { weekIdForAward } from "../schools/leagues/week";
import { CURRICULUM_VERSION } from "../schools/curriculum/source-of-truth";
import { LEAGUE_UNLOCK_XP } from "../schools/leagues/unlock";
import type { SqlExecutor, SqlResult } from "../schools/store/sql";

function arg(flag: string, fallback?: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`missing --${flag}`);
}
const has = (flag: string) => process.argv.slice(2).includes(`--${flag}`);

/** A `SqlExecutor` over one pg client. `tx` is real, so a failed award rolls back. */
function executor(client: pg.Client): SqlExecutor {
  const self: SqlExecutor = {
    async query<T = Record<string, unknown>>(text: string, params: readonly unknown[] = []) {
      const r = await client.query(text, params as unknown[]);
      return { rows: r.rows as T[], rowCount: r.rowCount ?? 0 } as SqlResult<T>;
    },
    async exec(script: string) {
      await client.query(script);
    },
    async tx<T>(fn: (t: SqlExecutor) => Promise<T>): Promise<T> {
      await client.query("begin");
      try {
        const out = await fn(self);
        await client.query("commit");
        return out;
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    },
    async close() {
      /* The caller owns the connection. */
    },
  } as SqlExecutor;
  return self;
}

/**
 * Credits drawn from real September content.
 *
 * Ordered so the cheap, plentiful ones come first: the caller asks for a target
 * and gets the smallest honest prefix that reaches it, rather than one absurd
 * row carrying the whole sum.
 */
function septemberCredits(): XpCredit[] {
  const september = MONTHS.find((m) => m.index === 1);
  if (!september) throw new Error("no month 1 in the curriculum");

  const credits: XpCredit[] = [];
  for (const unit of september.units) {
    for (const lesson of unit.lessons) {
      if (lesson.status === "draft") continue;
      credits.push({
        achievement: "lesson_completed",
        entityId: lesson.id,
        amount: XP_AMOUNTS.lesson_completed,
      });
      for (const block of lesson.blocks) {
        credits.push({
          achievement: "block_solved",
          entityId: block.id,
          amount: XP_AMOUNTS.block_solved,
        });
      }
    }
  }
  return credits;
}

async function main(): Promise<void> {
  const username = arg("user");
  const schoolId = arg("school", process.env.SCHOOL_ID ?? "innovation-tech");
  const target = Number(arg("xp", String(LEAGUE_UNLOCK_XP * 3)));
  const dryRun = has("dry-run");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const client = new pg.Client({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  const sql = executor(client);

  const found = await sql.query<{
    user_id: string;
    subject_id: string;
    class_id: string | null;
  }>(
    `select a.user_id, s.subject_id, e.class_id
       from school_accounts a
       join learning_subjects s
         on s.user_id = a.user_id and s.curriculum_version = $3
       left join class_enrolments e
         on e.user_id = a.user_id and e.withdrawn_at is null
      where a.school_id = $1 and lower(a.username) = lower($2)`,
    [schoolId, username, CURRICULUM_VERSION],
  );

  const row = found.rows[0];
  if (!row) {
    throw new Error(
      `no ${CURRICULUM_VERSION} subject for ${username} at ${schoolId}. ` +
        `The learner must sign in once before they have one — a subject is minted ` +
        `by the login path, and a page render deliberately cannot create it.`,
    );
  }
  if (!row.class_id) throw new Error(`${username} has no active class enrolment`);

  const before = await sql.query<{ xp: number }>(
    `select coalesce(sum(amount), 0)::int as xp from league_xp_awards where subject_id = $1`,
    [row.subject_id],
  );
  const already = Number(before.rows[0]?.xp ?? 0);

  /* The smallest honest prefix that reaches the target. */
  const all = septemberCredits();
  const credits: XpCredit[] = [];
  let planned = 0;
  for (const c of all) {
    if (already + planned >= target) break;
    credits.push(c);
    planned += c.amount;
  }

  console.log(`\n  ${username} @ ${schoolId}`);
  console.log(`  subject ${row.subject_id} (${CURRICULUM_VERSION}), class ${row.class_id}`);
  console.log(`  XP now ${already}, target ${target}, planning ${credits.length} credits worth ${planned}`);
  console.log(`  unlock threshold is ${LEAGUE_UNLOCK_XP}\n`);

  if (dryRun) {
    for (const c of credits.slice(0, 8)) console.log(`    ${c.achievement.padEnd(22)} ${c.entityId.padEnd(14)} +${c.amount}`);
    if (credits.length > 8) console.log(`    … and ${credits.length - 8} more`);
    console.log("\n  --dry-run: nothing written.\n");
    await client.end();
    return;
  }

  const result = await sql.tx((t) =>
    awardXp(
      t,
      {
        subjectId: row.subject_id,
        weekId: weekIdForAward(new Date()),
        schoolId,
        classId: row.class_id!,
      },
      credits,
    ),
  );

  const after = await sql.query<{ xp: number }>(
    `select coalesce(sum(amount), 0)::int as xp from league_xp_awards where subject_id = $1`,
    [row.subject_id],
  );
  const total = Number(after.rows[0]?.xp ?? 0);

  console.log(`  granted ${result.granted.length} new credits, +${result.gained} XP`);
  console.log(`  entered the week: ${result.entered}, group ${result.groupId ?? "none"}, tier ${result.tier}`);
  console.log(`  lifetime XP now ${total} — leagues ${total >= LEAGUE_UNLOCK_XP ? "UNLOCKED" : "still locked"}\n`);
  console.log(`  to undo:  delete from league_xp_awards  where subject_id = '${row.subject_id}';`);
  console.log(`            delete from league_memberships where subject_id = '${row.subject_id}';\n`);

  await client.end();
}

main().catch((err) => {
  console.error(`\n  failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
