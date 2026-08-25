import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MONTHS } from "@schools/curriculum/months";
import type { Lesson, Month } from "@schools/curriculum/types";
import { LessonRoute } from "@/components/brilliant/lesson/lesson-route";

/**
 * Lesson route.
 *
 * Only authored lessons are routable: `dynamicParams` is false and drafts are
 * excluded from the generated params, so a draft URL is a 404 rather than an
 * empty player. A blank lesson in front of a student is worse than a missing
 * page, and this guard is two lines away from being dropped by accident.
 */

interface Found {
  month: Month;
  lesson: Lesson;
}

function find(lessonId: string): Found | null {
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === lessonId) return { month, lesson };
      }
    }
  }
  return null;
}

export function generateStaticParams() {
  return MONTHS.flatMap((month) =>
    month.units.flatMap((unit) =>
      unit.lessons
        .filter((lesson) => lesson.status !== "draft" && lesson.blocks.length > 0)
        .map((lesson) => ({ lessonId: lesson.id })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const found = find(lessonId);
  return { title: found ? found.lesson.title.kk : "Сабақ" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const found = find(lessonId);
  if (!found || found.lesson.status === "draft" || found.lesson.blocks.length === 0) {
    notFound();
  }

  return (
    <LessonRoute
      lesson={found.lesson}
      monthIndex={found.month.index}
      monthTitle={found.month.title.kk}
    />
  );
}

export const dynamicParams = false;
