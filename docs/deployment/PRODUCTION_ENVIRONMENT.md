# Production environment

Every variable this application reads, what validates it, and what breaks when
it is wrong. Written for the person doing the pilot deployment, who will not
have read the source.

Two rules govern the whole file:

1. **Nothing here carries a `NEXT_PUBLIC_` prefix, and nothing may be given
   one.** A `NEXT_PUBLIC_` variable is inlined into the client bundle at build
   time, so prefixing one to "make something work" publishes it to every
   browser permanently. `npm run check:bundle` greps the built client chunks
   for the *values* of the four secrets below and fails if it finds one.
2. **A misconfiguration must be loud.** Nearly every failure mode in this
   system is silent by nature — verdicts downgrade, evidence stops being
   written, a projection goes stale — so the boot assertion in
   `src/instrumentation.ts` exists to convert configuration mistakes into a
   process that refuses to start.

## Proof status of the code execution path

Read this before treating anything else in this document as verified.

| Claim | Status | Evidence |
|---|---|---|
| The Piston adapter speaks Piston's `/api/v2/execute` protocol correctly | **Proven** | `tests/exec/piston-conformance.test.ts` — 37 assertions against a protocol-faithful fake |
| Learner failure and judge failure stay distinct end to end | **Proven** | same file, plus `tests/exec/execution.test.ts` against a real CPython |
| Our concurrency under a class of 18 | **Measured** | `tests/exec/piston-load.test.ts` |
| A Piston deployment works | **UNPROVEN** | no instance exists; see the checklist at the end |

Nothing in this repository has ever spoken to a real Piston. The container
isolation, the memory cgroup, the network lockdown, the data-residency claim
and the throughput of the host are all untested. What is proven is that when an
instance does exist, the adapter in front of it is not the thing that will be
wrong.

**To create that instance:** `docs/infrastructure/JUDGE_DEPLOYMENT.md` — the host,
the region and why it must be Kazakhstan, the pinned Python, the exact
`docker run`, and a record of a local attempt that failed for architectural
reasons, so nobody repeats it. To operate it once it exists:
`docs/infrastructure/JUDGE_RUNBOOK.md`. Neither has been executed against a real
judge either; both are procedures, and they say so.

---

## Variables

`Secret?` means the value is a credential: it must never appear in a log, a
health payload, a client bundle, or a commit.

All example values are FORMATS. None is a usable credential and none should be
copied.

### Environment identity

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `VERCEL_ENV` | No | No | `production` / `preview` | `schools/config.ts` — read first, falls through to `NODE_ENV` | Absent is normal off Vercel. Together with `NODE_ENV` it decides whether the boot assertion runs at all — see below. |
| `NODE_ENV` | Yes in production | No | `production` | Next sets it; `schools/config.ts` reads it as the fallback | Not `production`: the boot assertion returns early, `EXEC_PROVIDER=local` is accepted, session and identity cookies lose their `secure` flag, and the reverse-engineering baseline routes under `/brilliant` and `/dev` stop 404ing. A production deployment running as `development` is the single most consequential mistake in this table, because everything appears to work. |
| `NEXT_TELEMETRY_DISABLED` | No | No | `1` | Next itself | Nothing breaks. Set in `docker-compose.yml`. |
| `NEXT_RUNTIME` | No | No | set by Next | `src/instrumentation.ts` | Set by the framework. If it is not `nodejs` the boot hook returns immediately — no config assertion and no reducer interval. Only relevant if someone moves a route to the edge runtime. |

### Storage

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `LEARNING_DATA_DIR` | **Yes in production** | No | `/var/lib/solvex/learning` | `assertProductionConfig()` rejects a relative path when `DATABASE_URL` is unset | Relative (the default `.data/learning`) on an ephemeral filesystem means every learner's progress is deleted on redeploy. Boot fails rather than allowing it. Must be an absolute path on a **persistent volume**. |
| `DATABASE_URL` | **No — see below** | **Yes** | `postgres://USER:PASSWORD@HOST:5432/DBNAME` | `assertProductionConfig()` accepts it as an alternative to an absolute data dir; `schools/store/index.ts` then **throws** | **Setting this today breaks the application.** The Postgres driver is not implemented: `open()` throws `"DATABASE_URL is set but the Postgres driver is not wired yet"` on the first store access. Boot succeeds, then every route that touches the store 500s. Leave it unset and use an absolute `LEARNING_DATA_DIR` with PGlite until `schools/store/postgres-driver.ts` exists. |

PGlite holds an **exclusive lock** on its data directory. One process, one
directory. A second process opening the same path reads a stale snapshot rather
than failing, which looks exactly like writes being lost. This is also why
`next.config.ts` sets `output: "standalone"` — the app must be a long-running
Node process, not a serverless function pool.

### Secrets

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `LEARNING_ATTESTATION_SECRET` | **Yes in production** | **Yes** | 64 hex characters, from `openssl rand -hex 32` | `assertProductionConfig()` (present, at least 32 chars); `requireStrongSecret` in `schools/learning/sign.ts` re-checks at signing time | Missing: boot fails. Present but weak: signing throws, grading still succeeds, and every verdict silently drops to browser trust — no misconception ever becomes actionable and the product goes on looking like it works. Signer and verifier must hold the **same** value; rotating it invalidates every attestation issued before the rotation. Read in three places (`schools/config.ts`, `schools/learning/sign.ts`, `packages/learning-contracts/src/attestation.ts`) — all three trim whitespace, so a trailing newline from a dashboard paste is harmless. |
| `LEARNING_ADMIN_TOKEN` | No | **Yes** | 43+ URL-safe characters, from `openssl rand -base64 32` | `schools/ops/admin-gate.ts`, compared in constant time | Absent: the machine door to the admin health view is simply closed, and that view is then reachable only by a signed-in `admin`. Not asserted at boot — a pilot with no uptime monitor is not misconfigured. Presented as `Authorization: Bearer <token>`; there is no query-parameter form. |
| `LEARNING_CRON_SECRET` | No | **Yes** | 64 hex characters | **Nothing** | **Has no consumer.** It is read into `config.cronSecret` and never used, because the cron entry point it was meant to guard does not exist: there is no `/api/learning/reduce` route. `.env.example` tells operators to point a cron at that route. Setting this variable protects nothing; more importantly, `LEARNING_SWEEP_IN_PROCESS=false` currently leaves the reducer with **no trigger at all**. |

### Reducer

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `LEARNING_SWEEP_IN_PROCESS` | No | No | `true` (default) / `false` | Nothing; compared against the literal string `false` | Any value other than the exact string `false` enables the in-process interval. Setting it to `false` disables the only working reducer trigger (see `LEARNING_CRON_SECRET` above): episodes accumulate unreduced, every teacher projection freezes at its last sweep, and `/api/health/learning` reports the backlog. |
| `LEARNING_SWEEP_INTERVAL_MS` | No | No | `20000` | Nothing — passed through `Number()` | A non-numeric value yields `NaN`, and `setInterval(fn, NaN)` fires roughly every millisecond. Nothing validates this. Leave it unset unless there is a reason. |

### Nova (the tutor)

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `NOVA_PROVIDER` | No | No | `echo` (default) / `deepseek` | `assertProductionConfig()` only in combination with the API key | `echo` needs no credentials and runs offline; the pedagogy — the hint ladder, the caps, the refusal to name a misconception without evidence — is upstream of the model and is fully exercisable against it. An unrecognised value falls back to `echo`. |
| `DEEPSEEK_API_KEY` | Only when `NOVA_PROVIDER=deepseek` | **Yes** | provider-issued key string | `assertProductionConfig()` | `deepseek` without a key is a boot failure. |
| `DEEPSEEK_BASE_URL` | No | No | `https://api.deepseek.com` | Nothing | A wrong host makes every hint fail; the learner-facing path degrades rather than erroring. Redacted to host and port in the admin health payload. |
| `DEEPSEEK_MODEL` | No | No | `deepseek-chat` | Nothing | An unknown model name fails at the provider, per request. |

### Code execution — the judge

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `EXEC_PROVIDER` | **Yes in production** | No | `piston` | `executionProviderProblems()` via `assertProductionConfig()` | Must be exactly `piston` in production. `local`, unset, or a typo (`pistion`) all resolve to `LocalExecutionProvider`, which refuses to run in production — the submit route catches that refusal and leaves every verdict `unknown`, so nineteen September code tasks silently stop being graded while learners are told the sandbox is unavailable. All three cases are boot failures, and the messages say so. |
| `PISTON_URL` | **Yes when `EXEC_PROVIDER=piston`** | No | `http://127.0.0.1:2000` | `executionProviderProblems()`; `pistonFromConfig()` throws independently | Missing: boot failure. Wrong: every execution returns `provider_error`, every submission is reported as unmeasured, and **no learner is recorded as wrong** — the failure is missing evidence, never false evidence. No trailing slash; the adapter appends `/api/v2/execute`. Redacted to host and port in the admin health payload, because a URL is a string a human wrote and humans put credentials in URLs. |
| `EXEC_PYTHON_BIN` | No | No | `python3` | Nothing | Development only — the local subprocess provider. Irrelevant in production, where that provider refuses to run. |

### Pilot scope

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `SCHOOL_ID` | No | No | `pilot-school` | Nothing | A placeholder for enrolment. Every subject is scoped to this school on creation so the teacher projection has data to read. Changing it mid-pilot orphans every subject created before the change. |
| `CLASS_ID` | No | No | `grade-9a` | Nothing | As above. `scripts/provision-class.ts` reads both. |

### Development only

| Variable | Required | Secret | Example format | Validated by | If wrong or missing |
|---|---|---|---|---|---|
| `PW_PROFILE`, `PW_FORCE_HEADED` | No | No | filesystem path / `1` | Nothing | `scripts/brilliant-session.mjs`, a Playwright helper. Never read by the application. |
| `PATH` | Yes | No | inherited | Nothing | Read by `LocalExecutionProvider` to build the scrubbed environment it hands a learner's subprocess. Everything else in that environment is deliberately stripped so the learner's Python cannot read `DEEPSEEK_API_KEY` or `LEARNING_ATTESTATION_SECRET`. |

### Drift in `.env.example`

`.env.example` does not list `SCHOOL_ID` or `CLASS_ID`, and it documents an
external cron endpoint (`POST /api/learning/reduce`) that does not exist. This
table is derived from the source and is the authority.

---

## Boot: fail closed

`src/instrumentation.ts` runs once per process, before the first request.

```
register()
  └─ NEXT_RUNTIME !== "nodejs"  →  return, doing nothing
  └─ assertProductionConfig()
       └─ environment !== "production"  →  []   (development and preview are exempt)
       └─ problems.length > 0           →  console.error each, then THROW
  └─ startSweepInterval()
```

The throw is the point. Each condition it checks is one that fails silently at
runtime:

- **No attestation secret** → verdicts downgrade to browser trust, and a
  misconfigured deployment becomes indistinguishable from an attack.
- **Ephemeral storage** → progress vanishes on redeploy, with no error.
- **`deepseek` with no key** → every hint fails, one request at a time.
- **No usable judge** → every code task settles `unknown`, and the learner is
  told the sandbox is unavailable.

Development and preview are deliberately exempt. `EXEC_PROVIDER=local` is how
the grading pipeline gets built and tested without provisioning a judge, and a
check that fired there would be noise — and a noisy check is one everybody
learns to ignore.

**Verify the boot assertion actually ran.** If a platform runs the app in a way
that skips the instrumentation hook, every check above is skipped with it and
the deployment comes up looking healthy. `/api/health` re-checks the judge for
exactly this reason.

## Health

Two endpoints today.

**`GET /api/health`** — the one to point a monitor at. Two shapes, selected by
`schools/ops/admin-gate.ts` and always named in the payload's `view` field:

- **teacher** (the default, including for unauthenticated callers): five
  capabilities in Kazakh and Russian, each naming a consequence — "code
  checking is temporarily unavailable; nobody is being marked wrong". No
  provider names, no hostnames, no variable names, no counts.
- **admin** (bearer `LEARNING_ADMIN_TOKEN`, or the `admin` role): web,
  database, execution provider, Nova provider, curriculum version and hash,
  reducer lag, activity, counters.

`200` when everything is `ok`, `503` otherwise — `degraded` included, so a
monitor that only wakes on total failure does not wake too late.

**`GET /api/health?probe=1`** (admin only) runs a two-line Python program
through the configured provider and reports `probeMs`, `probeStatus` and
`probeOk`. **This is the deploy smoke check for the judge.** It is opt-in and
admin-only so that an unauthenticated caller cannot make the endpoint put load
on Piston, and so a monitor polling every thirty seconds does not either.

**`GET /api/health/learning`** — the reducer-and-attestation view: sweep age,
unreduced episode backlog, and the share of verdicts carrying `judge` trust. It
reports a stale sweep only when there is a backlog waiting, because a quiet
classroom is not a dead reducer.

Note that `docker-compose.yml`'s healthcheck hits `/`, not `/api/health`. It
proves the web server is up and nothing else.

---

## Sizing the judge for a class of N

Grounded in `tests/exec/piston-load.test.ts`. The **concurrency** numbers are
properties of our code and transfer directly to a real deployment. The
**latency** numbers come from a fake judge that answers in 80–200ms and do not.

Measured for N = 18, with a 4-case block (`m1.l1.b5`):

| Burst | Judge executions | Peak concurrent | Wall clock |
|---|---|---|---|
| 18 learners press Run | 18 | **18** | 211 ms |
| 18 learners press Submit | 72 | **18** | 754 ms |
| 18 Run + 18 Submit at once | 90 | **36** | 730 ms |

### The three facts that decide the sizing

**1. Peak concurrency is `2N`, not `N` and not `N x cases`.**
`runCases` awaits each test case before starting the next, so one learner's
4-case submission is at most **one** execution in flight — 72 executions arrive
as 18 concurrent ones. But Run and Submit share the judge and neither yields to
the other, so a lesson where half the class experiments while the other half
submits peaks at `2N`. **A judge tuned for "18 students" is tuned for the wrong
18.** For a class of 18, size for **36 concurrent executions**; for a school
running two classes at once, 72.

**2. A submission costs the learner `cases x latency` of waiting.**
Because cases are serial. September's practice blocks carry 3–4 cases, and the
monthly check carries nine across two problems. At a realistic warm-Piston
latency of 400 ms per execution, a 4-case submit is ~1.6 s and a 9-case
assessment problem is ~3.6 s of waiting after the button is pressed. Our
measured per-submit median was 557 ms against an 80–200 ms fake, which is
exactly `4 x` the per-case median of 135 ms.

**3. Per-execution failures amplify by the number of cases.**
A submission is graded only if **every** case reaches the judge. With a
per-execution failure rate `f` and `C` cases, the probability a learner is left
unmeasured is `1 - (1-f)^C`. Measured, with one execution in three failing:
**4 of 18 learners measured, 14 unmeasured, and zero recorded wrong.** At a
1% per-execution failure rate and 4 cases, ~4% of submissions go unmeasured; at
9 cases, ~9%. The failure mode is always missing evidence, never false
evidence — but it is not free.

### Concrete recommendation for the pilot (N = 18)

- **Concurrency**: Piston's `max_concurrent_jobs` at **48** or higher (2N with
  headroom). If it is lower, jobs queue — and our fetch ceiling is
  `timeLimitMs + 5000 = 10 s`, so anything that queues longer than that comes
  back as `provider_timeout` and the learner is silently unmeasured.
- **Memory**: `EXECUTION_LIMITS.memoryLimitMb` is 256, sent as
  `run_memory_limit: 268435456` bytes. A ceiling is not a reservation — a
  beginner's Python is 10–25 MB resident — but the worst case at peak is
  `36 x 256 MB = 9.2 GB`. Provision **at least 4 GB** and rely on
  `max_concurrent_jobs` as the real backstop, or lower `memoryLimitMb`.
- **CPU**: each job needs a core slice for up to 5 s. **4 vCPU minimum**; 8 if
  the whole class submits an assessment simultaneously.
- **Output**: set Piston's `output_max_size` to **at least 65536 bytes** to
  match `EXECUTION_LIMITS.maxOutputBytes`. Piston's shipped default is far
  smaller, and Piston enforces its own limit by **killing the job with
  SIGKILL** — which this adapter reads as `time_limit_exceeded`. A correct but
  chatty program would then be recorded as the learner's algorithm being too
  slow. Verify this against the deployed build before the pilot; it is the most
  likely way for real evidence to be quietly wrong.
- **Timeouts**: Piston's `run_timeout` is supplied per request (5000 ms) and
  must not be capped lower by the server's own configuration. Our fetch gives
  up 5 s after that. The layering is deliberate and is asserted by
  `tests/exec/piston-conformance.test.ts`: the judge must always get the chance
  to report a learner timeout before we give up on the judge.

### There are no retries, and none should be added

Nothing in the execution path retries. A failed execution is attempted exactly
once; a submission that hits an infrastructure failure on case 3 abandons cases
4 and beyond rather than re-running anything. Both are asserted.

Retrying an *execution* would be harmless — a sandboxed program has no side
effects. Retrying a *submission* would not, and the two are one HTTP call apart:
`/api/learning/submit` has **no idempotency key**. It appends
`verdict_received` and `failure_attributed` events on every call and derives the
learner's prior-failure count by counting those rows, so a submission that
reaches the route twice is counted as two attempts by the same child. That
inflates their failure count, advances the reveal policy (which the programme
requires to withhold a solution idea until several attempts have passed), and
feeds the reducer an attempt that never happened.

**A client-side retry on a failed Submit will double-count a learner's work.**
If a retry is ever wanted it belongs inside `runCases`, around a single case,
and never around the route.

### Rate limits, as they stand

`/api/exec/run` takes a token per **learner** — capacity 30, refill 20/minute —
never per IP, because a school is one NAT gateway and an IP bucket would let one
busy student throttle the whole class. Eighteen different learners never
throttle each other; one learner pressing Run 31 times in a minute gets a 429.

`/api/learning/submit` has **no rate limit at all**. One learner in a loop can
generate unbounded judge load. For a supervised pilot of 18 this is acceptable;
it is not acceptable at school scale.

---

## Before the pilot: what a real Piston must still prove

None of this is testable without an instance. Each line is a thing the
conformance suite explicitly does not cover.

- [ ] `import os` cannot read the host filesystem, the app's environment, or the network.
- [ ] A fork bomb and a memory bomb are contained and do not take the box with them.
- [ ] `output_max_size` is at least 65536 (see above — this one silently corrupts evidence).
- [ ] A per-request `run_timeout` of 5000 ms is honoured and not capped lower.
- [ ] Version range `3.*` resolves to an installed python3 runtime. If it does not, every request 400s and every learner is unmeasured — `/api/health?probe=1` is the check.
- [ ] 36 concurrent executions complete without any exceeding our 10 s ceiling.
- [ ] The host is in Kazakhstan, and the app can reach it. The data-residency commitment rests on this one and on nothing in this repository.
- [ ] `PISTON_URL` is not publicly reachable, or is authenticated. Piston executes arbitrary code by design.
