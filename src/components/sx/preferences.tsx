"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  htmlStamps,
  parsePreferences,
  type Preferences,
} from "@schools/preferences/types";

/**
 * Preferences, held once for the whole app.
 *
 * ## Why one provider and not one per setting
 *
 * Language used to live here alone. Theme, motion, narration and sound all have
 * the same three requirements — survive navigation, survive refresh, follow the
 * person to another machine — and building four copies of that machinery is
 * four chances to get the persistence subtly different. They travel together.
 *
 * ## Three layers, in priority order
 *
 * 1. **The inline script in `layout.tsx`** stamps `<html>` before first paint.
 *    Nothing here can prevent a flash; only something that runs before the
 *    browser paints can, and that has to be a synchronous inline script.
 * 2. **`localStorage`** is the source of truth for an anonymous reader and the
 *    thing the inline script reads.
 * 3. **The account row** is fetched after mount and adopted when it exists,
 *    because a shared classroom machine means the browser's memory belongs to
 *    whoever sat there last, not to the person signed in now.
 *
 * Every storage access is guarded: `localStorage` throws outright in a private
 * window and on a machine configured to block site data, and school machines
 * are exactly where that configuration turns up.
 */

/* Module-level so every consumer shares one value and it survives an unmount.
   `current` is undefined until first read, which is what lets the server
   snapshot differ from the client's without a hydration mismatch. */
let current: Preferences | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStorage(): Preferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return parsePreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function getSnapshot(): Preferences {
  if (current === undefined) current = readStorage();
  return current;
}

function writeStorage(next: Preferences) {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* blocked; the choice still applies for this session */
  }
}

/**
 * Stamp `<html>`.
 *
 * `auto` REMOVES the attribute rather than writing "auto". The CSS falls
 * through to `prefers-color-scheme` only when nothing is stamped, so writing
 * the word would freeze the page into whichever arm is written first.
 */
function stamp(prefs: Preferences) {
  const { theme, motion, lang } = htmlStamps(prefs);
  const root = document.documentElement;

  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");

  if (motion) root.setAttribute("data-motion", motion);
  else root.removeAttribute("data-motion");

  root.lang = lang;
}

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;
  /** Convenience for the very many call sites that only care about language. */
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (value: Localized) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
  initial = DEFAULT_PREFERENCES,
}: {
  children: ReactNode;
  initial?: Preferences;
}) {
  /* An external store rather than an effect that calls setState on mount: the
     effect version renders once at the default and again at the stored value,
     so a Russian-reading learner sees every page flash Kazakh first. */
  const preferences = useSyncExternalStore(subscribe, getSnapshot, () => initial);

  const apply = useCallback((next: Preferences, persist: boolean) => {
    current = next;
    if (persist) writeStorage(next);
    stamp(next);
    emit();
  }, []);

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) => {
      const next = parsePreferences({ ...getSnapshot(), ...patch });
      apply(next, true);

      /* Fire-and-forget to the account. A 401 is the ordinary case on a public
         page and is not an error; a failed write leaves the local value in
         place, which is the right direction to fail in. */
      void fetch("/api/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferences: next }),
      }).catch(() => {});
    },
    [apply],
  );

  /* Adopt the account's stored preferences after mount.
     A shared classroom machine means localStorage belongs to whoever sat here
     last. `null` means this person has never saved anything, in which case the
     local value is the better guess and is kept — and pushed up, so the next
     desk inherits it.

     Deliberately NOT guarded by a `useRef` "run once" flag. React's StrictMode
     mounts, unmounts and remounts in development: the ref survives that, so the
     guard lets the FIRST effect fetch and then its own cleanup sets `live =
     false` before the response lands, while the second effect returns early and
     never fetches. The result is that the account's preferences are silently
     never adopted in development — which is where anyone would test this. The
     `live` flag alone is correct, and one extra request in dev costs nothing. */
  useEffect(() => {
    let live = true;
    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { preferences: Preferences | null } | null) => {
        if (!live || !data) return;
        if (data.preferences === null) {
          void fetch("/api/preferences", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ preferences: getSnapshot() }),
          }).catch(() => {});
          return;
        }
        apply(parsePreferences(data.preferences), true);
      })
      .catch(() => {});

    return () => {
      live = false;
    };
  }, [apply]);

  /* Re-stamp on mount. The inline script already did this from localStorage;
     this covers the case where it could not run (storage blocked) and keeps
     `<html>` in step after a client-side navigation. */
  useEffect(() => {
    stamp(preferences);
  }, [preferences]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
      locale: preferences.locale,
      setLocale: (next: Locale) => setPreferences({ locale: next }),
      t: (v: Localized) => v[preferences.locale],
    }),
    [preferences, setPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

/**
 * Falls back to the defaults outside a provider rather than throwing.
 *
 * A missing provider must not blank a lesson a class is sitting in front of.
 * The fallback is inert — the setters do nothing — so the omission is visible
 * in development (the controls stop working) without being fatal in a
 * classroom.
 */
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (ctx) return ctx;
  return {
    preferences: DEFAULT_PREFERENCES,
    setPreferences: () => {},
    locale: DEFAULT_PREFERENCES.locale,
    setLocale: () => {},
    t: (v: Localized) => v[DEFAULT_PREFERENCES.locale],
  };
}

/**
 * The pre-paint stamp.
 *
 * Runs synchronously in `<head>` before the browser paints anything, which is
 * the only place a theme flash can actually be prevented. Everything it touches
 * is wrapped, because a machine with site data blocked throws on the first
 * `localStorage` read and an unhandled throw here would take the page with it.
 *
 * Kept deliberately tiny and dependency-free — it is inlined into every
 * document.
 */
export const PREFERENCES_BOOT_SCRIPT = `
(function(){try{
var r=document.documentElement;
var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)})||"{}");
if(p.theme==="light"||p.theme==="dark")r.setAttribute("data-theme",p.theme);
if(p.motion==="reduce"||p.motion==="full")r.setAttribute("data-motion",p.motion);
if(p.locale==="kk"||p.locale==="ru")r.lang=p.locale;
}catch(e){}})();
`.trim();
