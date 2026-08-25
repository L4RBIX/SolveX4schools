# The school adapter

`schools/learning/` — the layer between the imported Learning Intelligence
subsystem and a school product.

The export was built for a competitive-programming site. A school is not one.
This layer closes that gap **without editing the export**, which matters because
`tests/golden.test.ts` is the only thing standing between us and silently
changing what the system believes about a child. Every module here is a
response to a specific defect verified by reading the exported source, not a
stylistic preference.

Current state: 31 tests in `tests/school/adapter.test.ts`, all green. The
export's own 209 remain untouched and green. Total 240.

---

## 1. The attempt bridge — `attempts.ts`

**Blocking. Fails silently. The worst of the four.**

`hasAttemptSince` (`novaRuntime.ts:214`) gates the entire hint ladder and
recognises exactly three event types:

```
code_changed_debounced | run_clicked | submit_clicked
```

A school lesson is mostly not a code editor. Answering a prediction, reordering
lines, tracing execution, choosing an option — all unquestionably attempts, all
producing none of those three events. `hasAttemptSince` therefore stays false
forever, every hint request is capped at the lowest level, and Nova looks
broken. No exception, no log, no failing test.

In a classroom this reads as the assistant refusing to help a child who is
visibly trying — the exact inverse of the programme's first AI rule: *help
unlocks after the learner has attempted something* (PDF p.4).

**Fix:** translate school interactions into the vocabulary the guard already
speaks, then delegate to it. Two properties are load-bearing:

- **No fork.** We do not reimplement the guard. If the export tightens its
  definition of an attempt, we inherit that.
- **No inflation.** Only genuine attempts translate. `lesson_opened`,
  `block_viewed`, `concept_read`, `simulation_played` and — importantly —
  `hint_requested` all map to `null`. A guard that accepts passive events is
  not a guard, and one that counts asking for help lets a learner climb the
  whole ladder by asking repeatedly.

Every caller in this product must use `schoolHasAttemptSince`. Calling the
export's version with raw school events is the bug.

## 2. `task_kind` — migration `0007`

**Blocking. Fails loudly.**

`attempt_episodes.task_kind` ships with
`check (task_kind in ('cp_problem','mission','challenge','duel'))`. Every insert
from the lesson runtime is rejected by the database.

Migration `0007_school_adapter.sql` replaces the constraint with a named one
covering `lesson`, `practice`, `assessment` and `contest` alongside the
imported four.

## 3. Verdict vocabulary — `verdict.ts`

**Blocking. Fails silently.**

`toLearningVerdict` (`events.ts:423`) maps any status containing `timeout` to
`null` — a reasonable reading in a CP context, where a timeout means the judge
did not answer. In a school sandbox the same word is the natural name for *the
learner's program taking too long*, which is the opposite: real, attributable
evidence about an algorithm that is too slow. December's entire month is built
on that skill.

**Fix:** the sandbox's status vocabulary is closed and enumerated.
`time_limit_exceeded` for a slow program, `sandbox_unavailable` for
infrastructure failure. `assertSandboxStatus` throws on the bare word
`timeout`, with a message naming both replacements. `sandboxVerdict` delegates
to the contract and throws rather than returning null if the two vocabularies
ever drift — silence is the one outcome that must not be possible here.

## 4. Attestation — `taskRef.ts`, `sign.ts`

**Blocking. Fails in a way indistinguishable from an attack.**

`verifyAttestation` (`attestation.ts:114`) rejects any payload whose
`problem_id` is not a string. It also returns `null` for a missing secret, a
malformed token and a bad signature alike (`:82`) — so a misconfigured
deployment and a forgery are the same observation.

Two fixes:

- `problemId()` mints one for every school task, from the curriculum block id.
  Format `sx-lesson:m1.l5.b3`, deliberately mirroring `cf:1234A` so anything
  that splits a task ref on a colon keeps working.
- `assertAttestationSecret()` fails at boot rather than at the first
  submission, and `signAttestation` validates the key on every call regardless
  of origin — an explicitly-passed weak key would otherwise produce perfectly
  valid-looking statements, since the verifier checks the HMAC and not the
  key's strength. *(This was caught by a test I wrote against my own signer.)*

The export ships a verifier but no TypeScript signer — the signing side lives
in `learning_attestation.py`, for a Python backend this product does not have.
`sign.ts` is that signer, and it is checked by round-tripping against the real
verifier rather than against the Python source.

**Server only.** Never import `sign.ts` from a client component.

## 5. Wording — `phrasing.ts`

Not blocking, but visibly wrong in a classroom. `humanize()`
(`decisionEngine.ts:206-222`) emits *"a compile error"*, *"a crash"*, *"the
running time"* into learner-facing prose. Correct CP idiom; wrong for a Kazakh
9th-grader who may not read English.

`phrasing.ts` re-words the output in `kk` and `ru`. It **replaces wording
only** — the decision, the level, the cap and the reasoning all come from the
engine untouched. Nothing in this module can change what the system decides.

It also holds two strings that are curriculum requirements rather than copy:

- `ASSISTANT_DISCLOSURE` — the learner always knows they are talking to a
  program (PDF p.4, rule 4). Must appear wherever Nova first speaks.
- `UNKNOWN_MASTERY` — `unknown` is a real state in the imported model and must
  survive to the screen. Rendering it as "0%" claims a measurement that was
  never taken; hiding the skill pretends it is not part of the programme. Both
  are lies, so it renders as "әлі өлшенбеген" / "ещё не измерено".

## 6. Consent revocation — migration `0007`

`solvex_forget_user()` calls `beta_analytics_forget_user()`, defined in
migration `0001`, which is not part of the export. The function does not exist,
so consent revocation errors out. The programme commits to deleting a child's
data on request (PDF p.4), so this is not optional.

`0007` redefines it to check `to_regprocedure` and skip the beta half when it
is absent — while still calling it when present, so a deployment that later
applies `0001` does not quietly stop deleting those rows.

## 7. School scoping — migration `0007`

Nothing in the export scopes a subject to a school or a class. The only access
model available is `SOLVEX_ADMIN_USER_IDS`, a flat allowlist granting every
subject — i.e. one teacher reading every learner in the database, across
schools.

`school_subject_scope` is a separate table rather than columns on
`learning_subjects`, so the imported table stays byte-identical and its own
migrations keep applying. Every teacher-facing query joins through it.

---

## Still open

| # | Item | Severity | Note |
|---|---|---|---|
| 5 | `progressed`/`regressed` unreachable without per-attempt `tests_passed`/`tests_total` | High | The signer carries both; needs the runtime to actually populate them on two successive attempts |
| 6 | `thrash` vs `stuck` collapses without per-test counts | High | Same root cause. `struggle_class` feeds the `REDUCE_ASSISTANCE` override that lifts the cap for a genuinely stuck learner |
| 8 | `TaskRequest.requires: "degenerate_cases" \| "complexity_gate"` | Medium | Pack-verification vocabulary, meaningless to a school catalogue |
| 10 | Rate limiting keys on client IP | Medium | One school NAT = one classroom sharing a bucket. Must key on learner+subject |
| 11 | `SOLVEX_ADMIN_USER_IDS` flat allowlist | Medium | Table exists (§7); the query layer is not written |
| 12 | `starterTemplates.ts` ships C++/Python CP scaffolds | Low | The only LI-core file the export permits editing |

**The maturity caveat, in the export's own words:** SolveX has no scheduler.
`buildLearnerState`, `decide()` and everything downstream have only ever run
from a manual admin button. Scheduling the reducer sweep is unexercised
territory. `hintEffectiveness()` is exported, tested, and called by nothing.
