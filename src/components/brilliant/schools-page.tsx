"use client";

import { Footer } from "./footer";
import { Nav } from "./nav";
import { SolveXWordmark } from "./app/school-chrome";
import { useLocale } from "@/components/sx/i18n";
import { LocaleToggle } from "./locale-toggle";
import type { Locale } from "@schools/curriculum/types";
import { PROGRAMME_FACTS, TASK_TARGETS } from "@schools/curriculum/source-of-truth";

/**
 * "For schools".
 *
 * Deliberately one page and no funnel. The secondary CTA on the landing has to
 * go somewhere real, and a school director following it wants the programme's
 * actual parameters and a way to make contact — not a lead-capture sequence.
 *
 * Every figure is read from the curriculum manifest, so this page cannot drift
 * from the programme it describes.
 */

const COPY: Record<Locale, {
  navStart: string;
  h1: string; lede: string;
  factsTitle: string;
  facts: { k: string; v: string }[];
  howTitle: string; how: string[];
  contactTitle: string; contactBody: string;
}> = {
  kk: {
    navStart: "Оқуды бастау",
    h1: "Мектептерге",
    lede: "Тоғыз айлық спорттық бағдарламалау бағдарламасы, 9-сынып. Нөлден бастап, қазақ және орыс тілінде.",
    factsTitle: "Бағдарлама параметрлері",
    facts: [
      { k: "Сынып", v: `${PROGRAMME_FACTS.grade}-сынып, ${PROGRAMME_FACTS.ageRange} жас` },
      { k: "Ұзақтығы", v: `~${PROGRAMME_FACTS.weeks.value} апта, қыркүйектен мамырға` },
      { k: "Сабақтар", v: `аптасына ${PROGRAMME_FACTS.sessionsPerWeek}, әрқайсысы ${PROGRAMME_FACTS.sessionMinutes} минут` },
      { k: "Платформада", v: `аптасына кемінде ~${PROGRAMME_FACTS.platformMinutesPerWeek.value} минут` },
      { k: "Барлығы", v: `жылына кемінде ~${PROGRAMME_FACTS.totalLearningHours.value} сағат` },
      { k: "Практика", v: `${Math.round(PROGRAMME_FACTS.practiceRatio * 100)}% практика / ${Math.round(PROGRAMME_FACTS.theoryRatio * 100)}% түсіндіру` },
      { k: "Тапсырмалар", v: `~${TASK_TARGETS.totalTasks.value}, оның ~${TASK_TARGETS.fullyIndependentSolutions.value} толық дербес` },
      { k: "Тіл", v: "Python" },
    ],
    howTitle: "Қалай өтеді",
    how: [
      "1-сабақ: мұғалім дайын мысалды ойлау барысын дауыстап айта отырып талдайды, содан кейін оқушылар оның бақылауымен есеп шығарады.",
      "Сабақтар арасында: платформада кемінде ~40 минут жаттығу. Тапсырма күрделілігі деңгейге қарай бейімделеді.",
      "2-сабақ: 2–3 есептен тұратын шағын жарыс, одан кейін ортақ талдау және қателермен жұмыс.",
    ],
    contactTitle: "Байланыс",
    contactBody: "Пилотқа қатысты сұрақтар бойынша мектеп әкімшілігі арқылы хабарласыңыз.",
  },
  ru: {
    navStart: "Начать обучение",
    h1: "Для школ",
    lede: "Девятимесячная программа спортивного программирования для 9 класса. С нуля, на казахском и русском.",
    factsTitle: "Параметры программы",
    facts: [
      { k: "Класс", v: `${PROGRAMME_FACTS.grade}-й, ${PROGRAMME_FACTS.ageRange} лет` },
      { k: "Длительность", v: `~${PROGRAMME_FACTS.weeks.value} недель, сентябрь — май` },
      { k: "Занятия", v: `${PROGRAMME_FACTS.sessionsPerWeek} в неделю по ${PROGRAMME_FACTS.sessionMinutes} минут` },
      { k: "На платформе", v: `минимум ~${PROGRAMME_FACTS.platformMinutesPerWeek.value} минут в неделю` },
      { k: "Всего", v: `минимум ~${PROGRAMME_FACTS.totalLearningHours.value} часов в год` },
      { k: "Практика", v: `${Math.round(PROGRAMME_FACTS.practiceRatio * 100)}% практики / ${Math.round(PROGRAMME_FACTS.theoryRatio * 100)}% объяснения` },
      { k: "Заданий", v: `~${TASK_TARGETS.totalTasks.value}, из них ~${TASK_TARGETS.fullyIndependentSolutions.value} полностью самостоятельных` },
      { k: "Язык", v: "Python" },
    ],
    howTitle: "Как это устроено",
    how: [
      "Занятие 1: учитель разбирает готовый пример, проговаривая ход мысли вслух, затем ученики решают под его наблюдением.",
      "Между занятиями: минимум ~40 минут практики на платформе. Сложность подстраивается под уровень.",
      "Занятие 2: небольшое соревнование из 2–3 задач, затем общий разбор и работа над ошибками.",
    ],
    contactTitle: "Связаться",
    contactBody: "По вопросам пилота обращайтесь через администрацию школы.",
  },
};

export function SchoolsPage() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;
  const c = COPY[loc];

  return (
    <div className="min-h-screen bg-b-white">
      <Nav
        wordmark={<SolveXWordmark tone="light" />}
        wordmarkHref="/"
        wordmarkLabel="SolveX4Schools"
        /* No "Sign in": identity is an anonymous cookie and there is nothing
           to sign into. Same decision as the landing page. */
        signIn={null}
        getStarted={{ label: c.navStart, href: "/home" }}
        trailing={<LocaleToggle locale={loc} onChange={setLocale} />}
      />

      <main className="bg-b-paper pt-[120px] pb-20 lg:pb-28">
        <div className="b-shell">
          <h1 className="max-w-[16ch] font-sx-sans text-[40px] leading-[1.08] font-semibold tracking-[-0.02em] text-b-ink sm:text-[56px] lg:text-[68px]">
            {c.h1}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.5] text-b-muted sm:text-[21px]">
            {c.lede}
          </p>
        </div>
      </main>

      <section className="bg-b-white py-20 lg:py-24">
        <div className="b-shell">
          <h2 className="text-[24px] leading-[1.2] font-semibold text-b-ink sm:text-[28px]">
            {c.factsTitle}
          </h2>
          <dl className="mt-8 grid gap-x-12 gap-y-0 sm:grid-cols-2">
            {c.facts.map((f) => (
              <div
                key={f.k}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-b-line py-4"
              >
                <dt className="text-[15px] text-b-muted">{f.k}</dt>
                <dd className="text-[16px] font-medium text-b-ink tabular-nums">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-b-paper py-20 lg:py-24">
        <div className="b-shell">
          <h2 className="text-[24px] leading-[1.2] font-semibold text-b-ink sm:text-[28px]">
            {c.howTitle}
          </h2>
          <ol className="mt-8 grid gap-6 lg:grid-cols-3">
            {c.how.map((step, i) => (
              <li
                key={i}
                className="rounded-[20px] border border-b-line bg-b-white p-7"
              >
                <span className="font-sx-mono text-[13px] font-medium text-b-green">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[16px] leading-[1.55] text-b-muted">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-b-white py-20 lg:py-24">
        <div className="b-shell">
          <h2 className="text-[24px] leading-[1.2] font-semibold text-b-ink sm:text-[28px]">
            {c.contactTitle}
          </h2>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55] text-b-muted">
            {c.contactBody}
          </p>
        </div>
      </section>

      <Footer
        wordmark={<SolveXWordmark tone="light" />}
        columns={[]}
        legal={
          loc === "kk"
            ? "SolveX4Schools — 9-сыныпқа арналған спорттық бағдарламалау бағдарламасы."
            : "SolveX4Schools — программа спортивного программирования для 9 класса."
        }
        social={false}
      />
    </div>
  );
}
