import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M4_L1 } from "./m04/l1";
import { M4_L2 } from "./m04/l2";
import { M4_L3 } from "./m04/l3";
import { M4_L4 } from "./m04/l4";
import { M4_L7 } from "./m04/l7";
import { M4_L5 } from "./m04/l5";
import { M4_L6 } from "./m04/l6";
import { M4_PRACTICE } from "./m04/practice";
import { M4_ASSESSMENT } from "./m04/assessment";

/**
 * Month 4 · Желтоқсан — speed, sorting, precomputation. PDF p.8.
 *
 * ## The month's own idea, and the constraint it runs into
 *
 * «Дұрыс жауап тым кеш шықса, қабылданбайды» — a correct answer that arrives
 * too late is rejected. That is the sentence the whole month exists to teach,
 * and the product cannot currently enforce it: there is no per-task time limit
 * in the content model and the judge reports pass/fail, not duration. See
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §3.
 *
 * So the cost is made visible where it CAN be made visible honestly — in the
 * statement, in the step count, and in the reasoning. Constraints are written
 * into the prompts, `m4.l1` counts operations by hand, `m4.l2` puts the slow and
 * the fast solution side by side, and the PDF's two named task types —
 * «осы бағдарлама үлгере ме?» and «үлгермейтін мысал ойлап тап» — become a
 * judgement block and a `test_case` block respectively. Nobody is marked wrong
 * by a clock that does not exist.
 *
 * ## Why a seventh lesson
 *
 * The stub had six. The PDF names six practice families plus two task types,
 * and three of the families — «тізімдегі әртүрлі мәндер саны», «ең жиі
 * кездесетін сан», «медиананы табу» — are all "sort, then walk the sorted
 * list", which is a distinct idea from "sorting makes the extremes easy". They
 * get their own lesson, `m4.l7`, taught fifth.
 *
 * ## What arrives this month, and why it was withheld until now
 *
 * `sort(a.begin(), a.end())` from `<algorithm>` becomes available here, with
 * its two mirror recipes: `sort(a.rbegin(), a.rend())` for descending order and
 * the two-argument `min(x, y)` / `max(x, y)`. October and November deliberately
 * forbade ordering: «тізімдегі максимум мен минимум» is October's traversal
 * exercise and «максимум мен минимум функциясы» is November's, and a library
 * call in either month deletes the task. December is where the learner has
 * already written them by hand and can be told there is a shorter way.
 *
 * There is no whole-list `sum` or `max` to hand over, and that is a decision
 * rather than an omission: `*max_element(v.begin(), v.end())` needs an iterator
 * and a dereference, both of which `docs/cpp17/CPP17_PEDAGOGY.md` puts outside
 * Year 1. Those stay the loops October and November taught, which suits a month
 * about step counts — the cost is visible in the code instead of hidden behind
 * a call.
 *
 * ## The number every claim in this month rests on, and its C++ value
 *
 * `m4.l1.b1` states it once: a C++ program manages roughly **10⁸ simple steps a
 * second**. The Python course reasoned with 10⁷, and carrying that figure over
 * would have made this month assert that programs are too slow when they finish
 * in thirty milliseconds. Every bound, every «үлгере ме?» verdict and every
 * «үлгермейтін мысал» in `m04/` was re-derived from the new figure, and each is
 * built to hold whether the machine turns out to be ten times faster or ten
 * times slower — no task in the month decides a verdict between 10⁸ and 10⁹
 * steps. The individual recalibrations are recorded in the head comment of the
 * lesson file that owns them.
 */

const P = 8; // PDF page for all of December

export const MONTH_04_DECEMBER: Month = {
  index: 4,
  monthName: t("Желтоқсан", "Декабрь"),
  title: t(
    "Бағдарламаның жылдамдығы: сұрыптау және алдын ала есептеу",
    "Скорость программы: сортировка и предвычисления",
  ),
  mastery: t(
    "Бағдарламаның берілген уақытқа үлгеретінін бағалау. Бұл спорттық бағдарламалаудың негізгі идеясы: дұрыс жауап тым кеш шықса, қабылданбайды.",
    "Оценка того, укладывается ли программа в отведённое время. Это основная идея спортивного программирования: правильный ответ, полученный слишком поздно, не принимается.",
  ),
  explanation: t(
    "Айдың басты тәсілі - бір есептің екі шешімін салыстыру. Платформа баяу және жылдам шешімді үлкен деректерде қатар іске қосып, айырманы оқушыға көзбен көрсетеді.",
    "Главный приём месяца — сравнение двух решений одной задачи. Платформа запускает медленное и быстрое решение рядом на больших данных и показывает ученику разницу наглядно.",
  ),
  /** PDF p.11, the year summary table's row for month 4. */
  endOfMonthCapability: t(
    "Бағдарламаның уақытқа үлгеруін бағалап, тиімдірек шешім таңдайды.",
    "Оценивает, уложится ли программа во время, и выбирает более эффективное решение.",
  ),
  expectedTaskCount: 32,
  practiceOutline: t(
    "Сандарды реттеу, көлемі бойынша үшінші мәнді табу, тізімдегі әртүрлі мәндер саны, ең жиі кездесетін сан, тізім бөлігінің қосындысы туралы көп сұраққа тез жауап беру, медиананы табу. Оған қоса «осы бағдарлама үлгере ме?» және «үлгермейтін мысал ойлап тап» тапсырмалары.",
    "Сортировка чисел, поиск третьего по величине значения, количество различных значений в списке, самое частое число, быстрые ответы на множество запросов о сумме участка списка, поиск медианы. Плюс задания «уложится ли эта программа?» и «придумай пример, на котором она не уложится».",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-04",
  units: [
    buildUnit(
      "m4.u1",
      "Уақытты бағалау",
      "Оценка времени",
      [
        {
          id: "m4.l1",
          kk: "Қадам санын санау",
          ru: "Подсчёт числа шагов",
          minutes: 8,
          objectives: [
            ["Цикл қанша рет орындалатынын есептеу", "Считать, сколько раз выполнится цикл"],
            ["Ішкі циклдің көбейтетінін көру", "Видеть, что вложенный цикл умножает"],
          ],
          skills: ["perf.time_estimate", "loops.nested"],
          blocks: M4_L1,
        },
        {
          id: "m4.l2",
          kk: "Екі шешімді салыстыру",
          ru: "Сравнение двух решений",
          minutes: 8,
          objectives: [
            ["Бірдей нәтиженің әртүрлі бағасын өлшеу", "Измерять разную цену одинакового результата"],
            ["Қай шешім үлкен деректе құлайтынын айту", "Определять, какое решение упадёт на больших данных"],
          ],
          skills: ["perf.compare_solutions", "perf.time_estimate"],
          blocks: M4_L2,
        },
      ],
      P,
    ),
    buildUnit(
      "m4.u2",
      "Реттеу",
      "Сортировка",
      [
        {
          id: "m4.l3",
          kk: "Реттеу не береді",
          ru: "Что даёт сортировка",
          minutes: 8,
          objectives: [
            ["Реттелген тізімнен ең үлкен k элементті алу", "Брать k наибольших элементов из отсортированного списка"],
            ["Реттеу қай есепті жеңілдететінін тану", "Распознавать, какую задачу упрощает сортировка"],
          ],
          skills: ["sort.basic", "lists.traverse"],
          blocks: M4_L3,
        },
        {
          id: "m4.l4",
          kk: "Реттеумен есептер",
          ru: "Задачи на сортировку",
          minutes: 9,
          objectives: [
            ["Реттеуден кейінгі көрші элементтерді пайдалану", "Использовать соседние элементы после сортировки"],
            ["Қайталанатын мәндерді дұрыс өңдеу", "Правильно обрабатывать повторы"],
          ],
          skills: ["sort.basic", "debug.boundary"],
          blocks: M4_L4,
        },
        /* The seventh lesson. Counting on a sorted list is a different move from
           reading its extremes, and three of the PDF's six families need it. */
        {
          id: "m4.l7",
          kk: "Реттелген тізімді санап шығу",
          ru: "Подсчёты по отсортированному списку",
          minutes: 9,
          objectives: [
            ["Қайталанатын мәндерді көршілері арқылы санау", "Считать повторы через соседние элементы"],
            ["Ортаңғы элементті таңдау ережесін тұжырымдау", "Формулировать правило выбора среднего элемента"],
          ],
          skills: ["sort.basic", "lists.traverse", "debug.boundary"],
          blocks: M4_L7,
        },
      ],
      P,
    ),
    buildUnit(
      "m4.u3",
      "Алдын ала есептеу",
      "Предвычисления",
      [
        {
          id: "m4.l5",
          kk: "Префикс қосынды",
          ru: "Префиксные суммы",
          minutes: 9,
          objectives: [
            ["Аралық қосындысын бір амалмен табу", "Находить сумму отрезка за одну операцию"],
            ["Кестені бір рет толтырып қайта пайдалану", "Заполнять таблицу один раз и переиспользовать"],
          ],
          skills: ["precompute.prefix", "loops.accumulator"],
          blocks: M4_L5,
        },
        {
          id: "m4.l6",
          kk: "Күрделірек есептер",
          ru: "Задачи посложнее",
          minutes: 10,
          objectives: [
            ["Реттеу мен алдын ала есептеуді біріктіру", "Сочетать сортировку и предвычисления"],
            ["Жылдамдатудың неге жұмыс істейтінін дәлелдеу", "Обосновывать, почему ускорение работает"],
          ],
          skills: ["precompute.prefix", "sort.basic", "perf.compare_solutions"],
          blocks: M4_L6,
        },
      ],
      P,
    ),
    {
      id: "m4.u4",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m4.l8",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Кодқа отырмас бұрын шешімнің үлгеретінін бағалау", "Оценивать, уложится ли решение, до того как сесть за код"),
            t("Реттеу мен алдын ала есептеуді өз бетінше қолдану", "Самостоятельно применять сортировку и предвычисления"),
          ],
          skillRefs: [
            "perf.time_estimate",
            "perf.compare_solutions",
            "sort.basic",
            "precompute.prefix",
            "lists.traverse",
            "func.define",
          ],
          blocks: M4_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M4_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 4,
    kk: "Желтоқсан айының тексерісі",
    ru: "Проверка за декабрь",
    minutes: 20,
    /* PDF p.8, December's own «Айлық сынақ» sentence: the reasoning comes
       BEFORE the code, and the choice has to be justified. */
    descriptionKk:
      "Шартты алған соң кодқа отырмас бұрын қай шешім уақыт бойынша үлгеретінін айту және таңдауын негіздеу, содан кейін сол шешімді жазу.",
    descriptionRu:
      "Получив условие, до того как сесть за код, сказать, какое решение уложится по времени, и обосновать свой выбор, а затем написать это решение.",
    pdfPage: P,
    blocks: M4_ASSESSMENT,
  }),
};
