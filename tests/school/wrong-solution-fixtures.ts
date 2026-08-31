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
 *
 * ## After the C++17 migration
 *
 * Every program here was Python and is now GNU C++17, because the curriculum
 * is. Three things about the translation are worth knowing before editing one.
 *
 * The MISCONCEPTION is the asset, not the syntax. Each program was re-expressed
 * so that the learner's mistake recorded in `approach` and `pedagogy` survives;
 * a translation that computes the right answer, or the wrong answer for a
 * different reason, would be worth nothing.
 *
 * Every `witness`, `referenceOutput` and `wrongOutput` below was re-derived by
 * compiling and running the two programs, not by reading them. Several tasks
 * changed their input format in the migration — January's assessment now reads
 * a count `n` before the list, because `cin >>` cannot find the end of a line —
 * and a witness carried over unchanged would have fed the reference garbage.
 *
 * A wrong program must not lean on UNDEFINED BEHAVIOUR. The browser and CI both
 * compile at `-O2`, where an out-of-bounds read or a signed overflow is a
 * licence for the optimiser to delete the symptom, and a fixture whose wrongness
 * depends on that is flaky by construction. `m8.p2` is the one that had to be
 * re-authored for this: dropping a coin from a vector the reference then indexes
 * seven times is UB, so the mutation types the 20 twice instead, which leaves
 * the same coin set with the same seven entries.
 *
 * ## One fixture was deleted, on purpose
 *
 * Twenty fixtures came out of Python and nineteen went into C++. The one that
 * did not is `m8.as.b2` — a memoised recursion over the pillar-jumping table.
 * In Python it was a genuine false accept: correct in complexity, but n = 100000
 * blew the interpreter's recursion limit, and the largest declared case was
 * n = 61, so it passed. In C++17 a memoised recursion
 * is simply A CORRECT SOLUTION — no interpreter limit, and the guard case's
 * n = 1200 recurses 1200 frames deep without noticing. Its wrongness was an
 * artefact of the language, so it did not survive the change of language and
 * was removed rather than translated into something that only looks like it.
 * The n = 1200 guard case it caused stays in the task: a large case is worth
 * having whatever killed it. It is the only fixture that was deleted.
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

/**
 * Never look up.
 *
 * Python spelled the four-neighbour step two ways across March — a direction
 * array in some tasks, four explicit `if` branches in others — and this file
 * carried an anchor for each. The C++17 migration writes every one of March's
 * traversals with the array, so the two anchors have collapsed into this one.
 *
 * `dr[0]` stops being −1, so no wave and no fill can reach the row above.
 * `dr[1]` is left at 0, which makes the second direction the cell itself —
 * harmless, because every reference here rejects an already-visited cell, and
 * an in-bounds step that goes nowhere is not undefined behaviour.
 */
const NO_UP = { find: "int dr[4] = {-1, 1, 0, 0};", replace: "int dr[4] = {1, 0, 0, 0};" };
/** The mirror of the same slip: never look LEFT. */
const NO_LEFT = { find: "int dc[4] = {0, 0, -1, 1};", replace: "int dc[4] = {0, 0, 0, 1};" };

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
    program: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int n, m;
vector<string> g;
vector<vector<int>> depth;
int dr[4] = {-1, 1, 0, 0};
int dc[4] = {0, 0, -1, 1};

void walk(int r, int c, int d) {
    depth[r][c] = d;
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k];
        int nc = c + dc[k];
        if (nr >= 0 && nr < n && nc >= 0 && nc < m) {
            if (g[nr][nc] == '.' && depth[nr][nc] == -1) {
                walk(nr, nc, d + 1);
            }
        }
    }
}

int main() {
    cin >> n >> m;
    g = vector<string>(n);
    for (int i = 0; i < n; i++) {
        cin >> g[i];
    }
    int sr, sc;
    cin >> sr >> sc;
    depth = vector<vector<int>>(n, vector<int>(m, -1));
    walk(sr, sc, 0);
    int best = -1;
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < m; c++) {
            if (depth[r][c] >= 0) {
                if (r == 0 || r == n - 1 || c == 0 || c == m - 1) {
                    if (best == -1 || depth[r][c] < best) {
                        best = depth[r][c];
                    }
                }
            }
        }
    }
    cout << best;
    return 0;
}`,
  },
  {
    blockId: "m6.l5.b8",
    approach: "Sort the weights descending and take greedily while they fit.",
    pedagogy:
      "The prompt forbids the LEFT-TO-RIGHT greedy by name («солдан оңға қарай ала беретін ашкөз тәсіл») and says nothing about sorting first, so descending-greedy is the next thing a learner tries. April's m8.l2.b5 exists specifically to teach that this rule is breakable — February accepted it.",
    witness: "3 7\n5 4 3",
    referenceOutput: "7",
    wrongOutput: "5",
    program: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n, limit;
    cin >> n >> limit;
    vector<int> w(n);
    for (int i = 0; i < n; i++) {
        cin >> w[i];
    }
    sort(w.begin(), w.end());
    reverse(w.begin(), w.end());
    int total = 0;
    for (int i = 0; i < n; i++) {
        if (total + w[i] <= limit) {
            total = total + w[i];
        }
    }
    cout << total;
    return 0;
}`,
  },
  { blockId: "m7.p3", approach: "A flood fill that never moves up.", pedagogy: "Three of the four neighbours is the commonest transcription slip in grid code, and it is invisible on any map where every region can be entered from above. m7.l1.b4 names the four-neighbour definition as the lesson's own subject.", witness: "2 3\n.#.\n...", referenceOutput: "1", wrongOutput: "2", mutate: NO_UP },
  { blockId: "m7.p5", approach: "A flood fill that never moves up.", pedagogy: "Same slip; here it splits one region into two and changes which is largest.", witness: "6 6\n.#....\n....#.\n..##..\n###.##\n.##...\n..#..#", referenceOutput: "1", wrongOutput: "2", mutate: NO_UP },
  { blockId: "m7.p6", approach: "A wave that never moves up.", pedagogy: "Same slip; the cell above the start becomes unreachable and a reachability answer flips.", witness: "2 3\n.#.\n...\n0 0 0 2 1 1", referenceOutput: "both", wrongOutput: "second", mutate: NO_UP },
  { blockId: "m7.p7", approach: "A wave that never moves up.", pedagogy: "Same slip; an exit reachable only upward reports as unreachable.", witness: "4 3\n...\n#.#\n###\n###\n1 1", referenceOutput: "1", wrongOutput: "-1", mutate: NO_UP },
  { blockId: "m7.p8", approach: "A wave that never moves up.", pedagogy: "Same slip; the count of cells within a distance is short by the ones above.", witness: "2 3\n.#.\n...\n0 0 100", referenceOutput: "5", wrongOutput: "4", mutate: NO_UP },
  { blockId: "m7.p10", approach: "A wave that never moves up.", pedagogy: "Same slip; the route through the cell above vanishes and the answer becomes -1.", witness: "2 3\n.#.\n...\n0 0 0 2 1 0", referenceOutput: "7", wrongOutput: "-1", mutate: NO_UP },
  { blockId: "m7.l4.b8", approach: "A wave that never moves up.", pedagogy: "Same slip, on the task whose answer is a route rather than a number, so the whole route disappears.", witness: "2 3\n.#.\n...\n0 0 0 2", referenceOutput: "0 0\n1 0\n1 1\n1 2\n0 2", wrongOutput: "-1", mutate: NO_UP },
  { blockId: "m7.l4.b9", approach: "A wave that never moves up.", pedagogy: "Same slip, on the month's only task that runs two waves from two different starts and reads a third cell — so a single missing direction takes out both legs at once and the failure looks like an unreachable target rather than a broken traversal.", witness: "2 3\n.#.\n...\n0 0 1 0\n0 2", referenceOutput: "7", wrongOutput: "-1", mutate: NO_UP },
  {
    blockId: "m7.l2.b8",
    approach: "A flood fill that never moves LEFT.",
    pedagogy:
      "The mirror of the same slip, kept because a case set that catches a missing UP need not catch a missing LEFT: one region gets counted as two islands, which is the exact quantity the task reports.",
    witness: "2 2\n#.\n..",
    referenceOutput: "1",
    wrongOutput: "2",
    mutate: NO_LEFT,
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
    mutate: { find: "for (int t = 0; t < 100; t++)", replace: "for (int t = 1; t < 100; t++)" },
  },
  {
    blockId: "m8.p2",
    approach: "Type the 20-tenge coin twice and never type the 10, so the 10 is missing from the coin set.",
    pedagogy:
      "Not a misconception so much as a transcription error, and the point is the case set: ten cases and not one of them needed that coin. A learner mistyping the given denominations was told they were right. In Python the mutation deleted the 10 from the list; in C++ the reference walks the vector with a hard `i < 7`, so deleting an entry would read one past the end — undefined behaviour, and at -O2 the optimiser is entitled to make the symptom disappear. Typing 20 twice leaves seven entries and the same missing coin: the second 20 divides a remainder already smaller than 20 and contributes nothing.",
    witness: "10",
    referenceOutput: "1",
    wrongOutput: "2",
    mutate: { find: "coins.push_back(10);", replace: "coins.push_back(20);" },
  },
  {
    blockId: "m8.l2.b6",
    approach: "Let each item be taken twice — the four subset loops count to 2 instead of stopping at 1.",
    pedagogy:
      "The prompt states each item may be taken at most once, which is what makes the subset walk 2⁴ rather than 3⁴. Taking an item twice is the standard confusion between a subset and a multiset, and April's whole greedy-versus-enumeration argument rests on the subset reading.",
    witness: "1 1 1 1\n5",
    referenceOutput: "4",
    wrongOutput: "5",
    mutate: { find: "< 2; ", replace: "< 3; ", regex: true },
  },
  /*
   * `m8.as.b2` stood here: a memoised recursion over the pillar table, which
   * passed every declared case in Python and died of RecursionError on the
   * stated n = 100000. C++17 has no such limit and the same program is now
   * CORRECT, so the fixture was deleted rather than translated — see the note
   * at the top of this file. The guard case it earned (n = 1200) stays in the
   * task.
   */
  {
    blockId: "m5.as.b1",
    approach:
      "Break the tie INSIDE the search loop: keep a running best and replace it only on a strictly smaller distance, so on a tie the candidate `mid` happened to reach first wins.",
    pedagogy:
      "The prompt says the smaller number wins a tie, and the only non-degenerate tie in the fourteen cases was on a TWO-element list, where the first midpoint necessarily lands on the smaller candidate. First-wins and smaller-wins agreed there, so every program breaking the tie inside the loop passed for free. January's whole subject is that a halving search must not discard the answer, and this is the same mistake in the reporting rather than the searching.",
    witness: "3\n1 5 9\n3",
    referenceOutput: "1",
    wrongOutput: "5",
    program: `#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    int x;
    cin >> x;
    int left = 0;
    int right = n - 1;
    int best = 0;
    bool have = false;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (!have || abs(a[mid] - x) < abs(best - x)) {
            best = a[mid];
            have = true;
        }
        if (a[mid] < x) {
            left = mid + 1;
        } else if (a[mid] > x) {
            right = mid - 1;
        } else {
            break;
        }
    }
    cout << best;
    return 0;
}`,
  },
  {
    blockId: "m5.as.b1",
    approach: "Compare |value| against |x| instead of |value − x|.",
    pedagogy:
      "Nothing in the case set paired a negative x with a list straddling zero, so this program was never asked a question it could get wrong — the one negative case, `-8 -3 2` with x = −5, it happens to answer correctly. September's `abs` work is about the distance between two numbers, and this is the standard confusion of that with the size of each.",
    witness: "2\n-5 1\n-2",
    referenceOutput: "-5",
    wrongOutput: "1",
    program: `#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    int x;
    cin >> x;
    int best = a[0];
    for (int i = 0; i < n; i++) {
        if (abs(abs(a[i]) - abs(x)) < abs(abs(best) - abs(x))) {
            best = a[i];
        }
    }
    cout << best;
    return 0;
}`,
  },
  {
    blockId: "m5.as.b1",
    approach: "Initialise the answer to the sentinel `0` rather than to an element of the list.",
    pedagogy:
      "October's m2.l5.b3 is a whole block about this: a best-so-far initialised to zero prints a number that is not in the list. It only shows when the boundary runs off the end AND no element is near zero, and no case put x above every element of an all-negative list.",
    witness: "3\n-9 -5 -1\n100",
    referenceOutput: "-1",
    wrongOutput: "0",
    program: `#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    int x;
    cin >> x;
    int left = 0;
    int right = n;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (a[mid] < x) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    int best = 0;
    if (left < n) {
        best = a[left];
    }
    if (left > 0 && abs(a[left - 1] - x) <= abs(best - x)) {
        best = a[left - 1];
    }
    cout << best;
    return 0;
}`,
  },
  {
    blockId: "m7.as.b1",
    approach:
      "The same depth-first fill, written with `dr = {1, 0, -1, 0}` — clockwise from down instead of the reference's order.",
    pedagogy:
      "The first guard case killed only the version that shared the reference's direction order; this one still scored 10/10. The wrong IDEA is one thing and its twenty-four spellings are another, and a case set that kills one spelling has not addressed the idea. No single map defeats all 24 orderings — for any map some ordering stumbles onto the short path first — so it takes two, covering 22 and 16.",
    witness: "5 6\n....##\n...#.#\n.....#\n#....#\n#..###\n3 3",
    referenceOutput: "2",
    wrongOutput: "6",
    program: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int n, m;
vector<string> g;
vector<vector<int>> depth;
int dr[4] = {1, 0, -1, 0};
int dc[4] = {0, 1, 0, -1};

void walk(int r, int c, int d) {
    depth[r][c] = d;
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k];
        int nc = c + dc[k];
        if (nr >= 0 && nr < n && nc >= 0 && nc < m) {
            if (g[nr][nc] == '.' && depth[nr][nc] == -1) {
                walk(nr, nc, d + 1);
            }
        }
    }
}

int main() {
    cin >> n >> m;
    g = vector<string>(n);
    for (int i = 0; i < n; i++) {
        cin >> g[i];
    }
    int sr, sc;
    cin >> sr >> sc;
    depth = vector<vector<int>>(n, vector<int>(m, -1));
    walk(sr, sc, 0);
    int best = -1;
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < m; c++) {
            if (depth[r][c] >= 0) {
                if (r == 0 || r == n - 1 || c == 0 || c == m - 1) {
                    if (best == -1 || depth[r][c] < best) {
                        best = depth[r][c];
                    }
                }
            }
        }
    }
    cout << best;
    return 0;
}`,
  },
];
