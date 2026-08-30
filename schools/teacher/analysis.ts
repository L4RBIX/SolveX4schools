import type { LearnerState } from "@solvex/learning-intelligence-core";
import type { Localized } from "@schools/curriculum/types";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { teacherFailureClassLabel } from "@schools/presentation/labels";
import type {
  Finding,
  FindingKind,
  LearnerStatus,
  RosterRow,
  Strength,
} from "./contracts";
import type { WindowedLearnerStats } from "./queries";
import * as T from "./labels";
import { TL } from "./labels";

/**
 * Who needs a teacher, and why, and what to do about it.
 *
 * ## The rule this file exists to keep
 *
 * Every finding names a cause a teacher can check and disagree with. There is
 * no signal computed from a mood, no inference about ability or motivation, and
 * no sentence that describes a child rather than describing what happened. That
 * rule predates this rebuild — `classroom.ts:13-22` — and the reason it is
 * restated here is that a "command centre" is exactly the kind of surface where
 * it gets quietly dropped in favour of something that looks more decisive.
 *
 * ## Recommendations are a switch, not a model
 *
 * `recommendationFor` is a total function over `FindingKind`. Nothing here asks
 * an LLM what to do about a named child, and nothing may: the brief forbids it,
 * the product forbids it (Nova is for tutoring the learner), and the practical
 * argument is stronger than either — a teacher who cannot predict what the
 * dashboard will say cannot trust it, and advice generated from bulk class data
 * is advice nobody can audit.
 *
 * ## Statuses are genuinely exclusive
 *
 * The baseline dashboard counted «Требуют внимания» and «Готовы к сложному»
 * from overlapping signal sets, so the same child could be in both tiles. Here
 * `statusFor` walks a ladder and stops at the first match, and the four
 * headline tiles therefore partition the roster and sum to it. That is the
 * brief's §50 requirement and it is also just what a teacher assumes when they
 * see four numbers over a class of eighteen.
 *
 * ## Windowed versus cumulative
 *
 * Findings that describe RECENT behaviour (`stuck`, `thrashing`, `regressed`,
 * `reveal_reliant`) read `WindowedLearnerStats`, which is a SQL aggregate over
 * `attempt_episodes.opened_at`. Findings that describe an ESTABLISHED pattern
 * (`repeated_misconception`, `assistance_dependent`, `unexplained_failures`)
 * read `LearnerState`, which is all-time by construction and cannot honestly be
 * windowed — see `docs/teacher/TEACHER_METRICS.md` §"Why levels are not
 * windowed". The two are never divided into one another.
 */

/* -------------------------------------------------------------------------- */
/* Thresholds                                                                 */
/* -------------------------------------------------------------------------- */
/*
 * Every constant below is a product decision with a stated reason, and every
 * one is benchmarked in `tests/teacher/benchmark.test.ts` against an
 * 18-learner simulated class. The test asserts a FIRING RATE, not a value: a
 * signal that fires for sixteen of eighteen is not a signal, it is the
 * background, and that is precisely what happened to the previous
 * `ready_to_stretch` and `unexplained_failures` pair before they were made
 * proportional.
 *
 * The thresholds are NOT fitted to produce a pretty number. Where the benchmark
 * disagrees with the semantics, the semantics win and the benchmark records the
 * rate as a fact.
 */

/** A school week. No activity for this long is worth a teacher's question. */
export const INACTIVE_DAYS = 7;

/**
 * Solves needed before a dependency RATIO means anything.
 *
 * The old signal had no floor, so a learner who solved one thing with a hint
 * read as 100% dependent. Four is the point at which the ratio survives one
 * unlucky task.
 */
export const ASSISTANCE_MIN_SOLVES = 4;
/** Share of solves needing level-2+ help before assistance is worth a look. */
export const ASSISTANCE_SHARE = 0.5;

/** Episodes classed `stuck` in the window, with nothing solved unaided. */
export const STUCK_EPISODES = 2;
/** Episodes classed `thrash`. Higher than `stuck`: thrashing is still trying. */
export const THRASH_EPISODES = 3;

/** Unexplained failures, absolute floor and share of episodes. */
export const UNEXPLAINED_MIN = 3;
export const UNEXPLAINED_SHARE = 0.2;

/** Lessons behind the class median before it is a finding rather than a spread. */
export const BEHIND_LESSONS = 2;

/** Independent solves in the previous window before a drop can be called a drop. */
export const REGRESSION_MIN_PREVIOUS = 3;
/** Below this fraction of the previous window, it is a drop. */
export const REGRESSION_RATIO = 0.5;

/** Reveals, absolute floor and share of solves. */
export const REVEAL_MIN = 3;
export const REVEAL_SHARE = 0.3;

/** Skills with unaided evidence before "ready for harder work" is defensible. */
export const STRETCH_SKILLS = 2;
/** Unaided solves per skill, for that skill to count toward the above. */
export const STRETCH_SOLO_PER_SKILL = 2;
/** Solves in the window before an independence share is worth reading. */
export const STRETCH_MIN_SOLVED = 3;
/** Share of window solves that must have been unaided. */
export const STRETCH_INDEPENDENT_SHARE = 0.7;

/**
 * Share of the class that must have finished the monthly check before NOT
 * having finished it is a finding about one learner.
 *
 * This constant exists because the benchmark caught the alternative. Without
 * it, `assessment_incomplete` fired for EIGHTEEN OF TWENTY learners the moment
 * September's check opened — every statement of it true, and the whole set
 * worthless, because a signal that fires for everyone is the background rather
 * than a signal. It is the exact failure the previous projection had with
 * `ready_to_stretch`, arrived at from the opposite direction.
 *
 * "The class has not sat the check yet" is a CLASS fact and it belongs on the
 * assessment tile, where it is rendered. It becomes a fact about one learner in
 * two cases, and only these two: they started it and stopped, or most of their
 * class has finished and they have not.
 */
export const ASSESSMENT_PEER_SHARE = 0.5;

/**
 * How recent a misconception must be to be a finding.
 *
 * `MisconceptionObservation.lastSeenAt` is the only time field in the whole
 * learner projection, and it is the thing that lets a cumulative model produce
 * a recent signal without re-running the reducer. A misconception last seen in
 * September is not a reason to interrupt a lesson in November.
 */
export const MISCONCEPTION_RECENT_DAYS = 21;

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface LearnerInput {
  userId: string;
  displayName: string;
  subjectId: string | null;
  /** Windowed episode aggregate. Zeroed when nothing happened in the window. */
  stats: WindowedLearnerStats;
  /** The equal-length window before, for `regressed` and `improved`. */
  previous: WindowedLearnerStats;
  /** All-time projection. Null for a learner the reducer has never seen. */
  state: LearnerState | null;
  /** Last event of any kind, server clock. Null if they have never appeared. */
  lastActiveAt: string | null;
  /** Required lessons finished this month, and how many there are. */
  requiredWork: { completed: number; total: number };
  /**
   * The month's check, when it is open and this learner has not finished it.
   *
   * `started` is the field that makes this usable as an ATTENTION signal rather
   * than as a calendar fact. See `ASSESSMENT_PEER_SHARE`.
   */
  assessmentOutstanding: { done: number; total: number; started: boolean } | null;
  /** Their most recent block, for the "current topic" column. */
  currentTopic: { blockId: string; lessonId: string; title: Localized } | null;
}

export interface ClassContextForAnalysis {
  /** Median required lessons completed across the class, for `required_work_behind`. */
  medianRequiredCompleted: number;
  /**
   * Share of the class that has finished the month's check.
   *
   * Needed because "the assessment is open and this learner has not finished
   * it" is true of almost everybody on the day it opens. See
   * `ASSESSMENT_PEER_SHARE`.
   */
  assessmentCompletionShare: number;
  now: number;
}

/* -------------------------------------------------------------------------- */
/* Findings                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Everything worth flagging about one learner.
 *
 * Order matters only for display: the caller sorts by `FINDING_WEIGHT`. A
 * learner may carry several, and that is the point — "needs attention" with one
 * unexplained reason is how a teacher learns to skim a dashboard.
 */
export function findingsFor(
  input: LearnerInput,
  ctx: ClassContextForAnalysis,
): Finding[] {
  const out: Finding[] = [];
  const { stats, previous, state } = input;
  const cumulativeEpisodes = state?.episodes ?? 0;

  /* 1. Never opened anything. The learner the old dashboard structurally could
        not surface: `no_activity` was guarded by `if (lastActiveAt)`, so a child
        with no events produced no signal, no row weight, and sorted last. */
  if (cumulativeEpisodes === 0 && stats.episodes === 0) {
    out.push({
      kind: "never_started",
      detail: TL.findingNeverStarted,
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingNeverStartedAction,
    });
    /* Nothing else can be said about a learner with no evidence, and saying it
       anyway is how a dashboard invents a story about a child. */
    return out;
  }

  /* 2. Stopped. A fact about the calendar, never about the learner. */
  const idleDays = input.lastActiveAt
    ? Math.floor((ctx.now - Date.parse(input.lastActiveAt)) / 86_400_000)
    : null;
  if (idleDays !== null && idleDays >= INACTIVE_DAYS) {
    out.push({
      kind: "inactive",
      detail: T.daysAgo(idleDays),
      since: input.lastActiveAt,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingInactiveAction,
    });
  }

  /* 3. A misconception the evidence supports acting on, seen recently.
        The failure class IS named — to a teacher, never to the learner. That
        asymmetry is settled product policy (PRIVACY_DATA_FLOWS.md:315-316) and
        it is what makes this the most useful row on the screen. */
  for (const skill of state?.skills ?? []) {
    for (const m of skill.misconceptions) {
      if (!m.actionable) continue;
      const ageDays = (ctx.now - Date.parse(m.lastSeenAt)) / 86_400_000;
      if (!Number.isFinite(ageDays) || ageDays > MISCONCEPTION_RECENT_DAYS) continue;
      const title = SKILL_BY_ID.get(skill.skill)?.title ?? null;
      const cause = teacherFailureClassLabel(m.failureClass);
      out.push({
        kind: "repeated_misconception",
        detail: {
          kk: `${title?.kk ?? ""} ${cause.kk} — ${T.inEpisodes(m.distinctEpisodes).kk}`.trim(),
          ru: `${title?.ru ?? ""}: ${cause.ru} — ${T.inEpisodes(m.distinctEpisodes).ru}`.trim(),
        },
        since: m.firstSeenAt,
        skillId: skill.skill,
        skillTitle: title,
        failureClass: m.failureClass,
        /* The property that makes the claim auditable rather than an opinion.
           The old ClassroomSignal carried the failure class and dropped these,
           which left a teacher with a claim about a child and no way to check
           it. */
        episodeIds: m.episodeIds.slice(0, 10),
        recommendation: TL.findingMisconceptionAction,
      });
    }
  }

  /* 4. Leaning on help. Measured, with a floor under the ratio. */
  const solvedAllTime =
    (state?.skills ?? []).reduce((n, s) => n + s.soloSolved + s.assistedSolved, 0) ?? 0;
  if (
    state &&
    solvedAllTime >= ASSISTANCE_MIN_SOLVES &&
    state.assistance.hintDependency >= ASSISTANCE_SHARE
  ) {
    const pct = Math.round(state.assistance.hintDependency * 100);
    const assisted = Math.round(state.assistance.hintDependency * solvedAllTime);
    out.push({
      kind: "assistance_dependent",
      detail: T.solvesNeededHelp(pct, assisted, solvedAllTime),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingAssistanceAction,
    });
  }

  /* 5 & 6. Stuck and thrashing, kept distinct because they want opposite
        responses: being out of ideas wants an explanation, thrashing wants an
        interrupt. The reducer already separates them per episode
        (`classifyStruggle`); this is the first thing in the product to read it. */
  if (stats.struggle.stuck >= STUCK_EPISODES && stats.solvedIndependent === 0) {
    out.push({
      kind: "stuck",
      detail: T.stuckEpisodes(stats.struggle.stuck),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingStuckAction,
    });
  }
  if (stats.struggle.thrash >= THRASH_EPISODES) {
    out.push({
      kind: "thrashing",
      detail: T.thrashEpisodes(stats.struggle.thrash),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingThrashingAction,
    });
  }

  /* 7. Failures with no cause. NOT a claim about the learner — a statement that
        the system could not explain what happened, which is exactly when a
        human should look rather than the machine guessing. */
  const unexplained = state?.unattributedFailures ?? 0;
  const unexplainedNotable =
    unexplained >= UNEXPLAINED_MIN && unexplained >= cumulativeEpisodes * UNEXPLAINED_SHARE;
  if (unexplainedNotable) {
    out.push({
      kind: "unexplained_failures",
      detail: T.unexplainedFailures(unexplained),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingUnexplainedAction,
    });
  }

  /* 8. Behind the class on required work. Relative to the class's own median,
        not to a target nobody set: a class that is collectively three lessons
        into the month has nobody "behind" at three lessons. */
  if (
    ctx.medianRequiredCompleted >= BEHIND_LESSONS &&
    input.requiredWork.completed <= ctx.medianRequiredCompleted - BEHIND_LESSONS
  ) {
    out.push({
      kind: "required_work_behind",
      detail: T.behindByLessons(input.requiredWork.completed, ctx.medianRequiredCompleted),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingBehindAction,
    });
  }

  /* 9. The monthly check, unfinished — and only when that says something about
        THIS learner rather than about the calendar. Started-and-stopped is
        always worth a teacher's question; not-started is worth one once the
        rest of the class has done it. */
  if (input.assessmentOutstanding) {
    const { done, total, started } = input.assessmentOutstanding;
    const peersAreDone = ctx.assessmentCompletionShare >= ASSESSMENT_PEER_SHARE;
    if (started || peersAreDone) {
    out.push({
      kind: "assessment_incomplete",
      detail: T.assessmentIncomplete(done, total),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingAssessmentAction,
    });
    }
  }

  /* 10. Solving less independently than in the window before. Guarded by an
        absolute floor on the PREVIOUS window so a learner going from 2 to 1
        does not read as a 50% collapse. */
  if (
    previous.solvedIndependent >= REGRESSION_MIN_PREVIOUS &&
    stats.solvedIndependent < previous.solvedIndependent * REGRESSION_RATIO
  ) {
    out.push({
      kind: "regressed",
      detail: T.regressedBy(stats.solvedIndependent, previous.solvedIndependent),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingRegressedAction,
    });
  }

  /* 11. Reaching for the answer. Worth naming because a revealed solution is
        scored as assistance everywhere else in this dashboard, so without this
        the learner simply looks quiet rather than looks stuck. */
  if (
    stats.revealed >= REVEAL_MIN &&
    stats.solved > 0 &&
    stats.revealed >= stats.solved * REVEAL_SHARE
  ) {
    out.push({
      kind: "reveal_reliant",
      detail: T.revealedOften(stats.revealed, stats.solved),
      since: null,
      skillId: null,
      skillTitle: null,
      recommendation: TL.findingRevealAction,
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Strengths                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What is going right. Surfaced as loudly as difficulty.
 *
 * A class list that only shows problems teaches a teacher to read it as a
 * problem list, and the child who is flying stops being visible at all. These
 * carry NO ordering weight — a learner doing well is never a reason to look
 * past one who is stuck.
 */
export function strengthsFor(input: LearnerInput): Strength[] {
  const out: Strength[] = [];
  const strong = strongSkills(input.state);

  if (strong.length >= STRETCH_SKILLS) {
    out.push({
      kind: "independent_across_skills",
      detail: T.independentAcrossSkills(strong.length),
      skillIds: strong,
    });
  }

  if (
    input.previous.solvedIndependent >= 1 &&
    input.stats.solvedIndependent > input.previous.solvedIndependent
  ) {
    out.push({
      kind: "improved",
      detail: T.improvedBy(input.stats.solvedIndependent, input.previous.solvedIndependent),
      skillIds: [],
    });
  }

  return out;
}

function strongSkills(state: LearnerState | null): string[] {
  return (state?.skills ?? [])
    .filter(
      (s) =>
        s.soloSolved >= STRETCH_SOLO_PER_SKILL &&
        (s.level === "competent" || s.level === "strong"),
    )
    .map((s) => s.skill);
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One status, first match wins.
 *
 * The ladder is the mutual-exclusion mechanism the brief asks for. Note that
 * `ready_to_stretch` sits BELOW `needs_attention`: a learner with an actionable
 * misconception is not ready for harder work no matter how much they have
 * solved, and the old dashboard's ability to say both at once about the same
 * child was the clearest sign its tiles were not thought through.
 */
export function statusFor(
  input: LearnerInput,
  findings: readonly Finding[],
): LearnerStatus {
  if (findings.some((f) => f.kind === "never_started")) return "not_started";
  if (findings.some((f) => f.kind === "inactive")) return "dormant";
  if (findings.length > 0) return "needs_attention";
  if (isReadyToStretch(input)) return "ready_to_stretch";
  return "on_track";
}

/**
 * Ready for harder work, on evidence rather than on absence of complaint.
 *
 * Three conditions, and the third is the one the old signal lacked: a window in
 * which they actually solved things. Without it, "no findings" plus two
 * competent skills from October would nominate a learner who has not opened the
 * product this week.
 */
export function isReadyToStretch(input: LearnerInput): boolean {
  const strong = strongSkills(input.state);
  if (strong.length < STRETCH_SKILLS) return false;
  if (input.stats.solved < STRETCH_MIN_SOLVED) return false;
  const share = input.stats.solvedIndependent / input.stats.solved;
  return share >= STRETCH_INDEPENDENT_SHARE;
}

/* -------------------------------------------------------------------------- */
/* Ordering                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How much a teacher's attention would change something.
 *
 * NOT a score of the learner. The weights say which row to read first between
 * two lessons, and the ordering they produce is the one property of this file
 * a teacher will notice every single day.
 *
 * `never_started` outranks everything because it is both the most actionable
 * and the cheapest to fix — usually a password.
 */
export const FINDING_WEIGHT: Record<FindingKind, number> = {
  never_started: 10,
  stuck: 6,
  repeated_misconception: 5,
  assessment_incomplete: 4,
  inactive: 4,
  thrashing: 3,
  regressed: 3,
  required_work_behind: 3,
  assistance_dependent: 2,
  reveal_reliant: 2,
  unexplained_failures: 2,
};

export function attentionWeight(findings: readonly Finding[]): number {
  let w = 0;
  for (const f of findings) w += FINDING_WEIGHT[f.kind] ?? 0;
  return w;
}

/* -------------------------------------------------------------------------- */
/* Row assembly                                                               */
/* -------------------------------------------------------------------------- */

export function buildRosterRow(
  input: LearnerInput,
  ctx: ClassContextForAnalysis,
): RosterRow {
  const findings = findingsFor(input, ctx);
  const strengths = strengthsFor(input);
  const status = statusFor(input, findings);
  const { stats } = input;

  return {
    subjectId: input.subjectId,
    userId: input.userId,
    displayName: input.displayName,
    status,
    lastActiveAt: input.lastActiveAt,
    lastWorkedAt: stats.lastOpenedAt,
    episodes: stats.episodes,
    solvedIndependent: stats.solvedIndependent,
    solvedAssisted: stats.solvedAssisted,
    submissions: stats.submissions,
    practiceMinutes: Math.round(stats.activeSeconds / 60),
    activeDays: stats.activeDays,
    interventions: stats.interventions,
    /* Null, not zero. A learner who solved nothing has no independence reading,
       and rendering that as 0% would put them below a learner who solved one
       thing with a hint — which is a claim the evidence does not support. */
    independentShare: stats.solved > 0 ? stats.solvedIndependent / stats.solved : null,
    requiredWork: input.requiredWork,
    unexplainedFailures: input.state?.unattributedFailures ?? 0,
    findings: [...findings].sort(
      (a, b) => (FINDING_WEIGHT[b.kind] ?? 0) - (FINDING_WEIGHT[a.kind] ?? 0),
    ),
    strengths,
    currentTopic: input.currentTopic,
  };
}

/**
 * The attention queue, ordered by how much a teacher's time would change.
 *
 * Ties break on name so the order is stable between refreshes — a queue that
 * reshuffles under a teacher's cursor is a queue they stop trusting.
 */
export function attentionQueue(rows: readonly RosterRow[]): RosterRow[] {
  return rows
    .filter(
      (r) =>
        r.status === "not_started" ||
        r.status === "dormant" ||
        r.status === "needs_attention",
    )
    .sort((a, b) => {
      const d = attentionWeight(b.findings) - attentionWeight(a.findings);
      return d !== 0 ? d : a.displayName.localeCompare(b.displayName);
    });
}

export function stretchQueue(rows: readonly RosterRow[]): RosterRow[] {
  return rows
    .filter((r) => r.status === "ready_to_stretch")
    .sort((a, b) => {
      const d = b.solvedIndependent - a.solvedIndependent;
      return d !== 0 ? d : a.displayName.localeCompare(b.displayName);
    });
}

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                 */
/* -------------------------------------------------------------------------- */

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/**
 * Practice time, over ACTIVE learners only.
 *
 * A median across the whole roster in a class where half of it did nothing is
 * zero, every week, forever — technically true and useless. The denominator is
 * therefore stated in the label, and `activeInPeriod` sits beside it on screen.
 */
export function medianPracticeMinutes(rows: readonly RosterRow[]): number | null {
  const active = rows.filter((r) => r.episodes > 0).map((r) => r.practiceMinutes);
  return median(active);
}
