# Content authoring contract

Everything a lesson author must satisfy, in one place. Derived from
`schools/curriculum/types.ts`, `validate.ts`, `tests/school/content-execution.test.ts`,
`tests/school/tracks.test.ts`, `tests/school/payload-privacy.test.ts` and
`schools/curriculum/capability.ts` — read those if a rule here surprises you;
they are the enforcement, this is the summary.

## Where a lesson lives

September is one 106 KB file. Months 2–9 are one **directory per month**, one
file per lesson:

```
schools/curriculum/months/m02/l1.ts    → export const M2_L1: LessonBlock[]
schools/curriculum/months/m02/...
schools/curriculum/months/m02/assessment.ts → export const M2_ASSESSMENT: LessonBlock[]
schools/curriculum/months/month-02-october.ts  imports them and assembles the Month
```

The split is not a style preference: eight months of lesson bodies are written
and reviewed independently, and a single file per month makes every review a
merge conflict. The `Month` object, its units, titles, objectives and PDF
citations stay in the month file, unchanged in shape from the stub.

## Hard rules — a violation is a failing test, not an opinion

### Identity

- **Block ids are globally unique.** `m<month>.l<lesson>.b<n>`, e.g. `m2.l3.b4`.
  Practice blocks: `m2.p1`, `m2.p2`. Assessment: `m2.as.b1`.
- A **support-only substitute** takes the id it substitutes for plus `s`:
  `m2.l5.b4s` is the scaffolded twin of `m2.l5.b4`. `tests/school/tracks.test.ts`
  asserts exactly this and will fail on any other naming.

### Provenance

- Every block declares `sourceType`.
- `"curriculum-derived"` **requires** `pdfPage`. Use it only when the programme
  names the thing — the topic, the problem family, the verification method.
  The page for each month is fixed: Oct 7 · Nov 8 · Dec 8 · Jan 9 · Feb 9 ·
  Mar 9 · Apr 10 · May 10. Assessment `verify` blocks that implement the five
  general verification methods cite page 6.
- `"product-authored"` for everything invented to serve a requirement: specific
  numbers, distractors, test cases, scaffolds. No `pdfPage`.
- Never claim curriculum provenance for something the PDF does not say. The
  point of the field is that a later reader can check.

### Skills

- Every **attempt block** needs at least one `skillRefs` entry, or its evidence
  goes nowhere and the validator errors.
- Only ids from `schools/curriculum/skills.ts`. A skill introduced in a later
  month may not be referenced by an earlier one.
- Every skill the taxonomy assigns to month N must be taught by some lesson in
  month N — the validator checks this and errors if one is orphaned.

### Language

- `kk` and `ru` on every learner-facing string, and they must **differ**
  (`content-execution.test.ts` asserts `p.kk !== p.ru` on every attempt block).
- Kazakh must be Kazakh, not Russian syntax with Kazakh words. Russian must read
  naturally. Both must describe the **same** problem: same numbers, same
  boundaries, same output tokens, same edge cases.
- **Program output is a plain string and cannot be localised.** So never make a
  program print a Kazakh or Russian word: a learner reading the other language
  would be matching glyphs instead of reasoning. Use English tokens the way
  September does — `yes` / `no`, `even` / `odd`, `many` / `few`, `ok` — and name
  the token in **both** prompts.

### Python that actually runs

`tests/school/content-execution.test.ts` executes all of this with real Python.

- Every `referenceSolution` is run against **every one of its own cases** and
  compared with the block's declared `checker` (default `{kind:"token"}`).
  It must pass all of them and must not crash.
- Every `code`, `fixedCode`, filled-in `fill_blank` template and
  `reorder_code` sequence in `correctOrder` must **compile**.
- Every `prediction.answer` must be byte-equal (after trailing trim) to what
  Python actually prints for `code` on `stdin`. If the program reads input,
  declare `stdin`. If `options` are given, `answer` must be one of them.
- Every `find_bug` must have `code` and `fixedCode` that **visibly differ**.
  Declare `symptomInput` — the fallback probe is a spread of plain numbers and
  will report "the two programs behave identically" for any bug that needs a
  list, a word, or two numbers on a line.
- `buggyLine` is 1-indexed and must be within `code`.

### Cases

- Every block with `cases` needs **at least one `hidden: true`**, or the sample
  answer passes it.
- Design cases from the problem: minimum, maximum, zero, one, single element,
  duplicates, all-equal, already-sorted, reversed, off-by-one on the boundary
  the task actually has. Add a case because it can catch something, not to
  reach a count.
- For the tasks that matter, **think about the wrong solutions**: the loop that
  misses the last element, the accumulator initialised inside the loop, the
  `<` that should be `<=`, the visited mark set too late. At least one case
  should kill each plausible mutant.
- `checker` is `token` unless the formatting **is** the exercise (a table, a
  triangle, comma-separated pairs) — then `{kind:"exact"}`. `numeric` **must**
  carry its own tolerance or the validator rejects it.

### Diagnostic mappings

`diagnosticMapping` maps a specific wrong answer to a named failure class. Only
declare one when that answer has exactly **one** possible cause. If two
different misunderstandings both produce it, leave it out — the pipeline then
emits `unattributed_failure` and the engine asks the learner instead of telling
a fourteen-year-old something false about their own mind. `justification` is
required, must be ≥20 characters, and must actually argue why this answer
proves this cause.

### Prerequisites — the construct rule

`schools/curriculum/capability.ts` computes, from the code the curriculum has
actually **shown**, which Python constructs a learner has met by any point. It
is checked by `tests/nova/construct-context.test.ts`.

Cumulative availability, by month:

| From | Available |
|---|---|
| Sept | `print` `input` `int` `float` `str` `map` `split` `+ - * / // % **` `== != < > <= >=` `and or not` `if/elif/else` assignment, multiple assignment, `abs`, `min`, `max` |
| **Oct** | `for` `range` `while` `break` `continue` list literal, `[i]` subscript, `len`, slice, `in`, `+=`, `.append`, `.split`, `.join` |
| **Nov** | `def` `return` |
| **Dec** | `sorted` `.sort` |
| Jan | (no new construct — binary search is written with what exists) |
| Feb | (no new construct — recursion is `def` + `return`) |
| Mar | (no new construct — the queue is a list with a head index) |
| Apr | (no new construct) |
| May | (no new construct — «жаңа тақырып жоқ») |

Consequences worth stating out loud:

- October may **not** use `sorted`, `reversed`, `sum`, `max(list)`, `min(list)`,
  `set`, `dict`, `enumerate`, or a comprehension. «тізімді кері аудару» is
  written with a loop, and finding the maximum is written with a loop —
  that traversal **is** the thing being taught.
- November may not use `sorted`. December is where ordering arrives.
- January may not `import bisect`. The whole month is the loop.
- March may not `from collections import deque`. Use a list plus a head index,
  which is January's two-pointer idea reused — taught, not smuggled.
- Nothing anywhere uses `class`, `try`, `lambda`, `with`, or `global` except
  November's scope lesson, where `global` is the **subject** (shown as a hazard,
  not recommended).

If a construct is genuinely needed before its month, that is a content bug.
Rewrite the task. Do not add it to `ARRIVES_LATER`.

### Differentiation

The programme (p.6) is specific and it is not about labels.

- **Қолдау / support**: *more* assembling and completing, *less* writing from
  scratch. So a `write_code` withheld from support is replaced by a
  `fill_blank`, `reorder_code`, `modify_code` or `trace_code` **on the same
  problem**, at id + `s`. Support is not a shorter month.
- **Негізгі / core**: the month's full set.
- **Тереңдетілген / advanced**: harder problems, later help, and written
  defence is compulsory — so advanced carries at least one `explain` block per
  month that core does not.

Mechanically: `tracks?: TrackLevel[]` on the block; absent means all three.
Every lesson must yield ≥1 block for **every** track — a lesson that vanishes
for a route breaks the board that links to it.

### Assessment

- Non-draft assessments **must** contain a `verify` block with
  `mode: "unseen_problem"` and one with `mode: "oral_explanation"`. The
  validator errors otherwise.
- `find_bug` and `manual_trace` modes **must** carry `code` — a "find the error"
  card with no program on screen is not a hard task, it is an impossible one.
- Fit the stated minutes. 20 minutes is one unseen problem plus a short written
  or oral piece, not four graded tasks.
- Written and oral work stays **unmeasured**. `explain` and
  `verify(oral_explanation)` settle as `unknown` and are read by a teacher.
  Never fabricate 0/1 grading for them.

### What never reaches the browser

`referenceSolution`, hidden cases, `expectedPoints`, `diagnosticMapping`
justifications and teacher notes are stripped by `schools/curriculum/public.ts`
and asserted absent from the built HTML by `tests/school/payload-privacy.test.ts`.
Author normally — but never put an answer in a `prompt`, a `body`, or a visible
sample case.

## Pedagogy — what a lesson should feel like

The loop, in order, and the learner acts constantly:

> short concept → predict → interact → trace → modify → debug → write → apply → verify

A September audit found the month leaning too hard on blank editors. Do not
repeat it. A lesson of 6–9 blocks should typically be:

- 1–2 passive (`concept`, or a `worked_example` when the reasoning matters)
- 1 `prediction` or `multiple_choice` — cheap, immediate, diagnostic
- 1 reconstruction — `trace_code`, `fill_blank`, `reorder_code`
- 1 repair — `find_bug` or `modify_code`
- 1–2 `write_code`, the last one genuinely independent

`worked_example` exists because the programme asks for «толық талданған
мысалдар»: problem → reasoning in discrete steps → code → concrete result. Use
it where a concept block would show an answer without the thinking that reaches
it. It is **not** an attempt block and does not count as a task.

## Counting

`isTask` counts `ATTEMPT_BLOCK_TYPES` only:

> prediction · multiple_choice · trace_code · reorder_code · fill_blank ·
> find_bug · modify_code · write_code · test_case · explain · arena_problem ·
> challenge · verify

`concept`, `worked_example`, `visual_simulation` and `reflection` are **not**
tasks. Never describe a paragraph as a task to reach a promised number.

## Before you return

Run your own reference solutions. From the worktree root:

```bash
python3 -I -S -c '<solution>' <<< '<case input>'
```

or check a whole file at once with the harness in
`docs/curriculum/reviews/` (see the month reports). Do not hand back content
whose Python you have not executed.

---

## What the first adversarial review actually found

Six independent reviewers went at October and November after both had passed
every automated gate. They returned 24 findings. These are the classes that
recurred, written as rules because every one of them survived `check-blocks`,
`curriculum:validate`, `content-execution` and `tracks-every-month`.

### 1. A task whose answer is already on screen

The single most common defect, in both months, in several forms:

- a `write_code` whose `referenceSolution` is byte-identical to a program the
  lesson **prints in full** a card or two earlier — in a `concept`, a
  `worked_example`, or a `find_bug`'s `fixedCode`;
- a `fill_blank` whose completed template is that same program;
- a `find_bug` that repairs a program the next `write_code` then asks for.

**The rule.** Before you finish a lesson, extract every program in it —
`code`, `fixedCode`, `referenceSolution`, filled templates, joined reorder
lines — and compare them pairwise. **Write a script; do not eyeball it.** Any
two that are byte-identical is a defect unless one is deliberately the other's
starting point in a `modify_code`, and even then the direction must be
*forwards*: the starting program is something the learner has already finished,
never something they are about to be asked for.

Extend the comparison across the whole month, not just adjacent cards. A
duplicate found across two lessons is worse, not better: `m3.l5.b5` was a
byte-for-byte copy of `m3.l3.b5` — same program, same bug, same repair — and was
counted twice toward the month's promised total.

### 2. Cases that pass the shortcut the task exists to forbid

A palindrome check that compares **only the first and last element** passed all
seven cases of `m2.p6`, because every `no` case in the set had differing
endpoints. The same shortcut passed `m3.l7.b7`. A `largest()` that stops one
element short passed all seven cases of `m3.l8.b6`, because no case put the
maximum in the final position — and «соңғы элементті өткізіп жіберу» is an error
the programme names by hand.

**The rule.** For every task, name the two or three degenerate programs a
learner could write that are *not* the intended method, then write the case that
kills each one. Specifically, and every time they apply:

| Task shape | The shortcut that must fail |
|---|---|
| palindrome | endpoints equal, middle not — `abca` → `no`, `1 2 3 2 9`-style lists |
| any maximum / minimum / search | the answer sitting at the **last** position, and at the **first** |
| "count elements with property P" | every element having P, and none having it |
| two-pointer / window | the answer being the whole list, and being a single element |
| anything with a boundary | the value exactly **on** the boundary, and one either side |

### 3. Output format stated in the prompt but not enforced by the checker

`m2.l3.b8` requires one digit per line and shows a three-line sample. The
default `token` checker splits on all whitespace, so a program printing every
digit on one line is graded **correct** against a prompt that forbids it.

**The rule.** If a prompt states a layout — one per line, a specific separator,
a table, a triangle — the block declares `checker: { kind: "exact" }`. If it does
not state a layout, do not describe one in the sample. The prompt and the checker
must agree; `token` is a promise that only the values matter.

### 4. Requirements no checker can see

November's assessment and fourteen other November tasks tell the learner the
solution **must define a function** and **must return rather than print**. Output
comparison cannot see either. A submission with no functions at all passes.

**The rule.** A structural requirement is not a graded requirement. You have
three honest options, and you must pick one deliberately:

1. **Make the output impossible without it.** Best where it works — e.g. require
   the helper to be called on several inputs whose combination cannot be produced
   another way.
2. **State it as guidance and grade the answer.** Then the prompt says "write a
   helper function" as advice, not as a rule the learner will be marked on.
3. **Send it to a human.** Pair the coding block with an `explain` that asks what
   each function takes and returns — which a teacher reads, and which is the
   programme's own «әр функцияның міндетін … түсіндіру».

What you may not do is state a rule the product will not enforce and let the
learner believe it was checked.

### 5. Assessments that do not fit their stated minutes

Both 20-minute checks carried **four graded tasks**. November's amounted to a
from-scratch three-function program plus roughly eighteen separate written or
spoken sub-answers.

**The rule.** Twenty minutes is **one** unseen problem plus **one** short written
or oral piece. Count the sub-questions inside each `explain` prompt — four
numbered questions is four answers, not one — and count them against the clock.
If the month's own «Айлық сынақ» sentence names three things, one of them is the
coding task and the other two are short. September's original check timed at 32+
minutes against a stated 20; that is the defect being avoided, not a style note.

Do not ask the same question twice: October's written block asked two of the
questions its oral block asked four cards later.

### 6. Constructs used before anything explains them

`.append()`, `.join()` and `str()` appear in reference solutions from October
onwards and are **named in no learner-facing prose in either month**. The
construct budget in `check-blocks` permits them, which is exactly why the gap
survived: a budget says what is *allowed*, not what has been *taught*.

**The rule.** The first time a construct appears in any code the learner sees or
must write, some `concept` or `worked_example` in that lesson names it and says
what it does — one sentence is enough. If you find yourself using something no
lesson has introduced, either introduce it or rewrite the solution without it.

### 7. Prompts that describe the wrong learner's screen

`m2.l1.b8s` is support-only and opens by pointing at "the previous task" — but
the previous card *on the support route* is a different problem, because the task
it names is the one support does not receive.

**The rule.** A block carrying `tracks` must read correctly for the routes that
receive it. Before referring to "the previous card", "the task above" or "the
program you just wrote", compute the sequence each of its tracks actually gets
(`publicLesson(lesson, track)`) and check the reference is true for all of them.

### 8. Kazakh and Russian grammar, in both directions

Native-speaker review found real errors in both languages: «нешеу» used
attributively where «неше» is required; «жік» (a noun) written as if it were the
imperative of «жіктеу»; «тік бұрышты үшбұрыш» split where the textbook form is
«тікбұрышты үшбұрыш»; a Russian gender-agreement slip («переменная … он»); and a
clause, «но ячейки это разные», that no native would write.

**The rule.** Neither language is a translation of the other and both are read by
children. Two specific traps this course keeps hitting: Kazakh interrogatives and
number agreement, and Russian gender agreement when a feminine technical noun
(«переменная», «функция», «строка») is referred back to. Where a Russian
restrictive clause becomes a coordinate clause in Kazakh, the Kazakh often ends
up asserting something the Russian only qualifies — check that the two sentences
still make the same claim.
