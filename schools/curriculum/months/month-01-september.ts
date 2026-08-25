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
  {
    id: "m1.l2.b1",
    type: "concept",
    skillRefs: ["io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Бір жолдағы бірнеше сан", ru: "Несколько чисел в одной строке" },
    body: {
      kk: "Егер бір жолда бірнеше сан бос орынмен бөлініп берілсе, оларды `split()` арқылы бөліп, әрқайсысын санға айналдырамыз.",
      ru: "Если в одной строке несколько чисел через пробел, разделяем их через `split()` и каждое преобразуем в число.",
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
  {
    id: "m1.l2.b3",
    type: "write_code",
    skillRefs: ["io.read", "arith.basic"],
    sourceType: "product-authored",
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
    body: {
      kk: "`//` — бүтін бөлу, бөлшек бөлігін тастайды. `%` — қалдық. Бұл екеуі бірге «толық неше рет сыйды және неше қалды» деген сұраққа жауап береді.",
      ru: "`//` — целочисленное деление, отбрасывает дробную часть. `%` — остаток. Вместе они отвечают на вопрос «сколько раз поместилось целиком и сколько осталось».",
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
      kk: "17 конфетті 5 балаға бөлгенде не болатынын қадамдап көр.",
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
    id: "m1.l3.b5",
    type: "write_code",
    skillRefs: ["arith.remainder", "cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "Сан жұп па, тақ па? «even» немесе «odd» шығар.",
      ru: "Число чётное или нечётное? Выведи «even» или «odd».",
    },
    referenceSolution:
      'n = int(input())\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
    cases: [
      { input: "4", expectedOutput: "even" },
      { input: "7", expectedOutput: "odd" },
      { input: "0", expectedOutput: "even", hidden: true },
      { input: "-3", expectedOutput: "odd", hidden: true },
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
    code: 'n = int(input())\nif n > 0:\n    print("оң")\nelse:\n    print("оң емес")',
  },
  {
    id: "m1.l4.b2",
    type: "trace_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "n = 5 болғанда бағдарламаны қағаздағыдай қадамдап орында.",
      ru: "Выполни программу пошагово, как на бумаге, при n = 5.",
    },
    code: "n = 5\nx = 0\nif n > 3:\n    x = n * 2\nelse:\n    x = n + 2\nprint(x)",
    steps: [
      { line: 1, vars: { n: "5" } },
      { line: 2, vars: { n: "5", x: "0" } },
      { line: 4, vars: { n: "5", x: "10" } },
      { line: 7, vars: { n: "5", x: "10" } },
    ],
  },
  {
    id: "m1.l4.b3",
    type: "reorder_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: сан оқылады, ол 100-ден үлкен болса «көп», әйтпесе «аз» шығады.",
      ru: "Расставь строки: читается число, если оно больше 100 — «көп», иначе «аз».",
    },
    lines: [
      { id: "r1", code: "n = int(input())" },
      { id: "r2", code: "if n > 100:" },
      { id: "r3", code: '    print("көп")' },
      { id: "r4", code: "else:" },
      { id: "r5", code: '    print("аз")' },
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
    code: 'n = int(input())\nif n > 0:\n    print("оң")\nelif n < 0:\n    print("теріс")\nelse:\n    print("нөл")',
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
    id: "m1.l5.b3",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Баға беріледі (0–100). 85 және одан жоғары — «5», 70–84 — «4», 50–69 — «3», қалғаны — «2».",
      ru: "Дан балл (0–100). 85 и выше — «5», 70–84 — «4», 50–69 — «3», остальное — «2».",
    },
    referenceSolution:
      'b = int(input())\nif b >= 85:\n    print(5)\nelif b >= 70:\n    print(4)\nelif b >= 50:\n    print(3)\nelse:\n    print(2)',
    cases: [
      { input: "90", expectedOutput: "5" },
      { input: "85", expectedOutput: "5" },
      { input: "84", expectedOutput: "4", hidden: true },
      { input: "70", expectedOutput: "4", hidden: true },
      { input: "49", expectedOutput: "2", hidden: true },
      { input: "0", expectedOutput: "2", hidden: true },
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
    fixedCode:
      'b = int(input())\nif b >= 85:\n    print(5)\nelif b >= 70:\n    print(4)\nelse:\n    print(3)',
    diagnosticMapping: {
      "2": {
        failureClass: "strict_vs_inclusive_boundary",
        justification:
          "Дәл 85 мәні жоғалып тұр — бұл тек `>` мен `>=` шатасуынан болады.",
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
      kk: "«x 10-нан 20-ға дейін аралықта (шектерін қоса)» шартын қалай жазамыз?",
      ru: "Как записать условие «x в промежутке от 10 до 20 включительно»?",
    },
    options: [
      { id: "o1", label: { kk: "x >= 10 and x <= 20", ru: "x >= 10 and x <= 20" } },
      { id: "o2", label: { kk: "x >= 10 or x <= 20", ru: "x >= 10 or x <= 20" } },
      { id: "o3", label: { kk: "x > 10 and x < 20", ru: "x > 10 and x < 20" } },
      { id: "o4", label: { kk: "10 <= x <= 20 and not x", ru: "10 <= x <= 20 and not x" } },
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
    },
  },
  {
    id: "m1.l6.b3",
    type: "write_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
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
    sourceType: "curriculum-derived",
    pdfPage: P,
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
    cases: [
      { input: "18", expectedOutput: "ok" },
      { input: "17", expectedOutput: "no" },
      { input: "19", expectedOutput: "ok", hidden: true },
    ],
  },
  {
    id: "m1.l7.b4",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
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
      { input: "5 100", expectedOutput: "1", hidden: true },
      { input: "3 0", expectedOutput: "3", hidden: true },
    ],
  },
  {
    id: "m1.l8.b2",
    type: "challenge",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Тіктөртбұрышты бөлме мен есіктің өлшемдері беріледі. Шкафты (a×b) есіктен өткізуге бола ма? Шкафты бұруға болады.",
      ru: "Даны размеры шкафа и дверного проёма. Пройдёт ли шкаф (a×b) в проём? Шкаф можно поворачивать.",
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
    kk: "Санның соңғы цифрын шығар.",
    ru: "Выведи последнюю цифру числа.",
    skills: ["arith.remainder"],
    solution: "n = int(input())\nprint(abs(n) % 10)",
    cases: [
      { input: "1234", expectedOutput: "4" },
      { input: "5", expectedOutput: "5", hidden: true },
      { input: "-47", expectedOutput: "7", hidden: true },
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
    kk: "Нүктенің координаталары беріледі. Ол қай ширекте жатыр? Осьте жатса 0 шығар.",
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
    id: "m1.p8",
    kk: "Сағат тілі 12 сағаттық форматта. h сағат, m минут берілген. Тіл мен сан аралығындағы бұрыш неше градус? Бүтін бөлігін шығар.",
    ru: "Часы 12-часовые. Даны h часов и m минут. Каков угол между стрелками в градусах? Выведи целую часть.",
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
          8,
          [
            { kk: "Экранға мәтін мен санды шығару", ru: "Вывод текста и числа на экран" },
            { kk: "Енгізілген деректі санға айналдыру", ru: "Преобразование ввода в число" },
          ],
          ["io.print", "io.read", "types.int_float"],
          l1Blocks,
        ),
        lesson(
          "m1.l2",
          "Бір жолдағы бірнеше сан",
          "Несколько чисел в строке",
          7,
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
        lesson(
          "m1.l3",
          "Бүтін бөлу және қалдық",
          "Целочисленное деление и остаток",
          8,
          [
            { kk: "// және % амалдарын ажырату", ru: "Различать операции // и %" },
            { kk: "Қалдық арқылы жұп-тақты анықтау", ru: "Определять чётность через остаток" },
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
    description: {
      kk: "Жиырма минуттық шағын тексеріс: бұрын талданбаған екі есеп, бір қатені табу тапсырмасы және шешімді ауызша түсіндіру.",
      ru: "Короткая проверка на двадцать минут: две ранее не разобранные задачи, одно задание на поиск ошибки и устное объяснение решения.",
    },
    sourceType: "curriculum-derived",
    pdfPage: P,
    status: "implemented",
    blocks: [
      {
        id: "m1.as.b1",
        type: "verify",
        mode: "unseen_problem",
        skillRefs: ["cond.if_elif_else", "arith.remainder"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Үш сан беріледі. Олардың ішінде 3-ке бөлінетіні нешеу?",
          ru: "Даны три числа. Сколько из них делится на 3?",
        },
        referenceSolution:
          "a, b, c = map(int, input().split())\nk = 0\nif a % 3 == 0:\n    k += 1\nif b % 3 == 0:\n    k += 1\nif c % 3 == 0:\n    k += 1\nprint(k)",
        cases: [
          { input: "3 4 9", expectedOutput: "2" },
          { input: "1 2 4", expectedOutput: "0", hidden: true },
          { input: "0 3 6", expectedOutput: "3", hidden: true },
          { input: "-3 -6 5", expectedOutput: "2", hidden: true },
        ],
      },
      {
        id: "m1.as.b2",
        type: "verify",
        mode: "unseen_problem",
        skillRefs: ["logic.and_or_not", "debug.boundary"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Сағат пен минут беріледі. Уақыт 09:00 мен 17:30 аралығында ма (шектерін қоса)? «yes» немесе «no».",
          ru: "Даны часы и минуты. Время в промежутке 09:00–17:30 включительно? «yes» или «no».",
        },
        referenceSolution:
          'h, m = map(int, input().split())\nt = h * 60 + m\nif 9 * 60 <= t <= 17 * 60 + 30:\n    print("yes")\nelse:\n    print("no")',
        cases: [
          { input: "9 0", expectedOutput: "yes" },
          { input: "17 30", expectedOutput: "yes", hidden: true },
          { input: "17 31", expectedOutput: "no", hidden: true },
          { input: "8 59", expectedOutput: "no", hidden: true },
          { input: "12 0", expectedOutput: "yes", hidden: true },
        ],
      },
      {
        id: "m1.as.b3",
        type: "verify",
        mode: "find_bug",
        skillRefs: ["debug.boundary", "cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Бұл бағдарлама теріс сандарды дұрыс өңдемейді. Қатені тауып түзет.",
          ru: "Программа неверно обрабатывает отрицательные числа. Найди и исправь ошибку.",
        },
        referenceSolution:
          'n = int(input())\nif n > 0:\n    print("оң")\nelif n < 0:\n    print("теріс")\nelse:\n    print("нөл")',
      },
      {
        id: "m1.as.b4",
        type: "verify",
        mode: "oral_explanation",
        skillRefs: ["cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Соңғы есептегі шешіміңнің неге дұрыс екенін мұғалімге түсіндір. Шарт өзгерсе не бұзылар еді?",
          ru: "Объясни учителю, почему твоё решение последней задачи верно. Что сломается, если изменить условие?",
        },
      },
    ],
  },
};
