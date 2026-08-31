import { afterEach, describe, expect, it } from "vitest";
import {
  ApiRequestCeilingReached,
  installMeter,
  SubmissionCeilingReached,
} from "../../scripts/live/wire";
import { startFakeJudge0, type FakeJudge0 } from "../exec/judge0-fake";

/**
 * The backstop that stands between a validation run and an accidental bill.
 *
 * ## Why this exists separately from the orchestrator's estimate
 *
 * `judge0-validate.ts` refuses to START a phase whose estimated cost will not
 * fit under `--max-submissions`, and that is tested. It is not the same guard.
 * An estimate is a plan; the meter is what happens when the plan is wrong —
 * and `wire.ts` says so in its own words: "an orchestrator-only ceiling is a
 * ceiling that a provider's retry, a batch ... can walk straight through".
 *
 * Every one of those is a POST the orchestrator did not schedule: the adapter
 * retrying, a batch endpoint expanding one call into several submissions, a
 * phase somebody adds later without reading this file. The wire-level refusal
 * catches all of them because it sits in `fetch`, below everything.
 *
 * This test was written after removing the refusal and watching the whole
 * validator suite stay green — the guard was correct and unproven, which for a
 * spend limit is the same as absent. Nobody should run this tool against a real
 * plan on the strength of a ceiling nothing checks.
 */

let fake: FakeJudge0 | null = null;

afterEach(async () => {
  await fake?.close();
  fake = null;
});

const submit = (url: string) =>
  fetch(`${url}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language_id: 100, source_code: "print(1)", stdin: "" }),
  });

describe("the meter refuses a POST that would cross the ceiling", () => {
  it("lets exactly as many submissions through as it was given, and not one more", async () => {
    fake = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 3, maxApiRequests: 1_000 });
    try {
      for (let i = 0; i < 3; i += 1) {
        const res = await submit(fake.url);
        expect(res.ok, `submission ${i + 1} is within the ceiling`).toBe(true);
      }
      expect(meter.state().submissions).toBe(3);

      await expect(submit(fake.url), "the fourth must be refused").rejects.toBeInstanceOf(
        SubmissionCeilingReached,
      );
    } finally {
      meter.uninstall();
    }
  });

  it("refuses BEFORE the network, so the refusal costs nothing", async () => {
    /* The distinction the whole guard rests on. A ceiling enforced by reading
       the response has already been billed for; this one has to stop the
       request from leaving. Proven from the judge's side: the fake records
       every request it receives, and the refused one must not be among them. */
    fake = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 1, maxApiRequests: 1_000 });
    try {
      await submit(fake.url);
      const afterFirst = fake.requests.filter((r) => r.method === "POST").length;
      expect(afterFirst).toBe(1);

      await expect(submit(fake.url)).rejects.toBeInstanceOf(SubmissionCeilingReached);

      expect(
        fake.requests.filter((r) => r.method === "POST").length,
        "a refused submission must never reach the judge",
      ).toBe(afterFirst);
      expect(meter.state().ceilingRefusals).toBe(1);
      expect(meter.state().submissions, "and must not be counted as spent").toBe(1);
    } finally {
      meter.uninstall();
    }
  });

  it("refuses a submission the orchestrator never scheduled", async () => {
    /* The case the estimate cannot see, and the reason this guard is not
       redundant: a POST issued by code that has not heard of the budget — a
       retry inside the adapter, a phase added next year. It is stopped because
       the meter lives in `fetch`, not in the planner. */
    fake = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 0, maxApiRequests: 1_000 });
    try {
      await expect(submit(fake.url)).rejects.toBeInstanceOf(SubmissionCeilingReached);
      expect(fake.requests.filter((r) => r.method === "POST")).toHaveLength(0);
    } finally {
      meter.uninstall();
    }
  });

  it("does not bill polling GETs against the submission ceiling", async () => {
    /* Submissions and API requests are different currencies — the user asked
       for them separately, and a ceiling that counted polls would refuse to
       finish a submission it had already paid for. */
    fake = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 1, maxApiRequests: 1_000 });
    try {
      const res = await submit(fake.url);
      const { token } = (await res.json()) as { token: string };
      for (let i = 0; i < 4; i += 1) {
        await fetch(`${fake.url}/submissions/${token}?base64_encoded=false`);
      }
      const state = meter.state();
      expect(state.submissions, "four polls are still one submission").toBe(1);
      expect(state.apiRequests, "but they are five API requests").toBe(5);
    } finally {
      meter.uninstall();
    }
  });

  it("leaves traffic to anywhere else alone", async () => {
    /* The meter patches the global `fetch`. If it counted or refused requests
       to other hosts it would be metering the app, not the judge. */
    fake = await startFakeJudge0();
    const other = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 0, maxApiRequests: 1_000 });
    try {
      const res = await submit(other.url);
      expect(res.ok, "a different origin is none of the meter's business").toBe(true);
      expect(meter.state().submissions).toBe(0);
      expect(meter.state().ceilingRefusals).toBe(0);
    } finally {
      meter.uninstall();
      await other.close();
    }
  });
});

describe("the ceiling on the unit RapidAPI actually meters", () => {
  /**
   * Raised by an adversarial review, and it was right: the only spend ceiling
   * bounded **submissions**, and the marketplace bills **requests**.
   *
   * One submission is a POST plus however many polls it takes to reach a
   * terminal state — up to about twenty for a program that runs its whole CPU
   * budget. So `--max-submissions=25` bounded spend at twenty-five submissions
   * and at something like five hundred billable calls, against a plan whose
   * limit is expressed in requests and is UNKNOWN until someone reads it. The
   * pre-flight estimate printed only the submission figure, so an operator
   * could not see what they were about to spend.
   */
  it("refuses a poll once the request ceiling is reached, though submissions remain", async () => {
    fake = await startFakeJudge0();
    /* Room for plenty of submissions, but only three requests. The point is
       that the submission budget is nowhere near exhausted — the old ceiling
       would have waved every one of these through. */
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 50, maxApiRequests: 3 });
    try {
      const res = await submit(fake.url);
      const { token } = (await res.json()) as { token: string };
      await fetch(`${fake.url}/submissions/${token}?base64_encoded=false`);
      await fetch(`${fake.url}/submissions/${token}?base64_encoded=false`);
      expect(meter.state().apiRequests).toBe(3);

      await expect(
        fetch(`${fake.url}/submissions/${token}?base64_encoded=false`),
        "a poll is billable and must be refused like anything else",
      ).rejects.toBeInstanceOf(ApiRequestCeilingReached);

      expect(meter.state().submissions, "and submissions were never the binding limit").toBe(1);
    } finally {
      meter.uninstall();
    }
  });

  it("refuses before the network here too", async () => {
    fake = await startFakeJudge0();
    const meter = installMeter({ baseUrl: fake.url, maxSubmissions: 50, maxApiRequests: 0 });
    try {
      await expect(submit(fake.url)).rejects.toBeInstanceOf(ApiRequestCeilingReached);
      expect(fake.requests, "nothing may reach the judge").toHaveLength(0);
      expect(meter.state().apiRequests).toBe(0);
    } finally {
      meter.uninstall();
    }
  });
});
