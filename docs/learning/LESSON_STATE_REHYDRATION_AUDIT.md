# Lesson state rehydration — what the server knows and where the chain stops

Traced before writing any code. Every claim below is a file and a line, not a
recollection.

## The bug in one sentence

The server records everything and the lesson page asks it nothing.

## 1. What the server persists per graded attempt

`src/app/api/learning/submit/route.ts` writes, in one transaction:

| where | what |
|---|---|
| `learning_events` | `episode_opened` (`sourceTrust: "server"`, line 370), `verdict_received` (**`sourceTrust: "judge"`**, line 401 — one per credited skill), `failure_attributed` (line 446), `episode_closed` (line 475) |
| `learning_submissions` | `block_id`, `episode_id`, `verdict`, **`response` jsonb — the exact reply body, replayed verbatim**, `settled_at` (migration `0019`) |
| `interventions` | assistance actually delivered, with `level` as a real column (`upsertInterventions`) |

The `verdict_received` payload carries `verdict`, `task_ref`, `skill_id`,
`tests_passed`, `tests_total`.

### What is NOT persisted, and this bounds the whole phase

**The learner's answer.** Not the code, not the selected option, not the
ordering. `grep -n "CODE_TRANSPORT_KEY|code_blobs|blob_hash" src/app/api/learning/submit/route.ts`
returns nothing, and of the 50 keys in `ALLOWED_PAYLOAD_KEYS` none can carry an
answer — `blob_hash` exists but only the Arena path writes it.

`code_blobs` (migration `0003`) exists and is content-addressed by hash alone,
with no subject or block column: it is Arena infrastructure, not a school
answer store.

So "restore the learner's submitted code" is **not implementable from existing
persistence**, and the brief's own instruction applies — *"If UNSUBMITTED draft
persistence does not exist: do not invent an autosave subsystem in this phase."*
The same is true of submitted answers generally. This phase restores **settled
state**, and §33 of the brief is answered: drafts and answers are not restored,
and that is a documented gap rather than a silent one.

## 2. Which query retrieves it

**`LearningStore.blockAttempts(subjectId, blockIds)`** already exists and is
almost exactly the right shape:

```
select split_part(payload ->> 'task_ref', ':', 2) as block_id,
       count(*) filter (where event_name = 'episode_opened')  as submissions,
       count(*) filter (where event_name = 'verdict_received') as verdicts,
       bool_or(event_name = 'verdict_received'
               and source_trust = 'judge'
               and payload ->> 'verdict' = 'accepted')         as accepted
  from learning_events
 where subject_id = $1 and split_part(...) in (…)
 group by 1
```

**One query for a whole lesson's blocks**, already parameterised by placeholders
rather than `= any($2)` so it works on both drivers. It answers §19 (no N+1) and
§20 (PGlite *and* Postgres) for free.

What it does not yet return: the **latest** verdict (only "was any accepted"),
the failed-attempt count that `revealFor` needs, and the assistance level.

Also available: `submissionRecord()` (per submission id), `lastGrantedLevel(episodeId)`,
`interventionsForSubject(subjectId)`.

## 3. What `LessonRoute` receives today

`src/components/brilliant/lesson/lesson-route.tsx:20-25`:

```
lesson: PublicLesson
monthIndex: number
monthTitle: string
trustedProviderConfigured?: boolean
```

**No learner state of any kind.** `src/app/lesson/[lessonId]/page.tsx` passes
exactly those four.

## 4. Where initial client block state is created

`src/components/brilliant/lesson/school-lesson.tsx`:

```
const FRESH: BlockState = { answer: NO_ANSWER, verdict: "unchecked", attempt: 0 }
```

Every block starts `unchecked`, every time, for everyone.

## 5. Why persisted state is discarded

It is never asked for. The player's only network calls are
`api/learning/complete`, `api/learning/events` and `api/learning/submit` —
all **writes**. Confirmed by `grep -rn 'api/learning' src/components/brilliant/lesson/`:
there is no read.

So the state is not lost, dropped or raced. **It was never fetched.**

## 6. Is `/api/learning/state/me` usable?

No — wrong grain. It returns the learner-level Learning Intelligence summary:
`decide(state)`, evidence, activity buckets, weekly window
(`src/app/api/learning/state/me/route.ts`). It answers "how is this learner
doing", not "what happened to block `m1.l12.b2`".

Useful for cross-surface agreement tests (§43). Not a hydration source.

## 7. Server-side hydration or client fetch?

**Server-side.** The lesson page is already `export const dynamic = "force-dynamic"`
and already awaits `resolveTrack()` and `gateFor()` before rendering. One more
awaited query costs one round trip that is already happening, and it is the only
option that satisfies §32 — no flash from 0/3 to 2/3, because the first paint is
already correct.

A client fetch would mean the learner watches their own completed work appear,
which is the bug wearing a spinner.

## 8. What is safe to expose

Everything proposed here **has already been sent to this same learner**, by the
submit route, for these same blocks. Hydration replays what they were told; it
reveals nothing new:

| safe | why |
|---|---|
| verdict (`correct`/`partial`/`wrong`/`unknown`) | already returned by submit |
| attempt count | their own |
| `cases: {passed, total}` | already returned by submit |
| `unmeasuredReason` | already returned; it is what distinguishes "judge down" from "a teacher marks this" |
| reveal payload | **derived server-side** by `revealFor({block, verdict, failedAttempts})` — it is a *policy output*, not stored, so hydration must re-derive it rather than trust a client |
| assistance used / delivered level | their own ledger |

Never: `correctOptionId` where policy has not revealed it, hidden case inputs or
expected outputs, `referenceSolution`, teacher-only diagnostics. These are
already absent from the page — the previous phase verified the structured
payload carries only the 4 visible cases and `hiddenCaseCount: 3`/`5`.

## The chain, before

```
submit → learning_events (judge trust)  ✓
       → learning_submissions           ✓
       → interventions                  ✓
                ↓
        teacher view                    ✓ reads it
        Learning Intelligence           ✓ reads it
                ↓
        /lesson/[lessonId]              ✗ ASKS NOTHING
                ↓
        SchoolLesson → FRESH            ✗ every block "unchecked"
```

The chain stops at exactly one place: the lesson page.

---

# The chain, after — what was built

The trace above is accurate and its conclusion held: the chain stopped at the
lesson page, and nothing else was broken. What follows is what was put in, and
the three places where building it changed an answer given above.

```
submit → learning_events        (evidence: teacher, reducer, completion policy)
       → learning_submissions   (the reply body, settled in the SAME transaction)
       → interventions          (assistance, with level as a real column)
                ↓
  lessonHydration(lessonId, blocks)      schools/learning/rehydrate.ts
        4 bounded queries, never one per block
                ↓
  projectHydration(...)                  schools/learning/hydration.ts   (pure)
                ↓
  <LessonRoute hydration={…}>            prop, server-rendered, no fetch
                ↓
  SchoolLesson: useState(() => statesFrom(hydration))
                useRef(episodesFrom(hydration))
```

## Correction 1 — the reveal is REPLAYED, never re-derived

§8 above says the reveal "is a policy output, not stored, so hydration must
re-derive it". It is stored, and re-deriving it is the one thing migration 0019
forbids in terms:

> recomputing the reveal for a duplicate would consult a failure count that has
> moved on since, so a retry could open an answer the original submission had
> not earned

`revealFor` opens at three failures. A learner who has since failed a fourth
time on a block they later got right would have the answer handed to them by a
page refresh. The count only ever grows, so re-derivation can only ever leak.

`learning_submissions.response` holds the exact JSON already sent to this
learner (`route.ts:553-576` built it, `:613` stored it, `:708` returned it), so
replaying it is provably a no-op disclosure. The author's `why` settles the
question on its own: `justificationFor(block, answerKey)` needs the learner's
answer key, which is not persisted anywhere, so it cannot be re-derived at all.

## Correction 2 — `blockAttempts` is the floor, not the source

§2 proposes extending `blockAttempts`. It is used, but as a FALLBACK. Two facts
it structurally cannot carry:

* `wrong` and `partial` are one value in the ledger — `toLearningVerdictName`
  folds both into `wrong_answer`. A learner who traced four of five rows would
  be restored as having failed outright.
* A block that settles `unknown` writes **no `verdict_received` row at all**
  (`route.ts:385`). Every `explain`, every oral task and every judge-down code
  submission would restore as *never attempted* — the original bug, surviving
  inside its own fix.

So the primary source is the settled submission and the event stream is the
floor beneath it, for blocks answered before submission ids existed. A block
restored from the floor is flagged `degraded: true` and carries no reveal,
because the floor genuinely does not know one.

The two sources cannot disagree: `appendEventsAndSettle` writes both inside one
transaction.

## Correction 3 — retention

Migration 0019 licensed deleting these rows after a day. Migration 0020 revokes
that in the table comment and states the rule a future sweep must follow: keep
the latest settled row per `(subject_id, block_id)`.

## The half of the fix that is not about pixels

Restoring the verdicts was the visible half. The episode id was the other, and
it was the more serious one.

Every counter that gates pedagogy is keyed on the episode — the hint rung is
`max(level) from interventions where episode_id = $1`, the reveal counter is the
non-accepted `verdict_received` rows on the episode, and `solveEvidence` reads
`assistance_delivered` the same way. The client minted a fresh id on every
mount, so a refresh reset all three.

The reset did not hand out more help; it made the ladder harder. What it did do
was launder help already taken: four hints in episode A, a reload, a solve in
episode B, and `solveEvidence` reports `assistanceDelivered: false`.
`scheduleFor` then files it as an independent milestone and `activityBuckets`
counts it as `solved_solo`. The product was manufacturing "solved
independently" about a child who had been handed the answer ninety seconds
earlier.

Hydration returns the block's episode so a later attempt continues it. It is
withheld in exactly two cases, both argued at `HydratedBlock.episodeId`:

* **the block is already accepted** — otherwise one level-0 hint in September
  makes every future solve of that block non-independent for the rest of the
  year, and `evaluateCompletionGate` says that can never be undone;
* **the last settled row came from a delayed re-solve** — a review's separate
  episode IS the independence measurement, and migration 0014 puts a CHECK
  constraint on its separateness.

## What is restored, and what is not

Restored: verdict at full fidelity (`correct` / `wrong` / `partial` /
`unmeasured`), attempt count, the reveal already shown, the author's
justification of that specific wrong answer, the unmeasured reason, per-test
counts, delivered assistance and its level, the continuing episode, and the
server's lesson-completion row.

Not restored, and said out loud on the card rather than papered over: **the
learner's answer**. It is not persisted, deliberately, and this phase did not
overturn that. A restored block would otherwise be a green border around an
empty editor — which reads as "correct, and you wrote nothing", a worse lie than
the blank lesson it replaced. `RestoredNote` says what is true instead.

## Two defects found while building it

Neither is in the hydration path; both are on it.

1. **`appendEventsAndSettle` discarded the settle's row count.** Its return
   value is the EVENT count, so a settle that matched zero rows was
   indistinguishable from one that matched. Reachable through the claim
   takeover in `schools/learning/submission.ts`: owner A outlives
   `STALE_CLAIM_SECONDS`, B takes the claim, A settles, then B commits a second
   complete set of `verdict_received` and `failure_attributed` rows behind one
   settled row — and reports `saved: true`. The learner's restored card and the
   teacher's console then disagree about how many times a child tried. It now
   throws `SubmissionAlreadySettledError`, which rolls the duplicate events back
   with it; the route counts it as `save.settle_races`, apart from real write
   failures, because nothing broke.

2. **`resolveSubjectForUser` was check-then-insert.** A learner's first Check
   fires `/events` and `/submit` at the same moment and both resolve identity.
   Under PGlite they serialise behind its single writer; under Postgres — the
   production target — the loser raises
   `duplicate key value violates unique constraint "learning_subjects_user_id_key"`
   and a fourteen-year-old gets a 500 on the first answer they ever submit. Now
   conflict-tolerant, and it re-reads the alias so both callers leave with the
   same subject id. The anonymous path had the same shape and got the same
   treatment. Found only because the end-to-end pass was run against real
   Postgres instead of the development store.
