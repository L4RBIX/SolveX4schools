/**
 * The learner runtime policy.
 *
 * One file that answers three questions nobody should have to answer twice:
 * which Python a learner's code runs on, what that Python is allowed to import,
 * and what a request to widen that would have to survive.
 *
 * ## Why this is a module and not a paragraph in a document
 *
 * A version number written in a runbook, a Dockerfile, a provider and a test is
 * four numbers that agree until the day one of them is edited. The evidence this
 * product records about children is only reproducible if the interpreter that
 * produced it is knowable, so the version is declared HERE, once, and everything
 * else — `schools/config.ts`, the Piston provider, both infrastructure documents
 * — reads it from here or names this file.
 *
 * ## What this module does NOT do
 *
 * It does not enforce anything at execution time. There is no static analysis of
 * learner code, no import allowlist checked before a run, and there should not
 * be: a beginner who types `import nunpy` deserves Python's own error message,
 * not ours.
 *
 * The library policy is enforced by ABSENCE. The judge has no network and the
 * only package installed on it is the pinned CPython below, so `import numpy`
 * fails with `ModuleNotFoundError` because numpy is not there — which is a real
 * mechanism, unlike a list of forbidden names that something has to remember to
 * check. This module records the policy so the absence is deliberate rather than
 * accidental, and so that "can we add pandas?" has a written answer.
 *
 * No `server-only` import: this is policy data with no secrets in it, and it is
 * read by the server config, by tests and — potentially — by a script. Marking
 * it server-only would buy nothing and cost the test runner an alias.
 */

/* -------------------------------------------------------------------------- */
/* The interpreter                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The pinned learner runtime. **The single source of truth.**
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
 * This distinction is asserted in `tests/school/python-policy.test.ts`, and the
 * wire format is asserted separately in `tests/exec/piston-conformance.test.ts`.
 *
 * ## UNVERIFIED
 *
 * No real Piston has ever been reached from this repository. That `3.12.0` is a
 * package this deployment's Piston can install is a claim only a live
 * `GET /api/v2/packages` can settle — see `docs/infrastructure/JUDGE_DEPLOYMENT.md`,
 * which makes that call step one and tells the operator what to do if the answer
 * is no.
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
/* The library policy                                                         */
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
/* The gate a package request has to pass                                     */
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
