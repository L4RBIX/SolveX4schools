"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ChallengeBlock,
  FillBlankBlock,
  FindBugBlock,
  ModifyCodeBlock,
  ReorderCodeBlock,
  WriteCodeBlock,
} from "@schools/curriculum/types";
import { Button, CodeBlock, VerdictBanner } from "../primitives";
import { UI, useLocale } from "../i18n";
import { IconCode } from "../icons";
import { lookupFailureClass, type BlockProps } from "./types";

/* -------------------------------------------------------------------------- */
/* Fill in the blank                                                          */
/* -------------------------------------------------------------------------- */

export function FillBlankRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<FillBlankBlock>) {
  const { t } = useLocale();
  const [values, setValues] = useState<string[]>(() =>
    block.blanks.map(() => ""),
  );

  const segments = useMemo(() => block.template.split("___"), [block.template]);
  const ready = values.every((v) => v.trim().length > 0);

  function commit() {
    const allCorrect = block.blanks.every((blank, i) => {
      const given = values[i].trim();
      return (
        given === blank.answer ||
        (blank.alternatives?.includes(given) ?? false)
      );
    });
    onResult({
      verdict: allCorrect ? "correct" : "wrong",
      answer: values.join("|"),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      <div className="overflow-x-auto rounded-sx-md border border-sx-line bg-sx-bg p-4">
        <div className="sx-code flex w-max min-w-full flex-wrap items-center gap-y-2 whitespace-pre">
          {segments.map((segment, i) => (
            <span key={i} className="contents">
              <span>{segment}</span>
              {i < block.blanks.length ? (
                <input
                  value={values[i]}
                  disabled={settled}
                  aria-label={`${t(UI.writeAnswer)} ${i + 1}`}
                  onChange={(e) => {
                    const next = [...values];
                    next[i] = e.target.value;
                    setValues(next);
                  }}
                  // Width tracks content so the code line does not jump as the
                  // learner types; a fixed-width input would reflow the block.
                  style={{ width: `${Math.max(4, values[i].length + 1)}ch` }}
                  className={cn(
                    "sx-code mx-1 rounded border-b-2 bg-sx-raised px-1 text-center",
                    "text-sx-accent focus:outline-none",
                    settled
                      ? values[i].trim() === block.blanks[i].answer
                        ? "border-sx-correct"
                        : "border-sx-wrong"
                      : "border-sx-primary",
                  )}
                />
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {settled && result ? (
        <VerdictBanner
          verdict={result.verdict}
          detail={
            result.verdict === "wrong"
              ? block.blanks.map((b) => b.answer).join(", ")
              : undefined
          }
        />
      ) : (
        <Button onClick={commit} disabled={!ready}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reorder                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Put the lines in the right order.
 *
 * Move-up / move-down buttons rather than drag-and-drop. Two reasons, and
 * neither is convenience: drag has no keyboard equivalent without building
 * one, and on the touch laptops these classrooms use, a drag inside a
 * scrolling page fights the scroll gesture. Buttons work everywhere.
 */
export function ReorderCodeRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<ReorderCodeBlock>) {
  const { t } = useLocale();
  // Presented shuffled, but deterministically: a fresh shuffle on every render
  // would move the lines out from under the learner.
  const [order, setOrder] = useState<string[]>(() => {
    const ids = block.lines.map((l) => l.id);
    return [...ids].reverse();
  });

  const byId = useMemo(
    () => new Map(block.lines.map((l) => [l.id, l])),
    [block.lines],
  );

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  function commit() {
    const correct =
      order.length === block.correctOrder.length &&
      order.every((id, i) => id === block.correctOrder[i]);
    onResult({ verdict: correct ? "correct" : "wrong", answer: order.join(",") });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      <ol className="flex flex-col gap-1.5">
        {order.map((id, i) => {
          const line = byId.get(id);
          const rightPlace = settled && block.correctOrder[i] === id;
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-2 rounded-sx-sm border bg-sx-surface px-2 py-1.5",
                settled
                  ? rightPlace
                    ? "border-sx-correct/40"
                    : "border-sx-wrong/40"
                  : "border-sx-line",
              )}
            >
              <span className="sx-code min-w-0 flex-1 overflow-x-auto whitespace-pre">
                {line?.code}
              </span>
              {!settled ? (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`${t(UI.back)} ${i + 1}`}
                    className="grid size-11 cursor-pointer place-items-center rounded-sx-sm text-sx-text-2 hover:bg-sx-raised hover:text-sx-text disabled:opacity-25"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 15 6-6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label={`${t(UI.next)} ${i + 1}`}
                    className="grid size-11 cursor-pointer place-items-center rounded-sx-sm text-sx-text-2 hover:bg-sx-raised hover:text-sx-text disabled:opacity-25"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {settled && result ? (
        <VerdictBanner verdict={result.verdict} />
      ) : (
        <Button onClick={commit}>{t(UI.check)}</Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Find the bug                                                               */
/* -------------------------------------------------------------------------- */

/**
 * One of the programme's five verification methods (PDF p.6): hand the learner
 * a program that does not work and ask them to say why.
 */
export function FindBugRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<FindBugBlock>) {
  const { t } = useLocale();
  const [picked, setPicked] = useState<number | null>(null);

  const lines = block.code.replace(/\n$/, "").split("\n");

  function commit() {
    if (picked === null) return;
    const correct = picked === block.buggyLine;
    onResult({
      verdict: correct ? "correct" : "wrong",
      answer: String(picked),
      failureClass: correct ? undefined : lookupFailureClass(block, String(picked)),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      <div className="overflow-x-auto rounded-sx-md border border-sx-line bg-sx-bg py-2">
        <div className="sx-code w-max min-w-full">
          {lines.map((line, i) => {
            const n = i + 1;
            const isBug = settled && n === block.buggyLine;
            const isWrongPick = settled && picked === n && n !== block.buggyLine;
            return (
              <button
                key={n}
                type="button"
                disabled={settled}
                onClick={() => setPicked(n)}
                aria-pressed={picked === n}
                className={cn(
                  "flex w-full min-w-full cursor-pointer items-center px-3 py-1 text-left",
                  "transition-colors duration-150 disabled:cursor-default",
                  !settled && picked === n && "bg-sx-primary-soft",
                  !settled && picked !== n && "hover:bg-sx-raised",
                  isBug && "bg-sx-correct-soft",
                  isWrongPick && "bg-sx-wrong-soft",
                )}
              >
                <span
                  className="sx-tabular mr-4 w-6 shrink-0 text-right text-sx-text-3 select-none"
                  aria-hidden="true"
                >
                  {n}
                </span>
                <span className="whitespace-pre">{line || " "}</span>
              </button>
            );
          })}
        </div>
      </div>

      {settled ? (
        <div className="flex flex-col gap-3">
          {result ? <VerdictBanner verdict={result.verdict} /> : null}
          <div>
            <p className="mb-2 flex items-center gap-2 text-sx-small font-semibold text-sx-text-2">
              <IconCode size={16} />
              {t({ kk: "Түзетілген нұсқа", ru: "Исправленный вариант" })}
            </p>
            <CodeBlock code={block.fixedCode} />
          </div>
        </div>
      ) : (
        <Button onClick={commit} disabled={picked === null}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Write / modify / challenge                                                 */
/* -------------------------------------------------------------------------- */

type CodeTaskBlock = WriteCodeBlock | ModifyCodeBlock | ChallengeBlock;

/**
 * Writing code.
 *
 * The editor here is a plain textarea and the "run" is a stub — execution goes
 * through a sandboxed service, and running learner-submitted Python on the
 * application server is not an option. `onRun` is the seam that service plugs
 * into; until it is wired, this renderer is honest about not having run
 * anything rather than faking a pass.
 */
export function CodeTaskRenderer({
  block,
  onResult,
  settled,
  result,
  onRun,
}: BlockProps<CodeTaskBlock> & {
  onRun?: (source: string) => Promise<{ verdict: "correct" | "wrong" | "partial"; detail?: string }>;
}) {
  const { t } = useLocale();
  const starter =
    "starter" in block && block.starter
      ? block.starter
      : "code" in block
        ? block.code
        : "";
  const [source, setSource] = useState(starter);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const visibleCases = block.cases.filter((c) => !c.hidden);
  const hiddenCount = block.cases.length - visibleCases.length;

  async function run() {
    if (!onRun) {
      setNote(
        t({
          kk: "Кодты орындау қызметі әлі қосылмаған. Шешіміңді сақтап, мұғаліммен тексер.",
          ru: "Сервис запуска кода ещё не подключён. Сохрани решение и проверь с учителем.",
        }),
      );
      onResult({ verdict: "unknown", answer: source });
      return;
    }
    setRunning(true);
    try {
      const outcome = await onRun(source);
      onResult({ verdict: outcome.verdict, answer: source });
      setNote(outcome.detail ?? null);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      <label className="flex flex-col gap-2">
        <span className="sr-only">{t(UI.yourAnswer)}</span>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          rows={Math.max(6, source.split("\n").length + 2)}
          className={cn(
            "sx-code w-full resize-y rounded-sx-md border border-sx-line bg-sx-bg p-4",
            "text-sx-text focus:border-sx-primary focus:outline-none",
          )}
        />
      </label>

      {visibleCases.length ? (
        <div className="rounded-sx-md border border-sx-line bg-sx-surface p-4">
          <p className="mb-3 text-sx-small font-semibold text-sx-text-2">
            {t({ kk: "Мысалдар", ru: "Примеры" })}
          </p>
          <div className="flex flex-col gap-2">
            {visibleCases.map((c, i) => (
              <div key={i} className="sx-code grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sx-small">
                <span className="overflow-x-auto whitespace-pre text-sx-text-2">{c.input}</span>
                <span className="text-sx-text-3" aria-hidden="true">→</span>
                <span className="overflow-x-auto whitespace-pre text-sx-accent">{c.expectedOutput}</span>
              </div>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <p className="mt-3 text-sx-small text-sx-text-3">
              {t({
                kk: `Тағы ${hiddenCount} жасырын тексеру бар — үлгіні ғана көшіру жеткіліксіз.`,
                ru: `Ещё ${hiddenCount} скрытых теста — скопировать пример недостаточно.`,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {settled && result ? (
        <VerdictBanner verdict={result.verdict} detail={note ?? undefined} />
      ) : (
        <Button onClick={run} disabled={running || !source.trim()}>
          {running ? "…" : t(UI.run)}
        </Button>
      )}
    </div>
  );
}
