import type { Localized } from "@schools/curriculum/types";
import { SUBMIT_PROGRESS } from "@schools/presentation/labels";

/**
 * What the lesson player does between the Check press and the judge answering.
 *
 * ## The problem, measured rather than assumed
 *
 * A trusted Check is a POST to a rented judge on another continent. SolveX's
 * own share of it — auth, curriculum resolution, the claim, output checking, DB
 * settlement, serialisation, dispatch, render — is about **20 ms, 1 %**. The
 * rest is waiting for Judge0. Batching the cases took a median 8-case block
 * from **9 746 ms to 2 668 ms** (see `schools/exec/providers/judge0.ts`), and
 * that is the floor: there is no version of this where a trusted verdict
 * arrives in the same frame as the press.
 *
 * So the remaining work is not latency, it is the two and a half seconds of
 * silence. Before this module, `pending` was written into block state on every
 * press and **read by nothing**: the Check button stayed live and unchanged,
 * a second press fired a second graded submission, and the learner watched a
 * screen that had not acknowledged them at all.
 *
 * ## Why this is a `.ts` file and not part of the component
 *
 * Same reason as `blocks/run-state.ts`, and the same constraint: this suite
 * runs `node` over `tests/**\/*.test.ts` — no jsdom, no renderer. Decisions
 * that live in a component cannot be asserted; decisions that live here can be.
 * The component keeps the timers and the markup and nothing else.
 */

/** The three things a learner is told, in the order they appear. */
export type SubmitStage = "sent" | "running" | "slow";

/**
 * When each stage begins, milliseconds after the press.
 *
 * `running` at **700 ms**: below that the first line is still true — nothing
 * has come back — and swapping copy faster than a learner can read it is
 * flicker, not feedback.
 *
 * `slow` at **8 000 ms**: chosen against the measurement, not invented. A
 * median block's Check on the batched path took 2 668 ms end to end, so 8 s is
 * roughly three times a normal Check and comfortably past the 9 746 ms the
 * unbatched path used to take on the same block — i.e. it fires when something
 * really is unusual, and does not fire on an ordinary slow day. Set it at 3 s
 * and half of all Checks would tell the learner they were taking too long.
 */
export const SUBMIT_STAGE_START_MS: Readonly<Record<SubmitStage, number>> = {
  sent: 0,
  running: 700,
  slow: 8_000,
};

/** In order, so the component can schedule one timer per transition. */
export const SUBMIT_STAGES: readonly SubmitStage[] = ["sent", "running", "slow"];

/**
 * How long the progress LINE waits before it is drawn at all.
 *
 * The stage machine above starts at the press; this is a separate question and
 * the answer is not zero. Not every Check goes to Judge0 — a multiple-choice
 * block round-trips in about **13 ms** — and drawing a line of text into a
 * footer strip that was empty, for one frame, is a flicker that reads as a
 * rendering bug rather than as feedback.
 *
 * 150 ms is under the ~100 ms at which an interface stops feeling instant plus
 * a frame or two of slack, and it costs nothing in acknowledgement: the button
 * itself goes busy in the same commit as the press, so there is no moment where
 * the press looks unheard. What waits is only the sentence, and only long
 * enough for it to be worth saying.
 *
 * The stage is still measured from the press, not from here — a Check that
 * takes 800 ms shows the SECOND line when it appears, not the first one late.
 */
export const SUBMIT_PROGRESS_REVEAL_MS = 150;

/** Is the progress line drawn yet, this many milliseconds after the press? */
export function submitProgressVisible(elapsedMs: number): boolean {
  return elapsedMs >= SUBMIT_PROGRESS_REVEAL_MS;
}

/** Which line belongs on screen this many milliseconds after the press. */
export function submitStage(elapsedMs: number): SubmitStage {
  if (elapsedMs >= SUBMIT_STAGE_START_MS.slow) return "slow";
  if (elapsedMs >= SUBMIT_STAGE_START_MS.running) return "running";
  return "sent";
}

/** The sentence for a stage, in both languages. */
export function submitProgressCopy(stage: SubmitStage): Localized {
  return SUBMIT_PROGRESS[stage];
}

/**
 * The state a Check press needs to decide anything.
 *
 * Deliberately structural rather than the player's own `BlockState` type: this
 * module must not need to know what a verdict or a reveal is to answer "may
 * this press do anything".
 */
export interface PressableState {
  /** True from the press until the server answers, or fails to. */
  pending?: boolean;
  /** True when the block's own rules say the current answer is submittable. */
  answerReady: boolean;
}

/**
 * May this press start a submission?
 *
 * ## The bug it closes
 *
 * A Check is one graded attempt against a metered judge. The footer button was
 * disabled only on `!canCheckAnswer(...)`, which is about the ANSWER — so a
 * double click, an impatient second press during the 2.7 s wait, or a trackpad
 * that reports two clicks all sent a second submission for work already in
 * flight. The server holds one submission id per unchanged answer, so the
 * second one settles onto the same attempt rather than corrupting the record;
 * what it costs is real money at RapidAPI, a second run of the learner's
 * program, and a race between two responses writing the same block state.
 *
 * ## Why it is a predicate and not just a disabled attribute
 *
 * A `disabled` button is a rendering, and a rendering can be a frame behind.
 * The handler asks this too, so the guard holds even if the press arrives
 * before React has committed the disabled state.
 */
export function canPressCheck(state: PressableState): boolean {
  if (state.pending === true) return false;
  return state.answerReady;
}

/**
 * Is the footer control currently showing work in progress?
 *
 * One predicate, so the button's busy styling, its `disabled`, its `aria-busy`
 * and the progress line above it can never disagree about whether a Check is
 * running — which is the failure that produces a live-looking button with a
 * spinner in it.
 */
export function isCheckBusy(state: PressableState): boolean {
  return state.pending === true;
}
