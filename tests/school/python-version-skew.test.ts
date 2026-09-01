import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";

/**
 * ██ THIS NOW GUARDS A BACKUP. Production ships C++17 only. ██
 *
 * The two halves of the PYTHON path do not run the same Python, and this test
 * exists so that nobody discovers it by accident. Neither half is in the
 * shipping product any more: a learner presses Run and clang compiles C++17 in
 * the tab (`src/lib/cpp17`), presses Submit and a C++ judge compiles the same
 * source (`schools/exec/providers/*`, reading `schools/execution/cpp-runtime.ts`).
 * Python is retained as a backup — see the header of
 * `schools/execution/python-policy.ts` — and this file is the alarm on the
 * backup's coherence, not on a live divergence.
 *
 * ## Why it is kept rather than deleted with the rest of the Python era
 *
 * Because both numbers are still REAL and still MOVABLE. `pyodide` is still a
 * dependency in `package.json`, `src/lib/pyodide/**` is still compiled by
 * `tsc`, and `PYTHON_RUNTIME.version` is still an exported constant. A backup
 * whose two halves silently drift apart is not a backup — it is a module that
 * will look revivable and will not be. This test is what makes reviving Python
 * start from a known state rather than from an archaeology exercise.
 *
 * ## The fact
 *
 * `pyodide@314.0.6` ships **CPython 3.14.2**. `PYTHON_RUNTIME.version` — what
 * the backup's server half is pinned to — is **3.12.0**. Two minor versions
 * apart.
 *
 * ## Why the gap was never closed
 *
 * There was never a Piston instance running Python (see
 * `docs/releases/SEPTEMBER_PILOT_RC1.md` §4), so the server pin described an
 * intention rather than a running service. Downgrading Pyodide to `0.27.7`
 * would match it exactly — that line ships CPython 3.12.7 — at the cost of
 * dropping 87 releases of a WebAssembly runtime that executes untrusted code.
 * Choosing that trade for a judge that did not exist would have been guessing,
 * and guessing is how a project ends up pinned to an old runtime for a reason
 * nobody can reconstruct later. The trade is now moot rather than resolved.
 *
 * ## What used to break, and no longer can
 *
 * CPython rewrote its diagnostics substantially across 3.13 and 3.14 — "did you
 * mean" suggestions, better pointers into the offending line — so a learner
 * reading a traceback locally could see a materially more helpful message than
 * the judge produced for the same mistake, and Nova, which sees the learner's
 * stderr, would be reading whichever one they got. That WAS a live product
 * consequence and is written up in `docs/infrastructure/HYBRID_EXECUTION.md`.
 * It is not one today: no learner-facing path runs either interpreter. The
 * live equivalent of that risk is the clang/GCC standard question, which
 * `schools/execution/cpp-runtime.ts` records and the judge canary probes.
 *
 * ## What this test enforces
 *
 * That both versions stay WRITTEN DOWN, and that changing either one is a
 * deliberate act. If someone bumps Pyodide or re-pins the backup judge, this
 * fails and they have to come here and decide, rather than silently widening or
 * closing a gap nobody is tracking. It asserts nothing about what any learner
 * runs.
 */

const ROOT = process.cwd();

/** What the installed Pyodide actually provides, read from its own lock file. */
function pyodideCPython(): string {
  const lock = JSON.parse(
    readFileSync(path.join(ROOT, "node_modules", "pyodide", "pyodide-lock.json"), "utf8"),
  ) as { info?: { python?: string } };
  const version = lock.info?.python;
  expect(version, "pyodide-lock.json must declare the CPython it ships").toBeTruthy();
  return version!;
}

const minor = (v: string) => v.split(".").slice(0, 2).join(".");

describe("the backup path's two interpreters, both written down", () => {
  it("records the version the browser would run", () => {
    /* Read from the dependency rather than from a constant we maintain: a
       number we type by hand is a number that goes stale the first time
       somebody runs `npm update` and does not think about this file.

       "would" rather than "does": nothing a learner touches boots Pyodide any
       more. `src/lib/pyodide/**` has no importer outside tests and the internal
       `/dev/execution` lab, and `scripts/strip-python-assets.mjs` deletes the
       13 MB runtime from `public/` before a production build. The dependency is
       still installed, which is what keeps this number real. */
    expect(pyodideCPython()).toBe("3.14.2");
  });

  it("records the version the backup judge is pinned to", () => {
    expect(PYTHON_RUNTIME.version).toBe("3.12.0");
  });

  it("fails loudly if the gap changes in either direction", () => {
    const local = minor(pyodideCPython());
    const server = minor(PYTHON_RUNTIME.version);

    /* Deliberately asserting the KNOWN skew, not asserting that there is none.
       A test demanding equality would fail today and be skipped by whoever hit
       it next, which is how a guard becomes decoration. This one passes while
       the situation is the understood one and fails the moment it is not —
       including when someone FIXES it, at which point they should come here,
       delete this, and write the equality assertion instead. */
    expect(
      { local, server },
      "the BACKUP path's Python skew changed. Nothing a learner uses is affected — " +
        "production ships C++17 only — but the backup's two halves have moved apart or " +
        "together, so record which and why in docs/infrastructure/HYBRID_EXECUTION.md " +
        "(pyodide@0.27.7 ships CPython 3.12.7)",
    ).toEqual({ local: "3.14", server: "3.12" });
  });

  it("keeps the runtime a build-time decision, not an operator's", () => {
    /* Both halves must stay un-settable from the environment. An operator who
       can change the Python version from a dashboard can make two months of a
       child's evidence incomparable without anyone being able to say when it
       happened. The server side already argues this in `python-policy.ts`; the
       local side inherits it by being a `package.json` dependency, which is a
       commit and a rebuild.

       Still worth holding on a backup: a module whose pin could be moved from a
       dashboard is not a record of a decision, it is a surface. The live
       version of this property is asserted against `CPP_RUNTIME` instead. */
    const policy = readFileSync(path.join(ROOT, "schools/execution/python-policy.ts"), "utf8");
    const declaration = policy.slice(
      policy.indexOf("export const PYTHON_RUNTIME"),
      policy.indexOf("export const PINNED_PYTHON_VERSION"),
    );
    expect(declaration).not.toContain("process.env");
    expect(declaration).not.toContain("env(");
  });
});
