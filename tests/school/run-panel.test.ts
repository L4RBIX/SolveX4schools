import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ALLOWED_PAYLOAD_KEYS,
  isClientReportable,
  sanitizePayload,
} from "@solvex/learning-contracts";
import { isLearnerOutcome, LOCAL_LIMITS } from "@schools/execution/trust";
import {
  capabilityFor,
  surfaceForBlock,
  TRUST_POLICY,
  trustSatisfies,
  type ExecutionSurface,
} from "@schools/execution/trust-policy";
import { L } from "@schools/presentation/labels";
import {
  byteLength,
  clampStdin,
  isNewRunEffort,
  runButtonState,
  runEventPayload,
  runStatusNote,
  runTrustLines,
  schoolTaskRef,
  shouldRecordRun,
  seedStdin,
  taskKindOf,
} from "../../src/components/brilliant/lesson/blocks/run-state";
import { YEAR_ONE_LANGUAGE } from "../../schools/curriculum/source-of-truth";

/**
 * The Run button in the lesson player.
 *
 * Three things are pinned here, and they are the three that would be expensive
 * to discover in a classroom:
 *
 * 1. **What leaves the browser when a learner presses Run.** Not stdout, not
 *    stderr, not their source — and nothing shaped like a verdict.
 * 2. **That the panel asks the policy rather than deciding for itself.** The
 *    sentence "running it here is not the same as being marked correct" has to
 *    appear on exactly the surfaces `trust-policy.ts` says it must.
 * 3. **That the button is never a lie.** No dead button while CPython is
 *    downloading, and a runtime that failed to load never looks like a program
 *    that failed to run.
 *
 * `vitest` runs `node` over `tests/**\/*.test.ts` here — no jsdom, no renderer
 * — which is exactly why the panel's decisions live in `run-state.ts` as pure
 * functions. What cannot be asserted that way is asserted against the sources,
 * the way `tests/execution/trust.test.ts` already does for the trust types.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const PANEL = read("src/components/brilliant/lesson/blocks/run-panel.tsx");
const BLOCKS = read("src/components/brilliant/lesson/blocks/index.tsx");
const ALL_SURFACES = Object.keys(TRUST_POLICY) as ExecutionSurface[];

const ALLOWED = new Set<string>(ALLOWED_PAYLOAD_KEYS);

/* -------------------------------------------------------------------------- */
/* What a Run is allowed to report                                            */
/* -------------------------------------------------------------------------- */

describe("the run_executed payload", () => {
  const payload = runEventPayload({
    lessonId: "m1.l8",
    monthIndex: 1,
    blockId: "m1.l8.b4",
    isCustomInput: true,
  });

  it("reports the language the curriculum actually teaches", () => {
    /* This said "python" while `YEAR_ONE_LANGUAGE` said something else, and
       nothing noticed, because nothing imported the constant. The value is not
       decorative: the intelligence core keys boilerplate detection off it, so a
       stale string silently stops detecting "they submitted the starter
       unchanged" rather than failing.

       Asserted against the constant rather than against the literal "cpp17" on
       purpose — a test that hardcodes the answer is a second source of truth,
       which is the thing that broke. */
    expect(payload.language).toBe(YEAR_ONE_LANGUAGE);
    expect(payload.language, "the run event still claims Python").not.toMatch(/python/i);
  });

  it("uses only keys on the global allowlist", () => {
    for (const key of Object.keys(payload)) {
      expect(ALLOWED.has(key), `\`${key}\` is not on ALLOWED_PAYLOAD_KEYS`).toBe(true);
    }
  });

  it("survives the server's sanitizer unchanged", () => {
    /* The real proof that nothing is being dropped. `sanitizePayload` runs
       again inside `/api/learning/events`, so a payload that loses a key here
       is one whose meaning differs between what the browser sent and what the
       ledger stored — and nobody would ever see the difference. */
    expect(sanitizePayload(payload)).toEqual(payload);
  });

  it("carries no output, no code and nothing that could smuggle either", () => {
    /* The three the audit names, plus the transport key the ingest route
       extracts source through. None of them is on the allowlist, so the
       `LearningPayload` type already refuses them at the call site — this is
       the runtime backstop for a future call site that casts. */
    const serialised = JSON.stringify(payload);
    for (const forbidden of [
      "stdout",
      "stderr",
      "source",
      "sourceCode",
      "code",
      "__code",
      "stdin",
      "input",
      "expected",
    ]) {
      expect(Object.keys(payload), `a Run must not report \`${forbidden}\``).not.toContain(
        forbidden,
      );
    }
    /* And the learner's actual text is not hiding in a value either. */
    expect(serialised).not.toContain("print(");
  });

  it("carries nothing shaped like a verdict", () => {
    /* `run_executed` is stamped `browser` by ingest and the browser has no
       expected output to compare against. A verdict key here would be a forged
       outcome wearing an effort event's name — the exact hole
       `tests/school/forged-outcomes.test.ts` closed on the event NAME. */
    for (const forbidden of [
      "verdict",
      "tests_passed",
      "tests_total",
      "passed_count",
      "failed_count",
      "first_failing_case",
      "failing_test_index",
    ]) {
      expect(Object.keys(payload)).not.toContain(forbidden);
    }
  });

  it("omits runtime_ms even though the allowlist would take it", () => {
    /* Deliberate, and worth a test because "we already have the number" is a
       reasonable-sounding argument for adding it. Browser wall time from a tab
       the OS may have throttled, sitting in the same column as the judge's
       measured runtime, is a lie by juxtaposition. */
    expect(ALLOWED.has("runtime_ms"), "the key exists; we are choosing not to use it").toBe(true);
    expect(Object.keys(payload)).not.toContain("runtime_ms");
  });

  it("distinguishes a learner's own input from a re-run of the sample", () => {
    expect(payload.is_custom_input).toBe(true);
    expect(
      runEventPayload({
        lessonId: "m1.l8",
        monthIndex: 1,
        blockId: "m1.l8.b4",
        isCustomInput: false,
      }).is_custom_input,
    ).toBe(false);
  });

  it("is an event the ingest route will actually accept", () => {
    /* The whole point of the unit. `EVENT_TRUST.run_executed = "browser"` and
       `isClientReportable` therefore admits it — if that ever flipped, every
       Run would be silently dropped and the hint ladder would go back to
       treating iteration as idleness. */
    expect(isClientReportable("run_executed")).toBe(true);
  });
});

describe("task_ref agrees with the task_ref the server will write", () => {
  it("reproduces gradeBlock's three-branch rule", () => {
    expect(taskKindOf({ lessonId: "m1.l8", monthIndex: 1, blockId: "m1.l8.b4" })).toBe("lesson");
    expect(taskKindOf({ lessonId: "m1.l9", monthIndex: 1, blockId: "m1.p3" })).toBe("practice");
    expect(taskKindOf({ lessonId: "m1.assessment", monthIndex: 1, blockId: "m1.as.b3" })).toBe(
      "assessment",
    );
    expect(schoolTaskRef({ lessonId: "m1.l9", monthIndex: 1, blockId: "m1.p3" })).toBe(
      "sx-practice:m1.p3",
    );
  });

  it("fails if the server's expression changes shape", () => {
    /* `schools/learning/grade.ts` carries `import "server-only"`, so the rule
       cannot be shared as a function — it is duplicated on purpose (see
       `run-state.ts`) and this is the pin that makes the duplication safe.
       If the server starts minting refs differently, a Run and the verdict for
       the same block would land under two different task_refs and the ledger
       would quietly stop joining them. */
    const grade = read("schools/learning/grade.ts");
    /* Matched without the receiver, because the rule is what is pinned and the
       thing it is read off has been renamed once already (`block` became
       `target.block` when `taskKindOf` started taking the whole target). A pin
       that breaks on a rename teaches people to loosen it, which is how a pin
       ends up pinning nothing. */
    expect(grade).toMatch(/lesson\.id\.endsWith\("assessment"\)/);
    expect(grade).toMatch(/block\.id\.startsWith\(`m\$\{(?:target\.)?month\.index\}\.p`\)/);
    expect(grade).toContain("taskRef: `sx-${kind}:${block.id}`");
  });
});

/* -------------------------------------------------------------------------- */
/* The panel asks the policy                                                  */
/* -------------------------------------------------------------------------- */

describe("trust marking comes from the policy, not from the component", () => {
  it("derives the surface with surfaceForBlock and the mode with capabilityFor", () => {
    expect(PANEL).toContain("surfaceForBlock(");
    expect(PANEL).toContain("capabilityFor(");
    /* And does not decide for itself. A surface name written as a literal in a
       component is the "seventh person, under deadline, on the contest screen"
       failure `trust-policy.ts` exists to prevent. */
    for (const surface of ALL_SURFACES) {
      expect(PANEL, `the panel must not hardcode the surface \`${surface}\``).not.toContain(
        `"${surface}"`,
      );
    }
  });

  it("says a local pass is not a check on exactly the surfaces that require the server", () => {
    for (const surface of ALL_SURFACES) {
      const lines = runTrustLines(surface, capabilityFor(surface, true));
      /* Always first, on every surface: this is what `client_local` means. */
      expect(lines[0]).toBe(L.runRanInYourBrowser);
      expect(
        lines.includes(L.runIsNotACheck),
        `${surface}: the warning must appear iff a browser result cannot settle it`,
      ).toBe(!trustSatisfies(surface, "client_local"));
    }
  });

  it("names the degraded mode only where there is one", () => {
    /* With no trusted provider the evidence surfaces fall back to a human or
       stop; the guided lesson does neither, because a browser result settles it
       honestly there. The panel must not tell a lesson block that a teacher
       will mark it. */
    const guided = runTrustLines("lesson_guided", capabilityFor("lesson_guided", false));
    expect(guided).not.toContain(L.runTeacherWillMark);
    expect(guided).not.toContain(L.runCheckUnavailableHere);

    expect(runTrustLines("assessment", capabilityFor("assessment", false))).toContain(
      L.runTeacherWillMark,
    );
    expect(runTrustLines("contest", capabilityFor("contest", false))).toContain(
      L.runCheckUnavailableHere,
    );
    /* And with a judge configured, neither sentence is said at all. */
    expect(runTrustLines("assessment", capabilityFor("assessment", true))).not.toContain(
      L.runTeacherWillMark,
    );
  });

  it("puts every coding block on the surface the policy expects", () => {
    expect(surfaceForBlock({ blockType: "write_code", blockId: "m1.l8.b4", lessonId: "m1.l8" })).toBe(
      "lesson_guided",
    );
    expect(surfaceForBlock({ blockType: "write_code", blockId: "m1.p3", lessonId: "m1.l9" })).toBe(
      "independent_evidence",
    );
    expect(surfaceForBlock({ blockType: "challenge", blockId: "m1.l8.b7", lessonId: "m1.l8" })).toBe(
      "independent_evidence",
    );
    expect(
      surfaceForBlock({ blockType: "verify", blockId: "m1.as.b3", lessonId: "m1.assessment" }),
    ).toBe("assessment");
  });
});

/* -------------------------------------------------------------------------- */
/* The button                                                                 */
/* -------------------------------------------------------------------------- */

const READY = {
  phase: "ready",
  isRunning: false,
  locked: false,
  sourceBytes: 40,
  hasSource: true,
} as const;

describe("the Run button is never a lie", () => {
  it("says Python is still downloading, and is disabled while it is", () => {
    for (const phase of ["idle", "loading"] as const) {
      const state = runButtonState({ ...READY, phase });
      expect(state.disabled).toBe(true);
      expect(state.action).toBe("none");
      expect(state.label).toBe(L.runPreparing);
      /* Names the language the learner is actually waiting for. It said Python
         when Python was the runtime; the assertion moved with the product. */
      expect(L.runPreparing.kk).toBe("C++ дайындалып жатыр…");
      expect(L.runPreparing.ru).toBe("C++ готовится…");
    }
  });

  it("offers a retry when the runtime failed, and does not call it the learner's fault", () => {
    const state = runButtonState({ ...READY, phase: "unavailable" });
    /* Enabled. `PythonRunner.ensureReady` spawns a fresh worker, and school
       Wi-Fi coming back is the common case — a permanently dead button would
       end the lesson for everyone in the room. */
    expect(state.disabled).toBe(false);
    expect(state.action).toBe("retry");
    expect(state.note).toBe(L.runRuntimeUnavailable);
    /* And the sentence says whose problem it is, in both languages. */
    expect(L.runRuntimeUnavailable.kk).toContain("бағдарламаңның қатесі емес");
    expect(L.runRuntimeUnavailable.ru).toContain("не ошибка твоей программы");
  });

  it("outranks every other reason to be disabled", () => {
    /* Priority matters: an empty editor plus a dead runtime must report the
       dead runtime, or the learner is told to write something and then presses
       a button that silently does nothing. */
    const state = runButtonState({
      ...READY,
      phase: "unavailable",
      hasSource: false,
      locked: true,
    });
    expect(state.action).toBe("retry");
  });

  it("disables itself while a program is running", () => {
    const state = runButtonState({ ...READY, isRunning: true });
    expect(state.disabled).toBe(true);
    expect(state.label).toBe(L.runInProgress);
  });

  it("disables itself once the block has been checked, and says why", () => {
    const state = runButtonState({ ...READY, locked: true });
    expect(state.disabled).toBe(true);
    expect(state.note).toBe(L.runLockedAfterCheck);
  });

  it("refuses an oversized program with the honest sentence", () => {
    /* `PythonRunner.refuseOnSize` answers this case with
       `runtime_unavailable`, which is right about not being the learner's fault
       and wrong about what happened: a program that is too long IS something
       they can fix. So the button says so before it is pressed. */
    const state = runButtonState({ ...READY, sourceBytes: LOCAL_LIMITS.maxSourceBytes + 1 });
    expect(state.disabled).toBe(true);
    expect(state.note).toBe(L.runSourceTooLong);
  });

  it("is disabled on an empty editor, silently", () => {
    const state = runButtonState({ ...READY, hasSource: false });
    expect(state.disabled).toBe(true);
    expect(state.note).toBeNull();
  });

  it("is pressable exactly once everything is in place", () => {
    const state = runButtonState(READY);
    expect(state.disabled).toBe(false);
    expect(state.action).toBe("run");
    expect(state.label).toBe(L.run);
  });
});

/* -------------------------------------------------------------------------- */
/* stdin                                                                      */
/* -------------------------------------------------------------------------- */

describe("the input box", () => {
  it("is seeded from the first VISIBLE case", () => {
    expect(seedStdin([{ input: "3 7", expectedOutput: "10" }])).toBe("3 7");
    expect(seedStdin([])).toBe("");
  });

  it("cannot be seeded from a hidden case, because it never sees one", () => {
    /* Structural, not behavioural: `publicBlock()` splits the cases before the
       block reaches the browser, and the panel is handed `visibleCases`. If
       this ever became `block.cases`, the seed would be an answer key. */
    expect(BLOCKS).toContain("visibleCases={block.visibleCases}");
    expect(PANEL).not.toContain("hiddenCase");
    expect(PANEL).not.toContain("expectedOutput");
  });

  it("enforces LOCAL_LIMITS.maxStdinBytes in bytes, not characters", () => {
    const oversize = "я".repeat(LOCAL_LIMITS.maxStdinBytes); // 2 bytes each
    const clampedValue = clampStdin(oversize);
    expect(byteLength(clampedValue)).toBeLessThanOrEqual(LOCAL_LIMITS.maxStdinBytes);
    expect(clampedValue.length).toBe(LOCAL_LIMITS.maxStdinBytes / 2);
  });

  it("never cuts a character in half", () => {
    /* A Kazakh or Russian paste ending in half a code unit would render as a
       replacement glyph in the box the learner is about to run. */
    const clampedValue = clampStdin("ёж", 3);
    expect(clampedValue).toBe("ё");
    expect(byteLength(clampedValue)).toBe(2);
  });

  it("leaves ordinary input completely alone", () => {
    expect(clampStdin("3 7\n")).toBe("3 7\n");
  });
});

/* -------------------------------------------------------------------------- */
/* Python's own words                                                         */
/* -------------------------------------------------------------------------- */

describe("Python's errors reach the learner untranslated", () => {
  it("adds no sentence of our own to a SyntaxError or a NameError", () => {
    /* The status note exists for the three things Python never mentions. For
       the two it explains itself — with the exception name and a line number —
       we say nothing, because reading a real traceback is a skill the
       programme is trying to teach and «қате бар» replaces it with nothing. */
    expect(runStatusNote("syntax_error")).toBeNull();
    expect(runStatusNote("runtime_error")).toBeNull();
    expect(runStatusNote("ok")).toBeNull();
  });

  it("explains only what Python could not have said", () => {
    expect(runStatusNote("time_limit_exceeded")).not.toBeNull();
    expect(runStatusNote("output_limit_exceeded")).toBe(L.runOutputLimit);
    expect(runStatusNote("runtime_unavailable")).toBe(L.runRuntimeUnavailable);
    /* The time limit quotes the runner's own budget rather than a written-down
       number that can drift away from it. */
    expect(runStatusNote("time_limit_exceeded")?.ru).toContain(
      String(Math.round(LOCAL_LIMITS.timeLimitMs / 1000)),
    );
  });

  it("keeps stdout and stderr in separate panes", () => {
    /* One merged pane is how a printed answer becomes indistinguishable from a
       traceback, and telling them apart is half of debugging. */
    expect(PANEL).toContain("result.stdout");
    expect(PANEL).toContain("result.stderr");
    expect(PANEL).toContain("L.runStdout");
    expect(PANEL).toContain("L.runStderr");
  });
});

/* -------------------------------------------------------------------------- */
/* Nothing user-facing is hardcoded                                           */
/* -------------------------------------------------------------------------- */

describe("every learner-facing string is bilingual", () => {
  it("routes all of the panel's copy through t(L.x, locale)", () => {
    /* A hardcoded Russian or English sentence in a Kazakh lesson is the defect
       `labels.ts` exists to prevent, and a Run panel is dense with copy. */
    const jsxText = PANEL.match(/>[^<>{}\n]*[а-яәғқңөұүһі][^<>{}\n]*</gi) ?? [];
    expect(jsxText, `untranslated JSX text: ${jsxText.join(" | ")}`).toEqual([]);
  });

  it("gives both languages for every Run label", () => {
    const runLabels = [
      L.runWhatItDoes,
      L.runInputLabel,
      L.runInputHint,
      L.runInputClamped,
      L.runSourceTooLong,
      L.runStdout,
      L.runStderr,
      L.runStderrIsCompiler,
      L.runNoOutput,
      L.runPreparing,
      L.runInProgress,
      L.runRuntimeUnavailable,
      L.runRetryLoad,
      L.runOutputLimit,
      L.runTruncated,
      L.runStale,
      L.runLockedAfterCheck,
      L.runRanInYourBrowser,
      L.runIsNotACheck,
      L.runTeacherWillMark,
      L.runCheckUnavailableHere,
      L.runTimeLimit(3),
    ];
    for (const label of runLabels) {
      expect(label.kk.trim().length).toBeGreaterThan(0);
      expect(label.ru.trim().length).toBeGreaterThan(0);
      expect(label.kk).not.toBe(label.ru);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The wiring                                                                 */
/* -------------------------------------------------------------------------- */

describe("the player emits the event it was always supposed to", () => {
  it("posts run_executed to the ingest route from both wrappers", () => {
    for (const rel of [
      "src/components/brilliant/lesson/lesson-route.tsx",
      "src/components/brilliant/lesson/assessment-route.tsx",
    ]) {
      const src = read(rel);
      expect(src, `${rel} must emit the event`).toContain('eventName: "run_executed"');
      expect(src).toContain('"/api/learning/events"');
    }
  });

  it("never lets the browser talk to a judge", () => {
    /* The panel runs Python locally and reports that it did. It must not know
       any grading endpoint exists — Check owns that round trip, from the
       player's footer, through `onSubmit`. */
    expect(PANEL).not.toContain("/api/learning/submit");
    expect(PANEL).not.toContain("/api/exec/run");
    expect(PANEL).not.toContain("fetch(");
  });

  it("leaves a seam for the one fact the browser cannot know", () => {
    /* `schools/config.ts` carries `import "server-only"`, so whether a trusted
       judge exists is the page's fact to supply. Both wrappers accept it and
       forward it; until a page actually passes it the panel defaults to the
       WEAKER claim — "this ran in your browser, it is not a check" — rather
       than telling a class with a working judge that a teacher will mark them.
       If this assertion ever goes red, the degraded-mode sentences have been
       cut off from the only source of truth about them. */
    for (const rel of [
      "src/components/brilliant/lesson/lesson-route.tsx",
      "src/components/brilliant/lesson/assessment-route.tsx",
    ]) {
      expect(read(rel)).toContain(
        "trustedProviderConfigured={trustedProviderConfigured}",
      );
    }
  });

  it("offers Run on the four block types that hold code, and not elsewhere", () => {
    /* `write_code`, `modify_code` and `challenge` share one view; the coding
       half of `verify` is the fourth. A concept card and a multiple choice have
       no program to run and must not mount CPython. */
    const panels = BLOCKS.match(/<RunPanel/g) ?? [];
    expect(panels.length, "one in CodeTaskView, one in VerifyView").toBe(2);
    expect(BLOCKS).toContain("RUNNABLE_VERIFY_MODES");
  });
});

describe("a failed runtime is never recorded as the learner's effort", () => {
  /**
   * Added after an adversarial review pointed out that this rule — the panel's
   * headline safety claim — had no test at all: deleting the guard left the
   * whole suite green. It was inline in `RunPanel.press`, which vitest here
   * cannot render (node environment, no jsdom), so it was unreachable by
   * construction. It now lives in `run-state.ts` as `shouldRecordRun` for
   * exactly this reason.
   *
   * Why it matters: `run_executed` is counted as EFFORT by `hasEffortAfter` in
   * `schools/nova/enforce.ts`, which gates how much help a learner is granted.
   * Recording a failed 13 MB CPython download as effort would credit a learner
   * with work they did not do, on a failure that is ours.
   */
  it("records every outcome the learner's program actually produced", () => {
    for (const status of [
      "ok",
      "syntax_error",
      "runtime_error",
      "time_limit_exceeded",
      "output_limit_exceeded",
    ] as const) {
      expect(shouldRecordRun(status), `${status} is something they did`).toBe(true);
    }
  });

  it("refuses the one status that is our failure and not theirs", () => {
    expect(shouldRecordRun("runtime_unavailable")).toBe(false);
  });

  it("agrees with the rule the server uses, rather than restating it", () => {
    /* The point of sharing `isLearnerOutcome` across both halves: a local
       runtime that would not start and a judge that would not answer are the
       same kind of fact, and neither may be recorded against a child. If these
       two ever diverge, one of the two systems has quietly become the
       exception. */
    for (const status of [
      "ok",
      "syntax_error",
      "runtime_error",
      "time_limit_exceeded",
      "output_limit_exceeded",
      "runtime_unavailable",
    ] as const) {
      expect(shouldRecordRun(status)).toBe(isLearnerOutcome(status));
    }
  });
});

describe("the hint ladder cannot be climbed by pressing one button", () => {
  /**
   * Raised by an adversarial review of the Run panel, and it is a real one.
   *
   * `run_executed` is in the EFFORT set of `hasEffortAfter`
   * (`schools/nova/enforce.ts`), whose own comment states the gate's purpose:
   * "Asking for another hint is not effort — otherwise the ladder could be
   * climbed by asking repeatedly, which is the exact failure it exists to
   * prevent."
   *
   * Emitting on every press reopened that from the other side. Before the Run
   * button existed the cheapest way past the gate was a real edit or a Check;
   * with an unconditional emit, `print(1)` plus N presses bought N levels of
   * help. The fix is not to stop counting Runs — running IS effort — but to
   * count each distinct attempt once.
   */
  const last = (source: string, stdin: string) => ({ source, stdin });

  it("counts the first run", () => {
    expect(isNewRunEffort({ source: "print(1)", stdin: "", lastReported: null })).toBe(true);
  });

  it("does not count pressing Run again on the identical attempt", () => {
    expect(
      isNewRunEffort({ source: "print(1)", stdin: "", lastReported: last("print(1)", "") }),
      "the same program on the same input is watching the same result",
    ).toBe(false);
  });

  it("counts an edit to the program", () => {
    expect(
      isNewRunEffort({ source: "print(2)", stdin: "", lastReported: last("print(1)", "") }),
    ).toBe(true);
  });

  it("counts a new input on an unchanged program", () => {
    /* The case a naive "did the source change" check would wrongly discard.
       Trying your program against an input you invented to probe it is exactly
       the behaviour the programme wants to see more of. */
    expect(
      isNewRunEffort({ source: "print(input())", stdin: "9", lastReported: last("print(input())", "3") }),
    ).toBe(true);
  });

  it("lets a learner return to an earlier attempt and have it count again", () => {
    /* Deliberate: the comparison is against the LAST reported attempt, not
       against every attempt ever. A learner who changes something, runs, undoes
       it and runs again has done two things and thought about both. */
    expect(
      isNewRunEffort({ source: "print(1)", stdin: "", lastReported: last("print(2)", "") }),
    ).toBe(true);
  });
});
