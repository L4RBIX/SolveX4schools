import { beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * The hint route when the ledger is gone.
 *
 * This is a real incident, not a hypothetical: a local PGlite data directory
 * became unreadable, and every store touch on `/api/nova/hint` — the session
 * check, `resolveIdentity`, `getStore` itself — sat outside any try/catch. The
 * rejection escaped, Next answered a bare 500 with an EMPTY body, and the panel
 * (whose entire error protocol is SSE frames) had nothing at all to read. What
 * a fourteen-year-old saw was «Жауап алынбады. Қайта көріңіз.» twice, beside a
 * Retry button with no cap on it, while `/api/health` knew exactly what was
 * wrong in both languages and nobody was looking at it.
 *
 * So the assertions here are about SPEECH, not about recovery. Nothing in this
 * file claims the store comes back. It claims that when it does not, the route
 * still frames a policy, still streams a sentence, still closes the stream, and
 * still counts the outage somewhere an operator can see it.
 *
 * The failure is injected at the module seam a real outage arrives through —
 * `getStore` and `getStoreHandle` rejecting — rather than by stubbing the route's
 * own helpers, because the defect was never in a helper. It was in which awaits
 * had a catch around them.
 */

/* Never the developer's own `.data`, even though every store call below is
   mocked: `config` reads `process.env` once at import and the assertion should
   not depend on which module happens to import it first. */
process.env.LEARNING_DATA_DIR = "memory://";

/** The anonymous learner cookie, and deliberately nothing else. */
const ANON = "11111111-1111-4111-8111-111111111111";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

/* Both doors into the database, closed. `getStore` is what the route and
   `resolveIdentity` open; `getStoreHandle` is what the rate limiter and the
   episode-scope check reach for. Mocking only the first would leave the route
   dying one await later and the test passing for the wrong reason.

   The message is the real one an unreadable data directory produces, because
   it also ends up trimmed into the ops line. */
vi.mock("@schools/store", async (importOriginal) => {
  const real = await importOriginal<typeof import("@schools/store")>();
  const dead = async () => {
    throw new Error("ENOENT: no such file or directory, open '.data/pgdata/PG_VERSION'");
  };
  return { ...real, getStore: dead, getStoreHandle: dead };
});

let hint: typeof import("../../src/app/api/nova/hint/route");
let counters: typeof import("@schools/ops/counters");
let labels: typeof import("@schools/presentation/labels");

/** Any real block. The route resolves it from the curriculum before it decides. */
let blockId: string;

beforeAll(async () => {
  hint = await import("../../src/app/api/nova/hint/route");
  counters = await import("@schools/ops/counters");
  labels = await import("@schools/presentation/labels");

  const { PROGRAM } = await import("@schools/curriculum/program");
  blockId = PROGRAM.months[0].units[0].lessons[0].blocks[0].id;
  expect(blockId, "the curriculum should contain at least one block").toBeTruthy();
}, 90_000);

async function ask(locale: "kk" | "ru") {
  const res = await hint.POST(
    new Request("http://localhost/api/nova/hint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blockId,
        episodeId: randomUUID(),
        message: "не түсінбедім",
        locale,
      }),
    }),
  );
  return { res, text: await res.text() };
}

/** The sentence as the learner actually received it: token frames, reassembled. */
function shownText(sse: string): string {
  return [...sse.matchAll(/event: token\ndata: (.+)\n/g)]
    .map((m) => (JSON.parse(m[1]) as { text: string }).text)
    .join("");
}

describe("the ledger will not answer", () => {
  it("answers with a stream rather than an empty 500", async () => {
    counters.resetCounters();
    const { res, text } = await ask("ru");

    /* 200 and SSE: the transport worked and the route reached the learner. The
       old behaviour failed both — no status the panel could act on, and a body
       with nothing in it. */
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    expect(text).toContain("event: policy");
    /* The flag the panel keys on to drop the hint chrome. Inferring it from the
       prose is what produced a policy notice over a sentence that is not one. */
    expect(text).toContain('"storeDown":true');
    /* `await res.text()` resolving is itself the assertion that the stream was
       closed; `done` is the assertion that it was closed deliberately. */
    expect(text).toContain("event: done");
  }, 60_000);

  it("says the true thing, in the language of the lesson", async () => {
    const ru = shownText((await ask("ru")).text);
    const kk = shownText((await ask("kk")).text);

    expect(ru).toBe(labels.L.novaStoreDown.ru);
    expect(kk).toBe(labels.L.novaStoreDown.kk);
    /* Two languages, not one string shown twice. Half this class is taught in
       Russian and half in Kazakh, and a fallback locale would be a guess. */
    expect(kk).not.toBe(ru);
  }, 60_000);

  it("never invents a hint it could not have derived", async () => {
    const { text } = await ask("kk");

    /* The hint ceiling comes from the ledger — the rung last granted, the
       effort since, the assessment cap. With no ledger there is no ceiling, so
       the frame grants nothing rather than guessing, and no model is called. */
    expect(text).toContain('"granted":0');
    expect(text).toContain('"provider":"policy"');
    /* And NOT degraded: `degraded` means "there is no model behind Nova" and
       raises a banner saying so to the whole class. The model is fine here. */
    expect(text).toContain('"degraded":false');
  }, 60_000);

  it("counts the outage where an operator can see it", async () => {
    counters.resetCounters();
    await ask("kk");

    const { values } = counters.counterSnapshot();
    expect(values["nova.store_unavailable"]).toBeGreaterThan(0);
    /* Not a provider failure: nothing was asked of a model. Collapsing the two
       would have an operator debugging DeepSeek during a database outage. */
    expect(values["nova.failures"]).toBe(0);
  }, 60_000);
});
