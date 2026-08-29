import type { LessonBlock } from "../../types";

/**
 * Month 6 · Ақпан — lesson 2, «Іріктеу қашан жарамайды» (8 minutes).
 *
 * PDF p.9. February's mastery clause is one sentence and the whole of this
 * lesson hangs on three words in it:
 *
 *   «**Нұсқалар аз болғанда** барлық мүмкін нұсқаны жүйелі түрде тексеру…»
 *
 * "When there are few variants." The programme does not say *some* variants or
 * *a manageable number*; it makes fewness a precondition of the method — which
 * means the learner is owed a way to decide whether a given problem meets it,
 * before writing anything. Lesson 1 taught how to enumerate without missing a
 * variant. This lesson is the other half: how to know in advance that
 * enumerating is allowed at all, and what to do at the edge.
 *
 * The arithmetic behind that decision is not new. `perf.time_estimate`
 * («Уақытқа үлгеруді бағалау») was introduced in December, p.8, and this is
 * where it stops being an estimate and becomes a decision procedure: n·n to
 * about 10 000, n·n·n to about 400, doubling to about 22, n! to about 10, all
 * of them read off one rule — roughly 100 000 000 elementary steps a second.
 * The figures themselves are ours, not the programme's; the requirement to
 * judge «аз» is the programme's.
 *
 * The second objective the month file states for this lesson is «артық
 * нұсқаларды кесіп тастау» — cutting off the variants that cannot help. That is
 * deliberately the *cheap* version and not backtracking: a `break` when nothing
 * further can improve the answer, and abandoning the outer loop once the answer
 * is settled. The programme's «күрделі кері қайту тәсілі биыл бүкіл топқа
 * нөлден жаздырылмайды» limit is about backtracking proper and is not in play
 * here — an early `break` is October's `break`, used on purpose.
 *
 * ## The requirement a checker cannot see, and what was done about it
 *
 * «Add an early exit without changing the answer» is exactly the defect class
 * the first adversarial review named: output comparison cannot see a `break`,
 * so a learner who changes nothing would be graded correct. Of the three honest
 * options, `m6.l2.b6` takes the first — **make the output impossible without
 * it**. The program prints its verdict *and* the number of pairs it examined,
 * so the early exit is a visible number, and the cases pin it: the untouched
 * program fails on `1 2 3 4 5 / 3`, and the half-done version with only the
 * inner `break` fails on `8 1 1 1 1 1 1 / 9`. Nothing structural is asserted
 * and then left ungraded.
 *
 * Python used here is October's and November's: `while`, `for`, `range`,
 * `break`, list literals, `len`, indexing, `list(map(int, input().split()))`.
 * No `sorted`, no function definitions, no `**` — the growth figures are
 * printed as plain multiplication so that the recursion lessons still own the
 * power problem.
 *
 * Output tokens are English throughout — `too many` / `ok` in b3, `yes` / `no`
 * in b6 — and both prompts name them, so a Russian-track learner reasons about
 * the branch instead of matching glyphs against a Kazakh word.
 */
export const M6_L2: LessonBlock[] = [
  {
    /*
     * The table, once, with the rule behind it. It is stated as arithmetic the
     * learner performs rather than four numbers to memorise, because every
     * later block in this lesson asks them to perform it on a new n.
     *
     * The code prints two magnitudes for the SAME n, which is the point that
     * survives: at n = 10 000 the pair loop sits exactly on the one-second
     * edge and the triple loop is nearly three hours away from it.
     */
    id: "m6.l2.b1",
    type: "concept",
    skillRefs: ["enumerate.all", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Іріктеу қанша қадам жасайды",
      ru: "Сколько шагов делает перебор",
    },
    body: {
      kk:
        "Компьютер бір секундта шамамен 100 000 000 қарапайым қадам орындайды. Есепке әдетте бір-екі секунд беріледі. Демек шешімнің қадам саны 100 000 000-нан айтарлықтай асып кетсе, ол уақытқа үлгермейді — код дұрыс жазылған күннің өзінде.\n\n" +
        "Іріктеудің қадам саны n өскенде қалай өсетінін білсек, бір жол код жазбай тұрып шешімнің жарайтын-жарамайтынын айта аламыз. Төрт негізгі түрі бар:\n\n" +
        "• n · n — екі кірістірілген цикл, барлық жұп. n шамамен 10 000-ға дейін жарайды.\n" +
        "• n · n · n — үш кірістірілген цикл, барлық үштік. n шамамен 400-ге дейін.\n" +
        "• Еселеніп өсу: әр элемент не алынады, не алынбайды. n шамамен 22-ге дейін, себебі 22 элементтен 4 194 304 түрлі жиынтық құралады.\n" +
        "• Барлық реттеуді қарау (n!). n шамамен 10-ға дейін, себебі 10 элементті 3 628 800 түрлі ретпен қоюға болады.\n\n" +
        "Бұл кестені жаттаудың қажеті жоқ. n-ді өрнекке қойып, шыққан санды 100 000 000-мен салыстырсаң болғаны. Төмендегі бағдарлама n = 10 000 үшін дәл соны істейді: бірінші сан — жұптарды қарау, екіншісі — үштіктерді қарау. Бірінші сан шекте дәл тұр, ал екіншісі одан он мың есе үлкен — ол шамамен үш сағат.",
      ru:
        "Компьютер выполняет примерно 100 000 000 простых шагов в секунду. На задачу обычно даётся одна-две секунды. Значит, если число шагов решения заметно превышает 100 000 000, оно не уложится по времени — даже когда код написан правильно.\n\n" +
        "Если знать, как растёт число шагов перебора при росте n, можно сказать, годится решение или нет, ещё не написав ни строчки кода. Основных видов четыре:\n\n" +
        "• n · n — два вложенных цикла, все пары. Годится примерно до n = 10 000.\n" +
        "• n · n · n — три вложенных цикла, все тройки. Примерно до n = 400.\n" +
        "• Удвоение: каждый элемент либо берём, либо нет. Примерно до n = 22, потому что из 22 элементов получается 4 194 304 разных набора.\n" +
        "• Перебор всех перестановок (n!). Примерно до n = 10, потому что 10 элементов можно расставить 3 628 800 способами.\n\n" +
        "Заучивать эту таблицу не нужно. Подставь n в выражение и сравни полученное число со 100 000 000. Программа ниже делает ровно это для n = 10 000: первое число — перебор пар, второе — перебор троек. Первое стоит ровно на пределе, а второе больше него в десять тысяч раз — это около трёх часов.",
    },
    code: "n = 10000\n" + "print(n * n)\n" + "print(n * n * n)",
  },
  {
    /*
     * The first judgement, on the n·n shape, at a value where the answer is not
     * obvious by eye: 30 000 is only three times the table's limit, and the
     * verdict turns on doing the multiplication rather than recognising the
     * number.
     *
     * o1 carries the RIGHT count with the WRONG verdict, which is the whole
     * failure this lesson exists to prevent, and o3 carries the count a learner
     * gets by adding the two loops instead of multiplying them. o4 — «n·n
     * always fits» — is left unmapped on purpose: it can come from
     * over-generalising the table's 10 000, or from not having read the
     * constraint at all, and two causes means the engine should ask.
     */
    id: "m6.l2.b2",
    type: "multiple_choice",
    skillRefs: ["perf.time_estimate", "enumerate.all"],
    sourceType: "product-authored",
    prompt: {
      kk: "Есептің шектеуі: n ≤ 30 000. Дайын шешім барлық (i, j) жұбын қарайды, яғни шамамен n · n қадам жасайды. Компьютер секундына шамамен 100 000 000 қадам орындайды. Бұл шешім бір-екі секундқа үлгере ме?",
      ru: "Ограничение задачи: n ≤ 30 000. Готовое решение перебирает все пары (i, j), то есть делает примерно n · n шагов. Компьютер выполняет около 100 000 000 шагов в секунду. Уложится ли такое решение в одну-две секунды?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Иә, үлгереді: шамамен 900 000 000 қадам",
          ru: "Да, уложится: примерно 900 000 000 шагов",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Жоқ, үлгермейді: шамамен 900 000 000 қадам, ал бұл тоғыз секундтай уақыт",
          ru: "Нет, не уложится: примерно 900 000 000 шагов, а это около девяти секунд",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Иә, үлгереді: небәрі 60 000 қадам",
          ru: "Да, уложится: всего 60 000 шагов",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Иә, үлгереді: екі цикл әрқашан бір секундқа үлгереді",
          ru: "Да, уложится: два цикла всегда укладываются в секунду",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "step_count_not_compared_to_budget",
        justification:
          "Қадам саны дұрыс есептелген: 30 000 · 30 000 = 900 000 000. Қате тек соңғы қадамда — бұл сан секундтық шекпен салыстырылмаған, ал ол шектен тоғыз есе үлкен.",
      },
      o3: {
        failureClass: "nested_loops_added_instead_of_multiplied",
        justification:
          "60 000 — бұл 30 000 + 30 000. Мұндай сан кірістірілген циклдердің қадамдары қосылады деп есептегенде ғана шығады; шын мәнінде сыртқы циклдің әр қадамында ішкі цикл толық айналады, сондықтан олар көбейтіледі.",
      },
    },
  },
  {
    /*
     * The second judgement, on the factorial shape, and it is a prediction
     * rather than a choice so the learner has to run the loop in their head
     * before comparing anything. 12! = 479 001 600 is four times over the
     * budget, which is close enough that guessing from the shape alone does not
     * work — the table says n! survives to about 10, and 12 is just past it.
     *
     * The tokens are English and both prompts name them.
     */
    id: "m6.l2.b3",
    type: "prediction",
    skillRefs: ["perf.time_estimate", "enumerate.all"],
    sourceType: "product-authored",
    prompt: {
      kk: "n оқушыны қатарға қоюдың барлық ретін қарап шыққымыз келеді — ондай нұсқа n! болады. Бағдарлама n = 12 үшін нұсқа санын есептеп, оны секундтық шекпен салыстырады. Экранға `too many` жазуы ма, әлде `ok` жазуы ма шығады?",
      ru: "Мы хотим перебрать все порядки, в которых можно поставить n учеников в ряд, — таких вариантов n!. Программа считает число вариантов для n = 12 и сравнивает его с секундным пределом. Что появится на экране — надпись `too many` или `ok`?",
    },
    code:
      "n = 12\n" +
      "variants = 1\n" +
      "i = 2\n" +
      "while i <= n:\n" +
      "    variants = variants * i\n" +
      "    i = i + 1\n" +
      "if variants > 100000000:\n" +
      '    print("too many")\n' +
      "else:\n" +
      '    print("ok")',
    answer: "too many",
    options: ["too many", "ok", "479001600"],
    diagnosticMapping: {
      /*
       * 479001600 is exactly 12!, so this answer can only come from a learner
       * who traced the loop correctly and then stopped: they read the value of
       * `variants` as the output instead of following it into the `if`. «ok» is
       * deliberately unmapped — it comes both from underestimating the
       * factorial and from mis-tracing the loop, and two causes is not a
       * diagnosis.
       */
      "479001600": {
        failureClass: "counter_value_read_as_output",
        justification:
          "479 001 600 — бұл `variants` айнымалысының соңғы мәні, ал ол ешқашан басылмайды. Мұндай жауап циклді дұрыс қадамдап, бірақ соңғы `if` тармағын оқымай, есептелген санды бірден шығыс деп қабылдағанда шығады.",
      },
    },
  },
  {
    /*
     * The mechanism, watched rather than described: the loop stops at index 2
     * and the last five elements are never touched. `steps` is what the learner
     * carries out of this card — it is the number the next three blocks are all
     * about.
     *
     * The prompt does not name the answer; the list is visible, so the position
     * of 250 is visible, but the count of examined elements is not, and neither
     * is the fact that `i` never reaches 3.
     */
    id: "m6.l2.b4",
    type: "trace_code",
    skillRefs: ["enumerate.all", "loops.while", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама тізімнен 100-ден үлкен бірінші элементті іздейді және оны тапқан бойда тоқтайды. `steps` айнымалысы қаралған элементтердің санын жинайды. Бағдарламаны қағаздағыдай қадамдап орында: көрсетілген әр жолдан кейін `steps`, `found` және `i` мәндерін жаз. Тізімде 8 элемент бар — цикл олардың нешеуін қарап үлгерді?",
      ru: "Программа ищет в списке первый элемент, больший 100, и останавливается, как только находит его. Переменная `steps` копит число просмотренных элементов. Выполни программу пошагово, как на бумаге: после каждой указанной строки запиши значения `steps`, `found` и `i`. В списке 8 элементов — сколько из них цикл успел просмотреть?",
    },
    code:
      "a = [3, 9, 250, 7, 8, 1, 6, 4]\n" +
      "steps = 0\n" +
      "found = -1\n" +
      "i = 0\n" +
      "while i < len(a):\n" +
      "    steps = steps + 1\n" +
      "    if a[i] > 100:\n" +
      "        found = i\n" +
      "        break\n" +
      "    i = i + 1\n" +
      "print(found, steps)",
    steps: [
      { line: 4, vars: { steps: "0", found: "-1", i: "0" } },
      { line: 6, vars: { steps: "1", found: "-1", i: "0" } },
      { line: 10, vars: { steps: "1", found: "-1", i: "1" } },
      { line: 6, vars: { steps: "2", found: "-1", i: "1" } },
      { line: 10, vars: { steps: "2", found: "-1", i: "2" } },
      { line: 6, vars: { steps: "3", found: "-1", i: "2" } },
      { line: 8, vars: { steps: "3", found: "2", i: "2" } },
      { line: 11, vars: { steps: "3", found: "2", i: "2" } },
    ],
  },
  {
    /*
     * The break placed one iteration too early. The cut-off itself is sound —
     * the list rises, so nothing after the first oversized element can qualify
     * — and only its condition is wrong by one step: `>=` stops ON the boundary
     * value instead of past it, so an element exactly equal to `limit` is never
     * counted.
     *
     * symptomInput is mandatory here: the fallback probe feeds one number, and
     * this program reads a list and then a limit, so without it the two
     * programs would both crash identically and the defect would read as "no
     * difference".
     *
     * No diagnosticMapping. A learner who names line 7 — the `break` itself —
     * may believe the early exit should be removed altogether, or may believe
     * it sits in the wrong place in the body. Two repairs, two causes, so the
     * engine asks instead of telling them which one they meant.
     */
    id: "m6.l2.b5",
    type: "find_bug",
    skillRefs: ["enumerate.all", "debug.boundary", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізім өспелі ретпен берілген, келесі жолда `limit` саны тұр. Бағдарлама `limit`-тен аспайтын, яғни `limit`-ке тең немесе одан кіші элементтердің санын шығаруы керек. Тізім өспелі болғандықтан, бірінші артық элементтен кейін қалғанын қараудың мәні жоқ — `break` сол үшін тұр. Бірақ `1 3 5 7 9` тізімі мен `limit = 5` берілгенде бағдарлама 3-тің орнына 2 шығарады. Қай жол кінәлі және неге?",
      ru: "Список дан по возрастанию, в следующей строке стоит число `limit`. Программа должна вывести количество элементов, не превышающих `limit`, то есть равных `limit` или меньших. Так как список возрастает, после первого слишком большого элемента остальные смотреть незачем — ради этого и стоит `break`. Но на списке `1 3 5 7 9` при `limit = 5` программа выводит 2 вместо 3. Какая строка виновата и почему?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "limit = int(input())\n" +
      "count = 0\n" +
      "i = 0\n" +
      "while i < len(a):\n" +
      "    if a[i] >= limit:\n" +
      "        break\n" +
      "    count = count + 1\n" +
      "    i = i + 1\n" +
      "print(count)",
    buggyLine: 6,
    symptomInput: "1 3 5 7 9\n5",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "limit = int(input())\n" +
      "count = 0\n" +
      "i = 0\n" +
      "while i < len(a):\n" +
      "    if a[i] > limit:\n" +
      "        break\n" +
      "    count = count + 1\n" +
      "    i = i + 1\n" +
      "print(count)",
  },
  {
    /*
     * «Артық нұсқаларды кесіп тастау», written by the learner.
     *
     * THE STRUCTURAL REQUIREMENT PROBLEM, AND THE OPTION TAKEN. "Add a break"
     * is invisible to output comparison, so the program prints a second number
     * — how many pairs it actually examined — and the cases pin it. Option 1
     * from the authoring contract: the output is impossible to produce without
     * the change. Concretely:
     *
     *   · submitting the program unchanged prints «yes 10» on the first case,
     *     where the answer is «yes 1»;
     *   · adding only the inner `break` and forgetting the outer one prints
     *     «yes 7» on `8 1 1 1 1 1 1 / 9`, where the answer is «yes 1»;
     *   · adding only the outer one prints «yes 4» on that same first case;
     *   · moving the `break` above `checked = checked + 1` prints «yes 0».
     *
     * Every one of those is a real submission a fourteen-year-old makes, and
     * every one of them fails a case rather than a sentence in the prompt.
     *
     * The last two cases exist because a first draft of this block could be
     * passed by a cut-off that is not valid at all. The list is NOT sorted, so
     * abandoning the search because one pair overshoots the target is wrong —
     * yet with the first five cases alone, `if a[i] + a[j] > target: break`
     * passed every one of them. `9 9 1 2 / 3` puts the matching pair after two
     * overshooting ones, and `100 1 2 5 / 3` makes an outer-loop `break` on a
     * too-large `a[i]` answer «no» to a list that plainly contains the pair.
     *
     * `1 2 3 4 5 / 9` is the pair that only matches on the very LAST
     * combination, and `3 / 5` is the list with no pairs at all.
     */
    id: "m6.l2.b6",
    type: "modify_code",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Бағдарлама тізімде қосындысы `target`-ке тең екі санның бар-жоғын тексереді. Ол екі мән шығарады: `yes` немесе `no` деген жауапты және қаралған жұптардың санын. Қазір бағдарлама жауапты тапқаннан кейін де қалған жұптарды түгел қарап шығады. Оны ерте тоқтайтын етіп өзгерт: жұп табылған бойда ішкі цикл де, сыртқы цикл де үзілсін. `yes` / `no` жауабы ешбір енгізуде өзгермеуі керек, ал екінші сан — қаралған жұптардың саны — жауап ерте табылған жерде азаюы тиіс.",
      ru: "Программа проверяет, есть ли в списке два числа с суммой `target`. Она выводит два значения: ответ `yes` или `no` и количество просмотренных пар. Сейчас программа продолжает перебирать оставшиеся пары даже после того, как ответ найден. Переделай её так, чтобы она останавливалась раньше: как только пара найдена, должны прерваться и внутренний, и внешний цикл. Ответ `yes` / `no` не должен измениться ни на одном вводе, а второе число — количество просмотренных пар — должно уменьшиться там, где ответ находится рано.",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "target = int(input())\n" +
      "found = 0\n" +
      "checked = 0\n" +
      "for i in range(len(a)):\n" +
      "    for j in range(i + 1, len(a)):\n" +
      "        checked = checked + 1\n" +
      "        if a[i] + a[j] == target:\n" +
      "            found = 1\n" +
      "if found == 1:\n" +
      '    print("yes", checked)\n' +
      "else:\n" +
      '    print("no", checked)',
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "target = int(input())\n" +
      "found = 0\n" +
      "checked = 0\n" +
      "for i in range(len(a)):\n" +
      "    for j in range(i + 1, len(a)):\n" +
      "        checked = checked + 1\n" +
      "        if a[i] + a[j] == target:\n" +
      "            found = 1\n" +
      "            break\n" +
      "    if found == 1:\n" +
      "        break\n" +
      "if found == 1:\n" +
      '    print("yes", checked)\n' +
      "else:\n" +
      '    print("no", checked)',
    cases: [
      { input: "1 2 3 4 5\n3", expectedOutput: "yes 1" },
      { input: "4 7 2 9\n100", expectedOutput: "no 6" },
      { input: "2 4 6 8 20\n10", expectedOutput: "yes 3", hidden: true },
      { input: "1 2 3 4 5\n9", expectedOutput: "yes 10", hidden: true },
      { input: "8 1 1 1 1 1 1\n9", expectedOutput: "yes 1", hidden: true },
      { input: "3\n5", expectedOutput: "no 0", hidden: true },
      { input: "5 5\n10", expectedOutput: "yes 1", hidden: true },
      { input: "9 9 1 2\n3", expectedOutput: "yes 6", hidden: true },
      { input: "100 1 2 5\n3", expectedOutput: "yes 4", hidden: true },
    ],
  },
  {
    /*
     * The judgement made backwards: not «does this n fit» but «at which n does
     * it stop fitting». The steps are read straight off the three loops, and n
     * is offered in hundreds so the answer is a single value rather than a
     * region — 400 · 400 · 400 = 64 000 000 still fits, 500 · 500 · 500 =
     * 125 000 000 does not.
     *
     * The program is deliberately a silly one: the largest sum of three numbers
     * from 1..n is 3n and needs no loops at all. Nobody is asked to fix that
     * here; the block is about the clock, and a wasteful program makes the
     * arithmetic easier to see.
     */
    id: "m6.l2.b7",
    type: "test_case",
    skillRefs: ["perf.time_estimate", "enumerate.all"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама 1-ден n-ге дейінгі сандардан құралатын барлық үштікті қарап шығады, яғни шамамен n · n · n қадам жасайды. Компьютер секундына шамамен 100 000 000 қадам орындайды. n тек жүздікпен беріледі: 100, 200, 300, 400, 500, … Осылардың ішінде бағдарлама бір секундқа үлгермей қалатын ең кіші n-ді тексеру мысалы ретінде жаз.",
      ru: "Эта программа перебирает все тройки чисел от 1 до n, то есть делает примерно n · n · n шагов. Компьютер выполняет около 100 000 000 шагов в секунду. Значение n берётся только сотнями: 100, 200, 300, 400, 500, … Напиши в качестве теста наименьшее из них, при котором программа перестаёт укладываться в секунду.",
    },
    code:
      "n = int(input())\n" +
      "best = 0\n" +
      "for a in range(1, n + 1):\n" +
      "    for b in range(1, n + 1):\n" +
      "        for c in range(1, n + 1):\n" +
      "            if a + b + c > best:\n" +
      "                best = a + b + c\n" +
      "print(best)",
    breakingInputs: ["500"],
  },
  {
    /*
     * «Белгілі қасиеті бар барлық жұп пен үштікті табу» — the triples half of
     * February's practice paragraph, p.9 — and the prompt states the constraint
     * AND why the constraint makes the brute force legitimate: C(60, 3) = 34 220
     * combinations, four thousand times under the second's budget. That
     * sentence is the lesson's whole point arriving as permission rather than
     * as a prohibition.
     *
     * Nothing structural is required: any correct method passes. The cases are
     * built against the wrong solutions, not against the right one:
     *
     *   · «1 2 3» answers 0, killing a count that ignores the condition;
     *   · «1 -1 0» answers 1, killing the version that runs all three loops
     *     over range(n) and counts each triple six times (it answers 6);
     *   · «0 0 0 0 0 0» answers 20, killing anything that counts pairs (15) or
     *     ordered triples (120);
     *   · «7 1 2 -3» has its only triple at the LAST three positions, killing
     *     an inner loop written `range(j + 1, n - 1)`;
     *   · «1 -1 0 9 9» has its only triple at the FIRST three, killing an outer
     *     loop written `range(1, n)`;
     *   · the two duplicate-heavy lists check that equal values at different
     *     positions are counted as different triples.
     */
    id: "m6.l2.b8",
    type: "write_code",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (3 ≤ n ≤ 60), екінші жолда бос орынмен бөлінген n бүтін сан. Қосындысы 0-ге тең үштіктердің санын шығар. Үштік деп үш түрлі орында тұрған үш санды айтамыз, олардың реті ескерілмейді. n ≤ 60 болғандықтан үштіктердің жалпы саны 34 220-дан аспайды, ал бұл секундтық 100 000 000 шектен әлдеқайда аз — сондықтан мұнда барлық үштікті қарап шығу толық орынды шешім.",
      ru: "В первой строке дано число n (3 ≤ n ≤ 60), во второй — n целых чисел через пробел. Выведи количество троек с суммой 0. Тройка — это три числа на трёх разных позициях, порядок не учитывается. Так как n ≤ 60, всего троек не больше 34 220, а это намного меньше секундного предела в 100 000 000 — поэтому перебрать здесь все тройки вполне уместно.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        for k in range(j + 1, n):\n" +
      "            if a[i] + a[j] + a[k] == 0:\n" +
      "                count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "3\n1 -1 0", expectedOutput: "1" },
      { input: "3\n1 2 3", expectedOutput: "0" },
      { input: "4\n7 1 2 -3", expectedOutput: "1", hidden: true },
      { input: "5\n1 -1 0 9 9", expectedOutput: "1", hidden: true },
      { input: "6\n0 0 0 0 0 0", expectedOutput: "20", hidden: true },
      { input: "7\n1 2 -3 4 -1 -1 0", expectedOutput: "6", hidden: true },
      { input: "8\n4 4 4 -8 1 1 1 1", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The support substitution for b8 — the same problem, assembled instead of
     * written, which is what «дайын кодты құрастыру мен толықтыру көбірек»
     * asks for. The three blanks are the three decisions that actually carry
     * the problem: where each inner loop starts, and what the sum is compared
     * against. Everything else is scaffolding.
     *
     * The prompt restates the whole problem rather than pointing at the
     * previous card, because a support learner never receives b8 and «the task
     * above» would be a different problem on their route.
     */
    id: "m6.l2.b8s",
    type: "fill_blank",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (3 ≤ n ≤ 60), екінші жолда n бүтін сан. Қосындысы 0-ге тең үштіктердің санын шығару керек. n ≤ 60 болғандықтан үштіктер саны 34 220-дан аспайды, сондықтан бәрін қарап шығуға болады. Бағдарламаның қаңқасы дайын — үш орынды толықтыр. Есте сақта: әр үштік бір-ақ рет саналуы керек.",
      ru: "В первой строке дано число n (3 ≤ n ≤ 60), во второй — n целых чисел. Нужно вывести количество троек с суммой 0. Так как n ≤ 60, троек не больше 34 220, поэтому перебрать все допустимо. Каркас программы готов — заполни три места. Помни: каждая тройка должна посчитаться ровно один раз.",
    },
    template:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(___, n):\n" +
      "        for k in range(___, n):\n" +
      "            if a[i] + a[j] + a[k] ___ 0:\n" +
      "                count = count + 1\n" +
      "print(count)",
    blanks: [
      { id: "f1", answer: "i + 1", alternatives: ["i+1"] },
      { id: "f2", answer: "j + 1", alternatives: ["j+1"] },
      { id: "f3", answer: "==" },
    ],
  },
];
