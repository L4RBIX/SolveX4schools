"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { CodePanel } from "./primitives";

/**
 * Step-by-step execution.
 *
 * The approved programme makes this the central teaching tool of September —
 * «кодтың қадамдық орындалуы ... Бұл түсінудің басты құралы» — and what the
 * month actually shipped was a dashed box announcing that the visualisation was
 * not ready. This is that tool: one line at a time, the values the line leaves
 * behind, and everything printed so far.
 *
 * ## Why the trace is data, not animation
 *
 * `buildStepProgram` interprets the config into a finished list of states, and
 * the component only picks one out by index. That means there is no simulated
 * clock to get out of sync with the UI, Previous is exactly as trustworthy as
 * Next, and the whole model is a pure function anyone can assert against
 * without mounting React.
 *
 * ## Why it stays small
 *
 * A beginner meeting `//` and `%` for the first time does not need breakpoints,
 * a call stack or an editor. Those are for people who already know what a step
 * IS. The three controls here are the entire interaction surface.
 */

export interface StepVariable {
  name: string;
  value: string;
}

export interface ExecutionStep {
  /**
   * 1-indexed line that HAS JUST RUN — not the one about to run.
   *
   * Both conventions exist in real debuggers, and for a beginner the
   * about-to-run one is quietly confusing: it highlights `n = 17` while the
   * panel underneath already shows `n = 17`, so the line and the state
   * contradict each other. Past tense keeps the two in agreement.
   */
  line: number;
  /** Every variable that exists after the line ran, in creation order. */
  vars: StepVariable[];
  /** Everything printed so far, oldest first. */
  output: string[];
  /** What this line did, in the learner's language. */
  note: Localized;
  /** Name of the variable this line wrote, so the panel can point at it. */
  wrote?: string;
  /** True when this line pushed the last entry of `output`. */
  printed?: boolean;
}

export interface StepProgram {
  code: string;
  steps: ExecutionStep[];
}

/**
 * The trace, derived from the block's `config`.
 *
 * `{ total: 17, groups: 5 }` walks the four lines the lesson is about — two
 * assignments, then `//` and `%` — but nothing here is specific to 17 and 5,
 * so a later block can hand it a different pair and get a correct trace.
 *
 * Returns null rather than inventing a program when the config cannot be read.
 * A visualiser that quietly falls back to somebody else's numbers teaches the
 * wrong arithmetic with total confidence; the caller shows the honest "not
 * ready" card instead.
 */
export function buildStepProgram(
  config: Record<string, unknown> | undefined,
): StepProgram | null {
  const total = asInteger(config?.total);
  const groups = asInteger(config?.groups);
  // A zero divisor has no story to tell, and the Python being imitated would
  // raise rather than print, so refusing is the only truthful option.
  if (total === null || groups === null || total < 0 || groups <= 0) return null;

  const quotient = Math.floor(total / groups);
  const remainder = total % groups;
  const n: StepVariable = { name: "n", value: String(total) };
  const k: StepVariable = { name: "k", value: String(groups) };

  return {
    /* The same program the learner writes for themselves four blocks later at
       m1.l3.b5, down to the variable names. Stepping through one shape and then
       being asked for another would waste the demonstration. */
    code: [`n = ${total}`, `k = ${groups}`, "print(n // k)", "print(n % k)"].join("\n"),
    steps: [
      {
        line: 1,
        vars: [n],
        output: [],
        wrote: "n",
        note: L.stepAssign("n", n.value),
      },
      {
        line: 2,
        vars: [n, k],
        output: [],
        wrote: "k",
        note: L.stepAssign("k", k.value),
      },
      {
        line: 3,
        vars: [n, k],
        output: [String(quotient)],
        printed: true,
        note: L.stepQuotient(total, groups, quotient),
      },
      {
        line: 4,
        vars: [n, k],
        output: [String(quotient), String(remainder)],
        printed: true,
        note: L.stepRemainder(total, groups, remainder),
      },
    ],
  };
}

/** Config arrives as `unknown`; anything that is not a whole number is a no. */
function asInteger(value: unknown): number | null {
  const n =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) ? n : null;
}

export function StepExecution({
  program,
  locale,
}: {
  program: StepProgram;
  locale: Locale;
}) {
  const [index, setIndex] = useState(0);
  const last = program.steps.length - 1;
  /* Clamped rather than trusted: if React reuses this instance for a different
     block, the retained index can point past the shorter trace. */
  const at = Math.min(index, last);
  const step = program.steps[at];

  return (
    <div className="flex w-full flex-col gap-3">
      {/* The announcement, said once, in the order a sighted learner takes it
          in. The three visible pieces sit either side of the code panel and a
          live region cannot span them without swallowing the program too —
          which would re-read all four lines of Python on every press. */}
      <span role="status" aria-live="polite" className="sr-only">
        {t(L.stepCounter(at + 1, program.steps.length), locale)}.{" "}
        {t(L.stepLineRan, locale)} {step.line}. {t(step.note, locale)}
      </span>

      <div className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[14px] leading-5 text-b-fg/60">
          {t(L.stepCounter(at + 1, program.steps.length), locale)}
        </span>
        <span className="font-b-mono text-[14px] leading-5 text-b-fg/60">
          {t(L.stepLineRan, locale)} {step.line}
        </span>
      </div>

      <CodePanel code={program.code} highlightLine={step.line} />

      <p className="w-full text-[16px] leading-6 text-b-fg/80">{t(step.note, locale)}</p>

      <div className="grid w-full items-start gap-3 sm:grid-cols-2">
        <div className="w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] px-4 py-3">
          <p className="mb-3 text-[14px] leading-5 text-b-fg/60">
            {t(L.stepVariables, locale)}
          </p>
          {step.vars.length ? (
            <ul className="flex flex-wrap gap-2">
              {step.vars.map((v) => (
                <li
                  key={v.name}
                  className={cn(
                    "flex items-baseline gap-2 rounded-[8px] border-2 px-3 py-1.5",
                    "font-b-mono text-[15px] leading-6",
                    // The variable this line wrote is lifted, not recoloured:
                    // green already means "correct" everywhere else in the player.
                    v.name === step.wrote
                      ? "border-b-fg/30 bg-b-fg/[0.06]"
                      : "border-b-fg/10 bg-b-fg/[0.03]",
                  )}
                >
                  <span className="text-b-green-2">{v.name}</span>
                  <span className="text-b-fg/30">=</span>
                  <span className="text-b-fg">{v.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] leading-6 text-b-fg/40">
              {t(L.stepNoVariables, locale)}
            </p>
          )}
        </div>

        <div className="w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] pt-3">
          <p className="px-4 pb-2 text-[14px] leading-5 text-b-fg/60">
            {t(L.stepOutput, locale)}
          </p>
          <div className="m-2 mt-0 overflow-x-auto rounded-[8px] bg-[#12141a] text-[#e8ecf4] py-3">
            <pre className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
              <code>
                {step.output.length ? (
                  step.output.map((line, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex px-3 text-b-green-2",
                        step.printed && i === step.output.length - 1 && "bg-b-fg/10",
                      )}
                    >
                      {line}
                    </span>
                  ))
                ) : (
                  <span className="flex px-3 text-b-fg/30">
                    {t(L.stepNoOutput, locale)}
                  </span>
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2">
        <StepButton
          label={t(L.stepPrev, locale)}
          icon="prev"
          disabled={at === 0}
          onClick={() => setIndex(at - 1)}
        />
        <StepButton
          label={t(L.stepNext, locale)}
          icon="next"
          primary
          disabled={at === last}
          onClick={() => setIndex(at + 1)}
        />
        <StepButton
          label={t(L.stepReset, locale)}
          disabled={at === 0}
          onClick={() => setIndex(0)}
        />
        {at === last ? (
          <span className="ml-auto text-[14px] leading-5 text-b-fg/40">
            {t(L.stepFinished, locale)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A control.
 *
 * Blue on Next only. The scheduler palette means "act on this", and three blue
 * bars in a row would spend that signal on a learner who mostly needs to know
 * where forward is.
 */
function StepButton({
  label,
  icon,
  primary = false,
  disabled,
  onClick,
}: {
  label: string;
  icon?: "prev" | "next";
  primary?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-[12px] border-2 px-4",
        "text-[15px] leading-6 select-none [-webkit-tap-highlight-color:transparent]",
        "transition-colors duration-100",
        disabled && "cursor-default border-b-lock-edge bg-b-lock-fill text-b-fg/40",
        !disabled && "cursor-pointer text-b-fg",
        !disabled &&
          primary &&
          "border-b-sched-edge bg-b-sched-fill hover:border-b-sched-edge-hover hover:bg-b-sched-fill-hover",
        !disabled &&
          !primary &&
          "border-b-fg/15 bg-b-fg/[0.03] hover:border-b-fg/30 hover:bg-b-fg/[0.06]",
      )}
    >
      {icon === "prev" ? <Chevron dir="prev" /> : null}
      {label}
      {icon === "next" ? <Chevron dir="next" /> : null}
    </button>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
