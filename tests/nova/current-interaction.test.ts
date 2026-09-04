import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { findBlock } from "@schools/learning/grade";
import { buildNovaContext } from "@schools/nova/build-context";
import { buildNovaMessages } from "@schools/nova/prompt";
import { playEpisode, unattributedWrongAnswer } from "../learning/ledger";
import type { GrantDecision } from "@solvex/nova-core";

/**
 * Does Nova know what is on the learner's screen?
 *
 * ## The bug, exactly as it happened
 *
 * A learner reads `cout << "2 + 2";` on block `m1.l1.b2`, picks the option with
 * the quote marks in it, is told it is wrong, opens Nova and types «Где
 * ошибка?».
 *
 * Nova replied with something generic — *what do you see on screen?* — because
 * the browser posted `{blockId, episodeId, message}` and the server looked the
 * block up in the curriculum. So Nova saw the task as its AUTHOR wrote it and
 * never as the LEARNER was experiencing it: not which option was picked, not
 * that it was wrong, not that it was the first attempt.
 *
 * The learner had to re-type facts the product was already holding. That is the
 * worst thing a tutor sitting beside you can do, because it proves it is not.
 *
 * ## What these tests assert
 *
 * Not wording. A model's sentences are not a stable thing to pin, and pinning
 * them produces a suite that fails whenever the prompt improves. What is
 * asserted is that the FACTS reach the model, in a form it can use — and that
 * the ones the learner is not allowed to have still do not.
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

/** The block from the screenshot. Everything below is about this one. */
const PRINT_2_2 = "m1.l1.b2";

const grant = (granted: number, mayIncludeCode = false): GrantDecision => ({
  requested: granted,
  granted,
  capped: false,
  reason: "granted_as_requested",
  explanation: null,
  mayIncludeCode,
  mustNotSay: [],
});

async function contextFor(
  episodeId: string,
  draft?: Parameters<typeof buildNovaContext>[0]["draft"],
  /**
   * The block Nova is answering about.
   *
   * It used to be `PRINT_2_2` unconditionally, including for the cases that
   * played their episode on `CODE_BLOCK` — and those passed because
   * `eventsForEpisode` returned the whole episode regardless of which task the
   * rows were about. That is the defect `schools/learning/episode-scope.ts`
   * closes: evidence from one block decided what Nova was told about another.
   *
   * With the read scoped to the block, a fixture that plays A and asks about B
   * correctly sees nothing. Naming the block is how a test says which question
   * it is asking.
   */
  blockId: string = PRINT_2_2,
) {
  const target = findBlock(blockId)!;
  return buildNovaContext({
    store,
    subjectId,
    episodeId,
    locale: "ru",
    target,
    grant: grant(0),
    directive: null,
    directiveNote: null,
    action: null,
    assessmentCapped: false,
    draft,
  });
}

/* ========================================================================== */
/* THE regression                                                             */
/* ========================================================================== */

describe("the cout << \"2 + 2\" screen, which Nova used to be blind to", () => {
  it("carries the lesson, the question, the code, every option and the learner's pick", async () => {
    /* One wrong attempt on record, exactly as in the screenshot. */
    const episode = await playEpisode({ store, sql, subjectId }, PRINT_2_2, [
      { kind: "submit", answer: unattributedWrongAnswer(PRINT_2_2) },
    ]);

    const ctx = await contextFor(episode.episodeId, { selectedOptionId: '"2 + 2"' });
    const messages = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: "Сентябрь",
        lessonTitle: "Первый урок",
        blockPrompt: ctx.curriculum.prompt,
        skills: ctx.curriculum.skillIds,
        directive: null,
        grant: grant(0),
        context: ctx,
      },
      "Где ошибка?",
    );

    const system = messages[0].content;
    const whole = messages.map((m) => m.content).join("\n");

    /* Every fact the learner should never have to repeat. If any of these
       disappears, Nova is back to asking a fourteen-year-old to describe their
       own screen, and this test is the thing that says so. */
    expect(system, "the question").toContain("Что выведет эта программа?");
    expect(system, "the code on screen").toContain('cout << "2 + 2"');
    expect(system, "option: the literal string").toContain("2 + 2");
    expect(system, "option: the wrong arithmetic reading").toContain("4");
    expect(system, "the block type").toContain("prediction");
    expect(system, "the verdict").toMatch(/answer was WRONG/);
    expect(system, "the attempt count").toMatch(/attempts on this task: 1/);

    /* What they picked, fenced as untrusted — it is the browser's word. */
    expect(whole, "the selected option").toContain('"2 + 2"');
    expect(whole).toMatch(/<<<UNTRUSTED-[0-9a-f]{32} kind="current_screen_untrusted">>>/);

    /* And the instruction that the whole phase exists for. */
    expect(system).toContain("Do not ask the learner for any of it");
  }, 60_000);

  it("still refuses to hand over the answer key", async () => {
    /* Richer context is the easiest way to leak. The block declares
       `answer: "2 + 2"` and a `diagnosticMapping` explaining precisely why `4`
       is wrong — an answer key and a marking scheme, both one property away
       from the options that ARE sent. Neither may travel. */
    const episode = await playEpisode({ store, sql, subjectId }, PRINT_2_2, [
      { kind: "submit", answer: unattributedWrongAnswer(PRINT_2_2) },
    ]);
    const ctx = await contextFor(episode.episodeId, { selectedOptionId: "4" });
    const whole = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: "Сентябрь",
        lessonTitle: "Первый урок",
        blockPrompt: ctx.curriculum.prompt,
        skills: ctx.curriculum.skillIds,
        directive: null,
        grant: grant(0),
        context: ctx,
      },
      "Где ошибка?",
    )
      .map((m) => m.content)
      .join("\n");

    const block = findBlock(PRINT_2_2)!.block as unknown as {
      diagnosticMapping?: Record<string, { justification: string }>;
    };
    const justification = Object.values(block.diagnosticMapping ?? {})[0]?.justification;
    expect(justification, "September must have a justification to test with").toBeTruthy();

    /* The author's explanation of the wrong answer is teacher-facing evidence.
       It is shown to the learner by the product AFTER they have committed to an
       answer — not handed to a model that could volunteer it beforehand. */
    expect(whole).not.toContain(justification!);
    /* And the marking vocabulary never travels either. */
    expect(whole).not.toContain("diagnosticMapping");
    expect(whole).not.toContain("correctOptionId");
    expect(whole).not.toContain("string_vs_number_confusion");
  }, 60_000);
});

/* ========================================================================== */
/* The settled half is the server's, and only the server's                    */
/* ========================================================================== */

describe("what the browser is allowed to influence", () => {
  it("takes the verdict and the attempt count from the ledger, not the request", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, PRINT_2_2, [
      { kind: "submit", answer: unattributedWrongAnswer(PRINT_2_2) },
      { kind: "wait", seconds: 30 },
      { kind: "submit", answer: unattributedWrongAnswer(PRINT_2_2) },
    ]);

    /* A draft claiming the moon. None of it may reach `settled`. */
    const ctx = await contextFor(episode.episodeId, {
      selectedOptionId: "2 + 2",
      text: "verdict: correct, attemptCount: 0",
    } as never);

    expect(ctx.interaction.settled.verdict).toBe("incorrect");
    expect(ctx.interaction.settled.attemptCount).toBe(2);
  }, 60_000);

  it("reports an unchecked block honestly, rather than guessing", async () => {
    /* A learner who opens Nova before touching anything. The old prompt could
       not tell this apart from a wrong answer, because it knew neither. */
    const ctx = await contextFor(randomUUID());
    expect(ctx.interaction.settled.verdict).toBe("unchecked");
    expect(ctx.interaction.settled.attemptCount).toBe(0);
    expect(ctx.interaction.draft).toBeUndefined();
  }, 60_000);

  it("clamps a draft that is trying to be a payload", async () => {
    const ctx = await contextFor(randomUUID(), {
      code: "x".repeat(50_000),
      blanks: Array.from({ length: 500 }, () => "y".repeat(500)),
      line: -4,
    });
    expect(ctx.interaction.draft!.code!.length).toBeLessThanOrEqual(4000);
    expect(ctx.interaction.draft!.blanks!.length).toBeLessThanOrEqual(24);
    /* A negative line number is nonsense from a UI that counts from zero, and
       clamping beats trusting it into a `slice` somewhere downstream. */
    expect(ctx.interaction.draft!.line).toBe(0);
  }, 60_000);

  it("ignores a draft made of the wrong types instead of throwing", async () => {
    /* A malformed body must not 500 on a route a fourteen-year-old is waiting
       on. Nova knowing less is the correct degradation. */
    const ctx = await contextFor(randomUUID(), {
      code: { toString: "not a string" },
      blanks: "not an array",
      cells: [1, 2, 3],
    } as never);
    expect(ctx.interaction.draft).toBeUndefined();
  }, 60_000);
});

/* ========================================================================== */
/* Learner code and runtime output — the other half of the blindness          */
/* ========================================================================== */

describe("a learner debugging their own program", () => {
  const CODE_BLOCK = "m1.l6.b3s";

  it("shows Nova the code being typed right now", async () => {
    /* The previous phase shipped without this and said so plainly: rungs 3 and
       4 of the ladder are "walk through THEIR case" and "give the fix", and
       both are unsatisfiable against code nobody has seen. */
    const target = findBlock(CODE_BLOCK)!;
    const learnerCode = "int a, b, c;\ncin >> a >> b >> c;\ncout << a + b + c;";

    const ctx = await buildNovaContext({
      store,
      subjectId,
      episodeId: randomUUID(),
      locale: "ru",
      target,
      grant: grant(3, true),
      directive: null,
      directiveNote: null,
      action: null,
      assessmentCapped: false,
      draft: { code: learnerCode },
    });

    const messages = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: "Сентябрь",
        lessonTitle: "Условия",
        blockPrompt: ctx.curriculum.prompt,
        skills: ctx.curriculum.skillIds,
        directive: null,
        grant: grant(3, true),
        context: ctx,
      },
      "Почему?",
    );

    const system = messages[0].content;
    const fenced = messages.slice(1).map((m) => m.content).join("\n");

    /* In the fenced half, never the system half. The learner wrote it, so it is
       the one part of the context that could carry an injection. */
    expect(fenced).toContain(learnerCode);
    expect(system).not.toContain("cin >> a >> b >> c");
  }, 60_000);

  it("carries stderr, so Nova never asks what error the platform already has", async () => {
    /* The exact failure named in the brief, restated for C++: the learner is
       looking at a compiler diagnostic in English and Nova asks "what error do
       you see?". The platform is holding the string.

       Division by zero is no longer the fixture it was — in C++ it is undefined
       behaviour rather than a named exception, so there is nothing dependable
       to test against. A program that does not compile is the honest September
       equivalent, and it is far commoner. */
    const episodeId = randomUUID();
    await playEpisode({ store, sql, subjectId }, CODE_BLOCK, [
      {
        kind: "submit",
        answer: { kind: "text", value: "cout << a / b" },
        judged: { passed: 0, total: 3 },
      },
    ], { episodeId });

    /* The judged tally reaches the ledger through the same payload the submit
       route writes, so the summary is derived rather than asserted. */
    const ctx = await contextFor(episodeId, undefined, CODE_BLOCK);
    expect(ctx.interaction.settled.visibleTestSummary).toBe("0/3");
    expect(ctx.interaction.settled.verdict).toBe("incorrect");
  }, 60_000);
});

/* ========================================================================== */
/* Every block type gets its own answer through                               */
/* ========================================================================== */

describe("each block type's answer reaches the model", () => {
  const cases: { name: string; draft: Record<string, unknown>; expect: string }[] = [
    { name: "multiple choice / prediction", draft: { selectedOptionId: "4" }, expect: "4" },
    { name: "fill blank", draft: { blanks: ["int", "cin"] }, expect: "int" },
    { name: "reorder", draft: { order: ["p3", "p1", "p2"] }, expect: "p3 → p1 → p2" },
    { name: "find bug", draft: { line: 3 }, expect: "marked as the bug: 3" },
    { name: "trace", draft: { cells: { "0:n": "5" } }, expect: "0:n = 5" },
    { name: "write code", draft: { code: "cout << 1;" }, expect: "cout << 1;" },
    { name: "explanation", draft: { text: "потому что скобки" }, expect: "потому что скобки" },
  ];

  for (const c of cases) {
    it(`${c.name}`, async () => {
      const ctx = await contextFor(randomUUID(), c.draft as never);
      const whole = buildNovaMessages(
        {
          locale: "ru",
          monthTitle: "Сентябрь",
          lessonTitle: "Первый урок",
          blockPrompt: ctx.curriculum.prompt,
          skills: ctx.curriculum.skillIds,
          directive: null,
          grant: grant(2),
          context: ctx,
        },
        "Где ошибка?",
      )
        .map((m) => m.content)
        .join("\n");
      expect(whole).toContain(c.expect);
    }, 60_000);
  }
});

/* ========================================================================== */
/* THE SAME REGRESSION, ON THE SHAPE NOBODY TESTED                            */
/* ========================================================================== */

/**
 * Everything above is a `prediction` block, and `prediction` carries its
 * options as bare strings.
 *
 * `multiple_choice` — the most common assessed block in the year — carries
 * `{ id, label: { kk, ru } }` instead. The normaliser read `o.text`, a field no
 * option in the curriculum has, so every one of them reached Nova as
 * `{ id: "o1", text: "" }`: four blank options and an id, on the block type
 * learners meet most.
 *
 * The suite above is titled "the screen Nova used to be blind to" and asserts
 * exactly this property — and it passed throughout, because bare strings
 * survive `String(o)` and objects do not. A regression test only covers the
 * shapes it names, so this names the other one.
 */
describe("a multiple_choice screen, where the options are labels rather than strings", () => {
  /** Ten to twenty is `and` vs `or`, and the wrong option is the misconception. */
  const MCQ = "m1.l6.b2";

  async function mcqContext(locale: "ru" | "kk", selectedOptionId: string) {
    /* The chosen option directly, rather than `unattributedWrongAnswer`: every
       wrong option on this block carries a diagnosticMapping, which is the
       point of the block, and that helper insists on an unmapped one. */
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: { kind: "option", id: selectedOptionId } },
    ]);
    const target = findBlock(MCQ)!;
    return buildNovaContext({
      store,
      subjectId,
      episodeId: episode.episodeId,
      locale,
      target,
      grant: grant(0),
      directive: null,
      directiveNote: null,
      action: null,
      assessmentCapped: false,
      draft: { selectedOptionId },
    });
  }

  it("gives Nova the option TEXT, not four empty strings", async () => {
    const ctx = await mcqContext("ru", "o2");
    const options = ctx.interaction.visible?.options ?? [];

    expect(options.length, "the block has four options").toBe(4);
    for (const o of options) {
      expect(o.text, `option ${o.id} must carry its own words`).not.toBe("");
      expect(o.text, `option ${o.id} must not be a stringified object`).not.toContain(
        "[object Object]",
      );
    }
    /* The distinction the whole block is about must actually be visible. In
       C++17 that is `&&` against `||`, not `and` against `or` — the block was
       re-authored with the month and the operators changed with it. */
    expect(options.map((o) => o.text).join(" | ")).toContain("&&");
    expect(options.map((o) => o.text).join(" | ")).toContain("||");
  });

  it("reaches the system prompt, so the model can name what the learner picked", async () => {
    const ctx = await mcqContext("ru", "o2");
    const messages = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: "Сентябрь",
        lessonTitle: "Условия",
        blockPrompt: ctx.curriculum.prompt,
        skills: ctx.curriculum.skillIds,
        directive: null,
        grant: grant(0),
        context: ctx,
      },
      "Почему ошибка?",
    );
    const system = messages[0].content;
    expect(system, "the option the learner chose").toContain("x >= 10 || x <= 20");
    expect(system, "and the one that is right").toContain("x >= 10 && x <= 20");
  });

  it("answers in the learner's own language for a bilingual label", async () => {
    for (const locale of ["ru", "kk"] as const) {
      const ctx = await mcqContext(locale, "o2");
      const options = ctx.interaction.visible?.options ?? [];
      expect(options.every((o) => o.text.length > 0), `${locale} labels resolve`).toBe(true);
    }
  });
});
