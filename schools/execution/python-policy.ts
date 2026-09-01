/**
 * ██ BACKUP PATH — NOT THE PRODUCT. Production ships C++17 only. ██
 *
 * The Python execution policy, retained as a BACKUP and read by NOTHING in the
 * active learner product. For production this file is superseded, in full, by
 * `schools/execution/cpp-runtime.ts`.
 *
 * ## Status, as of 2026-09-01 (branch `cpp17-migration`, after e9f8983)
 *
 * The course is C++17. All 249 reference solutions are C++17 and stay that way;
 * the Python-era curriculum is not coming back. The owner's standing rule is
 * that production ships C++17 ONLY and that the Python source stays in the
 * repository as a backup — so this module is made INERT rather than deleted.
 *
 * Concretely, and verifiable with one grep:
 *
 *   - `schools/config.ts` carries `exec.cpp` from `cpp-runtime.ts`. There is no
 *     `exec.python` key and no `EXEC_PYTHON_VERSION` environment variable.
 *   - `schools/exec/providers/piston.ts` puts `CPP_RUNTIME.pistonLanguage`,
 *     `.wireVersion` and `.sourceFileName` on the wire. Nothing under
 *     `schools/exec/**` imports this file.
 *   - `ExecutionRequest.language` is the one-member union `"cpp17"`, so there is
 *     no way to ask any provider for Python even by mistake.
 *   - The only importers of this module are two tests
 *     (`tests/school/python-policy.test.ts`, `tests/school/python-version-skew.test.ts`)
 *     and the internal `/dev/execution` lab, which labels it as the backup and
 *     never describes the live judge with it. `/dev` returns `notFound()` in
 *     production — see `src/app/dev/layout.tsx`.
 *
 * ## What "backup" means here, precisely
 *
 * It means the decisions below are preserved so that reviving Python would be a
 * deliberate act with its reasoning intact, rather than a rediscovery. It does
 * NOT mean this is a second live configuration. There is exactly one
 * authoritative runtime policy for the active product and it is
 * `cpp-runtime.ts`; if anything in this file ever disagrees with that one, this
 * file is the stale one by definition.
 *
 * Do not wire anything to these exports. Adding a production importer is not a
 * refactor — it is a reversal of the product direction, and it belongs in a
 * commit that says so.
 *
 * ---------------------------------------------------------------------------
 *
 * What follows is the module as it stood while Python WAS the product. The
 * reasoning is kept verbatim below because it is the part worth preserving; the
 * only edits are the ones that would otherwise leave a false claim on the page.
 *
 * One file that answered three questions nobody should have to answer twice:
 * which Python a learner's code ran on, what that Python was allowed to import,
 * and what a request to widen that would have had to survive.
 *
 * ## Why this is a module and not a paragraph in a document
 *
 * A version number written in a runbook, a Dockerfile, a provider and a test is
 * four numbers that agree until the day one of them is edited. The evidence this
 * product records about children is only reproducible if the interpreter that
 * produced it is knowable, so the version was declared HERE, once, and
 * everything else read it from here or named this file. `cpp-runtime.ts` now
 * holds that role for the compiler, and holds it alone.
 *
 * ## What this module does NOT do
 *
 * It does not enforce anything at execution time — it never did. There is no
 * static analysis of learner code, no import allowlist checked before a run, and
 * there should not be: a beginner who types `import nunpy` deserves Python's own
 * error message, not ours.
 *
 * The library policy was enforced by ABSENCE. A judge with no network and one
 * installed package fails `import numpy` with `ModuleNotFoundError` because
 * numpy is not there — a real mechanism, unlike a list of forbidden names that
 * something has to remember to check. This module recorded the policy so the
 * absence was deliberate rather than accidental, and so that "can we add
 * pandas?" had a written answer. `cpp-runtime.ts` carries the same argument for
 * headers, which is the version of it that is live.
 *
 * No `server-only` import: this is policy data with no secrets in it, and
 * marking it server-only would buy nothing and cost the test runner an alias.
 */

/* -------------------------------------------------------------------------- */
/* The interpreter                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The pinned learner runtime, as the BACKUP path records it.
 *
 * **Not the single source of truth any more.** It was, while Python was the
 * product. The live pin is `CPP_RUNTIME` in `schools/execution/cpp-runtime.ts`,
 * and that is the one the Piston provider actually reads.
 *
 * ## Why two version fields, and why that is not a duplication
 *
 * `version` is what gets INSTALLED on the judge — an exact triple, sent to
 * Piston's `POST /api/v2/packages`. That is the pin, and it is exact because
 * reproducibility is the whole point: an attestation that says a program passed
 * says nothing useful if the interpreter underneath it drifted between March and
 * April.
 *
 * `wireVersion` is what goes on the EXECUTE request, and it is a range on
 * purpose. Piston resolves it against the packages the host actually has, and
 * because we install exactly one Python, the range can only resolve to the pin.
 * Sending the exact triple instead would mean that the day someone rebuilds the
 * judge on 3.12.1 — a patch release, no behaviour a Grade 9 program can observe
 * — every request 400s and an entire class goes unmeasured. The range is safe
 * *because* the install is pinned; it would be reckless on a judge with three
 * Pythons on it.
 *
 * The internal consistency of the two fields is still asserted in
 * `tests/school/python-policy.test.ts`, which is a test of a backup module and
 * says so. `tests/exec/piston-conformance.test.ts` no longer corroborates it
 * from the other end: that test asserts the C++ wire format, because that is
 * what the provider sends.
 *
 * ## UNVERIFIED, and now permanently so
 *
 * No real Piston was ever reached from this repository with these values, and
 * none ever will be while the product ships C++17. That `3.12.0` is a package
 * some Piston could install is an open question that nothing is going to close,
 * because nothing sends it. It is recorded, not pending.
 */
export const PYTHON_RUNTIME = {
  /** Piston's package name. Not `python3` — that is our own port's language id. */
  pistonLanguage: "python",
  /** THE PIN. Installed on the judge, exactly. */
  version: "3.12.0",
  /** What the execute request asks for. A range over a single installed pin. */
  wireVersion: "3.*",
} as const;

/**
 * Convenience alias for the one number people quote in writing.
 *
 * Documents and commit messages say "3.12.0"; code should say this. If they ever
 * disagree, the code is right and the document is stale.
 */
export const PINNED_PYTHON_VERSION = PYTHON_RUNTIME.version;

/* -------------------------------------------------------------------------- */
/* The library policy — BACKUP. The live one is the header policy in           */
/* cpp-runtime.ts. Everything below describes the Python-era curriculum, which  */
/* is not coming back; it is kept for its reasoning, not for its facts.         */
/* -------------------------------------------------------------------------- */

/**
 * September, and year one until something changes this: **standard library
 * only.**
 *
 * Three reasons, in the order they matter.
 *
 * 1. **Curriculum.** September teaches `input`, `int`, `//`, `%`, comparison and
 *    `if`/`elif`/`else`. A third-party package cannot help with any of that, and
 *    a learner who reaches for one has been taught to skip the thing being
 *    assessed.
 * 2. **Reproducibility.** Every added package is a second version to pin, a
 *    second thing to reinstall when the judge is rebuilt, and a second way for
 *    two learners to get different answers to the same program.
 * 3. **Attack surface.** Piston runs arbitrary code from fourteen-year-olds. The
 *    smallest possible image is the one with the least in it to abuse.
 */
export const THIRD_PARTY_PACKAGES_ALLOWED = false;

/**
 * Standard-library modules a later month may legitimately reach for.
 *
 * Anticipated, not permitted-by-this-list — every one of these is in CPython
 * already and needs no installation, no pin and no decision. The list exists so
 * that "we might need `heapq` in February" is a known quantity rather than a
 * surprise, and so that a package request for something these already cover
 * (`sortedcontainers`, `numpy` for arithmetic) can be answered by pointing at
 * the row.
 *
 * The month attached to each is where the programme's own syllabus first makes
 * it plausible — a note about the curriculum, not a gate. Nothing reads it to
 * decide anything.
 */
export const ANTICIPATED_STDLIB = [
  { module: "math", fromMonth: 4, why: "gcd, isqrt, factorial — number theory work" },
  { module: "collections", fromMonth: 5, why: "Counter and deque for frequency and BFS" },
  { module: "itertools", fromMonth: 6, why: "permutations and combinations in brute force" },
  { module: "functools", fromMonth: 7, why: "lru_cache, once memoisation is taught" },
  { module: "bisect", fromMonth: 8, why: "binary search over a sorted list" },
  { module: "heapq", fromMonth: 8, why: "priority queues for Dijkstra-shaped problems" },
  { module: "string", fromMonth: 2, why: "ascii_lowercase in character work" },
] as const;

export type AnticipatedStdlibModule = (typeof ANTICIPATED_STDLIB)[number]["module"];

/**
 * What September actually needs: **none of them.**
 *
 * Not "few" — none. Every one of September's 54 tasks is `input`, `int`,
 * arithmetic, comparison, `print`. A September task that imports anything is
 * either off-syllabus or a learner working ahead, and neither is a reason to
 * change the runtime.
 *
 * This is a fact about the curriculum, not a restriction on the interpreter: the
 * whole stdlib is present because it ships with CPython, and a curious learner
 * who types `import math` gets math. What is asserted here is that the programme
 * does not require it, which is what makes "stdlib only" cost September nothing.
 */
export const SEPTEMBER_STDLIB_REQUIRED: readonly string[] = [];

/** Is this module one the programme has already anticipated needing? */
export function isAnticipatedStdlib(moduleName: string): boolean {
  return ANTICIPATED_STDLIB.some((m) => m.module === moduleName);
}

/* -------------------------------------------------------------------------- */
/* The gate a package request has to pass — BACKUP. `LIBRARY_REQUEST_GATES`    */
/* and `reviewLibraryRequest` in cpp-runtime.ts are the live equivalents; a     */
/* real request about the shipping product goes through those, not these.       */
/* -------------------------------------------------------------------------- */

/**
 * The four questions.
 *
 * Written as data rather than prose because a checklist nothing evaluates is a
 * checklist people skip. `reviewPackageRequest` below actually runs it, and the
 * refusal it produces names the unmet gates — so a request can be declined with
 * a reason rather than with a mood.
 *
 * All four are required. There is no scoring and no majority: a package with an
 * excellent curriculum case and no version pin is still refused, because the pin
 * is what makes next year's evidence comparable to this year's.
 */
export const PACKAGE_REQUEST_GATES = [
  {
    id: "curriculum_need",
    question:
      "Does a task the programme actually declares require this, and can it not " +
      "be written with the standard library?",
    kk: "Бағдарламадағы нақты тапсырма мұны талап ете ме?",
    ru: "Требует ли этого конкретное задание программы?",
  },
  {
    id: "security_review",
    question:
      "Has someone read what this package can do inside a sandbox that runs " +
      "code written by children — filesystem, subprocess, network, native code?",
    kk: "Қауіпсіздік тексерісінен өтті ме?",
    ru: "Проведён ли разбор безопасности?",
  },
  {
    id: "runtime_reproducibility",
    question:
      "Does the judge still rebuild from scratch to a byte-identical runtime " +
      "with this installed, with no network access at run time?",
    kk: "Судья дәл сол күйінде қайта құрастырыла ма?",
    ru: "Собирается ли судья заново в том же самом виде?",
  },
  {
    id: "version_pinned",
    question:
      "Is an exact version recorded here, beside the interpreter pin, rather " +
      "than a range resolved at install time?",
    kk: "Нақты нұсқасы жазылды ма?",
    ru: "Зафиксирована ли точная версия?",
  },
] as const;

export type PackageRequestGateId = (typeof PACKAGE_REQUEST_GATES)[number]["id"];

export interface PackageRequest {
  /** The distribution name, as pip would spell it. */
  packageName: string;
  /** Which gates the requester claims to have satisfied. */
  satisfied: Partial<Record<PackageRequestGateId, boolean>>;
}

export type PackageRequestOutcome =
  | { approved: true; packageName: string }
  | {
      approved: false;
      packageName: string;
      /** Gates not answered, or answered no. Empty only when `blanketPolicy` refused. */
      unmet: PackageRequestGateId[];
      /** True when the standing year-one policy refused before any gate was read. */
      blanketPolicy: boolean;
      reason: string;
    };

/**
 * Evaluate a request. Refuses by default, and says why.
 *
 * The blanket policy is checked FIRST and short-circuits, because in year one
 * the answer is no regardless of how good the paperwork is — and a function that
 * quietly approved a well-argued request would make `THIRD_PARTY_PACKAGES_ALLOWED`
 * decorative. When the programme decides to allow packages, that constant flips
 * and the four gates become the real decision.
 *
 * Note that this returns a verdict; it does not install anything and nothing
 * downstream consumes it. It is here so the policy is executable and testable,
 * and so a future admin surface has one place to call.
 */
export function reviewPackageRequest(request: PackageRequest): PackageRequestOutcome {
  const unmet = PACKAGE_REQUEST_GATES.filter((g) => request.satisfied[g.id] !== true).map(
    (g) => g.id,
  );

  if (!THIRD_PARTY_PACKAGES_ALLOWED) {
    return {
      approved: false,
      packageName: request.packageName,
      unmet,
      blanketPolicy: true,
      reason:
        `Year one is standard library only, so ${request.packageName} is refused ` +
        "regardless of the four gates. Changing this is a programme decision, not " +
        "a deployment one: flip THIRD_PARTY_PACKAGES_ALLOWED in " +
        "schools/execution/python-policy.ts, pin the version beside the " +
        "interpreter, and rebuild the judge.",
    };
  }

  if (unmet.length > 0) {
    return {
      approved: false,
      packageName: request.packageName,
      unmet,
      blanketPolicy: false,
      reason:
        `${request.packageName} does not yet pass: ${unmet.join(", ")}. All four ` +
        "gates are required — there is no partial credit, because the one most " +
        "often skipped (version_pinned) is the one that makes next year's " +
        "evidence comparable to this year's.",
    };
  }

  return { approved: true, packageName: request.packageName };
}
