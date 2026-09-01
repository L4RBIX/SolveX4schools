import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { CAPABILITY_PROMPT_HEADING, capabilityFor } from "@schools/curriculum/capability";
import { buildNovaMessages, buildSystemPrompt, type PromptContext } from "@schools/nova/prompt";
import { CPP17_FRAME, CPP17_PROMPT_HEADING } from "@schools/nova/cpp17";
import {
  EXECUTION_PROMPT_HEADING,
  executionContextFor,
} from "@schools/nova/execution-context";
import { DIAGNOSTIC_PROMPT_HEADING } from "@schools/nova/diagnostics";
import type { LessonBlock, Locale } from "@schools/curriculum/types";
import type { NovaContext } from "@schools/nova/context";
import type { GrantDecision } from "@solvex/nova-core";
import type { NovaDirective } from "@solvex/learning-intelligence-core";

/**
 * Exactly what leaves this server.
 *
 * `docs/nova/PRIVACY.md` makes promises to a school, to parents, and to
 * whoever signs the data-processing agreement. This file is what makes them
 * true rather than intended, and it is written almost entirely as NEGATIVE
 * assertions — because every promise in that document is a negative, and a
 * negative is the only kind of claim that survives someone later "helpfully"
 * enriching the context object.
 *
 * The strongest guarantee here is structural: `PromptContext` has no field for
 * another learner, a roster, a name or a hidden test, so there is nothing to
 * leak. But structure is a claim about today's type definition. These tests are
 * the claim about tomorrow's.
 */

const SEPT = MONTHS[0];
const LOCALES: Locale[] = ["kk", "ru"];
const LEVELS = [0, 1, 2, 3, 4];

function grantAt(level: number): GrantDecision {
  return {
    requested: 4,
    granted: level,
    capped: level < 4,
    reason: "granted_as_requested",
    explanation: null,
    mayIncludeCode: true,
    mustNotSay: [],
  };
}

interface Situated {
  lessonTitle: string;
  block: LessonBlock;
}

/** Every September block, lessons and the monthly assessment alike. */
function septemberBlocks(): Situated[] {
  const out: Situated[] = [];
  for (const unit of SEPT.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) out.push({ lessonTitle: lesson.title.kk, block });
    }
  }
  for (const block of SEPT.assessment?.blocks ?? []) {
    out.push({ lessonTitle: SEPT.assessment!.title.kk, block });
  }
  return out;
}

/**
 * The DEGRADED shape: no block id, no execution, no ledger context.
 *
 * Real — the dev lab and a block outside the capability walk build exactly
 * this — but it is not what a learner's request produces. The privacy
 * assertions below use it deliberately: they are about what CANNOT be in the
 * prompt, and the smallest prompt is the strictest place to assert an absence.
 * The size assertions use `productionPromptFor` instead; see section 4.
 */
function promptFor(s: Situated, locale: Locale, level: number): string {
  return buildSystemPrompt(degradedContext(s, locale, level), "0".repeat(32));
}

function degradedContext(s: Situated, locale: Locale, level: number): PromptContext {
  const b = s.block as LessonBlock & {
    prompt?: Record<Locale, string>;
    code?: string;
  };
  return {
    locale,
    monthTitle: SEPT.title[locale],
    lessonTitle: s.lessonTitle,
    blockPrompt: b.prompt ? b.prompt[locale] : s.lessonTitle,
    blockCode: typeof b.code === "string" ? b.code : undefined,
    skills: s.block.skillRefs,
    capability: capabilityFor(s.block.id),
    directive: null,
    grant: grantAt(level),
  };
}

/* -------------------------------------------------------------------------- */
/* The shape production actually sends                                        */
/* -------------------------------------------------------------------------- */

/**
 * What `src/app/api/nova/hint/route.ts` assembles, reproduced.
 *
 * Not a smaller stand-in for it. The route passes five things this file used to
 * leave out — the block id, the directive, the execution evidence, the ledger
 * context and the learner's draft — and every one of them adds a section to the
 * system message. Measuring without them was measuring a prompt nobody sends:
 * 8.4 kB against a real 12.5 kB, with the whole difference unmeasured.
 *
 * The learner-authored halves are held at a fixed, realistic size rather than
 * at their caps, and that is the line this fixture draws on purpose. A judge's
 * `stdout` and `stderr` may be 800 characters each (`MAX_STREAM_CHARS`) and a
 * reported run's `stderr` 1 200 (`NOVA_OUTPUT_LIMITS`); those are the learner's
 * own data, they are already bounded where they are read, and calibrating a
 * ceiling on their maximum would leave 3 kB of slack for generated context to
 * grow into unnoticed. What this fixture pins is everything the PLATFORM
 * generates around them.
 */
const COMPILER_ERROR = [
  "main.cpp:5:19: error: expected ';' after expression",
  '    cout << "Salem!"',
  "                   ^",
  "                   ;",
  "1 error generated.",
].join("\n");

const PROGRAM_STDOUT = "17\n";

/** A directive with everything switched on: a named difficulty and a mustNotSay. */
const DIRECTIVE: NovaDirective = {
  mode: "explain",
  mayNameMisconception: true,
  namedMisconception: "strict_vs_inclusive_boundary",
  maxHintLevel: 4,
  mayIncludeCode: true,
  mustNotSay: ["the answer", "just write"],
  opening: "You have tried this twice. What did you expect that test to print?",
};

function ledgerContext(s: Situated, locale: Locale, level: number): NovaContext {
  const b = s.block as LessonBlock & {
    prompt?: Record<Locale, string>;
    code?: string;
    options?: unknown[];
  };
  const code = typeof b.code === "string" ? b.code : undefined;
  return {
    /* Pseudonymous, and the privacy assertions above run against the degraded
       shape precisely so that no fixture of mine can make them pass. */
    learner: { subjectId: "00000000-0000-0000-0000-000000000000", locale },
    curriculum: {
      monthTitle: SEPT.title[locale],
      lessonTitle: s.lessonTitle,
      blockId: s.block.id,
      blockType: s.block.type,
      prompt: b.prompt ? b.prompt[locale] : s.lessonTitle,
      skillIds: s.block.skillRefs,
      capability: capabilityFor(s.block.id),
      mode: "lesson",
    },
    interaction: {
      visible: {
        code,
        options: Array.isArray(b.options)
          ? b.options.slice(0, 12).map((o, i) =>
              typeof o === "string"
                ? { id: o, text: o }
                : { id: String(i), text: String((o as { id?: unknown }).id ?? i) },
            )
          : undefined,
      },
      settled: {
        verdict: "incorrect",
        attemptCount: 2,
        deliveredHintLevel: level - 1,
        attemptSinceLastHelp: true,
        stdout: PROGRAM_STDOUT,
        stderr: COMPILER_ERROR,
        visibleTestSummary: "2 of 5 checks passed",
      },
      draft: { code: code ?? CPP17_FRAME },
    },
    intelligence: {
      relevantSkills: s.block.skillRefs.map((id) => ({ skillId: id, label: id })),
      /* `MAX_RELEVANT_EVIDENCE` of them — the most the selector will ever pass. */
      recentEvidence: [
        { outcome: "failed", skillId: s.block.skillRefs[0] ?? null, daysAgo: 0, difficulty: "off_by_one" },
        { outcome: "solved_after_help", skillId: s.block.skillRefs[0] ?? null, daysAgo: 2 },
        { outcome: "failed", skillId: null, daysAgo: 3 },
        { outcome: "solved_alone", skillId: null, daysAgo: 6 },
      ],
      action: "DIAGNOSE",
      directive: DIRECTIVE,
      directiveNote: null,
    },
    assistance: { grant: grantAt(level), assessmentCapped: false },
  };
}

function productionContext(s: Situated, locale: Locale, level: number): PromptContext {
  return {
    ...degradedContext(s, locale, level),
    blockId: s.block.id,
    directive: DIRECTIVE,
    execution: executionContextFor({
      reported: { status: "syntax_error", stdout: PROGRAM_STDOUT, stderr: COMPILER_ERROR },
      events: [],
      blockId: s.block.id,
    }),
    context: ledgerContext(s, locale, level),
  };
}

function productionPromptFor(s: Situated, locale: Locale, level: number): string {
  return buildSystemPrompt(productionContext(s, locale, level), "0".repeat(32));
}

/* -------------------------------------------------------------------------- */
/* 1. Structure — there is no field to leak through                           */
/* -------------------------------------------------------------------------- */

describe("the context object has nowhere to put another learner", () => {
  it("accepts only the curriculum, the policy and the caller's own position", () => {
    /* A type-level assertion, executed. If someone adds `learnerName` or
       `classmates` to PromptContext, this stops compiling — which is the point:
       the review conversation happens at the moment the field is added, not
       after a prompt containing eighteen children's names has been sent
       abroad. */
    const allowed = [
      "locale",
      "monthTitle",
      "lessonTitle",
      "blockPrompt",
      "blockCode",
      "skills",
      /* Where in the nine months the task sits. Added with the C++17 sequence
         gate, and it is a position in the CURRICULUM — `m1.l7.b4` — not a
         person. It carries nothing about who is asking. */
      "blockId",
      "directive",
      "grant",
      "capability",
      "briefOffTopic",
      /* Both already existed and neither was listed, so the two `Exclude`
         assertions below were vacuously satisfied and this list had stopped
         being the review gate it is here to be. Listed now: `execution` is
         where the code ran, `context` is what the ledger proves. Both are about
         the learner's own work and neither can name anybody else. */
      "execution",
      "context",
    ] as const;

    type Allowed = (typeof allowed)[number];
    type Actual = keyof Parameters<typeof buildSystemPrompt>[0];

    /* Both directions. `never` on either line means the two lists have drifted:
       a new field on the context, or a field removed from under this test. */
    const missing: Exclude<Actual, Allowed>[] = [];
    const extra: Exclude<Allowed, Actual>[] = [];
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
    expect(allowed).toHaveLength(13);
  });
});

/* -------------------------------------------------------------------------- */
/* 2. The judge's secrets, over the whole month                               */
/* -------------------------------------------------------------------------- */

describe("no judge secret reaches the model, for any block, level or language", () => {
  /* The whole month, both languages, all five rungs. Not a sampled block: the
     one block somebody forgets is exactly the one whose reference solution is
     interesting, and September is small enough that there is no excuse for
     sampling. */
  const blocks = septemberBlocks();

  it("has a month to test against", () => {
    expect(blocks.length).toBeGreaterThan(40);
  });

  it("never carries a hidden case input or expected output", () => {
    const leaks: string[] = [];

    for (const s of blocks) {
      const cases = (s.block as LessonBlock & {
        cases?: { input: string; expectedOutput: string; hidden?: boolean }[];
      }).cases;
      if (!cases?.length) continue;

      /* What the learner can already see: the visible cases, and the task
         statement itself.
         This subtraction is the difference between a test that means something
         and one that fires on `m1.l6.b2b`, whose hidden cases expect the word
         `discount` — which is also what its VISIBLE case expects and what its
         own prompt asks the learner to print. A word the task tells you to
         output is not a secret, and a test that calls it one gets deleted by
         the third person who trips over it. The secret in that block is which
         INPUTS are checked (11, 12, 65, 66), and those are asserted below like
         every other. */
      const publicKnowledge = [
        ...cases.filter((c) => !c.hidden).flatMap((c) => [c.input, c.expectedOutput]),
        (s.block as LessonBlock & { prompt?: Record<Locale, string> }).prompt?.kk ?? "",
        (s.block as LessonBlock & { prompt?: Record<Locale, string> }).prompt?.ru ?? "",
        (s.block as LessonBlock & { code?: string }).code ?? "",
      ].join("\n");

      const secrets = cases
        .filter((c) => c.hidden)
        .flatMap((c) => [c.input, c.expectedOutput])
        /* Short literals are excluded, and this is a real limitation rather
           than a convenience: a hidden expected output of `4` cannot be
           distinguished from arithmetic in a sentence, so no test could assert
           its absence without failing on every explanation Nova gives. The
           output validator draws the same line at six characters, and
           `tests/nova/judge-secrets.test.ts` covers what happens when a longer
           one does appear in a response. */
        .filter((v) => typeof v === "string" && v.trim().length >= 6)
        .filter((v) => !publicKnowledge.includes(v));
      if (!secrets.length) continue;

      for (const locale of LOCALES) {
        for (const level of LEVELS) {
          const prompt = promptFor(s, locale, level);
          for (const secret of secrets) {
            if (prompt.includes(secret)) {
              leaks.push(`${s.block.id} · ${locale} · L${level} · ${JSON.stringify(secret)}`);
            }
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("never carries a reference solution", () => {
    const leaks: string[] = [];

    for (const s of blocks) {
      const ref = (s.block as LessonBlock & { referenceSolution?: string }).referenceSolution;
      if (typeof ref !== "string" || ref.trim().length < 6) continue;

      for (const locale of LOCALES) {
        for (const level of LEVELS) {
          if (promptFor(s, locale, level).includes(ref)) {
            leaks.push(`${s.block.id} · ${locale} · L${level}`);
          }
          /* Line-wise too. A prompt that quoted the solution one line at a time
             would pass the whole-string check while handing over the answer,
             and `blockCode` — the authored starter — is a legitimate reason for
             SOME lines to appear. So the test is on the lines that carry the
             answer: those the starter does not already contain.

             The frame is excluded on the same principle, and C++ is the reason
             it had to be said out loud. `#include <iostream>`, `using namespace
             std;` and `int main() {` are in EVERY reference solution in the
             month and in every program on the learner's screen — the pedagogy
             gives the frame to them already written and does not require them
             to produce it until lesson 7. A block with no starter therefore
             made three lines of shared ceremony look like a leaked answer.

             Taken from `CPP17_FRAME` rather than retyped, so a frame that
             changes shape cannot leave this filter matching the old one. */
          const starter = (s.block as LessonBlock & { code?: string }).code ?? "";
          const given = new Set(CPP17_FRAME.split("\n").map((l) => l.trim()));
          const answerLines = ref
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length >= 12 && !starter.includes(l) && !given.has(l));
          const prompt = promptFor(s, locale, level);
          for (const line of answerLines) {
            if (prompt.includes(line)) {
              leaks.push(`${s.block.id} · ${locale} · L${level} · line ${JSON.stringify(line)}`);
            }
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* 3. Secrets and identifiers                                                 */
/* -------------------------------------------------------------------------- */

describe("no credential and no person reaches the model", () => {
  const sample = septemberBlocks()[3];

  it("carries no secret shape at any level", () => {
    const SHAPES = [
      /\bsk-[a-z0-9]{8,}/i,
      /DEEPSEEK_API_KEY/i,
      /LEARNING_ATTESTATION_SECRET/i,
      /postgres(ql)?:\/\//i,
      /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    ];
    for (const level of LEVELS) {
      for (const locale of LOCALES) {
        const prompt = promptFor(sample, locale, level);
        for (const shape of SHAPES) expect(prompt).not.toMatch(shape);
      }
    }
  });

  it("carries no subject id, account id, name or email", () => {
    /* The pseudonymous key the ledger uses does not travel, and neither does
       anything that could re-identify a child. Asserted as shapes rather than
       as values, because the point is that no such value exists in the prompt
       at all — there is no field it could have come from. */
    const prompt = promptFor(sample, "kk", 4);
    expect(prompt).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    expect(prompt).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i);
    expect(prompt).not.toMatch(/\bclass_id\b|\bschool_id\b|\bsubject_id\b/i);
  });
});

/* -------------------------------------------------------------------------- */
/* 4. The token budget is bounded                                             */
/* -------------------------------------------------------------------------- */

describe("what is sent stays bounded", () => {
  /**
   * The measured worst September system message, on the shape the hint route
   * sends: block id, directive, execution evidence, ledger context and draft.
   *
   * 12 917 characters — `m1.l1.b4` in Russian at level 1 — call it 3 200
   * tokens. The ceiling is 13 500, and both halves of that gap are deliberate:
   *
   *   - 583 characters of headroom is still more than the longest task
   *     statement in September, so an ordinary content edit does not turn this
   *     into a tripwire;
   *   - and it is far LESS than 1 500, so the next generated section — a
   *     paragraph of policy, a new derived list, a second inventory — trips it.
   *     That is the failure this test exists for. Two arrived unmeasured:
   *     `schools/nova/cpp17.ts` (+2 065) did not exist when the old ceiling was
   *     calibrated, and the capability block (+1 499) began rendering the day
   *     the extractor stopped speaking Python, because the gate that had been
   *     holding it back is detected rather than configured.
   *
   * THE MARGIN IS TIGHTER THAN IT WAS, and deliberately so. Two things moved
   * it, both of them the B1 fix rather than drift:
   *
   *   - the worst case is no longer `m1.as.b2` (12 478) but `m1.l1.b4`, whose
   *     prompt grew when it stopped asserting "the compiler says line 6" — a
   *     claim measured false on BOTH engines — and started teaching where a
   *     diagnostic actually points;
   *   - the diagnostic preamble grew by the same argument, replacing a fixed
   *     "look one line up" rule with the portable truth plus an instruction to
   *     use the number in front of it.
   *
   * Headroom fell 1 022 -> 583 for that. It was the right trade: the retired
   * text was cheaper and wrong. But it means this ceiling now has ~1.8x the
   * longest statement rather than ~3x, so the NEXT edit that lands here should
   * trim the section rather than raise the number — and if it genuinely cannot,
   * that is the moment to re-baseline with fresh measurements, not before.
   *
   * Why it matters: input tokens are billed, eighteen learners share one
   * monthly cap, and a context that grows silently is how a pilot runs out of
   * budget in week three.
   */
  const PRODUCTION_CEILING = 13_500;

  /** Same measurement, degraded shape: 8 390 measured (`m1.as.b2` · kk · L0), 9 000 stated. */
  const DEGRADED_CEILING = 9_000;

  function worstOf(build: (s: Situated, l: Locale, n: number) => string) {
    let worst = 0;
    let worstId = "";
    for (const s of septemberBlocks()) {
      for (const locale of LOCALES) {
        for (const level of LEVELS) {
          const n = build(s, locale, level).length;
          if (n > worst) {
            worst = n;
            worstId = `${s.block.id} · ${locale} · L${level}`;
          }
        }
      }
    }
    return { worst, worstId };
  }

  it("keeps the worst September block under a stated ceiling, on the shape production sends", () => {
    const { worst, worstId } = worstOf(productionPromptFor);
    expect(worst, `worst case was ${worstId}`).toBeLessThan(PRODUCTION_CEILING);
  });

  it("is measuring a prompt that really is the production shape", () => {
    /* The ceiling above is worth nothing if what it measures quietly degrades
       back into the small prompt this file used to check. A missing block id or
       a null context does not throw — it silently removes two sections and
       three kilobytes, and the ceiling then passes for the wrong reason. So the
       sections are named. */
    const sample = septemberBlocks().find(
      (s) => typeof (s.block as LessonBlock & { code?: string }).code === "string",
    )!;
    const prompt = productionPromptFor(sample, "ru", 3);
    for (const marker of [
      CPP17_PROMPT_HEADING,
      CAPABILITY_PROMPT_HEADING,
      EXECUTION_PROMPT_HEADING,
      DIAGNOSTIC_PROMPT_HEADING,
      "TRUSTED CURRENT INTERACTION",
      "BEFORE YOU ANSWER",
    ]) {
      expect(prompt, `the production prompt must carry ${marker}`).toContain(marker);
    }
    /* And it must be the bigger of the two shapes, or the pair of ceilings
       below has them the wrong way round. */
    expect(prompt.length).toBeGreaterThan(promptFor(sample, "ru", 3).length);
  });

  it("states which constructs the learner has met ONCE, not twice", () => {
    /* The 1.25 kB this test was tripping over was not a section that grew — it
       was two sections describing the same thing in two vocabularies, and on
       lessons 5 and 6 they contradicted each other about the frame.
       `@schools/curriculum/capability` derives the inventory from the content
       and owns it; `@schools/nova/cpp17` declares what a walk of the content
       cannot see and defers on the rest. This is the assertion that keeps them
       from drifting back together. */
    for (const s of septemberBlocks()) {
      const prompt = productionPromptFor(s, "ru", 4);

      const inventory = prompt.match(/TAUGHT, use freely/g) ?? [];
      expect(inventory, `${s.block.id}: one derived TAUGHT list`).toHaveLength(1);
      expect(prompt, `${s.block.id}: no declared TAUGHT list beside it`).not.toMatch(
        /of 12\. TAUGHT:/,
      );

      /* The scaffold sentence, which was rendered word for word by both. */
      const scaffold = prompt.match(/never ask them to produce it/g) ?? [];
      expect(scaffold.length, `${s.block.id}: scaffold stated at most once`).toBeLessThanOrEqual(1);

      /* And the later-months list, which the derived view states per construct
         and per month while the declaration stated seven of them by name. */
      expect(prompt, `${s.block.id}: no second later-months list`).not.toContain("NOT UNTIL LATER");
    }
  });

  it("keeps the degraded shape under its own ceiling", () => {
    /* Still a real path — the dev lab, and any block outside the capability
       walk — and the one where `./cpp17` renders the declared sequence in full
       because nothing else is stating it. Bounded separately rather than folded
       into the number above: the two shapes fail for different reasons and a
       single ceiling would hide whichever grew second. */
    const { worst, worstId } = worstOf(promptFor);
    expect(worst, `worst case was ${worstId}`).toBeLessThan(DEGRADED_CEILING);
  });

  it("bounds the conversation the client may send back", () => {
    /* History arrives from the browser, so its length is the browser's choice
       until something here refuses. Six turns, 600 characters each: a client
       asking to replay its whole afternoon gets the last three exchanges. */
    const s = septemberBlocks()[3];
    const b = s.block as LessonBlock & { prompt?: Record<Locale, string> };
    const long = "x".repeat(5000);
    const history = Array.from({ length: 40 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      text: long,
    }));

    const messages = buildNovaMessages(
      {
        locale: "kk",
        monthTitle: SEPT.title.kk,
        lessonTitle: s.lessonTitle,
        blockPrompt: b.prompt ? b.prompt.kk : s.lessonTitle,
        skills: s.block.skillRefs,
        capability: capabilityFor(s.block.id),
        directive: null,
        grant: grantAt(2),
      },
      "жалғастыр",
      history,
    );

    // One system, six history turns, one current message.
    expect(messages).toHaveLength(8);
    for (const m of messages.slice(1, -1)) {
      // 600 characters plus the two fence markers around them.
      expect(m.content.length).toBeLessThan(600 + 200);
    }
  });

  it("sends no conversation at all when the client sends none", () => {
    /* The default is silence. Nova is stateless between panels unless the
       browser chooses otherwise, which is what makes "chat is never stored" a
       property of the architecture rather than a policy someone maintains. */
    const s = septemberBlocks()[3];
    const b = s.block as LessonBlock & { prompt?: Record<Locale, string> };
    const messages = buildNovaMessages(
      {
        locale: "ru",
        monthTitle: SEPT.title.ru,
        lessonTitle: s.lessonTitle,
        blockPrompt: b.prompt ? b.prompt.ru : s.lessonTitle,
        skills: s.block.skillRefs,
        capability: capabilityFor(s.block.id),
        directive: null,
        grant: grantAt(0),
      },
      "не понимаю",
    );
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });
});
