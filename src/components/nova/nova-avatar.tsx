"use client";

import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
 *
 * Exported because the ladder is a product decision, not an implementation
 * detail: "a wrong answer outranks a hint that is still streaming" is the kind
 * of rule that gets quietly re-tuned by whoever is adding the next state, and
 * the only way to notice is for a test to be able to read the table.
 */
export const PRIORITY: Record<NovaState, number> = {
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
 *
 * ## Why the deadline is state and not only a ref
 *
 * The first version wrote the deadline into a ref and then called
 * `setState(next)`. When `next` was the state Nova was already in, React bailed
 * out of the render, the effect keyed on `[state, base]` never re-ran, and no
 * new timer was scheduled — while the timer from the FIRST request stayed on
 * the clock, fired at the original deadline and cleared the ref.
 *
 * That is not a theoretical path. A second wrong answer inside the 3.2s
 * reaction is an ordinary minute for a fourteen-year-old working through
 * September's practice, and the programme is 70% practice by design. The
 * visible result was Nova dropping to idle about two seconds early, and the far
 * worse invisible one: the deadline was now zero, so the priority guard was off
 * for everything that came after it.
 *
 * So every accepted request mints a new `hold` record. Its identity changes
 * even when the state does not, which is what makes the effect re-run and
 * reschedule. The ticket is there so the fix survives contact with a later
 * "simplification": collapsed back to a bare deadline number, two requests
 * landing in the same millisecond with the same hold would compare equal and
 * the bug would return with nothing to show for it in the diff.
 *
 * ## Why the ladder is consulted on every request
 *
 * `thinking`, `searching` and `working` are requested with no hold, because
 * nobody knows in advance how long a model will take. Consulting the ladder
 * only while a hold was pending therefore left generation completely
 * unprotected: any ambient request replaced it, and Nova sat blank-faced while
 * an answer was still arriving in the panel beside it.
 *
 * The ladder now applies to every request, with exactly one exception — the
 * hook's own resting state. Asking for `base` is not a competing expression,
 * it is the caller saying "I have finished", which is precisely what the chat
 * does when a stream ends. It is still refused while a timed reaction is owed
 * its seconds, so a hint that lands mid-celebration cannot cut the celebration
 * short.
 */
export function useNovaState(base: NovaState = "idle") {
  const [state, setState] = useState<NovaState>(base);
  const [hold, setHold] = useState<{ until: number; ticket: number } | null>(null);

  /* The read path for `request`. It has to see the truth as of THIS event, not
     as of the last render: two requests inside one handler would otherwise both
     compare against a state React has not applied yet. */
  const current = useRef<NovaState>(base);
  const until = useRef(0);
  const ticket = useRef(0);

  const request = useCallback(
    (next: NovaState, holdMs = 0) => {
      const now = Date.now();
      const holding = now < until.current;
      const release = next === base && !holding;

      if (!release && PRIORITY[next] < PRIORITY[current.current]) return;

      current.current = next;
      setState(next);

      if (holdMs > 0) {
        until.current = now + holdMs;
        ticket.current += 1;
        setHold({ until: until.current, ticket: ticket.current });
      } else {
        /* A sustained state owns the avatar until something outranks it. The
           timer belonging to whatever it just replaced must not survive to drag
           it back to idle mid-generation. */
        until.current = 0;
        setHold(null);
      }
    },
    [base],
  );

  useEffect(() => {
    if (hold === null) return;
    const id = setTimeout(
      () => {
        until.current = 0;
        current.current = base;
        setState(base);
        setHold(null);
      },
      // Clamped rather than skipped: a deadline already in the past still owes
      // the fall back, and returning early here is how Nova gets stuck wearing
      // a reaction to something that happened a minute ago.
      Math.max(0, hold.until - Date.now()),
    );
    return () => clearTimeout(id);
  }, [hold, base]);

  return { state, request } as const;
}
