"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";

/**
 * «Қайталау» / «Повторение» — the review queue, on `/you`.
 *
 * The programme's fifth independence check (PDF p.6): a task solved with help
 * comes back later and is done without it. This section is where a learner
 * finds out that something is waiting; the re-solve itself happens at
 * `/review`, which is a player rather than a list and does not belong inside a
 * progress dashboard.
 *
 * ## It reads its own endpoint
 *
 * Like `ErrorDictionary` beside it, and for the same reason: the queue has its
 * own lifecycle. It changes when a learner solves something with help, not when
 * the period control at the top of `/you` moves, and folding it into that
 * page's state would reset it every time somebody looked at last week.
 *
 * ## What it does not say
 *
 * How much help the original solve took. The API does not send `originLevel`
 * and this component could not render it if it did. "You needed a level-3 hint
 * for this one" is a label on a fourteen-year-old at the exact moment they are
 * being asked to work without one. The reason line says what the RECORD says —
 * «Көмекпен шешілген еді», it was solved with help — which is a fact about the
 * task's history rather than a claim about them.
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

interface Payload {
  due: ReviewSummary[];
  later: ReviewSummary[];
}

export function ReviewQueue({ loc }: { loc: Locale }) {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/learning/review");
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Payload);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="flex flex-col items-stretch gap-6">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[20px] leading-[25px] font-bold">{t(L.reviewTitle, loc)}</h2>
          {/* The count, and only when there is something to count. A badge
              reading 0 forever is a promise the product is not keeping. */}
          {data && data.due.length > 0 ? (
            <span className="rounded-full bg-b-purple/20 px-3 py-1 text-[13px] font-semibold tabular-nums text-b-purple">
              {t(L.reviewDueCount(data.due.length), loc)}
            </span>
          ) : null}
        </div>
        <p className="text-[14px] leading-[21px] text-b-fg/60">{t(L.reviewSub, loc)}</p>
      </div>

      {failed ? (
        <p className="text-b-fg/60">{t(L.reviewLoadFailed, loc)}</p>
      ) : data === null ? (
        <div
          aria-hidden="true"
          className="h-24 animate-pulse rounded-[20px] border-2 border-b-fg/10 bg-b-fg/[0.03]"
        />
      ) : data.due.length === 0 && data.later.length === 0 ? (
        <p className="text-b-fg/60">{t(L.reviewEmpty, loc)}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.due.map((row) => (
            <QueueCard key={row.reviewId} row={row} loc={loc} due />
          ))}

          {/* Queued but not yet due. Shown, and shown as NOT actionable: a
              learner who can see that three tasks are coming back next week
              understands the mechanism, and one who sees nothing assumes the
              feature is broken when a task reappears without warning. */}
          {data.later.map((row) => (
            <QueueCard key={row.reviewId} row={row} loc={loc} due={false} />
          ))}
        </div>
      )}
    </section>
  );
}

function QueueCard({
  row,
  loc,
  due,
}: {
  row: ReviewSummary;
  loc: Locale;
  due: boolean;
}) {
  const reason =
    row.reason === "solved_with_assistance" ? L.reviewReasonAssisted : L.reviewReasonMilestone;

  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border-2 border-b-fg/20 bg-b-bg p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="truncate text-[16px] leading-6 font-semibold">
          {t(row.lessonTitle, loc)}
        </h3>
        <p className="text-[13px] leading-[19px] text-b-fg/50">
          {t(reason, loc)}
          {due ? null : ` · ${t(L.reviewLater, loc)} · ${dateLabel(row.dueAt, loc)}`}
        </p>
      </div>

      {due ? (
        <Link
          href="/review"
          className="h-11 shrink-0 rounded-full border-2 border-b-purple px-5 text-[14px] leading-[38px] font-medium text-b-fg transition-colors hover:bg-b-purple/20"
        >
          {t(L.reviewOpen, loc)}
        </Link>
      ) : null}
    </article>
  );
}

function dateLabel(iso: string, loc: Locale): string {
  return new Date(iso).toLocaleDateString(loc === "kk" ? "kk-KZ" : "ru-RU", {
    day: "numeric",
    month: "short",
  });
}
