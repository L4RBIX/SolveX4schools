# What the migration touched, and how each claim is checked

The purpose of this file is to make the migration auditable by someone who was
not here. For every category of change it names the thing that proves the change
is right, and where a claim is unproven it says so rather than rounding up.

## The three gates

Everything about content correctness reduces to these. They are not style
checks; each exists because something shipped wrong once.

| Gate | Command | What it proves |
|---|---|---|
| Execution | `npx vitest run tests/school/content-execution.test.ts` | every reference solution compiles and passes every one of its own cases, through the judge's own `checkOutput` |
| Integrity | `npx vitest run tests/school/content-integrity.test.ts` | every worked example prints what it claims — the one block a learner is told to trust and the only one nothing else runs |
| Authoring | `npx tsx scripts/check-blocks.ts <file...>` | the same per-block checks against a single file, before it is wired into a `Month` |

All three now compile C++ through one shared harness, `tests/support/cpp-run.ts`.
That sharing is deliberate: two places that both decide "this source is valid"
must not be able to disagree, and the execution gate additionally asserts that
its comparison IS the production comparison rather than a copy of it.

The execution gate is a release gate in CI: with no compiler on PATH it fails
instead of skipping, because 916 skipped tests under a green tick is how a
curriculum ships unchecked.

## What changed in what the gates mean

Two things about C++ changed what may honestly be asserted, and both are
encoded in the gates rather than left to reviewers:

- **A broken program may fail to compile.** In Python every curriculum snippet
  parsed and the bugs were arithmetic. The first bug a beginner meets in C++ is
  a missing `;`. So a `find_bug` block's `code` is exempt from "this must
  compile", and a find_bug whose buggy and fixed programs disagree about
  compiling has demonstrated its defect in the strongest available form. Its
  `fixedCode` is still required to compile — that is the answer key.
- **Compile once, run many.** 2003 cases across 249 references. Per-case
  compilation is a forty-minute suite, so each distinct source is built once and
  every case is piped through the binary.

## Semantic traps every carried-over task was re-checked against

Not a translation. Each of these changes an expected output, and the gate is
what catches a task that was translated rather than re-derived.

| | Python | C++17 |
|---|---|---|
| `7 / 2` | `3.5` | `3` |
| `-7 / 2` | `-4` (floors) | `-3` (truncates) |
| `-7 % 2` | `1` | `-1` |
| large integers | unbounded | overflow past 2^31−1 |
| division by zero | exception | undefined behaviour — re-authored, never translated |
| `v.size()` | n/a | unsigned; `size() - 1` on an empty vector is huge |
| out-of-range index | wraps or raises | undefined behaviour |
| recursion depth | `RecursionError` | silent stack overflow |

## Runtime and trust

The trust boundary did not move, and that is asserted rather than assumed:
`run_executed` remains the only execution event a browser may author, a local
result is always `client_local`, and `LocalRunResult` has no field a verdict
could be read out of. Changing the execution engine is exactly the kind of
change under which such a rule quietly stops applying, so `tests/cpp17/run-trust.test.ts`
pins it.

Browser Run is Clang 8.0.1 → wasm32-wasi with `-std=c++17` passed explicitly.
Submit is Judge0 language 105, GCC 14.1, which defaults to `gnu++17` — verified
by asking the judge, not by reading a changelog, and load-bearing because
`compiler_options` is refused with HTTP 403 on this plan.

## Sandbox

Audited adversarially in a real browser; see `CPP17_SANDBOX_AUDIT.md`. No
escape, structurally rather than luckily. One real finding — a shared in-memory
filesystem that let a program break its own toolchain for the rest of the page's
life — found, fixed, and mutation-tested in both directions.

## Not proven, and not claimed

- **Kazakh and Russian are NOT natively reviewed.** C++ adds vocabulary the
  Python course never needed — «компиляция», «нүктелі үтір», «айнымалы түрі» —
  and no native reviewer has seen it.
- **Timing estimates are unverified and now wrong in an unknown direction.**
  C++ adds typing and a compile step to every task. Real student timing
  validation remains NOT PERFORMED.
- **The curriculum owner has not signed off on the language change.** Editing
  `YEAR_ONE_LANGUAGE` is not approval, and the constant's own comment says so.
  p.7's no-OOP bound survives and is respected.
- **Per-feature browser↔judge parity is a manual pass, not a suite.** The core
  surface was checked on both engines; an automated per-feature suite does not
  exist.
