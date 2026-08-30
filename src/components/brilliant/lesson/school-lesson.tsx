"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import type { PublicBlock, PublicLesson } from "@schools/curriculum/public";
import {
  publicCanCheck as canCheckAnswer,
  isPublicAttemptBlock as isAttemptBlock,
  NO_ANSWER,
  type BlockAnswer,
} from "@schools/learning/checking";
import type { BlockNote, BlockReveal } from "./blocks";
import type { LessonHydration } from "@schools/learning/hydration";
import type { SchoolInteraction } from "@schools/learning";
import {
  evaluateCompletion,
  levelFromVerdict,
  LESSON_COMPLETION_POLICY,
  policyBlocksFromPublic,
  type CompletionPolicy,
} from "@schools/policies/completion";
import { L, t } from "@schools/presentation/labels";
import { lessonArt } from "@schools/presentation/illustrations";
import type { LearningPayload } from "@solvex/learning-contracts";

import { Button3D } from "./button-3d";
import { ChatIcon } from "./icons";
import { NovaAvatar, useNovaState } from "@/components/nova/nova-avatar";
import { NovaChat, type NovaDraft } from "@/components/nova/nova-chat";
import { LessonTopBar } from "./lesson-chrome";
import { BlockView } from "./blocks";
import {
  cardBorderClass,
  footerMode,
  toLessonVerdict,
  type LessonVerdict,
} from "./lesson-verdict";

/**
 * The SolveX4Schools lesson runtime.
 *
 * This is the cloned player's own machinery, generalised from two hardcoded
 * pages to N curriculum blocks. Everything that made it good is kept, and kept
 * for the reason it was there:
 *
 * - **The fixed inset card whose 2px border IS the verdict channel.** Feedback
 *   arrives as the frame around the work changing colour, not as a banner
 *   pushed in under it. Nothing reflows when an answer is checked.
 * - **The horizontal page track.** Blocks sit side by side at a pitch of one
 *   card width and the track translates on a sampled overshoot curve
 *   (`ease-b-spring`). Pages are never unmounted, so a learner who steps back
 *   finds their answer where they left it.
 * - **The 80px footer strip** whose CTA pair always totals 367px, so the button
 *   does not jump between "Check" and "Try again".
 * - **The tutor dock.** Bottom left, above the card, with a speech bubble in
 *   the same hue as the card border. Koji is gone — he is Brilliant's character
 *   and his Rive file is Brilliant's asset — and Nova stands in his place,
 *   rendered from our own definition. The placement, the z-order and the bubble
 *   geometry are the original's.
 *
 * ## The one thing added rather than preserved
 *
 * A fifth verdict state. See `lesson-verdict.ts` — the original has three
 * because a scheduling puzzle is either right or wrong, while a school lesson
 * contains work no machine grades. `unmeasured` routes to the neutral arm of
 * every channel so an ungraded explanation never turns the frame amber.
 */

export interface SchoolLessonProps {
  lesson: PublicLesson;
  monthIndex: number;
  /**
   * The month this lesson belongs to. Not rendered by the player — the top bar
   * carries only progress and XP, exactly as the original does — but kept in
   * the props so the route does not have to look it up twice and so a future
   * breadcrumb has it.
   */
  monthTitle?: string;
  locale: Locale;
  backHref: string;
  /** Every genuine attempt. Wired to the learning-event ingest route. */
  onInteraction?: (interaction: SchoolInteraction) => void;
  /**
   * Grades the attempt on the server and returns the verdict.
   *
   * This is now the ONLY source of a verdict. The player used to grade
   * optimistically with a local `checkBlock` and reconcile afterwards, which
   * required the answer keys to be in the browser — and they were, all the way
   * into the page HTML. They are not any more, so the round trip is the check.
   *
   * `reveal` is whatever the server has decided the learner has earned the
   * right to see. It is never computed here.
   */
  onSubmit?: (input: {
    blockId: string;
    episodeId: string;
    /**
     * The idempotency key for THIS submission.
     *
     * Minted on the Check press and held while the answer is unchanged — see
     * `submissionFor` below. The server refuses to grade the same id twice and
     * replays the first verdict, so a double-click, a reconnect or a browser
     * retrying the POST is one attempt rather than two. Passing it through is
     * not optional: without it the route falls back to the old behaviour and
     * every retry writes another set of learning events.
     */
    submissionId: string;
    answer: BlockAnswer;
  }) => Promise<{
    verdict: "correct" | "wrong" | "partial" | "unknown";
    reveal?: BlockReveal;
    /**
     * The author's explanation of THIS wrong answer, when they established one.
     *
     * Eight of these were written for September — "3 is the result of 7 // 2;
     * choosing it means you swapped `%` and `//`" — the validator enforced that
     * they be substantial, and not one was ever rendered to anybody. A wrong
     * answer produced a colour and a generic "not quite". This is the WHY, and
     * it appears only where the author declared the wrong answer diagnostically
     * unambiguous; everywhere else the learner gets no explanation rather than
     * an invented one.
     */
    why?: string | null;
    /**
     * Whether this attempt reached the ledger.
     *
     * `false` means the answer WAS graded on the server and was NOT recorded.
     * The verdict is still real and is still shown; what must not happen is the
     * block settling as though the work were kept. Absent is treated as true,
     * so an older caller behaves exactly as before.
     */
    saved?: boolean;
    /**
     * Why nothing was measured, when nothing was.
     *
     * `unknown` covered two unrelated facts and the learner got one sentence for
     * both: a task no machine grades, and a judge that did not answer. They need
     * different words — see `L.sandboxPending` and `L.executionUnavailable`.
     */
    unmeasuredReason?: "judge_unavailable" | "not_machine_graded" | "no_trusted_judge" | null;
  } | null>;
  /** Called once when the learner reaches the end AND the policy is satisfied. */
  onComplete?: (summary: LessonSummary) => void;
  /**
   * A learner pressed Run and their own browser executed Python.
   *
   * ## Why this seam exists at all
   *
   * `run_executed` has been in the taxonomy since the contract was written,
   * `EVENT_TRUST` marks it `browser`, and `schools/nova/enforce.ts` counts it as
   * EFFORT in the hint ladder — and nothing has ever emitted it. A learner who
   * iterated ten times before asking for help accumulated zero effort in Nova's
   * eyes and was treated as somebody who wanted the answer without trying. That
   * is a live defect, not a missing feature.
   *
   * The player produces the fact; the route wrapper decides where it goes,
   * exactly as `onInteraction` and `onSubmit` already do. The payload is built
   * by `runEventPayload` and typed `LearningPayload`, so stdout, stderr and
   * source code are compile errors rather than a review comment.
   */
  onRunExecuted?: (run: { episodeId: string; occurredAt: string; payload: LearningPayload }) => void;
  /**
   * Does this deployment have an execution provider that can produce evidence?
   *
   * Threaded down to the Run panel, where `capabilityFor()` turns it into what
   * the learner is told. It is a prop and not a lookup because `schools/config.ts`
   * carries `import "server-only"` — the browser genuinely cannot know.
   *
   * Defaults to `true`, and the direction of that default is the argument: with
   * no answer the panel says only the thing that is true everywhere ("this ran
   * in your browser, it is not a check"), rather than announcing «мұғалім
   * бағалайды» to a class whose judge works perfectly well. The authoritative
   * statement arrives after a Check as `note: "no_trusted_judge"`, from the
   * server that actually knows.
   */
  trustedProviderConfigured?: boolean;
  /**
   * Which rule decides that this is finished.
   *
   * Defaults to the lesson rule. The monthly check passes the stricter one —
   * see `schools/policies/completion.ts`. Passed as a prop rather than derived
   * from the lesson id because the player is a pure function of its props and
   * "is this an assessment" is the caller's fact, not a string pattern.
   *
   * The server evaluates the SAME function over the SAME policy id when the
   * completion is posted, so this is the disabled-button half of the check and
   * never the whole of it.
   */
  policy?: CompletionPolicy;
  /**
   * An episode id minted on the server, used for every block in this session.
   *
   * Present only for a delayed re-solve, where the episode is what carries the
   * assistance reset: a fresh id means no inherited hint level, no accumulated
   * failed-attempt count and therefore no reveal, and independence measured
   * over the re-solve alone. The browser must not be able to choose it, which
   * is why it arrives as a prop from a route that got it from the database.
   */
  fixedEpisodeId?: string;
  /**
   * What the server already knows about this learner's work on this lesson.
   *
   * ## The bug this closes
   *
   * `states` below started as `{}` on every mount. So a learner who answered
   * nine blocks, was graded, had their evidence signed and written, and then
   * pressed F5, came back to a lesson that had never heard of them: `0/9` in
   * the top bar, no settled cards, and a finish button that bounced them to
   * block 1 because `evaluateCompletion` was being run over an empty map. The
   * server would have accepted the completion the whole time — `/complete`
   * evaluates the SAME policy against `blockAttempts` and knew the work was
   * done. Only the client half was blind, and only the client half was
   * reachable from the UI.
   *
   * ## Why it is a prop and not a fetch
   *
   * Same reason `trustedProviderConfigured` is. The page is a Server Component
   * that already has a session and a store; fetching after mount would mean
   * every learner sees a blank lesson for one frame, and a learner whose
   * network drops sees it for good. A wrong first frame that says "none of your
   * work is here" is the bug, briefly.
   *
   * ## What it may and may not contain
   *
   * Verdicts, attempt counts, the reveal the learner had already been shown,
   * the author's justification of their specific wrong answer, and the episode
   * a further attempt should continue. NOT the answer — it is not persisted
   * anywhere, deliberately, so a restored block shows its verdict and says the
   * answer is not being shown rather than leaving an empty editor under a green
   * border. See `schools/learning/hydration.ts`.
   *
   * Absent means "nobody looked" — a test, a storybook, a delayed re-solve.
   * Present and empty means "we looked and there is nothing".
   */
  hydration?: LessonHydration;
}

export interface LessonSummary {
  lessonId: string;
  correct: number;
  wrong: number;
  unmeasured: number;
  attempts: number;
}

interface BlockState {
  answer: BlockAnswer;
  verdict: LessonVerdict;
  /** Bumped on every check so a repeat verdict replays Nova's reaction. */
  attempt: number;
  /** True between pressing Check and the server answering. */
  pending?: boolean;
  /** What the server decided the learner may see. Never derived here. */
  reveal?: BlockReveal;
  /** The author's explanation of this specific wrong answer, if there is one. */
  why?: string;
  /**
   * What the card must say about this block's own condition, beyond its verdict.
   *
   * Four states, and they were once one. `judge_unavailable`,
   * `no_trusted_judge` and `not_machine_graded` all settle as `unmeasured` and
   * are all honest; they are three different sentences — an outage, a
   * deployment with no judge at all, and a task no machine was ever meant to
   * score. `not_saved` is different in kind: the round trip failed, so nothing
   * was graded AND nothing was recorded, and the block must not present itself
   * as settled at all.
   */
  note?: BlockNote;
  /**
   * This block settled in an EARLIER session and was read back from the server.
   *
   * It exists because the one thing hydration cannot restore is the answer:
   * `learning_events.payload` is allowlisted and `learning_submissions.response`
   * is documented to hold no learner text, both deliberately. Without this flag
   * a restored `write_code` block would render a green border around an empty
   * editor, which reads as "correct, and you wrote nothing" — a worse lie than
   * the blank card it replaced.
   *
   * With it, the card says what is true: this was answered earlier, here is the
   * verdict, the answer itself is not stored. Cleared the moment the learner
   * checks again in this session, because then it is not restored any more.
   */
  restored?: boolean;
  /** Help delivered on this block, as the ledger records it. Never client-claimed. */
  assisted?: boolean;
}

const FRESH: BlockState = { answer: NO_ANSWER, verdict: "unchecked", attempt: 0 };

/**
 * The hydration contract, turned into block states.
 *
 * Kept module-level and pure so the `useState` initialiser below can be lazy —
 * it runs once, not on every render — and so it is obvious that nothing here
 * reads or writes anything but its argument.
 *
 * `answer` used to stay `NO_ANSWER` for every restored block, and that comment
 * called it "the honest value". It was honest only because nothing had been
 * stored: the submit route graded the learner's work and threw it away. Since
 * migration 0021 the artifact is kept beside the verdict, so the honest value
 * is the work itself, and `NO_ANSWER` now means one of two specific things —
 * a row settled before 0021, or an answer kind with nothing to restore.
 * `restored` still marks the card either way.
 */
function statesFrom(hydration: LessonHydration | undefined): Record<string, BlockState> {
  const out: Record<string, BlockState> = {};
  if (!hydration) return out;
  for (const [blockId, block] of Object.entries(hydration.blocks)) {
    out[blockId] = {
      ...FRESH,
      verdict: block.verdict,
      attempt: block.attempts,
      reveal: block.reveal as BlockReveal | undefined,
      why: block.why,
      note: block.note,
      restored: true,
      assisted: block.assisted,
      /*
       * The learner's own work, put back where they left it.
       *
       * `FRESH.answer` is `NO_ANSWER`, so without this a settled coding block
       * came back with its verdict intact and an empty editor — the learner
       * was told "correct" about code that had vanished. For a written
       * explanation it was worse: they were told a teacher would read it, and
       * there was nothing left to read.
       *
       * Absent when the row predates migration 0021, or when the answer kind
       * carries nothing to restore. Falling back to `FRESH.answer` is right in
       * both cases: an empty editor beside a settled verdict is honest about a
       * historical row, where inventing source would not be.
       */
      answer: block.submitted ?? FRESH.answer,
    };
  }
  return out;
}

/**
 * The episodes a further attempt should continue rather than replace.
 *
 * This is the half of the fix that is not about pixels. Every counter that
 * gates pedagogy is keyed on the episode — the hint rung is
 * `max(level) from interventions where episode_id = $1`, the reveal counter is
 * non-accepted `verdict_received` rows on the episode, and `solveEvidence`
 * reads `assistance_delivered` the same way. A client that mints a fresh id on
 * every mount resets all three by pressing F5.
 *
 * The reset was not a shortcut to more help — it made the ladder HARDER, back
 * to `attempt_required` and three failures away from a reveal. What it did do
 * is launder help already taken: four hints in one episode, a refresh, then a
 * solve in another, and `solveEvidence` reports `assistanceDelivered: false`.
 * `scheduleFor` then files it as an independent milestone and `activityBuckets`
 * counts it as `solved_solo`. The product was fabricating "solved
 * independently" about a child who had been handed the answer.
 *
 * The server decides which episodes are eligible — it withholds the id once a
 * block is accepted, and never hands back a delayed re-solve's episode. See
 * `episodeId` in `schools/learning/hydration.ts` for both arguments.
 */
function episodesFrom(hydration: LessonHydration | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hydration) return out;
  for (const [blockId, block] of Object.entries(hydration.blocks)) {
    if (block.episodeId) out[blockId] = block.episodeId;
  }
  return out;
}

/**
 * One page past the furthest block the learner has settled.
 *
 * Landing on page 1 of a lesson eight blocks of which are done is technically
 * correct and practically hostile: it is eight swipes back to where they were.
 *
 * "Furthest settled, plus one" rather than "first unsettled", and the
 * difference is not academic. Only attempt blocks are hydrated — a concept card
 * is never settled, because asking the ledger whether somebody read a paragraph
 * would be inventing a claim. So "first unsettled" resolves to the concept card
 * at the top of every lesson and sends a learner who has finished the whole
 * thing back to page one, which is the behaviour this exists to remove.
 *
 * Nothing settled at all means page 0, unchanged.
 */
function resumePage(blocks: readonly PublicBlock[], states: Record<string, BlockState>): number {
  let furthest = -1;
  for (const [i, block] of blocks.entries()) {
    const verdict = states[block.id]?.verdict ?? "unchecked";
    if (verdict !== "unchecked") furthest = i;
  }
  if (furthest < 0) return 0;
  return Math.min(furthest + 1, blocks.length - 1);
}

/**
 * A stable string for one answer, used only to decide whether the learner has
 * changed it since the last press of Check.
 *
 * `JSON.stringify` is not enough on its own: the `grid` answer is a record
 * whose key order follows insertion, so filling two cells in the other order
 * would serialise differently for an identical answer and mint a second
 * submission id for a submission that is the same. Sorting the entries makes
 * the string a function of the ANSWER rather than of how it was typed.
 *
 * It never leaves the browser. Nothing is keyed on it server-side and no
 * request carries it — the id it guards is what travels.
 */
function answerKey(answer: BlockAnswer): string {
  if (answer.kind === "grid") {
    const cells = Object.entries(answer.cells).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return JSON.stringify({ kind: "grid", cells });
  }
  return JSON.stringify(answer);
}

/**
 * The learner's current answer, in the shape Nova's route accepts.
 *
 * One translation, in one place, from the union the lesson already keeps to the
 * flat draft the API takes. It is deliberately total over `BlockAnswer.kind` —
 * a new answer kind stops this compiling rather than silently reaching Nova as
 * nothing, which is how the tutor quietly goes blind on the one block type
 * somebody added last.
 *
 * Note what is NOT here: the verdict, the attempt count, whether it was right.
 * Those are on the server, in the ledger, and Nova reads them from there. A
 * browser that could name its own verdict could name `correct`.
 */
function draftFor(answer: BlockAnswer | undefined): NovaDraft | undefined {
  if (!answer) return undefined;
  switch (answer.kind) {
    case "option":
      return { selectedOptionId: answer.id };
    case "text":
      /* Both a prediction and an editor's contents arrive as text. The route
         does not need to know which — it has the block type from the
         curriculum, which is the trustworthy half of that question. */
      return { text: answer.value, code: answer.value };
    case "blanks":
      return { blanks: [...answer.values] };
    case "order":
      return { order: [...answer.ids] };
    case "line":
      return { line: answer.line };
    case "grid":
      return { cells: { ...answer.cells } };
    case "none":
    case "acknowledged":
      /* Nothing on screen yet. Sending an empty object would tell Nova the
         learner had answered and left it blank, which is a different and
         wronger thing than not having started. */
      return undefined;
  }
}

export function SchoolLesson({
  lesson,
  monthIndex,
  locale,
  backHref,
  onInteraction,
  onSubmit,
  onComplete,
  onRunExecuted,
  trustedProviderConfigured = true,
  policy = LESSON_COMPLETION_POLICY,
  fixedEpisodeId,
  hydration,
}: SchoolLessonProps) {
  /*
   * Lazy initialisers, and both of them read `hydration` exactly once.
   *
   * Deliberately NOT an effect. An effect would render the empty lesson first
   * and correct it on the next frame, which is the bug arriving one paint later
   * — and with `page` derived from `states`, it would also move the learner's
   * page under them after they had started reading.
   *
   * Not synced on prop change either: the props are stable for the life of a
   * lesson (the page is a `force-dynamic` Server Component, so a new state
   * means a new document), and re-seeding mid-session would overwrite work the
   * learner had just done with the server's older copy.
   */
  const [states, setStates] = useState<Record<string, BlockState>>(() => statesFrom(hydration));
  const [page, setPage] = useState(() => resumePage(lesson.blocks, statesFrom(hydration)));
  /*
   * `done` is deliberately NOT hydrated, even when the server has a completion
   * row for this lesson.
   *
   * It is a transition, not a resting state: setting it true would drop a
   * returning learner straight onto the completion card with no route back into
   * the lesson they came to re-read. With `states` restored, the completion
   * rule evaluates correctly on its own and the finish button works again,
   * which is the part that was actually broken.
   */
  const [done, setDone] = useState(false);

  /* One episode per block attempt. Minted on the client so a retried submit
     lands in the same episode rather than fragmenting one attempt into two. */
  const [chatOpen, setChatOpen] = useState(false);
  const { state: novaState, request: requestNova } = useNovaState("idle");
  const novaSize = useNovaDockSize();

  /* Seeded from the server, so an attempt after a refresh CONTINUES the episode
     its earlier attempts are in rather than opening a second one. See
     `episodesFrom` for what that repairs — the short version is that the hint
     ladder, the reveal counter and the independence measurement are all keyed
     on this id, and a fresh one silently resets all three. */
  const episodeIds = useRef<Record<string, string>>(episodesFrom(hydration));
  const episodeFor = useCallback(
    (blockId: string) => {
      /* A re-solve runs entirely inside one server-minted episode: the whole
         point is that its evidence is separable from the original attempt, and
         a client that minted its own would break the join between the review
         row and the ledger. */
      if (fixedEpisodeId) return fixedEpisodeId;
      episodeIds.current[blockId] ??= crypto.randomUUID();
      return episodeIds.current[blockId];
    },
    [fixedEpisodeId],
  );

  /*
   * The idempotency key, and the rule that decides what it identifies.
   *
   * ## The rule
   *
   *   ONE SUBMISSION ID PER (BLOCK, EXACT ANSWER).
   *
   * It is minted on the Check press, not on render — a per-render id would be a
   * fresh id for every keystroke and would deduplicate nothing — and it is held
   * in a ref for as long as the answer in the editor is unchanged. Change the
   * answer and the next press mints a new one.
   *
   * ## Why that rule and not another
   *
   * The server has to be able to tell "this submission, again" from "a second
   * genuine attempt", and it cannot see the difference from the outside: a
   * double-click, a browser retrying a POST whose response was lost, a learner
   * pressing Check again because the card said the answer was not saved, and a
   * learner who genuinely changed their mind all arrive as a second request
   * with the same shape.
   *
   * What DOES distinguish them is state the client already has: what the
   * learner typed. Keying on the answer makes the distinction a fact rather
   * than an inference about the network — and it is the honest one, because a
   * second attempt is a second thing tried, not a second network round trip.
   *
   * ## The consequences, both of them deliberate
   *
   * Re-submitting an answer already graded — unchanged — replays the first
   * verdict and records nothing new. That is right twice over: nothing new was
   * tried, and pressing Check repeatedly on the same wrong option was the
   * cheapest route to the reveal, which opens after three failed attempts.
   *
   * Editing an answer and editing it back also lands on the original id, and
   * that is the same case wearing different clothes: the learner is submitting
   * an answer they have already been told about.
   *
   * `retry` deliberately does NOT clear the held id, only the verdict. It keeps
   * the answer so the learner edits rather than restarts, and editing is what
   * mints the next id.
   */
  const submissions = useRef<Record<string, { answer: string; submissionId: string }>>({});
  const submissionFor = useCallback((blockId: string, answer: BlockAnswer) => {
    const key = answerKey(answer);
    const held = submissions.current[blockId];
    if (held && held.answer === key) return held.submissionId;
    const submissionId = crypto.randomUUID();
    submissions.current[blockId] = { answer: key, submissionId };
    return submissionId;
  }, []);

  const blocks = lesson.blocks;
  const block: PublicBlock | undefined = blocks[page];
  const state = block ? (states[block.id] ?? FRESH) : FRESH;

  /* Optional tasks are out of the denominator on purpose. A learner who does
     everything October requires of them finishes m2.l10 and used to be
     congratulated with "3 / 10" — a total the required path cannot reach, which
     reads as failure for having done exactly what was asked. */
  const attemptCount = useMemo(
    () => blocks.filter((b) => isAttemptBlock(b) && b.optional !== true).length,
    [blocks],
  );

  /* Counted from the block states, not accumulated in a counter. A block the
     learner returns to and gets right on the second pass must not count twice,
     and a derived number cannot drift from what the cards show. */
  const requiredCorrectCount = useMemo(
    () =>
      blocks.filter(
        (b) => isAttemptBlock(b) && b.optional !== true && states[b.id]?.verdict === "correct",
      ).length,
    [blocks, states],
  );

  const solvedCount = useMemo(
    () =>
      blocks.filter(
        (b) => isAttemptBlock(b) && b.optional !== true && states[b.id]?.verdict === "correct",
      ).length,
    [blocks, states],
  );

  /* The completion rule, evaluated over what is on screen.
   *
   * Reaching the last block used to BE the rule. It is now one navigation fact
   * among several, and the rule itself is `schools/policies/completion.ts` —
   * the same module, the same function and the same policy id the server runs
   * when the completion is posted. This half decides what the footer offers;
   * the server's half decides what is written down, and a client that
   * disagreed with it would simply be refused. */
  const policyBlocks = useMemo(() => policyBlocksFromPublic(blocks), [blocks]);

  const decision = useMemo(
    () =>
      evaluateCompletion({
        policy,
        blocks: policyBlocks,
        reached: (blockId) => levelFromVerdict(states[blockId]?.verdict ?? "unchecked"),
      }),
    [policy, policyBlocks, states],
  );

  const setAnswer = useCallback(
    (answer: BlockAnswer) => {
      if (!block) return;
      setStates((prev) => ({
        ...prev,
        [block.id]: { ...(prev[block.id] ?? FRESH), answer },
      }));
    },
    [block],
  );

  /**
   * Check.
   *
   * The interaction is emitted here and ONLY for attempt blocks. Emitting on
   * every block would pollute the event stream with concept cards, and the
   * downstream filter in `toGuardEvents` would be the only thing keeping
   * "reading" from counting as "trying" — a guard that lives at one end of a
   * pipe is a guard waiting to be bypassed.
   */
  const check = useCallback(() => {
    if (!block) return;
    const answer = state.answer;

    /* A concept or worked example has nothing to grade — it settles locally and
       nothing is sent. Everything else is decided by the server. */
    if (!isAttemptBlock(block)) {
      setStates((prev) => ({
        ...prev,
        [block.id]: { ...(prev[block.id] ?? FRESH), answer, verdict: "unmeasured" },
      }));
      return;
    }

    setStates((prev) => ({
      ...prev,
      [block.id]: {
        ...(prev[block.id] ?? FRESH),
        answer,
        verdict: "unchecked",
        pending: true,
        attempt: (prev[block.id]?.attempt ?? 0) + 1,
        /* The learner is answering now, so whatever is on screen from here on
           is this session's, not a restoration of an earlier one. Clearing it
           here rather than on the response is deliberate: the "answer not
           shown" line must go the moment the editor holds an answer again, not
           when the server gets back. */
        restored: false,
        /* Same reason. A stale reveal or a stale justification belongs to the
           previous answer; leaving them up while a new one is being graded
           would attach the old explanation to the new attempt. */
        reveal: undefined,
        why: undefined,
        note: undefined,
      },
    }));

    onInteraction?.({
      type: "answer_submitted",
      timestamp: Date.now(),
      blockType: block.type,
    });

    void onSubmit?.({
      blockId: block.id,
      episodeId: episodeFor(block.id),
      submissionId: submissionFor(block.id, answer),
      answer,
    })
      .then((server) => {
        /*
         * A missing answer is NOT an outcome.
         *
         * This used to fold "the server never answered" into `unmeasured` — the
         * same settled, neutral card an ungraded explanation gets — and then
         * offer Continue. The learner was shown a finished block for an answer
         * nothing had graded and nothing had stored. That is the product
         * pretending progress was saved, and it is the one thing this branch
         * must never do.
         *
         * So a lost round trip returns the block to `unchecked`: the answer
         * stays in the editor, Check comes back, and the card says why. A server
         * that answered but could not persist (`saved: false`) is the same
         * story with a real verdict attached — the verdict is shown, and the
         * block still refuses to settle.
         */
        if (!server) {
          setStates((prev) => ({
            ...prev,
            [block.id]: {
              ...(prev[block.id] ?? FRESH),
              verdict: "unchecked",
              pending: false,
              note: "not_saved",
            },
          }));
          return;
        }

        const verdict = toLessonVerdict(server.verdict);
        const persisted = server.saved !== false;
        setStates((prev) => ({
          ...prev,
          [block.id]: {
            ...(prev[block.id] ?? FRESH),
            verdict: persisted ? verdict : "unchecked",
            pending: false,
            reveal: persisted ? server.reveal : undefined,
            why: persisted ? (server.why ?? undefined) : undefined,
            note: !persisted
              ? "not_saved"
              : server.unmeasuredReason === "judge_unavailable"
                ? "judge_unavailable"
                : server.unmeasuredReason === "no_trusted_judge"
                  ? "no_trusted_judge"
                  : verdict === "unmeasured"
                    ? "not_machine_graded"
                    : undefined,
          },
        }));

        /* Nova reacts to what was measured, and only to that. `unmeasured` gets
           no reaction: the system judged nothing, so the avatar asserts
           nothing. A verdict that was not stored gets none either — reacting to
           a result the learner is about to be asked to re-submit is the avatar
           celebrating something that did not happen. */
        if (!persisted) return;
        if (verdict === "correct") requestNova("correct", 3200);
        else if (verdict === "wrong" || verdict === "partial") requestNova("incorrect", 3200);
      })
      .catch(() => {
        setStates((prev) => ({
          ...prev,
          [block.id]: {
            ...(prev[block.id] ?? FRESH),
            verdict: "unchecked",
            pending: false,
            note: "not_saved",
          },
        }));
      });
  }, [block, state.answer, onInteraction, onSubmit, episodeFor, submissionFor, requestNova]);

  /**
   * A Run happened on one block.
   *
   * The episode id is attached HERE rather than in the panel, for the same
   * reason the submit path does it here: `episodeFor` is what ties a Run, the
   * edits around it and the eventual verdict into one attempt, and a component
   * that minted its own would scatter one learner's afternoon across a dozen
   * episodes that Nova then reads as a dozen people who never tried anything.
   */
  /**
   * The last local Run per block, held in memory and never stored.
   *
   * A ref rather than state on purpose: nothing renders from it, so a run must
   * not cost a re-render of the lesson. It is read at send time by the Nova
   * panel, exactly like `states` is, and it is the other half of "Nova can see
   * the screen" — `draftFor` carries what the learner TYPED, this carries what
   * Python SAID about it.
   *
   * Cleared by nothing: the learner's last run IS the current screen until they
   * run again. It leaves the browser only inside a Nova request, fenced as
   * untrusted, and it is never written to the ledger.
   */
  const lastRuns = useRef<Record<string, unknown>>({});

  const runExecuted = useCallback(
    (blockId: string, payload: LearningPayload) => {
      onRunExecuted?.({
        episodeId: episodeFor(blockId),
        occurredAt: new Date().toISOString(),
        payload,
      });
    },
    [onRunExecuted, episodeFor],
  );

  /** Retry clears the verdict but keeps the answer, so the learner edits rather than restarts. */
  const retry = useCallback(() => {
    if (!block) return;
    setStates((prev) => ({
      ...prev,
      [block.id]: {
        ...(prev[block.id] ?? FRESH),
        verdict: "unchecked",
        reveal: undefined,
        why: undefined,
        note: undefined,
        /* Try again on a restored block puts the learner back in the editor, so
           there is nothing restored left to announce. */
        restored: false,
      },
    }));
  }, [block]);

  const advance = useCallback(() => {
    if (page < blocks.length - 1) {
      setPage((p) => p + 1);
      return;
    }

    /* The last block is not the finish line — the policy is.
     *
     * When something the rule requires is still outstanding, the learner is
     * taken to it rather than being handed a dead button. That is the whole
     * behavioural difference: a lesson used to complete because the track ran
     * out of pages, and it now completes because the rule says it did. Posting
     * anyway would be refused by the server in any case, so this is the polite
     * half of one check rather than a second, weaker one. */
    if (!decision.satisfied) {
      const next = blocks.findIndex((b) => b.id === decision.outstanding[0]?.blockId);
      if (next >= 0) setPage(next);
      return;
    }

    /* The completion record describes the REQUIRED path, all four numbers alike.
     *
     * `attempts` was already required-only while `correct` counted every block
     * the learner had settled, optional ones included — so a learner who did
     * three required tasks and seven bank tasks was recorded as `correct: 10,
     * attempts: 3`. Both numbers were defensible and the pair was not, and it
     * is what a teacher reads back months later.
     *
     * Optional work is not lost by this: every submission is recorded per block
     * in the ledger by `onSubmit`, which is the actual evidence. This row is
     * the answer to "did they finish the lesson", and finishing a lesson is
     * about the required path. */
    const counted = blocks
      .filter((b) => isAttemptBlock(b) && b.optional !== true)
      .map((b) => states[b.id])
      .filter(Boolean);
    setDone(true);
    onComplete?.({
      lessonId: lesson.id,
      correct: counted.filter((s) => s.verdict === "correct").length,
      wrong: counted.filter((s) => s.verdict === "wrong" || s.verdict === "partial").length,
      unmeasured: counted.filter((s) => s.verdict === "unmeasured").length,
      attempts: attemptCount,
    });
  }, [page, blocks, states, lesson.id, attemptCount, onComplete, decision]);

  if (done) {
    return (
      <LessonComplete
        lesson={lesson}
        states={states}
        /* Required-only, like `attemptCount` beside it. Counting every settled
           block against a required-only denominator produced "10 / 3" on the
           congratulations screen for a learner who did the optional work — the
           same defect the denominator was changed to fix, left in the
           numerator. */
        correctCount={requiredCorrectCount}
        attemptCount={attemptCount}
        locale={locale}
        backHref={backHref}
      />
    );
  }

  if (!block) return null;

  const verdict = state.verdict;
  const isAttempt = isAttemptBlock(block);
  const isOptional = block.optional === true;
  const mode = footerMode(verdict, isAttempt, isOptional);

  /* The finishing CTA, in one place because the footer renders it from two
     arms and they must never say different things.
     
     On the last page with work outstanding it says so and takes the learner
     back to that work. It is deliberately NOT a disabled button: a control that
     stops responding on the final screen of a lesson reads as the product being
     broken, and it tells the learner nothing about what is left. */
  const onLastPage = page === blocks.length - 1;
  const finishLabel = !onLastPage
    ? t(L.continue, locale)
    : decision.satisfied
      ? t(L.lessonDone, locale)
      : t(L.finishOutstanding, locale);
  /* The tutor says the specific thing when the author wrote one, and the
     generic thing otherwise. Putting it in the bubble rather than a new panel
     is deliberate: an explanation of a mistake belongs in the voice that is
     already speaking to the learner, not in a box beside it. */
  const bubble =
    verdict === "wrong"
      ? (state.why ?? t(L.kojiWrong, locale))
      : verdict === "partial"
        ? t(L.kojiPartial, locale)
        : null;


  /* Progress across the whole lesson rather than the original's per-section
     fraction — a curriculum lesson is one section, and the three trailing pills
     become the units still ahead in the month. */
  const progress = blocks.length > 1 ? (page + (verdict !== "unchecked" ? 1 : 0)) / blocks.length : 0;

  return (
    /* `lang` is what makes `hyphens: auto` work on the long compound words the
       Russian and Kazakh lesson text is full of, and it is what a screen reader
       reads the page with. */
    /* `lang` is what makes `hyphens: auto` work and what a screen reader reads
       the page with.

       `--sx-nova-w` is the width of the Nova pane, and it is the ONE number the
       split workspace is built from. Zero when the panel is closed; a clamped
       column when it is open. The lesson card's left inset and the top bar's
       left padding both read it, so the lesson genuinely contracts and its
       content re-centres inside what remains — rather than being covered by a
       panel, or shoved sideways by a margin while its own centre stays where it
       was. Below `lg` it stays 0 and Nova is a sheet; see `nova-chat.tsx`. */
    <div
      lang={locale}
      style={{ "--sx-nova-w": chatOpen ? "clamp(340px, 26vw, 400px)" : "0px" } as React.CSSProperties}
      className="flex h-[100dvh] flex-col bg-sx-page font-b-sans text-b-fg"
    >
      <div
        className={cn(
          "flex flex-1 flex-col px-3 pb-3 sm:px-8 sm:pb-8",
          /* The progress bar and the close control belong to the lesson, so
             they move with it. Left visually stranded over the Nova pane they
             would read as chrome belonging to the chat. */
          "lg:transition-[padding] lg:duration-500 lg:ease-b-spring",
          "lg:pl-[calc(var(--sx-nova-w)+var(--sx-nova-gap,0px))]",
        )}
        style={{ "--sx-nova-gap": chatOpen ? "1rem" : "0px" } as React.CSSProperties}
      >
        <LessonTopBar
          progress={progress}
          /* The reference's XP is gone: 15 points per correct answer, toward
             nothing. What replaces it is a fact — how many of this lesson's
             checkable tasks the player has actually marked correct. */
          readout={
            attemptCount > 0 ? (
              <span className="flex items-center gap-1.5 text-[16px] leading-[22.4px] font-medium tabular-nums">
                <CheckReadoutIcon done={solvedCount > 0} />
                <span className={solvedCount > 0 ? "text-b-green-2" : "text-b-fg/30"}>
                  {solvedCount}/{attemptCount}
                </span>
              </span>
            ) : null
          }
          canPrev={page > 0}
          canNext={false}
          onPrev={() => setPage((p) => Math.max(p - 1, 0))}
          closeHref={backHref}
          closeLabel={t(L.close, locale)}
        />

        <div
          data-slot="fade"
          data-visible="true"
          className="relative flex flex-1 flex-col opacity-100 transition-opacity duration-200 ease-b-enter"
        >
          {/* ---- the card: its border is the verdict channel -------------- */}
          <div
            data-panel="true"
            className={cn(
              "fixed top-16 right-3 bottom-3 left-3 z-[93] flex flex-col overflow-hidden sm:top-16 sm:right-8 sm:bottom-8 sm:left-8",
              /* The lesson pane. Its LEFT edge is where the split happens.
                 Everything inside is already centred with `mx-auto` and a flex
                 column, so narrowing the pane re-centres the question, the code,
                 the options and the Check button inside the remaining space
                 without any of them being told the panel exists. */
              "lg:left-[calc(2rem+var(--sx-nova-w)+var(--sx-nova-gap,0px))]",
              "lg:transition-[left,border-color] lg:duration-500 lg:ease-b-spring",
              "rounded-[24px] border-2 bg-b-dark transition-colors duration-300",
              cardBorderClass(verdict),
            )}
          >
            {/* horizontal page track, pages never unmounted */}
            <div className="relative flex-1 overflow-hidden">
              <div
                className="flex h-full w-full transition-transform duration-500 ease-b-spring"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                {blocks.map((b, i) => (
                  <LessonPage key={b.id}>
                    <BlockView
                      block={b}
                      locale={locale}
                      verdict={(states[b.id] ?? FRESH).verdict}
                      answer={(states[b.id] ?? FRESH).answer}
                      reveal={(states[b.id] ?? FRESH).reveal}
                      note={(states[b.id] ?? FRESH).note}
                      /* Restored from the server, with no answer to show. The
                         card says so rather than leaving a verdict-coloured
                         border around an empty editor. */
                      restored={(states[b.id] ?? FRESH).restored}
                      assisted={(states[b.id] ?? FRESH).assisted}
                      onAnswer={i === page ? setAnswer : () => {}}
                      lessonId={lesson.id}
                      monthIndex={monthIndex}
                      /* Only the page on screen preloads CPython. Every page is
                         mounted at once here, so without this a lesson with a
                         coding block at the end would start a 13 MB download
                         while the learner was still reading the first card. */
                      active={i === page}
                      trustedProviderConfigured={trustedProviderConfigured}
                      onRun={(payload) => runExecuted(b.id, payload)}
                      onRunResult={(result) => {
                        lastRuns.current[b.id] = result;
                      }}
                      art={
                        b.type === "concept" && i === 0
                          ? lessonArt(lesson.id, monthIndex)
                          : undefined
                      }
                    />
                  </LessonPage>
                ))}
              </div>
            </div>

            {/* ---- footer: 80px strip, pair always totals 367px ----------
                Below 640 the strip is pushed right by the width of the Nova
                dock. The dock is `absolute bottom-0 left-0` and the footer is
                centred, so on a 375px screen the avatar sat on top of the
                Continue button — the two controls a learner uses most, one
                covering the other. */}
            {/* Said once, above the buttons, on a task the required path does
                not need. Without it "optional" is a fact about the schema that
                no learner can observe: the Skip button appears and nothing on
                screen says why this card has one and the last one did not. */}
            {isOptional && (verdict === "unchecked" || verdict === "wrong" || verdict === "partial") ? (
              <p className="mx-auto max-w-[367px] px-4 pb-1 text-center text-[13px] leading-5 text-b-fg/60">
                {t(L.optionalNote, locale)}
              </p>
            ) : null}

            <div data-shake-stable="true" className="h-20 shrink-0">
              <div className="mx-auto flex h-full w-full max-w-[367px] items-center justify-center gap-2 bg-b-dark py-4 pl-[68px] sm:pl-0">
                {mode === "check" && (
                  <Button3D onClick={check} disabled={!canCheckAnswer(block, state.answer)}>
                    {t(L.check, locale)}
                  </Button3D>
                )}

                {/* An optional task keeps its Check — a learner who wants the
                    practice takes it — and gains the way past that every other
                    footer mode already had. */}
                {mode === "check-optional" && (
                  <>
                    <Button3D onClick={check} disabled={!canCheckAnswer(block, state.answer)}>
                      {t(L.check, locale)}
                    </Button3D>
                    {/* On the last page this control ends the lesson, so it says
                        so. Labelling it «Өткізіп жіберу» there told the learner
                        they were skipping ahead when they were finishing. */}
                    <Button3D variant="secondary" onClick={advance}>
                      {onLastPage ? finishLabel : t(L.skipOptional, locale)}
                    </Button3D>
                  </>
                )}

                {/* Wrong answer on an optional task: Try again, or move on. */}
                {mode === "retry-optional" && (
                  <>
                    <Button3D variant="warn" onClick={retry}>
                      {t(L.tryAgain, locale)}
                    </Button3D>
                    <Button3D variant="secondary" onClick={advance}>
                      {onLastPage ? finishLabel : t(L.skipOptional, locale)}
                    </Button3D>
                  </>
                )}

                {mode === "advance" && (
                  <Button3D onClick={advance}>{finishLabel}</Button3D>
                )}

                {mode === "retry" && (
                  <>
                    <Button3D
                      variant="secondary"
                      className="w-[112px] shrink-0"
                      onClick={() => setChatOpen(true)}
                    >
                      {t(L.getHelp, locale)}
                    </Button3D>
                    <Button3D variant="warn" onClick={retry}>
                      {t(L.tryAgain, locale)}
                    </Button3D>
                  </>
                )}

                {mode === "celebrate" && (
                  <>
                    <Button3D
                      variant="secondary"
                      className="w-[100px] shrink-0"
                      onClick={() => setChatOpen(true)}
                    >
                      {t(L.why, locale)}
                    </Button3D>
                    <Button3D variant="ok" onClick={advance}>
                      {finishLabel}
                    </Button3D>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- tutor toolbar, above the card -------------------------
              The reference has two controls here. The flag ("report a problem")
              is gone: nothing in this product receives a report, and a button
              that swallows a child's "this question is wrong" is worse than no
              button. Read-aloud stays because it can actually be done, and it
              only renders when the browser has a voice for the lesson's
              language. */}


          {/* ---- Nova dock --------------------------------------------
              The placement is the cloned player's, measured and kept: bottom
              left, z-856 so it sits ABOVE the z-93 card, and a speech bubble
              level with the avatar's head. Only the occupant changed.

              Hidden while the chat is open, and only on the split layout. Nova
              is already in the panel header three centimetres away; leaving the
              large floating one there too puts two of the same mascot on screen
              at once and makes the learner work out which is which. On the
              sheet layout the dock is behind the sheet anyway, so it stays —
              closing the sheet must not reveal an empty corner. */}
          <div
            aria-hidden={chatOpen || undefined}
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 z-[856] flex flex-col items-start",
              "transition-opacity duration-200",
              chatOpen && "lg:pointer-events-none lg:opacity-0",
            )}
          >
            {bubble ? (
              <div className="pointer-events-auto mb-6 ml-[76px] max-w-[262px]">
                <div
                  className={cn(
                    "rounded-[16px_16px_16px_4px] border-[0.5px] px-5 py-3",
                    "text-[16px] leading-6 font-medium text-b-fg",
                    verdict === "correct"
                      ? "border-b-ok-fill bg-b-ok-fill"
                      : "border-b-warn bg-b-warn",
                  )}
                >
                  {bubble}
                </div>
              </div>
            ) : null}

            {/* `pointer-events-auto` is load-bearing: the dock container is
                `pointer-events-none` so it never blocks the lesson beneath it,
                and anything clickable inside has to opt back in. Without it the
                avatar renders, reacts and cannot be clicked. */}
            <div className="pointer-events-auto flex items-end gap-3 pb-3 pl-3">
              <NovaAvatar
                state={novaState}
                /* 92px is the measured size and it is what the dock wants at
                   desktop. A phone footer is 80px tall, so at that width the
                   avatar is the height of the whole strip. */
                size={novaSize}
                onClick={() => setChatOpen(true)}
                label={t(L.chatWithTutor, locale)}
              />

              {/* One control, not two. The mic was never wired and a button
                  that does nothing costs more trust than an absent one. */}
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="b-glass pointer-events-auto mb-2 hidden h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-medium text-b-fg/70 transition-colors hover:text-b-fg sm:flex"
              >
                <ChatIcon size={36} className="-mx-2 -my-2" />
                {t(L.askNova, locale)}
              </button>
            </div>
          </div>

          <NovaChat
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            locale={locale}
            blockId={block.id}
            episodeId={episodeFor(block.id)}
            onStateChange={(s) => requestNova(s, s === "error" ? 4000 : 0)}
            /* Read at send time, not at mount. The learner types, then asks;
               a value captured when the panel opened would describe a screen
               from several minutes ago. `states` is the same map the card
               renders from, so Nova sees exactly what the learner sees. */
            currentDraft={() => draftFor(states[block.id]?.answer)}
            /* What their program printed, read at send time for the same
               reason. `undefined` when they have not pressed Run on this block,
               which the route keeps distinct from "ran and printed nothing". */
            currentRun={() => lastRuns.current[block.id]}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * One slot on the track. Always full width so the pitch stays exact.
 *
 * ## Optical centring, not geometric
 *
 * The original centres its page in the card, and with a scene-setter image plus
 * a heading and two paragraphs that fills the frame. A prediction block is a
 * prompt, one line of code and three options — dead-centred in an 800px card it
 * reads as lost rather than calm.
 *
 * So the content is pulled above geometric centre. That is the ordinary optical
 * correction: a block centred by measurement sits low to the eye, because the
 * reader weights the top of a frame more heavily. `pb-[6vh]` does it, and it
 * scales with the viewport instead of fighting it.
 *
 * ## Centring that cannot cut the top off
 *
 * This used to be `justify-center` on the scroll container, with a comment
 * naming the exact hazard — "`self-center` cuts the head off overflowing
 * content, silently" — and then choosing a property with the identical failure
 * mode. `justify-content: center` on a scrollable flex column distributes the
 * overflow to BOTH ends, and the top end is above the scroll origin. A browser
 * cannot scroll to a negative offset, so that part is not merely off screen: it
 * is unreachable. Measured on `/assessment/1`: content 912px in a 720px box,
 * with the task statement 96px above the first scrollable pixel.
 *
 * `my-auto` on the CHILD does the same job and degrades correctly. Auto block
 * margins absorb free space when there is any — so a short prompt sits centred
 * — and compute to zero when there is none, so a long coding task starts at the
 * top and scrolls its whole length. That is the short-vs-long rule expressed as
 * one property rather than a measurement anybody has to maintain.
 *
 * `pb-[6vh]` stays. It is the optical lift: a block centred by measurement sits
 * low to the eye because a reader weights the top of a frame more heavily. It
 * scales with the viewport, and on a long task it is simply breathing room
 * above the action bar.
 */
function LessonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col items-center overflow-y-auto px-4 py-8">
      <div
        data-lesson-page-components="true"
        className="my-auto flex w-full max-w-[540px] shrink-0 flex-col items-center gap-4 pb-[6vh]"
      >
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LessonComplete({
  lesson,
  states,
  correctCount,
  attemptCount,
  locale,
  backHref,
}: {
  lesson: PublicLesson;
  states: Record<string, BlockState>;
  correctCount: number;
  attemptCount: number;
  locale: Locale;
  backHref: string;
}) {
  const correct = correctCount;
  /* Unmeasured is a property of the whole lesson rather than of the required
     path: a block a teacher must read is a block a teacher must read whether or
     not the learner had to do it. It carries no denominator, so it does not
     produce the impossible fraction `correct` did. */
  const unmeasured = Object.values(states).filter((s) => s.verdict === "unmeasured").length;

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-b-dark px-8 font-b-sans text-b-fg">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <NovaAvatar state="celebrating" size={120} />

        <h1 className="mt-6 text-[32px] leading-[42.88px] font-bold">
          {t(L.lessonDone, locale)}
        </h1>
        <p className="mt-2 text-[16px] leading-6 text-b-fg/60">
          {t(lesson.title, locale)}
        </p>

        <dl className="mt-8 flex w-full gap-3">
          <div className="flex-1 rounded-[12px] border-2 border-b-ok bg-b-ok-panel px-4 py-3">
            <dt className="text-[13px] tracking-wide text-b-fg/60 uppercase">
              {t(L.correct, locale)}
            </dt>
            <dd className="mt-1 text-[24px] leading-[30px] font-bold tabular-nums text-b-ok-edge">
              {correct}
              <span className="text-[16px] text-b-fg/40">/{attemptCount}</span>
            </dd>
          </div>

          {/* Shown, never folded away. These are the answers no machine graded;
              hiding them would let the screen imply everything was measured. */}
          {unmeasured > 0 ? (
            <div className="flex-1 rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3">
              <dt className="text-[13px] tracking-wide text-b-fg/60 uppercase">
                {t(L.unmeasured, locale)}
              </dt>
              <dd className="mt-1 text-[24px] leading-[30px] font-bold tabular-nums text-b-fg/70">
                {unmeasured}
              </dd>
            </div>
          ) : null}
        </dl>

        <Link href={backHref} className="mt-8 w-full max-w-[367px]">
          <Button3D variant="ok">{t(L.continue, locale)}</Button3D>
        </Link>
      </div>
    </div>
  );
}

/** The readout's tick. Filled once something has actually been checked correct. */
function CheckReadoutIcon({ done }: { done: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={done ? "text-b-green-2" : "text-b-fg/25"}
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m5 8.2 2.1 2.1L11 6.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/**
 * The dock avatar's size.
 *
 * A media query rather than a CSS class because `NovaAvatar` sizes itself in
 * pixels — the whole avatar is drawn from a 240px reference and scaled, so it
 * needs a number, not a breakpoint. Falls back to the desktop size on the
 * server and before hydration, which is the size the layout was measured at.
 */
function useNovaDockSize(): number {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(min-width: 640px)");
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => (window.matchMedia("(min-width: 640px)").matches ? 92 : 56),
    () => 92,
  );
}
