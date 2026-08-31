import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the class ranking needs and `TL` does not carry.
 *
 * `schools/teacher/labels.ts` is edited by six workstreams at once, so it is not
 * touched from here. This file covers exactly one screen: the four lenses, the
 * table that shows how each number was made, and the separate list of learners
 * the board will not place.
 *
 * ## The register this screen is written in
 *
 * The word «ұпай» / «балл» does not appear anywhere below, and neither does
 * «рейтинг ұпайы». There is no score on this page. Every column header names a
 * COUNTED QUANTITY — tasks solved unaided, days worked, the change between two
 * windows — because the whole defence of ranking children here is that a teacher
 * can recount the number by hand from the row it sits in.
 *
 * Nothing celebrates. No «жеңімпаз» / «победитель», no «үздік» / «лучший». A
 * teacher shows this to a director; first place is a fact about a count in one
 * class over one window, and the wording keeps it that size.
 *
 * Same rules as `TL`: no identifier, no machine vocabulary, Kazakh written
 * rather than translated, and no noun inflected after a numeral
 * («12 оқушы», never «12 оқушылар»).
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the lens picker --------------------------------------------------- */
  /** Accessible name of the four-way radiogroup. */
  lensLabel: { kk: "Рейтинг өлшемі", ru: "Критерий рейтинга" },

  /* --- the formula disclosure -------------------------------------------- */
  /**
   * The control that opens the payload's own `explanation`.
   *
   * A `<details>` summary, not a tooltip and not a «подробнее» that goes to
   * another screen: it is keyboard-operable, it is announced as a disclosure, it
   * prints, and it is one click from every row of the board. A teacher reads the
   * formula once and then reads names; a teacher challenged on the ranking opens
   * it in front of the person challenging them. The formula being REACHABLE is
   * what separates this page from a score — being permanently in the way is not.
   */
  rankingHint: { kk: "Орын қалай анықталады?", ru: "Как определяется место?" },
  /** Why the extra columns are there. */
  componentsNote: {
    kk: "Санның құрамдас бөліктері қатар тұр — есепті қолмен тексеруге болады.",
    ru: "Составляющие числа стоят рядом — расчёт можно проверить вручную.",
  },
  /** Rendered only when two learners actually share a place. */
  tiesNote: {
    kk: "Сандары тең оқушылар бір орынды бөліседі.",
    ru: "Ученики с равными числами делят одно место.",
  },

  /* --- table ------------------------------------------------------------- */
  colRank: { kk: "Орын", ru: "Место" },
  /** Beside a shared rank number. Lower case: it is an annotation, not a status. */
  tiedRank: { kk: "ортақ орын", ru: "общее место" },
  tableCaption: {
    kk: "Сынып ішіндегі рейтинг: орын, оқушы, есептелген сан және оның құрамы",
    ru: "Рейтинг внутри класса: место, ученик, подсчитанное число и его составляющие",
  },

  /* --- the ranked quantity, per lens ------------------------------------- */
  /*
   * These are the value column's headers, and each one names what was counted
   * rather than what it is worth. «Сложных заданий» is a number of tasks;
   * «Изменение» is a difference between two counts of tasks. Neither is a score
   * and neither is called one.
   */
  valueIndependent: { kk: "Өз бетінше шешілген тапсырма", ru: "Решено самостоятельно, заданий" },
  valueImprovement: { kk: "Өзгеріс, тапсырма", ru: "Изменение, заданий" },
  valueConsistency: { kk: "Жұмыс істеген күн", ru: "Дней с работой" },
  valueChallenge: { kk: "Күрделі тапсырма", ru: "Сложных заданий" },

  /* --- empty and unranked ------------------------------------------------ */
  noOneRanked: {
    kk: "Бұл кезеңде ешкімге орын берілген жоқ.",
    ru: "За этот период место никому не присвоено.",
  },
  /**
   * The sentence that keeps the second list from reading as a bottom of the table.
   *
   * Stated in full rather than implied by placement: a learner with three
   * episodes is not the weakest learner in the class, and a teacher who reads
   * the list as «вот эти хуже всех» has been misled by the page rather than by
   * the data.
   */
  unrankedNote: {
    kk: "Бұл оқушылар соңғы орында тұрған жоқ. Оларда салыстыруға жеткілікті дерек жоқ, сондықтан орын берілмейді.",
    ru: "Эти ученики не на последнем месте. У них недостаточно данных для сравнения, поэтому место не присваивается.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/**
 * How much of the class the board actually placed.
 *
 * The denominator is not decoration: a lens that ranked four of twenty-one
 * learners is describing four learners, and a teacher reading a «1 орын» has to
 * be able to see that at a glance.
 *
 * Kazakh does not inflect after a numeral and does not take the Russian
 * «n из m» shape comfortably, so the two languages are phrased independently
 * rather than one being a gloss of the other.
 */
export function rankedOfClass(ranked: number, enrolled: number): Localized {
  return {
    kk: `Рейтингке ${ranked} оқушы кірді, сыныпта — ${enrolled} оқушы`,
    ru: `В рейтинге ${ranked} из ${enrolled} ${p(enrolled, "ученика", "учеников", "учеников")}`,
  };
}

/** The count under the unranked heading. Never phrased as a shortfall. */
export function unrankedCount(n: number): Localized {
  return {
    kk: `${n} оқушы`,
    ru: `${n} ${p(n, "ученик", "ученика", "учеников")}`,
  };
}
