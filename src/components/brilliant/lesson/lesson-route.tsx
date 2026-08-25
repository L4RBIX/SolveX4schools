"use client";

import { useCallback, useEffect } from "react";
import type { Lesson } from "@schools/curriculum/types";
import type { SchoolInteraction } from "@schools/learning";
import type { BlockAnswer } from "@schools/learning/checking";
import { useLocale } from "@/components/sx/i18n";
import { markLessonComplete, setCurrentLesson } from "@/lib/progress";
import { SchoolLesson, type LessonSummary } from "./school-lesson";

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
  lesson: Lesson;
  monthIndex: number;
  monthTitle: string;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    setCurrentLesson(lesson.id);
  }, [lesson.id]);

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
        if (!res.ok) return null;
        return (await res.json()) as { verdict: "correct" | "wrong" | "partial" | "unknown" };
      } catch {
        return null;
      }
    },
    [],
  );

  const onComplete = useCallback(
    (summary: LessonSummary) => {
      markLessonComplete(summary.lessonId);
    },
    [],
  );

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
