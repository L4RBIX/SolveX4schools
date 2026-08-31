import type { Localized } from "@schools/curriculum/types";
import { pluralRu } from "@schools/presentation/labels";

/**
 * Strings the assessments screen needs and `TL` does not have.
 *
 * `schools/teacher/labels.ts` is shared by six workstreams at once, so it is not
 * edited from here. This file is additive and covers exactly one area: the
 * monthly check as a teacher reads it — the authored budget, the state
 * distribution, the block key with its marking criteria, the human-review
 * queue, and the honesty flags (`unmeasuredCoding`, and the residue of
 * submissions settled before answers were kept) that the summary carries.
 *
 * Same register and the same rules as `TL`: no identifier, no machine
 * vocabulary, Kazakh written rather than translated, and no noun inflected after
 * a numeral («3 күн», never «3 күндер»).
 *
 * ## Why `requiredLevel` is here and not imported
 *
 * `attemptLevelLabel` in `schools/teacher/context.ts` names the rung a learner
 * REACHED, and that module is `server-only` — a client component cannot import
 * it, and the payload already ships `reachedLabel` for exactly that reason. What
 * the payload does NOT ship is a label for `AssessmentBlockResult.required`,
 * which crosses as a bare rung key. So the requirement is named here, in the
 * imperative («должен быть ответ») rather than the descriptive («ответ дан»),
 * because a requirement and an achievement are different sentences even when
 * they name the same rung.
 */

const p = pluralRu;

export const EXTRA = {
  /* --- the check itself -------------------------------------------------- */
  /** The month is published and the check is servable. Paired with `TL.assessmentNotOpen`. */
  assessmentOpen: {
    kk: "Ашық — оқушылар орындай алады",
    ru: "Открыта — ученики могут проходить",
  },
  /** `AssessmentState.not_open`, which `TL` has no label for. */
  stateNotOpen: { kk: "Ашылмаған", ru: "Не открыта" },
  /** Why the table is empty when the month has not been opened. */
  notOpenHint: {
    kk: "Ай мазмұны ашылған соң оқушылар тексерісті орындай алады. Әзірге орындалған жұмыс жоқ.",
    ru: "Ученики смогут пройти проверку, когда содержание месяца будет открыто. Пока выполненной работы нет.",
  },
  /** The month has no authored check at all. Different from a closed one. */
  noAssessment: { kk: "Бұл айда тексеріс жоқ", ru: "В этом месяце проверки нет" },
  noAssessmentHint: {
    kk: "Ағымдағы айдың тексерісі әлі жазылмаған. Жазылған соң осы жерде көрінеді.",
    ru: "Проверка текущего месяца ещё не написана. Когда её напишут, она появится здесь.",
  },

  /* --- the authored budget ----------------------------------------------- */
  budgetLabel: { kk: "Жоспарланған уақыт", ru: "Планируемое время" },
  /**
   * The sentence that keeps the budget from being read as a limit.
   *
   * `MonthlyAssessment.minutes` is an author's estimate and nothing enforces it:
   * there is no timer component anywhere in the product, and no submission is
   * ever refused for arriving late.
   */
  budgetEstimate: {
    kk: "Бұл — автор көрсеткен шамамен уақыт. Жүйе оны шектемейді, таймер жоқ.",
    ru: "Это ориентировочное время от автора. Система его не ограничивает, таймера нет.",
  },
  budgetNone: { kk: "Автор уақыт көрсетпеген", ru: "Автор время не указал" },
  /** Measured minutes, against the authored estimate above. */
  measuredMedian: { kk: "Нақты уақыт (медиана)", ru: "Фактическое время (медиана)" },

  /* --- distribution ------------------------------------------------------ */
  distributionTitle: { kk: "Сынып бойынша жағдай", ru: "Состояние по классу" },
  /** Caption of the screen-reader table that carries the distribution's numbers. */
  distributionCaption: {
    kk: "Тексеріс жағдайы бойынша оқушылар саны",
    ru: "Число учеников по состоянию проверки",
  },

  /* --- honesty flags ----------------------------------------------------- */
  /** Heading over `TL.assessmentUnmeasured`. */
  unmeasuredTitle: { kk: "Кодтық тапсырма өлшенбеді", ru: "Задание с кодом не измерено" },
  /** Heading over `TL.assessmentUnreadable`. */
  unreadableTitle: { kk: "Жазбаша және ауызша жауаптар", ru: "Письменные и устные ответы" },

  /* --- block key --------------------------------------------------------- */
  blockKeyTitle: { kk: "Тексеріс тапсырмалары", ru: "Задания проверки" },
  blockKeyNote: {
    kk: "Нөмірлер оқушылар кестесіндегі белгілердің ретіне сәйкес.",
    ru: "Номера соответствуют порядку значков в таблице учеников.",
  },
  /** Why the task list is empty when the assessment plainly exists. */
  blockKeyNeedsLearners: {
    kk: "Тапсырмалар тізімі оқушылардың жұмысы бойынша құрылады. Сыныпқа оқушы қосылған соң осы жерде көрінеді.",
    ru: "Список заданий строится по работе учеников. Он появится здесь, когда в классе будут ученики.",
  },
  requirementLabel: { kk: "Талап", ru: "Требуется" },
  requirementMet: { kk: "Талап орындалды", ru: "Требование выполнено" },
  requirementNotMet: { kk: "Талап орындалмады", ru: "Требование не выполнено" },
  markedByHuman: { kk: "Адам тексереді", ru: "Проверяет человек" },
  markedByMachine: { kk: "Машина тексереді", ru: "Проверяет машина" },
  metByStudents: { kk: "Талапты орындағандар", ru: "Выполнили требование" },
  /** Under `TL.assessmentExpectedPoints`. These are the standard, not the answer. */
  expectedPointsNote: {
    kk: "Бұл — бағалау өлшемдері, дайын жауап емес.",
    ru: "Это критерии оценивания, а не готовый ответ.",
  },
  /**
   * The disclosure that opens the marking criteria.
   *
   * A question, because `Hint` renders a «?» beside it. The criteria are the
   * standard a human marks against — they are not hidden, they are one keypress
   * away, and the sentence inside still says they are not the answer.
   */
  markingCriteria: { kk: "Бағалау өлшемдері қандай?", ru: "Какие критерии оценивания?" },
  /**
   * A block this learner never touched.
   *
   * `AssessmentBlockResult.reached === "none"`. Named because the status strip
   * paints it as its own mark and a mark without a word is a colour carrying
   * meaning alone.
   */
  blockNotStarted: { kk: "Тапсырма басталмаған", ru: "Задание не начато" },
  /** Column heading over the status strip. Opens the per-block detail. */
  blocksStrip: { kk: "Тапсырмалар", ru: "Задания" },

  /* --- learner table ----------------------------------------------------- */
  studentsCaption: {
    kk: "Оқушылар бойынша тексеріс нәтижесі",
    ru: "Результаты проверки по ученикам",
  },
  colCompletedAt: { kk: "Аяқталған уақыты", ru: "Завершено" },
  colMinutes: { kk: "Уақыт", ru: "Время" },
  /** No completion timestamp. NOT «не измерено» — the state column says why. */
  notCompleted: { kk: "Аяқталмаған", ru: "Не завершено" },
} as const;

export type AssessmentExtraKey = keyof typeof EXTRA;

/* -------------------------------------------------------------------------- */
/* The requirement rung                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What the completion policy demands of one block, in the teacher's language.
 *
 * Total over `unknown`, and there is no branch that returns its own input: a
 * rung added to `AttemptLevel` after this was written must degrade to a sentence
 * rather than print `answered` at a teacher. The four rungs below are the ones
 * `requirementFor` can currently produce for a governed block; `none` is
 * filtered out upstream, and is named anyway so the function is total.
 */
export function requiredLevel(required: string): Localized {
  switch (required) {
    case "attempted":
      return { kk: "Кемінде бір әрекет", ru: "Хотя бы одна попытка" };
    case "answered":
      return { kk: "Жауап берілуі керек", ru: "Должен быть ответ" };
    case "measured":
      return { kk: "Тексеруден өтуі керек", ru: "Должно пройти проверку" };
    case "passed":
      return { kk: "Дұрыс орындалуы керек", ru: "Должно быть выполнено верно" };
    default:
      return { kk: "Талап қойылмаған", ru: "Требования нет" };
  }
}

/* -------------------------------------------------------------------------- */
/* Counted phrases                                                            */
/* -------------------------------------------------------------------------- */

/** «14 оқушының дерегі бойынша» / «по данным 14 учеников» — a median's base. */
export function learnersMeasured(n: number): Localized {
  return {
    kk: `${n} оқушының дерегі бойынша`,
    ru: `по данным ${n} ${p(n, "ученика", "учеников", "учеников")}`,
  };
}

/**
 * Learners whose coding half could not be measured.
 *
 * Phrased as a fact about the check, not about the child — nobody was marked
 * wrong, and the sentence beside this one (`TL.assessmentUnmeasured`) says so.
 */
export function learnersUnmeasured(n: number): Localized {
  return {
    kk: `${n} оқушыда өлшенбеген тапсырма бар`,
    ru: `Неизмеренное задание есть у ${n} ${p(n, "ученика", "учеников", "учеников")}`,
  };
}

/**
 * The population the state distribution is taken over.
 *
 * A distribution whose denominator is off screen is four counts a teacher
 * cannot check. No noun inflected after the numeral in Kazakh.
 */
export function rosterTotal(n: number): Localized {
  return {
    kk: `Барлығы ${n} оқушы`,
    ru: `Всего ${n} ${p(n, "ученик", "ученика", "учеников")}`,
  };
}

/**
 * One marker in a learner's status strip, as a sentence.
 *
 * The strip is six 14px marks in a table cell; its whole accessible surface is
 * this string. Block number and kind so it points back at the task band, the
 * rung the learner REACHED, and whether that met the requirement — the three
 * things the collapsed per-block columns used to say in full width.
 */
export function blockMarker(
  index: number,
  kind: Localized,
  reached: Localized,
  met: boolean,
): Localized {
  const verdict = met ? EXTRA.requirementMet : EXTRA.requirementNotMet;
  return {
    kk: `${index + 1}. ${kind.kk} — ${reached.kk} — ${verdict.kk}`,
    ru: `${index + 1}. ${kind.ru} — ${reached.ru} — ${verdict.ru}`,
  };
}

/**
 * Answers submitted before the platform kept them.
 *
 * Migration 0021 added `learning_submissions.answer`. Work settled before it
 * kept its verdict and lost its words, permanently. This is that residue —
 * shrinking with every new submission and never reaching zero for a class that
 * sat the check early.
 */
export function responsesUnreadable(n: number): Localized {
  return {
    kk: `${n} жауаптың мәтіні сақталмаған`,
    ru: `У ${n} ${p(n, "ответа", "ответов", "ответов")} не сохранён текст`,
  };
}

/* -------------------------------------------------------------------------- */
/* Human review                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The marking queue's own vocabulary.
 *
 * Two rules run through all of it. It never says "the system checked" and
 * "the teacher checked" with the same verb, because the two are different acts
 * and the whole point of this screen is that one of them cannot be automated.
 * And it never implies the queue shrinks when a teacher reads something: there
 * is no column anywhere to record a completed marking, so «Ждут проверки»
 * counts what was SUBMITTED, and `reviewNoRecord` says so in the same panel.
 */
export const REVIEW = {
  title: { kk: "Мұғалім тексеретін жұмыстар", ru: "Работы на проверку учителем" },
  /** The count heading. Plural-correct in both languages. */
  waiting: (n: number): Localized => ({
    kk: `Тексеруді күтуде — ${n}`,
    ru: `Ждут проверки — ${n}`,
  }),
  /** Column heads. */
  colStudent: { kk: "Оқушы", ru: "Ученик" },
  colTask: { kk: "Тапсырма", ru: "Задание" },
  colSubmitted: { kk: "Тапсырған уақыты", ru: "Сдано" },
  /**
   * The persisted decision. Empty for a row nobody has read.
   *
   * NOT «Отметка». In a Kazakhstani school that is the word for the mark that
   * goes in the register, and heading this column with it contradicted the
   * sentence two lines below on the same screen — «Здесь нет ни балла, ни
   * оценки». «Статус» carries no grade meaning in either language.
   */
  colState: { kk: "Күйі", ru: "Статус" },
  /** The action column. Named, because an unnamed column is unsortable prose. */
  colAction: { kk: "Жауап", ru: "Ответ" },
  /** The screen-reader caption for the queue table. */
  caption: {
    kk: "Мұғалім оқуын күтіп тұрған жұмыстар тізімі",
    ru: "Список работ, ожидающих чтения учителем",
  },
  /** The control on each row. A verb, and the same verb the panel's title uses. */
  open: { kk: "Оқу", ru: "Читать" },
  /**
   * The same control on a row whose text was never stored.
   *
   * «Открыть» rather than «Читать», because there is nothing to read — but the
   * row still opens, still explains why, and can still be marked. A row that
   * could not be opened could never leave the pending count.
   */
  openUnreadable: { kk: "Ашу", ru: "Открыть" },

  /* --- the panel -------------------------------------------------------- */
  /** What the learner was asked. Public — it is what they read on screen. */
  promptTitle: { kk: "Оқушыға берілген тапсырма", ru: "Задание, которое видел ученик" },
  /** The learner's own words. */
  answerTitle: { kk: "Оқушының жауабы", ru: "Ответ ученика" },
  /** The block was never submitted by this learner. */
  notSubmitted: { kk: "Оқушы бұл тапсырманы тапсырмаған", ru: "Ученик не сдавал это задание" },
  /** Submitted, and the text is gone — a row from before answers were kept. */
  textMissing: {
    kk: "Оқушы тапсырған, бірақ жауаптар сақталмайтын кезде тапсырылған — мәтіні жоқ.",
    ru: "Ученик сдал работу, но тогда ответы ещё не сохранялись — текста нет.",
  },
  /** Submitted with an empty box. Different from both of the above. */
  textEmpty: {
    kk: "Оқушы жауап өрісін бос қалдырған.",
    ru: "Ученик оставил поле ответа пустым.",
  },

  /* --- the review action ------------------------------------------------- */
  /**
   * The two things a teacher can record, and neither is a mark.
   *
   * «Прочитано» closes the item. «Нужно обсудить» also means READ — it is a
   * note to come back to it with the learner or the class — and the wording is
   * chosen so it cannot be mistaken for a fail. There is deliberately no third
   * option, because a third option is where a grade would arrive.
   */
  markReviewed: { kk: "Оқыдым", ru: "Прочитано" },
  markFollowUp: { kk: "Талқылау керек", ru: "Нужно обсудить" },
  /** The persisted state, once a decision exists. */
  stateReviewed: { kk: "Оқылды", ru: "Прочитано" },
  stateFollowUp: { kk: "Талқылау керек", ru: "Нужно обсудить" },
  /** Beside the state, when a colleague made the decision rather than you. */
  reviewedByColleague: { kk: "басқа мұғалім белгіледі", ru: "отметил другой учитель" },
  /**
   * There is deliberately no «снять отметку».
   *
   * Once a teacher has read a child's answer they have read it, and the
   * platform has no honest way to un-know that. A teacher who pressed the wrong
   * button presses the other one — both dispositions mean READ, so the change
   * is between two true statements rather than back to a false one.
   */

  /* --- the group headings ------------------------------------------------ */
  groupFollowUp: (n: number): Localized => ({
    kk: `Талқылау керек — ${n}`,
    ru: `Нужно обсудить — ${n}`,
  }),
  groupReviewed: (n: number): Localized => ({
    kk: `Оқылды — ${n}`,
    ru: `Прочитано — ${n}`,
  }),
  /** Why a follow-up row is still on the screen after it was read. */
  followUpNote: {
    kk: "Бұл жұмыстарды мұғалім оқыған, бірақ оқушымен немесе сыныппен қайта талқылау керек деп белгілеген.",
    ru: "Эти работы учитель прочитал и отметил, что к ним нужно вернуться с учеником или с классом.",
  },

  /* --- the honest boundary ---------------------------------------------- */
  /**
   * What the platform now records, and what it still refuses to.
   *
   * This sentence used to say that the platform stored no mark and that a
   * teacher only READ here — true until migration 0022, and false the moment a
   * teacher could press a button. The half that survives is the half that
   * matters: the
   * platform records that a person READ the work, and has nowhere to put a
   * mark. Leaving the old wording would have been the console telling a teacher
   * nothing was stored on a screen that had just stored something.
   */
  noRecord: {
    kk: "Платформа жұмысты оқығаныңызды ғана белгілейді. Мұнда балл да, баға да жоқ — оны мектептің өз журналына қоясыз.",
    ru: "Платформа отмечает только то, что работу прочитали. Здесь нет ни балла, ни оценки — её вы ставите в школьном журнале.",
  },
  noRecordWhy: {
    kk: "Оқушының өз сөзімен жазған түсіндірмесін машина бағалай алмайды, сондықтан жүйеде балл қоятын баған әдейі жоқ. Бұл — қасақана шешім, кемшілік емес.",
    ru: "Объяснение, написанное учеником своими словами, машина оценивать не должна, поэтому колонки для балла в системе намеренно нет. Это решение, а не недоделка.",
  },
  /** The write did not land. Stated, never swallowed. */
  reviewFailed: {
    kk: "Белгі сақталмады. Байланысты тексеріп, қайта басып көріңіз.",
    ru: "Отметка не сохранилась. Проверьте соединение и нажмите ещё раз.",
  },
  /**
   * The learner never sees any of this. Stated so nobody has to wonder.
   *
   * «Ученик эту отметку не видит» was worse than the column header it matched:
   * it reads as *there IS a mark here, we just hide it from the child*, which
   * is the opposite of what the table holds.
   */
  notShownToLearner: {
    kk: "Оқушы мұны көрмейді.",
    ru: "Ученик этого не видит.",
  },

  /* --- empty states ------------------------------------------------------ */
  /** Nobody has submitted anything human-marked yet. */
  emptyNone: { kk: "Тексеретін жұмыс жоқ", ru: "Работ на проверку нет" },
  emptyNoneHint: {
    kk: "Оқушылар жазбаша тапсырмаларды тапсырған соң, олар осы жерде тізіммен көрінеді.",
    ru: "Как только ученики сдадут письменные задания, они появятся здесь списком.",
  },
  /** The month's check has no human-marked block at all. */
  emptyNoHumanBlocks: {
    kk: "Бұл тексерісте мұғалім оқитын тапсырма жоқ",
    ru: "В этой проверке нет заданий, которые читает учитель",
  },
  emptyNoHumanBlocksHint: {
    kk: "Айдың барлық тапсырмаларын машина тексереді.",
    ru: "Все задания месяца проверяет машина.",
  },
} as const;
