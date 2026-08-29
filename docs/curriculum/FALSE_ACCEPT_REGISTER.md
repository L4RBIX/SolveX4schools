# False accepts — the register

Sixteen programs that were **wrong** and scored full marks. Each is preserved as an executable fixture in `tests/school/wrong-solution-fixtures.ts`, run on every test run by `tests/school/wrong-solutions-fail.test.ts`, and this table is generated from those fixtures by `npx tsx scripts/wrong-solution-report.ts --markdown`.

The register cannot drift from the guarantee: if a guard case is removed or weakened, the test goes red before this document goes stale.

## What counts as a false accept, and what does not

A task tests **correct behaviour**. It does not test whether the learner wrote the same algorithm as the reference.

So an alternative correct algorithm passing is the system working, not a defect. A program earns a place here only when one of these holds:

1. **It is genuinely wrong** — it produces an incorrect answer on some input inside the task's stated constraints. Fourteen of the sixteen are this kind.
2. **The task explicitly requires a technique and the program passes without it.** Two are this kind, and both say so in their own prompt or their month's stated outcome.

The second category is narrow on purpose, because it is the one that can be abused to reject good work. `m7.as.b1` is its clearest case: the prompt asks for the distance to the nearest exit, the month's entire subject is that a wave measures distance and a walk does not, and the same assessment asks the learner to *prove* their number is shortest. A depth-first fill labelling cells with recursion depth is not a different route to the right answer — it is the misconception March exists to remove, scoring full marks. `m8.as.b2` is the other: the prompt states n up to 100000 and warns in its own text that a solution recomputing each column will not fit the clock, so a method that dies at n = 1200 has not met the stated requirement however elegant it is.

Everything else in the table is simply wrong.

## The register

| Task | Wrong approach | Witness | Reference | Wrong | Killed by |
|---|---|---|---|---|---|
| `m7.as.b1` **(monthly check)** | A depth-first flood fill that labels each cell with its own recursion depth, then takes the minimum over border cells. | `"4 4\n#..#\n....\n#...\n.#..\n2 2"` | `1` | `2` | `"4 4\n#..#\n....\n#...\n.#..\n2 2"` |
| `m6.l5.b8` | Sort the weights descending and take greedily while they fit. | `"3 7\n5 4 3"` | `7` | `5` | `"3 7\n5 4 3"` |
| `m7.p3` | A flood fill that never moves up. | `"2 3\n.#.\n..."` | `1` | `2` | `"2 3\n.#.\n..."` |
| `m7.p5` | A flood fill that never moves up. | `"6 6\n.#....\n....#.\n..##..\n###.##\n.##...\n..#..#"` | `1` | `2` | `"6 6\n.#....\n....#.\n..##..\n###.##\n.##...\n..#..#"` |
| `m7.p6` | A wave that never moves up. | `"2 3\n.#.\n...\n0 0 0 2 1 1"` | `both` | `second` | `"2 3\n.#.\n...\n0 0 0 2 1 1"` |
| `m7.p7` | A wave that never moves up. | `"4 3\n...\n#.#\n###\n###\n1 1"` | `1` | `-1` | `"4 3\n...\n#.#\n###\n###\n1 1"` |
| `m7.p8` | A wave that never moves up. | `"2 3\n.#.\n...\n0 0 100"` | `5` | `4` | `"2 3\n.#.\n...\n0 0 100"` |
| `m7.p10` | A wave that never moves up. | `"2 3\n.#.\n...\n0 0 0 2 1 0"` | `7` | `-1` | `"2 3\n.#.\n...\n0 0 0 2 1 0"` |
| `m7.l4.b8` | A wave that never moves up. | `"2 3\n.#.\n...\n0 0 0 2"` | `0 0 / 1 0 / 1 1 / 1 2 / 0 2` | `-1` | `"2 3\n.#.\n...\n0 0 0 2"` |
| `m7.l4.b9` | A wave that never moves up. | `"2 3\n.#.\n...\n0 0 1 0\n0 2"` | `7` | `-1` | `"2 3\n.#.\n...\n0 0 1 0\n0 2"` |
| `m7.l2.b8` | A flood fill that never moves LEFT. | `"2 2\n#.\n.."` | `1` | `2` | `"2 2\n#.\n.."` |
| `m8.l4.b9s` | Submit the given program unchanged (plus a corner guard). | `"3 3\n...\n#..\n.#."` | `2` | `0` | `"3 3\n...\n#..\n.#."` |
| `m8.p1` | Sweep the timeline from t = 1 instead of t = 0. | `"1\n0 1"` | `1` | `0` | `"1\n0 1"` |
| `m8.p2` | Drop the 10-tenge coin from the coin set. | `"10"` | `1` | `2` | `"10"` |
| `m8.l2.b6` | Let each item be taken twice — `range(3)` in every loop instead of `range(2)`. | `"1 1 1 1\n5"` | `4` | `5` | `"1 1 1 1\n5"` |
| `m8.as.b2` **(monthly check)** | A memoised recursion — correct in complexity, one call deep per column. | `"@bigCase"` | `2877` | `@crash` | `"1200\n0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0…"` |

## Where they were

| | |
|---|---|
| In a monthly check | 2 — `m7.as.b1` (March), `m8.as.b2` (April) |
| In an ordinary lesson | 6 |
| In a practice lesson (`mN.pK` ids) | 8 |
| Months affected | February 1, March 10, April 5 |

March's ten are nine instances of one slip — a grid traversal missing a direction — plus the assessment. That concentration is itself the finding: the month's own case sets were built from maps where every region could be entered from above, so the same witness shape (`.#.` over `...`) breaks nine tasks at once.

## The pedagogy behind each

**`m7.as.b1`** — A depth-first flood fill that labels each cell with its own recursion depth, then takes the minimum over border cells.

The month's central claim is that a wave measures distance and a walk does not: depth in a DFS is how far along one arbitrary path a cell was reached, not how far it is. This is the misconception March exists to remove, and m7.l3.b6 and m7.l3.b10 both ask the learner to argue against it. The same assessment's b3 and b4 ask them to PROVE the number is shortest — and the check could not tell.

**`m6.l5.b8`** — Sort the weights descending and take greedily while they fit.

The prompt forbids the LEFT-TO-RIGHT greedy by name («солдан оңға қарай ала беретін ашкөз тәсіл») and says nothing about sorting first, so descending-greedy is the next thing a learner tries. April's m8.l2.b5 exists specifically to teach that this rule is breakable — February accepted it.

**`m7.p3`** — A flood fill that never moves up.

Three of the four neighbours is the commonest transcription slip in grid code, and it is invisible on any map where every region can be entered from above. m7.l1.b4 names the four-neighbour definition as the lesson's own subject.

**`m7.p5`** — A flood fill that never moves up.

Same slip; here it splits one region into two and changes which is largest.

**`m7.p6`** — A wave that never moves up.

Same slip; the cell above the start becomes unreachable and a reachability answer flips.

**`m7.p7`** — A wave that never moves up.

Same slip; an exit reachable only upward reports as unreachable.

**`m7.p8`** — A wave that never moves up.

Same slip; the count of cells within a distance is short by the ones above.

**`m7.p10`** — A wave that never moves up.

Same slip; the route through the cell above vanishes and the answer becomes -1.

**`m7.l4.b8`** — A wave that never moves up.

Same slip, on the task whose answer is a route rather than a number, so the whole route disappears.

**`m7.l4.b9`** — A wave that never moves up.

Same slip, on the month's only task that runs two waves from two different starts and reads a third cell — so a single missing direction takes out both legs at once and the failure looks like an unreachable target rather than a broken traversal.

**`m7.l2.b8`** — A flood fill that never moves LEFT.

The mirror of the same slip, kept because a case set that catches a missing UP need not catch a missing LEFT: one region gets counted as two islands, which is the exact quantity the task reports.

**`m8.l4.b9s`** — Submit the given program unchanged (plus a corner guard).

The task is to flip a path-count table from bottom-left→top-right to top-left→bottom-right, naming four specific changes. Nine of the eleven cases were invariant under a vertical flip and the other two only tested the start/finish-is-a-wall rule, so none of the four required changes was ever exercised. A support learner could pass the month's hardest edit by changing nothing.

**`m8.p1`** — Sweep the timeline from t = 1 instead of t = 0.

An off-by-one at the very start of a sweep, invisible unless something is alive only at the first instant. September's m1.l7 teaches that the boundary you forget is the one no case reaches.

**`m8.p2`** — Drop the 10-tenge coin from the coin set.

Not a misconception so much as a transcription error, and the point is the case set: ten cases and not one of them needed that coin. A learner mistyping the given denominations was told they were right.

**`m8.l2.b6`** — Let each item be taken twice — `range(3)` in every loop instead of `range(2)`.

The prompt states each item may be taken at most once, which is what makes the subset walk 2⁴ rather than 3⁴. Taking an item twice is the standard confusion between a subset and a multiset, and April's whole greedy-versus-enumeration argument rests on the subset reading.

**`m8.as.b2`** — A memoised recursion — correct in complexity, one call deep per column.

This one is not wrong as an algorithm; it is wrong as a submission. The task states 1 ≤ n ≤ 100000 and warns in its own prompt that recomputing each column will not fit the clock, and the largest declared case was n = 61. A learner who met recursion in February and tables in April writes exactly this, passes the check, and dies of RecursionError on real input. The task explicitly requires a method that survives the stated size, which is why it belongs here and an ordinary alternative algorithm does not.

