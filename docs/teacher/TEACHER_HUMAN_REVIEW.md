# Teacher human review — what a teacher may read, and what is not there

The teacher console can now open a learner's written explanation. This is the
audit of that path: what it returns, who may call it, what it structurally
cannot return, and the one thing it does not do.

---

## 1. What changed underneath

Migration `0021_submitted_artifacts.sql` added `learning_submissions.answer`:

```sql
alter table learning_submissions add column if not exists answer jsonb;
```

The column holds a `BlockAnswer` — the exact discriminated union
`schools/learning/checking.ts` already grades — written inside the same
transaction that settles the verdict. Its own comment states the rule this
whole surface leans on:

> The learner's submitted BlockAnswer, verbatim. Null for rows settled before
> 0021. **Never contains answer-key material.**

Before that migration, the teacher console said, in `TL.assessmentUnreadable`:

> «Письменные и устные ответы пока не сохраняются: прочитать их здесь нельзя.»

That sentence was true when it was written and is now false for written work.
It has been removed. What replaced it is two sentences, because written and
oral are two different facts — see §5.

---

## 2. The teacher flow

1. `/teacher` — the assessment band shows **«N работ ждут чтения учителем»** with
   a link, not a warning band. It used to be a warning because the answers were
   being thrown away; they are not, so it is work rather than a loss.
2. `/teacher/assessments` — a section headed **«Работы на проверку учителем»**,
   with the queue **«Ждут проверки — N»**.
3. Each row: learner, task, submitted time, and whether text exists. Sorted
   **oldest submission first** — see §7 for why that and nothing else.
4. Clicking the learner's name opens a side panel with the learner's name, the
   task, the prompt they read, their words verbatim, the submission time, and
   the marking criteria behind a disclosure.
5. `/teacher/students/[subjectId]` reaches the same panel from the other
   direction: a **«Читать»** control on each human-marked block of the monthly
   check, so the evidence is one click from the claim.

---

## 3. Authorization

| Actor | Target | Result | Decided by |
|---|---|---|---|
| Anonymous | any | **401** | `requireClassAccess` → `currentUser()` |
| Student | any class | **403** | `requireClassAccess`, role check before any lookup |
| Teacher A | a class they teach | **allowed** | `store.teachesClass(userId, schoolId, classId)` |
| Teacher A | a class in their school they do not teach | **404** | same — no `class_teachers` row |
| Teacher A (school A) | the **same class id** in school B | **404** | `schoolId` comes from the session, never the URL |
| Teacher A | a subject not on this class's roster | **404** | `memberBySubject(bundle, subjectId)` |
| Teacher A | a block the curriculum does not mark by hand | **absent** | `isHumanReviewable` allowlist |
| Anyone | a marking outcome (write) | **no route** | there is no POST — §6 |

**404 and never 403** for a class not taught or a subject not enrolled. 403
confirms the thing exists, which turns the endpoint into an oracle for
enumerating a school's classes and learners.

**The school predicate is structural, not a filter.** Class ids are
author-chosen and collide: `config.pilot.classId` ships as `grade-9a`, and two
schools can both use it. Every class-keyed query in `LearningStore` filters on
`class_id` *alone* — `subjectsInClass`, `isInClass`, `lastActivityForClass` —
so authorising on a class id would hand one school's children to the other.
The review path never sees a class id at all: it takes `subjectIds`, and the
only place those come from is `classRoster()`, which reads `class_enrolments`,
keyed `(school_id, class_id)` with a foreign key onto `school_classes`.

`tests/teacher/review-authorization.test.ts` runs two schools that both call
their class `9a`, with a written answer in each, and proves the separation
rather than assuming it. It also *pins the store's defect* — asserting that
`subjectsInClass("9a")` still returns both — so the roster-sourcing above is
understood as load-bearing rather than belt-and-braces.

---

## 4. What the payload cannot contain

Each of these is unreachable by construction, not filtered out.

**Nova conversations.** Not stored anywhere. `ALLOWED_PAYLOAD_KEYS` in
`packages/learning-contracts` has no key for free text, `interventions` has no
content column, and the chat lives in browser React state. There is no query
that could return one.

**Hidden tests and expected outputs.** The review module reads one column,
`learning_submissions.answer`. It never touches the curriculum's `cases`.

**Reference solutions.** Never read. The panel carries `expectedPoints` —
what a marker looks for — which `schools/curriculum/types.ts:400-403` says
exists *for* the teacher console. Criteria are the standard, not the answer,
and the panel says so beside them.

**The submit response.** `learning_submissions.response` is a sibling column
holding the reply replayed to a duplicate submission, and migration 0019 lists
what is in it: *"the curriculum's own reveal payload and the author's
justification prose"*. That **is** answer-key material. It is never selected;
a test asserts the module contains no `s.response`.

**Another learner.** `storedResponses` takes exactly one subject id, already
checked against this class's roster.

---

## 5. Written vs oral — exactly what is stored

| | Stored? | What is stored | Where |
|---|---|---|---|
| Written explanation (`explain`, e.g. `m1.as.b3`) | **yes** | the learner's full text, verbatim | `learning_submissions.answer` as `{kind:"text",value}` |
| Oral defence (`verify` / `oral_explanation`, e.g. `m1.as.b4`) | **the note only** | the short note the learner typed before speaking | same column, same shape |
| Audio of the oral defence | **no** | — | nowhere |
| Code, MCQ, fill-blank, reorder | stored, but **not readable here** | — | not on the human-review allowlist |

**There is no audio anywhere in this product.** No recorder in the renderer, no
media column in any migration, no upload route. `VerifyView` renders a card
saying the explanation is given to the teacher, plus a short text area — so the
platform holds a *note toward* an oral answer, and the defence itself happens
in the room.

That is why the label is «Заметка к устному ответу» and not «Устный ответ», and
why the copy reads:

> «Письменные ответы можно прочитать здесь.»
> «Устный ответ ученик даёт учителю на уроке — запись не ведётся. Здесь
> сохраняется только короткая заметка, которую он записал перед ответом.»

A test asserts the absence of `MediaRecorder` and `getUserMedia`, so if a
recorder ever ships, the sentence has to be rewritten in the same commit.

---

## 6. The blocker: no marking outcome can be recorded

**A teacher can read the work. Nothing can record that they have.**

No migration in `database/migrations` carries a `reviewed_at`, a reviewer, a
result, or a grade for a human-marked answer. `post_help_explanations` — the
one table that already routes work to a person, via
`status = 'teacher_reviewable'` — deliberately has **no score column at all**,
and migration 0016 argues that this is the mechanism rather than an omission:

> There is no score column. No grade, no percentage, no "quality", no boolean
> called `correct`, and no column for anything a model said about the text.
> That absence is the mechanism […] a rule that explanations are never
> auto-graded is a rule someone eventually works around; a schema with nowhere
> to write a grade is not.

So there is **no Review button, no Mark as read, and no POST route.** A control
that looked like it worked and changed nothing would be worse than its absence.
Instead the panel states where the mark actually goes:

> «Платформа не хранит оценку: здесь вы только читаете написанное учеником.
> Оценку вы ставите в школьном журнале.»

Two consequences a teacher must be told, and is:

- **«Ждут проверки — N» counts submissions, not outstanding work.** It does not
  go down when a teacher reads something, because nothing records the reading.
- Reading the same answer twice is indistinguishable from reading it once.

**What closing this properly needs** — deliberately *not* done here, because it
is a schema and pedagogy decision that has to be made on purpose by someone who
has read migration 0016, not smuggled in behind a UI pass:

1. A table — `human_review_marks` or a column set on the existing rows —
   carrying `(subject_id, block_id, reviewer_user_id, reviewed_at, outcome)`.
2. `outcome` restricted by CHECK to a closed vocabulary that is **not a score**:
   the natural pair is `reviewed` / `needs_revision`, matching the language the
   curriculum already uses. Any numeric column reopens exactly what 0016 shut.
3. A POST route with the same guard chain as the GET, plus idempotency, plus a
   decision about whether a learner sees the outcome.
4. A decision about revision: `post_help_explanations` is written once, on
   purpose, so *"a later pass cannot quietly rewrite what a teacher already
   read"*. A `needs_revision` loop conflicts with that and the conflict has to
   be resolved deliberately.

---

## 6a. The second queue, and why it is deferred rather than surfaced

There are two places human-review work could come from. Only one of them
exists in practice.

| | Queue A — assessment answers | Queue B — post-help explanations |
|---|---|---|
| Table | `learning_submissions.answer` | `post_help_explanations` where `status = 'teacher_reviewable'` |
| Written by | `/api/learning/submit` | `/api/learning/explanation` |
| Reachable from a UI? | **yes** — the assessment player | **no** — nothing calls the route |
| Rows in the pilot database | present | **zero** |
| Surfaced to teachers | yes, this document | **deferred** |

Queue B is real on paper: migration 0016 gives it a partial index whose comment
literally reads *"The teacher queue: everything with criteria to mark it
against, oldest first."* But the gate that would produce a row —
`evaluateCompletionGate` in `schools/learning/post-help.ts` — has **no
production caller**, no component posts to `/api/learning/explanation`, and
`select status, count(*) from post_help_explanations` returns nothing on the
live pilot database.

**So surfacing it today would put a permanently empty panel on a teacher's
screen** — and no test would ever fail to tell us it stayed empty, because the
fixture writes no rows either. That is the same class of untruth this
workstream just removed when «Письменные и устные ответы пока не сохраняются»
became false: a sentence that is technically defensible and misleads the person
reading it.

**What has to ship first**, and it is learner-side, not teacher-side: wire
`evaluateCompletionGate` into the lesson completion path, render the prompt,
and POST to the route that already exists. That is a change to
`src/components/brilliant/lesson/*`. Only after a term of real rows is there
anything to judge whether a teacher's screen should carry it.

**When it does ship**, four things are already settled and should not be
re-derived:

1. **Scope it by roster, never by class.** `post_help_explanations` has no
   `school_id` and no `class_id`. The population must come from
   `classRoster(sql, schoolId, classId)` → `subjectIdsOf()`, exactly like every
   other query on this surface, because class ids collide across schools.
2. **Filter on `status = 'teacher_reviewable'` and nothing looser.** Rows with
   status `submitted` belong to blocks with no `expectedPoints` — nobody asked a
   human to mark those.
3. **Label the source.** A post-help explanation is a reflection written *after*
   Nova supplied the reasoning at hint level 3+. An assessment answer is the
   learner's answer to the task. Rendering both under one heading would
   misrepresent what the child wrote.
4. **Add it to the seeder's purge list.** `scripts/seed-teacher-demo.ts` does
   not clear `post_help_explanations`, so re-seeding would strand explanations
   against rebuilt episodes.

---

## 7. Design decisions worth defending

**Oldest first, and no other order.** A teacher with twenty minutes should reach
the learner who has waited longest. Sorting by name is arbitrary; sorting by how
much the system thinks a learner is struggling would be the console deciding
whose writing matters more — which is the judgement this screen exists to hand
back to a person.

**The queue carries no prose.** It ships names, tasks and timestamps. The text
is fetched when a teacher opens one row, so rendering a list of twenty names
does not send twenty children's writing to a screen showing none of it — and
"whose work was read" stays a question a request log can answer.

**A submission with no stored text stays in the queue.** Marked unreadable, not
dropped. The learner did the work; the platform lost the words. Dropping the row
would blame the child for the platform's gap.

**Three kinds of nothing, told apart.** *Never submitted*, *submitted before
answers were kept*, and *submitted with an empty box* lead a teacher to three
different conversations with the same child. The panel names which one.

**`unreadableResponses` → `humanMarkedAnswers`.** Same formula, no change to
what is counted (`human && reached !== "none"`). The old name described a loss;
the number always measured the amount of marking a class had produced. The
queue is derived from a *different* table, so the two numbers can differ, and
that difference is exactly the pre-0021 residue — reported as
`ReviewQueue.unreadable` rather than smoothed away.

---

## 8. Files

| File | Role |
|---|---|
| `schools/teacher/review.ts` | the only module that reads `answer`. Allowlist, queue, one learner's responses |
| `schools/teacher/build-assessment.ts` | builds `ReviewQueue` and `StudentReview` from it |
| `schools/teacher/contracts.ts` | `ReviewItem`, `ReviewQueue`, `StudentReview`, `ReviewResponse`, `ResponseForm` |
| `src/app/api/teacher/class/[classId]/review/[subjectId]/route.ts` | the guarded GET. No POST |
| `src/components/teacher/review-panel.tsx` | the panel, shared by the queue and the student page |
| `src/components/teacher/assessments.tsx` | the queue section |
| `tests/teacher/review-authorization.test.ts` | the gate: 22 assertions over the table in §3 |
| `tests/school/artifact-authorization.test.ts` | the persistence workstream's audit, updated to name the one permitted path |

---

## 9. What a screenshot-only reviewer found, and what changed

The brief asks for a reviewer with no implementation context, given the
screenshots and nothing else. They answered all six questions, but the useful
part was the list of things that read as broken. Nine were real.

| Finding, quoted | Verdict | Change |
|---|---|---|
| «Ждут проверки — 2» over a table with three rows | **Real bug.** The heading counted only the readable subset | Heading counts the rows; the note beside it says one has no stored text |
| «Ждёт проверки человеком 0» in the same block as three works waiting for a human | **Real.** A completion *state* and a marking *queue* shared one sentence | State renamed «Осталось учителю». The distribution counts learners; the queue counts answers |
| «Материал ещё не открыт ученикам» above «Открыта — ученики могут проходить» | **Real, and self-inflicted.** The P1 copy rewrite conflated approval with openness | Chip states approval only («Материал не утверждён»); openness is its own chip, driven by `open` |
| «1 Проверка самостоятельности» / «2 Проверка самостоятельности» — "I cannot tell a student what they failed" | **Real.** Three `verify` blocks all rendered by block *type* | Named by `VerifyBlock.mode`, the programme's own five checks |
| 19 «Не начал» rows above the only two learners with work | **Real.** Sorted least-done-first | Sorted engagement-first. The count of non-starters is already exact in the distribution above |
| «пары «ученик — урок»» | **Real.** "Nobody in a school says this" | «Считается по каждому ученику отдельно: 21 ученик × 12 уроков этого месяца» |
| «2 → 18», «88 → 1862 +1774 мин» — "I don't know what the arrows mean" | **Real.** The explanation was hover-only | Visible caption: «Прошлый период → этот период» |
| «Требуют внимания 10» over five rows | **Real** hesitation, not a bug | Heading carries the count: «Требуют внимания — 10» |
| «Завершили 0/5» for a class of 21 | **Real.** An unexplained denominator | «Завершили из начавших» |
| Every surname decoded: «Сая **Тексеріс**» (inspection), «Айсұлу **Ақау**» (defect), «Мұрат **Тұйық**» (dead end — and he is the stuck one), «Жанель **Шекара**» (boundary — and she fails a boundary condition) | **Real, and the most damaging.** "Not a class list, a test harness with Kazakh surnames pasted on" | All nineteen renamed to ordinary Kazakh names. The behaviour each profile encodes stays in `key` and `expectation` |

Three findings were **correct readings of things that are true**, and stay:

- **«Текст не сохранён» — "a child wrote something and it's gone."** Exactly
  right, and it is the pre-0021 residue described in §7. There is no recovery
  path because there is nothing to recover. Shrinks with every new submission
  and never reaches zero for a class that sat the check early.
- **«Самые слабые навыки» ranks a skill with one attempt.** The sort is
  `needs_review × 2 + learning` over skills with `attemptedBy > 0`, so a barely
  attempted skill can outrank a well-evidenced one. Not changed — that is an
  analytics formula and the brief freezes them. Every such row already says
  «Недостаточно данных для вывода». Listed as an open gap.
- **«Проверка границы — Завершили 0/1» as a "hardest lesson".** A ranking over
  one learner. Same reasoning; the denominator is now named.

Two were environment, not product: the floating **«N»** is the Next.js
dev-tools indicator (absent from a production build), and **«Проверка за
сентябрь» read in August** with midnight submission times is the demo seeder
translating a fixed fixture calendar onto today's date.
