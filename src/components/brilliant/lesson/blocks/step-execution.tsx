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
 * A beginner meeting `/` and `%` for the first time does not need breakpoints,
 * a call stack or an editor. Those are for people who already know what a step
 * IS. The three controls here are the entire interaction surface.
 *
 * ## What the move to C++17 changed here
 *
 * More than the syntax, which is why this file is not a find-and-replace of
 * `//` with `/`.
 *
 *   - **The program on screen is the whole program.** In Python the trace was
 *     four self-contained lines. In C++ those four lines do not compile, and a
 *     learner who has `#include <iostream>` and `int main()` in their own
 *     editor must not be shown a demonstration that has neither. The frame is
 *     rendered and the line numbers are the real ones; the frame simply has no
 *     step of its own, because `docs/cpp17/CPP17_PEDAGOGY.md` gives it rather
 *     than teaching it.
 *   - **Variables have a declared type**, and the panel says so. `n` is not
 *     "17", it is `int n = 17`, and the type is the reason the next two lines
 *     answer 3 and 2 instead of 3.4.
 *   - **The arithmetic is different arithmetic.** `Math.floor` was correct for
 *     Python's `//` and is WRONG for C++'s `/`: they agree on non-negative
 *     operands and disagree on every negative one (`-7 / 2` is `-3`, not `-4`).
 *     `truncate` below is C++'s rule, so the visualiser cannot teach Python's
 *     answer the first time somebody hands it a negative.
 *   - **`int` has an edge, and it is silent.** A config outside the 32-bit
 *     signed range would render a program declaring `int n` beside a value
 *     `int n` cannot hold. That is refused, not clamped and not printed.
 */

export interface StepVariable {
  name: string;
  value: string;
  /**
   * The C++ type it was declared with, rendered ahead of the name.
   *
   * Optional so an older caller that only knows `{ name, value }` still type
   * checks, but the September trace always sets it. In Python a variable was
   * just a name with a value in it; in C++ the declaration is the whole reason
   * `17 / 5` answers `3`, and a panel that shows `n = 17` without the `int`
   * has hidden the operative fact.
   */
  type?: string;
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
 * What a C++17 `int` can hold. Anything outside it is not an `int`.
 *
 * The programme's own audit rule: «if a task's stated bounds can exceed
 * 2^31−1, either it comes after l6 or its bounds shrink. Never a task that
 * overflows silently.» A visualiser is a task like any other, so a config it
 * cannot honestly draw is refused rather than drawn wrong.
 */
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

/**
 * The frame, exactly as the learner has it on screen.
 *
 * Line for line the shape every September program in the curriculum uses —
 * `#include`, `using namespace std;`, blank, `int main() {`, body, `return 0;`,
 * `}`. `BODY_FIRST_LINE` is where the body starts, so the trace's line numbers
 * are derived from the frame rather than counted by hand and then drifting from
 * it the first time the frame gains a line.
 */
const PROLOGUE = ["#include <iostream>", "using namespace std;", "", "int main() {"];
const EPILOGUE = ["    return 0;", "}"];
const BODY_FIRST_LINE = PROLOGUE.length + 1;

/**
 * The trace, derived from the block's `config`.
 *
 * `{ total: 17, groups: 5 }` walks the four body lines the lesson is about —
 * two declarations, then `/` and `%` — but nothing here is specific to 17 and
 * 5, so a later block can hand it a different pair and get a correct trace.
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

  /*
   * Three refusals, and they are refusals for three different reasons.
   *
   * `groups === 0` is the one that changed with the language. Python raised
   * `ZeroDivisionError`, which was at least a definite thing to draw. In C++
   * dividing by zero is UNDEFINED BEHAVIOUR — the program may print anything,
   * print nothing, or not finish — so there is no honest trace of it at all,
   * and the pedagogy is explicit that such tasks are re-authored to guard the
   * divisor rather than translated.
   *
   * `total < 0` stays refused, but not for a language reason: `L.stepQuotient`
   * narrates the answer as «столько достанется каждому», and negative candy is
   * not a story. The ARITHMETIC below is correct for negatives regardless, so
   * relaxing this later needs new wording and nothing else.
   *
   * Out of `int` range is refused because the program on screen says `int n`.
   */
  if (total === null || groups === null) return null;
  if (groups <= 0 || total < 0) return null;
  if (!isInt32(total) || !isInt32(groups)) return null;

  /* C++ truncates toward zero; Python floored. They agree here — `total` is
     non-negative — and `truncate` is used anyway, so the day the guard above
     is relaxed this does not quietly start teaching `-7 / 2 === -4`. */
  const quotient = truncate(total, groups);
  /* JavaScript's `%` already takes the sign of the dividend, which is C++'s
     rule too: `-7 % 2` is `-1` in both, and `1` only in Python. */
  const remainder = total % groups;

  const n: StepVariable = { name: "n", value: String(total), type: "int" };
  const k: StepVariable = { name: "k", value: String(groups), type: "int" };

  const body = [
    `    int n = ${total};`,
    `    int k = ${groups};`,
    "    cout << n / k << endl;",
    "    cout << n % k << endl;",
  ];

  return {
    /* Deliberately the same shape as the program the learner writes for
       themselves three blocks later at `m1.l3.b5`: the same frame, the same
       variable names, the same two operators in the same order. Stepping
       through one shape and then being asked for another would waste the
       demonstration, and in C++ the frame is part of the shape.

       Two differences, both on purpose. `n` and `k` are literals rather than
       read with `cin >>`, because this block's prompt names 17 and 5 and a
       trace cannot show a value arriving from stdin without a step for it that
       has no label. And the two answers go on separate lines rather than
       `m1.l3.b5`'s single space-separated line, because each press of Next has
       to add exactly one visible thing to the output panel. */
    code: [...PROLOGUE, ...body, ...EPILOGUE].join("\n"),
    steps: [
      {
        /* The frame gets no step of its own. `#include`, `using namespace` and
           `int main()` are GIVEN in September, not taught, and a first step
           reading "a preprocessor directive ran" would turn the first press of
           Next into the vocabulary lecture the pedagogy exists to avoid. The
           numbers are still the real line numbers, so the highlight lands on
           the line the learner would count to. */
        line: BODY_FIRST_LINE,
        vars: [n],
        output: [],
        wrote: "n",
        note: L.stepAssign("n", n.value),
      },
      {
        line: BODY_FIRST_LINE + 1,
        vars: [n, k],
        output: [],
        wrote: "k",
        note: L.stepAssign("k", k.value),
      },
      {
        line: BODY_FIRST_LINE + 2,
        vars: [n, k],
        output: [String(quotient)],
        printed: true,
        note: L.stepQuotient(total, groups, quotient),
      },
      {
        line: BODY_FIRST_LINE + 3,
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

/** Whether a whole number fits the `int` the rendered program declares. */
function isInt32(value: number): boolean {
  return value >= INT_MIN && value <= INT_MAX;
}

/**
 * `a / b` on two C++ `int`s.
 *
 * Truncation toward zero, not flooring. This is one of the eight places where
 * C++ and the Python this course used to teach produce DIFFERENT ANSWERS
 * rather than different syntax: `7 / 2` is `3` in both, and `-7 / 2` is `-3`
 * here against Python's `-4`. Verified on both engines — see
 * `docs/cpp17/CPP17_JUDGE_PARITY.md`.
 */
function truncate(a: number, b: number): number {
  return Math.trunc(a / b);
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
          which would re-read the whole program, frame included, on every
          press. That was four lines under Python and is ten under C++, so the
          reason this region excludes the code got stronger, not weaker. */}
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

      {/*
        Both panels grow as the trace proceeds — a variable appears, then a
        second one, then a line of output, then another — and anything that
        grows above the controls moves «Келесі қадам» out from under the finger
        that is pressing it. So every step is laid out in the SAME grid cell and
        all but the current one is hidden: the panel is as tall as its tallest
        step from the first press, and nothing below it ever moves.

        This got worse before it got fixed. `int n = 17` is wider than the
        `n = 17` the Python trace showed, wide enough that two chips wrap to a
        second row where two Python chips did not — so the declared type, which
        is the whole point of showing C++ variables, was buying a 46px jump
        between step one and step two.
      */}
      <div className="grid w-full items-start gap-3 sm:grid-cols-2">
        <div className="grid w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] px-4 py-3">
          {program.steps.map((s, i) => (
            <div
              key={i}
              /* Hidden from assistive technology too. The live region above
                 already announces the step; a screen reader walking four
                 stacked copies of the variable panel would hear the whole
                 trace at once. */
              aria-hidden={i !== at}
              className={cn("col-start-1 row-start-1", i !== at && "invisible")}
            >
              <p className="mb-3 text-[14px] leading-5 text-b-fg/60">
                {t(L.stepVariables, locale)}
              </p>
              {s.vars.length ? (
                <ul className="flex flex-wrap gap-2">
                  {s.vars.map((v) => (
                    <li
                      key={v.name}
                      className={cn(
                        "flex items-baseline gap-2 rounded-[8px] border-2 px-3 py-1.5",
                        "font-b-mono text-[15px] leading-6",
                        // The variable this line wrote is lifted, not recoloured:
                        // green already means "correct" everywhere else in the player.
                        v.name === s.wrote
                          ? "border-b-fg/30 bg-b-fg/[0.06]"
                          : "border-b-fg/10 bg-b-fg/[0.03]",
                      )}
                    >
                      {/* The declared type, ahead of the name, exactly as the
                          line above declared it. Dimmed rather than coloured:
                          it is context for the value, not a second thing to
                          read. */}
                      {v.type ? <span className="text-b-fg/40">{v.type}</span> : null}
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
          ))}
        </div>

        <div className="grid w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] pt-3">
          {program.steps.map((s, i) => (
            <div
              key={i}
              aria-hidden={i !== at}
              className={cn("col-start-1 row-start-1", i !== at && "invisible")}
            >
              <p className="px-4 pb-2 text-[14px] leading-5 text-b-fg/60">
                {t(L.stepOutput, locale)}
              </p>
              <div className="m-2 mt-0 overflow-x-auto rounded-[8px] bg-[#12141a] text-[#e8ecf4] py-3">
                <pre className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
                  <code>
                    {s.output.length ? (
                      s.output.map((line, j) => (
                        <span
                          key={j}
                          className={cn(
                            "flex px-3 text-b-green-2",
                            s.printed && j === s.output.length - 1 && "bg-b-fg/10",
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
          ))}
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
