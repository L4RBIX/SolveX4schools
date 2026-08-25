"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { QuestionOption } from "./lesson-data";

export type QuestionVerdict = "correct" | "wrong" | null;

type OptionState = "idle" | "selected" | "correct" | "wrong";

/**
 * Border colour plus the matching hard 4px edge, and the shallower edge the
 * button sinks onto while pressed. Never blurred.
 */
const OPTION_SKIN: Record<OptionState, string> = {
  idle: "border-b-dim-2 shadow-[0_4px_0_0_rgba(255,255,255,0.2)] active:shadow-[0_1px_0_0_rgba(255,255,255,0.2)] hover:border-white/35",
  selected:
    "border-b-blue shadow-[0_4px_0_0_#3860BE] active:shadow-[0_1px_0_0_#3860BE]",
  correct: "border-b-green-2 shadow-[0_4px_0_0_#5ED981]",
  wrong: "border-[#E05A4B] shadow-[0_4px_0_0_#E05A4B]",
};

export interface QuestionBlockProps {
  prompt: string;
  diagram?: ReactNode;
  options: QuestionOption[];
  explanation: string;
  /** Fires once per commit with whether the committed option was right. */
  onResolved: (correct: boolean) => void;
  /** Selection is held by the lesson so the chrome can enable Check. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  verdict: QuestionVerdict;
  attempts: number;
  /** The lesson raises this each time Check is pressed. */
  commitSignal: number;
  className?: string;
}

/**
 * Multiple choice with a two-step commit: tap to select, then Check in the
 * bottom bar. The correct option stays hidden until the second miss.
 */
export function QuestionBlock({
  prompt,
  diagram,
  options,
  explanation,
  onResolved,
  selectedId,
  onSelect,
  verdict,
  attempts,
  commitSignal,
  className,
}: QuestionBlockProps) {
  const reduce = useReducedMotion();
  const lastCommit = useRef(commitSignal);
  const shakenFor = useRef(0);
  const shake = useAnimationControls();

  useEffect(() => {
    if (commitSignal === lastCommit.current) return;
    lastCommit.current = commitSignal;

    const picked = options.find((option) => option.id === selectedId);
    if (!picked) return;
    onResolved(picked.correct);
  }, [commitSignal, options, selectedId, onResolved]);

  useEffect(() => {
    if (verdict !== "wrong" || attempts <= shakenFor.current) return;
    shakenFor.current = attempts;
    if (reduce) return;

    void shake.start({
      x: [0, -6, 6, -4, 4, 0],
      transition: { duration: 0.4, ease: EASE_OUT_QUINT },
    });
  }, [verdict, attempts, reduce, shake]);

  const revealed = verdict === "wrong" && attempts >= 2;
  const showExplanation = verdict === "correct" || revealed;
  const locked = verdict !== null;

  const stateFor = (option: QuestionOption): OptionState => {
    if (option.id === selectedId && verdict === "correct") return "correct";
    if (option.id === selectedId && verdict === "wrong") return "wrong";
    if (revealed && option.correct) return "correct";
    if (option.id === selectedId) return "selected";
    return "idle";
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {diagram ? <div className="mb-8 w-full">{diagram}</div> : null}

      <h2 className="max-w-[640px] text-center text-[20px] font-bold leading-[1.3] text-white sm:text-[24px]">
        {prompt}
      </h2>

      <div
        className={cn(
          "mt-8 grid w-full gap-3",
          options.length === 4 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((option) => {
          const state = stateFor(option);
          const isCorrect = state === "correct";
          const isWrong = state === "wrong";

          return (
            <motion.div
              key={option.id}
              animate={option.id === selectedId ? shake : undefined}
            >
              <button
                type="button"
                aria-pressed={option.id === selectedId}
                disabled={locked}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "b-press flex min-h-16 w-full items-center justify-between gap-3 rounded-[16px] border-2 bg-b-dark px-5 py-4 text-left",
                  "text-[18px] font-normal leading-6 text-white disabled:cursor-default",
                  OPTION_SKIN[state],
                )}
              >
                <span className="min-w-0">{option.label}</span>

                <AnimatePresence initial={false}>
                  {isCorrect || isWrong ? (
                    <motion.span
                      key={isCorrect ? "check" : "cross"}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                        isCorrect ? "bg-b-green-2" : "bg-[#E05A4B]",
                      )}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        {isCorrect ? (
                          <path
                            d="M5 12.5 10 17.5 19 7"
                            stroke="#141414"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          <path
                            d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
                            stroke="#141414"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {showExplanation ? (
          <motion.div
            key="explanation"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT_QUINT }}
            className="mt-6 w-full rounded-[16px] border-2 border-b-green-2 bg-b-green-2/10 px-5 py-4 text-left text-[16px] leading-6 text-white"
          >
            {explanation}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="sr-only" aria-live="polite">
        {verdict === "correct"
          ? "Correct."
          : verdict === "wrong"
            ? "Not quite. Try again."
            : ""}
      </p>
    </div>
  );
}
