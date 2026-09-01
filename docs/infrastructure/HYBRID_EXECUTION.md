# Hybrid Execution

**Run happens in the learner's browser. Submit happens on our server. The two are
not the same kind of fact, and nothing in the system is allowed to confuse them.**

> **The engine changed; the architecture did not.** This document was written for
> Pyodide, and every mention of Pyodide/CPython below describes the Python-era
> implementation. Year One now teaches GNU C++17: Run is the vendored WASI Clang
> toolchain in `public/cpp17/` (`clang.wasm` + `lld.wasm` + `sysroot.tar`), and
> Submit goes to Judge0 CE language 105, GCC 14.1.0.
>
> Everything this document argues about the SPLIT is unchanged and still load-
> bearing: what the browser may assert, why a `run_executed` report can never
> grant a verdict, why the server is the only source of a graded outcome, and why
> the two halves are allowed to disagree. Read it for that. For the engines
> themselves see `../cpp17/CPP17_JUDGE_PARITY.md` and `JUDGE0_LIVE_VALIDATION.md`;
> the Python-era live measurements are preserved in
> `JUDGE0_LIVE_VALIDATION_PYTHON_ERA.md`.

---

## 1. Why the split exists

A Grade 9 learner writing their first `for` loop presses Run twenty times in a
lesson. Nineteen of those presses are them finding out whether the thing they
just typed does anything at all. Sending each one to a sandboxed judge costs a
container start, a network round trip and a slot that eighteen other children are
queueing for — to answer a question the learner could have answered locally in
four milliseconds.

So Run runs locally, under Pyodide: real CPython, compiled to WebAssembly,
executing in a Web Worker in the learner's own tab. It is free, it is instant, it
works when the school's connection drops, and the learner's source never leaves
their laptop.

It is also **produced by the party being assessed**, on a runtime they can open
DevTools and edit. That is not a flaw to be mitigated. It is the defining
property, and the entire design follows from taking it seriously.

## 2. The trust model

Two values, and there is no third:

| | `client_local` | `server_verified` |
|---|---|---|
| Where | The learner's browser, under Pyodide | Our server, against cases they have never seen |
| Good for | Feedback, iteration, context for Nova | Evidence about a learner |
| Who controls it | The learner | Us |

Defined in `schools/execution/trust.ts`. Three properties make it hold:

**Trust is a property of the executor, not of the outcome.** The tempting
shortcut is `status === "ok" → trusted`. That is exactly the bug: a Pyodide run
that prints the right answer has `status: "ok"` and is worth nothing as evidence.
Trust is set where the execution happened and carried, never recomputed.

**The browser cannot spell the trusted value.** `LocalRunResult.trust` is typed
as the literal `"client_local"`, not as `ExecutionTrust`. Assigning
`"server_verified"` to it is a compile error, at every construction site,
including ones written next year by someone who has not read this file.
`tests/execution/trust.test.ts` pins that with a `@ts-expect-error` — and removing
the directive was verified to produce `TS2322`, so the guard is real rather than
decorative.

**A local result has no verdict to report.** `LocalRunResult` carries stdout,
stderr, a status and a duration. It has no `passed`, `correct`, `verdict` or
`score` field, and a test asserts it never grows one. The browser could not
compute one honestly anyway: it has no expected output, and if it ever did, the
answer key has already leaked.

### Where a browser result is enough, and where it is not

`schools/execution/trust-policy.ts` holds the answer as data, in one table,
because "may a Pyodide pass count here?" answered inline gets answered eight
times by eight people, and the seventh — under deadline, on the contest screen —
gets it wrong in the direction that makes the feature work.

| Surface | Local Run | Check must be | Without a judge |
|---|---|---|---|
| `lesson_guided` | yes | `client_local` | works normally |
| `lesson_practice` | yes | `client_local` | works normally |
| `independent_evidence` | yes | **`server_verified`** | teacher review |
| `assessment` | yes | **`server_verified`** | teacher review |
| `contest` | yes | **`server_verified`** | **unavailable** |
| `final_tournament` | yes | **`server_verified`** | **unavailable** |

Local Run is allowed *everywhere*, including on the assessment. That is
deliberate: what is gated is the **check that produces evidence**, never the
learner's ability to try their own code. A learner iterating on a hard problem
must not be pushed through the judge on every attempt — the programme's whole
cost model depends on it.

The type for the degraded column has three values and none of them means "just
use the browser then". That absence is the point.

### Applied to the real curriculum

`surfaceForBlock()` derives the surface from the block, so a task cannot be
rendered somewhere that quietly downgrades what it requires. Against September's
authored content (`tests/school/curriculum-surfaces.test.ts`):

- **3 blocks** → `assessment` — the monthly check's coding half
- **11 blocks** → `independent_evidence` — `m1.p1`…`m1.p9`, the practice unit the
  programme counts toward its «~100 толық дербес шешім», plus the two lesson-8
  challenges
- **18 blocks** → `lesson_guided` — the teaching steps

Fourteen of thirty-two code blocks require the judge. Eighteen do not, and those
eighteen are where most of a learner's presses go.

## 3. What actually runs, measured in a real browser

Node's vitest has no `Worker` and no WebAssembly Pyodide. Everything in
`tests/exec/pyodide-runner.test.ts` runs against an injected fake worker — the
right way to test a state machine, and no evidence whatsoever that CPython
executes in a learner's browser.

That was tested separately, by hand, in Chrome against the running app. Full
procedure and results: **`scripts/manual/pyodide-browser-probe.md`**. The
headlines:

- **CPython 3.14.2 boots in 7.7 s cold**, 4.2 s warm. Sixteen real programs —
  stdin parsing, `//` vs `/` vs `%`, negative modulo, f-strings, Kazakh output,
  `sys.exit`, `EOFError` — all correct.
- **`SyntaxError` and `IndentationError` classify as `syntax_error`**, not
  `runtime_error`. The server had exactly this bug; the local half does not.
- **Tracebacks show the learner's own line numbers** (`File "main.py", line 2`).
  The harness frame is dropped.
- **`while True: pass` does not freeze the tab.** The worker never answered, the
  main thread kept executing scheduled tasks throughout, `terminate()` returned
  in 1 ms, and a fresh worker ran correctly straight afterwards.
- **An 8.2 MB output bomb was truncated to 65 559 bytes** in 381 ms, enforced as
  output accumulated rather than after the fact.

## 3a. The worker cannot be bundled, and that is not negotiable

The defect that only a real browser could find, and the reason §3 is not
optional ceremony.

`new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })` is the
documented way to ship a bundled worker. Turbopack passes `{ type: "module" }`
through to the constructor and then wraps the worker in its own bootstrap, and
that bootstrap ends:

```js
importScripts.apply(self, t)
```

`importScripts` exists only in a **classic** worker. So the emitted worker is
classic in practice, and the first thing ours does inside it —
`await import(baseUrl + "pyodide.mjs")` — fails with the browser's own words:

```
Classic web workers are not supported
```

**Pyodide cannot be loaded from a Turbopack-bundled worker at all.** Every unit
test passed throughout, because they inject a fake worker and never construct a
real one; the dev lab's status line said `phase: unavailable` the first time it
was opened in Chrome.

The fix is the same one the runtime already uses: `scripts/build-python-worker.mjs`
compiles `src/lib/pyodide/worker.ts` with esbuild to `public/pyodide-worker.js`
as plain ESM, wired to `prebuild` and `predev`, and `defaultWorkerFactory`
constructs from that URL. `worker.ts` stays the single source of truth — still
TypeScript, still type-checked, still unit-tested through its exported pure
functions. Only the delivery changes.

Verified afterwards in Chrome through the real application code path:
`phase: ready`, `pyodide 314.0.6`, `python (reported) 3.14.2`, and the dev lab
reporting **"THE ENGINES AGREE — same outcome class and byte-identical stdout"**
for `n = int(input()); print(n * n)`, and `time_limit_exceeded` on both engines
for `while True: pass`.

A second defect surfaced the same way: the runner had **no boot timeout**.
`boot_failed` covers a fetch that fails; nothing covered one that never answers —
a school connection dropping mid-download of a 13 MB WASM file. `ensureReady()`
waited on a promise nobody would settle and, because `run()` serialises behind
it, the Run button span for the rest of the lesson. `BOOT_TIMEOUT_MS` is 30 s,
chosen against the measured 7.7 s cold boot rather than as a round number.

## 4. The security boundary

### What the worker receives

`WorkerInbound` has exactly two message shapes, and between them four payload
fields: `baseUrl`, `id`, `source`, `stdin`, `maxOutputBytes`. There is no field
that could carry a secret, which is a stronger guarantee than a rule about what
callers should send.

`src/lib/pyodide/worker.ts` imports two things, both type-only:
`LocalExecutionStatus` and Pyodide's own types. Nothing from `@schools/exec`,
which is `server-only` and would be a build error anyway.

### What never reaches the browser

Hidden test cases, reference solutions, expected outputs, `correctOptionId`,
`breakingInputs`, `fixedCode`. `publicBlock()` in `schools/curriculum/public.ts`
strips them and emits `visibleCases` plus a `hiddenCaseCount` integer — that
separation predates hybrid execution and is why the client had nothing dangerous
to hand Pyodide in the first place.

### What learner Python *can* reach — measured, not assumed

A Web Worker has no `document`, no `window`, no `localStorage` and no
`document.cookie`. Pyodide adds no filesystem (`/etc/passwd` is
`FileNotFoundError`), no subprocess (`emscripten does not support processes`) and
no working sockets.

It does have **`import js`**, and therefore `from js import fetch` — a working
`fetch` bound to the app's origin, carrying the learner's own cookies.

**This is not a new hole.** Anything Python-via-`js` can do, the learner can do
faster in their own DevTools console on the same page — which is precisely the
assumption `client_local` encodes. Nothing there can forge a `server_verified`
result, because trust is stamped server-side and never read from a request body.

It has two consequences that are worth acting on, and both are addressed:

1. **It makes the ingest allowlist load-bearing.** See §5.
2. **It is the reason the missing CSP matters.** See §7.

## 5. A learner cannot grade themselves

This was found while wiring the hybrid path, and it predates it.

`/api/learning/events` — the one write path from an untrusted browser into the
append-only ledger — documented itself as refusing "the OUTCOME events, entirely".
It did not. Its only filter was `isLearningEventName`, so any signed-in learner
could POST

```json
{"eventName": "verdict_received",
 "payload": {"verdict": "accepted", "task_ref": "block:m1.p3"}}
```

and the row was stored. It landed stamped `source_trust: 'browser'`, which was
the correct stamp and no defence at all, because **nothing read the stamp**:

- `blockAttempts` counted accepted verdicts with no trust predicate → the
  teacher's console showed the block as solved;
- `solveEvidence` did the same → it feeds the delayed re-solve, the programme's
  fifth independence check;
- `reduceEpisode` had no `source_trust` on its input type at all, so a forged
  verdict became an accepted episode with `independence_weight: 1` — an unaided
  solve, in the number the whole programme is measured on.

Fixed at three layers, each independently verified by reintroducing the defect
and watching the corresponding test fail (`tests/school/forged-outcomes.test.ts`):

1. **Ingest refuses to create one.** `isClientReportable()` in
   `packages/learning-contracts` derives the allowlist from `EVENT_TRUST` rather
   than restating it, so the two cannot drift, and excludes `verdict_received`
   explicitly — the submit route is its only legitimate writer.
2. **The reducer refuses to settle on one.** `ReducibleEvent` now carries
   `source_trust`, and `isTrustedOutcome()` gates `verdict_received` and
   `failure_attributed`. This made the reducer's own header comment true; it had
   claimed outcomes were "derived from signed judge/verifier events" while having
   no way to tell.
3. **The read path requires judge trust.** `blockAttempts` and `solveEvidence`
   filter on `source_trust = 'judge'`, because a pilot database may already hold
   rows written before layer 1 existed.

Everything a browser *is* the rightful witness to still flows: `run_executed`,
`statement_revisited`, `idle_gap`, `test_case_authored`, the episode lifecycle.
The browser is the only thing that knows a learner went idle.

### The twin: a learner cannot write into someone else's episode

The same route, the same shape of defect, found by an adversarial review of the
Run button. Its header also claimed «`ownedEpisodeId` refuses one that belongs
to another learner, exactly as the submit and hint routes already do» — and the
code was `episodeId: typeof e.episodeId === "string" ? e.episodeId : null`.

It was unreachable rather than closed: `statement_revisited`, the only client
event on this route, sends no episode. **The Run button changed that.**
`run_executed` carries an episode so a Run joins the same episode as the
eventual Check — correct, and it turned a dead field into a live one.

What a foreign episode id bought, all of it episode-keyed with no subject
predicate: `enforceHintPolicy` reads `eventsForEpisode(episodeId)` and counts
`run_executed` as effort, so an injected Run grants a hint level in a victim's
episode; `reduceEpisode` folds it into `runs` and into the `meaningful` filter
that separates `stuck` from `productive_struggle`.

The route now resolves every distinct id through `ownedEpisodeId` before
building any row. A foreign id is **substituted, not refused** — the caller's
own events still land, in an episode of their own — because a 403 would drop a
legitimate client's work over a stale id.

### And the hint ladder cannot be climbed by pressing one button

`hasEffortAfter` exists to stop the ladder being climbed by asking repeatedly.
Emitting `run_executed` on every press reopened it from the other side:
`print(1)` plus N presses of a button bought N levels of help, with no edit.

`isNewRunEffort` counts a press only when the source or the stdin changed since
the last reported run. Running the same program on a new input is effort; so is
changing the program; pressing the same button on the same two things is
watching the same result again.

## 6. Running without a judge at all

`EXEC_PROVIDER=none` is a supported deployment, not a misconfiguration.

Before the browser could execute Python there was no such thing as a deployment
without a judge — every code task simply failed. Now a school can genuinely
operate without one: learners write code, run it, see real Python output,
iterate. What they do not get is evidence.

- `getExecutionProvider()` returns `CodeExecutionProvider | null`. Nullable
  deliberately, so every caller must write the "no judge" branch — the branch
  that gets forgotten when absence is signalled at runtime.
- `executionProviderProblems()` does **not** fail production boot on `none`.
  Making it fail would push an operator to set `EXEC_PROVIDER=piston` with a dead
  URL just to start the app, turning an honest "no evidence" into a judge that
  appears configured and times out on every submission.
- Submit returns a **third** `unmeasuredReason`: `no_trusted_judge`, distinct
  from `judge_unavailable`. That distinction is the whole point — the outage
  string promises «кейінірек қайта тексере аласың» (*you can check again later*),
  which said to a `none` deployment is a lie repeated daily for a month.

### Release modes — derived, never declared

`schools/execution/release-mode.ts`. There is no `RELEASE_MODE` variable, and
that is the design: a school that sets `hybrid_production` with no judge behind
it has not configured a judge, it has written a word.

| Mode | Browser | Judge | Consequence |
|---|---|---|---|
| `HYBRID_PRODUCTION` | yes | yes | every surface produces evidence |
| `LOCAL_PILOT` | yes | no | 4 of 6 surfaces produce none; contests cannot run |
| `SERVER_ONLY_FALLBACK` | no | yes | Run and Submit both go to the server |

`SERVER_ONLY_FALLBACK` is **per learner, not per deployment**: the same server is
`HYBRID_PRODUCTION` for seventeen students and this for the eighteenth whose
laptop will not run WebAssembly. This is why `/api/exec/run` still exists and
must not be deleted — it is the only path that survives a browser without WASM.

## 6a. The trusted judge is Judge0 CE, via RapidAPI

Submit's provider. Full design and operator runbook:
`docs/infrastructure/JUDGE0_RAPIDAPI_AUDIT.md` and
`docs/infrastructure/JUDGE0_RAPIDAPI_SETUP.md`.

```
RUN    → Pyodide, in the learner's browser        → client_local   (free)
SUBMIT → SolveX backend → Judge0 CE via RapidAPI  → server_verified (metered)
         → hidden cases stay on our server
         → SolveX checker decides pass/fail
         → trusted LearningEvent → Learning Intelligence
```

`Judge0RapidApiProvider` is one more implementation of the `CodeExecutionProvider`
port that Piston already implements. Nothing above the port knows RapidAPI exists —
not the curriculum, not the lesson UI, not the learner, who sees «Тексерілуде…»
and then a result.

**Judge0 executes; it does not grade.** `expected_output` is never sent. SolveX's
own `token` / `exact` / `numeric` checkers are curriculum decisions and stay
authoritative — and not sending it also keeps the answer key off RapidAPI.

**Async only.** `POST /submissions?base64_encoded=false&wait=false` → token →
bounded polling on `GET /submissions/{token}`. Judge0's documentation says
`wait=true` may be disabled and is not recommended at scale, so it is not used.

**The browser never contacts `judge0-ce.p.rapidapi.com`.** Every call is
server-side, and the key is server-only. Consequence for §7's CSP: **RapidAPI
does not belong in `connect-src`.** A future CSP needs to cover only what the
browser actually fetches — the Pyodide runtime and worker from `'self'`, Nova's
endpoint, and the app's own assets. Judge0 stays invisible to it.

### Run must not spend Submit's money

The cost model is that a learner iterates twenty times for free and pays for one
verification. Judge0 is the first provider where "pays" is literal, and one path
threatened it: `/api/exec/run`, the fallback for a browser that cannot load
Pyodide, is rate limited at 20/minute per learner — **360 RapidAPI requests a
minute across eighteen learners**, of untrusted, ungraded, typing-speed traffic,
before anyone presses Check.

That budget belongs to Submit. So `CodeExecutionProvider` now carries
`readonly metered`, and the Run fallback refuses a metered provider outright.
A learner without WebAssembly loses a convenience; the class keeps its graded
course. `local` and `piston` are free and unaffected.
(`tests/school/metered-provider-cost.test.ts`)

### The demand, measured from the curriculum

September's coding blocks declare a **median of 5 test cases** (mean 4.8, max 9)
across 31 graded blocks — 150 cases, 99 of them hidden. So:

| | Judge0 submissions |
|---|---|
| one learner presses Check once | **~5** (up to 9) |
| eighteen learners press Check once | **~87** (up to 162) |

Each submission is one POST plus several polling GETs. **Whether any RapidAPI
plan supports that is UNKNOWN to this repository** — it needs a key and a look at
the dashboard. The arithmetic is in `JUDGE0_RAPIDAPI_SETUP.md` so an operator can
do the division against their own plan before a class relies on it.

### If the judge is down

Run keeps working — it never needed the server. Submit does **not** silently fall
back to grading a Pyodide result as `server_verified`; that would destroy the only
distinction this subsystem exists to make. It reports that trusted verification is
unavailable, the verdict stays `unknown`, and no learner is marked wrong. 429, 401,
403, Judge0's own Internal Error and our own timeout all take that path.

## 7. Deployment

### Assets

`scripts/sync-pyodide-assets.mjs` copies five files out of `node_modules/pyodide`
into `public/pyodide/` on `prebuild` and `predev`. Consequences, all intended:

- The version served is the version in `package.json` **by construction**, not by
  someone remembering to bump a CDN URL.
- A school whose connection drops mid-lesson keeps working; there is no
  third-party host to be unreachable.
- 13 MB stays out of git (`public/pyodide/` is gitignored) and out of every clone.

`public/pyodide/**` is eslint-ignored: it is Emscripten's generated output, one
1.2 MB line of it, and every complaint eslint has about it is a complaint about a
compiler.

### The Content-Security-Policy this needs — and does not have

**This app sets no CSP.** There is no `middleware.ts` and no `headers()` in
`next.config.ts`. Nothing is currently blocked, so Pyodide works; the gap is that
nothing is currently *enforced* either.

The residency commitment in `docs/CODE_EXECUTION_DECISION.md` is that a Kazakh
student's code never leaves their laptop. With `fetch` reachable from learner
Python (§4), that commitment today rests on our code not doing it rather than on
the browser refusing. The header that turns it into a guarantee:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  connect-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

`'wasm-unsafe-eval'` is unavoidable — it is what compiling a WebAssembly module
means. `connect-src 'self'` is the line that carries the residency claim.

**Not added in this change**, because a strict CSP applied app-wide without
testing every page against it is how a pilot breaks on a Monday morning. It
belongs in a change that can be verified page by page, and it is listed as a
release blocker rather than quietly omitted.

### The Python version skew

| | |
|---|---|
| Browser (`pyodide@314.0.6`) | **CPython 3.14.2** |
| Server (`PYTHON_RUNTIME.version`) | **3.12.0** |

Two minor versions apart, and it is deliberate for now. There is no Piston
instance yet, so the server pin describes an intention rather than a running
service; downgrading to `pyodide@0.27.7` would match it exactly (that line ships
CPython 3.12.7) at the cost of dropping 87 releases of a runtime that executes
untrusted code. Choosing that trade before the judge it is matching exists is
guessing.

Language semantics are identical across 3.12 and 3.14 for everything September
teaches. **What differs is error message wording** — CPython rewrote diagnostics
substantially across 3.13 and 3.14, so a learner can read a materially more
helpful traceback locally than the judge would produce for the same mistake, and
Nova is reading whichever one the learner got.

`tests/school/python-version-skew.test.ts` asserts the *known* skew rather than
demanding equality, so that changing either side — including fixing it — forces
someone to come and decide deliberately.

## 8. What is still not proven

- **No Piston instance exists.** Container isolation, the memory cgroup, the
  network lockdown and host throughput remain untested; four separate attempts to
  stand one up on this machine are recorded in
  `docs/deployment/PRODUCTION_ENVIRONMENT.md`. Everything in §6 about running
  *without* a judge is real and tested; everything about running *with* one is
  tested against a protocol-faithful fake.
- **No CSP.** §7.
- **The browser probe is manual.** §3 was run by hand in Chrome and written down;
  it is not in CI, because CI has no browser. Two real defects reached a green
  test suite before it was run — the classic-worker blocker (§3a) and the missing
  boot timeout — so this is not a formality.
- **One browser, one machine.** Chrome on macOS. Not Safari, not a school laptop,
  not a phone.
- **The lesson player's Run panel has not been rendered.** vitest here is
  node-only with no jsdom, so the panel is asserted through the pure functions in
  `run-state.ts` and against its own source text. The dev lab proves the runner
  and Pyodide; it does not prove the panel's layout, its disabled states in situ,
  or that its `aria-live` region announces. One accessibility defect was found by
  reading rather than running — the live region carried `empty:hidden`, which is
  `display: none`, so it entered the accessibility tree in the same commit that
  filled it, exactly the failure its own comment said it existed to prevent.
- **The parity harness's server side is the dev subprocess provider, and it is
  the outlier of the three engines.** It runs `python3 -I -S -c <source>`, while
  Piston sends `files: [{ name: "main.py" }]` and the browser harness writes
  `main.py`. Browser and Piston agree; the stand-in differs — visibly in every
  traceback path, and in status category for any program touching `__file__`. A
  divergence it reports must be checked against Piston before it is believed.
- **The local-runtime beacon has no route yet, and must not get an anonymous
  one.** `recordLocalRuntimeSignal` feeds `broken` → `hybridCheck` →
  `/api/health` returning 503, so an unauthenticated caller could hold the
  monitored health endpoint red indefinitely. The warning is on the function.
