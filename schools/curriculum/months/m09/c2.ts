import type { LessonBlock } from "../../types";

/**
 * m9.c2 · «2-жаттығу жарысы» / «Тренировочное соревнование 2» — 45 minutes,
 * the second of May's four practice contests.
 *
 * ## The clauses that drive every line below, all PDF p.10
 *
 * > «төрт 45 минуттық жаттығу жарысы»
 *
 * The format is the programme's: four contests, forty-five minutes each. The
 * five problems are not — the PDF names the FORMAT and never a problem list, so
 * every block here is `product-authored` and none cites a page. The page belongs
 * to `month-09-may.ts`, which implements the format itself.
 *
 * > «Бұл айда жаңа тақырып жоқ.»
 *
 * The rule that decides what may and may not appear. No problem here needs a
 * method the year has not taught, and each block's comment names the month and
 * the technique it draws on. That naming is the check a later reader can run: a
 * problem nobody can place in a month of this year is a problem this course did
 * not prepare anyone for, however good it is.
 *
 * > «уақытында басқа есепке ауысу»
 *
 * So the five are ordered by real difficulty and the gaps between them are real:
 * roughly 5 · 8 · 8 · 11 · 13 minutes. That ordering is the teaching device this
 * lesson's own objective — «тұрып қалған есепті уақытында тастау» — needs.
 *
 * ## Which half of the year this contest draws on
 *
 * The second, by design: contest 1 walked September through January, so this one
 * takes October/November (A), February (B and C) and March (D and E). Between
 * the four contests the year gets covered once.
 *
 *   A  a single traversal with a helper function   — October + November
 *   B  every triple, checked exhaustively          — February
 *   C  a self-calling function with a stop rule    — February
 *   D  a region on a map, flood-filled             — March
 *   E  the wave, run twice                         — March
 *
 * ## Why `challenge` and not `arena_problem`
 *
 * `ArenaProblemBlock` renders as a bare prompt with no editor and no cases, so a
 * contest problem declared that way cannot be submitted. `challenge` renders
 * through the same code-task surface as `write_code` and is the taxonomy's block
 * for a harder standalone problem. All five are that, as in c1 and c3.
 *
 * ## What the `skillRefs` name, and what they deliberately do not
 *
 * The YEAR skill each problem actually measures — `func.return`, `enumerate.all`,
 * `recursion.base_case`, `graph.regions`, `graph.shortest_path` — and not the
 * four `contest.*` skills. Solving D is evidence that the learner can flood-fill
 * a map; it is not evidence about how they spent their forty-five minutes, and
 * filing it as such would put a number on the one thing this month wants a
 * teacher to watch with their own eyes. The lesson declares the contest skills in
 * `month-09-may.ts`; the problems declare what they really measure.
 *
 * ## The structural requirements, and which honest option each took
 *
 * A wants a helper function; C wants a self-calling one. Output comparison sees
 * neither — a single long loop prints the same count, and an iterative Euclid
 * prints the same divisor. So neither prompt states a rule it cannot enforce:
 *
 *   · A takes **option 2 — guidance, graded on the answer**. Its «Кеңес» says a
 *     helper is convenient and says in the same breath that the judge compares
 *     only the printed number. Option 1 is unavailable: no output here is
 *     impossible without a function.
 *   · C takes **option 2 as well**, and goes further by not asking for recursion
 *     at all. The statement hands the learner the recurrence — f(a, 0) = a,
 *     f(a, b) = f(b, a % b) — and asks for the ANSWER. A learner who unrolls it
 *     into a `while` loop has understood the same thing and is not told they
 *     broke a rule that was never checked.
 *   · E takes **option 1**, the only place it genuinely works: the 25 × 25 open
 *     map in its hidden cases cannot be answered by walking routes one at a time.
 *     The wave finishes it instantly; enumeration does not finish at all. That is
 *     a constraint the other method cannot meet, not a sentence in a prompt.
 *
 * ## What the stated bounds promise and what the cases can prove
 *
 * B says n ≤ 100 to make exhaustive checking of every triple legitimate, and C
 * says a[i] ≤ 10⁹ to rule out trying every divisor from the smallest number
 * downwards. Those bounds are real contest constraints and they are the
 * statement telling the learner which method it wants. What they are NOT is
 * something this judge measures: except for E's big map, the cases are small and
 * a needlessly slow but correct program passes them. Recorded here rather than
 * dressed up; no prompt claims the checker times anything.
 *
 * ## No `tracks`
 *
 * All five go to all three routes, as in c3. A practice contest whose support
 * route is four problems is a different event, and the differentiation p.6 asks
 * for lives in when help opens and in the month's other lessons — not in quietly
 * handing one route a shorter contest.
 */

export const M9_C2: LessonBlock[] = [
  {
    /*
     * A · five minutes. OCTOBER for the traversal of a list of words and for
     * «жолды таңбалар тізбегі ретінде өңдеу» (m2.l6), NOVEMBER for the helper
     * that takes one word and returns a verdict (m3.l1–l3, m3.l5). The `in`
     * test against a string of digits is October's `logic.in`, shown in m2.
     *
     * The three conditions are joined by `and` on purpose: each one alone is a
     * program a learner in a hurry writes, and each has its own case.
     *
     * The degenerate programs, and what kills each:
     *   · length only, ignoring digits and letters — «abcdefgh» answers 1, the
     *     truth is 0;
     *   · length + digit, forgetting the letter — «12345678» answers 1, truth 0;
     *   · `or` where `and` belongs — «a123456» is seven characters with both a
     *     digit and a letter and answers 1, truth 0;
     *   · `>` instead of `>=` on 8 — «a1234567» sits exactly on the boundary and
     *     answers 0, truth 1;
     *   · counting every password — «ab1 cd2 ef3» answers 3, truth 0;
     *   · a loop that misses the last word or starts one late — the only strong
     *     password is last in one case and first in another. «Соңғы элементті
     *     өткізіп жіберу» is the error October's page names by hand, and the
     *     contest's first problem is the cheapest place to be caught by it.
     */
    id: "m9.c2.p1",
    type: "challenge",
    skillRefs: ["func.define", "func.return", "strings.sequence", "lists.traverse", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "**A. Мықты құпиясөз.**\n\nМектеп сайтына тіркелу кезінде оқушылар n құпиясөз ұсынды. Әр құпиясөз тек кіші латын әріптерінен және цифрлардан тұрады.\n\nҚұпиясөзді МЫҚТЫ деп атаймыз, егер ол мына үш шартты бірдей қанағаттандырса: ұзындығы кемінде 8 таңба; ішінде кемінде бір цифр бар; ішінде кемінде бір әріп бар. Осы үшеуінің біреуі орындалмаса, құпиясөз мықты болмайды.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n құпиясөз; әрқайсысының ұзындығы 1-ден 20-ға дейін.\n\n**Шығыс.** Бір бүтін сан — мықты құпиясөздердің саны. Мықты құпиясөз болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n4\nabc12 password1 12345678 qwertyui9\n```\n\nЖауап: `2`. Мықтылары — `password1` және `qwertyui9`. `abc12` тым қысқа, ал `12345678`-де бірде-бір әріп жоқ.\n\n**Кеңес.** Бір құпиясөзді тексеретін жеке функция жазып, оны әр құпиясөзге шақырған ыңғайлы. Бұл — кеңес, талап емес: тексеру жүйесі тек шыққан санды салыстырады.",
      ru: "**A. Надёжный пароль.**\n\nПри регистрации на школьном сайте ученики предложили n паролей. Каждый пароль состоит только из строчных латинских букв и цифр.\n\nНазовём пароль НАДЁЖНЫМ, если у него есть все три свойства: длина не меньше 8 символов, внутри есть хотя бы одна цифра, внутри есть хотя бы одна буква. Если хотя бы одно из трёх не выполнено, пароль ненадёжный.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 1000). Во второй строке через пробел n паролей; длина каждого от 1 до 20.\n\n**Выход.** Одно целое число — количество надёжных паролей. Если надёжных нет, выведи 0.\n\n**Пример.**\n\n```\n4\nabc12 password1 12345678 qwertyui9\n```\n\nОтвет: `2`. Надёжны `password1` и `qwertyui9`. Пароль `abc12` слишком короткий, а в `12345678` нет ни одной буквы.\n\n**Совет.** Удобно написать отдельную функцию, которая проверяет один пароль, и вызывать её для каждого. Это совет, а не требование: проверяющая система сравнивает только выведенное число.",
    },
    referenceSolution:
      "def is_strong(w):\n" +
      "    if len(w) < 8:\n" +
      "        return False\n" +
      "    digits = 0\n" +
      "    letters = 0\n" +
      "    for i in range(len(w)):\n" +
      '        if w[i] in "0123456789":\n' +
      "            digits = digits + 1\n" +
      "        else:\n" +
      "            letters = letters + 1\n" +
      "    if digits > 0 and letters > 0:\n" +
      "        return True\n" +
      "    return False\n" +
      "\n" +
      "n = int(input())\n" +
      "words = input().split()\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    if is_strong(words[i]):\n" +
      "        count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "4\nabc12 password1 12345678 qwertyui9", expectedOutput: "2" },
      /* Eight letters, not one digit: this is what "length only" dies on. */
      { input: "1\nabcdefgh", expectedOutput: "0", hidden: true },
      /* Eight digits, not one letter: the condition a hurried solution drops. */
      { input: "1\n12345678", expectedOutput: "0", hidden: true },
      /* Exactly on the boundary, and one character below it. */
      { input: "1\na1234567", expectedOutput: "1", hidden: true },
      { input: "1\na123456", expectedOutput: "0", hidden: true },
      /* A digit in the first position rather than the last. */
      { input: "1\n1abcdefg", expectedOutput: "1", hidden: true },
      /* Every password strong, then none of them. */
      { input: "3\nabcdefg1 abcdefg1 abcdefg1", expectedOutput: "3", hidden: true },
      { input: "3\nab1 cd2 ef3", expectedOutput: "0", hidden: true },
      /* The only strong password is first, then last. */
      { input: "3\nz9z9z9z9 aaa 12", expectedOutput: "1", hidden: true },
      { input: "3\naaa 12 z9z9z9z9", expectedOutput: "1", hidden: true },
      /* Nine characters against nine digits — length is not enough on its own. */
      { input: "2\nabcdefgh1 000000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * B · eight minutes. FEBRUARY: «нұсқалар аз болғанда барлық мүмкін нұсқаны
     * жүйелі түрде тексеру», and the PDF's own practice family «белгілі қасиеті
     * бар барлық жұп пен үштікті табу». The three nested loops with j starting
     * at i + 1 and k at j + 1 are m6.l1's, unchanged.
     *
     * n ≤ 100 is what makes the exhaustive check legitimate rather than lazy:
     * 161 700 triples is the whole search space and the statement says so out
     * loud, because February's point is knowing WHEN checking everything is
     * allowed. The 100-ones case below is that number exactly.
     *
     * The degenerate programs, and what kills each:
     *   · checking only a[i] + a[j] > a[k] and trusting the input order —
     *     «10 3 4» answers 1, the truth is 0, because the longest stick is
     *     first. All three inequalities have to be written;
     *   · `>=` instead of `>` — «1 2 3» answers 1 where 1 + 2 = 3 makes a
     *     flat line, not a triangle, and «2 3 4 5» answers 4 instead of 3;
     *   · ordered triples, all three loops over the whole list — «5 5 5»
     *     answers 6 instead of 1;
     *   · loops written j from i and k from j, so one stick is used twice —
     *     «5 5 5» again, which then answers 10;
     *   · n < 3 not surviving the loops — one stick and two sticks are both
     *     legal inputs whose answer is 0.
     */
    id: "m9.c2.p2",
    type: "challenge",
    skillRefs: ["enumerate.all", "loops.nested", "logic.and_or_not", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "**B. Үшбұрыш құрайтын үштіктер.**\n\nШеберханада n таяқша жатыр, i-таяқшаның ұзындығы a[i]. Үш таяқшадан ауданы нөлден үлкен үшбұрыш құрастыруға болады, егер кез келген екеуінің ұзындықтарының қосындысы үшіншісінен ҚАТАҢ үлкен болса. Қосынды үшіншісіне дәл тең болса, үшбұрыш шықпайды — таяқшалар бір түзудің бойына түседі.\n\nОсындай үштік нешеу?\n\nТаяқшалар өз орнымен ажыратылады: ұзындығы бірдей екеуі — бәрібір екі бөлек таяқша, ал бір таяқшаны бір үштікте екі рет алуға болмайды.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100). Екінші жолда бос орынмен бөлінген n бүтін сан: a[1] … a[n] (1 ≤ a[i] ≤ 1000).\n\n**Шығыс.** Бір бүтін сан — үшбұрыш құрайтын үштіктердің саны. Бірде-бір үштік болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n4\n3 4 5 10\n```\n\nЖауап: `1` — тек (3, 4, 5). Мысалы (4, 5, 10) жарамайды: 4 + 5 = 9, ал 9 < 10.\n\nn 100-ден аспайды, сондықтан үштіктердің бәрін бірінен соң бірін тексеріп шығуға уақыт жетеді.",
      ru: "**B. Тройки, из которых складывается треугольник.**\n\nВ мастерской лежат n палочек, длина i-й равна a[i]. Из трёх палочек можно сложить треугольник с ненулевой площадью, если сумма длин любых двух СТРОГО больше третьей. Если сумма в точности равна третьей, треугольника не получится — палочки лягут на одну прямую.\n\nСколько существует таких троек?\n\nПалочки различаются своим местом: две палочки одинаковой длины — всё равно две разные палочки, а одну и ту же палочку взять в тройку дважды нельзя.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100). Во второй строке через пробел n целых чисел: a[1] … a[n] (1 ≤ a[i] ≤ 1000).\n\n**Выход.** Одно целое число — количество троек, из которых складывается треугольник. Если таких троек нет, выведи 0.\n\n**Пример.**\n\n```\n4\n3 4 5 10\n```\n\nОтвет: `1` — только (3, 4, 5). Например, (4, 5, 10) не подходит: 4 + 5 = 9, а 9 < 10.\n\nn не превышает 100, поэтому времени хватит, чтобы перебрать все тройки подряд.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        for k in range(j + 1, n):\n" +
      "            x = a[i]\n" +
      "            y = a[j]\n" +
      "            z = a[k]\n" +
      "            if x + y > z and x + z > y and y + z > x:\n" +
      "                total = total + 1\n" +
      "print(total)",
    cases: [
      { input: "4\n3 4 5 10", expectedOutput: "1" },
      /* 1 + 2 = 3 exactly: the boundary, and what `>=` dies on. */
      { input: "3\n1 2 3", expectedOutput: "0", hidden: true },
      /* The longest stick is FIRST, so one inequality is not enough. Twice,
         because a solution that checks only a[i] + a[j] > a[k] is the single
         most likely wrong program here and one witness is thin. */
      { input: "3\n10 3 4", expectedOutput: "0", hidden: true },
      { input: "4\n10 3 4 5", expectedOutput: "1", hidden: true },
      /* Fewer than three sticks: both legal, both answer 0. */
      { input: "1\n5", expectedOutput: "0", hidden: true },
      { input: "2\n5 5", expectedOutput: "0", hidden: true },
      /* Equilateral: an ordered-triple count answers 6 here, a reused stick 10. */
      { input: "3\n5 5 5", expectedOutput: "1", hidden: true },
      { input: "4\n5 5 5 5", expectedOutput: "4", hidden: true },
      /* One stick is far too long to join anything. */
      { input: "4\n1 1 1 100", expectedOutput: "1", hidden: true },
      /* Two of the four triples fail, and (2, 3, 5) fails only on strictness. */
      { input: "4\n2 3 4 5", expectedOutput: "3", hidden: true },
      /* The top of the stated length range. */
      { input: "3\n1000 1000 1000", expectedOutput: "1", hidden: true },
      /* The largest legal n, every triple valid: the search space in full. */
      {
        input:
          "100\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1",
        expectedOutput: "161700",
        hidden: true,
      },
    ],
  },
  {
    /*
     * C · eight minutes. FEBRUARY: «функция дәл сондай, бірақ кішірек есепті
     * шешу үшін өзін-өзі шақыратын тәсіл» plus «тоқтау шарты» (m6.l3–l5). The
     * fold across the list is November's «функцияны бірнеше рет шақыру».
     *
     * WHY THE RECURRENCE IS PRINTED IN THE STATEMENT. Euclid's algorithm is not
     * in this programme, and «жаңа тақырып жоқ» forbids importing it. Handing
     * the learner the two lines — f(a, 0) = a and f(a, b) = f(b, a % b) — turns
     * the problem into exactly what February taught: implement a rule that calls
     * itself, and find where it stops. The same sentence explains why the
     * pairwise fold is stated too: that the common divisor of several numbers
     * can be built two at a time is an arithmetic fact, not a programming
     * technique, and withholding it would test maths the year never covered.
     *
     * NO RULE ABOUT RECURSION IS STATED. A learner who turns the recurrence into
     * a `while` loop prints the same number and is correct; a checker cannot see
     * the difference, so the prompt does not pretend to.
     *
     * AND ONE THING THE JUDGE GENUINELY CANNOT STOP. The runner is plain
     * `python3`, so a learner who already knows `math.gcd` can import it and be
     * marked correct. Nothing here pretends otherwise. What the titles do is
     * decline to hand over the search term: both are «the common divisor of all
     * the numbers» rather than the textbook name of the function, so nobody is
     * pointed at a library by the statement. The year has shown no import in any
     * lesson, and the recurrence in the statement is the route the course has
     * actually prepared a fourteen-year-old to take.
     *
     * The degenerate programs, and what kills each:
     *   · every divisor tried from the smallest number downwards — the two
     *     nine-digit primes need a billion steps and finish nowhere near the
     *     clock, while the intended solution answers in an instant;
     *   · the smallest number printed as the answer — the sample already
     *     answers 12 instead of 6, and «12 18 25» answers 12 instead of 1;
     *   · only the first two numbers folded — «12 18 25» answers 6, truth 1;
     *   · a fold that stops one short — «6 9 12 15 100» answers 3, truth 1;
     *   · a fold that starts at a[1] and forgets a[0] — «5 10 20 40» answers 10,
     *     truth 5;
     *   · the stop rule omitted, or the arguments swapped to f(a % b, b) — every
     *     case, with a RecursionError;
     *   · n = 1 not surviving the loop — one number is a legal input and its own
     *     answer.
     */
    id: "m9.c2.p3",
    type: "challenge",
    skillRefs: ["recursion.core", "recursion.base_case", "func.return", "arith.remainder"],
    sourceType: "product-authored",
    prompt: {
      kk: "**C. Барлығының ортақ бөлгіші.**\n\nn бүтін сан берілген. Солардың бәрін қалдықсыз бөлетін ең үлкен санды тап.\n\nЕкі санның ең үлкен ортақ бөлгішін f деп белгілейік. Оны мына екі ереже толық анықтайды:\n\n· f(a, 0) = a;\n· f(a, b) = f(b, a % b), егер b > 0 болса.\n\nЕкінші ереже f-ті өзін-өзі шақыруға мәжбүрлейді, ал әр шақыруда екінші сан кішірейеді. Сондықтан b ерте ме, кеш пе нөлге айналады да, тоқтау шарты болып тұрған бірінші ереже жұмысты аяқтайды.\n\nБірнеше санның ортақ бөлгіші жұптап есептеледі: алдымен алғашқы екеуінің ортақ бөлгішін тап, содан кейін шыққан нәтиже мен келесі санның, әрі қарай солай.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 500). Екінші жолда бос орынмен бөлінген n бүтін сан (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Шығыс.** Бір бүтін сан — берілген сандардың бәрін бөлетін ең үлкен сан.\n\n**Мысал.**\n\n```\n4\n12 18 30 42\n```\n\nЖауап: `6`.\n\nСандар миллиардқа дейін жетеді, сондықтан ең кіші саннан бастап әр бөлгішті бірінен соң бірін сынап көруге уақыт жетпейді.",
      ru: "**C. Общий делитель всех чисел.**\n\nДаны n целых чисел. Найди наибольшее число, на которое все они делятся без остатка.\n\nОбозначим наибольший общий делитель двух чисел через f. Его полностью задают два правила:\n\n· f(a, 0) = a;\n· f(a, b) = f(b, a % b), если b > 0.\n\nВторое правило заставляет f вызывать саму себя, и на каждом вызове второе число уменьшается. Значит, рано или поздно b станет нулём и сработает первое правило — условие остановки.\n\nОбщий делитель нескольких чисел считается по парам: сначала найди общий делитель первых двух, потом — полученного результата и следующего числа, и так далее.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 500). Во второй строке через пробел n целых чисел (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Выход.** Одно целое число — наибольшее число, на которое делятся все данные числа.\n\n**Пример.**\n\n```\n4\n12 18 30 42\n```\n\nОтвет: `6`.\n\nЧисла доходят до миллиарда, поэтому перебирать делители подряд, начиная с наименьшего из чисел, времени не хватит.",
    },
    referenceSolution:
      "def common(a, b):\n" +
      "    if b == 0:\n" +
      "        return a\n" +
      "    return common(b, a % b)\n" +
      "\n" +
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "g = a[0]\n" +
      "for i in range(1, n):\n" +
      "    g = common(g, a[i])\n" +
      "print(g)",
    cases: [
      { input: "4\n12 18 30 42", expectedOutput: "6" },
      /* One number, at the top of the range: it is its own answer. */
      { input: "1\n1000000000", expectedOutput: "1000000000", hidden: true },
      /* Two nine-digit primes: the divisor scan needs a billion steps. */
      { input: "2\n999999937 999999893", expectedOutput: "1", hidden: true },
      /* Folding only the first two answers 6; the third number breaks it. */
      { input: "3\n12 18 25", expectedOutput: "1", hidden: true },
      /* All equal, so the answer is the number itself. */
      { input: "3\n7 7 7", expectedOutput: "7", hidden: true },
      /* The number that ruins the divisor is LAST — a fold stopping one short
         answers 3 here. */
      { input: "5\n6 9 12 15 100", expectedOutput: "1", hidden: true },
      /* The smallest number is FIRST — a fold that skips a[0] answers 10. */
      { input: "4\n5 10 20 40", expectedOutput: "5", hidden: true },
      /* One divides the other; and a 1 in the list forces the answer to 1. */
      { input: "2\n17 34", expectedOutput: "17", hidden: true },
      { input: "2\n1000000000 1", expectedOutput: "1", hidden: true },
      /* The answer is large and is not the smallest number. */
      { input: "3\n1000000000 500000000 250000000", expectedOutput: "250000000", hidden: true },
      /* The answer IS the smallest number: the other half of the same trap. */
      { input: "3\n4 8 12", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * D · eleven minutes. MARCH: «картадағы байланысқан аймақтарды анықтау» and
     * «берілген нүктеден аймақты бояу» (m7.l2), on the input format m7.l1 fixed
     * for the whole month — `n m`, then n lines of `.` and `#`. The four-part
     * bounds check and the `dr` / `dc` pair are March's too, unchanged.
     *
     * The job is new even though the walk is not: March counted the regions,
     * measured one region and found the largest. This asks for the free cells
     * OUTSIDE the guard's region, which needs both the fill and a full scan
     * afterwards — and printing the reachable count instead of the unreachable
     * one is the first mistake the sample is built to catch.
     *
     * n, m ≤ 20 is deliberate and it is not laziness: a recursive fill on a
     * fully open map reaches a depth equal to the number of free cells, and 400
     * frames is comfortable where 2500 would end the contest in a crash for a
     * reason that has nothing to do with the problem.
     *
     * The degenerate programs, and what kills each:
     *   · the reachable count printed instead of the unreachable one — the
     *     sample answers 3 instead of 6;
     *   · diagonal moves allowed — the 2 × 2 map «.#» / «#.» answers 0, truth 1;
     *   · the start cell never marked, so it counts itself as unreached — the
     *     1 × 1 map and the walled-in guard both answer 1 instead of 0;
     *   · the bounds check missing, so index −1 wraps to the far side of the map
     *     — «..#» / «###» / «#..» is built so that row −1 is the last row and
     *     joins two regions that do not touch. Such a program either reaches the
     *     bottom region through the wrap or falls over on an index past the end
     *     of a row; the truth is 2 and neither outcome is 2;
     *   · the visited mark set after the recursive call instead of before, the
     *     error March's page names by hand («бір ұяшықтың екі рет өңделуіне
     *     әкелетін қате») — the 20 × 20 open map never finishes;
     *   · walls treated as walkable — the sample answers 0.
     * The unreachable cell sits in the very last scanned position in one case
     * and the very first in another, so a scan with either bound wrong is seen.
     */
    id: "m9.c2.p4",
    type: "challenge",
    skillRefs: ["graph.regions", "graph.dfs", "grid.cells", "loops.nested"],
    sourceType: "product-authored",
    prompt: {
      kk: "**D. Күзетші жете алмайтын ұяшықтар.**\n\nМұражай жоспары n жол мен m бағаннан тұратын тор түрінде берілген: `.` — жүруге болатын ұяшық, `#` — қабырға.\n\nКүзетші (r, c) ұяшығында тұр, ол ұяшық әрқашан бос. Бір қадамда күзетші іргелес ұяшыққа — жоғары, төмен, солға немесе оңға — көше алады. Қабырғаға баспайды, тордан шықпайды, диагональ бойынша жүрмейді.\n\nКүзетші ешқашан жете алмайтын бос ұяшықтар нешеу?\n\n**Кіріс.** Бірінші жолда n мен m сандары (1 ≤ n ≤ 20, 1 ≤ m ≤ 20). Келесі n жолда тор: әр жолда m таңба, `.` немесе `#`. Соңғы жолда бос орынмен бөлінген r мен c — күзетші тұрған ұяшықтың жол және баған нөмірі (0 ≤ r < n, 0 ≤ c < m; нөмірлеу нөлден басталады).\n\n**Шығыс.** Бір бүтін сан — күзетші жете алмайтын бос ұяшықтардың саны. Күзетші тұрған ұяшық жеткен болып саналады. Бәріне жете алса, 0 шығар.\n\n**Мысал.**\n\n```\n3 4\n.#..\n.#..\n.#..\n0 0\n```\n\nЖауап: `6`. Күзетші сол жақ бағанның үш ұяшығын ғана аралайды, ал қабырғаның ар жағында қалған алты бос ұяшыққа жол жоқ.",
      ru: "**D. Клетки, до которых охранник не дойдёт.**\n\nПлан музея задан таблицей из n строк и m столбцов: `.` — клетка, по которой можно ходить, `#` — стена.\n\nОхранник стоит в клетке (r, c), эта клетка всегда свободна. За один шаг он переходит в соседнюю клетку — вверх, вниз, влево или вправо. На стену не наступает, за пределы таблицы не выходит, по диагонали не ходит.\n\nДо скольких свободных клеток охранник не доберётся никогда?\n\n**Вход.** В первой строке числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20). В следующих n строках таблица: в каждой строке m символов, `.` или `#`. В последней строке через пробел числа r и c — номер строки и номер столбца клетки охранника (0 ≤ r < n, 0 ≤ c < m; нумерация с нуля).\n\n**Выход.** Одно целое число — количество свободных клеток, до которых охранник не доберётся. Клетка, где он стоит, считается достигнутой. Если он обойдёт все, выведи 0.\n\n**Пример.**\n\n```\n3 4\n.#..\n.#..\n.#..\n0 0\n```\n\nОтвет: `6`. Охранник обойдёт только три клетки левого столбца, а до шести свободных клеток за стеной хода нет.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "r, c = map(int, input().split())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "\n" +
      "fill(r, c)\n" +
      "left = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            left = left + 1\n" +
      "print(left)",
    cases: [
      { input: "3 4\n.#..\n.#..\n.#..\n0 0", expectedOutput: "6" },
      /* The smallest map there is: the guard is already everywhere. */
      { input: "1 1\n.\n0 0", expectedOutput: "0", hidden: true },
      /* Two cells touching only at a corner: a diagonal walk answers 0. */
      { input: "2 2\n.#\n#.\n0 0", expectedOutput: "1", hidden: true },
      /* Four cells in four corners, none connected to any other. */
      { input: "3 3\n.#.\n###\n.#.\n0 0", expectedOutput: "3", hidden: true },
      /* Open map, guard in the middle: nothing is out of reach. */
      { input: "3 3\n...\n...\n...\n1 1", expectedOutput: "0", hidden: true },
      /* The unreachable cell is the LAST one the final scan meets. */
      { input: "2 3\n..#\n##.\n0 0", expectedOutput: "1", hidden: true },
      /* …and here it is the FIRST one. */
      { input: "3 3\n.##\n###\n..#\n2 0", expectedOutput: "1", hidden: true },
      /* Two columns split by a wall, the guard on the right-hand side. */
      { input: "4 4\n.##.\n.##.\n.##.\n.##.\n0 3", expectedOutput: "4", hidden: true },
      /* Walled in on all four sides: he reaches only himself, and that is 0. */
      { input: "3 3\n###\n#.#\n###\n1 1", expectedOutput: "0", hidden: true },
      /* Row -1 is the last row of a three-row map, so a fill with no bounds
         check either wraps into the bottom region or falls off the end of a
         row. The truth is 2 and neither of those is 2. */
      { input: "3 3\n..#\n###\n#..\n0 0", expectedOutput: "2", hidden: true },
      /* The largest open map the constraints allow. A fill that marks a cell
         after recursing instead of before never finishes this one. */
      {
        input:
          "20 20\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n....................\n0 0",
        expectedOutput: "0",
        hidden: true,
      },
    ],
  },
  {
    /*
     * E · thirteen minutes, and the one problem of the five that is genuinely
     * hard. MARCH: «лабиринттегі ең қысқа жол» (m7.l3) — the wave, with the
     * queue written as a list plus a head index, which is January's two-pointer
     * idea reused and is the only queue this programme ever teaches.
     *
     * What is new is not the wave but running it twice. The shortest walk that
     * must pass through K is the shortest walk to K plus the shortest walk from
     * K onward, because the statement allows a cell to be used more than once —
     * that permission is what makes the sum correct, and it is stated in both
     * languages for exactly that reason.
     *
     * THE STRUCTURAL REQUIREMENT, and the one place option 1 works. Nothing in a
     * prompt could force a learner to use the wave rather than search every
     * route. The 25 × 25 open map in the hidden cases does: the wave answers 72
     * immediately, and route-by-route enumeration on an open map that size does
     * not finish in this century. A constraint the other method cannot meet, in
     * the authoring contract's own words.
     *
     * The degenerate programs, and what kills each:
     *   · K ignored, the direct distance printed — the sample answers 4 instead
     *     of 8, «0 0 0 3 0 0» on one row answers 0 instead of 6;
     *   · the two distances added without checking either for −1 — two maps
     *     split by a wall, one where K is cut off from S and one where F is cut
     *     off from K, and both must print −1;
     *   · −1 decided by whether F is reachable from S rather than through K —
     *     the map where S and F sit two steps apart in the open top row while K
     *     is walled away below them, so S reaches F and the answer is still −1;
     *   · cells counted instead of steps — a wave started at 1 instead of 0 is
     *     out by one on each of the two legs, so the one-row map where S is
     *     already at the shop answers 4 against a truth of 2, and the 1 × 1 map
     *     answers 2 against a truth of 0;
     *   · the straight-line distance with the walls ignored — «..#» / «.#.» /
     *     «...» answers 5 instead of 11;
     *   · diagonal moves — the corner-touching map answers 2 instead of −1, and
     *     the open 3 × 3 answers 2 instead of 4;
     *   · a detour always added, even when K already lies on the direct route —
     *     «0 0 0 2 0 4» on one row is 4, the same as ignoring K, and only a
     *     correct program gets both that case and the sample right;
     *   · depth-first search returning the first route it finds — the 25 × 25
     *     map, and the maze where the first route is far from the shortest.
     */
    id: "m9.c2.p5",
    type: "challenge",
    skillRefs: ["graph.shortest_path", "graph.bfs", "grid.cells", "func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "**E. Дүкен арқылы.**\n\nҚала жоспары n жол мен m бағаннан тұратын тор түрінде берілген: `.` — бос ұяшық, `#` — жабық ұяшық. Курьер бір қадамда іргелес бос ұяшыққа — жоғары, төмен, солға немесе оңға — көшеді; диагональ бойынша жүруге болмайды.\n\nКурьер S ұяшығынан шығып, F ұяшығына жетуі керек, бірақ жол-жөнекей міндетті түрде дүкенге — K ұяшығына — соғуы тиіс. Бір ұяшықтан бірнеше рет өтуге болады, әр қадам бірдей есептеледі.\n\nКурьерге ең аз дегенде неше қадам керек?\n\n**Кіріс.** Бірінші жолда n мен m сандары (1 ≤ n ≤ 60, 1 ≤ m ≤ 60). Келесі n жолда тор: әр жолда m таңба. Соңғы жолда бос орынмен бөлінген алты сан: sr sc kr kc fr fc — S, K және F ұяшықтарының жол және баған нөмірлері (нөмірлеу нөлден басталады). Бұл үш ұяшық әрқашан бос және олар беттесуі мүмкін.\n\n**Шығыс.** Бір бүтін сан — ең аз қадам саны. Егер S-тен K-ға жету мүмкін болмаса, немесе K-дан F-ке жету мүмкін болмаса, `-1` шығар.\n\n**Мысал.**\n\n```\n4 5\n.....\n.###.\n.....\n.....\n0 0 2 0 0 4\n```\n\nЖауап: `8`. Курьер екі қадам төмен түсіп дүкенге жетеді, содан кейін алты қадаммен F-ке шығады. S-тен F-ке тікелей төрт қадам жетер еді, бірақ дүкенге соғу міндетті.\n\nТор 60 × 60-қа дейін жетеді, сондықтан барлық маршрутты бірінен соң бірін қарап шығуға болмайды: наурызда өткен толқын әдісін еске түсір.",
      ru: "**E. Через магазин.**\n\nПлан города задан таблицей из n строк и m столбцов: `.` — свободная клетка, `#` — закрытая. За один шаг курьер переходит в соседнюю свободную клетку — вверх, вниз, влево или вправо; по диагонали ходить нельзя.\n\nКурьер выходит из клетки S и должен добраться до клетки F, но по дороге обязан заглянуть в магазин — клетку K. Проходить через одну и ту же клетку несколько раз можно, каждый шаг считается одинаково.\n\nСколько шагов нужно курьеру самое меньшее?\n\n**Вход.** В первой строке числа n и m (1 ≤ n ≤ 60, 1 ≤ m ≤ 60). В следующих n строках таблица: в каждой строке m символов. В последней строке через пробел шесть чисел: sr sc kr kc fr fc — номера строк и столбцов клеток S, K и F (нумерация с нуля). Эти три клетки всегда свободны и могут совпадать.\n\n**Выход.** Одно целое число — наименьшее количество шагов. Если из S нельзя добраться до K или из K нельзя добраться до F, выведи `-1`.\n\n**Пример.**\n\n```\n4 5\n.....\n.###.\n.....\n.....\n0 0 2 0 0 4\n```\n\nОтвет: `8`. Курьер спускается к магазину за два шага, а потом за шесть выходит к F. Напрямую от S до F хватило бы четырёх шагов, но зайти в магазин обязательно.\n\nТаблица доходит до 60 × 60, поэтому перебирать все маршруты подряд не получится: вспомни мартовскую волну.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc, kr, kc, fr, fc = map(int, input().split())\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def walk(r0, c0):\n" +
      "    dist = []\n" +
      "    for i in range(n):\n" +
      "        dist.append([-1] * m)\n" +
      "    dist[r0][c0] = 0\n" +
      "    qr = [r0]\n" +
      "    qc = [c0]\n" +
      "    head = 0\n" +
      "    while head < len(qr):\n" +
      "        r = qr[head]\n" +
      "        c = qc[head]\n" +
      "        head = head + 1\n" +
      "        for k in range(4):\n" +
      "            nr = r + dr[k]\n" +
      "            nc = c + dc[k]\n" +
      '            if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "    return dist\n" +
      "\n" +
      "first = walk(sr, sc)\n" +
      "second = walk(kr, kc)\n" +
      "if first[kr][kc] == -1 or second[fr][fc] == -1:\n" +
      "    print(-1)\n" +
      "else:\n" +
      "    print(first[kr][kc] + second[fr][fc])",
    cases: [
      { input: "4 5\n.....\n.###.\n.....\n.....\n0 0 2 0 0 4", expectedOutput: "8" },
      /* The smallest map, all three cells the same one: zero steps. */
      { input: "1 1\n.\n0 0 0 0 0 0", expectedOutput: "0", hidden: true },
      /* S is already at the shop: counting cells instead of steps answers 4. */
      { input: "1 3\n...\n0 0 0 0 0 2", expectedOutput: "2", hidden: true },
      /* The shop is past the finish, so the detour is forced: 4 there, 2 back. */
      { input: "1 5\n.....\n0 0 0 4 0 2", expectedOutput: "6", hidden: true },
      /* K already lies on the direct route: no detour is added. */
      { input: "1 5\n.....\n0 0 0 2 0 4", expectedOutput: "4", hidden: true },
      /* S and F are the same cell but the shop is four steps away and back. */
      { input: "1 4\n....\n0 0 0 3 0 0", expectedOutput: "6", hidden: true },
      /* K is cut off from S while F is two easy steps away in the top row. */
      { input: "3 3\n...\n###\n.#.\n0 0 2 0 0 2", expectedOutput: "-1", hidden: true },
      /* The other half: K is reachable, F is not reachable from K. */
      { input: "3 3\n...\n###\n...\n0 0 0 2 2 0", expectedOutput: "-1", hidden: true },
      /* Cells touching only at a corner: a diagonal walk answers 2, not -1. */
      { input: "2 2\n.#\n#.\n0 0 1 1 0 0", expectedOutput: "-1", hidden: true },
      /* An open map where diagonals would halve both legs. */
      { input: "3 3\n...\n...\n...\n0 0 1 1 2 2", expectedOutput: "4", hidden: true },
      /* Walls make both legs far longer than the straight-line distance. */
      { input: "3 3\n..#\n.#.\n...\n0 0 1 2 0 1", expectedOutput: "11", hidden: true },
      /* An open 25 × 25 map: the wave answers instantly, and walking the routes
         one at a time does not finish at all. */
      {
        input:
          "25 25\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n.........................\n0 0 24 24 0 24",
        expectedOutput: "72",
        hidden: true,
      },
    ],
  },
];
