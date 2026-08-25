"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  DiagramPanel,
  ExplanationBlock,
  FractionDiagram,
  PartsBar,
} from "./explanation-block";
import type { FeedbackState } from "./feedback-bar";
import { InteractiveBlock } from "./interactive-block";
import { LessonChrome, OutlineButton, PrimaryButton } from "./lesson-chrome";
import type { LessonScreenData, QuestionFigure } from "./lesson-data";
import { QuestionBlock, type QuestionVerdict } from "./question-block";

const COURSE_MAP_HREF = "/brilliant/courses";

/* -------------------------------------------------------------------------- */
/*  Illustration                                                               */
/* -------------------------------------------------------------------------- */

const COIN_TONES = {
  blue: { top: "#4A5CD6", side: "#3860BE" },
  green: { top: "#5ED981", side: "#29CC57" },
} as const;

type CoinTone = keyof typeof COIN_TONES;

/** The course-map node, drawn large: a lit top face over a cast shadow. */
function Coin({ tone, children }: { tone: CoinTone; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const { top, side } = COIN_TONES[tone];

  return (
    <motion.svg
      viewBox="0 0 200 150"
      aria-hidden="true"
      className="block h-auto w-[168px]"
      initial={reduce ? false : { opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
    >
      <ellipse cx="100" cy="128" rx="70" ry="11" fill="#000000" opacity="0.55" />
      <ellipse cx="100" cy="88" rx="74" ry="30" fill={side} />
      <rect x="26" y="58" width="148" height="30" fill={side} />
      <ellipse cx="100" cy="58" rx="74" ry="30" fill={top} />
      {children}
    </motion.svg>
  );
}

function HalfGlyph() {
  return (
    <g opacity="0.8">
      <path d="M100 48 A22 10 0 0 0 100 68 Z" fill="#141414" />
      <ellipse
        cx="100"
        cy="58"
        rx="22"
        ry="10"
        fill="none"
        stroke="#141414"
        strokeWidth="2.5"
      />
      <line x1="100" y1="48" x2="100" y2="68" stroke="#141414" strokeWidth="2.5" />
    </g>
  );
}

function CheckGlyph() {
  return (
    <path
      d="M86 58 L96 67 L116 48"
      fill="none"
      stroke="#141414"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
  );
}

const BURST_STROKES = 10;

/** One-shot celebration: short strokes flung outwards, then gone. */
function Burst() {
  return (
    <svg
      viewBox="0 0 240 240"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[46px] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2"
    >
      {Array.from({ length: BURST_STROKES }, (_, index) => {
        const angle = (index / BURST_STROKES) * Math.PI * 2 - Math.PI / 2;
        const inner = 52;
        const outer = 84;

        return (
          <motion.line
            key={index}
            x1={120 + Math.cos(angle) * inner}
            y1={120 + Math.sin(angle) * inner * 0.55}
            x2={120 + Math.cos(angle) * outer}
            y2={120 + Math.sin(angle) * outer * 0.55}
            stroke={index % 2 === 0 ? "#5ED981" : "#4A5CD6"}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
            transition={{
              duration: 0.7,
              times: [0, 0.4, 1],
              delay: index * 0.012,
              ease: EASE_OUT_QUINT,
            }}
          />
        );
      })}
    </svg>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] border-2 border-b-dim-2 bg-b-panel px-3 py-4 text-center shadow-[0_4px_0_0_rgba(255,255,255,0.2)]">
      <p className="text-[20px] font-bold leading-tight text-white">{value}</p>
      <p className="b-eyebrow mt-1 text-b-dim">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figures for question screens                                               */
/* -------------------------------------------------------------------------- */

function renderFigure(figure: QuestionFigure): ReactNode {
  if (figure.type === "diagram") {
    return (
      <DiagramPanel>
        <FractionDiagram kind={figure.kind} />
      </DiagramPanel>
    );
  }
  return (
    <PartsBar
      parts={figure.parts}
      shaded={figure.shaded}
      caption={figure.caption}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Lesson                                                                     */
/* -------------------------------------------------------------------------- */

export interface LessonScreenProps {
  screens: LessonScreenData[];
  className?: string;
}

type StringMap = Record<string, string | null>;
type NumberMap = Record<string, number>;
type VerdictMap = Record<string, QuestionVerdict>;
type BoolMap = Record<string, boolean>;

/** Runs the ordered screens inside the lesson chrome. */
export function LessonScreen({ screens, className }: LessonScreenProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<StringMap>({});
  const [attempts, setAttempts] = useState<NumberMap>({});
  const [verdicts, setVerdicts] = useState<VerdictMap>({});
  const [commits, setCommits] = useState<NumberMap>({});
  const [solved, setSolved] = useState<BoolMap>({});

  const screen = screens[index];
  const verdict: QuestionVerdict =
    screen.kind === "question" ? (verdicts[screen.id] ?? null) : null;
  const selectedId = screen.kind === "question" ? (selections[screen.id] ?? null) : null;

  const goNext = () => {
    setDirection(1);
    setIndex((value) => Math.min(value + 1, screens.length - 1));
  };

  const restart = () => {
    setDirection(-1);
    setIndex(0);
    setSelections({});
    setAttempts({});
    setVerdicts({});
    setCommits({});
    setSolved({});
  };

  const close = () => router.push(COURSE_MAP_HREF);

  const actionLabel = (() => {
    switch (screen.kind) {
      case "intro":
        return "Start";
      case "summary":
        return "Finish";
      case "question":
        if (verdict === "correct") return "Next";
        if (verdict === "wrong") return "Try again";
        return "Check";
      default:
        return "Continue";
    }
  })();

  const actionDisabled =
    (screen.kind === "interactive" && !solved[screen.id]) ||
    (screen.kind === "question" && verdict === null && selectedId === null);

  const runAction = () => {
    if (actionDisabled) return;

    switch (screen.kind) {
      case "question": {
        if (verdict === null) {
          setCommits((value) => ({
            ...value,
            [screen.id]: (value[screen.id] ?? 0) + 1,
          }));
        } else if (verdict === "correct") {
          goNext();
        } else {
          setVerdicts((value) => ({ ...value, [screen.id]: null }));
        }
        break;
      }
      case "summary":
        close();
        break;
      default:
        goNext();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (screen.kind === "question" && /^[1-4]$/.test(event.key)) {
        const option = screen.options[Number(event.key) - 1];
        if (option && verdict === null) {
          event.preventDefault();
          setSelections((value) => ({ ...value, [screen.id]: option.id }));
        }
        return;
      }

      if (event.key === "Enter") {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.tagName === "BUTTON" || target.tagName === "A")
        ) {
          return;
        }
        event.preventDefault();
        runAction();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const feedback: FeedbackState | null =
    screen.kind === "question" && verdict !== null
      ? {
          status: verdict,
          message:
            verdict === "correct" ? screen.correctMessage : screen.wrongMessage,
          detail:
            verdict === "correct" || (attempts[screen.id] ?? 0) >= 2
              ? screen.explanation
              : undefined,
        }
      : null;

  const offset = reduce ? 0 : 32;

  return (
    <LessonChrome
      total={screens.length}
      current={index}
      actionLabel={actionLabel}
      actionDisabled={actionDisabled}
      onAction={runAction}
      onClose={close}
      feedback={feedback}
      className={className}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen.id}
          initial={{ opacity: 0, x: direction > 0 ? offset : -offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -offset : offset }}
          transition={{ duration: reduce ? 0 : 0.26, ease: EASE_OUT_QUINT }}
        >
          {screen.kind === "intro" ? (
            <div className="flex flex-col items-center text-center">
              <Coin tone="blue">
                <HalfGlyph />
              </Coin>
              <p className="b-eyebrow mt-8 text-b-dim">{screen.eyebrow}</p>
              <h1 className="mt-3 text-[24px] font-bold leading-[1.15] text-white sm:text-[30px]">
                {screen.title}
              </h1>
              <p className="mt-4 max-w-[520px] text-[16px] leading-6 text-b-dim">
                {screen.description}
              </p>
              <p className="mt-6 text-[14px] leading-5 text-b-dim">{screen.meta}</p>
            </div>
          ) : null}

          {screen.kind === "explanation" ? (
            <ExplanationBlock
              eyebrow={screen.eyebrow}
              title={screen.title}
              paragraphs={screen.paragraphs}
              diagram={screen.diagram}
            />
          ) : null}

          {screen.kind === "interactive" ? (
            <InteractiveBlock
              eyebrow={screen.eyebrow}
              title={screen.title}
              hint={screen.hint}
              solved={solved[screen.id] ?? false}
              onSolved={() =>
                setSolved((value) =>
                  value[screen.id] ? value : { ...value, [screen.id]: true },
                )
              }
            />
          ) : null}

          {screen.kind === "question" ? (
            <div className="flex flex-col items-center">
              {screen.eyebrow ? (
                <p className="b-eyebrow mb-6 text-b-dim">{screen.eyebrow}</p>
              ) : null}
              <QuestionBlock
                prompt={screen.prompt}
                diagram={screen.figure ? renderFigure(screen.figure) : undefined}
                options={screen.options}
                explanation={screen.explanation}
                selectedId={selectedId}
                onSelect={(id) =>
                  setSelections((value) => ({ ...value, [screen.id]: id }))
                }
                verdict={verdict}
                attempts={attempts[screen.id] ?? 0}
                commitSignal={commits[screen.id] ?? 0}
                onResolved={(correct) => {
                  setAttempts((value) => ({
                    ...value,
                    [screen.id]: (value[screen.id] ?? 0) + 1,
                  }));
                  setVerdicts((value) => ({
                    ...value,
                    [screen.id]: correct ? "correct" : "wrong",
                  }));
                }}
                className="w-full"
              />
            </div>
          ) : null}

          {screen.kind === "summary" ? (
            <div className="relative flex flex-col items-center text-center">
              {reduce ? null : <Burst />}
              <Coin tone="green">
                <CheckGlyph />
              </Coin>
              <h1 className="mt-8 text-[24px] font-bold leading-[1.15] text-white sm:text-[30px]">
                {screen.title}
              </h1>
              <p className="mt-4 max-w-[480px] text-[16px] leading-6 text-b-dim">
                {screen.description}
              </p>

              <div className="mt-8 grid w-full grid-cols-3 gap-3">
                {screen.stats.map((stat) => (
                  <StatTile key={stat.label} value={stat.value} label={stat.label} />
                ))}
              </div>

              <div
                className={cn(
                  "mt-8 flex w-full flex-col items-stretch gap-3",
                  "sm:flex-row sm:items-center sm:justify-center",
                )}
              >
                <PrimaryButton onClick={restart}>Next lesson</PrimaryButton>
                <OutlineButton href={COURSE_MAP_HREF}>Back to course map</OutlineButton>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </LessonChrome>
  );
}
