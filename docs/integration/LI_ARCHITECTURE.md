# Architecture

How the thing works, and why it is shaped this way.

---

## The one idea

Most systems that claim to know something about a learner are guessing. This one
is built around the opposite premise:

> **Unknown is better than wrong.**

Three quarters of failures in SolveX carry no attributable cause. A system
designed for a world where we know *why* people fail would spend most of its
time inventing reasons. So this one inverts the default: **`DIAGNOSE` — "ask,
don't tell" — is the most common answer**, and teaching a specific misconception
is the exception that requires evidence to unlock.

That inversion is the whole design. An engine that always has an opinion is
indistinguishable from one that is right, until you check.

---

## The layers

```
  L1  learning_events            append-only ledger, the source of truth
       │                         everything below is a rebuildable projection
       ▼
  L2  attempt_episodes           one attempt at one task
       │                         reduceEpisode()          REDUCER_VERSION 5
       ▼
  L3  interventions              one hint, and what happened after it
      intervention_outcomes      buildInterventions() / computeInterventionOutcome()
       │
       ▼
  L4  learner_state              what we believe, and how much of it is guesswork
      learner_skill_state        buildLearnerState()      LEARNER_STATE_VERSION 1
       │
       ▼
  L5  learning_actions           what to do next
       │                         decide()                 DECISION_ENGINE_VERSION 1
       ▼
  L6  learning_action_outcomes   did it work
                                 verifyAction()           INTERVENTION_MEMORY_VERSION 1
```

**Only L1 is durable.** L2–L6 are caches. Bump the matching `*_VERSION` and the
next sweep recomputes them from the ledger. That is why a semantics change is a
version bump rather than a migration — and why deleting `learning_events` is the
one unrecoverable act in the system.

---

## What each layer refuses to do

**L2 — the reducer.** Turns an event stream into one episode. Computes
`struggle_class`, `independence_weight`, the diff-class sequence. It does not
decide *why* anything failed; it records that an attribution arrived.

**L3 — interventions.** Pairs `assistance_requested` with
`assistance_delivered`, then watches what the learner did next. Seven outcomes,
including `resolved_by_transfer` — solved a *different* task unaided afterwards,
the strongest available signal that a hint taught something rather than
substituting for thinking.

**L4 — learner state.** Aggregates episodes per skill. This is where the honesty
lives:

- An **unattributed failure contributes to nothing.** Not a fractional level
  drop, not a low-confidence misconception. It increments
  `unattributedFailures` and stops.
- A misconception's confidence is `1 − P(fewer than two true positives)` under
  `Binomial(distinctEpisodes, evidenceConfidence)`, **capped at 0.95**. One
  attributed failure returns exactly `0` — an incident is not a pattern. The cap
  exists because counting attributions is not running an experiment.
- `actionable` requires confidence ≥ `0.6`. It is the only gate that unlocks
  naming a misconception to a learner.
- Levels are four coarse buckets — `unknown | developing | competent | strong`.
  `unknown` is a real answer and the correct one most of the time. **There is no
  mastery percentage anywhere in the system**, and adding one would break the
  property everything rests on.

**L5 — the decision engine.** Reads `LearnerState` and nothing else. Adds no
detectors. Five actions, in strict priority:

| Priority | Action | When |
|---|---|---|
| 0 | `REDUCE_ASSISTANCE` | Their results are not attributable to them |
| 1 | `REMEDIATE` | A named, recurring, **actionable** misconception |
| 2 | `DIAGNOSE` | We do not know enough — **the default** |
| 3 | `STRENGTHEN` | They can do it, but not reliably or unaided |
| 4 | `CHALLENGE` | Strong independent evidence |

`REDUCE_ASSISTANCE` outranks remediation deliberately: if a learner's accepted
work came off a code-bearing hint, every skill conclusion drawn from it is built
on sand. Teaching a misconception to someone who is pasting answers does not
land.

**L6 — action memory.** Every action carries a falsifiable `expectedOutcome`,
so "did this work" is a query rather than an opinion.

---

## Nova: policy, then enforcement, then transport

```
  decide(state) ──► NovaDirective { mode, maxHintLevel, mayNameMisconception,
                                    namedMisconception, mustNotSay, opening }
        │
        ▼
  grantHintLevel(requested, lastGranted, hasAttemptSince, directive)
        │                                     pure function — no network, no key
        ▼
  GrantDecision { granted, capped, reason, explanation, mustNotSay }
        │
        │  restrictions only: { max_hint_level, mode, may_include_code }
        ▼
  server: effective_help_level = min(requested, cap)   ← never max
          _format_directive() → prohibitions written HERE
        │
        ▼
  provider: one OpenAI-compatible POST
```

A prompt is a preference. This is a guarantee: `mayNameMisconception` is false
unless a misconception cleared the actionable threshold, so *"you don't
understand X"* is **unreachable** without evidence rather than merely
discouraged.

### The hint ladder

Five rungs, `0..4`. Three rules, and only the first needs any learner history:

1. **A directive caps the level.** `DIAGNOSE` caps at 0 — questions only —
   because a hint given without a diagnosis is a guess in a confident voice.
2. **Escalation is earned.** One rung at a time, and no rung without an attempt
   since the last hint. Reads events only, so it works on day one.
3. **The learner can always override**, in one tap, with the cost stated once. A
   mentor you cannot overrule is a wall, and learners route around walls by
   leaving. The override buys a bigger hint — never a diagnosis.

Why this exists: the ladder had been skippable since it shipped. The Copilot's
buttons carry a hard-coded level — "Explain error" is 3 — so the rung was chosen
by which button someone pressed, and **nobody who is stuck presses "small
hint"**.

---

## The trust boundary

Three separate boundaries, each closed a different way.

**Browser → ledger.** The client and the ingest route share one allowlist, and
the server re-validates anyway. `source_trust`, `environment` and `cohort` are
stamped server-side: a browser cannot label its own events trustworthy. Source
code travels under a transport-only key, is hashed into `code_blobs`, and only
`blob_hash` is stored.

**Verifier → ledger, through an untrusted browser.** The backend signs
`{verdict, attribution, skill_id}` with HMAC-SHA256; ingest verifies and takes
facts *from the signed body*, never from the client's payload. A
`failure_attributed` event without a valid signature is **dropped entirely**
rather than downgraded — an unsigned attribution is not a weaker claim, it is
not a claim.

**Client → LLM.** The directive crosses the network, so a learner can send
anything. What makes that safe is that every field can only *remove* capability,
and **there is no field for a claim** — no misconception, no weakness, no skill
level. Withholding the directive entirely is the most permissive thing a client
can do, which is the same as the behaviour before it existed.

Positive statements are rendered from server-computed state and never handed to
a model as fact. There is no step at which the model can be persuaded to assert
something the evidence does not carry, because it is never told the claim.

---

## Failure modes

The subsystem can never block the product. Every failure resolves to
`directive: null`, and a null directive imposes no cap — so the degraded product
is *the ladder without personalisation*, which is still better than no ladder.

| Condition | Result |
|---|---|
| No service key | Everything returns "nothing to say", HTTP 200 |
| No projection yet | The normal first-visit state, not an error |
| Backend unreachable | Same as above; hints work normally |
| Projection from an older ruleset | **Counts render, directive is null** |

That last row is the interesting one. **Fail open on restrictions, fail closed
on claims:** a cap derived from possibly-misinterpreted counts withholds help a
learner may need, and erring toward giving help is the right direction to be
wrong in. Erring toward asserting something about a person is not.

---

## What is deliberately absent

- **Mastery percentages.** Four buckets, and `unknown` is one of them.
- **A skill radar.** It implies coverage the evidence does not have.
- **Guessed weaknesses.** SolveX had one — `weak_tags`, incremented for every
  problem tag on every failed submission, with no denominator. It was removed.
- **Difficulty calibration.** `TaskRequest.difficulty` is a *direction*
  (`easier | same | harder`) for a catalogue to resolve, not a measured level.
- **Any personal data in the core.** `subject` is an opaque string. The core
  never learns a name, an email, a username or a school.
- **Prediction.** Nothing here forecasts anything. Every input is an observed
  event or a count derived from one.
