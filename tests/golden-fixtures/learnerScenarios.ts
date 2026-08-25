/**
 * One hundred engineering fixtures, grouped into learner journeys.
 *
 * The twenty traces in `replayTraces.ts` are single episodes, and single
 * episodes are enough to test the episode reducer. They are NOT enough to test
 * anything about a learner: "this person keeps making the same mistake" and
 * "this person cannot solve anything without a level-3 hint" are properties of
 * a HISTORY, and the pipeline currently has no layer that holds one.
 *
 * So these fixtures are organised the other way round: ten synthetic learners,
 * roughly ten episodes each, where the learner's defining behaviour is stated
 * up front and the episodes are generated to exhibit it. That makes them usable
 * as a detection test — we know what each learner is, so we can measure whether
 * the pipeline can tell.
 *
 * THEY ARE NOT DATA. No rate computed over them describes any real population.
 * A percentage here answers exactly one question: given a learner who really
 * does have this property, does the pipeline notice? That is a property of our
 * code, which is what we are trying to measure.
 *
 * The parameterised families are deliberate. A hundred hand-written literals
 * would drift from each other and would encode a hundred accidental choices;
 * ten families with an explicit knob encode ten intentional ones.
 */

import type { LearningVerdict } from "../../packages/learning-contracts/src/events";
import type { ReplayTrace, TraceStep } from "./replayTraces";

// ─── Code stages ─────────────────────────────────────────────────────────────
//
// Compact but real. The classifier runs on these, so they have to change the
// way a learner's code changes: a bound nudged, a loop restructured, a guard
// added.

const CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`;

const BSEARCH_BASE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
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

/** Bound nudges: same shape, one literal or comparison moved. */
const BSEARCH_TWEAKS = [
  BSEARCH_BASE.replace("if (a[mid] < k) lo = mid;", "if (a[mid] <= k) lo = mid;"),
  BSEARCH_BASE.replace("int mid = (lo + hi) / 2;", "int mid = (lo + hi + 1) / 2;"),
  BSEARCH_BASE.replace("int lo = 0, hi = n;", "int lo = 0, hi = n - 1;"),
];

const BSEARCH_FIXED = BSEARCH_BASE.replace("if (a[mid] < k) lo = mid;", "if (a[mid] < k) lo = mid + 1;");

const QUADRATIC = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    long long best = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++) {
            long long s = 0;
            for (int t = i; t <= j; t++) s += a[t];
            best = max(best, s);
        }
    cout << best << "\\n";
    return 0;
}
`;

const LINEAR = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    long long best = LLONG_MIN, cur = 0;
    for (int i = 0; i < n; i++) {
        int x; cin >> x;
        cur = max((long long) x, cur + x);
        best = max(best, cur);
    }
    cout << best << "\\n";
    return 0;
}
`;

const LINEAR_GUARDED = LINEAR.replace(
  '    cout << best << "\\n";',
  '    if (n == 0) best = 0;\n    cout << best << "\\n";'
);

const GREEDY_WRONG = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.rbegin(), a.rend());
    long long total = 0;
    for (int i = 0; i < n; i += 2) total += a[i];
    cout << total << "\\n";
    return 0;
}
`;

const GREEDY_DP = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    vector<long long> dp(n + 1, 0);
    for (int i = 1; i <= n; i++)
        dp[i] = max(dp[i - 1], (i >= 2 ? dp[i - 2] : 0) + a[i - 1]);
    cout << dp[n] << "\\n";
    return 0;
}
`;

const COMPILE_BROKEN = LINEAR.replace("int n; cin >> n;", "int n; cin >> n");
const COMPILE_BROKEN_2 = LINEAR.replace("int n; cin >> n;", "int n cin >> n;");

const INDEX_CRASH = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (int i = 0; i <= n; i++) cin >> a[i];
    cout << a[n] << "\\n";
    return 0;
}
`;

const TWO_POINTER_NO_INVARIANT = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k; cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int best = 0, l = 0;
    long long sum = 0;
    for (int r = 0; r < n; r++) {
        sum += a[r];
        if (sum > k) { sum -= a[l]; l++; }
        best = max(best, r - l + 1);
    }
    cout << best << "\\n";
    return 0;
}
`;

const TWO_POINTER_FIXED = TWO_POINTER_NO_INVARIANT.replace(
  "        if (sum > k) { sum -= a[l]; l++; }",
  "        while (sum > k && l <= r) { sum -= a[l]; l++; }"
);

// ─── Scenario vocabulary ─────────────────────────────────────────────────────

/** What the learner actually is. The fixture's ground truth. */
export type LearnerArchetype =
  | "boundary_blind"
  | "hint_dependent"
  | "solution_copier"
  | "complexity_naive"
  | "compile_fighter"
  | "edge_case_misser"
  | "comprehension_gap"
  | "steady_improver"
  | "early_abandoner"
  | "fluent";

export interface LearnerScenario extends ReplayTrace {
  /** Which synthetic learner this episode belongs to. */
  subject: string;
  archetype: LearnerArchetype;
  /** Taxonomy skill the task exercises. */
  skill: string;
  /** Episode index within this learner's history, 1-based. */
  episodeIndex: number;
}

interface EpisodeSpec {
  task: string;
  skill: string;
  steps: TraceStep[];
  wantStruggle?: string;
  wantOutcome?: string;
  wantHintOutcome?: string;
  expect: string;
}

/** A failed submit plus the attribution the verifier would have produced. */
function failWith(
  at: number,
  verdict: LearningVerdict,
  opts: {
    testsPassed?: number;
    testsTotal?: number;
    failingTest?: number;
    failureClass?: string;
    source?: "judge" | "verifier";
    confidence?: number;
    reason?: string;
  } = {}
): TraceStep[] {
  const steps: TraceStep[] = [
    {
      at,
      submit: {
        verdict,
        testsPassed: opts.testsPassed,
        testsTotal: opts.testsTotal,
        failingTest: opts.failingTest,
      },
    },
  ];
  if (opts.failureClass) {
    steps.push({
      at: at + 2,
      attribution: {
        failureClass: opts.failureClass,
        source: opts.source ?? "judge",
        confidence: opts.confidence ?? 0.1,
        reason: opts.reason,
      },
    });
  }
  return steps;
}

// ─── Families ────────────────────────────────────────────────────────────────

/**
 * Repeatedly nudges a binary-search bound and resubmits. The verdict never
 * moves off the same failing test, which is what makes it thrashing rather
 * than debugging.
 */
function boundaryBlindEpisode(index: number, solves: boolean): EpisodeSpec {
  const tweak = BSEARCH_TWEAKS[index % BSEARCH_TWEAKS.length];
  const steps: TraceStep[] = [
    { at: 60, code: BSEARCH_BASE },
    ...failWith(120, "wrong_answer", {
      testsPassed: 2, testsTotal: 10, failingTest: 3,
      failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
    }),
    { at: 180, code: tweak },
    ...failWith(230, "wrong_answer", {
      testsPassed: 2, testsTotal: 10, failingTest: 3,
      failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
    }),
    { at: 290, code: BSEARCH_BASE },
    ...failWith(340, "wrong_answer", {
      testsPassed: 2, testsTotal: 10, failingTest: 3,
      failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
    }),
  ];
  if (solves) {
    steps.push({ at: 420, code: BSEARCH_FIXED });
    steps.push({ at: 470, submit: { verdict: "accepted", testsPassed: 10, testsTotal: 10 } });
    steps.push({ at: 490, close: "accepted" });
  } else {
    steps.push({ at: 400, close: "navigated" });
  }
  return {
    task: `solvex:bs-${index}`,
    skill: "binary_search",
    steps,
    wantStruggle: "thrash",
    wantOutcome: solves ? "accepted" : "abandoned",
    expect: "Nudges the bound, resubmits, same failing test every time.",
  };
}

/** Always reaches for a high-level hint early, then succeeds. */
function hintDependentEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:hd-${index}`,
    skill: index % 2 === 0 ? "binary_search" : "greedy_constructive",
    steps: [
      { at: 50, code: CPP_TEMPLATE },
      ...failWith(110, "wrong_answer", {
        testsPassed: 1, testsTotal: 8, failingTest: 2,
        failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
      }),
      // Asks for level 3 within 40 seconds of the first failure.
      { at: 150, hint: { level: 3, containsCode: false, evidenceType: "verified_test_failure", mode: "hint" } },
      { at: 230, code: LINEAR },
      { at: 280, submit: { verdict: "accepted", testsPassed: 8, testsTotal: 8 } },
      { at: 300, close: "accepted" },
    ],
    wantOutcome: "accepted",
    wantHintOutcome: "resolved_independently",
    expect: "Reaches for a level-3 hint 40 seconds after the first failure, every time.",
  };
}

/** Takes a code-carrying hint and pastes it. */
function copierEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:cp-${index}`,
    skill: "dynamic_programming",
    steps: [
      { at: 60, code: CPP_TEMPLATE },
      ...failWith(120, "wrong_answer", {
        testsPassed: 0, testsTotal: 9, failingTest: 1,
        failureClass: "unattributed_failure", reason: "no_passed_test_to_compare",
      }),
      { at: 170, hint: { level: 4, containsCode: true, evidenceType: "verified_counterexample", mode: "debug" } },
      // Large structural edit immediately after a hint that carried code.
      { at: 210, code: GREEDY_DP },
      { at: 240, submit: { verdict: "accepted", testsPassed: 9, testsTotal: 9 } },
      { at: 260, close: "accepted" },
    ],
    wantOutcome: "accepted",
    wantHintOutcome: "resolved_by_transfer",
    expect: "Requests implementation-level help, pastes it, accepted.",
  };
}

/** Writes the naive solution, times out, and only sometimes rewrites. */
function complexityNaiveEpisode(index: number, rewrites: boolean): EpisodeSpec {
  const steps: TraceStep[] = [
    { at: 70, code: QUADRATIC },
    ...failWith(130, "time_limit_exceeded", {
      testsPassed: 4, testsTotal: 12, failingTest: 5,
      // Only a gated pack can call this a complexity failure. Most cannot.
      failureClass: index % 4 === 0 ? "complexity_asymptotic" : "unattributed_failure",
      source: index % 4 === 0 ? "verifier" : "judge",
      confidence: index % 4 === 0 ? 0.9 : 0.1,
      reason: index % 4 === 0 ? undefined : "no_runtime_gate_evidence",
    }),
  ];
  if (rewrites) {
    steps.push({ at: 260, code: LINEAR });
    steps.push({ at: 310, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } });
    steps.push({ at: 330, close: "accepted" });
  } else {
    steps.push({ at: 200, code: QUADRATIC.replace("long long best = 0;", "long long best = 1;") });
    steps.push(
      ...failWith(250, "time_limit_exceeded", {
        testsPassed: 4, testsTotal: 12, failingTest: 5,
        failureClass: "unattributed_failure", reason: "no_runtime_gate_evidence",
      })
    );
    steps.push({ at: 300, close: "navigated" });
  }
  return {
    task: `solvex:cx-${index}`,
    skill: "sequence_search",
    steps,
    wantOutcome: rewrites ? "accepted" : "abandoned",
    expect: rewrites
      ? "Times out on the naive solution, recognises it, rewrites linear."
      : "Times out, tweaks a constant, times out again.",
  };
}

function compileFighterEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:ce-${index}`,
    skill: "implementation",
    steps: [
      { at: 60, code: COMPILE_BROKEN },
      ...failWith(100, "compile_error", {
        testsPassed: 0, testsTotal: 10, failingTest: 1,
        failureClass: "compile_error", source: "judge", confidence: 1,
      }),
      { at: 150, code: COMPILE_BROKEN_2 },
      ...failWith(190, "compile_error", {
        testsPassed: 0, testsTotal: 10, failingTest: 1,
        failureClass: "compile_error", source: "judge", confidence: 1,
      }),
      { at: 240, code: LINEAR },
      { at: 280, submit: { verdict: "accepted", testsPassed: 10, testsTotal: 10 } },
      { at: 300, close: "accepted" },
    ],
    wantOutcome: "accepted",
    expect: "Two compile errors before any test runs; the algorithm is never measured.",
  };
}

function edgeMisserEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:ed-${index}`,
    skill: "sequence_search",
    steps: [
      { at: 70, code: LINEAR },
      ...failWith(130, "wrong_answer", {
        testsPassed: 7, testsTotal: 10, failingTest: 8,
        // The failing test is smaller than everything that passed.
        failureClass: "edge_case_handling", source: "verifier", confidence: 0.6,
      }),
      { at: 200, code: LINEAR_GUARDED },
      { at: 250, submit: { verdict: "accepted", testsPassed: 10, testsTotal: 10 } },
      { at: 270, close: "accepted" },
    ],
    wantOutcome: "accepted",
    expect: "Solves the general case, breaks on the degenerate one, guards it.",
  };
}

function comprehensionEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:cm-${index}`,
    skill: "greedy_constructive",
    steps: [
      { at: 70, code: GREEDY_WRONG },
      ...failWith(130, "wrong_answer", {
        testsPassed: 0, testsTotal: 11, failingTest: 1,
        failureClass: "unattributed_failure", reason: "no_passed_test_to_compare",
      }),
      { at: 150, statementRevisit: { after: "wrong_answer" } },
      { at: 300, code: GREEDY_DP },
      { at: 350, submit: { verdict: "accepted", testsPassed: 11, testsTotal: 11 } },
      { at: 370, close: "accepted" },
    ],
    wantOutcome: "accepted",
    expect: "Fails test 1, rereads the statement, replaces the approach entirely.",
  };
}

function steadyImproverEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:si-${index}`,
    skill: "two_pointers",
    steps: [
      { at: 80, code: TWO_POINTER_NO_INVARIANT },
      ...failWith(140, "wrong_answer", {
        testsPassed: 3, testsTotal: 12, failingTest: 4,
        failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
      }),
      { at: 220, code: TWO_POINTER_FIXED },
      ...failWith(270, "wrong_answer", {
        testsPassed: 9, testsTotal: 12, failingTest: 10,
        failureClass: "unattributed_failure", reason: "no_counterexample_analysis",
      }),
      { at: 340, code: TWO_POINTER_FIXED.replace("int best = 0, l = 0;", "int best = 0, l = 0; // reset window") },
      { at: 400, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 420, close: "accepted" },
    ],
    wantStruggle: "productive_struggle",
    wantOutcome: "accepted",
    expect: "Window invariant missing, fixed after a real restructure; test count climbs.",
  };
}

function abandonerEpisode(index: number): EpisodeSpec {
  const wroteCode = index % 3 === 0;
  const steps: TraceStep[] = [{ at: 20, statementRevisit: {} }];
  if (wroteCode) steps.push({ at: 90, code: CPP_TEMPLATE });
  steps.push({ at: wroteCode ? 200 : 60, close: "navigated" });
  return {
    task: `solvex:ab-${index}`,
    skill: "dynamic_programming",
    steps,
    wantOutcome: "abandoned",
    expect: wroteCode ? "Types a template, leaves." : "Reads the statement, leaves.",
  };
}

function fluentEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:fl-${index}`,
    skill: index % 2 === 0 ? "sequence_search" : "two_pointers",
    steps: [
      { at: 90, code: index % 2 === 0 ? LINEAR : TWO_POINTER_FIXED },
      { at: 120, run: { cases: 2 } },
      { at: 160, submit: { verdict: "accepted", testsPassed: 12, testsTotal: 12 } },
      { at: 180, close: "accepted" },
    ],
    wantStruggle: "flow",
    wantOutcome: "accepted",
    expect: "Writes it, runs the samples, accepted.",
  };
}

/** A runtime crash, so the judge-stated classes are all represented. */
function crashEpisode(index: number): EpisodeSpec {
  return {
    task: `solvex:rt-${index}`,
    skill: "implementation",
    steps: [
      { at: 70, code: INDEX_CRASH },
      ...failWith(130, "runtime_error", {
        testsPassed: 0, testsTotal: 10, failingTest: 1,
        failureClass: "runtime_error", source: "judge", confidence: 1,
      }),
      { at: 200, code: LINEAR },
      { at: 250, submit: { verdict: "accepted", testsPassed: 10, testsTotal: 10 } },
      { at: 270, close: "accepted" },
    ],
    wantOutcome: "accepted",
    expect: "Reads one past the end, crashes, rewrites.",
  };
}

// ─── Journeys ────────────────────────────────────────────────────────────────

interface Journey {
  subject: string;
  archetype: LearnerArchetype;
  episodes: EpisodeSpec[];
}

function journeys(): Journey[] {
  return [
    {
      subject: "L01",
      archetype: "boundary_blind",
      // Same misconception, ten times. Solves only when it stops being the bound.
      episodes: Array.from({ length: 10 }, (_, i) => boundaryBlindEpisode(i, i >= 8)),
    },
    {
      subject: "L02",
      archetype: "hint_dependent",
      episodes: Array.from({ length: 10 }, (_, i) => hintDependentEpisode(i)),
    },
    {
      subject: "L03",
      archetype: "solution_copier",
      episodes: Array.from({ length: 10 }, (_, i) => copierEpisode(i)),
    },
    {
      subject: "L04",
      archetype: "complexity_naive",
      episodes: Array.from({ length: 10 }, (_, i) => complexityNaiveEpisode(i, i % 3 === 0)),
    },
    {
      subject: "L05",
      archetype: "compile_fighter",
      episodes: Array.from({ length: 10 }, (_, i) =>
        i % 4 === 3 ? crashEpisode(i) : compileFighterEpisode(i)
      ),
    },
    {
      subject: "L06",
      archetype: "edge_case_misser",
      episodes: Array.from({ length: 10 }, (_, i) => edgeMisserEpisode(i)),
    },
    {
      subject: "L07",
      archetype: "comprehension_gap",
      episodes: Array.from({ length: 10 }, (_, i) => comprehensionEpisode(i)),
    },
    {
      subject: "L08",
      archetype: "steady_improver",
      episodes: Array.from({ length: 10 }, (_, i) => steadyImproverEpisode(i)),
    },
    {
      subject: "L09",
      archetype: "early_abandoner",
      episodes: Array.from({ length: 10 }, (_, i) => abandonerEpisode(i)),
    },
    {
      subject: "L10",
      archetype: "fluent",
      episodes: Array.from({ length: 10 }, (_, i) => fluentEpisode(i)),
    },
  ];
}

export const LEARNER_SCENARIOS: LearnerScenario[] = journeys().flatMap((journey) =>
  journey.episodes.map((episode, index) => ({
    id: `${journey.subject}-e${String(index + 1).padStart(2, "0")}`,
    title: `${journey.archetype} · episode ${index + 1}`,
    taskRef: episode.task,
    language: "cpp17",
    subject: journey.subject,
    archetype: journey.archetype,
    skill: episode.skill,
    episodeIndex: index + 1,
    expect: episode.expect,
    wantStruggle: episode.wantStruggle,
    wantOutcome: episode.wantOutcome,
    wantHintOutcome: episode.wantHintOutcome,
    steps: [...episode.steps].sort((a, b) => a.at - b.at),
  }))
);

/** Ground truth: what each synthetic learner actually is. */
export const ARCHETYPE_BY_SUBJECT: Record<string, LearnerArchetype> = Object.fromEntries(
  journeys().map((j) => [j.subject, j.archetype])
);
