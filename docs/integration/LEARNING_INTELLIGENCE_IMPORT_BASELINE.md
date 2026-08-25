# Learning Intelligence — import baseline

Required by the implementation brief before any integration work. This records
what the exported archive actually does **on this machine, before I changed
anything**, so that a later regression can be attributed.

**Date:** 2026-08-26
**Archive:** `solvex-learning-intelligence-for-solvex4schools.zip` (215,643 bytes)
**Extracted to:** a clean scratch directory, not into the repo.

---

## 1. Integrity

```
shasum -a 256 -c CHECKSUMS.sha256
```

| Entries | OK | Failed |
|---|---|---|
| 58 | **58** | **0** |

The archive is intact and unmodified.

---

## 2. Documented baseline vs. reproduced baseline

The export claims 209 TypeScript tests, 13 Python tests, and a clean strict
`tsc`. All three were reproduced.

| Suite | Command | Documented | Observed | Result |
|---|---|---|---|---|
| TypeScript | `npm test` (vitest run) | 209 passed | **209 passed**, 12 files, 531 ms | ✅ match |
| Python directive | `pytest tests/python/ -q` | 13 passed | **13 passed**, 0.07 s | ✅ match |
| Types | `tsc --noEmit` (strict) | clean | **clean** — *after* one fix, see §3 | ⚠️ see §3 |

The golden-fixture gate (`tests/golden.test.ts`, 26 assertions over 10 synthetic
learners) is inside the 209 and passed.

**Conclusion: the subsystem reproduces its documented behaviour. Integration may
proceed.**

---

## 3. One packaging defect found in the export

`npm run typecheck` fails on a clean install:

```
error TS2688: Cannot find type definition file for 'node'.
```

`tsconfig.json` sets `"types": ["node"]`, but `@types/node` is **not** in the
archive's `devDependencies`. This is an export packaging omission, not a source
defect: after `npm i -D @types/node`, `tsc --noEmit` exits **0** with no errors.

Recorded because the export's own README instructs the reader to run all three
checks and treat a `tsc` failure as a broken import surface. Here it is neither
— it is a missing dev dependency. Add `@types/node` when copying `packages/`
into this repo.

---

## 4. Environment notes that affect reproduction

**Python 3.10+ is required by the directive module.** `nova_directive.py` uses
`int | None` annotations. The system interpreter here is 3.9.6 (Xcode's), where
Pydantic v2 raises:

```
TypeError: Unable to evaluate type annotation 'int | None'
```

This is an environment limitation, not a code defect. The 13 tests pass once
`eval_type_backport` is installed, or natively on Python ≥3.10. **If a Python
service is ever deployed for the directive boundary, pin ≥3.10.**

Note that this repository is TypeScript/Next.js. `packages/nova-core/src/` (the
TS hint policy) is what this product consumes; `nova_directive.py` is the
reference implementation of the server-side directive re-application described
in the export README §11, and matters only if a Python backend is introduced.

**Node:** v24.14.1 here. `@bible-strong/avatar-react` declares
`engines.node >= 22.12.0` — satisfied.

---

## 5. Coupling that must be resolved before this is usable in a school

Taken from `VERIFIED_COUPLING.md`, re-checked against the source, and listed in
the order it will bite. These are **not** hypotheticals — each was confirmed by
reading the exported file named.

| # | Finding | Fails how | Blocking? |
|---|---|---|---|
| 1 | `ATTEMPT_EVENTS` = `{code_changed_debounced, run_clicked, submit_clicked}` (`novaRuntime.ts:214`) | **Silently.** A learner answering a prediction never satisfies it, so `hasAttemptSince` is permanently false, every hint request is capped, Nova looks broken with no error | **Yes** |
| 2 | `attempt_episodes.task_kind` CHECK rejects `'lesson'` | Loudly, on insert | **Yes** |
| 3 | `toLearningVerdict` returns `null` for any status containing `timeout` (`events.ts:423`) | **Silently.** A learner's too-slow algorithm is discarded as infrastructure noise | **Yes** |
| 4 | `attestation.ts:114` hard-rejects payloads without `problem_id` | Loudly, but the failure mode is indistinguishable from forgery (`:82` returns `null` for missing secret, malformed token and bad signature alike) | **Yes** |
| 5 | `progressed` / `regressed` unreachable without `tests_passed`/`tests_total` on two successive attempts | **Silently.** Two of seven intervention outcomes never fire | High |
| 6 | `thrash` vs `stuck` collapses without per-test counts; `struggle_class` feeds the `REDUCE_ASSISTANCE` override that lifts the cap for a genuinely stuck learner | **Silently.** A drowning learner stays capped | High |
| 7 | `humanize()` emits *"a compile error"*, *"a crash"*, *"the running time"* into learner-facing prose (`decisionEngine.ts:206-222`) | Visibly wrong words in a classroom | Medium |
| 8 | `TaskRequest.requires: "degenerate_cases" \| "complexity_gate"` | Pack-verification vocabulary, meaningless to a school catalogue | Medium |
| 9 | `solvex_forget_user()` calls a function from migration `0001`, which is not applied | Loudly, at migration time | Medium |
| 10 | Rate limiting keys on client IP | One school NAT = one classroom sharing a bucket | Medium |
| 11 | `SOLVEX_ADMIN_USER_IDS` is a flat allowlist granting every subject | Teacher sees every learner in the database | Medium |
| 12 | `starterTemplates.ts` ships C++/Python CP scaffolds | Cosmetic | Low |

**The maturity caveat, stated plainly by the export itself:** SolveX has no
scheduler. `buildLearnerState`, `decide()` and everything downstream have only
ever run from a manual admin button. Scheduling the reducer sweep is unexercised
territory — the export says "if you schedule it, you are the first."
`hintEffectiveness()` is exported, tested, and called by nothing.

---

## 6. What this baseline licenses

- Copying `packages/` verbatim into this repo.
- Treating `tests/golden.test.ts` as the regression gate: **if it goes red after
  a change, the intelligence changed.** The export is explicit that this is
  never fixed by editing the expectation.
- Extending `LEARNING_EVENTS` and `ALLOWED_PAYLOAD_KEYS` (the export designates
  `learning-contracts` as the package intended to be edited).
- **Not** editing `learning-intelligence-core` except `starterTemplates.ts`.

Re-run `npm test` in `packages/` after every integration step.
