import type { Localized } from "@schools/curriculum/types";

/**
 * Strings the student drill-down needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. This file is additive and covers exactly one screen:
 * `/teacher/students/[subjectId]`.
 *
 * Same rules as `TL`. No identifier, no machine vocabulary, no English. Kazakh
 * written in the product's own register rather than translated from the Russian,
 * and no noun inflected after a numeral («3 күн», never «3 күндер»).
 *
 * The one thing worth calling out: several of these exist purely so that a
 * WINDOW is never left implicit. The audit's finding on the old panel was that a
 * 7-day count sat on the same line as an all-time count with nothing to tell
 * them apart, so `groupWindowed` / `groupCumulative` are headings this page is
 * not allowed to omit.
 */

export const EXTRA = {
  /* --- profile ----------------------------------------------------------- */
  profileTitle: { kk: "Оқу жағдайы", ru: "Учебная ситуация" },
  /** Why this learner is flagged. Never a mood, always a checkable cause. */
  findingsTitle: { kk: "Неге назар аудару керек", ru: "На что обратить внимание" },
  findingsNone: {
    kk: "Бұл оқушыда дәл қазір назар аударатын нәрсе жоқ.",
    ru: "У этого ученика сейчас обращать внимание не на что.",
  },
  strengthsTitle: { kk: "Не жақсы жүріп жатыр", ru: "Что получается" },
  strengthsNone: {
    kk: "Күшті жақтарын атап көрсетуге дерек әлі жеткіліксіз.",
    ru: "Пока недостаточно данных, чтобы назвать сильные стороны.",
  },
  /** The lesson or block last worked on. Absent for a learner who has none. */
  currentTopicNone: { kk: "Ағымдағы тақырып белгісіз", ru: "Текущая тема неизвестна" },
  /** Stricter than «последняя активность»: this one means work, not a login. */
  lastWorked: { kk: "Соңғы жұмыс", ru: "Последняя работа" },
  backToRoster: { kk: "Оқушылар тізіміне оралу", ru: "К списку учеников" },

  /* --- learning evidence -------------------------------------------------- */
  evidenceTitle: { kk: "Оқу дерегі", ru: "Учебные данные" },
  evidenceLead: {
    kk: "Жоғарғы қатар — таңдалған кезең ғана. Төменгі қатар — курс басынан бергі жиынтық. Оларды араластыруға болмайды.",
    ru: "Верхний ряд — только выбранный период. Нижний ряд — накопительно с начала курса. Смешивать их нельзя.",
  },
  groupWindowed: { kk: "Кезең бойынша", ru: "За период" },
  groupCumulative: { kk: "Жиынтық", ru: "Накопительно" },
  /**
   * The control on the disclosure that holds `evidenceLead`.
   *
   * A question, because that is what a teacher is actually asking when they
   * reach for it. The sentence behind it explains how the two rows are BUILT;
   * the caveats that change how they are READ stay in the layout.
   */
  howCounted: { kk: "Бұл қалай есептеледі?", ru: "Как это считается?" },
  /** `LearnerState.unattributedFailures`. The honest denominator, shown. */
  unexplainedLabel: {
    kk: "Себебі анықталмаған қателер",
    ru: "Ошибки без установленной причины",
  },
  unexplainedNote: {
    kk: "Жүйе бұл қателердің себебін анықтай алмады. Қалған сандар сол себепті толық емес.",
    ru: "Система не смогла установить причину этих ошибок. Остальные числа поэтому неполные.",
  },
  /** `transferSolves` — solved by pasting the hint's own code. */
  transferLabel: {
    kk: "Дайын кодты көшіріп шешкені",
    ru: "Решено копированием готового кода",
  },
  /** Share of solves that needed no help. Always beside its two counts. */
  independentShare: { kk: "Өз бетінше үлесі", ru: "Доля самостоятельных" },

  /* --- skills ------------------------------------------------------------- */
  skillProfileTitle: { kk: "Дағдылар бойынша", ru: "По навыкам" },
  skillProfileLead: {
    kk: "Дағды жағдайы мен қателер курс басынан бергі барлық жұмысқа сүйенеді, таңдалған кезеңге емес.",
    ru: "Состояние по навыкам и ошибки опираются на всю работу с начала курса, а не на выбранный период.",
  },
  colSummary: { kk: "Қысқаша", ru: "Кратко" },
  lastSeen: { kk: "соңғы рет", ru: "последний раз" },

  /* --- lessons ------------------------------------------------------------ */
  lessonsNone: {
    kk: "Бұл айда мазмұны жазылған сабақ жоқ.",
    ru: "В этом месяце нет уроков с написанным содержанием.",
  },
  lessonNotCompleted: { kk: "Аяқталмаған", ru: "Не завершён" },

  /* --- assessment --------------------------------------------------------- */
  assessmentNone: {
    kk: "Бұл айда тексеріс жоқ.",
    ru: "В этом месяце проверки нет.",
  },
  requirementMet: { kk: "Талап орындалған", ru: "Требование выполнено" },
  requirementNotMet: { kk: "Талап әлі орындалмаған", ru: "Требование ещё не выполнено" },
  assessmentMinutes: { kk: "Тексеріске жұмсалған уақыт", ru: "Время на проверку" },
  assessmentCompletedAt: { kk: "Аяқталған уақыты", ru: "Завершено" },

  /* --- assistance --------------------------------------------------------- */
  assistanceProgressed: { kk: "Алға жылжыды", ru: "Продвинулся" },
  assistanceRegressed: { kk: "Нашарлады", ru: "Стало хуже" },
  assistanceNone: {
    kk: "Бұл кезеңде көмек сұралмаған.",
    ru: "За этот период помощь не запрашивалась.",
  },
  assistanceBlocksTitle: {
    kk: "Көмек жиі алынған тапсырмалар",
    ru: "Задания, где чаще брали помощь",
  },
  /**
   * The control on the disclosure that holds the twenty-minute outcome window
   * and the statement that no conversation is stored.
   *
   * Both are properties of how these counts are ASSEMBLED, so both live behind
   * one question. `TL.assistanceDegraded` is not in here: a canned-hint outage
   * changes what the numbers mean and stays on the page.
   */
  assistanceNotes: {
    kk: "Бұл сандар нені қамтиды?",
    ru: "Что входит в эти числа?",
  },

  /* --- reviews ------------------------------------------------------------ */
  colReviewReason: { kk: "Себебі", ru: "Причина" },
  colReviewDue: { kk: "Мерзімі", ru: "Срок" },
  colReviewOutcome: { kk: "Нәтижесі", ru: "Результат" },
  reviewsNone: {
    kk: "Қайталауға қойылған тапсырма жоқ.",
    ru: "Заданий на повторение нет.",
  },

  /* --- activity and timeline ---------------------------------------------- */
  activityTitle: { kk: "Белсенділік", ru: "Активность" },
  timelineTitle: { kk: "Не болғаны", ru: "Что происходило" },
  timelineLead: {
    kk: "Таңдалған кезеңдегі әрекеттер, соңғысынан бастап.",
    ru: "Действия за выбранный период, начиная с последнего.",
  },
} as const;

export type StudentExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/**
 * «2-тапсырма» / «Задание 2».
 *
 * The assessment's blocks carry a localised KIND («Код», «Түсіндіру») and a raw
 * `blockId` that must never be rendered. Two coding blocks would otherwise be
 * two rows with the same visible name, so they are numbered by position.
 */
export function taskNumber(n: number): Localized {
  return { kk: `${n}-тапсырма`, ru: `Задание ${n}` };
}
