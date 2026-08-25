"use client";

import {
  Check,
  ChevronDown,
  Code2,
  Download,
  FileText,
  Gauge,
  ListChecks,
  Maximize,
  MessageCircleQuestion,
  Pause,
  Play,
  Subtitles,
  Video,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  LECTURE,
  type LectureItem,
  type LectureItemKind,
  type LectureItemState,
} from "./lxp-data";

/**
 * Elice lecture view: curriculum rail, player, notes. Rendered as a block on
 * /elice/classroom rather than as its own route.
 */

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const KIND_ICON: Record<LectureItemKind, typeof FileText> = {
  doc: FileText,
  video: Video,
  quiz: ListChecks,
  code: Code2,
};

const KIND_LABEL: Record<LectureItemKind, string> = {
  doc: "Reading",
  video: "Video",
  quiz: "Quiz",
  code: "Coding practice",
};

const STATE_LABEL: Record<LectureItemState, string> = {
  done: "Completed",
  current: "In progress",
  todo: "Not started",
};

const TABS = ["Overview", "Transcript", "Q&A", "Materials"] as const;
type Tab = (typeof TABS)[number];

export function LecturePage() {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto mt-12 w-full max-w-[1200px]"
    >
      <h2 id={headingId} className="text-2xl leading-tight font-bold text-e-ink">
        Lecture
      </h2>
      <p className="mt-1 text-[15px] text-e-muted">
        {LECTURE.courseTitle} · Lesson {LECTURE.lessonNumber} of {LECTURE.lessonTotal}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_260px]">
        <CurriculumRail />
        <PlayerPane />
        <SidePane />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function CurriculumRail() {
  const reduce = useReducedMotion();
  const currentSection =
    LECTURE.sections.find((section) =>
      section.items.some((item) => item.state === "current"),
    ) ?? LECTURE.sections[0];
  const [openId, setOpenId] = useState<string | null>(currentSection.id);

  return (
    <aside className="min-w-0 rounded-xl border border-e-line bg-e-white p-5">
      <h3 className="text-[17px] leading-snug font-bold text-e-ink">
        {LECTURE.courseTitle}
      </h3>

      <div className="mt-4 flex items-center gap-4">
        <ProgressRing value={LECTURE.progress} />
        <div>
          <p className="text-[13px] text-e-muted">
            {Math.round((LECTURE.progress / 100) * LECTURE.lessonTotal)} of{" "}
            {LECTURE.lessonTotal} lessons
          </p>
          <p className="text-[13px] text-e-faint">Keep going — 8 left</p>
        </div>
      </div>

      <nav className="mt-5 border-t border-e-line pt-2" aria-label="Course contents">
        <ul className="flex flex-col">
          {LECTURE.sections.map((section) => {
            const open = openId === section.id;
            return (
              <li key={section.id} className="border-b border-e-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : section.id)}
                  aria-expanded={open}
                  aria-controls={`section-${section.id}`}
                  className="flex min-h-[44px] w-full items-center justify-between gap-2 py-2 text-left text-[14px] font-semibold text-e-ink"
                >
                  <span className="min-w-0">{section.title}</span>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT_QUINT }}
                    className="shrink-0 text-e-faint"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={`section-${section.id}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT_QUINT }}
                      className="overflow-hidden"
                    >
                      <ul className="flex flex-col gap-0.5 pb-3">
                        {section.items.map((item) => (
                          <ContentRow key={item.id} item={item} />
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function ContentRow({ item }: { item: LectureItem }) {
  const Icon = KIND_ICON[item.kind];
  const current = item.state === "current";

  return (
    <li>
      <button
        type="button"
        aria-current={current ? "step" : undefined}
        className={cn(
          "flex min-h-[44px] w-full items-center gap-2.5 rounded-r-lg px-2.5 py-2 text-left transition-colors duration-200",
          current
            ? "border-l-2 border-e-violet bg-e-violet-soft"
            : "border-l-2 border-transparent hover:bg-e-grey",
        )}
      >
        <Icon
          className={cn("size-4 shrink-0", current ? "text-e-violet" : "text-e-faint")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[13px] leading-snug",
              current ? "font-semibold text-e-violet" : "text-e-ink",
            )}
          >
            {item.title}
          </span>
          <span className="block text-[12px] text-e-faint">
            {KIND_LABEL[item.kind]} · {item.duration}
          </span>
        </span>
        <StateGlyph state={item.state} />
      </button>
    </li>
  );
}

function StateGlyph({ state }: { state: LectureItemState }) {
  return (
    <span className="shrink-0" title={STATE_LABEL[state]}>
      <span className="sr-only">{STATE_LABEL[state]}</span>
      {state === "done" ? (
        <span
          className="grid size-4 place-items-center rounded-full bg-[#0FA968]"
          aria-hidden="true"
        >
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </span>
      ) : state === "current" ? (
        <span className="block size-2.5 rounded-full bg-e-violet" aria-hidden="true" />
      ) : (
        <span
          className="block size-3.5 rounded-full border border-e-line"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function ProgressRing({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  return (
    <span className="relative grid size-[76px] shrink-0 place-items-center">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="#EEF0F4"
          strokeWidth="7"
        />
        <motion.circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="#6C4FE0"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - value / 100) }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1, ease: EASE_OUT_QUINT }}
          style={
            reduce ? { strokeDashoffset: circumference * (1 - value / 100) } : undefined
          }
        />
      </svg>
      <span className="absolute text-[15px] font-bold text-e-ink">{value}%</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */

function PlayerPane() {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");
  const tabsId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let next = -1;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next < 0) return;
    event.preventDefault();
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="min-w-0">
      {/* Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-e-dark">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(120% 90% at 50% 0%, rgba(108,79,224,0.55) 0%, rgba(42,42,42,0) 70%)",
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? "Pause lesson video" : "Play lesson video"}
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur-[2px] transition-colors duration-200 hover:bg-white/25">
            {playing ? (
              <Pause className="size-6 fill-white text-white" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 size-6 fill-white text-white" aria-hidden="true" />
            )}
          </span>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-white/25"
            role="progressbar"
            aria-label="Video position"
            aria-valuenow={LECTURE.played}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-e-violet"
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${LECTURE.played}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
              style={reduce ? { width: `${LECTURE.played}%` } : undefined}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] text-white/80">
              {LECTURE.elapsed} / {LECTURE.total}
            </span>
            <div className="flex items-center gap-1">
              <PlayerGlyph label="Playback speed">
                <Gauge className="size-4" aria-hidden="true" />
              </PlayerGlyph>
              <PlayerGlyph label="Captions">
                <Subtitles className="size-4" aria-hidden="true" />
              </PlayerGlyph>
              <PlayerGlyph label="Full screen">
                <Maximize className="size-4" aria-hidden="true" />
              </PlayerGlyph>
            </div>
          </div>
        </div>
      </div>

      <h3 className="mt-5 text-[22px] leading-snug font-bold text-e-ink">
        {LECTURE.lessonTitle}
      </h3>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Lesson content"
        className="mt-4 flex gap-1 border-b border-e-line"
      >
        {TABS.map((item, index) => {
          const selected = tab === item;
          return (
            <button
              key={item}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${tabsId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(item)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={cn(
                "relative flex min-h-[44px] items-center px-3 text-[14px] font-semibold transition-colors duration-200",
                selected ? "text-e-violet" : "text-e-muted hover:text-e-ink",
              )}
            >
              {item}
              {selected ? (
                <motion.span
                  layoutId={`${tabsId}-underline`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-e-violet"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.9 }
                  }
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-tab-${TABS.indexOf(tab)}`}
        className="mt-5 min-h-[220px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT_QUINT }}
          >
            <TabBody tab={tab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlayerGlyph({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-11 place-items-center rounded-lg text-white/80 transition-colors duration-200 hover:bg-white/15 hover:text-white"
    >
      {children}
    </button>
  );
}

function TabBody({ tab }: { tab: Tab }) {
  if (tab === "Overview") {
    return (
      <div>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-e-muted">
          {LECTURE.overview}
        </p>
        <h4 className="mt-5 text-[13px] font-bold tracking-[0.04em] text-e-faint uppercase">
          In this lesson
        </h4>
        <ul className="mt-2 flex flex-col gap-2">
          {LECTURE.objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2.5">
              <span
                className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-e-violet-soft"
                aria-hidden="true"
              >
                <Check className="size-2.5 text-e-violet" strokeWidth={3} />
              </span>
              <span className="text-[15px] leading-[1.6] text-e-muted">{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "Transcript") {
    return (
      <ul className="flex flex-col gap-3">
        {LECTURE.transcript.map((line) => (
          <li key={line.time} className="flex gap-4">
            <span className="w-12 shrink-0 pt-0.5 font-mono text-[12px] text-e-violet">
              {line.time}
            </span>
            <span className="max-w-[58ch] text-[15px] leading-[1.6] text-e-muted">
              {line.text}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "Q&A") {
    return (
      <ul className="flex flex-col gap-3">
        {LECTURE.questions.map((thread) => (
          <li
            key={thread.id}
            className="rounded-xl border border-e-line bg-e-white p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-e-violet-soft text-[11px] font-bold text-e-violet">
                {thread.author.slice(0, 1)}
              </span>
              <span className="text-[13px] font-semibold text-e-ink">{thread.author}</span>
              <span className="text-[13px] text-e-faint">{thread.asked}</span>
            </div>
            <p className="mt-2 text-[15px] leading-[1.6] font-semibold text-e-ink">
              {thread.question}
            </p>
            <p className="mt-1 max-w-[58ch] text-[15px] leading-[1.6] text-e-muted">
              {thread.answer}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-e-faint">
              <MessageCircleQuestion className="size-3.5" aria-hidden="true" />
              {thread.replies} replies
            </p>
          </li>
        ))}
      </ul>
    );
  }

  return <MaterialList />;
}

/* -------------------------------------------------------------------------- */

function SidePane() {
  return (
    <aside className="flex min-w-0 flex-col gap-5 lg:col-span-2 xl:col-span-1">
      <NotesCard />
      <section className="rounded-xl border border-e-line bg-e-white p-5">
        <h3 className="text-[17px] font-bold text-e-ink">Related materials</h3>
        <div className="mt-3">
          <MaterialList />
        </div>
      </section>
    </aside>
  );
}

function NotesCard() {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldId = useId();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const save = () => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2400);
  };

  return (
    <section className="rounded-xl border border-e-line bg-e-white p-5">
      <h3 className="text-[17px] font-bold text-e-ink">Notes</h3>
      <label htmlFor={fieldId} className="mt-1 block text-[13px] text-e-muted">
        Only you can see these.
      </label>
      <textarea
        id={fieldId}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={5}
        placeholder="Write what you want to remember…"
        className="mt-3 w-full resize-y rounded-lg border border-e-line bg-e-grey p-3 text-[14px] leading-[1.6] text-e-ink outline-none transition-colors duration-200 placeholder:text-e-faint focus:border-e-violet focus:bg-e-white"
      />
      <button
        type="button"
        onClick={save}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-e-black px-5 text-[15px] font-semibold text-e-white transition-colors duration-200 hover:bg-e-dark"
      >
        Save note
      </button>
      <p aria-live="polite" className="mt-2 min-h-[18px] text-[13px] text-[#0FA968]">
        {saved ? "Note saved." : ""}
      </p>
    </section>
  );
}

function MaterialList() {
  return (
    <ul className="flex flex-col gap-1.5">
      {LECTURE.materials.map((material) => (
        <li key={material.id}>
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-e-grey"
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-e-violet-soft text-e-violet"
              aria-hidden="true"
            >
              <FileText className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-e-ink">
                {material.title}
              </span>
              <span className="block text-[12px] text-e-faint">{material.meta}</span>
            </span>
            <Download className="size-4 shrink-0 text-e-faint" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
