/**
 * `bits/stdc++.h` for the browser toolchain.
 *
 * ## The mismatch this closes
 *
 * Judge0 compiles with GCC, and GCC's libstdc++ ships `bits/stdc++.h` — the
 * "include everything" header that essentially every competitive programmer
 * writes at the top of every file. The browser toolchain is Clang with libc++,
 * which does not ship it, because it is a libstdc++ implementation detail and
 * never was standard.
 *
 * Left alone, that produces the worst possible failure for a learner: the exact
 * same source is ACCEPTED on Submit and REFUSES TO COMPILE on Run. They would
 * conclude the browser is broken, and they would be right.
 *
 * ## Why a header and not a rewrite
 *
 * The alternatives were considered and rejected:
 *
 *   - Rewriting the learner's source before compiling — regex over someone
 *     else's program, and the code they see would not be the code that ran.
 *   - Teaching them not to use it — they will meet it in every editorial and
 *     every teammate's template within a week of touching a real contest.
 *   - Sending different source to Run and Submit — the same source must go to
 *     both or the local run stops being evidence of anything.
 *
 * So the browser sysroot gains the header, and one source compiles in both
 * places. It is injected into memfs at `/include/bits/stdc++.h`, where the
 * sysroot already has a `bits/` directory, so the existing include path finds
 * it with no compiler flags.
 *
 * ## What it deliberately does NOT contain
 *
 * Only headers this libc++ actually ships. It is not a promise that GCC's
 * entire surface exists — it is the honest subset, and a program using
 * something absent still fails locally rather than silently behaving
 * differently.
 *
 * The list was DERIVED, not written from memory: each candidate was compiled
 * on its own in the browser and kept only if it built. 76 of 78 did. The two
 * that did not are recorded here so nobody adds them back:
 *
 *   - `csetjmp` — libc++'s wrapper includes the C `setjmp.h`, which this
 *     sysroot does not ship. `fatal error: 'setjmp.h' file not found`.
 *   - `csignal` — `error: no member named 'signal' in the global namespace`.
 *     WASI has no signals.
 *
 * Also absent from libc++ 8 entirely, so never candidates: `<execution>`,
 * `<memory_resource>`, `<coroutine>`, `<format>`, `<ranges>`, `<concepts>`.
 * GCC has some of them; a learner reaching for one fails at compile time in
 * the browser, which is the honest place to find out.
 *
 * Neither omission touches Year 1: no competitive-programming solution for a
 * 14-year-old needs `setjmp` or POSIX signals.
 */

/**
 * Where the compiler's existing include path will find it.
 *
 * No leading slash. The sysroot tar's own entries are `include/endian.h` and
 * memfs stores paths exactly as given, so `/include/...` creates a SECOND,
 * unrelated tree that clang never searches — the symptom is a flat
 * `'bits/stdc++.h' file not found` with the header sitting right there.
 */
export const BITS_STDCPP_PATH = "include/bits/stdc++.h";

/**
 * The headers included, in the order libstdc++ groups them.
 *
 * Exported so the test can compare this list against the sysroot rather than
 * parsing the header text.
 */
export const BITS_STDCPP_HEADERS: readonly string[] = [
  // C library
  "cassert", "cctype", "cerrno", "cfenv", "cfloat", "cinttypes", "climits",
  "clocale", "cmath", "cstdarg", "cstddef", "cstdint",
  "cstdio", "cstdlib", "cstring", "ctime", "cwchar", "cwctype",
  // Containers
  "array", "bitset", "deque", "forward_list", "list", "map", "queue", "set",
  "stack", "unordered_map", "unordered_set", "vector",
  // Strings and text
  "string", "string_view", "regex", "charconv",
  // Streams
  "fstream", "iomanip", "ios", "iosfwd", "iostream", "istream", "ostream",
  "sstream", "streambuf",
  // Algorithms, numerics, utilities
  "algorithm", "bit", "chrono", "complex", "functional", "initializer_list",
  "iterator", "limits", "memory", "numeric", "optional", "random", "ratio",
  "tuple", "type_traits", "typeindex", "typeinfo", "utility", "valarray",
  "variant", "any", "compare", "span",
  // Diagnostics and language support
  "exception", "new", "stdexcept", "system_error",
  // Concurrency — present, though Year 1 never uses it
  "atomic", "condition_variable", "future", "mutex", "shared_mutex", "thread",
] as const;

/** The header text written into the browser sysroot. */
export function bitsStdcppSource(): string {
  return [
    "// SolveX4Schools — bits/stdc++.h for the browser Clang/libc++ toolchain.",
    "//",
    "// GCC ships this header and libc++ does not, so without it the same source",
    "// compiles on Judge0 and fails in the browser. Contains only headers this",
    "// libc++ actually provides; it is not a claim that all of libstdc++ exists.",
    "//",
    "// Generated from src/lib/cpp17/bits-stdcpp.ts. Do not edit in place.",
    "#pragma once",
    "",
    ...BITS_STDCPP_HEADERS.map((h) => `#include <${h}>`),
    "",
  ].join("\n");
}
