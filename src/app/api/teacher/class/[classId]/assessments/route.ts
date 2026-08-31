import { buildAssessments } from "@schools/teacher/build-assessment";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * The monthly check.
 *
 * Not windowed: "has this learner sat the September check" is not a question
 * about this week, and a period selector over it would produce a table that
 * empties when a teacher switches to "7 days".
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, now, userId } = opened.value;

  return teacherJson(await buildAssessments(sql, bundle, now, userId));
}
