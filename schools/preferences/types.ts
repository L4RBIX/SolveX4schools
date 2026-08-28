import type { Locale } from "@schools/curriculum/types";

/**
 * Everything a learner can decide about how the product behaves.
 *
 * Kept free of `server-only` and free of React: the same shape is validated on
 * the server, persisted against an account, mirrored into `localStorage`, and
 * read by a client provider. One definition, so those four can never disagree
 * about what a valid value is.
 *
 * Every field is a THREE-state choice where a system signal exists, not a
 * boolean. "auto" is not a synonym for the default — it means *keep following
 * the operating system*, which is a different and better answer than freezing
 * today's OS value into the account.
 */

export type ThemeChoice = "auto" | "light" | "dark";

/** `auto` follows `prefers-reduced-motion`; the other two override it. */
export type MotionChoice = "auto" | "reduce" | "full";

export interface Preferences {
  theme: ThemeChoice;
  locale: Locale;
  motion: MotionChoice;
  /** Nova reading the lesson aloud. Only offered where a voice exists. */
  novaNarration: boolean;
  /** Verdict chimes in the lesson player. */
  soundEffects: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "auto",
  /* Kazakh, and that is a decision rather than a placeholder: this is a Kazakh
     school programme and Kazakh is not the alternate. */
  locale: "kk",
  motion: "auto",
  /* Narration OFF by default. A lesson that starts talking in a room of
     eighteen students is a lesson the teacher has to stop. */
  novaNarration: false,
  /* Sound OFF by default, for the same room. */
  soundEffects: false,
};

const THEMES: readonly ThemeChoice[] = ["auto", "light", "dark"];
const MOTIONS: readonly MotionChoice[] = ["auto", "reduce", "full"];
const LOCALES: readonly Locale[] = ["kk", "ru"];

/**
 * Coerce anything into a valid Preferences.
 *
 * Used on BOTH sides on purpose. The client reads `localStorage`, which a
 * learner can edit and a previous version of this app may have written in an
 * older shape; the server reads a request body, which is untrusted by
 * definition. Neither may throw and neither may pass a bad value through — an
 * unrecognised theme has to become `auto`, not `undefined`, or the stamp on
 * `<html>` ends up as the literal string "undefined".
 */
export function parsePreferences(raw: unknown): Preferences {
  const o = (raw ?? {}) as Record<string, unknown>;
  const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;

  return {
    theme: pick(o.theme, THEMES, DEFAULT_PREFERENCES.theme),
    locale: pick(o.locale, LOCALES, DEFAULT_PREFERENCES.locale),
    motion: pick(o.motion, MOTIONS, DEFAULT_PREFERENCES.motion),
    novaNarration:
      typeof o.novaNarration === "boolean"
        ? o.novaNarration
        : DEFAULT_PREFERENCES.novaNarration,
    soundEffects:
      typeof o.soundEffects === "boolean"
        ? o.soundEffects
        : DEFAULT_PREFERENCES.soundEffects,
  };
}

/** The `<html>` stamps. `auto` stamps nothing, so CSS falls through to the OS. */
export function htmlStamps(prefs: Preferences): {
  theme: string | null;
  motion: string | null;
  lang: Locale;
} {
  return {
    theme: prefs.theme === "auto" ? null : prefs.theme,
    motion: prefs.motion === "auto" ? null : prefs.motion,
    lang: prefs.locale,
  };
}

export const PREFERENCES_STORAGE_KEY = "solvex.preferences.v1";
