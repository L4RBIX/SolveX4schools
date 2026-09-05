import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import type { Lesson, LessonBlock } from "@schools/curriculum/types";

/**
 * September has to work for a fourteen-year-old who has never programmed.
 *
 * ## What the month used to open with
 *
 * `#include <iostream>` on the first screen, under a sentence that said, in
 * both languages, *«Строки вокруг пока прими как данность»* — take the
 * surrounding lines on faith — followed by *«Пока просто пиши эти четыре
 * строки всегда одинаково»*: just write these four lines the same way every
 * time. `using namespace std;` was never explained anywhere in the month.
 *
 * So the first thing computer science said to a beginner was: copy this ritual
 * and do not ask what it means. Everything after it — a compiler error naming
 * a line inside that ritual, a task asking them to reproduce it from memory —
 * lands on a learner who was told not to understand it.
 *
 * ## What this file holds
 *
 * The teaching ORDER, which is the part that cannot be checked by reading one
 * lesson. Each rule below is a prerequisite: a construct may not be required
 * before the month has explained it, and the scaffold may not be taken away
 * before the month has said it is being taken away.
 */

const september = MONTHS.find((m) => m.index === 1)!;
const lessons: Lesson[] = september.units.flatMap((u) => u.lessons);
const position = new Map(lessons.map((l, i) => [l.id, i + 1]));
const at = (id: string): number => {
  const p = position.get(id);
  expect(p, `${id} must exist in September`).toBeDefined();
  return p!;
};

/** Every string of code the month SHOWS by the end of a given position. */
function shownBy(pos: number): string {
  const parts: string[] = [];
  for (const lesson of lessons.slice(0, pos)) {
    for (const b of lesson.blocks as unknown as Record<string, unknown>[]) {
      for (const key of ["code", "starter", "referenceSolution", "template"]) {
        const v = b[key];
        if (typeof v === "string") parts.push(v);
      }
      const body = b.body as { kk?: string; ru?: string } | undefined;
      if (body?.ru) parts.push(body.ru);
      if (body?.kk) parts.push(body.kk);
      const title = b.title as { kk?: string; ru?: string } | undefined;
      if (title?.ru) parts.push(title.ru);
    }
  }
  return parts.join("\n");
}

describe("the month opens on the model, not on the syntax", () => {
  it("teaches what a program is before showing a program to write", () => {
    /* l0 exists, is first, and asks for no code. A learner meets the idea of an
       instruction sequence before they meet a semicolon. */
    expect(lessons[0]!.id).toBe("m1.l0");
    const kinds = new Set(lessons[0]!.blocks.map((b) => b.type));
    expect(kinds.has("concept")).toBe(true);
    expect(kinds.has("write_code"), "the first lesson asks for no code").toBe(false);
  });

  it("explains the compiler, and the three ways a program can be wrong", () => {
    const l0 = lessons[0]!;
    const text = JSON.stringify(l0.blocks);
    expect(text).toContain("компилятор");
    /* The pipeline, in the learner's own words, and the distinction the whole
       debugging half of the month rests on. */
    expect(text).toMatch(/наш код → компилятор → готовая программа → результат/);
    expect(text).toContain("Ошибка компиляции");
    expect(text).toContain("Ошибка во время выполнения");
    expect(text).toContain("Неверный ответ");
  });

  it("no longer tells a beginner to copy four lines on faith", () => {
    /* The exact sentences that were there. If either comes back, this month has
       gone back to teaching a ritual. */
    const all = JSON.stringify(september);
    expect(all).not.toContain("прими как данность");
    expect(all).not.toContain("пиши эти четыре строки всегда одинаково");
  });

  it("explains every part of the frame, including `using namespace std;`", () => {
    /* The frame is on screen from the first program, so every part of it must
       be explained by the end of the lesson that shows it. `using namespace
       std;` was the one nothing in the month ever mentioned. */
    const byFirstProgram = shownBy(at("m1.l1"));
    for (const part of ["#include <iostream>", "using namespace std;", "int main()", "return 0;"]) {
      expect(byFirstProgram, `${part} is shown but never explained`).toContain(part);
    }
    const explained = JSON.stringify(lessons.find((l) => l.id === "m1.l1")!.blocks);
    expect(explained).toContain("вместо `std::cout`");
    expect(explained).toContain("точка старта");
    expect(explained).toContain("где main начинается");
    expect(explained).toContain("завершилась нормально");
  });
});

describe("nothing is required before it is taught", () => {
  it("teaches a variable before anything reads into one", () => {
    /*
     * `cin >> n` carries two new ideas at once. The variables lesson exists so
     * that by the time reading arrives, the box already exists in the learner's
     * head and only the reading is new.
     */
    expect(at("m1.l13")).toBeLessThan(at("m1.l11"));
    expect(at("m1.l13")).toBeLessThan(at("m1.l2"));
    const beforeReading = shownBy(at("m1.l13"));
    expect(beforeReading).toContain("int age = 14;");
  });

  it("shows cout before any task asks for it, and cin before any task reads", () => {
    const firstWriteTask = lessons.find((l) =>
      l.blocks.some((b) => b.type === "write_code" || b.type === "challenge"),
    )!;
    expect(shownBy(at(firstWriteTask.id) - 1), "cout is used before it is shown").toContain("cout");

    const firstReadingTask = lessons.find((l) =>
      (l.blocks as unknown as { referenceSolution?: string }[]).some((b) =>
        (b.referenceSolution ?? "").includes("cin >>"),
      ),
    )!;
    expect(shownBy(at(firstReadingTask.id)), "cin is required before it is shown").toContain("cin >>");
  });

  it("does not require a construct the month has not shown by that lesson", () => {
    /*
     * The general rule, over the constructs a beginner cannot invent. For each
     * reference solution, everything it uses must already have appeared on
     * screen at or before its own lesson.
     */
    const constructs: [string, RegExp][] = [
      ["cout", /\bcout\b/],
      ["cin", /\bcin\b/],
      ["int", /\bint\s+[a-z]/],
      ["if", /\bif\s*\(/],
      ["else", /\belse\b/],
      ["string", /\bstring\s+[a-z]/],
      ["%", /%/],
      ["&&", /&&/],
      ["||", /\|\|/],
    ];
    const offenders: string[] = [];
    lessons.forEach((lesson, i) => {
      const shown = shownBy(i + 1);
      for (const b of lesson.blocks as unknown as { id: string; referenceSolution?: string }[]) {
        const ref = b.referenceSolution;
        if (!ref) continue;
        for (const [name, re] of constructs) {
          if (!re.test(ref)) continue;
          /* Shown means shown ANYWHERE by this point — including in this
             lesson's own concept block, which is how a lesson teaches the thing
             it then asks for. */
          if (!re.test(shown)) offenders.push(`${b.id} uses ${name} before September shows it`);
        }
      }
    });
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("the scaffold is taken away once, and it is announced", () => {
  /**
   * Stages A→E, as data.
   *
   * The audit found the transition happening silently at `m1.l10.b5` — teaching
   * position 6 — with an empty editor between two lessons that still handed
   * over the frame. The progression went B → E → B → B, which is not a
   * progression.
   */
  const GRADUATION = "m1.l7";

  const codeTasks = lessons.flatMap((lesson) =>
    (lesson.blocks as unknown as { id: string; type: string; starter?: string; tracks?: string[] }[])
      .filter((b) => b.type === "write_code" || b.type === "challenge")
      .map((b) => ({
        lesson: lesson.id,
        id: b.id,
        pos: at(lesson.id),
        starter: b.starter ?? "",
        /* The support track is the product's own answer to "this learner is not
           ready yet". `m1.l8.b1s` hands over the reading and the printing and
           asks for the one line that computes — and its prompt says so. Holding
           it to the core track's graduation would delete the differentiation
           the tracks exist for. */
        support: (b.tracks ?? []).includes("support"),
      })),
  );

  it("hands the learner a frame in every task before the graduation lesson", () => {
    const naked = codeTasks
      .filter((task) => task.pos < at(GRADUATION))
      .filter((task) => !task.starter.includes("int main"))
      .map((task) => `${task.id} (${task.lesson}, position ${task.pos})`);
    expect(
      naked,
      `these tasks come before ${GRADUATION} and give the learner an empty editor:\n  ${naked.join("\n  ")}`,
    ).toEqual([]);
  });

  it("takes it away from the graduation lesson on, and not before", () => {
    /* The other half. A frame that never goes away trains a learner who cannot
       start a program on their own — which is what May's contests ask for. */
    const stillScaffolded = codeTasks
      .filter((task) => task.pos > at(GRADUATION))
      .filter((task) => !task.support)
      .filter((task) => task.starter.includes("int main"))
      .map((task) => task.id);
    expect(stillScaffolded, "the frame is still being given after graduation").toEqual([]);
  });

  it("says out loud that it is being taken away", () => {
    const lesson = lessons.find((l) => l.id === GRADUATION)!;
    const text = JSON.stringify(lesson.blocks);
    expect(text).toContain("С этого урока ты пишешь программу целиком");
    /* And repeats the frame one last time, so the announcement is a lesson and
       not a warning. */
    expect(text).toContain("#include <iostream>");
    expect(text).toContain("using namespace std;");
  });

  it("puts the announcement before the first unscaffolded task", () => {
    const announcement = lessons.find((l) => l.id === GRADUATION)!;
    const firstNaked = codeTasks.find(
      (task) => !task.support && !task.starter.includes("int main"),
    )!;
    expect(firstNaked.pos, "a task with no frame comes before the lesson that explains why").toBeGreaterThanOrEqual(
      at(announcement.id),
    );
  });
});

describe("the starter frame is the one the learner was taught", () => {
  it("uses the same four lines everywhere, with the cursor comment inside main", () => {
    const starters = lessons
      .flatMap((l) => l.blocks as unknown as { id: string; starter?: string }[])
      .filter((b) => (b.starter ?? "").includes("int main"));
    expect(starters.length, "there must be scaffolded tasks to check").toBeGreaterThan(8);
    for (const b of starters) {
      const s = b.starter!;
      expect(s, `${b.id}: frame must open with the include`).toContain("#include <iostream>");
      expect(s, `${b.id}: frame must carry the using line`).toContain("using namespace std;");
      expect(s, `${b.id}: frame must close with return 0`).toContain("return 0;");
      /* And the learner's own place is inside main, not after it. A comment
         below `return 0;` is a frame that teaches the wrong shape. */
      const mainAt = s.indexOf("int main");
      const returnAt = s.indexOf("return 0;");
      const hint = s.indexOf("Напиши здесь");
      if (hint >= 0) {
        expect(hint, `${b.id}: the write-here marker must be inside main`).toBeGreaterThan(mainAt);
        expect(hint, `${b.id}: the write-here marker must be above return 0`).toBeLessThan(returnAt);
      }
    }
  });
});

/** Kept so the type import is load-bearing rather than decorative. */
export type _Block = LessonBlock;
