"use client";

import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import type { PublicBlock } from "@schools/curriculum/public";
import type { BlockAnswer } from "@schools/learning/checking";
import { L, t } from "@schools/presentation/labels";
import type { LearningPayload } from "@solvex/learning-contracts";
import type { LessonVerdict } from "../lesson-verdict";
import {
  AnswerArea,
  AnswerField,
  BlockPrompt,
  CodePanel,
  LessonParagraph,
  LessonProse,
  WorkedExampleStep,
  OptionList,
  RevealNote,
} from "./primitives";
import { RunPanel } from "./run-panel";
import { StepExecution, buildStepProgram } from "./step-execution";

/**
 * Block views.
 *
 * Each renders one curriculum block using the primitives above, and each is
 * PRESENTATION PLUS ANSWER CAPTURE ONLY. None of them decides whether an answer
 * is right — that lives in `schools/learning/checking.ts`, pure and testable —
 * and none of them owns a submit button. "Check" is the lesson footer's, exactly
 * as in the original player, so the CTA never moves between blocks.
 *
 * The dispatch at the bottom is exhaustive over `BlockType` with a `never`
 * guard. That guard is load-bearing: without it, adding a block type ships a
 * blank card in front of a class instead of failing the build.
 */

/**
 * What the server has decided the learner may now see.
 *
 * Answer keys no longer ship to the browser (`schools/curriculum/public.ts`),
 * so a view cannot paint the correct option green on its own initiative — which
 * is the point. Every reveal below arrives in the submit response and only once
 * `schools/learning/reveal.ts` judges it earned. Absent is the normal case.
 */
export interface BlockReveal {
  /** Correct option id, for prediction and multiple choice. */
  correctId?: string;
  /** Correct answer as text, for the reveal note. */
  text?: string;
  /** The repaired program. */
  code?: string;
  /** 1-indexed defective line, for find_bug. */
  line?: number;
  /** Trace cells, keyed `row:name`. */
  cells?: Record<string, string>;
  /** Marking points, for explain and the written half of a check. */
  points?: { kk: string; ru: string }[];
}

/**
 * The block's own condition, beyond its verdict.
 *
 * The verdict channel answers "what was measured". This answers "why was
 * nothing measured, or why was nothing kept" — three facts that used to share
 * one sentence:
 *
 * - `not_machine_graded` — permanent and correct. An explanation in the
 *   learner's own words, a self-authored test the author never enumerated. A
 *   teacher reads it. Nothing is wrong.
 * - `judge_unavailable` — temporary. The code checker did not answer. The
 *   learner is NOT marked wrong, and the card says so in those words rather
 *   than implying the product is unfinished.
 * - `no_trusted_judge` — permanent, and NOT an outage. This deployment runs
 *   `EXEC_PROVIDER=none`: the learner's browser really did execute their
 *   Python, and grading is a teacher's job here. Kept apart from
 *   `judge_unavailable` because that string promises "try again later", which
 *   would be a lie repeated daily for a month.
 * - `not_saved` — the round trip failed. Nothing was graded and nothing was
 *   recorded, so the block does not settle at all: Check comes back.
 */
export type BlockNote =
  | "not_machine_graded"
  | "judge_unavailable"
  | "no_trusted_judge"
  | "not_saved";

export interface BlockViewProps<T extends PublicBlock = PublicBlock> {
  block: T;
  locale: Locale;
  verdict: LessonVerdict;
  answer: BlockAnswer;
  onAnswer: (a: BlockAnswer) => void;
  /** Scene image for the block, when the lesson supplies one. */
  art?: string;
  /** Server-granted reveal. Never derived on the client. */
  reveal?: BlockReveal;
  /** Why nothing was measured or nothing was kept. Never derived on the client. */
  note?: BlockNote;
  /**
   * What each VISIBLE case did when the judge ran this learner's program.
   *
   * A wrong code verdict used to be «Әзірге дұрыс емес» and nothing else — no
   * input, no expected output, and not even the learner's own output — on a
   * screen whose editor had just been greyed out. A fourteen-year-old who
   * printed `55` for `7 * 8` had nothing to compare and nothing to do.
   *
   * From the server, never derived here, and visible cases only: a hidden
   * case's pairing of input to output IS the measurement, and it stays a count.
   */
  caseResults?: { input: string; expected: string; actual: string; passed: boolean }[];
  /**
   * This block settled in an earlier session and was read back from the server.
   *
   * The verdict, the reveal and the justification all survive a refresh. The
   * ANSWER does not, and cannot: `learning_events.payload` is allowlisted and
   * `learning_submissions.response` is documented to hold no learner text, both
   * on purpose. So a restored block renders with an empty input — and without
   * this flag, a `write_code` block the learner solved last week would come
   * back as a green border around a blank editor, which reads as "correct, and
   * you wrote nothing".
   *
   * `RestoredNote` is what makes that honest, and it is rendered by the
   * dispatcher for every block type for the same reason `SaveFailureNote` is:
   * the fact has nothing to do with which kind of block it was.
   */
  restored?: boolean;
  /**
   * Help was delivered on this block, according to the ledger.
   *
   * Shown on a restored block so a refresh cannot quietly relabel an assisted
   * solve as an unaided one on the learner's own screen. Never client-computed —
   * a browser that could name this could name `false`.
   */
  assisted?: boolean;

  /* ---- Run ------------------------------------------------------------
   *
   * The four below exist so a coding block can offer local Python. They are on
   * `BlockViewProps` rather than inside `CodeTaskView` because
   * `surfaceForBlock()` needs facts a block does not carry — which lesson it is
   * being rendered inside, and which month — and a component that guessed them
   * from the block id would be deciding its own trust level. */

  /** The lesson or assessment this block is being rendered inside. */
  lessonId: string;
  monthIndex: number;
  /**
   * True when this block is the page on screen.
   *
   * Every page is mounted at once and none are ever unmounted, so this is what
   * keeps a 13 MB CPython download from starting on a concept card.
   */
  active?: boolean;
  /**
   * Does this deployment have a judge? See `SchoolLessonProps`.
   *
   * Optional and defaulting to `true` at the point of use: an absent answer must
   * make the panel claim LESS, not more, and «мұғалім бағалайды» said in a class
   * whose judge works is a false sentence repeated daily.
   */
  trustedProviderConfigured?: boolean;
  /** A Run happened. Never what it printed — see `runEventPayload`. */
  onRun?: (payload: LearningPayload) => void;
  /** The run's streams, for Nova. Never stored — see `RunPanelProps.onRunResult`. */
  onRunResult?: (result: { status: string; stdout: string; stderr: string; truncated: boolean }) => void;
}

const locked = (v: LessonVerdict) => v !== "unchecked";

/**
 * "The code checker did not answer."
 *
 * Rendered only by the two views that submit code, because it is the only place
 * it can be true. Everywhere else `unmeasured` means what it has always meant —
 * a human will read this.
 */
function NoteLine({ note, locale }: { note?: BlockNote; locale: Locale }) {
  if (note === "judge_unavailable") return <RevealNote label={t(L.executionUnavailable, locale)} />;
  /* A different sentence, not a variant of the same one. See `BlockNote`. */
  if (note === "no_trusted_judge") return <RevealNote label={t(L.noTrustedJudge, locale)} />;
  return null;
}

/**
 * "This did not reach the server."
 *
 * Rendered by the dispatcher for EVERY block type rather than per view, because
 * a lost round trip has nothing to do with what kind of block it was — a
 * multiple choice loses its answer exactly as a coding task does. Putting it in
 * one place is also what stops eleven views from each having their own opinion
 * about how to say it, or from silently not saying it at all: the previous
 * behaviour was that a failed submit painted the same neutral card as an
 * ungraded explanation, on every block type, with no note whatsoever.
 */
function SaveFailureNote({ note, locale }: { note?: BlockNote; locale: Locale }) {
  if (note !== "not_saved") return null;
  return <RevealNote label={t(L.notSaved, locale)} tone="warn" />;
}

/**
 * "You did this before, and here is what is and is not being shown."
 *
 * ## Why a settled card is not enough on its own
 *
 * Everything about a graded block survives a refresh now — the verdict, the
 * reveal the learner earned, the author's explanation of their particular wrong
 * answer — except the one thing they will look for first: what they typed. It
 * is not stored, deliberately and in three places, and this phase does not
 * overturn that.
 *
 * So the restored card has an empty input under a verdict-coloured border. For
 * a multiple choice that is merely odd. For `write_code` it is a green frame
 * around a blank editor, and a fourteen-year-old reads that as the product
 * having lost their program — which is the same conclusion the blank-lesson bug
 * produced, reached by a different route. Two sentences remove it.
 *
 * ## Neutral, not warn
 *
 * The tone is deliberately the quiet one. Nothing has gone wrong: the work was
 * graded, it was kept, and it is being reported. `warn` is reserved for
 * `not_saved`, where something genuinely did fail and the learner has to act.
 *
 * ## The assistance line
 *
 * Shown when the ledger says help was delivered on this block, and it is not
 * decoration. A refresh used to launder assistance away entirely — hints in one
 * episode, a reload, a solve in another, and every "was this unaided" query
 * reads the second episode and answers yes. Continuing the episode is what
 * fixes the measurement; saying so on the card is what stops the learner's own
 * screen from disagreeing with the teacher's.
 */
function RestoredNote({
  restored,
  assisted,
  verdict,
  locale,
}: {
  restored?: boolean;
  assisted?: boolean;
  verdict: LessonVerdict;
  locale: Locale;
}) {
  /* `unchecked` is the guard that matters: a block whose restored state has
     been cleared by a fresh Check must not still be claiming to be restored,
     and neither must one that was never settled at all. */
  if (!restored || verdict === "unchecked") return null;
  return (
    <>
      <RevealNote
        label={`${t(L.restoredEarlier, locale)} ${t(L.restoredAnswerNotShown, locale)}`}
      />
      {assisted ? <RevealNote label={t(L.restoredAssisted, locale)} /> : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Concept                                                                    */
/* -------------------------------------------------------------------------- */

function ConceptView({ block, locale, art }: BlockViewProps) {
  if (block.type !== "concept") return null;
  return (
    <>
      {art ? (
        <div className="relative mb-6 flex flex-col gap-6">
          <Image
            src={art}
            alt=""
            width={540}
            height={270}
            priority
            className="h-[270px] w-[540px] max-w-full object-contain"
          />
        </div>
      ) : null}
      <LessonProse title={t(block.title, locale)}>
        {t(block.body, locale)
          .split("\n")
          .filter(Boolean)
          .map((para, i) => (
            <LessonParagraph key={i} text={para} />
          ))}
      </LessonProse>
      {block.code ? <CodePanel code={block.code} /> : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Prediction / multiple choice                                               */
/* -------------------------------------------------------------------------- */

function PredictionView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "prediction") return null;
  const hasOptions = Boolean(block.options?.length);

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <CodePanel code={block.code} verdict={verdict} />

      {hasOptions ? (
        <OptionList
          options={block.options!.map((o) => ({ id: o, label: o, mono: true }))}
          selected={answer.kind === "option" ? answer.id : null}
          correctId={reveal?.correctId}
          verdict={verdict}
          onSelect={(id) => onAnswer({ kind: "option", id })}
        />
      ) : (
        <AnswerField
          label={t(L.yourAnswer, locale)}
          placeholder={t(L.writeAnswer, locale)}
          value={answer.kind === "text" ? answer.value : ""}
          onChange={(v) => onAnswer({ kind: "text", value: v })}
          verdict={verdict}
        />
      )}

      {!hasOptions && reveal?.text ? (
        <RevealNote label={t(L.correctAnswerIs, locale)} value={reveal.text} tone="warn" />
      ) : null}
    </>
  );
}

function MultipleChoiceView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "multiple_choice") return null;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      {block.code ? <CodePanel code={block.code} verdict={verdict} /> : null}
      <OptionList
        options={block.options.map((o) => ({ id: o.id, label: t(o.label, locale) }))}
        selected={answer.kind === "option" ? answer.id : null}
        correctId={reveal?.correctId}
        verdict={verdict}
        onSelect={(id) => onAnswer({ kind: "option", id })}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Find the bug                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The code panel itself becomes the interaction: each line is a target.
 *
 * Modelled on the scheduler, where the puzzle and the answer surface are the
 * same object rather than a diagram beside a list of choices.
 */
function FindBugView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "find_bug") return null;
  const lines = block.code.replace(/\n$/, "").split("\n");
  const picked = answer.kind === "line" ? answer.line : 0;
  const isLocked = locked(verdict);
  /* The defective line is no longer in the payload. It is highlighted only when
     the server sends it back, which it does not do on a first wrong answer. */
  const bugLine = reveal?.line;
  const revealing = bugLine !== undefined;

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      <div
        className={cn(
          "w-full overflow-hidden rounded-[12px] border-2 transition-colors duration-200",
          // Container, not target. The lines below carry the affordance.
          !isLocked && "border-b-fg/10 bg-b-fg/[0.03]",
          verdict === "correct" && "border-b-ok/60 bg-b-ok-panel",
          (verdict === "wrong" || verdict === "partial") &&
            "border-b-lock-panel-edge bg-b-lock-panel",
          verdict === "unmeasured" && "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <div className="m-2 overflow-x-auto rounded-[8px] bg-[#12141a] text-[#e8ecf4] py-2">
          <div className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
            {lines.map((line, i) => {
              const n = i + 1;
              const isBug = revealing && n === bugLine;
              const wrongPick = revealing && picked === n && n !== bugLine;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={isLocked}
                  aria-pressed={picked === n}
                  aria-label={`${t(L.line, locale)} ${n}`}
                  onClick={() => onAnswer({ kind: "line", line: n })}
                  className={cn(
                    "flex w-full min-w-full items-center px-3 py-1 text-left",
                    "transition-colors duration-100",
                    !isLocked && "cursor-pointer",
                    isLocked && "cursor-default",
                    !isLocked && picked === n && "bg-b-sched-fill-on",
                    !isLocked && picked !== n && "hover:bg-b-fg/5",
                    isBug && "bg-b-ok-fill",
                    wrongPick && "bg-b-warn-fill",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mr-4 w-6 shrink-0 text-right tabular-nums opacity-40 select-none"
                  >
                    {n}
                  </span>
                  <span className="whitespace-pre text-b-fg">{line || " "}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isLocked ? (
        <p className="w-full text-[14px] leading-5 text-b-fg/40">
          {t(L.whichLine, locale)}
        </p>
      ) : null}

      {reveal?.code ? (
        <div className="flex w-full flex-col gap-2">
          <p className="text-[14px] leading-5 text-b-fg/60">{t(L.fixedVersion, locale)}</p>
          <CodePanel code={reveal.code} verdict="correct" />
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Fill in the blank                                                          */
/* -------------------------------------------------------------------------- */

function FillBlankView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "fill_blank") return null;
  const values = answer.kind === "blanks" ? answer.values : block.blanks.map(() => "");
  const segments = block.template.split("___");
  const isLocked = locked(verdict);

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      <div
        className={cn(
          "w-full overflow-hidden rounded-[12px] border-2 transition-colors duration-200",
          !isLocked ? "border-b-fg/10 bg-b-fg/[0.03]" : "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <div className="m-2 overflow-x-auto rounded-[8px] bg-[#12141a] text-[#e8ecf4] p-3">
          <div className="flex w-max min-w-full flex-wrap items-center gap-y-2 font-b-mono text-[15px] leading-[30px] whitespace-pre text-b-fg">
            {segments.map((segment, i) => (
              <span key={i} className="contents">
                <span>{segment}</span>
                {i < block.blanks.length ? (
                  <input
                    value={values[i] ?? ""}
                    disabled={isLocked}
                    aria-label={`${t(L.writeAnswer, locale)} ${i + 1}`}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = e.target.value;
                      onAnswer({ kind: "blanks", values: next });
                    }}
                    /* Width tracks content so the code line does not jump as the
                       learner types; a fixed input would reflow the whole block. */
                    style={{ width: `${Math.max(4, (values[i] ?? "").length + 1)}ch` }}
                    className={cn(
                      "mx-1 rounded-[4px] border-b-2 bg-b-fg/10 px-1 text-center font-b-mono",
                      "text-b-green-2 focus:outline-none",
                      "transition-colors duration-100",
                      !isLocked && "border-b-sched-edge-on",
                      /* Per-blank correctness needs the key, which the browser
                         no longer has. The card border already carries the
                         verdict; colouring each blank added nothing a learner
                         could act on. */
                      isLocked && "border-b-lock-edge",
                    )}
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      {reveal?.text ? (
        <RevealNote label={t(L.correctAnswerIs, locale)} value={reveal.text} tone="warn" />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Reorder                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Move-up / move-down rather than drag. Not a convenience call: drag has no
 * keyboard equivalent without building one, and on the touch laptops these
 * classrooms use a drag inside a scrolling card fights the scroll gesture.
 */
function ReorderView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  /* The lookup is built before the type guard, not after: a hook that runs
     conditionally changes the hook order between renders, which React treats as
     a hard error. Cheap enough to build unconditionally. */
  const byId = useMemo(
    () =>
      new Map(
        block.type === "reorder_code" ? block.lines.map((l) => [l.id, l] as const) : [],
      ),
    [block],
  );

  if (block.type !== "reorder_code") return null;
  /* `block.lines` already arrives shuffled — deterministically, seeded from the
     block id, in `schools/curriculum/public.ts`. It used to be reversed here
     instead, which meant "move the bottom line to the top, repeat" solved the
     month's only assembly task without reading the code. */
  const order =
    answer.kind === "order" && answer.ids.length
      ? answer.ids
      : block.lines.map((l) => l.id);

  const isLocked = locked(verdict);
  const move = (i: number, d: number) => {
    const target = i + d;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[i], next[target]] = [next[target], next[i]];
    onAnswer({ kind: "order", ids: next });
  };

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <ol className="flex w-full flex-col gap-2">
        {order.map((id, i) => {
          const line = byId.get(id);
          /* Per-row correctness needs the answer, which the browser no longer
             holds. The card border carries the verdict for the whole block. */
          void i;
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border-2 px-3 py-2",
                "transition-colors duration-100",
                !isLocked && "border-b-sched-edge bg-b-sched-fill",
                isLocked && "border-b-lock-edge bg-b-lock-fill",
              )}
            >
              <span className="min-w-0 flex-1 overflow-x-auto font-b-mono text-[15px] leading-[26px] whitespace-pre text-b-fg">
                {line?.code}
              </span>
              {!isLocked ? (
                <span className="flex shrink-0 gap-1">
                  <ArrowButton dir="up" disabled={i === 0} onClick={() => move(i, -1)} />
                  <ArrowButton
                    dir="down"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "up" ? "move up" : "move down"}
      className={cn(
        "grid size-11 place-items-center rounded-[8px] text-b-fg/60",
        "transition-colors duration-100",
        disabled ? "cursor-default opacity-20" : "cursor-pointer hover:bg-b-fg/10 hover:text-b-fg",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === "up" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
      </svg>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Trace                                                                      */
/* -------------------------------------------------------------------------- */

function TraceView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "trace_code") return null;
  const cells = answer.kind === "grid" ? answer.cells : {};
  /* The public payload carries variable NAMES only. The values are the answer
     and arrive, if at all, from the server. */
  const names = Array.from(new Set(block.steps.flatMap((s) => s.vars)));
  const isLocked = locked(verdict);
  const key = (row: number, name: string) => `${row}:${name}`;

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <CodePanel code={block.code} verdict={verdict} />

      <div
        className={cn(
          "w-full overflow-x-auto rounded-[12px] border-2 transition-colors duration-200",
          !isLocked ? "border-b-fg/10 bg-b-fg/[0.03]" : "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <table className="w-full min-w-max border-collapse text-[15px]">
          <thead>
            <tr className="border-b-2 border-black/40">
              <th className="px-3 py-2 text-left font-medium text-b-fg/60">
                {t(L.line, locale)}
              </th>
              {names.map((name) => (
                <th key={name} className="px-3 py-2 text-left font-b-mono text-b-green-2">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.steps.map((step, row) => (
              <tr key={row} className="border-b border-black/25 last:border-0">
                <td className="px-3 py-1.5 tabular-nums text-b-fg/50">{step.line}</td>
                {names.map((name) => {
                  if (!step.vars.includes(name)) {
                    return <td key={name} className="px-3 py-1.5 text-b-fg/25">—</td>;
                  }
                  const expected = reveal?.cells?.[key(row, name)];
                  const value = cells[key(row, name)] ?? "";
                  const right = expected !== undefined && value.trim() === expected;
                  return (
                    <td key={name} className="px-2 py-1.5">
                      <input
                        value={value}
                        disabled={isLocked}
                        aria-label={`${name}, ${t(L.line, locale)} ${step.line}`}
                        onChange={(e) =>
                          onAnswer({
                            kind: "grid",
                            cells: { ...cells, [key(row, name)]: e.target.value },
                          })
                        }
                        className={cn(
                          "h-10 w-[72px] rounded-[8px] border-2 bg-[#12141a] text-[#e8ecf4] px-2 text-center font-b-mono",
                          "focus:outline-none transition-colors duration-100",
                          !isLocked && "border-b-fg/15 focus:border-b-sched-edge-on",
                          right && "border-b-ok-edge",
                          isLocked && expected !== undefined && !right && "border-b-warn-edge",
                          isLocked && expected === undefined && "border-b-lock-edge",
                        )}
                      />
                      {expected !== undefined && !right ? (
                        <span className="ml-2 font-b-mono text-b-ok-edge">{expected}</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Test case / explain / reflection / verify                                  */
/* -------------------------------------------------------------------------- */

function TestCaseView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "test_case") return null;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <CodePanel code={block.code} verdict={verdict} />
      <AnswerField
        label={t(L.yourTest, locale)}
        value={answer.kind === "text" ? answer.value : ""}
        onChange={(v) => onAnswer({ kind: "text", value: v })}
        verdict={verdict}
      />
      {/* Settling as `unmeasured` is the point: the learner may have found a
          real breaking case the author never listed. What it must NOT do is
          print the author's own breaking input under a label that says the
          learner's answer was saved — which is what it used to do, for anyone
          who typed a single character. */}
      {verdict === "unmeasured" ? <RevealNote label={t(L.savedForTeacher, locale)} /> : null}
      {reveal?.text ? (
        <RevealNote label={t(L.correctAnswerIs, locale)} value={reveal.text} tone="warn" />
      ) : null}
    </>
  );
}

function ExplainView({ block, locale, verdict, answer, onAnswer, reveal }: BlockViewProps) {
  if (block.type !== "explain") return null;
  /* The marking rubric used to appear the instant the learner pressed Check —
     it was in the payload, so it could. It now arrives only with a server
     reveal, after the answer has actually been committed. */
  const points = reveal?.points;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <AnswerArea
        value={answer.kind === "text" ? answer.value : ""}
        onChange={(v) => onAnswer({ kind: "text", value: v })}
        placeholder={t(L.explainInOwnWords, locale)}
        verdict={verdict}
        rows={6}
      />
      {locked(verdict) ? <RevealNote label={t(L.savedForTeacher, locale)} /> : null}

      {points ? (
        <div className="w-full rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3">
          <p className="mb-2 text-[14px] leading-5 text-b-fg/60">
            {t(L.teacherLooksFor, locale)}
          </p>
          <ul className="flex flex-col gap-1.5">
            {points.map((point, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-6 text-b-fg/80">
                <span aria-hidden="true" className="mt-[10px] size-1 shrink-0 rounded-full bg-b-fg/40" />
                {t(point, locale)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] leading-5 text-b-fg/40">
            {t(L.notAutoGraded, locale)}
          </p>
        </div>
      ) : null}
    </>
  );
}

function ReflectionView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "reflection") return null;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <AnswerArea
        value={answer.kind === "text" ? answer.value : ""}
        onChange={(v) => onAnswer({ kind: "text", value: v })}
        verdict={verdict}
        rows={4}
      />
    </>
  );
}

/**
 * Which check modes have a program to run.
 *
 * `oral_explanation` is spoken and `manual_trace` is the learner doing by hand
 * what the interpreter would do — offering to run it is offering the answer to
 * the question being asked. The other three end in Python, so they get a Run
 * button; the block still renders one mono answer box for all four non-oral
 * modes, which is why this list exists rather than a check on `oral`.
 */
const RUNNABLE_VERIFY_MODES: ReadonlySet<string> = new Set([
  "unseen_problem",
  "find_bug",
  "delayed_resolve",
]);

const VERIFY_LABEL = {
  unseen_problem: L.verifyUnseen,
  manual_trace: L.verifyTrace,
  find_bug: L.verifyFindBug,
  oral_explanation: L.verifyOral,
  delayed_resolve: L.verifyDelayed,
} as const;

/**
 * A monthly-check block.
 *
 * Two defects are closed here. `m1.as.b3` asked the learner to repair a program
 * that was never drawn — `VerifyBlock` had no `code` field at all, so the card
 * was a prompt about "this program" above an empty box. And the
 * `oral_explanation` branch rendered a static note with no input, so the answer
 * stayed `{kind:"none"}`, `canCheck` returned false forever, and the Check
 * button on the LAST block of the assessment was permanently disabled: the
 * check could not be finished.
 *
 * The oral mode now takes a short written note. That is not a downgrade of the
 * spoken task — the card still says the explanation is given to the teacher —
 * it is what lets the learner record that they are ready and move on, and it
 * gives the teacher something to read beside the tick.
 */
function VerifyView({
  block,
  locale,
  verdict,
  answer,
  onAnswer,
  reveal,
  note,
  lessonId,
  monthIndex,
  active,
  caseResults,
  trustedProviderConfigured = true,
  onRun,
  onRunResult,
}: BlockViewProps) {
  if (block.type !== "verify") return null;
  const oral = block.mode === "oral_explanation";
  const source = answer.kind === "text" ? answer.value : (block.starter ?? "");

  return (
    <>
      <span className="w-fit self-start rounded-full border border-b-fg/15 bg-b-fg/[0.04] px-3 py-1 text-[13px] leading-5 font-medium tracking-wide text-b-fg/80 uppercase">
        {t(VERIFY_LABEL[block.mode], locale)}
      </span>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      {/* The program under repair or inspection. Absent for a plain unseen
          problem, which is why it is conditional rather than required. */}
      {block.code ? <CodePanel code={block.code} verdict={verdict} /> : null}

      {oral ? (
        <>
          <div className="w-full rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3 text-[16px] leading-6 text-b-fg/80">
            {t(L.oralTask, locale)}
          </div>
          <AnswerArea
            value={answer.kind === "text" ? answer.value : ""}
            onChange={(v) => onAnswer({ kind: "text", value: v })}
            placeholder={t(L.explainInOwnWords, locale)}
            verdict={verdict}
            rows={4}
          />
        </>
      ) : (
        <>
          <AnswerArea
            value={source}
            onChange={(v) => onAnswer({ kind: "text", value: v })}
            verdict={verdict}
            rows={Math.max(6, source.split("\n").length + 2)}
            mono
          />

          {/* The coding half of the monthly check, and only that half. A hand
              trace has no program to run, and `surfaceForBlock()` sends every
              `verify` block to `assessment` — where a local pass settles
              nothing, so the panel says so beside its own output. That is the
              screen where the sentence matters most. */}
          {RUNNABLE_VERIFY_MODES.has(block.mode) ? (
            <RunPanel
              blockId={block.id}
              blockType={block.type}
              lessonId={lessonId}
              monthIndex={monthIndex}
              source={source}
              visibleCases={block.visibleCases}
              locale={locale}
              locked={locked(verdict)}
              active={active === true}
              trustedProviderConfigured={trustedProviderConfigured}
              onRun={onRun}
              onRunResult={onRunResult}
            />
          ) : null}
        </>
      )}

      <CaseTable
        visible={block.visibleCases}
        hidden={block.hiddenCaseCount}
        locale={locale}
        results={caseResults}
      />

      {/* The monthly check runs real cases through the same judge a practice
          task does, so it degrades the same way — and this is the block where a
          silent "saved for the teacher" would be worst, because the learner
          believes their assessment was recorded. */}
      <NoteLine note={note} locale={locale} />
      {note === undefined && locked(verdict) ? (
        <RevealNote label={t(L.savedForTeacher, locale)} />
      ) : null}
      {reveal?.points ? <MarkingPoints points={reveal.points} locale={locale} /> : null}
    </>
  );
}

/** Sample cases plus an honest count of the ones withheld. */
function CaseTable({
  visible,
  hidden,
  locale,
  results,
}: {
  visible: { input: string; expectedOutput: string }[];
  hidden: number;
  locale: Locale;
  /**
   * What the learner's own program printed, once it has been run.
   *
   * Matched to the visible cases by INPUT rather than by index: the server
   * caps how many it returns, and an index match would put one case's output
   * beside another's expectation — which is worse than showing nothing.
   */
  results?: { input: string; expected: string; actual: string; passed: boolean }[];
}) {
  if (!visible.length && hidden === 0) return null;
  const byInput = new Map((results ?? []).map((r) => [r.input.trim(), r]));
  const anyResult = byInput.size > 0;

  return (
    <div className="w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] p-4">
      {visible.length ? (
        <>
          <p className="mb-3 text-[14px] leading-5 text-b-fg/60">
            {t(anyResult ? L.examplesWithYours : L.examples, locale)}
          </p>
          <div className="flex flex-col gap-2">
            {visible.map((c, i) => {
              const got = byInput.get(c.input.trim());
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-b-mono text-[15px]">
                    <span className="overflow-x-auto whitespace-pre text-b-fg/70">{c.input}</span>
                    <span aria-hidden="true" className="text-b-fg/30">→</span>
                    <span className="overflow-x-auto whitespace-pre text-b-green-2">
                      {c.expectedOutput}
                    </span>
                  </div>
                  {/* The learner's own output, only where it DIFFERS. Repeating
                      a correct answer under itself is noise; the whole value of
                      this row is the comparison on the case that failed. */}
                  {got && !got.passed ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 font-b-mono text-[15px]">
                      <span className="text-[13px] leading-5 text-b-fg/40">
                        {t(L.yourOutput, locale)}
                      </span>
                      <span aria-hidden="true" className="text-b-fg/30">→</span>
                      <span className="overflow-x-auto whitespace-pre text-b-warn-edge">
                        {got.actual.trim().length > 0 ? got.actual : t(L.yourOutputEmpty, locale)}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      {hidden > 0 ? (
        <p className={cn("text-[14px] leading-5 text-b-fg/40", visible.length && "mt-3")}>
          {t(L.hiddenTests(hidden), locale)}
        </p>
      ) : null}
    </div>
  );
}

function MarkingPoints({
  points,
  locale,
}: {
  points: { kk: string; ru: string }[];
  locale: Locale;
}) {
  return (
    <div className="w-full rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3">
      <p className="mb-2 text-[14px] leading-5 text-b-fg/60">{t(L.teacherLooksFor, locale)}</p>
      <ul className="flex flex-col gap-1.5">
        {points.map((point, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-6 text-b-fg/80">
            <span aria-hidden="true" className="mt-[10px] size-1 shrink-0 rounded-full bg-b-fg/40" />
            {t(point, locale)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] leading-5 text-b-fg/40">{t(L.notAutoGraded, locale)}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Code tasks                                                                 */
/* -------------------------------------------------------------------------- */

function CodeTaskView({
  block,
  locale,
  verdict,
  answer,
  onAnswer,
  note,
  lessonId,
  monthIndex,
  active,
  trustedProviderConfigured = true,
  onRun,
  onRunResult,
  caseResults,
}: BlockViewProps) {
  if (
    block.type !== "write_code" &&
    block.type !== "modify_code" &&
    block.type !== "challenge"
  ) {
    return null;
  }

  const starter = block.starter ?? block.code ?? "";
  const source = answer.kind === "text" ? answer.value : starter;

  /*
   * A wrong verdict does not take the editor away.
   *
   * `locked(verdict)` is `verdict !== "unchecked"`, which greyed the editor and
   * disabled Run the moment a Check came back wrong — so the one screen where a
   * learner most needs to change something and try it was the one screen where
   * they could not. The measured session: printed `55` for `7 * 8`, told «Әзірге
   * дұрыс емес… «Көмек» түймесін бас», editor grey.
   *
   * A CORRECT verdict still locks. That work is settled, the answer is in the
   * ledger, and editing it afterwards would produce a screen that disagrees
   * with the record. `unmeasured` locks too: nothing was measured, so nothing
   * has been decided, and the block behaves as it did.
   *
   * Only this block type. A quiz that unlocked on a wrong answer would let a
   * learner walk the options, and the reveal policy — three attempts, then the
   * answer — is what models that instead.
   */
  const editorLocked = locked(verdict) && verdict !== "wrong" && verdict !== "partial";

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      <AnswerArea
        value={source}
        onChange={(v) => onAnswer({ kind: "text", value: v })}
        verdict={editorLocked ? verdict : "unchecked"}
        rows={Math.max(6, source.split("\n").length + 2)}
        mono
      />

      {/* Directly under the editor, above the examples: Run is about the thing
          the learner just typed, and putting the samples in between would make
          the button read as "run the examples". The input box is seeded from
          the first sample anyway, so the common path needs no typing at all. */}
      <RunPanel
        blockId={block.id}
        blockType={block.type}
        lessonId={lessonId}
        monthIndex={monthIndex}
        source={source}
        visibleCases={block.visibleCases}
        locale={locale}
        locked={editorLocked}
        active={active === true}
        trustedProviderConfigured={trustedProviderConfigured}
        onRun={onRun}
        onRunResult={onRunResult}
      />

      <CaseTable
        visible={block.visibleCases}
        hidden={block.hiddenCaseCount}
        locale={locale}
        results={caseResults}
      />

      {/* Honest about the sandbox rather than faking a pass — and specific about
          WHICH kind of honest. `judge_unavailable` says the checker is down and
          nobody is being marked wrong; the fallback says it is not connected,
          which is the true sentence for a deployment that has no judge at all.
          `not_saved` overrides both: nothing was graded and nothing was kept. */}
      <NoteLine note={note} locale={locale} />
      {note === undefined && verdict === "unmeasured" ? (
        <RevealNote label={t(L.sandboxPending, locale)} />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Step execution is the one visualiser the programme names as September's
 * «түсінудің басты құралы», and the one that is built. The other eight keep the
 * dashed placeholder: an animation that only looks like a loop trace would cost
 * more trust than the admission does.
 *
 * The trace is built here rather than inside the visualiser so an unreadable
 * config falls back to the same honest card instead of a broken interactive.
 */
function SimulationView({ block, locale }: BlockViewProps) {
  if (block.type !== "visual_simulation") return null;
  const program =
    block.simulation === "step_execution" ? buildStepProgram(block.config) : null;

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      {program ? (
        <StepExecution program={program} locale={locale} />
      ) : (
        <div className="grid w-full place-items-center rounded-[12px] border-2 border-dashed border-b-lock-edge bg-b-lock-fill px-6 py-12 text-center">
          <p className="text-[16px] leading-6 text-b-fg/60">
            {t(L.visualiserPending, locale)}
          </p>
          <p className="mt-1 font-b-mono text-[14px] text-b-fg/30">{block.simulation}</p>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Worked example                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A problem reasoned through, not just a snippet with a caption.
 *
 * The programme asks for «толық талданған мысалдар» and September had none: a
 * concept block shows an answer without showing the thinking that reaches it.
 * The order below is the brief's own — problem, reasoning, code, result — and
 * the steps are numbered so the learner can follow one move at a time.
 */
function WorkedExampleView({ block, locale }: BlockViewProps) {
  if (block.type !== "worked_example") return null;
  return (
    <>
      <LessonProse title={t(block.title, locale)}>
        <LessonParagraph text={t(block.problem, locale)} />
      </LessonProse>

      <ol className="flex w-full flex-col gap-2">
        {block.steps.map((step, i) => (
          <WorkedExampleStep key={i} n={i + 1} text={t(step, locale)} />
        ))}
      </ol>

      <CodePanel code={block.code} />

      <div className="w-full rounded-[12px] border-2 border-b-ok-edge bg-b-ok-fill px-4 py-3">
        <p className="mb-1 text-[14px] leading-5 text-b-fg/60">{t(L.result, locale)}</p>
        <p className="font-b-mono text-[15px] leading-6 whitespace-pre text-b-fg">
          {t(block.result, locale)}
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

export function BlockView(props: BlockViewProps) {
  return (
    <>
      {renderBlock(props)}
      {/* Both outside the switch, and for the same reason: neither is a fact
          about what KIND of block this is. A lost round trip loses a multiple
          choice exactly as it loses a coding task, and a restored block is
          restored whatever it contains. */}
      <RestoredNote
        restored={props.restored}
        assisted={props.assisted}
        verdict={props.verdict}
        locale={props.locale}
      />
      <SaveFailureNote note={props.note} locale={props.locale} />
    </>
  );
}

function renderBlock(props: BlockViewProps) {
  const { block } = props;

  switch (block.type) {
    case "concept":
      return <ConceptView {...props} />;
    case "worked_example":
      return <WorkedExampleView {...props} />;
    case "prediction":
      return <PredictionView {...props} />;
    case "multiple_choice":
      return <MultipleChoiceView {...props} />;
    case "find_bug":
      return <FindBugView {...props} />;
    case "fill_blank":
      return <FillBlankView {...props} />;
    case "reorder_code":
      return <ReorderView {...props} />;
    case "trace_code":
      return <TraceView {...props} />;
    case "test_case":
      return <TestCaseView {...props} />;
    case "explain":
      return <ExplainView {...props} />;
    case "reflection":
      return <ReflectionView {...props} />;
    case "verify":
      return <VerifyView {...props} />;
    case "write_code":
    case "modify_code":
    case "challenge":
      return <CodeTaskView {...props} />;
    case "visual_simulation":
      return <SimulationView {...props} />;
    case "arena_problem":
      return (
        <BlockPrompt>{t(block.prompt, props.locale)}</BlockPrompt>
      );
    default: {
      // Load-bearing. Without it a new block type ships as a blank card.
      const exhaustive: never = block;
      void exhaustive;
      return null;
    }
  }
}
