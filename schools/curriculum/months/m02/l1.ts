import type { LessonBlock } from "../../types";

/**
 * Lesson m2.l1 · «for циклі» — the first repetition a learner ever writes.
 * PDF p.7, October. Skills: `loops.for`, `loops.counter`.
 *
 * September ended at `if` / `else if` / `else` and the whole `int main()` frame
 * written unaided. Nothing before this block sequence has repeated a single
 * line, so the lesson is built around one idea and one hazard:
 *
 *   the idea    — `for (int i = a; i < b; i++)` runs the body b − a times;
 *   the hazard  — «соңғы элементті өткізіп жіберу», one of the four typical
 *                 errors the programme names for this month (p.7).
 *
 * ## What the C++ form changed, and what it did not
 *
 * Python's `range(a, b)` hid the endpoint decision inside a function call: the
 * learner had to be told that `b` is excluded. C++ writes the decision out —
 * `i < b` or `i <= b` is a comparison the learner reads and chooses — so the
 * hazard is the same hazard and it is now visible in the source rather than in
 * a rule about a library. Every block below that used to attack `range`'s
 * missing endpoint now attacks the comparison operator, which is the same
 * off-by-one wearing an honest face.
 *
 * Two consequences worth stating before editing this file:
 *
 * 1. **`i` does not survive the loop.** `for (int i = ...)` declares `i` inside
 *    the loop, and after the closing brace the name is gone. The Python trace
 *    at b3 recorded `i = 5` on the line after the loop; the C++ trace cannot,
 *    and the prompt says so — a learner who writes `cout << i;` after the loop
 *    gets a compile error, and meeting that here beats meeting it in a task.
 *
 * 2. **The body's braces replace the indentation.** b6 used to turn on where
 *    `print("done")` was indented. It now turns on which side of `}` it lands,
 *    which is the same decision and the one C++ actually grades.
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
    /* The body has to answer "how many times does this run?" and not merely
       state it. The answer given here is the countable one — b − a is exactly
       the number of steps — because a rule a learner can check by counting
       survives longer than a rule they were told to remember.

       That rule used to be stated with no condition on it, and b − a is simply
       wrong when b is below a: `for (int i = 5; i < 2; i++)` runs zero times,
       not −3 times. The month cannot afford the sloppy version, because it
       later charges the learner for exactly this case: `m2.l8.b3` asks which of
       n = 1, 2, 4, 9 a primality check gets wrong, and the answer is n = 1 only
       because `i <= 1 / 2` is `i <= 0` and the loop never starts — reasoning
       `m2.l8.b1` step 2 spells out in words. So the condition is named here, on
       the first card that makes the claim, rather than contradicted seven
       lessons later. */
    body: {
      kk: "`for` циклі бір әрекетті бірнеше рет орындайды: бірдей жолды қайта-қайта көшіріп жазудың қажеті жоқ. Дөңгелек жақшаның ішінде нүктелі үтірмен бөлінген үш бөлік тұр: `int i = 0` — санағыш қайдан басталады, `i < 3` — цикл қай кезде жалғаса береді, `i++` — әр айналымнан кейін санағышқа не болады. `i++` дегеніміз «i-ді бірге өсір» дегеннің қысқа жазылуы.\n\nСондықтан `for (int i = 0; i < 3; i++)` дегеніміз — 0, 1, 2 сандары: үшеу, ал 3-тің өзі олардың ішінде жоқ, себебі `3 < 3` шарты жалған. Жалпы түрі — `for (int i = a; i < b; i++)`: цикл a-дан басталады да, b-ге ЖЕТПЕЙ тоқтайды. Неге солай? Себебі b ≥ a болғанда қадам саны дәл b − a болады: `i = 2` мен `i < 5` — үш қадам (2, 3, 4), `i = 0` мен `i < 5` — бес қадам. Ал b ≤ a болса, цикл бір рет те айналмайды: `i = 5` мен `i < 2` бірден жалған, сондықтан дене мүлде орындалмайды.\n\nЦиклге тиесілі жолдар фигуралы жақшаның `{ }` ішінде жазылады — `if`-тегідей.",
      ru: "Цикл `for` выполняет одно действие несколько раз: не нужно копировать одну и ту же строку снова и снова. В круглых скобках через точку с запятой стоят три части: `int i = 0` — с чего начинается счётчик, `i < 3` — пока какое условие верно, цикл продолжается, `i++` — что происходит со счётчиком после каждого прохода. Запись `i++` — это короткий способ сказать «увеличь i на единицу».\n\nПоэтому `for (int i = 0; i < 3; i++)` — это числа 0, 1, 2: их три, а самой тройки среди них нет, ведь условие `3 < 3` ложно. Общий вид — `for (int i = a; i < b; i++)`: цикл начинается с a и останавливается, НЕ ДОЙДЯ до b. Почему так? Потому что при b ≥ a шагов получается ровно b − a: `i = 2` с условием `i < 5` — три шага (2, 3, 4), `i = 0` с `i < 5` — пять. А если b ≤ a, цикл не сделает ни одного прохода: `i = 5` с условием `i < 2` ложно сразу, и тело не выполнится вовсе.\n\nСтроки, относящиеся к циклу, пишутся внутри фигурных скобок `{ }` — как в `if`.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    for (int i = 0; i < 3; i++) {\n" +
      "        cout << i << endl;\n" +
      "    }\n" +
      "    for (int i = 2; i < 5; i++) {\n" +
      "        cout << i << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
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
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int last = 0;\n" +
      "    for (int i = 1; i < 5; i++) {\n" +
      "        last = i;\n" +
      "    }\n" +
      "    cout << last;\n" +
      "    return 0;\n" +
      "}",
    answer: "4",
    options: ["1", "3", "4", "5"],
    diagnosticMapping: {
      /* 5 has exactly one route: believing `i < 5` lets `i` reach 5. No other
         reading of this program produces it — the loop body does nothing but
         copy `i`, so the printed value IS the last value `i` took. */
      "5": {
        failureClass: "range_endpoint_included",
        justification:
          "5 деген жауап `i < 5` шарты бесті де қамтиды деп ойлағанда ғана шығады. Ал `i` бес болғанда `5 < 5` жалған, сондықтан дене орындалмайды. Цикл денесі `i`-ді көшіруден басқа ештеңе істемейді, сондықтан шыққан сан — `i`-дің соңғы мәні, ал ол 4.",
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
      kk: "Цикл денесі әр рет орындалып болғаннан кейінгі мәндерді жаз. Соңғы жол — циклден кейінгі `cout`. Онда `i` неге жазылмаған? Себебі `i` циклдің дөңгелек жақшасында жарияланған: жабылатын `}` таңбасынан кейін ол айнымалы мүлде жоқ.",
      ru: "Запиши значения после каждого прохода тела цикла. Последняя строка — `cout` уже после цикла. Почему в ней нет `i`? Потому что `i` объявлена в круглых скобках цикла: после закрывающей `}` такой переменной больше не существует.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int c = 0;\n" +
      "    for (int i = 2; i < 6; i++) {\n" +
      "        c = c + 1;\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    /* One row per pass of the body, not one row per executed line: the point of
       the trace is that `i` stops at 5 and the body runs 6 − 2 = 4 times, and
       eight rows of a two-line body would bury it. The final row carries no
       `i`, and that is not an omission — see the prompt. */
    steps: [
      { line: 5, vars: { c: "0" } },
      { line: 7, vars: { i: "2", c: "1" } },
      { line: 7, vars: { i: "3", c: "2" } },
      { line: 7, vars: { i: "4", c: "3" } },
      { line: 7, vars: { i: "5", c: "4" } },
      { line: 9, vars: { c: "4" } },
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
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    for (int i = 3; i < 10; i++) {\n" +
      "        cout << i << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
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
          "8 — бұл 3-тен 10-ға дейінгі сандарды 10-ды ҚОСА санағанда шығатын нәтиже. Шарт `i < 10` деп жазылған, сондықтан цикл 10-ға жетпей тоқтайды: сандар 3-тен 9-ға дейін, яғни 7 рет.",
      },
      o4: {
        failureClass: "range_start_ignored",
        justification:
          "10 рет деу — санағыштың бастапқы мәнін мүлде ескермегенді білдіреді. `int i = 3` дегені циклдің үштен басталатынын көрсетеді, ал 10 деген жауап оны нөлден басталады деп оқығанда ғана шығады.",
      },
    },
  },
  {
    id: "m2.l1.b5",
    type: "fill_blank",
    skillRefs: ["loops.for", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "n оқылады. Бағдарлама 1-ден n-ге дейінгі әр санды жеке жолға шығаруы керек. Санағыштың бастапқы мәнін және циклдің шартын қой. n = 4 болғанда 1, 2, 3, 4 шығуы тиіс — яғни n-нің өзі де шығады.",
      ru: "Читается n. Программа должна вывести числа от 1 до n, каждое на отдельной строке. Поставь начальное значение счётчика и условие цикла. При n = 4 должно вывестись 1, 2, 3, 4 — то есть само n тоже выводится.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = ___; i ___ n; i++) {\n" +
      "        cout << i << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "<=" },
    ],
  },
  {
    id: "m2.l1.b6",
    type: "reorder_code",
    skillRefs: ["loops.for"],
    sourceType: "product-authored",
    /* The whole difficulty is the last two cards. `cout << "done";` has to land
       AFTER the loop's closing brace, and the only position where "after the
       brace" also means "once, at the end" is between `}` and `return 0;`. A
       learner who has not yet separated the loop's body from what follows it
       puts it before the brace, and the sequence check says so.

       The frame arrives as two cards rather than five, for the reason
       docs/cpp17/CPP17_PEDAGOGY.md gives: the ceremony is given, not ordered.
       Splitting `#include` from `using namespace std;` would make this a task
       about the shape of a translation unit, which is l7's subject in
       September, not October's. */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: алдымен n оқылады, содан кейін 1-ден n-ге дейінгі әр санның квадраты жеке жолға шығады, ал ең соңында бір-ақ рет `done` сөзі шығады. Циклдің жабылатын фигуралы жақшасы қай жерде тұруы керегіне мұқият бол: `done` сол жақшадан кейін жазылмаса, ол әр қадамда қайталанып шығады.",
      ru: "Расставь строки по порядку: сначала читается n, затем для каждого числа от 1 до n выводится его квадрат на отдельной строке, а в самом конце ровно один раз выводится слово `done`. Внимательно посмотри, где должна стоять закрывающая фигурная скобка цикла: если `done` окажется до неё, он будет выводиться на каждом шаге.",
    },
    lines: [
      { id: "q1", code: "#include <iostream>\nusing namespace std;\n\nint main() {" },
      { id: "q2", code: "    int n;\n    cin >> n;" },
      { id: "q3", code: "    for (int i = 1; i <= n; i++) {" },
      { id: "q4", code: "        cout << i * i << endl;" },
      { id: "q5", code: "    }" },
      { id: "q6", code: '    cout << "done";' },
      { id: "q7", code: "    return 0;\n}" },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
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
       brace slip that turns one answer into n lines. */
    steps: [
      {
        kk: "Қосындыны бір амалмен жаза алмаймыз: n қандай сан болатыны алдын ала белгісіз. Сондықтан сандарды бір-бірлеп қосамыз.",
        ru: "Записать сумму одним действием нельзя: заранее неизвестно, каким будет n. Поэтому складываем числа по одному.",
      },
      {
        kk: "Нәтижені жинайтын айнымалы керек. Оны цикл БАСТАЛҒАНҒА ДЕЙІН жариялап, 0 деп қоямыз — әзірге бірде-бір сан қосылған жоқ. Егер `int s = 0;` цикл ішінде тұрса, әр қадамда жаңа `s` пайда болып, қосынды қайтадан нөлге түсіп отырады.",
        ru: "Нужна переменная, которая копит результат. Объявляем её ДО начала цикла и ставим в 0 — пока не прибавлено ни одного числа. Если `int s = 0;` окажется внутри цикла, на каждом шаге будет появляться новая `s` и сумма будет обнуляться.",
      },
      {
        kk: "Цикл 1-ден n-ге дейін, n-ді ҚОСА жүруі керек. Ал `i < n` деген шарт n-ге жетпей тоқтайды, сондықтан `i <= n` деп жазамыз. Дәл осы бір таңба — соңғы санды қосамыз ба, жоқ па дегенді шешеді.",
        ru: "Цикл должен пройти от 1 до n ВКЛЮЧИТЕЛЬНО. А условие `i < n` останавливается, не дойдя до n, поэтому пишем `i <= n`. Именно этот один знак решает, попадёт ли последнее число в сумму.",
      },
      {
        kk: "Әр қадамда ағымдағы `i` қосындыға қосылады. n = 5 үшін `s` былай өзгереді: 1, 3, 6, 10, 15.",
        ru: "На каждом шаге текущее `i` прибавляется к сумме. При n = 5 `s` меняется так: 1, 3, 6, 10, 15.",
      },
      {
        kk: "`cout << s;` циклдің жабылатын `}` таңбасынан КЕЙІН жазылады. Оны жақшаның ішіне қалдырсақ, бір жауаптың орнына бес жол шығады.",
        ru: "`cout << s;` пишется ПОСЛЕ закрывающей `}` цикла. Если оставить его внутри скобок, вместо одного ответа выведется пять строк.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s = s + i;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    stdin: "5",
    result: { kk: "5 енгізгенде: 15", ru: "При вводе 5: 15" },
  },
  {
    /* SUPPORT SUBSTITUTION for m2.l1.b8 — the same problem, assembled instead of
       written. «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
       азырақ» (p.6). The three blanks are exactly the three decisions the task
       is made of: where the accumulator starts, which comparison keeps n in,
       and what happens to `s` each pass. Nothing else is withheld from this
       route. */
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
     * reasoning states in words. Support's one encounter with the month's
     * headline family was therefore transcription with the answers supplied.
     *
     * The third blank is the one that carries the work now: `i * i` cannot be
     * read off b7, and a learner who writes `i` there gets 15 where the example
     * in this prompt says 55 — the same failure b8's first visible case shows
     * core and advanced. The first two remain the accumulator and the inclusive
     * comparison, which is the principle b7 exists to teach and which the
     * learner is supposed to be able to apply.
     */
    prompt: {
      kk: "Квадраттардың қосындысы. n беріледі, 1² + 2² + … + n² мәнін шығару керек: мысалы n = 5 болғанда 1 + 4 + 9 + 16 + 25 = 55. Құрылымы дайын — үш орынды толтыр. Циклге дейін қосынды неден басталады, циклдің шартында қандай салыстыру белгісі тұруы керек және әр қадамда `s`-ке нені қосамыз? Есіңде болсын: санның өзін емес, квадратын.",
      ru: "Сумма квадратов. Дано n, нужно вывести 1² + 2² + … + n²: например, при n = 5 получится 1 + 4 + 9 + 16 + 25 = 55. Структура готова — заполни три места. С чего начинается сумма до цикла, какой знак сравнения должен стоять в условии цикла и что именно прибавляем к `s` на каждом шаге? Помни: не само число, а его квадрат.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = ___;\n" +
      "    for (int i = 1; i ___ n; i++) {\n" +
      "        s = s + ___;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "<=" },
      { id: "f3", answer: "i * i", alternatives: ["i*i"] },
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
     * asked the learner to fill in. Squaring the term keeps the whole of the
     * modelled reasoning applicable — initialise before the loop, `i <= n` to
     * include n, accumulate inside — while making the program genuinely
     * different, and it puts the copy-the-model failure on the VISIBLE sample: a
     * learner who reproduces b7 exactly prints 15 where 55 is expected.
     *
     * The named family keeps an independent task of its own at `m2.p2`, which
     * is the a..b sum with a = 1 as its first case, unscaffolded and open to
     * all three routes.
     *
     * Bounds check for C++: the largest answer is n = 1000, whose sum of
     * squares is 333 833 500 — comfortably inside `int`, so no `long long` is
     * needed and none is smuggled in. See docs/cpp17/CPP17_PEDAGOGY.md, the
     * audit rule on bounds.
     */
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір бүтін сан n беріледі (1 ≤ n ≤ 1000). 1² + 2² + … + n² қосындысын шығар — яғни әр санның өзін емес, квадратын қос. Мысалы n = 5 болса, 1 + 4 + 9 + 16 + 25 = 55.",
      ru: "Дано целое число n (1 ≤ n ≤ 1000). Выведи сумму 1² + 2² + … + n² — то есть складывай не сами числа, а их квадраты. Например, при n = 5 получится 1 + 4 + 9 + 16 + 25 = 55.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s = s + i * i;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    /* The visible sample carries three signature errors in the open. Copying
       b7's program unchanged prints 15 instead of 55 — the mistake this task
       was rewritten to catch, caught where the learner can see it. `i < n`
       prints 30, and `int s = 0;` moved inside the loop does not even compile,
       which is a louder failure than Python's 25 and an honest one. n = 1 then
       kills a loop starting at 2 (prints 0) and an accumulator initialised to 1
       (prints 2); n = 1000 is the top of the stated bound. */
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
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, k;\n" +
      "    cin >> n >> k;\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        if (i % k == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    /* «10 3» alone kills a loop written from 0 in the open: it counts 0 as a
       multiple and answers 4. The missing last step needs n to be a multiple of
       k to show at all, which is what «10 1» (visible, 9 instead of 10) and the
       hidden «9 3», «1 1», «12 12» are for. «5 7» is the empty answer: nothing
       in 1..5 divides by 7, so the 0 can only come from the counter existing
       before the loop. */
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
