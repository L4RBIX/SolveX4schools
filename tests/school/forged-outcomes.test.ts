import { beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * A learner cannot grade themselves.
 *
 * ## The hole this is the fence around
 *
 * `/api/learning/events` is the one write path from an untrusted browser into
 * the append-only ledger, and its own header comment claimed it refused "the
 * OUTCOME events, entirely". It did not. Its only filter was
 * `isLearningEventName`, so any signed-in learner could POST
 *
 *     {"eventName":"verdict_received",
 *      "payload":{"verdict":"accepted","task_ref":"block:m1.p3"}}
 *
 * and the row was stored. It landed stamped `source_trust: 'browser'`, which
 * was the correct stamp and no defence whatsoever, because **nothing read the
 * stamp**:
 *
 *   * `blockAttempts` counted `verdict_received … = 'accepted'` with no trust
 *     predicate, so the teacher's console showed the block as solved;
 *   * `solveEvidence` did the same, and it feeds the delayed re-solve — the
 *     programme's fifth independence check (PDF p.6);
 *   * `reduceEpisode` had no `source_trust` on its input type at all, so a
 *     forged verdict became an accepted episode with `independence_weight` 1
 *     — an unaided solve, in the count the whole programme is measured on.
 *
 * This mattered before Pyodide and matters much more after it: once the
 * browser genuinely executes Python, "I ran it and it passed" becomes a
 * plausible-sounding story rather than an obvious forgery.
 *
 * The fix is at all three layers, and each is tested here separately, because
 * a pilot database may already hold rows written before the ingest fix.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "44444444-4444-4444-8444-444444444444";
/** A second, real learner. Needed because `learning_events.subject_id` is a
    foreign key — a forged episode has to belong to somebody who exists. */
const ANON_OTHER = "55555555-5555-4555-8555-555555555555";

let currentAnon = ANON;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: currentAnon } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;

let store: Store;
let events: typeof import("../../src/app/api/learning/events/route");
let subjectId: string;
let otherSubjectId: string;

beforeAll(async () => {
  events = await import("../../src/app/api/learning/events/route");
  store = await (await import("@schools/store")).getStore();
  const { resolveIdentity } = await import("@schools/learning/identity");
  subjectId = (await resolveIdentity()).subjectId;

  /* Provisioned through the same path a real learner is, so the row exists and
     the foreign key holds. Switched back immediately — every test below runs
     as `ANON`. */
  currentAnon = ANON_OTHER;
  otherSubjectId = (await resolveIdentity()).subjectId;
  currentAnon = ANON;
  expect(otherSubjectId).not.toBe(subjectId);
  /* 90s, matching the other store suites. This is migrating a fresh in-memory
     Postgres, and under a full parallel run the default 10s is not enough —
     it passed alone and timed out in the suite, which is the worst way for a
     test to be wrong. */
}, 90_000);

const post = (body: unknown) =>
  events.POST(
    new Request("http://localhost/api/learning/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("layer 1 — ingest refuses to create an outcome", () => {
  it("drops a forged accepted verdict", async () => {
    const res = await post({
      events: [
        {
          eventId: randomUUID(),
          episodeId: randomUUID(),
          sessionId: randomUUID(),
          seq: 0,
          eventName: "verdict_received",
          occurredAt: new Date().toISOString(),
          payload: { verdict: "accepted", task_ref: "block:m1.p3" },
        },
      ],
    });
    const body = (await res.json()) as { accepted: number; inserted: number };
    /* Dropped, not rejected with a 400. A 400 naming the refused event teaches
       whoever is probing exactly which name to try next. */
    expect(res.status).toBe(200);
    expect(body.accepted, "the forged verdict must never become a row").toBe(0);
    expect(body.inserted).toBe(0);
  });

  it("drops a forged failure attribution", async () => {
    const res = await post({
      events: [
        {
          eventId: randomUUID(),
          sessionId: randomUUID(),
          seq: 0,
          eventName: "failure_attributed",
          occurredAt: new Date().toISOString(),
          payload: { failure_class: "off_by_one" },
        },
      ],
    });
    expect(((await res.json()) as { accepted: number }).accepted).toBe(0);
  });

  it("drops forged assistance, which would otherwise LOWER a learner's independence", async () => {
    /* The forgery that runs the other way, and it is worth naming: a learner
       cannot inflate their own independence with this one, but a bored
       fourteen-year-old can hand a classmate's console a page of fake help. */
    const res = await post({
      events: [
        {
          eventId: randomUUID(),
          sessionId: randomUUID(),
          seq: 0,
          eventName: "assistance_delivered",
          occurredAt: new Date().toISOString(),
          payload: { level: 3 },
        },
      ],
    });
    expect(((await res.json()) as { accepted: number }).accepted).toBe(0);
  });

  it("still accepts everything the browser is the rightful author of", async () => {
    /* The other half of the fix, and the half a blunt "reject outcome events"
       patch would have broken. The browser is the ONLY witness to these: it is
       where the learner revisited the statement, went idle, and pressed Run.
       `run_executed` in particular is what the Nova hint ladder counts as
       effort, so dropping it would silently punish a learner for iterating. */
    const sessionId = randomUUID();
    const episodeId = randomUUID();
    const names = [
      "episode_opened",
      "run_executed",
      "statement_revisited",
      "idle_gap",
      "test_case_authored",
      "episode_closed",
    ];
    const res = await post({
      events: names.map((eventName, i) => ({
        eventId: randomUUID(),
        episodeId,
        sessionId,
        seq: i,
        eventName,
        occurredAt: new Date().toISOString(),
        payload: { task_ref: "block:m1.p3" },
      })),
    });
    const body = (await res.json()) as { accepted: number; inserted: number };
    expect(body.accepted, "browser-authored events must still get through").toBe(names.length);
    expect(body.inserted).toBe(names.length);
  });

  it("keeps the allowlist and the trust map in agreement", async () => {
    const { CLIENT_REPORTABLE_EVENTS, EVENT_TRUST, LEARNING_EVENTS } = await import(
      "@solvex/learning-contracts"
    );
    for (const name of LEARNING_EVENTS) {
      if (!CLIENT_REPORTABLE_EVENTS.has(name)) continue;
      /* Derived rather than hand-written, so the two cannot drift when an
         event is added. Anything a browser may report must already be worth
         only browser trust. */
      expect(EVENT_TRUST[name], `${name} is client-reportable but not browser-trust`).toBe(
        "browser",
      );
    }
    expect(
      CLIENT_REPORTABLE_EVENTS.has("verdict_received"),
      "the submit route is the only writer of a verdict",
    ).toBe(false);
  });
});

describe("layer 1b — a learner cannot write into someone else's episode", () => {
  /**
   * The twin of the verdict hole, found by the same reading of the same route.
   *
   * `/api/learning/events` documented itself as refusing a foreign episode —
   * "`ownedEpisodeId` refuses one that belongs to another learner, exactly as
   * the submit and hint routes already do" — and simply copied `episodeId` out
   * of the body. The field was structurally dead, because nothing on this route
   * ever sent one: `statement_revisited`, the only client event here, has no
   * episode. **The Run button changed that.** `run_executed` carries an episode
   * so a Run joins the same episode as the eventual Check, which is correct and
   * which also made an unreachable hole reachable.
   *
   * What a foreign episode id buys, all of it episode-keyed with no subject
   * predicate: `enforceHintPolicy` reads `eventsForEpisode(episodeId)` and
   * counts `run_executed` as EFFORT, so an injected Run grants a hint level in
   * a victim's episode; `reduceEpisode` folds it into `runs` and into the
   * `meaningful` filter that separates `stuck` from `productive_struggle`.
   */
  it("mints a fresh episode rather than joining a foreign one", async () => {
    /* A different learner's episode, established by a row they own. */
    const victimEpisode = randomUUID();
    await store.appendEvents([
      {
        eventId: randomUUID(),
        subjectId: otherSubjectId,
        episodeId: victimEpisode,
        sessionId: randomUUID(),
        seq: 0,
        eventName: "episode_opened",
        occurredAt: new Date().toISOString(),
        sourceTrust: "server",
        environment: "development",
        cohort: "public",
        route: "/test",
        payload: { task_ref: "block:m1.p5" },
      },
    ]);

    const res = await post({
      events: [
        {
          eventId: randomUUID(),
          episodeId: victimEpisode,
          sessionId: randomUUID(),
          seq: 0,
          eventName: "run_executed",
          occurredAt: new Date().toISOString(),
          payload: { task_ref: "block:m1.p5" },
        },
      ],
    });
    /* Accepted, not refused — the rule is substitution, so a stale id never
       costs a learner their own work. What must not happen is the row landing
       in the other child's episode. */
    expect(((await res.json()) as { inserted: number }).inserted).toBe(1);

    const victimEvents = await store.eventsForEpisode(victimEpisode);
    expect(
      victimEvents.length,
      "the intruder's Run must not appear in the victim's episode",
    ).toBe(1);
    expect(victimEvents[0].event_name).toBe("episode_opened");
  });

  it("keeps an episode the learner does own", async () => {
    /* The complement, and the reason substitution is not just "always mint a
       new id": a learner's Run and their Check must land in the SAME episode,
       or the reducer sees two episodes where there was one attempt. */
    const mine = randomUUID();
    const send = (name: string, seq: number) =>
      post({
        events: [
          {
            eventId: randomUUID(),
            episodeId: mine,
            sessionId: randomUUID(),
            seq,
            eventName: name,
            occurredAt: new Date().toISOString(),
            payload: { task_ref: "block:m1.p6" },
          },
        ],
      });

    await send("episode_opened", 0);
    await send("run_executed", 1);
    await send("run_executed", 2);

    const events = await store.eventsForEpisode(mine);
    expect(events.length, "all three must share the episode they asked for").toBe(3);
    expect(events.filter((e) => e.event_name === "run_executed").length).toBe(2);
  }, 60_000);
});

describe("layer 2 — the reducer refuses to settle on an untrusted outcome", () => {
  it("ignores a browser-stamped verdict and counts a judge-stamped one", async () => {
    const { reduceEpisode } = await import("@solvex/learning-intelligence-core");

    const base = {
      occurred_at: "2026-02-01T10:00:00.000Z",
      received_at: "2026-02-01T10:00:00.000Z",
      payload: { task_ref: "block:m1.p3", task_kind: "code" as const },
    };
    const opened = { ...base, event_name: "episode_opened", seq: 0, source_trust: "server" };
    const verdictPayload = { verdict: "accepted", task_ref: "block:m1.p3" };

    const forged = reduceEpisode([
      opened,
      {
        ...base,
        event_name: "verdict_received",
        seq: 1,
        payload: verdictPayload,
        source_trust: "browser",
      },
    ]);
    expect(forged, "the episode still reduces; only the outcome is refused").not.toBeNull();
    expect(forged!.outcome, "a browser verdict must not accept an episode").not.toBe("accepted");
    expect(forged!.verdict_sequence, "and must leave no trace in the sequence").toEqual([]);
    expect(forged!.submissions).toBe(0);

    const real = reduceEpisode([
      opened,
      {
        ...base,
        event_name: "verdict_received",
        seq: 1,
        payload: verdictPayload,
        source_trust: "judge",
      },
    ]);
    expect(real!.outcome, "the judge's verdict must still settle it").toBe("accepted");
    expect(real!.verdict_sequence.length).toBe(1);
  });

  it("treats an absent source_trust as trusted, and says why", async () => {
    /* The one debatable line in `isTrustedOutcome`. Every fixture and replay in
       the repo constructs events by hand and omits the field while testing
       genuine judge-graded behaviour; treating absent as untrusted would
       silently empty those suites of the thing they assert. Real rows always
       carry it — the column is `not null` with a check constraint (migration
       0003) — so "absent" only ever means "constructed in a test". */
    const { reduceEpisode, isTrustedOutcome } = await import(
      "@solvex/learning-intelligence-core"
    );
    expect(
      isTrustedOutcome({
        event_name: "verdict_received",
        occurred_at: "2026-02-01T10:00:00.000Z",
        received_at: "2026-02-01T10:00:00.000Z",
        seq: 0,
        payload: {},
      }),
    ).toBe(true);

    const legacy = reduceEpisode([
      {
        event_name: "episode_opened",
        occurred_at: "2026-02-01T10:00:00.000Z",
        received_at: "2026-02-01T10:00:00.000Z",
        seq: 0,
        payload: { task_ref: "block:m1.p3" },
      },
      {
        event_name: "verdict_received",
        occurred_at: "2026-02-01T10:00:01.000Z",
        received_at: "2026-02-01T10:00:01.000Z",
        seq: 1,
        payload: { verdict: "accepted", task_ref: "block:m1.p3" },
      },
    ]);
    expect(legacy!.outcome).toBe("accepted");
  });
});

describe("layer 3 — the read path requires judge trust", () => {
  it("does not count a browser-stamped verdict as a solve", async () => {
    /* Written straight to the store, bypassing ingest — which is exactly the
       state a pilot database can already be in, from before layer 1 existed.
       Layer 1 stops new forgeries; this is what stops old ones counting. */
    const episodeId = randomUUID();
    const blockId = "m1.p3";
    await store.appendEvents([
      {
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId: randomUUID(),
        seq: 0,
        eventName: "episode_opened",
        occurredAt: new Date().toISOString(),
        sourceTrust: "server",
        environment: "development",
        cohort: "public",
        route: "/test",
        payload: { task_ref: `block:${blockId}` },
      },
      {
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId: randomUUID(),
        seq: 1,
        eventName: "verdict_received",
        occurredAt: new Date().toISOString(),
        sourceTrust: "browser",
        environment: "development",
        cohort: "public",
        route: "/test",
        payload: { verdict: "accepted", task_ref: `block:${blockId}` },
      },
    ]);

    const evidence = await store.blockAttempts(subjectId, [blockId]);
    expect(
      evidence.get(blockId)?.accepted,
      "a browser-stamped verdict must not show as solved in the teacher's console",
    ).toBe(false);

    const solve = await store.solveEvidence(subjectId, episodeId);
    expect(solve.accepted, "and must not satisfy the independence check").toBe(false);
  }, 60_000);

  it("counts a judge-stamped verdict on the same query", async () => {
    /* The complement, and the reason the predicate is `source_trust = 'judge'`
       rather than `!= 'browser'`: a test that only proves the negative would
       pass just as well if the query had been broken outright. */
    const episodeId = randomUUID();
    const blockId = "m1.p4";
    await store.appendEvents([
      {
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId: randomUUID(),
        seq: 0,
        eventName: "episode_opened",
        occurredAt: new Date().toISOString(),
        sourceTrust: "server",
        environment: "development",
        cohort: "public",
        route: "/test",
        payload: { task_ref: `block:${blockId}` },
      },
      {
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId: randomUUID(),
        seq: 1,
        eventName: "verdict_received",
        occurredAt: new Date().toISOString(),
        sourceTrust: "judge",
        environment: "development",
        cohort: "public",
        route: "/test",
        payload: { verdict: "accepted", task_ref: `block:${blockId}` },
      },
    ]);

    const evidence = await store.blockAttempts(subjectId, [blockId]);
    expect(evidence.get(blockId)?.accepted).toBe(true);
    expect((await store.solveEvidence(subjectId, episodeId)).accepted).toBe(true);
  }, 60_000);
});
