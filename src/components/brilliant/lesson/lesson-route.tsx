"use client";

import { useCallback, useEffect } from "react";
import type { PublicLesson } from "@schools/curriculum/public";
import type { SchoolInteraction } from "@schools/learning";
import type { BlockAnswer } from "@schools/learning/checking";
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
}: {
  lesson: PublicLesson;
  monthIndex: number;
  monthTitle: string;
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
   * The authoritative grading pass.
   *
   * The server re-grades against the curriculum, writes the events itself and
   * signs the result. Its verdict is what reaches the ledger; the client's was
   * only ever a frame of paint.
   */
  const onSubmit = useCallback(
    async (input: { blockId: string; episodeId: string; answer: BlockAnswer }) => {
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
          unmeasuredReason?: "judge_unavailable" | "not_machine_graded" | null;
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
      lesson={lesson}
      monthIndex={monthIndex}
      monthTitle={monthTitle}
      locale={locale}
      backHref={`/course/${monthIndex}`}
      onInteraction={onInteraction}
      onSubmit={onSubmit}
      onComplete={onComplete}
    />
  );
}
