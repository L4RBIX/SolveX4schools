import { describe, it, expect } from "vitest";
import { verifyAttestation, toLearningVerdict } from "@solvex/learning-contracts";
import { hasAttemptSince } from "@solvex/nova-core";

import {
  taskRef,
  parseTaskRef,
  problemId,
  SANDBOX_STATUSES,
  sandboxVerdict,
  assertSandboxStatus,
  schoolHasAttemptSince,
  toGuardEvents,
  type SchoolInteraction,
} from "@schools/learning";
import { signAttestation } from "@schools/learning/sign";

const SECRET = "a".repeat(48);

describe("task references", () => {
  it("round-trips", () => {
    const ref = { kind: "lesson" as const, blockId: "m1.l5.b3", month: 1 };
    expect(taskRef(ref)).toBe("sx-lesson:m1.l5.b3");
    expect(parseTaskRef(taskRef(ref))).toEqual({ kind: "lesson", blockId: "m1.l5.b3" });
  });

  it("keeps the CP namespace intact", () => {
    expect(parseTaskRef("cp:1234A")).toEqual({ kind: "cp_problem", blockId: "1234A" });
  });

  it("rejects malformed refs rather than guessing", () => {
    expect(parseTaskRef("no-colon")).toBeNull();
    expect(parseTaskRef(":empty-prefix")).toBeNull();
    expect(parseTaskRef("sx-lesson:")).toBeNull();
  });

  it("mints a problem_id for every school task, since the verifier requires one", () => {
    const id = problemId({ kind: "assessment", blockId: "m1.as.b1", month: 1 });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("sandbox verdicts", () => {
  it("never discards a learner's slow program", () => {
    // The bug this guards: any status containing 'timeout' maps to null in the
    // contract, which would throw away the evidence December is built on.
    expect(sandboxVerdict("time_limit_exceeded")).toBe("time_limit_exceeded");
    expect(toLearningVerdict("timeout")).toBeNull(); // the trap, still present upstream
  });

  it("discards only genuine infrastructure noise", () => {
    expect(sandboxVerdict("sandbox_unavailable")).toBeNull();
    expect(sandboxVerdict("pending")).toBeNull();
  });

  it("maps every other allowed status to a real verdict", () => {
    for (const status of SANDBOX_STATUSES) {
      if (status === "sandbox_unavailable" || status === "pending") continue;
      expect(sandboxVerdict(status)).not.toBeNull();
    }
  });

  it("refuses the word that caused the bug", () => {
    expect(() => assertSandboxStatus("timeout")).toThrow(/time_limit_exceeded/);
  });

  it("refuses anything outside the closed vocabulary", () => {
    expect(() => assertSandboxStatus("TLE")).toThrow();
    expect(() => assertSandboxStatus(undefined)).toThrow();
  });
});

describe("attempt bridge", () => {
  const at = (n: number): number => 1_000 + n;

  it("counts a prediction answer as an attempt — the export's guard does not", () => {
    const interactions: SchoolInteraction[] = [
      { type: "answer_submitted", timestamp: at(5), blockType: "prediction" },
    ];
    // Raw, the way a naive integration would call it:
    expect(hasAttemptSince(interactions as never, at(0))).toBe(false);
    // Through the bridge:
    expect(schoolHasAttemptSince(interactions, at(0))).toBe(true);
  });

  it.each([
    "multiple_choice",
    "trace_code",
    "reorder_code",
    "fill_blank",
    "find_bug",
    "write_code",
    "modify_code",
    "test_case",
    "explain",
  ] as const)("counts a committed answer on a %s block", (blockType) => {
    expect(
      schoolHasAttemptSince(
        [{ type: "answer_submitted", timestamp: at(5), blockType }],
        at(0),
      ),
    ).toBe(true);
  });

  it("does not count reading, watching or opening", () => {
    const passive: SchoolInteraction[] = [
      { type: "lesson_opened", timestamp: at(1), blockType: "write_code" },
      { type: "block_viewed", timestamp: at(2), blockType: "write_code" },
      { type: "concept_read", timestamp: at(3), blockType: "concept" },
      { type: "simulation_played", timestamp: at(4), blockType: "visual_simulation" },
    ];
    expect(schoolHasAttemptSince(passive, at(0))).toBe(false);
  });

  it("does not let asking for help count as trying", () => {
    // Otherwise a learner climbs the whole ladder by asking repeatedly, which
    // is exactly what the ladder exists to prevent.
    expect(
      schoolHasAttemptSince(
        [{ type: "hint_requested", timestamp: at(9), blockType: "write_code" }],
        at(0),
      ),
    ).toBe(false);
  });

  it("ignores answers on non-attempt blocks", () => {
    expect(
      schoolHasAttemptSince(
        [{ type: "answer_changed", timestamp: at(5), blockType: "reflection" }],
        at(0),
      ),
    ).toBe(false);
  });

  it("respects the since boundary", () => {
    const one: SchoolInteraction[] = [
      { type: "answer_submitted", timestamp: at(5), blockType: "prediction" },
    ];
    expect(schoolHasAttemptSince(one, at(5))).toBe(false);
    expect(schoolHasAttemptSince(one, at(4))).toBe(true);
  });

  it("emits only vocabulary the export recognises", () => {
    const allowed = new Set(["code_changed_debounced", "run_clicked", "submit_clicked"]);
    const events = toGuardEvents([
      { type: "answer_submitted", timestamp: at(1), blockType: "prediction" },
      { type: "answer_changed", timestamp: at(2), blockType: "write_code" },
      { type: "submit_clicked", timestamp: at(3), blockType: "write_code" },
    ]);
    expect(events.length).toBe(3);
    for (const e of events) expect(allowed.has(e.type)).toBe(true);
  });
});

describe("attestation round-trip", () => {
  const facts = {
    requestId: "req-1",
    task: { kind: "lesson" as const, blockId: "m1.l5.b3", month: 1 },
    submissionId: "sub-1",
    language: "python",
    status: "wrong_answer" as const,
    judged: true,
    testsTotal: 4,
    testsPassed: 2,
    firstFailingTest: 3,
    skillRefs: ["cond.if_elif_else", "debug.boundary"],
  };

  it("produces a token the shipped verifier accepts", () => {
    const token = signAttestation(facts, SECRET);
    const verified = verifyAttestation(token, SECRET);
    expect(verified).not.toBeNull();
    expect(verified!.problem_id).toBe("sx-lesson:m1.l5.b3");
    expect(verified!.status).toBe("wrong_answer");
    expect(verified!.tests_passed).toBe(2);
    expect(verified!.tests_total).toBe(4);
    expect(verified!.skill_refs).toEqual(["cond.if_elif_else", "debug.boundary"]);
  });

  it("carries the per-test counts the intervention outcomes need", () => {
    // Without tests_passed/tests_total on two successive attempts, `progressed`
    // and `regressed` are unreachable — two of seven outcomes never fire.
    const verified = verifyAttestation(signAttestation(facts, SECRET), SECRET)!;
    expect(verified.tests_passed).not.toBeNull();
    expect(verified.tests_total).not.toBeNull();
  });

  it("fails closed on a wrong key", () => {
    expect(verifyAttestation(signAttestation(facts, SECRET), "b".repeat(48))).toBeNull();
  });

  it("fails closed on a tampered payload", () => {
    const token = signAttestation(facts, SECRET);
    const [body, mac] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    );
    decoded.status = "accepted";
    const forged = Buffer.from(JSON.stringify(decoded), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(verifyAttestation(`${forged}.${mac}`, SECRET)).toBeNull();
  });

  it("fails closed on an expired statement", () => {
    const sixHoursOne = Math.floor(Date.now() / 1000);
    const token = signAttestation(facts, SECRET, sixHoursOne - 6 * 3600 - 60);
    expect(verifyAttestation(token, SECRET, sixHoursOne)).toBeNull();
  });

  it("refuses to sign without a secret rather than signing with an empty one", () => {
    const saved = process.env.LEARNING_ATTESTATION_SECRET;
    delete process.env.LEARNING_ATTESTATION_SECRET;
    expect(() => signAttestation(facts)).toThrow(/LEARNING_ATTESTATION_SECRET/);
    if (saved !== undefined) process.env.LEARNING_ATTESTATION_SECRET = saved;
  });

  it("refuses a short secret", () => {
    expect(() => signAttestation(facts, "")).toThrow();
  });
});
