"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";

import { FeedbackBar, type FeedbackState } from "./feedback-bar";
import { ProgressSystem } from "./progress-system";

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                    */
/* -------------------------------------------------------------------------- */

interface ButtonBaseProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}

/**
 * #4A5CD6, 48px tall, radius 56px, with the hard 4px #3860BE edge underneath.
 * Pressing sinks it 3px into that edge.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  href,
  className,
}: ButtonBaseProps) {
  const classes = cn(
    "b-press inline-flex h-12 select-none items-center justify-center rounded-[56px] bg-b-blue px-7",
    "text-[16px] font-normal leading-none text-white",
    "shadow-[0_4px_0_0_#3860BE] active:shadow-[0_1px_0_0_#3860BE]",
    "hover:bg-b-blue/90 disabled:pointer-events-none disabled:opacity-40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

/** Transparent, 2px rgba(255,255,255,.2) border, 16px/20px padding, pill. */
export function OutlineButton({
  children,
  onClick,
  disabled,
  href,
  className,
}: ButtonBaseProps) {
  const classes = cn(
    "b-press inline-flex h-12 select-none items-center justify-center rounded-full border-2 border-b-dim-2 bg-transparent px-5",
    "text-[16px] font-medium leading-none text-white",
    "shadow-[0_4px_0_0_rgba(255,255,255,0.2)] active:shadow-[0_1px_0_0_rgba(255,255,255,0.2)]",
    "hover:border-white/40 disabled:pointer-events-none disabled:opacity-40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hearts                                                                     */
/* -------------------------------------------------------------------------- */

const HEART_SLOTS = 3;

function Hearts({ filled }: { filled: number }) {
  return (
    <div
      role="img"
      aria-label={`${filled} of ${HEART_SLOTS} hearts remaining`}
      className="flex shrink-0 items-center gap-1"
    >
      {Array.from({ length: HEART_SLOTS }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className={cn(
            "h-[18px] w-[18px]",
            index < filled ? "text-[#E05A4B]" : "text-b-dim-2",
          )}
          aria-hidden="true"
        >
          <path
            d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chrome                                                                     */
/* -------------------------------------------------------------------------- */

export interface LessonChromeProps {
  total: number;
  current: number;
  /** Lit hearts out of three. Defaults to two, leaving the last one dimmed. */
  hearts?: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
  onClose: () => void;
  /** When set, the bottom bar is replaced by the feedback bar. */
  feedback?: FeedbackState | null;
  children: ReactNode;
  className?: string;
}

/**
 * The fixed lesson frame: 64px top bar, centred content column, 88px bottom
 * bar that becomes the feedback bar once an answer is committed.
 */
export function LessonChrome({
  total,
  current,
  hearts = 2,
  actionLabel,
  actionDisabled = false,
  onAction,
  onClose,
  feedback = null,
  children,
  className,
}: LessonChromeProps) {
  const action = (
    <PrimaryButton onClick={onAction} disabled={actionDisabled}>
      {actionLabel}
    </PrimaryButton>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col overflow-hidden bg-b-dark font-b-sans text-white",
        className,
      )}
    >
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-2 sm:gap-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close lesson"
          className="b-press grid h-12 w-12 shrink-0 place-items-center rounded-full text-b-dim hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M6 6 18 18M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <ProgressSystem total={total} current={current} className="min-w-0 flex-1" />

        <Hearts filled={hearts} />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[600px] lg:max-w-[720px]">{children}</div>
        </div>
      </main>

      <footer className="relative h-[88px] shrink-0 overflow-hidden border-t border-white/10 bg-b-dark">
        {/*
          Stays mounted so it is revealed as the feedback bar slides away, but
          is taken out of the tab order and the a11y tree while covered —
          otherwise the same action is reachable twice.
        */}
        <div
          inert={feedback ? true : undefined}
          className="flex h-full items-center justify-end px-5 sm:px-8"
        >
          {action}
        </div>

        <AnimatePresence initial={false}>
          {feedback ? (
            <FeedbackBar
              key="feedback"
              status={feedback.status}
              message={feedback.message}
              detail={feedback.detail}
              action={action}
            />
          ) : null}
        </AnimatePresence>
      </footer>
    </div>
  );
}
