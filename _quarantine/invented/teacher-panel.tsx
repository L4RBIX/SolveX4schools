"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { AssignmentManager } from "./assignment";
import { ClassroomOverview } from "./classroom-overview";
import { StudentAnalytics } from "./student-analytics";
import { StudentTable } from "./student-table";
import {
  CARD,
  CLASS_META,
  NEEDS_ATTENTION,
  STATUS_META,
  WEEK_SUMMARY,
  type WeekSummaryItem,
} from "./teacher-data";

const TONE_CLASS: Record<WeekSummaryItem["tone"], string> = {
  ink: "text-e-ink",
  good: "text-[#0FA968]",
  warn: "text-[#B4770B]",
  muted: "text-e-muted",
};

export function TeacherPanel() {
  const [toast, setToast] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="flex flex-col gap-8">
      <ClassroomOverview />

      <div id="analytics" className="grid scroll-mt-20 gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <StudentAnalytics />
        </div>

        <aside
          aria-label="Class follow-ups"
          className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start"
        >
          <div className={cn(CARD, "p-5")}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] font-bold text-e-ink">Needs attention</h3>
              <span className="rounded-full bg-[#F5A524]/16 px-2.5 py-1 font-mono text-[13px] font-bold text-[#B4770B] tabular-nums">
                {NEEDS_ATTENTION.length}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-e-muted">
              Below 40% of {CLASS_META.unit}.
            </p>

            <ul className="mt-3 divide-y divide-e-line border-t border-e-line">
              {NEEDS_ATTENTION.map((student) => (
                <li key={student.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
                      STATUS_META[student.status].avatarClass,
                    )}
                    aria-hidden="true"
                  >
                    {student.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-e-ink">
                      {student.name}
                    </span>
                    <span className="block truncate text-[13px] text-e-muted">
                      Stuck on {student.stuckOn}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setToast(`Message drafted to ${student.name}`)}
                    aria-label={`Message ${student.name}`}
                    className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg text-e-muted transition-colors duration-150 hover:bg-e-grey-2 hover:text-e-ink sm:px-3"
                  >
                    <MessageSquare className="size-4" aria-hidden="true" />
                    <span className="hidden text-[13px] font-semibold sm:inline">Message</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(CARD, "p-5")}>
            <h3 className="text-[17px] font-bold text-e-ink">This week</h3>
            <dl className="mt-3 divide-y divide-e-line border-t border-e-line">
              {WEEK_SUMMARY.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-[15px] text-e-muted">{item.label}</dt>
                  <dd
                    className={cn(
                      "font-mono text-[15px] font-bold tabular-nums",
                      TONE_CLASS[item.tone],
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <AnimatePresence>
            {toast ? (
              <motion.p
                role="status"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0FA968]/12 px-3 py-1.5 text-[13px] font-semibold text-[#0FA968]"
              >
                <Check className="size-3.5" aria-hidden="true" />
                {toast}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </aside>
      </div>

      <AssignmentManager className="scroll-mt-20" />

      <StudentTable className="scroll-mt-20" />
    </div>
  );
}
