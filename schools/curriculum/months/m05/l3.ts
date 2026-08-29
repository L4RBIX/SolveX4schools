import type { LessonBlock } from "../../types";

/**
 * Lesson m5.l3 · «Жауап бойынша іздеу» — searching the answer instead of
 * computing it. PDF p.9, January. Skills: `bsearch.core`, `func.define`.
 *
 * ## The clauses this lesson answers to
 *
 * «Реттелген тізімнен керекті мәнді әр қадамда нұсқалардың жартысын алып
 * тастау арқылы іздеу» — the month's mastery sentence is about a value in a
 * list. This lesson is where that sentence stops being about lists: the thing
 * being halved is no longer a range of positions but a range of possible
 * ANSWERS. Nothing new arrives to make that work. Same loop, same two
 * boundaries, one different question inside the `if`.
 *
 * «берілген аралыққа қанша сан түседі» is the practice family this lesson owns,
 * and it is why the jump is taught here rather than at the end of the month:
 * the count over `[l, r]` is not one search, it is the difference of two, and
 * both of them are the insertion position `m5.l2` has already built. The
 * concept block says that out loud, because a learner who does not hear it
 * writes a loop and counts.
 *
 * «алғашқы екі аптада дайын кодты оқу, түзету және толықтыру көбірек беріледі»
 * — the first half of the month leans on reading, repairing and completing.
 * This lesson closes that half, so it carries five scaffolded blocks (a worked
 * example, a prediction, a choice, a fill-blank, a trace) and one repair
 * (`modify_code`) against two blank editors, one of which support does not
 * receive at all.
 *
 * ## The template, and why it is m5.l2's second one
 *
 * `m5.l2` teaches the two honest ways to write the loop and the rule that
 * separates them: «выбрасываешь середину — пиши `<=`, оставляешь середину —
 * пиши `<`». Every search in this file is the second of those, unchanged:
 *
 *     left  = the smallest value that could still be the answer
 *     right = a value the check is known to ACCEPT
 *     while left < right:  mid = (left + right) // 2
 *         enough(mid) → right = mid      (mid itself stays a candidate)
 *         otherwise   → left = mid + 1   (mid is ruled out)
 *     the answer is left, and by then left == right
 *
 * Inventing a third form here — `lo`/`hi` closing to adjacency — was drafted
 * and thrown away. The names and the rule are the month's, and a lesson that
 * renames the boundaries three weeks in makes the learner relearn a loop they
 * already know instead of learning the new idea, which is the check.
 *
 * That template also gives the month's oral question — «жауаптың неге жоғалып
 * кетпейтіні» — something concrete to point at: if `enough(mid)` holds the
 * answer is at most mid, so keeping mid inside is safe; if it does not, mid is
 * ruled out and nothing below it can help either. Six different checks are
 * poured through the same loop — triangular sums, integer division, a counted
 * threshold, cubes, squares, copier throughput — and no two of the resulting
 * programs are the same text. That was measured, not assumed: every program in
 * this file was compared line by line against every program in months 2–5, and
 * the largest overlap outside the shared four-line skeleton is a single
 * `print`.
 *
 * ## Where a requirement is not enforceable, and what was done about it
 *
 * `m5.l3.b8` (count in `[l, r]`) cannot be graded on method: a linear count
 * with `if x >= l and x <= r` prints the identical number, and no list small
 * enough to sit in this file runs slowly enough to separate the two. **Option 2
 * of the authoring contract** was taken deliberately — the prompt gives the
 * method as advice and says, in both languages, that it is not what the checker
 * compares. The structural work is carried by `b5`, `b6`, `b7` and `b9s`, which
 * examine the search itself rather than a number it produced.
 *
 * `m5.l3.b7` and `m5.l3.b9` needed no such compromise, so they take **option
 * 1**: their largest hidden cases put the answer near 10⁹ and 10¹², where
 * counting k upwards one at a time does not finish. The method is required by
 * the clock, not by a sentence.
 *
 * ## Deliberately left for later
 *
 * No `bisect`, here or anywhere in January. No two-pointer walk (that is
 * `m5.l4`), no merge (`m5.l7`), and no search for the LARGEST passing value
 * rather than the smallest — yes→no is a second direction to get wrong and
 * belongs beside the boundary work, not inside the ten minutes that introduce
 * the idea.
 */
export const M5_L3: LessonBlock[] = [
  {
    id: "m5.l3.b1",
    type: "concept",
    skillRefs: ["bsearch.core", "func.define"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Есептеудің орнына сұрақ қою",
      ru: "Вместо вычисления — вопрос",
    },
    /* Three jobs, in this order on purpose: name the move (ask instead of
       compute), name the property that makes the move legal (monotonicity),
       and only then give the loop — which is m5.l2's, not a new one. A body
       that opens with the loop turns the month's central idea into a template
       to memorise.

       The last paragraph is the lesson's payoff and it belongs here rather
       than at b8: a learner who meets «сколько чисел попадает в промежуток»
       without it writes a counting loop and never finds out that two searches
       would have done it. */
    body: {
      kk: "Кейде жауапты тікелей есептеу қиын, ал «k жетеді ме?» деген сұраққа жауап беру оңай. «Неше минут керек?» дегенді бірден шығару қиын, бірақ «10 минутта үлгереміз бе?» дегенді санап көруге болады.\n\nСол сұрақты функция етіп жазамыз: `def enough(k):` — ол `True` немесе `False` қайтарады. Енді k-ны кіші мәндерден бастап өсіріп қарасаң, жауаптар мынадай тізбек құрайды: жоқ, жоқ, жоқ, иә, иә, иә. Бір рет «иә» болғаннан кейін ол ешқашан «жоқ»-қа қайтпайды. Функцияның осы қасиетін монотондық дейді, ал іздеуді мүмкін ететін де сол: жауаптар реттелген тізбек құрайтындықтан, оларды дәл реттелген тізімдей екіге бөліп іздеуге болады.\n\nІздеу өткен сабақтардағыдай екі шекараны ұстайды, тек олар енді тізімнің орындары емес, k-ның мүмкін мәндері: `left` — жауап бола алатын ең кіші сан, `right` — тексеруден өтетіні белгілі сан. Әр қадамда `mid = (left + right) // 2`. Егер `enough(mid)` шын болса, жауап mid-тен аспайды, сондықтан `right = mid` — mid-тің өзі аралықта қалады. Ал жалған болса, mid жетпейді, демек жауап одан үлкен: `left = mid + 1`. Екі жағдайда да жауап аралықтан шықпайды — жоғалып кетпейтіні де содан. Ортаны аралықта қалдырғандықтан цикл шарты `while left < right` болады, ал цикл бітерде `left` пен `right` теңеседі: сол сан — жауап.\n\nДәл осы әдіс реттелген тізіммен де жұмыс істейді. «Берілген аралыққа қанша сан түседі?» деген сұрақтың жауабы бір емес, екі іздеу: r-ден үлкен бірінші элементтің орнынан l-ден кем емес бірінші элементтің орнын алып тастаймыз, айырмасы — керекті сан. Екеуі де осы айда өтілген «санды қай орынға кірістіру керек» іздеуі, тек x-тің орнында l және r + 1 тұрады.",
      ru: "Иногда ответ трудно вычислить напрямую, зато на вопрос «хватит ли k?» ответить легко. Сразу сказать, сколько нужно минут, трудно, а проверить «успеем ли за 10 минут» — вполне можно.\n\nЭтот вопрос записываем функцией: `def enough(k):` — она возвращает `True` или `False`. Если увеличивать k, начиная с маленьких значений, ответы выстроятся в такую цепочку: нет, нет, нет, да, да, да. Один раз став «да», ответ уже никогда не вернётся к «нет». Это свойство функции называют монотонностью, и именно оно делает поиск возможным: ответы стоят по порядку, а значит, их можно искать делением пополам — так же, как элементы упорядоченного списка.\n\nПоиск, как и на прошлых уроках, держит две границы, только теперь это не позиции в списке, а возможные значения k: `left` — наименьшее число, которое ещё может оказаться ответом, `right` — число, про которое известно, что проверку оно проходит. На каждом шаге `mid = (left + right) // 2`. Если `enough(mid)` истинно, ответ не больше mid, поэтому `right = mid` — сама середина остаётся внутри отрезка. Если ложно, mid не годится, значит ответ больше: `left = mid + 1`. В обоих случаях ответ не выходит за границы — потому он и не теряется. Раз середина остаётся внутри, условие цикла — `while left < right`, а к концу цикла `left` и `right` совпадают: это совпавшее число и есть ответ.\n\nТот же приём работает и с упорядоченным списком. Ответ на вопрос «сколько чисел попадает в заданный промежуток» — это не один поиск, а два: из позиции первого элемента, большего r, вычитаем позицию первого элемента, не меньшего l, и разность и есть ответ. Оба поиска — это тот самый поиск места для вставки числа, который уже был в этом месяце, только вместо x подставляются l и r + 1.",
    },
    /* Not a search — the monotone PICTURE, printed. Five consecutive k, the
       "no no no yes yes" of the body made visible. Deliberately not the search
       template: the first program in this file that contains `while left <
       right` is the worked example, where the reasoning that produces it is on
       screen beside it. Tokens are English (`yes` / `no`), as everywhere. */
    code:
      "def enough(k):\n" +
      "    return k * 4 >= 30\n" +
      "\n" +
      "for k in range(5, 10):\n" +
      "    if enough(k):\n" +
      '        print(k, "yes")\n' +
      "    else:\n" +
      '        print(k, "no")',
  },
  {
    id: "m5.l3.b2",
    type: "worked_example",
    skillRefs: ["bsearch.core", "func.define"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Толық талданған мысал: ең аз күн санын табу",
      ru: "Разобранный пример: находим наименьшее число дней",
    },
    problem: {
      kk: "Айбек бірінші күні 1 кәмпит, екінші күні 2 кәмпит, үшінші күні 3 кәмпит жейді — әр күні алдыңғысынан бір кәмпит артық. Барлығы кемінде 30 кәмпит жеу үшін ең аз неше күн керек?",
      ru: "Айбек в первый день съедает 1 конфету, во второй — 2, в третий — 3, то есть каждый день на одну больше предыдущего. За какое наименьшее число дней он съест хотя бы 30 конфет?",
    },
    steps: [
      {
        kk: "k күнде жалпы саны 1 + 2 + … + k болады. Бұл қосындының қысқа түрі бар: `k * (k + 1) // 2`. Мысалы, 4 күнде 4 * 5 // 2 = 10 кәмпит.",
        ru: "За k дней всего съедено 1 + 2 + … + k. У этой суммы есть короткая запись: `k * (k + 1) // 2`. Например, за 4 дня это 4 * 5 // 2 = 10 конфет.",
      },
      {
        kk: "Жауапты бірден шығарудың орнына «k күн жетеді ме?» деген сұрақты функцияға жазамыз: `def enough(k): return k * (k + 1) // 2 >= 30`. Күн саны өссе, жеген кәмпитінің саны азаймайды — сондықтан жауап «жоқ»-тан «иә»-ге бір-ақ рет ауысады да, кері оралмайды.",
        ru: "Вместо того чтобы сразу вычислять ответ, записываем функцией вопрос «хватит ли k дней?»: `def enough(k): return k * (k + 1) // 2 >= 30`. С ростом числа дней съеденное не уменьшается — поэтому ответ ровно один раз меняется с «нет» на «да» и обратно не возвращается.",
      },
      {
        kk: "Екі шекара керек. `left = 1`: жауап кем дегенде бір күн. `right = 30`: отыз күнде әлдеқашан жеткен, демек жауап одан аспайды. Ізделіп отырған сан — осы екеуінің арасында, шеттерін қоса алғанда.",
        ru: "Нужны две границы. `left = 1`: ответ — не меньше одного дня. `right = 30`: за тридцать дней хватит с запасом, значит ответ не больше. Искомое число лежит между ними, включая сами границы.",
      },
      {
        kk: "Ортасы 15: 15 * 16 // 2 = 120, бұл 30-дан үлкен — иә, `right = 15`. Ортасы 8: 36 — иә, `right = 8`. Ортасы 4: 10, бұл 30-дан кіші — жоқ, `left = 5`. Ортасы 6: 21 — жоқ, `left = 7`. Ортасы 7: 28 — жоқ, `left = 8`.",
        ru: "Середина 15: 15 * 16 // 2 = 120, это больше 30 — да, `right = 15`. Середина 8: 36 — да, `right = 8`. Середина 4: 10, это меньше 30 — нет, `left = 5`. Середина 6: 21 — нет, `left = 7`. Середина 7: 28 — нет, `left = 8`.",
      },
      {
        kk: "Енді `left` пен `right` екеуі де 8 — аралықта бір ғана сан қалды, іздеу бітті. 7 күн жетпейді (28 кәмпит), 8 күн жетеді (36 кәмпит). Жауап — 8. Отыз нұсқаның ішінен ол бес қадамда табылды, ал жауап бірде-бір қадамда аралықтан тыс қалған жоқ.",
        ru: "Теперь `left` и `right` оба равны 8 — в отрезке осталось одно число, поиск закончен. Семи дней не хватает (28 конфет), восьми хватает (36 конфет). Ответ — 8. Из тридцати вариантов он найден за пять шагов, и ни на одном из них ответ не оказался за пределами отрезка.",
      },
    ],
    code:
      "def enough(k):\n" +
      "    return k * (k + 1) // 2 >= 30\n" +
      "\n" +
      "left = 1\n" +
      "right = 30\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if enough(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    result: { kk: "Экранға: 8", ru: "На экран: 8" },
  },
  {
    id: "m5.l3.b3",
    type: "prediction",
    skillRefs: ["bsearch.core", "func.return", "arith.integer_division"],
    sourceType: "product-authored",
    /* Two calls, one on each side of the boundary, so the card shows the
       "no → yes" step itself instead of a single verdict a learner could guess
       at fifty-fifty. The trap is `//`: 19 / 4 is 4.75, and rounding that up is
       the only route to answering yes twice — which is why that option is the
       only one carrying a mapping. */
    prompt: {
      kk: "`enough` функциясы `k // 4 >= 5` шартын тексереді. Бағдарлама екі жолға `yes` немесе `no` сөзін шығарады, басқа сөз шықпайды. Экранда не болады?",
      ru: "Функция `enough` проверяет условие `k // 4 >= 5`. Программа выводит в двух строках слово `yes` или `no`, других слов не будет. Что окажется на экране?",
    },
    code:
      "def enough(k):\n" +
      "    return k // 4 >= 5\n" +
      "\n" +
      "if enough(19):\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")\n' +
      "if enough(20):\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    answer: "no\nyes",
    options: ["no\nyes", "yes\nyes", "no\nno", "yes\nno"],
    diagnosticMapping: {
      "yes\nyes": {
        failureClass: "integer_division_rounded_up",
        justification:
          "`19 // 4` — бүтін бөлу, ол 4 береді де, қалдықты тастайды. Екі жолға да `yes` деген жауап тек 19 // 4 нәтижесін 5-ке дейін дөңгелектегенде ғана шығады: шын мәнінде 4 >= 5 жалған, сондықтан бірінші жол `no` болуға тиіс.",
      },
    },
  },
  {
    id: "m5.l3.b4",
    type: "multiple_choice",
    skillRefs: ["bsearch.core", "func.define", "logic.and_or_not"],
    sourceType: "product-authored",
    /* Every distractor is genuinely non-monotone, which is the point of the
       card: check1 alternates for ever, check3 is true only inside a window,
       check4 has a single hole at k = 7. A "monotone but decreasing" option was
       drafted and deleted — yes→no is still searchable, so offering it as a
       wrong answer would teach something false. That direction is named in the
       file header as out of scope instead. */
    prompt: {
      kk: "k — теріс емес бүтін сан. Төрт тексерудің қайсысында k өскен сайын жауап «жоқ»-тан «иә»-ге бір рет ауысады да, содан кейін ешқашан «жоқ»-қа қайтпайды? Тек сондай тексеру бойынша ғана k-ны екіге бөліп іздеуге болады.",
      ru: "k — целое неотрицательное число. В какой из четырёх проверок ответ при росте k один раз меняется с «нет» на «да» и после этого уже никогда не возвращается к «нет»? Только по такой проверке можно искать k делением пополам.",
    },
    code:
      "def check1(k):\n" +
      "    return k % 2 == 0\n" +
      "\n" +
      "def check2(k):\n" +
      "    return 12 * k >= 500\n" +
      "\n" +
      "def check3(k):\n" +
      "    return k >= 10 and k <= 20\n" +
      "\n" +
      "def check4(k):\n" +
      "    return k != 7",
    options: [
      {
        id: "o1",
        label: { kk: "check1 — k жұп сан ба", ru: "check1 — чётное ли число k" },
      },
      {
        id: "o2",
        label: {
          kk: "check2 — 12 * k 500-ден кем емес пе",
          ru: "check2 — верно ли, что 12 * k не меньше 500",
        },
      },
      {
        id: "o3",
        label: {
          kk: "check3 — k 10 мен 20 аралығында ма",
          ru: "check3 — попадает ли k в промежуток от 10 до 20",
        },
      },
      {
        id: "o4",
        label: { kk: "check4 — k жетіге тең емес пе", ru: "check4 — верно ли, что k не равно 7" },
      },
    ],
    correctOptionId: "o2",
    /* No mapping. o1, o3 and o4 are all reachable from one and the same
       misreading — "it is true somewhere" instead of "once true, always true" —
       so none of them proves anything the others do not, and the engine should
       ask rather than assert. */
  },
  {
    id: "m5.l3.b5",
    type: "fill_blank",
    skillRefs: ["bsearch.core", "func.define", "bsearch.boundary"],
    sourceType: "product-authored",
    /* The check is given complete and the three blanks are the three decisions
       the search itself makes: which function answers the question, and which
       boundary each verdict moves. `mid` and `mid + 1` are left visible — the
       asymmetry between them IS m5.l2's rule, and a learner who has to say
       which branch keeps the middle is using that rule rather than reciting it.

       The check counts, and that is deliberate. The first draft used the
       one-line `2 ** k >= n`, which made this filled template b7's reference
       solution with a single line changed — a learner who finished this card
       could have answered the next coding block by editing one comparison. A
       check with a loop in it removes that shortcut and costs nothing: the
       blanks are still the search, not the counting. */
    prompt: {
      kk: "Жарыста жүгірген оқушылардың уақыттары берілген (секундпен, әрқайсысы 1000-нан аспайды). Мектеп уақыт шегін белгілегісі келеді: шектен аспаған оқушы келесі кезеңге өтеді. Кемінде m оқушы өту үшін шектің ең кіші мәні қандай болуы керек? Бірінші жолда m саны, екінші жолда уақыттар беріледі; m оқушылар санынан аспайды. Іздеу мен тексеру жазылып қойған, үш орын ғана бос: сұраққа жауап беретін функцияның аты, «иә» шыққанда қай шекара жылжитыны және «жоқ» шыққанда қайсысы жылжитыны.",
      ru: "Даны результаты школьников в забеге (в секундах, каждый не больше 1000). Школа хочет назначить временной порог: кто уложился в порог, тот проходит дальше. Каким наименьшим может быть порог, чтобы дальше прошли хотя бы m человек? В первой строке дано m, во второй — времена; m не больше количества участников. Поиск и проверка уже написаны, пусто только в трёх местах: имя функции, отвечающей на вопрос, а также то, какая граница сдвигается при ответе «да» и какая — при ответе «нет».",
    },
    template:
      "m = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "\n" +
      "def enough(k):\n" +
      "    cnt = 0\n" +
      "    for x in a:\n" +
      "        if x <= k:\n" +
      "            cnt += 1\n" +
      "    return cnt >= m\n" +
      "\n" +
      "left = 0\n" +
      "right = 1000\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if ___(mid):\n" +
      "        ___ = mid\n" +
      "    else:\n" +
      "        ___ = mid + 1\n" +
      "print(left)",
    blanks: [
      { id: "f1", answer: "enough" },
      { id: "f2", answer: "right" },
      { id: "f3", answer: "left" },
    ],
  },
  {
    id: "m5.l3.b6",
    type: "trace_code",
    skillRefs: ["bsearch.core", "bsearch.boundary", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /* The month's «міндетті визуалды анимация» is not built yet, and this is
       what carries its weight meanwhile: the learner writes the two boundaries
       down by hand instead of watching them close. State is recorded at line 8
       — the moment BEFORE the verdict is applied — so `ok` is a column that has
       to be computed rather than read off the next line. The cube keeps that
       column honest: 5³ and 7³ are not obvious at a glance. */
    prompt: {
      kk: "Бағдарлама `k * k * k` мәні 200-ден кем болмайтын ең кіші k-ны іздейді. 8-жол орындалар алдындағы әр сәтті жаз: сол кездегі `left`, `right`, `mid` мәндері және `big(mid)` не қайтарады — `True` немесе `False`. Соңғы жолға цикл біткендегі `left` пен `right`-ты жаз.",
      ru: "Программа ищет наименьшее k, при котором `k * k * k` не меньше 200. Записывай каждый момент перед выполнением строки 8: значения `left`, `right`, `mid` в этот момент и то, что вернёт `big(mid)` — `True` или `False`. В последней строке запиши `left` и `right` после выхода из цикла.",
    },
    code:
      "def big(k):\n" +
      "    return k * k * k >= 200\n" +
      "\n" +
      "left = 0\n" +
      "right = 40\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if big(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    steps: [
      { line: 8, vars: { left: "0", right: "40", mid: "20", ok: "True" } },
      { line: 8, vars: { left: "0", right: "20", mid: "10", ok: "True" } },
      { line: 8, vars: { left: "0", right: "10", mid: "5", ok: "False" } },
      { line: 8, vars: { left: "6", right: "10", mid: "8", ok: "True" } },
      { line: 8, vars: { left: "6", right: "8", mid: "7", ok: "True" } },
      { line: 8, vars: { left: "6", right: "7", mid: "6", ok: "True" } },
      { line: 12, vars: { left: "6", right: "6" } },
    ],
  },
  {
    id: "m5.l3.b7",
    type: "modify_code",
    skillRefs: ["bsearch.core", "func.define", "bsearch.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /* The starting program is the month's canonical membership search — the
       closed range `while left <= right`, which m5.l1 taught and m5.l2 repaired
       — and the target is this lesson's half-open form. Reusing a shape the
       learner has already finished is the whole point of a modify_code, and
       inventing an unfamiliar list search to convert would have made this
       harder without making it more instructive. It is a reuse of the shape,
       not of the text: no program in this file is byte-identical to any other
       in the curriculum.

       The gap between the two forms is the exercise. It cannot be crossed by
       renaming, only by noticing that `a[mid]` was the single thing tying the
       search to a list, and that once it is gone the boundaries mean candidate
       ANSWERS and the stopping rule changes with them.

       Deliberately NOT the first-position-at-least search: that loop is the
       inside of b8, and putting it on screen here would answer b8 before it is
       asked.

       Option 1 from the contract: the last two hidden cases put the answer at
       10⁹, so counting k upwards does not finish inside any time limit. The
       method is required by the clock rather than by a sentence no checker can
       read. */
    prompt: {
      kk: "Төмендегі бағдарлама реттелген тізімнен x санын іздеп, `yes` немесе `no` шығарады. Ондағы іздеу тізімнің орындары бойынша жүреді. Оны жауап бойынша іздеуге ауыстыр.\n\nЖаңа бағдарлама бір бүтін сан n оқиды (1 ≤ n ≤ 10¹⁸) және `k * k` мәні n-нен кем болмайтын ең кіші бүтін k-ны шығарады. Тізім де, x та енді керек емес: `a[mid]`-ті тексерудің орнына `mid`-тің өзін тексеретін функция жаз. Шекаралар да басқаша: олар енді тізімнің орындары емес, k-ның мүмкін мәндері. n өте үлкен болуы мүмкін, сондықтан k-ны 1-ден бастап біртіндеп өсіріп санау үлгермейді — шешім екіге бөлу болып қалуға тиіс.",
      ru: "Программа ниже ищет число x в упорядоченном списке и выводит `yes` или `no`. Поиск в ней идёт по позициям списка. Переделай его в поиск по ответу.\n\nНовая программа читает одно целое число n (1 ≤ n ≤ 10¹⁸) и выводит наименьшее целое k, при котором `k * k` не меньше n. Ни список, ни x больше не нужны: вместо проверки `a[mid]` напиши функцию, которая проверяет само `mid`. Границы тоже меняют смысл: теперь это не позиции в списке, а возможные значения k. Число n может быть очень большим, поэтому перебирать k подряд, начиная с единицы, не успеешь — решение должно остаться делением пополам.",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      'found = "no"\n' +
      "while left <= right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] == x:\n" +
      '        found = "yes"\n' +
      "        break\n" +
      "    if a[mid] < x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid - 1\n" +
      "print(found)",
    referenceSolution:
      "n = int(input())\n" +
      "\n" +
      "def ok(k):\n" +
      "    return k * k >= n\n" +
      "\n" +
      "left = 0\n" +
      "right = n\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if ok(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    /* Cases against named wrong programs:
       "1"     the smallest input — a search that stops one short, or that
               prints `right - 1`, answers 0 here, a k that fails the condition;
       "16"    an exact square, so `>` written where `>=` was meant answers 5;
       "17"    one past that square, the other side of the same boundary;
       "2"     the first n whose answer is not 1;
       the two eighteen-digit cases make a k-by-k count run for minutes, so the
               linear program returns nothing at all rather than something
               wrong. */
    cases: [
      { input: "1", expectedOutput: "1" },
      { input: "10", expectedOutput: "4" },
      { input: "16", expectedOutput: "4", hidden: true },
      { input: "17", expectedOutput: "5", hidden: true },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "1000000", expectedOutput: "1000", hidden: true },
      { input: "999999999999999999", expectedOutput: "1000000000", hidden: true },
      { input: "1000000000000000000", expectedOutput: "1000000000", hidden: true },
    ],
  },
  {
    id: "m5.l3.b8",
    type: "write_code",
    skillRefs: ["bsearch.core", "func.define", "func.reuse", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /* The PDF family «берілген аралыққа қанша сан түседі», and the first task
       in the year whose answer is the DIFFERENCE of two searches.

       Option 2 from the contract, taken because option 1 is unavailable here: a
       linear count prints the same number, and no list small enough to live in
       this file runs slowly enough to separate the two. So the method is
       labelled as advice, in both languages, and every case below is aimed at
       the errors that ARE visible in the output — which, for this task, are
       almost all boundary errors. */
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Олар өспелі ретпен реттелген — бірдей сандар қатар тұруы мүмкін, бірақ өзің реттеудің қажеті жоқ. Екінші жолда аралықтың екі шекарасы: l және r (l ≤ r). Осы аралыққа түсетін, яғни l-ден кем емес әрі r-ден артық емес сандардың санын шығар.\n\nМысалы, `1 3 3 5 8` тізімі мен `3 5` аралығы үшін жауап 3 — бұл 3, 3 және 5.\n\nКеңес (тексеруші тек шыққан санды салыстырады, сондықтан бұл бағаға әсер етпейді — бірақ жаттығудың мәні осында): «мәні x-тен кем емес бірінші элементтің орнын» қайтаратын функция жаз да, оны екі рет шақыр — алдымен r + 1 үшін, сосын l үшін — және екеуінің айырмасын шығар.",
      ru: "В первой строке даны целые числа через пробел (хотя бы одно). Они уже упорядочены по возрастанию — одинаковые числа могут стоять рядом, но сортировать самому ничего не нужно. Во второй строке даны две границы промежутка: l и r (l ≤ r). Выведи, сколько чисел попадает в этот промежуток, то есть не меньше l и не больше r.\n\nНапример, для списка `1 3 3 5 8` и промежутка `3 5` ответ равен 3 — это 3, 3 и 5.\n\nСовет (проверяющая система сравнивает только выведенное число, так что на оценку это не влияет, — но именно в нём смысл упражнения): напиши функцию, которая возвращает позицию первого элемента со значением не меньше x, и вызови её дважды — сначала для r + 1, потом для l, — а затем выведи разность.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "l, r = map(int, input().split())\n" +
      "\n" +
      "def first_at_least(a, x):\n" +
      "    left = 0\n" +
      "    right = len(a)\n" +
      "    while left < right:\n" +
      "        mid = (left + right) // 2\n" +
      "        if a[mid] >= x:\n" +
      "            right = mid\n" +
      "        else:\n" +
      "            left = mid + 1\n" +
      "    return left\n" +
      "\n" +
      "print(first_at_least(a, r + 1) - first_at_least(a, l))",
    /* Named wrong programs, and the case that kills each:
       counts only strictly inside (`x > l and x < r`) → "2 4 6" / "2 6", where
           both endpoints are in the list, answers 1 instead of 3;
       forgets the + 1 and computes first(r) - first(l) → the same case answers
           2, and "2 2 2 5" / "2 2" answers 0 instead of 3;
       prints len(a), or counts without testing → "5 6 7" / "1 4" and
           "5 6 7" / "8 100", where the answer is 0 on either side of the list;
       counts nothing, or an accumulator that never fires → "3 3 3" / "1 10",
           where the whole list qualifies;
       a search that assumes the target is present → "10 20 30" / "15 25",
           where neither boundary is a member of the list;
       an index that walks off the end → "7" / "7 7", one element sitting on
           both boundaries at once. */
    cases: [
      { input: "1 3 3 5 8\n3 5", expectedOutput: "3" },
      { input: "2 4 6\n2 6", expectedOutput: "3" },
      { input: "5 6 7\n1 4", expectedOutput: "0", hidden: true },
      { input: "5 6 7\n8 100", expectedOutput: "0", hidden: true },
      { input: "3 3 3\n1 10", expectedOutput: "3", hidden: true },
      { input: "2 2 2 5\n2 2", expectedOutput: "3", hidden: true },
      { input: "7\n7 7", expectedOutput: "1", hidden: true },
      { input: "-5 -3 0 4\n-3 0", expectedOutput: "2", hidden: true },
      { input: "10 20 30\n15 25", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m5.l3.b9",
    type: "write_code",
    skillRefs: ["bsearch.core", "func.define", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    /* The lesson's independent task: nothing on an earlier card computes a
       throughput, so the check has to be invented rather than adapted.

       The upper bound is given as an ARGUMENT and not as a line of code, on
       purpose. Finding a value the check is guaranteed to accept is the second
       half of this method and the half learners skip; saying "one machine alone
       would manage it" leaves the line itself to be written.

       Option 1 again: the last case puts the answer near 10¹², so a program
       that tries k = 1, 2, 3 … never reports anything. */
    prompt: {
      kk: "Мектепте бірнеше көшірме аппараты бар және олар бір мезгілде жұмыс істейді. Бірінші жолда керекті көшірме саны n беріледі (1 ≤ n ≤ 1 000 000). Екінші жолда әр аппараттың бір көшірмеге кететін уақыты бос орынмен бөлініп беріледі, минутпен (әрқайсысы 1-ден кем емес). Уақыты t болатын аппарат k минутта `k // t` көшірме жасайды — тек толық көшірмелер саналады.\n\nБарлық аппарат бірге кемінде n көшірме жасап үлгеретін ең аз k минутты шығар.\n\nСандар үлкен, сондықтан k-ны 1, 2, 3 деп қатарынан санап шығу үлгермейді. «k минут жетеді ме?» деген тексеруді функция етіп жаз да, k-ны екіге бөліп ізде. Жоғарғы шекараны қалай табуға болады? Тек бірінші аппараттың өзі де n көшірмені белгілі бір уақытта жасап бітіреді — сол уақыт әрқашан жетеді.",
      ru: "В школе несколько копировальных аппаратов, и работают они одновременно. В первой строке дано нужное число копий n (1 ≤ n ≤ 1 000 000). Во второй строке через пробел даны времена аппаратов: сколько минут каждый тратит на одну копию (каждое не меньше 1). Аппарат со временем t за k минут делает `k // t` копий — считаются только целые копии.\n\nВыведи наименьшее k минут, за которое все аппараты вместе сделают хотя бы n копий.\n\nЧисла большие, поэтому перебирать k подряд — 1, 2, 3 — не успеешь. Запиши проверку «хватит ли k минут?» функцией и ищи k делением пополам. Как найти верхнюю границу: даже один первый аппарат когда-нибудь сделает все n копий сам, и этого времени хватает всегда.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "t = list(map(int, input().split()))\n" +
      "\n" +
      "def enough(k):\n" +
      "    total = 0\n" +
      "    for x in t:\n" +
      "        total += k // x\n" +
      "    return total >= n\n" +
      "\n" +
      "left = 1\n" +
      "right = n * t[0]\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if enough(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    /* Named wrong programs, and the case that kills each:
       `/` instead of `//`, counting fractions of a copy → "7" / "3 5" gives 14;
       `>` instead of `>=` in the check → "4" / "2 2" gives 6 instead of 4;
       printing the boundary that was never accepted → wrong by one on every
           case here, the two visible ones included;
       printing n * t[0] without searching at all → "3" / "10 2" gives 30;
       assuming every machine contributes → "2" / "1000000000 1", where the slow
           machine produces nothing at all in the answer's two minutes;
       counting k upwards one at a time → "1000000" / "999983", whose answer is
           999 983 000 000 and which therefore never finishes. */
    cases: [
      { input: "7\n3 5", expectedOutput: "15" },
      { input: "4\n2 2", expectedOutput: "4" },
      { input: "1\n7", expectedOutput: "7", hidden: true },
      { input: "1\n1", expectedOutput: "1", hidden: true },
      { input: "3\n10 2", expectedOutput: "6", hidden: true },
      { input: "5\n1", expectedOutput: "5", hidden: true },
      { input: "2\n1000000000 1", expectedOutput: "2", hidden: true },
      { input: "1000000\n7 11", expectedOutput: "4277779", hidden: true },
      { input: "1000000\n999983", expectedOutput: "999983000000", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m5.l3.b9 — the same copier problem, completed
       instead of written. PDF p.6: «дайын кодты құрастыру мен толықтыру
       көбірек, нөлден жазу азырақ», reinforced by January's own «алғашқы екі
       аптада … толықтыру көбірек беріледі».

       The problem is restated in full: a support learner never sees b9, so a
       prompt pointing at "the task above" would point at a different card.

       This is NOT b9's reference solution with holes punched in it. Here the
       check takes the list and the target as parameters and the call passes
       them — November's own shape, one line more explicit — where b9's
       reference reads both from outside the function. So no program on the
       support route is the text of a solution stored elsewhere in the lesson.

       Four blanks, four separate decisions: whole copies rather than fractional
       ones, "at least need" rather than "more than need", and which boundary
       each verdict moves. */
    id: "m5.l3.b9s",
    type: "fill_blank",
    skillRefs: ["bsearch.core", "func.parameters", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Мектепте бірнеше көшірме аппараты бар, олар бір мезгілде жұмыс істейді. Бірінші жолда керекті көшірме саны n, екінші жолда әр аппараттың бір көшірмеге кететін уақыты (минутпен) беріледі. Бағдарлама барлық аппарат бірге кемінде n көшірме жасап үлгеретін ең аз k минутты табады.\n\nТөрт орын бос. Біріншісі: уақыты x болатын аппарат k минутта неше ТОЛЫҚ көшірме жасайтынын есептейтін амал. Екіншісі: «кемінде need» дегенді білдіретін салыстыру белгісі. Қалған екеуі: «иә» шыққанда қай шекара жаңаратыны және «жоқ» шыққанда қайсысы жаңаратыны.",
      ru: "В школе несколько копировальных аппаратов, и работают они одновременно. В первой строке дано нужное число копий n, во второй — времена аппаратов: сколько минут каждый тратит на одну копию. Программа находит наименьшее k минут, за которое все аппараты вместе сделают хотя бы n копий.\n\nПустых мест четыре. Первое: действие, которое считает, сколько ЦЕЛЫХ копий успевает сделать за k минут аппарат со временем x. Второе: знак сравнения со смыслом «не меньше need». Оставшиеся два: какая граница обновляется при ответе «да» и какая — при ответе «нет».",
    },
    template:
      "n = int(input())\n" +
      "t = list(map(int, input().split()))\n" +
      "\n" +
      "def enough(k, times, need):\n" +
      "    total = 0\n" +
      "    for x in times:\n" +
      "        total += k ___ x\n" +
      "    return total ___ need\n" +
      "\n" +
      "left = 1\n" +
      "right = n * t[0]\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if enough(mid, t, n):\n" +
      "        ___ = mid\n" +
      "    else:\n" +
      "        ___ = mid + 1\n" +
      "print(left)",
    blanks: [
      { id: "f1", answer: "//" },
      { id: "f2", answer: ">=" },
      { id: "f3", answer: "right" },
      { id: "f4", answer: "left" },
    ],
  },
];
