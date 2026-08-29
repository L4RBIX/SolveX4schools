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
 * Three decisions taken once here.
 *
 * 1. **`global` appears in this lesson and nowhere else in the year, and every
 *    time it appears it is the thing that goes wrong.** The month file's header
 *    states the rule; this is the file it applies to. No reference solution
 *    below contains the keyword, and the two programs that do contain it —
 *    m3.l5.b2's first version and m3.l5.b6's broken program — are both shown
 *    printing a wrong answer with no error message. A learner who leaves this
 *    lesson able to write `global` and unable to say why they should not has
 *    read the syntax and missed the lesson.
 *
 * 2. **Every failure here is silent.** None of the three crashes: the no-return
 *    function prints `None` beside a correct-looking number, the ignored
 *    parameter returns a plausible count, and the shared counter returns a
 *    count that is right the first time. That is the whole difficulty and it is
 *    why the lesson is a lesson — a `SyntaxError` teaches itself. So each task
 *    states the symptom in numbers the learner can check («42, содан кейін
 *    None», «3 пен 3, ал дұрысы 3 пен 0», «10 және 20») rather than saying
 *    "this program is broken". m3.l4.b5 is the loud version of the middle one
 *    and stops with `NameError`; the difference between the two is the reason
 *    both exist.
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
       first — it is the shortest and the only one with a visible marker on
       screen (`None`); the other two are quoted inline because their broken
       programs are the subject of b2 and b6, where they get room to run. */
    body: {
      kk: "Функциямен жұмыс істегенде үш қате жиі кездеседі. Үшеуінің де ортақ қасиеті бар: бағдарлама құламайды, қате хабары шықпайды, экранға ақылға қонымды сан шығады — тек ол сан дұрыс емес.\n\nБірінші: функция нәтижені өзі экранға шығарады, бірақ `return` жазылмаған. Ондай функцияны шақырсаң, нәтиже орнына `None` — «ештеңе» — келеді. Төмендегі бағдарлама алдымен 10 санын (оны функцияның өз `print`-і шығарды), содан кейін `None` сөзін шығарады.\n\nЕкінші: функцияда параметр бар, бірақ дене ішінде сол параметрдің орнына функциядан тыс жарияланған айнымалы қолданылған. `n = 5` деп жазылып, функция `def square(k): return n * n` болса, `square(3)` 9 емес, 25 береді: параметр есептеуге мүлде қатыспайды.\n\nҮшінші: функция сырттағы айнымалыны `global` арқылы өзгертеді. Сонда функцияның жауабы тек аргументтерінен емес, бағдарламада бұрын не болғанынан да тәуелді болады: екінші шақыру бірінші шақырудың қалдығынан басталады.",
      ru: "При работе с функциями чаще всего встречаются три ошибки. У всех трёх есть общее свойство: программа не падает, сообщения об ошибке нет, на экран выходит правдоподобное число — просто неверное.\n\nПервая: функция сама выводит результат на экран, но `return` не написан. Если вызвать такую функцию, вместо результата придёт `None` — «ничего». Программа ниже выведет сначала 10 (это напечатал `print` внутри функции), а потом слово `None`.\n\nВторая: у функции есть параметр, но в теле вместо него используется переменная, объявленная снаружи. Если написано `n = 5`, а функция выглядит как `def square(k): return n * n`, то `square(3)` вернёт 25, а не 9: параметр в вычислении не участвует вообще.\n\nТретья: функция меняет внешнюю переменную через `global`. Тогда её ответ зависит не только от аргументов, но и от того, что происходило в программе раньше: второй вызов начинается с остатка от первого.",
    },
    code: "def sum_to(n):\n    s = 0\n    for i in range(1, n + 1):\n        s = s + i\n    print(s)\n\nanswer = sum_to(4)\nprint(answer)",
  },
  {
    /* Worked example #5 of the six the PDF requires this month. Both versions
       are in one program so the four printed lines sit under each other on the
       same screen: the same two calls, the same two lists, one version wrong.
       Describing the broken run in prose instead would ask the learner to
       believe a claim about Python rather than read it. */
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
      kk: "Екі тізім берілген: `[1, 2, 3, 4]` және `[5, 6, 7]`. Әрқайсысындағы жұп сандардың санын шығару керек. Дұрыс жауаптар — 2 және 1. Бірінші нұсқада санағыш `seen` функциядан тыс тұр және `global` арқылы өзгереді; ол екінші тізім үшін 1 емес, 3 береді. Неге, және оны қалай түзетеміз?",
      ru: "Даны два списка: `[1, 2, 3, 4]` и `[5, 6, 7]`. Нужно вывести, сколько чётных чисел в каждом. Правильные ответы — 2 и 1. В первой версии счётчик `seen` живёт вне функции и меняется через `global`; для второго списка он даёт 3, а не 1. Почему, и как это исправить?",
    },
    steps: [
      {
        kk: "`seen = 0` жолы функциядан тыс тұр, сондықтан ол бағдарлама басталғанда бір-ақ рет орындалады. Функцияға кірген сайын `seen` қайта нөлденбейді — ол бүкіл жұмыс бойы бір ғана дана болып қалады.",
        ru: "Строка `seen = 0` стоит вне функции, поэтому она выполняется ровно один раз, при запуске программы. При каждом входе в функцию `seen` не обнуляется — он остаётся одним и тем же на всё время работы.",
      },
      {
        kk: "Бірінші шақыру `[1, 2, 3, 4]` тізімінен 2 мен 4-ті табады: `seen` 0-ден 2-ге көтеріледі, функция 2-ні қайтарады. Осы жерге дейін бәрі дұрыс, әрі қате жасырынып қалады — дұрыс жауап адамды тыныштандырады.",
        ru: "Первый вызов находит в `[1, 2, 3, 4]` числа 2 и 4: `seen` поднимается с 0 до 2, функция возвращает 2. До этого места всё верно, и ошибка прячется — правильный ответ усыпляет внимание.",
      },
      {
        kk: "Екінші шақыру `[5, 6, 7]` тізімін алады. Онда бір ғана жұп сан бар — 6. Бірақ `seen` нөлден емес, 2-ден басталады, сондықтан ол 3 болады да, функция 3-ті қайтарады. Экрандағы 3 — қате жауап, ал ешқандай қате хабары жоқ.",
        ru: "Второй вызов получает список `[5, 6, 7]`. В нём одно чётное число — 6. Но `seen` стартует не с нуля, а с двойки, поэтому становится 3, и функция возвращает 3. Тройка на экране — неверный ответ, и никакого сообщения об ошибке при этом нет.",
      },
      {
        kk: "Түбірі мынада: функцияның жауабы `a` тізіміне ғана емес, оның бұрын неше рет шақырылғанына да тәуелді. Ондай функцияны бөлек тексеру мүмкін емес — оны сынау үшін бүкіл бағдарламаның тарихын білу керек.",
        ru: "Корень в том, что ответ функции зависит не только от списка `a`, но и от того, сколько раз её вызывали раньше. Такую функцию невозможно проверить отдельно — чтобы её испытать, надо знать всю историю программы.",
      },
      {
        kk: "Түзету — жасырын байланысты көрінетін ету. Санағыштың бастапқы мәні параметр болып кіреді, жаңа мәні `return` арқылы шығады. Енді `count_even(second, 0)` жолының өзі «нөлден баста» деп тұр, ал функция ішінде `global` мүлде керек емес.",
        ru: "Исправление — сделать скрытую связь видимой. Начальное значение счётчика входит параметром, новое выходит через `return`. Теперь строка `count_even(second, 0)` сама говорит «начни с нуля», а `global` внутри функции не нужен вообще.",
      },
      {
        kk: "Жиынтық санақ шынымен керек болса, оны шақырушы жинайды: `total = count_even(first, 0)`, содан кейін `total = count_even(second, total)`. Соңғы 3 саны енді кездейсоқ емес — ол сұралған нәтиже, әрі қай жолда сұралғаны көрініп тұр.",
        ru: "Если общий счёт действительно нужен, его копит вызывающая сторона: `total = count_even(first, 0)`, затем `total = count_even(second, total)`. Последняя тройка теперь не случайность — это запрошенный результат, и видно, в какой именно строке его запросили.",
      },
    ],
    code: "seen = 0\n\ndef count_even_global(a):\n    global seen\n    for x in a:\n        if x % 2 == 0:\n            seen = seen + 1\n    return seen\n\ndef count_even(a, cnt):\n    for x in a:\n        if x % 2 == 0:\n            cnt = cnt + 1\n    return cnt\n\nfirst = [1, 2, 3, 4]\nsecond = [5, 6, 7]\nprint(count_even_global(first))\nprint(count_even_global(second))\nprint(count_even(first, 0))\nprint(count_even(second, 0))\ntotal = count_even(first, 0)\ntotal = count_even(second, total)\nprint(total)",
    result: {
      kk: "Экранға бес жол: 2, 3, 2, 1, 3. Алғашқы екеуі — global нұсқасының жауабы, оның 3-і қате. Келесі екеуі — параметрлі нұсқанікі: 2 және 1, екеуі де дұрыс. Соңғы 3 — әдейі жиналған жиынтық.",
      ru: "На экран пять строк: 2, 3, 2, 1, 3. Первые две — ответы версии с global, её тройка неверна. Следующие две — версии с параметром: 2 и 1, обе верны. Последняя тройка — намеренно накопленный итог.",
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
       whether or not anyone kept the value. */
    prompt: {
      kk: "Функция екі рет бірдей аргументпен — 5-пен — шақырылады, ал бірінші шақырудың нәтижесі ешқайда сақталмайды. Бағдарлама экранға нені шығарады?",
      ru: "Функция вызывается дважды с одним и тем же аргументом — 5, причём результат первого вызова нигде не сохраняется. Что программа выведет на экран?",
    },
    code: "score = 0\n\ndef add_points(p):\n    global score\n    score = score + p\n    return score\n\nadd_points(5)\nprint(add_points(5))",
    answer: "10",
    options: ["0", "5", "10", "20"],
    diagnosticMapping: {
      /* Only 5 is mapped. 0 is reachable from at least two different readings
         (`return` believed to run before the assignment, or `global` believed
         to copy the value instead of sharing it), and 20 is barely reachable at
         all, so neither proves anything about the learner. */
      "5": {
        failureClass: "global_state_assumed_to_reset_per_call",
        justification:
          "5 деген жауап тек `score` екінші шақыруда қайтадан 0-ден басталады деп есептегенде шығады. Бірінші шақырудың нәтижесі сақталмағанмен, `global score` оны айнымалының өзінде қалдырды, сондықтан екінші шақыру нөлден емес, 5-тен қосады.",
      },
    },
  },
  {
    id: "m3.l5.b4",
    type: "multiple_choice",
    skillRefs: ["func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама екі жол шығарады: алдымен `42`, содан кейін `None`. Екінші жолдағы `None` қайдан шықты?",
      ru: "Эта программа выводит две строки: сначала `42`, потом `None`. Откуда взялось `None` во второй строке?",
    },
    code: "def double(x):\n    print(x * 2)\n\ny = double(21)\nprint(y)",
    options: [
      {
        id: "o1",
        label: {
          kk: "`double` функциясында `return` жоқ, сондықтан шақырудың нәтижесі `None` болады да, дәл сол `y`-ке жазылады",
          ru: "В функции `double` нет `return`, поэтому результатом вызова оказывается `None`, и именно он попадает в `y`",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Мән функция ішінде бір рет шығарылып қойған, ал бір мәнді екі рет шығаруға болмайды",
          ru: "Значение уже было выведено внутри функции, а одно и то же значение нельзя вывести дважды",
        },
      },
      {
        id: "o3",
        label: {
          kk: "`x` — жергілікті айнымалы, ол функция аяқталғанда жойылады, сондықтан `y` бос қалады",
          ru: "`x` — локальная переменная, она исчезает по завершении функции, поэтому `y` остаётся пустым",
        },
      },
      {
        id: "o4",
        label: {
          kk: "`y = double(21)` жолында жақша артық: функцияны шақырмай, тек атын жазу керек еді",
          ru: "В строке `y = double(21)` лишние скобки: функцию не надо было вызывать, достаточно было написать её имя",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "print_confused_with_return",
        justification:
          "Бұл нұсқаны таңдау — `print`-ті мәнді шақырушыға жеткізу тәсілі деп түсіну. `print` мәнді ешкімге бермейді, ол тек экранға жазады; шақырушыға мән тек `return` арқылы барады, ал мұнда `return` жоқ.",
      },
      o3: {
        failureClass: "scope_blamed_for_missing_return",
        justification:
          "Бұл нұсқаны таңдау — `None`-ның себебін көріну аймағынан іздегені. `x` шынымен функция біткенде жойылады, бірақ `y`-ке жазылатын нәрсе `x` емес, функцияның қайтарған мәні; `return` болмағандықтан ол мән — `None`.",
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
     * This card used to be m3.l3.b5 verbatim — the same `digit_sum`, the same
     * `print(s)` on the same line 6, the same repair — and l3 is taught 29
     * cards earlier in the same month. `checkBlock` grades a find_bug on the
     * clicked line and nothing else, so the second sitting asked a learner to
     * remember a number rather than to derive one. It was also leaking: the old
     * fixedCode is the first half of m3.l5.b8's reference solution three cards
     * below, so the block handed over part of the lesson's final task on its
     * way past.
     *
     * What replaces it is the lesson's second stated objective — «параметр мен
     * жаһандық айнымалыны шатастырмау» — which m3.l5.b1 describes in prose and
     * which, until now, no task in the file actually asked for. It cannot
     * repeat l3.b5: nothing here is missing a `return`, and no line of it
     * appears anywhere else in November.
     *
     * It is the silent twin of m3.l4.b5. There the body reaches for a name that
     * exists only inside another function, the lookup fails and the program
     * stops with `NameError` — the bug announces itself. Here the name does
     * exist, at module level, so the lookup succeeds and the program answers 3
     * twice without complaint. The first of those two answers is even correct,
     * which is what makes the card worth its minutes: the learner has to
     * disbelieve a number that looks right.
     *
     * The prompt certifies the signature and the two calls before asking, and
     * that is not generosity. Renaming the parameter `div` to `even_div` is
     * also a repair, on line 3, and grading is one clicked line — so without
     * that sentence the block would have two defensible answers and would mark
     * one of them wrong. What the sentence does not give away is which of lines
     * 4–8 reads the wrong name, and that is the whole of the work.
     *
     * No diagnosticMapping. Line 1 is reached by "the variable should not be
     * outside" and equally by "the 2 belonged inside the function", line 3 by
     * two more readings again; none of them names a single cause, so the engine
     * asks rather than tells.
     */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі. Бағдарлама бірінші жолға олардың нешеуі 2-ге бөлінетінін, екінші жолға нешеуі 5-ке бөлінетінін шығаруы керек. Функцияның аты да, екі параметрі де, екі шақыруы да дұрыс жазылған: `count_div` тізім мен бөлгішті қабылдайды. Сонда да `3 4 6 8` енгізгенде экранға 3 және 3 шығады, ал дұрысы — 3 және 0. Қате хабары мүлде шықпайды. Функцияның денесінде қай жол кінәлі?",
      ru: "В одной строке через пробел даны целые числа. Программа должна вывести в первой строке, сколько из них делится на 2, а во второй — сколько делится на 5. И имя функции, и оба её параметра, и оба вызова написаны верно: `count_div` принимает список и делитель. Тем не менее при вводе `3 4 6 8` на экран выходят 3 и 3, хотя правильный ответ — 3 и 0. Сообщения об ошибке при этом нет вообще. Какая строка в теле функции виновата?",
    },
    code: "even_div = 2\n\ndef count_div(nums, div):\n    c = 0\n    for x in nums:\n        if x % even_div == 0:\n            c = c + 1\n    return c\n\na = list(map(int, input().split()))\nprint(count_div(a, even_div))\nprint(count_div(a, 5))",
    buggyLine: 6,
    fixedCode: "even_div = 2\n\ndef count_div(nums, div):\n    c = 0\n    for x in nums:\n        if x % div == 0:\n            c = c + 1\n    return c\n\na = list(map(int, input().split()))\nprint(count_div(a, even_div))\nprint(count_div(a, 5))",
    /* `3 4 6 8` and not a rounder list: it is the shortest input on which the
       first call is right and the second is not merely wrong but zero, so the
       two printed lines cannot be read as one arithmetic slip. */
    symptomInput: "3 4 6 8",
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
       the program itself reports nothing. */
    prompt: {
      kk: "Тізім бір рет оқылады, содан кейін дәл сол тізіммен бір ғана функция екі рет шақырылады. `1 2 3 4` енгізгенде экранға 10 және 20 шығады. Тізім де, функция да сол күйінде — жауап неге өзгерді? Қай жол кінәлі?",
      ru: "Список читается один раз, затем одна и та же функция дважды вызывается с этим же списком. При вводе `1 2 3 4` на экран выходят 10 и 20. И список, и функция те же самые — почему изменился ответ? Какая строка виновата?",
    },
    code: "total = 0\n\ndef list_sum(a):\n    global total\n    for x in a:\n        total = total + x\n    return total\n\na = list(map(int, input().split()))\nprint(list_sum(a))\nprint(list_sum(a))",
    buggyLine: 4,
    fixedCode: "def list_sum(a):\n    total = 0\n    for x in a:\n        total = total + x\n    return total\n\na = list(map(int, input().split()))\nprint(list_sum(a))\nprint(list_sum(a))",
    symptomInput: "1 2 3 4",
  },
  {
    id: "m3.l5.b7",
    type: "modify_code",
    skillRefs: ["scope.local_global", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* The one place in the lesson where nothing is broken. Removing `global`
       from a program that already prints the right numbers is what makes the
       point that the objection to global state is not "it gives wrong answers
       today" but "you cannot see what this function depends on". */
    prompt: {
      kk: "Бағдарлама тізімді оқып, әр қадамда сол сәтке дейін жиналған қосындыны шығарады. Ол қазір дұрыс жұмыс істейді, бірақ `add` функциясы сырттағы `total` айнымалысын `global` арқылы өзгертеді. `global`-ды алып таста: қосындының ағымдағы мәні функцияға параметр болып кірсін, жаңа мәні `return` арқылы шықсын. Шығатын сандар да, олардың реті де бұрынғыдай қалуы керек.",
      ru: "Программа читает список и на каждом шаге выводит сумму, накопленную к этому моменту. Сейчас она работает правильно, но функция `add` меняет внешнюю переменную `total` через `global`. Убери `global`: текущее значение суммы должно входить в функцию параметром, а новое — выходить через `return`. Выводимые числа и их порядок должны остаться прежними.",
    },
    code: "total = 0\n\ndef add(x):\n    global total\n    total = total + x\n    return total\n\na = list(map(int, input().split()))\nfor x in a:\n    print(add(x))",
    referenceSolution:
      "def add(total, x):\n    return total + x\n\na = list(map(int, input().split()))\ntotal = 0\nfor x in a:\n    total = add(total, x)\n    print(total)",
    /* The cases exist to catch a rewrite that quietly changes the arithmetic
       while removing the keyword:
       "1 2 3"     → the running total, not the element, is what is printed;
       "5"         → a single call, so a solution that only prints after the
                     loop still has to produce one line;
       "-1 -2"     → negatives, which kill "print the maximum so far";
       "0 0 0"     → three identical lines: a solution that prints `x` instead
                     of the accumulated sum passes every other case here;
       "10 -10 7"  → the total returns to 0 mid-way, which kills a rewrite that
                     starts the accumulator from a[0] and double-counts it. */
    cases: [
      { input: "1 2 3", expectedOutput: "1\n3\n6" },
      { input: "5", expectedOutput: "5" },
      { input: "-1 -2", expectedOutput: "-1\n-3", hidden: true },
      { input: "0 0 0", expectedOutput: "0\n0\n0", hidden: true },
      { input: "10 -10 7", expectedOutput: "10\n0\n7", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m3.l5.b8 — the same two functions, the same
       output, assembled rather than written. PDF p.6: «дайын кодты құрастыру
       мен толықтыру көбірек, нөлден жазу азырақ». The three blanks are the
       three decisions of the task: how a digit is removed, how the result
       leaves the function, and how one function's answer becomes the other
       function's argument. */
    id: "m3.l5.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бағдарлама әр сан үшін оның цифрлар қосындысы жұп болса `even`, тақ болса `odd` шығаруы керек. Қаңқасы дайын, үш орынды толтыр: бірінші орынға санның соңғы цифрын алып тастайтын амал, екінші орынға қосындыны шақырушыға жеткізетін сөз, үшінші орынға `parity` функциясына берілетін санды дайындайтын функцияның аты керек.",
      ru: "Программа должна для каждого числа выводить `even`, если сумма его цифр чётная, и `odd`, если нечётная. Каркас готов, заполни три пропуска: в первый — операцию, которая убирает последнюю цифру числа, во второй — слово, доставляющее сумму вызывающей стороне, в третий — имя функции, которая готовит число для `parity`.",
    },
    template:
      "def digit_sum(n):\n    s = 0\n    while n > 0:\n        s = s + n % 10\n        n = n ___ 10\n    ___ s\n\ndef parity(x):\n    if x % 2 == 0:\n        return \"even\"\n    return \"odd\"\n\na = list(map(int, input().split()))\nfor x in a:\n    print(parity(___(x)))",
    blanks: [
      { id: "f1", answer: "//" },
      { id: "f2", answer: "return" },
      { id: "f3", answer: "digit_sum" },
    ],
  },
  {
    id: "m3.l5.b8",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "scope.local_global"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    /* Three PDF practice families at once: «цифрлар қосындысын функциямен
       есептеу», «санның қасиетін тексеретін функция» and «бірнеше функциядан
       тұратын шағын бағдарлама». The ban on module-level mutable state is
       stated in the prompt because it is what this lesson is marking, and
       because without it the obvious solution is a global counter. */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін оң сандар беріледі (кемінде біреу). Екі функция жаз: біріншісі санның цифрларының қосындысын қайтарсын, екіншісі берілген сан жұп болса `even`, тақ болса `odd` жолын қайтарсын. Әр сан үшін оның цифрлар қосындысына сәйкес сөзді бөлек жолға шығар. Мысалы, `12 13` үшін жауап екі жол: `odd` (1 + 2 = 3) және `even` (1 + 3 = 4). Функциядан тыс тұрып өзгеретін айнымалы болмауы керек — `global` қолданылмайды.",
      ru: "В одной строке даны целые положительные числа через пробел (хотя бы одно). Напиши две функции: первая возвращает сумму цифр числа, вторая возвращает `even`, если данное ей число чётное, и `odd`, если нечётное. Для каждого числа выведи на отдельной строке слово, соответствующее сумме его цифр. Например, для `12 13` ответ — две строки: `odd` (1 + 2 = 3) и `even` (1 + 3 = 4). Переменных, которые живут вне функций и меняются, быть не должно — `global` не используется.",
    },
    referenceSolution:
      "def digit_sum(n):\n    s = 0\n    while n > 0:\n        s = s + n % 10\n        n = n // 10\n    return s\n\ndef parity(x):\n    if x % 2 == 0:\n        return \"even\"\n    return \"odd\"\n\na = list(map(int, input().split()))\nfor x in a:\n    print(parity(digit_sum(x)))",
    /* Every case was run against the wrong program it exists to catch:
       "12 13"        → tests the parity of the NUMBER instead of its digit sum
                        (answers even, odd — both wrong);
       "7"            → one number, and `while n > 9` (a loop that stops one
                        digit early) answers even here instead of odd;
       "10 100 1000"  → trailing zeros: `while n > 9` and `n // 10 > 0` both
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
      { input: "12 13", expectedOutput: "odd\neven" },
      { input: "7", expectedOutput: "odd" },
      { input: "10 100 1000", expectedOutput: "odd\nodd\nodd", hidden: true },
      { input: "482 9 25", expectedOutput: "even\nodd\nodd", hidden: true },
      { input: "2 4 6", expectedOutput: "even\neven\neven", hidden: true },
      { input: "999", expectedOutput: "odd", hidden: true },
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
      kk: "Жаһандық күйді — функциядан тыс тұрып, функция ішінде өзгеретін айнымалыны — қолданудың бір нақты тәуекелін ата. Содан кейін сол тәуекел бағдарламаны құлатпай, үнсіз қате жауап беретін бір жағдайды сипатта: қандай сандар кірді, экранға не шықты, дұрысы қандай болуы керек еді. Бүгінгі мысалдардың біріне сүйенуге болады.",
      ru: "Назови один конкретный риск использования глобального состояния — переменной, которая живёт вне функции, но меняется внутри неё. Затем опиши одну ситуацию, где этот риск не роняет программу, а молча даёт неверный ответ: какие числа были на входе, что вышло на экран и каким ответ должен был быть. Можно опереться на один из сегодняшних примеров.",
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
        kk: "Үнсіз қатенің нақты мысалы: `[1, 2, 3, 4]` және `[5, 6, 7]` тізімдері үшін жұп сандарды санағанда экранға 2 мен 3 шығады, ал екінші тізімде бір ғана жұп сан бар — дұрысы 1 болуы керек еді. Ешқандай қате хабары шықпайды, 3 саны сырттай ақылға қонымды.",
        ru: "Конкретный пример молчаливой ошибки: при подсчёте чётных чисел в списках `[1, 2, 3, 4]` и `[5, 6, 7]` на экран выходят 2 и 3, хотя во втором списке одно чётное число и правильный ответ — 1. Никакого сообщения об ошибке нет, а тройка выглядит правдоподобно.",
      },
      {
        kk: "Шешім — байланысты көрінетін ету: керек мән параметр болып кіреді, нәтиже `return` арқылы шығады. Сонда шақыру жолының өзі функция неден басталатынын айтады және оны бөлек сынауға болады.",
        ru: "Решение — сделать связь видимой: нужное значение входит параметром, результат выходит через `return`. Тогда сама строка вызова говорит, с чего функция начинает, и её можно испытать отдельно.",
      },
    ],
  },
];
