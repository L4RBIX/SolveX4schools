import type { LearnerState } from "@solvex/learning-intelligence-core";
import type { Localized } from "@schools/curriculum/types";
import { skillEvidence, type EvidenceState } from "./evidence";

/**
 * The class projection.
 *
 * What a teacher needs to answer one question — who should I sit with next? —
 * and nothing beyond it.
 *
 * ## The rule that shapes this file
 *
 * Every signal below has a NAMED, checkable cause. There is no
 * "needs attention" flag computed from a mood. A teacher who is told a child
 * needs help must be able to see why in one line, and disagree with it.
 *
 * `unknown` is never a reason. Three failures nobody could explain is not
 * "bad at loops" — it is three failures nobody could explain, and the honest
 * thing to show a teacher is that sentence.
 */

/** Why a learner is surfaced. Each is a fact, not an inference about ability. */
export type SignalKind =
  /** No events at all in the window. */
  | "no_activity"
  /** A misconception the evidence supports acting on. */
  | "recurring_misconception"
  /** Solving, but most solves needed level-2+ help. */
  | "high_assistance"
  /** Unaided solves across several tasks. Ready for the harder block. */
  | "ready_to_stretch"
  /** Failures the system could not explain. Needs a human to look. */
  | "unexplained_failures";

export interface ClassroomSignal {
  kind: SignalKind;
  /** The check, in the teacher's language. Always states the count. */
  detail: Localized;
  /** Skill it concerns, when it concerns one. */
  skill: string | null;
}

export interface LearnerRow {
  subjectId: string;
  /** Display name. Until enrolment exists this is a short id, not a fiction. */
  label: string;
  episodes: number;
  soloSolved: number;
  assistedSolved: number;
  unexplainedFailures: number;
  interventions: number;
  lastActiveAt: string | null;
  signals: ClassroomSignal[];
  skills: { skillId: string; state: EvidenceState }[];
}

const INACTIVE_DAYS = 7;
/** Above this share of solves needing level-2+ help, assistance is worth a look. */
const HIGH_ASSISTANCE = 0.5;

export function buildLearnerRow(
  subjectId: string,
  state: LearnerState,
  lastActiveAt: string | null,
  now = Date.now(),
): LearnerRow {
  const soloSolved = state.skills.reduce((n, s) => n + s.soloSolved, 0);
  const assistedSolved = state.skills.reduce((n, s) => n + s.assistedSolved, 0);
  const signals: ClassroomSignal[] = [];

  /* 1. No activity. A fact about the calendar, not about the learner. */
  if (lastActiveAt) {
    const days = (now - Date.parse(lastActiveAt)) / 86_400_000;
    if (days >= INACTIVE_DAYS) {
      const d = Math.floor(days);
      signals.push({
        kind: "no_activity",
        skill: null,
        detail: {
          kk: `${d} күн бойы белсенділік жоқ`,
          ru: `Нет активности ${d} ${plural(d, "день", "дня", "дней")}`,
        },
      });
    }
  }

  /* 2. A misconception the evidence supports. The failure class IS named here —
     a teacher can act on it and can disagree with it, and `episodeIds` on the
     observation makes it auditable. That is the difference between telling a
     teacher something and telling a child something. */
  for (const skill of state.skills) {
    for (const m of skill.misconceptions) {
      if (!m.actionable) continue;
      signals.push({
        kind: "recurring_misconception",
        skill: skill.skill,
        detail: {
          kk: `${skill.skill}: бір қате ${m.distinctEpisodes} бөлек әрекетте қайталанды (${m.failureClass})`,
          ru: `${skill.skill}: одна ошибка повторилась в ${m.distinctEpisodes} ${plural(m.distinctEpisodes, "попытке", "попытках", "попытках")} (${m.failureClass})`,
        },
      });
    }
  }

  /* 3. Leaning on help. Measured, not sensed. */
  if (state.assistance.hintDependency >= HIGH_ASSISTANCE && soloSolved + assistedSolved > 0) {
    const pct = Math.round(state.assistance.hintDependency * 100);
    signals.push({
      kind: "high_assistance",
      skill: null,
      detail: {
        kk: `Шешімдердің ${pct}%-ы күшті көмекті қажет етті`,
        ru: `${pct}% решений потребовали сильной подсказки`,
      },
    });
  }

  /* 4. Ready for more. Surfaced as loudly as difficulty — a class list that
     only shows problems teaches a teacher to read it as a problem list. */
  const strong = state.skills.filter(
    (s) => s.soloSolved >= 2 && (s.level === "competent" || s.level === "strong"),
  );
  if (strong.length >= 2) {
    signals.push({
      kind: "ready_to_stretch",
      skill: null,
      detail: {
        kk: `${strong.length} дағдыда өз бетінше шешіп жүр — күрделірек блокқа дайын`,
        ru: `Решает самостоятельно по ${strong.length} ${plural(strong.length, "навыку", "навыкам", "навыкам")} — готов к сложному блоку`,
      },
    });
  }

  /* 5. Failures with no cause. NOT a claim about the learner — a statement that
     the system could not explain what happened, which is precisely when a human
     should look rather than the machine guessing. */
  if (state.unattributedFailures >= 3) {
    signals.push({
      kind: "unexplained_failures",
      skill: null,
      detail: {
        kk: `${state.unattributedFailures} қатенің себебін жүйе анықтай алмады — қарап шығу қажет`,
        ru: `Система не смогла установить причину ${state.unattributedFailures} ${plural(state.unattributedFailures, "ошибки", "ошибок", "ошибок")} — стоит посмотреть самому`,
      },
    });
  }

  return {
    subjectId,
    // A short id, not an invented name. Real names arrive with enrolment.
    label: subjectId.slice(0, 8),
    episodes: state.episodes,
    soloSolved,
    assistedSolved,
    unexplainedFailures: state.unattributedFailures,
    interventions: state.assistance.interventions,
    lastActiveAt,
    signals,
    skills: state.skills.map((s) => ({ skillId: s.skill, state: skillEvidence(s) })),
  };
}

export interface ClassroomView {
  classId: string;
  learners: LearnerRow[];
  /** Learners enrolled but with no state yet. Shown, not hidden. */
  notStarted: number;
  /** Per-skill counts across the class. */
  skillBreakdown: { skillId: string; counts: Record<EvidenceState, number> }[];
}

export function buildClassroomView(
  classId: string,
  rows: LearnerRow[],
  enrolled: number,
): ClassroomView {
  const breakdown = new Map<string, Record<EvidenceState, number>>();
  for (const row of rows) {
    for (const s of row.skills) {
      const c =
        breakdown.get(s.skillId) ??
        { not_started: 0, learning: 0, practicing: 0, independent_evidence: 0, needs_review: 0 };
      c[s.state] += 1;
      breakdown.set(s.skillId, c);
    }
  }

  return {
    classId,
    /* Sorted by how much a teacher's attention would change things: a signal
       that names a cause first, then inactivity, then everything else. NOT by
       score — there is no score, and ranking children by one is the thing this
       whole model exists to avoid. */
    learners: [...rows].sort((a, b) => weight(b) - weight(a)),
    notStarted: enrolled - rows.length,
    skillBreakdown: [...breakdown.entries()].map(([skillId, counts]) => ({ skillId, counts })),
  };
}

function weight(row: LearnerRow): number {
  let w = 0;
  for (const s of row.signals) {
    if (s.kind === "recurring_misconception") w += 4;
    else if (s.kind === "no_activity") w += 3;
    else if (s.kind === "unexplained_failures") w += 2;
    else if (s.kind === "high_assistance") w += 2;
    // `ready_to_stretch` deliberately adds nothing: it belongs on the list, but
    // it is not a reason to put a child ahead of one who is stuck.
  }
  return w;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  const m10 = n % 10;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}
