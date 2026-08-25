# Verified coupling — the adversarial pass

`LEARNING_INTELLIGENCE_MAP.md` describes the architecture. This document is the
result of trying to **break** its central claim — *"this is a domain-neutral core
with a CP adapter bolted on"* — by three independent audits, each with a
different lens (string literals, the import graph, runtime/environment), each
told to falsify rather than confirm.

**The claim survived at the file level and did not survive at the pipeline
level.** Every finding below was re-verified by hand against the source before
being written down; a few of the audits' alarms turned out to be benign on
inspection and are recorded as such rather than dropped.

Read this before you plan the integration. It is the difference between "copy
three packages" and knowing what you are actually getting.

---

## The honest summary

The **reasoning** is domain-neutral. The **evidence it reasons over** is not.

`decisionEngine.ts` imports only types. `learnerState.ts` and `episode.ts` have
zero runtime dependencies. The confidence model, the action priority, the hint
ladder and the version/replay architecture are all genuinely portable, and the
189 tests that cover them run in plain Node.

But several of those functions are **thin folds over inputs that only a
code-judge can produce**. They will not crash without those inputs. They will
quietly return less.

That is the thing to design around.

---

## 1. Silent degradation — the findings that matter most

These do not error. They return a valid, poorer answer.

### 1a. `progressed` and `regressed` become unreachable

`interventionOutcome.ts:164-174`

```ts
const deltaTests = delta(intervention.pre_tests_passed, lastTestsPassed);
if (deltaTests !== null && deltaTests < 0) return { outcome: "regressed", ... };
if (deltaTests !== null && deltaTests > 0) return { outcome: "progressed", ... };
```

`delta()` returns `null` whenever either count is absent. Without per-test pass
counts on two successive attempts, **two of the seven intervention outcomes can
never fire**. Everything downstream that reads them — `hintEffectiveness`,
`intervention_outcome_counts`, the `learning_action_effectiveness` view — sees a
population in which no hint ever made anything better or worse.

> **What to do:** if your assessments are scored out of N, emit `tests_passed` /
> `tests_total` and this works unchanged. If an item is pass/fail, use `1`/`0` —
> `progressed` then means "got it on a later attempt". Do not leave it absent.

### 1b. `thrash` vs `stuck` collapses

`episode.ts:478-499` (`isStagnant`)

The struggle classifier's most useful distinction — *editing a lot and getting
nowhere* versus *not editing at all* — is decided by hashing successive verdicts
with their per-test counts. Without them, `progression_delta` (`episode.ts:244`)
is null and the split degrades.

`struggle_class` feeds `REDUCE_ASSISTANCE`'s unproductive-struggle override,
which is the rule that lifts the hint cap for a learner who is genuinely stuck.
Losing it means a drowning learner stays capped.

### 1c. The ingest route defaults `language` to `"cpp17"`

`src/app/api/learning/events/route.ts:208`

```ts
language: typeof clean.language === "string" ? clean.language : "cpp17",
```

Any code event arriving without a declared language is labelled C++17, which
then selects the C++ starter template for boilerplate detection. This is in the
**adapter** (not exported), but if you copy the ingest route's shape, do not
copy this default.

---

## 2. Judge vocabulary inside the "clean" core

Real, and in files this archive ships.

| Where | What | Impact |
|---|---|---|
| `events.ts:391-434` | `LEARNING_VERDICTS` + `toLearningVerdict` — a Judge0/ICPC status matcher | **Replace.** Your grader has different statuses |
| `events.ts:443-450` | `FAILURE_CLASSES`, documented as mirroring `attribution.py` | Extend; `failureClass` is typed `string` so the core accepts yours |
| `decisionEngine.ts:206-222` | `humanize()` → *"a compile error"*, *"a crash"*, *"the running time"* | **Learner-facing prose.** Interpolated into `explainDirective`. Rewrite for your domain |
| `decisionEngine.ts:78, 307-313` | `TaskRequest.requires: "degenerate_cases" \| "complexity_gate"` | Pack-verification vocabulary. `complexity_gate` is meaningless in a classroom |
| `learnerState.ts:466` | `"…left the learner passing fewer tests than before"` | Judge prose — but inside `hintEffectiveness`, which is dead code |
| `diff.ts:67-123, 150` | Two comment syntaxes only: `#` if `language.startsWith("python")`, else C-family | Fine for Python/C-family; a Lisp or Ruby curriculum needs a branch |
| `diff.ts:201-208` | `SEMANTIC_IDENTIFIERS` includes `lower_bound`, `push_back`, `nullptr` | Cosmetic. Makes `isPureRename` conservative about STL swaps |

**`toLearningVerdict` has one genuinely dangerous behaviour** (`events.ts:423`):
it returns `null` — meaning *"infrastructure failed, this is not a learning
outcome"* — for any status containing `timeout`, plus `no_tests`, `queue`,
`pending`, `processing`. If your grader says `timeout` when a **learner's** code
is too slow, that failure is silently discarded rather than recorded. Check this
mapping against your grader's vocabulary before you emit a single verdict.

---

## 3. `attestation.ts` — I classified this too generously

`LEARNING_INTELLIGENCE_MAP.md` calls it CORE and says it "works anywhere". The
envelope does. The payload contract does not:

```ts
// attestation.ts:114
if (typeof body.request_id !== "string" || typeof body.problem_id !== "string") return null;
```

A hard reject on a field named `problem_id`. `AttestedSubmission` (`:40-53`) is a
judge-submission shape throughout: `problem_id`, `submission_id`, `judged`,
`tests_total`, `tests_passed`, `first_failing_test`.

**Corrected classification:** the HMAC construction (canonical JSON, timing-safe
compare, TTL, future-skew rejection — `:77-131`) is genuinely reusable. The
`AttestedSubmission` interface is a SolveX adapter contract and you will rewrite
it. Keep the crypto, replace the shape.

One more trap: `verifyAttestation` returns `null` for a missing secret, a
malformed token **and** a forged signature alike (`:82`). Combined with the
`typeof window` guard at `:65`, a misnamed env var is indistinguishable from an
attack. **Assert the secret is present at boot**; do not rely on this path to
tell you.

---

## 4. Things that looked alarming and are not

Recorded because a scan will flag them again, and because dismissing a finding
without saying why is how the next reader loses trust in the whole document.

**`interventionMemory.ts:94` — `checkedAt: new Date(0).toISOString()`**
Every `ActionOutcome` is stamped `1970-01-01T00:00:00.000Z`. This is *correct*:
`verifyAction` is a pure function and does not read the clock, and the caller
stamps the real time when persisting (`reduce/route.ts:285` →
`learning_action_outcomes.checked_at`). **But it is a trap for you:** if you
consume `verifyAction`'s return value directly rather than through a persistence
layer, every timestamp is the epoch. Stamp it yourself.

**`node:crypto` in `diff.ts:24` and `attestation.ts:1`**
Blocks a browser bundle — `node:`-prefixed specifiers are not polyfilled by
webpack 5 or Vite. Not a problem: both modules are server-side by design, and
`attestation.ts` deliberately refuses to run when `window` is defined. Just do
not import them into client code.

**`task_ref` documented as `'cf:1234A'`**
Comment only. The field is an opaque string everywhere it is read
(`episode.ts:292`, `learnerState.ts:112/301`), and SolveX's own fixtures use
`solvex:` prefixes.

**`"use client"` at the top of `client.ts`**
Inert outside Next. That file does not travel anyway.

**~109 lines of CP vocabulary in doc comments** across the core files.
Comments, not code. Left verbatim on purpose — rewriting them would have meant
touching files whose behaviour parity is the point of this export. Read them as
*"here is the concrete case this rule came from"*, not as a spec.

---

## 5. What this changes about the integration plan

Nothing in §1–§3 makes the core unusable. It changes the **order of work**:

1. **Decide your grading vocabulary first**, before emitting any event. You need
   an answer for `verdict`, `tests_passed`/`tests_total`, and which of your
   grader's statuses mean "infrastructure broke" versus "the learner was wrong".
   Getting this wrong is silent.
2. **Rewrite `humanize()` and `TaskRequest.requires` early.** They are the two
   places CP vocabulary reaches a learner's eyes and your catalogue's query.
3. **Treat `attestation.ts` as crypto + a contract you own.**
4. Then the rest of `README_SOLVEX4SCHOOLS_INTEGRATION.md` §15 applies.

And keep the perspective the audit itself reached: the parts that decide *what to
teach* are a thin function over evidence. **The core is not the hard part of this
migration — producing trustworthy school evidence is.** That is exactly what
`SOLVEX4SCHOOLS_ADAPTER_SPEC.md` is about.
