import { afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A named QA account may open every month. Nobody else may.
 *
 * ## Why an override exists at all
 *
 * Testing the year needs an account that reaches May without nine months of
 * real work, and every alternative damages the record: seeding completions
 * invents learning that never happened, forging accepted verdicts fakes judge
 * evidence, and opening `monthUnlockedFor` unlocks the year for the school.
 *
 * ## What this file is here to stop
 *
 * The override becoming a hole. Two directions, both asserted: a listed
 * account gets everything, and an unlisted one is measured by the ordinary
 * unlock policy exactly as before. The third assertion is the one that matters
 * most in a year's time — the override writes NOTHING, so a QA account's
 * record stays empty and a teacher's analytics stay true.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const qaUser = randomUUID();
const normalUser = randomUUID();
const qaSubject = randomUUID();
const normalSubject = randomUUID();

afterAll(() => {
  vi.unstubAllEnvs();
});

/**
 * The access module, its store, and two subjects inside it.
 *
 * `vi.resetModules()` is what makes the environment stub reach `config`, which
 * reads it once at import — and it also gives `@schools/store` a brand new
 * in-memory database each time. So the subjects have to be seeded through the
 * handle the freshly-imported access module will itself use; seeding a
 * separately-opened PGlite would leave the override looking up a subject in a
 * database nothing else can see.
 */
async function accessWithAllowlist(list: string) {
  vi.resetModules();
  vi.stubEnv("FULL_CURRICULUM_QA_USERS", list);
  vi.stubEnv("LEARNING_DATA_DIR", "memory://");
  const { getStoreHandle } = await import("@schools/store");
  const { sql, store } = await getStoreHandle();
  for (const [subject, user] of [
    [qaSubject, qaUser],
    [normalSubject, normalUser],
  ]) {
    await sql.query(
      `insert into learning_subjects (subject_id, user_id) values ($1,$2)
       on conflict do nothing`,
      [subject, user],
    );
  }
  const access = await import("@schools/learning/access");
  return { ...access, sql, store };
}

describe("the QA allowlist", () => {
  it("is empty unless an operator sets it", async () => {
    vi.resetModules();
    vi.stubEnv("FULL_CURRICULUM_QA_USERS", "");
    const { config } = await import("@schools/config");
    expect(config.qaFullCurriculumUsers).toEqual([]);
  });

  it("is a list of account ids, trimmed", async () => {
    vi.resetModules();
    vi.stubEnv("FULL_CURRICULUM_QA_USERS", " a-b-c , d-e-f ");
    const { config } = await import("@schools/config");
    expect(config.qaFullCurriculumUsers).toEqual(["a-b-c", "d-e-f"]);
  });
});

describe("what the override is allowed to touch", () => {
  it("changes access and writes nothing", () => {
    /*
     * Asserted on the source, because "it wrote nothing" is a property of code
     * that a passing read-only test cannot demonstrate. The whole override is
     * one function; if it ever grows an INSERT, this fails.
     */
    const src = readFileSync(path.join(ROOT, "schools/learning/access.ts"), "utf8");
    const fn = src.slice(src.indexOf("async function isQaFullAccessSubject"));
    const body = fn.slice(0, fn.indexOf("\n}\n") + 3);
    expect(body).toContain("config.qaFullCurriculumUsers");
    expect(body).toContain("userIdForSubject");
    for (const write of ["insert", "update", "delete", "upsert"]) {
      expect(body.toLowerCase(), `the override must not ${write}`).not.toContain(write);
    }
  });

  it("is applied in exactly one place", () => {
    /* One call site, in the function every gate funnels through. Two would be
       one too many: the second is the one somebody forgets. */
    const src = readFileSync(path.join(ROOT, "schools/learning/access.ts"), "utf8");
    const calls = src.split("isQaFullAccessSubject(").length - 1;
    /* The definition, the unlock-state override, and the month check. */
    expect(calls).toBe(3);
  });

  it("leaves completion, independence and XP untouched in the state it returns", () => {
    const src = readFileSync(path.join(ROOT, "schools/learning/access.ts"), "utf8");
    const block = src.slice(src.indexOf("export async function unlockStateForSubject"));
    /* Only `unlocked` is rewritten; every other field is spread through. */
    expect(block).toContain("...m, unlocked: true");
    expect(block).not.toContain("complete: true");
    expect(block).not.toContain("demonstrated: true");
  });
});

describe("who it applies to", () => {
  it("opens every month for a listed account", async () => {
    const { monthUnlockedFor, unlockStateForSubject } = await accessWithAllowlist(qaUser);
    for (const month of [2, 5, 9]) {
      expect(await monthUnlockedFor(qaSubject, month), `month ${month}`).toBe(true);
    }
    const state = await unlockStateForSubject(qaSubject);
    expect(state.unlockedThrough).toBe(9);
    expect(state.months.every((m) => m.unlocked)).toBe(true);
    /* And the record it reports is still the empty one. */
    expect(state.months.every((m) => m.complete === false)).toBe(true);
  });

  it("changes nothing for an account that is not listed", async () => {
    const { monthUnlockedFor, unlockStateForSubject } = await accessWithAllowlist(qaUser);
    expect(await monthUnlockedFor(normalSubject, 1), "September is everyone's").toBe(true);
    for (const month of [2, 5, 9]) {
      expect(await monthUnlockedFor(normalSubject, month), `month ${month}`).toBe(false);
    }
    expect((await unlockStateForSubject(normalSubject)).unlockedThrough).toBe(1);
  });

  it("changes nothing for anyone when the list is empty", async () => {
    const { monthUnlockedFor } = await accessWithAllowlist("");
    expect(await monthUnlockedFor(qaSubject, 2)).toBe(false);
    expect(await monthUnlockedFor(normalSubject, 2)).toBe(false);
  });

  it("does not create progress for the QA account", async () => {
    /* After every read above. A QA session that leaves rows behind would put
       fiction into a school's record and into a teacher's analytics. */
    const { store, sql, monthUnlockedFor, unlockStateForSubject } = await accessWithAllowlist(qaUser);
    for (const month of [2, 5, 9]) await monthUnlockedFor(qaSubject, month);
    await unlockStateForSubject(qaSubject);
    const completions = await store.completionsForSubject(qaSubject);
    expect(completions).toEqual([]);
    const events = await sql.query<{ n: number }>(
      "select count(*)::int as n from learning_events where subject_id = $1",
      [qaSubject],
    );
    expect(Number(events.rows[0]!.n)).toBe(0);
    const xp = await sql.query<{ n: number }>(
      "select count(*)::int as n from league_xp_awards where subject_id = $1",
      [qaSubject],
    );
    expect(Number(xp.rows[0]!.n)).toBe(0);
  });
});
