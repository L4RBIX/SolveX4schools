import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { checkOutput, DEFAULT_CHECKER } from "@schools/exec/checker";
import type { OutputChecker } from "@schools/exec/checker";
import { BrowserToolchain, browserToolchainMissing, browserToolchainPresent } from "../support/cpp-browser";

/**
 * Every program the curriculum hands a learner, compiled by the compiler that
 * learner actually presses Run on.
 *
 * ## The hole this fills
 *
 * Three compilers touch a child's work:
 *
 *   - **`clang.wasm`**, in their browser, on every Run. Clang 8, libc++, WASI.
 *   - **GCC 14 with libstdc++**, on Judge0, on every Check.
 *   - **whatever `g++` resolves to on the machine running CI**, which is what
 *     certified the curriculum.
 *
 * `tests/school/content-execution.test.ts` compiles all 263 reference solutions
 * against all 2,169 cases — on the third one. `tests/exec/parity-september.test.ts`
 * compares statuses between the server engine and a DECLARED table. And
 * `tests/execution/engines.ts` states the consequence in its own header: "the
 * browser is not executed at all", with a manual pass in
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` as the only evidence the engines agree.
 *
 * So the engine that runs first, most often, and in front of the learner was
 * the one engine no gate had ever run. The failure that hides there is a
 * reference solution that compiles under libstdc++ and not under libc++ —
 * `<bits/stdc++.h>`, a transitive include that comes free on one and not the
 * other, an `abs` overload — which reads to a fourteen-year-old as "the program
 * my teacher gave me is broken", with a green CI behind it.
 *
 * ## What runs here
 *
 * The shipped worker (`src/lib/cpp17/worker.ts`), the shipped 57.5 MB
 * toolchain out of `public/cpp17`, served over HTTP with the content types
 * production serves, driven through the same `init`/`run` protocol the lesson
 * player uses. Not a re-implementation: `tests/support/cpp-browser.ts` stands
 * up a static server and hands the module a worker scope.
 *
 * One case per reference, not all 2,169 — every Run is a fresh compile
 * (~1.5 s), and the question this file asks is "does the learner's compiler
 * accept and agree with this program", which one real case answers. Every case
 * of every block is already executed by `content-execution`, and the two
 * together are the claim: the content is right, and the browser agrees.
 *
 * ## Scope
 *
 * The whole programme by default: 263 references in **145 seconds**, measured,
 * because the toolchain boots once and a compile is about half a second. That
 * is cheap enough that scoping it down would be a false economy — the month a
 * school is not teaching yet is exactly the month whose breakage nobody would
 * notice.
 *
 * `CPP_BROWSER_SCOPE=september` narrows it to the pilot's live month for a
 * faster local loop. The scope in force is printed, and the release gate below
 * refuses to let a CI run pass having checked nothing.
 */

const FULL = process.env.CPP_BROWSER_SCOPE !== "september";
const ALLOW_SKIP = process.env.CPP_BROWSER_ALLOW_SKIP === "1";
const RELEASE_GATE = Boolean(process.env.CI) && !ALLOW_SKIP;
const HAVE = browserToolchainPresent();

interface Reference {
  id: string;
  where: string;
  source: string;
  checker: OutputChecker;
  probe: { input: string; expectedOutput: string; hidden?: boolean };
}

/**
 * The case this file runs, chosen rather than taken.
 *
 * The FIRST VISIBLE case: a visible case's input and expected output are
 * already in the learner's page props, so a failure here can be quoted in full
 * in the message. Hidden only if a block has nothing else — and then the
 * message says so instead of printing the pairing.
 */
function probeCase(cases: { input: string; expectedOutput: string; hidden?: boolean }[]) {
  return cases.find((c) => !c.hidden) ?? cases[0]!;
}

function references(): Reference[] {
  const out: Reference[] = [];
  const months = FULL ? MONTHS : MONTHS.slice(0, 1);
  const take = (where: string, block: unknown) => {
    const b = block as {
      id?: string;
      referenceSolution?: string;
      cases?: { input: string; expectedOutput: string; hidden?: boolean }[];
      checker?: OutputChecker;
    };
    if (typeof b.id !== "string" || !b.referenceSolution || !b.cases?.length) return;
    out.push({
      id: b.id,
      where,
      source: b.referenceSolution,
      checker: b.checker ?? DEFAULT_CHECKER,
      probe: probeCase(b.cases),
    });
  };
  for (const month of months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) for (const block of lesson.blocks) take(lesson.id, block);
    }
    for (const block of month.assessment?.blocks ?? []) take(month.assessment!.id, block);
    for (const task of (month as unknown as { practice?: unknown[] }).practice ?? []) {
      take(`m${month.index}/practice`, task);
    }
  }
  return out;
}

const REFERENCES = references();
const toolchain = new BrowserToolchain();
let initMs = 0;

beforeAll(async () => {
  if (!HAVE) return;
  ({ initMs } = await toolchain.start());
}, 180_000);

afterAll(async () => {
  if (HAVE) await toolchain.stop();
});

describe("the compiler a learner presses Run on", () => {
  it("is present, and this gate says so out loud", () => {
    console.log(
      `[browser-toolchain] ${HAVE ? "present" : "ABSENT"} · scope: ${FULL ? "whole programme" : "September"} · ` +
        `${REFERENCES.length} references · boot ${initMs} ms · ` +
        `release gate: ${RELEASE_GATE ? "enforced" : "advisory"}`,
    );
    expect(
      HAVE || !RELEASE_GATE,
      `\nThe shipped C++ toolchain is missing (${browserToolchainMissing().join(", ")}), and this is a release gate.\n` +
        `${REFERENCES.length} reference solutions would be skipped and this file would report PASS\n` +
        `having compiled nothing in the engine every learner actually uses.\n` +
        `Run \`npm run cpp17:sync\`, or set CPP_BROWSER_ALLOW_SKIP=1 to accept a run that checks nothing.\n`,
    ).toBe(true);
  });

  it("has content to compile", () => {
    /* A collector that silently stopped finding blocks would make every
       assertion below vacuously true — the shape of gate this repository has
       already been bitten by twice. */
    expect(REFERENCES.length).toBeGreaterThanOrEqual(FULL ? 200 : 25);
  });

  it.runIf(HAVE)("boots the whole toolchain before it will run anything", () => {
    /* The preload invariant from `first-run-preload`, observed rather than
       read: `ready` is not posted until clang and lld are resident, so the
       first compile below is a compile and not a 50 MB download billed to a
       compile's clock. */
    expect(initMs).toBeGreaterThan(0);
  });
});

describe("every reference solution, in the learner's own compiler", () => {
  for (const ref of REFERENCES) {
    it.runIf(HAVE)(
      `${ref.id} (${ref.where})`,
      async () => {
        const stdin = ref.probe.input.endsWith("\n") ? ref.probe.input : `${ref.probe.input}\n`;
        const run = await toolchain.run(ref.source, stdin);

        /*
         * Compilation first, and separately. `syntax_error` from this engine on
         * a program GCC accepts is THE defect this file exists to catch, and it
         * needs to say so in its own words rather than as "expected 7, got ''".
         */
        expect(
          run.status !== "syntax_error",
          `${ref.id} (${ref.where}) does not compile in the browser toolchain, ` +
            `though CI's compiler accepted it:\n${run.stderr}\n\n${ref.source}`,
        ).toBe(true);

        expect(
          run.status,
          `${ref.id} (${ref.where}) did not run cleanly: ${run.status}\n${run.stderr}`,
        ).toBe("ok");

        /* The same comparison the judge makes, with the block's own checker —
           so "the browser agrees" and "the judge accepts" cannot quietly mean
           two different things. */
        expect(
          checkOutput(run.stdout, ref.probe.expectedOutput, ref.checker),
          `${ref.id} (${ref.where}) disagrees with the curriculum in the BROWSER engine.\n` +
            `checker:  ${JSON.stringify(ref.checker)}\n` +
            (ref.probe.hidden
              ? `case:     [hidden — not printed]\n`
              : `input:    ${JSON.stringify(ref.probe.input)}\n` +
                `expected: ${JSON.stringify(ref.probe.expectedOutput)}\n`) +
            `actual:   ${JSON.stringify(run.stdout)}\n` +
            `stderr:   ${run.stderr}\n`,
        ).toBe(true);
      },
      60_000,
    );
  }
});
