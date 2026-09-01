"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { monthThemeVars, type MonthTheme } from "@schools/presentation/month-theme";
import { MonthBadge } from "./month-glyph";
import { GameboardPedestal } from "./gameboard-pedestal";
import { SxMilestone } from "./sx-milestone";
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

/*
 * The header's slab is a sibling rectangle offset behind the button, not a
 * border: 460x72 at top:-2px, translated -230px on x.
 *
 * Its two colours used to be the literals `#7139CC` and `#4C4C4C`. Both are
 * dark-arm values from a reference that is pinned to dark, and this product is
 * not — so on a light page the idle slab was a heavy charcoal bar behind a
 * white button. They are now the month's own accent and the theme's edge token,
 * whose dark arm IS `#4c4c4c`, so `/brilliant/*` renders byte-identically and
 * the light theme stops shouting.
 *
 * `var(--sx-month-accent, #7139CC)`: the fallback is the reference's literal,
 * not the product purple, because an unthemed board must still be the board
 * that was measured.
 */
const HEADER_SLAB_CURRENT = "var(--sx-month-accent, #7139CC)";
const HEADER_SLAB_IDLE = "var(--color-b-edge)";

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
    /** Screen-reader name for the completion mark on a finished node. */
    done?: string;
  };
  /**
   * Render the product's own milestone — our pedestal artwork and Nova —
   * instead of the reference's Brilliant SVG and its Rive Koji.
   *
   * This is the only switch left. There used to be a second one, `evenRhythm`,
   * which replaced the reference's negative-margin collapse with a flat
   * `gap-14` on the product route. It was added on the belief that the
   * reference's rows are "~230px tall because a Rive pedestal is much taller
   * than our static one", so its margins could not apply to us.
   *
   * That belief was wrong. Re-measured on the live page, every row in every
   * level of the reference is exactly 134px — the same as ours — and the
   * collapse is `mb-50` / `-mt-30` on the first section and `-mt-50` after,
   * with `mb-15` closing each stack and a 45px lead-in on the first row. Those
   * numbers were always directly applicable, and running a second rhythm system
   * on the product route was the single largest fidelity break on the board.
   */
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
  /**
   * Rendered in the left column, under the course card.
   *
   * The reference has nothing above its first level header, so anything the
   * product adds there (the track switch) reads immediately as "not the same
   * layout" — it occupies the top of the board column and pushes every level
   * down. The left column is where course-level meta belongs, and it is
   * already sticky. Below `lg` the aside is hidden, so a caller should also
   * pass the control through `beforeBoard` for narrow screens.
   */
  asideExtra?: ReactNode;
  /**
   * The month this board belongs to.
   *
   * Omitted on `/brilliant/app/course`, which is a course and not a month. When
   * it is omitted NOTHING here changes colour: every accented surface reads
   * `var(--sx-month-accent, <the literal it used to be>)`, and the variable is
   * only defined when a theme arrives.
   */
  theme?: MonthTheme;
  /**
   * The month's name, already in the reader's language.
   *
   * A resolved string rather than the theme's `Localized`, because this file is
   * shared with the reference baseline and has no locale — the same reason
   * `labels` is a bag of plain strings.
   */
  monthLabel?: string;
}

export function CourseGameboard({
  course = COURSE,
  levels = LEVELS,
  currentLevel = CURRENT_LEVEL,
  labels = { level: "Level", start: "Start", jumpHere: "Jump here", scrollTop: "Scroll to top" },
  ownMascot = false,
  beforeBoard = null,
  asideExtra = null,
  theme,
  monthLabel,
}: CourseGameboardProps = {}) {
  const [selected, setSelected] = useState<GameboardNode | null>(null);
  const [showTop, setShowTop] = useState(false);
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

  /**
   * Selecting a node centres it, the way the reference does.
   *
   * Its own handler calls `scrollIntoView({block:'center'})` and skips the
   * scroll when the node is already within 140px of the viewport's centre, so
   * tapping something you are already looking at does not jerk the board. Both
   * halves are reproduced — the bail matters more than the scroll, because
   * without it every tap on a centred node produces a pointless twitch.
   */
  /* Not wrapped in `useCallback` — the React Compiler memoizes it, and a manual
     dependency list here only fights the inference. */
  const select = (node: GameboardNode) => {
    setSelected((cur) => (cur?.title === node.title ? null : node));

    const root = scroller.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(
      `[data-node="${node.title.replace(/"/g, '\\"')}"]`,
    );
    if (!el) return;

    const rootBox = root.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const offset = box.top + box.height / 2 - (rootBox.top + rootBox.height / 2);
    if (Math.abs(offset) <= 140) return;
    root.scrollTo({ top: root.scrollTop + offset, behavior: "smooth" });
  };

  /*
   * The card is ALWAYS on screen. Verified against the live reference at 1440
   * with nothing selected and scrollTop 0: its "Filtering Images / Start" card
   * sits at the bottom while that very node is visible at the top.
   *
   * Two earlier readings were both wrong. The first hid it whenever its node
   * was visible, so tapping a milestone produced no "Jump here" at all. The
   * second kept that rule for the default card, which still left the board
   * with no call to action on load — the single most prominent thing in the
   * reference's composition simply missing. The reference's own visibility
   * observer (`-150px 0px -100px 0px`, threshold .5) drives its
   * jump-back-to-current button, not this card.
   */

  return (
    <div
      ref={scroller}
      /* `min-w-0` on the board below: the reference pins it at 364px, which
         with the container's own padding overflows a 375px phone and gives the
         whole page a horizontal scrollbar. */
      /*
        The month's identity, scoped to this board and nowhere else.

        Five custom properties on one element rather than nine `--color-*`
        entries in the global `@theme` block: only month surfaces may use these,
        and a token in `@theme` is a token every surface can reach for. It is
        the same call `tiers.ts` makes about the ten league hues.
      */
      style={theme ? (monthThemeVars(theme) as CSSProperties) : undefined}
      className="fixed inset-x-0 top-[65px] bottom-0 flex justify-start gap-8 overflow-x-hidden overflow-y-auto px-3 pt-5 sm:px-6 xl:justify-center xl:px-28"
    >
      {/*
        The scrim.

        A 64px fixed gradient pinned to the top of the scroller, from the page
        colour to transparent. It is the reference's first child and it is not
        decoration: the level headers are `position: sticky`, so without it a
        node scrolls out from under a pinned header with a hard edge. With it,
        rows dissolve into the page as they pass behind. Its absence was the
        most visible missing piece of the board's scroll behaviour.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[65px] z-[2] h-16"
        style={{
          background:
            "linear-gradient(180deg, var(--color-sx-page) 0%, color-mix(in oklab, var(--color-sx-page) 85%, transparent) 40%, transparent 100%)",
        }}
      />
      {/* ---- left: course summary, sticky ---------------------------- */}
      <aside className="sticky top-[41px] my-5 hidden h-fit w-full min-w-[350px] max-w-[487px] flex-[1_1_350px] flex-col gap-4 lg:flex">
        <div className="flex flex-col items-start gap-4 rounded-[20px] sx-card border-2 border-b-fg/20 p-8">
          {theme && monthLabel ? <MonthBadge theme={theme} label={monthLabel} /> : null}
          <Image
            src={course.art}
            alt=""
            width={100}
            height={100}
            /* 100x100, measured off the live card at 1440. The previous
               197x154 made the illustration half again too big, which pushed
               the whole left card taller than the reference's and threw the
               two columns out of balance on first sight. */
            className="h-[100px] w-[100px] object-contain"
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
        {asideExtra}
      </aside>

      {/* ---- right: the board ---------------------------------------- */}
      <div className="relative z-[1] mt-5 w-full max-w-[488px] min-w-0 flex-[2_1_364px] sm:min-w-[364px]">
        {/* Section gap is 30px, same as the gap between rows. */}
        <div className="flex flex-col items-center gap-[30px]">
          {/* The aside is `hidden lg:flex`, so on a phone the badge above is
              off-screen and the month would be identified by artwork alone.
              One instance is visible at any width. */}
          {theme && monthLabel ? (
            <MonthBadge theme={theme} label={monthLabel} className="self-start lg:hidden" />
          ) : null}
          {beforeBoard}

          {levels.map((level, li) => (
            <section key={level.index} className="w-full">
              <LevelHeader
                index={level.index}
                title={level.title}
                current={level.index === currentLevel}
                levelLabel={labels.level}
              />

              {/*
                The collapse, measured on the live reference:

                  header  margin-bottom  200px      (mb-50)
                  stack   margin-top     -120px     first section   (-mt-30)
                                         -200px     every other     (-mt-50)
                  stack   margin-bottom  60px       (mb-15)
                  rows    gap            30px
                  row 0   margin-top     45px

                The two margins are adjacent siblings, so they sum rather than
                collapse to the larger: 200 − 120 leaves 80px of air under the
                first header and 200 − 200 leaves none under the rest. That
                asymmetry is deliberate in the reference — the first header
                never pins, every later one does — and it is why a single even
                gap reads wrong no matter which value you pick for it.
              */}
              <div
                className={cn(
                  "mb-15 flex flex-col items-center gap-[30px]",
                  li === 0 ? "-mt-30" : "-mt-50",
                )}
              >
                {level.nodes.map((node: GameboardNode, ni) => (
                  <div key={`${level.index}-${node.title}`} className={cn("flex w-full justify-center", ni === 0 && "mt-[45px]")}>
                    {ownMascot ? (
                      <SxMilestone
                        node={node}
                        selected={selected?.title === node.title}
                        arrivalKey={activeNode?.title}
                        labels={{ done: labels.done ?? "Done" }}
                        onSelect={() => select(node)}
                      />
                    ) : (
                      <NodeRow
                        node={node}
                        selected={selected?.title === node.title}
                        onSelect={() => select(node)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* sticky CTA — 40px off the bottom, above everything */}
          {footerNode && (
            <FooterCard
              node={footerNode}
              jump={isJump}
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
  onSelect,
}: {
  node: GameboardNode;
  selected: boolean;
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
          "group flex w-[274px] items-end gap-2 text-left",
          node.locked ? "cursor-default" : "cursor-pointer",
        )}
      >
        <GameboardPedestal
          animated={!node.locked && (Boolean(node.active) || selected)}
          selected={selected}
          active={node.active}
          review={node.review}
        />
        {/* Fixed 138x55 with a 3-line clamp, exactly as measured. */}
        <span data-label className="flex h-[55px] w-[138px] items-center pb-[29.5px]">
          <span
            className={cn(
              "line-clamp-3",
              selected || node.active ? "text-b-fg" : "text-b-fg/40",
            )}
          >
            {node.title}
          </span>
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
}: {
  index: number;
  title: string;
  current: boolean;
  levelLabel?: string;
}) {
  return (
    <div className="sticky top-[41px] z-[1] mb-50 h-16 bg-sx-page px-4">
      {/*
        `group` so the button's own press can drive the slab behind it. The
        reference does this with a sibling selector — `[&:active + [data-slot=
        level-header-shadow]]` — which is the same idea expressed in Panda.
      */}
      <div className="group relative">
        <button
          type="button"
          aria-label={`${levelLabel} ${index}, ${title}`}
          /*
            The press is the reference's, measured: the button drops 4px while
            the slab behind it shrinks from 72px to 68px and moves its top edge
            from -2px to +2px, so the purple lip is swallowed and the header
            reads as pushed into the page. It snaps — there is no transition on
            any of it in the reference's stylesheet, and adding one here would
            turn a crisp press into a mushy one.
          */
          className="relative z-[1] flex h-16 w-full items-center justify-center rounded-[18px] bg-b-bg text-center active:translate-y-1"
        >
          <h3 className="flex flex-col gap-1">
            <span
              className="b-eyebrow leading-[13.2px]"
              /*
                `rgba(255,255,255,0.6)` was WHITE TEXT ON A WHITE PAGE in the
                light theme — the eyebrow of every non-current level header was
                simply not there. `--color-b-text-2` is that exact value on its
                dark arm and a readable near-black on its light one.
              */
              style={{ color: current ? HEADER_SLAB_CURRENT : "var(--color-b-text-2)" }}
            >
              {levelLabel} {index}
            </span>
            {/* body.base at medium weight, 1.4 line-height — 16px / 22.4px. */}
            <span className="font-medium leading-[22.4px]">{title}</span>
          </h3>
        </button>
        {/*
          The slab is a sibling rectangle behind the button, not a border.

          Measured live: 460x72 against a 456x64 button — 2px proud on the top
          and BOTH sides, 6px proud at the bottom, radius 20px against the
          button's 18px. The previous implementation used `left-0 right-0`,
          making it 456 wide, on the reading that the reference's
          `translateX(-230px)` made it asymmetric. It does not: the transform
          cancels against an equal and opposite `inset`, and the live box is
          symmetric.
        */}
        <div
          aria-hidden="true"
          className="absolute -inset-x-0.5 -top-0.5 -bottom-1.5 z-0 rounded-[20px] group-active:top-0.5"
          style={{ backgroundColor: current ? HEADER_SLAB_CURRENT : HEADER_SLAB_IDLE }}
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
  startLabel = "Start",
  jumpLabel = "Jump here",
}: {
  startLabel?: string;
  jumpLabel?: string;
  node: GameboardNode;
  jump: boolean;
}) {
  return (
    <div
      className="sticky bottom-10 z-10 mt-15 w-full max-w-[456px] transition-all duration-300 ease-out"
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 h-[386px] w-[803px] -translate-x-1/2 rounded-full opacity-40 blur-3xl transition-opacity duration-300 ease-in-out"
          /* The board's one large ambience wash, and the largest single piece
             of month identity on the screen. Restrained on purpose: 40%
             opacity behind a blur, so the month is a temperature rather than a
             colour field. The CTA itself stays `b-purple` — that is the
             product's action colour and it must mean "act" in every month. */
          style={{ backgroundColor: "var(--sx-month-accent, var(--color-b-purple))" }}
        />
        <div className="relative z-[1] flex flex-col gap-4 rounded-[40px] border-2 border-b-edge bg-b-elevated px-4 pt-6 pb-4">
          <div className="flex w-full flex-col items-center gap-4 text-center">
            {/* 20px, not 24px — measured off the live card. */}
            <h3 className="text-[20px] leading-[44px] font-bold">{node.title}</h3>
            <Link
              href={node.href ?? COURSE.activeHref}
              role="link"
              data-slot="button3d"
              className="group relative flex w-full rounded-[56px]"
            >
              {/*
                Two variants, because the reference has two.

                "Start" is the primary call — the learner's own next lesson —
                and is purple on a purple lip. "Jump here" is offering to move
                them somewhere they chose to inspect, which is a secondary
                action, and the reference paints it `rgba(255,255,255,.2)` on a
                `rgba(255,255,255,.05)` lip. Shipping the purple one for both
                made every selection look like the primary path.
              */}
              <span
                data-slot="button3d-face"
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-[60px] px-6 py-[14px]",
                  "leading-5 font-medium text-b-fg",
                  /* `b-fg`, not a literal white: the reference is pinned to
                     dark, this product is not, and a hardcoded white pill is
                     invisible on the light surface. The token inverts. */
                  jump
                    ? "bg-b-fg/20 shadow-[0_4px_0_0_color-mix(in_oklab,var(--color-b-fg)_8%,transparent)] group-active:shadow-[0_0_0_0_transparent]"
                    : "bg-b-purple shadow-[0_4px_0_0_var(--color-b-purple-2)] group-active:shadow-[0_0_0_0_var(--color-b-purple-2)]",
                  "-translate-y-1 transition-[transform,box-shadow] duration-100 ease-out",
                  "group-active:translate-y-0",
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
