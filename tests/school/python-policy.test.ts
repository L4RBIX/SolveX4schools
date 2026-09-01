import { describe, expect, it } from "vitest";
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
} from "../../schools/execution/python-policy";

/**
 * The runtime policy, asserted.
 *
 * A policy nothing checks is a comment, and a version number nothing checks is
 * a version number that will be edited in one of the four places it appears.
 *
 * ## What these tests can and cannot establish
 *
 * They establish that the pin has ONE home and that the provider reads it from
 * there. They establish nothing whatsoever about whether a real Piston can
 * install `3.12.0` — no instance has ever been reached from this repository, and
 * that claim can only be closed by a live `GET /api/v2/packages`. See
 * `docs/infrastructure/JUDGE_DEPLOYMENT.md`, which makes that call step one.
 */

describe("the pinned interpreter has one source of truth", () => {
  it("pins an exact triple for installation", () => {
    /* Exact, not a range. This is what goes to `POST /api/v2/packages`, and it
       is the entire reproducibility claim: evidence recorded in March is only
       comparable to evidence recorded in April if the interpreter underneath
       both is knowable. */
    expect(PYTHON_RUNTIME.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(PINNED_PYTHON_VERSION).toBe(PYTHON_RUNTIME.version);
  });

  it("asks the judge for a RANGE, which the pin makes safe", () => {
    /* The wire version is deliberately loose while the install is exact. Piston
       resolves it against the packages the host has, and the host has exactly
       one Python, so it can only resolve to the pin — while a patch-level
       rebuild of the judge stays a rebuild rather than an outage.
       `tests/exec/piston-conformance.test.ts` asserts the same literal from the
       other end, against a protocol-faithful fake. */
    expect(PYTHON_RUNTIME.wireVersion).toBe("3.*");
    expect(PYTHON_RUNTIME.wireVersion).not.toBe(PYTHON_RUNTIME.version);
    // The range must actually cover the pin, or the two decisions have drifted.
    expect(PYTHON_RUNTIME.version.startsWith("3.")).toBe(true);
  });

  it("uses Piston's package name, not our port's language id", () => {
    /* `ExecutionRequest.language` is `python3` — our own port's vocabulary.
       Piston's package is called `python`. Sending the wrong one is a 400 on
       every request and a whole class unmeasured, so they are distinguished
       here rather than assumed identical. */
    expect(PYTHON_RUNTIME.pistonLanguage).toBe("python");
  });

  it("is the value the Piston provider actually puts on the wire", async () => {
    /* The point of the constant. Read from the provider's source rather than
       from a second copy of the literal, so this fails if someone re-hardcodes
       the version there. */
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../../schools/exec/providers/piston.ts", import.meta.url), "utf8"),
    );
    expect(src).toContain("PYTHON_RUNTIME.wireVersion");
    expect(src).toContain("PYTHON_RUNTIME.pistonLanguage");
    // And no stray literal left behind beside it.
    expect(src).not.toMatch(/version:\s*"3\.\*"/);
  });

  it("stays a build-time decision rather than an environment variable", async () => {
    /* Deliberately not `env()`. An operator who can change the interpreter
       version from a dashboard can make two months of a child's evidence
       incomparable with no commit and no trace.

       This used to read `config.exec.python.version`. That key is gone: the
       course is C++17 now and `schools/config.ts` carries `exec.cpp` instead,
       from `schools/execution/cpp-runtime.ts`. The pin itself is still asserted
       here, straight from the policy module — but nothing in the product reads
       it any more, which is the point this whole FILE is now making. See the
       header note above about retirement. */
    expect(PINNED_PYTHON_VERSION).toBe("3.12.0");

    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../../schools/config.ts", import.meta.url), "utf8"),
    );
    expect(src).not.toContain("EXEC_PYTHON_VERSION");
  });
});

describe("the library policy", () => {
  it("forbids third-party packages in year one", () => {
    expect(THIRD_PARTY_PACKAGES_ALLOWED).toBe(false);
  });

  it("needs none of the standard library for September", () => {
    /* Not "few" — none. Every September task is input, int, arithmetic,
       comparison and print, which is what makes "stdlib only" cost the month
       nothing at all. */
    expect(SEPTEMBER_STDLIB_REQUIRED).toHaveLength(0);
  });

  it("anticipates the modules later months will reach for", () => {
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
