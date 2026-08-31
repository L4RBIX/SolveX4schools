# Runtime gaps the months 2–9 content ran into

Things the approved programme requires that the product does not yet do. None of
them is fixed here — they belong to the lesson-runtime and Nova workstreams —
and none of them is silently worked around either. Each entry says what the PDF
demands, what the runtime does today, what the content does about it in the
meantime, and what would close it.

---

## 1. Eight of the nine visualisers are placeholders

**Severity: release blocker for January, and a stated shortfall for October,
December, February, March and April.**

### What the programme requires

| Month | Quote (PDF) | Visualiser |
|---|---|---|
| Oct p.7 | «**Бөлек тренажер** индекстерді көзге көрінетін етеді» | an index trainer |
| Dec p.8 | «Платформа баяу және жылдам шешімді үлкен деректерде **қатар іске қосып**, айырманы оқушыға көзбен көрсетеді» | two solutions racing |
| Jan p.9 | «**Міндетті визуалды анимация**: оқушы іздеу шекараларының қалай жақындағанын көріп, келесі қадамды алдын ала болжайды» | binary-search boundaries |
| Feb p.9 | «Айдың орталық құралы - **шақырулар ағашы**» | recursion tree |
| Mar p.9 | «Платформада **толқын түрінде боялатын анимация** көрсетіледі» | BFS wave |
| Apr p.10 | «Екінші тәсіл **қадамдап толтырылатын кесте** арқылы беріледі» | DP table |

January's is the strongest wording in the whole document: **міндетті**,
mandatory.

### What the runtime does

`VisualSimulationBlock.simulation` accepts nine values. `SimulationView` in
`src/components/brilliant/lesson/blocks/index.tsx` renders exactly one of them —
`step_execution` — and shows an honest dashed "visualiser not ready" card for the
other eight. That card is the right behaviour and its own source comment says
why: *"an animation that only looks like a loop trace would cost more trust than
the admission does."* It is not a bug.

The one that is built is also narrower than its name. `buildStepProgram` reads
`{ total, groups }` and produces the four-line integer-division story September
needs. Handed any other config it returns `null`, and the caller falls back to
the same placeholder — so `simulation: "step_execution"` with a loop config does
**not** yield a loop trace.

### What the content does about it

It does not depend on the animation for the teaching to work.

The `trace_code` block **is** implemented and interactive: it shows the program,
gives the learner a grid of one row per executed line, and asks them to fill in
each variable's value. That is, almost word for word, what October's paragraph
asks for — «әр қадамда цикл айнымалысының, индекстің және тізім элементтерінің
мәні көрсетіледі» — with the learner doing the work instead of watching. So every
month whose visualiser is missing carries `trace_code` blocks that cover the same
ground, and the `visual_simulation` block sits beside them as the additive thing
it will become.

This is a real reduction, and it is not pretended otherwise: predicting the next
frame of an animation and filling a table by hand are not the same exercise, and
January's «оқушы келесі қадамды алдын ала болжайды» is specifically the first
one. Each affected month report records it.

### What would close it

Six visualisers, in the order the year needs them: `loop_trace` (October),
`binary_search` (January — the mandatory one), `recursion_tree` (February),
`bfs_wave` (March), `dp_table` (April), and a two-solution comparison for
December, which has no enum value yet and would need one. All six are UI work
against the existing `StepProgram`-style data contract: the trace stays a
finished list of states built server-side, the component picks one out by index.
That contract is the good part of what exists and should not be redesigned.

---

## 2. `arena_problem` renders as a bare prompt

**Severity: blocks May's contest format.**

`ArenaProblemBlock` carries `{ problemId, prompt }`, and the renderer's case for
it is one line: it prints the prompt. There is no lookup of `problemId` against
anything, no statement, no editor, no submission. It is in
`ATTEMPT_BLOCK_TYPES`, so it counts as a task and produces evidence — for a card
a learner cannot act on.

May is «төрт 45 минуттық жаттығу жарысы… бес бейтаныс есептен тұратын қорытынды
турнир» — four practice contests and a five-problem final. That is the block type
those problems would naturally use.

**What the content does:** May's contest problems are authored as `challenge`
and `verify` blocks, which render through the working `CodeTaskView` and
`VerifyView`, with the contest structure carried by the units and the assessment
rather than by an unimplemented block type. No `arena_problem` block is authored
anywhere in months 2–9. The type stays in the taxonomy for whoever builds the
arena.

**What would close it:** a problem registry `problemId` resolves against, and a
renderer that mounts the same code-task surface `write_code` already uses.

---

## 3. There is no timing signal, so December cannot measure what it teaches

**Severity: December teaches the idea without the instrument.**

December's whole subject is «дұрыс жауап тым кеш шықса, қабылданбайды» — a
correct answer that arrives too late is rejected. The content model has no way to
say it. `WriteCodeBlock` has `cases` and a `checker`; there is no field for a
time limit, no per-case size, and the judge reports pass/fail rather than
duration. `schools/exec/limits.ts` exists and belongs to the execution
workstream, which is mid-flight.

**What the content does:** December's tasks make the cost *visible in the
statement and in the reasoning* rather than in a verdict — constraints are
stated in the prompt («n 200000-ге дейін»), the two-solution comparison is
carried by `multiple_choice` and `explain` blocks that ask which solution
finishes and why, and «үлгермейтін мысал ойлап тап» is a `test_case` block where
naming the input that would time out is the answer. A learner reasons about time
correctly and is never marked wrong by a clock that does not exist.

**What would close it:** an optional per-block time limit that the execution
provider enforces and reports, plus a verdict the runtime can distinguish from a
wrong answer. Content would then declare limits; it must not care which provider
enforces them.

---

## 4. `explain` and oral work settle as unmeasured, by design — and nothing reads them yet

**Severity: not a defect. Recorded so it is not mistaken for one.**

`explain` and `verify(oral_explanation)` are deliberately never machine-scored;
`expectedPoints` exist for a human marker. The teacher console shows the
criteria. What does not exist is a place for a teacher to *record* a judgement
against them, so the written half of every monthly check — which the programme
requires in all nine months, and which is the whole of the advanced track's
«шешімді жазбаша қорғау міндетті» — currently accumulates as `unknown`.

**What the content does:** exactly what it should. Nothing here fabricates a 0/1
score for an explanation. Every month's report states how many of its blocks are
unmeasured and why, so the figure is visible rather than buried.

**What would close it:** a marking surface in the teacher console. Out of scope
here and named in `docs/curriculum/FULL_YEAR_CONTENT_AUDIT.md` as work a pilot
needs before it can report on the programme's own year-end outcomes 5 and 9.
