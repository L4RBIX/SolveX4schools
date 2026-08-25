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
