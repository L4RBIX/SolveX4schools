import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";

/**
 * The two halves of hybrid execution do not run the same Python, and this test
 * exists so that nobody discovers it by accident.
 *
 * ## The fact
 *
 * `pyodide@314.0.6` ships **CPython 3.14.2**. `PYTHON_RUNTIME.version` — what
 * the server judge is pinned to — is **3.12.0**. Two minor versions apart.
 *
 * ## Why it is not simply a bug to be fixed here
 *
 * There is no Piston instance yet (see `docs/releases/SEPTEMBER_PILOT_RC1.md`
 * §4), so the server pin describes an intention rather than a running service.
 * Downgrading Pyodide to `0.27.7` would match it exactly — that line ships
 * CPython 3.12.7 — at the cost of dropping 87 releases of a WebAssembly runtime
 * that executes untrusted code. Choosing that trade before the judge it is
 * matching actually exists is guessing, and guessing is how a project ends up
 * pinned to an old runtime for a reason nobody can reconstruct later.
 *
 * So the skew stands, deliberately, and this test is the alarm on it.
 *
 * ## What actually breaks, and what does not
 *
 * September is `input()`, `int()`, `//`, `%`, f-strings and loops. The language
 * semantics are identical across 3.12 and 3.14 for every one of them, and the
 * parity fixtures cover that.
 *
 * What differs is **error message wording**. CPython has rewritten diagnostics
 * substantially across 3.13 and 3.14 — "did you mean" suggestions, better
 * pointers into the offending line. A learner reading a traceback locally can
 * therefore see a materially more helpful message than the judge produces for
 * the same mistake, and Nova, which now sees the learner's stderr, is reading
 * whichever one the learner got. That is a real product consequence and it is
 * documented in `docs/infrastructure/HYBRID_EXECUTION.md` rather than hidden.
 *
 * ## What this test enforces
 *
 * That both versions stay WRITTEN DOWN, and that changing either one is a
 * deliberate act. If someone bumps Pyodide or re-pins the judge, this fails and
 * they have to come here and decide, rather than silently widening or closing a
 * gap nobody is tracking.
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

describe("the local and server interpreters, both written down", () => {
  it("records the version the browser actually runs", () => {
    /* Read from the dependency rather than from a constant we maintain: a
       number we type by hand is a number that goes stale the first time
       somebody runs `npm update` and does not think about this file. */
    expect(pyodideCPython()).toBe("3.14.2");
  });

  it("records the version the judge is pinned to", () => {
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
      "the Python skew changed — update docs/infrastructure/HYBRID_EXECUTION.md and decide " +
        "deliberately whether to close it (pyodide@0.27.7 ships CPython 3.12.7)",
    ).toEqual({ local: "3.14", server: "3.12" });
  });

  it("keeps the runtime a build-time decision, not an operator's", () => {
    /* Both halves must stay un-settable from the environment. An operator who
       can change the Python version from a dashboard can make two months of a
       child's evidence incomparable without anyone being able to say when it
       happened. The server side already argues this in `python-policy.ts`; the
       local side inherits it by being a `package.json` dependency, which is a
       commit and a rebuild. */
    const policy = readFileSync(path.join(ROOT, "schools/execution/python-policy.ts"), "utf8");
    const declaration = policy.slice(
      policy.indexOf("export const PYTHON_RUNTIME"),
      policy.indexOf("export const PINNED_PYTHON_VERSION"),
    );
    expect(declaration).not.toContain("process.env");
    expect(declaration).not.toContain("env(");
  });
});
