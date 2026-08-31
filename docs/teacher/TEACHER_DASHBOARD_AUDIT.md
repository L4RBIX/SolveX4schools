# Teacher dashboard — forensic audit

**Baseline SHA:** `59bf26ba68aefb5ae2a550bc46d5affbd5d83c44` (branch `teacher-command-center`)
**Date:** 2026-08-29
**Method:** twelve parallel readers over auth, store/schema, Learning Intelligence, curriculum,
Nova, execution, the teacher surface, the design system, tests, API conventions, docs and
assessments — each report then adversarially verified against the source by a second reader.
Every claim below cites a file and line that was actually opened.

This document describes what the teacher surface *was* at the baseline SHA. It is the input to the
rebuild, not a description of it.

---

## 1. What the teacher surface actually was

Three files thick.

| Layer | File | What it did |
|---|---|---|
| Page | `src/app/teacher/page.tsx` | `currentUser()` → redirect anon to `/login`, students to `/home`; lists `store.classesForTeacher(userId)` |
| Shell | `src/components/brilliant/app/teacher-home.tsx` | class picker (only when >1 class), renders `<TeacherClassroom>` |
| Panel | `src/components/brilliant/app/teacher-classroom.tsx` | one `fetch` in a `useEffect`, four stat tiles, learner cards, one skill table |
| API | `src/app/api/teacher/class/[classId]/route.ts` | the **entire** teacher API — one GET |
| Projection | `schools/presentation/classroom.ts` | `buildLearnerRow` / `buildClassroomView`, five signal kinds |

There were **no** other teacher routes. No drill-down, no per-lesson view, no assessment view, no
export, no write endpoint of any kind.

### Data flow at baseline

```
learning_events (append-only ledger, server-stamped received_at)
   └─ reducer sweep (schools/reducer/sweep.ts, in-process, 20s interval)
        ├─ attempt_episodes            (per-episode projection; opened_at, struggle_class, …)
        └─ buildLearnerState(all episodes, no date filter)
             └─ learner_state / learner_skill_state   ← ALL-TIME CUMULATIVE
                  └─ store.learnerStatesForClass(classId)      [N+1]
                       └─ buildLearnerRow → buildClassroomView
                            └─ GET /api/teacher/class/[classId]
                                 └─ TeacherClassroom (client fetch)
```

The single windowed input in the whole chain was `lastActivityForClass` —
`max(learning_events.received_at)` per subject, all-time max, used only for the `no_activity` signal.

---

## 2. Per-metric classification

Every number, label and badge the baseline dashboard rendered.

| # | Surface element | Classification | Why |
|---|---|---|---|
| 1 | «Только в разработке — авторизации пока нет» badge | **PLACEHOLDER (false)** | `teacher-classroom.tsx:98-102`. Contradicted by `page.tsx:22-31` and `requireClassAccess` (`guard.ts:62-81`), which are two files away. Anonymous `GET /api/teacher/class/grade-9a` returns `401 {"error":"not_authenticated"}` — verified live. |
| 2 | «Учеников» stat | **REAL** (mislabelled) | `view.learners.length` = active roster size, not an activity count. `rosterForClass` filters `withdrawn_at is null and disabled_at is null`, so withdrawn learners silently leave the denominator. |
| 3 | «Ещё не начали» stat | **DEAD** | `notStarted = enrolled - rows.length`; `enrolled = roster.length` and `rows` is built *from* the roster (`route.ts:60-78`). Structurally always `0`. The field's own doc comment disagrees with the code. |
| 4 | «Требуют внимания» stat | **REAL_BUT_MISLEADING** | Overlaps stat 5. Only `unexplained_failures` suppresses `ready_to_stretch` (`classroom.ts:195`), so a learner can be counted in **both** tiles. The four tiles do not partition the class and do not sum to the roster. |
| 5 | «Готовы к сложному» stat | **REAL_BUT_MISLEADING** | `soloShare` denominator mixes per-skill solve counts (skill-bearing episodes only) with top-level `unattributedFailures` (every episode). Skill-less episodes inflate the denominator and can never appear in the numerator. |
| 6 | Learner card «попыток» | **REAL_BUT_MISLEADING** | `state.episodes` = every reduced episode including skill-less and verdict-less ones; the solo/assisted counts beside it exclude exactly those. The gap between the numbers on one line is invisible and unexplained. |
| 7 | Learner card solo / assisted | **REAL** | `independence_weight >= 1`, judge-gated upstream. |
| 8 | Learner card «без причины» | **REAL** | `state.unattributedFailures` — the honest denominator, correctly surfaced. |
| 9 | Learner card `interventions` | **DEAD** | Computed (`classroom.ts:228`), typed, serialised to the browser, rendered nowhere. |
| 10 | Signal `no_activity` | **PARTIAL** | Guarded by `if (lastActiveAt)`. A learner who has **never** been active has no row in `lastActivityForClass`, so the signal never fires for them. Combined with #3 and a sort weight of 0, the never-started child was the one learner the dashboard structurally could not surface. |
| 11 | Signal `recurring_misconception` | **REAL** | Named, checkable, auditable via `episodeIds`. Unbounded per learner though — nested loop with no cap, against a docs claim of "up to five". |
| 12 | Signal `high_assistance` | **REAL_BUT_MISLEADING** | Uses `hintDependency` (`max_assistance_level >= 2`) but is *guarded* by `soloSolved + assistedSolved > 0` (`independence_weight >= 1`). Two different definitions of "assisted" on the same card. |
| 13 | Signal `ready_to_stretch` | **REAL_BUT_MISLEADING** | See #5. |
| 14 | Signal `unexplained_failures` | **REAL** | |
| 15 | Skill table, 4 columns | **REAL_BUT_MISLEADING** | Population is "learners with ≥1 attempt on that skill", not the class. Row totals differ per skill and nothing on screen says so. |
| 16 | Skill table `not_started` bucket | **DEAD** | Initialised to 0 (`classroom.ts:254`) and can never be incremented: `skillEvidence` returns `not_started` only at `attempts === 0`, and a 0-attempt skill never enters `LearnerState.skills`. Dead data on the wire. |
| 17 | Curriculum coverage in skill table | **MISSING** | A skill September taught but nobody attempted does not appear at all. `buildEvidence(state, throughMonth)` already does this correctly for the *learner* page and has no teacher caller. |
| 18 | Per-skill evidence dots | **PARTIAL** | Colour-only (`<span className={EVIDENCE_TONE[s.state]}>●</span>`), no text state, no `title`, no legend. Fails WCAG 1.4.1 and fails a colour-blind teacher. `EVIDENCE_LABEL` exists and is not imported. |
| 19 | Empty state | **REAL_BUT_MISLEADING** | Fires on `learners.length === 0`, which equals roster size — so it says "nobody has done any work" when the truth is "nobody is enrolled". |
| 20 | Class identity | **PARTIAL** | With one class the teacher never sees its **name**: the picker renders only at `classes.length > 1`, and the panel prints the raw `classId` (`grade-9a`) in mono. `school_classes.name` («9А») is already fetched and thrown away. |
| 21 | Projection freshness | **MISSING** | `learnerStatesForClass` returns `computedAt` per subject; `route.ts:64` discards it. Nothing said how old the numbers were, and they only move when the sweep runs. |
| 22 | `signal.skill` / `signal.failureClass` | **DEAD (UI)** | On the wire, never rendered, and there was no affordance to see the episodes behind a disputed signal. `episodeIds` was not even on `ClassroomSignal`. |
| 23 | Assessment status, anywhere | **MISSING** | Neither `buildClassroomView` nor any signal kind mentions a monthly check. The teacher literally could not see whether the class sat the September assessment. |
| 24 | Lesson / block / task analytics | **MISSING** | No route, no query, no projection. |
| 25 | Nova assistance analytics | **MISSING** | `hintEffectiveness()` is implemented, exported and unit-tested with **zero** production callers. |
| 26 | Leaderboard | **MISSING** | |
| 27 | Time windows / trends | **MISSING** | See §4. |
| 28 | Export | **MISSING** | `PILOT_RUNBOOK.md:162-165` promises per-class export. No route, no script. |

---

## 3. Defects found — security first

### S1 — `requireClassAccess` admits an admin to *any* class id — **CRITICAL**

`schools/auth/guard.ts:71-75`:

```ts
if (user.role === "admin") return { ok: true, value: { user, schoolId: user.schoolId, classId } };
```

No lookup at all. The comment above it claims "An admin is allowed through for their own school
only"; the code does not check that — it merely *stamps* the caller's own `schoolId` onto the
result. Any string passed as `classId` is accepted. Downstream queries then key on `class_id`
alone (see S2), so an admin of school A reading `/api/teacher/class/<B's class>` gets school B's
children.

Mitigating: no shipped tool can create an admin (`scripts/provision-class.ts` types `role` as
`"student" | "teacher"`), so the role is currently unreachable in practice. That is luck, not a
control.

### S2 — class-keyed store queries have no `school_id` predicate — **CRITICAL (release gate)**

| Method | SQL predicate | File |
|---|---|---|
| `subjectsInClass` | `where class_id = $1` | `learning-store.ts:1503` |
| `isInClass` | `where subject_id = $1 and class_id = $2` | `:1518` |
| `lastActivityForClass` | `where s.class_id = $1` | `:1541` |
| `learnerStatesForClass` | delegates to `subjectsInClass` | `:1528` |

`school_subject_scope` (migration 0007, widened to `text` by 0009) has **no foreign key** to
`school_classes` and no unique constraint spanning schools. Two schools with a class both named
`9А` — or both left on the shipped default `grade-9a` (`config.ts:153-156`; neither `SCHOOL_ID`
nor `CLASS_ID` appears in `.env.example`) — share a `class_id` and therefore share these reads.

`isInClass`'s own doc comment says it is what stops a teacher being handed "another school's
child". It is not.

Requirement #45 ("School A teacher cannot access School B classes/students") **fails at baseline**.

### S3 — the teacher GET writes to the database — **HIGH**

`route.ts:53-59` calls `store.resolveSubjectForUser(userId, scope)` once per roster learner.
That method (`learning-store.ts:1836-1878`) is not a read: it `update`s
`learning_subjects.last_seen_at`, upserts `school_subject_scope`, and **mints a subject** if none
exists.

Consequences:
- `last_seen_at` for the whole class is bumped by the *teacher's* page load, not by the learners.
  Any future "last seen" metric on that column is already poisoned.
- `school_subject_scope.subject_id` is a primary key with `on conflict do update`, so a learner
  enrolled in two classes has their scope row *stolen* by whichever teacher loaded their dashboard
  most recently. Two teachers refreshing alternately make it ping-pong.
- 97 sequential queries for 18 learners, 54 of them writes. Exactly:
  `7 + 2S + 3R` where S = subjects, R = roster.

### S4 — ordering defect

`learnerStatesForClass` (`route.ts:47`) runs **before** the `resolveSubjectForUser` loop
(`:53-59`) that repairs `school_subject_scope`. A learner whose scope row points elsewhere shows
as never-started with zeros on the first render and correct on the next.

---

## 4. The structural problem: there is no time

`LearnerState` carries **no timestamps at all** except `firstSeenAt` / `lastSeenAt` inside each
`MisconceptionObservation` (`learnerState.ts:60-61`). `store.episodeInputsFor(subjectId)` has no
date parameter (`:714`). `learner_state` holds exactly one cumulative row per subject, overwritten
on every sweep — there is no history table, no snapshot, no `learner_state_daily`.

So every threshold on the baseline dashboard — `HIGH_ASSISTANCE` 0.5, `STRETCH_SOLO_SHARE` 0.8,
`UNEXPLAINED_SHARE` 0.2 — is a **cumulative-since-September** ratio. "This week" was not
expressible.

### Why you cannot simply window `buildLearnerState`

It is pure and accepts any array, so filtering `episodeInputsFor` on `episode.opened_at` *runs*.
Four things break semantically and one breaks catastrophically:

1. `levelFor` requires `attempts >= 2`, so most learners collapse to `unknown` inside 7 days — the
   dashboard reads "we know nothing" rather than "nothing happened this week". `strong` needs
   `soloSolved >= 3` **and** `distinctTasks >= 3`, effectively unreachable in a week.
2. A misconception needs `distinctEpisodes >= 2` *within the window* to be actionable
   (`observationConfidence` returns 0 at n ≤ 1), so `needs_review` vanishes on a weekly window.
3. `hintDependency`'s denominator becomes in-window solved episodes; a week with zero solves reads
   `0.0`, identical to "fully independent".
4. `unattributedFailures`, `transferSolves` and `outcomeCounts` *do* window cleanly — they are
   per-episode sums.
5. **CATASTROPHIC:** never pass a windowed state to `store.putLearnerState` — it is an upsert plus
   a `delete` of all `learner_skill_state` rows (`:754-805`). Persisting a window destroys the
   cumulative projection.

**Conclusion for the rebuild:** windowed numbers must come from a *separate*, SQL-level aggregate
over `attempt_episodes.opened_at`, not from re-folding the reducer. Cumulative skill levels and
misconceptions keep coming from `learner_state`. Misconception *recency* is free — `lastSeenAt` is
already in the jsonb.

---

## 5. Contradicting definitions already in the codebase

These are live inconsistencies, not rebuild risks. Any dashboard showing two of them side by side
shows two different numbers for the same child.

| Concept | Definition A | Definition B | Where they disagree |
|---|---|---|---|
| "solo solve" | `LearnerState`: `independence_weight >= 1` (`learnerState.ts:307`) | `activityBuckets`: `outcome='accepted' AND max_assistance_level < 0` (`:929`) | **A revealed solution.** `reduceEpisode` sets `outcome='accepted'` *before* checking `solutionRevealed` (`episode.ts:334-335`), and `independenceWeight` returns `0` when revealed. So a learner who reveals the answer and submits it is **assisted** to `LearnerState` and **solo** to the activity chart. |
| "assisted" | `hintDependency`: `max_assistance_level >= 2` | per-skill `assistedSolved`: `independence_weight < 1` (any assistance, incl. level 0) | Level 0–1 hint use reads as 0% dependency. |
| "unexplained failures" | `LearnerState.unattributedFailures` (attributions literally classed `unattributed_failure`, includes skill-less episodes) | `evidence.ts`: `s.failures - s.attributedFailures` per skill | Learner page and teacher page mean different things by the same word. A failing verdict that produced **no** attribution event is in neither. |

---

## 6. Things that exist, work, and were never wired

The most valuable finding of the audit. None of this needs building.

| Capability | Where | Status |
|---|---|---|
| `hintEffectiveness(rows)` → delivered / successRate / harmRate / escalationRate + flagged rungs | `@solvex/learning-intelligence-core` | implemented, unit-tested, **zero callers** |
| `intervention_outcomes` — 7-way classification of what the learner did in the 20 active minutes after a hint | migration 0003, written by the sweep | written, **never read back** (`upsertOutcomes` only) |
| `struggle_class` per episode — `flow` / `productive_struggle` / `thrash` / `stuck` / `disengaged` | `attempt_episodes.struggle_class`, indexed `(subject_id, opened_at desc)` | written, **no store method reads it** |
| `transferSolves` — solved by pasting the hint's code | `learner_state.transfer_solves` | measured, persisted, shown to **nobody** |
| GIN index `idx_learner_skill_misconceptions` built for "who has misconception X" | migration 0006:100-103 | **unused** |
| `idx_post_help_reviewable` partial index for the teacher marking queue | migration 0016:100-103 | **unused**, and the table is empty in every deployment (its only writer `/api/learning/explanation` has no frontend caller). **Deliberately deferred**, not overlooked — see `TEACHER_HUMAN_REVIEW.md` §6a for the decision and what has to ship first |
| `teacherOutcome(status, passed)` — total, tested, 8 closed values | `teacher-outcome.ts` | **zero call sites**; its own header says so |
| `evaluateCompletion` + `completionTarget` + `blockAttempts` | `schools/policies/*` | the only honest "N of M required" path; **no teacher caller** |
| `curriculum_publications` + `publishCurriculum` / `withdrawCurriculum` | migration 0013, store `:1764` | schema and store exist; **no route, no UI** |
| `review_schedule` outcomes (`resolved_independently` / `resolved_with_assistance` / `unresolved`) | migration 0014 | written; `dueReviews`/`pendingReviews` both filter `completed_at is null`, so **settled reviews are unreadable** |
| `decide(state)` → next action with falsifiable `expectedOutcome` + `EvidenceRef[]` | `decisionEngine.ts` | computed by the sweep and **thrown away**; `learning_actions` has no writer |

---

## 7. Honesty gaps

**H1 — the assessment promises a teacher will read something that is discarded.**
`m1.as.b3` (`explain`) and `m1.as.b4` (`verify` / oral) accept real prose. It goes to
`/api/learning/submit`, grades `unknown`, and is **thrown away** — the payload allowlist keeps free
text out of the ledger by design, and `post_help_explanations` is gated behind assistance level ≥ 3
which an assessment answer will not meet. Meanwhile the UI already tells the learner
«Жауабың сақталды — оны мұғалім оқиды» ("your answer is saved — a teacher will read it").

This is the single largest honesty gap in the product, and it is not a dashboard bug — the
dashboard cannot show what was never stored.

**H2 — `medianSecondsToFirstHint` is permanently `null`.** `episodeInputsFor` never sets
`EpisodeInput.secondsToFirstHint` (`:740-750`), so the median folds over an empty array and
`learner_state.median_seconds_to_first_hint` is NULL for every learner ever. This also makes the
`REDUCE_ASSISTANCE` "dependent" branch of the Decision Engine unreachable
(`decisionEngine.ts:230-232`).

**H3 — a judge outage is indistinguishable from a class that did not sit the assessment.**
The submit route computes `judgeUnavailable` vs `noTrustedJudge` and returns them to the browser,
but stores neither. `assessment.v1` requires `measured` on both coding blocks, so an outage
silently zeroes a whole class's assessment completion with no trace.

**H4 — `EVIDENCE_TONE` is invisible on the light theme.** `not_started: "text-white/30"` and
`learning: "text-white/60"` (`evidence.ts:155-156`). The guard that would have caught this
(`theme.test.ts:129`) only walks `src/`, and this file is under `schools/`.

**H5 — two skills can never leave `not_started`.** Only `skillRefs[0]` is credited on a *wrong*
answer; all refs on a correct one (`grade.ts:60-88`). Under September's content
`compare.operators` and `types.int_float` therefore show two permanently empty columns. *(The
verifier flagged the related P1-8 finding as fixed — `GradeOutcome.creditedSkills` now exists and
the submit route credits each on success — so this is narrower than the old audit said, but the
asymmetry on failure remains.)*

---

## 8. Prior product decisions this rebuild is bound by

Quoted, because they are the reason several obvious dashboard features are refused.

- **No score, no ranking by score.** "The class list is not sorted by score, because there is no
  score" — `PRIVACY_DATA_FLOWS.md:318`. "No ranking by score… ranking children by one is the thing
  this whole model exists to avoid" — `classroom.ts:262-265`.
- **No mastery percentage.** "The brief asked for `mastery: 0.62`. Nothing available supports a
  second decimal place" — `learnerState.ts:206-215`. Also `LI_ARCHITECTURE.md:82-83`,
  `evidence.ts:9-21`.
- **Every signal names a checkable cause.** `classroom.ts:13-22`.
- **A teacher may see a named `failure_class`, because a teacher is not a child** —
  `PRIVACY_DATA_FLOWS.md:315-316`. The learner is never told the label; the teacher is.
- **No Nova transcript surveillance.** Structurally enforced: the payload allowlist has no text
  key, `interventions.content_hash` is never written, and the chat lives in browser React state
  only. This is a property to *state on the dashboard*, not an absence to fill in.
- **Streaks and activity days were removed as fabrications** —
  `PRODUCTION_PRODUCT_AUDIT.md:127-132`, "nothing records activity days".
  *Note for the rebuild:* that was true of the learner page's streak, which counted nothing.
  `attempt_episodes.opened_at` does support an honest `count(distinct date)`, so a "days worked"
  figure is defensible — but it must be derived there and labelled as episodes-on-distinct-days,
  never re-presented as a streak.
- **Curriculum publication is deliberately a CLI human act** requiring `--i-am-the-reviewer` —
  `SEPTEMBER_HUMAN_SIGNOFF.md:176-200`. Moving it into a dashboard button would contradict a
  stated decision.
- **404, not 403,** for a class not taught — otherwise the endpoint enumerates a school's classes.

### The one tension with this brief

The brief asks for a leaderboard. The project has written "no ranking by score".

These are reconcilable and the rebuild treats them as such: the refusal is of a **composite,
invented score** (mastery %, "averageScore 0-100" — exactly what `_quarantine/invented/teacher-data.ts`
was quarantined for). Ranking on a **counted, auditable quantity** — independent solves, each
traceable to a judge-verified accepted episode with `independence_weight >= 1` — is a different
act. The leaderboard is therefore built on raw counts, class-only, with the formula printed next to
it, and every lens states its denominator. It is recorded here as a deliberate departure so a later
reader knows it was decided rather than overlooked.

---

## 9. Test and CI position at baseline

- 78 test files, **1450 passing / 22 skipped**, ~41 s (measured at baseline SHA).
- 14 files open a real in-memory Postgres: `PgliteExecutor.open("memory://")` + `migrate(sql, {applyLocalBootstrap: true})` + `new LearningStore(sql)`. Real migrations, real CHECK constraints.
- **Zero tests** touch `GET /api/teacher/class/[classId]`, `buildClassroomView`, `notStarted` or the
  skill breakdown. `grep -rln 'api/teacher' tests/` returns nothing. That is why defect #3 stood.
- **Nothing in the suite has ever faked an authenticated teacher session.** Every route test mocks
  `next/headers` to resolve only the anonymous `sx_anon` cookie.
- No jsdom, no testing-library. The repo's substitute is `readFileSync` source assertions.
- **CI does not run the suite.** `.github/workflows/ci.yml` runs lint, typecheck and build only.
  1450 assertions gate nothing on a pull request.

---

## 10. Performance position at baseline

| Query | Shape | Cost at 18 learners |
|---|---|---|
| `currentUser()` | 3 queries (session select + `last_seen_at` update + account select) | 3 |
| `teachesClass` | 1 | 1 |
| `rosterForClass` | 1 | 1 |
| `learnerStatesForClass` | `subjectsInClass` + 2 × N | 37 |
| `lastActivityForClass` | 1 class-scoped aggregate | 1 |
| `resolveSubjectForUser` loop | 3 × R, **2 of 3 are writes** | 54 |
| **Total** | `7 + 2S + 3R` | **97 sequential queries, 54 writes** |

Exactly one class-scoped aggregate query exists in the entire codebase: `lastActivityForClass`.
Everything else a dashboard wants is per-subject.

The index situation is workable at pilot size and no better:
- `school_subject_scope_class_idx (class_id)` → `idx_ae_subject (subject_id, opened_at desc)` is a
  sound nested-loop path for class-scoped windowed aggregates over `attempt_episodes`.
- `blockAttempts` matches on `split_part(payload->>'task_ref', ':', 2)` — an **unindexed jsonb
  expression**. A class-wide "which block is killing us" query over that would seq-scan.
- No index combines class/school with a time window on `learning_events`, and `class_id`
  deliberately does not live on that table.

---

## 11. What the rebuild must therefore do

Ordered by whether it blocks a pilot.

**Blocking**
1. Fix S1 (admin blanket pass) and S2 (school scoping) — requirement #45 is a release gate.
2. Stop the GET from writing (S3): replace the `resolveSubjectForUser` loop with a single
   `learning_subject_aliases` join.
3. Delete the false dev badge.

**Structural**
4. Add class-scoped, time-windowed SQL aggregates over `attempt_episodes` — the only honest route
   to "this week".
5. Replace `learnerStatesForClass`'s N+1 with two joined queries.
6. Reconcile the "solo solve" definitions, and pick one for the whole dashboard.
7. Surface `computedAt` / `lastSweepAt` so nobody reads a stale projection as live.

**Product**
8. Wire the things that already exist and were never called (§6) — that is most of the analytics
   surface for very little new code.
9. Build the drill-downs, the assessment view and the leaderboard.
10. Move every teacher string into `L` so the kk/ru completeness test covers it.

**Honest non-goals for this phase** (documented, not silently dropped)
- Storing assessment written/oral answers (H1) is a schema + privacy decision, not a dashboard one.
- Per-track analytics: `tracks` is declared on 13 blocks and read by zero lines; the track lives in
  a non-httpOnly cookie. There is no data to group by.
- A teacher mark / sign-off requires its own table — bolting a score column onto
  `post_help_explanations` would reopen the auto-grading hole migration 0016 exists to close.
