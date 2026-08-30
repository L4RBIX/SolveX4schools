import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the overview screen needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. This file is additive and covers exactly one surface: the
 * first screen — the KPI band, the attention queue, the stretch list, the class
 * trend, the two compact lists and the assessment strip.
 *
 * Nothing here duplicates `TL`. Where the overview needs a word `TL` already
 * owns — «Требуют внимания», «Готовы к сложному», «Показать основание» — the
 * component reads `TL`, because two catalogue entries for one word is how two
 * screens start saying different things.
 *
 * Same rules as `TL`: no identifier, no machine vocabulary, Kazakh written in
 * the product's register rather than translated from the Russian, and no noun
 * inflected after a numeral («3 күн», never «3 күндер»).
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the headline band ------------------------------------------------- */
  summaryTitle: { kk: "Сынып жағдайы", ru: "Состояние класса" },
  /**
   * The class exists and nobody is in it yet.
   *
   * A real state — a class row is created before anyone is enrolled — and the
   * one the whole overview has to be guarded against. Rendering the usual bands
   * against an empty roster produced eleven zeroes and, worse, the sentence
   * «Сейчас никто не требует особого внимания. Это хороший результат.» An empty
   * class is not a good result; it is an empty class.
   */
  noLearnersTitle: { kk: "Бұл сыныпта әзірге оқушы жоқ", ru: "В этом классе пока нет учеников" },
  noLearnersHint: {
    kk: "Оқушыларды сыныпқа қосқан соң, осы бетте олардың жұмысы бойынша сандар пайда болады.",
    ru: "Как только учеников запишут в класс, на этой странице появятся числа по их работе.",
  },
  /**
   * Said once, at the top, rather than repeated under every tile.
   *
   * The second sentence is the one that matters: a teacher who has seen a
   * dashboard print `0%` for a child nobody measured stops believing the other
   * numbers too.
   */
  summaryDescription: {
    kk: "Барлық сандар таңдалған кезеңге қатысты. Өлшенбеген нәрсе нөл болып көрсетілмейді.",
    ru: "Все числа — за выбранный период. То, что не измерено, не показывается нулём.",
  },

  /**
   * The disclosure's own label, wherever a band explains how it was BUILT.
   *
   * Phrased as the question a teacher would ask, because that is what a closed
   * `<details>` has to answer before anyone opens it. One label, reused by the
   * situation line, the trend and the two pattern lists: four different
   * questions over four identical disclosures would be four things to read.
   */
  numbersHint: { kk: "Бұл сандар қалай шығады?", ru: "Как посчитаны эти числа?" },
  /**
   * What the arrow between two numbers means, said out loud.
   *
   * «2 → 18» was legible only on hover: the sentence lived in a `title` and an
   * `sr-only` span, so a teacher looking at the screen had no way to know which
   * side was which or over what span. One visible caption over the row costs a
   * line and removes the guess.
   */
  /** Completion, with the denominator named: of those who started, not of the class. */
  completedOfStarted: { kk: "Бастағандардың ішінен аяқтаған", ru: "Завершили из начавших" },
  comparisonCaption: {
    kk: "Алдыңғы кезең → осы кезең",
    ru: "Прошлый период → этот период",
  },

  /* --- attention queue --------------------------------------------------- */
  /** The disclosure label over the queue. The ordering rule is inside it. */
  queueOrderHint: { kk: "Тізім қалай реттелген?", ru: "Как отсортирован список?" },
  attentionDescription: {
    kk: "Тізім реттелген: жоғарыда — сіздің араласуыңыз ең көп нәрсені өзгертетін жағдай. Әр жол себебін атайды.",
    ru: "Список отсортирован: сверху то, где ваше вмешательство изменит больше всего. Каждая строка называет причину.",
  },
  /** The empty state, and it is a good outcome rather than a missing one. */
  attentionCalm: {
    kk: "Бұл — жақсы нәтиже. Бірде-бір оқушыда араласуды талап ететін белгі жоқ.",
    ru: "Это хороший результат. Ни у кого нет признаков, требующих вмешательства.",
  },
  /** Heading over the revealed evidence. Never the failure class itself. */
  namedMistake: { kk: "Аталған қате", ru: "Названная ошибка" },
  /**
   * The sentence under the evidence.
   *
   * The point of the affordance is that a teacher who disagrees can be shown
   * what the claim rests on instead of being argued with, so the panel says out
   * loud that the claim rests on nothing else.
   */
  evidenceDispute: {
    kk: "Қорытынды тек осы әрекеттерге негізделген. Келіспесеңіз, соңғы сөз сізде.",
    ru: "Вывод построен только на этих попытках. Если вы не согласны, последнее слово за вами.",
  },
  /** Accessible name for the row link. The visible name is the learner's. */
  openStudent: { kk: "Оқушының парақшасын ашу", ru: "Открыть карточку ученика" },
  collapseList: { kk: "Жию", ru: "Свернуть" },

  /* --- stretch ----------------------------------------------------------- */
  stretchDescription: {
    kk: "Бұл оқушылар өз бетінше шешіп жүр. Оларға күрделірек тапсырма беруге болады.",
    ru: "Эти ученики решают самостоятельно. Им можно дать задание сложнее.",
  },

  /* --- trend ------------------------------------------------------------- */
  trendTitle: { kk: "Сынып динамикасы", ru: "Динамика класса" },
  trendDescription: {
    kk: "Кезең ішінде шешілген тапсырмалар және алдыңғы дәл сондай ұзақтықтағы кезеңмен салыстыру.",
    ru: "Решённые задания за период и сравнение с предыдущим периодом такой же длины.",
  },
  /**
   * The comparison is over total practice minutes, not the median.
   *
   * `TL.kpiPracticeMedian` names a different quantity, and reusing it here
   * would put one label on two numbers that do not have to move together.
   */
  comparePractice: { kk: "Жаттығу уақыты, жиыны", ru: "Время практики, всего" },

  /* --- weakest skills ---------------------------------------------------- */
  weakestSkillsTitle: { kk: "Ең әлсіз дағдылар", ru: "Самые слабые навыки" },
  weakestSkillsDescription: {
    kk: "Әр жолда — сол дағды бойынша өз бетінше нәтиже көрсеткен оқушылар саны және жиі кездесетін қате.",
    ru: "В каждой строке — сколько учеников показали самостоятельный результат по навыку и какая ошибка встречается чаще.",
  },
  allSkills: { kk: "Барлық дағдылар", ru: "Все навыки" },
  emptySkills: {
    kk: "Дағдылар бойынша дерек әлі жиналмаған.",
    ru: "Данных по навыкам пока не накопилось.",
  },

  /* --- hardest lessons --------------------------------------------------- */
  hardestLessonsTitle: { kk: "Ең қиын сабақтар", ru: "Самые трудные уроки" },
  hardestLessonsDescription: {
    kk: "Бастағандардың қаншасы аяғына жеткені және олардың қаншасы көмексіз істегені.",
    ru: "Сколько начавших дошли до конца и сколько из них обошлись без подсказок.",
  },
  allLessons: { kk: "Барлық сабақтар", ru: "Все уроки" },
  emptyLessons: {
    kk: "Сабақтар бойынша дерек әлі жоқ.",
    ru: "Данных по урокам пока нет.",
  },

  /* --- assessment strip -------------------------------------------------- */
  allAssessments: { kk: "Тексерістерді ашу", ru: "Открыть проверки" },

  /* --- the quiet rail ---------------------------------------------------- */
  /**
   * The counters, at the foot of the page.
   *
   * Deliberately not «Числа за период»: the roster size in the first tile is
   * not windowed, and a heading that says it is would be the band lying about
   * one of its own four numbers. The three that ARE windowed say so under
   * themselves.
   */
  railTitle: { kk: "Қосымша сандар", ru: "Дополнительные числа" },
} as const;

export type TeacherOverviewExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/**
 * How many separate episodes a finding rests on.
 *
 * The count, not the identifiers: `episodeIds` are database keys and a teacher
 * has no use for them, but «повторилось в четырёх отдельных попытках» is a fact
 * they can weigh against what they saw in the room.
 */
export function basedOnEpisodes(n: number): Localized {
  return {
    kk: `${n} бөлек әрекетке негізделген`,
    ru: `Основано на ${n} ${p(n, "попытке", "попытках", "попытках")}`,
  };
}

/** «3 ученика · 7 раз» — how far a named mistake has spread and how often. */
export function mistakeSpread(learners: number, occurrences: number): Localized {
  return {
    kk: `${learners} оқушы · ${occurrences} рет`,
    ru: `${learners} ${p(learners, "ученик", "ученика", "учеников")} · ${occurrences} ${p(
      occurrences,
      "раз",
      "раза",
      "раз",
    )}`,
  };
}

/**
 * The judge-outage count.
 *
 * Phrased as something that happened to the measurement, never to the learner:
 * nobody was marked wrong, and the sentence has to say so on its own because it
 * is read next to a completion count that this outage silently deflates.
 */
export function unmeasuredCodingCount(n: number): Localized {
  return {
    kk: `${n} оқушының коды өлшенбеді`,
    ru: `Не измерен код у ${n} ${p(n, "ученика", "учеников", "учеников")}`,
  };
}

/**
 * Work a person has to read.
 *
 * Not a warning any more. Until migration 0021 this counted answers the
 * platform had thrown away; now it counts answers waiting on the teacher, and
 * the overview links to the queue rather than apologising for an absence.
 */
export function awaitingReadingCount(n: number): Localized {
  return {
    kk: `${n} жұмыс мұғалім оқуын күтуде`,
    ru: `${n} ${p(n, "работа ждёт", "работы ждут", "работ ждут")} чтения учителем`,
  };
}

/**
 * What the required-work denominator actually counts.
 *
 * «10 / 240» reads as *the class is 4% through the course*, and it is not that.
 * The numerator counts (learner, lesson) pairs where the completion policy is
 * satisfied; the denominator is every enrolled learner multiplied by every
 * published lesson of THIS month. So 240 is not a course, it is twenty children
 * times twelve September lessons, and a class that finishes September perfectly
 * still reads 240 / 240 with eight months to go.
 *
 * The formula is untouched. This sentence is the whole fix: it names both sides
 * and says what the figure is not.
 */
export function requiredWorkBasis(enrolled: number, lessons: number): Localized {
  /*
   * «пары «ученик — урок»» was the first attempt and a reviewer stopped on it:
   * nobody in a school says "pairs", and a caption that needs a defensive
   * paragraph is a caption written for the wrong reader. The same fact, said
   * the way a teacher already counts: each learner's own progress through this
   * month's lessons, added up.
   */
  return {
    kk: `Әр оқушы бойынша бөлек саналады: ${enrolled} оқушы × осы айдағы ${lessons} сабақ. Бұл — бүкіл жылдың үлесі емес, тек осы ай.`,
    ru: `Считается по каждому ученику отдельно: ${enrolled} ${p(enrolled, "ученик", "ученика", "учеников")} × ${lessons} ${p(lessons, "урок", "урока", "уроков")} этого месяца. Это не доля всего года — только текущий месяц.`,
  };
}

/** Expands the attention queue past its initial rows. */
export function showMoreLearners(n: number): Localized {
  return {
    kk: `Тағы ${n} оқушыны көрсету`,
    ru: `Показать ещё ${n} ${p(n, "ученика", "учеников", "учеников")}`,
  };
}
