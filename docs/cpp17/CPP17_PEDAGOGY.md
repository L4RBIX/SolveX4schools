# September in C++17, for someone who has never programmed

`PROGRAMME_FACTS.priorExperienceRequired` is `false`. The audience is 14–15,
«нөлден бастайды», two 45-minute sessions a week. That fact is what makes this
document necessary: the same objectives in C++ are not the same lessons.

## What did not change

The approved objectives stay exactly as they are — input and output, reading
data, numbers, arithmetic, integer and floating behaviour, division, remainder,
comparison, conditions, logical operators. p.7's bound stays too: procedural, no
OOP. Year 1 C++ is `int main()`, `cin`/`cout`, variables, free functions and
recursion. No classes, no inheritance, no templates the learner writes, no move
semantics, no pointers as a topic.

## What did change, and why it is not a translation

Python's first line does something. C++'s first four lines do nothing the
learner can see:

```
print("Сәлем!")
```
```
#include <iostream>
using namespace std;
int main() {
    cout << "Сәлем!";
    return 0;
}
```

Everything except line four is ceremony to a beginner, and there are five new
ideas in it — a preprocessor directive, a namespace, a function, braces,
semicolons — none of which they can be taught before their first program without
the first lesson becoming a vocabulary lecture.

So the ceremony is **given, not taught, and then earned back**. The learner
writes real C++ from lesson one; the frame arrives already written, and each
piece of it is explained at the lesson where it first matters. Nothing is
introduced before it is needed, and nothing is required before it is introduced.

## The prerequisite graph

Read as: nothing on the right may appear in a task the learner writes until the
lesson on the left has taught it. Everything above the line a learner is
currently at may appear **inside a scaffold they do not have to write**.

| First taught | Construct | First required of the learner |
|---|---|---|
| l1 | `cout <<`, string literal, `;` | l1 |
| l1 | `#include <iostream>`, `int main`, `{}`, `return 0` | *given as scaffold — required l7* |
| l2 | `cout` of an arithmetic expression | l2 |
| l2 | `+ - *` on whole numbers | l2 |
| l3 | `int` declaration, assignment | l3 |
| l3 | `cin >>` | l3 |
| l4 | `/` on `int` (truncation), `%` | l4 |
| l5 | `double`, `/` on `double` | l5 |
| l5 | mixing `int` and `double` | l5 |
| l6 | `long long`, when `int` is not enough | l6 |
| l7 | writing the whole frame unaided | l7 |
| l8 | `< <= > >= == !=` | l8 |
| l9 | `if`, `else` | l9 |
| l10 | `else if` | l10 |
| l11 | `&&`, `\|\|`, `!` | l11 |
| l12 | everything, unaided, contest-shaped | l12 |

Two consequences worth stating:

- **`/` is taught twice**, at l4 on `int` and at l5 on `double`, because in C++
  they are different operations wearing the same symbol. `7 / 2` is `3`. A
  learner who meets that as a surprise in a task has been failed by the sequence.
- **`long long` is taught at l6**, before any task whose bounds need it. The
  audit rule is absolute: if a task's stated bounds can exceed `2^31−1`, either
  it comes after l6 or its bounds shrink. Never a task that overflows silently.

## The five scaffold stages

Every task declares which stage it is at, and a stage never goes backwards
within a lesson.

**Stage 1 — predict or change one expression.** The whole program is on screen
and correct. The learner says what it prints, or edits a single expression.
Teaches reading before writing.

```cpp
#include <iostream>
using namespace std;
int main() {
    cout << 2 + 2;      // ← the only thing that changes
    return 0;
}
```

**Stage 2 — write one statement.** The frame is given and locked. The learner
writes the body line.

```cpp
int main() {
    // Мұнда жаз / Напиши здесь
    return 0;
}
```

**Stage 3 — declare and read.** The learner adds variables and `cin` inside the
given frame.

**Stage 4 — write a condition.** The frame and the reading are given; the
learner writes the `if`.

**Stage 5 — the whole of `main`.** From l7. The learner writes everything
between the braces, and from l12 the braces too.

By l12 a learner writes this unaided, which is the acceptance bar for the month:

```cpp
#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    if (a % b == 0) cout << "YES";
    else cout << "NO";
    return 0;
}
```

## Output style

Competitive style from the first lesson, because unlearning it later is harder
than learning it now:

```cpp
cin >> n;
cout << n * n;
```

Not `cout << "Введите число: ";`. A judge compares bytes, and a decorative
prompt is a wrong answer. Where a lesson is genuinely about talking to a human,
it says so.

## `#include <bits/stdc++.h>`

Taught in September only as something they will *see*, never as the default.
Measured: it costs **~4 s** per browser Run against **~0.9 s** for
`<iostream>` alone, because it really does pull in 76 headers. A beginner
pressing Run every thirty seconds should not wait four seconds for a header they
do not use. It becomes reasonable when the header count stops being the dominant
cost — that is a contest habit, and contests are May.

## The semantic traps, all of them

Every task carried across from the Python course must be re-checked against
these. This is the checklist §K applies per task; it is not optional, and each
one changes an expected output rather than merely a syntax.

| | Python | C++17 | Where it bites |
|---|---|---|---|
| `7 / 2` | `3.5` | **`3`** | every division task |
| `-7 / 2` | `-4` (floors) | **`-3`** (truncates) | anything with negatives |
| `-7 % 2` | `1` | **`-1`** | parity and remainder tasks |
| big integers | unbounded | **overflows at 2^31−1** | any product or sum of inputs |
| `int` vs text | dynamic | `cin >> n` on non-numeric **fails silently** | malformed-input tasks |
| `"5" + 5` | TypeError | does not compile | type-confusion tasks |
| truthiness | `if x:` | needs a real comparison | condition tasks |
| division by zero | exception | **undefined behaviour** | any `/` or `%` by an input |

The last one deserves its own sentence: a Python task that expected
`ZeroDivisionError` has no C++ equivalent to test, because the behaviour is not
defined. Such tasks are re-authored to guard the divisor, not translated.

Verified live on both engines, not assumed: `-7/2 → -3`, `-7%2 → -1`, on Clang 8
in the browser and GCC 14 on Judge0. See `CPP17_JUDGE_PARITY.md`.

## What the learner is not asked to understand yet

Named here so nobody adds them by accident: pointers, references as a topic,
`new`/`delete`, classes, headers of their own, `const` correctness, templates,
iterators as an abstraction (`v.begin()` is shown as an incantation `sort` needs,
at the point `sort` is taught), lambdas, `auto` beyond range-`for`, and undefined
behaviour as a concept beyond "do not divide by zero".

## Open

The Kazakh and Russian in the migrated content is **NOT reviewed**. Native
Kazakh linguistic review remains NOT PERFORMED, and C++ adds vocabulary the
Python course never needed — «компиляция», «нүктелі үтір», «айнымалы түрі» —
that a native reviewer has not yet seen. The timing estimates inherited from the
Python lessons are also now wrong in an unknown direction: C++ adds typing and a
compile step. Real student timing validation remains NOT PERFORMED.
