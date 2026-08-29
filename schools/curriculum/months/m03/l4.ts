import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша — lesson 4, «Жергілікті және жаһандық» (8 minutes).
 *
 * PDF p.8. Three clauses of November drive this lesson:
 *
 *   «…жергілікті және жаһандық айнымалылардың айырмасын, көріну аймағын
 *    (scope) … түсіну.»
 *   «Платформа функция шақырылғанда қандай параметр мәндері кіретінін, қандай
 *    жергілікті айнымалылар пайда болатынын … визуалды көрсетеді.»
 *   «Арнайы бөлімде «неге бұл айнымалы мұнда көрінбейді?» … деген қателер
 *    талданады.»
 *
 * The third is a question the programme names verbatim, so the lesson is built
 * around it rather than around a definition of scope: `m3.l4.b5` is a program
 * that actually stops with `NameError`, and its prompt asks the PDF's question
 * word for word. The second is why `m3.l4.b4` exists as a hand trace with a
 * column per *sheet* — the trace grid keys on variable NAME, and the whole
 * point of this lesson is that one name means two boxes, so the columns are
 * labelled `x_outside` and `x_inside` or the two collapse into one and the
 * lesson disappears into its own notation.
 *
 * ## What is deliberately absent
 *
 * `global`. The programme's other named error — «неге global күтпеген нәтиже
 * берді?» — belongs to `m3.l5`, where it is shown as a hazard. A learner who
 * meets `global` here would meet it as the fix for `m3.l4.b5`, and it is not
 * the fix: the fix is a parameter, which is what `m3.l4.b6` and `m3.l4.b7`
 * make them write. Nothing in this file uses the keyword, in code or in prose.
 *
 * Python used: September's and October's, plus `def` and `return`. No
 * `sorted`, no `min`/`max` — November's own practice list asks the learner to
 * WRITE the max/min function, and December is where ordering arrives.
 *
 * Programs print `even` / `odd` and plain numbers. No program prints a Kazakh
 * or Russian word, and both prompts name the tokens.
 */
export const M3_L4: LessonBlock[] = [
  {
    id: "m3.l4.b1",
    type: "concept",
    skillRefs: ["scope.local_global"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Функция ішінде туған ат — сол шақыруда ғана өмір сүреді",
      ru: "Имя, рождённое внутри функции, живёт только внутри вызова",
    },
    /* The RU sentence read «но ячейки это разные», and it is the sentence the
       whole lesson leans on. Russian puts «это» at the head of the predicate —
       «это разные ячейки» — so a bare plural followed by «это разные» reads as
       a dropped word, and a fourteen-year-old rereads the clause instead of the
       idea it carries. The KK side never lost the copula, because it writes it
       as a dash: «бұл — екі бөлек қорап». The RU now mirrors that, numeral
       included, and «две» is not decoration: the clause after the colon —
       «тронешь одну — вторая не изменится» — is a claim about exactly two
       boxes, and this is a lesson whose entire point is that one name means two
       of them. b8s and b8 already say «две разные ячейки» to the same learner;
       the paragraph that introduces the idea now names it the way the tasks
       that test it do. */
    body: {
      kk: "Функция шақырылған сәтте Python оған таза бет ашады. Функцияның денесінде алғаш рет мән берілген әр ат сол бетке жазылады — оны жергілікті (local) айнымалы дейміз. Функция аяқталған бойда бет лақтырылып тасталады, сондықтан ат та бірге жоғалады. Функциядан тыс жерде мән берілген ат бөлек бетте тұрады — ол жаһандық (global) айнымалы. Екі бетте бір әріп жазылуы мүмкін, бірақ бұл — екі бөлек қорап: біріне тиген екіншісіне тимейді. Сондықтан «неге бұл айнымалы мұнда көрінбейді?» деген сұрақтың жауабы қысқа: ол басқа бетке жазылған. Функцияға дерек жеткізудің жолы — параметр, ал нәтижені қайтарудың жолы — return.",
      ru: "В момент вызова Python открывает функции чистый лист. Каждое имя, которое впервые получает значение в теле функции, записывается на этот лист — это локальная (local) переменная. Как только функция заканчивается, лист выбрасывается, и имя исчезает вместе с ним. Имя, получившее значение вне функции, лежит на отдельном листе — это глобальная (global) переменная. На двух листах может стоять одна и та же буква, но это две разные ячейки: тронешь одну — вторая не изменится. Поэтому у вопроса «почему эта переменная здесь не видна?» ответ короткий: она записана на другом листе. Данные в функцию передают параметром, а результат возвращают через return.",
    },
    code: "x = 5\n\ndef show():\n    x = 50\n    print(x)\n\nshow()\nprint(x)",
  },
  {
    /*
     * Both values on ONE line, on purpose. `OptionList` renders an option as
     * inline text, so a two-line answer would arrive on screen with its newline
     * collapsed — the learner would be choosing between "40 4" and "40 40"
     * either way, but with no way to tell which line was which. Evaluating
     * `print(change(n), n)` left to right puts the two sheets side by side in a
     * single string, which is exactly the comparison the lesson is about.
     */
    id: "m3.l4.b2",
    type: "prediction",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "product-authored",
    prompt: {
      kk: "`n` әрпі бағдарламада екі рет кездеседі: бірі — функцияның параметрі, екіншісі — функциядан тыс айнымалы. `print` не шығарады?",
      ru: "Буква `n` встречается в программе дважды: один раз как параметр функции, второй — как переменная вне функции. Что выведет `print`?",
    },
    code: "n = 4\n\ndef change(n):\n    n = n * 10\n    return n\n\nprint(change(n), n)",
    answer: "40 4",
    options: ["40 4", "40 40", "4 4", "4 40"],
    diagnosticMapping: {
      /*
       * «40 40» is reachable one way only: the learner believes `n = n * 10`
       * inside the body rebinds the caller's `n` as well. «4 4» is left
       * unmapped — it can come from not noticing the multiplication at all, or
       * from thinking `return` hands back the parameter unchanged, and two
       * causes means the engine should ask rather than tell. «4 40» is an
       * ordering slip and says nothing about scope.
       */
      "40 40": {
        failureClass: "local_rebinding_believed_to_reach_caller",
        justification:
          "Екінші баспадағы 40 тек бір жағдайда шығады: функция ішіндегі `n = n * 10` сыртқы `n`-ді де өзгертті деп ойласа. Бұл — параметрдің жеке қорап екенін мойындамау, басқа түсінік дәл осы жұпты бермейді.",
      },
    },
  },
  {
    /*
     * Four programs in one panel, because a `multiple_choice` option is a
     * single localized string rendered inline: a six-line program in a label
     * would come out as one collapsed row. The panel below compiles as a file
     * and is read as four separate runs, which the prompt states outright —
     * C really does raise NameError when it is run alone.
     */
    id: "m3.l4.b3",
    type: "multiple_choice",
    skillRefs: ["scope.local_global"],
    sourceType: "product-authored",
    prompt: {
      kk: "Төменде төрт бөлек бағдарлама: A, B, C, D. Төртеуі де `x` атын функцияның ішінде де, сыртында да қолданады, айырмасы — 10 саны қай жерде пайда болатынында. Әрқайсысы жеке іске қосылады. Қайсысы экранға 10 шығарады?",
      ru: "Ниже четыре отдельные программы: A, B, C, D. Все четыре используют имя `x` и внутри функции, и снаружи, а различаются тем, где появляется число 10. Каждая запускается отдельно. Какая из них выведет на экран 10?",
    },
    code:
      "# A\nx = 10\ndef f():\n    x = 3\nf()\nprint(x)\n\n" +
      "# B\nx = 3\ndef f():\n    x = 10\nf()\nprint(x)\n\n" +
      "# C\ndef f():\n    x = 10\nf()\nprint(x)\n\n" +
      "# D\nx = 3\ndef f():\n    x = 10\n    return x\nf()\nprint(x)",
    options: [
      { id: "o1", label: { kk: "A — 10 функциядан тыс жазылған", ru: "A — 10 записано вне функции" } },
      { id: "o2", label: { kk: "B — 10 функцияның ішінде жазылған", ru: "B — 10 записано внутри функции" } },
      { id: "o3", label: { kk: "C — 10 функцияның ішінде, сыртта x мүлдем жоқ", ru: "C — 10 внутри функции, снаружи x вообще нет" } },
      { id: "o4", label: { kk: "D — 10 функцияның ішінде, ол return арқылы қайтарылады", ru: "D — 10 внутри функции и возвращается через return" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      /*
       * o3 and o4 are consistent with the same belief o2 carries AND with a
       * second one each (o3: "an undefined name just prints nothing"; o4:
       * "a returned value lands back in the caller's variable"). Two causes,
       * so neither is attributed. o2 has only the one reading: in B the number
       * 10 exists nowhere except inside the body.
       */
      o2: {
        failureClass: "local_assignment_believed_to_reach_global",
        justification:
          "B бағдарламасы 10 шығарады деу үшін функция денесіндегі `x = 10` сырттағы `x`-ті ауыстырды деп ойлау керек. B-де 10 саны функцияның ішінен басқа еш жерде жазылмаған, сондықтан бұл таңдаудың басқа себебі жоқ.",
      },
    },
  },
  {
    /*
     * The programme's own instrument for this month: «Платформа функция
     * шақырылғанда … қандай жергілікті айнымалылар пайда болатынын … визуалды
     * көрсетеді» (p.8). One row per moment that changes a sheet, not one per
     * executed line — the five rows below are exactly the five moments where
     * the answer to "which x?" is different.
     *
     * The grid keys on the variable NAME, so the two boxes are given two names
     * here even though the program calls both `x`. Sharing a key would draw
     * one column and silently prove the opposite of the lesson.
     */
    id: "m3.l4.b4",
    type: "trace_code",
    skillRefs: ["scope.local_global"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Кестеде екі баған: `x_outside` — функциядан тыс жердегі `x`, `x_inside` — `show` ішіндегі `x`. Бағдарламада екеуі де бір әріппен жазылған, бірақ бұл — екі бөлек қорап. Ат әлі пайда болмаған немесе жойылып кеткен сәтте `-` таңбасын қой.",
      ru: "В таблице два столбца: `x_outside` — это `x` вне функции, `x_inside` — это `x` внутри `show`. В программе они записаны одной буквой, но ячейки разные. Если имя ещё не появилось или уже исчезло, поставь знак `-`.",
    },
    code: "x = 4\ndef show():\n    x = 100\n    print(x)\nshow()\nprint(x)",
    steps: [
      { line: 1, vars: { x_outside: "4", x_inside: "-" } },
      { line: 5, vars: { x_outside: "4", x_inside: "-" } },
      { line: 3, vars: { x_outside: "4", x_inside: "100" } },
      { line: 4, vars: { x_outside: "4", x_inside: "100" } },
      { line: 6, vars: { x_outside: "4", x_inside: "-" } },
    ],
  },
  {
    /*
     * «неге бұл айнымалы мұнда көрінбейді?» — the programme's question, asked
     * in the prompt word for word (p.8).
     *
     * The caller is a function and not the top level, because at the top level
     * a name IS global and `area` would simply find it: the program would run,
     * print the right answer, and teach the opposite of what it is here for.
     * With `s` local to `start`, the lookup inside `area` finds nothing and
     * the program stops.
     *
     * The repair is one line, and it is the line the learner must be able to
     * point at: the value did arrive, under the name the parameter gave it.
     *
     * symptomInput is declared because the fallback probe would feed `0` first
     * and the fixed program prints `0` while the broken one crashes — a
     * difference, but not the one the prompt describes.
     *
     * No diagnosticMapping. Picking line 6 can mean "the call passed nothing"
     * or "the call should have passed `side`", and picking line 5 can mean
     * "the input belongs outside the function" — several beliefs per line, so
     * the engine asks.
     */
    id: "m3.l4.b5",
    type: "find_bug",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама шаршының ауданын шығаруы керек. `6` енгізгенде ол `36` орнына `NameError: name 's' is not defined` деп тоқтайды. Қай жол кінәлі және неге бұл айнымалы мұнда көрінбейді?",
      ru: "Программа должна выводить площадь квадрата. При вводе `6` вместо `36` она останавливается с ошибкой `NameError: name 's' is not defined`. Какая строка виновата и почему эта переменная здесь не видна?",
    },
    code: "def area(side):\n    print(s * s)\n\ndef start():\n    s = int(input())\n    area(s)\n\nstart()",
    buggyLine: 2,
    symptomInput: "6",
    fixedCode: "def area(side):\n    print(side * side)\n\ndef start():\n    s = int(input())\n    area(s)\n\nstart()",
  },
  {
    /*
     * The repair from b5, written out by the learner instead of read: name the
     * parameter, then hand the value over at the call. Two blanks and no more,
     * because the two blanks ARE the mechanism — everything else in the file is
     * already correct and would only add typing.
     */
    id: "m3.l4.b6",
    type: "fill_blank",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция сыртқы аттарға жүгінбей, тек өзіне берілген параметрмен жұмыс істеуі керек. Параметрдің атын және шақыру кезінде берілетін мәнді қой. `4` енгізілсе, бағдарлама `16` шығарады.",
      ru: "Функция должна работать только со своим параметром и не тянуться к внешним именам. Впиши имя параметра и значение, которое передаётся при вызове. Если ввели `4`, программа выведет `16`.",
    },
    template:
      "def area(___):\n    print(side * side)\n\ndef start():\n    n = int(input())\n    area(___)\n\nstart()",
    blanks: [
      { id: "f1", answer: "side" },
      { id: "f2", answer: "n" },
    ],
  },
  {
    /*
     * Why a parameter and not an outer name, argued by the task rather than by
     * a paragraph: the starting program works perfectly on one number and
     * cannot be asked about a second one, because the only number it knows is
     * the one written outside it. Two numbers make the dependency fatal.
     *
     * Cases: `0 -2` puts zero and a negative on the even side, `-5 8` puts a
     * negative on the odd side and reverses the order so a solution that
     * answers for the same value twice dies, and `1000000 999999` is large
     * enough that nobody solves it by recognising the number.
     */
    id: "m3.l4.b7",
    type: "modify_code",
    skillRefs: ["scope.local_global", "func.parameters", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама бір сан оқып, `even` немесе `odd` шығарады, бірақ `check` функциясы сыртқы `n` айнымалысына жүгінеді — сондықтан оны басқа санмен шақыру мүмкін емес. Енді бір жолда бос орынмен бөлінген екі бүтін сан беріледі. `check` функциясын санды параметр арқылы қабылдайтындай етіп қайта жаз да, оны екі рет шақыр: әр сан үшін жеке жолға `even` немесе `odd` шығар.",
      ru: "Эта программа читает одно число и выводит `even` или `odd`, но функция `check` тянется к внешней переменной `n` — поэтому вызвать её с другим числом невозможно. Теперь в одной строке через пробел даны два целых числа. Перепиши `check` так, чтобы число приходило параметром, и вызови её дважды: для каждого числа выведи `even` или `odd` в отдельной строке.",
    },
    code: 'n = int(input())\n\ndef check():\n    if n % 2 == 0:\n        print("even")\n    else:\n        print("odd")\n\ncheck()',
    referenceSolution:
      'def check(x):\n    if x % 2 == 0:\n        print("even")\n    else:\n        print("odd")\n\na, b = map(int, input().split())\ncheck(a)\ncheck(b)',
    cases: [
      { input: "4 7", expectedOutput: "even\nodd" },
      { input: "3 3", expectedOutput: "odd\nodd" },
      { input: "0 -2", expectedOutput: "even\neven", hidden: true },
      { input: "-5 8", expectedOutput: "odd\neven", hidden: true },
      { input: "1000000 999999", expectedOutput: "even\nodd", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m3.l4.b8, not an extra block beside it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same program, same two printed lines; the three blanks are the
     * multiplier and — the part that matters — which `n` each `print` and each
     * call is holding.
     */
    id: "m3.l4.b8s",
    type: "fill_blank",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бір бүтін сан беріледі. Бағдарлама бірінші жолға үш есе үлкейтілген санды, екінші жолға бастапқы санды шығаруы керек. Мысалы `5` үшін `15` және `5`. Код дайын — үш орынды толтыр. `triple` ішіндегі `n` мен сыртқы `n` — екі бөлек қорап екенін ұмытпа.",
      ru: "Дано одно целое число. Программа должна вывести в первой строке число, увеличенное втрое, а во второй — исходное число. Например, для `5` это `15` и `5`. Код готов — заполни три места. Помни, что `n` внутри `triple` и `n` снаружи — две разные ячейки.",
    },
    template: "def triple(n):\n    n = n * ___\n    print(n)\n\nn = int(input())\ntriple(___)\nprint(___)",
    blanks: [
      { id: "f1", answer: "3" },
      { id: "f2", answer: "n" },
      { id: "f3", answer: "n" },
    ],
  },
  {
    /*
     * The same name used inside and outside on purpose, with both values
     * printed — the lesson's second objective stated as a task.
     *
     * `0` is hidden and deliberately non-discriminating: it is the one input
     * where the two lines agree, and a learner who has understood nothing still
     * passes it. It is here so the case list contains the boundary, not as the
     * check. `5`, `1`, `-4`, `1000` and `7` all separate the two lines, so the
     * two mutants this task exists to kill — printing the outer value first,
     * and mutating one shared box so both lines read 3n — die on every one of
     * them.
     */
    id: "m3.l4.b8",
    type: "write_code",
    skillRefs: ["scope.local_global", "func.define", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір бүтін сан беріледі. `triple` деген функция жаз, оның параметрінің аты да `n` болсын. Функцияның ішінде `n`-ді үш есе үлкейтіп, сол мәнді бірінші жолға шығар. Функцияны шақырғаннан кейін сыртқы `n`-ді екінші жолға шығар. Екі `n` — екі бөлек қорап, сондықтан екінші жолда бастапқы сан тұруы керек. Мысалы `5` үшін жауап: `15`, содан кейін `5`.",
      ru: "Дано одно целое число. Напиши функцию `triple`, параметр которой тоже называется `n`. Внутри функции увеличь `n` втрое и выведи это значение в первой строке. После вызова функции выведи внешнее `n` во второй строке. Два `n` — это две разные ячейки, поэтому во второй строке должно остаться исходное число. Например, для `5` ответ: `15`, затем `5`.",
    },
    referenceSolution: "def triple(n):\n    n = n * 3\n    print(n)\n\nn = int(input())\ntriple(n)\nprint(n)",
    cases: [
      { input: "5", expectedOutput: "15\n5" },
      { input: "1", expectedOutput: "3\n1" },
      { input: "0", expectedOutput: "0\n0", hidden: true },
      { input: "-4", expectedOutput: "-12\n-4", hidden: true },
      { input: "1000", expectedOutput: "3000\n1000", hidden: true },
      { input: "7", expectedOutput: "21\n7", hidden: true },
    ],
  },
];
