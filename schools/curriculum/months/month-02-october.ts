import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M2_L1 } from "./m02/l1";
import { M2_L2 } from "./m02/l2";
import { M2_L3 } from "./m02/l3";
import { M2_L4 } from "./m02/l4";
import { M2_L5 } from "./m02/l5";
import { M2_L6 } from "./m02/l6";
import { M2_L7 } from "./m02/l7";
import { M2_L8 } from "./m02/l8";
import { M2_L9 } from "./m02/l9";
import { M2_PRACTICE } from "./m02/practice";
import { M2_ASSESSMENT } from "./m02/assessment";

/**
 * Month 2 · Қазан — loops and lists. PDF p.7.
 *
 * ## Why the lesson bodies live in `m02/` and not in this file
 *
 * September is one 106 KB file, and that was the right shape for one month
 * written by one person. Eight further months are not: their lesson bodies are
 * authored and reviewed independently, and a single file per month turns every
 * review into a merge conflict over content nobody disagrees about. So the
 * `Month` object, its units, titles, objectives and PDF citations stay here —
 * unchanged in shape from the stub they replace — and each lesson's blocks live
 * in their own module. Nothing else about the model changes; `MONTHS` still
 * exports one array and `teachingOrder()` still reads it in the same order.
 *
 * ## Two structural additions to the stub
 *
 * `m2.u4` and `m2.u5` are new. The first exists because p.7 names four typical
 * errors — infinite loop, skipping the last element, index out of bounds, a
 * wrongly initialised accumulator — and then asks separately for «цикл мен
 * индекс қатесін табу және қолмен трассалау». That is a block of work the
 * programme specifies, and scattering it through the teaching lessons would
 * have left it unaccounted for. The second is the independent practice bank,
 * the same shape September uses at `m1.l9`: it is where «шамамен 100 толық
 * дербес шешім» over the year is actually earned.
 *
 * The prose fields below are now the PDF's own sentences rather than the stub's
 * paraphrase — `Month.practiceOutline` documents itself as "verbatim from the
 * PDF's practice paragraph" and it was not. Russian is a translation, because
 * the programme document exists only in Kazakh.
 */

const P = 7; // PDF page for all of October

export const MONTH_02_OCTOBER: Month = {
  index: 2,
  monthName: t("Қазан", "Октябрь"),
  title: t(
    "Қайталау және деректер жиыны: циклдер мен тізімдер",
    "Повторение и наборы данных: циклы и списки",
  ),
  mastery: t(
    "for және while циклдерімен әрекетті бірнеше рет орындау; цикл санағышын басқару; тізімге мәндер жинау, элементті индекс арқылы алу және бүкіл тізімді бір рет қарап шығу. Жолды таңбалар тізбегі ретінде өңдеу, қарапайым ішкі циклдерді оқу және жазу.",
    "Многократное выполнение действия циклами for и while; управление счётчиком цикла; накопление значений в списке, обращение к элементу по индексу и однократный проход по всему списку. Обработка строки как последовательности символов, чтение и написание простых вложенных циклов.",
  ),
  explanation: t(
    "Басты құрал - бағдарламаның қадамдық орындалуы: әр қадамда цикл айнымалысының, индекстің және тізім элементтерінің мәні көрсетіледі. Бөлек тренажер индекстерді көзге көрінетін етеді. Типтік қателер: шексіз цикл, соңғы элементті өткізіп жіберу, индекстің шекарадан шығуы, жинақтаушы айнымалыға қате бастапқы мән беру.",
    "Главный инструмент — пошаговое выполнение программы: на каждом шаге показываются значения переменной цикла, индекса и элементов списка. Отдельный тренажёр делает индексы видимыми. Типичные ошибки: бесконечный цикл, пропуск последнего элемента, выход индекса за границы, неверное начальное значение накопителя.",
  ),
  /** PDF p.11, the year summary table's row for month 2. */
  endOfMonthCapability: t(
    "for және while арқылы қайталайды, тізімдерді индекспен және толық өту арқылы өңдейді.",
    "Повторяет действия через for и while, обрабатывает списки по индексу и полным обходом.",
  ),
  expectedTaskCount: 38,
  practiceOutline: t(
    "1-ден n-ге дейінгі қосынды, цифрлар қосындысы, бөлгіштер саны, жай санды тексеру, көбейту кестесі, символдардан өрнек; тізімдегі максимум мен минимум, қосынды және орташа мән, орташадан үлкен элементтер саны, тізімді кері аудару; сөздегі дауыстылар саны, палиндромды тексеру. Қосымша - цикл мен индекс қатесін табу және қолмен трассалау.",
    "Сумма от 1 до n, сумма цифр, количество делителей, проверка на простоту, таблица умножения, узор из символов; максимум и минимум в списке, сумма и среднее, количество элементов больше среднего, разворот списка; количество гласных в слове, проверка палиндрома. Дополнительно — поиск ошибки в цикле и индексе и ручная трассировка.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-02",
  units: [
    buildUnit(
      "m2.u1",
      "Қайталау",
      "Повторение",
      [
        {
          id: "m2.l1",
          kk: "for циклі",
          ru: "Цикл for",
          minutes: 8,
          objectives: [
            ["Берілген рет санына қайталауды жазу", "Записывать повторение заданное число раз"],
            /* Was «range шекараларын» / «границы range». `range` is a Python
               function and October is C++ now: the boundary decision the
               objective names lives in the loop header's own comparison —
               `i < n` or `i <= n` — which is what m2.l1.b5 and m2.l1.b7 teach.
               The objective is unchanged; only the construct it named is. */
            ["Цикл шекараларын дұрыс таңдау", "Правильно выбирать границы цикла"],
          ],
          skills: ["loops.for", "loops.counter"],
          blocks: M2_L1,
        },
        {
          id: "m2.l2",
          kk: "Жинақтаушы айнымалы",
          ru: "Накопитель",
          minutes: 8,
          objectives: [
            ["Циклге дейін бастапқы мәнді қою", "Задавать начальное значение до цикла"],
            ["Қосынды мен санағышты ажырату", "Различать сумму и счётчик"],
          ],
          skills: ["loops.accumulator", "loops.counter"],
          blocks: M2_L2,
        },
        {
          id: "m2.l3",
          kk: "while циклі",
          ru: "Цикл while",
          minutes: 8,
          objectives: [
            ["Шарт бойынша қайталауды тоқтату", "Останавливать повторение по условию"],
            ["Шексіз циклдің себебін тану", "Распознавать причину бесконечного цикла"],
          ],
          skills: ["loops.while", "debug.boundary"],
          blocks: M2_L3,
        },
      ],
      P,
    ),
    buildUnit(
      "m2.u2",
      "Тізімдер",
      "Списки",
      [
        {
          id: "m2.l4",
          kk: "Тізім және индекс",
          ru: "Список и индекс",
          minutes: 8,
          objectives: [
            ["Индекс арқылы элементке жету", "Обращаться к элементу по индексу"],
            ["Индекс нөлден басталатынын қолдану", "Использовать нумерацию с нуля"],
          ],
          skills: ["lists.index", "debug.boundary"],
          blocks: M2_L4,
        },
        {
          id: "m2.l5",
          kk: "Тізімді қарап шығу",
          ru: "Обход списка",
          minutes: 8,
          objectives: [
            ["Барлық элементті бір рет қарау", "Просмотреть каждый элемент один раз"],
            ["Ең үлкен және ең кіші мәнді табу", "Находить максимум и минимум"],
          ],
          skills: ["lists.traverse", "loops.for", "loops.accumulator"],
          blocks: M2_L5,
        },
        {
          id: "m2.l6",
          kk: "Жолдағы таңбалар",
          ru: "Символы в строке",
          minutes: 7,
          objectives: [
            ["Жолды таңбалап қарау", "Обходить строку по символам"],
            ["Белгілі таңбаны санау", "Считать нужный символ"],
          ],
          skills: ["strings.sequence", "loops.for"],
          blocks: M2_L6,
        },
      ],
      P,
    ),
    buildUnit(
      "m2.u3",
      "Ішкі циклдер",
      "Вложенные циклы",
      [
        {
          id: "m2.l7",
          kk: "Цикл ішіндегі цикл",
          ru: "Цикл внутри цикла",
          minutes: 9,
          objectives: [
            ["Ішкі циклдің толық айналатынын түсіну", "Понимать, что внутренний цикл проходит полностью"],
            ["Қадам санын бағалау", "Оценивать число шагов"],
          ],
          skills: ["loops.nested", "loops.for"],
          blocks: M2_L7,
        },
        {
          id: "m2.l8",
          kk: "Күрделірек есептер",
          ru: "Задачи посложнее",
          minutes: 10,
          objectives: [
            ["Бірнеше жинақтаушыны қатар жүргізу", "Вести несколько накопителей одновременно"],
            ["Шешімді ауызша дәлелдеу", "Обосновывать решение устно"],
          ],
          skills: ["loops.nested", "lists.traverse", "loops.accumulator"],
          blocks: M2_L8,
        },
      ],
      P,
    ),
    /* PDF p.7 names four typical errors for this month and then asks separately
       for «цикл мен индекс қатесін табу және қолмен трассалау». One unit, one
       block per named error, so the requirement is accounted for rather than
       dissolved into the teaching lessons. */
    buildUnit(
      "m2.u4",
      "Қателер мен трассалау",
      "Ошибки и трассировка",
      [
        {
          id: "m2.l9",
          kk: "Цикл және индекс қателері",
          ru: "Ошибки циклов и индексов",
          minutes: 9,
          objectives: [
            ["Төрт типтік цикл қатесін тану", "Распознавать четыре типичные ошибки цикла"],
            ["Қатені қағазда трассалау арқылы табу", "Находить ошибку ручной трассировкой"],
          ],
          skills: ["debug.boundary", "loops.for", "lists.index", "loops.while"],
          blocks: M2_L9,
        },
      ],
      P,
    ),
    {
      id: "m2.u5",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      /* The bank itself is product-authored; the individual problems cite the
         PDF where they implement a family it names. */
      sourceType: "product-authored",
      lessons: [
        {
          id: "m2.l10",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Есепті талдаудан кодқа дейін өз бетінше өту", "Пройти путь от разбора условия до кода самостоятельно"),
            t("Шешімді тапсырар алдында өзің тексеру", "Проверять решение самому перед отправкой"),
          ],
          skillRefs: [
            "loops.for",
            "loops.while",
            "loops.counter",
            "loops.accumulator",
            "lists.index",
            "lists.traverse",
            "strings.sequence",
            "loops.nested",
          ],
          blocks: M2_PRACTICE,
          sourceType: "product-authored",
          status: "implemented",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 2,
    kk: "Қазан айының тексерісі",
    ru: "Проверка за октябрь",
    minutes: 20,
    /* PDF p.7, October's own «Айлық сынақ» sentence, not a generic description:
       hand-step an unfamiliar program's loop and list, solve a loop-and-list
       problem independently, and explain why the loop stops and why the indices
       stay in bounds. */
    descriptionKk:
      "Бейтаныс бағдарламадағы цикл мен тізімнің жұмысын қағазда қадамдап орындау, цикл мен тізім қолданылатын есепті өз бетінше шешу және циклдің неге тоқтайтынын, индекстердің неге шекарадан шықпайтынын түсіндіру.",
    descriptionRu:
      "Пошагово выполнить на бумаге работу цикла и списка в незнакомой программе, самостоятельно решить задачу с циклом и списком и объяснить, почему цикл останавливается и почему индексы не выходят за границы.",
    pdfPage: P,
    blocks: M2_ASSESSMENT,
  }),
};
