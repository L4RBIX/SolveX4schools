import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_ART,
  MONTH_ART,
  PROGRAMME_ART,
  SCENE_SETTER,
  lessonArt,
  monthArt,
  pythonArtNeedingReplacement,
} from "../../schools/presentation/illustrations";

/**
 * The illustration registry, and the one asset in it that names a language.
 *
 * The course teaches C++17. Every picture in this registry is borrowed
 * Brilliant chapter art and every one of them is temporary, which is recorded
 * already — `schools/assets/registry.ts` carries `replacementNeeded: true` for
 * all nine months. What is NOT the same for all nine is that February's slot is
 * drawn by `Recursion_in_Python_1-FEJb29.png`, and that file is a purple snake
 * at a laptop: Python's mascot, on `/home`, `/program` and `/course/6`.
 *
 * Replacing Brilliant-derived artwork is reserved to the owner, so this file
 * does not ask for it to be gone. It asks for two weaker things that a test can
 * actually keep true:
 *
 *   1. an asset whose own file name says Python must be FLAGGED, so it cannot
 *      be added quietly, and
 *   2. the flag must be readable — a brief for the replacement, not a boolean.
 *
 * Both stay green the day the art is replaced. Neither stays green if somebody
 * points another month at another snake.
 */

const MONTHS = Object.keys(MONTH_ART).map(Number).sort((a, b) => a - b);

/**
 * Names that identify a programming language rather than a concept.
 *
 * Deliberately not a general "does it look like code" test, which no string
 * match can do. This catches the case that actually occurred: the borrowed
 * asset kept the file name of the Brilliant course it was drawn for, and that
 * course was named after a language.
 */
const LANGUAGE_IN_FILENAME = /python|javascript|\bjava\b|ruby|\bphp\b/i;

describe("the registry is complete and resolvable", () => {
  it("covers all nine months, September to May", () => {
    expect(MONTHS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("gives every slot a src and a brief", () => {
    for (const [index, art] of Object.entries(MONTH_ART)) {
      expect(art.src, `month ${index} src`).toMatch(/^\/assets\/.+\.png$/);
      /* `intent` is what a commissioned replacement is drawn against. An empty
         one turns "replace this picture" into "guess what it meant". */
      expect(art.intent.trim().length, `month ${index} intent`).toBeGreaterThan(10);
    }
  });

  it("falls back rather than returning nothing for an unknown month", () => {
    expect(monthArt(1)).toBe(MONTH_ART[1].src);
    expect(monthArt(99)).toBe(PROGRAMME_ART);
    expect(monthArt(0)).toBe(PROGRAMME_ART);
  });

  it("falls back from an unknown lesson to its month's art", () => {
    expect(lessonArt("m1.l1", 1)).not.toBe(monthArt(1));
    expect(lessonArt("m4.l3", 4)).toBe(monthArt(4));
  });

  it("keeps the two standalone slots pointing at real files", () => {
    for (const src of [PROGRAMME_ART, ASSESSMENT_ART, SCENE_SETTER]) {
      expect(src).toMatch(/^\/assets\/.+\.png$/);
    }
  });
});

describe("artwork that depicts the wrong programming language", () => {
  it("flags every asset whose file name names a language", () => {
    /* The direction that matters. A slot may carry a Python picture — the
       owner has reserved the replacement — but it may not carry one silently,
       because the whole cost of this defect is that nobody notices a snake on
       a C++ course until a parent does. */
    for (const [index, art] of Object.entries(MONTH_ART)) {
      if (!LANGUAGE_IN_FILENAME.test(art.src)) continue;
      expect(
        art.wrongLanguage,
        `month ${index} uses ${art.src} and does not say which language it depicts`,
      ).toBeDefined();
    }
  });

  it("makes every flag a sentence, not a boolean", () => {
    for (const entry of pythonArtNeedingReplacement()) {
      expect(entry.depicts.trim().length, `month ${entry.monthIndex}`).toBeGreaterThan(10);
      expect(entry.intent.trim().length, `month ${entry.monthIndex}`).toBeGreaterThan(10);
    }
  });

  it("reports the February slot, which is the one that exists today", () => {
    /* Not a permanent expectation. When the recursion art is redrawn, delete
       `wrongLanguage` from `MONTH_ART[6]` and delete this case with it — the
       two above are the ones that keep working either way. */
    expect(pythonArtNeedingReplacement().map((e) => e.monthIndex)).toEqual([6]);
  });

  it("derives the list from the registry rather than repeating it", () => {
    /* A hand-kept second list is how "we already fixed that" happens twice. */
    const flagged = Object.entries(MONTH_ART)
      .filter(([, art]) => art.wrongLanguage !== undefined)
      .map(([index]) => Number(index));
    expect(pythonArtNeedingReplacement().map((e) => e.monthIndex)).toEqual(flagged);
  });
});
