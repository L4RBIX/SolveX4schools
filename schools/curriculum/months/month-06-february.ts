import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M6_L1 } from "./m06/l1";
import { M6_L2 } from "./m06/l2";
import { M6_L3 } from "./m06/l3";
import { M6_L4 } from "./m06/l4";
import { M6_L6 } from "./m06/l6";
import { M6_L5 } from "./m06/l5";
import { M6_PRACTICE } from "./m06/practice";
import { M6_ASSESSMENT } from "./m06/assessment";

/**
 * Month 6 · Ақпан — exhaustive search and recursion. PDF p.9.
 *
 * ## The limit the programme sets, in its own words
 *
 * «Күрделі кері қайту тәсілі биыл бүкіл топқа нөлден жаздырылмайды, оқу және
 * түсіндіру, толықтыру деңгейінде беріледі» — complicated backtracking is NOT
 * written from scratch by the whole group this year; it is delivered at the
 * level of reading, explaining and completing.
 *
 * That is a constraint on block types, not a tone. Anywhere backtracking
 * proper appears, the core route meets it as `trace_code`, `fill_blank`,
 * `modify_code` or `explain` — never as a blank editor with "write a
 * backtracking solution" above it. The queens problem the PDF names is
 * «Мықты оқушыларға» — for the strong students — so `tracks: ["advanced"]` on
 * it is the source specifying differentiation, not a product decision.
 *
 * ## The call tree
 *
 * «Айдың орталық құралы - шақырулар ағашы» — the month's central tool is the
 * tree of calls. The `recursion_tree` visualiser does not exist
 * (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1), so the weight
 * sits on `trace_code` over a recursion, which makes the learner write the
 * order of calls and returns down rather than watch it. The blocks that would
 * mount the animation are declared so they light up when it is built.
 *
 * ## The sixth lesson
 *
 * `m6.l6` is new: «0 мен 1-ден тұратын барлық шағын тізбектерді шығару» and
 * «шағын тордағы жолдар санын есептеу» are two named families that are neither
 * plain enumeration nor plain recursion but the join of the two, and they are
 * where the month's read-and-complete treatment of generation actually lives.
 * It takes the next free number and is taught fifth, per the convention
 * September set with `m1.l10`–`m1.l12`.
 */

const P = 9; // PDF page for all of February

export const MONTH_06_FEBRUARY: Month = {
  index: 6,
  monthName: t("Ақпан", "Февраль"),
  title: t("Нұсқаларды толық тексеру және рекурсия", "Полный перебор вариантов и рекурсия"),
  mastery: t(
    "Нұсқалар аз болғанда барлық мүмкін нұсқаны жүйелі түрде тексеру және функция дәл сондай, бірақ кішірек есепті шешу үшін өзін-өзі шақыратын тәсілді түсіну.",
    "Систематическая проверка всех возможных вариантов, когда их немного, и понимание приёма, при котором функция вызывает саму себя, чтобы решить такую же, но меньшую задачу.",
  ),
  explanation: t(
    "Айдың орталық құралы - шақырулар ағашы. Оқушы бағдарламаның қалай тереңдеп, кейін қалай кері қайтатынын көреді. Күрделі кері қайту тәсілі биыл бүкіл топқа нөлден жаздырылмайды, оқу және түсіндіру, толықтыру деңгейінде беріледі.",
    "Главный инструмент месяца — дерево вызовов. Ученик видит, как программа углубляется и как затем возвращается обратно. Сложный приём с возвратом в этом году не даётся всей группе для написания с нуля: он подаётся на уровне чтения, объяснения и дополнения.",
  ),
  /** PDF p.11, the year summary table's row for month 6. */
  endOfMonthCapability: t(
    "Нұсқаларды жүйелі тексереді, өзін-өзі шақыратын функция жазады.",
    "Систематически перебирает варианты, пишет функцию, вызывающую саму себя.",
  ),
  expectedTaskCount: 30,
  practiceOutline: t(
    "Белгілі қасиеті бар барлық жұп пен үштікті табу, факториал мен дәрежені өзін-өзі шақыру арқылы есептеу, сөз симметриясын осы тәсілмен тексеру, 0 мен 1-ден тұратын барлық шағын тізбектерді шығару, шағын тордағы жолдар санын есептеу. Мықты оқушыларға - шахмат тақтасына уәзірлерді орналастыру есебі.",
    "Поиск всех пар и троек с заданным свойством, вычисление факториала и степени через вызов функцией самой себя, проверка симметрии слова этим же приёмом, вывод всех коротких последовательностей из 0 и 1, подсчёт числа путей в маленькой сетке. Сильным ученикам — задача о расстановке ферзей на шахматной доске.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-06",
  units: [
    buildUnit(
      "m6.u1",
      "Толық іріктеу",
      "Полный перебор",
      [
        {
          id: "m6.l1",
          kk: "Барлық нұсқаны қарау",
          ru: "Перебор всех вариантов",
          minutes: 9,
          objectives: [
            ["Нұсқалар санын алдын ала бағалау", "Заранее оценивать число вариантов"],
            ["Ешбір нұсқаны өткізіп алмау", "Не пропускать ни одного варианта"],
          ],
          skills: ["enumerate.all", "loops.nested", "perf.time_estimate"],
          blocks: M6_L1,
        },
        {
          id: "m6.l2",
          kk: "Іріктеу қашан жарамайды",
          ru: "Когда перебор не подходит",
          minutes: 8,
          objectives: [
            ["Шектеу бойынша іріктеудің шегін анықтау", "Определять предел перебора по ограничениям"],
            ["Артық нұсқаларды кесіп тастау", "Отсекать лишние варианты"],
          ],
          skills: ["enumerate.all", "perf.time_estimate"],
          blocks: M6_L2,
        },
      ],
      P,
    ),
    buildUnit(
      "m6.u2",
      "Рекурсия",
      "Рекурсия",
      [
        {
          id: "m6.l3",
          kk: "Өзін шақыратын функция",
          ru: "Функция, вызывающая себя",
          minutes: 9,
          objectives: [
            ["Есепті кішірек есепке келтіру", "Сводить задачу к меньшей задаче"],
            ["Шақырулар ағашын салу", "Рисовать дерево вызовов"],
          ],
          skills: ["recursion.core", "recursion.call_tree", "func.return"],
          blocks: M6_L3,
        },
        {
          id: "m6.l4",
          kk: "Тоқтату шарты",
          ru: "Базовый случай",
          minutes: 9,
          objectives: [
            ["Тоқтату шартын бірінші жазу", "Писать базовый случай первым"],
            ["Шексіз рекурсияның себебін тану", "Распознавать причину бесконечной рекурсии"],
          ],
          skills: ["recursion.base_case", "debug.boundary"],
          blocks: M6_L4,
        },
        /* «0 мен 1-ден тұратын барлық шағын тізбектерді шығару» and «шағын
           тордағы жолдар санын есептеу»: generation and counting by recursion,
           taught at the reading-and-completing level the PDF specifies. */
        {
          id: "m6.l6",
          kk: "Рекурсиямен нұсқа құрастыру",
          ru: "Построение вариантов рекурсией",
          minutes: 10,
          objectives: [
            ["Тереңдеу мен кері қайтуды ажырату", "Различать углубление и возврат"],
            ["Дайын генератордағы жетіспейтін жолды толықтыру", "Дополнять недостающую строку в готовом генераторе"],
          ],
          skills: ["recursion.core", "recursion.call_tree", "enumerate.all"],
          blocks: M6_L6,
        },
        {
          id: "m6.l5",
          kk: "Күрделірек есептер",
          ru: "Задачи посложнее",
          minutes: 10,
          objectives: [
            ["Рекурсияны іріктеумен біріктіру", "Сочетать рекурсию с перебором"],
            ["Рекурсивті шешімді ауызша дәлелдеу", "Обосновывать рекурсивное решение устно"],
          ],
          skills: ["recursion.core", "enumerate.all"],
          blocks: M6_L5,
        },
      ],
      P,
    ),
    {
      id: "m6.u3",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m6.l7",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Нұсқа санын бағалап, іріктеуді өз бетінше жазу", "Оценив число вариантов, самостоятельно писать перебор"),
            t("Тоқтау шартын бірінші ойлау", "Продумывать базовый случай первым"),
          ],
          skillRefs: [
            "enumerate.all",
            "recursion.core",
            "recursion.base_case",
            "recursion.call_tree",
            "func.define",
            "func.return",
            "loops.nested",
          ],
          blocks: M6_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M6_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 6,
    kk: "Ақпан айының тексерісі",
    ru: "Проверка за февраль",
    minutes: 20,
    /* PDF p.9, February's own «Айлық сынақ» sentence. */
    descriptionKk:
      "Тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция жазу және салынған ағаш бойынша шақыру ретін түсіндіру.",
    descriptionRu:
      "Написать функцию, вызывающую саму себя, с правильно поставленным базовым случаем и объяснить порядок вызовов по построенному дереву.",
    pdfPage: P,
    blocks: M6_ASSESSMENT,
  }),
};
