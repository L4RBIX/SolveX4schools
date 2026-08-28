"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import type { ClassroomView, LearnerRow, SignalKind } from "@schools/presentation/classroom";
import { EVIDENCE_TONE, type EvidenceState } from "@schools/presentation/evidence";
import { t } from "@schools/presentation/labels";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { useLocale } from "@/components/sx/i18n";

/**
 * The classroom.
 *
 * Purpose-built rather than adapted: the student runtime is a focused,
 * one-thing-at-a-time surface, and a teacher looking at eighteen learners
 * between two lessons needs the opposite — density, and everything on one
 * screen. It shares the tokens, the type and the card construction, so it
 * belongs to the same product without pretending to be a lesson.
 *
 * ## What it will not do
 *
 * No ranking by score, because there is no score. The order is by how much a
 * teacher's attention would change something, and "ready to stretch" carries
 * no weight in that ordering — a child who is flying is not a reason to look
 * past one who is stuck.
 *
 * Every row states a checkable cause. "Needs attention" with no reason
 * attached is how a teacher learns to distrust a dashboard.
 */

const SIGNAL_TONE: Record<SignalKind, string> = {
  recurring_misconception: "border-b-warn/50 bg-b-warn/10 text-b-warn-icon",
  no_activity: "border-b-fg/20 bg-b-fg/5 text-b-fg/70",
  unexplained_failures: "border-b-lock-edge bg-b-lock-fill text-b-fg/70",
  high_assistance: "border-b-sched-edge bg-b-sched-fill text-b-fg/80",
  ready_to_stretch: "border-b-ok/50 bg-b-ok-panel text-b-ok-edge",
};

export function TeacherClassroom({ classId }: { classId: string }) {
  const { locale } = useLocale();
  const loc = locale as Locale;
  const [view, setView] = useState<ClassroomView | null>(null);
  /*
   * A CLOSED union, not a string.
   *
   * This used to be `useState<string|null>` fed straight from the caught
   * error's message, and that was whatever happened to be thrown: the guard's
   * own reason on an expired session or a class this teacher does not teach,
   * and — when the route 500s and a proxy returns an HTML error page — the JSON
   * parser's own complaint about an unexpected `<`, rendered verbatim at a
   * teacher between two lessons. Typing the state as the union means there is no
   * value a failure can carry that ends up on the screen; the string is chosen
   * here, from three we wrote.
   */
  const [error, setError] = useState<TeacherLoadFailure | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/teacher/class/${encodeURIComponent(classId)}`)
      .then(async (r) => {
        if (!r.ok) {
          /* The body may not be JSON at all — that is the case that produced the
             parser error above — so a failure to read it is just another way of
             saying "unavailable", never something to propagate. */
          const reason = await r
            .json()
            .then((d: { error?: unknown }) => d?.error)
            .catch(() => null);
          if (live) setError(teacherLoadFailure(reason));
          return;
        }
        const data = (await r.json()) as ClassroomView;
        if (live) setView(data);
      })
      // No parameter, deliberately: there is nothing in a network error a
      // teacher can act on, and reading it is how it ends up rendered.
      .catch(() => live && setError("unavailable"));
    return () => {
      live = false;
    };
  }, [classId]);

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <header className="border-b border-b-fg/20 bg-b-panel px-8">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4">
          <span className="text-[15px] font-bold tracking-wide text-b-warn-icon uppercase">
            Мұғалім · Учитель
          </span>
          <span className="font-b-mono text-[14px] text-b-fg/50">{classId}</span>
          <span className="ml-auto rounded-full border border-b-warn/40 px-3 py-1 text-[12px] text-b-warn-icon">
            {loc === "kk"
              ? "Тек әзірлеу режимінде — авторизация әлі жоқ"
              : "Только в разработке — авторизации пока нет"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-8 py-8">
        {error ? (
          <p className="text-b-fg/60">{t(teacherLoadFailureLabel(error), loc)}</p>
        ) : !view ? (
          <div className="h-40 animate-pulse rounded-[16px] border-2 border-b-edge bg-b-panel/40" />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-4">
              <Stat label={loc === "kk" ? "Оқушы" : "Учеников"} value={view.learners.length} />
              <Stat
                label={loc === "kk" ? "Әлі бастамаған" : "Ещё не начали"}
                value={view.notStarted}
                tone={view.notStarted > 0 ? "text-b-fg/50" : undefined}
              />
              <Stat
                label={loc === "kk" ? "Назар аударуды қажет етеді" : "Требуют внимания"}
                value={view.learners.filter((l) =>
                  l.signals.some((s) => s.kind !== "ready_to_stretch"),
                ).length}
                tone="text-b-warn-icon"
              />
              <Stat
                label={loc === "kk" ? "Күрделірекке дайын" : "Готовы к сложному"}
                value={view.learners.filter((l) =>
                  l.signals.some((s) => s.kind === "ready_to_stretch"),
                ).length}
                tone="text-b-ok-edge"
              />
            </div>

            {view.learners.length === 0 ? (
              <p className="text-b-fg/50">
                {loc === "kk"
                  ? "Бұл сыныпта әлі ешкім тапсырма орындамаған."
                  : "В этом классе ещё никто не выполнял заданий."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {view.learners.map((row) => (
                  <LearnerCard key={row.subjectId} row={row} loc={loc} />
                ))}
              </ul>
            )}

            {view.skillBreakdown.length > 0 ? (
              <>
                <h2 className="mt-10 mb-3 text-[18px] font-bold">
                  {loc === "kk" ? "Дағдылар бойынша сынып" : "Класс по навыкам"}
                </h2>
                <div className="overflow-x-auto rounded-[16px] border-2 border-b-edge">
                  <table className="w-full min-w-max text-left text-[14px]">
                    <thead className="bg-b-panel text-b-fg/50">
                      <tr>
                        <th className="px-4 py-2">{loc === "kk" ? "Дағды" : "Навык"}</th>
                        <th className="px-3 py-2 text-right">
                          {loc === "kk" ? "Өз бетінше" : "Самост."}
                        </th>
                        <th className="px-3 py-2 text-right">
                          {loc === "kk" ? "Жаттығу" : "Практика"}
                        </th>
                        <th className="px-3 py-2 text-right">
                          {loc === "kk" ? "Танысу" : "Знакомство"}
                        </th>
                        <th className="px-3 py-2 text-right">
                          {loc === "kk" ? "Қайта қарау" : "Повторить"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.skillBreakdown.map((s) => (
                        <tr key={s.skillId} className="border-t border-b-fg/10">
                          <td className="px-4 py-2">
                            {SKILL_BY_ID.get(s.skillId)?.title[loc] ?? s.skillId}
                          </td>
                          <Count n={s.counts.independent_evidence} tone="text-b-ok-edge" />
                          <Count n={s.counts.practicing} tone="text-b-blue" />
                          <Count n={s.counts.learning} />
                          <Count n={s.counts.needs_review} tone="text-b-warn-icon" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function LearnerCard({ row, loc }: { row: LearnerRow; loc: Locale }) {
  return (
    <li className="rounded-[16px] sx-card border-2 border-b-edge px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        {/* The learner's name, now that enrolment supplies one. `label` — a short
            subject id — remains the fallback, and it is deliberately not a
            fiction: before migration 0012 there was no name to show. */}
        <span className="text-[15px] font-bold">{row.displayName ?? row.label}</span>
        <span className="text-[13px] text-b-fg/50">
          {row.episodes} {loc === "kk" ? "әрекет" : "попыток"} ·{" "}
          <span className="text-b-ok-edge">{row.soloSolved}</span>{" "}
          {loc === "kk" ? "өз бетінше" : "самостоятельно"} · {row.assistedSolved}{" "}
          {loc === "kk" ? "көмекпен" : "с помощью"}
          {row.unexplainedFailures > 0 ? (
            <>
              {" · "}
              <span className="text-b-fg/40">
                {row.unexplainedFailures} {loc === "kk" ? "себебі белгісіз" : "без причины"}
              </span>
            </>
          ) : null}
        </span>
        {row.lastActiveAt ? (
          <span className="ml-auto text-[13px] text-b-fg/30">
            {new Date(row.lastActiveAt).toLocaleDateString(loc === "kk" ? "kk-KZ" : "ru-RU")}
          </span>
        ) : null}
      </div>

      {row.signals.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {row.signals.map((s, i) => (
            <li
              key={i}
              className={cn(
                "rounded-[10px] border px-3 py-1.5 text-[13px] leading-5",
                SIGNAL_TONE[s.kind],
              )}
            >
              {s.detail[loc]}
            </li>
          ))}
        </ul>
      ) : null}

      {row.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {row.skills.map((s) => (
            <span key={s.skillId} className="text-[12px]">
              <span className="text-b-fg/40">
                {SKILL_BY_ID.get(s.skillId)?.title[loc] ?? s.skillId}
              </span>{" "}
              <span className={EVIDENCE_TONE[s.state as EvidenceState]}>●</span>
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-[160px] rounded-[14px] sx-card border-2 border-b-edge px-4 py-3">
      <p className="b-eyebrow leading-[16px] text-b-fg/50">{label}</p>
      <p className={cn("mt-1 text-[26px] leading-[32px] font-bold tabular-nums", tone)}>{value}</p>
    </div>
  );
}

function Count({ n, tone }: { n: number; tone?: string }) {
  return (
    <td className={cn("px-3 py-2 text-right tabular-nums", n === 0 ? "text-b-fg/20" : tone)}>
      {n}
    </td>
  );
}
