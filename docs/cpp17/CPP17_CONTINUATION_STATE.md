# Where the C++17 migration actually stands

Written for whoever picks this up next, including me after a context reset. It
distinguishes three things that are easy to blur: what is **done and proven**,
what is **done and unproven**, and what is **not done**. Anything not named here
should be assumed not done.

## Ground truth

The branch is `cpp17-migration`. The safety ref
`refs/backup/cpp17-full-year-before-continuation-20260901-000635` is the state
before this work began; nothing has been destroyed.

Production — `solvex4schools.vercel.app` — is **untouched and still serving
Python**, deliberately. The brief said not to move it, and it has not moved.

## The one command that answers "is the content real"

```
npx vitest run tests/school/content-execution.test.ts
```

It compiles every reference solution with a real C++ compiler and runs every
case through the judge's own `checkOutput`. Filter by month with `-t "m4."`.
While a month is unmigrated it fails loudly, by block id, which is the point —
the migration is checkable rather than claimed.

Two companions: `tests/school/content-integrity.test.ts` (worked examples, the
one block a learner is told to trust) and `npx tsx scripts/check-blocks.ts
<file>` (the fast per-file version, for the moment someone has just written a
lesson).

## Proven

- **The browser compiles and runs C++17 inside the real lesson player.** Driven
  in Chrome as a signed-in learner, not inspected in source: `cout << 7 * 8;`
  → `56`, via clang.wasm → lld.wasm → WASI, all client-side.
- **The three failure paths behave.** Infinite loop killed at 3 s and the Run
  button returns by itself; 2,000,000 lines truncated at 64 KiB; a missing
  semicolon shows clang's own diagnostic with the caret, framed as «Это
  собственные слова компилятора».
- **The sandbox holds**, and structurally rather than luckily — see
  `CPP17_SANDBOX_AUDIT.md`.
- **The trust boundary did not move.** `tests/cpp17/run-trust.test.ts` pins it,
  and no file under `schools/execution/` or `packages/learning-contracts/`
  changed during the content migration.
- **September is C++17**, all 30 reference solutions, gate-green.

## Done but NOT proven

- **Kazakh and Russian are not natively reviewed.** C++ adds vocabulary the
  Python course never needed — «компиляция», «нүктелі үтір», «айнымалы түрі».
  No native speaker has read the migrated content. This is the largest open
  risk to the learner experience and no amount of green CI addresses it.
- **Timing estimates are now wrong in an unknown direction.** C++ adds typing
  and a compile step to every task. The per-lesson minute figures were
  inherited from the Python lessons. Real student timing validation remains NOT
  PERFORMED.
- **Curriculum-owner sign-off on the language change does not exist.** Editing
  `YEAR_ONE_LANGUAGE` is not approval; the constant's own comment says so. p.7's
  no-OOP bound is respected throughout.

## Not done

- **Pyodide is still on disk and still served.** `src/lib/pyodide/*`,
  `scripts/sync-pyodide-assets.mjs`, `scripts/build-python-worker.mjs`.
  Retirement is deliberately last: it happens after a C++ preview deployment
  passes, not before, so there is a fallback while the new runtime is young.
- **No C++ preview deployment yet**, and production stays on Python until one
  passes.
- **Per-feature browser↔judge parity is a manual pass, not a suite.** The core
  surface was checked on both engines by hand. The automated version — same
  programme through both engines, covering BFS, `vector<vector<int>>`,
  binary-search loops and `double` formatting — does not exist.
- **A timed-out program shows no partial output.** `while (true) { cout << i; }`
  reports the timeout and an empty box, because the worker is terminated and its
  buffer dies with it. Showing what it printed first would teach a beginner
  more. Needs streaming rather than collect-at-the-end; a protocol change, not a
  patch.
- **`scripts/check-blocks.ts` is blocked on an import.** It reads
  `EXECUTION_LIMITS` from `schools/exec/provider.ts`, which imports
  `server-only` (since 32cb6cb), so the script throws on startup. The fix is to
  extract the plain constants into a module without that import and re-export
  them. Until then the fast authoring loop is unavailable even though its C++
  migration is complete.

## Things that will bite the next person

- **`v.size()` is unsigned.** `size() - 1` on an empty vector is a huge positive
  number. It is the most likely silent infinite loop in October and January
  content.
- **`-7 / 2` is `-3`, not `-4`.** Any task with negative inputs carried over
  from Python has a wrong expected output unless it was re-derived. The gate
  catches it; a reviewer reading the diff will not.
- **Complexity claims were calibrated for Python.** "Too slow" meant ~10^6
  operations; in C++ it is ~10^8 per second. Every "the brute force does not
  finish" demonstration in December, February and April had to be re-derived,
  and any that were not are now teaching the opposite of the truth while
  passing every test — because a program that finishes fast passes its cases.
  This is the one failure class the gates cannot catch.
- **stdin is capped at 16 KiB.** A task cannot feed a million numbers. Large-n
  demonstrations must generate data from a seed inside the program.
