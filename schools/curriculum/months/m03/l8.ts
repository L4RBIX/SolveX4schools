import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша · Lesson 8 — «Тізім мен мәтінге арналған функциялар» /
 * «Функции для списков и строк». 9 min. Taught FOURTH, straight after `return`.
 *
 * ## Which clauses of the programme drive it
 *
 * Three of November's eight practice families live in this one lesson, and the
 * PDF (p.8) names all three in its own words:
 *
 *   «максимум мен минимум функциясы»        → b5, b6
 *   «тізімді өңдейтін көмекші функциялар»   → b8, b8s
 *   «мәтінге арналған тексерулер»           → b7, and b9 for advanced
 *
 * A fourth clause decides the shape of every block: «параметр беру және return
 * арқылы нәтиже қайтару». And b9 is where «бірнеше функциядан тұратын шағын
 * бағдарлама» first appears — one helper calling another — which is the idea
 * l6 and l7 then build a whole decomposition on.
 *
 * Worked example #4 of the month's six is b2. The other five are in l1, l2, l3,
 * l5 and l6; see the month file's opening comment for the count.
 *
 * ## Why this lesson exists at all, given October already found a maximum
 *
 * October's `m2.l5.b2` walked a list and kept a best-so-far, and it argued
 * `best = a[0]` from a list of negative temperatures. November's contribution
 * is not the loop. It is that the data is no longer in front of you: the caller
 * hands the list in, and the function has to be right for lists its author
 * never saw. So b2 makes the same argument in the form that only a function can
 * carry — ONE `largest` called on TWO lists, where `best = 0` gets the right
 * answer on the first one by luck and returns a number that is not in the
 * second one at all. A rule that survives one dataset by accident is not a rule
 * a fourteen-year-old has any reason to believe; a rule that visibly breaks the
 * second call is.
 *
 * The same discipline picks the text task. October's `m2.l6.b4` already counts
 * vowels and `m2.l6.b7` already prints `yes`/`no` for a palindrome, so
 * repeating either as a function would be a wrapper exercise. b7 instead splits
 * the decision from the printing: `is_palindrome(word)` RETURNS 1 or 0 and
 * prints nothing, and the caller turns that number into `yes` or `no`. That is
 * the November idea — return is not print — stated as a task rather than as a
 * sentence. `count_vowels` comes back at b9, but only as the inner half of a
 * larger question no October block asked.
 *
 * ## max(), min() and sum() are absent, and that is the exercise
 *
 * `builtin.max`, `builtin.min` and `builtin.sum` arrive in month 4 —
 * `check-blocks.ts` enforces it and `capability.ts` explains why at length. The
 * programme asks the learner to WRITE the max/min function this month, so a
 * reference solution calling the builtin would not be a shortcut, it would be
 * the deleted task. Everything here is `def`, `return`, a loop and a
 * comparison.
 *
 * ## The one-element list, and why it recurs
 *
 * b3, b4 and b7 all put a call with nothing to iterate over in front of the
 * learner: `smallest([5])`, whose `range(1, 1)` body never runs, and
 * `is_palindrome("a")`, whose `range(0)` body never runs. A helper is a
 * contract, and a contract that only holds when the loop turns at least once is
 * the bug that will cost this cohort its first contest points. Meeting it three
 * times in nine minutes, in two different problems, is deliberate.
 *
 * ## Track routing
 *
 * b8 (modify) is core and advanced; support meets the same list helper as b8s,
 * a fill-blank on the finished program — «дайын кодты құрастыру мен толықтыру
 * көбірек, нөлден жазу азырақ» (p.6). b9 is advanced only: two functions where
 * one calls the other, plus a tie rule that a `>=` gets wrong. Every other
 * block is on all three routes.
 */
export const M3_L8: LessonBlock[] = [
  {
    id: "m3.l8.b1",
    type: "concept",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Тізімді қабылдап, бір мән қайтаратын функция",
      ru: "Функция, которая принимает список и возвращает одно значение",
    },
    /* The body states the SHAPE, because the shape is what transfers: parameter
       is the whole list, one local holds the answer, one traversal, and the
       `return` after the loop. The last sentence is the November boundary the
       rest of the lesson is graded on — the function does not print, the caller
       decides what to do with the value. */
    body: {
      kk: "Функцияға бір ғана сан емес, тізімнің өзін де беруге болады. Осындай көмекші функцияның пішіні әрқашан бірдей: параметр — бүкіл тізім, ішінде жауап жиналатын жергілікті айнымалы, содан кейін тізімді бір рет аралайтын цикл, ал ең соңында сол жауапты қайтаратын `return`. `return` циклдің ішінде емес, циклден КЕЙІН тұрады: цикл денесіне қойсаң, функция бірінші элементті көрген бойда тоқтап қалады. Ең бастысы — функция ештеңе шығармайды. Ол мәнді қайтарады, ал оны экранға шығару керек пе, жоқ па, оны шақырған жер шешеді.",
      ru: "В функцию можно передать не только одно число, но и целый список. У такой вспомогательной функции всегда одна и та же форма: параметр — весь список, внутри локальная переменная, в которой копится ответ, затем цикл, один раз проходящий по списку, и в самом конце `return`, возвращающий этот ответ. `return` стоит не внутри цикла, а ПОСЛЕ него: если поставить его в тело цикла, функция остановится сразу на первом элементе. И самое главное — функция ничего не печатает. Она возвращает значение, а печатать его или нет, решает то место, откуда её вызвали.",
    },
    code:
      "def total(a):\n" +
      "    s = 0\n" +
      "    for x in a:\n" +
      "        s = s + x\n" +
      "    return s\n" +
      "\n" +
      "nums = [4, 7, 2]\n" +
      "print(total(nums))\n" +
      "print(total([10, 10]))\n" +
      "\n" +
      "# 13, 20",
  },
  {
    /*
     * WORKED EXAMPLE #4 of the month's six. «Алты толық талданған мысал» (p.8).
     *
     * The two lists are the whole argument. On `box` the wrong initialisation
     * `best = 0` returns 20, which is correct — so a learner who only ever sees
     * that call has been given a rule with no evidence behind it. On `night`
     * the same initialisation returns 0, a number that appears nowhere in the
     * data. That is what a function does to you: it is called on inputs its
     * author did not choose, and "it worked on my example" stops being an
     * argument. Step 3 says exactly that in one sentence.
     *
     * Step 5 exists because the same file's b1 has just claimed `return` goes
     * after the loop; here the claim is cashed out — inside the loop it would
     * return `a[0]` every time, which for `night` is the answer -4 rather
     * than -2 and looks almost right.
     */
    id: "m3.l8.b2",
    type: "worked_example",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: ең үлкенін қайтаратын функция",
      ru: "Разобранный пример: функция, возвращающая наибольшее",
    },
    problem: {
      kk: "Екі тізім бар. Біріншісі — сынып қорына бір апта бойы салынған сомалар: 12, 5, 9, 20, 3. Екіншісі — қарашадағы бес түннің температурасы: -4, -9, -2, -7, -6. Екеуінің де ең үлкен мәнін тап. Бірдей циклді екі рет жазба: бір функция жаз да, оны екі рет шақыр.",
      ru: "Есть два списка. Первый — суммы, которые за неделю положили в классную копилку: 12, 5, 9, 20, 3. Второй — температуры пяти ноябрьских ночей: -4, -9, -2, -7, -6. Найди наибольшее значение в каждом. Не пиши один и тот же цикл дважды: напиши одну функцию и вызови её два раза.",
    },
    steps: [
      {
        kk: "Екі есептің сұрағы бір, тек деректері бөлек. Демек өзгеретін нәрсе — тізімнің өзі, ал өзгеретін нәрсе параметрге айналады: `def largest(a):`. Функцияның ішінде тізім `a` деп аталады, ал шақырған жерде оның аты мүлде басқа болуы мүмкін.",
        ru: "Вопрос в обеих задачах один и тот же, разные только данные. Значит, меняется сам список — а то, что меняется, становится параметром: `def largest(a):`. Внутри функции список зовут `a`, а в месте вызова у него может быть совсем другое имя.",
      },
      {
        kk: "Ең үлкенді табу үшін бір ғана мәнді есте ұстау жеткілікті: осы уақытқа дейін кездескендердің ең үлкені. Оны `best` деп атаймыз. Ол — жергілікті айнымалы, функция аяқталған соң жоғалады.",
        ru: "Чтобы найти наибольшее, достаточно помнить одно значение: самое большое из уже просмотренных. Назовём его `best`. Это локальная переменная — когда функция закончится, она исчезнет.",
      },
      {
        kk: "`best = 0` деп бастауға болмайды. Бірінші тізімде ол жауапты кездейсоқ дұрыс береді — 20. Ал екіншісінде сандардың бәрі теріс, сондықтан цикл `best`-ті бір рет те өзгертпейді және функция тізімде мүлде жоқ 0 санын қайтарады. Функцияны сен көрмеген деректермен де шақыратынын ұмытпа.",
        ru: "Начинать с `best = 0` нельзя. На первом списке ответ случайно окажется верным — 20. А на втором все числа отрицательные, поэтому цикл ни разу не изменит `best`, и функция вернёт 0 — число, которого в списке вообще нет. Помни: функцию вызовут и на тех данных, которых ты не видел.",
      },
      {
        kk: "Сондықтан бастапқы мән тізімнің өзінен алынады: `best = a[0]`. Енді жауап әрқашан берілген сандардың бірі болады, қандай тізім келсе де. `a[0]`-ді өзімен салыстыру зиянсыз, себебі `12 > 12` жалған.",
        ru: "Поэтому начальное значение берётся из самого списка: `best = a[0]`. Теперь ответ всегда будет одним из данных чисел, какой бы список ни пришёл. Сравнение `a[0]` с самим собой безвредно: `12 > 12` — ложь.",
      },
      {
        kk: "`return best` циклден кейін тұрады. Егер ол цикл денесіне түссе, функция бірінші элементті көрген бойда тоқтап, әрқашан `a[0]`-ді қайтарар еді: екінші тізімде бұл -2 емес, -4 болып шығады — қатесі байқалмай қалуы да мүмкін.",
        ru: "`return best` стоит после цикла. Если он попадёт в тело цикла, функция остановится на первом же элементе и всегда будет возвращать `a[0]`: на втором списке это даст -4 вместо -2 — ошибка, которую легко не заметить.",
      },
      {
        kk: "Шақырулар: `largest(box)` → `best` 12, 12, 12, 20, 20 болып өзгереді, жауабы 20. `largest(night)` → -4, -4, -2, -2, -2, жауабы -2. Бір функция, екі түрлі жауап.",
        ru: "Вызовы: `largest(box)` → `best` меняется как 12, 12, 12, 20, 20, ответ 20. `largest(night)` → -4, -4, -2, -2, -2, ответ -2. Одна функция — два разных ответа.",
      },
    ],
    code:
      "def largest(a):\n" +
      "    best = a[0]\n" +
      "    for x in a:\n" +
      "        if x > best:\n" +
      "            best = x\n" +
      "    return best\n" +
      "\n" +
      "box = [12, 5, 9, 20, 3]\n" +
      "night = [-4, -9, -2, -7, -6]\n" +
      "print(largest(box))\n" +
      "print(largest(night))",
    result: {
      kk: "Экранға екі жол шығады: алдымен 20, содан кейін -2.",
      ru: "На экран выйдут две строки: сначала 20, затем -2.",
    },
  },
  {
    /*
     * The one-element call, in the version where it actually bites. Written as
     * `for x in a` the body still runs once and nothing is at stake; written as
     * `for i in range(1, len(a))` — the perfectly ordinary "start from the
     * second element" variant — the body never runs at all, and the function
     * has to be correct anyway. `best = a[0]` is what makes it correct, which is
     * the same sentence b2 argued from the other direction.
     *
     * The prompt is neutral on purpose. "What happens when the loop does not
     * run?" would answer the question in the asking; the distractors carry the
     * diagnosis instead.
     *
     * Two of the three wrong options are left unmapped, and deliberately.
     * "3" is reached both from "a call whose loop never runs prints nothing"
     * and from "the first call is an error", and "5" both from "only the first
     * line appears" and from reading `range(1, len(a))` as running up to and
     * including `len(a)`, which would put `a[2]` out of range on a two-element
     * list. Neither answer establishes one cause, so the engine asks.
     */
    id: "m3.l8.b3",
    type: "prediction",
    skillRefs: ["func.return", "func.parameters", "lists.index", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады? Функция екі рет шақырылады, әр шақыру өз жолын шығарады. Тізімдердің ұзындығына назар аудар.",
      ru: "Что выведет эта программа? Функция вызывается дважды, каждый вызов печатает свою строку. Обрати внимание на длину списков.",
    },
    code:
      "def smallest(a):\n" +
      "    best = a[0]\n" +
      "    for i in range(1, len(a)):\n" +
      "        if a[i] < best:\n" +
      "            best = a[i]\n" +
      "    return best\n" +
      "\n" +
      "print(smallest([5]))\n" +
      "print(smallest([8, 3]))",
    answer: "5\n3",
    options: ["5\n3", "5\n8", "3", "5"],
    diagnosticMapping: {
      "5\n8": {
        failureClass: "comparison_direction_misread",
        justification:
          "8 — бұл [8, 3] тізіміндегі ең ҮЛКЕН сан, ал функция ең кішісін іздейді. Бұл жауапқа жетудің жалғыз жолы бар: `a[i] < best` шартын «үлкен болса» деп оқу. Бірінші жолдың 5 болып қалуы да соны растайды — бір элементті тізімде салыстыру бағыты көрінбейді, сондықтан қате тек екінші шақыруда шығады.",
      },
    },
  },
  {
    /*
     * «Платформа функция шақырылғанда қандай параметр мәндері кіретінін,
     * қандай жергілікті айнымалылар пайда болатынын және return кезінде не
     * қайтатынын визуалды көрсетеді» (p.8). This is that trace done by hand,
     * and the column set is chosen from that sentence: the parameter `a`, the
     * local `x` and the local `best`, in every row where they exist.
     *
     * The data is [4, 9, 9, 2]. `4` is first and is not the answer, `2` is last
     * and is not the answer, so "returns the first" and "returns the last" both
     * die in the table. The repeated 9 buys the row that matters most: `9 > 9`
     * is false, so `best` does not move, and a learner who expected an update
     * on every element sees it not happen.
     *
     * The last row is line 9 with the function already finished. `a`, `x` and
     * `best` are gone there — that is a scope observation the learner makes for
     * themselves, one lesson before `m3.l4` names it.
     */
    id: "m3.l8.b4",
    type: "trace_code",
    skillRefs: ["func.parameters", "func.return", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Функция шақырылғанда ішінде қандай айнымалылар пайда болатынын қадамдап жаз. Әр қатарда `a` (параметр), `x` (цикл айнымалысы) және `best` мәндерін көрсет. Ең соңғы қатар — функция аяқталып, басқару 9-жолға қайтқан сәт: сол сәтте қай аттар әлі бар, соны ойлан.",
      ru: "Пройди по шагам и запиши, какие переменные появляются внутри функции при вызове. В каждой строке укажи значения `a` (параметр), `x` (переменная цикла) и `best`. Самая последняя строка — момент, когда функция закончилась и управление вернулось на строку 9: подумай, какие имена в этот момент ещё существуют.",
    },
    code:
      "def largest(a):\n" +
      "    best = a[0]\n" +
      "    for x in a:\n" +
      "        if x > best:\n" +
      "            best = x\n" +
      "    return best\n" +
      "\n" +
      "nums = [4, 9, 9, 2]\n" +
      "print(largest(nums))",
    /* One row per pass of the loop body, recorded at the header line the way
       `m2.l5.b4` records it, plus the call site before and after. `nums` and
       `a` are shown side by side in the second row on purpose: one list, two
       names, which is the whole meaning of passing a parameter. */
    steps: [
      { line: 8, vars: { nums: "[4, 9, 9, 2]" } },
      { line: 2, vars: { nums: "[4, 9, 9, 2]", a: "[4, 9, 9, 2]", best: "4" } },
      { line: 3, vars: { a: "[4, 9, 9, 2]", x: "4", best: "4" } },
      { line: 3, vars: { a: "[4, 9, 9, 2]", x: "9", best: "9" } },
      { line: 3, vars: { a: "[4, 9, 9, 2]", x: "9", best: "9" } },
      { line: 3, vars: { a: "[4, 9, 9, 2]", x: "2", best: "9" } },
      { line: 6, vars: { a: "[4, 9, 9, 2]", x: "2", best: "9" } },
      { line: 9, vars: { nums: "[4, 9, 9, 2]" } },
    ],
  },
  {
    /*
     * The minimum half of «максимум мен минимум функциясы», scaffolded down to
     * the three decisions that separate a working helper from a broken one: the
     * start value, the direction of the comparison, and what leaves the
     * function. The traversal itself is handed over, because b2 and b4 have
     * just spent five minutes on it.
     *
     * The third blank is `best`, not `x`. A learner who writes `return x` gets
     * a program that compiles, runs, and prints the LAST element — 9 for this
     * list — which is why the blank is worth having at all.
     */
    id: "m3.l8.b5",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "lists.traverse", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізімнің ең кіші элементін ҚАЙТАРАТЫН функцияны толықтыр. Үш орын бар: `best` қай мәннен басталады, элементті `best`-пен қалай салыстырамыз және функция нені қайтарады? Функцияның ішінде `print` жоқ — ол мәнді қайтарады, шығаруды соңғы жол жасайды.",
      ru: "Дополни функцию, которая ВОЗВРАЩАЕТ наименьший элемент списка. Три пропуска: с какого значения начинается `best`, как сравнить элемент с `best` и что функция возвращает? Внутри функции нет `print` — она возвращает значение, а печатает последняя строка.",
    },
    template:
      "def smallest(a):\n" +
      "    best = ___\n" +
      "    for x in a:\n" +
      "        if x ___ best:\n" +
      "            best = x\n" +
      "    return ___\n" +
      "\n" +
      "print(smallest([6, 2, 9]))",
    blanks: [
      { id: "f1", answer: "a[0]" },
      { id: "f2", answer: "<" },
      { id: "f3", answer: "best" },
    ],
  },
  {
    /*
     * PDF family, verbatim: «максимум мен минимум функциясы». Two helpers, one
     * caller, and the caller is where the list is read — the division of labour
     * the whole month is about.
     *
     * The case set is built against the mutants this task actually attracts:
     *   "7"                  — one element, so `best = a[1]` crashes and a
     *                          loop starting at index 1 has nothing to do;
     *   "-4 -9 -2 -7 -6"     — all negative, so `best = 0` returns 0 for the
     *                          maximum, exactly the b2 argument as a test;
     *   "10 8 6 4"           — descending, which kills "the maximum is the last
     *                          element"; "8 1 6" puts the minimum in the middle
     *                          and kills "the minimum is the first";
     *   "5 5 5"              — all equal, where a `>` written as `>=` and a `<`
     *                          written as `<=` both still have to give 5;
     *   "-1000 1000 0"       — both stated bounds in one line;
     *   "1 3 8"              — ascending: the maximum IS the last element.
     *
     * That last line was missing, and its absence let through the one mutant
     * the programme names by hand — «соңғы элементті өткізіп жіберу». Written
     * with an index loop, `for i in range(1, len(a) - 1)` stops one element
     * short, and every other case in this set hides it: the maximum sat at
     * position 0 in "10 8 6 4" and "8 1 6", at 1 in "4 9 9 2" and
     * "-1000 1000 0", at 2 in "-4 -9 -2 -7 -6", and "5 5 5" and "7" cannot
     * tell a short loop from a complete one at all. So a `largest` that never
     * looks at the final number, paired with a correct `smallest`, passed all
     * seven. The mirror was covered — "10 8 6 4" puts the MINIMUM last and
     * kills the same truncation in `smallest` — which is what made the hole
     * invisible: half the task was tested against it and half was not.
     *
     * "1 3 8" closes it from both ends at once: the maximum is last, so a loop
     * that drops the tail returns 3; the minimum is first, so a loop that
     * starts its search at index 1 with `best = a[1]` returns 3 as well. The
     * truncated `largest` prints `3 1` where the answer is `8 1`.
     */
    id: "m3.l8.b6",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген бүтін сандар беріледі: кемінде біреу, көбі 100. Әр сан -1000 мен 1000 аралығында.\n" +
        "Екі функция жаз. `largest(a)` тізімнің ең үлкен элементін қайтарады, `smallest(a)` ең кішісін қайтарады. Екеуі де нәтижені `return` арқылы қайтарады — функцияның ішінде `print` болмауы керек.\n" +
        "Негізгі бағдарлама тізімді оқиды да, бір жолда алдымен ең үлкен, содан кейін ең кіші санды бос орынмен бөліп шығарады.\n" +
        "`4 9 9 2` берілсе, жауап: `9 2`.",
      ru:
        "В одной строке через пробел даны целые числа: не меньше одного, не больше 100. Каждое число лежит между -1000 и 1000.\n" +
        "Напиши две функции. `largest(a)` возвращает наибольший элемент списка, `smallest(a)` — наименьший. Обе возвращают результат через `return`: внутри функции не должно быть `print`.\n" +
        "Основная программа читает список и выводит в одной строке сначала наибольшее число, потом наименьшее, разделив их пробелом.\n" +
        "При вводе `4 9 9 2` ответ: `9 2`.",
    },
    referenceSolution:
      "def largest(a):\n" +
      "    best = a[0]\n" +
      "    for x in a:\n" +
      "        if x > best:\n" +
      "            best = x\n" +
      "    return best\n" +
      "\n" +
      "def smallest(a):\n" +
      "    best = a[0]\n" +
      "    for x in a:\n" +
      "        if x < best:\n" +
      "            best = x\n" +
      "    return best\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(largest(nums), smallest(nums))",
    cases: [
      { input: "4 9 9 2", expectedOutput: "9 2" },
      { input: "7", expectedOutput: "7 7" },
      { input: "-4 -9 -2 -7 -6", expectedOutput: "-2 -9", hidden: true },
      { input: "5 5 5", expectedOutput: "5 5", hidden: true },
      { input: "10 8 6 4", expectedOutput: "10 4", hidden: true },
      { input: "8 1 6", expectedOutput: "8 1", hidden: true },
      { input: "-1000 1000 0", expectedOutput: "1000 -1000", hidden: true },
      { input: "1 3 8", expectedOutput: "8 1", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «мәтінге арналған тексерулер». October already printed
     * `yes`/`no` for a palindrome at `m2.l6.b7`, so this is not that task again
     * with a `def` around it. The function returns 1 or 0 and prints NOTHING;
     * the caller owns the two tokens. Deciding and reporting are separated,
     * which is the only reason a check is worth being a function.
     *
     * Both prompts name `yes` and `no`, per the output-token rule: a program
     * that printed a Kazakh word would let a Russian-track learner match glyphs
     * instead of reasoning.
     *
     * "a" is the case that carries the lesson's recurring point: `n // 2` is 0,
     * the loop body never runs, and the function still has to return 1. "ab" is
     * the smallest word that is not a palindrome, and dies for any solution
     * whose loop is `range(n // 2 - 1)`. "abca" kills the solution that compares
     * only the first and last characters. "abba" is the even length that a
     * solution written around a middle character gets wrong.
     */
    id: "m3.l8.b7",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "strings.sequence", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ, ұзындығы 1-ден 100-ге дейін.\n" +
        "`is_palindrome(word)` функциясын жаз. Сөз палиндром болса ол 1 санын, болмаса 0 санын ҚАЙТАРСЫН. Функция экранға ештеңе шығармайды.\n" +
        "Негізгі бағдарлама сөзді оқып, функцияны шақырады: қайтқан мән 1 болса `yes`, 0 болса `no` деген сөзді шығарады.\n" +
        "Палиндром — алдынан оқығанда да, артынан оқығанда да бірдей сөз. `level` → `yes`, `world` → `no`.",
      ru:
        "В одной строке дано слово: только строчные латинские буквы, без пробелов, длина от 1 до 100.\n" +
        "Напиши функцию `is_palindrome(word)`. Если слово — палиндром, она ВОЗВРАЩАЕТ число 1, иначе 0. Сама функция ничего не печатает.\n" +
        "Основная программа читает слово и вызывает функцию: если вернулась 1, она выводит слово `yes`, если 0 — слово `no`.\n" +
        "Палиндром читается одинаково слева направо и справа налево. `level` → `yes`, `world` → `no`.",
    },
    /* The early `return 0` is deliberate and is l3's material one lesson on:
       once the answer is known, nothing after it needs to run. A learner who
       writes the `ok = 1` flag version instead passes every case — the checker
       judges the output, not the route. */
    referenceSolution:
      "def is_palindrome(word):\n" +
      "    n = len(word)\n" +
      "    for i in range(n // 2):\n" +
      "        if word[i] != word[n - 1 - i]:\n" +
      "            return 0\n" +
      "    return 1\n" +
      "\n" +
      "w = input()\n" +
      "if is_palindrome(w) == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    cases: [
      { input: "level", expectedOutput: "yes" },
      { input: "world", expectedOutput: "no" },
      { input: "a", expectedOutput: "yes", hidden: true },
      { input: "ab", expectedOutput: "no", hidden: true },
      { input: "abba", expectedOutput: "yes", hidden: true },
      { input: "abca", expectedOutput: "no", hidden: true },
      { input: "kayak", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «тізімді өңдейтін көмекші функциялар». The helper here
     * returns a LIST, not a number, which is the third shape of `return` this
     * lesson shows after a number (b2, b6) and a flag (b7).
     *
     * It is a modify and not a write for two reasons. The lesson's repair slot
     * belongs somewhere, and the printing scaffold — build a list of strings,
     * `" ".join` it — is October's `m2.l7.b7` verbatim and is not what is being
     * assessed. What the learner changes is the body of the helper: from "put
     * something in for every element" to "put something in only for some
     * elements", with the `b = []` … `return b` frame left standing so the
     * shape survives the edit.
     *
     * The starting program's output differs from the target's on every single
     * case — `doubled` and `only_even` never agree on any of the seven inputs —
     * so no half-edit slips through a token comparison.
     *
     * "at least one even number" is guaranteed in both prompts. Without it the
     * task would smuggle in an empty-result branch, which is a different idea
     * and belongs where it can be taught rather than sprung.
     */
    id: "m3.l8.b8",
    type: "modify_code",
    skillRefs: ["func.define", "func.return", "lists.traverse", "loops.for", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бұл бағдарламадағы `doubled(a)` функциясы жаңа тізім жасап, ондағы әр санды екі есе етіп қайтарады, ал негізгі бағдарлама сол тізімді бір жолда бос орынмен бөліп шығарады.\n" +
        "Функцияны өзгерт: ол енді `a` тізімінің ЖҰП сандарын ғана, бастапқы ретін сақтап, жаңа тізім етіп қайтарсын. Функция ішінде `print` болмайды және шығару бөлігін өзгертудің қажеті жоқ.\n" +
        "Кірісте кемінде бір жұп сан бар екеніне кепілдік беріледі. `4 7 10 3` берілсе, жауап: `4 10`.",
      ru:
        "В этой программе функция `doubled(a)` строит новый список, удваивая каждое число, а основная программа печатает его в одной строке через пробел.\n" +
        "Измени функцию так, чтобы она возвращала новым списком только ЧЁТНЫЕ числа из `a`, сохраняя их исходный порядок. Внутри функции нет `print`, и часть с выводом менять не нужно.\n" +
        "Гарантируется, что во входных данных есть хотя бы одно чётное число. При вводе `4 7 10 3` ответ: `4 10`.",
    },
    code:
      "def doubled(a):\n" +
      "    b = []\n" +
      "    for x in a:\n" +
      "        b.append(x * 2)\n" +
      "    return b\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "res = doubled(nums)\n" +
      "out = []\n" +
      "for x in res:\n" +
      "    out.append(str(x))\n" +
      'print(" ".join(out))',
    referenceSolution:
      "def only_even(a):\n" +
      "    b = []\n" +
      "    for x in a:\n" +
      "        if x % 2 == 0:\n" +
      "            b.append(x)\n" +
      "    return b\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "res = only_even(nums)\n" +
      "out = []\n" +
      "for x in res:\n" +
      "    out.append(str(x))\n" +
      'print(" ".join(out))',
    /* "0 5 6" is in the set because 0 is even, and a filter written as
       `x % 2 == 0 and x > 0` passes everything else here. "-4 -7 -2" is there
       because a learner who tests evenness with `x % 2 == 1` for odd numbers
       meets Python's `-7 % 2 == 1` and gets it right, while `x % 2` compared
       against a negative remainder from another language does not. "9 9 4"
       leaves the only even number last, which kills a helper that returns as
       soon as it finds one. "8 8 8" proves duplicates are kept. */
    cases: [
      { input: "4 7 10 3", expectedOutput: "4 10" },
      { input: "1 2 3", expectedOutput: "2" },
      { input: "0 5 6", expectedOutput: "0 6", hidden: true },
      { input: "-4 -7 -2", expectedOutput: "-4 -2", hidden: true },
      { input: "8 8 8", expectedOutput: "8 8 8", hidden: true },
      { input: "2 4 6 8", expectedOutput: "2 4 6 8", hidden: true },
      { input: "9 9 4", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m3.l8.b8 — the same list helper, completed
     * rather than rewritten. «Дайын кодты құрастыру мен толықтыру көбірек,
     * нөлден жазу азырақ» (p.6).
     *
     * The three blanks are the three parts of the shape b1 described: the new
     * list starts empty, the test that decides what goes in, and the fact that
     * what leaves the function is the collected list rather than one element.
     * `return x` in the third blank would compile and return the last even
     * number, which is precisely the confusion this route needs to meet
     * somewhere it can be corrected in one move.
     */
    id: "m3.l8.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "lists.traverse", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk:
        "Тізімнің ЖҰП сандарын ғана жинап, оларды ЖАҢА тізім етіп қайтаратын функцияны толықтыр. Үш орын бар: жаңа тізім неден басталады, «жұп» дегенді қалдық арқылы қалай тексереміз және функция нені қайтарады?\n" +
        "Негізгі бағдарлама қайтқан тізімді бір жолда бос орынмен бөліп шығарады. Кірісте кемінде бір жұп сан бар. `4 7 10 3` берілсе, `4 10` шығады.",
      ru:
        "Дополни функцию, которая собирает только ЧЁТНЫЕ числа списка и возвращает их НОВЫМ списком. Три пропуска: с чего начинается новый список, как проверить «чётное» через остаток и что функция возвращает?\n" +
        "Основная программа печатает возвращённый список в одной строке через пробел. Во входных данных есть хотя бы одно чётное число. При вводе `4 7 10 3` выведется `4 10`.",
    },
    template:
      "def only_even(a):\n" +
      "    b = ___\n" +
      "    for x in a:\n" +
      "        if x % 2 == ___:\n" +
      "            b.append(x)\n" +
      "    return ___\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "res = only_even(nums)\n" +
      "out = []\n" +
      "for x in res:\n" +
      "    out.append(str(x))\n" +
      'print(" ".join(out))',
    blanks: [
      /* `list()` is October Python and builds the same empty list, so a learner
         who reaches for it is right and is not marked wrong for it. */
      { id: "f1", answer: "[]", alternatives: ["list()"] },
      { id: "f2", answer: "0" },
      { id: "f3", answer: "b" },
    ],
  },
  {
    /*
     * ADVANCED ONLY. «Негізгі есептерді жедел қарқынмен өтіп, күрделі есептер
     * блогына көшу» (p.6), and the first appearance of the PDF's «бірнеше
     * функциядан тұратын шағын бағдарлама» — one helper calling another.
     *
     * `best_word` is `largest` with the comparison replaced by a call. That is
     * the whole point: the best-so-far pattern does not change when the thing
     * being compared stops being the element itself, and a learner who has
     * understood b2 should recognise the skeleton immediately. What is new is
     * that `best_word` must not count vowels itself — the counting already has
     * a name and a return value.
     *
     * The tie rule is the trap and it is stated in both prompts: `>=` returns
     * the LAST of the tied words, `>` the first. "sky dry" is a visible case
     * for exactly that reason — both words have zero vowels, so a learner who
     * gets it wrong sees it immediately instead of on a hidden case.
     */
    id: "m3.l8.b9",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "strings.sequence", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["advanced"],
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген сөздер беріледі: әрқайсысы тек кіші латын әріптерінен тұрады, сөз саны 1-ден 50-ге дейін.\n" +
        "Екі функция жаз. `count_vowels(word)` сөздегі дауысты әріптердің санын қайтарады; дауыстылар — a, e, i, o, u. `best_word(words)` сөздер тізімін қабылдап, дауыстысы ең көп сөзді қайтарады. `best_word` дауыстыны өзі санамауы керек: ол әр сөз үшін `count_vowels`-ты шақырады.\n" +
        "Дауысты саны бірдей сөз бірнешеу болса, олардың ең сол жақтағысын қайтар. Негізгі бағдарлама сол сөзді бір жолға шығарады.\n" +
        "`apple kiwi banana plum` берілсе, жауап: `banana`.",
      ru:
        "В одной строке через пробел даны слова: каждое состоит только из строчных латинских букв, слов от 1 до 50.\n" +
        "Напиши две функции. `count_vowels(word)` возвращает количество гласных в слове; гласные — a, e, i, o, u. `best_word(words)` принимает список слов и возвращает слово с наибольшим числом гласных. Считать гласные сама `best_word` не должна: для каждого слова она вызывает `count_vowels`.\n" +
        "Если слов с одинаковым числом гласных несколько, верни самое левое из них. Основная программа выводит это слово одной строкой.\n" +
        "При вводе `apple kiwi banana plum` ответ: `banana`.",
    },
    referenceSolution:
      "def count_vowels(word):\n" +
      "    c = 0\n" +
      "    for ch in word:\n" +
      '        if ch in "aeiou":\n' +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "def best_word(words):\n" +
      "    best = words[0]\n" +
      "    for w in words:\n" +
      "        if count_vowels(w) > count_vowels(best):\n" +
      "            best = w\n" +
      "    return best\n" +
      "\n" +
      "words = input().split()\n" +
      "print(best_word(words))",
    /* "sky dry" and "rhythm myth" are two different tie shapes at zero vowels,
       and both fail a `>=`. "aei bcd" and "bcd aei" are the same pair in both
       orders, so a solution that returns the first word regardless dies on one
       of them and a solution that returns the last dies on the other. "one" is
       the single-word list, where the loop compares the word with itself. */
    cases: [
      { input: "apple kiwi banana plum", expectedOutput: "banana" },
      { input: "sky dry", expectedOutput: "sky" },
      { input: "one", expectedOutput: "one", hidden: true },
      { input: "aei bcd", expectedOutput: "aei", hidden: true },
      { input: "bcd aei", expectedOutput: "aei", hidden: true },
      { input: "rhythm myth", expectedOutput: "rhythm", hidden: true },
      { input: "queue io", expectedOutput: "queue", hidden: true },
    ],
  },
];
