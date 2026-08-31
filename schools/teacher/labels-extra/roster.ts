import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the class roster needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here — this file is additive and covers exactly one screen:
 * `/teacher/students`, the roster table and its filter bar.
 *
 * The rule this file exists to keep: the old panel put ~14
 * `loc === "kk" ? … : …` ternaries directly in the component, so not one of its
 * visible strings was reachable by the language test. Everything the roster says
 * is either in `TL`, in here, or arrives as a `Localized` on the payload.
 *
 * Same register as `TL`. Kazakh is written rather than translated from the
 * Russian, and no noun is inflected after a numeral — «3 күн», never
 * «3 күндер».
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the page ---------------------------------------------------------- */
  /**
   * What the roster is, and — the load-bearing half — that a row opens.
   *
   * A clickable row with no affordance is a feature only the person who built
   * it knows about, so the sentence says so rather than relying on a cursor.
   *
   * It no longer prints above the table on every visit. It is the first line of
   * the `howToRead` disclosure, because it explains how the surface works and
   * not how any of its numbers should be read.
   */
  rosterDescription: {
    kk: "Сыныптағы әр оқушы. Жолды бассаңыз, оқушының жеке парағы ашылады.",
    ru: "Каждый ученик класса. Нажатие на строку открывает страницу ученика.",
  },
  /** Screen-reader name of the table. An unnamed table is a wall of numbers. */
  rosterCaption: {
    kk: "Сынып оқушыларының тізімі",
    ru: "Список учеников класса",
  },

  /* --- the filter bar ---------------------------------------------------- */
  /** `aria-label` of the status chip row. A control group needs a name. */
  filterByStatus: { kk: "Жағдайы бойынша сүзу", ru: "Фильтр по состоянию" },
  /** The reset chip. Pressed when no status is selected. */
  filterAll: { kk: "Барлығы", ru: "Все" },
  /** Clears both the search box and the status chips. */
  clearFilters: { kk: "Сүзгіні алып тастау", ru: "Сбросить фильтры" },
  /**
   * Nothing matched the chips.
   *
   * Deliberately distinct from `searchNoMatch` and from «нет данных»: the class
   * is not empty and nothing is broken, the teacher has simply narrowed it.
   */
  filterNoMatch: {
    kk: "Таңдалған жағдай бойынша оқушы жоқ.",
    ru: "Учеников с выбранным состоянием нет.",
  },

  /* --- reading the table -------------------------------------------------- */
  /**
   * The «?» that opens the two sentences the table used to print above itself.
   *
   * The band's description was `rosterDescription` rendered at 14px on every
   * visit forever. It explains how the surface WORKS rather than how a number
   * is READ, so it moved in here — the caveats that change a reading
   * («Өлшенбеген», «Тапсырма ашылмаған», the counts beside every share) are
   * still printed in the cells themselves, where the number is.
   */
  howToRead: { kk: "Бұл кесте қалай оқылады?", ru: "Как читать эту таблицу?" },
  /**
   * What the chevron does, named in full.
   *
   * Four counts left the main grid — they are drill-down facts, not scan facts
   * — so the sentence lists them, otherwise a teacher who used the old eleven
   * columns has no way of knowing they are still there.
   */
  detailsHint: {
    kk: "Аттың жанындағы жебені бассаңыз, қалған сандар ашылады: көмекпен шешілгені, әрекет саны, жаттығу уақыты, белсенді күндер және алынған көмек.",
    ru: "Стрелка рядом с именем открывает остальные числа: решено с помощью, попытки, практика, рабочие дни и помощь.",
  },
  /** Accessible name of that chevron. `aria-expanded` carries the state. */
  moreNumbers: { kk: "Қосымша сандар", ru: "Дополнительные числа" },

  /* --- cells ------------------------------------------------------------- */
  today: { kk: "Бүгін", ru: "Сегодня" },
  yesterday: { kk: "Кеше", ru: "Вчера" },
  /**
   * The learner has opened nothing in this window.
   *
   * Not «не измерено»: the topic is not a measurement that failed, it is a
   * lesson that was never opened, and the two read differently to a teacher
   * deciding who to sit next to.
   */
  noTopic: { kk: "Тапсырма ашылмаған", ru: "Задание не открывалось" },
  /** Title on the learner's name, where the name is a link. */
  openStudent: { kk: "Оқушының парағын ашу", ru: "Открыть страницу ученика" },
  /**
   * Why this name is not a link.
   *
   * A learner with no subject has no episodes, so there is no detail page to
   * open — but they stay on the roster, because the one child the old dashboard
   * structurally could not show was exactly this one.
   */
  noStudentPage: {
    kk: "Жұмыс басталмаған — жеке парақ ашылмайды",
    ru: "Работа не начата — отдельная страница не открывается",
  },
} as const;

export type RosterExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/**
 * «3 күн бұрын» / «3 дня назад» — short enough for a table cell.
 *
 * `TL.daysAgo` is the finding sentence («Нет активности 3 дня») and is far too
 * long for a column, so this is the cell form of the same fact. Kazakh does not
 * inflect after the numeral; Russian needs three forms.
 */
export function daysAgoShort(n: number): Localized {
  return {
    kk: `${n} күн бұрын`,
    ru: `${n} ${p(n, "день", "дня", "дней")} назад`,
  };
}

/**
 * The title on a «+2» after the first finding, so the count has a word behind
 * it rather than being a bare numeral nobody can interpret.
 */
export function moreFindings(n: number): Localized {
  return {
    kk: `тағы ${n} белгі`,
    ru: `ещё ${n} ${p(n, "признак", "признака", "признаков")}`,
  };
}
