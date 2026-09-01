import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { CPP_RUNTIME } from "@schools/execution/cpp-runtime";
import { PistonExecutionProvider } from "@schools/exec/providers/piston";
import {
  ANTICIPATED_STDLIB,
  PACKAGE_REQUEST_GATES,
  PINNED_PYTHON_VERSION,
  PYTHON_RUNTIME,
  SEPTEMBER_STDLIB_REQUIRED,
  THIRD_PARTY_PACKAGES_ALLOWED,
  isAnticipatedStdlib,
  reviewPackageRequest,
  type PackageRequestGateId,
} from "@schools/execution/python-policy";

/**
 * The BACKUP runtime policy, asserted — and the boundary that keeps it backup.
 *
 * `schools/execution/python-policy.ts` is retained deliberately: production
 * ships C++17 only, the Python-era curriculum is not coming back, and the
 * Python source stays in the repository as a backup rather than being deleted.
 * That makes this file a test of a backup module, which is legitimate — an
 * inert module with no test is an inert module nobody can revive safely — but
 * it changes what the file is for.
 *
 * ## What these tests establish
 *
 * Two different things, and they are worth keeping apart.
 *
 * 1. **The backup module is internally consistent.** The pin is an exact
 *    triple, the wire version is a range that covers it, the package gates
 *    refuse by default and say why. That is preserved reasoning; a future
 *    reader deciding whether to revive Python gets a module that still holds
 *    together rather than one that rotted quietly.
 *
 * 2. **The backup cannot become the product by accident.** This is the part
 *    that guards the shipping system. It is asserted against the PROVIDER's
 *    actual behaviour and against the active module graph, not by grepping one
 *    file for a string that happens to be absent.
 *
 * ## What they do not establish
 *
 * Nothing whatsoever about whether a real Piston can install `3.12.0`. No
 * instance has ever been reached from this repository, and now none will be:
 * nothing sends these values. That question is recorded, not pending.
 */

/* -------------------------------------------------------------------------- */
/* The boundary: Python is backup, and the wire proves it                      */
/* -------------------------------------------------------------------------- */

/** Repo root. Vitest runs from it, the same way `python-version-skew` does. */
const ROOT = process.cwd();

/**
 * Every TypeScript file in the ACTIVE execution path.
 *
 * "Active" is meant narrowly and each entry earns its place: the server-side
 * providers and the port they implement (`schools/exec`), the config they read
 * (`schools/config.ts`), the runtime policy that is actually authoritative
 * (`schools/execution/cpp-runtime.ts`), and the browser compiler a learner
 * presses Run against (`src/lib/cpp17`). If any of those grew an import of the
 * backup module, Python would be back in the product's module graph — which is
 * the failure this guard exists to catch, and it is a graph property rather
 * than a spelling one.
 */
const ACTIVE_EXECUTION_PATHS = [
  "schools/exec",
  "schools/config.ts",
  "schools/execution/cpp-runtime.ts",
  "src/lib/cpp17",
];

function sourceFilesUnder(relative: string): string[] {
  const absolute = path.join(ROOT, relative);
  if (!statSync(absolute).isDirectory()) return [absolute];
  const found: string[] = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) found.push(...sourceFilesUnder(child));
    else if (/\.tsx?$/.test(entry.name)) found.push(path.join(ROOT, child));
  }
  return found;
}

describe("Python is the backup path, and the active judge cannot be sent it", () => {
  it("is not what the Piston provider puts on the wire — the judge is asked for C++", async () => {
    /* The assertion this file exists to make, and it is made against the
       provider's BEHAVIOUR rather than its source text. The previous version
       grepped `piston.ts` for the literal `PYTHON_RUNTIME.wireVersion`, which
       was the right test while Python was the product and became a dead string
       coupling the moment it was not: it failed because someone had correctly
       removed the thing it watched for.

       So the provider is actually run, with `fetch` stubbed, and the request
       body it produced is inspected. That fails if anyone re-wires the Python
       runtime here by any spelling — a literal, a re-import, an alias — and it
       cannot fail merely because a comment was reworded. */
    const sent: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      sent.push(String(init?.body ?? ""));
      return new Response(
        JSON.stringify({ run: { stdout: "1", stderr: "", code: 0, signal: null } }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof globalThis.fetch;

    try {
      await new PistonExecutionProvider("http://judge.invalid").run({
        language: "cpp17",
        sourceCode: "#include <iostream>\nint main(){ std::cout << 1; }\n",
        stdin: "",
        timeLimitMs: 1_000,
        memoryLimitMb: 64,
      });
    } finally {
      globalThis.fetch = realFetch;
    }

    expect(sent, "the provider must have called the judge exactly once").toHaveLength(1);
    const body = JSON.parse(sent[0]) as {
      language: string;
      version: string;
      files: { name: string; content: string }[];
    };

    // What it DOES send: the one authoritative runtime module.
    expect(body.language).toBe(CPP_RUNTIME.pistonLanguage);
    expect(body.version).toBe(CPP_RUNTIME.wireVersion);
    expect(body.files[0].name).toBe(CPP_RUNTIME.sourceFileName);

    /* What it must never send. Stated against the backup module's own values so
       that changing them cannot quietly make this pass — if someone re-pointed
       `PYTHON_RUNTIME.pistonLanguage` at `"c++"`, the first of these would fire
       rather than going green by coincidence. */
    expect(body.language).not.toBe(PYTHON_RUNTIME.pistonLanguage);
    expect(body.version).not.toBe(PYTHON_RUNTIME.wireVersion);
    expect(body.files[0].name.endsWith(".py")).toBe(false);
    expect(JSON.stringify(body)).not.toContain(PYTHON_RUNTIME.version);
  });

  it("is imported by nothing in the active execution path", () => {
    /* The other half of the same claim. The wire test proves the Piston
       provider is clean; this proves nobody else in the shipping path reaches
       for the backup either, including the judge0 provider and the browser
       compiler, neither of which the wire test touches.

       An import edge, not a mention: the docs and this test file are allowed to
       name the module, and do. */
    const files = ACTIVE_EXECUTION_PATHS.flatMap(sourceFilesUnder);
    /* A scan that found nothing would pass vacuously, which is exactly how this
       kind of guard dies — a directory gets renamed and the test keeps smiling. */
    expect(files.length, "the active-path scan found no files to check").toBeGreaterThan(10);

    const importers = files.filter((file) =>
      /^\s*import[\s\S]*?["'][^"']*python-policy["']/m.test(readFileSync(file, "utf8")),
    );
    expect(
      importers.map((f) => path.relative(ROOT, f)),
      "python-policy.ts is a BACKUP module. Importing it from the active execution path " +
        "puts Python back in the product's module graph — see the header of " +
        "schools/execution/python-policy.ts before changing this.",
    ).toEqual([]);
  });

  it("stays a build-time decision rather than an environment variable", async () => {
    /* Deliberately not `env()`, and still worth asserting on a backup: a module
       whose version could be changed from a dashboard is not a record of a
       decision, it is a surface. Reviving it should start from a constant.

       This used to read `config.exec.python.version`. That key is gone — the
       course is C++17 and `schools/config.ts` carries `exec.cpp` instead, from
       `schools/execution/cpp-runtime.ts`. */
    expect(PINNED_PYTHON_VERSION).toBe("3.12.0");

    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../../schools/config.ts", import.meta.url), "utf8"),
    );
    expect(src).not.toContain("EXEC_PYTHON_VERSION");
  });
});

/* -------------------------------------------------------------------------- */
/* Internal consistency of the backup module                                   */
/* -------------------------------------------------------------------------- */

describe("the backup pin is internally consistent", () => {
  it("pins an exact triple for installation", () => {
    /* Exact, not a range. This is what would go to `POST /api/v2/packages`, and
       it was the entire reproducibility claim: evidence recorded in March is
       only comparable to evidence recorded in April if the interpreter
       underneath both is knowable. The same argument now lives, live, in
       `CPP_RUNTIME`. */
    expect(PYTHON_RUNTIME.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(PINNED_PYTHON_VERSION).toBe(PYTHON_RUNTIME.version);
  });

  it("asks for a RANGE on the wire, which the pin makes safe", () => {
    /* The wire version is deliberately loose while the install is exact. Piston
       resolves it against the packages the host has, and the host would have
       exactly one Python, so it could only resolve to the pin — while a
       patch-level rebuild of the judge stays a rebuild rather than an outage.

       `tests/exec/piston-conformance.test.ts` no longer corroborates this from
       the other end: it asserts the C++ wire format, because that is what the
       provider sends. This assertion is now about the backup module alone. */
    expect(PYTHON_RUNTIME.wireVersion).toBe("3.*");
    expect(PYTHON_RUNTIME.wireVersion).not.toBe(PYTHON_RUNTIME.version);
    // The range must actually cover the pin, or the two decisions have drifted.
    expect(PYTHON_RUNTIME.version.startsWith("3.")).toBe(true);
  });

  it("uses Piston's package name, not our port's language id", () => {
    /* `ExecutionRequest.language` was `python3` — our own port's vocabulary.
       Piston's package is called `python`. Sending the wrong one would have
       been a 400 on every request and a whole class unmeasured, so they are
       distinguished here rather than assumed identical.

       The port's union is now the single member `"cpp17"`, which is the
       structural reason nothing can ask any provider for Python by mistake. */
    expect(PYTHON_RUNTIME.pistonLanguage).toBe("python");
  });
});

describe("the library policy", () => {
  it("forbids third-party packages in year one", () => {
    expect(THIRD_PARTY_PACKAGES_ALLOWED).toBe(false);
  });

  it("needs none of the standard library for September", () => {
    /* Not "few" — none. Every September task in the Python-era curriculum was
       input, int, arithmetic, comparison and print, which is what made "stdlib
       only" cost the month nothing at all. */
    expect(SEPTEMBER_STDLIB_REQUIRED).toHaveLength(0);
  });

  it("anticipates the modules later months would have reached for", () => {
    const modules = ANTICIPATED_STDLIB.map((m) => m.module);
    for (const expected of [
      "math",
      "collections",
      "itertools",
      "functools",
      "bisect",
      "heapq",
      "string",
    ]) {
      expect(modules).toContain(expected);
      expect(isAnticipatedStdlib(expected)).toBe(true);
    }
    // Every row carries a reason. A list without one is a list nobody can argue with.
    for (const m of ANTICIPATED_STDLIB) {
      expect(m.why.length).toBeGreaterThan(10);
      expect(m.fromMonth).toBeGreaterThanOrEqual(1);
    }
  });

  it("does not anticipate anything that needs installing", () => {
    /* Everything in the list ships with CPython. If a distribution name ever
       appears here, the list has quietly become an allowlist for packages and
       the four gates below have been bypassed. */
    for (const name of ["numpy", "pandas", "requests", "sortedcontainers"]) {
      expect(isAnticipatedStdlib(name)).toBe(false);
    }
  });
});

describe("the gate a package request has to pass", () => {
  const allGates = (): Record<PackageRequestGateId, boolean> => ({
    curriculum_need: true,
    security_review: true,
    runtime_reproducibility: true,
    version_pinned: true,
  });

  it("names four gates, each with a question and both languages", () => {
    expect(PACKAGE_REQUEST_GATES.map((g) => g.id)).toEqual([
      "curriculum_need",
      "security_review",
      "runtime_reproducibility",
      "version_pinned",
    ]);
    for (const g of PACKAGE_REQUEST_GATES) {
      expect(g.question.length).toBeGreaterThan(20);
      expect(g.kk.length).toBeGreaterThan(5);
      expect(g.ru.length).toBeGreaterThan(5);
    }
  });

  it("refuses a perfect request while the blanket policy stands", () => {
    /* The important one. A function that quietly approved a well-argued request
       would make `THIRD_PARTY_PACKAGES_ALLOWED` decorative — the standing
       policy has to win over the paperwork, or it is not a policy. */
    const outcome = reviewPackageRequest({ packageName: "numpy", satisfied: allGates() });
    expect(outcome.approved).toBe(false);
    if (outcome.approved) return;
    expect(outcome.blanketPolicy).toBe(true);
    expect(outcome.reason).toContain("standard library only");
    // And it says where the decision lives, so a refusal is actionable.
    expect(outcome.reason).toContain("python-policy.ts");
  });

  it("names the unmet gates even when the blanket policy is what refused", () => {
    /* So a requester gets the whole answer in one pass rather than fixing the
       paperwork, being refused again on policy, and learning nothing. */
    const outcome = reviewPackageRequest({
      packageName: "pandas",
      satisfied: { curriculum_need: true },
    });
    expect(outcome.approved).toBe(false);
    if (outcome.approved) return;
    expect(outcome.unmet).toEqual([
      "security_review",
      "runtime_reproducibility",
      "version_pinned",
    ]);
  });

  it("treats an unanswered gate as unmet, not as absent", () => {
    const outcome = reviewPackageRequest({ packageName: "x", satisfied: {} });
    expect(outcome.approved).toBe(false);
    if (outcome.approved) return;
    expect(outcome.unmet).toHaveLength(PACKAGE_REQUEST_GATES.length);
  });

  it("requires all four gates, with no partial credit", () => {
    /* Asserted through the reason string rather than by flipping the module
       constant: `version_pinned` is the gate most often skipped and the one that
       makes next year's evidence comparable to this year's, so "three out of
       four" must never be a pass. */
    const outcome = reviewPackageRequest({
      packageName: "x",
      satisfied: { ...allGates(), version_pinned: false },
    });
    expect(outcome.approved).toBe(false);
    if (outcome.approved) return;
    expect(outcome.unmet).toEqual(["version_pinned"]);
  });
});
