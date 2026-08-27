/**
 * Provision a school, a class, a teacher and a roster.
 *
 * This is an OPERATIONS tool, not a dev fixture: it is how a school gets set up
 * for real, and it is the same command whether the roster is eighteen students
 * or two hundred. Class size is an argument, never a constant — the pilot's
 * eighteen is a fact about the pilot.
 *
 * It talks to the database directly rather than through `schools/store`,
 * because that module is `server-only` and this runs outside a request. The SQL
 * here is deliberately thin: inserts against the schema in migration 0012 and
 * nothing clever, so it cannot drift into a second definition of the model.
 *
 * ## Credentials
 *
 * Printed to stdout, once, and written nowhere. A file of initial passwords in
 * a repository is a file of initial passwords in a repository. Every account is
 * created with `must_change_password`, so the printed value is a one-time code
 * a teacher reads out, not a password anyone keeps.
 *
 *   npx tsx scripts/provision-class.ts \
 *     --school gymnasium-5 --class 9A --class-name "9А" \
 *     --teacher-name "Айгүл Серікқызы" --students 18
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
import { randomUUID } from "node:crypto";
import { generateInitialPassword, hashPassword } from "../schools/auth/password";

interface Args {
  school: string;
  classId: string;
  className: string;
  teacherName: string;
  students: number;
  dataDir: string;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string, fallback?: string): string => {
    const i = argv.indexOf(`--${flag}`);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${flag}`);
  };
  const students = Number(get("students", "18"));
  if (!Number.isInteger(students) || students < 1 || students > 500) {
    throw new Error("--students must be an integer between 1 and 500");
  }
  return {
    school: get("school", process.env.SCHOOL_ID ?? "pilot-school"),
    classId: get("class", process.env.CLASS_ID ?? "grade-9a"),
    className: get("class-name", "9А"),
    teacherName: get("teacher-name", "Мұғалім"),
    students,
    dataDir: get("data-dir", process.env.LEARNING_DATA_DIR ?? ".data/learning"),
  };
}

/** `aidana-04` — readable aloud, unique per class, no accents to mistype. */
function studentUsername(classId: string, n: number): string {
  const slug = classId.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${slug}-${String(n).padStart(2, "0")}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = await openDb(args.dataDir);

  const rows: { role: string; name: string; username: string; password: string }[] = [];

  async function account(
    role: "student" | "teacher",
    username: string,
    displayName: string,
  ): Promise<string> {
    const existing = await db.query<{ user_id: string }>(
      `select user_id from school_accounts where school_id = $1 and lower(username) = lower($2)`,
      [args.school, username],
    );
    if (existing.rows.length > 0) return existing.rows[0].user_id;

    const password = generateInitialPassword();
    const stored = await hashPassword(password);
    const userId = randomUUID();
    await db.query(
      `insert into school_accounts
         (user_id, school_id, role, username, display_name, password_hash, password_salt)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, args.school, role, username, displayName, stored.hash, stored.salt],
    );
    rows.push({ role, name: displayName, username, password });
    return userId;
  }

  await db.query(
    `insert into school_classes (school_id, class_id, name) values ($1,$2,$3)
     on conflict (school_id, class_id) do update set name = excluded.name`,
    [args.school, args.classId, args.className],
  );

  const teacherId = await account("teacher", `${args.classId.toLowerCase()}-teacher`, args.teacherName);
  await db.query(
    `insert into class_teachers (school_id, class_id, user_id) values ($1,$2,$3)
     on conflict do nothing`,
    [args.school, args.classId, teacherId],
  );

  for (let i = 1; i <= args.students; i += 1) {
    const username = studentUsername(args.classId, i);
    const userId = await account("student", username, `Оқушы ${i}`);
    await db.query(
      `insert into class_enrolments (school_id, class_id, user_id) values ($1,$2,$3)
       on conflict (school_id, class_id, user_id) do update set withdrawn_at = null`,
      [args.school, args.classId, userId],
    );
  }

  await db.close();

  console.log(`\n  School ${args.school} · class ${args.classId} (${args.className})`);
  console.log(`  ${args.students} students, 1 teacher\n`);
  if (rows.length === 0) {
    console.log("  Nothing new — every account already existed. No credentials to print.\n");
    return;
  }
  console.log("  ONE-TIME credentials. Printed once, stored nowhere. Every account");
  console.log("  must change its password at first sign-in.\n");
  console.log("  role     username              password             name");
  console.log("  " + "-".repeat(72));
  for (const r of rows) {
    console.log(`  ${r.role.padEnd(8)} ${r.username.padEnd(21)} ${r.password.padEnd(20)} ${r.name}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(`\n  provisioning failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
