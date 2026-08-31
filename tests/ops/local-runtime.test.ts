import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_RUNTIME_FAILURES,
  MAX_SIGNAL_BYTES,
  parseLocalRuntimeSignal,
} from "@schools/ops/runtime-signal";
import {
  handleLocalRuntimeSignal,
  localRuntimeAvailability,
  recordLocalRuntimeSignal,
  resetLocalRuntimeCeiling,
} from "@schools/ops/runtime-availability";
import { counterSnapshot, resetCounters } from "@schools/ops/counters";
import { curriculumFingerprint } from "@schools/ops/fingerprint";
import { teacherHealth, type AdminHealth, type Check } from "@schools/ops/health";

/**
 * The browser is allowed to tell us ONE thing, and this is the file that keeps
 * it to one thing.
 *
 * Local execution being private is the feature, not a concession. The whole
 * point of hybrid execution is that a learner can run their code without asking
 * anyone's permission and without anyone watching — so the observability that
 * exists alongside it has to be shaped by what an OPERATOR needs (is Python
 * coming up at all) rather than by what would be convenient to have (everything
 * else). Every test below is an attempt to get something a child typed through
 * the wire, and each one has to fail.
 */

beforeEach(() => {
  /* Both are process-global by design — see `counters.ts`. The ceiling has to
     be cleared alongside the counters or the test that deliberately exhausts it
     leaves every later test counting nothing while still answering 204. */
  resetCounters();
  resetLocalRuntimeCeiling();
});

describe("the wire contract carries an outcome and nothing else", () => {
  it("accepts the two shapes it knows", () => {
    expect(parseLocalRuntimeSignal({ outcome: "ready" })).toEqual({ outcome: "ready" });
    for (const reason of LOCAL_RUNTIME_FAILURES) {
      expect(parseLocalRuntimeSignal({ outcome: "unavailable", reason })).toEqual({
        outcome: "unavailable",
        reason,
      });
    }
  });

  it("does not carry an unrecognised field through, even beside a valid outcome", () => {
    /* The one that matters. A parser that merged the input object would let a
       stack trace, a source file or a subject id ride along beside a legitimate
       `outcome` and land in a log line that `learning_forget_user` cannot
       reach. The result is CONSTRUCTED from the two understood fields, so
       there is no path by which an extra key survives. */
    const smuggled = parseLocalRuntimeSignal({
      outcome: "ready",
      stdout: "the answer is 42",
      source: "print(secret)",
      subjectId: "sub_123",
      message: "Traceback (most recent call last): File /home/aigerim/hw.py",
    });
    expect(smuggled).toEqual({ outcome: "ready" });
    expect(Object.keys(smuggled ?? {})).toEqual(["outcome"]);
  });

  it("refuses a reason it does not know rather than counting it generically", () => {
    /* Counting an unknown string as "some failure" would let a client mint
       categories by inventing words. The producer and the closed list ship in
       the same bundle, so a mismatch is a bug or an attack — either way it is
       `signal_rejected`, which is visible, rather than a number that is quietly
       wrong. */
    expect(parseLocalRuntimeSignal({ outcome: "unavailable", reason: "wifi_died" })).toBeNull();
    expect(parseLocalRuntimeSignal({ outcome: "unavailable" })).toBeNull();
    expect(parseLocalRuntimeSignal({ outcome: "unavailable", reason: 7 })).toBeNull();
  });

  it("refuses everything that is not an object with a known outcome", () => {
    for (const bad of [null, undefined, 42, "ready", [], [{ outcome: "ready" }], {}, { outcome: "maybe" }]) {
      expect(parseLocalRuntimeSignal(bad), JSON.stringify(bad) ?? "undefined").toBeNull();
    }
  });

  it("keeps the ceiling far below anything that could hold a program", () => {
    /* 256 bytes cannot hold a traceback, a source file or a line of learner
       prose, and a valid signal is under sixty. The number is the guard, so it
       is asserted rather than left to a comment. */
    expect(MAX_SIGNAL_BYTES).toBeLessThan(512);
    const largest = JSON.stringify({ outcome: "unavailable", reason: "boot_timeout" });
    expect(new TextEncoder().encode(largest).length).toBeLessThan(MAX_SIGNAL_BYTES);
  });
});

describe("counting a boot outcome", () => {
  it("keeps the total and the breakdown in step", () => {
    recordLocalRuntimeSignal({ outcome: "ready" });
    recordLocalRuntimeSignal({ outcome: "unavailable", reason: "boot_failed" });
    recordLocalRuntimeSignal({ outcome: "unavailable", reason: "boot_failed" });
    recordLocalRuntimeSignal({ outcome: "unavailable", reason: "no_worker" });

    const a = localRuntimeAvailability();
    expect(a.ready).toBe(1);
    expect(a.unavailable).toBe(3);
    expect(a.byReason.boot_failed).toBe(2);
    expect(a.byReason.no_worker).toBe(1);
    expect(a.byReason.boot_timeout).toBe(0);
    expect(a.byReason.boot_failed + a.byReason.no_worker + a.byReason.boot_timeout).toBe(
      a.unavailable,
    );
  });

  it("reports no rate at all when nothing has been reported", () => {
    /* `null`, never 0. Nobody having opened a lesson is a different fact from
       nobody having failed, and a health field that renders the two the same
       way will be read as "fine" on the morning it is not. */
    expect(localRuntimeAvailability().unavailableRate).toBeNull();
  });

  it("refuses to call the platform broken on a handful of signals", () => {
    /* One learner with a blocked worker is a 100% failure rate. Alerting on
       that is how a field gets ignored — the same reason the reducer check
       waits for work to actually be waiting. */
    recordLocalRuntimeSignal({ outcome: "unavailable", reason: "no_worker" });
    recordLocalRuntimeSignal({ outcome: "unavailable", reason: "no_worker" });
    const a = localRuntimeAvailability();
    expect(a.unavailableRate).toBe(1);
    expect(a.broken).toBe(false);
  });

  it("calls it broken once most of a class cannot start Python", () => {
    for (let i = 0; i < 2; i++) recordLocalRuntimeSignal({ outcome: "ready" });
    for (let i = 0; i < 8; i++) {
      recordLocalRuntimeSignal({ outcome: "unavailable", reason: "boot_timeout" });
    }
    const a = localRuntimeAvailability();
    expect(a.signals).toBe(10);
    expect(a.unavailableRate).toBeCloseTo(0.8);
    expect(a.broken).toBe(true);
  });

  it("caps what one caller can do to the numbers, and says that it did", () => {
    /* The endpoint is unauthenticated on purpose, so it is spammable. The
       ceiling bounds the distortion and `dropped` admits to it: a rate read
       without that field would be an undercount nobody was told about. */
    for (let i = 0; i < 400; i++) recordLocalRuntimeSignal({ outcome: "ready" });
    const a = localRuntimeAvailability();
    expect(a.ready).toBe(240);
    expect(a.dropped).toBe(160);
  });
});

describe("the route body", () => {
  const post = (body: string, headers: Record<string, string> = {}) =>
    handleLocalRuntimeSignal(new Request("http://x/api/ops/runtime", { method: "POST", body, headers }));

  it("counts a well-formed signal and answers with nothing", async () => {
    const res = await post(JSON.stringify({ outcome: "unavailable", reason: "boot_failed" }));
    expect(res.status).toBe(204);
    expect(localRuntimeAvailability().byReason.boot_failed).toBe(1);
  });

  it("accepts a beacon that did not set a JSON content type", async () => {
    /* `navigator.sendBeacon` sends `text/plain`, and a browser reporting that
       its own runtime just died is exactly the caller that will use it.
       Refusing on the header would drop the signal that matters most and make
       the failure look, from the server, like it never happened. */
    const res = await post(JSON.stringify({ outcome: "ready" }), { "content-type": "text/plain" });
    expect(res.status).toBe(204);
    expect(localRuntimeAvailability().ready).toBe(1);
  });

  it("refuses an oversized body before parsing it", async () => {
    const res = await post(JSON.stringify({ outcome: "ready", pad: "x".repeat(1000) }));
    expect(res.status).toBe(400);
    expect(counterSnapshot().values["local_exec.signal_rejected"]).toBe(1);
    expect(localRuntimeAvailability().signals).toBe(0);
  });

  it("never echoes what it was sent", async () => {
    /* An endpoint that reflected its input would be a way to get arbitrary text
       back out of the server, and the bodies this one refuses are precisely the
       ones containing something unexpected. */
    const secret = "print(REFERENCE_SOLUTION)";
    const res = await post(JSON.stringify({ outcome: "unavailable", reason: secret }));
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain(secret);
  });

  it("counts a malformed body rather than throwing", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect(counterSnapshot().values["local_exec.signal_rejected"]).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */

/**
 * A synthetic admin report, so the teacher projection can be tested without a
 * database, a judge or a browser. Every field the projection reads is set
 * explicitly; the rest is the honest empty shape.
 */
function adminFixture(over: {
  executionStatus?: Check["status"];
  submitProducesEvidence: boolean;
  hybridStatus?: Check["status"];
}): AdminHealth {
  const empty: Check = { status: "ok", detail: {}, problems: [] };
  const fingerprint = curriculumFingerprint();
  return {
    view: "admin",
    ok: true,
    status: "ok",
    checkedAt: new Date().toISOString(),
    web: empty,
    database: empty,
    /* `judge` and `probe` are the honest empty shape for the same reason as
       everything else here: the teacher projection reads neither, and a fixture
       that invented a discovered runtime would be asserting something about a
       judge this test never called. `probe: null` is exactly what an unprobed
       health call produces. */
    execution: {
      ...empty,
      status: over.executionStatus ?? "ok",
      judge: {
        provider: "none",
        configured: true,
        endpoint: null,
        trusted: over.submitProducesEvidence,
        leavesProviderBoundary: false,
        metered: null,
      },
      probe: null,
    },
    hybrid: {
      ...empty,
      status: over.hybridStatus ?? "ok",
      evidence: {
        trustedProviderConfigured: over.submitProducesEvidence,
        submitProducesEvidence: over.submitProducesEvidence,
        surfaces: [],
      },
      localRuntime: localRuntimeAvailability(),
    },
    nova: { ...empty, spend: null },
    curriculum: { ...empty, fingerprint },
    reducer: {
      ...empty,
      reducer: {
        lastSweepAt: null,
        sweepAgeSeconds: null,
        unreducedEvents: 0,
        staleEpisodes: 0,
        staleLearnerStates: 0,
        behind: false,
        projectionBehind: false,
      },
    },
    learning: { ...empty, activity: null, assistance: null },
    counters: counterSnapshot(),
  };
}

const capability = (h: ReturnType<typeof teacherHealth>, id: string) =>
  h.capabilities.find((c) => c.id === id);

describe("what a teacher is told about a school with no judge", () => {
  it("does not claim code is being checked when nothing is checking it", () => {
    /* The defect this exists to stop. With `EXEC_PROVIDER=none` the judge is
       not down — there is no judge — and the old projection derived the message
       from the execution check alone, which is `ok` in that state. A teacher
       would have been told «Код проверяется» every day of a pilot in which
       nothing was ever checked. */
    const h = teacherHealth(adminFixture({ submitProducesEvidence: false }));
    const checking = capability(h, "code_checking");
    expect(checking?.message.ru).not.toMatch(/Код проверяется/);
    expect(checking?.message.ru).toMatch(/учитель/i);
    expect(checking?.message.kk).toMatch(/мұғалім/i);
  });

  it("does not paint that state as a fault", () => {
    /* A school running without a judge is running as configured. A permanent
       warning triangle over the normal state of affairs is a warning nobody
       reads by October — and the teacher endpoint's status drives a 503. */
    const h = teacherHealth(adminFixture({ submitProducesEvidence: false }));
    expect(capability(h, "code_checking")?.status).toBe("ok");
    expect(h.status).toBe("ok");
  });

  it("still says plainly when the judge itself is down", () => {
    const h = teacherHealth(
      adminFixture({ submitProducesEvidence: true, executionStatus: "down" }),
    );
    expect(capability(h, "code_checking")?.status).toBe("down");
    // The promise that matters to a teacher: nobody is marked wrong.
    expect(capability(h, "code_checking")?.message.ru).toMatch(/никому не ставится ошибка/i);
  });

  it("does not report a dead browser runtime as a checking failure", () => {
    /* Different failures, different afternoons. A class that cannot RUN
       anything is stuck at the first line; a class that cannot be CHECKED can
       work all lesson and be marked later. Conflating them would tell a teacher
       to wait for grades that are arriving fine.
       The gap this used to assert is closed: the teacher view now carries a
       `running_code` capability of its own, so a broken browser runtime is
       reported AS a running failure instead of not at all. What must stay true
       is the separation — `code_checking` is still green, because the judge is
       fine and today's answers will be marked. */
    const h = teacherHealth(
      adminFixture({ submitProducesEvidence: true, hybridStatus: "degraded" }),
    );
    expect(capability(h, "code_checking")?.status).toBe("ok");
    expect(capability(h, "running_code")?.status).toBe("degraded");
  });

  it("says nothing about infrastructure in either language", () => {
    /* The rule for the whole teacher view: a consequence and an action, never a
       variable name, a provider name or a hostname. */
    const h = teacherHealth(
      adminFixture({ submitProducesEvidence: false, hybridStatus: "degraded" }),
    );
    for (const c of h.capabilities) {
      for (const text of [c.message.kk, c.message.ru]) {
        expect(text).not.toMatch(/EXEC_PROVIDER|PISTON|pyodide|piston|localhost|http/i);
      }
    }
  });
});
