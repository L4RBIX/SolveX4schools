/**
 * Programs that are WRONG, kept so they stay wrong.
 *
 * `check-blocks` runs every reference solution against every case and reports
 * clean. That proves a solution is consistent with its own cases and says
 * nothing about whether an INCORRECT program also passes them — and an
 * adversarial pass found sixteen tasks where one did. The worst was March's
 * monthly check, where a depth-first fill labelling cells with its own
 * recursion depth scored full marks in the month whose entire subject is that
 * a wave measures distance and a walk does not.
 *
 * Sixteen hidden cases were added to kill them. This file is the other half:
 * without it the guarantee is "a case exists that we believed killed it", and
 * a later edit to a task, a reference solution or a case set could quietly
 * restore the false accept with every existing test still green.
 *
 * ## What is a defect and what is not
 *
 * A task tests CORRECT BEHAVIOUR. It does not test "did the learner write the
 * same algorithm as the reference". An alternative correct algorithm passing is
 * the system working, not a defect, and `alternatives` below records verified
 * ones precisely so nobody mistakes the two.
 *
 * A wrong program belongs here only when it is genuinely wrong — it produces an
 * incorrect answer on some input inside the stated constraints — OR when the
 * prompt or the month's learning objective explicitly requires a technique and
 * the program passes without using it. `m7.as.b1` is the second kind and the
 * clearest case of it: DFS depth is not shortest-path distance, and the same
 * assessment asks the learner to PROVE their number is the shortest.
 *
 * ## Two ways a fixture is written
 *
 * `mutate` — a mechanical edit to the block's own reference solution, for
 * defects that are one wrong constant or one missing branch. It stays in step
 * with the task, and if the anchor it edits ever disappears the fixture fails
 * loudly rather than silently testing nothing.
 *
 * `program` — a complete program, for a genuinely different algorithm that no
 * edit to the reference would produce.
 */

export interface WrongSolution {
  /** The block whose case set accepted this. */
  blockId: string;
  /** One sentence: what the learner did. */
  approach: string;
  /** The misconception, and whether the month teaches against it. */
  pedagogy: string;
  /** An input inside the stated constraints where the program is wrong. */
  witness: string;
  /** What the reference answers there. Asserted, not trusted. */
  referenceOutput: string;
  /** What the wrong program answers there. Asserted. */
  wrongOutput: string;
  /** A complete replacement program, or a mutation of the block's reference. */
  program?: string;
  mutate?: { find: string; replace: string; regex?: boolean };
  /** An alternative CORRECT algorithm, verified to pass — evidence the case set is not over-fitted. */
  alternative?: string;
}

/** Never look up. March's grid work, where the array spelling is used. */
const NO_UP_ARRAY = { find: "dr = [-1, 1, 0, 0]", replace: "dr = [1, 0, 0, 0]" };
/** The same defect where the neighbours are explicit branches instead. */
const NO_UP_BRANCH = { find: "if r > 0 and ", replace: "if False and ", regex: true };

export const WRONG_SOLUTIONS: readonly WrongSolution[] = [
  {
    blockId: "m7.as.b1",
    approach:
      "A depth-first flood fill that labels each cell with its own recursion depth, then takes the minimum over border cells.",
    pedagogy:
      "The month's central claim is that a wave measures distance and a walk does not: depth in a DFS is how far along one arbitrary path a cell was reached, not how far it is. This is the misconception March exists to remove, and m7.l3.b6 and m7.l3.b10 both ask the learner to argue against it. The same assessment's b3 and b4 ask them to PROVE the number is shortest — and the check could not tell.",
    witness: "4 4\n#..#\n....\n#...\n.#..\n2 2",
    referenceOutput: "1",
    wrongOutput: "2",
    program: `import sys
sys.setrecursionlimit(10000)
n, m = map(int, input().split())
g = [input() for _ in range(n)]
sr, sc = map(int, input().split())
dist = [[-1] * m for _ in range(n)]
def fill(r, c, d):
    dist[r][c] = d
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < n and 0 <= nc < m and g[nr][nc] == "." and dist[nr][nc] == -1:
            fill(nr, nc, d + 1)
fill(sr, sc, 0)
best = -1
for r in range(n):
    for c in range(m):
        if dist[r][c] >= 0 and (r == 0 or r == n - 1 or c == 0 or c == m - 1):
            if best < 0 or dist[r][c] < best:
                best = dist[r][c]
print(best)`,
  },
  {
    blockId: "m6.l5.b8",
    approach: "Sort the weights descending and take greedily while they fit.",
    pedagogy:
      "The prompt forbids the LEFT-TO-RIGHT greedy by name («солдан оңға қарай ала беретін ашкөз тәсіл») and says nothing about sorting first, so descending-greedy is the next thing a learner tries. April's m8.l2.b5 exists specifically to teach that this rule is breakable — February accepted it.",
    witness: "3 7\n5 4 3",
    referenceOutput: "7",
    wrongOutput: "5",
    program: `n, L = map(int, input().split())
w = list(map(int, input().split()))
w.sort(reverse=True)
total = 0
for x in w:
    if total + x <= L:
        total += x
print(total)`,
  },
  { blockId: "m7.p3", approach: "A flood fill that never moves up.", pedagogy: "Three of the four neighbours is the commonest transcription slip in grid code, and it is invisible on any map where every region can be entered from above. m7.l1.b4 names the four-neighbour definition as the lesson's own subject.", witness: "2 3\n.#.\n...", referenceOutput: "1", wrongOutput: "2", mutate: NO_UP_BRANCH },
  { blockId: "m7.p5", approach: "A flood fill that never moves up.", pedagogy: "Same slip; here it splits one region into two and changes which is largest.", witness: "6 6\n.#....\n....#.\n..##..\n###.##\n.##...\n..#..#", referenceOutput: "1", wrongOutput: "2", mutate: NO_UP_BRANCH },
  { blockId: "m7.p6", approach: "A wave that never moves up.", pedagogy: "Same slip; the cell above the start becomes unreachable and a reachability answer flips.", witness: "2 3\n.#.\n...\n0 0 0 2 1 1", referenceOutput: "both", wrongOutput: "second", mutate: NO_UP_BRANCH },
  { blockId: "m7.p7", approach: "A wave that never moves up.", pedagogy: "Same slip; an exit reachable only upward reports as unreachable.", witness: "4 3\n...\n#.#\n###\n###\n1 1", referenceOutput: "1", wrongOutput: "-1", mutate: NO_UP_BRANCH },
  { blockId: "m7.p8", approach: "A wave that never moves up.", pedagogy: "Same slip; the count of cells within a distance is short by the ones above.", witness: "2 3\n.#.\n...\n0 0 100", referenceOutput: "5", wrongOutput: "4", mutate: NO_UP_BRANCH },
  { blockId: "m7.p10", approach: "A wave that never moves up.", pedagogy: "Same slip; the route through the cell above vanishes and the answer becomes -1.", witness: "2 3\n.#.\n...\n0 0 0 2 1 0", referenceOutput: "7", wrongOutput: "-1", mutate: NO_UP_BRANCH },
  { blockId: "m7.l4.b8", approach: "A wave that never moves up.", pedagogy: "Same slip, on the task whose answer is a route rather than a number, so the whole route disappears.", witness: "2 3\n.#.\n...\n0 0 0 2", referenceOutput: "0 0\n1 0\n1 1\n1 2\n0 2", wrongOutput: "-1", mutate: NO_UP_ARRAY },
  { blockId: "m7.l4.b9", approach: "A wave that never moves up.", pedagogy: "Same slip, on the month's only task that runs two waves from two different starts and reads a third cell — so a single missing direction takes out both legs at once and the failure looks like an unreachable target rather than a broken traversal.", witness: "2 3\n.#.\n...\n0 0 1 0\n0 2", referenceOutput: "7", wrongOutput: "-1", mutate: NO_UP_ARRAY },
  {
    blockId: "m7.l2.b8",
    approach: "A flood fill that never moves LEFT.",
    pedagogy:
      "The mirror of the same slip, kept because a case set that catches a missing UP need not catch a missing LEFT: one region gets counted as two islands, which is the exact quantity the task reports.",
    witness: "2 2\n#.\n..",
    referenceOutput: "1",
    wrongOutput: "2",
    mutate: { find: "dc = [0, 0, -1, 1]", replace: "dc = [0, 0, 0, 1]" },
  },
  {
    blockId: "m8.l4.b9s",
    approach: "Submit the given program unchanged (plus a corner guard).",
    pedagogy:
      "The task is to flip a path-count table from bottom-left→top-right to top-left→bottom-right, naming four specific changes. Nine of the eleven cases were invariant under a vertical flip and the other two only tested the start/finish-is-a-wall rule, so none of the four required changes was ever exercised. A support learner could pass the month's hardest edit by changing nothing.",
    witness: "3 3\n...\n#..\n.#.",
    referenceOutput: "2",
    wrongOutput: "0",
    program: "@given",
  },
  {
    blockId: "m8.p1",
    approach: "Sweep the timeline from t = 1 instead of t = 0.",
    pedagogy:
      "An off-by-one at the very start of a sweep, invisible unless something is alive only at the first instant. September's m1.l7 teaches that the boundary you forget is the one no case reaches.",
    witness: "1\n0 1",
    referenceOutput: "1",
    wrongOutput: "0",
    mutate: { find: "range(0, 100)", replace: "range(1, 100)" },
  },
  {
    blockId: "m8.p2",
    approach: "Drop the 10-tenge coin from the coin set.",
    pedagogy:
      "Not a misconception so much as a transcription error, and the point is the case set: ten cases and not one of them needed that coin. A learner mistyping the given denominations was told they were right.",
    witness: "10",
    referenceOutput: "1",
    wrongOutput: "2",
    mutate: { find: "[100, 50, 20, 10, 5, 2, 1]", replace: "[100, 50, 20, 5, 2, 1]" },
  },
  {
    blockId: "m8.l2.b6",
    approach: "Let each item be taken twice — `range(3)` in every loop instead of `range(2)`.",
    pedagogy:
      "The prompt states each item may be taken at most once, which is what makes the subset walk 2⁴ rather than 3⁴. Taking an item twice is the standard confusion between a subset and a multiset, and April's whole greedy-versus-enumeration argument rests on the subset reading.",
    witness: "1 1 1 1\n5",
    referenceOutput: "4",
    wrongOutput: "5",
    mutate: { find: "range(2)", replace: "range(3)", regex: true },
  },
  {
    blockId: "m8.as.b2",
    approach: "A memoised recursion — correct in complexity, one call deep per column.",
    pedagogy:
      "This one is not wrong as an algorithm; it is wrong as a submission. The task states 1 ≤ n ≤ 100000 and warns in its own prompt that recomputing each column will not fit the clock, and the largest declared case was n = 61. A learner who met recursion in February and tables in April writes exactly this, passes the check, and dies of RecursionError on real input. The task explicitly requires a method that survives the stated size, which is why it belongs here and an ordinary alternative algorithm does not.",
    witness: "@bigCase",
    referenceOutput: "2877",
    wrongOutput: "@crash",
    program: `n = int(input())
h = list(map(int, input().split()))
memo = {}
def cost(i):
    if i == 0:
        return 0
    if i in memo:
        return memo[i]
    best = cost(i - 1) + abs(h[i] - h[i - 1])
    if i >= 2:
        alt = cost(i - 2) + abs(h[i] - h[i - 2])
        if alt < best:
            best = alt
    memo[i] = best
    return best
print(cost(n - 1))`,
  },
];
