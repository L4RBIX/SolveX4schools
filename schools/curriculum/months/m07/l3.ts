import type { LessonBlock } from "../../types";

/**
 * m7.l3 · «Толқын әдісі» / «Метод волны» — 10 minutes.
 *
 * Skills: `graph.bfs`, `graph.shortest_path`. PDF p.9, March.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * The mastery sentence names the thing outright — «Лабиринттегі ең қысқа жолды
 * табу» — and the practice paragraph names the two families this lesson owns:
 * «бір ұяшықтан екіншісіне жетуге бола ма» (`b8`) and «лабиринттегі ең қысқа
 * жол» (`b9`). The assessment sentence names the argument the lesson has to
 * leave behind: «табылған жолдың неге шынымен ең қысқа екенін түсіндіреді»,
 * which is `b6` as a choice and `b10` as a written defence.
 *
 * The explanation clause is the one that shapes the first four cards:
 * «Платформада толқын түрінде боялатын анимация көрсетіледі, оқушы келесі
 * қандай ұяшықтар өңделетінін болжайды.» The `bfs_wave` visualiser does not
 * exist yet (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1), so `b2`
 * declares it for the day it does, and the requirement itself is carried by
 * `b4` — a prediction that asks, in writing, exactly which cells are coloured
 * next. That question is answerable today, on paper, and it is the PDF's own
 * sentence.
 *
 * ## The queue is a list and a head index, and that is January
 *
 * `collections.deque` is never taught by this programme and importing it would
 * put an unexplained object at the centre of the month. The queue here is two
 * parallel lists — `qr` and `qc`, the same parallel-list convention `m7.l1`
 * used for `dr`/`dc` — plus one index that only ever moves forward. `b1` says
 * so in both languages and names `m5.l4`, «Екі шекара әдісі», where an index
 * that only advances was the whole lesson. That is what makes the queue taught
 * rather than smuggled.
 *
 * ## `dist` and the double duty of −1
 *
 * `dist` is a grid of −1 the same shape as the map, and −1 means two things at
 * once: «мұнда әлі болғаным жоқ» while the wave is running, and «жету мүмкін
 * емес» when it stops. That is why `b8` can answer a yes/no question with the
 * same array that `b9` uses to answer a number, and `b1` states it.
 *
 * ## Input format
 *
 * `m7.l1` fixed it for the month: `n m`, then n rows of m characters, `.` free
 * and `#` wall, rows and columns numbered from zero. This lesson adds one line
 * at the end carrying **the coordinates the task needs** — four numbers when
 * there is a start and a finish (`b8`, `b9`, `b9s`), two when only a start is
 * needed (`b7`). Every prompt that reads input states its own last line in
 * full, in both languages, so nobody has to remember which shape this card
 * uses.
 *
 * ## Programs, and why no task here transcribes one
 *
 * Every program on screen was compared byte for byte against every other one.
 * The wave appears more than once, deliberately — it is the method the month
 * teaches, and the point of a trace is to run the method you have just read —
 * but no task's answer is a program the same learner has already been shown:
 *
 *   · `b3` and `b5` embed their maps in the code and print things no task asks
 *     for (the whole distance grid; the number of cells the wave reached);
 *   · `b4` is one round of the wave over a half-filled `dist`, not the wave;
 *   · `b7` completes a wave that answers a third question — how far the
 *     farthest reachable cell is;
 *   · `b8` and `b9` read input and answer the two PDF families, and their
 *     answers appear nowhere on any card.
 *
 * The one deliberate reuse is `b9s`, the support twin: its starting program is
 * `b7`'s completed template — a program that learner has already finished —
 * and the modification runs forwards, towards a question no card has answered.
 * That is the single legitimate case the authoring contract names.
 *
 * ## The unenforceable-requirement decision (contract §4)
 *
 * "Solve it with the wave" is not something output comparison can see: a
 * depth-first walk, or on small maps even a hand-written table, prints the same
 * digits. Rather than state a rule the checker will not enforce, `b8` and `b9`
 * take **option 2** — the prompt names the wave as the method being practised,
 * says plainly that only the printed answer is compared, and grades the answer.
 * The structural understanding is graded where it can be: `b4`, `b5`, `b6` and
 * `b7` ask about the wave itself rather than about a number it produced, and
 * `b10` takes **option 3**, sending the argument to a teacher.
 *
 * What the cases CAN see, they do. `b9`'s hidden set kills the three programs a
 * fourteen-year-old actually writes instead of the wave: the straight-line
 * count |Δr| + |Δc| (dies on the two zigzag maps), the depth-first walk that
 * returns the first route it finds (dies on `3 5 / ..... / .###. / .....`,
 * where the finish is two steps below the start and a depth-first walk arrives
 * after ten), and the count of cells instead of steps (dies on `1 2 / ..`).
 *
 * ## Deliberately left for later lessons
 *
 * Restoring the route itself — remembering where each cell was reached from —
 * is `m7.l4` and gets nothing here beyond one sentence in `b10`'s marking
 * points. The cost of processing a cell twice is `m7.l5`; this lesson states
 * the guard and moves on.
 */

const P = 9; // PDF page for all of March

export const M7_L3: LessonBlock[] = [
  {
    /*
     * The one idea of the lesson, and three things named out loud because a
     * later reader will check: the queue as a list plus a forward-only index
     * (with January named), `dist` as a list of lists of numbers, and −1 doing
     * double duty.
     *
     * The code is NOT the wave. It is the queue mechanism on its own, with the
     * two neighbours of the start added by hand, so that the mechanism can be
     * read without the map, the walls and the bounds check all arriving at
     * once. The wave itself is assembled two cards later, where the reasoning
     * that builds it is on screen next to it.
     */
    id: "m7.l3.b1",
    type: "concept",
    skillRefs: ["graph.bfs", "graph.shortest_path", "twopointers.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толқын: кезек және қашықтық торы",
      ru: "Волна: очередь и сетка расстояний",
    },
    body: {
      kk: "Стартқа су тамызсақ, ол алдымен көрші ұяшықтарға, содан кейін солардың көршілеріне жайылады. Дәл осылай жұмыс істейтін әдісті толқын әдісі дейді. Толқынға екі нәрсе керек.\n\nБіріншісі — кезек: өңдеуді күтіп тұрған ұяшықтар тізбегі. Кезекті `qr` және `qc` деген екі қатарлас тізіммен сақтаймыз — біреуінде жол нөмірі, екіншісінде баған нөмірі тұрады, дәл `dr` мен `dc` сияқты. Жаңа ұяшық тізімнің соңына `.append` арқылы қосылады, ал қайсысын өңдейтінімізді `head` айнымалысы көрсетеді. `head` тек алға жылжиды, ешқашан артқа қайтпайды — бұл қаңтардағы «Екі шекара әдісі» сабағының дәл сол идеясы, тек енді ол тізім бойымен жалғыз жүреді. Кезек `head` тізім соңына жеткенде бітеді, ал тізім сол уақытта әлі өсіп жатуы мүмкін.\n\nЕкіншісі — `dist` торы: картамен дәл бірдей өлшемдегі сандар торы, яғни ішінде тізімдер жататын тізім, сондықтан `dist[r][c]` деп жазылады. Басында бәрі −1. Стартқа 0 қоямыз, ал жаңа ұяшыққа `dist[nr][nc] = dist[r][c] + 1` деп қоямыз: бір қадам алыс. Осындағы −1 екі жұмысты бірден атқарады: толқын жүріп жатқанда ол «мұнда әлі болған жоқпын» дегенді білдіреді, ал толқын тоқтағанда сол ұяшыққа «жету мүмкін емес» дегенді білдіреді. Сондықтан бөлек белгі торы керек емес.",
      ru: "Если капнуть воду на старт, она растечётся сначала по соседним клеткам, потом по соседям этих соседей. Приём, который работает точно так же, называют методом волны. Волне нужны две вещи.\n\nПервая — очередь: цепочка клеток, ожидающих обработки. Очередь мы храним в двух параллельных списках `qr` и `qc` — в одном номер строки, в другом номер столбца, ровно как `dr` и `dc`. Новая клетка добавляется в конец списка через `.append`, а какую клетку обрабатываем сейчас, показывает переменная `head`. Она движется только вперёд и никогда не возвращается назад — это та же самая идея, что и в январском уроке «Метод двух указателей», только теперь указатель идёт по списку один. Очередь заканчивается, когда `head` доходит до конца списка, а список в это время может ещё расти.\n\nВторая — сетка `dist`: сетка чисел точно такого же размера, как карта, то есть список, внутри которого лежат списки, поэтому и пишется `dist[r][c]`. Вначале везде −1. Старту ставим 0, а новой клетке ставим `dist[nr][nc] = dist[r][c] + 1`: на один шаг дальше. И это −1 делает сразу две работы: пока волна идёт, оно означает «здесь я ещё не был», а когда волна остановилась — «сюда добраться нельзя». Поэтому отдельная сетка отметок не нужна.",
    },
    code:
      "qr = [0]\n" +
      "qc = [0]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    if r == 0 and c == 0:\n" +
      "        qr.append(1)\n" +
      "        qc.append(0)\n" +
      "        qr.append(0)\n" +
      "        qc.append(1)\n" +
      "print(qr)\n" +
      "print(qc)\n" +
      "print(head)",
  },
  {
    /*
     * The animation the PDF asks for by name: «толқын түрінде боялатын
     * анимация». It is declared so that it lights up the day the visualiser
     * lands; until then the learner meets the honest placeholder and the
     * prompt's last sentence, which sends them to squared paper.
     *
     * Not an attempt block — watching a wave spread is not evidence about
     * anything, and b4, b5 and b7 are where the same question is graded. The
     * map is the one the next card reasons through in full, on purpose: seeing
     * the shape first and reading the argument second is the order the
     * programme puts them in.
     */
    id: "m7.l3.b2",
    type: "visual_simulation",
    skillRefs: ["graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    simulation: "bfs_wave",
    prompt: {
      kk: "Толқынды қадамдап жүргіз. Әр қадамда бір қабат ұяшық боялады, ал әр боялған ұяшықтың үстінде оның стартқа дейінгі қадам саны жазылады. Келесі қадамды баспас бұрын өзің айтып ал: дәл қазір қандай ұяшықтар боялады және оларда қандай сан тұрады? Егер анимация ашылмаса, осы картаны дәптеріңе торкөзбен сал да, қабаттарды 0, 1, 2, … деп өзің нөмірлеп шық.",
      ru: "Прогони волну по шагам. На каждом шаге закрашивается один слой клеток, и в каждой закрашенной клетке написано, за сколько шагов до неё доходят от старта. Прежде чем нажать следующий шаг, проговори про себя: какие клетки закрасятся сейчас и какое число в них будет? Если анимация не открылась, перерисуй эту карту в тетради по клеточкам и пронумеруй слои: 0, 1, 2, …",
    },
    config: {
      grid: [".....", ".###.", "...#.", ".#..."],
      start: [0, 0],
      finish: [3, 4],
      neighbours: 4,
      show: ["distance", "queue", "layer"],
      askBeforeStep: true,
    },
  },
  {
    /*
     * «Толық талданған мысал» on the 4×5 maze the simulation above showed. The
     * reasoning is one layer per step, which is exactly the claim b6 and b10
     * ask the learner to defend: the wave finishes layer k before it starts
     * layer k+1.
     *
     * The program embeds its map and prints the WHOLE distance grid — four
     * lists of five numbers. No task in this lesson asks for that output, so
     * the card shows the method without handing over an answer, and the −1s
     * left behind in the wall positions are visible rather than described.
     */
    id: "m7.l3.b3",
    type: "worked_example",
    skillRefs: ["graph.bfs", "graph.shortest_path", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: 4×5 лабиринттегі толқын",
      ru: "Разобранный пример: волна в лабиринте 4×5",
    },
    problem: {
      kk: "Карта 4 жол мен 5 бағаннан тұрады:\n\n```\n.....\n.###.\n...#.\n.#...\n```\n\nСтарт — сол жақ жоғарғы ұяшық (0, 0). Әр бос ұяшыққа старттан неше қадамда жетуге болатынын тауып, барлық қашықтықты жазып шығайық.",
      ru: "Карта состоит из 4 строк и 5 столбцов:\n\n```\n.....\n.###.\n...#.\n.#...\n```\n\nСтарт — левая верхняя клетка (0, 0). Найдём, за сколько шагов можно дойти от старта до каждой свободной клетки, и выпишем все расстояния.",
    },
    steps: [
      {
        kk: "Басында `dist` торындағы барлық сан −1: әлі ешқайда бармадық. Старттың өзіне 0 қоямыз, өйткені старттан старттың өзіне жету үшін бірде-бір қадам керек емес. Кезекке де сол бір ұяшық салынады.",
        ru: "Вначале все числа в сетке `dist` равны −1: мы ещё никуда не ходили. Самому старту ставим 0, потому что от старта до старта не нужно ни одного шага. В очередь кладём эту же единственную клетку.",
      },
      {
        kk: "0-қабаттан 1-қабатқа. (0, 0) ұяшығының төрт көршісін қараймыз: жоғары және солға шығуға болмайды, ал төмендегі (1, 0) мен оң жақтағы (0, 1) — бос ұяшық және оларда әлі −1 тұр. Екеуіне де 1 қойып, кезектің соңына қосамыз. Кезекте енді үш ұяшық бар, ал `head` бірінші ұяшықтан өтіп кетті.",
        ru: "От слоя 0 к слою 1. Смотрим четырёх соседей клетки (0, 0): вверх и влево выйти нельзя, а нижняя (1, 0) и правая (0, 1) свободны, и в них ещё стоит −1. Ставим обеим 1 и добавляем их в конец очереди. Теперь в очереди три клетки, а `head` уже прошёл первую.",
      },
      {
        kk: "1-қабаттан 2-қабатқа. Кезектен (1, 0) шығады: оның астындағы (2, 0) бос, оған 2 қойылады, ал оң жағындағы (1, 1) — қабырға, сондықтан ол мәңгі −1 күйінде қалады. Содан кейін (0, 1) шығады: оның оң жағындағы (0, 2) бос, оған да 2 қойылады. Екі жаңа ұяшық та бір қабаттан — бұл кездейсоқтық емес.",
        ru: "От слоя 1 к слою 2. Из очереди выходит (1, 0): клетка под ней (2, 0) свободна, ей ставится 2, а справа (1, 1) — стена, поэтому она навсегда остаётся со своим −1. Потом выходит (0, 1): справа от неё (0, 2) свободна, ей тоже ставится 2. Обе новые клетки — из одного слоя, и это не случайность.",
      },
      {
        kk: "Ереже осылай жалғасады: кезектегі ұяшық `k` санын ұстап тұрса, оның жаңа көршілеріне `k + 1` қойылады. Кезекке ұяшықтар қосылу ретімен жататындықтан, барлық 2 саны 3-тен бұрын, барлық 3 саны 4-тен бұрын қойылады. Ортадағы `###` қабырғасы толқынды тоқтатады, сондықтан ол оң жақ бағанға жоғарғы жол арқылы емес, астыңғы жолдармен айналып барады.",
        ru: "Дальше правило то же: если клетка в очереди держит число `k`, её новым соседям ставится `k + 1`. Так как клетки лежат в очереди в порядке добавления, все двойки проставляются раньше всех троек, а все тройки — раньше четвёрок. Стена `###` посередине останавливает волну, поэтому в правый столбец она попадает не по верхней строке, а в обход по нижним.",
      },
      {
        kk: "Толқын қабат-қабатпен осылай жүреді: 0-қабатта бір ұяшық, 1-қабатта екі ұяшық, 2-қабатта екі ұяшық, 3-қабатта үш ұяшық, 4-, 5- және 6-қабаттардың әрқайсысында тағы екі ұяшық, ал 7-қабатта жалғыз (3, 4) ұяшығы қалады. `head` тізімнің соңына жеткенде толқын тоқтайды: қосылатын жаңа ұяшық қалмады.",
        ru: "Волна идёт слой за слоем: в слое 0 одна клетка, в слое 1 две, в слое 2 две, в слое 3 три, дальше снова по две, а в слое 7 остаётся единственная клетка (3, 4). Когда `head` доходит до конца списка, волна останавливается: новых клеток добавлять больше некуда.",
      },
    ],
    code:
      'g = [".....", ".###.", "...#.", ".#..."]\n' +
      "n = 4\n" +
      "m = 5\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[0][0] = 0\n" +
      "qr = [0]\n" +
      "qc = [0]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "for r in range(n):\n" +
      "    print(dist[r])",
    result: {
      kk: "Бағдарлама төрт жол шығарады — `dist` торының әр жолы:\n\n```\n[0, 1, 2, 3, 4]\n[1, -1, -1, -1, 5]\n[2, 3, 4, -1, 6]\n[3, -1, 5, 6, 7]\n```\n\nҚабырғалардың орнында −1 қалды, ал оң жақ төменгі бұрышқа (3, 4) дейін 7 қадам керек.",
      ru: "Программа выводит четыре строки — по строке сетки `dist`:\n\n```\n[0, 1, 2, 3, 4]\n[1, -1, -1, -1, 5]\n[2, 3, 4, -1, 6]\n[3, -1, 5, 6, 7]\n```\n\nНа местах стен осталось −1, а до правого нижнего угла (3, 4) нужно 7 шагов.",
    },
  },
  {
    /*
     * «оқушы келесі қандай ұяшықтар өңделетінін болжайды» — the PDF's own
     * sentence, in a block type that works today.
     *
     * The program is ONE round of the wave, not the wave: `dist` arrives
     * already filled up to layer 2, and the code colours the cells that come
     * next. So the answer is not a distance the learner can copy from b3 (a
     * different map), and the reasoning demanded is exactly the one the
     * animation would demand — look at the frontier, look at its neighbours,
     * throw out the walls and the already-numbered.
     *
     * Both mapped distractors have exactly one route into them. «0 3 / 1 2 /
     * 2 1» adds (1, 2), which is a `#`: the only way to include it is to have
     * skipped the wall test. «0 3 / 2 1 / 1 3» adds (1, 3), which is a
     * neighbour of (0, 3) — a cell that is being coloured in THIS round — so
     * the only way to reach it is to let the wave run on from cells it has just
     * coloured instead of stopping at the end of the layer. «0 1 / 1 0» is left
     * unmapped on purpose: it is the previous layer, and a learner can land on
     * it either by misreading which layer is being asked for or by simply
     * losing count, which is two causes.
     */
    id: "m7.l3.b4",
    type: "prediction",
    skillRefs: ["graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Карта 3 жол мен 4 бағаннан тұрады, ортасында екі қабырға бар. Толқын (0, 0) ұяшығынан басталған және 2-қабатқа дейін боялып үлгерді: `dist` торында бір 0, екі 1 және екі 2 тұр, қалған ұяшықтарда әлі −1. Төмендегі бағдарлама келесі қабатқа кіретін ұяшықтарды тауып, әрқайсысының жолы мен бағанын жеке жолға шығарады. Ол нені шығарады?",
      ru: "Карта состоит из 3 строк и 4 столбцов, посередине две стены. Волна пошла из клетки (0, 0) и успела закрасить всё до слоя 2: в сетке `dist` стоят один 0, две 1 и две 2, в остальных клетках пока −1. Программа ниже находит клетки, которые войдут в следующий слой, и выводит строку и столбец каждой из них на отдельной строке. Что она выведет?",
    },
    code:
      'g = ["....", ".##.", "...."]\n' +
      "dist = [[0, 1, 2, -1], [1, -1, -1, -1], [2, -1, -1, -1]]\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "for r in range(3):\n" +
      "    for c in range(4):\n" +
      "        if dist[r][c] == 2:\n" +
      "            for k in range(4):\n" +
      "                nr = r + dr[k]\n" +
      "                nc = c + dc[k]\n" +
      "                if nr >= 0 and nr < 3 and nc >= 0 and nc < 4:\n" +
      '                    if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                        dist[nr][nc] = 3\n" +
      "                        print(nr, nc)",
    answer: "0 3\n2 1",
    options: ["0 3\n2 1", "0 3\n1 2\n2 1", "0 3\n2 1\n1 3", "0 1\n1 0"],
    diagnosticMapping: {
      "0 3\n1 2\n2 1": {
        failureClass: "wall_not_checked_in_neighbour_test",
        justification:
          "(1, 2) ұяшығы — қабырға, картада ол `#` таңбасымен тұр. Оны жауапқа қосудың жалғыз жолы — көршіні тексергенде `g[nr][nc] == \".\"` шартын мүлде қарамау. Басқа қате бұл ұяшықты тізімге кіргізе алмайды.",
      },
      "0 3\n2 1\n1 3": {
        failureClass: "wave_chained_within_one_layer",
        justification:
          "(1, 3) — дәл осы қадамда боялып жатқан (0, 3) ұяшығының көршісі, яғни ол келесі қабатта емес, одан кейінгі қабатта. Бұл жауап толқынды бір қабатта тоқтатпай, жаңа боялған ұяшықтардан әрі қарай жалғастырғанда ғана шығады.",
      },
    },
  },
  {
    /*
     * The queue and the head index, by hand. The map is a 3×3 with one wall in
     * the middle — small enough that eight rounds fit on paper, big enough that
     * the queue outgrows the head twice before it is caught.
     *
     * The columns are chosen so the growth is the visible thing: qr and qc are
     * recorded at the moment head has just advanced, BEFORE this round's
     * appends, so a learner reading two consecutive rows sees precisely which
     * cells the previous round added. Rounds 7 and 8 add nothing, and that is
     * the point at which head finally catches len(qr) — the stopping condition
     * stated in b1.
     *
     * The program prints the number of cells the wave reached (8 of the 9, one
     * being the wall), which is a question no task in this lesson asks.
     */
    id: "m7.l3.b5",
    type: "trace_code",
    skillRefs: ["graph.bfs", "twopointers.core", "loops.while", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Қағазға бес баған сыз: `head`, `r`, `c`, `qr`, `qc`. Циклдің әр айналымында 19-жол орындалғаннан кейінгі мәндерді жаз — яғни `head` бір артқаннан кейін, бірақ бұл айналымда жаңа ұяшықтар қосылғанға дейін. Сонда әр жолдағы `qr` пен `qc` алдыңғы айналымда кезекке не қосылғанын көрсетеді. Соңғы жолға 28-жол орындалғандағы мәндерді жаз. Карта 3×3, ортасында бір қабырға бар.",
      ru: "Начерти на бумаге пять столбцов: `head`, `r`, `c`, `qr`, `qc`. На каждом обороте цикла записывай значения после выполнения строки 19 — то есть после того, как `head` увеличился, но до того, как на этом обороте добавились новые клетки. Тогда `qr` и `qc` в каждой строке показывают, что положил в очередь предыдущий оборот. В последнюю строку запиши значения на строке 28. Карта 3×3, посередине одна стена.",
    },
    code:
      'g = ["...", ".#.", "..."]\n' +
      "n = 3\n" +
      "m = 3\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[0][0] = 0\n" +
      "qr = [0]\n" +
      "qc = [0]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "print(len(qr))",
    steps: [
      { line: 19, vars: { head: "1", r: "0", c: "0", qr: "[0]", qc: "[0]" } },
      { line: 19, vars: { head: "2", r: "1", c: "0", qr: "[0, 1, 0]", qc: "[0, 0, 1]" } },
      { line: 19, vars: { head: "3", r: "0", c: "1", qr: "[0, 1, 0, 2]", qc: "[0, 0, 1, 0]" } },
      { line: 19, vars: { head: "4", r: "2", c: "0", qr: "[0, 1, 0, 2, 0]", qc: "[0, 0, 1, 0, 2]" } },
      { line: 19, vars: { head: "5", r: "0", c: "2", qr: "[0, 1, 0, 2, 0, 2]", qc: "[0, 0, 1, 0, 2, 1]" } },
      { line: 19, vars: { head: "6", r: "2", c: "1", qr: "[0, 1, 0, 2, 0, 2, 1]", qc: "[0, 0, 1, 0, 2, 1, 2]" } },
      { line: 19, vars: { head: "7", r: "1", c: "2", qr: "[0, 1, 0, 2, 0, 2, 1, 2]", qc: "[0, 0, 1, 0, 2, 1, 2, 2]" } },
      { line: 19, vars: { head: "8", r: "2", c: "2", qr: "[0, 1, 0, 2, 0, 2, 1, 2]", qc: "[0, 0, 1, 0, 2, 1, 2, 2]" } },
      { line: 28, vars: { head: "8", "len(qr)": "8" } },
    ],
  },
  {
    /*
     * The month's assessment question — «табылған жолдың неге шынымен ең қысқа
     * екенін» — asked once here as a choice, so that b10 is a defence of a
     * position the learner has already had to take rather than a first attempt
     * at one.
     *
     * o3 and o4 are mapped; o2 is not. o3 is the confusion between "no loops"
     * and "shortest", which nothing else produces: a route without repeats is
     * genuinely a route, it is simply not necessarily the shortest one, and a
     * learner who picks it has stated exactly that belief. o4 is the belief
     * that the spread is aimed at the finish, which the b3 grid disproves on
     * sight — every reachable cell got a number, including the ones behind the
     * start. o2 is unmapped because "the neighbour order matters" and "I
     * guessed the option that mentions code I recognise" both land there.
     */
    id: "m7.l3.b6",
    type: "multiple_choice",
    skillRefs: ["graph.shortest_path", "graph.bfs"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Толқын әдісінде әр ұяшыққа ол бірінші рет боялған сәттегі сан жазылады да, ол сан бұдан кейін ешқашан өзгертілмейді. Дәл сол сан неге шынымен де ең қысқа жолдың ұзындығы болып шығады?",
      ru: "В методе волны каждой клетке записывается число в тот момент, когда её закрасили впервые, и это число потом уже никогда не меняется. Почему именно оно и оказывается длиной кратчайшего пути?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Кезектегі ұяшықтар қосылу ретімен жататындықтан, k саны бар барлық ұяшық k + 1 саны барлардың бәрінен бұрын өңделеді. Демек ұяшық бірінші рет боялғанда, оны бояған көрші — оған жетуге болатын ең кіші саны бар көрші.",
          ru: "Клетки лежат в очереди в порядке добавления, поэтому все клетки с числом k обрабатываются раньше всех клеток с числом k + 1. Значит, когда клетка закрашивается впервые, её закрашивает сосед с наименьшим числом из возможных.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Көршілерді әрқашан жоғары, төмен, солға, оңға деген ретпен қарап шығамыз, ал дәл осы рет ең қысқа жолды береді.",
          ru: "Мы всегда перебираем соседей в порядке вверх, вниз, влево, вправо, и именно этот порядок даёт кратчайший путь.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Бір ұяшыққа екі рет кірмейміз, сондықтан жолда қайталанатын ұяшық болмайды, ал қайталанатын ұяшығы жоқ жол әрқашан ең қысқа болады.",
          ru: "Мы не заходим в одну клетку дважды, поэтому в пути нет повторяющихся клеток, а путь без повторов всегда кратчайший.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Толқын әрқашан финиш жаққа қарай тарайды және басқа бағыттарға бекер уақыт жұмсамайды, сондықтан ол финишке ең қысқа жолмен келеді.",
          ru: "Волна всегда распространяется в сторону финиша и не тратит время на другие направления, поэтому и приходит к финишу кратчайшим путём.",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o3: {
        failureClass: "loopless_route_assumed_shortest",
        justification:
          "Қайталанатын ұяшығы жоқ жол өте ұзын да бола алады: лабиринтті түгел айналып өтіп барып финишке келуге болады, онда да бірде-бір ұяшық екі рет кездеспейді. Бұл жауапты таңдау — «қайталанбайды» дегенді «ең қысқа» дегенмен теңестіру, ал бұл нақты бір ғана түсінбеушілік.",
      },
      o4: {
        failureClass: "directed_wave_assumption",
        justification:
          "Толқын финишке қарай бағытталмайды: ол барлық жаққа бірдей тарайды және жетуге болатын әр ұяшыққа сан қояды — алдыңғы карточкадағы `dist` торында старттың арт жағындағы ұяшықтарда да сан тұр. Бұл жауап толқынды мақсатқа бағытталған іздеу деп түсінгенде ғана таңдалады.",
      },
    },
  },
  {
    /*
     * The reconstruction card. Four blanks, and each one is a decision the
     * lesson exists to teach rather than a word to copy:
     *   f1 — the loop ends when head catches the END of a list that is still
     *        growing, which is the sentence b1 spends a paragraph on;
     *   f2 — one step further than the cell we came from, which is the whole
     *        content of `graph.shortest_path`;
     *   f3, f4 — the new cell goes to the BACK of the queue, in both parallel
     *        lists, and getting nr/nc the wrong way round here is the mistake
     *        that turns the map on its side.
     *
     * The question is deliberately neither of the two the write_code tasks ask:
     * how far away the farthest reachable cell is. So the completed program is
     * not an answer anybody is about to be asked for — and it is the program
     * b9s then modifies, which is the only reuse direction the contract allows.
     *
     * Note the last input line: two numbers, not four. This task has no finish,
     * so it is not given one; the prompt states its own format in full.
     */
    id: "m7.l3.b7",
    type: "fill_blank",
    skillRefs: ["graph.bfs", "graph.shortest_path", "grid.cells"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n мен m сандары беріледі (карта жолдарының және бағандарының саны, 1 ≤ n, m ≤ 20). Келесі n жолда карта: әр жолда m таңба, `.` — бос ұяшық, `#` — қабырға. Соңғы жолда екі сан: старт ұяшығының жолы мен бағаны (жолдар да, бағандар да нөлден саналады). Бағдарлама старттан жетуге болатын ұяшықтардың ең алысындағысына дейін неше қадам керегін шығаруы керек. Мысалы, 3×4 картада\n\n```\n....\n.##.\n....\n```\n\nстарт (0, 0) болса, жауап 5. Толқындағы төрт бос орынды толықтыр.",
      ru: "В первой строке даны числа n и m (количество строк и столбцов карты, 1 ≤ n, m ≤ 20). В следующих n строках — карта: по m символов в строке, `.` — свободная клетка, `#` — стена. В последней строке два числа: строка и столбец стартовой клетки (строки и столбцы нумеруются с нуля). Программа должна вывести, сколько шагов нужно до самой дальней из клеток, до которых от старта вообще можно добраться. Например, на карте 3×4\n\n```\n....\n.##.\n....\n```\n\nсо стартом (0, 0) ответ равен 5. Дополни четыре пропуска в волне.",
    },
    template:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[sr][sc] = 0\n" +
      "qr = [sr]\n" +
      "qc = [sc]\n" +
      "head = 0\n" +
      "while head < ___:\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = ___\n" +
      "                qr.append(___)\n" +
      "                qc.append(___)\n" +
      "best = 0\n" +
      "for r in range(n):\n" +
      "    for c in range(m):\n" +
      "        if dist[r][c] > best:\n" +
      "            best = dist[r][c]\n" +
      "print(best)",
    blanks: [
      { id: "f1", answer: "len(qr)", alternatives: ["len(qc)"] },
      { id: "f2", answer: "dist[r][c] + 1", alternatives: ["dist[r][c]+1", "1 + dist[r][c]"] },
      { id: "f3", answer: "nr" },
      { id: "f4", answer: "nc" },
    ],
  },
  {
    /*
     * PDF p.9: «бір ұяшықтан екіншісіне жетуге бола ма».
     *
     * The starter carries the input reading, the −1 grid and the neighbour
     * lists — all of it m7.l1's content, none of it this lesson's. What the
     * learner writes is the wave and the decision, and the decision is where
     * the double duty of −1 earns its keep: no separate flag, no second array,
     * just "did the finish ever get a number".
     *
     * "Use the wave" is stated as the method being practised and NOT as a rule
     * (contract §4, option 2): a depth-first walk answers yes/no correctly and
     * no output comparison can tell the difference, so the prompt says plainly
     * that only the printed word is compared.
     *
     * Degenerate programs and the case that kills each:
     *   · "both cells are free, so yes" and "always yes" → the 5×5 with the
     *     finish sealed inside a ring of walls, and the 1×3 «.#.» where the
     *     finish is in the same row as the start;
     *   · "always no" → every yes case;
     *   · a walk that only ever moves right and down → the snake map, whose
     *     only route goes up three times;
     *   · a wave that forgets to mark the start → the 1×1 map, where the answer
     *     is yes with zero steps taken;
     *   · a bounds test written `nc <= m` → any map whose wave touches the last
     *     column, e.g. the first case, which crashes instead of printing.
     */
    id: "m7.l3.b8",
    type: "write_code",
    skillRefs: ["graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бірінші жолда n мен m сандары беріледі: карта жолдарының және бағандарының саны (1 ≤ n, m ≤ 20). Келесі n жолда карта: әр жолда m таңба, `.` — бос ұяшық, `#` — қабырға. Соңғы жолда төрт сан: старт ұяшығының жолы мен бағаны, содан кейін финиш ұяшығының жолы мен бағаны. Жолдар да, бағандар да нөлден саналады; старт пен финиш әрқашан бос ұяшық және олар бір ұяшық болуы да мүмкін. Тек көрші ұяшыққа — жоғары, төмен, солға немесе оңға — жүруге болады, қабырғаға баспайсың. Старттан финишке жетуге бола ма? Болса `yes`, болмаса `no` деп шығар — дәл осы екі ағылшын сөзі. Бүгінгі сабақтың тәсілімен, толқынмен шеш: старттан толқын жіберіп, финиш ұяшығына сан қойылды ма, соны қара. Тексеруші тек шыққан сөзді салыстырады, сондықтан бұл міндетті ереже емес — бірақ ай соңындағы сынақта дәл осы тәсіл сұралады.",
      ru: "В первой строке даны числа n и m: количество строк и столбцов карты (1 ≤ n, m ≤ 20). В следующих n строках — карта: по m символов в строке, `.` — свободная клетка, `#` — стена. В последней строке четыре числа: строка и столбец стартовой клетки, затем строка и столбец финишной. Строки и столбцы нумеруются с нуля; старт и финиш всегда свободны и могут оказаться одной и той же клеткой. Ходить можно только в соседнюю клетку — вверх, вниз, влево или вправо, — и наступать на стену нельзя. Можно ли добраться из старта в финиш? Выведи `yes`, если можно, и `no`, если нельзя, — именно эти два английских слова. Решай приёмом сегодняшнего урока, волной: пусти волну из старта и посмотри, получила финишная клетка число или нет. Проверяющая программа сравнивает только выведенное слово, так что это не обязательное правило — но на проверке в конце месяца спросят именно этот приём.",
    },
    starter:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc, fr, fc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]",
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc, fr, fc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[sr][sc] = 0\n" +
      "qr = [sr]\n" +
      "qc = [sc]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "if dist[fr][fc] == -1:\n" +
      '    print("no")\n' +
      "else:\n" +
      '    print("yes")',
    cases: [
      { input: "4 5\n.....\n.###.\n...#.\n.#...\n0 0 3 4", expectedOutput: "yes" },
      { input: "5 5\n.....\n.###.\n.#.#.\n.###.\n.....\n0 0 2 2", expectedOutput: "no" },
      { input: "1 1\n.\n0 0 0 0", expectedOutput: "yes", hidden: true },
      { input: "1 3\n.#.\n0 0 0 2", expectedOutput: "no", hidden: true },
      { input: "4 5\n.#...\n.#.#.\n...#.\n####.\n0 0 3 4", expectedOutput: "yes", hidden: true },
      { input: "3 3\n...\n###\n...\n0 0 2 2", expectedOutput: "no", hidden: true },
      { input: "2 4\n.###\n....\n0 0 1 3", expectedOutput: "yes", hidden: true },
      { input: "3 4\n....\n.##.\n....\n2 3 0 0", expectedOutput: "yes", hidden: true },
      { input: "2 2\n.#\n#.\n0 0 1 1", expectedOutput: "no", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9: «лабиринттегі ең қысқа жол». The month's central task, and the
     * one card in this lesson with an empty editor — no starter, because the
     * assessment will not give one either.
     *
     * −1 is the answer as well as the marker, so the program that computes the
     * distances has already computed the "there is no path" case; the prompt
     * says so, and the two visible cases show both shapes.
     *
     * Degenerate programs and the case that kills each:
     *   · |Δr| + |Δc| in a straight line → «5 5 / ..... / ####. / ..... /
     *     .#### / .....» answers 16 against a straight-line 8, and the snake
     *     map answers 11 against 7;
     *   · a depth-first walk that reports the first route it finds →
     *     «3 5 / ..... / .###. / .....» with the finish two cells below the
     *     start: depth-first goes right along the top, down the far side and
     *     back along the bottom, arriving after 10 steps instead of 2;
     *   · counting the cells of the path instead of the steps between them →
     *     the 1×2 map, where the answer is 1 and the cell count is 2;
     *   · a wave that never writes 0 into the start → the 1×1 map, where the
     *     answer is exactly that 0;
     *   · a solution that assumes the start is (0, 0) or the finish the bottom
     *     right corner → «3 4 / .... / .##. / ....» run backwards, from (2, 3)
     *     to (0, 0);
     *   · a solution that always adds a detour → the fully open 3×3, where the
     *     straight answer 4 is correct.
     */
    id: "m7.l3.b9",
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Кіріс форматы алдыңғы тапсырмадағыдай. Бірінші жолда n мен m (1 ≤ n, m ≤ 20), келесі n жолда карта (`.` — бос ұяшық, `#` — қабырға), соңғы жолда төрт сан: старттың жолы мен бағаны, сосын фиништің жолы мен бағаны; нөлден саналады. Жүру тек көрші ұяшыққа: жоғары, төмен, солға, оңға. Старттан финишке дейінгі ең қысқа жолдың ұзындығын, яғни қадам санын шығар. Егер финишке жету мүмкін болмаса, -1 шығар. Старт пен финиш бір ұяшық болса, жауап 0. Толқын әдісімен шеш: `dist` торындағы −1 екі сұраққа бірден жауап беретінін ұмытпа. Тексеруші тек шыққан санды салыстырады.",
      ru: "Формат ввода такой же, как в предыдущей задаче. В первой строке n и m (1 ≤ n, m ≤ 20), в следующих n строках карта (`.` — свободная клетка, `#` — стена), в последней строке четыре числа: строка и столбец старта, затем строка и столбец финиша; нумерация с нуля. Ходить можно только в соседнюю клетку: вверх, вниз, влево, вправо. Выведи длину кратчайшего пути от старта до финиша — количество шагов. Если до финиша добраться нельзя, выведи -1. Если старт и финиш — одна и та же клетка, ответ 0. Решай методом волны: не забывай, что −1 в сетке `dist` отвечает сразу на два вопроса. Проверяющая программа сравнивает только выведенное число.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc, fr, fc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[sr][sc] = 0\n" +
      "qr = [sr]\n" +
      "qc = [sc]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "print(dist[fr][fc])",
    cases: [
      { input: "4 5\n.....\n.###.\n...#.\n.#...\n0 0 3 4", expectedOutput: "7" },
      { input: "3 3\n...\n###\n...\n0 0 2 2", expectedOutput: "-1" },
      { input: "1 1\n.\n0 0 0 0", expectedOutput: "0", hidden: true },
      { input: "1 2\n..\n0 0 0 1", expectedOutput: "1", hidden: true },
      { input: "3 5\n.....\n.###.\n.....\n0 0 2 0", expectedOutput: "2", hidden: true },
      { input: "5 5\n.....\n####.\n.....\n.####\n.....\n0 0 4 4", expectedOutput: "16", hidden: true },
      { input: "4 5\n.#...\n.#.#.\n...#.\n####.\n0 0 3 4", expectedOutput: "11", hidden: true },
      { input: "5 5\n.....\n.###.\n.#.#.\n.###.\n.....\n0 0 2 2", expectedOutput: "-1", hidden: true },
      { input: "3 4\n....\n.##.\n....\n2 3 0 0", expectedOutput: "5", hidden: true },
      { input: "3 3\n...\n...\n...\n0 0 2 2", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m7.l3.b9 — the same problem, the same input
     * format, the same output, rebuilt from something already finished instead
     * of typed from an empty editor (PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ»).
     *
     * The starting program is the one this learner completed at b7: the wave
     * that reports the farthest reachable cell. That is the one reuse direction
     * the authoring contract allows — forwards, from a finished program towards
     * a question no card has answered — and it is why this block is a
     * modify_code rather than a second fill_blank.
     *
     * The prompt names the program by what it does, not by where it sits, so it
     * reads correctly on the support route where b8 is the card in between.
     *
     * Three real edits, and each is a decision: the last input line now carries
     * four numbers rather than two; the search for the largest number is
     * replaced by reading one cell; and the −1 that used to be invisible (`best`
     * started at 0 and never fell below it) is now the answer itself. The
     * result keeps the answer in `ans` before printing, so the assembled text
     * is nobody else's program either.
     *
     * Cases are b9's, minus three: a support learner meets the same boundaries
     * — start equal to finish, one step, no path at all, the map walked
     * backwards — on a shorter set.
     */
    id: "m7.l3.b9s",
    type: "modify_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "grid.cells"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Төмендегі бағдарламаны сен толықтырғансың: ол картаны оқып, толқын жүргізеді және старттан ең алыс ұяшыққа дейінгі қадам санын шығарады. Енді оны басқа сұраққа жауап беретін етіп өзгерт. Кіріс сәл өзгереді: соңғы жолда енді төрт сан болады — старттың жолы мен бағаны, содан кейін фиништің жолы мен бағаны (бәрі нөлден саналады). Бағдарлама старттан финишке дейінгі ең қысқа жолдың ұзындығын, яғни қадам санын шығарсын. Финишке жету мүмкін болмаса, -1 шығарсын; старт пен финиш бір ұяшық болса, 0 шығарсын. Ең үлкен санды іздейтін бөлік енді керек емес: жауап `dist` торының финиш ұяшығында дайын тұр.",
      ru: "Ниже — программа из задания с пропусками: она читает карту, пускает волну и выводит, за сколько шагов доходят до самой дальней клетки от старта. Теперь измени её так, чтобы она отвечала на другой вопрос. Ввод немного меняется: в последней строке теперь четыре числа — строка и столбец старта, затем строка и столбец финиша (всё нумеруется с нуля). Пусть программа выведет длину кратчайшего пути от старта до финиша, то есть количество шагов. Если до финиша добраться нельзя, пусть выведет -1; если старт и финиш — одна и та же клетка, пусть выведет 0. Часть, которая ищет наибольшее число, больше не нужна: ответ уже лежит в сетке `dist` в финишной клетке.",
    },
    code:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[sr][sc] = 0\n" +
      "qr = [sr]\n" +
      "qc = [sc]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "best = 0\n" +
      "for r in range(n):\n" +
      "    for c in range(m):\n" +
      "        if dist[r][c] > best:\n" +
      "            best = dist[r][c]\n" +
      "print(best)",
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc, fr, fc = map(int, input().split())\n" +
      "dist = []\n" +
      "for r in range(n):\n" +
      "    row = []\n" +
      "    for c in range(m):\n" +
      "        row.append(-1)\n" +
      "    dist.append(row)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "dist[sr][sc] = 0\n" +
      "qr = [sr]\n" +
      "qc = [sc]\n" +
      "head = 0\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head = head + 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "ans = dist[fr][fc]\n" +
      "print(ans)",
    cases: [
      { input: "4 5\n.....\n.###.\n...#.\n.#...\n0 0 3 4", expectedOutput: "7" },
      { input: "3 3\n...\n###\n...\n0 0 2 2", expectedOutput: "-1" },
      { input: "1 1\n.\n0 0 0 0", expectedOutput: "0", hidden: true },
      { input: "1 2\n..\n0 0 0 1", expectedOutput: "1", hidden: true },
      { input: "3 5\n.....\n.###.\n.....\n0 0 2 0", expectedOutput: "2", hidden: true },
      { input: "3 4\n....\n.##.\n....\n2 3 0 0", expectedOutput: "5", hidden: true },
      { input: "5 5\n.....\n.###.\n.#.#.\n.###.\n.....\n0 0 2 2", expectedOutput: "-1", hidden: true },
    ],
  },
  {
    /*
     * The month's assessment sentence, rehearsed one lesson early and sent to a
     * human: «табылған жолдың неге шынымен ең қысқа екенін түсіндіреді». This
     * is contract §4 option 3 — the claim that the answer is a SHORTEST path is
     * not something output comparison can check on any map, so it is asked in
     * words and read by a teacher.
     *
     * All three tracks, because the argument is the month's stated outcome for
     * everybody, not an advanced extra. Two questions, not four: this is a
     * ten-minute lesson and the second question is the one that separates a
     * memorised sentence from an understood one.
     *
     * Never machine-scored — the verdict settles as `unknown`.
     */
    id: "m7.l3.b10",
    type: "explain",
    skillRefs: ["graph.shortest_path", "graph.bfs"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Толқын әдісімен тапқан жауабыңды жазбаша қорғап шық. Екі сұраққа қысқа жауап жаз. (1) Толқын неге барлық 3 санын барлық 4 санынан бұрын қояды — мұны кезектің қалай жұмыс істейтінімен байланыстырып түсіндір. (2) Бір ұяшыққа 4 саны қойылып қойған делік. Кейін сол ұяшыққа 3 қадаммен жетуге болатыны анықталуы мүмкін бе? Неге? Жауабыңды мұғалім оқиды.",
      ru: "Защити письменно свой ответ: почему путь, найденный методом волны, действительно кратчайший? Ответь коротко на два вопроса. (1) Почему волна расставляет все тройки раньше всех четвёрок — объясни это через то, как устроена очередь. (2) Допустим, в какой-то клетке уже стоит 4. Может ли позже выясниться, что до неё можно дойти за 3 шага? Почему? Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "Ұяшық кезекке қосылған сәтте оның саны да қойылады, ал кезектен ұяшықтар қосылу ретімен алынады. Сондықтан саны 3-ке тең ұяшықтардың бәрі саны 4-ке тең кез келген ұяшықтан бұрын өңделеді.",
        ru: "Число ставится клетке в тот же момент, когда её кладут в очередь, а из очереди клетки берутся в порядке добавления. Поэтому все клетки с числом 3 обрабатываются раньше любой клетки с числом 4.",
      },
      {
        kk: "Жоқ, кейін 3 қадамдық жол табылмайды. Егер ол ұяшыққа 3 қадаммен жетуге болатын болса, оның саны 2 болатын көршісі бар деген сөз, ал ондай көрші өзінің кезегінде — 4 саны қойылғанға дейін өңделген болар еді және ұяшықты сол сәтте-ақ 3 деп белгілер еді.",
        ru: "Нет, путь в 3 шага позже не найдётся. Если бы до этой клетки можно было дойти за 3 шага, у неё был бы сосед с числом 2, а такой сосед обработался бы в свою очередь раньше, чем была поставлена 4, и пометил бы клетку числом 3 уже тогда.",
      },
      {
        kk: "Осыдан шығатын қорытынды: ұяшыққа бірінші рет қойылған сан ешқашан өзгертілмейді, өйткені одан кіші сан қоятын жағдай енді ешқашан кездеспейді. Дәл сол сан — ең қысқа жолдың ұзындығы.",
        ru: "Отсюда и вывод: число, поставленное клетке впервые, уже никогда не меняется, потому что случая поставить меньшее число просто больше не возникнет. Именно оно и есть длина кратчайшего пути.",
      },
      {
        kk: "Толқын қай жолмен келгенін әзірге сақтамайды — ол тек ұзындықты біледі. Маршруттың өзін қалпына келтіру келесі сабақтың жұмысы.",
        ru: "Сам маршрут волна пока не запоминает — она знает только длину. Восстановление самого пути — работа следующего урока.",
      },
    ],
  },
];
