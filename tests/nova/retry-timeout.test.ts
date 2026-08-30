import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { guardedStream } from "@schools/nova/guard";
import type { ValidationContext } from "@schools/nova/validate";
import type { GrantDecision } from "@solvex/nova-core";

/**
 * The retry has to be able to answer.
 *
 * ## The bug this is about
 *
 * `/api/nova/hint` makes at most two attempts. The second runs only when the
 * output validator rejected the first BEFORE a single token reached the
 * learner — there is nothing to retry into once they have seen half a reply.
 *
 * The route used to build cancellation once, above both attempts:
 *
 *     const timeout = AbortSignal.timeout(config.nova.requestTimeoutMs);
 *     const abort   = new AbortController();
 *     const signal  = AbortSignal.any([request.signal, timeout, abort.signal]);
 *
 * and hand that same `signal` to each. The validator stops a bad first attempt
 * by calling `abort.abort()`. `AbortSignal.any` is aborted forever the moment
 * any of its inputs is. So the retry — the entire recovery path — was handed a
 * signal that had already fired and could not emit one token.
 *
 * The learner saw an empty reply and an `error` frame reading
 * `kind: "timeout"`, about a second after asking and nowhere near the 30 s that
 * name implies. Measured against the real provider before the fix: 1 of 9
 * Kazakh requests took that path and returned nothing. That is the
 * validator-rejection rate, and every rejection was unrecoverable.
 *
 * ## What is asserted here
 *
 * The real `guardedStream` and the real validator, driving the same two-attempt
 * orchestration the route performs, under both signal shapes. The first case
 * reproduces the defect; the second is the fix. Neither mocks the thing under
 * test — the abort semantics ARE the thing under test.
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

const CTX: ValidationContext = { grant: GRANT, directive: null };

/** Trips `INTERNAL_POLICY_LEAK` on the first chunk, so nothing is ever released. */
const POISONED_FIRST_ATTEMPT = "REDUCE_ASSISTANCE: жауапты бер";
const CLEAN_RETRY = "Тырнақшаның ішінде не тұрғанына қара. Сол жерде не жазылған?";

/**
 * A provider that refuses to produce anything once its signal has fired, which
 * is what a real `fetch`-backed provider does.
 */
function providerYielding(text: string, signal: AbortSignal) {
  return {
    sawAbortedSignal: () => signal.aborted,
    stream: (async function* () {
      if (signal.aborted) return; // exactly what an aborted fetch gives you
      for (const piece of text.split(" ")) {
        if (signal.aborted) return;
        yield piece + " ";
      }
    })(),
  };
}

/** The route's orchestration, parameterised by how cancellation is composed. */
async function runTwoAttempts(perAttemptSignals: boolean) {
  const request = new AbortController();

  // Shared shape: one controller and one composed signal for both attempts.
  const sharedAbort = new AbortController();
  const sharedSignal = AbortSignal.any([request.signal, sharedAbort.signal]);

  // Per-attempt shape: an overall cap that spans attempts, fresh parts inside.
  const overall = AbortSignal.timeout(30_000);

  const seen: { attempt: number; abortedAtStart: boolean }[] = [];
  let released = "";

  const attempt = async (n: number, text: string) => {
    const abort = perAttemptSignals ? new AbortController() : sharedAbort;
    const signal = perAttemptSignals
      ? AbortSignal.any([request.signal, overall, AbortSignal.timeout(30_000), abort.signal])
      : sharedSignal;

    const p = providerYielding(text, signal);
    seen.push({ attempt: n, abortedAtStart: p.sawAbortedSignal() });

    const stream = guardedStream(p.stream, CTX, () => abort.abort());
    let out = await stream.next();
    while (!out.done) {
      released += out.value;
      out = await stream.next();
    }
    return out.value;
  };

  let outcome = await attempt(1, POISONED_FIRST_ATTEMPT);
  if (outcome.violations.length > 0 && outcome.released.length === 0) {
    outcome = await attempt(2, CLEAN_RETRY);
  }
  return { outcome, seen, released };
}

describe("the validator-triggered retry", () => {
  it("reproduces the defect: one shared signal leaves attempt 2 born aborted", async () => {
    const { outcome, seen, released } = await runTwoAttempts(false);

    expect(seen, "both attempts must have run").toHaveLength(2);
    expect(seen[0].abortedAtStart, "attempt 1 starts live").toBe(false);
    expect(
      seen[1].abortedAtStart,
      "attempt 2 inherits the abort the validator fired at attempt 1",
    ).toBe(true);

    /* And the learner gets nothing at all — which is worse than it sounds.
       The dead attempt yields no chunks, so the validator judges an empty
       string, returns early with NO violations, and the route's
       `if (outcome.violations.length > 0)` fallback — the branch that exists to
       say something kind when nothing usable came back twice — never fires
       either. Empty text, empty violations, no fallback: exactly the empty
       reply observed against the real provider. */
    expect(released, "no token reaches the learner").toBe("");
    expect(outcome.released, "and the outcome carries nothing").toBe("");
    expect(
      outcome.violations,
      "and not even a violation, so the fallback message never fires",
    ).toEqual([]);
  });

  it("with a fresh signal per attempt, the retry runs and the learner is answered", async () => {
    const { outcome, seen, released } = await runTwoAttempts(true);

    expect(seen).toHaveLength(2);
    expect(seen[0].abortedAtStart).toBe(false);
    expect(
      seen[1].abortedAtStart,
      "attempt 2 must get a signal of its own, not attempt 1's corpse",
    ).toBe(false);

    expect(outcome.violations, "the clean retry passes the validator").toEqual([]);
    expect(released.trim()).toBe(CLEAN_RETRY);
  });
});

describe("the route builds cancellation per attempt", () => {
  /**
   * A source assertion, deliberately, and narrow.
   *
   * The behavioural pair above proves which shape works. This proves the route
   * is written in that shape — the two together are the guarantee, because a
   * behavioural test of the composition cannot see where the route puts it, and
   * this cannot see whether it works. The regression that happened was
   * precisely a construction sitting one scope too high.
   */
  const src = readFileSync(
    path.join(process.cwd(), "src/app/api/nova/hint/route.ts"),
    "utf8",
  );

  it("constructs the timeout and the controller inside attempt(), not above it", () => {
    const attemptAt = src.indexOf("const attempt = async (ctx: ValidationContext)");
    expect(attemptAt, "attempt() should still exist").toBeGreaterThan(-1);

    const timeoutAt = src.indexOf("const timeout = AbortSignal.timeout(config.nova.requestTimeoutMs)");
    const controllerAt = src.indexOf("const abort = new AbortController()");
    const composedAt = src.indexOf("const signal = AbortSignal.any(");

    for (const [name, at] of [
      ["the per-attempt timeout", timeoutAt],
      ["the per-attempt AbortController", controllerAt],
      ["the composed signal", composedAt],
    ] as const) {
      expect(at, `${name} should exist`).toBeGreaterThan(-1);
      expect(at, `${name} must be built INSIDE attempt(), not once above it`).toBeGreaterThan(
        attemptAt,
      );
    }
  });

  it("still caps the total across attempts, so two attempts cannot run to twice the timeout", () => {
    expect(src).toContain("const overall = AbortSignal.timeout(config.nova.requestTimeoutMs * NOVA_MAX_ATTEMPTS)");
    expect(src, "the overall cap must be part of every attempt's signal").toMatch(
      /AbortSignal\.any\(\[\s*request\.signal,\s*overall,/,
    );
  });
});
