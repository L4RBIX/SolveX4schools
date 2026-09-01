# Judge0 CE via RapidAPI — live validation (GNU C++17)

Every number below was measured against the real service on the date in the
header. Nothing here is arithmetic, an estimate, or carried over from another
document. Anything that was not measured is the literal word UNKNOWN.

The design decisions behind the adapter are `JUDGE0_RAPIDAPI_AUDIT.md`; the
operator instructions and the *arithmetic* for capacity are
`JUDGE0_RAPIDAPI_SETUP.md` §5; the two-engine language facts are
`docs/cpp17/CPP17_JUDGE_PARITY.md`. Where this document and any of those
disagree, this one is the measurement and they are the model.

> **This is a FOCUSED run, not `npm run judge0:validate`.** Read §0 before
> reading anything as complete. The previous version of this file was the
> **Python-era** report and is preserved whole at
> `JUDGE0_LIVE_VALIDATION_PYTHON_ERA.md`.

## 0. What was run, and why it was not the full validator

`npm run judge0:validate` at its defaults selects all six phases and would spend
**17 billable submissions before parity even starts** — 1 for compiler identity,
11 for conformance, 5 for the sandbox probes — with parity, cost and concurrency
skipped whole under the default `--max-submissions=25`. That is over the budget
this regeneration was given, so the full validator was **not** run.

Instead: a focused set of live probes, driven through the **same production
adapter** (`Judge0RapidApiProvider`) with the same `EXECUTION_LIMITS` a learner
is judged under, metered at `fetch` by the same `scripts/live/wire.ts` meter the
validator uses. The assertions are on the **normalised `ExecutionResult`**, not
on Judge0's raw JSON, so what is recorded is what the product would actually
show a child.

What this buys and what it does not: it establishes **identity** and the
**normalisation contract** on the engine that grades. It does not replace the
validator's 11-case conformance table or its 5 sandbox probes, and §7 says so.

| | |
|---|---|
| Date | **2026-09-01** |
| Reconnaissance (free) | 14:07:05.736Z → 14:07:06.654Z |
| Probes | 14:07:16.450Z → 14:07:35.584Z |
| `compiler_options` follow-up | 14:08:16.965Z |
| Host | `judge0-ce.p.rapidapi.com` |
| Base URL | `https://judge0-ce.p.rapidapi.com` |
| Client | Node v24.14.1, darwin arm64, `tsx` |
| Key | `JUDGE0_RAPIDAPI_KEY` — **present**. Never printed, logged, or written here. |

### What it spent

| | reconnaissance | probes | follow-up | **total** |
|---|---|---|---|---|
| Billable submissions | 0 | 7 | 1 | **8** |
| HTTP API requests | 3 | 32 | 6 | **41** |
| …of which polls | 0 | 22 | 4 | 26 |
| …`POST /submissions` | 0 | 7 | 1 | 8 |
| …`GET /languages` | 2 | 2 | 0 | 4 |
| …`GET /config_info` | 1 | 1 | 1 | 3 |
| HTTP 429 | 0 | 0 | 0 | **0** |
| Other failed requests | 0 | 0 | 0 | **0** |

Counted at `fetch`, which is the only place that cannot be wrong about it. Every
response was 200 or 201. **No rate limit was hit at any point**, so nothing in
this document is a partial result standing in for a refused one.

## 1. Provider identity

Languages the service exposes: **71**.

### Every C++ and Clang entry the service offers

| id | name | matches the adapter's discovery rule |
|---|---|---|
| 52 | `C++ (GCC 7.4.0)` | **no** |
| 53 | `C++ (GCC 8.3.0)` | **no** |
| 54 | `C++ (GCC 9.2.0)` | **no** |
| 75 | `C (Clang 7.0.1)` | **no** |
| 76 | `C++ (Clang 7.0.1)` | **no** |
| 79 | `Objective-C (Clang 7.0.1)` | **no** |
| 104 | `C (Clang 18.1.8)` | **no** |
| **105** | **`C++ (GCC 14.1.0)`** | **yes** |
| 110 | `C (Clang 19.1.7)` | **no** |

The rule is `/^C\+\+\s*\(GCC\s+(\d+(?:\.\d+)*)\)$/` with a floor of **GCC major
≥ 11**, both read from `schools/execution/cpp-runtime.ts` rather than restated
here. Anchoring refuses `C (…)` and `Objective-C (…)`; the floor refuses GCC 7,
8 and 9, which default to `gnu++14`. Exactly one entry survives, which is the
point: discovery has no tie to break.

### What the adapter selected

| | |
|---|---|
| Language id | **105** |
| Catalogue name | `C++ (GCC 14.1.0)` |
| Version parsed from the name | 14.1.0 |
| Operator override (`JUDGE0_LANGUAGE_ID`) | false |

### What the compiler said about ITSELF

A catalogue label is a string Judge0 wrote next to an id. This is the toolchain
answering, from `COMPILER_IDENTITY_PROGRAM` — one submission, `<iostream>` only,
status `ok`, exit 0, 2093 ms, 1052 KB:

```
compiler|GCC 14.1.0
__cplusplus|201703
__OPTIMIZE__|undefined
-7/2|-3
-7%2|-1
```

Four facts, and each one is load-bearing:

- **`GCC 14.1.0`** — the label and the compiler agree. No override, no surprise
  toolchain behind the id.
- **`__cplusplus` = 201703** — C++17, reached as GCC 14's **default** `gnu++17`.
  No `-std=` was sent on this submission.
- **`__OPTIMIZE__` undefined** — the judge compiles at **`-O0`**. Every time
  budget in the curriculum was sized on this side of the optimisation gap. A
  judge that quietly started optimising would make those budgets loose, not
  tight, so this is the safe direction — but it must be re-measured, not
  assumed, if a December task ever runs close.
- **`-7/2 = -3`, `-7%2 = -1`** — truncation toward zero. This is the single most
  likely way a task carried over from the Python curriculum became silently
  wrong (Python floors: `-4` and `1`), and it is asked of the judge that
  actually marks children rather than inferred from a standard.

## 2. `compiler_options` — a documented fact that no longer holds

**`schools/execution/cpp-runtime.ts` and `docs/cpp17/CPP17_JUDGE_PARITY.md` both
state that this plan refuses `compiler_options` with HTTP 403. Measured today,
it does not.**

| what was sent | HTTP | result |
|---|---|---|
| `POST /submissions`, `compiler_options: "-std=c++17"`, language 105 | **201** | submission created, status `Accepted`, exit 0 |
| `POST /submissions`, `compiler_options: "-std=c++11"`, language 105, program prints `__cplusplus` | **201** | stdout **`201103`** |

The second row is the decisive one. `201103` is C++11. The option was not merely
**accepted** — it was **honoured**, and it changed the language the program was
compiled as.

The mechanism is visible in `GET /config_info`:

```
enable_compiler_options            true
allowed_languages_for_compile_options   []
```

An empty allowlist is Judge0 for "no restriction", not for "none permitted".

**What this does and does not change.** It does **not** invalidate anything the
product does. The adapter sends no `compiler_options`, GCC 14's default is
already `gnu++17`, and §1 measured `201703` on a submission with no flag. The
`MIN_GNU_CXX17_MAJOR ≥ 11` floor is still correct and still worth keeping — it
is a floor on the *default*, and defaults are what the adapter relies on.

What it changes is the **reasoning recorded around** that floor. Two files
currently justify it with "there is therefore no way to ask the judge for
`-std=c++17`", and that justification is false as of this run. The floor should
be defended as *belt and braces* rather than as *the only lever there is*.
Whether the 403 was a different plan tier, a different request shape, or a
vendor change is UNKNOWN and was not investigated here. **Not fixed in this
pass:** those files are outside this unit's scope, and rewriting a rationale is
not the same job as measuring it. Recorded as a finding in §6.

## 3. The plan's own ceilings — `GET /config_info`

| field | value |
|---|---|
| `cpu_time_limit` | 5 |
| `max_cpu_time_limit` | 20 |
| `cpu_extra_time` | 1 |
| `wall_time_limit` | 10 |
| `max_wall_time_limit` | 30 |
| `memory_limit` | 256000 |
| `max_memory_limit` | 2048000 |
| `stack_limit` | 64000 |
| `max_processes_and_or_threads` | 128 |
| `max_file_size` | 5120 |
| `enable_network` | false |
| `allow_enable_network` | **false** |
| `enable_batched_submissions` | true |
| `max_submission_batch_size` | 20 |
| `max_queue_size` | 10000 |
| `enable_compiler_options` | **true** |
| `allowed_languages_for_compile_options` | `[]` (no restriction) |

We send `cpu_time_limit: 5` s, `wall_time_limit: 7` s and
`memory_limit: 262144` KB. Every one of those is inside the corresponding
`max_*`, so nothing we send is clamped — that was the question worth asking,
because a clamp is silent and would shrink every learner's budget invisibly.

`allow_enable_network: false` is stronger than `enable_network: false`: the plan
will not let a submission turn the network on even if something asked it to.

### RapidAPI quota headers

| header | last value seen |
|---|---|
| `x-ratelimit-batched-submissions-limit` | `0` |
| `x-ratelimit-batched-submissions-remaining` | `-19` |
| `x-ratelimit-batched-submissions-reset` | `371894` |
| `x-ratelimit-submissions-limit` | `0` |
| `x-ratelimit-submissions-remaining` | `-2224` |
| `x-ratelimit-submissions-reset` | `371894` |

Looked for and **absent** — a finding, not an omission. `schools/ops/provider-quota.ts`
reads exactly these names and no others, so each one is a permanent `null` in
the health view:

`x-ratelimit-requests-limit` · `x-ratelimit-requests-remaining` ·
`x-ratelimit-requests-reset` · `x-ratelimit-rapid-free-plans-hard-limit-limit` ·
`x-ratelimit-rapid-free-plans-hard-limit-remaining` ·
`x-ratelimit-rapid-free-plans-hard-limit-reset` · `x-ratelimit-limit` ·
`x-ratelimit-remaining` · `x-ratelimit-reset`

Unchanged from the Python-era run: same six sent, same nine absent, and the
`limit: 0` / negative `remaining` shape is the same nonsense it was then. The
RapidAPI dashboard remains the only real meter.

## 4. The live probes

Six programs, one submission each, asserted on the normalised `ExecutionResult`.

| # | probe | status | exit | wall ms | memory KB | `infrastructureError` |
|---|---|---|---|---|---|---|
| 1 | compiler-identity | `ok` | 0 | 2093 | 1052 | false |
| 2 | missing-semicolon | `compile_error` | — | 2100 | — | false |
| 3 | stdin-kazakh-intdiv | `ok` | 0 | 2045 | 1644 | false |
| 4 | runaway-loop | `time_limit_exceeded` | 0 | 6754 | 1032 | false |
| 5 | output-flood | `ok` | 0 | 2682 | 5700 | false |
| 6 | runtime-error | `runtime_error` | 134 | 2206 | 1280 | false |

**`infrastructureError` is false on all six**, including the two failures that
are genuinely the learner's. That column is the one the product reads to decide
whether a result may be recorded as something a child did.

#### 2 — missing-semicolon: *which line does the judge blame?*

The source omits a semicolon at the end of **line 4** (`int a = 2 + 2`). GCC 14
answered:

```
main.cpp: In function 'int main()':
main.cpp:5:3: error: expected ',' or ';' before 'std'
    5 |   std::cout << a << std::endl;
      |   ^~~
```

**GCC blames line 5 — the line AFTER the mistake.** The browser's Clang 8, given
the same program, blames line 4, the line that is actually missing the
semicolon, with the caret at the end of the expression.

This is the most pedagogically dangerous divergence between the two engines and
it is now measured on both sides rather than asserted. A learner who presses Run
and then Submit sees **two different line numbers for one mistake**. Any lesson
copy, hint, or error-explanation rule that names a fixed line relative to the
error is **false for at least one of the two engines**, and must be written as
"at or just before the reported line".

#### 3 — stdin-kazakh-intdiv: stdin, UTF-8 and integer division in one program

stdin `-7 2`, stdout:

```
-3 -1
Сәлем, әлем!
```

Three things at once, and each would be invisible if only the others were
tested. The answer is **computed from stdin**, so a judge that silently dropped
input cannot pass by coincidence — that is how a whole class gets graded wrong
while every test stays green. Kazakh survives two bytes a character through a
POST body, a queue, a container's stdout and a JSON response. And `-3 -1`
confirms truncating division on the same submission that proves the pipe works.

#### 4 — runaway-loop: the row that matters most

`for (;;) {}` under a 5 s limit → `time_limit_exceeded`, `infrastructureError:
false`, **not** `provider_timeout`. Judge0 reports the learner's exhausted CPU
budget and its own bad day down the same HTTP channel. One is a fact about a
child's algorithm — December's whole month is about making programs fast — and
the other says nothing about them at all.

#### 5 — output-flood: truncation is not a verdict

400,000 lines, about 4.4 MB, against `EXECUTION_LIMITS.maxOutputBytes` of 64
KiB. Result: status **`ok`**, stdout exactly **65,536 bytes**, stderr
`\n[output truncated]`. Ours is the ceiling that fired, well under the judge's
own `max_file_size` of 5120 KB — so this measured OUR truncation, and truncation
did not turn into a failed verdict.

#### 6 — runtime-error: a program that ran and then died

`std::vector<int> v; v.at(5)` → `runtime_error`, exit **134** (SIGABRT), with
the library's own diagnostic surviving intact:

```
terminate called after throwing an instance of 'std::out_of_range'
  what():  vector::_M_range_check: __n (which is 5) >= this->size() (which is 0)
```

C++ has a compile stage and Judge0 reports it structurally (status id 6), so
unlike the Python era there is no `looksLikeCompileError` prose-guessing between
probe 2 and probe 6. The difference between "check your punctuation" and "check
your logic" is now a status id rather than a regex over a traceback.

## 5. Not run

Honest gaps, each one a phase of `npm run judge0:validate` that was not spent:

| phase | cost if run | state |
|---|---|---|
| `conformance` (11 cases) | 11 submissions | **not run.** Probes 2–6 cover five of its eleven questions. |
| `probes` (5 sandbox probes) | 5 submissions | **not run.** See §7. |
| `parity` (22 server-runnable fixtures) | 22 submissions | **not run.** UNKNOWN. |
| `cost` | one per case in two curriculum check blocks | **not run.** UNKNOWN. |
| `concurrency` (1,2,4,8) | 15 submissions | **not run.** UNKNOWN. |

## 6. Findings

| severity | finding |
|---|---|
| **correction** | `compiler_options` is **accepted and honoured** on this plan (HTTP 201; `-std=c++11` produced `__cplusplus 201103`). `schools/execution/cpp-runtime.ts` and `docs/cpp17/CPP17_JUDGE_PARITY.md` both say it is refused with HTTP 403. The floor `MIN_GNU_CXX17_MAJOR ≥ 11` remains correct; its stated *rationale* does not. Not fixed here — outside this unit's files. See §2. |
| **pedagogy** | GCC 14 blames the line **after** a missing semicolon; browser Clang 8 blames the line with it. Measured on both engines. No lesson copy or hint may state a fixed line rule. See §4 probe 2. |
| note | None of the nine quota headers `schools/ops/provider-quota.ts` reads arrived. `providerQuota()` stays null on this plan. The service sent six *other* `x-ratelimit-*` headers that module does not know about; teaching it those names would give the health view a real meter. Unchanged since the Python-era run. |
| note | The judge compiles at `-O0` (`__OPTIMIZE__` undefined). Curriculum time budgets were sized here. Re-measure before trusting any task that runs close to its limit. |

## 7. What this run did NOT establish

A validation is only worth what its boundaries are. These remain open and are
not made truer by anything above.

- **Whether the sandbox is a sandbox.** This run performed **no** sandbox
  probes. The Python-era run's §3 found that a submission could **spawn a shell**
  and **write to disk**; those are properties of the judge's container, not of
  the language submitted to it, so they are very likely still true — but they
  were *not re-measured for C++* and must not be reported as if they were. See
  `JUDGE0_LIVE_VALIDATION_PYTHON_ERA.md` §3. The **browser** sandbox is audited
  separately and adversarially in `docs/cpp17/CPP17_SANDBOX_AUDIT.md`, which
  covers a different engine and says nothing about this one.
- **Full conformance and parity.** Six probes are not the eleven-case
  conformance table and are not the twenty parity fixtures. No claim is made
  that the September reference solutions agree across the two engines *from this
  run* — that evidence is `docs/cpp17/CPP17_JUDGE_PARITY.md`'s.
- **Residency, which is known rather than unknown.** This provider sends learner
  source code out of Kazakhstan, against the commitment recorded in
  `docs/CODE_EXECUTION_DECISION.md`. No measurement changes that.
- **What the plan costs, and what is left of it.** §3 records the headers the
  service actually sent. Anything it did not send is not knowable from here.
- **Behaviour under a real class.** No concurrency ladder was run. Eighteen
  learners pressing Check inside ten seconds was not simulated and must not be
  inferred from eight sequential submissions.
- **`POST /submissions/batch`.** `JUDGE0_BATCH` is off by default and this run
  did not turn it on. `config_info` advertises `enable_batched_submissions: true`
  and `max_submission_batch_size: 20`; whether the *plan* honours them is
  untested.

---

To regenerate this file in full, `npm run judge0:validate` — budget **at least
17 submissions** for identity + conformance + probes, and more for parity. The
key is read from `JUDGE0_RAPIDAPI_KEY`, is never written to this file, and the
writer refuses to save a document it appears in. Note that a full run
**overwrites this file** with the validator's own layout; the Python-era record
lives in a separate file for exactly that reason.
