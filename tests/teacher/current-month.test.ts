import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The month a teacher's screen describes has to be the month their class is in.
 *
 * ## The defect
 *
 * `currentMonth()` returned the highest month that was authored and gated open
 * — a fact about the DEPLOYMENT, computed once for everybody, with no reference
 * to any class. The pilot runbook publishes all nine months in one act, so from
 * the moment it ran, every teacher screen described May.
 *
 * Measured live against a seeded September class: `context.monthIndex: 9`,
 * required work 0 of 168, eight May lessons all "nobody started", the review
 * queue empty, the assessment "not started" for 21 learners. September's actual
 * work was not reachable from the teacher UI at all.
 *
 * Nothing in the suite could see it, because `tests/teacher/harness.ts`
 * constructs its bundle with `MONTH_01_SEPTEMBER` hard-coded — which is exactly
 * why this file drives the derivation itself rather than going through the
 * harness.
 *
 * ## What "the class's month" means
 *
 * The lowest month at least half the enrolled learners have not finished, where
 * finished is `monthCompletables` — the same definition the unlock policy and
 * the progress bar use. Half rather than all so one learner who never finishes
 * September cannot hold the dashboard there until May; half rather than any so
 * one learner racing ahead cannot move everybody else's screen to a month the
 * class has never met.
 */

process.env.LEARNING_DATA_DIR = "memory://";

/* `gateFor` reads publication records through the store singleton, and the
   fixture below writes them into that same in-memory instance. Nothing here
   mocks it: whether a month is servable is half of what is being tested. */
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {} }),
}));

type Sql = Awaited<ReturnType<typeof import("@schools/store").getStoreHandle>>["sql"];

let sql: Sql;
let store: Awaited<ReturnType<typeof import("@schools/store").getStore>>;
let classCurrentMonth: typeof import("@schools/teacher/context").classCurrentMonth;
let requestedMonth: typeof import("@schools/teacher/context").requestedMonth;
let monthCompletables: typeof import("@schools/curriculum/inventory").monthCompletables;
let MONTHS: typeof import("@schools/curriculum/months").MONTHS;

const SCHOOL = "month-school";
const CLASS = "month-9a";

/** Subjects standing in for a class. The derivation only needs their ids. */
const subjects: string[] = [];

async function completeMonthFor(subjectId: string, monthIndex: number) {
  const month = MONTHS.find((m) => m.index === monthIndex)!;
  for (const c of monthCompletables(month)) {
    await sql.query(
      `insert into lesson_completions
         (subject_id, lesson_id, correct, wrong, unmeasured, attempts, policy_id)
       values ($1,$2,0,0,0,0,'test')
       on conflict do nothing`,
      [subjectId, c.id],
    );
  }
}

beforeAll(async () => {
  const storeMod = await import("@schools/store");
  ({ sql } = await storeMod.getStoreHandle());
  store = await storeMod.getStore();
  ({ classCurrentMonth, requestedMonth } = await import("@schools/teacher/context"));
  ({ monthCompletables } = await import("@schools/curriculum/inventory"));
  ({ MONTHS } = await import("@schools/curriculum/months"));

  const { hashPassword } = await import("@schools/auth/password");
  const { curriculumHash } = await import("@schools/curriculum/publication");
  const pw = await hashPassword("a-long-enough-one");

  const reviewer = await store.createAccount({
    schoolId: SCHOOL,
    role: "teacher",
    username: "month-reviewer",
    displayName: "Мұғалім",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
    mustChangePassword: false,
  });

  /* Every month published, which is what the pilot runbook does and what made
     the old derivation answer "May" for everybody. */
  for (const month of MONTHS) {
    await store.publishCurriculum({
      monthIndex: month.index,
      curriculumHash: curriculumHash(month),
      reviewerId: reviewer,
      note: "current-month fixture",
    });
  }
  (await import("@schools/curriculum/gate")).resetGateCache();

  await store.upsertClass(SCHOOL, CLASS, "9А");
  /* Ten enrolled learners with subjects, minted through the store's own path so
     the rows carry whatever the schema actually requires — a hand-written
     INSERT here is one migration away from testing a table that has moved. */
  for (let i = 0; i < 10; i += 1) {
    const userId = await store.createAccount({
      schoolId: SCHOOL,
      role: "student",
      username: `month-learner-${i}`,
      displayName: `Оқушы ${i}`,
      passwordHash: pw.hash,
      passwordSalt: pw.salt,
      mustChangePassword: false,
    });
    await store.enrol(SCHOOL, CLASS, userId);
    const subjectId = await store.resolveSubjectForUser(userId, {
      schoolId: SCHOOL,
      classId: CLASS,
    });
    subjects.push(subjectId);
  }
}, 120_000);

describe("the month a class is in", () => {
  it("is September for a class that has finished nothing, with all nine published", async () => {
    const month = await classCurrentMonth(sql, subjects);
    expect(
      month.index,
      "a class three days into September was analysed as May, because May was published",
    ).toBe(1);
  });

  it("is still September when one learner has raced ahead", async () => {
    await completeMonthFor(subjects[0]!, 1);
    await completeMonthFor(subjects[0]!, 2);
    const month = await classCurrentMonth(sql, subjects);
    expect(
      month.index,
      "one fast learner moved the whole class's dashboard",
    ).toBe(1);
  });

  it("moves to October once half the class has finished September", async () => {
    for (let i = 1; i < 5; i += 1) await completeMonthFor(subjects[i]!, 1);
    /* Five of ten — the quorum is ceil(10/2) = 5. */
    const month = await classCurrentMonth(sql, subjects);
    expect(month.index, "the class finished September and the screen did not move").toBe(2);
  });

  it("never names a month the deployment is not serving", () => {
    /*
     * The clamp, asserted as the invariant rather than by withdrawing a
     * publication — `gateFor` returns `open: true` with
     * `bypassedForDevelopment` outside production, which is the documented dev
     * bypass the whole suite depends on, so a withdrawal here would change
     * nothing and the test would pass by doing nothing. Whether the GATE
     * refuses a withdrawn month in production is `publication-gate.test.ts`'s
     * question and is answered there.
     *
     * What belongs here is that this derivation cannot step outside whatever
     * that gate allows. A teacher pointed at a month the product is not serving
     * gets a screen of zeros they cannot act on, which is the failure the whole
     * change is about, arrived at from the other direction.
     */
    return (async () => {
      const { servableMonths } = await import("@schools/teacher/context");
      const allowed = (await servableMonths()).map((m) => m.index);
      expect(allowed.length, "the fixture publishes every month").toBeGreaterThan(0);
      const month = await classCurrentMonth(sql, subjects);
      expect(allowed, `month ${month.index} is not one the deployment serves`).toContain(
        month.index,
      );
    })();
  });

  it("offers a teacher only months the product would show work for", async () => {
    const { servableMonths } = await import("@schools/teacher/context");
    const allowed = new Set((await servableMonths()).map((m) => m.index));

    for (const index of allowed) {
      expect((await requestedMonth(String(index)))?.index).toBe(index);
    }
    /* Out of range, unparseable, and absent all mean "use the class's own
       month" rather than an error: a stale bookmark to a month since withdrawn
       must not be a 400 in a teacher's face. */
    expect(await requestedMonth("0")).toBeNull();
    expect(await requestedMonth("99")).toBeNull();
    expect(await requestedMonth("not a number")).toBeNull();
    expect(await requestedMonth("")).toBeNull();
    expect(await requestedMonth(null)).toBeNull();
  });

  it("names September for a class with nobody in it", async () => {
    const month = await classCurrentMonth(sql, []);
    expect(month.index, "an empty class must render the start, not a blank").toBe(1);
  });
});
