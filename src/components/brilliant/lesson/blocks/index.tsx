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
  trustedProviderConfigured = true,
  onRun,
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
            />
          ) : null}
        </>
      )}

      <CaseTable
        visible={block.visibleCases}
        hidden={block.hiddenCaseCount}
        locale={locale}
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
}: {
  visible: { input: string; expectedOutput: string }[];
  hidden: number;
  locale: Locale;
}) {
  if (!visible.length && hidden === 0) return null;
  return (
    <div className="w-full rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] p-4">
      {visible.length ? (
        <>
          <p className="mb-3 text-[14px] leading-5 text-b-fg/60">{t(L.examples, locale)}</p>
          <div className="flex flex-col gap-2">
            {visible.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-b-mono text-[15px]"
              >
                <span className="overflow-x-auto whitespace-pre text-b-fg/70">{c.input}</span>
                <span aria-hidden="true" className="text-b-fg/30">→</span>
                <span className="overflow-x-auto whitespace-pre text-b-green-2">
                  {c.expectedOutput}
                </span>
              </div>
            ))}
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

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      <AnswerArea
        value={source}
        onChange={(v) => onAnswer({ kind: "text", value: v })}
        verdict={verdict}
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
        locked={locked(verdict)}
        active={active === true}
        trustedProviderConfigured={trustedProviderConfigured}
        onRun={onRun}
      />

      <CaseTable
        visible={block.visibleCases}
        hidden={block.hiddenCaseCount}
        locale={locale}
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
          <li
            key={i}
            className="flex gap-3 rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] px-4 py-3"
          >
            <span className="mt-[2px] flex size-6 shrink-0 items-center justify-center rounded-full bg-b-fg/10 text-[13px] font-medium tabular-nums text-b-fg/70">
              {i + 1}
            </span>
            <span className="text-[16px] leading-6 text-b-fg/85">{t(step, locale)}</span>
          </li>
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
      {/* Last, and outside the switch: it belongs to the round trip, not to the
          block, and it must appear whatever the block turned out to be. */}
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
