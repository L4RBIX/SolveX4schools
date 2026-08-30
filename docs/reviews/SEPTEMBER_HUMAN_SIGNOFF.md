# September — Reviewer Sign-off

For the teacher or curriculum reviewer who decides whether this material goes in
front of a Grade 9 class. You do not need to read any code or any tests.

Budget about **90 minutes**: an hour opening the lessons as a student, half an
hour on this document.

---

## What you are approving

**September: «Бірінші бағдарлама — енгізу, есептеу, шарттар және жауапты
шығару»**, the first month of the approved nine-month programme.

| | |
|---|---|
| Lessons | **12**, in 5 units |
| Tasks students do | **54** |
| Monthly check | 4 blocks, 20 minutes |
| Languages | Kazakh and Russian, complete |
| Content version | `1f3e4640…` (the full hash is in `docs/releases/SEPTEMBER_V1_FREEZE.md`) |

Your approval is recorded against **that version**. If anyone edits a task
afterwards, the approval lapses automatically and students stop being served the
month until it is reviewed again. You are not signing off on "September" in the
abstract — you are signing off on exactly what you read.

---

## How to review it

### 1. Work through it as a student (about an hour)

Ask for a student account on the pilot class, sign in, and do the month in
order. That is the review. Everything below is context for what you will see.

The lessons, in teaching order:

| # | Lesson | What it teaches |
|---|---|---|
| 1 | Бірінші бағдарлама | `print`, reading a number, converting it |
| 2 | Мәтінмен жұмыс | Reading text, and when `int()` is wrong |
| 3 | Бір жолдағы бірнеше сан | Splitting a line into several numbers |
| 4 | Екі түрлі бөлу | `/` vs `//` — whole and fractional answers |
| 5 | Бүтін бөлу және қалдық | `//` and `%` together |
| 6 | if және else | Choosing between two branches |
| 7 | elif тізбегі | Three or more cases |
| 8 | Пайыз және жеңілдік | Percentages, discounts, discount bands |
| 9 | Логикалық амалдар | `and`, `or`, `not` |
| 10 | Шекараны тексеру | Where conditions go wrong: `>` vs `>=` |
| 11 | Күрделірек есептер | Combining conditions |
| 12 | Өз бетіңмен шығар | Nine independent problems |

Then the monthly check.

### 2. Questions worth holding while you work

- Does each lesson introduce **one** idea, and is the explanation short enough?
- Is anything asked before it has been taught?
- Would a 14-year-old with no programming background understand the wording —
  in **both** languages? (If you read only one, say so; the other needs a reader.)
- Are the Kazakh and Russian versions asking the **same** question?
- Is the difficulty right for the first month of a school club?
- Does the monthly check measure what the programme says it should?

### 3. The three levels

Every student is on one of three routes through the same month.

| Route | Tasks | Blank-editor coding | Guided (assemble / complete / fix) |
|---|---|---|---|
| Қолдау (support) | 45 | 18 | **7** |
| Негізгі (core) | 48 | 25 | 3 |
| Тереңдетілген (advanced) | 50 | 27 | 3 |

Support is **not** "the same month with the hard problems removed": four
blank-editor tasks are replaced by a scaffolded version of the *same* problem, so
a support student meets every idea the month teaches. Worth checking on one or
two: `m1.l2.b3`, `m1.l5.b3`, `m1.l6.b3`, `m1.l7.b4` each have a support twin.

### 4. The monthly check

Twenty minutes, four parts:

1. **An unseen problem** — read two numbers, compute, use a condition. Graded by
   running it.
2. **Fix someone else's program** — the bug is an `and`/`or` swap. Graded by
   running it.
3. **A written explanation** — why an integer type, what `//` changes, where the
   boundary falls, what a very large value would do. **Never machine-scored.**
   You read it.
4. **A short oral explanation** to you.

Parts 3 and 4 are the ones a machine deliberately does not judge.

---

## Known limitations — please read before signing

These are real and were found by audit. None makes a task wrong; all are
disclosed so your approval is informed.

1. **Explanation is thin.** About 20 minutes of written explanation across the
   month, against roughly 33 the programme's own arithmetic implies. The four
   worked examples show the intended shape; the rest of the lessons are shorter
   than that. The teacher-led sessions carry more of the explanation than the
   platform does.

2. **Delayed re-solve is new and untested with real students.** A task solved
   with help comes back after five days to be re-solved unaided. The five days
   is a product default chosen to fit a one-month pilot, **not** a research
   finding, and we say so rather than dressing it up.

3. **`test_case` tasks accept one specific answer.** A student who finds a
   different genuinely-breaking input is recorded as *unmeasured* rather than
   wrong — they are not penalised, but they are not credited either.

4. **Support students see a short lesson 11.** Both of that lesson's challenges
   are core/advanced by design, so the support route is thin there.

5. **Five tasks use a symbol the month never shows on screen.** `m1.l6.b3` and
   its support twin need `!=`; `m1.l8.b2` and the assessment's first problem need
   `<=`; `m1.p8` needs `abs()` and a decimal. Comparison operators *are* a
   September skill, so this may be fine — but no code the student is shown
   contains them. **Worth your judgement specifically.**

6. **Signals in the teacher console are calibrated against a simulated class,
   not a real one.** Expect to recalibrate after the first month.

---

## What has been verified without you

So you know what your review adds, rather than duplicating it:

- Every reference solution is executed against every one of its own test cases
  on every build. A wrong answer key cannot ship.
- Answer keys and hidden tests are not in the page source.
- Kazakh and Russian are both present on all 97 content strings, and no Russian
  field is a copy of the Kazakh.
- The assessment is reachable, gradable and completable.

What none of that can tell you is whether the material **teaches well**. That is
what you are for.

---

## Sign-off

| Field | |
|---|---|
| Reviewer name | |
| Role | |
| Date reviewed | |
| Content version reviewed | `1f3e4640…` |
| Languages read | ☐ Kazakh ☐ Russian |
| Lessons opened as a student | |
| Monthly check attempted | ☐ yes ☐ no |

**Decision:**

☐ **Approve** — this may go in front of a Grade 9 class.

☐ **Approve with the limitations above noted** — and these additional notes:

☐ **Do not approve** — because:

<br>

**Notes / required changes:**

<br><br><br>

---

## To record your approval

When you are ready, on the deployment host:

```
npm run curriculum:publish -- \
  --month 1 \
  --reviewer <your-username> \
  --note "<a sentence about what you reviewed>" \
  --i-am-the-reviewer
```

It will show you the content hash, ask for your password, and record **you** as
the reviewer with a timestamp. Only a teacher or admin account can do this.

The `--i-am-the-reviewer` flag exists because a publish step that can be
scripted is one an automation will eventually perform. Approving material for
fourteen-year-olds is a human act, and the command refuses without it.

Until you run this, students see "this month is not open yet" — which is the
correct state for material nobody has read.
