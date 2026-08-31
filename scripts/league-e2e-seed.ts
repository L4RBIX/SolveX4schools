/**
 * Seed a real Postgres for the league E2E.
 *
 * A separate script rather than a fixture inside the browser test, because the
 * app and the test are two processes and PGlite cannot be shared between them —
 * a second opener reads a STALE SNAPSHOT rather than failing, which is the
 * repository's known trap. Against a real `DATABASE_URL` both processes see the
 * same rows, which is the whole reason this file insists on one.
 */
import { randomUUID, createHash } from "node:crypto";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required — league E2E must not run on PGlite");

const SCHOOL = process.env.SCHOOL_ID ?? "pilot-school";
const CLASS = process.env.CLASS_ID ?? "grade-9a";

/* Deterministic, so the browser test can sign in without being told. */
const PASSWORD = "LeagueE2E-2026";

async function main() {
  const db = new Client({ connectionString: url });
  await db.connect();

  /* Apply the shipped migrations. The app does this at boot too, and both are
     idempotent — `schema_migrations` is the record. Doing it here means the
     seed can run before the server has ever started. */
  const { readdir, readFile } = await import("node:fs/promises");
  const nodePath = await import("node:path");
  const dir = nodePath.join(process.cwd(), "database", "migrations");
  await db.query(`create table if not exists schema_migrations (
    filename text primary key, applied_at timestamptz not null default now())`);
  const done = new Set(
    (await db.query("select filename from schema_migrations")).rows.map((r) => r.filename),
  );
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    /* 0000 creates roles a managed Postgres already has. A local one does not,
       so it is applied here — the same split `schools/store/index.ts` makes. */
    const text = await readFile(nodePath.join(dir, file), "utf8");
    await db.query(text);
    await db.query("insert into schema_migrations (filename) values ($1)", [file]);
  }

  await db.query(
    `insert into school_classes (school_id, class_id, name) values ($1,$2,'9А')
     on conflict (school_id, class_id) do nothing`,
    [SCHOOL, CLASS],
  );

  const { hashPassword } = await import("../schools/auth/password");

  const names = [
    "Айдана Смагулова", "Ерболат Абишев", "Дана Ким", "Тимур Оспанов",
    "Сая Калиева", "Алишер Жумабек", "Мадина Сериккызы", "Нурлан Айтбаев",
  ];

  const made: { username: string; name: string }[] = [];

  for (let i = 0; i < names.length; i += 1) {
    const username = `e2e-${i + 1}`;
    const existing = await db.query(
      `select user_id from school_accounts where school_id = $1 and lower(username) = lower($2)`,
      [SCHOOL, username],
    );
    let userId: string;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].user_id;
    } else {
      const stored = await hashPassword(PASSWORD);
      userId = randomUUID();
      await db.query(
        `insert into school_accounts
           (user_id, school_id, role, username, display_name, password_hash, password_salt,
            must_change_password)
         values ($1,$2,'student',$3,$4,$5,$6,false)`,
        [userId, SCHOOL, username, names[i], stored.hash, stored.salt],
      );
    }
    await db.query(
      `insert into class_enrolments (school_id, class_id, user_id) values ($1,$2,$3)
       on conflict (school_id, class_id, user_id) do update set withdrawn_at = null`,
      [SCHOOL, CLASS, userId],
    );
    made.push({ username, name: names[i] });
  }

  console.log(JSON.stringify({ password: PASSWORD, accounts: made }, null, 2));
  await db.end();
}

void main();
