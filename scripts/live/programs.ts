import type { ExecutionResult } from "@schools/exec/provider";
import { BIG_INT_TEXT, PROGRAMS } from "../../tests/exec/judge0-fake";

/**
 * The programs the live run sends, and what each one is asked to prove.
 *
 * ## Why the conformance programs are imported rather than retyped
 *
 * `tests/exec/judge0-fake.ts` already holds them, written as REAL Python so
 * that the same source can be answered by the fake in CI and by CPython on a
 * rented judge. Retyping them here would create a second definition that drifts
 * from the first, and the drift would be invisible: both suites would still be
 * green, about different programs. One table, two judges — the same argument
 * the conformance suite makes for being one suite.
 *
 * ## The sandbox probes are new, and are OBSERVATIONS
 *
 * Nothing below attacks anything. Each probe asks a question a Python program
 * is entitled to ask about its own process — can I resolve a name, what is in
 * my working directory, may I spawn a shell — prints the answer, and cleans up
 * after itself. Nothing is written that is not deleted, nothing is read whose
 * CONTENTS are printed, and no data leaves the judge: the network probe talks to
 * `example.com`, IANA's reserved documentation domain, and sends it nothing.
 *
 * The honest result may well be that a boundary is open. If `enable_network:
 * false` is not honoured, that is a security limitation of the rented judge and
 * the report says so — it is not something to work around, and it is certainly
 * not something to leave undiscovered because the probe was too polite to ask.
 */

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
    id: "syntax-error",
    what:
      "a missing bracket is a program that NEVER RAN. Judge0 reports NZEC — a runtime " +
      "failure — because CPython has no compile stage, and the shared " +
      "`looksLikeCompileError` predicate is what turns that back into `compile_error`. " +
      "The difference is what a fourteen-year-old is told: check your punctuation, or " +
      "check your logic",
    source: PROGRAMS.syntax,
    stdin: "",
    expected: "`compile_error`, stderr naming `SyntaxError`, not infrastructure",
    verify: (r) =>
      statusMismatch(r, "compile_error") ??
      (r.stderr.includes("SyntaxError") ? null : "stderr did not name SyntaxError"),
  },
  {
    id: "runtime-error",
    what: "a program that ran and raised is the learner's evidence, and the traceback survives",
    source: PROGRAMS.divZero,
    stdin: "",
    expected: "`runtime_error`, stderr naming `ZeroDivisionError`",
    verify: (r) =>
      statusMismatch(r, "runtime_error") ??
      (r.stderr.includes("ZeroDivisionError") ? null : "stderr did not name ZeroDivisionError"),
  },
  {
    id: "eof-empty-stdin",
    what:
      "a learner who pressed Check with an empty input box made a mistake; the judge did " +
      "not have an outage. `EOFError` must be evidence, never `provider_error`",
    source: PROGRAMS.sumPair,
    stdin: "",
    expected: "`runtime_error`, `infrastructureError: false`",
    verify: (r) =>
      statusMismatch(r, "runtime_error") ??
      (r.infrastructureError ? "it was reported as an infrastructure failure" : null),
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
    id: "big-integer",
    what:
      "`10**100` is a hundred and one digits of arbitrary precision. It proves the " +
      "interpreter is CPython rather than something that quietly used a float, and that " +
      "nothing in the chain reformatted a long numeric string",
    source: PROGRAMS.bigInt,
    stdin: "",
    expected: "`ok`, stdout exactly 1 followed by a hundred zeros",
    verify: (r) =>
      statusMismatch(r, "ok") ??
      (r.stdout.trim() === BIG_INT_TEXT ? null : `stdout was ${r.stdout.length} characters, not the expected 101`),
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
  if (result.stdout.trim() === "") {
    return {
      boundary: "unknown",
      detail: `the probe printed nothing (status ${result.status})`,
      securityNote: null,
    };
  }
  return null;
}

export const SANDBOX_PROBES: readonly SandboxProbe[] = [
  {
    id: "network",
    what:
      "whether `enable_network: false` is honoured. The provider sends it explicitly on " +
      "every submission — it is the CVE-2024-29021 default, and it is also the mechanism " +
      "behind `python-policy.ts`'s standard-library-only guarantee, which works BY THE " +
      "JUDGE HAVING NO NETWORK TO PIP FROM",
    safety:
      "resolves and connects to example.com, IANA's reserved documentation domain, and " +
      "sends it nothing but an ordinary GET / . No data of ours crosses the wire. Every " +
      "timeout is 2 s, so three blocked checks still finish inside the 7 s wall limit.",
    source: [
      "import socket",
      "",
      "def report(name, fn):",
      "    try:",
      "        print(name + '|OPEN|' + str(fn()))",
      "    except Exception as exc:",
      "        print(name + '|BLOCKED|' + type(exc).__name__)",
      "",
      "def dns():",
      "    return socket.getaddrinfo('example.com', 80)[0][4][0]",
      "",
      "def tcp():",
      "    sock = socket.create_connection(('example.com', 80), timeout=2)",
      "    peer = sock.getpeername()[0]",
      "    sock.close()",
      "    return peer",
      "",
      "def http():",
      "    import urllib.request",
      "    with urllib.request.urlopen('http://example.com/', timeout=2) as response:",
      "        return response.status",
      "",
      "report('dns', dns)",
      "report('tcp', tcp)",
      "report('http', http)",
    ].join("\n"),
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
            "guarantee `schools/execution/python-policy.ts` enforces by absence: a learner " +
            "could pip-install or fetch a solution. It is a programme decision, not a " +
            "provider bug to work around."
          : null,
      };
    },
  },
  {
    id: "filesystem",
    what: "what a submission can see of the host: the working directory, the root, its own uid",
    safety:
      "lists directory NAMES and asks os.access whether four well-known paths are " +
      "readable. It never opens a file and never prints any file's contents.",
    source: [
      "import os",
      "",
      "print('cwd|OPEN|' + os.getcwd())",
      "try:",
      "    print('root_entries|OPEN|' + ','.join(sorted(os.listdir('/'))[:40]))",
      "except Exception as exc:",
      "    print('root_entries|BLOCKED|' + type(exc).__name__)",
      "try:",
      "    print('cwd_entries|OPEN|' + ','.join(sorted(os.listdir('.'))[:40]))",
      "except Exception as exc:",
      "    print('cwd_entries|BLOCKED|' + type(exc).__name__)",
      "for path in ('/etc/passwd', '/etc/shadow', '/proc/self/environ', '/box'):",
      "    state = 'OPEN' if os.access(path, os.R_OK) else 'BLOCKED'",
      "    exists = 'exists' if os.path.exists(path) else 'absent'",
      "    print('readable ' + path + '|' + state + '|' + exists)",
      "try:",
      "    print('identity|OPEN|uid=' + str(os.getuid()) + ' gid=' + str(os.getgid()))",
      "except Exception as exc:",
      "    print('identity|BLOCKED|' + type(exc).__name__)",
    ].join("\n"),
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
    safety: "writes twelve bytes to a temporary file and to the working directory, then deletes both.",
    source: [
      "import os",
      "import tempfile",
      "",
      "def report(name, fn):",
      "    try:",
      "        print(name + '|OPEN|' + str(fn()))",
      "    except Exception as exc:",
      "        print(name + '|BLOCKED|' + type(exc).__name__)",
      "",
      "def temp():",
      "    with tempfile.NamedTemporaryFile('w', delete=False) as handle:",
      "        handle.write('solvex probe')",
      "        path = handle.name",
      "    size = os.path.getsize(path)",
      "    os.unlink(path)",
      "    return str(size) + ' bytes under ' + os.path.dirname(path)",
      "",
      "def here():",
      "    with open('solvex_probe.txt', 'w') as handle:",
      "        handle.write('solvex probe')",
      "    size = os.path.getsize('solvex_probe.txt')",
      "    os.remove('solvex_probe.txt')",
      "    return str(size) + ' bytes into the working directory'",
      "",
      "report('tempfile', temp)",
      "report('cwd_write', here)",
    ].join("\n"),
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      /* Writing to a scratch directory is what an interpreter does; it is only
         interesting alongside the other probes, and it is not on its own a
         limitation. Recorded as an observation, not as a finding. */
      return { boundary: anyOpen(result) ? "open" : "held", detail: lines(result).join("\n"), securityNote: null };
    },
  },
  {
    id: "subprocess",
    what:
      "whether a submission can spawn a shell. It is the difference between a program " +
      "sandbox and a machine, and it decides how much a hostile paste could do",
    safety: "runs `id` and `uname -sr`, which read state and change nothing.",
    source: [
      "import subprocess",
      "",
      "try:",
      "    done = subprocess.run(['/bin/sh', '-c', 'id; uname -sr'],",
      "                          capture_output=True, text=True, timeout=3)",
      "    joined = ' ~ '.join(line for line in done.stdout.split('\\n') if line)",
      "    print('subprocess|OPEN|rc=' + str(done.returncode) + ' ' + joined)",
      "except Exception as exc:",
      "    print('subprocess|BLOCKED|' + type(exc).__name__)",
    ].join("\n"),
    interpret(result) {
      const early = unreadable(result);
      if (early) return early;
      const open = anyOpen(result);
      return {
        boundary: open ? "open" : "held",
        detail: lines(result).join("\n"),
        securityNote: open
          ? "A submission can spawn a shell. Expected for an isolate-based judge — the " +
            "isolation is the container and the cgroup, not the Python process — and worth " +
            "writing down, because it means the only thing between a hostile paste and the " +
            "judge's host is Judge0's own sandbox, which nothing here can test."
          : null,
      };
    },
  },
  {
    id: "environ",
    what: "which environment variables a submission inherits from the judge's host",
    safety:
      "prints variable NAMES and the count, never a value. A judge host's environment can " +
      "hold ITS operator's credentials, and a validation run must not copy somebody else's " +
      "secret into a file in this repository.",
    source: [
      "import os",
      "",
      "names = sorted(os.environ.keys())",
      "print('env_count|OPEN|' + str(len(names)))",
      "print('env_names|OPEN|' + ','.join(names))",
    ].join("\n"),
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
