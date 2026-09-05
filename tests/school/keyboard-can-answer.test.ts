import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A learner using a keyboard has to be able to answer.
 *
 * ## What was measured
 *
 * "Options are `<button role="radio">` whose only activation path is click;
 * Space and Enter leave `aria-checked` false. Tab walks every off-screen
 * carousel block."
 *
 * Those are one defect seen twice. A `<button>` DOES fire `onClick` on Space
 * and Enter — the activation path was never the problem. Every page of the
 * carousel is mounted at once and moved with `translateX`, so the eleven cards
 * the learner is not looking at were still in the DOM, still focusable and
 * still hit-testable. Tab therefore walked them, and Space selected an option
 * on a card nobody could see — which is exactly what "aria-checked stayed
 * false" looks like from the outside.
 *
 * ## The two fixes
 *
 * `inert` on the off-screen pages removes them from the tab order, from hit
 * testing and from the accessibility tree in one attribute — the platform's own
 * answer, and the set of three that were wrong. Walking the tree setting
 * `tabindex="-1"` would miss whatever it does not know about.
 *
 * And the radiogroup now implements the pattern it claims. `role="radiogroup"`
 * with `role="radio"` children is a contract: the GROUP is one tab stop and the
 * arrow keys move between the options. Four separate tab stops with no arrow
 * handling told a screen-reader user something untrue about the control.
 *
 * ## Why this is a source test
 *
 * There is no DOM in this suite — `vitest.config.ts` sets `environment: "node"`
 * — and adding jsdom to assert on a focus ring would be a comforting lie, since
 * jsdom does not implement `inert`, `focus-visible` or hit testing. What a Node
 * test can hold is that the attributes and the handlers are present and that
 * their conditions are the right way round. The behaviour is a Playwright
 * assertion and lives with the browser acceptance run.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("the carousel", () => {
  const player = read("src/components/brilliant/lesson/school-lesson.tsx");

  it("takes the pages a learner is not looking at out of the tab order", () => {
    expect(player, "`inert` on the page wrapper").toMatch(/inert=\{!active\}/);
    /* And it must actually be told which page is on screen. A default of
       `active = true` would make the attribute inert in the other sense. */
    expect(player).toMatch(/<LessonPage key=\{b\.id\} active=\{i === page\}>/);
  });

  it("does not hide the page the learner IS looking at", () => {
    /* The mirror. `inert` on the visible card would leave the whole lesson
       unusable by everybody, which is a worse bug than the one it fixes. */
    const fn = player.slice(player.indexOf("function LessonPage("));
    expect(fn.slice(0, 800)).toContain("inert={!active}");
    expect(fn.slice(0, 800)).not.toContain("inert={active}");
  });
});

describe("the answer list", () => {
  const primitives = read("src/components/brilliant/lesson/blocks/primitives.tsx");
  const group = primitives.slice(primitives.indexOf("export function OptionList("));

  it("is one tab stop, holding the current answer", () => {
    /* The pattern's own rule: the roving stop is the SELECTED option, so Tab
       lands on the answer the learner has given rather than at the top of the
       list every time. */
    expect(group).toContain("const roving = selected ?? options[0]?.id ?? null");
    expect(group).toMatch(/tabIndex=\{option\.id === roving \? 0 : -1\}/);
  });

  it("moves with the arrow keys, in both axes and wrapping", () => {
    expect(group).toContain('e.key === "ArrowDown" || e.key === "ArrowRight"');
    expect(group).toContain('e.key === "ArrowUp" || e.key === "ArrowLeft"');
    /* A radiogroup is a ring. */
    expect(group).toContain("(i + delta + options.length) % options.length");
  });

  it("selects as it moves, which is what makes it a radiogroup", () => {
    /* Arrow keys move the SELECTION in a radiogroup — that is what
       distinguishes it from a toolbar or a tablist, where they move only
       focus. */
    const move = group.slice(group.indexOf("const move ="), group.indexOf("return ("));
    expect(move).toContain("onSelect(next.id)");
    expect(move, "and focus follows, or the next arrow press starts over").toContain(".focus()");
  });

  it("does not double-fire Space and Enter", () => {
    /* A `<button>` already fires `onClick` for both. Handling them in the
       keydown as well would select twice and, on a checked block, count two
       attempts. */
    const handler = group.slice(group.indexOf("onKeyDown="), group.indexOf("onClick="));
    expect(handler).not.toContain('"Enter"');
    expect(handler).not.toContain('" "');
  });

  it("shows where the focus is", () => {
    /* Without a ring the roving tabindex is invisible: the keyboard moves a
       selection the learner cannot see, which is worse than not being able to
       move it. `focus-visible`, so a pointer user never sees it. */
    expect(group).toContain("focus-visible:outline-2");
    expect(group).toContain("focus-visible:outline-offset-2");
  });

  it("stops answering once the block is settled", () => {
    /* `disabled` removes a locked group from the tab order entirely, and the
       arrow handler refuses too. A settled question has no answer left to
       give. */
    expect(group).toContain("disabled={locked}");
    expect(group.slice(group.indexOf("const move ="))).toMatch(/if \(locked\) return;/);
  });
});
