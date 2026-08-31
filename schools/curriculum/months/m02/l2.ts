import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан — lesson 2 · «Жинақтаушы айнымалы» / «Накопитель». PDF p.7.
 *
 * One idea: the value that survives the loop is set BEFORE the loop, and a sum
 * is not a counter. Those are the lesson's two stated objectives and every
 * block below serves one of them.
 *
 * The PDF's October paragraph names four typical errors, and one of them is
 * «жинақтаушы айнымалыға қате бастапқы мән беру» — a wrong initial value for
 * the accumulator. So this lesson does not merely mention it: `b3` predicts a
 * program whose accumulator starts at 1, and `b4` breaks one by moving `s = 0`
 * inside the loop. Both are curriculum subjects, not invented drills.
 *
 * ## Two authoring decisions worth reading before editing this file
 *
 * 1. **Reading a whole line is introduced by the worked example, not by a
 *    task.** `b7` asks for the digit sum of digits given on one line, which
 *    needs a loop over `input().split()`. A learner meets that shape first in
 *    `b2`, where a reasoning step says what `split()` hands back and why each
 *    piece still has to go through `int()` — the same point September made at
 *    m1.l2.b1a. A task must never be the first place a construct appears.
 *
 * 2. **The general digit sum is deliberately absent.** Peeling digits off a
 *    number with `// 10` and `% 10` needs `while`, which is lesson 3. Doing it
 *    here would either smuggle `while` in early or fake it with a fixed number
 *    of `for` steps, which is worse: it teaches a rule that breaks on the first
 *    number of a different length. October's digit sum is the one whose digits
 *    are handed over already separated; lesson 3 owns the other form.
 *
 * The month's forbidden aggregates — `sum`, `min`, `max`, `sorted` — are the
 * whole point of the lesson, not an inconvenience. `s += x` written by hand IS
 * the thing being taught.
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
      kk: "Цикл әр қадамда өз жұмысын істеп, ештеңе есте сақтамайды. Нәтижені жинау үшін бөлек айнымалы керек, ал оның бастапқы мәні циклге ДЕЙІН қойылады: цикл басталмай тұрып ештеңе қосылмаған, сондықтан ол — 0. Цикл ішіндегі `s += x` деген жазу «s-ке x-ті қос» дегенді білдіреді. Санағыш дәл осылай жұмыс істейді, бірақ ол санның өзін емес, әр сәйкес келген элемент үшін 1-ді қосады. Сол себепті қосынды мен санағыш — екі бөлек айнымалы, және олардың жауабы да әртүрлі.",
      ru: "Цикл на каждом шаге делает свою работу и ничего не запоминает. Чтобы собрать результат, нужна отдельная переменная, и её начальное значение задаётся ДО цикла: пока цикл не начался, ничего ещё не прибавлено, поэтому она равна 0. Запись `s += x` внутри цикла означает «прибавь x к s». Счётчик устроен так же, но прибавляет не само число, а единицу за каждый подходящий элемент. Поэтому сумма и счётчик — две разные переменные, и ответы у них разные.",
    },
    code: "s = 0\nc = 0\nfor i in range(1, 8):\n    if i % 2 == 0:\n        s += i\n        c += 1\nprint(s, c)  # 12 3",
  },
  {
    /*
     * The worked example is a COUNTER over a line, and the two write_code
     * blocks are a SUM over a line (b7) and a COUNTER over a range (b6). That
     * grid is intentional: the learner meets each of the two ideas twice, once
     * in each setting, so «қосынды мен санағышты ажырату» is exercised rather
     * than asserted. Reading it does not solve either task.
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
      kk: "Бір жолда бірнеше бүтін сан бос орынмен беріледі. Олардың ішінде 10-нан үлкендері нешеу екенін шығар. Мысалы «4 12 7 30 10» берілсе, жауап 2.",
      ru: "В одной строке через пробел даны несколько целых чисел. Выведи, сколько среди них больше 10. Например, для «4 12 7 30 10» ответ 2.",
    },
    steps: [
      {
        kk: "Сұрақ «нешеу?» деп қойылған, демек бізге санағыш керек. Ол циклге дейін 0-ге тең: цикл басталмай тұрып бірде-бір сан қаралмаған, сондықтан табылғандар саны — нөл.",
        ru: "Вопрос звучит «сколько?», значит нужен счётчик. До цикла он равен 0: пока цикл не начался, ни одно число не рассмотрено, поэтому найдено ноль.",
      },
      {
        kk: "Сандар қанша екені алдын ала белгісіз, сондықтан `input().split()` жолды бос орындар бойынша бөліктерге бөледі, ал цикл сол бөліктерді бірінен соң бірін алады.",
        ru: "Сколько будет чисел, заранее неизвестно, поэтому `input().split()` режет строку по пробелам на части, а цикл берёт эти части одну за другой.",
      },
      {
        kk: "Әр бөлік әлі мәтін — қыркүйекте көргеніміздей, оны `int()` арқылы санға айналдырмай салыстыруға болмайды.",
        ru: "Каждая часть — всё ещё текст: как мы видели в сентябре, без преобразования через `int()` сравнивать её нельзя.",
      },
      {
        kk: "Шарт орындалғанда ғана `c += 1` жазамыз. Мұнда санның өзі емес, тек бірлік қосылады — біз сандарды қоспаймыз, санап отырмыз.",
        ru: "Только при выполнении условия пишем `c += 1`. Прибавляется единица, а не само число — мы не суммируем числа, а считаем их.",
      },
      {
        kk: "Шекараны тексереміз: 10 саны «10-нан үлкен» емес, сондықтан ол саналмайды. Тек 12 мен 30 қалады, жауап — 2.",
        ru: "Проверяем границу: число 10 не «больше 10», поэтому оно не считается. Остаются только 12 и 30, ответ — 2.",
      },
    ],
    code: "c = 0\nfor w in input().split():\n    x = int(w)\n    if x > 10:\n        c += 1\nprint(c)",
    stdin: "4 12 7 30 10",
    result: {
      kk: "«4 12 7 30 10» енгізілгенде: 2",
      ru: "При вводе «4 12 7 30 10»: 2",
    },
  },
  {
    /*
     * The wrong initial value, met before it is named. The program is correct
     * Python and correct arithmetic — it is simply the wrong answer to the
     * question a learner assumes it is asking, which is why prediction is the
     * right block type and a find_bug here would give the game away.
     *
     * "3" gets no mapping on purpose. It is reachable two ways at once —
     * counting instead of summing, AND overlooking `s = 1` — and the contract's
     * rule is that a distractor with more than one cause stays unattributed so
     * the engine asks instead of asserting.
     */
    id: "m2.l2.b3",
    type: "prediction",
    skillRefs: ["loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Пернетақтадан `2 3 4` енгізілді. Бағдарлама нені шығарады? Бірінші жолға мұқият қара.",
      ru: "С клавиатуры ввели `2 3 4`. Что выведет программа? Внимательно посмотри на первую строку.",
    },
    code: "s = 1\nfor w in input().split():\n    s += int(w)\nprint(s)",
    stdin: "2 3 4",
    answer: "10",
    options: ["3", "4", "9", "10"],
    diagnosticMapping: {
      "9": {
        failureClass: "accumulator_initial_value_ignored",
        justification:
          "9 — бұл 2 + 3 + 4, яғни цикл дұрыс оқылған, бірақ бастапқы мән 0 деп есептелген. Бұл жауапқа тек `s = 1` жолын елемей жеткізеді.",
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
     * read-through, because every individual line is right — including line 3,
     * which is the correct statement in the wrong place.
     *
     * symptomInput is declared even though the numeric probe would catch this
     * one: the probe includes "0", and on n = 0 the buggy program raises
     * NameError instead of printing a wrong number, which is a different lesson
     * than the one this block is teaching.
     */
    id: "m2.l2.b4",
    type: "find_bug",
    skillRefs: ["loops.accumulator", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама 1-ден n-ге дейінгі сандардың қосындысын шығаруы керек. Бірақ n = 5 болғанда 15-тің орнына 5 шығып тұр. Қате қай жолда?",
      ru: "Эта программа должна выводить сумму чисел от 1 до n. Но при n = 5 вместо 15 выводится 5. В какой строке ошибка?",
    },
    code: "n = int(input())\nfor i in range(1, n + 1):\n    s = 0\n    s += i\nprint(s)",
    buggyLine: 3,
    symptomInput: "5",
    fixedCode: "n = int(input())\ns = 0\nfor i in range(1, n + 1):\n    s += i\nprint(s)",
    diagnosticMapping: {
      "4": {
        failureClass: "blamed_the_accumulation_not_the_reset",
        justification:
          "4-жол — жинақтаудың өзі, ал ол дұрыс жазылған. Оны таңдау «қосу дұрыс емес» дегенді білдіреді, шын себебі бір жол жоғарыда: s әр қадамда қайта нөлденіп, алдыңғы жиналғанның бәрі жоғалады.",
      },
    },
  },
  {
    /*
     * The counter that counts the wrong thing, as a repair rather than a second
     * find_bug: nothing here is broken Python, the program simply answers
     * «қанша?» when it was asked «нешеу?». Turning `c += x` into `c += 1` is a
     * one-character edit, and that is the point — the distance between a sum
     * and a counter is one character and a whole idea.
     *
     * "0 5 6" is in the set because 0 is even, and a solution that filters with
     * `x % 2 == 0 and x > 0` passes every other case here.
     */
    id: "m2.l2.b5",
    type: "modify_code",
    skillRefs: ["loops.counter", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама бір жолда берілген сандардың ішінен жұптарын тауып, олардың ҚОСЫНДЫСЫН шығарады. Оны өзгерт: енді ол жұп сандардың САНЫН шығарсын.",
      ru: "Эта программа выводит СУММУ чётных среди чисел, данных в одной строке. Измени её так, чтобы она выводила КОЛИЧЕСТВО чётных чисел.",
    },
    code: "c = 0\nfor w in input().split():\n    x = int(w)\n    if x % 2 == 0:\n        c += x\nprint(c)",
    referenceSolution: "c = 0\nfor w in input().split():\n    x = int(w)\n    if x % 2 == 0:\n        c += 1\nprint(c)",
    cases: [
      { input: "4 7 10 3", expectedOutput: "2" },
      { input: "1 3 5", expectedOutput: "0" },
      { input: "2", expectedOutput: "1", hidden: true },
      { input: "8 8 8 8", expectedOutput: "4", hidden: true },
      { input: "0 5 6", expectedOutput: "2", hidden: true },
      { input: "7", expectedOutput: "0", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «бөлгіштер саны». Support meets it as b6s below.
     *
     * The case set is chosen against the three mutants this task actually
     * attracts: `range(1, n)` loses n itself (12 → 5), `range(2, n + 1)` loses
     * 1 (7 → 1, and 1 → 0), and a counter reset inside the loop returns 1 for
     * everything. n = 1 also pins the smallest legal input, where the divisor
     * and the number are the same object.
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
      "n = int(input())\nc = 0\nfor i in range(1, n + 1):\n    if n % i == 0:\n        c += 1\nprint(c)",
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
     * initial value, the upper bound that must include n itself, and what
     * «қалдықсыз бөлінеді» means in code. Everything else is given, so a
     * support learner still meets the divisor-count idea in full.
     */
    id: "m2.l2.b6s",
    type: "fill_blank",
    skillRefs: ["loops.counter", "loops.for", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "n санының бөлгіштерін санайтындай толықтыр. Санағыш нешеден басталады? Цикл n-нің өзіне дейін жетуі керек. Ал «қалдықсыз бөлінеді» дегенді қалдық арқылы қалай жазамыз?",
      ru: "Дополни программу так, чтобы она считала делители числа n. С чего начинается счётчик? Цикл должен доходить до самого n. И как записать «делится без остатка» через остаток?",
    },
    template:
      "n = int(input())\nc = ___\nfor i in range(1, n ___ 1):\n    if n % i == ___:\n        c += 1\nprint(c)",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "+" },
      { id: "f3", answer: "0" },
    ],
  },
  {
    /*
     * PDF family: «цифрлар қосындысы», in the only form October can honestly
     * write it — the digits arrive already separated, so the work is the
     * accumulator and nothing else. The `// 10` / `% 10` peeling version needs
     * `while` and belongs to m2.l3; see the file header.
     *
     * The single-digit cases are what separate a sum from a counter: for "7" a
     * counter prints 1 and a sum prints 7, and for "0" a counter prints 1 and a
     * sum prints 0. "1 0 0 5" additionally kills a solution that stops at the
     * first zero.
     */
    id: "m2.l2.b7",
    type: "write_code",
    skillRefs: ["loops.accumulator", "loops.for", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда санның цифрлары бос орынмен бөлініп беріледі (кемінде бір цифр). Сол цифрлардың қосындысын шығар. Мысалы «1 2 3» берілсе, жауап 6.",
      ru: "В одной строке через пробел даны цифры числа (не менее одной цифры). Выведи сумму этих цифр. Например, для «1 2 3» ответ 6.",
    },
    referenceSolution: "s = 0\nfor d in input().split():\n    s += int(d)\nprint(s)",
    cases: [
      { input: "1 2 3", expectedOutput: "6" },
      { input: "9 9 9 9", expectedOutput: "36" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "7", expectedOutput: "7", hidden: true },
      { input: "1 0 0 5", expectedOutput: "6", hidden: true },
      { input: "3 0 4 0 2", expectedOutput: "9", hidden: true },
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
      kk: "Жинақтаушының бастапқы мәні неге циклге дейін қойылады? Егер `s = 0` жолы цикл ішінде тұрса, бағдарлама не істейді? Жауабыңды 1-ден 5-ке дейінгі сандардың қосындысы мысалында, нақты сандармен түсіндір. Соңында санағыш үшін де сол ереже жүре ме, соны айт.",
      ru: "Почему начальное значение накопителя ставится до цикла? Что произойдёт, если строка `s = 0` окажется внутри цикла? Объясни на примере суммы чисел от 1 до 5, с конкретными числами. В конце скажи, действует ли то же правило для счётчика.",
    },
    expectedPoints: [
      {
        kk: "Цикл басталғанда әлі бірде-бір сан қосылмаған, сондықтан бастапқы мән 0 болуы керек.",
        ru: "К началу цикла ещё ни одно число не прибавлено, поэтому начальное значение должно быть 0.",
      },
      {
        kk: "`s = 0` цикл ішінде тұрса, ол әр қадамда қайта орындалады және алдыңғы жиналған мән жоғалады.",
        ru: "Если `s = 0` стоит внутри цикла, она выполняется на каждом шаге и накопленное ранее значение теряется.",
      },
      {
        kk: "Сондықтан 1-ден 5-ке дейінгі қосынды 15 емес, соңғы қадамның мәні — 5 болып шығады.",
        ru: "Поэтому сумма от 1 до 5 получится не 15, а 5 — значение последнего шага.",
      },
      {
        kk: "Санағышқа да дәл сол ереже: `c = 0` циклге дейін тұрады, әйтпесе жауап әрқашан 1 немесе 0 болады.",
        ru: "Для счётчика правило то же: `c = 0` стоит до цикла, иначе ответ всегда будет 1 или 0.",
      },
    ],
  },
];
