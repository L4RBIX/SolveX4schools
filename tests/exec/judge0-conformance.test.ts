import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXECUTION_LIMITS } from "@schools/exec";
import { isLearnerEvidence, type ExecutionRequest } from "@schools/exec/provider";
import { Judge0RapidApiProvider } from "@schools/exec/providers/judge0";
import { MIN_GNU_CXX17_MAJOR } from "@schools/execution/cpp-runtime";
import {
  BIG_INT_TEXT,
  EXPECTED_CPP_ID,
  PROGRAMS,
  startFakeJudge0,
  type FakeJudge0,
} from "./judge0-fake";

/**
 * The Judge0 conformance matrix — ONE suite, two judges.
 *
 * The same nine programs are asserted on the NORMALISED `ExecutionResult`,
 * first against a protocol-faithful fake and then, when `JUDGE0_LIVE_TEST=1`
 * and a key exists, against the real service. Writing it once is the point: a
 * second, differently-worded "live suite" would drift from this one and would
 * then prove something other than what CI proves.
 *
 * ## What a green run here does and does not mean
 *
 * **There is no RapidAPI key in this repository.** `env | grep -i rapidapi` is
 * empty, nothing in this file has ever contacted `judge0-ce.p.rapidapi.com`,
 * and the live half below has therefore NEVER RUN. What CI proves is that the
 * adapter speaks Judge0's published protocol correctly — the units, the
 * polling, the normalisation, the learner/judge boundary. What it cannot prove
 * is that a subscription exists, which Python it exposes, where its ceilings
 * sit, or that its sandbox is a sandbox.
 *
 * ## Running the live matrix, the moment a key exists
 *
 *   JUDGE0_LIVE_TEST=1 JUDGE0_RAPIDAPI_KEY=... npx vitest run tests/exec/judge0-conformance.test.ts
 *
 * It costs roughly a dozen submissions and takes about as many seconds — one of
 * them is deliberately an infinite loop, which spends its whole CPU limit.
 * `tests/store/postgres-driver.test.ts` is the pattern: skip loudly, name the
 * flag in the suite title, and let CI be the place it actually runs.
 *
 * ## The question this file does not ask
 *
 * Whether the box those programs ran in is a box. `enable_network: false` is a
 * field we SEND — `judge0-fake.ts` asserts we send it — and nothing in this
 * matrix asserts the service HONOURS it. Judge0 CE ships that setting
 * defaulted the other way (CVE-2024-29021), so it is a live question and not a
 * theoretical one. It lives in `judge0-probes.test.ts`, together with what the
 * plan reports about its own quota, in the same dual-mode shape and with the
 * same refusal to treat a missing key as a skip. One key answers both:
 *
 *   JUDGE0_LIVE_TEST=1 JUDGE0_RAPIDAPI_KEY=... npx vitest run \
 *     tests/exec/judge0-conformance.test.ts tests/exec/judge0-probes.test.ts
 */

/* Both halves must be true. A flag with no key would silently exercise
   nothing, and a key with no flag must never make `npm test` spend quota. */
const LIVE_FLAG = process.env.JUDGE0_LIVE_TEST === "1";
const LIVE_KEY = Boolean(process.env.JUDGE0_RAPIDAPI_KEY);
const LIVE = LIVE_FLAG && LIVE_KEY;

/** A generous per-test ceiling: a live submission is a queue plus a poll loop,
    and one of the programs below runs until its CPU limit is gone. */
const LIVE_TIMEOUT_MS = 60_000;

const REQUEST: Omit<ExecutionRequest, "sourceCode" | "stdin"> = {
  language: "cpp17",
  timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
  memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
};

/**
 * The matrix itself, parameterised only by which judge is behind it.
 *
 * Every assertion is on the normalised result — `ExecutionStatus`, stdout,
 * `infrastructureError` — because that is the whole of what leaves the
 * provider. Nothing here may reach for a Judge0 status id: if one could be
 * observed from out here, the normalisation boundary would already be broken.
 */
function conformanceMatrix(judge: () => Judge0RapidApiProvider) {
  const run = (sourceCode: string, stdin = "") => judge().run({ ...REQUEST, sourceCode, stdin });

  it(
    "1. hello world runs, and says so",
    async () => {
      const r = await run(PROGRAMS.hello);
      expect(r.status).toBe("ok");
      expect(r.stdout).toBe("hello, world\n");
      expect(r.infrastructureError).toBe(false);
      expect(r.providerId).toBe("judge0_rapidapi");
      expect(isLearnerEvidence(r.status)).toBe(true);
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "2. stdin reaches the program: `3 7` becomes 10",
    async () => {
      /* The answer is COMPUTED from the stdin that arrived, on both judges. A
         fixture that answered `10` from a lookup table would pass while we sent
         no stdin at all — which is how an entire class gets graded wrong with a
         green suite. */
      const r = await run(PROGRAMS.sumPair, "3 7\n");
      expect(r.status).toBe("ok");
      expect(r.stdout).toBe("10\n");
      const other = await run(PROGRAMS.sumPair, "20 22\n");
      expect(other.stdout).toBe("42\n");
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "3. a program that never compiled is a COMPILE error, not a runtime one",
    async () => {
      /* The distinction a fourteen-year-old actually needs: look at your
         punctuation, or look at your logic.
         It is now STRUCTURAL. Judge0 answers status id 6 and puts the
         compiler's diagnostics in `compile_output`, its own field — where the
         Python era had CPython reporting a missing bracket as an ordinary
         non-zero exit, Judge0 reporting NZEC, and a shared prose-matching
         predicate at the port doing the guessing. That predicate is gone; this
         assertion is what replaced it.
         The diagnostics must SURVIVE the normalisation. A `compile_error` whose
         stderr is empty tells the learner nothing at all. */
      const r = await run(PROGRAMS.syntax);
      expect(r.status).toBe("compile_error");
      expect(r.status).not.toBe("runtime_error");
      expect(r.stderr).toContain("error:");
      expect(r.infrastructureError).toBe(false);
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "4. a crash is a runtime error, and whatever the program said survives",
    async () => {
      /* Two shapes, because C++ has two and a learner meets both.

         An uncaught exception runs libstdc++'s terminate handler, which writes
         a real sentence to stderr before aborting. That text is the only thing
         the learner has to work from, so it must survive normalisation. */
      const threw = await run(PROGRAMS.throwing);
      expect(threw.status).toBe("runtime_error");
      expect(threw.stderr).toContain("std::out_of_range");
      expect(isLearnerEvidence(threw.status)).toBe(true);

      /*
       * Integer division by zero is a SIGNAL, and what the judge says about it
       * changed under us.
       *
       * This asserted `stderr === ""`, with a note explaining that the only
       * description lived in Judge0's own `message` field and was deliberately
       * not forwarded. Measured live on 2026-09-05, the field now carries the
       * sandbox's shell talking:
       *
       *     run.sh: line 1:     3 Floating point exception(core dumped) ./a.out
       *
       * The verdict is still right. The text is not ours, names a container's
       * script and binary, and is not addressed to a fourteen-year-old — the
       * same rule the browser runtime already obeys. `sanitizeJudgeStderr`
       * keeps the CAUSE and drops the shell, and this asserts both halves: the
       * learner is told what happened, and is told nothing about `run.sh`.
       */
      const divided = await run(PROGRAMS.divZero);
      expect(divided.status).toBe("runtime_error");
      expect(divided.stderr, "the judge's own shell reached a learner").not.toContain("run.sh");
      expect(divided.stderr).not.toContain("./a.out");
      expect(divided.stderr).not.toContain("core dumped");
      if (divided.stderr !== "") {
        expect(divided.stderr.toLowerCase()).toContain("floating point exception");
      }
      expect(isLearnerEvidence(divided.status)).toBe(true);
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "5. the LEARNER'S slow program is evidence, not an outage",
    async () => {
      /* The single most important row in this matrix. Judge0 reports the
         learner's exhausted CPU budget and its own bad day over one HTTP
         channel; one of them is a fact about a child's algorithm — December's
         whole month is about making programs fast — and the other says nothing
         about them at all. */
      const r = await run(PROGRAMS.spin);
      expect(r.status).toBe("time_limit_exceeded");
      expect(r.infrastructureError).toBe(false);
      expect(isLearnerEvidence(r.status)).toBe(true);
      expect(r.status).not.toBe("provider_timeout");
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "6. runaway output is capped at our ceiling, not the judge's",
    async () => {
      const r = await run(PROGRAMS.bomb);
      expect(r.status).toBe("ok");
      /* Measured in UTF-16 units, matching what `cap()` actually slices in all
         three providers. The constant is named `maxOutputBytes` and the value
         is compared against `String.length`, which for ASCII is the same number
         — see the note in the report; it is a repo-wide naming divergence, not
         a Judge0 one. */
      expect(r.stdout.length).toBe(EXECUTION_LIMITS.maxOutputBytes);
      expect(r.stderr).toContain("[output truncated]");
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "7. a non-zero exit is a failure, and keeps the output the learner produced",
    async () => {
      const r = await run(PROGRAMS.exit7);
      expect(r.status).not.toBe("ok");
      expect(r.status).toBe("runtime_error");
      expect(r.stdout).toContain("partial");
      /* Their program, their exit code: evidence. */
      expect(isLearnerEvidence(r.status)).toBe(true);
      expect(r.infrastructureError).toBe(false);
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "8. Kazakh output survives the round trip byte for byte",
    async () => {
      /* The test that actually caught something.
         It used to reason that `base64_encoded=false` kept everything plain
         UTF-8 all the way. Run against the real service, this program returned
         **HTTP 400** on the poll — "some attributes for this submission cannot
         be converted to UTF-8, use base64_encoded=true query parameter" — so
         the adapter reported `provider_error` and a learner printing «Сәлем»
         would have been told verification was unavailable for a program that
         ran perfectly. Half this curriculum's prompts are in Kazakh, which
         makes it most outputs rather than an edge case.
         The adapter now speaks base64 in both directions; this asserts the
         round trip survives it. */
      const r = await run(PROGRAMS.kazakh);
      expect(r.status).toBe("ok");
      expect(r.stdout).toBe("Сәлем, әлем!\n");
      expect(r.stdout).not.toContain("?");
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "9. a value past 32 bits arrives exactly",
    async () => {
      /* `3000000000LL * 2`. C++ has no arbitrary precision, so the curriculum
         fact this defends is the one that actually bites: a learner who wrote
         `long long` must get 6000000000 and not a value truncated to `int`.
         Measured identical on both engines: docs/cpp17/CPP17_JUDGE_PARITY.md. */
      const r = await run(PROGRAMS.bigInt);
      expect(r.status).toBe("ok");
      expect(r.stdout.trim()).toBe(BIG_INT_TEXT);
      expect(Number(r.stdout.trim())).toBeGreaterThan(2 ** 32);
    },
    LIVE_TIMEOUT_MS,
  );

  it(
    "10. the compiler is a GCC new enough to default to C++17, and the provider says which",
    async () => {
      const language = await judge().language();
      expect(typeof language.id).toBe("number");
      /* An operator override reports `version: null` on purpose — an id with no
         name behind it means nothing here knows which compiler produced a
         learner's evidence, and saying so is the honest answer. */
      if (!language.operatorOverride) {
        expect(language.name).toMatch(/^C\+\+\s*\(GCC /);
        /* The floor, asserted rather than assumed. `compiler_options` is 403 on
           this plan, so a GCC older than 11 could not be told to use C++17 and
           would compile the course's own syntax as C++14. */
        const major = Number.parseInt((language.version ?? "0").split(".")[0], 10);
        expect(major).toBeGreaterThanOrEqual(MIN_GNU_CXX17_MAJOR);
      }
    },
    LIVE_TIMEOUT_MS,
  );
}

/* =========================================================================
 * Against the fake. This is the half that runs in CI.
 * ====================================================================== */

describe("judge0 conformance — against the protocol-faithful FAKE (no key, no network)", () => {
  let fake: FakeJudge0;
  let provider: Judge0RapidApiProvider;

  beforeAll(async () => {
    fake = await startFakeJudge0();
    provider = new Judge0RapidApiProvider({
      apiKey: "fake-key-never-leaves-a-header",
      host: "judge0-ce.p.rapidapi.com",
      baseUrl: fake.url,
      maxConcurrentRequests: 4,
      /* Small so the suite is quick. The CADENCE is still real — sleep first,
         back off, never read a pending status as an answer. */
      pollIntervalMs: 5,
      queueWaitMs: 5_000,
      overheadBudgetMs: 10_000,
      batchEnabled: false,
    });
  });

  afterAll(async () => {
    await fake.close();
  });

  conformanceMatrix(() => provider);

  it("polled past In Queue and Processing rather than reading the first answer", () => {
    /* The classic Judge0 integration bug: read status 1 as a result and every
       submission comes back with empty stdout, which the checker compares to
       the expected output and calls wrong. An entire class marked incorrect
       because we did not wait.
       The fake answers `In Queue`, then `Processing`, then the real thing — so
       every `ok` above is a result that was waited for. */
    const polls = fake.requests.filter(
      (r) => r.method === "GET" && r.path.startsWith("/submissions/"),
    );
    expect(polls.length).toBeGreaterThanOrEqual(3);
    /* And the first GET is not sent instantly: a poll a millisecond after the
       POST spends a billable request to be told something we already know. */
    expect(fake.requests.filter((r) => r.method === "POST").length).toBeGreaterThan(0);
  });

  it("asked the judge which C++ it has, once, instead of hardcoding an id", () => {
    const asked = fake.requests.filter((r) => r.path === "/languages");
    /* Cached per process per base URL: a dozen submissions, one catalogue. */
    expect(asked).toHaveLength(1);
    const posted = fake.requests.find((r) => r.method === "POST")!;
    /* The catalogue the fake serves is the real one, and four of its five C++
       entries are traps: three GCCs and a Clang that all default to `gnu++14`
       and cannot be told otherwise, because `compiler_options` is refused with
       HTTP 403 on this plan. Landing on any of them would compile the course's
       own syntax as C++14 and mark the learner wrong for what they were
       taught. */
    expect((posted.body as { language_id: number }).language_id).toBe(EXPECTED_CPP_ID);
  });

  it("never sends compiler_options, because the plan answers 403 to it", () => {
    /* The standard has to come from the compiler's default, which is the whole
       reason discovery insists on GCC 11 or newer. A well-meaning edit that
       "just passes -std=c++17" would 403 every submission on this plan and take
       the graded path down with it — silently, since a 403 normalises to an
       infrastructure error and nothing about a learner is recorded. */
    for (const posted of fake.requests.filter((r) => r.method === "POST")) {
      expect(posted.body).not.toHaveProperty("compiler_options");
    }
  });

  it("sent nothing the judge would have quietly reinterpreted", () => {
    /* Every request the fake saw was schema-checked as it arrived: the units
       (seconds and kilobytes, not milliseconds and megabytes), `wait=false`,
       both vendor headers, `enable_network` explicitly false, and — the one
       that is a policy rather than a bug — NO `expected_output`, ever. */
    expect(fake.violations).toEqual([]);
  });

  it("treats a judge that ignores `fields` as broken, not as an answer", async () => {
    /* UNVERIFIED against the real service: whether the hosted deployment
       honours `?fields=status_id,...` and returns a FLAT `status_id` is
       unknown. Judge0's default payload carries only the nested
       `status: {id, description}` object, and the provider reads `status_id`.
       If a deployment ignored the parameter, every poll would be unreadable.
       This pins the direction that failure takes: an infrastructure error, so
       nothing whatsoever is recorded about the learner — never an empty stdout
       compared against an expected output and called wrong. */
    fake.setFields("ignore");
    try {
      const r = await provider.run({ ...REQUEST, sourceCode: PROGRAMS.hello, stdin: "" });
      expect(r.infrastructureError).toBe(true);
      expect(isLearnerEvidence(r.status)).toBe(false);
      expect(r.stdout).toBe("");
    } finally {
      fake.setFields("honour");
    }
  });
});

/* =========================================================================
 * Against the real service. Never in CI, never without a key.
 * ====================================================================== */

describe.skipIf(!LIVE)(
  "judge0 conformance — LIVE against RapidAPI (JUDGE0_LIVE_TEST=1 and a key)",
  () => {
    let provider: Judge0RapidApiProvider;

    beforeAll(async () => {
      /* Built from the deployment's OWN configuration rather than from literals
         here, so what this suite exercises is the thing that would actually
         serve a class — the host, the base URL, the concurrency bound and the
         timing knobs a school would run with. */
      const { judge0FromConfig } = await import("@schools/exec/providers/judge0");
      provider = judge0FromConfig();
    });

    conformanceMatrix(() => provider);
  },
);

/**
 * The honesty guard.
 *
 * A suite that skips silently is worse than one that fails: a green run would
 * read as though the live matrix had passed. So the skip is announced in the
 * title above, and asking for the live run without the means to do it is an
 * error rather than a quiet no-op.
 */
describe("the live matrix, and whether it ran", () => {
  it("did NOT run unless both the flag and a key were present", () => {
    expect(LIVE).toBe(LIVE_FLAG && LIVE_KEY);
    if (!LIVE) {
      /* Read this line in a green CI log as: nothing above touched RapidAPI. */
      expect(LIVE_FLAG && LIVE_KEY).toBe(false);
    }
  });

  it("refuses to pretend: JUDGE0_LIVE_TEST=1 with no key is a failure, not a skip", () => {
    expect(
      LIVE_FLAG && !LIVE_KEY,
      "JUDGE0_LIVE_TEST=1 was set but JUDGE0_RAPIDAPI_KEY is empty — the live " +
        "matrix cannot run and must not be reported as skipped-by-choice",
    ).toBe(false);
  });
});
