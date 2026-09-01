"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import type { PublicBlock } from "@schools/curriculum/public";
import type { BlockAnswer } from "@schools/learning/checking";
import type { SchoolInteraction } from "@schools/learning";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { SchoolLesson, type LessonSummary } from "../lesson/school-lesson";
import type { BlockReveal } from "../lesson/blocks";
import { AppHeader } from "./app-header";
import { accountMenu } from "./account-menu";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "./school-chrome";

/**
 * `/review` — the delayed re-solve.
 *
 * The programme's fifth independence check (PDF p.6): «Көмекпен шешілген есеп
 * бірнеше аптадан соң қайта беріледі және бұл жолы көмексіз орындалады» — a
 * task solved with help comes back later and is done without it.
 *
 * ## Why this is a page and not a section of /you
 *
 * The queue lives on `/you`, beside the error dictionary, because that is where
 * a learner looks to see what is waiting. The re-solve is a PLAYER — one task,
 * the tutor dock, the check footer — and a player embedded in a dashboard is
 * neither. It reuses `SchoolLesson` rather than reimplementing a second one:
 * one runtime means one place for a grading bug to live, and a learner meeting
 * a familiar screen on the attempt that counts.
 *
 * ## The reset, and where it actually happens
 *
 * Not here. This component holds no state that could carry over, because
 * everything that could is keyed on the episode, and the episode is minted by
 * the server on `start` and handed down as `fixedEpisodeId`:
 *
 *   * the hint ladder reads `interventions` by episode — a fresh one is empty,
 *     so the first request answers `attempt_required` exactly as on an unseen
 *     task;
 *   * `revealFor` counts failed attempts on the episode, so the original
 *     attempt's failures do not open the answer;
 *   * the block arrives as the same public projection a lesson page sends, so
 *     there is no reference solution and no hidden case to surface;
 *   * the reducer folds the re-solve into its own episode row, so the
 *     independence it shows is measured on its own.
 *
 * What this file contributes is the one line that says so to the learner
 * («Бұрынғы нұсқаулар сақталмайды»). A child who assumes the tutor remembers
 * where they got to will ask it for the next step instead of starting.
 */

interface ReviewSummary {
  reviewId: string;
  blockId: string;
  lessonId: string;
  lessonTitle: Localized;
  monthIndex: number;
  reason: "solved_with_assistance" | "independent_milestone";
  dueAt: string;
  started: boolean;
}

interface StartedReview {
  reviewId: string;
  episodeId: string;
  lessonId: string;
  lessonTitle: Localized;
  monthIndex: number;
  block: PublicBlock;
}

export function SchoolReview({ leagues = false }: { leagues?: boolean }) {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;

  const [due, setDue] = useState<ReviewSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [active, setActive] = useState<StartedReview | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/learning/review");
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as { due: ReviewSummary[] };
      setDue(payload.due);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Open one.
   *
   * The episode id comes back from this call and from nowhere else. A client
   * that minted its own would be minting the thing that carries the reset, and
   * the database would refuse it anyway — `review_schedule_fresh_episode` —
   * but the point is that it never gets the chance.
   */
  const start = useCallback(async (reviewId: string) => {
    setStartFailed(false);
    try {
      const res = await fetch("/api/learning/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start", reviewId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setActive((await res.json()) as StartedReview);
    } catch {
      setStartFailed(true);
    }
  }, []);

  const onInteraction = useCallback((interaction: SchoolInteraction) => {
    void fetch("/api/learning/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        events: [
          {
            eventName: "statement_revisited",
            occurredAt: new Date(interaction.timestamp).toISOString(),
            payload: { is_revisit: false },
          },
        ],
      }),
    }).catch(() => {});
  }, []);

  /**
   * The same grading path as a lesson, deliberately.
   *
   * `episodeId` is whatever the player was given, which for a review is the
   * server's fresh one — so the attempt lands in the re-solve's own episode and
   * the evidence it produces is separable from the original by construction
   * rather than by a flag somebody has to remember to set.
   */
  const onSubmit = useCallback(
    async (input: {
      blockId: string;
      episodeId: string;
      /* The idempotency key, minted by the player once per Check press and held
         while the answer is unchanged. Declared here rather than left to
         structural typing so it is visibly part of the request: drop it from
         this object and the server silently goes back to appending a second set
         of learning events for every retried submission. See
         `schools/learning/submission.ts`. */
      submissionId: string;
      answer: BlockAnswer;
    }) => {
      try {
        const res = await fetch("/api/learning/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) return null;
        return (await res.json()) as {
          verdict: "correct" | "wrong" | "partial" | "unknown";
          reveal?: BlockReveal;
          why?: string | null;
        };
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Settle the review.
   *
   * Nothing about the outcome is sent. The server reads the review episode's
   * own ledger and decides — solved unaided, solved with help, or not settled
   * by anything a machine scores. A browser that could name the outcome could
   * name `resolved_independently` for a task it never opened, and independence
   * is the one thing this whole feature exists to measure honestly.
   */
  const onComplete = useCallback(
    (summary: LessonSummary) => {
      void summary;
      if (!active) return;
      void fetch("/api/learning/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ action: "finish", reviewId: active.reviewId }),
      }).catch(() => {});
    },
    [active],
  );

  if (active) {
    return (
      <SchoolLesson
        /* A one-block lesson. The title is the lesson the task came from, so
           the learner recognises where they met it — not "Review #3". */
        lesson={{ id: active.lessonId, title: active.lessonTitle, blocks: [active.block] }}
        monthIndex={active.monthIndex}
        locale={loc}
        backHref="/you"
        onInteraction={onInteraction}
        onSubmit={onSubmit}
        onComplete={onComplete}
        /* The whole feature, in one prop. See this file's header. */
        fixedEpisodeId={active.episodeId}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <AppHeader
        active="you"
        links={SCHOOL_NAV(loc, leagues)}
        homeHref="/home"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        xp={null}
        a11y={{
          menu: loc === "kk" ? "Мәзір" : "Меню",
          streak: loc === "kk" ? "Осы аптадағы белсенділік" : "Активность на этой неделе",
        }}
        accountMenu={accountMenu(loc)}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <main className="mx-auto w-full max-w-[720px]">
        <div className="flex flex-col items-stretch gap-8 px-6 py-8 sm:p-8">
          <div>
            <h1 className="text-[32px] leading-[42px] font-bold">{t(L.reviewTitle, loc)}</h1>
            <p className="mt-1 text-b-fg/60">{t(L.reviewSub, loc)}</p>
          </div>

          {/* The promise, said before anything is opened rather than after. */}
          <p className="rounded-[16px] border-2 border-b-purple/40 bg-b-purple/10 px-5 py-4 text-[14px] leading-[21px] text-b-fg/80">
            {t(L.reviewFresh, loc)}
          </p>

          {startFailed ? (
            <p className="text-b-fg/60">{t(L.reviewStartFailed, loc)}</p>
          ) : null}

          {failed ? (
            <p className="text-b-fg/60">{t(L.reviewLoadFailed, loc)}</p>
          ) : due === null ? (
            <div
              aria-hidden="true"
              className="h-24 animate-pulse rounded-[20px] border-2 border-b-fg/10 bg-b-fg/[0.03]"
            />
          ) : due.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-b-fg/60">{t(L.reviewEmpty, loc)}</p>
              <Link
                href="/you"
                className="h-11 rounded-full border-2 border-b-fg/20 px-5 leading-[38px] font-medium transition-colors hover:border-b-fg/40"
              >
                {t(L.navYou, loc)}
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {due.map((row) => (
                <li key={row.reviewId}>
                  <article className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] sx-card border-2 border-b-fg/20 p-5">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="truncate text-[16px] leading-6 font-semibold">
                        {t(row.lessonTitle, loc)}
                      </h2>
                      <p className="text-[13px] leading-[19px] text-b-fg/50">
                        {t(
                          row.reason === "solved_with_assistance"
                            ? L.reviewReasonAssisted
                            : L.reviewReasonMilestone,
                          loc,
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void start(row.reviewId)}
                      className="h-11 shrink-0 cursor-pointer rounded-full border-2 border-b-purple px-5 text-[14px] font-medium text-b-fg transition-colors hover:bg-b-purple/20"
                    >
                      {t(L.reviewOpen, loc)}
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
