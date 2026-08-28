import "server-only";
import type { LearningStore } from "@schools/store/learning-store";
import { bump } from "@schools/ops/counters";

/**
 * One submission, graded once.
 *
 * ## The defect
 *
 * `/api/learning/submit` had no idempotency key. Every call appended a fresh
 * `verdict_received` and, on a wrong answer, a fresh `failure_attributed` — and
 * the route derives the learner's prior-failure count by COUNTING those rows.
 * So a submission that reached the route twice was two attempts by the same
 * child: an inflated failure count, a reveal policy advanced by a retry nobody
 * made (the programme requires the solution idea be withheld until several
 * genuine attempts — PDF p.4), and an attempt handed to the reducer that never
 * happened. A double-click, a reconnecting mobile network and a browser
 * retrying a POST whose response was lost all produce it.
 *
 * ## Where the id comes from, and the rule that makes it mean something
 *
 * The client mints it — see `SchoolLesson.submissionFor` — and the rule is:
 *
 *   **one submission id per (block, exact answer).** It is minted on the Check
 *   press when the block holds no id for the answer currently in the editor,
 *   and it is kept for as long as that answer is unchanged.
 *
 * That is what makes "the same submission retried" and "a second genuine
 * attempt" decidable from state the client actually has, rather than from a
 * guess about what the network did. Press Check twice on the same text — by
 * double-click, by re-press after a failed round trip, by a retry the browser
 * made on its own — and it is one submission. Change the answer and press
 * Check, and it is a new one, counted, attributed, and moving the reveal policy
 * along as it should.
 *
 * The deliberate consequence: re-submitting an answer the learner has ALREADY
 * been told is wrong, unchanged, is not a second attempt. It replays the first
 * verdict. That is the honest reading — nothing new was tried — and it also
 * closes the cheapest route to the reveal, which was to press Check three times
 * on the same wrong option.
 *
 * ## Why RUN is not idempotent, and must not become so
 *
 * `/api/exec/run` produces no evidence by contract. Running the same program
 * twice is the entire point of a Run button — a learner changes the input, or
 * just wants to see it again — and there is no ledger row for a second run to
 * corrupt. Idempotency here would be a feature removal dressed as hardening.
 * Only SUBMIT persistence is deduplicated.
 */

/**
 * How long a duplicate waits for the original to finish grading.
 *
 * The realistic duplicate is a double-click, which arrives while the first
 * request is still running the judge. The judge's own ceiling is
 * `EXECUTION_LIMITS.timeLimitMs` per case and a block can declare several, so
 * this has to cover a full multi-case run or the second click gets told nothing
 * was recorded while the first one is busy recording it.
 *
 * When it does expire the answer is "we could not confirm this was recorded",
 * never a verdict — see `unresolved` below.
 */
export const DUPLICATE_WAIT_MS = 20_000;

/** Poll interval while waiting. Short: the common case resolves in one or two. */
export const DUPLICATE_POLL_MS = 25;

/**
 * When an unsettled claim may be taken over by a later request.
 *
 * A process that dies between claiming a submission and writing its events
 * leaves a row that will never settle. Without a takeover the learner is locked
 * out of that exact answer forever — the id is stable while their text is
 * unchanged, so every retry finds the same dead claim, and their only escape is
 * to edit an answer that was fine. A crash must not cost a child the ability to
 * submit what they wrote.
 *
 * Sixty seconds is far above any legitimate in-flight submission (the judge
 * ceiling is five seconds a case) and far below a learner's patience, so the
 * takeover can only ever fire on a claim whose owner is genuinely gone.
 *
 * The residual risk, stated rather than hidden: a process that dies in the
 * window between committing the events and returning is indistinguishable from
 * one that died before writing anything, so a takeover after such a crash
 * re-grades and writes a second set of events. The commit is atomic — events
 * and settlement land in one transaction — so that window is the few
 * microseconds between the commit and the response, and the alternative to
 * accepting it is a permanent lockout.
 */
export const STALE_CLAIM_SECONDS = 60;

export type SubmissionClaim =
  /** Nobody has graded this. Grade it, write the events, settle the claim. */
  | { kind: "owner" }
  /** Already graded. Return this response and write NOTHING. */
  | { kind: "duplicate"; response: unknown }
  /**
   * The original is still in flight and did not finish in time. Nothing was
   * graded and nothing may be written — the caller is told the submission was
   * not recorded and offers the check again, which will find the settled row.
   */
  | { kind: "unresolved" }
  /**
   * This id is already this learner's, on a DIFFERENT block. Replaying the
   * other block's verdict would be inventing a result for a task they did not
   * just answer, so the request is refused instead.
   */
  | { kind: "conflict"; claimedBlockId: string };

export interface ClaimInput {
  subjectId: string;
  submissionId: string;
  blockId: string;
  episodeId: string;
}

/**
 * Take the submission, or find out who already has it.
 *
 * The atomicity lives in one statement — `insert … on conflict do nothing`,
 * keyed on `(subject_id, submission_id)` — because a `select` followed by an
 * `insert` leaves exactly the window this exists to close: two requests both
 * find nothing, both grade, both append. Whatever the interleaving, one caller
 * gets `owner` and every other caller gets that owner's answer.
 */
export async function claimSubmission(
  store: LearningStore,
  input: ClaimInput,
  now: () => number = Date.now,
): Promise<SubmissionClaim> {
  const existing = await store.submissionRecord(input.subjectId, input.submissionId);

  if (existing && existing.blockId !== input.blockId) {
    return { kind: "conflict", claimedBlockId: existing.blockId };
  }

  if (existing?.settledAt) {
    bump("submit.duplicates");
    return { kind: "duplicate", response: existing.response };
  }

  if (!existing) {
    if (await store.claimSubmission(input)) return { kind: "owner" };
    /* Somebody claimed it between the read and the write. That is the race, and
       losing it is the correct outcome: fall through and wait for their answer
       rather than grading a second copy. */
  } else if (await takeOverIfAbandoned(store, input)) {
    return { kind: "owner" };
  }

  return waitForOriginal(store, input, now);
}

/** A claim whose owner never came back. Conditional and atomic in the database. */
async function takeOverIfAbandoned(store: LearningStore, input: ClaimInput): Promise<boolean> {
  return store.reclaimSubmission({
    subjectId: input.subjectId,
    submissionId: input.submissionId,
    episodeId: input.episodeId,
    staleAfterSeconds: STALE_CLAIM_SECONDS,
  });
}

async function waitForOriginal(
  store: LearningStore,
  input: ClaimInput,
  now: () => number,
): Promise<SubmissionClaim> {
  const deadline = now() + DUPLICATE_WAIT_MS;

  while (now() < deadline) {
    await sleep(DUPLICATE_POLL_MS);

    const record = await store.submissionRecord(input.subjectId, input.submissionId);

    /* The claim is gone. The owner's write failed and it released the claim
       rather than leaving a row nothing will ever settle — so this request may
       take the submission and grade it properly. */
    if (!record) {
      if (await store.claimSubmission(input)) return { kind: "owner" };
      continue;
    }

    if (record.blockId !== input.blockId) {
      return { kind: "conflict", claimedBlockId: record.blockId };
    }

    if (record.settledAt) {
      bump("submit.duplicates");
      return { kind: "duplicate", response: record.response };
    }
  }

  /* One last look for an abandoned claim before giving up: a request that
     waited the full window on a claim from a dead process should take it rather
     than telling the learner nothing was recorded twice in a row. */
  if (await takeOverIfAbandoned(store, input)) return { kind: "owner" };

  bump("submit.duplicate_timeouts");
  return { kind: "unresolved" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** v4-shaped, and the only shape the route will accept as a key. */
export function isSubmissionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
