import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { ExplainBlock, LessonBlock, VerifyBlock } from "@schools/curriculum/types";
import { reviewObligationFor } from "@schools/curriculum/review-policy";
import { readArtifact, type SubmittedArtifact } from "@schools/learning/hydration";

/**
 * The one path by which a teacher may read a learner's own words.
 *
 * ## Why this file is separate from `queries.ts`
 *
 * Everything in `queries.ts` is an AGGREGATE: counts, medians, shares. Nothing
 * there returns a sentence a child wrote, and that separation is worth keeping
 * visible. This module is the exception, it is small on purpose, and every
 * function in it is named in the authorization tests.
 *
 * ## What changed underneath, and what did not
 *
 * Migration 0021 added `learning_submissions.answer` — the learner's submitted
 * `BlockAnswer`, written inside the same transaction that settles the verdict.
 * So the sentence exists now where it did not before, and the teacher console's
 * old copy — «Жазбаша және ауызша жауаптар әзірге сақталмайды», *written and
 * oral answers are not stored yet* — became false for written work on the day
 * that migration shipped.
 *
 * What did NOT change is the reason a teacher can read it: the curriculum
 * declares `expectedPoints` on the block, which is an author writing down what
 * a marker looks for. `schools/learning/post-help.ts` already uses exactly that
 * signal to separate `teacher_reviewable` from `submitted`, and this module
 * reuses `markingPointsFor` rather than inventing a second rule. No criteria,
 * no queue: asking a teacher to mark against a standard nobody wrote is how
 * twenty learners get twenty different standards.
 *
 * ## The four rules
 *
 * **1. Population, never a class id.** Every function takes `subjectIds`, and
 * the only place those come from is `ClassBundle.members`, which
 * `classRoster()` built from `class_enrolments` keyed `(school_id, class_id)`.
 * A `class_id` predicate alone would hand School A's teacher School B's
 * children, because class ids are author-chosen and collide — see the module
 * comment in `queries.ts`. There is no class id in this file at all.
 *
 * **2. Blocks, never all of them.** `blockIds` is an allowlist the caller
 * derives from the month's own assessment and filters through
 * `isHumanReviewable`. A learner's code is not readable here, an MCQ choice is
 * not readable here, and a lesson block a teacher was never asked to mark is
 * not readable here. Passing `[]` returns `[]`.
 *
 * **3. `answer`, never `response`.** `learning_submissions.response` is the
 * submit route's reply replayed verbatim, and migration 0019 lists what is in
 * it: the curriculum's reveal payload and the author's justification prose.
 * That is answer-key material. It is never selected in this file. The column
 * this file reads holds what the learner submitted and, per 0021, "never
 * contains answer-key material".
 *
 * **4. One function here writes, and what it writes is not a score.** For as
 * long as this file existed the rule was "nothing here writes", because there
 * was no column anywhere to record that a teacher had marked something.
 * Migration 0022 adds one — `human_reviews` — and it is deliberately an
 * OPERATIONAL record: who read this artifact, when, and whether the class needs
 * to come back to it. There is no grade, no percentage and no note, and 0016's
 * argument that the absent column IS the guarantee is untouched.
 *
 * `recordReview` is that function. It is the only write on the teacher surface,
 * and its authorization is structural rather than checked: the statement
 * inserts `select`-ed from `learning_submissions` filtered by the same block
 * allowlist the reads use, so a submission outside it produces zero rows and
 * the caller answers 404.
 *
 * **What a review must never become.** Nothing downstream reads this table.
 * Not `buildLearnerState`, not `learner_skill_state`, not `independenceWeight`,
 * not a NovaDirective, not the assessment verdict. A teacher's reading is a
 * fact about an adult's working day, and the moment it becomes an input to a
 * claim about a child it has turned into the grade this schema refuses to hold.
 *
 * ## The second queue, and why it is not here
 *
 * `post_help_explanations` also carries a `teacher_reviewable` status, and it
 * is a genuine second source of human-review work — on paper. In the shipped
 * product it is empty everywhere: `/api/learning/explanation` is its only
 * writer and no component calls it, `evaluateCompletionGate` has no production
 * caller, and the live pilot database holds zero rows. Surfacing it today would
 * put a permanently empty panel on a teacher's screen, which is the same kind
 * of untruth as the «ответы пока не сохраняются» sentence this workstream just
 * deleted. It is deferred until the learner-side gate ships, and the deferral
 * is written down in `docs/teacher/TEACHER_HUMAN_REVIEW.md` rather than left to
 * be re-derived.
 *
 * ## What is deliberately not reachable from here
 *
 * Nova conversations. They are not stored anywhere: the payload allowlist in
 * `packages/learning-contracts` has no text key and the chat lives in browser
 * React state. There is no query that could return one, which is a stronger
 * guarantee than a filter that excludes them.
 */

/* -------------------------------------------------------------------------- */
/* Which blocks a teacher was asked to mark                                   */
/* -------------------------------------------------------------------------- */

/**
 * Does the curriculum ask a human to read this block, ASYNCHRONOUSLY, later?
 *
 * One question, one owner. `reviewObligationFor` in
 * `schools/curriculum/review-policy.ts` is the curriculum's own answer and this
 * module does not get a second one — its header says, in as many words, "ask
 * this, do not infer from the block type, and do not infer from
 * `expectedPoints`".
 *
 * ## What this used to be, and what it cost
 *
 * It used to be `expectedPoints.length > 0` over `explain` and over `verify` in
 * `oral_explanation` mode. Both halves were wrong, and the second was worse
 * than the first.
 *
 * `expectedPoints` means an author wrote down what a marker looks for. It does
 * NOT mean a marker has to sit down later and read every one: the curriculum
 * audit classified all thirty-three `explain` blocks and found four that
 * genuinely need an asynchronous written read, eleven worth SAMPLING, and
 * eighteen where the machine already knows the answer and a human read adds
 * nothing. A sample that counts as pending is not a sample; it is a queue with
 * a softer name.
 *
 * And an `oral_explanation` is a live exchange in the room. The platform keeps
 * the short note the learner types before they speak, and that note is not the
 * evidence — the defence is. Queueing it asked a teacher to mark, on Tuesday,
 * something they had already heard on Monday.
 *
 * Measured over the nine assessments, the old predicate queued SIXTEEN blocks
 * per learner per year — the four real ones, one sample, one redundant, and ten
 * oral defences. For a class of eighteen that is 288 reads a year instead of
 * 72, and the difference is not a workload estimate: it is 216 rows a teacher
 * would have had to dismiss to find the ones that mattered.
 *
 * ## The narrowing is deliberate and is tested
 *
 * `tests/teacher/review-contract.test.ts` fails if this queue ever grows past
 * the four, or admits an oral block, a sample or a redundant one.
 */
export function isHumanReviewable(block: LessonBlock): block is HumanReviewableBlock {
  return reviewObligationFor(block)?.mandatoryQueue === true;
}

/**
 * The narrowed block, so a caller that filtered gets `prompt` without a cast.
 *
 * A type predicate rather than a boolean because the alternative is
 * `(block as ExplainBlock).prompt` at every call site, and a cast is the exact
 * construct that would let a `concept` block through the day someone widens
 * the filter.
 */
export type HumanReviewableBlock = ExplainBlock | VerifyBlock;

/**
 * How the learner's words reached the platform. Never a guess.
 *
 * `written` — they typed it, it is their answer, and it is the whole artifact.
 *
 * `spoken_note` — the block is an oral defence. `VerifyView` renders a short
 * text area beside the card that says the explanation is given to the teacher,
 * so what is stored is a NOTE the learner made, not a transcript of what they
 * said. **The product captures no audio anywhere** — there is no recorder in
 * the renderer, no media column in any migration, and no upload route. A
 * console that showed this note under a heading like "oral answer" would be
 * claiming a recording exists.
 */
export type Writtenness = "written" | "spoken_note";

export function writtenness(block: HumanReviewableBlock): Writtenness {
  return block.type === "verify" && block.mode === "oral_explanation"
    ? "spoken_note"
    : "written";
}

/* -------------------------------------------------------------------------- */
/* The review itself                                                          */
/* -------------------------------------------------------------------------- */

/**
 * What a member of staff decided, having read the answer.
 *
 * Both values mean READ. Neither is a judgement of the answer's quality, and
 * there is deliberately no third — the vocabulary is closed by a CHECK in
 * migration 0022, so a route cannot quietly extend it and a fourth value is a
 * migration with a reviewer.
 *
 * - `reviewed` — a person read this and nothing further is needed.
 * - `needs_followup` — a person read this and the class or the learner needs to
 *   come back to it. **Not a fail.** It is a note-to-self about a conversation,
 *   and the learner is never shown it.
 */
export type ReviewDisposition = "reviewed" | "needs_followup";

export const REVIEW_DISPOSITIONS: readonly ReviewDisposition[] = ["reviewed", "needs_followup"];

export function isReviewDisposition(v: unknown): v is ReviewDisposition {
  return typeof v === "string" && (REVIEW_DISPOSITIONS as readonly string[]).includes(v);
}

/** The current review of one artifact. One row, no history — see 0022. */
export interface ReviewRecord {
  disposition: ReviewDisposition;
  /** The `school_accounts.user_id` of the member of staff who decided. */
  reviewedBy: string;
  /** When the CURRENT disposition was decided. A change moves it. */
  reviewedAt: string;
}

/** Build a `ReviewRecord` from a left-joined row, or null when nobody has read it. */
function toReview(row: {
  disposition: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}): ReviewRecord | null {
  if (!row.disposition || !row.reviewed_by || !row.reviewed_at) return null;
  /* Validated rather than cast. The column has a CHECK, so an unknown value
     means the vocabulary was widened without this code being updated — and the
     honest reading of a disposition this build does not understand is "nobody
     has read it", not a guess. */
  if (!isReviewDisposition(row.disposition)) return null;
  return {
    disposition: row.disposition,
    reviewedBy: row.reviewed_by,
    reviewedAt: new Date(row.reviewed_at).toISOString(),
  };
}

/**
 * Record that a member of staff has read one artifact.
 *
 * ## The authorization is in the statement, not around it
 *
 * The insert is `select`-ed FROM `learning_submissions`, filtered by the same
 * three predicates every read in this file uses: the learner's own subject id,
 * a settled row, and a block on the caller's allowlist. So a submission that is
 * not a real settled artifact on a human-marked block produces **zero rows**,
 * this returns `null`, and the route answers 404. A teacher cannot record a
 * review against a coding block, an unsubmitted block, another learner's work,
 * or an id they invented — not because a check rejects it, but because the
 * statement selects nothing to insert.
 *
 * The caller has already proven the teacher teaches the class this learner is
 * enrolled in. That check is not repeated here; it is not repeatable here,
 * because this file deliberately never sees a class.
 *
 * ## Idempotency, stated exactly
 *
 * One row per artifact, so a double click cannot append. `on conflict do
 * update` gives the last decision, and the timestamp has a precise rule:
 *
 * - **Same disposition again** — a genuine no-op on the WHOLE row. Neither
 *   `reviewed_at` nor `reviewed_by` moves.
 *
 *   Freezing the timestamp but not the reviewer was the first version of this,
 *   and it was wrong in the one way this table cannot afford. On a co-taught
 *   class, teacher B opening an artifact already marked «Прочитано» and
 *   pressing the lit button — an ordinary click, not an attack — produced a row
 *   saying B read it at A's timestamp: an adult attributed to a moment they did
 *   nothing, in the one table whose entire content is who read this and when.
 *   With no history to recover A from, that is not a cosmetic slip.
 *
 *   So the row is left entirely alone. Two concurrent identical requests settle
 *   to a byte-identical row whichever wins, and a re-press by anybody is
 *   genuinely free.
 *
 * - **A different disposition** — the decision is replaced: `disposition`,
 *   `reviewed_by` and `reviewed_at` all move to the person who made the current
 *   call, because a teacher looking at a follow-up flag wants to know who
 *   raised it and when, not who first opened the answer.
 *
 * Returns the row as it now stands, so the caller renders what was actually
 * stored rather than what it asked for.
 */
export async function recordReview(
  sql: SqlExecutor,
  input: {
    subjectId: string;
    submissionId: string;
    /** Resolved from the session. Never from a request body. */
    reviewedBy: string;
    disposition: ReviewDisposition;
    /** The same block allowlist the reads use. Empty means nothing is permitted. */
    blockIds: readonly string[];
  },
): Promise<ReviewRecord | null> {
  if (input.blockIds.length === 0) return null;

  const r = await sql.query<{
    disposition: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
  }>(
    `insert into human_reviews (subject_id, submission_id, reviewed_by, disposition)
     select s.subject_id, s.submission_id, $3::uuid, $4::text
       from learning_submissions s
      where s.subject_id    = $1::uuid
        and s.submission_id = $2::uuid
        and s.settled_at is not null
        and s.block_id = any($5::text[])
     on conflict (subject_id, submission_id) do update
        set disposition = excluded.disposition,
            /* Reviewer and timestamp move together or not at all. Moving one
               without the other is what produced a row asserting that one
               teacher decided at another teacher's moment. */
            reviewed_by = case
              when human_reviews.disposition = excluded.disposition
                then human_reviews.reviewed_by
              else excluded.reviewed_by
            end,
            reviewed_at = case
              when human_reviews.disposition = excluded.disposition
                then human_reviews.reviewed_at
              else now()
            end
     returning disposition, reviewed_by, reviewed_at`,
    [input.subjectId, input.submissionId, input.reviewedBy, input.disposition, input.blockIds],
  );

  const row = r.rows[0];
  return row ? toReview(row) : null;
}

/* -------------------------------------------------------------------------- */
/* The queue: who is waiting, with no prose attached                          */
/* -------------------------------------------------------------------------- */

/**
 * One learner's latest settled submission on one human-marked block.
 *
 * Deliberately carries no text. The queue is a list of names and tasks a
 * teacher scans to decide where to start, and shipping the whole class's prose
 * to build that list would send twenty children's writing to a screen showing
 * none of it. The words are fetched when a teacher opens one — which is also
 * the narrowest thing a log can later be asked about.
 */
export interface ReviewClaim {
  subjectId: string;
  blockId: string;
  /**
   * The artifact itself, not the task.
   *
   * A review is recorded against this, so a learner who rewrites their
   * explanation after feedback produces a new id with no review — and returns
   * to the queue, which is correct, because nobody has read the new words.
   */
  submissionId: string;
  /** When the submission settled. ISO, UTC. */
  submittedAt: string;
  /** The current review of this artifact, or null while nobody has read it. */
  review: ReviewRecord | null;
  /**
   * Whether an artifact was actually stored.
   *
   * False for a row settled before migration 0021, which is a real and
   * permanent state: the verdict survived and the words did not. A queue that
   * counted those as readable would send a teacher to an empty panel.
   */
  readable: boolean;
}

/**
 * The latest settled submission per (learner, block), for the given blocks.
 *
 * `distinct on` rather than a window function because the supporting index —
 * `idx_learning_submissions_settled (subject_id, block_id, settled_at desc)`
 * from migration 0020 — is exactly this shape. A learner who answered, went
 * back and answered again has one row here: the last thing they submitted is
 * the thing a teacher is marking.
 */
export async function reviewQueue(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  blockIds: readonly string[],
): Promise<ReviewClaim[]> {
  if (subjectIds.length === 0 || blockIds.length === 0) return [];

  const r = await sql.query<{
    subject_id: string;
    submission_id: string;
    block_id: string;
    settled_at: string;
    readable: boolean;
    disposition: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
  }>(
    /*
     * `submission_id` is the last `order by` term in BOTH this query and
     * `storedResponses`. Without it, two submissions sharing a `settled_at`
     * make `distinct on` pick an arbitrary row — and independently arbitrary
     * between the two queries, so the queue could name one artifact and the
     * panel another for the same learner and block. The tiebreak is not
     * decoration; it is what keeps the button and the row talking about the
     * same thing.
     */
    `select distinct on (s.subject_id, s.block_id)
            s.subject_id,
            s.submission_id,
            s.block_id,
            s.settled_at,
            (s.answer is not null) as readable,
            h.disposition,
            h.reviewed_by,
            h.reviewed_at
       from learning_submissions s
       left join human_reviews h
              on h.subject_id = s.subject_id
             and h.submission_id = s.submission_id
      where s.subject_id = any($1::uuid[])
        and s.block_id   = any($2::text[])
        and s.settled_at is not null
      order by s.subject_id, s.block_id, s.settled_at desc, s.submission_id desc`,
    [subjectIds, blockIds],
  );

  return r.rows.map((row) => ({
    subjectId: row.subject_id,
    submissionId: row.submission_id,
    blockId: row.block_id,
    submittedAt: new Date(row.settled_at).toISOString(),
    readable: row.readable === true,
    review: toReview(row),
  }));
}

/* -------------------------------------------------------------------------- */
/* The words themselves, for exactly one learner                              */
/* -------------------------------------------------------------------------- */

export interface StoredResponse {
  blockId: string;
  submissionId: string;
  submittedAt: string;
  /** The current review of this artifact, or null while nobody has read it. */
  review: ReviewRecord | null;
  /**
   * The learner's text, or null.
   *
   * Null covers three distinct causes and the caller must not collapse them:
   * a row that predates artifact storage, a stored artifact of a kind that
   * carries no prose (`{kind:"none"}` — they pressed check with an empty box),
   * and a value `readArtifact` refused to trust. All three mean "there is
   * nothing to read", and none of them means "the learner wrote nothing bad".
   */
  text: string | null;
}

/**
 * One learner's stored words on the named blocks.
 *
 * A single `subjectId`, and it is a parameter the caller has already checked
 * against this class's roster (`memberBySubject`). Two learners cannot be
 * requested in one call, which keeps "whose work was read" answerable.
 */
export async function storedResponses(
  sql: SqlExecutor,
  subjectId: string,
  blockIds: readonly string[],
): Promise<StoredResponse[]> {
  if (blockIds.length === 0) return [];

  const r = await sql.query<{
    block_id: string;
    submission_id: string;
    settled_at: string;
    answer: unknown;
    disposition: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
  }>(
    /* Same `distinct on` shape and the same `submission_id` tiebreak as
       `reviewQueue`, so the panel and the queue always name one artifact. */
    `select distinct on (s.block_id)
            s.block_id,
            s.submission_id,
            s.settled_at,
            s.answer,
            h.disposition,
            h.reviewed_by,
            h.reviewed_at
       from learning_submissions s
       left join human_reviews h
              on h.subject_id = s.subject_id
             and h.submission_id = s.submission_id
      where s.subject_id = $1::uuid
        and s.block_id   = any($2::text[])
        and s.settled_at is not null
      order by s.block_id, s.settled_at desc, s.submission_id desc`,
    [subjectId, blockIds],
  );

  return r.rows.map((row) => ({
    blockId: row.block_id,
    submissionId: row.submission_id,
    submittedAt: new Date(row.settled_at).toISOString(),
    text: proseOf(readArtifact(row.answer)),
    review: toReview(row),
  }));
}

/**
 * The prose inside an artifact, or null when it holds none.
 *
 * `BlockAnswer` is a union covering every block type, and only `text` carries
 * writing. An `option` id or an `order` of ids is a machine-checkable choice,
 * not an explanation — rendering one as though it were the learner's words
 * would be inventing prose out of an identifier. Trimmed-to-empty is null for
 * the same reason: a box containing three spaces is not an answer.
 */
function proseOf(artifact: SubmittedArtifact | undefined): string | null {
  if (!artifact || artifact.kind !== "text") return null;
  const trimmed = artifact.value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
