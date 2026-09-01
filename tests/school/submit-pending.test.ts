import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SUBMIT_BUSY } from "@schools/presentation/labels";
import { Button3D } from "../../src/components/brilliant/lesson/button-3d";
import {
  canPressCheck,
  isCheckBusy,
  submitProgressCopy,
  submitProgressVisible,
  submitStage,
  SUBMIT_PROGRESS_REVEAL_MS,
  SUBMIT_STAGES,
  SUBMIT_STAGE_START_MS,
} from "../../src/components/brilliant/lesson/submit-progress";

/**
 * What a learner sees between pressing Check and being told the answer.
 *
 * ## The defect
 *
 * A trusted Check is a POST to a rented judge. Measured end to end on a median
 * 8-case block: **9 746 ms** before batching, **2 668 ms** after, of which
 * SolveX's own work is about 20 ms. That wait is irreducible — the verdict is
 * worth having precisely because a real compiler on a real judge produced it.
 *
 * What was NOT irreducible: for the whole of it, nothing happened on screen.
 * `school-lesson.tsx` wrote `pending: true` into block state on every press and
 * **no component read the flag**. The button stayed lit, stayed clickable, and
 * a second press sent a second graded submission to a metered judge.
 *
 * ## What is pinned here, and what cannot be
 *
 * `vitest` runs `node` over `tests/**\/*.test.ts` — no jsdom, no click. So the
 * split is the one `run-panel.test.ts` already draws:
 *
 * - the STAGE decisions are pure functions in `submit-progress.ts`, asserted
 *   directly;
 * - `Button3D`'s busy semantics are asserted by actually rendering it with
 *   `react-dom/server`, so "busy is not clickable" is a fact about the DOM
 *   rather than about the source;
 * - the WIRING in the player — that the footer asks for `busy`, and that the
 *   handler asks the guard — is asserted against the source, because there is
 *   no renderer here that could press anything.
 */

const PLAYER = path.join(
  process.cwd(),
  "src/components/brilliant/lesson/school-lesson.tsx",
);
const playerSource = readFileSync(PLAYER, "utf8");

/* -------------------------------------------------------------------------- */

describe("the three things a learner is told while the judge works", () => {
  it("changes copy at 700 ms and again at 8 s, and not before", () => {
    expect(submitStage(0)).toBe("sent");
    expect(submitStage(699)).toBe("sent");
    expect(submitStage(700)).toBe("running");
    expect(submitStage(2_668)).toBe("running"); // a measured median Check
    expect(submitStage(7_999)).toBe("running");
    expect(submitStage(8_000)).toBe("slow");
    expect(submitStage(60_000)).toBe("slow");
  });

  it("puts the second line beyond the fastest possible round trip", () => {
    /* Below this the first sentence is still true, and copy that changes faster
       than it can be read is flicker rather than feedback. */
    expect(SUBMIT_STAGE_START_MS.sent).toBe(0);
    expect(SUBMIT_STAGE_START_MS.running).toBeGreaterThanOrEqual(500);
    /* And the third has to sit clear of a NORMAL Check, or half the class is
       told they are slow. 2 668 ms was the measured median-block Check. */
    expect(SUBMIT_STAGE_START_MS.slow).toBeGreaterThan(2_668 * 2);
  });

  it("waits a moment before drawing anything, so a fast block does not flicker", () => {
    /* Not every Check is a Judge0 Check. A multiple-choice block round-trips in
       about 13 ms, and a line of text appearing in a previously empty footer
       strip for one frame reads as a rendering bug. The BUTTON acknowledges the
       press in the same commit — nothing here delays that. */
    expect(submitProgressVisible(0)).toBe(false);
    expect(submitProgressVisible(13)).toBe(false);
    expect(submitProgressVisible(SUBMIT_PROGRESS_REVEAL_MS)).toBe(true);
    expect(submitProgressVisible(2_668)).toBe(true);
    /* And it must stay well under the point at which an interface stops
       feeling immediate, or it becomes the dead period it exists to avoid. */
    expect(SUBMIT_PROGRESS_REVEAL_MS).toBeLessThan(300);
  });

  it("reveals the stage the clock is actually on, not the first one late", () => {
    /* An 800 ms Check shows the second sentence when the line appears. The
       reveal delays the drawing; it does not restart the sequence. */
    expect(submitStage(SUBMIT_PROGRESS_REVEAL_MS)).toBe("sent");
    expect(submitStage(800)).toBe("running");
  });

  it("says all three sentences in both languages", () => {
    for (const stage of SUBMIT_STAGES) {
      const copy = submitProgressCopy(stage);
      /* Kazakh is still DRAFT, but a missing locale is not a draft — it is a
         Russian sentence in a Kazakh lesson. */
      expect(copy.ru.trim().length).toBeGreaterThan(0);
      expect(copy.kk.trim().length).toBeGreaterThan(0);
      expect(copy.kk).not.toBe(copy.ru);
    }
    expect(SUBMIT_BUSY.ru.trim().length).toBeGreaterThan(0);
    expect(SUBMIT_BUSY.kk.trim().length).toBeGreaterThan(0);
  });

  it("says three different things, so the change is visible", () => {
    const ru = SUBMIT_STAGES.map((s) => submitProgressCopy(s).ru);
    const kk = SUBMIT_STAGES.map((s) => submitProgressCopy(s).kk);
    expect(new Set(ru).size).toBe(3);
    expect(new Set(kk).size).toBe(3);
  });

  it("never invents a number about the learner's program", () => {
    /* The one rule this copy exists under. The browser does not know how many
       cases have finished — the trusted judge reports once, at the end — so
       "3 / 8 тестов пройдено" or a percentage would be a fabricated claim in
       the one part of the product whose whole value is that its claims are
       earned. No digits, no `%`, in either language. */
    for (const stage of SUBMIT_STAGES) {
      const copy = submitProgressCopy(stage);
      expect(copy.ru).not.toMatch(/[0-9%]/);
      expect(copy.kk).not.toMatch(/[0-9%]/);
    }
  });

  it("does not call a slow judge a broken one", () => {
    /* At 8 s nothing has gone wrong yet: a slow judge and a dead one are
       indistinguishable from the browser, and only the answer separates them.
       The line reports the wait, and the real failure path — `not_saved`,
       `judge_unavailable` — reports the failure. */
    const slow = submitProgressCopy("slow");
    expect(slow.ru).toMatch(/времени/);
    expect(slow.ru).not.toMatch(/ошибк|сбой|не удалось/i);
    expect(slow.kk).not.toMatch(/қате/i);
  });
});

/* -------------------------------------------------------------------------- */

describe("one press is one submission", () => {
  it("refuses a second press while the first is still in flight", () => {
    expect(canPressCheck({ pending: false, answerReady: true })).toBe(true);
    expect(canPressCheck({ pending: true, answerReady: true })).toBe(false);
    /* The double click, stated as the sequence it actually is. */
    expect(canPressCheck({ pending: undefined, answerReady: true })).toBe(true);
  });

  it("still refuses a press with no submittable answer", () => {
    expect(canPressCheck({ pending: false, answerReady: false })).toBe(false);
  });

  it("is the same flag the footer renders from", () => {
    /* Two predicates over one field, so a busy-looking button cannot be a
       clickable one and a clickable one cannot look busy. */
    expect(isCheckBusy({ pending: true, answerReady: true })).toBe(true);
    expect(isCheckBusy({ pending: false, answerReady: true })).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */

describe("Button3D, actually rendered", () => {
  const render = (props: Record<string, unknown>) =>
    renderToStaticMarkup(createElement(Button3D, { ...props, children: "Проверить" } as never));

  it("is clickable and unadorned when idle", () => {
    const html = render({});
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("aria-busy");
    expect(html).not.toContain("button3d-spinner");
  });

  it("cannot be pressed again while busy", () => {
    /* The DOM-level half of the double-click guard. The handler's own
       `canPressCheck` is the other half, and it exists because this attribute
       can be one frame behind the click. */
    const html = render({ busy: true, busyLabel: "Идёт проверка" });
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
  });

  it("keeps its label and its colour, and adds a spinner", () => {
    const html = render({ busy: true, busyLabel: "Идёт проверка" });
    /* The label does not change. A control that renames itself mid-press is
       harder to follow, not easier — the sentence lives in the live region. */
    expect(html).toContain("Проверить");
    expect(html).toContain("button3d-spinner");
    expect(html).toContain("Идёт проверка");
    /* NOT the disabled grey. `bg-b-panel text-b-dim` is the styling of a
       control that is not available to you, which is the wrong thing to say
       about a press that landed and is working. */
    expect(html).not.toContain("bg-b-panel");
  });

  it("holds the pressed geometry rather than animating something new", () => {
    const html = render({ busy: true, busyLabel: "x" });
    expect(html).toContain("[--button3d-translate-y:0px]");
    expect(html).toContain("[--button3d-shadow-y:0px]");
  });

  it("draws no progress bar, because there is no honest progress to draw", () => {
    const html = render({ busy: true, busyLabel: "x" });
    expect(html).toContain("animate-spin");
    expect(html).not.toMatch(/role="progressbar"|aria-valuenow/);
  });

  it("still greys out a genuinely unavailable button", () => {
    const html = render({ disabled: true });
    expect(html).toContain("disabled");
    expect(html).toContain("bg-b-panel");
    expect(html).not.toContain("aria-busy");
  });
});

/* -------------------------------------------------------------------------- */

describe("the player is wired to all of it", () => {
  it("reads the pending flag it has always written", () => {
    /* The regression that started this: `pending: true` was set on every press
       and read by nothing. */
    expect(playerSource).toContain("isCheckBusy({ pending: state.pending");
  });

  it("asks the guard before sending, not only before rendering", () => {
    expect(playerSource).toContain("canPressCheck({ pending: state.pending");
    /* And the callback re-creates itself when the flag changes, or it closes
       over a stale `false` and the guard never fires. */
    expect(playerSource).toContain("state.pending,");
  });

  it("gives every Check button the busy state", () => {
    const checkButtons = playerSource.match(/<Button3D\b[^>]*?onClick=\{check\}[\s\S]*?>/g) ?? [];
    expect(checkButtons.length).toBeGreaterThan(0);
    for (const button of checkButtons) expect(button).toContain("busy={checkBusy}");
  });

  it("shows the progress line without covering the learner's code", () => {
    expect(playerSource).toContain('data-slot="check-progress"');
    expect(playerSource).toContain("submitProgressCopy(progressStage)");
    /* And it is not drawn at all until the reveal delay has passed, which is
       what keeps a 13 ms multiple-choice Check from flashing a line of text. */
    expect(playerSource).toContain("checkBusy && progressStage !== null");
    expect(playerSource).toContain("SUBMIT_PROGRESS_REVEAL_MS");
    /* Announced, because it changes while the learner is not touching
       anything — and `polite`, so it waits its turn. */
    expect(playerSource).toContain('aria-live="polite"');
    /* No dialog, no overlay, no scrim. The line lives in the footer strip the
       optional note already owned, so nothing on the card moves. */
    const progressRegion = playerSource.slice(
      playerSource.indexOf('data-slot="check-progress"') - 1200,
      playerSource.indexOf('data-slot="check-progress"') + 600,
    );
    expect(progressRegion).not.toMatch(/role="dialog"|fixed inset-0|backdrop/);
  });

  it("leaves Try again reachable after a failure, so a retry is still possible", () => {
    /* Every settle path clears `pending`, including the two failure ones —
       otherwise a provider outage would leave the learner holding a button
       that is busy for ever and an answer they cannot re-submit. */
    const settles = playerSource.match(/pending: false/g) ?? [];
    expect(settles.length).toBeGreaterThanOrEqual(3);
    expect(playerSource).toContain('note: "not_saved"');
  });
});
