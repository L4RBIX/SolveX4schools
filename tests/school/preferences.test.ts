import { describe, it, expect } from "vitest";
import {
  DEFAULT_PREFERENCES,
  htmlStamps,
  parsePreferences,
  PREFERENCES_STORAGE_KEY,
} from "@schools/preferences/types";

/**
 * Preferences.
 *
 * `parsePreferences` runs on BOTH sides — the client reads `localStorage`,
 * which a learner can edit and an older build may have written in a different
 * shape, and the server reads a request body, which is untrusted by
 * definition. So the interesting cases are all the malformed ones.
 */

describe("parsePreferences", () => {
  it("returns the defaults for nothing at all", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({})).toEqual(DEFAULT_PREFERENCES);
  });

  it("defaults are quiet ones", () => {
    /* Narration and sound OFF, because a lesson that starts talking in a room
       of eighteen students is a lesson the teacher has to stop. Theme and
       motion on `auto`, so the OS is followed until somebody says otherwise. */
    expect(DEFAULT_PREFERENCES.novaNarration).toBe(false);
    expect(DEFAULT_PREFERENCES.soundEffects).toBe(false);
    expect(DEFAULT_PREFERENCES.theme).toBe("auto");
    expect(DEFAULT_PREFERENCES.motion).toBe("auto");
    // Kazakh-first: this is a Kazakh school programme, Russian is the alternate.
    expect(DEFAULT_PREFERENCES.locale).toBe("kk");
  });

  it("coerces an unrecognised value to its default rather than passing it through", () => {
    /* The stamp on <html> is written from this. An unrecognised theme reaching
       the DOM would set data-theme="oled", which matches no CSS rule and leaves
       the page in whichever arm happens to be first. */
    const out = parsePreferences({
      theme: "oled",
      locale: "en",
      motion: "spin",
      novaNarration: "yes",
      soundEffects: 1,
    });
    expect(out).toEqual(DEFAULT_PREFERENCES);
  });

  it("keeps every valid value", () => {
    const all = {
      theme: "light",
      locale: "ru",
      motion: "reduce",
      novaNarration: true,
      soundEffects: true,
    } as const;
    expect(parsePreferences(all)).toEqual(all);
  });

  it("survives junk that is not an object", () => {
    for (const junk of ["", 0, false, [], "null", 42]) {
      expect(parsePreferences(junk)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  it("ignores unknown keys instead of carrying them into storage", () => {
    const out = parsePreferences({ theme: "dark", somethingNew: "kept?" });
    expect(out).not.toHaveProperty("somethingNew");
    expect(out.theme).toBe("dark");
  });
});

describe("htmlStamps", () => {
  it("stamps an explicit theme", () => {
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, theme: "dark" }).theme).toBe("dark");
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, theme: "light" }).theme).toBe("light");
  });

  it("stamps NOTHING for auto", () => {
    /* This is the whole mechanism. The CSS falls through to
       `prefers-color-scheme` only when no attribute is present; writing the
       literal "auto" would match no rule and freeze the page in one arm. */
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, theme: "auto" }).theme).toBeNull();
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, motion: "auto" }).motion).toBeNull();
  });

  it("stamps motion in both explicit directions", () => {
    // `full` matters as much as `reduce`: a learner who explicitly asks for
    // motion must get it on a machine configured to reduce it.
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, motion: "reduce" }).motion).toBe("reduce");
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, motion: "full" }).motion).toBe("full");
  });

  it("always reports a language", () => {
    expect(htmlStamps(DEFAULT_PREFERENCES).lang).toBe("kk");
    expect(htmlStamps({ ...DEFAULT_PREFERENCES, locale: "ru" }).lang).toBe("ru");
  });
});

describe("storage key", () => {
  it("is versioned", () => {
    // A schema change gets a new key rather than a migration, so an old value
    // is ignored instead of half-read.
    expect(PREFERENCES_STORAGE_KEY).toMatch(/\.v\d+$/);
  });
});
