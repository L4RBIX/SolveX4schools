import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { buildClassroomView, buildLearnerRow } from "@schools/presentation/classroom";

/**
 * The class roll, for a teacher.
 *
 * ## Why this refuses in production
 *
 * It returns every child in a class: their attempts, their assistance, and the
 * misconceptions the system believes it can name. There is currently no way to
 * establish that the caller is that class's teacher — auth and enrolment do not
 * exist — so in production this is not a dashboard, it is an open endpoint
 * listing minors' learning difficulties.
 *
 * The refusal is explicit rather than incidental. A route that is merely
 * unlinked is one guessed URL away from being public, and the guess is
 * `/api/teacher/class/grade-9a`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  if (config.environment === "production") {
    return Response.json(
      {
        error: "teacher_access_not_available",
        detail:
          "Teacher access requires authentication and enrolment, neither of which " +
          "is built. Until then this endpoint would expose every child in a class " +
          "to anyone who guessed the URL.",
      },
      { status: 403 },
    );
  }

  const { classId } = await params;
  const store = await getStore();

  const enrolled = (await store.subjectsInClass(classId)).length;
  const states = await store.learnerStatesForClass(classId);
  const lastActive = await store.lastActivityForClass(classId);

  const rows = states.map((s) =>
    buildLearnerRow(s.subjectId, s.state, lastActive.get(s.subjectId) ?? null),
  );

  return Response.json(buildClassroomView(classId, rows, enrolled));
}
