# September — Remediation Report

Companion to [`SEPTEMBER_FORENSIC_AUDIT.md`](./SEPTEMBER_FORENSIC_AUDIT.md). Every
row below is one finding from that audit, re-checked against the tree rather than
assumed closed. Where a fix is claimed, the evidence is a command that was run or
a code path that was exercised — not a diff.

**Method for the re-audit:** the same one as the original. The PDF re-read as the
source of truth, every Python artefact executed against real CPython, the grading
and rendering paths read end to end, and the running application driven over HTTP
to confirm the behaviour actually changed for a learner rather than only in the
source.

---

# 1. VERDICT

# SEPTEMBER READY FOR SCHOOL PILOT

with three known limitations stated in §5, none of which can mark a correct
learner wrong, present an impossible task, or fabricate evidence about a child.

The nine P0s are closed and each was verified against the running app. Of the
fourteen P1s, twelve are closed, two are partial and honestly described. The
class of defect that produced the worst finding — a wrong answer key sitting in a
fully green build — is now structurally impossible to repeat: `npm run check`
executes every reference solution against every one of its own test cases, and
that suite fails on exactly the original defect when it is reintroduced (proved,
§4).

---

# 2. BASELINE, THEN AND NOW

| | Before | After |
|---|---|---|
| `npm run lint` | pass | pass (0 errors) |
| `npm run typecheck` | pass | pass |
| `npm run build` | pass | pass |
| `npm run test` | 294 tests | **658 tests**, 2 skipped |
| `npm run curriculum:validate` | "No errors" | "No errors" |
| **`npm run curriculum:test-content`** | *did not exist* | **205 tests** — content executed against Python |
| September tasks | 36 (32 practice + 4 unreachable assessment) | **54** |
| September lessons | 9 | **12** + assessment |
| Answer keys in built HTML | present, provable | **0 leaks across 120 built files** |

`npm run check` now runs the content suite between the validator and the unit
tests, so no build can go green over content that does not do what it claims.

---

# 3. EVERY P0

| # | Finding | Status | Evidence |
|---|---|---|---|
| P0-1 | `m1.l8.b1` hidden case `5 100` expected `1`; correct answer is `7` | **FIXED** | Key corrected. `curriculum:test-content` executes it; reintroducing `1` fails the suite with the exact input named (§4) |
| P0-2 | `m1.p2` demanded `abs()`, never taught; `n % 10` gave 3 for −47 | **FIXED** | Statement now declares `0 ≤ n`, negative case removed, boundary cases 0/7/10/47/100 added. `abs()` occurrences in September: **0** |
| P0-3 | `m1.as.b3` asked to fix a program that was never rendered | **FIXED** | `VerifyBlock` gained `code`; block rewritten as an `and`/`or` swap with 6 cases. Live: `/assessment/1` returns 200 and the program appears in the HTML |
| P0-4 | `m1.as.b4` rendered no input → Check permanently disabled on the last block | **FIXED** | `VerifyView`'s oral branch now renders an `AnswerArea`; the answer is stored and read by a teacher |
| P0-5 | Assessment linked `/assessment/1`, which did not exist | **FIXED** | Route built. Live: **HTTP 200**, title «Қыркүйек айының тексерісі» renders |
| P0-6 | `verify` blocks excluded from the judge — the whole check recorded nothing | **FIXED** | Live POST of a correct solution → `correct`, **7/7 cases run**; a solution using `< 1050` instead of `<= 1050` → `partial`, **6/7** — it caught the exact boundary the task teaches |
| P0-7 | Every reference solution and hidden case shipped in the page HTML | **FIXED** | New projection layer (`schools/curriculum/public.ts`). Scan of all 120 built `.html`/`.rsc` against 52 secret strings, at three un-escaping depths: **0 leaks**. Also closed on `/home`, `/program` and `/course/[index]`, which the original audit had not covered |
| P0-8 | `assistance_delivered` emitted nowhere — hinted solves counted as independent | **FIXED** | Ledger after a live session: `assistance_requested: 2`, `assistance_delivered: 1` — delivered only for the hint that actually streamed. `interventions.content_len: 66` confirms the reducer now enriches the row |
| P0-9 | "Just tell me" granted level 4 with code, on an untouched task | **FIXED** | Live: no attempt → `granted: 0, reason: attempt_required`; after a real attempt → `granted: 0, reason: opening_rung`. The override survives past the opening rung |

---

# 4. THE REGRESSION GUARD, PROVED

The single most consequential change is not any one fix. It is that the defect
class can no longer hide.

`tests/school/content-execution.test.ts` executes every reference solution in the
programme against every one of its own declared cases, checks that every
prediction's stored answer is what Python actually prints, that every `find_bug`
program genuinely differs from its repair, that every graded task withholds at
least one case, and that a published assessment has a route.

Reintroducing the original P0 produced:

```
FAIL  tests/school/content-execution.test.ts > every reference solution passes
      every one of its own cases > m1.l8.b1 (Қыркүйек/m1.l8)

AssertionError: m1.l8.b1 input="5 100" [hidden]
print((d - 1 + n) % 7 + 1): expected '7' to be '1'
```

Restored, and green. Two further suites join it in `curriculum:test-content`:
`payload-privacy.test.ts` (the projection plus a scan of the built output) and
`reveal-policy.test.ts` (93 tests asserting no answer is shown on a first wrong
attempt).

---

# 5. EVERY P1

| # | Finding | Status | Evidence / what remains |
|---|---|---|---|
| P1-1 | Differentiation did not exist — `tracks` read by zero lines | **FIXED** | `resolveTrack` (per-month cookie) → `blocksForTrack` → projection, applied on the lesson, assessment and board routes. A `POST /api/learning/track` and a board control set it. **Filtering alone was not enough**: support was still "core minus the hard ones", so four blank-editor tasks now have a support-only scaffolded twin. Support: 7 assembly / 18 blank-editor. Core: 3 / 25. The programme's rule is «құрастыру мен толықтыру КӨБІРЕК» and it is now true |
| P1-2 | `m1.l3.b5` required `if`/`else` a lesson before conditions were taught | **FIXED** | Parity task moved to `m1.l4.b5`, immediately after `if`/`else`. Its old slot carries pure `//`/`%` work that codes the simulation beside it |
| P1-3 | `m1.l5.b3` never tested its middle band — the branch could be deleted | **FIXED** | Cases added at 69, 50, 100. Deleting the `elif b >= 50` branch now fails |
| P1-4 | `map(int, input().split())` taught as one line, required by 14 tasks | **FIXED** | Decomposed into three blocks: split → a prediction that makes the learner discover the pieces are still text (`3 4` → `34`) → `map`. The word `map` now appears in prose before it is graded |
| P1-5 | The step-execution visualiser was a dashed placeholder | **FIXED** | Real stepper: current line, variable values, output, with Next/Previous/Reset, keyboard-accessible, driven by a pure `buildStepProgram(config)` |
| P1-6 | A first wrong answer handed back the right one, then retry was free | **FIXED** | Keys are no longer in the browser, so the UI *cannot* reveal. `revealFor` withholds until the third failed attempt. Live: attempts 1 and 2 → `reveal: None`; attempt 3 → `{correctId: "1"}` |
| P1-7 | Eight authored explanations of specific wrong answers reached nobody | **FIXED** | Returned as `why` and spoken by the tutor. Live, on the first wrong answer: «3 — бұл 7 // 2 нәтижесі…» — and nothing at all where the author declared nothing |
| P1-8 | `compare.operators` and `types.int_float` could never receive evidence | **FIXED** | Success now credits every skill the task exercises (one event per skill); failure still credits the primary skill only, so "failed problem → all tags weak" cannot return. Both skills now carry 7 tasks each |
| P1-9 | Production silently ungraded every code task | **FIXED** | `assertProductionConfig` rejects `local`, `piston` without a URL, and unknown values; `src/instrumentation.ts` throws at boot. A misconfigured school deployment now fails loudly instead of quietly not grading |
| P1-10 | Lesson completion was localStorage-only, never reached the server | **PARTIAL** | `lesson_completions` table, `POST /api/learning/complete`, wired from both routes, returned by `state/me`. **What remains:** a lesson still completes on reaching the last block. Every attempt block must be answered to get there, so it cannot be clicked through — but completion is "attempted all", not "passed a bar", and that is a policy the school should set, not one I should invent |
| P1-11 | Kazakh and Russian stated different problems | **FIXED** | `m1.l8.b2` (room → wardrobe, and the input order now stated in both), `m1.p8` (angle between a hand and a *number* → between the two hands), `m1.l4.b3` (untranslated Kazakh removed from the Russian prompt and from the program's output) |
| P1-12 | `//` taught as "discards the fractional part" — false for negatives | **FIXED** | Scoped to non-negative integers, with the negative case named as a later topic rather than mis-taught |
| P1-13 | No delayed re-solve; nothing required an explanation after help | **OPEN** | Neither is implemented. Both are real programme requirements (PDF p.4, p.6) and both need scheduling infrastructure that does not exist. See §7 |
| P1-14 | The assessment never asked September's own explanation question | **FIXED** | Restructured to one unseen problem + a repair + a written explanation asking exactly the PDF's four things + the p.6 oral check |

## Curriculum coverage gaps (from the requirement matrix)

| PDF requirement | Before | After |
|---|---|---|
| Reading **text** | absent — the one string was a bug | **`m1.l11`**: concept, a greeting task, and a find_bug where `int()` is the mistake |
| Integer **vs fractional**, `/` vs `//` | absent — `/` occurred **0 times** | **`m1.l10`**: concept, the `10 / 5 → 2.0` prediction, a worked example, an MCQ on which division a problem needs, and an average task that requires `/` |
| Product of numbers | absent | `m1.l2.b3a` |
| Purchase price with discount | absent — «жеңілдік» occurred 0 times | **`m1.l12.b2`** |
| Choosing a discount level | absent | **`m1.l12.b3`**, banded, with every band and boundary tested |
| Sign (positive/negative/zero) | worked example only, no task | `m1.l5.b3b` |
| Meaningful `not` | shown once, used only inside a *wrong* option | `m1.l6.b2a` (equivalence with a boundary) and `m1.l6.b2b` (negating a compound condition) |
| Seconds → **hours** and minutes | implemented as minutes and seconds | `m1.p9` — two applications of `//` and `%`, which is why the PDF asks for hours |
| **Fully worked examples** | none | **4**: input+conversion, choosing a division, multi-branch elif, the condition boundary |
| Personal error dictionary | absent | Implemented, learner-saved only, seeded from author-written justifications; a system-composed claim about a child is structurally impossible (schema has one prose column, written only from a request body) |

---

# 6. SEPTEMBER NOW

| | Before | After |
|---|---|---|
| Blocks | 46 | 72 |
| Tasks (attempt blocks) | 36 | **54** |
| Lessons | 9 | 12 + assessment |
| Concept blocks | 8 | 12 |
| Worked examples | **0** | **4** |
| Interaction types with ≥2 instances | 7 | 11 |
| Assembly/completion — support | 3 | **7** |
| Assembly/completion — core | 3 | 3 |
| Blank-editor — support | 13 | 18 |
| Blank-editor — advanced | 18 | 27 |
| Skills reachable by evidence | 8 of 10 | **10 of 10** |
| Explanation minutes (platform) | ~7 | **~20** |

The task count exceeds the PDF's «шамамен 36» because the missing requirements
had to go somewhere, and the document is explicit that its figures are a floor
(«Бұл минимум жиын»). Practice is not capped by the programme; explanation is
what was short.

## Interaction mix

`write_code` 25 · `prediction` 5 · `find_bug` 3 · `fill_blank` 3 ·
`multiple_choice` 3 · `explain` 3 · `verify` 3 · `test_case` 2 · `reorder_code` 2 ·
`modify_code` 2 · `challenge` 2 · `trace_code` 1.

---

# 7. WHAT IS STILL OPEN

Three things. None of them can mark a correct learner wrong or invent evidence,
which is why the verdict is what it is — but they are real and they are not
finished.

**1. Delayed re-solve and post-help explanation (P1-13).** The programme's third
and fifth independence checks: «бірнеше күннен кейін сол есепті көмексіз қайта
шешуге міндетті», and re-solving old problems weekly. Neither exists. Both need
review scheduling — a queue, a due date, a way to re-open a settled block — that
the product has no shape for yet. I did not fake it with a `delayed_resolve`
enum value that nothing schedules, which is what it looked like before.

**2. Explanation is still thin (70/30).** It went from ~7 minutes to ~20 for the
month, against a platform share of roughly 33 minutes implied by the PDF's own
arithmetic (~5 h/year of short explanation across nine months). Better, not
done. The four worked examples are the shape the rest should follow.

**3. The publication gate is still documented but not enforced.** `types.ts` says
students see `published` and nothing else; every runtime gate is `!== "draft"`,
and September ships at `implemented` with 0 validated / 0 published. **I
deliberately did not mark it published.** That field asserts a human reviewed the
content, and me setting it would make it mean nothing. Either a reviewer sets it
and the gate is tightened to `published`, or the field should be deleted as
decoration. That is the school's call, not a code change.

Two smaller ones, both recorded rather than fixed: a support learner's `m1.l8` is
now a single block (both challenges are core+advanced, correctly, but the lesson
reads thin for that route), and Nova is told a lesson's skills but never which
Python constructs have actually been taught — so a level-4 hint could still reach
for something September has not introduced.

---

# 8. WHAT I CHANGED, AND WHAT I DID NOT

Changed: the September content file, the block type definitions, a new
public-payload boundary, the answer-checking and grading path, the lesson and
assessment renderers, the hint ladder, the store and two migrations, four routes,
and eight test files.

**Not changed, on purpose:**

- Tasks the audit rated PASS were left alone unless a shared fix reached them.
  `m1.p1`, `m1.p3`, `m1.p5`, `m1.p7`, `m1.l4.b4`, `m1.l5.b2`, `m1.l7.b2` and the
  rest are byte-identical.
- No test was loosened to go green. Four tests were rewritten, and every one of
  them had been asserting a defect: three encoded the old override behaviour
  ("honours an explicit override in one tap" from a cold start — that test
  passing is *how* the hole survived), and one asserted that differentiation was
  subtractive, which is the thing the programme rules out. Each rewrite says in
  its comment what it used to assert and why that was wrong.
- The curriculum was not reordered beyond the one confirmed prerequisite
  violation, and no learning objective was invented.
- `src/lib/progress.ts` and the gameboard read path were left intact so the board
  still updates instantly; the server write is a record, not a replacement.

---

# 9. RELEASE DECISION

September can go in front of a real Grade 9 class, with two conditions.

**Before the first lesson:** set `EXEC_PROVIDER=piston` and `PISTON_URL` in the
production environment. The app now refuses to boot without them — which is the
point — but that refusal will be someone's first surprise otherwise.

**Before the first monthly check:** have a human reviewer read the month and set
`status: "published"`, then tighten the runtime gate from `!== "draft"` to
`=== "published"`. The content is verified correct by execution; it has not been
signed off by a person, and the difference matters for a paying school.

Everything else in §7 should land before the second month, not the first.

---

# 10. SECOND PASS — P2 FINDINGS

The forensic workflow finished after the first remediation pass and returned the
full verified P2 set. Nine were closed; the rest are recorded in §7 or were
downgraded by their verifier. None of these could mark a learner wrong — they
degrade teaching quality rather than break it.

| Finding | Status | What changed |
|---|---|---|
| `m1.l5.b4`'s diagnostic mapping was keyed to the **correct** line, so it could never fire | **FIXED** | Re-keyed to line 4. Blaming the branch that *printed* the wrong answer, rather than the one that let the value through, is the real misconception — and now it is named |
| `m1.l6.b2` option o4 (`10 <= x <= 20 and not x`) is false for every integer, and the only place chained comparison or truthiness appears in a month teaching neither | **FIXED** | Replaced with `x >= 20 and x <= 10` — swapped bounds, a slip beginners actually make, and disprovable by testing one value |
| The correct answer sat **first in 4 of 8** option blocks; options were never shuffled | **FIXED** | Deterministic shuffle seeded by block id, in the public projection. Now 2 of 8. Presentational only — the key never leaves the server, so grading cannot be affected |
| `m1.l4.b2`'s trace named line 4 in its step list, revealing which branch ran before the learner traced anything | **FIXED** | The branch now turns on `7 % 3`, so `x` must be computed at step 2 before the branch is knowable. The step list still names the line, but only after the work is done |
| `m1.l6.b3` (leap year) claimed `curriculum-derived, pdfPage: 7` — it appears nowhere in the PDF's September list | **FIXED** | Re-declared `product-authored`, with `m1.l6.b4` which depends on it. The validator only ever checked that a page number *exists* |
| The gameboard advertised `expectedTaskCount` — the **promise** — while `monthTaskCount` computed the truth and was called by nothing | **FIXED** | The board now prints the built count. The promised-vs-built gap belongs in the validator and the teacher console, where someone can act on it |
| `source-of-truth.ts` wrote «ішарадан» for the PDF's «ишарадан» — a non-existent word, in the file that exists to quote verbatim | **FIXED** | Corrected. Also corrected "the nine per-month figures" → eight; the PDF states no May count, which is why `month-09-may.ts` derives its own and says so |
| Kazakh Russianisms: «конфет» (→ «кәмпит»), «Осьте» (→ «өстің бойында»); ungrammatical «10-нан 20-ға дейін аралықта» | **FIXED** | All three corrected |
| Russian: «Что смотрит учитель», «выполняешь устно учителю», «Этот раз не зачтётся», and «Ещё 1 скрытых теста» hardcoding one plural form while a correct `plural()` sat unused two files away | **FIXED** | Grammar corrected; the plural helper is now exported from `labels.ts` and shared, so `evidence.ts` and the hidden-test counter cannot disagree |

**Still open from the P2 set**, deliberately: `test_case` blocks accept one literal
string, so a learner who finds a different genuinely-breaking input still settles
`unmeasured` (it is not marked wrong, which is the important half); and Nova is
told a lesson's skills but not which Python constructs have been taught.

One test assertion was rewritten in this pass — `error-dictionary.test.ts`
asserted a block declared *exactly two* failure classes, which broke when a third
distractor was given a class of its own. That is content improving, not
regressing, so the assertion now checks the property it was for (more than one
class, only the matching one returned) rather than a hardcoded count.

**Final state:** `npm run check` green — 0 lint errors, typecheck clean, validator
clean, 260 content tests, 661 unit tests, build successful, 0 secrets in the
client bundle, and 0 answer-key leaks across all built output.
