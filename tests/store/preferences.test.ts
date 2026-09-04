import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { hashPassword } from "@schools/auth/password";
import { DEFAULT_PREFERENCES, parsePreferences } from "@schools/preferences/types";

/**
 * Preferences, against a real database with the shipped migrations applied.
 *
 * The property that matters is the one a shared classroom machine depends on:
 * a learner who sets Kazakh and reduced motion at one desk has to find them
 * again at another. That is a row, not a `localStorage` entry, and this suite
 * is what proves the row survives the round trip.
 */

let sql: PgliteExecutor;
let store: LearningStore;
let userA = "";
let userB = "";

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  const make = async (username: string) => {
    const stored = await hashPassword("correct-horse-battery");
    return store.createAccount({
      schoolId: "test-school",
      role: "student",
      username,
      displayName: username,
      passwordHash: stored.hash,
      passwordSalt: stored.salt,
      /* A person who has finished signing in.
         `createAccount` defaults `must_change_password` to true, which is right
         for a freshly provisioned child and wrong for a fixture that then drives
         the product: every guard now refuses a first-login session with 403
         `password_change_required`. The refusal itself is pinned in
         `tests/school/auth-enforcement.test.ts`; here it would only mean the
         fixture is not a user. */
      mustChangePassword: false,
    });
  };
  userA = await make("prefs-a");
  userB = await make("prefs-b");
}, 120_000);

afterAll(async () => await sql?.close());

describe("account preferences", () => {
  it("distinguishes 'never saved' from 'saved, all defaults'", async () => {
    /* This is not pedantry. `null` means keep whatever the browser decided;
       `{}` means this person deliberately reset. Collapsing the two lets a
       stale local value silently win over a choice made at another desk. */
    expect(await store.getPreferences(userA)).toBeNull();

    await store.putPreferences(userA, DEFAULT_PREFERENCES);
    expect(await store.getPreferences(userA)).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips a full preference set", async () => {
    const prefs = {
      theme: "light",
      locale: "ru",
      motion: "reduce",
      novaNarration: true,
      soundEffects: false,
    } as const;
    await store.putPreferences(userA, prefs);
    expect(parsePreferences(await store.getPreferences(userA))).toEqual(prefs);
  });

  it("overwrites rather than merging", async () => {
    // The client sends the whole object every time, so a stale field must not
    // survive underneath a new one.
    await store.putPreferences(userA, { theme: "dark", locale: "kk" });
    const stored = await store.getPreferences(userA);
    expect(stored).toEqual({ theme: "dark", locale: "kk" });
    // …and the reader fills the gaps rather than returning undefined fields.
    expect(parsePreferences(stored)).toEqual({
      ...DEFAULT_PREFERENCES,
      theme: "dark",
      locale: "kk",
    });
  });

  it("keeps two learners apart", async () => {
    await store.putPreferences(userB, { theme: "light" });
    expect((await store.getPreferences(userA))?.theme).toBe("dark");
    expect((await store.getPreferences(userB))?.theme).toBe("light");
  });

  it("returns null for an account that has none", async () => {
    expect(
      await store.getPreferences("00000000-0000-4000-8000-000000000999"),
    ).toBeNull();
  });

  it("survives a value written in an older shape", async () => {
    /* A preference bag is read whole and written whole, so a field added next
       term must not require a migration — an unrecognised key has to be inert
       rather than fatal. */
    await store.putPreferences(userA, {
      theme: "light",
      somethingFromNextTerm: { nested: true },
    });
    const parsed = parsePreferences(await store.getPreferences(userA));
    expect(parsed.theme).toBe("light");
    expect(parsed).not.toHaveProperty("somethingFromNextTerm");
  });
});
