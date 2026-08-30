import { buildSkillMatrix } from "@schools/teacher/build-curriculum";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/** The class x skill matrix, over every skill the curriculum has taught. */
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

  return teacherJson(await buildSkillMatrix(sql, bundle, period));
}
