import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore, type LearningEventRow } from "@schools/store/learning-store";
import { CURRICULUM_VERSION, LEGACY_CURRICULUM_VERSION } from "@schools/curriculum/source-of-truth";
import { MONTHS } from "@schools/curriculum/months";
import {
  allIndependenceBlocks,
  hasDemonstratedIndependence,
  isMonthUnlocked,
  type UnlockEvidence,
} from "@schools/policies/unlock";
import { monthCompletables } from "@schools/curriculum/inventory";

/**
 * Python-era evidence must never satisfy C++ progression, and the reverse.
 *
 * ## The defect this pins
 *
 * Python block `m1.as.b1` and C++ block `m1.as.b1` share a logical id. Every
 * progression read was `subject_id + block_id`:
 *
 *     completionsForSubject  ->  lesson_completions where subject_id = $1
 *     blockAttempts          ->  learning_events, split_part(task_ref, ':', 2)
 *
 * so an accepted Python-era verdict on `m1.as.b1` satisfied the C++
 * independence requirement for September, and October unlocked. A learner would
 * be credited for demonstrating in C++ something they had only ever done in
 * Python — and the failure is silent, because every id involved is real and
 * every row is genuine. Nothing looks wrong at any layer.
 *
 * It had not materialised: production holds zero accepted independence blocks.
 * That is a fact about today's data, not an architecture, which is why this
 * file exists rather than a note saying the risk is theoretical.
 *
 * ## Why this test can be short
 *
 * The fix scopes the SUBJECT, not each evidence row: one subject per
 * (account, curriculum version). So the assertion is not "every query filters
 * correctly" — it is that the two curricula resolve to DIFFERENT subject ids,
 * after which every `where subject_id = $1` in the codebase is correct by
 * construction and there is no predicate for a future query to forget.
 *
 * That is also why the mutation proof below targets the resolver rather than
 * any individual query. Break the subject split and everything downstream
 * leaks at once, which is precisely the property being claimed.
 */

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

/** September's independence block — the one that gates October. */
const INDEPENDENCE = "m1.as.b1";

const SCHOOL = randomUUID();
const CLASS = randomUUID();

/**
 * An accepted verdict written the way the submit route writes one.
 *
 * `source_trust: "judge"` is the part that matters and the part a weaker test
 * would get wrong. `blockAttempts` computes `accepted` with
 * `source_trust = 'judge'` in the SQL itself, so a row stamped `browser` can
 * never satisfy the gate no matter what its payload claims. Seeding at the
 * trust level the product actually uses is what makes this an honest test of
 * the version scoping rather than an accidental test of the trust predicate.
 */
async function seedAcceptedVerdict(subjectId: string, blockId: string): Promise<void> {
  const episodeId = randomUUID();
  const rows: LearningEventRow[] = [
    {
      eventId: randomUUID(),
      subjectId,
      episodeId,
      sessionId: randomUUID(),
      seq: 1,
      eventName: "episode_opened",
      occurredAt: new Date().toISOString(),
      sourceTrust: "server",
      environment: "development",
      cohort: "public",
      route: "/api/learning/submit",
      payload: { task_ref: `sx-lesson:${blockId}`, task_kind: "lesson" },
    },
    {
      eventId: randomUUID(),
      subjectId,
      episodeId,
      sessionId: randomUUID(),
      seq: 2,
      eventName: "verdict_received",
      occurredAt: new Date().toISOString(),
      sourceTrust: "judge",
      environment: "development",
      cohort: "public",
      route: "/api/learning/submit",
      payload: { task_ref: `sx-lesson:${blockId}`, verdict: "accepted", task_kind: "lesson" },
    },
  ];
  await store.appendEvents(rows);
}

/** The same two reads `schools/learning/access.ts` makes, against one subject. */
async function evidenceFor(subjectId: string): Promise<UnlockEvidence> {
  const [completions, attempts] = await Promise.all([
    store.completionsForSubject(subjectId),
    store.blockAttempts(subjectId, allIndependenceBlocks(MONTHS)),
  ]);
  const solved = new Set<string>();
  for (const [blockId, evidence] of attempts) if (evidence.accepted) solved.add(blockId);
  return { completed: new Set(completions.map((c) => c.lessonId)), solved };
}

const september = () => MONTHS.find((m) => m.index === 1)!;

describe("Python evidence cannot satisfy C++ progress", () => {
  it("gives one account a different subject per curriculum version", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(
      userId,
      scope,
      "public",
      LEGACY_CURRICULUM_VERSION,
    );
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    expect(
      python,
      "one account must not share a subject across curricula — that sharing IS the defect",
    ).not.toBe(cpp);

    /* Stable, not merely different. Resolving twice must return the same id, or
       a learner's evidence would scatter across a new subject per request. */
    expect(
      await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION),
    ).toBe(cpp);
    expect(
      await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION),
    ).toBe(python);
  });

  it("does not credit a C++ independence block from a Python-era verdict", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    /* Python curriculum: an accepted, TRUSTED verdict on m1.as.b1.
       C++ curriculum: no submissions at all. */
    await seedAcceptedVerdict(python, INDEPENDENCE);

    const pythonEvidence = await evidenceFor(python);
    const cppEvidence = await evidenceFor(cpp);

    /* The Python side really did earn it — otherwise this test would pass for
       the boring reason that nothing was seeded anywhere. */
    expect(pythonEvidence.solved.has(INDEPENDENCE), "the Python-era verdict must be real").toBe(true);

    expect(cppEvidence.solved.has(INDEPENDENCE), "C++ block must NOT be solved").toBe(false);
    expect(
      hasDemonstratedIndependence(september(), cppEvidence.solved),
      "C++ September must NOT be demonstrated",
    ).toBe(false);
    expect(
      isMonthUnlocked(2, MONTHS, cppEvidence),
      "C++ October must stay LOCKED",
    ).toBe(false);
  });

  it("unlocks the next C++ month once a real C++ verdict exists", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    /* Independence alone is not the whole gate: October needs September
       COMPLETE as well as demonstrated. Assert the demonstration half directly
       so this test says what it means, and check the composed rule too. */
    await seedAcceptedVerdict(cpp, INDEPENDENCE);
    const evidence = await evidenceFor(cpp);

    expect(evidence.solved.has(INDEPENDENCE), "the C++ block is now solved").toBe(true);
    expect(
      hasDemonstratedIndependence(september(), evidence.solved),
      "C++ September is now demonstrated",
    ).toBe(true);

    /* And the composed gate opens once the lessons are finished too. Completing
       September's lessons is a different subsystem; what this asserts is that
       demonstration is no longer the thing standing in the way. */
    const withLessons: UnlockEvidence = {
      /* Built from the policy's own notion of what a month contains, not from
         a hand-rolled walk of `units[].lessons[]`. A month's completables
         include its assessment, so the hand-rolled set was silently short and
         this test failed for a reason that had nothing to do with versions. */
      completed: new Set(monthCompletables(september()).map((c) => c.id)),
      solved: evidence.solved,
    };
    expect(
      isMonthUnlocked(2, MONTHS, withLessons),
      "C++ October can now unlock",
    ).toBe(true);
  });

  it("is symmetric: C++ evidence cannot satisfy Python progress", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    await seedAcceptedVerdict(cpp, INDEPENDENCE);

    const pythonEvidence = await evidenceFor(python);
    expect(
      pythonEvidence.solved.has(INDEPENDENCE),
      "a C++ verdict must not credit the Python curriculum either",
    ).toBe(false);
  });

  it("keeps the Python evidence — isolated is not deleted", async () => {
    /* The point of the backup is that it remains. A "fix" that quarantined
       Python progress by destroying it would pass every assertion above and be
       a data-loss bug. */
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };
    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    await seedAcceptedVerdict(python, INDEPENDENCE);

    await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    const stillThere = await evidenceFor(python);
    expect(stillThere.solved.has(INDEPENDENCE)).toBe(true);
  });
});

describe("the class roster survives one learner having two subjects", () => {
  it("lists a dual-curriculum learner exactly once", async () => {
    const classId = randomUUID();
    const scope = { schoolId: SCHOOL, classId };
    const userId = randomUUID();

    await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    const roster = await store.subjectsInClass(classId);

    /* Before the version filter this returned BOTH subject rows, so a class of
       eighteen reported nineteen and one child was counted twice in every
       aggregate built on it. */
    expect(roster).toEqual([cpp]);
  });

  it("can still see the historical Python roster when asked for it", async () => {
    const classId = randomUUID();
    const scope = { schoolId: SCHOOL, classId };
    const userId = randomUUID();

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    expect(await store.subjectsInClass(classId, LEGACY_CURRICULUM_VERSION)).toEqual([python]);
  });
});

describe("erasure follows the account, not one of its subjects", () => {
  it("removes BOTH curricula's evidence for one learner", async () => {
    /* `learning_forget_user` opened with `select subject_id into subj … where
       user_id = target`. A plpgsql scalar INTO takes one row and does not
       complain when the query returns more — correct while an account had one
       subject, and made false by the version split. A learner exercising their
       right to erasure would have had one curriculum deleted and the other left
       behind, still joinable to the device that produced it.

       This is the assertion that turns that from a discovery into a failure. */
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    await seedAcceptedVerdict(python, INDEPENDENCE);
    await seedAcceptedVerdict(cpp, INDEPENDENCE);

    await sql.query(`update learning_subjects set user_id = $1 where subject_id = any($2::uuid[])`, [
      userId,
      [python, cpp],
    ]);

    const before = await sql.query<{ n: number }>(
      `select count(*)::int n from learning_events where subject_id = any($1::uuid[])`,
      [[python, cpp]],
    );
    expect(Number(before.rows[0].n), "both subjects must have evidence to erase").toBeGreaterThan(0);

    await sql.query(`select * from learning_forget_user($1)`, [userId]);

    for (const [label, subjectId] of [["python", python], ["cpp", cpp]] as const) {
      const left = await sql.query<{ n: number }>(
        `select count(*)::int n from learning_events where subject_id = $1`,
        [subjectId],
      );
      expect(Number(left.rows[0].n), `${label} evidence must be gone`).toBe(0);
    }

    const subjectsLeft = await sql.query<{ n: number }>(
      `select count(*)::int n from learning_subjects where user_id = $1`,
      [userId],
    );
    expect(Number(subjectsLeft.rows[0].n), "no subject row may survive erasure").toBe(0);

    const aliasesLeft = await sql.query<{ n: number }>(
      `select count(*)::int n from learning_subject_aliases where alias_value = $1`,
      [userId],
    );
    expect(Number(aliasesLeft.rows[0].n), "no alias may survive — it re-identifies the device").toBe(0);
  });
});

describe("the stored version is explicit, never inferred", () => {
  it("writes the active version on a new subject and leaves it there", async () => {
    const subjectId = await store.resolveSubject(randomUUID());
    const r = await sql.query<{ curriculum_version: string }>(
      `select curriculum_version from learning_subjects where subject_id = $1`,
      [subjectId],
    );
    expect(r.rows[0]?.curriculum_version).toBe(CURRICULUM_VERSION);
  });

  it("keeps the database default in step with the code constant", async () => {
    /* The one thing a column default can do wrong is go stale: bump
       CURRICULUM_VERSION and the database keeps minting subjects for the old
       curriculum, silently, for every fixture and seed script that inserts
       directly. This turns that into a failing test rather than a discovery. */
    const r = await sql.query<{ column_default: string | null }>(
      `select column_default from information_schema.columns
        where table_name = 'learning_subjects' and column_name = 'curriculum_version'`,
    );
    const def = r.rows[0]?.column_default ?? "";
    expect(
      def,
      `the learning_subjects default is ${def}, but CURRICULUM_VERSION is ` +
        `${CURRICULUM_VERSION} — write the migration that moves it`,
    ).toContain(CURRICULUM_VERSION);
  });

  it("refuses a version outside the known set", async () => {
    /* The check constraint is what stops a typo becoming a third curriculum
       that silently shares nothing with either real one. */
    await expect(
      sql.query(
        `insert into learning_subjects (subject_id, cohort, curriculum_version)
         values ($1, 'public', 'cpp17-year1-v2-typo')`,
        [randomUUID()],
      ),
    ).rejects.toThrow();
  });
});
