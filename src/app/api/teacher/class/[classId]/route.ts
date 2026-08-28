import { buildLearnerState } from "@solvex/learning-intelligence-core";
import { getStore } from "@schools/store";
import { buildClassroomView, buildLearnerRow } from "@schools/presentation/classroom";
import { deny, requireClassAccess } from "@schools/auth/guard";

/**
 * The class roll, for the teacher who teaches it.
 *
 * ## Why this used to refuse in production
 *
 * It returns every child in a class: their attempts, their assistance, and the
 * misconceptions the system believes it can name. There was no way to establish
 * that the caller was that class's teacher, so in production it was not a
 * dashboard — it was an open endpoint listing minors' learning difficulties,
 * one guessed URL (`/api/teacher/class/grade-9a`) away from being public.
 *
 * ## What replaced the refusal
 *
 * `requireClassAccess` — and the authority it checks is `class_teachers`, not
 * the role. "Teacher" is not a key to every class in the school. A teacher
 * asking about a class they do not teach receives 404 rather than 403, because
 * 403 confirms the class exists and turns this into a way to enumerate a
 * school's classes.
 *
 * The subject ids are the ONLY identifier that leaves here for a learner; the
 * roster join adds display names, which is what a teacher needs to read the
 * list and the whole of the identity the programme commits to holding.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;

  const guard = await requireClassAccess(classId);
  if (!guard.ok) return deny(guard.status, guard.reason);
  const { schoolId } = guard.value;

  const store = await getStore();

  const roster = await store.rosterForClass(schoolId, classId);
  const enrolled = roster.length;
  const states = await store.learnerStatesForClass(classId);
  const lastActive = await store.lastActivityForClass(classId);

  /* Names come from the roster, matched by subject. A learner with no events
     yet still appears — a class list that silently omits the child who has not
     started is the opposite of what a teacher needs it for. */
  const subjectByUser = new Map<string, string>();
  for (const learner of roster) {
    subjectByUser.set(
      learner.userId,
      await store.resolveSubjectForUser(learner.userId, { schoolId, classId }),
    );
  }
  const nameBySubject = new Map(
    roster.map((l) => [subjectByUser.get(l.userId) ?? l.userId, l.displayName] as const),
  );

  const stateBySubject = new Map(states.map((s) => [s.subjectId, s.state] as const));

  const rows = [...nameBySubject.entries()].map(([subjectId, displayName]) => ({
    ...buildLearnerRow(
      subjectId,
      /* A learner with no events has no state — not a state full of zeros that
         someone might read as a measurement. `buildLearnerState` over an empty
         input list is the engine's own answer to "nothing has happened yet",
         so the row says "not started" using the same code path as every other
         row rather than a second definition of empty. */
      stateBySubject.get(subjectId) ?? buildLearnerState(subjectId, []),
      lastActive.get(subjectId) ?? null,
    ),
    displayName,
  }));

  return Response.json(buildClassroomView(classId, rows, enrolled));
}
