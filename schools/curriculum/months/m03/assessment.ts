import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша — the monthly check. Twenty minutes. PDF p.8.
 *
 * November's «Айлық сынақ» sentence is two sentences, and both are commands:
 *
 *   > Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу, әр
 *   > функцияның міндетін және параметр мен return байланысын түсіндіру.
 *   > Қосымша сұрақта жергілікті және жаһандық айнымалының қай жерде
 *   > қолжетімді екенін көрсетіп, жаһандық айнымалыны қолданудың бір тәуекелін
 *   > атайды.
 *
 * So the check has a fixed shape and this file does not invent one: write a
 * program of at least two or three functions alone (`unseen_problem`); say what
 * each function is responsible for and how its parameters relate to its return
 * value (`explain`); then the additional question, which is itself two halves —
 * SHOW where a local and a global are visible (`manual_trace`, on paper), and
 * NAME one risk of using a global (`oral_explanation`).
 *
 * Four blocks, in that order, and deliberately no fifth. The arithmetic for
 * twenty minutes: the unseen problem is ~11 minutes, the written contract
 * answer ~4, the paper trace ~3, and the oral piece runs alongside while the
 * teacher walks the room. September's assessment was audited at 32+ minutes
 * against a stated 20 because it carried two coding problems and a bug hunt;
 * a fifth graded task here would repeat that, and the month already puts its
 * bug-finding requirement where the PDF puts it — «жергілікті және жаһандық
 * айнымалы қатесін тауып түзету» is a practice family, taught in `m3.l5`.
 *
 * ## Why counting primes, when the month has already written eight functions
 *
 * The check has to be unseen, and November's authored tasks have taken most of
 * the obvious ground: `digit_sum` in l3 and again in l5, `largest`/`smallest`
 * in l8, `is_palindrome` and `only_even` in l8, `count_vowels` + `best_word` in
 * l8's advanced block. Re-dressing any of those is a memory test.
 *
 * What is genuinely new here is the SHAPE, not the arithmetic. One predicate
 * over a single number, and then TWO different list functions that both call
 * it and return two different KINDS of thing — a count, and a position. That
 * is the first time this month a learner has to notice that
 * `first_prime_pos([9, 9])` returning 0 is not "zero primes" but "no answer",
 * and that the two functions differ in their contract, not in their loop. It is
 * exactly what b2 then asks them to write down, so the two blocks are one
 * question asked twice, once in code and once in words.
 *
 * The property itself is deliberately familiar: October taught «жай санды
 * тексеру» as a loop, and November's practice list names «санның қасиетін
 * тексеретін функция». A monthly check should be solvable by a learner who did
 * the month, not exotic. The unseen part is the decomposition and the edges.
 *
 * `sorted`, `min`, `max` and `sum` do not exist until December, which costs
 * this problem nothing: none of the three functions wants them.
 *
 * ## The cases, and the wrong program each one kills
 *
 * Eight cases, seven hidden. Every one was run against the mutant it exists for:
 *
 *   · treats 1 as prime (no `n < 2` guard)   → «1» answers 1/1, «1 2 3 4» 3/1
 *   · reports the LAST prime, not the first  → the visible sample answers 4
 *   · prints the index i, not i + 1          → the visible sample answers 1
 *   · `range(2, n // 2)`, so 4 looks prime   → the visible sample answers 3/1
 *   · returns nothing when no prime is found → «1» and «9 9 9 9» print None
 *   · walks `range(len(a) - 1)`              → «8 9 10 11» answers 0
 *   · "odd means prime"                      → «9 9 9 9» answers 4/1
 *   · `return` inside the counting loop      → «5 5 5» answers 1 instead of 3
 *   · one element, both ways                 → «2» (prime) and «1» (not)
 *
 * «2» is the case worth naming twice. It is the single-element list AND the
 * number whose divisor loop never turns — `range(2, 2)` is empty, so the
 * function returns 1 without ever executing its body. l8 raised that hazard
 * three times on purpose; this is where it is billed.
 *
 * ## The scope question carries its program
 *
 * b3 has a `code` field. `m1.as.b3` shipped without one and rendered as a
 * prompt about "this program" above an empty box, which is why the validator
 * now refuses `manual_trace` and `find_bug` without it.
 *
 * The program has no `global` statement anywhere, and that is the honest way to
 * ask the PDF's question. «Қай жерде қолжетімді екенін көрсету» is about
 * VISIBILITY: a parameter named `count` that shadows a module-level `count`, a
 * local `bonus` that does not exist outside the call, and a second function
 * that reads the module-level name because it has no local one. All three facts
 * are readable off six lines. The keyword itself belongs to `m3.l5`, where the
 * programme asks for «неге global күтпеген нәтиже берді?» to be analysed as a
 * failure — and a reference program in an assessment is not the place to model
 * a technique the month spends a lesson warning about.
 *
 * ## Provenance and tracks
 *
 * September's convention, kept: `verify` blocks implement the five general
 * verification methods of p.6 and cite page 6; the `explain` block asks
 * November's own question in November's own words and cites page 8.
 *
 * No block carries `tracks`. The monthly check is the same twenty minutes for
 * every route — differentiation is in how the month was taught and how early
 * help opened, not in whether a learner is assessed. Advanced's compulsory
 * written defence («шешімді жазбаша қорғау міндетті») is satisfied by the
 * month's lessons, which carry advanced-only blocks; b2 is written work for
 * everyone and is not a substitute for it.
 *
 * Nothing here is machine-scored except b1's cases. b2, b3 and b4 settle as
 * `unknown` and are read by a teacher against the points on the block.
 */
export const M3_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу» — blank
     * editor, no starter, and the prompt states the requirement out loud
     * instead of hoping the learner infers it. It also states the two rules
     * that make the requirement checkable by a human reader: a function that
     * prints is not one of the two or three, and the property check must be its
     * own function rather than an `if` buried in a traversal.
     *
     * The reference is written the way a learner is expected to write it, not
     * the way an adult would: `is_prime` returns 1 or 0 rather than True/False,
     * because `if is_prime(x) == 1` is the form l8 established and booleans are
     * not a November idea. `d * d <= n` would be faster and is accepted by
     * every case; `range(2, n)` is what is defended here, because the numbers
     * stop at 1000 and the simpler loop is the one whose empty body at n = 2
     * the learner can reason about.
     *
     * Two list functions and not one on purpose. They share the predicate and
     * differ in everything else — what they accumulate, what they return, and
     * what they return when nothing matches — which is the distinction b2 is
     * about.
     */
    id: "m3.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген бүтін сандар беріледі: сан саны 1-ден 50-ге дейін, әр сан 1-ден 1000-ға дейін.\n" +
        "Екі жол шығар. Бірінші жолда — тізімдегі жай сандардың саны. Екінші жолда — бірінші жай санның орны; орындар бірден нөмірленеді. Тізімде бірде-бір жай сан болмаса, екінші жолға 0 шығар.\n" +
        "Бағдарламаңды кемінде 2-3 функцияға бөл. Біреуі бір ғана санның жай екенін тексерсін, қалған функциялар тізімді аралап сол функцияны шақырсын — жай санды тексеру логикасы бір жерде ғана жазылуы керек.\n" +
        "Функциялар экранға ештеңе шығармайды: олар нәтижені `return` арқылы қайтарады, ал `input()` пен `print()` тек негізгі бағдарламада болады.\n" +
        "Есіңде болсын: 1 жай сан емес, ең кіші жай сан — 2.\n" +
        "`4 7 9 11 12` берілсе, жауап екі жол: `2`, содан кейін `2`.",
      ru:
        "В одной строке через пробел даны целые числа: их от 1 до 50, каждое от 1 до 1000.\n" +
        "Выведи две строки. В первой — сколько в списке простых чисел. Во второй — позицию первого простого числа; позиции нумеруются с единицы. Если простых чисел в списке нет, во второй строке выведи 0.\n" +
        "Раздели программу минимум на 2–3 функции. Одна проверяет, простое ли отдельное число, остальные проходят по списку и вызывают её — логика проверки на простоту должна быть записана только в одном месте.\n" +
        "Функции ничего не печатают: они возвращают результат через `return`, а `input()` и `print()` есть только в основной программе.\n" +
        "Помни: 1 не является простым числом, наименьшее простое число — 2.\n" +
        "При вводе `4 7 9 11 12` ответ — две строки: `2`, затем `2`.",
    },
    referenceSolution:
      "def is_prime(n):\n" +
      "    if n < 2:\n" +
      "        return 0\n" +
      "    for d in range(2, n):\n" +
      "        if n % d == 0:\n" +
      "            return 0\n" +
      "    return 1\n" +
      "\n" +
      "def count_primes(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if is_prime(x) == 1:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "def first_prime_pos(a):\n" +
      "    for i in range(len(a)):\n" +
      "        if is_prime(a[i]) == 1:\n" +
      "            return i + 1\n" +
      "    return 0\n" +
      "\n" +
      "a = list(map(int, input().split()))\n" +
      "print(count_primes(a))\n" +
      "print(first_prime_pos(a))",
    cases: [
      /* The visible sample, and it is doing real work. 4 is at position 1, so
         `range(2, n // 2)` — the most popular wrong divisor loop — calls it
         prime and answers 3/1 here rather than on a hidden case. The first
         prime is in the middle, so "last prime" answers 4 and "print the index"
         answers 1. Three mutants die before the learner ever submits. */
      { input: "4 7 9 11 12", expectedOutput: "2\n2" },
      /* One element, and it is the smallest prime: `range(2, 2)` never turns,
         so the function returns 1 without executing its body. */
      { input: "2", expectedOutput: "1\n1", hidden: true },
      /* One element, and it is 1. Kills a missing `n < 2` guard, and is the
         shortest input on which "no prime found" has to produce 0 rather than
         fall off the end of the function and print None. */
      { input: "1", expectedOutput: "0\n0", hidden: true },
      /* All equal, all prime: a `return` placed inside the counting loop
         answers 1 instead of 3. */
      { input: "5 5 5", expectedOutput: "3\n1", hidden: true },
      /* All equal, none prime. 9 = 3 × 3, so "odd means prime" answers 4/1
         instead of 0/0, and this is the second witness for the missing-return
         path on the position function. */
      { input: "9 9 9 9", expectedOutput: "0\n0", hidden: true },
      /* The answer is at the last position: a traversal over
         `range(len(a) - 1)` reports 0. */
      { input: "8 9 10 11", expectedOutput: "1\n4", hidden: true },
      /* 1 sits in front of two primes. Counting 1 as prime answers 3/1; the
         correct answer needs the guard AND the position of a prime that is not
         the first element. */
      { input: "1 2 3 4", expectedOutput: "2\n2", hidden: true },
      /* The top of the stated range, both ways: 997 is prime, 1000 is not.
         Also the only case that runs the divisor loop to any depth. */
      { input: "997 1000", expectedOutput: "1\n1", hidden: true },
    ],
  },
  {
    /*
     * «Әр функцияның міндетін және параметр мен return байланысын түсіндіру»,
     * verbatim from p.8, asked about the learner's OWN program — the only way
     * the answer can be theirs rather than recalled from l6.
     *
     * The four points are written so a learner who split the work differently
     * still scores: two functions instead of three, or a single traversal that
     * returns... no, not that — the marking points name the contract, not the
     * file. What is not negotiable is that the property check is its own
     * function, and point 4 is where a marker sees whether the learner
     * understands why.
     *
     * Written, stored, read by a teacher. `explain` settles as `unknown` and
     * nothing about it is graded 0/1.
     */
    id: "m3.as.b2",
    type: "explain",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бірінші тапсырмада өзің жазған бағдарлама туралы жаз. Әр функцияң үшін үш нәрсені ата: (1) ол қандай параметр қабылдайды, (2) ол `return` арқылы нені қайтарады, (3) оның міндеті не — бір сөйлеммен.\n" +
        "Содан кейін екі сұраққа жауап бер. (4) Тізімді өңдейтін функцияларың бір-бірінен несімен ерекшеленеді — олар қайтаратын сан нені білдіреді? (5) Жай санды тексеретін логиканы бөлек функцияға шығарудың пайдасы неде? Оны екі жерге көшіріп жазсаң, не нашарлар еді?",
      ru:
        "Напиши про программу, которую ты написал в первом задании. Для каждой своей функции назови три вещи: (1) какие параметры она принимает, (2) что она возвращает через `return`, (3) в чём её задача — одним предложением.\n" +
        "Затем ответь на два вопроса. (4) Чем отличаются друг от друга твои функции, обрабатывающие список, — что означает возвращаемое каждой из них число? (5) В чём польза от того, что проверка на простоту вынесена в отдельную функцию? Что стало бы хуже, если бы ты скопировал её в два места?",
    },
    expectedPoints: [
      {
        kk: "Жай санды тексеретін функция бір бүтін санды параметр ретінде қабылдайды және сол сан туралы жауапты — 1 немесе 0 — қайтарады. Оның міндеті бір ғана нәрсе: бір санның қасиетін анықтау. Ол тізім туралы да, экран туралы да ештеңе білмейді.",
        ru: "Функция проверки простоты принимает параметром одно целое число и возвращает ответ про это число — 1 или 0. Её задача ровно одна: определить свойство одного числа. Она ничего не знает ни про список, ни про экран.",
      },
      {
        kk: "Тізімді өңдейтін функциялардың параметрі — бүкіл тізім. Санағыш функция тізімдегі жай сандардың санын қайтарады, ал орынды табатын функция орынды қайтарады. Екеуі де жай санды өздері тексермейді: әр элемент үшін бірінші функцияны шақырады.",
        ru: "У функций, обрабатывающих список, параметр — весь список. Считающая функция возвращает количество простых чисел в списке, а функция поиска — позицию. Ни та ни другая не проверяет простоту сама: для каждого элемента она вызывает первую функцию.",
      },
      {
        kk: "Екі функцияның қайтаратын сандары әртүрлі мағынаға ие. Санағыштың 0-і «жай сан жоқ» дегенді білдіреді, ал орынды табатын функцияның 0-і «жауап жоқ» дегенді білдіреді — өйткені нағыз орындар 1-ден басталады, сондықтан 0 ешқандай элементті көрсетпейді. Бұл шарттылық функцияны жазбас бұрын шешіліп алынуы керек.",
        ru: "Числа, возвращаемые двумя функциями, значат разное. Ноль у счётчика означает «простых чисел нет», а ноль у функции поиска означает «ответа нет» — настоящие позиции начинаются с единицы, поэтому 0 не указывает ни на один элемент. Такое соглашение нужно принять до того, как функция написана.",
      },
      {
        kk: "Тексеруді бөлек функцияға шығарғанда ол бір рет қана жазылады және екі жерден шақырылады. Кодты көшіріп жазсаң, кейін қателік тапқанда оны екі жерде де түзету керек болады — біреуі ұмытылып қалса, бағдарлама бір санды жай деп, екіншісін жай емес деп санайды. Оның үстіне бөлек функцияны жеке тексеруге болады: 1, 2 және 9-ды беріп, жауабы дұрыс па екенін бірден көресің.",
        ru: "Когда проверка вынесена в отдельную функцию, она написана один раз и вызывается из двух мест. Если скопировать код, то при обнаружении ошибки исправлять придётся в обоих местах — а забыв про одно, получишь программу, которая одно и то же число в одном месте считает простым, а в другом нет. Кроме того, отдельную функцию можно проверить саму по себе: подставить 1, 2 и 9 и сразу увидеть, верны ли ответы.",
      },
    ],
  },
  {
    /*
     * The first half of the additional question: «жергілікті және жаһандық
     * айнымалының қай жерде қолжетімді екенін КӨРСЕТУ». Showing is a trace, so
     * this is `manual_trace` on paper, and the program is on the block.
     *
     * Six executable lines, three facts:
     *   · `count` inside `step` is the parameter — a different variable that
     *     happens to share a name, and assigning to it leaves the outer one at 7
     *   · `bonus` exists only while `step` runs; naming it outside is an error
     *   · `report` has no local `count`, so it reads the module-level one
     *
     * The output is 8 / 7 / 7, which is the whole trap: the learner who thinks
     * `step` "changed count" predicts 8 / 8 / 8 and finds out on paper rather
     * than in a contest.
     */
    id: "m3.as.b3",
    type: "verify",
    mode: "manual_trace",
    skillRefs: ["scope.local_global", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бұл бағдарламаны компьютерсіз, қағазда орында.\n" +
        "(1) Экранға шығатын үш жолды ретімен жаз.\n" +
        "(2) Кодта `count` деген ат үш жерде кездеседі. Әрқайсысы туралы айт: ол қай айнымалы — функцияның ішіндегісі ме, әлде файлдың басындағысы ма?\n" +
        "(3) `bonus` айнымалысы қай жерде қолжетімді? Соңғы жолдан кейін `print(bonus)` деп жазсаң не болады және неге?\n" +
        "(4) `report()` `count`-ты қайдан оқиды және оның мәні неге 7 болып қалды?",
      ru:
        "Выполни эту программу на бумаге, без компьютера.\n" +
        "(1) Выпиши по порядку три строки, которые появятся на экране.\n" +
        "(2) Имя `count` встречается в коде в трёх местах. Скажи про каждое: это переменная внутри функции или та, что объявлена в начале файла?\n" +
        "(3) Где доступна переменная `bonus`? Что произойдёт, если после последней строки написать `print(bonus)`, и почему?\n" +
        "(4) Откуда `report()` читает `count` и почему его значение осталось равным 7?",
    },
    code:
      "count = 7\n" +
      "\n" +
      "def step(count):\n" +
      "    bonus = 1\n" +
      "    count = count + bonus\n" +
      "    return count\n" +
      "\n" +
      "def report():\n" +
      "    print(count)\n" +
      "\n" +
      "print(step(count))\n" +
      "report()\n" +
      "print(count)",
    expectedPoints: [
      {
        kk: "Үш жол жазылған: 8, содан кейін 7, содан кейін тағы 7.",
        ru: "Выписаны три строки: 8, затем 7, затем снова 7.",
      },
      {
        kk: "`step` ішіндегі `count` — параметр, яғни шақыру кезінде пайда болатын жаңа жергілікті айнымалы. Оған 8 меншіктелгенде тек сол жергілікті айнымалы өзгереді; файлдың басындағы `count` 7 күйінде қалады. Аты бірдей екі айнымалы — бір айнымалы емес.",
        ru: "`count` внутри `step` — это параметр, то есть новая локальная переменная, возникающая при вызове. Присваивание ей значения 8 меняет только эту локальную переменную; `count`, объявленный в начале файла, остаётся равным 7. Две переменные с одинаковым именем — это не одна переменная.",
      },
      {
        kk: "`bonus` тек `step` жұмыс істеп тұрғанда және тек соның ішінде бар. Функция аяқталған соң ол жойылады, сондықтан соңғы жолдан кейінгі `print(bonus)` қате береді: ол жерде мұндай ат мүлде жоқ.",
        ru: "`bonus` существует только во время работы `step` и только внутри неё. После выхода из функции переменная исчезает, поэтому `print(bonus)` после последней строки даст ошибку: такого имени в этом месте просто нет.",
      },
      {
        kk: "`report` ішінде `count` деген жергілікті айнымалы жоқ, сондықтан ол файлдың басындағы `count`-ты оқиды. Оның мәні 7, өйткені оны ешкім өзгерткен жоқ: `step` тек өз параметрін өзгертті. Оқу осылай жұмыс істейді, ал `report` ішінде `count = ...` деп жазсақ, ол сыртқыны өзгертпей, жаңа жергілікті айнымалы жасар еді.",
        ru: "Внутри `report` нет локальной переменной `count`, поэтому она читает `count` из начала файла. Его значение равно 7, потому что его никто не менял: `step` изменила только свой собственный параметр. Чтение работает именно так, а если бы внутри `report` было написано `count = ...`, это создало бы новую локальную переменную и не изменило бы внешнюю.",
      },
    ],
  },
  {
    /*
     * The second half of the additional question: «жаһандық айнымалыны
     * қолданудың бір тәуекелін атайды». One risk, named, plus what actually
     * breaks — a name without a consequence is a slogan.
     *
     * Asked orally, which is p.6's «ауызша түсіндіру», and pointed at a
     * scenario rather than at b3's program, so it is a second independent
     * question and not the spoken half of the trace.
     *
     * The marking points cover the three answers a Grade 9 can genuinely give,
     * and the third is the one `m3.l5` sets up: `global` was needed and absent,
     * so the assignment made a local, and the change vanished at `return`.
     * Settles as `unknown`.
     */
    id: "m3.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["scope.local_global", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Мұғалімге ауызша жауап бер.\n" +
        "(1) Функция параметр арқылы емес, файлдың басындағы жаһандық айнымалы арқылы жұмыс істесе, бұның бір нақты тәуекелін ата.\n" +
        "(2) Сол тәуекел іске асса, бағдарламада нақты не бұзылады? Мысал келтір: қай шақыру дұрыс жауап береді, қайсысы қате береді?\n" +
        "(3) Бірінші тапсырмадағы өз функцияларың бұл тәуекелден неге аман — олар қажет деректі қайдан алды?",
      ru:
        "Ответь учителю устно.\n" +
        "(1) Назови один конкретный риск того, что функция работает не через параметр, а через глобальную переменную, объявленную в начале файла.\n" +
        "(2) Что именно сломается в программе, если этот риск сработает? Приведи пример: какой вызов даст верный ответ, а какой — неверный.\n" +
        "(3) Почему твои функции из первого задания этому риску не подвержены — откуда они брали нужные им данные?",
    },
    expectedPoints: [
      {
        kk: "Нақты тәуекел аталған: жаһандық айнымалыға сүйенген функцияның нәтижесі оның параметрлеріне ғана емес, оған дейін не орындалғанына да байланысты болады. Бірдей шақыру бағдарламаның әр жерінде әртүрлі жауап беруі мүмкін.",
        ru: "Назван конкретный риск: результат функции, опирающейся на глобальную переменную, зависит не только от её параметров, но и от того, что выполнялось до неё. Один и тот же вызов в разных местах программы может дать разный ответ.",
      },
      {
        kk: "Нақты мысал келтірілген. Мысалы, жинақтаушы жаһандық айнымалыда сақталып, шақырудан кейін нөлге қайтарылмаса: бірінші шақыру дұрыс қосындыны береді, ал екінші шақыру оның үстіне қосып, қате жауап шығарады. Қате екінші рет қана көрінеді, сондықтан оны табу қиын.",
        ru: "Приведён конкретный пример. Скажем, накопитель хранится в глобальной переменной и после вызова не обнуляется: первый вызов даёт верную сумму, а второй прибавляет к ней и выдаёт неверный ответ. Ошибка проявляется только со второго раза, поэтому её трудно найти.",
      },
      {
        kk: "Тексеру қиындайтыны айтылған: мұндай функцияны жеке сынап көру мүмкін емес — оның жауабын білу үшін бүкіл бағдарламаның қай сәтте тұрғанын білу керек. Оны басқа бағдарламаға көшіріп алу да мүмкін емес, өйткені ол өзімен бірге сол жаһандық айнымалыны талап етеді.",
        ru: "Сказано, что усложняется проверка: такую функцию нельзя испытать отдельно — чтобы знать её ответ, нужно знать, в каком состоянии находится вся программа. И перенести её в другую программу тоже нельзя, потому что она тянет за собой эту глобальную переменную.",
      },
      {
        kk: "Өз шешімімен байланыстырылған: бірінші тапсырмадағы функциялар қажет деректің бәрін параметр арқылы алды және жауапты `return` арқылы берді, сондықтан олар өздерінен тыс ештеңеге тәуелді емес. Бір функцияны бірдей аргументпен қанша рет шақырсаң да, жауабы бірдей болады.",
        ru: "Есть связь с собственным решением: функции из первого задания получали все нужные данные через параметры и отдавали ответ через `return`, поэтому они не зависят ни от чего вне себя. Сколько раз ни вызови такую функцию с одними и теми же аргументами, ответ будет одним и тем же.",
      },
    ],
  },
];
