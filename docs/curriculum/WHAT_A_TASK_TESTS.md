# What a task tests

A graded task tests **correct behaviour**. It does not test whether the learner wrote the same algorithm as the reference solution.

This document exists because the distinction decides every finding in `FALSE_ACCEPT_REGISTER.md`, and getting it wrong in either direction produces a bad curriculum:

- **Too permissive** and a wrong program scores full marks. March's monthly check accepted a depth-first fill labelling cells with recursion depth, in the month whose entire subject is that a wave measures distance and a walk does not.
- **Too strict** and a learner who solved the problem correctly, by a route the author did not think of, is told they are wrong. That is worse, because it teaches a fourteen-year-old that programming is guessing what the teacher wanted.

## The rule

A program that produces correct output on every input inside the stated constraints **passes**. Full stop, regardless of method.

There is exactly one exception, and it is narrow: when the task's own prompt or the month's stated learning objective **explicitly requires a particular technique**, a program that passes without using it has not met the requirement.

The exception has to be earned by something written down. Not by the reference solution's shape, not by the lesson it sits in, not by what the author had in mind — by text the learner can read.

## Worked examples of the distinction

**A valid alternative, which must pass.** `m4.l3.b6` asks for a list printed in ascending order. The reference calls `.sort()`. A learner who writes an insertion sort by hand is correct and must be graded correct; the prompt asks for the output, and nothing in it names a method. So must a learner who sorts with `sorted()` and prints a slice.

**A false accept, which must fail.** `m7.as.b1` asks for the number of steps to the nearest exit. A depth-first fill labels each cell with how far along one arbitrary path it happened to be reached and takes the minimum over border cells. On the map `#..# / .... / #... / .#..` starting at (2,2) it answers 2 where the answer is 1. This is not a different route to the right answer — it is simply wrong, and it would have been a false accept even with no technique requirement at all.

**The exception, properly earned.** `m8.as.b2` states `1 ≤ n ≤ 100000` in its own prompt and adds, in its own text, that a solution recomputing each column will not fit the clock. A memoised recursion is correct in complexity and dies of `RecursionError` at n = 1200. It has not met a requirement the prompt states in words the learner reads. Note what makes this legitimate: the constraint is in the prompt, not in the author's head, and the fix is a case that reaches the stated size rather than a rule about which construct to use.

**Not the exception.** A task in December whose reference builds a prefix table, where the prompt asks only for the answers to some queries and states no size that rules out recomputing. A learner who recomputes is correct. If the curriculum wants the prefix table, the task must say so, or state a size that forces it — and the case set must reach that size.

## How this shows up in the tooling

`tests/school/wrong-solution-fixtures.ts` carries an `alternative` field for a verified correct algorithm, and `wrong-solutions-fail.test.ts` asserts it **passes** every declared case. That assertion exists to catch the opposite defect from the rest of the file: a case set over-fitted to the reference, rejecting good work. Nothing else in the suite would notice.

Of the sixteen recorded false accepts, fourteen are simply wrong programs and two are the narrow exception. Both of the two say so in their own prompt.

## For whoever writes the next task

Three questions, in order:

1. **Is there an input inside my stated constraints where a plausible wrong program disagrees with mine?** If yes, that input belongs in the case set. This is the question that would have caught fifteen of the sixteen.
2. **Does my prompt state every constraint my case set assumes?** April's assessment stated n up to 100000 and tested n up to 61. September's boundary work is the whole lesson on why the case you leave out is the one that matters.
3. **Would a correct alternative algorithm pass?** Write one and run it. If it fails, either the case set is wrong or the prompt is missing the requirement that makes it fail — and in that second case, write the requirement down.
