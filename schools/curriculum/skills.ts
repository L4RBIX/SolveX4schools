import type { Skill, SkillId } from "./types";

/**
 * The skill taxonomy, derived from the programme's per-month "Оқушы нені
 * меңгереді" paragraphs (PDF §4, pp.7–10).
 *
 * A skill id travels through learning events into `learner_skill_state` and is
 * never interpreted by the Learning Intelligence core — to the reducer it is an
 * opaque string. The dotted naming is for people reading dashboards.
 *
 * Ids are stable. Renaming one silently orphans every event already recorded
 * against it, so add a new id and retire the old one instead.
 */

function s(
  id: SkillId,
  kk: string,
  ru: string,
  month: number,
  pdfPage: number,
): Skill {
  return {
    id,
    title: { kk, ru },
    introducedInMonth: month,
    sourceType: "curriculum-derived",
    pdfPage,
  };
}

export const SKILLS: Skill[] = [
  /* --- Month 1 · Қыркүйек · input, computation, conditions (p.7) --- */
  s("io.read", "Деректерді оқу", "Чтение данных", 1, 7),
  s("io.print", "Жауапты шығару", "Вывод ответа", 1, 7),
  s("types.int_float", "Бүтін және бөлшек сандар", "Целые и дробные числа", 1, 7),
  s("arith.basic", "Арифметикалық амалдар", "Арифметические операции", 1, 7),
  s("arith.integer_division", "Бүтін бөлу", "Целочисленное деление", 1, 7),
  s("arith.remainder", "Қалдық", "Остаток", 1, 7),
  s("compare.operators", "Салыстыру амалдары", "Операторы сравнения", 1, 7),
  s("cond.if_elif_else", "if / elif / else шарттары", "Условия if / elif / else", 1, 7),
  s("logic.and_or_not", "Логикалық амалдар (and, or, not)", "Логические операции (and, or, not)", 1, 7),
  s("debug.boundary", "Шарт шекарасы", "Границы условия", 1, 7),

  /* --- Month 2 · Қазан · loops and lists (p.7) --- */
  s("loops.for", "for циклі", "Цикл for", 2, 7),
  s("loops.while", "while циклі", "Цикл while", 2, 7),
  s("loops.counter", "Цикл санағышы", "Счётчик цикла", 2, 7),
  s("loops.accumulator", "Жинақтаушы айнымалы", "Накопитель", 2, 7),
  s("lists.index", "Тізім индексі", "Индекс списка", 2, 7),
  s("lists.traverse", "Тізімді толық қарап шығу", "Полный обход списка", 2, 7),
  s("strings.sequence", "Жолды таңбалар тізбегі ретінде өңдеу", "Строка как последовательность", 2, 7),
  s("loops.nested", "Ішкі циклдер", "Вложенные циклы", 2, 7),

  /* --- Month 3 · Қараша · functions and scope (p.8) --- */
  s("func.define", "Функция жазу", "Определение функции", 3, 8),
  s("func.parameters", "Параметр беру", "Передача параметров", 3, 8),
  s("func.return", "return арқылы нәтиже қайтару", "Возврат через return", 3, 8),
  s("func.reuse", "Функцияны бірнеше рет шақыру", "Повторный вызов функции", 3, 8),
  s("scope.local_global", "Жергілікті және жаһандық айнымалы", "Локальные и глобальные переменные", 3, 8),

  /* --- Month 4 · Желтоқсан · speed, sorting, precomputation (p.8) --- */
  s("perf.time_estimate", "Уақытқа үлгеруді бағалау", "Оценка укладывания по времени", 4, 8),
  s("sort.basic", "Сандарды реттеу", "Сортировка чисел", 4, 8),
  s("precompute.prefix", "Алдын ала есептеу", "Предварительные вычисления", 4, 8),
  s("perf.compare_solutions", "Екі шешімді салыстыру", "Сравнение двух решений", 4, 8),

  /* --- Month 5 · Қаңтар · binary search, two pointers (p.9) --- */
  s("bsearch.core", "Екіге бөліп іздеу", "Бинарный поиск", 5, 9),
  s("bsearch.boundary", "Іздеу шекаралары", "Границы поиска", 5, 9),
  s("twopointers.core", "Екі шекара әдісі", "Метод двух указателей", 5, 9),

  /* --- Month 6 · Ақпан · exhaustive search, recursion (p.9) --- */
  s("enumerate.all", "Барлық нұсқаны тексеру", "Полный перебор", 6, 9),
  s("recursion.core", "Өзін-өзі шақыратын функция", "Рекурсия", 6, 9),
  s("recursion.base_case", "Тоқтату шарты", "Базовый случай", 6, 9),
  s("recursion.call_tree", "Шақырулар ағашы", "Дерево вызовов", 6, 9),

  /* --- Month 7 · Наурыз · grids and paths (p.9) --- */
  s("grid.cells", "Ұяшық және көрші ұяшық", "Клетка и соседи", 7, 9),
  s("graph.bfs", "Толқын әдісі (BFS)", "Обход в ширину (BFS)", 7, 9),
  s("graph.dfs", "Тереңдікке өту (DFS)", "Обход в глубину (DFS)", 7, 9),
  s("graph.regions", "Байланысқан аймақтар", "Связные области", 7, 9),
  s("graph.shortest_path", "Ең қысқа жол", "Кратчайший путь", 7, 9),
  s("graph.path_restore", "Маршрутты қалпына келтіру", "Восстановление маршрута", 7, 9),

  /* --- Month 8 · Сәуір · greedy and DP (p.10) --- */
  s("greedy.core", "Әр қадамда тиімді таңдау", "Жадный выбор", 8, 10),
  s("greedy.counterexample", "Қарсы мысал іздеу", "Поиск контрпримера", 8, 10),
  s("dp.core", "Алдыңғы жауаптар арқылы шешу", "Решение через предыдущие ответы", 8, 10),
  s("dp.table", "Қадамдап толтырылатын кесте", "Пошагово заполняемая таблица", 8, 10),

  /* --- Month 9 · Мамыр · contests (p.10) --- */
  s("contest.time_split", "Есептер арасында уақыт бөлу", "Распределение времени", 9, 10),
  s("contest.verdict_reading", "Тексеру жүйесінің хабарламасын оқу", "Чтение вердикта системы", 9, 10),
  s("contest.upsolving", "Жарыстан кейін толық шешу", "Дорешивание", 9, 10),
  s("contest.defend", "Шешімді ауызша қорғау", "Устная защита решения", 9, 10),
];

export const SKILL_BY_ID: ReadonlyMap<SkillId, Skill> = new Map(
  SKILLS.map((skill) => [skill.id, skill]),
);

export function isKnownSkill(id: string): boolean {
  return SKILL_BY_ID.has(id);
}
