import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The task frame must never put content above its own scroll origin.
 *
 * ## The bug this exists to stop coming back
 *
 * `LessonPage` — the single scroll container behind every lesson AND every
 * assessment task — was `flex flex-col items-center justify-center
 * overflow-y-auto`. When the content is taller than the box,
 * `justify-content: center` distributes the overflow to BOTH ends, and the top
 * end sits above the scroll origin. A browser cannot scroll to a negative
 * offset, so that content is not merely off screen: it is **unreachable**.
 *
 * Measured on `/assessment/1` at 1440x900 before the fix: 912px of content in a
 * 720px box, with the task statement roughly 96px above the first scrollable
 * pixel. A learner opened a coding assessment and could not read the question.
 *
 * The file's own comment named the hazard — "`self-center` cuts the head off
 * overflowing content, silently" — and then chose a property with the identical
 * failure mode. That is why this is a test and not a comment: the reasoning was
 * already written down and it did not hold.
 *
 * ## Why a source assertion rather than a rendered one
 *
 * vitest here is node-only: no jsdom, no layout engine, and a layout engine is
 * the only thing that could measure a scroll origin. The rendered proof is
 * `scripts/manual/player-geometry-probe.md`, run in real Chrome.
 *
 * What CAN be pinned in CI is the property that caused it, on the container
 * that carries every task in the product. A rendered check that only runs when
 * somebody remembers is worth less than a cheap one that always runs.
 */

const ROOT = process.cwd();
const PLAYER = path.join(ROOT, "src/components/brilliant/lesson/school-lesson.tsx");
const src = readFileSync(PLAYER, "utf8");

/** The scroll container's own className, isolated from the rest of the file. */
function lessonPageClasses(): string {
  const fn = src.slice(src.indexOf("function LessonPage("), src.indexOf("function LessonPage(") + 900);
  const m = fn.match(/className="([^"]*overflow-y-auto[^"]*)"/);
  expect(m, "LessonPage's scroll container must be findable").not.toBeNull();
  return m![1];
}

describe("the task scroll container", () => {
  it("does not centre its overflow, which would put the top out of reach", () => {
    const cls = lessonPageClasses();
    expect(cls, "the container must scroll").toContain("overflow-y-auto");
    /* The exact regression. `justify-center` and `justify-end` both push
       content above the scroll origin once it overflows; `justify-start` is
       the default and is fine. */
    expect(cls, "justify-center on a scrollable column clips the top").not.toMatch(
      /\bjustify-center\b/,
    );
    expect(cls).not.toMatch(/\bjustify-end\b/);
  });

  it("centres short content with auto margins instead", () => {
    /* `my-auto` on the child is the safe equivalent: auto block margins absorb
       free space when there is some — so a short prompt sits centred — and
       compute to zero when there is none, so a long task starts at the top and
       scrolls its full length. One property, both behaviours, no measurement
       for anyone to maintain. */
    const fn = src.slice(src.indexOf("function LessonPage("), src.indexOf("function LessonPage(") + 900);
    expect(fn, "the card must centre via auto margins").toMatch(
      /data-lesson-page-components[\s\S]{0,120}my-auto|my-auto[\s\S]{0,120}data-lesson-page-components/,
    );
  });

  it("keeps a stable hook for the rendered geometry probe", () => {
    /* `data-lesson-page-components` is how the browser probe finds the card to
       measure. Renaming it silently would not break a build and would quietly
       disable the only check that can see a scroll origin. */
    expect(src).toContain('data-lesson-page-components="true"');
  });
});

describe("the container is shared, so one fix covers both surfaces", () => {
  it("is the same component behind lessons and assessments", () => {
    /* `AssessmentRoute` renders `SchoolLesson`, which renders `LessonPage`.
       If that ever forks, an assessment could regress on its own while every
       lesson test stayed green — which is precisely how this bug reached a
       learner-facing screen. */
    const assessment = readFileSync(
      path.join(ROOT, "src/components/brilliant/lesson/assessment-route.tsx"),
      "utf8",
    );
    expect(assessment).toContain("SchoolLesson");
    expect(
      (src.match(/<LessonPage\b/g) ?? []).length,
      "exactly one place mounts the task frame",
    ).toBe(1);
  });
});
