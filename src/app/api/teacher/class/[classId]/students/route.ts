import { assembleClass } from "@schools/teacher/build-class";
import { buildAssessmentSummary } from "@schools/teacher/build-assessment";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/** The class roster, windowed. One row per enrolled learner, never fewer. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, period, now } = opened.value;

  const assessment = await buildAssessmentSummary(sql, bundle, now);
  const assembled = await assembleClass(sql, bundle, period, now, assessment);

  return teacherJson({
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    rows: assembled.rows,
  });
}
