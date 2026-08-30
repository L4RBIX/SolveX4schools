import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the class × skill surface needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. Everything below is additive and belongs to exactly one
 * page: the skills matrix, the per-skill summary table, and the skill detail
 * drawer.
 *
 * The rules are `TL`'s rules. No identifier, no machine vocabulary, no English.
 * Kazakh is written in the product's register rather than translated from the
 * Russian, and no noun is inflected after a numeral («3 күн», never «3 күндер»).
 *
 * One word is deliberately absent from this file and from the page: **mastery**.
 * There is no percentage of a skill anywhere in this product, because a mastery
 * number needs difficulty calibration and a cause for most failures, and the
 * system has neither. The five evidence states are the whole vocabulary.
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the two views ----------------------------------------------------- */
  /**
   * The view switcher.
   *
   * Two ways of cutting the same payload, and they are named by their unit of
   * analysis rather than by their shape: «Дағды бойынша» is a list of skills,
   * «Оқушы бойынша» is the class × skill grid. «Список / Таблица» would have
   * named the widget, which tells a teacher nothing about which one answers
   * their question.
   */
  viewLabel: { kk: "Көрініс", ru: "Вид" },
  viewBySkill: { kk: "Дағды бойынша", ru: "По навыкам" },
  viewByLearner: { kk: "Оқушы бойынша", ru: "По ученикам" },
  /**
   * The disclosure that holds the prose the band used to open with.
   *
   * What stays on screen is the caveat that changes how a number is READ
   * (`statesNote`). What moves in here is what explains how the view is BUILT —
   * the axes, and the fact that an absent measurement is not a poor result.
   */
  howToRead: { kk: "Мұны қалай оқу керек?", ru: "Как это читать?" },
  /** The distribution column in the skill list. Short: the header renders in caps. */
  colSpread: { kk: "Сынып бөлінісі", ru: "Распределение" },

  /* --- the matrix -------------------------------------------------------- */
  /**
   * Says what the axes are AND that untouched skills are on the grid.
   *
   * The audit's finding #17: the old table listed only skills somebody had
   * attempted, which let the page imply the curriculum is whatever the class
   * happens to have opened. The sentence is here because the fix is invisible
   * unless it is stated.
   */
  matrixDescription: {
    kk: "Жолдар — өтілген дағдылар, бағандар — оқушылар. Әлі ешкім бастамаған дағдылар да көрсетілген.",
    ru: "Строки — пройденные навыки, столбцы — ученики. Навыки, которые ещё никто не начинал, тоже показаны.",
  },
  /** The corner cell of the heatmap: names both axes at once. */
  matrixCorner: { kk: "Дағды / оқушы", ru: "Навык / ученик" },
  matrixCaption: {
    kk: "Сынып оқушылары бойынша дағды жағдайлары",
    ru: "Состояния по навыкам для учеников класса",
  },
  /** Why there are no numbers in the grid. */
  statesNote: {
    kk: "Дағды пайызбен өлшенбейді. Бес күй — жүйе шынымен көре алатыны.",
    ru: "Навык не измеряется в процентах. Пять состояний — это то, что система действительно видит.",
  },
  legendTitle: { kk: "Шартты белгілер", ru: "Обозначения" },
  legendNotStartedNote: {
    kk: "«Басталмаған» — өлшеу жоқ дегенді білдіреді, нашар нәтиже емес.",
    ru: "«Не начато» означает отсутствие измерения, а не плохой результат.",
  },

  /* --- summary table ----------------------------------------------------- */
  summaryTitle: { kk: "Дағдылар бойынша жиынтық", ru: "Сводка по навыкам" },
  summaryDescription: {
    kk: "Әр дағды бойынша сыныптың қалай бөлінгені, әрекет саны және жиі кездесетін қате.",
    ru: "Как класс распределён по каждому навыку, сколько попыток и какая ошибка встречается чаще всего.",
  },
  summaryCaption: {
    kk: "Әр дағды бойынша сынып жағдайы",
    ru: "Состояние класса по каждому навыку",
  },

  /* --- search and emptiness ---------------------------------------------- */
  searchSkill: { kk: "Дағдыны іздеу", ru: "Поиск навыка" },
  searchNoSkill: {
    kk: "Сұрауға сәйкес дағды табылмады.",
    ru: "По запросу навык не найден.",
  },
  noSkillsYet: {
    kk: "Бағдарлама әлі бірде-бір дағды енгізген жоқ.",
    ru: "Программа ещё не ввела ни одного навыка.",
  },
  /** Short form for a matrix row nobody has touched. The full sentence is `TL.skillNobodyStarted`. */
  nobodyStartedShort: { kk: "Ешкім бастамаған", ru: "Никто не начинал" },
  /** `topMistake === null`. Not a gap in the data — an absence of a repeated named mistake. */
  noNamedMistake: { kk: "Аталған қате жоқ", ru: "Названных ошибок нет" },

  /* --- headline counts --------------------------------------------------- */
  kpiSkillsTaught: { kk: "Өтілген дағды", ru: "Пройдено навыков" },
  kpiSkillsUntouched: { kk: "Ешкім бастамаған", ru: "Никто не начинал" },
  kpiSkillsWithReview: { kk: "Қайта қарау керек", ru: "Нужно повторить" },
  kpiSkillsWithIndependent: { kk: "Өз бетінше дәлел бар", ru: "Есть самостоятельные" },
  /** The qualifier under the last two tiles: they count SKILLS, not learners. */
  kpiAtLeastOne: { kk: "кемі бір оқушыда", ru: "хотя бы у одного ученика" },

  /* --- detail drawer ----------------------------------------------------- */
  openSkill: { kk: "Дағды туралы толығырақ", ru: "Подробнее о навыке" },
  close: { kk: "Жабу", ru: "Закрыть" },
  detailIndependentLearners: {
    kk: "Өз бетінше дәлелі бар",
    ru: "Есть самостоятельные решения",
  },
  detailAssistedLearners: { kk: "Көмекпен шешкені бар", ru: "Решали с помощью" },
  detailDistribution: { kk: "Сынып қалай бөлінген", ru: "Как распределён класс" },
  detailMistakes: { kk: "Жиі кездесетін қателер", ru: "Частые ошибки" },
  detailNoMistakes: {
    kk: "Бұл дағдыда қайталанатын аталған қате тіркелмеген.",
    ru: "По этому навыку повторяющихся названных ошибок не зафиксировано.",
  },
  mistakesCaption: {
    kk: "Осы дағдыдағы аталған қателер",
    ru: "Названные ошибки по этому навыку",
  },
  detailBlocks: { kk: "Ең қиын тапсырмалар", ru: "Самые трудные задания" },
  detailBlocksNote: {
    kk: "Ең қиынынан бастап реттелген.",
    ru: "Отсортированы от самого трудного.",
  },
  detailNoBlocks: {
    kk: "Бұл дағдыны тексеретін тапсырмалар әлі жазылмаған.",
    ru: "Задания, проверяющие этот навык, ещё не написаны.",
  },
  blocksCaption: {
    kk: "Осы дағдыны тексеретін тапсырмалар",
    ru: "Задания, проверяющие этот навык",
  },
  colBlockKind: { kk: "Тапсырма түрі", ru: "Тип задания" },
  colStruggling: { kk: "Қиналған әрекет", ru: "Трудных попыток" },
  colOccurrences: { kk: "Қайталанған", ru: "Повторений" },
  colLastSeen: { kk: "Соңғы рет", ru: "Последний раз" },
  detailStrongest: { kk: "Сенімді орындайтындар", ru: "Уверенно справляются" },
  detailStrongestNote: {
    kk: "«Өз бетінше» күйіндегі оқушылар.",
    ru: "Ученики в состоянии «Самостоятельно».",
  },
  detailNoStrongest: {
    kk: "Әлі ешкімде өз бетінше шешу дәлелі жоқ.",
    ru: "Пока ни у кого нет подтверждённых самостоятельных решений.",
  },
  detailNeedsHelp: { kk: "Көмек қажет", ru: "Нужна помощь" },
  detailNeedsHelpNote: {
    kk: "«Қайта қарау керек» күйіндегі оқушылар.",
    ru: "Ученики в состоянии «Нужно повторить».",
  },
  detailNoNeedsHelp: {
    kk: "Қазір бұл дағды бойынша ешкімге қайта қарау қажет емес.",
    ru: "Сейчас по этому навыку никому не нужно повторение.",
  },
  detailLearners: { kk: "Барлық оқушылар", ru: "Все ученики" },
  detailLearnersCaption: {
    kk: "Осы дағды бойынша әр оқушының жағдайы",
    ru: "Состояние каждого ученика по этому навыку",
  },
} as const;

export type TeacherSkillsExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/** «4 оқушыда» / «У 4 учеников» — how many learners a named mistake touched. */
export function learnersAffected(n: number): Localized {
  return {
    kk: `${n} оқушыда`,
    ru: `У ${n} ${p(n, "ученика", "учеников", "учеников")}`,
  };
}

/** «7 рет» / «7 раз» — how many times it happened, across those learners. */
export function occurrencesCount(n: number): Localized {
  return {
    kk: `${n} рет`,
    ru: `${n} ${p(n, "раз", "раза", "раз")}`,
  };
}

/** «3-айда енгізілген» / «Введён в месяце 3» — when the curriculum introduced it. */
export function introducedInMonth(n: number): Localized {
  return {
    kk: `${n}-айда енгізілген`,
    ru: `Введён в месяце ${n}`,
  };
}
