import { describe, expect, it } from "vitest";
import {
  capabilityFor,
  CAPABILITY_PROMPT_HEADING,
  extractConstructs,
  shownCode,
  teachingOrder,
} from "@schools/curriculum/capability";
import {
  cpp17PositionOf,
  cpp17PromptLines,
  SEPTEMBER_SEQUENCE,
  septemberTaughtBy,
} from "@schools/nova/cpp17";
import { MONTHS } from "@schools/curriculum/months";

/**
 * The prompt may not tell Nova a construct is both taught and not taught.
 *
 * ## What was measured
 *
 * The rendered system prompt for `m1.l4.b4` — «if и else», teaching position 6
 * — carried these two lines in the same message:
 *
 *   TAUGHT, use freely: … if, else, ==, >
 *   NOT TAUGHT YET this month: < <= > >= == !=; if and else; else if; && || !
 *
 * and, below both, "if the only fix you can see needs something untaught, you
 * have the wrong fix". So the tutor was told the lesson's own topic was off
 * limits on the lesson that teaches it. Eight of September's twelve teaching
 * positions contradicted themselves this way.
 *
 * ## Why it happened, and why one test would not have caught it
 *
 * The two lists came from different sources. `TAUGHT` is derived —
 * `capability.ts` walks the curriculum's own code in teaching order.
 * `NOT TAUGHT YET` came from a table transcribed by hand from the pedagogy
 * document, which numbers lessons the way the document does. September's units
 * were re-sequenced and the ids kept, so the real teaching order is
 * l1, l11, l2, l10, l3, l4, l5, l12, l6, l7, l8, l9 — and `m1.l4` is the sixth
 * lesson, not the fourth.
 *
 * A test of either list alone passes. The defect is in the RELATIONSHIP, which
 * is what this file asserts and nothing did.
 *
 * A previous commit claimed to have fixed exactly this by correcting a number.
 * The durable fix is that there is no number: both lists are now views of one
 * walk over the content.
 */


/**
 * Everything September's code has shown, cumulatively, by the end of each
 * teaching position.
 *
 * The comparison basis for a LESSON-granular claim. Built here rather than
 * exported from the module under test, so the test is not asserting the
 * implementation against itself.
 */
function shownByEndOfEachSeptemberLesson(): Map<number, Set<string>> {
  const position = new Map<string, number>();
  let n = 0;
  const september = MONTHS.find((m) => m.index === 1)!;
  for (const unit of september.units) for (const lesson of unit.lessons) position.set(lesson.id, ++n);

  const byLesson = new Map<number, Set<string>>();
  const cumulative = new Set<string>();
  for (let p = 1; p <= n; p += 1) {
    for (const entry of teachingOrder()) {
      if (entry.monthIndex !== 1) continue;
      if (position.get(entry.lessonId) !== p) continue;
      for (const code of shownCode(entry.block)) {
        for (const id of extractConstructs(code)) cumulative.add(id);
      }
    }
    byLesson.set(p, new Set(cumulative));
  }
  return byLesson;
}

/** Every block id in the programme, with its month. */
function allBlocks(): { blockId: string; monthIndex: number }[] {
  const out: { blockId: string; monthIndex: number }[] = [];
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) out.push({ blockId: block.id, monthIndex: month.index });
      }
    }
    for (const block of month.assessment?.blocks ?? []) {
      out.push({ blockId: block.id, monthIndex: month.index });
    }
  }
  return out;
}

describe("the two construct lists in one prompt", () => {
  const blocks = allBlocks();

  it("is looking at the whole programme", () => {
    /* The floor. Every assertion below iterates this list, so a walk that found
       nothing would report a clean run having checked nothing — which is the
       shape of the gate this file replaces. */
    expect(blocks.length).toBeGreaterThan(600);
    expect(blocks.filter((b) => b.monthIndex === 1).length).toBeGreaterThan(60);
    expect(new Set(blocks.map((b) => b.monthIndex)).size).toBe(9);
  });

  it("never withholds a construct the derived walk has already shown", () => {
    /*
     * The exact contradiction, checked on every block of every month against
     * the real derivation rather than against a fixture.
     *
     * `available` is what the capability walk says the learner has met by this
     * block. `notYet` is what `./cpp17` withholds. A construct in both is the
     * defect.
     */
    const offenders: string[] = [];
    for (const { blockId } of blocks) {
      const ctx = capabilityFor(blockId);
      if (!ctx) continue;
      const available = new Set(ctx.available.map((s) => s.id));
      const position = cpp17PositionOf(blockId);
      if (!position || position.month !== 1 || position.lesson === null) continue;

      for (const row of septemberTaughtBy(position.lesson).notYet) {
        for (const id of row.constructs) {
          if (available.has(id)) {
            offenders.push(`${blockId}: "${row.label}" is withheld but ${id} is already shown`);
          }
        }
      }
    }
    expect(offenders.slice(0, 12), offenders.join("\n")).toEqual([]);
  });

  it("never offers a construct the content has not shown by that lesson", () => {
    /*
     * The mirror, and the more dangerous direction: `TAUGHT, use freely` on a
     * construct the class has not met is Nova writing a `for` loop at a learner
     * who has never seen one.
     *
     * Compared against what the content has shown by the END of the lesson,
     * not by the individual block, because the declared list is lesson-granular
     * by construction — it answers "what may a learner at lesson N use". The
     * block-granular answer is `capabilityFor`, which is what production
     * renders; this list is only rendered when that walk is absent (the dev
     * lab, and prompts built by a test).
     *
     * The residual is stated rather than hidden: inside the lesson that
     * introduces a construct, this list offers it from the lesson's first block
     * while the derived one waits for the block that shows it. That gap is
     * bounded by one lesson, exists only where the derived walk is absent, and
     * closing it would mean giving this function a block id — which is the
     * derived walk, differently spelled.
     */
    const shownByLesson = shownByEndOfEachSeptemberLesson();
    const offenders: string[] = [];
    for (let lesson = 1; lesson <= 12; lesson += 1) {
      const known = shownByLesson.get(lesson)!;
      for (const row of septemberTaughtBy(lesson).write) {
        for (const id of row.constructs) {
          if (!known.has(id)) {
            offenders.push(`lesson ${lesson}: "${row.label}" is offered but ${id} is not shown yet`);
          }
        }
      }
    }
    expect(offenders.slice(0, 12), offenders.join("\n")).toEqual([]);
  });

  it("renders both lines without contradicting itself, on the block that used to", () => {
    /*
     * `m1.l4.b4`, verbatim, because that is the block the audit rendered and
     * quoted. Asserting on the rendered TEXT rather than on the data structures
     * keeps the check where the harm was: what the model actually reads.
     */
    const blockId = "m1.l4.b4";
    const position = cpp17PositionOf(blockId);
    expect(position?.month).toBe(1);
    expect(position?.lesson, "m1.l4 is the sixth lesson taught, not the fourth").toBe(6);

    const lines = cpp17PromptLines(position, "ru", { derivedInventoryPresent: true });
    const notYetLine = lines.find((l) => l.includes("NOT TAUGHT YET"));

    /* The lesson's own topic must not be in it. */
    if (notYetLine) {
      expect(notYetLine, "the tutor is refused the lesson's own topic").not.toContain(
        "if and else",
      );
    }

    /* And the derived block, which is what states TAUGHT in production, does
       contain it. */
    const ctx = capabilityFor(blockId);
    expect(ctx, "m1.l4.b4 must be in the capability walk").not.toBeNull();
    const available = new Set(ctx!.available.map((s) => s.id));
    expect(available.has("stmt.if"), "the walk should have shown `if` by here").toBe(true);
    expect(available.has("stmt.else")).toBe(true);
  });

  it("keeps the withheld list honest about what it cannot see", () => {
    /* `var.double` is taught in prose and never in a code field, so the walk
       cannot place it. It must therefore appear in NO list — claiming it taught
       invites Nova to write it, claiming it untaught refuses the lesson that
       teaches it. */
    const row = SEPTEMBER_SEQUENCE.find((c) => c.id === "var.double");
    expect(row?.constructs, "an unseeable row declares no constructs").toEqual([]);
    for (let lesson = 1; lesson <= 12; lesson += 1) {
      const r = septemberTaughtBy(lesson);
      const named = [...r.write, ...r.given, ...r.notYet].map((c) => c.id);
      expect(named).not.toContain("var.double");
    }
  });

  it("still renders a capability heading, so the derived half is really there", () => {
    /* If `CAPABILITY_PROMPT_HEADING` ever stopped being rendered, the
       cross-check above would be comparing the withheld list against nothing
       and would pass by vacuity. */
    expect(CAPABILITY_PROMPT_HEADING.length).toBeGreaterThan(10);
    expect(capabilityFor("m1.l4.b4")?.available.length ?? 0).toBeGreaterThan(3);
  });
});
