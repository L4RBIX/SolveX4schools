"use client";

import { FeatureRow, type FeatureRowProps } from "./feature-row";
import { Footer } from "./footer";
import { GetStarted } from "./get-started";
import { Hero } from "./hero";
import { Nav } from "./nav";
import { NovaSection } from "./nova-section";
import { SolveXWordmark } from "./app/school-chrome";
import { useLocale } from "@/components/sx/i18n";
import { LocaleToggle } from "./locale-toggle";
import type { Locale } from "@schools/curriculum/types";
import { YEAR_ONE_LANGUAGE_LABEL } from "@schools/curriculum/source-of-truth";

/**
 * The public site.
 *
 * This is the cloned landing runtime, rebranded — the same floating pill nav
 * with its scroll-revealed CTA, the same hero composition and clip machinery,
 * the same alternating feature rows with their quintic reveal and
 * viewport-gated video, the same CTA band and footer.
 *
 * ## What was dropped, and why
 *
 * **The stats band.** Three hardcoded marketing figures. We have no such
 * numbers, and a school director is exactly the reader who would ask where
 * they came from.
 *
 * **The testimonials.** Quotes attributed to students, parents and teachers who
 * do not exist. Fabricated outcomes are the fastest way to lose a pilot.
 *
 * **The subject tabs.** They enumerate a catalogue from grade 5 to college.
 * We teach one programme to one year group; the months are on `/program`,
 * where they are real.
 *
 * Nothing was dropped for being hard to adapt. Everything dropped was a claim
 * we cannot make.
 */

const ORIGIN = "/assets/original/brilliant/brilliant.org";

/*
 * The Computer Science clip. Each row seeks to a different point in its 17.4s
 * runtime — three rows opening on the same frame reads as a mistake.
 *
 * RELEASE BLOCKER, art not code: this clip is Brilliant's, and its second scene
 * is a Python lesson — `print(...)`, `else:`, `and`, `False` — captioned
 * "Python" in display type. Its poster frame IS that scene, so until autoplay
 * starts, all three rows of a landing page for a C++17 course show the word
 * Python at a parent. Row two (`startAt: 6`) then opens inside it.
 *
 * Not fixed here on purpose. Replacing Brilliant-derived artwork is reserved to
 * the owner, and re-seeking the rows past the Python scene would hide the
 * caption while leaving the poster — a fix that looks like one and is not. The
 * honest repair is our own footage, the same way the hero card below already
 * has its own.
 */
const CS = {
  webm: `${ORIGIN}/videos/homepage/courses/cs-refresh.webm`,
  poster: `${ORIGIN}/videos/homepage/courses/posters/cs-refresh.png`,
} as const;

const COPY: Record<Locale, {
  navStart: string;
  heroHeading: string; heroBody: string; heroPrimary: string; heroSecondary: string;
  novaHeading: string; novaBody: string;
  rows: { heading: string; body: string }[];
  ctaHeading: string; ctaLabel: string;
  footer: { title: string; links: { label: string; href: string }[] }[];
  legal: string;
}> = {
  kk: {
    navStart: "Оқуды бастау",
    heroHeading: "Есеп шығару арқылы бағдарламалауды үйрен",
    heroBody:
      `9-сыныпқа арналған тоғыз айлық спорттық бағдарламалау бағдарламасы. ${YEAR_ONE_LANGUAGE_LABEL} тілінде, нөлден бастап. Қысқа түсіндіру — және бірден практика. Уақыттың 70 пайызы есеп шығаруға кетеді.`,
    heroPrimary: "Оқуды бастау",
    heroSecondary: "Мектептерге",
    novaHeading: "Nova — сенің көмекшің",
    novaBody:
      "Ол дайын жауап бермейді. Алдымен өзің бір нәрсе жасап көресің, содан кейін Nova дұрыс сұрақты қояды және сен ойлағанша күтеді.",
    rows: [
      {
        heading: "Түсінгенше ойнайсың",
        body: "Әр сабақ көрнекі және интерактивті. Жаттап алудың орнына ұғыммен жұмыс істейсің: болжайсың, тексересің, қателесесің, түзетесің.",
      },
      {
        heading: "Ойлануға мәжбүрлейді",
        body: "Сұрақтар білетініңнің шетін тауып, содан сәл әрі қарай итереді. Дәл қай жерде тұрып қалғаның көрінеді.",
      },
      {
        heading: "Жұмыс істеген код әлі дәлел емес",
        body: "Бағдарламаң өтті ме — жеткіліксіз. Бейтаныс есеп, қағазда қадамдап тексеру, қатені табу және шешімді өз сөзіңмен түсіндіру — бесеуі бөлек тексеріледі.",
      },
    ],
    ctaHeading: "Қыркүйекте бастаймыз",
    ctaLabel: "Оқуды бастау",
    footer: [
      { title: "Бағдарлама", links: [
        { label: "Оқу жылы", href: "/program" },
        { label: "Қыркүйек", href: "/course/1" },
      ]},
      { title: "Оқушыға", links: [
        { label: "Басты бет", href: "/home" },
        { label: "Прогресс", href: "/you" },
      ]},
    ],
    legal: "SolveX4Schools — 9-сыныпқа арналған спорттық бағдарламалау бағдарламасы.",
  },
  ru: {
    navStart: "Начать обучение",
    heroHeading: "Учись программировать, решая задачи",
    heroBody:
      `Девятимесячная программа спортивного программирования для 9 класса. На ${YEAR_ONE_LANGUAGE_LABEL}, с нуля. Короткое объяснение — и сразу практика. 70 процентов времени уходит на решение задач.`,
    heroPrimary: "Начать обучение",
    heroSecondary: "Для школ",
    novaHeading: "Nova — твой помощник",
    novaBody:
      "Он не выдаёт готовый ответ. Сначала ты сам что-то пробуешь, потом Nova задаёт нужный вопрос и ждёт, пока ты подумаешь.",
    rows: [
      {
        heading: "Играешь, пока не станет понятно",
        body: "Каждый урок наглядный и интерактивный. Вместо заучивания — работа с понятием: предсказываешь, проверяешь, ошибаешься, исправляешь.",
      },
      {
        heading: "Заставляет думать",
        body: "Вопросы находят край того, что ты знаешь, и подталкивают чуть дальше. Видно, где именно ты застреваешь.",
      },
      {
        heading: "Работающий код — ещё не доказательство",
        body: "Программа прошла тесты — этого мало. Незнакомая задача, ручная прокрутка на бумаге, поиск ошибки и объяснение своими словами проверяются отдельно.",
      },
    ],
    ctaHeading: "Начинаем в сентябре",
    ctaLabel: "Начать обучение",
    footer: [
      { title: "Программа", links: [
        { label: "Учебный год", href: "/program" },
        { label: "Сентябрь", href: "/course/1" },
      ]},
      { title: "Ученику", links: [
        { label: "Главная", href: "/home" },
        { label: "Прогресс", href: "/you" },
      ]},
    ],
    legal: "SolveX4Schools — программа спортивного программирования для 9 класса.",
  },
};

export function PublicLanding() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;
  const c = COPY[loc];

  const rows: FeatureRowProps[] = c.rows.map((r, i) => ({
    heading: r.heading,
    body: r.body,
    tone: (["sky", "mint", "peach"] as const)[i % 3],
    mediaSide: i % 2 === 0 ? "left" : "right",
    video: { ...CS, startAt: [0, 6, 12][i % 3] },
  }));

  return (
    <div className="min-h-screen bg-b-white">
      <Nav
        wordmark={<SolveXWordmark tone="light" />}
        wordmarkHref="/"
        wordmarkLabel="SolveX4Schools"
        /* No "Sign in". There is no sign-in: identity is an anonymous cookie,
           and a control labelled "Войти" that silently drops the reader on the
           dashboard is a promise the product does not keep. One CTA, and it
           says what it does. */
        signIn={null}
        getStarted={{ label: c.navStart, href: "/home" }}
        trailing={<LocaleToggle locale={loc} onChange={setLocale} />}
      />

      {/* The hero sits on its own full-bleed paper band; the padding clears the
          fixed pill bar (16px inset + 56px tall). */}
      <div className="bg-b-paper pt-[72px]">
        <Hero
          /* A real SolveX lesson: the task, the code being written, the
             program compiling and running in the browser, and the check going
             green. The three feature rows below keep the reference footage —
             only this card, which is the page's claim about what you are
             signing up for, shows our own product.

             RELEASE BLOCKER, art not code: this recording predates the move to
             C++17. Its frame shows `print((int(a) + int(b) - 1) % 7 + 1)` and
             the caption «Бағдарламаң input() арқылы оқитын мәтін», so the one
             card that claims to show OUR product shows a Python one. It needs
             re-recording against a C++ lesson; nothing in this file can fix
             it. */
          clip={{
            webm: "/videos/solvex/lesson-coding.webm",
            poster: "/videos/solvex/lesson-coding.png",
            width: 1360,
            height: 888,
          }}
          heading={c.heroHeading}
          body={c.heroBody}
          primary={{ label: c.heroPrimary, href: "/home" }}
          secondary={{ label: c.heroSecondary, href: "/schools" }}
          badges={[]}
          /* CoFo Robert is commercially licensed and cannot ship. Plex carries
             the display line and, unlike the serif, has the Kazakh diacritics. */
          headingFontClass="font-sx-sans"
        />
      </div>

      <NovaSection heading={c.novaHeading} body={c.novaBody} />

      <div className="flex flex-col gap-24 bg-b-white py-20 lg:gap-40 lg:py-28">
        {rows.map((row) => (
          <FeatureRow key={row.heading} {...row} />
        ))}
      </div>

      <GetStarted heading={c.ctaHeading} cta={c.ctaLabel} ctaHref="/home" />

      <Footer
        wordmark={<SolveXWordmark tone="light" />}
        columns={c.footer}
        legal={c.legal}
        social={false}
      />
    </div>
  );
}
