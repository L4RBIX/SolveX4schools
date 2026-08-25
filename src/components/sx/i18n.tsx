"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Locale, Localized } from "@schools/curriculum/types";

/**
 * Language, held once for the whole app.
 *
 * The programme is taught in Kazakh; Russian is offered because a real class of
 * 18 will contain students who read one more comfortably than the other.
 * Technical syntax (`if`, `for`, `return`) stays English in both — renaming
 * keywords would teach a language that does not exist.
 *
 * Default is `kk`. That is a decision, not a placeholder: this is a Kazakh
 * school programme and Kazakh is not the alternate.
 *
 * ## Why the provider sits in the root layout
 *
 * It used to be mounted per surface, which meant the choice survived exactly as
 * long as the page did. A learner who switched to Russian on the home screen
 * was back in Kazakh the moment they opened a lesson. Across six surfaces plus
 * a full-screen player that is not a preference control, it is a nuisance.
 *
 * The choice is persisted, and every storage access is guarded: `localStorage`
 * throws outright in a private window or on a machine configured to block site
 * data, and school machines are exactly where that configuration turns up.
 */

const STORAGE_KEY = "solvex.locale.v1";

/* Module-level so the choice is shared by every consumer and survives an
   unmount. `current` is undefined until first read, which is what lets the
   server snapshot differ from the client's without a hydration mismatch. */
let current: Locale | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Locale | undefined {
  if (current !== undefined) return current;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    current = raw === "kk" || raw === "ru" ? raw : "kk";
  } catch {
    current = "kk";
  }
  return current;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (value: Localized) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initial = "kk",
}: {
  children: ReactNode;
  initial?: Locale;
}) {
  /* An external store rather than an effect that calls setState on mount: the
     effect version renders once in Kazakh and again in the stored language, so
     a Russian-reading learner sees every page flash Kazakh first. */
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  const locale = stored ?? initial;

  const setLocale = useCallback((next: Locale) => {
    current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* blocked; the choice still applies for this session */
    }
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (v: Localized) => v[locale] }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Falls back to Kazakh outside a provider rather than throwing.
 *
 * A missing provider must not blank a lesson a class is sitting in front of.
 * The fallback is inert — `setLocale` does nothing — so the omission is visible
 * in development (the switch stops working) without being fatal in a classroom.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return {
    locale: "kk",
    setLocale: () => {},
    t: (v: Localized) => v.kk,
  };
}
