import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * The teacher command centre's vocabulary.
 *
 * ## Why a second catalogue instead of adding to `L`
 *
 * `schools/presentation/labels.ts` is 1,186 lines read by the lesson runtime,
 * and several workstreams edit it at once. More importantly, the audit found
 * that EVERY visible string in the old teacher panel was an inline
 * `loc === "kk" ? … : …` ternary — the header, all four stat labels, the empty
 * state, every table heading — so none of them was covered by
 * `product-surface.test.ts`, which reflects over `Object.entries(L)` only.
 *
 * A separate exported object fixes that properly: `tests/teacher/language.test.ts`
 * reflects over `TL` with the same assertions (both languages present, kk never
 * a copy of ru, Kazakh-only letters actually used, no snake_case identifier
 * anywhere), and there is one place to look when a string is wrong.
 *
 * ## Register
 *
 * These are read by a teacher, not by a fourteen-year-old, and the difference
 * is real: a teacher may be told a misconception's name («// мен % орындарын
 * ауыстырады») where a learner may not, because `PRIVACY_DATA_FLOWS.md:315-316`
 * settles that a teacher is not a child. But the machine's own vocabulary —
 * `hintDependency`, `source_trust`, `unproductive_struggle`, `REDUCE_ASSISTANCE`
 * — stays out of both. Terminology is reused from the curriculum and the
 * learner surface so the two do not drift: «өз бетінше» / «самостоятельно»,
 * «көмекпен» / «с помощью», «әрекет» / «попытка», «тексеріс» / «проверка».
 *
 * ## Kazakh
 *
 * Written against the existing product's register rather than translated from
 * the Russian. Kazakh does not inflect a noun after a numeral, so the count
 * helpers below branch on locale instead of sharing a plural function — the
 * same reason `lessonsLabel`/`tasksLabel` do in the main catalogue. Native-
 * speaker sign-off remains a human gate; this is the draft that gets reviewed,
 * not a claim that it has been.
 */

const p = pluralRu;

export const TL = {
  /* --- shell ------------------------------------------------------------- */
  title: { kk: "Мұғалім кабинеті", ru: "Кабинет учителя" },
  navOverview: { kk: "Шолу", ru: "Обзор" },
  navStudents: { kk: "Оқушылар", ru: "Ученики" },
  navSkills: { kk: "Дағдылар", ru: "Навыки" },
  navLessons: { kk: "Сабақтар", ru: "Уроки" },
  navAssessments: { kk: "Тексерістер", ru: "Проверки" },
  navLeaderboard: { kk: "Рейтинг", ru: "Рейтинг" },
  backToClass: { kk: "Сыныпқа оралу", ru: "Назад к классу" },

  /* --- context bar ------------------------------------------------------- */
  classLabel: { kk: "Сынып", ru: "Класс" },
  periodLabel: { kk: "Кезең", ru: "Период" },
  monthLabel: { kk: "Ай", ru: "Месяц" },
  periodWeek: { kk: "7 күн", ru: "7 дней" },
  periodMonth: { kk: "Ағымдағы ай", ru: "Текущий месяц" },
  periodProgramme: { kk: "Бүкіл курс", ru: "Весь курс" },
  searchStudent: { kk: "Оқушыны іздеу", ru: "Поиск ученика" },

  /* --- freshness --------------------------------------------------------- */
  /**
   * When the numbers on screen were last brought up to date.
   *
   * «Рассчитано 29.08 21:14» named an internal job. A teacher is asking a
   * different question — *are these numbers current?* — so the label answers
   * that one instead. The timestamp is unchanged; only what it is called is.
   */
  computedAt: { kk: "Деректер жаңартылды", ru: "Данные обновлены" },
  freshnessNever: {
    kk: "Есептеу әлі жүргізілген жоқ — сандар жаңартылмаған.",
    ru: "Расчёт ещё не выполнялся — числа не обновлены.",
  },
  freshnessBehind: {
    kk: "Есептеу кешігіп жатыр: соңғы әрекеттер әлі есепке алынбаған.",
    ru: "Расчёт отстаёт: последние действия ещё не учтены.",
  },
  freshnessExplain: {
    kk: "Жиынтық сандар соңғы есептеу сәтіне сай. Белсенділік уақыты тікелей журналдан алынады.",
    ru: "Итоговые числа — на момент последнего расчёта. Время активности берётся прямо из журнала.",
  },

  /* --- curriculum gate --------------------------------------------------- */
  curriculumApproved: { kk: "Бекітілген", ru: "Утверждено" },
  /**
   * The month is written but nobody has signed it off.
   *
   * The chip used to read «Не проверено — ученикам не открывается», which is
   * two internal facts joined by a dash and neither of them in a teacher's
   * words. The reason now lives one keypress away, in
   * `curriculumNeverReviewedWhy`.
   *
   * The first rewrite of this said «Материал ещё не открыт ученикам» — the
   * CONSEQUENCE, which reads better — and that was wrong for a reason worth
   * recording: approval and openness are two separate fields, and a demo build
   * bypasses the gate, so the header claimed the material was closed on a page
   * whose next chip said «Открыта — ученики могут проходить». A teacher reading
   * a screen that contradicts itself stops trusting the screen. So this chip
   * states the approval fact only; whether students can actually see the month
   * is `EXTRA.curriculumClosed`, which is driven by `open`.
   */
  curriculumNeverReviewed: {
    kk: "Материал бекітілмеген",
    ru: "Материал не утверждён",
  },
  curriculumNeverReviewedWhy: {
    kk: "Айдың мазмұнын әдіскер немесе әкімшілік бекітуі керек. Бекітілгенге дейін оқушылар сабақтарды аша алмайды, сондықтан бұл беттегі сандар бос болып қалады.",
    ru: "Содержание месяца должен утвердить методист или администрация. До утверждения ученики не могут открыть уроки, поэтому числа на этой странице останутся пустыми.",
  },
  curriculumLapsed: {
    kk: "Материал бекітілгеннен кейін өзгерген",
    ru: "Материал изменился после утверждения",
  },
  curriculumLapsedWhy: {
    kk: "Айдың мазмұны бекітілген соң түзетілген, сондықтан бекіту күшін жойды. Оқушылар өзгерген сабақтарды қайта бекіткенге дейін көрмейді.",
    ru: "Содержание месяца правили уже после утверждения, поэтому утверждение перестало действовать. Изменённые уроки ученики не увидят, пока их не утвердят заново.",
  },
  /**
   * The development bypass.
   *
   * «Режим разработки» is the engineer's name for it. A teacher seeing this on
   * a real school's screen needs to know one thing: what is on this page is a
   * demonstration, and the approval step that would normally protect their
   * class has been switched off.
   */
  curriculumDevBypass: {
    kk: "Бұл — көрсетілім: материал бекітусіз ашылған. Нақты мектепте сабақтар бекітілгеннен кейін ғана ашылады.",
    ru: "Это демонстрационный режим: материал открыт без утверждения. В настоящей школе уроки открываются только после утверждения.",
  },

  /* --- KPI --------------------------------------------------------------- */
  kpiStudents: { kk: "Оқушы", ru: "Учеников" },
  kpiActive: { kk: "Кезеңде белсенді", ru: "Активны за период" },
  kpiAttention: { kk: "Назар аудару керек", ru: "Требуют внимания" },
  kpiStretch: { kk: "Күрделірекке дайын", ru: "Готовы к сложному" },
  kpiIndependent: { kk: "Өз бетінше шешілген", ru: "Решено самостоятельно" },
  kpiAssisted: { kk: "Көмекпен шешілген", ru: "Решено с помощью" },
  kpiPracticeMedian: { kk: "Жаттығу уақыты (медиана)", ru: "Время практики (медиана)" },
  kpiRequiredWork: { kk: "Міндетті сабақтар", ru: "Обязательные уроки" },

  windowWeek: { kk: "соңғы 7 күн", ru: "за 7 дней" },
  windowMonth: { kk: "ағымдағы ай", ru: "за текущий месяц" },
  windowProgramme: { kk: "курс басынан", ru: "с начала курса" },
  windowCumulative: { kk: "курс басынан, жиынтық", ru: "с начала курса, накопительно" },

  /* --- statuses ---------------------------------------------------------- */
  statusNotStarted: { kk: "Әлі бастамаған", ru: "Ещё не начал" },
  statusDormant: { kk: "Ұзақ уақыт белсенді емес", ru: "Давно не заходил" },
  statusNeedsAttention: { kk: "Назар аудару керек", ru: "Требует внимания" },
  statusReadyToStretch: { kk: "Күрделірекке дайын", ru: "Готов к сложному" },
  statusOnTrack: { kk: "Қалыпты жүруде", ru: "Идёт нормально" },

  /* --- findings ---------------------------------------------------------- */
  findingNeverStarted: {
    kk: "Сыныпқа тіркелген, бірақ бірде-бір тапсырма ашылмаған",
    ru: "Записан в класс, но не открыл ни одного задания",
  },
  findingNeverStartedAction: {
    kk: "Кіру мүмкіндігін тексеріңіз: пароль, құрылғы, тіркелгі.",
    ru: "Проверьте доступ: пароль, устройство, учётную запись.",
  },
  findingInactiveAction: {
    kk: "Сабақта сұраңыз: тоқтап қалуының себебі техникалық па, әлде тапсырмада ма?",
    ru: "Спросите на уроке: остановка техническая или из-за задания?",
  },
  findingMisconceptionAction: {
    kk: "Осы қатені тақтада бірге талдаңыз, сосын сол дағдыға бір тапсырма беріңіз.",
    ru: "Разберите эту ошибку у доски, затем дайте одно задание на тот же навык.",
  },
  findingAssistanceAction: {
    kk: "Көмексіз бір тапсырма беріп көріңіз: не білетінін көрсету үшін.",
    ru: "Дайте одно задание без подсказок — чтобы увидеть, что он умеет сам.",
  },
  findingStuckAction: {
    kk: "Қасына отырыңыз: идея қалмаған, жаңа әрекет жасамай тұр.",
    ru: "Сядьте рядом: идей не осталось, новых попыток не делает.",
  },
  findingThrashingAction: {
    kk: "Тоқтатып, есепті дауыстап оқытыңыз: бірнеше нәрсені бірден өзгертіп жатыр.",
    ru: "Остановите и попросите прочитать условие вслух: меняет несколько вещей сразу.",
  },
  findingUnexplainedAction: {
    kk: "Жұмысын өзіңіз қараңыз: жүйе бұл қателердің себебін анықтай алмады.",
    ru: "Посмотрите работу сами: система не смогла установить причину этих ошибок.",
  },
  findingBehindAction: {
    kk: "Қай сабақта тоқтап қалғанын нақтылап, сол жерден жалғастыруға көмектесіңіз.",
    ru: "Уточните, на каком уроке остановился, и помогите продолжить оттуда.",
  },
  findingAssessmentAction: {
    kk: "Тексерісті аяқтауға уақыт бөліңіз.",
    ru: "Выделите время на завершение проверки.",
  },
  findingRegressedAction: {
    kk: "Өткен аптамен салыстырыңыз: тапсырмалар қиындады ма, әлде басқа себеп бар ма?",
    ru: "Сравните с прошлой неделей: задания стали труднее или причина в другом?",
  },
  findingRevealAction: {
    kk: "Жауапты ашпас бұрын бір әрекет жасауды сұраңыз.",
    ru: "Попросите сделать хотя бы одну попытку до того, как открывать ответ.",
  },

  /* --- strengths --------------------------------------------------------- */
  strengthIndependent: { kk: "Бірнеше дағдыда өз бетінше шешеді", ru: "Решает самостоятельно по нескольким навыкам" },
  strengthImproved: { kk: "Өткен кезеңмен салыстырғанда жақсарған", ru: "Улучшение по сравнению с прошлым периодом" },
  strengthDelayedResolve: {
    kk: "Уақыт өткен соң тапсырманы өз бетінше қайта шешті",
    ru: "Спустя время решил задание заново самостоятельно",
  },

  /* --- roster table ------------------------------------------------------ */
  colStudent: { kk: "Оқушы", ru: "Ученик" },
  colStatus: { kk: "Жағдайы", ru: "Состояние" },
  colLastActive: { kk: "Соңғы белсенділік", ru: "Последняя активность" },
  colRequired: { kk: "Міндетті", ru: "Обязательное" },
  colIndependent: { kk: "Өз бетінше", ru: "Самост." },
  colAssisted: { kk: "Көмекпен", ru: "С помощью" },
  colAttempts: { kk: "Әрекет", ru: "Попыток" },
  colPractice: { kk: "Жаттығу", ru: "Практика" },
  colDays: { kk: "Күн", ru: "Дней" },
  colTopic: { kk: "Ағымдағы тақырып", ru: "Текущая тема" },
  colHelp: { kk: "Көмек", ru: "Помощь" },
  sortBy: { kk: "Сұрыптау", ru: "Сортировка" },

  /* --- skills ------------------------------------------------------------ */
  skillsTitle: { kk: "Сынып × дағды", ru: "Класс × навык" },
  colSkill: { kk: "Дағды", ru: "Навык" },
  colAttemptedBy: { kk: "Бастаған", ru: "Начали" },
  colMedianAttempts: { kk: "Әрекет (медиана)", ru: "Попыток (медиана)" },
  colTopMistake: { kk: "Жиі қате", ru: "Частая ошибка" },
  skillNotIntroduced: { kk: "Бұл ай әлі өтпеген", ru: "Этот месяц ещё не изучался" },
  skillNobodyStarted: {
    kk: "Бұл дағды бойынша әлі ешкім тапсырма орындамаған.",
    ru: "По этому навыку ещё никто не выполнял заданий.",
  },

  /* --- lessons ----------------------------------------------------------- */
  lessonsTitle: { kk: "Сабақтар бойынша", ru: "По урокам" },
  colLesson: { kk: "Сабақ", ru: "Урок" },
  colStarted: { kk: "Бастаған", ru: "Начали" },
  colCompleted: { kk: "Аяқтаған", ru: "Завершили" },
  colMedianTime: { kk: "Уақыт (медиана)", ru: "Время (медиана)" },
  colHardestBlock: { kk: "Ең қиын тапсырма", ru: "Самое трудное задание" },
  colDropOff: { kk: "Тоқтайтын жері", ru: "Где останавливаются" },
  lessonNotAuthored: {
    kk: "Бұл сабақтың мазмұны әлі жазылмаған",
    ru: "Содержание этого урока ещё не написано",
  },
  lessonsUnauthoredNote: {
    kk: "Төмендегі сабақтардың құрылымы бар, бірақ тапсырмалары әлі жазылмаған. Олар оқушыларға ашылмайды.",
    ru: "У этих уроков есть структура, но задания ещё не написаны. Ученикам они не открываются.",
  },

  /* --- blocks ------------------------------------------------------------ */
  blocksTitle: { kk: "Тапсырмалар", ru: "Задания" },
  colBlock: { kk: "Тапсырма", ru: "Задание" },
  colAcceptRate: { kk: "Дұрыс шешкен", ru: "Решили верно" },
  colRevealed: { kk: "Жауапты ашқан", ru: "Открыли ответ" },
  blockNotMachineGraded: {
    kk: "Мұны машина тексермейді — жауапты адам оқиды",
    ru: "Это машина не проверяет — ответ читает человек",
  },

  /* --- assessments ------------------------------------------------------- */
  assessmentsTitle: { kk: "Айлық тексеріс", ru: "Месячная проверка" },
  assessmentNotOpen: { kk: "Тексеріс әлі ашылмаған", ru: "Проверка ещё не открыта" },
  assessmentStateNotStarted: { kk: "Бастамаған", ru: "Не начал" },
  assessmentStateInProgress: { kk: "Орындауда", ru: "В процессе" },
  /**
   * A completion state, not a queue.
   *
   * It means every block a MACHINE can grade is graded and only human-marked
   * work is outstanding. It said «Ждёт проверки человеком», which is the same
   * sentence the marking queue on the same screen uses — so a class could show
   * «Ждёт проверки человеком 0» directly above «Ждут проверки — 3» and be
   * telling the truth twice about two different things. A teacher reads that
   * as a bug, correctly.
   *
   * The distribution counts LEARNERS whose check is at that stage; the queue
   * counts ANSWERS waiting to be read. Naming the stage after what the machine
   * finished keeps them apart.
   */
  assessmentStateAwaitingReview: {
    kk: "Мұғалімге қалды",
    ru: "Осталось учителю",
  },
  assessmentStateComplete: { kk: "Аяқталған", ru: "Завершено" },
  assessmentUnmeasured: {
    kk: "Өлшенбеді — тексеру жүйесі жауап бермеді. Ешкімге қате қойылған жоқ.",
    ru: "Не измерено — система проверки не ответила. Никому ошибка не поставлена.",
  },
  assessmentExpectedPoints: { kk: "Жауапта болуы тиіс", ru: "Что должно быть в ответе" },
  /**
   * Written and oral, told apart — because they are different facts now.
   *
   * The old sentence said both were unstored. Migration 0021 made that false
   * for written work: `learning_submissions.answer` keeps the learner's own
   * text and `/teacher/assessments` opens it. What is still true is that the
   * product records no AUDIO anywhere — there is no recorder in the renderer,
   * no media column in any migration and no upload route — so the oral defence
   * happens in the room with the teacher, and the platform holds only the short
   * note the learner wrote before speaking.
   *
   * Saying «written and oral answers are not stored» would now be wrong in one
   * half and misleading in the other.
   */
  assessmentWrittenStored: {
    kk: "Жазбаша жауаптарды осы жерден оқуға болады.",
    ru: "Письменные ответы можно прочитать здесь.",
  },
  assessmentOralInPerson: {
    kk: "Ауызша жауапты оқушы мұғалімге сабақта береді — жазба жүргізілмейді. Мұнда оқушының сөйлер алдында жазып қойған қысқа жазбасы ғана сақталады.",
    ru: "Устный ответ ученик даёт учителю на уроке — запись не ведётся. Здесь сохраняется только короткая заметка, которую он записал перед ответом.",
  },
  /** A submission settled before answers were kept. The words are gone. */
  assessmentUnreadableShort: { kk: "Мәтін сақталмаған", ru: "Текст не сохранён" },

  /* --- assistance -------------------------------------------------------- */
  assistanceTitle: { kk: "Көмек", ru: "Помощь" },
  assistanceRequested: { kk: "Сұралған", ru: "Запрошено" },
  assistanceDelivered: { kk: "Жеткен", ru: "Получено" },
  assistanceUndelivered: { kk: "Жетпеген", ru: "Не дошло" },
  assistanceLevel: { kk: "Көмек деңгейі", ru: "Уровень помощи" },
  assistanceResolvedIndependently: { kk: "Одан кейін өзі шешті", ru: "После этого решил сам" },
  assistanceResolvedByTransfer: { kk: "Дайын кодты көшірді", ru: "Скопировал готовый код" },
  assistanceStalled: { kk: "Жаңа әрекет жасамады", ru: "Новых попыток не делал" },
  assistanceEscalated: { kk: "Күштірек көмек сұрады", ru: "Попросил помощь сильнее" },
  assistanceWindowNote: {
    kk: "Көмектен кейінгі 20 минуттағы әрекеттер ғана есептеледі. Келесі күні шешкені бұл жерде көрінбейді.",
    ru: "Учитываются только действия в течение 20 минут после помощи. Решение на следующий день здесь не видно.",
  },
  assistanceNoTranscripts: {
    kk: "Оқушының Nova-мен жазысқаны сақталмайды және мұғалімге көрсетілмейді. Бұл — жүйенің қасиеті, олқылық емес.",
    ru: "Переписка ученика с Nova не сохраняется и учителю не показывается. Это свойство системы, а не пробел.",
  },
  assistanceDegraded: {
    kk: "Бұл кезеңде Nova нақты модельсіз жұмыс істеді — көмектің тиімділігі туралы қорытынды жасауға болмайды.",
    ru: "В этот период Nova работала без реальной модели — выводы об эффективности помощи делать нельзя.",
  },

  /* --- leaderboard ------------------------------------------------------- */
  leaderboardTitle: { kk: "Сынып рейтингі", ru: "Рейтинг класса" },
  lensIndependent: { kk: "Өз бетінше", ru: "Самостоятельность" },
  lensImprovement: { kk: "Өсу", ru: "Рост" },
  lensConsistency: { kk: "Тұрақтылық", ru: "Регулярность" },
  lensChallenge: { kk: "Күрделі тапсырмалар", ru: "Сложные задания" },
  lensIndependentExplain: {
    kk: "Көмексіз және жауапты ашпай шешілген тапсырмалар саны. Бір тапсырма бір рет қана есептеледі.",
    ru: "Число заданий, решённых без подсказок и без открытия ответа. Одно задание считается один раз.",
  },
  lensImprovementExplain: {
    kk: "Осы кезеңдегі өз бетінше шешілген тапсырмалар саны алдыңғы дәл сондай ұзақтықтағы кезеңмен салыстырылады.",
    ru: "Число самостоятельно решённых заданий за этот период сравнивается с предыдущим периодом такой же длины.",
  },
  lensConsistencyExplain: {
    kk: "Тапсырма орындалған бөлек күндер саны. Уақыт мөлшері емес, күндер саны есептеледі.",
    ru: "Число отдельных дней, в которые выполнялись задания. Считаются дни, а не количество времени.",
  },
  lensChallengeExplain: {
    kk: "Күрделі және дербес тексеру тапсырмаларының көмексіз шешілгені.",
    ru: "Сложные задания и задания на самопроверку, решённые без подсказок.",
  },
  leaderboardUnranked: { kk: "Салыстыруға дерек жеткіліксіз", ru: "Недостаточно данных для сравнения" },
  leaderboardUnrankedReason: {
    kk: "Бұл кезеңде тапсырма аз орындалған — орын берілмейді.",
    ru: "За этот период выполнено мало заданий — место не присваивается.",
  },
  leaderboardClassOnly: {
    kk: "Рейтинг тек осы сынып ішінде. Басқа сыныптармен немесе мектептермен салыстырылмайды.",
    ru: "Рейтинг только внутри этого класса. С другими классами и школами не сравнивается.",
  },

  /* --- empty and unknown states ------------------------------------------ */
  emptyNoStudents: {
    kk: "Бұл сыныпта тіркелген оқушы жоқ.",
    ru: "В этом классе нет записанных учеников.",
  },
  emptyNoActivity: {
    kk: "Бұл кезеңде әрекет тіркелмеген. Оқушылар сабақты бастағанда деректер пайда болады.",
    ru: "За этот период действий не зафиксировано. Данные появятся, когда ученики начнут занятия.",
  },
  emptyNoAttention: {
    kk: "Дәл қазір ешкім назар аударуды қажет етпейді.",
    ru: "Сейчас никто не требует особого внимания.",
  },
  emptyNoStretch: {
    kk: "Күрделірек тапсырмаға дайын деп санауға дерек жеткіліксіз.",
    ru: "Пока недостаточно данных, чтобы считать кого-то готовым к более сложному.",
  },
  emptyInsufficientEvidence: {
    kk: "Қорытынды жасауға дерек жеткіліксіз.",
    ru: "Недостаточно данных для вывода.",
  },
  emptyNotMeasured: { kk: "Өлшенбеген", ru: "Не измерено" },
  noData: { kk: "Дерек жоқ", ru: "Нет данных" },
  never: { kk: "Ешқашан", ru: "Никогда" },

  /* --- timeline ---------------------------------------------------------- */
  timelineLessonCompleted: { kk: "Сабақты аяқтады", ru: "Завершил урок" },
  timelineSolvedIndependently: { kk: "Өз бетінше шешті", ru: "Решил самостоятельно" },
  timelineSolvedWithHelp: { kk: "Көмекпен шешті", ru: "Решил с помощью" },
  timelineAttempted: { kk: "Әрекет жасады", ru: "Была попытка" },
  timelineAssistanceTaken: { kk: "Көмек алды", ru: "Взял подсказку" },
  timelineSolutionRevealed: { kk: "Жауапты ашты", ru: "Открыл ответ" },
  timelineAssessmentSubmitted: { kk: "Тексеріс тапсырмасын жіберді", ru: "Отправил задание проверки" },
  timelineReviewResolved: { kk: "Қайталау тапсырмасын шешті", ru: "Решил задание на повторение" },
  timelineReturnedAfterBreak: { kk: "Үзілістен кейін оралды", ru: "Вернулся после перерыва" },

  /* --- reviews ----------------------------------------------------------- */
  reviewsTitle: { kk: "Кейінге қалдырылған қайталау", ru: "Отложенное повторение" },
  reviewReasonAssisted: { kk: "Көмекпен шешілгендіктен", ru: "Потому что решено с помощью" },
  reviewReasonMilestone: { kk: "Өз бетінше шешілген маңызды тапсырма", ru: "Важное задание, решённое самостоятельно" },
  reviewOutcomeIndependent: { kk: "Қайта шешті — өз бетінше", ru: "Решил заново — самостоятельно" },
  reviewOutcomeAssisted: { kk: "Қайта шешті — көмекпен", ru: "Решил заново — с помощью" },
  reviewOutcomeUnresolved: { kk: "Қайта шеше алмады", ru: "Заново решить не смог" },
  reviewDue: { kk: "Мерзімі жеткен", ru: "Пора повторить" },
  reviewPending: { kk: "Күтуде", ru: "Ожидает" },

  /* --- export ------------------------------------------------------------ */
  exportCsv: { kk: "CSV жүктеу", ru: "Скачать CSV" },
  exportNote: {
    kk: "Тек осы сыныптың оқу деректері. Nova жазбалары мен жасырын тесттер кірмейді.",
    ru: "Только учебные данные этого класса. Переписка Nova и скрытые тесты не включаются.",
  },

  /* --- misc -------------------------------------------------------------- */
  ofTotal: { kk: "барлығы", ru: "из" },
  minutesShort: { kk: "мин", ru: "мин" },
  showEvidence: { kk: "Дәлелін көру", ru: "Показать основание" },
  hideEvidence: { kk: "Жасыру", ru: "Скрыть" },
  recommendedAction: { kk: "Не істеуге болады", ru: "Что можно сделать" },
  since: { kk: "Қашаннан", ru: "С какого времени" },
  loading: { kk: "Жүктелуде…", ru: "Загрузка…" },
} as const;

export type TeacherLabelKey = keyof typeof TL;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */
/*
 * Kazakh does not inflect a noun after a numeral — «3 күн», not «3 күндер» —
 * while Russian needs three forms. So these branch on locale rather than
 * sharing one plural helper, which is the same shape `lessonsLabel` and
 * `tasksLabel` use in the main catalogue.
 */

export function daysAgo(n: number): Localized {
  return {
    kk: `${n} күн бойы белсенділік жоқ`,
    ru: `Нет активности ${n} ${p(n, "день", "дня", "дней")}`,
  };
}

export function inEpisodes(n: number): Localized {
  return {
    kk: `${n} бөлек әрекетте қайталанды`,
    ru: `повторилось в ${n} ${p(n, "попытке", "попытках", "попытках")}`,
  };
}

export function solvesNeededHelp(pct: number, assisted: number, solved: number): Localized {
  return {
    kk: `${solved} шешімнің ${assisted}-і күшті көмекті қажет етті (${pct}%)`,
    ru: `${assisted} из ${solved} решений потребовали сильной подсказки (${pct}%)`,
  };
}

export function stuckEpisodes(n: number): Localized {
  return {
    kk: `${n} тапсырмада тоқтап қалды — жаңа әрекет жасамады`,
    ru: `Застрял на ${n} ${p(n, "задании", "заданиях", "заданиях")} — новых попыток не делал`,
  };
}

export function thrashEpisodes(n: number): Localized {
  return {
    kk: `${n} тапсырмада көп нәрсені бірден өзгертіп, нәтиже шықпады`,
    ru: `На ${n} ${p(n, "задании", "заданиях", "заданиях")} менял многое сразу, результат не двигался`,
  };
}

export function unexplainedFailures(n: number): Localized {
  return {
    kk: `${n} қатенің себебін жүйе анықтай алмады`,
    ru: `Система не смогла установить причину ${n} ${p(n, "ошибки", "ошибок", "ошибок")}`,
  };
}

export function behindByLessons(n: number, median: number): Localized {
  return {
    kk: `${n} сабақ аяқталған, сыныптың ортасы — ${median}`,
    ru: `Завершено ${n} ${p(n, "урок", "урока", "уроков")}, середина класса — ${median}`,
  };
}

export function independentAcrossSkills(n: number): Localized {
  return {
    kk: `${n} дағдыда өз бетінше шешіп жүр`,
    ru: `Решает самостоятельно по ${n} ${p(n, "навыку", "навыкам", "навыкам")}`,
  };
}

export function improvedBy(now: number, before: number): Localized {
  return {
    kk: `Өз бетінше шешу: ${before} → ${now}`,
    ru: `Самостоятельных решений: ${before} → ${now}`,
  };
}

export function regressedBy(now: number, before: number): Localized {
  return {
    kk: `Өз бетінше шешу азайды: ${before} → ${now}`,
    ru: `Самостоятельных решений стало меньше: ${before} → ${now}`,
  };
}

export function revealedOften(revealed: number, solved: number): Localized {
  return {
    kk: `${solved} шешімнің ${revealed}-інде жауап ашылған`,
    ru: `В ${revealed} из ${solved} решений ответ был открыт`,
  };
}

export function assessmentIncomplete(done: number, total: number): Localized {
  return {
    kk: `Тексерістің ${total} тапсырмасының ${done}-і орындалған`,
    ru: `Выполнено ${done} из ${total} заданий проверки`,
  };
}

export function nOfM(n: number, m: number): string {
  return `${n}/${m}`;
}

export function minutesLabel(mins: number): Localized {
  return { kk: `${mins} мин`, ru: `${mins} мин` };
}

export function daysWorked(n: number): Localized {
  return {
    kk: `${n} күн жұмыс істеді`,
    ru: `Работал ${n} ${p(n, "день", "дня", "дней")}`,
  };
}
