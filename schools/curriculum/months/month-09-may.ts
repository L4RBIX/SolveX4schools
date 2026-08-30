import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M9_L1 } from "./m09/l1";
import { M9_L2 } from "./m09/l2";
import { M9_L3 } from "./m09/l3";
import { M9_C1 } from "./m09/c1";
import { M9_C2 } from "./m09/c2";
import { M9_C3 } from "./m09/c3";
import { M9_C4 } from "./m09/c4";
import { M9_L4 } from "./m09/l4";
import { M9_ASSESSMENT } from "./m09/assessment";

/**
 * Month 9 · Мамыр — contests, analysis and the final tournament. PDF p.10.
 *
 * ## The month with no new topic
 *
 * «Бұл айда жаңа тақырып жоқ.» May introduces no algorithm and no construct.
 * Its four skills are all about how you WORK — splitting time between problems,
 * reading a verdict, finishing what you did not finish, defending what you did.
 * Nothing in this month may teach a technique the year has not already taught,
 * and the construct budget in `scripts/check-blocks.ts` adds nothing for month 9
 * for exactly that reason.
 *
 * ## The structure is quoted, not designed
 *
 * > «төрт 45 минуттық жаттығу жарысы, әр жарыстан кейін барлық есепті үш күн
 * > ішінде толық шешу, апта сайын ескі есептерді көмексіз қайта орындау, бес
 * > бейтаныс есептен тұратын қорытынды турнир және екі шешімді ауызша қорғау»
 *
 * Four practice contests of 45 minutes, upsolving every problem within three
 * days of each, a weekly unaided re-solve of an old problem, a five-problem
 * final tournament, and two oral defences. `m9.u2` is those four contests, one
 * lesson each; the assessment is the tournament.
 *
 * `expectedTaskCount` is 25 and is DERIVED, not quoted — May is the one month
 * §4 gives no task figure for. Four contests of five problems plus a
 * five-problem final is 25, and that arithmetic is the only countable structure
 * the paragraph offers.
 *
 * ## Two things the format needs that the rest of the year did not
 *
 * The weekly re-solve is `VerifyBlock.mode: "delayed_resolve"` — the fifth of
 * the programme's five verification methods (p.6), and the only month where it
 * is the natural home for it. The rest of the year never uses it.
 *
 * The final tournament's grading rule is unusual enough to quote: «Бірі болмаса,
 * екіншісі жеке есепке алынбайды» — solving without defending does not count,
 * and defending without solving does not count. That is a relationship between
 * two blocks, and it is stated in the assessment's description rather than
 * faked as a conjunction the machine pretends to score.
 *
 * ## A correction to the stub
 *
 * The stub carried `theoryHours: 1, practiceHours: 7.5`. The PDF's own year
 * summary table (p.11) gives May «2,5 сағ / 6 сағ», identical to every other
 * month. The stub's split was a reasonable guess — a contest month is nearly all
 * practice — but it is not what the document says, and the document is the
 * authority. Restored, which also brings the nine months to 22.5 / 54 against
 * the table's rounded 23 / 55.
 *
 * The four contest lessons declare 45 minutes because the programme does. The
 * validator warns above 12, which is the right rule for «қысқа сабақ» — the
 * short EXPLANATION lessons p.3 is talking about — and a contest is not one.
 * The warnings are expected and are recorded in the month report.
 */

const P = 10; // PDF page for all of May

export const MONTH_09_MAY: Month = {
  index: 9,
  monthName: t("Мамыр", "Май"),
  title: t("Жарыстар, талдау және қорытынды турнир", "Соревнования, разбор и итоговый турнир"),
  mastery: t(
    "Жарыс форматында жұмыс істеу: есептер арасында уақытты бөлу, тексеру жүйесінің хабарламаларына дұрыс жауап беру, уақытында басқа есепке ауысу және талдаудан кейін міндетті түрде толық шешіп шығу.",
    "Работа в формате соревнования: распределять время между задачами, правильно реагировать на сообщения проверяющей системы, вовремя переключаться на другую задачу и после разбора обязательно дорешивать до конца.",
  ),
  explanation: t(
    "Бұл айда жаңа тақырып жоқ. Негізгі формат - мұғалімнің бейтаныс есепті дауыстап талдауы: тек дұрыс жол ғана емес, тұйыққа тірелу мен кері қайтулар да көрсетіледі. Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер алдындағы тексеру тізіміне айналады.",
    "В этом месяце новых тем нет. Основной формат — разбор незнакомой задачи учителем вслух: показывается не только правильный путь, но и тупики и возвраты. Накопленный за год личный журнал ошибок становится для каждого ученика чек-листом перед отправкой решения.",
  ),
  /** PDF p.11, the year summary table's row for month 9. */
  endOfMonthCapability: t(
    "Жарыс форматында өз бетінше жұмыс істеп, шешімдерін ауызша қорғайды.",
    "Самостоятельно работает в формате соревнования и устно защищает свои решения.",
  ),
  /**
   * Derived, not quoted: four contests of five problems plus a five-problem
   * final tournament = 25. The PDF states the contest structure on p.10 but
   * gives no task total for May, and this is the only countable reading of it.
   */
  expectedTaskCount: 25,
  practiceOutline: t(
    "Төрт 45 минуттық жаттығу жарысы, әр жарыстан кейін барлық есепті үш күн ішінде толық шешу, апта сайын ескі есептерді көмексіз қайта орындау, бес бейтаныс есептен тұратын қорытынды турнир және екі шешімді ауызша қорғау.",
    "Четыре тренировочных соревнования по 45 минут, после каждого — дорешивание всех задач в течение трёх дней, еженедельное повторное решение старых задач без помощи, итоговый турнир из пяти незнакомых задач и устная защита двух решений.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-09",
  units: [
    buildUnit(
      "m9.u1",
      "Жарыс тәртібі",
      "Регламент соревнования",
      [
        {
          id: "m9.l1",
          kk: "Уақытты бөлу",
          ru: "Распределение времени",
          minutes: 8,
          objectives: [
            ["Есептерді қиындығы бойынша сұрыптау", "Сортировать задачи по сложности"],
            ["Бір есепке тұрып қалмау", "Не застревать на одной задаче"],
          ],
          skills: ["contest.time_split"],
          blocks: M9_L1,
        },
        {
          id: "m9.l2",
          kk: "Вердиктті оқу",
          ru: "Чтение вердикта",
          minutes: 8,
          objectives: [
            ["Қате түрлерін ажырату", "Различать типы ошибок"],
            ["Вердикт бойынша келесі қадамды таңдау", "Выбирать следующий шаг по вердикту"],
          ],
          skills: ["contest.verdict_reading", "debug.boundary"],
          blocks: M9_L2,
        },
        {
          id: "m9.l3",
          kk: "Жарыстан кейінгі талдау",
          ru: "Разбор после соревнования",
          minutes: 9,
          objectives: [
            ["Шықпаған есепті соңына дейін шешу", "Дорешивать нерешённую задачу до конца"],
            ["Қатенің себебін жазып қалдыру", "Записывать причину ошибки"],
          ],
          skills: ["contest.upsolving"],
          blocks: M9_L3,
        },
      ],
      P,
    ),
    /* «Төрт 45 минуттық жаттығу жарысы» — four practice contests, one lesson
       each, five problems apiece. The 45 minutes is the programme's own figure. */
    buildUnit(
      "m9.u2",
      "Жаттығу жарыстары",
      "Тренировочные соревнования",
      [
        {
          id: "m9.c1",
          kk: "1-жаттығу жарысы",
          ru: "Тренировочное соревнование 1",
          minutes: 45,
          objectives: [
            ["45 минут ішінде бес есепті реттеп шығару", "За 45 минут разобрать пять задач по порядку"],
            ["Жеңіл есептен бастау", "Начинать с лёгкой задачи"],
          ],
          skills: ["contest.time_split", "contest.verdict_reading"],
          blocks: M9_C1,
        },
        {
          id: "m9.c2",
          kk: "2-жаттығу жарысы",
          ru: "Тренировочное соревнование 2",
          minutes: 45,
          objectives: [
            ["Тұрып қалған есепті уақытында тастау", "Вовремя оставлять задачу, на которой застрял"],
            ["Вердиктке қарап шешім қабылдау", "Принимать решение по вердикту"],
          ],
          skills: ["contest.time_split", "contest.verdict_reading"],
          blocks: M9_C2,
        },
        {
          id: "m9.c3",
          kk: "3-жаттығу жарысы",
          ru: "Тренировочное соревнование 3",
          minutes: 45,
          objectives: [
            ["Шеткі жағдайды жіберер алдында тексеру", "Проверять крайний случай перед отправкой"],
            ["Жеке қателер тізімін қолдану", "Пользоваться личным списком ошибок"],
          ],
          skills: ["contest.time_split", "contest.upsolving"],
          blocks: M9_C3,
        },
        {
          id: "m9.c4",
          kk: "4-жаттығу жарысы",
          ru: "Тренировочное соревнование 4",
          minutes: 45,
          objectives: [
            ["Жыл бойғы тәсілдерді өзі таңдау", "Самостоятельно выбирать приёмы, изученные за год"],
            ["Талдаудан кейін толық шешіп шығу", "После разбора дорешивать до конца"],
          ],
          skills: ["contest.upsolving", "contest.time_split"],
          blocks: M9_C4,
        },
      ],
      P,
    ),
    buildUnit(
      "m9.u3",
      "Қорытынды турнирге дайындық",
      "Подготовка к итоговому турниру",
      [
        {
          id: "m9.l4",
          kk: "Шешімді қорғау",
          ru: "Защита решения",
          minutes: 10,
          objectives: [
            ["Шешімнің неге дұрыс екенін дәлелдеу", "Доказывать, почему решение верно"],
            ["Шарт өзгергенде не бұзылатынын айту", "Говорить, что сломается при изменении условия"],
          ],
          skills: ["contest.defend"],
          blocks: M9_L4,
        },
      ],
      P,
    ),
  ],
  assessment: buildAssessment({
    monthIndex: 9,
    kk: "Қорытынды турнир",
    ru: "Итоговый турнир",
    minutes: 90,
    /* PDF p.10, May's own «Айлық сынақ» sentence — including the grading rule,
       which is unusual and is stated rather than machine-faked. */
    descriptionKk:
      "Қорытынды турнирде бес бейтаныс есептің кемінде екеуін шешу және өз шешімдерінің екеуін түсінікті түрде қорғау. Бірі болмаса, екіншісі жеке есепке алынбайды: шешу қорғаусыз да, қорғау шешусіз де есептелмейді.",
    descriptionRu:
      "На итоговом турнире решить как минимум две из пяти незнакомых задач и внятно защитить два своих решения. Одно без другого не засчитывается по отдельности: решение без защиты и защита без решения не считаются.",
    pdfPage: P,
    blocks: M9_ASSESSMENT,
  }),
};
