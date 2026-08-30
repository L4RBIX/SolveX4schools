import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What an operator can see about a metered judge, and what must never be
 * visible at all.
 *
 * ## THE STANDING CAVEAT
 *
 * **No live call has ever been made from this repository.** There is no
 * RapidAPI key here. Nothing in this file contacts `judge0-ce.p.rapidapi.com`,
 * and several tests below assert precisely that: that `fetch` is not called at
 * all on the paths where the environment already says the answer.
 *
 * So this file proves the ACCOUNTING and the DISCLOSURE — that a quota header
 * is read correctly, that a 429 lands in its own counter, that a key cannot
 * reach a health payload, that an unconfigured provider is not "configured".
 * It proves nothing whatsoever about Judge0, RapidAPI, or which Python they
 * would run.
 *
 * ## The three properties
 *
 * 1. **Cost is countable.** A rented judge bills per HTTP REQUEST while the
 *    rest of the system counts EXECUTIONS, and those differ by however many
 *    polls an answer took. If the breakdown stops summing to the total, the
 *    number on the invoice has nothing to check it against.
 * 2. **A probe costs money, so nothing probes by accident.** Every path that
 *    can answer from the environment must answer from the environment.
 * 3. **Nothing leaks.** Not the key, not a prefix of it, not its length, not a
 *    header, not a provider response body.
 */

describe("provider quota — reading a vendor's rate-limit headers", () => {
  beforeEach(async () => {
    const { resetProviderQuota } = await import("../../schools/ops/provider-quota");
    resetProviderQuota();
  });

  const headers = (h: Record<string, string>) => ({
    get: (name: string) => h[name.toLowerCase()] ?? null,
  });

  it("reports null before anything has looked, which is not the same as zero", async () => {
    const { providerQuota } = await import("../../schools/ops/provider-quota");
    /* The distinction the whole module exists for. `null` means nobody has
       called the judge, or the plan sends no such header; `0` would mean the
       class cannot submit anything for the rest of the window. A health view
       that rendered one as the other would either page for nothing or say
       nothing on the afternoon it mattered. */
    expect(providerQuota()).toBeNull();
  });

  it("records the three integers and nothing else", async () => {
    const { recordProviderQuota, providerQuota } = await import(
      "../../schools/ops/provider-quota"
    );
    recordProviderQuota(
      headers({
        "x-ratelimit-requests-limit": "500",
        "x-ratelimit-requests-remaining": "487",
        "x-ratelimit-requests-reset": "3600",
      }),
    );
    const quota = providerQuota();
    expect(quota?.limit).toBe(500);
    expect(quota?.remaining).toBe(487);
    expect(quota?.resetSeconds).toBe(3600);
    expect(quota?.windows).toBe(1);
  });

  it("ignores headers outside the allowlist, whatever they contain", async () => {
    const { recordProviderQuota, providerQuota } = await import(
      "../../schools/ops/provider-quota"
    );
    recordProviderQuota(
      headers({
        /* A real RapidAPI response carries the subscription, the application
           and occasionally something that identifies the account. The module
           looks up named headers rather than iterating them, so none of this
           can be recorded by accident — and a serialised quota must therefore
           be free of it. */
        "x-rapidapi-subscription": "MEGA-PLAN-42",
        "x-rapidapi-key": "should-never-be-read",
        "x-ratelimit-requests-remaining": "12",
      }),
    );
    expect(JSON.stringify(providerQuota())).not.toContain("MEGA-PLAN-42");
    expect(JSON.stringify(providerQuota())).not.toContain("should-never-be-read");
    expect(providerQuota()?.remaining).toBe(12);
  });

  it("refuses a non-integer value rather than storing a NaN", async () => {
    const { recordProviderQuota, providerQuota } = await import(
      "../../schools/ops/provider-quota"
    );
    recordProviderQuota(
      headers({
        "x-ratelimit-requests-limit": "unlimited",
        "x-ratelimit-requests-remaining": "-1",
        "x-ratelimit-requests-reset": "3600",
      }),
    );
    /* Only `reset` parsed, so only `reset` is set. A NaN would serialise as
       `null` in JSON and be indistinguishable from "never observed", which is
       the one reading this module must not produce. */
    expect(providerQuota()?.resetSeconds).toBe(3600);
    expect(providerQuota()?.limit).toBeNull();
    expect(providerQuota()?.remaining).toBeNull();
  });

  it("keeps the TIGHTEST window when a response describes more than one", async () => {
    const { recordProviderQuota, providerQuota } = await import(
      "../../schools/ops/provider-quota"
    );
    recordProviderQuota(
      headers({
        // The subscription's own quota is comfortable...
        "x-ratelimit-requests-limit": "500",
        "x-ratelimit-requests-remaining": "480",
        "x-ratelimit-requests-reset": "3600",
        // ...and the marketplace's hard ceiling is about to stop the class.
        "x-ratelimit-rapid-free-plans-hard-limit-limit": "50",
        "x-ratelimit-rapid-free-plans-hard-limit-remaining": "3",
        "x-ratelimit-rapid-free-plans-hard-limit-reset": "60",
      }),
    );
    const quota = providerQuota();
    /* Three, not 480. Two independent ceilings mean the class stops at
       whichever runs out first, and reporting the comfortable one would be
       reporting a number that is true of a window nobody is about to hit. */
    expect(quota?.remaining).toBe(3);
    expect(quota?.limit).toBe(50);
    expect(quota?.windows).toBe(2);
  });

  it("does nothing at all when there are no headers", async () => {
    const { recordProviderQuota, providerQuota } = await import(
      "../../schools/ops/provider-quota"
    );
    recordProviderQuota(null);
    recordProviderQuota(headers({}));
    expect(providerQuota()).toBeNull();
  });
});

describe("judge0 usage — the numbers that reconcile against an invoice", () => {
  beforeEach(async () => {
    const { resetCounters } = await import("../../schools/ops/counters");
    const { resetProviderQuota } = await import("../../schools/ops/provider-quota");
    resetCounters();
    resetProviderQuota();
  });

  async function values() {
    const { counterSnapshot } = await import("../../schools/ops/counters");
    return counterSnapshot().values;
  }

  it("counts every request in the total AND in exactly one breakdown", async () => {
    const { recordJudge0Request } = await import("../../schools/ops/judge0-usage");
    recordJudge0Request({ kind: "language_lookup", httpStatus: 200 });
    recordJudge0Request({ kind: "submission", httpStatus: 201 });
    recordJudge0Request({ kind: "poll", httpStatus: 200 });
    recordJudge0Request({ kind: "poll", httpStatus: 200 });

    const v = await values();
    expect(v["judge0.requests"]).toBe(4);
    expect(v["judge0.language_lookups"]).toBe(1);
    expect(v["judge0.submissions"]).toBe(1);
    expect(v["judge0.polls"]).toBe(2);
    /* The property that makes the total trustworthy: the parts sum to it. If
       these ever diverge, the billable figure has nothing checking it. */
    expect(v["judge0.language_lookups"] + v["judge0.submissions"] + v["judge0.polls"]).toBe(
      v["judge0.requests"],
    );
  });

  it("puts a 429 in its own counter and NOT in the failure counter", async () => {
    const { recordJudge0Request } = await import("../../schools/ops/judge0-usage");
    recordJudge0Request({ kind: "submission", httpStatus: 429 });

    const v = await values();
    /* Over quota is not "the judge is broken". It self-heals, and the operator
       action — wait, or buy more — is the opposite of the one for a dead judge.
       Folded together, an over-quota afternoon and an outage would be the same
       number. */
    expect(v["judge0.rate_limited"]).toBe(1);
    expect(v["judge0.failures"]).toBe(0);
    expect(v["judge0.requests"]).toBe(1);
  });

  it("counts a request that never got an answer as a failure, not as nothing", async () => {
    const { recordJudge0Request } = await import("../../schools/ops/judge0-usage");
    // Our fetch gave up: no status at all. Still a request, still billable.
    recordJudge0Request({ kind: "poll", httpStatus: null });
    recordJudge0Request({ kind: "submission", httpStatus: 503 });

    const v = await values();
    expect(v["judge0.failures"]).toBe(2);
    expect(v["judge0.requests"]).toBe(2);
    expect(v["judge0.rate_limited"]).toBe(0);
  });

  it("reads the quota off the same call, because that is the only place it exists", async () => {
    const { recordJudge0Request } = await import("../../schools/ops/judge0-usage");
    const { providerQuota } = await import("../../schools/ops/provider-quota");
    recordJudge0Request({
      kind: "submission",
      httpStatus: 201,
      headers: { get: (n) => (n.toLowerCase() === "x-ratelimit-requests-remaining" ? "9" : null) },
    });
    expect(providerQuota()?.remaining).toBe(9);
  });

  it("never throws, whatever it is handed", async () => {
    const { recordJudge0Request } = await import("../../schools/ops/judge0-usage");
    /* It runs on the path that is already failing. An accounting bug that threw
       here would turn a 429 into a 500 and take the lesson down to protect a
       counter. */
    expect(() =>
      recordJudge0Request({
        kind: "poll",
        httpStatus: 429,
        headers: {
          get() {
            throw new Error("headers exploded");
          },
        },
      }),
    ).not.toThrow();
  });
});

/* -------------------------------------------------------------------------- */

describe("trustedJudgeConfig — what the environment says, for free", () => {
  /*
   * `config` resolves `process.env` once, at import, so every case here costs a
   * module reload. That is also what makes the assertions real: the value under
   * test is built by the same code path a deployment boots through.
   */
  async function configFor(vars: Record<string, string>) {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
    const { trustedJudgeConfig } = await import("../../schools/ops/judge-probe");
    return trustedJudgeConfig();
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("calls a keyless judge0 deployment UNCONFIGURED", async () => {
    const judge = await configFor({ EXEC_PROVIDER: "judge0_rapidapi", JUDGE0_RAPIDAPI_KEY: "" });
    /*
     * This is the defect this function was written to close. The health check
     * used to compute `configured` as `provider !== "piston" || Boolean(pistonUrl)`,
     * which asked "is it a configured piston" and answered `true` for
     * everything else — so a Judge0 deployment with no key at all reported
     * itself as configured, and outside production nothing else said otherwise.
     * An admin would have seen a green light over a deployment where every
     * single Submit 401s.
     */
    expect(judge.configured).toBe(false);
    expect(judge.metered?.keyPresent).toBe(false);
  });

  it("reports a judge0 endpoint as a host, where it used to report null", async () => {
    const judge = await configFor({
      EXEC_PROVIDER: "judge0_rapidapi",
      JUDGE0_RAPIDAPI_KEY: "k",
      JUDGE0_RAPIDAPI_HOST: "judge0-ce.p.rapidapi.com",
    });
    /* The old expression read `config.exec.pistonUrl` unconditionally, so a
       correctly configured rented judge showed `endpoint: null` — which reads
       as "pointing nowhere". */
    expect(judge.endpoint).toBe("judge0-ce.p.rapidapi.com");
    expect(judge.configured).toBe(true);
    expect(judge.trusted).toBe(true);
    expect(judge.leavesProviderBoundary).toBe(true);
  });

  it("never carries the key, in any form", async () => {
    /* 64 characters, the shape of a real marketplace key, and deliberately
       sharing no substring with the HOST — a key containing "rapidapi" would
       make this test pass or fail on the hostname instead of on the key. */
    const KEY = `sekrit_${"9f3c1d7e".repeat(7)}x`;
    const judge = await configFor({
      EXEC_PROVIDER: "judge0_rapidapi",
      JUDGE0_RAPIDAPI_KEY: KEY,
    });
    const serialised = JSON.stringify(judge);
    expect(serialised).not.toContain(KEY);
    // Nor a prefix of it, which is the form that feels safe and is not.
    expect(serialised).not.toContain(KEY.slice(0, 8));
    // Nor its length, which narrows a search far more than people expect.
    expect(serialised).not.toContain(String(KEY.length));
    // The one fact that IS disclosed, and the only one anybody needs.
    expect(judge.metered?.keyPresent).toBe(true);
  });

  it("calls EXEC_PROVIDER=none configured, because it is", async () => {
    const judge = await configFor({ EXEC_PROVIDER: "none" });
    /* A supported deployment, not a broken one. The capability loss is stated
       by `hybridCheck` in words; a red light here would put a fault indicator
       on a deliberate choice, and a permanent red light is a muted one. */
    expect(judge.configured).toBe(true);
    expect(judge.trusted).toBe(false);
    expect(judge.metered).toBeNull();
  });

  it("calls a typo'd EXEC_PROVIDER unconfigured", async () => {
    const judge = await configFor({ EXEC_PROVIDER: "judge0" });
    /* `judge0` is not `judge0_rapidapi`. At runtime that falls back to the
       local subprocess provider, so the deployment silently runs learner code
       somewhere nobody chose — and the old `configured` expression called it
       true. */
    expect(judge.configured).toBe(false);
  });
});

describe("probeTrustedJudge — the paid half, which refuses to be paid for nothing", () => {
  const fetchSpy = vi.fn(() => {
    throw new Error("the probe made a network call it should not have made");
  });

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function probeWith(vars: Record<string, string>) {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
    const { probeTrustedJudge } = await import("../../schools/ops/judge-probe");
    return probeTrustedJudge();
  }

  it("calls nothing when EXEC_PROVIDER=none", async () => {
    const probe = await probeWith({ EXEC_PROVIDER: "none" });
    expect(fetchSpy).not.toHaveBeenCalled();
    /* `null`, not `false`. Nothing was attempted, so nothing is known about
       reachability — and "not set up" must not be rendered as "set up and
       broken". */
    expect(probe.reachable).toBeNull();
    expect(probe.execution).toBeNull();
    expect(probe.cost.requests).toBeNull();
  });

  it("calls nothing when judge0 has no key, rather than spending a request to be 401'd", async () => {
    const probe = await probeWith({
      EXEC_PROVIDER: "judge0_rapidapi",
      JUDGE0_RAPIDAPI_KEY: "",
    });
    /* The environment already answered. Calling anyway would put a billable
       request behind a button a monitor could learn to press. */
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(probe.reachable).toBeNull();
    expect(probe.runtimeProblem).toContain("not fully configured");
  });

  it("does not claim reachability from an operator-pinned language id", async () => {
    /*
     * `JUDGE0_LANGUAGE_ID` skips discovery, so the probe makes no call before
     * the submission. It used to report `reachable: true` for that case, which
     * was a network claim from a code path that never touched the network — and
     * it survived the submission failing, so a completely dead judge read as
     * reachable. The submission is now the only thing that answers.
     *
     * `fetch` rejects here, so nothing leaves this machine.
     */
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("no network in tests"))),
    );
    const KEY = `sekrit_${"9f3c1d7e".repeat(7)}x`;
    const probe = await probeWith({
      EXEC_PROVIDER: "judge0_rapidapi",
      JUDGE0_RAPIDAPI_KEY: KEY,
      JUDGE0_LANGUAGE_ID: "71",
    });

    expect(probe.reachable).toBe(false);
    expect(probe.runtime?.id).toBe(71);
    // Pinned, so nothing knows which interpreter that id actually is.
    expect(probe.runtime?.version).toBeNull();
    expect(probe.runtime?.operatorOverride).toBe(true);
    expect(probe.execution?.infrastructure).toBe(true);
    /* The failure sentence reaches a browser through the dev lab and an admin
       through /api/health. It carries a hand-written sentence and nothing
       derived from the request — no key, no URL, no header. */
    const serialised = JSON.stringify(probe);
    expect(serialised).not.toContain(KEY);
    expect(serialised).not.toContain("sekrit_");
    expect(serialised).not.toContain("rapidapi.com");
  });
});

describe("the dev lab's probe action", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("refuses to call anything in a production build", async () => {
    /*
     * The dev LAYOUT already 404s in production, and that is not enough. A
     * Server Action is a POST endpoint bound to an action id; it does not run
     * the layout, and Next's own guide says the route "is reachable to anyone
     * who can send the same POST". Dead-code elimination only strips UNUSED
     * server functions and this one is used by a component still in the
     * production graph — so without this guard a production deployment would
     * ship an unauthenticated trigger that spends the plan's quota.
     */
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const fetchSpy = vi.fn(() => {
      throw new Error("a production build probed the judge");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { probeJudgeAction } = await import("../../src/app/dev/execution/actions");
    const outcome = await probeJudgeAction();

    expect(outcome.kind).toBe("refused");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/* -------------------------------------------------------------------------- */

describe("the admin health report, for a rented judge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /*
   * 30 s, and not because anything here is slow to decide. `buildAdminHealth`
   * boots the whole report — an in-memory pglite store, the curriculum
   * fingerprint, the ledger queries — after a `vi.resetModules()`, which is
   * several seconds on an idle machine and more than vitest's 5 s default when
   * the rest of the suite is running beside it. Timing out on contention would
   * make this look like a defect in the health check it is asserting.
   */
  it("answers 'is it configured, and where does it point' without a shell, and without a probe", { timeout: 30_000 }, async () => {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    vi.stubEnv("EXEC_PROVIDER", "judge0_rapidapi");
    vi.stubEnv("JUDGE0_RAPIDAPI_KEY", `sekrit_${"9f3c1d7e".repeat(7)}x`);
    /* Any call at all would be a bug: this is the DEFAULT health call, the one
       a monitor makes every thirty seconds, and against a metered judge a
       default that costs a request is a default that costs a plan. */
    const fetchSpy = vi.fn(() => {
      throw new Error("the default health check made a network call");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { buildAdminHealth } = await import("../../schools/ops/health");
    const health = await buildAdminHealth();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(health.execution.detail.provider).toBe("judge0_rapidapi");
    expect(health.execution.detail.endpoint).toBe("judge0-ce.p.rapidapi.com");
    expect(health.execution.detail.configured).toBe(true);
    expect(health.execution.detail.metered).toBe(true);
    expect(health.execution.detail.keyPresent).toBe(true);
    // Not probed, so no runtime claim of any kind is made.
    expect(health.execution.probe).toBeNull();
    expect(health.execution.detail.probed).toBe(false);
    /* Null throughout rather than zero: nothing has called the judge in this
       process, so nothing has seen a quota header. Zero would read as "no
       requests left". */
    expect(health.execution.detail.quotaRemaining).toBeNull();

    // The whole payload, not just the field we happen to be looking at.
    expect(JSON.stringify(health)).not.toContain("sekrit_");
  });

  it("goes amber when somebody PROBES a judge that cannot be called", { timeout: 30_000 }, async () => {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    vi.stubEnv("EXEC_PROVIDER", "judge0_rapidapi");
    vi.stubEnv("JUDGE0_RAPIDAPI_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("probe called a judge it had no key for");
      }),
    );

    const { buildAdminHealth } = await import("../../schools/ops/health");
    const health = await buildAdminHealth({ probeExecution: true });

    /*
     * Outside production `executionProviderProblems` deliberately says nothing
     * about a half-configured judge — development runs on `local` on purpose.
     * So without a status change here, an operator who explicitly asked "is the
     * judge up?" about a keyless deployment got back a green light and no
     * sentence at all. `down` would be wrong too: nothing is broken, it was
     * never set up.
     */
    expect(health.execution.status).toBe("degraded");
    expect(health.execution.detail.probeStatus).toBe("not_attempted");
    expect(health.execution.problems.join(" ")).toContain("not fully configured");
  });

  it("says a keyless judge0 is half-configured even with no probe at all", { timeout: 30_000 }, async () => {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    vi.stubEnv("EXEC_PROVIDER", "judge0_rapidapi");
    vi.stubEnv("JUDGE0_RAPIDAPI_KEY", "");

    const { buildAdminHealth } = await import("../../schools/ops/health");
    const health = await buildAdminHealth();

    /*
     * The default health call — no probe, no cost. In production this is
     * already a boot failure, so the case that matters is a laptop or a
     * preview, where `executionProviderProblems` deliberately says nothing and
     * the report used to be entirely green over a deployment whose every Submit
     * would 401.
     */
    expect(health.execution.status).toBe("degraded");
    expect(health.execution.detail.configured).toBe(false);
    expect(health.execution.problems.join(" ")).toContain("not fully configured");
    /*
     * And the deliberate NON-change beside it. `submitProducesEvidence` is
     * derived from the trust policy, whose whole purpose is to have exactly one
     * author — the lesson routes call `trustedProviderConfigured()` too, and a
     * health view that quietly disagreed with the code that grades would be the
     * worse bug. So the boolean still reads true and the PROBLEM STRING carries
     * the truth. Fixing the boolean means fixing `trustedProviderConfigured` in
     * schools/config.ts so it looks at credentials, which is one change in one
     * place that moves both.
     */
    expect(health.hybrid.evidence.submitProducesEvidence).toBe(true);
  });

  it("stays green when EXEC_PROVIDER=none is probed, because nothing is wrong", { timeout: 30_000 }, async () => {
    vi.resetModules();
    vi.stubEnv("LEARNING_DATA_DIR", "memory://");
    vi.stubEnv("EXEC_PROVIDER", "none");

    const { buildAdminHealth } = await import("../../schools/ops/health");
    const health = await buildAdminHealth({ probeExecution: true });

    /* A supported deployment running as configured. The capability loss is
       `hybridCheck`'s to state, in words, on every call — a fault light here
       would be a permanent one, and a permanent fault light is a muted one. */
    expect(health.execution.status).toBe("ok");
    expect(health.execution.detail.probeStatus).toBe("no_judge");
    expect(health.hybrid.evidence.submitProducesEvidence).toBe(false);
  });
});
