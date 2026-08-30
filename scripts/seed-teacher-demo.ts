/**
 * Seed a realistic class into the LOCAL development database.
 *
 * A development convenience for looking at the teacher command centre with
 * something in it. It refuses to run against a real deployment for the same
 * reason `reset-demo-password.ts` does: a script that writes eighteen invented
 * learner histories is not something that should ever point at a school.
 *
 * It reuses the benchmark's own generator, so what appears on screen is what
 * the test suite asserts about — the same eighteen profiles, the same events,
 * the same reducer. A demo built from a separate fixture would be a demo of a
 * thing that is not the product.
 *
 * PGlite is single-writer, so the dev server must be STOPPED first.
 *
 *   npx tsx scripts/seed-teacher-demo.ts --school pilot-school --class grade-9a
 */
import { PGlite } from "@electric-sql/pglite";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

/*
 * `server-only` throws on import outside a React Server Component. Its job is
 * to fail the NEXT BUILD if a secret-holding module is pulled into a client
 * bundle, which is a guarantee this project depends on — and it has nothing to
 * say about a script run from a terminal, where there is no client bundle to
 * leak into.
 *
 * vitest solves this with a path alias to a stub (`tests/stubs/server-only.ts`).
 * A `tsx` script has no resolver to configure, so the same stub is installed by
 * intercepting the one specifier. Everything else resolves normally, so this
 * cannot quietly shadow a real module.
 */
const require = createRequire(import.meta.url);
const Module = require("node:module") as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const load = Module._load;
Module._load = function patched(request: string, parent: unknown, isMain: boolean) {
  if (request === "server-only") return {};
  return load.call(this, request, parent, isMain);
};

async function main() {
  const argv = process.argv.slice(2);
  const arg = (flag: string, fallback: string) => {
    const i = argv.indexOf(`--${flag}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
  };

  /*
   * Which database, and the guard that decides.
   *
   * `.env.local` may point the app at a local Postgres instead of PGlite —
   * that is what `DATABASE_URL=postgres://localhost/solvex_e2e` does, and a
   * seeder that ignores it writes eighteen learner histories into a database
   * nothing reads. (It does exactly that silently, because `tsx` does not load
   * `.env.local`; the app does.)
   *
   * So the URL is honoured, and the refusal narrows to what it was always
   * really about: this script must never point at a school. A host that is not
   * localhost is refused outright, and there is no flag to override it.
   */
  const databaseUrl = arg("database-url", process.env.DATABASE_URL ?? "");
  if (databaseUrl) {
    let host = "";
    try {
      host = new URL(databaseUrl).hostname;
    } catch {
      console.error("Refusing to run: DATABASE_URL is not a URL.");
      process.exit(1);
    }
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
      console.error(
        `Refusing to run: DATABASE_URL points at ${host}, which is not this ` +
          "machine. This script writes invented learner histories and must " +
          "never point at a school.",
      );
      process.exit(1);
    }
  }

  const schoolId = arg("school", process.env.SCHOOL_ID ?? "pilot-school");
  const classId = arg("class", process.env.CLASS_ID ?? "grade-9a");
  const password = arg("password", "solvex-demo-2026");
  const dataDir = process.env.LEARNING_DATA_DIR ?? ".data/learning";

  const target = resolve(process.cwd(), dataDir);
  await mkdir(target, { recursive: true });

  /* Imported lazily and by path: these modules are `server-only`-adjacent and
     the harness lives under tests/, which is deliberate — see the header. */
  const { PgliteExecutor } = await import("../schools/store/pglite-driver");
  const { migrate } = await import("../schools/store/migrate");
  const { LearningStore } = await import("../schools/store/learning-store");
  const { hashPassword } = await import("../schools/auth/password");
  const { runSweep } = await import("../schools/reducer/sweep");
  const { PROFILES, septemberTasks, episodeEvents, writeEvents, writeSubmissions, NOW } =
    await import(
    "../tests/teacher/simulated-class"
  );

  /*
   * The generator is anchored to a fixed `NOW` so the benchmark is
   * deterministic. A demo has to sit on the REAL calendar instead, or every
   * event lands in the future and the "last 7 days" view is empty — which is
   * exactly what the first run of this script produced.
   *
   * So the whole history is translated by one offset. Relative spacing, and
   * therefore every signal the profiles were designed to trigger, is preserved
   * to the millisecond.
   */
  const shift = Date.now() - NOW;
  const onToday = (iso: string) => new Date(Date.parse(iso) + shift).toISOString();

  let sql;
  if (databaseUrl) {
    const { PostgresExecutor } = await import("../schools/store/postgres-driver");
    sql = await PostgresExecutor.open(databaseUrl);
    /* Every migration, matching `schools/store/index.ts`. This used to skip
       0000 on the belief that a real Postgres already has the `anon` /
       `authenticated` roles — only Supabase does, and 0000 is an
       `if not exists` no-op where they are present. */
    await migrate(sql, {});
  } else {
    const db = await PGlite.create(target);
    await db.close();
    sql = await PgliteExecutor.open(dataDir);
    await migrate(sql, { applyLocalBootstrap: true });
  }
  const store = new LearningStore(sql);

  await store.upsertClass(schoolId, classId, "9А");

  const stored = await hashPassword(password);
  const teacherId = await ensureAccount(store, sql, {
    schoolId,
    role: "teacher",
    username: "aigul",
    displayName: "Айгүл Серікқызы",
    hash: stored.hash,
    salt: stored.salt,
  });
  await store.assignTeacher(schoolId, classId, teacherId);

  /*
   * A second class with nobody in it.
   *
   * Every empty state on the teacher surface — no learners, no activity, no
   * attention, nobody ready, no assessment sat, no work to mark, no leaderboard
   * evidence — is reachable only from a class in this shape, and a demo that
   * cannot produce one is a demo where those seven screens are never looked at.
   * It is also the honest first-day state of any real school: a class exists
   * before anyone has opened a lesson.
   *
   * Assigned to the same teacher so the class switcher has something to switch
   * to, which is itself worth seeing.
   */
  const emptyClassId = arg("empty-class", "grade-9b");
  await store.upsertClass(schoolId, emptyClassId, "9Б");
  await store.assignTeacher(schoolId, emptyClassId, teacherId);

  /*
   * Clear this class's prior history first.
   *
   * `writeEvents` mints a fresh `event_id` per row, so nothing dedupes and a
   * second run simply appends a second copy of every episode — the demo drifts
   * (50 independent solves became 100, median practice 88 minutes became 176)
   * and stops matching what the benchmark asserts. Re-running a seeder has to
   * be idempotent or it is not a seeder.
   *
   * Scoped to the subjects in THIS class, and to the projections that are
   * recomputable from the ledger. Accounts, enrolment and class rows are left
   * alone: they are the thing being reused.
   */
  const scoped = await sql.query<{ subject_id: string }>(
    `select subject_id from school_subject_scope where school_id = $1 and class_id = $2`,
    [schoolId, classId],
  );
  const priorSubjects = scoped.rows.map((r) => r.subject_id);
  if (priorSubjects.length > 0) {
    for (const table of [
      "intervention_outcomes",
      "interventions",
      "attempt_episodes",
      "learner_skill_state",
      "learner_state",
      "lesson_completions",
      "review_schedule",
      /* The learner's submitted words. In the purge for the same reason as
         everything else here: re-seeding must be idempotent, and a submission
         row left behind would put the same answer in the review queue twice
         under two different submission ids. */
      "learning_submissions",
      "learning_events",
    ]) {
      await sql.query(
        table === "intervention_outcomes"
          ? `delete from intervention_outcomes where intervention_id in (
               select intervention_id from interventions where subject_id = any($1::uuid[]))`
          : `delete from ${table} where subject_id = any($1::uuid[])`,
        [priorSubjects],
      );
    }
    console.log(`  cleared prior history for ${priorSubjects.length} subject(s)`);
  }

  const tasks = septemberTasks();
  const events = [];
  /* The learner's own words, which live in `learning_submissions.answer` rather
     than in the ledger. Without these the demo's review queue is empty and the
     screen that exists to open a child's writing has nothing to open. */
  const written: { subjectId: string; spec: import("../tests/teacher/simulated-class").WrittenSpec }[] =
    [];
  for (const profile of PROFILES) {
    const userId = await ensureAccount(store, sql, {
      schoolId,
      role: "student",
      username: `demo-${profile.key}`,
      displayName: profile.displayName,
      hash: stored.hash,
      salt: stored.salt,
    });
    await store.enrol(schoolId, classId, userId);
    const subjectId = await store.resolveSubjectForUser(userId, { schoolId, classId });
    for (const spec of profile.episodes(tasks)) {
      for (const event of episodeEvents(subjectId, spec)) {
        events.push({ ...event, receivedAt: onToday(event.receivedAt) });
      }
    }
    for (const spec of profile.written?.() ?? []) {
      written.push({ subjectId, spec });
    }
  }

  /* Two enrolled learners with no work at all. The case the old dashboard
     structurally could not surface, and the one worth seeing on screen. */
  /*
   * Ordinary names, deliberately.
   *
   * These were «Үнсіз Бірінші» and «Үнсіз Екінші» — literally "Silent First"
   * and "Silent Second". Self-documenting in a fixture, and a five-second test
   * on the overview caught the cost: a reviewer with no context read the two
   * learners at the TOP of the attention queue as placeholder data and doubted
   * the rest of the screen. A demo whose most urgent rows look fake teaches the
   * reader to distrust the real ones.
   */
  for (const [i, name] of ["Алишер Оспанов", "Камила Тұрғанова"].entries()) {
    const userId = await ensureAccount(store, sql, {
      schoolId,
      role: "student",
      username: `demo-silent-${i}`,
      displayName: name,
      hash: stored.hash,
      salt: stored.salt,
    });
    await store.enrol(schoolId, classId, userId);
  }

  await writeEvents(sql, events);
  await writeSubmissions(sql, written, shift);
  for (let i = 0; i < 40; i += 1) {
    const r = await runSweep(store, { limit: 500, owner: `seed-${i}` });
    if (r.episodesReduced === 0) break;
  }

  await sql.close();

  console.log(
    `\n  Empty class ${schoolId}/${emptyClassId} provisioned for the empty-state pass.`,
  );
  console.log(
    `  Seeded ${PROFILES.length + 2} learners into ${schoolId}/${classId} ` +
      `(${databaseUrl ? "postgres" : dataDir})`,
  );
  console.log(`  Teacher: aigul / ${password}\n`);
  console.log("  Start the dev server and open /teacher.\n");
}

async function ensureAccount(
  store: InstanceType<typeof import("../schools/store/learning-store").LearningStore>,
  sql: { query: <T>(text: string, params?: readonly unknown[]) => Promise<{ rows: T[] }> },
  input: {
    schoolId: string;
    role: "student" | "teacher";
    username: string;
    displayName: string;
    hash: string;
    salt: string;
  },
): Promise<string> {
  const existing = await sql.query<{ user_id: string }>(
    "select user_id from school_accounts where school_id = $1 and lower(username) = lower($2)",
    [input.schoolId, input.username],
  );
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].user_id;
    await store.setPassword(userId, input.hash, input.salt);
    /*
     * The display name is refreshed too.
     *
     * It was not, and the omission was invisible until a fixture rename: the
     * two silent learners were renamed away from «Үнсіз Бірінші» — literally
     * "Silent First", which a five-second reviewer read as placeholder data at
     * the top of the attention queue — and every already-seeded database kept
     * the old name forever, because this branch only touched the password.
     * A seeder whose fixes do not reach an existing database is a seeder people
     * work around by dropping the database.
     *
     * `must_change_password` is cleared so the demo credential logs straight in
     * rather than bouncing to the change-password screen.
     */
    await sql.query(
      `update school_accounts
          set display_name = $2, must_change_password = false
        where user_id = $1`,
      [userId, input.displayName],
    );
    return userId;
  }
  const userId = await store.createAccount({
    schoolId: input.schoolId,
    role: input.role,
    username: input.username,
    displayName: input.displayName,
    passwordHash: input.hash,
    passwordSalt: input.salt,
  });
  await sql.query(
    "update school_accounts set must_change_password = false where user_id = $1",
    [userId],
  );
  return userId;
}

main().catch((err) => {
  console.error(`\n  seeding failed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
