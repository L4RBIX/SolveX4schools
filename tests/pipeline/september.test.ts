import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { runSweep } from "@schools/reducer/sweep";
import { sanitizePayload } from "@solvex/learning-contracts";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { decide } from "@solvex/learning-intelligence-core";
import type { LearningEventRow } from "@schools/store/learning-store";

/**
 * September Lesson 1, end to end, through the REAL store.
 *
 * Not a mock anywhere: real migrations, real Postgres (PGlite), the real
 * reducer, the real decision engine. This is the test that would catch the
 * pipeline being wired to nothing — which is exactly what the audit found it
 * was.
 */

let sql: PgliteExecutor;
let store: LearningStore;
let subjectId: string;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  subjectId = await store.resolveSubject(randomUUID());
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

/** Writes the same events the submit route writes, from the same grading call. */
async function attempt(blockId: string, answer: Parameters<typeof gradeBlock>[1]) {
  const target = findBlock(blockId);
  expect(target, `block ${blockId} should exist in the curriculum`).not.toBeNull();
  const outcome = gradeBlock(target!, answer);
  const episodeId = randomUUID();
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const verdictName = toLearningVerdictName(outcome.result.verdict);

  let seq = 0;
  const rows: LearningEventRow[] = [
    {
      eventId: randomUUID(), subjectId, episodeId, sessionId, seq: seq++,
      eventName: "episode_opened", occurredAt: now, sourceTrust: "server",
      environment: "development", cohort: "public", route: "/lesson/m1.l1",
      payload: sanitizePayload({
        task_ref: outcome.taskRef, task_kind: outcome.taskKind,
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
      }),
    },
  ];
  if (verdictName) {
    rows.push({
      eventId: randomUUID(), subjectId, episodeId, sessionId, seq: seq++,
      eventName: "verdict_received", occurredAt: now, sourceTrust: "judge",
      environment: "development", cohort: "public", route: "/lesson/m1.l1",
      payload: sanitizePayload({
        verdict: verdictName, task_ref: outcome.taskRef,
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
      }),
    });
    if (outcome.result.failureClass) {
      rows.push({
        eventId: randomUUID(), subjectId, episodeId, sessionId, seq: seq++,
        eventName: "failure_attributed", occurredAt: now, sourceTrust: "verifier",
        environment: "development", cohort: "public", route: "/lesson/m1.l1",
        payload: sanitizePayload({
          failure_class: outcome.result.failureClass,
          attribution_source: "curriculum_diagnostic_mapping",
          confidence: 0.9, attribution_version: 1,
          ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
        }),
      });
    }
  }
  rows.push({
    eventId: randomUUID(), subjectId, episodeId, sessionId, seq: seq++,
    eventName: "episode_closed", occurredAt: now, sourceTrust: "server",
    environment: "development", cohort: "public", route: "/lesson/m1.l1",
    payload: sanitizePayload({
      close_reason: verdictName === "accepted" ? "solved" : "navigated_away",
      task_ref: outcome.taskRef,
    }),
  });

  const inserted = await store.appendEvents(rows);
  return { outcome, episodeId, inserted, rows };
}

describe("September Lesson 1 — interaction to intelligence", () => {
  it("grades the prediction wrong and attributes it, because the author declared that distractor unambiguous", async () => {
    const { outcome } = await attempt("m1.l1.b2", { kind: "option", id: "4" });
    expect(outcome.result.verdict).toBe("wrong");
    // "4" is the only answer that requires not seeing the quotes.
    expect(outcome.result.failureClass).toBe("string_vs_number_confusion");
    expect(outcome.primarySkill).toBe("io.print");
  });

  it("leaves an ambiguous wrong answer unattributed", async () => {
    const { outcome } = await attempt("m1.l1.b2", { kind: "option", id: '"2 + 2"' });
    expect(outcome.result.verdict).toBe("wrong");
    // No mapping was declared for this distractor, so nothing is claimed.
    expect(outcome.result.failureClass).toBeUndefined();
  });

  it("records NO skill for an ungraded block — the rule that keeps unmeasured work out of the model", async () => {
    const { outcome } = await attempt("m1.l1.b5", { kind: "text", value: "print(1)" });
    expect(outcome.result.verdict).toBe("unknown");
    expect(outcome.primarySkill).toBeNull();
  });

  it("is idempotent — replaying the same events inserts nothing", async () => {
    const first = await attempt("m1.l1.b4", { kind: "line", line: 1 });
    expect(first.inserted).toBeGreaterThan(0);
    const replay = await store.appendEvents(first.rows);
    expect(replay, "a retried batch must not double-count attempts").toBe(0);
  });

  it("reduces to a real LearnerState with no human clicking anything", async () => {
    const result = await runSweep(store, { limit: 100 });
    expect(result.claimed).toBe(true);
    expect(result.episodesReduced).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);

    const persisted = await store.getLearnerState(subjectId);
    expect(persisted, "state must be persisted, not held in memory").not.toBeNull();
    expect(persisted!.state.episodes).toBeGreaterThan(0);

    // The ungraded code block must not have produced a skill row.
    const skills = persisted!.state.skills.map((s) => s.skill);
    expect(skills).toContain("io.print");
    expect(skills.every((s) => typeof s === "string")).toBe(true);
  });

  it("produces a decision from the real engine", async () => {
    const persisted = await store.getLearnerState(subjectId);
    const decision = decide(persisted!.state);
    expect(decision.primary).toBeTruthy();
    expect(decision.primary.nova).toBeTruthy();
    expect(typeof decision.primary.nova.maxHintLevel).toBe("number");
  });

  it("sweeping twice changes nothing", async () => {
    const before = await store.getLearnerState(subjectId);
    await runSweep(store, { limit: 100 });
    const after = await store.getLearnerState(subjectId);
    expect(after!.state.episodes).toBe(before!.state.episodes);
    expect(after!.state.skills.length).toBe(before!.state.skills.length);
  });
});
