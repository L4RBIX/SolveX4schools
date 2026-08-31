"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button3D } from "./button-3d";
import { ChatIcon, FlagIcon, MicIcon, ResetIcon, SpeakerIcon } from "./icons";
import { Koji, KojiBubble } from "./koji";
import { LessonTopBar } from "./lesson-chrome";
import {
  ConstraintList,
  SCHEDULING_CONSTRAINTS,
  ScheduleGrid,
  useSchedulerProblem,
} from "./schedule-grid";

/**
 * brilliant.org's authenticated lesson player, rebuilt from the live
 * `scheduling-problem/scheduling-meetings` lesson.
 *
 * Shape of the thing, all measured rather than eyeballed:
 *
 * - A 64px top bar, then a card that is `position: fixed` at inset
 *   `64 / 32 / 32 / 32`, `border-radius: 24px`, `border: 2px`, on `#141414`.
 *   The card's border is the verdict channel: white/20 while unanswered,
 *   `#B78900` when wrong, `#009B2B` when right.
 * - Lesson pages are **not** unmounted. They sit on a horizontal track at a
 *   pitch of exactly one card-width (measured: page 1 parked at x=-937 while
 *   page 2 sat at 465, a 1402px gap == the card's inner width) and the track
 *   translates. Here that is expressed as `-index * 100%`, which is the same
 *   distance without hardcoding a viewport.
 * - The tutor toolbar (flag, speaker) is absolutely positioned at z-95 and the
 *   Koji dock at z-856, both *above* the z-93 card, which is why they read as
 *   sitting on top of it rather than inside it.
 *
 * Content is verbatim from the live lesson; the puzzle data comes from the
 * interactive's own scene graph (see `schedule-grid.tsx`).
 */

const SCENE_SETTER =
  "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png";

const PAGES = ["intro", "scheduler"] as const;

export function LessonPlayer() {
  const [page, setPage] = useState(0);
  const [xp, setXp] = useState(0);
  const scheduler = useSchedulerProblem();

  const { verdict, check, tryAgain, startOver, canCheck } = scheduler;

  const onCheck = useCallback(() => {
    const v = check();
    if (v === "right") setXp((x) => x + 15);
  }, [check]);

  const advance = useCallback(() => {
    setPage((p) => Math.min(p + 1, PAGES.length - 1));
  }, []);

  // The bar fills across the current section; solving page 2 measured ~19%.
  const progress = page === 0 ? 0.03 : verdict === "right" ? 0.191 : 0.1;

  return (
    <div className="flex h-[100dvh] flex-col bg-b-dark font-b-sans text-white">
      <div className="flex flex-1 flex-col px-8 pb-8">
        <LessonTopBar
          progress={progress}
          xp={xp}
          canPrev={page > 0}
          canNext={false}
          onPrev={() => setPage((p) => Math.max(p - 1, 0))}
        />

        {/* page fade: 200ms decelerate in, 100ms accelerate out */}
        <div
          data-slot="fade"
          data-visible="true"
          className="relative flex flex-1 flex-col opacity-100 transition-opacity duration-200 ease-b-enter"
        >
          {/* ---- the card ------------------------------------------------ */}
          <div
            data-panel="true"
            className={cn(
              "fixed top-16 right-8 bottom-8 left-8 z-[93] flex flex-col overflow-hidden rounded-[24px] border-2 bg-b-dark transition-colors duration-300",
              verdict === "unchecked" && "border-white/20",
              verdict === "wrong" && "border-b-warn",
              verdict === "right" && "border-b-ok",
            )}
          >
            {/* horizontal page track */}
            <div className="relative flex-1 overflow-hidden">
              <div
                className="flex h-full w-full transition-transform duration-500 ease-b-spring"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                <LessonPage>
                  <IntroSlide />
                </LessonPage>
                <LessonPage>
                  <SchedulerSlide scheduler={scheduler} />
                </LessonPage>
              </div>
            </div>

            {/* ---- footer CTAs: 80px strip, pair always totals 367px ---- */}
            <div data-shake-stable="true" className="h-20 shrink-0">
              <div className="mx-auto flex h-full w-full max-w-[367px] items-center justify-center gap-2 bg-b-dark px-0 py-4">
                {page === 0 && (
                  <Button3D onClick={advance}>Continue</Button3D>
                )}

                {page === 1 && verdict === "unchecked" && (
                  <Button3D onClick={onCheck} disabled={!canCheck}>
                    Check
                  </Button3D>
                )}

                {page === 1 && verdict === "wrong" && (
                  <>
                    <Button3D variant="secondary" className="w-[112px] shrink-0">
                      Get help
                    </Button3D>
                    <Button3D variant="warn" onClick={tryAgain}>
                      Try again
                    </Button3D>
                  </>
                )}

                {page === 1 && verdict === "right" && (
                  <>
                    <Button3D variant="secondary" className="w-[100px] shrink-0">
                      Why?
                    </Button3D>
                    <Button3D variant="ok" onClick={startOver}>
                      Continue
                    </Button3D>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- tutor toolbar: above the card, z-95 -------------------- */}
          <div
            data-tutor-toolbar="true"
            className="absolute top-0 left-0 z-[95] flex w-16 flex-col items-start gap-2 px-2 pt-5 pb-8"
          >
            <button
              type="button"
              aria-label="report a problem"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[54px] text-white/20 transition-colors hover:text-white/50"
            >
              <FlagIcon />
            </button>
            <button
              type="button"
              aria-label="read aloud"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[54px] text-white/20 transition-colors hover:text-white/50"
            >
              <SpeakerIcon />
            </button>
          </div>

          {/* ---- Koji dock: above everything, z-856 --------------------
              Measured: the dock grid is 397x64 at the page's left padding,
              `grid-template-columns: 64px 317px`. Koji's canvas is bigger than
              his 64px cell (128x168) and overhangs to the viewport edge, which
              is why he is pulled left rather than centred in the cell. */}
          <div className="pointer-events-none absolute bottom-0 left-0 z-[856] flex flex-col items-start">
            {/* The bubble sits ABOVE the dock, level with Koji's head —
                measured at y 534 against a dock at y 670. */}
            {verdict === "wrong" && (
              <div className="pointer-events-auto mb-8 ml-[84px]">
                <KojiBubble>
                  Hmm, not quite. Tap the &apos;Get help&apos; button if you want to work
                  through it together.
                </KojiBubble>
              </div>
            )}

            <div className="flex items-end gap-4">
              <Koji verdict={verdict} attempt={scheduler.attempt} className="-ml-8" />

              {/* chat | mic, split pill, 120x52 with a 1x44 hairline divider */}
              <div className="b-glass pointer-events-auto mb-3 flex h-[52px] w-[120px] items-center rounded-full">
                <button
                  type="button"
                  aria-label="chat with tutor"
                  className="flex h-[52px] w-[60px] cursor-pointer items-center justify-center rounded-l-full border-[0.5px] border-transparent text-white/20 transition-colors hover:text-white/60"
                >
                  <ChatIcon size={48} className="-mx-[14px] -mt-4 -mb-[14px]" />
                </button>
                <span className="h-11 w-px bg-white/10" />
                <button
                  type="button"
                  aria-label="answer with voice"
                  className="flex h-[52px] w-[60px] cursor-pointer items-center justify-center rounded-r-full border-[0.5px] border-transparent text-white/20 transition-colors hover:text-white/60"
                >
                  <MicIcon size={48} className="-mx-[17px] -mt-4 -mb-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One slot on the horizontal track. Always full width so the pitch is exact. */
function LessonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full shrink-0 justify-center overflow-y-auto px-4">
      <div
        data-lesson-page-components="true"
        className="flex w-full max-w-[540px] flex-col items-center gap-4 self-center"
      >
        {children}
      </div>
    </div>
  );
}

/* ---- page 1 ------------------------------------------------------------- */

function IntroSlide() {
  return (
    <>
      <div className="relative mb-6 flex flex-col gap-6">
        <Image
          src={SCENE_SETTER}
          alt=""
          width={540}
          height={270}
          priority
          className="h-[270px] w-[540px] max-w-full object-contain"
        />
      </div>
      <div data-slot="lesson-content" className="w-full leading-[25.6px]">
        <h1 className="mb-[22.4px] text-[32px] leading-[42.88px] font-bold">
          The Scheduling Problem
        </h1>
        <p className="mb-[22.4px] text-[16px] leading-[25.6px]">
          Let&apos;s dive into a classic algorithmic problem — building a schedule
          without conflicts.
        </p>
      </div>
    </>
  );
}

/* ---- page 2 ------------------------------------------------------------- */

function SchedulerSlide({
  scheduler,
}: {
  scheduler: ReturnType<typeof useSchedulerProblem>;
}) {
  const { selected, verdict, statuses, toggle, startOver } = scheduler;
  return (
    <div className="flex w-full flex-col gap-5">
      <p className="text-[16px] leading-6">
        Tap meeting blocks to construct a valid schedule.
      </p>

      <ConstraintList
        key={statuses.join("-")}
        labels={SCHEDULING_CONSTRAINTS.map((c) => c.label)}
        statuses={statuses}
      />

      <ScheduleGrid verdict={verdict} selected={selected} onToggle={toggle} />

      <button
        type="button"
        onClick={startOver}
        disabled={verdict !== "unchecked" || selected.size === 0}
        className={cn(
          "flex items-center gap-2 self-end text-[16px] font-medium transition-colors",
          verdict === "unchecked" && selected.size > 0
            ? "cursor-pointer text-white hover:text-white/80"
            : "cursor-default text-white/30",
        )}
      >
        <ResetIcon />
        Start over
      </button>
    </div>
  );
}
