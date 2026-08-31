/**
 * The database handle and the credential check that operator tools share.
 *
 * ## Why this is one file and not three copies
 *
 * `provision-class.ts`, `publish-curriculum.ts` and now `unpublish-curriculum.ts`
 * all need the same two things: a thin query surface over whichever engine
 * `DATABASE_URL` selects, and a way to check that the human running the command
 * is who they say they are. The first two grew their own copies of `openDb`,
 * and the copies diverged in the worst possible way — `publish-curriculum.ts`
 * called `openDb` from inside `openDb` on the PGlite branch and recursed until
 * the heap died, while its sibling carried a paragraph about having fixed
 * exactly that. One of the two deployment shapes the documentation describes
 * could not publish a month at all, for months.
 *
 * So the handle lives here once. `provision-class.ts` keeps its own because it
 * additionally runs migrations and needs `exec`; that one is left alone
 * deliberately rather than merged in a release pass.
 *
 * These scripts run outside a request, so `schools/store` — which is
 * `server-only` — is unavailable to them. That is the whole reason this exists.
 */
import { verifyPassword } from "../schools/auth/password";

export interface OperatorDb {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}

/**
 * Open whatever this deployment is actually using.
 *
 * `DATABASE_URL` picks Postgres; otherwise it is the local PGlite directory,
 * which is single-writer and therefore requires the app to be stopped.
 */
export async function openOperatorDb(dataDir: string): Promise<OperatorDb> {
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

  /* `PGlite.create`, never this function again. See the header: the copy this
     replaces called itself here and recursed until the process died. Resolved
     absolute and created first, for the reason `pglite-driver.ts` gives — a
     relative path reaches PGlite's node filesystem layer as a URL, and the
     resulting error names neither the caller nor the path. */
  const { PGlite } = await import("@electric-sql/pglite");
  let target = dataDir;
  if (!dataDir.startsWith("memory://")) {
    const { mkdir } = await import("node:fs/promises");
    const nodePath = await import("node:path");
    target = nodePath.resolve(process.cwd(), dataDir);
    await mkdir(target, { recursive: true });
  }
  const db = await PGlite.create(target);
  return {
    query: async <T,>(text: string, params: unknown[] = []) => {
      const r = await db.query(text, params);
      return { rows: r.rows as T[] };
    },
    close: () => db.close(),
  };
}

export interface Reviewer {
  userId: string;
  role: string;
  displayName: string;
}

export type ReviewerResult =
  | { ok: true; reviewer: Reviewer }
  | { ok: false; reason: string };

/**
 * Is this the person they say they are, and may they approve content?
 *
 * Scoped to a school, because `username` is unique per school and not globally:
 * two schools can each have a `grade-9a-teacher`, and authenticating without
 * the school would let one school's teacher publish for another's. The most
 * common failure of these commands is a mismatched `--school`, and the message
 * says so rather than leaving the operator to guess at "credentials rejected".
 */
export async function authenticateReviewer(
  db: OperatorDb,
  schoolId: string,
  username: string,
  password: string,
): Promise<ReviewerResult> {
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
    [schoolId, username],
  );

  const row = found.rows[0];
  if (!row) {
    return {
      ok: false,
      reason: `no account "${username}" in school "${schoolId}" — check --school`,
    };
  }
  if (row.disabled_at) return { ok: false, reason: `${username} is disabled` };

  const valid = await verifyPassword(password, {
    hash: row.password_hash,
    salt: row.password_salt,
  });
  if (!valid) return { ok: false, reason: "credentials rejected" };

  if (row.role !== "teacher" && row.role !== "admin") {
    return { ok: false, reason: `${username} is a ${row.role}` };
  }

  return {
    ok: true,
    reviewer: { userId: row.user_id, role: row.role, displayName: row.display_name },
  };
}
