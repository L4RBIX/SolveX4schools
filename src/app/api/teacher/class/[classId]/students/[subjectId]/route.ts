import { assembleClass } from "@schools/teacher/build-class";
import { buildAssessmentSummary } from "@schools/teacher/build-assessment";
import { buildStudentDetail } from "@schools/teacher/build-student";
import { deny } from "@schools/auth/guard";
import { getNovaProvider } from "@schools/nova";
import { memberBySubject, openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * One learner, in depth.
 *
 * The subject id comes from the URL and is therefore untrusted: it is checked
 * against THIS class's roster before anything is read, and a subject outside it
 * answers 404 rather than 403 — the same shape as a class not taught, so the
 * endpoint cannot be used to test whether a given subject id exists.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string; subjectId: string }> },
) {
  const { classId, subjectId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, period, now } = opened.value;

  const member = memberBySubject(bundle, subjectId);
  if (!member) return deny(404, "not_found");

  const assessment = await buildAssessmentSummary(sql, bundle, now);
  const assembled = await assembleClass(sql, bundle, period, now, assessment);
  const row = assembled.rows.find((r) => r.subjectId === subjectId);
  if (!row) return deny(404, "not_found");

  /* Whether a real model was answering. On the `echo` provider a "hint" is one
     canned sentence, so any effectiveness rate over that period describes
     nothing about tutoring — the panel says so rather than drawing a
     conclusion. */
  const degraded = (await getNovaProvider()).degraded;

  return teacherJson(
    await buildStudentDetail(sql, bundle, period, subjectId, row, now, degraded),
  );
}
