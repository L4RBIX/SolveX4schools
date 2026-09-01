import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PistonExecutionProvider } from "@schools/exec/providers/piston";
import { runCases, EXECUTION_LIMITS } from "@schools/exec";
import { startFakePiston, pistonRun, type FakePiston, type FakeReply } from "./fake-piston";

/**
 * Classroom load — what OUR code does when 18 children press the button.
 *
 * ## What this measures
 * The concurrency our own code generates, and the shape of it: how many judge
 * executions a class of 18 demands at the same instant, whether anything is
 * dropped, whether anything is retried, and how a partial judge outage is
 * reported. Those are properties of `PistonExecutionProvider` and `runCases`,
 * and a fake judge measures them exactly as well as a real one.
 *
 * ## What this does NOT measure
 * Whether a Piston box can serve that load. The fake answers in 80–200ms
 * because it does nothing; a real Piston creates a container, copies files in,
 * runs an interpreter and tears the container down. Every latency number below
 * is OUR overhead plus a synthetic delay, and none of it is evidence about a
 * judge that does not exist yet. The number to carry forward is the CONCURRENCY
 * — that one is ours, and it is what a real instance has to be sized for.
 */

/* Seeded so the delay sequence is byte-identical on every run and on every
   machine. A load test that is a little different each time cannot be a
   regression test. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 80–200ms: a plausible warm Piston, fast enough to keep the suite honest. */
function delays(seed = 20260827): () => number {
  const rng = mulberry32(seed);
  return () => 80 + Math.floor(rng() * 121);
}

interface Summary {
  n: number;
  min: number;
  median: number;
  p95: number;
  max: number;
}

function summarise(samples: number[]): Summary {
  const s = [...samples].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
  return {
    n: s.length,
    min: Math.round(s[0] ?? 0),
    median: Math.round(at(0.5)),
    /* Nearest-rank on 18 samples puts p95 ON the maximum. Reported anyway,
       labelled, because pretending 18 samples support a smooth percentile is
       worse than showing which observation it is. */
    p95: Math.round(at(0.95)),
    max: Math.round(s[s.length - 1] ?? 0),
  };
}

/** The measurements, printed together at the end so the run is readable as a report. */
const report: string[] = [];
function log(line: string) {
  report.push(line);
  console.log(line);
}

const CLASS_SIZE = 18;
const BUDGET_MS = 10_000;

/** `m1.l1.b5` — a real September block: four cases, two of them hidden. */
const FOUR_CASES = [
  { input: "5", expectedOutput: "25" },
  { input: "0", expectedOutput: "0" },
  { input: "-3", expectedOutput: "9", hidden: true },
  { input: "1000", expectedOutput: "1000000", hidden: true },
];
const SOLUTION =
  "#include <iostream>\nint main() { long long n; std::cin >> n; std::cout << n * n << \"\\n\"; }\n";

let fake: FakePiston;
let piston: PistonExecutionProvider;

/**
 * The fake's judge: squares whatever arrived on stdin, after a seeded delay.
 *
 * `raw === ""` answers `0` rather than nothing, because that is what the
 * program above would really do: `std::cin >> n` on empty input sets `failbit`
 * and leaves `n` value-initialised, so a missing stdin is a running program
 * printing zero. Modelling it as silence would make a dropped stdin look like a
 * different failure than it is.
 */
function judge(next: () => number) {
  return (req: { stdin?: string }): FakeReply => {
    const raw = (req.stdin ?? "").split("\n")[0]?.trim() ?? "";
    const n = raw === "" ? 0 : Number(raw);
    return {
      kind: "piston",
      body: pistonRun({ stdout: `${n * n}\n` }),
      delayMs: next(),
    };
  };
}

const REQ = {
  language: "cpp17" as const,
  stdin: "",
  timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
  memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
};

beforeAll(async () => {
  fake = await startFakePiston(judge(delays()));
  piston = new PistonExecutionProvider(fake.baseUrl);
});

beforeEach(() => {
  fake.setHandler(judge(delays()));
  fake.reset();
});

afterAll(async () => {
  await fake.stop();
  console.log(`\n${"=".repeat(72)}\nCLASSROOM LOAD REPORT\n${"=".repeat(72)}\n${report.join("\n")}\n`);
});

async function timed<T>(work: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = performance.now();
  const value = await work();
  return { value, ms: performance.now() - t0 };
}

describe("a class of 18 presses Run at the same moment", () => {
  it("serves all 18 well inside the 10s budget", async () => {
    const t0 = performance.now();
    const results = await Promise.all(
      Array.from({ length: CLASS_SIZE }, (_, i) =>
        timed(() => piston.run({ ...REQ, sourceCode: SOLUTION, stdin: `${i}\n` })),
      ),
    );
    const wall = performance.now() - t0;

    const ok = results.filter((r) => r.value.status === "ok").length;
    const infra = results.filter((r) => r.value.infrastructureError).length;
    const timeouts = results.filter((r) => r.value.status === "provider_timeout").length;
    const errors = results.filter((r) => r.value.status === "provider_error").length;
    const lat = summarise(results.map((r) => r.ms));

    log(
      `\nRUN BURST — ${CLASS_SIZE} learners, one execution each\n` +
        `  success            ${ok}/${CLASS_SIZE} (${Math.round((ok / CLASS_SIZE) * 100)}%)\n` +
        `  provider_error     ${errors}\n` +
        `  provider_timeout   ${timeouts}\n` +
        `  judge calls made   ${fake.stats.requests.length}\n` +
        `  PEAK CONCURRENT    ${fake.stats.peakConcurrent}\n` +
        `  latency ms         min ${lat.min} / median ${lat.median} / p95* ${lat.p95} / max ${lat.max}\n` +
        `  wall clock ms      ${Math.round(wall)} (budget ${BUDGET_MS})`,
    );

    expect(ok).toBe(CLASS_SIZE);
    expect(infra).toBe(0);
    expect(wall).toBeLessThan(BUDGET_MS);
    // Nothing dropped, nothing repeated: one execution per learner, exactly.
    expect(fake.stats.requests).toHaveLength(CLASS_SIZE);
    expect(fake.stats.violations).toEqual([]);
    /* The load-bearing number. Our code holds all 18 open at once — it does not
       queue them — so a real judge must have 18 execution slots or 18 learners
       become a queue with no backpressure and no message. */
    expect(fake.stats.peakConcurrent).toBeLessThanOrEqual(CLASS_SIZE);
    expect(fake.stats.peakConcurrent).toBeGreaterThanOrEqual(12);
  }, 30_000);
});

describe("a class of 18 presses Submit at the same moment", () => {
  it("runs 4 cases each — 72 executions — and stays inside the budget", async () => {
    const t0 = performance.now();
    const results = await Promise.all(
      Array.from({ length: CLASS_SIZE }, () => timed(() => runCases(piston, SOLUTION, FOUR_CASES))),
    );
    const wall = performance.now() - t0;

    const graded = results.filter((r) => !r.value.infrastructureFailed).length;
    const allPassed = results.filter((r) => r.value.results.every((c) => c.passed)).length;
    const lat = summarise(results.map((r) => r.ms));
    const perCase = summarise(
      fake.stats.requests.filter((r) => r.endedAt !== null).map((r) => r.endedAt! - r.startedAt),
    );

    log(
      `\nSUBMIT BURST — ${CLASS_SIZE} learners x 4 cases\n` +
        `  graded (measured)  ${graded}/${CLASS_SIZE}\n` +
        `  all cases passed   ${allPassed}/${CLASS_SIZE}\n` +
        `  infrastructure     ${CLASS_SIZE - graded}\n` +
        `  judge calls made   ${fake.stats.requests.length} (expected ${CLASS_SIZE * FOUR_CASES.length})\n` +
        `  PEAK CONCURRENT    ${fake.stats.peakConcurrent}\n` +
        `  per-submit ms      min ${lat.min} / median ${lat.median} / p95* ${lat.p95} / max ${lat.max}\n` +
        `  per-case ms        min ${perCase.min} / median ${perCase.median} / max ${perCase.max}\n` +
        `  wall clock ms      ${Math.round(wall)} (budget ${BUDGET_MS})`,
    );

    expect(graded).toBe(CLASS_SIZE);
    expect(allPassed).toBe(CLASS_SIZE);
    expect(wall).toBeLessThan(BUDGET_MS);
    // Exactly N cases per learner. No case dropped, no case run twice.
    expect(fake.stats.requests).toHaveLength(CLASS_SIZE * FOUR_CASES.length);
    expect(fake.stats.violations).toEqual([]);
    /* THE sizing fact. `runCases` awaits each case before starting the next, so
       72 executions arrive as at most 18 concurrent ones. A submit costs the
       judge 4x the WORK of a run but the same PEAK — and it costs the learner
       4x the WAIT, because their four cases are serial. */
    expect(fake.stats.peakConcurrent).toBeLessThanOrEqual(CLASS_SIZE);
    expect(fake.stats.peakConcurrent).toBeGreaterThanOrEqual(12);
    // Four serial cases: a submit cannot be faster than four case latencies.
    expect(lat.median).toBeGreaterThan(perCase.median * 2);
  }, 30_000);
});

describe("the mixed burst that actually happens in a lesson", () => {
  it("half the class experimenting while the other half submits", async () => {
    const t0 = performance.now();
    const runs = Array.from({ length: CLASS_SIZE }, (_, i) =>
      timed(() => piston.run({ ...REQ, sourceCode: SOLUTION, stdin: `${i}\n` })),
    );
    const submits = Array.from({ length: CLASS_SIZE }, () =>
      timed(() => runCases(piston, SOLUTION, FOUR_CASES)),
    );
    const [runResults, submitResults] = await Promise.all([
      Promise.all(runs),
      Promise.all(submits),
    ]);
    const wall = performance.now() - t0;

    const runLat = summarise(runResults.map((r) => r.ms));
    const submitLat = summarise(submitResults.map((r) => r.ms));
    const expected = CLASS_SIZE + CLASS_SIZE * FOUR_CASES.length;

    log(
      `\nMIXED BURST — ${CLASS_SIZE} runs + ${CLASS_SIZE} submits, all at once\n` +
        `  runs ok            ${runResults.filter((r) => r.value.status === "ok").length}/${CLASS_SIZE}\n` +
        `  submits graded     ${submitResults.filter((r) => !r.value.infrastructureFailed).length}/${CLASS_SIZE}\n` +
        `  judge calls made   ${fake.stats.requests.length} (expected ${expected})\n` +
        `  PEAK CONCURRENT    ${fake.stats.peakConcurrent}\n` +
        `  run latency ms     median ${runLat.median} / p95* ${runLat.p95} / max ${runLat.max}\n` +
        `  submit latency ms  median ${submitLat.median} / p95* ${submitLat.p95} / max ${submitLat.max}\n` +
        `  wall clock ms      ${Math.round(wall)} (budget ${BUDGET_MS})`,
    );

    expect(runResults.every((r) => r.value.status === "ok")).toBe(true);
    expect(submitResults.every((r) => !r.value.infrastructureFailed)).toBe(true);
    expect(fake.stats.requests).toHaveLength(expected);
    expect(wall).toBeLessThan(BUDGET_MS);
    /* Run and Submit share one judge and neither yields to the other, so the
       peak is additive: 36, not 18. This is the number to size for, and it is
       why a box tuned for "18 students" is tuned for the wrong 18. */
    expect(fake.stats.peakConcurrent).toBeLessThanOrEqual(CLASS_SIZE * 2);
    expect(fake.stats.peakConcurrent).toBeGreaterThan(CLASS_SIZE);
  }, 30_000);
});

describe("nothing retries, and that is the correct choice", () => {
  it("a failed execution is attempted exactly once", async () => {
    const next = delays();
    fake.setHandler(() => ({ kind: "http", status: 503, body: { message: "down" }, delayMs: next() }));

    const r = await piston.run({ ...REQ, sourceCode: SOLUTION });

    expect(r.status).toBe("provider_error");
    /* If this is ever 2, read the comment below before celebrating. */
    expect(fake.stats.requests).toHaveLength(1);
  }, 30_000);

  it("a failed submit abandons the remaining cases instead of re-running any", async () => {
    const next = delays();
    fake.setHandler((req, ctx) =>
      ctx.index === 2
        ? { kind: "http", status: 503, body: { message: "down" }, delayMs: next() }
        : judge(next)(req),
    );

    const { results, infrastructureFailed } = await runCases(piston, SOLUTION, FOUR_CASES);

    expect(infrastructureFailed).toBe(true);
    expect(results).toHaveLength(2);
    // Three calls: two that worked, one that failed, and then it stopped.
    expect(fake.stats.requests).toHaveLength(3);

    /* WHY NO RETRY, and where one would now be safe.
     *
     * A retry inside the adapter is safe on its own — running a sandboxed
     * program twice has no side effects. The danger used to be one layer up:
     * `/api/learning/submit` had no idempotency key, appended
     * `verdict_received` and `failure_attributed` on every call, and derived the
     * learner's prior-failure count by COUNTING those rows. A submission that
     * reached the route twice was two attempts by the same child — an inflated
     * failure count, a reveal policy moved along by a retry nobody made, and an
     * attempt handed to the reducer that never happened.
     *
     * That is fixed: the client mints a `submissionId` per press of Check and
     * the route claims it before grading, so a duplicate replays the first
     * verdict and writes nothing. See `schools/learning/submission.ts`,
     * migration 0019 and `tests/school/submission-idempotency.test.ts`.
     *
     * The conclusion for THIS file is unchanged. A retry, if one is ever wanted,
     * still belongs here — around a single case, where re-running a program has
     * no consequences at all — and not around the route, where the honest answer
     * to a dead judge remains `unknown` rather than a second attempt at getting
     * a verdict out of it.
     */
  }, 30_000);
});

describe("a judge that is failing intermittently", () => {
  it("costs measurements, never a learner's record", async () => {
    /* Every third execution 503s: a judge under memory pressure, or one box of
       two behind a load balancer being unhealthy. Deterministic on purpose. */
    const next = delays();
    fake.setHandler((req, ctx) =>
      ctx.index % 3 === 2
        ? { kind: "http", status: 503, body: { message: "unhealthy" }, delayMs: next() }
        : judge(next)(req),
    );

    const t0 = performance.now();
    const results = await Promise.all(
      Array.from({ length: CLASS_SIZE }, () => timed(() => runCases(piston, SOLUTION, FOUR_CASES))),
    );
    const wall = performance.now() - t0;

    const unmeasured = results.filter((r) => r.value.infrastructureFailed).length;
    const measured = CLASS_SIZE - unmeasured;
    const wronglyFailed = results.filter(
      (r) => r.value.infrastructureFailed && r.value.results.some((c) => !c.passed),
    ).length;

    log(
      `\nDEGRADED JUDGE — 1 execution in 3 returns 503\n` +
        `  measured           ${measured}/${CLASS_SIZE}\n` +
        `  unmeasured (honest)${String(unmeasured).padStart(3)}/${CLASS_SIZE}\n` +
        `  learners recorded wrong because of the outage: ${wronglyFailed}\n` +
        `  judge calls made   ${fake.stats.requests.length}\n` +
        `  PEAK CONCURRENT    ${fake.stats.peakConcurrent}\n` +
        `  wall clock ms      ${Math.round(wall)}`,
    );

    expect(unmeasured).toBeGreaterThan(0);
    /* The point. Every learner the outage touched is reported as UNMEASURED, and
       an unmeasured submit writes no verdict at all — so however bad the judge
       gets, the failure mode is missing evidence, never false evidence. */
    for (const r of results) {
      if (r.value.infrastructureFailed) {
        expect(r.value.results.length).toBeLessThan(FOUR_CASES.length);
      } else {
        expect(r.value.results.every((c) => c.passed)).toBe(true);
      }
    }
    expect(wall).toBeLessThan(BUDGET_MS);
  }, 30_000);
});
