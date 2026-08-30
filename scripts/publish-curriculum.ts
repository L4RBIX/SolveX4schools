/**
 * Record a human's approval of a month.
 *
 * This is the ONLY way content reaches a classroom in production, and it is
 * deliberately a command a person runs with their own credentials rather than
 * a field anyone can edit.
 *
 *   npx tsx scripts/publish-curriculum.ts \
 *     --month 1 --reviewer grade-9a-teacher --note "Reviewed 2026-09-01"
 *
 * The password is read from the terminal, never from a flag: a credential in
 * `--password` is a credential in the shell history and in `ps`.
 *
 * ## What it records
 *
 * The reviewer, the moment, and the sha256 of exactly the month object being
 * approved. Editing the curriculum afterwards changes that hash, the approval
 * stops matching, and the gate closes — so a review cannot silently outlive the
 * content it reviewed. That is the whole design.
 *
 * ## What it refuses
 *
 * A reviewer who is not a teacher or an admin. A month that does not exist. A
 * month whose lessons are still drafts. And it will not run non-interactively
 * without `--i-am-the-reviewer`, because a publish step that can be scripted is
 * a publish step an automation will eventually perform — and approving material
 * for fourteen-year-olds is a human act.
 */

/**
 * One tiny query surface over either engine.
 *
 * These scripts run outside a request, so `schools/store` (which is
 * `server-only`) is unavailable — but a provisioning tool that only works
 * against the development database is a provisioning tool nobody can use on the
 * day it matters. `DATABASE_URL` picks Postgres; otherwise it is the local
 * PGlite directory, which is single-writer and therefore requires the app to be
 * stopped.
 */
interface Db {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}

async function openDb(dataDir: string): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pg = (await import("pg")).default;
    const pool = new pg.Pool({ connectionString: url });
    return {
      query: async <T,>(text: string, params: unknown[] = []) => {
        const r = await pool.query(text, params);
        return { rows: r.rows as T[] };
      },
      close: () => pool.end(),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await openDb(dataDir);
  return {
    query: async <T,>(text: string, params: unknown[] = []) => {
      const r = await db.query(text, params);
      return { rows: r.rows as T[] };
    },
    close: () => db.close(),
  };
}
import { randomUUID, createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { MONTH_BY_INDEX } from "../schools/curriculum/months";
import { curriculumHash } from "../schools/curriculum/publication";
import { verifyPassword } from "../schools/auth/password";

function arg(flag: string, fallback?: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`missing --${flag}`);
}
const has = (flag: string) => process.argv.slice(2).includes(`--${flag}`);

async function main() {
  const monthIndex = Number(arg("month"));
  const reviewerUsername = arg("reviewer");
  const note = arg("note", "");
  const schoolId = arg("school", process.env.SCHOOL_ID ?? "pilot-school");
  const dataDir = arg("data-dir", process.env.LEARNING_DATA_DIR ?? ".data/learning");

  const month = MONTH_BY_INDEX.get(monthIndex);
  if (!month) throw new Error(`no month ${monthIndex}`);

  const drafts = month.units.flatMap((u) => u.lessons.filter((l) => l.status === "draft"));
  if (drafts.length > 0) {
    throw new Error(
      `month ${monthIndex} still has ${drafts.length} draft lesson(s): ${drafts.map((l) => l.id).join(", ")}`,
    );
  }

  const hash = curriculumHash(month);
  const tasks = month.units.reduce(
    (n, u) => n + u.lessons.reduce((m, l) => m + l.blocks.length, 0),
    0,
  );

  console.log(`\n  Month ${monthIndex} — ${month.monthName.kk} / ${month.monthName.ru}`);
  console.log(`  ${month.units.reduce((n, u) => n + u.lessons.length, 0)} lessons, ${tasks} blocks`);
  console.log(`  curriculum hash: ${hash}`);
  console.log(`\n  Publishing records YOU as having reviewed exactly this content.`);
  console.log(`  If the curriculum changes afterwards, this approval lapses automatically.\n`);

  if (!has("i-am-the-reviewer")) {
    console.log("  Refusing to continue without --i-am-the-reviewer.");
    console.log("  That flag is an assertion that a person read the material, not a formality.\n");
    process.exitCode = 2;
    return;
  }

  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  const password = await rl.question(`  Password for ${reviewerUsername}: `);
  rl.close();

  const db = await openDb(dataDir);
  const found = await db.query<{
    user_id: string;
    role: string;
    display_name: string;
    password_hash: string;
    password_salt: string;
    disabled_at: string | null;
  }>(
    `select user_id, role, display_name, password_hash, password_salt, disabled_at
       from school_accounts where school_id = $1 and lower(username) = lower($2)`,
    [schoolId, reviewerUsername],
  );
  const reviewer = found.rows[0];

  const ok =
    reviewer &&
    !reviewer.disabled_at &&
    (await verifyPassword(password, {
      hash: reviewer.password_hash,
      salt: reviewer.password_salt,
    }));

  if (!ok) {
    console.log("\n  Not published: credentials rejected.\n");
    await db.close();
    process.exitCode = 1;
    return;
  }

  if (reviewer.role !== "teacher" && reviewer.role !== "admin") {
    console.log(`\n  Not published: ${reviewerUsername} is a ${reviewer.role}.\n`);
    await db.close();
    process.exitCode = 1;
    return;
  }

  await db.query(
    `insert into curriculum_publications
       (publication_id, month_index, curriculum_hash, reviewer_id, note)
     values ($1,$2,$3,$4,$5)
     on conflict (month_index, curriculum_hash) where withdrawn_at is null do nothing`,
    [randomUUID(), monthIndex, hash, reviewer.user_id, note || null],
  );

  const live = await db.query<{ n: number }>(
    `select count(*)::int as n from curriculum_publications
      where month_index = $1 and curriculum_hash = $2 and withdrawn_at is null`,
    [monthIndex, hash],
  );
  await db.close();

  if (Number(live.rows[0]?.n ?? 0) > 0) {
    console.log(`\n  Published. Month ${monthIndex} approved by ${reviewer.display_name}.`);
    console.log(`  Students will now be served this content, and only this content.\n`);
  } else {
    console.log("\n  Not published: the insert was rejected.\n");
    process.exitCode = 1;
  }
}

/** Unused but kept honest: the CLI hashes nothing itself. */
void createHash;

main().catch((err) => {
  console.error(`\n  publish failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
