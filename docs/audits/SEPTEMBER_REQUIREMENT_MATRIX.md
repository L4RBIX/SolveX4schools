# September — Requirement Matrix

Every row traces one PDF requirement to its implementation. Evidence is a block
id plus, where the claim is about behaviour, an executed result. `Missing` means
I searched the whole month and found nothing, not that I judged it thin.

Source of truth: `9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf`, p.7 (September)
and p.4–6 (programme-wide rules).

## A. Mastery requirements — "Оқушы нені меңгереді"

| # | Requirement (PDF) | Implemented in | Evidence quality | Verdict |
|---|---|---|---|---|
| 1 | Read numeric input | `m1.l1.b3` concept; `m1.l2.b1` concept; required by 21 tasks | Strong | **PASS** |
| 2 | Read **text** ("Сан мен **мәтінді** оқу") | `m1.l1.b4` only — and there the string is the *bug* to be removed | Missing | **FAIL** |
| 3 | Perform calculations | `m1.l1.b5`, `m1.l2.b3`, `m1.p3`, `m1.p4`, + | Strong | **PASS** |
| 4 | Output results | Every code task; `m1.l1.b1` concept | Strong | **PASS** |
| 5 | Integer **vs fractional** values | Nothing. `/` occurs **0 times** in the month; no float is ever seen or produced; `types.int_float` is credited to `m1.l1.b4`, which is about *string* vs int | Missing | **FAIL** |
| 6 | Integer division `//` | `m1.l3.b1` concept; `m1.l3.b4`, `m1.p3`, `m1.p4`, `m1.p6` | Strong | **PASS** |
| 7 | Remainder `%` | `m1.l3.b1`, `m1.l3.b3`, `m1.l3.b5`, `m1.p2`, `m1.p3`, `m1.p4`, `m1.l8.b1`, `m1.as.b1` | Strong | **PASS** |
| 8 | Comparisons | Used in 5 tasks, but `==`, `>=`, `<=`, `!=` are **never defined in any prose**; `compare.operators` can never receive evidence (never `skillRefs[0]` of a measured block) | Partial | **WARN** |
| 9 | `if` | `m1.l4.b1` concept + 6 tasks | Strong | **PASS** |
| 10 | `elif` | `m1.l5.b1` concept; `m1.l5.b2` prediction; `m1.l5.b3`, `m1.p5` | Strong | **PASS** |
| 11 | `else` | `m1.l4.b1` + most condition tasks | Strong | **PASS** |
| 12 | `and` | `m1.l6.b1` concept; `m1.l6.b2`, `m1.l7.b4`, `m1.p5`, `m1.l8.b2` | Strong | **PASS** |
| 13 | `or` | `m1.l6.b1`; `m1.l6.b3`, `m1.p5`, `m1.l8.b2` | Strong | **PASS** |
| 14 | `not` | Shown once in `m1.l6.b1`'s code sample; appears once more as part of a **wrong** distractor (`m1.l6.b2` o4). Never used in any correct answer | Weak | **FAIL** |
| 15 | Basic debugging | `m1.l1.b4`, `m1.l5.b4`, `m1.l7.b3` + 2 `test_case` | Partial — 3 of 6 debugging blocks are the same `>` vs `>=` bug | **WARN** |
| 16 | Boundary awareness | `m1.l7.b1` concept; `m1.l5.b4`, `m1.l7.b2`, `m1.l7.b3`, `m1.as.b2` | Strong on `>=`, absent elsewhere (no input-range concept exists; largest value anywhere is 3600) | **PASS** |

## B. Explanation delivery — "Түсіндіру қалай беріледі"

| Requirement (PDF) | Implemented | Verdict |
|---|---|---|
| Short lessons, one idea each | 8 concept blocks, ~165 chars each. But lessons introduce 5–7 new constructs apiece | **WARN** |
| **Fully worked examples** ("толық талданған мысалдар") | None. Concept blocks are a code snippet plus two sentences; no problem is worked through with reasoning | **FAIL** |
| **Step-by-step execution** ("кодтың қадамдық орындалуы") — the PDF calls this "түсінудің басты құралы" | `m1.l3.b2` is the month's only `visual_simulation`, and `SimulationView` renders a dashed placeholder reading «Бұл көрнекілік әлі дайын емес» | **FAIL** |
| Separate block on beginner mistakes (type confusion / unexpected division / wrong boundary) | No such block exists. Boundary is covered by `m1.l7.b1`; type confusion only implicitly via `m1.l1.b4`; unexpected division **not at all** (`/` never appears) | **FAIL** |
| Learner builds a personal error dictionary ("қателер сөздігі") | Not implemented. `m1.l7.b5` `reflection` asks the learner to *recall* a repeated error; nothing is stored, and grep for сөздіг/словар/errorDictionary returns nothing | **FAIL** |

## C. Practice list — the PDF's own enumeration

| PDF item | Implemented in | Verdict |
|---|---|---|
| Sum of numbers | `m1.l2.b2` (fill_blank, a+b+c) | **PASS** |
| **Product of numbers** | Nothing computes a product of given numbers as its own task (`m1.l2.b3` area is listed separately by the PDF) | **MISSING** |
| Area | `m1.l2.b3` | **PASS** |
| Perimeter | `m1.l2.b3` | **PASS** |
| Full boxes + remainder | `m1.p4`, `m1.p6` | **PASS** |
| Last digit | `m1.p2` — but its hidden negative case makes it unsolvable with taught material | **PASS (broken)** |
| Seconds → **hours** and minutes | `m1.l3.b4` converts seconds → **minutes and seconds** | **PARTIAL** |
| **Purchase price with discount** | Nothing. «жеңілдік»/«скидк»/«процент» appear **0 times** in the month | **MISSING** |
| Even / odd | `m1.l3.b5` | **PASS** |
| **Sign** (positive/negative/zero) | Shown as the worked example in `m1.l5.b1`; no learner task. `m1.as.b3` would have been it, but renders no program | **MISSING as a task** |
| Max of two | `m1.l4.b4` | **PASS** |
| Max of three | `m1.p1` | **PASS** |
| Score threshold | `m1.l5.b3`, `m1.l7.b2`, `m1.l7.b3` | **PASS** |
| **Choosing a discount level** | `m1.l5.b3` is the same *shape* (banded elif) but is a grade, not a discount, and involves no percentage arithmetic | **PARTIAL** |
| "What is printed?" (prediction) | `m1.l1.b2`, `m1.l3.b3`, `m1.l5.b2` | **PASS** |
| "Find the error in the condition" | `m1.l5.b4` | **PASS** |
| Fix someone else's program | `m1.l7.b3`; `m1.as.b3` is broken | **PARTIAL** |

Two of the four missing items — purchase price with discount and choosing a
discount level — are the only places in the PDF's September list where
percentage arithmetic arises. They are also the natural home for requirement A5
(integer vs fractional). Dropping them is why A5 has nowhere to live.

## D. Programme-wide rules

| Rule (PDF) | Implemented | Verdict |
|---|---|---|
| 70% practice / 30% explanation | Actual platform content is ~7 min explanation vs ~266 min practice ≈ **3 / 97**. Practice is not short; *explanation* is ~20% of even the platform-only budget | **WARN — inverted** |
| Task types beyond zero-to-solution | 18 blank-editor tasks vs **3** assembly/completion blocks (1 fill_blank, 1 reorder, 1 modify) | **FAIL** |
| Help only after an attempt | `enforceHintPolicy` sets `hasAttemptSinceLastHint = true` when `lastHintAt === null`, so rung 0 is available with zero attempts | **WARN** |
| Help never starts with ready code | `learnerOverride` grants the requested level (UI sends 4) in one tap, with `mayIncludeCode: true` when no directive exists | **FAIL** |
| Learner must explain after any help | Nothing enforces it | **FAIL** |
| Delayed re-solve without help | No scheduling mechanism exists | **FAIL** |
| Teacher signalled on help overuse | `classroom.ts` has a `high_assistance` flag — but `assistance_delivered` is emitted nowhere, so `hintDependency` stays 0 | **FAIL (dead)** |
| Learner always knows it is a program | Nova disclosure strings present and correct | **PASS** |
| Three differentiation levels | `tracks` is declared on 5 blocks and **read by zero lines of code** | **FAIL** |
| Kazakh and Russian interface | Complete kk/ru parity on all 97 content strings; defects listed in the main report | **PASS with defects** |
| ~40% of tasks fully independent | 22 of 36 are independent code writing (61%) — above target, but at the cost of scaffolding | **PASS** |

## E. Monthly assessment — "Айлық сынақ"

| Requirement | Implemented | Verdict |
|---|---|---|
| 20 minutes | Declared 20; realistic content is 32+ min (2 coding problems + bug fix + oral) | **WARN** |
| Previously unseen problem | `m1.as.b1` and `m1.as.b2` are genuinely unseen. `m1.as.b3`'s solution is byte-identical to the `m1.l5.b1` concept code | **PARTIAL** |
| Solved independently | Cannot be established — see below | **FAIL** |
| Read data + compute + ≥1 condition | `m1.as.b1` and `m1.as.b2` both satisfy this on paper | **PASS (content)** |
| Explain why an integer or fractional type was chosen | Asked nowhere in the assessment — and September never teaches fractional types | **FAIL** |
| Explain where division / boundary / very large numbers go wrong | Asked nowhere. `m1.as.b4` correctly implements the *p.6* oral check («шарт өзгерсе не бұзылады») but that is not September's p.7 requirement | **FAIL** |
| Reachable at all | `adapters.ts:358` links `/assessment/1`; no such route exists in `src/app` | **FAIL — 404** |
| Gradable at all | `verify` is excluded from the judge in `submit/route.ts:67-72`; every block settles `unknown` | **FAIL** |
| Completable at all | `m1.as.b4` renders no input, so Check is permanently disabled on the final block | **FAIL** |
