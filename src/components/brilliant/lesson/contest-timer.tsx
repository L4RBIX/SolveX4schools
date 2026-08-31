"use client";

import { useEffect, useRef, useState } from "react";
import { L, t } from "@schools/presentation/labels";
import type { Locale } from "@schools/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * The clock on a timed practice contest.
 *
 * Takes SECONDS REMAINING rather than a start instant, because the server did
 * the arithmetic — see `schools/learning/contest.ts`. A device with a wrong
 * clock therefore cannot move the deadline, and a second tab gets the same
 * number from the same ledger row rather than starting a fresh countdown.
 *
 * Anchored on `performance.now()` at mount rather than counting ticks. A
 * background tab has its timers clamped, so counting intervals would make the
 * clock run slow exactly when a learner has switched away to think — the
 * repaint may lag, the countdown may not.
 *
 * At zero it shows 0:00 and blocks nothing. Nothing in this product enforces a
 * time budget: the curriculum asks a learner to practise allocating time, not
 * to be cut off mid-sentence by a machine.
 */
export function ContestTimer({
  remainingSeconds,
  locale,
  className,
}: {
  remainingSeconds: number;
  locale: Locale;
  className?: string;
}) {
  /* The first render shows the server's number straight from the initialiser,
     so there is no synchronous setState in the effect below — the effect only
     records the anchor (a ref, not state) and starts the interval. */
  const anchor = useRef<{ at: number; from: number } | null>(null);
  const [left, setLeft] = useState(remainingSeconds);

  useEffect(() => {
    anchor.current = { at: performance.now(), from: remainingSeconds };

    const tick = () => {
      const a = anchor.current;
      if (!a) return;
      setLeft(Math.max(0, Math.round(a.from - (performance.now() - a.at) / 1000)));
    };
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [remainingSeconds]);

  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  const shown = `${minutes}:${String(seconds).padStart(2, "0")}`;

  /* Under five minutes is the only visual change, and it is a colour rather
     than motion: a flashing clock in front of a learner who is already behind
     is a way to make them slower. */
  const low = left <= 300;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[10px] border-2 px-3 py-1.5",
        low ? "border-b-warn-edge bg-b-warn-fill" : "border-b-sched-edge bg-b-sched-fill",
        className,
      )}
      /* Announced on its own terms rather than read out every second: a live
         region ticking once a second is unusable with a screen reader. */
      role="timer"
      aria-live="off"
      aria-label={`${t(L.contestTimeLeft, locale)}: ${minutes} / ${seconds}`}
    >
      <span className="text-[13px] leading-5 text-b-fg/60">{t(L.contestTimeLeft, locale)}</span>
      <span
        className="font-b-mono text-[16px] leading-5 font-semibold tabular-nums text-b-fg"
        data-testid="contest-timer"
      >
        {shown}
      </span>
    </div>
  );
}
