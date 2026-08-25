"use client";

import { useSyncExternalStore } from "react";

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
export function useProgress(): ProgressSnapshot {
  return useSyncExternalStore(subscribeProgress, loadProgress, serverProgress);
}
