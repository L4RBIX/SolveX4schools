import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import { hintEffectiveness } from "@solvex/learning-intelligence-core";
import type { InterventionOutcome } from "@solvex/learning-intelligence-core";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { teacherFailureClassLabel } from "@schools/presentation/labels";
import { EVIDENCE_LABEL, skillEvidence } from "@schools/presentation/evidence";
import type { Localized } from "@schools/curriculum/types";
import { DEFAULT_TRACK } from "@schools/learning/track";
import { completionTarget } from "@schools/policies/lookup";
import type {
  AssistanceAnalytics,
  PeriodDescriptor,
  RosterRow,
  StudentDetail,
  TimelineEntry,
  TimelineKind,
  TrendPoint,
} from "./contracts";
import { authoredLessons, blockIndexOf, loadRequiredWork, type ClassBundle } from "./context";
import {
  assistanceDelivery,
  classActivityBuckets,
  classCompletions,
  classInterventionOutcomes,
  classReviews,
  episodesForSubject,
  learnerStatesFor,
  type EpisodeRowForTimeline,
} from "./queries";
import { blockIdFromTaskRef } from "./build-class";
import { buildAssessmentSummary } from "./build-assessment";
import { TL } from "./labels";

/**
 * One learner, in depth.
 *
 * ## The two clocks on this page, and why they are labelled
 *
 * Half of what a teacher wants here is RECENT — what happened this week — and
 * half is ESTABLISHED — which skills this learner has independent evidence on
 * after two months. The first comes from windowed SQL over `attempt_episodes`;
 * the second comes from `learner_state`, which is all-time by construction and
 * cannot honestly be windowed.
 *
 * Putting a 7-day count beside an all-time count without saying which is which
 * is exactly the defect the audit found on the old panel, where «18 попыток»
 * (all-time episodes, including skill-less ones) sat on the same line as
 * «5 самостоятельно» (per-skill, skill-bearing only) with nothing to explain
 * the gap. So the payload separates them into `row` and `cumulative`, and the
 * UI labels both.
 *
 * ## What is not here, on purpose
 *
 * The learner's conversation with Nova. It is not stored anywhere — the payload
 * allowlist has no text key, `interventions.content_hash` is never written, and
 * the chat lives in browser state alone. `AssistanceAnalytics` carries counts
 * and outcomes and no content, and the UI states that as a property rather than
 * leaving it as an absence for someone to fill in later.
 */

export async function buildStudentDetail(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  subjectId: string,
  row: RosterRow,
  now: number,
  degradedProvider: boolean,
): Promise<StudentDetail> {
  const [states, completions, reviews, outcomes, delivery, activity, episodes, assessment] =
    await Promise.all([
      learnerStatesFor(sql, [subjectId]),
      classCompletions(sql, [subjectId]),
      classReviews(sql, [subjectId]),
      classInterventionOutcomes(sql, [subjectId], period.from, period.to),
      assistanceDelivery(sql, [subjectId], period.from, period.to),
      classActivityBuckets(sql, [subjectId], period.from, period.to, period.grain),
      episodesForSubject(sql, subjectId, period.from, period.to, 120),
      buildAssessmentSummary(sql, bundle, now),
    ]);

  const required = await loadRequiredWork(sql, [subjectId], bundle.month);
  const stored = states.get(subjectId);
  const state = stored?.state ?? null;
  const blocks = blockIndexOf();

  /* ---- skills ---------------------------------------------------------- */
  const skills = [...SKILL_BY_ID.entries()]
    .filter(([, def]) => def.introducedInMonth <= bundle.month.index)
    .map(([skillId, def]) => {
      const s = state?.skills.find((x) => x.skill === skillId);
      const evidence = s && s.attempts > 0 ? skillEvidence(s) : ("not_started" as const);
      return {
        skillId,
        title: def.title,
        state: evidence,
        stateLabel: EVIDENCE_LABEL[evidence],
        attempts: s?.attempts ?? 0,
        soloSolved: s?.soloSolved ?? 0,
        assistedSolved: s?.assistedSolved ?? 0,
        summary: skillSummary(s?.attempts ?? 0, s?.soloSolved ?? 0, s?.assistedSolved ?? 0),
        /* Only actionable ones. A single observation is never actionable
           (`observationConfidence` returns 0 below two distinct episodes), and
           showing an unconfirmed one to a teacher is how a guess becomes a
           label a child carries. */
        misconceptions: (s?.misconceptions ?? [])
          .filter((m) => m.actionable)
          .map((m) => ({
            failureClass: m.failureClass,
            label: teacherFailureClassLabel(m.failureClass),
            distinctEpisodes: m.distinctEpisodes,
            lastSeenAt: m.lastSeenAt,
            episodeIds: m.episodeIds.slice(0, 10),
          })),
      };
    });

  /* ---- lessons --------------------------------------------------------- */
  const completedAt = new Map(completions.map((c) => [c.lessonId, c.completedAt] as const));
  const lessons = authoredLessons(bundle.month).map(({ lesson }) => {
    const decision = required.bySubject.get(subjectId)?.perLesson.get(lesson.id);
    const target = completionTarget(lesson.id, DEFAULT_TRACK);
    return {
      lessonId: lesson.id,
      title: lesson.title,
      completedAt: completedAt.get(lesson.id) ?? null,
      reached: decision?.met ?? 0,
      total: decision?.governed ?? (target?.blocks.filter((b) => b.isAttempt).length ?? 0),
    };
  });

  /* ---- assistance ------------------------------------------------------ */
  const rows = outcomes.map((o) => ({
    level: o.level,
    outcome: o.outcome as InterventionOutcome,
  }));
  const report = hintEffectiveness(rows);
  const progressedByLevel = new Map<number, number>();
  for (const o of outcomes) {
    if (o.level === null || o.outcome !== "progressed") continue;
    progressedByLevel.set(o.level, (progressedByLevel.get(o.level) ?? 0) + 1);
  }

  const assistedBlocks = new Map<string, { interventions: number; learners: Set<string> }>();
  for (const o of outcomes) {
    if (!o.blockId) continue;
    const cur = assistedBlocks.get(o.blockId) ?? { interventions: 0, learners: new Set<string>() };
    cur.interventions += 1;
    cur.learners.add(o.subjectId);
    assistedBlocks.set(o.blockId, cur);
  }

  const d = delivery.get(subjectId) ?? { subjectId, requested: 0, delivered: 0 };
  const assistance: AssistanceAnalytics = {
    requested: d.requested,
    delivered: d.delivered,
    /* Granted and never streamed. A row lands in `interventions` at grant time,
       before the provider is called, so an outage still charges the rung — that
       gap is the honest "help that never arrived" number. Clamped at zero
       because the two events are counted over `received_at` and a delivery can
       straddle the window boundary. */
    undelivered: Math.max(0, d.requested - d.delivered),
    byLevel: report.byLevel.map((l) => ({
      level: l.level,
      delivered: l.delivered,
      resolvedIndependently: l.resolvedIndependently,
      resolvedByTransfer: l.resolvedByTransfer,
      progressed: progressedByLevel.get(l.level) ?? 0,
      escalated: l.escalated,
      stalled: l.stalled,
      regressed: l.regressed,
    })),
    mostAssistedBlocks: [...assistedBlocks.entries()]
      .sort((a, b) => b[1].interventions - a[1].interventions)
      .slice(0, 5)
      .map(([blockId, v]) => ({
        blockId,
        title: blocks.get(blockId)?.lessonTitle ?? { kk: blockId, ru: blockId },
        interventions: v.interventions,
        learners: v.learners.size,
      })),
    degradedProvider,
  };

  /* ---- reviews --------------------------------------------------------- */
  const reviewRows = reviews.map((r) => ({
    blockId: r.blockId,
    title: blocks.get(r.blockId)?.lessonTitle ?? { kk: r.blockId, ru: r.blockId },
    reasonLabel:
      r.reason === "independent_milestone" ? TL.reviewReasonMilestone : TL.reviewReasonAssisted,
    dueAt: r.dueAt,
    completedAt: r.completedAt,
    outcomeLabel: reviewOutcomeLabel(r.outcome),
  }));

  return {
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    row,
    cumulative: {
      episodes: state?.episodes ?? 0,
      soloSolved: (state?.skills ?? []).reduce((n, s) => n + s.soloSolved, 0),
      assistedSolved: (state?.skills ?? []).reduce((n, s) => n + s.assistedSolved, 0),
      interventions: state?.assistance.interventions ?? 0,
      unexplainedFailures: state?.unattributedFailures ?? 0,
      transferSolves: state?.assistance.transferSolves ?? 0,
      computedAt: stored?.computedAt ?? null,
    },
    skills,
    lessons,
    assessment: assessment.learners.find((l) => l.subjectId === subjectId) ?? null,
    assistance,
    reviews: reviewRows,
    timeline: buildTimeline(episodes, completions, reviews, blocks),
    activity: activity.map(
      (b): TrendPoint => ({
        bucket: b.bucket,
        activeLearners: b.activeLearners,
        episodes: b.episodes,
        solvedIndependent: b.solvedIndependent,
        solvedAssisted: b.solvedAssisted,
        practiceMinutes: Math.round(b.activeSeconds / 60),
        interventions: b.interventions,
      }),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

/** A break long enough that coming back is itself worth showing. */
const RETURN_GAP_DAYS = 5;

/**
 * Human-readable learning events, newest first.
 *
 * ## What is deliberately excluded
 *
 * Every reducer tick, every `code_diff_classified`, every `idle_gap`, every
 * `statement_revisited`. The brief asks for this and it is right: a teacher
 * scrolling a hundred `episode_resumed` rows learns nothing, and the internal
 * event names are exactly the vocabulary that must never reach a classroom.
 *
 * What is here is one line per episode, plus completions and settled re-solves.
 * Each line is a sentence a teacher could have written.
 */
function buildTimeline(
  episodes: readonly EpisodeRowForTimeline[],
  completions: Awaited<ReturnType<typeof classCompletions>>,
  reviews: Awaited<ReturnType<typeof classReviews>>,
  blocks: ReturnType<typeof blockIndexOf>,
): TimelineEntry[] {
  const out: TimelineEntry[] = [];

  /* Ascending, so "returned after a break" can look at the previous episode.
     The result is reversed at the end. */
  const ordered = [...episodes].sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  let previousAt: string | null = null;
  for (const e of ordered) {
    const blockId = blockIdFromTaskRef(e.taskRef);
    const entry = blocks.get(blockId);
    const title = entry?.lessonTitle ?? null;

    if (previousAt) {
      const gapDays = (Date.parse(e.openedAt) - Date.parse(previousAt)) / 86_400_000;
      if (gapDays >= RETURN_GAP_DAYS) {
        out.push({
          at: e.openedAt,
          kind: "returned_after_break",
          detail: withTitle(TL.timelineReturnedAfterBreak, null),
          blockId: null,
          lessonId: null,
          episodeId: null,
        });
      }
    }
    previousAt = e.openedAt;

    const kind: TimelineKind = e.solutionRevealed
      ? "solution_revealed"
      : e.outcome === "accepted"
        ? e.independenceWeight >= 1
          ? "solved_independently"
          : "solved_with_help"
        : e.interventionCount > 0
          ? "assistance_taken"
          : "attempted";

    out.push({
      at: e.openedAt,
      kind,
      detail: withTitle(TIMELINE_LABEL[kind], title),
      blockId,
      lessonId: entry?.lessonId ?? null,
      episodeId: e.episodeId,
    });
  }

  for (const c of completions) {
    const title = titleForLesson(c.lessonId, blocks);
    out.push({
      at: c.completedAt,
      kind: "lesson_completed",
      detail: withTitle(TL.timelineLessonCompleted, title),
      blockId: null,
      lessonId: c.lessonId,
      episodeId: null,
    });
  }

  for (const r of reviews) {
    if (!r.completedAt) continue;
    out.push({
      at: r.completedAt,
      kind: "review_resolved",
      detail: withTitle(TL.timelineReviewResolved, blocks.get(r.blockId)?.lessonTitle ?? null),
      blockId: r.blockId,
      lessonId: null,
      episodeId: null,
    });
  }

  return out.sort((a, b) => b.at.localeCompare(a.at));
}

const TIMELINE_LABEL: Record<TimelineKind, Localized> = {
  lesson_completed: TL.timelineLessonCompleted,
  solved_independently: TL.timelineSolvedIndependently,
  solved_with_help: TL.timelineSolvedWithHelp,
  attempted: TL.timelineAttempted,
  assistance_taken: TL.timelineAssistanceTaken,
  solution_revealed: TL.timelineSolutionRevealed,
  assessment_submitted: TL.timelineAssessmentSubmitted,
  review_resolved: TL.timelineReviewResolved,
  returned_after_break: TL.timelineReturnedAfterBreak,
};

function withTitle(label: Localized, title: Localized | null): Localized {
  if (!title) return label;
  return { kk: `${label.kk} — ${title.kk}`, ru: `${label.ru} — ${title.ru}` };
}

function titleForLesson(
  lessonId: string,
  blocks: ReturnType<typeof blockIndexOf>,
): Localized | null {
  for (const entry of blocks.values()) {
    if (entry.lessonId === lessonId) return entry.lessonTitle;
  }
  return null;
}

function reviewOutcomeLabel(outcome: string | null): Localized | null {
  switch (outcome) {
    case "resolved_independently":
      return TL.reviewOutcomeIndependent;
    case "resolved_with_assistance":
      return TL.reviewOutcomeAssisted;
    case "unresolved":
      return TL.reviewOutcomeUnresolved;
    default:
      return null;
  }
}

/**
 * The learner's own counts, in the teacher's language.
 *
 * Built from the same numbers the core used, so it can never claim more than
 * the engine did — the same discipline `evidence.ts` applies for the learner
 * page. Deliberately says how MANY, not how WELL.
 */
function skillSummary(attempts: number, solo: number, assisted: number): Localized {
  if (attempts === 0) return TL.emptyNotMeasured;
  return {
    kk: `${attempts} әрекет · ${solo} өз бетінше · ${assisted} көмекпен`,
    ru: `${attempts} попыток · ${solo} самостоятельно · ${assisted} с помощью`,
  };
}
