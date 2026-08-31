/**
 * Twenty internal replay sessions.
 *
 * Phase 1's exit criterion was "the team has read 20 replays and written the
 * first misconception entries". Production has not produced twenty episodes
 * yet, and waiting for them would block Phase 2 behind a beta cohort.
 *
 * So these are authored: twenty solving traces covering the situations the
 * pipeline is supposed to tell apart, written as real code snapshots and real
 * timings and pushed through the REAL classifier, reducer and outcome
 * attribution. Nothing here mocks the pipeline — the point is to find out where
 * it is blind, and a mock would only confirm what we already believe.
 *
 * They are marked `internal` wherever they are loaded. THEY ARE NOT DATA.
 * Nothing about them may be reported as a measurement of learners, and no rate
 * computed over them means anything. What they are good for is exactly one
 * thing: showing which signals the schema fails to capture.
 *
 * Each trace carries an `expect` string — what a human reading the replay
 * would say happened. Where the pipeline disagrees with that sentence, we have
 * found a gap.
 */

import type { CloseReason, LearningVerdict, TargetsEdge } from "../../packages/learning-contracts/src/events";
import { STARTER_TEMPLATES } from "../../packages/learning-intelligence-core/src/starterTemplates";

// ─── Code stages ─────────────────────────────────────────────────────────────
//
// Real solutions at real intermediate states. The classifier only produces a
// meaningful label if the code actually changes the way a learner's does, so
// these are written as a learner would leave them, not as minimal diffs.

/**
 * The real starter templates, not copies.
 *
 * A duplicated template would drift from the editor's, and the drift would be
 * silent: `r17` asserts that wiping back to the template reads as a `reset`,
 * and it would simply stop testing that the day someone edited
 * JUDGE0_LANGUAGE_MAP.
 */
const CPP_TEMPLATE = STARTER_TEMPLATES.cpp17;

/** Quadratic max-subarray. Correct, too slow at n = 2e5. */
const CPP_QUADRATIC = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    long long best = LLONG_MIN;
    for (int i = 0; i < n; i++) {
        long long sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];
            best = max(best, sum);
        }
    }
    cout << best << "\\n";
    return 0;
}
`;

/** Same shape, one bound nudged. The signature of guessing. */
const CPP_QUADRATIC_TWEAKED = CPP_QUADRATIC.replace("for (int j = i; j < n; j++)", "for (int j = i; j <= n; j++)");
const CPP_QUADRATIC_TWEAKED_2 = CPP_QUADRATIC.replace("long long best = LLONG_MIN;", "long long best = 0;");

/** Kadane. A different algorithm, not a repair of the one above. */
const CPP_KADANE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long best = LLONG_MIN, cur = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        cur = max((long long) x, cur + x);
        best = max(best, cur);
    }
    cout << best << "\\n";
    return 0;
}
`;

/** Kadane with the empty-array guard a learner adds after failing test 1. */
const CPP_KADANE_GUARDED = CPP_KADANE.replace(
  "    cout << best << \"\\n\";",
  "    if (n == 0) best = 0;\n    cout << best << \"\\n\";"
);

/** Overflowing accumulator: int where the sum needs 64 bits. */
const CPP_OVERFLOW = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    int total = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        total += x;
    }
    cout << total << "\\n";
    return 0;
}
`;

const CPP_OVERFLOW_FIXED = CPP_OVERFLOW.replace("int total = 0;", "long long total = 0;");

/** BFS with no visited set: revisits nodes forever on a cyclic graph. */
const CPP_BFS_NO_VISITED = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    queue<int> q;
    q.push(1);
    int seen = 0;
    while (!q.empty()) {
        int cur = q.front();
        q.pop();
        seen++;
        for (int nxt : g[cur]) q.push(nxt);
    }
    cout << seen << "\\n";
    return 0;
}
`;

const CPP_BFS_VISITED = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> visited(n + 1, 0);
    queue<int> q;
    q.push(1);
    visited[1] = 1;
    int seen = 0;
    while (!q.empty()) {
        int cur = q.front();
        q.pop();
        seen++;
        for (int nxt : g[cur]) {
            if (!visited[nxt]) {
                visited[nxt] = 1;
                q.push(nxt);
            }
        }
    }
    cout << seen << "\\n";
    return 0;
}
`;

/**
 * State-space BFS over (node, parity) — the modelling step the brief's example
 * learner cannot make. Structurally a different program from plain traversal.
 */
const CPP_BFS_STATE_SPACE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<array<int, 2>> dist(n + 1, {-1, -1});
    queue<pair<int, int>> q;
    q.push({1, 0});
    dist[1][0] = 0;
    while (!q.empty()) {
        auto [cur, par] = q.front();
        q.pop();
        for (int nxt : g[cur]) {
            int np = par ^ 1;
            if (dist[nxt][np] == -1) {
                dist[nxt][np] = dist[cur][par] + 1;
                q.push({nxt, np});
            }
        }
    }
    cout << dist[n][0] << "\\n";
    return 0;
}
`;

const PY_TEMPLATE = STARTER_TEMPLATES.python3;

/** Correct O(n log n), but the constant factor kills it in Python. */
const PY_SLOW_IO = `def solve():
    n = int(input())
    a = []
    for _ in range(n):
        a.append(int(input()))
    a.sort()
    out = ""
    for x in a:
        out += str(x) + "\\n"
    print(out)

solve()
`;

const PY_SLOW_IO_TWEAKED = PY_SLOW_IO.replace("a.sort()", "a.sort(reverse=False)");

const PY_FAST_IO = `import sys

def solve():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = sorted(map(int, data[1:n + 1]))
    sys.stdout.write("\\n".join(map(str, a)))

solve()
`;

/** Binary search with the classic upper-bound off-by-one. */
const CPP_BSEARCH_OFF_BY_ONE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] < k) lo = mid;
        else hi = mid;
    }
    cout << lo << "\\n";
    return 0;
}
`;

const CPP_BSEARCH_TWEAK_1 = CPP_BSEARCH_OFF_BY_ONE.replace("if (a[mid] < k) lo = mid;", "if (a[mid] <= k) lo = mid;");
const CPP_BSEARCH_TWEAK_2 = CPP_BSEARCH_OFF_BY_ONE.replace("int mid = (lo + hi) / 2;", "int mid = (lo + hi + 1) / 2;");
const CPP_BSEARCH_FIXED = CPP_BSEARCH_OFF_BY_ONE.replace("if (a[mid] < k) lo = mid;", "if (a[mid] < k) lo = mid + 1;");

/** Missing a semicolon: compiles nowhere. */
const CPP_COMPILE_ERROR = CPP_KADANE.replace("cin >> n;", "cin >> n");
const CPP_COMPILE_ERROR_2 = CPP_KADANE.replace("cin >> n;", "cin >> n,");

// ─── Trace DSL ───────────────────────────────────────────────────────────────

export interface TraceStep {
  /** Seconds since the episode opened. */
  at: number;
  /** A code snapshot. Runs through the real classifier against the previous one. */
  code?: string;
  /** A local run of the sample/custom tests. */
  run?: { cases: number; custom?: boolean };
  /** An authoritative submit. `testsPassed: null` means the judge never said. */
  submit?: {
    verdict: LearningVerdict;
    testsPassed?: number | null;
    testsTotal?: number | null;
    failingTest?: number | null;
  };
  /** A Copilot hint, as the paired request/delivery the ledger expects. */
  hint?: {
    level: number;
    containsCode?: boolean;
    evidenceType?: string;
    mode?: string;
    requestedLevel?: number;
  };
  /** The learner wrote their own test case. */
  authoredTest?: { size: number; edge: TargetsEdge };
  /** They went back to the statement. */
  statementRevisit?: { after?: string };
  /**
   * What the verification engine said about the previous verdict.
   *
   * Always follows a submit step. `unattributed_failure` is a real value here
   * and appears on purpose: it is the common case today, and a fixture set that
   * only covered successful attribution would hide that.
   */
  attribution?: {
    failureClass: string;
    source: "judge" | "verifier";
    confidence: number;
    reason?: string;
  };
  /** They opened the editorial. */
  reveal?: "editorial" | "reference_solution";
  /** They left. */
  close?: CloseReason;
}

export interface ReplayTrace {
  id: string;
  title: string;
  taskRef: string;
  language: string;
  /** What a human reading this replay would say happened. */
  expect: string;
  /** What the pipeline is supposed to conclude, for the harness to check. */
  wantStruggle?: string;
  wantOutcome?: string;
  /** Expected outcome for the first intervention, when the trace has one. */
  wantHintOutcome?: string;
  steps: TraceStep[];
}

// ─── The twenty ──────────────────────────────────────────────────────────────

export const REPLAY_TRACES: ReplayTrace[] = [
  {
    id: "r01-clean-solve",
    title: "Clean unaided solve",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect: "Wrote Kadane straight through, ran the samples, submitted, accepted.",
    wantStruggle: "flow",
    wantOutcome: "accepted",
    steps: [
      { at: 95, code: CPP_KADANE },
      { at: 130, run: { cases: 2 } },
      { at: 160, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 175, close: "accepted" },
    ],
  },

  {
    id: "r02-productive-struggle",
    title: "Productive struggle to a solve",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect:
      "Started quadratic, hit TLE, rewrote as Kadane, failed the empty case, guarded it, accepted. Every edit was a new idea.",
    wantStruggle: "productive_struggle",
    wantOutcome: "accepted",
    steps: [
      { at: 120, code: CPP_QUADRATIC },
      { at: 150, run: { cases: 2 } },
      { at: 180, submit: { verdict: "time_limit_exceeded", testsPassed: 4, testsTotal: 12, failingTest: 5 } },
      // No runtime gate on this pack, so the engine refuses to call it a
      // complexity failure even though a human reading the code would.
      { at: 182, attribution: { failureClass: "unattributed_failure", source: "judge", confidence: 0.1, reason: "no_runtime_gate_evidence" } },
      { at: 260, statementRevisit: { after: "time_limit_exceeded" } },
      { at: 400, code: CPP_KADANE },
      { at: 440, submit: { verdict: "wrong_answer", testsPassed: 9, testsTotal: 12, failingTest: 10 } },
      { at: 520, code: CPP_KADANE_GUARDED },
      { at: 560, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 580, close: "accepted" },
    ],
  },

  {
    id: "r03-thrash",
    title: "Thrashing on a binary-search bound",
    taskRef: "solvex:1560C",
    language: "cpp17",
    expect:
      "Off-by-one in the binary search. Flipped the comparison, then the rounding, then back. Verdict never moved. Gave up.",
    wantStruggle: "thrash",
    wantOutcome: "abandoned",
    steps: [
      { at: 140, code: CPP_BSEARCH_OFF_BY_ONE },
      { at: 190, submit: { verdict: "wrong_answer", testsPassed: 2, testsTotal: 10, failingTest: 3 } },
      { at: 240, code: CPP_BSEARCH_TWEAK_1 },
      { at: 270, submit: { verdict: "wrong_answer", testsPassed: 2, testsTotal: 10, failingTest: 3 } },
      { at: 320, code: CPP_BSEARCH_TWEAK_2 },
      { at: 350, submit: { verdict: "wrong_answer", testsPassed: 2, testsTotal: 10, failingTest: 3 } },
      { at: 400, code: CPP_BSEARCH_OFF_BY_ONE },
      { at: 430, submit: { verdict: "wrong_answer", testsPassed: 2, testsTotal: 10, failingTest: 3 } },
      { at: 470, close: "navigated" },
    ],
  },

  {
    id: "r04-stuck-then-abandon",
    title: "Stuck, then left",
    taskRef: "solvex:1902D",
    language: "cpp17",
    expect: "Read it, typed a template, sat there for eight minutes, closed the tab.",
    wantStruggle: "stuck",
    wantOutcome: "abandoned",
    steps: [
      { at: 60, statementRevisit: {} },
      { at: 200, code: CPP_TEMPLATE + "// think: what is a state here?\n" },
      { at: 700, statementRevisit: {} },
      { at: 760, close: "navigated" },
    ],
  },

  {
    id: "r05-hint-then-independent",
    title: "A direction hint, then they did it themselves",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect:
      "Stuck on quadratic TLE. Asked for a hint, got a direction with no code, rewrote the algorithm, accepted. The hint worked.",
    wantStruggle: "productive_struggle",
    wantOutcome: "accepted",
    wantHintOutcome: "resolved_independently",
    steps: [
      { at: 110, code: CPP_QUADRATIC },
      { at: 160, submit: { verdict: "time_limit_exceeded", testsPassed: 4, testsTotal: 12, failingTest: 5 } },
      { at: 230, code: CPP_QUADRATIC_TWEAKED },
      { at: 260, submit: { verdict: "time_limit_exceeded", testsPassed: 4, testsTotal: 12, failingTest: 5 } },
      { at: 340, hint: { level: 1, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 480, code: CPP_KADANE },
      { at: 520, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 540, close: "accepted" },
    ],
  },

  {
    id: "r06-hint-transfer",
    title: "Hint carried code and they pasted it",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect:
      "Two failed attempts, asked for implementation help, got working code, pasted it wholesale, accepted. Product win, learning loss.",
    wantOutcome: "accepted",
    wantHintOutcome: "resolved_by_transfer",
    steps: [
      { at: 100, code: CPP_QUADRATIC },
      { at: 150, submit: { verdict: "time_limit_exceeded", testsPassed: 4, testsTotal: 12, failingTest: 5 } },
      { at: 200, code: CPP_QUADRATIC_TWEAKED_2 },
      { at: 230, submit: { verdict: "wrong_answer", testsPassed: 3, testsTotal: 12, failingTest: 4 } },
      { at: 280, hint: { level: 4, containsCode: true, evidenceType: "verified_counterexample", mode: "debug" } },
      { at: 320, code: CPP_KADANE_GUARDED },
      { at: 350, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 370, close: "accepted" },
    ],
  },

  {
    id: "r07-hint-regressed",
    title: "A confident hint knocked them off a working track",
    taskRef: "solvex:1560C",
    language: "cpp17",
    expect:
      "They were at 8 of 10 tests. Hint suggested restructuring. They did, and dropped to 2 of 10. Worst thing we can do.",
    wantHintOutcome: "regressed",
    steps: [
      { at: 120, code: CPP_BSEARCH_FIXED },
      { at: 170, submit: { verdict: "wrong_answer", testsPassed: 8, testsTotal: 10, failingTest: 9 } },
      { at: 240, hint: { level: 3, containsCode: false, evidenceType: "speculative_review", mode: "approach_review" } },
      { at: 320, code: CPP_BSEARCH_TWEAK_2 },
      { at: 360, submit: { verdict: "wrong_answer", testsPassed: 2, testsTotal: 10, failingTest: 3 } },
      { at: 420, close: "navigated" },
    ],
  },

  {
    id: "r08-hint-escalated",
    title: "Hint ladder climbed in one minute",
    taskRef: "solvex:1902D",
    language: "cpp17",
    expect: "Asked for a small hint, did not act on it, asked for the next level 50 seconds later.",
    wantHintOutcome: "escalated",
    steps: [
      { at: 90, code: CPP_BFS_NO_VISITED },
      { at: 140, submit: { verdict: "time_limit_exceeded", testsPassed: 1, testsTotal: 8, failingTest: 2 } },
      { at: 200, hint: { level: 0, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 250, hint: { level: 2, requestedLevel: 2, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 340, code: CPP_BFS_VISITED },
      { at: 380, submit: { verdict: "accepted", testsPassed: 8, testsTotal: 8 } },
      { at: 400, close: "accepted" },
    ],
  },

  {
    id: "r09-hint-stalled",
    title: "Hint landed and nothing happened",
    taskRef: "solvex:1902D",
    language: "cpp17",
    expect: "Got a conceptual hint, made no edit at all for four minutes, left. The hint was not understood.",
    wantHintOutcome: "stalled",
    steps: [
      { at: 100, code: CPP_BFS_NO_VISITED },
      { at: 150, submit: { verdict: "time_limit_exceeded", testsPassed: 1, testsTotal: 8, failingTest: 2 } },
      { at: 210, hint: { level: 2, containsCode: false, evidenceType: "speculative_review", mode: "hint" } },
      { at: 450, close: "navigated" },
    ],
  },

  {
    id: "r10-solution-revealed",
    title: "Gave up and opened the editorial",
    taskRef: "solvex:1955G",
    language: "cpp17",
    expect: "Two failed attempts, one hint, then revealed the editorial. Evidence value is zero.",
    wantOutcome: "solution_revealed",
    steps: [
      { at: 130, code: CPP_BFS_VISITED },
      { at: 180, submit: { verdict: "wrong_answer", testsPassed: 3, testsTotal: 11, failingTest: 4 } },
      { at: 260, hint: { level: 2, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 340, code: CPP_BFS_VISITED + "// still wrong?\n" },
      { at: 380, submit: { verdict: "wrong_answer", testsPassed: 3, testsTotal: 11, failingTest: 4 } },
      { at: 430, reveal: "editorial" },
      { at: 460, close: "solution_revealed" },
    ],
  },

  {
    id: "r11-comprehension-failure",
    title: "Misread the statement, reread it, fixed it",
    taskRef: "solvex:1873F",
    language: "cpp17",
    expect:
      "Failed test 1 immediately, went back to the statement, came back and changed the output entirely. A reading problem, not an algorithm problem.",
    wantOutcome: "accepted",
    steps: [
      { at: 90, code: CPP_OVERFLOW },
      { at: 130, submit: { verdict: "wrong_answer", testsPassed: 0, testsTotal: 9, failingTest: 1 } },
      { at: 150, statementRevisit: { after: "wrong_answer" } },
      { at: 300, code: CPP_KADANE },
      { at: 340, submit: { verdict: "accepted", testsPassed: 9, testsTotal: 9 } },
      { at: 360, close: "accepted" },
    ],
  },

  {
    id: "r12-self-test-debugging",
    title: "Wrote their own failing test and found the bug",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect:
      "Failed, wrote an empty-input test case themselves, reproduced it locally, fixed it. This is engineering.",
    wantOutcome: "accepted",
    steps: [
      { at: 110, code: CPP_KADANE },
      { at: 160, submit: { verdict: "wrong_answer", testsPassed: 9, testsTotal: 12, failingTest: 10 } },
      // Test 10 is smaller than every test that passed: a boundary they missed.
      { at: 162, attribution: { failureClass: "edge_case_handling", source: "verifier", confidence: 0.6 } },
      { at: 220, authoredTest: { size: 2, edge: "empty" } },
      { at: 240, run: { cases: 3, custom: true } },
      { at: 300, code: CPP_KADANE_GUARDED },
      { at: 330, run: { cases: 3, custom: true } },
      { at: 360, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 380, close: "accepted" },
    ],
  },

  {
    id: "r13-compile-loop",
    title: "Fighting the compiler",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect: "Three compile errors in a row before any test ran. Nothing about their algorithm was ever measured.",
    wantOutcome: "accepted",
    steps: [
      { at: 100, code: CPP_COMPILE_ERROR },
      { at: 130, submit: { verdict: "compile_error", testsPassed: 0, testsTotal: 12, failingTest: 1 } },
      { at: 132, attribution: { failureClass: "compile_error", source: "judge", confidence: 1 } },
      { at: 170, code: CPP_COMPILE_ERROR_2 },
      { at: 200, submit: { verdict: "compile_error", testsPassed: 0, testsTotal: 12, failingTest: 1 } },
      { at: 240, code: CPP_KADANE },
      { at: 280, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 300, close: "accepted" },
    ],
  },

  {
    id: "r14-complexity-rewrite",
    title: "TLE fixed by changing the algorithm",
    taskRef: "solvex:1234A",
    language: "cpp17",
    expect: "Quadratic timed out, they recognised it and wrote a linear solution. Asymptotic understanding is fine.",
    wantOutcome: "accepted",
    steps: [
      { at: 100, code: CPP_QUADRATIC },
      { at: 150, submit: { verdict: "time_limit_exceeded", testsPassed: 6, testsTotal: 12, failingTest: 7 } },
      // This pack's runtime gate watched a slower C++ program time out here,
      // and the submission is C++ too, so the evidence transfers.
      { at: 152, attribution: { failureClass: "complexity_asymptotic", source: "verifier", confidence: 0.9 } },
      { at: 320, code: CPP_KADANE },
      { at: 360, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 380, close: "accepted" },
    ],
  },

  {
    id: "r15-python-constant-factor",
    title: "TLE that is not an algorithm problem",
    taskRef: "solvex:1873F",
    language: "python3",
    expect:
      "Correct O(n log n) in Python, timed out on slow I/O and string concatenation. They tweaked the sort — the wrong lever — then fixed the I/O.",
    wantOutcome: "accepted",
    steps: [
      { at: 120, code: PY_SLOW_IO },
      { at: 170, submit: { verdict: "time_limit_exceeded", testsPassed: 7, testsTotal: 14, failingTest: 8 } },
      // The gate probed C++. Its evidence says nothing about a Python timeout,
      // which may be entirely constant-factor — so the engine declines.
      { at: 172, attribution: { failureClass: "unattributed_failure", source: "judge", confidence: 0.1, reason: "performance_evidence_language_mismatch" } },
      { at: 230, code: PY_SLOW_IO_TWEAKED },
      { at: 260, submit: { verdict: "time_limit_exceeded", testsPassed: 7, testsTotal: 14, failingTest: 8 } },
      // Wiped it and started again with a different I/O strategy.
      { at: 340, code: PY_TEMPLATE },
      { at: 400, code: PY_FAST_IO },
      { at: 440, submit: { verdict: "accepted", testsPassed: 14, testsTotal: 14 } },
      { at: 460, close: "accepted" },
    ],
  },

  {
    id: "r16-resumed-next-day",
    title: "Came back the next day and finished it",
    taskRef: "solvex:1955G",
    language: "cpp17",
    expect:
      "Left mid-problem, resumed hours later, solved it. Wall clock says nine hours; they worked for eleven minutes.",
    wantOutcome: "accepted",
    steps: [
      { at: 140, code: CPP_BFS_NO_VISITED },
      { at: 200, submit: { verdict: "time_limit_exceeded", testsPassed: 2, testsTotal: 11, failingTest: 3 } },
      { at: 260, close: "navigated" },
      // Resumed the following morning.
      { at: 32_000, code: CPP_BFS_VISITED },
      { at: 32_090, submit: { verdict: "accepted", testsPassed: 11, testsTotal: 11 } },
      { at: 32_110, close: "accepted" },
    ],
  },

  {
    id: "r17-reset-and-restart",
    title: "Deleted everything and started over",
    taskRef: "solvex:1902D",
    language: "cpp17",
    expect: "Wrote a whole wrong approach, wiped it back to the template, wrote a different one, accepted.",
    wantOutcome: "accepted",
    steps: [
      { at: 150, code: CPP_BFS_NO_VISITED },
      { at: 200, submit: { verdict: "wrong_answer", testsPassed: 1, testsTotal: 8, failingTest: 2 } },
      { at: 280, code: CPP_TEMPLATE },
      { at: 420, code: CPP_BFS_STATE_SPACE },
      { at: 470, submit: { verdict: "accepted", testsPassed: 8, testsTotal: 8 } },
      { at: 490, close: "accepted" },
    ],
  },

  {
    id: "r18-bounced-at-first-read",
    title: "Opened it and left",
    taskRef: "solvex:1955G",
    language: "cpp17",
    expect: "Read the statement for forty seconds and closed it. Never wrote a character.",
    wantOutcome: "abandoned",
    steps: [
      { at: 0, statementRevisit: {} },
      { at: 40, close: "navigated" },
    ],
  },

  {
    id: "r19-state-modelling-failure",
    title: "Traversal is fine, modelling the state is not",
    taskRef: "solvex:1955G",
    language: "cpp17",
    expect:
      "Wrote a correct plain BFS twice with small variations. The problem needed a (node, parity) state. They never got there. This is the brief's exact learner.",
    wantOutcome: "abandoned",
    steps: [
      { at: 130, code: CPP_BFS_VISITED },
      { at: 180, submit: { verdict: "wrong_answer", testsPassed: 4, testsTotal: 11, failingTest: 5 } },
      { at: 260, statementRevisit: { after: "wrong_answer" } },
      { at: 380, code: CPP_BFS_VISITED.replace("int seen = 0;", "int seen = 0; // count differently?") },
      { at: 420, submit: { verdict: "wrong_answer", testsPassed: 4, testsTotal: 11, failingTest: 5 } },
      { at: 520, hint: { level: 1, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 700, code: CPP_BFS_VISITED.replace("q.push(1);", "q.push(1); // still one dimension") },
      { at: 740, submit: { verdict: "wrong_answer", testsPassed: 4, testsTotal: 11, failingTest: 5 } },
      { at: 800, close: "navigated" },
    ],
  },

  {
    id: "r20-overflow",
    title: "Integer overflow, found without help",
    taskRef: "solvex:1873F",
    language: "cpp17",
    expect:
      "Passed the small tests, failed the big one, widened the accumulator to 64 bits. Classic, and diagnosed unaided.",
    wantOutcome: "accepted",
    steps: [
      { at: 80, code: CPP_OVERFLOW },
      { at: 110, run: { cases: 2 } },
      { at: 140, submit: { verdict: "wrong_answer", testsPassed: 6, testsTotal: 9, failingTest: 7 } },
      { at: 200, code: CPP_OVERFLOW_FIXED },
      { at: 230, submit: { verdict: "accepted", testsPassed: 9, testsTotal: 9 } },
      { at: 250, close: "accepted" },
    ],
  },
];
