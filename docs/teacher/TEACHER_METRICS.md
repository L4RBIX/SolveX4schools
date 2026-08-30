# Teacher metrics — definitions

Every number the teacher command centre displays, defined once.

This document exists because the alternative is what the audit found: three
different definitions of "unexplained failures" and two of "a solo solve", all
live at the same time, on screens a teacher reads side by side. A metric whose
semantics live only in the code that computes it drifts the first time somebody
adds a second computation of it.

**The rule for a change:** if you alter a formula below, alter this row in the
same commit. If you add a metric, add a row. `tests/teacher/` asserts semantics,
not values, so a silent redefinition passes the suite and fails this document.

---

## 0. The five standing constraints

Inherited, and not up for renegotiation in a dashboard:

1. **No mastery percentage.** `learnerState.ts:206-215` refuses a 0–100 score
   because nothing available supports one: three quarters of failures carry no
   cause, and there is no difficulty calibration to weight a solve by. Four
   coarse states can be defended from counts; a number cannot.
2. **No composite score, and no ranking by one.** See §10 for how the
   leaderboard is reconciled with this.
3. **Every claim names a checkable cause.** A finding a teacher cannot disagree
   with on the evidence does not belong on the screen.
4. **`unknown` is a real state.** Not measured is not zero, and a judge outage
   is not a learner failing.
5. **A teacher may be told a misconception's name; a learner may not.**
   `PRIVACY_DATA_FLOWS.md:315-316`.

---

## 1. The two clocks

Half of what a teacher wants is **recent**; half is **established**. They come
from different places and are never divided into one another.

| | Windowed | Cumulative |
|---|---|---|
| Source | `attempt_episodes`, SQL aggregate on `opened_at` | `learner_state` / `learner_skill_state` |
| Window | half-open `[from, to)`, UTC | all-time since the course began |
| Freshness | as fresh as the last reducer sweep | as fresh as the last reducer sweep |
| Used for | counts, time, struggle, activity, the leaderboard | skill levels, misconceptions, assistance dependency |

### Why levels are not windowed

`buildLearnerState` is pure and will happily fold a filtered episode list. Doing
so is wrong, and the reasons are specific:

- `levelFor` requires `attempts >= 2` for any level at all, so inside seven days
  most learners collapse to `unknown` — the dashboard reads "we know nothing"
  rather than "nothing happened this week".
- `strong` needs `soloSolved >= 3` **and** `distinctTasks >= 3`. Unreachable in
  a week for almost everyone.
- A misconception needs `distinctEpisodes >= 2` *inside the window* to be
  actionable (`observationConfidence` returns 0 at n ≤ 1), so `needs_review`
  vanishes from a weekly view.
- `hintDependency`'s denominator becomes in-window solved episodes; a week with
  no solves reads `0.0`, which renders identically to "fully independent".

And one hard prohibition: **never pass a windowed state to
`store.putLearnerState`.** It is an upsert plus a `delete` of every
`learner_skill_state` row (`learning-store.ts:754-805`), so persisting a window
destroys the cumulative projection.

Misconception *recency* is the exception and is free: `lastSeenAt` is the only
timestamp in the whole learner projection, so a "still happening" filter needs
no reducer run. `MISCONCEPTION_RECENT_DAYS = 21`.

### The window itself

`week` and `month` delegate to `@schools/lib/activity-window`, unchanged. That
module is server-side and UTC because two phones in one classroom must agree
about when the week started, and it is Monday-anchored because a school week is.
There is no second definition of "this week" anywhere in the teacher code.

`programme` is the one window added here: 1 September to the end of today. It
has monthly buckets, because nine months of daily bars is not a chart.

**Comparisons** use the equal-length window immediately before. Not "last month"
for a weekly view — a week compared against a month produces a number that looks
like a trend and is an artefact of the denominator.

---

## 2. The definition that had two answers

**Independent solve** = `attempt_episodes.outcome = 'accepted'` **AND**
`independence_weight >= 1`.

This is the same predicate `buildLearnerState` uses (`learnerState.ts:307`), and
it is deliberately **not** `max_assistance_level < 0`, which is what
`store.activityBuckets` uses.

They differ in exactly one case, and it matters: `reduceEpisode` sets
`outcome = 'accepted'` **before** it checks `solutionRevealed`
(`episode.ts:334-335`), while `independenceWeight` returns `0` for a revealed
solution. So a learner who reveals the answer and submits it is **assisted** to
the learner projection and **solo** to the activity chart.

The whole teacher surface uses the weight. Consequences:

- the dashboard and the learner's own page cannot disagree;
- a revealed answer can never be ranked as independent work (§10);
- `activityBuckets` remains wrong on the learner page. That is a defect in
  another workstream's surface, recorded in the audit, and not fixed here
  because changing it changes what a learner has been shown all term.

---

## 3. Headline metrics

| Metric | Question | Source | Formula | Trust | Window | Limitations |
|---|---|---|---|---|---|---|
| **Total students** | How many are in my class? | `class_enrolments` ⋈ `school_accounts` | `count(*)` where `withdrawn_at is null and disabled_at is null` | server | current | A withdrawn learner disappears retroactively; the count is "now", not "over the term". |
| **Active in period** | Who worked at all? | `attempt_episodes` | learners with `episodes > 0` in the window | judge/server | windowed | An episode with no submission counts. Opening a lesson is activity; it is not work. Use §10's `workingDays` for the stricter sense. |
| **Need attention** | Who do I look at? | derived | learners whose status is `not_started`, `dormant` or `needs_attention` | derived | mixed | See §4. |
| **Ready for challenge** | Who needs more? | derived | learners whose status is `ready_to_stretch` | derived | mixed | See §5. |
| **Independent solves** | How much unaided work happened? | `attempt_episodes` | `count(*)` where accepted and `independence_weight >= 1` | judge | windowed | Counts EPISODES, so two solves of one task count twice. The leaderboard counts distinct tasks instead; the two numbers legitimately differ and are labelled differently. |
| **Assisted solves** | And how much with help? | `attempt_episodes` | `count(*)` where accepted and `independence_weight < 1` | judge | windowed | Includes revealed solutions. |
| **Median practice minutes** | How long are they working? | `attempt_episodes.active_seconds` | median over **active** learners only | browser-derived | windowed | `active_seconds` excludes idle gaps over 10 minutes, so it is not wall clock. The denominator is active learners: a median across a class where half did nothing is zero every week and technically true. |
| **Required work** | How much of the month is done? | `evaluateCompletion` over ledger evidence | see §6 | judge | month | Evaluated against `DEFAULT_TRACK`; for a Support learner this is a LOWER BOUND. See §6. |

---

## 4. Attention findings

One status per learner, first match wins, so the four tiles partition the roster
and sum to it. The old dashboard could put the same child in two tiles.

**Ladder:** `not_started` → `dormant` → `needs_attention` → `ready_to_stretch` →
`on_track`.

| Finding | Fires when | Source | Window | Why the threshold |
|---|---|---|---|---|
| `never_started` | 0 cumulative episodes and 0 in window | roster + `learner_state` | — | The learner the old panel structurally could not surface. Weight 10: the fix is usually a password. |
| `inactive` | no event for ≥ `INACTIVE_DAYS` (7) | `max(learning_events.received_at)` | — | A school week. `received_at` is the server clock; `occurred_at` is the client's and is documented as forgeable. |
| `repeated_misconception` | an `actionable` misconception with `lastSeenAt` within 21 days | `learner_skill_state.misconceptions` | cumulative + recency | `actionable` = confidence ≥ 0.6, which needs ≥ 2 distinct episodes. A single observation is never actionable. |
| `assistance_dependent` | `hintDependency ≥ 0.5` over ≥ 4 solves | `learner_state.hint_dependency` | cumulative | The floor is new. Without it, one solve after one hint read as 100% dependent. |
| `stuck` | ≥ 2 `stuck` episodes and 0 independent solves in window | `attempt_episodes.struggle_class` | windowed | `stuck` = three identical verdict signatures with no meaningful edit between them: out of ideas. |
| `thrashing` | ≥ 3 `thrash` episodes in window | same | windowed | Same stagnation WITH edits: still trying. Higher floor because thrashing is commoner and less alarming. |
| `unexplained_failures` | `unattributedFailures ≥ 3` and ≥ 20% of episodes | `learner_state.unattributed_failures` | cumulative | Proportional, because an absolute count fires for everyone by November. This is a statement that the SYSTEM could not explain something — never a claim about the learner. |
| `required_work_behind` | ≥ 2 lessons below the class median, and the median is ≥ 2 | §6 | month | Relative to this class, not to a target nobody set. A class three lessons in has nobody three lessons behind. |
| `assessment_incomplete` | started-and-stopped, OR ≥ 50% of the class has finished | §7 | — | **The constant the benchmark forced.** Without `ASSESSMENT_PEER_SHARE` this fired for 18 of 20 the day the check opened — every statement true, the whole set worthless. "The class has not sat it yet" is a class fact and lives on the assessment tile. |
| `regressed` | previous window ≥ 3 independent solves and this window < 50% of that | `attempt_episodes` | windowed vs previous | The absolute floor stops 2 → 1 reading as a 50% collapse. |
| `reveal_reliant` | ≥ 3 reveals and ≥ 30% of solves | `attempt_episodes.solution_revealed` | windowed | Worth naming because a reveal is scored as assistance everywhere else, so without it the learner just looks quiet. |

**Recommendations** are a `switch` over the finding kind. Nothing asks a model
what to do about a named child — the brief forbids it, and the practical
argument is stronger: a teacher who cannot predict what the dashboard will say
cannot trust it.

**Benchmarked firing rates** over 20 simulated learners are asserted in
`tests/teacher/benchmark.test.ts`, and no single finding may fire for more than
half the class.

---

## 5. Ready to stretch

Three conditions, all required:

1. ≥ 2 skills with `soloSolved ≥ 2` at level `competent` or `strong` (cumulative)
2. ≥ 3 solves in the window
3. window independence share ≥ 0.7

Condition 2 is the one the old signal lacked: without it, "no complaints" plus
two competent skills from October nominates a learner who has not opened the
product this week.

It is below `needs_attention` on the ladder, so a learner with an actionable
misconception is never called ready no matter how much they have solved.

---

## 6. Required work

**Not** `lesson_completions`. That table records that a learner reached the end
of a lesson and the server agreed the policy was met at that moment. It cannot
answer "how far through are they now", because a learner four blocks into five
has no row at all — and reading absence as zero tells a teacher a child has done
nothing when they have done most of it.

So: `evaluateCompletion` — the same pure function `/api/learning/complete` uses —
run against ledger evidence from `classBlockEvidence`. One definition of
finished, two callers.

- **Denominator:** authored lessons in the current month. Months 2–9 ship
  structure with `blocks: []` and are excluded and listed separately.
- **Numerator:** lessons where `decision.satisfied`.
- **Optional work:** passive blocks (concept, worked example, simulation)
  require `none` and are not governed, so they are in neither. There is no
  Core-vs-Bank flag in the content model beyond that; inventing one in a
  dashboard would be a curriculum decision made in the wrong place.

### Known limitation: the track

A learner's route (`support` / `core` / `advanced`) lives in a non-httpOnly
per-device cookie `sx_track_m{n}` and is persisted nowhere a server can read.
This evaluates against `DEFAULT_TRACK` = `core`.

For a Support learner the denominator is therefore up to five blocks too high,
which makes this a **lower bound** on their progress and never an overstatement.
That direction is the safe one. It is a limitation, not a rounding: fixing it
requires persisting the track, which is a schema change in another workstream.

---

## 7. Assessment

| State | Means | Derivable today |
|---|---|---|
| `not_open` | the month is not published, or the check has no blocks | yes |
| `not_started` | no evidence on any governed block | yes |
| `in_progress` | some evidence, policy not satisfied | yes |
| `awaiting_review` | every machine-gradable block is graded; what remains is structurally human-marked | yes — but see below |
| `complete` | `assessment.v1` satisfied, or a completion row exists | yes |

**`awaiting_review` is a policy state, not the marking queue.** It means a
machine did not grade this and could not. Whether a person has actually read the
answer is a different fact, recorded in `human_reviews` (migration 0022) and
counted by `ReviewQueue.pending` — which is why the two can legitimately read
`0` and `3` on the same screen, and why this state is labelled «Осталось
учителю» rather than «Ждёт проверки человеком». Sharing a sentence with the
queue made a correct screen look broken.

**`unmeasuredCoding`** — a machine-gradable block with submissions and no
verdicts. This is the judge-outage signal. `assessment.v1` requires `measured` on
both coding blocks, so an outage silently zeroes a whole class's completion and
the ledger records only the absence. The submit route computes
`judgeUnavailable` vs `noTrustedJudge` and stores neither; this reconstructs the
fact that nothing could be measured, which is very different from a learner who
did not sit the check.

**`unreadableResponses`** — human-marked blocks with evidence and no stored
answer. September's `m1.as.b3` (written) and `m1.as.b4` (oral) accept real prose
that is graded `unknown` and **discarded**: the payload allowlist keeps free text
out of the ledger by design, and nothing else stores it. Meanwhile the learner is
told «Жауабың сақталды — оны мұғалім оқиды». The dashboard cannot fix that; it
refuses to imply there is something to read.

**Measured minutes** come from `attempt_episodes.active_seconds` where
`task_kind = 'assessment'` — server-stamped. `MonthlyAssessment.minutes` is an
authored budget the product does not enforce (there is no timer component) and
is rendered as an estimate.

---

## 8. Skills

Five states, from `skillEvidence(SkillState)`. Order of derivation is
load-bearing: `needs_review` is checked **first** and can coexist with solves —
someone can pass three tasks and still reliably get the boundary wrong.

| State | Means |
|---|---|
| `not_started` | no attempt recorded. An absence of measurement, not a zero. |
| `learning` | attempted, too little to say anything (level `unknown`) |
| `practicing` | solving, with help or not yet consistently |
| `independent_evidence` | solved unaided at `competent` or `strong`. The only state claiming independence. |
| `needs_review` | an actionable misconception |

**The row set is every skill the curriculum has TAUGHT** (`introducedInMonth <=
currentMonth`), not every skill somebody has touched. The old table enumerated
`LearnerState.skills`, so a skill September taught and nobody attempted did not
appear at all — letting the page imply the curriculum is only what has been
attempted, and hiding the most actionable case of all: a topic the whole class
skipped. Each row now sums to the enrolled roster.

**Known content limitation.** Only `skillRefs[0]` is credited on a *wrong*
answer; all refs on a correct one (`grade.ts:60-88`). So a skill's evidence
volume is not proportional to how many blocks tag it.

---

## 9. Lessons and blocks

The question: *is the learner struggling, or is the lesson bad?* It is only
answerable by holding the block fixed and varying the learner.

| Metric | Formula | Notes |
|---|---|---|
| `startedBy` | distinct learners with any episode on a governed block | |
| `completedBy` | learners whose `evaluateCompletion` is satisfied | |
| `completedIndependentlyBy` | of those, learners who took no assistance and revealed nothing on any governed block | A learner who finished with one hint HAS finished the lesson — the policy says so and it is right. They have not finished it unaided, and the two facts want different columns. |
| `medianMinutes` | median over learners of summed `active_seconds` | |
| `hardestBlockId` | lowest `acceptedBy / attemptedBy` among attempted blocks | |
| `dropOffBlockId` | governed block with the fewest attempters, earliest on a tie | A block nobody reached is a stronger drop-off signal than one many reached and failed. |
| `medianSubmissions` | `percentile_cont(0.5)` over `attempt_episodes.submissions` | **Graded** submissions, not Check presses: an unchanged answer replays the stored verdict and writes nothing (migration 0019). So this is "how many different things did they try". |

`medianSubmissions` and `medianMinutes` are `null` when nobody attempted — a
median over an empty set is absent, and `0` would read as "everyone solved it
first try".

**Never rendered:** hidden cases, expected outputs, reference solutions.
`blockIndexOf()` holds full authored blocks and only ids, kinds and titles leave
it.

---

## 10. The leaderboard

### Reconciling it with "no ranking by score"

The project has written that it does not rank children
(`PRIVACY_DATA_FLOWS.md:318`, `classroom.ts:262-265`). That refusal is kept and
is narrower than it first reads: what it refuses is a **composite invented
score** — the `mastery 0-100` and `averageScore 0-100` that got
`_quarantine/invented/teacher-data.ts` quarantined, numbers with no evidence
under them that nonetheless sort a class from best child to worst.

Every value below is an integer count of episodes a teacher can open and check;
each lens publishes its formula on screen beside the table; no lens adds two
units together. Where a composite would be needed, there is no lens.

This is a **deliberate departure**, recorded so a later reader knows it was
decided rather than overlooked.

### The lenses

| Lens | Value | Floor | Formula |
|---|---|---|---|
| Independent | distinct tasks accepted with `independence_weight >= 1` | ≥ 3 distinct tasks attempted | count |
| Improvement | this window minus the previous, on the same quantity | ≥ 3 attempted now, ≥ 1 attempted before | subtraction of two counts |
| Consistency | distinct UTC days with an episode carrying ≥ 1 graded submission | ≥ 2 such days | count |
| Challenge | distinct `challenge`/`verify` tasks accepted unaided | ≥ 1 | count |

Ties share a rank (1, 1, 3). Inventing a tiebreak would smuggle an unstated
criterion into a board whose whole claim is that its formula is visible.

Learners below a floor are **unranked and listed separately**, never last.
Ranking on n = 2 produces an ordering that inverts next week.

### Anti-gaming

The load-bearing choice is `count(distinct task_ref)` rather than `count(*)`.
Each row is asserted in `tests/teacher/leaderboard.test.ts`.

| Attack | Why it fails |
|---|---|
| Same answer submitted 20× | Unchanged answers replay the stored verdict and write nothing. One distinct task. |
| Re-solve solved trivial tasks 15× | Already in the distinct set. Adds zero. |
| Open and close 30 lessons | No accepted verdict, no count on any lens. |
| Nova on everything, paste the answer | Assistance sets `independence_weight < 1`. Help cannot raise a rank; it can only remove a task from the independent set. |
| Reveal the answer and submit it | `independence_weight` is 0 for a reveal. This is the case `activityBuckets` gets wrong and this does not. |
| Replay a submission id | `learning_submissions` is idempotent on `(subject, submission_id)`. |
| Leave the tab open for hours | **No lens reads `active_seconds`.** Screen time is not ranked. |
| Grind low-value work for "consistency" | Days require a graded submission, so opening a lesson does not register. |

Class-only. No cross-class or cross-school comparison exists anywhere in the
code.

---

## 11. Assistance analytics

What a teacher sees: counts and outcomes. What they never see: the conversation.

That is structural, not a policy setting — the payload allowlist has no text
key, `interventions.content_hash` is never written, and the chat lives in browser
React state alone. The dashboard states it as a property so nobody later fills
in the absence.

| Metric | Source | Caveat |
|---|---|---|
| requested / delivered | `learning_events` counts | Safety-blocked and budget-blocked requests return before either write, on purpose. A learner throttled by the daily cap looks like one who never asked. |
| undelivered | requested − delivered | Granted-but-never-streamed. A row lands in `interventions` at grant time, before the provider is called, so an outage still charges the rung. |
| per-level outcomes | `interventions ⋈ intervention_outcomes`, through `hintEffectiveness()` | **Window is fixed and stored:** `same_episode / 20 active minutes / 3 submissions`. A learner who returns next day and solves it reads as `stalled`. Every label says "within 20 minutes", never "after help". |
| escalation rate | same | **At level 0 this is not a quality judgement.** `NovaChat` always posts `requestedLevel: 1` and the first grant is forced to rung 0, so any second question inside the window classifies intervention #1 as `escalated` regardless of what was asked. |
| `degradedProvider` | `getNovaProvider().degraded` | On the `echo` provider a hint is one canned sentence. Any success rate over that period describes nothing about tutoring, and the panel refuses to conclude. |

`hintEffectiveness()` was implemented, exported and unit-tested with zero
production callers before this rebuild. Wiring it was a call site, not a build.

`medianSecondsToFirstHint` is **not displayed**: it is permanently `null`,
because `store.episodeInputsFor` never sets `EpisodeInput.secondsToFirstHint`.

---

## 12. Freshness

Every cumulative number is as old as the last reducer sweep. This is rendered on
every screen.

- `lastSweepAt` = `max(attempt_episodes.reduced_at)`
- `pendingEvents` = this class's events with an `episode_id` and no reduced
  episode
- `behind` = `pendingEvents > 0 AND (never swept OR older than 5 minutes)`

A never-swept deployment with pending work counts as behind. Treating `null` as
"not behind" means the worst case reports healthy.

`lastActivityAt` is the exception: it reads `learning_events` directly, so it is
**not** sweep-lagged. That asymmetry is stated on screen.

---

## 13. Performance

The overview costs **13 queries for a class of any size**. None is per-learner:
every read is an aggregate keyed on `subject_id = any(...)`.

The endpoint it replaces issued **97 for eighteen learners, 54 of them writes**,
and grew linearly.

Two known costs:

- `classBlockEvidence` matches on `split_part(payload->>'task_ref', ':', 2)`, an
  **unindexed jsonb expression**. It is bounded by an explicit block-id list and
  the class's subject list. Do not widen it to a whole year of blocks.
- `loadRequiredWork` is called by more than one builder per request and is not
  memoised across them. At pilot size this is milliseconds; at 30 learners ×
  9 months it is the first thing to cache.

---

## 14. What is deliberately absent

| Not built | Why |
|---|---|
| Per-track analytics | The track lives in a per-device cookie and is persisted nowhere. There is no data to group by. |
| A teacher mark or sign-off | Needs its own table. Bolting a score column onto `post_help_explanations` would reopen the auto-grading hole migration 0016 exists to close. |
| Storage for assessment written/oral answers | A schema and privacy decision, not a dashboard one. Recorded as the product's largest honesty gap. |
| Streaks | Removed once already as a fabrication. `activeDays` is `count(distinct date)` over real episodes and is labelled as days worked, never as a streak. |
| Any live "what is happening right now" view | Everything except last-activity reads a projection that only moves when the reducer sweeps. |
| Notifications | The attention queue is the surface. Deferred deliberately. |
