import type { Locale, Localized } from "@schools/curriculum/types";

/**
 * Interface strings.
 *
 * The cloned runtime is hardcoded English throughout — "Jump back in",
 * "Start", "Check", "Continue", "Lessons", "Exercises". A Kazakh curriculum
 * inside an English chrome does not read as bilingual, it reads as broken, so
 * every visible label a component owns moves here and arrives as a prop.
 *
 * Kept UI-independent (no React) so the same strings serve the components, the
 * adapters and anything server-rendered.
 *
 * Technical syntax stays English in both languages: `if`, `for`, `return`,
 * `print`. Translating keywords would teach a language that does not exist.
 */

export const L = {
  /* --- brand ------------------------------------------------------------ */
  brand: { kk: "SolveX4Schools", ru: "SolveX4Schools" },
  programme: {
    kk: "Спорттық бағдарламалау",
    ru: "Спортивное программирование",
  },
  programmeSub: {
    kk: "Есеп шығара отырып бағдарламалауды үйрен",
    ru: "Учись программировать, решая задачи",
  },
  grade9: { kk: "9-СЫНЫП", ru: "9 КЛАСС" },
  foundational: { kk: "НЕГІЗГІ КУРС", ru: "БАЗОВЫЙ КУРС" },

  /* --- navigation ------------------------------------------------------- */
  navHome: { kk: "Басты бет", ru: "Главная" },
  navCourses: { kk: "Бағдарлама", ru: "Программа" },
  navYou: { kk: "Прогресс", ru: "Прогресс" },

  /* --- home ------------------------------------------------------------- */
  welcome: { kk: "Сәлем", ru: "Привет" },
  askPlaceholder: { kk: "Нені түсінгің келеді?", ru: "Что хочешь разобрать?" },
  ask: { kk: "Сұрау", ru: "Спросить" },
  jumpBackIn: { kk: "Жалғастыр", ru: "Продолжить" },
  start: { kk: "Бастау", ru: "Начать" },
  streakPrompt: {
    kk: "Серияны бастау үшін 3 есеп шығар",
    ru: "Реши 3 задачи, чтобы начать серию",
  },
  practiceGoal: { kk: "АПТАЛЫҚ МАҚСАТ", ru: "ЦЕЛЬ НА НЕДЕЛЮ" },
  practiceOf: { kk: "минуттың", ru: "минут из" },

  /* --- courses / roadmap ------------------------------------------------ */
  yearRoadmap: { kk: "Оқу жылы", ru: "Учебный год" },
  yearRoadmapSub: {
    kk: "Қыркүйектен мамырға дейінгі тоғыз ай",
    ru: "Девять месяцев с сентября по май",
  },
  yourPath: { kk: "Сенің бағдарламаң", ru: "Твоя программа" },
  complete: { kk: "аяқталды", ru: "пройдено" },

  /* --- gameboard -------------------------------------------------------- */
  jumpHere: { kk: "Осы жерден бастау", ru: "Начать отсюда" },
  monthComplete: { kk: "Ай аяқталды", ru: "Месяц пройден" },
  notOpenYet: { kk: "Әлі ашылмаған", ru: "Ещё не открыт" },
  inPreparation: { kk: "Дайындалуда", ru: "В работе" },

  /* --- lesson chrome ---------------------------------------------------- */
  check: { kk: "Тексеру", ru: "Проверить" },
  continue: { kk: "Жалғастыру", ru: "Продолжить" },
  tryAgain: { kk: "Қайта көру", ru: "Ещё раз" },
  getHelp: { kk: "Көмек", ru: "Помощь" },
  why: { kk: "Неге?", ru: "Почему?" },
  startOver: { kk: "Басынан", ru: "Сначала" },
  next: { kk: "Келесі", ru: "Далее" },
  lessonDone: { kk: "Сабақ аяқталды", ru: "Урок пройден" },
  reportProblem: { kk: "Қате туралы хабарлау", ru: "Сообщить об ошибке" },
  readAloud: { kk: "Дауыстап оқу", ru: "Прочитать вслух" },
  close: { kk: "Жабу", ru: "Закрыть" },
  chatWithTutor: { kk: "Көмекшімен сөйлесу", ru: "Поговорить с помощником" },
  answerWithVoice: { kk: "Дауыспен жауап беру", ru: "Ответить голосом" },

  /* --- verdict ---------------------------------------------------------- */
  correct: { kk: "Дұрыс", ru: "Верно" },
  wrong: { kk: "Әзірге дұрыс емес", ru: "Пока неверно" },
  partial: { kk: "Бір бөлігі дұрыс", ru: "Часть верна" },
  /**
   * The fourth state. NOT a failure and not a pass — nothing was measured.
   * Losing this distinction is the regression that would tell a 14-year-old
   * they got an explanation "wrong" when nobody graded it.
   */
  unmeasured: { kk: "Әлі өлшенбеген", ru: "Ещё не измерено" },
  correctAnswerIs: { kk: "Дұрыс жауап", ru: "Правильный ответ" },
  savedForTeacher: {
    kk: "Жауабың сақталды — оны мұғалім оқиды",
    ru: "Ответ сохранён — его прочитает учитель",
  },
  notAutoGraded: {
    kk: "Бұл тапсырма автоматты бағаланбайды",
    ru: "Это задание не оценивается автоматически",
  },

  /* --- Koji / tutor bubbles --------------------------------------------- */
  kojiWrong: {
    kk: "Әзірге дұрыс емес. Бірге қарайық па? «Көмек» түймесін бас.",
    ru: "Пока не то. Разберём вместе? Нажми «Помощь».",
  },
  kojiPartial: {
    kk: "Бір бөлігі дұрыс. Қалғанын тағы бір қарап шық.",
    ru: "Часть верна. Посмотри остальное ещё раз.",
  },

  /* --- lesson content --------------------------------------------------- */
  yourAnswer: { kk: "Сенің жауабың", ru: "Твой ответ" },
  writeAnswer: { kk: "Жауабыңды жаз", ru: "Напиши ответ" },
  yourTest: { kk: "Сенің тексеру мысалың", ru: "Твой тест" },
  examples: { kk: "Мысалдар", ru: "Примеры" },
  hiddenTests: (n: number): Localized => ({
    kk: `Тағы ${n} жасырын тексеру бар — үлгіні көшіру жеткіліксіз`,
    ru: `Ещё ${n} скрытых теста — скопировать пример недостаточно`,
  }),
  fixedVersion: { kk: "Түзетілген нұсқа", ru: "Исправленный вариант" },
  whichLine: { kk: "Қате жолды таңда", ru: "Выбери строку с ошибкой" },
  teacherLooksFor: { kk: "Мұғалім нені іздейді", ru: "Что смотрит учитель" },
  explainInOwnWords: { kk: "Өз сөзіңмен жаз", ru: "Напиши своими словами" },
  oralTask: {
    kk: "Бұл тапсырманы мұғалімге ауызша орындайсың",
    ru: "Это задание ты выполняешь устно учителю",
  },
  visualiserPending: {
    kk: "Бұл көрнекілік әлі дайын емес",
    ru: "Эта визуализация ещё не готова",
  },
  sandboxPending: {
    kk: "Кодты орындау қызметі әлі қосылмаған. Шешіміңді сақтап, мұғаліммен тексер.",
    ru: "Сервис запуска кода ещё не подключён. Сохрани решение и проверь с учителем.",
  },
  run: { kk: "Жүгірту", ru: "Запустить" },
  submit: { kk: "Тапсыру", ru: "Отправить" },
  understood: { kk: "Түсіндім", ru: "Понятно" },

  /* --- verification modes (PDF p.6) ------------------------------------- */
  verifyUnseen: { kk: "Бейтаныс есеп", ru: "Незнакомая задача" },
  verifyTrace: { kk: "Қолмен орындау", ru: "Ручная прокрутка" },
  verifyFindBug: { kk: "Қатені табу", ru: "Поиск ошибки" },
  verifyOral: { kk: "Ауызша түсіндіру", ru: "Устное объяснение" },
  verifyDelayed: { kk: "Қайта шешу", ru: "Повторное решение" },

  /* --- units ------------------------------------------------------------ */
  minutes: { kk: "мин", ru: "мин" },
  hours: { kk: "сағат", ru: "часов" },
  line: { kk: "Жол", ru: "Строка" },
} as const;

export function t(value: Localized, locale: Locale): string {
  return value[locale];
}

/** `n сабақ` / `n уроков`, for the gameboard course card. */
export function lessonsLabel(n: number, locale: Locale): string {
  return locale === "kk" ? `${n} сабақ` : `${n} ${plural(n, "урок", "урока", "уроков")}`;
}

/** `n тапсырма` / `n заданий`. */
export function tasksLabel(n: number, locale: Locale): string {
  return locale === "kk"
    ? `${n} тапсырма`
    : `${n} ${plural(n, "задание", "задания", "заданий")}`;
}

/**
 * Russian needs three plural forms and getting it wrong is the kind of thing a
 * 14-year-old notices immediately. Kazakh does not inflect the noun after a
 * numeral at all, which is why the callers above branch rather than share.
 */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
