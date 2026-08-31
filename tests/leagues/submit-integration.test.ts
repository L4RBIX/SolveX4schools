import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID, createHash } from "node:crypto";

/**
 * XP through the REAL submit route, with a real session and a real database.
 *
 * ## Why these do not test the engine in isolation
 *
 * Because the engine is already covered and is not where this can go wrong. The
 * farming vectors in §6 and §35 of the brief all live in the WIRING — between
 * grading, the dedup table, the event append and the award — and the specific
 * defect they are the fence around is one the product still has:
 *
 *     reload -> resubmit the same correct answer
 *       -> new submissionId, new episodeId, a SECOND accepted verdict
 *
 * That is real. `hydration.ts` deliberately withholds the episode id once a
 * block is accepted, and the client's submission-id ref is not restored from
 * hydration. So the ledger genuinely does record a second accepted verdict, and
 * the ONLY thing standing between that and duplicate XP is the award key. These
 * tests drive that exact sequence rather than trusting it.
 */

/* Before any dynamic import: `config` reads `process.env` once at module load. */
process.env.LEARNING_DATA_DIR = "memory://";
process.env.LEAGUES_ENABLED = "true";

const SCHOOL = "pilot-school";
const CLASS = "grade-9a";

/** The session token the mocked cookie jar hands back. */
let sessionToken = "";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_session" ? { value: sessionToken } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;

let store: Store;
let sql: import("@schools/store/sql").SqlExecutor;
let submit: typeof import("../../src/app/api/learning/submit/route");

let blockId: string;
let correctOptionId: string;
let wrongOptionId: string;
let secondBlockId: string;

let subjectId = "";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

async function signIn(username: string): Promise<{ userId: string; token: string }> {
  const userId = randomUUID();
  await sql.query(
    `insert into school_accounts
       (user_id, school_id, role, username, display_name, password_hash, password_salt,
        must_change_password)
     values ($1,$2,'student',$3,$4,'x','y',false)`,
    [userId, SCHOOL, username, `Айдана ${username}`],
  );
  await sql.query(
    `insert into class_enrolments (school_id, class_id, user_id) values ($1,$2,$3)
     on conflict do nothing`,
    [SCHOOL, CLASS, userId],
  );
  const token = randomUUID();
  await sql.query(
    `insert into school_sessions (session_id, token_hash, user_id, expires_at)
     values ($1,$2,$3, now() + interval '8 hours')`,
    [randomUUID(), hash(token), userId],
  );
  return { userId, token };
}

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  const handle = await (await import("@schools/store")).getStoreHandle();
  store = handle.store;
  sql = handle.sql;

  await sql.query(
    `insert into school_classes (school_id, class_id, name) values ($1,$2,'9А')
     on conflict do nothing`,
    [SCHOOL, CLASS],
  );

  /* Derived from the curriculum, not pinned: a hardcoded id starts failing for
     the wrong reason the moment a later month is authored. */
  const { PROGRAM } = await import("@schools/curriculum/program");
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const b of lesson.blocks) {
          if (b.type !== "multiple_choice" || b.options.length < 2) continue;
          if (!blockId) {
            blockId = b.id;
            correctOptionId = b.correctOptionId;
            wrongOptionId = b.options.find((o) => o.id !== b.correctOptionId)!.id;
          } else if (!secondBlockId) {
            secondBlockId = b.id;
          }
        }
      }
    }
  }
  expect(blockId).toBeTruthy();
  expect(secondBlockId).toBeTruthy();

  const me = await signIn("league-a");
  sessionToken = me.token;
  subjectId = await store.resolveSubjectForUser(me.userId, {
    schoolId: SCHOOL,
    classId: CLASS,
  });
}, 120_000);

afterAll(async () => {
  delete process.env.LEAGUES_ENABLED;
});

async function post(body: Record<string, unknown>) {
  const res = await submit.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

/* A function, not a constant. The ids are assigned in `beforeAll`, so a
   module-level object would capture the empty string and every answer would be
   graded wrong — which looks exactly like a broken award path. */
const answerCorrect = () => ({ kind: "option", id: correctOptionId }) as const;

async function totalXp(): Promise<number> {
  const r = await sql.query<{ n: number }>(
    `select coalesce(sum(amount),0)::int as n from league_xp_awards where subject_id = $1`,
    [subjectId],
  );
  return Number(r.rows[0].n);
}

async function awardRows(): Promise<{ achievement: string; entity_id: string }[]> {
  const r = await sql.query<{ achievement: string; entity_id: string }>(
    `select achievement, entity_id from league_xp_awards where subject_id = $1
      order by achievement`,
    [subjectId],
  );
  return r.rows;
}

describe("the first correct answer", () => {
  it("credits XP exactly once and enters the learner into the week", async () => {
    const r = await post({
      blockId,
      submissionId: randomUUID(),
      answer: answerCorrect(),
    });

    expect(r.status).toBe(200);
    expect(r.json.verdict).toBe("correct");
    expect(r.json.league).toMatchObject({ entered: true, tier: 1 });
    expect(await totalXp()).toBe(15); // 10 base + 5 unaided

    const m = await sql.query(
      `select 1 from league_memberships where subject_id = $1`, [subjectId]);
    expect(m.rows.length).toBe(1);
  }, 60_000);
});

describe("§35 — none of these may duplicate or fabricate XP", () => {
  it("1+2. the same submission replayed earns nothing and announces nothing", async () => {
    const before = await totalXp();
    const id = randomUUID();
    const first = await post({ blockId: secondBlockId, submissionId: id, answer: answerCorrect() });
    const gained = (first.json.league as { gained: number } | undefined)?.gained ?? 0;

    const replay = await post({ blockId: secondBlockId, submissionId: id, answer: answerCorrect() });
    /* The replay returns the STORED response, which carries no `league` key —
       the delta rides the response, never the record, so a retry cannot
       announce a credit a second time. */
    expect(replay.json.league).toBeUndefined();
    expect(await totalXp()).toBe(before + gained);
  }, 60_000);

  it("3+4. a fresh submission id for the same solved block earns nothing", async () => {
    /* This is the reload case, exactly: new submissionId, new episode, and the
       ledger really does get a second accepted verdict. The award key is what
       makes it worth zero. */
    const before = await totalXp();
    const r = await post({
      blockId,
      submissionId: randomUUID(),
      episodeId: randomUUID(),
      answer: answerCorrect(),
    });
    expect(r.json.verdict).toBe("correct");
    expect(r.json.league).toBeUndefined();
    expect(await totalXp()).toBe(before);
  }, 60_000);

  it("6. concurrent successful requests credit once", async () => {
    const before = await totalXp();
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        post({ blockId, submissionId: randomUUID(), answer: answerCorrect() }),
      ),
    );
    for (const r of results) expect(r.json.league).toBeUndefined();
    expect(await totalXp()).toBe(before);
  }, 60_000);

  it("9. wrong-answer spam earns nothing and never subtracts", async () => {
    const before = await totalXp();
    for (let i = 0; i < 5; i += 1) {
      const r = await post({
        blockId: secondBlockId,
        submissionId: randomUUID(),
        answer: { kind: "option", id: wrongOptionId },
      });
      expect(r.json.league).toBeUndefined();
    }
    expect(await totalXp()).toBe(before);
  }, 60_000);

  it("16. a forged amount in the body is a field nothing reads", async () => {
    const before = await totalXp();
    const r = await post({
      blockId,
      submissionId: randomUUID(),
      answer: answerCorrect(),
      amount: 999999,
      xp: 999999,
      league: { gained: 999999, tier: 10 },
    });
    expect(r.json.league).toBeUndefined();
    expect(await totalXp()).toBe(before);
  }, 60_000);

  it("17+18. a forged week and tier in the body change nothing", async () => {
    const before = await totalXp();
    await post({
      blockId,
      submissionId: randomUUID(),
      answer: answerCorrect(),
      weekId: "2099-W01",
      tier: 10,
    });
    const weeks = await sql.query<{ week_id: string }>(
      `select distinct week_id from league_xp_awards where subject_id = $1`, [subjectId]);
    expect(weeks.rows.some((w) => w.week_id === "2099-W01")).toBe(false);

    const tier = await sql.query<{ tier: number }>(
      `select tier from league_profiles where subject_id = $1`, [subjectId]);
    expect(Number(tier.rows[0].tier)).toBe(1);
    expect(await totalXp()).toBe(before);
  }, 60_000);

  it("19. a forged block id earns nothing and 404s", async () => {
    const before = await totalXp();
    const r = await post({
      blockId: "not.a.real.block",
      submissionId: randomUUID(),
      answer: answerCorrect(),
    });
    expect(r.status).toBe(404);
    expect(await totalXp()).toBe(before);
  }, 60_000);
});

describe("the ledger stays auditable", () => {
  it("holds one row per (achievement, curriculum entity) and never a bare total", async () => {
    const rows = await awardRows();
    const keys = rows.map((r) => `${r.achievement}:${r.entity_id}`);
    expect(new Set(keys).size).toBe(keys.length);

    /* Every entity is a curriculum id, never a submission or episode uuid. */
    for (const r of rows) {
      expect(r.entity_id).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it("stamps every row with the policy version that priced it", async () => {
    const r = await sql.query<{ policy_version: string }>(
      `select distinct policy_version from league_xp_awards where subject_id = $1`,
      [subjectId],
    );
    expect(r.rows.map((x) => x.policy_version)).toEqual(["xp.v1"]);
  });
});

describe("the feature gate", () => {
  it("awards nothing for a learner whose school is not on the allowlist", async () => {
    /* The gate is a pure function of its inputs precisely so this is testable —
       `config` resolves env once at import, so flipping the variable now would
       change nothing. */
    const { leaguesEnabledForSchool } = await import("@schools/leagues/gate");
    expect(leaguesEnabledForSchool({ enabled: true, schools: ["other"] }, SCHOOL)).toBe(false);
    expect(leaguesEnabledForSchool({ enabled: true, schools: [] }, SCHOOL)).toBe(true);
    expect(leaguesEnabledForSchool({ enabled: false, schools: [] }, SCHOOL)).toBe(false);
  });
});
