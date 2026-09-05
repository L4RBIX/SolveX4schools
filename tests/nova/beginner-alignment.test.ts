import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { grantHintLevel } from "@solvex/nova-core";
import { buildSystemPrompt } from "@schools/nova/prompt";
import { capabilityFor } from "@schools/curriculum/capability";
import { cpp17PositionOf, septemberTaughtBy } from "@schools/nova/cpp17";

/**
 * Nova has to be in the same room as a beginner.
 *
 * September now opens on two lessons that teach the model rather than the
 * syntax, hands the learner a frame in every task up to `m1.l7`, and announces
 * the hand-over when it stops. A tutor that does not know any of that gives
 * advice that is worse than silence: "начни с `#include <iostream>`" to a
 * learner looking at exactly that line teaches them the screen is not real.
 *
 * Every assertion here is about what the model is TOLD. What it then says is
 * the provider's business; what we control is whether the instruction was
 * present, and that is what a regression test can hold.
 */

const september = MONTHS.find((m) => m.index === 1)!;
const lessons = september.units.flatMap((u) => u.lessons);
const lessonOf = (blockId: string) =>
  lessons.find((l) => l.blocks.some((b) => b.id === blockId))!;

/**
 * The system prompt as the hint route builds it.
 *
 * `blockId` is what the production route passes; the derived capability and the
 * September position are then read from it inside `buildSystemPrompt`, exactly
 * as they are in `src/app/api/nova/hint/route.ts`. The only things supplied
 * here are the ones the route reads off the block — the code on screen, and
 * whether that code is the frame.
 */
const grant = grantHintLevel({
  requested: 2,
  lastGranted: 1,
  hasAttemptSinceLastHint: true,
  hasAttempted: true,
  directive: null,
  learnerOverride: false,
});

function promptFor(blockId: string): string {
  const lesson = lessonOf(blockId);
  const block = lesson.blocks.find((b) => b.id === blockId)! as unknown as {
    prompt?: { ru: string };
    starter?: string;
    code?: string;
    skillRefs?: string[];
  };
  return buildSystemPrompt({
    locale: "ru",
    monthTitle: september.title.ru,
    lessonTitle: lesson.title.ru,
    blockPrompt: block.prompt?.ru ?? lesson.title.ru,
    blockId,
    blockCode: block.starter ?? block.code,
    starterProvided: (block.starter ?? "").includes("int main"),
    skills: block.skillRefs ?? [],
    directive: null,
    grant,
  });
}

describe("the tutor knows what is already on the learner's screen", () => {
  it("is shown the starter frame on a scaffolded task", () => {
    /* `m1.l1.b5` — the first program the learner writes — ships the frame with
       a comment where their work goes. The tutor sees the same thing they do. */
    const prompt = promptFor("m1.l1.b5");
    expect(prompt).toContain("#include <iostream>");
    expect(prompt).toContain("int main()");
  });

  it("is forbidden from asking for the frame while the frame is given", () => {
    const prompt = promptFor("m1.l1.b5");
    expect(prompt).toContain("ALREADY in their");
    expect(prompt).toMatch(/Never ask them to write it/);
  });

  it("is not told the frame is given on a task where it is not", () => {
    /* After the hand-over the learner really does write it, and the tutor has
       to be able to say so. `m1.l7.b4` is the first core task with no frame. */
    const prompt = promptFor("m1.l7.b4");
    expect(prompt).not.toContain("ALREADY in their");
  });
});

describe("the tutor knows which button the learner pressed", () => {
  it("is told what Run does and what Check does", () => {
    const prompt = promptFor("m1.l1.b5");
    expect(prompt).toContain("RUN compiles and runs their program in their own");
    /* The sentence wraps across prompt lines, so the assertion is on the phrase
       that carries the meaning rather than on a line break. */
    expect(prompt).toContain("CHECK sends the solution to the");
    expect(prompt).toContain("judge, which runs every test of the task including hidden ones");
    /* And that a Run is not a mark. This is the misreading the whole two-button
       design is exposed to. */
    expect(prompt).toMatch(/[Nn]ever call a Run result a verdict/);
  });
});

describe("the tutor's idea of what has been taught follows the new order", () => {
  it("knows the beginner lessons come first", () => {
    expect(lessons[0]!.id).toBe("m1.l0");
    expect(cpp17PositionOf("m1.l0.b1")?.lesson).toBe(1);
    expect(cpp17PositionOf("m1.l13.b1")?.lesson).toBe(3);
  });

  it("does not withhold a construct the learner has already met", () => {
    /*
     * The C8 invariant, re-checked against the NEW order. A single walk feeds
     * both lists, so this cannot be satisfied by editing a table — but the
     * order changed underneath it, and that is exactly when a derivation is
     * worth re-running.
     */
    const offenders: string[] = [];
    for (const lesson of lessons) {
      for (const block of lesson.blocks) {
        const ctx = capabilityFor(block.id);
        const position = cpp17PositionOf(block.id);
        if (!ctx || !position || position.month !== 1 || position.lesson === null) continue;
        const available = new Set(ctx.available.map((s) => s.id));
        for (const row of septemberTaughtBy(position.lesson).notYet) {
          for (const id of row.constructs) {
            if (available.has(id)) offenders.push(`${block.id}: ${id} withheld but already shown`);
          }
        }
      }
    }
    expect(offenders.slice(0, 10), offenders.join("\n")).toEqual([]);
  });

  it("counts September's lessons rather than assuming twelve", () => {
    /* The prompt names "lesson N of M". M was the literal 12 and September now
       has fourteen lessons; a tutor told a practice task sits at lesson 12 of
       12 would refuse to mention two lessons of material the task needs. */
    const prompt = promptFor("m1.l3.b1");
    expect(prompt).toContain(`of ${lessons.length}`);
    expect(prompt).not.toContain("of 12.");
  });
});
