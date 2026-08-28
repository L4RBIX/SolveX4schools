import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { LearnerState, SkillState } from "@solvex/learning-intelligence-core";
import { buildLearnerRow } from "../../schools/presentation/classroom";
import { L, TEACHER_FAILURE_CLASS, teacherFailureClassLabel } from "../../schools/presentation/labels";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  teacherOutcome,
  teacherOutcomeLabel,
  type TeacherOutcome,
} from "../../schools/presentation/teacher-outcome";
import { EXECUTION_LIMITS } from "../../schools/exec/provider";
import type { ExecutionStatus } from "../../schools/exec/provider";

/**
 * Nothing internal reaches a teacher.
 *
 * ## What was actually wrong
 *
 * Two things, both found by reading the surface rather than assumed:
 *
 * 1. `src/components/brilliant/app/teacher-classroom.tsx` rendered
 *    `error.message` straight into the page. On an expired session that is
 *    `not_authenticated`; on a class the teacher does not teach, `not_found`;
 *    and when the route 500s behind a proxy that answers HTML, it is the JSON
 *    parser's own `SyntaxError: Unexpected token '<' ...`.
 * 2. `buildLearnerRow` interpolated a raw skill id and a raw failure class into
 *    the one sentence a teacher is most likely to act on:
 *    `arith.remainder: бір қате 3 бөлек әрекетте қайталанды (remainder_vs_quotient_swap)`.
 *
 * Neither was a provider string — no `PISTON_STAGE_MISSING` or `provider_error`
 * has ever had a path to a teacher's screen, because the submit route returns a
 * curated `unmeasuredReason` and the teacher health view is guarded separately
 * in `ops-health.test.ts`. But both were machine vocabulary on a teaching
 * surface, and the second was the exact shape the third would arrive in.
 *
 * These tests keep both closed and pre-empt the third.
 */

/* The strings that must never reach a teacher. Two kinds: our own port's status
   vocabulary, and the shapes an unknown provider failure arrives in. */
const FORBIDDEN = [
  "provider_error",
  "provider_timeout",
  "PISTON_STAGE_MISSING",
  "provider_exit_502",
  "container_internal_error",
  "piston",
  "PISTON_URL",
  "EXEC_PROVIDER",
  "SIGKILL",
  "stderr",
  "SyntaxError",
  "Unexpected token",
  "ECONNREFUSED",
  "not_authenticated",
  "not_found",
  "forbidden",
] as const;

function assertReadableByATeacher(text: string, context: string) {
  for (const forbidden of FORBIDDEN) {
    expect(text.toLowerCase(), `${context} must not contain ${forbidden}`).not.toContain(
      forbidden.toLowerCase(),
    );
  }
  /* And nothing snake_case at all — the general form of the specific bugs above.
     Kazakh and Russian prose has no reason to contain `a_b`, so this catches an
     identifier nobody thought to add to the list. */
  expect(text, `${context} must contain no snake_case identifier`).not.toMatch(
    /[A-Za-z]+_[A-Za-z]+/,
  );
}

/* -------------------------------------------------------------------------- */

describe("the teacher outcome vocabulary", () => {
  const ALL_STATUSES: ExecutionStatus[] = [
    "ok",
    "compile_error",
    "runtime_error",
    "time_limit_exceeded",
    "memory_limit_exceeded",
    "provider_timeout",
    "provider_error",
    /* Added to the port after this mapping existed, which is the case the
       `never` guard in `teacherOutcome` is for: it did not compile until it had
       a case, so it could not reach a teacher unlabelled. */
    "payload_too_large",
  ];

  it("is total over every execution status", () => {
    /* Totality is the property. A status added to the port without a case here
       fails to compile in `teacherOutcome` (the `never` assignment) and fails
       here if the union literal list is updated without the mapping. */
    for (const status of ALL_STATUSES) {
      expect(teacherOutcome(status, false)).toBeTruthy();
      expect(teacherOutcome(status, true)).toBeTruthy();
    }
  });

  it("does not report a clean run as a pass", () => {
    /* `ok` means the program RAN, not that it was right. Merging the two would
       be the one error in this direction that puts a false claim about a child
       into a school record. */
    expect(teacherOutcome("ok", true)).toBe("passed");
    expect(teacherOutcome("ok", false)).toBe("wrong_answer");
  });

  it("keeps a slow program and an absent judge apart", () => {
    /* The distinction the whole execution port exists to protect, restated at
       the teacher surface: one is evidence about an algorithm, the other says
       nothing about the learner at all. */
    expect(teacherOutcome("time_limit_exceeded", false)).toBe("time_limit");
    expect(teacherOutcome("provider_timeout", false)).toBe("not_checked");
    expect(teacherOutcome("provider_error", false)).toBe("not_checked");
  });

  it("collapses every not-measured status into one sentence, on purpose", () => {
    /* "The judge timed out", "the judge was unreachable" and "we refused to run
       it" are the same fact to a teacher — nothing was measured. The distinction
       survives in `ExecutionStatus`, in the ledger and in the admin health view,
       which is where somebody can act on it. */
    expect(teacherOutcome("provider_timeout", false)).toBe(
      teacherOutcome("provider_error", false),
    );
    expect(teacherOutcome("payload_too_large", false)).toBe("not_checked");
  });

  it("labels every outcome in Kazakh and Russian, in prose", () => {
    const outcomes: TeacherOutcome[] = [
      "passed",
      "wrong_answer",
      "compile_error",
      "runtime_error",
      "time_limit",
      "memory_limit",
      "not_checked",
      "not_machine_checked",
    ];
    for (const outcome of outcomes) {
      const label = teacherOutcomeLabel(outcome);
      expect(label.kk.length, `${outcome}.kk`).toBeGreaterThan(3);
      expect(label.ru.length, `${outcome}.ru`).toBeGreaterThan(3);
      assertReadableByATeacher(label.kk, `${outcome}.kk`);
      assertReadableByATeacher(label.ru, `${outcome}.ru`);
    }
  });

  it("promises, in the outage sentence, the thing the code actually keeps", () => {
    /* The submit route leaves the verdict `unknown` when the judge does not
       answer, and `unknown` is never scored as a failure. That is why this
       string is allowed to say so. */
    expect(L.teacherOutcomeNotChecked.kk).toContain("Ешкімге қате қойылған жоқ");
    expect(L.teacherOutcomeNotChecked.ru).toContain("Ошибка никому не поставлена");
  });

  it("does not describe an ungraded essay as a system fault", () => {
    /* Permanent-and-correct versus broken-for-twenty-minutes. Collapsing them
       tells a teacher a service is down when a child simply wrote prose. */
    expect(teacherOutcomeLabel("not_machine_checked")).not.toEqual(
      teacherOutcomeLabel("not_checked"),
    );
  });
});

/* -------------------------------------------------------------------------- */

describe("why the class list would not load", () => {
  it("maps the guard's reasons onto sentences a teacher can use", () => {
    expect(teacherLoadFailure("not_authenticated")).toBe("signed_out");
    expect(teacherLoadFailure("forbidden")).toBe("not_yours");
    /* `requireClassAccess` answers 404 rather than 403 for a class this teacher
       does not teach, so the endpoint cannot be used to enumerate a school's
       classes. Wording them differently here would undo that on the screen. */
    expect(teacherLoadFailure("not_found")).toBe(teacherLoadFailure("forbidden"));
  });

  it("swallows anything it does not recognise", () => {
    /* Total over `unknown` because the failure modes that produce the ugliest
       strings are the ones nobody anticipated. There is no branch that returns
       its own input. */
    for (const hostile of [
      null,
      undefined,
      "",
      "PISTON_STAGE_MISSING",
      "provider_exit_502",
      "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON",
      { error: "container_internal_error" },
      42,
      ["not_found"],
    ]) {
      expect(teacherLoadFailure(hostile)).toBe("unavailable");
    }
  });

  it("labels all three in both languages, in prose", () => {
    for (const failure of ["signed_out", "not_yours", "unavailable"] as const) {
      const label = teacherLoadFailureLabel(failure);
      assertReadableByATeacher(label.kk, `${failure}.kk`);
      assertReadableByATeacher(label.ru, `${failure}.ru`);
    }
  });

  it("is what the classroom component actually renders", () => {
    /* A source assertion, and its limits are worth stating: it proves the
       specific regression cannot silently return, not that no future component
       renders a raw message. It is the cheapest guard for the exact defect that
       existed, and the type on `useState` is the real one. */
    const src = readFileSync(
      fileURLToPath(
        new URL("../../src/components/brilliant/app/teacher-classroom.tsx", import.meta.url),
      ),
      "utf8",
    );
    expect(src).not.toMatch(/setError\((?:e|err|error)\.message\)/);
    expect(src).not.toMatch(/\{error\}/);
    expect(src).toContain("teacherLoadFailure");
    expect(src).toContain("TeacherLoadFailure");
  });
});

/* -------------------------------------------------------------------------- */

describe("a repeated mistake, said to a teacher", () => {
  it("names every failure class both vocabularies can produce", () => {
    /* The imported core's closed set plus September's own diagnostics. Both
       reach `MisconceptionObservation.failureClass`, so both need a name. */
    for (const cls of [
      "compile_error",
      "runtime_error",
      "memory_limit",
      "complexity_asymptotic",
      "edge_case_handling",
      "unattributed_failure",
      "and_or_swap",
      "strict_vs_inclusive_boundary",
      "remainder_vs_quotient_swap",
      "string_vs_number_confusion",
    ]) {
      expect(TEACHER_FAILURE_CLASS[cls], `${cls} has no teacher label`).toBeTruthy();
    }
  });

  it("never echoes an identifier back, whatever it is handed", () => {
    /* The property that matters. An unknown class degrades to "one mistake",
       which is true and useful; printing `provider_exit_502` in a signal about a
       child is worse than saying less. */
    for (const hostile of [
      "provider_exit_502",
      "PISTON_STAGE_MISSING",
      "container_internal_error",
      "a_class_nobody_has_written_yet",
      "",
    ]) {
      const label = teacherFailureClassLabel(hostile);
      expect(label).toEqual(L.teacherMistakeUnnamed);
      assertReadableByATeacher(label.kk, `fallback.kk for ${hostile}`);
      assertReadableByATeacher(label.ru, `fallback.ru for ${hostile}`);
    }
  });

  it("keeps the identifier in the data while keeping it out of the prose", () => {
    const row = buildLearnerRow(
      "subject-1",
      stateWithMisconception("arith.remainder", "remainder_vs_quotient_swap", 3),
      new Date().toISOString(),
    );
    const signal = row.signals.find((s) => s.kind === "recurring_misconception");
    expect(signal).toBeTruthy();
    if (!signal) return;

    /* Auditable: a teacher who disputes the signal can be answered with the
       attributions behind this key. */
    expect(signal.failureClass).toBe("remainder_vs_quotient_swap");
    expect(signal.skill).toBe("arith.remainder");

    // Readable: neither identifier is in the sentence, and both are named.
    assertReadableByATeacher(signal.detail.kk, "misconception.kk");
    assertReadableByATeacher(signal.detail.ru, "misconception.ru");
    expect(signal.detail.ru).toContain("Остаток");
    expect(signal.detail.ru).toContain("меняет местами");
    expect(signal.detail.ru).toContain("3");
  });

  it("survives a failure class the presentation layer has never seen", () => {
    /* Content moves faster than presentation, so this WILL happen. It must
       degrade, not leak — and the count, which is the checkable part, stays. */
    const row = buildLearnerRow(
      "subject-2",
      stateWithMisconception("arith.remainder", "provider_exit_502", 4),
      new Date().toISOString(),
    );
    const signal = row.signals.find((s) => s.kind === "recurring_misconception");
    expect(signal).toBeTruthy();
    if (!signal) return;
    assertReadableByATeacher(signal.detail.kk, "unknown-class.kk");
    assertReadableByATeacher(signal.detail.ru, "unknown-class.ru");
    expect(signal.detail.ru).toContain("4");
  });

  it("puts no identifier in any signal the class projection can emit", () => {
    /* Every signal kind, not just the misconception one — the sweep is the
       point, because the next one added is the one nobody re-reads. */
    const row = buildLearnerRow(
      "subject-3",
      everySignalState(),
      new Date(Date.now() - 30 * 86_400_000).toISOString(),
    );
    expect(row.signals.length).toBeGreaterThanOrEqual(3);
    for (const s of row.signals) {
      assertReadableByATeacher(s.detail.kk, `${s.kind}.kk`);
      assertReadableByATeacher(s.detail.ru, `${s.kind}.ru`);
    }
  });
});

/* -------------------------------------------------------------------------- */

describe("what the learner is told, for contrast", () => {
  it("keeps the execution limits out of every teacher string", () => {
    /* A limit is a number a teacher cannot change and cannot act on; it belongs
       in the admin view. Guarded because "5000ms" is the kind of detail that
       gets added to a message to make it sound more precise. */
    for (const key of [
      "teacherOutcomeTimeLimit",
      "teacherOutcomeMemoryLimit",
      "teacherOutcomeNotChecked",
    ] as const) {
      expect(L[key].kk).not.toContain(String(EXECUTION_LIMITS.timeLimitMs));
      expect(L[key].ru).not.toContain(String(EXECUTION_LIMITS.memoryLimitMb));
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function skill(partial: Partial<SkillState> & { skill: string }): SkillState {
  return {
    level: "developing",
    attempts: 0,
    solved: 0,
    soloSolved: 0,
    assistedSolved: 0,
    failures: 0,
    attributedFailures: 0,
    distinctTasks: 0,
    misconceptions: [],
    rationale: "",
    ...partial,
  };
}

function learnerState(partial: Partial<LearnerState> & { subject: string }): LearnerState {
  return {
    episodes: 0,
    skills: [],
    assistance: {
      interventions: 0,
      hintDependency: 0,
      medianSecondsToFirstHint: null,
      transferSolves: 0,
      outcomeCounts: {
        resolved_independently: 0,
        resolved_by_transfer: 0,
        progressed: 0,
        escalated: 0,
        stalled: 0,
        regressed: 0,
        abandoned: 0,
      },
    },
    unattributedFailures: 0,
    version: 1,
    ...partial,
  };
}

function stateWithMisconception(
  skillId: string,
  failureClass: string,
  distinctEpisodes: number,
): LearnerState {
  return learnerState({
    subject: "s",
    episodes: 6,
    skills: [
      skill({
        skill: skillId,
        attempts: 6,
        failures: distinctEpisodes,
        attributedFailures: distinctEpisodes,
        misconceptions: [
          {
            failureClass,
            skill: skillId,
            occurrences: distinctEpisodes,
            distinctEpisodes,
            evidenceConfidence: 0.9,
            confidence: 0.8,
            actionable: true,
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            episodeIds: ["e1", "e2"],
          },
        ],
      }),
    ],
  });
}

/** Enough state to fire inactivity, misconception, high assistance and unexplained. */
function everySignalState(): LearnerState {
  const s = stateWithMisconception("cond.if_elif_else", "and_or_swap", 3);
  return {
    ...s,
    episodes: 20,
    unattributedFailures: 8,
    assistance: { ...s.assistance, hintDependency: 0.75, interventions: 9 },
    skills: [
      ...s.skills,
      skill({ skill: "io.read", level: "strong", attempts: 5, solved: 4, soloSolved: 4 }),
      skill({ skill: "io.print", level: "competent", attempts: 5, solved: 4, soloSolved: 4 }),
    ],
  };
}
