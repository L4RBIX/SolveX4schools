import { beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * What `POST /api/learning/submit` accepts as an answer.
 *
 * ## The defect
 *
 * The route did `body.answer as BlockAnswer` — a cast, which is a promise about
 * a JSON body that the compiler has no way to keep — and then dereferenced the
 * fields that cast had merely asserted. Measured against a real signed-in
 * learner on the canonical root, FOUR of the eight variants turned a malformed
 * body into an unhandled `TypeError` and an HTTP 500:
 *
 *     {"kind":"text"}                  500  prediction, test_case
 *     {"kind":"blanks","values":123}   500  fill_blank
 *     {"kind":"order"}                 500  reorder_code
 *     {"kind":"grid","cells":null}     500  trace_code
 *
 * Only the first was reported. The other three were found by sending one
 * malformed answer per block type, which is why these tests are written per
 * variant rather than around the two examples that happened to be noticed.
 *
 * ## Why a 500 here was worse than an error page
 *
 * The same bodies return **404** against a block that does not exist, is
 * unpublished, or is not unlocked for this learner — three states the route
 * deliberately makes indistinguishable so that nobody can map the year or read
 * another child's progress off a status code. The crash was a fifth answer:
 * 500 meant "this block is real, published, and yours". A malformed request
 * must therefore be refused BEFORE anything is looked up, so the 400 stays a
 * function of the request alone.
 *
 * ## And the ledger
 *
 * The promise `payload-limits.test.ts` makes for an oversized answer is the
 * promise made here for a malformed one: a refusal is OURS, not the learner's,
 * and it must leave no trace in a child's record — no submission, no event, not
 * even the `episode_opened` / `episode_closed` pair an ungraded block writes.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "55555555-5555-4555-8555-555555555555";

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
let checking: typeof import("@schools/learning/checking");
let hydration: typeof import("@schools/learning/hydration");
let provider: typeof import("@schools/exec/provider");

/**
 * One block per type, found rather than hardcoded.
 *
 * Which variant crashes depends on the BLOCK, because `checkBlock` dispatches
 * on block type and only then looks at the answer — that is exactly why the
 * defect hid behind a single reported example. Probing `{"kind":"option"}`
 * against a `find_bug` block returns 200 and proves nothing.
 */
const blockOfType: Record<string, string> = {};

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  checking = await import("@schools/learning/checking");
  hydration = await import("@schools/learning/hydration");
  provider = await import("@schools/exec/provider");
  store = await (await import("@schools/store")).getStore();

  const { PROGRAM } = await import("@schools/curriculum/program");
  const month = PROGRAM.months[0];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        blockOfType[block.type] ??= block.id;
      }
    }
  }

  for (const type of [
    "prediction",
    "multiple_choice",
    "fill_blank",
    "reorder_code",
    "find_bug",
    "trace_code",
    "test_case",
    "write_code",
  ]) {
    expect(blockOfType[type], `September should contain a ${type} block`).toBeTruthy();
  }
}, 90_000);

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

/** A body with no `answer` key at all — `JSON.stringify` drops `undefined`. */
async function postRaw(raw: string) {
  const res = await submit.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
    }),
  );
  return { res, body: (await res.json()) as Record<string, unknown> };
}

/* -------------------------------------------------------------------------- */
/* The parser, exhaustively                                                   */
/* -------------------------------------------------------------------------- */

describe("parseBlockAnswer accepts exactly the contract", () => {
  it("accepts every one of the eight variants", () => {
    const valid: unknown[] = [
      { kind: "none" },
      { kind: "acknowledged" },
      { kind: "option", id: "a" },
      { kind: "text", value: "print(1)" },
      { kind: "text", value: "" },
      { kind: "blanks", values: [] },
      { kind: "blanks", values: ["a", "b"] },
      { kind: "order", ids: [] },
      { kind: "order", ids: ["x", "y"] },
      { kind: "line", line: 0 },
      { kind: "line", line: 3 },
      { kind: "grid", cells: {} },
      { kind: "grid", cells: { "0:n": "5" } },
    ];
    for (const v of valid) {
      expect(checking.parseBlockAnswer(v), JSON.stringify(v)).not.toBeNull();
    }
  });

  it("covers every member of the union, so a ninth variant cannot slip past", () => {
    /* `BLOCK_ANSWER_KINDS` is built from a `Record` keyed by the union, so it
       cannot fall behind the type. Every kind it names must parse from a
       minimal well-formed object — if someone adds a variant and forgets the
       parser, this fails. */
    const minimal: Record<string, unknown> = {
      none: { kind: "none" },
      acknowledged: { kind: "acknowledged" },
      option: { kind: "option", id: "" },
      text: { kind: "text", value: "" },
      blanks: { kind: "blanks", values: [] },
      order: { kind: "order", ids: [] },
      line: { kind: "line", line: 1 },
      grid: { kind: "grid", cells: {} },
    };
    for (const kind of checking.BLOCK_ANSWER_KINDS) {
      expect(minimal[kind], `no sample for kind "${kind}" — was a variant added?`).toBeDefined();
      expect(checking.parseBlockAnswer(minimal[kind]), kind).not.toBeNull();
    }
    expect(checking.BLOCK_ANSWER_KINDS.size).toBe(Object.keys(minimal).length);
  });

  it("rejects a missing required field on every variant that has one", () => {
    for (const bare of [
      { kind: "option" },
      { kind: "text" },
      { kind: "blanks" },
      { kind: "order" },
      { kind: "line" },
      { kind: "grid" },
    ]) {
      expect(checking.parseBlockAnswer(bare), JSON.stringify(bare)).toBeNull();
    }
  });

  it("rejects a required field of the wrong runtime type", () => {
    const wrong: unknown[] = [
      { kind: "option", id: 7 },
      { kind: "option", id: null },
      { kind: "text", value: 1 },
      { kind: "text", value: null },
      { kind: "text", value: [] },
      { kind: "text", value: { toString: "no" } },
      { kind: "blanks", values: 123 },
      { kind: "blanks", values: "ab" },
      { kind: "blanks", values: ["a", 2] },
      { kind: "blanks", values: [null] },
      { kind: "order", ids: 123 },
      { kind: "order", ids: ["a", {}] },
      { kind: "line", line: "3" },
      { kind: "line", line: null },
      { kind: "grid", cells: null },
      { kind: "grid", cells: [] },
      { kind: "grid", cells: { "0:n": 5 } },
      { kind: "grid", cells: { "0:n": null } },
    ];
    for (const v of wrong) {
      expect(checking.parseBlockAnswer(v), JSON.stringify(v)).toBeNull();
    }
  });

  it("rejects anything that is not an answer-shaped object at all", () => {
    for (const v of [null, undefined, [], "hello", 42, true, {}, { kind: "wat" }, { kind: 1 }]) {
      expect(checking.parseBlockAnswer(v), String(v)).toBeNull();
    }
  });

  it('rejects {"kind":"code"}, which sounds plausible and is not in the union', () => {
    /* Code answers travel as `text`. A client sending this is one the server
       has never had, and grading it as an empty answer would record a verdict
       about a learner whose work never arrived. */
    expect(checking.parseBlockAnswer({ kind: "code", code: "print(1)" })).toBeNull();
  });

  it("copies the value out rather than passing the caller's object onward", () => {
    /* Nothing undeclared travels into `learning_submissions.answer`. Extra
       properties were never read; they are not stored either. */
    const raw = { kind: "text", value: "x", smuggled: "should not survive" };
    const parsed = checking.parseBlockAnswer(raw);
    expect(parsed).toEqual({ kind: "text", value: "x" });
    expect(parsed).not.toBe(raw);
    expect(Object.keys(parsed!)).toEqual(["kind", "value"]);

    /* And the arrays are copied, so a caller mutating theirs afterwards cannot
       change what was validated. */
    const ids = ["a", "b"];
    const order = checking.parseBlockAnswer({ kind: "order", ids }) as { ids: string[] };
    ids.push("c");
    expect(order.ids).toEqual(["a", "b"]);
  });

  it("agrees with readArtifact, which has validated this union on the way out all along", () => {
    /* `SubmittedArtifact = BlockAnswer`, and `readArtifact` in
       `schools/learning/hydration.ts` has checked exactly these shapes coming
       OUT of the jsonb column since it was added — for exactly the reason its
       comment gives: "A cast would instead hand the UI a shape it will
       destructure and crash on." That argument was right and was never applied
       to the way IN. The two must not now drift apart. */
    const carrying: unknown[] = [
      { kind: "option", id: "a" },
      { kind: "text", value: "print(1)" },
      { kind: "blanks", values: ["a"] },
      { kind: "order", ids: ["a"] },
      { kind: "line", line: 2 },
      { kind: "grid", cells: { "0:n": "5" } },
    ];
    for (const v of carrying) {
      expect(checking.parseBlockAnswer(v), `parse ${JSON.stringify(v)}`).not.toBeNull();
      expect(hydration.readArtifact(v), `read ${JSON.stringify(v)}`).not.toBeUndefined();
      expect(checking.parseBlockAnswer(v)).toEqual(hydration.readArtifact(v));
    }

    const malformed: unknown[] = [
      { kind: "option", id: 7 },
      { kind: "text", value: 1 },
      { kind: "blanks", values: 123 },
      { kind: "order", ids: ["a", 2] },
      { kind: "line", line: "3" },
      { kind: "grid", cells: null },
      { kind: "grid", cells: { "0:n": 5 } },
      { kind: "wat" },
    ];
    for (const v of malformed) {
      expect(checking.parseBlockAnswer(v), `parse ${JSON.stringify(v)}`).toBeNull();
      expect(hydration.readArtifact(v), `read ${JSON.stringify(v)}`).toBeUndefined();
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The route — one malformed answer per block type                            */
/* -------------------------------------------------------------------------- */

describe("POST /api/learning/submit refuses a malformed answer with 400, never 500", () => {
  /** The four that actually crashed, each against the block type that crashed. */
  const crashed: [string, string, unknown][] = [
    ["text on a prediction", "prediction", { kind: "text" }],
    ["text on a test_case", "test_case", { kind: "text", value: [] }],
    ["blanks on a fill_blank", "fill_blank", { kind: "blanks", values: 123 }],
    ["blanks with no values", "fill_blank", { kind: "blanks" }],
    ["order on a reorder_code", "reorder_code", { kind: "order", ids: 123 }],
    ["order with no ids", "reorder_code", { kind: "order" }],
    ["grid on a trace_code", "trace_code", { kind: "grid", cells: null }],
    ["grid with no cells", "trace_code", { kind: "grid" }],
  ];

  it.each(crashed)("%s -> 400", async (_name, type, answer) => {
    const { res, body } = await postSubmit({
      blockId: blockOfType[type],
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer,
    });
    expect(res.status, `${type} still 500s`).toBe(400);
    expect(body.error).toBe("invalid answer");
    expect(body.verdict).toBeUndefined();
  }, 30_000);

  /** The ones that used to be accepted as garbage rather than crash. */
  const wasSilentlyAccepted: [string, string, unknown][] = [
    ["a numeric option id", "multiple_choice", { kind: "option", id: 7 }],
    ["an option with no id", "multiple_choice", { kind: "option" }],
    ["a string line number", "find_bug", { kind: "line", line: "x" }],
    ["an unknown kind", "prediction", { kind: "wat" }],
    ["a kind this server never had", "prediction", { kind: "code", code: "print(1)" }],
  ];

  it.each(wasSilentlyAccepted)("%s -> 400", async (_name, type, answer) => {
    const { res, body } = await postSubmit({
      blockId: blockOfType[type],
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer,
    });
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid answer");
  }, 30_000);

  it("refuses a body whose answer is not an object", async () => {
    for (const raw of ["null", "[]", '"hello"', "42", "true", "{}"]) {
      const { res } = await postRaw(`{"blockId":"${blockOfType.prediction}","answer":${raw}}`);
      expect(res.status, `answer: ${raw}`).toBe(400);
    }
  }, 30_000);

  it("refuses a body with no answer key at all", async () => {
    /* It used to default to `NO_ANSWER` and grade the block. No client omits
       the field — all three call sites type it as required — so the default
       only ever covered a caller that was already broken, and covering it meant
       recording a verdict about a learner whose answer never arrived. */
    const { res, body } = await postRaw(`{"blockId":"${blockOfType.prediction}"}`);
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid answer");
  }, 30_000);

  it("survives a huge blockId, and does not put it all in the ops log", async () => {
    /* The guard runs BEFORE `findBlock`, so `blockId` here is still whatever
       the caller sent — bounded only by the 256 KiB envelope, not by the
       curriculum. Every other `opsLog` in the route runs after the lookup and
       therefore logs a real id; this one would have logged the lot. */
    const { res, body } = await postSubmit({
      blockId: "x".repeat(100_000),
      answer: { kind: "text" },
    });
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid answer");
  }, 30_000);

  it("still refuses malformed JSON separately, and says so", async () => {
    const { res, body } = await postRaw("{not json");
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid json");
  }, 30_000);

  it("leaks nothing: no stack, no path, no schema, no block existence", async () => {
    const { res, body } = await postSubmit({
      blockId: blockOfType.prediction,
      answer: { kind: "text", value: 1 },
    });
    expect(res.status).toBe(400);
    expect(Object.keys(body)).toEqual(["error"]);

    const serialised = JSON.stringify(body);
    for (const leak of [
      "TypeError",
      "Buffer",
      "byteLength",
      "schools/",
      "src/app",
      ".ts",
      "at ",
      "kind",
      "value",
      "undefined",
      blockOfType.prediction,
    ]) {
      expect(serialised, `the 400 body mentions ${leak}`).not.toContain(leak);
    }
  }, 30_000);
});

/* -------------------------------------------------------------------------- */
/* The refusal is free                                                        */
/* -------------------------------------------------------------------------- */

describe("a refused answer leaves no trace on the learner", () => {
  it("writes no event of any kind", async () => {
    const episodeId = randomUUID();
    const { res } = await postSubmit({
      blockId: blockOfType.fill_blank,
      episodeId,
      submissionId: randomUUID(),
      answer: { kind: "blanks", values: 123 },
    });
    expect(res.status).toBe(400);
    expect(
      await store.eventsForEpisode(episodeId),
      "a malformed request left evidence in a child's ledger",
    ).toHaveLength(0);
  }, 30_000);

  it("burns no submission id, so a fixed client can submit again", async () => {
    const submissionId = randomUUID();
    const episodeId = randomUUID();

    const refused = await postSubmit({
      blockId: blockOfType.prediction,
      episodeId,
      submissionId,
      answer: { kind: "text" },
    });
    expect(refused.res.status).toBe(400);

    const { config } = await import("@schools/config");
    const subjectId = await store.resolveSubject(ANON, "public", config.pilot);
    expect(
      await store.submissionRecord(subjectId, submissionId),
      "a refused request claimed a submission id it never used",
    ).toBeNull();

    const retried = await postSubmit({
      blockId: blockOfType.prediction,
      episodeId,
      submissionId,
      answer: { kind: "text", value: "24" },
    });
    expect(retried.res.status).toBe(200);
    expect(retried.body.verdict).toBeDefined();
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Non-enumeration                                                            */
/* -------------------------------------------------------------------------- */

describe("the 400 says nothing about the block", () => {
  it("answers identically for a real block and one that does not exist", async () => {
    /* The crash used to distinguish them: 500 for a block that was reachable,
       404 for one that was not. That answered the question the route's three
       identical 404s exist to refuse. */
    const malformed = { kind: "text" };

    const real = await postSubmit({ blockId: blockOfType.prediction, answer: malformed });
    const fake = await postSubmit({ blockId: "no.such.block.anywhere", answer: malformed });

    expect(real.res.status).toBe(400);
    expect(fake.res.status).toBe(400);
    expect(real.body).toEqual(fake.body);
  }, 30_000);

  it("still answers 404 for an unknown block when the answer is well-formed", async () => {
    /* The non-enumeration behaviour itself is untouched: validation only moved
       the malformed case out from behind it. */
    const { res, body } = await postSubmit({
      blockId: "no.such.block.anywhere",
      answer: { kind: "text", value: "x" },
    });
    expect(res.status).toBe(404);
    expect(body.error).toBe("unknown block");
  }, 30_000);
});

/* -------------------------------------------------------------------------- */
/* Everything a working learner does is unchanged                             */
/* -------------------------------------------------------------------------- */

describe("valid answers behave exactly as before", () => {
  const valid: [string, string, unknown][] = [
    ["a prediction", "prediction", { kind: "text", value: "24" }],
    ["a multiple choice", "multiple_choice", { kind: "option", id: "a" }],
    ["a fill-in-the-blank", "fill_blank", { kind: "blanks", values: ["x", "y"] }],
    ["a reorder", "reorder_code", { kind: "order", ids: ["a", "b"] }],
    ["a find-the-bug", "find_bug", { kind: "line", line: 2 }],
    ["a trace", "trace_code", { kind: "grid", cells: { "0:n": "5" } }],
    ["a self-authored test", "test_case", { kind: "text", value: "0" }],
  ];

  it.each(valid)("%s settles and writes to the ledger", async (_name, type, answer) => {
    const episodeId = randomUUID();
    const { res, body } = await postSubmit({
      blockId: blockOfType[type],
      episodeId,
      submissionId: randomUUID(),
      answer,
    });
    expect(res.status).toBe(200);
    expect(body.verdict).toBeDefined();
    expect((await store.eventsForEpisode(episodeId)).length).toBeGreaterThan(0);
  }, 60_000);

  it("an explicit empty answer is still an answer, not a malformed request", async () => {
    /* The player's own initial state is `NO_ANSWER`. It must stay acceptable —
       only the ABSENT field became a refusal. */
    for (const answer of [{ kind: "none" }, { kind: "acknowledged" }]) {
      const { res } = await postSubmit({
        blockId: blockOfType.prediction,
        episodeId: randomUUID(),
        submissionId: randomUUID(),
        answer,
      });
      expect(res.status, JSON.stringify(answer)).toBe(200);
    }
  }, 60_000);

  it("a submitted answer still round-trips out of the jsonb column unchanged", async () => {
    /* J: the artifact a learner gets back when they reopen a lesson. It goes in
       through `parseBlockAnswer` and comes out through `readArtifact`, so this
       exercises both ends of the same column against a real store. The parser
       must have changed what is REFUSED and nothing about what is stored. */
    const value = "n = int(input())\nprint(n * n)";
    const { res } = await postSubmit({
      blockId: blockOfType.write_code,
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer: { kind: "text", value },
    });
    expect(res.status).toBe(200);

    const { config } = await import("@schools/config");
    const subjectId = await store.resolveSubject(ANON, "public", config.pilot);

    /* `settledBlocks` is the query the lesson page's rehydration actually runs
       (see `schools/learning/rehydrate.ts`), and the only read path that
       returns the `answer` column. */
    const settled = await store.settledBlocks(subjectId, [blockOfType.write_code]);
    const row = settled.get(blockOfType.write_code);
    expect(row, "the settled submission did not reach the store").toBeDefined();

    const restored = hydration.readArtifact(row!.answer);
    expect(restored, "the stored answer no longer reads back").toEqual({ kind: "text", value });
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* The size ceiling still owns size                                           */
/* -------------------------------------------------------------------------- */

describe("validation did not take over the payload-size policy", () => {
  it("accepts a large but legal answer, and still 413s one byte over", async () => {
    const limit = provider.EXECUTION_LIMITS.maxSourceBytes;

    const justUnder = await postSubmit({
      blockId: blockOfType.write_code,
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer: { kind: "text", value: "#".repeat(limit) },
    });
    expect(justUnder.res.status, "a legal answer was refused").toBe(200);

    const justOver = await postSubmit({
      blockId: blockOfType.write_code,
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer: { kind: "text", value: "#".repeat(limit + 1) },
    });
    /* Still a 413 that names the ceiling, NOT a 400 — the size policy is a
       different refusal with a different meaning, and the learner can act on
       it. Validation only guarantees the thing being measured is a string. */
    expect(justOver.res.status).toBe(413);
    expect(justOver.body.reason).toBe("source_too_large");
    expect(justOver.body.limitBytes).toBe(limit);
  }, 120_000);

  it("does not stringify a non-string to make the size check work", async () => {
    /* `value: 123` must not become `"123"`. It is not an answer. */
    const { res, body } = await postSubmit({
      blockId: blockOfType.write_code,
      episodeId: randomUUID(),
      submissionId: randomUUID(),
      answer: { kind: "text", value: 123 },
    });
    expect(res.status).toBe(400);
    expect(body.verdict).toBeUndefined();
  }, 30_000);
});
