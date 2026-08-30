import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { publicLesson } from "@schools/curriculum/public";
import { isPublicAttemptBlock } from "@schools/learning/checking";
import { footerMode } from "@/components/brilliant/lesson/lesson-verdict";
import {
  LESSON_COMPLETION_POLICY,
  evaluateCompletion,
  policyBlocksFromPublic,
} from "@schools/policies/completion";
import type { TrackLevel } from "@schools/curriculum/types";

/**
 * The policy said optional; the interface said no.
 *
 * `bank-is-optional.test.ts` proves `requirementFor` exempts a bank task, and
 * that was never the rule a learner met. The footer showed one button on an
 * unchecked attempt block — Check, disabled until an answer was typed — and the
 * top bar's forward arrow is permanently off. So the only way past ANY attempt
 * block was to answer it, and every one of the 29 lesson/route pairs holding an
 * optional task was impassable for a learner who declined it. Nine of those sat
 * on the last page, where `decision.satisfied` was already true, the server
 * would have accepted the completion, and the Finish button was never rendered
 * because `footerMode` cannot return `advance` for an unchecked attempt.
 *
 * That is the shape of failure this file exists for: a guarantee asserted at the
 * layer that defines it and contradicted at the layer that enforces it. Testing
 * `requirementFor` could not have caught it, because `requirementFor` was right.
 *
 * So this walks the pages the way the player does, using the real projection,
 * the real attempt predicate and the real `footerMode`, and asks the only
 * question that matters: can a learner who does every required task and declines
 * every optional one reach the end?
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

interface Walk {
  lesson: string;
  track: TrackLevel;
  stuckAt: string | null;
  completes: boolean;
}

/** One learner, one lesson: answer everything required, decline everything else. */
function walkDecliningOptional(lessonId: string, track: TrackLevel): Walk | null {
  const month = MONTHS.find((m) => m.units.some((u) => u.lessons.some((l) => l.id === lessonId)));
  const lesson = month?.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId);
  if (!lesson) return null;

  const pub = publicLesson(lesson, track);
  const verdicts = new Map<string, "unchecked" | "correct">();

  for (const b of pub.blocks) {
    if (!isPublicAttemptBlock(b)) continue;
    verdicts.set(b.id, b.optional === true ? "unchecked" : "correct");
  }

  for (const b of pub.blocks) {
    const attempt = isPublicAttemptBlock(b);
    const v = verdicts.get(b.id) ?? "unchecked";
    const mode = footerMode(v, attempt, b.optional === true);
    /* The modes that put a forward control on screen. `check` does not: its one
       button submits an answer the learner has declined to give. */
    const canMoveOn =
      mode === "advance" || mode === "celebrate" || mode === "check-optional" || mode === "retry-optional";
    if (!canMoveOn) return { lesson: lessonId, track, stuckAt: b.id, completes: false };
  }

  /* Reaching the last page is not finishing — `advance()` defers to the policy,
     and so does this. */
  const decision = evaluateCompletion({
    policy: LESSON_COMPLETION_POLICY,
    blocks: policyBlocksFromPublic(pub.blocks),
    reached: (id) => (verdicts.get(id) === "correct" ? "passed" : "none"),
  });
  return { lesson: lessonId, track, stuckAt: null, completes: decision.satisfied };
}

const WITH_BANK = MONTHS.flatMap((m) =>
  m.units.flatMap((u) => u.lessons.filter((l) => l.blocks.some((b) => b.bank)).map((l) => l.id)),
);

describe("a learner who declines every optional task still finishes the lesson", () => {
  it("has lessons containing optional tasks to walk", () => {
    expect(WITH_BANK.length).toBeGreaterThan(5);
  });

  for (const lessonId of WITH_BANK) {
    for (const track of TRACKS) {
      it(`${lessonId} · ${track}`, () => {
        const w = walkDecliningOptional(lessonId, track);
        expect(w, `${lessonId} not found`).not.toBeNull();
        expect(
          w!.stuckAt,
          `${lessonId} [${track}] cannot advance past ${w!.stuckAt}, which the curriculum marks optional`,
        ).toBeNull();
        expect(
          w!.completes,
          `${lessonId} [${track}] reaches the end but the policy refuses to complete it`,
        ).toBe(true);
      });
    }
  }
});

describe("the footer offers a way past an optional task and only an optional task", () => {
  it("gives an unchecked REQUIRED attempt block no forward control", () => {
    /* The inverse, and the one that matters most: a change making everything
       skippable would satisfy every assertion above and delete the curriculum's
       requirements. */
    expect(footerMode("unchecked", true, false)).toBe("check");
  });

  it("gives an unchecked OPTIONAL attempt block both a check and a way past", () => {
    expect(footerMode("unchecked", true, true)).toBe("check-optional");
  });

  it("keeps an optional task optional after a WRONG answer", () => {
    /* This used to assert the opposite, deliberately and wrongly: `optional`
       was consulted only on `unchecked`, so a learner who TRIED a bank task and
       got it wrong lost the way past it. The reward for attempting optional
       work was being trapped by it. */
    expect(footerMode("wrong", true, true)).toBe("retry-optional");
    expect(footerMode("partial", true, true)).toBe("retry-optional");
    expect(footerMode("wrong", true, false)).toBe("retry");
    expect(footerMode("partial", true, false)).toBe("retry");
  });

  it("leaves the settled verdicts alone whether optional or not", () => {
    for (const optional of [false, true]) {
      expect(footerMode("correct", true, optional)).toBe("celebrate");
      expect(footerMode("unmeasured", true, optional)).toBe("advance");
      expect(footerMode("unchecked", false, optional)).toBe("advance");
    }
  });
});
