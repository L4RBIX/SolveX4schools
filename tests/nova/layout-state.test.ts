import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The split workspace, as a structural contract.
 *
 * ## What was measured, and where
 *
 * These numbers come from a real browser, not from reading CSS.
 * `scripts/measure-nova-layout.mjs` drives Chromium against the dev server at
 * five widths and reports the lesson card's box with the panel closed and open:
 *
 * | width | card closed | card open  | Nova       | lesson ÷ Nova |
 * |------:|------------:|-----------:|-----------:|--------------:|
 * |  1440 | x=32 w=1376 | x=422 w=986| x=32 w=374 |          2.6× |
 * |  1280 | x=32 w=1216 | x=388 w=860| x=32 w=340 |          2.5× |
 * |  1024 | x=32  w=960 | x=388 w=604| x=32 w=340 |          1.8× |
 * |   768 | x=32  w=704 | x=32  w=704| x=0  w=768 |     sheet     |
 * |   375 | x=12  w=351 | x=12  w=351| x=0  w=375 |     sheet     |
 *
 * No horizontal overflow at any width. The lesson stays at least 1.8× the
 * width of Nova wherever they share the screen, and below `lg` they do not
 * share it at all — a 340px panel beside a 768px lesson would leave the task in
 * a strip too narrow to read a code block in, and the lesson is what the
 * learner came for.
 *
 * ## Why this file reads the source
 *
 * The measurement above needs a browser and a dev server, which is not what a
 * unit suite should require on every push. What IS worth pinning here is the
 * mechanism, because of HOW this would break: not by someone deciding to cover
 * the lesson again, but by someone editing a className and not knowing that
 * three rules elsewhere depend on the same variable. The split is one number —
 * `--sx-nova-w` — read in three places, and a test that names all three fails
 * the moment they stop agreeing.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const lesson = read("src/components/brilliant/lesson/school-lesson.tsx");
const chat = read("src/components/nova/nova-chat.tsx");

describe("the split is driven by one variable", () => {
  it("declares the width on the lesson root, and zeroes it when closed", () => {
    /* Zero rather than absent. A missing variable makes `calc()` invalid and the
       whole rule is dropped, which would silently restore the old full-width
       card — working, and not what anyone asked for. */
    expect(lesson).toContain("--sx-nova-w");
    expect(lesson).toMatch(/chatOpen \? "clamp\(340px, 26vw, 400px\)" : "0px"/);
  });

  it("moves the lesson pane's own left edge, rather than padding it over", () => {
    /* The distinction the brief is emphatic about. A `margin-left` would shove
       the card sideways while its contents kept centring on the old midpoint;
       moving the pane's `left` inset genuinely narrows it, and everything
       inside — the page track, the footer's `mx-auto` pair — re-centres in what
       is left without being told the panel exists. */
    expect(lesson).toContain("lg:left-[calc(2rem+var(--sx-nova-w)+var(--sx-nova-gap,0px))]");
    expect(lesson).not.toMatch(/lg:ml-\[calc\(.*sx-nova-w/);
  });

  it("carries the top bar with the lesson it belongs to", () => {
    /* Progress and the close control are the lesson's chrome. Left stranded
       over the Nova pane they read as belonging to the chat. */
    expect(lesson).toContain("lg:pl-[calc(var(--sx-nova-w)+var(--sx-nova-gap,0px))]");
  });

  it("animates the edge instead of teleporting it", () => {
    expect(lesson).toMatch(/lg:transition-\[left,border-color\]/);
    expect(lesson).toMatch(/lg:transition-\[padding\]/);
  });
});

describe("Nova takes the left, and only where there is room", () => {
  it("is a bottom sheet below lg and a left column at lg", () => {
    /* Left rather than right, deliberately: the trigger lives bottom-left, so
       the panel arrives from where the learner tapped. A chat that opens on the
       opposite side of the screen from its own button reads as two unrelated
       things. */
    expect(chat).toContain("lg:left-8");
    expect(chat).toContain("lg:right-auto");
    expect(chat).toContain("lg:w-[var(--sx-nova-w)]");
    // The sheet, for everything narrower.
    expect(chat).toContain("h-[86dvh]");
  });

  it("never positions itself on the right at any breakpoint", () => {
    /* The previous layout was `sm:right-4 sm:left-auto`. If that comes back the
       panel covers the lesson on desktop again, which is the thing this whole
       change was for. */
    expect(chat).not.toMatch(/sm:right-4/);
    expect(chat).not.toMatch(/lg:right-4|lg:right-8/);
  });

  it("hides the floating mascot on the split, and keeps it on the sheet", () => {
    /* Two of the same mascot on screen at once makes the learner work out which
       is which. On the sheet layout the dock is behind the sheet anyway, so it
       stays — closing the sheet must not reveal an empty corner. */
    expect(lesson).toMatch(/chatOpen && "lg:pointer-events-none lg:opacity-0"/);
    expect(lesson).toContain('aria-hidden={chatOpen || undefined}');
  });
});

describe("opening Nova changes the layout and nothing else", () => {
  it("does not remount the lesson when the panel opens", () => {
    /* `chatOpen` may gate a className and an `aria-hidden`. What it must never
       do is appear in a `key`, which would remount the subtree and take the
       learner's selected option, their code, their scroll position and the
       page-track animation with it.
       Asserted as the absence of the failure rather than the presence of a fix,
       because the failure is what somebody would introduce by accident while
       "making the transition smoother". */
    expect(lesson).not.toMatch(/key=\{[^}]*chatOpen/);
    expect(lesson).not.toMatch(/\{chatOpen &&[^}]*<LessonPage/);
  });

  it("keeps the block state outside anything the panel controls", () => {
    /* `states` is the map every block's answer lives in, and it is declared
       once at the top of the component — not inside a branch, not keyed on the
       panel. This is what makes "close Nova and your answer is still there"
       true by construction rather than by testing. */
    const statesDecl = /const \[states, setStates\] = useState<Record<string, BlockState>>\(\{\}\)/;
    expect(lesson).toMatch(statesDecl);
    const idx = lesson.search(statesDecl);
    const chatIdx = lesson.indexOf("const [chatOpen");
    /* Declared before the panel's own state, i.e. at component scope. A `states`
       that moved below or inside anything conditional would be a different and
       much worse component. */
    expect(idx).toBeGreaterThan(0);
    expect(idx).toBeLessThan(chatIdx);
  });
});
