import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { LearningStore } from "@schools/store/learning-store";
import type { Lesson, LessonBlock, Localized, Month } from "@schools/curriculum/types";
import { ATTEMPT_BLOCK_TYPES } from "@schools/curriculum/types";
import { MONTH_BY_INDEX, MONTHS } from "@schools/curriculum/months";
import { gateFor } from "@schools/curriculum/gate";
import { DEFAULT_TRACK } from "@schools/learning/track";
import { completionTarget } from "@schools/policies/lookup";
import { monthCompletables } from "@schools/curriculum/inventory";
import {
  evaluateCompletion,
  levelFromEvidence,
  type AttemptLevel,
  type CompletionDecision,
} from "@schools/policies/completion";
import type { ClassContext, Freshness } from "./contracts";
import {
  classBlockEvidence,
  classCompletions,
  classRoster,
  lastSweepAt,
  subjectIdsOf,
  unreducedEventCount,
  type ClassMember,
} from "./queries";

/**
 * The things every teacher screen needs before it can say anything.
 *
 * Class identity, which month the class is in, whether that month is actually
 * being served, and how stale the numbers are. Loaded once per request and
 * passed down, because four screens computing "which month is this" separately
 * is four chances to disagree.
 */

/* -------------------------------------------------------------------------- */
/* Which month                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The month a class is working through.
 *
 * ## What this used to answer, and why it was the wrong question
 *
 * It returned the HIGHEST month that was authored and gated open — a fact about
 * the DEPLOYMENT, computed once for everybody, with no reference to any class.
 * The pilot runbook publishes all nine months in one act, so from the moment it
 * runs, every teacher screen in the product described May.
 *
 * Measured live against a seeded September class: `context.monthIndex: 9`,
 * required work 0 of 168, eight May lessons all "nobody started", the review
 * queue empty, and the assessment "not started" for 21 learners. September's
 * actual work was not reachable from the teacher UI at all. The tests could not
 * see it because the harness hard-codes September.
 *
 * ## What it answers now
 *
 * **The lowest month the class has not finished.**
 *
 * That is how a curriculum-paced classroom actually moves, it is derivable from
 * state the product already keeps, and it needs no school calendar — which the
 * brief explicitly forbids inventing. A month counts as finished for the CLASS
 * when at least half the enrolled learners have a completion row for every one
 * of its completables, which is `monthCompletables`, the same definition the
 * unlock policy and the progress bar use.
 *
 * Half rather than all, and the reason is a classroom rather than a statistic:
 * one learner who never finishes September must not hold the whole dashboard in
 * September until May. Half rather than any, for the mirror reason: one learner
 * racing ahead must not move everybody else's screen to a month the class has
 * not met. It is the median learner, which is who a teacher is pacing to.
 *
 * Clamped at both ends. Never above the highest month the deployment actually
 * serves — pointing a teacher at a month the gate has closed would give them a
 * screen of zeros they cannot act on — and never below month 1.
 *
 * ## And a teacher can override it
 *
 * `loadClassBundle` takes an explicit month, so `?month=3` on any teacher route
 * shows November. The derived value is the default, not a cage: a teacher
 * revisiting October in December has a real reason to, and the alternative is
 * the product deciding what they are allowed to look at.
 */
export async function classCurrentMonth(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<Month> {
  const servable = await servableMonths();
  if (servable.length === 0) return MONTH_BY_INDEX.get(1) ?? MONTHS[0];

  /* No learners, or nobody who has done anything: the class is at the start of
     what the deployment serves. A brand-new class in September gets September,
     which is the whole point. */
  if (subjectIds.length === 0) return servable[0];

  const completions = await classCompletions(sql, subjectIds);
  const bySubject = new Map<string, Set<string>>();
  for (const row of completions) {
    const set = bySubject.get(row.subjectId) ?? new Set<string>();
    set.add(row.lessonId);
    bySubject.set(row.subjectId, set);
  }

  /* Half the ENROLLED class, not half of those who have started. A class where
     three of thirty have finished September has not finished September, and
     counting only the three would say it had. */
  const quorum = Math.ceil(subjectIds.length / 2);

  for (const month of servable) {
    const required = monthCompletables(month).map((c) => c.id);
    /* A month with nothing required cannot be "not finished" — it would be a
       wall the class could never get past. */
    if (required.length === 0) continue;
    let finished = 0;
    for (const subjectId of subjectIds) {
      const done = bySubject.get(subjectId);
      if (done && required.every((id) => done.has(id))) finished += 1;
    }
    if (finished < quorum) return month;
  }

  /* Every servable month is finished by the median learner. The last one is
     where the class is — there is nowhere further to point them. */
  return servable[servable.length - 1];
}

/**
 * The months this deployment actually serves, lowest first.
 *
 * Authored and gated open. Kept separate from the derivation above because the
 * month SELECTOR needs the same list — a teacher may only be offered months the
 * product would actually show them work in.
 */
export async function servableMonths(): Promise<Month[]> {
  const out: Month[] = [];
  for (const month of MONTHS) {
    if (!hasAuthoredContent(month)) continue;
    const gate = await gateFor(month);
    if (gate.open) out.push(month);
  }
  return out;
}

/**
 * A month a teacher explicitly asked for, or null if they may not have it.
 *
 * Null for anything that is not a servable month index, and the caller falls
 * back to the derived one rather than erroring: a stale bookmark to a month
 * that has since been withdrawn should show the class's real month, not a 400.
 */
export async function requestedMonth(raw: string | null): Promise<Month | null> {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MONTHS.length) return null;
  const servable = await servableMonths();
  return servable.find((m) => m.index === n) ?? null;
}

function hasAuthoredContent(month: Month): boolean {
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      if (lesson.blocks.length > 0) return true;
    }
  }
  return (month.assessment?.blocks.length ?? 0) > 0;
}

/** Lessons in a month that actually have blocks, in teaching order. */
export function authoredLessons(month: Month): { unit: Localized; lesson: Lesson }[] {
  const out: { unit: Localized; lesson: Lesson }[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      if (lesson.blocks.length > 0) out.push({ unit: unit.title, lesson });
    }
  }
  return out;
}

/** Lessons the month declares but nobody has written yet. Shown, not hidden. */
export function unauthoredLessons(month: Month): { lessonId: string; title: Localized }[] {
  const out: { lessonId: string; title: Localized }[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      if (lesson.blocks.length === 0) out.push({ lessonId: lesson.id, title: lesson.title });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Class context                                                              */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Freshness                                                                  */
/* -------------------------------------------------------------------------- */

/** Beyond this, a pending backlog means the reducer is behind rather than busy. */
const STALE_AFTER_MS = 5 * 60_000;

export async function loadFreshness(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  now: number,
): Promise<Freshness> {
  const [sweep, pending] = await Promise.all([
    lastSweepAt(sql),
    unreducedEventCount(sql, subjectIds),
  ]);
  const ageMs = sweep ? now - Date.parse(sweep) : null;
  return {
    lastSweepAt: sweep,
    pendingEvents: pending,
    /*
     * Three conjuncts, and the third is the one the health route gets wrong.
     * `ageMs` is null when the reducer has NEVER swept — a fresh pilot database,
     * or one where the reducer has been dead since first boot. Treating null as
     * "not behind" means the worst case reports healthy; treating it as behind
     * means an empty deployment cries wolf. The honest answer is that a never-
     * swept deployment with pending work IS behind, so null counts as stale.
     */
    behind: pending > 0 && (ageMs === null || ageMs > STALE_AFTER_MS),
  };
}

/* -------------------------------------------------------------------------- */
/* Required work                                                              */
/* -------------------------------------------------------------------------- */

export interface RequiredWorkResult {
  /** Per subject: how many of the month's authored lessons are satisfied. */
  bySubject: Map<string, { completed: number; total: number; perLesson: Map<string, CompletionDecision> }>;
  /** Authored lessons in the month. The denominator, stated once. */
  total: number;
}

/**
 * How much of the month's required work each learner has actually done.
 *
 * ## Why this is not `lesson_completions`
 *
 * That table records that a learner reached the end of a lesson and the server
 * agreed the policy was satisfied AT THAT MOMENT. It is a fact and it is used
 * elsewhere. But it cannot answer "how far through is this learner right now",
 * because a learner who has done four of five blocks has no row at all — and a
 * dashboard that reads absence as zero tells a teacher a child has done nothing
 * when they have done most of it.
 *
 * So this evaluates the SHIPPED completion policy against the ledger, using the
 * same `evaluateCompletion` the completion route uses. One function, two
 * callers, no second definition of "finished".
 *
 * ## Optional work is not counted
 *
 * The denominator is authored lessons in the month. `completionTarget` applies
 * `blocksForTrack` and the policy's own `attemptFloor` / `gradedFloor`, so
 * passive blocks (concept, worked example, simulation) require `none` and are
 * not governed. There is no Core-vs-Bank flag in the content model to honour
 * beyond that — see the audit — and inventing one here would be a curriculum
 * decision made in a dashboard.
 *
 * ## The track caveat, stated rather than hidden
 *
 * A learner's route lives in a non-httpOnly per-device cookie (`sx_track_m{n}`)
 * and is not persisted anywhere a server can read. So this evaluates against
 * `DEFAULT_TRACK` — the programme's own default and the one that delivers the
 * full task set. For a Support learner the denominator is therefore up to five
 * blocks too high, which makes this a LOWER BOUND on their progress and never
 * an overstatement. That direction is the safe one, and the metrics doc records
 * it as a known limitation rather than leaving it to be discovered.
 *
 * ## Cost
 *
 * One query for the whole class. `classBlockEvidence` takes every block id in
 * the month and every subject in the class and returns one row per pair that
 * has evidence; everything after that is pure JS over `evaluateCompletion`.
 */
export async function loadRequiredWork(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  month: Month,
): Promise<RequiredWorkResult> {
  const lessons = authoredLessons(month);
  const targets = lessons
    .map(({ lesson }) => completionTarget(lesson.id, DEFAULT_TRACK))
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const blockIds = [...new Set(targets.flatMap((t) => t.blocks.map((b) => b.id)))];
  const evidence = await classBlockEvidence(sql, subjectIds, blockIds);

  const bySubjectBlock = new Map<string, Map<string, AttemptLevel>>();
  for (const row of evidence) {
    const inner = bySubjectBlock.get(row.subjectId) ?? new Map<string, AttemptLevel>();
    inner.set(
      row.blockId,
      levelFromEvidence({
        submissions: row.submissions,
        verdicts: row.verdicts,
        accepted: row.accepted,
      }),
    );
    bySubjectBlock.set(row.subjectId, inner);
  }

  const bySubject = new Map<
    string,
    { completed: number; total: number; perLesson: Map<string, CompletionDecision> }
  >();

  for (const subjectId of subjectIds) {
    const reachedMap = bySubjectBlock.get(subjectId) ?? new Map<string, AttemptLevel>();
    const perLesson = new Map<string, CompletionDecision>();
    let completed = 0;
    for (const target of targets) {
      const decision = evaluateCompletion({
        policy: target.policy,
        blocks: target.blocks,
        reached: (blockId) => reachedMap.get(blockId) ?? "none",
      });
      perLesson.set(target.id, decision);
      if (decision.satisfied) completed += 1;
    }
    bySubject.set(subjectId, { completed, total: targets.length, perLesson });
  }

  return { bySubject, total: targets.length };
}

/* -------------------------------------------------------------------------- */
/* Blocks and titles                                                          */
/* -------------------------------------------------------------------------- */

export interface BlockIndexEntry {
  block: LessonBlock;
  lessonId: string;
  lessonTitle: Localized;
  unitTitle: Localized;
  monthIndex: number;
  isAssessment: boolean;
}

/**
 * Block id -> where it lives, for the whole programme, memoised.
 *
 * `findBlock` in `schools/learning/grade.ts` is a linear scan of every block in
 * the programme and is fine for one lookup on a submit. A dashboard resolves a
 * title for every block on a class's screen, so it needs a map. Built once per
 * process; the curriculum is a frozen literal so there is nothing to invalidate.
 *
 * Server-only, and deliberately: the values carry full authored blocks including
 * `referenceSolution` and hidden `cases`. Nothing from this map may be
 * serialised to a teacher response except the ids and the titles.
 */
let blockIndex: Map<string, BlockIndexEntry> | null = null;

export function blockIndexOf(): Map<string, BlockIndexEntry> {
  if (blockIndex) return blockIndex;
  const map = new Map<string, BlockIndexEntry>();
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          map.set(block.id, {
            block,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitTitle: unit.title,
            monthIndex: month.index,
            isAssessment: false,
          });
        }
      }
    }
    if (month.assessment) {
      for (const block of month.assessment.blocks) {
        map.set(block.id, {
          block,
          lessonId: month.assessment.id,
          lessonTitle: month.assessment.title,
          unitTitle: month.assessment.title,
          monthIndex: month.index,
          isAssessment: true,
        });
      }
    }
  }
  blockIndex = map;
  return map;
}

/** Attempt blocks only. Reading a concept is not a task and never was. */
export function isAttemptBlock(block: LessonBlock): boolean {
  return ATTEMPT_BLOCK_TYPES.has(block.type);
}

/**
 * A block kind, in the teacher's language.
 *
 * Total over `BlockType`, with a `never` guard, for the same reason
 * `teacherOutcome` is total over `ExecutionStatus`: a kind added to the
 * curriculum must fail the build rather than appear in a classroom as
 * `reorder_code`.
 */
export function blockKindLabel(type: LessonBlock["type"]): Localized {
  switch (type) {
    case "concept":
      return { kk: "Түсіндірме", ru: "Объяснение" };
    case "worked_example":
      return { kk: "Талданған мысал", ru: "Разобранный пример" };
    case "prediction":
      return { kk: "Болжам", ru: "Предсказание" };
    case "multiple_choice":
      return { kk: "Нұсқаны таңдау", ru: "Выбор варианта" };
    case "trace_code":
      return { kk: "Кодты қадамдау", ru: "Пошаговый разбор" };
    case "reorder_code":
      return { kk: "Жолдарды реттеу", ru: "Порядок строк" };
    case "fill_blank":
      return { kk: "Бос орынды толтыру", ru: "Заполнить пропуск" };
    case "find_bug":
      return { kk: "Қатені табу", ru: "Найти ошибку" };
    case "modify_code":
      return { kk: "Кодты өзгерту", ru: "Изменить код" };
    case "write_code":
      return { kk: "Код жазу", ru: "Написать код" };
    case "test_case":
      return { kk: "Тест ойлап табу", ru: "Придумать тест" };
    case "explain":
      return { kk: "Жазбаша түсіндірме", ru: "Письменное объяснение" };
    case "reflection":
      return { kk: "Ой қорыту", ru: "Размышление" };
    case "arena_problem":
      return { kk: "Жарыс есебі", ru: "Соревновательная задача" };
    case "visual_simulation":
      return { kk: "Көрнекі үлгі", ru: "Наглядная модель" };
    case "challenge":
      return { kk: "Күрделі тапсырма", ru: "Сложное задание" };
    case "verify":
      return { kk: "Дербестікті тексеру", ru: "Проверка самостоятельности" };
    default: {
      const exhaustive: never = type;
      void exhaustive;
      return { kk: "Тапсырма", ru: "Задание" };
    }
  }
}

/** An attempt level, in the teacher's language. Never the raw rung name. */
export function attemptLevelLabel(level: AttemptLevel): Localized {
  switch (level) {
    case "none":
      return { kk: "Басталмаған", ru: "Не начато" };
    case "attempted":
      return { kk: "Әрекет жасалған", ru: "Была попытка" };
    case "answered":
      return { kk: "Жауап берілген", ru: "Ответ дан" };
    case "measured":
      return { kk: "Тексерілген", ru: "Проверено" };
    case "passed":
      return { kk: "Дұрыс орындалған", ru: "Выполнено верно" };
    default: {
      const exhaustive: never = level;
      void exhaustive;
      return { kk: "Белгісіз", ru: "Неизвестно" };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* The shared load                                                            */
/* -------------------------------------------------------------------------- */

export interface ClassBundle {
  members: ClassMember[];
  subjectIds: string[];
  month: Month;
  context: ClassContext;
  freshness: Freshness;
}

/**
 * Everything four of the seven screens open with.
 *
 * Four queries: the roster, the sweep timestamp, the pending-event count and
 * the class name. The old single endpoint issued 97 for the same class, 54 of
 * them writes.
 */
export async function loadClassBundle(
  sql: SqlExecutor,
  store: LearningStore,
  schoolId: string,
  classId: string,
  now: number,
  /**
   * The month the teacher asked for, or null for "whichever one my class is in".
   *
   * Threaded from `openTeacherRequest`, which reads `?month=` — so every screen
   * that goes through it moves together. That coherence is the point: an
   * overview describing September beside a lesson table describing May is the
   * defect this parameter exists to make impossible, not a smaller version of
   * it.
   */
  requested: Month | null = null,
): Promise<ClassBundle> {
  const members = await classRoster(sql, schoolId, classId);
  const subjectIds = subjectIdsOf(members);
  const month = requested ?? (await classCurrentMonth(sql, subjectIds));
  const [freshness, context, servable] = await Promise.all([
    loadFreshness(sql, subjectIds, now),
    buildContext(store, schoolId, classId, month, members.length),
    servableMonths(),
  ]);
  return {
    members,
    subjectIds,
    month,
    context: {
      ...context,
      /* What the selector may offer, and whether this one was chosen or
         derived. A screen that cannot tell the two apart cannot say "your class
         is here" versus "you are looking at November". */
      monthSelected: requested !== null,
      availableMonths: servable.map((m) => ({ index: m.index, title: m.title })),
    },
    freshness,
  };
}

async function buildContext(
  store: LearningStore,
  schoolId: string,
  classId: string,
  month: Month,
  enrolled: number,
): Promise<Omit<ClassContext, "monthSelected" | "availableMonths">> {
  const gate = await gateFor(month);
  const className = await store.classNameFor(schoolId, classId);
  return {
    schoolId,
    classId,
    className: className ?? classId,
    enrolled,
    monthIndex: month.index,
    monthTitle: month.title,
    curriculum: {
      open: gate.open,
      bypassedForDevelopment: gate.bypassedForDevelopment,
      approval: gate.approval.state,
      approvedBy: "record" in gate.approval ? gate.approval.record.reviewerName : null,
      approvedAt: "record" in gate.approval ? gate.approval.record.publishedAt : null,
    },
  };
}
