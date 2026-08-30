import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { ALLOWED_PAYLOAD_KEYS } from "@solvex/learning-contracts";

/**
 * The written-explanation channel: what is true about the curriculum, not about
 * one worktree.
 *
 * An earlier version of this file was called `explain-blocks-are-unreadable`
 * and asserted that nothing could persist a learner's prose. That was true of
 * THIS worktree and false of the product — the integrated workstream persists
 * written responses (`learning_submissions.answer`, migration 0021) and lets a
 * teacher mark them (`human_reviews`, 0022). Asserting the absence of a feature
 * that exists on another branch is how a test becomes an argument for not
 * building something.
 *
 * What remains worth pinning are two curriculum facts that no migration
 * changes:
 *
 *   - 33 blocks carry authored marking points, so the rubric exists;
 *   - progression does not wait for any of them, so an unread explanation never
 *     traps a learner — and a future policy change must not start gating on a
 *     review, because "must a teacher read this" is answered per block in
 *     `docs/curriculum/EXPLAIN_REVIEW_NECESSITY.md` and the answer is not
 *     "always".
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

  it("keeps prose out of the EVENT payload, whatever the submission store holds", () => {
    /* Two different questions, and only this one is about the ledger. A
       learner's words may be persisted as a submission — they are, upstream —
       and must still not travel inside a `learning_events` payload, where they
       would reach the reducer, the teacher's signals and every replay. The
       payload contract carries `content_len` and `contains_code`: facts ABOUT
       the prose, never the prose. */
    const carriers = [...ALLOWED_PAYLOAD_KEYS].filter((k) =>
      /answer|response|text|prose|explanation|content(?!_len)/i.test(k),
    );
    expect(
      carriers,
      "a learning-event payload key now exists that could carry an explain response — " +
        "the submission store is the right home for it, the event ledger is not",
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
