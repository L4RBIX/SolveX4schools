import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import type { Metadata } from "next";
import { MONTHS, MONTH_BY_INDEX } from "@schools/curriculum/months";
import { publicAssessment } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
import { currentLearnerMayEnter } from "@schools/learning/access";
import { lessonHydration } from "@schools/learning/rehydrate";
import { AssessmentRoute } from "@/components/brilliant/lesson/assessment-route";
import { trustedProviderConfigured } from "@schools/config";

/**
 * The monthly check.
 *
 * ## Why this route did not exist until now
 *
 * `schools/presentation/adapters.ts` has always emitted an assessment node on
 * the month board with `href: /assessment/${month.index}`, and September's
 * assessment is `status: "implemented"`, so the node has always been unlocked
 * and clickable. There was no page behind it. The programme's central
 * independence check — the one mechanism that would catch a learner who had
 * clicked their way through the month — was a 404.
 *
 * ## What is deliberately the same as a lesson
 *
 * The player. An assessment is not a different kind of screen: the same card,
 * the same verdict channel, the same footer. Building a second runtime for it
 * would mean two places for a grading bug to live, and the learner meeting an
 * unfamiliar interface on the one day it matters.
 *
 * ## What is deliberately different
 *
 * The blocks are `verify` blocks, which the submit route now sends to the judge
 * (it used to exclude them, so the whole check recorded nothing), and the page
 * announces its own time budget before the learner starts.
 */

interface Params {
  month: string;
}

export function generateStaticParams() {
  return MONTHS.filter((m) => m.assessment && m.assessment.status !== "draft").map((m) => ({
    month: String(m.index),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { month } = await params;
  const found = MONTH_BY_INDEX.get(Number(month));
  return { title: found?.assessment ? found.assessment.title.kk : "Тексеріс" };
}

export default async function AssessmentPage({ params }: { params: Promise<Params> }) {
  await requirePageSession();
  const { month } = await params;
  const monthIndex = Number(month);
  const found = MONTH_BY_INDEX.get(monthIndex);

  /* A draft assessment is a 404, not an empty player — the same rule the lesson
     route applies, and for the same reason: a blank check in front of a class
     is worse than a missing page. The board locks the node in that case, so
     this is the belt to that braces. */
  if (!found?.assessment || found.assessment.status === "draft") notFound();

  /* Same gate as a lesson, and for a stronger reason: a monthly check is the
     evidence a school reports on. Serving one nobody approved would put an
     unreviewed judgement on a child's record. */
  const gate = await gateFor(found);
  if (!gate.open) notFound();

  /* The monthly check is content, so this 404s rather than rendering a panel:
     the board at /course/N is the navigation surface that explains a closed
     month, and this is the thing behind the door. */
  if (!(await currentLearnerMayEnter(found.index))) notFound();

  const track = await resolveTrack(monthIndex);
  const assessment = publicAssessment(found.assessment, monthIndex, track);

  /* The learner's own work, restored — see the lesson route for the argument.
     It matters more here. `ASSESSMENT_COMPLETION_POLICY` sets `allowance: 0`
     and raises every floor, so an empty client state makes EVERY block
     outstanding: a learner who refreshed mid-check found the whole thing
     apparently undone and a finish button that walked them back to block 1. */
  const hydration = await lessonHydration(assessment.id, assessment.blocks);

  return (
    <AssessmentRoute
      assessment={assessment}
      monthTitle={found.title.kk}
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

/* Per request: the track cookie decides which blocks are sent, and a prebuilt
   HTML file is what put answer keys on disk in the first place. */
export const dynamic = "force-dynamic";
export const dynamicParams = false;
