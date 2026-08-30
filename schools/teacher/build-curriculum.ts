import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { Lesson, Localized } from "@schools/curriculum/types";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { teacherFailureClassLabel } from "@schools/presentation/labels";
import { skillEvidence, type EvidenceState } from "@schools/presentation/evidence";
import { DEFAULT_TRACK } from "@schools/learning/track";
import { completionTarget } from "@schools/policies/lookup";
import type {
  BlockSummary,
  ClassLessons,
  ClassSkillMatrix,
  LessonDetail,
  LessonSummary,
  SkillDetail,
  SkillSummary,
} from "./contracts";
import {
  authoredLessons,
  blockIndexOf,
  blockKindLabel,
  loadRequiredWork,
  unauthoredLessons,
  type ClassBundle,
} from "./context";
import type { PeriodDescriptor } from "./contracts";
import {
  blockDifficulty,
  classMistakes,
  learnerStatesFor,
  subjectBlockStats,
  type BlockDifficulty,
  type SubjectBlockStats,
} from "./queries";
import { median } from "./analysis";

/**
 * Curriculum-shaped views: lessons, blocks and skills.
 *
 * ## The question the lesson view exists to answer
 *
 * "Is the student struggling, or is the lesson itself bad?"
 *
 * A per-learner dashboard cannot answer it — every signal it produces is about
 * a child. The answer only appears when you hold the block fixed and vary the
 * learner: a task fourteen of eighteen got wrong is a task, not fourteen
 * learners.
 *
 * ## What is deliberately absent
 *
 * No hidden test case, no expected output, no reference solution reaches any
 * shape in this file. `blockIndexOf()` holds full authored blocks — including
 * `cases` and `referenceSolution` — and the only things taken out of it are the
 * id, the type and the localised title. A `BlockSummary` a teacher can screen-
 * share must not contain the answer to the task on screen behind it.
 */

/* -------------------------------------------------------------------------- */
/* Lessons                                                                    */
/* -------------------------------------------------------------------------- */

export async function buildLessonSummaries(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
): Promise<ClassLessons> {
  const [byBlock, difficulty, mistakes] = await Promise.all([
    subjectBlockStats(sql, bundle.subjectIds, period.from, period.to),
    blockDifficulty(sql, bundle.subjectIds, period.from, period.to),
    classMistakes(sql, bundle.subjectIds, period.from, period.to),
  ]);
  const required = await loadRequiredWork(sql, bundle.subjectIds, bundle.month);

  const lessons = authoredLessons(bundle.month).map(({ unit, lesson }) =>
    summariseLesson(lesson, unit, bundle, byBlock, difficulty, required),
  );

  void mistakes;

  return {
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    lessons,
    unauthoredLessons: unauthoredLessons(bundle.month),
  };
}

function summariseLesson(
  lesson: Lesson,
  unitTitle: Localized,
  bundle: ClassBundle,
  byBlock: readonly SubjectBlockStats[],
  difficulty: readonly BlockDifficulty[],
  required: Awaited<ReturnType<typeof loadRequiredWork>>,
): LessonSummary {
  const target = completionTarget(lesson.id, DEFAULT_TRACK);
  const governed = (target?.blocks ?? []).filter((b) => b.isAttempt).map((b) => b.id);
  const governedSet = new Set(governed);

  const statsForLesson = byBlock.filter((s) => governedSet.has(s.blockId));
  const bySubject = new Map<string, SubjectBlockStats[]>();
  for (const s of statsForLesson) {
    const list = bySubject.get(s.subjectId) ?? [];
    list.push(s);
    bySubject.set(s.subjectId, list);
  }

  const startedBy = bySubject.size;

  let completedBy = 0;
  let completedIndependentlyBy = 0;
  const minutesPerLearner: number[] = [];

  for (const [subjectId, rows] of bySubject) {
    minutesPerLearner.push(Math.round(rows.reduce((n, r) => n + r.activeSeconds, 0) / 60));
    const decision = required.bySubject.get(subjectId)?.perLesson.get(lesson.id);
    if (!decision?.satisfied) continue;
    completedBy += 1;
    /* "Independently" means every governed block they were accepted on was
       accepted unaided, and none of them was revealed. A learner who finished
       the lesson with one hint on one block has finished the lesson — that is
       what the completion policy says and it is right — but they have not
       finished it unaided, and the two facts want different columns. */
    const touched = rows.filter((r) => governedSet.has(r.blockId));
    const clean = touched.every((r) => !r.tookAssistance && !r.revealed);
    if (clean) completedIndependentlyBy += 1;
  }

  const lessonDifficulty = difficulty.filter((d) => governedSet.has(d.blockId));
  const attempted = lessonDifficulty.filter((d) => d.attemptedBy > 0);
  const ranked = [...attempted].sort(
    (a, b) => acceptRate(a) - acceptRate(b) || a.blockId.localeCompare(b.blockId),
  );

  /* Where learners stop: the governed block with the fewest attempters, taken
     in teaching order so a tie resolves to the earliest — which is where the
     drop actually happened. A block nobody reached is a stronger drop-off
     signal than a block many reached and failed. */
  const dropOff = governed
    .map((id) => lessonDifficulty.find((d) => d.blockId === id) ?? null)
    .filter((d): d is BlockDifficulty => d !== null)
    .reduce<BlockDifficulty | null>(
      (worst, d) => (worst === null || d.attemptedBy < worst.attemptedBy ? d : worst),
      null,
    );

  return {
    lessonId: lesson.id,
    title: lesson.title,
    unitTitle,
    monthIndex: bundle.month.index,
    requiredBlocks: governed.length,
    startedBy,
    completedBy,
    completedIndependentlyBy,
    medianMinutes: median(minutesPerLearner),
    dropOffBlockId: dropOff && dropOff.attemptedBy < startedBy ? dropOff.blockId : null,
    hardestBlockId: ranked[0]?.blockId ?? null,
    easiestBlockId: ranked[ranked.length - 1]?.blockId ?? null,
  };
}

function acceptRate(d: BlockDifficulty): number {
  return d.attemptedBy > 0 ? d.acceptedBy / d.attemptedBy : 1;
}

export async function buildLessonDetail(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  lessonId: string,
): Promise<LessonDetail | null> {
  const found = authoredLessons(bundle.month).find((l) => l.lesson.id === lessonId);
  if (!found) return null;

  const [byBlock, difficulty, mistakes] = await Promise.all([
    subjectBlockStats(sql, bundle.subjectIds, period.from, period.to),
    blockDifficulty(sql, bundle.subjectIds, period.from, period.to),
    classMistakes(sql, bundle.subjectIds, period.from, period.to),
  ]);
  const required = await loadRequiredWork(sql, bundle.subjectIds, bundle.month);

  const summary = summariseLesson(
    found.lesson,
    found.unit,
    bundle,
    byBlock,
    difficulty,
    required,
  );

  const target = completionTarget(lessonId, DEFAULT_TRACK);
  const governed = (target?.blocks ?? []).filter((b) => b.isAttempt);
  const governedIds = new Set(governed.map((b) => b.id));

  return {
    ...summary,
    blocks: governed.map((pb) =>
      summariseBlock(pb.id, lessonId, difficulty, mistakes, pb.machineGradable),
    ),
    learners: bundle.members.map((m) => {
      const decision = m.subjectId
        ? required.bySubject.get(m.subjectId)?.perLesson.get(lessonId)
        : undefined;
      const rows = byBlock.filter(
        (s) => s.subjectId === m.subjectId && governedIds.has(s.blockId),
      );
      return {
        subjectId: m.subjectId,
        displayName: m.displayName,
        reached: decision?.met ?? 0,
        total: decision?.governed ?? governed.length,
        completedAt: null,
        /* Named shortfalls, so "not finished" is answerable with "which task".
           Block IDS, not titles: the caller resolves them, and a lesson's own
           block ids are already visible to a teacher in the player. */
        outstanding: (decision?.outstanding ?? []).map((o) => o.blockId),
        _touched: rows.length,
      };
    }).map(({ _touched, ...rest }) => {
      void _touched;
      return rest;
    }),
  };
}

function summariseBlock(
  blockId: string,
  lessonId: string,
  difficulty: readonly BlockDifficulty[],
  mistakes: Awaited<ReturnType<typeof classMistakes>>,
  machineGradable: boolean,
): BlockSummary {
  const entry = blockIndexOf().get(blockId);
  const d = difficulty.find((x) => x.blockId === blockId);

  const forBlock = mistakes.filter((m) => m.taskRef.endsWith(":" + blockId));
  const byClass = new Map<string, number>();
  for (const m of forBlock) byClass.set(m.failureClass, (byClass.get(m.failureClass) ?? 0) + m.occurrences);
  const top = [...byClass.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    blockId,
    lessonId,
    kindLabel: entry ? blockKindLabel(entry.block.type) : { kk: "Тапсырма", ru: "Задание" },
    machineGradable,
    attemptedBy: d?.attemptedBy ?? 0,
    acceptedBy: d?.acceptedBy ?? 0,
    independentBy: d?.independentBy ?? 0,
    assistedBy: d?.assistedBy ?? 0,
    revealedBy: d?.revealedBy ?? 0,
    /* Null rather than 0 when nobody attempted: a median over an empty set is
       not zero, it is absent, and 0 would read as "everyone solved it first
       try". */
    medianSubmissions: d && d.attemptedBy > 0 ? d.medianSubmissions : null,
    medianMinutes: d && d.attemptedBy > 0 ? Math.round(d.medianActiveSeconds / 60) : null,
    strugglingEpisodes: d?.strugglingEpisodes ?? 0,
    topFailure: top
      ? { failureClass: top[0], label: teacherFailureClassLabel(top[0]), occurrences: top[1] }
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export async function buildSkillMatrix(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
): Promise<ClassSkillMatrix> {
  const [states, mistakes, difficulty] = await Promise.all([
    learnerStatesFor(sql, bundle.subjectIds),
    classMistakes(sql, bundle.subjectIds, period.from, period.to),
    blockDifficulty(sql, bundle.subjectIds, period.from, period.to),
  ]);

  const skills = summariseSkills(bundle, states, mistakes, difficulty);

  const cells: Record<string, Record<string, EvidenceState>> = {};
  for (const skill of skills) {
    const row: Record<string, EvidenceState> = {};
    for (const m of bundle.members) {
      if (!m.subjectId) continue;
      const s = states.get(m.subjectId)?.state.skills.find((x) => x.skill === skill.skillId);
      /* Absent means `not_started`, per the contract — sending a full dense
         matrix of mostly-"not_started" for 48 skills x 30 learners is 1,440
         redundant strings on the wire. */
      if (s && s.attempts > 0) row[m.subjectId] = skillEvidence(s);
    }
    cells[skill.skillId] = row;
  }

  return {
    context: bundle.context,
    period,
    freshness: bundle.freshness,
    skills,
    learners: bundle.members.map((m) => ({
      subjectId: m.subjectId,
      displayName: m.displayName,
    })),
    cells,
  };
}

/**
 * Every skill the curriculum has TAUGHT by this month, not every skill somebody
 * has touched.
 *
 * The old breakdown enumerated `LearnerState.skills`, so a skill September
 * taught and nobody attempted did not appear at all. That let the table imply
 * the curriculum is only what has been attempted, and it hid the single most
 * actionable case: a topic the whole class has skipped.
 */
function summariseSkills(
  bundle: ClassBundle,
  states: Awaited<ReturnType<typeof learnerStatesFor>>,
  mistakes: Awaited<ReturnType<typeof classMistakes>>,
  difficulty: readonly BlockDifficulty[],
): SkillSummary[] {
  const blocks = blockIndexOf();
  const blocksBySkill = new Map<string, string[]>();
  for (const [blockId, entry] of blocks) {
    if (entry.monthIndex > bundle.month.index) continue;
    for (const ref of entry.block.skillRefs ?? []) {
      const list = blocksBySkill.get(ref) ?? [];
      list.push(blockId);
      blocksBySkill.set(ref, list);
    }
  }

  const mistakesBySkill = new Map<string, Map<string, { occurrences: number; learners: Set<string> }>>();
  for (const m of mistakes) {
    const blockId = m.taskRef.includes(":") ? m.taskRef.split(":")[1] : m.taskRef;
    const skillId = blocks.get(blockId)?.block.skillRefs?.[0];
    if (!skillId) continue;
    const inner = mistakesBySkill.get(skillId) ?? new Map();
    const cur = inner.get(m.failureClass) ?? { occurrences: 0, learners: new Set<string>() };
    cur.occurrences += m.occurrences;
    cur.learners.add(m.subjectId);
    inner.set(m.failureClass, cur);
    mistakesBySkill.set(skillId, inner);
  }

  const out: SkillSummary[] = [];
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

    for (const m of bundle.members) {
      const s = m.subjectId
        ? states.get(m.subjectId)?.state.skills.find((x) => x.skill === skillId)
        : undefined;
      if (!s || s.attempts === 0) {
        counts.not_started += 1;
        continue;
      }
      attemptedBy += 1;
      counts[skillEvidence(s)] += 1;
      for (const mis of s.misconceptions) {
        if (!lastActivityAt || mis.lastSeenAt > lastActivityAt) lastActivityAt = mis.lastSeenAt;
      }
    }

    const skillBlocks = new Set(blocksBySkill.get(skillId) ?? []);
    const medians = difficulty
      .filter((d) => skillBlocks.has(d.blockId) && d.attemptedBy > 0)
      .map((d) => d.medianSubmissions);

    const inner = mistakesBySkill.get(skillId);
    const top = inner
      ? [...inner.entries()].sort((a, b) => b[1].occurrences - a[1].occurrences)[0]
      : undefined;

    out.push({
      skillId,
      title: def.title,
      introducedInMonth: def.introducedInMonth,
      counts,
      attemptedBy,
      medianAttempts: median(medians),
      topMistake: top
        ? {
            failureClass: top[0],
            label: teacherFailureClassLabel(top[0]),
            learners: top[1].learners.size,
            occurrences: top[1].occurrences,
          }
        : null,
      lastActivityAt,
    });
  }
  return out;
}

export async function buildSkillDetail(
  sql: SqlExecutor,
  bundle: ClassBundle,
  period: PeriodDescriptor,
  skillId: string,
): Promise<SkillDetail | null> {
  const def = SKILL_BY_ID.get(skillId);
  if (!def || def.introducedInMonth > bundle.month.index) return null;

  const [states, mistakes, difficulty] = await Promise.all([
    learnerStatesFor(sql, bundle.subjectIds),
    classMistakes(sql, bundle.subjectIds, period.from, period.to),
    blockDifficulty(sql, bundle.subjectIds, period.from, period.to),
  ]);

  const summary = summariseSkills(bundle, states, mistakes, difficulty).find(
    (s) => s.skillId === skillId,
  );
  if (!summary) return null;

  const blocks = blockIndexOf();
  const skillBlocks: { blockId: string; lessonId: string; machineGradable: boolean }[] = [];
  for (const [blockId, entry] of blocks) {
    if (entry.monthIndex > bundle.month.index) continue;
    if (!(entry.block.skillRefs ?? []).includes(skillId)) continue;
    const target = completionTarget(entry.lessonId, DEFAULT_TRACK);
    const pb = target?.blocks.find((b) => b.id === blockId);
    if (!pb?.isAttempt) continue;
    skillBlocks.push({ blockId, lessonId: entry.lessonId, machineGradable: pb.machineGradable });
  }

  const forSkill = mistakes.filter((m) => {
    const blockId = m.taskRef.includes(":") ? m.taskRef.split(":")[1] : m.taskRef;
    return blocks.get(blockId)?.block.skillRefs?.[0] === skillId;
  });
  const byClass = new Map<string, { occurrences: number; learners: Set<string>; lastAt: string }>();
  for (const m of forSkill) {
    const cur = byClass.get(m.failureClass) ?? {
      occurrences: 0,
      learners: new Set<string>(),
      lastAt: m.lastAt,
    };
    cur.occurrences += m.occurrences;
    cur.learners.add(m.subjectId);
    if (m.lastAt > cur.lastAt) cur.lastAt = m.lastAt;
    byClass.set(m.failureClass, cur);
  }

  return {
    ...summary,
    learners: bundle.members.map((m) => {
      const s = m.subjectId
        ? states.get(m.subjectId)?.state.skills.find((x) => x.skill === skillId)
        : undefined;
      return {
        subjectId: m.subjectId,
        displayName: m.displayName,
        state: s && s.attempts > 0 ? skillEvidence(s) : ("not_started" as EvidenceState),
        attempts: s?.attempts ?? 0,
        soloSolved: s?.soloSolved ?? 0,
        assistedSolved: s?.assistedSolved ?? 0,
      };
    }),
    blocks: skillBlocks
      .map((b) => summariseBlock(b.blockId, b.lessonId, difficulty, mistakes, b.machineGradable))
      .sort((a, b) => rateOf(a) - rateOf(b)),
    mistakes: [...byClass.entries()]
      .sort((a, b) => b[1].occurrences - a[1].occurrences)
      .map(([failureClass, v]) => ({
        failureClass,
        label: teacherFailureClassLabel(failureClass),
        learners: v.learners.size,
        occurrences: v.occurrences,
        lastAt: v.lastAt,
      })),
  };
}

function rateOf(b: BlockSummary): number {
  return b.attemptedBy > 0 ? b.acceptedBy / b.attemptedBy : 1;
}
