import { describe, it, expect } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { EXECUTION_LIMITS } from "@schools/exec/provider";
import type { LessonBlock, Localized } from "@schools/curriculum/types";
import {
  CompileError,
  cleanup,
  compileReference,
  cppCompiler,
  cppCompilerVersion,
  runCase,
} from "../support/cpp-run";

/**
 * May's two ceiling cases. **The file name is historical: there are no
 * complexity guards here any more, and this file's job is now to say so.**
 *
 * ## What this file used to be, and why it stopped being true
 *
 * Under Python, `m9.l3.b6` and `m9.c3.p4` each carried a case that separated
 * the intended algorithm from the quadratic one. The reference ran in ~0.1 s
 * and the naive took 8-12 s against a 5 s judge budget, so a learner who wrote
 * the quadratic solution was told, correctly, that it was too slow. This file
 * asserted that separation and — the part that made it load-bearing rather than
 * decorative — asserted by mutation that removing the big case let the naive
 * pass everything again.
 *
 * Production now ships C++17 only. The separation did not survive the move, and
 * no amount of case authoring brings it back.
 *
 * ## The measurement that ended it
 *
 * Both programs of both blocks, compiled `-std=c++17` and run against the
 * blocks' own largest legal input, nine runs each, Apple clang 17 on arm64.
 * Seconds, wall clock, `min / median / max`:
 *
 * | programme | `-O2` | `-O0` (what Judge0 uses) | answer |
 * |---|---|---|---|
 * | `m9.l3.b6` reference (two pointers) | 0.011 / 0.012 / 0.246 | 0.013 / 0.015 / 0.345 | `7999` |
 * | `m9.l3.b6` naive (all subarrays) | 0.061 / **0.071** / 0.290 | 0.155 / **0.158** / 0.397 | `7999` |
 * | `m9.c3.p4` reference (sort + two pointers) | 0.011 / 0.012 / 0.336 | 0.011 / 0.012 / 0.236 | `7998` |
 * | `m9.c3.p4` naive (sort + downward scan) | 0.044 / **0.046** / 0.277 | 0.614 / **0.661** / 0.870 | `7998` |
 *
 * The `max` column is process-start and page-cache jitter on a laptop running
 * other work; the median is the number to read. Judge0 grades at `-O0` — asked
 * of the compiler rather than assumed, recorded in
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` — so the worst case for the naive is the
 * one that matters, and there it is **0.661 s against a 5 s budget: a factor of
 * 7.6 inside the limit.** At `-O2` the same programme is a factor of 109
 * inside it.
 *
 * Two things follow, and both are fatal to a guard:
 *
 * 1. **No timing separation exists at any legal input.**
 *    `EXECUTION_LIMITS.maxStdinBytes` is 16 KiB, which at two bytes a value
 *    caps a case at ~8 190 numbers against the ~8 000 these already carry. That
 *    is 2.4% more values, and quadratic work goes as the square, so ~5% more
 *    work — 0.661 s becomes ~0.69 s.
 *    The gap to close is 7.6x. There is no case inside the ceiling that closes
 *    it, so this is not a threshold that wants tuning; it is a guard that has
 *    no input to stand on.
 * 2. **No output separation exists either.** Both naive programmes print the
 *    blocks' own declared expected answers. They are not wrong solutions being
 *    let through by a slow clock — they are correct solutions that happen to be
 *    quadratic, which is exactly what a complexity guard is for and exactly
 *    what nothing here can detect.
 *
 * ## So both tasks are graded on the answer, and nothing else
 *
 * `m9.l3.b6` and `m9.c3.p4` are **correctness-only, complexity-unmeasured.** A
 * learner who submits the quadratic solution to either one is accepted with
 * full marks, and that is the product's behaviour rather than an oversight.
 *
 * The curriculum already says this in both places — `M9_L3_B6_LARGE_INPUT` and
 * `M9_C3_P4_LARGE_INPUT` carry the measurement and the retraction, and
 * `m9.l3.b6`'s prompt tells the learner in so many words that the two-pointer
 * shape is advice and the grade comes from the printed number. Only this file
 * disagreed, by asserting a separation that had stopped existing.
 *
 * ## What is asserted below, and why each survives
 *
 * The three tests per block that used to certify the guard are gone: the timing
 * assertion, the "naive does not pass" assertion, and the mutation assertion
 * that depended on the first two. A timing test that sometimes passes the naive
 * algorithm is worse than no guard, because it certifies a property nobody
 * checked. What is left is real:
 *
 * - the ceiling case exists, is hidden, and carries the stated answer;
 * - it sits *at* the stdin ceiling, which is the structural statement of why
 *   no guard can be restored by making it bigger;
 * - the reference compiles and answers it, inside the source and output limits;
 * - **the naive answers it too** — the deleted "naive does not pass" test,
 *   replaced by the truth it was hiding. This one is deterministic: it compares
 *   answers, never a clock. If a future case ever does make the quadratic
 *   solution wrong, this test fails and the question of a guard is worth
 *   reopening;
 * - the prompt does not promise a check the judge cannot perform.
 *
 * That last one is the assertion that keeps the limitation visible where a
 * fourteen-year-old can see it. Naming an algorithm in a prompt is fine; naming
 * it as a *requirement* while the judge grades only the printed number is a
 * promise the product cannot keep.
 *
 * Correctness of every reference against every case is checked in aggregate by
 * `tests/school/content-execution.test.ts`, and a reference that became
 * catastrophically slow would hit `runCase`'s own 10 s ceiling there. This file
 * exercises these two cases by name because they are the largest inputs in the
 * curriculum and the first thing a change to the judge's limits would break.
 */

const COMPILER = cppCompiler();
const haveCompiler = COMPILER !== null;

/**
 * A release gate may not vacate itself — the same rule
 * `content-execution.test.ts` states at greater length. Locally a contributor
 * with no toolchain still gets a useful run; in CI a missing compiler is a
 * false negative wearing a tick.
 */
const RELEASE_GATE = Boolean(process.env.CI) && process.env.CONTENT_EXECUTION_ALLOW_SKIP !== "1";

/** Exactly the fields this file reads. Narrowed once, here, rather than cast at
    every use — the union over every block type has neither `referenceSolution`
    nor `cases.hidden` in common. */
interface RunnableBlock {
  id: string;
  prompt: Localized;
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

function findBlock(id: string): RunnableBlock {
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.id !== id) continue;
          const b = block as LessonBlock & Partial<RunnableBlock>;
          if (
            typeof b.referenceSolution !== "string" ||
            !Array.isArray(b.cases) ||
            typeof b.prompt?.kk !== "string" ||
            typeof b.prompt?.ru !== "string"
          ) {
            throw new Error(`${id} is not a runnable block with a prompt`);
          }
          return { id, prompt: b.prompt, referenceSolution: b.referenceSolution, cases: b.cases };
        }
      }
    }
  }
  throw new Error(`no block ${id}`);
}

interface CeilingCase {
  id: string;
  /** What the block is named after — and, now, what it does not measure. */
  skill: string;
  /** Longest input among the block's cases identifies the ceiling case. */
  expected: string;
  /**
   * The quadratic solution, as an executable programme rather than a claim.
   *
   * It is kept because the honest statement about these blocks is a statement
   * about this programme — that it is correct here, and fast here — and a
   * statement of that kind should be re-runnable by whoever doubts it. It is
   * also the starting point for anyone re-measuring after a change to
   * `EXECUTION_LIMITS`, which is the only change that could revive a guard.
   */
  naive: string;
  /**
   * Whether the prompt names the intended algorithm.
   *
   * A prompt that names one must also say the grade comes from the printed
   * number, because that is the whole of what the judge checks. A prompt that
   * names none has nothing to disclaim.
   */
  namesMethod: boolean;
}

/**
 * How May names the two-pointer method, in each language.
 *
 * A phrase rather than a general detector, and it is used in both directions:
 * `m9.l3.b6` must contain it (and disclaim it), `m9.c3.p4` must not have grown
 * it. That is narrower than "names no algorithm at all", which is not a thing
 * a string match can decide — but it is the exact phrase May uses, so the edit
 * this is protecting against is the edit it catches.
 */
const METHOD_PHRASE = { kk: "екі шекара", ru: "две границы" } as const;
/** And how a prompt discloses that naming it is advice rather than a requirement. */
const ADVICE_DISCLAIMER = { kk: "кеңес, талап емес", ru: "совет, а не требование" } as const;

const CEILING_CASES: CeilingCase[] = [
  {
    id: "m9.l3.b6",
    skill: "twopointers.core",
    expected: "7999",
    namesMethod: true,
    /* Try every subarray, stopping each scan when the sum passes the limit.
       Correct, and quadratic — the pair of properties two pointers exists to
       separate, and which nothing on this input separates any more.
       ~3.2e7 operations: 0.071 s at -O2, 0.158 s at -O0. */
    naive:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    long long limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int best = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        long long total = 0;\n" +
      "        for (int j = i; j < n; j++) {\n" +
      "            total += a[j];\n" +
      "            if (total > limit) break;\n" +
      "            if (j - i + 1 > best) best = j - i + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m9.c3.p4",
    skill: "twopointers.core / greedy.core",
    expected: "7998",
    namesMethod: false,
    /*
     * Sort, then for each lightest-remaining passenger scan DOWN from the heavy
     * end for a partner. The right idea implemented the long way: it answers
     * every case correctly and is quadratic, which is the misconception
     * `twopointers.core` replaces.
     *
     * Not the naive that pairs greedily forward without sorting — that one is
     * simply WRONG, and three of the block's small cases already catch it. The
     * interesting quadratic is the one the small cases cannot fault.
     *
     * ~3.2e7 operations: 0.046 s at -O2 and 0.661 s at -O0. The 14x spread
     * between the two is larger than the reference's because `vector<bool>` is
     * a bit-packed proxy whose accessors vanish under inlining and do not at
     * -O0 — a reminder that -O2 is the wrong engine to judge a bound on.
     */
    naive:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    sort(w.begin(), w.end());\n" +
      "    vector<bool> used(n, false);\n" +
      "    int boats = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (used[i]) continue;\n" +
      "        used[i] = true;\n" +
      "        boats += 1;\n" +
      "        for (int j = n - 1; j > i; j--) {\n" +
      "            if (!used[j] && w[i] + w[j] <= limit) { used[j] = true; break; }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << boats;\n" +
      "    return 0;\n" +
      "}",
  },
];

/**
 * Build one programme and read the answer it gives for one input.
 *
 * `compileReference` builds at `-O2` and Judge0 grades at `-O0`, which would
 * matter enormously to a timing assertion and does not matter at all to this
 * one: every programme in this file prints the same answer at both levels — the
 * measurement in the header ran each of them at both — because an optimiser
 * that changed a programme's output would be a compiler bug. Answers travel
 * between engines; seconds do not. That asymmetry is the whole reason the
 * assertions here are answer-shaped.
 */
function answerFor(source: string, stdin: string, label: string): string {
  const ref = compileReference(source, label);
  try {
    const r = runCase(ref.binary, stdin.endsWith("\n") ? stdin : `${stdin}\n`);
    if (r.status !== "ok") {
      throw new Error(`${label} did not run cleanly: ${r.status} ${r.stderr}`);
    }
    return r.stdout;
  } finally {
    cleanup(ref);
  }
}

/** Each test compiles a translation unit and forks it; 5 s is a claim about the
    machine, not about the content. */
const SPAWN_TIMEOUT_MS = 120_000;

describe("May's two ceiling cases — correctness only, complexity unmeasured", () => {
  it("has a compiler, or is explicitly allowed not to", () => {
    console.log(
      `[may-ceiling-cases] compiler: ${haveCompiler ? cppCompilerVersion() : "NONE"} · ` +
        `m9.l3.b6 and m9.c3.p4 are graded on the answer only; ` +
        `their quadratic solutions pass (0.661 s worst case at -O0, budget 5 s) · ` +
        `release gate: ${RELEASE_GATE ? "enforced" : "advisory"}`,
    );
    expect(
      haveCompiler || !RELEASE_GATE,
      `No C++ compiler and this is a release gate; nothing below would be executed.`,
    ).toBe(true);
  });

  for (const ceiling of CEILING_CASES) {
    describe(`${ceiling.id} — ${ceiling.skill}`, () => {
      const block = findBlock(ceiling.id);
      const large = [...block.cases].sort((a, b) => b.input.length - a.input.length)[0];

      it("carries a case at the scale its own prompt states", () => {
        expect(
          large.input.length,
          "the ceiling case should be the biggest by far",
        ).toBeGreaterThan(10_000);
        expect(large.expectedOutput).toBe(ceiling.expected);
        expect(large.hidden, "a visible ceiling case would hand over the answer").toBe(true);
      });

      it("sits at the stdin ceiling, so no bigger case is available", () => {
        /* Two assertions in one, and the second is the load-bearing half.
           Over `maxStdinBytes` production returns `payload_too_large`, which
           surfaces as an INFRASTRUCTURE error — the submission reports
           unmeasured rather than wrong, so the case would silently stop
           grading anybody.
           Under it by less than a kilobyte is the statement that there is no
           room left: ~500 more bytes buys ~250 more values on ~8 000, which
           moves the quadratic solution's 0.661 s to roughly 0.70 s against a
           5 s budget. Restoring a guard would need a factor of 7.6, not 6%. */
        const bytes = Buffer.byteLength(`${large.input}\n`, "utf8");
        expect(bytes).toBeLessThanOrEqual(EXECUTION_LIMITS.maxStdinBytes);
        expect(
          EXECUTION_LIMITS.maxStdinBytes - bytes,
          "the case is meant to be at the ceiling; slack here means it was shrunk",
        ).toBeLessThan(1024);
      });

      it("does not promise a check the judge cannot perform", () => {
        /* The judge compares the printed number. Nothing else. So a prompt may
           name the intended algorithm as advice, and may not name it as a
           requirement — and this block's answer to that question is pinned
           rather than left to whoever edits the prompt next. */
        for (const locale of ["kk", "ru"] as const) {
          const text = block.prompt[locale];
          if (ceiling.namesMethod) {
            expect(
              text.includes(METHOD_PHRASE[locale]),
              `${ceiling.id}.${locale} no longer names the method; if that is deliberate, ` +
                `flip namesMethod to false rather than deleting this assertion`,
            ).toBe(true);
            expect(
              text.includes(ADVICE_DISCLAIMER[locale]),
              `${ceiling.id}.${locale} names the two-pointer method without saying the grade ` +
                `comes from the printed number. The quadratic solution passes this task ` +
                `(measured: 0.158 s at -O0 against a 5 s budget), so a prompt that reads as ` +
                `a requirement is a promise the judge does not keep.`,
            ).toBe(true);
          } else {
            expect(
              text.includes(METHOD_PHRASE[locale]),
              `${ceiling.id}.${locale} has started naming the two-pointer method. Complexity ` +
                `is not measured on this task — the quadratic solution passes it in 0.661 s ` +
                `against a 5 s budget — so a named method needs the "graded on the printed ` +
                `number" disclaimer m9.l3.b6 carries. Add it and set namesMethod.`,
            ).toBe(false);
          }
        }
      });

      it.runIf(haveCompiler)(
        "the reference compiles and answers it, inside the judge's limits",
        () => {
          expect(
            Buffer.byteLength(block.referenceSolution, "utf8"),
            "a reference over the source ceiling could not be submitted at all",
          ).toBeLessThanOrEqual(EXECUTION_LIMITS.maxSourceBytes);

          let out: string;
          try {
            out = answerFor(block.referenceSolution, large.input, `${ceiling.id}_ref`);
          } catch (e) {
            throw new Error(
              e instanceof CompileError
                ? `${ceiling.id}'s reference does not compile:\n${e.diagnostics}`
                : String(e),
            );
          }
          expect(
            Buffer.byteLength(out, "utf8"),
            "output over the ceiling is truncated by the judge, not compared",
          ).toBeLessThanOrEqual(EXECUTION_LIMITS.maxOutputBytes);
          expect(out.trim(), `${ceiling.id}'s reference failed its own ceiling case`).toBe(
            large.expectedOutput,
          );
        },
        SPAWN_TIMEOUT_MS,
      );

      it.runIf(haveCompiler)(
        "the quadratic solution answers it too — this case measures correctness, not complexity",
        () => {
          /*
           * This replaces the "the naive solution does NOT pass" test that stood
           * here under Python, and it asserts the opposite because the opposite
           * became true. It is deterministic: it compares answers and never
           * consults a clock, so it cannot go green on a fast machine and red on
           * a slow one the way a revived timing guard would.
           *
           * A failure here is not a regression. It means the ceiling case has
           * changed into one the quadratic solution gets WRONG — which would be
           * an output-based separation, the only kind still available at this
           * stdin ceiling, and worth building a real guard on. Re-measure before
           * deciding: `-O0` is the level Judge0 grades at.
           */
          const out = answerFor(ceiling.naive, large.input, `${ceiling.id}_naive`);
          expect(
            out.trim(),
            `the quadratic solution no longer answers ${ceiling.id}'s ceiling case correctly. ` +
              `That is an output-based separation, which is worth a real complexity guard — ` +
              `see this file's header before changing this expectation.`,
          ).toBe(large.expectedOutput);
        },
        SPAWN_TIMEOUT_MS,
      );
    });
  }
});
