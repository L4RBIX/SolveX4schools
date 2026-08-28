# What reaches the model

Traced from the browser to the provider, field by field, before anything was
changed. Every classification below was read out of the code, not inferred.

## The trace, as it was

```
lesson runtime                 states[blockId] = { answer, verdict, attempt, reveal, why, note }
  ↓  NovaChat props            open, onClose, locale, blockId, episodeId, onStateChange
  ↓  POST /api/nova/hint       { blockId, episodeId, message, requestedLevel, override, locale }
  ↓  checkLearningAccess       session or anonymous-in-dev
  ↓  resolveIdentity           subjectId from an httpOnly cookie
  ↓  takeToken                 per-learner bucket
  ↓  classifyMessage           safety gate
  ↓  checkAndConsumeBudget     ceilings
  ↓  ownedEpisodeId            episode scoped to the caller
  ↓  enforceHintPolicy         grant + directive, from the ledger
  ↓  findBlock(blockId)        ← THE CURRICULUM, and nothing else
  ↓  buildNovaMessages         system + fenced user turn
  ↓  provider.stream           DeepSeek
  ↓  guardedStream             output validation
  ↓  SSE                       UI
```

The line that matters is `findBlock(blockId)`. Everything Nova knew about the
learner's situation came from looking the block up in the curriculum — so it saw
the task **as its author wrote it**, and never as the learner was experiencing
it.

The browser was holding `answer`, `verdict` and `attempt` the whole time, in the
same component that renders `<NovaChat>`, and sent none of them.

## Field by field

| Field | Before | Now |
|---|---|---|
| current month | AVAILABLE | trusted, `curriculum.monthTitle` |
| current unit | MISSING (not modelled) | still absent — the runtime is lesson-scoped |
| current lesson | AVAILABLE | trusted |
| current block | AVAILABLE | trusted |
| block type | AVAILABLE_BUT_UNUSED | trusted, `curriculum.blockType` |
| question prompt | AVAILABLE | trusted |
| visible / starter code | AVAILABLE | trusted, `interaction.visible.code` |
| **learner's current code** | **MISSING** | untrusted draft, fenced |
| **MCQ options (id + text)** | **MISSING** | trusted, from the curriculum |
| **selected answer** | **MISSING** | untrusted draft, fenced |
| **learner prediction** | **MISSING** | untrusted draft, fenced |
| **reorder state** | **MISSING** | untrusted draft, fenced |
| **fill-blank answer** | **MISSING** | untrusted draft, fenced |
| **selected bug line** | **MISSING** | untrusted draft, fenced |
| **trace grid** | **MISSING** | untrusted draft, fenced |
| learner-authored test case | MISSING | untrusted draft (`text`), fenced |
| **current verdict** | **MISSING** | trusted, re-derived from the ledger |
| **stdout / stderr** | **MISSING** | trusted, from the verdict payload |
| runtime / syntax error | MISSING | carried in `stderr` |
| visible test result | MISSING | trusted, as a count only |
| **attempt count** | **MISSING** | trusted, counted from the ledger |
| previous hint level | AVAILABLE_BUT_UNUSED | trusted, `settled.deliveredHintLevel` |
| assistance used since | AVAILABLE_BUT_UNUSED | trusted, `settled.attemptSinceLastHelp` |
| relevant skills | AVAILABLE (as raw ids) | trusted, **localized labels** |
| introduced constructs | AVAILABLE | trusted, unchanged |
| LearnerState | AVAILABLE_BUT_UNUSED | summarised into `relevantSkills` |
| Decision | AVAILABLE_BUT_UNUSED | `intelligence.action` |
| NovaDirective | AVAILABLE | trusted, and now localized — see below |
| recent episode evidence | MISSING | trusted, bounded at 4, skill-filtered |
| conversation history | MISSING (client never sent it) | untrusted, fenced, 3 exchanges |
| hidden tests / expected outputs | correctly ABSENT | still absent, and now asserted |
| reference solution | correctly ABSENT | still absent, and now asserted |
| teacher notes, other learners | correctly ABSENT | no field exists for them |

### OVER_SHARED — one, and it was real

`NovaDirective.namedMisconception` was interpolated **raw** into the prompt, so
a prompt could contain `strict_vs_inclusive_boundary` — snake_case engine
vocabulary, sitting in the one paragraph that invites the model to say the thing
out loud. `validate.ts` would have caught it on the way out, but a rule enforced
only by the output validator is a rule the model must be talked out of on every
request. It now goes through `failureWord`, the same localizer the teacher's
surface uses.

### UNTRUSTED — the whole draft, by construction

Everything the learner is currently typing arrives from the browser and is
therefore forgeable. It is shape-checked, clamped (4 000 chars of code, 24
blanks, 40 pieces), fenced with a per-request nonce, and **excluded from every
ledger write**. It may shape wording; it may never shape permissions.

A draft claiming `verdict: correct, attemptCount: 99, deliveredHintLevel: 4` is
inert — `tests/nova/context-injection.test.ts` asserts exactly that.

## What the split is for

`interaction.settled` is re-derived from the ledger on every request.
`interaction.draft` is the browser describing itself. Two facts made that seam
necessary rather than tidy:

1. `attemptCount` and `verdict` feed the hint ladder and the teacher's evidence.
   A field that can be claimed will eventually be claimed.
2. «Где ошибка?» is nearly always asked about something **not yet submitted**, so
   a tutor that can only see checked work is always one step behind the learner.

Both halves are needed. Only one is trusted.

## Bounds

| | |
|---|---|
| Recent evidence | 4 episodes, skill-filtered, closed only |
| Conversation | 3 exchanges, 600 chars each |
| Draft code / text | 4 000 chars |
| stdout / stderr | 800 chars each |
| Whole prompt, September worst case | ~7.7 kB measured; asserted under 8 kB |

The worst case is `m1.l6.b3s` in Russian at level 3. Input tokens are billed,
eighteen learners share one monthly cap, and a context that grows quietly is how
a pilot runs out of budget in week three.
