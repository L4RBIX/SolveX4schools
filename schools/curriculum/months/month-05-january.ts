import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M5_L1 } from "./m05/l1";
import { M5_L2 } from "./m05/l2";
import { M5_L6 } from "./m05/l6";
import { M5_L3 } from "./m05/l3";
import { M5_L4 } from "./m05/l4";
import { M5_L7 } from "./m05/l7";
import { M5_L5 } from "./m05/l5";
import { M5_PRACTICE } from "./m05/practice";
import { M5_ASSESSMENT } from "./m05/assessment";

/**
 * Month 5 · Қаңтар — binary search and two pointers. PDF p.9.
 *
 * ## The two requirements this month's paragraph makes, and what happened to them
 *
 * The first is the strongest wording in the whole programme: «**Міндетті**
 * визуалды анимация: оқушы іздеу шекараларының қалай жақындағанын көріп, келесі
 * қадамды алдын ала болжайды» — a mandatory animation, against which the learner
 * predicts the next step. The `binary_search` visualiser does not exist; it
 * renders as the honest "not ready" card. The blocks are declared anyway, so
 * they light up the day it is built, and the teaching weight meanwhile sits on
 * `trace_code` — which IS implemented, and which asks the learner to write down
 * `left`, `right` and `mid` at every step instead of watching them move. That is
 * a real reduction and it is recorded in
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1 and in this month's
 * report rather than glossed.
 *
 * The second is a claim about the shape of the month, not its topic:
 * «Шекарада қателесу оңай болғандықтан, **алғашқы екі аптада дайын кодты оқу,
 * түзету және толықтыру көбірек беріледі**» — because boundary mistakes are easy,
 * the first two weeks lean towards reading, repairing and completing existing
 * code rather than writing from scratch. That is measurable, so it is measured:
 * across `m5.u1` — the month's first half — scaffolded and repair blocks
 * outnumber blank editors, for **all three tracks**, not only support. The month
 * report gives the count.
 *
 * ## Two lessons the stub did not have
 *
 * `m5.l6` exists because p.9 asks separately for «Қосымша - іздеу
 * шекараларындағы қателерді түзету», and boundary repair scattered through the
 * teaching lessons would have gone unaccounted for. `m5.l7` exists because
 * «екі реттелген тізімді біріктіру» is a named family and merging is a
 * different move from the pair-sum walk in `m5.l4`. Both take the next free
 * numbers and are taught in position, following the convention September set
 * with `m1.l10`–`m1.l12`.
 *
 * ## What this month may not import
 *
 * `<algorithm>`'s `lower_bound` and `upper_bound`. The programme never teaches
 * them, and a binary-search month whose tasks are solved by calling the answer
 * teaches nothing. `<algorithm>` appears exactly once, for December's `sort` in
 * `m5.l5`; every search in the month is a loop the learner writes.
 */

const P = 9; // PDF page for all of January

export const MONTH_05_JANUARY: Month = {
  index: 5,
  monthName: t("Қаңтар", "Январь"),
  title: t(
    "Жылдам іздеу: екіге бөлу және екі шекара әдісі",
    "Быстрый поиск: деление пополам и метод двух границ",
  ),
  mastery: t(
    "Реттелген тізімнен керекті мәнді әр қадамда нұсқалардың жартысын алып тастау арқылы іздеу және тізімнің үздіксіз бөлігін екі шекараны жылжыта отырып өңдеу.",
    "Поиск нужного значения в упорядоченном списке отбрасыванием половины вариантов на каждом шаге и обработка непрерывного участка списка сдвигом двух границ.",
  ),
  explanation: t(
    "Міндетті визуалды анимация: оқушы іздеу шекараларының қалай жақындағанын көріп, келесі қадамды алдын ала болжайды. Шекарада қателесу оңай болғандықтан, алғашқы екі аптада дайын кодты оқу, түзету және толықтыру көбірек беріледі.",
    "Обязательная визуальная анимация: ученик видит, как сближаются границы поиска, и заранее предсказывает следующий шаг. Так как на границе легко ошибиться, в первые две недели больше даётся чтение, исправление и дополнение готового кода.",
  ),
  /** PDF p.11, the year summary table's row for month 5. */
  endOfMonthCapability: t(
    "Үлкен реттелген жиыннан керекті мәнді тез табады және шекаралармен мұқият жұмыс істейді.",
    "Быстро находит нужное значение в большом упорядоченном множестве и аккуратно работает с границами.",
  ),
  expectedTaskCount: 30,
  practiceOutline: t(
    "Тізімде сан бар ма, оны қай орынға кірістіру керек, берілген аралыққа қанша сан түседі, қажетті қосындысы бар жұпты табу, қайталанбайтын ең ұзын бөлік, екі реттелген тізімді біріктіру. Қосымша - іздеу шекараларындағы қателерді түзету.",
    "Есть ли число в списке, на какое место его нужно вставить, сколько чисел попадает в заданный промежуток, поиск пары с нужной суммой, самый длинный участок без повторов, слияние двух отсортированных списков. Дополнительно — исправление ошибок в границах поиска.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-05",
  units: [
    buildUnit(
      "m5.u1",
      "Екіге бөліп іздеу",
      "Бинарный поиск",
      [
        {
          id: "m5.l1",
          kk: "Жарты аралықты тастау",
          ru: "Отбрасывание половины",
          minutes: 9,
          objectives: [
            ["Ортаңғы элементпен салыстыру", "Сравнивать со средним элементом"],
            ["Неге әр қадам екі есе қысқартатынын түсіну", "Понимать, почему каждый шаг сокращает вдвое"],
          ],
          skills: ["bsearch.core"],
          blocks: M5_L1,
        },
        {
          id: "m5.l2",
          kk: "Шекараны жылжыту",
          ru: "Сдвиг границ",
          minutes: 9,
          objectives: [
            ["Шексіз циклдің себебін табу", "Находить причину бесконечного цикла"],
            ["Шекараны қосумен және азайтумен ажырату", "Различать сдвиг с +1 и без"],
          ],
          skills: ["bsearch.boundary", "debug.boundary"],
          blocks: M5_L2,
        },
        /* PDF p.9 asks for boundary repair as a block of its own — «Қосымша -
           іздеу шекараларындағы қателерді түзету». */
        {
          id: "m5.l6",
          kk: "Шекарадағы қателер",
          ru: "Ошибки на границах",
          minutes: 9,
          objectives: [
            ["Шекара қатесінің төрт түрін тану", "Распознавать четыре вида ошибки границы"],
            ["Қатені қағазда трассалау арқылы табу", "Находить ошибку ручной трассировкой"],
          ],
          skills: ["bsearch.boundary", "debug.boundary"],
          blocks: M5_L6,
        },
        {
          id: "m5.l3",
          kk: "Жауап бойынша іздеу",
          ru: "Бинарный поиск по ответу",
          minutes: 10,
          objectives: [
            ["Жауапты тікелей есептеудің орнына тексеру", "Проверять ответ вместо прямого вычисления"],
            ["Тексеру функциясының монотондығын байқау", "Замечать монотонность проверяющей функции"],
          ],
          skills: ["bsearch.core", "func.define"],
          blocks: M5_L3,
        },
      ],
      P,
    ),
    buildUnit(
      "m5.u2",
      "Екі шекара",
      "Два указателя",
      [
        {
          id: "m5.l4",
          kk: "Екі шекара әдісі",
          ru: "Метод двух указателей",
          minutes: 9,
          objectives: [
            ["Екі көрсеткішті бір бағытта жылжыту", "Двигать два указателя в одном направлении"],
            ["Ішкі циклді неге алмастыратынын түсіну", "Понимать, почему это заменяет вложенный цикл"],
          ],
          skills: ["twopointers.core", "perf.compare_solutions"],
          blocks: M5_L4,
        },
        /* «екі реттелген тізімді біріктіру» is a named family and merging is a
           different move from the pair-sum walk in m5.l4. */
        {
          id: "m5.l7",
          kk: "Екі реттелген тізімді біріктіру",
          ru: "Слияние двух отсортированных списков",
          minutes: 9,
          objectives: [
            ["Екі тізімді бір өтуде біріктіру", "Сливать два списка за один проход"],
            ["Бір тізім таусылған жағдайды өңдеу", "Обрабатывать случай, когда один список закончился"],
          ],
          skills: ["twopointers.core", "sort.basic", "lists.traverse"],
          blocks: M5_L7,
        },
        {
          id: "m5.l5",
          kk: "Күрделірек есептер",
          ru: "Задачи посложнее",
          minutes: 10,
          objectives: [
            ["Реттеуді екі шекарамен біріктіру", "Сочетать сортировку с двумя указателями"],
            ["Шешімнің дұрыстығын дәлелдеу", "Обосновывать корректность решения"],
          ],
          skills: ["twopointers.core", "sort.basic"],
          blocks: M5_L5,
        },
      ],
      P,
    ),
    {
      id: "m5.u3",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m5.l8",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Іздеу аралығын өз бетінше дұрыс қысқарту", "Самостоятельно правильно сокращать интервал поиска"),
            t("Шекараны тапсырар алдында шеткі жағдайда тексеру", "Проверять границу на крайнем случае перед отправкой"),
          ],
          skillRefs: [
            "bsearch.core",
            "bsearch.boundary",
            "twopointers.core",
            "sort.basic",
            "func.define",
            "lists.traverse",
          ],
          blocks: M5_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M5_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 5,
    kk: "Қаңтар айының тексерісі",
    ru: "Проверка за январь",
    minutes: 20,
    /* PDF p.9, January's own «Айлық сынақ» sentence. The oral question is
       specific and unusual: why the answer is never discarded — the loop
       invariant, asked in a fourteen-year-old's vocabulary. */
    descriptionKk:
      "Бағдарлама шеткі жағдайлардың тексеруінен өтеді, ал оқушы екіге бөлу кезінде жауаптың неге жоғалып кетпейтінін сөзбен түсіндіреді.",
    descriptionRu:
      "Программа проходит проверку на крайних случаях, а ученик словами объясняет, почему при делении пополам ответ не теряется.",
    pdfPage: P,
    blocks: M5_ASSESSMENT,
  }),
};
