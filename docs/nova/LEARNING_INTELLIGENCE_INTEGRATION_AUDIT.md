# Learning Intelligence integration audit

What the archive shipped, what this product had already built, and which of the
two is actually running. Written before any of the production-phase code, from
a file-by-file inspection rather than from the archive's own summaries.

Classification per the brief: **ALREADY INTEGRATED / PARTIALLY INTEGRATED /
MISSING / CONFLICTING / SUPERSEDED**, plus **DEFECT** for things that were
integrated and wrong.

## Method

Eight independent auditors, one per subsystem, each told to falsify rather than
confirm, each required to cite `file:line`. Their findings were then
adjudicated against the source — which mattered: three of the eight reported a
missing module that had been written forty minutes earlier, and one reported a
clean typecheck that a stale `tsconfig.tsbuildinfo` had faked. Stale reads are
recorded in `docs/nova/NOVA_BASELINE.md` rather than quietly dropped.

## The headline

**The core was imported faithfully. The evidence feeding it was not trustworthy,
and the things standing between a language model and a fourteen-year-old did
not exist.**

`sha256sum -c CHECKSUMS.sha256` passes 58/58. Every file in
`packages/learning-intelligence-core`, `packages/learning-contracts`, both
`contracts/` and the three imported migrations is byte-identical to the archive.
`tests/unit` + `tests/golden.test.ts` pass 210/210. One core file is forked, by
57 additive lines, and it is documented in `docs/nova/CORE_MODIFICATIONS.md`.

So "did the port preserve the golden behaviour" is a clean yes, and it is also
the least interesting question, because the archive said so itself: *"the core
is not the hard part of this migration — producing trustworthy school evidence
is."*

## Component ledger

### Already integrated, and correct — do not rebuild

| Component | Where |
|---|---|
| `LearningEvent` contract, `sanitizePayload` allowlist | `packages/learning-contracts` |
| `reduceEpisode`, `buildLearnerState`, decision engine, intervention memory | `packages/learning-intelligence-core` |
| `grantHintLevel`, `NovaDirective` | `packages/nova-core` |
| Episode boundaries, including a delayed re-solve as a NEW episode | `schools/learning/episode-scope.ts` |
| Skill mapping onto curriculum `skillRefs`, with failure attribution kept narrow | `schools/learning/grade.ts` |
| Reducer actually scheduled — in-process sweep plus a cron entry point | `schools/reducer/{sweep,trigger}.ts` |
| `LearnerState` persisted and recomputable from durable events | `schools/store/learning-store.ts`, migration 0006 |
| Secret boundary — no `NEXT_PUBLIC_` credential, enforced by a build check | `schools/config.ts`, `scripts/check-client-bundle.mjs` |
| Rate limiting keyed on the learner, never the IP | `schools/lib/rate-limit.ts` |
| Provider abstraction with a working offline provider | `schools/nova/{provider,index}.ts` |
| Verdict vocabulary mapped to school semantics; `unknown` is never `wrong` | `schools/learning/grade.ts` |
| Task-kind vocabulary is the school's, not CP's | `schools/learning/taskRef.ts` |
| Attestation payload rebuilt for school submissions, HMAC kept | `schools/learning/sign.ts` |

That list is why this phase is a hardening pass and not a build.

### Missing entirely

| Component | Consequence before the fix |
|---|---|
| Any classification of a learner message | A self-harm disclosure was embedded in a prompt whose rules say to treat anything in a learner message as *"a QUESTION ABOUT PROGRAMMING"* and answer that, inside a ladder that ends by asking what they will try next. |
| Any validation of model output | `mayIncludeCode` — which `decisionEngine.ts` calls a guarantee, not a preference — was enforced by asking a language model nicely. |
| Server-side cancellation, request timeout | Stop and closing the tab stopped the UI; the server kept pulling and paying. |
| Token, request and cost accounting | Seven of the eleven specified env variables returned zero grep hits repo-wide. The only ceiling was a burst bucket allowing ~600 sustained requests per learner per hour. |
| A trust boundary in the prompt | Task text, starter code and the learner's own words were concatenated into one system message at equal authority, and the learner's message appeared **twice** — once carrying system authority. |
| Adversarial, safety, provider and rate-limit test suites | `tests/nova/` held three files. The only injection test asserted that the prompt STRING contained defensive prose. |

### Defects — integrated, and wrong

| Defect | Severity | Where |
|---|---|---|
| `/api/learning/events` accepted `verdict_received`, `failure_attributed`, `solution_revealed` and both `assistance_*` from any logged-in browser, stamped them `browser`, and nothing downstream read the stamp — `eventsForEpisode` did not even `SELECT source_trust` | blocker | ingest route |
| The same route was the only write path never calling `ownedEpisodeId` | blocker | ingest route |
| Nova was fully available during the monthly assessment while the shipped help centre states in both languages that it is not | blocker | hint route |
| `DEEPSEEK_MODEL` defaulted to `deepseek-chat`, **retired by DeepSeek on 2026-07-24**; it now errors rather than resolving | blocker | `schools/config.ts` |
| The hint ladder's effort test collapsed to "was a verdict written" — and no verdict is written for a block no machine scores, or for any block while the judge is down. Help stayed locked at the opening rung for the whole episode. | blocker | `schools/nova/enforce.ts` |
| `tests_passed`/`tests_total` emitted only for code blocks — 19 of 54 attempt blocks carry no counts, making `progressed`/`regressed` unreachable and collapsing thrash into stuck | major | submit route |
| `solution_revealed` emitted nowhere, so a learner shown the answer and then submitting it counted as an independent solve | major | submit route |
| `contains_code` recorded from the PERMISSION before the model spoke, then consumed downstream as an OBSERVATION | major | hint route |
| `unproductiveStruggle` never passed — the rule that lifts the cap for a drowning learner | major | `schools/nova/enforce.ts` |
| `max_tokens` fixed at 500 for every rung, so a level-0 question had the room of a level-4 worked fix | major | hint route |
| Five learning routes never called `checkLearningAccess` | major | activity, dictionary, explanation, review, track |
| CI ran lint, typecheck and build — and no tests at all. The golden gate had never gated anything. | blocker | `.github/workflows/ci.yml` |
| `NOVA_RUNTIME_VERSION` left at 1 after the grant semantics changed | major | `packages/nova-core` |

### Conflicting

**`schools/learning/attempts.ts` versus `schools/nova/enforce.ts`.** The bridge
declares itself *"the single most consequential file in this adapter"* and
explicitly forbids a fork — *"No fork. We do not reimplement the guard."* It had
zero production callers. What actually gated the ladder was a private four-name
set inside `enforce.ts`, three of whose four names are emitted nowhere in the
product.

Resolved in favour of the bridge, which is now live, pure, and filtered on
`source_trust` rather than on event name — because the obvious repair (also
count `episode_opened`) would have traded a lock-out for a one-line `fetch()`
that unlocks the ladder without answering anything.

### Superseded

The archive's `AttestedSubmission` payload (`problem_id`, `submission_id`,
`tests_total`, `first_failing_test`) is a judge-submission shape. The HMAC
construction is kept; the payload is the school's. This matches
`VERIFIED_COUPLING.md` §3 exactly: *"keep the crypto, replace the shape."*

## The archive's own warnings, checked one by one

| `VERIFIED_COUPLING.md` | Status |
|---|---|
| §1a `progressed`/`regressed` unreachable without per-test counts | **was real** — fixed in this phase |
| §1b `thrash` vs `stuck` collapses | **was real**, and compounded: even when classified, the result was never passed to `grantHintLevel` |
| §1c ingest defaults `language` to `cpp17` | not copied. The school ingest has no language default |
| §2 `toLearningVerdict` discards anything containing `timeout` | handled at the exec port: a learner's TLE and a provider timeout are separate statuses |
| §2 `humanize()` emits English CP prose into `directive.opening` | **still open** — see below |
| §3 `attestation.ts` hard-rejects on `problem_id` | superseded |
| §3 a missing secret is indistinguishable from an attack | fixed — `assertProductionConfig` fails at boot |

## Left open, deliberately, and why

Recorded here rather than omitted. None is a safety or evidence-integrity
problem; each is a real gap.

- **`humanize()` leaks English CP prose** into `directive.opening`, which the
  prompt injects verbatim under a rule saying "Write ONLY in Kazakh". The model
  usually translates it; that is luck, not design. The fix is a school phrasing
  table, and `schools/learning/phrasing.ts` already exists and is unwired.
- **Decisions are not persisted.** Migration 0006 creates `learning_actions` and
  `learning_action_outcomes` and says why: *"the decision engine is unfalsifiable
  without this."* Nothing writes either table.
- **Retention is defined and never scheduled.** `learning_events_purge` (180
  days) and `code_blobs_drop_content` (90 days) exist in migration 0003 and are
  called by nothing, so learners' source code is retained indefinitely.
- **The post-help explanation gate** — route, pure gate, table, migration and 30
  tests — is unreachable by a learner; no component calls it.
- **Nova cannot see the learner's code.** There is no channel for it, so the
  ladder's own rungs 3 and 4 ("their specific case", "the fix") are
  unsatisfiable unless the learner pastes it by hand. This is last on purpose:
  routing the editor's contents in before the trust boundary was proven would
  have turned a `# Ignore all previous instructions` comment into a
  system-prompt directive.
