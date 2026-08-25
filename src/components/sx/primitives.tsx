"use client";

import { cn } from "@/lib/utils";
import { IconCheck, IconCross, IconPartial, IconUnknown } from "./icons";
import { UI, useLocale } from "./i18n";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * The one button.
 *
 * Height is 48px, not the 40px a desktop app would use. School devices are
 * frequently touch laptops and tablets, and 48 clears both the 44pt (Apple)
 * and 48dp (Material) minimums without a second variant to get wrong.
 *
 * Press feedback is a 0.98 scale, which does not change layout bounds — a
 * translate would nudge the block below it on every tap.
 */
export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 min-w-[7rem] cursor-pointer items-center justify-center gap-2",
        "rounded-sx-md px-6 text-sx-meta font-semibold",
        "transition-[transform,background-color,border-color,opacity] duration-200",
        "ease-[var(--ease-sx-out)] active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "bg-sx-primary text-white hover:bg-sx-primary-deep",
        variant === "secondary" &&
          "border border-sx-line-strong bg-sx-raised text-sx-text hover:border-sx-text-3",
        variant === "ghost" && "text-sx-text-2 hover:bg-sx-raised hover:text-sx-text",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sx-lg border border-sx-line bg-sx-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verdict                                                                    */
/* -------------------------------------------------------------------------- */

export type Verdict = "correct" | "wrong" | "partial" | "unknown";

/**
 * Result feedback.
 *
 * Carries an icon **and** a word in every state, never colour alone: this is a
 * class of 18 and red-green colourblindness runs at roughly 8% in boys.
 *
 * `unknown` is a first-class state with its own neutral colour, off the
 * success axis entirely. It means nobody has measured this yet — which is not
 * a bad score, and must not look like one.
 */
export function VerdictBanner({
  verdict,
  detail,
  className,
}: {
  verdict: Verdict;
  detail?: string;
  className?: string;
}) {
  const { t } = useLocale();

  const config = {
    correct: {
      Icon: IconCheck,
      label: t(UI.correct),
      tone: "border-sx-correct/35 bg-sx-correct-soft text-sx-correct",
    },
    wrong: {
      Icon: IconCross,
      label: t(UI.wrong),
      tone: "border-sx-wrong/35 bg-sx-wrong-soft text-sx-wrong",
    },
    partial: {
      Icon: IconPartial,
      label: t(UI.partial),
      tone: "border-sx-partial/35 bg-sx-partial-soft text-sx-partial",
    },
    unknown: {
      Icon: IconUnknown,
      label: t(UI.notMeasured),
      tone: "border-sx-unknown/35 bg-sx-unknown-soft text-sx-unknown",
    },
  }[verdict];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sx-rise flex items-start gap-3 rounded-sx-md border px-4 py-3",
        config.tone,
        className,
      )}
    >
      <config.Icon size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sx-meta font-semibold">{config.label}</p>
        {detail ? (
          <p className="mt-1 text-sx-small leading-relaxed opacity-90">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chip                                                                       */
/* -------------------------------------------------------------------------- */

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "support" | "core" | "advanced" | "unknown";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-sx-micro font-semibold tracking-wide uppercase",
        tone === "neutral" && "bg-sx-raised text-sx-text-2",
        tone === "support" && "bg-sx-support/12 text-sx-support",
        tone === "core" && "bg-sx-core/12 text-sx-core",
        tone === "advanced" && "bg-sx-advanced/12 text-sx-advanced",
        tone === "unknown" && "bg-sx-unknown-soft text-sx-unknown",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Code                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Read-only code.
 *
 * Wide code scrolls inside its own box; the page body must never scroll
 * sideways. Line numbers are shown because half the blocks in this curriculum
 * ask the learner to name a line ("which line is wrong?", "trace line 4").
 */
export function CodeBlock({
  code,
  highlightLine,
  showLineNumbers = true,
  className,
}: {
  code: string;
  highlightLine?: number;
  showLineNumbers?: boolean;
  className?: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-sx-md border border-sx-line bg-sx-bg",
        className,
      )}
    >
      <pre className="sx-code w-max min-w-full py-3">
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const hit = highlightLine === n;
            return (
              <span
                key={n}
                className={cn(
                  "flex px-3",
                  hit && "bg-sx-partial-soft",
                )}
              >
                {showLineNumbers ? (
                  <span
                    className="sx-tabular mr-4 w-6 shrink-0 text-right text-sx-text-3 select-none"
                    aria-hidden="true"
                  >
                    {n}
                  </span>
                ) : null}
                <span className="whitespace-pre">{line || " "}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Segmented progress.
 *
 * Segments rather than a bar, because a learner should be able to see *how
 * many things are left*, not a percentage. "Three more" is actionable at 14;
 * "62%" is not.
 */
export function SegmentedProgress({
  total,
  current,
  className,
}: {
  total: number;
  current: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            i < current ? "bg-sx-primary" : "bg-sx-line-strong",
          )}
        />
      ))}
    </div>
  );
}
