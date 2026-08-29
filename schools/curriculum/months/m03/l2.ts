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
 * **No `return`.** Every function here prints. Lesson 3 owns returning, and a
 * function that both prints and returns in the lesson before `return` is
 * introduced would make l3's own distinction — «нәтижені қайтару мен
 * шығарудың айырмасы» — impossible to draw cleanly.
 *
 * **No max/min function.** «максимум мен минимум функциясы» is a November
 * practice family, but it wants a value handed back, so it belongs after l3.
 * Writing it here would force either a print-only version that cannot be
 * composed, or `return` a lesson early.
 *
 * ## The order of arguments, met three times on purpose
 *
 * Passing values in the wrong order is the failure this lesson has to
 * inoculate against, because Python does not complain: `share(3, 12)` is a
 * perfectly legal call that silently prints the wrong number. So the learner
 * predicts it (`b4`), repairs it (`b6`) and has to get it right to make `b5`
 * and `b8s` compile into the right answer. One mention would not do it.
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
      kk: "Өткен сабақтағы функция әр шақыруда бірдей жұмыс істеді, өйткені оның ішінде тұрақты сандар жазулы тұрды. Функцияны әртүрлі деректермен пайдалану үшін жақшаның ішіне ат қоямыз — ол параметр. Параметр функция шақырылған сәтте пайда болады және шақыруда тұрған мәнді қабылдайды; сол мән аргумент деп аталады. `square(3)` дегенде дене `n`-нің орнына 3-ті көреді, ал `square(7)` дегенде дәл сол дене енді 7-мен қайтадан орындалады: код бір рет жазылады, жұмыс бірнеше рет істеледі. Параметр бірнешеу болса, мәндер солдан оңға қарай, жазылу ретімен таралады — бірінші мән бірінші параметрге, екінші мән екіншісіне. Ретті шатастыру оңай, ал бағдарлама ол туралы ешқандай ескерту бермейді: жай ғана басқа жауап шығарады.",
      ru: "Функция из прошлого урока при каждом вызове делала одно и то же, потому что внутри неё были записаны постоянные числа. Чтобы функция работала с разными данными, в скобках пишут имя — это параметр. Параметр появляется в момент вызова и принимает значение, указанное в вызове; такое значение называют аргументом. При `square(3)` тело видит вместо `n` число 3, а при `square(7)` то же самое тело выполняется заново уже с 7: код написан один раз, а работа делается несколько раз. Если параметров несколько, значения распределяются слева направо, в порядке записи, — первое значение первому параметру, второе второму. Перепутать порядок легко, и программа об этом ничего не сообщит: она просто выведет другой ответ.",
    },
    code: "def square(n):\n    print(n * n)\n\nsquare(3)   # 9\nsquare(7)   # 49",
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
        kk: "Функцияға сырттан бір сан керек, сондықтан тақырыпта бір параметр жазамыз: `def parity(n):`. Мұндағы `n` — әзірше мәні жоқ ат; ол тек шақыру кезінде толады.",
        ru: "Функции нужно одно число извне, поэтому в заголовке пишем один параметр: `def parity(n):`. Здесь `n` — пока имя без значения; оно наполняется только при вызове.",
      },
      {
        kk: "Дене — қыркүйекте жазған тексерудің дәл өзі: `n % 2 == 0` болса «even», әйтпесе «odd». Дене `n`-нің қайдан келгенін білмейді және білуі де қажет емес — ол тек атын біледі.",
        ru: "Тело — та же самая проверка, что мы писали в сентябре: если `n % 2 == 0`, то «even», иначе «odd». Тело не знает, откуда пришло `n`, и знать не должно — оно знает только имя.",
      },
      {
        kk: "Енді функцияны үш рет шақырамыз: `parity(4)`, `parity(7)`, `parity(10)`. Әр шақыруда дене басынан қайта орындалады, бірақ `n` әр жолы басқа мәнді ұстап тұрады.",
        ru: "Теперь вызываем функцию три раза: `parity(4)`, `parity(7)`, `parity(10)`. При каждом вызове тело выполняется заново, с начала, но `n` каждый раз держит другое значение.",
      },
      {
        kk: "Шақырулардың реті — шығудың реті. Сондықтан жауаптар 4, 7, 10 ретімен, үш бөлек жолға шығады: even, odd, even.",
        ru: "Порядок вызовов — это порядок вывода. Поэтому ответы выйдут в порядке 4, 7, 10, тремя отдельными строками: even, odd, even.",
      },
    ],
    code:
      'def parity(n):\n    if n % 2 == 0:\n        print("even")\n    else:\n        print("odd")\n\nparity(4)\nparity(7)\nparity(10)',
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
    code: "def triple(n):\n    m = n * 3\n    print(m)\n\ntriple(2)\ntriple(5)",
    steps: [
      { line: 5, vars: { n: "2" } },
      { line: 2, vars: { n: "2", m: "6" } },
      { line: 3, vars: { n: "2", m: "6" } },
      { line: 6, vars: { n: "5" } },
      { line: 2, vars: { n: "5", m: "15" } },
      { line: 3, vars: { n: "5", m: "15" } },
    ],
  },
  {
    /*
     * The order of the arguments, met as a prediction before it is met as a
     * bug. The two calls differ only in the order of the same two numbers, so
     * nothing except the binding can explain the difference in output — and the
     * wrong answer is a plausible number rather than a crash, which is the
     * whole hazard.
     *
     * "4\n4" and "0\n0" carry no mapping. Each is reachable two ways at once —
     * believing `//` always divides the larger by the smaller, and simply
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
    code: "def share(total, people):\n    print(total // people)\n\nshare(12, 3)\nshare(3, 12)",
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
     * accept `x` in both — correct Python, marked wrong by a stored answer of
     * "b", and the learner would have no way to know why.
     */
    id: "m3.l2.b5",
    type: "fill_blank",
    skillRefs: ["func.parameters", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция өзіне берілген екі санның айырмасын шығарады. Толықтыр: тақырыптағы екінші параметрдің аты дене қолданатын атпен бірдей болуы керек, ал шақырулар алдымен 6, содан кейін 8 шығарсын.",
      ru: "Функция выводит разность двух данных ей чисел. Дополни: имя второго параметра в заголовке должно совпадать с именем, которое использует тело, а вызовы должны вывести сначала 6, потом 8.",
    },
    template: "def diff(a, ___):\n    print(a - b)\n\ndiff(___, 4)\ndiff(9, ___)",
    blanks: [
      { id: "f1", answer: "b" },
      { id: "f2", answer: "10" },
      { id: "f3", answer: "1" },
    ],
  },
  {
    /*
     * The bug the programme's own hazard list implies for this lesson: nothing
     * here is broken Python and nothing raises. `remaining(b, a)` is a legal
     * call that hands the numbers over in the wrong order, and the only visible
     * trace of it is a minus sign in the answer.
     *
     * symptomInput is declared because the program reads two numbers from one
     * line: the fallback probe feeds a single number, `split()` then yields one
     * piece, and the unpack raises in BOTH programs — which reads as "the two
     * programs behave identically" and hides a bug that is plainly there.
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
      "def remaining(have, taken):\n    print(have - taken)\n\na, b = map(int, input().split())\nremaining(b, a)",
    buggyLine: 5,
    symptomInput: "10 4",
    fixedCode:
      "def remaining(have, taken):\n    print(have - taken)\n\na, b = map(int, input().split())\nremaining(a, b)",
    diagnosticMapping: {
      "2": {
        failureClass: "blamed_the_body_not_the_call",
        justification:
          "2-жол — функцияның денесі, ал ол дұрыс жазылған: қалғаны деген барынан алынғанды азайту. Бұл жолды таңдау қатені амалдан іздегенді білдіреді, ал мәндердің қай параметрге түсетінін шешетін жол — шақыру.",
      },
    },
  },
  {
    /*
     * PDF family: «санның қасиетін тексеретін функция». Parity is spent — b2
     * walked through it — so the property here is "two-digit", which has real
     * boundaries to get wrong and needs September's `and`.
     *
     * The cases are chosen against the mutants this task actually attracts:
     * `x > 10` dies on 10, `x < 99` dies on 99, `10 <= abs(x) <= 99` dies on
     * -15, and "99 100 9" keeps the three answers from being identical in any
     * visible case, so a program that prints one token three times passes
     * nothing.
     *
     * One mutant used to walk straight through all of that: `len(str(x)) == 2`,
     * which is the first thing a fourteen-year-old means by "two-digit". The
     * note that stood here claimed -15 killed it. It does not — "-15" is three
     * characters, so the mutant answers `no` there and is right by accident.
     * Counting characters is only wrong on a negative with ONE digit, and the
     * set had none of those. "-1000 -5 -99" supplies one: at -5 the count says
     * `yes` where the definition says `no`. The other two numbers are not
     * padding — -99 is the negative twin of the upper boundary, where throwing
     * the sign away also says `yes`, and -1000 is the end of the range the
     * prompt now declares.
     *
     * That range is part of the same repair. A hidden case was feeding a
     * negative to a statement that said only «целые числа», which made the sign
     * a trap rather than a case; m3.l1.b7 settled the convention already —
     * declare the range, then feed both of its ends, which "9 42 1000" and this
     * line now do.
     */
    id: "m3.l2.b7",
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
      kk: "Бір жолда үш бүтін сан бос орынмен беріледі (−1000 ≤ әр сан ≤ 1000). Бір санды қабылдайтын функция жаз: сан екі таңбалы болса «yes», болмаса «no» шығарсын. Екі таңбалы деп 10-нан 99-ға дейінгі сандарды айтамыз, 10 мен 99 да кіреді. Функцияны үш рет шақырып, әр сан үшін жауапты бөлек жолға шығар. Тексеруді бір-ақ рет жаз.",
      ru: "В одной строке через пробел даны три целых числа (−1000 ≤ каждое число ≤ 1000). Напиши функцию, принимающую одно число: если оно двузначное — вывести «yes», иначе «no». Двузначными считаем числа от 10 до 99 включительно. Вызови функцию три раза и выведи ответ для каждого числа отдельной строкой. Саму проверку напиши только один раз.",
    },
    referenceSolution:
      'def check(x):\n    if x >= 10 and x <= 99:\n        print("yes")\n    else:\n        print("no")\n\na, b, c = map(int, input().split())\ncheck(a)\ncheck(b)\ncheck(c)',
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
     * `//` is chosen over `*` on purpose: multiplication is commutative, so a
     * task built on it would let a learner swap the arguments and still pass
     * every case. Here "10 3" and "3 10" give 3 and 0, and the case set
     * includes the asymmetric pairs that expose it.
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
      "def boxes(items, capacity):\n    print(items // capacity)\n\nn = int(input())\nfor i in range(n):\n    a, b = map(int, input().split())\n    boxes(a, b)",
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
     * `print(items ___ capacity)` sitting one line beneath it. That is not a
     * decision. The prompt said the header must match the name the body uses,
     * the body said `capacity`, and the whole of the work was copying a word —
     * work the browser did too, because the projection strips `blanks[].answer`
     * and then ships a template that spells the answer out. That is the leak
     * `payload-privacy` reports, and it is a content defect before it is a
     * privacy one: a blank with one readable answer teaches nothing.
     *
     * Blanking the body's use as well would not repair it. Any identifier is
     * legal in both places, so `x` twice is a correct program marked wrong by a
     * stored answer, which is the trap b5's note argues against. So the header
     * is given whole and the blanks moved onto the two decisions b8 is actually
     * about: the operator that makes a box FULL rather than fractional, and
     * which of the two numbers read from the line lands in which parameter.
     * `a` and `b` are both on screen and both fit the slot, so the template no
     * longer answers the question — and getting the pair backwards prints a
     * number rather than raising, which is precisely the hazard b4 predicted
     * and b6 repaired.
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
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100) — тапсырыстар саны. Келесі n жолдың әрқайсысында екі бүтін сан бос орынмен: заттар саны (0 ≤ бірінші ≤ 10000) және бір қорапқа сыятын зат саны (1 ≤ екінші ≤ 1000). Әр тапсырыс үшін толық толған қораптардың саны жеке жолға шығуы керек. Қаңқасы дайын — үш орынды толтыр. Біріншісі — амал белгісі: жартылай толған қорап саналмайды, сондықтан бөлудің бөлшек бөлігі тасталуы тиіс. Қалған екеуі — шақырудағы аргументтердің реті: `boxes` алдымен заттар санын, сосын бір қорапқа сыятын зат санын күтеді, ал жолдан оқылған сандар `a` мен `b`-да тұр. Ретті шатастырсаң, Python қате бермейді — жай ғана басқа сан шығарады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 100) — количество заказов. В каждой из следующих n строк через пробел даны два целых числа: количество предметов (0 ≤ первое ≤ 10000) и вместимость одной коробки (1 ≤ второе ≤ 1000). Для каждого заказа нужно вывести отдельной строкой количество полностью заполненных коробок. Каркас готов — заполни три места. Первое — знак операции: наполовину заполненная коробка не считается, поэтому дробная часть деления должна отбрасываться. Остальные два — порядок аргументов в вызове: `boxes` ждёт сначала количество предметов, а потом вместимость коробки, а прочитанные из строки числа лежат в `a` и `b`. Если перепутать порядок, Python не сообщит об ошибке — он просто выведет другое число.",
    },
    template:
      "def boxes(items, capacity):\n    print(items ___ capacity)\n\nn = int(input())\nfor i in range(n):\n    a, b = map(int, input().split())\n    boxes(___, ___)",
    blanks: [
      { id: "f1", answer: "//" },
      { id: "f2", answer: "a" },
      { id: "f3", answer: "b" },
    ],
  },
];
