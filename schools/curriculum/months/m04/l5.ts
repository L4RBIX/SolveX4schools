import type { LessonBlock } from "../../types";

/**
 * m4.l5 · «Префикс қосынды» / «Префиксные суммы» — 9 minutes.
 *
 * Skills: `precompute.prefix`, `loops.accumulator`.
 *
 * ## Which clause of the programme this lesson owns
 *
 * PDF p.8 lists December's practice families, and this lesson is one of them
 * verbatim: «тізім бөлігінің қосындысы туралы көп сұраққа тез жауап беру» —
 * answering many questions about the sum of a part of the list, quickly. It is
 * the family the whole month builds towards, because it is the first place the
 * month's own sentence — «дұрыс жауап тым кеш шықса, қабылданбайды» — bites on
 * a task where the naive program is not merely slower but hopeless: a hundred
 * thousand queries over a hundred thousand numbers.
 *
 * It is also the month's method (p.8, «бір есептің екі шешімін салыстыру»)
 * applied to precomputation rather than to sorting: the same problem, answered
 * twice, once by re-walking the segment and once from a table filled in
 * advance. The concept block names the slow form out loud instead of hiding it.
 *
 * ## One convention, stated once, used everywhere
 *
 * `p[0] = 0` and `p[i] = p[i-1] + a[i-1]`, so `p[i]` is the sum of the FIRST i
 * elements and the sum of `a[l..r]` (0-based, both ends included) is
 * `p[r + 1] - p[l]`. Every block below uses that and only that. A lesson that
 * carries two conventions — 0-based here, 1-based there — does not teach the
 * off-by-one, it teaches the confusion, so the 1-based query positions a
 * contest statement would use are converted explicitly (`l = L - 1`,
 * `r = R - 1`) in every program rather than folded into a second formula.
 * The conversion is part of the exercise, not an accident of it.
 *
 * ## Three authoring decisions that are not obvious
 *
 * 1. **The find_bug (b7) tells the learner that lines 7–8 are correct.** It has
 *    to. Without that sentence the block has two defensible answers: the
 *    program is repaired either at line 9 (`p[r]` → `p[r + 1]`) or at line 8
 *    (`r = R - 1` → `r = R`, which silently turns the printed expression into
 *    the 1-based formula and is also right). Naming the two conversion lines as
 *    given removes the ambiguity and costs nothing — the error being hunted is
 *    in the READ, and saying so is scaffolding, not giving the answer away.
 *
 * 2. **The support twin (b8s) is a `modify_code` whose starting program answers
 *    exactly ONE query.** It builds the table, reads `q`, and then ignores it.
 *    So the learner cannot pass by leaving it alone — every case has q ≥ 2 and
 *    the untouched program prints one line where several are wanted — and the
 *    edit that is left is the lesson's actual idea: the query loop goes around
 *    the answering, and the table stays OUTSIDE it. Nothing on a neighbouring
 *    card is that program: b2 hard-codes its list and takes no input at all,
 *    b7 hard-codes its list and takes one query. The twin is reconstruction,
 *    not transcription.
 *
 * 3. **b9 counts segments with a double loop over prefix pairs, and says so.**
 *    A dict of prefix counts solves it in one pass, and `dict` is not taught
 *    this year — but the honest thing is not to hide the cost, it is to bound
 *    it: n ≤ 1000 makes n²/2 pairs about half a million, which is fine, and the
 *    prompt states that the third loop — recomputing each segment's sum — is
 *    the one that would not fit. That is the month's judgement being practised
 *    on the learner's own solution.
 */

const P = 8; // PDF page for all of December

export const M4_L5: LessonBlock[] = [
  {
    id: "m4.l5.b1",
    type: "concept",
    skillRefs: ["precompute.prefix", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Префикс кесте: бір рет толтыр, көп рет пайдалан",
      ru: "Префиксная таблица: заполни один раз, используй много раз",
    },
    body: {
      kk: "Тізімнің бір бөлігінің қосындысы сұралсын. Бір сұрауға жауап беру оңай: сол бөлікті аралап шығасың. Бірақ сұрау жүз мың болса, әр сұрау сайын тізімді қайта аралау уақытқа мүлде сыймайды.\n\nСондықтан жұмысты алдын ала жасаймыз. `p` деген жаңа тізім құрамыз, онда `p[i]` — тізімнің АЛҒАШҚЫ i элементінің қосындысы. Осыдан екі нәрсе шығады: `p[0] = 0`, өйткені бос бөліктің қосындысы нөл, ал қалғаны `p[i] = p[i-1] + a[i-1]` ережесімен толады. Сондықтан `p` тізімінде n емес, n + 1 сан болады.\n\nЕнді 0-ден бастап санағанда a[l..r] бөлігінің қосындысы (екі шеті де кіреді) — алғашқы r+1 элементтің қосындысынан алғашқы l элементтің қосындысын алып тастау: `p[r + 1] - p[l]`. Осы сабақтағы барлық блок дәл осы бір ережені қолданады.\n\nСұрау 1-ден бастап берілсе (L және R), алдымен `l = L - 1` және `r = R - 1` деп аударамыз, содан кейін сол ережені қолданамыз.\n\nОсы айда `sum()` пайда болды: `sum(a)` бүкіл тізімнің, `sum(a[l:r+1])` бөліктің қосындысын береді. Ол дұрыс жауап береді, бірақ әр сұрау үшін бөлікті қайтадан аралайды — біз дәл содан құтылғымыз келеді.",
      ru: "Пусть спрашивают сумму какого-то участка списка. На один запрос ответить легко: пройти по этому участку. Но если запросов сто тысяч, проходить список заново на каждый запрос — это уже никак не уложится во время.\n\nПоэтому сделаем работу заранее. Построим новый список `p`, в котором `p[i]` — это сумма ПЕРВЫХ i элементов. Отсюда сразу два следствия: `p[0] = 0`, потому что сумма пустого участка равна нулю, а остальное заполняется по правилу `p[i] = p[i-1] + a[i-1]`. Значит, в списке `p` не n, а n + 1 число.\n\nТеперь сумма участка a[l..r] при нумерации с 0 (оба конца включаются) — это сумма первых r+1 элементов минус сумма первых l элементов: `p[r + 1] - p[l]`. Все блоки этого урока пользуются только этим правилом.\n\nЕсли запрос дан с нумерацией от 1 (L и R), сначала переводим: `l = L - 1` и `r = R - 1`, а дальше применяем то же правило.\n\nВ этом месяце появился `sum()`: `sum(a)` даёт сумму всего списка, а `sum(a[l:r+1])` — сумму участка. Ответ будет верным, но участок при этом обходится заново на каждый запрос — а мы как раз от этого и уходим.",
    },
    code: "a = [4, 7, 2, 9]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\n# p = [0, 4, 11, 13, 22]\nprint(p[3] - p[1])  # 9 = a[1] + a[2]",
  },
  {
    /* PDF p.8 names the family; the numbers, the two queries and the order of
       the reasoning are the product's. The list is deliberately short enough
       that the learner can add it up by hand and catch the table lying. */
    id: "m4.l5.b2",
    type: "worked_example",
    skillRefs: ["precompute.prefix", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: кестені толтырып, екі сұрауға жауап беру",
      ru: "Разобранный пример: заполняем таблицу и отвечаем на два запроса",
    },
    problem: {
      kk: "a = [3, 1, 4, 1, 5] тізімі берілген. Екі сұрауға жауап беру керек: 2-орыннан 3-орынға дейінгі элементтердің қосындысы және 1-орыннан 5-орынға дейінгі элементтердің қосындысы. Орындар 1-ден басталады, екі шеті де кіреді.",
      ru: "Дан список a = [3, 1, 4, 1, 5]. Нужно ответить на два запроса: сумма элементов со 2-й по 3-ю позицию и сумма элементов с 1-й по 5-ю позицию. Позиции нумеруются с 1, оба конца включаются.",
    },
    steps: [
      {
        kk: "Кестенің бірінші ұяшығы — p[0] = 0. Бұл «әлі бір де элемент алынбаған» деген жағдай, оның қосындысы нөл. Осы нөл болмаса, кейінгі азайту жұмыс істемейді.",
        ru: "Первая ячейка таблицы — p[0] = 0. Это случай «не взято ещё ни одного элемента», его сумма равна нулю. Без этого нуля дальнейшее вычитание работать не будет.",
      },
      {
        kk: "Қалғанын p[i] = p[i-1] + a[i-1] ережесімен бірінен соң бірін толтырамыз: p[1] = 0 + 3 = 3, p[2] = 3 + 1 = 4, p[3] = 4 + 4 = 8, p[4] = 8 + 1 = 9, p[5] = 9 + 5 = 14. Кесте дайын: p = [0, 3, 4, 8, 9, 14].",
        ru: "Остальное заполняем по правилу p[i] = p[i-1] + a[i-1], одну ячейку за другой: p[1] = 0 + 3 = 3, p[2] = 3 + 1 = 4, p[3] = 4 + 4 = 8, p[4] = 8 + 1 = 9, p[5] = 9 + 5 = 14. Таблица готова: p = [0, 3, 4, 8, 9, 14].",
      },
      {
        kk: "Бірінші сұрау — 2-ден 3-ке дейін, орындар 1-ден саналған. Аударамыз: l = 2 - 1 = 1, r = 3 - 1 = 2.",
        ru: "Первый запрос — со 2-й по 3-ю, позиции считались от 1. Переводим: l = 2 - 1 = 1, r = 3 - 1 = 2.",
      },
      {
        kk: "Ережеге саламыз: p[r + 1] - p[l] = p[3] - p[1] = 8 - 3 = 5. Қолмен тексерейік: a[1] + a[2] = 1 + 4 = 5. Дәл келді.",
        ru: "Подставляем в правило: p[r + 1] - p[l] = p[3] - p[1] = 8 - 3 = 5. Проверим руками: a[1] + a[2] = 1 + 4 = 5. Сошлось.",
      },
      {
        kk: "Екінші сұрау — 1-ден 5-ке дейін, яғни бүкіл тізім. l = 0, r = 4, демек p[5] - p[0] = 14 - 0 = 14. Міне, p[0] = 0 осында керек болды.",
        ru: "Второй запрос — с 1-й по 5-ю, то есть весь список. l = 0, r = 4, значит p[5] - p[0] = 14 - 0 = 14. Вот здесь и понадобился p[0] = 0.",
      },
      {
        kk: "Кесте бір-ақ рет толтырылды. Одан кейінгі әр сұрау — бір ғана азайту, сұрау саны қанша болса да.",
        ru: "Таблица заполнена ровно один раз. После этого каждый запрос — одно вычитание, сколько бы запросов ни было.",
      },
    ],
    code: "a = [3, 1, 4, 1, 5]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nprint(p[3] - p[1])\nprint(p[5] - p[0])",
    result: {
      kk: "Экранға екі жол шығады: алдымен 5, содан кейін 14.",
      ru: "На экран выйдут две строки: сначала 5, потом 14.",
    },
  },
  {
    /* The three wrong tables are the three ways the convention gets dropped:
       no leading zero, a loop that stops one short, and no accumulation at all.
       Only the first has a single cause, so only the first is mapped. */
    id: "m4.l5.b3",
    type: "prediction",
    skillRefs: ["precompute.prefix", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама a = [3, 2, 6, 1] тізімі үшін префикс кестені толтырып, кестені түгел шығарады. Экранда не пайда болады?",
      ru: "Программа заполняет префиксную таблицу для списка a = [3, 2, 6, 1] и печатает таблицу целиком. Что появится на экране?",
    },
    code: "a = [3, 2, 6, 1]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nprint(p)",
    answer: "[0, 3, 5, 11, 12]",
    options: ["[0, 3, 5, 11, 12]", "[3, 5, 11, 12]", "[0, 3, 5, 11]", "[3, 2, 6, 1]"],
    diagnosticMapping: {
      "[3, 5, 11, 12]": {
        failureClass: "prefix_table_missing_empty_prefix",
        justification:
          "Бұл жауап — дұрыс қосындылар, бірақ алдындағы нөлсіз. Оны таңдаудың бір ғана себебі бар: кестеде n емес, n + 1 ұяшық болатыны, ал бірінші ұяшық бос бөліктің қосындысы екені қабылданбаған.",
      },
      /* «[0, 3, 5, 11]» is left unmapped on purpose: it comes both from a loop
         that stops one iteration early AND from believing the table has n
         entries but starts with a zero. Two causes, so the pipeline asks. */
    },
  },
  {
    /* PDF p.7 established hand-tracing as October's main device; December
       reuses it here because the table is exactly the kind of thing a learner
       believes they understand until they have to say what p[3] is. The list
       has no repeats and no zeros, so every snapshot is distinguishable. */
    id: "m4.l5.b4",
    type: "trace_code",
    skillRefs: ["precompute.prefix", "loops.for", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Кестенің элемент-элемент қалай толатынын қағаздағыдай қадамдап жаз. 5-жол әр орындалған сайын i мен p тізімінің толық мәнін жаз, соңында 6-жол нені шығаратынын көрсет.",
      ru: "Пройди программу пошагово, как на бумаге, и посмотри, как таблица заполняется по одной ячейке. После каждого выполнения строки 5 запиши i и полное содержимое списка p, а в конце — что выведет строка 6.",
    },
    code: "a = [4, 1, 6, 2, 3]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nprint(p[5] - p[2])",
    steps: [
      { line: 3, vars: { n: "5", p: "[0, 0, 0, 0, 0, 0]" } },
      { line: 5, vars: { i: "1", p: "[0, 4, 0, 0, 0, 0]" } },
      { line: 5, vars: { i: "2", p: "[0, 4, 5, 0, 0, 0]" } },
      { line: 5, vars: { i: "3", p: "[0, 4, 5, 11, 0, 0]" } },
      { line: 5, vars: { i: "4", p: "[0, 4, 5, 11, 13, 0]" } },
      { line: 5, vars: { i: "5", p: "[0, 4, 5, 11, 13, 16]" } },
      { line: 6, vars: { p: "[0, 4, 5, 11, 13, 16]", "p[5] - p[2]": "11" } },
    ],
  },
  {
    id: "m4.l5.b5",
    type: "multiple_choice",
    skillRefs: ["precompute.prefix", "lists.index", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "p кестесі p[0] = 0 және p[i] = p[i-1] + a[i-1] ережесімен толтырылған. 0-ден бастап санағанда a[l..r] бөлігінің қосындысын (екі шеті де кіреді) қай өрнек береді?",
      ru: "Таблица p заполнена по правилу p[0] = 0 и p[i] = p[i-1] + a[i-1]. Какое выражение даёт сумму участка a[l..r] при нумерации с 0 (оба конца включаются)?",
    },
    options: [
      { id: "o1", label: { kk: "p[r] - p[l]", ru: "p[r] - p[l]" } },
      { id: "o2", label: { kk: "p[r + 1] - p[l]", ru: "p[r + 1] - p[l]" } },
      { id: "o3", label: { kk: "p[r] - p[l - 1]", ru: "p[r] - p[l - 1]" } },
      { id: "o4", label: { kk: "p[r + 1] - p[l + 1]", ru: "p[r + 1] - p[l + 1]" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "prefix_upper_bound_off_by_one",
        justification:
          "p[r] — алғашқы r элементтің қосындысы, яғни a[r] онда әлі жоқ. Бұл нұсқаны таңдау p[i]-ді «a[i]-ге дейінгі және оны қоса алғандағы қосынды» деп оқығанды білдіреді — жоғарғы шекараның бір ғана оқылу қатесі.",
      },
      /* o3 and o4 are left unmapped. o3 is the 1-based formula applied to
         0-based indices, but it is equally reachable as a blind guess at where
         the -1 belongs; o4 can mean «I shifted both ends» or «I shifted the
         wrong end». Neither answer names one cause on its own. */
    },
  },
  {
    id: "m4.l5.b6",
    type: "fill_blank",
    skillRefs: ["precompute.prefix", "loops.accumulator", "loops.for"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама префикс кестені толтырып, бүкіл тізімнің қосындысын шығаруы керек. Циклдің қай саннан басталатынын және кестенің екі индексін толықтыр. Есіңде болсын: p[i] — алғашқы i элементтің қосындысы, ал p[0] бос бөлікке арналған.",
      ru: "Программа должна заполнить префиксную таблицу и вывести сумму всего списка. Дополни, с какого числа начинается цикл, и оба индекса в правиле таблицы. Помни: p[i] — это сумма первых i элементов, а p[0] отведён под пустой участок.",
    },
    template:
      "n = int(input())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(___, n + 1):\n    p[i] = p[___] + a[___]\nprint(p[n])",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "i - 1", alternatives: ["i-1"] },
      { id: "f3", answer: "i - 1", alternatives: ["i-1"] },
    ],
  },
  {
    /* The bug the lesson exists to prevent: the upper bound read as inclusive.
       The list is on screen, so the learner can add 5 + 1 + 4 by hand and see
       that the program's 6 is not it. The prompt hands over lines 7 and 8 —
       see the head comment: without that, `r = R` is a second correct repair
       and the question would have two right answers. */
    id: "m4.l5.b7",
    type: "find_bug",
    skillRefs: ["precompute.prefix", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама a тізімінің бір бөлігінің қосындысын шығаруы керек. Сұраудағы орындар 1-ден басталады және екі шеті де кіреді. «2 4» сұрауы үшін жауап 5 + 1 + 4 = 10 болуға тиіс, ал бағдарлама 6 шығарады. 7 және 8-жолдар сұрауды 0-ден санауға дұрыс аударады — қате басқа жерде. Қай жолда?",
      ru: "Программа должна выводить сумму участка списка a. Позиции в запросе нумеруются с 1, оба конца включаются. Для запроса «2 4» ответ должен быть 5 + 1 + 4 = 10, а программа выводит 6. Строки 7 и 8 переводят запрос к нумерации с 0 правильно — ошибка не в них. В какой строке она?",
    },
    code: "a = [2, 5, 1, 4, 3]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nL, R = map(int, input().split())\nl = L - 1\nr = R - 1\nprint(p[r] - p[l])",
    buggyLine: 9,
    symptomInput: "2 4",
    fixedCode:
      "a = [2, 5, 1, 4, 3]\nn = len(a)\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nL, R = map(int, input().split())\nl = L - 1\nr = R - 1\nprint(p[r + 1] - p[l])",
    diagnosticMapping: {
      "5": {
        failureClass: "blamed_the_table_not_the_query",
        justification:
          "5-жол кестені дұрыс толтырады: p = [0, 2, 7, 8, 12, 15] және оны тізімнің өзінен қолмен тексеруге болады. Бұл жауап оқушының қатені кестені ОҚУДАН емес, кестені ҚҰРУДАН іздегенін көрсетеді.",
      },
    },
  },
  {
    /* PDF p.8, verbatim family: «тізім бөлігінің қосындысы туралы көп сұраққа
       тез жауап беру». The constraints in the prompt are what make the table
       necessary rather than merely tidy — at n = q = 100000 the per-query walk
       is ten billion additions.

       The visible case carries all four boundary queries the family has: the
       whole list, a single element in the middle, the first position and the
       last. The hidden ones add negatives (a sum that goes down), n = 1, n = 2
       with every possible segment, and a run where neighbouring answers differ
       by one position — which is what kills `p[R] - p[L]` and `p[r] - p[l]`. */
    id: "m4.l5.b8",
    type: "write_code",
    skillRefs: ["precompute.prefix", "loops.accumulator", "lists.traverse", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 100000). Екінші жолда n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Үшінші жолда сұраулар саны q (1 ≤ q ≤ 100000). Одан кейін q жол, әр жолда екі сан: L және R (1 ≤ L ≤ R ≤ n). Орындар 1-ден басталады, екі шеті де кіреді. Әр сұрау үшін L-ден R-ге дейінгі элементтердің қосындысын жеке жолға шығар. Әр сұрауда бөлікті қайта аралау уақытқа сыймайды: префикс кестені бір рет толтырып, әр жауапты бір азайтумен ал.",
      ru: "В первой строке число n (1 ≤ n ≤ 100000). Во второй строке n целых чисел, каждое по модулю не больше 1000000000. В третьей строке количество запросов q (1 ≤ q ≤ 100000). Далее q строк, в каждой два числа: L и R (1 ≤ L ≤ R ≤ n). Позиции нумеруются с 1, оба конца включаются. Для каждого запроса выведи сумму элементов с L-й по R-ю позицию, каждый ответ с новой строки. Проходить участок заново на каждый запрос по времени нельзя: заполни префиксную таблицу один раз и получай каждый ответ одним вычитанием.",
    },
    referenceSolution:
      "n = int(input())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nq = int(input())\nfor j in range(q):\n    L, R = map(int, input().split())\n    l = L - 1\n    r = R - 1\n    print(p[r + 1] - p[l])",
    cases: [
      { input: "5\n3 1 4 1 5\n4\n1 5\n3 3\n1 1\n5 5", expectedOutput: "14\n4\n3\n5" },
      { input: "1\n7\n1\n1 1", expectedOutput: "7" },
      { input: "2\n5 9\n3\n1 1\n2 2\n1 2", expectedOutput: "5\n9\n14", hidden: true },
      {
        input: "6\n2 -3 4 0 -1 5\n5\n2 4\n1 6\n6 6\n1 3\n4 5",
        expectedOutput: "1\n7\n5\n3\n-1",
        hidden: true,
      },
      { input: "4\n10 20 30 40\n3\n2 3\n1 2\n3 4", expectedOutput: "50\n30\n70", hidden: true },
      {
        input: "8\n1 2 3 4 5 6 7 8\n4\n1 8\n2 7\n8 8\n1 1",
        expectedOutput: "36\n27\n8\n1",
        hidden: true,
      },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b8 — same problem, same cases, same prompt
     * constraints, a different door in. PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ».
     *
     * The starting program builds the table correctly and then answers exactly
     * one query: it reads q and never uses it. That is deliberate on two
     * counts. It cannot be left alone and still pass — every case here has
     * q ≥ 2 — and what is left to do is precisely the idea the lesson is
     * about: the query loop wraps the ANSWERING, and the table stays outside
     * it, filled once.
     *
     * It is also not a copy of anything the support route can see: b2's code
     * hard-codes its list and reads no input, b7's hard-codes its list and
     * reads one query, and b6's template stops at the table.
     */
    id: "m4.l5.b8s",
    type: "modify_code",
    skillRefs: ["precompute.prefix", "loops.for", "io.read"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама префикс кестені дұрыс толтырады, бірақ тек БІР сұрауға жауап береді: q санын оқиды да, оны пайдаланбайды. Оны q сұраудың бәріне жауап беретіндей өзгерт, әр жауап жеке жолға шықсын. Кестені сұраулар циклінің ІШІНЕ көшірме — ол бір-ақ рет толтырылуы керек, дәл сол үшін бұл тәсіл жылдам. Енгізу пішімі сол күйінде қалады: бірінші жолда n, екінші жолда n сан, үшінші жолда q, одан кейін q жол, әрқайсысында L және R (орындар 1-ден басталады, екі шеті де кіреді).",
      ru: "Эта программа правильно заполняет префиксную таблицу, но отвечает только на ОДИН запрос: она читает q и никак его не использует. Измени её так, чтобы она отвечала на все q запросов, каждый ответ с новой строки. Не переноси заполнение таблицы ВНУТРЬ цикла по запросам — таблица должна заполняться ровно один раз, именно поэтому приём и быстрый. Формат ввода прежний: в первой строке n, во второй n чисел, в третьей q, дальше q строк, в каждой L и R (позиции с 1, оба конца включаются).",
    },
    code: "n = int(input())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nq = int(input())\nL, R = map(int, input().split())\nl = L - 1\nr = R - 1\nprint(p[r + 1] - p[l])",
    referenceSolution:
      "n = int(input())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nq = int(input())\nfor j in range(q):\n    L, R = map(int, input().split())\n    l = L - 1\n    r = R - 1\n    print(p[r + 1] - p[l])",
    cases: [
      { input: "5\n3 1 4 1 5\n4\n1 5\n3 3\n1 1\n5 5", expectedOutput: "14\n4\n3\n5" },
      { input: "2\n5 9\n3\n1 1\n2 2\n1 2", expectedOutput: "5\n9\n14" },
      {
        input: "6\n2 -3 4 0 -1 5\n5\n2 4\n1 6\n6 6\n1 3\n4 5",
        expectedOutput: "1\n7\n5\n3\n-1",
        hidden: true,
      },
      { input: "4\n10 20 30 40\n3\n2 3\n1 2\n3 4", expectedOutput: "50\n30\n70", hidden: true },
      {
        input: "8\n1 2 3 4 5 6 7 8\n4\n1 8\n2 7\n8 8\n1 1",
        expectedOutput: "36\n27\n8\n1",
        hidden: true,
      },
    ],
  },
  {
    /*
     * ADVANCED. Counting segments with a given sum is where the prefix table
     * stops being a convenience and becomes the only affordable way to ask the
     * question: n²/2 pairs is fine at n = 1000, and a third loop to re-add each
     * segment is not.
     *
     * A dict of prefix counts would do it in one pass. `dict` is not taught
     * this year, and this is the block that shows why the double loop over
     * prefix PAIRS is still worth having: it is the same idea, bounded
     * honestly, and the prompt states the bound instead of hiding behind it.
     *
     * The cases are chosen against the two mutants that survive an easy test:
     * `range(l + 1, n)` misses every single-element segment (killed by «1 5» /
     * «5» and by the visible case), and `p[r] - p[l]` gives 1 instead of 2 on
     * the visible case. Zeros and negatives are in the hidden set because a
     * solution that assumes sums grow gets 0 everywhere on them.
     */
    id: "m4.l5.b9",
    type: "write_code",
    skillRefs: ["precompute.prefix", "loops.nested", "perf.time_estimate"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бірінші жолда екі сан: n және s (1 ≤ n ≤ 1000, s модулі 1000000-нан аспайды). Екінші жолда n бүтін сан, әрқайсысының модулі 1000-нан аспайды. Қосындысы дәл s-ке тең, бос емес, тұтас бөліктер (a[l..r]) нешеу екенін шығар. Бөліктер орындарымен ажыратылады: қосындысы бірдей екі әртүрлі бөлік екі рет саналады. n кіші болғандықтан барлық (l, r) жұбын қарап шығуға болады — бұл шамамен n²/2 жұп, ол уақытқа сыяды. Ал әр жұп үшін бөліктің қосындысын қайта санауға болмайды: ол үшінші цикл болар еді және үлгермес еді. Префикс кестені пайдалан.",
      ru: "В первой строке два числа: n и s (1 ≤ n ≤ 1000, s по модулю не больше 1000000). Во второй строке n целых чисел, каждое по модулю не больше 1000. Выведи, сколько непустых непрерывных участков a[l..r] имеют сумму ровно s. Участки различаются позициями: два разных участка с одинаковой суммой считаются дважды. Так как n невелико, можно перебрать все пары (l, r) — это примерно n²/2 пар, и по времени это проходит. А вот пересчитывать сумму участка для каждой пары нельзя: это был бы третий цикл, и он бы не уложился. Используй префиксную таблицу.",
    },
    referenceSolution:
      "n, s = map(int, input().split())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nc = 0\nfor l in range(n):\n    for r in range(l, n):\n        if p[r + 1] - p[l] == s:\n            c = c + 1\nprint(c)",
    cases: [
      { input: "3 3\n1 2 3", expectedOutput: "2" },
      { input: "1 5\n5", expectedOutput: "1" },
      { input: "1 5\n3", expectedOutput: "0", hidden: true },
      { input: "5 0\n1 -1 2 -2 0", expectedOutput: "6", hidden: true },
      { input: "4 0\n0 0 0 0", expectedOutput: "10", hidden: true },
      { input: "6 7\n3 4 -7 7 0 7", expectedOutput: "8", hidden: true },
      { input: "5 15\n1 2 3 4 5", expectedOutput: "1", hidden: true },
    ],
  },
];
