import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * Nova must not be able to hand over the judge's secrets, and its output must
 * not be able to reach the judge.
 *
 * Two separate properties, and they fail in opposite directions:
 *
 * - **Outward:** hidden cases and reference solutions must never reach the
 *   model, and must never survive in what the model says. The prompt not
 *   containing them is the first line; the response validator is the second,
 *   and it exists precisely because "nobody has added them to the context
 *   object yet" is a weaker guarantee than something that checks.
 *
 * - **Inward:** nothing a model produces may be executed. The only thing that
 *   reaches the judge is code a learner deliberately submitted. A flow of
 *   `LLM response → automatic execution` is how a prompt-injected model gets a
 *   shell, and the absence of that flow is a property of the code shape rather
 *   than of anyone's good intentions — so it is asserted structurally here.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

function allBlocks(): LessonBlock[] {
  return MONTHS.flatMap((m) => [
    ...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
    ...(m.assessment?.blocks ?? []),
  ]);
}

describe("outward — the prompt carries no judge secrets", () => {
  const promptSrc = read("schools/nova/prompt.ts");

  it("the prompt builder has no field for a solution or a test case", () => {
    /* A structural check, not a string search over a rendered prompt: the
       context type is the whole surface through which anything could arrive,
       so if it has no such field there is nothing to leak. */
    const ctx = promptSrc.slice(
      promptSrc.indexOf("interface PromptContext"),
      promptSrc.indexOf("export function buildSystemPrompt"),
    );
    for (const forbidden of [
      "referenceSolution",
      "cases",
      "expectedOutput",
      "breakingInputs",
      "fixedCode",
      "correctOptionId",
      "buggyLine",
      "expectedPoints",
    ]) {
      expect(ctx, `PromptContext must not accept ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("the hint route never reads a solution into what it sends", () => {
    const routeSrc = read("src/app/api/nova/hint/route.ts");

    /* `referenceSolution` DOES appear in the route — as a forbidden literal
       handed to the VALIDATOR, which is the opposite of a leak. So the check is
       about where it appears, not whether it appears: it must reach
       `forbiddenLiterals` and nothing else.

       The call site is located by name rather than assumed, because the message
       builder has been renamed once already (`buildSystemPrompt` →
       `buildNovaMessages`) and a test that silently matched nothing would pass
       while checking nothing. */
    const marker = ["buildNovaMessages(", "buildSystemPrompt("].find((m) => routeSrc.includes(m));
    expect(marker, "the prompt builder call must be findable").toBeDefined();

    /* Bounded by paren matching, not by a character count. A fixed-width
       window overran into the code that BUILDS `forbiddenLiterals`, which
       legitimately mentions `block.cases` — so the test failed on the very
       guard it exists to protect. A window that can silently include the wrong
       code is a window that will eventually lie in the other direction too. */
    const start = routeSrc.indexOf(marker!) + marker!.length - 1;
    let depth = 0;
    let end = start;
    for (let i = start; i < routeSrc.length; i += 1) {
      if (routeSrc[i] === "(") depth += 1;
      else if (routeSrc[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    expect(end, "the prompt call must be balanced").toBeGreaterThan(start);
    const promptCall = routeSrc.slice(start, end);
    expect(promptCall).not.toContain("referenceSolution");
    expect(promptCall).not.toContain("block.cases");
    expect(promptCall).not.toContain("expectedOutput");
  });
});

describe("outward — the validator refuses a leaked secret", () => {
  it("treats a reference solution as a forbidden literal", async () => {
    const { validateOutput } = await import("@schools/nova/validate");

    const block = allBlocks().find(
      (b): b is Extract<LessonBlock, { referenceSolution: string }> =>
        "referenceSolution" in b &&
        typeof b.referenceSolution === "string" &&
        b.referenceSolution.length >= 6,
    );
    expect(block, "September must have a reference solution to test with").toBeDefined();

    const grant = {
      requested: 1,
      granted: 1,
      capped: false,
      reason: "granted_as_requested" as const,
      explanation: null,
      mayIncludeCode: false,
      mustNotSay: [],
    };

    const leaked = validateOutput(`Мінеки:\n${block!.referenceSolution}`, {
      grant,
      directive: null,
      forbiddenLiterals: [block!.referenceSolution],
    });
    expect(
      leaked.some((v) => v.code === "HIDDEN_TEST_LEAK"),
      "a verbatim reference solution must be refused",
    ).toBe(true);

    /* And the complement, which is the reason this is a whole-string literal
       rather than a line-wise one: the idiom the month exists to TEACH must
       still be sayable. `n = int(input())` is the first line of half of
       September's reference solutions. */
    const teaching = validateOutput("`int()` мәтінді санға айналдырады.", {
      grant,
      directive: null,
      forbiddenLiterals: [block!.referenceSolution],
    });
    expect(
      teaching.some((v) => v.code === "HIDDEN_TEST_LEAK"),
      "teaching the taught idiom must not be blocked",
    ).toBe(false);
  });

  it("treats hidden case values as forbidden literals", async () => {
    const { validateOutput } = await import("@schools/nova/validate");
    const grant = {
      requested: 1,
      granted: 1,
      capped: false,
      reason: "granted_as_requested" as const,
      explanation: null,
      mayIncludeCode: false,
      mustNotSay: [],
    };

    const secret = "23 59 59";
    const leaked = validateOutput(`Тексеріп көр: ${secret}`, {
      grant,
      directive: null,
      forbiddenLiterals: [secret],
    });
    expect(leaked.some((v) => v.code === "HIDDEN_TEST_LEAK")).toBe(true);
  });
});

describe("inward — no model output can reach the judge", () => {
  it("the Nova path never calls the execution provider", () => {
    for (const rel of [
      "src/app/api/nova/hint/route.ts",
      "schools/nova/prompt.ts",
      "schools/nova/enforce.ts",
      "schools/nova/validate.ts",
      "schools/nova/guard.ts",
    ]) {
      const src = read(rel);
      for (const forbidden of ["getExecutionProvider", "runCases", "@schools/exec"]) {
        expect(src, `${rel} must not be able to execute anything`).not.toContain(forbidden);
      }
    }
  });

  it("the judge only ever runs code that arrived as a learner answer", () => {
    /* The submit route is the sole caller of the provider from a request path.
       What it executes is `answer.value` — the text the learner typed into the
       editor — and there is no branch that substitutes anything else. */
    const submit = read("src/app/api/learning/submit/route.ts");
    expect(submit).toContain("getExecutionProvider");
    expect(submit).toContain("answer.value");
    for (const forbidden of ["novaReply", "hintText", "modelOutput", "completion.content"]) {
      expect(submit, "the judge must never run generated text").not.toContain(forbidden);
    }
  });

  it("no client component posts model output to a run or submit endpoint", () => {
    const chat = read("src/components/nova/nova-chat.tsx");
    /* The chat renders tokens. It must not be able to hand them to anything
       that executes — a "run this suggestion" button is exactly the flow that
       turns a prompt injection into code execution. */
    expect(chat).not.toContain("/api/learning/submit");
    expect(chat).not.toContain("/api/exec");
  });
});
