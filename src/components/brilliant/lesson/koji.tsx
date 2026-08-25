"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import { cn } from "@/lib/utils";
import type { Verdict } from "./schedule-grid";

/**
 * Koji — the tutor avatar in the lesson player's bottom-left dock.
 *
 * Koji is a Rive animation, not artwork. The file already in the repo
 * (`meet_koji.0dced838.riv`, 936 KB, magic `RIVE`) carries the whole reactive
 * set: idles, an 8-way gaze, answer reactions, talking loops and the streak
 * pedestal. Drawing him as a static shape is a correctness bug, so this
 * component mounts the real file.
 *
 * Measured placement, from the live player: the canvas is 128x168 CSS px with a
 * 256x336 backing store (DPR 2), pinned flush to the viewport's left edge and
 * sitting above the lesson card (the card is z-93; the dock is z-856).
 *
 * Artboard / state-machine names below are ENUMERATED, not guessed. Loading the
 * file unconstrained and reading `rive.contents` gave 24 artboards, and it
 * corrected two assumptions that a `strings` dump had produced:
 *
 *   - `NEST_Koji` is an ARTBOARD (state machine `test`, 56 timelines), not a
 *     state machine. Passing it as one made `useRive` fail outright.
 *   - `NEST_DskTutor` is only a theme shim — its entire timeline list is
 *     `darkMode` / `lightMode`. It is not the animated tutor.
 *
 * The full reaction set (`incorrect`, `success-medium`, `correctAfterIncorrect`,
 * `loading-thinking`, the 8-way gaze, the waves) lives on `NEST_Koji_Built` /
 * `NEST_Koji_Adapts` / `NEST_Koji_Concepts` — ~80 timelines each. `_Built` is
 * used here because it is the only one that also carries `isTalking_idle`.
 *
 * No artboard exposes any state-machine INPUTS, so reactions are triggered by
 * playing a named timeline (`rive.play(name)`), not by firing a trigger.
 *
 * The file's default artboard is the lesson scene rather than Koji, so the
 * artboard must be named explicitly; that part is documented behaviour.
 */

export const KOJI_RIV =
  "/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv";

export const ARTBOARD = "NEST_Koji_Built";
export const STATE_MACHINE = "BuiltToMakeYouThink";

/** Dev-only sanity dump of the loaded artboard. */
const RIVE_DEBUG = process.env.NODE_ENV !== "production";

/** Verdict -> the reaction timeline recovered from the file. */
export const REACTION: Record<Exclude<Verdict, "unchecked">, string> = {
  right: "success-medium",
  wrong: "incorrect",
};

/** Present on this artboard; kept for the wider player. */
export const IDLE = "isTalking_idle";

export interface KojiProps {
  verdict?: Verdict;
  /** Bumped by the parent on every check so a repeat verdict replays. */
  attempt?: number;
  className?: string;
}

export function Koji({ verdict = "unchecked", attempt = 0, className }: KojiProps) {
  const { RiveComponent, rive } = useRive({
    src: KOJI_RIV,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
  });

  const logged = useRef(false);

  useEffect(() => {
    if (!rive || !RIVE_DEBUG || logged.current) return;
    logged.current = true;
    (window as unknown as { __rive?: unknown }).__rive = rive;
    try {
      // Structure is already recorded in koji-rive.spec.md; this stays as a
      // quick check that the named artboard still resolves after an asset swap.
      console.info("[koji] rive.contents", JSON.stringify(rive.contents, null, 2));
    } catch {
      console.info("[koji] rive.contents unavailable");
    }
  }, [rive]);

  useEffect(() => {
    if (!rive || verdict === "unchecked") return;
    const name = REACTION[verdict];
    try {
      const inputs = rive.stateMachineInputs(STATE_MACHINE) ?? [];
      const hit = inputs.find((i) => i.name === name);
      if (hit && typeof hit.fire === "function") hit.fire();
      else rive.play(name);
    } catch {
      /* name not present in this artboard; the idle keeps running */
    }
  }, [rive, verdict, attempt]);

  return (
    <div
      className={cn("pointer-events-none h-[168px] w-[128px] shrink-0", className)}
      aria-hidden="true"
    >
      <RiveComponent className="h-full w-full" />
    </div>
  );
}

/* ---- speech bubble ------------------------------------------------------ */

export interface KojiBubbleProps {
  children: React.ReactNode;
  tone?: "warn" | "ok" | "neutral";
  className?: string;
}

/**
 * The tutor's reply. Measured on a wrong answer: `#B78900` fill — the same hue
 * the lesson card's border takes — white 16/24 medium text, 12px/20px padding,
 * max-width 262px, and an asymmetric radius whose small corner (4px) points
 * down-left at Koji.
 */
export function KojiBubble({ children, tone = "warn", className }: KojiBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[262px] rounded-[16px_16px_16px_4px] border-[0.5px] px-5 py-3",
        "text-[16px] leading-6 font-medium text-white",
        tone === "warn" && "border-b-warn bg-b-warn",
        tone === "ok" && "border-b-ok-fill bg-b-ok-fill",
        tone === "neutral" && "border-b-edge bg-b-panel",
        className,
      )}
    >
      {children}
    </div>
  );
}
