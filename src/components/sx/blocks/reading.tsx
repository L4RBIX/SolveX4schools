"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ConceptBlock,
  ExplainBlock,
  ReflectionBlock,
  TestCaseBlock,
  TraceCodeBlock,
  VerifyBlock,
  VisualSimulationBlock,
} from "@schools/curriculum/types";
import { Button, Card, CodeBlock, VerdictBanner } from "../primitives";
import { UI, useLocale } from "../i18n";
import { IconBook, IconEye, IconSpeech, IconTarget } from "../icons";
import type { BlockProps } from "./types";

/* -------------------------------------------------------------------------- */
/* Concept                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A short explanation. Not an attempt — reading is not trying, and the hint
 * ladder must never treat it as such.
 *
 * The programme allows 5–8 minutes of explanation per lesson carrying one idea
 * (PDF p.3), so this renderer has no "read more": if a concept needs a fold,
 * it is two concepts.
 */
export function ConceptRenderer({ block, onResult, settled }: BlockProps<ConceptBlock>) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sx-primary">
        <IconBook size={18} />
        <h3 className="text-sx-h3 font-semibold text-sx-text">{t(block.title)}</h3>
      </div>

      <div className="text-sx-body leading-relaxed text-sx-text-2">
        {t(block.body)
          .split("\n")
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="mb-3 last:mb-0">
              {renderInlineCode(para)}
            </p>
          ))}
      </div>

      {block.code ? <CodeBlock code={block.code} /> : null}

      {!settled ? (
        <Button variant="secondary" onClick={() => onResult({ verdict: "unknown" })}>
          {t(UI.read)}
        </Button>
      ) : null}
    </div>
  );
}

/** Renders `backticks` as inline code without pulling in a markdown parser. */
function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        className="sx-code rounded bg-sx-raised px-1.5 py-0.5 text-sx-accent"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Trace                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Run the program on paper.
 *
 * The programme's second verification method (PDF p.6). The learner fills in
 * each variable's value after each executed line, without running anything.
 */
export function TraceCodeRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<TraceCodeBlock>) {
  const { t } = useLocale();
  const varNames = Array.from(
    new Set(block.steps.flatMap((s) => Object.keys(s.vars))),
  );
  const [grid, setGrid] = useState<Record<string, string>>({});

  const key = (row: number, name: string) => `${row}:${name}`;
  const filled = block.steps.every((step, row) =>
    Object.keys(step.vars).every((name) => (grid[key(row, name)] ?? "").trim()),
  );

  function commit() {
    const allRight = block.steps.every((step, row) =>
      Object.entries(step.vars).every(
        ([name, expected]) => (grid[key(row, name)] ?? "").trim() === expected,
      ),
    );
    onResult({ verdict: allRight ? "correct" : "wrong" });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      <CodeBlock code={block.code} />

      <div className="overflow-x-auto rounded-sx-md border border-sx-line">
        <table className="w-full min-w-max border-collapse text-sx-small">
          <thead>
            <tr className="border-b border-sx-line bg-sx-surface">
              <th className="px-3 py-2 text-left font-semibold text-sx-text-2">
                {t({ kk: "Жол", ru: "Строка" })}
              </th>
              {varNames.map((name) => (
                <th key={name} className="sx-code px-3 py-2 text-left text-sx-accent">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.steps.map((step, row) => (
              <tr key={row} className="border-b border-sx-line last:border-0">
                <td className="sx-tabular px-3 py-1.5 text-sx-text-3">{step.line}</td>
                {varNames.map((name) => {
                  const expected = step.vars[name];
                  if (expected === undefined) {
                    return <td key={name} className="px-3 py-1.5 text-sx-text-3">—</td>;
                  }
                  const value = grid[key(row, name)] ?? "";
                  const right = settled && value.trim() === expected;
                  return (
                    <td key={name} className="px-2 py-1.5">
                      <input
                        value={value}
                        disabled={settled}
                        aria-label={`${name}, ${t({ kk: "жол", ru: "строка" })} ${step.line}`}
                        onChange={(e) =>
                          setGrid({ ...grid, [key(row, name)]: e.target.value })
                        }
                        className={cn(
                          "sx-code h-9 w-16 rounded-sx-sm border bg-sx-bg px-2 text-center",
                          "focus:outline-none",
                          settled
                            ? right
                              ? "border-sx-correct text-sx-correct"
                              : "border-sx-wrong text-sx-wrong"
                            : "border-sx-line focus:border-sx-primary",
                        )}
                      />
                      {settled && !right ? (
                        <span className="sx-code ml-2 text-sx-correct">{expected}</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {settled && result ? (
        <VerdictBanner verdict={result.verdict} />
      ) : (
        <Button onClick={commit} disabled={!filled}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Test case                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * "Find the input that breaks this."
 *
 * Marked `correct` only on an exact match with a known breaking input.
 * Everything else settles as `unknown` rather than `wrong` — a learner may well
 * have proposed a legitimate breaking case the author did not enumerate, and
 * calling that wrong would punish the exact thinking the block is training.
 */
export function TestCaseRenderer({
  block,
  onResult,
  settled,
  result,
}: BlockProps<TestCaseBlock>) {
  const { t } = useLocale();
  const [input, setInput] = useState("");

  function commit() {
    const given = input.trim();
    const known = block.breakingInputs.some((b) => b.trim() === given);
    onResult({ verdict: known ? "correct" : "unknown", answer: given });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      <CodeBlock code={block.code} />

      <label className="flex flex-col gap-2">
        <span className="text-sx-small font-medium text-sx-text-2">
          {t({ kk: "Сенің тексеру мысалың", ru: "Твой тест" })}
        </span>
        <input
          value={input}
          disabled={settled}
          onChange={(e) => setInput(e.target.value)}
          className="sx-code h-12 rounded-sx-md border border-sx-line bg-sx-bg px-4 focus:border-sx-primary focus:outline-none"
        />
      </label>

      {settled && result ? (
        <VerdictBanner
          verdict={result.verdict}
          detail={
            result.verdict === "correct"
              ? undefined
              : t({
                  kk: `Мұғаліммен тексер. Белгілі бұзатын мысалдардың бірі: ${block.breakingInputs[0]}`,
                  ru: `Проверь с учителем. Один из известных ломающих примеров: ${block.breakingInputs[0]}`,
                })
          }
        />
      ) : (
        <Button onClick={commit} disabled={!input.trim()}>
          {t(UI.check)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Explain / reflect                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Explain in your own words.
 *
 * **Never auto-graded.** The programme requires oral or written explanation as
 * an independent check on understanding (PDF p.6), and no string comparison
 * can tell whether a 14-year-old understood something. The answer settles as
 * `unknown` and goes to the teacher. Marking it `correct` automatically would
 * be inventing evidence.
 */
export function ExplainRenderer({
  block,
  onResult,
  settled,
}: BlockProps<ExplainBlock>) {
  const { t } = useLocale();
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <IconSpeech size={18} className="mt-1 shrink-0 text-sx-primary" />
        <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      </div>

      <textarea
        value={text}
        disabled={settled}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={t(UI.explainPrompt)}
        className="w-full resize-y rounded-sx-md border border-sx-line bg-sx-bg p-4 text-sx-body leading-relaxed placeholder:text-sx-text-3 focus:border-sx-primary focus:outline-none"
      />

      {settled ? (
        <Card className="border-sx-line bg-sx-raised">
          <p className="mb-2 flex items-center gap-2 text-sx-small font-semibold text-sx-text-2">
            <IconTarget size={16} />
            {t({
              kk: "Мұғалім нені іздейді",
              ru: "Что смотрит учитель",
            })}
          </p>
          <ul className="flex flex-col gap-1.5">
            {block.expectedPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sx-meta text-sx-text-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-sx-text-3" />
                {t(point)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sx-small text-sx-text-3">
            {t({
              kk: "Бұл жауап автоматты бағаланбайды — оны мұғалім оқиды.",
              ru: "Этот ответ не оценивается автоматически — его читает учитель.",
            })}
          </p>
        </Card>
      ) : (
        <Button
          onClick={() => onResult({ verdict: "unknown", answer: text })}
          disabled={text.trim().length < 10}
        >
          {t(UI.submit)}
        </Button>
      )}
    </div>
  );
}

export function ReflectionRenderer({
  block,
  onResult,
  settled,
}: BlockProps<ReflectionBlock>) {
  const { t } = useLocale();
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>
      <textarea
        value={text}
        disabled={settled}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full resize-y rounded-sx-md border border-sx-line bg-sx-bg p-4 text-sx-body leading-relaxed focus:border-sx-primary focus:outline-none"
      />
      {settled ? (
        <p className="text-sx-small text-sx-text-3">{t(UI.saved)}</p>
      ) : (
        <Button
          variant="secondary"
          onClick={() => onResult({ verdict: "unknown", answer: text })}
          disabled={!text.trim()}
        >
          {t(UI.submit)}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulation placeholder                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Visualisers the programme mandates (step execution, loop trace, binary
 * search, recursion tree, BFS wave, DP table…). Each is real work and each is
 * built with its month.
 *
 * Until then this states plainly which visualiser is missing rather than
 * rendering an empty box that reads as a loading failure.
 */
export function VisualSimulationRenderer({
  block,
  onResult,
  settled,
}: BlockProps<VisualSimulationBlock>) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      <div className="grid place-items-center rounded-sx-lg border border-dashed border-sx-line-strong bg-sx-surface px-6 py-12 text-center">
        <IconEye size={28} className="mb-3 text-sx-text-3" />
        <p className="text-sx-meta font-medium text-sx-text-2">
          {t({
            kk: "Бұл көрнекілік әлі дайын емес",
            ru: "Эта визуализация ещё не готова",
          })}
        </p>
        <p className="sx-code mt-1 text-sx-small text-sx-text-3">{block.simulation}</p>
      </div>

      {!settled ? (
        <Button variant="secondary" onClick={() => onResult({ verdict: "unknown" })}>
          {t(UI.next)}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verify                                                                     */
/* -------------------------------------------------------------------------- */

const VERIFY_LABEL: Record<VerifyBlock["mode"], { kk: string; ru: string }> = {
  unseen_problem: { kk: "Бейтаныс есеп", ru: "Незнакомая задача" },
  manual_trace: { kk: "Қолмен орындау", ru: "Ручная прокрутка" },
  find_bug: { kk: "Қатені табу", ru: "Поиск ошибки" },
  oral_explanation: { kk: "Ауызша түсіндіру", ru: "Устное объяснение" },
  delayed_resolve: { kk: "Уақыт өте қайта шешу", ru: "Повторное решение" },
};

export function VerifyRenderer({ block, onResult, settled }: BlockProps<VerifyBlock>) {
  const { t } = useLocale();
  const [text, setText] = useState("");

  const oral = block.mode === "oral_explanation";

  return (
    <div className="flex flex-col gap-5">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sx-raised px-3 py-1 text-sx-micro font-semibold tracking-wide text-sx-text-2 uppercase">
        <IconTarget size={13} />
        {t(VERIFY_LABEL[block.mode])}
      </span>

      <p className="text-sx-lead font-medium">{t(block.prompt)}</p>

      {oral ? (
        <Card className="bg-sx-raised">
          <p className="text-sx-meta text-sx-text-2">
            {t({
              kk: "Бұл тапсырманы мұғалімге ауызша орындайсың. Платформа оны бағаламайды.",
              ru: "Это задание ты выполняешь устно учителю. Платформа его не оценивает.",
            })}
          </p>
        </Card>
      ) : (
        <textarea
          value={text}
          disabled={settled}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          className="sx-code w-full resize-y rounded-sx-md border border-sx-line bg-sx-bg p-4 focus:border-sx-primary focus:outline-none"
        />
      )}

      {settled ? (
        <p className="text-sx-small text-sx-text-3">{t(UI.saved)}</p>
      ) : (
        <Button onClick={() => onResult({ verdict: "unknown", answer: text })}>
          {oral ? t(UI.read) : t(UI.submit)}
        </Button>
      )}
    </div>
  );
}
