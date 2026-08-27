import { describe, it, expect } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { capabilityFor } from "@schools/curriculum/capability";
import { buildSystemPrompt } from "@schools/nova/prompt";
import type { LessonBlock, Locale } from "@schools/curriculum/types";

const SEPT = MONTHS[0];

function septBlocks(): { lessonTitle: string; block: LessonBlock }[] {
  const out: { lessonTitle: string; block: LessonBlock }[] = [];
  for (const u of SEPT.units) for (const l of u.lessons) for (const b of l.blocks) out.push({ lessonTitle: l.title.kk, block: b });
  for (const b of SEPT.assessment?.blocks ?? []) out.push({ lessonTitle: SEPT.assessment!.title.kk, block: b });
  return out;
}

describe("probe", () => {
  it("measures", async () => {
    let max = 0; let maxId = ""; let maxLevel = -1;
    for (const { lessonTitle, block } of septBlocks()) {
      for (const level of [0, 1, 2, 3, 4]) {
        for (const locale of ["kk", "ru"] as Locale[]) {
          const grant = { requested: 4, granted: level, capped: false, reason: "granted_as_requested" as const, explanation: null, mayIncludeCode: true, mustNotSay: ["x"] };
          const sys = buildSystemPrompt({
            locale, monthTitle: SEPT.title[locale], lessonTitle,
            blockPrompt: "prompt" in block ? (block as unknown as { prompt: Record<Locale, string> }).prompt[locale] : lessonTitle,
            blockCode: "code" in block && typeof (block as unknown as { code?: string }).code === "string" ? (block as unknown as { code: string }).code : undefined,
            skills: block.skillRefs, capability: capabilityFor(block.id), directive: {
              mode: "REMEDIATE", mayNameMisconception: true, namedMisconception: "off_by_one",
              maxHintLevel: 4, mayIncludeCode: true, mustNotSay: ["a", "b"], opening: "Let us look at this together.",
            } as never, grant, briefOffTopic: true,
          }, "0".repeat(32));
          if (sys.length > max) { max = sys.length; maxId = block.id; maxLevel = level; }
        }
      }
    }
    const { writeFileSync } = await import("node:fs");
    writeFileSync("/private/tmp/claude-501/-Users-kydyrbekbekarys-SolveX4schools/732fc53f-63d4-4a5b-8c47-53c63b166097/scratchpad/probe2.json", JSON.stringify({ max, maxId, maxLevel }, null, 1));
    expect(true).toBe(true);
  });
});
