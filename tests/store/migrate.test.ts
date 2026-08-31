import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";

/**
 * The migrations are the schema.
 *
 * This suite exists because the alternative — trusting that Postgres SQL
 * written for another deployment applies here — is exactly the assumption that
 * fails at the worst moment. Every constraint asserted below is one the
 * intelligence depends on.
 */

let sql: PgliteExecutor;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

async function tableExists(name: string): Promise<boolean> {
  const r = await sql.query<{ n: number }>(
    `select count(*)::int as n from information_schema.tables
     where table_schema = 'public' and table_name = $1`,
    [name],
  );
  return r.rows[0].n > 0;
}

describe("migrations", () => {
  it("creates the ledger and its projections", async () => {
    for (const t of [
      "learning_subjects",
      "learning_events",
      "attempt_episodes",
      "interventions",
      "intervention_outcomes",
      "learner_state",
      "code_blobs",
      "school_subject_scope",
    ]) {
      expect(await tableExists(t), `${t} should exist`).toBe(true);
    }
  });

  it("is idempotent — a second run applies nothing", async () => {
    const again = await migrate(sql, { applyLocalBootstrap: true });
    expect(again.applied).toEqual([]);
  });

  /**
   * The production path, on a database that has never heard of Supabase.
   *
   * `schools/store/index.ts` used to call `migrate(sql, false)` for Postgres,
   * which skipped `0000_bootstrap_local.sql` because "a managed Postgres
   * already has these roles". Only SUPABASE has them. On a pristine
   * PostgreSQL 16.14 the chain died at migration 0003 with
   * `role "anon" does not exist` — 1 of 21 applied, one table, no product,
   * on the very first boot of a real deployment.
   *
   * Nothing caught it because every suite in this repository, this file
   * included, called the runner with `applyLocalBootstrap: true`. A fresh
   * PGlite has no more idea what `anon` is than RDS does, so it reproduces the
   * production path exactly and needs no external server to do it.
   */
  it("applies the whole chain the way production calls it, with no Supabase roles present", async () => {
    const fresh = await PgliteExecutor.open("memory://");
    try {
      const before = await fresh.query<{ rolname: string }>(
        `select rolname from pg_roles where rolname in ('anon', 'authenticated', 'service_role')`,
      );
      expect(before.rows, "the fixture must start without the Supabase roles").toEqual([]);

      const r = await migrate(fresh, { applyLocalBootstrap: false });

      expect(r.applied).toContain("0000_bootstrap_local.sql");
      expect(r.skipped).toEqual([]);
      expect(r.applied.length).toBeGreaterThanOrEqual(22);

      // The revokes in 0003 and eleven later files had something to revoke from.
      const after = await fresh.query<{ n: number }>(
        `select count(*)::int as n from pg_roles where rolname in ('anon', 'authenticated', 'service_role')`,
      );
      expect(after.rows[0].n).toBe(3);
    } finally {
      await fresh.close();
    }
  });

  it("accepts the school task kinds that migration 0007 widened", async () => {
    // The shipped CHECK rejected every school kind; 0007 replaced it. If this
    // regresses, every lesson insert fails at the database.
    const r = await sql.query<{ c: string }>(
      `select pg_get_constraintdef(oid) as c from pg_constraint
       where conname = 'attempt_episodes_task_kind_check'`,
    );
    expect(r.rows.length).toBe(1);
    for (const kind of ["lesson", "practice", "assessment", "contest"]) {
      expect(r.rows[0].c).toContain(kind);
    }
  });

  it("keeps RLS on with no policies — a browser JWT gets nothing", async () => {
    const r = await sql.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relname in ('learning_events','attempt_episodes','learner_state')
         and relnamespace = 'public'::regnamespace`,
    );
    expect(r.rows.length).toBe(3);
    for (const row of r.rows) {
      expect(row.relrowsecurity, `${row.relname} must have RLS enabled`).toBe(true);
    }
  });
});
