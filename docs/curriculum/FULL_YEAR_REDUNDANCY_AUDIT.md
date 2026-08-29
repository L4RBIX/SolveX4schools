# Full-year redundancy audit

Every task on the required path was asked one question:

> If this task disappeared from the required path, what unique educational evidence or progression role would be lost?

521 required tasks, one owner per month, **no target size**. A month where nothing should move was an acceptable result and two months returned one.

## The standard a redundancy verdict had to meet

A verdict of REDUNDANT was admissible only when it named **specific other task IDs** that already carry the same evidence, and those had to be:

- on the **same route** — a `support` task is not covered by one the support learner never sees;
- **core**, not already-banked and not contest;
- **earlier or in the same lesson** — a task cannot be made spare by one the learner has not met yet;
- and a **different block type was usually a different task**. `find_bug` on a loop and `write_code` on a loop ask for different things.

A task whose removal would leave a skill with no from-nothing evidence on the required path stayed, whatever else was true of it. So did a task forcing a named boundary case its siblings do not — the empty input, the single element, the tie, the all-negative list.

Three of those rules are now enforced as tests, because the first pass broke one of them. `tests/school/bank-is-optional.test.ts` fails if a justification is under 40 characters, names no sibling, names one that arrives later, or names the task it is attached to.

## Result

| Month | Required tasks | Findings | Applied |
|---|---|---|---|
| 1 Қыркүйек | 50 | 2 | 0 — held |
| 2 Қазан | 72 | 1 | 1 |
| 3 Қараша | 71 | 4 | 4 |
| 4 Желтоқсан | 63 | 1 | 1 |
| 5 Қаңтар | 69 | 1 | 1 |
| 6 Ақпан | 62 | 2 | 2 |
| 7 Наурыз | 56 | 5 | 5 |
| 8 Сәуір | 51 | 1 | 0 — rejected |
| 9 Мамыр | 27 | 0 | 0 |
| **Total** | **521** | **17** | **14** |

**3.3% of the required path came out.** Nobody was aiming at a number.

## The three not applied

**`m1.p2` and `m1.p4` — held for a human.** Both findings are sound and both name earlier siblings correctly: `m1.p2`'s `n % 10` is contained by `m1.l3.b4`, which already requires `%` on a read integer with the divisor supplied from the story; `m1.p4` is `m1.l3.b5`'s program with the story changed and a strict subset of its cases. They are not applied because September is the only month a human has audited, remediated and accepted, and it is the baseline the relative-density reading in `FULL_YEAR_WORKLOAD.md` rests on.

The bias this introduces is worth naming rather than hiding: an uncut September makes every other month look lighter than it is, so this errs toward pruning *less* elsewhere.

**`m8.p5` — rejected on the merits.** The finding cites `m8.l5.b6` as covering it, and `m8.l5.b6` is a `find_bug`: the learner repairs a program there, they do not produce one. April's other from-nothing running-best scan, `m8.l5.b8`, uses the empty-allowed convention where an all-negative list answers 0. `m8.p5` uses the non-empty convention, where it answers the largest element — and that has no other from-nothing home on the required path. A different block type is usually a different task, which is a rule written for the auditors and not waivable for a tidier count.

## A correction the audit forced

`m2.l6.b8` had been banked in an earlier October pass on the grounds that `m2.l8.b7` covers it. It arrives **two lessons later**, which the ordering rule forbids — and the reasoning was wrong on the merits besides. `m2.l6.b8` reverses a word by prepending in a forward loop, `r = c + r`; `m2.l8.b7` walks backwards by index and explicitly forbids `reversed()`, `sorted()` and slicing because the backward walk is the lesson. Different mechanism, different constructs. Returned to core.

That earlier October pass is the reason this re-audit exists. It was triggered by October being the workload outlier, which is a target dressed as a finding.

## Everything now in the bank

Absent means core. These 23 carry a `bank` field, and the field is a real exemption: `requirementFor` asks nothing of them, and a learner who skips every one of them completes every lesson.

| Task | Type | Route | Role | Why it is spare |
|---|---|---|---|---|
| `m2.l6.b3` | multiple_choice | all | extra_practice | m2.l4.b4 is this question already: which expression gives the last element, with len versus len - 1 as the same pair of options and the same off-by-one as the mapped failure. Only the sequence type changes, and m2.l6.b1 — the concept card one screen earlier — states that transfer outright, so the block asks the learner to confirm what they have just been told rather than to decide anything. |
| `m2.l7.b9` | write_code | advanced | extension | m2.l7.b8 already establishes the nested loop that draws a triangle, and it is the PDF's named «символдардан өрнек». A centred triangle adds leading-space arithmetic on top of the same two loops — real extension for the advanced route, and not something the month's outcomes need. |
| `m2.l8.b8` | challenge | core/advanced | extra_practice | Carrying two accumulators through one pass is established by m2.l5.b7, which prints a sum and an average from a single traversal. Largest-and-second-largest is a harder instance of that pattern, not a new one, and its own boundary case (duplicate maxima) is covered by the cases rather than by a second task. |
| `m2.p1` | write_code | all | extra_practice | Counting with a condition over a list is established by m2.l1.b9, which counts the multiples of k in a range, and exercised again by m2.l5.b8. This adds a second counter to the same loop and no new decision. |
| `m2.p3` | write_code | all | extra_practice | The divisor loop and its n // 2 + 1 bound are established at m2.l2.b6, which counts divisors, and again at m2.l8.b6, which finds the smallest. Summing them instead of counting them is the accumulator-versus-counter distinction m2.l2 spends its concept block on — worth practising, not worth requiring a third divisor task. |
| `m2.p5` | write_code | all | extra_practice | Walking a word and counting one character is m2.l6.b4, a fill_blank on the vowel count, and m2.l6.b6 asks for the last vowel's index. Counting an arbitrary given letter is the same traversal with the target read from input. |
| `m2.p7` | write_code | all | extra_practice | m2.l9.b9 asks for the POSITION of the first element greater than x, including the -1 case. This asks for the smallest such VALUE. Same scan, same boundary, same -1 convention. |
| `m2.p8` | write_code | all | extra_practice | m2.l5.b8 counts the elements strictly above the average; this sums them. Identical two-pass structure and identical boundary decision (strictly greater), differing only in what the second pass accumulates. |
| `m2.p9` | write_code | core/advanced | extra_practice | m2.l5.b9 is the longest run of equal neighbours, on the advanced route. This is the longest strictly increasing run. The same neighbour comparison with the operator changed, and the core route already meets run-length reasoning at m2.l9.b6. |
| `m2.p10` | write_code | advanced | extension | Counting pairs (i<j) whose sum is divisible by k needs a nested loop over pairs, which m2.l7 teaches and no core October task requires. Genuinely beyond the month rather than redundant with it — and October is already the year's heaviest month against the September calibration. |
| `m3.p3` | write_code | all | extra_practice | The same digit-sum helper over the same two numbers from the same input line, on the same eight test inputs as m3.l3.b9. What changes is that the caller prints the larger sum instead of a verdict word, and m3.l3.b8 already establishes writing digit_sum from nothing on every route. |
| `m3.p4` | write_code | all | extra_practice | m3.l8.b6 is the programme's own «максимум мен минимум функциясы» and already asks every route to write largest(a) from nothing plus its mirror, over the same boundaries — singleton, all equal, all negative, extreme at each end — under the same ban on builtins. This asks for half of that program. m3.l8.b5 has already fixed the start value and the comparison direction. |
| `m3.p6` | write_code | all | extra_practice | m3.l8.b7 already requires is_palindrome(word) returning 1/0 with the caller owning yes/no, across the same boundaries: the one-letter word whose loop never runs, even and odd lengths, ends matching where the middle does not. m3.p5 already establishes calling a returning helper once per line of input and already catches state leaking between calls. This is the two of them together. |
| `m3.p8` | write_code | all | extra_practice | The same two helpers over the same one-line list, the same forbidden builtins, the same boundary families as m3.l8.b6. Only the caller's last line differs — a subtraction rather than the two returned values printed side by side — and m3.l8.b6 already requires both returns to be consumed in a single expression. |
| `m4.p9` | write_code | core/advanced | extra_practice | Both quantities are produced from nothing earlier on this route and in a harder form: m4.l6.b6 totals the cheapest k from a sorted list, and m4.l6.b8 computes the cheapest k and the dearest k of one sorted list in a single program and then adds the 2k > n overlap boundary this task has no equivalent of. Dropping the query loop and the boundary leaves no decision this route has not already made. |
| `m5.l2.b3` | trace_code | all | extra_practice | m5.l1.b5 already has the learner hand-trace a closed-interval search for the same missing target, recording left, right and mid on every pass and writing the crossed exit row — the row where left also lands exactly on the count of elements below x. This is that program on a shorter list. Lesson 2's own subject, the half-open form and the pairing of condition with shift, is carried by its other blocks and not by this one. |
| `m6.l2.b8` | write_code | core/advanced | extra_practice | m6.l1.b9's reference solution is this program with the target sum in place of the literal 0 — the same three loops, the same i < j < k bounds, the same counter, differing only in variable names. It is earlier and on the same route, and its hidden cases already are the zero-sum triple problem, negatives included. The size argument this prompt adds is stated to the learner rather than produced by them. |
| `m6.l2.b8s` | fill_blank | support | extra_practice | m6.l1.b9s asks the same support learner to build the same three-loop target-sum counter, and writing that loop from a starter strictly contains this card's three blanks. It is earlier on the support route and its own cases are this sum-zero problem. |
| `m7.l2.b10` | write_code | core/advanced | extra_practice | This program is m7.l2.b8's scan-and-launch control structure wrapped around m7.l2.b9's returning fill, line for line. The only statement neither already required is the running maximum, which December teaches, and the all-walls boundary is already m7.l2.b8's empty case. |
| `m7.l2.b10s` | fill_blank | support | extra_practice | Support sees both m7.l2.b8 and m7.l2.b9 — both on every route, both earlier — and writes the visited mark and the recursive call from nothing in each, so two of the three blanks ask for strictly less than the same learner has already produced twice. |
| `m7.l5.b7` | fill_blank | all | extra_practice | The four blanks are the neighbour guard the learner already completed at m7.l2.b7, and the card one screen earlier, m7.l5.b6, prints that guard verbatim as its correct answer. Swapping recursion for a queue around the blanks changes the surrounding program but not what is being asked for. |
| `m7.p1` | write_code | all | extra_practice | Reading n and m plus n rows in this format is written from nothing at m7.l1.b9, and the nested scan with the same test and counter is written from nothing at m7.l2.b8 — both earlier, both on every route. This is the union of the two with nothing added, and three of its cases are already m7.l2.b8's. |
| `m7.p10` | write_code | advanced | extra_practice | The same problem as m7.l4.b9: a shortest route forced through a named cell, two waves from two starts, -1 when either leg fails. Every learner on this advanced route has already solved m7.l4.b9 from nothing. The only addition is a wall-cell guard, already forced by m7.p7 earlier in this same lesson. |

Two are `extension` rather than `extra_practice` — they go beyond the month's stated outcomes rather than repeating something inside them, and are exempt from the name-a-sibling rule because a task justified by what it *needs* cannot be justified by what already covers it.
