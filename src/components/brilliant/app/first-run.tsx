"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";

/**
 * The first thing a learner sees, once.
 *
 * Five sentences and a button. Deliberately not a wizard: a fourteen-year-old
 * meeting a new product in a lesson has about twenty seconds of patience, and
 * the things they must understand are few. Two of them are about Nova, because
 * the programme is explicit that a learner always knows they are talking to a
 * program and that help follows an attempt rather than replacing one — and
 * because a tutor a student misreads as "the thing that gives me answers" is
 * worse than no tutor.
 *
 * Dismissal is per browser rather than per account: this is a nicety, not a
 * record, and putting it on the server would mean a row per child to store the
 * fact that they once read a card. Every access is guarded — `localStorage`
 * throws outright in a private window and on school machines configured to
 * block site data, which is exactly the population this runs on.
 */
const KEY = "solvex.firstrun.v1";

/* A browser-only fact read through `useSyncExternalStore` rather than set from
   an effect. Setting state in an effect to read localStorage causes a cascading
   render on every mount — React 19 flags it — and the store form also gives the
   correct server snapshot for free: on the server nobody has dismissed
   anything, and the card must not appear in the HTML. */
const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function dismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    /* Storage throws outright in a private window and on school machines
       configured to block site data — which is exactly the population this runs
       on. Treating that as "already dismissed" is the right failure: the card is
       a courtesy, and an un-dismissable one on every load is worse. */
    return true;
  }
}

/** Server render: no card. It is client-only by nature. */
const dismissedOnServer = () => true;

export function FirstRun() {
  const { locale } = useLocale();
  const loc = locale as Locale;
  const isDismissed = useSyncExternalStore(subscribe, dismissed, dismissedOnServer);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* Nothing to persist. The re-render below still closes it for this session. */
    }
    for (const fn of listeners) fn();
  }, []);

  if (isDismissed) return null;

  const points = [L.welcomeWhat, L.welcomeLessons, L.welcomeNova, L.welcomeNovaLimit, L.welcomeLocale];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(L.welcomeTitle, loc)}
      className="fixed inset-0 z-[200] grid place-items-center bg-black/70 px-6"
    >
      <div className="flex w-full max-w-[460px] flex-col gap-4 rounded-[16px] border-2 border-b-sched-edge bg-b-dark px-6 py-7">
        <h2 className="text-[24px] leading-8 font-bold text-b-fg">{t(L.welcomeTitle, loc)}</h2>
        <ul className="flex flex-col gap-3">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-6 text-b-fg/80">
              <span
                aria-hidden="true"
                className="mt-[9px] size-1.5 shrink-0 rounded-full bg-b-fg/40"
              />
              {t(p, loc)}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={dismiss}
          className="mt-1 h-12 rounded-[12px] border-2 border-b-ok-edge bg-b-ok-fill text-[16px] font-medium text-b-fg"
        >
          {t(L.welcomeStart, loc)}
        </button>
      </div>
    </div>
  );
}
