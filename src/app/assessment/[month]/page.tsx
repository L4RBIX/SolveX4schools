import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import type { Metadata } from "next";
import { MONTHS, MONTH_BY_INDEX } from "@schools/curriculum/months";
import { publicAssessment } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
import { AssessmentRoute } from "@/components/brilliant/lesson/assessment-route";

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

  const track = await resolveTrack(monthIndex);

  return (
    <AssessmentRoute
      assessment={publicAssessment(found.assessment, monthIndex, track)}
      monthTitle={found.title.kk}
    />
  );
}

/* Per request: the track cookie decides which blocks are sent, and a prebuilt
   HTML file is what put answer keys on disk in the first place. */
export const dynamic = "force-dynamic";
export const dynamicParams = false;
