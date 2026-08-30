import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the shell and the shared primitives need and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. This file is additive and covers exactly one area: the
 * chrome (context bar, freshness line, curriculum gate) and the primitive kit in
 * `src/components/teacher/ui.tsx`.
 *
 * Same register and the same rules as `TL`: no identifier, no machine
 * vocabulary, Kazakh written rather than translated, and no noun inflected after
 * a numeral («3 күн», never «3 күндер»).
 */

const p = pluralRu;

export const EXTRA = {
  /**
   * The development bypass, as a chip.
   *
   * The full sentence («мазмұн бекітусіз ашылған») stays on the chip's `title`
   * and in `TL.curriculumDevBypass`; this is the two words that fit in the
   * control bar. It renders only outside production, where `gateFor` is the
   * only thing that sets the flag.
   */
  devMode: { kk: "Көрсетілім режимі", ru: "Демонстрационный режим" },
  /**
   * The disclosure that opens a reason.
   *
   * One word, and it is the question a teacher actually asks. «Что это значит?»
   * was on the freshness line and read as an apology for the interface; «Почему?»
   * beside a state chip reads as what it is — the reason is available.
   */
  why: { kk: "Неге?", ru: "Почему?" },
  /** The demo bypass's own disclosure. Asks what it changes, not why it is on. */
  whatDemoChanges: { kk: "Бұл нені өзгертеді?", ru: "Что это меняет?" },
  /** The freshness disclosure's control: how current these numbers are. */
  whatIsThis: {
    kk: "Сандар қаншалықты жаңа?",
    ru: "Насколько свежие эти числа?",
  },
  /** `aria-label` for the review panel's close button. */
  closePanel: { kk: "Жабу", ru: "Закрыть" },

  /* --- chrome ------------------------------------------------------------ */
  /** `aria-label` for the tab row. It is navigation, so it needs a name. */
  sections: { kk: "Бөлімдер", ru: "Разделы" },
  /** `aria-label` for the curriculum gate group. */
  curriculumStatus: { kk: "Мазмұн жағдайы", ru: "Состояние содержания" },
  /**
   * Approved, but the month is still not being served.
   *
   * `ClassContext.curriculum.open` and `.approval` are two different facts and
   * the dashboard shows both: content can be signed off and still not published.
   */
  curriculumClosed: {
    kk: "Мазмұн оқушыларға ашылмаған",
    ru: "Содержание ученикам не открыто",
  },
  /** The teacher has no classes at all. */
  noClassSelected: {
    kk: "Сынып таңдалмаған.",
    ru: "Класс не выбран.",
  },

  /* --- primitives -------------------------------------------------------- */
  /** `TrendDelta`'s accessible name. Never rendered as a heading. */
  comparedToPrevious: {
    kk: "Алдыңғы дәл сондай ұзақтықтағы кезеңмен салыстырғанда",
    ru: "По сравнению с предыдущим периодом такой же длины",
  },
  /** Legend and column head for the independent series. Fuller than `colIndependent`. */
  chartIndependent: { kk: "Өз бетінше", ru: "Самостоятельно" },
  /** Legend and column head for the assisted series. */
  chartAssisted: { kk: "Көмекпен", ru: "С помощью" },
  /** Caption of the screen-reader table that carries the chart's numbers. */
  chartCaption: {
    kk: "Кезең бойынша шешілген тапсырмалар",
    ru: "Решённые задания по периодам",
  },
  /** The bucket column of that table. */
  chartBucket: { kk: "Кезең", ru: "Период" },
  /** `EvidenceDot`'s group name, when a row shows several. */
  evidenceState: { kk: "Дағды жағдайы", ru: "Состояние по навыку" },
  /** The `Meter` label when the caller has nothing more specific. */
  progressOf: { kk: "Орындалғаны", ru: "Выполнено" },
  /** Sorting is a control, and a control needs a name. */
  sortAscending: { kk: "Өсу ретімен сұрыптау", ru: "Сортировать по возрастанию" },
  sortDescending: { kk: "Кему ретімен сұрыптау", ru: "Сортировать по убыванию" },
  /** Nothing matched the search box. Different from "there is no data". */
  searchNoMatch: {
    kk: "Іздеу сұрауына сәйкес оқушы табылмады.",
    ru: "По запросу ученик не найден.",
  },
  /** Clears the search box. */
  clearSearch: { kk: "Іздеуді тазалау", ru: "Очистить поиск" },
} as const;

export type TeacherExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Events written to the ledger that the reducer has not folded in yet.
 *
 * Phrased impersonally in Russian («Ещё не учтено 2 действия») so one form works
 * for every count; Kazakh does not inflect after a numeral, so it does not need
 * the dance at all.
 */
export function pendingEvents(n: number): Localized {
  return {
    kk: `${n} әрекет әлі есепке алынбаған`,
    ru: `Ещё не учтено ${n} ${p(n, "действие", "действия", "действий")}`,
  };
}

/** «7 оқушының 4-і» / «4 из 7 учеников» — a counted ratio over the roster. */
export function ofStudents(n: number, total: number): Localized {
  return {
    kk: `${total} оқушының ${n}-і`,
    ru: `${n} из ${total} ${p(total, "ученика", "учеников", "учеников")}`,
  };
}
