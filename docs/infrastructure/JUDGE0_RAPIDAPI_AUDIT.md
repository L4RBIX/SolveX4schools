# Judge0 CE via RapidAPI — audit before writing any provider code

One question: **what does the trusted-Submit half already have, and what does
Judge0 actually need to add?** The rule is the same as the hybrid-execution
audit's — do not duplicate an existing correct abstraction.

## The constraint that shapes this whole phase

**There is no RapidAPI key.** `env | grep -i rapidapi` is empty, `.env` has
nothing, and none was supplied. So every phase that requires a live provider —
the conformance matrix, the sandbox probes, load testing, the real student E2E —
**cannot be executed**, only built and left armed.

That is a reporting fact, not an excuse: the work below is written so the moment
a key exists, one command runs the whole live matrix. What must not happen is a
report that reads as though the matrix ran.

## What already exists, and is correct

### The provider port — `schools/exec/provider.ts`  → **KEEP, ADAPT ONCE**

```ts
interface CodeExecutionProvider {
  readonly id: string
  readonly describe: string
  run(request: ExecutionRequest): Promise<ExecutionResult>
}
```

`ExecutionRequest` is `{ language, sourceCode, stdin, timeLimitMs, memoryLimitMb, signal? }`.
`ExecutionResult` is `{ status, stdout, stderr, exitCode, timeMs, memoryKb, infrastructureError, providerId }`.

This is exactly the seam Judge0 plugs into. Judge0 is a second implementation of
a port that already has one — it is not a new subsystem, and nothing above the
port may learn that RapidAPI exists.

The one ADAPT: **`ExecutionStatus` gains `provider_rate_limited`.** Argued below.

### `ExecutionStatus` → **KEEP the vocabulary, add exactly one member**

```
ok | compile_error | runtime_error | time_limit_exceeded | memory_limit_exceeded
| provider_timeout | provider_error | payload_too_large
```

The distinction this union exists to protect is already right and is the single
most important thing Judge0 must not break: `time_limit_exceeded` is **the
learner's program** being slow (evidence — December's whole month is about
making programs fast). `provider_timeout` is **the judge** not answering (not
evidence). Judge0 makes this easy to get wrong, because it reports *both* over
the same HTTP channel: status id 5 is the learner's TLE, and our `fetch` giving
up is ours. They are different fields and must stay different.

**Why `provider_rate_limited` earns its own member.** HTTP 429 is not "the judge
is broken" — it is "we asked too much of a plan", it self-heals, and it is
overwhelmingly the *most likely* failure mode for eighteen students on a free
RapidAPI tier. Folding it into `provider_error` means the health view cannot
distinguish "over quota" from "Judge0 is down", and those need opposite operator
actions (wait / buy vs page someone).

The cost is bounded and self-enforcing: `teacherOutcome` in
`schools/presentation/teacher-outcome.ts` is an **exhaustive switch** with a
`const exhaustive: never = status` guard, so adding a member is a compile error
until someone decides what a teacher sees. That is the design working, not a
tax. A teacher sees `not_checked`, alongside the other three "nothing was
measured" statuses.

`isInfrastructure` and `isLearnerEvidence` both take it on the not-evidence side.

### `runCases` — `schools/exec/index.ts` → **ADAPT (add an optional batch path)**

Already does exactly the right thing, and it is the reason Judge0 must **not**
be given `expected_output`:

```
for each case: provider.run(source, case.input)
             → if infrastructureError: STOP, report nothing measured
             → passed = status === "ok" && checkOutput(stdout, expected, checker)
```

**SolveX's checker is authoritative and stays that way.** `token` (default),
`exact`, and author-declared `numeric` tolerances are curriculum decisions;
Judge0's `expected_output` knows none of them. Judge0 is a trusted *execution*
engine and nothing more. Sending it an expected output would also mean shipping
the answer key to RapidAPI, which is a data question as well as a correctness
one.

The ADAPT is latency, not semantics. The loop is sequential and Piston answers
in one round trip; Judge0 is POST-then-poll, so four hidden cases become four
serial post+poll cycles. An **optional `runBatch?`** on the port lets a provider
that can do better do better, with `runCases` falling back to the loop when it
is absent. Additive: Piston and the local provider are untouched, and the
short-circuit-on-infrastructure semantics must be preserved exactly.

### Payload limits — `schools/exec/limits.ts` → **KEEP, enforce EARLIER**

`MAX_REQUEST_BYTES` 256 KiB, source 64 KiB, stdin 16 KiB, output 64 KiB, all
byte-measured. `sizeGuarded()` already decorates every provider from
`getExecutionProvider`, so Judge0 inherits the refusal for free.

New reason to care: a refused payload that reaches RapidAPI **costs a request**.
The guard already runs before the provider, which is the right order — this
audit records it so nobody "optimises" it later.

### `getExecutionProvider()` → **ADAPT (one branch)**

Already returns `CodeExecutionProvider | null`, already decorates with
`sizeGuarded(counted(…))`, already treats `EXEC_PROVIDER=none` as a supported
deployment. Judge0 is one more branch and one more config value.

### The trust boundary → **DO NOT TOUCH**

`schools/execution/trust.ts`, `trust-policy.ts`, `LocalRunResult`,
`isClientReportable`, `isTrustedOutcome`, the `source_trust = 'judge'`
predicates, submission idempotency. All of it is upstream and downstream of the
provider and none of it changes: **Judge0 does not write learner state.** The
flow stays

```
trusted execution result → SolveX checker → verdict → trusted LearningEvent → LI
```

A provider that could write an event would be the bug.

### Pyodide → **DO NOT TOUCH**

Run stays browser-local and free. Twenty presses of Run cost zero RapidAPI
requests, and that is the entire cost model. Nothing in this phase may route Run
through a provider.

## What has to be ADDED

| Piece | Note |
|---|---|
| `schools/exec/providers/judge0.ts` | POST `/submissions?base64_encoded=false&wait=false` → token → poll `GET /submissions/{token}`. Owns headers, polling, backoff, normalization, language resolution, and the concurrency gate. |
| `provider_rate_limited` | One member, plus the `teacherOutcome` case the compiler will demand. |
| `runBatch?` on the port + `runCases` fallback | Additive. Preserves short-circuit. |
| Language discovery | `GET /languages`, find Python 3, cache per process. **Do not hardcode an id.** An operator override exists for when discovery is not wanted; the *version* is UNKNOWN until a key exists and must be reported as such. |
| Global concurrency gate | 18 students × N hidden cases is the real load. Bounded server-side, configurable, defaulting low. |
| Config + `.env.example` | `EXEC_PROVIDER=judge0_rapidapi`, key, host, base URL, and the optional timing/concurrency knobs. Never a real key. |
| Health check | Configured? Reachable? Runtime discoverable? Does `print(1)` return `1`? Without leaking the key or raw provider bodies. |
| `JUDGE0_LIVE_TEST=1` | CI must not spend quota. Everything except the HTTP calls stays real. |

## Explicitly NOT built

- **No `wait=true`.** Judge0's own documentation says it may be disabled and is
  not recommended at scale. Async + polling only.
- **No batch dependency.** Whether the subscribed plan supports
  `POST /submissions/batch` reliably is unknown without a key. Bounded parallel
  is the floor; batch is a documented upgrade behind a capability check.
- **No client-side anything.** The browser never sees `judge0-ce.p.rapidapi.com`.
  RapidAPI therefore never needs to appear in a future `connect-src`.
- **No second verdict vocabulary.** Judge0's status ids are normalised at the
  provider boundary and never escape it.

## The mapping this phase must get right

| Judge0 | SolveX | Evidence? |
|---|---|---|
| 1 In Queue / 2 Processing | *not terminal — keep polling* | — |
| 3 Accepted | `ok` (then **our** checker decides pass/fail) | yes |
| 4 Wrong Answer | `ok` — we never send `expected_output`, so this should not occur; if it does, the provider is misconfigured | yes |
| 5 Time Limit Exceeded | `time_limit_exceeded` | **yes — the learner's** |
| 6 Compilation Error | `compile_error` | yes |
| 7–12 Runtime Error (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, other) | `runtime_error`, except SIGXFSZ → output/file-size, and MLE-shaped signals → `memory_limit_exceeded` where distinguishable | yes |
| 13 Internal Error | `provider_error` | **no** |
| 14 Exec Format Error | `provider_error` | **no** |
| HTTP 429 | `provider_rate_limited` | **no** |
| HTTP 401 / 403 | `provider_error` (configuration) | **no** |
| our `fetch` aborts | `provider_timeout` | **no** |

Python has no compile stage, so a `SyntaxError` arrives as a *runtime* failure
with `SyntaxError` on stderr — exactly the trap Piston fell into. The provider
must run it through the shared `looksLikeCompileError`, not invent its own rule.
That predicate is shared precisely so two judges cannot disagree about one
missing bracket.

---

# Closing: what was built, and what this audit got wrong

Written after the provider landed. Operator instructions are
`JUDGE0_RAPIDAPI_SETUP.md` beside this file; this section is only the delta
between the plan above and the code that exists.

**Still true, and still the governing fact: no live call has ever been made from
this repository.** There is no key, nothing has contacted
`judge0-ce.p.rapidapi.com`, and every test drives a local fake HTTP server.

## Built as planned

`schools/exec/providers/judge0.ts` — async POST → token → bounded poll, no
`wait=true`, the two RapidAPI headers, `expected_output` never sent, status ids
normalised at the boundary and never escaping it. `provider_rate_limited` added
to `ExecutionStatus`, to `isInfrastructure`, and to `teacherOutcome`'s exhaustive
switch, where a teacher reads `not_checked` alongside the other unmeasured
statuses. Optional `runBatch?` on the port with `runCases` falling back to the
sequential loop, short-circuit semantics preserved exactly. Language discovery
from `GET /languages`, cached per process, no hardcoded id, operator override in
`JUDGE0_LANGUAGE_ID`. Process-global concurrency gate. Config and `.env.example`,
with a keyless production `judge0_rapidapi` now a boot failure exactly like a
keyless Piston.

Run is untouched. Pyodide, in the browser, zero requests.

**The health check**, built separately and more thoroughly than this row asked
for. `schools/ops/judge-probe.ts` answers all four questions — `configured` is
now per-provider (for Judge0: is the key present), `endpoint` is the redacted
base URL, the probe reports `runtimeId` / `runtimeName` / `runtimeVersion` /
`runtimeOperatorOverride`, and `probeRequests` says what pressing it spent. It
also added something this audit did not ask for and should have:
`schools/ops/provider-quota.ts` reads RapidAPI's `x-ratelimit-*` headers off
real submissions, so "the class is about to stop working" is visible on the
FREE health call rather than behind the paid one.

## Planned here and NOT built

- **`JUDGE0_LIVE_TEST=1`.** No live suite exists in the tree. `SETUP.md` §4.3
  specifies what it must prove and §4.4 gives the same matrix as `curl` so the
  conformance run is not blocked on the file being written.
- **The two halves of the cost accounting are not joined.**
  `schools/ops/judge0-usage.ts` exports `recordJudge0Request()` and its own
  comment names the one place it belongs — `httpJson` in
  `schools/exec/providers/judge0.ts` — and the provider does not call it. So
  `judge0.requests`, `judge0.submissions`, `judge0.polls`,
  `judge0.language_lookups`, `judge0.rate_limited` and `judge0.failures` all stay
  at zero, and every quota field stays `null`, no matter what the plan is
  spending. Nothing reads falsely — `null` is not `0` — but the cost visibility
  is dark. One call site, at the boundary rather than at the call sites above it,
  so retries are counted too.

## What this audit got wrong

**It never did the multiplication.** "Global concurrency gate … defaulting low"
is the whole of what this document says about capacity, and low turned out to be
the wrong axis to be careful on. One press of Check is `C` submissions — every
case, visible and hidden, and for a wrong answer as well as a right one — and one
submission is one POST plus three-to-five polls. September's mean block is 4.84
cases; a class of 18 pressing Check on one is ~90 submissions and ~360 requests.
At the shipped `JUDGE0_MAX_CONCURRENT_REQUESTS=2` and `JUDGE0_QUEUE_WAIT_MS=30000`
that burst does not drain inside the queue wait, and the arithmetic in `SETUP.md`
§5.3 puts roughly ten of eighteen learners unmeasured. Being conservative about
spend and being conservative about capacity are opposite settings of the same
knob, and this audit only noticed the first one.

**`payload_too_large` was not inherited for free.** "`sizeGuarded()` already
decorates every provider … so Judge0 inherits the refusal for free" was true of
`run` and false of the `runBatch` this same document proposed two rows later.
Both `sizeGuarded()` and `counted()` dropped the method, which made the batch
path silently dead and would have left the one route to the judge with no payload
ceiling on it had the composition ever been reordered. Fixed in
`schools/exec/limits.ts` and `schools/exec/index.ts`; recorded here because
"additive, nothing else changes" is exactly the claim that stops people checking.

**SIGXFSZ has nowhere to go.** The mapping table promises "SIGXFSZ →
output/file-size". `ExecutionStatus` has no output-limit member, so status 8 is
`runtime_error`, and the divergence from Pyodide's `output_limit_exceeded` stands
(it is already recorded in `tests/execution/parity-fixtures.ts`). Adding a member
would be a port change, not a provider invention.

**Status 4 was described as a misconfiguration.** It is read as `ok` — "the
program RAN" — rather than as a signal that something is wrong. We never send
`expected_output`, so a vendor verdict arriving anyway must not be allowed to
overrule the curriculum's checker; treating it as `ok` and letting our own
checker decide is the only reading that keeps SolveX authoritative.

**Things the audit did not think of, which the provider needed anyway.** The
`Python (3.x)` name match has to be anchored, or `Python for ML (3.11.2)` wins
and `python-policy.ts`'s stdlib-only-by-absence guarantee is silently downgraded.
The token is a remote value that becomes our next request's URL path, so it is
validated against a strict UUID pattern before interpolation. And the POST must
never be retried: an ambiguous network failure may already have created the
submission, so a blind retry runs a learner's program twice and doubles the
spend. GET polls are idempotent and do ride out two transient errors.

**Still missing, and worth someone's decision:** language discovery has no
minimum-version floor. It takes the highest `Python (3.x)` on offer, and Judge0
CE's released image ships Python 3.8.1 — which would be accepted without
complaint, run September's curriculum correctly, and be an EOL interpreter
producing a class's evidence. `SETUP.md` §6 makes it a manual check; a floor
would make it a compile-time one.

## After the key arrived

Empty on purpose. Whoever runs the live matrix in `SETUP.md` §4 writes the
answers here: the Python version and language id, the plan's real ceilings from
`GET /config_info`, whether the batch endpoints exist, where the rate limit falls
and what a 429 looks like, and a measured `t` for §5.3's arithmetic. Until there
are numbers under this heading, every capacity statement in either file is
arithmetic over an estimate.
