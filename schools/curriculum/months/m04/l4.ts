import type { LessonBlock } from "../../types";

/**
 * Month 4 · Желтоқсан — lesson 4, «Реттеумен есептер» (9 minutes).
 *
 * PDF p.8. Three clauses of December drive this lesson:
 *
 *   «сандарды реттеу … медиананы табу»            — the practice families
 *   «Айдың басты тәсілі - бір есептің екі шешімін салыстыру.»
 *   «дұрыс жауап тым кеш шықса, қабылданбайды»
 *
 * The middle clause is why `m4.l4.b2` puts BOTH programs on one card instead of
 * showing the fast one and asserting it is fast. The learner reads the pair
 * loop, counts the pairs, and only then meets the neighbour argument. That
 * argument is the lesson's one idea: if two values are the closest pair,
 * nothing can lie between them, so after sorting they stand next to each other
 * — a quadratic scan collapses into `len(a) - 1` comparisons. It is the
 * clearest place in the whole month where ordering buys speed rather than
 * tidiness.
 *
 * ## The median rule, decided once, here
 *
 * The programme names «медиананы табу» and stops there, so the even-n case is
 * the author's to settle. It is settled as **the lower of the two middles**:
 * index `(n - 1) // 2` of the sorted list. The alternative — the average of the
 * two middles — drags in floats, a tolerance and a formatting question into a
 * nine-minute lesson whose subject is neighbours, not division.
 *
 * The rule is stated in the concept block, restated in every prompt that needs
 * it in BOTH languages, and enforced by cases: `m4.l4.b7` has n = 2, n = 4,
 * n = 6 and n = 8 cases where `n // 2` gives a different, wrong answer, so a
 * solution that quietly takes the upper middle fails rather than passes by luck.
 *
 * ## Why every card carries a different program
 *
 * An October review found tasks that could be passed by transcribing a program
 * from a neighbouring card. So the median appears three times and never in the
 * same shape: `b5` is a `def median(a)` helper over `sorted()` reading one line
 * (its fixed version is on screen, so it must not be a runnable answer to
 * anything later), while `b7` and the support twin `b7s` take n on the first
 * line and the numbers on the second and sort in place. Copying b5's repaired
 * code into b7 fails on the very first case. The same applies to the smallest
 * difference: `b2` works on a list literal, `b6` reads one line, `b8` reads the
 * competitive-programming two-line format and asks for the largest difference
 * as well — which is the sorted list's other gift, its two ends.
 *
 * Python used: everything through November, plus this month's `sorted()` and
 * `.sort()`. `min`/`max`/`sum` arrived with them but are deliberately unused —
 * the smallest difference is what the learner is here to compute by walking,
 * and `abs` appears only in the slow program, to be dropped when sorting makes
 * it unnecessary. No `set`, no `dict`, no comprehension, no import.
 *
 * Programs print plain numbers only, so nothing here depends on the reader's
 * language.
 */
export const M4_L4: LessonBlock[] = [
  {
    id: "m4.l4.b1",
    type: "concept",
    skillRefs: ["sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Реттегеннен кейін мәні жақын сан көрші тұрады",
      ru: "После сортировки близкое по значению стоит рядом",
    },
    body: {
      kk: "Реттелген тізімде сандар кішіден үлкенге қарай тұрады. Осыдан қарапайым, бірақ күшті салдар шығады: мәні бойынша ең жақын екі сан орны бойынша да көрші болады. Себебі қарапайым — ең жақын екі санның арасында үшінші сан тұра алмайды. Тұрса, ол екеуінің біріне одан да жақын болар еді, ал біз ең жақын жұпты алғанбыз. Сондықтан тізімді екі-екіден түгел салыстырудың орнына тек көрші жұптарды қарау жеткілікті.\n\nРеттеудің екі жолы бар. `sorted(a)` жаңа реттелген тізім қайтарады, ал `a.sort()` тізімнің өзін орнында қайта реттейді. Бұл екеуі — осы айда ғана ашылған құрал: қазан айында максимумды да, минимумды да циклмен өз қолыңмен жазғанбыз, енді дайын жол бар.\n\nРеттелген тізімнің ортасындағы сан медиана деп аталады. Элемент саны тақ болса, орта біреу. Жұп болса, орта екеу — сондықтан ереже керек. Осы сабақта біз бір ережені бекітеміз: n жұп болғанда екі ортаңғының кішісі алынады, яғни реттелгеннен кейінгі `(n - 1) // 2` индексіндегі сан. Тақ n үшін дәл сол формула да дұрыс жауап береді.",
      ru: "В отсортированном списке числа стоят от меньшего к большему. Отсюда следует простой, но сильный вывод: два ближайших по значению числа оказываются соседями и по месту. Причина простая — между двумя самыми близкими числами не может стоять третье. Если бы стояло, оно было бы ещё ближе к одному из них, а мы взяли самую близкую пару. Поэтому вместо перебора всех пар достаточно смотреть только соседние.\n\nСортировать можно двумя способами. `sorted(a)` возвращает новый отсортированный список, а `a.sort()` переставляет сам список на месте. Оба появились только в этом месяце: в октябре мы писали и максимум, и минимум циклом вручную, а теперь есть готовый способ.\n\nЧисло, стоящее посередине отсортированного списка, называется медианой. Если элементов нечётное количество, середина одна. Если чётное — середины две, и нужно правило. На этом уроке мы фиксируем одно правило: при чётном n берётся меньшее из двух средних, то есть число по индексу `(n - 1) // 2` после сортировки. Для нечётного n эта же формула даёт верный ответ.",
    },
    code: "a = [15, 4, 9, 22, 7]\nprint(sorted(a))\na.sort()\nprint(a)",
  },
  {
    /*
     * The month's own device, applied literally: «бір есептің екі шешімін
     * салыстыру». Both programs are on the card, both print 2, and the steps
     * count what each of them actually did. Showing only the fast one would
     * make "sorting buys speed" a claim the learner has to take on trust.
     *
     * The list is the same five numbers as b1, so the ordering they just
     * watched happen is the ordering being reasoned about. Comments in the code
     * are numerals, not words: a Russian-track learner must not meet Kazakh
     * inside a program.
     */
    id: "m4.l4.b2",
    type: "worked_example",
    skillRefs: ["sort.basic", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: ең кіші айырма — екі жолмен",
      ru: "Разобранный пример: наименьшая разность — двумя способами",
    },
    problem: {
      kk: "Тізім берілген: 15, 4, 9, 22, 7. Осы сандардың кез келген екеуінің арасындағы ең кіші айырманы тап. Айырма теріс емес деп саналады.",
      ru: "Дан список: 15, 4, 9, 22, 7. Найди наименьшую разность между любыми двумя из этих чисел. Разность считается неотрицательной.",
    },
    steps: [
      {
        kk: "Тікелей жол — барлық жұпты қарап шығу. Бірінші нұсқа дәл соны істейді: сыртқы цикл бірінші санды таңдайды, ішкі цикл одан кейінгілерін таңдайды, ал `abs` айырманы теріс емес етеді.",
        ru: "Прямой путь — перебрать все пары. Первый вариант делает именно это: внешний цикл выбирает первое число, внутренний — все следующие за ним, а `abs` делает разность неотрицательной.",
      },
      {
        kk: "Бес санда жұп саны бар болғаны 10. Бірақ жұптардың саны шамамен n·n/2 болып өседі: n = 2000 болса — екі миллионға жуық, n = 100000 болса — бес миллиард. Соңғысы бірнеше секундтық шектеуге ешқашан үлгермейді.",
        ru: "Для пяти чисел пар всего 10. Но количество пар растёт примерно как n·n/2: при n = 2000 это около двух миллионов, при n = 100000 — пять миллиардов. Последнее в ограничение в несколько секунд не уложится никогда.",
      },
      {
        kk: "Енді ойланайық. x пен y — ең жақын жұп болсын, x ≤ y. Олардың дәл арасында үшінші сан z тұра ала ма? Егер x < z < y болса, z − x айырмасы y − x-тен кіші болады, яғни x пен z одан да жақын жұп. Бұл қайшылық. Демек ең жақын жұптың арасында ешнәрсе жоқ.",
        ru: "Теперь подумаем. Пусть x и y — самая близкая пара, x ≤ y. Может ли строго между ними стоять третье число z? Если x < z < y, то разность z − x меньше, чем y − x, значит x и z — ещё более близкая пара. Противоречие. Выходит, между числами самой близкой пары нет ничего.",
      },
      {
        kk: "Арасында ешнәрсе болмаса, реттелген тізімде олар көрші тұрады. Сондықтан барлық жұпты емес, тек `len(a) - 1` көрші жұпты қарау жеткілікті — екінші нұсқа осылай жазылған.",
        ru: "Если между ними ничего нет, то в отсортированном списке они стоят рядом. Поэтому достаточно посмотреть не все пары, а только `len(a) - 1` соседних — так и написан второй вариант.",
      },
      {
        kk: "Реттелген тізімде `b[i + 1]` ешқашан `b[i]`-ден кіші болмайды, сондықтан айырма теріс шықпайды және `abs` мүлде керек емес. Ал `best` бірінші көрші жұптан басталады: нөлден бастасақ, жауап әрқашан нөл болып қалар еді.",
        ru: "В отсортированном списке `b[i + 1]` никогда не меньше `b[i]`, поэтому разность не бывает отрицательной и `abs` уже не нужен. А `best` начинается с первой соседней пары: если начать с нуля, ответ так нулём и останется.",
      },
    ],
    code: "a = [15, 4, 9, 22, 7]\n\n# 1\nbest = abs(a[1] - a[0])\nfor i in range(len(a)):\n    for j in range(i + 1, len(a)):\n        d = abs(a[j] - a[i])\n        if d < best:\n            best = d\nprint(best)\n\n# 2\nb = sorted(a)\nbest = b[1] - b[0]\nfor i in range(len(b) - 1):\n    d = b[i + 1] - b[i]\n    if d < best:\n        best = d\nprint(best)",
    result: {
      kk: "Екі нұсқа да 2 шығарады. Реттелген тізім: 4 7 9 15 22, ең кіші айырма 9 − 7 = 2. Бірақ бірінші нұсқа 10 жұпты, екіншісі бар болғаны 4 көрші жұпты қарады.",
      ru: "Оба варианта выводят 2. Отсортированный список: 4 7 9 15 22, наименьшая разность 9 − 7 = 2. Но первый вариант проверил 10 пар, а второй — всего 4 соседние.",
    },
  },
  {
    /*
     * No diagnosticMapping, and the reason is the same for all three
     * distractors. «4 4» comes either from forgetting the `- 1` or from
     * believing `//` rounds to the nearest whole number; «3 4» comes either
     * from swapping the two expressions or from plain carelessness in reading
     * order. Two causes each, so the engine should ask rather than tell.
     */
    id: "m4.l4.b3",
    type: "prediction",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізім алдымен реттеледі, содан кейін екі «орта» индекстегі сан қатар шығарылады. Тізімде 6 элемент бар. Бағдарлама нені шығарады?",
      ru: "Список сначала сортируется, затем рядом выводятся числа по двум «средним» индексам. В списке 6 элементов. Что выведет программа?",
    },
    code: "a = [3, 1, 4, 1, 5, 9]\na.sort()\nprint(a[len(a) // 2], a[(len(a) - 1) // 2])",
    answer: "4 3",
    options: ["4 3", "3 4", "4 4", "3 3"],
  },
  {
    id: "m4.l4.b4",
    type: "multiple_choice",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Реттелген тізімде 6 сан бар. Осы сабақтың ережесі: элемент саны жұп болғанда екі ортаңғының кішісі алынады. Медиана қай индексте тұр? Индекстер нөлден басталады.",
      ru: "В отсортированном списке 6 чисел. Правило этого урока: если количество элементов чётное, берётся меньшее из двух средних. По какому индексу стоит медиана? Индексы начинаются с нуля.",
    },
    options: [
      { id: "o1", label: { kk: "2, өйткені (6 - 1) // 2 = 2", ru: "2, потому что (6 - 1) // 2 = 2" } },
      { id: "o2", label: { kk: "3, өйткені 6 // 2 = 3", ru: "3, потому что 6 // 2 = 3" } },
      { id: "o3", label: { kk: "2 мен 3-тің ортасы, яғни 2.5", ru: "середина между 2 и 3, то есть 2.5" } },
      { id: "o4", label: { kk: "4, өйткені 6 // 2 + 1 = 4", ru: "4, потому что 6 // 2 + 1 = 4" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      /*
       * o2 is the only option whose label states its own reasoning AND lands on
       * the upper middle. Choosing it means the standard-looking formula was
       * applied without reading the rule in the statement — one cause, so the
       * attribution is safe. o3 and o4 are left unmapped: a non-integer index
       * and a `+ 1` can each come from several different confusions.
       */
      o2: {
        failureClass: "median_upper_middle_chosen",
        justification:
          "6 // 2 = 3 — бұл екі ортаңғының үлкені. Оны таңдау шарттағы «кішісін ал» ережесін оқымай, әдеттегі формуланы автоматты түрде қолданғанды көрсетеді.",
      },
    },
  },
  {
    /*
     * symptomInput is declared because the bug needs a whole EVEN-length list
     * to appear: on an odd-length list `len(b) // 2` and `(len(b) - 1) // 2`
     * are the same index, and the fallback probe feeds single numbers, on which
     * both programs print the same thing and the defect would read as
     * imaginary.
     *
     * No diagnosticMapping. Choosing line 2 could mean "I think `sorted` leaves
     * the list alone" or "I think it should have been `a.sort()`", and those
     * are different repairs to make.
     */
    id: "m4.l4.b5",
    type: "find_bug",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама медиананы табуы керек. Ереже: сандардың саны жұп болғанда екі ортаңғының кішісі алынады. Бірақ `8 2 5 1` енгізгенде ол 2 емес, 5 шығарады. Қай жол кінәлі және неге?",
      ru: "Программа должна находить медиану. Правило: если чисел чётное количество, берётся меньшее из двух средних. Но при вводе `8 2 5 1` она выводит 5 вместо 2. Какая строка виновата и почему?",
    },
    code: "def median(a):\n    b = sorted(a)\n    return b[len(b) // 2]\n\nnums = list(map(int, input().split()))\nprint(median(nums))",
    buggyLine: 3,
    symptomInput: "8 2 5 1",
    fixedCode:
      "def median(a):\n    b = sorted(a)\n    return b[(len(b) - 1) // 2]\n\nnums = list(map(int, input().split()))\nprint(median(nums))",
  },
  {
    /*
     * Four blanks, and each one is a decision the lesson actually made:
     * whether to order at all, where the neighbour walk has to stop, which
     * element is the neighbour, and which direction the comparison runs. The
     * example list is deliberately NOT b2's five numbers — the answer there was
     * already printed on the card.
     */
    id: "m4.l4.b6",
    type: "fill_blank",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген кемінде екі бүтін сан беріледі. Кез келген екі санның арасындағы ең кіші айырманы шығаратындай толықтыр. Тізімді реттеп, тек көрші жұптарды қара. Мысалы `12 3 7 20` үшін жауап 4.",
      ru: "В одной строке через пробел даны не меньше двух целых чисел. Дополни программу так, чтобы она вывела наименьшую разность между любыми двумя из них. Отсортируй список и смотри только соседние пары. Например, для `12 3 7 20` ответ 4.",
    },
    template:
      "a = list(map(int, input().split()))\na.___()\nbest = a[1] - a[0]\nfor i in range(___):\n    d = a[___] - a[i]\n    if d ___ best:\n        best = d\nprint(best)",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "len(a) - 1", alternatives: ["len(a)-1"] },
      { id: "f3", answer: "i + 1", alternatives: ["i+1"] },
      { id: "f4", answer: "<" },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m4.l4.b7, not an extra block beside it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same statement, same input format, same rule — the three blanks
     * are the ordering and the two halves of the index formula, which is
     * exactly what the lesson claims to teach. Nothing on a nearby card
     * contains this program: b5's median is a function over one line of input.
     */
    id: "m4.l4.b7s",
    type: "fill_blank",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны — сандардың саны, екінші жолда бос орынмен бөлінген n бүтін сан беріледі. Медиананы шығаратындай толықтыр. Ереже: n жұп болса, екі ортаңғының кішісі алынады. Мысалы `4` және `8 2 5 1` үшін жауап 2.",
      ru: "В первой строке дано число n — количество чисел, во второй строке через пробел даны n целых чисел. Дополни программу так, чтобы она вывела медиану. Правило: при чётном n берётся меньшее из двух средних. Например, для `4` и `8 2 5 1` ответ 2.",
    },
    template: "n = int(input())\na = list(map(int, input().split()))\na.___()\nm = (n ___ 1) ___ 2\nprint(a[m])",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "-" },
      { id: "f3", answer: "//" },
    ],
  },
  {
    /*
     * «медиананы табу», PDF p.8. The cases are chosen against named wrong
     * solutions rather than for coverage:
     *   n // 2 instead of (n - 1) // 2 — dies on 4, 2, 6 and 8 element cases;
     *   no sorting at all              — dies on «9 1 2 3 4», which prints 2;
     *   a[n // 2 - 1] (also "lower")   — dies on every odd case, e.g. n = 5;
     *   crash on a single element      — dies on n = 1.
     * The all-equal and repeated-value cases are there because the objective
     * says «қайталанатын мәндерді дұрыс өңдеу»: a solution that tries to skip
     * duplicates before finding the middle gets a different answer on
     * «5 1 5 1 5 1».
     */
    id: "m4.l4.b7",
    type: "write_code",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі — сандардың саны (n ≥ 1). Екінші жолда бос орынмен бөлінген n бүтін сан беріледі. Медиананы шығар. Медиана — реттелген тізімнің ортасындағы сан. n тақ болса, орта біреу. n жұп болса, екі ортаңғының кішісін ал, яғни реттеуден кейінгі `(n - 1) // 2` индексіндегі санды. Мысалы n = 4, сандар `8 2 5 1` болса, жауап 2; n = 5, сандар `7 1 9 3 5` болса, жауап 5.",
      ru: "В первой строке дано число n — количество чисел (n ≥ 1). Во второй строке через пробел даны n целых чисел. Выведи медиану. Медиана — число в середине отсортированного списка. Если n нечётное, середина одна. Если n чётное, бери меньшее из двух средних, то есть число по индексу `(n - 1) // 2` после сортировки. Например, при n = 4 и числах `8 2 5 1` ответ 2; при n = 5 и числах `7 1 9 3 5` ответ 5.",
    },
    referenceSolution: "n = int(input())\na = list(map(int, input().split()))\na.sort()\nprint(a[(n - 1) // 2])",
    cases: [
      { input: "5\n7 1 9 3 5", expectedOutput: "5" },
      { input: "4\n8 2 5 1", expectedOutput: "2" },
      { input: "1\n42", expectedOutput: "42", hidden: true },
      { input: "2\n9 4", expectedOutput: "4", hidden: true },
      { input: "5\n6 6 6 6 6", expectedOutput: "6", hidden: true },
      { input: "6\n5 1 5 1 5 1", expectedOutput: "1", hidden: true },
      { input: "5\n9 1 2 3 4", expectedOutput: "3", hidden: true },
      { input: "4\n-3 -10 0 -1", expectedOutput: "-3", hidden: true },
      { input: "8\n2 2 3 3 4 4 5 5", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The lesson's independent task, and it is not b6 with a different input
     * format: the second number asks for the LARGEST difference, which after
     * sorting is `a[n - 1] - a[0]` and needs no loop at all. So the learner has
     * to use both things ordering gave them — the neighbours in the middle and
     * the two ends — in one program.
     *
     * The cases hunt specific mutants:
     *   forgot to sort            → «5 1 6 2» answers 4 instead of 1;
     *   range(len(a) - 2)         → «1 10 20 21» misses the last pair, gives 9;
     *   best assigned inside loop → «1 2 20 30» reports the last gap, 10;
     *   best = 0 initially        → «5 3» reports 0 instead of 2;
     *   abs() forgotten on ends   → the negative case «-5 -1 -9 3 0».
     * All-equal gives «0 0», which is also the check that a zero difference is
     * a legal answer and not a signal to skip repeated values.
     */
    id: "m4.l4.b8",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (n ≥ 2). Екінші жолда бос орынмен бөлінген n бүтін сан беріледі. Бір жолға бос орынмен бөліп екі санды шығар: алдымен кез келген екі санның арасындағы ең кіші айырманы, содан кейін ең үлкен айырманы. Айырма әрқашан теріс емес деп саналады. Сандар қайталануы мүмкін — ондайда ең кіші айырма 0 болады. Мысалы n = 5, сандар `3 1 4 1 5` болса, жауап `0 4`.",
      ru: "В первой строке дано число n (n ≥ 2). Во второй строке через пробел даны n целых чисел. Выведи в одну строку через пробел два числа: сначала наименьшую разность между любыми двумя из них, затем наибольшую. Разность всегда считается неотрицательной. Числа могут повторяться — тогда наименьшая разность равна 0. Например, при n = 5 и числах `3 1 4 1 5` ответ `0 4`.",
    },
    referenceSolution:
      "n = int(input())\na = list(map(int, input().split()))\na.sort()\nbest = a[1] - a[0]\nfor i in range(len(a) - 1):\n    d = a[i + 1] - a[i]\n    if d < best:\n        best = d\nprint(best, a[n - 1] - a[0])",
    cases: [
      { input: "5\n3 1 4 1 5", expectedOutput: "0 4" },
      { input: "2\n5 3", expectedOutput: "2 2" },
      { input: "4\n10 20 30 40", expectedOutput: "10 30", hidden: true },
      { input: "4\n40 30 20 10", expectedOutput: "10 30", hidden: true },
      { input: "3\n7 7 7", expectedOutput: "0 0", hidden: true },
      { input: "5\n-5 -1 -9 3 0", expectedOutput: "1 12", hidden: true },
      { input: "4\n5 1 6 2", expectedOutput: "1 5", hidden: true },
      { input: "4\n1 10 20 21", expectedOutput: "1 20", hidden: true },
      { input: "4\n1 2 20 30", expectedOutput: "1 29", hidden: true },
      { input: "6\n100 1 50 2 99 51", expectedOutput: "1 99", hidden: true },
    ],
  },
];
