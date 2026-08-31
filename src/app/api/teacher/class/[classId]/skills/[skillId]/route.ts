import { buildSkillDetail } from "@schools/teacher/build-curriculum";
import { deny } from "@schools/auth/guard";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/** One skill, across the class. 404 for a skill this month has not introduced. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string; skillId: string }> },
) {
  const { classId, skillId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, period } = opened.value;

  const detail = await buildSkillDetail(sql, bundle, period, decodeURIComponent(skillId));
  if (!detail) return deny(404, "not_found");
  return teacherJson(detail);
}
