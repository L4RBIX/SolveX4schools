"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { ProgressSnapshot } from "@schools/presentation/adapters";

/**
 * Learner progress, stored per browser.
 *
 * This is a placeholder for the real thing. Progress belongs on the server,
 * keyed to an enrolled student, and will move there when auth exists. Until
 * then it lives here so the milestone loop is observable — a lesson that
 * completes and changes nothing on the board reads as broken even when every
 * part works.
 *
 * ## Every access is guarded
 *
 * `localStorage` does not merely return null when unavailable — the accessor
 * itself throws in a private window, in a preview frame, and on a machine whose
 * browser is configured to block site data. School machines are exactly the
 * population where that configuration is common. An unguarded read there is a
 * white screen instead of an empty year, so every call below is wrapped and
 * every failure degrades to "nothing recorded".
 */

const KEY = "solvex.progress.v1";

interface StoredProgress {
  completedLessons: string[];
  currentLessonId: string | null;
  currentMonth: number;
}

const EMPTY: StoredProgress = {
  completedLessons: [],
  currentLessonId: null,
  currentMonth: 1,
};

function read(): StoredProgress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons.filter((x): x is string => typeof x === "string")
        : [],
      currentLessonId:
        typeof parsed.currentLessonId === "string" ? parsed.currentLessonId : null,
      currentMonth:
        typeof parsed.currentMonth === "number" && parsed.currentMonth >= 1
          ? parsed.currentMonth
          : 1,
    };
  } catch {
    return EMPTY;
  }
}

function write(next: StoredProgress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Blocked or full. The session still works; it just will not be remembered. */
  }
}

/* ---------------------------------------------------------------------------
   Reactive access

   Exposed through `useSyncExternalStore` rather than an effect that calls
   setState on mount. The effect version works, but it renders once with empty
   progress and again with the real thing — a visible flash of "nothing
   completed" on every navigation, and React flags it as a cascading render.

   The snapshot must be referentially STABLE between notifications or the store
   re-renders forever, so it is cached and only rebuilt when something actually
   writes.
   ------------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let cache: ProgressSnapshot | null = null;

/** Same object every time on the server: there is no storage to read there. */
const SERVER_SNAPSHOT: ProgressSnapshot = {
  completedLessons: new Set(),
  currentLessonId: null,
  currentMonth: 1,
};

function invalidate(): void {
  cache = null;
  for (const listener of listeners) listener();
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadProgress(): ProgressSnapshot {
  if (cache) return cache;
  const stored = read();
  cache = {
    completedLessons: new Set(stored.completedLessons),
    currentLessonId: stored.currentLessonId,
    currentMonth: stored.currentMonth,
  };
  return cache;
}

export function serverProgress(): ProgressSnapshot {
  return SERVER_SNAPSHOT;
}

export function markLessonComplete(lessonId: string): void {
  const stored = read();
  if (!stored.completedLessons.includes(lessonId)) {
    stored.completedLessons.push(lessonId);
  }
  stored.currentLessonId = null;
  write(stored);
  invalidate();
}

export function setCurrentLesson(lessonId: string | null): void {
  const stored = read();
  stored.currentLessonId = lessonId;
  write(stored);
  invalidate();
}

export function resetProgress(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
  invalidate();
}

/* -------------------------------------------------------------------------- */

/**
 * Progress, without the mount flash.
 *
 * `useSyncExternalStore` gives the server a stable empty snapshot and the
 * client the stored one on the very first client render, so a learner never
 * sees their completed lessons blink from empty to filled.
 */
/**
 * The learner's progress, seeded from the server.
 *
 * ## The defect
 *
 * This read `localStorage` and nothing else, and the course map read this. So
 * the map's completion ticks and lock marks were a browser's opinion: finishing
 * a lesson lit nothing up if the write had not landed yet, a second device
 * showed an empty year to a learner who had finished September, and clearing
 * site data erased a school's record from the learner's own view of it.
 * `lesson_completions` — the row the completion route refuses to write unless
 * the policy is satisfied against the ledger — was never consulted.
 *
 * ## Why a union rather than a replacement
 *
 * The local copy is what makes the board change in the SAME FRAME as the
 * completion. A lesson that finishes and lights nothing up reads as broken even
 * when every part works, and that responsiveness is worth keeping.
 *
 * The server copy is what makes it true. A union is the honest merge of the
 * two: the server knows everything that was recorded, the browser knows the one
 * thing that was recorded a moment ago and has not been re-fetched, and neither
 * can be wrong in the direction that matters — a completion in either is a
 * completion that happened, because both are written by the same route.
 *
 * `seed` comes from a server component, so it is a fact about the learner
 * rather than a fetch this hook has to manage.
 */
export function useProgress(seed?: readonly string[]): ProgressSnapshot {
  const local = useSyncExternalStore(subscribeProgress, loadProgress, serverProgress);
  return useMemo(() => {
    if (!seed || seed.length === 0) return local;
    const completedLessons = new Set(local.completedLessons);
    for (const id of seed) completedLessons.add(id);
    return { ...local, completedLessons };
  }, [local, seed]);
}
