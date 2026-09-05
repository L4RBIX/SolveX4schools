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
 * ## Blue means "you can act on this"
 *
 * In the original, that palette is on the MEETING BLOCKS — the things you tap.
 * It is an affordance, not a container style. An earlier pass here put it on
 * everything, read-only code panels included, and the result read as a debug
 * build: every box outlined, nothing signalling what to do next.
 *
 * So the rule is narrow. Blue on something the learner can act on right now.
 * Read-only material — code they are studying, worked examples, a table's own
 * frame — takes the card's quiet chrome instead, and the accent returns on
 * focus. Feedback colour (amber, green) always wins over both.
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
        /* `hyphens-auto` and the smaller step below 640 are both for Russian
           and Kazakh: "последовательность" is 18 characters and wider than a
           375px card at 32px, and the card clips rather than scrolls, so the
           word simply disappeared off the right edge. */
        <h1
          className="mb-[22.4px] text-[26px] leading-[34px] font-bold hyphens-auto sm:text-[32px] sm:leading-[42.88px]"
        >
          {title}
        </h1>
      ) : null}
      {children}
    </div>
  );
}

/**
 * `backticks` promoted to inline code, for any container.
 *
 * Extracted from `LessonParagraph`, which used to own it privately. That was
 * fine while paragraphs were the only prose that named a construct, and stopped
 * being fine when the worked-example steps started saying things like
 * `` `cout << "Сәлем!";` `` — those render through a `<span>`, not a `<p>`, so
 * they printed the backticks as characters. The parsing belongs to the text,
 * not to the element it happens to sit in.
 */
export function inlineCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        className="rounded-[4px] bg-b-fg/10 px-1.5 py-0.5 font-b-mono text-[15px] text-b-green-2"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * One numbered step of a worked example.
 *
 * A component rather than JSX inlined at the call site so that the thing it
 * must not stop doing — running its text through `inlineCode` — is reachable
 * from a test. It was inlined, it silently rendered raw text, and nothing
 * failed.
 */
export function WorkedExampleStep({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3 rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] px-4 py-3">
      <span className="mt-[2px] flex size-6 shrink-0 items-center justify-center rounded-full bg-b-fg/10 text-[13px] font-medium tabular-nums text-b-fg/70">
        {n}
      </span>
      <span className="text-[16px] leading-6 text-b-fg/85">{inlineCode(text)}</span>
    </li>
  );
}

/** A lesson paragraph, with `backticks` promoted to inline code. */
export function LessonParagraph({ text }: { text: string }) {
  return (
    <p className="mb-[22.4px] text-[16px] leading-[25.6px] last:mb-0">
      {inlineCode(text)}
    </p>
  );
}

/**
 * The prompt line above an interaction. 16/24, matching the scheduler slide's
 * "Tap meeting blocks to construct a valid schedule."
 *
 * ## Why `whitespace-pre-wrap`
 *
 * September's prompts were all one line, so a bare `<p>` was indistinguishable
 * from a correct one. Months 2–4 have twenty-eight prompts that carry newlines —
 * a stated input format on its own line, numbered sub-questions, and in
 * `m2.l7` an ASCII picture under «дәл былай шығуы керек» ("it must come out
 * exactly like this"). Under the CSS initial value `white-space: normal` every
 * one of those newlines and every run of spaces collapses to a single space, so
 * the learner met a task whose prompt promised an exact layout above a
 * paragraph-shaped blob, and `m2.l7.b8s` — a `reorder_code` on the support
 * route, which renders no case table — had no other copy of the shape at all.
 *
 * `pre-wrap` and not `pre-line`: `pre-line` preserves newlines but still
 * collapses runs of spaces and strips leading whitespace, which is exactly the
 * indentation an ASCII triangle is made of. `pre-wrap` keeps both and still
 * wraps long lines, so a prose prompt is unaffected.
 *
 * This does not make prompts a good place for byte-exact pictures: the text
 * here is the proportional body face, so an ASCII shape is visible but ragged.
 * Where the layout IS the answer, the authoritative copy is the case table under
 * the editor, which already renders in `font-b-mono whitespace-pre`. The prompt
 * says what the shape is; the table shows it.
 */
export function BlockPrompt({ children }: { children: ReactNode }) {
  return <p className="w-full whitespace-pre-wrap text-[16px] leading-6">{children}</p>;
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
        // Read-only. Quiet at rest; feedback colour only once there is feedback.
        verdict === "unchecked" || verdict === "unmeasured"
          ? "border-b-fg/10 bg-b-fg/[0.03]"
          : verdict === "correct"
            ? "border-b-ok/60 bg-b-ok-panel"
            : "border-b-warn/40 bg-b-lock-panel",
        className,
      )}
    >
      {/* A code surface is deliberately NOT themed. It stays dark in both
          arms, because a dark block is what makes code read as code rather
          than as a quoted paragraph — so the pair is written as literals to
          say so, rather than as tokens that look like they should move.
          Inheriting `text-b-fg` here put dark ink on a near-black panel. */}
      <div className="m-2 overflow-x-auto rounded-[8px] bg-[#12141a] text-[#e8ecf4] py-3">
        <pre className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
          <code>
            {lines.map((line, i) => {
              const n = i + 1;
              return (
                <span
                  key={n}
                  className={cn(
                    "flex px-3",
                    highlightLine === n && "bg-b-fg/10",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mr-4 w-6 shrink-0 text-right tabular-nums opacity-40 select-none"
                  >
                    {n}
                  </span>
                  <span className="whitespace-pre">{line || " "}</span>
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

  /*
   * The ARIA radiogroup pattern, which this claimed and did not implement.
   *
   * `role="radiogroup"` with `role="radio"` children is a contract: the GROUP
   * is one tab stop, and the arrow keys move between the options inside it.
   * Every option was a separate tab stop with no arrow handling, so a keyboard
   * learner tabbed through four buttons that announced themselves as radios and
   * behaved as buttons — and a screen reader user was told the group had four
   * stops when the pattern says one.
   *
   * `roving` is the option that holds the tab stop: the selected one, or the
   * first when nothing is selected yet. That is the pattern's own rule, and it
   * is what makes Tab land on the current answer rather than at the top.
   */
  const roving = selected ?? options[0]?.id ?? null;

  const move = (from: string, delta: number) => {
    if (locked) return;
    const i = options.findIndex((o) => o.id === from);
    if (i < 0) return;
    /* Wrapping, per the pattern. A radiogroup is a ring. */
    const next = options[(i + delta + options.length) % options.length];
    if (!next) return;
    /* Arrow keys MOVE THE SELECTION in a radiogroup, not just the focus — that
       is what distinguishes it from a toolbar or a tablist. */
    onSelect(next.id);
    /* And focus follows, or the learner's next arrow press starts over from
       wherever the browser left them. */
    document.getElementById(`option-${next.id}`)?.focus();
  };

  return (
    <div className={cn("flex w-full flex-col gap-2", className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isCorrect = option.id === correctId;
        const reveal = revealing && (isSelected || isCorrect);

        return (
          <button
            key={option.id}
            id={`option-${option.id}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            /* One tab stop for the group. `disabled` already removes a locked
               group from the tab order entirely, which is right: a settled
               question has no answer left to give. */
            tabIndex={option.id === roving ? 0 : -1}
            disabled={locked}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                move(option.id, 1);
              } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                move(option.id, -1);
              }
              /* Space and Enter are left to the button, which already fires
                 `onClick` for both. Handling them here would double-fire. */
            }}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-[12px] border-2 px-4 py-3",
              "text-left text-[16px] leading-6 select-none",
              "transition-colors duration-100 [-webkit-tap-highlight-color:transparent]",
              /* A visible focus ring. Without it the roving tabindex above is
                 invisible: the learner's keyboard moves a selection they cannot
                 see, which is worse than not being able to move it at all.
                 `focus-visible` so a pointer user never sees it. */
              "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-fg",
              !locked && "cursor-pointer",
              locked && "cursor-default",
              /* Resting is quiet; blue arrives on selection.
                 The scheduler interactive fills every tile blue at rest because
                 its tiles are draggable objects the learner has to spot in a
                 grid. An answer list is not that: four saturated blue bars
                 stacked down the middle read as a debug build, and they spend
                 the one colour that should mean "this is the choice you made".
                 Hover still lifts, so the row is visibly clickable. */
              !locked &&
                !isSelected &&
                "border-b-fg/15 bg-b-fg/[0.03] hover:border-b-fg/30 hover:bg-b-fg/[0.06]",
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
            {/* The revealed answer gets a TICK, not a filled radio.
                A filled radio means "you chose this". Painting one on the
                option the learner did not choose tells them they picked
                correctly a moment after being told they did not. */}
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                isSelected || (reveal && isCorrect) ? "border-b-fg" : "border-b-fg/40",
              )}
            >
              {reveal && isCorrect && !isSelected ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="m2.5 6.2 2.3 2.3L9.5 3.8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isSelected ? (
                <span className="size-2 rounded-full bg-b-fg" />
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
      <span className="text-[14px] leading-5 text-b-fg/60">{label}</span>
      <input
        value={value}
        disabled={locked}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-14 w-full rounded-[12px] border-2 bg-[#12141a] text-[#e8ecf4] px-4 text-[16px]",
          "placeholder:text-b-on-fill/35 focus:outline-none disabled:opacity-70",
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
        "w-full resize-y rounded-[12px] border-2 bg-[#12141a] text-[#e8ecf4] p-4 text-[16px] leading-[26px]",
        "placeholder:text-b-on-fill/35 focus:outline-none disabled:opacity-70",
        mono && "font-b-mono",
        "transition-colors duration-100",
        !locked && "border-b-fg/15 focus:border-b-sched-edge-on",
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
      <span className="text-b-fg/60">{label}</span>
      {value ? <span className="font-b-mono text-b-fg">{value}</span> : null}
    </div>
  );
}
