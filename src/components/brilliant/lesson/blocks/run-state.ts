/**
 * The Run panel's decisions, with no React in them.
 *
 * Everything here answers a question the panel must not answer twice: is the
 * button pressable, what does it say, how much of the learner's input may be
 * kept, and what is allowed to be written down about the run afterwards.
 *
 * It is a separate module from `run-panel.tsx` for one reason — the questions
 * are the ones worth pinning in a test, and vitest in this repo runs `node`
 * over `tests/**\/*.test.ts` with no jsdom and no renderer. Logic that lives in
 * a component body is logic nothing asserts. See `tests/school/run-panel.test.ts`.
 */

import { LOCAL_LIMITS, type LocalExecutionStatus,
  isLearnerOutcome,
} from "@schools/execution/trust";
import type { Localized } from "@schools/curriculum/types";
import { YEAR_ONE_LANGUAGE } from "@schools/curriculum/source-of-truth";
import type { PublicCase } from "@schools/curriculum/public";
import { L } from "@schools/presentation/labels";
/**
 * Type-only, and that is not a stylistic preference.
 *
 * `@solvex/learning-contracts`' barrel re-exports `attestation.ts`, which
 * imports `node:crypto` at module scope — so a client component that imports
 * the package for real drags Node into the browser bundle. A type import is
 * erased entirely, and `LearningPayload` is exactly the guarantee this file
 * needs: it is `Partial<Record<AllowedPayloadKey, PayloadValue>>`, so a payload
 * key that is not on `ALLOWED_PAYLOAD_KEYS` is a compile error here, at the one
 * place a Run event is built.
 *
 * The consequence is that the runtime `sanitizePayload` cannot run on this
 * side. That costs nothing it was protecting: the ingest route runs it again on
 * every request precisely because a browser is not trusted to police itself.
 */
import type { LearningPayload } from "@solvex/learning-contracts";
import type { ExecutionSurface, SurfaceCapability } from "@schools/execution/trust-policy";
import { trustSatisfies } from "@schools/execution/trust-policy";

/* -------------------------------------------------------------------------- */
/* The button                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What pressing the button does.
 *
 * `retry` is a separate action rather than a flag because it is a different
 * verb: it re-downloads a runtime that failed to start and runs nothing. A
 * learner whose school Wi-Fi dropped mid-boot must be offered that, and must
 * not be shown a Run button that appears to have executed their program.
 */
export type RunAction = "run" | "retry" | "none";

export interface RunButtonState {
  action: RunAction;
  disabled: boolean;
  label: Localized;
  /**
   * Why it is disabled, when the label alone does not say. Rendered under the
   * button — a control that stops responding without a sentence beside it is
   * indistinguishable from a broken product.
   */
  note: Localized | null;
}

/**
 * The runtime phases this file reasons about, named here rather than imported
 * from one engine's module.
 *
 * It used to be Pyodide's `RunnerPhase`, which was fine while there was one
 * runtime. C++ has a phase Python does not — a program is COMPILED before it
 * runs — and typing the button against one engine's union meant the other
 * engine could not be wired in without a cast. The union below is the product's
 * vocabulary; each runtime maps onto it.
 */
export type RunPhase =
  | "idle"
  | "loading"
  | "ready"
  | "compiling"
  | "running"
  | "failed"
  | "unavailable";

export interface RunButtonInput {
  phase: RunPhase;
  /** True between the press and the result. */
  isRunning: boolean;
  /** The block has been checked, so the editor is frozen and Run is too. */
  locked: boolean;
  /** UTF-8 size of what is in the editor. */
  sourceBytes: number;
  /** False when the editor is empty or whitespace. */
  hasSource: boolean;
  /** What is in the «Входные данные» box, verbatim. */
  stdin: string;
  /** The editor's contents, for deciding whether the program reads input. */
  source?: string;
}

/**
 * Does this program read standard input?
 *
 * Same two ways in as the content gate uses. Deliberately not comment-stripped:
 * a `cin` inside a comment costs the learner one harmless note, and
 * over-warning is the safe direction here.
 */
const READS_STDIN = /\bcin\s*>>|\bgetline\s*\(/;

/**
 * The one place the button's five states are decided.
 *
 * The order of the branches is the priority order and it is deliberate: a
 * runtime that will not load outranks an empty editor, because "the compiler
 * did not load" is our failure and must never be presented as the learner's.
 */
export function runButtonState(input: RunButtonInput): RunButtonState {
  if (input.phase === "unavailable" || input.phase === "failed") {
    /* Not disabled. The retry is the whole point — the runner spawns a fresh
       worker on the next call, and a school's connection coming back is the
       common case. */
    return { action: "retry", disabled: false, label: L.runRetryLoad, note: L.runRuntimeUnavailable };
  }

  if (input.phase === "compiling") {
    return { action: "run", disabled: true, label: L.runCompiling, note: null };
  }

  if (input.isRunning) {
    return { action: "run", disabled: true, label: L.runInProgress, note: null };
  }

  /* `idle` is folded in with `loading` on purpose. The panel mounts with
     `preload`, so idle is the half-frame before the download starts and the
     server render where there is no browser at all; calling that "ready" would
     be a button that does nothing for eight seconds. */
  if (input.phase === "idle" || input.phase === "loading") {
    return { action: "none", disabled: true, label: L.runPreparing, note: null };
  }

  if (input.locked) {
    return { action: "none", disabled: true, label: L.run, note: L.runLockedAfterCheck };
  }

  /* Reads input, and has none. NOT disabled — a learner is allowed to run
   * whatever they like, and being stopped from trying is worse than being
   * warned. But they are told, because this is the one case where C++ is
   * QUIETER than Python was and the silence is dangerous.
   *
   * Python raised EOFError and the learner saw a failure. `cin >> n` fails the
   * stream and returns without writing to the variable, so an uninitialised
   * `int n` keeps whatever was in that memory and the program prints a
   * confident arbitrary number. Nothing on screen says it is not the answer.
   *
   * The box is seeded from the first visible case, so reaching this means the
   * learner cleared it — which they do while experimenting, exactly when they
   * are least equipped to disbelieve a plausible number. */
  if (READS_STDIN.test(input.source ?? "") && input.stdin.trim() === "") {
    return { action: "run", disabled: false, label: L.run, note: L.runStdinEmptyButRead };
  }

  if (input.sourceBytes > LOCAL_LIMITS.maxSourceBytes) {
    /* Told here rather than letting the runner answer with
       `runtime_unavailable`. That status is honest about not being the
       learner's fault, and it is the wrong sentence for a program that is
       simply too long — which IS something they can fix. */
    return { action: "none", disabled: true, label: L.run, note: L.runSourceTooLong };
  }

  if (!input.hasSource) {
    return { action: "none", disabled: true, label: L.run, note: null };
  }

  return { action: "run", disabled: false, label: L.run, note: null };
}

/* -------------------------------------------------------------------------- */
/* stdin                                                                      */
/* -------------------------------------------------------------------------- */

const encoder = new TextEncoder();

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/**
 * The input box, seeded from the first case the learner is allowed to see.
 *
 * `publicBlock()` already decided which cases those are — hidden ones never
 * appear in `visibleCases` — so this can never seed the box with a secret. It
 * is the ordinary path made free: a learner opens `a + b`, sees `3 7` already
 * typed, presses Run and reads `10` without touching the keyboard.
 */
export function seedStdin(visibleCases: readonly PublicCase[]): string {
  return visibleCases[0]?.input ?? "";
}

/**
 * The longest prefix of `value` that fits in `maxBytes` UTF-8 bytes.
 *
 * Cut by code point rather than by byte so a Cyrillic or Kazakh paste never
 * ends in half a character. The fast path — which is every keystroke a learner
 * will ever make — is one `encode` and a comparison.
 */
export function clampStdin(value: string, maxBytes: number = LOCAL_LIMITS.maxStdinBytes): string {
  if (byteLength(value) <= maxBytes) return value;
  let used = 0;
  let out = "";
  for (const codePoint of value) {
    const size = byteLength(codePoint);
    if (used + size > maxBytes) break;
    used += size;
    out += codePoint;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* What a result is allowed to say                                            */
/* -------------------------------------------------------------------------- */

/**
 * The sentence the product owes the learner about a status, if it owes one.
 *
 * `syntax_error` and `runtime_error` return null, and that is the important
 * entry: Python has already said `NameError: name 'x' is not defined` with a
 * line number, and adding «қате бар» above it replaces information with
 * reassurance. The three statuses that DO get a sentence are the ones Python
 * never mentions — it was killed, it was cut off, or it never started.
 */
export function runStatusNote(status: LocalExecutionStatus): Localized | null {
  switch (status) {
    case "time_limit_exceeded":
      return L.runTimeLimit(Math.round(LOCAL_LIMITS.timeLimitMs / 1000));
    case "output_limit_exceeded":
      return L.runOutputLimit;
    case "runtime_unavailable":
      return L.runRuntimeUnavailable;
    case "ok":
    case "syntax_error":
    case "runtime_error":
      return null;
  }
}

/**
 * The trust sentences, in the order they are rendered.
 *
 * Derived from the surface and the capability rather than from the block type,
 * so a code task cannot be moved onto the assessment screen and quietly keep a
 * lesson's wording. `runRanInYourBrowser` is unconditional — it is what
 * `client_local` means — and everything after it is the policy talking.
 */
export function runTrustLines(
  surface: ExecutionSurface,
  capability: SurfaceCapability,
): Localized[] {
  const lines: Localized[] = [L.runRanInYourBrowser];

  /* The load-bearing line. False on practice, the monthly check, a contest and
     the final: there, a local pass is feedback and the evidence comes from the
     server against cases the learner has never seen. */
  if (!trustSatisfies(surface, "client_local")) lines.push(L.runIsNotACheck);

  if (capability.degradedMode === "teacher_review") lines.push(L.runTeacherWillMark);
  if (capability.degradedMode === "unavailable") lines.push(L.runCheckUnavailableHere);

  return lines;
}

/* -------------------------------------------------------------------------- */
/* The event                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The task kind the SERVER will write for this same block.
 *
 * A duplicated rule, and duplicated knowingly. `gradeBlock` in
 * `schools/learning/grade.ts` computes
 *
 *     const kind = lesson.id.endsWith("assessment") ? "assessment"
 *                : block.id.startsWith(`m${month.index}.p`) ? "practice"
 *                : "lesson";
 *     taskRef: `sx-${kind}:${block.id}`
 *
 * and that module carries `import "server-only"`, so it cannot be called from
 * here. The alternative to duplicating it is to send no `task_ref` at all,
 * which would make a Run that is never followed by a Check unattributable to
 * any task — and a learner who iterates for ten minutes and gives up is exactly
 * the one whose effort most needs to be on the record.
 *
 * The two copies are pinned against each other in `tests/school/run-panel.test.ts`,
 * which reads `grade.ts` and fails if the server's expression changes shape.
 */
export type SchoolTaskKind = "lesson" | "practice" | "assessment";

export interface TaskIdentity {
  lessonId: string;
  monthIndex: number;
  blockId: string;
}

export function taskKindOf(input: TaskIdentity): SchoolTaskKind {
  if (input.lessonId.endsWith("assessment")) return "assessment";
  if (input.blockId.startsWith(`m${input.monthIndex}.p`)) return "practice";
  return "lesson";
}

export function schoolTaskRef(input: TaskIdentity): string {
  return `sx-${taskKindOf(input)}:${input.blockId}`;
}

/**
 * Does this outcome count as the learner having done something?
 *
 * A one-line wrapper over `isLearnerOutcome`, and it earns its existence by
 * being reachable from a test. The rule used to live inline in `RunPanel.press`
 * — correct, carefully commented, and asserted by nothing: vitest here is
 * node-only with no renderer, so deleting the guard left the entire suite
 * green. That is the whole reason every other decision in this panel is a pure
 * function in this file, and this one was the exception.
 *
 * The rule itself: a CPython download that died on school Wi-Fi is OUR failure,
 * and recording it as effort would credit a learner with something they did not
 * do — which then feeds Nova's hint ladder, where `run_executed` counts toward
 * the effort a learner must show before the next level of help is granted.
 * Everything else, including a `SyntaxError` two seconds in, is real effort.
 */
export function shouldRecordRun(status: LocalExecutionStatus): boolean {
  return isLearnerOutcome(status);
}

/**
 * Is this Run a NEW piece of effort, or the same one again?
 *
 * ## The bypass this closes
 *
 * `run_executed` is in the EFFORT set of `hasEffortAfter`
 * (`schools/nova/enforce.ts`), which gates the hint ladder. That gate exists
 * for one stated reason, in its own comment: "Asking for another hint is not
 * effort — otherwise the ladder could be climbed by asking repeatedly, which is
 * the exact failure it exists to prevent."
 *
 * Emitting on every press reopened it from a different direction. Before the
 * Run button, the cheapest way past that gate was a real edit
 * (`code_diff_classified`) or a Check. After it, `print(1)` plus N presses of a
 * button unlocked N levels of help — no edit, no thought, no cost.
 *
 * So a press only counts when something about the attempt changed. Trying the
 * same program on a new input is effort; so is changing the program. Pressing
 * the same button on the same two things is the learner watching the same
 * result again, which is fine and is not new work.
 *
 * The comparison is on what was last REPORTED rather than what was last run, so
 * a run that failed to start (and was therefore never reported) does not make
 * the next identical press look like a change.
 */
export function isNewRunEffort(input: {
  source: string;
  stdin: string;
  lastReported: { source: string; stdin: string } | null;
}): boolean {
  const last = input.lastReported;
  if (last === null) return true;
  return last.source !== input.source || last.stdin !== input.stdin;
}

export interface RunEventInput extends TaskIdentity {
  /** True when the learner edited the box away from the seeded sample case. */
  isCustomInput: boolean;
}

/**
 * The payload for `run_executed`.
 *
 * ## What is deliberately absent
 *
 * **stdout, stderr and the source.** None of the three is on
 * `ALLOWED_PAYLOAD_KEYS`, so `LearningPayload` rejects them at compile time and
 * `sanitizePayload` would drop them server-side anyway. They are also the three
 * things a learner would least expect to be shipping every time they press Run,
 * and Run exists so that experimenting feels unwatched.
 *
 * **Anything resembling a verdict.** `run_executed` is stamped `browser` by the
 * ingest route and a browser has no expected output to compare against. A
 * `verdict` key here would be a forged outcome wearing an effort event's name.
 *
 * **`runtime_ms`.** It is on the allowlist and it would be a lie by
 * juxtaposition: the number is main-thread wall time from a tab the OS may have
 * throttled, sitting in the same column as the judge's measured runtime.
 *
 * ## What is present, and the decision each one changes
 *
 * `task_ref` and `task_kind` attribute the effort to a block — without them the
 * Nova hint ladder can see that a learner tried and not what they tried.
 * `is_custom_input` separates "ran the sample again" from "invented an input to
 * probe with", which is the difference between repetition and investigation.
 * `case_count` is 1 because a local Run is always exactly one input; it is here
 * so a school row and an Arena row have the same shape.
 */
export function runEventPayload(input: RunEventInput): LearningPayload {
  return {
    task_ref: schoolTaskRef(input),
    task_kind: taskKindOf(input),
    /* From the source of truth, not spelled out here.
     *
     * This said "python" until the migration, and it was wrong in a way nothing
     * could see: `YEAR_ONE_LANGUAGE` existed, and NOTHING imported it, so the
     * constant and the string the product actually emitted were free to
     * disagree — which is exactly what they did. A hardcoded language on an
     * event is a claim about the curriculum made by a component that has no
     * business having an opinion about it.
     *
     * It also has a downstream effect worth naming: the intelligence core keys
     * boilerplate detection off this string, so a wrong value is not a cosmetic
     * label, it is silent under-detection of "the learner submitted the starter
     * unchanged". */
    language: YEAR_ONE_LANGUAGE,
    is_custom_input: input.isCustomInput,
    case_count: 1,
  };
}
