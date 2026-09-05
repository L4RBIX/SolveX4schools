# September needs one human approval

**Status:** the release is deployed. September is PUBLISHED-but-lapsed and will
not open for a learner until a teacher re-approves it. Months 2–9 are
unaffected and their approvals still match.

## The numbers

| | |
|---|---|
| OLD HASH (live in production) | `c257be158b6ab5f59df637c195f2cea9a945e93ce48f06b6da1b4a577ef9b18c` |
| NEW HASH (this release) | `1a74e50bae78f388cbb7fcc14b1dcc22b7813f6f35df0bd37ca2298d4a2acfc0` |
| Months whose hash changed | **1 only.** 2–9 are byte-identical and stay open. |

## Why it changed

September was rebuilt for a learner who has never programmed. The month object
is different, so its sha256 is different, and an approval is recorded against a
hash — that is the mechanism working, not a fault.

What a reviewer is being asked to approve:

1. **`m1.l0` — a new first lesson, no code.** What a program is; what a compiler
   does (`наш код → компилятор → готовая программа → результат`); and the three
   different ways a program can be wrong — compile error, runtime error, wrong
   answer. Two multiple-choice checks.
2. **`m1.l1` — the frame explained.** A new block takes `#include <iostream>`,
   `using namespace std;`, `int main()`, `{ }`, `;` and `return 0;` one at a
   time, at first-week depth. `using namespace std;` had no explanation anywhere
   in the month before this. The old text told the learner to «прими как
   данность» and to «пиши эти четыре строки всегда одинаково»; that is gone.
3. **`m1.l13` — a new variables lesson**, placed before anything reads input:
   `int age = 14;` declared, given a value, printed. One coding task
   (`m1.l13.b4`, fixed output — `cin` has not been taught yet, so the program
   has nothing to vary against).
4. **Seven existing tasks gained a starter frame** — `m1.l10.b5`, `m1.l5.b3`,
   `m1.l5.b3b`, `m1.l12.b2`, `m1.l12.b3`, `m1.l6.b2b`, `m1.l6.b3`. Each opened a
   blank editor before the month had handed the frame over.
5. **`m1.l7` gained a block that announces the hand-over** — from that lesson on
   the learner writes the whole program, and the month now says so.

Nothing else in September changed: no case was removed, no reference solution
was altered, no task was made easier or harder.

## What a human needs to check

- The two new lessons say true things about compilers, in language a
  fourteen-year-old can read, in **both** Kazakh and Russian.
- The Kazakh is natural. A machine consistency lint passed
  (`npm run curriculum:kk-review`, 146 strings, no mechanical issues,
  terminology consistent) — **that is not a native review and does not claim to
  be.**
- The order is right for this class: model → first program → variables → input.

## The command

Run by a teacher or admin of the school, with their own password, which the
script reads from the terminal and never from a flag:

```bash
DATABASE_URL=… npx tsx --conditions=react-server scripts/publish-curriculum.ts \
  --school innovation-tech --month 1 --reviewer grade-9a-teacher \
  --note "Beginner onboarding rebuild, reviewed <date>" --i-am-the-reviewer
```

Verify afterwards:

```sql
select month_index, left(curriculum_hash, 12), withdrawn_at is null as live
  from curriculum_publications where month_index = 1 order by published_at desc;
```

The newest row must read `1a74e50bae78`.

## Until then

A learner signing in reaches `/home`; September's lessons answer 404 by the
publication gate. No learner data is affected — the two recorded completions and
all 102 events are untouched — and re-approval re-opens the month with the work
intact.
