# SolveX4Schools adapter — specification

What you have to build. Not built here, and deliberately so: the core is what
was tested and shipped, and shipping an untested school adapter alongside it
would blur which half you can trust.

Prerequisite reading: `SOLVEX_ADAPTER_REFERENCE.md` — the same five
responsibilities, solved once already for competitive programming.

---

## The school evidence principle

**This is the most important page in the archive.** Everything else is
mechanics.

```
   interaction
       │
       ▼
   deterministic evidence extractor        ◄── curriculum author's work
       │
       ├── a declared diagnostic mapping exists  ──►  failure_class = that
       │
       └── no mapping exists                     ──►  unattributed_failure
                                                       (NOT "Nova guesses why")
       ▼
   learning event  ──►  core
```

**Worked example.** A prediction question:

```python
for i in range(3):
    print(i)
```

A learner predicts `1, 2, 3`.

- **If** the curriculum author explicitly declared that distractor as
  `range_start_offset` — the learner thinks `range(n)` starts at 1 — then that
  is *trusted evidence*, and the core may eventually name it.
- **If no mapping exists**, the answer is wrong and the cause is
  `unattributed_failure`. Full stop. Not "the model thinks it's an off-by-one".

Wrong answer → `unknown`. Never wrong answer → LLM guess.

### Why this is not excessive caution

SolveX had a path that did it the other way, and it ran in production. Every
wrong answer was labelled "missing edge cases" with no analysis at all, and it
reached learners as a statement of fact. Separately, every failed submission
marked all of its problem's tags as "weak topics", so one failure on a four-tag
problem produced four fabricated weaknesses.

Both were found and fixed while preparing this export. Neither was detectable
from the outside, because a confident wrong diagnosis looks exactly like a
confident right one.

**A verdict is not a cause.** In a classroom that is not a design preference —
a system that tells a twelve-year-old they "don't understand loops" on the
strength of a wrong multiple-choice answer has done something to them, and the
teacher will believe it too.

The core is built to be honest here: three quarters of failures in SolveX carry
no cause, `DIAGNOSE` is the default action, and `unattributed_failure`
contributes to **nothing** — not a fractional level drop, not a low-confidence
misconception. Preserve that.

---

## 1. Events to add

Add these to `LEARNING_EVENTS` in `packages/learning-contracts/src/events.ts`.
No database migration is needed — `learning_events.event_name` only checks
length 1..48, and the taxonomy is enforced in application code.

| Event | Category | Notes |
|---|---|---|
| `lesson_started` | lifecycle | Or reuse `episode_opened` with `task_kind: 'lesson'` |
| `lesson_completed` | lifecycle | |
| `prediction_answered` | interaction | Carries the chosen distractor |
| `trace_answered` | interaction | |
| `fill_blank_answered` | interaction | |
| `debug_attempted` | interaction | |
| `verify_answered` | verification | Unseen problem — the strongest evidence you get |
| `practice_attempted` | practice | |
| `practice_completed` | practice | |
| `assessment_attempted` | assessment | |
| `independent_retry` | verification | Delayed retry with no scaffold |
| `code_run` | coding | Or reuse `run_executed` |
| `nova_hint_used` | assistance | **Reuse `assistance_delivered` instead** — see §5 |

**Reuse before you add.** `episode_opened/_resumed/_closed`,
`statement_revisited`, `idle_gap`, `solution_revealed`,
`assistance_requested/_delivered` and `failure_attributed` are already
domain-neutral and already have downstream consumers. An event you invent that
duplicates one of these gets no reduction, no state and no decision.

### Payload keys you must NOT omit

Two keys look CP-specific and are not optional if you want the full outcome
model: **`tests_passed` and `tests_total`.**

`progressed` and `regressed` — two of the seven intervention outcomes, and the
only two that can say a hint made things better or worse — are computed as a
delta over these across successive attempts
(`interventionOutcome.ts:164-174`). Absent them, `delta()` returns null and
**both branches are unreachable**. No error; the outcome distribution simply
never contains them, and `hintEffectiveness` and the
`learning_action_effectiveness` view see a world where no hint ever helped.

The same counts drive the `thrash` vs `stuck` split in the episode reducer
(`episode.ts:478-499`), which is what lifts the hint cap for a learner who is
genuinely stuck rather than coasting.

For a scored assessment, emit the real numbers. **For a single right/wrong item,
emit `1`/`0`** — `progressed` then means "got it on a later attempt", which is
exactly the signal you want. Do not leave them absent.

See `VERIFIED_COUPLING.md` §1.

### Payload keys to add

`ALLOWED_PAYLOAD_KEYS` is a hard allowlist — anything not listed is dropped
server-side and silently. Candidates:

```
lesson_ref  unit_ref  month  block_kind  block_index
answer_correct  distractor_ref  attempts_in_block
scaffold_used  scaffold_level
is_unseen  delay_hours
```

Keep the existing discipline: **scalars only** (an object could smuggle a
payload past review), no free text, no learner-authored prose, and nothing that
identifies a child.

---

## 2. Evidence sources, and which are trusted

| Source | Trusted fact | Requires inference | Verdict |
|---|---|---|---|
| Multiple choice / prediction | Which option was chosen | Why | **Trusted** iff the author mapped the distractor |
| Trace / fill-blank | The exact answer string | Why | Trusted iff mapped |
| Find-the-bug | Which line was selected | Why | Trusted iff mapped |
| Code run + test result | Pass/fail, which test | Why | Trusted; cause needs the SolveX attribution treatment |
| Compiler / runtime output | The error the toolchain printed | — | **Fully trusted** — reuse `compile_error`/`runtime_error` verbatim |
| Unseen-problem verification | Solved / not solved, unaided | — | **Fully trusted, and the best signal you have** |
| Delayed retry | Solved after N hours with no scaffold | — | **Fully trusted** — this is retention |
| Nova hint L1–L5 | Which level was delivered | Whether it helped | Trusted for the level; the outcome is computed by the core |
| Time on task | Elapsed seconds | Whether they were thinking | **Not trusted** — a closed laptop lid is not deliberation |

The last row is already handled: `idle_gap` drops anything over an hour rather
than clamping it, because a clamped value reads as a genuine pause.

---

## 3. Failure classes

`MisconceptionObservation.failureClass` is typed as plain **`string`**
(`learnerState.ts:47`). Your classes flow through the confidence model, the
actionable gate and the directive builders with **no core change**.

Keep from SolveX: `compile_error`, `runtime_error`, `unattributed_failure`.
Drop: `memory_limit`, `complexity_asymptotic` (judge-specific).
`edge_case_handling` is generic and worth keeping.

Add your own, derived from declared curriculum mappings — `range_start_offset`,
`off_by_one_loop_bound`, `mutable_default_arg`, whatever your authors actually
declare. Add each to `FAILURE_CLASSES` so the UI can be exhaustive over the set.

**Do not add a class you cannot produce from a declared mapping.** An unused
class is harmless; a class produced by a heuristic is the thing this whole
document exists to prevent.

---

## 4. Curriculum context — keep it OUT of the core

Month, unit, lesson, prerequisites, support/core/advanced: none of this belongs
in `LearnerState`. The core deals in `skill` (an opaque string) and nothing else.

Where it goes instead:

- **`skill_id` on the event.** The core aggregates per skill. Map your
  curriculum to skill ids in the adapter and pass the id.
- **`TaskRequest`.** The engine returns `{ skill, difficulty: 'easier'|'same'|'harder', requires, purpose }`.
  That is a *direction for your catalogue to resolve*, not a measured level — a
  deliberate limitation, because per-task difficulty calibration does not exist.
  Your curriculum resolves it against prerequisites and the unit map.
- **Nova's prompt.** As user-message context, never as system-prompt authority.
  See `NOVA_PROVIDER.md` §"What NOT to do".

---

## 5. Assistance — reuse the ladder, do not rebuild it

`assistance_requested` / `assistance_delivered` with `level: 0..4` already
carries L1–L5. `grantHintLevel()` already enforces:

- one rung at a time
- no rung without an attempt since the last hint
- the directive's ceiling
- a learner override that is always honoured, in one tap, with the cost stated once

Scaffolds and starter code are assistance too. If a lesson ships scaffolded
code and the learner completes it, that is **not** an independent solve — record
it so `soloSolved` stays honest. `independence_weight` on the episode is where
this lands.

---

## 6. The thing most likely to break silently

```ts
// packages/nova-core/src/novaRuntime.ts:214
const ATTEMPT_EVENTS = new Set(["code_changed_debounced", "run_clicked", "submit_clicked"]);
```

`hasAttemptSince()` is the escalation guard — "you cannot climb a rung without
having tried something". It is the one rule that works with **no learner history
at all**, so it is what protects your product on day one.

A school learner answering a prediction question emits **none of those three
events**. So `hasAttemptSince` returns false forever, every hint request is
capped at the last granted level, and Nova appears to be stuck repeating itself.
No error, no warning.

**Fix it explicitly**, and treat it as a genuine behaviour change rather than a
port:

```ts
const ATTEMPT_EVENTS = new Set([
  "code_changed_debounced", "run_clicked", "submit_clicked",   // keep if you have a code surface
  "prediction_answered", "trace_answered", "fill_blank_answered",
  "debug_attempted", "practice_attempted",
]);
```

Note what stays **out**: opening a panel, switching a tab, re-reading the
lesson. The original excludes tab switches on purpose — opening the console is
not an attempt, and a guard that accepts it is not a guard. Scrolling a lesson
is the school equivalent.

---

## 7. Curriculum progress projection

You will want states like `not_started → learning → practicing →
independent_evidence → needs_review`. `LearnerState` can support this **as a
projection in your UI layer**, without touching the core.

| Your state | Derive from |
|---|---|
| `not_started` | No episodes for the skill |
| `learning` | `SkillState.level === 'unknown' \|\| 'developing'` |
| `practicing` | `level === 'competent'` and `soloSolved < distinctTasks` |
| `independent_evidence` | `level === 'strong'`, or `soloSolved >= 3` across distinct tasks |
| `needs_review` | An `actionable` misconception exists, **or** `hintDependency` is high |

Two rules:

**Do not add a mastery percentage.** The core gives four coarse buckets
(`unknown`, `developing`, `competent`, `strong`) on purpose. `unknown` is a real
answer and the correct one most of the time. A percentage implies a measurement
precision that does not exist, and once a number is on screen a teacher will
average it.

**Do not modify the core to make the UI convenient.** If a projection genuinely
cannot be derived, that is a finding worth reporting — not a reason to add a
field. The one extension that might be justified: a per-skill
`lastEvidenceAt`, since `needs_review` is partly about staleness and the core
tracks recency only inside misconceptions. Add it as a *count-derived* field or
not at all.

---

## 8. Strobi / mascot boundary

The core exposes semantic outcomes. It must never learn an animation name.

```
   decide()  ──►  actionType: REMEDIATE
                  nova.mode:  "explain"
                  novaIndicator(directive) ──► { tone: "teaching", label, detail }
                       │
                       ▼   YOUR UI LAYER, not the core
                  tone "teaching"   ──►  Strobi explaining animation
                  tone "measuring"  ──►  Strobi curious animation
                  tone "holding"    ──►  Strobi patient animation
                  tone "stretching" ──►  Strobi energised animation
                  tone "neutral"    ──►  Strobi idle
```

`novaIndicator()` already returns exactly five tones —
`neutral | measuring | teaching | holding | stretching` — plus a label and a
one-line `detail` that always says what the state is derived *from*. That is
your whole mapping table, and it is the complete list.

Put the map in the UI package. If `strobi` ever appears in a grep of
`packages/`, the boundary has been crossed.

Keep `detail` reachable. A learner being given less help than they asked for is
owed an explanation, and "Nova is measuring" is a different thing from "Nova is
holding back". Silence there reads as the product being broken.

---

## 9. Privacy — schools are different

The core is already clean: `subject` is an opaque `string`, and a grep of the
exported packages for `email|username|handle|classroom|ip_addr` returns zero
functional hits (`SECURITY_SCAN_REPORT.md`).

Keep it that way, and fix three things SolveX did not have to:

**Teacher access needs scoping.** `SOLVEX_ADMIN_USER_IDS` is a flat allowlist
granting evidence access to *every* subject. SolveX had no notion of a class.
Replace `isAdminUser()` with a roster check.

**Deletion is a real obligation.** `learning_forget_user(uuid)` exists and
works. The `solvex_forget_user` wrapper will not compile without migration
`0001` — write your own rather than skipping it. See `database/README.md` §1.

**Rate limiting keys on client IP** in `copilot.py`. One school behind one NAT
gateway is one bucket, so the whole class gets throttled by its most active
student. Key on `subject_id`.

Two properties worth stating to a school explicitly, because they are unusual
and true: **source code never enters the event payload** (hashed into
`code_blobs`, only `blob_hash` stored), and **every claim carries its receipts**
(`MisconceptionObservation.episodeIds` lists the exact episodes, and a learner
can read their own profile through the same endpoint an admin uses).

---

## 10. Build order

1. **Apply migrations + the two `ALTER`s.** (`database/README.md` §1)
2. **`resolveSubject` equivalent.** Opaque id, roster mapping in the adapter.
3. **Emit `episode_opened` / `_closed` and `assistance_*` only.** Run the
   reducer. You now have episodes and the hint ladder, with no attribution —
   every learner gets `DIAGNOSE`, which is correct and honest.
4. **Fix `ATTEMPT_EVENTS`.** (§6) Do this before anyone uses hints in anger.
5. **Wire the directive into your Nova call**, both sides. (`NOVA_PROVIDER.md`)
6. **Add interaction events** and the curriculum-declared distractor mappings.
7. **Only now emit `failure_attributed`**, from declared mappings only.
8. **Watch `learning_attribution_coverage`.** If it is near zero, the engine
   knows nothing — and it will say so rather than pretend.

Run `tests/golden.test.ts` after every step. If it goes red, you changed the
intelligence.
