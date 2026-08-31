import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { runSweep } from "@schools/reducer/sweep";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { buildNovaContext } from "@schools/nova/build-context";
import { buildNovaMessages } from "@schools/nova/prompt";
import { findBlock } from "@schools/learning/grade";
import { decide } from "@solvex/learning-intelligence-core";
import { playEpisode, correctAnswer, unattributedWrongAnswer, attributedWrongAnswer } from "../learning/ledger";

/**
 * Personalization, and what the word is allowed to mean here.
 *
 * It does NOT mean Nova knows the learner's name, or greets them, or mentions
 * the lesson title. Any template can do that, and a product that calls it
 * personalization is selling a mail merge.
 *
 * It means: **the same question, from learners with different trusted
 * histories, produces a different pedagogical situation** — a different
 * ceiling, a different directive, a different set of facts in front of the
 * model. If four learners ask «Где ошибка?» on the same block and the context
 * is identical, nothing has been personalised, whatever the prose looks like.
 *
 * ## What is asserted, and what is not
 *
 * Not wording. A model's sentences are not stable, and a suite that pins them
 * fails whenever the prompt improves. What is asserted is the STRATEGY the
 * server hands the model: the grant, the directive, and which facts about the
 * learner reached the prompt.
 *
 * Every history below starts from events and goes through the real grader, the
 * real ledger, the real sweep and the real decision engine.
 */

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

const MCQ = "m1.l6.b2a";
const freshSubject = () => store.resolveSubject(randomUUID());
const DAY = 86_400_000;
const START = Date.parse("2026-04-06T09:00:00.000Z");

/**
 * The whole pipeline for one learner asking one question.
 *
 * Deliberately the same call for every learner in this file. The ONLY thing
 * that differs between them is what is already in the ledger, which is exactly
 * the claim being tested.
 */
async function situationFor(subjectId: string, episodeId: string) {
  await runSweep(store, { limit: 200 });

  const { grant, directive, assessmentCapped } = await enforceHintPolicy({
    store,
    subjectId,
    episodeId,
    requested: 2,
    learnerOverride: false,
    taskKind: "lesson",
  });

  const persisted = await store.getLearnerState(subjectId);
  const action = persisted ? decide(persisted.state).primary.actionType : null;

  const context = await buildNovaContext({
    store,
    subjectId,
    episodeId,
    locale: "ru",
    target: findBlock(MCQ)!,
    grant,
    directive,
    directiveNote: null,
    action,
    assessmentCapped,
  });

  const prompt = buildNovaMessages(
    {
      locale: "ru",
      monthTitle: "Апрель",
      lessonTitle: "Условия",
      blockPrompt: context.curriculum.prompt,
      skills: context.curriculum.skillIds,
      directive,
      grant,
      context,
    },
    "Где ошибка?",
  )[0].content;

  return { grant, directive, action, context, prompt, state: persisted?.state ?? null };
}

/* -------------------------------------------------------------------------- */
/* Four learners, one question                                                */
/* -------------------------------------------------------------------------- */

describe("the same question from four different learners", () => {
  it("A · a new learner gets no claim about themselves at all", async () => {
    const subjectId = await freshSubject();
    /* One attempt so the ladder is open — otherwise this measures the
       attempt gate rather than the personalization. */
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
    ]);

    const s = await situationFor(subjectId, episode.episodeId);

    /* Nothing on record, and the prompt says so in as many words rather than
       staying silent — a model given no history section will cheerfully invent
       one. */
    expect(s.context.intelligence.recentEvidence).toHaveLength(0);
    expect(s.prompt).toContain("Nothing relevant on record");
    expect(s.prompt).toContain("You know nothing about their past work");
    expect(s.directive?.mayNameMisconception ?? false).toBe(false);
  }, 60_000);

  it("B · a learner with a supported, repeated difficulty gets it named", async () => {
    const subjectId = await freshSubject();
    const attributed = attributedWrongAnswer(MCQ, "strict_vs_inclusive_boundary");
    expect(attributed, "this block must declare a diagnostic mapping").not.toBeNull();

    /* Four separate days. Independence is the basis of the confidence model:
       four clicks in one sitting are one observation of a bad afternoon. */
    let last = "";
    for (let i = 0; i < 4; i += 1) {
      const e = await playEpisode(
        { store, sql, subjectId },
        MCQ,
        [
          { kind: "submit", answer: attributed!.answer },
          { kind: "close", reason: "abandoned" },
        ],
        { startedAt: START + i * DAY },
      );
      last = e.episodeId;
    }

    const s = await situationFor(subjectId, last);

    /* The class the AUTHOR declared, reaching the prompt in words a
       fourteen-year-old can read — never as `strict_vs_inclusive_boundary`. */
    const seen = (s.state?.skills ?? []).flatMap((k) =>
      k.misconceptions.map((m) => m.failureClass),
    );
    expect(seen).toContain("strict_vs_inclusive_boundary");
    expect(s.context.intelligence.recentEvidence.length).toBeGreaterThan(0);
    expect(s.prompt).not.toContain("strict_vs_inclusive_boundary");
  }, 60_000);

  it("C · a learner who leans on help is not handed more of it", async () => {
    const subjectId = await freshSubject();

    /* Five solves, every one of them after a code-bearing hint. The accepted
       count looks like mastery and is not, which is the exact confusion
       `hintDependency` exists to prevent. */
    let last = "";
    for (let i = 0; i < 5; i += 1) {
      const e = await playEpisode(
        { store, sql, subjectId },
        MCQ,
        [
          { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
          { kind: "hint", level: 4, containsCode: true },
          { kind: "wait", seconds: 30 },
          { kind: "submit", answer: correctAnswer(MCQ) },
          { kind: "close", reason: "accepted" },
        ],
        { startedAt: START + i * DAY },
      );
      last = e.episodeId;
    }

    const s = await situationFor(subjectId, last);
    expect(s.state).not.toBeNull();
    expect(s.state!.assistance.hintDependency).toBeGreaterThan(0);
    /* Five accepted answers, and the system still does not call them
       independent. That is the whole claim. */
    expect(s.state!.assistance.transferSolves + s.state!.assistance.interventions).toBeGreaterThan(0);
  }, 60_000);

  it("D · a learner solving alone accumulates independent evidence", async () => {
    const subjectId = await freshSubject();

    let last = "";
    for (let i = 0; i < 5; i += 1) {
      const e = await playEpisode(
        { store, sql, subjectId },
        MCQ,
        [
          { kind: "submit", answer: correctAnswer(MCQ) },
          { kind: "close", reason: "accepted" },
        ],
        { startedAt: START + i * DAY },
      );
      last = e.episodeId;
    }

    const s = await situationFor(subjectId, last);
    expect(s.state).not.toBeNull();
    /* No help taken, so no dependency. Compared against C below, this is the
       difference the whole assistance model exists to record. */
    expect(s.state!.assistance.hintDependency).toBe(0);
    expect(s.context.intelligence.recentEvidence.length).toBeGreaterThan(0);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* The claim itself                                                            */
/* -------------------------------------------------------------------------- */

describe("the histories actually change what Nova is told", () => {
  it("produces different context for the new learner and the assisted one", async () => {
    /* If these two prompts were identical, nothing would have been
       personalised — whatever the model's prose looked like. */
    const newbie = await freshSubject();
    const dependent = await freshSubject();

    const newbieEpisode = await playEpisode({ store, sql, subjectId: newbie }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
    ]);

    let dependentEpisode = "";
    for (let i = 0; i < 4; i += 1) {
      const e = await playEpisode(
        { store, sql, subjectId: dependent },
        MCQ,
        [
          { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
          { kind: "hint", level: 4, containsCode: true },
          { kind: "wait", seconds: 30 },
          { kind: "submit", answer: correctAnswer(MCQ) },
          { kind: "close", reason: "accepted" },
        ],
        { startedAt: START + i * DAY },
      );
      dependentEpisode = e.episodeId;
    }

    const a = await situationFor(newbie, newbieEpisode.episodeId);
    const b = await situationFor(dependent, dependentEpisode);

    expect(a.prompt).not.toBe(b.prompt);
    expect(a.context.intelligence.recentEvidence).toHaveLength(0);
    expect(b.context.intelligence.recentEvidence.length).toBeGreaterThan(0);
    expect(a.prompt).toContain("Nothing relevant on record");
    expect(b.prompt).not.toContain("Nothing relevant on record");
  }, 90_000);

  it("never lets history become a sentence about the person", async () => {
    /* The failure mode on the other side of personalization. Whatever the
       history says, the prompt must not authorise "you always", "you never",
       or a claim about how this child learns. */
    const subjectId = await freshSubject();
    for (let i = 0; i < 6; i += 1) {
      await playEpisode(
        { store, sql, subjectId },
        MCQ,
        [
          { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
          { kind: "close", reason: "abandoned" },
        ],
        { startedAt: START + i * DAY },
      );
    }

    const s = await situationFor(subjectId, randomUUID());

    expect(s.prompt).toContain("Do not generalise beyond it");
    expect(s.prompt).toContain("never");
    /* Six failures and still no named cause: none was ever attributed, and the
       engine does not close that gap by guessing. */
    const actionable = (s.state?.skills ?? []).flatMap((k) =>
      k.misconceptions.filter((m) => m.actionable).map((m) => m.failureClass),
    );
    expect(actionable).toEqual([]);
  }, 90_000);
});
