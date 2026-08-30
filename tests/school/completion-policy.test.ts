import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore, type LearningEventRow } from "@schools/store/learning-store";
import { completionTarget } from "@schools/policies/lookup";
import {
  ASSESSMENT_COMPLETION_POLICY,
  ATTEMPT_LEVELS,
  COMPLETION_POLICIES,
  LESSON_COMPLETION_POLICY,
  evaluateCompletion,
  levelFromEvidence,
  levelFromVerdict,
  meets,
  policyBlocksFromAuthored,
  policyBlocksFromPublic,
  requirementFor,
  type AttemptLevel,
  type CompletionPolicy,
  type PolicyBlock,
} from "@schools/policies/completion";
import { publicBlock } from "@schools/curriculum/public";
import { MONTHS } from "@schools/curriculum/months";

/**
 * The completion policy.
 *
 * ## What was wrong, and it was not that the rule was wrong
 *
 * A lesson completed when the learner reached the last block. That rule lived
 * in the shape of `advance()` in `school-lesson.tsx` and nowhere else: not
 * written down, not checkable, and not applied at all to a `POST` that did not
 * come from the player. The audit named it (`SEPTEMBER_REMEDIATION_REPORT.md`
 * §7, P1-10) — completion is "attempted all", not "passed a bar", and which of
 * those a school wants is the school's decision, not a React callback's.
 *
 * So the rule is data plus one pure function, and this suite is what stops it
 * quietly becoming something else. The two assertions that matter most:
 *
 *   1. **A learner who gets everything wrong still finishes the lesson.** If
 *      that ever fails, the product has started locking a struggling
 *      fourteen-year-old out of the next lesson using the one they most needed.
 *   2. **The server refuses a completion the ledger does not support.** If that
 *      ever fails, a school's record is back to being whatever a browser said.
 */

/* -------------------------------------------------------------------------- */
/* The ladder                                                                 */
/* -------------------------------------------------------------------------- */

describe("the attempt ladder", () => {
  it("is totally ordered, so a requirement is a rung and not a truth table", () => {
    for (const [i, lower] of ATTEMPT_LEVELS.entries()) {
      for (const higher of ATTEMPT_LEVELS.slice(i)) {
        expect(meets(higher, lower), `${higher} should meet ${lower}`).toBe(true);
      }
      for (const lowerStill of ATTEMPT_LEVELS.slice(0, i)) {
        expect(meets(lowerStill, lower), `${lowerStill} should not meet ${lower}`).toBe(false);
      }
    }
  });

  it("maps an ungraded answer to `answered` and never to `measured`", () => {
    /* The load-bearing line of the whole module. `unmeasured` is what an
       explanation, an unlisted test case and a code task with no judge settle
       as. Calling that "measured" would let the monthly check record itself
       complete over four blocks nobody graded, which is precisely the state the
       audit found the September assessment shipping in. */
    expect(levelFromVerdict("unmeasured")).toBe("answered");
    expect(levelFromVerdict("wrong")).toBe("measured");
    expect(levelFromVerdict("partial")).toBe("measured");
    expect(levelFromVerdict("correct")).toBe("passed");
    expect(levelFromVerdict("unchecked")).toBe("none");
  });

  it("reads the same rungs out of the ledger as out of the screen", () => {
    /* The client maps a verdict; the server maps event counts. They must agree
       or the footer and the record disagree about the same lesson. */
    expect(levelFromEvidence({ submissions: 0, verdicts: 0, accepted: false })).toBe("none");
    expect(levelFromEvidence({ submissions: 1, verdicts: 0, accepted: false })).toBe("answered");
    expect(levelFromEvidence({ submissions: 1, verdicts: 1, accepted: false })).toBe("measured");
    expect(levelFromEvidence({ submissions: 1, verdicts: 3, accepted: true })).toBe("passed");
  });
});

/* -------------------------------------------------------------------------- */
/* The two shipped policies, over real September content                      */
/* -------------------------------------------------------------------------- */

/** Evidence builder: everything at one rung unless named otherwise. */
function reached(
  blocks: readonly PolicyBlock[],
  base: AttemptLevel,
  overrides: Record<string, AttemptLevel> = {},
): (id: string) => AttemptLevel {
  const map = new Map<string, AttemptLevel>(blocks.map((b) => [b.id, base]));
  for (const [id, level] of Object.entries(overrides)) map.set(id, level);
  return (id) => map.get(id) ?? "none";
}

function decide(
  policy: CompletionPolicy,
  blocks: readonly PolicyBlock[],
  base: AttemptLevel,
  overrides: Record<string, AttemptLevel> = {},
) {
  return evaluateCompletion({ policy, blocks, reached: reached(blocks, base, overrides) });
}

describe("a lesson — `lesson.v1`", () => {
  const target = completionTarget("m1.l1", "core")!;

  it("resolves real content, so this suite is scanning something", () => {
    expect(target.kind).toBe("lesson");
    expect(target.policy).toBe(LESSON_COMPLETION_POLICY);
    expect(target.blocks.filter((b) => b.isAttempt).length).toBeGreaterThan(1);
  });

  it("is SATISFIED when every attempt block was attempted", () => {
    const decision = decide(LESSON_COMPLETION_POLICY, target.blocks, "attempted");
    expect(decision.satisfied).toBe(true);
    expect(decision.outstanding).toEqual([]);
    expect(decision.met).toBe(decision.governed);
  });

  it("is UNSATISFIED when one task was never opened, and names it", () => {
    const skipped = target.blocks.find((b) => b.isAttempt)!;
    const decision = decide(LESSON_COMPLETION_POLICY, target.blocks, "attempted", {
      [skipped.id]: "none",
    });
    expect(decision.satisfied).toBe(false);
    expect(decision.outstanding.map((o) => o.blockId)).toEqual([skipped.id]);
    expect(decision.outstanding[0]).toMatchObject({ required: "attempted", reached: "none" });
  });

  it("COMPLETES when every answer was wrong", () => {
    /* The assertion this whole module exists to protect.
     *
     * Ordinary practice mistakes must not block completion. A learner who
     * attempts all five tasks and gets all five wrong has done the lesson —
     * they have done the work, and the work is where the learning is. Gating on
     * correctness would lock a struggling child out of the next lesson using
     * the one they most needed, and the programme's own reveal policy assumes
     * they will fail repeatedly on the way («шешім идеясы бірнеше әрекеттен соң
     * ғана ашылады»). What they got right is in `learning_events` in full,
     * where a teacher can read it. It does not belong in a gate. */
    const decision = decide(LESSON_COMPLETION_POLICY, target.blocks, "measured");
    expect(decision.satisfied).toBe(true);

    /* And nothing anywhere in either shipped policy demands `passed`. */
    for (const policy of Object.values(COMPLETION_POLICIES)) {
      expect(policy.attemptFloor).not.toBe("passed");
      expect(policy.gradedFloor).not.toBe("passed");
      expect(Object.values(policy.mandatoryByType)).not.toContain("passed");
    }
  });

  it("still completes when the judge was down and a code task went ungraded", () => {
    /* `unmeasured` on a lesson is an outage, not a refusal to work. The lesson
       rule tolerates it deliberately; the assessment rule below does not, and
       the difference is the point of having two. */
    const code = target.blocks.find((b) => b.type === "write_code")!;
    const decision = decide(LESSON_COMPLETION_POLICY, target.blocks, "measured", {
      [code.id]: "answered",
    });
    expect(decision.satisfied).toBe(true);
  });

  it("holds a `verify` block to its own requirement whatever the allowance says", () => {
    /* The programme's five independence checks (PDF p.6) are not ordinary
       practice. A generous school setting `allowance: 3` must not thereby make
       the independence check optional — that is what `mandatoryByType` is for,
       and it is the difference between a knob and a hole. */
    const generous: CompletionPolicy = { ...LESSON_COMPLETION_POLICY, allowance: 3 };
    const blocks: PolicyBlock[] = [
      { id: "x1", type: "prediction", machineGradable: true, isAttempt: true },
      { id: "x2", type: "prediction", machineGradable: true, isAttempt: true },
      {
        id: "v1",
        type: "verify",
        mode: "oral_explanation",
        machineGradable: false,
        isAttempt: true,
      },
    ];

    const decision = evaluateCompletion({
      policy: generous,
      blocks,
      reached: () => "none",
    });

    expect(decision.satisfied).toBe(false);
    /* The two predictions are forgiven; the independence check is not. */
    expect(decision.waived.map((w) => w.blockId).sort()).toEqual(["x1", "x2"]);
    expect(decision.outstanding.map((o) => o.blockId)).toEqual(["v1"]);
    expect(decision.outstanding[0].mandatory).toBe(true);
  });

  it("spends an allowance on the smallest gaps first", () => {
    /* "Complete at 90%" means the learner nearly finished, not that one
       untouched task may be swapped for one that is a rung short. */
    const generous: CompletionPolicy = { ...LESSON_COMPLETION_POLICY, allowance: 1 };
    const blocks: PolicyBlock[] = [
      { id: "untouched", type: "prediction", machineGradable: true, isAttempt: true },
      { id: "nearly", type: "prediction", machineGradable: true, isAttempt: true },
    ];
    const decision = evaluateCompletion({
      policy: { ...generous, attemptFloor: "measured", gradedFloor: "measured" },
      blocks,
      reached: (id) => (id === "nearly" ? "answered" : "none"),
    });
    expect(decision.waived.map((w) => w.blockId)).toEqual(["nearly"]);
    expect(decision.outstanding.map((o) => o.blockId)).toEqual(["untouched"]);
  });
});

describe("the monthly check — `assessment.v1` is stricter, and stricter on purpose", () => {
  const target = completionTarget("m1.assessment", "core")!;

  it("uses the assessment policy, not the lesson one", () => {
    expect(target.kind).toBe("assessment");
    expect(target.policy).toBe(ASSESSMENT_COMPLETION_POLICY);
  });

  it("requires a VERDICT on the blocks a machine can grade", () => {
    /* September's check is four `verify` blocks: two carry test cases, two are
       the written and oral explanations. The two coding ones must actually have
       been run.

       The cost is stated plainly in the policy's own comment: if the judge is
       unreachable during a monthly check, the learner's work is all recorded
       and the CHECK does not record as complete. That is the intended trade.
       The audit's worst finding about this assessment was that every block
       settled `unknown` and it "produced no evidence at all" — a completed
       monthly check with nothing behind it is a lie in a school's record; an
       incomplete one is an outage. */
    const graded = target.blocks.filter((b) => b.machineGradable);
    expect(graded.length).toBeGreaterThan(0);
    for (const block of graded) {
      expect(requirementFor(ASSESSMENT_COMPLETION_POLICY, block)).toBe("measured");
    }
  });

  it("requires the written and oral halves to carry the learner's own words", () => {
    const human = target.blocks.filter((b) => b.isAttempt && !b.machineGradable);
    /* `m1.as.b3` is the written explanation the PDF's four reasoning points ask
       for; `m1.as.b4` is the p.6 oral check. Neither is ever `measured`: no
       machine scores them and demanding it would make the check impossible. */
    expect(human.length).toBe(2);
    for (const block of human) {
      expect(requirementFor(ASSESSMENT_COMPLETION_POLICY, block)).toBe("answered");
    }
  });

  it("REFUSES the evidence that would finish a lesson", () => {
    /* The same learner state — everything submitted, nothing graded — passes
       `lesson.v1` and fails `assessment.v1`. That divergence IS the stricter
       rule, expressed entirely in data. */
    const asLesson = decide(LESSON_COMPLETION_POLICY, target.blocks, "answered");
    const asCheck = decide(ASSESSMENT_COMPLETION_POLICY, target.blocks, "answered");

    expect(asLesson.satisfied).toBe(true);
    expect(asCheck.satisfied).toBe(false);
    expect(asCheck.outstanding.map((o) => o.blockId).sort()).toEqual(["m1.as.b1", "m1.as.b2"]);
    for (const row of asCheck.outstanding) {
      expect(row).toMatchObject({ required: "measured", reached: "answered" });
    }
  });

  it("is satisfied once the coding blocks have been graded — right or wrong", () => {
    /* Stricter about being MEASURED, never about being correct. A learner who
       submits both coding blocks and fails both has sat the check. */
    const decision = decide(ASSESSMENT_COMPLETION_POLICY, target.blocks, "answered", {
      "m1.as.b1": "measured",
      "m1.as.b2": "measured",
    });
    expect(decision.satisfied).toBe(true);
  });

  it("is unsatisfied when the oral check was left blank", () => {
    const decision = decide(ASSESSMENT_COMPLETION_POLICY, target.blocks, "measured", {
      "m1.as.b4": "none",
    });
    expect(decision.satisfied).toBe(false);
    expect(decision.outstanding.map((o) => o.blockId)).toEqual(["m1.as.b4"]);
  });
});

/* -------------------------------------------------------------------------- */
/* The two adapters must agree                                                */
/* -------------------------------------------------------------------------- */

describe("the browser and the server see the same blocks", () => {
  it("derives identical policy blocks from the authored and the public payload", () => {
    /* The client evaluates the policy from `PublicBlock` and the server from
       `LessonBlock`. If the two adapters disagreed about `machineGradable`, the
       footer would offer Finish on a check the server then refuses — a dead end
       with no explanation. `visibleCases.length + hiddenCaseCount` is exactly
       what `splitCases` partitions, which is why the browser can reach the same
       answer without ever seeing a hidden case. */
    let compared = 0;
    for (const month of MONTHS) {
      const groups = [
        ...month.units.flatMap((u) => u.lessons.map((l) => l.blocks)),
        ...(month.assessment ? [month.assessment.blocks] : []),
      ];
      for (const blocks of groups) {
        const authored = policyBlocksFromAuthored(blocks);
        const projected = policyBlocksFromPublic(blocks.map(publicBlock));
        expect(projected).toEqual(authored);
        compared += blocks.length;
      }
    }
    expect(compared).toBeGreaterThan(50);
  });
});

/* -------------------------------------------------------------------------- */
/* The server is authoritative                                                */
/* -------------------------------------------------------------------------- */

const ANON = "9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a";

let sql: PgliteExecutor;
let store: LearningStore;
let subjectId: string;

/* The cookie jar the route reads its identity and its track from. `sx_anon` is
   the whole of identity today; no session cookie means `checkLearningAccess`
   takes its development branch, which is what the test environment is. */
const jar = {
  get(name: string) {
    return name === "sx_anon" ? { name, value: ANON } : undefined;
  },
};

vi.mock("next/headers", () => ({
  cookies: async () => jar,
}));

vi.mock("@schools/store", () => ({
  getStore: async () => store,
  getStoreHandle: async () => ({ sql, store }),
}));

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  subjectId = await store.resolveSubject(ANON, "public");
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

/** One graded submission on record for `blockId`, as `/api/learning/submit` writes it. */
async function submitted(blockId: string, verdict: "accepted" | "wrong_answer" | null) {
  const episodeId = randomUUID();
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const base = {
    subjectId,
    episodeId,
    sessionId,
    occurredAt: now,
    environment: "development" as const,
    cohort: "public" as const,
    route: "/lesson/test",
  };
  const rows: LearningEventRow[] = [
    {
      ...base,
      eventId: randomUUID(),
      seq: 0,
      eventName: "episode_opened",
      sourceTrust: "server",
      payload: { task_ref: `sx-lesson:${blockId}`, task_kind: "lesson" },
    },
  ];
  if (verdict) {
    rows.push({
      ...base,
      eventId: randomUUID(),
      seq: 1,
      eventName: "verdict_received",
      sourceTrust: "judge",
      payload: { verdict, task_ref: `sx-lesson:${blockId}` },
    });
  }
  await store.appendEvents(rows);
}

describe("POST /api/learning/complete refuses a claim the ledger does not support", () => {
  it("returns 409 for a lesson the learner never attempted", async () => {
    /* The defect this closes is not subtle: the route wrote a row for any real
       lesson id. `curl -d '{"lessonId":"m1.l1"}'` was a completed lesson in a
       school's record, and the only thing that had ever prevented it was the
       shape of a React callback. */
    const { POST } = await import("@/app/api/learning/complete/route");
    const res = await POST(request({ lessonId: "m1.l1" }));

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      policyId: string;
      outstanding: { blockId: string }[];
    };
    expect(body.error).toBe("policy_unsatisfied");
    expect(body.policyId).toBe("lesson.v1");
    expect(body.outstanding.map((o) => o.blockId).sort()).toEqual([
      "m1.l1.b2",
      "m1.l1.b4",
      "m1.l1.b5",
    ]);

    const stored = await store.completionsForSubject(subjectId);
    expect(stored.map((c) => c.lessonId)).not.toContain("m1.l1");
  });

  it("still refuses when only some of the work is there", async () => {
    await submitted("m1.l1.b2", "accepted");
    const { POST } = await import("@/app/api/learning/complete/route");
    const res = await POST(request({ lessonId: "m1.l1" }));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { outstanding: { blockId: string }[] };
    expect(body.outstanding.map((o) => o.blockId).sort()).toEqual(["m1.l1.b4", "m1.l1.b5"]);
  });

  it("records the completion once every task has been attempted — wrong answers included", async () => {
    /* Two wrong and one ungraded. This is a real lesson a real learner has
       finished badly, and it must be recorded as finished. */
    await submitted("m1.l1.b4", "wrong_answer");
    await submitted("m1.l1.b5", null);

    const { POST } = await import("@/app/api/learning/complete/route");
    const res = await POST(request({ lessonId: "m1.l1", correct: 1, wrong: 1, unmeasured: 1 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ lessonId: "m1.l1", first: true, policyId: "lesson.v1" });

    const stored = await store.completionsForSubject(subjectId);
    const row = stored.find((c) => c.lessonId === "m1.l1");
    expect(row).toBeDefined();
    /* Which rule admitted it — migration 0015. A configurable rule with no
       record of which version applied produces a table whose rows mean
       different things and never say so. */
    expect(row!.policyId).toBe("lesson.v1");
  });

  it("holds the monthly check to the stricter rule over the same kind of evidence", async () => {
    /* Every assessment block submitted, nothing graded. Under `lesson.v1` that
       would be a finished lesson; under `assessment.v1` the two coding blocks
       are still outstanding. */
    for (const id of ["m1.as.b1", "m1.as.b2", "m1.as.b3", "m1.as.b4"]) {
      await submitted(id, null);
    }

    const { POST } = await import("@/app/api/learning/complete/route");
    const refused = await POST(request({ lessonId: "m1.assessment" }));
    expect(refused.status).toBe(409);
    const body = (await refused.json()) as {
      policyId: string;
      outstanding: { blockId: string; required: string }[];
    };
    expect(body.policyId).toBe("assessment.v1");
    expect(body.outstanding.map((o) => o.blockId).sort()).toEqual(["m1.as.b1", "m1.as.b2"]);
    expect(body.outstanding.every((o) => o.required === "measured")).toBe(true);

    /* Graded — and failed. The check is complete because it was SAT, not
       because it was passed. */
    await submitted("m1.as.b1", "wrong_answer");
    await submitted("m1.as.b2", "wrong_answer");

    const accepted = await POST(request({ lessonId: "m1.assessment" }));
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toMatchObject({ policyId: "assessment.v1" });
  });

  it("still refuses an id nobody authored, before the policy is even consulted", async () => {
    const { POST } = await import("@/app/api/learning/complete/route");
    expect((await POST(request({ lessonId: "m1.l999" }))).status).toBe(404);
    expect((await POST(request({ lessonId: "../../etc/passwd" }))).status).toBe(404);
  });
});

function request(body: unknown): Request {
  return new Request("http://localhost/api/learning/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
