import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан — lesson 2 · «Жинақтаушы айнымалы» / «Накопитель». PDF p.7.
 *
 * One idea: the value that survives the loop is declared BEFORE the loop, and a
 * sum is not a counter. Those are the lesson's two stated objectives and every
 * block below serves one of them.
 *
 * The PDF's October paragraph names four typical errors, and one of them is
 * «жинақтаушы айнымалыға қате бастапқы мән беру» — a wrong initial value for
 * the accumulator. So this lesson does not merely mention it: `b3` predicts a
 * program whose accumulator starts at 1, and `b4` breaks one by moving the
 * reset inside the loop. Both are curriculum subjects, not invented drills.
 *
 * ## Three authoring decisions worth reading before editing this file
 *
 * 1. **Reading several numbers is introduced by the worked example, not by a
 *    task.** Python read a whole line and split it; C++ has no split, and the
 *    honest beginner form is «how many, then that many»: `cin >> n`, then a
 *    loop that does `cin >> x` once per pass. A learner meets that shape first
 *    in `b2`, where a reasoning step says why the numbers do not have to be
 *    stored anywhere. A task must never be the first place a construct appears,
 *    so `b5` and `b7` come after it.
 *
 * 2. **No `vector` yet.** Every program here reads one number, uses it and
 *    forgets it. That is not a limitation to apologise for — it is the exact
 *    reason a counter and an accumulator are worth having, and `vector` arrives
 *    at l4 where a task genuinely needs to look at a number twice.
 *
 * 3. **The general digit sum is deliberately absent.** Peeling digits off a
 *    number with `/ 10` and `% 10` needs `while`, which is lesson 3. Doing it
 *    here would either smuggle `while` in early or fake it with a fixed number
 *    of `for` steps, which is worse: it teaches a rule that breaks on the first
 *    number of a different length. October's digit sum is the one whose digits
 *    are handed over already separated; lesson 3 owns the other form.
 *
 * `s += x` written by hand IS the thing being taught — no library aggregate
 * stands in for it anywhere in the month.
 */

const P = 7;

export const M2_L2: LessonBlock[] = [
  {
    id: "m2.l2.b1",
    type: "concept",
    skillRefs: ["loops.accumulator", "loops.counter"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Жинақтаушы айнымалы және санағыш",
      ru: "Накопитель и счётчик",
    },
    body: {
      kk: "Цикл әр қадамда өз жұмысын істеп, ештеңе есте сақтамайды. Нәтижені жинау үшін бөлек айнымалы керек, ал ол цикл ДЕНЕСІНЕН ТЫС, циклге дейін жариялануы тиіс. Себебі екеу: біріншіден, цикл басталмай тұрып ештеңе қосылмаған, сондықтан оның бастапқы мәні — 0; екіншіден, фигуралы жақшаның ішінде жарияланған айнымалы сол жақша жабылғанда жоғалады, сондықтан оны кейін шығара да алмайсың.\n\nЦикл ішіндегі `s += x` деген жазу «s-ке x-ті қос» дегенді білдіреді — `s = s + x` дегеннің қысқа түрі. Санағыш дәл осылай жұмыс істейді, бірақ ол санның өзін емес, әр сәйкес келген элемент үшін 1-ді қосады. Сол себепті қосынды мен санағыш — екі бөлек айнымалы, және олардың жауабы да әртүрлі.",
      ru: "Цикл на каждом шаге делает свою работу и ничего не запоминает. Чтобы собрать результат, нужна отдельная переменная, и объявлена она должна быть ВНЕ тела цикла, до него. Причин две: во-первых, пока цикл не начался, ничего ещё не прибавлено, поэтому её начальное значение равно 0; во-вторых, переменная, объявленная внутри фигурных скобок, исчезает, когда скобка закрывается, — вывести её потом уже не получится.\n\nЗапись `s += x` внутри цикла означает «прибавь x к s» — это короткая форма `s = s + x`. Счётчик устроен так же, но прибавляет не само число, а единицу за каждый подходящий элемент. Поэтому сумма и счётчик — две разные переменные, и ответы у них разные.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int s = 0;\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i < 8; i++) {\n" +
      "        if (i % 2 == 0) {\n" +
      "            s += i;\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << s << \" \" << c;   // 12 3\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The worked example is a COUNTER over a run of numbers, and the two
     * write_code blocks are a SUM over a run (b7) and a COUNTER over a range
     * (b6). That grid is intentional: the learner meets each of the two ideas
     * twice, once in each setting, so «қосынды мен санағышты ажырату» is
     * exercised rather than asserted. Reading it does not solve either task.
     *
     * Sample deliberately ends on the boundary: 10 is not greater than 10.
     */
    id: "m2.l2.b2",
    type: "worked_example",
    skillRefs: ["loops.counter", "loops.for"],
    sourceType: "product-authored",
    title: {
      kk: "Толық талданған мысал: санағыш",
      ru: "Разобранный пример: счётчик",
    },
    problem: {
      kk: "Бірінші жолда сандардың саны n беріледі, екінші жолда сол n бүтін сан бос орынмен жазылады. Олардың ішінде 10-нан үлкендері нешеу екенін шығар. Мысалы «5» және «4 12 7 30 10» берілсе, жауап 2.",
      ru: "В первой строке дано количество чисел n, во второй строке — эти n целых чисел через пробел. Выведи, сколько среди них больше 10. Например, для «5» и «4 12 7 30 10» ответ 2.",
    },
    steps: [
      {
        kk: "Сұрақ «нешеу?» деп қойылған, демек бізге санағыш керек. Ол циклге дейін 0-ге тең: цикл басталмай тұрып бірде-бір сан қаралмаған, сондықтан табылғандар саны — нөл.",
        ru: "Вопрос звучит «сколько?», значит нужен счётчик. До цикла он равен 0: пока цикл не начался, ни одно число не рассмотрено, поэтому найдено ноль.",
      },
      {
        kk: "Сандардың саны бірінші жолда берілген, сондықтан цикл неше рет айналатыны алдын ала белгілі: `for (int i = 0; i < n; i++)`. Әр айналымда `cin >> x` келесі санды оқиды — сандар бір жолда жазылса да, бірнеше жолда жазылса да, `cin` оларды бос орындар мен жол ауысуларын елемей кезекпен береді.",
        ru: "Количество чисел дано в первой строке, поэтому заранее известно, сколько раз повторится цикл: `for (int i = 0; i < n; i++)`. На каждом проходе `cin >> x` читает следующее число — записаны ли числа в одну строку или в несколько, `cin` выдаёт их по очереди, не обращая внимания на пробелы и переводы строк.",
      },
      {
        kk: "`x` айнымалысы цикл ішінде жарияланған: әр айналымда ол жаңадан пайда болып, ескі мәні жойылады. Бұл мұнда зиянсыз — бізге сандардың өзі емес, олардың нешеуі шарттан өткені керек. Сондықтан бүкіл тізімді сақтап қоюдың қажеті жоқ.",
        ru: "Переменная `x` объявлена внутри цикла: на каждом проходе она создаётся заново, а старое значение пропадает. Здесь это безвредно — нам нужны не сами числа, а только то, сколько из них прошло условие. Поэтому хранить весь список незачем.",
      },
      {
        kk: "Шарт орындалғанда ғана `c = c + 1` жазамыз. Мұнда санның өзі емес, тек бірлік қосылады — біз сандарды қоспаймыз, санап отырмыз.",
        ru: "Только при выполнении условия пишем `c = c + 1`. Прибавляется единица, а не само число — мы не суммируем числа, а считаем их.",
      },
      {
        kk: "Шекараны тексереміз: 10 саны «10-нан үлкен» емес, сондықтан ол саналмайды. Тек 12 мен 30 қалады, жауап — 2.",
        ru: "Проверяем границу: число 10 не «больше 10», поэтому оно не считается. Остаются только 12 и 30, ответ — 2.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        if (x > 10) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    stdin: "5\n4 12 7 30 10",
    result: {
      kk: "«5» және «4 12 7 30 10» енгізілгенде: 2",
      ru: "При вводе «5» и «4 12 7 30 10»: 2",
    },
  },
  {
    /*
     * The wrong initial value, met before it is named. The program is correct
     * C++ and correct arithmetic — it is simply the wrong answer to the
     * question a learner assumes it is asking, which is why prediction is the
     * right block type and a find_bug here would give the game away.
     *
     * "3" gets no mapping on purpose. It is reachable two ways at once —
     * counting instead of summing, AND overlooking `int s = 1;` — and the
     * contract's rule is that a distractor with more than one cause stays
     * unattributed so the engine asks instead of asserting.
     */
    id: "m2.l2.b3",
    type: "prediction",
    skillRefs: ["loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Пернетақтадан бірінші жолға `3`, екінші жолға `2 3 4` енгізілді. Бағдарлама нені шығарады? Қосынды жарияланған жолға мұқият қара.",
      ru: "С клавиатуры ввели в первой строке `3`, во второй `2 3 4`. Что выведет программа? Внимательно посмотри на строку, где объявлена сумма.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = 1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        s += x;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    stdin: "3\n2 3 4",
    answer: "10",
    options: ["3", "4", "9", "10"],
    diagnosticMapping: {
      "9": {
        failureClass: "accumulator_initial_value_ignored",
        justification:
          "9 — бұл 2 + 3 + 4, яғни цикл дұрыс оқылған, бірақ бастапқы мән 0 деп есептелген. Бұл жауапқа тек `int s = 1;` жолын елемей жеткізеді.",
      },
      "4": {
        failureClass: "sum_vs_counter_confusion",
        justification:
          "4 = 1 + 1 + 1 + 1: бастапқы мән байқалған, бірақ әр қадамда санның өзі емес, бірлік қосылған. Бұл қосынды мен санағышты шатастырғанның нақты белгісі.",
      },
    },
  },
  {
    /*
     * PDF p.7, typical error #4: «жинақтаушы айнымалыға қате бастапқы мән
     * беру». The reset-inside-the-loop form is the version that survives a
     * read-through, because every individual line is right — including line 9,
     * which is the correct statement in the wrong place.
     *
     * ## Why the declaration and the reset are two separate lines here
     *
     * In Python the whole error was one line, `s = 0`, moved inside the loop.
     * C++ will not compile that: a variable declared inside the braces does not
     * exist after them, so `cout << s;` fails to build and the learner never
     * sees a wrong number at all. That is a real C++ lesson and this course
     * teaches it — at `m2.l2.b1`, in words, and at `m2.l9` as a scope question
     * — but it is not the error the PDF names, which is an accumulator that
     * silently loses what it collected.
     *
     * So the program declares `int s;` before the loop and RESETS it inside,
     * which is the same defect, compiles, runs, and prints 5 where 15 belongs.
     * `s` is assigned on the first pass before it is ever read, and the prompt
     * guarantees n ≥ 1, so there is no undefined behaviour hiding in the
     * uninitialised declaration.
     *
     * symptomInput is declared even though the numeric probe would catch this
     * one: the probe includes "0", and n = 0 is the single input on which the
     * missing initialiser WOULD be undefined behaviour. A block about the wrong
     * initial value must not be graded by a run whose answer is undefined.
     */
    id: "m2.l2.b4",
    type: "find_bug",
    skillRefs: ["loops.accumulator", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама 1-ден n-ге дейінгі сандардың қосындысын шығаруы керек (n ≥ 1). Бірақ n = 5 болғанда 15-тің орнына 5 шығып тұр. Қате қай жолда?",
      ru: "Эта программа должна выводить сумму чисел от 1 до n (n ≥ 1). Но при n = 5 вместо 15 выводится 5. В какой строке ошибка?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s = 0;\n" +
      "        s += i;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 9,
    symptomInput: "5",
    fixedCode:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s += i;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "10": {
        failureClass: "blamed_the_accumulation_not_the_reset",
        justification:
          "10-жол — жинақтаудың өзі, ал ол дұрыс жазылған. Оны таңдау «қосу дұрыс емес» дегенді білдіреді, шын себебі бір жол жоғарыда: `s = 0;` әр қадамда қайта орындалып, алдыңғы жиналғанның бәрін жойып жібереді.",
      },
    },
  },
  {
    /*
     * The counter that counts the wrong thing, as a repair rather than a second
     * find_bug: nothing here is broken C++, the program simply answers
     * «қанша?» when it was asked «нешеу?». Turning `c += x` into `c += 1` is a
     * one-character edit, and that is the point — the distance between a sum
     * and a counter is one character and a whole idea.
     *
     * "0 5 6" is in the set because 0 is even, and a solution that filters with
     * `x % 2 == 0 && x > 0` passes every other case here.
     */
    id: "m2.l2.b5",
    type: "modify_code",
    skillRefs: ["loops.counter", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сандардың саны n, екінші жолда сол n бүтін сан беріледі. Бұл бағдарлама олардың ішінен жұптарын тауып, олардың ҚОСЫНДЫСЫН шығарады. Оны өзгерт: енді ол жұп сандардың САНЫН шығарсын.",
      ru: "В первой строке дано количество чисел n, во второй — эти n целых чисел. Программа находит среди них чётные и выводит их СУММУ. Измени её так, чтобы она выводила КОЛИЧЕСТВО чётных чисел.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        if (x % 2 == 0) {\n" +
      "            c += x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        if (x % 2 == 0) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n4 7 10 3", expectedOutput: "2" },
      { input: "3\n1 3 5", expectedOutput: "0" },
      { input: "1\n2", expectedOutput: "1", hidden: true },
      { input: "4\n8 8 8 8", expectedOutput: "4", hidden: true },
      { input: "3\n0 5 6", expectedOutput: "2", hidden: true },
      { input: "1\n7", expectedOutput: "0", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «бөлгіштер саны». Support meets it as b6s below.
     *
     * The case set is chosen against the three mutants this task actually
     * attracts: `i < n` loses n itself (12 → 5), starting at 2 loses 1 (7 → 1,
     * and 1 → 0), and a counter declared inside the loop does not compile at
     * all. n = 1 also pins the smallest legal input, where the divisor and the
     * number are the same object.
     */
    id: "m2.l2.b6",
    type: "write_code",
    skillRefs: ["loops.counter", "loops.for", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "n бүтін саны беріледі (1 ≤ n ≤ 1000). Оның бөлгіштерінің санын шығар. Бөлгіш — n-ді қалдықсыз бөлетін сан; 1 мен n-нің өзі де саналады.",
      ru: "Дано целое число n (1 ≤ n ≤ 1000). Выведи количество его делителей. Делитель — число, на которое n делится без остатка; 1 и само n тоже считаются.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        if (n % i == 0) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "12", expectedOutput: "6" },
      { input: "1", expectedOutput: "1" },
      { input: "7", expectedOutput: "2", hidden: true },
      { input: "16", expectedOutput: "5", hidden: true },
      { input: "36", expectedOutput: "9", hidden: true },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "1000", expectedOutput: "16", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b6 — the same problem, assembled instead of
     * written, exactly as the programme's «құрастыру мен толықтыру көбірек»
     * requires. The three blanks are the three decisions the task is about: the
     * initial value, the comparison that must include n itself, and what
     * «қалдықсыз бөлінеді» means in code. Everything else is given, so a
     * support learner still meets the divisor-count idea in full.
     */
    id: "m2.l2.b6s",
    type: "fill_blank",
    skillRefs: ["loops.counter", "loops.for", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "n санының бөлгіштерін санайтындай толықтыр. Санағыш нешеден басталады? Цикл n-нің өзіне де жетуі керек — шартта қандай белгі тұрады? Ал «қалдықсыз бөлінеді» дегенді қалдық арқылы қалай жазамыз?",
      ru: "Дополни программу так, чтобы она считала делители числа n. С чего начинается счётчик? Цикл должен доходить и до самого n — какой знак стоит в условии? И как записать «делится без остатка» через остаток?",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int c = ___;\n" +
      "    for (int i = 1; i ___ n; i++) {\n" +
      "        if (n % i == ___) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "<=" },
      { id: "f3", answer: "0" },
    ],
  },
  {
    /*
     * PDF family: «цифрлар қосындысы», in the only form October can honestly
     * write it — the digits arrive already separated, so the work is the
     * accumulator and nothing else. The `/ 10` / `% 10` peeling version needs
     * `while` and belongs to m2.l3; see the file header.
     *
     * The single-digit cases are what separate a sum from a counter: for one
     * digit 7 a counter prints 1 and a sum prints 7, and for one digit 0 a
     * counter prints 1 and a sum prints 0. «1 0 0 5» additionally kills a
     * solution that stops at the first zero.
     */
    id: "m2.l2.b7",
    type: "write_code",
    skillRefs: ["loops.accumulator", "loops.for", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бірінші жолда цифрлардың саны k беріледі (1 ≤ k ≤ 100). Екінші жолда сол k цифр бос орынмен бөлініп жазылады. Цифрлардың қосындысын шығар. Мысалы «3» және «1 2 3» берілсе, жауап 6.",
      ru: "В первой строке дано количество цифр k (1 ≤ k ≤ 100). Во второй строке через пробел записаны эти k цифр. Выведи сумму этих цифр. Например, для «3» и «1 2 3» ответ 6.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    int s = 0;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        int d;\n" +
      "        cin >> d;\n" +
      "        s += d;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\n1 2 3", expectedOutput: "6" },
      { input: "4\n9 9 9 9", expectedOutput: "36" },
      { input: "1\n0", expectedOutput: "0", hidden: true },
      { input: "1\n7", expectedOutput: "7", hidden: true },
      { input: "4\n1 0 0 5", expectedOutput: "6", hidden: true },
      { input: "5\n3 0 4 0 2", expectedOutput: "9", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED. The programme makes written defence compulsory on that route
     * («шешімді жазбаша қорғау міндетті», p.6), and this is the lesson where
     * there is something worth defending: the learner has just watched the same
     * statement give two different answers depending on where it stands. Marked
     * by a teacher and settled as `unknown` — never auto-scored.
     */
    id: "m2.l2.b8",
    type: "explain",
    skillRefs: ["loops.accumulator", "loops.counter"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Жинақтаушы неге циклге дейін жарияланады? Егер `s = 0;` жолы цикл денесінің ішінде тұрса, бағдарлама не істейді? Ал `int s = 0;` деп толығымен цикл ішінде жариялансақ ше — неге ол мүлде компиляцияланбайды? Жауабыңды 1-ден 5-ке дейінгі сандардың қосындысы мысалында, нақты сандармен түсіндір. Соңында санағыш үшін де сол ереже жүре ме, соны айт.",
      ru: "Почему накопитель объявляется до цикла? Что произойдёт, если строка `s = 0;` окажется внутри тела цикла? А если написать `int s = 0;` целиком внутри цикла — почему такая программа вообще не скомпилируется? Объясни на примере суммы чисел от 1 до 5, с конкретными числами. В конце скажи, действует ли то же правило для счётчика.",
    },
    expectedPoints: [
      {
        kk: "Цикл басталғанда әлі бірде-бір сан қосылмаған, сондықтан бастапқы мән 0 болуы керек.",
        ru: "К началу цикла ещё ни одно число не прибавлено, поэтому начальное значение должно быть 0.",
      },
      {
        kk: "`s = 0;` цикл ішінде тұрса, ол әр қадамда қайта орындалады және алдыңғы жиналған мән жоғалады. Сондықтан 1-ден 5-ке дейінгі қосынды 15 емес, соңғы қадамның мәні — 5 болып шығады.",
        ru: "Если `s = 0;` стоит внутри цикла, она выполняется на каждом шаге и накопленное ранее значение теряется. Поэтому сумма от 1 до 5 получится не 15, а 5 — значение последнего шага.",
      },
      {
        kk: "`int s = 0;` деп цикл ішінде ЖАРИЯЛАСАҚ, айнымалы фигуралы жақша жабылған сәтте жоғалады. Циклден кейінгі `cout << s;` жолында ондай ат мүлде жоқ, сондықтан бағдарлама іске қосылмай тұрып, компиляция кезінде тоқтайды.",
        ru: "Если ОБЪЯВИТЬ `int s = 0;` внутри цикла, переменная исчезает в момент закрытия фигурной скобки. В строке `cout << s;` после цикла такого имени уже не существует, поэтому программа останавливается на компиляции, ещё до запуска.",
      },
      {
        kk: "Санағышқа да дәл сол ереже: `int c = 0;` циклге дейін тұрады, әйтпесе жауап әрқашан 1 немесе 0 болады, не болмаса бағдарлама тіпті жиналмайды.",
        ru: "Для счётчика правило то же: `int c = 0;` стоит до цикла, иначе ответ всегда будет 1 или 0 — а то и программа вовсе не соберётся.",
      },
    ],
  },
];
