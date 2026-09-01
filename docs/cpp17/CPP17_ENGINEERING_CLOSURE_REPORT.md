# C++17 Engineering Closure — Report

**Verdict: READY WITH EXPLICIT BLOCKERS.**

Every blocker in sections 1–5 and 14–17 is closed with measured evidence. Sections
6–13 are **partially** closed: the browser-driven acceptance could not be run,
and the equivalent acceptance I could run against a local production build is
reported separately below and does not cover four of the required checks. B2
(§18) is a human gate and is untouched by design.

Branch `cpp17-migration`, commit `fae9486`. Nothing published, nothing deployed,
production still serves the Python build (verified at the end of this run:
`/pyodide-worker.js` → 200, `/cpp17-worker.js` → 404).

---

## 1. B1 — `m1.l1.b4`: CLOSED, and the brief understated it

The block said "компилятор сообщает об ошибке в строке 6" and asked which line
actually needs fixing. The brief described this as Clang-vs-GCC divergence, with
6 being GCC's number.

**It is neither engine's number.** Measured on the block's own `code`:

| Engine | Output |
|---|---|
| Clang (local 17, `-std=c++17 -fsyntax-only`) | `b4_buggy.cc:5:26: error: expected ';' after expression` |
| GCC 14.1 (Judge0 id 105, live) | `main.cpp:5:21: error: expected ';' before 'cout'` |

Both say **5**. What GCC prints on line 6 is the *token* it tripped over
(`cout`), quoted as context. The block was teaching a rule no compiler follows.

The shipped browser binary corroborates the Clang half: `strings public/cpp17/clang.wasm`
contains `clang version 8.0.1` and the exact string `expected ';' after expression`.

## 2. The task no longer depends on a diagnostic location

The prompt contains **no digit in either locale**. It asks *"at the end of which
line is the semicolon missing?"* — a question answered from the code — and
teaches the portable truth: a diagnostic points at where the compiler stopped
making sense, sometimes that line and sometimes the next, so read both.

Engine-independence is structural, not asserted: `schools/learning/checking.ts`
grades `find_bug` as `line === block.buggyLine`, a comparison against the
authored `5`. No compiler output reaches grading. Exercised directly:
line 4 → wrong (unattributed), line 5 → correct, line 6 → wrong with the
failure class. Correct under Clang, under GCC, and under a hypothetical engine
that really did say 6.

## 3. Nova's GCC assumption: CLOSED, plus two defects found while measuring

`missing_semicolon` told Nova the semicolon "is almost always at the END OF THE
LINE ABOVE the line the compiler names". Replaced with a distinction between
where the compiler *points* and where the semicolon *belongs*, an explicit "the
gap is not fixed", and an instruction to work from the supplied stderr.

Two things the brief did not mention:

- **`unbalanced_braces` carried a second fixed positional rule** ("the reported
  line is almost never where the mistake is") which made Nova discard the one
  useful line. Both engines print `note: to match this '{'` naming the opening
  brace exactly. Now used.
- **A recognition gap.** GCC's `expected ',' or ';' before 'if'` matched nothing
  in the table, so `recogniseDiagnostics` returned `[]` — the commonest
  September typo got *no explanation at all* on Submit. Pattern added.

Clang and GCC fixtures added in `tests/nova/fixtures/compiler-output.ts`, each
carrying its provenance. Mutation-tested: reintroducing the retired phrasing
verbatim fails 4 tests.

## 4. Kazakh truncation: CLOSED — 5/40 silent → 0/80

Root cause was deeper than the lead. `deepseek.ts` read only
`choices[0].delta.content`; `finish_reason` was on the wire and dropped. Worse,
`if (data === "[DONE]") return;` was a bare return, and a `max_tokens` cut-off
sends a `[DONE]` **byte-identical in shape to a natural ending** (verified
live). Truncation was invisible at every layer: the validator returns `[]` on a
partial by construction, and the client ignored `done`.

Fixed at four layers (provider interface, DeepSeek parser, route, panel). A
cut-off now renders an `incomplete` frame with in-language copy *under* the
partial text, which is kept rather than discarded, and does not spend one of the
learner's rationed presses.

**Why Kazakh specifically:** `tokenBudget` was stated in tokens, a unit whose
exchange rate against meaning differs by language. Measured, n=8 paired prompts:
Kazakh 1.99 chars/token vs Russian 3.22 — a **1.43×** ratio. One token figure
bought Kazakh ~70% of the room at every rung. `KK_TOKEN_COST = 1.45` corrects
the safety net; it does not raise what Nova may say.

Second defect found on the way: a timeout firing mid-stream rejects with a
`DOMException` named `AbortError`, not a `NovaProviderError`, and the provider's
try/catch wrapped only `fetch` — so the panel showed "причина неизвестна" for
the one failure it has exact copy for. Now mapped to `timeout`.

| | n | silent | flagged | errors |
|---|---|---|---|---|
| before kk | 20 | **4 (20%)** | 0 | 0 |
| before ru | 20 | 1 (5%) | 0 | 0 |
| after kk | 40 | **0** | 5 | 0 |
| after ru | 40 | **0** | 3 | 0 |

## 5. Nova benchmark re-run: DONE

120 live requests across m1–m9, both locales, plus a 48-request ladder sweep.
0 silent truncations, 0 validator violations, 0 non-200, 0 errors.

**Limitation:** every live sample landed at granted 0–1. Rungs 2–4 need real
learner state I declined to fabricate. Detection lives in the provider and is
level-independent, and higher rungs get larger budgets, so the risk direction is
covered — but level 3/4 is unverified against the live provider.

---

## 6–13. Browser acceptance: PARTIAL — this is the blocker

**Not run:** Chrome MCP is disconnected, and the Preview deployment
(`solvex4schools-2bpk5fpoa-l4rbix1s-projects.vercel.app`) is SSO-protected with
the bypass returning `forbidden` (protection bypass is a Pro feature).

Per the brief's fallback I ran equivalent acceptance against a **local
production build on :3100**. That evidence is below and is *explicitly not
Preview evidence*.

### 6. Asset serving — production build (local)
```
/cpp17-worker.js       200  32 569      application/javascript
/cpp17/clang.wasm      200  31 214 472  application/wasm
/cpp17/lld.wasm        200  19 490 094  application/wasm
/cpp17/sysroot.tar     200   9 297 920  application/x-tar
/pyodide-worker.js     404
/pyodide/pyodide.mjs   404
/dev/execution         404
```

### 9. Run/Submit trust — HTTP + database, not inferred from tests
- Clean `run_executed` ×5 → `{"accepted":5,"inserted":5,"rejected":0}`
- Smuggled `verdict`/`passed`/`xp`/`hidden_cases`/`solved` ×5 → accepted, but
  stored keys are only `case_count, is_custom_input, language, task_kind,
  task_ref, verdict`. **`verdict` survives the global allowlist** — inert
  (`episode.ts` requires `isTrustedOutcome(event)` before reading it), but it is
  stored, and the allowlist is global rather than per-event-name.
- Forged `verdict_received` / `lesson_completed` / `failure_attributed` ×3 →
  `{"accepted":0,"rejected":3}`
- After Run only: 10 events, all `source_trust=browser`, **0 submissions, 0 completions**
- Submit: HTTP 200 in 2 879 ms → `{"verdict":"correct","cases":{"passed":1,"total":1},"saved":true,"attested":true}`;
  ledger shows `verdict_received|judge|2`. Response carries no hidden cases and
  no reference solution.

### 10. Hydration
Submitted deliberately wrong C++ (`cout << 7 + 8;` with a Cyrillic marker
comment), dropped the cookie, logged in again: the lesson HTML contains the
learner's exact wrong source (`true`) and does not substitute the reference
(`false`).

### 11. Teacher surfaces
`/teacher`, `/students`, `/skills`, `/lessons`, `/assessments`, `/leaderboard`
all 200, **no Python terminology**. Empty-state, so no positive C++ terms either
— this is weak evidence and is labelled as such.

### NOT COVERED by the local fallback
- **§12 responsive at 1440 / 1024 / 768 / 375** — needs a browser
- **§8 the 11-scenario Run stress matrix** — needs the real WASI engine in a browser
- **§7 the all-month browser sweep**
- **§13 performance measurement**

These four are the substance of "READY WITH EXPLICIT BLOCKERS".

---

## 14. Judge0 live validation doc: REGENERATED from real evidence

8 billable submissions, 41 API requests, **0 HTTP 429**. Measured through the
production adapter, not a bespoke client. Identity: GCC 14.1.0, `__cplusplus`
201703, `__OPTIMIZE__` undefined (so **-O0**), `-7/2 = -3`, `-7%2 = -1`.
Catalogue: 71 languages, exactly one match above the version floor (id 105).

The Python-era report was moved whole to
`JUDGE0_LIVE_VALIDATION_PYTHON_ERA.md` as a separate file — not an appendix,
because `judge0:validate` overwrites the main file and would delete one.

The regenerated document is a **focused** run and says so: conformance (11
cases), the 5 sandbox probes, 22 parity fixtures, cost and the concurrency
ladder are marked UNKNOWN rather than reported as measured.

## 15. Secret-scan gap: CLOSED

Every declared name now lands in `checked` or `unchecked`, and the run prints
coverage. Partial coverage is fatal. A second silent drop of the same class was
found: a value under the 8-character floor was being dropped by the same filter.
New opt-out `BUNDLE_SCAN_ALLOW_MISSING=NAME1,NAME2` — a list, not a boolean, so
a typo excuses nothing and says so. **No secret value is ever printed.**

Mutation test: a canary planted in a real chunk is caught (exit 1). Current run:
**85 client files, 4/5 secrets searched, 0 hits.**

`LEARNING_CRON_SECRET` is the fifth, and is excused **by name** in
`.github/workflows/ci.yml` with the reasons written beside it: it has no
consumer anywhere (five separate source comments already record this), the route
it would guard does not exist, and Leagues stays off for the pilot. It is
self-correcting — the moment it gets a value the scan reports the entry as stale
and fails.

## 16. WASI sandbox coverage: CLOSED

`tests/cpp17/sandbox-contracts.test.ts`, 25 tests, 220 ms, standing the real
vendored runtime against the real pinned assets. **No browser capability is
faked and no test claims `socket()` is "blocked".** It asserts:
`memfs.wasm`'s import table is exactly five functions with no host filesystem
call; a hand-assembled WASI program sees exactly one environment variable, read
out of linear memory (a stdout-only test passed the mutation where a second
variable hides behind the first — that is why it reads memory); programs
importing `sock_send`/`sock_recv`/`sock_accept`/`sock_shutdown` fail to
instantiate, with `proc_exit` as a control that links and runs.

## 17. Final machine gate: GREEN

| Step | Result |
|---|---|
| `npm run lint` | **0 errors** (50 pre-existing warnings) |
| `npm run typecheck` | **0** |
| `npm run curriculum:validate` | **0 errors** |
| `npx vitest run` | **153 files, 6 757 passed, 23 skipped, 0 failed** |
| `npm run build` | green |
| `npm run check:bundle` | 85 files, 0 hits |

**A harness error of mine, corrected:** my first gate run showed 5 failures. All
five were caused by the gate script sourcing `.env.local` — a real
`DEEPSEEK_API_KEY` makes `getNovaProvider()` return the live provider, so the
`EchoProvider` mock in `degradation.test.ts` applies to nothing. Not a
regression: 15/15 pass without it. I added a guard so the suite now fails first
with the actual reason instead of three confusing failures about truncation and
independence accounting.

---

## 18–20. Human gates — UNTOUCHED

- **CURRICULUM-OWNER C++ SIGN-OFF: NOT PERFORMED.**
  **C++ PUBLICATION: BLOCKED BY HUMAN GATE.** `--i-am-the-reviewer` was never
  passed and no publication row was created. Decisive evidence the gate is
  really holding: an authenticated learner hitting `/lesson/m1.l1` on the local
  **production** build gets **404** — the publication gate refusing unpublished
  C++ content. `/home`, `/program`, `/course/1` still 200.
- **NATIVE KAZAKH LINGUISTIC REVIEW: NOT PERFORMED.** All new Kazakh copy — the
  b4 prompt and justification, the m9.l2.b1 rewrite, and Nova's `failIncomplete`
  string — is DRAFT.
- **REAL STUDENT TIMING VALIDATION: NOT PERFORMED.**
- **COPYRIGHT ASSET REPLACEMENT: PENDING.** Brilliant art/video still ship on
  production routes.
- **NO CUTOVER.** Production remains Python, `solvex4schools.vercel.app` not
  moved, no `v0.1.0-pilot` tag, Leagues not enabled.

---

## 21. Correction to a "fact" this branch established earlier

`compiler_options` is **not** refused with HTTP 403. Measured today: HTTP 200,
and honoured — `-std=c++11` on a program printing `__cplusplus` returns
`201103`; `/config_info` reports `enable_compiler_options: true` with an empty
allow-list. Whether the 403 was a different plan tier, request shape or vendor
change is unknown and was not worth submissions to find out.

Nothing breaks: the adapter sends no options and GCC 14 defaults to `gnu++17`
(measured `201703`). But `schools/execution/cpp-runtime.ts` and
`CPP17_JUDGE_PARITY.md` justified the version floor with a locked door that is
open. Both reworded — the floor now rests on "we send no flag, so the default is
our contract", which is the better argument anyway.

## 22. Unlock evidence has no curriculum-version scoping

`schools/learning/access.ts` contains no hash or version reference, so a
Python-era accepted verdict on an unchanged independence block id would satisfy
C++ unlock. **Not materialised in production** — 12 submissions, 5 accepted,
**0 accepted independence blocks**, 1 completion — but the ledger does hold 6
`language=python` events beside 27 `language=cpp17`. Worth a decision before any
cohort carries history across the cutover.

## 23. The prompt ceiling moved, and was not raised

Worst September system message is now **12 917** chars (`m1.l1.b4 · ru · L1`),
up from 12 478 (`m1.as.b2`), against an unchanged **13 500** ceiling. Headroom
1 022 → **583**. Both causes are the B1 fix: the b4 prompt grew when it stopped
lying, and the diagnostic preamble grew for the same reason.

I did not raise the ceiling. I re-documented its calibration with the measured
numbers and recorded that the margin is now ~1.8× the longest task statement
rather than ~3×, with a note that the next edit landing here should trim the
section rather than raise the number.

## 24. Known-and-left, with reasons

- **`uninitialised_variable` is dead at production flags.** Neither engine emits
  `-Wuninitialized` without `-Wall`, Judge0 is -O0 with no `-Wall`. Recorded as
  an asserted fixture rather than removed — that is a curriculum call.
- **`assignment_in_condition`** reaches Nova only from the browser; a learner who
  only ever presses Submit never sees it explained.
- **`failureClass: "compiler_points_at_the_next_line"`** keeps its now-odd id,
  because it is a key into `TEACHER_FAILURE_CLASS` and renaming one file without
  the other degrades the teacher console. The id is never rendered.
- **`HYBRID_EXECUTION.md`** got a banner rather than a rewrite: its architecture
  (run-local / submit-server, and the trust split) is still exactly right; only
  the engine identity changed.
- **`npm run check` runs `test` before `build`**, so a fresh clone that has never
  run dev or build skips 12 of the 25 sandbox tests (they need generated
  `public/cpp17/`). The skip announces itself.

## 25. Verdict

**READY WITH EXPLICIT BLOCKERS.**

The engineering work is done and the machine gate is green. What stands between
this branch and a cutover is not code:

1. **Browser acceptance §6–13 is incomplete** — responsive at four widths, the
   11-scenario Run stress matrix, the all-month browser sweep, and performance
   measurement all need either a working Chrome MCP or an unprotected Preview.
   This is the only *machine* blocker left.
2. **B2 — curriculum-owner sign-off** is a human gate and stays closed.
3. Native Kazakh review, real-student timing, and asset replacement remain
   PENDING.

Production remains Python.
