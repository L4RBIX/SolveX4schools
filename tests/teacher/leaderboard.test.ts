import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgliteExecutor } from "../../schools/store/pglite-driver";
import { migrate } from "../../schools/store/migrate";
import { LearningStore } from "../../schools/store/learning-store";
import { hashPassword } from "../../schools/auth/password";
import { runSweep } from "../../schools/reducer/sweep";
import type { SqlExecutor } from "../../schools/store/sql";
import { classRoster, subjectIdsOf } from "../../schools/teacher/queries";
import {
  emptyCounts,
  leaderboardCounts,
  rank,
  MIN_TASKS_FOR_RANK,
  type LeaderboardCounts,
} from "../../schools/teacher/leaderboard";
import type { LeaderboardLens } from "../../schools/teacher/contracts";
import { at, episodeEvents, NOW, writeEvents, type EpisodeSpec } from "./simulated-class";

/**
 * The leaderboard, attacked.
 *
 * ## Why every one of these is a real attack
 *
 * This is a class of fourteen-year-olds and the board will be on a projector.
 * Every scenario below is something a bored, competent Grade 9 student thinks of
 * in the first week, and the brief names most of them directly (§24, §54).
 *
 * The defence is almost entirely one predicate — `count(distinct task_ref)`
 * rather than `count(*)` — plus a hard rule that assistance and reveals set
 * `independence_weight` below 1 and are therefore invisible to every lens that
 * claims independence. These tests exist to keep both true.
 *
 * ## The one thing NOT tested here
 *
 * That a hostile learner cannot forge a `verdict_received`. That is closed one
 * layer down and asserted elsewhere: `CLIENT_REPORTABLE_EVENTS` excludes it,
 * `isTrustedOutcome` refuses a browser-trusted outcome, and the submit route is
 * the only writer. If that broke, every number in the product would be wrong,
 * not just this board.
 */

let sql: SqlExecutor;
let store: LearningStore;

const SCHOOL = "gaming-school";
const CLASS_ID = "9a";

/** Fixed windows, so the fixture and the assertions cannot drift. */
const FROM = at(14);
const TO = at(-1);

type Attacker =
  | "honest_ten"
  | "honest_three_hard"
  | "spam_same_answer"
  | "replay_solved_task"
  | "open_and_close"
  | "nova_farmer"
  | "reveal_farmer"
  | "marathon"
  | "one_task_wonder";

const subjects = new Map<Attacker, string>();
let counts = new Map<string, LeaderboardCounts>();

async function learner(username: string): Promise<string> {
  const stored = await hashPassword("correct-horse-battery-staple");
  const userId = await store.createAccount({
    schoolId: SCHOOL,
    role: "student",
    username,
    displayName: username,
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
    /* A person who has finished signing in.
       `createAccount` defaults `must_change_password` to true, which is right
       for a freshly provisioned child and wrong for a fixture that then drives
       the product: every guard now refuses a first-login session with 403
       `password_change_required`. The refusal itself is pinned in
       `tests/school/auth-enforcement.test.ts`; here it would only mean the
       fixture is not a user. */
    mustChangePassword: false,
  });
  await store.enrol(SCHOOL, CLASS_ID, userId);
  return store.resolveSubjectForUser(userId, { schoolId: SCHOOL, classId: CLASS_ID });
}

/** An honest unaided solve of block `n`. */
function clean(n: number, daysAgo: number, minute = 0): EpisodeSpec {
  return {
    blockId: `m1.p${n}`,
    skillId: "arith.remainder",
    daysAgo,
    minute,
    verdicts: [{ verdict: "accepted", testsPassed: 4, testsTotal: 4 }],
    editsBeforeVerdict: 2,
    paceMinutes: 3,
  };
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  await store.upsertClass(SCHOOL, CLASS_ID, "9А");

  for (const key of [
    "honest_ten",
    "honest_three_hard",
    "spam_same_answer",
    "replay_solved_task",
    "open_and_close",
    "nova_farmer",
    "reveal_farmer",
    "marathon",
    "one_task_wonder",
  ] as Attacker[]) {
    subjects.set(key, await learner(`s-${key}`));
  }

  const events = [];

  /* An honest learner: ten different tasks, unaided, over two weeks. */
  for (let i = 1; i <= 10; i += 1) {
    events.push(...episodeEvents(subjects.get("honest_ten")!, clean(i, (i % 7) + 1, i * 15)));
  }

  /* Three tasks, unaided, on the hardest material. Fewer than the above by
     design — the point of the comparison is that ten easy beats three hard on
     a COUNT, and that is a limitation the board states rather than hides. */
  for (let i = 1; i <= 3; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("honest_three_hard")!, clean(20 + i, i + 1, i * 20)),
    );
  }

  /* ATTACK 1 — submit the same answer to the same task, twenty times.
     Twenty episodes, one distinct task. */
  for (let i = 0; i < 20; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("spam_same_answer")!, clean(1, 2, i * 5)),
    );
  }

  /* ATTACK 2 — re-solve two already-solved trivial tasks, over and over. */
  for (let i = 0; i < 15; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("replay_solved_task")!, clean((i % 2) + 1, 3, i * 6)),
    );
  }

  /* ATTACK 3 — open and close thirty lessons without submitting anything. */
  for (let i = 1; i <= 30; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("open_and_close")!, {
        blockId: `m1.p${i}`,
        daysAgo: (i % 5) + 1,
        minute: i * 8,
        verdicts: [],
        paceMinutes: 1,
      }),
    );
  }

  /* ATTACK 4 — ask Nova for a level-4 hint on everything and paste the answer. */
  for (let i = 1; i <= 12; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("nova_farmer")!, {
        ...clean(i, (i % 6) + 1, i * 12),
        hints: [4],
      }),
    );
  }

  /* ATTACK 5 — reveal the solution, then submit it. `outcome` is `accepted`
     BEFORE the reducer checks `solutionRevealed` (episode.ts:334-335), which is
     exactly the case `store.activityBuckets` gets wrong. */
  for (let i = 1; i <= 12; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("reveal_farmer")!, {
        ...clean(i, (i % 6) + 1, i * 12),
        revealed: true,
      }),
    );
  }

  /* ATTACK 6 — leave the tab open for hours on two tasks. `paceMinutes` under
     the reducer's 10-minute idle ceiling means it all counts as active time. */
  for (let i = 1; i <= 2; i += 1) {
    events.push(
      ...episodeEvents(subjects.get("marathon")!, {
        ...clean(i, 2, i * 300),
        paceMinutes: 9,
        verdicts: Array.from({ length: 30 }, () => ({
          verdict: "wrong_answer" as const,
          testsPassed: 1,
          testsTotal: 4,
          failingTest: 2,
        })),
        editsAfterFirstVerdict: 1,
      }),
    );
  }

  /* Below the evidence floor: one task, honestly solved. Not last — unranked. */
  events.push(...episodeEvents(subjects.get("one_task_wonder")!, clean(1, 1)));

  await writeEvents(sql, events);
  for (let i = 0; i < 20; i += 1) {
    const r = await runSweep(store, { limit: 500, owner: `gaming-${i}` });
    if (r.episodesReduced === 0) break;
  }

  const roster = await classRoster(sql, SCHOOL, CLASS_ID);
  counts = await leaderboardCounts(sql, subjectIdsOf(roster), FROM, TO, []);
}, 240_000);

afterAll(async () => await sql?.close());

function countsOf(who: Attacker): LeaderboardCounts {
  return counts.get(subjects.get(who)!) ?? emptyCounts(subjects.get(who)!);
}

function rankOf(lens: LeaderboardLens, who: Attacker): number | null {
  const inputs = [...subjects.entries()].map(([key, subjectId]) => ({
    member: { userId: key, displayName: key, subjectId, enrolledAt: new Date(NOW).toISOString() },
    current: counts.get(subjectId) ?? emptyCounts(subjectId),
    previous: emptyCounts(subjectId),
  }));
  const { entries } = rank(lens, inputs);
  return entries.find((e) => e.displayName === who)?.rank ?? null;
}

/* -------------------------------------------------------------------------- */

describe("counting distinct tasks, not episodes", () => {
  it("twenty submissions of the same answer to one task count as ONE task", () => {
    const c = countsOf("spam_same_answer");
    expect(c.independentTasks).toBe(1);
    /* The episodes really did happen — the ledger is not being edited. They
       simply do not multiply the credit. */
    expect(c.attemptedTasks).toBe(1);
  });

  it("re-solving two already-solved tasks fifteen times counts as TWO tasks", () => {
    expect(countsOf("replay_solved_task").independentTasks).toBe(2);
  });

  it("thirty opened-and-closed lessons count as ZERO solves", () => {
    const c = countsOf("open_and_close");
    expect(c.independentTasks).toBe(0);
    expect(c.assistedTasks).toBe(0);
    /* They did open thirty tasks, and the board says so — it just does not
       treat opening as achieving. */
    expect(c.attemptedTasks).toBe(30);
  });
});

describe("assistance can never raise a rank", () => {
  it("twelve tasks solved after a level-4 hint yield ZERO independent tasks", () => {
    const c = countsOf("nova_farmer");
    expect(c.independentTasks).toBe(0);
    expect(c.assistedTasks).toBe(12);
  });

  it("a revealed solution is assisted, not independent", () => {
    /*
     * The specific case `store.activityBuckets` gets wrong. `reduceEpisode`
     * sets `outcome='accepted'` before it checks `solutionRevealed`, and
     * `activityBuckets` then counts `accepted AND max_assistance_level < 0` as
     * solo — so on the learner's own chart a revealed answer is an independent
     * solve. This board keys on `independence_weight`, which is 0 for a reveal.
     */
    const c = countsOf("reveal_farmer");
    expect(c.independentTasks).toBe(0);
    expect(c.assistedTasks).toBe(12);
  });

  it("the honest learner outranks both farmers on the independent lens", () => {
    const honest = rankOf("independent", "honest_ten");
    const nova = rankOf("independent", "nova_farmer");
    const reveal = rankOf("independent", "reveal_farmer");

    expect(honest).toBe(1);
    expect(nova).not.toBeNull();
    expect(reveal).not.toBeNull();
    expect(honest!).toBeLessThan(nova!);
    expect(honest!).toBeLessThan(reveal!);
  });

  it("fifty assisted solves do not outrank ten independent ones", () => {
    /* The brief's §54 test, stated in its own terms. Twelve assisted here
       rather than fifty, because twelve is already enough: the assisted count
       is not on the independent axis at all, so the number is irrelevant. */
    expect(countsOf("nova_farmer").independentTasks).toBeLessThan(
      countsOf("honest_ten").independentTasks,
    );
  });
});

describe("time on screen is not ranked", () => {
  it("hours of thrashing on two tasks does not beat three honest solves", () => {
    const marathon = countsOf("marathon");
    const modest = countsOf("honest_three_hard");

    expect(marathon.independentTasks).toBe(0);
    expect(modest.independentTasks).toBe(3);
    /* No lens reads `active_seconds`. The product already removed a streak
       counter for claiming what it could not measure; rewarding screen time
       would reintroduce the same mistake with better arithmetic. */
    expect(rankOf("independent", "honest_three_hard")!).toBeLessThan(
      rankOf("independent", "marathon") ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it("consistency counts DAYS with a graded submission, not days with a tab open", () => {
    /* The opened-and-closed learner touched thirty tasks across five days and
       submitted nothing. `workingDays` filters on `submissions > 0`. */
    expect(countsOf("open_and_close").workingDays).toBe(0);
    expect(countsOf("honest_ten").workingDays).toBeGreaterThan(1);
  });
});

describe("the evidence floor", () => {
  it("a learner below the floor is unranked, not last", () => {
    const inputs = [...subjects.entries()].map(([key, subjectId]) => ({
      member: { userId: key, displayName: key, subjectId, enrolledAt: new Date(NOW).toISOString() },
      current: counts.get(subjectId) ?? emptyCounts(subjectId),
      previous: emptyCounts(subjectId),
    }));
    const { entries, unranked } = rank("independent", inputs);

    expect(countsOf("one_task_wonder").attemptedTasks).toBeLessThan(MIN_TASKS_FOR_RANK);
    expect(entries.some((e) => e.displayName === "one_task_wonder")).toBe(false);
    expect(unranked.some((u) => u.displayName === "one_task_wonder")).toBe(true);
    /* And they are given a reason, in the teacher's language. */
    const row = unranked.find((u) => u.displayName === "one_task_wonder")!;
    expect(row.reason.kk.length).toBeGreaterThan(0);
    expect(row.reason.ru.length).toBeGreaterThan(0);
  });

  it("the challenge lens does not rank a learner who has attempted no challenge work", () => {
    /* A Support learner whose route excludes the advanced set is not bottom of
       this board; they are not on it. Ranking them low would be comparing them
       against work they were never given. */
    const inputs = [...subjects.entries()].map(([key, subjectId]) => ({
      member: { userId: key, displayName: key, subjectId, enrolledAt: new Date(NOW).toISOString() },
      current: counts.get(subjectId) ?? emptyCounts(subjectId),
      previous: emptyCounts(subjectId),
    }));
    const { entries, unranked } = rank("challenge", inputs);
    expect(entries).toHaveLength(0);
    expect(unranked.length).toBe(subjects.size);
  });
});

describe("the ranking itself", () => {
  it("ties share a rank rather than being broken by an unstated criterion", () => {
    const tie = (name: string, independentTasks: number) => ({
      member: {
        userId: name,
        displayName: name,
        subjectId: name,
        enrolledAt: new Date(NOW).toISOString(),
      },
      current: { ...emptyCounts(name), independentTasks, attemptedTasks: 10 },
      previous: emptyCounts(name),
    });

    const { entries } = rank("independent", [tie("a", 5), tie("b", 5), tie("c", 3)]);
    expect(entries.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it("every entry publishes the components its value is made of", () => {
    const inputs = [...subjects.entries()].map(([key, subjectId]) => ({
      member: { userId: key, displayName: key, subjectId, enrolledAt: new Date(NOW).toISOString() },
      current: counts.get(subjectId) ?? emptyCounts(subjectId),
      previous: emptyCounts(subjectId),
    }));
    for (const lens of ["independent", "improvement", "consistency"] as LeaderboardLens[]) {
      for (const entry of rank(lens, inputs).entries) {
        /* A rank whose arithmetic is invisible is a score by another name. */
        expect(entry.components.length).toBeGreaterThan(0);
        for (const c of entry.components) {
          expect(c.label.kk.length).toBeGreaterThan(0);
          expect(c.label.ru.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("improvement is a subtraction of two counted windows, and can be negative", () => {
    const mk = (name: string, now: number, before: number) => ({
      member: {
        userId: name,
        displayName: name,
        subjectId: name,
        enrolledAt: new Date(NOW).toISOString(),
      },
      current: { ...emptyCounts(name), independentTasks: now, attemptedTasks: 10 },
      previous: { ...emptyCounts(name), independentTasks: before, attemptedTasks: 10 },
    });

    const { entries } = rank("improvement", [mk("up", 8, 2), mk("flat", 4, 4), mk("down", 1, 6)]);
    expect(entries.map((e) => e.value)).toEqual([6, 0, -5]);
    expect(entries[0].displayName).toBe("up");
  });
});
