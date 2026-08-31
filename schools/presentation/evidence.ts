import type { LearnerState, SkillState } from "@solvex/learning-intelligence-core";
import type { Locale, Localized } from "@schools/curriculum/types";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { pluralRu as plural } from "./labels";

/**
 * Evidence states for the learner-facing dashboard.
 *
 * ## Why there is no percentage anywhere in this file
 *
 * A mastery number needs two things this system does not have: difficulty
 * calibration, and a cause for most failures. The imported core is explicit
 * about the second — `unattributedFailures` sits at the TOP LEVEL of
 * `LearnerState` precisely so nobody can read the rest without seeing how much
 * of it is unexplained.
 *
 * "Loops 82%" would be a number invented to look like measurement. What follows
 * is coarser and true: it says what the learner has actually done, and it says
 * `not_started` and `learning` rather than 0% and 40%, because those are the
 * honest names for having no evidence and having a little.
 */

export type EvidenceState =
  /** No attempt recorded. Not a zero score — an absence of measurement. */
  | "not_started"
  /** Attempted, but too little to say anything. Mirrors level `unknown`. */
  | "learning"
  /** Solving, but with help or not yet consistently. Mirrors `developing`. */
  | "practicing"
  /** Solved unaided. The only state that claims independence. */
  | "independent_evidence"
  /** A misconception the evidence actually supports acting on. */
  | "needs_review";

export interface SkillEvidence {
  skillId: string;
  title: Localized | null;
  state: EvidenceState;
  /**
   * The core's own sentence. English, machine-generated, and kept because it is
   * the auditable one — it is what the engine actually said.
   *
   * NOT shown to a learner: this is a Kazakh classroom and a machine sentence
   * in a third language reads as a leak. `summary` below says the same thing in
   * their language, built from the SAME counts so the two cannot disagree.
   */
  rationale: string;
  /** Learner-facing, localised, derived from counts — never a translation. */
  summary: Localized;
  attempts: number;
  soloSolved: number;
  assistedSolved: number;
  /** Failures with no known cause. The honest denominator, shown not hidden. */
  unexplainedFailures: number;
}

/**
 * Derive one skill's state.
 *
 * Order matters. `needs_review` is checked FIRST because an actionable
 * misconception is the most useful thing to say about a learner, and it can
 * coexist with solves — someone can pass three tasks and still reliably get
 * the boundary wrong.
 */
export function skillEvidence(skill: SkillState): EvidenceState {
  if (skill.misconceptions.some((m) => m.actionable)) return "needs_review";
  if (skill.soloSolved > 0 && (skill.level === "competent" || skill.level === "strong")) {
    return "independent_evidence";
  }
  if (skill.level === "developing" || skill.solved > 0) return "practicing";
  if (skill.attempts > 0) return "learning";
  return "not_started";
}

/**
 * Every skill the curriculum has introduced so far, with what is known.
 *
 * Skills with no evidence are INCLUDED, as `not_started`. Hiding them would let
 * the page imply the curriculum is only what has been attempted.
 */
export function buildEvidence(
  state: LearnerState | null,
  throughMonth: number,
): SkillEvidence[] {
  const byId = new Map((state?.skills ?? []).map((s) => [s.skill, s]));

  const out: SkillEvidence[] = [];
  for (const [id, def] of SKILL_BY_ID) {
    if (def.introducedInMonth > throughMonth) continue;
    const s = byId.get(id);
    out.push({
      skillId: id,
      title: def.title,
      state: s ? skillEvidence(s) : "not_started",
      rationale: s?.rationale ?? "",
      summary: summarise(s),
      attempts: s?.attempts ?? 0,
      soloSolved: s?.soloSolved ?? 0,
      assistedSolved: s?.assistedSolved ?? 0,
      unexplainedFailures: s ? s.failures - s.attributedFailures : 0,
    });
  }
  return out;
}

/**
 * The learner-facing sentence.
 *
 * Built from the same counts the core used, so it can never claim more than the
 * engine did. Deliberately says how MANY, not how WELL — "two attempts, one
 * solved unaided" is checkable by the learner; "62% mastery" is not.
 */
function summarise(s: SkillState | undefined): Localized {
  if (!s || s.attempts === 0) {
    return { kk: "Әлі басталмаған", ru: "Ещё не начато" };
  }

  const unexplained = s.failures - s.attributedFailures;
  const kk: string[] = [`${s.attempts} әрекет`];
  const ru: string[] = [`${s.attempts} ${plural(s.attempts, "попытка", "попытки", "попыток")}`];

  if (s.soloSolved > 0) {
    kk.push(`${s.soloSolved} рет өз бетінше шешілді`);
    ru.push(`${s.soloSolved} решено самостоятельно`);
  }
  if (s.assistedSolved > 0) {
    kk.push(`${s.assistedSolved} рет көмекпен`);
    ru.push(`${s.assistedSolved} с помощью`);
  }

  const actionable = s.misconceptions.filter((m) => m.actionable);
  if (actionable.length > 0) {
    /* The failure CLASS is not named to the learner. Naming it here would hand
       back a label; the Decision Engine's job is to have Nova ask about it. */
    kk.push(`бір қате бірнеше рет қайталанды`);
    ru.push(`одна ошибка повторилась несколько раз`);
  } else if (unexplained > 0) {
    kk.push(`${unexplained} қатенің себебі әлі белгісіз`);
    ru.push(`${unexplained} ${plural(unexplained, "ошибка", "ошибки", "ошибок")} без установленной причины`);
  }

  return { kk: kk.join(", ") + ".", ru: ru.join(", ") + "." };
}

export const EVIDENCE_LABEL: Record<EvidenceState, Localized> = {
  not_started: { kk: "Басталмаған", ru: "Не начато" },
  learning: { kk: "Танысу", ru: "Знакомство" },
  practicing: { kk: "Жаттығу", ru: "Практика" },
  independent_evidence: { kk: "Өз бетінше", ru: "Самостоятельно" },
  needs_review: { kk: "Қайта қарау керек", ru: "Нужно повторить" },
};

/** Never red for `needs_review`: it means "worth another look", not "failed". */
export const EVIDENCE_TONE: Record<EvidenceState, string> = {
  not_started: "text-white/30",
  learning: "text-white/60",
  practicing: "text-b-blue",
  independent_evidence: "text-b-green-2",
  needs_review: "text-b-warn-icon",
};

export function evidenceLabel(state: EvidenceState, locale: Locale): string {
  return EVIDENCE_LABEL[state][locale];
}

/** Headline counts. Plain integers — nothing derived, nothing scaled. */
export function evidenceSummary(state: LearnerState | null) {
  return {
    episodes: state?.episodes ?? 0,
    soloSolved: (state?.skills ?? []).reduce((n, s) => n + s.soloSolved, 0),
    assistedSolved: (state?.skills ?? []).reduce((n, s) => n + s.assistedSolved, 0),
    interventions: state?.assistance.interventions ?? 0,
    /* Surfaced deliberately. At three quarters of failures unexplained, every
       other number here is built on a quarter of what happened, and a reader
       who cannot see that will over-trust it. */
    unexplainedFailures: state?.unattributedFailures ?? 0,
  };
}
