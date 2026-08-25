"use client";

import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { LessonBlock, Locale } from "@schools/curriculum/types";
import type { BlockAnswer } from "@schools/learning/checking";
import { L, t } from "@schools/presentation/labels";
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

export interface BlockViewProps<T extends LessonBlock = LessonBlock> {
  block: T;
  locale: Locale;
  verdict: LessonVerdict;
  answer: BlockAnswer;
  onAnswer: (a: BlockAnswer) => void;
  /** Scene image for the block, when the lesson supplies one. */
  art?: string;
}

const locked = (v: LessonVerdict) => v !== "unchecked";

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

function PredictionView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
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
          correctId={block.answer.trim()}
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

      {!hasOptions && (verdict === "wrong" || verdict === "partial") ? (
        <RevealNote
          label={t(L.correctAnswerIs, locale)}
          value={block.answer}
          tone="warn"
        />
      ) : null}
    </>
  );
}

function MultipleChoiceView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "multiple_choice") return null;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      {block.code ? <CodePanel code={block.code} verdict={verdict} /> : null}
      <OptionList
        options={block.options.map((o) => ({ id: o.id, label: t(o.label, locale) }))}
        selected={answer.kind === "option" ? answer.id : null}
        correctId={block.correctOptionId}
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
function FindBugView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "find_bug") return null;
  const lines = block.code.replace(/\n$/, "").split("\n");
  const picked = answer.kind === "line" ? answer.line : 0;
  const isLocked = locked(verdict);
  const revealing = verdict === "correct" || verdict === "wrong" || verdict === "partial";

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      <div
        className={cn(
          "w-full overflow-hidden rounded-[12px] border-2 transition-colors duration-200",
          !isLocked && "border-b-sched-edge bg-b-sched-fill",
          verdict === "correct" && "border-b-ok bg-b-ok-panel",
          (verdict === "wrong" || verdict === "partial") &&
            "border-b-lock-panel-edge bg-b-lock-panel",
          verdict === "unmeasured" && "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <div className="m-2 overflow-x-auto rounded-[8px] bg-black py-2">
          <div className="w-max min-w-full font-b-mono text-[15px] leading-[26px]">
            {lines.map((line, i) => {
              const n = i + 1;
              const isBug = revealing && n === block.buggyLine;
              const wrongPick = revealing && picked === n && n !== block.buggyLine;
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
                    !isLocked && picked !== n && "hover:bg-white/5",
                    isBug && "bg-b-ok-fill",
                    wrongPick && "bg-b-warn-fill",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mr-4 w-6 shrink-0 text-right tabular-nums text-white/30 select-none"
                  >
                    {n}
                  </span>
                  <span className="whitespace-pre text-white">{line || " "}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isLocked ? (
        <p className="w-full text-[14px] leading-5 text-white/40">
          {t(L.whichLine, locale)}
        </p>
      ) : null}

      {revealing ? (
        <div className="flex w-full flex-col gap-2">
          <p className="text-[14px] leading-5 text-white/60">{t(L.fixedVersion, locale)}</p>
          <CodePanel code={block.fixedCode} verdict="correct" />
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Fill in the blank                                                          */
/* -------------------------------------------------------------------------- */

function FillBlankView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
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
          !isLocked ? "border-b-sched-edge bg-b-sched-fill" : "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <div className="m-2 overflow-x-auto rounded-[8px] bg-black p-3">
          <div className="flex w-max min-w-full flex-wrap items-center gap-y-2 font-b-mono text-[15px] leading-[30px] whitespace-pre text-white">
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
                      "mx-1 rounded-[4px] border-b-2 bg-white/10 px-1 text-center font-b-mono",
                      "text-b-green-2 focus:outline-none",
                      "transition-colors duration-100",
                      !isLocked && "border-b-sched-edge-on",
                      isLocked &&
                        (values[i] ?? "").trim() === block.blanks[i].answer
                        ? "border-b-ok-edge"
                        : isLocked
                          ? "border-b-warn-edge"
                          : "",
                    )}
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      {verdict === "wrong" || verdict === "partial" ? (
        <RevealNote
          label={t(L.correctAnswerIs, locale)}
          value={block.blanks.map((b) => b.answer).join(", ")}
          tone="warn"
        />
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
  // Presented shuffled, but deterministically — a fresh shuffle per render
  // would move the lines out from under the learner mid-thought.
  const order =
    answer.kind === "order" && answer.ids.length
      ? answer.ids
      : [...block.lines.map((l) => l.id)].reverse();

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
          const rightPlace = isLocked && block.correctOrder[i] === id;
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border-2 px-3 py-2",
                "transition-colors duration-100",
                !isLocked && "border-b-sched-edge bg-b-sched-fill",
                isLocked && rightPlace && "border-b-ok-edge bg-b-ok-fill",
                isLocked && !rightPlace && "border-b-warn-edge bg-b-warn-fill",
              )}
            >
              <span className="min-w-0 flex-1 overflow-x-auto font-b-mono text-[15px] leading-[26px] whitespace-pre text-white">
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
        "grid size-11 place-items-center rounded-[8px] text-white/60",
        "transition-colors duration-100",
        disabled ? "cursor-default opacity-20" : "cursor-pointer hover:bg-white/10 hover:text-white",
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

function TraceView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "trace_code") return null;
  const cells = answer.kind === "grid" ? answer.cells : {};
  const names = Array.from(new Set(block.steps.flatMap((s) => Object.keys(s.vars))));
  const isLocked = locked(verdict);
  const key = (row: number, name: string) => `${row}:${name}`;

  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <CodePanel code={block.code} verdict={verdict} />

      <div
        className={cn(
          "w-full overflow-x-auto rounded-[12px] border-2 transition-colors duration-200",
          !isLocked ? "border-b-sched-edge bg-b-sched-fill" : "border-b-lock-edge bg-b-lock-fill",
        )}
      >
        <table className="w-full min-w-max border-collapse text-[15px]">
          <thead>
            <tr className="border-b-2 border-black/40">
              <th className="px-3 py-2 text-left font-medium text-white/60">
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
                <td className="px-3 py-1.5 tabular-nums text-white/50">{step.line}</td>
                {names.map((name) => {
                  const expected = step.vars[name];
                  if (expected === undefined) {
                    return <td key={name} className="px-3 py-1.5 text-white/25">—</td>;
                  }
                  const value = cells[key(row, name)] ?? "";
                  const right = isLocked && value.trim() === expected;
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
                          "h-10 w-[72px] rounded-[8px] border-2 bg-black px-2 text-center font-b-mono text-white",
                          "focus:outline-none transition-colors duration-100",
                          !isLocked && "border-b-sched-edge focus:border-b-sched-edge-on",
                          right && "border-b-ok-edge",
                          isLocked && !right && "border-b-warn-edge",
                        )}
                      />
                      {isLocked && !right ? (
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

function TestCaseView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
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
          real breaking case the author never listed. */}
      {verdict === "unmeasured" ? (
        <RevealNote
          label={t(L.savedForTeacher, locale)}
          value={block.breakingInputs[0]}
        />
      ) : null}
    </>
  );
}

function ExplainView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "explain") return null;
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
      {locked(verdict) ? (
        <div className="w-full rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3">
          <p className="mb-2 text-[14px] leading-5 text-white/60">
            {t(L.teacherLooksFor, locale)}
          </p>
          <ul className="flex flex-col gap-1.5">
            {block.expectedPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-6 text-white/80">
                <span aria-hidden="true" className="mt-[10px] size-1 shrink-0 rounded-full bg-white/40" />
                {t(point, locale)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] leading-5 text-white/40">
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

const VERIFY_LABEL = {
  unseen_problem: L.verifyUnseen,
  manual_trace: L.verifyTrace,
  find_bug: L.verifyFindBug,
  oral_explanation: L.verifyOral,
  delayed_resolve: L.verifyDelayed,
} as const;

function VerifyView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (block.type !== "verify") return null;
  const oral = block.mode === "oral_explanation";

  return (
    <>
      <span className="w-fit self-start rounded-full border-2 border-b-sched-edge bg-b-sched-fill px-3 py-1 text-[13px] leading-5 font-medium tracking-wide text-white/80 uppercase">
        {t(VERIFY_LABEL[block.mode], locale)}
      </span>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>

      {oral ? (
        <div className="w-full rounded-[12px] border-2 border-b-lock-edge bg-b-lock-fill px-4 py-3 text-[16px] leading-6 text-white/80">
          {t(L.oralTask, locale)}
        </div>
      ) : (
        <AnswerArea
          value={answer.kind === "text" ? answer.value : ""}
          onChange={(v) => onAnswer({ kind: "text", value: v })}
          verdict={verdict}
          rows={8}
          mono
        />
      )}

      {locked(verdict) ? <RevealNote label={t(L.savedForTeacher, locale)} /> : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Code tasks                                                                 */
/* -------------------------------------------------------------------------- */

function CodeTaskView({ block, locale, verdict, answer, onAnswer }: BlockViewProps) {
  if (
    block.type !== "write_code" &&
    block.type !== "modify_code" &&
    block.type !== "challenge"
  ) {
    return null;
  }

  const starter =
    "starter" in block && block.starter
      ? block.starter
      : "code" in block
        ? block.code
        : "";
  const source = answer.kind === "text" ? answer.value : starter;
  const visible = block.cases.filter((c) => !c.hidden);
  const hidden = block.cases.length - visible.length;

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

      {visible.length ? (
        <div className="w-full rounded-[12px] border-2 border-b-sched-edge bg-b-sched-fill p-4">
          <p className="mb-3 text-[14px] leading-5 text-white/60">
            {t(L.examples, locale)}
          </p>
          <div className="flex flex-col gap-2">
            {visible.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-b-mono text-[15px]"
              >
                <span className="overflow-x-auto whitespace-pre text-white/70">{c.input}</span>
                <span aria-hidden="true" className="text-white/30">→</span>
                <span className="overflow-x-auto whitespace-pre text-b-green-2">
                  {c.expectedOutput}
                </span>
              </div>
            ))}
          </div>
          {hidden > 0 ? (
            <p className="mt-3 text-[14px] leading-5 text-white/40">
              {t(L.hiddenTests(hidden), locale)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Honest about the missing sandbox rather than faking a pass. */}
      {verdict === "unmeasured" ? (
        <RevealNote label={t(L.sandboxPending, locale)} />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulation                                                                 */
/* -------------------------------------------------------------------------- */

function SimulationView({ block, locale }: BlockViewProps) {
  if (block.type !== "visual_simulation") return null;
  return (
    <>
      <BlockPrompt>{t(block.prompt, locale)}</BlockPrompt>
      <div className="grid w-full place-items-center rounded-[12px] border-2 border-dashed border-b-lock-edge bg-b-lock-fill px-6 py-12 text-center">
        <p className="text-[16px] leading-6 text-white/60">
          {t(L.visualiserPending, locale)}
        </p>
        <p className="mt-1 font-b-mono text-[14px] text-white/30">{block.simulation}</p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

export function BlockView(props: BlockViewProps) {
  const { block } = props;

  switch (block.type) {
    case "concept":
      return <ConceptView {...props} />;
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
