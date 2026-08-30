# Judge0 CE via RapidAPI — live validation

Produced by `npm run judge0:validate`. Every number below was measured against the real service during the run named in the header; nothing here is arithmetic, an estimate, or carried over from another document. Anything that was not measured is the literal word UNKNOWN.

The design decisions behind the adapter are `JUDGE0_RAPIDAPI_AUDIT.md`; the operator instructions and the *arithmetic* for capacity are `JUDGE0_RAPIDAPI_SETUP.md` §5. Where this document and §5 disagree, this one is the measurement and §5 is the model.

> **This run did NOT talk to RapidAPI.** It talked to `http://127.0.0.1:59386`. Everything below describes that host and is not a claim about the rented judge, its plan, its sandbox or its Python.

## The run

| | |
|---|---|
| Started | 2026-08-30T11:03:35.646Z |
| Finished | 2026-08-30T11:03:36.846Z |
| Command | `npm run judge0:validate -- --only=languages --max-submissions=25` |
| Host | `judge0-ce.p.rapidapi.com` |
| Base URL | `http://127.0.0.1:59386` |
| Phases selected | languages |
| Submission ceiling | 25 (`--max-submissions`) |

### What it spent

| | |
|---|---|
| Billable submissions created | **1** |
| HTTP API requests sent | **7** |
| …of which polls | 3 |
| …of which `GET /languages` | 2 |
| HTTP 429 | 0 |
| Other failed requests | 1 |
| POSTs the ceiling refused before sending | 0 |

Counted at `fetch`, which is the only place that cannot be wrong about it — a retry inside the adapter, a batch path, or a phase added later is counted here whether or not it knows this meter exists. `schools/ops/judge0-usage.ts` counts the same traffic from inside the provider and feeds the admin health view; the two are independent by design, and a disagreement between them is itself a finding.

## 1. Provider identity

Languages the service exposes: **7**.

### Every Python the service offers

| id | name | matches the adapter's discovery rule |
|---|---|---|
| 70 | `Python (2.7.17)` | **no** |
| 71 | `Python (3.8.1)` | yes |
| 92 | `Python (3.11.2)` | yes |
| 100 | `Python (3.12.5)` | yes |
| 127 | `Python for ML (3.11.2)` | **no** |

The rule is `^Python\s*\((3(?:\.\d+)*)\)$`, anchored on purpose so `Python for ML (…)` is refused: that runtime ships numpy, and `schools/execution/python-policy.ts` enforces standard-library-only BY ABSENCE. Among the names that match, the highest version wins, compared numerically.

### What the adapter selected

| | |
|---|---|
| Language id | 100 |
| Catalogue name | `Python (3.12.5)` |
| Version parsed from the name | 3.12.5 |
| Operator override (`JUDGE0_LANGUAGE_ID`) | false |
| `sys.version`, from the interpreter itself | UNKNOWN |

Interpreter problem: the program printed nothing (status ok)

A catalogue label is a string Judge0 wrote next to an id. `sys.version` is the interpreter answering for itself, and where the two disagree the interpreter wins.

### RapidAPI quota headers

**No `x-ratelimit-*` header arrived on any response during this run.**

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

UNKNOWN — HTTP 404

## 2. Conformance

Not run. Every row is UNKNOWN.

## 3. Sandbox probes

Observational, non-destructive, and every one cleans up after itself. The point is to learn where the boundary actually is; an open boundary is reported as a security limitation of the rented judge, not worked around.

Not run. Every boundary below is UNKNOWN.

## 4. Parity with the September curriculum

The programs are `tests/execution/parity-fixtures.ts` — real September reference solutions and the mutations a fourteen-year-old actually makes — run through Judge0 and compared against what the browser's Pyodide is asserted to produce. **Traceback prose is not compared:** CPython rewrote its diagnostics across 3.13 and 3.14, so the wording differs by interpreter vintage and that difference is documented, not a defect. Arithmetic, `//`, `%`, negatives, conditions, strings, Unicode and big integers ARE compared, and a divergence there is a real finding.

Not run. Every row is UNKNOWN.

## 5. Cost shape

Two different numbers, and the user asked for them separately: a **submission** is a program the judge ran, and an **API request** is an HTTP call the plan meters. One submission is one POST plus however many polls it took to see a terminal status, so requests are always the larger number and they are the one on the invoice.

Not run. Every figure below is UNKNOWN.

## 6. Staged concurrency

Widths 1, 2, 4, 8, in that order, stopping **permanently** at the first 429 or provider error. Eighteen simultaneous submissions are never issued: the server already queues, the plan's limits are the operator's to spend, and a load test that breaks a subscription to prove the subscription can break is not a test.

Not run. Every figure below is UNKNOWN.

## Findings

| severity | phase | finding |
|---|---|---|
| note | languages | No x-ratelimit-* header arrived on any response. `providerQuota()` will stay null forever on this plan and the RapidAPI dashboard is the only meter there is. |
| **defect** | run | `recordJudge0Request` is not called from `schools/exec/providers/judge0.ts`'s `httpJson`, so every `judge0.*` ops counter and every `providerQuota()` field reads zero/null in production no matter what is spent. This run measured at `fetch` instead. One call site fixes it; it is outside this script. |

## What this run did NOT establish

A validation is only worth what its boundaries are. These remain open after this run and are not made truer by anything above:

- **Whether the sandbox is a sandbox.** The probes in §3 describe what a submission could see from inside. Nothing here tests isolation between submissions, escape from the container, or what Judge0's operator can read.
- **Residency, which is known rather than unknown.** This provider sends learner source code out of Kazakhstan, against the commitment recorded in `docs/CODE_EXECUTION_DECISION.md`. No measurement changes that.
- **What the plan costs, and what is left of it.** §1 records the quota headers the service actually sent. Anything it did not send is not knowable from here and the dashboard is the only meter.
- **Behaviour under a real class.** §6 stops at width 8 by design. Eighteen learners pressing Check inside ten seconds was not simulated and must not be inferred from it.
- **`POST /submissions/batch`.** `JUDGE0_BATCH` is off by default and this run did not turn it on. Whether the plan exposes the batch endpoints, and its `max_submission_batch_size`, is unchanged by this document.

---

Regenerate with `npm run judge0:validate`. The key is read from `JUDGE0_RAPIDAPI_KEY` in the environment, is never written to this file, and the writer refuses to save a document it appears in.
