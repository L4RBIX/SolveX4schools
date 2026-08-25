"use client";

import { useCallback, useEffect } from "react";
import type { Lesson } from "@schools/curriculum/types";
import type { SchoolInteraction } from "@schools/learning";
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
   * Not yet posting anywhere — the ingest route needs auth to key events to a
   * subject. It is wired now rather than later because the alternative is the
   * documented silent failure: `hasAttemptSince` never sees an attempt, every
   * hint request stays capped, and the assistant appears to refuse help to a
   * learner who is visibly trying, with no error anywhere to explain it.
   */
  const onInteraction = useCallback((interaction: SchoolInteraction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[learning-event]", interaction);
    }
  }, []);

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
      onComplete={onComplete}
    />
  );
}
