import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша · Lesson 3 — «return» / «return». 8 min.
 *
 * PDF p.8 names the mechanism in November's mastery paragraph — «параметр беру
 * және return арқылы нәтиже қайтару» — and then says what the platform owes the
 * learner about it: «Платформа функция шақырылғанда қандай параметр мәндері
 * кіретінін, қандай жергілікті айнымалылар пайда болатынын және **return
 * кезінде не қайтатынын** визуалды көрсетеді». This lesson is the one that
 * answers the third clause, and the practice family it owns is the first item
 * of November's list: «цифрлар қосындысын функциямен есептеу».
 *
 * ## The one idea
 *
 * `cout` puts a value on the screen and hands nothing back. `return` hands the
 * value to whoever called the function. Only the second one can be used in an
 * expression — added, compared, fed back into the same function.
 *
 * That sentence is not hard to say and it is very hard to believe, because
 * October's programs ended in `cout` and nothing went wrong. So the lesson
 * makes the belief cost something four times before anyone writes a function:
 * b3 makes the learner watch a returned value vanish because nobody caught it,
 * b4 asks which of three functions can have 1 added to its result, b5 shows the
 * compiler refusing a `void` function that tries to return, and b6 shows a
 * function that returns before the loop it needs has run at all.
 *
 * ## What C++ replaced `None` with, and why the lesson is better for it
 *
 * The Python original spent two blocks on `None`: a function without `return`
 * hands back a value that prints as a word the learner has never seen, and the
 * whole difficulty was that this is silent and legal.
 *
 * C++ has no such value. A function that hands nothing back is declared `void`,
 * and the two failures that used to produce `None` split cleanly in two:
 *
 * - **Using a `void` result is a compile error.** `int y = show(5);` does not
 *   build, and neither does `cout << show(5);`. That is b5: the compiler
 *   names line 10 and line 16, and the line to fix is line 4, where `void`
 *   should have been `int`. Measured on both engines (see b5's own note).
 * - **Ignoring a returned value is silent.** `twice(5);` on a line of its own
 *   compiles, runs, computes 10 and throws it away. That is b3, and it is the
 *   half of the old `None` lesson that survives — the learner has to see that a
 *   `return` which nobody catches leaves no trace at all.
 *
 * The declared return type is the other new obligation, and it is the one the
 * whole month leans on: `int digit_sum(int n)` promises a number, so `return s;`
 * has to give one, and the caller may rely on it. That promise is exactly what
 * `void` refuses to make.
 *
 * ## The digit sum, four times, never twice the same way
 *
 * The lesson repeats one function on purpose — the PDF assigns it here — but
 * every appearance asks something the previous one did not: b2 puts two calls
 * in one expression, b5 breaks the declared type, b8 feeds the returned value
 * back into the same function until one digit is left, b9 puts it in a
 * comparison. b6 and b7 deliberately use different functions (a running total,
 * a digit COUNT) so that the two repair blocks are not one bug read twice.
 *
 * ## Left for later
 *
 * Nothing here says why `s` starts from 0 again on the second call — that is
 * `m3.l4`, and step 2 of the worked example states the fact without claiming to
 * explain it. Global state does not appear; the month's only sight of it is
 * `m3.l5`.
 */

const P = 8; // PDF page for all of November

export const M3_L3: LessonBlock[] = [
  {
    id: "m3.l3.b1",
    type: "concept",
    skillRefs: ["func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "return — нәтижені қайтарады, cout — экранға жазады",
      ru: "return — возвращает результат, cout — пишет на экран",
    },
    /* The body has to make the difference OPERATIONAL, not verbal: "hands the
       value back" means nothing until the learner sees that one of the two
       calls below can have `+ 1` written after it and the other cannot. So the
       snippet defines both functions over the same arithmetic and the last
       line is the test. The declared type is what makes the difference visible
       before the program runs: `void` in the header is a promise that there
       will be nothing to add 1 to. */
    body: {
      kk: "`cout` мәнді экранға жазады және оны ешкімге бермейді: жазылып болған соң мән жоғалады. `return` басқаша істейді — мәнді функцияны ШАҚЫРҒАН жерге қайтарады. Сол жерде оны айнымалыға сақтауға, басқа санмен қосуға, салыстыруға болады. C++-та бұл айырмашылық функцияның бірінші жолында-ақ көрініп тұрады: қайтаратын мәннің ТҮРІ ат алдында жазылады. `int twice(int x)` — «мен бір `int` қайтарамын» дегені, ал `void show_double(int x)` — «мен ешнәрсе қайтармаймын» дегені. Түрі `int` болса, функцияның әр жолы `return`-мен аяқталуы керек: `return` жазылмаған жол бағдарламаны бұзады. Демек айырмашылық сөзде емес: төмендегі `twice(5)` шақыруының жанына `+ 1` жазуға болады, ал `show_double(5)` шақыруының жанына жазуға болмайды — компилятор оны қабылдамайды, себебі қосатын ешқандай сан жоқ.",
      ru: "`cout` пишет значение на экран и никому его не отдаёт: после вывода значение пропадает. `return` поступает иначе — он возвращает значение туда, где функцию ВЫЗВАЛИ. Там его можно сохранить в переменную, прибавить к другому числу, сравнить. В C++ эта разница видна уже в первой строке функции: ТИП возвращаемого значения пишут перед именем. `int twice(int x)` означает «я возвращаю одно число типа `int`», а `void show_double(int x)` — «я не возвращаю ничего». Если тип `int`, то каждый путь функции должен заканчиваться `return`: путь без него ломает программу. Значит, разница не в словах: к вызову `twice(5)` ниже можно приписать `+ 1`, а к вызову `show_double(5)` приписать нельзя — компилятор это не примет, потому что прибавлять там не к чему.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void show_double(int x) {\n" +
      "    cout << x * 2 << endl;\n" +
      "}\n" +
      "\n" +
      "int twice(int x) {\n" +
      "    return x * 2;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    show_double(5);\n" +
      "    cout << twice(5) + 1 << endl;\n" +
      "    return 0;\n" +
      "}\n" +
      "\n" +
      "// 10\n" +
      "// 11",
  },
  {
    /*
     * WORKED EXAMPLE #3 of the month's six (PDF p.8: «алты толық талданған
     * мысал»), and the November practice family «цифрлар қосындысын функциямен
     * есептеу».
     *
     * October already wrote this loop, twice — so the reasoning steps below
     * spend no time on `% 10` and `/ 10` and all of their time on the three
     * decisions that are new: the function's declared type is `int`, the result
     * leaves through `return`, and one expression may contain two calls whose
     * local variables never meet.
     *
     * Step 5 does NOT claim which of the two calls runs first, and that is not
     * vagueness. C++17 leaves the order of evaluation of `+`'s operands
     * unspecified, so a step that said «алдымен сол жақтағы шақыру орындалады»
     * would be teaching a fact about this compiler rather than about the
     * language. Both calls happen, each returns its own number, and the sum is
     * the same either way because neither call changes anything the other can
     * see — which is itself the property the next lesson is about.
     */
    id: "m3.l3.b2",
    type: "worked_example",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: цифрлар қосындысы — функция түрінде",
      ru: "Разобранный пример: сумма цифр как функция",
    },
    problem: {
      kk: "Бір жолда екі бүтін сан a және b беріледі (0 ≤ a, b ≤ 1 000 000 000). Олардың цифрлар қосындыларын өзара қосып, бір сан шығар. Мысалы, «407 23» берілсе, 11 + 5 = 16, жауап 16.",
      ru: "В одной строке даны два целых числа a и b (0 ≤ a, b ≤ 1 000 000 000). Сложи их суммы цифр между собой и выведи одно число. Например, для «407 23» получаем 11 + 5 = 16, ответ 16.",
    },
    steps: [
      {
        kk: "Цифрларды бір-бірлеп қосу циклін қазанда жазғанбыз. Мұндағы жаңа нәрсе — сол циклді екі рет көшіріп жазбау: бір рет функция етіп жазып, екі рет шақырамыз.",
        ru: "Цикл, который складывает цифры по одной, мы писали в октябре. Новое здесь другое — не переписывать этот цикл дважды: пишем его один раз как функцию и вызываем два раза.",
      },
      {
        kk: "Функцияның тақырыбы — `int digit_sum(int n)`. Бірінші `int` — қайтаратын мәннің түрі, яғни «мен бір бүтін сан беремін» деген уәде. Екінші `int` — параметрдің түрі. `n` мәні 1 000 000 000-ға дейін жетеді, ал бұл `int`-тің шегінен (2 147 483 647) аспайды, сондықтан осы түр жеткілікті.",
        ru: "Заголовок функции — `int digit_sum(int n)`. Первый `int` — тип возвращаемого значения, то есть обещание «я отдам одно целое число». Второй `int` — тип параметра. Значение `n` доходит до 1 000 000 000, а это меньше предела `int` (2 147 483 647), поэтому такого типа достаточно.",
      },
      {
        kk: "Функцияның ішінде `s` жинақтаушысы бар. Ол — функцияның өз айнымалысы: `digit_sum(a)` аяқталған соң жоғалады, ал `digit_sum(b)` шақырылғанда `s` қайтадан 0-ден басталады. Сондықтан екі шақыру бір-біріне кедергі жасамайды. Мұның НЕГЕ солай екенін келесі сабақта талдаймыз.",
        ru: "Внутри функции есть накопитель `s`. Это её собственная переменная: после завершения `digit_sum(a)` переменная `s` исчезает, а при вызове `digit_sum(b)` она снова начинается с 0. Поэтому два вызова не мешают друг другу. ПОЧЕМУ это так — разберём на следующем уроке.",
      },
      {
        kk: "Циклден кейін `cout << s;` жазсақ, сан экранға кетеді де, қосатын ештеңе қалмайды. Сондықтан `return s;` жазамыз: сан функцияны шақырған жерге барады. `return` — функцияның соңғы қадамы: ол орындалған сәтте функция бірден тоқтайды, сондықтан оны цикл БІТКЕННЕН КЕЙІН жазамыз. Циклдің ішіне жазсақ, ол бірінші цифрдан кейін-ақ тоқтап қалады.",
        ru: "Если после цикла написать `cout << s;`, число уйдёт на экран и складывать будет нечего. Поэтому пишем `return s;`: число уходит туда, откуда функцию вызвали. `return` — последний шаг функции: в момент его выполнения функция сразу останавливается, поэтому пишем его ПОСЛЕ того, как цикл закончился. Если написать его внутри цикла, функция остановится уже после первой цифры.",
      },
      {
        kk: "Соңғы жол екі шақыруды бір өрнекке қояды: `digit_sum(a) + digit_sum(b)`. Екі шақыру да орындалады, әрқайсысы өз санын қайтарады — 11 және 5 — содан кейін осы екі сан қосылады. Қайсысының бұрын орындалатыны маңызды емес: бірде-бір шақыру екіншісі көретін ештеңені өзгертпейді. `cout` бір-ақ рет, дайын нәтижеге жазылады.",
        ru: "Последняя строка ставит два вызова в одно выражение: `digit_sum(a) + digit_sum(b)`. Оба вызова выполняются, каждый возвращает своё число — 11 и 5 — и уже эти два числа складываются. Какой из них выполнится раньше, неважно: ни один вызов не меняет ничего, что видит другой. `cout` пишется один раз — для готового результата.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    cout << digit_sum(a) + digit_sum(b) << endl;\n" +
      "    return 0;\n" +
      "}",
    stdin: "407 23",
    result: {
      kk: "«407 23» енгізгенде: 16",
      ru: "При вводе «407 23»: 16",
    },
  },
  {
    /*
     * The block that replaces the `None` prediction, and it asks the half of
     * that lesson C++ keeps: a value that comes back and is not caught leaves
     * no trace. `twice(5);` on a line of its own is legal, computes 10, and
     * throws it away — no output, no warning, no error.
     *
     * The two prints around it exist for the same reason they do in m3.l1.b3:
     * the correct answer is a visible pair of words rather than an empty
     * string, which a fourteen-year-old cannot tell apart from a broken card.
     *
     * Only the middle distractor is mapped. "10" first and "10" last are each
     * compatible with more than one belief — that a call prints before the
     * program starts, that it prints at the end — and neither establishes one
     * cause.
     */
    id: "m3.l3.b3",
    type: "prediction",
    skillRefs: ["func.return", "func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама нені шығарады? `twice` функциясы жеке жолда шақырылған, ал оның қайтарған мәні ешқайда жазылмаған. Әр шыққан мән жеке жолда.",
      ru: "Что выведет эта программа? Функция `twice` вызвана в отдельной строке, а возвращённое ею значение никуда не записано. Каждое выведенное значение — на отдельной строке.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int twice(int x) {\n" +
      "    return x * 2;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      '    cout << "start" << endl;\n' +
      "    twice(5);\n" +
      '    cout << "end";\n' +
      "    return 0;\n" +
      "}",
    answer: "start\nend",
    options: ["start\nend", "start\n10\nend", "10\nstart\nend", "start\nend\n10"],
    diagnosticMapping: {
      "start\n10\nend": {
        failureClass: "return_mistaken_for_print",
        justification:
          "10 санының дәл `start` пен `end` арасында шығуының бір ғана себебі бар: `return` мәнді экранға да жазады деп ойлау. `return` мәнді тек шақырған жерге береді, ал мұнда оны ешкім ұстап алмаған — `twice(5);` жолы санды есептеп, содан кейін оны жоғалтады.",
      },
    },
  },
  {
    /*
     * The same idea as b3, asked from the other side: not "what comes out" but
     * "which one may be used in an expression". Three functions over identical
     * arithmetic, so the only thing separating them is the header and the last
     * line of each.
     *
     * `f3` is the version that computes the value and drops it — the belief
     * that the last expression comes back on its own, which a learner coming
     * from a calculator holds without ever having said it out loud. In C++ it
     * has to be declared `void` as well: a function whose header promises an
     * `int` and never returns one is not a slower wrong answer, it is undefined
     * behaviour, and a card that showed one would be teaching a program the
     * language refuses to define.
     *
     * `main` is present and empty because a C++ program needs one; the comment
     * inside it is where the question is asked, in the code the learner is
     * looking at.
     *
     * o4 ("all three") carries no mapping: a learner reaches it by not reading
     * the headers at all, and also by thinking every call has SOME result, and
     * those are not the same mistake.
     */
    id: "m3.l3.b4",
    type: "multiple_choice",
    skillRefs: ["func.return", "func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "`main` ішінде `cout << f(3) + 1;` деп жазғымыз келеді. Осы үш функцияның қайсысын `f`-тің орнына қоюға болады — яғни қайсысының нәтижесіне 1 қосуға болады?",
      ru: "Внутри `main` мы хотим написать `cout << f(3) + 1;`. Какую из этих трёх функций можно подставить вместо `f` — то есть к результату какой из них можно прибавить 1?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void f1(int x) {\n" +
      "    cout << x + 10 << endl;\n" +
      "}\n" +
      "\n" +
      "int f2(int x) {\n" +
      "    return x + 10;\n" +
      "}\n" +
      "\n" +
      "void f3(int x) {\n" +
      "    int r = x + 10;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    // cout << f(3) + 1;\n" +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "f1 функциясы", ru: "Функция f1" } },
      { id: "o2", label: { kk: "f2 функциясы", ru: "Функция f2" } },
      { id: "o3", label: { kk: "f3 функциясы", ru: "Функция f3" } },
      { id: "o4", label: { kk: "Үшеуі де жарайды", ru: "Подходят все три" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "print_mistaken_for_return",
        justification:
          "f1-ді таңдау — экранға жазу мен шақырған жерге беруді бір нәрсе деп санау. f1 санды экранға шығарады, бірақ түрі `void`, яғни шақырған жерге ештеңе бермейді, сондықтан оның қасына `+ 1` жазуға болмайды — компилятор мұны қабылдамайды.",
      },
      o3: {
        failureClass: "value_computed_but_not_returned",
        justification:
          "f3-те `x + 10` есептеліп, `r` айнымалысына жазылады, бірақ ешқайда жіберілмейді, әрі функцияның түрі — `void`. Бұл жауап оқушының соңғы есептелген өрнек өздігінен қайтады деп ойлайтынын көрсетеді — C++-та олай емес, қайтару тек `return` арқылы болады.",
      },
    },
  },
  {
    /*
     * The declared type, broken — and the reason this block exists in exactly
     * this shape is that it is the C++ error a beginner meets on their first
     * function with a result. The body is right, the caller is right, and the
     * ONE word that is wrong is `void` on line 4.
     *
     * The compiler names lines the learner must not fix. MEASURED on both
     * engines rather than assumed — the claim in this comment used to be
     * inherited from m1.l1.b4, whose own version of it turned out to be false:
     *
     *   Clang 17 -fsyntax-only:
     *     :10:5:  error: void function 'digit_sum' should not return a value
     *     :16:10: error: invalid operands to binary expression ('ostream' and 'void')
     *   GCC 14.1 (Judge0 id 105, live):
     *     main.cpp:10:12: error: return-statement with a value, in function returning 'void'
     *     main.cpp:16:10: error: no match for 'operator<<' ... and 'void')
     *
     * Both engines name 10 and 16, so the prompt's two numbers are true of
     * whichever one the learner reached. Neither line is the defect: `buggyLine`
     * is 4, and the prompt says the compiler's numbers out loud so the learner
     * practises distrusting them.
     *
     * No `symptomInput` is declared: the buggy program does not compile, so the
     * gate's first tier — the two programs disagree about whether they build at
     * all — is the whole of the evidence and no input can add to it.
     */
    id: "m3.l3.b5",
    type: "find_bug",
    skillRefs: ["func.return", "func.define", "loops.while", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама тіпті іске қосылмайды. Компилятор екі жерге шағымданады: 10-жолда «void функциясы мән қайтармауы керек» дейді, 16-жолда `cout`-қа беретін ештеңе жоқ дейді. Функцияның денесі де, шақыру да дұрыс жазылған. Шын мәнінде қай жол жөнделуі керек?",
      ru: "Эта программа даже не запускается. Компилятор жалуется в двух местах: в строке 10 — «void-функция не должна возвращать значение», в строке 16 — что выводить в `cout` нечего. И тело функции, и вызов написаны верно. Какую строку на самом деле нужно исправить?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << digit_sum(x) << endl;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 4,
    fixedCode:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << digit_sum(x) << endl;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "10": {
        failureClass: "compiler_line_taken_at_face_value",
        justification:
          "10-жолды таңдау — компилятордың нөмірін сол күйінде қабылдағаны. Ол жол дұрыс: цифрлар қосындысы дәл сол жерде қайтарылуы керек. Қате — функцияның бірінші жолында тұрған `void` сөзі: ол «мен ешнәрсе қайтармаймын» деп уәде береді де, 10-жолды өтірікке айналдырады.",
      },
    },
  },
  {
    /*
     * The second half of the lesson's objective: code after `return` does not
     * run. Written as the mistake it actually is — the learner declares what
     * the function will return immediately after creating the accumulator,
     * because `return` reads like a promise rather than an exit.
     *
     * This one compiles, and that is the point of putting it next to b5: the
     * previous card was a build failure and this one is a wrong number, so the
     * learner meets both kinds of evidence in the same lesson.
     *
     * A different function from b5 on purpose: this is a running total, so the
     * two repair blocks are two bugs and not one bug read twice.
     *
     * No diagnostic mapping. Line 5 is reached both by "the accumulator should
     * start at 1" and by "the answer equals the starting value, so the starting
     * value is wrong", and line 7 by any of the loop-bound off-by-one hunts
     * October drilled. Neither answer names one cause, so the engine asks
     * instead of telling.
     */
    id: "m3.l3.b6",
    type: "find_bug",
    skillRefs: ["func.return", "func.define", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция 1-ден n-ге дейінгі сандардың қосындысын қайтаруға тиіс. Бағдарлама компиляциядан өтеді, бірақ n = 5 болғанда 15-тің орнына 0 шығарады. Қате қай жолда және неге циклдің мүлде орындалмағанын ойлан.",
      ru: "Функция должна возвращать сумму чисел от 1 до n. Программа компилируется, но при n = 5 выводит 0 вместо 15. В какой строке ошибка и почему цикл вообще не выполнился?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int sum_to(int n) {\n" +
      "    int s = 0;\n" +
      "    return s;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s = s + i;\n" +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    cout << sum_to(n) << endl;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 6,
    symptomInput: "5",
    fixedCode:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int sum_to(int n) {\n" +
      "    int s = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        s = s + i;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    cout << sum_to(n) << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Assembly, not authorship — and the third blank is the point. Two returned
     * values are being added to each other on the last line, so the learner
     * cannot fill in `return` as a word they copied without also deciding what
     * the caller does with what came back.
     *
     * A digit COUNT rather than a digit sum, so the fill-blank is not the
     * worked example with holes punched in it. The function's declared type is
     * given: `int` is the only answer that could stand there, so a blank on it
     * would be a word to copy rather than a decision.
     */
    id: "m3.l3.b7",
    type: "fill_blank",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция санның цифр САНЫН экранға шығармай, қайтаруға тиіс. Соңғы жол 407 және 25 сандарындағы цифрлардың ЖАЛПЫ санын шығарады. Үш бос орынды толтыр.",
      ru: "Функция должна не выводить, а ВОЗВРАЩАТЬ количество цифр числа. Последняя строка выводит ОБЩЕЕ количество цифр в числах 407 и 25. Заполни три пропуска.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_count(int n) {\n" +
      "    int c = 0;\n" +
      "    while (n > 0) {\n" +
      "        c = c + 1;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    ___ ___;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << digit_count(407) ___ digit_count(25) << endl;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "return" },
      { id: "f2", answer: "c" },
      { id: "f3", answer: "+" },
    ],
  },
  {
    /*
     * PDF p.8, first practice family: «цифрлар қосындысын функциямен есептеу».
     *
     * The loop that repeats the function is what makes this a `return` task and
     * not an October task: the value that comes back goes straight in as the
     * next argument, which is impossible for a `void` function that prints. Two
     * rounds are genuinely needed — 19 → 10 → 1 — so a solution that applies
     * the function once is killed by a hidden case rather than by a warning.
     *
     * The bound is 1 000 000 000, which is inside `int` (2 147 483 647), so the
     * task needs no `long long` and none of the cases can overflow. That is a
     * bound to check rather than inherit: Python had no reason to care.
     *
     * The cases, and what each kills:
     *   999   the prompt's own example, one round of work
     *   5     already a single digit, the loop body never runs
     *   0     kills a do-while shape: `while (n > 0)` here never terminates
     *   9     the exact boundary; `while (n >= 9)` hangs on it and times out
     *   19    kills "apply the function once" — 10 is not a single digit
     *   10    the smallest two-digit number
     *   999999999 / 1000000000  the stated maximum, both directions
     */
    id: "m3.l3.b8",
    type: "write_code",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бүтін сан n беріледі (0 ≤ n ≤ 1 000 000 000). Санның цифрлар қосындысын ҚАЙТАРАТЫН функция жаз — түрі `int`, ішінде `cout` жоқ. Сан 9-дан үлкен болса, сол функцияны шыққан нәтижеге қайта қолдана бер — бір таңбалы сан қалғанша. Сол таңбаны шығар. Мысалы: 999 → 27 → 9, жауап 9. n = 5 үшін жауап 5, n = 0 үшін жауап 0.",
      ru: "Дано целое число n (0 ≤ n ≤ 1 000 000 000). Напиши функцию, которая ВОЗВРАЩАЕТ сумму цифр числа — её тип `int`, внутри нет `cout`. Пока число больше 9, применяй эту функцию к полученному результату снова — пока не останется одна цифра. Её и выведи. Например: 999 → 27 → 9, ответ 9. При n = 5 ответ 5, при n = 0 ответ 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    while (n > 9) {\n" +
      "        n = digit_sum(n);\n" +
      "    }\n" +
      "    cout << n << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "999", expectedOutput: "9" },
      { input: "5", expectedOutput: "5" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "9", expectedOutput: "9", hidden: true },
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "19", expectedOutput: "1", hidden: true },
      { input: "999999999", expectedOutput: "9", hidden: true },
      { input: "1000000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * The lesson's independent task: what came back out of the function goes
     * into a comparison. The numbers are chosen so that comparing a and b
     * themselves — the shortcut a learner reaches for when they have not
     * actually used the returned values — fails on visible case 2 and on two
     * hidden ones.
     *
     * Output tokens are English and both prompts name all three, because a
     * program's output is one string for both language tracks and a Kazakh word
     * on screen would let a Russian-track learner match glyphs instead of
     * reasoning.
     *
     * Cases, and what each kills:
     *   407 23         plain "first"
     *   12 30          3 vs 3 → equal, and 12 < 30 kills comparing the numbers
     *   5 91           5 vs 10 → second, while 5 < 91 agrees — the case that
     *                  makes the number-comparison shortcut look right
     *   999999999 1000000000  81 vs 1 → first, though a < b
     *   1000000000 100 1 vs 1 → equal, though a is a billion
     *   0 0            both zero, the loop never runs on either
     *   0 1            0 vs 1 → second, the smallest real difference
     *   19 91          10 vs 10 → equal on two different numbers
     *
     * `product-authored`, not `curriculum-derived`, and the distinction is not
     * a formality: p.8 names the digit-sum FUNCTION as a practice family, which
     * b8 is, but nothing in the programme asks for two numbers to be compared
     * by their digit sums. That framing is invented to serve this lesson's
     * objective, so the field says so and a later reader can check.
     */
    id: "m3.l3.b9",
    type: "write_code",
    skillRefs: ["func.return", "func.define", "func.reuse", "compare.operators", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда екі бүтін сан a және b беріледі (0 ≤ a, b ≤ 1 000 000 000). Санның цифрлар қосындысын қайтаратын функция жаз, оны екі санға да қолдан және цифрлар қосындысы қайсысында үлкен екенін анықта. a-да үлкен болса `first`, b-да үлкен болса `second`, тең болса `equal` деп шығар (тек осы үш ағылшын сөзінің бірі).",
      ru: "В одной строке даны два целых числа a и b (0 ≤ a, b ≤ 1 000 000 000). Напиши функцию, которая возвращает сумму цифр числа, примени её к обоим числам и определи, у какого из них сумма цифр больше. Выведи `first`, если больше у a, `second`, если больше у b, и `equal`, если суммы равны (ровно одно из этих трёх английских слов).",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    int x = digit_sum(a);\n" +
      "    int y = digit_sum(b);\n" +
      "    if (x > y) {\n" +
      '        cout << "first" << endl;\n' +
      "    } else if (x < y) {\n" +
      '        cout << "second" << endl;\n' +
      "    } else {\n" +
      '        cout << "equal" << endl;\n' +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "407 23", expectedOutput: "first" },
      { input: "12 30", expectedOutput: "equal" },
      { input: "5 91", expectedOutput: "second", hidden: true },
      { input: "999999999 1000000000", expectedOutput: "first", hidden: true },
      { input: "1000000000 100", expectedOutput: "equal", hidden: true },
      { input: "0 0", expectedOutput: "equal", hidden: true },
      { input: "0 1", expectedOutput: "second", hidden: true },
      { input: "19 91", expectedOutput: "equal", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b9 — the same problem, the same cases, entered
     * through a different door. PDF p.6: «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ».
     *
     * What is given away is what b9 does not measure: the digit-sum function
     * and the reading line, both already written twice in this lesson. What is
     * left to do is the whole point of the block — take the two values that
     * came back out of the calls and put them into a comparison instead of into
     * two `cout`s. A support learner meets the same idea, not a smaller one.
     */
    id: "m3.l3.b9s",
    type: "modify_code",
    skillRefs: ["func.return", "func.reuse", "compare.operators", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама екі санның цифрлар қосындысын екі жолға бөлек шығарады. Оны цифрлар қосындысы қайсысында үлкен екенін жазатындай өзгерт: a-да үлкен болса `first`, b-да үлкен болса `second`, тең болса `equal` (тек бір ағылшын сөзі). `digit_sum` функциясын өзгертудің қажеті жоқ — оның қайтарған мәндерін салыстыру керек.",
      ru: "Эта программа выводит суммы цифр двух чисел двумя отдельными строками. Измени её так, чтобы она писала, у какого числа сумма цифр больше: `first`, если у a, `second`, если у b, и `equal`, если суммы равны (ровно одно английское слово). Функцию `digit_sum` менять не нужно — нужно сравнить значения, которые она вернула.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    cout << digit_sum(a) << endl;\n" +
      "    cout << digit_sum(b) << endl;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    int x = digit_sum(a);\n" +
      "    int y = digit_sum(b);\n" +
      "    if (x > y) {\n" +
      '        cout << "first" << endl;\n' +
      "    } else if (x < y) {\n" +
      '        cout << "second" << endl;\n' +
      "    } else {\n" +
      '        cout << "equal" << endl;\n' +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "407 23", expectedOutput: "first" },
      { input: "12 30", expectedOutput: "equal" },
      { input: "5 91", expectedOutput: "second", hidden: true },
      { input: "1000000000 100", expectedOutput: "equal", hidden: true },
      { input: "0 0", expectedOutput: "equal", hidden: true },
      { input: "19 91", expectedOutput: "equal", hidden: true },
    ],
  },
];
