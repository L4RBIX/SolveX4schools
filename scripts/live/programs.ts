import type { ExecutionResult } from "@schools/exec/provider";
import { BIG_INT_TEXT, PROGRAMS } from "../../tests/exec/judge0-fake";

/**
 * The programs the live run sends, and what each one is asked to prove.
 *
 * ## Why the conformance programs are imported rather than retyped
 *
 * `tests/exec/judge0-fake.ts` already holds them, written as REAL C++17 so
 * that the same source can be answered by the fake in CI and compiled by GCC on
 * a rented judge. Retyping them here would create a second definition that
 * drifts from the first, and the drift would be invisible: both suites would
 * still be green, about different programs. One table, two judges — the same
 * argument the conformance suite makes for being one suite.
 *
 * ## The sandbox probes are new, and are OBSERVATIONS
 *
 * Nothing below attacks anything. Each probe asks a question a C++ program is
 * entitled to ask about its own process — can I resolve a name, what is in my
 * working directory, may I spawn a shell — prints the answer, and cleans up
 * after itself. Nothing is written that is not deleted, nothing is read whose
 * CONTENTS are printed, and no data leaves the judge: the network probe talks to
 * `example.com`, IANA's reserved documentation domain, and sends it nothing.
 *
 * They are POSIX C++, not portable C++, and deliberately so. A probe asking
 * whether the sandbox holds has to use the interfaces a hostile paste would use,
 * and on this judge those are `<sys/socket.h>`, `popen` and `environ`. Each one
 * is wrapped so that "the sandbox refused" and "this judge does not have that
 * header" arrive as different words rather than as the same silence.
 *
 * The honest result may well be that a boundary is open. If `enable_network:
 * false` is not honoured, that is a security limitation of the rented judge and
 * the report says so — it is not something to work around, and it is certainly
 * not something to leave undiscovered because the probe was too polite to ask.
 */

/* -------------------------------------------------------------------------- */
/* The compiler, asked about itself                                            */
/* -------------------------------------------------------------------------- */

/**
 * The one submission the identity phase spends, and what it buys.
 *
 * A catalogue entry is a string Judge0 wrote next to an id. This is the
 * toolchain answering, and it answers the four questions that decide whether
 * this product can grade a child on this plan at all:
 *
 * 1. **`__cplusplus`.** `compiler_options` is refused with HTTP 403 here, so
 *    `-std=c++17` cannot be sent and the standard comes from the compiler's own
 *    default. `201703` is not a nicety; it is the premise.
 * 2. **Which compiler.** `__GNUC__` and friends rather than a catalogue label,
 *    and `__clang__` checked first because Clang also defines `__GNUC__` (as
 *    4.2.1), which would make a Clang look like an ancient GCC.
 * 3. **`__OPTIMIZE__`.** Judge0 was measured at `-O0` and the browser's Run
 *    compiles at `-O2`. December's time budgets were sized on the `-O0` side of
 *    that gap, so a change here changes what "too slow" means.
 * 4. **`-7 / 2` and `-7 % 2`.** C++ truncates toward zero: `-3` and `-1`. The
 *    Python curriculum this replaced floored: `-4` and `1`. Every September task
 *    carried over had to be re-checked against that rather than translated, and
 *    it is the single most likely way a task's expected output became quietly
 *    wrong — so it is asked of the judge that actually grades children.
 *
 * The output is `name|value`, one per line, so the parser in
 * `judge0-validate.ts` has nothing to guess.
 *
 * Only `<iostream>`, like every other program this system submits. If a judge
 * cannot compile this, it cannot compile September.
 */
export const COMPILER_IDENTITY_PROGRAM = [
  "#include <iostream>",
  "",
  "int main() {",
  "#if defined(__clang__)",
  '  std::cout << "compiler|Clang " << __clang_major__ << "." << __clang_minor__',
  '            << "." << __clang_patchlevel__ << "\\n";',
  "#elif defined(__GNUC__)",
  '  std::cout << "compiler|GCC " << __GNUC__ << "." << __GNUC_MINOR__',
  '            << "." << __GNUC_PATCHLEVEL__ << "\\n";',
  "#else",
  '  std::cout << "compiler|unknown\\n";',
  "#endif",
  '  std::cout << "__cplusplus|" << __cplusplus << "\\n";',
  "#ifdef __OPTIMIZE__",
  '  std::cout << "__OPTIMIZE__|defined\\n";',
  "#else",
  '  std::cout << "__OPTIMIZE__|undefined\\n";',
  "#endif",
  '  std::cout << "-7/2|" << (-7 / 2) << "\\n";',
  '  std::cout << "-7%2|" << (-7 % 2) << "\\n";',
  "}",
].join("\n");

/* -------------------------------------------------------------------------- */
/* Conformance                                                                 */
/* -------------------------------------------------------------------------- */

export interface ConformanceCase {
  id: string;
  /** One line, for the report: what a failure here would mean. */
  what: string;
  source: string;
  stdin: string;
  /** Overrides the ordinary 5 s budget. Only the runaway loop wants one. */
  timeLimitMs?: number;
  /** The expectation in prose, printed in the report beside what happened. */
  expected: string;
  /**
   * `null` when the result matched. Otherwise the mismatch, in one sentence.
   *
   * A function rather than a declarative shape because two of the eleven are
   * not equality assertions: the output bomb is about WHERE the truncation
   * lands, and the big integer is about a hundred digits surviving a JSON round
   * trip. Encoding those as fields would mean a mini-language nobody can read.
   */
  verify(result: ExecutionResult): string | null;
}

/** 64 KiB, the ceiling `EXECUTION_LIMITS.maxOutputBytes` sets and the provider applies. */
const OUTPUT_CAP = 64 * 1024;

function statusMismatch(result: ExecutionResult, want: string): string | null {
  return result.status === want ? null : `status was ${result.status}, expected ${want}`;
}

export const CONFORMANCE_CASES: readonly ConformanceCase[] = [
  {
    id: "hello-world",
    what: "the judge runs a program at all and gives its stdout back intact",
    source: PROGRAMS.hello,
    stdin: "",
    expected: "`ok`, stdout exactly `hello, world\\n`",
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.stdout === "hello, world\n" ? null : `stdout was ${JSON.stringify(r.stdout)}`),
  },
  {
    id: "stdin-3-7",
    what:
      "stdin actually reaches the program. The answer is COMPUTED from the input, so a " +
      "judge that silently dropped stdin cannot pass by coincidence — and dropping stdin " +
      "is how a whole class gets graded wrong while every test stays green",
    source: PROGRAMS.sumPair,
    stdin: "3 7\n",
    expected: "`ok`, stdout exactly `10\\n`",
    verify: (r) =>
      statusMismatch(r, "ok") ?? (r.stdout === "10\n" ? null : `stdout was ${JSON.stringify(r.stdout)}`),
  },
  {
    id: "stdin-20-22",
    what: "the same program on a different input — proof the answer is not a fixture",
    source: PROGRAMS.sumPair,
    stdin: "20 22\n",
    expected: "`ok`, stdout exactly `42\\n`",
    verify: (r) =>
      statusMismatch(r, "ok") ?? (r.stdout === "42\n" ? null : `stdout was ${JSON.stringify(r.stdout)}`),
  },
  {
    id: "compile-error",
    what:
      "a missing semicolon is a program that NEVER RAN, and with a compiled language the " +
      "judge says so STRUCTURALLY: status 6, with the compiler's own diagnostics in " +
      "`compile_output`, its own field. The Python era had to infer this from prose on " +
      "stderr because CPython has no compile stage; that inference is gone, and this row " +
      "is what replaced it. The difference is what a fourteen-year-old is told: check " +
      "your punctuation, or check your logic",
    source: PROGRAMS.syntax,
    stdin: "",
    expected:
      "`compile_error`, empty stdout, and GCC's own diagnostic carried through — " +
      "not infrastructure",
    verify: (r) =>
      statusMismatch(r, "compile_error") ??
      (r.stdout === "" ? null : `a program that did not compile printed ${JSON.stringify(r.stdout)}`) ??
      /* The MARKER, not the wording. `docs/cpp17/CPP17_JUDGE_PARITY.md` records
         that Clang and GCC phrase the same error differently and that the
         product accepts it; pinning the sentence would make this row fail the
         day the judge's GCC is upgraded, which says nothing about anybody. What
         has to survive is that the diagnostics reached us at all — an empty one
         leaves a learner with "it did not compile" and no reason. */
      (/\berror\b/i.test(r.stderr) ? null : "the compiler's diagnostics did not survive"),
  },
  {
    id: "runtime-error-signal",
    what:
      "a program that COMPILED and then died is the learner's evidence, and it must not be " +
      "reported as the judge having a bad day. Integer division by zero is undefined " +
      "behaviour and on x86-64 it is SIGFPE: the process is killed, prints nothing, and " +
      "the only description lives in Judge0's own `message` field, which this product does " +
      "not forward. So the honest expectation is a correct verdict and NO explanation — a " +
      "real loss against CPython's traceback, asserted here rather than quietly hoped away",
    source: PROGRAMS.divZero,
    stdin: "",
    expected: "`runtime_error`, `infrastructureError: false`, and empty output",
    verify: (r) =>
      statusMismatch(r, "runtime_error") ??
      (r.infrastructureError ? "it was reported as an infrastructure failure" : null) ??
      (r.stdout === "" ? null : `a killed program printed ${JSON.stringify(r.stdout)}`),
  },
  {
    id: "runtime-error-exception",
    what:
      "the other half of how C++ fails, and the half that DOES say something. `vector::at` " +
      "throws, libstdc++'s default terminate handler writes a real sentence to stderr, and " +
      "then aborts. It earns its place beside the signal row because the two fail " +
      "differently and a learner needs both told correctly",
    source: PROGRAMS.throwing,
    stdin: "",
    expected: "`runtime_error`, stderr naming `std::out_of_range`",
    verify: (r) =>
      statusMismatch(r, "runtime_error") ??
      (r.stderr.includes("out_of_range")
        ? null
        : `stderr did not name the exception: ${JSON.stringify(r.stderr.slice(0, 120))}`),
  },
  {
    id: "empty-stdin",
    what:
      "a learner who pressed Check with an empty input box made a mistake; the judge did " +
      "not have an outage. THE LANGUAGE CHANGED THE ANSWER HERE and the row changed with " +
      "it: `input()` on an exhausted stdin raised `EOFError` and CPython exited 1, so the " +
      "Python-era expectation was `runtime_error`. `std::cin >> a` on an exhausted stdin " +
      "sets `failbit` and, since C++11, VALUE-INITIALISES the target — so the program " +
      "carries on with zero, prints an answer and exits 0. A RUNNING, WRONG program " +
      "instead of a crash, which the checker then marks wrong on the answer. What has not " +
      "changed, and is what this row actually defends, is that an empty input box is never " +
      "`provider_error`",
    source: PROGRAMS.sumPair,
    stdin: "",
    expected: "`ok`, stdout `0\\n`, `infrastructureError: false`",
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.infrastructureError ? "it was reported as an infrastructure failure" : null) ??
      (r.stdout === "0\n" ? null : `stdout was ${JSON.stringify(r.stdout)}, expected "0\\n"`),
  },
  {
    id: "time-limit-exceeded",
    what:
      "THE most important row. Judge0 reports the learner's exhausted CPU budget and its " +
      "own bad day down one HTTP channel. One is a fact about a child's algorithm — " +
      "December's whole month is about making programs fast — and the other says nothing " +
      "about them at all",
    source: PROGRAMS.spin,
    stdin: "",
    expected: "`time_limit_exceeded`, `infrastructureError: false`, NOT `provider_timeout`",
    verify: (r) =>
      statusMismatch(r, "time_limit_exceeded") ??
      (r.infrastructureError ? "it was reported as an infrastructure failure" : null),
  },
  {
    id: "kazakh-unicode",
    what:
      "the product is written in Kazakh. Two bytes a character through a POST body, a " +
      "queue, a container's stdout and a JSON response, and back out identical",
    source: PROGRAMS.kazakh,
    stdin: "",
    expected: "`ok`, stdout exactly `Сәлем, әлем!\\n`",
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.stdout === "Сәлем, әлем!\n" ? null : `stdout was ${JSON.stringify(r.stdout)}`),
  },
  {
    id: "wide-integer",
    what:
      "`3000000000LL * 2`. C++ has no arbitrary precision, so the Python row this replaced " +
      "(`10**100`) had no meaning here — the equivalent claim is the one that actually " +
      "bites: a value past 32 bits survives because the program said `long long`, and " +
      "nothing in the chain truncated it to `int` or reformatted it through a float",
    source: PROGRAMS.bigInt,
    stdin: "",
    expected: `\`ok\`, stdout exactly \`${BIG_INT_TEXT}\``,
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.stdout.trim() === BIG_INT_TEXT
        ? null
        : `stdout was ${JSON.stringify(r.stdout.slice(0, 60))}, expected ${BIG_INT_TEXT}`),
  },
  {
    id: "output-bomb",
    what:
      "about 220 KB of stdout, well past our own 64 KiB ceiling and well under any " +
      "file-size limit a judge enforces. So it tests OUR truncation, not the judge's " +
      "SIGXFSZ — and truncation must not turn into a verdict",
    source: PROGRAMS.bomb,
    stdin: "",
    expected: "`ok`, stdout truncated to exactly 65 536 characters",
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.stdout.length === OUTPUT_CAP
        ? null
        : `stdout came back ${r.stdout.length} characters, expected the ${OUTPUT_CAP} cap`),
  },
  {
    id: "non-zero-exit",
    what:
      "a program that printed something and then exited 7. The output before the exit is " +
      "still the learner's, and the exit code has to survive",
    source: PROGRAMS.exit7,
    stdin: "",
    expected: "`runtime_error`, stdout `partial\\n`, exit code 7",
    verify: (r) =>
      statusMismatch(r, "runtime_error") ??
      (r.stdout === "partial\n" ? null : `stdout was ${JSON.stringify(r.stdout)}`) ??
      (r.exitCode === 7 ? null : `exit code was ${String(r.exitCode)}, expected 7`),
  },
];

/* -------------------------------------------------------------------------- */
/* Sandbox probes                                                              */
/* -------------------------------------------------------------------------- */

/** What one probe concluded about one boundary. */
export interface ProbeReading {
  /** `open` is a finding. `unknown` means the program did not get to answer. */
  boundary: "held" | "open" | "unknown";
  /** The lines the program printed, already scrubbed, for the report. */
  detail: string;
  /** Set when `open` is a security limitation somebody has to decide about. */
  securityNote: string | null;
}

export interface SandboxProbe {
  id: string;
  what: string;
  /** Why this is safe to run against somebody else's infrastructure. */
  safety: string;
  source: string;
  interpret(result: ExecutionResult): ProbeReading;
}

/** `name|OPEN|detail` / `name|BLOCKED|ExceptionName`, one per line. */
function lines(result: ExecutionResult): string[] {
  return result.stdout.split("\n").map((l) => l.trim()).filter(Boolean);
}

function anyOpen(result: ExecutionResult): boolean {
  return lines(result).some((l) => l.includes("|OPEN|"));
}

function unreadable(result: ExecutionResult): ProbeReading | null {
  if (result.infrastructureError) {
    return {
      boundary: "unknown",
      detail: "the judge did not answer, so the boundary was never observed",
      securityNote: null,
    };
  }
  if (result.status === "compile_error") {
    /* Ours, not the judge's. A probe that does not compile has observed
       nothing, and saying so in the judge's own words is the difference between
       "this boundary held" and "we never asked". */
    return {
      boundary: "unknown",
      detail:
        "the probe did not COMPILE, so no boundary was observed — this is a defect in " +
        `SolveX's own probe, not a property of the judge:\n${result.stderr.slice(0, 400)}`,
      securityNote: null,
    };
  }
  if (result.stdout.trim() === "") {
    return {
      boundary: "unknown",
      detail: `the probe printed nothing (status ${result.status})`,
      securityNote: null,
    };
  }
  return null;
}

/**
 * The probe programs, one per boundary.
 *
 * POSIX C++ rather than portable C++, deliberately: a probe asking whether the
 * sandbox holds has to reach for the interfaces a hostile paste would reach
 * for, and on this judge those are `<sys/socket.h>`, `popen` and `environ`.
 * Every one of them is wrapped so that "the sandbox refused" and "this judge
 * does not have that interface" arrive as different words instead of as the
 * same silence, and every line is flushed as it is printed — a program the
 * judge kills on the wall limit still leaves behind everything it had already
 * learned.
 *
 * Held to `-std=gnu++17` with `-Wall` and run before being committed. A probe
 * that does not compile is not an observation about a sandbox; it is a blank in
 * this repository's own report.
 */
const NETWORK_SOURCE = [
  "#include <cerrno>",
  "#include <cstring>",
  "#include <iostream>",
  "#include <string>",
  "#include <arpa/inet.h>",
  "#include <fcntl.h>",
  "#include <netdb.h>",
  "#include <sys/select.h>",
  "#include <sys/socket.h>",
  "#include <unistd.h>",
  "",
  "static void say(const std::string& name, const std::string& state, const std::string& detail) {",
  "  std::cout << name << \"|\" << state << \"|\" << detail << std::endl;",
  "}",
  "",
  "/* Non-blocking connect bounded by `select`, so a filtered network costs 2 s",
  "   rather than the kernel's SYN retry schedule. */",
  "static bool connect_within(int fd, const sockaddr* addr, socklen_t len, int seconds) {",
  "  int flags = fcntl(fd, F_GETFL, 0);",
  "  fcntl(fd, F_SETFL, flags | O_NONBLOCK);",
  "  if (connect(fd, addr, len) == 0) return true;",
  "  if (errno != EINPROGRESS) return false;",
  "  fd_set writable;",
  "  FD_ZERO(&writable);",
  "  FD_SET(fd, &writable);",
  "  timeval timeout{seconds, 0};",
  "  if (select(fd + 1, nullptr, &writable, nullptr, &timeout) <= 0) return false;",
  "  int error = 0;",
  "  socklen_t size = sizeof(error);",
  "  if (getsockopt(fd, SOL_SOCKET, SO_ERROR, &error, &size) != 0) return false;",
  "  errno = error;",
  "  return error == 0;",
  "}",
  "",
  "int main() {",
  "  addrinfo hints{};",
  "  hints.ai_family = AF_INET;",
  "  hints.ai_socktype = SOCK_STREAM;",
  "  addrinfo* found = nullptr;",
  "  const int resolved = getaddrinfo(\"example.com\", \"80\", &hints, &found);",
  "  if (resolved != 0 || found == nullptr) {",
  "    say(\"dns\", \"BLOCKED\", gai_strerror(resolved));",
  "    say(\"tcp\", \"BLOCKED\", \"no address to connect to\");",
  "    say(\"http\", \"BLOCKED\", \"no address to connect to\");",
  "    return 0;",
  "  }",
  "",
  "  char text[INET_ADDRSTRLEN] = {};",
  "  inet_ntop(AF_INET, &reinterpret_cast<sockaddr_in*>(found->ai_addr)->sin_addr, text, sizeof(text));",
  "  say(\"dns\", \"OPEN\", text);",
  "",
  "  const int fd = socket(found->ai_family, found->ai_socktype, found->ai_protocol);",
  "  if (fd < 0) {",
  "    say(\"tcp\", \"BLOCKED\", std::strerror(errno));",
  "    say(\"http\", \"BLOCKED\", \"no socket\");",
  "    freeaddrinfo(found);",
  "    return 0;",
  "  }",
  "  if (!connect_within(fd, found->ai_addr, found->ai_addrlen, 2)) {",
  "    say(\"tcp\", \"BLOCKED\", errno == 0 ? \"timed out after 2 s\" : std::strerror(errno));",
  "    say(\"http\", \"BLOCKED\", \"no connection\");",
  "    close(fd);",
  "    freeaddrinfo(found);",
  "    return 0;",
  "  }",
  "  say(\"tcp\", \"OPEN\", text);",
  "  freeaddrinfo(found);",
  "",
  "  const std::string get = \"GET / HTTP/1.0\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n\";",
  "  if (send(fd, get.data(), get.size(), 0) < 0) {",
  "    say(\"http\", \"BLOCKED\", std::strerror(errno));",
  "    close(fd);",
  "    return 0;",
  "  }",
  "  fd_set readable;",
  "  FD_ZERO(&readable);",
  "  FD_SET(fd, &readable);",
  "  timeval timeout{2, 0};",
  "  if (select(fd + 1, &readable, nullptr, nullptr, &timeout) <= 0) {",
  "    say(\"http\", \"BLOCKED\", \"no reply within 2 s\");",
  "    close(fd);",
  "    return 0;",
  "  }",
  "  char buffer[128] = {};",
  "  const ssize_t got = recv(fd, buffer, sizeof(buffer) - 1, 0);",
  "  close(fd);",
  "  if (got <= 0) {",
  "    say(\"http\", \"BLOCKED\", \"the connection closed without a reply\");",
  "    return 0;",
  "  }",
  "  std::string reply(buffer, static_cast<size_t>(got));",
  "  const size_t line = reply.find('\\r');",
  "  say(\"http\", \"OPEN\", reply.substr(0, line == std::string::npos ? reply.size() : line));",
  "}",
].join("\n");

const FILESYSTEM_SOURCE = [
  "#include <algorithm>",
  "#include <filesystem>",
  "#include <iostream>",
  "#include <string>",
  "#include <vector>",
  "#include <unistd.h>",
  "",
  "namespace fs = std::filesystem;",
  "",
  "static void say(const std::string& name, const std::string& state, const std::string& detail) {",
  "  std::cout << name << \"|\" << state << \"|\" << detail << std::endl;",
  "}",
  "",
  "/* NAMES only, capped at forty, sorted so two runs are comparable. Nothing is",
  "   opened and no file's contents are ever printed. */",
  "static void list(const std::string& name, const fs::path& where) {",
  "  std::error_code failed;",
  "  std::vector<std::string> names;",
  "  for (const auto& entry : fs::directory_iterator(where, failed)) {",
  "    names.push_back(entry.path().filename().string());",
  "    if (names.size() >= 40) break;",
  "  }",
  "  if (failed) {",
  "    say(name, \"BLOCKED\", failed.message());",
  "    return;",
  "  }",
  "  std::sort(names.begin(), names.end());",
  "  std::string joined;",
  "  for (const auto& one : names) joined += (joined.empty() ? \"\" : \",\") + one;",
  "  say(name, \"OPEN\", joined);",
  "}",
  "",
  "int main() {",
  "  std::error_code failed;",
  "  const fs::path here = fs::current_path(failed);",
  "  if (failed) say(\"cwd\", \"BLOCKED\", failed.message());",
  "  else say(\"cwd\", \"OPEN\", here.string());",
  "",
  "  list(\"root_entries\", \"/\");",
  "  list(\"cwd_entries\", \".\");",
  "",
  "  for (const char* path : {\"/etc/passwd\", \"/etc/shadow\", \"/proc/self/environ\", \"/box\"}) {",
  "    const bool readable = access(path, R_OK) == 0;",
  "    const bool present = fs::exists(path, failed);",
  "    std::cout << \"readable \" << path << \"|\" << (readable ? \"OPEN\" : \"BLOCKED\") << \"|\"",
  "              << (present ? \"exists\" : \"absent\") << std::endl;",
  "  }",
  "",
  "  say(\"identity\", \"OPEN\",",
  "      \"uid=\" + std::to_string(getuid()) + \" gid=\" + std::to_string(getgid()));",
  "}",
].join("\n");

const TEMPFILE_SOURCE = [
  "#include <filesystem>",
  "#include <fstream>",
  "#include <iostream>",
  "#include <string>",
  "",
  "namespace fs = std::filesystem;",
  "",
  "static void say(const std::string& name, const std::string& state, const std::string& detail) {",
  "  std::cout << name << \"|\" << state << \"|\" << detail << std::endl;",
  "}",
  "",
  "/* Twelve bytes, written and then deleted. `remove` runs on every path out,",
  "   including the failure paths, so nothing this probe creates outlives it. */",
  "static void write_then_delete(const std::string& name, const fs::path& target, const std::string& where) {",
  "  std::error_code failed;",
  "  {",
  "    std::ofstream handle(target);",
  "    if (!handle) {",
  "      say(name, \"BLOCKED\", \"could not open \" + target.string() + \" for writing\");",
  "      return;",
  "    }",
  "    handle << \"solvex probe\";",
  "  }",
  "  const auto size = fs::file_size(target, failed);",
  "  if (failed) {",
  "    fs::remove(target, failed);",
  "    say(name, \"BLOCKED\", failed.message());",
  "    return;",
  "  }",
  "  fs::remove(target, failed);",
  "  say(name, \"OPEN\", std::to_string(size) + \" bytes \" + where);",
  "}",
  "",
  "int main() {",
  "  std::error_code failed;",
  "  const fs::path temp = fs::temp_directory_path(failed);",
  "  if (failed) say(\"tempfile\", \"BLOCKED\", failed.message());",
  "  else write_then_delete(\"tempfile\", temp / \"solvex_probe.txt\", \"under \" + temp.string());",
  "",
  "  write_then_delete(\"cwd_write\", \"solvex_probe.txt\", \"into the working directory\");",
  "}",
].join("\n");

const SUBPROCESS_SOURCE = [
  "#include <cerrno>",
  "#include <cstdio>",
  "#include <cstring>",
  "#include <iostream>",
  "#include <string>",
  "",
  "int main() {",
  "  /* `id` and `uname -sr` read state and change nothing. stderr is folded into",
  "     the pipe so a shell that refuses says why on the one stream being read. */",
  "  FILE* pipe = popen(\"/bin/sh -c 'id; uname -sr' 2>&1\", \"r\");",
  "  if (pipe == nullptr) {",
  "    std::cout << \"subprocess|BLOCKED|\" << std::strerror(errno) << std::endl;",
  "    return 0;",
  "  }",
  "  std::string joined;",
  "  char line[256];",
  "  while (std::fgets(line, sizeof(line), pipe) != nullptr) {",
  "    std::string one(line);",
  "    while (!one.empty() && (one.back() == '\\n' || one.back() == '\\r')) one.pop_back();",
  "    if (one.empty()) continue;",
  "    joined += (joined.empty() ? \"\" : \" ~ \") + one;",
  "  }",
  "  const int status = pclose(pipe);",
  "  if (status != 0 && joined.empty()) {",
  "    std::cout << \"subprocess|BLOCKED|the shell produced nothing, pclose \" << status << std::endl;",
  "    return 0;",
  "  }",
  "  std::cout << \"subprocess|OPEN|rc=\" << status << \" \" << joined << std::endl;",
  "}",
].join("\n");

const ENVIRON_SOURCE = [
  "#include <algorithm>",
  "#include <iostream>",
  "#include <string>",
  "#include <vector>",
  "#include <unistd.h>",
  "",
  "/* POSIX declares this; g++ on glibc already has it from <unistd.h>, and the",
  "   redeclaration is compatible where it does. NAMES only \u2014 a judge host's",
  "   environment can hold ITS operator's credentials. */",
  "extern char** environ;",
  "",
  "int main() {",
  "  std::vector<std::string> names;",
  "  for (char** entry = environ; entry != nullptr && *entry != nullptr; ++entry) {",
  "    const std::string one(*entry);",
  "    names.push_back(one.substr(0, one.find('=')));",
  "  }",
  "  std::sort(names.begin(), names.end());",
  "  std::string joined;",
  "  for (const auto& name : names) joined += (joined.empty() ? \"\" : \",\") + name;",
  "  std::cout << \"env_count|OPEN|\" << names.size() << std::endl;",
  "  std::cout << \"env_names|OPEN|\" << joined << std::endl;",
  "}",
].join("\n");

export const SANDBOX_PROBES: readonly SandboxProbe[] = [
  {
    id: "network",
    what:
      "whether `enable_network: false` is honoured. The provider sends it explicitly on " +
      "every submission — it is the CVE-2024-29021 default, and it is also the mechanism " +
      "behind `cpp-runtime.ts`'s standard-library-only guarantee, which works BY THE " +
      "JUDGE HAVING NO NETWORK TO FETCH A LIBRARY FROM",
    safety:
      "resolves and connects to example.com, IANA's reserved documentation domain, and " +
      "sends it nothing but an ordinary GET / . No data of ours crosses the wire. The " +
      "connect is non-blocking and bounded by `select` at 2 s and the read at 2 s more, so " +
      "a filtered network costs four seconds rather than the kernel's SYN retry schedule " +
      "and three blocked checks still finish inside the 7 s wall limit.",
    source: NETWORK_SOURCE,
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      const open = anyOpen(result);
      return {
        boundary: open ? "open" : "held",
        detail: lines(result).join("\n"),
        securityNote: open
          ? "Outbound network was reachable from inside a submission even though the " +
            "provider sends `enable_network: false` on every one. That is a SECURITY " +
            "LIMITATION of the rented judge, and it also breaks the standard-library-only " +
            "guarantee `schools/execution/cpp-runtime.ts` enforces by absence: that policy " +
            "works because the judge has nothing to fetch a library from, so a judge with a " +
            "network is a judge where a learner could fetch a solution. It is a programme " +
            "decision, not a provider bug to work around."
          : null,
      };
    },
  },
  {
    id: "filesystem",
    what: "what a submission can see of the host: the working directory, the root, its own uid",
    safety:
      "lists directory NAMES through `std::filesystem::directory_iterator`, capped at forty " +
      "and sorted, and asks `access(2)` whether four well-known paths are readable. It " +
      "never opens a file and never prints any file's contents.",
    source: FILESYSTEM_SOURCE,
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      const rows = lines(result);
      const shadow = rows.find((l) => l.startsWith("readable /etc/shadow"));
      const rootIsReadable = rows.some((l) => l.startsWith("identity|OPEN|uid=0"));
      const notes: string[] = [];
      if (shadow?.includes("|OPEN|")) notes.push("`/etc/shadow` was readable from inside a submission.");
      if (rootIsReadable) notes.push("submissions run as uid 0 inside their container.");
      return {
        /* A filesystem is always visible to a process — the finding is not "it
           saw a directory", it is what it could read and as whom. */
        boundary: notes.length > 0 ? "open" : "held",
        detail: rows.join("\n"),
        securityNote:
          notes.length > 0
            ? `${notes.join(" ")} Neither reaches a learner and neither is exploitable from ` +
              "the product, but both describe the blast radius of a sandbox escape and " +
              "belong in a residency conversation."
            : null,
      };
    },
  },
  {
    id: "tempfile",
    what: "whether a submission may write to disk at all — and where",
    safety:
      "writes twelve bytes to `std::filesystem::temp_directory_path()` and twelve more to " +
      "the working directory, then deletes both on every path out, including the failing " +
      "ones. Nothing this probe creates outlives it.",
    source: TEMPFILE_SOURCE,
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      /* Writing to a scratch directory is what a compiled program does; it is
         only interesting alongside the other probes, and it is not on its own a
         limitation. Recorded as an observation, not as a finding. */
      return { boundary: anyOpen(result) ? "open" : "held", detail: lines(result).join("\n"), securityNote: null };
    },
  },
  {
    id: "subprocess",
    what:
      "whether a submission can spawn a shell. It is the difference between a program " +
      "sandbox and a machine, and it decides how much a hostile paste could do",
    safety: "runs `id` and `uname -sr` through `popen`, which read state and change nothing.",
    source: SUBPROCESS_SOURCE,
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      const open = anyOpen(result);
      return {
        boundary: open ? "open" : "held",
        detail: lines(result).join("\n"),
        securityNote: open
          ? "A submission can spawn a shell. Expected for an isolate-based judge — the " +
            "isolation is the container and the cgroup, not the compiled program — and " +
            "worth writing down, because it means the only thing between a hostile paste " +
            "and the judge's host is Judge0's own sandbox, which nothing here can test. " +
            "Note that the browser half has no equivalent: `system()` does not even LINK " +
            "against the WASI sysroot, so this asymmetry is a property of the judge alone."
          : null,
      };
    },
  },
  {
    id: "environ",
    what: "which environment variables a submission inherits from the judge's host",
    safety:
      "walks POSIX `environ` and prints variable NAMES and the count, never a value. A " +
      "judge host's environment can hold ITS operator's credentials, and a validation run " +
      "must not copy somebody else's secret into a file in this repository.",
    source: ENVIRON_SOURCE,
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      const rows = lines(result);
      const names = rows.find((l) => l.startsWith("env_names"))?.split("|")[2] ?? "";
      /* A name that looks like a credential is a finding about the JUDGE's
         hygiene, not about us — but a learner's program can read the value, so
         it is worth naming the shape without ever printing one. */
      const suspicious = names
        .split(",")
        .filter((n) => /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(n));
      return {
        boundary: suspicious.length > 0 ? "open" : "held",
        detail: rows.join("\n"),
        securityNote:
          suspicious.length > 0
            ? `The submission's environment contains ${suspicious.length} variable name(s) ` +
              `that look like credentials (${suspicious.join(", ")}). Their VALUES were not ` +
              "read and are not in this report, but a learner's program could read them."
            : null,
      };
    },
  },
];
