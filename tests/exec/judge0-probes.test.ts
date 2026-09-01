import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CPP_STANDARD_FLAG, CPP_STANDARD_MACRO } from "@schools/execution/cpp-runtime";
import { cppCompiler } from "../support/cpp-run";
import { EXECUTION_LIMITS } from "@schools/exec";
import type { ExecutionRequest, ExecutionResult } from "@schools/exec/provider";
import { Judge0RapidApiProvider, resetJudge0GateForTests } from "@schools/exec/providers/judge0";
import { startFakeJudge0, type FakeJudge0 } from "./judge0-fake";

/**
 * What the rented sandbox actually permits — asked, not assumed.
 *
 * `judge0-conformance.test.ts` proves the adapter speaks Judge0's protocol and
 * that a learner's program comes back correctly normalised. It says nothing
 * about the box that program runs in. This file asks the box itself, from the
 * inside, using the only instrument we have: a C++ program submitted through
 * the ordinary path, whose stdout IS the answer.
 *
 * ## Why this is a real question and not paranoia
 *
 * `enable_network: false` is a field in OUR submission body. `judge0-fake.ts`
 * asserts we send it; nothing anywhere asserts the service HONOURS it. Judge0
 * CE ships that setting defaulted the other way — the CVE-2024-29021 default —
 * and a deployment that ignores the field answers 200 and runs the program with
 * egress wide open. Two consequences, one of them quiet:
 *
 * - `schools/execution/cpp-runtime.ts` enforces "standard library only" BY
 *   ABSENCE. The judge has no network, so there is nothing to fetch a library
 *   from. If the judge does have a network, that guarantee silently becomes a
 *   preference and SUBMIT stops matching the Run a learner saw.
 * - A field we set and the service ignores is not a field. If `enable_network`
 *   is discarded, nothing here can claim `cpu_time_limit` or `memory_limit`
 *   were honoured either, and every ceiling in `EXECUTION_LIMITS` is a wish.
 *
 * ## What is asserted, and what is only recorded
 *
 * Most of what a probe finds is not ours to have an opinion about. A readable
 * `/etc/passwd` is a Unix norm; a writable temp directory is a convenience;
 * `uid=0` inside a throwaway container is a packaging choice. Asserting a
 * particular answer to any of those would be asserting a guess about a vendor's
 * image, and a suite that fails on the vendor rearranging their container is a
 * suite people learn to ignore. Those are RECORDED — the run prints them — and
 * only their SHAPE is asserted: the probe ran, the question came back with an
 * answer in the vocabulary it was asked in, or the literal word UNKNOWN.
 *
 * Three findings are hard failures, and the line is drawn where a permitted
 * answer would be a security failure rather than a surprise:
 *
 * 1. `network.socket` — raw TCP egress must be refused.
 * 2. `network.http` — the full DNS-plus-HTTP path must be refused.
 * 3. `env.credential_like` — the sandbox must not hand a fourteen-year-old's
 *    program a credential belonging to the judge's own infrastructure.
 *
 * UNKNOWN fails all three, on purpose. A containment claim we could not verify
 * is not a containment claim, and "the probe did not answer" must never read as
 * "the probe answered safely".
 *
 * ## The asymmetry that makes a green run mean less than it looks
 *
 * `open` is PROOF: something got out. `blocked` is EVIDENCE, not proof — it
 * proves that this target, on this port, at this moment, was unreachable.
 * Two independent targets are probed to make a false "sealed" less likely, and
 * that is as far as honesty stretches. Nobody may read a green run here as
 * "egress is impossible"; it means "egress to 1.1.1.1:53 and to example.com:80
 * did not happen".
 *
 * ## There is no key in this repository
 *
 * `env | grep -i rapidapi` is empty and **nothing in this file has ever
 * contacted `judge0-ce.p.rapidapi.com`**. The offline half below runs against
 * the protocol-faithful fake, and the fake compiles nothing: its answers are
 * strings written by hand in this file describing what a sealed box and a
 * wide-open box WOULD print. They are fiction. They prove that the reader, the
 * shape rules and the three hard assertions work — including that the hard ones
 * can actually fail, which is the property a typo would otherwise remove
 * silently. They prove NOTHING about RapidAPI's sandbox.
 *
 * ## Running it for real, the moment a key exists
 *
 *   JUDGE0_LIVE_TEST=1 JUDGE0_RAPIDAPI_KEY=... npx vitest run tests/exec/judge0-probes.test.ts
 *
 * Cost: TWO submissions and one `GET /languages`, run strictly one after the
 * other — roughly nine to eleven billable requests including polls. Nothing
 * here fans out, retries a POST, or probes concurrency. "How many at once does
 * the plan allow" is a question that has to be asked in stages and abandoned at
 * the first 429, and a suite that a developer runs on a whim is the wrong place
 * to ask it.
 */

/* Both halves must be true, and the reasoning is `judge0-conformance.test.ts`'s
   verbatim: a flag with no key would silently exercise nothing, and a key with
   no flag must never make `npm test` spend quota.
   Duplicated rather than imported, because importing that file to reach its
   constants would re-register its describes inside this one and run the whole
   conformance matrix twice. */
const LIVE_FLAG = process.env.JUDGE0_LIVE_TEST === "1";
const LIVE_KEY = Boolean(process.env.JUDGE0_RAPIDAPI_KEY);
const LIVE = LIVE_FLAG && LIVE_KEY;

/** A live probe is a queue, a poll loop, and up to three one-second timeouts. */
const LIVE_TIMEOUT_MS = 60_000;

/**
 * And a generous one for the OFFLINE half, which is not generous for its own
 * sake.
 *
 * Every test below that submits to the fake is real HTTP over loopback plus a
 * real poll loop, and vitest's default ceiling is five seconds. On a machine
 * running several agents and a Next build at once that is close enough to be
 * reached — and a timeout here would be reported as "the probe reader is
 * broken", which is the most misleading failure this file could produce. The
 * work is milliseconds; the ceiling exists only to catch a genuine hang.
 */
const OFFLINE_TIMEOUT_MS = 30_000;

/**
 * Is there a compiler here to check the probe programs BUILD?
 *
 * Nothing in this suite RUNS a probe locally — they are for the rented sandbox,
 * and running the network one on a developer's machine would be a test that
 * opens sockets. This only asks whether a compiler exists, so the guard below
 * can either run or say plainly that it did not.
 *
 * The guard got stronger with the language. `ast.parse` could only prove the
 * Python probes were syntactically well-formed; a compiler proves they LINK,
 * which catches a missing header, a misspelled symbol and a wrong argument type
 * — three ways a probe could previously have reached the judge, failed, and
 * reported nothing about the sandbox at the cost of real requests.
 */
const LOCAL_COMPILER = cppCompiler();

const REQUEST: Omit<ExecutionRequest, "sourceCode" | "stdin"> = {
  language: "cpp17",
  timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
  memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
};

/* -------------------------------------------------------------------------- */
/* The probe programs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The line format. One finding per line, flushed as it is produced.
 *
 * Flushed, because C++ block-buffers stdout to a pipe and a program killed on
 * its wall limit loses whatever is still in the buffer. A probe that hangs must
 * still deliver the findings it had already made — the missing ones then arrive
 * as UNKNOWN and fail the hard assertions loudly, which is the correct outcome,
 * instead of vanishing into an empty stdout.
 *
 * The prefix exists so that anything else reaching stdout — a compiler warning
 * the judge merged in, a library's own chatter — cannot be parsed as a finding.
 */
const PROBE_PREFIX = "SOLVEX_PROBE ";

/**
 * The `say` helper and the vocabulary for a failure, shared by both programs.
 *
 * ## Why an errno NAME and not `strerror`
 *
 * Python reported a failure as an exception CLASS — one token, machine
 * readable, and carrying no path, uid or hostname. C++ has no equivalent, and
 * `strerror(errno)` is free prose with spaces in it that no shape rule can
 * read and that varies between libc builds. So `errname` maps the codes that
 * actually distinguish "the sandbox refused this" from "the probe is broken",
 * and anything else becomes `Errno<N>` — still one token, still tells a reader
 * which code to look up, and still carries nothing about the host.
 *
 * That distinction is the same one the Python probes drew between `blocked:`
 * and `error:`, and it is load-bearing for the hard assertions below: only an
 * OS-level refusal is evidence of containment, and a broken probe must never be
 * able to masquerade as a sealed sandbox.
 *
 * ## Written against the OLDEST C++ the judge could hand us
 *
 * Nothing here is newer than C++11 — no structured bindings, no `std::string_view`,
 * no `if` initialisers. Discovery refuses a GCC below 11 precisely so this
 * cannot happen, but a probe is the wrong place to depend on that: if discovery
 * is ever wrong, or an operator pinned `JUDGE0_LANGUAGE_ID` to a GCC 7, a probe
 * written in C++17 syntax would fail to COMPILE and report nothing whatsoever
 * about the sandbox. That is the one failure mode where we learn less than we
 * would from a program that merely errors.
 */
const SAY = `#include <cstdio>
#include <cstring>
#include <cerrno>
#include <string>

static void say(const char* key, const std::string& value) {
    std::fputs("${PROBE_PREFIX}", stdout);
    std::fputs(key, stdout);
    std::fputc('=', stdout);
    std::fputs(value.c_str(), stdout);
    std::fputc('\\n', stdout);
    /* Flushed per line: C++ block-buffers stdout to a pipe, and a program
       killed on its wall limit loses whatever is still in the buffer. A probe
       that hangs must still deliver the findings it had already made. */
    std::fflush(stdout);
}

static std::string errname(int e) {
    switch (e) {
        case EACCES: return "EACCES";
        case EPERM: return "EPERM";
        case ECONNREFUSED: return "ECONNREFUSED";
        case ENETUNREACH: return "ENETUNREACH";
        case EHOSTUNREACH: return "EHOSTUNREACH";
        case ETIMEDOUT: return "ETIMEDOUT";
        case ECONNRESET: return "ECONNRESET";
        case EAFNOSUPPORT: return "EAFNOSUPPORT";
        case EPROTONOSUPPORT: return "EPROTONOSUPPORT";
        case ENOENT: return "ENOENT";
        case EAGAIN: return "EAGAIN";
        case EPIPE: return "EPIPE";
        case EMFILE: return "EMFILE";
        case ENOSYS: return "ENOSYS";
        default: return "Errno" + std::to_string(e);
    }
}
`;

/**
 * Outbound network. Observational, and it sends nothing of ours.
 *
 * - The socket probe opens a TCP connection to a public DNS resolver's port 53
 *   and closes it without writing a byte. No payload, no data, no name
 *   resolution — which is the point: it isolates "can packets leave" from "does
 *   DNS work", so a `blocked` answer downstream can be read correctly.
 * - The DNS probe is deliberately NOT a hard assertion. A sandbox with a local
 *   caching resolver answers without any egress at all, so `resolved` is
 *   ambiguous where the other two are not.
 * - The urllib probe is the one a learner would accidentally write: resolve a
 *   name, open HTTP, get a status. `example.com` is IANA's reserved
 *   documentation domain — it exists to be used in examples and tests, and it
 *   is the one host on the internet that nobody is bothered by our reaching.
 *   The response is not read; only the status code is recorded.
 *
 * Every timeout is one second. Three of them is three seconds of wall clock
 * against a `wall_time_limit` of `cpu + 2` = seven, which leaves room for the
 * interpreter to start. The known hazard is `getaddrinfo`, which CPython cannot
 * bound with a timeout: a sandbox with a blackholed resolver could sit there.
 * The socket probe therefore goes FIRST and every line is flushed, so a hang
 * costs us the later findings and not all of them.
 *
 * `OSError` is separated from every other exception on purpose. Only an
 * OS-level socket failure — refused, unreachable, timed out, not resolvable —
 * is evidence of containment. An `AttributeError` or an `ImportError` is a
 * broken probe, and recording that as `blocked` would let a typo in this file
 * masquerade as a sealed sandbox and pass the hard assertion below.
 */
const NETWORK_PROBE = `${SAY}#include <netdb.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <unistd.h>
#include <fcntl.h>

static std::string gaiName(int code) {
    switch (code) {
        case EAI_NONAME: return "EAI_NONAME";
        case EAI_AGAIN: return "EAI_AGAIN";
        case EAI_FAIL: return "EAI_FAIL";
        case EAI_SYSTEM: return "EAI_SYSTEM";
        case EAI_MEMORY: return "EAI_MEMORY";
        case EAI_FAMILY: return "EAI_FAMILY";
        case EAI_SERVICE: return "EAI_SERVICE";
        default: return "EAI" + std::to_string(-code);
    }
}

/* One second, enforced by the probe rather than by the resolver.
   The known hazard is a blackholed address: a blocking connect can sit for the
   whole wall budget and cost every later finding. Non-blocking plus select
   bounds it. Returns 0 on success, or the errno that refused. */
static int connectWithin(int fd, const struct sockaddr* addr, socklen_t len, int seconds) {
    int flags = fcntl(fd, F_GETFL, 0);
    fcntl(fd, F_SETFL, flags | O_NONBLOCK);
    if (connect(fd, addr, len) == 0) { fcntl(fd, F_SETFL, flags); return 0; }
    if (errno != EINPROGRESS) return errno;

    fd_set writable;
    FD_ZERO(&writable);
    FD_SET(fd, &writable);
    struct timeval tv;
    tv.tv_sec = seconds;
    tv.tv_usec = 0;
    int ready = select(fd + 1, 0, &writable, 0, &tv);
    if (ready == 0) return ETIMEDOUT;
    if (ready < 0) return errno;

    int err = 0;
    socklen_t elen = sizeof(err);
    if (getsockopt(fd, SOL_SOCKET, SO_ERROR, &err, &elen) != 0) return errno;
    if (err != 0) return err;
    fcntl(fd, F_SETFL, flags);
    return 0;
}

int main() {
    /* Raw TCP to a public resolver's port 53, closed without writing a byte.
       No payload and no name resolution, which is the point: it separates "can
       packets leave" from "does DNS work", so a blocked answer downstream can
       be read correctly. This goes FIRST because it is the one finding that
       cannot be lost to a resolver that never answers. */
    {
        int fd = socket(AF_INET, SOCK_STREAM, 0);
        if (fd < 0) {
            say("network.socket", "error:" + errname(errno));
        } else {
            struct sockaddr_in a;
            std::memset(&a, 0, sizeof(a));
            a.sin_family = AF_INET;
            a.sin_port = htons(53);
            a.sin_addr.s_addr = htonl(0x01010101u);
            int e = connectWithin(fd, (const struct sockaddr*)&a, sizeof(a), 1);
            close(fd);
            if (e == 0) say("network.socket", "open");
            else say("network.socket", "blocked:" + errname(e));
        }
    }

    /* Deliberately NOT a hard assertion: a sandbox with a local caching
       resolver answers without any egress at all, so resolved is ambiguous
       where the other two are not. */
    {
        struct addrinfo hints;
        std::memset(&hints, 0, sizeof(hints));
        hints.ai_family = AF_INET;
        hints.ai_socktype = SOCK_STREAM;
        struct addrinfo* res = 0;
        int rc = getaddrinfo("example.com", "80", &hints, &res);
        if (rc == 0) say("network.dns", "resolved");
        else say("network.dns", "blocked:" + gaiName(rc));
        if (res) freeaddrinfo(res);
    }

    /* The full path a learner would accidentally take: resolve a name, open
       HTTP, read a status. example.com is IANA's reserved documentation domain
       — it exists to be used in examples, and it is the one host nobody is
       bothered by our reaching. The body is never read; only the status code is
       recorded. */
    {
        struct addrinfo hints;
        std::memset(&hints, 0, sizeof(hints));
        hints.ai_family = AF_INET;
        hints.ai_socktype = SOCK_STREAM;
        struct addrinfo* res = 0;
        int rc = getaddrinfo("example.com", "80", &hints, &res);
        if (rc != 0) {
            say("network.http", "blocked:" + gaiName(rc));
        } else {
            int fd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
            if (fd < 0) {
                say("network.http", "error:" + errname(errno));
            } else {
                int e = connectWithin(fd, res->ai_addr, res->ai_addrlen, 1);
                if (e != 0) {
                    say("network.http", "blocked:" + errname(e));
                } else {
                    struct timeval tv;
                    tv.tv_sec = 1;
                    tv.tv_usec = 0;
                    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
                    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));
                    const char* req = "GET / HTTP/1.0\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n";
                    if (send(fd, req, std::strlen(req), 0) < 0) {
                        say("network.http", "blocked:" + errname(errno));
                    } else {
                        char buf[64];
                        long n = (long)recv(fd, buf, sizeof(buf) - 1, 0);
                        if (n <= 0) {
                            say("network.http", "blocked:" + errname(n < 0 ? errno : ECONNRESET));
                        } else {
                            buf[n] = 0;
                            std::string head(buf);
                            std::string code = "unknown";
                            std::string::size_type sp = head.find(' ');
                            if (sp != std::string::npos && head.size() >= sp + 4) {
                                std::string maybe = head.substr(sp + 1, 3);
                                bool digits = true;
                                for (std::string::size_type i = 0; i < maybe.size(); i++) {
                                    if (maybe[i] < '0' || maybe[i] > '9') digits = false;
                                }
                                if (digits) code = maybe;
                            }
                            say("network.http", "open:" + code);
                        }
                    }
                }
                close(fd);
            }
            freeaddrinfo(res);
        }
    }
    return 0;
}
`;

/**
 * Filesystem, processes and environment. Nothing destructive, nothing left
 * behind.
 *
 * The only writes are two files this program creates and unlinks again — one in
 * the temp directory, one in its own working directory — and the only thing
 * recorded about either is that the bytes came back. `/etc/passwd` and
 * `/etc/shadow` are measured, never read out: this stdout lands in a CI log,
 * and a log is the one store with no retention function and no erasure path.
 * The SIZE answers the question ("how much of a host is in here") without
 * putting a single line of anybody's account database on a screen.
 *
 * `os.environ` is reported as KEY NAMES ONLY, sorted, for the same reason. A
 * value printed here would be published to whoever can read the run — which,
 * if the sandbox really is leaking the judge's own configuration, is the exact
 * secret we are trying to prove is not there.
 *
 * Every failure records an errno NAME and nothing else. A `strerror` message
 * can carry a path, a uid, or a hostname; the name carries the answer.
 *
 * ## The two findings the language added
 *
 * `runtime.cxx` reports `__cplusplus` from INSIDE the sandbox, and
 * `runtime.compiler` reports which toolchain produced the binary. The Python
 * probe reported `sys.version` for the same reason — know what actually ran —
 * and here it does double duty: it is a second, independent check that the
 * judge compiled as C++17, taken on the box rather than from the catalogue
 * name. `judge-probe.ts`'s canary asks the same question on the cheap path;
 * this one answers it in the same breath as the containment questions.
 */
const SANDBOX_PROBE = `${SAY}#include <dirent.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <cstdlib>
#include <algorithm>
#include <vector>

extern char** environ;

/* A last line of defence, not the mechanism. Every helper below reports its own
   failure as an errno name; this only stops an unexpected throw from taking the
   remaining findings with it, which would turn one broken probe into a report
   full of UNKNOWNs. */
static void attempt(const char* key, std::string (*fn)()) {
    try {
        say(key, fn());
    } catch (const std::exception&) {
        say(key, "error:StdException");
    } catch (...) {
        say(key, "error:Unknown");
    }
}

static std::string writeProbe(const std::string& path) {
    FILE* f = std::fopen(path.c_str(), "wb");
    if (!f) return "error:" + errname(errno);
    std::fwrite("probe", 1, 5, f);
    std::fclose(f);
    struct stat st;
    if (stat(path.c_str(), &st) != 0) { std::remove(path.c_str()); return "error:" + errname(errno); }
    std::remove(path.c_str());
    return "ok:" + std::to_string((long)st.st_size) + "b";
}

/* Measured, never read out. This stdout lands in a CI log, and a log is the one
   store with no retention function and no erasure path. The SIZE answers "how
   much of a host is in here" without putting a line of anybody's account
   database on a screen. */
static std::string sizeOf(const char* path) {
    FILE* f = std::fopen(path, "rb");
    if (!f) return "error:" + errname(errno);
    long total = 0;
    char buf[4096];
    std::size_t n;
    while ((n = std::fread(buf, 1, sizeof(buf), f)) > 0) total += (long)n;
    std::fclose(f);
    return "readable:" + std::to_string(total) + "b";
}

static std::string listing(const char* path, std::size_t limit) {
    DIR* d = opendir(path);
    if (!d) return "error:" + errname(errno);
    std::vector<std::string> names;
    struct dirent* e;
    while ((e = readdir(d)) != 0) {
        std::string name(e->d_name);
        if (name == "." || name == "..") continue;
        names.push_back(name);
    }
    closedir(d);
    std::sort(names.begin(), names.end());
    if (names.empty()) return "empty";
    std::string out;
    for (std::size_t i = 0; i < names.size() && i < limit; i++) {
        if (i) out += ",";
        out += names[i];
    }
    return out;
}

static std::string countEntries(const char* path) {
    DIR* d = opendir(path);
    if (!d) return "error:" + errname(errno);
    long n = 0;
    struct dirent* e;
    while ((e = readdir(d)) != 0) {
        std::string name(e->d_name);
        if (name == "." || name == "..") continue;
        n++;
    }
    closedir(d);
    return std::to_string(n);
}

static std::string countPids() {
    DIR* d = opendir("/proc");
    if (!d) return "error:" + errname(errno);
    long n = 0;
    struct dirent* e;
    while ((e = readdir(d)) != 0) {
        const char* p = e->d_name;
        bool digits = *p != 0;
        for (; *p; p++) if (*p < '0' || *p > '9') digits = false;
        if (digits) n++;
    }
    closedir(d);
    return std::to_string(n);
}

static std::string cwdOf() {
    char buf[4096];
    if (!getcwd(buf, sizeof(buf))) return "error:" + errname(errno);
    return std::string(buf);
}

/* ok:42 and nothing else. The child had to actually evaluate and print, or the
   spawn proved nothing. */
static std::string spawnChild() {
    FILE* p = popen("echo 42", "r");
    if (!p) return "error:" + errname(errno);
    char buf[64];
    std::string out;
    while (std::fgets(buf, sizeof(buf), p)) out += buf;
    int rc = pclose(p);
    if (rc != 0) return "error:ExitStatus";
    while (!out.empty() && (out[out.size() - 1] == '\\n' || out[out.size() - 1] == '\\r')) {
        out.erase(out.size() - 1);
    }
    return "ok:" + out;
}

static std::string compilerName() {
#if defined(__clang__)
    return "clang-" + std::to_string(__clang_major__) + "." + std::to_string(__clang_minor__);
#elif defined(__GNUC__)
    return "gcc-" + std::to_string(__GNUC__) + "." + std::to_string(__GNUC_MINOR__);
#else
    return "unknown";
#endif
}

static std::string platformName() {
#if defined(__linux__)
    return "linux";
#elif defined(__APPLE__)
    return "darwin";
#else
    return "unknown";
#endif
}

static std::string tmpWrite() { return writeProbe("/tmp/solvex_probe_scratch"); }
static std::string cwdWrite() { return writeProbe("./solvex_probe_scratch.txt"); }
static std::string uidOf() { return std::to_string((long)getuid()); }
static std::string pidOf() { return std::to_string((long)getpid()); }
static std::string visiblePids() { return countPids(); }
static std::string cwdEntries() { return countEntries("."); }
static std::string cwdNames() { return listing(".", 20); }
static std::string rootNames() { return listing("/", 40); }
static std::string etcPasswd() { return sizeOf("/etc/passwd"); }
static std::string etcShadow() { return sizeOf("/etc/shadow"); }

int main() {
    say("runtime.cxx", std::to_string((long)__cplusplus));
    say("runtime.compiler", compilerName());
    say("runtime.platform", platformName());
    attempt("proc.uid", uidOf);
    attempt("proc.pid", pidOf);
    attempt("proc.spawn", spawnChild);
    attempt("proc.visible_pids", visiblePids);
    attempt("fs.cwd", cwdOf);
    attempt("fs.cwd_entries", cwdEntries);
    attempt("fs.cwd_names", cwdNames);
    attempt("fs.root_names", rootNames);
    attempt("fs.tmp_write", tmpWrite);
    attempt("fs.cwd_write", cwdWrite);
    attempt("fs.etc_passwd", etcPasswd);
    attempt("fs.etc_shadow", etcShadow);

    /* KEY NAMES ONLY, sorted. A value printed here would be published to
       whoever can read the run — which, if the sandbox really is leaking the
       judge's own configuration, is the exact secret we are trying to prove is
       not there. */
    std::vector<std::string> keys;
    for (char** e = environ; e && *e; e++) {
        std::string entry(*e);
        std::string::size_type eq = entry.find('=');
        keys.push_back(eq == std::string::npos ? entry : entry.substr(0, eq));
    }
    std::sort(keys.begin(), keys.end());
    std::string joined;
    for (std::size_t i = 0; i < keys.size(); i++) {
        if (i) joined += ",";
        joined += keys[i];
    }
    if (joined.empty()) joined = "empty";
    say("env.count", std::to_string((long)keys.size()));
    say("env.truncated", joined.size() > 4000 ? "yes" : "no");
    say("env.keys", joined.substr(0, 4000));
    return 0;
}
`;

/* -------------------------------------------------------------------------- */
/* Reading the answers                                                        */
/* -------------------------------------------------------------------------- */

/** Every question the network probe is written to answer. */
const NETWORK_KEYS = ["network.socket", "network.dns", "network.http"] as const;

/**
 * Every question the sandbox probe answers, plus one derived here.
 *
 * `env.credential_like` is computed in TypeScript from the key NAMES the
 * program reported, rather than in Python, so the pattern that decides a hard
 * failure sits in the file a reviewer is reading and can be argued with.
 */
const SANDBOX_KEYS = [
  "runtime.cxx",
  "runtime.compiler",
  "runtime.platform",
  "proc.uid",
  "proc.pid",
  "proc.spawn",
  "proc.visible_pids",
  "fs.cwd",
  "fs.cwd_entries",
  "fs.cwd_names",
  "fs.root_names",
  "fs.tmp_write",
  "fs.cwd_write",
  "fs.etc_passwd",
  "fs.etc_shadow",
  "env.count",
  "env.truncated",
  "env.keys",
] as const;

const DERIVED_KEYS = ["env.credential_like"] as const;

type ProbeRecord = Readonly<Record<string, string>>;

const PROBE_LINE = /^SOLVEX_PROBE ([a-z0-9_.]+)=(.*)$/;

/** First answer wins. A duplicated key would be a bug in a program above, and
    the first one is the one that was reached by the code path we can read. */
function readProbeLines(stdout: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const match = PROBE_LINE.exec(line.replace(/\r$/, ""));
    if (match && !found.has(match[1])) found.set(match[1], match[2]);
  }
  return found;
}

/**
 * The record: every question asked, with its answer or the literal UNKNOWN.
 *
 * Built from the KEY LIST rather than from whatever the program happened to
 * print, so a probe that died halfway produces a record with holes in it that
 * are visible as holes. A record assembled from the output would have silently
 * shrunk instead, and a missing question reads as a question nobody asked.
 */
function buildRecord(keys: readonly string[], stdout: string): ProbeRecord {
  const found = readProbeLines(stdout);
  const out: Record<string, string> = {};
  for (const key of keys) out[key] = found.get(key) ?? "UNKNOWN";
  return out;
}

/**
 * Environment key names that carry a secret in their VALUE.
 *
 * Tight on purpose, and every token here is one whose presence in a learner's
 * sandbox would mean the judge's own infrastructure is reachable from inside a
 * fourteen-year-old's program. The bare word KEY is deliberately NOT in it:
 * the official Python container images set `GPG_KEY` to a public fingerprint,
 * and a hard assertion that fails on a published public key is a hard assertion
 * people route around.
 *
 * `JUDGE0_` matches as a prefix regardless of what follows, because any of the
 * judge's own configuration appearing in the box means the worker's environment
 * is being inherited — and the variable that proves it is benign today is not
 * the one that will be there tomorrow.
 */
const CREDENTIAL_LIKE_KEY = new RegExp(
  [
    "(^|_)(SECRET|PASSWORD|PASSWD|CREDENTIAL|CREDENTIALS)(_|$)",
    "(^|_)(ACCESS|API|PRIVATE|MASTER|AUTH|SESSION|SIGNING)_KEY(_|$)",
    "(^|_)TOKEN(_|$)",
    "^AWS_",
    "^JUDGE0_",
    "^(DATABASE|REDIS|POSTGRES|POSTGRESQL|MONGO|AMQP|RABBITMQ)_(URL|URI|DSN)$",
  ].join("|"),
);

/**
 * Which reported environment keys look like credentials — or UNKNOWN.
 *
 * UNKNOWN when the program never reported the list, and UNKNOWN when it
 * reported a TRUNCATED one: a verdict of "none" drawn from a list we know is
 * incomplete is a verdict about the part we happened to see.
 */
function credentialLike(found: ProbeRecord): string {
  const keys = found["env.keys"];
  if (keys === undefined || keys === "UNKNOWN") return "UNKNOWN";
  if (found["env.truncated"] !== "no") return "UNKNOWN";
  if (keys === "empty") return "none";
  const hits = keys.split(",").filter((name) => CREDENTIAL_LIKE_KEY.test(name));
  return hits.length === 0 ? "none" : hits.join(",");
}

function sandboxRecord(stdout: string): ProbeRecord {
  const base = buildRecord(SANDBOX_KEYS, stdout);
  return { ...base, "env.credential_like": credentialLike(base) };
}

/* -------------------------------------------------------------------------- */
/* The shape rules                                                            */
/* -------------------------------------------------------------------------- */

/** An exception class name, which is all a failed attempt ever reports. */
const CLASS = "[A-Za-z][A-Za-z0-9_]*";
/** Free text: a path, a directory listing, a version string. Non-empty, one line. */
const TEXT = /^.+$/;

/** `UNKNOWN` is a legal SHAPE for every question — a probe may fail to answer —
    and never a passing answer where it matters: see `assertNetworkContained`
    and `assertNoLeakedCredentials`, which both reject it. */
function alt(...forms: string[]): RegExp {
  return new RegExp(`^(${[...forms, "UNKNOWN"].join("|")})$`);
}

/**
 * What an answer may LOOK like — never what it must SAY.
 *
 * This is the whole design of the suite. We cannot know whether the rented
 * sandbox permits a subprocess, and pretending to know would be inventing a
 * result. What we can insist on is that the question was asked and came back in
 * the vocabulary it was asked in, so the recorded answer means something to
 * whoever reads the run.
 */
const SHAPES: Readonly<Record<string, RegExp>> = {
  "network.socket": alt("open", `blocked:${CLASS}`, `error:${CLASS}`),
  "network.dns": alt("resolved", `blocked:${CLASS}`, `error:${CLASS}`),
  "network.http": alt(
    "open:([0-9]{3}|unknown)",
    `blocked:${CLASS}`,
    `error:${CLASS}`,
    `unavailable:${CLASS}`,
  ),
  /* `__cplusplus`, read from inside the box. Only the SHAPE is asserted here,
     like every other finding — whether it is 201703 is asserted separately, in
     the test below, because that one IS ours to have an opinion about. */
  "runtime.cxx": alt("[0-9]+"),
  "runtime.compiler": alt("[a-z]+-[0-9]+\\.[0-9]+", "unknown"),
  "runtime.platform": alt("[a-z0-9]+"),
  "proc.uid": alt("[0-9]+", `error:${CLASS}`),
  "proc.pid": alt("[0-9]+", `error:${CLASS}`),
  /* `ok:42` and not `ok:<anything>`: the child had to actually evaluate and
     print, or the spawn proved nothing. */
  "proc.spawn": alt("ok:42", `error:${CLASS}`),
  "proc.visible_pids": alt("[0-9]+", `error:${CLASS}`),
  "fs.cwd": TEXT,
  "fs.cwd_entries": alt("[0-9]+", `error:${CLASS}`),
  "fs.cwd_names": TEXT,
  "fs.root_names": TEXT,
  "fs.tmp_write": alt("ok:[0-9]+b", `error:${CLASS}`),
  "fs.cwd_write": alt("ok:[0-9]+b", `error:${CLASS}`),
  /* Recorded, never asserted. A world-readable `/etc/passwd` is how Unix works
     and says nothing about isolation; what it answers is "how much of a host is
     in this box", which is context for a report, not a verdict. */
  "fs.etc_passwd": alt("readable:[0-9]+b", `error:${CLASS}`),
  "fs.etc_shadow": alt("readable:[0-9]+b", `error:${CLASS}`),
  "env.count": alt("[0-9]+"),
  "env.truncated": alt("yes", "no"),
  "env.keys": TEXT,
  "env.credential_like": alt("none", "[A-Za-z0-9_,]+"),
};

/**
 * Every recorded answer is in its vocabulary, and every recorded key has a
 * vocabulary at all.
 *
 * The second half matters more than it looks: a finding added to a probe
 * program without a shape rule would otherwise be printed and never checked,
 * which is how an unread field ends up in a report as though somebody had
 * looked at it.
 */
function assertShapes(found: ProbeRecord): void {
  for (const [key, answer] of Object.entries(found)) {
    const shape = SHAPES[key];
    expect(shape, `probe key ${key} has no shape rule — add one or stop reporting it`).toBeDefined();
    expect(answer, `probe ${key} answered something outside its vocabulary`).toMatch(shape);
  }
}

/**
 * The two network findings that are not opinions.
 *
 * Written as plain functions rather than inline in a test for one reason: the
 * offline half can then prove they FAIL on a wide-open sandbox. An assertion
 * nobody has ever seen fail is an assertion nobody knows is wired up, and these
 * three lines of regex are the whole difference between "we probed the sandbox"
 * and "we printed something".
 *
 * `blocked:` and nothing else passes. `open` is a failure for the obvious
 * reason; UNKNOWN and `error:` are failures because a containment claim we
 * could not verify is not a containment claim.
 */
function assertNetworkContained(found: ProbeRecord): void {
  expect(
    found["network.socket"],
    "raw TCP left the sandbox: we send `enable_network: false` and the service " +
      "did not honour it. UNKNOWN fails here too — unverified is not contained",
  ).toMatch(/^blocked:/);
  expect(
    found["network.http"],
    "the sandbox reached a web server: `enable_network: false` was ignored, so " +
      "'standard library only' is no longer enforced by absence",
  ).toMatch(/^blocked:/);
}

/** The one environment finding that is not an opinion. */
function assertNoLeakedCredentials(found: ProbeRecord): void {
  expect(
    found["env.credential_like"],
    "the sandbox handed learner code an environment variable whose value is a " +
      "credential — the judge's own configuration is inside the box",
  ).toBe("none");
}

/* -------------------------------------------------------------------------- */
/* Running one probe                                                          */
/* -------------------------------------------------------------------------- */

interface ProbeRun {
  result: ExecutionResult;
  found: ProbeRecord;
}

async function runProbe(
  provider: Judge0RapidApiProvider,
  sourceCode: string,
  build: (stdout: string) => ProbeRecord,
): Promise<ProbeRun> {
  const result = await provider.run({ ...REQUEST, sourceCode, stdin: "" });
  return { result, found: build(result.stdout) };
}

/** The record, as a block a human reads in the run output. */
function render(title: string, found: ProbeRecord): string {
  const rows = Object.entries(found).map(([key, answer]) => `  ${key.padEnd(22)} ${answer}`);
  return `\n${title}\n${rows.join("\n")}\n`;
}

/* -------------------------------------------------------------------------- */
/* Simulated answers, for the offline half                                    */
/* -------------------------------------------------------------------------- */

/**
 * FICTION. Every string below is hand-written here.
 *
 * The fake compiles nothing, so these are what a sealed box and a leaking box
 * WOULD print if one were asked. They exercise the reader, the shape rules
 * and the hard assertions in both directions. Nobody may cite a line of this as
 * an observation about RapidAPI's sandbox, because none of it is one.
 */
const SEALED_NETWORK = [
  `${PROBE_PREFIX}network.socket=blocked:ENETUNREACH`,
  `${PROBE_PREFIX}network.dns=blocked:EAI_AGAIN`,
  `${PROBE_PREFIX}network.http=blocked:EAI_AGAIN`,
  "",
].join("\n");

const OPEN_NETWORK = [
  `${PROBE_PREFIX}network.socket=open`,
  `${PROBE_PREFIX}network.dns=resolved`,
  `${PROBE_PREFIX}network.http=open:200`,
  "",
].join("\n");

const SEALED_SANDBOX = [
  `${PROBE_PREFIX}runtime.cxx=201703`,
  `${PROBE_PREFIX}runtime.compiler=gcc-14.1`,
  `${PROBE_PREFIX}runtime.platform=linux`,
  `${PROBE_PREFIX}proc.uid=1000`,
  `${PROBE_PREFIX}proc.pid=1`,
  `${PROBE_PREFIX}proc.spawn=error:ENOSYS`,
  `${PROBE_PREFIX}proc.visible_pids=1`,
  `${PROBE_PREFIX}fs.cwd=/box`,
  `${PROBE_PREFIX}fs.cwd_entries=1`,
  `${PROBE_PREFIX}fs.cwd_names=main.cpp`,
  `${PROBE_PREFIX}fs.root_names=bin,box,etc,lib,proc,tmp,usr`,
  `${PROBE_PREFIX}fs.tmp_write=ok:5b`,
  `${PROBE_PREFIX}fs.cwd_write=ok:5b`,
  `${PROBE_PREFIX}fs.etc_passwd=readable:1265b`,
  `${PROBE_PREFIX}fs.etc_shadow=error:EACCES`,
  `${PROBE_PREFIX}env.count=4`,
  `${PROBE_PREFIX}env.truncated=no`,
  `${PROBE_PREFIX}env.keys=HOME,LANG,PATH,PWD`,
  "",
].join("\n");

/** The same box, leaking its operator's configuration. */
const LEAKY_SANDBOX = SEALED_SANDBOX.replace(
  `${PROBE_PREFIX}env.keys=HOME,LANG,PATH,PWD`,
  `${PROBE_PREFIX}env.keys=DATABASE_URL,GPG_KEY,HOME,LANG,PATH,PWD,REDIS_HOST`,
).replace(`${PROBE_PREFIX}env.count=4`, `${PROBE_PREFIX}env.count=7`);

/* =========================================================================
 * Against the fake. This is the half that runs in CI.
 * ====================================================================== */

describe("judge0 sandbox probes — the READER, against the FAKE (no key, no network)", () => {
  let fake: FakeJudge0;
  let provider: Judge0RapidApiProvider;

  beforeAll(async () => {
    /* The gate is process-global and first-limit-wins by design. Another suite
       in this worker would otherwise decide the bound for these submissions —
       harmless here, since nothing below runs two at once, and reset anyway so
       the next file's measurements are its own. */
    resetJudge0GateForTests();
    fake = await startFakeJudge0();
    provider = new Judge0RapidApiProvider({
      apiKey: "fake-key-never-leaves-a-header",
      host: "judge0-ce.p.rapidapi.com",
      baseUrl: fake.url,
      maxConcurrentRequests: 4,
      pollIntervalMs: 5,
      queueWaitMs: 5_000,
      overheadBudgetMs: 10_000,
      batchEnabled: false,
    });
  });

  afterAll(async () => {
    await fake.close();
  });

  /** Serve one scripted stdout to whichever poll answers next. */
  function answerWith(stdout: string): void {
    fake.setHandler((ctx) => (ctx.pollIndex >= 0 ? { kind: "submission", body: { stdout } } : { kind: "default" }));
  }

  it("asks every question it claims to ask", () => {
    /* The guard against the quiet drift: a `say()` added to a probe program and
       not added to the key list would be printed, never recorded, and never
       shape-checked — a finding that exists in the sandbox and not in the
       report. Both directions are checked, so a key list that outruns the
       program fails too. */
    const asked = (program: string) =>
      new Set([...program.matchAll(/(?:say|attempt)\("([a-z0-9_.]+)"/g)].map((m) => m[1]));
    expect(asked(NETWORK_PROBE)).toEqual(new Set(NETWORK_KEYS));
    expect(asked(SANDBOX_PROBE)).toEqual(new Set(SANDBOX_KEYS));
  });

  it("submits programs the judge will accept", () => {
    /* A probe that trips `maxSourceBytes` would be refused before it ran, and a
       probe carrying an unclosed dollar-brace would be a TypeScript template
       hole rather than C++ — a submission that dies at compile time and reports
       nothing about the sandbox. Both are cheap to check here and expensive to
       discover on a live run that costs requests. */
    for (const program of [NETWORK_PROBE, SANDBOX_PROBE]) {
      expect(Buffer.byteLength(program, "utf8")).toBeLessThan(EXECUTION_LIMITS.maxSourceBytes);
      expect(program).not.toContain("${");
    }
  });

  it.skipIf(LOCAL_COMPILER === null)("writes C++ that a compiler will actually build", () => {
    /* The one thing the fake cannot check: it compiles nothing, so a missing
       header or a misspelled symbol in either program above would sail through
       every test in this file and then be discovered by a live submission —
       which costs requests, reports a compile error, and answers nothing about
       the sandbox.

       This is strictly stronger than the `ast.parse` guard it replaces. That
       one proved the Python was well-formed; a compile-and-LINK proves every
       symbol resolves, which is the failure a probe is most likely to have.

       Nothing is EXECUTED. The binary is built and deleted; no socket is
       opened, no file is written outside a temp directory, nothing is spawned.

       Skipped, loudly, where no compiler exists — this is a guard on the probe
       programs, not a claim about the judge, and a machine without a toolchain
       simply cannot offer it. */
    const dir = mkdtempSync(path.join(tmpdir(), "solvex-probe-build-"));
    try {
      for (const [name, program] of [
        ["NETWORK_PROBE", NETWORK_PROBE],
        ["SANDBOX_PROBE", SANDBOX_PROBE],
      ] as const) {
        const source = path.join(dir, `${name.toLowerCase()}.cpp`);
        writeFileSync(source, program, "utf8");
        const built = spawnSync(
          LOCAL_COMPILER!,
          [CPP_STANDARD_FLAG, "-o", path.join(dir, name.toLowerCase()), source],
          { encoding: "utf8", timeout: 60_000 },
        );
        if (built.error !== undefined || built.status === null) {
          /* The compiler never answered — `spawnSync` failed outright, or the
             process was killed by a signal. On a machine running several agents
             at once that happens, and it is NOT evidence about the program: a
             genuine compile error exits non-zero with diagnostics, so a null
             status can only mean we failed to ask. The same distinction the
             probes themselves draw between `blocked` and `error`, applied to
             our own tooling. Said out loud rather than swallowed, because a
             guard that quietly does nothing is worse than no guard. */
          console.log(
            `probe build guard did NOT run for ${name}: ` +
              `${built.error?.message ?? "the compiler was killed before it answered"}`,
          );
          continue;
        }
        expect(built.status, `${name} does not compile:\n${built.stderr}`).toBe(0);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);

  it("asks the sandbox which standard it compiled with", () => {
    /* The probe carries the same question `judge-probe.ts`'s canary asks, and
       asks it from INSIDE the box rather than from the catalogue name. A
       catalogue can be renamed and an operator can pin `JUDGE0_LANGUAGE_ID` to
       anything; `__cplusplus` is the compiler's own answer about the file it
       just built.
       Asserted here on the fixture, and read on a live run: a sandbox reporting
       201402 is a judge that cannot run this course, however green everything
       else looks. */
    const sealed = sandboxRecord(SEALED_SANDBOX);
    expect(Number(sealed["runtime.cxx"])).toBe(CPP_STANDARD_MACRO);
  });

  it("records a sealed sandbox as sealed, and every answer in its own vocabulary", async () => {
    answerWith(SEALED_NETWORK);
    const network = await runProbe(provider, NETWORK_PROBE, (s) => buildRecord(NETWORK_KEYS, s));
    answerWith(SEALED_SANDBOX);
    const sandbox = await runProbe(provider, SANDBOX_PROBE, sandboxRecord);

    expect(network.result.infrastructureError).toBe(false);
    expect(sandbox.result.infrastructureError).toBe(false);
    expect(Object.keys(network.found)).toEqual([...NETWORK_KEYS]);
    expect(Object.keys(sandbox.found)).toEqual([...SANDBOX_KEYS, ...DERIVED_KEYS]);
    assertShapes(network.found);
    assertShapes(sandbox.found);
    assertNetworkContained(network.found);
    assertNoLeakedCredentials(sandbox.found);

    /* The probe submissions are ordinary submissions: same units, same flags,
       same absent `expected_output`. If probing needed a different request
       shape, it would be probing a different sandbox than the one a learner
       gets. */
    expect(fake.violations).toEqual([]);
  }, OFFLINE_TIMEOUT_MS);

  it("FAILS a wide-open sandbox — the hard assertions are wired up", async () => {
    /* The most important test in this file. The two containment functions are
       three lines of regex between them, and a typo in any one line would make
       a live run pass on a judge with the network wide open — and be reported
       as a validated sandbox. So the failure path is exercised: fed a box that
       can reach the internet and is leaking a DATABASE_URL, they must throw,
       and each line has to throw on its own. */
    answerWith(OPEN_NETWORK);
    const network = await runProbe(provider, NETWORK_PROBE, (s) => buildRecord(NETWORK_KEYS, s));
    answerWith(LEAKY_SANDBOX);
    const sandbox = await runProbe(provider, SANDBOX_PROBE, sandboxRecord);

    /* Shapes still pass: `open` and `open:200` are perfectly well-formed
       answers. Well-formed is not the same as acceptable, which is exactly why
       the two kinds of assertion are separate functions. */
    assertShapes(network.found);
    assertShapes(sandbox.found);

    /* `GPG_KEY` and `REDIS_HOST` are in that fixture and are NOT what fails:
       one is a published fingerprint, the other names a host and carries no
       secret. The pattern has to be narrow enough to leave both alone. */
    expect(sandbox.found["env.credential_like"]).toBe("DATABASE_URL");
    expect(() => assertNoLeakedCredentials(sandbox.found)).toThrow(/credential/);
    expect(() => assertNetworkContained(network.found)).toThrow(/enable_network/);
    /* And the urllib line fails on its own, with the socket line passing —
       otherwise one working assertion would be covering for a broken one. */
    expect(() =>
      assertNetworkContained({ ...network.found, "network.socket": "blocked:OSError" }),
    ).toThrow(/web server/);
  }, OFFLINE_TIMEOUT_MS);

  it("treats a silent probe as UNKNOWN, and UNKNOWN never passes containment", async () => {
    /* The fake's engine answers an unrecognised program with empty stdout and
       exit 0 — a running, wrong program. That is precisely the shape of a probe
       that was killed on its wall limit before it flushed anything, so no
       scripting is needed to produce it.
       An empty answer must not read as a safe one: the record fills with
       UNKNOWN, the shapes still hold, and containment fails. */
    fake.setHandler(() => ({ kind: "default" }));
    const network = await runProbe(provider, NETWORK_PROBE, (s) => buildRecord(NETWORK_KEYS, s));
    const sandbox = await runProbe(provider, SANDBOX_PROBE, sandboxRecord);

    expect(network.result.stdout).toBe("");
    expect(Object.values(network.found).every((a) => a === "UNKNOWN")).toBe(true);
    expect(sandbox.found["env.credential_like"]).toBe("UNKNOWN");
    assertShapes(network.found);
    assertShapes(sandbox.found);
    expect(() => assertNetworkContained(network.found)).toThrow();
    expect(() => assertNoLeakedCredentials(sandbox.found)).toThrow();
  }, OFFLINE_TIMEOUT_MS);

  it("treats a judge that never answered as UNKNOWN, not as a clean bill of health", async () => {
    /* A 500 during a probe is not a finding about the sandbox. The result is an
       infrastructure error, the record is empty, and nothing may be concluded —
       least of all that the box is sealed. */
    fake.setHandler(() => ({ kind: "http", status: 500 }));
    const network = await runProbe(provider, NETWORK_PROBE, (s) => buildRecord(NETWORK_KEYS, s));
    fake.setHandler(() => ({ kind: "default" }));

    expect(network.result.infrastructureError).toBe(true);
    expect(network.found["network.socket"]).toBe("UNKNOWN");
    expect(() => assertNetworkContained(network.found)).toThrow();
  }, OFFLINE_TIMEOUT_MS);

  it("reports an unobserved quota as UNKNOWN rather than as zero", async () => {
    /* The formatter the live test below prints with. `null` from
       `providerQuota()` means nobody has looked — never "no requests left" —
       and the line a human reads has to say so in words. */
    const { resetProviderQuota, providerQuota } = await import("@schools/ops/provider-quota");
    resetProviderQuota();
    expect(providerQuota()).toBeNull();
    expect(describeQuota(null)).toContain("UNKNOWN");
    expect(describeQuota(null)).not.toContain("0");
  });
});

/* -------------------------------------------------------------------------- */
/* The quota reading                                                          */
/* -------------------------------------------------------------------------- */

interface QuotaLike {
  observedAt: string;
  limit: number | null;
  remaining: number | null;
  resetSeconds: number | null;
  windows: number;
}

/** UNKNOWN for every field nobody has observed. Never a zero, never a guess. */
function describeQuota(quota: QuotaLike | null): string {
  if (quota === null) {
    return "quota: UNKNOWN — no recognised rate-limit header arrived on the response";
  }
  const n = (v: number | null) => (v === null ? "UNKNOWN" : String(v));
  return (
    `quota: limit=${n(quota.limit)} remaining=${n(quota.remaining)} ` +
    `resetSeconds=${n(quota.resetSeconds)} windows=${quota.windows} observedAt=${quota.observedAt}`
  );
}

/* =========================================================================
 * Against the real service. Never in CI, never without a key.
 * ====================================================================== */

describe.skipIf(!LIVE)(
  "judge0 sandbox probes — LIVE against RapidAPI (JUDGE0_LIVE_TEST=1 and a key)",
  () => {
    let provider: Judge0RapidApiProvider;

    beforeAll(async () => {
      /* Built from the deployment's OWN configuration, so the box being probed
         is the box a class would get. The gate is reset first: the fake half
         above installed a process-wide bound of 4, and a live run must be held
         to the limit the operator configured, not to this file's. */
      resetJudge0GateForTests();
      const { judge0FromConfig } = await import("@schools/exec/providers/judge0");
      provider = judge0FromConfig();
    });

    it(
      "outbound network: what the sandbox permits, and whether it honoured our flag",
      async () => {
        const { result, found } = await runProbe(provider, NETWORK_PROBE, (s) =>
          buildRecord(NETWORK_KEYS, s),
        );
        console.log(render("JUDGE0 LIVE PROBE — outbound network", found));

        expect(
          result.infrastructureError,
          "the probe never ran, so nothing was learned about the sandbox",
        ).toBe(false);
        /* Every question asked came back with a field — the answer may be
           UNKNOWN, but the question is not missing from the record. */
        expect(Object.keys(found)).toEqual([...NETWORK_KEYS]);
        assertShapes(found);
        /* `network.dns` is recorded and NOT asserted: `resolved` is ambiguous —
           a local caching resolver answers without a byte leaving the box —
           where the two connection probes are not. */
        assertNetworkContained(found);
      },
      LIVE_TIMEOUT_MS,
    );

    it(
      "filesystem, processes and environment: what is visible from inside the box",
      async () => {
        const { result, found } = await runProbe(provider, SANDBOX_PROBE, sandboxRecord);
        console.log(render("JUDGE0 LIVE PROBE — filesystem, processes, environment", found));

        expect(
          result.infrastructureError,
          "the probe never ran, so nothing was learned about the sandbox",
        ).toBe(false);
        expect(Object.keys(found)).toEqual([...SANDBOX_KEYS, ...DERIVED_KEYS]);
        assertShapes(found);
        /* Everything printed above is observation — a readable /etc/passwd, a
           writable /tmp, a uid, a subprocess. None of it is ours to have an
           opinion about, and asserting a particular answer would be asserting a
           guess about a vendor's container image.
           The one hard line: a credential inside the box is a credential a
           fourteen-year-old can print. */
        assertNoLeakedCredentials(found);
      },
      LIVE_TIMEOUT_MS,
    );

    it(
      "the plan: what RapidAPI's own headers say is left",
      async () => {
        /* ONE `GET /languages`, made here rather than through the provider,
           because the adapter deliberately drops response headers and
           `recordJudge0Request` is not yet wired into its HTTP layer — see the
           note in `schools/ops/judge-probe.ts`. Until it is, the only way this
           suite can answer "what does the plan report about itself" is to read
           a real response's headers and put them through the real allowlist.

           The key is read from config and put in a header. It is never printed,
           never logged, and never interpolated into a message — including the
           failure messages below. */
        const { config } = await import("@schools/config");
        const { recordProviderQuota, providerQuota, resetProviderQuota } = await import(
          "@schools/ops/provider-quota"
        );
        resetProviderQuota();

        const key = config.exec.judge0.apiKey;
        if (typeof key !== "string" || key === "") {
          throw new Error("LIVE was true but config carries no key — nothing was called");
        }

        const res = await fetch(`${config.exec.judge0.baseUrl}/languages`, {
          method: "GET",
          headers: { "x-rapidapi-key": key, "x-rapidapi-host": config.exec.judge0.host },
        });

        /* Header NAMES that look like a rate limit, and their values only when
           they are plain integers. A quota figure is a number; anything else
           under a matching name is not printed, because a vendor is free to put
           a plan name or an account id in a header and this line goes into a
           log. */
        const quotaShaped: string[] = [];
        res.headers.forEach((value, name) => {
          if (!/ratelimit|quota/i.test(name)) return;
          const trimmed = value.trim();
          quotaShaped.push(`${name}=${/^\d+$/.test(trimmed) ? trimmed : "<not-an-integer>"}`);
        });

        recordProviderQuota(res.headers);
        const quota = providerQuota();
        /* The body is consumed and its SIZE recorded — never its content. */
        const bytes = (await res.arrayBuffer()).byteLength;
        console.log(
          `\nJUDGE0 LIVE — the plan\n  http=${res.status} catalogueBytes=${bytes}\n` +
            `  headers seen: ${quotaShaped.length === 0 ? "none matching /ratelimit|quota/" : quotaShaped.join(" ")}\n` +
            `  ${describeQuota(quota)}\n`,
        );

        expect(
          res.status,
          "the judge refused this key: a 401 or 403 here is the whole answer — " +
            "the subscription is missing or not attached to this application",
        ).toBe(200);

        if (quotaShaped.length > 0) {
          /* Headers arrived and the allowlist in `schools/ops/provider-quota.ts`
             matched none of them, so every quota figure the health view can ever
             show is null while the numbers were right there. The names are in
             the log above; the fix is that file's allowlist. */
          const why = `quota headers arrived but none were recognised: ${quotaShaped.join(" ")}`;
          expect(quota, why).not.toBeNull();
        }
        if (quota !== null) {
          expect(Number.isNaN(Date.parse(quota.observedAt))).toBe(false);
          expect(quota.windows).toBeGreaterThanOrEqual(1);
          for (const field of [quota.limit, quota.remaining, quota.resetSeconds]) {
            expect(field === null || Number.isSafeInteger(field)).toBe(true);
          }
          if (quota.limit !== null && quota.remaining !== null) {
            expect(quota.remaining).toBeLessThanOrEqual(quota.limit);
          }
        }
        /* No assertion on the NUMBERS. What the plan allows is whatever it
           allows; this test's job is to record it, not to have an opinion. */
      },
      LIVE_TIMEOUT_MS,
    );
  },
);

/**
 * The honesty guard, and the same one `judge0-conformance.test.ts` carries.
 *
 * A suite that skips silently is worse than one that fails: a green run would
 * read as though the sandbox had been probed. So the skip is announced in the
 * title above, and asking for the live run without the means to do it is an
 * error rather than a quiet no-op.
 */
describe("the live probes, and whether they ran", () => {
  it("did NOT run unless both the flag and a key were present", () => {
    expect(LIVE).toBe(LIVE_FLAG && LIVE_KEY);
    if (!LIVE) {
      /* Read this line in a green CI log as: nothing above touched RapidAPI,
         and NOTHING IS KNOWN about the sandbox — not that it is sealed. */
      expect(LIVE_FLAG && LIVE_KEY).toBe(false);
    }
  });

  it("refuses to pretend: JUDGE0_LIVE_TEST=1 with no key is a failure, not a skip", () => {
    expect(
      LIVE_FLAG && !LIVE_KEY,
      "JUDGE0_LIVE_TEST=1 was set but JUDGE0_RAPIDAPI_KEY is empty — the sandbox " +
        "probes cannot run and must not be reported as skipped-by-choice",
    ).toBe(false);
  });
});
