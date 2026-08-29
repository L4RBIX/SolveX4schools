import type { LessonBlock } from "../../types";

/**
 * Lesson m7.l2 · «Аймақтарды бөлу» / «Выделение областей». PDF p.9, March.
 * Skills: `graph.dfs`, `graph.regions`, `recursion.core`. 9 minutes.
 *
 * ## The clauses this lesson answers to
 *
 * «Лабиринттегі ең қысқа жолды табу және картадағы байланысқан аймақтарды
 * анықтау» — the month's mastery sentence. This lesson owns its second half:
 * connected regions. The shortest path is m7.l3's and m7.l4's.
 *
 * «Тақырып жалпы теориядан емес, ұяшықты картадан басталады: ұяшық - нүкте,
 * көрші ұяшық - байланыс.» The word «граф» does not appear anywhere below. A
 * cell, the cell next to it, and a mark saying we have already been here.
 *
 * Three of the practice families named on p.9 are implemented here: «картада
 * қанша арал бар» (b8), «берілген нүктеден аймақты бояу» — the fill itself, in
 * the worked example, and the size it paints (b9) — and «ең үлкен аралдың
 * өлшемі» (b10, with its support twin b10s).
 *
 * And February, out loud: «функция дәл сондай, бірақ кішірек есепті шешу үшін
 * өзін-өзі шақыратын тәсіл». Painting a region IS that shape — mark this cell,
 * then ask the same question of what is left. b1 says so in both languages and
 * names m6 by its content, so the learner recognises the machinery instead of
 * meeting it as a new trick.
 *
 * ## The order of the mark is the whole lesson
 *
 * `vis[r][c] = 1` goes on the FIRST line of `fill`, before the loop over the
 * neighbours — not after the recursive calls come back. With the mark late, a
 * cell is entered from two directions and processed twice, which is p.9's
 * «бір ұяшықтың екі рет өңделуіне әкелетін қате» and the subject of m7.l5. In
 * a recursive fill the symptom is louder than double counting: two adjacent
 * free cells send each other back and forth until Python gives up. b4 asks
 * where the mark belongs, b6 shows what happens when it is late, and b5's
 * trace is eight entries with no cell entered twice.
 *
 * ## Prerequisites this lesson names rather than assumes
 *
 * - `[0] * m` builds a fresh row of m zeroes. It is a list literal and `*`,
 *   both October's, but the combination has not been used before — b1 says
 *   what it does in one sentence, per authoring contract §6.
 * - `fill` reads `g`, `vis`, `n`, `m`, `dr`, `dc` without receiving them as
 *   parameters, and changes `vis[r][c]` without `global`. b1 says why: the
 *   name `vis` is never reassigned, only one box inside the list it points at
 *   is. November's scope lesson is the reference point.
 * - Nothing here imports anything. There is no `deque`, no `set`, no
 *   comprehension. The whole month's queue is m7.l3's business; this lesson's
 *   traversal is a function calling itself, which February already taught.
 *
 * ## The requirement no checker can see, and what was done about it
 *
 * b8, b9 and b10 are the lesson's method applied — but output comparison sees
 * a number, not a recursion, and a learner who solves the islands with some
 * other traversal prints the same number. **Option 2 from authoring contract
 * §4** is what is used: b8's prompt names the recursive fill as the method
 * being practised, says in both languages that the checker compares only the
 * printed number, and leaves it there. b9 and b10 then say «осы тәсілмен» as
 * advice, without repeating a claim about enforcement. Option 1 is not
 * available here — every correct traversal produces the same count, so no
 * case set can distinguish them — and option 3 belongs to m7.l4, which
 * carries the month's advanced written defence.
 *
 * What the cases CAN see, they do. The degenerate programs each task's hidden
 * cases kill are listed on the block itself.
 *
 * ## Deliberately left for later lessons
 *
 * Measuring what re-processing costs — counting how many times the body runs
 * and comparing it with the number of cells — is m7.l5's, and so are the two
 * other ways a cell gets processed twice. Reachability, distances and the
 * shortest path are m7.l3's; restoring the route is m7.l4's. This lesson stops
 * at "which cells belong together, and how many are there".
 */

const P = 9; // PDF page for all of March

export const M7_L2: LessonBlock[] = [
  {
    /*
     * The concept card carries four things the rest of the lesson depends on,
     * and nothing else: the visited grid and how it is built, the fact that
     * `fill` reads the outer variables, the mark going first, and the sentence
     * that connects all of it to February.
     *
     * The snippet is deliberately tiny and prints `1 0` — it demonstrates that
     * `[0] * m` really produced independent boxes and that setting one of them
     * leaves the others alone. It is not a fill; the fill is on the next card,
     * where the reasoning that reaches it is written out.
     */
    id: "m7.l2.b1",
    type: "concept",
    skillRefs: ["graph.regions", "graph.dfs", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Белгі: «мұнда мен болдым»",
      ru: "Отметка: «здесь я уже был»",
    },
    body: {
      kk: "Картадағы бос ұяшықтар қабырғалармен бөлінген топтарға ыдырайды. Іші көршілес ұяшықтар арқылы бір-бірімен жалғасқан осындай топты **аймақ** (немесе арал) дейміз. Бүгінгі сұрақ: бір ұяшықтан бастап, сол ұяшықпен байланысқан барлық ұяшықты қалай тауып аламыз?\n\nАқпанда өзін-өзі шақыратын функцияны үйрендік: функция дәл сондай, бірақ кішірек есепті шешу үшін өзін шақырады. Аймақты бояу да дәл сол пішінде: **осы ұяшықты белгілеймін, содан кейін әр көршімнен дәл сол сұрақты сұраймын.** Есеп сайын кішірейеді, өйткені белгіленген ұяшық қайтадан өңделмейді.\n\nСондықтан бізге екінші тор керек — қай ұяшықта болғанымызды жазып отыратын тор. Оны `vis` деп атаймыз (visited — «болып шыққан»). Оны нөлдермен толтырамыз: `[0] * m` өрнегі ішінде m нөл тұрған жаңа тізім жасайды, ал тордың әр жолы үшін өз тізімін жасау керек.\n\nЕң бастысы — **белгіні қашан қою керектігі**. Ұяшыққа кірген бойда, көршілерді айналып шықпас бұрын қоямыз. Егер белгіні рекурсиялық шақырулар қайтқаннан кейін қойсақ, көрші ұяшық бізді әлі белгіленбеген деп көріп, кері шақырады — сонда бір ұяшық екі рет өңделеді.\n\nЖәне тағы бір нәрсе: `fill` функциясы `g`, `vis`, `n`, `m` айнымалыларын параметр ретінде алмайды, сырттан оқиды. `vis[r][c] = 1` жазу үшін `global` керек емес: біз `vis` атауын басқа тізімге ауыстырып жатқан жоқпыз, тек сол тізімнің ішіндегі бір санды өзгертеміз.",
      ru: "Свободные клетки на карте распадаются на группы, разделённые стенами. Группу, внутри которой от любой клетки можно дойти до любой другой через соседние клетки, называют **областью** (или островом). Сегодняшний вопрос такой: как, начав с одной клетки, найти все клетки, связанные с ней?\n\nВ феврале мы разобрали функцию, вызывающую саму себя: она вызывает себя, чтобы решить такую же, но меньшую задачу. Закрашивание области устроено ровно так же: **отмечаю эту клетку, а потом задаю тот же вопрос каждому её соседу.** Задача с каждым разом становится меньше, потому что отмеченная клетка больше не обрабатывается.\n\nЗначит, нужна вторая сетка — та, в которой мы записываем, где уже побывали. Назовём её `vis` (от visited — «посещённая»). Заполняем её нулями: `[0] * m` создаёт новый список из m нулей, и для каждой строки нужно создать свой список.\n\nСамое главное — **когда ставить отметку**. Ставим сразу при входе в клетку, до обхода соседей. Если поставить отметку после того, как рекурсивные вызовы вернулись, сосед увидит нас неотмеченными и вызовет обратно — и одна клетка будет обработана дважды.\n\nИ ещё одно: функция `fill` не получает `g`, `vis`, `n`, `m` как параметры, а читает их снаружи. Чтобы написать `vis[r][c] = 1`, слово `global` не нужно: мы не подменяем сам список `vis` другим, а меняем одно число внутри него.",
    },
    code:
      "n = 3\n" +
      "m = 4\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "vis[1][2] = 1\n" +
      "print(vis[1][2], vis[0][0])",
  },
  {
    /*
     * «Толық талданған мысалдар», on the family the PDF names as «берілген
     * нүктеден аймақты бояу». Every call and every mark in order is what the
     * brief asks for, so the program prints one line per mark and `result`
     * carries the five lines verbatim.
     *
     * The grid is hard-coded rather than read, for two reasons: a worked
     * example is about ONE grid, and hard-coding keeps this program textually
     * unlike every reference solution in the lesson, which all read input.
     *
     * `mark` is an English token and both the problem statement and the steps
     * name it, per the output-token rule — a Kazakh word here would let a
     * Russian-track learner match glyphs instead of reasoning.
     *
     * The chosen grid has TWO regions and the fill visits only one of them
     * (5 of the 8 free cells). That is the point the last step makes, and it
     * is what b3 then asks the learner to do alone on a different grid.
     */
    id: "m7.l2.b2",
    type: "worked_example",
    skillRefs: ["graph.dfs", "graph.regions", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: бір нүктеден аймақты бояу",
      ru: "Разобранный пример: закрашиваем область из одной точки",
    },
    problem: {
      kk: "4 × 4 карта берілген (нүкте — бос ұяшық, тор көзі — қабырға):\n\n```\n.#..\n.#.#\n..##\n#.##\n```\n\nСол жақ жоғарғы ұяшықтан, яғни (0, 0)-ден бастап, сонымен байланысқан барлық ұяшықты бояп шығайық. Бағдарлама әр боялған ұяшық үшін `mark` деген ағылшын белгісін және сол ұяшықтың жол мен баған нөмірін шығарады — басқа сөз шығармайды.",
      ru: "Дана карта 4 × 4 (точка — свободная клетка, решётка — стена):\n\n```\n.#..\n.#.#\n..##\n#.##\n```\n\nНачнём с левой верхней клетки, то есть с (0, 0), и закрасим все связанные с ней клетки. Для каждой закрашенной клетки программа печатает английскую метку `mark` и номера строки и столбца этой клетки — других слов она не выводит.",
    },
    steps: [
      {
        kk: "Функция `fill(r, c)` бір ғана міндет атқарады: (r, c) ұяшығын боялған деп белгілейді, сосын төрт көршісінің әрқайсысынан «сен де осы аймақтансың ба?» деп сұрайды. Сұрау деген — сол көршімен өзін қайта шақыру.",
        ru: "Функция `fill(r, c)` делает одно: помечает клетку (r, c) как закрашенную, а потом спрашивает у каждого из четырёх соседей — «ты тоже из этой области?». Спросить здесь означает вызвать саму себя уже с этим соседом.",
      },
      {
        kk: "Көршіге шақыру үш тексеруден кейін ғана жіберіледі: көрші тордан шығып кетпеуі керек, қабырға болмауы керек және әлі белгіленбеген болуы керек. Осы үшеуінің біреуі болмаса, бағдарлама не құлайды, не тоқтамайды.",
        ru: "Вызов для соседа отправляется только после трёх проверок: сосед не должен выходить за пределы сетки, не должен быть стеной и не должен быть уже отмечен. Без любой из этих трёх проверок программа либо упадёт, либо не остановится.",
      },
      {
        kk: "Белгі функцияның бірінші жолында тұр. `fill(0, 0)` шақырылған сәтте (0, 0) бірден белгіленеді, содан кейін ғана көршілерге көшеміз. Сондықтан төменгі көрші (1, 0) кейін жоғарыға қарағанда (0, 0)-ді белгіленген деп көреді де, кері шақырмайды.",
        ru: "Отметка стоит первой строкой функции. В момент вызова `fill(0, 0)` клетка (0, 0) отмечается сразу, и только потом мы переходим к соседям. Поэтому нижний сосед (1, 0), посмотрев вверх, увидит клетку (0, 0) уже отмеченной и не вызовет её обратно.",
      },
      {
        kk: "Көршілер әрқашан бір ретпен қаралады: жоғары, төмен, сол, оң. (0, 0)-де жоғары — тордан тыс, ал төмен — бос ұяшық (1, 0). Демек тізбек төмен қарай кетеді: (0, 0) → (1, 0) → (2, 0). (2, 0)-де төмен қабырға, сол жақ тордан тыс, ал оң жақта (2, 1) бос.",
        ru: "Соседи всегда перебираются в одном порядке: вверх, вниз, влево, вправо. У (0, 0) вверху — выход за сетку, а внизу — свободная клетка (1, 0). Значит, цепочка уходит вниз: (0, 0) → (1, 0) → (2, 0). У (2, 0) внизу стена, слева выход за сетку, а справа свободна (2, 1).",
      },
      {
        kk: "(2, 1)-ден төмен қарай (3, 1) бос, ол да боялады. (3, 1)-дің төрт көршісінің бәрі не тордан тыс, не қабырға, не белгіленген — сондықтан ол ешкімді шақырмайды және қайтады. Одан кейін бүкіл тізбек кері жиналады: (2, 1), (2, 0), (1, 0), (0, 0) кезекпен өз циклдерін аяқтайды.",
        ru: "От (2, 1) вниз свободна (3, 1), её тоже закрашиваем. У (3, 1) все четыре соседа либо за сеткой, либо стена, либо уже отмечены — поэтому она никого не вызывает и возвращается. После этого вся цепочка сворачивается обратно: (2, 1), (2, 0), (1, 0), (0, 0) по очереди дозаканчивают свои циклы.",
      },
      {
        kk: "Нәтижесінде бес ұяшық боялды. Ал картада бос ұяшық сегіз: (0, 2), (0, 3) және (1, 2) — екінші аймақ, оларға (0, 0)-ден көршілер арқылы жету мүмкін емес. Бір `fill` шақыруы бір аймақты ғана бояйды — келесі карточкаларда осы қасиетті пайдаланамыз.",
        ru: "В итоге закрашено пять клеток. А свободных клеток на карте восемь: (0, 2), (0, 3) и (1, 2) — это вторая область, до неё из (0, 0) по соседям не добраться. Один вызов `fill` закрашивает ровно одну область — этим свойством мы и воспользуемся на следующих карточках.",
      },
    ],
    code:
      'g = [".#..", ".#.#", "..##", "#.##"]\n' +
      "n = 4\n" +
      "m = 4\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      '    print("mark", r, c)\n' +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "\n" +
      "fill(0, 0)",
    result: {
      kk: "Экранға бес жол шығады, дәл осы ретпен:\n\n```\nmark 0 0\nmark 1 0\nmark 2 0\nmark 2 1\nmark 3 1\n```\n\nЖалпы бос ұяшық сегіз болса да, боялғаны — бесеу.",
      ru: "На экран выйдут пять строк, ровно в таком порядке:\n\n```\nmark 0 0\nmark 1 0\nmark 2 0\nmark 2 1\nmark 3 1\n```\n\nХотя свободных клеток всего восемь, закрашено оказалось пять.",
    },
  },
  {
    /*
     * Cheap, immediate and diagnostic. A DIFFERENT grid from b2's, and a
     * different program shape: the fill returns nothing and the answer is
     * counted afterwards by adding up `vis`, so nothing here hands over the
     * size-returning fill that b9 asks for.
     *
     * The grid is 4 × 4 with 16 cells, 11 of them free, split by a wall row
     * into a region of 4 (containing (0, 0)) and a region of 7.
     *
     * Distractors: 11 is every free cell, 7 is the other region, 16 is every
     * cell in the grid. Only 11 is mapped — it is exactly the count a learner
     * produces by forgetting that the fill stops at the wall row, and there is
     * no second route to it. 7 could be a slip about which region (0, 0) is in
     * OR a deliberate count of the wrong side, and 16 could be a guess, so
     * both are left for the engine to ask about.
     */
    id: "m7.l2.b3",
    type: "prediction",
    skillRefs: ["graph.dfs", "graph.regions"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарламадағы карта — 4 × 4 тор, `.` бос ұяшық, `#` қабырға. `fill` (0, 0)-ден бастап аймақты бояйды, содан кейін бағдарлама `vis` торындағы барлық санды қосып шығарады, яғни неше ұяшық боялғанын санайды. Экранға қандай сан шығады?",
      ru: "Карта в программе — сетка 4 × 4, где `.` — свободная клетка, а `#` — стена. `fill` закрашивает область, начиная с (0, 0), после чего программа складывает все числа в сетке `vis`, то есть считает, сколько клеток закрашено. Какое число появится на экране?",
    },
    code:
      'g = ["..#.", "..#.", "###.", "...."]\n' +
      "n = 4\n" +
      "m = 4\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "\n" +
      "fill(0, 0)\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      "        total = total + vis[i][j]\n" +
      "print(total)",
    answer: "4",
    options: ["4", "7", "11", "16"],
    diagnosticMapping: {
      "11": {
        failureClass: "region_boundary_ignored",
        justification:
          "Бұл торда бос ұяшық дәл он бір. 11 деген жауап барлық бос ұяшықты санағанда ғана шығады, яғни бояу қабырға жолында тоқтайтыны ескерілмеген. Басқа жолмен дәл 11 алынбайды.",
      },
    },
  },
  {
    /*
     * The lesson's own question, asked directly. Four placements, and the code
     * carries three numbered slots so the options can point at a position
     * instead of reprinting the program four times. The comments are bare
     * digits, so neither language reads a foreign word inside the code.
     *
     * o2 is the month's named error — the mark after the loop — and it is the
     * only option with exactly one possible cause, so it is the only one
     * mapped. o3 (marking the NEIGHBOUR before calling, and never marking the
     * start) is a genuine near-miss whose reasoning could be either "the mark
     * belongs to whoever we are about to enter" or "these two cells are the
     * same thing"; two causes means the engine asks. o4 is a guess.
     *
     * o3 is not a straw man: it terminates, prints a plausible-looking answer
     * and processes the starting cell twice. That is the m7.l5 failure mode
     * seen here for the first time, one lesson before it gets its own hour.
     */
    id: "m7.l2.b4",
    type: "multiple_choice",
    skillRefs: ["graph.dfs", "graph.regions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Төмендегі `fill` функциясында үш орын нөмірленген: `# 1` — циклге дейін, `# 2` — тексеруден өткен көршіні шақырар алдында, `# 3` — цикл толық аяқталған соң. Ұяшықты боялған деп белгілейтін жолды қайда қою керек және ол қандай жол болуы керек?",
      ru: "В функции `fill` ниже пронумерованы три места: `# 1` — до цикла, `# 2` — перед вызовом соседа, прошедшего проверку, `# 3` — после того, как цикл полностью завершился. Куда нужно поставить строку, отмечающую клетку как закрашенную, и какой именно должна быть эта строка?",
    },
    code:
      "def fill(r, c):\n" +
      "    # 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            # 2\n" +
      "            fill(nr, nc)\n" +
      "    # 3",
    options: [
      {
        id: "o1",
        label: {
          kk: "1-орынға `vis[r][c] = 1` — ұяшыққа кірген бойда, көршілерді қарамас бұрын",
          ru: "В место 1 строку `vis[r][c] = 1` — сразу при входе в клетку, до перебора соседей",
        },
      },
      {
        id: "o2",
        label: {
          kk: "3-орынға `vis[r][c] = 1` — барлық көрші өңделіп болғаннан кейін",
          ru: "В место 3 строку `vis[r][c] = 1` — после того, как все соседи обработаны",
        },
      },
      {
        id: "o3",
        label: {
          kk: "2-орынға `vis[nr][nc] = 1` — шақырылатын көршіні шақырар алдында белгілеп қою",
          ru: "В место 2 строку `vis[nr][nc] = 1` — отметить соседа непосредственно перед его вызовом",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Функцияның ішінде мүлдем емес: негізгі бағдарлама `fill` аяқталған соң бастапқы ұяшықты белгілейді",
          ru: "Вообще не внутри функции: основная программа отмечает стартовую клетку после того, как `fill` завершился",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "visited_marked_after_recursion",
        justification:
          "3-орынды таңдау — ұяшық өз көршілерін түгел өңдеп болғанда ғана «бітті» деп саналады деген ойдың нәтижесі. Дәл осы жерге қою рекурсияны шексіз етеді, ал басқа таңдау бұл нәтижеге әкелмейді.",
      },
    },
  },
  {
    /*
     * The month's central mechanism, traced by hand. Eight entries into `fill`
     * on an eight-cell region, and no cell is entered twice — which is what
     * the learner's own table proves.
     *
     * `seen` is a real parameter and a real return value, not an invented
     * column: it carries how many cells have been painted so far. It rises
     * 1 → 8 down the table, which the prompt admits is the easy half; the work
     * is the ORDER of (r, c), and that cannot be read off the program without
     * simulating it. Running the program prints only `8`, so the table cannot
     * be obtained by pressing play.
     *
     * The grid is a spiral corridor, deliberately unlike b2's and b3's, and
     * the start is (0, 1) because (0, 0) is a wall — so "the fill starts at the
     * top-left corner" is not a rule the learner can quietly acquire.
     */
    id: "m7.l2.b5",
    type: "trace_code",
    skillRefs: ["graph.dfs", "recursion.core", "grid.cells"],
    sourceType: "product-authored",
    prompt: {
      kk: "Карта — 4 × 4 тор:\n\n```\n#...\n###.\n....\n####\n```\n\n`fill` (0, 1) ұяшығынан басталады. `seen` параметрі — осы шақыруға дейін неше ұяшық боялғаны; функцияға кірген бойда ол бірге өседі.\n\nКестені толтыр: бағдарламаның 12-жолы — ұяшық жаңа ғана белгіленген сәт. Әр жолға сол сәттегі `r`, `c` және `seen` мәндерін жаз. `seen` бағаны оңай — ол бірден бастап бірте-бірте өседі. Қиыны — көршілер жоғары, төмен, сол, оң ретімен қаралатынын ескеріп, бағдарламаның ұяшықтарға қандай ретпен кіретінін табу.",
      ru: "Карта — сетка 4 × 4:\n\n```\n#...\n###.\n....\n####\n```\n\n`fill` начинается с клетки (0, 1). Параметр `seen` — сколько клеток закрашено до этого вызова; при входе в функцию он увеличивается на единицу.\n\nЗаполни таблицу: строка 12 программы — момент, когда клетка только что отмечена. В каждую строку запиши значения `r`, `c` и `seen` в этот момент. Столбец `seen` простой — он растёт от единицы по одному. Сложное — определить, в каком порядке программа заходит в клетки, помня, что соседи перебираются в порядке вверх, вниз, влево, вправо.",
    },
    code:
      'g = ["#...", "###.", "....", "####"]\n' +
      "n = 4\n" +
      "m = 4\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c, seen):\n" +
      "    seen = seen + 1\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            seen = fill(nr, nc, seen)\n" +
      "    return seen\n" +
      "\n" +
      "print(fill(0, 1, 0))",
    steps: [
      { line: 12, vars: { r: "0", c: "1", seen: "1" } },
      { line: 12, vars: { r: "0", c: "2", seen: "2" } },
      { line: 12, vars: { r: "0", c: "3", seen: "3" } },
      { line: 12, vars: { r: "1", c: "3", seen: "4" } },
      { line: 12, vars: { r: "2", c: "3", seen: "5" } },
      { line: 12, vars: { r: "2", c: "2", seen: "6" } },
      { line: 12, vars: { r: "2", c: "1", seen: "7" } },
      { line: 12, vars: { r: "2", c: "0", seen: "8" } },
    ],
  },
  {
    /*
     * PDF p.9: «бір ұяшықтың екі рет өңделуіне әкелетін қатені түзету». The
     * mark is on the last line of `fill` instead of the first.
     *
     * The task the program answers is NOT one this lesson later asks for: it
     * counts the free cells that are NOT connected to the top-left cell. So
     * the repaired program is nobody's reference solution, which is the defect
     * the first adversarial review found most often — a find_bug that repairs
     * the program the next write_code then requires.
     *
     * The symptom is stated honestly in the prompt: with the mark late, two
     * adjacent free cells call each other forever and Python stops the program
     * with `maximum recursion depth exceeded`. On the declared symptomInput the
     * repaired program prints 2 and the broken one prints nothing at all, so
     * `content-execution` sees a real difference rather than a guessed one.
     *
     * No diagnosticMapping: naming the recursive call or naming the guard can
     * each come from more than one misunderstanding, and inventing an
     * attribution would be worse than asking.
     */
    id: "m7.l2.b6",
    type: "find_bug",
    skillRefs: ["graph.dfs", "graph.regions", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама картаны оқып, сол жақ жоғарғы ұяшықпен (ол әрқашан бос) байланыспаған бос ұяшықтардың санын шығаруы керек. Бірақ ол ешқандай сан шығармайды: жұмысы `maximum recursion depth exceeded` деген қатемен үзіледі. Мысалы, мына картада жауап 2 болуы керек еді:\n\n```\n3 4\n..#.\n.##.\n...#\n```\n\nҚай жол кінәлі? Кірісте бірінші жолда n мен m, одан кейін n жол, әр жолда m таңба: `.` — бос ұяшық, `#` — қабырға.",
      ru: "Программа должна прочитать карту и вывести количество свободных клеток, не связанных с левой верхней клеткой (она всегда свободна). Но программа не выводит никакого числа: её работа обрывается ошибкой `maximum recursion depth exceeded`. Например, на этой карте ответ должен был быть 2:\n\n```\n3 4\n..#.\n.##.\n...#\n```\n\nКакая строка виновата? На вход в первой строке подаются n и m, затем n строк по m символов: `.` — свободная клетка, `#` — стена.",
    },
    code:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "    vis[r][c] = 1\n" +
      "\n" +
      "fill(0, 0)\n" +
      "left = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            left = left + 1\n" +
      "print(left)",
    buggyLine: 17,
    symptomInput: "3 4\n..#.\n.##.\n...#",
    fixedCode:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "\n" +
      "fill(0, 0)\n" +
      "left = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            left = left + 1\n" +
      "print(left)",
  },
  {
    /*
     * «Дайын кодты толықтыру» for every route. Only the guard is open, and it
     * is open in the three places that correspond to the three questions it
     * has to answer: does the neighbour exist, is it free, have we been there.
     *
     * Deliberately NOT a whole program: the surrounding lines are described in
     * the prompt instead, so that completing this card does not amount to
     * writing out b8's answer a card early. The mark is already in place —
     * WHERE it goes was b4's question, and re-asking it here would make one of
     * the two cards free.
     *
     * `'.'` is accepted as an alternative to `"."`; Python does not care and
     * neither should the card.
     */
    id: "m7.l2.b7",
    type: "fill_blank",
    skillRefs: ["graph.dfs", "grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`fill` функциясының қорғаныс шартын толықтыр. Оның сыртында `n`, `m`, `g`, `vis`, `dr`, `dc` дайын тұр деп есепте. Көршіге шақыру үш шарт бірдей орындалғанда ғана жіберіледі: көрші тордан шықпауы керек (жол нөмірі де, баған нөмірі де шектің ішінде), сол ұяшық бос болуы керек және ол әлі белгіленбеген болуы керек. Үш бос орынды сол ретпен толтыр.",
      ru: "Дополни защитное условие функции `fill`. Считай, что снаружи уже готовы `n`, `m`, `g`, `vis`, `dr`, `dc`. Вызов для соседа отправляется, только когда выполнены сразу три условия: сосед не выходит за пределы сетки (и номер строки, и номер столбца внутри границ), эта клетка свободна и она ещё не отмечена. Заполни три пропуска в том же порядке.",
    },
    template:
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and ___ and nc >= 0 and nc < m and g[nr][nc] == ___ and vis[nr][nc] == ___:\n' +
      "            fill(nr, nc)",
    blanks: [
      { id: "f1", answer: "nr < n" },
      { id: "f2", answer: '"."', alternatives: ["'.'"] },
      { id: "f3", answer: "0" },
    ],
  },
  {
    /*
     * PDF p.9, «картада қанша арал бар».
     *
     * THE UNENFORCEABLE HALF, handled as authoring contract §4 option 2. A
     * breadth-first traversal, or any other correct walk, prints the same
     * number, so no case set can require recursion. The prompt therefore names
     * the recursive fill as the method being practised and says out loud, in
     * both languages, that the checker compares only the printed number. It is
     * the only block in the lesson that says this at length; b9 and b10 give
     * the same advice in one clause and do not repeat a claim about grading.
     *
     * Degenerate programs, and the case that kills each — all verified by
     * running the mutant against this exact case list:
     *   · print the number of FREE CELLS  → "4 5" grid gives 13, not 2 (visible)
     *   · print 1 whenever anything is free → the 4-island grid, and "2 3 ###"
     *   · count cells whose upper and left neighbours are both walls (the
     *     no-traversal heuristic) → "2 3 / .#. / ..." is one island, it says 2
     *   · treat diagonals as neighbours → "2 2 / .# / #." is 2, it says 1
     *   · drop `nr >= 0` / `nc >= 0` from the guard → the 4×3 grid whose top
     *     and bottom rows are free wraps round to 1, and other grids crash
     *   · mark visited AFTER the recursive calls → crashes on every grid with
     *     two adjacent free cells
     * The 1×1 pair pins both boundaries of the stated range, and "2 3 ###" is
     * the empty answer that a program written around `best`-style state
     * forgets.
     */
    id: "m7.l2.b8",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.dfs", "recursion.core", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Картада неше арал бар екенін тап. Арал — көршілес бос ұяшықтардан құралған топ; ұяшықтар тек жоғары, төмен, сол, оң жағынан көрші саналады, диагональ бойынша емес.\n\nКіріс: бірінші жолда бос орынмен бөлінген n және m — тордың жол саны мен баған саны (1 ≤ n, m ≤ 20). Келесі n жолдың әрқайсысында m таңба: `.` — бос ұяшық, `#` — қабырға. Шығыс: бір сан — аралдар саны. Бос ұяшық мүлдем болмаса, жауап 0.\n\nТор кішкентай (ең көбі 400 ұяшық), сондықтан рекурсия тым тереңдеп кетпейді. Бүгінгі тәсілмен жаз: әр жаңа аралдан `fill` шақыр, ол сол аралдың барлық ұяшығын белгілеп шықсын. Тексеруші тек шыққан санды салыстыратынын білесің — демек бұл міндетті ереже емес, сол әдісті жаттықтыруға арналған кеңес.",
      ru: "Определи, сколько на карте островов. Остров — это группа соседних свободных клеток; соседними считаются клетки сверху, снизу, слева и справа, но не по диагонали.\n\nВвод: в первой строке через пробел n и m — количество строк и столбцов сетки (1 ≤ n, m ≤ 20). В следующих n строках по m символов: `.` — свободная клетка, `#` — стена. Вывод: одно число — количество островов. Если свободных клеток нет вовсе, ответ 0.\n\nСетка маленькая (не больше 400 клеток), поэтому рекурсия не уйдёт слишком глубоко. Пиши сегодняшним приёмом: для каждого нового острова вызывай `fill`, который отметит все его клетки. Ты знаешь, что проверяющая программа сравнивает только выведенное число, — значит, это не обязательное правило, а совет, ради которого задача и придумана.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            fill(nr, nc)\n" +
      "\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            count = count + 1\n" +
      "            fill(i, j)\n" +
      "print(count)",
    cases: [
      /* Kills a fill that never moves LEFT: it counts the two halves of one region as two
         islands. */
      { input: "2 2\n#.\n..", expectedOutput: "1", hidden: true },
      { input: "4 5\n.#..#\n.#.#.\n...#.\n#..#.", expectedOutput: "2" },
      { input: "3 3\n...\n...\n...", expectedOutput: "1" },
      { input: "2 2\n.#\n#.", expectedOutput: "2", hidden: true },
      { input: "2 3\n.#.\n...", expectedOutput: "1", hidden: true },
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      { input: "3 3\n.#.\n###\n.#.", expectedOutput: "4", hidden: true },
      { input: "4 3\n..#\n###\n###\n..#", expectedOutput: "2", hidden: true },
      {
        input: "5 5\n.....\n.....\n.....\n.....\n.....",
        expectedOutput: "1",
        hidden: true,
      },
    ],
  },
  {
    /*
     * PDF p.9, «берілген нүктеден аймақты бояу» — the fill asked for by its
     * size rather than by its picture, because a size is checkable and a
     * picture is a layout argument this lesson does not need.
     *
     * This is where the fill starts RETURNING something: 1 for itself plus
     * whatever each neighbour's fill returns. Nothing earlier in the lesson
     * shows that program — b3's fill returns nothing and counts afterwards,
     * b5's threads an accumulator down instead — so the composition is the
     * learner's to make.
     *
     * The wall case is stated in the prompt and is where a whole class of
     * submissions dies: calling `fill` on a wall cell paints its free
     * neighbours and reports a region that does not exist.
     *
     * Degenerate programs, and the case that kills each:
     *   · count every free cell in the grid → the visible "0 0" case is 3
     *     against 11 free cells
     *   · count the start plus its immediate free neighbours → "3 3" is a
     *     six-cell corridor and the shortcut says 2
     *   · call `fill` without checking whether the start is a wall → the two
     *     '#' starts, which must print 0
     *   · treat diagonals as neighbours → the "0 0" region grows past 3
     *   · drop `nr >= 0` / `nc >= 0` → the 4×3 wrap-around grid says 4, not 2
     *   · mark visited after the recursive calls → crashes
     * The starts cover a corner, an interior cell, the very last cell of the
     * grid, an isolated single cell, and both 1×1 grids.
     */
    id: "m7.l2.b9",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.dfs", "recursion.core", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Картада бір ұяшық көрсетіледі. Сол ұяшық жататын аймақта неше ұяшық бар екенін шығар. Аймақ — көршілес бос ұяшықтардан құралған топ, көршілер тек жоғары, төмен, сол, оң жақта. Егер көрсетілген ұяшық қабырға болса, жауап 0.\n\nКіріс: бірінші жолда n және m (1 ≤ n, m ≤ 20), келесі n жолда m таңба (`.` — бос ұяшық, `#` — қабырға), ең соңғы жолда бос орынмен бөлінген екі сан: r және c — көрсетілген ұяшықтың жол мен баған нөмірі (жолдар жоғарыдан 0-ден, бағандар солдан 0-ден саналады). Шығыс: бір сан.\n\nТор кішкентай (ең көбі 400 ұяшық), рекурсия шектен аспайды. Бүгінгі тәсілмен жаз: `fill` өзін бір деп санап, әр көршісінен қайтқан санды үстіне қоссын.",
      ru: "На карте указана одна клетка. Выведи, сколько клеток в области, которой она принадлежит. Область — это группа соседних свободных клеток, соседи только сверху, снизу, слева и справа. Если указанная клетка — стена, ответ 0.\n\nВвод: в первой строке n и m (1 ≤ n, m ≤ 20), в следующих n строках по m символов (`.` — свободная клетка, `#` — стена), в последней строке через пробел два числа: r и c — номер строки и столбца указанной клетки (строки нумеруются сверху с 0, столбцы слева с 0). Вывод: одно число.\n\nСетка маленькая (не больше 400 клеток), рекурсия за предел не выйдет. Пиши сегодняшним приёмом: пусть `fill` считает саму себя за единицу и прибавляет к ней числа, вернувшиеся от каждого соседа.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "sr, sc = map(int, input().split())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    size = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            size = size + fill(nr, nc)\n" +
      "    return size\n" +
      "\n" +
      'if g[sr][sc] == "#":\n' +
      "    print(0)\n" +
      "else:\n" +
      "    print(fill(sr, sc))",
    cases: [
      { input: "4 4\n..#.\n.##.\n#..#\n....\n0 0", expectedOutput: "3" },
      { input: "4 4\n..#.\n.##.\n#..#\n....\n1 3", expectedOutput: "2" },
      { input: "4 4\n..#.\n.##.\n#..#\n....\n3 3", expectedOutput: "6", hidden: true },
      { input: "4 4\n..#.\n.##.\n#..#\n....\n2 2", expectedOutput: "6", hidden: true },
      { input: "4 4\n..#.\n.##.\n#..#\n....\n0 2", expectedOutput: "0", hidden: true },
      { input: "1 1\n.\n0 0", expectedOutput: "1", hidden: true },
      { input: "1 1\n#\n0 0", expectedOutput: "0", hidden: true },
      { input: "3 4\n....\n....\n....\n1 2", expectedOutput: "12", hidden: true },
      { input: "3 3\n#.#\n###\n#.#\n0 1", expectedOutput: "1", hidden: true },
      { input: "4 3\n..#\n###\n###\n..#\n0 0", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9, «ең үлкен аралдың өлшемі». The composition of b8's scan and
     * b9's returning fill, and neither of those two programs is this one: the
     * counter becomes a comparison and the fill's return value stops being
     * thrown away.
     *
     * Withheld from support, which receives b10s instead — the same problem,
     * assembled rather than written (PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ»).
     *
     * Degenerate programs, and the case that kills each:
     *   · print the FIRST island's size, forgetting the comparison → the
     *     "3 4" grid's first island is a single cell and the answer is 4
     *   · reset `best` inside the loop, so the LAST island wins → the "4 5"
     *     grid's biggest island is the first one found, and the "3 5" grid's
     *     is the middle one
     *   · print the number of islands instead of a size → "4 5" is 2 against 10
     *   · print the total number of free cells → "4 5" is 13 against 10
     *   · treat diagonals as neighbours → "2 2 / .# / #." must stay 1
     *   · drop `nr >= 0` / `nc >= 0` → the 4×3 wrap-around grid says 4, not 2
     *   · mark visited after the recursive calls → crashes
     * The largest island sits first in one case, in the middle in another and
     * last in a third, so no positional shortcut survives. "2 3 ###" is the
     * empty grid, where `best` must still be printed as 0.
     */
    id: "m7.l2.b10",
    bank: {
      role: "extra_practice",
      why:
        "This program is m7.l2.b8's scan-and-launch control structure wrapped around m7.l2.b9's returning fill, line for line. The only statement neither already required is the running maximum, which December teaches, and the all-walls boundary is already m7.l2.b8's empty case.",
    },
    type: "write_code",
    skillRefs: ["graph.regions", "graph.dfs", "recursion.core", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Картадағы ең үлкен аралда неше ұяшық бар екенін шығар. Арал — көршілес бос ұяшықтардан құралған топ, көршілер тек жоғары, төмен, сол, оң жақта. Бос ұяшық мүлдем болмаса, жауап 0.\n\nКіріс: бірінші жолда n және m (1 ≤ n, m ≤ 20), келесі n жолда m таңба: `.` — бос ұяшық, `#` — қабырға. Шығыс: бір сан — ең үлкен аралдағы ұяшық саны.\n\nТор кішкентай (ең көбі 400 ұяшық), рекурсия шектен аспайды. Бүгінгі тәсілмен жаз: торды түгел аралап шығып, әлі белгіленбеген әр бос ұяшықтан `fill` шақыр да, қайтқан өлшемдердің ең үлкенін сақтап отыр.",
      ru: "Выведи, сколько клеток в самом большом острове карты. Остров — это группа соседних свободных клеток, соседи только сверху, снизу, слева и справа. Если свободных клеток нет вовсе, ответ 0.\n\nВвод: в первой строке n и m (1 ≤ n, m ≤ 20), в следующих n строках по m символов: `.` — свободная клетка, `#` — стена. Вывод: одно число — количество клеток в самом большом острове.\n\nСетка маленькая (не больше 400 клеток), рекурсия за предел не выйдет. Пиши сегодняшним приёмом: пройди всю сетку, вызывай `fill` из каждой ещё не отмеченной свободной клетки и храни наибольший из вернувшихся размеров.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    vis[r][c] = 1\n" +
      "    size = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            size = size + fill(nr, nc)\n" +
      "    return size\n" +
      "\n" +
      "best = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            cur = fill(i, j)\n" +
      "            if cur > best:\n" +
      "                best = cur\n" +
      "print(best)",
    cases: [
      { input: "4 5\n.#..#\n.#.#.\n...#.\n#..#.", expectedOutput: "10" },
      { input: "3 4\n.###\n###.\n#...", expectedOutput: "4" },
      { input: "3 5\n.#.#.\n.#.##\n.#...", expectedOutput: "5", hidden: true },
      { input: "4 4\n..#.\n.##.\n#..#\n....", expectedOutput: "6", hidden: true },
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      { input: "3 3\n...\n...\n...", expectedOutput: "9", hidden: true },
      { input: "2 2\n.#\n#.", expectedOutput: "1", hidden: true },
      { input: "4 3\n..#\n###\n###\n..#", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m7.l2.b10 — the same problem, the same input
     * format, the same answer, assembled instead of written from scratch.
     *
     * The three blanks are the three decisions this lesson exists for, and
     * nothing else is hidden: WHAT gets marked (the lesson's whole subject),
     * the recursive call that makes the fill a fill, and the comparison that
     * turns a set of sizes into the largest one. Everything a support learner
     * has already met on this route — reading the map, building `vis`, the
     * dr/dc walk, the guard they completed at b7 — is on the card in full.
     *
     * The completed program is deliberately NOT the same text as b10's
     * reference solution: it keeps the running maximum with `max(best, cur)`,
     * which December taught, rather than the if-statement b10 uses. No learner
     * receives both cards, but a support learner who moves up to the core
     * route later should not meet a program they have already transcribed —
     * and the two shapes are worth seeing as two shapes.
     */
    id: "m7.l2.b10s",
    bank: {
      role: "extra_practice",
      why:
        "Support sees both m7.l2.b8 and m7.l2.b9 — both on every route, both earlier — and writes the visited mark and the recursive call from nothing in each, so two of the three blanks ask for strictly less than the same learner has already produced twice.",
    },
    type: "fill_blank",
    skillRefs: ["graph.regions", "graph.dfs", "recursion.core", "func.return"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бағдарламаны толықтыр. Ол картаны оқып, ең үлкен аралда неше ұяшық бар екенін шығарады. Кіріс: бірінші жолда n және m (1 ≤ n, m ≤ 20), келесі n жолда m таңба: `.` — бос ұяшық, `#` — қабырға. Бос ұяшық болмаса, жауап 0.\n\nҮш бос орын бар. Біріншісі — ұяшықты боялған деп белгілейтін жерде: қай торға және қай ұяшыққа бір жазылады? Екіншісі — тексеруден өткен көршіден өлшемді сұрайтын жер. Үшіншісі — қазірге дейінгі ең үлкен өлшемді жаңарту: `max` екі санның үлкенін қайтарады.",
      ru: "Дополни программу. Она читает карту и выводит, сколько клеток в самом большом острове. Ввод: в первой строке n и m (1 ≤ n, m ≤ 20), в следующих n строках по m символов: `.` — свободная клетка, `#` — стена. Если свободных клеток нет, ответ 0.\n\nПропусков три. Первый — там, где клетка отмечается как закрашенная: в какую сетку и в какую клетку записывается единица? Второй — там, где у прошедшего проверку соседа запрашивается размер. Третий — обновление наибольшего размера на данный момент: `max` возвращает большее из двух чисел.",
    },
    template:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "vis = []\n" +
      "for i in range(n):\n" +
      "    vis.append([0] * m)\n" +
      "dr = [-1, 1, 0, 0]\n" +
      "dc = [0, 0, -1, 1]\n" +
      "\n" +
      "def fill(r, c):\n" +
      "    ___ = 1\n" +
      "    size = 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      '        if nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0:\n' +
      "            size = size + ___\n" +
      "    return size\n" +
      "\n" +
      "best = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "." and vis[i][j] == 0:\n' +
      "            cur = fill(i, j)\n" +
      "            best = ___\n" +
      "print(best)",
    blanks: [
      { id: "f1", answer: "vis[r][c]" },
      { id: "f2", answer: "fill(nr, nc)", alternatives: ["fill(nr,nc)"] },
      { id: "f3", answer: "max(best, cur)", alternatives: ["max(cur, best)", "max(best,cur)"] },
    ],
  },
];
