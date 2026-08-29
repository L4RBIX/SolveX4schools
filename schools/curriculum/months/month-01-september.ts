import type { Month, Lesson, LessonBlock } from "../types";

/**
 * Month 1 · Қыркүйек — reading data, computing, conditions.
 *
 * PDF p.7. This is the only month authored to `published` for the pilot's
 * first term; months 2–9 carry their full structure but their lesson bodies
 * are `draft` until authored and reviewed. That difference is visible in the
 * validator output and in the teacher console — it is not hidden.
 *
 * The PDF promises 36 tasks this month. Every attempt-bearing block below
 * counts toward that figure and `npm run curriculum:validate` reports the
 * real total, never the promised one.
 */

const P = 7; // PDF page for all of September

/* -------------------------------------------------------------------------- */
/* Unit 1 — Кіріс және шығыс                                                   */
/* -------------------------------------------------------------------------- */

const l1Blocks: LessonBlock[] = [
  {
    id: "m1.l1.b1",
    type: "concept",
    skillRefs: ["io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Бағдарлама — бұл нұсқаулар тізбегі",
      ru: "Программа — это последовательность инструкций",
    },
    body: {
      kk: "Компьютер жазылған жолдарды жоғарыдан төменге қарай, бірінен соң бірін орындайды. `print` командасы жақшаның ішіндегіні экранға шығарады.",
      ru: "Компьютер выполняет написанные строки сверху вниз, одну за другой. Команда `print` выводит на экран то, что стоит в скобках.",
    },
    code: 'print("Сәлем!")\nprint(2 + 2)',
  },
  {
    id: "m1.l1.b2",
    type: "prediction",
    skillRefs: ["io.print"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа?",
    },
    code: 'print("2 + 2")',
    answer: "2 + 2",
    options: ["4", "2 + 2", '"2 + 2"'],
    diagnosticMapping: {
      // Choosing 4 means the learner did not see the quotes — that is the only
      // way to arrive at 4 here, so the attribution is unambiguous.
      "4": {
        failureClass: "string_vs_number_confusion",
        justification:
          "Тырнақшаның ішіндегі өрнек есептелмейді. 4 деген жауап тек тырнақшаны байқамағанда шығады.",
      },
    },
  },
  {
    id: "m1.l1.b3",
    type: "concept",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Деректерді оқу", ru: "Чтение данных" },
    body: {
      kk: "`input()` пернетақтадан бір жолды оқиды, бірақ ол әрқашан мәтін. Санмен жұмыс істеу үшін `int()` арқылы бүтін санға айналдыру керек.",
      ru: "`input()` читает строку с клавиатуры, но это всегда текст. Чтобы работать с числом, нужно преобразовать его через `int()`.",
    },
    code: "n = int(input())\nprint(n * 2)",
  },
  {
    id: "m1.l1.b4",
    type: "find_bug",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама 5 енгізгенде 10 емес, 55 шығарады. Қай жол кінәлі?",
      ru: "При вводе 5 программа выводит 55 вместо 10. Какая строка виновата?",
    },
    code: "n = input()\nprint(n * 2)",
    buggyLine: 1,
    symptomInput: "5",
    fixedCode: "n = int(input())\nprint(n * 2)",
    diagnosticMapping: {
      "2": {
        failureClass: "string_vs_number_confusion",
        justification:
          "Екінші жолды таңдау — көбейту дұрыс емес деп ойлау. Шын себебі бірінші жолда: `n` мәтін болып қалған, ал мәтінді 2-ге көбейту оны қайталайды.",
      },
    },
  },
  {
    id: "m1.l1.b4a",
    type: "worked_example",
    skillRefs: ["io.read", "types.int_float", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: оқу, айналдыру, есептеу", ru: "Разобранный пример: прочитать, преобразовать, посчитать" },
    problem: {
      kk: "Оқушының жасы беріледі. Ол 10 жылдан кейін неше жаста болатынын шығар. Мысалы 14 берілсе, жауап 24.",
      ru: "Дан возраст ученика. Выведи, сколько ему будет через 10 лет. Например, при вводе 14 ответ 24.",
    },
    steps: [
      {
        kk: "`input()` пернетақтадан жолды оқиды. Бірақ ол — мәтін: біз 14 деп енгізсек те, компьютер оны «14» деген екі таңба деп көреді.",
        ru: "`input()` читает строку с клавиатуры. Но это текст: мы ввели 14, а компьютер видит «14» как два символа.",
      },
      {
        kk: "Мәтінге 10 қосуға болмайды. Сондықтан `int()` арқылы санға айналдырамыз да, нәтижені `age` айнымалысына сақтаймыз.",
        ru: "К тексту нельзя прибавить 10. Поэтому преобразуем его через `int()` и сохраняем результат в переменную `age`.",
      },
      {
        kk: "Енді `age` — нағыз сан, оған 10 қосуға болады.",
        ru: "Теперь `age` — настоящее число, к нему можно прибавить 10.",
      },
      {
        kk: "`print` есептелген нәтижені экранға шығарады. Жақшаның ішіндегі өрнек алдымен есептеледі, содан кейін шығады.",
        ru: "`print` выводит вычисленный результат. Выражение в скобках сначала вычисляется, потом печатается.",
      },
    ],
    code: "age = int(input())\nprint(age + 10)",
    stdin: "14",
    result: { kk: "14 енгізгенде: 24", ru: "При вводе 14: 24" },
  },
  {
    id: "m1.l1.b5",
    type: "write_code",
    skillRefs: ["io.read", "io.print", "arith.basic"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір бүтін сан беріледі. Оның квадратын шығар.",
      ru: "Дано целое число. Выведи его квадрат.",
    },
    referenceSolution: "n = int(input())\nprint(n * n)",
    cases: [
      { input: "5", expectedOutput: "25" },
      { input: "0", expectedOutput: "0" },
      { input: "-3", expectedOutput: "9", hidden: true },
      { input: "1000", expectedOutput: "1000000", hidden: true },
    ],
  },
];

const l2Blocks: LessonBlock[] = [
  /*
   * `map(int, input().split())` used to appear here as one finished line, in a
   * body that never contains the word `map`, and the very next block graded the
   * learner on typing it. Fourteen of the month's tasks then required it. That
   * is the definition of a magic incantation: a line a beginner reproduces
   * without any of its four ideas — reading, splitting, converting, unpacking —
   * ever having been separated out.
   *
   * The three blocks below take it apart in the order the pieces actually
   * compose, and the prediction in the middle is where the work happens: it
   * makes the learner discover for themselves that the pieces are still TEXT,
   * which is exactly why `map(int, ...)` has to be there at all. That callback
   * to m1.l1.b4's `"5" * 2 == "55"` is deliberate.
   */
  {
    id: "m1.l2.b1",
    type: "concept",
    skillRefs: ["io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Жолды бөліктерге бөлу", ru: "Разделяем строку на части" },
    body: {
      kk: "`input()` бір жолды түгел оқиды. Егер онда бірнеше мән бос орынмен жазылса, `split()` сол жолды бөліктерге бөледі. Сол бөліктерді бірден екі айнымалыға таратып беруге болады.",
      ru: "`input()` читает строку целиком. Если в ней несколько значений через пробел, `split()` разрежет строку на части. Эти части можно сразу разложить по двум переменным.",
    },
    code: "a, b = input().split()\nprint(a)\nprint(b)",
  },
  {
    id: "m1.l2.b1a",
    type: "prediction",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "product-authored",
    prompt: {
      kk: "Пернетақтадан `3 4` енгізілді. Бағдарлама нені шығарады?",
      ru: "С клавиатуры ввели `3 4`. Что выведет программа?",
    },
    code: "a, b = input().split()\nprint(a + b)",
    stdin: "3 4",
    answer: "34",
    options: ["7", "34", "3 4", "12"],
    diagnosticMapping: {
      "7": {
        failureClass: "string_vs_number_confusion",
        justification:
          "7 деген жауап `a` мен `b` сан деп ойлағанда шығады. `split()` бөліктерді мәтін күйінде қалдырады, ал екі мәтінді қосу оларды жалғайды.",
      },
    },
  },
  {
    id: "m1.l2.b1b",
    type: "concept",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Барлық бөлікті санға айналдыру", ru: "Превращаем все части в числа" },
    body: {
      kk: "Бөліктер әлі мәтін болғандықтан, әрқайсысын `int()` арқылы санға айналдыру керек. `map(int, ...)` дәл соны істейді: `int` амалын әр бөлікке бір-бірлеп қолданады. Сондықтан толық жол осылай оқылады.",
      ru: "Части всё ещё текст, поэтому каждую нужно преобразовать через `int()`. `map(int, ...)` делает именно это: применяет `int` к каждой части по очереди. Поэтому полная строка читается так.",
    },
    code: "a, b = map(int, input().split())\nprint(a + b)",
  },
  {
    id: "m1.l2.b2",
    type: "fill_blank",
    skillRefs: ["io.read"],
    sourceType: "product-authored",
    prompt: {
      kk: "Үш санды оқып, қосындысын шығаратындай толықтыр.",
      ru: "Дополни так, чтобы прочитать три числа и вывести их сумму.",
    },
    template: "a, b, c = ___(int, input().___())\nprint(a + b + c)",
    blanks: [
      { id: "f1", answer: "map" },
      { id: "f2", answer: "split" },
    ],
  },
  /*
   * SUPPORT SUBSTITUTIONS.
   *
   * The programme's support route is not "the same month with the hard problems
   * removed" — the PDF says «дайын кодты құрастыру мен толықтыру КӨБІРЕК, нөлден
   * жазу АЗЫРАҚ»: MORE assembling and completing, LESS writing from scratch.
   * Filtering by track was only half the fix; without these blocks, support was
   * still core minus a few problems, and the assembly count was identical for
   * all three routes.
   *
   * Each pair below is the SAME problem twice: a blank editor for core and
   * advanced, and a scaffolded form for support. Substitution rather than
   * addition, so a support learner meets every idea the month teaches and is
   * not quietly given a shorter curriculum.
   */
  {
    id: "m1.l2.b3s",
    type: "fill_blank",
    skillRefs: ["io.read", "arith.basic"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Тіктөртбұрыштың ауданы мен периметрін шығаратындай толықтыр. Аудан — қабырғалардың көбейтіндісі, периметр — барлық қабырғаның қосындысы.",
      ru: "Дополни так, чтобы вывести площадь и периметр прямоугольника. Площадь — произведение сторон, периметр — сумма всех сторон.",
    },
    template: "a, b = map(int, input().split())\nprint(a ___ b, 2 * (a ___ b))",
    blanks: [
      { id: "f1", answer: "*" },
      { id: "f2", answer: "+" },
    ],
  },
  {
    id: "m1.l2.b3",
    type: "write_code",
    skillRefs: ["io.read", "arith.basic"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Тіктөртбұрыштың екі қабырғасы беріледі. Ауданы мен периметрін бос орынмен бөліп шығар.",
      ru: "Даны две стороны прямоугольника. Выведи площадь и периметр через пробел.",
    },
    referenceSolution: "a, b = map(int, input().split())\nprint(a * b, 2 * (a + b))",
    cases: [
      { input: "3 4", expectedOutput: "12 14" },
      { input: "1 1", expectedOutput: "1 4" },
      { input: "10 7", expectedOutput: "70 34", hidden: true },
    ],
  },
  {
    /* PDF p.7 names «сандардың қосындысы мен көбейтіндісі». The sum was covered
       by the fill-blank above; the product had no task at all. */
    id: "m1.l2.b3a",
    type: "write_code",
    skillRefs: ["io.read", "arith.basic", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Екі бүтін сан беріледі. Алдымен олардың қосындысын, содан кейін көбейтіндісін бос орынмен бөліп шығар.",
      ru: "Даны два целых числа. Выведи сначала их сумму, затем произведение — через пробел.",
    },
    referenceSolution: "a, b = map(int, input().split())\nprint(a + b, a * b)",
    cases: [
      { input: "3 4", expectedOutput: "7 12" },
      { input: "5 0", expectedOutput: "5 0" },
      { input: "1 1", expectedOutput: "2 1", hidden: true },
      { input: "-2 6", expectedOutput: "4 -12", hidden: true },
      { input: "100 100", expectedOutput: "200 10000", hidden: true },
    ],
  },
  {
    id: "m1.l2.b4",
    type: "test_case",
    skillRefs: ["io.read", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама қандай енгізуде дұрыс жұмыс істемейді? Өз тексеру мысалыңды ұсын.",
      ru: "На каком вводе эта программа работает неверно? Предложи свой тест.",
    },
    code: "a, b = map(int, input().split())\nprint(a // b)",
    breakingInputs: ["5 0"],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 2 — Арифметика                                                         */
/* -------------------------------------------------------------------------- */

const l3Blocks: LessonBlock[] = [
  {
    id: "m1.l3.b1",
    type: "concept",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Бүтін бөлу және қалдық", ru: "Целочисленное деление и остаток" },
    /* "Отбрасывает дробную часть" was false: `//` floors, so -7 // 2 is -4, not
       -3. Stating it as a universal rule in the month whose assessment asks
       where division goes wrong was exactly backwards. The claim is now scoped
       to the non-negative integers September actually works with, and the
       negative case is named as a later topic rather than quietly mis-taught. */
    body: {
      kk: "Теріс емес бүтін сандар үшін `a // b` — толық бөлінді, ал `a % b` — қалдық. Екеуі бірге «толық неше рет сыйды және неше қалды» деген сұраққа жауап береді. Теріс сандарда `//` басқаша жұмыс істейді — оны кейінірек қараймыз.",
      ru: "Для неотрицательных целых чисел `a // b` — это целая часть частного, а `a % b` — остаток. Вместе они отвечают на вопрос «сколько раз поместилось целиком и сколько осталось». С отрицательными числами `//` ведёт себя иначе — разберём это позже.",
    },
    code: "print(17 // 5)  # 3\nprint(17 % 5)   # 2",
  },
  {
    id: "m1.l3.b2",
    type: "visual_simulation",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "product-authored",
    simulation: "step_execution",
    prompt: {
      kk: "17 кәмпитті 5 балаға бөлгенде не болатынын қадамдап көр.",
      ru: "Посмотри пошагово, что происходит при делении 17 конфет между 5 детьми.",
    },
    config: { total: 17, groups: 5 },
  },
  {
    id: "m1.l3.b3",
    type: "prediction",
    skillRefs: ["arith.remainder"],
    sourceType: "product-authored",
    prompt: { kk: "Нәтижесі қандай?", ru: "Каков результат?" },
    code: "print(7 % 2)",
    answer: "1",
    options: ["0", "1", "3", "3.5"],
    diagnosticMapping: {
      "3": {
        failureClass: "remainder_vs_quotient_swap",
        justification:
          "3 — бұл 7 // 2 нәтижесі. Оны таңдау `%` пен `//` орындарын ауыстырғанды білдіреді.",
      },
    },
  },
  {
    id: "m1.l3.b4",
    type: "write_code",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Секундпен берілген уақытты минут пен секундқа айналдыр. Мысалы 125 → «2 5».",
      ru: "Переведи время в секундах в минуты и секунды. Например 125 → «2 5».",
    },
    referenceSolution: "t = int(input())\nprint(t // 60, t % 60)",
    cases: [
      { input: "125", expectedOutput: "2 5" },
      { input: "60", expectedOutput: "1 0" },
      { input: "59", expectedOutput: "0 59", hidden: true },
      { input: "3600", expectedOutput: "60 0", hidden: true },
    ],
  },
  {
    /*
     * Was the even/odd task, which needs `if`/`else` — one full lesson before
     * Unit 3 introduces conditions at m1.l4.b1. A learner following the month
     * in order met a branch before anyone had explained what a branch is. The
     * parity task now lives at m1.l4.b5, immediately after `if`/`else` is
     * taught, and this slot carries pure `//`-and-`%` work instead: it codes
     * the very simulation the learner has just stepped through in m1.l3.b2
     * (17 sweets, 5 children), which is what that visualiser is there for.
     */
    id: "m1.l3.b5",
    type: "write_code",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "n кәмпитті k балаға тең бөлеміз. Әрқайсысына нешеуден тиеді және нешеуі артып қалады? Екі санды бос орынмен бөліп шығар.",
      ru: "n конфет делим поровну между k детьми. Сколько достанется каждому и сколько конфет останется? Выведи два числа через пробел.",
    },
    referenceSolution: "n, k = map(int, input().split())\nprint(n // k, n % k)",
    cases: [
      { input: "17 5", expectedOutput: "3 2" },
      { input: "10 2", expectedOutput: "5 0" },
      { input: "3 5", expectedOutput: "0 3", hidden: true },
      { input: "100 7", expectedOutput: "14 2", hidden: true },
      { input: "0 4", expectedOutput: "0 0", hidden: true },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 3 — Шарттар                                                            */
/* -------------------------------------------------------------------------- */

const l4Blocks: LessonBlock[] = [
  {
    id: "m1.l4.b1",
    type: "concept",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "if және else", ru: "if и else" },
    body: {
      kk: "`if` шарты орындалса — бір тармақ, орындалмаса — `else` тармағы жүреді. Шарттың ішіндегі жолдар шегініспен жазылады: шегініс бағдарламаға қай жолдар шартқа тиесілі екенін көрсетеді.",
      ru: "Если условие `if` истинно — выполняется одна ветка, иначе — ветка `else`. Строки внутри пишутся с отступом: отступ показывает программе, какие строки относятся к условию.",
    },
    code: 'n = int(input())\nif n > 0:\n    print("positive")\nelse:\n    print("not positive")',
  },
  {
    id: "m1.l4.b2",
    type: "trace_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* The old program was `if n > 3` with `n = 5` — the branch was decided by a
       comparison the learner could answer at a glance, and the step list then
       named line 4, which said which branch had run before they traced
       anything. Now the branch turns on `7 % 3`, so the learner has to compute
       `x` at step 2 to know where line 3 goes. The step list still names the
       line taken, but by then they have already done the work it would have
       given away. */
    prompt: {
      kk: "n = 7 болғанда бағдарламаны қағаздағыдай қадамдап орында. Әр жолдан кейін айнымалылардың мәнін жаз.",
      ru: "Выполни программу пошагово, как на бумаге, при n = 7. После каждой строки запиши значения переменных.",
    },
    code: "n = 7\nx = n % 3\nif x == 1:\n    x = x + 10\nelse:\n    x = x - 10\nprint(x)",
    steps: [
      { line: 1, vars: { n: "7" } },
      { line: 2, vars: { n: "7", x: "1" } },
      { line: 4, vars: { n: "7", x: "11" } },
      { line: 7, vars: { n: "7", x: "11" } },
    ],
  },
  {
    id: "m1.l4.b3",
    type: "reorder_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "product-authored",
    /* The Russian prompt used to quote «көп» and «аз» — untranslated Kazakh —
       and the program printed those same Kazakh literals, so a Russian-track
       learner could order the lines by matching glyphs without reading the
       condition. `code` is a plain string and cannot be localised, so the
       program now prints the English tokens the month already uses for graded
       output ("even"/"odd", "yes"/"no", "ok"), and both prompts name them. */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: сан оқылады, ол 100-ден үлкен болса «many», әйтпесе «few» шығады.",
      ru: "Расставь строки: читается число, если оно больше 100 — выводится «many», иначе «few».",
    },
    lines: [
      { id: "r1", code: "n = int(input())" },
      { id: "r2", code: "if n > 100:" },
      { id: "r3", code: '    print("many")' },
      { id: "r4", code: "else:" },
      { id: "r5", code: '    print("few")' },
    ],
    correctOrder: ["r1", "r2", "r3", "r4", "r5"],
  },
  {
    id: "m1.l4.b4",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Екі сан беріледі. Үлкенін шығар. Тең болса, кез келгенін шығар.",
      ru: "Даны два числа. Выведи большее. Если равны — любое из них.",
    },
    referenceSolution:
      "a, b = map(int, input().split())\nif a > b:\n    print(a)\nelse:\n    print(b)",
    cases: [
      { input: "3 7", expectedOutput: "7" },
      { input: "9 2", expectedOutput: "9" },
      { input: "4 4", expectedOutput: "4", hidden: true },
      { input: "-5 -9", expectedOutput: "-5", hidden: true },
    ],
  },
  {
    /* Relocated from m1.l3.b5. Parity is a `%` task, but writing it needs
       `if`/`else`, and in Unit 2 it demanded a branch a full lesson before
       anyone had explained what a branch was. Here it is the first thing the
       learner writes with the condition they have just met. */
    id: "m1.l4.b5",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бүтін сан беріледі. Ол жұп болса «even», тақ болса «odd» шығар.",
      ru: "Дано целое число. Если оно чётное — выведи «even», если нечётное — «odd».",
    },
    referenceSolution:
      'n = int(input())\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
    cases: [
      { input: "4", expectedOutput: "even" },
      { input: "7", expectedOutput: "odd" },
      { input: "0", expectedOutput: "even", hidden: true },
      { input: "-3", expectedOutput: "odd", hidden: true },
      { input: "-8", expectedOutput: "even", hidden: true },
    ],
  },
];

const l5Blocks: LessonBlock[] = [
  {
    id: "m1.l5.b1",
    type: "concept",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "elif тізбегі", ru: "Цепочка elif" },
    body: {
      kk: "Үш немесе одан көп жағдай болса, `elif` қолданылады. Тексеру жоғарыдан төмен жүреді және бірінші сәйкес келген тармақ орындалғаннан кейін қалғандары мүлде қаралмайды.",
      ru: "Если случаев три и больше, используется `elif`. Проверка идёт сверху вниз, и после первой подошедшей ветки остальные не рассматриваются вовсе.",
    },
    code: 'n = int(input())\nif n > 0:\n    print("positive")\nelif n < 0:\n    print("negative")\nelse:\n    print("zero")',
  },
  {
    id: "m1.l5.b2",
    type: "prediction",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "n = 10 болғанда не шығады?",
      ru: "Что выведется при n = 10?",
    },
    code: 'n = 10\nif n > 5:\n    print("A")\nelif n > 8:\n    print("B")\nelse:\n    print("C")',
    answer: "A",
    options: ["A", "B", "C", "A B"],
    diagnosticMapping: {
      B: {
        failureClass: "elif_chain_short_circuit_missed",
        justification:
          "B тек барлық шарт тексеріледі деп ойлағанда таңдалады. Шын мәнінде бірінші сәйкес тармақтан кейін тізбек тоқтайды.",
      },
      "A B": {
        failureClass: "elif_chain_short_circuit_missed",
        justification:
          "Екі тармақтың бірге орындалуы мүмкін емес — бұл да тізбектің тоқтайтынын түсінбегенді көрсетеді.",
      },
    },
  },
  {
    id: "m1.l5.b3s",
    type: "fill_blank",
    skillRefs: ["cond.if_elif_else", "compare.operators", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Тізбектің құрылымы дайын — тек шектерді қой. 85 және одан жоғары «5», 70-тен жоғары «4», 50-ден жоғары «3», қалғаны «2». Шекара мәнінің өзі кіретінін ұмытпа.",
      ru: "Структура цепочки готова — расставь только границы. 85 и выше «5», от 70 «4», от 50 «3», остальное «2». Не забудь, что само граничное значение входит.",
    },
    template:
      "b = int(input())\nif b >= ___:\n    print(5)\nelif b >= ___:\n    print(4)\nelif b >= ___:\n    print(3)\nelse:\n    print(2)",
    blanks: [
      { id: "f1", answer: "85" },
      { id: "f2", answer: "70" },
      { id: "f3", answer: "50" },
    ],
  },
  {
    id: "m1.l5.b3",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Баға беріледі (0–100). 85 және одан жоғары — «5», 70–84 — «4», 50–69 — «3», қалғаны — «2».",
      ru: "Дан балл (0–100). 85 и выше — «5», 70–84 — «4», 50–69 — «3», остальное — «2».",
    },
    referenceSolution:
      'b = int(input())\nif b >= 85:\n    print(5)\nelif b >= 70:\n    print(4)\nelif b >= 50:\n    print(3)\nelse:\n    print(2)',
    /* Every band is now exercised, and every threshold is probed at n-1 / n.
       The old set produced only 5, 4 and 2 — never 3 — so a submission with the
       entire `elif b >= 50: print(3)` branch deleted passed all six cases. The
       50–69 band is one of the three thresholds this task exists to teach. */
    cases: [
      { input: "90", expectedOutput: "5" },
      { input: "85", expectedOutput: "5" },
      { input: "84", expectedOutput: "4", hidden: true },
      { input: "70", expectedOutput: "4", hidden: true },
      { input: "69", expectedOutput: "3", hidden: true },
      { input: "50", expectedOutput: "3", hidden: true },
      { input: "49", expectedOutput: "2", hidden: true },
      { input: "0", expectedOutput: "2", hidden: true },
      { input: "100", expectedOutput: "5", hidden: true },
    ],
  },
  {
    id: "m1.l5.b3a",
    type: "worked_example",
    skillRefs: ["cond.if_elif_else", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: бірнеше тармақ", ru: "Разобранный пример: несколько веток" },
    problem: {
      kk: "Ауа температурасы беріледі. 25-тен жоғары болса «hot», 10-нан 25-ке дейін «warm», қалғанда «cold» шығар.",
      ru: "Дана температура воздуха. Выше 25 — «hot», от 10 до 25 — «warm», иначе «cold».",
    },
    steps: [
      {
        kk: "Үш жағдай бар, сондықтан `if` — `elif` — `else` тізбегін құрамыз.",
        ru: "Случаев три, поэтому строим цепочку `if` — `elif` — `else`.",
      },
      {
        kk: "Ең жоғарғы шектен бастаймыз: `t > 25`. Егер бұл орындалса, қалған тармақтар мүлде қаралмайды.",
        ru: "Начинаем с самой верхней границы: `t > 25`. Если она сработала, остальные ветки уже не проверяются.",
      },
      {
        kk: "Екінші тармақта `t >= 10` жеткілікті: бірінші шарт өтпегендіктен, мұнда келген сан 25-тен аспайтыны өзінен-өзі белгілі. `t >= 10 and t <= 25` деп жазудың қажеті жоқ.",
        ru: "Во второй ветке достаточно `t >= 10`: раз первое условие не сработало, сюда попадают только числа не больше 25. Писать `t >= 10 and t <= 25` не нужно.",
      },
      {
        kk: "Шекараны тексереміз: 25 — «warm» (себебі 25 > 25 жалған), 26 — «hot», 10 — «warm», 9 — «cold».",
        ru: "Проверяем границы: 25 — «warm» (ведь 25 > 25 ложно), 26 — «hot», 10 — «warm», 9 — «cold».",
      },
    ],
    code: 't = int(input())\nif t > 25:\n    print("hot")\nelif t >= 10:\n    print("warm")\nelse:\n    print("cold")',
    stdin: "25",
    result: { kk: "25 енгізгенде: warm", ru: "При вводе 25: warm" },
  },
  {
    /* PDF p.7 names «таңбасы». The sign program existed only as the worked
       example in m1.l5.b1, so the learner read it and never wrote one. This
       asks for the numeric signum rather than the words that concept prints,
       so it is a task rather than a transcription. */
    id: "m1.l5.b3b",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Сан беріледі. Ол оң болса 1, теріс болса -1, нөл болса 0 шығар.",
      ru: "Дано число. Если оно положительное — выведи 1, отрицательное — -1, ноль — 0.",
    },
    referenceSolution:
      "n = int(input())\nif n > 0:\n    print(1)\nelif n < 0:\n    print(-1)\nelse:\n    print(0)",
    cases: [
      { input: "7", expectedOutput: "1" },
      { input: "-3", expectedOutput: "-1" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "1", expectedOutput: "1", hidden: true },
      { input: "-1", expectedOutput: "-1", hidden: true },
      { input: "1000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m1.l5.b4",
    type: "find_bug",
    skillRefs: ["cond.if_elif_else", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "85 балл «4» деп шығып тұр. Қате қай жолда?",
      ru: "Балл 85 выводится как «4». В какой строке ошибка?",
    },
    code: 'b = int(input())\nif b > 85:\n    print(5)\nelif b >= 70:\n    print(4)\nelse:\n    print(3)',
    buggyLine: 2,
    symptomInput: "85",
    fixedCode:
      'b = int(input())\nif b >= 85:\n    print(5)\nelif b >= 70:\n    print(4)\nelse:\n    print(3)',
    /* Keyed to line 4, not line 2. It used to name line 2 — which IS the answer —
       and `checkBlock` only consults the mapping when the learner is WRONG, so
       the month's boundary block attributed nothing at all. Blaming line 4 is
       the real misconception here: the learner sees "85 printed 4", finds the
       branch that printed 4, and repairs the branch that fired instead of the
       one that wrongly let the value through. */
    diagnosticMapping: {
      "4": {
        failureClass: "blamed_the_branch_that_fired",
        justification:
          "4-жол — бұл шыққан жауапты БАСҚАН тармақ, бірақ қате онда емес. 85 мұнда тек бірінші шарт оны өткізіп жібергендіктен жетті. Себепті шыққан жерден емес, жоғарыдан іздеу керек.",
      },
    },
  },
];

const l6Blocks: LessonBlock[] = [
  {
    id: "m1.l6.b1",
    type: "concept",
    skillRefs: ["logic.and_or_not"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "and, or, not", ru: "and, or, not" },
    body: {
      kk: "`and` — екеуі де ақиқат болғанда ғана ақиқат. `or` — кем дегенде біреуі ақиқат болса жеткілікті. `not` — мәнді керісінше айналдырады.",
      ru: "`and` истинно только когда истинны оба. `or` — достаточно хотя бы одного. `not` — меняет значение на противоположное.",
    },
    code: "x = 7\nprint(x > 0 and x < 10)   # True\nprint(x < 0 or x > 5)     # True\nprint(not (x == 7))       # False",
  },
  {
    id: "m1.l6.b2",
    type: "multiple_choice",
    skillRefs: ["logic.and_or_not", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "«x 10 мен 20-ның аралығында (шектерін қоса)» деген шартты қалай жазамыз?",
      ru: "Как записать условие «x в промежутке от 10 до 20 включительно»?",
    },
    options: [
      { id: "o1", label: { kk: "x >= 10 and x <= 20", ru: "x >= 10 and x <= 20" } },
      { id: "o2", label: { kk: "x >= 10 or x <= 20", ru: "x >= 10 or x <= 20" } },
      { id: "o3", label: { kk: "x > 10 and x < 20", ru: "x > 10 and x < 20" } },
      { id: "o4", label: { kk: "x >= 20 and x <= 10", ru: "x >= 20 and x <= 10" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "and_or_swap",
        justification:
          "`or` нұсқасы кез келген сан үшін ақиқат болады. Оны таңдау — `and` пен `or` мағынасын ауыстырғаны.",
      },
      o3: {
        failureClass: "strict_vs_inclusive_boundary",
        justification:
          "Дұрыс логика, бірақ 10 мен 20 шығып қалған. Бұл тек шекараны қоспау қатесі.",
      },
      /* Replaced a dead option (`10 <= x <= 20 and not x`, false for every
         integer, and the only appearance of chained comparison or truthiness in
         a month that teaches neither). Swapped bounds is a slip beginners
         actually make, and it is also never true — but for a reason the learner
         can find by testing one value. */
      o4: {
        failureClass: "swapped_interval_bounds",
        justification:
          "Шектер орындары ауысып кеткен: бір сан бір мезгілде 20-дан үлкен әрі 10-нан кіші бола алмайды, сондықтан бұл шарт ешқашан ақиқат болмайды. Кез келген санды қойып көрсең, бірден көрінеді.",
      },
    },
  },
  {
    /* `not` was shown once in a concept sample and then appeared only inside a
       WRONG option — never required by a correct answer anywhere in the month.
       This asks the learner to reason about what negating a condition does to
       its boundary, which is the one place `not` earns its keep in September. */
    id: "m1.l6.b2a",
    type: "multiple_choice",
    skillRefs: ["logic.and_or_not", "compare.operators", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`not (x < 10)` шартына қайсысы дәл тең?",
      ru: "Какое условие в точности равносильно `not (x < 10)`?",
    },
    options: [
      { id: "o1", label: { kk: "x >= 10", ru: "x >= 10" } },
      { id: "o2", label: { kk: "x > 10", ru: "x > 10" } },
      { id: "o3", label: { kk: "x <= 10", ru: "x <= 10" } },
      { id: "o4", label: { kk: "x != 10", ru: "x != 10" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "strict_vs_inclusive_boundary",
        justification:
          "`x < 10` жалған болатын сандар — 10 және одан үлкендер. Демек 10-ның өзі кіреді. `x > 10` деп жазу дәл 10 мәнін жоғалтады.",
      },
    },
  },
  {
    id: "m1.l6.b2b",
    type: "write_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Кинотеатрда 12 жасқа толмағандарға және 65 жастан асқандарға жеңілдік бар. Жас беріледі. Жеңілдігі ЖОҚ адам үшін «full», бары үшін «discount» шығар.",
      ru: "В кинотеатре скидка тем, кому меньше 12, и тем, кому больше 65. Дан возраст. Для того, у кого скидки НЕТ, выведи «full», иначе «discount».",
    },
    referenceSolution:
      'age = int(input())\nif not (age < 12 or age > 65):\n    print("full")\nelse:\n    print("discount")',
    cases: [
      { input: "30", expectedOutput: "full" },
      { input: "8", expectedOutput: "discount" },
      { input: "12", expectedOutput: "full", hidden: true },
      { input: "11", expectedOutput: "discount", hidden: true },
      { input: "65", expectedOutput: "full", hidden: true },
      { input: "66", expectedOutput: "discount", hidden: true },
    ],
  },
  {
    id: "m1.l6.b3s",
    type: "modify_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама тек «4-ке бөліне ме?» дегенді тексереді, сондықтан 1900 жылды кібісе деп қате айтады. Ережені толықтыр: 100-ге бөлінсе, тек 400-ге бөлінгенде ғана кібісе.",
      ru: "Эта программа проверяет только «делится ли на 4», поэтому ошибочно считает 1900 високосным. Дополни правило: если год делится на 100, то високосный он только при делении на 400.",
    },
    code: 'y = int(input())\nif y % 4 == 0:\n    print("yes")\nelse:\n    print("no")',
    referenceSolution:
      'y = int(input())\nif y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "2024", expectedOutput: "yes" },
      { input: "1900", expectedOutput: "no" },
      { input: "2000", expectedOutput: "yes", hidden: true },
      { input: "2023", expectedOutput: "no", hidden: true },
      { input: "2100", expectedOutput: "no", hidden: true },
    ],
  },
  {
    id: "m1.l6.b3",
    type: "write_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    /* Was `curriculum-derived, pdfPage: 7`. Leap year appears nowhere in the
       PDF's September practice list; it is a product-authored task serving the
       and/or/not requirement. The validator only checks that a page number
       EXISTS, never that the content is on that page, so the claim passed —
       and `sourceType` exists precisely so nobody can later mistake an authored
       drill for something the approved programme specified. */
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Жыл беріледі. Ол кібісе жыл ба? «yes» немесе «no» шығар. Ереже: 4-ке бөлінеді, бірақ 100-ге бөлінсе, тек 400-ге бөлінгенде ғана кібісе.",
      ru: "Дан год. Високосный ли он? Выведи «yes» или «no». Правило: делится на 4, но если делится на 100 — только если делится на 400.",
    },
    referenceSolution:
      'y = int(input())\nif y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "2024", expectedOutput: "yes" },
      { input: "1900", expectedOutput: "no" },
      { input: "2000", expectedOutput: "yes", hidden: true },
      { input: "2023", expectedOutput: "no", hidden: true },
      { input: "2100", expectedOutput: "no", hidden: true },
    ],
  },
  {
    id: "m1.l6.b4",
    type: "explain",
    skillRefs: ["logic.and_or_not"],
    /* Follows m1.l6.b3, so it inherits its provenance. */
    sourceType: "product-authored",
    prompt: {
      kk: "Кібісе жыл есебінде 1900 неге кібісе емес, ал 2000 неге кібісе? Өз сөзіңмен түсіндір.",
      ru: "Почему 1900 не високосный, а 2000 — високосный? Объясни своими словами.",
    },
    expectedPoints: [
      {
        kk: "1900 мен 2000 екеуі де 4-ке және 100-ге бөлінеді, сондықтан бірінші ереже жеткіліксіз.",
        ru: "И 1900, и 2000 делятся на 4 и на 100, поэтому первого правила недостаточно.",
      },
      {
        kk: "Айырмасы 400-де: 2000 400-ге бөлінеді, 1900 бөлінбейді.",
        ru: "Разница в 400: 2000 делится на 400, 1900 — нет.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 4 — Шекаралар, қателер, дербес шешу                                    */
/* -------------------------------------------------------------------------- */

const l7Blocks: LessonBlock[] = [
  {
    id: "m1.l7.b1",
    type: "concept",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Шарт шекарасы", ru: "Граница условия" },
    body: {
      kk: "Қателердің көбі дәл шекарада жасырынады. Бағдарламаны тексергенде әрқашан шекаралық мәндерді бөлек сына: шарттағы санның өзін, одан бір кем және бір артық мәнді.",
      ru: "Большая часть ошибок прячется ровно на границе. Проверяя программу, всегда отдельно пробуй граничные значения: само число из условия, на единицу меньше и на единицу больше.",
    },
    code: "# if x >= 10  →  9, 10, 11 үшін тексер",
  },
  {
    id: "m1.l7.b1a",
    type: "worked_example",
    skillRefs: ["debug.boundary", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: шекарада не болады", ru: "Разобранный пример: что происходит на границе" },
    problem: {
      kk: "Аттракционға бойы 120 см және одан жоғары балаларды жібереді. Бой беріледі. «yes» немесе «no» шығар.",
      ru: "На аттракцион пускают детей ростом 120 см и выше. Дан рост. Выведи «yes» или «no».",
    },
    steps: [
      {
        kk: "Ереже «120 және одан жоғары» дейді. Демек 120-ның өзі рұқсат етілген — бұл шешуші сөз.",
        ru: "Правило говорит «120 и выше». Значит само 120 разрешено — это ключевое слово.",
      },
      {
        kk: "`h > 120` деп жазсақ, дәл 120 см бала «no» алады. Ереже бұзылды, ал бағдарлама құламайды — сондықтан қате көзге түспейді.",
        ru: "Если написать `h > 120`, ребёнок ростом ровно 120 получит «no». Правило нарушено, а программа не падает — поэтому ошибку не видно.",
      },
      {
        kk: "Дұрысы — `h >= 120`. Айырма бір ғана таңбада, ал нәтижесі бір ғана мәнде: 120-да.",
        ru: "Правильно — `h >= 120`. Разница в одном символе, а сказывается ровно на одном значении: на 120.",
      },
      {
        kk: "Сондықтан кез келген шартты үш мәнмен тексер: шарттағы санның өзі, одан бір кем, одан бір артық. Мұнда 119, 120, 121.",
        ru: "Поэтому любое условие проверяй тремя значениями: само число из условия, на единицу меньше и на единицу больше. Здесь 119, 120, 121.",
      },
    ],
    code: 'h = int(input())\nif h >= 120:\n    print("yes")\nelse:\n    print("no")',
    stdin: "120",
    result: { kk: "119 → no, 120 → yes, 121 → yes", ru: "119 → no, 120 → yes, 121 → yes" },
  },
  {
    id: "m1.l7.b2",
    type: "test_case",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама «18 жастан бастап рұқсат» деген ережені орындауы керек, бірақ орындамайды. Оны әшкерелейтін енгізу мысалын жаз.",
      ru: "Программа должна выполнять правило «доступ с 18 лет», но не выполняет. Напиши ввод, который это вскроет.",
    },
    code: 'age = int(input())\nif age > 18:\n    print("ok")\nelse:\n    print("no")',
    breakingInputs: ["18"],
  },
  {
    id: "m1.l7.b3",
    type: "modify_code",
    skillRefs: ["debug.boundary", "cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жоғарыдағы бағдарламаны түзет: дәл 18 жаста да «ok» шығуы керек.",
      ru: "Исправь программу выше: ровно в 18 лет тоже должно выводиться «ok».",
    },
    code: 'age = int(input())\nif age > 18:\n    print("ok")\nelse:\n    print("no")',
    referenceSolution:
      'age = int(input())\nif age >= 18:\n    print("ok")\nelse:\n    print("no")',
    /* The old three cases (18/17/19) were passed by `if age != 17`, which is
       wrong for every age below 17. Far-from-boundary cases on both sides now
       make the boundary the only thing that can satisfy the set. */
    cases: [
      { input: "18", expectedOutput: "ok" },
      { input: "17", expectedOutput: "no" },
      { input: "19", expectedOutput: "ok", hidden: true },
      { input: "5", expectedOutput: "no", hidden: true },
      { input: "0", expectedOutput: "no", hidden: true },
      { input: "60", expectedOutput: "ok", hidden: true },
    ],
  },
  {
    id: "m1.l7.b4s",
    type: "reorder_code",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Үшбұрыш құрауға болатыны — кез келген екі қабырғаның қосындысы үшіншісінен үлкен болса.",
      ru: "Расставь строки по порядку. Треугольник можно составить, если сумма любых двух сторон больше третьей.",
    },
    lines: [
      { id: "t1", code: "a, b, c = map(int, input().split())" },
      { id: "t2", code: "if a + b > c and a + c > b and b + c > a:" },
      { id: "t3", code: '    print("yes")' },
      { id: "t4", code: "else:" },
      { id: "t5", code: '    print("no")' },
    ],
    correctOrder: ["t1", "t2", "t3", "t4", "t5"],
  },
  {
    id: "m1.l7.b4",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Үш кесіндінің ұзындығы беріледі. Олардан үшбұрыш құрауға бола ма? «yes» немесе «no».",
      ru: "Даны длины трёх отрезков. Можно ли составить треугольник? «yes» или «no».",
    },
    referenceSolution:
      'a, b, c = map(int, input().split())\nif a + b > c and a + c > b and b + c > a:\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "3 4 5", expectedOutput: "yes" },
      { input: "1 2 3", expectedOutput: "no" },
      { input: "10 1 1", expectedOutput: "no", hidden: true },
      { input: "5 5 5", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    id: "m1.l7.b5",
    type: "reflection",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Осы аптада қай қате саған екі реттен көп кездесті? Оны келесі жолы қалай ертерек байқайсың?",
      ru: "Какая ошибка встретилась тебе на этой неделе больше двух раз? Как заметишь её раньше в следующий раз?",
    },
  },
];

const l8Blocks: LessonBlock[] = [
  {
    id: "m1.l8.b1",
    type: "challenge",
    skillRefs: ["cond.if_elif_else", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Күн нөмірі беріледі (1 — дүйсенбі … 7 — жексенбі) және N күн өтті. Қай күн болатынын шығар.",
      ru: "Дан номер дня (1 — понедельник … 7 — воскресенье) и прошло N дней. Выведи, какой будет день.",
    },
    referenceSolution: "d, n = map(int, input().split())\nprint((d - 1 + n) % 7 + 1)",
    cases: [
      { input: "1 3", expectedOutput: "4" },
      { input: "7 1", expectedOutput: "1" },
      /* Was "1". Day 5 plus 100 days: 100 % 7 == 2, so 5 + 2 == 7. The
         reference solution above prints 7, and 7 is the arithmetic truth —
         the stored key was simply wrong, and every correct submission failed
         on it invisibly. `curriculum:test-content` now executes every
         reference solution against every case, so this class of defect cannot
         reach a learner again. */
      { input: "5 100", expectedOutput: "7", hidden: true },
      { input: "3 0", expectedOutput: "3", hidden: true },
      { input: "7 7", expectedOutput: "7", hidden: true },
    ],
  },
  {
    id: "m1.l8.b2",
    type: "challenge",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    /* The Kazakh said the dimensions of a ROOM and a door were given; the graded
       solution reads the WARDROBE and the doorway. A Kazakh-track learner was
       solving a different problem from the one being marked. Both versions now
       state the same four inputs in the same order — which neither did. */
    prompt: {
      kk: "Бір жолда төрт сан беріледі: шкафтың өлшемдері a мен b, содан кейін есік ойығының өлшемдері x пен y. Шкаф есіктен өте ме? Шкафты бұруға болады. «yes» немесе «no» шығар.",
      ru: "В одной строке даны четыре числа: размеры шкафа a и b, затем размеры дверного проёма x и y. Пройдёт ли шкаф в проём? Шкаф можно поворачивать. Выведи «yes» или «no».",
    },
    referenceSolution:
      'a, b, x, y = map(int, input().split())\nif (a <= x and b <= y) or (a <= y and b <= x):\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "2 5 3 6", expectedOutput: "yes" },
      { input: "5 2 3 6", expectedOutput: "yes" },
      { input: "7 7 6 8", expectedOutput: "no", hidden: true },
      { input: "3 3 3 3", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    id: "m1.l8.b3",
    type: "explain",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Соңғы есепте неге екі нұсқаны да тексеру керек болды? Тек біреуін тексерсек не бұзылады?",
      ru: "Почему в последней задаче нужно было проверять оба варианта? Что сломается, если проверить только один?",
    },
    expectedPoints: [
      {
        kk: "Шкафты 90 градусқа бұруға болады, сондықтан a мен b рөлдерін ауыстырады.",
        ru: "Шкаф можно повернуть на 90 градусов, поэтому a и b меняются ролями.",
      },
      {
        kk: "Бір ғана нұсқаны тексерсек, бұрғанда сыятын шкафты «сыймайды» деп қате айтамыз.",
        ru: "Проверив один вариант, мы ошибочно скажем «не пройдёт» про шкаф, который проходит после поворота.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Blocks authored to close gaps the forensic audit found                      */
/*                                                                            */
/* Lesson ids below continue the authoring sequence (l10, l11, l12); their     */
/* teaching position is set by where they sit in the `units` array at the      */
/* bottom of this file, not by their number.                                   */
/* -------------------------------------------------------------------------- */

/**
 * Unit 2, taught BEFORE `//` and `%`.
 *
 * The PDF's first mastery line for September is «бүтін және бөлшек сандардың
 * айырмасын түсіну», and the monthly check requires the learner to explain why
 * they chose an integer or a fractional type. September contained no float, no
 * `/`, and no task where the distinction could arise — the operator appeared
 * ZERO times in 1063 lines — so the requirement was asserted in the month's
 * metadata and delivered nowhere, and the assessment asked about a choice the
 * learner had never been offered.
 */
const l10Blocks: LessonBlock[] = [
  {
    id: "m1.l10.b1",
    type: "concept",
    skillRefs: ["types.int_float", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Екі түрлі бөлу", ru: "Два разных деления" },
    body: {
      kk: "Python-да бөлудің екі белгісі бар. `/` әрқашан бөлшек сан береді — тіпті бөліну қалдықсыз болса да. `//` бүтін бөлінді береді. Қайсысын алу керегін есептің өзі айтады: адам санын бөлшекпен айтуға болмайды, ал орташа баға бөлшек болуы мүмкін.",
      ru: "В Python два знака деления. `/` всегда даёт дробное число — даже когда делится нацело. `//` даёт целую часть частного. Что выбрать, подсказывает сама задача: количество людей не бывает дробным, а средний балл — может.",
    },
    code: "print(7 / 2)    # 3.5\nprint(7 // 2)   # 3\nprint(10 / 5)   # 2.0\nprint(10 // 5)  # 2",
  },
  {
    id: "m1.l10.b2",
    type: "prediction",
    skillRefs: ["types.int_float"],
    sourceType: "product-authored",
    prompt: {
      kk: "Экранға не шығады?",
      ru: "Что появится на экране?",
    },
    code: "print(10 / 5)",
    answer: "2.0",
    options: ["2", "2.0", "5", "2.5"],
    diagnosticMapping: {
      "2": {
        failureClass: "true_division_returns_float",
        justification:
          "`/` қалдықсыз бөлгенде де бөлшек сан қайтарады, сондықтан жауап 2 емес, 2.0. Тек 2 деп жазу — `/` мен `//` айырмасын байқамағанды білдіреді.",
      },
    },
  },
  {
    id: "m1.l10.b3",
    type: "worked_example",
    skillRefs: ["types.int_float", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: қай бөлуді таңдау керек", ru: "Разобранный пример: какое деление выбрать" },
    problem: {
      kk: "48 оқушыны 5 автобусқа отырғызамыз. Әр автобусқа кемінде нешеу отырады? Мысал: 48 және 5 берілсе, жауап 9.",
      ru: "48 учеников рассаживаем в 5 автобусов. Сколько человек точно поместится в каждый? Пример: даны 48 и 5, ответ 9.",
    },
    steps: [
      {
        kk: "Не сұралып тұр: әр автобусқа кепілді түрде нешеу тиеді. Демек жауап — адам саны, ал адам саны бүтін.",
        ru: "Что спрашивают: сколько человек гарантированно достанется каждому автобусу. Значит ответ — количество людей, а оно целое.",
      },
      {
        kk: "`48 / 5` жазсақ, 9.6 шығады. 9.6 адам деген мағынасыз, ендеше `/` бұл жерде дұрыс емес.",
        ru: "Если написать `48 / 5`, получится 9.6. «9.6 человека» — бессмыслица, значит `/` здесь не подходит.",
      },
      {
        kk: "`48 // 5` жазсақ, 9 шығады. Дәл осы — әрқайсысына кепілді тиетін сан.",
        ru: "Если написать `48 // 5`, получится 9. Это и есть число, которое гарантированно достанется каждому.",
      },
      {
        kk: "Қалғанын да білгіміз келсе, `48 % 5` = 3 — орын таппаған үш оқушы.",
        ru: "Если нужен и остаток, `48 % 5` = 3 — три ученика, которым места не хватило.",
      },
    ],
    code: "n, k = map(int, input().split())\nprint(n // k)",
    stdin: "48 5",
    result: { kk: "48 5 енгізгенде: 9", ru: "При вводе 48 5: 9" },
  },
  {
    id: "m1.l10.b4",
    type: "multiple_choice",
    skillRefs: ["types.int_float", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Қай есепте `/` (бөлшек бөлу) дұрысырақ?",
      ru: "В какой задаче уместнее `/` (дробное деление)?",
    },
    options: [
      { id: "o1", label: { kk: "Үш бағаның орташа мәнін табу", ru: "Найти среднее из трёх оценок" } },
      { id: "o2", label: { kk: "n кәмпитті k балаға тең бөлу", ru: "Разделить n конфет между k детьми поровну" } },
      { id: "o3", label: { kk: "Санның соңғы цифрын табу", ru: "Найти последнюю цифру числа" } },
      { id: "o4", label: { kk: "n жәшікті тасуға неше рейс керегін табу", ru: "Сколько рейсов нужно для n ящиков" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "fractional_where_integer_required",
        justification:
          "Кәмпит бүтін затпен саналады, сондықтан жауап бөлшек бола алмайды. Мұнда `//` мен `%` керек, `/` емес.",
      },
    },
  },
  {
    id: "m1.l10.b5",
    type: "write_code",
    skillRefs: ["types.int_float", "arith.basic", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Үш баға беріледі. Олардың орташа мәнін шығар. Жауап бөлшек болуы мүмкін, сондықтан `/` қолдан.",
      ru: "Даны три оценки. Выведи их среднее. Ответ может быть дробным, поэтому используй `/`.",
    },
    referenceSolution: "a, b, c = map(int, input().split())\nprint((a + b + c) / 3)",
    cases: [
      { input: "4 5 3", expectedOutput: "4.0" },
      { input: "5 5 5", expectedOutput: "5.0" },
      { input: "4 4 5", expectedOutput: "4.333333333333333", hidden: true },
      { input: "0 0 1", expectedOutput: "0.3333333333333333", hidden: true },
    ],
  },
];

/**
 * Unit 1, taught after the first program.
 *
 * PDF p.7: «Сан мен мәтінді оқу». September read text exactly once — in
 * m1.l1.b4, where the string is the BUG the learner is asked to remove. A month
 * that only ever shows text as a mistake teaches that text input is a mistake.
 */
const l11Blocks: LessonBlock[] = [
  {
    id: "m1.l11.b1",
    type: "concept",
    skillRefs: ["io.read", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Мәтінді мәтін күйінде қалдыру", ru: "Оставляем текст текстом" },
    body: {
      kk: "`input()` әрқашан мәтін қайтарады. Санмен есептеу керек болса ғана `int()` қолданамыз. Ал есім, қала аты немесе сөз керек болса, оны айналдырудың қажеті жоқ — мәтінді бірден шығара береміз. Бірнеше мәнді `print` ішінде үтірмен бөлсек, олар бос орынмен бірге шығады.",
      ru: "`input()` всегда возвращает текст. `int()` нужен, только если предстоит считать. А если нужно имя, город или слово — преобразовывать нечего, текст выводится как есть. Несколько значений внутри `print` через запятую печатаются через пробел.",
    },
    code: 'name = input()\nprint("Hello,", name)',
  },
  {
    id: "m1.l11.b2",
    type: "write_code",
    skillRefs: ["io.read", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда есім беріледі. `Hello, <есім>!` түрінде сәлемдесу шығар. Мысалы `Aidana` үшін жауап: `Hello, Aidana!`",
      ru: "В одной строке дано имя. Выведи приветствие вида `Hello, <имя>!` Например, для `Aidana` ответ: `Hello, Aidana!`",
    },
    referenceSolution: 'name = input()\nprint("Hello, " + name + "!")',
    cases: [
      { input: "Aidana", expectedOutput: "Hello, Aidana!" },
      { input: "Bek", expectedOutput: "Hello, Bek!" },
      { input: "Zhanel", expectedOutput: "Hello, Zhanel!", hidden: true },
      { input: "A", expectedOutput: "Hello, A!", hidden: true },
    ],
  },
  {
    id: "m1.l11.b3",
    type: "find_bug",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама есімді сұрап, оны шығаруы керек. Бірақ кез келген есім енгізгенде құлап қалады. Қате қай жолда?",
      ru: "Программа должна прочитать имя и вывести его. Но на любом имени она падает. В какой строке ошибка?",
    },
    code: 'name = int(input())\nprint("Hello,", name)',
    buggyLine: 1,
    symptomInput: "Aidana",
    fixedCode: 'name = input()\nprint("Hello,", name)',
    diagnosticMapping: {
      "2": {
        failureClass: "unnecessary_int_conversion",
        justification:
          "Екінші жол дұрыс жазылған. Қате бірінші жолда: есімді санға айналдыруға тырысу — есімде сан жоқ, сондықтан `int()` құлайды.",
      },
    },
  },
];

/**
 * Unit 3, taught after `elif`.
 *
 * PDF p.7 names two discount tasks — «жеңілдікпен сатып алу құны» and
 * «жеңілдік деңгейін таңдау» — and September had neither: the words
 * «жеңілдік», «скидк» and «процент» appeared zero times in the month. They are
 * also the only place in the PDF's own practice list where percentage
 * arithmetic arises, which is where the integer-vs-fractional choice becomes a
 * decision rather than a definition.
 */
const l12Blocks: LessonBlock[] = [
  {
    id: "m1.l12.b1",
    type: "concept",
    skillRefs: ["arith.basic", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Пайыз және жеңілдік", ru: "Проценты и скидка" },
    body: {
      kk: "Бағаның p пайызы — `баға * p // 100`. Жеңілдіктен кейінгі құн — бағадан сол бөлікті алып тастау. Теңге бүтін саналатындықтан осы жерде `//` алынады: `/` жазсақ, жауап 1200.0 болып шығар еді.",
      ru: "p процентов от цены — это `цена * p // 100`. Стоимость со скидкой — цена минус эта часть. Тенге считаются целыми, поэтому здесь берётся `//`: с `/` ответ получился бы 1200.0.",
    },
    code: "price = 1500\np = 20\nprint(price - price * p // 100)  # 1200",
  },
  {
    id: "m1.l12.b2",
    type: "write_code",
    skillRefs: ["arith.basic", "arith.integer_division", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Тауар бағасы a теңге және жеңілдік p пайыз беріледі. Сатып алушы қанша төлейді? Жауап бүтін теңге.",
      ru: "Даны цена товара a тенге и скидка p процентов. Сколько заплатит покупатель? Ответ — целое число тенге.",
    },
    referenceSolution: "a, p = map(int, input().split())\nprint(a - a * p // 100)",
    cases: [
      { input: "1500 20", expectedOutput: "1200" },
      { input: "1000 0", expectedOutput: "1000" },
      { input: "1000 100", expectedOutput: "0", hidden: true },
      { input: "999 10", expectedOutput: "900", hidden: true },
      { input: "250 50", expectedOutput: "125", hidden: true },
    ],
  },
  {
    id: "m1.l12.b3",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "arith.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Дүкенде жеңілдік сома бойынша беріледі: 10000 теңге және одан жоғары — 10 пайыз, 5000-нан 9999-ға дейін — 5 пайыз, одан төмен — жеңілдік жоқ. Сатып алу сомасы беріледі. Төленетін соманы шығар.",
      ru: "В магазине скидка зависит от суммы: 10000 тенге и выше — 10 процентов, от 5000 до 9999 — 5 процентов, ниже — без скидки. Дана сумма покупки. Выведи сумму к оплате.",
    },
    referenceSolution:
      "s = int(input())\nif s >= 10000:\n    print(s - s * 10 // 100)\nelif s >= 5000:\n    print(s - s * 5 // 100)\nelse:\n    print(s)",
    cases: [
      { input: "12000", expectedOutput: "10800" },
      { input: "7000", expectedOutput: "6650" },
      { input: "10000", expectedOutput: "9000", hidden: true },
      { input: "9999", expectedOutput: "9500", hidden: true },
      { input: "5000", expectedOutput: "4750", hidden: true },
      { input: "4999", expectedOutput: "4999", hidden: true },
      { input: "0", expectedOutput: "0", hidden: true },
    ],
  },
];

/* -------------------------------------------------------------------------- */

function lesson(
  id: string,
  kk: string,
  ru: string,
  minutes: number,
  objectives: { kk: string; ru: string }[],
  skillRefs: string[],
  blocks: LessonBlock[],
): Lesson {
  return {
    id,
    title: { kk, ru },
    estimatedMinutes: minutes,
    objectives,
    skillRefs,
    blocks,
    sourceType: "curriculum-derived",
    pdfPage: P,
    status: "implemented",
  };
}


/* -------------------------------------------------------------------------- */
/* Unit 5 — Дербес жаттығу                                                     */
/*                                                                            */
/* The programme promises ~100 fully independent solutions across the year     */
/* (PDF p.11). These are the September share: no worked example precedes them, */
/* no scaffold is offered, and the learner writes the whole program.           */
/* -------------------------------------------------------------------------- */

interface PracticeSpec {
  id: string;
  kk: string;
  ru: string;
  skills: string[];
  solution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
  tracks?: ("support" | "core" | "advanced")[];
}

const practiceSpecs: PracticeSpec[] = [
  {
    id: "m1.p1",
    kk: "Үш санның ең үлкенін шығар.",
    ru: "Выведи наибольшее из трёх чисел.",
    skills: ["cond.if_elif_else", "compare.operators"],
    solution:
      "a, b, c = map(int, input().split())\nm = a\nif b > m:\n    m = b\nif c > m:\n    m = c\nprint(m)",
    cases: [
      { input: "3 9 5", expectedOutput: "9" },
      { input: "7 2 1", expectedOutput: "7", hidden: true },
      { input: "4 4 4", expectedOutput: "4", hidden: true },
      { input: "-9 -3 -7", expectedOutput: "-3", hidden: true },
    ],
  },
  {
    id: "m1.p2",
    /* The statement now names its own range. The hidden case used to be -47 →
       "7", which the only solution September teaches (`n % 10`) cannot produce:
       Python's `%` follows the sign of the divisor, so -47 % 10 is 3. Passing
       required `abs()`, a builtin the programme never introduces, so a learner
       who had understood `%` perfectly was failed — and failed against
       `arith.remainder`, the very skill they had just demonstrated. Negative
       floor-modulo is a real topic; it is not a September topic. */
    kk: "Теріс емес бүтін сан беріледі (0 ≤ n). Оның соңғы цифрын шығар.",
    ru: "Дано неотрицательное целое число (0 ≤ n). Выведи его последнюю цифру.",
    skills: ["arith.remainder"],
    solution: "n = int(input())\nprint(n % 10)",
    cases: [
      { input: "1234", expectedOutput: "4" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "7", expectedOutput: "7", hidden: true },
      { input: "10", expectedOutput: "0", hidden: true },
      { input: "47", expectedOutput: "7", hidden: true },
      { input: "100", expectedOutput: "0", hidden: true },
    ],
  },
  {
    id: "m1.p3",
    kk: "Екі таңбалы санның цифрларының қосындысын шығар.",
    ru: "Выведи сумму цифр двузначного числа.",
    skills: ["arith.integer_division", "arith.remainder"],
    solution: "n = int(input())\nprint(n // 10 + n % 10)",
    cases: [
      { input: "47", expectedOutput: "11" },
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "99", expectedOutput: "18", hidden: true },
    ],
  },
  {
    id: "m1.p4",
    kk: "Дүкенде бір дәптер a теңге. b теңгеге қанша дәптер алуға болады және қанша теңге қалады?",
    ru: "Тетрадь стоит a тенге. Сколько тетрадей можно купить на b тенге и сколько останется?",
    skills: ["arith.integer_division", "arith.remainder"],
    solution: "a, b = map(int, input().split())\nprint(b // a, b % a)",
    cases: [
      { input: "150 1000", expectedOutput: "6 100" },
      { input: "200 200", expectedOutput: "1 0", hidden: true },
      { input: "300 100", expectedOutput: "0 100", hidden: true },
    ],
  },
  {
    id: "m1.p5",
    kk: "Нүктенің координаталары беріледі. Ол қай ширекте жатыр? Өстің бойында жатса 0 шығар.",
    ru: "Даны координаты точки. В какой она четверти? Если на оси — выведи 0.",
    skills: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    solution:
      "x, y = map(int, input().split())\nif x == 0 or y == 0:\n    print(0)\nelif x > 0 and y > 0:\n    print(1)\nelif x < 0 and y > 0:\n    print(2)\nelif x < 0 and y < 0:\n    print(3)\nelse:\n    print(4)",
    cases: [
      { input: "2 3", expectedOutput: "1" },
      { input: "-2 3", expectedOutput: "2", hidden: true },
      { input: "-2 -3", expectedOutput: "3", hidden: true },
      { input: "2 -3", expectedOutput: "4", hidden: true },
      { input: "0 5", expectedOutput: "0", hidden: true },
    ],
  },
  {
    id: "m1.p6",
    kk: "Жүк көлігіне бір жолы k жәшік сыяды. n жәшікті тасу үшін неше рейс керек?",
    ru: "В грузовик помещается k ящиков за раз. Сколько рейсов нужно для n ящиков?",
    skills: ["arith.integer_division", "arith.remainder", "cond.if_elif_else"],
    solution: "n, k = map(int, input().split())\nprint((n + k - 1) // k)",
    cases: [
      { input: "10 3", expectedOutput: "4" },
      { input: "9 3", expectedOutput: "3", hidden: true },
      { input: "1 5", expectedOutput: "1", hidden: true },
      { input: "0 5", expectedOutput: "0", hidden: true },
    ],
    tracks: ["core", "advanced"],
  },
  {
    id: "m1.p7",
    kk: "Үш санның екеуі тең, біреуі бөлек. Бөлек санды шығар.",
    ru: "Из трёх чисел два равны, одно отличается. Выведи отличающееся.",
    skills: ["cond.if_elif_else", "compare.operators"],
    solution:
      "a, b, c = map(int, input().split())\nif a == b:\n    print(c)\nelif a == c:\n    print(b)\nelse:\n    print(a)",
    cases: [
      { input: "5 5 7", expectedOutput: "7" },
      { input: "5 7 5", expectedOutput: "7", hidden: true },
      { input: "7 5 5", expectedOutput: "7", hidden: true },
    ],
    tracks: ["core", "advanced"],
  },
  {
    /* PDF p.7 names «секундты САҒАТ пен минутқа айналдыру». m1.l3.b4 converts
       seconds to minutes and seconds — one application of `//` and `%`. The
       named task needs two, applied in sequence, which is a real step up and
       the reason the PDF asks for hours rather than minutes. */
    id: "m1.p9",
    kk: "Секундпен берілген уақыт беріледі. Оны сағат, минут және секунд түрінде бос орынмен бөліп шығар. Мысалы 3725 → «1 2 5».",
    ru: "Дано время в секундах. Выведи его как часы, минуты и секунды через пробел. Например 3725 → «1 2 5».",
    skills: ["arith.integer_division", "arith.remainder"],
    solution: "t = int(input())\nprint(t // 3600, t % 3600 // 60, t % 60)",
    cases: [
      { input: "3725", expectedOutput: "1 2 5" },
      { input: "0", expectedOutput: "0 0 0", hidden: true },
      { input: "59", expectedOutput: "0 0 59", hidden: true },
      { input: "3600", expectedOutput: "1 0 0", hidden: true },
      { input: "86399", expectedOutput: "23 59 59", hidden: true },
    ],
  },
  {
    id: "m1.p8",
    /* The Kazakh asked for the angle «тіл мен сан аралығында» — between a hand
       and a *number* — which is not a quantity this task computes. The Russian
       asked the real question. They now ask the same one. */
    kk: "Сағат 12 сағаттық форматта. h сағат және m минут берілген. Сағат тілі мен минут тілінің арасындағы бұрыш неше градус? Жауаптың бүтін бөлігін шығар.",
    ru: "Часы 12-часовые. Даны h часов и m минут. Каков угол между часовой и минутной стрелками в градусах? Выведи целую часть ответа.",
    skills: ["arith.basic", "arith.remainder", "cond.if_elif_else"],
    solution:
      "h, m = map(int, input().split())\nhh = (h % 12) * 30 + m * 0.5\nmm = m * 6\nd = abs(hh - mm)\nif d > 180:\n    d = 360 - d\nprint(int(d))",
    cases: [
      { input: "3 0", expectedOutput: "90" },
      { input: "12 0", expectedOutput: "0", hidden: true },
      { input: "6 0", expectedOutput: "180", hidden: true },
      { input: "9 30", expectedOutput: "105", hidden: true },
    ],
    tracks: ["advanced"],
  },
];

const practiceBlocks: LessonBlock[] = practiceSpecs.map((spec) => ({
  id: spec.id,
  type: "write_code",
  skillRefs: spec.skills,
  sourceType: "product-authored",
  tracks: spec.tracks,
  prompt: { kk: spec.kk, ru: spec.ru },
  referenceSolution: spec.solution,
  cases: spec.cases,
}));

export const MONTH_01_SEPTEMBER: Month = {
  index: 1,
  monthName: { kk: "Қыркүйек", ru: "Сентябрь" },
  title: {
    kk: "Деректерді оқу, есептеу және шарттар",
    ru: "Чтение данных, вычисления и условия",
  },
  mastery: {
    kk: "Деректерді оқу және жауапты шығару, бүтін және бөлшек сандар, арифметикалық амалдар, бүтін бөлу мен қалдық, салыстыру, if / elif / else шарттары, логикалық амалдар.",
    ru: "Чтение данных и вывод ответа, целые и дробные числа, арифметические операции, целочисленное деление и остаток, сравнение, условия if / elif / else, логические операции.",
  },
  explanation: {
    kk: "Әр тақырып бойынша 5-8 минуттық қысқа түсіндіру: бір ғана идея, содан кейін бірден жаттығу. Мұғалім сабақта дайын мысалды ойлау барысын дауыстап айта отырып талдайды.",
    ru: "По каждой теме короткое объяснение на 5–8 минут: одна идея, затем сразу практика. На занятии учитель разбирает готовый пример, проговаривая ход мысли вслух.",
  },
  endOfMonthCapability: {
    kk: "Оқушы деректерді оқып, есептеп, шарт арқылы жауап таңдайтын қарапайым бағдарламаларды өз бетінше жаза алады және шарт шекарасындағы қателерді таба алады.",
    ru: "Ученик самостоятельно пишет простые программы, которые читают данные, вычисляют и выбирают ответ по условию, и находит ошибки на границе условия.",
  },
  expectedTaskCount: 36,
  practiceOutline: {
    kk: "Қарапайым есептеулер, шарт бойынша жауап таңдау, шекараларды тексеру, дайын кодтағы қатені табу және түзету, өз тексеру мысалдарын құрастыру.",
    ru: "Простые вычисления, выбор ответа по условию, проверка границ, поиск и исправление ошибки в готовом коде, составление собственных тестов.",
  },
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-01",
  units: [
    {
      id: "m1.u1",
      title: { kk: "Кіріс және шығыс", ru: "Ввод и вывод" },
      sourceType: "curriculum-derived",
      lessons: [
        lesson(
          "m1.l1",
          "Бірінші бағдарлама",
          "Первая программа",
          10,
          [
            { kk: "Экранға мәтін мен санды шығару", ru: "Вывод текста и числа на экран" },
            { kk: "Енгізілген деректі санға айналдыру", ru: "Преобразование ввода в число" },
          ],
          ["io.print", "io.read", "types.int_float"],
          l1Blocks,
        ),
        /* PDF p.7 opens with «Сан мен мәтінді оқу». The month read text once,
           as the bug in m1.l1.b4 — so it taught that text input is a mistake. */
        lesson(
          "m1.l11",
          "Мәтінмен жұмыс",
          "Работа с текстом",
          6,
          [
            { kk: "Мәтінді айналдырмай оқу және шығару", ru: "Читать и выводить текст без преобразования" },
            { kk: "int() қашан керек, қашан керек емес екенін ажырату", ru: "Различать, когда int() нужен, а когда нет" },
          ],
          ["io.read", "io.print"],
          l11Blocks,
        ),
        lesson(
          "m1.l2",
          "Бір жолдағы бірнеше сан",
          "Несколько чисел в строке",
          10,
          [
            { kk: "Бос орынмен бөлінген сандарды оқу", ru: "Чтение чисел через пробел" },
            { kk: "Бірнеше мәнді бір жолға шығару", ru: "Вывод нескольких значений в строку" },
          ],
          ["io.read", "io.print", "arith.basic"],
          l2Blocks,
        ),
      ],
    },
    {
      id: "m1.u2",
      title: { kk: "Арифметика", ru: "Арифметика" },
      sourceType: "curriculum-derived",
      lessons: [
        /* Taught first, because «бүтін және бөлшек сандардың айырмасын түсіну»
           is the PDF's first mastery line for September and the month contained
           no float and no `/` at all — the operator appeared zero times. The
           monthly check then asked the learner to justify a type choice they
           had never been offered. */
        lesson(
          "m1.l10",
          "Екі түрлі бөлу",
          "Два разных деления",
          8,
          [
            { kk: "/ мен // айырмасын түсіну", ru: "Понимать разницу между / и //" },
            { kk: "Есепке қарап бүтін не бөлшек нәтиже керегін таңдау", ru: "Выбирать целый или дробный результат по смыслу задачи" },
          ],
          ["types.int_float", "arith.basic", "arith.integer_division"],
          l10Blocks,
        ),
        lesson(
          "m1.l3",
          "Бүтін бөлу және қалдық",
          "Целочисленное деление и остаток",
          8,
          [
            { kk: "// және % амалдарын ажырату", ru: "Различать операции // и %" },
            { kk: "«Толық нешеу сыйды және нешеуі қалды» есептерін шығару", ru: "Решать задачи «сколько поместилось целиком и сколько осталось»" },
          ],
          ["arith.integer_division", "arith.remainder", "arith.basic"],
          l3Blocks,
        ),
      ],
    },
    {
      id: "m1.u3",
      title: { kk: "Шарттар", ru: "Условия" },
      sourceType: "curriculum-derived",
      lessons: [
        lesson(
          "m1.l4",
          "if және else",
          "if и else",
          8,
          [
            { kk: "Шарт бойынша екі жолдың бірін таңдау", ru: "Выбор одной из двух веток по условию" },
            { kk: "Шегіністің мағынасын түсіну", ru: "Понимать смысл отступа" },
          ],
          ["cond.if_elif_else", "compare.operators"],
          l4Blocks,
        ),
        lesson(
          "m1.l5",
          "elif тізбегі",
          "Цепочка elif",
          8,
          [
            { kk: "Үш және одан көп жағдайды өңдеу", ru: "Обработка трёх и более случаев" },
            { kk: "Тізбектің бірінші сәйкестікте тоқтайтынын түсіну", ru: "Понимать остановку цепочки на первом совпадении" },
          ],
          ["cond.if_elif_else", "compare.operators", "debug.boundary"],
          l5Blocks,
        ),
        /* PDF p.7 names two discount tasks — «жеңілдікпен сатып алу құны» and
           «жеңілдік деңгейін таңдау» — and September had neither: «жеңілдік»,
           «скидка» and «процент» appeared zero times. They are also the only
           place in the PDF's own list where percentage arithmetic arises, which
           is where choosing `//` over `/` becomes a decision rather than a
           definition. Placed after `elif`, because the second one needs it. */
        lesson(
          "m1.l12",
          "Пайыз және жеңілдік",
          "Проценты и скидка",
          9,
          [
            { kk: "Пайызды бүтін арифметикамен есептеу", ru: "Считать проценты целочисленной арифметикой" },
            { kk: "Сома бойынша жеңілдік деңгейін таңдау", ru: "Выбирать уровень скидки по сумме" },
          ],
          ["arith.basic", "arith.integer_division", "cond.if_elif_else", "debug.boundary"],
          l12Blocks,
        ),
        lesson(
          "m1.l6",
          "Логикалық амалдар",
          "Логические операции",
          8,
          [
            { kk: "and, or, not мағынасын ажырату", ru: "Различать смысл and, or, not" },
            { kk: "Күрделі шартты бөліктерге жіктеу", ru: "Разбирать сложное условие на части" },
          ],
          ["logic.and_or_not", "compare.operators", "cond.if_elif_else"],
          l6Blocks,
        ),
      ],
    },
    {
      id: "m1.u4",
      title: { kk: "Шекаралар мен қателер", ru: "Границы и ошибки" },
      sourceType: "curriculum-derived",
      lessons: [
        lesson(
          "m1.l7",
          "Шекараны тексеру",
          "Проверка границы",
          8,
          [
            { kk: "Шекаралық мәндерді бөлек сынау", ru: "Отдельно проверять граничные значения" },
            { kk: "Өз тексеру мысалын құрастыру", ru: "Составлять собственный тест" },
          ],
          ["debug.boundary", "cond.if_elif_else"],
          l7Blocks,
        ),
        lesson(
          "m1.l8",
          "Күрделірек есептер",
          "Задачи посложнее",
          10,
          [
            { kk: "Бірнеше шартты біріктіру", ru: "Комбинировать несколько условий" },
            { kk: "Шешімнің дұрыстығын дәлелдеу", ru: "Обосновывать правильность решения" },
          ],
          ["cond.if_elif_else", "logic.and_or_not", "arith.remainder"],
          l8Blocks,
        ),
      ],
    },
    {
      id: "m1.u5",
      title: { kk: "Дербес жаттығу", ru: "Самостоятельная практика" },
      sourceType: "product-authored",
      lessons: [
        lesson(
          "m1.l9",
          "Өз бетіңмен шығар",
          "Реши сам",
          12,
          [
            { kk: "Есепті талдаудан кодқа дейін өз бетінше өту", ru: "Пройти путь от разбора условия до кода самостоятельно" },
            { kk: "Шешімді тапсырар алдында өзің тексеру", ru: "Проверять решение самому перед отправкой" },
          ],
          ["cond.if_elif_else", "arith.remainder", "arith.integer_division", "logic.and_or_not", "compare.operators"],
          practiceBlocks,
        ),
      ],
    },
  ],
  assessment: {
    id: "m1.assessment",
    title: { kk: "Қыркүйек айының тексерісі", ru: "Проверка за сентябрь" },
    minutes: 20,
    /*
     * Restructured against PDF p.7, which asks for ONE unseen problem in twenty
     * minutes plus an explanation — not four graded tasks. The old shape was
     * two unseen coding problems, a bug hunt and an oral question, which timed
     * at 32+ minutes, and its explanation block asked the generic p.6 question
     * instead of September's own.
     *
     * Three defects are closed here:
     *   · the find-bug block had no `code` field, so the learner met "find the
     *     error in this program" with no program on screen;
     *   · its reference solution was byte-identical to the worked example in
     *     m1.l5.b1, so the answer had already been read in lesson 5;
     *   · nothing anywhere asked the two things p.7 requires the learner to
     *     explain — the type choice, and where division, the condition boundary
     *     or very large values give a wrong result. `m1.as.b3` now asks exactly
     *     that, in writing, and is never machine-scored.
     */
    description: {
      kk: "Жиырма минуттық тексеріс: бұрын талданбаған бір есеп, бөтен бағдарламадағы қатені түзету және шешімнің неге дұрыс екенін жазбаша түсіндіру.",
      ru: "Проверка на двадцать минут: одна ранее не разобранная задача, исправление ошибки в чужой программе и письменное объяснение, почему решение верно.",
    },
    sourceType: "curriculum-derived",
    pdfPage: P,
    status: "implemented",
    blocks: [
      {
        /* The unseen problem. Reads data, computes, and turns on one condition
           with a real boundary (17:30 passes, 17:31 does not) — which is what
           m1.as.b3 then asks the learner to reason about. */
        id: "m1.as.b1",
        type: "verify",
        mode: "unseen_problem",
        skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary", "io.read"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Бір жолда екі сан беріледі: сағат h және минут m. Уақыт 09:00 мен 17:30 аралығында ма (шектерін қоса)? «yes» немесе «no» шығар.",
          ru: "В одной строке даны два числа: часы h и минуты m. Время в промежутке 09:00–17:30 включительно? Выведи «yes» или «no».",
        },
        referenceSolution:
          'h, m = map(int, input().split())\nt = h * 60 + m\nif t >= 9 * 60 and t <= 17 * 60 + 30:\n    print("yes")\nelse:\n    print("no")',
        cases: [
          { input: "9 0", expectedOutput: "yes" },
          { input: "17 30", expectedOutput: "yes", hidden: true },
          { input: "17 31", expectedOutput: "no", hidden: true },
          { input: "8 59", expectedOutput: "no", hidden: true },
          { input: "12 0", expectedOutput: "yes", hidden: true },
          { input: "0 0", expectedOutput: "no", hidden: true },
          { input: "23 59", expectedOutput: "no", hidden: true },
        ],
      },
      {
        /* Fixing someone else's program — PDF p.7, «бөтен бағдарламаны түзету».
           The bug is an `and`/`or` swap: a distinct class from the month's other
           two repairs (str-vs-int in m1.l1.b4, `>` vs `>=` in m1.l5.b4), and the
           program is on screen because `VerifyBlock` now carries `code`. */
        id: "m1.as.b2",
        type: "verify",
        mode: "find_bug",
        skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Оқушы емтиханнан өту үшін ұпайы кемінде 50 ЖӘНЕ сабаққа қатысуы кемінде 80 болуы керек. Бұл бағдарлама 90 ұпай, 10 қатысуы бар оқушыны да өткізіп жіберіп тұр. Қатені тауып, түзетілген бағдарламаны толық жаз.",
          ru: "Ученик сдаёт экзамен, если его балл не меньше 50 И посещаемость не меньше 80. Эта программа пропускает даже ученика с баллом 90 и посещаемостью 10. Найди ошибку и напиши исправленную программу целиком.",
        },
        code:
          'score, days = map(int, input().split())\nif score >= 50 or days >= 80:\n    print("yes")\nelse:\n    print("no")',
        referenceSolution:
          'score, days = map(int, input().split())\nif score >= 50 and days >= 80:\n    print("yes")\nelse:\n    print("no")',
        cases: [
          { input: "90 95", expectedOutput: "yes" },
          { input: "90 10", expectedOutput: "no", hidden: true },
          { input: "40 95", expectedOutput: "no", hidden: true },
          { input: "50 80", expectedOutput: "yes", hidden: true },
          { input: "49 80", expectedOutput: "no", hidden: true },
          { input: "50 79", expectedOutput: "no", hidden: true },
        ],
      },
      {
        /* September's own explanation requirement, verbatim from PDF p.7:
           «бүтін немесе бөлшек типті неге таңдағанын және бөлу, шарт шекарасы
           немесе өте үлкен сандар қай жерде қате нәтиже беруі мүмкін екенін
           түсіндіреді». Written, stored, read by a teacher, never auto-scored —
           `explain` settles as `unknown` by design. */
        id: "m1.as.b3",
        type: "explain",
        skillRefs: ["types.int_float", "arith.integer_division", "debug.boundary"],
        sourceType: "curriculum-derived",
        pdfPage: P,
        prompt: {
          kk: "Бірінші есеп бойынша жаз: (1) уақытты неге бүтін санмен санадың, бөлшек сан керек пе еді? (2) `/` орнына `//` қолдансаң не өзгереді? (3) дәл 17:30 неге «yes», ал 17:31 неге «no» — шекара қай жерде? (4) сағат саны өте үлкен болса не болар еді?",
          ru: "По первой задаче напиши: (1) почему ты считал время целыми числами — нужны ли были дробные? (2) что изменится, если написать `//` вместо `/`? (3) почему ровно 17:30 — это «yes», а 17:31 — «no»: где именно проходит граница? (4) что будет, если число часов окажется очень большим?",
        },
        expectedPoints: [
          {
            kk: "Минут пен сағат — бүтін шамалар, сондықтан бүтін тип жеткілікті; бөлшек сан қажет емес және салыстыруды қиындатар еді.",
            ru: "Часы и минуты — целые величины, поэтому целого типа достаточно; дробное число не нужно и только усложнило бы сравнение.",
          },
          {
            kk: "`/` нәтижесі бөлшек сан береді (мысалы 9 / 2 = 4.5), ал `//` бүтін бөлінді береді. Бұл есепте бөлу мүлде қажет емес — көбейту жеткілікті.",
            ru: "`/` даёт дробное число (например 9 / 2 = 4.5), а `//` — целую часть частного. В этой задаче деление вообще не нужно — достаточно умножения.",
          },
          {
            kk: "Шекара 17*60+30 = 1050 минутта. `<=` қолданылғандықтан 1050 өзі кіреді, ал 1051 кірмейді. `<` жазсақ, 17:30 жоғалып кетер еді.",
            ru: "Граница проходит на 17*60+30 = 1050 минутах. Так как использовано `<=`, само значение 1050 входит, а 1051 — нет. Если написать `<`, то 17:30 потерялось бы.",
          },
          {
            kk: "Python-да бүтін сандардың шегі жоқ, сондықтан үлкен h қате бермейді — бірақ жауап «no» болады, себебі уақыт аралықтан шығып кетеді.",
            ru: "В Python у целых чисел нет предела, поэтому большое h не вызовет ошибки — но ответ станет «no», так как время выйдет за промежуток.",
          },
        ],
      },
      {
        /* The p.6 oral check, unchanged in intent and now answerable: the
           renderer gives it a real response control instead of a dead card. */
        id: "m1.as.b4",
        type: "verify",
        mode: "oral_explanation",
        skillRefs: ["cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Мұғалімге қысқаша айт: түзетілген бағдарламада `or` орнына неге `and` тұруы керек? Шарт өзгерсе не бұзылады?",
          ru: "Коротко объясни учителю: почему в исправленной программе должно стоять `and`, а не `or`? Что сломается, если изменить условие?",
        },
        expectedPoints: [
          {
            kk: "`or` — екі шарттың біреуі жеткілікті, сондықтан қатысуы нашар оқушы да өтіп кетеді. `and` — екеуі де орындалуы керек.",
            ru: "`or` — достаточно одного из условий, поэтому проходит и ученик с плохой посещаемостью. `and` требует выполнения обоих.",
          },
        ],
      },
    ],
  },
};
