import type { Locale, Localized } from "@schools/curriculum/types";
import type { ExecutionStatus } from "@schools/exec/provider";
import { L, t } from "./labels";

/**
 * What a teacher is told about a code result.
 *
 * ## The rule
 *
 * A string produced by the judge, the container runtime, the HTTP stack or this
 * application's own error handling must never reach a teacher's screen.
 * `PISTON_STAGE_MISSING`, `provider_exit_502`, `container_internal_error`,
 * `SyntaxError: Unexpected token '<'` — none of these is information to someone
 * standing in front of eighteen students. They are information to whoever is on
 * call, and there is a whole admin health view for that.
 *
 * ## Why a module rather than a `switch` at the call site
 *
 * Because there is currently no call site, and that is exactly when the rule
 * gets broken. The first teacher surface that shows a per-case outcome will
 * otherwise invent its own vocabulary out of whatever field is nearest, and the
 * nearest field is `ExecutionStatus`. One total function, asserted total by
 * `tests/school/teacher-language.test.ts`, means a status added to the port
 * fails a test rather than appearing in a classroom.
 *
 * **State of use, honestly:** nothing renders `teacherOutcome` today. The
 * teacher classroom shows aggregate signals, not per-submission results. This is
 * a choke point placed ahead of a surface, not a description of one that exists.
 *
 * ## Import discipline
 *
 * `ExecutionStatus` arrives as `import type` and must stay that way.
 * `schools/exec/provider.ts` is `server-only`, this module is imported by client
 * components, and a value import here would break the client build — which is
 * the good failure mode, but only if nobody "fixes" it by dropping `type`.
 */

/**
 * The closed teacher vocabulary. Eight outcomes, and the split that matters is
 * between the five that say something about the learner's program and the three
 * that do not.
 */
export type TeacherOutcome =
  /* --- these are evidence about the learner --- */
  | "passed"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "memory_limit"
  /* --- these are NOT --- */
  /** The judge failed. Nothing was measured and nobody was marked wrong. */
  | "not_checked"
  /** Nothing here is machine-gradable. Permanent, correct, not a fault. */
  | "not_machine_checked";

const OUTCOME_LABEL: Record<TeacherOutcome, Localized> = {
  passed: L.teacherOutcomePassed,
  wrong_answer: L.teacherOutcomeWrongAnswer,
  compile_error: L.teacherOutcomeCompileError,
  runtime_error: L.teacherOutcomeRuntimeError,
  time_limit: L.teacherOutcomeTimeLimit,
  memory_limit: L.teacherOutcomeMemoryLimit,
  not_checked: L.teacherOutcomeNotChecked,
  not_machine_checked: L.teacherOutcomeNotMachineChecked,
};

/**
 * Execution status → what a teacher reads.
 *
 * `passedAllCases` is separate from the status on purpose. `ok` means the
 * program RAN, not that it was right; a program that runs perfectly and prints
 * the wrong number is `ok` at the port and `wrong_answer` to a teacher. Merging
 * them would report every clean run as a pass, which is the one error in this
 * direction that would put a false claim about a child in a school record.
 *
 * The three infrastructure statuses collapse to a single `not_checked`, and
 * that collapse is deliberate: "the judge timed out", "the judge was
 * unreachable" and "the judge is over its quota" are the same fact to a teacher
 * — nothing was measured — and differ only to whoever is fixing it. The distinction survives intact in `ExecutionStatus`,
 * in the ledger and in the admin health view, which is where it is useful.
 */
export function teacherOutcome(status: ExecutionStatus, passedAllCases: boolean): TeacherOutcome {
  switch (status) {
    case "ok":
      return passedAllCases ? "passed" : "wrong_answer";
    case "compile_error":
      return "compile_error";
    case "runtime_error":
      return "runtime_error";
    case "time_limit_exceeded":
      return "time_limit";
    case "memory_limit_exceeded":
      return "memory_limit";
    case "provider_timeout":
    case "provider_error":
    /* `payload_too_large` belongs here and not with the learner's own failures.
       It carries `infrastructureError: true` (schools/exec/limits.ts:35): the
       submission was refused on size before it reached the judge, so nothing
       was measured and the teacher must be told nothing was measured. Calling
       it `wrong_answer` would be the one thing this whole function exists to
       prevent — an outage rendered as a fact about a child. */
/* And a metered judge refusing us on quota.
     *
     * `provider_rate_limited` exists so that an over-quota afternoon and a dead
     * judge are distinguishable to an operator — they want opposite actions.
     * They are NOT distinguishable to a teacher, who gets the same sentence as
     * the other unmeasured statuses, because the only teacher-relevant fact is
     * the one all of them share: nothing was measured and nobody was marked
     * wrong. "The judge is over its request limit" is a billing fact about a
     * plan, and a teacher standing in front of eighteen students cannot act on
     * it. */
    case "provider_rate_limited":
    /* And the size refusal, for the same reason and with one extra note.
     *
     * A teacher's question is "was this measured?", and for all four the
     * answer is no. The distinction between them — the judge died, the judge
     * was unreachable, the judge refused us on quota, we refused to run it —
     * matters to whoever is fixing something and to nobody standing in front of
     * a class.
     *
     * It should also never arrive here at all: an oversized submission is
     * refused at the route with a 413 and writes no learning event, so there is
     * nothing for a teacher projection to be built from. This case exists
     * because the switch is exhaustive over the port's vocabulary, and because
     * if it ever DID arrive the only safe answer is the one that claims nothing
     * about the learner. */
    case "payload_too_large":
      return "not_checked";
    default: {
      /* Unreachable while the switch covers `ExecutionStatus`, and the
         assignment below is what makes that a COMPILE error rather than a
         runtime surprise: add a status to the port without adding a case and
         `never` refuses it. The runtime fallback exists only because a status
         could also arrive from a deserialised payload, and in that event the
         safe answer is the one that claims nothing about the learner. */
      const exhaustive: never = status;
      void exhaustive;
      return "not_checked";
    }
  }
}

export function teacherOutcomeLabel(outcome: TeacherOutcome): Localized {
  return OUTCOME_LABEL[outcome];
}

export function teacherOutcomeText(outcome: TeacherOutcome, locale: Locale): string {
  return t(OUTCOME_LABEL[outcome], locale);
}

/* -------------------------------------------------------------------------- */
/* Why the class list would not load                                          */
/* -------------------------------------------------------------------------- */

/**
 * Three sentences a teacher can do something with, out of anything at all.
 *
 * The input is whatever came back — a guard reason (`not_authenticated`,
 * `forbidden`, `not_found`), an unexpected `error` field, `null` from a body
 * that was not JSON, or the message of a `TypeError` from a dead network. The
 * function is total over `unknown` for that reason: the failure modes that
 * produce the ugliest strings are exactly the ones nobody anticipated, so the
 * signature must not assume the shape.
 *
 * Everything unrecognised becomes `unavailable`. There is no branch that returns
 * its own input, which is the property the test asserts.
 */
export type TeacherLoadFailure = "signed_out" | "not_yours" | "unavailable";

export function teacherLoadFailure(reason: unknown): TeacherLoadFailure {
  if (reason === "not_authenticated") return "signed_out";
  /* `forbidden` and `not_found` are one sentence, and that is not sloppiness —
     `requireClassAccess` answers 404 rather than 403 for a class this teacher
     does not teach precisely so the two are indistinguishable to the caller.
     Giving them different wording here would undo that on the screen. */
  if (reason === "forbidden" || reason === "not_found") return "not_yours";
  return "unavailable";
}

const LOAD_FAILURE_LABEL: Record<TeacherLoadFailure, Localized> = {
  signed_out: L.teacherClassSignedOut,
  not_yours: L.teacherClassNotYours,
  unavailable: L.teacherClassUnavailable,
};

export function teacherLoadFailureLabel(failure: TeacherLoadFailure): Localized {
  return LOAD_FAILURE_LABEL[failure];
}
