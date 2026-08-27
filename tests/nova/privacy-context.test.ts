import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { capabilityFor } from "@schools/curriculum/capability";
import { buildNovaMessages, buildSystemPrompt } from "@schools/nova/prompt";
import type { LessonBlock, Locale } from "@schools/curriculum/types";
import type { GrantDecision } from "@solvex/nova-core";

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

function promptFor(s: Situated, locale: Locale, level: number): string {
  const b = s.block as LessonBlock & {
    prompt?: Record<Locale, string>;
    code?: string;
  };
  return buildSystemPrompt(
    {
      locale,
      monthTitle: SEPT.title[locale],
      lessonTitle: s.lessonTitle,
      blockPrompt: b.prompt ? b.prompt[locale] : s.lessonTitle,
      blockCode: typeof b.code === "string" ? b.code : undefined,
      skills: s.block.skillRefs,
      capability: capabilityFor(s.block.id),
      directive: null,
      grant: grantAt(level),
    },
    "0".repeat(32),
  );
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
      "directive",
      "grant",
      "capability",
      "briefOffTopic",
    ] as const;

    type Allowed = (typeof allowed)[number];
    type Actual = keyof Parameters<typeof buildSystemPrompt>[0];

    /* Both directions. `never` on either line means the two lists have drifted:
       a new field on the context, or a field removed from under this test. */
    const missing: Exclude<Actual, Allowed>[] = [];
    const extra: Exclude<Allowed, Actual>[] = [];
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
    expect(allowed).toHaveLength(10);
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
             answer: those the starter does not already contain. */
          const starter = (s.block as LessonBlock & { code?: string }).code ?? "";
          const answerLines = ref
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length >= 12 && !starter.includes(l));
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
  it("keeps the worst September block under a stated ceiling", () => {
    /* A number, not a vibe. The measured worst case across the whole month, in
       both languages, at every rung, is `m1.l6.b3s` in Russian at level 3 —
       about 6.9 kB, call it 1 700 tokens. The ceiling is 8 000 so that a
       longer task statement does not turn this into a tripwire that fires on
       ordinary content edits, while a change that DOUBLES the context still
       trips it.
       The reason it matters: input tokens are billed, eighteen learners share
       one monthly cap, and a context that grows silently is how a pilot runs
       out of budget in week three. */
    let worst = 0;
    let worstId = "";
    for (const s of septemberBlocks()) {
      for (const locale of LOCALES) {
        for (const level of LEVELS) {
          const n = promptFor(s, locale, level).length;
          if (n > worst) {
            worst = n;
            worstId = `${s.block.id} · ${locale} · L${level}`;
          }
        }
      }
    }
    expect(worst, `worst case was ${worstId}`).toBeLessThan(8000);
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
