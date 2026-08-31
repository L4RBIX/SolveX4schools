import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { blocksForTrack, publicBlock, publicLesson } from "@schools/curriculum/public";
import { findBlock } from "@schools/learning/grade";
import {
  LESSON_COMPLETION_POLICY,
  evaluateCompletion,
  policyBlocksFromAuthored,
  policyBlocksFromPublic,
  requirementFor,
} from "@schools/policies/completion";
import { isTask } from "@schools/curriculum/inventory";
import type { LessonBlock, Lesson, Month } from "@schools/curriculum/types";

/**
 * The bank is optional, or it is a label.
 *
 * The curriculum separates a required core from a bank of extra practice,
 * review and extension. For most of this field's life that separation existed
 * only in three reporting scripts: they subtracted bank tasks from their totals
 * while `requirementFor` went on demanding every one of them, because
 * `PolicyBlock` had no way to know. So October's measured workload did not fall
 * when ten of its tasks were reclassified — nothing about October had changed.
 * A task bank every learner must finish is not a task bank.
 *
 * This file is the guarantee that it stays real, and it asserts in both
 * directions: a banked task is not required, and an unbanked one still is. The
 * second half matters more than it looks. A bug that made everything optional
 * would satisfy every assertion about the bank and quietly delete the
 * curriculum's requirements.
 *
 * The privacy half is here for the same reason. `bank.why` is editorial prose
 * written for whoever maintains this curriculum, and it names the sibling tasks
 * that already carry the evidence — which is a map of where to find an
 * equivalent answer. One boolean crosses to the browser; the reasoning does
 * not.
 */

interface Located {
  block: LessonBlock;
  lesson: Lesson;
  month: Month;
}

/* Assessment blocks are walked too. None carries `bank` today, so the checks
   over them pass vacuously — but the monthly check is the one place a leak
   would matter most, and a set that silently excludes it reports success over
   whatever happens to be left. The same argument payload-privacy makes. */
const ALL: Located[] = MONTHS.flatMap((month) => [
  ...month.units.flatMap((unit) =>
    unit.lessons.flatMap((lesson) => lesson.blocks.map((block) => ({ block, lesson, month }))),
  ),
  ...(month.assessment
    ? month.assessment.blocks.map((block) => ({
        block,
        lesson: { ...month.assessment!, blocks: month.assessment!.blocks } as unknown as Lesson,
        month,
      }))
    : []),
]);

const BANKED = ALL.filter((e) => e.block.bank);
const REQUIRED = ALL.filter((e) => !e.block.bank && isTask(e.block));

describe("the bank is a real exemption", () => {
  it("has banked tasks to reason about", () => {
    /* If this ever reaches zero the rest of the file passes vacuously, which is
       the failure mode where a test suite reports success over an empty set. */
    expect(BANKED.length).toBeGreaterThan(0);
    expect(REQUIRED.length).toBeGreaterThan(100);
  });

  it("asks nothing of a banked task", () => {
    for (const { block } of BANKED) {
      const [policyBlock] = policyBlocksFromAuthored([block]);
      expect(
        requirementFor(LESSON_COMPLETION_POLICY, policyBlock),
        `${block.id} is in the bank but the policy still demands it`,
      ).toBe("none");
    }
  });

  it("still asks for every task that is not banked", () => {
    for (const { block } of REQUIRED) {
      const [policyBlock] = policyBlocksFromAuthored([block]);
      expect(
        requirementFor(LESSON_COMPLETION_POLICY, policyBlock),
        `${block.id} is core but the policy asks nothing of it`,
      ).not.toBe("none");
    }
  });

  it("lets a lesson complete when only its banked tasks are untouched", () => {
    /* The behaviour a learner meets, on the real lessons that have a bank.
       `reached: none` for banked blocks and a full verdict for everything else
       is exactly the learner who did the required path and stopped. */
    const lessons = [...new Set(BANKED.map((e) => e.lesson))];
    expect(lessons.length).toBeGreaterThan(0);

    for (const lesson of lessons) {
      const banked = new Set(lesson.blocks.filter((b) => b.bank).map((b) => b.id));
      const decision = evaluateCompletion({
        policy: LESSON_COMPLETION_POLICY,
        blocks: policyBlocksFromAuthored(lesson.blocks),
        reached: (id) => (banked.has(id) ? "none" : "passed"),
      });
      expect(
        decision.satisfied,
        `${lesson.id} will not complete for a learner who skipped only its bank: ` +
          `outstanding ${decision.outstanding.map((o) => o.blockId).join(", ")}`,
      ).toBe(true);
    }
  });

  it("does not complete a lesson when a CORE task is untouched", () => {
    /* The inverse. Without this, a policy that returned "none" for everything
       would pass every assertion above. */
    const lessons = [...new Set(BANKED.map((e) => e.lesson))];
    for (const lesson of lessons) {
      const firstCore = lesson.blocks.find((b) => !b.bank && isTask(b));
      if (!firstCore) continue;
      const decision = evaluateCompletion({
        policy: LESSON_COMPLETION_POLICY,
        blocks: policyBlocksFromAuthored(lesson.blocks),
        reached: (id) => (id === firstCore.id ? "none" : "passed"),
      });
      expect(
        decision.outstanding.map((o) => o.blockId),
        `${lesson.id} completed with core task ${firstCore.id} untouched`,
      ).toContain(firstCore.id);
    }
  });

  it("agrees about optionality on the server and in the browser", () => {
    /* Two adapters build `PolicyBlock`: one from the authored block on the
       server, one from the projection in the browser. A learner who is told the
       lesson is finished and then refused by the server is the worst outcome
       available here, so the two must not be able to disagree. */
    /* Compared through `blocksForTrack`, because that is what both sides
       actually run — the lesson page projects with the learner's route and
       `/api/learning/complete` filters by the same cookie. Comparing the
       unfiltered lists asserted a pairing neither caller performs.

       And over EVERY lesson, not only those that already have a bank: a bug
       marking core blocks optional in one adapter and not the other would have
       been invisible to a loop that only visits lessons with bank tasks. */
    const everyLesson = MONTHS.flatMap((m) => m.units.flatMap((u) => u.lessons));
    expect(everyLesson.length).toBeGreaterThan(50);

    for (const track of ["support", "core", "advanced"] as const) {
      for (const lesson of everyLesson) {
        const routed = blocksForTrack(lesson.blocks, track);
        const server = policyBlocksFromAuthored(routed);
        const browser = policyBlocksFromPublic(publicLesson(lesson, track).blocks);
        expect(
          browser.map((b) => `${b.id}:${b.optional}`),
          `${lesson.id} [${track}] — the server and the browser disagree about what is optional`,
        ).toEqual(server.map((b) => `${b.id}:${b.optional}`));
      }
    }
  });
});

describe("the reasoning stays on the server", () => {
  it("sends `optional` and nothing else about bank membership", () => {
    for (const { block } of BANKED) {
      const projected = publicBlock(block) as unknown as Record<string, unknown>;
      expect(projected.optional, `${block.id} crossed without its exemption`).toBe(true);
      expect(projected.bank, `${block.id} carried its bank membership to the browser`).toBeUndefined();

      const wire = JSON.stringify(projected);
      expect(wire, `${block.id} leaked its bank role`).not.toContain(block.bank!.role);
      /* The justification names sibling block ids — a map to an equivalent
         answer — so a substring of it in the payload is a leak, not a nit. */
      const fragment = block.bank!.why.trim().slice(0, 40);
      expect(wire, `${block.id} leaked its bank justification`).not.toContain(fragment);
    }
  });

  it("marks nothing else optional", () => {
    for (const { block } of ALL) {
      if (block.bank) continue;
      const projected = publicBlock(block) as unknown as Record<string, unknown>;
      expect(projected.optional, `${block.id} is core but projects as optional`).toBeUndefined();
    }
  });

  it("keeps a banked task addressable by its own id", () => {
    /* Optional is not hidden. A learner who wants more practice, or a teacher
       assigning it, reaches these tasks the same way as any other — and a
       review can route to one. If the projection dropped them the bank would be
       unreachable rather than optional. */
    for (const { block, lesson } of BANKED) {
      /* `findBlock` is what the review route resolves a block id with, so this
         is the same lookup a scheduled review performs. */
      expect(findBlock(block.id), `${block.id} is not addressable`).not.toBeNull();
      const visible = publicLesson(lesson, "core")
        .blocks.map((b) => b.id)
        .concat(publicLesson(lesson, "advanced").blocks.map((b) => b.id))
        .concat(publicLesson(lesson, "support").blocks.map((b) => b.id));
      expect(visible, `${block.id} is reachable on no route`).toContain(block.id);
    }
  });
});

describe("bank membership is authored, not assumed", () => {
  it("marks only tasks", () => {
    for (const { block } of BANKED) {
      expect(isTask(block), `${block.id} is a ${block.type}, which the learner does not attempt`).toBe(
        true,
      );
    }
  });

  it("names the tasks that make the banked one spare", () => {
    /* `extension` is exempt: a task beyond the month's outcomes is justified by
       what it needs, not by what already covers it. */
    for (const { block } of BANKED) {
      const bank = block.bank!;
      expect(bank.why.trim().length, `${block.id} has a thin justification`).toBeGreaterThanOrEqual(40);
      if (bank.role === "extension") continue;
      expect(
        bank.why,
        `${block.id} is banked as "${bank.role}" but names no task that already covers it`,
      ).toMatch(/\bm\d+\.[a-z]\d+/);
    }
  });

  it("never names a task that arrives later", () => {
    /* A task cannot be made spare by one the learner has not met yet. The ids a
       justification cites must exist and must not come after it in the year. */
    const order = new Map<string, number>();
    ALL.forEach(({ block }, i) => order.set(block.id, i));

    for (const { block } of BANKED) {
      const cited = [...block.bank!.why.matchAll(/\bm\d+\.[a-z]\d+(?:\.[a-z]\d+)?[a-z]?\b/g)].map(
        (m) => m[0],
      );
      for (const id of cited) {
        const at = order.get(id);
        if (at === undefined) continue; // a lesson id, not a block id
        /* Self-citation is its own failure and deserves its own sentence: a
           justification that names the task it is attached to has argued that
           the task makes itself spare, which is not an argument. */
        expect(id, `${block.id} cites itself as the evidence it is spare`).not.toBe(block.id);
        expect(at, `${block.id} cites ${id}, which the learner meets later`).toBeLessThan(
          order.get(block.id)!,
        );
      }
    }
  });
});
