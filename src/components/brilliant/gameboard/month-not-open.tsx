"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import type { MonthOutline } from "@schools/curriculum/public";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";

/**
 * A month that exists but has not been approved for a classroom.
 *
 * Deliberately not a 404. The learner is entitled to see the shape of their
 * year — the month is on their roadmap and they can read its name — and a
 * missing page would suggest something is broken rather than pending. What they
 * must not get is a board of nodes that each dead-end when tapped, which is
 * what rendering the normal board behind a closed gate would produce.
 *
 * No mention of hashes, statuses or reviewers: the learner needs to know it is
 * not open yet and that a teacher opens it. The rest is the admin's business.
 */
/**
 * Why this month will not open.
 *
 * `unpublished` is about the school: nobody has approved the content and the
 * learner can do nothing about it. `locked` is about the learner: the month is
 * published and waiting, and finishing the previous one opens it. Same panel,
 * different sentence, because telling a learner to wait for a teacher when the
 * door is theirs to open teaches them the product does not know what is going
 * on.
 */
export type MonthClosedReason = "unpublished" | "locked";

export function MonthNotOpen({
  month,
  reason = "unpublished",
}: {
  month: MonthOutline;
  reason?: MonthClosedReason;
}) {
  const { locale } = useLocale();
  const loc = locale as Locale;

  return (
    <main className="grid min-h-dvh place-items-center bg-b-bg px-6 font-b-sans text-b-fg">
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-[16px] border-2 border-b-lock-edge bg-b-lock-fill px-6 py-8 text-center">
        <p className="text-[14px] leading-5 tracking-wide text-b-fg/50 uppercase">
          {`${month.index}. ${month.monthName[loc]}`}
        </p>
        <h1 className="text-[26px] leading-[34px] font-bold">
          {t(reason === "locked" ? L.monthLockedTitle : L.monthNotOpenTitle, loc)}
        </h1>
        <p className="text-[16px] leading-6 text-b-fg/70">
          {t(reason === "locked" ? L.monthLockedBody : L.monthNotOpenBody, loc)}
        </p>
        <Link
          href="/home"
          className="mt-2 inline-flex h-12 items-center justify-center rounded-[12px] border-2 border-b-sched-edge bg-b-sched-fill text-[16px] font-medium text-b-fg"
        >
          {t(L.close, loc)}
        </Link>
      </div>
    </main>
  );
}
