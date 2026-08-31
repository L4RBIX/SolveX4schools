"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LEARNING_PATHS, type LearningPath, type PathTile } from "./paths-data";

/**
 * brilliant.org/courses/ — "Learning Paths".
 *
 * Measured at 1470: the page is a 1216px column; each path is a header block
 * (80px category art, 40px gap, text, progress + star) over a carousel whose
 * track sits on a `#1E1E1E` slab with `border-radius: 12px` and
 * `padding: 74px 0 40px`. Slides are 176px cards on a 198.7px pitch
 * (`width: 182.703px` + `margin-right: 16px`), and the track is moved with a
 * `transform`, not native scrolling.
 *
 * A 64px gradient mask (`#1E1E1E → transparent` at 103.85%) covers each end of
 * the slab, with the prev/next buttons floating on top of it.
 *
 * Course tiles reuse the site's 3D lift: `translateY(-4px)` over a hard
 * `0 4px 0 0 #4C4C4C` shadow.
 */

const SLIDE_PITCH = 198.703;

export interface LearningPathsPageProps {
  /** Defaults to the reference route's own data so /brilliant/app/courses is untouched. */
  paths?: LearningPath[];
  labels?: {
    title: string;
    subtitle: string;
    yours: string;
    others: string;
    askPlaceholder: string;
    ask: string;
    /** Carousel controls. Default to the reference route's English. */
    prev?: string;
    next?: string;
    /** Omitted labels hide the favourite star — see `showStar`. */
    star?: string;
    unstar?: string;
  };
  /**
   * The favourite star.
   *
   * Off for the school programme: there is exactly one path, and a control that
   * marks it a favourite among itself does nothing on click and says nothing
   * when set.
   */
  showStar?: boolean;
}

const DEFAULT_LABELS = {
  title: "Learning Paths",
  subtitle: "Step-by-step paths to mastery",
  yours: "Your learning paths",
  others: "Other learning paths",
  askPlaceholder: "What do you want to learn?",
  ask: "Ask",
  prev: "Previous",
  next: "Next",
  star: "Star learning path",
  unstar: "Unstar learning path",
};

export function LearningPathsPage({
  paths = LEARNING_PATHS,
  labels,
  showStar = true,
}: LearningPathsPageProps = {}) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const starred = paths.filter((p) => p.starred);
  const rest = paths.filter((p) => !p.starred);

  return (
    <div className="mx-auto w-full max-w-[1216px] px-4 pb-24 sm:px-6">
      <h1 className="sr-only">{L.title}</h1>

      <div className="flex flex-col items-start justify-between gap-6 pt-8 pb-6 lg:flex-row lg:gap-8">
        <div>
          <h2 className="text-[32px] leading-[42px] font-bold">{L.title}</h2>
          <p className="mt-1 text-b-fg/60">{L.subtitle}</p>
        </div>
        <AskBar placeholder={L.askPlaceholder} action={L.ask} />
      </div>

      <section>
        <h2 className="mb-2 text-[20px] leading-[25px] font-bold">{L.yours}</h2>
        {starred.map((p) => (
          <PathRow key={p.title} path={p} labels={L} showStar={showStar} />
        ))}
      </section>

      {/* Only rendered when there is something in it. The school programme is a
          single path, and an empty "Other paths" heading would read as content
          that failed to load. */}
      {rest.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-2 text-[20px] leading-[25px] font-bold">{L.others}</h2>
          {rest.map((p) => (
            <PathRow key={p.title} path={p} labels={L} showStar={showStar} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

/** Same control as the home rail: a button, not an input. */
function AskBar({ placeholder, action }: { placeholder: string; action: string }) {
  return (
    <button
      type="button"
      className="flex h-[52px] w-full max-w-[456px] shrink-0 items-center gap-2 rounded-full border-2 border-b-fg/20 bg-b-bg py-1 pr-1 pl-4 text-left"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-b-fg/60"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="flex-1 overflow-hidden text-[14px] leading-[21px] text-b-fg/40">
        {placeholder}
      </span>
      <span className="flex h-10 items-center justify-center rounded-[54px] border-2 border-transparent bg-b-fg/5 px-[14px] py-2 leading-5 font-medium text-b-fg/20">
        {action}
      </span>
    </button>
  );
}

function PathRow({
  path,
  labels,
  showStar,
}: {
  path: LearningPath;
  labels: typeof DEFAULT_LABELS;
  showStar: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [viewportW, setViewportW] = useState(1216);
  const viewport = useRef<HTMLDivElement>(null);

  // Track the viewport in state rather than reading the ref while rendering,
  // so the arrow visibility stays correct after a resize.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportW(entry.contentRect.width));
    ro.observe(el);
    setViewportW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const maxOffset = Math.max(0, path.tiles.length * SLIDE_PITCH - viewportW);
  const canPrev = offset > 0;
  const canNext = offset < maxOffset - 1;

  const step = (dir: -1 | 1) => {
    const page = Math.max(1, Math.floor(viewportW / SLIDE_PITCH)) * SLIDE_PITCH;
    setOffset((o) => Math.min(Math.max(o + dir * page, 0), maxOffset));
  };

  return (
    <div className="flex flex-col items-center transition-opacity duration-150 ease-in">
      {/* header */}
      <div className="flex w-full flex-col gap-3 py-6 pl-2 sm:pl-6">
        <div className="flex items-center gap-4 sm:gap-10">
          <Image
            src={path.catImg}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 min-h-20 min-w-20 shrink-0"
          />
          <div className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[580px]">
              <div className="flex flex-col items-start gap-2">
                <span className="b-eyebrow leading-[18px] text-b-fg/60">{path.eyebrow}</span>
                <h3 className="text-[20px] leading-[25px] font-bold">{path.title}</h3>
                <p className="text-b-fg/60">{path.sub}</p>
              </div>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3">
              {path.percent && (
                <span className="flex h-10 items-center gap-2 rounded-full bg-b-elevated px-4 text-[14px] text-b-fg/60">
                  <RingIcon />
                  {path.percent}
                </span>
              )}
              {showStar ? (
                <button
                  type="button"
                  aria-label={path.starred ? labels.unstar : labels.star}
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-clip rounded-full border-2 border-transparent bg-b-elevated p-2.5"
                >
                  <StarIcon filled={path.starred} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* carousel */}
      <div className="relative w-full">
        <div className="mt-3 overflow-hidden rounded-xl bg-b-elevated">
          <div ref={viewport} className="relative z-[1] overflow-hidden pt-[74px] pb-10">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${offset}px)` }}
            >
              {path.tiles.map((t, i) => (
                <CourseTile key={t.title + i} tile={t} badge={i === 0 ? path.age : undefined} />
              ))}
            </div>
          </div>
        </div>

        {/* end masks + controls */}
        <CarouselEdge side="left" show={canPrev} label={labels.prev} onClick={() => step(-1)} />
        <CarouselEdge side="right" show={canNext} label={labels.next} onClick={() => step(1)} />
      </div>
    </div>
  );
}

function CarouselEdge({
  side,
  show,
  label,
  onClick,
}: {
  side: "left" | "right";
  show: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        /* z-2, above the track's own z-1. Without it the end mask and both
           arrows render UNDER the slides: the control exists, reports visible,
           and cannot be seen or clicked — which is how nine months of
           curriculum ended up looking like six. */
        "pointer-events-none absolute top-3 bottom-0 z-[2] w-16 rounded-xl",
        side === "left" ? "left-0" : "right-0",
      )}
      style={{
        backgroundImage: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, #1E1E1E 0%, rgba(248,248,248,0) 103.85%)`,
        opacity: show ? 1 : 0,
      }}
    >
      {show && (
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="pointer-events-auto absolute top-1/2 flex h-12 w-12 min-w-10 -translate-y-1/2 items-center justify-center overflow-clip rounded-full border-2 border-transparent bg-b-fg/10 p-4"
          style={{ [side]: 24 } as React.CSSProperties}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={side === "right" ? "rotate-180" : undefined}
          >
            <path
              d="M3 7.95711L10.9571 15.9142L12.3713 14.5L5.82843 7.95711L12.3713 1.41421L10.9571 0L3 7.95711Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * 176x176 art card with a 92px illustration, an optional age badge pinned at
 * 12/12, an optional 4px progress track, and the centred title beneath.
 */
function CourseTile({ tile, badge }: { tile: PathTile; badge?: string }) {
  return (
    <div className="mr-4 w-[182.703px] shrink-0">
      <div className="relative mt-1 flex w-44 max-w-44 min-w-44 flex-col">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-44 w-full">
            <div
              className={cn(
                "flex h-44 max-h-44 min-h-44 w-44 max-w-44 min-w-44 items-center justify-center rounded-[20px] border-2 border-b-edge bg-b-bg",
                "-translate-y-1 shadow-[0_4px_0_0_#4C4C4C]",
                "transition-[transform,box-shadow,border-color,background-color] duration-100 ease-out",
                "hover:border-b-fg/40 active:translate-y-0 active:shadow-[0_0_0_0_#4C4C4C]",
              )}
            >
              {badge && (
                <span className="b-eyebrow absolute top-3 left-3 z-[1] flex items-center gap-1 rounded-xl leading-[13.2px] text-b-fg/40">
                  {badge}
                </span>
              )}
              <Image
                src={tile.img}
                alt={tile.title}
                width={92}
                height={92}
                className="h-[92px] w-[92px] object-contain"
              />
              {tile.progress !== undefined && (
                <div className="absolute bottom-4 left-1/2 h-1 w-[140px] -translate-x-1/2 overflow-hidden rounded-full bg-b-fg/20">
                  <div
                    className="h-full rounded-full bg-b-green"
                    style={{ width: `${Math.round(tile.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex w-44 max-w-44 min-w-44 justify-center">
            <Link href={tile.href} className="block text-center">
              {tile.title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.33l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.95z"
        fill={filled ? "var(--color-b-pear)" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" stroke="var(--color-b-purple)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
