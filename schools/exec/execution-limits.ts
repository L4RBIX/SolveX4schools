/**
 * The ceilings, and the reasoning for each.
 *
 * ## Why this module exists at all, and has no `server-only`
 *
 * Every other file under `schools/exec` carries `import "server-only"`, and
 * `tests/execution/pyodide-boundary.test.ts` asserts it: importing the judge
 * machinery from a client component must fail the build, because that machinery
 * holds an API key, spawns processes and knows the answer key.
 *
 * These five numbers are none of those things, and marking them server-only had
 * a cost that showed up as a broken tool. `scripts/check-blocks.ts` — the
 * per-file authoring checker a content author runs for fast feedback instead of
 * the whole vitest gate — reads `EXECUTION_LIMITS.maxStdinBytes` to tell an
 * author their case input is too big. It died on startup with "this module
 * cannot be imported from a Client Component module", so the check that keeps
 * an oversized case out of the curriculum was silently not running.
 *
 * So the constants live here, in a module with **no imports at all**: nothing to
 * pull into a bundle, nothing to leak, and nothing that can grow a dependency
 * without somebody noticing they added the first `import` line to a file whose
 * whole point is not having one.
 *
 * They are enforced by `schools/exec/limits.ts` — the numbers living somewhere
 * without an enforcer was the original defect, not the numbers — and
 * `schools/exec/provider.ts` re-exports them so no existing importer changed.
 *
 * ## The duplicate that is deliberate
 *
 * `LOCAL_LIMITS` in `schools/execution/trust.ts` repeats three of these values
 * for the browser, and its own comment explains why they must agree exactly: a
 * program truncated locally must be truncated identically on submit. Now that
 * this module is importable from anywhere, that duplication COULD be collapsed
 * — and it is deliberately not, here, because `LOCAL_LIMITS` is part of the
 * trust boundary's vocabulary and changing the engine is not a licence to
 * rewrite it. Worth doing, deliberately, by whoever owns that boundary.
 */
export const EXECUTION_LIMITS = {
  /** Generous for a beginner's program, tight enough to catch a runaway loop. */
  timeLimitMs: 5_000,
  memoryLimitMb: 256,
  /** Beyond this the output is not a result, it is a print statement in a loop. */
  maxOutputBytes: 64 * 1024,
  /**
   * 64 KiB of source — roughly 1,600 lines of ordinary C++ at 40 bytes a line,
   * or 800 if it is commented in Kazakh at two bytes a character.
   *
   * Grade 9 does not write 1,600 lines. The longest reference solution in the
   * approved programme is under 20, and the longest thing a learner plausibly
   * pastes is a whole worked file from a lesson — a few hundred bytes. So this
   * sits about two orders of magnitude above anything legitimate: a learner
   * cannot reach it by working, and it cannot be used to push megabytes through
   * a judge sized for eighteen simultaneous presses of Check.
   *
   * Kept at the value it already had. It was never wrong — it was never
   * enforced, and it was compared against `String.length` in the one place it
   * was checked at all.
   */
  maxSourceBytes: 64 * 1024,
  /**
   * 16 KiB of stdin, and it had no limit at all before.
   *
   * It used to say here that "the largest input any case in the curriculum
   * declares is eight characters («1000 100»)", which stopped being true the
   * moment May's complexity guards landed. It is now about 16 000 — those cases
   * are deliberately at the ceiling — and the second-largest is 670 bytes
   * (m9.c2.p5's 25×25 map). The limit still comfortably covers a learner on
   * manual Run pasting a few hundred lines to test a loop that reads until EOF,
   * and still refuses a payload designed to make a subprocess sit on a full pipe.
   *
   * A quarter of the source limit on purpose: a learner types stdin, they do
   * not paste a program into it, so the honest ceiling is lower.
   *
   * ## What this number costs the curriculum, measured
   *
   * At two bytes per value it caps a case at roughly 8 190 numbers, which caps
   * the work a naive solution can be made to do at about 3e7 operations. That
   * is enough to defeat an O(n²) solution inside the 5 s cpu budget — May's two
   * new guards run the reference in 0.1 s and the naive in 8-12 s — and it is
   * NOT enough to defeat an O(n·q) one: at the largest legal input `m9.c4.p3`'s
   * quadratic solution finishes in 2.9 s and `m9.c1.p4`'s in 4.5 s, both inside
   * the budget. So those two tasks cannot test the bound their own prompts
   * state, and raising this number is the only thing that would let them.
   *
   * That is a decision about the judge rather than about content, which is why
   * it is written down here rather than acted on: a bigger ceiling is a bigger
   * payload through a rented service for every learner, and the case for it
   * should be made deliberately.
   *
   * `runCases` appends a newline, so a case's `input` literal may be at most
   * 16 383 bytes.
   */
  maxStdinBytes: 16 * 1024,
} as const;
