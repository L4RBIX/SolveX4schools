/**
 * Erase one learner's data, at the school's request.
 *
 * ## What this is
 *
 * The operational half of the promise in `schools/legal/documents.ts`:
 * "Деректерді жою мектептің сұрауы бойынша қолмен орындалады" — data is erased
 * manually at the school's request. It is one command, it runs in a single
 * transaction, and it prints a per-table count plus a residual scan derived
 * from the live schema, so the person who ran it can tell a director what was
 * removed and show that nothing is left.
 *
 *   # what would be removed, changing nothing:
 *   npx tsx --conditions=react-server scripts/erase-learner.ts \
 *     --school gymnasium-5 --username grade9a-04
 *
 *   # and for real, naming the request:
 *   npx tsx --conditions=react-server scripts/erase-learner.ts \
 *     --school gymnasium-5 --username grade9a-04 \
 *     --confirm grade9a-04 --reason "parental request 2026-09-04"
 *
 * `DATABASE_URL` targets production; without it, the local PGlite directory —
 * which is single-writer, so the app must be stopped first.
 *
 * ## The safety properties, and why each one is here
 *
 *  - **Dry run is the default.** Nothing is deleted without `--confirm`, and
 *    `--confirm` must repeat the username exactly. A flag that is merely
 *    present is a flag that gets pasted.
 *  - **`--reason` is required for a real run** and is printed into the output
 *    the operator keeps. It is not written to the database: a record saying
 *    "this child was erased on this date" is the thing being erased.
 *  - **One transaction.** A half-erased learner is worse than an un-erased one,
 *    because nobody can tell which half.
 *  - **Students only.** Teachers are refused by `eraseLearner`, which explains
 *    why at the point of refusal.
 *  - **The residual scan runs inside the transaction, before the commit.** If
 *    anything is left, the transaction rolls back and the operator is told
 *    which table — rather than committing a partial erasure and reporting it.
 */
import {
  eraseLearner,
  findLearner,
  residualRows,
  TABLE_DISPOSITION,
  type ErasureDb,
} from "../schools/legal/erasure";

interface Db extends ErasureDb {
  exec(text: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * The same tiny surface `provision-class.ts` opens, for the same reason:
 * `schools/store` is `server-only` and this runs outside a request.
 */
async function openDb(dataDir: string): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pg = (await import("pg")).default;
    const pool = new pg.Pool({ connectionString: url });
    return {
      query: async <T,>(text: string, params: readonly unknown[] = []) => {
        const r = await pool.query(text, params as unknown[]);
        return { rows: r.rows as T[] };
      },
      exec: async (text: string) => {
        await pool.query(text);
      },
      close: () => pool.end(),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const nodePath = await import("node:path");
  const target = dataDir.startsWith("memory://")
    ? dataDir
    : nodePath.resolve(process.cwd(), dataDir);
  const db = await PGlite.create(target);
  return {
    query: async <T,>(text: string, params: readonly unknown[] = []) => {
      const r = await db.query(text, params as unknown[]);
      return { rows: r.rows as T[] };
    },
    exec: (text: string) => db.exec(text).then(() => undefined),
    close: () => db.close(),
  };
}

function arg(argv: string[], flag: string): string | null {
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1]!.startsWith("--")) return argv[i + 1]!;
  return null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const school = arg(argv, "school") ?? process.env.SCHOOL_ID ?? "pilot-school";
  const username = arg(argv, "username");
  const userId = arg(argv, "user-id");
  const confirm = arg(argv, "confirm");
  const reason = arg(argv, "reason");
  const dataDir = arg(argv, "data-dir") ?? process.env.LEARNING_DATA_DIR ?? ".data/learning";

  if (!username && !userId) {
    throw new Error("give --username (with --school) or --user-id");
  }

  const db = await openDb(dataDir);
  try {
    const identity = await findLearner(
      db,
      userId ? { userId } : { schoolId: school, username: username! },
    );
    if (!identity) {
      throw new Error(`no account: ${userId ?? `${school}/${username}`}`);
    }

    console.log(
      `\n${identity.displayName ?? identity.username} · ${identity.username} · ${identity.role}\n` +
        `school ${identity.schoolId} · user ${identity.userId}\n` +
        `subjects: ${identity.subjectIds.join(", ") || "(none — never opened a lesson)"}\n`,
    );

    /* What is there NOW, per table, before anything is removed. The dry run's
       whole value is this list: it is what a director is told will go. */
    const before = await residualRows(db, identity);
    if (before.length === 0) {
      console.log("Nothing to erase: this account holds no learner rows.\n");
    } else {
      console.log("Rows that name this learner:");
      for (const r of before) console.log(`  ${r.table.padEnd(28)} ${r.column.padEnd(12)} ${r.rows}`);
      console.log("");
    }

    if (confirm !== identity.username) {
      console.log(
        `DRY RUN — nothing was changed.\n` +
          `To erase, repeat the username and give a reason:\n` +
          `  --confirm ${identity.username} --reason "<who asked, and when>"\n` +
          `school_forget_user() would run in one transaction across the ` +
          `${Object.keys(TABLE_DISPOSITION).length} tables of this schema.\n`,
      );
      return;
    }
    if (!reason) throw new Error("--reason is required for a real run");

    await db.exec("begin");
    try {
      const counts = await eraseLearner(db, identity);
      const left = await residualRows(db, identity);
      if (left.length > 0) {
        /* Inside the transaction, so this is a rollback and not a report. A
           partial erasure that says "done" is the failure this check exists
           for. */
        await db.exec("rollback");
        console.error("\nERASURE INCOMPLETE — rolled back. Rows still naming this learner:");
        for (const r of left) console.error(`  ${r.table} (${r.column}): ${r.rows}`);
        console.error(
          "\nThis means the schema has a table the erasure plan does not know about.\n" +
            "See schools/legal/erasure.ts and tests/school/erasure.test.ts.\n",
        );
        process.exitCode = 1;
        return;
      }
      await db.exec("commit");

      const total = counts.reduce((n, c) => n + c.rows, 0);
      console.log("Erased:");
      for (const c of counts.filter((x) => x.rows > 0)) {
        console.log(`  ${c.table.padEnd(28)} ${String(c.rows).padStart(6)}`);
      }
      console.log(
        `\n${total} rows, ${counts.filter((c) => c.rows > 0).length} tables. Residual scan: clean.\n` +
          `Reason recorded by the operator: ${reason}\n` +
          `Nothing about this erasure was written to the database — keep this output.\n`,
      );
    } catch (err) {
      await db.exec("rollback");
      throw err;
    }
  } finally {
    await db.close();
  }
}

void main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
