import { buildLessonDetail, buildLessonSummaries } from "@schools/teacher/build-curriculum";
import { deny } from "@schools/auth/guard";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * Lesson analytics: is the learner struggling, or is the lesson bad?
 *
 * `?lesson=<id>` narrows to one lesson and adds its blocks and per-learner
 * progress, so the list and the drill-down share a route and cannot disagree
 * about what "completed" means.
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
  const { sql, bundle, period } = opened.value;

  const lessonId = new URL(request.url).searchParams.get("lesson");
  if (lessonId) {
    const detail = await buildLessonDetail(sql, bundle, period, lessonId);
    if (!detail) return deny(404, "not_found");
    return teacherJson(detail);
  }

  return teacherJson(await buildLessonSummaries(sql, bundle, period));
}
