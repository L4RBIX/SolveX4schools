import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROGRAM } from "@schools/curriculum/program";
import { monthOutlines } from "@schools/curriculum/public";
import { monthCompletables } from "@schools/curriculum/inventory";
import { NO_EVIDENCE, unlockStateFor, type UnlockEvidence } from "@schools/policies/unlock";
import {
  EMPTY_PROGRESS,
  blockingRequirement,
  monthsToDeck,
  monthToDeckCourse,
  type DeckCourseData,
} from "@schools/presentation/adapters";

/**
 * The home deck must not hand a learner a URL the lesson route will refuse.
 *
 * ## The defect
 *
 * All nine months are authored and published, so `monthToDeckCourse` emitted
 * `/lesson/<id>` for the first three lessons of every card, and `nextLesson`'s
 * `?? all[0]` fallback made the first row of every card `active` — which is what
 * the Start CTA reads. Measured in a browser on a learner with no completions:
 * 24 lesson links and 8 Start buttons on the home screen, every one of them two
 * clicks from the generic 404 page, because
 * `src/app/lesson/[lessonId]/page.tsx` correctly refuses a month this learner
 * has not earned.
 *
 * ## What is NOT being changed
 *
 * The lesson route's `notFound()` is the authorisation boundary and it sits
 * before the payload is serialised. It stays exactly as it is. These tests are
 * about the LINKS the official UI emits, which is where the defect actually was.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const MONTHS = monthOutlines(PROGRAM.months);

/** Every href a card would put in the DOM: the card's own, plus its rows'. */
function hrefs(card: DeckCourseData): string[] {
  return [card.href, ...card.lessons.flatMap((l) => (l.href ? [l.href] : []))];
}

/** What `course-deck.tsx` resolves its Start CTA to, expressed here once. */
function startHref(card: DeckCourseData): string {
  return card.lessons.find((l) => l.active)?.href ?? card.href;
}

describe("the deck emits no lesson link for a month the learner cannot enter", () => {
  it("gives a locked card a course link and nothing else", () => {
    const october = monthToDeckCourse(MONTHS[1], EMPTY_PROGRESS, "ru", {
      unlocked: false,
    });
    expect(october.locked).toBe(true);
    expect(hrefs(october)).toEqual(["/course/2"]);
    expect(october.lessons.every((l) => l.href === undefined)).toBe(true);
    expect(october.lessons.every((l) => l.locked)).toBe(true);
  });

  it("still shows the rows, because a learner may see the shape of their year", () => {
    const october = monthToDeckCourse(MONTHS[1], EMPTY_PROGRESS, "ru", {
      unlocked: false,
    });
    expect(october.lessons.length).toBeGreaterThan(0);
    expect(october.title.trim()).not.toBe("");
    expect(october.lessons.every((l) => l.title.trim() !== "")).toBe(true);
  });

  it("keeps every lesson link on an unlocked month", () => {
    const september = monthToDeckCourse(MONTHS[0], EMPTY_PROGRESS, "ru", {
      unlocked: true,
    });
    expect(september.locked).toBe(false);
    expect(september.lessons.every((l) => l.href?.startsWith("/lesson/"))).toBe(true);
  });

  it("marks no row active on a locked card, so the Start CTA cannot resolve to one", () => {
    /* This is the exact path the measured defect took: `nextLesson` returns
       `all[0]` when nothing is in progress, so the first row was active and the
       purple CTA pointed at `/lesson/m2.l1`. */
    const october = monthToDeckCourse(MONTHS[1], EMPTY_PROGRESS, "ru", {
      unlocked: false,
    });
    expect(october.lessons.some((l) => l.active)).toBe(false);
    expect(startHref(october)).toBe("/course/2");
  });

  it("keeps the Start CTA pointing at a lesson on an unlocked month", () => {
    const september = monthToDeckCourse(MONTHS[0], EMPTY_PROGRESS, "ru", {
      unlocked: true,
    });
    expect(startHref(september)).toMatch(/^\/lesson\//);
  });
});

describe("the whole deck, for a learner who has done nothing", () => {
  const deck = monthsToDeck(MONTHS, EMPTY_PROGRESS, "ru", 1);

  it("renders all nine cards", () => {
    expect(deck).toHaveLength(9);
  });

  it("emits a lesson link for September and for no other month", () => {
    const withLessons = deck.filter((c) => c.lessons.some((l) => l.href));
    expect(withLessons.map((c) => c.id)).toEqual(["month-1"]);
  });

  it("has no href anywhere that the lesson gate would refuse", () => {
    /* The complete list of what this screen would navigate to. Every `/lesson/`
       in it must belong to an unlocked month; every other card offers only its
       own board, which renders a panel at HTTP 200. */
    const all = deck.flatMap(hrefs);
    const lessons = all.filter((h) => h.startsWith("/lesson/"));
    expect(lessons.every((h) => h.startsWith("/lesson/m1."))).toBe(true);
    expect(deck.map(startHref).filter((h) => h.startsWith("/lesson/"))).toHaveLength(1);
  });

  it("opens October once September is finished and demonstrated", () => {
    const septemberDone = monthCompletables(PROGRAM.months[0]).map((c) => c.id);
    const evidence: UnlockEvidence = {
      completed: new Set(septemberDone),
      solved: new Set(["m1.as.b1"]),
    };
    const state = unlockStateFor(PROGRAM.months, evidence);
    expect(state.unlockedThrough).toBe(2);

    const opened = monthsToDeck(MONTHS, EMPTY_PROGRESS, "ru", state.unlockedThrough);
    const october = opened.find((c) => c.id === "month-2")!;
    expect(october.locked).toBe(false);
    expect(october.lessons.every((l) => l.href?.startsWith("/lesson/m2."))).toBe(true);
  });
});

describe("what a closed month is allowed to tell the learner", () => {
  it("names the blocking month, its lesson count, and both outstanding conditions", () => {
    const req = blockingRequirement(MONTHS, unlockStateFor(PROGRAM.months, NO_EVIDENCE))!;
    expect(req.index).toBe(1);
    expect(req.lessonsDone).toBe(0);
    expect(req.checkPending).toBe(true);
    expect(req.independencePending).toBe(true);
  });

  it("counts LESSONS in the denominator, never the monthly check", () => {
    /* September has 12 lessons and one check — 13 completables. Printing 13 as
       the lesson denominator is the one arithmetic lie available here, and it
       would appear in the exact place the product is explaining a refusal. */
    const completables = monthCompletables(PROGRAM.months[0]);
    const lessons = completables.filter((c) => c.kind === "lesson").length;
    const req = blockingRequirement(MONTHS, unlockStateFor(PROGRAM.months, NO_EVIDENCE))!;
    expect(req.lessonsTotal).toBe(lessons);
    expect(req.lessonsTotal).not.toBe(completables.length);
  });

  it("counts the lessons the learner has actually finished", () => {
    const lessonIds = monthCompletables(PROGRAM.months[0])
      .filter((c) => c.kind === "lesson")
      .map((c) => c.id);
    const evidence: UnlockEvidence = {
      completed: new Set(lessonIds.slice(0, 9)),
      solved: new Set(),
    };
    const req = blockingRequirement(MONTHS, unlockStateFor(PROGRAM.months, evidence))!;
    expect(req.lessonsDone).toBe(9);
    expect(req.lessonsTotal).toBe(lessonIds.length);
    expect(req.checkPending).toBe(true);
    expect(req.independencePending).toBe(true);
  });

  it("separates the two halves of the rule, which is the whole point of showing it", () => {
    /* Everything completed, including the check, with a wrong answer on the
       unseen problem. `ASSESSMENT_COMPLETION_POLICY` never requires `passed`,
       so this learner satisfied the OLD copy word for word and the month stayed
       shut. The checklist has to be able to say which half is missing. */
    const evidence: UnlockEvidence = {
      completed: new Set(monthCompletables(PROGRAM.months[0]).map((c) => c.id)),
      solved: new Set(),
    };
    const req = blockingRequirement(MONTHS, unlockStateFor(PROGRAM.months, evidence))!;
    expect(req.lessonsDone).toBe(req.lessonsTotal);
    expect(req.checkPending).toBe(false);
    expect(req.independencePending).toBe(true);
  });

  it("never carries a block id, a prompt or a test case to the browser", () => {
    /* `MonthUnlock.independenceBlocks` names the hidden `unseen_problem` items
       inside a monthly check. The count and the boolean are safe; the ids are
       the thing the lesson route's own history says must not ship. */
    const req = blockingRequirement(MONTHS, unlockStateFor(PROGRAM.months, NO_EVIDENCE))!;
    expect(Object.keys(req).sort()).toEqual([
      "checkPending",
      "independencePending",
      "index",
      "lessonsDone",
      "lessonsTotal",
    ]);
    expect(JSON.stringify(req)).not.toMatch(/m\d+\.as\./);
  });
});

describe("the renderer honours the missing href rather than inventing one", () => {
  const deck = read("src/components/brilliant/app/course-deck.tsx");

  it("renders a row without an href as a non-link", () => {
    expect(deck).toContain("if (!l.href) {");
    expect(deck).toContain('aria-disabled="true"');
  });

  it("routes the CTA of a locked card at the month board", () => {
    expect(deck).toContain("<LockedButton href={course.href}");
  });

  it("says the row is closed in words, not in opacity", () => {
    /* `opacity-50` on this card has always meant "not the lesson you are on",
       and the first row of a locked month is fully opaque. A learner who cannot
       separate the two greys — or who is not looking at greys at all — gets the
       same answer from the padlock and the screen-reader text. */
    expect(deck).toContain("<LockMark />");
    expect(deck).toContain("{lockedRowLabel}");
  });
});

describe("the lesson gate itself is untouched", () => {
  it("still 404s a direct URL into a month the learner has not earned", () => {
    const page = read("src/app/lesson/[lessonId]/page.tsx");
    expect(page).toContain(
      "if (!(await currentLearnerMayEnter(found.month.index))) notFound();",
    );
  });

  it("still refuses the two write routes with the same generic 404", () => {
    expect(read("src/app/api/learning/submit/route.ts")).toContain("unknown block");
    expect(read("src/app/api/learning/complete/route.ts")).toContain("unknown lesson");
  });
});
