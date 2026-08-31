import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";

/**
 * Migration 0023 against a real Postgres (PGlite) with every shipped migration
 * applied in order.
 *
 * The constraints below are the anti-farming and anti-double-promotion design,
 * so they are asserted against the DATABASE rather than against the TypeScript
 * that is supposed to respect them. A rule enforced by a constraint survives the
 * next person in a hurry; a rule enforced by a code path does not.
 */

const SUBJECT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

let sql: PgliteExecutor;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  for (const id of [SUBJECT, OTHER]) {
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')
       on conflict do nothing`,
      [id],
    );
  }
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

async function award(subject: string, achievement: string, entity: string, week = "2026-W37") {
  return sql.query(
    `insert into league_xp_awards
       (subject_id, achievement, entity_id, amount, week_id, policy_version)
     values ($1,$2,$3,10,$4,'xp.v1')`,
    [subject, achievement, entity, week],
  );
}

describe("migration 0023 applies", () => {
  it("creates all five league tables", async () => {
    const r = await sql.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_name like 'league%' order by 1`,
    );
    expect(r.rows.map((x) => x.table_name)).toEqual([
      "league_groups",
      "league_memberships",
      "league_profiles",
      "league_settlements",
      "league_xp_awards",
    ]);
  });

  it("enables row level security on every one of them, with no policies", async () => {
    const r = await sql.query<{ relname: string; relrowsecurity: boolean; n: number }>(
      `select c.relname, c.relrowsecurity,
              (select count(*) from pg_policy p where p.polrelid = c.oid)::int as n
         from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
        where ns.nspname = 'public' and c.relname like 'league%'
          and c.relkind = 'r'
        order by 1`,
    );
    expect(r.rows.length).toBe(5);
    for (const row of r.rows) {
      expect(row.relrowsecurity, `${row.relname} RLS`).toBe(true);
      expect(Number(row.n), `${row.relname} policies`).toBe(0);
    }
  });
});

describe("the award key makes duplicate credit structurally impossible", () => {
  it("refuses a second award for the same (subject, achievement, entity)", async () => {
    await award(SUBJECT, "block_solved", "m1.l1.b1");
    await expect(award(SUBJECT, "block_solved", "m1.l1.b1")).rejects.toThrow();
  });

  it("refuses it even when the week differs — a solved block is solved forever", async () => {
    await expect(award(SUBJECT, "block_solved", "m1.l1.b1", "2026-W38")).rejects.toThrow();
  });

  it("allows a different achievement on the same block", async () => {
    await expect(award(SUBJECT, "block_solved_unaided", "m1.l1.b1")).resolves.toBeTruthy();
  });

  it("allows a different learner on the same block", async () => {
    await expect(award(OTHER, "block_solved", "m1.l1.b1")).resolves.toBeTruthy();
  });

  it("refuses an achievement outside the closed vocabulary", async () => {
    await expect(award(SUBJECT, "logged_in", "whatever")).rejects.toThrow();
  });

  it("refuses a non-positive amount, so XP can never be a punishment", async () => {
    await expect(
      sql.query(
        `insert into league_xp_awards
           (subject_id, achievement, entity_id, amount, week_id, policy_version)
         values ($1,'block_solved','neg',-5,'2026-W37','xp.v1')`,
        [SUBJECT],
      ),
    ).rejects.toThrow();
  });

  it("refuses a malformed week id", async () => {
    await expect(award(SUBJECT, "block_solved", "wk", "last-tuesday")).rejects.toThrow();
  });
});

describe("membership and settlement uniqueness", () => {
  const GROUP = "33333333-3333-4333-8333-333333333333";

  beforeAll(async () => {
    await sql.query(
      `insert into league_groups (group_id, week_id, tier, school_id, class_id)
       values ($1,'2026-W37',1,'pilot-school','grade-9a')`,
      [GROUP],
    );
  });

  it("refuses a second group for the same (week, tier, class, ordinal)", async () => {
    await expect(
      sql.query(
        `insert into league_groups (group_id, week_id, tier, school_id, class_id)
         values ('44444444-4444-4444-8444-444444444444','2026-W37',1,'pilot-school','grade-9a')`,
      ),
    ).rejects.toThrow();
  });

  it("refuses a learner in two groups in one week", async () => {
    await sql.query(
      `insert into league_memberships (subject_id, week_id, group_id, tier)
       values ($1,'2026-W37',$2,1)`,
      [SUBJECT, GROUP],
    );
    const second = "55555555-5555-4555-8555-555555555555";
    await sql.query(
      `insert into league_groups (group_id, week_id, tier, school_id, class_id, ordinal)
       values ($1,'2026-W37',1,'pilot-school','grade-9a',2)`,
      [second],
    );
    await expect(
      sql.query(
        `insert into league_memberships (subject_id, week_id, group_id, tier)
         values ($1,'2026-W37',$2,1)`,
        [SUBJECT, second],
      ),
    ).rejects.toThrow();
  });

  it("refuses a second settlement for the same learner and week", async () => {
    const row = `insert into league_settlements
        (subject_id, week_id, group_id, final_xp, rank, group_size,
         tier_before, movement, tier_after, policy_version)
      values ($1,'2026-W37',$2,120,1,18,1,'promoted',2,'league.v1')`;
    await sql.query(row, [SUBJECT, GROUP]);
    await expect(sql.query(row, [SUBJECT, GROUP])).rejects.toThrow();
  });

  it("refuses a movement outside the closed vocabulary", async () => {
    await expect(
      sql.query(
        `insert into league_settlements
           (subject_id, week_id, group_id, final_xp, rank, group_size,
            tier_before, movement, tier_after, policy_version)
         values ($1,'2026-W40',$2,10,1,4,1,'demoted',1,'league.v1')`,
        [OTHER, GROUP],
      ),
    ).rejects.toThrow();
  });

  it("refuses a tier outside 1..10", async () => {
    await expect(
      sql.query(
        `insert into league_profiles (subject_id, tier) values ($1, 11)`,
        [SUBJECT],
      ),
    ).rejects.toThrow();
  });
});

describe("erasure", () => {
  it("takes every league row with the learner, and needs no new statement in learning_forget_user", async () => {
    const gone = "66666666-6666-4666-8666-666666666666";
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [gone],
    );
    await sql.query(
      `insert into league_xp_awards
         (subject_id, achievement, entity_id, amount, week_id, policy_version)
       values ($1,'block_solved','b',10,'2026-W37','xp.v1')`,
      [gone],
    );
    await sql.query(`insert into league_profiles (subject_id, tier) values ($1,3)`, [gone]);

    /* The same statement `learning_forget_user` ends with. If any league table
       held a bare foreign key, this would throw and consent revocation would
       fail for the child exercising it — the defect 0007 had to repair. */
    await sql.query(`delete from learning_subjects where subject_id = $1`, [gone]);

    for (const t of ["league_xp_awards", "league_profiles"]) {
      const left = await sql.query<{ n: number }>(
        `select count(*)::int as n from ${t} where subject_id = $1`,
        [gone],
      );
      expect(Number(left.rows[0].n), t).toBe(0);
    }
  });
});
