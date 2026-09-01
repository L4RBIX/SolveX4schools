import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock } from "@schools/curriculum/types";
import { isLearnerOutcome, type LocalExecutionStatus } from "@schools/execution/trust";
import { trustSatisfies } from "@schools/execution/trust-policy";
import { isLearnerEvidence } from "@schools/exec/provider";
import { checkOutput } from "@schools/exec/checker";
import { CPP_STANDARD_MACRO } from "@schools/execution/cpp-runtime";
import {
  CATEGORY_PAIRS,
  LOCAL_HALF_NOT_EXECUTED,
  PARITY_FIXTURES,
  septemberSolution,
  SEPTEMBER_BLOCKS,
  type ParityFixture,
} from "../execution/parity-fixtures";
import { hasServerCompiler, runServer, serverCompilerVersion } from "../execution/engines";

/**
 * September's programs, executed, and the browser correspondence that is
 * declared beside them.
 *
 * ## The claim under test, and how much of it this file can still reach
 *
 * RUN compiles in the learner's browser; SUBMIT compiles on the judge. The
 * hybrid design is only honest if **the same program produces the same result
 * in both** — otherwise a learner iterates against one compiler and is graded
 * by another, and the only symptom is a verdict nobody can explain, on a case
 * nobody is allowed to see.
 *
 * Under Python this file ran BOTH engines: Pyodide loads under node and the
 * shipped worker had an injection seam for its boot step. The C++ browser
 * engine has no equivalent — 57.5 MB of WebAssembly clang, fetched over HTTP,
 * driven through an ABI node's WASI cannot speak — so **only the server half is
 * executed here.** `tests/execution/engines.ts` sets out the reason in full and
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` already carries the two-engine suite as
 * still-to-do, with a manual pass as the current evidence.
 *
 * Saying that plainly is the point. What follows is a real suite — September's
 * own programs, compiled and run, against the outputs the curriculum declares —
 * and it is NOT the parity proof its predecessor was. The gap is asserted at
 * the bottom rather than left to be inferred from a green bar.
 *
 * ## What is compared, and what deliberately is not
 *
 * **Compared:** the server's status, its stdout byte for byte, and the
 * correspondence between the two status vocabularies as a property of the
 * TABLE (via `CATEGORY_PAIRS`).
 *
 * **Not compared:** diagnostic text. The compiler here is whatever this machine
 * has — Apple clang with libc++ on a Mac — and the judge is GCC 14 with
 * libstdc++. Clang and GCC phrase errors differently and the brief accepts
 * that: the learner reads whichever compiler they invoked, and both name a line
 * and a cause. Asserting message equality would fail on a toolchain nobody
 * chose, which is the kind of test people delete.
 */

const serverAvailable = hasServerCompiler();

/** Each fixture compiles and runs a real program. A compile is ~1 s. */
const FIXTURE_TIMEOUT_MS = 60_000;

/* -------------------------------------------------------------------------- */
/* The table is about the curriculum, and stays that way                      */
/* -------------------------------------------------------------------------- */

describe("the fixture table is real September code", () => {
  it("has enough fixtures to be worth running", () => {
    /* The guard against a green bar that checked nothing. A refactor that
       emptied the table would otherwise make every assertion below vacuous —
       the exact failure mode that let the payload leak survive a 346-test
       suite. */
    expect(PARITY_FIXTURES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(PARITY_FIXTURES.map((f) => f.id)).size).toBe(PARITY_FIXTURES.length);
  });

  it("every verbatim fixture IS the block's own solution, byte for byte", () => {
    let verbatim = 0;
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.provenance.kind !== "verbatim") continue;
      verbatim += 1;
      expect(
        fixture.source,
        `${fixture.id} claims to be ${fixture.provenance.blockId} verbatim and is not. ` +
          `Either the curriculum changed — in which case the claim now covers ` +
          `code no learner writes — or the fixture was edited by hand.`,
      ).toBe(septemberSolution(fixture.provenance.blockId));
    }
    expect(verbatim, "the table must be mostly real programs, not mostly mutations").toBeGreaterThan(
      PARITY_FIXTURES.length / 4,
    );
  });

  it("every derived fixture still names a block that exists, and differs from it", () => {
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.provenance.kind !== "derived") continue;
      const original = septemberSolution(fixture.provenance.blockId); // throws if gone
      if (fixture.id.startsWith("compile-error-")) {
        /* These are produced by `.replace()` on the real solution. If the
           substring stops matching, `replace` silently returns the ORIGINAL and
           the fixture becomes a working program asserted to be broken — a
           failure that looks like a parity bug and is not. */
        expect(
          fixture.source,
          `${fixture.id} no longer differs from ${fixture.provenance.blockId}: the ` +
            `mutation matched nothing. Fix the replacement, do not relax this.`,
        ).not.toBe(original);
      }
      expect(fixture.provenance.how.length, `${fixture.id} must say how it was derived`).toBeGreaterThan(10);
    }
  });

  it("every synthesised fixture says why September could not supply one", () => {
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.provenance.kind !== "synthesised") continue;
      expect(fixture.provenance.why.length, `${fixture.id} must justify itself`).toBeGreaterThan(40);
    }
  });

  it("September really is written in C++, which is what makes these fixtures real", () => {
    /* The migration's own claim, checked rather than assumed. Only CODE fields
       are scanned — a Kazakh sentence containing `print(` would be a false
       positive and would train everyone to ignore this.
       The markers are chosen because they are unambiguous and because a
       half-migrated month is the realistic failure: a block still carrying
       `input()` or `print(` would be a task no learner can run at all.

       SCOPED TO SEPTEMBER on purpose. The migration runs month by month and the
       later months are other units' work in progress; asserting over all nine
       would report their unfinished state as a defect here and would go red and
       green as they land, which is how a guard becomes noise. The recorded
       count below is the honest version of the wider claim. */
    const codeOf = (blocks: readonly LessonBlock[]): string[] => {
      const code: string[] = [];
      const push = (value: unknown) => {
        if (typeof value === "string") code.push(value);
      };
      for (const block of blocks) {
        const b = block as LessonBlock & Record<string, unknown>;
        push(b.referenceSolution);
        push(b.solution);
        push(b.code);
        push(b.starter);
        push(b.fixedCode);
        push(b.template);
        if (Array.isArray(b.lines)) for (const line of b.lines) push((line as { code?: unknown }).code);
      }
      return code;
    };

    const code = codeOf(SEPTEMBER_BLOCKS);
    expect(code.length, "no September code was scanned — the walk is broken").toBeGreaterThan(40);

    const pythonish = code.filter((c) => /(^|\n)\s*print\(|(^|[^A-Za-z_])input\(\)/.test(c));
    expect(
      pythonish,
      "September code still contains Python. A block that survived the migration " +
        "untranslated is a task nobody can run, and it would reach a learner as " +
        "a compile error on their own screen.",
    ).toEqual([]);

    const cpp = code.filter((c) => c.includes("#include") || c.includes("cout") || c.includes("cin"));
    expect(cpp.length, "and it is C++, not merely not-Python").toBeGreaterThan(20);
  });

  it("covers every category the hybrid design has to get right", () => {
    /* Named one by one rather than counted, so dropping the compile-error
       fixtures — the ones guarding a distinction the server actually got wrong
       once — is a red test rather than a smaller number nobody reads. */
    const ids = new Set(PARITY_FIXTURES.map((f) => f.id));
    for (const required of [
      "fixed-expression",
      "read-two-ints",
      "string-input",
      "kazakh-output",
      "integer-division-and-modulo",
      "negative-integer-division",
      "negative-modulo-parity",
      "double-default-precision",
      "long-long-past-32-bits",
      "bits-stdcpp-compiles",
      "compile-error-missing-semicolon",
      "compile-error-undeclared-identifier",
      "runtime-error-uncaught-exception",
      "division-by-zero",
      "non-numeric-input",
      "empty-input-box",
      "runaway-loop",
      "output-bomb-ascii",
    ]) {
      expect(ids, `the parity table lost its ${required} fixture`).toContain(required);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The two vocabularies                                                       */
/* -------------------------------------------------------------------------- */

describe("the two status vocabularies correspond, and say the same thing about the learner", () => {
  /*
   * A Record, not an array, and that is the entire point.
   *
   * This was `const EVERY_LOCAL_STATUS: LocalExecutionStatus[] = [...]`, which
   * a strict SUBSET satisfies — so the test below compared a hand-written list
   * against another hand-written list and enforced nothing. Adding a seventh
   * status to the union and forgetting it here would have left the suite green,
   * which is exactly the failure the test claims to prevent.
   *
   * `Record<LocalExecutionStatus, true>` is total by construction: a new member
   * of the union is a compile error on this object, at the place where someone
   * has to decide what it means on the server.
   */
  const LOCAL_STATUS_SET: Record<LocalExecutionStatus, true> = {
    ok: true,
    syntax_error: true,
    runtime_error: true,
    time_limit_exceeded: true,
    output_limit_exceeded: true,
    runtime_unavailable: true,
  };
  const EVERY_LOCAL_STATUS = Object.keys(LOCAL_STATUS_SET) as LocalExecutionStatus[];

  it("is total over LocalExecutionStatus", () => {
    /* A new local status must be given a server counterpart — or an explicit
       `null` and a reason — before it can ship. Otherwise the first person to
       add one gets to decide what it means on submit by accident. */
    expect([...CATEGORY_PAIRS.map((p) => p.local)].sort()).toEqual([...EVERY_LOCAL_STATUS].sort());
  });

  it("the trust boundary's own vocabulary did not move with the engine", () => {
    /* The migration's load-bearing negative claim. Changing the language
       changed the compiler, the provider, the probe and the fixtures; it must
       not have changed what a browser result is ALLOWED TO MEAN.
       `syntax_error` is now a misnomer — clang reports type errors and
       undeclared identifiers through it too — and it is kept anyway, because
       renaming a member of this union is a change to the boundary rather than
       to the engine underneath it. That reasoning lives on the type; this
       asserts the outcome. */
    expect(EVERY_LOCAL_STATUS.sort()).toEqual(
      [
        "ok",
        "output_limit_exceeded",
        "runtime_error",
        "runtime_unavailable",
        "syntax_error",
        "time_limit_exceeded",
      ].sort(),
    );
  });

  it("maps a compile failure to the server's compile error and nowhere else", () => {
    /* The correspondence this project has already got wrong once. A program
       that never compiled is not a program that crashed; reporting it as a
       crash sends a fourteen-year-old to look at their logic. */
    const pair = CATEGORY_PAIRS.find((p) => p.local === "syntax_error");
    expect(pair?.server).toBe("compile_error");
    expect(pair?.server, "a compile failure must never be a runtime error").not.toBe("runtime_error");
  });

  it("agrees about what may be recorded against a child", () => {
    /* The invariant that makes the two engines one system. `isLearnerOutcome`
       and `isLearnerEvidence` answer the same question in two vocabularies, and
       a pair where they disagreed would mean the same failure counts against a
       learner on one engine and is written off as our fault on the other. */
    for (const pair of CATEGORY_PAIRS) {
      expect(isLearnerOutcome(pair.local), `${pair.local}: ${pair.why}`).toBe(pair.isLearnerOutcome);
      if (pair.server === null) continue;
      expect(isLearnerEvidence(pair.server), `${pair.server}: ${pair.why}`).toBe(pair.isLearnerOutcome);
    }
  });

  it("records the one local status the server has no word for", () => {
    const orphan = CATEGORY_PAIRS.filter((p) => p.server === null);
    expect(orphan.map((p) => p.local)).toEqual(["output_limit_exceeded"]);
    expect(orphan[0].why).toContain("no server counterpart");
  });

  it("every fixture's two columns are a pair the table knows about", () => {
    /* What replaced the executed comparison. The browser cannot be run here, so
       the strongest available claim is about the TABLE: a fixture whose local
       and server statuses are not a declared correspondence is a fixture
       nobody has reasoned about, and it would otherwise sit in the file looking
       authoritative. Divergent rows are exempt BY NAME — that is what
       `divergence` means — and the exemption is checked below. */
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.divergence) continue;
      const pair = CATEGORY_PAIRS.find((p) => p.local === fixture.local);
      expect(pair, `${fixture.id} declares a local status with no category pair`).toBeDefined();
      expect(
        pair!.server,
        `${fixture.id}: ${fixture.local} locally is declared ${fixture.server} on the server`,
      ).toBe(fixture.server);
    }
  });

  it("says once, and only once, why the browser half is not executed", () => {
    /* A skipped half that does not say so is a suite claiming more than it
       does. The reason is a constant rather than twenty copies of a comment,
       and this is what stops it being deleted as noise. */
    expect(LOCAL_HALF_NOT_EXECUTED).toContain("wasi_unstable");
    expect(LOCAL_HALF_NOT_EXECUTED.length).toBeGreaterThan(120);
  });

  it("names the one program whose SERVER half must not be asserted either", () => {
    /* Undefined behaviour is not a status. `17 / 0` traps with SIGFPE on the
       judge's x86-64 and returns 0 on an AArch64 developer machine — measured,
       `0 17` and exit 0 on Apple Silicon — so any answer this harness recorded
       would be a fact about the machine that ran it.
       Exactly one fixture may opt out, and it has to say why. A second one
       appearing is somebody skipping a test they could not make pass. */
    const skipped = PARITY_FIXTURES.filter((f) => f.unexecutable?.server);
    expect(skipped.map((f) => f.id)).toEqual(["division-by-zero"]);
    expect(skipped[0].unexecutable!.server).toContain("undefined behaviour");
    expect(skipped[0].unexecutable!.server!.length).toBeGreaterThan(120);
  });
});

/* -------------------------------------------------------------------------- */
/* The server engine, on September's own programs                             */
/* -------------------------------------------------------------------------- */

function describeResult(label: string, status: string, stdout: string, stderr: string): string {
  const tail = stderr.split("\n").filter(Boolean).slice(-1)[0] ?? "";
  return `${label}: ${status} stdout=${JSON.stringify(stdout.slice(0, 120))} last stderr line=${JSON.stringify(tail.slice(0, 140))}`;
}

describe("September compiles and runs, and produces what the curriculum says", () => {
  it("has a compiler to run it with", () => {
    expect(
      serverAvailable,
      "no C++ compiler on PATH (tried EXEC_CPP_BIN, g++, clang++, c++), so every " +
        "fixture below was skipped. This is a skip, not a pass.",
    ).toBe(true);
  });

  for (const fixture of PARITY_FIXTURES) {
    const blocked = fixture.unexecutable?.server;

    it.runIf(serverAvailable && !blocked)(
      `${fixture.id} — ${fixture.provenance.kind === "synthesised" ? "synthesised" : fixture.provenance.blockId}`,
      async () => {
        const server = await runServer(fixture.source, fixture.stdin, fixture.serverTimeLimitMs);

        expect(
          server.status,
          describeResult("server", server.status, server.stdout, server.stderr),
        ).toBe(fixture.server);

        /* Every fixture in this table is a learner's program doing a learner's
           thing. None of them may be recorded as an outage — including the ones
           that fail, because a compile error and a crash are both evidence. */
        expect(server.infrastructureError, `${fixture.id} was recorded as our failure`).toBe(false);

        if (fixture.stdout !== null) {
          expect(server.stdout, `${fixture.id} server stdout`).toBe(fixture.stdout);
        }
      },
      FIXTURE_TIMEOUT_MS,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* The divergences, pinned                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Two fixtures do not agree, and both are about output truncation.
 *
 * They are asserted as they actually behave rather than as they ought to,
 * because this unit owns tests and not `schools/exec`. Each assertion says what
 * SHOULD be true, so the day someone fixes the provider these go red and get
 * updated deliberately — which is the point. A divergence nothing asserts is a
 * divergence nobody finds out about.
 */
describe("the divergences, pinned until someone fixes them", () => {
  const fixture = (id: string): ParityFixture => {
    const found = PARITY_FIXTURES.find((f) => f.id === id);
    if (!found) throw new Error(`fixture ${id} is gone`);
    return found;
  };

  it.runIf(serverAvailable)(
    "an output bomb is a named outcome locally and a wrong answer on submit",
    async () => {
      const f = fixture("output-bomb-ascii");
      const server = await runServer(f.source, f.stdin);

      /* On the server: no output-limit status exists. The output is cut,
         `[output truncated]` is appended to stderr, and the exit code decides —
         so a program that printed a hundred thousand characters is `ok` with a
         short answer, and the learner is marked wrong on a case whose failure
         has nothing to do with their logic. `ExecutionStatus` growing an
         `output_limit_exceeded` is the fix; until then this is what happens. */
      expect(server.status).toBe("ok");
      expect(server.stderr).toContain("[output truncated]");
      expect(server.stdout.length).toBe(64 * 1024);

      /* And the browser's declared behaviour is the OTHER one, which is the
         divergence. Declared, not executed. */
      expect(f.local).toBe("output_limit_exceeded");
      expect(f.divergence).toContain("no output-limit status");
    },
    FIXTURE_TIMEOUT_MS,
  );

  it.runIf(serverAvailable)(
    "the output cap is counted in bytes locally and in UTF-16 code units on the server",
    async () => {
      const f = fixture("output-bomb-kazakh");
      const server = await runServer(f.source, f.stdin);

      /* 40 000 Kazakh characters is 80 000 bytes and 40 000 code units. The
         browser's sink counts bytes, so it would cut; every server provider
         compares `String.length` against the same 65 536, so none of them does. */
      expect(server.status).toBe("ok");
      expect(server.stdout.length, "the server did not truncate at all").toBe(40_001);
      expect(server.stderr, "and told nobody, because nothing was cut").not.toContain(
        "[output truncated]",
      );

      /* What SHOULD be true, and is not:
           expect(Buffer.byteLength(server.stdout, "utf8")).toBe(64 * 1024);
         `trust.ts` says the caps match "exactly, and that is not a coincidence
         to be tidied away: a program whose output is truncated locally must be
         truncated identically on submit". For any output that is not ASCII, it
         is false — `schools/exec/limits.ts` already made this exact correction
         for `maxSourceBytes` ("UTF-16 code units against a number called
         Bytes") and the two output caps were not corrected with it. The fix is
         one `Buffer.byteLength` in each provider's `cap`, and it predates the
         language migration rather than arriving with it. */
      expect(
        Buffer.byteLength(server.stdout, "utf8"),
        "if this is now 65536 the byte/char defect is fixed — delete this pin and " +
          "make the fixture agree on both engines",
      ).toBe(80_001);
    },
    FIXTURE_TIMEOUT_MS,
  );

  it.runIf(serverAvailable)(
    "a runaway loop is the learner's own outcome, not an outage",
    async () => {
      const f = fixture("runaway-loop");
      const server = await runServer(f.source, f.stdin, f.serverTimeLimitMs);
      expect(server.status).toBe("time_limit_exceeded");
      expect(server.infrastructureError, "December's whole month depends on this").toBe(false);
      /* And the compile did NOT come out of the learner's budget: 1 200 ms is
         far shorter than a build, so if the two stages shared a clock this
         fixture would be indistinguishable from a correct program. */
      expect(server.stdout).toBe("");
    },
    FIXTURE_TIMEOUT_MS,
  );
});

/* -------------------------------------------------------------------------- */
/* Parity is not trust                                                        */
/* -------------------------------------------------------------------------- */

describe("identical output does not make a local result evidence", () => {
  it.runIf(serverAvailable)(
    "the bytes that pass the judge still cannot settle a practice problem",
    async () => {
      /* The point the whole trust model rests on. `m1.p3` is one of the
         practice problems the programme counts toward its «~100 толық дербес
         шешім». Its own solution, run on the judge, produces exactly the bytes
         the checker accepts — and a browser run of the same source would still
         be worth nothing as evidence, because the browser is the party being
         measured.
         The browser half is asserted on the TYPES rather than executed, which
         is the correct half to assert anyway: the guarantee is that no code
         path lets a local result claim the trusted value, and that is a
         statement about `trust.ts`, not about a compiler. */
      const source = septemberSolution("m1.p3");
      const server = await runServer(source, "47");

      expect(server.status).toBe("ok");
      expect(checkOutput(server.stdout, "11"), "the judge accepts it").toBe(true);

      expect(trustSatisfies("independent_evidence", "client_local")).toBe(false);
      expect(trustSatisfies("independent_evidence", "server_verified")).toBe(true);
      /* And on a lesson step, where the programme deliberately DOES accept a
         browser result, the same value settles it. Both directions, so this
         cannot pass by the policy having been switched off. */
      expect(trustSatisfies("lesson_guided", "client_local")).toBe(true);
    },
    FIXTURE_TIMEOUT_MS,
  );
});

/* -------------------------------------------------------------------------- */
/* The gaps, stated                                                           */
/* -------------------------------------------------------------------------- */

describe("what this suite cannot prove", () => {
  it.runIf(serverAvailable)(
    "records which compiler was actually used",
    async () => {
      /* Not a pass/fail so much as a fact the failure output of everything
         above needs. The compiler here is not the judge's and is not the
         browser's; it is whatever this machine has. */
      const version = serverCompilerVersion();
      expect(version, "the harness never asked the compiler what it is").not.toBe("none");
      console.log(`\nPARITY HARNESS COMPILER: ${version}\n`);

      /* And it really is compiling C++17, so a fixture that failed did not fail
         because the standard was wrong. Read from the compiler rather than from
         a flag we passed, which is the same reason the judge probe asks for
         `__cplusplus` instead of trusting a catalogue name. */
      const macro = await runServer(
        "#include <iostream>\nint main() { std::cout << __cplusplus; }\n",
        "",
      );
      expect(macro.status).toBe("ok");
      expect(Number(macro.stdout.trim())).toBe(CPP_STANDARD_MACRO);
    },
    FIXTURE_TIMEOUT_MS,
  );

  it("names the four things this suite would still have to check", () => {
    /* Written as a test so it appears in the run and cannot rot in a comment
       nobody opens. Every item is a statement about THIS suite, not a to-do. */
    const unproven = [
      "the browser engine is not executed at all: 57.5 MB of WebAssembly clang " +
        "over `wasi_unstable`, which node's WASI cannot drive. Every `local` " +
        "column is declared, not measured",
      "the compiler here is this machine's, not the judge's GCC 14 and not the " +
        "browser's Clang 8 — so a libstdc++/libc++ divergence would not show up",
      "LocalExecutionProvider is not Piston and is not Judge0: a judge-specific " +
        "divergence would not show up either",
      "the per-feature parity suite docs/cpp17/CPP17_JUDGE_PARITY.md calls for " +
        "does not exist; the evidence that the engines agree is a manual pass",
    ];
    expect(unproven.length).toBe(4);
    expect(unproven.every((u) => u.length > 60)).toBe(true);
    expect(MONTHS.length, "and all of it is about September; October onward is draft").toBe(9);
  });
});
