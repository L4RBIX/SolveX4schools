import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import type { Metadata } from "next";
import { MONTHS } from "@schools/curriculum/months";
import type { Lesson, Month } from "@schools/curriculum/types";
import { publicLesson } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
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
  await requirePageSession();

  const { lessonId } = await params;
  const found = find(lessonId);
  if (!found || found.lesson.status === "draft" || found.lesson.blocks.length === 0) {
    notFound();
  }

  /* The publication gate. `types.ts` has always said students see approved
     content and nothing else; until migration 0013 nothing enforced it, and
     September reached learners at `implemented`. Development is open and says
     so; production serves only what a named human has signed off on, against
     the hash of exactly the content being served. */
  const gate = await gateFor(found.month);
  if (!gate.open) notFound();

  /*
   * The learner gets the PUBLIC projection, never the curriculum object.
   *
   * This page is a Server Component handing props to a Client Component, and
   * Next serialises those props into the RSC payload embedded in the HTML. When
   * it handed over `found.lesson`, every `referenceSolution` and every hidden
   * test case went with it — provably: the built `m1.l9.html` contained
   * `abs(n) % 10`, and `m1.l8.html` contained the hidden input `5 100`.
   *
   * `publicLesson` also applies the learner's route, so blocks their track
   * excludes are never sent rather than merely not rendered.
   */
  const track = await resolveTrack(found.month.index);

  return (
    <LessonRoute
      lesson={publicLesson(found.lesson, track)}
      monthIndex={found.month.index}
      monthTitle={found.month.title.kk}
    />
  );
}

/*
 * Rendered per request rather than prebuilt.
 *
 * Reading the track cookie makes this dynamic, and that is correct twice over:
 * two learners on different routes must not share a cached page, and a
 * prebuilt HTML file is exactly what put the answer keys on disk in the first
 * place. `generateStaticParams` stays as the routable-lesson allowlist.
 */
export const dynamic = "force-dynamic";
export const dynamicParams = false;
