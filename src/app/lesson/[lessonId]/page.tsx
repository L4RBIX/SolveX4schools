import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import { trustedProviderConfigured } from "@schools/config";
import type { Metadata } from "next";
import { MONTHS } from "@schools/curriculum/months";
import type { Lesson, Month } from "@schools/curriculum/types";
import { publicLesson } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
import { currentLearnerMayEnter } from "@schools/learning/access";
import { lessonHydration } from "@schools/learning/rehydrate";
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

  /* And the learner's own gate. Publication says the month exists; this says
     this learner has earned it. All nine months are published, so without this
     line every learner could open May on their first day. Same `notFound()` as
     an unpublished month — a distinct "locked" page would let anyone read the
     shape of the year off the status code. See `schools/policies/unlock.ts`. */
  if (!(await currentLearnerMayEnter(found.month.index))) notFound();

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
  const lesson = publicLesson(found.lesson, track);

  /*
   * The learner's own work on this lesson, from the server that recorded it.
   *
   * This is the fix for the defect that made a refresh look like amnesia: the
   * verdicts, the reveals and the episode ids were all on disk the whole time
   * and nothing on this page had ever asked for them. `SchoolLesson` started
   * every mount with an empty state map, so a learner who had solved nine of
   * nine came back to `0/9` and a finish button that refused.
   *
   * Read HERE rather than fetched after mount, for the same reason
   * `trustedProviderConfigured` is: this page is already `force-dynamic` and
   * already has both a session and a store open for the publication gate, and a
   * client fetch would show every learner an empty lesson for one frame — the
   * bug itself, briefly, and permanently for anyone whose network drops.
   *
   * It is computed AFTER the track filter, over `lesson.blocks`, so the state
   * asked for is exactly the state that will be rendered. A learner on the core
   * route never had the advanced blocks sent to them and is not asked about
   * them here either.
   *
   * Nothing in the returned object identifies the learner: no subject id, no
   * misconception name, no attestation. It carries only what this server had
   * already sent to this browser. See `schools/learning/hydration.ts`.
   */
  const hydration = await lessonHydration(lesson.id, lesson.blocks);

  return (
    <LessonRoute
      lesson={lesson}
      monthIndex={found.month.index}
      monthTitle={found.month.title.kk}
      /*
       * Whether this deployment has a judge whose word becomes evidence.
       *
       * Read on the SERVER, from config, and passed down — the browser cannot
       * answer it and must not be asked to. `RunPanel` folds it together with
       * the surface's trust policy (`capabilityFor`) to decide whether a Check
       * here will produce real evidence or hand the block to a teacher.
       *
       * It defaulted to `true` for want of a caller, which was harmless only
       * while every deployment had a judge. With `EXEC_PROVIDER=none` a
       * supported mode and `judge0_rapidapi` a provider that can be present or
       * absent, the default became a lie a learner reads: "your Check counts",
       * on a deployment where it does not.
       */
      trustedProviderConfigured={trustedProviderConfigured()}
      hydration={hydration}
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
