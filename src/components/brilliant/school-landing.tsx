"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { Hero } from "./hero";
import { SolveXWordmark } from "./app/school-chrome";

/**
 * The public landing.
 *
 * The cloned hero, rebranded — same split composition, same 76px display
 * headline, same rounded video card with the seek-and-retry autoplay machinery,
 * same `.b-press` CTA physics that push the button into its own edge. Only the
 * words, the destinations and the display face changed.
 *
 * The award laurels are gone: SolveX4Schools has no App Store Editors' Choice,
 * and keeping a badge that says otherwise would be a fabricated credential.
 *
 * The right-hand clip stays an animated product demonstration and is already
 * the right subject — it is the Computer Science scene, showing code being
 * written and run. Replacing it with a lesson recording is queued work, not a
 * reason to drop the panel.
 */
export function SchoolLanding() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;

  return (
    <div className="min-h-dvh bg-b-paper font-b-sans text-b-ink">
      {/* The floating pill nav, rebranded. */}
      <div className="b-shell pt-4">
        <nav className="flex h-[58px] items-center justify-between rounded-full border border-[#E4E4E4] bg-b-white px-6">
          <SolveXWordmark tone="light" />

          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-[#E4E4E4]">
              {(["kk", "ru"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={loc === code}
                  className={
                    "h-8 w-10 cursor-pointer text-[13px] font-bold uppercase transition-colors " +
                    (loc === code ? "bg-b-ink text-b-white" : "text-b-muted hover:text-b-ink")
                  }
                >
                  {code}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="b-press inline-flex items-center justify-center rounded-full bg-b-ink px-5 py-2 text-[15px] font-medium text-b-white hover:-translate-y-px"
            >
              {t(L.start, loc)}
            </Link>
          </div>
        </nav>
      </div>

      <Hero
        heading={
          loc === "kk"
            ? "Бағдарламалауды есеп шығару арқылы үйрен"
            : "Учись программировать, решая задачи"
        }
        body={
          loc === "kk"
            ? "9-сыныпқа арналған тоғыз айлық спорттық бағдарламалау бағдарламасы. Әр сабақ — қысқа түсіндіру, содан кейін бірден практика. Уақыттың 70 пайызы есеп шығаруға кетеді."
            : "Девятимесячная программа спортивного программирования для 9 класса. Каждый урок — короткое объяснение и сразу практика. 70 процентов времени уходит на решение задач."
        }
        primary={{
          label: loc === "kk" ? "Оқуды бастау" : "Начать обучение",
          href: "/",
        }}
        secondary={{
          label: loc === "kk" ? "Мұғалімге" : "Для учителя",
          href: "/paths",
        }}
        badges={[]}
        /* CoFo Robert cannot ship. IBM Plex Sans carries the display line and
           keeps the Kazakh diacritics that the serif never had. */
        headingFontClass="font-sx-sans"
      />
    </div>
  );
}
