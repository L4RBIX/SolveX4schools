import type { LessonBlock } from "../../types";

/**
 * m7.l5 · «Бір ұяшық екі рет» / «Одна клетка дважды». 9 minutes.
 *
 * Skills: `graph.bfs`, `graph.regions`, `debug.boundary`, and — for the blocks
 * that measure the waste — `perf.compare_solutions`.
 *
 * PDF p.9 asks for this lesson by name. March's practice paragraph lists six
 * problem families and then adds one more thing on its own:
 *
 *   «Қосымша - бір ұяшықтың екі рет өңделуіне әкелетін қатені түзету»
 *
 * — repair the error that makes a cell get processed twice. It is the single
 * most common way a first traversal goes wrong, and naming it inside another
 * lesson is not the same as teaching it. So it gets a lesson: the October
 * counterpart is `m2.l9`, the January one is `m5.l6`, and like both of those
 * **there is no blank editor in it.** Eleven cards; every one reads, traces,
 * predicts, completes or repairs a program that is already on the screen.
 *
 * `m7.l5` is a new id — the stub had four lessons — and it is taught THIRD,
 * after `m7.l2`, the way September did it with `m1.l10`. Nothing is renumbered.
 *
 * ## Seven decisions, taken once, so no block re-litigates them
 *
 * 1. **The queue is a list plus a head index, and the lesson says so out loud.**
 *    `collections.deque` is never taught by this programme, so importing it
 *    would put an unexplained object at the centre of the month. `b1` names
 *    January instead: nothing is deleted from the list, only `head` moves
 *    forward, which is exactly the two-pointer move the learner has already
 *    made. The two coordinates live in two parallel lists, `qr` and `qc`.
 *
 * 2. **Everything else follows the month's own conventions**, because a learner
 *    reaching this card has already read `m7.l1`–`m7.l3`: the map is a list of
 *    rows read with `g.append(input())`, `.` is free and `#` is a wall, the
 *    marks table is `vis` built with `vis.append([0] * m)`, and the four
 *    neighbours come from `dr`/`dc`. Nothing here is a private dialect.
 *
 * 3. **Three ways a cell is processed twice, one card each, in the order a
 *    person meets them.** The mark set at the pop instead of the push (`b4`);
 *    the mark never set for the starting cell (`b5`); the guard that checks the
 *    map boundary but not the mark (`b6`). `b8` then makes the learner apply
 *    all three at once to a program that is not visibly broken at all.
 *
 * 4. **The cost is in the OUTPUT, never in the prompt.** A program that
 *    re-processes cells still prints the right region count, which is precisely
 *    why the bug survives — so «жұмысты азайт» as a bare instruction would be a
 *    requirement no checker can see. Option 1 of the contract's three
 *    (`docs/curriculum/AUTHORING_CONTRACT.md`, defect class 4): `b8` prints the
 *    answer AND how many cells ever entered the queue, and the cases pin both.
 *    The `yes`/`no` answer must stay what it was and the second number must
 *    fall to exactly the number of reachable cells, so no program that still
 *    re-queues can pass. `b2`, `b3` and `b9` count body runs the same way,
 *    which is December's step counting pointed at March.
 *
 * 5. **`b6`'s four guards are written as ONE merged `if`, and three of the four
 *    contain three checks.** The correct guard for a grid traversal is not a
 *    secret — `m7.l2` writes it in the same merged form — so the card cannot be
 *    made hard by hiding it. It is made hard by option `c`, which checks the
 *    bounds, checks the wall, and then asks about `vis[r][c]` instead of
 *    `vis[nr][nc]`: a learner who counts three checks without reading the
 *    indices takes it, and a learner who reads them sees that the cell being
 *    tested is the one already taken out of the queue.
 *
 * 6. **The witness sizes are chosen so nothing on screen is a legal answer to
 *    `b9`.** `b1` states the 3×3 open field (9 cells, 19 runs), `b2` traces 2×2
 *    (4 cells, 5 runs) and `b3` predicts 2×3 (6 cells, 9 runs). `b9` asks for
 *    at least THIRTY runs on a map of at most four rows and four columns, which
 *    none of those three reaches; the learner has to build one. Verified
 *    witnesses: 3×4 and 4×3 give 34, 4×4 gives 69.
 *
 * 7. **The support twin is `b9s`, not a twin of the repair.** Support keeps
 *    every repair card, because repair is what p.6 says support should get MORE
 *    of («дайын кодты құрастыру мен толықтыру көбірек»). What it loses is the
 *    one card that asks a learner to invent a witness from nothing, and it gets
 *    three ready maps with the same number of free cells, exactly one of which
 *    contains a 2×2 square. That is the substitution `m5.l6` made, and the twin
 *    refers to no card that only another route receives.
 *
 * Both `find_bug` blocks declare `symptomInput`: every bug here needs a whole
 * map on stdin, and the checker's fallback probe is a spread of single numbers —
 * it would report «the two programs behave identically» for both of them.
 */

const P = 9;

export const M7_L5: LessonBlock[] = [
  {
    /*
     * The rule, the machine it runs on, and the price of getting it wrong.
     *
     * The queue is the one thing here the learner has not met in `m7.l1`–`l2`,
     * so it is the one thing spelled out: a list, an index that only moves
     * forward, and January named as the place that move comes from. This lesson
     * is taught third, before `m7.l3`, so this really is the first queue the
     * learner meets and it cannot be left to a later card. The marks
     * table gets one sentence because `[0] * m` is an idiom rather than a
     * construct, and a task must never be the first place a notation appears.
     *
     * What is deliberately NOT here is the list of things the guard has to
     * check. `b6` asks exactly that, and a concept block that answers it in
     * advance turns `b6` into a reading exercise.
     */
    id: "m7.l5.b1",
    type: "concept",
    skillRefs: ["graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Белгі ұяшық кезекке кірген жерде тұрады",
      ru: "Отметка ставится там, где клетка входит в очередь",
    },
    body: {
      kk: "Карта — жолдардың тізімі: `g[r][c]` — r-жолдағы c орындағы таңба, `.` — бос ұяшық, `#` — қабырға. Белгілер кестесі `vis` — тізімдердің тізімі: оның әр элементі — өзі тізім болып тұрған бір жол, сондықтан `vis[r][c]` деп жазғанда қазанда өткен индекс екі рет қолданылады, жаңа құрал қажет емес. `[0] * m` жазуы ішінде m нөл тұрған тізім жасайды — кестенің бір жолы осылай құрылады.\n\nКезек те жаңа зат емес. Ол — қарапайым тізім және оның қай элементінің кезегі келгенін көрсететін `head` индексі. Тізімнен ештеңе өшірілмейді, тек `head` алға жылжиды — қаңтарда екі шекарамен жұмыс істегенде дәл осылай еткенбіз. Ұяшықтың екі нөмірін екі тізім қатар сақтайды: `qr` — жол нөмірлері, `qc` — баған нөмірлері.\n\nЕнді осы айдың басты ережесі. **Ұяшық кезекке САЛЫНҒАН сәтте белгіленуі керек, кезектен ШЫҚҚАН сәтте емес.** Себебі ұяшық кезекке түскеннен кейін өз кезегі келгенше сонда жатады, ал сол уақытта өңделген әрбір көрші оны «әлі белгіленбеген» деп көреді де, кезекке тағы бір рет қосады. Бастапқы ұяшық та осы ережеге бағынады: кезекті құрған жолда оны бірден белгілеу керек, әйтпесе оны өзінің көршісі кері әкеледі.\n\nБелгі кеш қойылса, бағдарлама көбінесе дұрыс жауап береді — бірақ жұмысы еселеп артады. 3×3 бос алаңда цикл денесі 9 рет емес, 19 рет орындалады. Жауаптың дұрыс болуы қатені байқауды қиындатады, сондықтан оны өлшеу керек: цикл денесі неше рет орындалғанын санап, аймақтағы ұяшық санымен салыстыр. Дұрыс жазылған өтуде бұл екі сан тең болады.",
      ru: "Карта — это список строк: `g[r][c]` даёт символ c в строке r, где `.` — свободная клетка, а `#` — стена. Таблица отметок `vis` — список списков: каждый её элемент сам является списком, поэтому в записи `vis[r][c]` дважды работает индекс из октября и ничего нового не требуется. Запись `[0] * m` создаёт список из m нулей — так строится одна строка таблицы.\n\nОчередь — тоже не новый объект. Это обычный список и индекс `head`, который показывает, чья очередь подошла. Из списка ничего не удаляется, вперёд двигается только `head` — ровно так мы работали с двумя границами в январе. Два номера клетки хранятся в двух списках рядом: `qr` — номера строк, `qc` — номера столбцов.\n\nТеперь главное правило этого месяца. **Клетку нужно отмечать в тот момент, когда её КЛАДУТ в очередь, а не когда её оттуда БЕРУТ.** Ведь, попав в очередь, клетка ждёт там своего хода, и всё это время каждый обработанный сосед видит её как «ещё не отмеченную» и кладёт в очередь ещё раз. Стартовая клетка подчиняется тому же правилу: её надо отметить прямо в той строке, где создаётся очередь, иначе её вернёт обратно её же сосед.\n\nЕсли отметка поставлена поздно, программа чаще всего выдаёт верный ответ — но работы делает в разы больше. На пустом поле 3×3 тело цикла выполняется не 9 раз, а 19. Верный ответ как раз и мешает заметить ошибку, поэтому её надо измерять: посчитай, сколько раз выполнилось тело цикла, и сравни с числом клеток в области. В правильном обходе эти два числа равны.",
    },
    code:
      "vis[sr][sc] = 1\nqr = [sr]\nqc = [sc]\nhead = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1",
  },
  {
    /*
     * The trace comes before every repair card on purpose: the tool has to be
     * in hand before it is used on something broken.
     *
     * 2×2 is the smallest map on which this bug can appear at all — a cell is
     * queued twice only when two of its neighbours are processed before its own
     * turn comes, and that needs a cycle. Four cells, five queue entries; the
     * learner writes the same two lists three times running on steps 4, 5 and 6
     * and that repetition IS the discovery, exactly as in `m2.l9.b7`.
     *
     * The bounds are the literals 2 and 2 because the map is written into the
     * program, so this card cannot hand `b6` its answer either.
     */
    id: "m7.l5.b2",
    type: "trace_code",
    skillRefs: ["graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама 2×2 бос алаңды сол жақ жоғарғы ұяшықтан бастап толқынмен айналып өтеді, бірақ ұяшықты кезектен ШЫҚҚАНДА ғана белгілейді. Оны қағазда қадамдап орында: `while` жолына әр келген сайын `head`, `runs`, `qr` және `qc` мәндерін жаз. Соңында өзіңе екі сұрақ қой: алаңда неше ұяшық бар және кезек барлығы неше жазба жинады?",
      ru: "Эта программа обходит волной пустое поле 2×2, начиная с левой верхней клетки, но отмечает клетку только тогда, когда БЕРЁТ её из очереди. Выполни её как на бумаге: при каждом заходе на строку `while` записывай значения `head`, `runs`, `qr` и `qc`. В конце ответь себе на два вопроса: сколько клеток на поле и сколько всего записей набрала очередь?",
    },
    code:
      'g = ["..", ".."]\nvis = [[0, 0], [0, 0]]\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [0]\nqc = [0]\nhead = 0\nruns = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    runs += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < 2 and nc >= 0 and nc < 2:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nprint(runs)\nprint(len(qr))',
    steps: [
      { line: 9, vars: { head: "0", runs: "0", qr: "[0]", qc: "[0]" } },
      { line: 9, vars: { head: "1", runs: "1", qr: "[0, 1, 0]", qc: "[0, 0, 1]" } },
      { line: 9, vars: { head: "2", runs: "2", qr: "[0, 1, 0, 1]", qc: "[0, 0, 1, 1]" } },
      { line: 9, vars: { head: "3", runs: "3", qr: "[0, 1, 0, 1, 1]", qc: "[0, 0, 1, 1, 1]" } },
      { line: 9, vars: { head: "4", runs: "4", qr: "[0, 1, 0, 1, 1]", qc: "[0, 0, 1, 1, 1]" } },
      { line: 9, vars: { head: "5", runs: "5", qr: "[0, 1, 0, 1, 1]", qc: "[0, 0, 1, 1, 1]" } },
      { line: 22, vars: { head: "5", runs: "5", qr: "[0, 1, 0, 1, 1]", qc: "[0, 0, 1, 1, 1]" } },
    ],
  },
  {
    /*
     * The same defect on a map one column wider, and the answer is not
     * «cells + 1»: on the 2×3 field the middle-bottom cell is queued twice and
     * the far corner three times, so the body runs nine times for six cells.
     *
     * That is why 7 is an option — it is what a learner gets by taking b2's
     * pair (4 cells, 5 runs) and adding one. It is left unmapped, because «I
     * generalised from one example» and «I lost count halfway» both produce it.
     * Only 6 is mapped: there is exactly one way to arrive at six here.
     */
    id: "m7.l5.b3",
    type: "prediction",
    skillRefs: ["graph.bfs", "perf.compare_solutions", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Сол қате, тек алаң 2×3 болды: алты бос ұяшық, бәрі бір аймақта. Белгі бұрынғысынша ұяшық кезектен шыққанда ғана қойылады. Бағдарлама `runs` санын — цикл денесі неше рет орындалғанын — шығарады. Ол нені шығарады?",
      ru: "Та же ошибка, только поле стало 2×3: шесть свободных клеток, все в одной области. Отметка по-прежнему ставится лишь тогда, когда клетку берут из очереди. Программа выводит `runs` — сколько раз выполнилось тело цикла. Что она выведет?",
    },
    code:
      'g = ["...", "..."]\nvis = [[0, 0, 0], [0, 0, 0]]\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [0]\nqc = [0]\nhead = 0\nruns = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    runs += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < 2 and nc >= 0 and nc < 3:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nprint(runs)',
    answer: "9",
    options: ["6", "7", "9", "12"],
    diagnosticMapping: {
      "6": {
        failureClass: "assumed_one_run_per_cell",
        justification:
          "Алтау — алаңдағы ұяшық саны, яғни дұрыс жазылған өтудің жауабы. Бұл жауапты таңдаған оқушы бағдарламаны орындамай, «әр ұяшық бір рет өңделеді» деген дұрыс өтудің қасиетін белгісі кешігіп қойылған бағдарламаға таңып отыр — қатенің өзін көрмегені осында көрінеді.",
      },
    },
  },
  {
    /*
     * Failure mode 1: the mark set at the pop instead of at the push.
     *
     * The start is pre-marked in BOTH halves on purpose. With the mark at the
     * pop the starting cell is marked on its own first turn and can never come
     * back, so that line changes nothing here — but leaving it in means the two
     * programs differ by exactly one moved line, and «which line» has exactly
     * one answer. Failure mode 2 gets the next card, where it is the only thing
     * wrong.
     *
     * The map earns its space: 10 cells, and the broken program says 21. Twice
     * as much is not a rounding error a learner can argue away.
     */
    id: "m7.l5.b4",
    type: "find_bug",
    skillRefs: ["graph.bfs", "graph.regions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама сол жақ жоғарғы ұяшық жататын аймақта неше ұяшық бар екенін шығаруы керек. Бірінші жолда n мен m, келесі n жолда картаның өзі: `.` — бос ұяшық, `#` — қабырға. Мына картада:\n\n`3 4`\n`..#.`\n`..#.`\n`....`\n\nаймақта 10 ұяшық бар, ал бағдарлама 21 шығарады. Қате қай жолда?",
      ru: "Программа должна выводить, сколько клеток в области, которой принадлежит левая верхняя клетка. В первой строке n и m, в следующих n строках — сама карта: `.` — свободная клетка, `#` — стена. На этой карте:\n\n`3 4`\n`..#.`\n`..#.`\n`....`\n\nв области 10 клеток, а программа выводит 21. В какой строке ошибка?",
    },
    code:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [0]\nqc = [0]\nvis[0][0] = 1\nhead = 0\nsize = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    size += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nprint(size)',
    buggyLine: 20,
    symptomInput: "3 4\n..#.\n..#.\n....",
    fixedCode:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [0]\nqc = [0]\nvis[0][0] = 1\nhead = 0\nsize = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    size += 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                vis[nr][nc] = 1\n                qr.append(nr)\n                qc.append(nc)\nprint(size)',
    diagnosticMapping: {
      "19": {
        failureClass: "blamed_the_counter_not_the_repeat",
        justification:
          "19-жол — `size += 1` — әр ұяшық кезектен бір-ақ рет шыққанда мүлдем дұрыс жол. Оны таңдау оқушының белгіні емес, санауды түзетуге кіріскенін көрсетеді: сан үлкен шыққан соң қосуды азайтқысы келеді, ал сұрақ бір ұяшықтың кезекке қайдан екі рет түскенінде.",
      },
    },
  },
  {
    /*
     * Failure mode 2: the starting cell is never marked.
     *
     * A missing line cannot be pointed at and `buggyLine` must name a line that
     * exists — so the start mark is present and marks the WRONG cell. That is
     * not a contrivance: this program paints from a start given in the input
     * («берілген нүктеден аймақты бояу», p.9), and `vis[0][0] = 1` is what an
     * author writes after testing only with the start in the corner. The prompt
     * says so, because a bug that passes the obvious test is the kind worth
     * recognising by its shape.
     *
     * (0,0) is a wall on the witness map, so the stray mark costs nothing and
     * the whole difference comes from the unmarked start: the first neighbour
     * processed sees it unmarked and brings it back, so it is counted twice —
     * 10 for a region of 9. Had (0,0) been free the two errors would have
     * cancelled to the right answer, which would make a worse card, not a
     * better one.
     */
    id: "m7.l5.b5",
    type: "find_bug",
    skillRefs: ["graph.bfs", "graph.regions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама берілген нүктеден бастап аймақты бояп, ондағы ұяшық санын шығаруы керек. Кіріс: бірінші жолда n мен m, келесі n жолда карта (`.` — бос, `#` — қабырға), соңғы жолда бастапқы ұяшықтың жол және баған нөмірі; бастапқы ұяшық әрқашан бос. Мына кіріс үшін:\n\n`4 4`\n`##..`\n`#..#`\n`..##`\n`...#`\n`3 0`\n\nаймақта 9 ұяшық бар, ал бағдарлама 10 шығарады. Байқа: бастауы (0, 0) ұяшығы болатын карталарда бұл бағдарлама әрқашан дұрыс жауап береді — сондықтан қате бірінші тексеруден оңай өтіп кетеді. Қате қай жолда?",
      ru: "Программа должна закрасить область, начиная с заданной точки, и вывести число клеток в ней. Ввод: в первой строке n и m, в следующих n строках карта (`.` — свободно, `#` — стена), в последней строке номер строки и номер столбца стартовой клетки; стартовая клетка всегда свободна. Для этого ввода:\n\n`4 4`\n`##..`\n`#..#`\n`..##`\n`...#`\n`3 0`\n\nв области 9 клеток, а программа выводит 10. Обрати внимание: на картах, где старт — клетка (0, 0), эта программа всегда отвечает верно, поэтому ошибка легко проходит первую проверку. В какой строке ошибка?",
    },
    code:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nvis[0][0] = 1\nqr = [sr]\nqc = [sc]\nhead = 0\nsize = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    size += 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                vis[nr][nc] = 1\n                qr.append(nr)\n                qc.append(nc)\nprint(size)',
    buggyLine: 11,
    symptomInput: "4 4\n##..\n#..#\n..##\n...#\n3 0",
    fixedCode:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nvis[sr][sc] = 1\nqr = [sr]\nqc = [sc]\nhead = 0\nsize = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    size += 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                vis[nr][nc] = 1\n                qr.append(nr)\n                qc.append(nc)\nprint(size)',
    diagnosticMapping: {
      "26": {
        failureClass: "rule_applied_without_checking_the_start",
        justification:
          "26-жол — көршіні кезекке салар алдында белгілейтін жол, яғни осы сабақтың ережесі дәл орындалған жер. Оны таңдау оқушының ережені есінде ұстағанын, бірақ қай ұяшық белгісіз қалғанын тексермегенін көрсетеді: көрініп тұрған белгіні нұсқап отыр, ал жетіспейтіні — бастапқы ұяшықтың белгісі.",
      },
    },
  },
  {
    /*
     * Failure mode 3, and the only card where nothing on screen is broken: the
     * learner chooses a guard instead of repairing one.
     *
     * The correct guard cannot be hidden — `m7.l2` writes the same six
     * conditions in the same merged form — so the card is not built on recall.
     * Option `c` is: bounds, wall, and then `vis[r][c]` instead of
     * `vis[nr][nc]`. Counting three checks is not enough; the indices have to
     * be read. And `c` is not a trick that only exists on this card — it is the
     * guard that asks about the cell already taken out of the queue, so it lets
     * nothing through at all.
     *
     * `if ...:` in the fragment is real Python (`m5.l6.b8` uses the same
     * device), so the fragment compiles and the hole sits exactly where the
     * guard belongs.
     */
    id: "m7.l5.b6",
    type: "multiple_choice",
    skillRefs: ["graph.bfs", "debug.boundary", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Төмендегі үзіндіде көрші ұяшық кезекке салынар алдында бір тексеруден өтуі керек, ол көп нүктенің орнында тұр. Тексеру үш нәрсені бірдей қамтуы тиіс: ұяшық картадан шықпасын, қабырға болмасын, әрі кезекке бұрын салынып қойылмаған болсын. Төрт нұсқаның қайсысы соның бәрін дұрыс тексереді?",
      ru: "В приведённом фрагменте соседняя клетка перед попаданием в очередь должна пройти проверку, и эта проверка стоит вместо многоточия. Проверка обязана охватывать сразу три вещи: клетка не выходит за пределы карты, она не стена и она ещё не была положена в очередь. Какой из четырёх вариантов проверяет всё это верно?",
    },
    code:
      "for k in range(4):\n    nr = r + dr[k]\n    nc = c + dc[k]\n    if ...:\n        vis[nr][nc] = 1\n        qr.append(nr)\n        qc.append(nc)",
    options: [
      {
        id: "a",
        label: {
          kk: 'Шарт: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0`',
          ru: 'Условие: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[nr][nc] == 0`',
        },
      },
      {
        id: "b",
        label: {
          kk: 'Шарт: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "."`',
          ru: 'Условие: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "."`',
        },
      },
      {
        id: "c",
        label: {
          kk: 'Шарт: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[r][c] == 0`',
          ru: 'Условие: `nr >= 0 and nr < n and nc >= 0 and nc < m and g[nr][nc] == "." and vis[r][c] == 0`',
        },
      },
      {
        id: "d",
        label: {
          kk: 'Шарт: `g[nr][nc] == "." and vis[nr][nc] == 0`',
          ru: 'Условие: `g[nr][nc] == "." and vis[nr][nc] == 0`',
        },
      },
    ],
    correctOptionId: "a",
    diagnosticMapping: {
      b: {
        failureClass: "guard_omits_visited_check",
        justification:
          "b нұсқасында картаның шекарасы да, қабырға да тексерілген — яғни оқушы ұяшықтың бос екенін көріп тұр, бірақ оның кезекте бар-жоғын мүлде сұрамайды. Дәл осы таңдау бір ұяшықтың кезекке бірнеше рет түсуіне әкеледі және басқа себептен шықпайды: қалған екі тексеру орнында тұр.",
      },
    },
  },
  {
    /*
     * The guard, written out by the learner, inside the month's first problem
     * family — «картада қанша арал бар» (p.9).
     *
     * `m7.l2.b8` answers that question with recursion; this one answers it with
     * the queue, so the program around the blanks is nobody else's program and
     * completing it is not transcription. It also puts the correct mark
     * placement — `vis[sr][sc] = 1` where each region starts, `vis[nr][nc] = 1`
     * at the push — in front of the learner one card before `b8` asks them to
     * produce it in a program that has neither.
     *
     * The four blanks are the four comparisons the guard contains, not the
     * variable names around them: writing `n` into a hole is bookkeeping,
     * writing `nr < n` is the decision.
     */
    id: "m7.l5.b7",
    bank: {
      role: "extra_practice",
      why:
        "The four blanks are the neighbour guard the learner already completed at m7.l2.b7, and the card one screen earlier, m7.l5.b6, prints that guard verbatim as its correct answer. Swapping recursion for a queue around the blanks changes the surrounding program but not what is being asked for.",
    },
    type: "fill_blank",
    skillRefs: ["graph.regions", "graph.bfs", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама картадағы аралдар санын шығарады: әлі белгіленбеген әрбір бос ұяшықтан жаңа толқын жіберіп, неше рет жіберуге тура келгенін санайды. Барлығы дайын, тек көрші ұяшықты тексеретін төрт орын бос қалған. Оларды толтыр: екеуі ұяшықтың картадан шықпағанын, біреуі оның қабырға емес екенін, біреуі оның әлі кезекке салынбағанын тексеруі керек (`.` — бос ұяшық, `#` — қабырға).",
      ru: "Эта программа выводит количество островов на карте: из каждой ещё не отмеченной свободной клетки она запускает новую волну и считает, сколько раз пришлось её запускать. Готово всё, кроме четырёх мест в проверке соседней клетки. Заполни их: два места должны проверять, что клетка не вышла за пределы карты, одно — что это не стена, и одно — что она ещё не попала в очередь (`.` — свободная клетка, `#` — стена).",
    },
    template:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\ncount = 0\nfor sr in range(n):\n    for sc in range(m):\n        if g[sr][sc] == "." and vis[sr][sc] == 0:\n            count += 1\n            vis[sr][sc] = 1\n            qr = [sr]\n            qc = [sc]\n            head = 0\n            while head < len(qr):\n                r = qr[head]\n                c = qc[head]\n                head += 1\n                for k in range(4):\n                    nr = r + dr[k]\n                    nc = c + dc[k]\n                    if nr >= 0 and ___ and nc >= 0 and ___:\n                        if ___ and ___:\n                            vis[nr][nc] = 1\n                            qr.append(nr)\n                            qc.append(nc)\nprint(count)',
    blanks: [
      { id: "f1", answer: "nr < n", alternatives: ["nr <= n - 1", "n > nr"] },
      { id: "f2", answer: "nc < m", alternatives: ["nc <= m - 1", "m > nc"] },
      { id: "f3", answer: 'g[nr][nc] == "."', alternatives: ['g[nr][nc] != "#"', '"." == g[nr][nc]'] },
      { id: "f4", answer: "vis[nr][nc] == 0", alternatives: ["vis[nr][nc] != 1", "0 == vis[nr][nc]"] },
    ],
  },
  {
    /*
     * The repair, on a program whose answer is already right.
     *
     * «Жұмысты азайт» is a requirement output comparison cannot see, so it is
     * not stated as one: the program prints how many cells ever entered the
     * queue, and the cases pin that number to the number of reachable cells.
     *
     * The wrong repairs, and the case that kills each — all five checked by
     * running them:
     *   - mark the start and leave the rest at the pop → the queue is still
     *     bloated; the visible case demands 10 and gets 21;
     *   - move the mark to the push and forget the start → every case with a
     *     reachable neighbour is one too big (visible case: 11), and `1 1 / .`
     *     goes further — the target IS the start, so it answers `no`;
     *   - skip an already-marked cell after taking it out instead of marking it
     *     before putting it in → the cell was still queued, so the visible case
     *     gives 12 and the 4×4 gives 25;
     *   - count the free cells on the map instead of the queue → `3 3 / ..# /
     *     ..# / ##.` has five free cells of which only four are reachable;
     *   - print a constant → the answers run from 1 to 16.
     * `1 5 / .....` is the honest opposite: a corridor has no cycle, the broken
     * program is already optimal on it, and a repair must not break that.
     */
    id: "m7.l5.b8",
    type: "modify_code",
    skillRefs: ["graph.bfs", "perf.compare_solutions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    checker: { kind: "exact" },
    prompt: {
      kk: "Бұл бағдарлама сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа жетуге бола ма деген сұраққа жауап беріп, екі жол шығарады: біріншісінде `yes` немесе `no` (ағылшын белгілері), екіншісінде кезекке барлығы неше ұяшық түскені. Жауабы дұрыс, бірақ жұмысы артық: белгі ұяшық кезектен шыққанда қойылады. Оны түзет — `yes`/`no` жауабы сол күйінде қалып, екінші сан жетуге болатын ұяшықтардың нақ санына тең болсын. Бұрыштағы екі ұяшық әрқашан бос.",
      ru: "Эта программа отвечает на вопрос, можно ли добраться из левой верхней клетки в правую нижнюю, и печатает две строки: в первой `yes` или `no` (английские слова), во второй — сколько всего клеток попало в очередь. Ответ она даёт верный, но работы делает лишнюю: отметка ставится в тот момент, когда клетку берут из очереди. Исправь это так, чтобы ответ `yes`/`no` остался прежним, а второе число стало ровно числом достижимых клеток. Обе угловые клетки всегда свободны.",
    },
    code:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [0]\nqc = [0]\nhead = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nif vis[n - 1][m - 1] == 1:\n    print("yes")\nelse:\n    print("no")\nprint(len(qr))',
    referenceSolution:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nvis[0][0] = 1\nqr = [0]\nqc = [0]\nhead = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                vis[nr][nc] = 1\n                qr.append(nr)\n                qc.append(nc)\nif vis[n - 1][m - 1] == 1:\n    print("yes")\nelse:\n    print("no")\nprint(len(qr))',
    cases: [
      { input: "3 4\n..#.\n..#.\n....", expectedOutput: "yes\n10" },
      { input: "3 3\n..#\n..#\n##.", expectedOutput: "no\n4", hidden: true },
      { input: "1 1\n.", expectedOutput: "yes\n1", hidden: true },
      { input: "1 5\n.....", expectedOutput: "yes\n5", hidden: true },
      { input: "2 2\n..\n..", expectedOutput: "yes\n4", hidden: true },
      { input: "2 2\n.#\n#.", expectedOutput: "no\n1", hidden: true },
      { input: "4 4\n....\n....\n....\n....", expectedOutput: "yes\n16", hidden: true },
    ],
  },
  {
    /*
     * The witness, invented rather than recognised.
     *
     * Nothing on screen is a legal answer. The concept states 3×3 (19 runs),
     * the trace is 2×2 (5) and the prediction is 2×3 (9); this card asks for
     * thirty on a map of at most four rows and four columns, so the learner has
     * to work out WHERE the waste comes from — a 2×2 square of free cells — and
     * then build a map out of them. Verified: 3×4 and 4×3 give 34, 4×4 gives
     * 69. The corridor in the prompt is the control: six cells, six runs, the
     * bug invisible.
     *
     * A `test_case` is graded on the input the learner names and is never
     * executed by the checker, so the start line can be part of the witness
     * too — a corner start wastes far more than a central one (4×4 from (0,0)
     * is 69, from (1,1) is 33), and a learner who notices that has understood
     * the mechanism rather than memorised a shape.
     */
    id: "m7.l5.b9",
    type: "test_case",
    skillRefs: ["graph.bfs", "perf.compare_solutions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бұл бағдарлама берілген нүктеден аймақты бояйды және цикл денесі неше рет орындалғанын шығарады; белгі кешігіп қойылады. Кіріс: n мен m, содан кейін карта (`.` — бос, `#` — қабырға), соңында бастапқы ұяшықтың жол және баған нөмірі. Мына кірісте:\n\n`1 6`\n`......`\n`0 0`\n\nол алты ұяшық үшін дәл 6 шығарады — мұнда қате мүлде көрінбейді. Енді сен кіріс ойлап тап: жолдар саны да, бағандар саны да 4-тен аспасын, ал бағдарлама кемінде 30 шығарсын. Жауабыңмен бірге артық жұмыстың қай жерден шығатынын да жаз.",
      ru: "Эта программа закрашивает область от заданной точки и выводит, сколько раз выполнилось тело цикла; отметка ставится с опозданием. Ввод: n и m, затем карта (`.` — свободно, `#` — стена), в конце номер строки и номер столбца стартовой клетки. На этом вводе:\n\n`1 6`\n`......`\n`0 0`\n\nона выводит ровно 6 для шести клеток — здесь ошибка не видна совсем. А теперь придумай ввод: и строк, и столбцов не больше 4, а программа должна вывести не меньше 30. Вместе с ответом напиши, откуда берётся лишняя работа.",
    },
    code:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [sr]\nqc = [sc]\nhead = 0\nruns = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    runs += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nprint(runs)',
    breakingInputs: [
      "3 4\n....\n....\n....\n0 0",
      "4 3\n...\n...\n...\n...\n0 0",
      "4 4\n....\n....\n....\n....\n0 0",
    ],
  },
  {
    /*
     * The support substitution for b9, in the shape p.6 asks for: reading and
     * choosing rather than inventing.
     *
     * The three maps have SEVEN free cells each, so the answer cannot be found
     * by counting cells or by picking the biggest picture, and option d states
     * the wrong rule out loud so that a learner who believes it has somewhere
     * to put it. Only map B contains a 2×2 square of free cells, and that
     * square is the whole mechanism — the same square the 2×2 trace on b2,
     * which the support route also receives, put on the screen. Verified by
     * running the program: A 7, B 10, C 7.
     *
     * No diagnostic mapping. A learner choosing A may have been counting cells,
     * or measuring the map's length, or guessing that a long thin corridor is
     * the awkward case; three causes, one answer, so the engine should ask
     * rather than tell.
     */
    id: "m7.l5.b9s",
    type: "multiple_choice",
    skillRefs: ["graph.bfs", "perf.compare_solutions", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама аймақты бояйды және цикл денесі неше рет орындалғанын шығарады, бірақ белгіні ұяшық кезектен шыққанда ғана қояды. Төмендегі үш картаның әрқайсысында дәл жеті бос ұяшық бар, үшеуінде де бастау — сол жақ жоғарғы ұяшық. Бағдарламаның цикл денесі қайсысында ең көп рет орындалады?",
      ru: "Эта программа закрашивает область и выводит, сколько раз выполнилось тело цикла, но отметку ставит только тогда, когда берёт клетку из очереди. На каждой из трёх карт ниже ровно семь свободных клеток, и на всех трёх старт — левая верхняя клетка. На какой из них тело цикла выполнится больше всего раз?",
    },
    code:
      'n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nvis = []\nfor i in range(n):\n    vis.append([0] * m)\ndr = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\nqr = [sr]\nqc = [sc]\nhead = 0\nruns = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    runs += 1\n    vis[r][c] = 1\n    for k in range(4):\n        nr = r + dr[k]\n        nc = c + dc[k]\n        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n            if g[nr][nc] == "." and vis[nr][nc] == 0:\n                qr.append(nr)\n                qc.append(nc)\nprint(runs)',
    options: [
      {
        id: "a",
        label: {
          kk: "A картасы — бір жолдағы жеті ұяшық: `1 7` / `.......`",
          ru: "Карта A — семь клеток в одну строку: `1 7` / `.......`",
        },
      },
      {
        id: "b",
        label: {
          kk: "B картасы: `3 3` / `...` / `...` / `.##`",
          ru: "Карта B: `3 3` / `...` / `...` / `.##`",
        },
      },
      {
        id: "c",
        label: {
          kk: "C картасы: `3 3` / `...` / `.#.` / `.#.`",
          ru: "Карта C: `3 3` / `...` / `.#.` / `.#.`",
        },
      },
      {
        id: "d",
        label: {
          kk: "Үшеуінде де бірдей: бос ұяшық саны тең болса, жұмыс та тең болады",
          ru: "На всех трёх одинаково: если число свободных клеток равно, то и работа равна",
        },
      },
    ],
    correctOptionId: "b",
  },
  {
    /*
     * The written defence. All three routes get it: «шешімді өз сөзімен
     * түсіндіру» (p.4) is not an advanced-only obligation, and this lesson's
     * subject — a bug whose output is correct — is the one thing no checker can
     * ask about.
     *
     * Two questions, so two answers, which is what nine minutes affords.
     */
    id: "m7.l5.b10",
    type: "explain",
    skillRefs: ["graph.bfs", "graph.regions", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Белгіні кеш қоятын бағдарлама бір ұяшықты бірнеше рет өңдейді, бірақ аймақтағы ұяшық санын дұрыс шығара береді. Екі сұраққа жазбаша жауап бер: (1) жауап неге бәрібір дұрыс болып қалады? (2) жауабы дұрыс болса, мұндай қатені қалай байқауға болады — нені өлшейсің және қандай картамен тексересің?",
      ru: "Программа, которая ставит отметку поздно, обрабатывает одну клетку несколько раз, но число клеток в области выводит верно. Ответь письменно на два вопроса: (1) почему ответ всё-таки остаётся правильным? (2) если ответ верный, как вообще заметить такую ошибку — что ты измеришь и на какой карте проверишь?",
    },
    expectedPoints: [
      {
        kk: "Ұяшық кезектен қанша рет шықса да, ол тек өзінің бос көршілерін қарайды және оларды бір ғана белгілер кестесіне жазады. Соңында белгіленген ұяшықтар жиыны дәл сол аймақ болып шығады, сондықтан жауап өзгермейді — тек оған жету қымбатқа түседі.",
        ru: "Сколько бы раз клетку ни доставали из очереди, она лишь смотрит на своих свободных соседей и записывает их в одну и ту же таблицу отметок. В конце множество отмеченных клеток совпадает с областью, поэтому ответ не меняется — дороже обходится только путь к нему.",
      },
      {
        kk: "Артық жұмыстың себебі: ұяшық кезекте белгісіз күйде жатқанда, оны сол уақытта өңделген әрбір көрші «жаңа» деп қайта қосады. Сондықтан бір ұяшық кезекке сондай көршілерінің саны бойынша бірнеше рет түсуі мүмкін.",
        ru: "Причина лишней работы: пока клетка лежит в очереди неотмеченной, каждый обработанный за это время сосед считает её новой и кладёт снова. Поэтому одна клетка может попасть в очередь столько раз, сколько у неё таких соседей.",
      },
      {
        kk: "Байқаудың жолы — өлшеу: цикл денесі неше рет орындалғанын (немесе кезекке неше жазба түскенін) санап, аймақтағы ұяшық санымен салыстыру керек. Дұрыс өтуде бұл екі сан тең, тең болмаса — ұяшықтар қайта өңделіп жатыр.",
        ru: "Способ заметить — измерить: посчитать, сколько раз выполнилось тело цикла (или сколько записей попало в очередь), и сравнить с числом клеток в области. В правильном обходе эти числа равны, а если они не равны — клетки обрабатываются повторно.",
      },
      {
        kk: "Тексеретін карта да маңызды: ені бір ұяшық болатын дәлізде әр ұяшықты бір ғана көрші ашады, сондықтан қате мүлде көрінбейді. Тексеру үшін ішінде бос ұяшықтардан құралған 2×2 шаршысы бар карта немесе кең бос алаң керек; үлкен картада бұл қате уақыт шегінен шығып кетуге әкеледі.",
        ru: "Важна и карта для проверки: в коридоре шириной в одну клетку каждую клетку открывает ровно один сосед, поэтому ошибка не проявляется совсем. Нужна карта с квадратом 2×2 из свободных клеток или широкое открытое поле; на большой карте такая ошибка приводит к превышению лимита времени.",
      },
    ],
  },
];
