import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { LessonBlock, Localized, VerifyBlock } from "@schools/curriculum/types";
import {
  ASSESSMENT_COMPLETION_POLICY,
  evaluateCompletion,
  levelFromEvidence,
  policyBlocksFromAuthored,
  requirementFor,
  type AttemptLevel,
  type PolicyBlock,
} from "@schools/policies/completion";
import { markingPointsFor } from "@schools/learning/post-help";
import type {
  AssessmentBlockResult,
  AssessmentLearnerRow,
  AssessmentState,
  AssessmentSummary,
  ClassAssessments,
  ReviewItem,
  ReviewQueue,
  ReviewState,
  StudentReview,
} from "./contracts";
import { attemptLevelLabel, blockKindLabel, type ClassBundle } from "./context";
import { classBlockEvidence, classCompletions, subjectIdsOf } from "./queries";
import {
  isHumanReviewable,
  reviewQueue,
  storedResponses,
  writtenness,
  type HumanReviewableBlock,
  type ReviewClaim,
  type ReviewRecord,
  type Writtenness,
} from "./review";

/**
 * The monthly check, as a teacher needs to read it.
 *
 * ## What an assessment is in this product
 *
 * Not a lesson and not a block kind — a `MonthlyAssessment` hanging off
 * `Month.assessment` with the id `m{n}.assessment`. It runs on the same player,
 * submits through the same route, and is recorded in the same table as a
 * lesson, distinguished only by `policy_id = 'assessment.v1'`.
 *
 * ## The three states the schema can support, and the one it cannot
 *
 * `not_started`, `in_progress` and `complete` are all derivable from the ledger
 * and the shipped policy. `awaiting_review` is derivable too, but it means
 * something narrower than it sounds and this file is careful about that: it
 * means every block a MACHINE can grade has been graded, and what remains is
 * structurally human-marked. It is a fact about the POLICY, not about anybody's
 * attention, and it is deliberately not the same thing as the marking queue
 * below: this state counts LEARNERS whose check has reached that stage, and the
 * queue counts ANSWERS a person has yet to read. They can legitimately read 0
 * and 3 on the same screen, which is why the state is named «Осталось учителю»
 * and not «Ждёт проверки человеком» — the two used to share a sentence and a
 * teacher read the pair as a bug.
 *
 * ## The honesty problem this file used to surface, and what replaced it
 *
 * September's `m1.as.b3` (written explanation) and `m1.as.b4` (the note beside
 * an oral defence) accept real prose from a fourteen-year-old, and the UI tells
 * them «Жауабың сақталды — оны мұғалім оқиды» — your answer is saved, a teacher
 * will read it. **Until migration 0021 that was false**, and this file carried
 * the gap onto the teacher's screen as `unreadableResponses` rather than
 * letting the dashboard imply an answer existed to read.
 *
 * 0021 added `learning_submissions.answer`, written inside the transaction that
 * settles the verdict. The words are kept now, so the field is renamed to what
 * it always measured — `humanMarkedAnswers`, the amount of marking a class has
 * produced — and the reading of them is a real workflow in
 * `schools/teacher/review.ts`.
 *
 * One thing did not become true retroactively: a submission settled BEFORE
 * 0021 kept its verdict and lost its words permanently. `ReviewQueue.unreadable`
 * is that residue, counted rather than smoothed over.
 *
 * The oral half is still not a recording. There is no audio anywhere in this
 * product and the copy must never imply one; see `writtenness()` in `review.ts`.
 *
 * ## Judge outages
 *
 * `assessment.v1` requires `measured` on both coding blocks, so a judge outage
 * during the check silently zeroes a whole class's completion — and the ledger
 * records only the absence of a verdict. `unmeasuredCoding` reconstructs it:
 * a machine-gradable block with submissions and no verdicts is a block nobody
 * could measure. That is a very different fact from a learner who did not sit
 * the check, and a dashboard that cannot tell them apart is one a school will
 * be misled by exactly once.
 */

export interface AssessmentBundle {
  summary: AssessmentSummary | null;
  learners: AssessmentLearnerRow[];
  /** Per subject, for the attention queue. Absent when nothing is outstanding. */
  outstanding: Map<string, { done: number; total: number; started: boolean }>;
  /** Share of the roster that has finished it. Gates the attention finding. */
  completionShare: number;
  /**
   * The class's human-review claims, read once.
   *
   * Held on the bundle rather than re-queried because two screens need them
   * from the same load: the overview only wants the pending COUNT, and the
   * assessments page wants the rows. Splitting that into two queries would let
   * the number on one screen and the list on the other disagree after a write
   * that landed between them.
   */
  reviewClaims: ReviewClaim[];
  /** The blocks of this month's check that a human is asked to mark. */
  reviewableBlocks: HumanReviewableBlock[];
}

/* -------------------------------------------------------------------------- */

export async function buildAssessmentSummary(
  sql: SqlExecutor,
  bundle: ClassBundle,
  now: number,
): Promise<AssessmentBundle> {
  void now;
  const assessment = bundle.month.assessment;
  const empty: AssessmentBundle = {
    summary: null,
    learners: [],
    outstanding: new Map(),
    completionShare: 0,
    reviewClaims: [],
    reviewableBlocks: [],
  };
  if (!assessment || assessment.blocks.length === 0) return empty;

  const policyBlocks = policyBlocksFromAuthored(assessment.blocks);
  const blockById = new Map(assessment.blocks.map((b) => [b.id, b]));
  const blockIds = assessment.blocks.map((b) => b.id);

  /* The blocks a human is asked to mark, and every claim against them. Read
     here, once, so the overview's pending count and the assessments page's
     list come from one snapshot. */
  const reviewableBlocks = assessment.blocks.filter(isHumanReviewable);

  const [evidence, completions, reviewClaims] = await Promise.all([
    classBlockEvidence(sql, bundle.subjectIds, blockIds),
    classCompletions(sql, bundle.subjectIds),
    reviewQueue(sql, bundle.subjectIds, reviewableBlocks.map((b) => b.id)),
  ]);
  const minutes = await assessmentMinutes(sql, bundle.subjectIds);

  const bySubject = new Map<string, Map<string, { submissions: number; verdicts: number; accepted: boolean }>>();
  for (const row of evidence) {
    const inner = bySubject.get(row.subjectId) ?? new Map();
    inner.set(row.blockId, {
      submissions: row.submissions,
      verdicts: row.verdicts,
      accepted: row.accepted,
    });
    bySubject.set(row.subjectId, inner);
  }

  const completedAtBySubject = new Map<string, string>();
  for (const c of completions) {
    if (c.lessonId === assessment.id && !completedAtBySubject.has(c.subjectId)) {
      completedAtBySubject.set(c.subjectId, c.completedAt);
    }
  }

  const counts: Record<AssessmentState, number> = {
    not_open: 0,
    not_started: 0,
    in_progress: 0,
    awaiting_review: 0,
    complete: 0,
  };
  const learners: AssessmentLearnerRow[] = [];
  const outstanding = new Map<string, { done: number; total: number; started: boolean }>();
  let unmeasuredCoding = 0;
  let humanMarkedAnswers = 0;

  const open = bundle.context.curriculum.open && assessment.status !== "draft";

  for (const member of bundle.members) {
    const sid = member.subjectId;
    const ev = sid ? (bySubject.get(sid) ?? new Map()) : new Map();

    /* An intermediate shape: everything except the localised rung name, which
       `withLabels` attaches in one place so the label map has one home. */
    const blocks: RawBlockResult[] = [];
    let anyEvidence = false;
    let learnerUnmeasured = false;
    let humanMarkedAnswered = 0;
    let governedMet = 0;
    let governedTotal = 0;

    for (const pb of policyBlocks) {
      const required = requirementFor(ASSESSMENT_COMPLETION_POLICY, pb);
      if (required === "none") continue;
      governedTotal += 1;

      const e = ev.get(pb.id) ?? { submissions: 0, verdicts: 0, accepted: false };
      const reached = levelFromEvidence(e);
      if (reached !== "none") anyEvidence = true;

      const met = meetsLevel(reached, required);
      if (met) governedMet += 1;

      /* A machine-gradable block that was submitted and never judged. The
         submit route knows why — `judgeUnavailable` vs `noTrustedJudge` — and
         stores neither, so this is the only trace an outage leaves. */
      if (pb.machineGradable && e.submissions > 0 && e.verdicts === 0) {
        learnerUnmeasured = true;
      }

      const authored = blockById.get(pb.id);
      const human = authored ? isHumanMarked(authored, pb) : false;
      if (human && reached === "answered") humanMarkedAnswered += 1;
      if (human && reached !== "none") humanMarkedAnswers += 1;

      blocks.push({
        blockId: pb.id,
        kindLabel: assessmentTaskLabel(authored, pb),
        machineGradable: pb.machineGradable,
        reached,
        required,
        met,
        expectedPoints: authored ? (markingPointsFor(authored) ?? null) : null,
      });
    }

    const decision = evaluateCompletion({
      policy: ASSESSMENT_COMPLETION_POLICY,
      blocks: policyBlocks,
      reached: (id) => levelFromEvidence(ev.get(id) ?? { submissions: 0, verdicts: 0, accepted: false }),
    });

    const state: AssessmentState = !open
      ? "not_open"
      : !anyEvidence
        ? "not_started"
        : decision.satisfied || completedAtBySubject.has(sid ?? "")
          ? "complete"
          : /* Everything a machine could grade is graded, and only human-marked
               work remains. This is as close to "awaiting review" as the schema
               can honestly get — nobody has been asked to look, because there is
               `human_reviews` (0022) is where a reading is recorded. */
            humanMarkedAnswered > 0 && decision.outstanding.every((o) => isHumanOutstanding(o.blockId, blockById))
            ? "awaiting_review"
            : "in_progress";

    counts[state] += 1;
    if (learnerUnmeasured) unmeasuredCoding += 1;

    if (sid && (state === "not_started" || state === "in_progress")) {
      /* `started` is what separates "opened the check and stopped" from "the
         check opened this morning". Only the first is a fact about the learner
         on the day it happens. */
      outstanding.set(sid, {
        done: governedMet,
        total: governedTotal,
        started: state === "in_progress",
      });
    }

    learners.push({
      subjectId: sid,
      displayName: member.displayName,
      state,
      completedAt: sid ? (completedAtBySubject.get(sid) ?? null) : null,
      blocks: withLabels(blocks),
      minutes: sid ? (minutes.get(sid) ?? null) : null,
      unmeasuredCoding: learnerUnmeasured,
    });
  }

  return {
    summary: {
      assessmentId: assessment.id,
      monthIndex: bundle.month.index,
      title: assessment.title,
      open,
      budgetMinutes: assessment.minutes ?? null,
      counts,
      unmeasuredCoding,
      humanMarkedAnswers,
      /* Only what nobody has read. A follow-up is not pending — a person read
         it and decided the class has to come back to it, which is a different
         state and belongs in a different place on the screen. */
      pendingReview: reviewClaims.filter((c) => c.review === null).length,
    },
    learners,
    outstanding,
    completionShare:
      bundle.members.length > 0
        ? (counts.complete + counts.awaiting_review) / bundle.members.length
        : 0,
    reviewClaims,
    reviewableBlocks,
  };
}

export async function buildAssessments(
  sql: SqlExecutor,
  bundle: ClassBundle,
  now: number,
  /** The signed-in teacher, so each row can say whether they were the reader. */
  viewerId: string,
): Promise<ClassAssessments> {
  const built = await buildAssessmentSummary(sql, bundle, now);
  return {
    context: bundle.context,
    freshness: bundle.freshness,
    assessments: built.summary
      ? [{ ...built.summary, learners: built.learners }]
      : [],
    review: buildReviewQueue(bundle, built, viewerId),
  };
}

/* -------------------------------------------------------------------------- */
/* The marking queue                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Who is waiting for a person to read their work.
 *
 * Sorted oldest submission first. That is the only defensible order: a teacher
 * with twenty minutes should reach the learner who has been waiting longest,
 * and any other ranking — by name, by state, by how much the system thinks the
 * learner is struggling — would be the console deciding whose writing matters
 * more.
 *
 * Learners with no subject are absent by construction: a child who has never
 * opened a lesson has submitted nothing. Learners whose row predates migration
 * 0021 are PRESENT, marked `readable: false`, because they did the work and the
 * absence is the platform's, not theirs.
 */
function buildReviewQueue(
  bundle: ClassBundle,
  built: AssessmentBundle,
  /** The signed-in teacher, so a row can say whether they were the reader. */
  viewerId: string,
): ReviewQueue | null {
  const assessment = bundle.month.assessment;
  if (!assessment) return null;

  const reviewable = built.reviewableBlocks;
  if (reviewable.length === 0) {
    return {
      assessmentId: assessment.id,
      title: assessment.title,
      humanMarkedBlocks: 0,
      items: [],
      unreadable: 0,
      pending: 0,
      followUp: 0,
    };
  }

  const byId = new Map(reviewable.map((b) => [b.id, b] as const));
  const nameBySubject = new Map<string, string>();
  for (const m of bundle.members) if (m.subjectId) nameBySubject.set(m.subjectId, m.displayName);

  const claims = built.reviewClaims;

  const items: ReviewItem[] = [];
  for (const claim of claims) {
    const block = byId.get(claim.blockId);
    const displayName = nameBySubject.get(claim.subjectId);
    /* A claim whose learner is not on this roster cannot happen — the subject
       ids came from it — but the map lookup is the place that would notice if
       the population ever stopped being the roster. */
    if (!block || !displayName) continue;
    items.push({
      subjectId: claim.subjectId,
      displayName,
      blockId: claim.blockId,
      submissionId: claim.submissionId,
      taskLabel: responseFormLabel(writtenness(block)),
      form: writtenness(block),
      submittedAt: claim.submittedAt,
      readable: claim.readable,
      review: reviewState(claim.review, viewerId),
    });
  }

  items.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return {
    assessmentId: assessment.id,
    title: assessment.title,
    humanMarkedBlocks: reviewable.length,
    items,
    /* Counted from the same array the screen renders, so «Ждут проверки — N»
       and the list under it cannot disagree. A follow-up is not pending: a
       person read it and decided something. */
    pending: items.filter((i) => i.review === null).length,
    followUp: items.filter((i) => i.review?.disposition === "needs_followup").length,
    /*
     * Counted from the rows themselves, not by subtracting two populations.
     *
     * It used to be `humanMarkedAnswers - readable items`, and the two sides
     * came from different allowlists: the minuend from `isHumanMarked` (any
     * block a machine cannot grade) and the subtrahend from `isHumanReviewable`
     * (which additionally requires authored `expectedPoints`). A block that is
     * human-marked but carries no marking criteria therefore inflated this by
     * one per learner, permanently, and no amount of reviewing could bring it
     * down — the arithmetic had no way back to zero.
     *
     * What the number actually means is "queued rows with no stored text", and
     * that is one filter over one array. Scoped to the rows still waiting,
     * because it annotates the pending heading: telling a teacher that one of
     * the answers they are waiting on has no text is only true while it is
     * still waiting.
     */
    unreadable: items.filter((i) => !i.readable && i.review === null).length,
  };
}

/**
 * One learner's words, for the review panel.
 *
 * Every block the curriculum asks a human to mark is returned — including ones
 * this learner never submitted, with `submittedAt: null`. A panel that listed
 * only what exists would leave a teacher unable to tell "answered everything"
 * from "answered one of two".
 */
export async function buildStudentReview(
  sql: SqlExecutor,
  bundle: ClassBundle,
  subjectId: string,
  displayName: string,
  /** The signed-in teacher, so a row can say whether they were the reader. */
  viewerId: string,
): Promise<StudentReview | null> {
  const assessment = bundle.month.assessment;
  if (!assessment) return null;

  const reviewable = assessment.blocks.filter(isHumanReviewable);
  if (reviewable.length === 0) return null;

  const stored = new Map(
    (await storedResponses(sql, subjectId, reviewable.map((b) => b.id))).map(
      (r) => [r.blockId, r] as const,
    ),
  );

  return {
    context: bundle.context,
    subjectId,
    displayName,
    assessmentTitle: assessment.title,
    responses: reviewable.map((block) => {
      const found = stored.get(block.id);
      return {
        blockId: block.id,
        submissionId: found?.submissionId ?? null,
        review: reviewState(found?.review ?? null, viewerId),
        taskLabel: responseFormLabel(writtenness(block)),
        form: writtenness(block),
        prompt: block.prompt,
        expectedPoints: markingPointsFor(block),
        submittedAt: found?.submittedAt ?? null,
        text: found?.text ?? null,
      };
    }),
  };
}

const WRITTEN_TASK_LABEL = {
  kk: "Жазбаша түсіндірме",
  ru: "Письменное объяснение",
} as const;

/**
 * The oral defence, named as what the platform actually holds.
 *
 * «Заметка к устному ответу» — a note toward the oral answer — and not «устный
 * ответ». Nothing records what the learner said; the defence happens in the
 * room. Calling the stored note the oral answer would be the console claiming
 * a recording.
 */
const ORAL_TASK_LABEL = {
  kk: "Ауызша жауапқа жазба",
  ru: "Заметка к устному ответу",
} as const;

/**
 * The stored review, as the screen needs it.
 *
 * `reviewedBy` is a `user_id` and never leaves the server: a teacher does not
 * need a colleague's account id, and shipping one would put an identifier on a
 * screen that has spent this whole surface removing them. What a teacher does
 * need is whether THEY were the reader — that is the difference between "I have
 * dealt with this" and "somebody has", and on a co-taught class it is the
 * question they actually ask.
 */
function reviewState(record: ReviewRecord | null, viewerId: string): ReviewState | null {
  if (!record) return null;
  return {
    disposition: record.disposition,
    reviewedAt: record.reviewedAt,
    byYou: record.reviewedBy === viewerId,
  };
}

/**
 * What to call one assessment task on a teacher's screen.
 *
 * `blockKindLabel(type)` is not enough here. September's check is three
 * `verify` blocks and one `explain`, so the task key rendered
 * «Проверка самостоятельности» three times — same name, same description, one
 * showing 1/21 and the next 0/21. A teacher who cannot tell two rows apart
 * cannot tell a learner which task they failed, and that band exists for
 * nothing else.
 *
 * `VerifyBlock.mode` is the programme's own five independence checks (PDF p.6),
 * so naming by mode is naming the thing the author actually wrote rather than
 * inventing a distinction.
 */
function assessmentTaskLabel(block: LessonBlock | undefined, pb: PolicyBlock): Localized {
  if (block?.type === "verify") return VERIFY_MODE_LABEL[block.mode];
  return blockKindLabel(pb.type);
}

const VERIFY_MODE_LABEL: Record<VerifyBlock["mode"], Localized> = {
  unseen_problem: { kk: "Бұрын талданбаған есеп", ru: "Ранее не разобранная задача" },
  find_bug: { kk: "Бөтен бағдарламадағы қате", ru: "Ошибка в чужой программе" },
  manual_trace: { kk: "Қолмен қадамдау", ru: "Разбор по шагам вручную" },
  delayed_resolve: { kk: "Кейінге қалдырылған есеп", ru: "Отложенное дорешивание" },
  /* Not «устный ответ». Nothing records what the learner says; the platform
     holds the note they wrote before speaking. See `writtenness()`. */
  oral_explanation: ORAL_TASK_LABEL,
};

/**
 * What to call the task in the review queue.
 *
 * Not the block id, and not the block type. «Письменное объяснение» is what the
 * learner did; `m1.as.b3` is where it is stored, and the second is not a name a
 * teacher has any use for.
 */
function responseFormLabel(form: Writtenness) {
  return form === "spoken_note" ? ORAL_TASK_LABEL : WRITTEN_TASK_LABEL;
}


/* -------------------------------------------------------------------------- */

/**
 * Blocks a human marks, by construction rather than by outage.
 *
 * `explain` and `test_case` never produce a machine verdict, and a `verify`
 * block in oral mode is a conversation. `machineGradable` already encodes the
 * first two; the third needs the authored block because the mode is not on the
 * policy shape.
 */
function isHumanMarked(block: LessonBlock, pb: PolicyBlock): boolean {
  if (!pb.machineGradable) return true;
  return block.type === "verify" && "mode" in block && block.mode === "oral_explanation";
}

function isHumanOutstanding(blockId: string, blocks: Map<string, LessonBlock>): boolean {
  const b = blocks.get(blockId);
  if (!b) return false;
  return b.type === "explain" || b.type === "test_case" ||
    (b.type === "verify" && "mode" in b && b.mode === "oral_explanation");
}

const RUNG: Record<AttemptLevel, number> = {
  none: 0,
  attempted: 1,
  answered: 2,
  measured: 3,
  passed: 4,
};

function meetsLevel(reached: AttemptLevel, required: AttemptLevel): boolean {
  return RUNG[reached] >= RUNG[required];
}

/** Everything a block result carries except its localised rung name. */
type RawBlockResult = Omit<AssessmentBlockResult, "reachedLabel"> & {
  reached: AttemptLevel;
  required: AttemptLevel;
};

/** Attach the localised rung name. Kept separate so the label map has one home. */
function withLabels(blocks: readonly RawBlockResult[]): AssessmentBlockResult[] {
  return blocks.map((b) => ({ ...b, reachedLabel: attemptLevelLabel(b.reached) }));
}

/**
 * Measured minutes on the monthly check, per learner.
 *
 * `MonthlyAssessment.minutes` is an AUTHORED budget the product does not
 * enforce — there is no timer component anywhere — so it is rendered as an
 * estimate. This is the real figure: wall-clock corrected active seconds over
 * episodes the grading route stamped `task_kind = 'assessment'`. Server-stamped,
 * not client-claimed.
 */
export async function assessmentMinutes(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<Map<string, number>> {
  if (subjectIds.length === 0) return new Map();
  const r = await sql.query<{ subject_id: string; secs: number }>(
    `select subject_id, coalesce(sum(active_seconds), 0)::int as secs
       from attempt_episodes
      where subject_id = any($1::uuid[])
        and task_kind = 'assessment'
      group by 1`,
    [subjectIds],
  );
  return new Map(r.rows.map((row) => [row.subject_id, Math.round(Number(row.secs) / 60)]));
}

