import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  Judge0RapidApiProvider,
  judge0GateSnapshot,
  resetJudge0GateForTests,
} from "@schools/exec/providers/judge0";
import { runCases } from "@schools/exec";
import { startFakeJudge0, type FakeJudge0 } from "./judge0-fake";

/**
 * One learner cannot take the judge away from the class.
 *
 * ## The defect
 *
 * The concurrency gate was pure FIFO with two slots and no idea who was
 * queueing. A browser loop posting submissions held both slots five to seven
 * seconds at a time, and every classmate behind it waited out the queue and was
 * told the judge was unavailable — an outage produced by one person, and
 * indistinguishable, from the other twenty-nine desks, from the judge being
 * down. Nothing in the suite could see it: every verdict in every existing test
 * is still correct when the gate is unfair, because unfairness is a property of
 * WHO waits, and no test had two whos.
 *
 * ## What is asserted
 *
 * Two things, and they are different claims:
 *
 *   1. **The per-learner bound holds.** Peak in-flight submissions for any one
 *      fairness key never exceeds `maxConcurrentPerLearner`. Measured at the
 *      fake judge, which is the only place "in flight" is observable — a POST
 *      that has been received and not yet answered terminally.
 *
 *   2. **A learner behind a monopolist is still served promptly.** The victim
 *      queues LAST, after every one of the monopolist's requests, and still
 *      finishes early — because the monopolist can only ever hold one slot and
 *      the second one has to go to somebody else.
 *
 * The second is the one that fails on the old implementation: FIFO serves the
 * victim last, which is 30 seconds of queue in production and a timeout.
 */

let fake: FakeJudge0 | null = null;

beforeEach(() => resetJudge0GateForTests());
afterEach(async () => {
  await fake?.close();
  fake = null;
});

const CANARY = '#include <iostream>\nint main() { std::cout << 1 << "\\n"; }\n';

function provider(baseUrl: string, over: Record<string, unknown> = {}) {
  return new Judge0RapidApiProvider({
    apiKey: "SECRET-KEY-DO-NOT-LEAK",
    host: "judge0-ce.p.rapidapi.com",
    baseUrl,
    maxConcurrentRequests: 2,
    maxConcurrentPerLearner: 1,
    pollIntervalMs: 2,
    queueWaitMs: 10_000,
    overheadBudgetMs: 5_000,
    /* One case per `runCases`, un-batched, so a "submission in flight" and "a
       learner's Check in flight" are the same thing and the count below is
       unambiguous. */
    batchEnabled: false,
    ...over,
  });
}

describe("the judge's queue is fair between learners", () => {
  it("never lets one learner hold more slots than the per-learner bound", async () => {
    fake = await startFakeJudge0({ pendingRounds: 2 });

    /* Sampled at the fake, on every POST and every poll: at that instant the
       gate's `held` map IS the set of submissions in flight, because a slot is
       taken before the POST and given back after the terminal GET. Reading the
       gate rather than counting requests avoids having to reconstruct which
       token belongs to whom — the fake mints tokens in its response, which a
       request handler cannot see. */
    const peak = new Map<string, number>();
    const sample = () => {
      const snap = judge0GateSnapshot();
      if (!snap) return;
      for (const [who, n] of Object.entries(snap.held)) {
        peak.set(who, Math.max(peak.get(who) ?? 0, n));
      }
    };
    fake.setHandler(() => {
      sample();
      return { kind: "default" };
    });

    const p = provider(fake.url);
    const work: Promise<unknown>[] = [];
    for (const who of ["A", "B"]) {
      for (let i = 0; i < 6; i += 1) {
        work.push(
          runCases(p, CANARY, [{ input: `${who}:${i}`, expectedOutput: "1" }], undefined, {
            fairnessKey: who,
          }),
        );
      }
    }
    await Promise.all(work);

    expect(peak.size, "the sampler never observed a held slot at all").toBeGreaterThan(0);
    expect(peak.get("A") ?? 0, "learner A held more slots than the bound allows").toBeLessThanOrEqual(1);
    expect(peak.get("B") ?? 0, "learner B held more slots than the bound allows").toBeLessThanOrEqual(1);
    /* And the global bound still holds — fairness must not have widened it. */
    const after = judge0GateSnapshot();
    expect(after?.active ?? 0, "slots leaked: the gate did not drain").toBe(0);
    expect(Object.keys(after?.held ?? {}), "per-key holdings leaked").toEqual([]);
  });

  it("serves a learner who queued behind a monopolist", async () => {
    fake = await startFakeJudge0({ pendingRounds: 3 });

    const finished: string[] = [];
    const p = provider(fake.url);

    /* Order matters and is the whole test. The monopolist's six Checks are
       launched FIRST, so under the old pure-FIFO gate the victim is seventh in
       line and cannot start until five of them have finished. Fair queueing
       admits it into the second slot as soon as one frees, because the
       monopolist is not allowed to take that slot. */
    const work: Promise<unknown>[] = [];
    for (let i = 0; i < 6; i += 1) {
      work.push(
        runCases(p, CANARY, [{ input: `hog:${i}`, expectedOutput: "1" }], undefined, {
          fairnessKey: "hog",
        }).then(() => void finished.push("hog")),
      );
    }
    work.push(
      runCases(p, CANARY, [{ input: "victim:0", expectedOutput: "1" }], undefined, {
        fairnessKey: "victim",
      }).then(() => void finished.push("victim")),
    );

    await Promise.all(work);

    const place = finished.indexOf("victim");
    expect(place, "the victim's Check never completed").toBeGreaterThanOrEqual(0);
    /* Third or better. Two slots, one of which the monopolist may hold: the
       victim is admitted on the first release and finishes among the earliest.
       Under FIFO it lands seventh, which is the failing state this pins. */
    expect(
      place,
      `the victim finished ${place + 1} of 7 — a learner behind a loop is being starved`,
    ).toBeLessThanOrEqual(2);
  });

  it("still admits a request that has no learner to be fair about", async () => {
    /* A health probe, an operator script, the content-certification harness:
       none of them has a subject id, and a fairness rule about learners must
       not quietly hold them behind one. */
    fake = await startFakeJudge0({ pendingRounds: 0 });
    const p = provider(fake.url, { maxConcurrentPerLearner: 1 });
    const results = await Promise.all([
      runCases(p, CANARY, [{ input: "1", expectedOutput: "1" }]),
      runCases(p, CANARY, [{ input: "2", expectedOutput: "1" }]),
      runCases(p, CANARY, [{ input: "3", expectedOutput: "1" }]),
    ]);
    for (const r of results) expect(r.infrastructureFailed).toBe(false);
  });
});

describe("a class of thirty pressing Check together", () => {
  /**
   * The arithmetic that put a fixed fraction of every class on "the judge was
   * too busy to take this in time".
   *
   * Served inside the queue wait is `limit × ⌊queueWait / batchTime⌋`. At the
   * shipped `limit: 2`, a 30 s wait and the measured 2.7 s batch, one instance
   * serves 22 of 30 — the other 8 get an infrastructure failure that says
   * nothing about them and everything about our configuration. The failure is
   * indistinguishable, from the learner's side, from the judge being down.
   *
   * This drives the real `runCases` path against the fake at a batch latency
   * set to the production measurement (`POST_CUTOVER_POLISH_REPORT.md`: an
   * 8-case block, batched, 2.7 s end to end), scaled down by a constant so the
   * suite stays fast. What is held constant is the RATIO that decides the
   * outcome — queue wait over batch time — because that ratio, and not the
   * absolute numbers, is what the arithmetic turns on.
   */
  const CLASS_SIZE = 30;
  /** Cases in September's largest ordinary coding block. One batch, one Check. */
  const CASES = 8;
  /* Production: 2 700 ms batch inside a 38 000 ms queue wait — a ratio of ~14.
     Here: 60 ms inside 840 ms. Same ratio, a fortieth of the wall clock.
     Deliberately not smaller than that: a full-suite run saturates the machine,
     and at 27 ms a few milliseconds of scheduler jitter is ten per cent of the
     budget. What decides the outcome is the ratio, and the ratio is exact. */
  const BATCH_MS = 60;
  const QUEUE_WAIT_MS = 840;

  it("serves every learner, and tells none of them the judge was unavailable", async () => {
    fake = await startFakeJudge0({ pendingRounds: 0 });
    fake.setHandler(() => {
      /* The judge takes real time. `pendingRounds: 0` answers the first poll
         terminally, so the latency has to be introduced here or the batch is
         instantaneous and the test measures nothing. */
      return { kind: "delay", ms: BATCH_MS };
    });

    const p = provider(fake.url, {
      maxConcurrentRequests: 6,
      maxConcurrentPerLearner: 1,
      queueWaitMs: QUEUE_WAIT_MS,
      batchEnabled: true,
      overheadBudgetMs: 5_000,
    });

    const cases = Array.from({ length: CASES }, (_, i) => ({
      input: String(i),
      expectedOutput: "1",
    }));

    const started = Date.now();
    const results = await Promise.all(
      Array.from({ length: CLASS_SIZE }, (_, learner) =>
        runCases(p, CANARY, cases, undefined, { fairnessKey: `learner-${learner}` }),
      ),
    );
    const elapsed = Date.now() - started;

    const unmeasured = results.filter((r) => r.infrastructureFailed).length;
    expect(
      unmeasured,
      `${unmeasured} of ${CLASS_SIZE} learners were told the judge was unavailable — ` +
        "by our own queue arithmetic, not by the judge",
    ).toBe(0);

    /* Reported rather than asserted on a tight bound: `unmeasured === 0` above
       already implies the class drained inside the window, and a second
       assertion on wall-clock would only add a way for a busy CI machine to go
       red about something it is not measuring. At six slots and a 60 ms batch,
       thirty learners is five waves — about 300 ms of a 840 ms budget. */
    expect(elapsed, "the class must drain inside the queue wait").toBeLessThan(
      QUEUE_WAIT_MS + BATCH_MS * 2,
    );
  });
});
