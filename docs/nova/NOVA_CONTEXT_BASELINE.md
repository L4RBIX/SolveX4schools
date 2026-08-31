# Baseline — Nova context and personalization phase

Recorded before this phase changed anything. Its job is to make the diff
legible: what was already true, what the tests already proved, and what a later
claim of "we fixed X" has to be measured against.

## Repository

| | |
|---|---|
| Worktree | `.claude/worktrees/nova-production` |
| Branch | `nova-production` |
| HEAD at start | `cbbbe94e1fb5627eab5cd923ece45e379e48410e` |
| Working tree | clean |
| Base | `59bf26b` on `master` |

## The worktree, and why the phase stayed in it

The previous phase moved here because two other Claude sessions were editing the
shared checkout live — `schools/config.ts`, `schools/curriculum/types.ts` and
`schools/execution/python-policy.ts` all changed under it mid-session, and one
of those edits broke the typecheck with a half-written import.

Nothing about that has changed, so this phase stayed. The alternative is
claiming "typecheck green, tests green, build green" about a tree somebody else
is actively editing, which is not a claim anyone can make honestly.

`master` does **not** contain this work. Merge target and SHA are in the final
report.

## Test baseline at `cbbbe94`

```
npx tsc --noEmit                       clean
npx vitest run --no-file-parallelism    1206 passed, 1 failed, 9 skipped (62 files)
pytest tests/python                     13 passed
npm run build                           success
node scripts/check-client-bundle.mjs    no secrets
```

The single failure is **inherited and not this phase's**:
`tests/school/theme.test.ts > no product component hardcodes white`, offenders
`src/components/brilliant/lesson/blocks/primitives.tsx` and
`src/components/brilliant/lesson/button-3d.tsx` — two files another session was
mid-edit on when this branch forked. It fails identically before and after
everything below.

## What already existed, and was not rebuilt

The previous phase delivered, and this phase left alone:

- The imported Learning Intelligence core, byte-identical to the archive apart
  from one documented file (`docs/nova/CORE_MODIFICATIONS.md`).
- The event ledger, episode reducer, `LearnerState`, decision engine,
  `NovaDirective`, `grantHintLevel`.
- The safety gate, output validator, streaming guard, budget ceilings.
- The trust boundary in the prompt: per-request nonce, fenced user turn.
- 135 adversarial fixtures, `docs/nova/JAILBREAK_POSTURE.md`.
- The DeepSeek provider, server-only, with the corrected `deepseek-v4-flash`.
- Strobi and its semantic state machine.
- The assessment cap, the attempt bridge, the hint ladder.

## The one thing that was wrong, and it was the whole point

`POST /api/nova/hint` received:

```json
{ "blockId", "episodeId", "message", "requestedLevel", "override", "locale" }
```

and the server resolved everything else with `findBlock(blockId)` — the
curriculum. So Nova saw each task **as its author wrote it** and never as the
learner was experiencing it: not the option they picked, not that it was wrong,
not that it was their first attempt, not the code in their editor.

Meanwhile `src/components/brilliant/lesson/school-lesson.tsx` held
`states[blockId] = { answer, verdict, attempt, reveal, why, note }` in the same
component that renders `<NovaChat>`, and sent none of it.

Reproduced live at baseline against a real DeepSeek key: the learner asks
«Где ошибка?» about `print("2 + 2")` and Nova answers *"what did you try and
what did you expect?"* — a question about a screen the platform was already
holding.

`docs/nova/NOVA_CONTEXT_AUDIT.md` classifies every field.
`docs/nova/NOVA_CONTEXT_REMEDIATION.md` records the before and after.

## Nova-related tests at baseline

| Suite | Tests |
|---|---|
| `tests/nova/` (7 files) | 213 |
| `tests/learning/` (3 files) | 29 |

Absent entirely: any test that Nova can see the current screen, any
personalization test, any layout test, any test of progress evidence on the
19 non-code attempt blocks, any test that the decision engine leaves a trail.
