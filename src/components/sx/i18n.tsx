"use client";

/**
 * Language.
 *
 * This module used to own the whole mechanism. It now forwards to
 * `PreferencesProvider`, which holds language alongside theme, motion,
 * narration and sound — all five need the same three things (survive
 * navigation, survive refresh, follow the person to another machine), and four
 * separate copies of that machinery is four chances to get persistence subtly
 * different.
 *
 * The re-export is not laziness: ~40 components import `useLocale`, and a
 * rename would be a large diff that changes no behaviour. The shim keeps the
 * call sites honest — there is exactly one store behind them.
 */

export { PreferencesProvider as LocaleProvider, usePreferences } from "./preferences";

import { usePreferences } from "./preferences";
import type { Locale, Localized } from "@schools/curriculum/types";

export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (value: Localized) => string;
} {
  const { locale, setLocale, t } = usePreferences();
  return { locale, setLocale, t };
}
