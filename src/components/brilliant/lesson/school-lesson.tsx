"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Lesson, LessonBlock, Locale } from "@schools/curriculum/types";
import {
  canCheck as canCheckAnswer,
  checkBlock,
  isAttemptBlock,
  NO_ANSWER,
  type BlockAnswer,
} from "@schools/learning/checking";
import type { SchoolInteraction } from "@schools/learning";
import { L, t } from "@schools/presentation/labels";
import { lessonArt } from "@schools/presentation/illustrations";

import { Button3D } from "./button-3d";
import { ChatIcon, FlagIcon, MicIcon, SpeakerIcon } from "./icons";
import { Koji, KojiBubble } from "./koji";
import { LessonTopBar } from "./lesson-chrome";
import { BlockView } from "./blocks";
import {
  cardBorderClass,
  footerMode,
  kojiReaction,
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
 * - **Koji.** A real Rive artboard reacting to the verdict, with a speech
 *   bubble in the same hue as the card border.
 *
 * ## The one thing added rather than preserved
 *
 * A fifth verdict state. See `lesson-verdict.ts` — the original has three
 * because a scheduling puzzle is either right or wrong, while a school lesson
 * contains work no machine grades. `unmeasured` routes to the neutral arm of
 * every channel so an ungraded explanation never turns the frame amber.
 */

export interface SchoolLessonProps {
  lesson: Lesson;
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
   * Records the attempt on the server, which re-grades it against the
   * curriculum and returns the authoritative verdict.
   *
   * The local `checkBlock` still runs first so the card border changes on the
   * same frame as the tap — that responsiveness is worth keeping. But the
   * client's verdict is not evidence: a learner with DevTools can post any
   * outcome they like. When the server disagrees, the server wins and the UI
   * corrects itself.
   */
  onSubmit?: (input: {
    blockId: string;
    episodeId: string;
    answer: BlockAnswer;
  }) => Promise<{ verdict: "correct" | "wrong" | "partial" | "unknown" } | null>;
  /** Called once when the learner reaches the end. */
  onComplete?: (summary: LessonSummary) => void;
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
  /** Bumped on every check so a repeat verdict replays Koji's reaction. */
  attempt: number;
  failureClass?: string;
}

const FRESH: BlockState = { answer: NO_ANSWER, verdict: "unchecked", attempt: 0 };

export function SchoolLesson({
  lesson,
  monthIndex,
  locale,
  backHref,
  onInteraction,
  onSubmit,
  onComplete,
}: SchoolLessonProps) {
  const [page, setPage] = useState(0);
  const [states, setStates] = useState<Record<string, BlockState>>({});
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  /* One episode per block attempt. Minted on the client so a retried submit
     lands in the same episode rather than fragmenting one attempt into two. */
  const episodeIds = useRef<Record<string, string>>({});
  const episodeFor = useCallback((blockId: string) => {
    episodeIds.current[blockId] ??= crypto.randomUUID();
    return episodeIds.current[blockId];
  }, []);

  const blocks = lesson.blocks;
  const block: LessonBlock | undefined = blocks[page];
  const state = block ? (states[block.id] ?? FRESH) : FRESH;

  const attemptCount = useMemo(
    () => blocks.filter(isAttemptBlock).length,
    [blocks],
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

    // Optimistic frame: the same pure function the server will run, so the two
    // agree in every ordinary case and the border does not flicker.
    const local = checkBlock(block, state.answer);
    const verdict = toLessonVerdict(local.verdict);
    const answer = state.answer;

    setStates((prev) => ({
      ...prev,
      [block.id]: {
        answer,
        verdict,
        attempt: (prev[block.id]?.attempt ?? 0) + 1,
        failureClass: local.failureClass,
      },
    }));

    if (verdict === "correct") setXp((x) => x + 15);

    if (isAttemptBlock(block)) {
      onInteraction?.({
        type: "answer_submitted",
        timestamp: Date.now(),
        blockType: block.type,
      });

      // The authoritative pass. Fire-and-reconcile: the learner is not made to
      // wait for it, and a network failure leaves the optimistic verdict on
      // screen rather than blanking the card.
      void onSubmit?.({ blockId: block.id, episodeId: episodeFor(block.id), answer })
        .then((server) => {
          if (!server) return;
          const authoritative = toLessonVerdict(server.verdict);
          setStates((prev) => {
            const cur = prev[block.id];
            if (!cur || cur.verdict === authoritative) return prev;
            return { ...prev, [block.id]: { ...cur, verdict: authoritative } };
          });
        })
        .catch(() => {
          /* Recording failed. The lesson continues; the sweep will simply have
             nothing to fold in for this attempt. */
        });
    }
  }, [block, state.answer, onInteraction, onSubmit, episodeFor]);

  /** Retry clears the verdict but keeps the answer, so the learner edits rather than restarts. */
  const retry = useCallback(() => {
    if (!block) return;
    setStates((prev) => ({
      ...prev,
      [block.id]: { ...(prev[block.id] ?? FRESH), verdict: "unchecked" },
    }));
  }, [block]);

  const advance = useCallback(() => {
    if (page < blocks.length - 1) {
      setPage((p) => p + 1);
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
  }, [page, blocks.length, states, lesson.id, attemptCount, onComplete]);

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
  const reaction = kojiReaction(verdict);

  /* Progress across the whole lesson rather than the original's per-section
     fraction — a curriculum lesson is one section, and the three trailing pills
     become the units still ahead in the month. */
  const progress = blocks.length > 1 ? (page + (verdict !== "unchecked" ? 1 : 0)) / blocks.length : 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-b-dark font-b-sans text-white">
      <div className="flex flex-1 flex-col px-8 pb-8">
        <LessonTopBar
          progress={progress}
          xp={xp}
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
              "fixed top-16 right-8 bottom-8 left-8 z-[93] flex flex-col overflow-hidden",
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

            {/* ---- footer: 80px strip, pair always totals 367px ---------- */}
            <div data-shake-stable="true" className="h-20 shrink-0">
              <div className="mx-auto flex h-full w-full max-w-[367px] items-center justify-center gap-2 bg-b-dark px-0 py-4">
                {mode === "check" && (
                  <Button3D onClick={check} disabled={!canCheckAnswer(block, state.answer)}>
                    {t(L.check, locale)}
                  </Button3D>
                )}

                {mode === "advance" && (
                  <Button3D onClick={advance}>
                    {page === blocks.length - 1
                      ? t(L.lessonDone, locale)
                      : t(L.continue, locale)}
                  </Button3D>
                )}

                {mode === "retry" && (
                  <>
                    <Button3D variant="secondary" className="w-[112px] shrink-0">
                      {t(L.getHelp, locale)}
                    </Button3D>
                    <Button3D variant="warn" onClick={retry}>
                      {t(L.tryAgain, locale)}
                    </Button3D>
                  </>
                )}

                {mode === "celebrate" && (
                  <>
                    <Button3D variant="secondary" className="w-[100px] shrink-0">
                      {t(L.why, locale)}
                    </Button3D>
                    <Button3D variant="ok" onClick={advance}>
                      {page === blocks.length - 1
                        ? t(L.lessonDone, locale)
                        : t(L.continue, locale)}
                    </Button3D>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- tutor toolbar, above the card ------------------------- */}
          <div
            data-tutor-toolbar="true"
            className="absolute top-0 left-0 z-[95] flex w-16 flex-col items-start gap-2 px-2 pt-5 pb-8"
          >
            <button
              type="button"
              aria-label={t(L.reportProblem, locale)}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[54px] text-white/20 transition-colors hover:text-white/50"
            >
              <FlagIcon />
            </button>
            <button
              type="button"
              aria-label={t(L.readAloud, locale)}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[54px] text-white/20 transition-colors hover:text-white/50"
            >
              <SpeakerIcon />
            </button>
          </div>

          {/* ---- Koji dock -------------------------------------------- */}
          <div className="pointer-events-none absolute bottom-0 left-0 z-[856] flex flex-col items-start">
            {verdict === "wrong" || verdict === "partial" ? (
              <div className="pointer-events-auto mb-8 ml-[84px]">
                <KojiBubble>
                  {t(verdict === "partial" ? L.kojiPartial : L.kojiWrong, locale)}
                </KojiBubble>
              </div>
            ) : null}

            <div className="flex items-end gap-4">
              <Koji
                verdict={reaction === null ? "unchecked" : reaction}
                attempt={state.attempt}
                className="-ml-8"
              />

              <div className="b-glass pointer-events-auto mb-3 flex h-[52px] w-[120px] items-center rounded-full">
                <button
                  type="button"
                  aria-label={t(L.chatWithTutor, locale)}
                  className="flex h-[52px] w-[60px] cursor-pointer items-center justify-center rounded-l-full border-[0.5px] border-transparent text-white/20 transition-colors hover:text-white/60"
                >
                  <ChatIcon size={48} className="-mx-[14px] -mt-4 -mb-[14px]" />
                </button>
                <span className="h-11 w-px bg-white/10" />
                <button
                  type="button"
                  aria-label={t(L.answerWithVoice, locale)}
                  className="flex h-[52px] w-[60px] cursor-pointer items-center justify-center rounded-r-full border-[0.5px] border-transparent text-white/20 transition-colors hover:text-white/60"
                >
                  <MicIcon size={48} className="-mx-[17px] -mt-4 -mb-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One slot on the track. Always full width so the pitch stays exact. */
function LessonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full shrink-0 justify-center overflow-y-auto px-4 py-8">
      <div
        data-lesson-page-components="true"
        className="flex w-full max-w-[540px] flex-col items-center gap-4 self-center"
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
  lesson: Lesson;
  states: Record<string, BlockState>;
  attemptCount: number;
  locale: Locale;
  backHref: string;
}) {
  const values = Object.values(states);
  const correct = values.filter((s) => s.verdict === "correct").length;
  const unmeasured = values.filter((s) => s.verdict === "unmeasured").length;

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-b-dark px-8 font-b-sans text-white">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <Koji verdict="right" attempt={1} />

        <h1 className="mt-6 text-[32px] leading-[42.88px] font-bold">
          {t(L.lessonDone, locale)}
        </h1>
        <p className="mt-2 text-[16px] leading-6 text-white/60">
          {t(lesson.title, locale)}
        </p>

        <dl className="mt-8 flex w-full gap-3">
          <div className="flex-1 rounded-[12px] border-2 border-b-ok bg-b-ok-panel px-4 py-3">
            <dt className="text-[13px] tracking-wide text-white/60 uppercase">
              {t(L.correct, locale)}
            </dt>
            <dd className="mt-1 text-[24px] leading-[30px] font-bold tabular-nums text-b-ok-edge">
              {correct}
              <span className="text-[16px] text-white/40">/{attemptCount}</span>
            </dd>
          </div>

          {/* Shown, never folded away. These are the answers no machine graded;
              hiding them would let the screen imply everything was measured. */}
          {unmeasured > 0 ? (
            <div className="flex-1 rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3">
              <dt className="text-[13px] tracking-wide text-white/60 uppercase">
                {t(L.unmeasured, locale)}
              </dt>
              <dd className="mt-1 text-[24px] leading-[30px] font-bold tabular-nums text-white/70">
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
