import { buildOverview } from "@schools/teacher/build-class";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * The first teacher screen: what requires my attention right now.
 *
 * Guarded by `openTeacherRequest`, which resolves `class_teachers` membership
 * and answers 404 — never 403 — for a class this teacher does not teach.
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
  const { sql, store, bundle, period, now } = opened.value;

  return teacherJson(await buildOverview(sql, store, bundle, period, now));
}
