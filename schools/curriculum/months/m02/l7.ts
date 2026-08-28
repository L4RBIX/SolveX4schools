import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан · Lesson 7 — «Цикл ішіндегі цикл» / «Цикл внутри цикла». 9 min.
 *
 * PDF p.7 puts «қарапайым ішкі циклдерді оқу және жазу» in October's mastery
 * paragraph and names two of this lesson's tasks in the practice list by their
 * own words: «көбейту кестесі» and «символдардан өрнек». Both are written here.
 *
 * ## The one idea
 *
 * The inner loop finishes ALL of its steps for every single step of the outer
 * one, and then starts over from its first value. Everything else in the lesson
 * is a consequence of that sentence: the step count is a product and not a sum,
 * the accumulator that builds one line has to be reset inside the outer loop,
 * and the inner bound is allowed to depend on the outer variable.
 *
 * So the lesson attacks it four times before anybody writes a table: a
 * prediction whose distractors are exactly "the inner counter kept counting"
 * and "the last line escaped the loop", a multiple choice whose wrong answers
 * are n+m and n², a hand trace where `j` visibly falls back to 1 when `i`
 * becomes 2, and a fill-blank in which the middle blank is the reset itself.
 *
 * ## Why these two tasks carry `{ kind: "exact" }`
 *
 * `token` is the default everywhere in this course and it is the right default:
 * a learner should not be marked wrong for a space nobody asked about. These
 * two tasks are the documented exception — the layout IS the answer. A
 * multiplication table whose columns are compared token-wise is not a table any
 * more, it is n² numbers in some order, and a triangle checked token-wise
 * passes for a single line of asterisks. So the checker is `exact`, and the
 * price of that is paid in the prompts: both languages state the separator, the
 * number of lines, and that a line must not end in a space, and each prompt
 * carries a picture of the answer for one n.
 *
 * The trailing-space decision, made once and applied to every case in the file:
 * **no line ever ends in a space.** The table's separator sits BETWEEN numbers
 * (`" ".join`, not `str(x) + " "` per number), the right triangle contains no
 * spaces at all, and the pyramid's spaces are all leading. A learner who
 * appends a separator after every element gets a visible failure on the very
 * first sample rather than a hidden one.
 *
 * ## What is deliberately not here
 *
 * `"*" * i` would draw the triangle in one line, and `str` × `int` is September
 * Python, so it is legal. It is not taught here, and it is not needed: the
 * reference solutions build every line with an inner loop, because the inner
 * loop is the subject. A learner who discovers the multiplication trick on
 * their own still passes — the cases judge the output, not the route.
 */
export const M2_L7: LessonBlock[] = [
  {
    id: "m2.l7.b1",
    type: "concept",
    skillRefs: ["loops.nested", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Цикл ішіндегі цикл",
      ru: "Цикл внутри цикла",
    },
    /* The body has to answer two questions, not one: what order the steps
       happen in, and why the total is a product. The second is stated as
       something countable — "the outer loop runs the inner one from the
       beginning every time" — so a learner can check it by counting the lines
       the sample prints instead of memorising a formula. */
    body: {
      kk: "Циклдің денесіне тағы бір цикл жазуға болады. Сыртқы цикл бір ғана қадам жасағанда, ішкі цикл өзінің БАРЛЫҚ қадамын басынан аяғына дейін орындап шығады; сыртқы цикл келесі қадамға содан кейін ғана көшеді. Ең бастысы — сол келесі қадамда ішкі цикл қайтадан ең басынан жүреді: `j` тоқтаған жерінен емес, бастапқы мәнінен қайта санала бастайды. Сондықтан ішкі дене барлығы «сыртқы қадам саны × ішкі қадам саны» рет орындалады: төмендегі мысалда 2 × 3 = 6 рет.",
      ru: "В тело цикла можно написать ещё один цикл. Пока внешний цикл делает всего один шаг, внутренний успевает пройти ВСЕ свои шаги от начала до конца; только после этого внешний переходит к следующему шагу. И самое главное — на этом следующем шаге внутренний цикл идёт заново с самого начала: `j` отсчитывается не с того места, где остановился, а снова с начального значения. Поэтому внутреннее тело выполняется всего «число шагов внешнего × число шагов внутреннего» раз: в примере ниже 2 × 3 = 6 раз.",
    },
    code:
      "for i in range(1, 3):\n" +
      "    for j in range(1, 4):\n" +
      "        print(i, j)\n" +
      "\n" +
      "# 1 1 | 1 2 | 1 3 | 2 1 | 2 2 | 2 3",
  },
  {
    /*
     * `print("end")` sits inside the outer loop and outside the inner one — the
     * only indentation level a nested loop adds that a learner has never had to
     * read before. The options are the three programs a beginner actually
     * believes they are looking at, and two of them have a single cause each.
     *
     * "1\n2\nend" is left unmapped on purpose: it comes from ignoring the outer
     * loop entirely AND from believing `range(1, 3)` makes one pass, and those
     * are different misunderstandings. The contract's rule is that an ambiguous
     * answer gets no mapping, so the engine asks rather than tells.
     */
    id: "m2.l7.b2",
    type: "prediction",
    skillRefs: ["loops.nested", "loops.for", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама нені шығарады? `print(\"end\")` сыртқы циклдің ішінде, бірақ ішкі циклдің сыртында тұрғанына назар аудар. Әр шыққан мән жеке жолда.",
      ru: "Что выведет программа? Обрати внимание: `print(\"end\")` стоит внутри внешнего цикла, но снаружи внутреннего. Каждое выведенное значение — на отдельной строке.",
    },
    code:
      "for i in range(1, 3):\n" +
      "    for j in range(1, 3):\n" +
      "        print(j)\n" +
      '    print("end")',
    answer: "1\n2\nend\n1\n2\nend",
    options: ["1\n2\nend\n1\n2\nend", "1\n2\nend\n3\n4\nend", "1\n2\n1\n2\nend", "1\n2\nend"],
    diagnosticMapping: {
      "1\n2\nend\n3\n4\nend": {
        failureClass: "inner_counter_not_restarted",
        justification:
          "3 пен 4 санының шығуының жалғыз жолы бар: `j` сыртқы циклдің екінші қадамында тоқтаған жерінен әрі қарай санайды деп ойлау. Шын мәнінде `for j in range(1, 3)` әр рет қайта басталады, сондықтан `j` тағы да 1-ден 2-ге дейін жүреді.",
      },
      "1\n2\n1\n2\nend": {
        failureClass: "loop_body_membership_misread",
        justification:
          "`end` сөзінің бір-ақ рет шығуы — `print(\"end\")` жолын екі циклдің де сыртында тұр деп оқығанда ғана болады. Оның шегінісі сыртқы циклдің денесіне тиесілі екенін көрсетеді, сондықтан ол әр `i` үшін бір реттен, барлығы екі рет орындалады.",
      },
    },
  },
  {
    id: "m2.l7.b3",
    type: "multiple_choice",
    skillRefs: ["loops.nested", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Осы бағдарламада `print` барлығы неше рет орындалады?",
      ru: "Сколько раз всего выполнится `print` в этой программе?",
    },
    code: "for i in range(4):\n    for j in range(6):\n        print(i, j)",
    options: [
      { id: "o1", label: { kk: "10 рет", ru: "10 раз" } },
      { id: "o2", label: { kk: "16 рет", ru: "16 раз" } },
      { id: "o3", label: { kk: "24 рет", ru: "24 раза" } },
      { id: "o4", label: { kk: "6 рет", ru: "6 раз" } },
    ],
    correctOptionId: "o3",
    /* o4 (6) carries no mapping. It is reached by "only the inner loop prints"
       and by "the outer loop repeats the same six lines, so they still count
       once" — two different beliefs about what repetition means, and naming one
       of them would be a guess about a fourteen-year-old's reasoning. */
    diagnosticMapping: {
      o1: {
        failureClass: "nested_steps_added_not_multiplied",
        justification:
          "10 — бұл 4 + 6. Оны таңдаудың жалғыз себебі бар: қадамдарды қосу керек деп ойлау. Ал сыртқы циклдің әр қадамында ішкі цикл толық алты рет жүреді, сондықтан қадамдар қосылмайды, көбейтіледі.",
      },
      o2: {
        failureClass: "inner_bound_taken_from_outer",
        justification:
          "16 — бұл 4 × 4. Демек көбейту дұрыс табылған, бірақ ішкі циклдің шекарасы ретінде сыртқы циклдің саны алынған. Ішкі цикл `range(6)` бойынша жүреді, сондықтан жауап 4 × 6 болуы керек.",
      },
    },
  },
  {
    id: "m2.l7.b4",
    type: "trace_code",
    skillRefs: ["loops.nested", "loops.counter"],
    /* «Басты құрал - бағдарламаның қадамдық орындалуы: әр қадамда цикл
       айнымалысының ... мәні көрсетіледі» (p.7). The hand trace is the
       programme's instrument for October, and this is the row it exists for:
       between step 3 and step 4 the learner writes `j = 1` again while `i`
       moves from 1 to 2. */
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Ішкі циклдің денесі әр рет орындалып болғаннан кейін `i`, `j` және `c` мәндерін жаз. `i` 1-ден 2-ге ауысқан сәтте `j`-мен не болатынына ерекше көңіл бөл. Кестенің ең соңғы қатары — циклдерден кейінгі `print`.",
      ru: "После каждого прохода тела внутреннего цикла запиши значения `i`, `j` и `c`. Особенно внимательно посмотри, что происходит с `j` в тот момент, когда `i` меняется с 1 на 2. Последняя строка таблицы — это `print` уже после циклов.",
    },
    code:
      "c = 0\n" +
      "for i in range(1, 3):\n" +
      "    for j in range(1, 4):\n" +
      "        c = c + 1\n" +
      "print(c)",
    /* One row per pass of the inner body (6 of them, which is the answer to
       b3 in miniature), plus the line after the loops. Rows for lines 2 and 3
       would triple the table and bury the only thing worth seeing. */
    steps: [
      { line: 1, vars: { c: "0" } },
      { line: 4, vars: { i: "1", j: "1", c: "1" } },
      { line: 4, vars: { i: "1", j: "2", c: "2" } },
      { line: 4, vars: { i: "1", j: "3", c: "3" } },
      { line: 4, vars: { i: "2", j: "1", c: "4" } },
      { line: 4, vars: { i: "2", j: "2", c: "5" } },
      { line: 4, vars: { i: "2", j: "3", c: "6" } },
      { line: 5, vars: { i: "2", j: "3", c: "6" } },
    ],
  },
  {
    /*
     * The trainer the month's explanation paragraph asks for, pointed at the
     * one moment that matters here rather than at the loop in general: the
     * inner counter falling back to its first value. Not an attempt block —
     * watching the restart happen is not evidence that the learner expected it,
     * and b2 and b4 are where that evidence is actually collected.
     */
    id: "m2.l7.b5",
    type: "visual_simulation",
    skillRefs: ["loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    simulation: "loop_trace",
    prompt: {
      kk: "Екі санағышты қатар қадамдап көр. Жоғарғы жол — сыртқы `i`, төменгі жол — ішкі `j`. `i` бір қадам жасағанша, `j` үш қадамын түгел жүріп өтеді, содан кейін қайтадан 1-ге түседі. Тоқтамай санап отыр: ішкі дене барлығы неше рет жанады?",
      ru: "Прошагай два счётчика одновременно. Верхняя строка — внешний `i`, нижняя — внутренний `j`. Пока `i` делает один шаг, `j` успевает пройти все свои три шага, а потом снова падает до 1. Считай не останавливаясь: сколько раз всего загорится внутреннее тело?",
    },
    config: {
      outer: { name: "i", values: [1, 2] },
      inner: { name: "j", values: [1, 2, 3] },
      highlight: "inner_restart",
      showStepCount: true,
    },
  },
  {
    /*
     * The middle blank is the lesson, not the bounds: `line = ""` has to be
     * INSIDE the outer loop and BEFORE the inner one, because each row is a
     * fresh accumulator. Left outside, every row would carry the previous rows
     * with it — the October typical error «жинақтаушы айнымалыға қате бастапқы
     * мән беру» (p.7) in its nested form.
     *
     * The bounds here are independent of each other on purpose. The inner bound
     * that DEPENDS on the outer variable is the next step up and arrives at b8;
     * meeting both in one block would blur which of the two ideas failed.
     */
    id: "m2.l7.b6",
    type: "fill_blank",
    skillRefs: ["loops.nested", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген n мен m беріледі. Бағдарлама жұлдызшадан тіктөртбұрыш салуы керек: барлығы n жол, әр жолда дәл m жұлдызша. Үш орынды толтыр: сыртқы цикл нешеу жол жасайды, әр жол неден басталады және ішкі цикл нешеу жұлдызша қосады?",
      ru: "В одной строке через пробел даны n и m. Программа должна нарисовать прямоугольник из звёздочек: всего n строк, в каждой ровно m звёздочек. Заполни три места: сколько строк делает внешний цикл, с чего начинается каждая строка и сколько звёздочек добавляет внутренний цикл?",
    },
    template:
      "n, m = map(int, input().split())\n" +
      "for i in range(___):\n" +
      "    line = ___\n" +
      "    for j in range(___):\n" +
      '        line = line + "*"\n' +
      "    print(line)",
    blanks: [
      { id: "f1", answer: "n" },
      { id: "f2", answer: '""', alternatives: ["''"] },
      { id: "f3", answer: "m" },
    ],
  },
  {
    id: "m2.l7.b7",
    type: "write_code",
    skillRefs: ["loops.nested", "loops.for", "loops.accumulator"],
    /* Named verbatim in October's practice paragraph: «көбейту кестесі». */
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The layout IS the answer, so the comparison is byte-for-byte and the
       prompt owes the learner every byte of it: how many lines, what goes on
       each, one space between neighbours, nothing after the last number. */
    checker: { kind: "exact" },
    prompt: {
      kk:
        "Бір бүтін сан n беріледі (1 ≤ n ≤ 9). n × n көбейту кестесін шығар.\n" +
        "Кестеде дәл n жол болады. i-ші жолда i × 1, i × 2, …, i × n көбейтінділері тұрады.\n" +
        "Бір жолдағы көрші сандар ДӘЛ БІР бос орынмен бөлінеді. Жолдың соңында бос орын БОЛМАЙДЫ, кестенің алдында да, соңында да бос жол болмайды.\n" +
        "n = 3 болғанда дәл былай шығуы керек:\n" +
        "1 2 3\n" +
        "2 4 6\n" +
        "3 6 9",
      ru:
        "Дано целое число n (1 ≤ n ≤ 9). Выведи таблицу умножения n × n.\n" +
        "В таблице ровно n строк. В i-й строке стоят произведения i × 1, i × 2, …, i × n.\n" +
        "Соседние числа в строке разделяются РОВНО ОДНИМ пробелом. В конце строки пробела НЕТ, пустых строк ни до таблицы, ни после неё тоже нет.\n" +
        "При n = 3 должно вывестись в точности так:\n" +
        "1 2 3\n" +
        "2 4 6\n" +
        "3 6 9",
    },
    /* `row = []` inside the outer loop is the same reset as b6's `line = ""`,
       and `" ".join` is what puts the separator BETWEEN the numbers instead of
       after each of them — which is exactly how the trailing space this task
       forbids gets in. */
    referenceSolution:
      "n = int(input())\n" +
      "for i in range(1, n + 1):\n" +
      "    row = []\n" +
      "    for j in range(1, n + 1):\n" +
      "        row.append(str(i * j))\n" +
      '    print(" ".join(row))',
    /* n = 3 is the picture in the prompt, so the two commonest wrecks surface
       where the learner can see them: `range(1, n)` on either loop drops the
       third column or the third row, and a `row = []` hoisted above the outer
       loop prints "1 2 3 2 4 6" on line two. n = 1 is the whole trailing-space
       question in one byte — a solution that appends " " after every number
       fails it and nothing else. n = 9 is the top of the stated bound and the
       only case where a two-digit product meets a two-digit product, so an
       author's assumption about column width would die here. */
    cases: [
      { input: "3", expectedOutput: "1 2 3\n2 4 6\n3 6 9" },
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "1 2\n2 4", hidden: true },
      {
        input: "4",
        expectedOutput: "1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16",
        hidden: true,
      },
      {
        input: "5",
        expectedOutput:
          "1 2 3 4 5\n2 4 6 8 10\n3 6 9 12 15\n4 8 12 16 20\n5 10 15 20 25",
        hidden: true,
      },
      {
        input: "9",
        expectedOutput:
          "1 2 3 4 5 6 7 8 9\n" +
          "2 4 6 8 10 12 14 16 18\n" +
          "3 6 9 12 15 18 21 24 27\n" +
          "4 8 12 16 20 24 28 32 36\n" +
          "5 10 15 20 25 30 35 40 45\n" +
          "6 12 18 24 30 36 42 48 54\n" +
          "7 14 21 28 35 42 49 56 63\n" +
          "8 16 24 32 40 48 56 64 72\n" +
          "9 18 27 36 45 54 63 72 81",
        hidden: true,
      },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m2.l7.b8 — the same triangle, assembled instead
     * of written from a blank editor. «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6).
     *
     * Two decisions carry the whole task, and neither is given away by the
     * indentation: whether `line = ""` comes before or after the inner `for`,
     * and whether `print(line)` belongs to the outer loop or to the inner one.
     * The dependent bound `range(i)` is handed over ready-made, because for
     * this route it is the thing to be read rather than invented.
     */
    id: "m2.l7.b8s",
    type: "reorder_code",
    skillRefs: ["loops.nested", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk:
        "Жолдарды дұрыс ретке қой. Бағдарлама n оқып, жұлдызшадан тік бұрышты үшбұрыш салуы керек: барлығы n жол, i-ші жолда дәл i жұлдызша.\n" +
        "n = 3 болғанда былай шығады:\n" +
        "*\n" +
        "**\n" +
        "***",
      ru:
        "Расставь строки по порядку. Программа должна прочитать n и нарисовать прямоугольный треугольник из звёздочек: всего n строк, в i-й строке ровно i звёздочек.\n" +
        "При n = 3 выводится так:\n" +
        "*\n" +
        "**\n" +
        "***",
    },
    lines: [
      { id: "t1", code: "n = int(input())" },
      { id: "t2", code: "for i in range(1, n + 1):" },
      { id: "t3", code: '    line = ""' },
      { id: "t4", code: "    for j in range(i):" },
      { id: "t5", code: '        line = line + "*"' },
      { id: "t6", code: "    print(line)" },
    ],
    correctOrder: ["t1", "t2", "t3", "t4", "t5", "t6"],
  },
  {
    id: "m2.l7.b8",
    type: "write_code",
    skillRefs: ["loops.nested", "loops.for", "loops.accumulator"],
    /* Named verbatim in October's practice paragraph: «символдардан өрнек». */
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    checker: { kind: "exact" },
    prompt: {
      kk:
        "Бір бүтін сан n беріледі (1 ≤ n ≤ 20). Жұлдызшадан тік бұрышты үшбұрыш сал.\n" +
        "Барлығы дәл n жол болады. i-ші жолда дәл i жұлдызша (`*`) тұрады, олардың арасында да, жолдың соңында да бос орын жоқ.\n" +
        "n = 3 болғанда дәл былай шығуы керек:\n" +
        "*\n" +
        "**\n" +
        "***",
      ru:
        "Дано целое число n (1 ≤ n ≤ 20). Нарисуй прямоугольный треугольник из звёздочек.\n" +
        "Всего должно быть ровно n строк. В i-й строке ровно i звёздочек (`*`), пробелов нет ни между ними, ни в конце строки.\n" +
        "При n = 3 должно вывестись в точности так:\n" +
        "*\n" +
        "**\n" +
        "***",
    },
    /* The inner bound depends on the outer variable — the step up from b6, and
       the reason this problem is worth setting at all. */
    referenceSolution:
      "n = int(input())\n" +
      "for i in range(1, n + 1):\n" +
      '    line = ""\n' +
      "    for j in range(i):\n" +
      '        line = line + "*"\n' +
      "    print(line)",
    /* n = 1 kills a fixed inner bound copied from n: `range(n)` inside would
       coincidentally pass n = 1 but fail n = 3, and `range(i)` written as
       `range(i + 1)` fails n = 1 immediately with "**". n = 2 is the smallest
       case where two different row lengths exist at all, so a solution that
       forgets to reset `line` first goes wrong there ("*", "***"). n = 20 is
       the top of the stated bound. */
    cases: [
      { input: "3", expectedOutput: "*\n**\n***" },
      { input: "1", expectedOutput: "*" },
      { input: "2", expectedOutput: "*\n**", hidden: true },
      { input: "5", expectedOutput: "*\n**\n***\n****\n*****", hidden: true },
      {
        input: "20",
        expectedOutput:
          "*\n**\n***\n****\n*****\n******\n*******\n********\n*********\n**********\n" +
          "***********\n************\n*************\n**************\n***************\n" +
          "****************\n*****************\n******************\n*******************\n" +
          "********************",
        hidden: true,
      },
    ],
  },
  {
    /*
     * ADVANCED ONLY. «Негізгі есептерді жедел қарқынмен өтіп, күрделі есептер
     * блогына көшу» (p.6) — this is that block for lesson 7.
     *
     * Two inner loops inside one outer loop, and neither bound is readable off
     * the picture: the spaces are n − i and the stars are 2i − 1, and both have
     * to be derived from a statement that describes the shape rather than the
     * formula. The prompt is precise enough to determine every byte — the
     * bottom row's length, where it starts, and how each row above differs —
     * without handing over the arithmetic that is the point of the task.
     *
     * Leading spaces are load-bearing here, which is the strongest form of the
     * exact-output lesson the two tasks above began, and the reason n = 1 is a
     * visible case: it is the row with zero spaces and one star, where every
     * off-by-one in either formula shows up at once.
     */
    id: "m2.l7.b9",
    type: "write_code",
    skillRefs: ["loops.nested", "loops.for", "loops.accumulator", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["advanced"],
    checker: { kind: "exact" },
    prompt: {
      kk:
        "Бір бүтін сан n беріледі (1 ≤ n ≤ 20). Жұлдызшадан ортасына теңестірілген үшбұрыш сал.\n" +
        "Барлығы дәл n жол болады. Ең төменгі жолда 2 × n − 1 жұлдызша тұрады және ол сол шеттен, бос орынсыз басталады. Одан жоғарғы әрбір жол алдыңғысымен салыстырғанда бір бос орынға оңға жылжиды және екі жұлдызша кем болады.\n" +
        "Бос орындар тек жұлдызшалардың АЛДЫНДА тұрады: жолдың соңында бос орын болмауы керек.\n" +
        "n = 4 болғанда дәл былай шығуы керек:\n" +
        "   *\n" +
        "  ***\n" +
        " *****\n" +
        "*******",
      ru:
        "Дано целое число n (1 ≤ n ≤ 20). Нарисуй треугольник из звёздочек, выровненный по центру.\n" +
        "Всего должно быть ровно n строк. В самой нижней строке стоят 2 × n − 1 звёздочек, и она начинается от левого края, без пробелов. Каждая следующая строка вверх сдвинута на один пробел вправо и содержит на две звёздочки меньше предыдущей.\n" +
        "Пробелы стоят только ПЕРЕД звёздочками: в конце строки пробела быть не должно.\n" +
        "При n = 4 должно вывестись в точности так:\n" +
        "   *\n" +
        "  ***\n" +
        " *****\n" +
        "*******",
    },
    referenceSolution:
      "n = int(input())\n" +
      "for i in range(1, n + 1):\n" +
      '    line = ""\n' +
      "    for j in range(n - i):\n" +
      '        line = line + " "\n' +
      "    for j in range(2 * i - 1):\n" +
      '        line = line + "*"\n' +
      "    print(line)",
    /* n = 1 is one star and nothing else: it fails any solution that writes
       `2 * i` or `n - i + 1`. n = 2 is the smallest case with an actual
       indent, so a solution that indents by i instead of n − i inverts the
       triangle and dies there. n = 3 and n = 5 are odd, n = 4 even, which
       catches a stray `// 2` in the space count. n = 20 is the stated bound. */
    cases: [
      { input: "4", expectedOutput: "   *\n  ***\n *****\n*******" },
      { input: "1", expectedOutput: "*" },
      { input: "2", expectedOutput: " *\n***", hidden: true },
      { input: "3", expectedOutput: "  *\n ***\n*****", hidden: true },
      {
        input: "5",
        expectedOutput: "    *\n   ***\n  *****\n *******\n*********",
        hidden: true,
      },
      {
        input: "20",
        expectedOutput:
          "                   *\n" +
          "                  ***\n" +
          "                 *****\n" +
          "                *******\n" +
          "               *********\n" +
          "              ***********\n" +
          "             *************\n" +
          "            ***************\n" +
          "           *****************\n" +
          "          *******************\n" +
          "         *********************\n" +
          "        ***********************\n" +
          "       *************************\n" +
          "      ***************************\n" +
          "     *****************************\n" +
          "    *******************************\n" +
          "   *********************************\n" +
          "  ***********************************\n" +
          " *************************************\n" +
          "***************************************",
        hidden: true,
      },
    ],
  },
];
