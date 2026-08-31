import type { BlockType, LessonBlock, VerifyBlock } from "@schools/curriculum/types";
import { ATTEMPT_BLOCK_TYPES } from "@schools/curriculum/types";
import type { PublicBlock } from "@schools/curriculum/public";

/**
 * When is a lesson finished?
 *
 * ## Why this file exists
 *
 * Until now the answer was "when the learner reaches the last block". That rule
 * was never written down anywhere — it was the shape of `advance()` in
 * `school-lesson.tsx`, which calls `onComplete` on the final page and nothing
 * else. It happened to be *defensible*: the footer forces Check on every
 * attempt block, so a lesson could not be clicked through. But the audit
 * (`SEPTEMBER_REMEDIATION_REPORT.md` §7, P1-10) named the real problem, and it
 * is not that the rule was wrong:
 *
 *   > completion is "attempted all", not "passed a bar", and that is a policy
 *   > the school should set, not one I should invent
 *
 * A rule that lives in a navigation callback is a rule nobody can read, nobody
 * can change without touching a React component, and nobody can enforce on the
 * server — which is where a school's record is actually written. A client that
 * posts `{"lessonId": "m1.l3"}` for a lesson it never opened had, until this
 * module, no way of being refused.
 *
 * So the rule is data plus one pure function. The lesson player consults it to
 * decide whether Finish is offered; `/api/learning/complete` consults the SAME
 * function against evidence read from the ledger, and rejects a claim the
 * evidence does not support. There is one definition of "finished" and both
 * ends run it.
 *
 * ## What the policy deliberately does NOT require
 *
 * **Passing.** Not one shipped policy has a `passed` requirement on ordinary
 * practice. A learner who attempts every task in a lesson and gets half of them
 * wrong has finished the lesson — they have done the work, and the work is
 * where the learning is. Gating completion on correctness would mean a
 * fourteen-year-old who struggles is permanently locked out of the next lesson
 * by the lesson they most needed, and the programme's own reveal policy already
 * assumes they will fail repeatedly on the way («шешім идеясы бірнеше әрекеттен
 * соң ғана ашылады»). The evidence of what they got right is in
 * `learning_events`, in full, where a teacher can read it. It does not belong
 * in a gate.
 *
 * ## What it does require, and the ladder that expresses it
 *
 * Everything is stated against one totally ordered ladder — see `AttemptLevel`.
 * A requirement is a minimum rung. That is what lets the two shipped policies
 * differ by data alone rather than by a second code path.
 */

/* -------------------------------------------------------------------------- */
/* The ladder                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * How far a learner got with one block.
 *
 * Totally ordered, and each rung genuinely implies the one below it:
 *
 * - `none` — nothing recorded. The learner never submitted this block.
 * - `attempted` — a submission is on record. The server graded something.
 * - `answered` — the submission carried the learner's own content, so there is
 *   something for a human to read. Every graded submission does, because
 *   `canCheck` refuses to enable Check on an empty answer; the rung is separate
 *   from `attempted` because what it asserts is different — "there is work
 *   here" rather than "a request arrived" — and the assessment leans on it.
 * - `measured` — a verdict was actually produced. NOT reached when the block
 *   settled `unknown`: an explanation nobody marks, a self-authored test case
 *   the author never enumerated, or a code task the judge could not run.
 * - `passed` — the verdict was `correct`.
 *
 * The ordering is the whole trick. `measured` implies `answered` implies
 * `attempted`, so a requirement is just "at least this rung" and comparison is
 * an index lookup rather than a truth table nobody can hold in their head.
 */
export const ATTEMPT_LEVELS = ["none", "attempted", "answered", "measured", "passed"] as const;

export type AttemptLevel = (typeof ATTEMPT_LEVELS)[number];

const RUNG: Readonly<Record<AttemptLevel, number>> = {
  none: 0,
  attempted: 1,
  answered: 2,
  measured: 3,
  passed: 4,
};

/** True when `reached` is at least `required`. */
export function meets(reached: AttemptLevel, required: AttemptLevel): boolean {
  return RUNG[reached] >= RUNG[required];
}

/** The higher of two rungs. Requirements combine by raising, never by lowering. */
export function highest(a: AttemptLevel, b: AttemptLevel): AttemptLevel {
  return RUNG[a] >= RUNG[b] ? a : b;
}

/**
 * The lesson player's five-state verdict, mapped onto the ladder.
 *
 * Taken structurally rather than by importing `LessonVerdict`, so this module
 * stays free of anything that drags React in behind it.
 *
 * `unmeasured` maps to `answered` and not to `measured`, and that is the load
 * bearing line: an explanation the machine never scored is work the learner
 * did, and treating it as measured would let an assessment record itself
 * complete on four blocks nobody graded — which is exactly the state the
 * September assessment used to ship in.
 */
export function levelFromVerdict(
  verdict: "unchecked" | "correct" | "wrong" | "partial" | "unmeasured",
): AttemptLevel {
  switch (verdict) {
    case "unchecked":
      return "none";
    case "unmeasured":
      return "answered";
    case "wrong":
    case "partial":
      return "measured";
    case "correct":
      return "passed";
  }
}

/**
 * Ledger evidence for one block, mapped onto the ladder.
 *
 * This is the server's half, and the two arguments are the only two facts the
 * event stream can prove: a submission was graded (`episode_opened` carries the
 * task ref), and a verdict was recorded for it (`verdict_received`).
 *
 * A submission with no verdict is `answered`, never `measured` — the same rule
 * as `unmeasured` above, reached by a different road.
 *
 * ## The one thing this cannot see
 *
 * Whether the answer was empty. The payload allowlist in
 * `packages/learning-contracts` keeps learner text out of the event stream on
 * purpose, so "they wrote something" is not a fact the ledger holds. What it
 * holds is that a submission was graded, and the UI cannot produce one from an
 * empty field: `canCheck` disables Check until every required part is filled.
 * A hand-rolled POST could still record an empty explanation, and the honest
 * statement is that this policy would count it — the defence against that is
 * the teacher reading the answer, not a column that does not exist.
 */
export function levelFromEvidence(evidence: {
  submissions: number;
  verdicts: number;
  accepted: boolean;
}): AttemptLevel {
  if (evidence.submissions <= 0 && evidence.verdicts <= 0) return "none";
  if (evidence.accepted) return "passed";
  if (evidence.verdicts > 0) return "measured";
  return "answered";
}

/* -------------------------------------------------------------------------- */
/* The block shape the policy reasons about                                   */
/* -------------------------------------------------------------------------- */

export type VerifyMode = VerifyBlock["mode"];

/**
 * Everything the policy needs to know about a block, and nothing else.
 *
 * Deliberately not `LessonBlock`: this shape is built on the server AND in the
 * browser, from two different payloads, and it must be identical in both or the
 * two ends of the check disagree. Note that nothing here is an answer key —
 * `caseCount` is a count, which the public payload already publishes as
 * "N hidden tests".
 */
export interface PolicyBlock {
  id: string;
  type: BlockType;
  /** `verify` only. The programme's five independence checks. */
  mode?: VerifyMode;
  /**
   * Can a machine produce a verdict for this block at all?
   *
   * Not "did it" — "could it". A `write_code` block with no declared cases and
   * an `explain` block are both unmarkable by the runtime, and a policy that
   * demanded a verdict from them would be unsatisfiable rather than strict.
   */
  machineGradable: boolean;
  /** Does the learner act on this block? Concept and simulation blocks do not. */
  isAttempt: boolean;
}

/**
 * Which blocks a machine can grade.
 *
 * One definition, consulted by both adapters below, because the client and the
 * server deriving this separately is exactly how they would come to disagree
 * about whether an assessment is finished.
 */
function machineGradable(type: BlockType, caseCount: number): boolean {
  switch (type) {
    /* Checked by string comparison in `checkBlock`. Always gradable. */
    case "prediction":
    case "multiple_choice":
    case "trace_code":
    case "reorder_code":
    case "fill_blank":
    case "find_bug":
      return true;

    /* Gradable exactly when there is something to run them against. */
    case "write_code":
    case "modify_code":
    case "challenge":
    case "verify":
      return caseCount > 0;

    /* `test_case` settles `correct` or `unknown` and NEVER `wrong`, because a
       learner may have found a genuinely breaking input the author did not
       enumerate. Requiring a verdict here would fail completion for precisely
       the thinking the block exists to train. */
    case "test_case":
    /* Marked by a human, by design. */
    case "explain":
    case "arena_problem":
      return false;

    default:
      return false;
  }
}

/** The policy's view of an authored block. Server side. */
export function policyBlocksFromAuthored(blocks: readonly LessonBlock[]): PolicyBlock[] {
  return blocks.map((block) => {
    const caseCount = "cases" in block && block.cases ? block.cases.length : 0;
    return {
      id: block.id,
      type: block.type,
      mode: block.type === "verify" ? block.mode : undefined,
      machineGradable: machineGradable(block.type, caseCount),
      isAttempt: ATTEMPT_BLOCK_TYPES.has(block.type),
    };
  });
}

/**
 * The policy's view of a projected block. Browser side.
 *
 * `visibleCases.length + hiddenCaseCount` reconstructs the authored total
 * exactly — that is what `splitCases` in `public.ts` partitions — so the two
 * adapters agree on `machineGradable` without the browser ever seeing a case it
 * is not allowed to.
 */
export function policyBlocksFromPublic(blocks: readonly PublicBlock[]): PolicyBlock[] {
  return blocks.map((block) => {
    const caseCount =
      "visibleCases" in block ? block.visibleCases.length + block.hiddenCaseCount : 0;
    return {
      id: block.id,
      type: block.type,
      mode: block.type === "verify" ? block.mode : undefined,
      machineGradable: machineGradable(block.type, caseCount),
      isAttempt: ATTEMPT_BLOCK_TYPES.has(block.type),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* The policy                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A completion rule, as data.
 *
 * Four fields, and every one of them is here because a school might reasonably
 * want it set differently. Nothing about "finished" is a constant scattered
 * through a component any more.
 */
export interface CompletionPolicy {
  readonly id: string;
  /**
   * The floor every attempt block must reach.
   *
   * `attempted` for a lesson: the learner met every task. `answered` for the
   * monthly check, because a check is a record a teacher reads.
   */
  readonly attemptFloor: AttemptLevel;
  /**
   * A raised floor for blocks a machine CAN grade.
   *
   * Only ever raises — the effective requirement is the higher of this and
   * `attemptFloor`. Set above `attemptFloor` only where the record is worthless
   * without a verdict.
   */
  readonly gradedFloor: AttemptLevel;
  /**
   * Requirements attached to a block type, checked independently of both floors
   * and never waived by `allowance`.
   *
   * `verify` is the reason this exists. The programme's five independence
   * checks (PDF p.6) are not ordinary practice: they are the evidence that the
   * learner can work unaided, and one of them being skipped is not the same
   * kind of gap as one arithmetic drill being skipped. A `verify` block does
   * not become optional because the rest of the lesson went well.
   */
  readonly mandatoryByType: Readonly<Partial<Record<BlockType, AttemptLevel>>>;
  /**
   * How many non-mandatory attempt blocks may sit below the floor.
   *
   * Zero in both shipped policies — a lesson's tasks are its content, and a
   * learner who skipped three of them did not do the lesson. It is a field
   * rather than an absent concept because "complete at 90%" is a decision a
   * school is entitled to make, and making it should not require a code change
   * to a React component.
   */
  readonly allowance: number;
}

/**
 * The lesson rule.
 *
 * Attempt everything. Pass nothing in particular. A `verify` block must carry
 * the learner's own work, because a lesson containing one of the programme's
 * independence checks has not been done if the check was left blank.
 */
export const LESSON_COMPLETION_POLICY: CompletionPolicy = {
  id: "lesson.v1",
  attemptFloor: "attempted",
  gradedFloor: "attempted",
  mandatoryByType: { verify: "answered" },
  allowance: 0,
};

/**
 * The monthly check's rule, and it is stricter on two independent axes.
 *
 * 1. **`answered`, not `attempted`, for every block.** The check is what a
 *    teacher marks. "A request arrived for this block" is not a monthly check.
 *
 * 2. **`measured` for every block a machine can grade.** This is the axis that
 *    matters and it is worth being explicit about the cost. September's check
 *    is four `verify` blocks: two carry test cases and two are the written and
 *    oral explanations. Under this policy the two coding blocks must actually
 *    have been RUN — a verdict must exist — before the check records as
 *    complete.
 *
 *    The consequence, stated plainly: if the judge is unreachable during a
 *    monthly check, the learner's work is all recorded in `learning_events` and
 *    the CHECK does not record as complete. That is deliberate. The audit's
 *    worst finding about this assessment was that every block of it settled
 *    `unknown` and "the assessment produced no evidence at all" — a completed
 *    monthly check with no evidence behind it is a lie in a school's record,
 *    and an incomplete one is merely an outage. The decision returned by
 *    `evaluateCompletion` names which blocks are short and at which rung, so a
 *    screen can say "your answers are saved, the check is not yet graded"
 *    rather than anything about the learner.
 *
 * 3. The written and oral blocks must be `answered` — the PDF's own p.6 check,
 *    and the thing `m1.as.b4` could not even accept until the audit fixed its
 *    renderer. They are never `measured`: no machine scores them, and demanding
 *    it would make the check impossible to finish.
 */
export const ASSESSMENT_COMPLETION_POLICY: CompletionPolicy = {
  id: "assessment.v1",
  attemptFloor: "answered",
  gradedFloor: "measured",
  mandatoryByType: { verify: "answered", explain: "answered" },
  allowance: 0,
};

/** Every shipped policy, by id. The registry a stored `policy_id` resolves against. */
export const COMPLETION_POLICIES: Readonly<Record<string, CompletionPolicy>> = {
  [LESSON_COMPLETION_POLICY.id]: LESSON_COMPLETION_POLICY,
  [ASSESSMENT_COMPLETION_POLICY.id]: ASSESSMENT_COMPLETION_POLICY,
};

/** What a learner can finish. The monthly check is not a lesson. */
export type CompletableKind = "lesson" | "assessment";

export function policyFor(kind: CompletableKind): CompletionPolicy {
  return kind === "assessment" ? ASSESSMENT_COMPLETION_POLICY : LESSON_COMPLETION_POLICY;
}

/* -------------------------------------------------------------------------- */
/* Evaluation                                                                 */
/* -------------------------------------------------------------------------- */

export interface BlockRequirement {
  blockId: string;
  required: AttemptLevel;
  reached: AttemptLevel;
  /** True when no allowance may waive this. */
  mandatory: boolean;
}

export interface CompletionDecision {
  policyId: string;
  satisfied: boolean;
  /** Attempt blocks this policy governs. Passive blocks are not counted. */
  governed: number;
  /** Governed blocks that met their requirement. */
  met: number;
  /** Governed blocks that did not, after `allowance` has been spent. */
  outstanding: BlockRequirement[];
  /** Shortfalls forgiven by `allowance`. Empty whenever `allowance` is 0. */
  waived: BlockRequirement[];
}

/**
 * What one block must reach under this policy.
 *
 * Exported because the player renders it and the tests assert it. Passive
 * blocks — concept, worked example, simulation, reflection — require `none`:
 * reading is not evidence of anything and the verdict model exists to keep it
 * from becoming so.
 */
export function requirementFor(policy: CompletionPolicy, block: PolicyBlock): AttemptLevel {
  const mandatory = policy.mandatoryByType[block.type];
  if (!block.isAttempt) return mandatory ?? "none";

  const floor = block.machineGradable
    ? highest(policy.attemptFloor, policy.gradedFloor)
    : policy.attemptFloor;

  return mandatory ? highest(floor, mandatory) : floor;
}

/** True when the policy refuses to let `allowance` forgive this block. */
export function isMandatory(policy: CompletionPolicy, block: PolicyBlock): boolean {
  return policy.mandatoryByType[block.type] !== undefined;
}

/**
 * Is this thing finished?
 *
 * Pure. It takes the blocks and a lookup from block id to how far the learner
 * got, and returns a decision that names every shortfall. It never reads a
 * database, never touches React, and is the only place the question is
 * answered — the player and `/api/learning/complete` both call this one
 * function, against evidence from two different sources.
 */
export function evaluateCompletion(input: {
  policy: CompletionPolicy;
  blocks: readonly PolicyBlock[];
  reached: (blockId: string) => AttemptLevel;
}): CompletionDecision {
  const { policy, blocks, reached } = input;

  const shortfalls: BlockRequirement[] = [];
  let governed = 0;
  let met = 0;

  for (const block of blocks) {
    const required = requirementFor(policy, block);
    if (required === "none") continue;

    governed += 1;
    const level = reached(block.id);
    if (meets(level, required)) {
      met += 1;
      continue;
    }
    shortfalls.push({
      blockId: block.id,
      required,
      reached: level,
      mandatory: isMandatory(policy, block),
    });
  }

  /* Allowance is spent on the SMALLEST gaps first, and never on a mandatory
     block. Spending it on the largest gap would let one completely untouched
     task be forgiven ahead of one that is a single rung short, which is the
     opposite of what a teacher setting "complete at 90%" means. */
  const waivable = shortfalls
    .filter((s) => !s.mandatory)
    .sort((a, b) => RUNG[b.reached] - RUNG[a.reached]);

  const waived = policy.allowance > 0 ? waivable.slice(0, policy.allowance) : [];
  const waivedIds = new Set(waived.map((w) => w.blockId));
  const outstanding = shortfalls.filter((s) => !waivedIds.has(s.blockId));

  return {
    policyId: policy.id,
    satisfied: outstanding.length === 0,
    governed,
    met,
    outstanding,
    waived,
  };
}
