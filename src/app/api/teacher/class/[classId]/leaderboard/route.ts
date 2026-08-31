import { isLeaderboardLens } from "@schools/teacher/contracts";
import { buildLeaderboard } from "@schools/teacher/build-class";
import { openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * The class leaderboard. Four lenses, class-internal, formula on the payload.
 *
 * An unrecognised lens takes the default rather than 400ing — a stale bookmark
 * is a teacher's bookmark.
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

  const raw = new URL(request.url).searchParams.get("lens");
  const lens = isLeaderboardLens(raw) ? raw : "independent";

  return teacherJson(await buildLeaderboard(sql, bundle, period, lens));
}
