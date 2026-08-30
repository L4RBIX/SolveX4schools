import { buildStudentReview } from "@schools/teacher/build-assessment";
import { deny } from "@schools/auth/guard";
import { isHumanReviewable, isReviewDisposition, recordReview } from "@schools/teacher/review";
import { memberBySubject, openTeacherRequest, teacherJson } from "@schools/teacher/route";

/**
 * One learner's submitted words on the human-marked half of the monthly check.
 *
 * ## The narrowest read path in the product
 *
 * Everything else under `/api/teacher` returns aggregates. This returns a
 * sentence a fourteen-year-old wrote, so the chain that authorises it is spelt
 * out rather than assumed:
 *
 * 1. **Authenticated** — `openTeacherRequest` → `requireClassAccess` →
 *    `currentUser()`. Anonymous is 401.
 * 2. **Not a learner** — the student role is refused before any lookup. A
 *    learner reading this endpoint would be reading a classmate's work.
 * 3. **Teaches THIS class** — from `class_teachers`, not from the role. A
 *    teacher asking about a colleague's class gets **404**, never 403, so the
 *    endpoint cannot be used to enumerate a school's classes.
 *
 *    The one exception is `role === "admin"`, which `requireClassAccess`
 *    admits for any class in their OWN school after checking it exists. That is
 *    deliberate and pre-dates this route — a head of department has to be able
 *    to see a class they do not personally teach — and it applies to the write
 *    as well as the read, so `reviewed_by` can name an administrator. Stated
 *    here because "the write checks class_teachers" is true of teachers and not
 *    of admins, and a reader who believed the shorter sentence would be wrong.
 * 4. **This school's class** — the guard resolves `schoolId` from the SESSION
 *    and the roster is built from `class_enrolments`, keyed
 *    `(school_id, class_id)`. Class ids are author-chosen and collide: two
 *    schools can both run a `grade-9a`. Authorising on the class id alone would
 *    hand one school's children to the other, which is why nothing downstream
 *    of here ever sees a class id.
 * 5. **Enrolled in it** — `memberBySubject` checks the URL's subject id against
 *    that roster. 404 again, so a subject id cannot be probed for existence.
 * 6. **A block a human was asked to mark** — `isHumanReviewable` in
 *    `schools/teacher/review.ts`. Code, multiple choice, ordering and every
 *    lesson block are not reachable through this route.
 *
 * ## What this route cannot return, and why it is not a filter
 *
 * *Nova conversations*: not stored anywhere. The payload allowlist in
 * `packages/learning-contracts` has no text key and the chat lives in browser
 * React state, so there is no query that could produce one.
 *
 * *Hidden tests, expected outputs, reference solutions*: this reads
 * `learning_submissions.answer`, which migration 0021 defines as the learner's
 * own `BlockAnswer` and states "never contains answer-key material". The
 * sibling column `response` — which does carry the curriculum's reveal payload
 * — is never selected.
 *
 * *Another learner*: `storedResponses` takes one subject id, checked above.
 *
 * ## The POST, and what it is allowed to record
 *
 * For as long as this route existed there was no POST, and the reason was
 * written here: there was nowhere to write a marking outcome, and adding one
 * needed a schema decision made on purpose by someone who had read migration
 * 0016. Migration 0022 is that decision.
 *
 * What it records is an OPERATION — this member of staff read this artifact, on
 * this date, and decided whether the class needs to come back to it. It is not
 * a grade: `human_reviews` has no score, no percentage, no `correct` boolean
 * and no note, and 0016's argument that the absent column IS the guarantee is
 * preserved rather than worked around. Nothing downstream reads the table, so a
 * teacher's reading can never become evidence about a learner.
 *
 * **The POST's first five statements are identical to the GET's**, deliberately
 * and visibly: same guard, same roster check, same 404. A mutation that
 * authorised itself differently from the read beside it is how the two drift.
 * Beyond that it adds only what a write needs — a parsed body, a closed
 * vocabulary, and a block allowlist re-derived from the curriculum rather than
 * trusted from the request.
 *
 * ## Cross-site requests
 *
 * There is no CSRF token in this codebase, and this is its first state-changing
 * teacher endpoint. The defence it inherits is the session cookie's
 * `SameSite=lax`, which browsers do not attach to a cross-site POST — so the
 * request arrives unauthenticated and is refused at the guard. That is a real
 * defence and not an accident, but it was chosen for sessions rather than for
 * this route, and it is written down here so the next state-changing endpoint
 * is added by someone who knows what is holding.
 */
/** RFC 4122 shape. Postgres rejects anything else at the `::uuid` cast. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string; subjectId: string }> },
) {
  const { classId, subjectId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, userId } = opened.value;

  const member = memberBySubject(bundle, subjectId);
  if (!member) return deny(404, "not_found");

  const review = await buildStudentReview(sql, bundle, subjectId, member.displayName, userId);
  /* The month has no assessment, or none of its blocks is human-marked. Not an
     error and not an empty object: there is nothing here to review. */
  if (!review) return deny(404, "not_found");

  return teacherJson(review);
}

/**
 * Record that this member of staff has read one artifact.
 *
 * ## The body, and why every field of it is distrusted
 *
 * `{ submissionId, blockId, disposition }`. All three arrive from a browser and
 * none is taken on its word:
 *
 * - `disposition` is checked against the closed vocabulary, so a value outside
 *   `reviewed | needs_followup` is a 400 rather than a constraint violation
 *   surfacing as a 500.
 * - `blockId` is looked up in THIS month's assessment and re-filtered through
 *   `isHumanReviewable` — the same predicate the GET applies. The GET gets that
 *   filter for free by building from the curriculum; a POST names a block, so
 *   the filter has to be re-run or a teacher could record a review against a
 *   coding block, an MCQ, or any lesson block in the course.
 * - `submissionId` is checked for UUID SHAPE and nothing else. Its meaning
 *   needs no validation — `recordReview` inserts `select`-ed from
 *   `learning_submissions` filtered by the learner's own subject id, a settled
 *   row, and the allowlist above, so an id that satisfies none of those selects
 *   zero rows and returns null, which is a 404 here. But a string that is not a
 *   UUID never reaches that comparison: it fails the `::uuid` cast inside
 *   Postgres and raises 22P02, which leaves the handler as a 500 with a stack
 *   trace instead of the uniform 404 this route promises. The shape check turns
 *   an attacker-controlled server error back into a 400.
 *
 * ## Idempotency
 *
 * One row per artifact, upserted. A double click writes the same row twice and
 * the second write is a no-op on the timestamp — `recordReview` states the rule
 * exactly. Two concurrent identical requests settle to a byte-identical row
 * whichever one wins, so there is nothing to reconcile and no history to grow.
 *
 * Returns the review as it now stands, not as the caller asked for it, so the
 * screen renders what was actually stored.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string; subjectId: string }> },
) {
  const { classId, subjectId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, userId } = opened.value;

  const member = memberBySubject(bundle, subjectId);
  if (!member) return deny(404, "not_found");

  /* A body that is not JSON is a client bug, not an attack, and the parser's
     own message is not something to echo back. */
  let body: { submissionId?: unknown; blockId?: unknown; disposition?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return deny(400, "invalid_body");
  }

  const submissionId = typeof body.submissionId === "string" ? body.submissionId : null;
  const blockId = typeof body.blockId === "string" ? body.blockId : null;
  if (!submissionId || !blockId) return deny(400, "invalid_body");
  /* Shape only. A non-UUID string would otherwise reach a `::uuid` cast and
     come back as a 500 rather than this route's uniform refusal. */
  if (!UUID.test(submissionId)) return deny(400, "invalid_body");
  if (!isReviewDisposition(body.disposition)) return deny(400, "invalid_disposition");

  /* Link 6 of the chain, re-derived rather than trusted. The block must belong
     to THIS month's check and must be one the curriculum declares a human
     marks — `expectedPoints` is the author writing down what a marker looks
     for, and without it a teacher is being asked to invent a standard. */
  const block = bundle.month.assessment?.blocks.find((b) => b.id === blockId);
  if (!block || !isHumanReviewable(block)) return deny(404, "not_found");

  const review = await recordReview(sql, {
    subjectId,
    submissionId,
    reviewedBy: userId,
    disposition: body.disposition,
    blockIds: [blockId],
  });

  /* Zero rows inserted: the submission is not a settled artifact of this
     learner on this block. Same 404 as an unknown subject, for the same reason
     — a different answer would confirm which of the two was wrong. */
  if (!review) return deny(404, "not_found");

  return teacherJson({
    disposition: review.disposition,
    reviewedAt: review.reviewedAt,
    byYou: true,
  });
}
