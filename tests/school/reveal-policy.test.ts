import { describe, expect, it } from "vitest";
import { ATTEMPTS_BEFORE_REVEAL, justificationFor, revealFor } from "../../schools/learning/reveal";
import { MONTHS } from "../../schools/curriculum/months";
import { publicBlock } from "../../schools/curriculum/public";
import type { LessonBlock } from "../../schools/curriculum/types";

/**
 * When an answer may be shown.
 *
 * ## What this replaces
 *
 * The answer keys used to be in the browser, and nine of the fourteen block
 * views painted one back the instant a verdict arrived: the correct option went
 * green, the fill-blank printed "map, split", the bug hunt printed the repaired
 * program, the trace printed the expected cell values. The footer then offered
 * "Try again" on a question that could no longer be failed, so guessing once
 * and copying was strictly faster than thinking.
 *
 * The programme forbids that in as many words (PDF p.4): «шешім идеясы бірнеше
 * әрекеттен соң ғана ашылады. Дайын жауап берілмейді».
 *
 * These tests are the enforcement. They are deliberately written against the
 * POLICY function rather than the UI, because the UI can no longer reveal
 * anything on its own — it has nothing to reveal with.
 */

const ALL: { where: string; block: LessonBlock }[] = MONTHS.flatMap((m) => [
  ...m.units.flatMap((u) =>
    u.lessons.flatMap((l) => l.blocks.map((block) => ({ where: l.id, block }))),
  ),
  ...(m.assessment?.blocks ?? []).map((block) => ({ where: m.assessment!.id, block })),
]);

const KEYED = ALL.filter(({ block }) =>
  ["prediction", "multiple_choice", "fill_blank", "find_bug", "trace_code", "test_case"].includes(
    block.type,
  ),
);

describe("a first wrong answer reveals nothing", () => {
  it("has keyed blocks to check", () => {
    expect(KEYED.length).toBeGreaterThan(5);
  });

  for (const { where, block } of KEYED) {
    it(`${block.id} (${where})`, () => {
      const first = revealFor({ block, verdict: "wrong", failedAttempts: 1 });
      expect(first, `${block.id} gave the answer away on the first attempt`).toBeUndefined();

      const second = revealFor({ block, verdict: "wrong", failedAttempts: 2 });
      expect(second, `${block.id} gave the answer away on the second attempt`).toBeUndefined();
    });
  }
});

describe("the answer opens once the learner has genuinely persisted", () => {
  for (const { where, block } of KEYED) {
    it(`${block.id} (${where})`, () => {
      const opened = revealFor({
        block,
        verdict: "wrong",
        failedAttempts: ATTEMPTS_BEFORE_REVEAL,
      });
      expect(
        opened,
        `${block.id} never opens — a learner stuck at three attempts is left with nothing`,
      ).toBeDefined();
    });
  }

  it("three attempts, not two: two is a guess plus a correction", () => {
    expect(ATTEMPTS_BEFORE_REVEAL).toBe(3);
  });
});

describe("code tasks are never revealed at all", () => {
  const code = ALL.filter(({ block }) =>
    ["write_code", "modify_code", "challenge"].includes(block.type),
  );

  it("has code tasks to check", () => {
    expect(code.length).toBeGreaterThan(10);
  });

  for (const { where, block } of code) {
    it(`${block.id} (${where}) withholds its reference solution forever`, () => {
      for (const attempts of [1, 3, 10, 99]) {
        const r = revealFor({ block, verdict: "wrong", failedAttempts: attempts });
        expect(r?.code, `${block.id} handed over a reference solution`).toBeUndefined();
        expect(r?.text, `${block.id} handed over solution text`).toBeUndefined();
      }
    });
  }
});

describe("marking points are shown for work no machine scores", () => {
  const written = ALL.filter(
    ({ block }) =>
      block.type === "explain" || (block.type === "verify" && block.mode === "oral_explanation"),
  );

  it("has written blocks to check", () => {
    expect(written.length).toBeGreaterThan(0);
  });

  for (const { where, block } of written) {
    it(`${block.id} (${where}) shows what the teacher looks for`, () => {
      /* These settle as `unknown` — nothing measured them — and that is exactly
         when comparing your own words against the criteria is the learning. */
      const r = revealFor({ block, verdict: "unknown", failedAttempts: 0 });
      expect(r?.points?.length, `${block.id} has no marking points to show`).toBeGreaterThan(0);
    });
  }
});

describe("the reveal is the only route by which an answer can reach the browser", () => {
  for (const { where, block } of KEYED) {
    it(`${block.id} (${where}) ships no key in its own payload`, () => {
      const pub = JSON.stringify(publicBlock(block));
      switch (block.type) {
        case "prediction":
          expect(pub).not.toContain(`"answer"`);
          break;
        case "multiple_choice":
          expect(pub).not.toContain('"correctOptionId"');
          break;
        case "fill_blank":
          for (const b of block.blanks) expect(pub).not.toContain(`"${b.answer}"`);
          break;
        case "find_bug":
          expect(pub).not.toContain(`"fixedCode"`);
          expect(pub).not.toContain(`"buggyLine"`);
          break;
        case "test_case":
          expect(pub).not.toContain(`"breakingInputs"`);
          break;
        case "trace_code":
          for (const step of block.steps) {
            for (const v of Object.values(step.vars)) {
              // Variable NAMES survive; their values must not.
              expect(pub).not.toContain(`:"${v}"`);
            }
          }
          break;
      }
    });
  }
});

describe("the author's explanation of a wrong answer is retrievable", () => {
  const mapped = ALL.filter(({ block }) => block.diagnosticMapping);

  it("September authored diagnostic explanations", () => {
    expect(mapped.length).toBeGreaterThan(4);
  });

  for (const { where, block } of mapped) {
    it(`${block.id} (${where}) explains each mapped wrong answer`, () => {
      for (const key of Object.keys(block.diagnosticMapping!)) {
        const why = justificationFor(block, key);
        expect(why, `${block.id}: no explanation for the mapped answer ${key}`).toBeTruthy();
        expect(why!.length).toBeGreaterThan(20);
      }
    });
  }

  it("invents nothing where the author declared nothing", () => {
    for (const { block } of ALL) {
      // An answer nobody mapped must produce no explanation at all — the system
      // says "we do not know why" rather than guessing about a child.
      expect(justificationFor(block, "___an answer nobody mapped___")).toBeUndefined();
      expect(justificationFor(block, undefined)).toBeUndefined();
    }
  });
});
