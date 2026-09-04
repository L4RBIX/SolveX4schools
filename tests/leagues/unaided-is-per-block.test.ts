import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { creditSolve } from "@schools/leagues/credit";
import { XP_AMOUNTS } from "@schools/leagues/xp-policy";

/**
 * "Solved it on their own" is a fact about a learner and a task.
 *
 * ## The defect
 *
 * It was a fact about an EPISODE. `wasUnaided` looked for
 * `assistance_delivered` inside the episode the submission named, and
 * `priorFailures` — the other half, the one that decides whether the answer had
 * already been revealed — is per episode too. So both halves reset together the
 * moment a new episode id appears.
 *
 * A new episode id appears whenever the player mints one, which a page reload
 * does. Reveal the answer under E1, submit the same block under E2, and the
 * solve is credited 15 XP instead of 10.
 *
 * Two different harms and the second is the worse one:
 *
 *   - a learner who wants the bonus can have it, by reloading;
 *   - a learner who simply refreshed the page is credited as independent when
 *     they were not, which corrupts the signal the whole league rewards and
 *     which the teacher's independence numbers are built from.
 *
 * ## What is asserted
 *
 * The award is scoped to the block across every episode, in both directions:
 * help delivered anywhere on the block costs the bonus forever, and a learner
 * who genuinely solved it alone still gets it.
 */

const SCHOOL = "unaided-school";
const CLASS = "unaided-9a";
const BLOCK = "m1.l1.b5";

let sql: PgliteExecutor;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

async function subject(): Promise<string> {
  const id = randomUUID();
  await sql.query(
    `insert into learning_subjects (subject_id, cohort) values ($1,'public')
     on conflict do nothing`,
    [id],
  );
  return id;
}

/** One server-written event, as the submit and hint routes write them. */
async function event(input: {
  subjectId: string;
  episodeId: string;
  name: string;
  blockId?: string;
  payload?: Record<string, unknown>;
}) {
  await sql.query(
    `insert into learning_events
       (event_id, subject_id, episode_id, session_id, seq, event_name,
        occurred_at, source_trust, environment, cohort, route, payload)
     values ($1,$2,$3,$4,$5,$6, now(), 'server', 'development', 'public', '/x', $7)`,
    [
      randomUUID(),
      input.subjectId,
      input.episodeId,
      randomUUID(),
      0,
      input.name,
      JSON.stringify({
        ...(input.blockId ? { task_ref: `sx-lesson:${input.blockId}` } : {}),
        ...(input.payload ?? {}),
      }),
    ],
  );
}

const solve = (subjectId: string, episodeId: string, priorFailures = 0) =>
  sql.tx((t) =>
    creditSolve(t, {
      subjectId,
      schoolId: SCHOOL,
      classId: CLASS,
      blockId: BLOCK,
      blockType: "write_code",
      episodeId,
      accepted: true,
      priorFailures,
      now: new Date("2026-09-08T09:00:00.000Z"),
    }),
  );

describe("the independence bonus", () => {
  it("is not restored by starting a new episode after the answer was revealed", async () => {
    const subjectId = await subject();
    const e1 = randomUUID();
    const e2 = randomUUID();

    /* E1: three wrong attempts and the reveal, exactly as the submit route
       writes them — `episode_opened` carries the task, `solution_revealed` is
       the transition the route records once. */
    await event({ subjectId, episodeId: e1, name: "episode_opened", blockId: BLOCK });
    await event({ subjectId, episodeId: e1, name: "solution_revealed", blockId: BLOCK });

    /* E2: a fresh episode, no failures in it, no help in it. This is a reload. */
    await event({ subjectId, episodeId: e2, name: "episode_opened", blockId: BLOCK });
    const award = await solve(subjectId, e2, 0);

    expect(award, "an accepted solve must be credited something").not.toBeNull();
    expect(
      award!.gained,
      "a reload restored the bonus for a block whose answer had been opened",
    ).toBe(XP_AMOUNTS.block_solved);
    expect(award!.granted.map((g) => g.achievement)).not.toContain("block_solved_unaided");
  });

  it("is not restored by a new episode after a hint was delivered", async () => {
    const subjectId = await subject();
    const e1 = randomUUID();
    const e2 = randomUUID();

    await event({ subjectId, episodeId: e1, name: "episode_opened", blockId: BLOCK });
    /* The hint route writes this only once tokens reached the learner. It now
       carries `task_ref`; the episode join covers rows written before it did. */
    await event({
      subjectId,
      episodeId: e1,
      name: "assistance_delivered",
      blockId: BLOCK,
      payload: { level: 3 },
    });

    await event({ subjectId, episodeId: e2, name: "episode_opened", blockId: BLOCK });
    const award = await solve(subjectId, e2, 0);

    expect(award!.gained, "a reload forgot that help had arrived").toBe(XP_AMOUNTS.block_solved);
  });

  it("finds help recorded without a task_ref, through the episode it was in", async () => {
    /* `assistance_delivered` did not carry the block until now. Rows written
       before that must still count, or the fix would only hold for new data —
       and a pilot database is exactly where the old shape lives. */
    const subjectId = await subject();
    const e1 = randomUUID();
    const e2 = randomUUID();

    await event({ subjectId, episodeId: e1, name: "episode_opened", blockId: BLOCK });
    await event({
      subjectId,
      episodeId: e1,
      name: "assistance_delivered",
      payload: { level: 2 },
    });

    await event({ subjectId, episodeId: e2, name: "episode_opened", blockId: BLOCK });
    const award = await solve(subjectId, e2, 0);

    expect(award!.gained).toBe(XP_AMOUNTS.block_solved);
  });

  it("still pays a learner who genuinely solved it alone", async () => {
    /* The complement, and the one that matters most: a rule that withheld the
       bonus from everyone would pass every assertion above and be worse than
       the defect. */
    const subjectId = await subject();
    const e1 = randomUUID();

    await event({ subjectId, episodeId: e1, name: "episode_opened", blockId: BLOCK });
    const award = await solve(subjectId, e1, 0);

    expect(award!.gained).toBe(XP_AMOUNTS.block_solved + XP_AMOUNTS.block_solved_unaided);
    expect(award!.granted.map((g) => g.achievement)).toContain("block_solved_unaided");
  });

  it("ignores help a browser claims was delivered", async () => {
    /* If a browser could write `assistance_delivered`, the cheapest way to look
       aided would be to say you were — and the cheapest way to look unaided is
       for the rows that count to be ones only this server writes. */
    const subjectId = await subject();
    const e1 = randomUUID();

    await event({ subjectId, episodeId: e1, name: "episode_opened", blockId: BLOCK });
    await sql.query(
      `insert into learning_events
         (event_id, subject_id, episode_id, session_id, seq, event_name,
          occurred_at, source_trust, environment, cohort, route, payload)
       values ($1,$2,$3,$4,0,'assistance_delivered', now(), 'browser', 'development', 'public', '/x', $5)`,
      [
        randomUUID(),
        subjectId,
        e1,
        randomUUID(),
        JSON.stringify({ task_ref: `sx-lesson:${BLOCK}`, level: 4 }),
      ],
    );

    const award = await solve(subjectId, e1, 0);
    expect(
      award!.gained,
      "a browser-authored assistance row changed a learner's XP",
    ).toBe(XP_AMOUNTS.block_solved + XP_AMOUNTS.block_solved_unaided);
  });
});
