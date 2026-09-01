import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * What the product does when a dependency is down.
 *
 * Three failures, and each one has a specific promise attached to it that is
 * easy to break by accident and impossible to notice afterwards:
 *
 * 1. **The judge is unavailable.** The lesson stays usable, code tasks say so
 *    in Kazakh and Russian, and the learner is NEVER marked wrong. A judge
 *    outage recorded as a wrong answer teaches the model something false about
 *    a child and the child never finds out why.
 * 2. **Nova is unavailable.** The lesson still works and the panel shows a
 *    retry rather than spinning forever or inventing an answer. And the ledger
 *    does not charge independence for help that never arrived.
 * 3. **The database write fails.** The product does NOT pretend progress was
 *    saved. The block refuses to settle, the completion is queued and re-sent,
 *    and the failure is counted where an operator can see it.
 *
 * ## Why these drive the real route handlers
 *
 * Every assertion below goes through `POST` on the actual App Router module,
 * against the real PGlite store with the real migrations. Testing the pieces
 * separately would prove that `runCases` reports `infrastructureFailed` and
 * that `checkCodeResult` is pure — both already covered — and would prove
 * nothing about whether the route wires them into a verdict a learner sees.
 * The defect class this file exists for lives in exactly that wiring.
 */

/* The store resolves its data directory from `config`, which reads `process.env`
   once at import. Set before any dynamic import below, so the whole file runs
   against an in-memory Postgres and never touches the developer's own `.data`. */
process.env.LEARNING_DATA_DIR = "memory://";

/* The pilot's real judge, so the failure is injected at the same seam a real
   outage arrives through: `getExecutionProvider` resolves `piston`, imports the
   provider module, and wraps whatever it gets in the counting decorator. Mocking
   `getExecutionProvider` itself would have skipped that decorator and quietly
   stopped testing whether an outage is counted at all. The URL is deliberately
   unreachable; nothing ever calls it, because the module is mocked below. */
process.env.EXEC_PROVIDER = "piston";
process.env.PISTON_URL = "http://127.0.0.1:65535";

/** The anonymous learner cookie, and deliberately nothing else. */
const ANON = "11111111-1111-4111-8111-111111111111";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    /* Only `sx_anon` resolves. A session cookie must NOT be faked here: these
       routes are exercised on the anonymous development path, which is the one
       `checkLearningAccess` permits outside production, and inventing a session
       would test a code path with no session store behind it. */
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

/* `after()` needs a request scope Next only creates inside a real server. The
   callback it receives is the opportunistic reducer sweep, which is not what
   any of these tests is about. */
vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

/* ── The two provider failures, injected as deep as they can go ──────────────

   Both are broken at the PROVIDER module, never at the factory that returns it.
   That is the whole reason these tests are worth anything: `getExecutionProvider`
   and `getNovaProvider` are where the counting decorators live, and
   `runCases` — the function deciding that an infrastructure failure aborts the
   run rather than reporting "you passed 1 of 5" — sits above them. Mocking
   either factory would have replaced all of that with the test's own opinion,
   and the suite would have gone green while measuring nothing. */

let novaDown = false;

vi.mock("@schools/exec/providers/piston", () => ({
  pistonFromConfig: () => ({
    id: "piston",
    describe: "a judge that is not answering",
    run: async () => ({
      status: "provider_timeout" as const,
      stdout: "",
      stderr: "the judge did not answer in time",
      exitCode: null,
      timeMs: 5,
      memoryKb: null,
      // The field the entire promise rests on: this says nothing whatsoever
      // about the learner's program.
      infrastructureError: true,
      providerId: "piston",
    }),
  }),
}));

vi.mock("@schools/nova/providers/echo", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  const RealEcho = real.EchoProvider as new () => object;
  const { NovaProviderError } = await import("@schools/nova/provider");

  /* A provider that throws on the FIRST read of the stream, which is what an
     upstream 503 looks like from inside `getNovaProvider`. Written as a class
     whose constructor returns a different object so the switch can be flipped
     per test without re-importing the route. */
  class BrokenEcho {
    readonly id = "echo";
    readonly model = "echo-local";
    readonly degraded = true;
    async *stream(): AsyncIterable<string> {
      throw new NovaProviderError("provider returned 503", "upstream", true);
      // Unreachable, and present so the generator is typed as one rather than
      // as a function that only ever throws.
      yield "";
    }
  }

  return {
    ...real,
    EchoProvider: function EchoProviderStub(this: unknown) {
      return novaDown ? new BrokenEcho() : new RealEcho();
    } as unknown as new () => object,
  };
});

/* -------------------------------------------------------------------------- */

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;

let store: Store;
let submit: typeof import("../../src/app/api/learning/submit/route");
let hint: typeof import("../../src/app/api/nova/hint/route");
let complete: typeof import("../../src/app/api/learning/complete/route");
let counters: typeof import("@schools/ops/counters");
let labels: typeof import("@schools/presentation/labels");

/** A `write_code` block that actually declares cases, found rather than hardcoded. */
let codeBlockId: string;
/** Any attempt block with options, for the "not a code task" half of test 3. */
let optionBlockId: string;

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  hint = await import("../../src/app/api/nova/hint/route");
  complete = await import("../../src/app/api/learning/complete/route");
  counters = await import("@schools/ops/counters");
  labels = await import("@schools/presentation/labels");
  store = await (await import("@schools/store")).getStore();

  const { PROGRAM } = await import("@schools/curriculum/program");
  /* Derived from the curriculum rather than pinned to an id. September is
     frozen, but a test that hardcodes `m1.l8.b1` starts failing for the wrong
     reason the moment October is authored ahead of it. */
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (!codeBlockId && block.type === "write_code" && (block.cases?.length ?? 0) > 0) {
            codeBlockId = block.id;
          }
          if (!optionBlockId && block.type === "multiple_choice") optionBlockId = block.id;
        }
      }
    }
  }
  expect(codeBlockId, "the curriculum should contain a graded code task").toBeTruthy();
  expect(optionBlockId, "the curriculum should contain a multiple choice block").toBeTruthy();
}, 90_000);

afterAll(() => {
  novaDown = false;
});

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

/* ========================================================================== */
/* 1. THE JUDGE IS UNAVAILABLE                                                */
/* ========================================================================== */

describe("the judge is unavailable", () => {
  it("settles the code task as unmeasured and NEVER as wrong", async () => {
    const episodeId = randomUUID();

    const { res, body } = await postSubmit({
      blockId: codeBlockId,
      episodeId,
      // A submission that would fail on its merits if anything had run it. The
      // point is that nothing did, so its content must not matter.
      answer: { kind: "text", value: "print('definitely not the answer')" },
    });

    expect(res.status).toBe(200);
    expect(body.verdict).toBe("unknown");
    expect(body.verdict).not.toBe("wrong");
    // No case counts, because no case was run. Reporting "0 of 7 passed" would
    // be a measurement of a run that never happened.
    expect(body.cases).toBeNull();
  }, 60_000);

  it("tells the learner the checker is DOWN, not that it was never built", async () => {
    const { body } = await postSubmit({
      blockId: codeBlockId,
      episodeId: randomUUID(),
      answer: { kind: "text", value: "print(1)" },
    });

    expect(body.unmeasuredReason).toBe("judge_unavailable");

    /* The two sentences must exist in both languages and must not be the same
       sentence. «Әлі қосылмаған» — not connected YET — is true of an unbuilt
       product and false of a service that is down for twenty minutes, and a
       class reads the difference. */
    const down = labels.L.executionUnavailable;
    const unbuilt = labels.L.sandboxPending;
    for (const locale of ["kk", "ru"] as const) {
      expect(down[locale].length).toBeGreaterThan(20);
      expect(unbuilt[locale].length).toBeGreaterThan(20);
      expect(down[locale]).not.toBe(unbuilt[locale]);
    }
    // The promise the string has to carry: nobody is marked wrong.
    expect(down.ru).toMatch(/ошибка тебе не поставлена/i);
    expect(down.kk).toMatch(/қате қойылған жоқ/i);
  }, 60_000);

  it("writes no verdict and no failure attribution for the attempt", async () => {
    const episodeId = randomUUID();
    await postSubmit({
      blockId: codeBlockId,
      episodeId,
      answer: { kind: "text", value: "print(1)" },
    });

    const events = await store.eventsForEpisode(episodeId);
    const names = events.map((e) => e.event_name);

    /* The episode is opened and closed — the attempt happened and the record
       says so. What must NOT be there is any claim about the outcome. A
       `failure_attributed` row here would put an infrastructure outage into a
       child's learner state as a misconception. */
    expect(names).toContain("episode_opened");
    expect(names).not.toContain("verdict_received");
    expect(names).not.toContain("failure_attributed");
  }, 60_000);

  it("counts the outage as infrastructure, never as a learner error", async () => {
    counters.resetCounters();

    await postSubmit({
      blockId: codeBlockId,
      episodeId: randomUUID(),
      answer: { kind: "text", value: "print(1)" },
    });

    const { values } = counters.counterSnapshot();
    expect(values["exec.requests"]).toBeGreaterThan(0);
    expect(values["exec.infra_failures"]).toBeGreaterThan(0);
    /* The distinction the whole `ExecutionStatus` type exists to protect. A
       judge that did not answer is not a program that crashed, and collapsing
       them would make December — the month about making programs fast — page
       somebody at 3am. */
    expect(values["exec.learner_errors"]).toBe(0);
  }, 60_000);

  it("leaves every other block type gradable — the lesson stays usable", async () => {
    const { res, body } = await postSubmit({
      blockId: optionBlockId,
      episodeId: randomUUID(),
      answer: { kind: "option", id: "__no_such_option__" },
    });

    expect(res.status).toBe(200);
    /* A judge outage must not stop a multiple choice from being graded: nothing
       about it goes near the sandbox. This is the half of "the lesson stays
       usable" that a purely code-focused test would miss. */
    expect(body.verdict).toBe("wrong");
    expect(body.saved).toBe(true);
  }, 60_000);
});

/* ========================================================================== */
/* 2. NOVA IS UNAVAILABLE                                                     */
/* ========================================================================== */

describe("Nova is unavailable", () => {
  /*
   * Guard, not a test of the product.
   *
   * The three tests below simulate an upstream 503 by swapping `EchoProvider`
   * for one that throws. That only works while `getNovaProvider()` actually
   * RETURNS the echo provider — and it stops doing so the moment a real
   * `DEEPSEEK_API_KEY` is visible, because the factory then imports
   * `DeepSeekProvider` instead and the mock above applies to nothing.
   *
   * A developer with a populated `.env.local` therefore sees three confusing
   * red tests whose messages point at truncation, retries and independence
   * accounting rather than at their own environment. That happened, and it
   * cost an hour. Fail here instead, saying the actual reason.
   */
  it("is exercising the mocked provider, not a live one", async () => {
    const { config } = await import("@schools/config");
    expect(
      config.nova.provider !== "deepseek" || !config.nova.apiKey,
      "DEEPSEEK_API_KEY is set in this environment, so getNovaProvider() returns the\n" +
        "real DeepSeek provider and the EchoProvider mock in this file is inert.\n" +
        "Run this suite without .env.local (as CI does): `env -u DEEPSEEK_API_KEY npx vitest run`\n" +
        "or unset the key. Nothing is wrong with the product.",
    ).toBe(true);
  });

  async function askNova(episodeId: string) {
    const res = await hint.POST(
      new Request("http://localhost/api/nova/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId: optionBlockId,
          episodeId,
          message: "не түсінбедім",
          locale: "kk",
        }),
      }),
    );
    return { res, text: await res.text() };
  }

  it("ends the stream with an error frame rather than leaving the panel spinning", async () => {
    novaDown = true;
    const episodeId = randomUUID();
    const { res, text } = await askNova(episodeId);

    // 200 with an SSE body: the transport worked, the model did not.
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    /* The policy frame arrives BEFORE the model is called, so the panel has
       something to render even when nothing else ever comes. */
    expect(text).toContain("event: policy");

    /* An error is a state, not a silence. `await res.text()` resolving at all
       is itself the assertion that the stream was closed rather than left
       open — a hung stream would time this test out. */
    expect(text).toContain("event: error");
    expect(text).toContain('"retryable":true');
    // Never a completion for a reply that never happened.
    expect(text).not.toContain("event: done");
  }, 60_000);

  it("does not charge independence for help that never arrived", async () => {
    novaDown = true;
    const episodeId = randomUUID();
    await askNova(episodeId);

    const names = (await store.eventsForEpisode(episodeId)).map((e) => e.event_name);
    /* Asking is recorded; being helped is not. The reducer folds
       `assistance_delivered` into `independence_weight`, so recording a
       delivery here would mark a learner as assisted on a task where the
       assistant said nothing at all. */
    expect(names).toContain("assistance_requested");
    expect(names).not.toContain("assistance_delivered");
  }, 60_000);

  it("counts the failure without recording who asked", async () => {
    novaDown = true;
    counters.resetCounters();
    await askNova(randomUUID());

    const { values } = counters.counterSnapshot();
    expect(values["nova.requests"]).toBeGreaterThan(0);
    expect(values["nova.failures"]).toBeGreaterThan(0);
  }, 60_000);

  it("still grades the lesson while Nova is down", async () => {
    novaDown = true;
    const { res, body } = await postSubmit({
      blockId: optionBlockId,
      episodeId: randomUUID(),
      answer: { kind: "option", id: "__no_such_option__" },
    });
    expect(res.status).toBe(200);
    expect(body.verdict).toBe("wrong");
  }, 60_000);
});

/* ========================================================================== */
/* 3. THE DATABASE WRITE FAILS                                                */
/* ========================================================================== */

describe("the database write fails", () => {
  it("returns the verdict but refuses to claim it was saved", async () => {
    novaDown = false;
    counters.resetCounters();

    const original = store.appendEvents.bind(store);
    store.appendEvents = async () => {
      throw new Error("connection terminated unexpectedly");
    };

    try {
      const episodeId = randomUUID();
      const { res, body } = await postSubmit({
        blockId: optionBlockId,
        episodeId,
        answer: { kind: "option", id: "__no_such_option__" },
      });

      /* 200 and a real verdict: the answer WAS graded, on this server, against
         the curriculum. That is true and worth telling the learner. */
      expect(res.status).toBe(200);
      expect(body.verdict).toBe("wrong");

      /* And `saved: false`, which is the whole point. The player reads this and
         returns the block to `unchecked` with «Жауап сақталмады» rather than
         painting the same settled neutral card an ungraded explanation gets.
         Before this field existed the two were indistinguishable. */
      expect(body.saved).toBe(false);

      const events = await store.eventsForEpisode(episodeId);
      expect(events).toHaveLength(0);
    } finally {
      store.appendEvents = original;
    }
  }, 60_000);

  it("counts the lost write where an operator can see it", async () => {
    counters.resetCounters();
    const original = store.appendEvents.bind(store);
    store.appendEvents = async () => {
      throw new Error("connection terminated unexpectedly");
    };
    try {
      await postSubmit({
        blockId: optionBlockId,
        episodeId: randomUUID(),
        answer: { kind: "option", id: "__no_such_option__" },
      });
      expect(counters.counterSnapshot().values["save.event_write_failures"]).toBeGreaterThan(0);
    } finally {
      store.appendEvents = original;
    }
  }, 60_000);

  it("refuses a completion with a retryable status instead of a silent 500", async () => {
    counters.resetCounters();
    const original = store.recordLessonCompletion.bind(store);
    store.recordLessonCompletion = async () => {
      throw new Error("connection terminated unexpectedly");
    };

    try {
      const { PROGRAM } = await import("@schools/curriculum/program");
      const lesson = PROGRAM.months[0].units[0].lessons[0];

      const res = await complete.POST(
        new Request("http://localhost/api/learning/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id }),
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      /* The lesson may or may not satisfy its completion policy from a cold
         ledger — that is a different subsystem's rule and not this test's
         business. What IS this test's business: if the route got as far as the
         write, the failure is reported as retryable rather than escaping as an
         unhandled 500 that the client used to swallow. */
      if (res.status !== 409) {
        expect(res.status).toBe(503);
        expect(body.error).toBe("not_recorded");
        expect(body.retryable).toBe(true);
        expect(counters.counterSnapshot().values["save.completion_failures"]).toBeGreaterThan(0);
      }
    } finally {
      store.recordLessonCompletion = original;
    }
  }, 60_000);
});

/* ========================================================================== */
/* 3b. THE OFFLINE-SAFE HALF, ON THE CLIENT                                   */
/* ========================================================================== */

describe("a completion that could not be sent is kept and re-sent", () => {
  /**
   * `src/lib/pending-writes.ts` is a browser module, so `window` and `fetch`
   * are stubbed here rather than pulling in a DOM environment for one file. The
   * stubs are deliberately dumb: the behaviour under test is the queue's, and a
   * real `localStorage` implementation would only add ways for this test to
   * fail for reasons that are not the queue's fault.
   */
  const storage = new Map<string, string>();

  beforeAll(() => {
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => void storage.set(k, v),
        removeItem: (k: string) => void storage.delete(k),
      },
    };
  });

  afterAll(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("queues on a 503 and delivers on the next flush", async () => {
    storage.clear();
    const { postOrQueue, flushPending, pendingCount } = await import("@/lib/pending-writes");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ error: "not_recorded", retryable: true }), {
          status: 503,
        })) as typeof fetch;

      const ok = await postOrQueue("/api/learning/complete", { lessonId: "m1.l1" });
      expect(ok).toBe(false);
      // Kept rather than dropped. This is the row the school's record used to lose.
      expect(pendingCount()).toBe(1);

      globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch;
      const flushed = await flushPending();
      expect(flushed.sent).toBe(1);
      expect(pendingCount()).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("drops a 4xx rather than retrying a request the server has already refused", async () => {
    storage.clear();
    const { postOrQueue, pendingCount } = await import("@/lib/pending-writes");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ error: "unknown lesson" }), { status: 404 })) as typeof fetch;

      expect(await postOrQueue("/api/learning/complete", { lessonId: "nope" })).toBe(false);
      /* One bad entry must not block every good one behind it forever. The
         server read the body and said no; it will say no identically next time. */
      expect(pendingCount()).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("queues when the network is gone entirely", async () => {
    storage.clear();
    const { postOrQueue, pendingCount } = await import("@/lib/pending-writes");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        throw new TypeError("Failed to fetch");
      }) as typeof fetch;

      expect(await postOrQueue("/api/learning/complete", { lessonId: "m1.l1" })).toBe(false);
      expect(pendingCount()).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
