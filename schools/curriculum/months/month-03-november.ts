import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M3_L1 } from "./m03/l1";
import { M3_L2 } from "./m03/l2";
import { M3_L3 } from "./m03/l3";
import { M3_L8 } from "./m03/l8";
import { M3_L4 } from "./m03/l4";
import { M3_L5 } from "./m03/l5";
import { M3_L6 } from "./m03/l6";
import { M3_L7 } from "./m03/l7";
import { M3_PRACTICE } from "./m03/practice";
import { M3_ASSESSMENT } from "./m03/assessment";

/**
 * Month 3 · Қараша — functions, parameters, return, scope. PDF p.8.
 *
 * ## Why there are eight teaching lessons and not the stub's seven
 *
 * November is the only month whose paragraph states a lesson count. «Сегіз
 * қысқа сабақ және алты толық талданған мысал» — eight short lessons and six
 * fully worked examples. The stub had seven lessons and no worked examples at
 * all, so both numbers are met here: `m3.l8` is the eighth, and six
 * `worked_example` blocks are distributed across l1, l2, l3, l8, l5 and l6.
 *
 * `m3.l8` is taught FOURTH, straight after `return`, because helper functions
 * over lists and strings are what `return` is for and three of the PDF's eight
 * practice families live there. Its id is 8 because 8 was the next free number:
 * September set that convention when it inserted `m1.l10`, `m1.l11` and
 * `m1.l12` into the middle of the month rather than renumbering everything
 * downstream of them. Position in the `units` array is the teaching order; the
 * number in the id is only an id.
 *
 * The independent practice bank at `m3.l9` is deliberately NOT one of the eight:
 * the PDF counts «қысқа сабақ» — short explanation lessons — and a bank of
 * unscaffolded problems explains nothing. September has the same shape at
 * `m1.l9`.
 *
 * ## The prohibition this month carries
 *
 * «OOP-ке дейінгі процедуралық база толық қалыптасады» — the pre-OOP
 * procedural base is complete. No classes, no objects. And `global` appears
 * exactly once in the month, in `m3.l5`, as the failure the programme asks to
 * be analysed («неге global күтпеген нәтиже берді?») — never as a technique a
 * reference solution reaches for.
 */

const P = 8; // PDF page for all of November

export const MONTH_03_NOVEMBER: Month = {
  index: 3,
  monthName: t("Қараша", "Ноябрь"),
  title: t(
    "Бағдарлама құрылымы: функциялар, параметрлер және айнымалылардың көріну аймағы",
    "Структура программы: функции, параметры и область видимости переменных",
  ),
  mastery: t(
    "Қайталанатын логиканы функцияға бөлу; параметр беру және return арқылы нәтиже қайтару; функцияны бірнеше рет шақыру; жергілікті және жаһандық айнымалылардың айырмасын, көріну аймағын (scope) және жаһандық күйді орынсыз қолданудың неге қауіпті екенін түсіну. Осы айдың соңында оқушы шарттар, циклдер, тізімдер, жолдар және функцияларды біріктіріп, OOP-ке дейінгі процедуралық база толық қалыптасады.",
    "Вынесение повторяющейся логики в функцию; передача параметров и возврат результата через return; повторный вызов функции; понимание разницы между локальными и глобальными переменными, области видимости (scope) и того, почему неуместное глобальное состояние опасно. К концу месяца ученик соединяет условия, циклы, списки, строки и функции, и процедурная база до OOP складывается полностью.",
  ),
  explanation: t(
    "Сегіз қысқа сабақ және алты толық талданған мысал. Платформа функция шақырылғанда қандай параметр мәндері кіретінін, қандай жергілікті айнымалылар пайда болатынын және return кезінде не қайтатынын визуалды көрсетеді. Арнайы бөлімде «неге бұл айнымалы мұнда көрінбейді?» және «неге global күтпеген нәтиже берді?» деген қателер талданады.",
    "Восемь коротких уроков и шесть полностью разобранных примеров. Платформа наглядно показывает, какие значения параметров входят в функцию при вызове, какие локальные переменные при этом появляются и что возвращается при return. В отдельном разделе разбираются ошибки «почему эта переменная здесь не видна?» и «почему global дал неожиданный результат?».",
  ),
  /** PDF p.11, the year summary table's row for month 3. */
  endOfMonthCapability: t(
    "Бағдарламаны функцияларға бөледі, параметр мен return қолданады, local және global айырмасын түсіндіреді; OOP-ке дейінгі база толығады.",
    "Разбивает программу на функции, использует параметры и return, объясняет разницу между local и global; база до OOP становится полной.",
  ),
  expectedTaskCount: 34,
  practiceOutline: t(
    "Цифрлар қосындысын функциямен есептеу, максимум мен минимум функциясы, санның қасиетін тексеретін функция, тізімді өңдейтін көмекші функциялар, мәтінге арналған тексерулер, қайталанатын кодты функцияларға бөліп қайта жазу, бірнеше функциядан тұратын шағын бағдарлама, жергілікті және жаһандық айнымалы қатесін тауып түзету.",
    "Вычисление суммы цифр функцией, функция максимума и минимума, функция проверки свойства числа, вспомогательные функции для обработки списка, проверки для текста, переписывание повторяющегося кода в функции, небольшая программа из нескольких функций, поиск и исправление ошибки с локальной и глобальной переменной.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-03",
  units: [
    buildUnit(
      "m3.u1",
      "Функция негізі",
      "Основы функций",
      [
        {
          id: "m3.l1",
          kk: "Алғашқы функция",
          ru: "Первая функция",
          minutes: 8,
          objectives: [
            ["Функцияны жариялау және шақыру", "Объявлять и вызывать функцию"],
            ["Анықтама мен шақырудың айырмасы", "Различать определение и вызов"],
          ],
          skills: ["func.define", "func.reuse"],
          blocks: M3_L1,
        },
        {
          id: "m3.l2",
          kk: "Параметрлер",
          ru: "Параметры",
          minutes: 8,
          objectives: [
            ["Функцияға дерек беру", "Передавать данные в функцию"],
            ["Бір функцияны әртүрлі мәнмен шақыру", "Вызывать одну функцию с разными значениями"],
          ],
          skills: ["func.parameters", "func.reuse"],
          blocks: M3_L2,
        },
        {
          id: "m3.l3",
          kk: "return",
          ru: "return",
          minutes: 8,
          objectives: [
            ["Нәтижені қайтару мен шығарудың айырмасы", "Различать возврат и вывод результата"],
            ["return-тен кейін код орындалмайтынын түсіну", "Понимать, что после return код не выполняется"],
          ],
          skills: ["func.return"],
          blocks: M3_L3,
        },
        /* The eighth lesson the PDF requires, taught fourth. See the file's
           opening comment for why its id is 8 and its position is not. */
        {
          id: "m3.l8",
          kk: "Тізім мен мәтінге арналған функциялар",
          ru: "Функции для списков и строк",
          minutes: 9,
          objectives: [
            ["Тізімді қабылдап, бір мән қайтаратын функция жазу", "Писать функцию, принимающую список и возвращающую одно значение"],
            ["Көмекші функцияны негізгі бағдарламадан бөлек ойлау", "Продумывать вспомогательную функцию отдельно от основной программы"],
          ],
          skills: ["func.define", "func.parameters", "func.return", "lists.traverse", "strings.sequence"],
          blocks: M3_L8,
        },
      ],
      P,
    ),
    buildUnit(
      "m3.u2",
      "Айнымалылар аймағы",
      "Область видимости",
      [
        {
          id: "m3.l4",
          kk: "Жергілікті және жаһандық",
          ru: "Локальные и глобальные",
          minutes: 8,
          objectives: [
            ["Функция ішіндегі айнымалының жойылатынын түсіну", "Понимать, что переменная внутри функции исчезает"],
            ["Аттас айнымалылардың шатаспайтынын көрсету", "Показывать, что одноимённые переменные не смешиваются"],
          ],
          skills: ["scope.local_global"],
          blocks: M3_L4,
        },
        {
          id: "m3.l5",
          kk: "Функциядағы қателер",
          ru: "Ошибки в функциях",
          minutes: 8,
          objectives: [
            ["return жоқ функцияны тану", "Распознавать функцию без return"],
            ["Параметр мен жаһандық айнымалыны шатастырмау", "Не путать параметр с глобальной переменной"],
          ],
          skills: ["func.return", "scope.local_global"],
          blocks: M3_L5,
        },
      ],
      P,
    ),
    buildUnit(
      "m3.u3",
      "Есепті бөлу",
      "Декомпозиция задачи",
      [
        {
          id: "m3.l6",
          kk: "Есепті бөліктерге жіктеу",
          ru: "Разбиение задачи на части",
          minutes: 9,
          objectives: [
            ["Шешімді функцияларға бөлу жоспарын құру", "Составлять план разбиения решения на функции"],
            ["Әр функцияның міндетін бір сөйлеммен айту", "Формулировать задачу каждой функции одним предложением"],
          ],
          skills: ["func.define", "func.parameters", "func.return"],
          blocks: M3_L6,
        },
        {
          id: "m3.l7",
          kk: "Күрделірек есептер",
          ru: "Задачи посложнее",
          minutes: 10,
          objectives: [
            ["Бірнеше функциядан тұратын шешім жазу", "Писать решение из нескольких функций"],
            ["Функцияны бөлек тексеру", "Тестировать функцию отдельно"],
          ],
          skills: ["func.define", "func.reuse", "lists.traverse"],
          blocks: M3_L7,
        },
      ],
      P,
    ),
    {
      id: "m3.u4",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m3.l9",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Есепті функцияларға бөліп өз бетінше шешу", "Самостоятельно решать задачу, разбивая её на функции"),
            t("Функцияны жазбас бұрын не қабылдап не қайтаратынын айту", "Формулировать, что функция принимает и что возвращает, до её написания"),
          ],
          skillRefs: [
            "func.define",
            "func.parameters",
            "func.return",
            "func.reuse",
            "scope.local_global",
            "lists.traverse",
            "strings.sequence",
            "loops.for",
          ],
          blocks: M3_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M3_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 3,
    kk: "Қараша айының тексерісі",
    ru: "Проверка за ноябрь",
    minutes: 20,
    /* PDF p.8, November's own «Айлық сынақ» sentence. */
    descriptionKk:
      "Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу, әр функцияның міндетін және параметр мен return байланысын түсіндіру. Қосымша сұрақта жергілікті және жаһандық айнымалының қай жерде қолжетімді екенін көрсетіп, жаһандық айнымалыны қолданудың бір тәуекелін атау.",
    descriptionRu:
      "Самостоятельно написать программу как минимум из 2–3 функций, объяснить задачу каждой функции и связь между параметрами и return. В дополнительном вопросе показать, где доступна локальная и где глобальная переменная, и назвать один риск использования глобальной переменной.",
    pdfPage: P,
    blocks: M3_ASSESSMENT,
  }),
};
