"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import {
  EVIDENCE_TONE,
  evidenceLabel,
  type EvidenceState,
  type SkillEvidence,
} from "@schools/presentation/evidence";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { AppHeader } from "./app-header";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "./school-chrome";

/**
 * The learner's own page.
 *
 * Built on the cloned dashboard's shell — the same 1216px column, the same
 * section rhythm, the same card construction — with the numbers replaced by
 * evidence the learner actually produced.
 *
 * ## What is deliberately not here
 *
 * A mastery percentage. Anywhere. The system has no difficulty calibration and
 * most failures carry no attributed cause, so a decimal would be a number
 * invented to look like measurement. The states below are coarser and true.
 *
 * The count of unexplained failures IS shown. It is the honest denominator for
 * everything else on the page, and hiding it would let a reader over-trust the
 * rest.
 */

interface StatePayload {
  hasState: boolean;
  computedAt: string | null;
  summary: {
    episodes: number;
    soloSolved: number;
    assistedSolved: number;
    interventions: number;
    unexplainedFailures: number;
  };
  skills: SkillEvidence[];
  action: { type: string; skill: string | null } | null;
}

export function YouEvidence() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;
  const [data, setData] = useState<StatePayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/learning/state/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: StatePayload) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-b-bg font-b-sans text-white">
      <AppHeader
        active="you"
        links={SCHOOL_NAV(loc)}
        homeHref="/"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <main className="mx-auto w-full max-w-[1216px] px-8 py-8">
        <h1 className="text-[32px] leading-[42px] font-bold">
          {loc === "kk" ? "Сенің дәлелдерің" : "Твои свидетельства"}
        </h1>
        <p className="mt-1 text-white/60">
          {loc === "kk"
            ? "Мұнда пайыз жоқ. Тек нақты не істегенің."
            : "Здесь нет процентов. Только то, что ты действительно сделал."}
        </p>

        {failed ? (
          <Card className="mt-8">
            <p className="text-white/60">
              {loc === "kk"
                ? "Прогресті жүктеу мүмкін болмады."
                : "Не удалось загрузить прогресс."}
            </p>
          </Card>
        ) : !data ? (
          <div className="mt-8 h-32 animate-pulse rounded-[20px] border-2 border-b-edge bg-b-panel/40" />
        ) : (
          <>
            <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat
                label={loc === "kk" ? "Әрекет" : "Попыток"}
                value={data.summary.episodes}
              />
              <Stat
                label={loc === "kk" ? "Өз бетінше шешті" : "Решено самостоятельно"}
                value={data.summary.soloSolved}
                tone="text-b-green-2"
              />
              <Stat
                label={loc === "kk" ? "Көмекпен" : "С помощью"}
                value={data.summary.assistedSolved}
              />
              {/* Shown, never folded away — see the note at the top of this file. */}
              <Stat
                label={loc === "kk" ? "Себебі белгісіз қате" : "Ошибок без причины"}
                value={data.summary.unexplainedFailures}
                tone="text-white/50"
                hint={
                  loc === "kk"
                    ? "Жүйе бұлардың себебін білмейді және білетінін көрсетпейді."
                    : "Система не знает их причину и не делает вид, что знает."
                }
              />
            </section>

            <h2 className="mt-10 text-[20px] leading-[25px] font-bold">
              {loc === "kk" ? "Дағдылар" : "Навыки"}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {data.skills.map((s) => (
                <li key={s.skillId}>
                  <div className="flex items-start gap-4 rounded-[16px] border-2 border-b-edge bg-b-bg px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[16px] leading-6 font-medium",
                          s.state === "not_started" ? "text-white/40" : "text-white",
                        )}
                      >
                        {s.title ? s.title[loc] : s.skillId}
                      </p>
                      {/* The localised summary, not the core's English sentence.
                          Both come from the same counts, so they cannot disagree. */}
                      {s.state !== "not_started" ? (
                        <p className="mt-1 text-[14px] leading-5 text-white/50">
                          {s.summary[loc]}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[13px] leading-5 font-semibold tracking-wide uppercase",
                        EVIDENCE_TONE[s.state as EvidenceState],
                      )}
                    >
                      {evidenceLabel(s.state, loc)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {data.computedAt ? (
              <p className="mt-8 text-[13px] text-white/30">
                {loc === "kk" ? "Соңғы есептеу: " : "Последний расчёт: "}
                {new Date(data.computedAt).toLocaleString(loc === "kk" ? "kk-KZ" : "ru-RU")}
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[20px] border-2 border-b-edge bg-b-bg p-5", className)}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[16px] border-2 border-b-edge bg-b-bg px-5 py-4">
      <p className="b-eyebrow leading-[18px] text-white/60">{label}</p>
      <p className={cn("mt-1 text-[32px] leading-[40px] font-bold tabular-nums", tone)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[13px] leading-4 text-white/40">{hint}</p> : null}
    </div>
  );
}
