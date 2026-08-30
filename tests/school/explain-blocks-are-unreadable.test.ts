import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { ALLOWED_PAYLOAD_KEYS } from "@solvex/learning-contracts";

/**
 * 33 blocks ask a learner to write, and nothing keeps what they wrote.
 *
 * `explain` settles `unknown` by design — it is marked by a human. What the
 * audit found is that no human can: the submit route reads `answer.value` only
 * for code blocks, `learning_submissions` has no answer column, the event
 * payload contract has `content_len` but no field for the text, and the teacher
 * API returns `LearnerState` aggregates rather than responses.
 *
 * So every `expectedPoints` list on an `explain` block is currently
 * decorative — authored marking points for a response that no longer exists by
 * the time anyone could mark it.
 *
 * This file does not assert that state is correct. It pins the two facts that
 * make it true, so that building the teacher view breaks this test and whoever
 * builds it finds this comment.
 */

describe("the written-explanation channel", () => {
  it("has blocks that carry authored marking points", () => {
    let explain = 0;
    let withPoints = 0;
    for (const m of MONTHS) {
      for (const b of [
        ...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
        ...(m.assessment?.blocks ?? []),
      ]) {
        if (b.type !== "explain") continue;
        explain += 1;
        const pts = (b as unknown as { expectedPoints?: unknown[] }).expectedPoints ?? [];
        if (pts.length) withPoints += 1;
      }
    }
    expect(explain).toBe(33);
    expect(withPoints, "explain blocks carrying marking points a teacher could mark against").toBe(explain);
  });

  it("has no payload field that could carry the learner's prose", () => {
    /* If this ever fails, someone has added a way to transport the text — which
       is the first half of making these blocks markable. The other half is a
       teacher surface that reads it. */
    const carriers = [...ALLOWED_PAYLOAD_KEYS].filter((k) =>
      /answer|response|text|prose|explanation|content(?!_len)/i.test(k),
    );
    expect(
      carriers,
      "a payload key now exists that could carry an explain response — see docs/curriculum/HUMAN_REVIEW_WORKLOAD.md",
    ).toEqual([]);
  });

  it("does not make progression wait for a review that cannot happen", async () => {
    /* The one thing that makes the current state survivable: an unread
       explanation does not trap the learner. `unknown` reaches `answered`,
       which meets `attemptFloor`. Asserted so that a future policy change
       cannot start gating on a review nobody can perform. */
    const { LESSON_COMPLETION_POLICY, meets, levelFromVerdict, requirementFor } = await import(
      "@schools/policies/completion"
    );
    expect(meets(levelFromVerdict("unmeasured"), LESSON_COMPLETION_POLICY.attemptFloor)).toBe(true);
    /* And an `explain` block asks no more than any other attempt block. */
    expect(
      requirementFor(LESSON_COMPLETION_POLICY, {
        id: "x", type: "explain", machineGradable: false, isAttempt: true, optional: false,
      }),
    ).toBe(LESSON_COMPLETION_POLICY.attemptFloor);
  });
});
