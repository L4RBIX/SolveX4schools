"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

import { Button3D } from "./button-3d";
import { ChatIcon, SpeakerIcon } from "./icons";
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
    unmeasuredReason?: "judge_unavailable" | "not_machine_graded" | null;
  } | null>;
  /** Called once when the learner reaches the end AND the policy is satisfied. */
  onComplete?: (summary: LessonSummary) => void;
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
   * Three states, and they were previously one. `judge_unavailable` and
   * `not_machine_graded` both settle as `unmeasured` and are both honest; they
   * are not the same sentence. `not_saved` is different in kind — the round trip
   * failed, so nothing was graded AND nothing was recorded, and the block must
   * not present itself as settled at all.
   */
  note?: BlockNote;
}

const FRESH: BlockState = { answer: NO_ANSWER, verdict: "unchecked", attempt: 0 };

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
  policy = LESSON_COMPLETION_POLICY,
  fixedEpisodeId,
}: SchoolLessonProps) {
  const [page, setPage] = useState(0);
  const [states, setStates] = useState<Record<string, BlockState>>({});
  const [done, setDone] = useState(false);

  /* One episode per block attempt. Minted on the client so a retried submit
     lands in the same episode rather than fragmenting one attempt into two. */
  const [chatOpen, setChatOpen] = useState(false);
  const { state: novaState, request: requestNova } = useNovaState("idle");
  const novaSize = useNovaDockSize();

  const episodeIds = useRef<Record<string, string>>({});
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

  const blocks = lesson.blocks;
  const block: PublicBlock | undefined = blocks[page];
  const state = block ? (states[block.id] ?? FRESH) : FRESH;

  const attemptCount = useMemo(
    () => blocks.filter((b) => isAttemptBlock(b)).length,
    [blocks],
  );

  /* Counted from the block states, not accumulated in a counter. A block the
     learner returns to and gets right on the second pass must not count twice,
     and a derived number cannot drift from what the cards show. */
  const solvedCount = useMemo(
    () => blocks.filter((b) => isAttemptBlock(b) && states[b.id]?.verdict === "correct").length,
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
      },
    }));

    onInteraction?.({
      type: "answer_submitted",
      timestamp: Date.now(),
      blockType: block.type,
    });

    void onSubmit?.({ blockId: block.id, episodeId: episodeFor(block.id), answer })
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
  }, [block, state.answer, onInteraction, onSubmit, episodeFor, requestNova]);

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

    const values = Object.values(states);
    setDone(true);
    onComplete?.({
      lessonId: lesson.id,
      correct: values.filter((s) => s.verdict === "correct").length,
      wrong: values.filter((s) => s.verdict === "wrong" || s.verdict === "partial").length,
      unmeasured: values.filter((s) => s.verdict === "unmeasured").length,
      attempts: attemptCount,
    });
  }, [page, blocks, states, lesson.id, attemptCount, onComplete, decision]);

  if (done) {
    return (
      <LessonComplete
        lesson={lesson}
        states={states}
        attemptCount={attemptCount}
        locale={locale}
        backHref={backHref}
      />
    );
  }

  if (!block) return null;

  const verdict = state.verdict;
  const isAttempt = isAttemptBlock(block);
  const mode = footerMode(verdict, isAttempt);

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

  /* What read-aloud says: the block's own words, never the code inside it.
     Reading `print("2 + 2")` character by character helps nobody, and reading a
     heading plus its body is what a learner asked for. */
  const spokenText = [
    block.type === "concept" ? block.title[locale] : null,
    block.type === "concept" ? block.body[locale] : null,
    "prompt" in block ? block.prompt[locale] : null,
  ]
    .filter(Boolean)
    .join(". ");

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
                      onAnswer={i === page ? setAnswer : () => {}}
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
            <div data-shake-stable="true" className="h-20 shrink-0">
              <div className="mx-auto flex h-full w-full max-w-[367px] items-center justify-center gap-2 bg-b-dark py-4 pl-[68px] sm:pl-0">
                {mode === "check" && (
                  <Button3D onClick={check} disabled={!canCheckAnswer(block, state.answer)}>
                    {t(L.check, locale)}
                  </Button3D>
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
          <ReadAloud
            /* Keyed on the block: moving to the next page remounts this, whose
               effect cleanup cancels whatever was still being spoken. Resetting
               the same instance from an effect does the same job one render
               later and trips the cascading-render rule. */
            key={block.id}
            locale={locale}
            text={spokenText}
            label={t(L.readAloud, locale)}
            stopLabel={t(L.close, locale)}
          />

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
 * `justify-center` rather than `self-center` so a page taller than the card
 * scrolls from its top instead of having its head cut off — which is what
 * `self-center` does to overflowing content, silently.
 */
function LessonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col items-center justify-center overflow-y-auto px-4 py-8">
      <div
        data-lesson-page-components="true"
        className="flex w-full max-w-[540px] shrink-0 flex-col items-center gap-4 pb-[6vh]"
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
  attemptCount,
  locale,
  backHref,
}: {
  lesson: PublicLesson;
  states: Record<string, BlockState>;
  attemptCount: number;
  locale: Locale;
  backHref: string;
}) {
  const values = Object.values(states);
  const correct = values.filter((s) => s.verdict === "correct").length;
  const unmeasured = values.filter((s) => s.verdict === "unmeasured").length;

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
 * Read the block aloud.
 *
 * `speechSynthesis` is the browser's, so this costs nothing and sends nothing
 * anywhere. It renders ONLY when a voice for the lesson's language is actually
 * installed: Russian is near-universal, Kazakh is not, and a speaker icon that
 * produces silence — or worse, reads Kazakh in a Russian accent — is the kind of
 * detail a classroom notices immediately.
 *
 * Voices arrive asynchronously in every browser, which is why this listens for
 * `voiceschanged` rather than reading the list once at mount.
 *
 * Mounted with `key={block.id}`, so a page turn remounts it and the effect
 * cleanup below stops the previous block mid-sentence.
 */
function ReadAloud({
  locale,
  text,
  label,
  stopLabel,
}: {
  locale: Locale;
  text: string;
  label: string;
  stopLabel: string;
}) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const tag = locale === "kk" ? "kk" : "ru";

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const pick = () =>
      setVoice(synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(tag)) ?? null);
    pick();
    synth.addEventListener("voiceschanged", pick);
    return () => {
      synth.removeEventListener("voiceschanged", pick);
      synth.cancel();
    };
  }, [tag]);

  if (!voice || !text) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div
      data-tutor-toolbar="true"
      className="absolute top-0 left-0 z-[95] flex w-16 flex-col items-start gap-2 px-2 pt-5 pb-8"
    >
      <button
        type="button"
        aria-label={speaking ? stopLabel : label}
        aria-pressed={speaking}
        onClick={toggle}
        className={cn(
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded-[54px] transition-colors",
          speaking ? "text-b-green-2" : "text-b-fg/20 hover:text-b-fg/50",
        )}
      >
        <SpeakerIcon />
      </button>
    </div>
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
