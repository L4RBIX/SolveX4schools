import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MONTHS } from "@schools/curriculum/months";
import { lessonAfter, monthCompletables } from "@schools/curriculum/shape";

/**
 * A lesson that ends has to lead somewhere, and the board has to show the work.
 *
 * ## What a learner met at the end of a lesson
 *
 * One button, «Жалғастыру» — Continue — going to `/course/1`, the month map
 * they had just come from. On that map nothing had changed: every tick and
 * every lock came from `useProgress()`, which read `localStorage` and nothing
 * else, so the lesson they had just finished was still grey and the next one
 * was still the same distance away. The home rail's "continue" card pointed at
 * the lesson they had completed.
 *
 * Two defects wearing one coat:
 *
 *  1. **The button had no destination.** "Continue" that returns you to a menu
 *     is not a course continuing; it is a course stopping politely. The next
 *     lesson is a fact the server holds — teaching order is the month file's
 *     array order — and it was never sent.
 *  2. **The board was a browser's opinion.** `lesson_completions` is the row
 *     the completion route refuses to write unless the policy is satisfied
 *     against the ledger, and no learner-facing surface read it. A second
 *     device showed an empty year. A school machine that clears site data
 *     between sessions erased a term's work from the learner's own view of it.
 *
 * ## The two fixes, and why they are shaped this way
 *
 * `lessonAfter` lives beside `monthCompletables` in `shape.ts` because both
 * walk the same lessons and both must skip the same ones — a draft, and a
 * lesson with no blocks. The alternative was a second copy of that filter in
 * the page, and the way two copies would show is a Continue button landing on
 * an empty page.
 *
 * The progress seed is a UNION, not a replacement: the server copy makes the
 * board true, the local copy makes it change in the same frame as the
 * completion. Both are written by the same route, so neither can be wrong in
 * the direction that matters.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/**
 * Source with its comments removed.
 *
 * The sweep below asks whether a component CALLS `useProgress()` with no seed,
 * and the answer has to come from the code rather than from prose about the
 * code — the first run of this file failed on `school-home.tsx`, whose comment
 * explains the very defect being fixed. Same pattern as
 * `tests/execution/pyodide-boundary.test.ts`.
 */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/gm, "$1");

describe("the next lesson, in teaching order", () => {
  it("follows the month file's order, not the numbers in the ids", () => {
    /*
     * September's authored order. This is the assertion the whole feature turns
     * on: eleven of these twelve steps are NOT id + 1, so any resolver that
     * parsed the number would send a learner to the wrong lesson almost every
     * time — and would look right on the one case an author would spot-check.
     */
    const walk: string[] = ["m1.l1"];
    for (;;) {
      const next = lessonAfter(MONTHS[0]!, walk[walk.length - 1]!);
      if (!next) break;
      walk.push(next.id);
    }
    expect(walk).toEqual([
      "m1.l1",
      "m1.l11",
      "m1.l2",
      "m1.l10",
      "m1.l3",
      "m1.l4",
      "m1.l5",
      "m1.l12",
      "m1.l6",
      "m1.l7",
      "m1.l8",
      "m1.l9",
    ]);
  });

  it("ends the month rather than crossing into the next one", () => {
    /* The month board is the right destination after the last lesson: the
       month's own check comes next, and it is not a lesson route. */
    for (const month of MONTHS) {
      const lessons = monthCompletables(month).filter((c) => c.kind === "lesson");
      expect(lessonAfter(month, lessons[lessons.length - 1]!.id)).toBeNull();
    }
  });

  it("agrees with the walk the rest of the product uses", () => {
    /* The reason the two functions share a file. If either filter drifts, the
       Continue button and the month board start disagreeing about which
       lessons exist, and the button is the one that lands on a blank page. */
    for (const month of MONTHS) {
      const board = monthCompletables(month)
        .filter((c) => c.kind === "lesson")
        .map((c) => c.id);
      const chain: string[] = [board[0]!];
      for (;;) {
        const next = lessonAfter(month, chain[chain.length - 1]!);
        if (!next) break;
        chain.push(next.id);
      }
      expect(chain, `month ${month.index}`).toEqual(board);
    }
  });

  it("steps over a lesson a learner cannot open", () => {
    /* A draft, and an authored-but-empty lesson. Both are 404 on the lesson
       route — `generateStaticParams` excludes them — so a Continue button
       pointing at one is worse than no button at all. */
    const month = {
      units: [
        {
          lessons: [
            { id: "a", status: "published" as const, blocks: [{}] },
            { id: "draft", status: "draft" as const, blocks: [{}] },
            { id: "empty", status: "published" as const, blocks: [] },
            { id: "b", status: "published" as const, blocks: [{}] },
          ],
        },
      ],
    };
    expect(lessonAfter(month, "a")?.id).toBe("b");
    expect(lessonAfter(month, "b")).toBeNull();
    /* And an id this month does not teach — including the skipped ones, which
       must not silently resolve to their neighbour. */
    expect(lessonAfter(month, "draft")).toBeNull();
    expect(lessonAfter(month, "nope")).toBeNull();
  });

  it("is resolved on the server, where the order is", () => {
    const page = read("src/app/lesson/[lessonId]/page.tsx");
    expect(page).toContain("lessonAfter(found.month, lesson.id)");
    expect(page).toMatch(/nextLesson=\{nextLesson\}/);
  });
});

describe("the card at the end of a lesson", () => {
  const player = read("src/components/brilliant/lesson/school-lesson.tsx");
  const card = player.slice(player.indexOf("function LessonComplete("));

  it("offers the next lesson by name", () => {
    expect(card).toContain("href={`/lesson/${next.id}`}");
    /* Named, not "Continue". A learner who can read what is next is being told
       the course goes on; a bare arrow is being told to press something. */
    expect(card).toContain("L.continueTo(t(next.title, locale))");
  });

  it("still leaves at the end of a month", () => {
    /* The fallback has to stay. The last lesson of a month has no successor and
       a card with no way out is a trap. */
    expect(card).toContain("next ?");
    expect(card).toMatch(/\) : \(\s*<Link href=\{backHref\}/);
  });

  it("keeps the map reachable from the middle of a month too", () => {
    expect(card).toContain("L.backToMonth");
  });
});

describe("every board that shows a learner their own work", () => {
  /**
   * Reads the server's record.
   *
   * Written as a sweep rather than three named assertions on purpose: the
   * defect was not that one page forgot, it was that no page asked. A fourth
   * surface added next term must not be able to reintroduce it quietly.
   */
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
      else if (rel.endsWith(".tsx") || rel.endsWith(".ts")) files.push(rel);
    }
  };
  walk("src");

  it("finds the components that render progress", () => {
    const callers = files.filter((f) => /useProgress\(/.test(code(f)) && !f.endsWith("progress.ts"));
    expect(callers.length, "components calling useProgress").toBeGreaterThanOrEqual(3);
  });

  it("never renders progress from the browser alone", () => {
    const unseeded = files
      .filter((f) => !f.endsWith("lib/progress.ts"))
      .filter((f) => /useProgress\(\s*\)/.test(code(f)));
    expect(
      unseeded,
      `these render a learner's progress from localStorage alone:\n  ${unseeded.join("\n  ")}`,
    ).toEqual([]);
  });

  it("loads the completions on the server pages that host them", () => {
    /* The three learner surfaces that draw a year, a month or a deck. */
    for (const page of ["src/app/home/page.tsx", "src/app/course/[index]/page.tsx", "src/app/program/page.tsx"]) {
      const src = code(page);
      expect(src, page).toContain("completionsForSubject");
      expect(src, page).toContain("completed={completed}");
      /* `knownSubjectId`, not `resolveIdentity`: a page render must not mint a
         subject it can never set a cookie for. Asserted on the call, since
         both names appear in the prose that explains the choice. */
      expect(src, page).toMatch(/knownSubjectId\(\)/);
      expect(src, page).not.toMatch(/resolveIdentity\(/);
    }
  });

  it("merges rather than replaces, so the board moves in the same frame", () => {
    const hook = read("src/lib/progress.ts");
    const fn = hook.slice(hook.indexOf("export function useProgress("));
    expect(fn).toContain("new Set(local.completedLessons)");
    expect(fn).toContain("for (const id of seed) completedLessons.add(id)");
    /* And with no seed it is exactly what it was, so a surface that genuinely
       has none is not broken by the union. */
    expect(fn).toContain("if (!seed || seed.length === 0) return local");
  });
});
