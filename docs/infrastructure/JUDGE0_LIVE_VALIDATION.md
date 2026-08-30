# Judge0 CE via RapidAPI — live validation

Produced by `npm run judge0:validate`. Every number below was measured against the real service during the run named in the header; nothing here is arithmetic, an estimate, or carried over from another document. Anything that was not measured is the literal word UNKNOWN.

The design decisions behind the adapter are `JUDGE0_RAPIDAPI_AUDIT.md`; the operator instructions and the *arithmetic* for capacity are `JUDGE0_RAPIDAPI_SETUP.md` §5. Where this document and §5 disagree, this one is the measurement and §5 is the model.

## The run

| | |
|---|---|
| Started | 2026-08-30T22:43:18.235Z |
| Finished | 2026-08-30T22:44:43.444Z |
| Command | `npm run judge0:validate -- --only=languages,conformance,probes,parity --max-submissions=50` |
| Host | `judge0-ce.p.rapidapi.com` |
| Base URL | `https://judge0-ce.p.rapidapi.com` |
| Phases selected | languages, conformance, probes, parity |
| Submission ceiling | 50 (`--max-submissions`) |

### What it spent

| | |
|---|---|
| Billable submissions created | **42** |
| HTTP API requests sent | **177** |
| …of which polls | 132 |
| …of which `GET /languages` | 2 |
| HTTP 429 | 0 |
| Other failed requests | 0 |
| POSTs the ceiling refused before sending | 0 |

Counted at `fetch`, which is the only place that cannot be wrong about it — a retry inside the adapter, a batch path, or a phase added later is counted here whether or not it knows this meter exists. `schools/ops/judge0-usage.ts` counts the same traffic from inside the provider and feeds the admin health view; the two are independent by design, and a disagreement between them is itself a finding.

## 1. Provider identity

Languages the service exposes: **71**.

### Every Python the service offers

| id | name | matches the adapter's discovery rule |
|---|---|---|
| 70 | `Python (2.7.17)` | **no** |
| 71 | `Python (3.8.1)` | yes |
| 92 | `Python (3.11.2)` | yes |
| 100 | `Python (3.12.5)` | yes |
| 109 | `Python (3.13.2)` | yes |
| 113 | `Python (3.14.0)` | yes |

The rule is `^Python\s*\((3(?:\.\d+)*)\)$`, anchored on purpose so `Python for ML (…)` is refused: that runtime ships numpy, and `schools/execution/python-policy.ts` enforces standard-library-only BY ABSENCE. Among the names that match, the highest version wins, compared numerically.

### What the adapter selected

| | |
|---|---|
| Language id | 113 |
| Catalogue name | `Python (3.14.0)` |
| Version parsed from the name | 3.14.0 |
| Operator override (`JUDGE0_LANGUAGE_ID`) | false |
| `sys.version`, from the interpreter itself | 3.14.0 | packaged by Anaconda, Inc. | (main, Oct 22 2025, 09:06:03) [GCC 11.2.0] |

A catalogue label is a string Judge0 wrote next to an id. `sys.version` is the interpreter answering for itself, and where the two disagree the interpreter wins.

### RapidAPI quota headers

| header | last value seen |
|---|---|
| `x-ratelimit-batched-submissions-limit` | `0` |
| `x-ratelimit-batched-submissions-remaining` | `-19` |
| `x-ratelimit-batched-submissions-reset` | `513748` |
| `x-ratelimit-submissions-limit` | `0` |
| `x-ratelimit-submissions-remaining` | `-1908` |
| `x-ratelimit-submissions-reset` | `513748` |

Looked for and **absent** — this is a finding, not an omission:

- `x-ratelimit-requests-limit`
- `x-ratelimit-requests-remaining`
- `x-ratelimit-requests-reset`
- `x-ratelimit-rapid-free-plans-hard-limit-limit`
- `x-ratelimit-rapid-free-plans-hard-limit-remaining`
- `x-ratelimit-rapid-free-plans-hard-limit-reset`
- `x-ratelimit-limit`
- `x-ratelimit-remaining`
- `x-ratelimit-reset`

`schools/ops/provider-quota.ts` reads exactly these names. Every one that is absent is a `null` in the health view's quota fields, permanently, and the plan dashboard is then the only meter there is.

### `GET /config_info` — the plan's own ceilings

| field | value |
|---|---|
| `cpu_time_limit` | 5 |
| `max_cpu_time_limit` | 20 |
| `wall_time_limit` | 10 |
| `max_wall_time_limit` | 30 |
| `memory_limit` | 256000 |
| `max_memory_limit` | 2048000 |
| `enable_network` | false |
| `max_submission_batch_size` | 20 |
| `max_queue_size` | 10000 |

We send `cpu_time_limit: 5` s, `wall_time_limit: 7` s and `memory_limit: 262144` KB. If any `max_*` above is below what we send, the plan either refuses the submission with a 400 — loud, and ours to fix — or **clamps it silently** and runs with its own default, which shrinks every learner's budget invisibly.

## 2. Conformance

**11 of 11** matched.

| # | program | normalised status | stdout | exit | wall ms | matched |
|---|---|---|---|---|---|---|
| 1 | hello-world | `ok` | "hello, world\n" | 0 | 2116 | yes |
| 2 | stdin-3-7 | `ok` | "10\n" | 0 | 2811 | yes |
| 3 | stdin-20-22 | `ok` | "42\n" | 0 | 1879 | yes |
| 4 | syntax-error | `compile_error` | (empty) | 1 | 1820 | yes |
| 5 | runtime-error | `runtime_error` | (empty) | 1 | 1866 | yes |
| 6 | eof-empty-stdin | `runtime_error` | (empty) | 1 | 1790 | yes |
| 7 | time-limit-exceeded | `time_limit_exceeded` | (empty) | 0 | 6373 | yes |
| 8 | kazakh-unicode | `ok` | "Сәлем, әлем!\n" | 0 | 1857 | yes |
| 9 | big-integer | `ok` | "100000000000000000000000000000000000000000000000000000000000… [102 chars total]" | 0 | 1810 | yes |
| 10 | output-bomb | `ok` | "0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n01234… [65536 chars total]" | 0 | 1985 | yes |
| 11 | non-zero-exit | `runtime_error` | "partial\n" | 7 | 2824 | yes |

#### hello-world

the judge runs a program at all and gives its stdout back intact

- Expected: `ok`, stdout exactly `hello, world\n`
- Status: `ok`, exit 0, wall 2116 ms, memory 52076 KB
- stdout: "hello, world\n"
- stderr: (empty)
- **Matched.**

#### stdin-3-7

stdin actually reaches the program. The answer is COMPUTED from the input, so a judge that silently dropped stdin cannot pass by coincidence — and dropping stdin is how a whole class gets graded wrong while every test stays green

- Expected: `ok`, stdout exactly `10\n`
- Status: `ok`, exit 0, wall 2811 ms, memory 52064 KB
- stdout: "10\n"
- stderr: (empty)
- **Matched.**

#### stdin-20-22

the same program on a different input — proof the answer is not a fixture

- Expected: `ok`, stdout exactly `42\n`
- Status: `ok`, exit 0, wall 1879 ms, memory 52568 KB
- stdout: "42\n"
- stderr: (empty)
- **Matched.**

#### syntax-error

a missing bracket is a program that NEVER RAN. Judge0 reports NZEC — a runtime failure — because CPython has no compile stage, and the shared `looksLikeCompileError` predicate is what turns that back into `compile_error`. The difference is what a fourteen-year-old is told: check your punctuation, or check your logic

- Expected: `compile_error`, stderr naming `SyntaxError`, not infrastructure
- Status: `compile_error`, exit 1, wall 1820 ms, memory 52948 KB
- stdout: (empty)
- stderr: "  File \"/box/script.py\", line 1\n    print(\n         ^\nSyntaxError: '(' was never closed\n"
- **Matched.**

#### runtime-error

a program that ran and raised is the learner's evidence, and the traceback survives

- Expected: `runtime_error`, stderr naming `ZeroDivisionError`
- Status: `runtime_error`, exit 1, wall 1866 ms, memory 52688 KB
- stdout: (empty)
- stderr: "Traceback (most recent call last):\n  File \"/box/script.py\", line 1, in <module>\n    print(1 / 0)\n          ~~^~~\nZeroDivisionError: division by zero\n"
- **Matched.**

#### eof-empty-stdin

a learner who pressed Check with an empty input box made a mistake; the judge did not have an outage. `EOFError` must be evidence, never `provider_error`

- Expected: `runtime_error`, `infrastructureError: false`
- Status: `runtime_error`, exit 1, wall 1790 ms, memory 53208 KB
- stdout: (empty)
- stderr: "Traceback (most recent call last):\n  File \"/box/script.py\", line 1, in <module>\n    a, b = map(int, input().split())\n                    ~~~~~^^\nEOFError: EOF when reading a line\n"
- **Matched.**

#### time-limit-exceeded

THE most important row. Judge0 reports the learner's exhausted CPU budget and its own bad day down one HTTP channel. One is a fact about a child's algorithm — December's whole month is about making programs fast — and the other says nothing about them at all

- Expected: `time_limit_exceeded`, `infrastructureError: false`, NOT `provider_timeout`
- Status: `time_limit_exceeded`, exit 0, wall 6373 ms, memory 52584 KB
- stdout: (empty)
- stderr: (empty)
- **Matched.**

#### kazakh-unicode

the product is written in Kazakh. Two bytes a character through a POST body, a queue, a container's stdout and a JSON response, and back out identical

- Expected: `ok`, stdout exactly `Сәлем, әлем!\n`
- Status: `ok`, exit 0, wall 1857 ms, memory 52964 KB
- stdout: "Сәлем, әлем!\n"
- stderr: (empty)
- **Matched.**

#### big-integer

`10**100` is a hundred and one digits of arbitrary precision. It proves the interpreter is CPython rather than something that quietly used a float, and that nothing in the chain reformatted a long numeric string

- Expected: `ok`, stdout exactly 1 followed by a hundred zeros
- Status: `ok`, exit 0, wall 1810 ms, memory 52296 KB
- stdout: "10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\n"
- stderr: (empty)
- **Matched.**

#### output-bomb

about 220 KB of stdout, well past our own 64 KiB ceiling and well under any file-size limit a judge enforces. So it tests OUR truncation, not the judge's SIGXFSZ — and truncation must not turn into a verdict

- Expected: `ok`, stdout truncated to exactly 65 536 characters
- Status: `ok`, exit 0, wall 1985 ms, memory 52076 KB
- stdout: "0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n0123456789\n012345678… [65536 chars total]"
- stderr: "\n[output truncated]"
- **Matched.**

#### non-zero-exit

a program that printed something and then exited 7. The output before the exit is still the learner's, and the exit code has to survive

- Expected: `runtime_error`, stdout `partial\n`, exit code 7
- Status: `runtime_error`, exit 7, wall 2824 ms, memory 51976 KB
- stdout: "partial\n"
- stderr: (empty)
- **Matched.**

## 3. Sandbox probes

Observational, non-destructive, and every one cleans up after itself. The point is to learn where the boundary actually is; an open boundary is reported as a security limitation of the rented judge, not worked around.

| probe | boundary | status |
|---|---|---|
| network | held | `ok` |
| filesystem | held | `ok` |
| tempfile | **OPEN** | `ok` |
| subprocess | **OPEN** | `ok` |
| environ | held | `ok` |

#### network

whether `enable_network: false` is honoured. The provider sends it explicitly on every submission — it is the CVE-2024-29021 default, and it is also the mechanism behind `python-policy.ts`'s standard-library-only guarantee, which works BY THE JUDGE HAVING NO NETWORK TO PIP FROM.

*How this stays harmless:* resolves and connects to example.com, IANA's reserved documentation domain, and sends it nothing but an ordinary GET / . No data of ours crosses the wire. Every timeout is 2 s, so three blocked checks still finish inside the 7 s wall limit.

```
dns|BLOCKED|gaierror
tcp|BLOCKED|gaierror
http|BLOCKED|URLError
```


#### filesystem

what a submission can see of the host: the working directory, the root, its own uid.

*How this stays harmless:* lists directory NAMES and asks os.access whether four well-known paths are readable. It never opens a file and never prints any file's contents.

```
cwd|OPEN|/box
root_entries|OPEN|bin,box,dev,etc,files,lib,lib64,proc,tmp,usr
cwd_entries|OPEN|run.sh,script.py
readable /etc/passwd|OPEN|exists
readable /etc/shadow|BLOCKED|exists
readable /proc/self/environ|OPEN|exists
readable /box|OPEN|exists
identity|OPEN|uid=113811004 gid=113811004
```


#### tempfile

whether a submission may write to disk at all — and where.

*How this stays harmless:* writes twelve bytes to a temporary file and to the working directory, then deletes both.

```
tempfile|OPEN|12 bytes under /tmp
cwd_write|OPEN|12 bytes into the working directory
```


#### subprocess

whether a submission can spawn a shell. It is the difference between a program sandbox and a machine, and it decides how much a hostile paste could do.

*How this stays harmless:* runs `id` and `uname -sr`, which read state and change nothing.

```
subprocess|OPEN|rc=0 uid=113811006 gid=113811006 groups=113811006 ~ Linux 6.8.0-137-generic
```

**SECURITY LIMITATION.** A submission can spawn a shell. Expected for an isolate-based judge — the isolation is the container and the cgroup, not the Python process — and worth writing down, because it means the only thing between a hostile paste and the judge's host is Judge0's own sandbox, which nothing here can test.

#### environ

which environment variables a submission inherits from the judge's host.

*How this stays harmless:* prints variable NAMES and the count, never a value. A judge host's environment can hold ITS operator's credentials, and a validation run must not copy somebody else's secret into a file in this repository.

```
env_count|OPEN|20
env_names|OPEN|CONDA_DEFAULT_ENV,CONDA_EXE,CONDA_PREFIX,CONDA_PREFIX_1,CONDA_PROMPT_MODIFIER,CONDA_PYTHON_EXE,CONDA_SHLVL,HOME,JUDGE0_HOMEPAGE,JUDGE0_MAINTAINER,JUDGE0_SOURCE_CODE,JUDGE0_VERSION,LANG,LANGUAGE,LC_ALL,LIBC_FATAL_STDERR_,PATH,PWD,SHLVL,_
```


## 4. Parity with the September curriculum

The programs are `tests/execution/parity-fixtures.ts` — real September reference solutions and the mutations a fourteen-year-old actually makes — run through Judge0 and compared against what the browser's Pyodide is asserted to produce. **Traceback prose is not compared:** CPython rewrote its diagnostics across 3.13 and 3.14, so the wording differs by interpreter vintage and that difference is documented, not a defect. Arithmetic, `//`, `%`, negatives, conditions, strings, Unicode and big integers ARE compared, and a divergence there is a real finding.

**25 of 25** matched.

| fixture | expected status | actual | stdout matched | note |
|---|---|---|---|---|
| int-input-square | `ok` | `ok` | yes |  |
| int-input-square-negative | `ok` | `ok` | yes |  |
| map-int-split | `ok` | `ok` | yes |  |
| string-input-concat | `ok` | `ok` | yes |  |
| f-string | `ok` | `ok` | yes |  |
| print-end-empty | `ok` | `ok` | yes |  |
| kazakh-output | `ok` | `ok` | yes |  |
| true-division-float-repr | `ok` | `ok` | yes |  |
| true-division-recurring | `ok` | `ok` | yes |  |
| floor-div-and-mod | `ok` | `ok` | yes |  |
| negative-floor-div-and-mod | `ok` | `ok` | yes |  |
| negative-modulo-parity | `ok` | `ok` | yes |  |
| seconds-to-hms | `ok` | `ok` | yes |  |
| mixed-int-float-arithmetic | `ok` | `ok` | yes |  |
| syntax-error-missing-colon | `compile_error` | `compile_error` | yes | traceback prose not compared — version-specific error wording |
| syntax-error-unclosed-paren | `compile_error` | `compile_error` | yes | traceback prose not compared — version-specific error wording |
| name-error | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| zero-division-error | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| index-error | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| value-error-int-of-text | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| eof-reading-past-the-input | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| eof-empty-input-box | `runtime_error` | `runtime_error` | yes | traceback prose not compared — version-specific error wording |
| runaway-loop | `time_limit_exceeded` | `time_limit_exceeded` | yes |  |
| output-bomb-ascii | `ok` | `ok` | yes |  |
| output-bomb-kazakh | `ok` | `ok` | yes |  |

## 5. Cost shape

Two different numbers, and the user asked for them separately: a **submission** is a program the judge ran, and an **API request** is an HTTP call the plan meters. One submission is one POST plus however many polls it took to see a terminal status, so requests are always the larger number and they are the one on the invoice.

Not run. Every figure below is UNKNOWN.

## 6. Staged concurrency

Widths 1, 2, 4, 8, in that order, stopping **permanently** at the first 429 or provider error. Eighteen simultaneous submissions are never issued: the server already queues, the plan's limits are the operator's to spend, and a load test that breaks a subscription to prove the subscription can break is not a test.

Not run. Every figure below is UNKNOWN.

## Findings

| severity | phase | finding |
|---|---|---|
| note | languages | None of the quota headers `schools/ops/provider-quota.ts` reads arrived, so `providerQuota()` stays null on this plan and the RapidAPI dashboard is the only meter there is. The service DID send 6 other x-ratelimit-* header(s) — x-ratelimit-batched-submissions-limit, x-ratelimit-batched-submissions-remaining, x-ratelimit-batched-submissions-reset, x-ratelimit-submissions-limit, x-ratelimit-submissions-remaining, x-ratelimit-submissions-reset — which that module does not know about; teaching it those names would give the health view a real meter. |
| **security** | probes | subprocess: A submission can spawn a shell. Expected for an isolate-based judge — the isolation is the container and the cgroup, not the Python process — and worth writing down, because it means the only thing between a hostile paste and the judge's host is Judge0's own sandbox, which nothing here can test. |

## What this run did NOT establish

A validation is only worth what its boundaries are. These remain open after this run and are not made truer by anything above:

- **Whether the sandbox is a sandbox.** The probes in §3 describe what a submission could see from inside. Nothing here tests isolation between submissions, escape from the container, or what Judge0's operator can read.
- **Residency, which is known rather than unknown.** This provider sends learner source code out of Kazakhstan, against the commitment recorded in `docs/CODE_EXECUTION_DECISION.md`. No measurement changes that.
- **What the plan costs, and what is left of it.** §1 records the quota headers the service actually sent. Anything it did not send is not knowable from here and the dashboard is the only meter.
- **Behaviour under a real class.** §6 stops at width 8 by design. Eighteen learners pressing Check inside ten seconds was not simulated and must not be inferred from it.
- **`POST /submissions/batch`.** `JUDGE0_BATCH` is off by default and this run did not turn it on. Whether the plan exposes the batch endpoints, and its `max_submission_batch_size`, is unchanged by this document.

---

Regenerate with `npm run judge0:validate`. The key is read from `JUDGE0_RAPIDAPI_KEY` in the environment, is never written to this file, and the writer refuses to save a document it appears in.
