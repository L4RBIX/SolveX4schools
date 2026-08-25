# Curriculum traceability

Every requirement in the approved programme document, mapped to the artefact
that implements it. The point of this file is that a claim like "the programme
is implemented" can be checked line by line instead of taken on trust.

**Source:** `9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf` — 12 pages, Тамыз 2026.
**Machine-readable copy:** `schools/curriculum/source-of-truth.ts`.
**Validator:** `npm run curriculum:validate`.

Status vocabulary is deliberately narrow:

| Status | Meaning |
|---|---|
| **Implemented** | Exists in code and the validator checks it |
| **Structure only** | The shape exists and is validated; the learner-facing content is `draft` |
| **Not implemented** | Nothing exists yet |

---

## 1. Programme parameters (PDF p.2)

| # | Requirement | Verbatim figure | Where | Status |
|---|---|---|---|---|
| 1.1 | Audience | 9-сынып, 14–15 жас, нөлден бастайды | `PROGRAMME_FACTS.grade`, `.ageRange`, `.priorExperienceRequired` | Implemented |
| 1.2 | Duration | қыркүйектен мамырға, ~36 апта | `PROGRAMME_FACTS.weeks` | Implemented |
| 1.3 | Contact time | 2 × 45 мин/апта, 72 сабақ, ~54 сағат | `PROGRAMME_FACTS.sessionsPerWeek`, `.sessionMinutes`, `.totalSessions` | Implemented |
| 1.4 | Platform floor | кемінде ~40 мин/апта | `PROGRAMME_FACTS.platformMinutesPerWeek` (`isMinimum: true`) | Implemented |
| 1.5 | Total learning | кемінде ~78 сағат/жыл | `PROGRAMME_FACTS.totalLearningHours` | Implemented |
| 1.6 | Practice/theory split | 70% практика / 30% түсіндіру | `PROGRAMME_FACTS.practiceRatio`; **enforced** by `checkProgramme()` — the validator errors if the months' hours drift more than 6 points from 70% | Implemented |
| 1.7 | Nine year-end outcomes | see PDF | `YEAR_END_OUTCOMES_KK` (all nine, in order) | Implemented |

## 2. AI rules (PDF p.4)

These are the constraints the assistant must obey. They are recorded in
`AI_RULES_KK` and enforced in the Nova layer, not here.

| # | Rule | Enforcement point | Status |
|---|---|---|---|
| 2.1 | Help unlocks only after the learner has attempted something | `hasAttemptSince` in the Nova runtime, gated on `ATTEMPT_BLOCK_TYPES` | Implemented (see §7) |
| 2.2 | Help escalates in stages and never starts with finished code | Nova hint ladder | Pending — Nova phase |
| 2.3 | After any help: explain in own words, then re-solve unaided days later | `VerifyBlock.mode = "delayed_resolve"` / `"oral_explanation"` | Structure only |
| 2.4 | The learner always knows they are talking to a program, not a person | Nova identity rules | Pending — Nova phase |
| 2.5 | Over-reliance on help raises a flag to the teacher | Teacher console signal | Pending — teacher phase |

## 3. Data protection (PDF p.4)

| # | Commitment | Where | Status |
|---|---|---|---|
| 3.1 | Collection begins only after written parental consent | `DATA_COMMITMENTS_KK[0]` | Recorded; enforcement pending — auth phase |
| 3.2 | Minimal fields; no biometrics, no covert recording | `DATA_COMMITMENTS_KK[1]` | Recorded; enforcement pending — data model |
| 3.3 | Storage on servers inside Kazakhstan | `DATA_COMMITMENTS_KK[2]` | **Deployment constraint — not satisfiable in code.** Flagged in the final report |
| 3.4 | Consent revocable, data then deleted | `DATA_COMMITMENTS_KK[3]`; `solvex_forget_user()` exists in the imported migrations but depends on an unapplied migration `0001` | Blocked — see import baseline §5 row 9 |
| 3.5 | School can view and export its own students' results | `DATA_COMMITMENTS_KK[4]` | Pending — reporting phase |

## 4. Weekly rhythm (PDF p.5)

| # | Requirement | Where | Status |
|---|---|---|---|
| 4.1 | Lesson 1: worked example with thinking aloud, then supervised solving | `WEEK_STRUCTURE_KK[0]` | Recorded |
| 4.2 | Between lessons: ≥~40 min platform practice, learner picks the time, difficulty adapts to level | `WEEK_STRUCTURE_KK[1]`; adaptation via `TrackLevel` on blocks | Structure only |
| 4.3 | Lesson 2: mini-contest of 2–3 problems, then shared review | `WEEK_STRUCTURE_KK[2]` | Pending — contests phase |
| 4.4 | Explanation 15 min / practice 30 min inside a session | `TIME_BUDGET.session` | Implemented |
| 4.5 | Lessons are short: 5–8 min, one idea each | `Lesson.estimatedMinutes`; validator **warns** above 12 min | Implemented |

## 5. Verification (PDF p.6)

The programme is explicit that a working program is not proof of
understanding, and names five independent checks.

| # | Method | Type | Status |
|---|---|---|---|
| 5.1 | Unseen problems | `VerifyBlock.mode = "unseen_problem"` | Implemented (September) |
| 5.2 | Manual paper trace | `"manual_trace"`, plus `TraceCodeBlock` | Implemented (September) |
| 5.3 | Find the bug | `"find_bug"`, plus `FindBugBlock` | Implemented (September) |
| 5.4 | Oral explanation | `"oral_explanation"`, plus `ExplainBlock` | Implemented (September) |
| 5.5 | Delayed re-solve | `"delayed_resolve"` | Structure only — needs the scheduler |

**Enforced:** every non-draft monthly assessment must contain at least an
unseen problem *and* an oral explanation. The validator errors otherwise.

## 6. Differentiation (PDF p.6)

| Track | What changes | Where | Status |
|---|---|---|---|
| Қолдау | Core problems only; more assembling/completing given code, less writing from scratch; help unlocks earlier; extra teacher support | `TRACK_DEFINITIONS_KK.support`, `BlockBase.tracks` | Structure only |
| Негізгі | Full monthly set plus optionally 1–2 harder problems | `TRACK_DEFINITIONS_KK.core` | Structure only |
| Тереңдетілген | Faster pass through core, then a harder block; help unlocks later; written defence mandatory | `TRACK_DEFINITIONS_KK.advanced` | Structure only |

Note the deliberate modelling choice: a track is a **route through a month**,
not a label on a child. A learner can be `advanced` in loops and `support` in
binary search. See the comment on `TrackLevel`.

## 7. Months (PDF pp.7–10)

| # | Month | Topic | Promised tasks | Built | File |
|---|---|---|---|---|---|
| 1 | Қыркүйек | Reading data, computing, conditions | 36 | **36** | `months/month-01-september.ts` |
| 2 | Қазан | Loops and lists | 38 | 0 | `months/month-02-october.ts` |
| 3 | Қараша | Functions | 34 | 0 | `months/month-03-november.ts` |
| 4 | Желтоқсан | Speed, sorting, precomputation | 32 | 0 | `months/month-04-december.ts` |
| 5 | Қаңтар | Binary search, two pointers | 30 | 0 | `months/month-05-january.ts` |
| 6 | Ақпан | Exhaustive search, recursion | 30 | 0 | `months/month-06-february.ts` |
| 7 | Наурыз | Grids and paths | 26 | 0 | `months/month-07-march.ts` |
| 8 | Сәуір | Greedy and dynamic programming | 28 | 0 | `months/month-08-april.ts` |
| 9 | Мамыр | Contests and final tournament | 25 † | 0 | `months/month-09-may.ts` |

† **Derived, not quoted.** The PDF gives no task total for May; it specifies
four contests plus a final tournament. 4 × 5 + 5 = 25. This is the only figure
in the manifest that is not verbatim, and it is marked as derived in the source
comment.

All nine months carry: metadata, `mastery`, `explanation`,
`endOfMonthCapability`, `practiceOutline`, hours, units, lessons with
objectives and skill refs, and an assessment. Months 2–9 have `draft` lesson
bodies — the validator reports built counts of 0 for them and the number is not
rounded up anywhere.

**Discrepancy, stated rather than smoothed over:** the per-month figures sum to
254 for months 1–8, while p.11 summarises the year as "~250 tasks, of which
~100 fully independent" and calls that a minimum. Both numbers are the
document's. The manifest keeps both (`TASK_TARGETS`) and the validator checks
against the per-month figures.

## 8. Skills

`schools/curriculum/skills.ts` — 48 skills derived from the "Оқушы нені
меңгереді" paragraphs, each tagged with the month that introduces it and the
PDF page.

Two validator rules make the progression real rather than decorative:

1. A skill declared as introduced in month *N* **must** be taught by a lesson
   in month *N*, or the validator errors.
2. A month may not use a skill the taxonomy introduces later. That would mean
   teaching recursion before functions.

## 9. Diagnostic honesty

`DiagnosticMapping` exists so a wrong answer can name a failure class — but
only where the wrong answer *uniquely* establishes the cause. The validator
requires a written justification of at least 20 characters for every mapping
entry, and rejects a mapping on a block that is not an attempt.

Where a distractor is ambiguous, there is deliberately **no mapping**. The
pipeline then emits `unattributed_failure` and the Decision Engine answers
`DIAGNOSE` — "we do not know why, so ask". This is the mechanism that keeps the
system from telling a 14-year-old something false about their own mind.

September declares 5 mappings across 36 tasks. That ratio is intentional.

## 10. What this file does not cover

Traceability stops at the curriculum. It says nothing about auth, the lesson
runtime, Nova, Arena, the teacher console, or reporting — those are tracked in
the final implementation report, with their own honest status.
