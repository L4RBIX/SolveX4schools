import type { LessonBlock } from "../../types";

/**
 * Lesson m2.l1 · «for циклі» — the first repetition a learner ever writes.
 * PDF p.7, October. Skills: `loops.for`, `loops.counter`.
 *
 * September ended at `if`/`elif`/`else`. Nothing before this block sequence has
 * repeated a single line, so the lesson is built around one idea and one
 * hazard:
 *
 *   the idea    — `for i in range(a, b)` runs the body b − a times;
 *   the hazard  — «соңғы элементті өткізіп жіберу», one of the four typical
 *                 errors the programme names for this month (p.7).
 *
 * That is why the endpoint is attacked from four directions before anyone is
 * asked to write a loop from scratch: a prediction on the last value of `i`, a
 * hand trace of the counter, a multiple choice on the number of passes, and a
 * fill-blank that is nothing BUT the two bounds. The write_code that follows
 * («1-ден n-ге дейінгі қосынды», named verbatim in the practice list) then
 * fails on `range(1, n)` at the very first visible case rather than on a hidden
 * one, so the learner meets the off-by-one with the sample in front of them.
 *
 * `s = s + i` is written out rather than `s += i`. Both are October's, but the
 * long form is what the hand trace shows, and a first loop lesson should not
 * introduce a second new symbol in the line where the accumulation happens.
 */

export const M2_L1: LessonBlock[] = [
  {
    id: "m2.l1.b1",
    type: "concept",
    skillRefs: ["loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "for циклі: бір әрекетті бірнеше рет",
      ru: "Цикл for: одно действие несколько раз",
    },
    /* The body has to answer "why is b missing?" and not merely state it. The
       answer given here is the countable one — b − a is exactly the number of
       steps — because a rule a learner can check by counting survives longer
       than a rule they were told to remember. */
    body: {
      kk: "`for` циклі бір әрекетті бірнеше рет орындайды: бірдей жолды қайта-қайта көшіріп жазудың қажеті жоқ. `range(3)` дегеніміз — 0, 1, 2 сандары: үшеу, ал 3-тің өзі олардың ішінде жоқ. Жалпы түрі — `range(a, b)`: цикл a-дан басталады да, b-ге ЖЕТПЕЙ тоқтайды. Неге солай? Себебі сонда сандардың саны дәл b − a болады: `range(2, 5)` — үш сан (2, 3, 4), `range(0, 5)` — бес сан. Циклге тиесілі жолдар шегініспен жазылады, `if`-тегідей.",
      ru: "Цикл `for` выполняет одно действие несколько раз: не нужно копировать одну и ту же строку снова и снова. `range(3)` — это числа 0, 1, 2: их три, а самой тройки среди них нет. Общий вид — `range(a, b)`: цикл начинается с a и останавливается, НЕ ДОЙДЯ до b. Почему так? Потому что тогда чисел получается ровно b − a: `range(2, 5)` — три числа (2, 3, 4), `range(0, 5)` — пять. Строки, относящиеся к циклу, пишутся с отступом, как в `if`.",
    },
    code: "for i in range(3):\n    print(i)      # 0, 1, 2\n\nfor i in range(2, 5):\n    print(i)      # 2, 3, 4",
  },
  {
    id: "m2.l1.b2",
    type: "prediction",
    skillRefs: ["loops.for", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Цикл аяқталғаннан кейін `last` айнымалысында қандай сан қалады?",
      ru: "Какое число останется в переменной `last` после окончания цикла?",
    },
    code: "last = 0\nfor i in range(1, 5):\n    last = i\nprint(last)",
    answer: "4",
    options: ["1", "3", "4", "5"],
    diagnosticMapping: {
      /* 5 has exactly one route: believing `range(1, 5)` reaches 5. No other
         reading of this program produces it — the loop body does nothing but
         copy `i`, so the printed value IS the last value `i` took. */
      "5": {
        failureClass: "range_endpoint_included",
        justification:
          "5 деген жауап `range(1, 5)` бесті де қамтиды деп ойлағанда ғана шығады. Цикл денесі `i`-ді көшіруден басқа ештеңе істемейді, сондықтан шыққан сан — `i`-дің соңғы мәні, ал ол 4.",
      },
    },
  },
  {
    id: "m2.l1.b3",
    type: "trace_code",
    skillRefs: ["loops.for", "loops.counter"],
    /* «Басты құрал - бағдарламаның қадамдық орындалуы: әр қадамда цикл
       айнымалысының ... мәні көрсетіледі» (p.7). The hand trace is the
       programme's own instrument for this month, not an authoring choice. */
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Цикл денесі әр рет орындалып болғаннан кейінгі мәндерді жаз. Соңғы жол — циклден кейін орындалатын `print`.",
      ru: "Запиши значения после каждого прохода тела цикла. Последняя строка — `print`, который выполняется уже после цикла.",
    },
    code: "c = 0\nfor i in range(2, 6):\n    c = c + 1\nprint(c)",
    /* One row per pass of the body, not one row per executed line: the point of
       the trace is that `i` stops at 5 and the body runs 6 − 2 = 4 times, and
       eight rows of a two-line body would bury it. */
    steps: [
      { line: 1, vars: { c: "0" } },
      { line: 3, vars: { i: "2", c: "1" } },
      { line: 3, vars: { i: "3", c: "2" } },
      { line: 3, vars: { i: "4", c: "3" } },
      { line: 3, vars: { i: "5", c: "4" } },
      { line: 4, vars: { i: "5", c: "4" } },
    ],
  },
  {
    id: "m2.l1.b4",
    type: "multiple_choice",
    skillRefs: ["loops.for", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл циклдің денесі неше рет орындалады?",
      ru: "Сколько раз выполнится тело этого цикла?",
    },
    code: "for i in range(3, 10):\n    print(i)",
    options: [
      { id: "o1", label: { kk: "6 рет", ru: "6 раз" } },
      { id: "o2", label: { kk: "7 рет", ru: "7 раз" } },
      { id: "o3", label: { kk: "8 рет", ru: "8 раз" } },
      { id: "o4", label: { kk: "10 рет", ru: "10 раз" } },
    ],
    correctOptionId: "o2",
    /* o1 (6) carries no mapping on purpose. Two different mistakes land on it —
       excluding the start as well as the end, and computing 9 − 3 without the
       +1 — so naming one of them would be telling a fourteen-year-old something
       about their own thinking that we cannot know. The engine asks instead. */
    diagnosticMapping: {
      o3: {
        failureClass: "range_endpoint_included",
        justification:
          "8 — бұл 3-тен 10-ға дейінгі сандарды 10-ды ҚОСА санағанда шығатын нәтиже. `range(3, 10)` 10-ға жетпей тоқтайды, сондықтан сандар 3-тен 9-ға дейін, яғни 7 рет.",
      },
      o4: {
        failureClass: "range_start_ignored",
        justification:
          "10 рет деу — `range(3, 10)` жазуын `range(10)` деп оқығанды білдіреді. Мұндағы бірінші сан циклдің қайдан басталатынын көрсетеді, ал 10 деген жауап оны мүлде ескермеген.",
      },
    },
  },
  {
    id: "m2.l1.b5",
    type: "fill_blank",
    skillRefs: ["loops.for", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "n оқылады. Бағдарлама 1-ден n-ге дейінгі әр санды жеке жолға шығаруы керек. `range` шекараларын қой. n = 4 болғанда 1, 2, 3, 4 шығуы тиіс.",
      ru: "Читается n. Программа должна вывести числа от 1 до n, каждое на отдельной строке. Расставь границы `range`. При n = 4 должно вывестись 1, 2, 3, 4.",
    },
    template: "n = int(input())\nfor i in range(___, ___):\n    print(i)",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "n + 1", alternatives: ["n+1"] },
    ],
  },
  {
    id: "m2.l1.b6",
    type: "reorder_code",
    skillRefs: ["loops.for"],
    sourceType: "product-authored",
    /* The whole difficulty is the last line. `print("done")` carries no
       indentation, so wherever it lands it is outside the loop — and the only
       position where "outside" also means "once, at the end" is fourth. A
       learner who has not yet separated the loop's body from what follows it
       puts it third, ahead of the indented line, and the sequence check says so. */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: алдымен n оқылады, содан кейін 1-ден n-ге дейінгі әр санның квадраты жеке жолға шығады, ал ең соңында бір-ақ рет `done` сөзі шығады.",
      ru: "Расставь строки по порядку: сначала читается n, затем для каждого числа от 1 до n выводится его квадрат на отдельной строке, а в самом конце ровно один раз выводится слово `done`.",
    },
    lines: [
      { id: "q1", code: "n = int(input())" },
      { id: "q2", code: "for i in range(1, n + 1):" },
      { id: "q3", code: "    print(i * i)" },
      { id: "q4", code: 'print("done")' },
    ],
    correctOrder: ["q1", "q2", "q3", "q4"],
  },
  {
    id: "m2.l1.b7",
    type: "worked_example",
    skillRefs: ["loops.for", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Толық талданған мысал: 1-ден n-ге дейінгі қосынды",
      ru: "Разобранный пример: сумма от 1 до n",
    },
    problem: {
      kk: "n беріледі. 1 + 2 + … + n қосындысын шығар. Мысалы n = 5 болса, жауап 15.",
      ru: "Дано n. Выведи сумму 1 + 2 + … + n. Например, при n = 5 ответ 15.",
    },
    /* Two of October's four named typical errors are addressed here before the
       learner writes anything: «жинақтаушы айнымалыға қате бастапқы мән беру»
       (step 2) and «соңғы элементті өткізіп жіберу» (step 3). Step 5 covers the
       indentation slip that turns one answer into n lines. */
    steps: [
      {
        kk: "Қосындыны бір амалмен жаза алмаймыз: n қандай сан болатыны алдын ала белгісіз. Сондықтан сандарды бір-бірлеп қосамыз.",
        ru: "Записать сумму одним действием нельзя: заранее неизвестно, каким будет n. Поэтому складываем числа по одному.",
      },
      {
        kk: "Нәтижені жинайтын айнымалы керек. Оны цикл БАСТАЛҒАНҒА ДЕЙІН 0 деп қоямыз — әзірге бірде-бір сан қосылған жоқ. Егер `s = 0` цикл ішінде тұрса, әр қадамда қосынды қайтадан нөлге түсіп отырады.",
        ru: "Нужна переменная, которая копит результат. Ставим её в 0 ДО начала цикла — пока не прибавлено ни одного числа. Если `s = 0` окажется внутри цикла, сумма будет обнуляться на каждом шаге.",
      },
      {
        kk: "Цикл 1-ден n-ге дейін, n-ді ҚОСА жүруі керек. Ал `range(1, n)` n-ге жетпей тоқтайды, сондықтан `range(1, n + 1)` деп жазамыз.",
        ru: "Цикл должен пройти от 1 до n ВКЛЮЧИТЕЛЬНО. А `range(1, n)` останавливается, не дойдя до n, поэтому пишем `range(1, n + 1)`.",
      },
      {
        kk: "Әр қадамда ағымдағы `i` қосындыға қосылады. n = 5 үшін `s` былай өзгереді: 1, 3, 6, 10, 15.",
        ru: "На каждом шаге текущее `i` прибавляется к сумме. При n = 5 `s` меняется так: 1, 3, 6, 10, 15.",
      },
      {
        kk: "`print(s)` циклден кейін, шегініссіз жазылады. Шегініспен жазсақ, ол цикл денесіне кіріп кетеді де, бір жауаптың орнына бес жол шығады.",
        ru: "`print(s)` пишется после цикла, без отступа. С отступом он попал бы в тело цикла, и вместо одного ответа вывелось бы пять строк.",
      },
    ],
    code: "n = int(input())\ns = 0\nfor i in range(1, n + 1):\n    s = s + i\nprint(s)",
    result: { kk: "5 енгізгенде: 15", ru: "При вводе 5: 15" },
  },
  {
    /* SUPPORT SUBSTITUTION for m2.l1.b8 — the same problem, assembled instead of
       written. «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
       азырақ» (p.6). The three blanks are exactly the three decisions the task
       is made of: where the accumulator starts, where the range ends, and what
       happens to `s` each pass. Nothing else is withheld from this route. */
    id: "m2.l1.b8s",
    type: "fill_blank",
    skillRefs: ["loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    /*
     * The twin of `m2.l1.b8`, on b8's statement — the sum of squares — and no
     * longer on the worked example's.
     *
     * It used to be the 1..n sum, whose filled-in form was the program `b7`
     * prints on the previous card, and whose first two answers b7's own
     * reasoning states in words («цикл БАСТАЛҒАНҒА ДЕЙІН 0 деп қоямыз»,
     * «`range(1, n + 1)` деп жазамыз»). Support's one encounter with the month's
     * headline family was therefore transcription with the answers supplied.
     *
     * The third blank is the one that carries the work now: `i * i` cannot be
     * read off b7, and a learner who writes `i` there fails the visible sample
     * exactly as `b8` does. The first two remain the accumulator and the
     * inclusive bound, which is the principle b7 exists to teach and which the
     * learner is supposed to be able to apply.
     */
    prompt: {
      kk: "Алдыңғы есептің дәл өзі: квадраттардың қосындысы. Құрылымы дайын — үш орынды толтыр. Циклге дейін қосынды неден басталады, `range` қай санға дейін жетуі керек және әр қадамда `s`-ке нені қосамыз? Есіңде болсын: санның өзін емес, квадратын.",
      ru: "Та же задача, что и в предыдущем задании: сумма квадратов. Структура готова — заполни три места. С чего начинается сумма до цикла, до какого числа должен дойти `range` и что именно прибавляем к `s` на каждом шаге? Помни: не само число, а его квадрат.",
    },
    template:
      "n = int(input())\ns = ___\nfor i in range(1, ___):\n    s = s + ___\nprint(s)",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "n + 1", alternatives: ["n+1"] },
      { id: "f3", answer: "i * i", alternatives: ["i*i", "i ** 2", "i**2"] },
    ],
  },
  {
    id: "m2.l1.b8",
    type: "write_code",
    skillRefs: ["loops.for", "loops.accumulator"],
    /*
     * A sibling of «1-ден n-ге дейінгі қосынды», not the family itself — hence
     * product-authored, and the distinction is load-bearing.
     *
     * This task WAS the plain 1..n sum, and its reference solution was
     * byte-identical to the program `m2.l1.b7` prints one card earlier, whose
     * own reasoning steps state two of the three things the support twin then
     * asked the learner to fill in. Both routes were transcribing a program
     * from the previous screen: for core and advanced the copy was five lines,
     * for support it was three tokens with two of the answers written out in
     * prose above them. That is the modelled program handed back as the
     * exercise.
     *
     * Squaring the term keeps the whole of the modelled reasoning applicable —
     * initialise before the loop, `range(1, n + 1)` to include n, accumulate
     * inside — while making the program genuinely different, and it puts the
     * copy-the-model failure on the VISIBLE sample: a learner who reproduces
     * b7 exactly prints 15 where 55 is expected, and can see why.
     *
     * The named family keeps an independent task of its own at `m2.p2`, which
     * is the a..b sum with a = 1 as its first case, unscaffolded and open to
     * all three routes.
     */
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір бүтін сан n беріледі (1 ≤ n ≤ 1000). 1² + 2² + … + n² қосындысын шығар — яғни әр санның өзін емес, квадратын қос. Мысалы n = 5 болса, 1 + 4 + 9 + 16 + 25 = 55.",
      ru: "Дано целое число n (1 ≤ n ≤ 1000). Выведи сумму 1² + 2² + … + n² — то есть складывай не сами числа, а их квадраты. Например, при n = 5 получится 1 + 4 + 9 + 16 + 25 = 55.",
    },
    referenceSolution:
      "n = int(input())\ns = 0\nfor i in range(1, n + 1):\n    s = s + i * i\nprint(s)",
    /* The visible sample carries three signature errors in the open. Copying
       b7's program unchanged prints 15 instead of 55 — the mistake this task
       was rewritten to catch, caught where the learner can see it. `range(1, n)`
       prints 30, and `s = 0` moved inside the loop prints 25. n = 1 then kills a
       range starting at 2 (prints 0) and an accumulator initialised to 1
       (prints 2); n = 1000 is the top of the stated bound, so the promise is
       tested rather than merely described. */
    cases: [
      { input: "5", expectedOutput: "55" },
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "5", hidden: true },
      { input: "3", expectedOutput: "14", hidden: true },
      { input: "10", expectedOutput: "385", hidden: true },
      { input: "100", expectedOutput: "338350", hidden: true },
      { input: "1000", expectedOutput: "333833500", hidden: true },
    ],
  },
  {
    id: "m2.l1.b9",
    type: "write_code",
    skillRefs: ["loops.for", "loops.counter", "arith.remainder", "cond.if_elif_else"],
    sourceType: "product-authored",
    /* The counter, separated from the accumulator: here the loop variable is not
       added to anything, it is only TESTED, and the variable that grows grows by
       one. Lesson 2 takes the accumulator further; this is the pair the learner
       has to be able to tell apart by the end of the month. */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген екі бүтін сан n мен k беріледі (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000). 1-ден n-ге дейінгі сандардың ішінде k-ға қалдықсыз бөлінетіні нешеу? Тек сол санды шығар.",
      ru: "В одной строке через пробел даны два целых числа n и k (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000). Сколько чисел от 1 до n делятся на k без остатка? Выведи только это количество.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\nc = 0\nfor i in range(1, n + 1):\n    if i % k == 0:\n        c = c + 1\nprint(c)",
    /* «10 3» alone kills two wrong loops in the open: `range(n)` counts 0 as a
       multiple and answers 4, and a `c = 0` dragged inside the body answers 0.
       The missing last step needs n to be a multiple of k to show at all, which
       is what «10 1» (visible, 9 instead of 10) and the hidden «9 3», «1 1»,
       «12 12» are for. «5 7» is the empty answer: nothing in 1..5 divides by 7,
       so the 0 can only come from the counter existing before the loop. */
    cases: [
      { input: "10 3", expectedOutput: "3" },
      { input: "10 1", expectedOutput: "10" },
      { input: "9 3", expectedOutput: "3", hidden: true },
      { input: "5 7", expectedOutput: "0", hidden: true },
      { input: "1 1", expectedOutput: "1", hidden: true },
      { input: "12 12", expectedOutput: "1", hidden: true },
      { input: "1000 7", expectedOutput: "142", hidden: true },
    ],
  },
];
