import type { LessonBlock } from "../../types";

/**
 * Lesson m3.l1 · «Алғашқы функция» — the first function of the year, in C++17.
 * PDF p.8, November. Skills: `func.define`, `func.reuse`.
 *
 * Two clauses of the programme drive every block below.
 *
 * «Қайталанатын логиканы функцияға бөлу … функцияны бірнеше рет шақыру» —
 * split the repeated logic out, then call it more than once. So no block here
 * shows a function that is called exactly once: the worked example calls twice,
 * the fill-blank calls twice, and the two writing tasks call three times and n
 * times. A function called once is a section heading, and a learner who only
 * ever sees that has no reason to believe any of this was worth the trouble.
 *
 * «Сегіз қысқа сабақ және алты толық талданған мысал» — the month owes six
 * fully worked examples. `m3.l1.b2` is the first of the six: four lines written
 * twice by hand, then written once and given a name.
 *
 * ## The one idea, and where it bites
 *
 * Three months of programs have run top to bottom inside `int main()`. A
 * function definition is therefore the first thing in the year that produces no
 * effect at all when the computer reaches it, and that single fact is what this
 * lesson is for. `m3.l1.b3` is built entirely around it: a program that defines
 * a function and never calls it, wrapped in two prints so the answer is
 * `start` / `end` — the missing `hello` is read as an absence between two words
 * that ARE there, rather than as an empty box that a learner cannot tell apart
 * from a broken exercise.
 *
 * ## What C++ adds that Python never asked for, and where it is paid
 *
 * Three things, and each is taught in the block that first needs it rather than
 * announced in a vocabulary lecture:
 *
 * 1. **A return type is compulsory.** A function that hands nothing back is
 *    `void`. Python's implicit `None` return has no equivalent to lean on, so
 *    the word is in b1's body, in b6's blanks and in every program here.
 * 2. **The body is delimited by `{ }`, not by indentation.** September already
 *    gave the learner `int main() { … }`; this is where the braces stop being
 *    ceremony and start being the boundary of something they wrote.
 * 3. **The definition must stand ABOVE `main`.** Python's order-independence at
 *    module level does not hold, and the failure mode is a compile error the
 *    learner has never seen — «use of undeclared identifier». b1 states the
 *    rule, b5's reorder makes it the decision the task is about, and `m3.l5.b5`
 *    is where a learner meets the diagnostic itself.
 *
 * ## What is deliberately not here
 *
 * No parameters (that is l2) and no `return` value (l3), and neither may appear
 * in a reference solution before its own lesson. A `void` function with no
 * parameters still has to get its data from somewhere, so the functions in this
 * lesson read their own input — which is precisely the shape l2 dismantles the
 * moment parameters exist, and the concept block says so out loud instead of
 * leaving the learner to discover that they were taught a temporary habit.
 *
 * The even/odd task at `m3.l1.b7` is the programme's «санның қасиетін
 * тексеретін функция». It PRINTS its verdict rather than returning it; l3
 * rewrites this same family with `return`, and the gap between the two versions
 * is what makes «шығару мен қайтарудың айырмасы» a real question there.
 *
 * ## What the cases cannot see
 *
 * An output test cannot tell a function apart from a loop doing the same work:
 * a learner who ignores functions completely still passes `m3.l1.b8`. That is
 * why the reorder, the fill-blank and the support twin carry the
 * definition-and-call work structurally — they are the blocks that actually
 * check the month's first skill, not decoration around the two writing tasks.
 */

export const M3_L1: LessonBlock[] = [
  {
    id: "m3.l1.b1",
    type: "concept",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Функция: қайталанатын жолдарға ат қою",
      ru: "Функция: даём имя повторяющимся строкам",
    },
    /* The body has to say what a definition DOES, and the honest answer is
       "nothing yet". Saying only "it creates a function" leaves the learner
       with lines that look like commands, and the very next block asks them to
       predict a program where believing that is the only way to get the wrong
       answer.

       Three C++ facts are paid for here and nowhere else: the return type of a
       function that hands nothing back is `void`, the braces are the body's
       boundary, and the definition has to stand above `main`. The last one is
       not a style rule — it is a compile error a fourteen-year-old has never
       seen, and b5 turns it into the decision that block is about. */
    body: {
      kk: "Осы кезге дейін бағдарламаның бүкіл жұмысы `int main()` ішінде тұратын және жоғарыдан төменге қарай бір рет орындалатын. Енді кодтың бір бөлігіне ат қоя аламыз — ол функция. Функцияның жариялануы `main`-нен ЖОҒАРЫ жазылады: компилятор жолдарды жоғарыдан төменге оқиды, сондықтан шақырылатын функция ол жерге жеткенше таныс болуы керек. Жариялау жолы өзі ешнәрсе істемейді: компьютер оны оқығанда ешқандай сан оқылмайды, экранға да ештеңе шықпайды. Ол тек «мына жолдардың аты — осы» деп есте сақтап қояды. Функцияға тиесілі жолдар `{` мен `}` жақшаларының арасында тұрады — шегініс емес, дәл осы екі жақша функцияның шекарасы. Функция ешқандай нәтиже қайтармаса, оның түрі `void` деп жазылады. Дене шақырғанда ғана жүреді: функцияның атын жазып, жақша мен нүктелі үтір қоямыз — `hello();`. Атын неше рет жазсақ, дене сонша рет орындалады. Әзірге функция қажет деректі өзі оқиды; оған сырттан дерек беруді келесі сабақта үйренеміз.",
      ru: "До сих пор вся работа программы жила внутри `int main()` и выполнялась сверху вниз ровно один раз. Теперь куску кода можно дать имя — это функция. Объявление функции пишется ВЫШЕ `main`: компилятор читает строки сверху вниз, поэтому вызываемая функция должна быть ему уже знакома к моменту вызова. Сама строка объявления не делает ничего: когда компьютер её читает, ни одно число не читается и на экран ничего не выводится. Она лишь запоминает, что у этих строк теперь есть имя. Строки, принадлежащие функции, стоят между скобками `{` и `}` — границу задаёт не отступ, а именно эти две скобки. Если функция не возвращает никакого результата, её тип записывают словом `void`. Тело срабатывает только при вызове: пишем имя функции, скобки и точку с запятой — `hello();`. Сколько раз напишем имя, столько раз выполнится тело. Пока функция сама читает нужные ей данные; передавать данные снаружи научимся на следующем уроке.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void hello() {\n" +
      '    cout << "hello" << endl;\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    hello();\n" +
      "    hello();\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /* WORKED EXAMPLE 1 of the month's six. «Сегіз қысқа сабақ және алты толық
       талданған мысал» (p.8). The duplicated version is named line by line in
       step 1 rather than shown as a second program: `code` is one runnable
       program, and pasting both versions into it would make it read four lines
       of input and print four answers, which contradicts `result`. */
    id: "m3.l1.b2",
    type: "worked_example",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: қайталанған төрт жолды функцияға шығару",
      ru: "Разобранный пример: выносим четыре повторяющиеся строки в функцию",
    },
    problem: {
      kk: "Мектепте екі бөлменің еденіне линолеум төселеді. Әр бөлме үшін жеке жолда, бос орынмен бөлініп, оның ұзындығы мен ені беріледі (метрмен). Әр бөлменің ауданын жеке жолға шығар. Мысалы, бірінші жолда «6 5», екінші жолда «4 3» берілсе, жауап 30, содан кейін 12.",
      ru: "В школе на пол двух комнат кладут линолеум. Для каждой комнаты в отдельной строке через пробел даны её длина и ширина (в метрах). Выведи площадь каждой комнаты на отдельной строке. Например, если в первой строке «6 5», а во второй «4 3», ответ — 30, затем 12.",
    },
    steps: [
      {
        kk: "Екі бөлмеге де істейтініміз бірдей: `int a, b;` — екі айнымалы, `cin >> a >> b;` — екі сан оқимыз, `int s = a * b;` — көбейтеміз, `cout << s << endl;` — шығарамыз. Осы төрт жолды екі рет көшіріп жазуға да болады. Бірақ үшінші бөлме қосылса, тағы көшіру керек, ал бір көшірмедегі қатені түзеткенде екіншісін ұмытып кету оңай.",
        ru: "Для обеих комнат мы делаем одно и то же: `int a, b;` — две переменные, `cin >> a >> b;` — читаем два числа, `int s = a * b;` — перемножаем, `cout << s << endl;` — выводим. Эти четыре строки можно просто скопировать дважды. Но если добавится третья комната, придётся копировать снова, а исправив ошибку в одной копии, легко забыть про вторую.",
      },
      {
        kk: "Функцияның тақырыбы үш нәрседен тұрады: түрі, аты және жақшалар. Ол ешнәрсе қайтармайды, сондықтан түрі — `void`. Атын өзіміз таңдаймыз, не істейтіні түсінікті болсын: `void room_area()`. Одан кейін бірден `{` тұрады.",
        ru: "Заголовок функции состоит из трёх вещей: тип, имя и скобки. Она ничего не возвращает, поэтому тип — `void`. Имя выбираем сами, такое, чтобы было понятно, что оно делает: `void room_area()`. Сразу за ним идёт `{`.",
      },
      {
        kk: "Функцияның денесі — `{` мен `}` арасындағы төрт жол. Осы екі жақша — функцияның шекарасы. Шегініс тек оқуға ыңғайлы болу үшін қойылады, оны компилятор санамайды.",
        ru: "Тело функции — это четыре строки между `{` и `}`. Именно эти две скобки и есть граница функции. Отступ ставится только ради удобства чтения, компилятор его не считает.",
      },
      {
        kk: "Функция `int main()`-нен ЖОҒАРЫ жазылады, әйтпесе компилятор `main` ішіндегі шақыруға жеткенде мұндай атты әлі білмейді де, қате береді. Компьютер жариялау жолдарын оқығанда бірде-бір сан оқылмайды, экранға ештеңе шықпайды — ол тек атын есіне сақтайды.",
        ru: "Функция пишется ВЫШЕ `int main()`, иначе компилятор, дойдя до вызова внутри `main`, ещё не знает такого имени и выдаёт ошибку. Когда компьютер читает строки объявления, не читается ни одно число и на экран ничего не выводится — он только запоминает имя.",
      },
      {
        kk: "`main` ішінде екі шақыру тұр — дене екі рет орындалады. Бірінші шақыру бірінші жолды оқиды, екіншісі — келесі жолды. Сондықтан бір ғана рет жазылған код әр жолы жаңа сандармен жұмыс істейді.",
        ru: "Внутри `main` стоят два вызова — тело выполняется дважды. Первый вызов читает первую строку, второй — следующую. Поэтому один-единственный раз написанный код каждый раз работает с новыми числами.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void room_area() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    int s = a * b;\n" +
      "    cout << s << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    room_area();\n" +
      "    room_area();\n" +
      "    return 0;\n" +
      "}",
    stdin: "6 5\n4 3",
    result: {
      kk: "«6 5» және «4 3» енгізгенде: алдымен 30, содан кейін 12 — әрқайсысы жеке жолда.",
      ru: "При вводе «6 5» и «4 3»: сначала 30, затем 12 — каждое на отдельной строке.",
    },
  },
  {
    /* The lesson's diagnostic core: definition is not execution. The two prints
       around the definition exist so the correct answer is a visible pair of
       words and not an empty string — an empty answer is indistinguishable, for
       a fourteen-year-old, from an exercise that failed to load. */
    id: "m3.l1.b3",
    type: "prediction",
    skillRefs: ["func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама нені шығарады? Әр шыққан сөз жеке жолда. Функцияның қай жерде шақырылатынына мұқият қара.",
      ru: "Что выведет эта программа? Каждое выведенное слово — на отдельной строке. Внимательно посмотри, где вызывается функция.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void greet() {\n" +
      '    cout << "hello" << endl;\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      '    cout << "start" << endl;\n' +
      '    cout << "end";\n' +
      "    return 0;\n" +
      "}",
    answer: "start\nend",
    options: ["start\nend", "start\nhello\nend", "hello\nstart\nend", "start\nend\nhello"],
    /* Only the middle distractor is mapped. "hello" first and "hello" last are
       both compatible with more than one belief — that a function runs where it
       is written, that it runs after the program, or simply that this one is
       called somewhere the learner did not look — so naming a cause for either
       would be telling a child something about their own thinking we cannot
       know. */
    diagnosticMapping: {
      "start\nhello\nend": {
        failureClass: "definition_treated_as_execution",
        justification:
          "`hello` сөзінің дәл `start` пен `end` арасында шығуының бір ғана себебі бар: функцияның жариялануы кәдімгі команда деп оқылып, дене өзі тұрған жерде орындалады деп ойлау. Бұл бағдарламада `greet()` деген шақыру мүлде жоқ, сондықтан дене бірде-бір рет жүрмейді.",
      },
    },
  },
  {
    id: "m3.l1.b4",
    type: "multiple_choice",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жолдар 1-ден 12-ге дейін нөмірленген (бос жолдар да саналады). Қай жол — функцияның анықтамасы, ал қай жол — оның шақырылуы?",
      ru: "Строки пронумерованы от 1 до 12 (пустые строки тоже считаются). Какая строка — определение функции, а какая — её вызов?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void show() {\n" +
      '    cout << "ok" << endl;\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    show();\n" +
      '    cout << "bye";\n' +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "4-жол — анықтама, 9-жол — шақыру", ru: "Строка 4 — определение, строка 9 — вызов" } },
      { id: "o2", label: { kk: "4-жол — анықтама, 5-жол — шақыру", ru: "Строка 4 — определение, строка 5 — вызов" } },
      { id: "o3", label: { kk: "9-жол — анықтама, 4-жол — шақыру", ru: "Строка 9 — определение, строка 4 — вызов" } },
      { id: "o4", label: { kk: "4-жол — анықтама, 10-жол — шақыру", ru: "Строка 4 — определение, строка 10 — вызов" } },
    ],
    correctOptionId: "o1",
    /* o4 carries no mapping: choosing `cout << "bye";` as the call can come from
       "every line with brackets is a call to something" and equally from "the
       last line must be the call", and those are different lessons to teach. */
    diagnosticMapping: {
      o2: {
        failureClass: "function_body_mistaken_for_call",
        justification:
          "5-жолды шақыру деп таңдау — функцияның денесін оның шақырылуы деп оқығанды білдіреді. Ол жол `{` мен `}` арасында тұр, яғни әлі функцияның ішінде; шақыру функциядан тыс, `main` ішінде тұрады.",
      },
      o3: {
        failureClass: "definition_and_call_inverted",
        justification:
          "Анықтама мен шақыруды орнымен ауыстыру — функцияны жариялайтын жолда оның ТҮРІ (`void`) тұратынын ескермеу. `show();` жолында түр жоқ және оның соңында нүктелі үтір тұр, ал 4-жолда `void` бар да, соңында `{` тұр — сондықтан рөлдер дәл керісінше.",
      },
    },
  },
  {
    /* The order here is unique, and that is checked by hand rather than assumed:
       `using namespace std;` cannot precede the include that brings `std` in,
       the whole function card can only stand above the `main` that calls it,
       `price();` must come before the `done` the prompt fixes as the last thing
       printed, and `return 0;` sits inside the braces it closes.

       In Python this reorder was five bare lines and the definition-above-call
       question did not exist — module-level order is free there. In C++ it is
       the task: put the function under `main` and the program does not build.
       That is why the function body is one card rather than four. The decision
       being measured is WHERE the definition goes, and splitting the body over
       four more cards would bury it under indentation-matching. */
    id: "m3.l1.b5",
    type: "reorder_code",
    skillRefs: ["func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бөліктерді дұрыс ретке қой. Бағдарлама `price` функциясын жариялауы керек: ол бір бүтін сан оқып, оның үш есесін шығарады. Содан кейін функция `main` ішінде бір рет шақырылады, ал ең соңында `done` сөзі шығады. Функцияның анықтамасы мен оны шақыратын `main` — екі бөлек бөлік: қайсысы бұрын тұруға тиіс екенін өзің шеш.",
      ru: "Расставь части по порядку. Программа должна объявить функцию `price`: она читает одно целое число и выводит его утроенное значение. Затем функция один раз вызывается внутри `main`, а в самом конце выводится слово `done`. Определение функции и `main`, который её вызывает, — две отдельные части: реши сам, какая из них должна стоять раньше.",
    },
    lines: [
      { id: "q1", code: "#include <iostream>" },
      { id: "q2", code: "using namespace std;" },
      {
        id: "q3",
        code: "void price() {\n    int n;\n    cin >> n;\n    cout << n * 3 << endl;\n}",
      },
      { id: "q4", code: "int main() {" },
      { id: "q5", code: "    price();" },
      { id: "q6", code: '    cout << "done";' },
      { id: "q7", code: "    return 0;" },
      { id: "q8", code: "}" },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
  },
  {
    id: "m3.l1.b6",
    type: "fill_blank",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция дұрыс жарияланып, екі рет шақырылуы керек. Үш орынды толтыр: функцияның түрі (ол ешқандай мән қайтармайды) және екі шақырудағы функцияның аты. Бағдарлама `****` жолын дәл екі рет шығаруы тиіс.",
      ru: "Функция должна быть правильно объявлена и вызвана дважды. Заполни три места: тип функции (она не возвращает никакого значения) и имя функции в двух вызовах. Программа должна вывести строку `****` ровно два раза.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "___ frame() {\n" +
      '    cout << "****" << endl;\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    ___();\n" +
      "    ___();\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "void" },
      { id: "f2", answer: "frame" },
      { id: "f3", answer: "frame" },
    ],
  },
  {
    /* «санның қасиетін тексеретін функция» — named verbatim in November's
       practice paragraph (p.8). Here the verdict is PRINTED, because returning a
       value is l3 and may not appear in a solution before it is taught — which
       in C++ is also why the function is `void`. The tokens are English and both
       prompts name them, so a Russian-track learner is reading the same problem
       and not matching glyphs. */
    id: "m3.l1.b7",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: ["func.define", "func.reuse", "arith.remainder", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Үш бүтін сан беріледі, әрқайсысы жеке жолда (−1000 ≤ сан ≤ 1000). Бір санды оқып, ол жұп болса `even`, тақ болса `odd` деп шығаратын функция жаз. Функция ешқандай мән қайтармайды, сондықтан оның түрі — `void`, ал өзі `main`-нен жоғары жазылады. Сол функцияны `main` ішінде үш рет шақыр. Әр жауап жеке жолда шығады, сөздер тура осылай ағылшынша жазылады: `even` және `odd`. Нөл — жұп сан.",
      ru: "Даны три целых числа, каждое на отдельной строке (−1000 ≤ число ≤ 1000). Напиши функцию, которая читает одно число и выводит `even`, если оно чётное, и `odd`, если нечётное. Функция не возвращает никакого значения, поэтому её тип — `void`, а сама она пишется выше `main`. Вызови эту функцию внутри `main` три раза. Каждый ответ — на отдельной строке, слова пишутся по-английски именно так: `even` и `odd`. Ноль — чётное число.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void check() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    if (x % 2 == 0) {\n" +
      '        cout << "even" << endl;\n' +
      "    } else {\n" +
      '        cout << "odd" << endl;\n' +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    check();\n" +
      "    check();\n" +
      "    check();\n" +
      "    return 0;\n" +
      "}",
    /* The visible case puts 0 in the open, where a learner who believes zero is
       neither even nor odd finds out with the sample in front of them — and it
       already kills a program that calls the function fewer than three times,
       because the second answer differs from the first. So the hidden cases are
       about the range the prompt promises rather than about the call count:
       the negative half of it, both of its ends, and zero again beside two
       negatives.

       C++ negatives were re-derived rather than carried over. `-3 % 2` is `-1`
       here and `1` in Python — the sign follows the dividend, not the divisor —
       but the test is `x % 2 == 0`, and `-1 == 0` and `1 == 0` are both false,
       so every expected answer in this set survives the change. That is a fact
       to check, not to assume: the same list under a test written as
       `x % 2 == 1` would have flipped three answers. */
    cases: [
      { input: "4\n7\n0", expectedOutput: "even\nodd\neven" },
      { input: "-3\n-8\n1", expectedOutput: "odd\neven\nodd", hidden: true },
      { input: "1000\n999\n-1000", expectedOutput: "even\nodd\neven", hidden: true },
      { input: "0\n-2\n-999", expectedOutput: "even\neven\nodd", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m3.l1.b8 — the same task, assembled instead of
       written. «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
       азырақ» (p.6). The three blanks are the three decisions the task is made
       of: the type of a function that returns nothing, how many repetitions the
       loop needs, and the name that is called inside it. The problem statement
       is repeated in full because this route never sees b8. */
    id: "m3.l1.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.reuse", "loops.for"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 20) — одан кейін неше сан келетінін көрсетеді. Келесі n жолда бір-бірден бүтін сан беріледі (0 ≤ сан ≤ 100). Әр санның квадратын жеке жолға шығару керек. Құрылымы дайын — үш орынды толтыр: ешқандай мән қайтармайтын функцияның түрі, циклдің неше рет қайталанатыны және цикл ішінде шақырылатын функцияның аты.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 20) — сколько чисел будет дальше. В следующих n строках дано по одному целому числу (0 ≤ число ≤ 100). Нужно вывести квадрат каждого числа на отдельной строке. Структура уже готова — заполни три места: тип функции, которая не возвращает никакого значения, сколько раз повторяется цикл и имя функции, которую вызываем внутри него.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "___ show() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << x * x << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = 0; i < ___; i++) {\n" +
      "        ___();\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "void" },
      { id: "f2", answer: "n" },
      { id: "f3", answer: "show" },
    ],
  },
  {
    id: "m3.l1.b8",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: ["func.define", "func.reuse", "loops.for"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 20) — одан кейін неше сан келетінін көрсетеді. Келесі n жолда бір-бірден бүтін сан беріледі (0 ≤ сан ≤ 100). Бір санды оқып, оның квадратын шығаратын `void` функциясын жаз, содан кейін сол функцияны `main` ішінде дәл n рет шақыр. Әр квадрат жеке жолда шығады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 20) — сколько чисел будет дальше. В следующих n строках дано по одному целому числу (0 ≤ число ≤ 100). Напиши `void`-функцию, которая читает одно число и выводит его квадрат, а затем вызови эту функцию внутри `main` ровно n раз. Каждый квадрат — на отдельной строке.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void show() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << x * x << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        show();\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    /* Both visible cases are chosen to fail loudly rather than subtly. «3 2 5 10»
       kills `x + x` and `x * 2` at the second number, in the open. «1 7» is the
       bottom of the stated bound and kills two wrong loops: `i < n - 1` prints
       nothing at all, and a program that calls the function a fixed three times
       reads past the end of the input — where `cin >> x` fails silently and
       leaves `x` at 0, so the program prints two extra zeroes rather than
       crashing. Either way the output is wrong, which is what the case is for.

       Across the five cases n takes 3, 1, 2, 4 and 5 — deliberately, so that no
       hard-coded number of calls passes the set. The remaining hidden work is
       the value range: 0 at the bottom and 100 at the top, both named by the
       prompt. 100 * 100 is 10000, comfortably inside `int`. */
    cases: [
      { input: "3\n2\n5\n10", expectedOutput: "4\n25\n100" },
      { input: "1\n7", expectedOutput: "49" },
      { input: "2\n0\n5", expectedOutput: "0\n25", hidden: true },
      { input: "4\n100\n0\n9\n12", expectedOutput: "10000\n0\n81\n144", hidden: true },
      { input: "5\n1\n2\n3\n4\n5", expectedOutput: "1\n4\n9\n16\n25", hidden: true },
    ],
  },
];
