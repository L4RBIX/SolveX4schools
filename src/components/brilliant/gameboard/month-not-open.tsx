"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import type { MonthOutline } from "@schools/curriculum/public";
import type { MonthRequirement } from "@schools/presentation/adapters";
import { L, lessonsProgressLabel, t } from "@schools/presentation/labels";
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
  requirement = null,
}: {
  month: MonthOutline;
  reason?: MonthClosedReason;
  /**
   * What is still outstanding in the month that is holding this one shut.
   *
   * Derived on the SERVER by `blockingRequirement` and carrying counts and
   * booleans only — never a block id, never a prompt, never a test case. Absent
   * for an unpublished month, where the learner has nothing to act on, and
   * absent when the state cannot be read, where the panel falls back to its
   * sentence alone.
   */
  requirement?: MonthRequirement | null;
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

        {/*
          What is actually left, when it is knowable.

          The sentence above says what the rule is; this says where the learner
          stands in it. Three lines, all four quantities read off the ledger:
          lessons finished out of the month's LESSON count (not `required`,
          which counts the check too), whether the check has a completion, and
          whether any of its unseen problems has been solved.

          No percentage, and nothing about which block proves independence. The
          count and the boolean are things the learner can already see on their
          own board; the identity of the hidden problem is not.
        */}
        {reason === "locked" && requirement ? (
          <div className="mt-1 text-left">
            <p className="mb-2 text-[14px] leading-5 text-b-fg/50">
              {t(L.monthOpensChecklist, loc)}
            </p>
            <ul className="flex flex-col gap-1.5">
              <RequirementRow
                done={requirement.lessonsDone >= requirement.lessonsTotal}
                text={lessonsProgressLabel(
                  requirement.lessonsDone,
                  requirement.lessonsTotal,
                  loc,
                )}
                loc={loc}
              />
              <RequirementRow
                done={!requirement.checkPending}
                text={t(L.monthReqCheck, loc)}
                loc={loc}
              />
              <RequirementRow
                done={!requirement.independencePending}
                text={t(L.monthReqIndependence, loc)}
                loc={loc}
              />
            </ul>
          </div>
        ) : null}
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

/**
 * One line of the checklist.
 *
 * The tick and the ring are `aria-hidden` decoration; the state travels as a
 * word in the reader's own language. A checklist whose only difference between
 * done and not-done is a glyph is a checklist that says nothing to a screen
 * reader, and one whose only difference is a colour says nothing to the one or
 * two children in every class who cannot separate the two hues.
 */
function RequirementRow({
  done,
  text,
  loc,
}: {
  done: boolean;
  text: string;
  loc: Locale;
}) {
  return (
    <li className="flex items-center gap-2 text-[15px] leading-6">
      <span
        aria-hidden="true"
        className={done ? "text-b-green" : "text-b-fg/40"}
      >
        {done ? "\u2713" : "\u25cb"}
      </span>
      <span className={done ? "text-b-fg/70" : "text-b-fg"}>{text}</span>
      <span className="sr-only">
        {t(done ? L.monthReqDone : L.monthReqPending, loc)}
      </span>
    </li>
  );
}
