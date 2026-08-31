/**
 * The taught language, and every place a judge has to be told about it.
 *
 * One file that answers three questions nobody should have to answer twice:
 * which C++ a learner's code is compiled by, how each judge is asked for it,
 * and what a request to widen that would have to survive.
 *
 * ## Why this is a module and not a paragraph in a document
 *
 * A language id written in a runbook, a provider, a probe and a test is four
 * decisions that agree until the day one of them is edited. The evidence this
 * product records about children is only reproducible if the compiler that
 * produced it is knowable, so the rule is declared HERE, once, and everything
 * else — `schools/config.ts`, the Judge0 provider, the Piston provider, the ops
 * probe — reads it from here or names this file.
 *
 * ## The standard is a DEFAULT, and that is load-bearing rather than lucky
 *
 * Judge0 CE on this RapidAPI plan refuses `compiler_options` with **HTTP 403**.
 * There is therefore no way to ask the judge for `-std=c++17`: the only C++ the
 * product can submit is a compiler that already defaults to it. GCC has
 * defaulted to `gnu++17` since GCC 11, which is why `MIN_GNU_CXX17_MAJOR` below
 * is a hard floor and not a preference — a submission routed to GCC 9 would
 * compile as C++14 and reject the language the course teaches, in a way that
 * looks to a learner like their own program being wrong.
 *
 * Measured against the real service, not read off a catalogue name:
 *
 *     language_id 105  →  __cplusplus 201703,  -7/2 = -3,  -7%2 = -1
 *
 * with no `compiler_options` sent. See `docs/cpp17/CPP17_JUDGE_PARITY.md`.
 *
 * The browser half passes `-std=c++17` explicitly instead, because `clang -cc1`
 * defaults to C++14 there. That flag lives with the runtime that needs it, in
 * `src/lib/cpp17/worker.ts`; the two are the same standard reached two ways,
 * and the parity document is where the evidence that they agree is kept.
 *
 * ## What this module does NOT do
 *
 * It does not enforce anything at compile time. There is no static analysis of
 * learner code and no `#include` allowlist checked before a build, and there
 * should not be: a beginner who types `#include <iostrem>` deserves the
 * compiler's own diagnostic, not ours.
 *
 * The library policy is enforced by ABSENCE. The judge has no network and the
 * only toolchain on it is the pinned compiler and its standard library, so
 * `#include <boost/any.hpp>` fails because Boost is not there — a real
 * mechanism, unlike a list of forbidden names that something has to remember to
 * check.
 *
 * No `server-only` import: this is policy data with no secrets in it, and it is
 * read by the server config, by the probe and by tests. Marking it server-only
 * would buy nothing and cost the test runner an alias.
 */

/* -------------------------------------------------------------------------- */
/* The language                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The port's own name for the language, and the only value `ExecutionRequest`
 * accepts.
 *
 * Deliberately not a vendor's spelling. Judge0 says `C++ (GCC 14.1.0)`, Piston
 * says `c++`, a compiler says `-std=c++17`; this is what SolveX calls the thing
 * it teaches, and each provider translates at its own boundary.
 */
export const EXECUTION_LANGUAGE = "cpp17";

/** The standard, as a compiler flag, for the engines that must be told. */
export const CPP_STANDARD_FLAG = "-std=c++17";

/** What `__cplusplus` must report on any engine this product will submit to. */
export const CPP_STANDARD_MACRO = 201703;

/* -------------------------------------------------------------------------- */
/* Judge0                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `C++ (GCC 14.1.0)` and nothing else in that family.
 *
 * Anchored on purpose, and matching **GCC only**. The catalogue on this plan
 * also offers `C++ (Clang 7.0.1)`, which defaults to `gnu++14` and cannot be
 * told otherwise here — landing on it would silently downgrade the standard for
 * every learner. Clang is not worse than GCC; a Clang we cannot pass a flag to
 * is unusable for a C++17 course, which is a different statement and the one
 * this regex encodes.
 *
 * The captured group is the version, compared numerically by the provider.
 */
export const JUDGE0_CPP_NAME = /^C\+\+\s*\(GCC\s+(\d+(?:\.\d+)*)\)$/;

/**
 * The oldest GCC whose DEFAULT standard is `gnu++17`.
 *
 * GCC 11 is where the default moved from `gnu++14`. Everything below it would
 * need `-std=c++17` on the command line, and `compiler_options` is refused with
 * HTTP 403 on this plan — so an older GCC is not a slower option, it is not an
 * option. The catalogue this floor excludes, verbatim: `C++ (GCC 7.4.0)`,
 * `C++ (GCC 8.3.0)`, `C++ (GCC 9.2.0)`.
 *
 * A judge offering none at or above this floor is a `provider_error`, never a
 * fallback to the newest thing it has. Grading a child under a compiler that
 * rejects the syntax they were taught is worse than not grading them.
 */
export const MIN_GNU_CXX17_MAJOR = 11;

/**
 * The id this deployment's judge actually answered with, recorded for contrast.
 *
 * **Not used to submit anything.** Discovery asks the judge, for the reason it
 * always did: ids differ between Judge0 deployments and move when the hosted
 * catalogue is rebuilt, and a constant copied out of a blog post is how a
 * submission ends up on a compiler nobody chose. This constant exists so that a
 * probe can say "the judge named 105, which is what was measured" or "the judge
 * named something else, go and look" — an observation, not an assumption.
 *
 * Measured on `judge0-ce.p.rapidapi.com`, 2026-09-01: id 105, `C++ (GCC
 * 14.1.0)`, `__cplusplus` 201703 with no flag passed.
 */
export const MEASURED_JUDGE0_CPP_LANGUAGE_ID = 105;

/* -------------------------------------------------------------------------- */
/* Piston                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The self-hosted judge's pin.
 *
 * ## Why two version fields, and why that is not a duplication
 *
 * `version` is what gets INSTALLED — an exact triple, sent to Piston's
 * `POST /api/v2/packages`. That is the pin, and it is exact because
 * reproducibility is the whole point: an attestation that says a program passed
 * says nothing useful if the compiler underneath it drifted between March and
 * April.
 *
 * `wireVersion` is what goes on the EXECUTE request, and it is a range on
 * purpose. Piston resolves it against the packages the host actually has, and
 * because we install exactly one toolchain the range can only resolve to the
 * pin. Sending the exact triple instead would mean that the day someone
 * rebuilds the judge on a patch release every request 400s and an entire class
 * goes unmeasured.
 *
 * ## UNVERIFIED, and differently unverified from the Judge0 half
 *
 * No real Piston has ever been reached from this repository. Two claims here
 * can only be settled by a live `GET /api/v2/packages` and one submission:
 *
 * 1. that `10.2.0` is a `gcc` package this deployment's Piston can install; and
 * 2. **what standard its `c++` run script compiles with.** Piston's `gcc`
 *    package drives one toolchain for C, C++ and D from a shell script, and
 *    whether that script passes `-std=c++17` is a property of the package, not
 *    of GCC — GCC 10 itself defaults to `gnu++14`. Unlike Judge0, Piston does
 *    not refuse compiler options, so if the script does not pass the standard
 *    the fix is available; but it has to be CHECKED, because the failure mode
 *    is a month of C++17 syntax rejected on Submit and accepted on Run.
 *
 * `docs/infrastructure/JUDGE_DEPLOYMENT.md` makes the packages call step one.
 * Until someone runs it, `EXEC_PROVIDER=piston` is a supported configuration
 * with an open question against it, and that is said here rather than left for
 * whoever hits it during a lesson.
 */
export const CPP_RUNTIME = {
  /** Piston's language name. Not `cpp17` — that is our own port's vocabulary. */
  pistonLanguage: "c++",
  /** Piston's package is named for the toolchain, not the language. */
  pistonPackage: "gcc",
  /** THE PIN. Installed on the judge, exactly. */
  version: "10.2.0",
  /** What the execute request asks for. A range over a single installed pin. */
  wireVersion: "10.*",
  /** Piston takes named files; the extension is what selects the compiler. */
  sourceFileName: "main.cpp",
} as const;

/**
 * Convenience alias for the one number people quote in writing.
 *
 * Documents and commit messages say "10.2.0"; code should say this. If they
 * ever disagree, the code is right and the document is stale.
 */
export const PINNED_PISTON_GCC_VERSION = CPP_RUNTIME.version;

/* -------------------------------------------------------------------------- */
/* The header policy                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Year one, until something changes this: **the standard library only.**
 *
 * Three reasons, in the order they matter.
 *
 * 1. **Curriculum.** September teaches `cin`, `cout`, `int`, `/`, `%`,
 *    comparison and `if`/`else`. A third-party library cannot help with any of
 *    that, and a learner who reaches for one has been taught to skip the thing
 *    being assessed.
 * 2. **Reproducibility.** Every added library is a second version to pin, a
 *    second thing to reinstall when the judge is rebuilt, and a second way for
 *    two learners to get different answers to the same program.
 * 3. **Attack surface.** The judge compiles and runs arbitrary code written by
 *    fourteen-year-olds. The smallest possible image is the one with the least
 *    in it to abuse.
 */
export const THIRD_PARTY_LIBRARIES_ALLOWED = false;

/**
 * Standard headers a later month may legitimately reach for.
 *
 * Anticipated, not permitted-by-this-list — every one of these ships with the
 * standard library already and needs no installation, no pin and no decision.
 * The list exists so that "we might need `<queue>` in February" is a known
 * quantity rather than a surprise.
 *
 * The month attached to each is where the programme's own syllabus first makes
 * it plausible — a note about the curriculum, not a gate. Nothing reads it to
 * decide anything.
 *
 * ## The one that is not free
 *
 * `<bits/stdc++.h>` is deliberately absent from this list. It is a libstdc++
 * extension: GCC ships it and libc++ does not, so without intervention the same
 * file compiles on Submit and refuses to compile on Run. That asymmetry is
 * closed by putting the header into the browser sysroot
 * (`src/lib/cpp17/bits-stdcpp.ts`) rather than by pretending it is standard,
 * and it costs ~4 s to compile in the browser against ~0.9 s for targeted
 * includes. A contest convenience to meet later, not a starting habit.
 */
export const ANTICIPATED_HEADERS = [
  { header: "iostream", fromMonth: 1, why: "cin and cout — the month's entire surface" },
  { header: "string", fromMonth: 2, why: "text input, once a line is more than a number" },
  { header: "vector", fromMonth: 3, why: "the first container, when loops arrive" },
  { header: "algorithm", fromMonth: 4, why: "sort, min, max over a vector" },
  { header: "cmath", fromMonth: 4, why: "sqrt, round, abs — number theory work" },
  { header: "numeric", fromMonth: 5, why: "accumulate, gcd" },
  { header: "map", fromMonth: 5, why: "counting frequencies" },
  { header: "set", fromMonth: 6, why: "membership and ordered iteration" },
  { header: "queue", fromMonth: 8, why: "BFS, and priority_queue for Dijkstra-shaped problems" },
  { header: "stack", fromMonth: 8, why: "explicit stacks once recursion is taught" },
] as const;

export type AnticipatedHeader = (typeof ANTICIPATED_HEADERS)[number]["header"];

/**
 * What September actually needs: **`<iostream>`, and nothing else.**
 *
 * Every one of September's tasks is `cin`, arithmetic, comparison, `cout`. A
 * September task that includes anything more is either off-syllabus or a
 * learner working ahead, and neither is a reason to change the runtime.
 *
 * This is a fact about the curriculum, not a restriction on the toolchain: the
 * whole standard library is present because it ships with the compiler, and a
 * curious learner who writes `#include <vector>` gets vector.
 */
export const SEPTEMBER_HEADERS_REQUIRED: readonly string[] = ["iostream"];

/** Is this header one the programme has already anticipated needing? */
export function isAnticipatedHeader(headerName: string): boolean {
  return ANTICIPATED_HEADERS.some((h) => h.header === headerName);
}

/* -------------------------------------------------------------------------- */
/* The gate a library request has to pass                                     */
/* -------------------------------------------------------------------------- */

/**
 * The four questions.
 *
 * Written as data rather than prose because a checklist nothing evaluates is a
 * checklist people skip. `reviewLibraryRequest` below actually runs it, and the
 * refusal it produces names the unmet gates — so a request can be declined with
 * a reason rather than with a mood.
 *
 * All four are required. There is no scoring and no majority: a library with an
 * excellent curriculum case and no version pin is still refused, because the
 * pin is what makes next year's evidence comparable to this year's.
 */
export const LIBRARY_REQUEST_GATES = [
  {
    id: "curriculum_need",
    question:
      "Does a task the programme actually declares require this, and can it not " +
      "be written with the standard library?",
    kk: "Бағдарламадағы нақты тапсырма мұны талап ете ме?",
    ru: "Требует ли этого конкретное задание программы?",
  },
  {
    id: "both_engines",
    question:
      "Is it available in BOTH engines — the browser's libc++ and the judge's " +
      "libstdc++ — so a learner cannot write a file that compiles on Submit and " +
      "refuses to compile on Run?",
    kk: "Екі жүйеде де бар ма — браузерде де, судьяда да?",
    ru: "Доступна ли она в обоих движках — в браузере и на судье?",
  },
  {
    id: "runtime_reproducibility",
    question:
      "Does the judge still rebuild from scratch to a byte-identical toolchain " +
      "with this installed, with no network access at run time?",
    kk: "Судья дәл сол күйінде қайта құрастырыла ма?",
    ru: "Собирается ли судья заново в том же самом виде?",
  },
  {
    id: "version_pinned",
    question:
      "Is an exact version recorded here, beside the compiler pin, rather than " +
      "a range resolved at install time?",
    kk: "Нақты нұсқасы жазылды ма?",
    ru: "Зафиксирована ли точная версия?",
  },
] as const;

export type LibraryRequestGateId = (typeof LIBRARY_REQUEST_GATES)[number]["id"];

export interface LibraryRequest {
  /** The library name, as its own documentation spells it. */
  libraryName: string;
  /** Which gates the requester claims to have satisfied. */
  satisfied: Partial<Record<LibraryRequestGateId, boolean>>;
}

export type LibraryRequestOutcome =
  | { approved: true; libraryName: string }
  | {
      approved: false;
      libraryName: string;
      /** Gates not answered, or answered no. Empty only when `blanketPolicy` refused. */
      unmet: LibraryRequestGateId[];
      /** True when the standing year-one policy refused before any gate was read. */
      blanketPolicy: boolean;
      reason: string;
    };

/**
 * Evaluate a request. Refuses by default, and says why.
 *
 * The blanket policy is checked FIRST and short-circuits, because in year one
 * the answer is no regardless of how good the paperwork is — and a function
 * that quietly approved a well-argued request would make
 * `THIRD_PARTY_LIBRARIES_ALLOWED` decorative. When the programme decides to
 * allow libraries, that constant flips and the four gates become the real
 * decision.
 *
 * Note that this returns a verdict; it does not install anything and nothing
 * downstream consumes it. It is here so the policy is executable and testable,
 * and so a future admin surface has one place to call.
 */
export function reviewLibraryRequest(request: LibraryRequest): LibraryRequestOutcome {
  const unmet = LIBRARY_REQUEST_GATES.filter((g) => request.satisfied[g.id] !== true).map(
    (g) => g.id,
  );

  if (!THIRD_PARTY_LIBRARIES_ALLOWED) {
    return {
      approved: false,
      libraryName: request.libraryName,
      unmet,
      blanketPolicy: true,
      reason:
        `Year one is standard library only, so ${request.libraryName} is refused ` +
        "regardless of the four gates. Changing this is a programme decision, not " +
        "a deployment one: flip THIRD_PARTY_LIBRARIES_ALLOWED in " +
        "schools/execution/cpp-runtime.ts, pin the version beside the compiler, " +
        "and rebuild both engines.",
    };
  }

  if (unmet.length > 0) {
    return {
      approved: false,
      libraryName: request.libraryName,
      unmet,
      blanketPolicy: false,
      reason:
        `${request.libraryName} does not yet pass: ${unmet.join(", ")}. All four ` +
        "gates are required — there is no partial credit, because the one most " +
        "often skipped (both_engines) is the one that produces a file which " +
        "compiles on Submit and fails on Run.",
    };
  }

  return { approved: true, libraryName: request.libraryName };
}
