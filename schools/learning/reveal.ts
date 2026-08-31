import "server-only";
import type { LessonBlock } from "@schools/curriculum/types";
import type { BlockVerdict } from "./checking";

/**
 * When, and how much, of an answer a learner has earned the right to see.
 *
 * ## What this replaces
 *
 * Every answer key used to be in the browser, and nine of the fourteen block
 * views painted it back the instant a verdict arrived: the correct option went
 * green, the fill-blank printed "map, split", the bug hunt printed the repaired
 * program, the trace printed the expected cell values. The footer then offered
 * "Try again" — on a question that could no longer be failed. Brute-force
 * clicking was the fastest route through the month.
 *
 * The programme forbids this in as many words (PDF p.4): «шешім идеясы бірнеше
 * әрекеттен соң ғана ашылады. Дайын жауап берілмейді» — the idea of the
 * solution opens only after several attempts, and a ready answer is never
 * given.
 *
 * ## The rule
 *
 * A first wrong answer reveals NOTHING. It gets a verdict and a retry. From the
 * third failed attempt on the same block, the answer opens — because a learner
 * who has genuinely tried three times and is still stuck is no longer learning
 * from being told "no", and leaving them there is its own failure. That is the
 * same shape as the hint ladder, deliberately.
 *
 * A correct answer reveals the marking points for the written blocks, because
 * there the "answer" is a rubric rather than a key and comparing their
 * reasoning against it is the learning.
 *
 * Nothing here decides a verdict. It only decides what may be shown.
 */

/** Mirrors `BlockReveal` in the renderer; kept structural to avoid importing React code. */
export interface RevealPayload {
  correctId?: string;
  text?: string;
  code?: string;
  line?: number;
  cells?: Record<string, string>;
  points?: { kk: string; ru: string }[];
}

/**
 * Attempts on one block before the answer opens.
 *
 * Three, not two: two is one wrong guess plus one correction, which a learner
 * reaches by accident. Three means they chose to keep going.
 */
export const ATTEMPTS_BEFORE_REVEAL = 3;

export interface RevealInput {
  block: LessonBlock;
  verdict: BlockVerdict;
  /** Failed attempts recorded on this block, including the one being graded. */
  failedAttempts: number;
}

/**
 * What the learner may see now.
 *
 * Returns `undefined` far more often than not, and that is the intended
 * behaviour rather than a gap.
 */
export function revealFor({ block, verdict, failedAttempts }: RevealInput): RevealPayload | undefined {
  /* Marking points are not an answer key — they are what a teacher will look
     for in prose the machine never scores. Showing them once the learner has
     committed their own words is the whole pedagogical point of the block. */
  if (verdict === "unknown") {
    if (block.type === "explain") return { points: block.expectedPoints };
    if (block.type === "verify" && block.expectedPoints) return { points: block.expectedPoints };
    return undefined;
  }

  if (verdict === "correct") {
    /* Nothing to reveal on a right answer for keyed blocks: they already know.
       The exception is the repaired program, which is worth seeing beside their
       own even when they found the line. */
    if (block.type === "find_bug") return { line: block.buggyLine, code: block.fixedCode };
    return undefined;
  }

  if (failedAttempts < ATTEMPTS_BEFORE_REVEAL) return undefined;

  switch (block.type) {
    case "prediction":
      return { correctId: block.answer.trim(), text: block.answer };
    case "multiple_choice":
      return { correctId: block.correctOptionId };
    case "fill_blank":
      return { text: block.blanks.map((b) => b.answer).join(", ") };
    case "find_bug":
      return { line: block.buggyLine, code: block.fixedCode };
    case "trace_code": {
      const cells: Record<string, string> = {};
      block.steps.forEach((step, row) => {
        for (const [name, value] of Object.entries(step.vars)) cells[`${row}:${name}`] = value;
      });
      return { cells };
    }
    case "test_case":
      return { text: block.breakingInputs[0] };
    default:
      /* Code tasks are never revealed. A reference solution handed to a learner
         who is stuck is the one thing the programme rules out entirely, and the
         hint ladder exists to do this properly instead. */
      return undefined;
  }
}

/**
 * The explanation for a wrong answer, when the author established one.
 *
 * `diagnosticMapping.justification` is prose written for exactly this moment —
 * "3 is the result of 7 // 2; picking it means you swapped `%` and `//`". Eight
 * of them were authored for September, the validator enforces they be
 * substantial, and not one was rendered anywhere: a wrong answer produced a
 * colour and a generic bubble.
 *
 * It is returned only where the author declared the wrong answer diagnostically
 * unambiguous. Where they did not, the learner gets no explanation rather than
 * an invented one — the same rule the failure-class model already follows.
 */
export function justificationFor(block: LessonBlock, answerKey: string | undefined): string | undefined {
  if (!answerKey) return undefined;
  return block.diagnosticMapping?.[answerKey]?.justification;
}
