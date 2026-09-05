# Where the C++17 migration actually stands

Written for whoever picks this up next, including me after a context reset. It
distinguishes three things that are easy to blur: what is **done and proven**,
what is **done and unproven**, and what is **not done**. Anything not named here
should be assumed not done.

## Ground truth

The branch is `cpp17-migration`. The safety ref
`refs/backup/cpp17-full-year-before-continuation-20260901-000635` is the state
before this work began; nothing has been destroyed.

> **Corrected 2026-09-05.** The paragraph below was true when it was written
> and stopped being true when the cutover happened. It said production was
> "still serving Python" while `solvex4schools.vercel.app` had been serving this
> branch for some time — verified against the Vercel deployment API:
> `gitCommitRef: cpp17-migration`, `gitCommitSha: cf63b58`. A snapshot document
> that describes a moment has to say which moment, or it becomes a claim about
> now.

Production — `solvex4schools.vercel.app` — **serves this branch**. It is
`origin/master`, and the deployed SHA at the time of writing was `cf63b58`.
Check it rather than trusting this line:

```
vercel ls                                   # the production alias
vercel inspect <deployment-url>             # and what it was built from
```

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
  собственные слова компилятора». (That caption is now shown only for a BUILD
  failure — a runtime trap is not the compiler talking and used to carry the
  same words. See `runtimeFaultNote`.)
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

- **One 38 KB client chunk still carries the Pyodide glue.** Measured after a
  real `npm run build`: `public/pyodide` and `public/pyodide-worker.js` are
  gone (12.9 MB stripped by `scripts/strip-python-assets.mjs`), and no route
  manifest references the chunk — but Next still emits it, because
  `/dev/execution` imports `src/lib/pyodide/*` and a route that returns
  `notFound()` in production is still compiled. It is inert: nothing loads it,
  and the assets it would fetch no longer exist in the build. Removing it means
  restructuring the 1346-line dev lab, which is the backup path's only
  exerciser. `tests/execution/production-is-cpp-only.test.ts` permits exactly
  this one importer and fails on any other.
- **Pyodide source is kept deliberately.** `src/lib/pyodide/**`,
  `scripts/sync-pyodide-assets.mjs`, `scripts/build-python-worker.mjs` and
  `schools/execution/python-policy.ts` all remain as a labelled BACKUP, on the
  owner's instruction: production ships C++17 only, and Python stays in the
  repository. `predev` still builds the Python assets so the backup stays
  runnable; `prebuild` strips them.
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
- **Two May tasks are complexity-unmeasured, deliberately.** `m9.l3.b6` and
  `m9.c3.p4` are graded on the answer only. Measured over 9 runs at both
  optimisation levels: the worst naive solution takes 0.661 s against a 5 s
  budget — 7.6x inside at `-O0`, 109x at `-O2` — and both naives also print the
  correct answer, so there is no output-based fallback either. No robust timing
  separation exists at any input fitting the 16 KiB stdin ceiling, so the guards
  were deleted rather than retuned. A guard that sometimes passes the naive
  algorithm is worse than no guard.
- **Seven fill_blank blocks put an answer on the same line as its own slot.**
  Reported as warnings by `curriculum:validate`. Three are real giveaways
  (`vector<int>`, `||`, `*`); four are coincidence where the token carries a
  different meaning in the two places (`0` inside `nr >= 0`, `sr`/`sc` as their
  own subscripts, `2` as an index). Telling them apart needs a token's semantic
  role, which needs a parser this validator does not have.

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
