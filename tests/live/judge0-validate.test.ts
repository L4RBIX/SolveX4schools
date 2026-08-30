import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetJudge0GateForTests } from "@schools/exec/providers/judge0";
import {
  NO_KEY_MESSAGE,
  parseArgs,
  runValidation,
  type ValidatorInput,
} from "../../scripts/live/judge0-validate";
import { startFakeJudge0, type FakeJudge0 } from "../exec/judge0-fake";

/**
 * The live validator, exercised without a live service.
 *
 * ## The test that matters most is the first one
 *
 * There is no RapidAPI key in this repository and there will not be one until
 * somebody exports it. Everything the validator does is therefore gated behind a
 * check that has to be exactly right: with no key it must say so plainly, write
 * nothing, and **spend nothing**. The suite proves the last of those the only way
 * it can be proved — by replacing `fetch` with something that throws, and
 * showing it was never called.
 *
 * ## What driving it against the fake does and does not prove
 *
 * `tests/exec/judge0-fake.ts` is a real HTTP server speaking Judge0's published
 * wire contract, so a run against it exercises the whole validator: argument
 * parsing, the budget arithmetic, the meter that counts submissions and polls
 * separately, the concurrency ladder, the report renderer, and every phase's
 * accounting. Its `violations` array also checks the reverse direction — that
 * the requests the validator caused are the requests Judge0 documents.
 *
 * It proves NOTHING about RapidAPI. The fake does not run Python; it answers
 * from fixtures written to match what CPython prints for the conformance
 * programs, and it answers an unknown program with an empty stdout. So the
 * conformance assertions below are about the ADAPTER and the validator's
 * bookkeeping, and the parity, probe and cost CONTENT assertions are
 * deliberately absent: those are claims about a service, and no service has
 * been contacted.
 */

/** A distinctive stand-in, so "the key never appears in the report" is testable. */
const FAKE_KEY = "not-a-real-rapidapi-key-0000-DISTINCTIVE";

interface Capture {
  lines: string[];
  files: { path: string; contents: string }[];
}

function inputFor(fake: FakeJudge0, argv: string[], env: Record<string, string> = {}): { input: ValidatorInput; capture: Capture } {
  const capture: Capture = { lines: [], files: [] };
  return {
    capture,
    input: {
      argv: [`--base-url=${fake.url}`, "--host=fake.judge.local", ...argv],
      env: {
        JUDGE0_RAPIDAPI_KEY: FAKE_KEY,
        /* 5 ms instead of 250. The cadence is a spending decision against a real
           judge and a wall-clock decision here: at the shipped interval the
           polling loop alone would add half a minute to this suite. */
        JUDGE0_POLL_INTERVAL_MS: "5",
        ...env,
      },
      write: (line) => capture.lines.push(line),
      saveFile: (path, contents) => capture.files.push({ path, contents }),
    },
  };
}

describe("judge0:validate — with no key (the state of this repository today)", () => {
  it("says so, spends nothing, and writes nothing", async () => {
    const capture: Capture = { lines: [], files: [] };
    const realFetch = globalThis.fetch;
    let called = 0;
    globalThis.fetch = (() => {
      called += 1;
      throw new Error("the validator must not contact anything without a key");
    }) as typeof globalThis.fetch;

    try {
      const outcome = await runValidation({
        argv: [],
        /* Deliberately not `process.env`: the whole point is a controlled
           absence, and a machine that happens to have a key exported must not
           turn this test green for the wrong reason — or spend money running it. */
        env: {},
        write: (line) => capture.lines.push(line),
        saveFile: (path, contents) => capture.files.push({ path, contents }),
      });

      expect(called).toBe(0);
      expect(outcome.submissionsSpent).toBe(0);
      expect(outcome.apiRequestsSpent).toBe(0);
      expect(outcome.report).toBeNull();
      expect(outcome.reportPath).toBeNull();
      /* Exit 2, not 1: nothing failed, because nothing was asked. */
      expect(outcome.exitCode).toBe(2);
      expect(capture.files).toHaveLength(0);
      expect(capture.lines.join("\n")).toBe(NO_KEY_MESSAGE);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("does not invent a report file for a run that never happened", async () => {
    const capture: Capture = { lines: [], files: [] };
    await runValidation({
      argv: ["--only=languages"],
      env: {},
      write: (line) => capture.lines.push(line),
      saveFile: (path, contents) => capture.files.push({ path, contents }),
    });
    /* A JUDGE0_LIVE_VALIDATION.md full of UNKNOWN sitting in docs/infrastructure
       would be read as a result within a week. The file's existence has to mean
       a run happened. */
    expect(capture.files).toHaveLength(0);
  });
});

describe("judge0:validate — arguments", () => {
  it("refuses a phase name it does not know rather than silently running everything", () => {
    const parsed = parseArgs(["--only=languages,typo"]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.problem).toContain("typo");
  });

  it("runs phases in dependency order, not the order they were typed", () => {
    const parsed = parseArgs(["--only=concurrency,languages"]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.args.phases).toEqual(["languages", "concurrency"]);
  });

  it("refuses a non-numeric ceiling", () => {
    expect(parseArgs(["--max-submissions=lots"]).ok).toBe(false);
  });
});

describe("judge0:validate — driven against the protocol-faithful fake", () => {
  let fake: FakeJudge0;

  beforeAll(async () => {
    fake = await startFakeJudge0();
  });
  afterAll(async () => {
    await fake.close();
  });
  beforeEach(() => {
    fake.reset();
    /* The gate is process-global and first-limit-wins by design. Several runs
       in one vitest worker would otherwise all inherit whichever width the
       first one happened to construct. */
    resetJudge0GateForTests();
  });

  it("runs identity and conformance, and every conformance row matches", async () => {
    const { input, capture } = inputFor(fake, ["--only=languages,conformance", "--max-submissions=40"]);
    const outcome = await runValidation(input);

    expect(outcome.report).not.toBeNull();
    const report = outcome.report;
    if (!report) throw new Error("no report");

    /* The adapter's own discovery, not a reimplementation of it: the fake's
       catalogue carries a Python 2.7 and a numpy-preloaded `Python for ML`
       precisely so a validator that reported the wrong winner would be caught. */
    expect(report.languages?.selected?.id).toBe(100);
    expect(report.languages?.selected?.version).toBe("3.12.5");
    expect(report.languages?.pythonEntries.map((e) => e.id)).toEqual([70, 71, 92, 100, 127]);
    expect(report.languages?.pythonEntries.find((e) => e.id === 127)?.matchesDiscoveryRule).toBe(false);

    expect(report.conformance).toHaveLength(11);
    const missed = (report.conformance ?? []).filter((r) => !r.matched);
    expect(missed.map((r) => `${r.id}: ${r.mismatch ?? ""}`)).toEqual([]);

    /* Submissions and API requests are different numbers and the report has to
       keep them different: eleven conformance programs plus one `sys.version`,
       against far more HTTP calls because every submission is a POST and at
       least three polls. */
    expect(outcome.submissionsSpent).toBe(12);
    expect(outcome.apiRequestsSpent).toBeGreaterThan(outcome.submissionsSpent);
    expect(report.spend.polls).toBeGreaterThan(0);

    /* The reverse direction: the requests this run caused are the requests
       Judge0 documents — units in seconds and kilobytes, `wait=false`,
       `enable_network: false`, and no `expected_output` anywhere. */
    expect(fake.violations).toEqual([]);

    expect(capture.files.length).toBeGreaterThan(0);
    const document = capture.files[capture.files.length - 1].contents;
    expect(document).not.toContain(FAKE_KEY);
    expect(document).toContain("# Judge0 CE via RapidAPI — live validation");
  }, 60_000);

  it("skips a phase whole when it will not fit under the ceiling", async () => {
    const { input } = inputFor(fake, ["--only=languages,conformance", "--max-submissions=1"]);
    const outcome = await runValidation(input);

    /* One submission for `sys.version`, and then a refusal to start an
       eleven-program phase it cannot finish. Half a conformance table is worse
       than none, because it is read as a whole one. */
    expect(outcome.submissionsSpent).toBe(1);
    expect(outcome.report?.skipped.map((s) => s.phase)).toEqual(["conformance"]);
    expect(outcome.report?.conformance).toBeNull();
  }, 30_000);

  it("still does the free reconnaissance when the ceiling is zero", async () => {
    const { input } = inputFor(fake, ["--max-submissions=0"]);
    const outcome = await runValidation(input);

    /* Zero budget is a supported and useful mode, not a refusal to work: the
       catalogue, which Python the adapter would pick, the quota headers and
       `/config_info` are all free. Only `sys.version` costs a submission, and
       it is the one thing the identity section reports as not asked. */
    expect(outcome.submissionsSpent).toBe(0);
    expect(outcome.report?.languages?.selected?.id).toBe(100);
    expect(outcome.report?.languages?.interpreterVersion).toBeNull();
    expect(outcome.report?.languages?.interpreterProblem).toContain("no submission budget");
    /* `GET /languages` is an API request even though it is not a submission —
       the two numbers are different and the report keeps them apart. */
    expect(outcome.apiRequestsSpent).toBeGreaterThan(0);
    expect(outcome.report?.skipped.map((s) => s.phase)).toEqual([
      "conformance",
      "probes",
      "parity",
      "cost",
      "concurrency",
    ]);
  }, 30_000);

  it("climbs the concurrency ladder 1 → 2 → 4 → 8 and never issues eighteen", async () => {
    const { input } = inputFor(fake, ["--only=concurrency", "--max-submissions=40"]);
    const outcome = await runValidation(input);

    const stages = outcome.report?.concurrency?.stages ?? [];
    expect(stages.map((s) => s.width)).toEqual([1, 2, 4, 8]);
    expect(stages.every((s) => s.rateLimited === 0)).toBe(true);
    expect(outcome.report?.concurrency?.stoppedAtWidth).toBeNull();
    expect(outcome.submissionsSpent).toBe(15);
    /* Wider stages must actually be wider: at width 8 the whole burst overlaps,
       so it finishes in far less than eight times one submission. */
    const widest = stages[stages.length - 1];
    expect(widest.wallMs).toBeLessThan(widest.p50Ms * widest.width);
  }, 60_000);

  it("stops the ladder permanently at the first 429 and says where", async () => {
    /* The fake refuses every POST from the fourth one onward, which lands
       inside the width-4 stage. A validator that carried on to width 8 would be
       spending an operator's quota to re-learn something it had just been told. */
    let posts = 0;
    fake.setHandler((ctx) => {
      if (ctx.method === "POST") {
        posts += 1;
        if (posts > 3) return { kind: "http", status: 429, body: { message: "Too many requests" } };
      }
      return { kind: "default" };
    });

    const { input } = inputFor(fake, ["--only=concurrency", "--max-submissions=40"]);
    const outcome = await runValidation(input);

    const phase = outcome.report?.concurrency;
    expect(phase?.stoppedAtWidth).toBe(4);
    expect(phase?.stopReason).toContain("429");
    expect(phase?.stages.map((s) => s.width)).toEqual([1, 2, 4]);
  }, 60_000);

  it("measures a Check's submissions and its API requests as different numbers", async () => {
    const { input } = inputFor(fake, ["--only=cost", "--max-submissions=60"]);
    const outcome = await runValidation(input);

    const cost = outcome.report?.cost;
    expect(cost?.ordinary).not.toBeNull();
    expect(cost?.worstCase).not.toBeNull();
    if (!cost?.ordinary || !cost.worstCase) throw new Error("cost not measured");

    /* One press of Check is one submission per declared case — every case, for a
       wrong answer as well as a right one. */
    expect(cost.ordinary.submissions).toBe(cost.ordinary.caseCount);
    /* And never one request per case: each submission is a POST plus its polls. */
    expect(cost.ordinary.apiRequests).toBeGreaterThan(cost.ordinary.submissions);
    expect(cost.worstCase.caseCount).toBeGreaterThanOrEqual(cost.ordinary.caseCount);
    expect(cost.classroomStudents).toBe(18);
  }, 60_000);

  it("records every executable parity fixture, and never puts the key in the document", async () => {
    const { input, capture } = inputFor(fake, ["--only=parity", "--max-submissions=60"]);
    const outcome = await runValidation(input);

    /* Row count only. The fake does not run Python — it answers an unrecognised
       program with an empty stdout — so whether September's arithmetic agrees
       with Judge0 is a question only the live run can ask, and asserting it here
       would be asserting a fixture against itself. */
    expect(outcome.report?.parity?.length).toBeGreaterThan(20);
    const document = capture.files[capture.files.length - 1].contents;
    expect(document).not.toContain(FAKE_KEY);
    expect(document).toContain("## 4. Parity with the September curriculum");
  }, 90_000);
});

describe("a failed discovery stops the run instead of blessing it", () => {
  /* Its own fake, with its own handler: the shared one above is configured for
     the happy path and several suites share it. */
  let fake: FakeJudge0;

  beforeEach(async () => {
    await fake?.close();
    fake = await startFakeJudge0();
  });

  afterAll(async () => {
    await fake?.close();
  });

  /**
   * Found by pointing the validator at the real service with a deliberately
   * invalid key. It answered 3 × 429, read no catalogue, identified no Python
   * runtime — and exited **0**.
   *
   * Zero means clean. The operator's own instruction for this phase is "if this
   * fails, STOP, do not proceed to paid execution", and exit 0 is exactly the
   * signal that tells a shell chain, a CI job or a tired human to continue to
   * the phases that spend money.
   *
   * It slipped through because the phase *completed*: it ran, wrote a section
   * saying UNKNOWN, and returned normally. Nothing downstream distinguished "we
   * looked and the answer is UNKNOWN" from "we could not look at all" — the
   * same shape, opposite facts.
   */
  it("exits non-zero when the catalogue cannot be read", async () => {
    fake.setHandler((ctx) =>
      ctx.path === "/languages" ? { kind: "http", status: 429 } : { kind: "default" },
    );

    const lines: string[] = [];
    /* `saveFile` injected, and NOT optional in practice.
       These last two cases omitted it and reached for `as ValidatorInput` to
       silence the compiler. `saveFile` is optional so the CLI can fall through
       to the real writer — so omitting it here meant every `npm test` run wrote
       fake-server output over the committed
       `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md`. That dirtied the tree on
       every test run, and it is why the release candidate shipped a "live
       validation" document whose own header admits it talked to
       `http://127.0.0.1:<random>` instead of RapidAPI. A test must not be able
       to overwrite the evidence a release is signed off on. */
    const files: { path: string; contents: string }[] = [];
    const outcome = await runValidation({
      argv: ["--only=languages", `--base-url=${fake.url}`],
      env: { JUDGE0_RAPIDAPI_KEY: "SECRET-KEY-DO-NOT-LEAK" },
      write: (l) => lines.push(l),
      saveFile: (path, contents) => files.push({ path, contents }),
    });

    expect(outcome.exitCode, "a run that learned nothing must not report success").toBe(1);
    expect(
      outcome.report?.findings.some(
        (f) => f.phase === "languages" && f.severity === "defect",
      ),
      "and must say why, as a defect rather than a note",
    ).toBe(true);
  });

  it("still exits zero when discovery genuinely succeeds", async () => {
    /* The complement. A guard that failed every run would be removed within a
       week, and then the real one would be gone too. */
    const written: { path: string; contents: string }[] = [];
    const outcome = await runValidation({
      argv: ["--only=languages", `--base-url=${fake.url}`],
      env: { JUDGE0_RAPIDAPI_KEY: "SECRET-KEY-DO-NOT-LEAK" },
      write: () => {},
      saveFile: (path, contents) => written.push({ path, contents }),
    });

    expect(outcome.report?.languages?.selected, "the fake does expose a Python").not.toBeNull();
    expect(outcome.exitCode).toBe(0);

    /* The report went to the INJECTED sink, not to the filesystem.
       The path it carries is still the real default — that is the validator
       reporting where a CLI run would put it — so the guarantee this asserts is
       that a `saveFile` was supplied at all and therefore nothing in this suite
       can reach disk. Both cases in this describe block previously omitted it
       and cast the input with `as ValidatorInput`, and every `npm test` then
       rewrote the committed document with fake-server output. */
    expect(
      written.length,
      "every artifact must reach the injected sink, so nothing reaches disk",
    ).toBeGreaterThan(0);
  });
});
