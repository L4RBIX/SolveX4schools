import type { LessonBlock } from "../../types";

/**
 * m3.l5 · Функциядағы қателер — the three ways a function fails quietly.
 *
 * PDF p.8 names this lesson's material twice, and both times as a question the
 * platform must answer, not as a technique to teach:
 *
 *   «Арнайы бөлімде "неге бұл айнымалы мұнда көрінбейді?" және "неге global
 *    күтпеген нәтиже берді?" деген қателер талданады.»
 *
 * and, in the practice list, «жергілікті және жаһандық айнымалы қатесін тауып
 * түзету». The monthly check adds the written half: «жаһандық айнымалыны
 * қолданудың бір тәуекелін атайды».
 *
 * ## The one thing C++ made worse, and it is this lesson's subject
 *
 * Python needed a keyword. `global total` had to be typed, on its own line,
 * before a function could write to a module-level name — so the hazard at least
 * announced itself, and the programme's question «неге global күтпеген нәтиже
 * берді?» could be asked about a word on screen.
 *
 * C++ has no such word. A function assigns to a namespace-scope variable with
 * `total = total + x;` and nothing marks it. The line is indistinguishable from
 * an assignment to a local, and the only way to tell is to go and look at where
 * `total` was declared. That makes the failure quieter here than it was in
 * Python, and it is why this lesson is worth its minutes.
 *
 * The prompts say so out loud rather than leaving it implied, and the repair is
 * unchanged: the value the function needs comes in as a parameter, the value it
 * produces goes out through `return`.
 *
 * Three decisions taken once here.
 *
 * 1. **Namespace-scope mutable state appears in this lesson and nowhere else in
 *    the year, and every time it appears it is the thing that goes wrong.** The
 *    month file's header states the rule; this is the file it applies to. No
 *    reference solution below writes to a variable declared outside a function,
 *    and the two programs that do — m3.l5.b2's first version and m3.l5.b6's
 *    broken program — are both shown printing a wrong answer with no error
 *    message. A learner who leaves this lesson able to write a shared counter
 *    and unable to say why they should not has read the syntax and missed the
 *    lesson.
 *
 * 2. **Every failure here is silent.** None of the three fails to compile: the
 *    discarded return computes a number and drops it, the ignored parameter
 *    returns a plausible count, and the shared counter returns a count that is
 *    right the first time. That is the whole difficulty and it is why the
 *    lesson is a lesson — a compile error teaches itself, and m3.l3.b5 and
 *    m3.l4.b5 are where the month meets those. So each task states the symptom
 *    in numbers the learner can check («21, ал күткеніміз 42», «3 пен 3, ал
 *    дұрысы 3 пен 0», «10 және 20») rather than saying "this program is
 *    broken".
 *
 * 3. **The repair is always the same move, and it is named every time:** make
 *    the hidden connection visible. The value the function needs comes in as a
 *    parameter, the value it produces goes out through `return`, and the call
 *    line then says out loud what the function starts from. m3.l5.b7 is that
 *    move performed on a working program, so the learner meets it once where
 *    nothing is broken and the output must not change.
 *
 * Left to m3.l6 and m3.l7 deliberately: choosing WHICH functions a problem
 * should be split into. This lesson repairs a split that already exists.
 */
export const M3_L5: LessonBlock[] = [
  {
    id: "m3.l5.b1",
    type: "concept",
    skillRefs: ["func.return", "scope.local_global"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Үнсіз бұзылатын үш жағдай",
      ru: "Три поломки, которые ничего о себе не сообщают",
    },
    /* All three failures in one block on purpose: the learner must learn to ask
       "which of the three is this?", and a lesson that meets them one at a time
       across three sessions never asks that question. The code shows only the
       first — it is the shortest, and it is the one that looks most like a
       working program — while the other two are quoted inline because their
       broken programs are the subject of b5 and b6, where they get room to run. */
    body: {
      kk: "Функциямен жұмыс істегенде үш қате жиі кездеседі. Үшеуінің де ортақ қасиеті бар: бағдарлама компиляциядан өтеді, ешқандай қате хабары шықпайды, экранға ақылға қонымды сан шығады — тек ол сан дұрыс емес.\n\nБірінші: функция мәнді дұрыс қайтарады, бірақ шақырған жер оны ұстап алмайды. `sum_to(4);` деп жеке жолға жазсаң, функция 10-ды есептейді де, сол сан ешқайда жазылмағандықтан жоғалып кетеді. Компилятор үндемейді, ал экранға ештеңе шықпайды. Мәнді сақтау керек: `int answer = sum_to(4);`.\n\nЕкінші: функцияда параметр бар, бірақ дене ішінде сол параметрдің орнына функциядан тыс жарияланған айнымалы қолданылған. `int n = 5;` деп жазылып, функция `int square(int k) { return n * n; }` болса, `square(3)` 9 емес, 25 береді: параметр есептеуге мүлде қатыспайды.\n\nҮшінші: функция функциядан тыс жарияланған айнымалыны өзгертеді. C++-та бұл үшін ешқандай қосымша сөз керек емес — `total = total + x;` жолы жергілікті айнымалыға жазудан сырттай еш айырмасы жоқ. Сонда функцияның жауабы тек аргументтерінен емес, бағдарламада бұрын не болғанынан да тәуелді болады: екінші шақыру бірінші шақырудың қалдығынан басталады.",
      ru: "При работе с функциями чаще всего встречаются три ошибки. У всех трёх есть общее свойство: программа компилируется, сообщения об ошибке нет, на экран выходит правдоподобное число — просто неверное.\n\nПервая: функция возвращает значение правильно, но место вызова его не подхватывает. Если написать `sum_to(4);` отдельной строкой, функция вычислит 10, и это число, никуда не записанное, просто пропадёт. Компилятор промолчит, а на экран ничего не выйдет. Значение нужно сохранить: `int answer = sum_to(4);`.\n\nВторая: у функции есть параметр, но в теле вместо него используется переменная, объявленная снаружи. Если написано `int n = 5;`, а функция выглядит как `int square(int k) { return n * n; }`, то `square(3)` вернёт 25, а не 9: параметр в вычислении не участвует вообще.\n\nТретья: функция меняет переменную, объявленную вне функций. В C++ для этого не нужно никакого дополнительного слова — строка `total = total + x;` внешне ничем не отличается от записи в локальную переменную. Тогда ответ функции зависит не только от аргументов, но и от того, что происходило в программе раньше: второй вызов начинается с остатка от первого.",
    },
    code:
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
      "    sum_to(4);\n" +
      '    cout << "done" << endl;\n' +
      "    return 0;\n" +
      "}\n" +
      "\n" +
      "// done",
  },
  {
    /* Worked example #5 of the six the PDF requires this month. Both versions
       are in one program so the five printed lines sit under each other on the
       same screen: the same two calls, the same two lists, one version wrong.
       Describing the broken run in prose instead would ask the learner to
       believe a claim about C++ rather than read it. */
    id: "m3.l5.b2",
    type: "worked_example",
    skillRefs: ["scope.local_global", "func.return", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: санағыш функциядан тыс тұрса",
      ru: "Разобранный пример: счётчик, который живёт вне функции",
    },
    problem: {
      kk: "Екі тізім берілген: {1, 2, 3, 4} және {5, 6, 7}. Әрқайсысындағы жұп сандардың санын шығару керек. Дұрыс жауаптар — 2 және 1. Бірінші нұсқада санағыш `seen` барлық функциядан тыс тұр және функцияның ішінде өзгереді; ол екінші тізім үшін 1 емес, 3 береді. Неге, және оны қалай түзетеміз?",
      ru: "Даны два списка: {1, 2, 3, 4} и {5, 6, 7}. Нужно вывести, сколько чётных чисел в каждом. Правильные ответы — 2 и 1. В первой версии счётчик `seen` объявлен вне всех функций и меняется внутри функции; для второго списка он даёт 3, а не 1. Почему, и как это исправить?",
    },
    steps: [
      {
        kk: "`int seen = 0;` жолы барлық функциядан тыс тұр, сондықтан ол бағдарлама басталғанда бір-ақ рет орындалады. Функцияға кірген сайын `seen` қайта нөлденбейді — ол бүкіл жұмыс бойы бір ғана дана болып қалады.",
        ru: "Строка `int seen = 0;` стоит вне всех функций, поэтому она выполняется ровно один раз, при запуске программы. При каждом входе в функцию `seen` не обнуляется — он остаётся одним и тем же на всё время работы.",
      },
      {
        kk: "Назар сал: `count_even_global` ішінде `seen`-ді өзгерту үшін ешқандай ерекше сөз жазылмаған. `seen = seen + 1;` жолы жергілікті айнымалыға жазудан сырттай еш айырмасы жоқ — қайсысы екенін білу үшін `seen` қай жерде жарияланғанын барып қарау керек.",
        ru: "Обрати внимание: внутри `count_even_global` нет никакого особого слова, разрешающего менять `seen`. Строка `seen = seen + 1;` внешне ничем не отличается от записи в локальную переменную — чтобы понять, какая это, нужно пойти и посмотреть, где `seen` объявлена.",
      },
      {
        kk: "Бірінші шақыру {1, 2, 3, 4} тізімінен 2 мен 4-ті табады: `seen` 0-ден 2-ге көтеріледі, функция 2-ні қайтарады. Осы жерге дейін бәрі дұрыс, әрі қате жасырынып қалады — дұрыс жауап адамды тыныштандырады.",
        ru: "Первый вызов находит в {1, 2, 3, 4} числа 2 и 4: `seen` поднимается с 0 до 2, функция возвращает 2. До этого места всё верно, и ошибка прячется — правильный ответ усыпляет внимание.",
      },
      {
        kk: "Екінші шақыру {5, 6, 7} тізімін алады. Онда бір ғана жұп сан бар — 6. Бірақ `seen` нөлден емес, 2-ден басталады, сондықтан ол 3 болады да, функция 3-ті қайтарады. Экрандағы 3 — қате жауап, ал ешқандай қате хабары жоқ.",
        ru: "Второй вызов получает список {5, 6, 7}. В нём одно чётное число — 6. Но `seen` стартует не с нуля, а с двойки, поэтому становится 3, и функция возвращает 3. Тройка на экране — неверный ответ, и никакого сообщения об ошибке при этом нет.",
      },
      {
        kk: "Түбірі мынада: функцияның жауабы `a` тізіміне ғана емес, оның бұрын неше рет шақырылғанына да тәуелді. Ондай функцияны бөлек тексеру мүмкін емес — оны сынау үшін бүкіл бағдарламаның тарихын білу керек.",
        ru: "Корень в том, что ответ функции зависит не только от списка `a`, но и от того, сколько раз её вызывали раньше. Такую функцию невозможно проверить отдельно — чтобы её испытать, надо знать всю историю программы.",
      },
      {
        kk: "Түзету — жасырын байланысты көрінетін ету. Санағыштың бастапқы мәні параметр болып кіреді, жаңа мәні `return` арқылы шығады. Енді `count_even(second, 0)` жолының өзі «нөлден баста» деп тұр, ал функцияның ішінде сырттағы бірде-бір ат қолданылмайды.",
        ru: "Исправление — сделать скрытую связь видимой. Начальное значение счётчика входит параметром, новое выходит через `return`. Теперь строка `count_even(second, 0)` сама говорит «начни с нуля», а внутри функции не используется ни одно внешнее имя.",
      },
      {
        kk: "Жиынтық санақ шынымен керек болса, оны шақырушы жинайды: `int total = count_even(first, 0);`, содан кейін `total = count_even(second, total);`. Соңғы 3 саны енді кездейсоқ емес — ол сұралған нәтиже, әрі қай жолда сұралғаны көрініп тұр.",
        ru: "Если общий счёт действительно нужен, его копит вызывающая сторона: `int total = count_even(first, 0);`, затем `total = count_even(second, total);`. Последняя тройка теперь не случайность — это запрошенный результат, и видно, в какой именно строке его запросили.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int seen = 0;\n" +
      "\n" +
      "int count_even_global(vector<int> a) {\n" +
      "    for (int x : a) {\n" +
      "        if (x % 2 == 0) {\n" +
      "            seen = seen + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return seen;\n" +
      "}\n" +
      "\n" +
      "int count_even(vector<int> a, int cnt) {\n" +
      "    for (int x : a) {\n" +
      "        if (x % 2 == 0) {\n" +
      "            cnt = cnt + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return cnt;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> first = {1, 2, 3, 4};\n" +
      "    vector<int> second = {5, 6, 7};\n" +
      "    cout << count_even_global(first) << endl;\n" +
      "    cout << count_even_global(second) << endl;\n" +
      "    cout << count_even(first, 0) << endl;\n" +
      "    cout << count_even(second, 0) << endl;\n" +
      "    int total = count_even(first, 0);\n" +
      "    total = count_even(second, total);\n" +
      "    cout << total << endl;\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Экранға бес жол: 2, 3, 2, 1, 3. Алғашқы екеуі — сырттағы санағышқа сүйенген нұсқаның жауабы, оның үшіншісі қате. Келесі екеуі — параметрлі нұсқанікі: екеуі де дұрыс. Соңғысы — әдейі жиналған жиынтық.",
      ru: "На экран пять строк: 2, 3, 2, 1, 3. Первые две — ответы версии с внешним счётчиком, вторая из них неверна. Следующие две — версии с параметром: обе верны. Последняя — намеренно накопленный итог.",
    },
  },
  {
    id: "m3.l5.b3",
    type: "prediction",
    skillRefs: ["scope.local_global", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* The first call's result is deliberately thrown away. A learner who thinks
       "nothing was done with it, so nothing happened" answers 5, and that is
       precisely the belief the lesson has to break: the call changed `score`
       whether or not anyone kept the value. Both of the lesson's first and
       third failures are in these two lines at once. */
    prompt: {
      kk: "Функция екі рет бірдей аргументпен — 5-пен — шақырылады, ал бірінші шақырудың нәтижесі ешқайда сақталмайды. `score` айнымалысы барлық функциядан тыс жарияланған. Бағдарлама экранға нені шығарады?",
      ru: "Функция вызывается дважды с одним и тем же аргументом — 5, причём результат первого вызова нигде не сохраняется. Переменная `score` объявлена вне всех функций. Что программа выведет на экран?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int score = 0;\n" +
      "\n" +
      "int add_points(int p) {\n" +
      "    score = score + p;\n" +
      "    return score;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    add_points(5);\n" +
      "    cout << add_points(5) << endl;\n" +
      "    return 0;\n" +
      "}",
    answer: "10",
    options: ["0", "5", "10", "20"],
    diagnosticMapping: {
      /* Only 5 is mapped. 0 is reachable from at least two different readings
         (`return` believed to run before the assignment, or the outer `score`
         believed to be copied into the function rather than shared), and 20 is
         barely reachable at all, so neither proves anything about the learner. */
      "5": {
        failureClass: "global_state_assumed_to_reset_per_call",
        justification:
          "5 деген жауап тек `score` екінші шақыруда қайтадан 0-ден басталады деп есептегенде шығады. Бірінші шақырудың нәтижесі сақталмағанмен, `score` функциядан тыс жарияланғандықтан, өзгеріс сол айнымалының өзінде қалды — сондықтан екінші шақыру нөлден емес, 5-тен қосады.",
      },
    },
  },
  {
    /*
     * RE-AUTHORED. The Python block asked where `None` came from, and C++ has
     * no `None`: a function that hands nothing back is `void`, and using its
     * result does not compile at all — which is m3.l3.b5's card, not this one.
     *
     * What survives the language change is the half of that lesson that is
     * still silent, and it is the lesson's own first failure: a returned value
     * that nobody catches. `twice(y);` computes 42 and drops it, `y` is
     * untouched because a parameter is a copy, and the program prints 21 with
     * no complaint from anybody.
     *
     * o4 carries no mapping: "the program actually prints 42" is a denial
     * rather than an explanation, and a learner reaches it by misreading the
     * call, by believing the assignment happened, or by not tracing at all.
     */
    id: "m3.l5.b4",
    type: "multiple_choice",
    skillRefs: ["func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "`twice` функциясы шақырылған, бірақ бағдарлама 42 емес, 21 шығарады. Неге?",
      ru: "Функция `twice` вызвана, но программа выводит 21, а не 42. Почему?",
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
      "    int y = 21;\n" +
      "    twice(y);\n" +
      "    cout << y << endl;\n" +
      "    return 0;\n" +
      "}",
    options: [
      {
        id: "o1",
        label: {
          kk: "`twice` жаңа мән қайтарды, бірақ оны ешкім жазып алмады: `twice(y);` жолы 42-ні есептеп, содан кейін тастап кетті, ал `y`-тің өзі өзгермейді",
          ru: "`twice` вернула новое значение, но его никто не записал: строка `twice(y);` посчитала 42 и выбросила, а сама `y` не меняется",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Параметрдің аты `x`, ал айнымалының аты `y` — аттары бірдей болғанда ғана функция сыртқы айнымалыны өзгерте алар еді",
          ru: "Параметр называется `x`, а переменная — `y`: функция изменила бы внешнюю переменную, только если бы имена совпадали",
        },
      },
      {
        id: "o3",
        label: {
          kk: "`x` — жергілікті айнымалы, ол функция аяқталғанда жойылады, сондықтан нәтиже де сонымен бірге жоғалады",
          ru: "`x` — локальная переменная, она исчезает по завершении функции, поэтому вместе с ней пропадает и результат",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Бағдарламада қате жоқ, ол шын мәнінде 42 шығарады",
          ru: "В программе нет ошибки, на самом деле она выводит 42",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "caller_variable_believed_changed_by_call",
        justification:
          "Бұл нұсқаны таңдау — функция шақырған жердегі айнымалыны өзгерте алады деп ойлағанды білдіреді, тек ат сәйкес келмеді дегені. C++-та параметр — әрқашан көшірме: аттары бірдей болса да, функция сыртқы айнымалыға тие алмайды.",
      },
      o3: {
        failureClass: "scope_blamed_for_discarded_result",
        justification:
          "Бұл нұсқаны таңдау — себепті көріну аймағынан іздегені. `x` шынымен функция біткенде жойылады, бірақ `return` мәнді сол жойылуға дейін шақырған жерге беріп үлгереді. Нәтиженің жоғалу себебі — оны ешкімнің жазып алмағаны.",
      },
    },
  },
  {
    id: "m3.l5.b5",
    type: "find_bug",
    skillRefs: ["scope.local_global", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /*
     * The lesson's second stated objective — «параметр мен жаһандық айнымалыны
     * шатастырмау» — as a task rather than as a sentence in b1.
     *
     * It is the silent twin of m3.l4.b5. There the body reaches for a name that
     * exists only inside another function, so the name does not exist at all
     * and the program refuses to compile — the bug announces itself. Here the
     * name DOES exist, at namespace scope, so it resolves, the parameter is
     * simply unused, and the program answers 3 twice without complaint. The
     * first of those two answers is even correct, which is what makes the card
     * worth its minutes: the learner has to disbelieve a number that looks
     * right.
     *
     * The prompt certifies the signature and the two calls before asking, and
     * that is not generosity. Renaming the parameter `divisor` to `even_div` is
     * also a repair, on line 7, and grading is one clicked line — so without
     * that sentence the block would have two defensible answers and would mark
     * one of them wrong. What the sentence does not give away is which of lines
     * 8–14 reads the wrong name, and that is the whole of the work.
     *
     * No diagnosticMapping. Line 5 is reached by "the variable should not be
     * outside" and equally by "the 2 belonged inside the function", line 7 by
     * two more readings again; none of them names a single cause, so the engine
     * asks rather than tells.
     */
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда n бүтін сан беріледі. Бағдарлама бірінші жолға олардың нешеуі 2-ге бөлінетінін, екінші жолға нешеуі 5-ке бөлінетінін шығаруы керек. Функцияның аты да, екі параметрі де, екі шақыруы да дұрыс жазылған: `count_div` тізім мен бөлгішті қабылдайды. Сонда да `4` пен `3 4 6 8` енгізгенде экранға 3 және 3 шығады, ал дұрысы — 3 және 0. Компилятор ешқандай қате бермейді. Функцияның денесінде қай жол кінәлі?",
      ru: "В первой строке дано n, во второй — n целых чисел. Программа должна вывести в первой строке, сколько из них делится на 2, а во второй — сколько делится на 5. И имя функции, и оба её параметра, и оба вызова написаны верно: `count_div` принимает список и делитель. Тем не менее при вводе `4` и `3 4 6 8` на экран выходят 3 и 3, хотя правильный ответ — 3 и 0. Компилятор при этом не выдаёт никакой ошибки. Какая строка в теле функции виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int even_div = 2;\n" +
      "\n" +
      "int count_div(vector<int> nums, int divisor) {\n" +
      "    int c = 0;\n" +
      "    for (int x : nums) {\n" +
      "        if (x % even_div == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << count_div(a, even_div) << endl;\n" +
      "    cout << count_div(a, 5) << endl;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 10,
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int even_div = 2;\n" +
      "\n" +
      "int count_div(vector<int> nums, int divisor) {\n" +
      "    int c = 0;\n" +
      "    for (int x : nums) {\n" +
      "        if (x % divisor == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << count_div(a, even_div) << endl;\n" +
      "    cout << count_div(a, 5) << endl;\n" +
      "    return 0;\n" +
      "}",
    /* `3 4 6 8` and not a rounder list: it is the shortest input on which the
       first call is right and the second is not merely wrong but zero, so the
       two printed lines cannot be read as one arithmetic slip. */
    symptomInput: "4\n3 4 6 8",
  },
  {
    id: "m3.l5.b6",
    type: "find_bug",
    skillRefs: ["scope.local_global", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* The PDF's own practice family: «жергілікті және жаһандық айнымалы қатесін
       тауып түзету». The same list, the same function, two different answers —
       stated in the prompt as a contradiction the learner has to explain, since
       the program itself reports nothing.
     *
     * `buggyLine` is 5, the declaration, and that is where the language change
     * moved it. In Python the defect had a line of its own — `global total` —
     * and clicking it was the answer. C++ has no such line: the only thing
     * wrong with `total = total + x;` is WHERE `total` was declared, so the
     * line to fix is the declaration that put it outside every function. The
     * repair moves it inside. */
    prompt: {
      kk: "Тізім бір рет оқылады, содан кейін дәл сол тізіммен бір ғана функция екі рет шақырылады. `4` пен `1 2 3 4` енгізгенде экранға 10 және 20 шығады. Тізім де, функция да сол күйінде — жауап неге өзгерді? C++-та функцияның сырттағы айнымалыны өзгертуі үшін ешқандай қосымша сөз жазылмайтынын ескер: қайсысы жергілікті, қайсысы емес екенін жариялану орнынан ғана білуге болады. Қай жол кінәлі?",
      ru: "Список читается один раз, затем одна и та же функция дважды вызывается с этим же списком. При вводе `4` и `1 2 3 4` на экран выходят 10 и 20. И список, и функция те же самые — почему изменился ответ? Учти: в C++ функции не нужно никакого дополнительного слова, чтобы менять внешнюю переменную, — понять, какая переменная локальная, а какая нет, можно только по месту её объявления. Какая строка виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int total = 0;\n" +
      "\n" +
      "int list_sum(vector<int> a) {\n" +
      "    for (int x : a) {\n" +
      "        total = total + x;\n" +
      "    }\n" +
      "    return total;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << list_sum(a) << endl;\n" +
      "    cout << list_sum(a) << endl;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 5,
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int list_sum(vector<int> a) {\n" +
      "    int total = 0;\n" +
      "    for (int x : a) {\n" +
      "        total = total + x;\n" +
      "    }\n" +
      "    return total;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << list_sum(a) << endl;\n" +
      "    cout << list_sum(a) << endl;\n" +
      "    return 0;\n" +
      "}",
    symptomInput: "4\n1 2 3 4",
  },
  {
    id: "m3.l5.b7",
    type: "modify_code",
    skillRefs: ["scope.local_global", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* The one place in the lesson where nothing is broken. Taking the shared
       variable out of a program that already prints the right numbers is what
       makes the point that the objection to shared state is not "it gives wrong
       answers today" but "you cannot see what this function depends on". */
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда n бүтін сан беріледі. Бағдарлама әр қадамда сол сәтке дейін жиналған қосындыны жеке жолға шығарады. Ол қазір дұрыс жұмыс істейді, бірақ `add` функциясы барлық функциядан тыс тұрған `total` айнымалысын өзгертеді. Оны қайта жаз: `total` айнымалысы функциялардан тыс жерде мүлде болмасын, қосындының ағымдағы мәні функцияға параметр болып кірсін, жаңа мәні `return` арқылы шықсын. Шығатын сандар да, олардың реті де бұрынғыдай қалуы керек.",
      ru: "В первой строке дано n, во второй — n целых чисел. Программа на каждом шаге выводит отдельной строкой сумму, накопленную к этому моменту. Сейчас она работает правильно, но функция `add` меняет переменную `total`, объявленную вне всех функций. Перепиши её: переменной `total` вне функций быть не должно, текущее значение суммы должно входить в функцию параметром, а новое — выходить через `return`. Выводимые числа и их порядок должны остаться прежними.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int total = 0;\n" +
      "\n" +
      "int add(int x) {\n" +
      "    total = total + x;\n" +
      "    return total;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    for (int x : a) {\n" +
      "        cout << add(x) << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int add(int total, int x) {\n" +
      "    return total + x;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int total = 0;\n" +
      "    for (int x : a) {\n" +
      "        total = add(total, x);\n" +
      "        cout << total << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    /* The cases exist to catch a rewrite that quietly changes the arithmetic
       while removing the shared variable:
       "1 2 3"     → the running total, not the element, is what is printed;
       "5"         → a single call, so a solution that only prints after the
                     loop still has to produce one line;
       "-1 -2"     → negatives, which kill "print the maximum so far";
       "0 0 0"     → three identical lines: a solution that prints `x` instead
                     of the accumulated sum passes every other case here;
       "10 -10 7"  → the total returns to 0 mid-way, which kills a rewrite that
                     starts the accumulator from a[0] and double-counts it. */
    cases: [
      { input: "3\n1 2 3", expectedOutput: "1\n3\n6" },
      { input: "1\n5", expectedOutput: "5" },
      { input: "2\n-1 -2", expectedOutput: "-1\n-3", hidden: true },
      { input: "3\n0 0 0", expectedOutput: "0\n0\n0", hidden: true },
      { input: "3\n10 -10 7", expectedOutput: "10\n0\n7", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m3.l5.b8 — the same two functions, the same
       output, assembled rather than written. PDF p.6: «дайын кодты құрастыру
       мен толықтыру көбірек, нөлден жазу азырақ». The three blanks are the
       three decisions of the task: how a digit is removed, how the result
       leaves the function, and what the second function is handed.

       That third blank used to be the function's NAME — `parity(___(x))`
       answered `digit_sum` — and `int digit_sum(int n)` is the first line of
       the same template. `payload-privacy` reports it and is right to: a blank
       answer is graded material, so it stays a secret even when the block
       publishes it itself. It was also the emptiest of the three decisions.
       Two names are in scope, one of them is already written outside the
       parentheses, and the hole is filled by copying.

       Blanking the whole argument asks what the task is actually about.
       `parity` decides `even`/`odd` from the DIGIT SUM, not from the number, so
       a learner who answers `x` gets a program that compiles, runs, prints
       nothing alarming and calls 12 `even`. That is the same mistake m3.l5.b8's
       first case («12 13») exists to catch on the core route, and the support
       route had no way to make it until now. The name stays visible, and it
       should be: what is hidden is which value goes into it. */
    id: "m3.l5.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда k саны, екінші жолда k бүтін оң сан беріледі. Бағдарлама әр сан үшін оның цифрлар қосындысы жұп болса `even`, тақ болса `odd` шығаруы керек. Қаңқасы дайын, үш орынды толтыр: бірінші орынға санның соңғы цифрын алып тастайтын амал белгісі, екінші орынға қосындыны шақырушыға жеткізетін сөз, үшінші орынға `parity` функциясына берілетін өрнек керек.",
      ru: "В первой строке дано k, во второй — k целых положительных чисел. Программа должна для каждого числа выводить `even`, если сумма его цифр чётная, и `odd`, если нечётная. Каркас готов, заполни три пропуска: в первый — знак операции, которая убирает последнюю цифру числа, во второй — слово, доставляющее сумму вызывающей стороне, в третий — выражение, которое передаётся функции `parity`.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n ___ 10;\n" +
      "    }\n" +
      "    ___ s;\n" +
      "}\n" +
      "\n" +
      "string parity(int x) {\n" +
      "    if (x % 2 == 0) {\n" +
      '        return "even";\n' +
      "    }\n" +
      '    return "odd";\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    vector<int> a(k);\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    for (int x : a) {\n" +
      "        cout << parity(___) << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "/" },
      { id: "f2", answer: "return" },
      { id: "f3", answer: "digit_sum(x)" },
    ],
  },
  {
    id: "m3.l5.b8",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "scope.local_global"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    /* Three PDF practice families at once: «цифрлар қосындысын функциямен
       есептеу», «санның қасиетін тексеретін функция» and «бірнеше функциядан
       тұратын шағын бағдарлама». The ban on state living outside the functions
       is stated in the prompt because it is what this lesson is marking, and
       because without it the obvious solution is a shared counter. */
    prompt: {
      kk: "Бірінші жолда k саны беріледі (1 ≤ k ≤ 100), екінші жолда бос орынмен бөлінген k бүтін оң сан (әрқайсысы 1 мен 1 000 000 аралығында). Екі функция жаз: біріншісі санның цифрларының қосындысын қайтарсын (түрі `int`), екіншісі берілген сан жұп болса `even`, тақ болса `odd` жолын қайтарсын (түрі `string`). Әр сан үшін оның цифрлар қосындысына сәйкес сөзді бөлек жолға шығар. Мысалы, k = 2 және `12 13` үшін жауап екі жол: `odd` (1 + 2 = 3) және `even` (1 + 3 = 4). Функциялардан тыс тұрып өзгеретін айнымалы болмауы керек — жауап тек параметр мен `return` арқылы жүреді.",
      ru: "В первой строке дано k (1 ≤ k ≤ 100), во второй — k целых положительных чисел через пробел (каждое от 1 до 1 000 000). Напиши две функции: первая возвращает сумму цифр числа (тип `int`), вторая возвращает `even`, если данное ей число чётное, и `odd`, если нечётное (тип `string`). Для каждого числа выведи на отдельной строке слово, соответствующее сумме его цифр. Например, при k = 2 и числах `12 13` ответ — две строки: `odd` (1 + 2 = 3) и `even` (1 + 3 = 4). Переменных, которые живут вне функций и меняются, быть не должно — ответ ходит только через параметры и `return`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
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
      "string parity(int x) {\n" +
      "    if (x % 2 == 0) {\n" +
      '        return "even";\n' +
      "    }\n" +
      '    return "odd";\n' +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    vector<int> a(k);\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    for (int x : a) {\n" +
      "        cout << parity(digit_sum(x)) << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    /* Every case was run against the wrong program it exists to catch:
       "12 13"        → tests the parity of the NUMBER instead of its digit sum
                        (answers even, odd — both wrong);
       "7"            → one number, and `while (n > 9)` (a loop that stops one
                        digit early) answers even here instead of odd;
       "10 100 1000"  → trailing zeros: `while (n > 9)` and `n / 10 > 0` both
                        drop the last digit and answer even three times;
       "482 9 25"     → a two-digit and a three-digit number in the same line,
                        with 482 the only one whose digit sum is even;
       "2 4 6"        → digit sum equals the number, so a solution that never
                        calls digit_sum still passes — it is here to make the
                        other cases the discriminating ones, and to check that
                        an all-even answer is reachable at all;
       "999"          → the largest digit sum in the set (27), which catches a
                        loop that stops after two digits. */
    cases: [
      { input: "2\n12 13", expectedOutput: "odd\neven" },
      { input: "1\n7", expectedOutput: "odd" },
      { input: "3\n10 100 1000", expectedOutput: "odd\nodd\nodd", hidden: true },
      { input: "3\n482 9 25", expectedOutput: "even\nodd\nodd", hidden: true },
      { input: "3\n2 4 6", expectedOutput: "even\neven\neven", hidden: true },
      { input: "1\n999", expectedOutput: "odd", hidden: true },
    ],
  },
  {
    /* ADVANCED ONLY — the month's written defence. PDF p.6: «шешімді жазбаша
       қорғау міндетті», and p.8's monthly check: «жаһандық айнымалыны
       қолданудың бір тәуекелін атайды». The second half of the prompt is the
       part that cannot be answered from memory: naming a risk is a slogan until
       the learner points at a run where the program printed a wrong number and
       said nothing. */
    id: "m3.l5.b9",
    type: "explain",
    skillRefs: ["scope.local_global", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["advanced"],
    prompt: {
      kk: "Жаһандық күйді — барлық функциядан тыс жарияланып, функция ішінде өзгеретін айнымалыны — қолданудың бір нақты тәуекелін ата. Содан кейін сол тәуекел бағдарламаны құлатпай, үнсіз қате жауап беретін бір жағдайды сипатта: қандай сандар кірді, экранға не шықты, дұрысы қандай болуы керек еді. Бүгінгі мысалдардың біріне сүйенуге болады.",
      ru: "Назови один конкретный риск использования глобального состояния — переменной, которая объявлена вне всех функций, но меняется внутри одной из них. Затем опиши одну ситуацию, где этот риск не роняет программу, а молча даёт неверный ответ: какие числа были на входе, что вышло на экран и каким ответ должен был быть. Можно опереться на один из сегодняшних примеров.",
    },
    expectedPoints: [
      {
        kk: "Жаһандық айнымалы шақырулар арасында мәнін сақтайды, сондықтан екінші шақыру бірінші шақырудың қалдығынан басталады: бірдей аргументпен әртүрлі жауап шығуы мүмкін.",
        ru: "Глобальная переменная сохраняет значение между вызовами, поэтому второй вызов начинается с остатка от первого: на одних и тех же аргументах ответ может получиться разным.",
      },
      {
        kk: "Функцияның жауабы енді тек параметрлеріне емес, бағдарламаның бұрынғы тарихына да тәуелді, сондықтан оны бөлек тексеру мүмкін емес — сынау үшін оған дейін не орындалғанын білу керек.",
        ru: "Ответ функции теперь зависит не только от параметров, но и от предыдущей истории программы, поэтому проверить её отдельно нельзя — для испытания надо знать, что выполнялось до неё.",
      },
      {
        kk: "C++-та бұл қатенің көзге түспейтіні де айтылған: сырттағы айнымалыны өзгерту үшін ешқандай қосымша сөз жазылмайды, сондықтан `total = total + x;` жолына қарап оның жергілікті емес екенін білу мүмкін емес — жарияланған жерін іздеп табу керек.",
        ru: "Сказано и о том, почему в C++ эта ошибка незаметна: чтобы менять внешнюю переменную, никакого дополнительного слова писать не нужно, поэтому по строке `total = total + x;` нельзя понять, что переменная не локальная, — надо идти и искать место её объявления.",
      },
      {
        kk: "Үнсіз қатенің нақты мысалы: {1, 2, 3, 4} және {5, 6, 7} тізімдері үшін жұп сандарды санағанда экранға 2 мен 3 шығады, ал екінші тізімде бір ғана жұп сан бар — дұрысы 1 болуы керек еді. Ешқандай қате хабары шықпайды, 3 саны сырттай ақылға қонымды.",
        ru: "Конкретный пример молчаливой ошибки: при подсчёте чётных чисел в списках {1, 2, 3, 4} и {5, 6, 7} на экран выходят 2 и 3, хотя во втором списке одно чётное число и правильный ответ — 1. Никакого сообщения об ошибке нет, а тройка выглядит правдоподобно.",
      },
      {
        kk: "Шешім — байланысты көрінетін ету: керек мән параметр болып кіреді, нәтиже `return` арқылы шығады. Сонда шақыру жолының өзі функция неден басталатынын айтады және оны бөлек сынауға болады.",
        ru: "Решение — сделать связь видимой: нужное значение входит параметром, результат выходит через `return`. Тогда сама строка вызова говорит, с чего функция начинает, и её можно испытать отдельно.",
      },
    ],
  },
];
