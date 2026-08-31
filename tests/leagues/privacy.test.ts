import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { displayNameFor, leagueForLearner } from "@schools/leagues/queries";

/**
 * What one fourteen-year-old learns about another.
 *
 * §12 and §21: a league is deliberately shallow. It says how much work somebody
 * did this week and nothing about how well they understand it, and the gap
 * between those two is the entire privacy argument for showing children to each
 * other at all.
 */

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";
const CLASS = "9a";
const WEEK = "2026-W37";
const NOW = new Date("2026-09-09T12:00:00Z");

let sql: PgliteExecutor;

const subj = (n: number) => `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;

async function learner(n: number, name: string, school: string, cls: string, xp: number) {
  const id = subj(n);
  const userId = `${String(n).padStart(8, "0")}-1111-4111-8111-111111111111`;
  await sql.query(
    `insert into school_accounts
       (user_id, school_id, role, username, display_name, password_hash, password_salt)
     values ($1,$2,'student',$3,$4,'x','y')`,
    [userId, school, `learner-${n}`, name],
  );
  await sql.query(
    `insert into learning_subjects (subject_id, user_id, cohort) values ($1,$2,'public')`,
    [id, userId],
  );
  await sql.tx((t) =>
    awardXp(
      t,
      { subjectId: id, weekId: WEEK, schoolId: school, classId: cls },
      [{ achievement: "block_solved", entityId: `b.${n}`, amount: xp }],
    ),
  );
  return id;
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

describe("the display name shown to a classmate", () => {
  it("is a first name and an initial, never the full name", () => {
    expect(displayNameFor("Айдана Смагулова")).toBe("Айдана С.");
    expect(displayNameFor("Ерболат Нурланович Абишев")).toBe("Ерболат А.");
  });

  it("passes a single name through — the pilot provisions «Оқушы 7»", () => {
    expect(displayNameFor("Оқушы")).toBe("Оқушы");
  });

  it("does not split a surrogate pair in half", () => {
    /* `parts[n][0]` would slice an extended-plane character and render a
       replacement box. Kazakh does not need this; a learner whose name carries
       one does. */
    expect(displayNameFor("Аида 𝒮мирнова")).toBe("Аида 𝒮.");
  });

  it("renders a neutral dash for an erased or accountless subject, never a blank", () => {
    /* Dropping the row instead would renumber every rank around them — other
       children's positions must not change because of something that happened
       to a classmate. */
    expect(displayNameFor(null)).toBe("—");
    expect(displayNameFor("   ")).toBe("—");
  });
});

describe("the payload a learner receives about their group", () => {
  let me = "";

  beforeAll(async () => {
    me = await learner(1, "Айдана Смагулова", SCHOOL_A, CLASS, 100);
    await learner(2, "Ерболат Абишев", SCHOOL_A, CLASS, 80);
    await learner(3, "Дана Ким", SCHOOL_A, CLASS, 60);
  }, 60_000);

  it("carries no subject id, user id or any other stable identifier", async () => {
    const view = await leagueForLearner(sql, me, NOW);
    const json = JSON.stringify(view);

    for (const id of [subj(1), subj(2), subj(3)]) {
      expect(json.includes(id), "a subject id reached the browser").toBe(false);
    }
    expect(json).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  });

  it("carries no school, class, username or full surname", async () => {
    const json = JSON.stringify(await leagueForLearner(sql, me, NOW));
    for (const leak of [SCHOOL_A, CLASS, "learner-1", "learner-2", "Смагулова", "Абишев"]) {
      expect(json.includes(leak), leak).toBe(false);
    }
  });

  it("carries nothing about how anybody is doing, only how much they did", async () => {
    const json = JSON.stringify(await leagueForLearner(sql, me, NOW));
    for (const leak of [
      "attempt", "failure", "hint", "assist", "skill", "mastery",
      "misconception", "independence", "struggle", "review", "verdict",
    ]) {
      expect(json.toLowerCase().includes(leak), leak).toBe(false);
    }
  });

  it("marks exactly one row as the reader's own", async () => {
    const view = await leagueForLearner(sql, me, NOW);
    expect(view.rows.filter((r) => r.isYou).length).toBe(1);
    expect(view.rows.find((r) => r.isYou)?.name).toBe("Айдана С.");
  });
});

describe("cross-school", () => {
  it("puts two schools in different groups even at the same tier, week and class name", async () => {
    const a = await learner(10, "Алия Т", SCHOOL_A, CLASS, 50);
    const b = await learner(11, "Бота Ж", SCHOOL_B, CLASS, 50);

    const viewA = await leagueForLearner(sql, a, NOW);
    const viewB = await leagueForLearner(sql, b, NOW);

    const namesA = viewA.rows.map((r) => r.name);
    const namesB = viewB.rows.map((r) => r.name);

    expect(namesA).toContain("Алия Т.");
    expect(namesA).not.toContain("Бота Ж.");
    expect(namesB).toContain("Бота Ж.");
    expect(namesB).not.toContain("Алия Т.");
  }, 60_000);

  it("gives a learner no way to name a group they are not in", async () => {
    /* `leagueForLearner` takes a subject id resolved from the session and
       nothing else. There is no group parameter on any exported function, which
       is what makes cross-group reads impossible rather than merely refused. */
    const src = await import("@schools/leagues/queries");
    const exported = Object.keys(src);
    expect(exported.sort()).toEqual(
      ["displayNameFor", "lastSettledResult", "leagueForLearner", "xpBreakdown"].sort(),
    );
  });
});

describe("a learner who has not competed this week", () => {
  it("sees an empty board and no classmates at all", async () => {
    const quiet = subj(90);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [quiet],
    );
    const view = await leagueForLearner(sql, quiet, NOW);
    expect(view.you).toBeNull();
    expect(view.rows).toEqual([]);
    expect(view.groupSize).toBe(0);
    /* And a tier, so the page can still render the ladder rather than an error. */
    expect(view.tier).toBe(1);
  });
});

describe("erasure", () => {
  it("removes the learner from the board and leaves the others' ranks alone", async () => {
    const keep = await learner(20, "Сая К", "school-c", CLASS, 90);
    const going = await learner(21, "Тимур О", "school-c", CLASS, 70);

    const before = await leagueForLearner(sql, keep, NOW);
    expect(before.rows.map((r) => r.name)).toEqual(["Сая К.", "Тимур О."]);

    /* The final statement of `learning_forget_user`. */
    await sql.query(`delete from learning_subjects where subject_id = $1`, [going]);

    const after = await leagueForLearner(sql, keep, NOW);
    expect(after.rows.map((r) => r.name)).toEqual(["Сая К."]);
    expect(after.rows[0].rank).toBe(1);

    const awards = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_xp_awards where subject_id = $1`,
      [going],
    );
    expect(Number(awards.rows[0].n)).toBe(0);
  }, 60_000);
});
