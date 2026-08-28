import type { LessonBlock, Locale } from "@schools/curriculum/types";
import type { PublicBlock } from "@schools/curriculum/public";
import { ATTEMPT_BLOCK_TYPES } from "@schools/curriculum/types";

/**
 * Answer checking — pure, and deliberately UI-independent.
 *
 * This module was extracted out of a set of React components so the rules
 * survive a change of renderer. Nothing here imports React, and nothing here
 * knows what a lesson looks like. The same rules now feed the adapted lesson
 * runtime and would feed any future one.
 *
 * ## What "checking" is and is not
 *
 * Checking observes a fact: the learner answered, and the answer was right or
 * wrong. It does NOT decide what that means about the learner. Attribution —
 * "they confused `%` with `//`" — happens only where the content author
 * declared, in the curriculum, that a specific wrong answer uniquely
 * establishes a cause. Everything else returns no failure class, the pipeline
 * records `unattributed_failure`, and the Decision Engine answers `DIAGNOSE`:
 * ask, do not assert.
 *
 * ## `unknown` is a real outcome
 *
 * Several block types cannot be machine-graded and must not pretend otherwise:
 * an explanation in a learner's own words, a self-authored test case the author
 * did not enumerate, a coding task with no sandbox connected. These settle as
 * `unknown`. That is not a failure and not a pass — it is the honest statement
 * that nothing was measured, and it has to reach the screen intact.
 */

export type BlockVerdict = "correct" | "wrong" | "partial" | "unknown";

/** The learner's in-progress answer, per block type. */
export type BlockAnswer =
  | { kind: "none" }
  | { kind: "option"; id: string }
  | { kind: "text"; value: string }
  | { kind: "blanks"; values: string[] }
  | { kind: "order"; ids: string[] }
  | { kind: "line"; line: number }
  | { kind: "grid"; cells: Record<string, string> }
  | { kind: "acknowledged" };

export const NO_ANSWER: BlockAnswer = { kind: "none" };

export interface CheckResult {
  verdict: BlockVerdict;
  /** Normalised answer, for the event payload. Never source code. */
  answerKey?: string;
  /** Only when the author declared this answer diagnostically unambiguous. */
  failureClass?: string;
  /** What the learner should be shown after checking, if anything. */
  reveal?: { kk: string; ru: string };
}

/* -------------------------------------------------------------------------- */

/** True when this block is one the learner acts on. */
export function isAttemptBlock(block: LessonBlock): boolean {
  return ATTEMPT_BLOCK_TYPES.has(block.type);
}

/**
 * Can the learner press Check yet?
 *
 * Kept separate from checking so the CTA can be disabled rather than punishing
 * an empty submission with a wrong verdict.
 */
export function canCheck(block: LessonBlock, answer: BlockAnswer): boolean {
  if (!isAttemptBlock(block)) return true;

  switch (answer.kind) {
    case "none":
      return false;
    case "option":
      return answer.id.length > 0;
    case "text":
      return answer.value.trim().length > 0;
    case "blanks":
      return answer.values.length > 0 && answer.values.every((v) => v.trim().length > 0);
    case "order":
      return answer.ids.length > 0;
    case "line":
      return answer.line > 0;
    case "grid":
      return requiredGridKeys(block).every((k) => (answer.cells[k] ?? "").trim().length > 0);
    case "acknowledged":
      return true;
  }
}

/* -------------------------------------------------------------------------- */
/* Public-payload helpers                                                     */
/*                                                                            */
/* The browser no longer receives answer keys, so it cannot call `checkBlock`. */
/* It still needs two things that require no key at all: whether a block is an */
/* attempt, and whether the learner has entered enough to press Check. These   */
/* work on the projected shape from `schools/curriculum/public.ts`.            */
/* -------------------------------------------------------------------------- */

export function isPublicAttemptBlock(block: PublicBlock): boolean {
  return ATTEMPT_BLOCK_TYPES.has(block.type);
}

export function publicCanCheck(block: PublicBlock, answer: BlockAnswer): boolean {
  if (!isPublicAttemptBlock(block)) return true;

  switch (answer.kind) {
    case "none":
      return false;
    case "option":
      return answer.id.length > 0;
    case "text":
      return answer.value.trim().length > 0;
    case "blanks":
      return answer.values.length > 0 && answer.values.every((v) => v.trim().length > 0);
    case "order":
      return answer.ids.length > 0;
    case "line":
      return answer.line > 0;
    case "grid": {
      /* Variable NAMES survive the projection precisely so this still works —
         the grid cannot know which cells are required without them. */
      const keys =
        block.type === "trace_code"
          ? block.steps.flatMap((step, row) => step.vars.map((name) => `${row}:${name}`))
          : [];
      return keys.every((k) => (answer.cells[k] ?? "").trim().length > 0);
    }
    case "acknowledged":
      return true;
  }
}

function requiredGridKeys(block: LessonBlock): string[] {
  if (block.type !== "trace_code") return [];
  return block.steps.flatMap((step, row) =>
    Object.keys(step.vars).map((name) => `${row}:${name}`),
  );
}

/** Declared failure class for an exact answer, or undefined. Undefined is normal. */
function attribute(block: LessonBlock, answerKey: string): string | undefined {
  return block.diagnosticMapping?.[answerKey]?.failureClass;
}

/* -------------------------------------------------------------------------- */

/**
 * Check an answer.
 *
 * Every rule below is the same rule the previous renderer applied; they were
 * moved, not rewritten, so behaviour is unchanged by the migration.
 */
export function checkBlock(block: LessonBlock, answer: BlockAnswer): CheckResult {
  switch (block.type) {
    /* --- passive blocks: acknowledged, never graded ------------------- */
    case "concept":
    case "worked_example":
    case "visual_simulation":
    case "reflection":
      return { verdict: "unknown" };

    /* --- prediction: trimmed string equality -------------------------- */
    case "prediction": {
      const given =
        answer.kind === "option"
          ? answer.id
          : answer.kind === "text"
            ? answer.value.trim()
            : "";
      const right = given === block.answer.trim();
      return {
        verdict: right ? "correct" : "wrong",
        answerKey: given,
        failureClass: right ? undefined : attribute(block, given),
        reveal: right ? undefined : { kk: block.answer, ru: block.answer },
      };
    }

    /* --- multiple choice: option id equality -------------------------- */
    case "multiple_choice": {
      const given = answer.kind === "option" ? answer.id : "";
      const right = given === block.correctOptionId;
      return {
        verdict: right ? "correct" : "wrong",
        answerKey: given,
        failureClass: right ? undefined : attribute(block, given),
      };
    }

    /* --- fill in the blank: every blank, answer or listed alternative -- */
    case "fill_blank": {
      const values = answer.kind === "blanks" ? answer.values : [];
      const right = block.blanks.every((blank, i) => {
        const given = (values[i] ?? "").trim();
        return given === blank.answer || (blank.alternatives?.includes(given) ?? false);
      });
      return {
        verdict: right ? "correct" : "wrong",
        answerKey: values.join("|"),
        reveal: right
          ? undefined
          : {
              kk: block.blanks.map((b) => b.answer).join(", "),
              ru: block.blanks.map((b) => b.answer).join(", "),
            },
      };
    }

    /* --- reorder: exact sequence -------------------------------------- */
    case "reorder_code": {
      const ids = answer.kind === "order" ? answer.ids : [];
      const right =
        ids.length === block.correctOrder.length &&
        ids.every((id, i) => id === block.correctOrder[i]);
      return { verdict: right ? "correct" : "wrong", answerKey: ids.join(",") };
    }

    /* --- find the bug: the 1-indexed line ----------------------------- */
    case "find_bug": {
      const line = answer.kind === "line" ? answer.line : 0;
      const right = line === block.buggyLine;
      return {
        verdict: right ? "correct" : "wrong",
        answerKey: String(line),
        failureClass: right ? undefined : attribute(block, String(line)),
      };
    }

    /* --- trace: every declared cell ----------------------------------- */
    case "trace_code": {
      const cells = answer.kind === "grid" ? answer.cells : {};
      let total = 0;
      let hit = 0;
      for (const [row, step] of block.steps.entries()) {
        for (const [name, expected] of Object.entries(step.vars)) {
          total += 1;
          if ((cells[`${row}:${name}`] ?? "").trim() === expected) hit += 1;
        }
      }
      if (hit === total) return { verdict: "correct" };
      // Partial is a real outcome here and not a consolation prize: a learner
      // who traced four of five lines correctly did something different from
      // one who traced none, and the runtime shows that difference.
      return { verdict: hit > 0 ? "partial" : "wrong" };
    }

    /* --- self-authored test: enumerated inputs only ------------------- */
    case "test_case": {
      const given = answer.kind === "text" ? answer.value.trim() : "";
      const known = block.breakingInputs.some((b) => b.trim() === given);
      // NOT "wrong" when unknown. The learner may well have found a real
      // breaking case the author never listed, and marking that wrong would
      // punish exactly the thinking this block trains.
      return { verdict: known ? "correct" : "unknown", answerKey: given };
    }

    /* --- explanation: never auto-graded ------------------------------- */
    case "explain":
      return { verdict: "unknown" };

    /* --- verify: recorded, graded by a human or by the sandbox -------- */
    case "verify":
      return { verdict: "unknown" };

    /* --- code tasks: require the sandbox ------------------------------ */
    case "write_code":
    case "modify_code":
    case "challenge":
      // Reaching here means no sandbox result was supplied. Settling as
      // `unknown` rather than `wrong` is the difference between "we did not
      // run it" and "your program is broken".
      return { verdict: "unknown" };

    case "arena_problem":
      return { verdict: "unknown" };

    default: {
      const exhaustive: never = block;
      void exhaustive;
      return { verdict: "unknown" };
    }
  }
}

/**
 * Fold a sandbox result into a block verdict.
 *
 * Separate from `checkBlock` because it arrives asynchronously and from a
 * different trust domain — the sandbox's verdict is attested, the learner's
 * keystrokes are not.
 */
export function checkCodeResult(passed: number, total: number): CheckResult {
  if (total === 0) return { verdict: "unknown" };
  if (passed === total) return { verdict: "correct" };
  if (passed === 0) return { verdict: "wrong" };
  return { verdict: "partial" };
}

/** Localised text helper, so renderers do not each reimplement it. */
export function tr(value: { kk: string; ru: string }, locale: Locale): string {
  return value[locale];
}
