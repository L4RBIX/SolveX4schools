import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The card may not cut through its own children.
 *
 * ## What was measured, before
 *
 * The home deck's stack was `h-[540px] max-h-[540px]` with every card
 * `absolute inset-0` and `overflow-clip`. A card's content is not a constant:
 * a title that wraps to three lines in Kazakh, a 150px illustration, a lesson
 * list as long as the month, a lock explanation on eight of the nine months,
 * and a 48px button. In Chromium at 390px, September's card wanted **34px more
 * than the box** — so the primary button was cut in half, which is exactly what
 * the screenshots showed. At 1440 it was 4px, which is a hairline through the
 * button's shadow and reads as a rendering bug.
 *
 * ## Why these assertions are on the source
 *
 * The browser is where this was found and where it is proven —
 * `scripts/pilot-e2e.mjs` measures the real thing at seven widths in both
 * languages. What a unit test can hold is the STRUCTURE that made it possible:
 * a fixed height on a container whose content varies, and a clip on the box
 * holding the button. Both are one-line regressions and both would pass a
 * screenshot review a week later.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("the deck's card stack", () => {
  const deck = read("src/components/brilliant/app/course-deck.tsx");

  it("is sized by the card in front of it, not by a constant", () => {
    /* The class, not the word: the comment above the fix quotes the old value
       and must keep being allowed to. */
    const classNames = deck.match(/className=\{?"[^"]*"/g)?.join("\n") ?? "";
    expect(classNames, "a fixed stack height is the bug").not.toContain("h-[540px]");
    expect(classNames).not.toContain("max-h-[540px]");
    /* The front card is in flow — that is what gives the container its height
       — and the decorative ones are absolute behind it. */
    expect(deck).toContain('front ? "relative" : "absolute inset-0 overflow-hidden"');
  });

  it("never clips the card a learner is looking at", () => {
    /* Only the back cards clip. The front card holds a button somebody has to
       press. */
    expect(deck).toContain('front ? "h-auto" : "h-full overflow-clip"');
  });

  it("keeps a floor so a short month still looks like a card", () => {
    expect(deck).toMatch(/min-h-\[\d+px\]/);
  });

  it("lets only the lesson list scroll", () => {
    /* A month has up to fourteen lessons and a card is not a page — the list
       scrolls. Everything else is laid out at its natural height. */
    const body = deck.slice(deck.indexOf("function DeckCardBody("));
    expect(body).toContain("max-h-[220px] overflow-y-auto");
    expect(body, "the body itself must not be height-locked").not.toMatch(
      /flex h-full flex-col items-center justify-between/,
    );
  });
});

describe("the locked month", () => {
  const deck = read("src/components/brilliant/app/course-deck.tsx");
  const home = read("src/components/brilliant/app/school-home.tsx");

  it("explains itself outside the scrolling list", () => {
    /*
     * The reason a month is closed used to be one line at the BOTTOM of the
     * scrolling lesson list: a learner had to scroll past every closed row to
     * find out why the rows were closed, and on a phone the card clipped it
     * before they got there.
     */
    const body = deck.slice(deck.indexOf("function DeckCardBody("));
    const listEnd = body.indexOf("max-h-[220px]");
    const lockBlock = body.indexOf("lockedLabels.reason");
    expect(lockBlock).toBeGreaterThan(listEnd);
    expect(body.slice(listEnd, lockBlock)).toContain("</div>");
  });

  it("says both halves of the rule, in the product's own words", () => {
    expect(deck).toContain("lockedLabels.body");
    expect(home).toContain("L.monthLockedTitle");
    expect(home).toContain("L.monthLockedBody");
  });
});

describe("the month rail", () => {
  const deck = read("src/components/brilliant/app/course-deck.tsx");

  it("is a separate object from the card, and says so in the spacing", () => {
    expect(deck).toContain("data-deck-rail");
    /* `my-5` put it against the card's border and the two read as one clipped
       thing. */
    expect(deck).toContain("mt-8 mb-2 h-[60px]");
  });
});

describe("the month-direction selector", () => {
  it("is gone from the product", () => {
    expect(
      existsSync(path.join(ROOT, "src/components/brilliant/gameboard/track-switch.tsx")),
      "track-switch.tsx still exists",
    ).toBe(false);
    const board = read("src/components/brilliant/gameboard/month-board.tsx");
    expect(board).not.toContain("TrackSwitch");
    /* And no hidden twin holding its height on one breakpoint or the other:
       the board passes neither slot. (`CourseGameboard` still offers them for
       the reverse-engineering baseline, and the comment here says so.) */
    expect(board).not.toMatch(/asideExtra=\{/);
    expect(board).not.toMatch(/beforeBoard=\{/);
  });

  it("did not take the track MECHANISM with it", () => {
    /*
     * The control is a product decision; the routes through a month are a
     * curriculum capability. `resolveTrack` still decides which blocks a
     * lesson payload carries, and the course page still asks it — deleting
     * that would quietly hand a support-track learner the core month.
     */
    const page = read("src/app/course/[index]/page.tsx");
    expect(page).toContain("resolveTrack");
    expect(page).toContain("monthOutline(month, track)");
  });
});
