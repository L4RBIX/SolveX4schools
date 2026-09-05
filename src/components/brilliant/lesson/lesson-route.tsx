"use client";

import { useCallback, useEffect } from "react";
import type { PublicLesson } from "@schools/curriculum/public";
import type { Localized } from "@schools/curriculum/types";
import type { LessonHydration } from "@schools/learning/hydration";
import type { SchoolInteraction } from "@schools/learning";
import type { BlockAnswer } from "@schools/learning/checking";
import type { LearningPayload } from "@solvex/learning-contracts";
import { useLocale } from "@/components/sx/i18n";
import { markLessonComplete, setCurrentLesson } from "@/lib/progress";
import { flushPending, postOrQueue } from "@/lib/pending-writes";
import { SchoolLesson, type LessonSummary } from "./school-lesson";
import type { BlockReveal } from "./blocks";

/**
 * Client wrapper: locale, progress and the learning-event seam.
 *
 * Kept separate from `SchoolLesson` so the player itself stays a pure function
 * of its props and can be rendered in a test, a storybook or a teacher preview
 * without dragging storage and routing along with it.
 */
export function LessonRoute({
  lesson,
  monthIndex,
  monthTitle,
  trustedProviderConfigured,
  hydration,
  contestSeconds,
  nextLesson,
}: {
  lesson: PublicLesson;
  monthIndex: number;
  monthTitle: string;
  /**
   * The lesson after this one in TEACHING order, resolved on the server.
   *
   * Teaching order is the month file's array order, and the client holds only
   * this one lesson — so "the next one" cannot be derived here. `null` at the
   * end of a month, where the map is the right destination.
   */
  nextLesson?: { id: string; title: Localized } | null;
  /**
   * Seconds left on a timed practice contest, computed on the SERVER.
   *
   * `null` for every lesson that is not one of May's contests. Seconds rather
   * than a start instant on purpose: the deadline is then not a function of the
   * device's clock, and a second tab cannot start a fresh countdown. See
   * `schools/learning/contest.ts`.
   */
  contestSeconds?: number | null;
  /**
   * Whether this deployment has an execution provider that can produce
   * evidence, read on the server and passed straight through to the player.
   *
   * `schools/config.ts` carries `import "server-only"`, so the browser cannot
   * answer this for itself — the page must call `trustedProviderConfigured()`
   * and hand the answer down. Absent, the Run panel says only what is true
   * everywhere ("this ran in your browser, it is not a check") rather than
   * announcing a teacher-review fallback that may not apply.
   */
  trustedProviderConfigured?: boolean;
  /**
   * The learner's own work on this lesson, as the server already has it.
   *
   * Read on the SERVER and passed straight through, exactly like
   * `trustedProviderConfigured` above and for one of the same reasons: the
   * browser cannot answer it. It also must not be given the chance to — every
   * field here is a statement about what a learner did, and a client that could
   * name its own verdict could name `correct`.
   *
   * Passing it as a prop rather than fetching it after mount is what keeps the
   * learner from seeing an empty lesson for one frame. See
   * `schools/learning/rehydrate.ts`.
   */
  hydration?: LessonHydration;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    setCurrentLesson(lesson.id);
  }, [lesson.id]);

  /*
   * Anything that failed to reach the server last time, sent again now.
   *
   * Opening a lesson is the right moment: the learner is online (this page came
   * over the network), it is before the work that might fail rather than after,
   * and it costs nothing when the queue is empty — which is almost always.
   *
   * Deliberately not on an interval and not on `online`. A school's Wi-Fi
   * flaps, and a listener that fires on every flap turns eighteen laptops into
   * a retry storm against the box that was already struggling.
   */
  useEffect(() => {
    void flushPending();
  }, []);

  /**
   * The learning-event seam.
   *
   * Only genuine attempts reach it — `SchoolLesson` filters on
   * `ATTEMPT_BLOCK_TYPES` before calling. Filtering at the source rather than
   * downstream matters: a ledger that records reading as trying makes every
   * number built on it softer, and a guard that lives only at the far end of a
   * pipe is a guard waiting to be bypassed.
   */
  const onInteraction = useCallback((interaction: SchoolInteraction) => {
    void fetch("/api/learning/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // The learner never waits for this and never sees it fail.
      keepalive: true,
      body: JSON.stringify({
        events: [
          {
            eventName: "statement_revisited",
            occurredAt: new Date(interaction.timestamp).toISOString(),
            payload: { is_revisit: false },
          },
        ],
      }),
    }).catch(() => {});
  }, []);

  /**
   * `run_executed` — the event nothing has ever written.
   *
   * It is in the taxonomy, `EVENT_TRUST` marks it `browser`, ingest's
   * `isClientReportable` already accepts it, and `schools/nova/enforce.ts`
   * counts it as effort in the hint ladder. Until now no producer existed, so a
   * learner who ran their program ten times and then asked for help looked
   * identical to one who asked for help immediately, and the ladder refused to
   * climb. This closes that.
   *
   * Sent on the same fire-and-forget terms as `statement_revisited` above: the
   * learner never waits for it and never sees it fail. A Run is not evidence —
   * it is context — and blocking the output panes on a POST would make the one
   * fast thing in the product feel like the slow one.
   *
   * `payload` arrives already built by `runEventPayload` and typed
   * `LearningPayload`, which is what keeps stdout, stderr and the source out of
   * it at compile time. The ingest route runs `sanitizePayload` over it again
   * regardless, because a browser is not trusted to police itself.
   */
  const onRunExecuted = useCallback(
    (run: { episodeId: string; occurredAt: string; payload: LearningPayload }) => {
      void fetch("/api/learning/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          events: [
            {
              episodeId: run.episodeId,
              eventName: "run_executed",
              occurredAt: run.occurredAt,
              payload: run.payload,
            },
          ],
        }),
      }).catch(() => {});
    },
    [],
  );

  /**
   * The authoritative grading pass.
   *
   * The server re-grades against the curriculum, writes the events itself and
   * signs the result. Its verdict is what reaches the ledger; the client's was
   * only ever a frame of paint.
   */
  const onSubmit = useCallback(
    async (input: {
      blockId: string;
      episodeId: string;
      /* The idempotency key, minted by the player once per Check press and held
         while the answer is unchanged. Declared here rather than left to
         structural typing so it is visibly part of the request: drop it from
         this object and the server silently goes back to appending a second set
         of learning events for every retried submission. See
         `schools/learning/submission.ts`. */
      submissionId: string;
      answer: BlockAnswer;
    }) => {
      try {
        const res = await fetch("/api/learning/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        /* `null` means "no verdict arrived", and the player renders that as a
           block that did NOT settle. It must therefore mean exactly that: a
           non-2xx here is a server that could not grade or could not store, and
           either way there is nothing to show as an outcome. */
        if (!res.ok) return null;
        return (await res.json()) as {
          verdict: "correct" | "wrong" | "partial" | "unknown";
          reveal?: BlockReveal;
          why?: string | null;
          /* Passed straight through. The player decides what to show; the
             server decides what is true. */
          saved?: boolean;
          /* Visible cases only — the server withholds every hidden pairing. */
          visibleCases?: {
            input: string;
            expected: string;
            actual: string;
            passed: boolean;
          }[] | null;
          unmeasuredReason?: "judge_unavailable" | "not_machine_graded" | "no_trusted_judge" | null;
        };
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Two writes, in this order, on purpose.
   *
   * The browser copy first and it stays: it is what makes the gameboard change
   * in the same frame, and it is the only copy the board reads today. A lesson
   * that completes and changes nothing on screen reads as broken even when
   * every part works.
   *
   * The server write is the record — a school's account of who finished what
   * cannot live in one browser and die with a cleared cache.
   *
   * ## What changed, and why it had to
   *
   * The server write used to be `void fetch(...).catch(() => {})`. A completion
   * that failed produced nothing at all: no error, no retry, no trace. The
   * learner watched the board tick over — that is the `localStorage` copy, and
   * it succeeded — while the school's record silently lost a row. The product
   * was telling a fourteen-year-old their lesson was recorded when it was not.
   *
   * `postOrQueue` keeps the "never wait, never show a spinner" property, which
   * is right: a learner who has just finished should not be looking at a
   * network state. What it adds is that a failure is KEPT. The write goes into
   * a small `localStorage` queue and is sent again the next time a lesson
   * opens — so an afternoon of dropped Wi-Fi lands tomorrow morning rather than
   * being lost. See `src/lib/pending-writes.ts`.
   *
   * The failure is also visible on the server side, in
   * `save.completion_failures` on the admin health view, because a queue that
   * quietly grows on eighteen laptops is not something anybody would otherwise
   * find out about.
   */
  const onComplete = useCallback((summary: LessonSummary) => {
    markLessonComplete(summary.lessonId);
    void postOrQueue("/api/learning/complete", summary);
  }, []);

  return (
    <SchoolLesson
      contest={contestSeconds == null ? undefined : { remainingSeconds: contestSeconds }}
      lesson={lesson}
      monthIndex={monthIndex}
      monthTitle={monthTitle}
      locale={locale}
      backHref={`/course/${monthIndex}`}
      nextLesson={nextLesson}
      onInteraction={onInteraction}
      onSubmit={onSubmit}
      onComplete={onComplete}
      onRunExecuted={onRunExecuted}
      trustedProviderConfigured={trustedProviderConfigured}
      hydration={hydration}
    />
  );
}
