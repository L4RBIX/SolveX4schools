"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LessonVerdict } from "../lesson-verdict";

/**
 * Interaction primitives for lesson blocks, built on the palette already
 * measured off the live scheduler interactive.
 *
 * Nothing here invents a colour, a radius or a duration. Every value is a token
 * that `schedule-grid.tsx` already uses, so a prediction's options and the
 * scheduler's meeting blocks are visibly the same interactive material:
 *
 *   resting        border-b-sched-edge      bg-b-sched-fill
 *   hover          border-b-sched-edge-hover bg-b-sched-fill-hover
 *   selected       border-b-sched-edge-on   bg-b-sched-fill-on
 *   locked, unset  border-b-lock-edge       bg-b-lock-fill
 *   wrong, chosen  border-b-warn-edge       bg-b-warn-fill
 *   right, chosen  border-b-ok-edge         bg-b-ok-fill
 *
 * That palette reuse is the whole point: an option card that looks like it came
 * from a different product is exactly the failure this migration is correcting.
 */

/* -------------------------------------------------------------------------- */
/* Lesson prose                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The lesson's own typography, measured from the live player:
 * h1 32/42.88 bold with a 22.4px bottom margin, body 16/25.6 with the same.
 */
export function LessonProse({
  title,
  children,
  className,
}: {
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="lesson-content"
      className={cn("w-full leading-[25.6px]", className)}
    >
      {title ? (
        <h1 className="mb-[22.4px] text-[32px] leading-[42.88px] font-bold">
          {title}
        </h1>
      ) : null}
      {children}
    </div>
  );
}

/** A lesson paragraph, with `backticks` promoted to inline code. */
export function LessonParagraph({ text }: { text: string }) {
  return (
    <p className="mb-[22.4px] text-[16px] leading-[25.6px] last:mb-0">
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <code
            key={i}
            className="rounded-[4px] bg-white/10 px-1.5 py-0.5 font-b-mono text-[15px] text-b-green-2"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

/**
 * The prompt line above an interaction. 16/24, matching the scheduler slide's
 * "Tap meeting blocks to construct a valid schedule."
 */
export function BlockPrompt({ children }: { children: ReactNode }) {
  return <p className="w-full text-[16px] leading-6">{children}</p>;
}

/* -------------------------------------------------------------------------- */
/* Code                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Read-only code, in the scheduler panel's shell: a 12px radius, 2px border,
 * and a black plot area inset by 8px — the same construction as the timeline.
 *
 * Line numbers are always on. Half the curriculum's blocks ask the learner to
 * name a line ("which line is wrong", "trace line 4"), so hiding them would
 * make the questions unanswerable.
 */
export function CodePanel({
  code,
  verdict = "unchecked",
  highlightLine,
  className,
}: {
  code: string;
  verdict?: LessonVerdict;
  highlightLine?: number;
  className?: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[12px] border-2 transition-colors duration-200",
        verdict === "unchecked" || verdict === "unmeasured"
          ? "border-b-sched-edge bg-b-sched-fill"
          : verdict === "correct"
            ? "border-b-ok bg-b-ok-panel"
            : "border-b-lock-panel-edge bg-b-lock-panel",
        className,
      )}
    >
      <div className="m-2 overflow-x-auto rounded-[8px] bg-black py-3">
        <pre className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
          <code>
            {lines.map((line, i) => {
              const n = i + 1;
              return (
                <span
                  key={n}
                  className={cn(
                    "flex px-3",
                    highlightLine === n && "bg-white/10",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mr-4 w-6 shrink-0 text-right tabular-nums text-white/30 select-none"
                  >
                    {n}
                  </span>
                  <span className="whitespace-pre text-white">{line || " "}</span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface OptionItem {
  id: string;
  label: string;
  /** Render in the mono face — used when the option is code or output. */
  mono?: boolean;
}

/**
 * The option list.
 *
 * Large targets (56px, well past the 44/48pt minimums), 100ms colour
 * transitions matching the scheduler's own cells, and a selection state that
 * changes border AND fill so the choice is legible without relying on hue.
 *
 * After checking, the correct option is revealed alongside the learner's
 * choice. Hiding it would leave them knowing they were wrong and not what was
 * right, which is the least useful possible outcome of a wrong answer.
 */
export function OptionList({
  options,
  selected,
  correctId,
  verdict,
  onSelect,
  className,
}: {
  options: OptionItem[];
  selected: string | null;
  correctId?: string;
  verdict: LessonVerdict;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const locked = verdict !== "unchecked";
  const revealing = locked && verdict !== "unmeasured" && correctId !== undefined;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isCorrect = option.id === correctId;
        const reveal = revealing && (isSelected || isCorrect);

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={locked}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-[12px] border-2 px-4 py-3",
              "text-left text-[16px] leading-6 select-none",
              "transition-colors duration-100 [-webkit-tap-highlight-color:transparent]",
              !locked && "cursor-pointer",
              locked && "cursor-default",
              // resting / hover / selected — the scheduler's own three states
              !locked &&
                !isSelected &&
                "border-b-sched-edge bg-b-sched-fill hover:border-b-sched-edge-hover hover:bg-b-sched-fill-hover",
              !locked && isSelected && "border-b-sched-edge-on bg-b-sched-fill-on",
              // checked
              locked && !reveal && "border-b-lock-edge bg-b-lock-fill",
              reveal && isCorrect && "border-b-ok-edge bg-b-ok-fill",
              reveal && isSelected && !isCorrect && "border-b-warn-edge bg-b-warn-fill",
              // settled but ungraded: keep the learner's choice visible, neutral
              locked &&
                verdict === "unmeasured" &&
                isSelected &&
                "border-b-sched-edge-on bg-b-sched-fill-on",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                isSelected || (reveal && isCorrect)
                  ? "border-white"
                  : "border-white/40",
              )}
            >
              {isSelected || (reveal && isCorrect) ? (
                <span className="size-2 rounded-full bg-white" />
              ) : null}
            </span>
            <span className={cn("min-w-0 flex-1 break-words", option.mono && "font-b-mono")}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Text entry                                                                 */
/* -------------------------------------------------------------------------- */

export function AnswerField({
  value,
  onChange,
  placeholder,
  label,
  verdict,
  mono = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  verdict: LessonVerdict;
  mono?: boolean;
}) {
  const locked = verdict !== "unchecked";
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-[14px] leading-5 text-white/60">{label}</span>
      <input
        value={value}
        disabled={locked}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-14 w-full rounded-[12px] border-2 bg-black px-4 text-[16px] text-white",
          "placeholder:text-white/30 focus:outline-none disabled:opacity-70",
          mono && "font-b-mono",
          "transition-colors duration-100",
          !locked && "border-b-sched-edge focus:border-b-sched-edge-on",
          locked && verdict === "correct" && "border-b-ok-edge",
          locked && (verdict === "wrong" || verdict === "partial") && "border-b-warn-edge",
          locked && verdict === "unmeasured" && "border-b-lock-edge",
        )}
      />
    </label>
  );
}

export function AnswerArea({
  value,
  onChange,
  placeholder,
  rows = 6,
  verdict,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  verdict: LessonVerdict;
  mono?: boolean;
}) {
  const locked = verdict !== "unchecked";
  return (
    <textarea
      value={value}
      rows={rows}
      disabled={locked}
      placeholder={placeholder}
      spellCheck={!mono}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full resize-y rounded-[12px] border-2 bg-black p-4 text-[16px] leading-[26px] text-white",
        "placeholder:text-white/30 focus:outline-none disabled:opacity-70",
        mono && "font-b-mono",
        "transition-colors duration-100",
        !locked && "border-b-sched-edge focus:border-b-sched-edge-on",
        locked && "border-b-lock-edge",
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Reveal                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Shown after checking. Deliberately quiet — the verdict is already carried by
 * the card border, Koji and the footer, so a fourth shout would be noise.
 */
export function RevealNote({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value?: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-[12px] border-2 px-4 py-3",
        "text-[16px] leading-6",
        tone === "ok" && "border-b-ok bg-b-ok-panel",
        tone === "warn" && "border-b-warn/50 bg-b-warn/10",
        tone === "neutral" && "border-b-lock-edge bg-b-lock-fill",
      )}
    >
      <span className="text-white/60">{label}</span>
      {value ? <span className="font-b-mono text-white">{value}</span> : null}
    </div>
  );
}
