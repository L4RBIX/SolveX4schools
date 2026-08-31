import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан · Lesson 8 — «Күрделірек есептер» / «Задачи посложнее». 10 min.
 *
 * The last teaching lesson of October, and it owns the two hardest families the
 * PDF's practice paragraph names: «жай санды тексеру» and «тізімді кері
 * аудару». Both are written with what October has, and both are written the
 * long way on purpose.
 *
 * ## Primality: the boundary is the lesson, not the loop
 *
 * A divisor loop is four lines and every learner writes it. What separates a
 * correct primality check from a plausible one is entirely at the edges:
 *
 *   n = 0, n = 1  the definition excludes them, and the loop never notices —
 *                 `range(2, 1)` is empty, so a program with no guard reports
 *                 both as prime while looking completely reasonable;
 *   n = 2         the one even prime, and the number a learner who has just
 *                 learnt «жұп сан 2-ге бөлінеді» is most likely to get wrong;
 *   n = 4         the only n in the world where `range(2, n // 2)` and
 *                 `range(2, n // 2 + 1)` disagree about the answer.
 *
 * So those four numbers are not decoration in the case lists — they are the
 * task. `m2.l8.b3` asks which of 1, 2, 4, 9 the shown program gets wrong,
 * `m2.l8.b5` hides 0, 1 and 4, `m2.l8.b6` hides 2 and 4, and `m2.l8.b9` makes
 * the advanced track defend the bound in writing.
 *
 * The from-scratch task at `m2.l8.b6` prints the smallest divisor rather than a
 * verdict, and the comment on that block says why: by the time a learner
 * reaches it the yes / no program has been on the screen four times, so asking
 * for it is asking them to scroll up.
 *
 * The upper bound taught here is `n // 2`, not `i * i <= n`. The square-root
 * bound is faster and it is a genuinely harder argument; `n // 2` is provable
 * in one sentence a fourteen-year-old can say out loud («бөліндісі 2-ден кіші
 * болар еді»), which is what the advanced `explain` actually asks for. The
 * faster bound belongs to a month that has something to say about cost.
 *
 * ## Reversing: `a[::-1]` is banned and the ban is the point
 *
 * October has met slicing, so `a[::-1]` is legal Python for these learners and
 * it would delete the exercise — «тізімді кері аудару» is in the practice list
 * because walking indices downwards is a skill, not because the answer is
 * interesting. `m2.l6.b8` already reverses a STRING by putting each new
 * character in front (`r = c + r`), which needs no reverse range at all. This
 * lesson deliberately takes the other road: `range(len(a) - 1, -1, -1)`, whose
 * three arguments are the single most confusing piece of syntax October
 * contains. It gets a prediction of its own (`m2.l8.b2`) before it is ever
 * required in a task.
 *
 * ## Two accumulators at once
 *
 * The lesson objective is running several accumulators in one pass, and it is
 * met twice with different shapes. `m2.l8.b5` runs a flag that must be RESET
 * for every candidate inside a nested loop against a counter that must NOT be —
 * which is the PDF's own named typical error («жинақтаушы айнымалыға қате
 * бастапқы мән беру») in the one place where both answers are correct for
 * different variables. `m2.l8.b8` runs two accumulators of the same kind that
 * must be updated in the right order, where writing `best` before `second`
 * loses the old maximum forever.
 *
 * Where a program prints words the words are English (`yes` / `no`), and every
 * prompt that mentions them names them in both languages.
 */
export const M2_L8: LessonBlock[] = [
  {
    id: "m2.l8.b1",
    type: "worked_example",
    skillRefs: ["loops.for", "arith.remainder", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Толық талданған мысал: 91 саны жай ма?",
      ru: "Разобранный пример: простое ли число 91?",
    },
    /* 91 is chosen because it passes every cheap test a learner applies by eye:
       it is odd, it does not end in 5, and its digit sum is 10. The first
       divisor is 7, which is far enough in that the loop has to be believed
       rather than guessed. */
    problem: {
      kk: "Жай сан деп 1-ден үлкен, тек 1-ге және өзіне ғана қалдықсыз бөлінетін бүтін санды айтады. 91 саны жай ма? Ол тақ, 5-ке де бөлінбейді, цифрларының қосындысы 10 — сырттай қарағанда жай сияқты көрінеді. Тексеріп көрейік.",
      ru: "Простым называют целое число больше 1, которое делится без остатка только на 1 и на само себя. Простое ли число 91? Оно нечётное, на 5 не делится, сумма цифр равна 10 — на вид похоже на простое. Проверим.",
    },
    steps: [
      {
        kk: "Анықтаманы дәл оқимыз: жай санның бөлгіші нақты екеу — 1 және санның өзі. Демек тексерілетін жалғыз нәрсе бар: 1 мен n-нің арасында тағы бір бөлгіш бар ма, жоқ па.",
        ru: "Прочитаем определение точно: у простого числа ровно два делителя — 1 и само число. Значит, проверять надо ровно одно: есть ли ещё какой-нибудь делитель между 1 и n.",
      },
      {
        kk: "1 неге жай емес? Оның бөлгіші біреу-ақ — 1. Ал анықтама екі түрлі бөлгішті талап етеді, сондықтан 1 жай да, құрама да емес. Циклдің өзі мұны ешқашан байқамайды: n = 1 болғанда цикл бір рет те айналмайды. Сондықтан бұл жағдай бөлек шартпен ұсталады: `n < 2` болса, жауап бірден `no`.",
        ru: "Почему 1 не простое? У неё всего один делитель — она сама. А определение требует двух разных делителей, поэтому 1 не простое и не составное. Сам цикл этого никогда не заметит: при n = 1 он не сделает ни одного шага. Поэтому такой случай ловится отдельным условием: если `n < 2`, ответ сразу `no`.",
      },
      {
        kk: "2 неге жай? Бөлгіштері 1 және 2 — дәл екеу. «Жұп сан жай болмайды» деген — жиі кездесетін қате ой: жұп болу дегеніміз 2-ге бөліну, ал 2 үшін сол бөлгіш — санның өзі, яғни анықтама бұзылмайды. 2 — жалғыз жұп жай сан.",
        ru: "Почему 2 простое? У него делители 1 и 2 — ровно два. «Чётное не бывает простым» — частая ошибка: чётность означает делимость на 2, а для самой двойки этот делитель и есть само число, то есть определение не нарушено. 2 — единственное чётное простое число.",
      },
      {
        kk: "Іздеуді 2-ден бастаймыз, өйткені кез келген сан 1-ге бөлінеді — 1-ді тексеру ешқандай ақпарат бермейді. Жоғарғы шекара `n // 2`: одан үлкен бөлгіш болса, бөліндісі 2-ден кіші, яғни 1 болар еді, ал бөліндісі 1 болатын жалғыз бөлгіш — n-нің өзі.",
        ru: "Поиск начинаем с 2, потому что на 1 делится любое число — проверка единицы не даёт никакой информации. Верхняя граница — `n // 2`: если бы делитель был больше, частное оказалось бы меньше 2, то есть равно 1, а единственный делитель с частным 1 — это само число.",
      },
      {
        kk: "`range` жоғарғы шегін қоспайды, сондықтан `range(2, n // 2 + 1)` деп жазамыз. Мұндағы «+ 1» — `n // 2` санының өзін тексеруге кіргізу үшін. Ол болмаса n = 4 үшін цикл мүлде айналмайды да, 4 жай деп саналып қалады.",
        ru: "`range` не включает верхнюю границу, поэтому пишем `range(2, n // 2 + 1)`. Это «+ 1» нужно, чтобы само число `n // 2` тоже попало в проверку. Без него при n = 4 цикл не сделает ни шага, и 4 будет объявлено простым.",
      },
      {
        kk: "Бір бөлгіш табылса, жауап анықталды — әрі қарай іздеудің қажеті жоқ. Сондықтан `prime = 0` деп белгілеп, `break` арқылы циклден дереу шығамыз.",
        ru: "Как только найден один делитель, ответ уже известен — искать дальше незачем. Поэтому ставим `prime = 0` и сразу выходим из цикла через `break`.",
      },
      {
        kk: "91 үшін қадамдар: 91 // 2 = 45, цикл 2-ден 45-ке дейін жүруге дайын. i = 2 — қалдық 1; i = 3 — қалдық 1; i = 4, 5, 6 — бөлінбейді; i = 7 — 91 = 7 × 13, қалдық 0. `prime = 0`, `break`. Цикл 45-ке жетпей, жетінші қадамда тоқтады.",
        ru: "Шаги для 91: 91 // 2 = 45, цикл готов идти от 2 до 45. i = 2 — остаток 1; i = 3 — остаток 1; i = 4, 5, 6 — не делится; i = 7 — 91 = 7 × 13, остаток 0. `prime = 0`, `break`. Цикл остановился на седьмом шаге, не дойдя до 45.",
      },
    ],
    code:
      "n = 91\n" +
      "prime = 1\n" +
      "if n < 2:\n" +
      "    prime = 0\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        prime = 0\n" +
      "        break\n" +
      "if prime == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    result: {
      kk: "Экранға: no — 91 жай сан емес, ол 7 × 13.",
      ru: "На экран: no — 91 не простое, это 7 × 13.",
    },
  },
  {
    /*
     * The reverse walk, met as a prediction before any task needs it. All three
     * arguments of `range` are doing work here and each one is a separate
     * chance to be wrong, which is why the options are what they are:
     *
     *   "5 8 2 9"  the step was not read at all;
     *   "9 2 8"    the middle -1 was read as "the last index visited";
     *   "2 8 5"    the start was read as len(a) - 2, the same off-by-one
     *              m2.l6.b3 met on the last character of a string.
     *
     * Only the first is mapped. "9 2 8" has two honest causes — the exclusive
     * stop misread, and "the loop runs len(a) - 1 = 3 times" — and the contract
     * says an ambiguous distractor gets no mapping, so the engine asks.
     */
    id: "m2.l8.b2",
    type: "prediction",
    skillRefs: ["lists.traverse", "lists.index", "loops.for"],
    sourceType: "product-authored",
    prompt: {
      kk: "`range` мұнда үш аргументпен жазылған: қайдан бастау, қайда дейін жету және қандай қадаммен жүру. Бағдарлама экранға нені шығарады?",
      ru: "`range` записан здесь с тремя аргументами: откуда начать, до чего идти и с каким шагом. Что программа выведет на экран?",
    },
    code:
      "a = [5, 8, 2, 9]\n" +
      'r = ""\n' +
      "for i in range(len(a) - 1, -1, -1):\n" +
      '    r = r + str(a[i]) + " "\n' +
      "print(r)",
    answer: "9 2 8 5",
    options: ["9 2 8 5", "5 8 2 9", "9 2 8", "2 8 5"],
    diagnosticMapping: {
      "5 8 2 9": {
        failureClass: "reverse_range_direction_ignored",
        justification:
          "«5 8 2 9» — тізімнің бастапқы реті, яғни `i` 0-ден 3-ке дейін өскендегі нәтиже. Бұл жауап `range`-тің үшінші аргументі мүлде оқылмағанда ғана шығады: қадам -1 болғандықтан `i` 3-тен басталып кемиді, ал өсу үшін ешқандай себеп жоқ.",
      },
    },
  },
  {
    /*
     * The guard is missing and nothing else is. Among non-negative n the program
     * is wrong on exactly 0 and 1, so with these four options there is one
     * answer and it is checkable by hand in ten seconds.
     *
     * No diagnosticMapping, and each distractor fails the uniqueness test for
     * its own reason. Choosing 2 follows from "even numbers are not prime" AND
     * from reading `range(2, 2)` as containing 2; choosing 9 follows from "odd
     * numbers are prime" AND from believing the loop stops before it reaches 3;
     * choosing 4 follows from mis-evaluating `4 // 2 + 1`. Naming one cause per
     * option would be a guess about a fourteen-year-old's reasoning.
     */
    id: "m2.l8.b3",
    type: "multiple_choice",
    skillRefs: ["loops.for", "debug.boundary", "arith.remainder"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама енгізілген n санының жай екенін тексеруі керек: жай болса `yes`, болмаса `no` шығарады (n ≥ 0). Ол төмендегі төрт санның тек біреуіне қате жауап береді. Қайсысына?",
      ru: "Эта программа должна проверять, простое ли введённое число n: если простое — выводит `yes`, иначе `no` (n ≥ 0). Ровно на одном из четырёх чисел ниже она отвечает неверно. На каком?",
    },
    code:
      "n = int(input())\n" +
      "prime = 1\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        prime = 0\n" +
      "        break\n" +
      "if prime == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    options: [
      { id: "o1", label: { kk: "n = 1", ru: "n = 1" } },
      { id: "o2", label: { kk: "n = 2", ru: "n = 2" } },
      { id: "o3", label: { kk: "n = 4", ru: "n = 4" } },
      { id: "o4", label: { kk: "n = 9", ru: "n = 9" } },
    ],
    correctOptionId: "o1",
  },
  {
    /*
     * PDF p.7 asks for «цикл мен индекс қатесін табу» as a block of work in its
     * own right, and this is the loop error that hides best: `break` is at the
     * body's indentation instead of the `if`'s, so the loop tests i = 2 and
     * then leaves whatever happens. Every even composite still answers
     * correctly — 2 is found on the first step — so a learner testing 6, 8, 10
     * sees a program that works. Only odd composites expose it.
     *
     * symptomInput is mandatory here: the fallback probe would report the two
     * programs as identical on 0, 1, 5, 17, 18, 19, 50, 70, 84, 90 — every one
     * of those is prime or even.
     */
    id: "m2.l8.b4",
    type: "find_bug",
    skillRefs: ["loops.for", "debug.boundary", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бұл бағдарлама санның жай екенін тексеруі керек. Жұп сандар үшін ол дұрыс жұмыс істейді, бірақ 9 санын бергенде `yes` шығарады, ал 9 = 3 × 3. 15 пен 25 үшін де солай. Қай жол кінәлі және неге тақ сандарда ғана байқалады?",
      ru: "Эта программа должна проверять, простое ли число. На чётных числах она работает верно, но на 9 выводит `yes`, хотя 9 = 3 × 3. На 15 и 25 то же самое. Какая строка виновата и почему это видно только на нечётных числах?",
    },
    code:
      "n = int(input())\n" +
      "prime = 1\n" +
      "if n < 2:\n" +
      "    prime = 0\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        prime = 0\n" +
      "    break\n" +
      "if prime == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    buggyLine: 8,
    symptomInput: "9",
    fixedCode:
      "n = int(input())\n" +
      "prime = 1\n" +
      "if n < 2:\n" +
      "    prime = 0\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        prime = 0\n" +
      "        break\n" +
      "if prime == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
  },
  {
    /*
     * One check becomes a nested loop, and with it the lesson's real subject:
     * two accumulators with opposite reset rules living in the same program.
     * `cnt` is initialised once, before everything; `prime` is initialised once
     * PER CANDIDATE, inside the outer loop. Putting either one in the other's
     * place is the PDF's named error «жинақтаушы айнымалыға қате бастапқы мән
     * беру», and here both mistakes are available at the same time.
     *
     * The prompt states the rule and not the code, deliberately: a learner told
     * "the flag restarts for every k, the counter does not" still has to decide
     * which line moves where, which is the whole modification.
     *
     * The n < 2 guard disappears in the rewrite and that is correct rather than
     * sloppy — the outer loop starts at 2, so 0 and 1 are never candidates.
     */
    id: "m2.l8.b5",
    type: "modify_code",
    skillRefs: ["loops.nested", "loops.accumulator", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Төмендегі бағдарлама бір санның жай екенін тексеріп, `yes` немесе `no` шығарады. Оны өзгерт: енді ол 2-ден n-ге дейінгі аралықта (n-нің өзін қоса) неше жай сан бар екенін бір ғана сан етіп шығарсын. Мысалы, n = 10 үшін жауап 4, өйткені 2, 3, 5, 7 жай. n = 0 немесе n = 1 болса, жауап 0. Абайла: `prime` белгісі әр тексерілетін сан үшін қайтадан 1-ге қойылуы керек, ал жалпы санағыш — керісінше, барлық циклдерге дейін бір рет қана.",
      ru: "Программа ниже проверяет, простое ли одно число, и выводит `yes` или `no`. Измени её: теперь она должна вывести одно число — сколько простых чисел в промежутке от 2 до n включительно. Например, для n = 10 ответ 4, потому что простые — это 2, 3, 5, 7. Если n = 0 или n = 1, ответ 0. Внимание: флаг `prime` нужно снова ставить в 1 для каждого проверяемого числа, а общий счётчик — наоборот, только один раз до всех циклов.",
    },
    code:
      "n = int(input())\n" +
      "prime = 1\n" +
      "if n < 2:\n" +
      "    prime = 0\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        prime = 0\n" +
      "        break\n" +
      "if prime == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    referenceSolution:
      "n = int(input())\n" +
      "cnt = 0\n" +
      "for k in range(2, n + 1):\n" +
      "    prime = 1\n" +
      "    for i in range(2, k // 2 + 1):\n" +
      "        if k % i == 0:\n" +
      "            prime = 0\n" +
      "            break\n" +
      "    if prime == 1:\n" +
      "        cnt += 1\n" +
      "print(cnt)",
    /* "2" is visible because the smallest interesting answer is the one a
       learner should be able to reason about before running anything; the
       boundary pair 0 and 1 stays hidden, and so does 4, where a `k // 2`
       written without the `+ 1` counts 4 as prime and answers 3. */
    cases: [
      { input: "10", expectedOutput: "4" },
      { input: "2", expectedOutput: "1" },
      { input: "1", expectedOutput: "0", hidden: true },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "3", expectedOutput: "2", hidden: true },
      { input: "4", expectedOutput: "2", hidden: true },
      { input: "30", expectedOutput: "10", hidden: true },
      { input: "100", expectedOutput: "25", hidden: true },
    ],
  },
  {
    id: "m2.l8.b6",
    type: "write_code",
    skillRefs: ["loops.for", "arith.remainder", "debug.boundary"],
    /*
     * A sibling of «жай санды тексеру», not the family itself — hence
     * product-authored, and the family loses nothing by it: b3 and b4 both
     * interrogate a primality program, and b5 makes the learner build one
     * inside a counting loop.
     *
     * This task WAS the plain `yes` / `no` check, and its reference solution
     * was byte-identical to three programs the lesson had already put on the
     * screen — `m2.l8.b4`'s `fixedCode`, which `revealFor` hands back the
     * moment the repair is right; `m2.l8.b5`'s starting program; and the
     * filled-in twin at `m2.l8.b6s` — and one line away from a fourth, the
     * worked example at `m2.l8.b1`, which differs only in reading 91 instead of
     * input. Scrolling up one card and pasting passed all ten cases. A lesson
     * that prints a program four times cannot then ask for that program: the
     * fourth showing is the answer key.
     *
     * The smallest divisor keeps every piece of the reasoning b1 models —
     * start at 2, stop at `n // 2`, keep the `+ 1`, leave the loop the moment a
     * divisor appears — and moves the thinking onto the one thing a verdict
     * hides: what it MEANS that the loop found nothing. `d = n` is that meaning
     * written down, and a learner who cannot say why the initial value is n has
     * not understood the definition the loop is testing.
     *
     * It also makes `break` a graded requirement instead of a stated one. With
     * a yes / no flag the program answers identically whether or not the loop
     * stops early, so the old prompt demanded `break` and no case could see it.
     * Here the first divisor found IS the answer, so a loop that keeps going
     * prints 6 for 12 — on the visible sample, where the learner can see it.
     */
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бүтін сан n беріледі, 2 ≤ n ≤ 100000. n-нің 1-ден үлкен ең кіші бөлгішін шығар. Мысалы, n = 12 үшін жауап 2, ал n = 91 үшін 7. Егер n жай сан болса, оны 1-ден басқа тек өзі бөледі, сондықтан жауап — n-нің өзі: n = 13 үшін 13. Бөлгішті 2-ден бастап циклмен ізде. Бірінші кездескен бөлгіш — ең кішісі, сондықтан дәл сол жерде `break` арқылы циклден шық: цикл жалғаса берсе, экранға ең кішісі емес, соңғы табылған бөлгіш шығып кетеді.",
      ru: "В одной строке дано целое число n, 2 ≤ n ≤ 100000. Выведи наименьший делитель числа n, больший 1. Например, для n = 12 ответ 2, а для n = 91 — 7. Если n простое, то, кроме 1, его делит только оно само, поэтому ответ — само n: для n = 13 ответ 13. Делитель ищи циклом, начиная с 2. Первый встреченный делитель и есть наименьший, поэтому именно там выходи из цикла через `break`: если цикл продолжится, на экран попадёт последний найденный делитель, а не наименьший.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "d = n\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        d = i\n" +
      "        break\n" +
      "print(d)",
    /* Every hidden case kills a named wrong program:
       "2"       → `d` initialised to 0 instead of to n: at n = 2 the range is
                   empty, so the starting value is the only thing that can be
                   right and there is nowhere for a guess to hide;
       "4"       → `range(2, n // 2)` without the `+ 1`, the only n at which
                   that off-by-one changes the answer;
       "9", "25" → a search that only tries the divisor 2, which is the
                   shortcut a learner reaches for after «жұп сан жай емес»;
       "45"      → a loop with no `break`: it overwrites d along 3, 5, 9, 15
                   and prints 15;
       "97"      → a prime whose loop actually runs — 2 through 48 — and must
                   still end with the initial value standing;
       "99999"   → a large composite with a small divisor, so the answer has to
                   arrive long before the bound;
       "99991"   → prime, at the top of the stated range: fifty thousand steps
                   that find nothing. */
    cases: [
      { input: "12", expectedOutput: "2" },
      { input: "13", expectedOutput: "13" },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "4", expectedOutput: "2", hidden: true },
      { input: "9", expectedOutput: "3", hidden: true },
      { input: "25", expectedOutput: "5", hidden: true },
      { input: "45", expectedOutput: "3", hidden: true },
      { input: "97", expectedOutput: "97", hidden: true },
      { input: "99999", expectedOutput: "3", hidden: true },
      { input: "99991", expectedOutput: "99991", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m2.l8.b6 — the same problem, the same examples,
     * completed instead of written. PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ».
     *
     * The blanks moved with the problem, and they had to. The old template was
     * the primality program with `<`, `==` and `break` taken out — and that
     * program is printed in full by `m2.l8.b5` on the card immediately before
     * this one, on this route as much as on the others, so support's one
     * encounter with the family was three tokens copied off the previous
     * screen.
     *
     * What is withheld now is the task's thinking and nothing else: the value
     * that has to survive a loop which finds no divisor, the value worth
     * keeping when it does, and the statement that keeps the FIRST one instead
     * of the last. The bound and the divisibility test are given, because b1
     * argues for both at length and support is meant to apply that argument
     * rather than re-derive it.
     */
    id: "m2.l8.b6s",
    type: "fill_blank",
    skillRefs: ["loops.for", "arith.remainder", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бағдарлама n-нің 1-ден үлкен ең кіші бөлгішін табуы керек: n = 12 үшін жауап 2, ал n = 13 жай сан болғандықтан жауап 13. Үш бос орынды толтыр: (1) бөлгіш мүлде табылмаса, `d`-да қандай мән қалуы керек — жай сан үшін дұрыс жауап дәл сол болады; (2) бөлгіш табылғанда `d`-ға нені жазамыз; (3) ең кішісі сақталып қалуы үшін циклден шығатын команда.",
      ru: "Программа должна найти наименьший делитель числа n, больший 1: для n = 12 ответ 2, а для n = 13 ответ 13, потому что 13 простое. Заполни три пропуска: (1) какое значение должно остаться в `d`, если делитель вообще не найдётся — для простого числа это и есть верный ответ; (2) что записываем в `d`, когда делитель найден; (3) команда, выходящая из цикла, чтобы сохранился именно наименьший делитель.",
    },
    template:
      "n = int(input())\n" +
      "d = ___\n" +
      "for i in range(2, n // 2 + 1):\n" +
      "    if n % i == 0:\n" +
      "        d = ___\n" +
      "        ___\n" +
      "print(d)",
    blanks: [
      { id: "f1", answer: "n" },
      { id: "f2", answer: "i" },
      { id: "f3", answer: "break" },
    ],
  },
  {
    /*
     * PDF p.7: «тізімді кері аудару». The prompt bans `a[::-1]` by name because
     * October has genuinely met slicing and the one-liner would otherwise be
     * the honest answer to a question that is not being asked.
     *
     * The reference solution never converts to int — the numbers are only ever
     * re-printed, so `input().split()` and `" ".join(b)` are enough. A learner
     * who does convert passes identically; the cases judge the output.
     *
     * Cases against the wrong programs:
     *   "7"                  → range(len(a) - 1, 0, -1), which prints nothing;
     *   "5 8 2 9", "1 2"     → the same bug, which drops the first element;
     *   "1 2 3 4"            → a swap loop over the FULL range, which swaps
     *   "10 20 30 40 50"       every pair twice and hands back the original;
     *   "-3 0 12 -5"         → a solution that assumes positive numbers when
     *                          it rebuilds the line. */
    id: "m2.l8.b7",
    type: "write_code",
    skillRefs: ["lists.traverse", "lists.index", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Оларды кері ретпен, бір жолда, бос орынмен бөліп шығар. Мысалы, `5 8 2 9` үшін жауап `9 2 8 5`. Тізімді соңғы индекстен, яғни `len(a) - 1`-ден бастап 0-ге дейін аралау керек. `reversed()`, `sorted()` және `a[::-1]` қолдануға болмайды — кері жүрудің өзі осы сабақтың мақсаты.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно). Выведи их в обратном порядке, в одну строку, через пробел. Например, для `5 8 2 9` ответ `9 2 8 5`. Список надо обойти от последнего индекса, то есть от `len(a) - 1`, до 0. Пользоваться `reversed()`, `sorted()` и `a[::-1]` нельзя — сам обратный обход и есть цель этого урока.",
    },
    referenceSolution:
      "a = input().split()\n" +
      "b = []\n" +
      "for i in range(len(a) - 1, -1, -1):\n" +
      "    b.append(a[i])\n" +
      'print(" ".join(b))',
    cases: [
      { input: "5 8 2 9", expectedOutput: "9 2 8 5" },
      { input: "7", expectedOutput: "7" },
      { input: "1 2", expectedOutput: "2 1", hidden: true },
      { input: "1 2 3 4", expectedOutput: "4 3 2 1", hidden: true },
      { input: "10 20 30 40 50", expectedOutput: "50 40 30 20 10", hidden: true },
      { input: "-3 0 12 -5", expectedOutput: "-5 12 0 -3", hidden: true },
      { input: "4 4 4", expectedOutput: "4 4 4", hidden: true },
    ],
  },
  {
    /*
     * Two accumulators of the same kind, in one pass, and the order of the two
     * assignments inside the update is the entire difficulty: `best = a[i]`
     * written before `second = best` throws the old maximum away and the
     * program quietly prints the same number twice.
     *
     * Duplicates are defined in the prompt rather than left to taste, because
     * "5 5 3" has two defensible answers and a hidden case must not decide
     * between them silently. The rule chosen — remove ONE copy of the maximum —
     * is the one that keeps `7 7` answerable.
     *
     * Both starting values come from a[0] and a[1], never from 0: the
     * all-negative case is here for exactly the reason m2.l5.b2 gave.
     */
    id: "m2.l8.b8",
    bank: {
      role: "extra_practice",
      why:
        "Carrying two accumulators through one pass is established by m2.l5.b7, which prints a sum and an average from a single traversal. Largest-and-second-largest is a harder instance of that pattern, not a new one, and its own boundary case (duplicate maxima) is covered by the cases rather than by a second task.",
    },
    type: "challenge",
    skillRefs: ["lists.traverse", "loops.accumulator", "compare.operators"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі — кемінде екеу. Бір жолда екі санды шығар: ең үлкенін, содан кейін екінші үлкенін. «Екінші үлкен» деп ең үлкен мәннің БІР данасын алып тастағаннан кейін қалғандардың ең үлкенін айтамыз, сондықтан `7 7` үшін жауап `7 7`, ал `3 1 4 1 5` үшін `5 4`. Тізімді бір-ақ рет аралап шық: екі жинақтаушыны қатар жүргіз және жаңарту кезінде оларды қай ретпен жазатыныңа мұқият бол.",
      ru: "В одной строке даны целые числа через пробел — не меньше двух. Выведи в одну строку два числа: наибольшее, а за ним второе по величине. «Второе по величине» — это наибольшее из оставшихся после того, как убран ОДИН экземпляр максимума, поэтому для `7 7` ответ `7 7`, а для `3 1 4 1 5` — `5 4`. Пройди список ровно один раз: веди два накопителя одновременно и внимательно следи за порядком, в котором их обновляешь.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "best = a[0]\n" +
      "second = a[1]\n" +
      "if second > best:\n" +
      "    best = a[1]\n" +
      "    second = a[0]\n" +
      "for i in range(2, len(a)):\n" +
      "    if a[i] > best:\n" +
      "        second = best\n" +
      "        best = a[i]\n" +
      "    elif a[i] > second:\n" +
      "        second = a[i]\n" +
      "print(best, second)",
    cases: [
      { input: "3 1 4 1 5", expectedOutput: "5 4" },
      { input: "7 7", expectedOutput: "7 7" },
      /* Two elements only, maximum second: kills a program that takes both
         starting values from a[0] and never looks at a[1]. */
      { input: "1 2", expectedOutput: "2 1", hidden: true },
      /* All negative: kills best = 0 and second = 0. */
      { input: "-5 -9 -2 -7", expectedOutput: "-2 -5", hidden: true },
      /* The runner-up appears AFTER the maximum and never becomes it: kills a
         program that updates `second` only inside the `best` branch. */
      { input: "1 5 4", expectedOutput: "5 4", hidden: true },
      /* The maximum arrives last: kills the update written in the wrong order,
         which answers "9 9" here. */
      { input: "1 1 9", expectedOutput: "9 1", hidden: true },
      { input: "5 4 3 2 1", expectedOutput: "5 4", hidden: true },
      { input: "2 2 2", expectedOutput: "2 2", hidden: true },
      /* The repeated maximum arrives at index 2, where the initialisation has
         NOT already seeded `second` with it. Without this case the prompt's own
         rule — remove ONE copy of the maximum, which is why `7 7` answers
         `7 7` — was stated and never checked: the reading it exists to forbid,
         `elif a[i] > second and a[i] < best`, passed all eight of the other
         cases, because `7 7` and `2 2 2` both put the repeat in the first two
         positions. Here that program prints "5 1". */
      { input: "1 5 5", expectedOutput: "5 5", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY. PDF p.6: «шешімді жазбаша қорғау міндетті». The two
     * questions are chosen so that neither can be answered by describing what
     * the code does — both require a claim about numbers that the code merely
     * relies on. Unmeasured by design: it settles as `unknown` and a teacher
     * reads it.
     */
    id: "m2.l8.b9",
    type: "explain",
    skillRefs: ["loops.for", "debug.boundary", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Жай санды тексеретін циклді жазбаша қорға. Екі сұраққа жауап бер. (1) Бөлгішті іздеуді неге `n // 2`-ден әрі жалғастырудың қажеті жоқ — n-нен басқа, `n // 2`-ден үлкен бөлгіш неге мүлде болуы мүмкін емес? (2) Цикл 2-ден емес, 1-ден басталса, бағдарлама не істейді және неге дәл солай болады? Әр жауабыңа нақты сан мысалын келтір.",
      ru: "Письменно защити цикл проверки на простоту. Ответь на два вопроса. (1) Почему поиск делителя незачем продолжать дальше `n // 2` — почему делителя больше `n // 2` (кроме самого n) вообще не может существовать? (2) Что произойдёт с программой, если цикл начнётся не с 2, а с 1, и почему именно так? К каждому ответу приведи пример с конкретным числом.",
    },
    expectedPoints: [
      {
        kk: "d — n-нің бөлгіші және d > n // 2 болса, n // d бөліндісі 2-ден кіші болар еді, яғни 1-ге тең; ал бөліндісі 1 болатын жалғыз бөлгіш — n-нің өзі. Демек `n // 2` мен n аралығында бөлгіш жоқ.",
        ru: "Если d — делитель n и d > n // 2, то частное n // d оказалось бы меньше 2, то есть равным 1; а единственный делитель с частным 1 — это само n. Значит, между `n // 2` и n делителей нет.",
      },
      {
        kk: "Сондықтан `n // 2`-ні қоса тексеру жеткілікті, ал `range(2, n // 2 + 1)`-дегі «+ 1» дәл `n // 2` санының өзін іздеуге кіргізеді. Мысал: n = 4 үшін «+ 1» болмаса цикл бос болып қалады да, 4 жай деп жарияланады.",
        ru: "Поэтому достаточно проверить до `n // 2` включительно, а «+ 1» в `range(2, n // 2 + 1)` как раз включает само число `n // 2` в перебор. Пример: при n = 4 без «+ 1» цикл окажется пустым и 4 будет объявлено простым.",
      },
      {
        kk: "Цикл 1-ден басталса, `n % 1` әрқашан 0 — кез келген бүтін сан 1-ге қалдықсыз бөлінеді. Сондықтан бірінші қадамда-ақ `prime = 0` болып, `break` істейді, ал бағдарлама КЕЗ КЕЛГЕН n үшін `no` шығарады. Мысал: n = 7 үшін де `no` шығады.",
        ru: "Если цикл начнётся с 1, то `n % 1` всегда равно 0 — любое целое делится на 1 без остатка. Поэтому уже на первом шаге `prime = 0` и срабатывает `break`, а программа выводит `no` для ЛЮБОГО n. Пример: даже для n = 7 будет `no`.",
      },
      {
        kk: "1 мен n — анықтаманың өзі рұқсат еткен бөлгіштер, сондықтан оларды іздеуден шығару — кездейсоқтық емес, шешімнің саналы бөлігі: цикл дәл сол екеуінің арасын, яғни 2-ден `n // 2`-ге дейінгі аралықты ғана қарайды.",
        ru: "1 и n — это делители, которые определение и так разрешает, поэтому их исключение из перебора не случайность, а осознанная часть решения: цикл смотрит ровно промежуток между ними, то есть от 2 до `n // 2`.",
      },
    ],
  },
];
