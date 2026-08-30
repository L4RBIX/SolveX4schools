"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale, Localized } from "@schools/curriculum/types";
import { PROGRAMME_FACTS, TASK_TARGETS } from "@schools/curriculum/source-of-truth";
import { referenceAsset } from "@schools/assets/registry";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { PublicShell } from "../public-shell";
import { AboutContainer } from "./container";
import { SectionHeading } from "./section-heading";

/**
 * `/about` — the product story.
 *
 * ## What is reused
 *
 * The composition, the rhythm and the primitives are the reference About
 * page's: `AboutContainer`'s three-step max-width ladder (432 → 1216 at
 * Brilliant's own 769px breakpoint, which is NOT Tailwind's `lg`),
 * `SectionHeading`'s serif scale, the statement band between sections, and the
 * alternating split where the illustration takes the opposite side each time.
 *
 * ## What is not
 *
 * Every word. The reference's About page is Brilliant's story — its founders,
 * its claims, its numbers. None of that is ours to repeat, and a mission
 * statement borrowed from a competitor is worse than no mission statement.
 *
 * ## Where the numbers come from
 *
 * `PROGRAMME_FACTS` and `TASK_TARGETS`, the same modules `/schools` reads and
 * the curriculum validator asserts against. Nothing on this page is a figure
 * somebody typed into a marketing paragraph, so the page cannot drift from the
 * programme it describes.
 */
export function AboutPage() {
  const { locale } = usePreferences();
  const loc = locale as Locale;

  return (
    <PublicShell>
      <main className="pb-24">
        {/* ---- hero ------------------------------------------------------- */}
        <section className="bg-b-paper px-6 pt-[132px] pb-20 min-[769px]:px-8 min-[769px]:pt-[168px] min-[769px]:pb-28">
          <AboutContainer>
            <p className="b-eyebrow text-b-muted">{t(L.aboutEyebrow, loc)}</p>
            <h1 className="mt-4 max-w-[18ch] font-b-serif text-[40px] leading-[105%] font-medium tracking-[-0.025em] text-b-ink min-[481px]:text-[64px] min-[769px]:text-[76px]">
              {t(L.aboutMission, loc)}
            </h1>
            <p className="mt-6 max-w-[62ch] text-[19px] leading-[1.6] text-b-ink/75">
              {t(L.aboutMissionBody, loc)}
            </p>
          </AboutContainer>
        </section>

        {/* ---- why ------------------------------------------------------- */}
        <Split
          side="right"
          heading={t(L.aboutWhyHeading, loc)}
          body={[t(L.aboutWhyP1, loc), t(L.aboutWhyP2, loc)]}
          bullets={ABOUT_SKILLS.map((s) => s[loc])}
          art={referenceAsset("about-why")}
        />

        {/* ---- statement band -------------------------------------------- */}
        <Band>
          {t(L.aboutBand1, loc)}{" "}
          <em className="font-b-serif not-italic">{t(L.aboutBand1Emph, loc)}</em>
        </Band>

        {/* ---- approach --------------------------------------------------- */}
        <Split
          side="left"
          heading={t(L.aboutApproachHeading, loc)}
          body={[t(L.aboutApproachP1, loc), t(L.aboutApproachP2, loc)]}
          art={referenceAsset("about-approach")}
          figures={[
            {
              value: `${Math.round(PROGRAMME_FACTS.practiceRatio * 100)}%`,
              label: t(L.aboutFigPractice, loc),
            },
            {
              value: `${Math.round(PROGRAMME_FACTS.theoryRatio * 100)}%`,
              label: t(L.aboutFigExplain, loc),
            },
          ]}
        />

        {/* ---- evidence --------------------------------------------------- */}
        <section className="bg-b-paper px-6 py-20 min-[769px]:px-8 min-[769px]:py-28">
          <AboutContainer>
            <SectionHeading className="max-w-[20ch]">
              {t(L.aboutEvidenceHeading, loc)}
            </SectionHeading>
            <p className="mt-6 max-w-[62ch] text-[18px] leading-[1.65] text-b-ink/80">
              {t(L.aboutEvidenceP1, loc)}
            </p>
            <p className="mt-4 max-w-[62ch] text-[18px] leading-[1.65] text-b-ink/80">
              {t(L.aboutEvidenceP2, loc)}
            </p>

            <ul className="mt-10 grid gap-x-10 gap-y-6 min-[769px]:grid-cols-3">
              {ABOUT_EVIDENCE.map((item) => (
                <li key={item.kk} className="border-t-2 border-b-ink/15 pt-4">
                  <span className="text-[17px] leading-[1.5] text-b-ink">{item[loc]}</span>
                </li>
              ))}
            </ul>
          </AboutContainer>
        </section>

        {/* ---- Nova ------------------------------------------------------- */}
        <Split
          side="right"
          heading={t(L.aboutNovaHeading, loc)}
          body={[t(L.aboutNovaP1, loc), t(L.aboutNovaP2, loc)]}
          bullets={ABOUT_NOVA.map((s) => s[loc])}
          art={referenceAsset("about-nova")}
        />

        {/* ---- for schools ------------------------------------------------ */}
        <section className="px-6 py-20 min-[769px]:px-8 min-[769px]:py-28">
          <AboutContainer className="flex flex-col items-start gap-8 min-[769px]:flex-row min-[769px]:items-end min-[769px]:justify-between">
            <div>
              <SectionHeading className="max-w-[16ch]">
                {t(L.aboutSchoolsHeading, loc)}
              </SectionHeading>
              <p className="mt-5 max-w-[52ch] text-[18px] leading-[1.6] text-b-ink/75">
                {t(L.aboutSchoolsBody, loc)}
              </p>
              <p className="mt-4 text-[15px] text-b-muted tabular-nums">
                ~{PROGRAMME_FACTS.weeks.value} {t(L.aboutWeeks, loc)} ·{" "}
                {PROGRAMME_FACTS.sessionsPerWeek}×{PROGRAMME_FACTS.sessionMinutes}{" "}
                {t(L.minutes, loc)} · ~{TASK_TARGETS.totalTasks.value}{" "}
                {t(L.aboutTasks, loc)}
              </p>
            </div>
            <Link
              href="/schools"
              className="b-press inline-flex h-14 shrink-0 items-center rounded-full bg-b-ink px-8 text-[16px] font-medium text-b-white"
            >
              {t(L.aboutSchoolsCta, loc)}
            </Link>
          </AboutContainer>
        </section>
      </main>
    </PublicShell>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The alternating split.
 *
 * The reference paints its illustration through a `::before` with two custom
 * properties, because its art is two different files for mobile and desktop.
 * Ours is one square illustration, so it is an `<Image>` — same layout, same
 * breakpoint, one fewer indirection, and `next/image` gets to size it.
 */
function Split({
  side,
  heading,
  body,
  bullets,
  figures,
  art,
}: {
  side: "left" | "right";
  heading: string;
  body: string[];
  bullets?: string[];
  figures?: { value: string; label: string }[];
  art: string;
}) {
  return (
    <section className="px-6 py-16 min-[769px]:px-8 min-[769px]:py-24">
      <AboutContainer
        className={
          "flex flex-col-reverse items-start justify-center gap-8 " +
          "min-[769px]:items-center min-[769px]:justify-between min-[769px]:gap-16 " +
          (side === "left" ? "min-[769px]:flex-row-reverse" : "min-[769px]:flex-row")
        }
      >
        <div className="flex max-w-full flex-1 flex-col items-start gap-6 text-left min-[769px]:max-w-[520px]">
          <SectionHeading>{heading}</SectionHeading>
          {body.map((p) => (
            <p key={p.slice(0, 24)} className="text-[17px] leading-[1.65] text-b-ink/80">
              {p}
            </p>
          ))}

          {bullets ? (
            <ul className="flex flex-col gap-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[17px] leading-[1.55] text-b-ink/80">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-b-ink/35"
                  />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}

          {figures ? (
            <div className="mt-2 flex gap-10">
              {figures.map((f) => (
                <div key={f.label}>
                  <div className="font-b-serif text-[44px] leading-none font-medium text-b-ink tabular-nums">
                    {f.value}
                  </div>
                  <div className="mt-2 text-[15px] text-b-muted">{f.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 grow basis-0 justify-center">
          <Image
            src={art}
            alt=""
            width={420}
            height={420}
            className="h-auto w-full max-w-[300px] object-contain min-[769px]:max-w-[420px]"
          />
        </div>
      </AboutContainer>
    </section>
  );
}

/**
 * The statement band.
 *
 * One sentence, serif, centred, on the warm ground — the reference's own device
 * for breaking a long page into acts. The reference draws a hand-scrawled
 * underline behind the emphasised words; ours does not, because that scrawl is
 * a Brilliant asset and the band reads without it.
 */
function Band({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-b-ink px-6 py-24 min-[769px]:px-8 min-[769px]:py-32">
      <AboutContainer>
        <p className="mx-auto max-w-[20ch] text-center font-b-serif text-[36px] leading-[115%] font-medium tracking-[-0.02em] text-b-white min-[481px]:text-[52px] min-[769px]:text-[64px]">
          {children}
        </p>
      </AboutContainer>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* content                                                                     */

const ABOUT_SKILLS: Localized[] = [
  { kk: "Есепті бөліктерге бөліп талдау", ru: "Разбирать задачу на части" },
  { kk: "Алгоритм ойлап табу және оны тексеру", ru: "Придумывать алгоритм и проверять его" },
  { kk: "Қатені өз бетінше табу", ru: "Находить свою ошибку самостоятельно" },
  { kk: "Шешімін ауызша қорғау", ru: "Защищать решение вслух" },
  { kk: "Жарыс жағдайында уақытты бөлу", ru: "Распределять время на соревновании" },
];

const ABOUT_EVIDENCE: Localized[] = [
  { kk: "Әрекеттер", ru: "Попытки" },
  { kk: "Өз бетінше шешілген есептер", ru: "Задачи, решённые самостоятельно" },
  { kk: "Көмекпен шешілген есептер", ru: "Задачи, решённые с помощью" },
  { kk: "Айлық тексерулер", ru: "Месячные проверки" },
  { kk: "Өз сөзімен түсіндіру", ru: "Объяснение своими словами" },
  { kk: "Кейінірек қайта шешу", ru: "Повторное решение спустя время" },
];

const ABOUT_NOVA: Localized[] = [
  { kk: "Сұрақтан бастайды, жауаптан емес", ru: "Начинает с вопроса, а не с ответа" },
  { kk: "Көмекті сатылап арттырады", ru: "Наращивает помощь ступенями" },
  { kk: "Қазақша және орысша сөйлейді", ru: "Говорит по-казахски и по-русски" },
  { kk: "Тек сенің жұмысыңды көреді", ru: "Видит только твою работу" },
];
