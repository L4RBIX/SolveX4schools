import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M8_L1 } from "./m08/l1";
import { M8_L2 } from "./m08/l2";
import { M8_L5 } from "./m08/l5";
import { M8_L3 } from "./m08/l3";
import { M8_L4 } from "./m08/l4";
import { M8_PRACTICE } from "./m08/practice";
import { M8_ASSESSMENT } from "./m08/assessment";

/**
 * Month 8 · Сәуір — greedy choice and introductory dynamic programming. PDF p.10.
 *
 * ## What the month is actually about
 *
 * «Мұнда маңыздысы - дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы» —
 * what matters here is not memorising a ready method, it is the skill of
 * looking for a counterexample. The platform is supposed to PROPOSE a strategy
 * and ask the learner to break it on a small example.
 *
 * That inverts the usual shape of a lesson and the content follows it: several
 * blocks this month put a plausible, wrong greedy rule on screen deliberately,
 * and the task is to find the input where it loses. `test_case` is the block
 * for that — `breakingInputs` is literally "name the input that breaks it" —
 * and the coin-change family the PDF names is set up precisely so the greedy
 * rule fails: «соманы ең аз монетамен жинап көріп оның қай кезде қателесетінін
 * табу», collect the sum with the fewest coins and find WHEN it goes wrong.
 *
 * ## The DP half
 *
 * «Екінші тәсіл қадамдап толтырылатын кесте арқылы беріледі» — the second
 * approach is delivered through a table filled in step by step. The `dp_table`
 * visualiser does not exist (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md`
 * §1), so the table is filled by hand in `trace_code` blocks, which is the same
 * work with the learner holding the pen.
 *
 * The assessment sentence makes the order non-negotiable: «Кодқа отырмас бұрын
 * әр аралық нәтиженің нені білдіретінін сөзбен тұжырымдайды» — before sitting
 * down to code, state in words what each intermediate result means. So every DP
 * task in the month asks what `dp[i]` MEANS before it asks for the recurrence,
 * and no lesson hands over a template to copy.
 *
 * ## The fifth lesson
 *
 * `m8.l5` is new. The stub had two greedy lessons and two DP lessons and
 * nowhere for the PDF's six named families to land — three of them
 * (баспалдақ, ең үлкен қосындысы бар бөлік, көрші екі санды қатар алмау) are
 * one-dimensional DP over a list, which is a different exercise from meeting
 * the idea. It is taught fifth, after the two greedy lessons.
 */

const P = 10; // PDF page for all of April

export const MONTH_08_APRIL: Month = {
  index: 8,
  monthName: t("Сәуір", "Апрель"),
  title: t(
    "Тиімді таңдау және алдыңғы жауаптар арқылы шешу",
    "Выгодный выбор и решение через предыдущие ответы",
  ),
  mastery: t(
    "Ойлаудың екі тәсілі: әр қадамда ең тиімді нұсқаны таңдап, оның шынымен ең жақсы жауапқа жеткізетінін тексеру; екіншісі - кіші жағдайлар үшін табылған жауаптарды пайдаланып үлкен есепті шешу.",
    "Два способа рассуждения: на каждом шаге выбирать самый выгодный вариант и проверять, действительно ли он приводит к лучшему ответу; и второй — решать большую задачу, используя ответы, найденные для меньших случаев.",
  ),
  explanation: t(
    "Мұнда маңыздысы - дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы. Платформа ықтимал стратегияны ұсынып, оқушыдан оны шағын мысалда бұзып көруді сұрайды. Екінші тәсіл қадамдап толтырылатын кесте арқылы беріледі.",
    "Здесь важно не заучивание готового метода, а навык поиска контрпримера. Платформа предлагает возможную стратегию и просит ученика сломать её на небольшом примере. Второй способ подаётся через таблицу, заполняемую пошагово.",
  ),
  /** PDF p.11, the year summary table's row for month 8. */
  endOfMonthCapability: t(
    "Стратегияны қарсы мысалмен тексереді, аралық нәтижелер арқылы есеп шешеді.",
    "Проверяет стратегию контрпримером, решает задачу через промежуточные результаты.",
  ),
  expectedTaskCount: 28,
  practiceOutline: t(
    "Уақыттары қабаттаспайтын сабақтардың максимумын таңдау, соманы ең аз монетамен жинап көріп оның қай кезде қателесетінін табу, баспалдақпен неше тәсілмен көтерілу, тізімнің ең үлкен қосындысы бар бөлігін табу, көрші екі санды қатар алмау шартымен таңдау, тордағы жолдар санын есептеу.",
    "Выбрать максимум непересекающихся по времени занятий, попробовать собрать сумму наименьшим числом монет и найти, когда этот способ ошибается, сколько способов подняться по лестнице, найти участок списка с наибольшей суммой, выбрать числа с условием не брать два соседних подряд, посчитать число путей в сетке.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-08",
  units: [
    buildUnit(
      "m8.u1",
      "Ашкөз таңдау",
      "Жадный выбор",
      [
        {
          id: "m8.l1",
          kk: "Әр қадамда ең тиімдісі",
          ru: "Лучшее на каждом шаге",
          minutes: 9,
          objectives: [
            ["Ашкөз ережені тұжырымдау", "Формулировать жадное правило"],
            ["Реттеудің таңдауға әсерін көру", "Видеть влияние сортировки на выбор"],
          ],
          skills: ["greedy.core", "sort.basic"],
          blocks: M8_L1,
        },
        {
          id: "m8.l2",
          kk: "Қарсы мысал",
          ru: "Контрпример",
          minutes: 9,
          objectives: [
            ["Ашкөз әдістің бұзылатын жағдайын табу", "Находить случай, где жадность ломается"],
            ["Дәлел мен сенімді ажырату", "Различать доказательство и уверенность"],
          ],
          skills: ["greedy.counterexample", "enumerate.all"],
          blocks: M8_L2,
        },
      ],
      P,
    ),
    buildUnit(
      "m8.u2",
      "Динамика",
      "Динамика",
      [
        {
          id: "m8.l3",
          kk: "Алдыңғы жауаптар арқылы",
          ru: "Через предыдущие ответы",
          minutes: 10,
          objectives: [
            ["Келесі жауапты алдыңғылардан шығару", "Выводить следующий ответ из предыдущих"],
            ["Бастапқы мәндерді дұрыс қою", "Правильно задавать начальные значения"],
          ],
          skills: ["dp.core", "dp.table"],
          blocks: M8_L3,
        },
        /* Three of the PDF's six families are one-dimensional DP over a list,
           which is a different exercise from meeting the idea. */
        {
          id: "m8.l5",
          kk: "Тізім бойынша кесте",
          ru: "Таблица по списку",
          minutes: 10,
          objectives: [
            ["dp[i] нені білдіретінін сөзбен айту", "Формулировать словами, что означает dp[i]"],
            ["Екі нұсқаның ең жақсысын таңдау ережесін жазу", "Записывать правило выбора лучшего из двух вариантов"],
          ],
          skills: ["dp.core", "dp.table", "lists.traverse"],
          blocks: M8_L5,
        },
        {
          id: "m8.l4",
          kk: "Кестені толтыру",
          ru: "Заполнение таблицы",
          minutes: 10,
          objectives: [
            ["Толтыру ретін дұрыс таңдау", "Правильно выбирать порядок заполнения"],
            ["Рекурсия мен кестенің байланысын көру", "Видеть связь рекурсии и таблицы"],
          ],
          skills: ["dp.table", "recursion.core", "precompute.prefix"],
          blocks: M8_L4,
        },
      ],
      P,
    ),
    {
      id: "m8.u3",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m8.l6",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Стратегияны ұсынып, оны қарсы мысалмен тексеру", "Предлагать стратегию и проверять её контрпримером"),
            t("Кодқа отырмас бұрын аралық нәтиженің мағынасын айту", "Формулировать смысл промежуточного результата до кода"),
          ],
          skillRefs: [
            "greedy.core",
            "greedy.counterexample",
            "dp.core",
            "dp.table",
            "sort.basic",
            "lists.traverse",
          ],
          blocks: M8_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M8_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 8,
    kk: "Сәуір айының тексерісі",
    ru: "Проверка за апрель",
    minutes: 20,
    /* PDF p.10, April's own «Айлық сынақ» sentence. Both halves are stated:
       the meaning of the intermediate result before any code, and either a
       justification of the greedy strategy or a counterexample to it. */
    descriptionKk:
      "Кодқа отырмас бұрын әр аралық нәтиженің нені білдіретінін сөзбен тұжырымдау; тиімді таңдау есебінде стратегияны не негіздеу, не оған қарсы мысал келтіру.",
    descriptionRu:
      "До того как сесть за код, сформулировать словами, что означает каждый промежуточный результат; в задаче на выгодный выбор либо обосновать стратегию, либо привести к ней контрпример.",
    pdfPage: P,
    blocks: M8_ASSESSMENT,
  }),
};
