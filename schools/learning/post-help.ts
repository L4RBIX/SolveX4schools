import type { LessonBlock, Localized } from "@schools/curriculum/types";
import type { BlockVerdict } from "./checking";

/**
 * «Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге… міндетті» —
 * after help, the learner must explain the solution in their own words.
 *
 * The programme names this as one of its independence checks. Nothing
 * implemented it: a learner could take four hints, paste the answer, and the
 * task closed with no moment at which they had to say what they had just done.
 *
 * ## Why this is structural and not a nudge
 *
 * A prompt that says "try explaining it" is decoration. The requirement here is
 * a gate: past a level of assistance, the task is not finished until one short
 * explanation exists. `evaluateCompletionGate` is that gate, and it is a pure
 * function so the completion policy, the renderer and the teacher console all
 * read the same answer.
 *
 * ## THE RULE THAT MATTERS MOST: nothing here grades anything
 *
 * `schools/learning/checking.ts` already settles `explain` blocks as `unknown`,
 * and says why: an explanation in a learner's own words cannot be
 * machine-graded and must not pretend otherwise. This module follows that
 * precedent exactly — `explanationVerdict()` returns `"unknown"`, always, with
 * no branch that can return anything else.
 *
 * Nova may respond to the text. It must never be the thing that decides what
 * the text was worth. An LLM's opinion of a fourteen-year-old's sentence is not
 * evidence about that fourteen-year-old, and the three statuses below exist
 * precisely so there is no place to put one: `submitted`, `teacher_reviewable`
 * and `unmeasured` all mean "not measured", and the storage this writes to has
 * no score column at all (see migration 0016). The guarantee is the absent
 * column, not the good intentions.
 */

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What is going to happen to this explanation. Not how good it was.
 *
 * - `submitted` — the learner's words are on the record and the requirement is
 *   discharged. Nothing has read them and nothing is queued to.
 * - `teacher_reviewable` — additionally routed to a human, because the block
 *   declares `expectedPoints`: an author wrote down what a marker looks for, so
 *   there is something to mark AGAINST. Without criteria, queueing it asks a
 *   teacher to invent a standard per learner, which is exactly what
 *   `expectedPoints` exists in `types.ts` to prevent.
 * - `unmeasured` — the requirement fired and produced no answer. The learner
 *   completed the work and skipped the explanation, or deferred it. The row
 *   exists so that "they did not explain" is a recorded fact rather than an
 *   absence indistinguishable from the gate never having fired.
 *
 * None of the three is a claim about understanding, and there is deliberately
 * no fourth that could be.
 */
export type PostHelpStatus = "submitted" | "teacher_reviewable" | "unmeasured";

/** The closed set, for the store and for anything validating a request. */
export const POST_HELP_STATUSES: readonly PostHelpStatus[] = [
  "submitted",
  "teacher_reviewable",
  "unmeasured",
];

export function isPostHelpStatus(v: unknown): v is PostHelpStatus {
  return typeof v === "string" && (POST_HELP_STATUSES as readonly string[]).includes(v);
}

/* -------------------------------------------------------------------------- */
/* The threshold                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The hint level at or above which an explanation becomes obligatory.
 *
 * **Level 3.** The ladder in `schools/nova/prompt.ts` reads:
 *
 *   0 — ask ONE question that makes them look at the right part
 *   1 — point at the region: which line, which value, which case
 *   2 — name the concept involved and how it behaves in general
 *   3 — walk through the reasoning for their specific case
 *   4 — give the fix, and explain why it is the fix
 *
 * Three is the first rung where Nova supplies the reasoning instead of eliciting
 * it. At 0–2 the learner still assembles the solution themselves, and the
 * explanation they would be asked for is the one they just produced unaided;
 * making them write it out is a tax on asking for help at all, and a
 * fourteen-year-old who is taxed for asking stops asking. At 3 and 4 the
 * reasoning came from Nova, and «өз сөзімен» — in their own words — is the only
 * thing that distinguishes having followed it from having received it.
 *
 * The programme's own wording is «кез келген көмектен соң» — after ANY help —
 * and level 3 is therefore a deliberate loosening, recorded here rather than
 * silently. The case for it is above; the case against is that it is not what
 * the document says. A school that wants the literal reading passes 0.
 *
 * A module constant and not an environment variable on purpose: this decides
 * how much work a child is set, it has to be identical for every learner in a
 * class, and it should change in a diff someone reviewed rather than in a
 * deployment nobody did. Every function below takes it as an overridable
 * argument so a test — or a school — can choose differently.
 */
export const POST_HELP_ASSISTANCE_THRESHOLD = 3;

/**
 * Shortest text accepted as an explanation.
 *
 * A LENGTH check and nothing else. It is here so that "ok" does not discharge
 * an obligation, not to judge what was written — nothing in this module reads
 * the content of the response, and adding something that did would be the exact
 * failure the module header rules out. Below it the submit control is disabled
 * rather than the answer being marked wrong, which is the same choice
 * `canCheck` makes in `checking.ts`.
 */
export const MIN_EXPLANATION_CHARS = 20;

/** Matches the CHECK constraint on `post_help_explanations.response`. */
export const MAX_EXPLANATION_CHARS = 1000;

/* -------------------------------------------------------------------------- */
/* Assistance context                                                         */
/* -------------------------------------------------------------------------- */

export interface AssistanceContext {
  /**
   * Highest hint level delivered on this episode, or -1 for none.
   *
   * The shape `LearningStore.lastGrantedLevel` already returns — it is
   * `max(level) from interventions where episode_id = ...`, derived on the
   * server from the ledger. Never accepted from a browser: a client that could
   * name its own assistance level could name -1 and skip the gate entirely.
   */
  maxLevel: number;
  /** The intervention that carried the help. Stored as the assistance context. */
  interventionId: string | null;
}

/**
 * Does this episode owe an explanation?
 *
 * Depends only on how much help was delivered — not on whether the learner
 * solved it, not on what they typed, not on any judgement about them.
 */
export function requiresPostHelpExplanation(
  assistance: AssistanceContext,
  threshold: number = POST_HELP_ASSISTANCE_THRESHOLD,
): boolean {
  return assistance.maxLevel >= threshold;
}

/* -------------------------------------------------------------------------- */
/* Classifying one explanation                                                */
/* -------------------------------------------------------------------------- */

/** Enough typed to submit? A length test, disabling rather than punishing. */
export function canSubmitExplanation(response: string): boolean {
  const t = response.trim();
  return t.length >= MIN_EXPLANATION_CHARS && t.length <= MAX_EXPLANATION_CHARS;
}

/**
 * Marking criteria an author actually wrote for this block, if any.
 *
 * `expectedPoints` is the only thing in the content model that says what a
 * human marker should look for, and it is what separates `teacher_reviewable`
 * from `submitted`.
 */
export function markingPointsFor(block: LessonBlock): Localized[] {
  if (block.type === "explain") return block.expectedPoints;
  if (block.type === "verify" && block.expectedPoints) return block.expectedPoints;
  return [];
}

/**
 * Which of the three statuses this explanation gets.
 *
 * Note what is not an input: the text. Length decides whether there is an
 * answer at all; the block's own marking criteria decide whether a human has a
 * standard to read it against. Nothing looks at what was said.
 */
export function classifyExplanation(input: {
  response: string | null;
  /** How many marking points the block declares. */
  markingPoints: number;
}): PostHelpStatus {
  const text = input.response?.trim() ?? "";
  if (text.length === 0) return "unmeasured";
  return input.markingPoints > 0 ? "teacher_reviewable" : "submitted";
}

/**
 * The verdict an explanation produces.
 *
 * Always `unknown`. There is no argument and no branch, because the moment
 * there is one, something will eventually pass it a model's opinion. Same rule
 * and same reason as `checkBlock`'s `explain` case: `unknown` is not a failure
 * and not a pass, it is the honest statement that nothing was measured.
 */
export function explanationVerdict(): BlockVerdict {
  return "unknown";
}

/* -------------------------------------------------------------------------- */
/* The bilingual question                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Which question the learner is asked, derived from the block.
 *
 * Three questions rather than one, because "explain your solution" produces a
 * restatement of the task. Repair tasks ask what went wrong; tasks whose skills
 * are about conditions ask why the condition holds — the programme's own
 * example, «Неге бұл шарт жұмыс істейді?»; everything else asks what they did
 * and why.
 *
 * The routing reads `skillRefs`, so it follows the curriculum rather than a
 * second list of block ids that would go stale the first time a task moved.
 */
const CONDITION_SKILLS = new Set([
  "cond.if_elif_else",
  "logic.and_or_not",
  "compare.operators",
  "debug.boundary",
]);

export type ExplanationPromptKey =
  | "postHelpAskWhereWrong"
  | "postHelpAskWhyCondition"
  | "postHelpAskWhatAndWhy";

export function explanationPromptKeyFor(block: LessonBlock): ExplanationPromptKey {
  if (block.type === "find_bug" || block.type === "modify_code") {
    return "postHelpAskWhereWrong";
  }
  if (block.skillRefs.some((s) => CONDITION_SKILLS.has(s))) {
    return "postHelpAskWhyCondition";
  }
  return "postHelpAskWhatAndWhy";
}

/* -------------------------------------------------------------------------- */
/* The completion gate                                                        */
/* -------------------------------------------------------------------------- */

export type GateReason =
  /** Help never reached the threshold, so nothing is owed. */
  | "no_substantial_help"
  /** Owed, and the learner has written one. */
  | "explanation_given"
  /** Owed, and nothing has been written yet. */
  | "explanation_outstanding"
  /** Owed, and the learner completed without writing one. Recorded, not graded. */
  | "explanation_skipped"
  /** Not solved yet, so the question of finishing has not arisen. */
  | "not_solved";

export interface CompletionGate {
  /** Did the assistance on this episode cross the threshold? */
  required: boolean;
  /** Is the requirement discharged? */
  satisfied: boolean;
  /**
   * May the task be treated as done?
   *
   * False while an explanation is outstanding. That is the programme's word —
   * «міндетті» — expressed as a value rather than as a reminder.
   */
  settled: boolean;
  /**
   * Was this an unaided solve?
   *
   * **Never true once any help was delivered, and an explanation cannot make it
   * true.** The rule is `maxLevel < 0`, which is the same rule
   * `activityBuckets` uses for `solvedSolo` — a hint taken at level 0 and then
   * a correct answer is an assisted solve, and writing a paragraph afterwards
   * does not turn it back into an independent one. Explaining is how a learner
   * consolidates help; it is not how they un-receive it.
   */
  independent: boolean;
  reason: GateReason;
}

export function evaluateCompletionGate(input: {
  assistance: AssistanceContext;
  /** The stored explanation for this episode and block, if there is one. */
  explanation: { status: PostHelpStatus } | null;
  /** Has the learner actually got the task right? */
  solved: boolean;
  threshold?: number;
}): CompletionGate {
  const required = requiresPostHelpExplanation(input.assistance, input.threshold);

  /* Assistance at any level costs independence. Computed here rather than
     taken from the caller so that no route can pass `independent: true`
     alongside a level-4 hint. */
  const independent = input.solved && input.assistance.maxLevel < 0;

  if (!input.solved) {
    return { required, satisfied: false, settled: false, independent, reason: "not_solved" };
  }

  if (!required) {
    return {
      required: false,
      satisfied: true,
      settled: true,
      independent,
      reason: "no_substantial_help",
    };
  }

  const status = input.explanation?.status ?? null;

  if (status === null) {
    return {
      required: true,
      satisfied: false,
      settled: false,
      independent,
      reason: "explanation_outstanding",
    };
  }

  if (status === "unmeasured") {
    /* The learner finished the work and skipped the explanation. Recorded, not
       punished: `settled` stays false so the requirement is visibly outstanding,
       and nothing anywhere turns this into a wrong answer or a mastery claim. */
    return {
      required: true,
      satisfied: false,
      settled: false,
      independent,
      reason: "explanation_skipped",
    };
  }

  return {
    required: true,
    satisfied: true,
    settled: true,
    independent,
    reason: "explanation_given",
  };
}
