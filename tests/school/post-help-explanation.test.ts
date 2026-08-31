import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { findBlock } from "@schools/learning/grade";
import { L } from "@schools/presentation/labels";
import {
  MAX_EXPLANATION_CHARS,
  MIN_EXPLANATION_CHARS,
  POST_HELP_ASSISTANCE_THRESHOLD,
  POST_HELP_STATUSES,
  canSubmitExplanation,
  classifyExplanation,
  evaluateCompletionGate,
  explanationPromptKeyFor,
  explanationVerdict,
  markingPointsFor,
  requiresPostHelpExplanation,
  type PostHelpStatus,
} from "@schools/learning/post-help";

/**
 * «Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге… міндетті».
 *
 * The programme's independence check that had nothing behind it: a learner
 * could take four hints, reach the answer, and close the task without ever
 * having to say what they had just done.
 *
 * Two failures these tests exist to prevent, and they pull in opposite
 * directions:
 *
 * 1. A high-assistance completion being filed as an independent solve. That is
 *    the number the programme's headline promise counts — «шамамен 100 толық
 *    дербес шешім» — and it has already been wrong once, when nothing emitted
 *    `assistance_delivered`.
 *
 * 2. An explanation quietly becoming evidence. It is prose from a
 *    fourteen-year-old that no machine can mark, and the moment anything
 *    returns `correct` for one, an LLM's opinion is a mastery claim. Half the
 *    assertions below exist for that one and nothing else.
 *
 * The storage half runs against real Postgres (PGlite) with the shipped
 * migrations, because what is being asserted is a CHECK constraint, a primary
 * key and a swallowed conflict — none of which can be checked by reading the
 * TypeScript around them.
 */

const SUBJECT = "55555555-5555-4555-8555-555555555555";
const OTHER = "66666666-6666-4666-8666-666666666666";

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  for (const id of [SUBJECT, OTHER]) {
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')
       on conflict do nothing`,
      [id],
    );
  }
}, 60_000);

afterAll(async () => await sql?.close());

/** Deliver one hint on an episode, the way the hint route does. */
async function deliverHint(episodeId: string, level: number): Promise<string> {
  const interventionId = randomUUID();
  await store.recordIntervention({
    interventionId,
    subjectId: SUBJECT,
    episodeId,
    kind: "hint",
    level,
    trigger: "learner_requested",
    mode: null,
    containsCode: level >= 4,
    contentLen: 120,
  });
  return interventionId;
}

const SENTENCE = "Шартты >= деп өзгерттім, себебі 18 жас та кіруі керек екен.";

/* -------------------------------------------------------------------------- */

describe("when an explanation is owed", () => {
  it("does not fire below the threshold", () => {
    for (let level = -1; level < POST_HELP_ASSISTANCE_THRESHOLD; level += 1) {
      expect(
        requiresPostHelpExplanation({ maxLevel: level, interventionId: null }),
        `level ${level} should not oblige an explanation`,
      ).toBe(false);
    }
  });

  it("fires at and above the threshold", () => {
    for (let level = POST_HELP_ASSISTANCE_THRESHOLD; level <= 4; level += 1) {
      expect(requiresPostHelpExplanation({ maxLevel: level, interventionId: null })).toBe(true);
    }
  });

  it("is the level at which Nova starts supplying the reasoning", () => {
    /* Pinned, because the number is a pedagogical decision and not an
       implementation detail. Level 3 is "walk through the reasoning for their
       specific case"; below it the learner is still assembling the solution
       themselves. A school wanting the document's literal «кез келген көмек»
       passes 0 — which the parameter below proves is possible. */
    expect(POST_HELP_ASSISTANCE_THRESHOLD).toBe(3);
    expect(requiresPostHelpExplanation({ maxLevel: 0, interventionId: null }, 0)).toBe(true);
  });
});

describe("the completion gate", () => {
  const solvedAfterHeavyHelp = { maxLevel: 4, interventionId: "iv" };

  it("does NOT record a high-assistance completion as independent", () => {
    /* The assertion the whole phase exists for. Four hints and a correct
       answer is an assisted solve, and no amount of explaining afterwards
       converts it. `activityBuckets` already counts `solvedSolo` as
       `max_assistance_level < 0`; this is the same rule, stated where the
       completion path can read it. */
    const withoutExplanation = evaluateCompletionGate({
      assistance: solvedAfterHeavyHelp,
      explanation: null,
      solved: true,
    });
    expect(withoutExplanation.independent).toBe(false);
    expect(withoutExplanation.required).toBe(true);
    expect(withoutExplanation.satisfied).toBe(false);
    expect(withoutExplanation.settled).toBe(false);
    expect(withoutExplanation.reason).toBe("explanation_outstanding");

    const withExplanation = evaluateCompletionGate({
      assistance: solvedAfterHeavyHelp,
      explanation: { status: "submitted" },
      solved: true,
    });
    expect(withExplanation.satisfied).toBe(true);
    expect(withExplanation.settled).toBe(true);
    expect(
      withExplanation.independent,
      "explaining is how a learner consolidates help, not how they un-receive it",
    ).toBe(false);
  });

  it("records a skipped explanation as unsettled, not as wrong", () => {
    const gate = evaluateCompletionGate({
      assistance: solvedAfterHeavyHelp,
      explanation: { status: "unmeasured" },
      solved: true,
    });
    expect(gate.reason).toBe("explanation_skipped");
    expect(gate.satisfied).toBe(false);
    expect(gate.settled).toBe(false);
    // Nothing anywhere turns this into a failed attempt.
    expect(explanationVerdict()).toBe("unknown");
  });

  it("asks nothing of a learner who solved it unaided", () => {
    const gate = evaluateCompletionGate({
      assistance: { maxLevel: -1, interventionId: null },
      explanation: null,
      solved: true,
    });
    expect(gate.required).toBe(false);
    expect(gate.settled).toBe(true);
    expect(gate.independent).toBe(true);
    expect(gate.reason).toBe("no_substantial_help");
  });

  it("treats a level-0 hint as assistance even though it owes no explanation", () => {
    /* Two separate thresholds, and conflating them is how the independence
       count went wrong the first time. A Socratic question costs independence;
       it does not oblige an essay. */
    const gate = evaluateCompletionGate({
      assistance: { maxLevel: 0, interventionId: "iv" },
      explanation: null,
      solved: true,
    });
    expect(gate.required).toBe(false);
    expect(gate.independent).toBe(false);
  });

  it("says nothing about finishing before the task is solved", () => {
    const gate = evaluateCompletionGate({
      assistance: solvedAfterHeavyHelp,
      explanation: null,
      solved: false,
    });
    expect(gate.reason).toBe("not_solved");
    expect(gate.settled).toBe(false);
    expect(gate.independent).toBe(false);
  });
});

describe("an explanation is never graded", () => {
  it("has no verdict other than unknown", () => {
    /* `explanationVerdict` takes no argument on purpose: a parameter is a place
       for a model's opinion to enter. Same rule and same reason as `checkBlock`
       settling every `explain` block as `unknown`. */
    expect(explanationVerdict()).toBe("unknown");
    expect(explanationVerdict.length, "takes no input, so nothing can steer it").toBe(0);
  });

  it("never produces a status that reads as correct", () => {
    const statuses: PostHelpStatus[] = [];
    for (const response of [null, "", "  ", SENTENCE, "х".repeat(500)]) {
      for (const markingPoints of [0, 1, 4]) {
        statuses.push(classifyExplanation({ response, markingPoints }));
      }
    }
    for (const s of statuses) {
      expect(POST_HELP_STATUSES).toContain(s);
      expect(s).not.toBe("correct");
      expect(s).not.toBe("mastered");
    }
    // And the closed set contains nothing that could be read as a pass.
    expect([...POST_HELP_STATUSES].sort()).toEqual(
      ["submitted", "teacher_reviewable", "unmeasured"].sort(),
    );
  });

  it("routes to a human only where an author wrote marking criteria", () => {
    /* `expectedPoints` is the only thing in the content model that says what a
       marker should look for. Without it, queueing an explanation asks a
       teacher to invent a standard per learner — which is what the field's own
       contract in `types.ts` exists to prevent. */
    const written = findBlock("m1.as.b3")!.block;
    expect(markingPointsFor(written).length).toBeGreaterThan(0);
    expect(
      classifyExplanation({ response: SENTENCE, markingPoints: markingPointsFor(written).length }),
    ).toBe("teacher_reviewable");

    const code = findBlock("m1.p1")!.block;
    expect(markingPointsFor(code)).toEqual([]);
    expect(classifyExplanation({ response: SENTENCE, markingPoints: 0 })).toBe("submitted");
  });

  it("classifies on length and criteria, never on content", () => {
    /* Two answers of the same length, one insightful and one nonsense, must
       classify identically. If this ever fails, something started reading the
       text. */
    const insightful = classifyExplanation({ response: SENTENCE, markingPoints: 0 });
    const nonsense = classifyExplanation({ response: "ы".repeat(SENTENCE.length), markingPoints: 0 });
    expect(insightful).toBe(nonsense);
  });

  it("treats an empty answer as unmeasured, not as a submission", () => {
    expect(classifyExplanation({ response: null, markingPoints: 0 })).toBe("unmeasured");
    expect(classifyExplanation({ response: "   ", markingPoints: 2 })).toBe("unmeasured");
  });
});

describe("the submit floor is a length check and nothing more", () => {
  it("disables rather than marking a short answer wrong", () => {
    expect(canSubmitExplanation("ок")).toBe(false);
    expect(canSubmitExplanation("а".repeat(MIN_EXPLANATION_CHARS - 1))).toBe(false);
    expect(canSubmitExplanation("а".repeat(MIN_EXPLANATION_CHARS))).toBe(true);
    expect(canSubmitExplanation("а".repeat(MAX_EXPLANATION_CHARS + 1))).toBe(false);
    // Refusing to accept it is not a verdict about it.
    expect(explanationVerdict()).toBe("unknown");
  });
});

describe("the bilingual question", () => {
  it("asks where they went wrong on a repair task", () => {
    const key = explanationPromptKeyFor(findBlock("m1.l1.b4")!.block); // find_bug
    expect(key).toBe("postHelpAskWhereWrong");
    expect(L[key].kk).toBe("Қай жерде қателестің?");
    expect(L[key].ru.length).toBeGreaterThan(0);
  });

  it("asks why the condition works on a conditions task", () => {
    const key = explanationPromptKeyFor(findBlock("m1.l5.b3")!.block);
    expect(key).toBe("postHelpAskWhyCondition");
    expect(L[key].kk).toBe("Неге бұл шарт жұмыс істейді?");
  });

  it("falls back to what-and-why elsewhere", () => {
    expect(explanationPromptKeyFor(findBlock("m1.l1.b5")!.block)).toBe("postHelpAskWhatAndWhy");
  });

  it("is bilingual everywhere, and never congratulates", () => {
    const keys = [
      "postHelpTitle", "postHelpWhy", "postHelpAskWhyCondition", "postHelpAskWhereWrong",
      "postHelpAskWhatAndWhy", "postHelpPlaceholder", "postHelpSubmit", "postHelpTooShort",
      "postHelpRecorded", "postHelpNotGraded", "postHelpOutstanding", "postHelpSkipped",
      "postHelpSaveFailed",
    ] as const;
    for (const key of keys) {
      const label = L[key];
      expect(label.kk.trim().length, `${key} kk`).toBeGreaterThan(0);
      expect(label.ru.trim().length, `${key} ru`).toBeGreaterThan(0);
      /* Nothing may read as a mark. The system does not know whether the
         explanation was any good, and a «Дұрыс» here would say it does. */
      expect(label.kk).not.toMatch(/Дұрыс|Жарайсың/);
      expect(label.ru).not.toMatch(/Верно|Правильно|Молодец/);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Storage                                                                    */
/* -------------------------------------------------------------------------- */

describe("storage", () => {
  it("records the learner's words with the assistance that made them owed", async () => {
    const episodeId = randomUUID();
    const interventionId = await deliverHint(episodeId, 4);

    const assistance = await store.lastIntervention(episodeId);
    expect(assistance).toEqual({ interventionId, level: 4 });

    const first = await store.recordPostHelpExplanation({
      subjectId: SUBJECT,
      episodeId,
      blockId: "m1.l7.b3",
      assistanceLevel: assistance!.level,
      interventionId: assistance!.interventionId,
      response: SENTENCE,
      status: "submitted",
    });
    expect(first).toBe(true);

    const row = await store.postHelpExplanation(SUBJECT, episodeId, "m1.l7.b3");
    expect(row).toMatchObject({
      blockId: "m1.l7.b3",
      assistanceLevel: 4,
      interventionId,
      response: SENTENCE,
      status: "submitted",
    });
  });

  it("keeps the first answer and refuses to overwrite it", async () => {
    const episodeId = randomUUID();
    await deliverHint(episodeId, 3);
    const write = (response: string) =>
      store.recordPostHelpExplanation({
        subjectId: SUBJECT,
        episodeId,
        blockId: "m1.l5.b3",
        assistanceLevel: 3,
        interventionId: null,
        response,
        status: "submitted",
      });

    expect(await write("Бірінші жауабым, көмектен кейін жазылды.")).toBe(true);
    expect(await write("Кейінірек жазылған басқа жауап.")).toBe(false);

    const row = await store.postHelpExplanation(SUBJECT, episodeId, "m1.l5.b3");
    expect(
      row?.response,
      "the answer given while the help was fresh is the one a teacher may already have read",
    ).toBe("Бірінші жауабым, көмектен кейін жазылды.");
  });

  it("stores a skipped explanation as a real row with no answer", async () => {
    const episodeId = randomUUID();
    await deliverHint(episodeId, 4);
    await store.recordPostHelpExplanation({
      subjectId: SUBJECT,
      episodeId,
      blockId: "m1.p2",
      assistanceLevel: 4,
      interventionId: null,
      response: null,
      status: "unmeasured",
    });

    const row = await store.postHelpExplanation(SUBJECT, episodeId, "m1.p2");
    expect(row?.response).toBeNull();
    expect(row?.status).toBe("unmeasured");

    /* "Asked and did not answer" must be distinguishable from "never asked",
       or the teacher cannot see a learner skipping the reflection. */
    const gate = evaluateCompletionGate({
      assistance: { maxLevel: 4, interventionId: null },
      explanation: { status: row!.status },
      solved: true,
    });
    expect(gate.reason).toBe("explanation_skipped");
  });

  it("refuses an answer filed under a status that hides that it was unanswered", async () => {
    /* The CHECK constraint, exercised. A route that forgot the rule would file
       an unanswered obligation as a discharged one, and the schema is what
       stops it rather than the route remembering. */
    const episodeId = randomUUID();
    await expect(
      store.recordPostHelpExplanation({
        subjectId: SUBJECT,
        episodeId,
        blockId: "m1.p3",
        assistanceLevel: 4,
        interventionId: null,
        response: null,
        status: "submitted",
      }),
    ).rejects.toThrow();
  });

  it("refuses a status outside the closed vocabulary", async () => {
    const episodeId = randomUUID();
    await expect(
      store.recordPostHelpExplanation({
        subjectId: SUBJECT,
        episodeId,
        blockId: "m1.p3",
        assistanceLevel: 4,
        interventionId: null,
        response: SENTENCE,
        // A grade, smuggled in as a status. The database refuses it.
        status: "correct" as unknown as PostHelpStatus,
      }),
    ).rejects.toThrow();
  });

  it("has no column anywhere to put a score in", async () => {
    /* The guarantee is structural. `learner_error_dictionary` uses the same
       argument: the rule that nothing composes a claim about a child holds
       because there is nowhere to write one. */
    const cols = await sql.query<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name = 'post_help_explanations'`,
    );
    const names = cols.rows.map((r) => r.column_name).sort();
    expect(names).toEqual([
      "assistance_level",
      "block_id",
      "created_at",
      "episode_id",
      "intervention_id",
      "response",
      "status",
      "subject_id",
    ]);
    for (const banned of ["score", "grade", "quality", "correct", "mastery", "rating", "feedback"]) {
      expect(names, `a column called ${banned} would make an LLM opinion storable`).not.toContain(
        banned,
      );
    }
  });

  it("keeps one learner's explanations out of another's", async () => {
    const episodeId = randomUUID();
    await deliverHint(episodeId, 4);
    await store.recordPostHelpExplanation({
      subjectId: SUBJECT,
      episodeId,
      blockId: "m1.p4",
      assistanceLevel: 4,
      interventionId: null,
      response: SENTENCE,
      status: "submitted",
    });
    expect(await store.postHelpExplanation(OTHER, episodeId, "m1.p4")).toBeNull();
    const mine = await store.postHelpExplanationsForSubject(SUBJECT);
    expect(mine.some((r) => r.blockId === "m1.p4")).toBe(true);
    expect(await store.postHelpExplanationsForSubject(OTHER)).toEqual([]);
  });

  it("goes with the learner when consent is revoked", async () => {
    /* Free text a child wrote, so it has to leave on erasure. It does, via the
       cascade from `learning_subjects` — no new statement in
       `learning_forget_user`, which is exactly the bug migration 0007 had to go
       back and fix for a table that lacked one. */
    const doomed = "77777777-7777-4777-8777-777777777777";
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')
       on conflict do nothing`,
      [doomed],
    );
    const episodeId = randomUUID();
    await store.recordPostHelpExplanation({
      subjectId: doomed,
      episodeId,
      blockId: "m1.p5",
      assistanceLevel: 3,
      interventionId: null,
      response: SENTENCE,
      status: "submitted",
    });

    await sql.query(`delete from learning_subjects where subject_id = $1`, [doomed]);
    const left = await sql.query<{ n: number }>(
      `select count(*)::int as n from post_help_explanations where subject_id = $1`,
      [doomed],
    );
    expect(left.rows[0].n).toBe(0);
  });
});
