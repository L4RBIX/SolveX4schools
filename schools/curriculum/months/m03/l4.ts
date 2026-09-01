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
 * that genuinely refuses to build, and its prompt asks the PDF's question word
 * for word. The second is why `m3.l4.b4` exists as a hand trace with a column
 * per box — the trace grid keys on variable NAME, and the whole point of this
 * lesson is that one name means two boxes, so the columns are labelled
 * `x_outside` and `x_inside` or the two collapse into one and the lesson
 * disappears into its own notation.
 *
 * ## What C++ changes, and it is the biggest divergence of the month
 *
 * Python has FUNCTION scope. C++ has BLOCK scope, and the block is any pair of
 * braces — including the ones on an `if` and the ones on a `for`. A variable
 * declared inside a loop body does not exist after the loop, and neither does
 * the loop's own counter. In Python both survive, and a learner carrying that
 * habit across writes a program that does not compile for a reason they cannot
 * see.
 *
 * So `m3.l4.b3` is re-authored around exactly that. The Python original showed
 * four whole programs in one panel and asked which prints 10; four programs
 * cannot share one C++ translation unit, and the C++ question worth asking in
 * its place is the one Python never had — which names are still alive after a
 * closing brace. `b1`'s body states the rule, `b3` tests it, and
 * `m3.l8.b4`'s trace has already shown a range-`for` variable dying with its
 * loop.
 *
 * The second divergence is quieter and belongs to `m3.l5`: writing to a
 * namespace-scope variable from inside a function needs no keyword at all in
 * C++. Python at least made you type `global`. Nothing in this file writes to
 * one — the fix for `b5` is a parameter, which is what `b6` and `b7` make the
 * learner produce — and the hazard is analysed where the programme asks for it.
 *
 * ## What is deliberately absent
 *
 * Pointers and references. `&` never appears in this month, in any file: the
 * repair for every scope problem here is a parameter and a `return`, and
 * introducing a second mechanism would give the learner a choice the month has
 * no time to teach them to make.
 *
 * C++ used: September's and October's, plus functions and `return`. No
 * `<algorithm>`, no `max`/`min` — November's own practice list asks the learner
 * to WRITE the max/min function, and December is where ordering arrives.
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
      kk: "Ат жақшаның ішінде туады және сол жақшамен бірге өледі",
      ru: "Имя рождается внутри скобок и умирает вместе с ними",
    },
    /* Two claims, and the second is the one that does not transfer from Python.
       A local dies at the end of its function — every language the learner will
       meet says that. A local also dies at the end of the `if` or the `for` it
       was declared in, and that one is C++'s own. b3 is built on it, so it is
       stated here in the same paragraph and with an example the learner can
       point at. */
    body: {
      kk: "Функцияның ішінде жарияланған айнымалы — жергілікті (local) айнымалы. Ол жарияланған жерде пайда болады және өзін қоршап тұрған `}` жақшасына жеткенде жойылады. Функция аяқталған соң оның бүкіл жергілікті аттары жоғалады, ал функция қайта шақырылса, олар қайтадан, таза күйінде туады.\n\nЕң бастысы, C++-та шекара — функция емес, ЖАҚША. Кез келген `{ }` жұбы жаңа аймақ ашады: `if`-тікі де, `for`-дікі де. `for (int i = 0; i < n; i++) { int step = i * 10; }` жазсаң, циклдің `}` жақшасынан кейін `i` де, `step` те жоқ — оларға сілтеме жасаған жол компиляциядан өтпейді. Бұл — Python-нан ерекшелігі: онда мұндай аттар циклден кейін де тірі қалады.\n\nБарлық функциядан тыс жарияланған айнымалы — жаһандық (global) айнымалы. Ол файлдың соңына дейін көрінеді, сондықтан функциялар оны оқи алады. Бір әріп екі жерде жазылуы мүмкін, бірақ бұл — екі бөлек қорап: біріне тиген екіншісіне тимейді, ал ішкі ат сыртқысын өзі тірі тұрғанда жауып тұрады. Сондықтан «неге бұл айнымалы мұнда көрінбейді?» деген сұрақтың жауабы қысқа: ол басқа жақшаның ішінде жарияланған. Функцияға дерек жеткізудің дұрыс жолы — параметр, ал нәтижені қайтарудың жолы — `return`.",
      ru: "Переменная, объявленная внутри функции, — локальная (local). Она появляется там, где объявлена, и исчезает, когда выполнение доходит до закрывающей её `}`. После завершения функции все её локальные имена пропадают, а при следующем вызове рождаются заново, с чистого листа.\n\nГлавное: в C++ границу задаёт не функция, а СКОБКИ. Любая пара `{ }` открывает новую область: и у `if`, и у `for`. Если написать `for (int i = 0; i < n; i++) { int step = i * 10; }`, то после закрывающей скобки цикла нет ни `i`, ни `step` — строка, которая к ним обратится, не скомпилируется. Это отличие от Python: там такие имена остаются живыми и после цикла.\n\nПеременная, объявленная вне всех функций, — глобальная (global). Она видна до конца файла, поэтому функции могут её читать. Одна и та же буква может стоять в двух местах, но это две разные ячейки: тронешь одну — вторая не изменится, а внутреннее имя закрывает внешнее, пока оно живо. Поэтому у вопроса «почему эта переменная здесь не видна?» ответ короткий: она объявлена внутри других скобок. Правильный способ передать данные в функцию — параметр, а вернуть результат — `return`.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int x = 5;\n" +
      "\n" +
      "void show() {\n" +
      "    int x = 50;\n" +
      "    cout << x << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    show();\n" +
      "    cout << x << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Both values on ONE line, on purpose. `OptionList` renders an option as
     * inline text, so a two-line answer would arrive on screen with its newline
     * collapsed — the learner would be choosing between "40 4" and "40 40"
     * either way, but with no way to tell which line was which.
     *
     * The evaluation order of `cout << change(n) << " " << n` is not left to
     * chance either: C++17 sequences the operands of `<<` left to right, and
     * `change` cannot touch the outer `n` in any case, because the parameter is
     * a copy. Both facts point the same way, which is what makes this a fair
     * question rather than a compiler quirk.
     */
    id: "m3.l4.b2",
    type: "prediction",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "product-authored",
    prompt: {
      kk: "`n` әрпі бағдарламада екі рет кездеседі: бірі — функцияның параметрі, екіншісі — барлық функциядан тыс жарияланған айнымалы. `cout` не шығарады?",
      ru: "Буква `n` встречается в программе дважды: один раз как параметр функции, второй — как переменная, объявленная вне всех функций. Что выведет `cout`?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int n = 4;\n" +
      "\n" +
      "int change(int n) {\n" +
      "    n = n * 10;\n" +
      "    return n;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      '    cout << change(n) << " " << n << endl;\n' +
      "    return 0;\n" +
      "}",
    answer: "40 4",
    options: ["40 4", "40 40", "4 4", "4 40"],
    diagnosticMapping: {
      /*
       * «40 40» is reachable one way only: the learner believes `n = n * 10`
       * inside the body writes to the caller's `n` as well. «4 4» is left
       * unmapped — it can come from not noticing the multiplication at all, or
       * from thinking `return` hands back the parameter unchanged, and two
       * causes means the engine should ask rather than tell. «4 40» is an
       * ordering slip and says nothing about scope.
       */
      "40 40": {
        failureClass: "local_rebinding_believed_to_reach_caller",
        justification:
          "Екінші баспадағы 40 тек бір жағдайда шығады: функция ішіндегі `n = n * 10` сыртқы `n`-ді де өзгертті деп ойласа. Бұл — параметрдің жеке қорап, яғни көшірме екенін мойындамау, басқа түсінік дәл осы жұпты бермейді.",
      },
    },
  },
  {
    /*
     * RE-AUTHORED, not translated. The Python block put four whole programs in
     * one panel and asked which of them prints 10. Four programs cannot share
     * one C++ translation unit — the panel is compiled — and one of the four
     * (`x` used at top level having only ever been assigned inside a function)
     * cannot be written in C++ at all.
     *
     * What replaces it is the question C++ has that Python does not: after a
     * closing brace, which names are still alive? Three candidates, one alive.
     * `total` is declared in the function body and outlives the loop; `i` is
     * declared by the `for` header and dies with it; `step` is declared inside
     * the loop body and dies at every turn of it. A learner carrying Python's
     * function scope across answers o4, and a learner who has half the rule
     * answers o2 or o3.
     *
     * `limit` is read and never written. Writing to a namespace-scope variable
     * from inside a function needs no keyword in C++, which is m3.l5's subject
     * and its hazard; a card in the lesson that introduces the idea should not
     * model the thing the next lesson spends itself warning about.
     *
     * o4 carries no mapping: "all three" is reachable from Python's function
     * scope, from not reading the declarations at all, and from assuming the
     * compiler is lenient. Three causes, so the engine asks.
     */
    id: "m3.l4.b3",
    type: "multiple_choice",
    skillRefs: ["scope.local_global"],
    sourceType: "product-authored",
    prompt: {
      kk: "Циклдің жабылатын `}` жақшасынан кейін, 12-жолда, `cout <<` арқылы қай атты қолдануға болады? Яғни компилятор қайсысына шағымданбайды?",
      ru: "Какое имя можно использовать в `cout <<` после закрывающей `}` цикла, в строке 12? То есть на какое из них компилятор не пожалуется?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int limit = 3;\n" +
      "\n" +
      "void collect() {\n" +
      "    int total = 0;\n" +
      "    for (int i = 1; i <= limit; i++) {\n" +
      "        int step = i * 10;\n" +
      "        total = total + step;\n" +
      "    }\n" +
      "    cout << total << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    collect();\n" +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "`total` — ол циклден бұрын, функцияның денесінде жарияланған", ru: "`total` — она объявлена до цикла, в теле функции" } },
      { id: "o2", label: { kk: "`i` — цикл айнымалысы, ол циклден кейін де қалады", ru: "`i` — переменная цикла, она остаётся и после цикла" } },
      { id: "o3", label: { kk: "`step` — ол цикл денесінде жарияланған, бірақ мәні сақталады", ru: "`step` — она объявлена в теле цикла, но её значение сохраняется" } },
      { id: "o4", label: { kk: "Үшеуін де қолдануға болады", ru: "Можно использовать все три" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "loop_variable_believed_to_outlive_loop",
        justification:
          "`i`-ді таңдаудың бір ғана себебі бар: цикл айнымалысы циклден кейін де тірі қалады деп ойлау. Python-да солай, ал C++-та `for (int i = ...)` деп жазылған `i` циклдің `{ }` жақшаларына ғана тиесілі — 12-жолда ондай ат мүлде жоқ.",
      },
      o3: {
        failureClass: "block_local_believed_to_outlive_block",
        justification:
          "`step` цикл денесінің ішінде жарияланған, сондықтан ол әр айналымда қайта туып, әр айналымның соңында жойылады. Бұл нұсқаны таңдау — шекараны функция қояды деп ойлағанды білдіреді, ал C++-та шекараны әр `{ }` жұбы қояды.",
      },
    },
  },
  {
    /*
     * The programme's own instrument for this month: «Платформа функция
     * шақырылғанда … қандай жергілікті айнымалылар пайда болатынын … визуалды
     * көрсетеді» (p.8). One row per moment that changes a box, not one per
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
      kk: "Кестеде екі баған: `x_outside` — барлық функциядан тыс жарияланған `x`, `x_inside` — `show` ішіндегі `x`. Бағдарламада екеуі де бір әріппен жазылған, бірақ бұл — екі бөлек қорап. Ат әлі пайда болмаған немесе жойылып кеткен сәтте `-` таңбасын қой.",
      ru: "В таблице два столбца: `x_outside` — это `x`, объявленная вне всех функций, `x_inside` — это `x` внутри `show`. В программе они записаны одной буквой, но ячейки разные. Если имя ещё не появилось или уже исчезло, поставь знак `-`.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int x = 4;\n" +
      "\n" +
      "void show() {\n" +
      "    int x = 100;\n" +
      "    cout << x << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    show();\n" +
      "    cout << x << endl;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 4, vars: { x_outside: "4", x_inside: "-" } },
      { line: 12, vars: { x_outside: "4", x_inside: "-" } },
      { line: 7, vars: { x_outside: "4", x_inside: "100" } },
      { line: 8, vars: { x_outside: "4", x_inside: "100" } },
      { line: 13, vars: { x_outside: "4", x_inside: "-" } },
    ],
  },
  {
    /*
     * «неге бұл айнымалы мұнда көрінбейді?» — the programme's question, asked
     * in the prompt word for word (p.8).
     *
     * The caller is a function and not `main`, because a name declared at
     * namespace scope IS visible inside `area` and the program would simply
     * build and print the right answer, teaching the opposite of what it is
     * here for. With `s` local to `start`, the name does not exist inside
     * `area` and the program does not compile at all.
     *
     * That is the C++ shape of this bug and it is louder than Python's: there
     * the lookup happened at run time and the program died mid-way with a
     * `NameError` after doing some work. Here nothing runs, and the gate's
     * first tier — the broken program does not build and the repaired one does
     * — is the whole of the evidence, so no `symptomInput` is declared.
     *
     * The repair is one line, and it is the line the learner must be able to
     * point at: the value did arrive, under the name the parameter gave it.
     *
     * No diagnosticMapping. Picking line 11 can mean "the call passed nothing"
     * or "the call should have passed something else", and picking line 9 can
     * mean "the input belongs outside the function" — several beliefs per line,
     * so the engine asks.
     */
    id: "m3.l4.b5",
    type: "find_bug",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама шаршының ауданын шығаруы керек, бірақ ол тіпті компиляциядан өтпейді: компилятор 5-жолда `s` деген ат жарияланбаған дейді. `s` айнымалысы бағдарламада бар — ол 9-жолда жарияланған. Қай жол жөнделуі керек және неге бұл айнымалы мұнда көрінбейді?",
      ru: "Программа должна выводить площадь квадрата, но она даже не компилируется: компилятор говорит, что в строке 5 имя `s` не объявлено. Переменная `s` в программе есть — она объявлена в строке 9. Какую строку нужно исправить и почему эта переменная здесь не видна?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void area(int side) {\n" +
      "    cout << s * s << endl;\n" +
      "}\n" +
      "\n" +
      "void start() {\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    area(s);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    start();\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 5,
    fixedCode:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void area(int side) {\n" +
      "    cout << side * side << endl;\n" +
      "}\n" +
      "\n" +
      "void start() {\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    area(s);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    start();\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The repair from b5, written out by the learner instead of read: name the
     * parameter, then hand the value over at the call. Two blanks and no more,
     * because the two blanks ARE the mechanism — everything else in the file is
     * already correct and would only add typing. The parameter's type is given:
     * `int` is the only answer that fits, so a blank on it would be a word to
     * copy.
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
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void area(int ___) {\n" +
      "    cout << side * side << endl;\n" +
      "}\n" +
      "\n" +
      "void start() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    area(___);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    start();\n" +
      "    return 0;\n" +
      "}",
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
     * the one declared outside it. Two numbers make the dependency fatal.
     *
     * Note that the starting program COMPILES. That is the whole difficulty and
     * the reason this block follows b5 rather than repeating it: a function
     * reaching for a namespace-scope name is perfectly legal C++, and the only
     * thing wrong with it is that it can never be asked a second question.
     *
     * Cases: `0 -2` puts zero and a negative on the even side, `-5 8` puts a
     * negative on the odd side and reverses the order so a solution that
     * answers for the same value twice dies, and `1000000 999999` is large
     * enough that nobody solves it by recognising the number. The negatives
     * were re-derived rather than carried: `-5 % 2` is `-1` in C++ and `1` in
     * Python, but the test is `== 0` and both are non-zero, so the answers hold.
     *
     * `exact` and not the default `token`, because both prompts say «жеке
     * жолға» / «в отдельной строке» and `token` throws the line break away:
     * a program printing both verdicts on one line passed a prompt that forbade
     * it. It is also the cheapest possible place to tighten: every expected
     * line here is one word with no interior spacing, so `exact` adds the one
     * requirement the prompt already made and not a single one about spaces
     * nobody asked for, and the visible case `4 7` shows the two lines before
     * anything is hidden.
     */
    id: "m3.l4.b7",
    type: "modify_code",
    skillRefs: ["scope.local_global", "func.parameters", "func.reuse"],
    sourceType: "product-authored",
    checker: { kind: "exact" },
    prompt: {
      kk: "Бұл бағдарлама бір сан оқып, `even` немесе `odd` шығарады. Ол компиляциядан өтеді, бірақ `check` функциясы барлық функциядан тыс тұрған `n` айнымалысына жүгінеді — сондықтан оны басқа санмен шақыру мүмкін емес. Енді бір жолда бос орынмен бөлінген екі бүтін сан беріледі. `check` функциясын санды параметр арқылы қабылдайтындай етіп қайта жаз да, оны екі рет шақыр: әр сан үшін жеке жолға `even` немесе `odd` шығар.",
      ru: "Эта программа читает одно число и выводит `even` или `odd`. Она компилируется, но функция `check` тянется к переменной `n`, объявленной вне всех функций, — поэтому вызвать её с другим числом невозможно. Теперь в одной строке через пробел даны два целых числа. Перепиши `check` так, чтобы число приходило параметром, и вызови её дважды: для каждого числа выведи `even` или `odd` в отдельной строке.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int n;\n" +
      "\n" +
      "void check() {\n" +
      "    if (n % 2 == 0) {\n" +
      '        cout << "even" << endl;\n' +
      "    } else {\n" +
      '        cout << "odd" << endl;\n' +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cin >> n;\n" +
      "    check();\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void check(int x) {\n" +
      "    if (x % 2 == 0) {\n" +
      '        cout << "even" << endl;\n' +
      "    } else {\n" +
      '        cout << "odd" << endl;\n' +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    check(a);\n" +
      "    check(b);\n" +
      "    return 0;\n" +
      "}",
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
     * multiplier and — the part that matters — which `n` each `cout` and each
     * call is holding.
     */
    id: "m3.l4.b8s",
    type: "fill_blank",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бір бүтін сан беріледі. Бағдарлама бірінші жолға үш есе үлкейтілген санды, екінші жолға бастапқы санды шығаруы керек. Мысалы `5` үшін `15` және `5`. Код дайын — үш орынды толтыр. `triple` ішіндегі `n` мен `main` ішіндегі `n` — екі бөлек қорап екенін ұмытпа.",
      ru: "Дано одно целое число. Программа должна вывести в первой строке число, увеличенное втрое, а во второй — исходное число. Например, для `5` это `15` и `5`. Код готов — заполни три места. Помни, что `n` внутри `triple` и `n` внутри `main` — две разные ячейки.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void triple(int n) {\n" +
      "    n = n * ___;\n" +
      "    cout << n << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    triple(___);\n" +
      "    cout << ___ << endl;\n" +
      "    return 0;\n" +
      "}",
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
     *
     * `exact` for the same reason as b7: both prompts name a first line and a
     * second line, `token` cannot see a line break, and a program printing
     * `15 5` on one line would otherwise pass a prompt that asked for two. The
     * expected output is two bare numbers, so `exact` newly demands only the
     * line break the prompt already demanded, and `5` and `1` are visible, so a
     * learner who gets the shape wrong finds out on the sample rather than
     * inside a hidden case they cannot read.
     */
    id: "m3.l4.b8",
    type: "write_code",
    skillRefs: ["scope.local_global", "func.define", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    checker: { kind: "exact" },
    prompt: {
      kk: "Бір бүтін сан беріледі. `triple` деген `void` функциясын жаз, оның параметрінің аты да `n` болсын. Функцияның ішінде `n`-ді үш есе үлкейтіп, сол мәнді бірінші жолға шығар. `main` ішінде де `n` деген айнымалы болады: функцияны шақырғаннан кейін соны екінші жолға шығар. Екі `n` — екі бөлек қорап, сондықтан екінші жолда бастапқы сан тұруы керек. Мысалы `5` үшін жауап: `15`, содан кейін `5`.",
      ru: "Дано одно целое число. Напиши `void`-функцию `triple`, параметр которой тоже называется `n`. Внутри функции увеличь `n` втрое и выведи это значение в первой строке. Внутри `main` тоже есть переменная `n`: после вызова функции выведи её во второй строке. Два `n` — это две разные ячейки, поэтому во второй строке должно остаться исходное число. Например, для `5` ответ: `15`, затем `5`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void triple(int n) {\n" +
      "    n = n * 3;\n" +
      "    cout << n << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    triple(n);\n" +
      "    cout << n << endl;\n" +
      "    return 0;\n" +
      "}",
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
