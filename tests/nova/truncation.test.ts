import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { GrantDecision } from "@solvex/nova-core";

/**
 * A half-word must never render as a finished hint.
 *
 * ## The defect
 *
 * `DeepSeekProvider` read `choices[0].delta.content` and nothing else. When the
 * model hit `max_tokens` the provider stopped producing text, the stream ended,
 * and the route delivered what had arrived as a successful answer. Measured on
 * the live provider against the dev server, 20 Kazakh and 20 Russian questions
 * spread across September to May:
 *
 *   kk  4/20 ended mid-thought   ru  1/20   incomplete signals sent: 0
 *
 * One of them ended `...қатені тү` — mid-word, mid-syllable — rendered in the
 * panel as an ordinary complete message with no mark on it whatsoever.
 *
 * ## Why nothing below the provider could have caught it
 *
 * Two layers look at the response and neither can see this, which is asserted
 * rather than asserted-about further down:
 *
 *   - The VALIDATOR asks "does this text contain something forbidden". A
 *     truncated answer is a PREFIX, so it can only ever contain less. It
 *     returns clean.
 *   - The GUARD reports whether IT stopped the stream. It did not; the source
 *     ran out. It reports `truncated: false`.
 *
 * And the transport says nothing either: measured against the live API, a
 * `max_tokens` cut-off sends a perfectly well-formed `[DONE]`, exactly as a
 * natural ending does. The only thing anywhere in the system that knows is
 * `finish_reason`, which was not being read.
 *
 * ## What is asserted
 *
 * The real `DeepSeekProvider` against SSE bytes copied from the live wire, the
 * real validator, the real guard, and the real route end to end. The frames
 * below are not invented: they are the shape the API actually returned,
 * including the detail that decides the whole thing — `finish_reason` arrives
 * on a final frame whose `delta.content` is the empty string, so a reader that
 * looks for it inside the text branch never sees it.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "33333333-3333-4333-8333-333333333333";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

/* ========================================================================== */
/* Wire fixtures — copied from the live provider, not composed by hand.       */
/* ========================================================================== */

const chunk = (content: string, finish: string | null = null) =>
  `data: ${JSON.stringify({
    id: "00cfbcee-2605-41e1-9b39-5085218628d1",
    object: "chat.completion.chunk",
    created: 1788271494,
    model: "deepseek-v4-flash",
    choices: [{ index: 0, delta: { content }, logprobs: null, finish_reason: finish }],
    usage: null,
  })}\n\n`;

/** The final frame: empty content, the reason, and the usage all together. */
const closing = (finish: string) =>
  `data: ${JSON.stringify({
    id: "00cfbcee-2605-41e1-9b39-5085218628d1",
    object: "chat.completion.chunk",
    created: 1788271494,
    model: "deepseek-v4-flash",
    choices: [{ index: 0, delta: { content: "" }, logprobs: null, finish_reason: finish }],
    usage: { prompt_tokens: 73, completion_tokens: 60 },
  })}\n\n`;

const DONE = "data: [DONE]\n\n";

/**
 * A real cut-off Kazakh reply, taken verbatim from the live run.
 *
 * It ends inside the word «түзету». Used below to prove that the validator
 * finds nothing wrong with it — which is the reason detection had to move to
 * the provider rather than being added to `validate.ts`.
 */
const TRUNCATED_KK =
  "Функцияны бір рет жазып қойып, содан кейін кодтың кез келген жерінде " +
  "атын жазып қою жеткілікті. Бұл кодты қысқартады және қатені тү";

/** Streams the supplied SSE text as a body, optionally without ever ending it. */
function sseResponse(body: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

async function drain(provider: { stream: (r: never) => AsyncIterable<string> }, req: unknown) {
  let text = "";
  for await (const piece of provider.stream(req as never)) text += piece;
  return text;
}

/* ========================================================================== */
/* 1. THE PROVIDER READS WHY IT STOPPED                                       */
/* ========================================================================== */

describe("the provider reports why generation ended", () => {
  let DeepSeekProvider: typeof import("@schools/nova/providers/deepseek").DeepSeekProvider;

  beforeAll(async () => {
    ({ DeepSeekProvider } = await import("@schools/nova/providers/deepseek"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Runs one wire transcript through the real provider. */
  async function run(body: string) {
    vi.stubGlobal("fetch", async () => sseResponse(body));
    const reasons: string[] = [];
    const text = await drain(new DeepSeekProvider("sk-test-key"), {
      messages: [{ role: "user", content: "не?" }],
      maxTokens: 60,
      temperature: 0.4,
      onFinish: (r: string) => reasons.push(r),
    });
    return { text, reasons };
  }

  it("reports `length` when the token ceiling ended the answer", async () => {
    const { text, reasons } = await run(
      chunk("Бұл кодты ") + chunk("қысқартады және қатені тү") + closing("length") + DONE,
    );

    /* The whole defect in one assertion. Before this, the reason was on the
       wire, in a frame the provider parsed, and was dropped on the floor. */
    expect(reasons).toEqual(["length"]);
    /* And the text still arrives. Detection must not cost the learner the two
       thirds of a hint that did make it. */
    expect(text).toBe("Бұл кодты қысқартады және қатені тү");
  });

  it("reports `stop` when the model ended its own turn", async () => {
    const { reasons } = await run(chunk("Жақсы, қай жолды кінәлі деп ойлайсың?") + closing("stop") + DONE);
    expect(reasons).toEqual(["stop"]);
  });

  it("does not let `[DONE]` swallow the reason", async () => {
    /* The original code did `if (data === "[DONE]") return;` — a bare return
       out of the generator. `[DONE]` is sent after a truncated answer exactly
       as it is after a whole one, so the one frame proving the transport was
       healthy was also the frame that discarded the diagnosis. */
    const { reasons } = await run(chunk("жарты") + closing("length") + DONE);
    expect(reasons).toEqual(["length"]);
  });

  it("reports `incomplete` when the stream just stops", async () => {
    /* No closing frame, no `[DONE]`: a dropped socket, a proxy that gave up, a
       truncated body. Nothing said why, so nothing is claimed — least of all
       that it finished. */
    const { reasons } = await run(chunk("Жауаптың басы ғана"));
    expect(reasons).toEqual(["incomplete"]);
  });

  it("reports `unknown` — never `stop` — when the provider is silent", async () => {
    /* A clean protocol ending with no reason attached. The transport finished;
       the model did not say. Inferring `stop` here would certify a fragment as
       complete on the strength of a provider's silence. */
    const { reasons } = await run(chunk("мәтін") + DONE);
    expect(reasons).toEqual(["unknown"]);
  });

  it("maps an unrecognised reason to `unknown` rather than to `stop`", async () => {
    const { reasons } = await run(chunk("мәтін") + closing("tool_calls") + DONE);
    expect(reasons).toEqual(["unknown"]);
    expect(reasons).not.toContain("stop");
  });

  it("turns a mid-stream abort into a timeout, not an unknown", async () => {
    /*
     * A second defect, found on the way to the first.
     *
     * The provider's try/catch covered `fetch` only. A timeout fires far more
     * often AFTER the response headers than before them, and `reader.read()`
     * then rejects with a `DOMException` named `AbortError` — not a
     * `NovaProviderError`. The route's `err instanceof NovaProviderError` test
     * failed, so the learner was told `kind: "unknown"` («Причина неизвестна»)
     * for the one failure the panel has exact, actionable copy for.
     */
    const { NovaProviderError } = await import("@schools/nova/provider");

    vi.stubGlobal("fetch", async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(chunk("бас")));
            /* What an aborted body does: errors the stream rather than closing
               it. Reproduced exactly, because the error's identity is the
               thing under test. */
            controller.error(
              Object.assign(new Error("This operation was aborted"), { name: "AbortError" }),
            );
          },
        }),
        { status: 200, headers: { "content-type": "text/event-stream" } },
      ),
    );

    const provider = new DeepSeekProvider("sk-test-key");
    const err = await drain(provider, {
      messages: [{ role: "user", content: "не?" }],
      maxTokens: 60,
      temperature: 0.4,
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(NovaProviderError);
    expect((err as InstanceType<typeof NovaProviderError>).kind).toBe("timeout");
  });
});

/* ========================================================================== */
/* 2. WHY THE LAYERS BELOW COULD NEVER HAVE CAUGHT IT                         */
/* ========================================================================== */

/**
 * The opening rung: no code, one question, nothing given away.
 *
 * Annotated rather than `as const` — the core's `mustNotSay` is a mutable
 * `string[]`, so a const-asserted literal is a readonly array the compiler
 * rejects at the use site. `npx vitest run` does not typecheck, so this passes
 * its own tests and fails `npx tsc --noEmit`.
 */
const GRANT: GrantDecision = {
  requested: 1,
  granted: 1,
  capped: false,
  reason: "opening_rung",
  explanation: null,
  mayIncludeCode: false,
  mustNotSay: [],
};

describe("truncation is invisible to every check that is not the provider", () => {
  it("the output validator finds nothing wrong with a cut-off answer", async () => {
    const { validateOutput } = await import("@schools/nova/validate");
    const grant: GrantDecision = GRANT;

    /* Not a shortcoming of the validator. Every rule in it asks whether the
       text CONTAINS something forbidden, and a prefix contains strictly less
       than the whole — so no amount of tuning there could ever detect a cut,
       and adding a "does this end in punctuation" rule would fail every hint
       that legitimately ends in a code identifier. */
    expect(validateOutput(TRUNCATED_KK, { grant, directive: null })).toEqual([]);
  });

  it("the stream guard reports a capped response as not truncated", async () => {
    const { guardedStream } = await import("@schools/nova/guard");
    const grant: GrantDecision = GRANT;

    async function* source() {
      for (const piece of TRUNCATED_KK.split(" ")) yield piece + " ";
    }

    const stream = guardedStream(source(), { grant, directive: null });
    let result = await stream.next();
    while (!result.done) result = await stream.next();

    /* `GuardOutcome.truncated` means "the VALIDATOR cut this off", which is a
       different question and the right one for that type to answer. It is
       false here, and it is why the route cannot learn about a token ceiling
       from the guard's outcome. */
    expect(result.value.truncated).toBe(false);
    expect(result.value.violations).toEqual([]);
  });
});

/* ========================================================================== */
/* 3. THE ROUTE TELLS THE LEARNER                                             */
/* ========================================================================== */

/** What the provider was asked for, and what it chose to do about it. */
interface Scripted {
  text: string;
  finish: string;
  /** Set by the mock on every call, so the request can be asserted on. */
  seen: { maxTokens: number }[];
}

const scripted: Scripted = { text: "", finish: "stop", seen: [] };
let calls = 0;
/** When true the scripted provider never reports a finish reason. */
let silent = false;

vi.mock("@schools/nova", async (importOriginal) => {
  const real = await importOriginal<typeof import("@schools/nova")>();
  return {
    ...real,
    getNovaProvider: async () => ({
      id: "deepseek",
      model: "deepseek-v4-flash",
      degraded: false,
      async *stream(request: {
        maxTokens: number;
        onFinish?: (r: string) => void;
        onUsage?: (u: { inputTokens: number; outputTokens: number }) => void;
      }) {
        calls += 1;
        scripted.seen.push({ maxTokens: request.maxTokens });
        if (scripted.text) yield scripted.text;
        request.onUsage?.({ inputTokens: 73, outputTokens: 60 });
        /* `silent` models a provider that reports no reason at all — the
           offline `echo` fallback, and any future provider that does not
           implement the callback. */
        if (!silent) request.onFinish?.(scripted.finish);
      },
    }),
  };
});

describe("the route says so, in the learner's language", () => {
  let hint: typeof import("../../src/app/api/nova/hint/route");
  let blockId: string;

  beforeAll(async () => {
    hint = await import("../../src/app/api/nova/hint/route");
    const { PROGRAM } = await import("@schools/curriculum/program");
    blockId = PROGRAM.months[0].units[0].lessons[0].blocks[0].id;
  }, 90_000);

  async function ask(locale: "kk" | "ru", text: string, finish: string) {
    scripted.text = text;
    scripted.finish = finish;
    scripted.seen = [];
    calls = 0;
    const res = await hint.POST(
      new Request("http://localhost/api/nova/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId,
          episodeId: randomUUID(),
          message: "не түсінбедім",
          requestedLevel: 1,
          locale,
        }),
      }),
    );
    return await res.text();
  }

  const shown = (sse: string) =>
    [...sse.matchAll(/event: token\ndata: (.+)\n/g)]
      .map((m) => (JSON.parse(m[1]) as { text: string }).text)
      .join("");

  it("marks a cut-off answer and keeps every word of it", async () => {
    const sse = await ask("kk", TRUNCATED_KK, "length");

    /* The frame that did not exist. Without it the panel had nothing to render
       and no way to know there was anything to render. */
    expect(sse).toContain("event: incomplete");
    expect(sse).toContain('"reason":"length"');
    /* The partial is still delivered in full. Two thirds of a hint is two
       thirds of a hint, and deleting it to punish our own ceiling would take a
       useful sentence away from a learner who is stuck. */
    expect(shown(sse)).toBe(TRUNCATED_KK);
    /* And it is NOT an error. The request worked and the model answered; the
       panel's failure vocabulary would tell a fourteen-year-old that something
       broke when what happened is that Nova ran out of room. */
    expect(sse).not.toContain("event: error");
    expect(sse).toContain("event: done");

    /* Order matters on the wire: the caption has to arrive after the text it
       captions and before the stream closes, or the panel either patches a
       message that has not finished rendering or never sees the frame at all. */
    const order = [...sse.matchAll(/^event: (.+)$/gm)].map((m) => m[1]);
    expect(order.indexOf("incomplete")).toBeGreaterThan(order.lastIndexOf("token"));
    expect(order.indexOf("incomplete")).toBeLessThan(order.indexOf("done"));
  }, 60_000);

  it("says nothing at all when the answer actually finished", async () => {
    const sse = await ask("ru", "Посмотри на строку с `if` — что там сравнивается?", "stop");

    /* The other half of the property, and the one that decides whether this is
       usable: a warning on a complete answer trains a class to ignore the
       warning. */
    expect(sse).not.toContain("event: incomplete");
    expect(sse).toContain("event: done");
  }, 60_000);

  it("retries once when the stream died before a single token", async () => {
    const sse = await ask("kk", "", "incomplete");

    /* Nothing reached the learner, so there is nothing a second answer could
       be glued onto — the one case where a retry is both safe and likely to
       work. A `length` ending with no text is deliberately NOT retried: the
       ceiling is deterministic and attempt two would end where attempt one
       did. */
    expect(calls).toBe(2);
    /* Both attempts came back empty, so this IS a failed turn and is reported
       as one, with the button that goes with a dropped connection. */
    expect(sse).toContain("event: error");
    expect(sse).toContain('"retryable":true');
    /* No caption without text to caption. */
    expect(sse).not.toContain("event: incomplete");
  }, 60_000);

  it("leaves the Russian budget exactly where it was", async () => {
    await ask("ru", "ответ", "stop");

    /*
     * The number this rung has always had: `NOVA_MAX_OUTPUT_TOKENS` (500) times
     * the opening rung's 0.25 share. Pinned rather than derived, because the
     * point of the assertion is that the locale factor did NOT move it — a
     * change to the ladder's shares would land here first, and a "fix" for
     * truncation that quietly widened everyone's ceiling would be caught by
     * this line rather than shipped as a fairness correction.
     */
    expect(scripted.seen[0].maxTokens).toBe(125);
  }, 60_000);

  it("gives Kazakh the room its tokeniser costs, at the same rung", async () => {
    await ask("kk", "жауап", "stop");
    const kk = scripted.seen[0].maxTokens;
    await ask("ru", "ответ", "stop");
    const ru = scripted.seen[0].maxTokens;

    /*
     * Measured, not guessed: the same hint costs ~1.43x the tokens in Kazakh
     * because the tokeniser splits it finer. One figure for both languages
     * therefore bought Kazakh learners about 70% of the room, at every rung,
     * which is why Kazakh was the language that got cut off.
     *
     * This is a correction to a safety net, not a raised ceiling. What Nova may
     * SAY is set by the prompt in sentences and by `codeLineBudget` in code
     * lines, and neither moved. The grant is identical in both calls — same
     * block, same ledger, same rung — so the only variable is the language.
     */
    expect(kk).toBe(181);
    expect(kk).toBeGreaterThan(ru);
    expect(kk / ru).toBeCloseTo(1.45, 2);
  }, 60_000);

  it("says nothing about a provider that reports nothing", async () => {
    /*
     * The offline `echo` fallback never calls `onFinish` at all. A design that
     * inferred truncation from silence would put a "this answer is cut off"
     * caption under every sentence in a classroom whose key was never set —
     * which is why `unknown` is a value in its own right and is not treated as
     * a cut-off.
     */
    scripted.text = "Бір нәрсе жасап көрдің бе?";
    scripted.finish = "";
    silent = true;
    const res = await hint.POST(
      new Request("http://localhost/api/nova/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId,
          episodeId: randomUUID(),
          message: "не түсінбедім",
          requestedLevel: 1,
          locale: "kk",
        }),
      }),
    );
    silent = false;
    const sse = await res.text();

    expect(sse).not.toContain("event: incomplete");
    expect(sse).not.toContain("event: error");
    expect(sse).toContain("event: done");
  }, 60_000);
});
