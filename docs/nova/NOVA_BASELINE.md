# Nova baseline

Recorded before the production phase touched any file. Everything here is a
measurement, not a plan. Its only job is to make the next diff legible: what
was already true, what the tests already proved, and what a later claim of
"we fixed X" must be measured against.

## Repository

| | |
|---|---|
| Branch | `master` |
| SHA | `59bf26ba68aefb5ae2a550bc46d5affbd5d83c44` |
| Head commit | *Route inversion, and Strobi rendered from its own definition* |
| Working tree | dirty — 87 modified, 105 untracked, 9 deleted (Brilliant `.woff2` files removed under the third-party-asset cleanup) |
| Node | `>=24` (`.nvmrc`) |
| Next | 16.3.0, App Router, React 19.2.4 |
| Test runner | vitest 4.1.11, `environment: "node"` |

## Test baseline

`npm run test` at this SHA:

```
Test Files  1 failed | 44 passed (45)
Tests       1 failed | 873 passed | 9 skipped (883)
```

The single failure is **not** in Nova or the Learning Intelligence. It is
`tests/school/product-surface.test.ts > never falls back to the other language
by copying it`, which reports six labels whose Kazakh string equals the Russian
one: `footerAccount`, `aboutFigPractice`, `accountSession`, `prefAppearance`,
`prefAuto`, `settingsAccount`.

Recorded here rather than fixed silently, because five of those six are
loanwords both languages genuinely share and one — `prefAppearance`, Kazakh
`"Оформление"` — is a Russian word sitting in the Kazakh slot while every label
around it (`Тақырып`, `Жарық`, `Қараңғы`, `Қозғалыс`) is properly Kazakh. The
test found a real defect and five false positives in the same assertion.

## Archive parity

The Learning Intelligence archive
(`solvex-learning-intelligence-for-solvex4schools.zip`, 215 643 bytes, 77 files)
was extracted to `/tmp/nova-audit` and verified.

**`sha256sum -c CHECKSUMS.sha256`: every file OK.**

File-by-file diff of the archive against this repository:

| Path | Result |
|---|---|
| `packages/learning-contracts/**` (3 files) | identical |
| `packages/learning-intelligence-core/**` (8 files) | identical |
| `packages/nova-core/src/index.ts`, `python/nova_directive.py` | identical |
| `packages/nova-core/src/novaRuntime.ts` | **modified — 57 lines** |
| `contracts/**` (4 schemas) | identical |
| `database/migrations/0003, 0004, 0006` | identical |
| `tests/golden.test.ts`, `tests/golden-fixtures/**` (4 files) | identical |
| `tests/unit/**` (10 files) | identical except `novaRuntime.test.ts` (**34 lines**) |

So the core is byte-identical except for exactly one file, and that file's
change is additive:

- `GrantInput.hasAttempted?: boolean` — **optional**, defaulting to the previous
  behaviour when a caller does not supply it.
- A new `GrantReason` member, `"attempt_required"`.
- Two gates in `grantHintLevel`: nothing tried at all yields at most the opening
  rung even under learner override, and the opening rung itself is not
  skippable by override.

This is a deliberate, recorded core modification, not a fork. It exists because
the programme's own rule — help opens only after the learner has attempted
something — had nothing enforcing it, and the panel's "just tell me" button
posted `requestedLevel: 4, override: true`. See `docs/nova/CORE_MODIFICATIONS.md`.

`npx vitest run tests/unit tests/golden.test.ts` → **210 passed, 12 files.**
The archive's golden behaviour is preserved under the modification.

`tests/python/test_nova_directive.py` ships in the repo but is **not wired to
any npm script or CI job**, and `pytest` is not installed in this environment.
Recorded as an unrun suite rather than a passing one.

## What existed before this phase

Read as an inventory, not an endorsement. Correctness is judged in
`LEARNING_INTELLIGENCE_INTEGRATION_AUDIT.md`.

**Learning Intelligence**
- `schools/learning/` — the school adapter: grading, verdict mapping, episode
  scoping, attestation signing, failure attribution, error dictionary, tracks.
- `schools/reducer/` — `sweep.ts` and `trigger.ts`.
- `schools/store/` — PGlite and Postgres drivers behind one `LearningStore`,
  17 migrations.
- Routes: `/api/learning/{events,submit,state/me,complete,review,activity,
  dictionary,explanation,track}`, `/api/health/learning`.

**Nova**
- `schools/nova/` — `index.ts` (provider factory + counters), `provider.ts`
  (the port), `providers/{deepseek,echo}.ts`, `enforce.ts` (server-side hint
  ladder), `prompt.ts` (system prompt), `explain.ts` (reason-code → KK/RU).
- One route: `POST /api/nova/hint`, SSE.
- `schools/lib/rate-limit.ts` — token buckets keyed on the learner, not the IP.

**Strobi**
- `src/assets/strobi.avatar.json`, `src/components/nova/{strobi-definition.ts,
  strobi-avatar.tsx,nova-avatar.tsx,nova-chat.tsx}`.

**Dev lab**
- `/dev/nova`, `/dev/intelligence`, `/dev/execution`.

**Nova tests at baseline**
- `tests/nova/{avatar,construct-context,policy}.test.ts` — three files.
- No safety suite. No jailbreak suite. No output-policy suite. No
  prompt-boundary suite. No provider suite. No rate-limit suite. No
  privacy-context suite.

## What did not exist at all

- Any module that classifies a learner message before it reaches the provider.
- Any validation of what the model produced, at any point.
- Any server-side cancellation of a provider call.
- Any token, request-per-day, or cost ceiling.
- `docs/nova/`.
