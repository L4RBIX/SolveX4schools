# Human review — the 48 blocks, and what a teacher can actually do

`checkBlock` returns `unknown` and the block carries `expectedPoints`. That proves the machine will not settle it. It does **not** prove a teacher can.

Tracing the real product workflow for each of the 48 changes the answer completely.

## The finding

| Category | Count |
|---|---|
| **A** `ASYNC_TEACHER_REVIEW_REQUIRED` | **0** |
| **B** `ASSESSMENT_REVIEW_REQUIRED` | **0** |
| **C** `ORAL_IN_CLASS` | **15** |
| **D** `HUMAN_REVIEW_OPTIONAL` | **0** |
| **E** `CURRENTLY_UNSUPPORTED` | **33** |

**Nothing is an async dashboard grading job, because the product has no way to be one.**

## Why every `explain` block is E

Traced end to end for a learner typing prose into an `explain` block:

| Step | What happens |
|---|---|
| `check()` | calls `onSubmit` for every attempt block, no branch on type |
| `/api/learning/submit` | `codeBlock` is null (`route.ts:278` admits `write_code`, `modify_code`, `challenge`, and `verify` with cases). `answer.value` is read **only** inside `if (codeBlock && …)`. The prose is never touched again. |
| `checkBlock` | returns `{ verdict: "unknown" }` unconditionally for `explain` |
| verdict event | `toLearningVerdictName("unknown")` → `null` → **no `verdict_received` emitted** |
| `learning_submissions` | columns are `subject_id, submission_id, block_id, episode_id`. **No answer column.** |
| event payload | `ALLOWED_PAYLOAD_KEYS` has `content_len` and `contains_code` — metadata about the prose, never the prose |
| teacher API | `/api/teacher/class/[classId]` returns `buildClassroomView` over `LearnerState` — aggregate signals, no per-block responses |
| progression | `unknown` → level `answered` → meets `attemptFloor: "attempted"` → **the lesson completes without any review** |

**The learner's written explanation is discarded at the moment they submit it.** It is not stored, so no dashboard can show it, so no teacher can mark it against the `expectedPoints` the author wrote.

There is a `post_help_explanations` table that *does* store `response` text — but that is the independence check after Nova gives a code-bearing hint, gated on `requiresPostHelpExplanation(assistance)`. It is not wired to `explain` blocks, and nothing in this worktree calls `/api/learning/explanation` from the client.

So 33 blocks carry marking points nobody can ever use. The curriculum expects human evaluation; the production workflow cannot perform it. That is category E exactly.

## Why the other 15 are C, and fine

`verify:oral_explanation` (11) and `verify:manual_trace` (4) intend a **live** interaction. The learner speaks to the teacher, or shows a trace written on paper. Nothing needs persisting because the evidence was never text in a database — and both settle `unknown` for exactly that reason: *"an oral explanation settles `unknown` because nothing measured it, not because nobody tried."*

These are correctly supported. They are also not a dashboard job and must not be counted as one.

## Per-block

| Month | Block | Where | Type | Learner submits | Persisted? | Dashboard can read? | Teacher can record? | Progression waits? | Completion waits? | Cat | Sec/learner |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `m1.l6.b4` | m1.l6 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 1 | `m1.l8.b3` | m1.l8 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 1 | `m1.as.b3` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 1 | `m1.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 2 | `m2.l2.b8` | m2.l2 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 2 | `m2.l8.b9` | m2.l8 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 2 | `m2.as.b1` | check | verify:manual_trace | a trace on paper | n/a — live | n/a | in person | no | no | **C** | 60–120 |
| 2 | `m2.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 3 | `m3.l5.b9` | m3.l5 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 3 | `m3.l6.b8` | m3.l6 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 3 | `m3.l7.b8` | m3.l7 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 3 | `m3.as.b2` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 3 | `m3.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 4 | `m4.l2.b8` | m4.l2 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 4 | `m4.l6.b9` | m4.l6 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 4 | `m4.as.b2` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 4 | `m4.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 5 | `m5.l7.b9` | m5.l7 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 5 | `m5.l5.b9` | m5.l5 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 5 | `m5.as.b3` | check | verify:manual_trace | a trace on paper | n/a — live | n/a | in person | no | no | **C** | 60–120 |
| 5 | `m5.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 6 | `m6.l3.b10` | m6.l3 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 6 | `m6.l4.b10` | m6.l4 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 6 | `m6.l6.b9` | m6.l6 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 6 | `m6.l5.b9` | m6.l5 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 6 | `m6.as.b2` | check | verify:manual_trace | a trace on paper | n/a — live | n/a | in person | no | no | **C** | 60–120 |
| 6 | `m6.as.b3` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 6 | `m6.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 7 | `m7.l1.b11` | m7.l1 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 7 | `m7.l5.b10` | m7.l5 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 7 | `m7.l3.b10` | m7.l3 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 7 | `m7.l4.b10` | m7.l4 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 7 | `m7.as.b2` | check | verify:manual_trace | a trace on paper | n/a — live | n/a | in person | no | no | **C** | 60–120 |
| 7 | `m7.as.b3` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 7 | `m7.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 8 | `m8.l1.b10` | m8.l1 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 8 | `m8.l2.b10` | m8.l2 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 8 | `m8.l4.b11` | m8.l4 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 8 | `m8.as.b1` | check | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 8 | `m8.as.b4` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 9 | `m9.l1.b5` | m9.l1 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 9 | `m9.l2.b8` | m9.l2 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 9 | `m9.l3.b5` | m9.l3 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 9 | `m9.l4.b4` | m9.l4 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 9 | `m9.l4.b5` | m9.l4 | explain | typed prose | no — discarded | no | no | no | no | **E** | — |
| 9 | `m9.l4.b7` | m9.l4 | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 9 | `m9.as.b6` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |
| 9 | `m9.as.b7` | check | verify:oral_explanation | speech | n/a — live | n/a | in person | no | no | **C** | 30–120 |

## The workload, core route

Because A, B and D are empty, there is no asynchronous grading queue at all.

| | Per learner / month |
|---|---|
| Asynchronous reviews | **0** — impossible, not zero by design |
| Oral / live interactions | **1 to 3**, mean 1.7 |
| Assessment reviews | **1 to 2**, all of them live, inside the 20-minute check |

Fourteen of a learner's fifteen live interactions across the year happen **inside a monthly check** the teacher is already sitting through. One is a lesson block, `m9.l4.b7`, May's oral defence.

### A class of 18

| | |
|---|---|
| Live interactions per month | **30** |
| Live interactions per year | **270** |

| Seconds each | Minutes / month | Hours / year |
|---|---|---|
| 30s | **15** | 2.3 |
| 60s | **30** | 4.5 |
| 120s | **60** | 9.0 |
| 300s | **150** | 22.5 |

## The critical product question

> Would a normal teacher realistically operate this course for one class without the platform becoming a grading burden?

**Yes — but not for the reason the curriculum intends.**

At a plausible 60 seconds per oral exchange, one class costs a teacher **30 minutes a month**. That is not a burden; it is less than one lesson period, and almost all of it happens during a monthly check the teacher is already running.

The reason it is that cheap is that **the written half of the assessment model does not exist in the product.** 33 blocks ask a fourteen-year-old to write out why their solution is correct, and the answer is thrown away. The workload is low because a third of the human evaluation the curriculum designed is silently not happening.

If those 33 were supported — persisted, listed, markable — the load would change completely: 17 written responses per learner per month on core, 306 for a class of 18, at 2 minutes each **10 hours a month**. *That* would be a burden, and it is the load the curriculum currently implies without delivering.

So the honest answer is two answers:

- **As shipped:** comfortably operable. 30 minutes a month.
- **As designed:** not operable as universal marking. 10 hours a month for one class is more than the teaching.

## What could change, if the written channel is ever built

Not recommendations to apply now — the shapes available, so the decision is made deliberately.

| Option | Applies to | What it costs |
|---|---|---|
| **Deterministic** | The narrowest `explain` blocks — those whose `expectedPoints` are effectively a single required token, e.g. naming which line is at fault. A few could become `multiple_choice` with the misconceptions as distractors. | Loses the learner's own words, which is the point of several of them. |
| **Rubric-assisted** | Most of the 33. `expectedPoints` already *is* a rubric — 2 to 4 marking points per block, authored. A teacher view that shows the response beside its points is the smallest thing that makes them markable at all. | Build cost, no curriculum change. This is the obvious first move. |
| **Sampled** | Lesson `explain` blocks (27 of the 33). Mark a rotating third of the class each month rather than everyone. | Evidence becomes statistical; a specific learner may go months unread. |
| **Oral only** | Convert lesson `explain` to `oral_explanation`. | Moves load into class time — the 15 live interactions become ~50, which is 25 minutes a month more at 30s. Cheap, and it matches p.6. |
| **Removed from required progression** | Already true. Progression does not wait for any of them today. | Nothing to do — but it should be stated rather than left as an accident of `unknown` meeting `attemptFloor`. |

The cheapest honest fix is **rubric-assisted**: persist the response, show it beside its authored marking points, let the teacher record a judgement. Nothing about the curriculum changes; 33 blocks stop being decorative.

## The bank semantic, stated separately

Optional bank work **may produce valid independent evidence, and should not be zeroed out for being optional.** A learner who solves a bank problem unaided demonstrated exactly what the skill model measures. The verdict is a real server verdict about a real program.

What downstream analytics must distinguish is two different things that are currently one:

| | |
|---|---|
| **Independent evidence** | The learner solved it without assistance. True of bank work. Keep it. |
| **Required curriculum evidence** | The programme asked every learner to do it, so its absence is a gap. Not true of bank work. |

Today `independenceWeight` and skill credit see only the first, and no consumer can tell them apart — so a learner who does only optional work shows the same unaided-solve profile as one who did the required path. The fix is a distinction in reporting, **not** a suppression of the evidence.

## Leaderboard

This worktree contains no leaderboard. Any leaderboard shipped by another workstream must be rechecked against the bank distinction above before release: a ranking built on unaided solves would, today, rank optional work identically to required work.
