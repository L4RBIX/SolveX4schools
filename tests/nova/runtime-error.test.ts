import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { findBlock } from "@schools/learning/grade";
import { buildNovaContext } from "@schools/nova/build-context";
import { buildNovaMessages } from "@schools/nova/prompt";
import { executionContextFor } from "@schools/nova/execution-context";
import type { GrantDecision } from "@solvex/nova-core";

/**
 * «Почему ошибка?», asked about a traceback that was never written down.
 *
 * ## The screenshot this exists for
 *
 * A learner types a name that does not exist, presses Run, and their own
 * browser prints:
 *
 *     NameError: name 'ташгук' is not defined
 *
 * They ask Nova why. Nova asks them what error they are seeing.
 *
 * ## Why the previous phase could not have caught this
 *
 * The Nova phase forked before the Pyodide run panel existed, so the branch
 * that fixed "Nova cannot see the screen" had no Run button to be blind to.
 * Its context builder reads the LEDGER, and a local run is deliberately not in
 * the ledger: `run_executed` is written with a scrubbed payload that carries no
 * streams, because an event stored forever must not carry a child's program
 * output. Correct — and it meant the traceback existed only inside a
 * `useState` in `run-panel.tsx` and died when the component unmounted.
 *
 * Meanwhile the shared tree's route already accepted a `lastRun` body field and
 * already built an execution context from it. Nothing had ever sent one.
 *
 * ## What is asserted
 *
 * Not wording — the model's sentences are not a stable thing to pin. What is
 * asserted is that the learner's own code, their own stderr, and the fact that
 * it was a runtime error all reach the payload, and that the prompt explicitly
 * tells the model not to ask for any of it back.
 */

let sql: PgliteExecutor;
let store: LearningStore;
let subjectId: string;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  subjectId = await store.resolveSubject(randomUUID());
}, 60_000);

afterAll(async () => await sql?.close());

/** A block with an editor, so a Run is a thing that can have happened on it. */
const CODE_BLOCK = "m1.l1.b5";

/** The learner's program, and what CPython said about it in their own browser. */
const LEARNER_CODE = 'ташгук = 5\nprint(ташгуk)\n';
const TRACEBACK = [
  "Traceback (most recent call last):",
  '  File "<stdin>", line 2, in <module>',
  "NameError: name 'ташгуk' is not defined",
].join("\n");

const grant = (granted: number, mayIncludeCode = false): GrantDecision => ({
  requested: granted,
  granted,
  capped: false,
  reason: "granted_as_requested",
  explanation: null,
  mayIncludeCode,
  mustNotSay: [],
});

async function payloadFor(opts: { locale: "kk" | "ru"; question: string }) {
  const target = findBlock(CODE_BLOCK)!;
  const episodeId = randomUUID();

  const ctx = await buildNovaContext({
    store,
    subjectId,
    episodeId,
    locale: opts.locale,
    target,
    grant: grant(1),
    directive: null,
    directiveNote: null,
    action: null,
    assessmentCapped: false,
    /* What the browser says is on screen. Untrusted, and the only place the
       editor's current contents can come from. */
    draft: { code: LEARNER_CODE },
  });

  /* And what their program printed, exactly as `nova-chat.tsx` now posts it. */
  const execution = executionContextFor({
    reported: {
      status: "runtime_error",
      stdout: "",
      stderr: TRACEBACK,
      truncated: false,
    },
    events: [],
    blockId: CODE_BLOCK,
  });

  const messages = buildNovaMessages(
    {
      locale: opts.locale,
      monthTitle: "Сентябрь",
      lessonTitle: "Первый урок",
      blockPrompt: ctx.curriculum.prompt,
      skills: ctx.curriculum.skillIds,
      directive: null,
      grant: grant(1),
      context: ctx,
      execution,
    },
    opts.question,
  );

  return {
    system: messages[0].content,
    /* Everything the model reads that is not the policy. Joined because the
       assertion is "it reached the model", not "it reached message index 2". */
    user: messages.slice(1).map((m) => m.content).join("\n\n"),
    messages,
  };
}

describe("a NameError the learner can see and Nova used to have to ask about", () => {
  it("carries the learner's current code and their own stderr to the model", async () => {
    const { user } = await payloadFor({ locale: "ru", question: "Почему ошибка?" });

    /* The editor's contents — not the starter code. This is the field the
       previous phase shipped without and said so. */
    expect(user).toContain("ташгук = 5");
    /* The traceback, verbatim enough to be reasoned about. */
    expect(user).toContain("NameError");
    expect(user).toContain("ташгуk");
  });

  it("tells the model where the code ran, and that a runtime error is what happened", async () => {
    const { system } = await payloadFor({ locale: "ru", question: "Почему ошибка?" });
    expect(system).toContain("EXECUTION STATE");
    /* The status is rendered as a sentence rather than as the enum name — the
       model is being told what happened, not handed a symbol. Asserting the
       phrase keeps this pinned to the meaning instead of to the spelling. */
    expect(system).toContain("crashed part-way through");
    expect(system).toContain("IN THEIR OWN BROWSER");
  });

  it("names the error message among the things it must not ask the learner for", async () => {
    const { system } = await payloadFor({ locale: "ru", question: "Почему ошибка?" });
    /* The whole point. A reply that asks «какая у тебя ошибка?» is the defect,
       and this line is what forbids it. */
    expect(system).toContain("BEFORE YOU ANSWER");
    expect(system).toContain("the error message");
    expect(system).toContain("Do not ask the learner for any of it");
  });

  it("fences both the code and the streams as the learner's own text", async () => {
    const { user } = await payloadFor({ locale: "ru", question: "Почему ошибка?" });
    /* Kind labels live OUTSIDE the content, so a program that prints
       `program_stderr:` cannot relabel itself into another category. */
    expect(user).toContain('kind="program_stderr"');
    expect(user).toContain('kind="current_screen_untrusted"');
  });

  it("does the same in Kazakh — no field is dropped by locale", async () => {
    const ru = await payloadFor({ locale: "ru", question: "Почему ошибка?" });
    const kk = await payloadFor({ locale: "kk", question: "Неге қате?" });

    for (const half of ["system", "user"] as const) {
      expect(kk[half].includes("NameError")).toBe(ru[half].includes("NameError"));
      expect(kk[half].includes("ташгук = 5")).toBe(ru[half].includes("ташгук = 5"));
    }
    expect(kk.system).toContain("BEFORE YOU ANSWER");
    expect(kk.system).toContain("the error message");
  });

  it("says nothing about a run when the learner has not pressed Run", async () => {
    const target = findBlock(CODE_BLOCK)!;
    const ctx = await buildNovaContext({
      store,
      subjectId,
      episodeId: randomUUID(),
      locale: "ru",
      target,
      grant: grant(1),
      directive: null,
      directiveNote: null,
      action: null,
      assessmentCapped: false,
      draft: { code: LEARNER_CODE },
    });

    const messages = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: "Сентябрь",
        lessonTitle: "Первый урок",
        blockPrompt: ctx.curriculum.prompt,
        skills: ctx.curriculum.skillIds,
        directive: null,
        grant: grant(1),
        context: ctx,
        execution: executionContextFor({ reported: undefined, events: [], blockId: CODE_BLOCK }),
      },
      "Почему ошибка?",
    );

    const all = messages.map((m) => m.content).join("\n\n");
    /* "They ran nothing" and "they ran something that printed nothing" are
       different facts, and inventing the second is how Nova ends up discussing
       an error that never happened. */
    expect(all).not.toContain("EXECUTION STATE");
    /* The FENCE, not the word. `program_stderr` is also named in the trust
       boundary section of every system prompt, which describes the kinds a
       fence may carry — that sentence is documentation and is always there. */
    expect(all).not.toContain('kind="program_stderr"');
    /* Their code is still there — the draft does not depend on a run. */
    expect(all).toContain("ташгук = 5");
  });
});
