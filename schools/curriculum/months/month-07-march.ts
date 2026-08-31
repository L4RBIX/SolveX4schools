import type { Month } from "../types";
import { buildAssessment, buildUnit, t } from "./_builders";
import { M7_L1 } from "./m07/l1";
import { M7_L2 } from "./m07/l2";
import { M7_L5 } from "./m07/l5";
import { M7_L3 } from "./m07/l3";
import { M7_L4 } from "./m07/l4";
import { M7_PRACTICE } from "./m07/practice";
import { M7_ASSESSMENT } from "./m07/assessment";

/**
 * Month 7 · Наурыз — grids, regions and shortest paths. PDF p.9.
 *
 * ## Where the topic is allowed to start, and where it is not
 *
 * «Тақырып жалпы теориядан емес, ұяшықты картадан басталады: ұяшық - нүкте,
 * көрші ұяшық - байланыс» — the topic starts from a cell map, not from general
 * theory: a cell is a node, a neighbouring cell is an edge. That is a
 * prohibition as much as a starting point. No adjacency lists, no vertex
 * degree, no graph vocabulary before the grid has made it mean something. The
 * PDF also calls this «алғашқы танысу» — a first acquaintance — so March is an
 * introduction, not a graph course.
 *
 * ## The queue, and why it is not a deque
 *
 * BFS needs a queue and `collections.deque` is never taught by this programme,
 * so importing it would put an unexplained object at the centre of the month.
 * The queue here is a list plus a moving head index — which is exactly
 * January's two-pointer idea reused on a new problem, and therefore something
 * the learner has been taught rather than something smuggled in. Say so where
 * it first appears.
 *
 * ## The wave
 *
 * «Платформада толқын түрінде боялатын анимация көрсетіледі, оқушы келесі
 * қандай ұяшықтар өңделетінін болжайды» — the learner predicts which cells are
 * coloured next. The `bfs_wave` visualiser does not exist
 * (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1); the prediction
 * survives as `prediction` and `trace_code` blocks over a small grid, which
 * ask for the same answer in writing. The simulation blocks are declared so
 * they light up when it is built.
 *
 * ## The fifth lesson
 *
 * `m7.l5` is new and exists because p.9 asks separately for «Қосымша - бір
 * ұяшықтың екі рет өңделуіне әкелетін қатені түзету» — repairing the bug that
 * makes a cell get processed twice. That is the single most common way a first
 * BFS goes wrong, and giving it its own lesson is the difference between naming
 * it and teaching it.
 */

const P = 9; // PDF page for all of March

export const MONTH_07_MARCH: Month = {
  index: 7,
  monthName: t("Наурыз", "Март"),
  title: t("Жол іздеу: карта мен лабиринтті айналып өту", "Поиск пути: обход карты и лабиринта"),
  mastery: t(
    "Лабиринттегі ең қысқа жолды табу және картадағы байланысқан аймақтарды анықтау. Бұл объектілер арасындағы байланыстар туралы есептермен алғашқы танысу.",
    "Поиск кратчайшего пути в лабиринте и определение связных областей на карте. Это первое знакомство с задачами о связях между объектами.",
  ),
  explanation: t(
    "Тақырып жалпы теориядан емес, ұяшықты картадан басталады: ұяшық - нүкте, көрші ұяшық - байланыс. Платформада толқын түрінде боялатын анимация көрсетіледі, оқушы келесі қандай ұяшықтар өңделетінін болжайды.",
    "Тема начинается не с общей теории, а с клеточной карты: клетка — это точка, соседняя клетка — это связь. На платформе показывается анимация, закрашивающая клетки волной, и ученик предсказывает, какие клетки будут обработаны следующими.",
  ),
  /** PDF p.11, the year summary table's row for month 7. */
  endOfMonthCapability: t(
    "Ең қысқа жолды және байланысқан аймақтарды табады.",
    "Находит кратчайший путь и связные области.",
  ),
  expectedTaskCount: 26,
  practiceOutline: t(
    "Картада қанша арал бар, берілген нүктеден аймақты бояу, бір ұяшықтан екіншісіне жетуге бола ма, лабиринттегі ең қысқа жол, ең үлкен аралдың өлшемі, маршрутты қалпына келтіру. Қосымша - бір ұяшықтың екі рет өңделуіне әкелетін қатені түзету.",
    "Сколько на карте островов, закрасить область от заданной точки, можно ли добраться из одной клетки в другую, кратчайший путь в лабиринте, размер самого большого острова, восстановление маршрута. Дополнительно — исправление ошибки, из-за которой одна клетка обрабатывается дважды.",
  ),
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-07",
  units: [
    buildUnit(
      "m7.u1",
      "Тор",
      "Сетка",
      [
        {
          id: "m7.l1",
          kk: "Ұяшық және көршілер",
          ru: "Клетка и соседи",
          minutes: 9,
          objectives: [
            ["Төрт көршіні жүйелі қарау", "Систематически обходить четырёх соседей"],
            ["Шекарадан шықпауды тексеру", "Проверять выход за границы"],
          ],
          skills: ["grid.cells", "debug.boundary", "loops.nested"],
          blocks: M7_L1,
        },
        {
          id: "m7.l2",
          kk: "Аймақтарды бөлу",
          ru: "Выделение областей",
          minutes: 9,
          objectives: [
            ["Қаралған ұяшықтарды белгілеу", "Отмечать посещённые клетки"],
            ["Байланысқан аймақтарды санау", "Считать связные области"],
          ],
          skills: ["graph.dfs", "graph.regions", "recursion.core"],
          blocks: M7_L2,
        },
        /* PDF p.9 asks separately for the repeated-cell bug. It is the most
           common way a first traversal goes wrong, so it gets a lesson. */
        {
          id: "m7.l5",
          kk: "Бір ұяшық екі рет",
          ru: "Одна клетка дважды",
          minutes: 9,
          objectives: [
            ["Белгілеудің қай жерде тұруы керегін көрсету", "Показывать, где именно должна стоять отметка"],
            ["Қайта өңделудің салдарын өлшеу", "Оценивать последствия повторной обработки"],
          ],
          skills: ["graph.bfs", "graph.regions", "debug.boundary"],
          blocks: M7_L5,
        },
      ],
      P,
    ),
    buildUnit(
      "m7.u2",
      "Ең қысқа жол",
      "Кратчайший путь",
      [
        {
          id: "m7.l3",
          kk: "Толқын әдісі",
          ru: "Метод волны",
          minutes: 10,
          objectives: [
            ["Кезекпен қабаттап таралуды жазу", "Реализовать послойное распространение через очередь"],
            ["Неге бірінші жету ең қысқа екенін дәлелдеу", "Обосновывать, почему первое достижение — кратчайшее"],
          ],
          skills: ["graph.bfs", "graph.shortest_path"],
          blocks: M7_L3,
        },
        {
          id: "m7.l4",
          kk: "Маршрутты қалпына келтіру",
          ru: "Восстановление маршрута",
          minutes: 10,
          objectives: [
            ["Әр ұяшыққа қайдан келгенін сақтау", "Сохранять, откуда пришли в каждую клетку"],
            ["Жолды кері бағытта жинау", "Собирать путь в обратном направлении"],
          ],
          skills: ["graph.path_restore", "graph.bfs"],
          blocks: M7_L4,
        },
      ],
      P,
    ),
    {
      id: "m7.u3",
      title: t("Дербес жаттығу", "Самостоятельная практика"),
      sourceType: "product-authored",
      lessons: [
        {
          id: "m7.l6",
          title: t("Өз бетіңмен шығар", "Реши сам"),
          estimatedMinutes: 12,
          objectives: [
            t("Торды оқып, өз бетінше айналып өту", "Читать сетку и самостоятельно её обходить"),
            t("Белгілеуді бірінші ойлау", "Продумывать отметку посещённых клеток первым делом"),
          ],
          skillRefs: [
            "grid.cells",
            "graph.bfs",
            "graph.dfs",
            "graph.regions",
            "graph.shortest_path",
            "graph.path_restore",
            "debug.boundary",
          ],
          blocks: M7_PRACTICE,
          sourceType: "product-authored",
          /* Derived, not asserted. `buildLesson` does this for every other lesson;
             hand-writing "implemented" over an unauthored bank made the validator
             report an error about scaffolding rather than about content. */
          status: M7_PRACTICE.length > 0 ? "implemented" : "draft",
        },
      ],
    },
  ],
  assessment: buildAssessment({
    monthIndex: 7,
    kk: "Наурыз айының тексерісі",
    ru: "Проверка за март",
    minutes: 20,
    /* PDF p.9, March's own «Айлық сынақ» sentence. The oral half is specific:
       why the path found really is the shortest. */
    descriptionKk:
      "Картаға арналған бейтаныс есепті шешіп, табылған жолдың неге шынымен ең қысқа екенін түсіндіру.",
    descriptionRu:
      "Решить незнакомую задачу на карте и объяснить, почему найденный путь действительно кратчайший.",
    pdfPage: P,
    blocks: M7_ASSESSMENT,
  }),
};
