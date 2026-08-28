# Hybrid Python Execution

**Run happens in the learner's browser. Submit happens on our server. The two are
not the same kind of fact, and nothing in the system is allowed to confuse them.**

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
  it is not in CI, because CI has no browser.
- **One browser, one machine.** Chrome on macOS. Not Safari, not a school laptop,
  not a phone.
