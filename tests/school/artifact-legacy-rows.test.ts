import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { projectHydration } from "@schools/learning/hydration";

/**
 * Rows settled before migration 0021 have no artifact and never will.
 *
 * Every submission graded before the column existed carries `answer = null`.
 * Those rows must keep working: the verdict restores, the progress counts, and
 * the editor stays empty. What must NOT happen is the page inventing source, or
 * a destructure on `undefined` taking the lesson down for a learner whose only
 * mistake was doing their homework last week.
 */

process.env.LEARNING_DATA_DIR = "memory://";

type Handle = Awaited<ReturnType<typeof import("@schools/store").getStoreHandle>>;
let sql: Handle["sql"];
let store: Handle["store"];

beforeAll(async () => {
  ({ sql, store } = await (await import("@schools/store")).getStoreHandle());
}, 90_000);

async function legacyLearner() {
  const subjectId = randomUUID();
  await sql.query(`insert into learning_subjects (subject_id, user_id) values ($1,$2)`, [
    subjectId,
    randomUUID(),
  ]);
  /* Exactly what a pre-0021 row looks like: settled, verdict, response — and
     the column left null, because nothing wrote it. */
  await sql.query(
    `insert into learning_submissions
       (subject_id, submission_id, block_id, episode_id, settled_at, verdict, response)
     values ($1,$2,'m1.l12.b2',$3, now(), 'correct', $4::jsonb)`,
    [subjectId, randomUUID(), randomUUID(), JSON.stringify({ verdict: "correct", cases: { passed: 5, total: 5 } })],
  );
  return subjectId;
}

describe("a submission settled before the column existed", () => {
  it("still reports its verdict and attempt count", async () => {
    const subjectId = await legacyLearner();
    const settled = await store.settledBlocks(subjectId, ["m1.l12.b2"]);
    const row = settled.get("m1.l12.b2");
    expect(row?.verdict).toBe("correct");
    expect(row?.answer, "the column is null, and that is the honest value").toBeNull();
  });

  it("hydrates into a settled block with no submitted work", async () => {
    const subjectId = await legacyLearner();
    const settled = await store.settledBlocks(subjectId, ["m1.l12.b2"]);
    const evidence = await store.blockAttempts(subjectId, ["m1.l12.b2"]);
    const assistance = await store.assistanceByBlock(subjectId, ["m1.l12.b2"]);

    const hydration = projectHydration({
      lessonId: "m1.l12",
      blocks: [{ id: "m1.l12.b2", isAttempt: true }],
      settled,
      evidence,
      assistance,
      completedAt: null,
    });

    const block = hydration.blocks["m1.l12.b2"];
    expect(block, "the block must still hydrate").toBeDefined();
    expect(block.verdict, "the verdict survives").toBe("correct");
    expect(block.restored).toBe(true);
    /* The load-bearing assertion: absent, not fabricated. A page that filled
       the editor with starter code and called it restored would be telling the
       learner they wrote something they did not. */
    expect(block.submitted, "no artifact may be invented").toBeUndefined();
  });

  it("mixes cleanly with a modern row in the same lesson", async () => {
    /* A learner will have both: blocks answered before the migration and after
       it. One shape must not break the other. */
    const subjectId = await legacyLearner();
    await sql.query(
      `insert into learning_submissions
         (subject_id, submission_id, block_id, episode_id, settled_at, verdict, response, answer)
       values ($1,$2,'m1.l12.b3',$3, now(), 'partial', $4::jsonb, $5::jsonb)`,
      [
        subjectId,
        randomUUID(),
        randomUUID(),
        JSON.stringify({ verdict: "partial" }),
        JSON.stringify({ kind: "text", value: "print(n)" }),
      ],
    );

    const ids = ["m1.l12.b2", "m1.l12.b3"];
    const hydration = projectHydration({
      lessonId: "m1.l12",
      blocks: ids.map((id) => ({ id, isAttempt: true })),
      settled: await store.settledBlocks(subjectId, ids),
      evidence: await store.blockAttempts(subjectId, ids),
      assistance: await store.assistanceByBlock(subjectId, ids),
      completedAt: null,
    });

    expect(hydration.blocks["m1.l12.b2"].submitted).toBeUndefined();
    expect(hydration.blocks["m1.l12.b3"].submitted).toEqual({ kind: "text", value: "print(n)" });
    expect(hydration.blocks["m1.l12.b2"].verdict).toBe("correct");
    expect(hydration.blocks["m1.l12.b3"].verdict).toBe("partial");
  });
});
