"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  MultipleChoiceBlock,
  PredictionBlock,
} from "@schools/curriculum/types";
import { Button, CodeBlock, VerdictBanner } from "../primitives";
import { UI, useLocale } from "../i18n";
import { IconCheck, IconCross } from "../icons";
import { lookupFailureClass, type BlockProps } from "./types";

/* -------------------------------------------------------------------------- */
/* Option list, shared by prediction and multiple choice                      */
/* -------------------------------------------------------------------------- */

function OptionList({
  options,
  selected,
  correct,
  settled,
  onSelect,
}: {
  options: { id: string; label: string }[];
  selected: string | null;
  correct: string;
  settled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isCorrect = option.id === correct;
        // After settling, show the right answer as well as what they chose.
        // Hiding it would mean the learner leaves the block still not knowing.
        const reveal = settled && (isSelected || isCorrect);

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={settled}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-sx-md",
              "border px-4 py-3 text-left text-sx-meta",
              "transition-[border-color,background-color,transform] duration-200",
              "ease-[var(--ease-sx-out)] active:scale-[0.99] disabled:cursor-default",
              !reveal && isSelected && "border-sx-primary bg-sx-primary-soft",
              !reveal && !isSelected && "border-sx-line bg-sx-surface hover:border-sx-line-strong",
              reveal && isCorrect && "border-sx-correct/50 bg-sx-correct-soft",
              reveal && !isCorrect && "border-sx-wrong/50 bg-sx-wrong-soft",
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                isSelected || (reveal && isCorrect)
                  ? "border-current"
                  : "border-sx-text-3",
                reveal && isCorrect && "text-sx-correct",
                reveal && isSelected && !isCorrect && "text-sx-wrong",
                !reveal && isSelected && "text-sx-primary",
              )}
            >
              {reveal && isCorrect ? <IconCheck size={12} /> : null}
              {reveal && isSelected && !isCorrect ? <IconCross size={12} /> : null}
              {!reveal && isSelected ? (
                <span className="size-2 rounded-full bg-current" />
              ) : null}
            </span>
            <span className="sx-code min-w-0 flex-1 break-words">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prediction                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * "What will this print?" — asked *before* the learner may run it.
 *
 * The programme's pedagogical loop puts prediction ahead of execution on
 * purpose: committing to an answer first is what turns running the code into
 * feedback rather than into the answer itself.
 */
export function PredictionRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<PredictionBlock>) {
  const { t } = useLocale();
  const [choice, setChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const hasOptions = Boolean(block.options?.length);
  const answer = hasOptions ? choice : typed.trim();

  function commit() {
    if (!answer) return;
    const isCorrect = answer === block.answer.trim();
    onResult({
      verdict: isCorrect ? "correct" : "wrong",
      answer,
      failureClass: isCorrect ? undefined : lookupFailureClass(block, answer),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      <CodeBlock code={block.code} />

      {hasOptions ? (
        <OptionList
          options={block.options!.map((o) => ({ id: o, label: o }))}
          selected={choice}
          correct={block.answer}
          settled={settled}
          onSelect={setChoice}
        />
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-sx-small font-medium text-sx-text-2">
            {t(UI.yourAnswer)}
          </span>
          <input
            value={typed}
            disabled={settled}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder={t(UI.writeAnswer)}
            className={cn(
              "sx-code h-12 rounded-sx-md border border-sx-line bg-sx-bg px-4",
              "text-sx-text placeholder:text-sx-text-3",
              "focus:border-sx-primary focus:outline-none disabled:opacity-60",
            )}
          />
        </label>
      )}

      {settled && result ? (
        <VerdictBanner
          verdict={result.verdict}
          detail={
            result.verdict === "wrong"
              ? `${t(UI.correct)}: ${block.answer}`
              : undefined
          }
        />
      ) : (
        <Button onClick={commit} disabled={!answer}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Multiple choice                                                            */
/* -------------------------------------------------------------------------- */

export function MultipleChoiceRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<MultipleChoiceBlock>) {
  const { t } = useLocale();
  const [choice, setChoice] = useState<string | null>(null);

  function commit() {
    if (!choice) return;
    const isCorrect = choice === block.correctOptionId;
    onResult({
      verdict: isCorrect ? "correct" : "wrong",
      answer: choice,
      failureClass: isCorrect ? undefined : lookupFailureClass(block, choice),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      {block.code ? <CodeBlock code={block.code} /> : null}

      <OptionList
        options={block.options.map((o) => ({ id: o.id, label: t(o.label) }))}
        selected={choice}
        correct={block.correctOptionId}
        settled={settled}
        onSelect={setChoice}
      />

      {settled && result ? (
        <VerdictBanner verdict={result.verdict} />
      ) : (
        <Button onClick={commit} disabled={!choice}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}
