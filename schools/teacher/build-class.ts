import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { LearningStore } from "@schools/store/learning-store";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { teacherFailureClassLabel } from "@schools/presentation/labels";
import { skillEvidence, type EvidenceState } from "@schools/presentation/evidence";
import type {
  Comparison,
  LeaderboardLens,
  Leaderboard,
  PeriodDescriptor,
  RosterRow,
  SkillSummary,
  TeacherOverview,
  TrendPoint,
} from "./contracts";
import { changePct, previousOf } from "./period";
import {
  attentionQueue,
  buildRosterRow,
  median,
  medianPracticeMinutes,
  stretchQueue,
  type ClassContextForAnalysis,
  type LearnerInput,
} from "./analysis";
import {
  blockIndexOf,
  loadRequiredWork,
  type ClassBundle,
} from "./context";
import {
  classActivityBuckets,
  classMistakes,
  emptyStats,
  lastActivityFor,
  latestTaskPerSubject,
  learnerStatesFor,
  windowedLearnerStats,
  type WindowedLearnerStats,
} from "./queries";
import { emptyCounts, leaderboardCounts, LENS_EXPLANATION, rank } from "./leaderboard";
import { buildLessonSummaries } from "./build-curriculum";
import { buildAssessmentSummary } from "./build-assessment";

/**
 * The class-level payloads: overview, roster, leaderboard.
 *
 * ## Query budget
 *
 * The overview is the heaviest screen and it costs **nine** queries for a class
 * of any size:
 *
 *   1 roster · 1 sweep · 1 pending · 1 class name · 1 windowed stats ·
 *   1 previous-window stats · 1 last activity · 1 learner_state head +
 *   1 learner_skill_state · 1 activity buckets · 1 block evidence · 1 mistakes ·
 *   1 latest task
 *
 * The endpoint it replaces issued 97 for eighteen learners, 54 of them writes,
 * and grew linearly with the class. Nothing below is per-learner: every read is
 * an aggregate keyed on `subject_id = any(...)`.
 */

/* -------------------------------------------------------------------------- */
/* Shared learner assembly                                                    */
/* -------------------------------------------------------------------------- */

export interface AssembledClass {
  rows: RosterRow[];
  inputs: LearnerInput[];
  stats: Map<string, WindowedLearnerStats>;
  previous: Map<string, WindowedLearnerStats>;
  states: Awaited<ReturnType<typeof learnerStatesFor>>;
}

/**
 * Everything the roster and the overview both need.
 *
 * Called once per request. The `assessmentOutstanding` argument is threaded in
 * rather than computed here so the assessment projection stays the one place
 * that decides what "finished the monthly check" means.
 */
export async function assembleClass(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  now: number,
  assessment: { outstanding: Map<string, { done: number; total: number; started: boolean }>; completionShare: number },
): Promise<AssembledClass> {
  const prev = previousOf(period);
  const { subjectIds, members, month } = bundle;

  const [stats, previous, lastActive, states, required, latestTask] = await Promise.all([
    windowedLearnerStats(sql, subjectIds, period.from, period.to),
    windowedLearnerStats(sql, subjectIds, prev.from, prev.to),
    lastActivityFor(sql, subjectIds),
    learnerStatesFor(sql, subjectIds),
    loadRequiredWork(sql, subjectIds, month),
    latestTaskPerSubject(sql, subjectIds),
  ]);

  const blocks = blockIndexOf();

  /* The class's own median, so "behind" means behind THIS class rather than
     behind a target nobody set. A class three lessons into the month has nobody
     three lessons behind. */
  const completedCounts = members.map((m) =>
    m.subjectId ? (required.bySubject.get(m.subjectId)?.completed ?? 0) : 0,
  );
  const ctx: ClassContextForAnalysis = {
    medianRequiredCompleted: median(completedCounts) ?? 0,
    assessmentCompletionShare: assessment.completionShare,
    now,
  };

  const inputs: LearnerInput[] = members.map((m) => {
    const sid = m.subjectId;
    const latest = sid ? latestTask.get(sid) : undefined;
    const entry = latest ? blocks.get(blockIdFromTaskRef(latest.taskRef)) : undefined;

    return {
      userId: m.userId,
      displayName: m.displayName,
      subjectId: sid,
      stats: (sid ? stats.get(sid) : undefined) ?? emptyStats(sid ?? m.userId),
      previous: (sid ? previous.get(sid) : undefined) ?? emptyStats(sid ?? m.userId),
      state: (sid ? states.get(sid)?.state : undefined) ?? null,
      lastActiveAt: (sid ? lastActive.get(sid) : undefined) ?? null,
      requiredWork: sid
        ? {
            completed: required.bySubject.get(sid)?.completed ?? 0,
            total: required.total,
          }
        : { completed: 0, total: required.total },
      assessmentOutstanding: sid ? (assessment.outstanding.get(sid) ?? null) : null,
      currentTopic:
        entry && latest
          ? {
              blockId: entry.block.id,
              lessonId: entry.lessonId,
              title: entry.lessonTitle,
            }
          : null,
    };
  });

  return {
    rows: inputs.map((i) => buildRosterRow(i, ctx)),
    inputs,
    stats,
    previous,
    states,
  };
}

/**
 * `sx-lesson:m1.p3` -> `m1.p3`.
 *
 * The suffix, not `parseTaskRef`. The prefixes genuinely disagree across the
 * codebase — `gradeBlock` writes `sx-assessment:` while `taskRef.ts` declares
 * `sx-assess:` — so `parseTaskRef` returns null for every real assessment
 * event. `store.blockAttempts` matches on the suffix for exactly this reason
 * and this follows it rather than inventing a third convention.
 */
export function blockIdFromTaskRef(taskRef: string): string {
  const i = taskRef.indexOf(":");
  return i >= 0 ? taskRef.slice(i + 1) : taskRef;
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

export async function buildOverview(
  sql: SqlExecutor,
  store: LearningStore,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  now: number,
): Promise<TeacherOverview> {
  const assessment = await buildAssessmentSummary(sql, bundle, now);
  const assembled = await assembleClass(sql, bundle, period, now, assessment);
  const { rows } = assembled;

  const prev = previousOf(period);
  const [buckets, prevBuckets, mistakes, lessons] = await Promise.all([
    classActivityBuckets(sql, bundle.subjectIds, period.from, period.to, period.grain),
    classActivityBuckets(sql, bundle.subjectIds, prev.from, prev.to, period.grain),
    classMistakes(sql, bundle.subjectIds, period.from, period.to),
    buildLessonSummaries(sql, bundle, period),
  ]);

  const attention = attentionQueue(rows);
  const stretch = stretchQueue(rows);

  const independentSolves = sum(rows, (r) => r.solvedIndependent);
  const assistedSolves = sum(rows, (r) => r.solvedAssisted);
  const activeInPeriod = rows.filter((r) => r.episodes > 0).length;

  const prevIndependent = sum(prevBuckets, (b) => b.solvedIndependent);
  const prevAssisted = sum(prevBuckets, (b) => b.solvedAssisted);
  const prevMinutes = Math.round(sum(prevBuckets, (b) => b.activeSeconds) / 60);
  const prevActive = maxOf(prevBuckets, (b) => b.activeLearners);
  const minutes = Math.round(sum(buckets, (b) => b.activeSeconds) / 60);

  const requiredCompleted = sum(rows, (r) => r.requiredWork.completed);
  const requiredTotal = rows.length * (rows[0]?.requiredWork.total ?? 0);

  return {
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    kpis: {
      totalStudents: rows.length,
      activeInPeriod,
      /* The four statuses partition the roster, so these two tiles cannot
         double-count the same child — which the old pair could and did. */
      needAttention: attention.length,
      readyForChallenge: stretch.length,
      independentSolves,
      assistedSolves,
      medianPracticeMinutes: medianPracticeMinutes(rows),
      requiredWork: { completed: requiredCompleted, total: requiredTotal },
    },
    attention,
    stretch,
    trend: fillTrend(period, buckets),
    comparison: {
      activeLearners: cmp(activeInPeriod, prevActive),
      independentSolves: cmp(independentSolves, prevIndependent),
      assistedSolves: cmp(assistedSolves, prevAssisted),
      practiceMinutes: cmp(minutes, prevMinutes),
    },
    weakestSkills: weakestSkills(assembled, bundle, mistakes),
    hardestLessons: [...lessons.lessons]
      .filter((l) => l.startedBy > 0)
      .sort((a, b) => completionRate(a) - completionRate(b))
      .slice(0, 5),
    assessment: assessment.summary,
  };
}

function completionRate(l: { startedBy: number; completedBy: number }): number {
  return l.startedBy > 0 ? l.completedBy / l.startedBy : 1;
}

/**
 * Zero-fill the window's buckets.
 *
 * The SQL returns only buckets with episodes, deliberately, so that "no data"
 * and "zero" stay distinguishable at the query layer. On a chart they are the
 * same thing — an empty Tuesday is an empty Tuesday — and a missing bar would
 * silently compress the axis, so the shape comes from `period.buckets`.
 */
function fillTrend(
  period: PeriodDescriptor,
  buckets: Awaited<ReturnType<typeof classActivityBuckets>>,
): TrendPoint[] {
  const by = new Map(buckets.map((b) => [b.bucket, b] as const));
  return period.buckets.map((bucket) => {
    const b = by.get(bucket);
    return {
      bucket,
      activeLearners: b?.activeLearners ?? 0,
      episodes: b?.episodes ?? 0,
      solvedIndependent: b?.solvedIndependent ?? 0,
      solvedAssisted: b?.solvedAssisted ?? 0,
      practiceMinutes: Math.round((b?.activeSeconds ?? 0) / 60),
      interventions: b?.interventions ?? 0,
    };
  });
}

function cmp(current: number, previous: number): Comparison {
  return { current, previous, changePct: changePct(current, previous) };
}

/* -------------------------------------------------------------------------- */
/* Skills, summarised for the overview                                        */
/* -------------------------------------------------------------------------- */

/**
 * Class-wide skill states, over EVERY skill the curriculum has taught.
 *
 * The old breakdown enumerated only skills that appeared in somebody's
 * `LearnerState`, which meant a skill September taught and nobody attempted did
 * not appear at all — letting the page imply the curriculum is only what has
 * been attempted. Here the row set comes from `SKILL_BY_ID` filtered on
 * `introducedInMonth`, and every enrolled learner is counted into exactly one
 * state, so each row sums to the roster.
 */
export function classSkillSummaries(
  assembled: AssembledClass,
  bundle: ClassBundle,
  mistakes: Awaited<ReturnType<typeof classMistakes>>,
): SkillSummary[] {
  const out: SkillSummary[] = [];
  const mistakesBySkill = groupMistakesBySkill(mistakes);

  for (const [skillId, def] of SKILL_BY_ID) {
    if (def.introducedInMonth > bundle.month.index) continue;

    const counts: Record<EvidenceState, number> = {
      not_started: 0,
      learning: 0,
      practicing: 0,
      independent_evidence: 0,
      needs_review: 0,
    };
    let attemptedBy = 0;
    let lastActivityAt: string | null = null;

    for (const member of bundle.members) {
      const state = member.subjectId
        ? assembled.states.get(member.subjectId)?.state
        : undefined;
      const skill = state?.skills.find((s) => s.skill === skillId);
      if (!skill || skill.attempts === 0) {
        counts.not_started += 1;
        continue;
      }
      attemptedBy += 1;
      counts[skillEvidence(skill)] += 1;
      for (const m of skill.misconceptions) {
        if (!lastActivityAt || m.lastSeenAt > lastActivityAt) lastActivityAt = m.lastSeenAt;
      }
    }

    const top = mistakesBySkill.get(skillId);
    out.push({
      skillId,
      title: def.title,
      introducedInMonth: def.introducedInMonth,
      counts,
      attemptedBy,
      medianAttempts: null,
      topMistake: top
        ? {
            failureClass: top.failureClass,
            label: teacherFailureClassLabel(top.failureClass),
            learners: top.learners.size,
            occurrences: top.occurrences,
          }
        : null,
      lastActivityAt,
    });
  }
  return out;
}

/**
 * The skills a teacher should look at first.
 *
 * Ordered by how many learners are in a state that wants intervention
 * (`needs_review` first, then `learning`), and only among skills the class has
 * actually started — a skill nobody has touched is a scheduling fact, not a
 * weakness, and putting it at the top of "weakest skills" would be a lie about
 * the class.
 */
function weakestSkills(
  assembled: AssembledClass,
  bundle: ClassBundle,
  mistakes: Awaited<ReturnType<typeof classMistakes>>,
): SkillSummary[] {
  return classSkillSummaries(assembled, bundle, mistakes)
    .filter((s) => s.attemptedBy > 0)
    .sort((a, b) => {
      const wa = a.counts.needs_review * 2 + a.counts.learning;
      const wb = b.counts.needs_review * 2 + b.counts.learning;
      if (wb !== wa) return wb - wa;
      return a.skillId.localeCompare(b.skillId);
    })
    .slice(0, 5);
}

function groupMistakesBySkill(
  mistakes: Awaited<ReturnType<typeof classMistakes>>,
): Map<string, { failureClass: string; occurrences: number; learners: Set<string> }> {
  const blocks = blockIndexOf();
  const acc = new Map<
    string,
    Map<string, { failureClass: string; occurrences: number; learners: Set<string> }>
  >();

  for (const m of mistakes) {
    const entry = blocks.get(blockIdFromTaskRef(m.taskRef));
    /* `skillRefs[0]` is the primary skill, and it is the one credited on a
       failing attempt (`grade.ts:60-88`). Attributing a mistake to every ref
       would inflate the skills that merely appear alongside the real one. */
    const skillId = entry?.block.skillRefs?.[0];
    if (!skillId) continue;
    const inner = acc.get(skillId) ?? new Map();
    const cur = inner.get(m.failureClass) ?? {
      failureClass: m.failureClass,
      occurrences: 0,
      learners: new Set<string>(),
    };
    cur.occurrences += m.occurrences;
    cur.learners.add(m.subjectId);
    inner.set(m.failureClass, cur);
    acc.set(skillId, inner);
  }

  const out = new Map<string, { failureClass: string; occurrences: number; learners: Set<string> }>();
  for (const [skillId, inner] of acc) {
    const best = [...inner.values()].sort((a, b) => b.occurrences - a.occurrences)[0];
    if (best) out.set(skillId, best);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Leaderboard                                                                */
/* -------------------------------------------------------------------------- */

export async function buildLeaderboard(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  lens: LeaderboardLens,
): Promise<Leaderboard> {
  const prev = previousOf(period);
  const challengeBlockIds = challengeBlocks(bundle.month.index);

  const [current, previous] = await Promise.all([
    leaderboardCounts(sql, bundle.subjectIds, period.from, period.to, challengeBlockIds),
    leaderboardCounts(sql, bundle.subjectIds, prev.from, prev.to, challengeBlockIds),
  ]);

  const { entries, unranked } = rank(
    lens,
    bundle.members.map((member) => ({
      member,
      current: (member.subjectId ? current.get(member.subjectId) : undefined) ??
        emptyCounts(member.subjectId ?? member.userId),
      previous: (member.subjectId ? previous.get(member.subjectId) : undefined) ??
        emptyCounts(member.subjectId ?? member.userId),
    })),
  );

  return {
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    lens,
    explanation: LENS_EXPLANATION[lens],
    entries,
    unranked,
  };
}

/**
 * Which blocks count as advanced work.
 *
 * `challenge` and `verify` — the programme's harder tasks and its five
 * independence checks. Derived from the content rather than from a column,
 * because "this is a challenge" is a fact about what was authored and
 * `attempt_episodes` has no block-kind column. Months with none authored yield
 * an empty set, which makes the challenge lens honestly empty rather than
 * silently ranking on something else.
 */
function challengeBlocks(throughMonth: number): string[] {
  const out: string[] = [];
  for (const [blockId, entry] of blockIndexOf()) {
    if (entry.monthIndex > throughMonth) continue;
    if (entry.block.type === "challenge" || entry.block.type === "verify") out.push(blockId);
  }
  return out;
}

/* -------------------------------------------------------------------------- */

function sum<T>(rows: readonly T[], f: (t: T) => number): number {
  let n = 0;
  for (const r of rows) n += f(r);
  return n;
}

function maxOf<T>(rows: readonly T[], f: (t: T) => number): number {
  let n = 0;
  for (const r of rows) n = Math.max(n, f(r));
  return n;
}
