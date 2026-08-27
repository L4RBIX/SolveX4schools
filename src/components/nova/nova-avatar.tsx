"use client";

import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Nova's face.
 *
 * ## One tutor
 *
 * Nova is the intelligence; Strobi is how Nova looks. There is no second
 * assistant, no separate mascot and no Koji. Product code addresses Nova
 * through the semantic states below and never through an animation string —
 * which is what stops `animation="celebrating2"` from being written somewhere
 * and silently doing nothing.
 *
 * ## The avatar is decorative
 *
 * `aria-hidden` throughout, and the chat carries its own label. A learner using
 * a screen reader loses nothing: every state Nova expresses visually is also
 * said in words by the surrounding UI.
 */

const StrobiAvatar = lazy(() =>
  import("./strobi-avatar").then((m) => ({ default: m.StrobiAvatar })),
);

export type NovaState =
  | "idle"
  | "listening"
  | "thinking"
  | "searching"
  | "working"
  | "correct"
  | "incorrect"
  | "curious"
  | "confused"
  | "proud"
  | "celebrating"
  | "error"
  | "drowsy"
  | "sleeping"
  | "waking";

/**
 * Semantic state → the animation that actually exists in the definition.
 *
 * Every value here is checked against `strobi.avatar.json` by
 * `tests/nova/avatar.test.ts`. A typo fails the suite rather than rendering a
 * still avatar nobody notices.
 *
 * ## What is deliberately not here
 *
 * The definition offers `angry`, `sad` and `scared`. None of them is mapped.
 * A wrong answer is not a moral event, and a fourteen-year-old who gets a
 * prediction wrong — which the programme expects several times per lesson,
 * since it is 70% practice — must not meet disappointment. Wrong maps to
 * `confused`: the honest reading is that something did not line up, not that
 * the learner failed someone.
 */
export const NOVA_ANIMATION: Record<NovaState, string> = {
  idle: "idle",
  listening: "listening",
  thinking: "thinking",
  searching: "searching",
  working: "working",
  correct: "correct-animation",
  // Not `sad`, not `angry`. See above.
  incorrect: "confused",
  curious: "curious",
  confused: "confused",
  proud: "proud",
  celebrating: "celebrate",
  error: "error",
  drowsy: "drowsy",
  sleeping: "sleeping",
  waking: "waking",
};

/**
 * Which states may interrupt which.
 *
 * Higher wins. Without this the idle timer eventually fires in the middle of a
 * celebration and Nova shrugs at a learner who just finished a lesson.
 *
 *   error            a technical failure outranks everything
 *   correct/proud/celebrating  a pedagogical reaction the learner earned
 *   thinking/searching/working generation is in flight
 *   listening/curious/confused interaction
 *   idle/drowsy/sleeping       ambient, always yields
 */
const PRIORITY: Record<NovaState, number> = {
  error: 100,
  celebrating: 80, proud: 78, correct: 76, incorrect: 74,
  working: 60, searching: 58, thinking: 56,
  listening: 40, curious: 38, confused: 36,
  waking: 20, idle: 10, drowsy: 6, sleeping: 4,
};

/**
 * Nova's colour.
 *
 * The definition ships `#77bb41` — a green sphere, which is precisely the
 * reading we are trying to get away from: green is Koji's, and green is also
 * the lesson player's "correct" colour, so a green tutor congratulates the
 * learner on every screen whether or not they got anything right.
 *
 * Violet is `--color-sx-support`. It collides with none of the four states the
 * player already spends colour on (blue = you can act on this, green = correct,
 * red = wrong, amber = partial), and it is the hue the gameboard's pedestal
 * glow already uses, so Nova belongs to the world the rest of the app is in.
 */
const NOVA_BODY = "#a78bfa";

export interface NovaAvatarProps {
  state: NovaState;
  size?: number;
  className?: string;
  /** Opens the chat. Omit for a purely decorative presence. */
  onClick?: () => void;
  label?: string;
}

export function NovaAvatar({ state, size = 96, className, onClick, label }: NovaAvatarProps) {
  const [failed, setFailed] = useState(false);

  const body = failed ? (
    <NovaFallback size={size} />
  ) : (
    /* Lazily loaded and Suspense-wrapped: the lesson's first paint must never
       wait on a mascot. The fallback holds the exact footprint so nothing
       reflows when it arrives. */
    <ErrorBoundary onError={() => setFailed(true)}>
      <Suspense fallback={<NovaFallback size={size} muted />}>
        <StrobiAvatar animation={NOVA_ANIMATION[state]} size={size} bodyColor={NOVA_BODY} />
      </Suspense>
    </ErrorBoundary>
  );

  if (!onClick) {
    return <div className={cn("shrink-0", className)} style={{ width: size, height: size }}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Nova"}
      className={cn(
        "group relative shrink-0 cursor-pointer rounded-full",
        "transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-b-blue",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {body}
    </button>
  );
}

/**
 * What Nova looks like when the avatar cannot load.
 *
 * A plain mark, not an error. Nova's chat works without it, and a broken
 * mascot must never read as a broken tutor.
 */
function NovaFallback({ size, muted }: { size: number; muted?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-full", muted && "opacity-40")}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #c9b6fc 0%, #a78bfa 46%, #6d4bd0 100%)",
      }}
    >
      <span
        className="flex h-full w-full items-center justify-center font-b-sans font-bold text-b-fg"
        style={{ fontSize: size * 0.34 }}
      >
        N
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A boundary narrow enough to be honest: it catches the avatar failing and
 * nothing else. Nova's chat, the lesson and the page all survive it.
 */
class ErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.crashed ? null : this.props.children;
  }
}

/* -------------------------------------------------------------------------- */

/**
 * Hold a state, then fall back, without letting a low-priority state stomp a
 * high-priority one still playing.
 */
export function useNovaState(base: NovaState = "idle") {
  const [state, setState] = useState<NovaState>(base);
  const until = useRef(0);

  const request = (next: NovaState, holdMs = 0) => {
    const now = Date.now();
    if (now < until.current && PRIORITY[next] < PRIORITY[state]) return;
    setState(next);
    until.current = holdMs > 0 ? now + holdMs : 0;
  };

  useEffect(() => {
    if (until.current === 0) return;
    const remaining = until.current - Date.now();
    if (remaining <= 0) return;
    const id = setTimeout(() => {
      until.current = 0;
      setState(base);
    }, remaining);
    return () => clearTimeout(id);
  }, [state, base]);

  return { state, request } as const;
}
