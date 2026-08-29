import type { LessonBlock } from "../../types";

/**
 * m7.l1 · «Ұяшық және көршілер» / «Клетка и соседи» — 9 minutes.
 *
 * Skills: `grid.cells`, `debug.boundary`, `loops.nested`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * March's explanation paragraph forbids the obvious opening in so many words:
 * «Тақырып жалпы теориядан емес, **ұяшықты картадан** басталады: ұяшық - нүкте,
 * көрші ұяшық - байланыс». So this file contains no vertex, no edge, no
 * adjacency list, and not one occurrence of the word «граф». There is a map, a
 * cell, and the cell next to it. The month's mastery sentence calls the whole
 * topic «объектілер арасындағы байланыстар туралы есептермен **алғашқы
 * танысу**» — a first acquaintance — and a first acquaintance that opens with
 * vocabulary is not one.
 *
 * The lesson therefore has exactly one idea, as p.3 requires («бір сабақта бір
 * ғана идея»): **visit the four neighbours of a cell, and check the edge of the
 * map before you touch one.** Everything the month does afterwards — the wave,
 * the regions, the shortest path, the route restored — is this loop with a mark
 * or a queue added to it. Get the bounds wrong here and every later lesson
 * inherits an IndexError.
 *
 * ## The input format, fixed here for the whole month
 *
 *     first line: n m          (rows, then columns)
 *     next n lines: m characters, `.` free and `#` wall
 *
 * Stated in BOTH prompts of every block below that reads one, and every later
 * lesson of m07 must keep it. A month that changes its input shape halfway
 * teaches format-reading, not maps.
 *
 * The map is read as `g = []` plus a loop that appends `input()`, so each row
 * of `g` is a string of characters — October's «жолды таңбалар тізбегі ретінде
 * өңдеу», reused unchanged. `g[r][c]` is therefore two indexings in a row, and
 * `b1` says that out loud the first time it appears: nothing new arrives, the
 * October index is simply applied twice. A list whose elements are lists
 * behaves identically, which is also said, so the shape is not a surprise when
 * a later lesson needs a grid it can write into.
 *
 * ## Two conventions this lesson establishes, and one it refuses
 *
 * **`dr` / `dc`.** Four neighbours, walked as `dr = [-1, 1, 0, 0]` and
 * `dc = [0, 0, -1, 1]` with a loop over `range(4)`. Shown once in `b2` with the
 * reason given — it replaces four copies of the same three lines — and used
 * identically in every program afterwards, so the pattern is recognised rather
 * than re-read.
 *
 * **The four-part bounds check.** Written `nr >= 0 and nr < n and nc >= 0 and
 * nc < m`, never `0 <= nr < n`. The chained comparison is real Python and it is
 * also a construct this programme never teaches (`cmp.chained` appears in no
 * month's budget), so using it here would be smuggling a second new idea into
 * the lesson whose whole content is the first one. The four-part form has a
 * second virtue: each half can be wrong on its own, which is what `b6` and the
 * case sets below actually exploit.
 *
 * **Refused: `from collections import deque`.** Not needed until the wave
 * arrives, and not permitted then either — the queue is a list plus a head
 * index, January's two-pointer idea reused. Named here only so the next author
 * does not reach for it.
 *
 * ## Programs, and why no two of them are the same program
 *
 * Every program in a lesson about the four-neighbour walk shares a skeleton;
 * that is the lesson. What must not repeat is the JOB the program does, because
 * a task whose answer is already on a nearby card is transcription. So the
 * shapes are allocated once each:
 *
 *   b1   read the map, print two cells                (no walk at all)
 *   b2   walk → print the in-bounds neighbours' COORDINATES
 *   b3   walk → collect the neighbours' CHARACTERS into one string
 *   b5   walk → print each neighbour's character or `edge`, four lines always
 *   b6   walk → print the cell's own character and how many neighbours it has
 *   b7   no walk: is ONE given cell inside the map?
 *   b8   no map: the walk's arithmetic alone, `nr`, `nc`, in-bounds
 *   b9   walk → COUNT the free neighbours              ← the learner writes it
 *   b10  scan every cell, walk each                    ← the learner writes it
 *   b10s b10, starting from a program that counts all free cells
 *
 * Neither find_bug repairs into a program the learner is then asked for, and no
 * two programs in the file are byte-identical — checked by script, not by eye.
 *
 * ## The requirement that could not be enforced, and what was done instead
 *
 * The natural thing to demand of `b9` and `b10` is "walk the four directions
 * with `dr`/`dc` instead of writing four copies of the same `if`". Output
 * comparison cannot see it: four hand-written ifs produce the same number.
 * Of the three honest options in the authoring contract, this file takes
 * **option 2 — state it as guidance and grade the answer**. Both prompts say
 * the two lists make the code shorter and explicitly say they are not required
 * («міндетті емес» / «не обязательно»). Option 1 does not apply, because there
 * is no output only the loop can produce; option 3 is spent on `b11`, which is
 * a real question with a real answer rather than a way of policing style.
 *
 * ## What each graded task's cases are hunting
 *
 * `b9` (count free neighbours) kills, by case:
 *   · no bounds check at all — `0 0` on a map whose wrapped row is free (3
 *     instead of 2), and `1 1` / `.` where the single cell is its own wrapped
 *     neighbour (2 instead of 0);
 *   · a missing `nr < n` or `nc < m` — the bottom-right cell of a 3×3, which
 *     crashes;
 *   · a missing `nc >= 0` — the 1×1 map again, where `g[0][-1]` is free;
 *   · counting walls instead of free cells — `0 1` on the map with one wall,
 *     where the two counts are 2 and 1;
 *   · counting every in-bounds neighbour and ignoring the character — the same
 *     case, where that answer is 3;
 *   · counting the diagonals too — the first visible case, where that is 5;
 *   · a walk that only does two of the four directions — the all-walls case (0)
 *     and the all-free case (4) between them pin all four.
 *
 * `b10` (free cells with at least one wall neighbour) kills:
 *   · ignoring the condition and counting every free cell — case 1, 8 vs 4;
 *   · counting the wall cells instead — case 1, 1 vs 4;
 *   · treating the edge of the map as a wall — the all-free 2×2 (0, not 4) and
 *     the 1×1 (0, not 1). The prompt states the rule in both languages so this
 *     is a mistake and not a guess;
 *   · counting a cell once per wall neighbour instead of once — the map where
 *     one free cell has two walls (4, not 5);
 *   · a missing `nr >= 0` — the 3×3 whose bottom row carries the only wall
 *     (4 instead of 3, because `g[-1]` is that row);
 *   · a missing `nc >= 0` — the 2×4 whose top row ends in a wall (3 instead
 *     of 2);
 *   · a missing upper bound — the 1×5, which crashes;
 *   · including the diagonals — case 1 again, where that answer is 8.
 *
 * ## Track routing
 *
 * `b10` is the from-scratch task support does not receive; `b10s` is the same
 * problem as a `modify_code`, starting from a program that counts all free
 * cells — a program that is nobody's answer and appears nowhere else, so the
 * scaffold is a starting point rather than a copy of the destination. `b11` is
 * the advanced route's written defence («шешімді жазбаша қорғау міндетті»,
 * p.6), and it asks the one question this lesson can be got right by accident:
 * why the boundary is tested before the map is read at all.
 */

const P = 9; // PDF page for all of March

/** Repeated verbatim in both languages wherever a block reads a map. */
const FORMAT_KK =
  "Кіріс форматы (айдағы барлық есепте бірдей): бірінші жолда n мен m — жол саны және баған саны. Одан кейін n жол, әрқайсысында m таңба: `.` — бос ұяшық, `#` — қабырға. Жолдар жоғарыдан 0-ден, бағандар солдан 0-ден нөмірленеді.";
const FORMAT_RU =
  "Формат ввода (одинаковый во всех задачах месяца): в первой строке n и m — количество строк и количество столбцов. Затем n строк, в каждой по m символов: `.` — свободная клетка, `#` — стена. Строки нумеруются сверху с 0, столбцы — слева с 0.";
const CELL_KK = "Соңғы жолда r мен c — бір ұяшықтың жол және баған нөмірлері.";
const CELL_RU = "В последней строке r и c — номер строки и номер столбца одной клетки.";

export const M7_L1: LessonBlock[] = [
  {
    id: "m7.l1.b1",
    type: "concept",
    skillRefs: ["grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Карта — жолдар тізімі, ұяшық — екі нөмір",
      ru: "Карта — это список строк, клетка — это два номера",
    },
    /* The programme's own opening move, quoted in the doc comment above: the
       topic starts from a cell on a map. So the first card is the map and the
       two numbers that name a cell — nothing else, and no new Python. The one
       thing it does have to say out loud is that `g[r][c]` is October's index
       used twice, because a learner who reads it as a new operator will not
       transfer anything they already know about lists to it. */
    body: {
      kk: "Осы айдың бүкіл жұмысы бір суреттің үстінде жүреді: карта. Карта — тіктөртбұрышты тор, онда n жол және m баған бар. Әр ұяшық не бос (`.`), не қабырға (`#`).\n\nКіріс форматы ай бойы өзгермейді: бірінші жолда n мен m, одан кейін n жол, әрқайсысында m таңба.\n\nКартаны оқығанда әр жолды бөлек оқып, `append` арқылы `g` тізіміне жинаймыз. Сонда `g` — жолдардың тізімі: `g[0]` — ең жоғарғы жол, `g[1]` — одан кейінгісі. Ал жолдың ішіндегі бір таңбаны алу үшін индексті ЕКІ рет қолданамыз: `g[r][c]` — алдымен тізімнен r-жол алынады, содан кейін сол жолдан c-таңба алынады. Жаңа амал жоқ, бұл — қазанда өткен индекстің дәл өзі, тек екі рет. (Егер тізімнің элементтері жол емес, тізім болса да, `g[r][c]` дәл солай жұмыс істейді.)\n\nНөмірлеу нөлден басталады: жолдар жоғарыдан төмен 0-ден n−1-ге дейін, бағандар солдан оңға 0-ден m−1-ге дейін. Демек ең соңғы ұяшық — `g[n - 1][m - 1]`.\n\nМысалы, мына карта үшін (n = 3, m = 4)\n\n.#..\n....\n..#.\n\n`g[0][1]` — бұл `#`, ал `g[2][3]` — бұл `.`.",
      ru: "Вся работа этого месяца происходит на одной картинке — на карте. Карта — прямоугольная сетка из n строк и m столбцов. Каждая клетка либо свободна (`.`), либо это стена (`#`).\n\nФормат ввода не меняется до конца месяца: в первой строке n и m, дальше n строк, в каждой по m символов.\n\nЧитая карту, мы берём строки по одной и собираем их в список `g` через `append`. Тогда `g` — список строк: `g[0]` — самая верхняя строка, `g[1]` — следующая. А чтобы достать один символ внутри строки, индекс применяется ДВА раза: `g[r][c]` — сначала из списка берётся строка r, потом из неё символ c. Ничего нового: это тот же индекс, что и в октябре, просто использованный дважды. (Если бы элементами списка были не строки, а списки, `g[r][c]` работало бы точно так же.)\n\nНумерация начинается с нуля: строки сверху вниз от 0 до n−1, столбцы слева направо от 0 до m−1. Значит, самая последняя клетка — это `g[n - 1][m - 1]`.\n\nНапример, для такой карты (n = 3, m = 4)\n\n.#..\n....\n..#.\n\n`g[0][1]` — это `#`, а `g[2][3]` — это `.`.",
    },
    code: "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nprint(g[0][1])\nprint(g[2][3])",
  },
  {
    id: "m7.l1.b2",
    type: "worked_example",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: төрт көрші және картаның шеті",
      ru: "Разобранный пример: четыре соседа и край карты",
    },
    problem: {
      kk: `${FORMAT_KK} ${CELL_KK}\n\nСол ұяшықтың карта ішінде жатқан барлық көршісінің нөмірлерін шығар: әр жұп жеке жолда тұрсын.\n\nМысал: n = 3, m = 4, карта\n\n.#..\n....\n..#.\n\nал ұяшық — 0 1.`,
      ru: `${FORMAT_RU} ${CELL_RU}\n\nВыведи номера всех соседей этой клетки, которые лежат внутри карты, каждую пару на своей строке.\n\nПример: n = 3, m = 4, карта\n\n.#..\n....\n..#.\n\nа клетка — 0 1.`,
    },
    steps: [
      {
        kk: "Көрші деп қабырғасы ортақ ұяшықты айтамыз: жоғарыдағы, төмендегі, солдағы және оңдағы — барлығы төртеу. Диагональ бойынша тұрған ұяшықтар көрші емес: олармен тек бұрыш ортақ. Қабырға ұяшығы (`#`) да көрші болып саналады — көршілік деген орналасу туралы, ал ол ұяшыққа кіруге бола ма деген бөлек сұрақ.",
        ru: "Соседом называем клетку, с которой у нас общая сторона: верхнюю, нижнюю, левую и правую — всего четыре. Клетки по диагонали соседями не считаются: с ними общий только угол. Клетка-стена (`#`) тоже сосед — соседство говорит о расположении, а можно ли в эту клетку зайти — отдельный вопрос.",
      },
      {
        kk: "Нөмірлері арқылы жазсақ: жоғарғы көрші — (r−1, c), төменгі — (r+1, c), сол жақтағы — (r, c−1), оң жақтағы — (r, c+1). Яғни әр бағыт үшін жол нөміріне қосылатын бір сан және баған нөміріне қосылатын бір сан бар.",
        ru: "Через номера это выглядит так: верхний сосед — (r−1, c), нижний — (r+1, c), левый — (r, c−1), правый — (r, c+1). То есть для каждого направления есть одно число, прибавляемое к номеру строки, и одно — к номеру столбца.",
      },
      {
        kk: "Осы сегіз санды екі тізімге жазамыз: `dr = [-1, 1, 0, 0]` және `dc = [0, 0, -1, 1]`. k-ыншы бағыт — `dr[k]` мен `dc[k]` жұбы. Осылайша бірдей үш жолды төрт рет көшірудің орнына `range(4)` бойынша бір цикл жазамыз, ал кейін бағыттардың реті керек болса, тізімге қарасақ жеткілікті.",
        ru: "Запишем эти восемь чисел в два списка: `dr = [-1, 1, 0, 0]` и `dc = [0, 0, -1, 1]`. Направление номер k — это пара `dr[k]` и `dc[k]`. Так вместо четырёх копий одних и тех же трёх строк получается один цикл по `range(4)`, а если потом понадобится порядок направлений, достаточно посмотреть в списки.",
      },
      {
        kk: "Бірақ көрші картадан шығып кетуі мүмкін. Біздің мысалда (0, 1) ұяшығының жоғарғы көршісі — (−1, 1), ал ондай жол жоқ. Сондықтан әр көршіні пайдаланар алдында төрт шартты бірге тексереміз: `nr >= 0 and nr < n and nc >= 0 and nc < m`. Төртеуі де орындалғанда ғана көрші картаның ішінде жатыр.",
        ru: "Но сосед может оказаться за пределами карты. В нашем примере верхний сосед клетки (0, 1) — это (−1, 1), а такой строки нет. Поэтому перед тем, как использовать соседа, проверяем сразу четыре условия: `nr >= 0 and nr < n and nc >= 0 and nc < m`. Сосед лежит внутри карты только тогда, когда выполнены все четыре.",
      },
      {
        kk: "Мұндағы ең жиі қате — n мен m-ді шатастыру. `nr` — жол нөмірі, сондықтан ол n-мен салыстырылады; `nc` — баған нөмірі, ол m-мен салыстырылады. Карта шаршы болса, қате көрінбейді де, ал жол мен баған саны әртүрлі болғанда бірден шығады.",
        ru: "Самая частая ошибка здесь — перепутать n и m. `nr` — это номер строки, поэтому он сравнивается с n; `nc` — номер столбца, он сравнивается с m. На квадратной карте ошибка не видна, а как только строк и столбцов разное количество — вылезает сразу.",
      },
    ],
    code: "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        print(nr, nc)",
    result: {
      kk: "(0, 1) ұяшығы үшін үш жол шығады: `1 1`, содан кейін `0 0`, содан кейін `0 2`. Жоғарғы көрші (−1, 1) картада жоқ, сондықтан ол мүлде шықпады — жоғарғы жолдағы ұяшықтың үш көршісі бар.",
      ru: "Для клетки (0, 1) выведутся три строки: `1 1`, затем `0 0`, затем `0 2`. Верхнего соседа (−1, 1) на карте нет, поэтому он не вывелся вовсе — у клетки в верхней строке соседей три.",
    },
  },
  {
    id: "m7.l1.b3",
    type: "prediction",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: `${FORMAT_KK}\n\nБағдарлама (0, 0) ұяшығының карта ішінде жатқан көршілерінің таңбаларын бір жолға жинап шығарады. Пернетақтадан мына мәліметтер енгізілді:\n\n3 3\n.#.\n...\n#.#\n\nЭкранда не пайда болады?`,
      ru: `${FORMAT_RU}\n\nПрограмма собирает в одну строку символы тех соседей клетки (0, 0), которые лежат внутри карты. С клавиатуры ввели:\n\n3 3\n.#.\n...\n#.#\n\nЧто появится на экране?`,
    },
    code: 'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr = 0\nc = 0\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ns = ""\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        s = s + g[nr][nc]\nprint(s)',
    stdin: "3 3\n.#.\n...\n#.#",
    answer: ".#",
    options: [".#", "#.", "..#", "#..#"],
    diagnosticMapping: {
      /* Four characters can only appear if all four neighbours were read, and
         reading them requires believing that `g[-1]` and `g[0][-1]` are the
         cells above and to the left. They are not: Python gives the LAST row
         and the LAST character instead, silently. No other reading of this
         program produces `#..#`, so the attribution is unambiguous. */
      "#..#": {
        failureClass: "bounds_check_ignored",
        justification:
          "Төрт таңба шығуы үшін төрт көршінің де оқылуы керек, ал ол `if` шартын елемегенде ғана мүмкін. Дәл `#..#` тіркесі — `g[-1][0]` мен `g[0][-1]` шынымен жоғарғы және сол жақтағы көрші деп есептегеннің нәтижесі: Python қате бермей, соңғы жол мен соңғы таңбаны қайтарады.",
      },
    },
  },
  {
    id: "m7.l1.b4",
    type: "multiple_choice",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Картада 4 жол және 5 баған бар (n = 4, m = 5): жолдар 0-ден 3-ке дейін, бағандар 0-ден 4-ке дейін нөмірленген. Сол жоғарғы бұрыштағы (0, 0) ұяшығының көршілері — қандай ұяшықтар? Көрші деп қабырғасы ортақ, әрі картаның ішінде жатқан ұяшықты айтамыз.",
      ru: "На карте 4 строки и 5 столбцов (n = 4, m = 5): строки пронумерованы от 0 до 3, столбцы — от 0 до 4. Какие клетки являются соседями левой верхней клетки (0, 0)? Соседом называем клетку, с которой есть общая сторона и которая лежит внутри карты.",
    },
    options: [
      { id: "o1", label: { kk: "(0, 1) және (1, 0)", ru: "(0, 1) и (1, 0)" } },
      { id: "o2", label: { kk: "(0, 1), (1, 0) және (1, 1)", ru: "(0, 1), (1, 0) и (1, 1)" } },
      {
        id: "o3",
        label: { kk: "(−1, 0), (1, 0), (0, −1) және (0, 1)", ru: "(−1, 0), (1, 0), (0, −1) и (0, 1)" },
      },
      {
        id: "o4",
        label: { kk: "(0, 1), (1, 0), (1, 1) және (−1, −1)", ru: "(0, 1), (1, 0), (1, 1) и (−1, −1)" },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      /* o4 carries no mapping on purpose: it contains both a diagonal and an
         out-of-map pair, so a learner choosing it may hold either mistake, or
         both, and naming one would be a guess about a child's thinking. */
      o2: {
        failureClass: "diagonal_counted_as_neighbour",
        justification:
          "(1, 1) ұяшығымен (0, 0)-дің ортақ қабырғасы жоқ, тек ортақ бұрыш бар. Оны тізімге қосу — көршілікті диагональ бойынша да санағанды білдіреді, ал бұл жауаптағы басқа екі ұяшық дұрыс, сондықтан себебі біреу ғана.",
      },
      o3: {
        failureClass: "bounds_check_missing",
        justification:
          "(−1, 0) мен (0, −1) — жол мен баған нөмірі теріс ұяшықтар, олар картада жоқ. Бұл жауапта диагональ жоқ, тек шекарадан шыққан екі ұяшық бар: демек шекара мүлде тексерілмеген.",
      },
    },
  },
  {
    id: "m7.l1.b5",
    type: "find_bug",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: `${FORMAT_KK} ${CELL_KK}\n\nБағдарлама (r, c) ұяшығының төрт көршісін жоғары, төмен, сол, оң ретімен қарап шығуы керек: көрші картада жатса — оның таңбасын, жатпаса — \`edge\` деген ағылшын сөзін жеке жолға шығаруы тиіс. Мысалы, мына кіріс үшін\n\n3 3\n.#.\n#..\n..#\n2 1\n\nэкранда \`.\`, \`edge\`, \`.\`, \`#\` деген төрт жол шығуы керек еді. Бірақ бағдарлама бірінші жолды шығарған соң IndexError қатесімен құлайды. Қай жолда қате бар?`,
      ru: `${FORMAT_RU} ${CELL_RU}\n\nПрограмма должна обойти четырёх соседей клетки (r, c) в порядке вверх, вниз, влево, вправо: если сосед лежит внутри карты — вывести его символ, если нет — вывести на отдельной строке английское слово \`edge\`. Например, для такого ввода\n\n3 3\n.#.\n#..\n..#\n2 1\n\nна экране должны были появиться четыре строки: \`.\`, \`edge\`, \`.\`, \`#\`. Но программа выводит первую строку и падает с ошибкой IndexError. В какой строке ошибка?`,
    },
    code: "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    print(g[nr][nc])",
    buggyLine: 11,
    symptomInput: "3 3\n.#.\n#..\n..#\n2 1",
    fixedCode:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        print(g[nr][nc])\n    else:\n        print("edge")',
  },
  {
    id: "m7.l1.b6",
    type: "find_bug",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: `${FORMAT_KK} ${CELL_KK}\n\nБағдарлама (r, c) ұяшығының өз таңбасын және оның карта ішінде жатқан көршілерінің САНЫН бір жолға шығарады. Бұрыштағы ұяшықтың көршісі екеу болуы керек, бірақ мына кіріс үшін\n\n3 3\n...\n.#.\n...\n2 2\n\nбағдарлама \`. 4\` деп шығарады. Қай жолда қате бар?`,
      ru: `${FORMAT_RU} ${CELL_RU}\n\nПрограмма выводит в одну строку сам символ клетки (r, c) и КОЛИЧЕСТВО её соседей, лежащих внутри карты. У угловой клетки соседей должно быть два, но для такого ввода\n\n3 3\n...\n.#.\n...\n2 2\n\nпрограмма выводит \`. 4\`. В какой строке ошибка?`,
    },
    code: "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ncnt = 0\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr <= n and nc >= 0 and nc <= m:\n        cnt = cnt + 1\nprint(g[r][c], cnt)",
    buggyLine: 12,
    symptomInput: "3 3\n...\n.#.\n...\n2 2",
    fixedCode:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ncnt = 0\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        cnt = cnt + 1\nprint(g[r][c], cnt)",
    diagnosticMapping: {
      /* Line 14 is `print(g[r][c], cnt)`. Choosing it means reading the wrong
         number as a printing fault rather than a counting fault — and that line
         does exactly what the prompt describes, so there is one way to land on
         it. Line 10 and 11 carry the arithmetic, which two different
         misreadings could blame, so neither is mapped. */
      "14": {
        failureClass: "symptom_blamed_on_output_line",
        justification:
          "Соңғы жол мәнді тек экранға шығарады, ол ештеңе санамайды. Оны таңдау — қате сан шыққанда оның себебін есептеу емес, шығару деп ойлағанды білдіреді; ал `cnt` мәні бұл жолға жеткенде әлдеқашан 4 болып қойған.",
      },
    },
  },
  {
    id: "m7.l1.b7",
    type: "fill_blank",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: `${FORMAT_KK} ${CELL_KK}\n\nЕгер (r, c) ұяшығы картаның ішінде жатса, оның таңбасын (\`.\` немесе \`#\`) шығару керек; жатпаса, \`out\` деген ағылшын сөзін шығару керек. Бос орындарға төрт шекара мәнін қой. Есіңде болсын: r — жол нөмірі, c — баған нөмірі.`,
      ru: `${FORMAT_RU} ${CELL_RU}\n\nЕсли клетка (r, c) лежит внутри карты, нужно вывести её символ (\`.\` или \`#\`); если не лежит — вывести английское слово \`out\`. Подставь четыре граничных значения. Помни: r — номер строки, c — номер столбца.`,
    },
    template:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\nif r >= ___ and r < ___ and c >= ___ and c < ___:\n    print(g[r][c])\nelse:\n    print("out")',
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "n" },
      { id: "f3", answer: "0" },
      { id: "f4", answer: "m" },
    ],
  },
  {
    id: "m7.l1.b8",
    type: "trace_code",
    skillRefs: ["grid.cells", "debug.boundary"],
    /* «Кодты қолмен орындау» is one of the programme's five verification
       methods (p.6), and this is the place in March where it costs nothing:
       the walk's arithmetic has no map in it at all, so the learner traces four
       coordinate pairs and one condition rather than a program. */
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарламада карта жоқ — тек өлшемдер мен бір ұяшық берілген: 3 жол, 4 баған, ұяшық (0, 3), яғни оң жоғарғы бұрыш. Цикл әр бағыт үшін көршінің нөмірлерін есептейді және оның картада жатқан-жатпағанын `ok` айнымалысына жазады: 1 — жатыр, 0 — жатпайды. Әр қадамда `nr`, `nc` және `ok` мәндерін жаз.",
      ru: "В этой программе карты нет — заданы только размеры и одна клетка: 3 строки, 4 столбца, клетка (0, 3), то есть правый верхний угол. Цикл для каждого направления вычисляет номера соседа и записывает в переменную `ok`, лежит ли он внутри карты: 1 — лежит, 0 — не лежит. Запиши на каждом шаге значения `nr`, `nc` и `ok`.",
    },
    code: "n = 3\nm = 4\nr = 0\nc = 3\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    ok = 0\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        ok = 1\n    print(nr, nc, ok)",
    steps: [
      { line: 4, vars: { n: "3", m: "4", r: "0", c: "3" } },
      { line: 6, vars: { dr: "[-1, 1, 0, 0]", dc: "[0, 0, -1, 1]" } },
      { line: 13, vars: { k: "0", nr: "-1", nc: "3", ok: "0" } },
      { line: 13, vars: { k: "1", nr: "1", nc: "3", ok: "1" } },
      { line: 13, vars: { k: "2", nr: "0", nc: "2", ok: "1" } },
      { line: 13, vars: { k: "3", nr: "0", nc: "4", ok: "0" } },
    ],
  },
  {
    id: "m7.l1.b9",
    type: "write_code",
    skillRefs: ["grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: `${FORMAT_KK} ${CELL_KK}\n\n(r, c) ұяшығының төрт көршісінің ішінде неше бос ұяшық (\`.\`) бар екенін санап шығар. Картадан тыс қалған көршілер саналмайды. Кеңес: төрт бағытты \`dr = [-1, 1, 0, 0]\` және \`dc = [0, 0, -1, 1]\` тізімдері арқылы аралап шықсаң, код қысқарады — бірақ бұл міндетті емес, төрт бағытты бөлек жазсаң да болады.`,
      ru: `${FORMAT_RU} ${CELL_RU}\n\nПосчитай, сколько среди четырёх соседей клетки (r, c) свободных клеток (\`.\`). Соседи, оказавшиеся за пределами карты, не считаются. Совет: если обойти четыре направления через списки \`dr = [-1, 1, 0, 0]\` и \`dc = [0, 0, -1, 1]\`, код будет короче — но это не обязательно, можно расписать четыре направления по отдельности.`,
    },
    referenceSolution:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nr, c = map(int, input().split())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ncnt = 0\nfor k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n        if g[nr][nc] == ".":\n            cnt = cnt + 1\nprint(cnt)',
    cases: [
      { input: "3 3\n.#.\n#..\n..#\n1 1", expectedOutput: "2" },
      { input: "3 3\n..#\n.#.\n...\n0 0", expectedOutput: "2" },
      { input: "3 3\n...\n...\n...\n2 2", expectedOutput: "2", hidden: true },
      { input: "3 3\n...\n.#.\n...\n0 1", expectedOutput: "2", hidden: true },
      { input: "3 3\n.#.\n#.#\n.#.\n1 1", expectedOutput: "0", hidden: true },
      { input: "3 3\n...\n...\n...\n1 1", expectedOutput: "4", hidden: true },
      { input: "1 1\n.\n0 0", expectedOutput: "0", hidden: true },
      { input: "1 5\n.#..#\n0 2", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m7.l1.b10",
    type: "write_code",
    skillRefs: ["grid.cells", "debug.boundary", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: `${FORMAT_KK}\n\nКемінде бір көршісі қабырға (\`#\`) болатын бос ұяшықтардың санын шығар. Картаның шеті қабырға болып саналмайды: картадан тыс жақта ештеңе жоқ. Бір ұяшықтың екі не үш көрші қабырғасы болса да, ол бір-ақ рет саналады. Кеңес: сыртқы екі цикл барлық ұяшықты аралайды, ал әр бос ұяшық үшін ішінде \`dr\` мен \`dc\` бойынша тағы бір цикл жүреді.`,
      ru: `${FORMAT_RU}\n\nВыведи количество свободных клеток, у которых хотя бы один сосед — стена (\`#\`). Край карты стеной не считается: за пределами карты нет ничего. Если у клетки две или три соседние стены, она всё равно считается один раз. Совет: два внешних цикла обходят все клетки, а внутри для каждой свободной клетки идёт ещё один цикл по \`dr\` и \`dc\`.`,
    },
    referenceSolution:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ntotal = 0\nfor r in range(n):\n    for c in range(m):\n        if g[r][c] == ".":\n            near = 0\n            for k in range(4):\n                nr = r + dr[k]\n                nc = c + dc[k]\n                if nr >= 0 and nr < n and nc >= 0 and nc < m:\n                    if g[nr][nc] == "#":\n                        near = 1\n            if near == 1:\n                total = total + 1\nprint(total)',
    cases: [
      { input: "3 3\n...\n.#.\n...", expectedOutput: "4" },
      { input: "2 3\n.#.\n...", expectedOutput: "3" },
      { input: "2 2\n..\n..", expectedOutput: "0", hidden: true },
      { input: "2 2\n##\n##", expectedOutput: "0", hidden: true },
      { input: "3 3\n.#.\n#..\n...", expectedOutput: "4", hidden: true },
      { input: "1 1\n.", expectedOutput: "0", hidden: true },
      { input: "1 5\n.#..#", expectedOutput: "3", hidden: true },
      { input: "2 4\n...#\n....", expectedOutput: "2", hidden: true },
      { input: "3 3\n...\n...\n.#.", expectedOutput: "3", hidden: true },
    ],
  },
  {
    id: "m7.l1.b10s",
    type: "modify_code",
    skillRefs: ["grid.cells", "debug.boundary", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["support"],
    /* The scaffold for b10. Its starting program counts every free cell and
       appears nowhere else in the month — it is not another block's answer, and
       nobody is asked to write it. What the support learner supplies is exactly
       the part b10 is about: the inner walk and the "at least one" decision. */
    prompt: {
      kk: `${FORMAT_KK}\n\nТөмендегі бағдарлама картадағы БАРЛЫҚ бос ұяшықты санайды. Оны өзгерт: кемінде бір көршісі қабырға (\`#\`) болатын бос ұяшықтар ғана саналсын. Картаның шеті қабырға болып саналмайды. Бір ұяшықтың екі не үш көрші қабырғасы болса да, ол бір-ақ рет саналады. Көршілерді \`dr = [-1, 1, 0, 0]\` және \`dc = [0, 0, -1, 1]\` тізімдері арқылы аралап шық және шекараны тексеруді ұмытпа.`,
      ru: `${FORMAT_RU}\n\nПрограмма ниже считает ВСЕ свободные клетки карты. Измени её так, чтобы считались только те свободные клетки, у которых хотя бы один сосед — стена (\`#\`). Край карты стеной не считается. Если у клетки две или три соседние стены, она всё равно считается один раз. Обойди соседей через списки \`dr = [-1, 1, 0, 0]\` и \`dc = [0, 0, -1, 1]\` и не забудь проверку границы.`,
    },
    code: 'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\ntotal = 0\nfor r in range(n):\n    for c in range(m):\n        if g[r][c] == ".":\n            total = total + 1\nprint(total)',
    referenceSolution:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ntotal = 0\nfor r in range(n):\n    for c in range(m):\n        if g[r][c] == ".":\n            near = 0\n            for k in range(4):\n                nr = r + dr[k]\n                nc = c + dc[k]\n                if nr >= 0 and nr < n and nc >= 0 and nc < m:\n                    if g[nr][nc] == "#":\n                        near = 1\n            if near == 1:\n                total = total + 1\nprint(total)',
    cases: [
      { input: "3 3\n...\n.#.\n...", expectedOutput: "4" },
      { input: "2 3\n.#.\n...", expectedOutput: "3" },
      { input: "2 2\n..\n..", expectedOutput: "0", hidden: true },
      { input: "2 2\n##\n##", expectedOutput: "0", hidden: true },
      { input: "3 3\n.#.\n#..\n...", expectedOutput: "4", hidden: true },
      { input: "1 1\n.", expectedOutput: "0", hidden: true },
      { input: "1 5\n.#..#", expectedOutput: "3", hidden: true },
      { input: "2 4\n...#\n....", expectedOutput: "2", hidden: true },
      { input: "3 3\n...\n...\n.#.", expectedOutput: "3", hidden: true },
    ],
  },
  {
    id: "m7.l1.b11",
    type: "explain",
    skillRefs: ["debug.boundary", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    tracks: ["advanced"],
    /* The written defence p.6 makes compulsory for Тереңдетілген, and the one
       question this lesson can otherwise be passed without answering. It is
       also option 3 of the authoring contract's rule about requirements no
       checker can see: the order of the two tests is invisible to output
       comparison, so it is asked of a person instead of pretended to be
       graded. */
    prompt: {
      kk: "Көршіні қараған кезде екі тексеру бар: көрші картада жатыр ма (`nr >= 0 and nr < n and nc >= 0 and nc < m`) және сол көршіде не тұр (`g[nr][nc]`). Неге бірінші тексеру екіншісінен бұрын тұруы керек? Жауабыңда екі түрлі жағдайды бөліп жаз: көршінің нөмірі тым ҮЛКЕН болғанда не болады және ол ТЕРІС болғанда не болады. Осы екеуінің қайсысы қауіптірек, неге?",
      ru: "Когда мы смотрим на соседа, есть две проверки: лежит ли сосед внутри карты (`nr >= 0 and nr < n and nc >= 0 and nc < m`) и что в этом соседе стоит (`g[nr][nc]`). Почему первая проверка должна стоять раньше второй? Разбери в ответе два разных случая: что произойдёт, если номер соседа слишком БОЛЬШОЙ, и что произойдёт, если он ОТРИЦАТЕЛЬНЫЙ. Какой из этих двух случаев опаснее и почему?",
    },
    expectedPoints: [
      {
        kk: "Нөмір тым үлкен болса (мысалы nr = n), `g[nr]` деген жол жоқ, сондықтан бағдарлама IndexError қатесімен бірден құлайды.",
        ru: "Если номер слишком большой (например, nr = n), строки `g[nr]` не существует, поэтому программа сразу падает с ошибкой IndexError.",
      },
      {
        kk: "Нөмір теріс болса, Python қате бермейді: `g[-1]` — соңғы жол, `g[r][-1]` — жолдағы соңғы таңба. Бағдарлама жұмысын жалғастырады, бірақ картаның мүлде басқа шетіндегі ұяшықты көрші деп санайды.",
        ru: "Если номер отрицательный, Python не выдаёт ошибку: `g[-1]` — это последняя строка, а `g[r][-1]` — последний символ строки. Программа продолжает работать, но считает соседом клетку с совершенно другого края карты.",
      },
      {
        kk: "Теріс жағдай қауіптірек, өйткені ол үнсіз: бағдарлама құламай, дұрыс емес жауап береді, ал ондай қатені тек нәтижені қолмен санап барып табуға болады.",
        ru: "Отрицательный случай опаснее, потому что он молчаливый: программа не падает, а выдаёт неверный ответ, и такую ошибку можно найти, только пересчитав результат вручную.",
      },
      {
        kk: "Егер екі тексеру бір жолға `and` арқылы жазылса, реті тіпті маңызды: `and` солдан оңға тексереді және бірінші жалған шартты көргенде тоқтайды, сондықтан шекара шарты алдында тұрса, `g[nr][nc]` мүлде оқылмайды.",
        ru: "Если обе проверки записаны в одну строку через `and`, порядок тем более важен: `and` проверяет слева направо и останавливается на первом ложном условии, поэтому при проверке границы впереди `g[nr][nc]` вообще не читается.",
      },
    ],
  },
];
