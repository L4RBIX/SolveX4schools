import { beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * How big a thing this service will look at.
 *
 * ## What was missing
 *
 * `EXECUTION_LIMITS` carried `maxSourceBytes` and `maxOutputBytes` and exactly
 * one of them was enforced anywhere: the local provider truncates stdout. The
 * source limit was checked in one route, against `source.length` — UTF-16 code
 * units — while being named in BYTES, so a program commented in Kazakh was
 * measured at roughly half the size it would occupy on the wire. `stdin` had no
 * limit at all: whatever the request body held went into a subprocess's pipe.
 *
 * ## The promise these tests hold
 *
 * The one that matters is not "large requests are refused". It is that a
 * refusal LEAVES NO TRACE ON THE LEARNER. A fourteen-year-old who pasted a
 * megabyte has not written a wrong program; they have sent something we decline
 * to run, and the decline is ours. So an oversized submission must produce no
 * verdict, no `verdict_received`, no `failure_attributed` — and not even the
 * `episode_opened` / `episode_closed` pair an ungraded block writes, because
 * the ledger is a record of what a child did and this is a record of what we
 * refused.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "44444444-4444-4444-8444-444444444444";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;

let store: Store;
let submit: typeof import("../../src/app/api/learning/submit/route");
let run: typeof import("../../src/app/api/exec/run/route");
let limits: typeof import("@schools/exec/limits");
let provider: typeof import("@schools/exec/provider");

/** A code task with declared cases, found rather than hardcoded. */
let codeBlockId: string;

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  run = await import("../../src/app/api/exec/run/route");
  limits = await import("@schools/exec/limits");
  provider = await import("@schools/exec/provider");
  store = await (await import("@schools/store")).getStore();

  const { PROGRAM } = await import("@schools/curriculum/program");
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (!codeBlockId && block.type === "write_code" && (block.cases?.length ?? 0) > 0) {
            codeBlockId = block.id;
          }
        }
      }
    }
  }
  expect(codeBlockId, "the curriculum should contain a graded code task").toBeTruthy();
}, 90_000);

/* -------------------------------------------------------------------------- */
/* The limits themselves                                                      */
/* -------------------------------------------------------------------------- */

describe("the numbers, and that they are generous for a beginner", () => {
  it("64 KiB of source is about two orders of magnitude above anything Grade 9 writes", () => {
    expect(provider.EXECUTION_LIMITS.maxSourceBytes).toBe(64 * 1024);

    /* The longest reference solution in the approved programme is well under
       twenty lines. A whole worked file pasted from a lesson is a few hundred
       bytes. A learner cannot reach this ceiling by working. */
    const generousBeginnerProgram = Array.from(
      { length: 200 },
      (_, i) => `x${i} = int(input())  # оқушының түсініктемесі`,
    ).join("\n");
    expect(limits.checkPayloadSize({ sourceCode: generousBeginnerProgram })).toBeNull();
  });

  it("16 KiB of stdin is two thousand times the largest input the curriculum declares", () => {
    expect(provider.EXECUTION_LIMITS.maxStdinBytes).toBe(16 * 1024);

    /* The biggest declared case input in the programme is eight characters
       («1000 100»). A learner on manual Run pasting a few hundred lines to
       exercise a read-until-EOF loop is the only legitimate large case, and it
       fits comfortably. */
    const pastedByALearner = Array.from({ length: 500 }, (_, i) => String(i)).join("\n");
    expect(limits.checkPayloadSize({ sourceCode: "print(1)", stdin: pastedByALearner })).toBeNull();
  });

  it("measures UTF-8 BYTES, not string length", () => {
    /* The defect in the check this replaced. `"ә".length` is 1 and its UTF-8
       length is 2, so a source of Kazakh text was measured at half its real
       size against a limit named in bytes. */
    const kazakh = "ә".repeat(provider.EXECUTION_LIMITS.maxSourceBytes - 10);
    expect(kazakh.length).toBeLessThan(provider.EXECUTION_LIMITS.maxSourceBytes);
    expect(limits.byteLength(kazakh)).toBeGreaterThan(provider.EXECUTION_LIMITS.maxSourceBytes);

    const rejection = limits.checkPayloadSize({ sourceCode: kazakh });
    expect(rejection, "a Kazakh source passed a check that thought it counted bytes").not.toBeNull();
    expect(rejection!.reason).toBe("source_too_large");
  });

  it("names which limit and by how much, so a 413 is actionable", () => {
    const r = limits.checkPayloadSize({
      sourceCode: "print(1)",
      stdin: "x".repeat(provider.EXECUTION_LIMITS.maxStdinBytes + 1),
    });
    expect(r).toEqual({
      reason: "stdin_too_large",
      limitBytes: provider.EXECUTION_LIMITS.maxStdinBytes,
      actualBytes: provider.EXECUTION_LIMITS.maxStdinBytes + 1,
    });
  });

  it("a refusal is not a verdict, and not an outage either", () => {
    /* Where this sits in the verdict model, asserted rather than described.
       `payload_too_large` is its own status: not `runtime_error`, which would
       record the learner's program as crashing, and not `provider_error`, which
       would put a learner's paste on the same pager as a dead sandbox. */
    expect(provider.isLearnerEvidence("payload_too_large")).toBe(false);
    expect(provider.isLearnerEvidence("runtime_error")).toBe(true);
    /* The two failures that ARE the learner's stay evidence. December's whole
       month is about making a program fast enough. */
    expect(provider.isLearnerEvidence("time_limit_exceeded")).toBe(true);
    expect(provider.isLearnerEvidence("memory_limit_exceeded")).toBe(true);

    // Nothing is down, so nothing should page.
    expect(provider.isInfrastructure("payload_too_large")).toBe(false);
    expect(provider.isPayloadRejection("payload_too_large")).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* The provider decorator — the backstop                                      */
/* -------------------------------------------------------------------------- */

describe("the guard around the provider", () => {
  const spy = {
    calls: 0,
    /* Free, so the size guard is the only thing being tested here — a metered
       fake would drag the Run route's refusal into a suite about payload
       ceilings. See `CodeExecutionProvider.metered`. */
    metered: false,
    id: "spy",
    describe: "a judge that records whether it was called",
    async run() {
      spy.calls += 1;
      return {
        status: "ok" as const,
        stdout: "",
        stderr: "",
        exitCode: 0,
        timeMs: 1,
        memoryKb: null,
        infrastructureError: false,
        providerId: "spy",
      };
    },
  };

  it("never forwards an oversized request to the judge", async () => {
    spy.calls = 0;
    const guarded = limits.sizeGuarded(spy);

    const result = await guarded.run({
      language: "cpp17",
      sourceCode: "x".repeat(provider.EXECUTION_LIMITS.maxSourceBytes + 1),
      stdin: "",
      timeLimitMs: 1000,
      memoryLimitMb: 64,
    });

    expect(spy.calls, "the judge was handed a payload the route should have refused").toBe(0);
    expect(result.status).toBe("payload_too_large");
  });

  it("marks the result as not-evidence, so runCases cannot score it as wrong", async () => {
    /* This is the whole reason the synthetic result carries
       `infrastructureError: true`. `runCases` reads that flag to decide it
       measured nothing; with `false` it would compare an empty stdout against
       the expected output and record the learner as WRONG for a program nobody
       ran. */
    const guarded = limits.sizeGuarded(spy);
    const result = await guarded.run({
      language: "cpp17",
      sourceCode: "print(1)",
      stdin: "x".repeat(provider.EXECUTION_LIMITS.maxStdinBytes + 1),
      timeLimitMs: 1000,
      memoryLimitMb: 64,
    });

    expect(result.infrastructureError).toBe(true);
    expect(result.stdout).toBe("");
  });

  it("lets a legitimate program straight through", async () => {
    spy.calls = 0;
    const guarded = limits.sizeGuarded(spy);
    await guarded.run({
      language: "cpp17",
      sourceCode: "n = int(input())\nprint(n * n)",
      stdin: "5\n",
      timeLimitMs: 1000,
      memoryLimitMb: 64,
    });
    expect(spy.calls).toBe(1);
  });

  it("carries no fragment of what was sent in its stderr", async () => {
    /* An error string is a place learner text leaks into a log. */
    const secret = "SECRET_LEARNER_TEXT";
    const guarded = limits.sizeGuarded(spy);
    const result = await guarded.run({
      language: "cpp17",
      sourceCode: secret + "x".repeat(provider.EXECUTION_LIMITS.maxSourceBytes),
      stdin: "",
      timeLimitMs: 1000,
      memoryLimitMb: 64,
    });
    expect(result.stderr).not.toContain(secret);
  });
});

/* -------------------------------------------------------------------------- */
/* The API boundary                                                           */
/* -------------------------------------------------------------------------- */

describe("POST /api/exec/run refuses oversized work", () => {
  async function postRun(body: Record<string, unknown>) {
    const res = await run.POST(
      new Request("http://localhost/api/exec/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    return { res, body: (await res.json()) as Record<string, unknown> };
  }

  it("413s an oversized source and names the limit", async () => {
    const { res, body } = await postRun({
      sourceCode: "x".repeat(provider.EXECUTION_LIMITS.maxSourceBytes + 1),
    });
    expect(res.status).toBe(413);
    expect(body.reason).toBe("source_too_large");
    expect(body.limitBytes).toBe(provider.EXECUTION_LIMITS.maxSourceBytes);
  }, 30_000);

  it("413s oversized stdin, which was previously unbounded", async () => {
    const { res, body } = await postRun({
      sourceCode: "print(input())",
      stdin: "x".repeat(provider.EXECUTION_LIMITS.maxStdinBytes + 1),
    });
    expect(res.status).toBe(413);
    expect(body.reason).toBe("stdin_too_large");
  }, 30_000);

  it("refuses a declared-oversized body before it is even parsed", async () => {
    /* `request.json()` buffers whatever arrives, so a hundred-megabyte POST is
       a hundred megabytes of heap in a process serving a class — spent before
       any field-level limit gets a look. Reading `content-length` costs
       nothing. */
    const res = await run.POST(
      new Request("http://localhost/api/exec/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(limits.MAX_REQUEST_BYTES + 1),
        },
        body: JSON.stringify({ sourceCode: "print(1)" }),
      }),
    );
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: string }).error).toBe("request too large");
  }, 30_000);

  it("still runs the same program twice — RUN is not idempotent", async () => {
    /* The other half of this branch made SUBMIT refuse to grade the same
       submission twice. Nothing of the sort belongs here: running the same
       program again is the entire point of a Run button, and this route writes
       no evidence for a second run to corrupt. */
    const source = '#include <iostream>\nint main() { std::cout << 6 * 7 << "\\n"; }\n';
    const first = await postRun({ sourceCode: source, stdin: "" });
    const second = await postRun({ sourceCode: source, stdin: "" });

    expect(first.res.status).toBe(200);
    expect(second.res.status).toBe(200);
    expect(second.body.stdout).toBe(first.body.stdout);
    // Both ran. Neither was replayed from a store, because there is no store.
    expect(String(first.body.stdout)).toContain("42");
    expect(String(second.body.stdout)).toContain("42");
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* The one that matters: no learner evidence                                  */
/* -------------------------------------------------------------------------- */

describe("POST /api/learning/submit refuses an oversized answer and records NOTHING", () => {
  async function postSubmit(body: Record<string, unknown>) {
    const res = await submit.POST(
      new Request("http://localhost/api/learning/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    return { res, body: (await res.json()) as Record<string, unknown> };
  }

  it("writes no event of any kind — not even an unmeasured one", async () => {
    const episodeId = randomUUID();

    const { res, body } = await postSubmit({
      blockId: codeBlockId,
      episodeId,
      submissionId: randomUUID(),
      answer: {
        kind: "text",
        value: `# ${"пайдаланушының коды ".repeat(4000)}\nprint(1)`,
      },
    });

    expect(res.status).toBe(413);
    expect(body.reason).toBe("source_too_large");

    /* No verdict. The learner was not marked wrong, and was not marked
       `unknown` either — nothing was recorded to be unknown ABOUT. */
    expect(body.verdict).toBeUndefined();

    const events = await store.eventsForEpisode(episodeId);
    expect(
      events,
      "an oversized paste left evidence in a child's ledger",
    ).toHaveLength(0);
  }, 60_000);

  it("burns no submission id, so the learner can fix it and submit again", async () => {
    /* The refusal happens above the claim, so the id is untouched. A learner
       who trims their file and presses Check gets a real grading rather than a
       replay of a refusal. */
    const submissionId = randomUUID();
    const episodeId = randomUUID();

    const rejected = await postSubmit({
      blockId: codeBlockId,
      episodeId,
      submissionId,
      answer: { kind: "text", value: "x".repeat(provider.EXECUTION_LIMITS.maxSourceBytes + 1) },
    });
    expect(rejected.res.status).toBe(413);

    const { config } = await import("@schools/config");
    const subjectId = await store.resolveSubject(ANON, "public", config.pilot);
    expect(
      await store.submissionRecord(subjectId, submissionId),
      "a refused request claimed a submission id it never used",
    ).toBeNull();

    const retried = await postSubmit({
      blockId: codeBlockId,
      episodeId,
      submissionId,
      answer: { kind: "text", value: "n = int(input())\nprint(n * n)" },
    });
    expect(retried.res.status).toBe(200);
    expect(retried.body.verdict).toBeDefined();
  }, 60_000);

  it("refuses a declared-oversized body before it is parsed", async () => {
    const episodeId = randomUUID();
    const res = await submit.POST(
      new Request("http://localhost/api/learning/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(limits.MAX_REQUEST_BYTES + 1),
        },
        body: JSON.stringify({ blockId: codeBlockId, episodeId, answer: { kind: "none" } }),
      }),
    );

    expect(res.status).toBe(413);
    expect(await store.eventsForEpisode(episodeId)).toHaveLength(0);
  }, 30_000);

  it("leaves a normal answer completely unaffected", async () => {
    /* The check must be invisible to everybody who is working. */
    const episodeId = randomUUID();
    const { res, body } = await postSubmit({
      blockId: codeBlockId,
      episodeId,
      submissionId: randomUUID(),
      answer: { kind: "text", value: "n = int(input())\nprint(n * n)" },
    });

    expect(res.status).toBe(200);
    expect(body.verdict).toBeDefined();
    expect((await store.eventsForEpisode(episodeId)).length).toBeGreaterThan(0);
  }, 60_000);
});
