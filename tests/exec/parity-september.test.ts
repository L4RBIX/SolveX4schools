import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock } from "@schools/curriculum/types";
import { isLearnerOutcome, type LocalExecutionStatus } from "@schools/execution/trust";
import { trustSatisfies } from "@schools/execution/trust-policy";
import { isLearnerEvidence, type ExecutionStatus } from "@schools/exec/provider";
import { checkOutput } from "@schools/exec/checker";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";
import {
  ALL_BLOCKS,
  CATEGORY_PAIRS,
  PARITY_FIXTURES,
  septemberSolution,
  type ParityFixture,
} from "../execution/parity-fixtures";
import {
  hasServerPython,
  localPyodideVersion,
  localPythonVersion,
  runLocal,
  runServer,
  serverPythonVersion,
} from "../execution/engines";

/**
 * Local/server parity, executed.
 *
 * ## The claim under test
 *
 * RUN is Pyodide in the learner's browser; SUBMIT is the judge. The hybrid
 * design is only honest if **the same program produces the same result in
 * both** — otherwise a learner iterates against one Python and is graded by
 * another, and the only symptom is a verdict nobody can explain, on a case
 * nobody is allowed to see.
 *
 * Nothing in the repository had ever run a program through both engines. This
 * file does, on real September code: see `tests/execution/parity-fixtures.ts`
 * for the table and where each program came from.
 *
 * ## What is compared, and what deliberately is not
 *
 * **Compared:** the status CATEGORY (via `CATEGORY_PAIRS`, because the two
 * unions are different vocabularies on purpose) and stdout, byte for byte.
 *
 * **Not compared:** stderr text. The two engines are two CPython builds of
 * different vintages — Pyodide ships 3.14.2 today, the judge is pinned to
 * `PYTHON_RUNTIME.version`, and CI's `python3` is whatever the machine has — and
 * error prose changes between minor versions ("invalid syntax" became
 * "expected ':'"). Asserting message equality would fail on a version bump that
 * broke nothing, which is the kind of test people delete. What matters to a
 * learner is which CATEGORY they are in, and that is asserted.
 *
 * **Not proven at all:** see `what this suite cannot prove` at the bottom. Both
 * halves execute here, so this is not a one-sided table dressed up as a parity
 * proof — but it is node's WASM and CI's `python3`, not a browser and not
 * Piston, and the difference is written down rather than hoped away.
 */

const serverAvailable = hasServerPython();

/** Each fixture forks a Python and, once, downloads nothing but boots a WASM. */
const FIXTURE_TIMEOUT_MS = 60_000;

/* -------------------------------------------------------------------------- */
/* The table is about the curriculum, and stays that way                      */
/* -------------------------------------------------------------------------- */

describe("the fixture table is real September code", () => {
  it("has enough fixtures to be worth running", () => {
    /* The guard against a green bar that checked nothing. A refactor that
       emptied the table would otherwise make every parity assertion below
       vacuous — the exact failure mode that let the payload leak survive a
       346-test suite. */
    expect(PARITY_FIXTURES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(PARITY_FIXTURES.map((f) => f.id)).size).toBe(PARITY_FIXTURES.length);
  });

  it("every verbatim fixture IS the block's reference solution, byte for byte", () => {
    let verbatim = 0;
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.provenance.kind !== "verbatim") continue;
      verbatim += 1;
      expect(
        fixture.source,
        `${fixture.id} claims to be ${fixture.provenance.blockId} verbatim and is not. ` +
          `Either the curriculum changed — in which case the parity claim now covers ` +
          `code no learner writes — or the fixture was edited by hand.`,
      ).toBe(septemberSolution(fixture.provenance.blockId));
    }
    expect(verbatim, "the table must be mostly real programs, not mostly mutations").toBeGreaterThan(
      PARITY_FIXTURES.length / 3,
    );
  });

  it("every derived fixture still names a block that exists, and differs from it", () => {
    for (const fixture of PARITY_FIXTURES) {
      if (fixture.provenance.kind !== "derived") continue;
      const original = septemberSolution(fixture.provenance.blockId); // throws if gone
      if (fixture.id.startsWith("syntax-error") || fixture.id === "name-error") {
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

  it("September really does contain no f-string, which is why that fixture is synthesised", () => {
    /* The claim the f-string fixture's provenance makes, checked rather than
       asserted in prose. Only CODE fields are scanned — a Kazakh sentence
       containing `f"` would be a false positive and would train everyone to
       ignore this. */
    const code: string[] = [];
    const push = (value: unknown) => {
      if (typeof value === "string") code.push(value);
    };
    for (const block of ALL_BLOCKS) {
      const b = block as LessonBlock & Record<string, unknown>;
      push(b.referenceSolution);
      push(b.code);
      push(b.starter);
      push(b.fixedCode);
      push(b.template);
      if (Array.isArray(b.lines)) for (const line of b.lines) push((line as { code?: unknown }).code);
    }
    expect(code.length, "no curriculum code was scanned — the walk is broken").toBeGreaterThan(40);
    const withFString = code.filter((c) => /(^|[^A-Za-z0-9_])f["']/.test(c));
    expect(
      withFString,
      "the curriculum has grown an f-string. That is fine — but the f-string " +
        "fixture should now be `verbatim` or `derived` and point at it.",
    ).toEqual([]);
  });

  it("covers every category the hybrid design has to get right", () => {
    /* Named one by one rather than counted, so dropping the syntax-error
       fixtures — the ones guarding a bug the server actually shipped — is a red
       test rather than a smaller number nobody reads. */
    const ids = new Set(PARITY_FIXTURES.map((f) => f.id));
    for (const required of [
      "int-input-square",
      "map-int-split",
      "f-string",
      "true-division-float-repr",
      "floor-div-and-mod",
      "negative-floor-div-and-mod",
      "negative-modulo-parity",
      "syntax-error-missing-colon",
      "name-error",
      "zero-division-error",
      "index-error",
      "eof-reading-past-the-input",
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

  it("maps a syntax error to the server's compile error and nowhere else", () => {
    /* The correspondence this project has already got wrong once. A missing
       bracket is a program that never ran; reporting it as a crash sends a
       fourteen-year-old to look at their logic. */
    const pair = CATEGORY_PAIRS.find((p) => p.local === "syntax_error");
    expect(pair?.server).toBe("compile_error");
    expect(pair?.server, "a syntax error must never be a runtime error").not.toBe("runtime_error");
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
});

/* -------------------------------------------------------------------------- */
/* Both engines, one program                                                  */
/* -------------------------------------------------------------------------- */

function serverCounterpart(local: LocalExecutionStatus): ExecutionStatus | null {
  const pair = CATEGORY_PAIRS.find((p) => p.local === local);
  if (!pair) throw new Error(`no category pair for ${local}`);
  return pair.server;
}

function describeResult(label: string, status: string, stdout: string, stderr: string): string {
  const tail = stderr.split("\n").filter(Boolean).slice(-1)[0] ?? "";
  return `${label}: ${status} stdout=${JSON.stringify(stdout.slice(0, 120))} last stderr line=${JSON.stringify(tail.slice(0, 140))}`;
}

describe("both engines, one program, one answer", () => {
  it("has an interpreter on each side", () => {
    expect(
      serverAvailable,
      `${process.env.EXEC_PYTHON_BIN ?? "python3"} is not on PATH, so the server half of ` +
        "every fixture below was skipped. This is a skip, not a pass.",
    ).toBe(true);
  });

  for (const fixture of PARITY_FIXTURES) {
    const localBlocked = fixture.unexecutable?.local;
    const serverBlocked = fixture.unexecutable?.server;

    it.runIf(serverAvailable)(
      `${fixture.id} — ${fixture.provenance.kind === "synthesised" ? "synthesised" : fixture.provenance.blockId}`,
      async () => {
        const server = serverBlocked
          ? null
          : await runServer(fixture.source, fixture.stdin, fixture.serverTimeLimitMs);
        const local = localBlocked ? null : await runLocal(fixture.source, fixture.stdin);

        if (local) {
          expect(
            local.status,
            `${fixture.id}: Pyodide did not boot under node, so nothing local was ` +
              `measured. ${local.stderr}`,
          ).not.toBe("runtime_unavailable");
          /* Self-describing, always, whatever it printed. The browser may not
             spell the trusted value — `trust.ts` makes that a type error — and
             this is the runtime half of the same statement. */
          expect(local.trust).toBe("client_local");
          expect(local.status, describeResult("local", local.status, local.stdout, local.stderr)).toBe(
            fixture.local,
          );
        }

        if (server) {
          expect(
            server.status,
            describeResult("server", server.status, server.stdout, server.stderr),
          ).toBe(fixture.server);
          /* Every fixture in this table is a learner's program doing a learner's
             thing. None of them may be recorded as an outage. */
          expect(server.infrastructureError, `${fixture.id} was recorded as our failure`).toBe(false);
        }

        if (fixture.stdout !== null) {
          if (local) expect(local.stdout, `${fixture.id} local stdout`).toBe(fixture.stdout);
          if (server) expect(server.stdout, `${fixture.id} server stdout`).toBe(fixture.stdout);
          /* And the same bytes on both sides, stated as its own assertion so a
             failure reads as "the engines disagree" rather than "one of them is
             wrong about the fixture". */
          if (local && server) {
            expect(local.stdout, `${fixture.id}: the two engines printed different bytes`).toBe(
              server.stdout,
            );
          }
        }

        if (!fixture.divergence && local && server) {
          expect(
            serverCounterpart(local.status),
            `${fixture.id}: ${local.status} locally and ${server.status} on the server`,
          ).toBe(server.status);
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
      const local = await runLocal(f.source, f.stdin);
      const server = await runServer(f.source, f.stdin);

      /* Locally: a terminal status of its own, the worker killed, the learner
         told plainly what happened. */
      expect(local.status).toBe("output_limit_exceeded");
      expect(local.truncated).toBe(true);

      /* On the server: no such status exists. The output is cut, `[output
         truncated]` is appended to stderr, and the exit code decides — so a
         program that printed a million lines is `ok` with a short answer, and
         the learner is marked wrong on a case whose failure has nothing to do
         with their logic. `ExecutionStatus` growing an `output_limit_exceeded`
         is the fix; until then this is what happens. */
      expect(server.status).toBe("ok");
      expect(server.stderr).toContain("[output truncated]");
      expect(serverCounterpart("output_limit_exceeded")).toBeNull();

      /* In ASCII the cut lands in the same place, which is the only half of the
         audit's "duplicated on purpose and identically" that survives. */
      expect(Buffer.byteLength(local.stdout, "utf8")).toBe(64 * 1024);
      expect(server.stdout.length).toBe(64 * 1024);
    },
    FIXTURE_TIMEOUT_MS,
  );

  it.runIf(serverAvailable)(
    "the output cap is counted in bytes locally and in UTF-16 code units on the server",
    async () => {
      const f = fixture("output-bomb-kazakh");
      const local = await runLocal(f.source, f.stdin);
      const server = await runServer(f.source, f.stdin);

      /* 40 000 Kazakh characters is 80 000 bytes and 40 000 code units. The
         local `CappedStream` counts bytes, so it cuts; both server providers
         compare `String.length` against the same 65 536, so neither does. */
      expect(local.status).toBe("output_limit_exceeded");
      expect(Buffer.byteLength(local.stdout, "utf8")).toBe(64 * 1024);
      expect(local.stdout.length, "half as many characters as bytes, in Kazakh").toBe(32 * 1024);

      expect(server.status).toBe("ok");
      expect(server.stdout.length, "the server did not truncate at all").toBe(40_001);
      expect(server.stderr, "and told nobody, because nothing was cut").not.toContain(
        "[output truncated]",
      );

      /* What SHOULD be true, and is not:
           expect(Buffer.byteLength(server.stdout, "utf8")).toBe(64 * 1024);
         `trust.ts` says the caps match "exactly, and that is not a coincidence
         to be tidied away: a program whose output is truncated locally must be
         truncated identically on submit"; HYBRID_EXECUTION_AUDIT.md repeats it.
         For any output that is not ASCII, it is false — `schools/exec/limits.ts`
         already made this exact correction for `maxSourceBytes` ("UTF-16 code
         units against a number called Bytes") and the two output caps were not
         corrected with it. Fix is one `Buffer.byteLength` in
         `providers/local.ts` and one in `providers/piston.ts`. */
      expect(
        Buffer.byteLength(server.stdout, "utf8"),
        "if this is now 65536 the byte/char defect is fixed — delete this pin and " +
          "make the fixture agree on both engines",
      ).toBe(80_001);
    },
    FIXTURE_TIMEOUT_MS,
  );

  it.runIf(serverAvailable)(
    "a runaway loop is the learner's own outcome on the server; the local half is pinned elsewhere",
    async () => {
      const f = fixture("runaway-loop");
      const server = await runServer(f.source, f.stdin, f.serverTimeLimitMs);
      expect(server.status).toBe("time_limit_exceeded");
      expect(server.infrastructureError, "December's whole month depends on this").toBe(false);

      /* The local half cannot be executed here at all — see
         `fixture.unexecutable.local`. It is not skipped silently: the runner's
         timer path is driven end to end in tests/exec/pyodide-runner.test.ts
         against a worker that never answers, which is the same code path a real
         `while True: pass` takes. What is unproven in node is only that Pyodide
         genuinely fails to yield, and that is a WebAssembly fact rather than a
         product one. */
      expect(f.unexecutable?.local, "the reason must travel with the fixture").toBeTruthy();
    },
    FIXTURE_TIMEOUT_MS,
  );
});

/* -------------------------------------------------------------------------- */
/* Parity is not trust                                                        */
/* -------------------------------------------------------------------------- */

describe("identical output does not make a local result evidence", () => {
  it.runIf(serverAvailable)(
    "the same bytes that pass the judge still cannot settle a practice problem",
    async () => {
      /* The point the whole trust model rests on, demonstrated rather than
         asserted about types: `m1.p3` is one of the practice problems the
         programme counts toward its «~100 толық дербес шешім». Its own reference
         solution, run in the browser, produces exactly the bytes the judge
         accepts — and is still worth nothing as evidence, because the browser is
         the party being measured. */
      const source = septemberSolution("m1.p3");
      const local = await runLocal(source, "47");
      const server = await runServer(source, "47");

      expect(local.stdout).toBe(server.stdout);
      expect(checkOutput(server.stdout, "11"), "the judge accepts it").toBe(true);

      expect(local.trust).toBe("client_local");
      expect("passed" in local, "a local result has no verdict to give").toBe(false);
      expect(trustSatisfies("independent_evidence", local.trust)).toBe(false);
      expect(trustSatisfies("independent_evidence", "server_verified")).toBe(true);
    },
    FIXTURE_TIMEOUT_MS,
  );
});

/* -------------------------------------------------------------------------- */
/* The gaps, stated                                                           */
/* -------------------------------------------------------------------------- */

describe("what this suite cannot prove", () => {
  it.runIf(serverAvailable)(
    "records which two interpreters were actually compared",
    async () => {
      /* Not a pass/fail so much as a fact the failure output of everything above
         needs. Both engines are CPython; they are not the SAME CPython, and the
         one this compares against is not the one production uses either. */
      await runLocal("pass", "");
      const local = localPythonVersion();
      const server = serverPythonVersion();

      expect(local, "the local engine never reported a Python version").toMatch(/^3\./);
      expect(server, "the server engine never reported a Python version").toMatch(/^3\./);
      expect(localPyodideVersion()).toBeTruthy();

      /* The production judge runs neither of these: it runs the pin. Asserted
         only as "the pin is a Python 3", because the useful statement here is
         the one in the report — Pyodide ships 3.14.x, the judge is pinned to
         3.12.0, and nothing in `python-policy.ts` mentions the browser
         interpreter at all even though that file calls itself the single source
         of truth for "which Python a learner's code runs on". */
      expect(PYTHON_RUNTIME.version).toMatch(/^3\./);
    },
    FIXTURE_TIMEOUT_MS,
  );

  it("names the four things a browser would still have to check", () => {
    /* Written as a test so it appears in the run and cannot rot in a comment
       nobody opens. Every item is a statement about THIS suite, not a to-do. */
    const unproven = [
      "node's WebAssembly is not a browser's: same Pyodide build, different host",
      "there is no real Worker here, so terminate-on-timeout is protocol-tested, not executed",
      "the server side is CI's python3, not the pinned 3.12.0 running on Piston",
      "LocalExecutionProvider is not Piston: a judge-specific divergence would not show up",
    ];
    expect(unproven.length).toBe(4);
    expect(MONTHS.length, "and all of it is about September; October onward is draft").toBe(9);
  });
});
