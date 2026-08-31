import type { Locale, Localized } from "@schools/curriculum/types";

/**
 * Russian needs three plural forms, and getting it wrong is the first thing a
 * child notices.
 *
 * It lived privately in `evidence.ts`, correctly implemented and tested — and
 * every other Russian count in the product ignored it, so the hidden-test
 * counter said «Ещё 1 скрытых теста». Exported from here because this is where
 * strings are built.
 */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  const m10 = n % 10;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

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

  /* --- public navigation ------------------------------------------------ */
  navAbout: { kk: "Біз туралы", ru: "О нас" },
  navForSchools: { kk: "Мектептерге", ru: "Школам" },
  navHelp: { kk: "Анықтама", ru: "Помощь" },
  navPrivacy: { kk: "Құпиялылық", ru: "Конфиденциальность" },
  navTerms: { kk: "Шарттар", ru: "Условия" },
  startLearning: { kk: "Оқуды бастау", ru: "Начать обучение" },
  menu: { kk: "Мәзір", ru: "Меню" },
  footerProduct: { kk: "Өнім", ru: "Продукт" },
  footerLegalCol: { kk: "Құқықтық", ru: "Правовое" },
  footerAccount: { kk: "Аккаунт", ru: "Аккаунт" },
  footerLegal: {
    kk: "SolveX4Schools — 9-сыныпқа арналған спорттық бағдарламалау бағдарламасы.",
    ru: "SolveX4Schools — программа спортивного программирования для 9 класса.",
  },

  /* --- about ------------------------------------------------------------ */
  aboutEyebrow: { kk: "SOLVEX4SCHOOLS ТУРАЛЫ", ru: "О SOLVEX4SCHOOLS" },
  aboutMission: {
    kk: "Есеп шығара алатын ұрпақ өсіріп жатырмыз",
    ru: "Растим поколение сильных решателей задач",
  },
  aboutMissionBody: {
    kk: "SolveX4Schools — мектепке арналған тоғыз айлық бағдарлама. Оқушы бағдарламалауды тыңдап емес, нақты есептер шығара отырып үйренеді.",
    ru: "SolveX4Schools — девятимесячная программа для школы. Ученик учится программировать не слушая, а решая настоящие задачи.",
  },
  aboutWhyHeading: { kk: "Неге бағдарламалау?", ru: "Почему программирование?" },
  aboutWhyP1: {
    kk: "Бағдарламалау — мамандық қана емес, ойлау құралы. Компьютер айтқаныңды дәл орындайды, сондықтан ойыңдағы олқылықты бірден көрсетеді.",
    ru: "Программирование — не только профессия, но и инструмент мышления. Компьютер делает ровно то, что ты сказал, и поэтому сразу показывает пробел в рассуждении.",
  },
  aboutWhyP2: {
    kk: "Сол себепті бағдарлама тек синтаксис үйретпейді. Ол мыналарды жаттықтырады:",
    ru: "Поэтому программа учит не только синтаксису. Она тренирует:",
  },
  aboutBand1: { kk: "Есепті шығару —", ru: "Решить задачу —" },
  aboutBand1Emph: {
    kk: "жауапты еске түсіру емес",
    ru: "не то же самое, что вспомнить ответ",
  },
  aboutApproachHeading: { kk: "Біздің тәсіл", ru: "Наш подход" },
  aboutApproachP1: {
    kk: "Әр сабақ қысқа түсіндірмеден басталады және бірден практикаға көшеді. Түсіндірме — есепке кіріспе, дәріс емес.",
    ru: "Каждый урок начинается с короткого объяснения и сразу переходит к практике. Объяснение — это вход в задачу, а не лекция.",
  },
  aboutApproachP2: {
    kk: "Оқушы болжайды, тексереді, қателеседі, түзетеді. Дәл осы реттілік түсінікті қалыптастырады.",
    ru: "Ученик предполагает, проверяет, ошибается, исправляет. Именно эта последовательность и создаёт понимание.",
  },
  aboutFigPractice: { kk: "практика", ru: "практика" },
  aboutFigExplain: { kk: "түсіндірме", ru: "объяснение" },
  aboutEvidenceHeading: {
    kk: "Прогресс — дәлел, пайыз емес",
    ru: "Прогресс — это свидетельства, а не проценты",
  },
  aboutEvidenceP1: {
    kk: "SolveX ойдан шығарылған пайызды меңгеру деп көрсетпейді. «Циклдер 82%» деген сан өлшем сияқты көрінеді, бірақ ол өлшем емес.",
    ru: "SolveX не выдаёт придуманный процент за освоение темы. Число вроде «Циклы 82%» выглядит как измерение, но им не является.",
  },
  aboutEvidenceP2: {
    kk: "Оның орнына оқушының нақты не істегені жиналады, ал жүйе себебін білмейтін қателер бөлек көрсетіледі — бұл қалғанының шынайы бөлімі.",
    ru: "Вместо этого собирается то, что ученик действительно делал, а ошибки, причину которых система не знает, показываются отдельно — это честный знаменатель для всего остального.",
  },
  aboutNovaHeading: { kk: "Nova — оқу көмекшісі", ru: "Nova — учебный помощник" },
  aboutNovaP1: {
    kk: "Nova дайын жауаптан бастамайды. Алдымен не істеп көргеніңді сұрайды, содан кейін көмекті сатылап арттырады.",
    ru: "Nova не начинает с готового ответа. Сначала спрашивает, что ты уже попробовал, а потом наращивает помощь ступенями.",
  },
  aboutNovaP2: {
    kk: "Көмектің деңгейін модель емес, жүйе шешеді. Бұл маңызды: жауапты беруге бола ма деп сұралған тіл моделі ерте ме, кеш пе «болады» дейді.",
    ru: "Уровень помощи решает система, а не модель. Это важно: языковая модель, которую спрашивают, можно ли выдать ответ, рано или поздно скажет «можно».",
  },
  aboutSchoolsHeading: { kk: "Мектептерге", ru: "Школам" },
  aboutSchoolsBody: {
    kk: "Бағдарлама сабақ кестесіне енгізуге дайын: мұғалімге арналған материал, сынып бойынша прогресс және айлық тексеру бар.",
    ru: "Программа готова к встраиванию в расписание: есть материал для учителя, прогресс по классу и месячная проверка.",
  },
  aboutSchoolsCta: { kk: "Толығырақ", ru: "Подробнее" },
  aboutWeeks: { kk: "апта", ru: "недель" },
  aboutTasks: { kk: "тапсырма", ru: "заданий" },

  /* --- settings: account ------------------------------------------------ */
  accountPersonal: { kk: "Жеке ақпарат", ru: "Личная информация" },
  accountPersonalHint: {
    kk: "Аты мектеп тізімінен алынады және осында өзгертілмейді.",
    ru: "Имя берётся из школьного списка и здесь не меняется.",
  },
  accountName: { kk: "Аты", ru: "Имя" },
  accountSchool: { kk: "Мектеп", ru: "Школа" },
  accountSchoolName: { kk: "Мектеп", ru: "Школа" },
  accountClass: { kk: "Сынып", ru: "Класс" },
  accountNoClass: { kk: "Сыныпқа қосылмаған", ru: "Не зачислен в класс" },
  accountRole: { kk: "Рөл", ru: "Роль" },
  roleStudent: { kk: "Оқушы", ru: "Ученик" },
  roleTeacher: { kk: "Мұғалім", ru: "Учитель" },
  roleAdmin: { kk: "Әкімші", ru: "Администратор" },
  accountSecurity: { kk: "Қауіпсіздік", ru: "Безопасность" },
  accountSecurityHint: {
    kk: "Жаңа құпиясөз кемінде 10 таңба болуы керек.",
    ru: "Новый пароль должен быть не короче 10 символов.",
  },
  passwordChanged: { kk: "Құпиясөз ауыстырылды", ru: "Пароль изменён" },
  accountSession: { kk: "Сессия", ru: "Сессия" },
  accountSessionHint: {
    kk: "Ортақ компьютерде жұмыс істесең — аяқтағанда шық.",
    ru: "Если работаешь за общим компьютером — выходи, когда закончишь.",
  },
  signOutAll: {
    kk: "Барлық құрылғыдан шығу",
    ru: "Выйти на всех устройствах",
  },

  /* --- settings: preferences -------------------------------------------- */
  prefAppearance: { kk: "Безендіру", ru: "Оформление" },
  prefAppearanceHint: {
    kk: "«Авто» құрылғының өз баптауын ұстанады.",
    ru: "«Авто» следует настройке самого устройства.",
  },
  prefTheme: { kk: "Тақырып", ru: "Тема" },
  prefAuto: { kk: "Авто", ru: "Авто" },
  prefLight: { kk: "Жарық", ru: "Светлая" },
  prefDark: { kk: "Қараңғы", ru: "Тёмная" },
  prefMotion: { kk: "Қозғалыс", ru: "Движение" },
  prefMotionHint: {
    kk: "Анимациядан бас айналса, азайтуға болады.",
    ru: "Если от анимации кружится голова, её можно уменьшить.",
  },
  prefMotionReduce: { kk: "Азайту", ru: "Уменьшить" },
  prefMotionFull: { kk: "Толық", ru: "Полное" },
  prefLanguage: { kk: "Тіл", ru: "Язык" },
  prefSound: { kk: "Дыбыс", ru: "Звук" },
  prefNarration: { kk: "Nova дауыстап оқиды", ru: "Nova читает вслух" },
  prefNarrationHint: {
    kk: "Сыныпта құлаққапсыз қоспаған жөн.",
    ru: "В классе лучше не включать без наушников.",
  },
  prefNoVoice: {
    kk: "Бұл құрылғыда сенің тіліңдегі дауыс жоқ, сондықтан дауыстап оқу қолжетімсіз.",
    ru: "На этом устройстве нет голоса для твоего языка, поэтому чтение вслух недоступно.",
  },
  prefSfx: { kk: "Дыбыстық сигналдар", ru: "Звуковые сигналы" },
  prefSfxHint: {
    kk: "Жауап тексерілгендегі қысқа дыбыс.",
    ru: "Короткий звук при проверке ответа.",
  },

  /* --- status pages ----------------------------------------------------- */
  notFoundTitle: { kk: "Бұл бет табылмады", ru: "Страница не найдена" },
  notFoundBody: {
    kk: "Сілтеме ескірген болуы мүмкін немесе мұндай бет ешқашан болмаған.",
    ru: "Возможно, ссылка устарела или такой страницы никогда не было.",
  },
  errorTitle: { kk: "Бір нәрсе бұзылды", ru: "Что-то сломалось" },
  errorBody: {
    kk: "Бұл біздің жағымыздағы қате. Қайталап көр — көбіне көмектеседі.",
    ru: "Это ошибка на нашей стороне. Попробуй ещё раз — чаще всего помогает.",
  },
  goHome: { kk: "Басты бетке", ru: "На главную" },

  /* --- legal ------------------------------------------------------------ */
  legalContents: { kk: "Мазмұны", ru: "Содержание" },
  legalUpdated: { kk: "Жаңартылды", ru: "Обновлено" },

  /* --- help center ------------------------------------------------------ */
  helpTitle: { kk: "Анықтама орталығы", ru: "Справочный центр" },
  helpSubtitle: {
    kk: "Бағдарлама, Nova, аккаунт және деректер туралы сұрақтар",
    ru: "Вопросы о программе, Nova, аккаунте и данных",
  },
  helpSearchLabel: { kk: "Анықтамадан іздеу", ru: "Поиск по справке" },
  helpSearchPlaceholder: { kk: "Нені білгің келеді?", ru: "Что хочешь узнать?" },
  helpNoResults: { kk: "Ештеңе табылмады", ru: "Ничего не нашлось" },
  helpNoResultsHint: {
    kk: "Сұрауыңыз бойынша мақала жоқ:",
    ru: "Нет статей по запросу:",
  },
  helpAllTopics: { kk: "Барлық тақырыптар", ru: "Все темы" },
  helpFound: { kk: "Табылды", ru: "Найдено" },
  helpMoreIn: { kk: "Осы бөлімде тағы", ru: "Ещё в этом разделе" },

  /* --- account + settings ----------------------------------------------- */
  settings: { kk: "Баптаулар", ru: "Настройки" },
  settingsAccount: { kk: "Аккаунт", ru: "Аккаунт" },
  settingsPreferences: { kk: "Параметрлер", ru: "Параметры" },

  /* --- navigation ------------------------------------------------------- */
  navHome: { kk: "Басты бет", ru: "Главная" },
  navCourses: { kk: "Бағдарлама", ru: "Программа" },
  navYou: { kk: "Прогресс", ru: "Прогресс" },

  /* --- home ------------------------------------------------------------- */
  welcome: { kk: "Сәлем", ru: "Привет" },
  /**
   * The greeting when no name is known — which is every learner today, because
   * there is no enrolment and therefore no name to use. A placeholder name in
   * a school product is a child being called something that is not theirs.
   */
  welcomeAnonymous: { kk: "Сәлем!", ru: "Привет!" },
  askPlaceholder: { kk: "Нені түсінгің келеді?", ru: "Что хочешь разобрать?" },
  ask: { kk: "Сұрау", ru: "Спросить" },
  jumpBackIn: { kk: "Жалғастыр", ru: "Продолжить" },
  start: { kk: "Бастау", ru: "Начать" },
  streakPrompt: {
    kk: "Серияны бастау үшін 3 есеп шығар",
    ru: "Реши 3 задачи, чтобы начать серию",
  },
  practiceGoal: { kk: "АПТАЛЫҚ МАҚСАТ", ru: "ЦЕЛЬ НА НЕДЕЛЮ" },
  thisWeek: { kk: "Осы апта", ru: "Эта неделя" },
  weekActive: {
    kk: "Осы аптада жұмыс істеген күндерің",
    ru: "Дней с занятиями на этой неделе",
  },
  weekNothingYet: {
    kk: "Бұл аптада әлі бастаған жоқсың",
    ru: "На этой неделе ты ещё не начинал",
  },

  /* --- courses / roadmap ------------------------------------------------ */
  yearRoadmap: { kk: "Оқу жылы", ru: "Учебный год" },
  yearRoadmapSub: {
    kk: "Қыркүйектен мамырға дейінгі тоғыз ай",
    ru: "Девять месяцев с сентября по май",
  },
  yourPath: { kk: "Сенің бағдарламаң", ru: "Твоя программа" },
  carouselPrev: { kk: "Артқа", ru: "Назад" },
  carouselNext: { kk: "Алға", ru: "Вперёд" },
  complete: { kk: "аяқталды", ru: "пройдено" },

  /* --- gameboard -------------------------------------------------------- */
  jumpHere: { kk: "Осы жерден бастау", ru: "Начать отсюда" },
  monthComplete: { kk: "Ай аяқталды", ru: "Месяц пройден" },
  notOpenYet: { kk: "Әлі ашылмаған", ru: "Ещё не открыт" },
  inPreparation: { kk: "Дайындалуда", ru: "В работе" },

  /* --- differentiation track -------------------------------------------- */
  /**
   * The three names the curriculum uses — Қолдау / Негізгі / Тереңдетілген —
   * live in `TRACK_LABEL` and are rendered from there, because they are
   * curriculum vocabulary and must read identically on a teacher's plan and on
   * a learner's screen. What they do NOT do is mean anything to a fourteen-
   * year-old, so each one ships with a line saying what it changes.
   *
   * The framing is "this month", never "you". The programme is explicit that a
   * level describes a route through a topic and not a label on a child — a
   * learner can be advanced in loops and support in binary search — and a
   * control that reads as a permanent verdict is the one way to turn that into
   * streaming.
   */
  trackTitle: { kk: "Осы айдағы бағытың", ru: "Твой маршрут в этом месяце" },
  trackHint: {
    kk: "Кез келген уақытта ауыстыруға болады. Бұл сен туралы емес, осы ай туралы.",
    ru: "Менять можно когда угодно. Это про месяц, а не про тебя.",
  },
  trackSupportMeans: {
    kk: "Ең қажетті тапсырмалар. Ең қиындары әзірге берілмейді.",
    ru: "Только самое нужное. Самые трудные задания пока не выдаются.",
  },
  trackCoreMeans: {
    kk: "Айдың толық тапсырмалар жиыны.",
    ru: "Полный набор заданий месяца.",
  },
  trackAdvancedMeans: {
    kk: "Толық жиын және қосымша қиын есептер.",
    ru: "Полный набор плюс дополнительные трудные задачи.",
  },

  /* --- lesson chrome ---------------------------------------------------- */
  check: { kk: "Тексеру", ru: "Проверить" },
  continue: { kk: "Жалғастыру", ru: "Продолжить" },
  tryAgain: { kk: "Қайта көр", ru: "Ещё раз" },
  getHelp: { kk: "Көмек", ru: "Помощь" },
  /* Shown beside Check on a task the curriculum has marked optional. The word
     is deliberately "skip" rather than "continue": the learner is declining
     something, and a Continue beside a Check reads as though the answer has
     already been accepted. See `optionalNote` for what sits above it. */
  skipOptional: { kk: "Өткізіп жіберу", ru: "Пропустить" },

  /* The secondary control on a CONTEST problem, and the wording carries the
     difference. «Пропустить» would be a lie: a contest problem is required,
     nothing is waived, and the Finish button brings the learner straight back
     to it. «Вернусь позже» is what actually happens. */
  leaveForLater: { kk: "Кейін ораламын", ru: "Вернусь позже" },
  /** The label beside the contest clock. Deliberately not «Қалған уақыт: 0:00»
      as a threat — nothing is enforced at zero. */
  contestTimeLeft: { kk: "Қалған уақыт", ru: "Осталось" },
  contestNote: {
    kk: "Тұрып қалсаң — кейінге қалдырып, келесіге өт. Аяқтар алдында бәрібір ораласың.",
    ru: "Застрял — отложи и переходи к следующей. Перед завершением всё равно вернёшься.",
  },
  /** Said once, above the footer, on a block the required path does not need. */
  optionalNote: {
    kk: "Бұл тапсырма — қосымша жаттығу. Қаласаң шығар, қаламасаң өткізіп жібер.",
    ru: "Это задание — дополнительная практика. Хочешь — реши, не хочешь — пропусти.",
  },
  why: { kk: "Неге?", ru: "Почему?" },
  startOver: { kk: "Басынан", ru: "Сначала" },
  next: { kk: "Келесі", ru: "Далее" },
  lessonDone: { kk: "Сабақ аяқталды", ru: "Урок пройден" },
  reportProblem: { kk: "Қате туралы хабарлау", ru: "Сообщить об ошибке" },
  readAloud: { kk: "Дауыстап оқу", ru: "Прочитать вслух" },
  close: { kk: "Жабу", ru: "Закрыть" },
  chatWithTutor: { kk: "Nova-мен сөйлесу", ru: "Поговорить с Nova" },
  askNova: { kk: "Nova-дан сұра", ru: "Спросить Nova" },
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
    ru: `Ещё ${n} ${pluralRu(n, "скрытый тест", "скрытых теста", "скрытых тестов")} — скопировать пример недостаточно`,
  }),
  fixedVersion: { kk: "Түзетілген нұсқа", ru: "Исправленный вариант" },
  /** What a worked example prints. Concrete, never "the answer". */
  result: { kk: "Нәтиже", ru: "Результат" },
  /** Shown when a reveal is withheld because the learner has not tried yet. */
  tryOnceMore: {
    kk: "Тағы бір рет ойланып көр — жауап бірден берілмейді",
    ru: "Подумай ещё раз — ответ сразу не выдаётся",
  },
  whichLine: { kk: "Қате жолды таңда", ru: "Выбери строку с ошибкой" },
  teacherLooksFor: { kk: "Мұғалім нені іздейді", ru: "На что смотрит учитель" },
  explainInOwnWords: { kk: "Өз сөзіңмен жаз", ru: "Напиши своими словами" },
  oralTask: {
    /* «выполнять задание учителю» is not a construction Russian has. The verb
       the sentence actually wants is "explain". */
    kk: "Бұл тапсырманы мұғалімге ауызша түсіндіресің",
    ru: "Это задание ты объясняешь учителю устно",
  },
  visualiserPending: {
    kk: "Бұл көрнекілік әлі дайын емес",
    ru: "Эта визуализация ещё не готова",
  },

  /* --- step-execution visualiser ---------------------------------------- */
  /**
   * The programme calls stepping through code «түсінудің басты құралы» — the
   * main instrument of understanding — for September, so these read more often
   * than any other label in the player and are written as lesson prose, not as
   * chrome. The notes take their numbers as arguments because a visualiser that
   * says "3" while the code says 4 is worse than no visualiser.
   *
   * Both languages avoid numeral suffixes (`3-тен`, `3 раза`), which depend on
   * the digit and cannot be got right by interpolation.
   */
  stepCounter: (i: number, n: number): Localized => ({
    kk: `Қадам ${i} / ${n}`,
    ru: `Шаг ${i} из ${n}`,
  }),
  stepPrev: { kk: "Алдыңғы қадам", ru: "Предыдущий шаг" },
  stepNext: { kk: "Келесі қадам", ru: "Следующий шаг" },
  stepReset: { kk: "Басынан бастау", ru: "Начать сначала" },
  /** Past tense on purpose: the highlighted line has already run. */
  stepLineRan: { kk: "Орындалған жол", ru: "Выполненная строка" },
  stepVariables: { kk: "Айнымалылар", ru: "Переменные" },
  stepNoVariables: {
    kk: "Әзірге бірде-бір айнымалы жоқ",
    ru: "Пока нет ни одной переменной",
  },
  stepOutput: { kk: "Экранға шыққаны", ru: "Вывод на экран" },
  stepNoOutput: { kk: "Әзірге ештеңе шыққан жоқ", ru: "Пока ничего не выведено" },
  stepFinished: { kk: "Бағдарлама аяқталды", ru: "Программа завершена" },
  stepAssign: (name: string, value: string): Localized => ({
    kk: `${name} айнымалысына ${value} мәні жазылды`,
    ru: `В переменную ${name} записано значение ${value}`,
  }),
  stepQuotient: (a: number, b: number, q: number): Localized => ({
    kk: `${a} / ${b} = ${q} — бүтін бөлігі, әрқайсысына тиетін сан`,
    ru: `${a} / ${b} = ${q} — целая часть: столько достанется каждому`,
  }),
  stepRemainder: (a: number, b: number, r: number): Localized => ({
    kk: `${a} % ${b} = ${r} — қалдық, артып қалатын сан`,
    ru: `${a} % ${b} = ${r} — остаток: столько останется лишним`,
  }),
  sandboxPending: {
    kk: "Кодты орындау қызметі әлі қосылмаған. Шешіміңді сақтап, мұғаліммен тексер.",
    ru: "Сервис запуска кода ещё не подключён. Сохрани решение и проверь с учителем.",
  },
  /**
   * The judge is DOWN, as opposed to not built.
   *
   * A separate string from `sandboxPending` because the two are different facts
   * and a class notices the difference. «Әлі қосылмаған» — not connected YET —
   * is true of a product still being assembled; said in the middle of a pilot
   * lesson it tells eighteen students the platform is unfinished, when what has
   * actually happened is that a service is down for twenty minutes.
   *
   * The second sentence is the one that matters and it is a promise the code
   * actually keeps: the submit route leaves the verdict `unknown` when the judge
   * does not answer, and `unknown` is never scored as a failure anywhere. Nobody
   * is marked wrong for an outage.
   */
  executionUnavailable: {
    kk:
      "Кодты тексеру уақытша қолжетімсіз. Жауабың сақталды — саған қате қойылған жоқ, " +
      "кейінірек қайта тексере аласың.",
    ru:
      "Проверка кода временно недоступна. Ответ сохранён — ошибка тебе не поставлена, " +
      "можно проверить позже.",
  },
  /**
   * There is no judge, and there was never going to be one today.
   *
   * The THIRD string in this family, and the one that must not be collapsed
   * into `executionUnavailable`. That one promises «кейінірек қайта тексере
   * аласың» — you can check again later. Said to a class whose deployment runs
   * `EXEC_PROVIDER=none`, that promise is false every day of the month.
   *
   * What this string does instead is tell the truth about a hybrid product:
   * your code ran, the output you saw was real Python, and the *grading* is a
   * teacher's job here. That is a coherent thing for a school to be told. "The
   * checker is down, try later" is not, when it is down permanently by design.
   */
  noTrustedJudge: {
    kk:
      "Кодың браузеріңде нақты орындалды — шыққан нәтиже шын. Бірақ бұл тапсырманы " +
      "автоматты тексеру бұл сыныпта қосылмаған, сондықтан бағаны мұғалім қояды.",
    ru:
      "Твой код по-настоящему выполнился в браузере — вывод настоящий. Но автоматическая " +
      "проверка в этом классе не подключена, поэтому решение оценит учитель.",
  },
  /**
   * The answer did not reach the server at all.
   *
   * Distinct from both strings above, and the distinction is the point: those
   * two say "we did not measure this", which is a settled outcome. This one says
   * "we did not RECEIVE this" — nothing was graded, nothing was recorded, and
   * pressing Check again is the correct next action. Rendering a lost round trip
   * with the same neutral card as an ungraded explanation is how a product ends
   * up implying work was saved when it was not.
   */
  notSaved: {
    kk: "Жауап сақталмады — байланыс үзілді. «Тексеру» түймесін қайта бас.",
    ru: "Ответ не сохранён — связь прервалась. Нажми «Проверить» ещё раз.",
  },

  /* --- Restored work ----------------------------------------------------
   *
   * A learner opens a lesson they have already worked on. The server knows
   * their verdict, the reveal they earned and the author's explanation of their
   * particular mistake, and all three come back. Their ANSWER does not — it is
   * not stored anywhere, on purpose, and three migration headers argue for
   * keeping it that way.
   *
   * So the card has to say the true thing rather than the convenient one. A
   * green border over an empty editor with no sentence on it reads as "correct,
   * and you wrote nothing", which is a worse lie than the blank lesson this
   * replaced. These strings are what stop that.
   *
   * Written in past tense on purpose: «бұрын жауап бердің» is a statement about
   * a previous session, which is exactly what it is. */
  restoredEarlier: {
    kk: "Бұл тапсырманы бұрын орындағансың — нәтижесі сақталған.",
    ru: "Ты уже выполнял это задание — результат сохранён.",
  },
  /**
   * Said in the same breath as the line above, and never on its own.
   *
   * The learner will look for what they typed and it will not be there. Telling
   * them why is a two-second cost that prevents them concluding the product
   * lost their work — which is the same conclusion the original bug produced,
   * arriving by a different route.
   */
  restoredAnswerNotShown: {
    kk: "Жазған жауабың сақталмайды, сондықтан ол көрсетілмейді. Қайта көргің келсе, тағы бір жаса.",
    ru: "Сам текст ответа не сохраняется, поэтому он не показан. Хочешь — попробуй ещё раз.",
  },
  /**
   * The assisted-solve marker, and it exists because of a real defect.
   *
   * A refresh used to launder help away: hints delivered in one episode, a
   * reload, then a solve in another, and every query that asks "was this
   * unaided" reads the second episode and answers yes. The analytical half is
   * fixed by continuing the episode; this is the half the learner can see, and
   * a learner who is shown "solved with help" cannot be quietly recorded as
   * having solved alone.
   */
  restoredAssisted: {
    kk: "Бұл тапсырманы Nova көмегімен шештің — ол есте сақталған.",
    ru: "Это задание ты решил с помощью Nova — это учтено.",
  },
  run: { kk: "Іске қосу", ru: "Запустить" },

  /* The one place C++ is QUIETER about a mistake than Python was, which makes
     it the one place the product has to speak up instead.

     `input()` on an empty stdin raised EOFError and the learner saw a failure.
     `cin >> n` on an empty stdin fails the stream and returns WITHOUT touching
     the variable, so an uninitialised `int n` keeps whatever was in that memory
     — measured, not assumed — and the program prints a confident arbitrary
     number. A beginner has no way to tell that from a real answer. */
  runStdinEmptyButRead: {
    kk: "Бағдарламаң cin арқылы оқиды, ал «Кіріс деректер» бос — сан кездейсоқ шығуы мүмкін",
    ru: "Твоя программа читает через cin, а поле «Входные данные» пустое — число может оказаться случайным",
  },
  submit: { kk: "Тапсыру", ru: "Отправить" },
  understood: { kk: "Түсіндім", ru: "Понятно" },

  /* --- Run: local C++17, in the learner's own browser -------------------
   *
   * The strings around a Run panel, and only the strings AROUND it. What the
   * toolchain prints — clang's `expected ';' after expression` with its caret,
   * wasm-ld's undefined symbols — is never translated and never rewritten:
   * reading a real compiler diagnostic is one of the skills the programme is
   * trying to teach, and a product that helpfully replaces it with «қате бар»
   * teaches the opposite. So the labels are bilingual, the output is the
   * compiler's, and one label says so in as many words.
   *
   * C++ moved where the failure happens. Python failed at RUN time with a
   * named exception and a traceback; C++ mostly fails at COMPILE time, before
   * a single line of the learner's program has executed — which is why an
   * empty output box beside an error is the normal case here and needed
   * saying, and why `runCompiling` exists at all.
   */

  /**
   * The one sentence that has to land for a fourteen-year-old.
   *
   * Run and Check are different actions and they are one button apart. A
   * learner who thinks Run marked them correct has learned the wrong lesson
   * about what this product's judgements are worth, and no amount of trust
   * marking elsewhere recovers from that first misreading.
   */
  runWhatItDoes: {
    kk: "«Іске қосу» бағдарламаңның не істейтінін көрсетеді. «Тексеру» оның дұрыс-бұрысын шешеді.",
    ru: "«Запустить» показывает, что делает твоя программа. «Проверить» решает, верна она или нет.",
  },
  runInputLabel: { kk: "Кіріс деректері", ru: "Входные данные" },
  runInputHint: {
    kk: "Бағдарламаң cin арқылы оқитын мәтін",
    ru: "То, что программа прочитает через cin",
  },
  /** Shown when a paste was longer than `LOCAL_LIMITS.maxStdinBytes`. */
  runInputClamped: {
    kk: "Кіріс тым ұзын — шегіне дейін қысқартылды",
    ru: "Ввод слишком длинный — обрезан до предела",
  },
  /** Shown instead of a Run button when the program is past the shared ceiling. */
  runSourceTooLong: {
    kk: "Бағдарлама тым үлкен — оны қысқарт",
    ru: "Программа слишком большая — сократи её",
  },
  runStdout: { kk: "Шыққан нәтиже", ru: "Вывод" },
  runStderr: { kk: "Қате туралы хабар", ru: "Сообщение об ошибке" },
  /**
   * Said once, next to the diagnostic, so the English is a lesson rather than a
   * wall. The programme teaches debugging; the first step of debugging is
   * reading what the compiler actually said. A C++ learner meets this on their
   * first missing semicolon, which is sooner than a Python learner met a
   * traceback — so it matters more, not less.
   */
  runStderrIsCompiler: {
    kk: "Бұл — компилятордың өз сөзі, ағылшынша. Оны оқи білу — керек дағды.",
    ru: "Это собственные слова компилятора, по-английски. Уметь их читать — нужный навык.",
  },
  runNoOutput: { kk: "Бағдарлама ештеңе шығарған жоқ", ru: "Программа ничего не вывела" },
  /** The C++ toolchain download, ~18 MB gzipped. Never a dead button. */
  runPreparing: { kk: "C++ дайындалып жатыр…", ru: "C++ готовится…" },
  /**
   * Compiling and running are separate waits in C++ and Python had only one.
   * A learner staring at a button for four seconds because they wrote
   * `#include <bits/stdc++.h>` should be told which step they are waiting on.
   */
  runCompiling: { kk: "Компиляция жүріп жатыр…", ru: "Идёт компиляция…" },
  runInProgress: { kk: "Орындалып жатыр…", ru: "Выполняется…" },
  /**
   * The runtime did not start.
   *
   * The second sentence is the whole point: `runtime_unavailable` is the one
   * local status `isLearnerOutcome` returns false for, and a learner must not
   * read our failed download as their broken program.
   */
  runRuntimeUnavailable: {
    kk: "C++ компиляторы браузеріңде іске қосылмады. Бұл сенің бағдарламаңның қатесі емес.",
    ru: "Компилятор C++ не запустился в твоём браузере. Это не ошибка твоей программы.",
  },
  runRetryLoad: { kk: "Қайта жүктеу", ru: "Загрузить снова" },
  runTimeLimit: (seconds: number): Localized => ({
    kk: `Бағдарлама ${seconds} секундта аяқталмады — шексіз цикл болуы мүмкін`,
    ru: `Программа не завершилась за ${seconds} ${pluralRu(seconds, "секунду", "секунды", "секунд")} — возможно, бесконечный цикл`,
  }),
  runOutputLimit: {
    kk: "Шығыс тым көп болды — қалғаны кесілді",
    ru: "Слишком много вывода — остальное обрезано",
  },
  runTruncated: { kk: "Нәтиже кесілді", ru: "Вывод обрезан" },
  /** The code moved on after the output was produced. Kept, not deleted. */
  runStale: {
    kk: "Кодты өзгерттің — бұл нәтиже алдыңғы нұсқанікі",
    ru: "Ты изменил код — этот вывод от прежней версии",
  },
  runLockedAfterCheck: {
    kk: "Тапсырма тексерілді. Қайта іске қосу үшін «Қайта көр» бас.",
    ru: "Задание уже проверено. Чтобы запустить снова, нажми «Ещё раз».",
  },

  /* Trust marking. `client_local` said in words a class understands. */
  runRanInYourBrowser: {
    kk: "Сенің браузеріңде орындалды",
    ru: "Выполнено в твоём браузере",
  },
  /**
   * Shown wherever `trustSatisfies(surface, "client_local")` is false.
   *
   * On a practice task, a monthly check or a contest, a green-looking local run
   * is feedback and nothing else — the evidence comes from the server, against
   * cases the learner has never seen. Saying so at the moment the output
   * appears is the only place the sentence lands.
   */
  runIsNotACheck: {
    kk: "Бұл — тексеру емес. Мұнда жұмыс істегені әлі «дұрыс» дегенді білдірмейді: бағаны «Тексеру» шешеді.",
    ru: "Это не проверка. То, что здесь сработало, ещё не значит «верно»: решает «Проверить».",
  },
  runTeacherWillMark: {
    kk: "Бұл тапсырманы мұғалім бағалайды.",
    ru: "Это задание оценит учитель.",
  },
  runCheckUnavailableHere: {
    kk: "Мұнда автоматты тексеру қазір қолжетімсіз.",
    ru: "Автоматическая проверка здесь сейчас недоступна.",
  },

  /* --- verification modes (PDF p.6) ------------------------------------- */
  verifyUnseen: { kk: "Бейтаныс есеп", ru: "Незнакомая задача" },
  verifyTrace: { kk: "Қолмен орындау", ru: "Ручная прокрутка" },
  verifyFindBug: { kk: "Қатені табу", ru: "Поиск ошибки" },
  verifyOral: { kk: "Ауызша түсіндіру", ru: "Устное объяснение" },
  verifyDelayed: { kk: "Қайта шешу", ru: "Повторное решение" },

  /* --- you / progress --------------------------------------------------- */
  yourProgress: { kk: "Сенің прогресің", ru: "Твой прогресс" },
  progressSub: {
    kk: "Мұнда пайыз жоқ. Тек нақты не істегенің.",
    ru: "Здесь нет процентов. Только то, что ты действительно сделал.",
  },
  periodWeek: { kk: "Апта", ru: "Неделя" },
  periodMonth: { kk: "Ай", ru: "Месяц" },
  periodYear: { kk: "Жыл", ru: "Год" },
  periodPrev: { kk: "Алдыңғы кезең", ru: "Предыдущий период" },
  periodNext: { kk: "Келесі кезең", ru: "Следующий период" },
  reportPeriod: { kk: "Есеп кезеңі", ru: "Период отчёта" },
  summaryTitle: { kk: "Осы кезеңнің қорытындысы", ru: "Итог периода" },
  summaryEmpty: {
    kk: "Бұл кезеңде әлі ештеңе жоқ. Бір сабақ ашсаң, осында пайда болады.",
    ru: "За этот период пока ничего нет. Открой урок — и здесь появится.",
  },
  activitySnapshot: { kk: "Не істедің", ru: "Что ты сделал" },
  solvedSolo: { kk: "Өз бетінше шешті", ru: "Решено самостоятельно" },
  solvedAssisted: { kk: "Көмекпен шешті", ru: "Решено с помощью" },
  attempted: { kk: "Әрекет", ru: "Попыток" },
  minutesPractised: { kk: "Практика минуты", ru: "Минут практики" },
  unexplained: { kk: "Себебі белгісіз қате", ru: "Ошибок без причины" },
  unexplainedHint: {
    kk: "Жүйе бұлардың себебін білмейді және білетінін көрсетпейді.",
    ru: "Система не знает их причину и не делает вид, что знает.",
  },
  solvedChart: { kk: "Шешілген есептер", ru: "Решённые задачи" },
  chartTableCaption: {
    kk: "Кезең бойынша шешілген есептер",
    ru: "Решённые задачи по периоду",
  },
  chartColDate: { kk: "Күні", ru: "Дата" },
  chartColSolo: { kk: "Өз бетінше", ru: "Самостоятельно" },
  chartColAssisted: { kk: "Көмекпен", ru: "С помощью" },
  skillsTitle: { kk: "Дағдылар", ru: "Навыки" },
  skillsEmpty: {
    kk: "Дағдылар бойынша әлі дәлел жоқ.",
    ru: "По навыкам пока нет свидетельств.",
  },
  strengthsTitle: { kk: "Не байқалды", ru: "Что видно" },
  strengthPersistence: { kk: "Тастап кетпейсің", ru: "Не бросаешь" },
  strengthAsksForHelp: { kk: "Көмек сұрайсың", ru: "Просишь помощь" },
  strengthIndependence: { kk: "Өз бетіңше істейсің", ru: "Справляешься сам" },
  /* --- error dictionary («Жеке қателер журналы», PDF) --------------------- */
  /**
   * The programme's own verb: «Оқушы өзінің қателер сөздігін жинай бастайды» —
   * the learner BEGINS TO COLLECT their own dictionary. Every string below is
   * written to that framing, and every noun in them is a task or a mistake.
   *
   * None of them says what the learner is like. That is not a style preference:
   * an entry may say what happened, never what it means about a fourteen-year-
   * old, and a label reading "you keep confusing types" would smuggle exactly
   * the claim the schema was built to make unwriteable.
   */
  errorBookTitle: { kk: "Қателер сөздігі", ru: "Словарь ошибок" },
  errorBookSub: {
    kk: "Өзің жіберген қателер. Қайсысын сақтайтыныңды өзің шешесің.",
    ru: "Ошибки, которые ты сделал. Какие сохранить — решаешь сам.",
  },
  errorBookEmpty: {
    kk: "Сөздігің әзірге бос.",
    ru: "Твой словарь пока пуст.",
  },
  errorBookOffer: { kk: "Сақтауға болады", ru: "Можно сохранить" },
  /** Shown when nothing qualifies — the common case, and not a failure. */
  errorBookNoOffer: {
    kk: "Түсіндірмесі бар қате әзірге жоқ.",
    ru: "Пока нет ошибок с объяснением.",
  },
  errorBookSave: { kk: "Сөздікке қосу", ru: "Добавить в словарь" },
  errorBookSaving: { kk: "Сақталуда…", ru: "Сохраняем…" },
  errorBookSaveFailed: {
    kk: "Сақталмады. Тағы бір көр.",
    ru: "Не сохранилось. Попробуй ещё раз.",
  },
  errorBookNote: { kk: "Өз сөзіңмен (міндетті емес)", ru: "Своими словами (необязательно)" },
  errorBookNotePlaceholder: {
    kk: "Келесі жолы неге көңіл бөлесің?",
    ru: "На что обратишь внимание в следующий раз?",
  },
  /** A count of a thing that happened, never a rate and never a verdict. */
  errorBookSeen: (n: number): Localized => ({
    kk: `${n} рет кездесті`,
    ru: `Встретилось ${n} ${plural(n, "раз", "раза", "раз")}`,
  }),
  errorBookLoadFailed: {
    kk: "Сөздікті жүктеу мүмкін болмады.",
    ru: "Не удалось загрузить словарь.",
  },

  lastComputed: { kk: "Соңғы есептеу", ru: "Последний расчёт" },
  loadFailed: {
    kk: "Прогресті жүктеу мүмкін болмады.",
    ru: "Не удалось загрузить прогресс.",
  },
  retry: { kk: "Қайталау", ru: "Повторить" },

  /* --- first run (pilot onboarding) -------------------------------------- */
  welcomeTitle: { kk: "SolveX4Schools-ке қош келдің", ru: "Добро пожаловать в SolveX4Schools" },
  welcomeWhat: {
    kk: "Мұнда сен бағдарламалауды жазып үйренесің: әр сабақта қысқа түсіндіру, содан кейін тапсырмалар.",
    ru: "Здесь ты учишься программировать, программируя: в каждом уроке короткое объяснение, потом задачи.",
  },
  welcomeLessons: {
    kk: "Сабақ карточкалардан тұрады. Жауабыңды тексер, қателессең — қайта көр.",
    ru: "Урок состоит из карточек. Проверяй ответ, ошибся — попробуй ещё раз.",
  },
  welcomeNova: {
    kk: "Nova — көмекші бағдарлама, адам емес. Ол сұрақ қоя отырып ойлануға көмектеседі.",
    ru: "Nova — программа-помощник, не человек. Она помогает думать, задавая вопросы.",
  },
  welcomeNovaLimit: {
    kk: "Nova сенің орныңа шешпейді. Алдымен өзің бір әрекет жаса — сонда ғана көмек ашылады.",
    ru: "Nova не решает за тебя. Сначала попробуй сам — только тогда откроется помощь.",
  },
  welcomeLocale: {
    kk: "Тілді жоғарғы оң жақтан ауыстыруға болады: қазақша немесе орысша.",
    ru: "Язык можно переключить справа вверху: казахский или русский.",
  },
  welcomeStart: { kk: "Бастау", ru: "Начать" },

  /* --- teacher console --------------------------------------------------- */
  teacherNoClasses: {
    kk: "Сізге әзірге сынып бекітілмеген. Мектеп әкімшісіне хабарласыңыз.",
    ru: "За вами пока не закреплён класс. Обратитесь к администратору школы.",
  },

  /* --- publication gate (migration 0013) --------------------------------- */
  monthNotOpenTitle: { kk: "Бұл ай әлі ашылмаған", ru: "Этот месяц ещё не открыт" },
  monthNotOpenBody: {
    kk: "Материалды мұғалім тексеріп, ашқаннан кейін сабақтар қолжетімді болады.",
    ru: "Уроки станут доступны после того, как учитель проверит и откроет материал.",
  },

  /* A month that IS published but that this learner has not reached yet.
     Different sentence from the one above, and the difference matters: "the
     teacher has not opened it" is about the school and there is nothing the
     learner can do, while this is about their own work and there is. Telling a
     learner to wait for an adult when the door is in fact theirs to open is the
     kind of small untruth that teaches them the product does not know what is
     going on. */
  monthLockedTitle: { kk: "Бұл ай әлі жабық", ru: "Этот месяц ещё закрыт" },
  monthLockedBody: {
    kk: "Алдыңғы айдың сабақтары мен айлық сынағын аяқтасаң, бұл ай өзі ашылады.",
    ru: "Он откроется сам, когда ты закончишь уроки и месячную проверку предыдущего месяца.",
  },

  /* --- sign in (migration 0012 identity) --------------------------------- */
  signInTitle: { kk: "Кіру", ru: "Вход" },
  signInSub: {
    kk: "Мұғалім берген аты мен құпиясөзді енгіз",
    ru: "Введи логин и пароль, которые выдал учитель",
  },
  username: { kk: "Аты", ru: "Логин" },
  password: { kk: "Құпиясөз", ru: "Пароль" },
  signIn: { kk: "Кіру", ru: "Войти" },
  signOut: { kk: "Шығу", ru: "Выйти" },
  signInFailed: {
    kk: "Аты немесе құпиясөз дұрыс емес",
    ru: "Неверный логин или пароль",
  },
  signInRateLimited: {
    kk: "Тым көп әрекет. Біраз күте тұр.",
    ru: "Слишком много попыток. Немного подожди.",
  },
  changePasswordTitle: { kk: "Құпиясөзді өзгерт", ru: "Смени пароль" },
  changePasswordWhy: {
    kk: "Бірінші құпиясөзді мұғалім білгендіктен, оны өзгерту керек",
    ru: "Первый пароль знает учитель, поэтому его нужно сменить",
  },
  currentPassword: { kk: "Қазіргі құпиясөз", ru: "Текущий пароль" },
  newPassword: { kk: "Жаңа құпиясөз", ru: "Новый пароль" },
  passwordTooShort: {
    kk: "Кемінде 10 таңба керек",
    ru: "Нужно минимум 10 символов",
  },
  passwordContainsUsername: {
    kk: "Құпиясөзде атың болмауы керек",
    ru: "Пароль не должен содержать твой логин",
  },
  save: { kk: "Сақтау", ru: "Сохранить" },

  /* --- completion policy -------------------------------------------------
     Added with `schools/policies/completion.ts`. One string, and it exists
     because the finishing button now has a third thing it can mean: the
     learner is on the last page and the rule is not yet satisfied. It names
     the work, never the learner. */
  finishOutstanding: {
    kk: "Қалған тапсырмаға өту",
    ru: "К оставшемуся заданию",
  },

  /* --- delayed re-solve («Қайталау» / «Повторение») ----------------------
     Added with the review scheduler. The programme's fifth independence check
     (PDF p.6): «Көмекпен шешілген есеп бірнеше аптадан соң қайта беріледі және
     бұл жолы көмексіз орындалады».

     Every string below states what the learner is being offered and what the
     rules of it are. None of them says why the system thinks they need it —
     "you needed help with this" is a claim about a fourteen-year-old, and the
     reason a task is in the queue is a fact about the task's own record, which
     is how the two reason labels are worded. */
  reviewTitle: { kk: "Қайталау", ru: "Повторение" },
  reviewSub: {
    kk: "Бұрын шешкен есептерің. Бұл жолы көмексіз.",
    ru: "Задачи, которые ты уже решал. В этот раз — без помощи.",
  },
  /** A count of what is waiting. Never a score and never a deadline. */
  reviewDueCount: (n: number): Localized => ({
    kk: `${n} тапсырма`,
    ru: `${n} ${plural(n, "задание", "задания", "заданий")}`,
  }),
  reviewEmpty: {
    kk: "Әзірге қайталайтын ештеңе жоқ.",
    ru: "Пока нечего повторять.",
  },
  /** Queued, but the delay has not elapsed. Shown so the queue is not a mystery. */
  reviewLater: {
    kk: "Кейінірек қайта беріледі",
    ru: "Вернётся позже",
  },
  reviewOpen: { kk: "Қайта шешу", ru: "Решить заново" },
  reviewReasonAssisted: { kk: "Көмекпен шешілген еді", ru: "Было решено с помощью" },
  reviewReasonMilestone: { kk: "Өз бетіңше шешілген еді", ru: "Было решено самостоятельно" },
  /**
   * The promise the whole feature rests on, said out loud to the learner.
   *
   * The re-solve runs in a fresh episode: no hint level carries over, no
   * previous solution is shown, and nothing from the first attempt is on the
   * screen. Saying so is not decoration — a learner who assumes the tutor
   * remembers where they got to will ask it for the next step instead of
   * starting.
   */
  reviewFresh: {
    kk: "Бұрынғы нұсқаулар сақталмайды — нөлден бастайсың.",
    ru: "Прежние подсказки не сохраняются — начинаешь с нуля.",
  },
  reviewDone: { kk: "Қайталау аяқталды", ru: "Повторение завершено" },
  reviewLoadFailed: {
    kk: "Қайталау тізімін жүктеу мүмкін болмады.",
    ru: "Не удалось загрузить список повторения.",
  },
  reviewStartFailed: {
    kk: "Қайталауды ашу мүмкін болмады. Тағы бір көр.",
    ru: "Не удалось открыть повторение. Попробуй ещё раз.",
  },

  /* --- units ------------------------------------------------------------ */
  minutes: { kk: "мин", ru: "мин" },
  hours: { kk: "сағат", ru: "часов" },
  line: { kk: "Жол", ru: "Строка" },

  /* ======================================================================== */
  /* NEW · post-help explanation (programme independence check)               */
  /*                                                                          */
  /* «Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге міндетті».  */
  /* Added as a self-contained block; no key above this line was touched.      */
  /*                                                                          */
  /* Two rules govern the wording here, and both are load-bearing:             */
  /*                                                                          */
  /* 1. Nothing in this section may read as a grade. The system does not know  */
  /*    whether the explanation was good, and the strings must not imply that  */
  /*    it does. «Жазылды» — recorded — not «Дұрыс».                            */
  /* 2. The register is an invitation, not a punishment. A learner who asked   */
  /*    for help and got it is doing the right thing; being made to feel       */
  /*    caught for it is how they stop asking.                                 */
  /* ======================================================================== */

  postHelpTitle: { kk: "Өз сөзіңмен түсіндір", ru: "Объясни своими словами" },
  /** Why they are being asked. States the reason, not a judgement. */
  postHelpWhy: {
    kk: "Көмек алдың — енді шешімді өз сөзіңмен айтып бер. Бір-екі сөйлем жеткілікті.",
    ru: "Ты получил помощь — теперь расскажи решение своими словами. Хватит одного-двух предложений.",
  },

  /* The three questions, routed by `explanationPromptKeyFor`. The key names
     must match `ExplanationPromptKey` in `schools/learning/post-help.ts`. */
  postHelpAskWhyCondition: {
    kk: "Неге бұл шарт жұмыс істейді?",
    ru: "Почему это условие работает?",
  },
  postHelpAskWhereWrong: {
    kk: "Қай жерде қателестің?",
    ru: "Где именно была ошибка?",
  },
  postHelpAskWhatAndWhy: {
    kk: "Не істедің және неге дәл солай істедің?",
    ru: "Что ты сделал и почему именно так?",
  },

  postHelpPlaceholder: {
    kk: "Өз сөзіңмен жаз…",
    ru: "Напиши своими словами…",
  },
  postHelpSubmit: { kk: "Жіберу", ru: "Отправить" },
  /** Shown while the control is disabled. A length note, never a verdict. */
  postHelpTooShort: {
    kk: "Тағы біраз жаз — бір-екі сөйлем.",
    ru: "Напиши чуть больше — одно-два предложения.",
  },
  /**
   * After a successful submit.
   *
   * Says what happened and stops. It does NOT say «жақсы» or «правильно»,
   * because nothing checked it — see `explanationVerdict`, which returns
   * `unknown` and has no other branch.
   */
  postHelpRecorded: {
    kk: "Жазылды. Бұл тексерілмейді — мұғалім оқи алады.",
    ru: "Записано. Это не проверяется автоматически — учитель сможет прочитать.",
  },
  /** Stated up front, so the learner knows what they are writing into. */
  postHelpNotGraded: {
    kk: "Бұл жауап бағаланбайды.",
    ru: "Этот ответ не оценивается.",
  },
  /** The task is not finished until the explanation exists. */
  postHelpOutstanding: {
    kk: "Тапсырма түсіндірмеден кейін жабылады.",
    ru: "Задание закроется после объяснения.",
  },
  /** Recorded when they complete without explaining. A fact, not a scolding. */
  postHelpSkipped: {
    kk: "Түсіндірме жазылмады. Бұл шешім дербес деп саналмайды.",
    ru: "Объяснение не записано. Это решение не считается самостоятельным.",
  },
  postHelpSaveFailed: {
    kk: "Сақталмады. Тағы бір көр.",
    ru: "Не сохранилось. Попробуй ещё раз.",
  },

  /* ======================================================================
   * NEW · teacher-facing outcome vocabulary
   * ======================================================================
   *
   * Everything below this line was ADDED. No key above it was touched — the
   * strings above are read by the lesson runtime and a "harmless" rewording
   * changes what a child is told mid-month.
   *
   * ## What this section is for
   *
   * A teacher must be able to read a code result. `Passed`, `Wrong answer`,
   * `Runtime error`, `Time limit`, `Not checked — a system fault`: five things
   * a person who teaches Grade 9 can act on. What they must never see is the
   * vocabulary of the machine that produced it — `provider_error`,
   * `PISTON_STAGE_MISSING`, `container_internal_error`, an HTTP status, a
   * container id, a stack. Not because it is secret, but because it is not
   * information: a teacher reading `provider_exit_502` in the middle of a
   * lesson learns nothing they can do anything about, and learns to distrust
   * the whole screen.
   *
   * The mapping from the execution port's statuses onto these keys is
   * `schools/presentation/teacher-outcome.ts` — one function, total over the
   * status union, so a new status added to the port cannot reach a teacher
   * unlabelled. `tests/school/teacher-language.test.ts` asserts both halves.
   *
   * ## Two of these are not verdicts and must not read like ones
   *
   * `teacherOutcomeNotChecked` is an outage: nothing was measured, and NOBODY
   * WAS MARKED WRONG. That second clause is in the string because it is the
   * fact a teacher needs and it is one the code actually keeps — the submit
   * route leaves the verdict `unknown`, and `unknown` is never scored as a
   * failure anywhere.
   *
   * `teacherOutcomeNotMachineChecked` is permanent and correct: an oral or
   * written answer that no machine grades. Collapsing the two would tell a
   * teacher a service was broken when a child simply wrote an essay.
   */

  /** Every declared test case passed. The only outcome that claims success. */
  teacherOutcomePassed: { kk: "Өтті", ru: "Пройдено" },
  /** It ran, it printed something, the something was wrong. */
  teacherOutcomeWrongAnswer: { kk: "Жауап дұрыс емес", ru: "Неверный ответ" },
  /** It never started. Punctuation and indentation, not logic. */
  teacherOutcomeCompileError: {
    kk: "Бағдарлама басталмады — жазылу қатесі",
    ru: "Программа не запустилась — ошибка записи",
  },
  /** It started and raised. Logic, not punctuation. */
  teacherOutcomeRuntimeError: {
    kk: "Орындалу кезінде қате",
    ru: "Ошибка во время выполнения",
  },
  /** THE LEARNER'S program was too slow. Evidence about an algorithm. */
  teacherOutcomeTimeLimit: {
    kk: "Уақыт шегінен асты — бағдарлама тым баяу",
    ru: "Превышено время — программа слишком медленная",
  },
  /** THE LEARNER'S program used too much memory. Also evidence. */
  teacherOutcomeMemoryLimit: {
    kk: "Жады шегінен асты",
    ru: "Превышен предел памяти",
  },
  /**
   * The judge did not answer. NOT evidence, and the sentence says so.
   *
   * This is the string that exists to stop `provider_timeout` reaching a
   * classroom. It names the consequence (nothing was measured) and the
   * reassurance (nobody was marked wrong) and nothing about the cause, because
   * the cause is not a teacher's to act on.
   */
  teacherOutcomeNotChecked: {
    kk: "Тексерілмеді — жүйедегі ақау. Ешкімге қате қойылған жоқ.",
    ru: "Не проверено — сбой в системе. Ошибка никому не поставлена.",
  },
  /** Permanent and correct: nothing here is machine-gradable. */
  teacherOutcomeNotMachineChecked: {
    kk: "Автоматты тексерілмейді — жауапты өзіңіз оқисыз",
    ru: "Не проверяется автоматически — ответ читаете вы",
  },

  /* --- NEW · teacher class list, when it will not load -------------------- */
  /*
   * The classroom panel used to render `error.message` straight into the page.
   * That is `not_authenticated` on an expired session, `not_found` on a class
   * this teacher does not teach, and — on a 500 that returns an HTML error page
   * — a raw `SyntaxError: Unexpected token '<' ...`, which is a JavaScript
   * parser's opinion printed at a teacher between two lessons.
   *
   * Four sentences, one of which is "sign in again", because that is the only
   * one of the four a teacher can actually fix themselves.
   */
  teacherClassSignedOut: {
    kk: "Сеанс аяқталды. Қайта кіріңіз.",
    ru: "Сессия завершилась. Войдите снова.",
  },
  teacherClassNotYours: {
    kk: "Бұл сынып сізге бекітілмеген.",
    ru: "Этот класс за вами не закреплён.",
  },
  teacherClassUnavailable: {
    kk: "Сынып тізімін жүктеу мүмкін болмады. Бір минуттан кейін қайталап көріңіз.",
    ru: "Не удалось загрузить список класса. Попробуйте через минуту.",
  },

  /* --- NEW · what a repeated mistake is called, for a teacher ------------- */
  /*
   * A generic sentence for a failure class the label map below does not know.
   * Reached when the curriculum declares a new diagnostic class before anyone
   * writes it a name — which will happen, because content moves faster than
   * presentation. The honest fallback is to state the fact that IS known (one
   * mistake, repeated, this many times) and drop the identifier, rather than
   * print `and_or_swap` at a Kazakh teacher and call it information.
   */
  teacherMistakeUnnamed: { kk: "бір қате", ru: "одна ошибка" },

  /* --- NEW · Nova, when the ledger will not answer ----------------------- */
  /*
   * Said by `/api/nova/hint` when the store cannot be opened or cannot be read:
   * no identity, no episode, no hint ladder, and therefore no hint. The learner
   * asked a question and something has to come back — without this the route
   * died before the first byte of SSE and the panel fell through to «Жауап
   * алынбады. Қайта көріңіз.» beside a Retry button, which is a fourteen-year-
   * old pressing retry against a database that will not return for an hour.
   *
   * Three facts in one breath, and each is load-bearing. That the work is not
   * being saved, because a learner who solves six blocks and finds them gone
   * the next morning stops trusting the product for the rest of the year. That
   * they can keep going, because they can — the curriculum, the editor and the
   * grader do not need this. And that the teacher has to be told, because the
   * teacher is the only person in the room who can act on it.
   *
   * A learner's sentence, deliberately not the teacher's: `saving_progress` in
   * `schools/ops/health.ts` states the same fact to an adult, ends in "tell the
   * administrator", and lives in a `server-only` module that never reaches the
   * browser. One shared string would either send a child to the school
   * administrator or ship the ops report into the lesson bundle.
   */
  novaStoreDown: {
    kk: "Қазір сенің жұмысыңды көре алмай тұрмын — жауаптарың да сақталмайды. Есепті шығара бер, бірақ мұғаліміңе айт: мұны түзету керек.",
    ru: "Сейчас я не вижу твою работу — ответы пока не сохраняются. Продолжай решать, но скажи учителю: это нужно починить.",
  },

  /* --- NEW · a sign-in that was never checked ---------------------------- */
  /*
   * The sentence that exists because the alternative was a lie.
   *
   * When the store is unreachable, `/api/auth/login` compares nothing at all —
   * the rate limiter is the first thing it touches and the rate limiter is a
   * table. That used to escape as an empty 500, and the form fell through to
   * `signInFailed`: «Аты немесе құпиясөз дұрыс емес». A product telling a
   * fourteen-year-old they mistyped a password that was never read. They try
   * again, they doubt the card the teacher wrote it on, and then they go and
   * fetch the teacher, who cannot sign in either.
   *
   * Three things and nothing else: it is not you, nothing was checked, and here
   * is who to tell if it keeps happening. No mention of a database, a server or
   * a service — none of those is a word a learner can act on, and the one who
   * can act on it is standing in the room.
   *
   * `signInFailed` stays exactly as it is, and stays the ONLY sentence in this
   * product that is allowed to blame a password. It is now reachable only from
   * a 401, which is the only status that means a password was actually
   * compared.
   */
  signInUnavailable: {
    kk: "Кіру уақытша істемей тұр. Құпиясөзің тексерілген жоқ — бір-екі минуттан кейін қайта көр. Қайталанса, мұғаліміңе айт.",
    ru: "Вход временно не работает. Пароль не проверялся — попробуй через пару минут. Если не пройдёт, скажи учителю.",
  },
  /* ==========================================================================
   * NEW · SolveX Leagues
   * ==========================================================================
   *
   * ## Tier names are not in here, and that is deliberate
   *
   * `Pulse`, `Vector`, `Singularity` are proper nouns rendered in Latin in both
   * languages, exactly like `Nova` two hundred lines above — «Nova — оқу
   * көмекшісі» / «Nova — учебный помощник». They live in
   * `schools/leagues/tiers.ts` as plain strings. Putting ten identical `kk`/`ru`
   * pairs here would need ten entries on the shared-loanword allowlist in
   * `product-surface.test.ts`, and that list exists to catch the NEXT
   * untranslated label — burying ten deliberate ones in it would make the
   * accidental eleventh invisible.
   *
   * ## Russian past tense is gendered, so none of these use it
   *
   * «Ты поднялся» is masculine and «поднялась» is feminine, and this product
   * holds no gender for anybody — `school_accounts` has a name, a school, a role
   * and a credential, and nothing else. A результат banner in the past tense
   * would therefore misgender roughly half of every class, every Monday.
   *
   * Every result string below is present tense or nominal instead: «Твоя новая
   * лига — Vector», «Ты остаёшься», «На этой неделе ты в лиге Circuit». Kazakh
   * has no grammatical gender and needs no such care, but the two arms are kept
   * parallel so a future editor does not "fix" the Russian back into the past.
   *
   * ## And none of them are unkind
   *
   * There is no «проиграл», no «последний», no «слабый». Relegation is stated as
   * where the learner is competing next week, not as a failure — §24 of the
   * brief, and the same instinct as `phrasing.ts`, which already refuses to tell
   * a fourteen-year-old that they are wrong in those words.
   */

  navLeague: { kk: "Лига", ru: "Лига" },

  /* «{name}» is substituted with a Latin tier name. Word order differs: Kazakh
     puts the possessive on the noun, Russian puts the name after it. */
  leagueOf: { kk: "{name} лигасы", ru: "Лига {name}" },
  leagueTitle: { kk: "Апталық лига", ru: "Недельная лига" },

  leagueXpThisWeek: { kk: "Осы аптадағы XP", ru: "XP на этой неделе" },
  leagueYourRank: { kk: "Орның", ru: "Твоё место" },
  leagueGroupSize: { kk: "қатысушы", ru: "участников" },
  leagueYourZone: { kk: "Аптаның соңында", ru: "В конце недели" },

  leagueEndsIn: { kk: "Аптаның аяқталуына", ru: "До конца недели" },
  leagueEndsSoon: { kk: "Апта бүгін аяқталады", ru: "Неделя заканчивается сегодня" },

  /* Zone labels. Verbs, not nouns: «Зона повышения» reads like a document
     heading, «Поднимаются» reads like something that is about to happen to the
     people in the rows underneath it. */
  /* Third person plural — these label a BAND of the table, so they describe the
     people in it: «Поднимаются» sits on a rule with four rows under it. */
  leagueZoneUp: { kk: "Көтеріледі", ru: "Поднимаются" },
  leagueZoneStay: { kk: "Қалады", ru: "Остаются" },
  leagueZoneDown: { kk: "Төмендейді", ru: "Опускаются" },

  /* Second person — these label the READER's own status in the hero, and using
     the band labels there says «they are rising» above a number that is mine.
     Present tense in Russian, so no gender is asserted: `school_accounts` holds
     a name, a school, a role and a credential, and «поднялся» would misgender
     roughly half of every class. */
  leagueYouUp: { kk: "Көтерілесің", ru: "Поднимаешься" },
  leagueYouStay: { kk: "Қаласың", ru: "Остаёшься" },
  leagueYouDown: { kk: "Төмендейсің", ru: "Опускаешься" },

  /* Screen-reader text for the movement of a single row. Colour never travels
     alone here either — the visible row carries an arrow glyph AND this. */
  leagueRowUp: { kk: "жоғары лигаға өтеді", ru: "переходит в лигу выше" },
  leagueRowStay: { kk: "осы лигада қалады", ru: "остаётся в этой лиге" },
  leagueRowDown: { kk: "төмендегі лигада жалғастырады", ru: "продолжит в лиге ниже" },
  leagueRowYou: { kk: "сен", ru: "ты" },

  /* --- the week's result, shown once --------------------------------------- */
  leagueResultTitle: { kk: "Өткен апта", ru: "Прошлая неделя" },
  leagueResultUp: { kk: "Жаңа лигаң — {name}", ru: "Твоя новая лига — {name}" },
  leagueResultStay: { kk: "{name} лигасында қаласың", ru: "Ты остаёшься в лиге {name}" },
  leagueResultDown: {
    kk: "Бұл аптада {name} лигасында жарысасың",
    ru: "На этой неделе ты соревнуешься в лиге {name}",
  },
  leagueResultRank: {
    kk: "{n} қатысушының ішінде {rank}-орын",
    ru: "{rank} место из {n}",
  },
  leagueResultDismiss: { kk: "Түсінікті", ru: "Понятно" },

  /* --- first entry, at most three lines ------------------------------------ */
  leagueWelcomeTitle: { kk: "Сен лигаға қосылдың", ru: "Ты в недельной лиге" },
  leagueWelcomeBody: {
    kk: "Нақты оқу нәтижелері үшін XP жинайсың. Жаңа апта дүйсенбіде басталады.",
    ru: "XP начисляется за реальные учебные результаты. Новая неделя начинается в понедельник.",
  },

  /* --- empty states -------------------------------------------------------- */
  leagueNotStarted: {
    kk: "Бұл аптада әлі XP жоқ",
    ru: "На этой неделе пока нет XP",
  },
  leagueNotStartedBody: {
    kk: "Бір тапсырманы шеш — сол сені осы аптаның лигасына қосады.",
    ru: "Реши одну задачу — она добавит тебя в лигу этой недели.",
  },
  leagueLoadFailed: {
    kk: "Лига тізімі жүктелмеді.",
    ru: "Не удалось загрузить таблицу лиги.",
  },
  /* The reassurance is the point of this string, not politeness.
     A learner who spent a week earning XP and is shown a failure reasonably
     concludes the week did not count. It did: the ledger is written on the
     submit path and nothing here touches it. Saying so is the difference
     between "the list is late" and "my work is gone". */
  leagueLoadFailedSafe: {
    kk: "Жинаған XP сақталған — бұл тек тізім.",
    ru: "Твой XP сохранён — не загрузился только список.",
  },
  leagueRetry: { kk: "Қайталау", ru: "Повторить" },

  /* --- the rules, stated in full ------------------------------------------- */
  leagueRulesTitle: { kk: "XP қалай беріледі?", ru: "Как начисляется XP?" },
  leagueRulesEarn: { kk: "XP беріледі", ru: "XP начисляется" },
  leagueRulesNever: { kk: "XP берілмейді", ru: "XP не начисляется" },

  xpBlockSolved: { kk: "Тапсырманы дұрыс шешкенде", ru: "За верно решённую задачу" },
  xpBlockUnaided: { kk: "Көмексіз шешкенде — қосымша", ru: "Дополнительно, если решил без помощи" },
  xpChallengeSolved: { kk: "Күрделі тапсырма үшін", ru: "За сложную задачу" },
  xpExplanationSubmitted: { kk: "Жазбаша түсіндірме жібергенде", ru: "За письменное объяснение" },
  xpLessonCompleted: { kk: "Сабақты аяқтағанда", ru: "За завершённый урок" },
  xpAssessmentCompleted: { kk: "Айлық тексеруді аяқтағанда", ru: "За месячную проверку" },
  xpReviewResolved: { kk: "Қайталауды көмексіз шешкенде", ru: "За повторение, решённое без помощи" },

  /* The absences, said out loud. §27 — the rules are never hidden, and the
     things that DO NOT earn XP are the half a learner will actually test. */
  xpNotRun: { kk: "«Іске қосу» батырмасын басқанда", ru: "За нажатие «Запустить»" },
  xpNotRepeat: {
    kk: "Бұрын шешілген тапсырманы қайта шешкенде",
    ru: "За повторное решение уже решённой задачи",
  },
  xpNotHints: { kk: "Nova-дан көмек сұрағанда", ru: "За обращение к Nova" },
  xpNotTime: { kk: "Экранда өткізген уақыт үшін", ru: "За время, проведённое на экране" },
  xpNotSpeed: { kk: "Жылдам шешкені үшін", ru: "За скорость решения" },

  leagueXpNeverLost: {
    kk: "XP ешқашан алынбайды. Қате жауап та, көмек сұрау да XP азайтпайды.",
    ru: "XP никогда не отнимается. Ни ошибка, ни просьба о помощи не уменьшают XP.",
  },

  /* --- the ladder ---------------------------------------------------------- */
  leagueLadderTitle: { kk: "Лигалар", ru: "Лиги" },
  leagueLadderCurrent: { kk: "осындасың", ru: "ты здесь" },
  leagueLadderLocked: { kk: "әлі ашылмаған", ru: "ещё не открыта" },

  leagueBreakdownTitle: { kk: "Осы аптадағы XP", ru: "XP на этой неделе" },
} as const;

export function t(value: Localized, locale: Locale): string {
  return value[locale];
}

/* ==========================================================================
 * NEW · failure classes, said to a teacher
 * ==========================================================================
 *
 * A misconception the evidence supports is the single most useful thing this
 * product can put in front of a teacher, and it was being put there as
 * `and_or_swap` — an English snake_case identifier, inside a Russian sentence,
 * on a screen read by someone who teaches in Kazakh.
 *
 * The identifier is not wrong to HAVE. It is the auditable key, it is what the
 * ledger stores, and `ClassroomSignal.failureClass` still carries it so a
 * teacher who disputes a signal can be shown exactly which attributions produced
 * it. What it is wrong to do is render it as prose.
 *
 * ## Two vocabularies land here, and both must be covered
 *
 * The curriculum declares its own diagnostic classes (`diagnosticMapping` in
 * `schools/curriculum/months/*`), and the imported Learning Intelligence core
 * has its own closed set in `FAILURE_CLASSES`. Both reach `MisconceptionObservation.failureClass`,
 * so both are named below.
 *
 * ## Deliberately NOT exhaustive-checked against the curriculum
 *
 * A test asserting "every declared failure class has a label here" would couple
 * presentation to content and break the month someone adds a diagnostic. The
 * fallback (`L.teacherMistakeUnnamed`) is the guard instead: an unknown class
 * degrades to "one mistake, repeated N times", which is true, useful, and
 * carries no identifier. Adding a diagnostic class should still come with a row
 * here — it just is not enforced at the cost of blocking curriculum work.
 */
export const TEACHER_FAILURE_CLASS: Record<string, Localized> = {
  /* --- the imported core's closed set --------------------------------- */
  compile_error: {
    kk: "бағдарлама басталмай тұрып тоқтайды",
    ru: "программа останавливается ещё до запуска",
  },
  runtime_error: {
    kk: "орындалу кезінде қате шығады",
    ru: "ошибка возникает во время выполнения",
  },
  memory_limit: { kk: "жады шегінен асады", ru: "выходит за предел памяти" },
  complexity_asymptotic: {
    kk: "бағдарлама тым баяу жұмыс істейді",
    ru: "программа работает слишком медленно",
  },
  edge_case_handling: {
    kk: "шарттың шекарасында қателеседі",
    ru: "ошибается на границе условия",
  },
  /* Named, and it names the absence. A teacher must be able to tell "the system
     thinks this child confuses // and %" from "the system has no idea". */
  unattributed_failure: {
    kk: "себебі анықталмаған қате",
    ru: "ошибка без установленной причины",
  },

  /* --- What C++ added to September, and Python never had ---------------- */

  /* All four arrived with the language migration and had no label, so the
     teacher console rendered each of them as «одна ошибка» — the exact
     failure this catalogue's own header describes: an unnamed class is a
     number beside a child's name that tells a teacher nothing. */

  compiler_points_at_the_next_line: {
    kk: "қатені компилятор көрсеткен жолдан іздейді",
    ru: "ищет ошибку в той строке, которую назвал компилятор",
  },
  output_chain_read_as_addition: {
    kk: "cout << a << b тізбегін қосу деп түсінеді",
    ru: "читает цепочку cout << a << b как сложение",
  },
  cout_assumed_to_insert_a_space: {
    kk: "cout мәндердің арасына бос орын қояды деп ойлайды",
    ru: "думает, что cout сам ставит пробел между значениями",
  },
  int_division_assumed_to_round: {
    kk: "бүтін бөлу дөңгелектейді деп ойлайды (шын мәнінде бөлшегі алынып тасталады)",
    ru: "считает, что целочисленное деление округляет (на деле дробная часть отбрасывается)",
  },

  /* --- September's own diagnostics ------------------------------------- */
  string_vs_number_confusion: {
    kk: "мәтін мен санды шатастырады (тырнақша артық қойылған)",
    ru: "путает текст и число (лишние кавычки делают выражение текстом)",
  },
  remainder_vs_quotient_swap: {
    kk: "/ мен % орындарын ауыстырады",
    ru: "меняет местами / и %",
  },
  elif_chain_short_circuit_missed: {
    kk: "else if тізбегінің бірінші сәйкестікте тоқтайтынын ескермейді",
    ru: "не учитывает, что цепочка else if останавливается на первом совпадении",
  },
  blamed_the_branch_that_fired: {
    kk: "қатені жауап шығарған тармақтан іздейді",
    ru: "ищет ошибку в той ветке, которая напечатала ответ",
  },
  and_or_swap: { kk: "&& мен ||-ды шатастырады", ru: "путает && и ||" },
  strict_vs_inclusive_boundary: {
    kk: "< пен <= арасында қателеседі",
    ru: "ошибается между < и <=",
  },
  swapped_interval_bounds: {
    kk: "аралықтың шекараларын ауыстырып алады",
    ru: "меняет местами границы интервала",
  },
  /* Renamed in meaning, not just in wording. In Python the surprise was that
     `/` hands back a float; in C++ the surprise is the exact opposite — `/` on
     two ints throws the fraction away and `7 / 2` is `3`. Left under its old
     key because the key is the auditable identifier the ledger already stores
     and past attempts are filed under; the key is a name, the label is the
     claim, and it was the claim that had inverted. */
  true_division_returns_float: {
    kk: "екі бүтін санды бөлгенде бөлшек бөлігі жоғалатынын ескермейді",
    ru: "не учитывает, что при делении двух целых дробная часть отбрасывается",
  },
  fractional_where_integer_required: {
    kk: "бүтін сан керек жерде бөлшек қалдырады",
    ru: "оставляет дробь там, где нужно целое",
  },
  unnecessary_int_conversion: {
    kk: "қажет емес жерде бүтінге түрлендіру қолданады",
    ru: "приводит к целому там, где это не нужно",
  },
};

/**
 * One repeated mistake, described to a teacher — never as an identifier.
 *
 * The unknown-class path returns `L.teacherMistakeUnnamed` rather than the
 * input, which is the entire point of the function: there is no argument value
 * that can make it echo a raw string back onto a teacher's screen. Asserted with
 * deliberately hostile inputs (`provider_exit_502`, `PISTON_STAGE_MISSING`) in
 * `tests/school/teacher-language.test.ts`.
 */
export function teacherFailureClassLabel(failureClass: string): Localized {
  return TEACHER_FAILURE_CLASS[failureClass] ?? L.teacherMistakeUnnamed;
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
