import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { runSweep } from "@schools/reducer/sweep";
import { sanitizePayload } from "@solvex/learning-contracts";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import type { LearningEventRow } from "@schools/store/learning-store";

/**
 * The honest denominator.
 *
 * `unattributedFailures` is the number the whole learner state has to be read
 * against: at three quarters unexplained, everything else is built on a quarter
 * of what happened. The core counts it from attribution events carrying
 * `unattributed_failure` — NOT from the absence of an attribution — so a
 * pipeline that stays silent when it cannot explain a failure reports zero
 * forever and makes thin evidence look complete.
 *
 * This suite exists because that is exactly what the pipeline did, and nothing
 * failed. The teacher view showed "0 unexplained" for a learner who had three.
 */

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

/** Mirrors the submit route's event stream for one graded attempt. */
async function attempt(subjectId: string, blockId: string, answer: Parameters<typeof gradeBlock>[1]) {
  const target = findBlock(blockId)!;
  const outcome = gradeBlock(target, answer);
  const episodeId = randomUUID();
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const verdictName = toLearningVerdictName(outcome.result.verdict);

  let seq = 0;
  const base = {
    subjectId, episodeId, sessionId, occurredAt: now,
    environment: "development" as const, cohort: "public" as const, route: "/t",
  };
  const rows: LearningEventRow[] = [{
    ...base, eventId: randomUUID(), seq: seq++, eventName: "episode_opened", sourceTrust: "server",
    payload: sanitizePayload({
      task_ref: outcome.taskRef, task_kind: outcome.taskKind,
      ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
    }),
  }];

  if (verdictName) {
    rows.push({
      ...base, eventId: randomUUID(), seq: seq++, eventName: "verdict_received", sourceTrust: "judge",
      payload: sanitizePayload({
        verdict: verdictName, task_ref: outcome.taskRef,
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
      }),
    });
    if (verdictName !== "accepted") {
      const attributed = Boolean(outcome.result.failureClass);
      rows.push({
        ...base, eventId: randomUUID(), seq: seq++, eventName: "failure_attributed", sourceTrust: "verifier",
        payload: sanitizePayload({
          failure_class: attributed ? outcome.result.failureClass! : "unattributed_failure",
          attribution_source: attributed ? "curriculum_diagnostic_mapping" : "no_declared_mapping",
          confidence: attributed ? 0.9 : 0,
          attribution_version: 1,
          ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
        }),
      });
    }
  }

  rows.push({
    ...base, eventId: randomUUID(), seq: seq++, eventName: "episode_closed", sourceTrust: "server",
    payload: sanitizePayload({ close_reason: verdictName === "accepted" ? "solved" : "navigated_away" }),
  });

  await store.appendEvents(rows);
}

describe("unattributed failures", () => {
  it("counts a wrong answer the author never explained", async () => {
    const subjectId = await store.resolveSubject(randomUUID());
    // '"2 + 2"' is wrong and carries NO diagnostic mapping.
    for (let i = 0; i < 3; i += 1) {
      await attempt(subjectId, "m1.l1.b2", { kind: "option", id: '"2 + 2"' });
    }
    await runSweep(store, { limit: 50 });

    const persisted = await store.getLearnerState(subjectId);
    expect(
      persisted!.state.unattributedFailures,
      "three failures nobody could explain must read as three, not zero",
    ).toBe(3);

    // And no misconception was invented from them.
    const skill = persisted!.state.skills.find((s) => s.skill === "io.print");
    expect(skill!.misconceptions).toEqual([]);
  }, 60_000);

  it("keeps an explained failure out of the unattributed count", async () => {
    const subjectId = await store.resolveSubject(randomUUID());
    // '4' IS declared unambiguous by the curriculum author.
    for (let i = 0; i < 3; i += 1) {
      await attempt(subjectId, "m1.l1.b2", { kind: "option", id: "4" });
    }
    await runSweep(store, { limit: 50 });

    const persisted = await store.getLearnerState(subjectId);
    expect(persisted!.state.unattributedFailures).toBe(0);

    const skill = persisted!.state.skills.find((s) => s.skill === "io.print")!;
    expect(skill.misconceptions.length).toBe(1);
    expect(skill.misconceptions[0].failureClass).toBe("string_vs_number_confusion");
    expect(skill.misconceptions[0].actionable).toBe(true);
    // Auditable: a claim about a child that cannot be traced to episodes is an
    // opinion, and this model does not store opinions.
    expect(skill.misconceptions[0].episodeIds.length).toBe(3);
  }, 60_000);

  it("never records an attribution for a correct answer", async () => {
    const subjectId = await store.resolveSubject(randomUUID());
    await attempt(subjectId, "m1.l1.b4", { kind: "line", line: 1 });
    await runSweep(store, { limit: 50 });

    const persisted = await store.getLearnerState(subjectId);
    expect(persisted!.state.unattributedFailures).toBe(0);
    expect(persisted!.state.skills.every((s) => s.failures === 0)).toBe(true);
  }, 60_000);
});
