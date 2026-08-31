/**
 * Output checking.
 *
 * ## The rule this file replaces
 *
 * Grading used to be one line, applied to every task in the programme:
 *
 * ```ts
 * stdout.replace(/\s+$/, "") === expected.replace(/\s+$/, "")
 * ```
 *
 * That is a normalisation nobody authored, and it is wrong in both directions
 * at once. It is too strict, because a learner who prints `1 2 3` where the key
 * says `1  2  3` is marked wrong for a space — and nothing in the September
 * prompts ever claimed the number of spaces was part of the answer. It is too
 * lax nowhere useful, because it still demands byte equality inside the line,
 * which means it has no answer at all for a task whose correct output is a
 * float: `0.3333333333333333` and `0.333333` are the same number and different
 * strings, so the only way to set such a task under the old rule was to pick a
 * `round()` by guesswork and hide the requirement in the answer key.
 *
 * So the comparison becomes something a task AUTHOR declares, out loud, per
 * task. Three kinds, and no fourth without a reason:
 *
 * - **`exact`** — byte-for-byte after trailing newlines are removed, and
 *   nothing else is touched. For tasks where the formatting IS the answer:
 *   print a table, indent a triangle, put a comma between the pairs.
 * - **`token`** — split both sides on whitespace and compare the token
 *   sequences. Spaces, tabs and line breaks stop mattering; the values do not.
 * - **`numeric`** — token-wise, except that a pair of tokens which both parse
 *   as decimal numbers compares within the tolerance THIS TASK declares.
 *
 * ## Why `token` is the default and `exact` is not
 *
 * A default is a decision made on behalf of every author who does not think
 * about it, so it has to be the one that is harmless when nobody thought.
 *
 * `exact` is not harmless. Making it the default means every task in the year
 * silently acquires a requirement its prompt never stated — that the learner
 * reproduce the author's spacing — and a fourteen-year-old whose program is
 * arithmetically perfect is told they are wrong, with a diff they cannot see
 * (the failing cases are hidden by design) about a space they were never asked
 * for. That failure is indistinguishable, from inside the product, from not
 * understanding loops, and it is fed to the evidence pipeline as exactly that.
 *
 * `token` is harmless in the other direction: it accepts everything a stricter
 * rule accepts, and the extra things it accepts are things the prompt did not
 * ask about. When formatting genuinely is the exercise, the author says so and
 * gets `exact` — a one-word declaration on the block, visible in review, next
 * to the cases it governs.
 *
 * It is also strictly weaker than the rule it replaces, which is what let it
 * be turned on under frozen content: any output the old comparison passed, the
 * token comparison passes too. Nothing that passed September stops passing.
 *
 * ## Why there is no default tolerance
 *
 * A tolerance is a claim about how much of the answer the task is willing to be
 * wrong by, and only the person who wrote the task knows that number. Inventing
 * one — 1e-6 is the usual invention — silently decides for every future author
 * that six digits is what their problem means, including the ones where the
 * answer is money and the third decimal is a wrong answer, and the ones where
 * the whole point is that floats do not add up the way you expect.
 *
 * So a `numeric` checker without a declared tolerance is an authoring error.
 * The curriculum validator rejects it before it ships, and `checkOutput` throws
 * rather than guessing if one ever reaches the judge. If the exact decimal
 * formatting IS the requirement, that task wants `exact`, not a tolerance of
 * zero smuggled in by the runtime.
 *
 * ## Where this is used
 *
 * Both places output is ever compared: `runCases` in `./index.ts`, which grades
 * a learner, and `tests/school/content-execution.test.ts`, which runs every
 * reference solution against its own cases in CI. They call this function
 * because the alternative — two comparisons — is a task that passes CI under
 * one rule and fails a child under the other.
 *
 * No `server-only` import here, deliberately: this is pure string comparison
 * with no secret in it, and `schools/curriculum/types.ts` imports the type.
 */

/**
 * How one task's output is compared. Declared on the block, never inferred.
 *
 * A discriminated union rather than a flags object, so `absoluteTolerance` on
 * an `exact` checker is a compile error instead of a field that quietly does
 * nothing.
 */
export type OutputChecker =
  /** Byte-for-byte after trailing newlines. Formatting is part of the answer. */
  | { readonly kind: "exact" }
  /** Whitespace-insensitive, value-sensitive. The sensible default. */
  | { readonly kind: "token" }
  /**
   * Token-wise with a tolerance on the numbers.
   *
   * At least one of the two tolerances is REQUIRED — see the file header. Both
   * may be given, in which case a token passes if it satisfies either, which is
   * the standard way to keep a tolerance sane near zero (where relative is
   * meaningless) and near a million (where absolute is).
   */
  | {
      readonly kind: "numeric";
      /** |actual − expected| ≤ this. */
      readonly absoluteTolerance?: number;
      /** |actual − expected| ≤ this × |expected|. */
      readonly relativeTolerance?: number;
    };

/**
 * What a block that declares nothing gets.
 *
 * Frozen so a caller cannot mutate the shared default into something else, and
 * exported so tests can assert the default IS token rather than restating it.
 */
export const DEFAULT_CHECKER: OutputChecker = Object.freeze({ kind: "token" as const });

/**
 * A checker that cannot be used to judge anything.
 *
 * Thrown, not returned as a failing case. A malformed checker is our bug, not
 * the learner's, and the difference matters: returning `passed: false` marks a
 * child wrong for an authoring mistake, while throwing reaches the submit
 * route's catch and settles the attempt as unmeasured — nobody graded, nobody
 * blamed. Loud in CI, harmless to a learner, which is the right way round.
 */
export class CheckerAuthoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckerAuthoringError";
  }
}

/**
 * Why this checker is unusable, or `null` if it is fine.
 *
 * Returned rather than thrown so the curriculum validator can collect every
 * problem in the programme and print them together, which is what it does with
 * every other content error.
 */
export function checkerProblem(checker: OutputChecker): string | null {
  switch (checker.kind) {
    case "exact":
    case "token":
      return null;

    case "numeric": {
      const abs = checker.absoluteTolerance;
      const rel = checker.relativeTolerance;
      if (abs === undefined && rel === undefined) {
        return (
          "a numeric checker declares no tolerance — say how close is close " +
          "enough (absoluteTolerance and/or relativeTolerance), or use the " +
          "exact checker if the decimal formatting is the answer"
        );
      }
      for (const [name, value] of [
        ["absoluteTolerance", abs],
        ["relativeTolerance", rel],
      ] as const) {
        if (value === undefined) continue;
        if (!Number.isFinite(value)) return `${name} is not a finite number`;
        // A negative tolerance rejects even an identical answer; an author who
        // typed one meant something else entirely.
        if (value < 0) return `${name} is negative`;
      }
      return null;
    }

    default: {
      const exhaustive: never = checker;
      void exhaustive;
      return `unknown checker kind ${JSON.stringify((checker as { kind: unknown }).kind)}`;
    }
  }
}

/**
 * Trailing newlines, and ONLY trailing newlines.
 *
 * `print()` ends every Python program with one, and no author writes it into
 * the expected output, so removing it is not a judgement about the task — it is
 * the difference between the language and the answer. Trailing SPACES are left
 * alone: a program that prints `"5 "` printed a space, and under `exact` the
 * author has said they care.
 */
function stripTrailingNewlines(text: string): string {
  return text.replace(/[\r\n]+$/, "");
}

/** Whitespace-separated tokens. Empty input yields no tokens, not one empty one. */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 0);
}

/**
 * A plain decimal number, or `null`.
 *
 * Deliberately narrower than `Number()`. `Number("0x1f")` is 31 and
 * `Number("Infinity")` is infinite, and a task whose expected output is the
 * literal text `inf` or `nan` — Python prints both — is asking about that TEXT,
 * so those compare as strings and stay comparable. A number so large it parses
 * to Infinity is also refused: no tolerance is meaningful against it, and
 * `Infinity - Infinity` is `NaN`, which would fail every comparison including
 * against itself.
 */
function decimalValue(token: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) return null;
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

/**
 * Is `actual` within the declared tolerance of `expected`?
 *
 * Only the tolerances the author actually wrote are consulted. An undeclared
 * one is not zero and not infinity — it is a comparison that does not happen.
 */
function withinTolerance(
  actual: number,
  expected: number,
  absoluteTolerance: number | undefined,
  relativeTolerance: number | undefined,
): boolean {
  const difference = Math.abs(actual - expected);
  if (absoluteTolerance !== undefined && difference <= absoluteTolerance) return true;
  if (relativeTolerance !== undefined && difference <= relativeTolerance * Math.abs(expected)) {
    return true;
  }
  return false;
}

/**
 * Does this output pass this case?
 *
 * `actual` is raw stdout — pass it unmodified. Every normalisation any kind
 * performs is in this file and is named by the kind, which is the whole point:
 * a caller that trims before calling has invented a fourth checker nobody can
 * see from the block.
 *
 * @throws {CheckerAuthoringError} if the checker itself is malformed.
 */
export function checkOutput(
  actual: string,
  expected: string,
  checker: OutputChecker = DEFAULT_CHECKER,
): boolean {
  const problem = checkerProblem(checker);
  if (problem !== null) throw new CheckerAuthoringError(problem);

  if (checker.kind === "exact") {
    return stripTrailingNewlines(actual) === stripTrailingNewlines(expected);
  }

  const actualTokens = tokenize(actual);
  const expectedTokens = tokenize(expected);
  /* Length first, so `1 2` against `1 2 3` fails on the count rather than on
     whichever token happened to be compared last. Note that this makes empty
     output and whitespace-only output the same thing under `token` — both
     tokenize to nothing. That is what "whitespace does not matter" means; a
     task where printing spaces instead of nothing is the failure wants
     `exact`. */
  if (actualTokens.length !== expectedTokens.length) return false;

  if (checker.kind === "token") {
    return actualTokens.every((token, i) => token === expectedTokens[i]);
  }

  const { absoluteTolerance, relativeTolerance } = checker;
  return actualTokens.every((token, i) => {
    const expectedToken = expectedTokens[i];
    const a = decimalValue(token);
    const e = decimalValue(expectedToken);
    /* Both numbers → compare as numbers, which is where `-0.0` stops being a
       different answer from `0.0` and `2.0` stops being a different answer from
       `2`. Anything else → compare as text, so the words around the numbers
       ("Answer:", "yes") are still checked exactly. */
    if (a === null || e === null) return token === expectedToken;
    return withinTolerance(a, e, absoluteTolerance, relativeTolerance);
  });
}
