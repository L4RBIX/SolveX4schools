import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { MONTHS } from "@schools/curriculum/months";
import { EXECUTION_LIMITS } from "@schools/exec/provider";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * May claims to teach efficiency. These are the cases that make that true.
 *
 * ## The defect
 *
 * Twenty-four of May's thirty-two runnable blocks state a bound of 100 000 or
 * 200 000 in their prompt and tested at single-digit sizes. So the month whose
 * declared skills are `perf.time_estimate`, `twopointers.core`,
 * `precompute.prefix` and `bsearch.core` accepted, with full marks, exactly the
 * quadratic solutions those skills exist to replace. A judge that cannot tell
 * the intended algorithm from the naive one is not measuring the skill the
 * block is named after.
 *
 * ## What these two cases are
 *
 * `m9.l3.b6` and `m9.c3.p4` are the two where a witness both matters and fits.
 * Each pins the ceiling the prompt already states, and each is asserted here
 * with a MUTATION check: remove the guard and the naive solution passes
 * everything again. That is the difference between a load-bearing case and a
 * decorative one, and it is why the naive programs live in this file rather
 * than in a comment.
 *
 * ## Two that are deliberately absent
 *
 * `m9.c1.p4` (precompute.prefix) and `m9.c4.p3` (bsearch + perf.time_estimate)
 * genuinely need a witness and cannot have one. `EXECUTION_LIMITS.maxStdinBytes`
 * is 16 KiB, which caps a case at ~8 190 numbers, which caps naive work at
 * ~3e7 operations. Measured at the largest legal input: `m9.c4.p3`'s O(n·q)
 * naive finishes in 2.9 s and `m9.c1.p4`'s in 4.5 s, both inside the 5 s cpu
 * budget. A case a naive passes is decoration, and a case whose verdict turns
 * on a 10% margin — measured on one CPython and executed on another — is worse
 * than none on a rented judge. Raising the payload ceiling is the prerequisite,
 * and that is a decision about the judge rather than about content.
 */

const PYTHON = process.env.EXEC_PYTHON_BIN ?? "python3";
/** The judge's own cpu budget. A naive that exceeds it is refused in production. */
const JUDGE_CPU_BUDGET_S = 5;

function pythonAvailable(): boolean {
  try {
    execFileSync(PYTHON, ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
const python = pythonAvailable();
const RELEASE_GATE = Boolean(process.env.CI) && process.env.CONTENT_EXECUTION_ALLOW_SKIP !== "1";

/** Returns the output, or `TIMEOUT` when it outruns the judge's budget. */
function run(source: string, stdin: string): { seconds: number; out: string } {
  const started = Date.now();
  try {
    const out = execFileSync(PYTHON, ["-I", "-S", "-c", source], {
      input: stdin.endsWith("\n") ? stdin : `${stdin}\n`,
      encoding: "utf8",
      timeout: JUDGE_CPU_BUDGET_S * 1000,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
    return { seconds: (Date.now() - started) / 1000, out: out.trim() };
  } catch {
    return { seconds: (Date.now() - started) / 1000, out: "TIMEOUT_OR_ERROR" };
  }
}

function findBlock(id: string): LessonBlock & { cases: { input: string; expectedOutput: string }[] } {
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.id === id) return block as never;
        }
      }
    }
  }
  throw new Error(`no block ${id}`);
}

interface Guard {
  id: string;
  /** What the block is for, and what the naive gets wrong about it. */
  skill: string;
  /** The misconception the guard exists to catch, as an executable program. */
  naive: string;
  /** Longest input among the block's cases identifies the guard. */
  expected: string;
}

const GUARDS: Guard[] = [
  {
    id: "m9.l3.b6",
    skill: "twopointers.core",
    expected: "7999",
    /* Try every subarray. Correct, and quadratic — which is exactly the pair of
       properties two pointers exists to separate. */
    naive: `n, limit = map(int, input().split())
a = list(map(int, input().split()))
best = 0
for i in range(n):
    total = 0
    for j in range(i, n):
        total += a[j]
        if total > limit:
            break
        if j - i + 1 > best:
            best = j - i + 1
print(best)`,
  },
  {
    id: "m9.c3.p4",
    skill: "twopointers.core / greedy.core",
    expected: "7998",
    /*
     * Sort, then for each lightest-remaining passenger scan DOWN from the heavy
     * end for a partner. This is the right idea implemented the long way — it
     * answers every small case correctly and is quadratic, which is exactly the
     * misconception `twopointers.core` replaces.
     *
     * Not the naive that pairs greedily forward without sorting: that one is
     * simply WRONG, and three of the block's existing small cases already catch
     * it. A complexity guard has to be aimed at a solution the small cases
     * cannot fault, or it is not the thing doing the catching.
     */
    naive: `n, limit = map(int, input().split())
w = list(map(int, input().split()))
w.sort()
used = [False] * n
boats = 0
for i in range(n):
    if used[i]:
        continue
    used[i] = True
    boats += 1
    for j in range(n - 1, i, -1):
        if not used[j] and w[i] + w[j] <= limit:
            used[j] = True
            break
print(boats)`,
  },
];

describe("May's complexity guards", () => {
  it("has an interpreter, or is explicitly allowed not to", () => {
    expect(
      python || !RELEASE_GATE,
      `No Python (${PYTHON}) and this is a release gate; the guards would not be executed.`,
    ).toBe(true);
  });

  for (const guard of GUARDS) {
    describe(`${guard.id} — ${guard.skill}`, () => {
      const block = findBlock(guard.id);
      const large = [...block.cases].sort((a, b) => b.input.length - a.input.length)[0];
      const others = block.cases.filter((c) => c !== large);

      it("carries a case at the scale its own prompt states", () => {
        expect(large.input.length, "the guard should be the biggest case by far").toBeGreaterThan(
          10_000,
        );
        expect(large.expectedOutput).toBe(guard.expected);
        expect(large.hidden, "a visible guard would hand over the answer").toBe(true);
      });

      it("fits under the ceiling the judge actually enforces", () => {
        /* Over this and production returns `payload_too_large`, which surfaces
           as an INFRASTRUCTURE error — the whole submission reports unmeasured
           rather than wrong, so the case would silently stop grading anybody. */
        const bytes = Buffer.byteLength(`${large.input}\n`, "utf8");
        expect(bytes).toBeLessThanOrEqual(EXECUTION_LIMITS.maxStdinBytes);
      });

      it.runIf(python)("the reference solution passes it comfortably", () => {
        const result = run(block.referenceSolution as string, large.input);
        expect(result.out, `reference failed its own guard case`).toBe(large.expectedOutput);
        /* Comfortably, not narrowly: the judge is a different machine and a
           reference that only just fits is a flaky task. */
        expect(result.seconds).toBeLessThan(JUDGE_CPU_BUDGET_S / 2);
      });

      it.runIf(python)("the naive solution does NOT", () => {
        const result = run(guard.naive, large.input);
        expect(
          result.out === "TIMEOUT_OR_ERROR" || result.out !== large.expectedOutput,
          `the naive solution passed the guard in ${result.seconds.toFixed(2)}s — ` +
            `the case is decorative and proves nothing`,
        ).toBe(true);
      });

      it.runIf(python)("MUTATION: without the guard, the naive passes everything", () => {
        /*
         * The assertion that makes the case load-bearing rather than decorative.
         * If the naive already failed one of the small cases, the guard would be
         * unnecessary and this test would be lying about why it exists.
         */
        for (const c of others) {
          const result = run(guard.naive, c.input);
          expect(
            result.out,
            `naive already fails ${JSON.stringify(c.input)} — the guard is not what catches it`,
          ).toBe(c.expectedOutput);
        }
      });
    });
  }
});
