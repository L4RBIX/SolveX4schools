# September — Forensic Content Audit

**Scope:** every September learning object in SolveX4Schools, audited against
`9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf` (12 pp., Тамыз 2026).
**Method:** the PDF read in full as source of truth; all 46 September blocks
extracted programmatically from `MONTH_01_SEPTEMBER`; every Python artefact
executed against real CPython; the grading, rendering, hint and progress paths
read end to end; 13 specialist auditors run in parallel with adversarial
verification of each finding.
**Rule applied throughout:** where the repository and the PDF disagree, the PDF wins.

---

# 1. EXECUTIVE VERDICT

# SEPTEMBER NOT READY

Not "ready after blocking fixes". **Not ready.**

Three things are true at once, and the third is why the verdict is not the milder one.

**One.** The written content is good. Of 36 tasks, 21 are pedagogically sound and
technically correct; the elif short-circuit prediction, the `>` vs `>=` bug hunt,
the quadrant problem and the boundary lesson are genuinely well-made. I executed
every reference solution against every declared case — 84 runs — and exactly one
came back wrong. That is a low defect rate for hand-authored curriculum.

**Two.** That one wrong case is a release blocker, and it has three siblings.
`m1.l8.b1` stores a hidden expected answer of `1` where the correct answer — and
its own reference solution's output — is `7`, so every learner who solves it
correctly is told they failed. `m1.p2` demands `abs()` on a hidden negative case,
a builtin September never teaches, so the only solution the month's material
supports is marked wrong. Two of the four monthly-assessment blocks cannot be
performed at all: one asks the learner to fix a bug in a program that is never
rendered, the other renders no input control and permanently disables the Check
button on the final block.

**Three, and decisive.** The month cannot be delivered as a month. The monthly
assessment — the PDF's central independence check — links to `/assessment/1`, a
route that does not exist; it is a 404. Even reachable, `verify` blocks are
excluded from the judge, so it would record nothing. Every reference solution and
every hidden test case ships inside the lesson page HTML, so "N more hidden
tests — copying the example isn't enough" is false. `assistance_delivered` is
emitted by no code path, so a hint-assisted solve is recorded as fully
independent, which makes the programme's ~100-independent-solutions metric and
the teacher's help-overuse flag both meaningless. And the three differentiation
levels the school was sold — Қолдау / Негізгі / Тереңдетілген — are declared on
five blocks and **read by zero lines of code**.

The gap is not between good content and bad content. It is between authored
content and delivered content. September has been written; it has not been wired.

**What passes every gate today:** `npm run lint`, `npm run typecheck`,
`npm run build`, 294 tests, and `npm run curriculum:validate` ("No errors").
Every defect above survives all five. Nothing in the repository ever executes a
reference solution against its own test cases, which is why a wrong answer key
has been sitting in a green build.

---

# 2. BASELINE

| Item | Value |
|---|---|
| Branch | `master` |
| SHA at audit start | `59bf26ba68aefb5ae2a550bc46d5affbd5d83c44` |
| Dirty at start | 3 files (`schools/presentation/labels.ts`, `src/components/brilliant/lesson/school-lesson.tsx`, untracked `src/components/nova/nova-chat.tsx`) |
| `npm run typecheck` | **pass**, 0 errors |
| `npx eslint` | **pass**, 0 problems |
| `npm run build` | **pass** |
| `npm run test` (vitest) | **pass** — 21 files, 294 tests |
| `npm run curriculum:validate` | **pass** — "No errors". September: 36 promised / 36 built / **0 validated** / **0 published** |

**Concurrent modification during the audit.** Between 15:44 and 16:15 a separate
process modified 25 files in this worktree — component, Nova, store and route
files — including a staged deletion (`git rm`) of `you-evidence.tsx`. This was
not my auditors; it is coherent feature work from another session. It matters for
two reasons, and I checked both:

- `schools/curriculum/` is **byte-identical to the baseline SHA**. Every content
  finding in this report is against unmodified content.
- Seven files I audited did change (`school-lesson.tsx`, `blocks/index.tsx`,
  `blocks/primitives.tsx`, `labels.ts`, `learning-store.ts`, `month-board.tsx`,
  `api/nova/hint/route.ts`). I re-verified every runtime finding against the live
  worktree afterwards: the missing `/assessment` route, the absent `code` field on
  `VerifyBlock`, `verify` excluded from the judge, `tracks` read nowhere, and
  reveal-on-first-wrong all still hold.

I changed nothing. The only files I added are the three under `docs/audits/`.

---

# 3. SEPTEMBER INVENTORY

Counted by walking the exported object, not by reading comments.

| Category | N |
|---|---|
| Content blocks | **46** |
| Lessons | 9, in 5 units |
| Attempt blocks — what the product calls "tasks" | **36** |
| Non-attempt (8 concept, 1 visual_simulation, 1 reflection) | 10 |
| — write_code | 16 |
| — verify (the assessment) | 4 |
| — prediction | 3 |
| — find_bug | 2 |
| — test_case | 2 |
| — explain | 2 |
| — challenge | 2 |
| — fill_blank / reorder_code / trace_code / multiple_choice / modify_code | 1 each |
| Graded by running code (needs a judge) | 19 |
| Auto-graded in-process | 9 |
| **Never machine-graded — always `unknown`** | 8 (2 explain, 4 verify, 2 test_case unless the answer matches one literal) |
| Genuinely independent code writing | 22 of 36 (61%) |
| Assembly / completion scaffolding | **3 of 36** |

**Is "36 tasks" honest?** Half. The 36 is real — 36 blocks do carry
`ATTEMPT_BLOCK_TYPES`. But the PDF counts "шамамен 36 тапсырма" under **Практика**
and describes the **Айлық сынақ** as a separate thing. The implementation reaches
36 only by folding the 4 assessment blocks in: 32 practice + 4 assessment. And
those 4 are unreachable. The honest figure is **32 practice tasks**, of which 30
are reachable and gradable in a correctly configured deployment.

The student-facing gameboard prints `month.expectedTaskCount` — the *promise* —
not the built count. `monthTaskCount()` exists, computes the truth, and is never called.

---

# 4. CURRICULUM COVERAGE

Full matrix in [`SEPTEMBER_REQUIREMENT_MATRIX.md`](./SEPTEMBER_REQUIREMENT_MATRIX.md).
Headline results:

**Mastery requirements: 10 PASS, 2 WARN, 4 FAIL.**

The four failures are exact, not impressionistic:

- **Reading text.** The PDF says «Сан мен **мәтінді** оқу». The only `input()`
  in September not immediately wrapped in `int()` is `m1.l1.b4` — where the
  string is the *bug the learner must remove*. A learner finishes September
  having been taught that text input is a mistake.
- **Integer vs fractional.** The `/` operator appears **zero times** in the
  month. No float is ever seen, produced or discussed. The word «бөлшек» occurs
  three times: in a skill *name*, in one clause of the `//` concept, and in the
  month's `mastery` metadata — which is a claim shown on the programme page.
- **`not`.** Shown once inside a concept code sample; used once more as part of
  a **wrong** answer (`m1.l6.b2` option o4). Never required by a correct answer.
- **Beginner-mistakes block + error dictionary.** The PDF mandates a separate
  block analysing type confusion, unexpected division results and mis-written
  boundaries, and says the learner starts their own error dictionary. Boundary
  is covered. The other two are not, and no error-dictionary mechanism exists
  anywhere in the repository.

**Practice list: 12 present, 3 partial, 3 missing.**

Missing outright: **product of numbers**, **purchase price with discount**, and
**sign as a learner task** (it exists only as a worked example the learner reads).
Partial: seconds→**hours** is implemented as seconds→minutes; **choosing a
discount level** is present only as a structurally identical grade-band task with
no percentage arithmetic; **fixing someone else's program** has one working
instance and one broken one.

The two discount items are the only place in the PDF's September list where
percentages arise, and percentages are where integer-vs-fractional would have been
taught. Dropping them is *why* requirement 5 has nowhere to live. These are one
defect, not three.

---

# 5. ALL TASK VERDICTS

One row per attempt block. No sampling. "Verified by execution" means I ran it.

| Task | Lesson | Type | Tracks | Verdict | Verified by execution | Defect |
|---|---|---|---|---|---|---|
| `m1.l1.b2` | m1.l1 | `prediction` | all | **PASS** | `print("2 + 2")` → `2 + 2` verified by execution. One correct option; `4` is a clean misconception distractor. | Correct option painted green on first wrong answer, then free retry. |
| `m1.l1.b4` | m1.l1 | `find_bug` | all | **PASS WITH MINOR ISSUE** | Symptom real: input 5 → `55` executed. buggyLine 1 is the true defect. | Attribution for line 2 is unfair — fixing line 2 (`print(int(n)*2)`) is also a valid repair, yet it is recorded as `string_vs_number_confusion`. |
| `m1.l1.b5` | m1.l1 | `write_code` | all | **PASS** | All 4 cases pass the reference solution (5→25, 0→0, -3→9, 1000→1000000). | Reference solution ships in the page HTML. |
| `m1.l2.b2` | m1.l2 | `fill_blank` | all | **NEEDS REVISION** | Filled template runs: `1 2 3` → `6`. | Grades the learner on typing `map` — a word that appears in NO prose anywhere in September. No `alternatives` declared. Both answers revealed verbatim on first mistake. |
| `m1.l2.b3` | m1.l2 | `write_code` | all | **PASS** | All 3 cases pass (3 4→`12 14`, 1 1→`1 4`, 10 7→`70 34`). | Requires `print(a, b)` (two values, one line), which no concept block ever demonstrates. |
| `m1.l2.b4` | m1.l2 | `test_case` | all | **NEEDS REVISION** | `5 0` → ZeroDivisionError, confirmed. | Asks for input where the program 'works incorrectly'; the answer crashes instead. Requires `//` one lesson before `//` is taught (m1.l3.b1) and ZeroDivisionError which is never taught. Unlike `m1.l7.b2`, the single key here is **not** exhaustive: any `b == 0` breaks it, plus non-integer and wrong-arity input. A learner answering `1 0` — correct — settles `unknown` and produces no evidence. |
| `m1.l3.b3` | m1.l3 | `prediction` | all | **PASS** | `7 % 2` → `1` executed. Distractor `3` = `7 // 2`, a textbook misconception. | `3.5` is a weak distractor (`/` never appears in September). |
| `m1.l3.b4` | m1.l3 | `write_code` | all | **PASS WITH MINOR ISSUE** | All 4 cases pass (125→`2 5`, 60→`1 0`, 59→`0 59`, 3600→`60 0`). | PDF names seconds→HOURS and minutes; implemented as seconds→minutes and seconds — one `//`+`%` application instead of the nested pair the PDF's task requires. |
| `m1.l3.b5` | m1.l3 | `write_code` | all | **NEEDS REVISION** | All 4 cases pass, including -3→`odd` (Python `-3 % 2 == 1`). | PREREQUISITE VIOLATION: requires `if`/`else`/`==`/indentation while sitting in Unit 2 (Арифметика) — one full lesson before Unit 3 introduces conditions at m1.l4.b1. |
| `m1.l4.b2` | m1.l4 | `trace_code` | all | **PASS WITH MINOR ISSUE** | Steps match real execution for n=5. | The step list prints the executed line numbers (1,2,4,7), which reveals that the `if` branch was taken before the learner traces anything. Line 3 — the comparison itself — is skipped. |
| `m1.l4.b3` | m1.l4 | `reorder_code` | all | **NEEDS REVISION** | Reassembled in `correctOrder` it runs: 150→`көп`, 5→`аз`. | Russian prompt contains untranslated Kazakh «көп»/«аз», and the code lines are Kazakh, so a Russian-track learner can solve it by glyph-matching. Only one order accepted. |
| `m1.l4.b4` | m1.l4 | `write_code` | all | **PASS** | All 4 cases pass (3 7→7, 9 2→9, 4 4→4, -5 -9→-5). Ties handled per the statement. | — |
| `m1.l5.b2` | m1.l5 | `prediction` | all | **PASS** | n=10 → `A` executed. `B` and `A B` are precise elif-short-circuit misconceptions — the best distractor set in the month. | — |
| `m1.l5.b3` | m1.l5 | `write_code` | all | **NEEDS REVISION** | All 6 cases pass the reference solution. | CHECKER GAP: no case yields output `3`. A student who deletes the entire `elif b >= 50: print(3)` branch passes all 6 cases (verified by execution). The 50–69 band — one of three thresholds in the month's flagship elif task — is untested. |
| `m1.l5.b4` | m1.l5 | `find_bug` | all | **PASS WITH MINOR ISSUE** | Symptom real: 85 → `4` executed; buggyLine 2 correct. The month's best boundary task. | `diagnosticMapping` is keyed `"2"` — the CORRECT line — and `checking.ts` only calls `attribute()` on a wrong answer, so the mapping is unreachable dead code. |
| `m1.l6.b2` | m1.l6 | `multiple_choice` | all | **PASS WITH MINOR ISSUE** | One correct option (o1). o2 (`or`) is always true; o3 excludes the bounds — both are good misconception distractors. | o4 (`10 <= x <= 20 and not x`) is false for every integer — a dead distractor, and the only place chained comparison and truthiness appear, neither taught. |
| `m1.l6.b3` | m1.l6 | `write_code` | all | **NEEDS REVISION** | All 5 cases pass (2024→yes, 1900→no, 2000→yes, 2023→no, 2100→no). | PROVENANCE MISCLAIM: marked `curriculum-derived, pdfPage: 7`, but leap year appears nowhere in the PDF's September practice list. Also introduces `!=`, parenthesised boolean grouping and operator precedence, none taught. |
| `m1.l6.b4` | m1.l6 | `explain` | all | **PASS** | Two well-chosen expected points; genuinely requires reasoning. | Never machine-graded (correct); but the model answer is shown to anyone who types one character, and nothing is stored for the teacher. |
| `m1.l7.b2` | m1.l7 | `test_case` | all | **PASS** | `18` → `no` executed, and 18 is provably the *only* input that exposes the rule violation, so the single-answer key is genuinely exhaustive here. | The author's breaking input is revealed for free on any answer. |
| `m1.l7.b3` | m1.l7 | `modify_code` | all | **PASS WITH MINOR ISSUE** | All 3 cases pass the reference solution. | CHECKER GAP: `if age != 17` passes all 3 cases (verified) while being wrong for age 5. Also repeats m1.l5.b4's exact repair, immediately after m1.l7.b2 handed over the answer. |
| `m1.l7.b4` | m1.l7 | `write_code` | all | **PASS** | All 4 cases pass (3 4 5→yes, 1 2 3→no, 10 1 1→no, 5 5 5→yes). Degenerate triangle correctly `no`. | Three-way `and` is a step up but justified at this point. |
| `m1.l8.b1` | m1.l8 | `challenge` | core,advanced | **BLOCKING ERROR** | WRONG ANSWER KEY. Hidden case `5 100` expects `1`; the block's OWN reference solution outputs `7`, and 7 is arithmetically correct (day 5 + 100 days, 100 % 7 = 2 → 7). | Every correct submission is marked partial/wrong on an invisible test, with no indication which case failed. |
| `m1.l8.b2` | m1.l8 | `challenge` | advanced | **NEEDS REVISION** | All 4 cases pass the reference solution. | KAZAKH STATEMENT IS WRONG: it says the dimensions of a ROOM and a door are given; the graded solution reads the WARDROBE and the door. Neither locale states the input order. Advanced-only — and the whole `tracks` system is inert. |
| `m1.l8.b3` | m1.l8 | `explain` | all | **NEEDS REVISION** | Well-formed expected points. | Asks core and support learners to explain m1.l8.b2 — a problem only advanced learners are meant to see. Since `tracks` is never read, everyone sees both, which accidentally papers over the defect. |
| `m1.p1` | m1.l9 | `write_code` | all | **PASS** | All 4 cases pass, incl. 4 4 4→4 and -9 -3 -7→-3. | — |
| `m1.p2` | m1.l9 | `write_code` | all | **BLOCKING ERROR** | Hidden case `-47` expects `7`. The only solution September's material supports, `print(n % 10)`, outputs `3` (Python floor-mod, executed). The reference solution uses `abs()`, which is never taught anywhere in the programme. | Impossible with taught material. Failure is recorded against `arith.remainder` — the very skill the learner just used correctly. |
| `m1.p3` | m1.l9 | `write_code` | all | **PASS** | All 3 cases pass (47→11, 10→1, 99→18). Prompt correctly restricts to two-digit numbers. | — |
| `m1.p4` | m1.l9 | `write_code` | all | **PASS WITH MINOR ISSUE** | All 3 cases pass (150 1000→`6 100`, 200 200→`1 0`, 300 100→`0 100`). | Same one-line `//`+`%` shape as m1.l3.b4 with the divisor changed. Zero price undefined and untested. |
| `m1.p5` | m1.l9 | `write_code` | all | **PASS** | All 5 cases pass including both axis cases. | Best-constructed task in the month: five branches, `and`/`or`, and the zero boundary checked first. |
| `m1.p6` | m1.l9 | `write_code` | core,advanced | **PASS WITH MINOR ISSUE** | All 4 cases pass (10 3→4, 9 3→3, 1 5→1, 0 5→0). The natural if/else solution also passes all 4 (verified). | `k = 0` crashes with ZeroDivisionError and is neither excluded by the prompt nor tested. |
| `m1.p7` | m1.l9 | `write_code` | core,advanced | **PASS** | All 3 cases pass across all three positions of the odd value. | — |
| `m1.p8` | m1.l9 | `write_code` | advanced | **NEEDS REVISION** | All 4 cases pass (3 0→90, 12 0→0, 6 0→180, 9 30→105). An int-only student solution also passes (verified). | KAZAKH PROMPT ASKS A DIFFERENT QUESTION: «тіл мен сан аралығындағы бұрыш» = the angle between a HAND and a NUMBER, which is not the task. Reference solution uses a float literal, `abs()` and `int()`-truncation — none taught. |
| `m1.as.b1` | m1.assessment | `verify` | all | **NEEDS REVISION** | Reference solution passes all 4 cases including -3 -6 5→2. | Never executed: `verify` is excluded from the judge, so the cases are dead data. Reference uses `+=`, which appears nowhere else in September. Unreachable — no `/assessment` route exists. |
| `m1.as.b2` | m1.assessment | `verify` | all | **NEEDS REVISION** | Reference passes all 5 cases; the natural non-chained solution also passes (verified). Good boundary coverage (17:30 / 17:31 / 8:59). | Never executed. Uses chained comparison, shown only once before — inside a WRONG distractor. Unreachable. |
| `m1.as.b3` | m1.assessment | `verify` | all | **BLOCKING ERROR** | `VerifyBlock` has no `code` field and the block declares none; `VerifyView` renders only a prompt and an empty box. The learner is told 'find and fix the error' with NO PROGRAM on screen. | Also: its `referenceSolution` is byte-identical to the m1.l5.b1 concept code the learner already read, and that code handles negatives correctly — so the prompt's premise is false. No `cases`, so it is ungradable even in principle. |
| `m1.as.b4` | m1.assessment | `verify` | all | **BLOCKING ERROR** | `VerifyView`'s oral branch renders a static note and no input, so the answer stays `{kind:"none"}`, `canCheck` returns false forever and the Check button on the FINAL assessment block is permanently disabled. | Also asks NONE of the four things the PDF mandates (integer-vs-fractional type choice, division, condition boundary, very large numbers) — it asks the generic p.6 question instead. |

**Distribution:** PASS 13 · PASS WITH MINOR ISSUE 8 · NEEDS REVISION 11 · BLOCKING ERROR 4.

---

# 6. BLOCKING ERRORS

## P0 — content

**P0-1 · `m1.l8.b1` ships a wrong answer key.**
`month-01-september.ts:596` — `{ input: "5 100", expectedOutput: "1", hidden: true }`.
The block's own reference solution (line 592) is `print((d - 1 + n) % 7 + 1)`.
Executed: `(5-1+100) % 7 + 1 = 104 % 7 + 1 = 6 + 1 = 7`. Seven is also the
mathematically correct answer — day 5 plus 100 days, and `100 % 7 = 2`, so 5+2=7.
The stored `1` is simply wrong. This is 1 mismatch in 84 executed case-runs.
**Consequence:** every core and advanced learner who writes the correct program is
marked partial on a test they cannot see, with no indication which case failed —
the server computes `{passed, total}` and the client discards it.
**Fix:** `expectedOutput: "7"`.

**P0-2 · `m1.p2` is unsolvable with September's material.**
Hidden case `{ input: "-47", expectedOutput: "7" }`. The reference solution is
`print(abs(n) % 10)`. `abs()` appears in exactly two places in the entire
programme, both inside reference solutions the learner never sees. The only
solution September teaches — `print(n % 10)` — outputs **3** for `-47`, because
Python's `%` follows the sign of the divisor. Executed and confirmed.
**Consequence:** a learner who has correctly understood `%` fails, and the failure
is recorded against `arith.remainder` — the exact skill they just demonstrated.
**Fix:** either restrict the statement to non-negative input and drop the case, or
teach `abs()` first. The former is right for September.

**P0-3 · `m1.as.b3` is an impossible task.**
Prompt: «Бұл бағдарлама теріс сандарды дұрыс өңдемейді. Қатені тауып түзет.»
(This program handles negative numbers incorrectly. Find and fix the error.)
`VerifyBlock` in `types.ts:262-279` **has no `code` field**, the block declares
none, and `VerifyView` (`blocks/index.tsx:567`) renders a mode badge, the prompt
and an empty textarea. There is no program on screen.
Two further defects in the same block: its `referenceSolution` is byte-identical
to the concept code in `m1.l5.b1` that the learner already read, and that code
handles negatives *correctly* — so the prompt's premise is false. It has no
`cases`, so it is ungradable even in principle.

**P0-4 · `m1.as.b4` dead-ends the assessment (latent).**
`VerifyView`'s `oral_explanation` branch renders a static note and **no input
control**, and never calls `onAnswer`. The answer therefore stays
`{kind: "none"}`; `canCheck` returns false for `kind: "none"` on an attempt block;
`footerMode("unchecked", true)` returns `"check"`; the Check button is rendered
`disabled`; `canNext` is hardcoded `false`. On the **final of four blocks**, there
is no way forward. Confirmed by executing `canCheck` against the real curriculum
object.

This is latent *today* only because the assessment is a 404 (P0-5) — nobody can
reach it to get stuck. It becomes an active blocker the moment the route is built,
so it must be fixed in the same change.

**Correction to an earlier reading:** this block's *prompt* is not defective. It is
tagged `pdfPage: 6` and faithfully implements the PDF's p.6 oral-explanation check.
The real content gap is separate and is P1-14 below.

## P0 — delivery

**P0-5 · The monthly assessment has no route.**
`adapters.ts:358` emits `href: /assessment/${month.index}` for the gameboard's
assessment node whenever the assessment is not `draft` (September's is
`implemented`). `src/app/` contains no `assessment` directory and the build's
route manifest has no such page. The PDF's Айлық сынақ — the one mechanism that
would catch everything else in this report — is a 404.

**P0-6 · `verify` blocks are never graded.**
`submit/route.ts:67-72` builds its code-execution branch from
`write_code | modify_code | challenge` only. `verify` is excluded, and
`checking.ts` returns `{verdict: "unknown"}` for it. The assessment's nine
declared test cases are dead data. A perfect assessment produces zero evidence.

**P0-7 · Every answer key ships in the page HTML.**
The lesson page passes the whole `Lesson` object to a client component, so Next
serialises `referenceSolution` and all `cases` — hidden ones included — into the
RSC payload embedded in the HTML. Verified against the build:
`.next/server/app/lesson/m1.l9.html` contains `abs(n) % 10` (a solution the type
comment says is "Never shown to a learner") and 46 `hidden` markers;
`m1.l8.html` contains the hidden input `5 100`.
**Consequence:** the label «Ещё N скрытых теста — скопировать пример недостаточно»
is false, and Ctrl+U defeats every code task in the month.

**P0-8 · Help is free, and recorded as independence.**
`assistance_delivered` is emitted by no code path in the repository. The reducer
therefore computes `independence_weight: 1` for a learner who took four hints, and
records the solve as `soloSolved`. Two consequences: the programme's headline
"~100 fully independent solutions" cannot be measured, and the teacher's
`high_assistance` flag in `classroom.ts:106` — gated on `hintDependency` — is
mathematically unreachable. The PDF's «Оқушы көмекке тым жиі сүйенсе, мұғалімге
белгі барады» is implemented as dead code.

**P0-9 · One tap yields a level-4 hint with zero attempts.**
`nova-chat.tsx:139` sends `requestedLevel: 4, override: true` behind a button
labelled «Жай айтып жібер» / «Просто скажи». `grantHintLevel` honours
`learnerOverride` before every other rule and returns `granted: requested`. With
no learner state — a fresh cookie — `directive` is null, so `mayIncludeCode` is
`true`. The PDF: «Көмек ... ешқашан дайын кодтан басталмайды» and «Дайын жауап
берілмейді».

## P1 — high

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **Differentiation does not exist.** `tracks` is declared on 5 blocks; `grep` over `schools/`, `src/`, `packages/` finds **zero** runtime reads. No track column in any migration, no track input to `grantHintLevel`, no UI to pick one. `school-lesson.tsx` is literally `const blocks = lesson.blocks;`. Even if honoured, assembly/completion count is identical (3) for all three tracks, so support would be "core minus five hard problems" — what the PDF's wording rules out. Advanced's two mandated features (later help, mandatory written defence) exist in no form. | `types.ts:41,43,160` only |
| P1-2 | **`m1.l3.b5` violates its own prerequisite.** A full `if`/`else` program is required in Unit 2 (Арифметика), one lesson before Unit 3 introduces conditions at `m1.l4.b1`. Corroborating proof: `m1.l4`, the lesson whose entire job is to introduce `if`/`else`, introduces zero new constructs. | executed + array order |
| P1-3 | **`m1.l5.b3` never tests its middle branch.** Cases yield only `5`,`4`,`2` — never `3`. A student who deletes the entire `elif b >= 50: print(3)` branch passes all six cases. Verified by execution. This is the month's flagship elif task. | executed |
| P1-4 | **`map(int, input().split())` is a magic incantation.** Introduced as one line in `m1.l2.b1`, whose prose never contains the word `map`. Required by **14 of 36** tasks. The very next block, `m1.l2.b2`, grades the learner on typing `map` into a blank. `map`, tuple-unpacking and multiple assignment are never explained. | executed count |
| P1-5 | **The step-execution visualiser is a stub.** The PDF calls step-by-step execution «түсінудің басты құралы». `m1.l3.b2` is the month's only `visual_simulation` and `SimulationView` renders a dashed box reading «Бұл көрнекілік әлі дайын емес». | `blocks/index.tsx:671` |
| P1-6 | **A first wrong answer hands back the right one.** `OptionList` paints `correctId` green once `locked`; `fill_blank` prints its answers verbatim; `find_bug` reveals the buggy line. Then `retry()` clears the verdict and unlocks the control. 7 of the 9 auto-graded tasks are affected, and retry is unlimited and unpenalised. | `primitives.tsx:201-208`, `blocks/index.tsx:113,154,286`, `school-lesson.tsx:227` |
| P1-7 | **Eight authored explanations reach nobody.** The `diagnosticMapping.justification` fields — the only place September explains *why* a distractor is wrong — are rendered by no component and read by no consumer. The validator enforces they be ≥20 characters. A wrong answer produces right/wrong plus «Пока не то». | grep |
| P1-8 | **Two skills can never receive evidence.** Only `skillRefs[0]` of a *measured* block is credited (`grade.ts:92`). `compare.operators` (declared on 5 tasks) and `types.int_float` (1) are never first on a measured block, so they show `not_started` forever — both are explicit PDF mastery requirements. | computed |
| P1-9 | **Production silently ungrades all code tasks.** `EXEC_PROVIDER` defaults to `local`; `LocalExecutionProvider.run` throws in production by design; `submit/route.ts` swallows it in `catch {}` and leaves `unknown`. `assertProductionConfig` checks the attestation secret, DB URL and Nova key — **not** `EXEC_PROVIDER`. `.env.example` ships `EXEC_PROVIDER=local` with piston commented out. | `config.ts:84-106`, `providers/local.ts:35` |
| P1-10 | **Lesson completion requires no correct answer.** `markLessonComplete` fires unconditionally from `advance()` on the last block; every `unknown` verdict routes the footer to "Continue"; progress is a `localStorage` flag that never reaches the server. No lesson gates any other. | `school-lesson.tsx:235`, `lib/progress.ts` |
| P1-11 | **Kazakh and Russian state different problems.** `m1.l8.b2`'s Kazakh says the dimensions of a **room** and a door are given; the graded solution reads the **wardrobe** and the door. `m1.p8`'s Kazakh asks for the angle «тіл мен сан аралығында» — between a hand and a *number* — which is not the task; the Russian correctly says «между стрелками». Kazakh-track learners get unsolvable statements. | content |
| P1-12 | **`//` is taught falsely.** «`//` — бүтін бөлу, **бөлшек бөлігін тастайды**» / «отбрасывает дробную часть». In Python `-7 // 2 == -4`, not `-3`. This is the month whose assessment is supposed to make learners explain where division gives wrong results, and whose `m1.p2` punishes them for not knowing negative-modulo semantics. | executed |
| P1-14 | **The assessment never asks September's own explanation question.** The PDF's p.7 Айлық сынақ requires the learner to explain why an integer or fractional type was chosen, and where division, the condition boundary or very large numbers could give a wrong result. Grep across `m1.assessment` and the month metadata for «бөлшек», «өте үлкен», «неге таңда», «тип» returns nothing. The assessment contains no `/` and no float. `m1.as.b4` asks the generic p.6 question instead — correctly, but it is not a substitute. | content + grep |
| P1-13 | **No delayed re-solve, no post-help explanation.** The PDF's third and fifth independence checks — re-solve without help after some weeks, and explain in your own words after any help — have no implementation. `delayed_resolve` exists as a string in a mode enum. | grep |

---

# 7. TECHNICAL CORRECTNESS

**Executed:** 84 reference-solution × case runs, all 3 prediction codes, all 8
concept code samples and their inline `# result` comments, both `find_bug`
symptoms and fixes, both `test_case` breaking inputs, the reassembled
`reorder_code` and the filled `fill_blank`, plus ~130 edge probes.

**Wrong answers:** exactly **one** — `m1.l8.b1` `5 100` → stored `1`, actual `7`.

**Wrong code:** none. Every other reference solution is correct for its statement.

**Correct-but-rejected:** two.
- `m1.p2`: `print(n % 10)` — the only solution September supports — fails the
  hidden `-47` case.
- Every correct solution to `m1.l8.b1` fails the wrong key.

**Wrong-but-accepted:** two, both from thin case sets.
- `m1.l5.b3`: the entire `elif b >= 50: print(3)` branch can be deleted.
- `m1.l7.b3`: `if age != 17` passes all three cases while being wrong for age 5.

**Verified correct (worth stating):** all three prediction answers match real
stdout and each is present verbatim among its options; `17 // 5  # 3` and
`17 % 5  # 2` are true; `x > 0 and x < 10  # True` and its two siblings are true;
`-3 % 2 == 1` so `m1.l3.b5`'s negative case is right; `-3 % 3 == 0` so
`m1.as.b1`'s negative case is right; the reorder reassembles into a working
program; the fill_blank template fills to `1 2 3 → 6`; both `breakingInputs`
genuinely break; `m1.p5`'s five branches and both axis cases are correct;
`m1.l7.b4` correctly rejects the degenerate triangle. `runCases` correctly
refuses to score a partial run after an infrastructure failure, and `unknown` is
genuinely routed to a neutral fifth verdict rather than collapsed onto "wrong" —
that distinction is well built and worth keeping.

**Ambiguities:** no code task in the month states its input format or ranges —
`WriteCodeBlock` has no field for constraints. `m1.l8.b2` does not say which pair
comes first. `m1.p6` crashes on `k = 0`, unexcluded and untested. `m1.l2.b4` asks
where a program "works incorrectly" when the expected answer makes it crash.

**Edge cases:** boundary coverage is **partial**. 12 of 36 blocks confront an
exact threshold; only 2 carry a full n−1 / n / n+1 triple (`m1.l5.b3`,
`m1.l7.b3`). Zero is tested in 6 tasks, negatives in 7. The largest value
anywhere in the month is `3600`, so the PDF's «өте үлкен сандар» (very large
numbers) — which the assessment is meant to make learners reason about — is never
exercised.

---

# 8. LEARNING PROGRESSION

**Taught order:** l1 print → int(input) · l2 `map(int,input().split())` ·
l3 `//` `%` · l4 `if`/`else` · l5 `elif` · l6 `and`/`or`/`not` · l7 boundaries ·
l8 combined challenges · l9 eight independent problems · assessment.

That spine is sound and cumulative. The violations are inside it.

**Required before introduced:**

| Construct | First required | First introduced |
|---|---|---|
| `if` / `else` / `==` / indentation | `m1.l3.b5` (Unit 2) | `m1.l4.b1` (Unit 3) |
| `//` | `m1.l2.b4` | `m1.l3.b1` |
| `print(a, b)` — two values, one line | `m1.l2.b3` | never |
| `map`, tuple unpacking | `m1.l2.b2` (graded on typing `map`) | never explained |
| `abs()` | `m1.p2` hidden case | never |
| `+=` | `m1.as.b1` reference | never |
| `!=` | `m1.l6.b3` | never |
| chained comparison | `m1.as.b2` reference | only inside a **wrong** distractor |
| float literal, `int()` truncation | `m1.p8` reference | never |
| ZeroDivisionError | `m1.l2.b4` | never |
| assignment / the idea of a variable | `m1.l1.b3` | never named — «айнымалы» occurs **0 times** in 1063 lines, yet `m1.l4.b2` asks the learner to trace variable values |

**Out-of-order teaching:** the boundary lesson (`m1.l7`) arrives two lessons after
`m1.l5.b3` and `m1.l5.b4` have already graded boundary reasoning. That is
defensible as spiral design, but it is not what the lesson ordering claims.

**Cognitive load.** The PDF requires «бір сабақта бір ғана идея» in a 5–8 minute
explanation. `m1.l1` introduces 6 new constructs, `m1.l3` 7, `m1.l6` 7 (`and`,
`or`, `not`, booleans, parenthesised negation, `!=`, chained comparison). The
validator's only guard trips at `estimatedMinutes > 12`; the largest declared
value is 12, so nothing trips. The one progression guard that exists operates on
self-declared `skillRefs` at **month** granularity and cannot see inside a month —
which is why every violation above passes `curriculum:validate` clean.

---

# 9. PEDAGOGICAL QUALITY

**70/30.** Do not trust `theoryHours: 2.5, practiceHours: 6`; both are literals,
and the validator "checks" them by comparing them to two other literals.
Measured from the actual content: 8 concept bodies averaging 165 characters plus
one stub simulation ≈ **7 minutes of explanation**, against ≈ **266 minutes of
practice**. That is **3 / 97**, not 30 / 70.

The problem is not too much practice. It is that explanation barely exists. Even
against the platform's *own* share of the PDF's budget (~5 h/year of short
explanation ÷ 9 ≈ 33 min/month), September ships about a fifth of it. The PDF's
«толық талданған мысалдар» — fully worked examples — have **no instances**: a
concept block is a code snippet and two sentences, never a problem reasoned
through.

**Declared minutes are fiction.** `estimatedMinutes` understates realistic time by
2.1×–6.7×. `m1.l9` claims **12 minutes for eight blank-editor programs**;
realistically 80. The assessment claims 20 minutes for two coding problems, a bug
fix and an oral explanation; realistically 32+.

**Interaction variety — the real imbalance.** The concern the brief anticipated
was "30 of 36 are MCQs". The opposite is true and is also a failure:

| Interaction | N |
|---|---|
| write independently (`write_code` + `challenge`) | 18 |
| unseen assessment (`verify`) | 4 |
| prediction | 3 |
| debug (`find_bug`) | 2 |
| test design (`test_case`) | 2 |
| explain | 2 |
| multiple choice | 1 |
| fill blank | 1 |
| reorder | 1 |
| trace | 1 |
| modify | 1 |

The PDF is explicit that for a beginner, assembling / completing / predicting /
bug-finding is «әлдеқайда тиімді» than writing everything from scratch. September
offers **3** assembly-or-completion blocks against **18** blank editors, and
**zero** `write_code` block carries a `starter`. Nine lessons, and only `m1.l4`
(concept → trace → assemble → write) runs a genuine pedagogical loop. `m1.l8` and
`m1.l9` contain no explanation at all.

**Independent work.** 22 of 36 tasks (61%) are independent code writing — above the
PDF's ~40% year target. But several are independent only in form: `m1.l3.b4`
directly follows a concept showing `17 // 5` and `17 % 5`, and `m1.l5.b3` directly
follows the elif concept whose sample is the same shape.

**Feedback.** A wrong answer yields a colour, sometimes the correct answer, and
«Пока не то. Разберём вместе?». The eight authored per-distractor explanations are
rendered nowhere. On code tasks the server computes which cases passed and the
client throws the summary away, so a failing submission shows amber and nothing
else — and there is no Run button, only Check.

---

# 10. SUPPORT / CORE / ADVANCED

**Differentiation is not implemented.** `tracks` appears in exactly three places
in the codebase: the type declaration, `TRACK_LABEL` (exported, never imported),
and the optional field on `BlockBase`. Five September blocks set it. Nothing reads
it. There is no learner track anywhere in the store or the migrations, no track
input to the hint ladder, and no UI to choose or display one. **All three tracks
receive an identical 46-block sequence today.**

Even if the field were honoured tomorrow, it would still fail the PDF:

| Track | Tasks | Blank editor | Assembly / completion |
|---|---|---|---|
| Support | 31 | 13 | **3** |
| Core | 34 | 16 | **3** |
| Advanced | 36 | 18 | **3** |

Support is core minus five hard problems. The PDF requires the opposite shape:
«дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ» — *more*
assembly and completion, *less* from scratch. The assembly column is identical
across all three tracks, and no `write_code` block anywhere has a `starter`, so
every one of support's 13 coding tasks is a genuinely blank editor.

Advanced's two mandated features — help unlocking later, and a **mandatory written
defence** — exist in no form at all.

Tracing three skills through the tracks: `io.read` — identical for all three.
`arith.integer_division` + `arith.remainder` — support loses `m1.p6`, otherwise
identical. `cond.if_elif_else` — support loses `m1.l8.b1`, `m1.l8.b2`, `m1.p6`,
`m1.p7`; nothing is added in their place.

**Strong learner:** the hardest thing September asks is `m1.l8.b2` (four inputs,
two `or`-ed conjunctions). A capable 14-year-old will finish the month in a
fraction of the budgeted time and will be bored by the eight near-identical
`//`/`%` and comparison problems in `m1.l9`.

**Struggling learner:** the first wall is `m1.l1.b5` — the fifth block of the
first lesson — a blank editor after two concept paragraphs and one prediction. The
second is `m1.l2.b3`, which requires `map(int, input().split())` and
`print(a, b)`, neither of which has been explained. There is no scaffolded path
around either.

---

# 11. LOCALIZATION

Structural health is good: **97/97 content strings have both `kk` and `ru`**, no
`ru` field is a copied `kk` field, guillemets and dashes are correct throughout,
and the Russian `plural()` helper is correct for 1 / 2 / 5 / 11 / 21 / 111.

**Blocking / high:**

- `m1.p8` — the Kazakh asks for the angle «тіл мен сан аралығында» (between a hand
  and a *number*). That quantity does not exist. The Russian asks the right
  question. Kazakh-track learners cannot solve it.
- `m1.l8.b2` — the Kazakh says the dimensions of a **room** and a door are given;
  the graded solution reads the **wardrobe** and the door.
- `m1.l3.b1` — «бөлшек бөлігін тастайды» / «отбрасывает дробную часть» is false
  for negatives (`-7 // 2 == -4`).
- `m1.l4.b3` — the **Russian** prompt contains untranslated Kazakh «көп» and «аз»,
  and the code lines are Kazakh. A Russian-track learner can solve the month's
  only reorder task by glyph-matching.
- Five worked examples print Kazakh literals («оң», «теріс», «нөл», «көп», «аз») to
  Russian-locale learners. `code` is typed `string`, not `Localized`, so this
  **cannot be localised at all** without a type change.
- Program output language is unstated and inconsistent: some tasks expect English
  (`even`/`odd`, `yes`/`no`, `ok`), others print Kazakh.

**Kazakh — vocabulary holes.** «айнымалы» (variable): 0 occurrences. «жалған»
(false): 0, though «ақиқат» is taught. «тип»: 0. «салыстыру»: once, in metadata
only. `map` is graded without ever being introduced. All four violate the PDF's
promise that English terms arrive «әрдайым аудармасымен және түсіндірмесімен».
Russianisms: «конфет» (should be «кәмпит»), «Осьте» (should be «өс»). One flat
grammatical error: «10-нан 20-ға дейін аралықта». «жол» carries four unrelated
meanings, two inside the same lesson. `L.tryAgain` = «Қайта көру» means
"view again", not "try again" — and it is on the live retry button.
`source-of-truth.ts:111` writes «ішарадан» for the PDF's «ишарадан» — a
non-existent word, in the file whose entire purpose is verbatim fidelity.

**Russian — the systematic one.** Every past-tense verb and predicate adjective
addressed to the learner is **masculine only**, so half a Kazakhstani classroom is
addressed in the wrong gender. Hard errors: «Что смотрит учитель» (means "what is
the teacher watching"), «Это задание ты выполняешь устно учителю» (not a valid
construction), «Этот раз не зачтётся» (missing preposition), «Ещё 1 скрытых
теста» (hardcoded plural while four correct `plural()` helpers exist),
«Решено: 1 задачу … и 3 задачи» (mixed cases). One wrong technical term: «ошибка
записи» means a *disk write error*. «Ошибок без причины» says the errors *have* no
cause; the feature exists to say the cause is *unknown*. Calques: «На каком
вводе», «Напиши ввод». «условие» means both "problem statement" and "if-condition"
in the same month, which makes the assessment's final question genuinely
ambiguous.

**Not localised at all:** the eight `diagnosticMapping.justification` strings are
Kazakh-only (`justification` is typed `string`, not `Localized`) — moot, since
they reach nobody. Page titles and the site description are hardcoded Kazakh for
Russian-locale users too.

---

# 12. MONTHLY ASSESSMENT

**Verdict: INVALID.** Not weak — non-functional.

| Question | Answer |
|---|---|
| Reachable? | **No.** `/assessment/1` is linked from the gameboard and does not exist. |
| Completable? | **No.** `m1.as.b4` renders no input; Check is permanently disabled on the final block. |
| Gradable? | **No.** `verify` is excluded from the judge; all four blocks settle `unknown`. Nine declared test cases are dead data. |
| Genuinely unseen? | **Partially.** `m1.as.b1` and `m1.as.b2` are genuinely unseen and well constructed. `m1.as.b3`'s solution is byte-identical to the `m1.l5.b1` concept code. |
| Requires read + compute + condition? | Yes, for b1 and b2 — the content is sound. |
| Asks the PDF's mandated explanation? | **Half.** `m1.as.b4` is tagged `pdfPage: 6` and correctly implements the p.6 oral check — its prompt is «Шешімінің неге дұрыс екенін және шарт өзгерсе не бұзылатынын түсіндіреді» in the second person. What is missing is September's **own** p.7 explanation requirement: why an integer or fractional type was chosen, and where division / the condition boundary / very large numbers give a wrong result. Those are asked **nowhere** in the assessment. Two of them could not be asked honestly anyway — September teaches no fractional type, and its largest value is 3600. |
| 20 minutes? | Content is realistically 32+ minutes. |
| Passable by guessing? | Moot — nothing is graded. |
| Counts as independent evidence? | **No.** A perfect performance reduces to `outcome: "abandoned"`, `skill_id: null`, `soloSolved: 0`. |
| Depends only on September topics? | Almost. `m1.as.b1` needs `+=` / counter accumulation and `m1.as.b2`'s model uses chained comparison — neither taught. Both are solvable without them. |

I executed both reference solutions against all nine cases: 9/9 pass. The
*content* of b1 and b2 is the best-designed material in the month. Everything
around it is broken.

---

# 13. GAMING / CHEATING PATHS

The shortest route through September with zero understanding:

1. Open any lesson. Concept blocks show "Continue" with nothing to answer.
2. On the 9 auto-graded tasks: guess. A wrong answer paints the correct one green
   (or prints it verbatim). Press "Try again", pick the revealed answer, get
   `correct`. Unlimited, unpenalised, no cooldown.
3. On the 19 code tasks: press Ctrl+U. Every reference solution and every hidden
   case is in the page HTML. Paste and pass.
4. Or skip step 3 entirely — in a default production deployment the judge refuses
   to run, the failure is swallowed, the verdict is `unknown`, and `unknown`
   routes the footer straight to "Continue". One character passes each of them.
5. Stuck anywhere? Tap «Жай айтып жібер». Level-4 hint, code permitted, zero
   attempts required. It costs nothing: `assistance_delivered` is never emitted,
   so the solve is still recorded as `soloSolved`.
6. The lesson marks complete on reaching the last block regardless of verdicts.
   No lesson gates any other.
7. The monthly assessment — the only thing that would catch any of this — 404s.

Nothing in that path is hypothetical; each step is a code path I read.

What *is* well built and should be kept: the server re-grades authoritatively
rather than trusting the browser, verdicts are signed, `sourceTrust` is stamped
server-side, and `unknown` is never styled as failure. The guards that exist are
sound. The problem is that the guards protecting *independence* are dead code,
unreachable, or pointed at an event nobody writes.

---

# 14. TASK QUALITY DISTRIBUTION

Scored on the 8×0–4 rubric (alignment, correctness, clarity, pedagogical value,
prerequisite fit, checker quality, beginner suitability, feedback quality).

| Band | N | Tasks |
|---|---|---|
| Excellent (29–32) | **0** | — feedback quality is capped for every task, since no task explains *why* |
| Good (25–28) | **13** | `m1.l1.b2` `m1.l1.b5` `m1.l2.b3` `m1.l3.b3` `m1.l4.b4` `m1.l5.b2` `m1.l6.b4` `m1.l7.b2` `m1.l7.b4` `m1.p1` `m1.p3` `m1.p5` `m1.p7` |
| Revision recommended (20–24) | **8** | `m1.l1.b4` `m1.l3.b4` `m1.l4.b2` `m1.l5.b4` `m1.l6.b2` `m1.l7.b3` `m1.p4` `m1.p6` |
| Unacceptable (<20) | **15** | `m1.l2.b2` `m1.l2.b4` `m1.l3.b5` `m1.l4.b3` `m1.l5.b3` `m1.l6.b3` `m1.l8.b1` `m1.l8.b2` `m1.l8.b3` `m1.p2` `m1.p8` `m1.as.b1` `m1.as.b2` `m1.as.b3` `m1.as.b4` |

Per the brief's own rule, aggregate score does not launder a correctness error:
`m1.l8.b1`, `m1.p2`, `m1.as.b3` and `m1.as.b4` are **BLOCKING regardless of score**.

---

# 15. MISSING CONTENT

What the PDF specifies and the implementation does not provide:

1. **Purchase price with discount** — no task, no percentage arithmetic anywhere.
2. **Choosing a discount level** — only a structurally similar grade-band task.
3. **Product of numbers** — as its own task.
4. **Sign** as a learner task — exists only as a worked example they read.
5. **Reading text input** — never; the one string is a bug to be removed.
6. **Integer vs fractional numbers** — `/` occurs zero times; asserted in metadata.
7. **Seconds → hours and minutes** — implemented as seconds → minutes and seconds.
8. **Fully worked examples** — none.
9. **Step-by-step execution visualiser** — a placeholder.
10. **The beginner-mistakes block** (type confusion / unexpected division / wrong boundary) — only boundary is covered.
11. **The personal error dictionary** — nothing stored, nothing surfaced.
12. **Delayed re-solve** — no scheduling mechanism.
13. **Post-help explanation requirement** — not enforced.
14. **Support-track scaffolding** — no starters, no extra assembly tasks.
15. **Advanced-track written defence and later help** — no mechanism.
16. **The `/assessment` route** — no page.

---

# 16. REDUNDANT CONTENT

Roughly 30 of the 36 are genuinely distinct. The exceptions:

- `m1.l3.b4` and `m1.p4` are the same one-line `x // k, x % k` program with the
  divisor changed. `m1.p3` is genuinely different (it *sums* the parts).
- `m1.l7.b3` repeats `m1.l5.b4`'s exact `>` → `>=` repair with the number changed,
  and it lands immediately after `m1.l7.b2` has already handed over the answer —
  three consecutive blocks on the same `age > 18` program.
- `m1.l8.b3` asks core and support learners to explain `m1.l8.b2`, a problem only
  advanced learners are meant to see.
- `m1.l4.b4` (max of two) → `m1.p1` (max of three) is legitimate progression, not
  duplication.

---

# 17. TOP 10 FIXES

Ranked by educational impact and release risk.

1. **Fix the wrong answer key.** `m1.l8.b1` `expectedOutput: "1"` → `"7"`. Then add
   a test that executes every reference solution against every case in CI. One
   defect, one test, and the class of defect closes permanently.
2. **Build the `/assessment/[month]` route**, and fix the two broken assessment
   blocks: give `VerifyBlock` a `code` field so `m1.as.b3` can show a program, and
   give `m1.as.b4` an input control so the assessment can be finished.
3. **Route `verify` blocks to the judge** in `submit/route.ts`, so the monthly
   check produces evidence instead of `unknown`.
4. **Stop shipping answer keys to the browser.** Strip `referenceSolution` and
   hidden `cases` from the payload sent to the client; keep them server-side where
   grading already happens.
5. **Emit `assistance_delivered`.** Without it, "independent solution" is not
   measured, and the teacher's help-overuse signal cannot fire. This is the single
   change that makes the programme's headline metric real.
6. **Fix `m1.p2`.** Restrict the statement to non-negative input and drop the
   `-47` case, or teach `abs()`. As it stands the task punishes correct understanding.
7. **Stop revealing the answer on the first wrong attempt**, and require an
   attempt before rung 0. Gate `learnerOverride` behind at least one real attempt.
8. **Implement `tracks`, or remove it and tell the school.** Filtering blocks by
   track is a few lines. Making support *mean* something needs starters and more
   assembly tasks — that is content work, not a code change.
9. **Fix the two mistranslated task statements** (`m1.p8`, `m1.l8.b2`) and the
   false `//` explanation. Kazakh is the primary language of this programme; two
   unsolvable Kazakh statements is not a polish issue.
10. **Add the missing practice**: a discount task and a discount-level task, which
    together carry the integer-vs-fractional requirement; a text-input task; and
    at least one place where `/` and `//` are contrasted on the same numbers.

Deliberately *not* in this list: the visualiser stub, the 70/30 imbalance, and the
Russian grammar pass. All are real and all are listed above — none of them makes
a student fail a task they solved correctly.

---

# 18. RELEASE DECISION

**September must not be put in front of a paying school's Grade 9 class in its
current state.**

Minimum to reach "ready after blocking fixes": items **1–6** of §17. Those are
the defects that either mark a correct student wrong, present an impossible task,
or make the month's assessment non-existent. They are all small, well-localised
changes — a wrong string, a missing route, a missing field, a missing branch in
one `if`, an unemitted event. None is a redesign.

Items **7–10** should land before the pilot's first monthly review, not
necessarily before day one.

The thing worth saying plainly to whoever owns this: the *authoring* is in better
shape than the audit's verdict suggests. Someone thought carefully about
misconception distractors, about `unknown` being a real fourth outcome, about not
telling a fourteen-year-old something false about their own mind. That care is
visible throughout the type system and the checking layer. What is missing is the
last mile — the route, the judge branch, the event, the payload boundary — and one
test that runs the content it ships.
