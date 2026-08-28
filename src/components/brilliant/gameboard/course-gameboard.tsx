"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GameboardPedestal } from "./gameboard-pedestal";
import {
  COURSE,
  CURRENT_LEVEL,
  LEVELS,
  type GameboardCourse,
  type GameboardLevel,
  type GameboardNode,
} from "./course-data";

/**
 * `brilliant.org/courses/<slug>/` — the course gameboard.
 *
 * Structure, all measured at a 1470 viewport:
 *
 * - The page does **not** scroll the document. A `position: fixed` container
 *   sits below the 65px header (`top: 65px`, `overflow: hidden auto`) and owns
 *   the scrolling; `document.scrollHeight` stays at the viewport height while
 *   the container's own `scrollHeight` was 11573.
 * - Inside it, `justify-content: center; gap: 32px; padding: 20px 112px 0`.
 * - Left: a 487px course card, `position: sticky; top: 41px`.
 * - Right: a 488px column of nine `<section>`s, one per level.
 * - Each level header is its own `position: sticky; top: 41px` element, so the
 *   browser does the pin/unpin hand-off per section rather than one shared bar.
 *
 * INTERACTION MODEL: click to select. Verified against the live page — hovering
 * a node changes nothing, scrolling changes nothing, and a real click swaps the
 * node's static SVG for a Rive canvas, rings it purple and rewrites the sticky
 * footer card to that lesson with a "Jump here" CTA. With nothing selected the
 * card offers the learner's current lesson with "Start".
 */

/* The header's purple/grey slab is a sibling rectangle offset behind the
   button, not a border: 460x72 at top:-2px, translated -230px on x. */
const HEADER_SHADOW_ACTIVE = "#7139CC";
const HEADER_SHADOW_IDLE = "#4C4C4C";

export interface CourseGameboardProps {
  /**
   * Course summary for the sticky left card. Defaults to the reference route's
   * own const so /brilliant/app/course keeps rendering unchanged.
   */
  course?: GameboardCourse;
  levels?: GameboardLevel[];
  currentLevel?: number;
  /** Visible copy. Defaults to the reference route's English literals. */
  labels?: {
    level: string;
    start: string;
    jumpHere: string;
    /** Screen-reader name for the scroll-to-top control. */
    scrollTop?: string;
  };
  /**
   * Even vertical rhythm instead of the reference's negative-margin collapse.
   *
   * The reference pins each level header and then pulls the node stack up
   * underneath it with `-mt-30` / `-mt-50` against a `mb-50` header. Those
   * numbers were measured against ITS rows, which are ~230px tall because a
   * Rive pedestal is much taller than our static one. Against a 134px row the
   * same numbers land differently in each section: 80px of air after the first
   * header and zero after every other, so the board reads as both sparse and
   * arbitrary.
   *
   * Off by default, so /brilliant/app/course keeps the measured geometry.
   */
  evenRhythm?: boolean;
  /** Nova on the active node instead of Brilliant's Rive Koji. */
  ownMascot?: boolean;
  /**
   * Rendered at the top of the node column, above the first level.
   *
   * A slot rather than a concrete component because this file is shared with
   * the measurement baseline at /brilliant/app/course, which must keep
   * rendering exactly as measured. It also has to be INSIDE this component:
   * the scroller is `position: fixed`, so anything a caller renders next to
   * `<CourseGameboard>` is painted underneath it rather than above the board.
   */
  beforeBoard?: ReactNode;
}

export function CourseGameboard({
  course = COURSE,
  levels = LEVELS,
  currentLevel = CURRENT_LEVEL,
  labels = { level: "Level", start: "Start", jumpHere: "Jump here", scrollTop: "Scroll to top" },
  evenRhythm = false,
  ownMascot = false,
  beforeBoard = null,
}: CourseGameboardProps = {}) {
  const [selected, setSelected] = useState<GameboardNode | null>(null);
  const [showTop, setShowTop] = useState(false);
  const [nodeOnScreen, setNodeOnScreen] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (el) setShowTop(el.scrollTop > 400);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const activeNode =
    levels.flatMap((l) => l.nodes).find((n) => n.active) ?? null;
  const footerNode = selected ?? activeNode;
  const isJump = Boolean(selected);

  /* The original hides the CTA while its own node is on screen and slides it
     back up once you scroll away from it. */
  useEffect(() => {
    const root = scroller.current;
    if (!root || !footerNode) return;
    /* The value sits inside quotes, so it must NOT be CSS.escape'd — escaping
       a space there yields `"Writing\ Programs"`, which matches nothing. */
    const el = root.querySelector<HTMLElement>(
      `[data-node="${footerNode.title.replace(/"/g, '\\"')}"]`,
    );
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNodeOnScreen(entry.isIntersecting),
      { root, threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [footerNode]);

  return (
    <div
      ref={scroller}
      /* `min-w-0` on the board below: the reference pins it at 364px, which
         with the container's own padding overflows a 375px phone and gives the
         whole page a horizontal scrollbar. */
      className="fixed inset-x-0 top-[65px] bottom-0 flex justify-start gap-8 overflow-x-hidden overflow-y-auto px-3 pt-5 sm:px-6 xl:justify-center xl:px-28"
    >
      {/* ---- left: course summary, sticky ---------------------------- */}
      <aside className="sticky top-[41px] my-5 hidden h-fit w-full min-w-[350px] max-w-[487px] flex-[1_1_350px] lg:block">
        <div className="flex flex-col items-start gap-4 rounded-[20px] sx-card border-2 border-b-fg/20 p-8">
          <Image
            src={course.art}
            alt=""
            width={197}
            height={154}
            className="h-[154px] w-[197px] object-contain"
          />
          <div className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-4">
              <h1 className="text-[24px] leading-[30px] font-bold">{course.title}</h1>
              <p className="text-b-fg/60">{course.blurb}</p>
            </div>
            <div className="flex items-center gap-4 text-[14px] leading-[21px]">
              <span className="flex items-center gap-2 text-b-fg/60">
                <LessonsIcon />
                {course.lessons}
              </span>
              <span className="flex items-center gap-2 text-b-fg/60">
                <ExercisesIcon />
                {course.exercises}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---- right: the board ---------------------------------------- */}
      <div className="relative z-[1] mt-5 w-full max-w-[488px] min-w-0 flex-[2_1_364px] sm:min-w-[364px]">
        <div className={cn("flex flex-col items-center", evenRhythm ? "gap-14" : "gap-[30px]")}>
          {beforeBoard}

          {levels.map((level, li) => (
            <section key={level.index} className="w-full">
              <LevelHeader
                index={level.index}
                title={level.title}
                current={level.index === currentLevel}
                levelLabel={labels.level}
                bottomGap={evenRhythm ? "mb-10" : "mb-50"}
              />

              <div
                className={cn(
                  "flex flex-col items-center gap-[30px]",
                  evenRhythm ? "" : "mb-15",
                  evenRhythm ? "" : li === 0 ? "-mt-30" : "-mt-50",
                )}
              >
                {level.nodes.map((node: GameboardNode) => (
                  <NodeRow
                    key={`${level.index}-${node.title}`}
                    node={node}
                    wide={evenRhythm}
                    ownMascot={ownMascot}
                    selected={selected?.title === node.title}
                    onSelect={() =>
                      setSelected((cur) => (cur?.title === node.title ? null : node))
                    }
                  />
                ))}
              </div>
            </section>
          ))}

          {/* sticky CTA — 40px off the bottom, above everything */}
          {footerNode && (
            <FooterCard
              node={footerNode}
              jump={isJump}
              hidden={nodeOnScreen}
              startLabel={labels.start}
              jumpLabel={labels.jumpHere}
            />
          )}
        </div>
      </div>

      <ScrollTopButton
        show={showTop}
        label={labels.scrollTop}
        onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
}

/**
 * The zig-zag is not an offset table: the original gives every row a fixed
 * 392px width and flips `justify-content` between center / flex-start /
 * flex-end. Reproduced as-is so the path keeps its shape at any width.
 */
function NodeRow({
  node,
  selected,
  wide,
  ownMascot,
  onSelect,
}: {
  node: GameboardNode;
  selected: boolean;
  /** Russian and Kazakh lesson names do not fit the reference's 274px row. */
  wide?: boolean;
  ownMascot?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      data-node={node.title}
      className="relative flex w-full max-w-[392px]"
      style={{ justifyContent: node.side }}
    >
      <button
        type="button"
        onClick={node.locked ? undefined : onSelect}
        disabled={node.locked}
        aria-pressed={selected}
        aria-disabled={node.locked || undefined}
        className={cn(
          "group flex items-end gap-2 text-left",
          wide ? "w-[320px]" : "w-[274px]",
          node.locked ? "cursor-default" : "cursor-pointer",
        )}
      >
        <GameboardPedestal
          animated={!node.locked && (Boolean(node.active) || selected)}
          selected={selected}
          active={node.active}
          review={node.review}
          ownMascot={ownMascot}
          /* A node is "locked" here because the lesson is not authored yet, not
             because the learner has to earn it. So it is dimmed rather than
             padlocked: a padlock promises a key. */
          className={cn(ownMascot && node.locked && "opacity-35")}
        />
        {/* The label column was 138px, measured against short English titles.
            Kazakh lesson names run materially longer, so it grows rather than
            clipping — the zig-zag rhythm comes from the row's justify-content,
            not from this width. */}
        <span className="flex min-w-[138px] flex-1 items-center pb-[29.5px]">
          <span
            className={cn(
              "transition-colors",
              node.locked
                ? "text-b-fg/25"
                : node.done
                  ? "text-b-fg/70"
                  : node.active || selected
                    ? "text-b-fg"
                    : "text-b-fg/40",
            )}
          >
            {node.title}
          </span>
          {node.done ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="ml-2 shrink-0 text-b-green"
            >
              <rect width="24" height="24" rx="12" fill="currentColor" />
              <path
                d="M7 12.5l3.2 3.2L17 9"
                stroke="#141414"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      </button>
    </div>
  );
}

/**
 * Level header. The coloured slab behind it is a separate 460x72 rectangle at
 * `top:-2px` translated -230px on x — an offset block, not a border, which is
 * why the outline reads thicker on the right than the left.
 */
function LevelHeader({
  index,
  title,
  current,
  levelLabel = "Level",
  bottomGap = "mb-50",
}: {
  index: number;
  title: string;
  current: boolean;
  levelLabel?: string;
  bottomGap?: string;
}) {
  return (
    <div className={cn("sticky top-[41px] z-[1] h-16 bg-sx-page px-4", bottomGap)}>
      <div className="relative">
        <button
          type="button"
          aria-label={`view details for level ${index}, ${title}`}
          className="relative z-[1] flex h-16 w-full items-center justify-center rounded-[18px] bg-b-bg text-center"
        >
          <h3 className="flex flex-col gap-1">
            <span
              className="b-eyebrow leading-[13.2px]"
              style={{ color: current ? HEADER_SHADOW_ACTIVE : "rgba(255,255,255,0.6)" }}
            >
              {levelLabel} {index}
            </span>
            <span className="leading-[22.4px]">{title}</span>
          </h3>
        </button>
        <div
          aria-hidden="true"
          className="absolute -top-0.5 -bottom-1.5 left-0 right-0 z-0 rounded-[20px] transition-colors"
          style={{ backgroundColor: current ? HEADER_SHADOW_ACTIVE : HEADER_SHADOW_IDLE }}
        />
      </div>
    </div>
  );
}

/**
 * The bottom CTA. It is `position: sticky; bottom: 40px` inside the scroller —
 * not fixed — and carries a large `#9D62FF` blob at 40% behind it for the
 * purple ambience. Radius 40px, `#1E1E1E` on a 2px `#4C4C4C` border.
 */
function FooterCard({
  node,
  jump,
  hidden,
  startLabel = "Start",
  jumpLabel = "Jump here",
}: {
  startLabel?: string;
  jumpLabel?: string;
  node: GameboardNode;
  jump: boolean;
  hidden: boolean;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-10 z-10 mt-15 w-full max-w-[456px] transition-all duration-300 ease-out",
        hidden ? "pointer-events-none translate-y-[100px] opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 h-[386px] w-[803px] -translate-x-1/2 rounded-full opacity-40 blur-3xl transition-opacity duration-300 ease-in-out"
          style={{ backgroundColor: "var(--color-b-purple)" }}
        />
        <div className="relative z-[1] flex flex-col gap-4 rounded-[40px] border-2 border-b-edge bg-b-elevated px-4 pt-6 pb-4">
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <h3 className="text-[24px] leading-[44px] font-bold">{node.title}</h3>
            <Link
              href={node.href ?? COURSE.activeHref}
              role="link"
              data-slot="button3d"
              className="group relative flex w-full rounded-[56px]"
            >
              <span
                data-slot="button3d-face"
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-[60px] px-6 py-[14px]",
                  "leading-5 font-medium text-b-fg",
                  "bg-b-purple shadow-[0_4px_0_0_var(--color-b-purple-2)]",
                  "-translate-y-1 transition-[transform,box-shadow] duration-100 ease-out",
                  "group-active:translate-y-0 group-active:shadow-[0_0_0_0_var(--color-b-purple-2)]",
                )}
              >
                {jump ? jumpLabel : startLabel}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollTopButton({
  show,
  onClick,
  label = "Scroll to top",
}: {
  show: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "fixed bottom-10 left-1/2 z-20 flex h-12 w-12 -translate-x-[420px] items-center justify-center",
        "rounded-full sx-card border-2 border-b-edge transition-opacity duration-300",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.89614 8.94751L0.474304 7.52568L8 -1.55877e-05L15.5257 7.52568L14.1039 8.94751L9.00541 3.84905L9.00541 16L6.99464 16L6.99463 3.84902L1.89614 8.94751Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

function LessonsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="8" rx="9" ry="4" stroke="currentColor" strokeWidth="2" />
      <path d="M3 8v4c0 2.2 4 4 9 4s9-1.8 9-4V8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ExercisesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l2.2 4.6L19 9l-3.5 3.3.9 4.9L12 15l-4.4 2.2.9-4.9L5 9l4.8-1.4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
