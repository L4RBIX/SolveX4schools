# Months 2–9 — baseline

What this workstream started from, recorded before a single line of content was
written, so that anything reported later can be checked against it rather than
believed.

## Branch and worktree

| | |
|---|---|
| Branch | `curriculum-months-2-9` |
| Worktree | `.claude/worktrees/curriculum-months-2-9` |
| Branched from | `59bf26b` — *Route inversion, and Strobi rendered from its own definition* |
| Baseline commit | `fc88245bcd73f098a731fb12cd340cc9e10f752e` |
| Started | 2026-08-28 |

### Why the baseline is a commit and not just `master`

The shared checkout at `/Users/kydyrbekbekarys/SolveX4schools` was **dirty**: 257
paths, including ~1 400 lines of curriculum work that has never been committed —
September's remediation (`month-01-september.ts`, +989 lines), the block taxonomy
and worked-example type (`types.ts`, +128), the validator's checker gate
(`validate.ts`, +20) — plus untracked files this workstream depends on outright:

- `schools/curriculum/capability.ts` — the construct-availability model
- `schools/curriculum/public.ts` — the track projection and the payload students receive
- `schools/curriculum/gate.ts`, `publication.ts` — the publication gate
- `schools/exec/checker.ts` — the one output comparison

Branching a worktree from `59bf26b` would have started this month's authoring
from a tree that predates all of it: no `worked_example` type, no `checker`, no
`tracks` projection, and a September file with the wrong answer key still in it.
Every convention learned from September would have been the wrong convention.

So the baseline commit `fc88245` is a **faithful snapshot of the shared
checkout's working tree** at the moment of branching — tracked modifications
applied as a binary-safe patch, untracked-but-not-ignored files copied verbatim.
It is not authored work and claims none. Verified byte-identical over `schools/`,
`packages/`, `src/`, `tests/` and `scripts/` (only `.DS_Store` and
`.pytest_cache` differ).

The shared checkout was **not modified**. Nothing was committed to `master`,
nothing was stashed, no file there was touched.

## Concurrency at branch time

```
git worktree list
/Users/kydyrbekbekarys/SolveX4schools                                  59bf26b [master]
/Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/nova-production 61d87dd [nova-production]
```

`nova-production` (checkpoint `61d87dd`, the SHA named in the brief) exists as a
worktree and is **clean** — its work is not merged into `master`. Two peer
Claude sessions were reported busy; no file under the repo had been modified in
the six hours before branching.

## Baseline test status

Run inside the worktree, on `fc88245`, before any authoring.

| Command | Result |
|---|---|
| `npm run typecheck` | **2 errors**, both pre-existing, both in `tests/exec/parity-september.test.ts` (lines 256, 402) — another workstream's file |
| `npm run curriculum:validate` | **0 errors.** 279 promised / 54 built / 0 validated / 0 published |
| `npm run curriculum:test-content` | **262 passed**, 2 skipped, 0 failed |
| `npm run test` | **1295 passed, 5 failed**, 18 skipped, across 67 files |

### The two pre-existing typecheck errors

```
tests/exec/parity-september.test.ts(256,60): error TS2345:
  Argument of type 'number | undefined' is not assignable to parameter of type '5000 | undefined'.
tests/exec/parity-september.test.ts(402,57): error TS2345: (same)
```

These are in the execution workstream's own test file and have nothing to do
with curriculum content. They are recorded here so that "typecheck is not clean
at the end" cannot later be attributed to this branch without checking.

### The five pre-existing test failures

Captured in `docs/curriculum/reviews/BASELINE_FAILURES.txt`. All five are in
files this workstream does not touch. Any failure reported at the end of this
work is compared against that list first.

## Curriculum inventory at baseline

```
  Month                          promised  built  validated  published
  1. Қыркүйек                         36     54          0          0
  2. Қазан                            38      0          0          0
  3. Қараша                           34      0          0          0
  4. Желтоқсан                        32      0          0          0
  5. Қаңтар                           30      0          0          0
  6. Ақпан                            30      0          0          0
  7. Наурыз                           26      0          0          0
  8. Сәуір                            28      0          0          0
  9. Мамыр                            25      0          0          0
  ──────────────────────────────────────────────────────────────────
  Total                              279     54          0          0
```

September is the only month with lesson bodies: 78 blocks, 54 of which are
attempt-bearing, against a promised 36. Months 2–9 carry their `Month` object,
their units, their lesson titles, objectives and skill references — and **zero
blocks**. Every lesson in them is `draft`; every assessment is `draft` with an
empty `blocks` array.

That is the gap this workstream closes.

## What this workstream will not touch

Recorded up front so the diff can be checked against it:

`schools/nova/**`, `packages/nova-core/**`, `packages/learning-intelligence-core/**`,
`packages/learning-contracts/**`, `schools/exec/providers/**`, `schools/execution/**`,
`schools/auth/**`, `schools/store/**`, `src/components/**` (except where a content
block type genuinely cannot render), and every migration under `database/`.
