# Hybrid Execution — Audit of What Already Exists

Written before any Pyodide code, to answer one question: **what of the existing
execution subsystem survives the split into local Run and server Submit, and
what has to change?**

The rule this audit is written against: *do not duplicate an existing correct
abstraction.* A browser Python runner is a genuinely new thing. A trust column,
an output checker, a payload limit and a status vocabulary are not — they exist,
they are tested, and re-inventing client-side copies of them is how the two
halves end up disagreeing about what "too big" or "wrong answer" means.

## The four facts that shape everything

**1. The lesson player has no Run button today.** `grep -rn "api/exec/run|onRun|handleRun" src/components/brilliant/lesson/` returns nothing. `/api/exec/run` has exactly one caller in the whole repo — `src/app/dev/execution/page.tsx`, an internal page. So Run is being *built*, not *migrated*. There is no existing learner-facing behaviour to preserve or regress.

**2. `run_executed` is already in the taxonomy, already marked `browser`, and nothing emits it.** `packages/learning-contracts/src/events.ts` lists it under "Execution and outcome" with `EVENT_TRUST.run_executed = "browser"`. `schools/nova/enforce.ts:102` counts it as *effort* in the hint ladder. Since nothing writes it, a learner who iterates ten times with Run currently accumulates zero effort in Nova's eyes and is treated as though they asked for hints without trying. **This is a live defect that the Run button fixes, not a new feature.**

**3. The trust vocabulary already exists in the store — under a different name.** `learning_events.source_trust` is a NOT NULL CHECK-constrained column (`0003_learning_events.sql:116`) over `('server','judge','verifier','browser')`. The new `ExecutionTrust` (`client_local` / `server_verified`) is a *narrower, execution-specific* type, not a competitor: it names where code ran, `source_trust` names who reported a row. They must be bridged (`client_local → browser`, `server_verified → judge`), not merged.

**4. Public/hidden case separation is already correct.** `schools/curriculum/public.ts` `publicBlock()` emits `visibleCases` plus a `hiddenCaseCount` integer and drops `referenceSolution`, `expectedOutput` on hidden cases, and every other secret. Whatever the browser can hand to Pyodide is already the safe subset. The leak scan over built output (0 leaks / 54 secrets / 120 files) is the standing proof. **Phase 21 is largely pre-satisfied; what it still needs is a test that says so about the Pyodide path specifically.**

---

## Classification

### SERVER_ONLY — must never reach a browser bundle

| Piece | Why |
|---|---|
| `schools/exec/index.ts` | `getExecutionProvider()`, `runCases()`. Carries `import "server-only"`. |
| `schools/exec/provider.ts` | `ExecutionStatus`, `EXECUTION_LIMITS`, `CodeExecutionProvider`. `server-only`. |
| `schools/exec/providers/local.ts` | Spawns a subprocess. `server-only`. |
| `schools/exec/providers/piston.ts` | Judge credentials, `PISTON_URL`. `server-only`. |
| `schools/exec/limits.ts` | `MAX_REQUEST_BYTES`, `sizeGuarded`. `server-only`. |
| `schools/exec/checker.ts` | Compares against `expectedOutput`. **The most important one on this list** — the checker takes the answer key as an argument, so shipping it to the client is one import away from shipping the key. |
| `src/app/api/learning/submit/route.ts` | The only trusted grading path. |
| Hidden cases, `referenceSolution`, `expectedOutput`, `breakingInputs`, `fixedCode`, `correctOptionId` | Already stripped by `publicBlock()`. |

All six `schools/exec/*` modules carry `import "server-only"` today. **Verified by grep, not assumed.** That import is what turns a mistaken client import into a build error rather than a leak, and it is the reason none of this needs re-litigating.

### CLIENT_ONLY — new, and must not acquire server dependencies

| Piece | Note |
|---|---|
| `src/lib/pyodide/worker.ts` | The only place Pyodide loads. Receives learner source + learner stdin. Nothing else. |
| `src/lib/pyodide/runner.ts` | Worker lifecycle: warm reuse, terminate-and-replace on timeout. |
| `src/lib/pyodide/use-python.ts` | React hook for the lesson player. |
| Run UI in `CodeTaskView` | stdin box, stdout/stderr panes, "Preparing Python…". |

The hard constraint on all four: **no import path from here may reach `@schools/exec` or `@schools/curriculum` internals.** The `server-only` imports enforce the first half. The second half is a matter of what props the block view is given, and is why `publicBlock()` mattering is finding #4 above.

### KEEP — correct as-is, both halves use it

| Piece | Why it survives untouched |
|---|---|
| `schools/curriculum/public.ts` | `visibleCases` / `hiddenCaseCount` is exactly the split the browser needs. |
| `schools/exec/checker.ts` semantics | `token` default, `exact`, author-declared `numeric` tolerances. The browser never runs a checker (it has nothing to check against), so there is no second implementation to keep in sync — **by design, not by accident**. |
| `EXECUTION_LIMITS` | Stays the server's budget. `LOCAL_LIMITS` is deliberately separate and deliberately *stricter* on time (3s vs 5s) and *identical* on output (64 KiB). |
| `schools/exec/providers/piston.ts` | Still the future trusted provider. The hybrid split does not remove the need for a real sandbox — it removes the need for one *per keystroke*. |
| `learning_events.source_trust` | The persistence-layer trust column. Bridge to it; do not add a second one. |
| `packages/learning-contracts` `run_executed` + `EVENT_TRUST` | Already correct. Only the producer is missing. |
| `src/app/api/learning/submit/route.ts` | Unchanged in its core: server-side, idempotent by `submissionId`, grades `answer.value` and nothing else. |

### ADAPT — exists, needs changing for the split

| Piece | Change |
|---|---|
| `src/app/api/exec/run/route.ts` | Becomes a **fallback**, not the primary Run path. It is still needed for the no-Pyodide case (old browser, WASM blocked, worker construction failure) and for `/dev/execution`'s side-by-side comparison. Its rate limit (30 burst / 20 per minute per learner) was sized as *the* Run path; once Pyodide carries the load, that budget is now headroom for the fallback rather than the normal case. |
| `src/app/dev/execution/page.tsx` | Already calls `/api/exec/run`. Phase 46 wants it to show Pyodide status and run **both** engines side by side so a divergence is visible rather than theoretical. This is an extension of a page that exists, not a new tool. |
| `schools/nova/prompt.ts` context | Nova must learn `executionSource` / `executionTrust` and see the learner's stderr. It must NOT learn hidden cases — `tests/nova/judge-secrets.test.ts` asserts the `PromptContext` type has no field for them, and that test is the guard on this change. |
| `schools/config.ts` `exec.provider` | Needs `none` as a legitimate value. Today `executionProviderProblems()` rejects anything that is not `local` or `piston`. In the hybrid world "no trusted provider configured" is a *supported, honest* state — local Run works, Submit says so plainly — and it must be expressible in config rather than a misconfiguration. |
| `schools/ops/health.ts` | Should report the trusted provider's absence as a **capability statement** ("checks produce no evidence"), not only as a config warning. |

### REMOVE

**Nothing.** No dead execution code was found. Every module has a caller or a test, and `/api/exec/run` has a real remaining job as the fallback. The temptation to delete it once Pyodide works should be resisted: it is the only path that survives a browser without WASM.

---

## The two new modules, and why they are not duplication

`schools/execution/trust.ts` and `schools/execution/trust-policy.ts` were written before this audit and are worth justifying against its own rule.

- **`ExecutionTrust` vs `SourceTrust`** — different questions. `SourceTrust` answers "how much do I believe this *row*", and its values include `verifier`, which has nothing to do with running code. `ExecutionTrust` answers "where did this *program* run". Collapsing them would mean `verifier` becomes a possible answer to "which Python interpreter executed this", which is meaningless.
- **`LocalExecutionStatus` vs `ExecutionStatus`** — deliberately separate unions, argued in the file: the browser has no memory cgroup and no unreachable judge, and it has a failure mode the server does not (the runtime failing to load). One shared union means every server `switch` grows cases it can never see.
- **`LOCAL_LIMITS` vs `EXECUTION_LIMITS`** — same reasoning. The 64 KiB output cap is duplicated *on purpose and identically*, because a program truncated locally must be truncated the same way on submit or the learner is graded on output they never saw.
- **`trust-policy.ts`** — genuinely new. Nothing in the repo previously answered "may a browser result settle this surface", because no browser result existed.

Neither file carries `server-only`, and that is the point: the worker and the lesson player need these types. **The safety comes from the server refusing to accept a client's claim, not from the client being unable to spell `server_verified`.** That refusal is the thing the tests must pin.

---

## What this audit says the build must not do

1. **Do not write a client-side checker.** The browser has no expected output. If a "local check" ever needs one, the answer key has already leaked.
2. **Do not let Pyodide produce a verdict.** `LocalRunResult` has no `passed` field and must not grow one. It has stdout, stderr and a status — that is the whole vocabulary of a Run.
3. **Do not delete `/api/exec/run`.** It is the fallback.
4. **Do not add a second trust column.** Bridge `client_local → browser` at the store boundary.
5. **Do not let the Run path import from `@schools/exec`.** The `server-only` imports make it a build error; keep it that way.
