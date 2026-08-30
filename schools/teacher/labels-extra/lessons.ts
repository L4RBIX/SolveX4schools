import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the lessons view needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. This file is additive and covers exactly one screen: the
 * lesson table, the per-block drill-down, and the unauthored-lesson list.
 *
 * ## The question this screen exists to answer
 *
 * «Оқушы қиналып жүр ме, әлде тапсырманың өзінде мәселе бар ма?» — is the
 * learner struggling, or is the task itself bad? Every string below is written
 * for that reading. Nothing here judges a lesson: the words name what was
 * counted («бастаған», «аяқтаған», «жауапты ашқан») and the teacher supplies the
 * conclusion.
 *
 * Same register and the same rules as `TL`: no identifier, no machine
 * vocabulary, Kazakh written rather than translated, and no noun inflected after
 * a numeral («5 тапсырма», never «5 тапсырмалар»).
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the screen -------------------------------------------------------- */
  /**
   * Under the section heading. States the question, not a conclusion.
   *
   * One line. The second sentence it used to carry («посмотрите одно задание по
   * всему классу») was an instruction for using the table, and the table now
   * says that itself: every row opens.
   */
  lessonsQuestion: {
    kk: "Оқушы қиналып жүр ме, әлде тапсырманың өзінде мәселе бар ма?",
    ru: "Ученику трудно — или дело в самом задании?",
  },
  /**
   * Which denominator the completion share uses.
   *
   * Stated, not implied: «аяқтаған / бастаған» and «аяқтаған / сыныптағы бәрі»
   * are two different numbers, and a teacher who does not know which one is on
   * screen cannot act on either.
   *
   * This explains how the number was BUILT rather than how it must be READ, so
   * it lives behind `howCounted` — and the two counts it describes are printed
   * beside every bar, so nothing that can be checked has been hidden.
   */
  completionDenominator: {
    kk: "Аяқтау үлесі — сабақты бастағандардың ішінен есептеледі. Бастағандар саны сыныптағы оқушы санымен қатар көрсетілген.",
    ru: "Доля завершивших считается от тех, кто начал урок. Рядом с числом начавших указано число учеников в классе.",
  },
  /**
   * The control on every disclosure that explains an arithmetic.
   *
   * Deliberately a question, and deliberately the same question in all three
   * places: a teacher who has opened one of these knows what the others hold.
   */
  howCounted: { kk: "Бұл қалай есептеледі?", ru: "Как это считается?" },

  /* --- headline counts --------------------------------------------------- */
  lessonsAuthored: { kk: "Жазылған сабақтар", ru: "Написанные уроки" },
  lessonsNobodyStarted: { kk: "Ешкім бастамаған", ru: "Никто не начал" },
  lessonsNobodyCompleted: { kk: "Бастаған бар, аяқтаған жоқ", ru: "Начали, но не завершил никто" },
  lessonsUnwritten: { kk: "Мазмұны жазылмаған", ru: "Содержание не написано" },
  notOpenToStudents: { kk: "Оқушыларға ашылмайды", ru: "Ученикам не открываются" },

  /* --- lesson table ------------------------------------------------------ */
  colCompletionRate: { kk: "Аяқтау үлесі", ru: "Доля завершивших" },
  colCompletedIndependently: { kk: "Өз бетінше аяқтаған", ru: "Завершили сами" },
  lessonsTableCaption: {
    kk: "Ай сабақтары бойынша сынып: бастағандар, аяқтағандар және ең қиын тапсырмалар",
    ru: "Класс по урокам месяца: начавшие, завершившие и самые трудные задания",
  },
  /** The lesson row is a control. It needs a name beyond the lesson title. */
  showBlocks: { kk: "Тапсырмаларын көрсету", ru: "Показать задания" },
  close: { kk: "Жабу", ru: "Закрыть" },
  /**
   * The hardest and drop-off columns before the lesson has been opened.
   *
   * The payload names those blocks by id, and an id is not a label. The block's
   * place in the lesson and its kind come with the lesson's own tasks, so the
   * cell says how to see them instead of printing a handle.
   */
  expandToSee: { kk: "Тапсырмаларды ашыңыз", ru: "Раскройте задания" },
  noDropOff: { kk: "Тоқтап қалу байқалмаған", ru: "Остановок не видно" },
  notAttemptedYet: { kk: "Әлі әрекет жасалмаған", ru: "Попыток ещё не было" },
  noAuthoredLessons: {
    kk: "Бұл айда жазылған сабақ жоқ.",
    ru: "В этом месяце нет написанных уроков.",
  },

  /* --- blocks ------------------------------------------------------------ */
  colStruggling: { kk: "Қиналған әрекет", ru: "Трудные попытки" },
  colMedianSubmissions: { kk: "Жіберілім (медиана)", ru: "Отправок (медиана)" },
  blocksTableCaption: {
    kk: "Сабақ тапсырмалары бойынша сынып: әрекет, шешім, көмек және қиналу",
    ru: "Класс по заданиям урока: попытки, решения, помощь и трудности",
  },
  /**
   * What «қиналған әрекет» counts.
   *
   * `struggle_class in ('stuck','thrash')` — out of ideas, or changing several
   * things at once with nothing moving. Named in the teacher's words, because
   * the machine's own two words are not for a classroom.
   */
  blocksNote: {
    kk: "«Қиналған әрекет» — оқушы тоқтап қалған немесе бірнеше нәрсені бірден өзгертіп, нәтиже шықпаған әрекеттер.",
    ru: "«Трудные попытки» — попытки, где ученик остановился или менял несколько вещей сразу, а результат не двигался.",
  },
  /** Short form of `TL.blockNotMachineGraded`, for a chip inside a row. */
  humanChecked: { kk: "Адам тексереді", ru: "Проверяет человек" },
  /**
   * A grading column on a block a machine cannot grade.
   *
   * Not «0» and not «өлшенбеген»: nothing failed and nothing is missing — the
   * column simply does not apply to this kind of task, permanently.
   */
  notApplicable: { kk: "Қолданылмайды", ru: "Неприменимо" },
  noNamedMistake: { kk: "Аталған қате жоқ", ru: "Названной ошибки нет" },

  /* --- per-learner progress through the open lesson ---------------------- */
  learnerProgressTitle: { kk: "Оқушылардың ілгерілеуі", ru: "Продвижение учеников" },
  learnerProgressNote: {
    kk: "Осы сабақтың міндетті тапсырмаларының қаншасы орындалғаны. Тапсырмалар сабақтағы реті бойынша нөмірленген.",
    ru: "Сколько обязательных заданий этого урока выполнено. Задания пронумерованы в порядке следования в уроке.",
  },

  /* --- unauthored -------------------------------------------------------- */
  unauthoredTitle: { kk: "Мазмұны жазылмаған сабақтар", ru: "Уроки без содержания" },
} as const;

export type LessonsExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */
/*
 * Kazakh does not inflect a noun after a numeral — «5 тапсырма», not
 * «5 тапсырмалар» — while Russian needs three forms. So these branch on locale
 * rather than sharing one plural helper, the same shape `TL`'s own helpers use.
 */

/** A block's place in the lesson: «3-тапсырма» / «Задание 3». Never its id. */
export function taskNumber(n: number): Localized {
  return { kk: `${n}-тапсырма`, ru: `Задание ${n}` };
}

/** How many required tasks a lesson has. */
export function tasksCount(n: number): Localized {
  return {
    kk: `${n} тапсырма`,
    ru: `${n} ${p(n, "задание", "задания", "заданий")}`,
  };
}

/** How often a named mistake was made. Occurrences, not learners. */
export function occurrences(n: number): Localized {
  return {
    kk: `${n} рет`,
    ru: `${n} ${p(n, "раз", "раза", "раз")}`,
  };
}

/**
 * How few learners started this lesson.
 *
 * The one thing the screen is allowed to say about a small sample, and it says
 * exactly that: not «unreliable», not «too early to tell», not a quality tier
 * about the lesson. `startedBy`, read back as a sentence, because «0/1» sitting
 * in a completion column reads as a verdict on the content when it is a
 * statement about how many people are in the measurement.
 *
 * Russian keeps the noun off the verb («Начавших мало — 1 ученик») so one
 * construction is grammatical at every count; Kazakh does not inflect after a
 * numeral, so «3 оқушы» stands as it is.
 */
export function startedByFew(n: number): Localized {
  return {
    kk: `Бастағандар аз — ${n} оқушы`,
    ru: `Начавших мало — ${n} ${p(n, "ученик", "ученика", "учеников")}`,
  };
}

/**
 * Which required tasks a learner still owes, by their place in the lesson.
 *
 * The payload lists them as block ids; the caller resolves each to its position
 * before calling this, so a teacher reads «Қалғаны: 3, 5» rather than a handle.
 */
export function outstandingTasks(numbers: readonly number[]): Localized {
  const list = numbers.join(", ");
  return { kk: `Қалғаны: ${list}`, ru: `Осталось: ${list}` };
}
