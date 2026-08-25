"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ATTEMPT_BLOCK_TYPES, type Lesson, type Locale } from "@schools/curriculum/types";
import type { SchoolInteraction } from "@schools/learning";
import { BlockRenderer, type BlockResult } from "./blocks";
import { Button, SegmentedProgress } from "./primitives";
import { LocaleProvider, UI, useLocale } from "./i18n";
import { IconArrowLeft, IconCheck, IconClock } from "./icons";

/**
 * The lesson runtime.
 *
 * One block at a time, full attention. Not a scrolling page: a 45-minute
 * session with 14-year-olds does not survive a wall of content, and the
 * programme's own structure is one idea per lesson (PDF p.3).
 *
 * ## What this component does NOT do
 *
 * It records what happened — answered, right or wrong — and hands that to the
 * learning pipeline. It draws no conclusions. Whether a wrong answer means the
 * learner confused `%` with `//`, or was tired, or misread the question, is
 * decided by the Decision Engine from the author's declared diagnostic
 * mappings, and only where a wrong answer uniquely establishes the cause.
 *
 * Interactions are collected in the shape the attempt bridge expects, because
 * `hasAttemptSince` gates the entire hint ladder and does not recognise a
 * lesson answer on its own. See `schools/learning/attempts.ts`.
 */

export interface LessonPlayerProps {
  lesson: Lesson;
  monthTitle: string;
  backHref: string;
  initialLocale?: Locale;
  /** Receives every interaction. Wire to the event ingest route. */
  onInteraction?: (interaction: SchoolInteraction) => void;
}

export function LessonPlayer(props: LessonPlayerProps) {
  return (
    <LocaleProvider initial={props.initialLocale ?? "kk"}>
      <PlayerInner {...props} />
    </LocaleProvider>
  );
}

function PlayerInner({
  lesson,
  monthTitle,
  backHref,
  onInteraction,
}: LessonPlayerProps) {
  const { t, locale, setLocale } = useLocale();

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, BlockResult>>({});

  const block = lesson.blocks[index];
  const settled = block ? block.id in results : false;
  const done = index >= lesson.blocks.length;

  // Only attempt-bearing blocks count toward the visible progress. Counting
  // concept cards would let a learner "progress" by reading, which is exactly
  // the illusion the programme's verification section warns about.
  const taskCount = useMemo(
    () => lesson.blocks.filter((b) => ATTEMPT_BLOCK_TYPES.has(b.type)).length,
    [lesson.blocks],
  );
  const tasksDone = useMemo(
    () =>
      lesson.blocks
        .slice(0, index)
        .filter((b) => ATTEMPT_BLOCK_TYPES.has(b.type)).length,
    [lesson.blocks, index],
  );

  const handleResult = useCallback(
    (result: BlockResult) => {
      if (!block) return;
      setResults((prev) => ({ ...prev, [block.id]: result }));
      onInteraction?.({
        type: "answer_submitted",
        timestamp: Date.now(),
        blockType: block.type,
      });
    },
    [block, onInteraction],
  );

  if (done) {
    return (
      <LessonComplete
        lesson={lesson}
        results={results}
        backHref={backHref}
        taskCount={taskCount}
      />
    );
  }

  return (
    <div className="sx-root flex min-h-dvh flex-col">
      {/* Header. Sticky so the learner never loses the way out or the count. */}
      <header className="sticky top-0 z-20 border-b border-sx-line bg-sx-bg/92 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 py-3">
          <Link
            href={backHref}
            aria-label={t(UI.back)}
            className="grid size-11 shrink-0 place-items-center rounded-sx-md text-sx-text-2 transition-colors hover:bg-sx-raised hover:text-sx-text"
          >
            <IconArrowLeft size={20} />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sx-micro font-semibold tracking-wide text-sx-text-3 uppercase">
              {monthTitle}
            </p>
            <p className="truncate text-sx-meta font-semibold">{t(lesson.title)}</p>
          </div>

          <span className="sx-tabular shrink-0 text-sx-small text-sx-text-2">
            {tasksDone}/{taskCount}
          </span>

          {/* Language switch. Present on every screen: a learner who hits a
              wall in one language must be able to read the other without
              leaving the block. */}
          <div className="flex shrink-0 overflow-hidden rounded-sx-sm border border-sx-line">
            {(["kk", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={cn(
                  "h-8 w-9 cursor-pointer text-sx-micro font-bold uppercase transition-colors",
                  locale === code
                    ? "bg-sx-primary text-white"
                    : "text-sx-text-3 hover:text-sx-text",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-5 pb-3">
          <SegmentedProgress total={lesson.blocks.length} current={index} />
        </div>
      </header>

      {/* Block */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <div key={block.id} className="sx-rise">
          <BlockRenderer
            block={block}
            onResult={handleResult}
            settled={settled}
            result={results[block.id] ?? null}
          />
        </div>
      </main>

      {/* Advance. Separated from the block's own check button so "check" and
          "move on" are never the same tap — a learner must be able to sit with
          a wrong answer before leaving it. */}
      {settled ? (
        <footer className="sticky bottom-0 border-t border-sx-line bg-sx-bg/92 px-5 py-4 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-3xl justify-end">
            <Button onClick={() => setIndex((i) => i + 1)}>
              {index === lesson.blocks.length - 1 ? t(UI.lessonDone) : t(UI.next)}
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LessonComplete({
  lesson,
  results,
  backHref,
  taskCount,
}: {
  lesson: Lesson;
  results: Record<string, BlockResult>;
  backHref: string;
  taskCount: number;
}) {
  const { t } = useLocale();

  const values = Object.values(results);
  const correct = values.filter((r) => r.verdict === "correct").length;
  const unmeasured = values.filter((r) => r.verdict === "unknown").length;

  return (
    <div className="sx-root grid min-h-dvh place-items-center px-5 py-16">
      <div className="sx-rise flex w-full max-w-md flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sx-correct-soft text-sx-correct">
          <IconCheck size={32} />
        </span>

        <h1 className="mt-6 text-sx-h2 font-semibold">{t(UI.lessonDone)}</h1>
        <p className="mt-2 text-sx-meta text-sx-text-2">{t(lesson.title)}</p>

        <dl className="mt-8 flex w-full gap-3">
          <div className="flex-1 rounded-sx-md border border-sx-line bg-sx-surface px-4 py-3">
            <dt className="text-sx-micro tracking-wide text-sx-text-3 uppercase">
              {t(UI.correct)}
            </dt>
            <dd className="sx-tabular mt-1 text-sx-h3 font-semibold text-sx-correct">
              {correct}
              <span className="text-sx-meta text-sx-text-3">/{taskCount}</span>
            </dd>
          </div>

          {/* Shown, never folded away. These are the answers a machine cannot
              grade — explanations, self-authored tests, code with no sandbox
              yet. Hiding them would let the screen imply everything was
              measured. */}
          {unmeasured > 0 ? (
            <div className="flex-1 rounded-sx-md border border-sx-line bg-sx-surface px-4 py-3">
              <dt className="text-sx-micro tracking-wide text-sx-text-3 uppercase">
                {t(UI.notMeasured)}
              </dt>
              <dd className="sx-tabular mt-1 text-sx-h3 font-semibold text-sx-unknown">
                {unmeasured}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-4 flex items-center gap-1.5 text-sx-small text-sx-text-3">
          <IconClock size={14} />
          {lesson.estimatedMinutes} {t(UI.minutes)}
        </p>

        <Link href={backHref} className="mt-8 w-full">
          <Button className="w-full">{t(UI.back)}</Button>
        </Link>
      </div>
    </div>
  );
}
