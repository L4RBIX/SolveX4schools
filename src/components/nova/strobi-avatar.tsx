"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { STROBI, type Expression, type EyeShape } from "./strobi-definition";

/**
 * Strobi, rendered from the definition file.
 *
 * DOM and CSS rather than canvas: the whole avatar is a sphere and two eyes,
 * every animated property (width, height, translate, rotate) is something CSS
 * transitions natively, and the browser's own interpolation gives the "smooth"
 * transition the definition asks for without a single frame of hand-written
 * tweening.
 *
 * Coordinate system, read off the file's own ranges:
 *   head.x/y/z   -21 … 35    degrees of rotation, applied with perspective
 *   eye.width    19 … 56     px at the definition's 240px body
 *   eye.height   12 … 85
 *   eye.y       -21 … 40     positive is down
 *   eye.angle   -36 … 29     degrees
 *   spacing      35 … 71     px between eye centres
 *
 * Everything is expressed as a fraction of the 240px reference body, so the
 * avatar is resolution-independent and one `size` prop scales it truthfully.
 */

const REF = 240;

export interface StrobiAvatarProps {
  /** Must exist in the definition. Validated by `validateDefinition`. */
  animation: string;
  /** Rendered size in px. The definition is authored against 240. */
  size?: number;
  className?: string;
  /**
   * Force the motion preference rather than reading it.
   *
   * Left undefined — the normal case — the component reads the product's own
   * setting; see `useMotionPreference`. Reduced motion holds the animation's
   * FIRST expression and stops the step cycle, the blink and the idle drift. It
   * does not blank the avatar: Strobi is a presence, and a missing one reads as
   * breakage. Nothing in the lesson depends on it either way — the avatar is
   * decorative by design and carries `aria-hidden`.
   */
  reducedMotion?: boolean;
  /**
   * Overrides the definition's own body colour.
   *
   * The file ships `#77bb41`. Nova wears the product's accent instead, so the
   * mascot belongs to SolveX rather than to whoever authored the definition.
   */
  bodyColor?: string;
}

export function StrobiAvatar({
  animation,
  size = 128,
  className,
  reducedMotion,
  bodyColor,
}: StrobiAvatarProps) {
  const preferred = useMotionPreference();
  const still = reducedMotion ?? preferred;

  /*
   * Keyed on `animation` so a reaction remounts and starts at its own first
   * step. The alternative — resetting the step index from an effect — makes
   * every reaction render once at the wrong expression before correcting
   * itself, which is visible as a flick on a 200ms transition.
   */
  return (
    <StrobiCycle
      key={animation}
      animation={animation}
      size={size}
      className={className}
      still={still}
      bodyColor={bodyColor}
    />
  );
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The motion preference the product actually has.
 *
 * The setting lives in SolveX's own preferences, not in the operating system:
 * `<html data-motion="reduce">` or `"full"` once the learner has chosen, and no
 * attribute at all while they have not. Both stylesheets are built on exactly
 * that rule. Reading only the OS query here was wrong in both directions:
 *
 *   `data-motion="reduce"` on a machine with no OS preference — the step cycle
 *   and the blink kept firing while the CSS flattened every transition to
 *   0.001ms, so a cross-fade the definition authored as 200ms of easing became
 *   a hard snap every few seconds. Strictly worse than doing nothing.
 *
 *   `data-motion="full"` on a machine whose OS asks to reduce — the avatar
 *   froze anyway, and the switch in the product's own settings did nothing.
 *
 * A learner who set this set it because animation makes them dizzy, or because
 * they cannot read a lesson next to something that keeps moving. A preference
 * in a school product that visibly does nothing also teaches them that the
 * settings screen is decorative, which outlasts the lesson it spoiled.
 *
 * Read as an external store rather than mirrored into state: the attribute is
 * stamped on `<html>` before first paint, changed later by the preferences
 * panel, and the media query can move under both.
 */
function useMotionPreference(): boolean {
  const subscribe = useCallback((notify: () => void) => {
    const mq = window.matchMedia(REDUCE_QUERY);
    mq.addEventListener("change", notify);
    /* The attribute is set imperatively on `document.documentElement`, so there
       is no React update to subscribe to — an observer is the only way to hear
       a learner flip the switch while a lesson is open. */
    const observer = new MutationObserver(notify);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    return () => {
      mq.removeEventListener("change", notify);
      observer.disconnect();
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    readMotionPreference,
    // Server render: assume motion is fine. Getting this wrong the other way
    // would ship a frozen avatar to everyone until hydration.
    () => false,
  );
}

/** The stamp wins in both directions; nothing stamped means "follow the OS". */
function readMotionPreference(): boolean {
  const stamped = document.documentElement.getAttribute("data-motion");
  if (stamped === "reduce") return true;
  if (stamped === "full") return false;
  return window.matchMedia(REDUCE_QUERY).matches;
}

function StrobiCycle({
  animation,
  size,
  className,
  still,
  bodyColor,
}: {
  animation: string;
  size: number;
  className?: string;
  still: boolean;
  bodyColor?: string;
}) {
  const scale = size / REF;
  const anim = STROBI.animations[animation] ?? STROBI.animations.idle;

  const [stepIndex, setStepIndex] = useState(0);
  const [blinking, setBlinking] = useState(false);

  /* Step cycle. Each step holds, then the NEXT step's transition carries the
     eyes across — which is why the timer waits hold + transition. */
  useEffect(() => {
    if (still || anim.steps.length <= 1) return;
    const step = anim.steps[stepIndex % anim.steps.length];
    const id = setTimeout(
      () => setStepIndex((i) => (i + 1) % anim.steps.length),
      step.holdMs + step.transitionMs,
    );
    return () => clearTimeout(id);
  }, [anim, stepIndex, still]);

  /* Blink. Interval is randomised inside the definition's own bounds so two
     avatars on one screen do not blink in lockstep, which reads as mechanical. */
  useEffect(() => {
    if (still || !anim.blink.enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        timer = setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          const { minIntervalMs, maxIntervalMs } = anim.blink;
          schedule(minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs));
        }, anim.blink.durationMs);
      }, delay);
    };

    schedule(anim.blink.initialDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [anim, still]);

  const step = anim.steps[stepIndex % anim.steps.length] ?? anim.steps[0];
  const expr: Expression =
    STROBI.expressions[step.expression] ?? STROBI.expressions.neutral;
  const ms = still ? 0 : step.transitionMs;

  const bodyMotion = expr.motion.body;
  const eyeMotion = expr.motion.eyes;

  const body = bodyColor ?? STROBI.colors.body;
  const eyes = STROBI.colors.eyes;

  return (
    <div
      className={cn("relative shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0",
          !still && bodyMotion === "slowDrift" && "strobi-drift",
          !still && bodyMotion === "shake" && "strobi-shake",
        )}
        style={{ perspective: `${420 * scale}px` }}
      >
        {/* the body: a sphere, lit from upper-left */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, ${lighten(body, 0.28)} 0%, ${body} 46%, ${darken(body, 0.22)} 100%)`,
            boxShadow: `inset 0 ${-10 * scale}px ${22 * scale}px ${darken(body, 0.34)}44`,
          }}
        />

        {/* the eyes, carried by the head's rotation */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `rotateX(${-expr.head.x}deg) rotateY(${expr.head.y}deg) rotateZ(${expr.head.z}deg)`,
            transformStyle: "preserve-3d",
            transition: `transform ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <div
            className={cn(
              "flex items-center",
              !still && eyeMotion === "microSaccades" && "strobi-saccade",
              !still && eyeMotion === "shake" && "strobi-eyeshake",
            )}
            style={{
              gap: `${expr.eyes.spacing * scale}px`,
              transition: `gap ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            <Eye shape={expr.eyes.left} scale={scale} ms={ms} blink={blinking} color={eyes} />
            <Eye shape={expr.eyes.right} scale={scale} ms={ms} blink={blinking} color={eyes} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Eye({
  shape,
  scale,
  ms,
  blink,
  color,
}: {
  shape: EyeShape;
  scale: number;
  ms: number;
  blink: boolean;
  color: string;
}) {
  return (
    <span
      style={{
        width: `${shape.width * scale}px`,
        height: `${shape.height * scale}px`,
        // A capsule: the radius is half the short side, so a tall eye is a
        // rounded slot and a squat one is a lens. Both read as an eye.
        borderRadius: `${Math.min(shape.width, shape.height) * scale * 0.5}px`,
        background: color,
        display: "block",
        transform: `translate(${shape.x * scale}px, ${shape.y * scale}px) rotate(${shape.angle}deg) scaleY(${blink ? 0.06 : 1})`,
        transformOrigin: "center",
        transition: `width ${ms}ms cubic-bezier(0.4,0,0.2,1), height ${ms}ms cubic-bezier(0.4,0,0.2,1), transform ${blink ? 90 : ms}ms cubic-bezier(0.4,0,0.2,1)`,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) =>
    amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
  return `rgb(${clampByte(mix(r))}, ${clampByte(mix(g))}, ${clampByte(mix(b))})`;
}

const lighten = (hex: string, a: number) => shade(hex, a);
const darken = (hex: string, a: number) => shade(hex, -a);
