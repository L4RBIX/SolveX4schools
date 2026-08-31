import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша — lesson 2 · «Параметрлер» / «Параметры». PDF p.8.
 *
 * One idea, and it is the one the November paragraph opens with: «параметр
 * беру ... функцияны бірнеше рет шақыру». A parameter is a name that receives
 * the caller's value, and the same body runs again with a different value. The
 * lesson's two objectives are exactly those two halves, and every block below
 * serves one of them.
 *
 * ## What C++ adds to the idea
 *
 * A parameter has to declare its TYPE, and every parameter declares its own:
 * `void diff(int a, int b)`, never `void diff(int a, b)`. That is one extra
 * word per parameter and it is not decoration — it is why the wrong-order call
 * this lesson is built around fails silently rather than loudly. `share(3, 12)`
 * type-checks perfectly, because both arguments are `int` and the compiler has
 * no way to know which one the author meant.
 *
 * C++ has no keyword arguments at all, so there is no `share(people=3)` escape
 * hatch to fall back on: position is the only thing that decides where a value
 * lands. That makes the order hazard bigger here than it was in Python, not
 * smaller, and it is why the learner meets it three times below.
 *
 * ## Why a trace and not the animation the programme asks for
 *
 * The month's explanation clause is specific — «Платформа функция шақырылғанда
 * қандай параметр мәндері кіретінін, қандай жергілікті айнымалылар пайда
 * болатынын ... визуалды көрсетеді». That visualiser does not exist. It is not
 * even a placeholder: `VisualSimulationBlock.simulation` has no enum value for
 * a call frame, and the one renderer that is built (`step_execution`) only
 * produces September's integer-division story — see
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1.
 *
 * So `b3` is a `trace_code` over two successive calls of the same function,
 * with the parameter's value written down at the moment each call starts. The
 * learner fills the table by hand instead of watching it fill. That is a real
 * reduction and the month report records it — but it covers the same ground,
 * and it is honest, which an animation we do not have would not be.
 *
 * ## What this lesson deliberately does not have
 *
 * **No returned value.** Every function here is `void` and prints. Lesson 3
 * owns returning, and a function that both prints and returns in the lesson
 * before `return` is introduced would make l3's own distinction — «нәтижені
 * қайтару мен шығарудың айырмасы» — impossible to draw cleanly.
 *
 * **No max/min function.** «максимум мен минимум функциясы» is a November
 * practice family, but it wants a value handed back, so it belongs after l3.
 * Writing it here would force either a print-only version that cannot be
 * composed, or a return type a lesson early.
 *
 * ## The order of arguments, met three times on purpose
 *
 * Passing values in the wrong order is the failure this lesson has to
 * inoculate against, because nothing complains: `share(3, 12)` is a perfectly
 * legal call that silently prints the wrong number, and the compiler cannot
 * help — both parameters are `int`. So the learner predicts it (`b4`), repairs
 * it (`b6`) and has to get it right to make `b5` and `b8s` produce the right
 * answer. One mention would not do it.
 *
 * `b2` is worked example #2 of the six the PDF requires («алты толық талданған
 * мысал»); the six are distributed across l1, l2, l3, l8, l5 and l6.
 */

const P = 8;

export const M3_L2: LessonBlock[] = [
  {
    id: "m3.l2.b1",
    type: "concept",
    skillRefs: ["func.parameters", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Параметр — шақырудан мән қабылдайтын ат",
      ru: "Параметр — имя, принимающее значение из вызова",
    },
    body: {
      kk: "Өткен сабақтағы функция қажет санды өзі оқитын. Функцияны сырттан берілген деректермен пайдалану үшін жақшаның ішіне ат қоямыз — ол параметр. Параметрдің алдында оның ТҮРІ жазылады: `void square(int n)`. Параметр бірнешеу болса, әрқайсысының алдында өз түрі тұрады: `void diff(int a, int b)` — түрлері бірдей болса да, `int` екі рет жазылады, бір реті жетпейді. Параметр функция шақырылған сәтте пайда болады және шақыруда тұрған мәнді қабылдайды; сол мән аргумент деп аталады. `square(3)` дегенде дене `n`-нің орнына 3-ті көреді, ал `square(7)` дегенде дәл сол дене енді 7-мен қайтадан орындалады: код бір рет жазылады, жұмыс бірнеше рет істеледі. Мәндер солдан оңға қарай, жазылу ретімен таралады — бірінші мән бірінші параметрге, екінші мән екіншісіне. C++-та «атын атап беру» деген жоқ: тек орын шешеді. Ретті шатастыру оңай, әрі компилятор ол туралы ешқандай ескерту бермейді — екі аргумент те `int`, сондықтан бағдарлама жай ғана басқа жауап шығарады.",
      ru: "Функция из прошлого урока сама читала нужное ей число. Чтобы функция работала с данными, приходящими снаружи, в скобках пишут имя — это параметр. Перед параметром указывают его ТИП: `void square(int n)`. Если параметров несколько, у каждого стоит свой тип: `void diff(int a, int b)` — даже когда типы одинаковые, `int` пишется дважды, одного раза не хватит. Параметр появляется в момент вызова и принимает значение, указанное в вызове; такое значение называют аргументом. При `square(3)` тело видит вместо `n` число 3, а при `square(7)` то же самое тело выполняется заново уже с 7: код написан один раз, а работа делается несколько раз. Значения распределяются слева направо, в порядке записи, — первое значение первому параметру, второе второму. Передать значение «по имени параметра» в C++ нельзя: решает только позиция. Перепутать порядок легко, и компилятор об этом ничего не скажет — оба аргумента типа `int`, поэтому программа просто выведет другой ответ.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void square(int n) {\n" +
      "    cout << n * n << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    square(3);   // 9\n" +
      "    square(7);   // 49\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Worked example #2 of the month's six. The property is parity, which the
     * learner already wrote as a bare program in September (m1.l4.b5) — that is
     * the point. Nothing about the arithmetic is new here, so the whole of the
     * learner's attention is free for the one thing that is: the same body
     * running three times with three different values of `n`.
     *
     * The tokens stay English ("even" / "odd"), and both halves of `problem`
     * name them, so a Russian-track learner reads the condition instead of
     * matching Kazakh glyphs. Same rule September set at m1.l4.b3.
     */
    id: "m3.l2.b2",
    type: "worked_example",
    skillRefs: ["func.parameters", "func.reuse", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: жұптықты тексеретін функция",
      ru: "Разобранный пример: функция проверки чётности",
    },
    problem: {
      kk: "4, 7 және 10 сандарының әрқайсысы үшін оның жұп немесе тақ екенін шығару керек: жұп болса «even», тақ болса «odd». Тексеруді бір рет қана жазып, үш рет пайдалану керек.",
      ru: "Для каждого из чисел 4, 7 и 10 нужно вывести, чётное оно или нечётное: чётное — «even», нечётное — «odd». Проверку нужно написать один раз и использовать три раза.",
    },
    steps: [
      {
        kk: "Үш сан үшін де жұмыс бірдей: қалдықты табу және екі жауаптың бірін шығару. Қайталанатын логика дегеніміз — функцияға шығарылатын логика.",
        ru: "Для всех трёх чисел работа одна и та же: найти остаток и вывести один из двух ответов. Повторяющаяся логика — это как раз та логика, которую выносят в функцию.",
      },
      {
        kk: "Функцияға сырттан бір бүтін сан керек, сондықтан тақырыпта бір параметр жазамыз: `void parity(int n)`. Мұндағы `n` — әзірше мәні жоқ ат; ол тек шақыру кезінде толады. Алдындағы `int` — оның түрі, ал `void` — функцияның өзі ешнәрсе қайтармайтынын білдіреді.",
        ru: "Функции нужно одно целое число извне, поэтому в заголовке пишем один параметр: `void parity(int n)`. Здесь `n` — пока имя без значения; оно наполняется только при вызове. Стоящий перед ним `int` — это его тип, а `void` означает, что сама функция ничего не возвращает.",
      },
      {
        kk: "Дене — қыркүйекте жазған тексерудің дәл өзі: `n % 2 == 0` болса «even», әйтпесе «odd». Дене `n`-нің қайдан келгенін білмейді және білуі де қажет емес — ол тек атын біледі.",
        ru: "Тело — та же самая проверка, что мы писали в сентябре: если `n % 2 == 0`, то «even», иначе «odd». Тело не знает, откуда пришло `n`, и знать не должно — оно знает только имя.",
      },
      {
        kk: "Енді функцияны `main` ішінде үш рет шақырамыз: `parity(4);`, `parity(7);`, `parity(10);`. Әр шақыруда дене басынан қайта орындалады, бірақ `n` әр жолы басқа мәнді ұстап тұрады.",
        ru: "Теперь вызываем функцию внутри `main` три раза: `parity(4);`, `parity(7);`, `parity(10);`. При каждом вызове тело выполняется заново, с начала, но `n` каждый раз держит другое значение.",
      },
      {
        kk: "Шақырулардың реті — шығудың реті. Сондықтан жауаптар 4, 7, 10 ретімен, үш бөлек жолға шығады: even, odd, even.",
        ru: "Порядок вызовов — это порядок вывода. Поэтому ответы выйдут в порядке 4, 7, 10, тремя отдельными строками: even, odd, even.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void parity(int n) {\n" +
      "    if (n % 2 == 0) {\n" +
      '        cout << "even" << endl;\n' +
      "    } else {\n" +
      '        cout << "odd" << endl;\n' +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    parity(4);\n" +
      "    parity(7);\n" +
      "    parity(10);\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Экранға үш жол шығады: even, odd, even.",
      ru: "На экран выйдут три строки: even, odd, even.",
    },
  },
  {
    /*
     * The programme's «қандай параметр мәндері кіретінін ... визуалды
     * көрсетеді», done by hand. See the file header for why it is a trace.
     *
     * One row per call line and two per pass of the body — six rows for two
     * calls. The call rows carry only `n`, because at that moment `m` does not
     * exist yet, and writing "—" for it would invite the question this lesson
     * is not ready to answer. Local lifetime is m3.l4's subject; here the
     * silence is deliberate and the trace stays true.
     *
     * `m` is declared inside the function body, so in C++ it is not merely
     * unset before line 5 — it does not exist. That is a stronger claim than
     * Python's and it is the one l4 cashes out.
     */
    id: "m3.l2.b3",
    type: "trace_code",
    skillRefs: ["func.parameters", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Функция екі рет шақырылады. Кестені толтыр: шақыру жолында `n` сол сәтте қандай мән алғанын жаз, ал дене жолдарынан кейін `n` мен `m` екеуін де жаз. Екінші шақыруда дене басынан қайта орындалатынын ұмытпа.",
      ru: "Функция вызывается дважды. Заполни таблицу: в строке вызова запиши, какое значение получает `n` в этот момент, а после строк тела запиши и `n`, и `m`. Не забудь, что при втором вызове тело выполняется заново, с начала.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void triple(int n) {\n" +
      "    int m = n * 3;\n" +
      "    cout << m << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    triple(2);\n" +
      "    triple(5);\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 10, vars: { n: "2" } },
      { line: 5, vars: { n: "2", m: "6" } },
      { line: 6, vars: { n: "2", m: "6" } },
      { line: 11, vars: { n: "5" } },
      { line: 5, vars: { n: "5", m: "15" } },
      { line: 6, vars: { n: "5", m: "15" } },
    ],
  },
  {
    /*
     * The order of the arguments, met as a prediction before it is met as a
     * bug. The two calls differ only in the order of the same two numbers, so
     * nothing except the binding can explain the difference in output — and the
     * wrong answer is a plausible number rather than a compile error, which is
     * the whole hazard: both parameters are `int`, so the type system has
     * nothing to object to.
     *
     * Both divisions are between positive numbers, so C++ truncation and
     * Python's floor agree and the stored answer needed no repair: 12 / 3 is 4
     * and 3 / 12 is 0 in either language. A version of this task with a
     * negative in it would NOT have survived the move, which is why there is
     * not one.
     *
     * "4\n4" and "0\n0" carry no mapping. Each is reachable two ways at once —
     * believing `/` always divides the larger by the smaller, and simply
     * copying one line's answer twice — so the contract's rule applies and the
     * engine asks instead of asserting.
     */
    id: "m3.l2.b4",
    type: "prediction",
    skillRefs: ["func.parameters", "func.reuse", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір функция екі рет шақырылады, тек мәндердің реті ауысқан. Бағдарлама нені шығарады? Жауапты екі жол етіп жаз.",
      ru: "Одна и та же функция вызывается дважды, поменялся только порядок значений. Что выведет программа? Запиши ответ двумя строками.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void share(int total, int people) {\n" +
      "    cout << total / people << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    share(12, 3);\n" +
      "    share(3, 12);\n" +
      "    return 0;\n" +
      "}",
    answer: "4\n0",
    options: ["4\n0", "0\n4", "4\n4", "0\n0"],
    diagnosticMapping: {
      "0\n4": {
        failureClass: "argument_order_reversed",
        justification:
          "Дәл осы ретпен 0 мен 4 шығу үшін бірінші шақыруда 12 `people`-ге, ал екінші шақыруда 12 `total`-ға түсуі керек. Бұл жауапқа аргументтердің солдан оңға таралатынын елемеу арқылы ғана келуге болады.",
      },
    },
  },
  {
    /*
     * The header and the call completed together, because they are one
     * decision seen from two ends: the name in the header is the name the body
     * uses, and the value in the call is what that name will hold.
     *
     * Every blank has exactly one right answer, which is why the body is given
     * rather than blanked too. Blanking both the header name and its use would
     * accept `x` in both — correct C++, marked wrong by a stored answer of "b",
     * and the learner would have no way to know why. The parameter's TYPE is
     * given for the same reason it is written twice in b1's body: `int` is the
     * only answer, so a blank there would be a word to copy.
     */
    id: "m3.l2.b5",
    type: "fill_blank",
    skillRefs: ["func.parameters", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция өзіне берілген екі санның айырмасын шығарады. Толықтыр: тақырыптағы екінші параметрдің аты дене қолданатын атпен бірдей болуы керек, ал шақырулар алдымен 6, содан кейін 8 шығарсын.",
      ru: "Функция выводит разность двух данных ей чисел. Дополни: имя второго параметра в заголовке должно совпадать с именем, которое использует тело, а вызовы должны вывести сначала 6, потом 8.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void diff(int a, int ___) {\n" +
      "    cout << a - b << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    diff(___, 4);\n" +
      "    diff(9, ___);\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "b" },
      { id: "f2", answer: "10" },
      { id: "f3", answer: "1" },
    ],
  },
  {
    /*
     * The bug the programme's own hazard list implies for this lesson: nothing
     * here fails to compile and nothing crashes. `remaining(b, a)` is a legal
     * call that hands the numbers over in the wrong order, and the only visible
     * trace of it is a minus sign in the answer. Both parameters are `int`, so
     * there is no type for the compiler to complain about — which is exactly
     * why this bug survives to the screen.
     *
     * symptomInput is declared because the fallback probe feeds a single
     * number: `cin >> a >> b` then leaves `b` untouched, both programs read the
     * same garbage, and the difference the prompt describes never appears.
     */
    id: "m3.l2.b6",
    type: "find_bug",
    skillRefs: ["func.parameters", "io.read"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда екі сан беріледі: біріншісі — қорапта қанша қалам бар, екіншісі — қаншасы алынды. Бағдарлама қалғанын шығаруы керек. Бірақ «10 4» енгізгенде 6-ның орнына -6 шығып тұр. Қате қай жолда?",
      ru: "В одной строке даны два числа: первое — сколько ручек в коробке, второе — сколько ручек забрали. Программа должна вывести остаток. Но при вводе «10 4» вместо 6 выводится -6. В какой строке ошибка?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void remaining(int have, int taken) {\n" +
      "    cout << have - taken << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    remaining(b, a);\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 11,
    symptomInput: "10 4",
    fixedCode:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void remaining(int have, int taken) {\n" +
      "    cout << have - taken << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    remaining(a, b);\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "5": {
        failureClass: "blamed_the_body_not_the_call",
        justification:
          "5-жол — функцияның денесі, ал ол дұрыс жазылған: қалғаны деген барынан алынғанды азайту. Бұл жолды таңдау қатені амалдан іздегенді білдіреді, ал мәндердің қай параметрге түсетінін шешетін жол — шақыру.",
      },
    },
  },
  {
    /*
     * PDF family: «санның қасиетін тексеретін функция». Parity is spent — b2
     * walked through it — so the property here is "two-digit", which has real
     * boundaries to get wrong and needs September's `&&`.
     *
     * The cases are chosen against the mutants this task actually attracts:
     * `x > 10` dies on 10, `x < 99` dies on 99, and "99 100 9" keeps the three
     * answers from being identical in any visible case, so a program that
     * prints one token three times passes nothing.
     *
     * The negative cases are not decoration. The obvious C++ shortcut for
     * "two-digit" is to throw the sign away and count characters — a learner
     * who reaches for `to_string(x).size() == 2` gets `yes` for -5, because
     * "-5" is two characters, and `no` for -99, because "-99" is three. Both
     * are wrong, and the set contains both: -5 in one line and -99 in the same
     * one. That range is part of the same repair — a hidden case was once
     * feeding a negative to a statement that said only «целые числа», which
     * made the sign a trap rather than a case; m3.l1.b7 settled the convention
     * already — declare the range, then feed both of its ends, which
     * "9 42 1000" and this line now do.
     */
    id: "m3.l2.b7",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: [
      "func.parameters",
      "func.reuse",
      "cond.if_elif_else",
      "logic.and_or_not",
      "debug.boundary",
    ],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда үш бүтін сан бос орынмен беріледі (−1000 ≤ әр сан ≤ 1000). Бір санды қабылдайтын функция жаз: сан екі таңбалы болса `yes`, болмаса `no` шығарсын. Екі таңбалы деп 10-нан 99-ға дейінгі сандарды айтамыз, 10 мен 99 да кіреді. Функцияны үш рет шақырып, әр сан үшін жауапты бөлек жолға шығар. Тексеруді бір-ақ рет жаз.",
      ru: "В одной строке через пробел даны три целых числа (−1000 ≤ каждое число ≤ 1000). Напиши функцию, принимающую одно число: если оно двузначное — вывести `yes`, иначе `no`. Двузначными считаем числа от 10 до 99 включительно. Вызови функцию три раза и выведи ответ для каждого числа отдельной строкой. Саму проверку напиши только один раз.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void check(int x) {\n" +
      "    if (x >= 10 && x <= 99) {\n" +
      '        cout << "yes" << endl;\n' +
      "    } else {\n" +
      '        cout << "no" << endl;\n' +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b, c;\n" +
      "    cin >> a >> b >> c;\n" +
      "    check(a);\n" +
      "    check(b);\n" +
      "    check(c);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "10 99 100", expectedOutput: "yes\nyes\nno" },
      { input: "9 42 1000", expectedOutput: "no\nyes\nno" },
      { input: "100 99 10", expectedOutput: "no\nyes\nyes", hidden: true },
      { input: "-15 0 5", expectedOutput: "no\nno\nno", hidden: true },
      { input: "11 10 55", expectedOutput: "yes\nyes\nyes", hidden: true },
      { input: "99 100 9", expectedOutput: "yes\nno\nno", hidden: true },
      { input: "-1000 -5 -99", expectedOutput: "no\nno\nno", hidden: true },
    ],
  },
  {
    /*
     * Two parameters, called from a loop — the lesson's second objective at
     * full size: one function, n different pairs of values, and the call site
     * inside the loop body rather than written out by hand.
     *
     * `/` on two `int`s is chosen over `*` on purpose: multiplication is
     * commutative, so a task built on it would let a learner swap the arguments
     * and still pass every case. Here "10 3" and "3 10" give 3 and 0, and the
     * case set includes the asymmetric pairs that expose it.
     *
     * Every quantity here is non-negative and every capacity is at least 1, so
     * C++ truncation and Python's floor agree on every case and none of the
     * expected outputs moved. The lower bound on the capacity is not politeness
     * either: division by zero is undefined behaviour in C++ rather than an
     * exception, so a task that let the divisor reach 0 would have no defined
     * answer to test.
     *
     * Support meets the same problem as b8s below.
     */
    id: "m3.l2.b8",
    type: "write_code",
    skillRefs: ["func.parameters", "func.reuse", "loops.for", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100) — тапсырыстар саны. Келесі n жолдың әрқайсысында екі бүтін сан бос орынмен: заттар саны (0 ≤ бірінші ≤ 10000) және бір қорапқа сыятын зат саны (1 ≤ екінші ≤ 1000). Әр тапсырыс үшін толық толатын қораптардың саны нешеу екенін жеке жолға шығар. Есептеуді екі параметрі бар бір функцияға шығар да, оны цикл ішінен шақыр.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 100) — количество заказов. В каждой из следующих n строк через пробел даны два целых числа: количество предметов (0 ≤ первое ≤ 10000) и вместимость одной коробки (1 ≤ второе ≤ 1000). Для каждого заказа выведи отдельной строкой количество полностью заполненных коробок. Вычисление вынеси в одну функцию с двумя параметрами и вызывай её из цикла.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void boxes(int items, int capacity) {\n" +
      "    cout << items / capacity << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int a, b;\n" +
      "        cin >> a >> b;\n" +
      "        boxes(a, b);\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\n10 3\n7 7\n5 9", expectedOutput: "3\n1\n0" },
      { input: "1\n100 10", expectedOutput: "10" },
      { input: "4\n9 2\n8 8\n1 100\n99 10", expectedOutput: "4\n1\n0\n9", hidden: true },
      { input: "2\n0 5\n1 1", expectedOutput: "0\n1", hidden: true },
      { input: "1\n1000 1", expectedOutput: "1000", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b8 — «құрастыру мен толықтыру көбірек, нөлден
     * жазу азырақ» (p.6). The same problem, with the header, the loop and the
     * reading given: what is removed is the typing, not the idea.
     *
     * One of the three blanks used to be the second parameter's NAME, with
     * `cout << items ___ capacity` sitting one line beneath it. That is not a
     * decision. The prompt said the header must match the name the body uses,
     * the body said `capacity`, and the whole of the work was copying a word —
     * work the browser did too, because the projection strips `blanks[].answer`
     * and then ships a template that spells the answer out. That is the leak
     * `payload-privacy` reports, and it is a content defect before it is a
     * privacy one: a blank with one readable answer teaches nothing.
     *
     * So the header is given whole and the blanks sit on the two decisions b8
     * is actually about: the operator that makes a box FULL rather than
     * fractional, and which of the two numbers read from the line lands in
     * which parameter. `a` and `b` are both on screen and both fit the slot, so
     * the template does not answer the question — and getting the pair
     * backwards prints a number rather than failing to compile, which is
     * precisely the hazard b4 predicted and b6 repaired.
     *
     * The operator blank is not the `//` it was in Python. In C++ there is no
     * second division sign: `/` between two `int`s already throws the fraction
     * away, and `%` — the other plausible answer, and the one a learner reaches
     * for when they read «толық толған» as «қалдық» — gives the leftover
     * instead of the count. That is the decision, and it is a real one.
     *
     * The statement is spelled out in full for the same reason. Support never
     * receives b8, so «сол қорап есебі» / «той же задачи» pointed at a card
     * this route has never seen, and the meaning of the two numbers on a line
     * was written down nowhere — which is exactly what the new blanks ask the
     * learner to map.
     */
    id: "m3.l2.b8s",
    type: "fill_blank",
    skillRefs: ["func.parameters", "func.reuse", "loops.for", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100) — тапсырыстар саны. Келесі n жолдың әрқайсысында екі бүтін сан бос орынмен: заттар саны (0 ≤ бірінші ≤ 10000) және бір қорапқа сыятын зат саны (1 ≤ екінші ≤ 1000). Әр тапсырыс үшін толық толған қораптардың саны жеке жолға шығуы керек. Қаңқасы дайын — үш орынды толтыр. Біріншісі — амал белгісі: екі бүтін санды бөлгенде бөлшек бөлігі өзі тасталады, ал бізге жартылай толған қорап емес, толық қораптардың САНЫ керек. Қалған екеуі — шақырудағы аргументтердің реті: `boxes` алдымен заттар санын, сосын бір қорапқа сыятын зат санын күтеді, ал жолдан оқылған сандар `a` мен `b`-да тұр. Ретті шатастырсаң, компилятор ешқандай қате бермейді — екеуі де `int`, бағдарлама жай ғана басқа сан шығарады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 100) — количество заказов. В каждой из следующих n строк через пробел даны два целых числа: количество предметов (0 ≤ первое ≤ 10000) и вместимость одной коробки (1 ≤ второе ≤ 1000). Для каждого заказа нужно вывести отдельной строкой количество полностью заполненных коробок. Каркас готов — заполни три места. Первое — знак операции: при делении двух целых чисел дробная часть отбрасывается сама, а нам нужно КОЛИЧЕСТВО полных коробок, а не остаток. Остальные два — порядок аргументов в вызове: `boxes` ждёт сначала количество предметов, а потом вместимость коробки, а прочитанные из строки числа лежат в `a` и `b`. Если перепутать порядок, компилятор не сообщит об ошибке — оба числа типа `int`, программа просто выведет другое число.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void boxes(int items, int capacity) {\n" +
      "    cout << items ___ capacity << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int a, b;\n" +
      "        cin >> a >> b;\n" +
      "        boxes(___, ___);\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "/" },
      { id: "f2", answer: "a" },
      { id: "f3", answer: "b" },
    ],
  },
];
