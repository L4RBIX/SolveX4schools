"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TRACK_LABEL, type Locale, type Localized, type TrackLevel } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { cn } from "@/lib/utils";

/**
 * Which route through this month the learner is on.
 *
 * ## Why this control had to exist at all
 *
 * `blocksForTrack` could always honour the three levels; nothing could choose
 * one. Every learner therefore sat on the `core` default, and the three routes
 * the programme sells were a field in a content file that no line of runtime
 * code read. The server half is done — `resolveTrack` on the page, filtering
 * inside `publicLesson` — and this is the only thing that was still missing:
 * a way to say which one you want.
 *
 * ## Why the names are not enough on their own
 *
 * «Қолдау / Негізгі / Тереңдетілген» is curriculum vocabulary. To the person
 * actually clicking it, it is three words that could mean anything, and the
 * one guess a fourteen-year-old will make about "support" is the wrong one. So
 * the selected option always says what it CHANGES — how many tasks, how hard —
 * and the control is framed as a property of the month, never of the child.
 *
 * ## Why the server is still the authority
 *
 * The click is optimistic so the highlight moves under the finger, but the
 * `track` prop comes from the cookie via `resolveTrack`, and when it arrives it
 * wins (see the effect below). A failed POST snaps back rather than leaving the
 * learner looking at a level they are not on.
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

const MEANS: Record<TrackLevel, Localized> = {
  support: L.trackSupportMeans,
  core: L.trackCoreMeans,
  advanced: L.trackAdvancedMeans,
};

export function TrackSwitch({
  monthIndex,
  track,
  locale,
}: {
  monthIndex: number;
  /** The route the server resolved for this month — the authority. */
  track: TrackLevel;
  locale: Locale;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<TrackLevel>(track);

  /* Adjusting state during render, which is React's documented answer to "a
     prop changed and derived state must follow" — and not an effect, because
     an effect would paint the stale highlight for one frame first.
     `router.refresh()` reconciles rather than remounts, so `selected` survives
     the re-render that carries the new cookie value; without this the control
     would keep showing whatever was last clicked even after a back-navigation
     or a change made in another tab. */
  const [fromServer, setFromServer] = useState<TrackLevel>(track);
  if (fromServer !== track) {
    setFromServer(track);
    setSelected(track);
  }

  function choose(next: TrackLevel) {
    if (next === selected || pending) return;
    const previous = selected;
    setSelected(next);

    startTransition(async () => {
      try {
        const res = await fetch("/api/learning/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ monthIndex, track: next }),
        });
        if (!res.ok) {
          setSelected(previous);
          return;
        }
      } catch {
        /* Offline in a school computer lab is a Tuesday. Say nothing, put the
           highlight back where the server still has it, and let them retry. */
        setSelected(previous);
        return;
      }
      /* The lesson pages read the cookie per request, so nothing on THIS screen
         has to change — but the refresh is what makes the prop above match the
         jar, and it is the difference between a control that reports state and
         one that only remembers a click. */
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-[456px] rounded-[20px] border-2 border-b-edge bg-b-elevated px-5 py-4">
      <p className="b-eyebrow text-b-fg/60">{t(L.trackTitle, locale)}</p>

      <div
        role="group"
        aria-label={t(L.trackTitle, locale)}
        className="mt-3 flex gap-2"
      >
        {TRACKS.map((level) => {
          const on = level === selected;
          return (
            <button
              key={level}
              type="button"
              onClick={() => choose(level)}
              aria-pressed={on}
              /* Name AND meaning, because a screen reader user gets no benefit
                 from the description line that only follows the selection. */
              aria-label={`${TRACK_LABEL[level][locale]} — ${t(MEANS[level], locale)}`}
              className={cn(
                "flex-1 cursor-pointer rounded-[14px] border-2 px-2 py-2 text-[14px] leading-[21px] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-purple",
                on
                  ? "border-b-purple bg-b-purple/15 font-bold text-b-fg"
                  : "border-b-edge text-b-fg/40 hover:text-b-fg/80",
              )}
            >
              {TRACK_LABEL[level][locale]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[14px] leading-[21px] text-b-fg/60">
        {t(MEANS[selected], locale)}
      </p>
      <p className="mt-1 text-[13px] leading-[19px] text-b-fg/40">{t(L.trackHint, locale)}</p>
    </div>
  );
}
