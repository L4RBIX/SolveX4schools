import type { LessonBlock } from "../../types";

/**
 * Month 7 · Наурыз — the monthly check. Twenty minutes. PDF p.9.
 *
 * March's «Айлық сынақ» sentence is one line and both halves of it are
 * specific:
 *
 *   > Картаға арналған бейтаныс есепті шешіп, табылған жолдың неге шынымен ең
 *   > қысқа екенін түсіндіреді.
 *
 * Solve an unfamiliar map problem, and explain why the path that was found
 * really is the shortest. The second half is not «түсіндір, қалай шештің» —
 * it names the claim to be defended, so the check has to ask for an argument
 * and not for a retelling. The argument the marking points look for is the
 * wave's own ordering: the traversal reaches every cell at distance k before
 * any cell at distance k + 1, and a cell that has already been given a number
 * is never put in the queue again, which is exactly why that ordering holds.
 *
 * ## The four blocks, and the clock
 *
 *   b1  verify · unseen_problem   — a new grid problem, blank editor      12 min
 *   b2  verify · manual_trace     — the wave stepped by hand on paper      6 min
 *   b3  explain                   — why that number is the shortest        2 min
 *   b4  verify · oral_explanation — what a twice-queued cell costs         2 min
 *
 * Twenty-two against a stated twenty, by the validator's own arithmetic, and
 * that is the floor for this shape rather than an oversight. `unseen_problem`
 * costs a flat 12 and `manual_trace` a flat 6; the two written blocks cost two
 * minutes **per question**, and both are written with exactly one question so
 * neither can cost more. Everything discretionary was already taken out before
 * this file was written: there is no `find_bug` (the month meets that
 * requirement where the PDF puts it, in `m7.l5`, whose whole subject is the
 * cell processed twice), no second coding task, and no numbered sub-questions
 * anywhere. September shipped this check at 30 minutes, November at 34,
 * December at 38 — every time because one written prompt carried four numbered
 * questions and each was a separate answer. Two minutes over with one question
 * per prompt is the honest end of that road, and the trace is the block that
 * absorbs it: nine cells on a 4×4 map is closer to three minutes than to six.
 *
 * ## Why `b1` is a new problem and not one of the month's with the numbers moved
 *
 * The five lessons and the practice set between them already own ten map
 * problems, and the check has to avoid every one of them:
 *
 *   l1   the four neighbours of a cell, and the edge of the map
 *   l2   painting a region, counting islands, the largest island
 *   l3   can you get there, and the shortest path as a number
 *   l4   restoring the route itself
 *   l5   the cell processed twice
 *   p1–p10  free cells · border cells · islands · region size · largest island ·
 *           reachability · shortest path · cells within k steps · the farthest
 *           reachable cell · a route forced through a waypoint
 *
 * So the check asks for the **nearest way out**: the shortest distance from the
 * start to any free cell standing on the edge of the map. Nothing in the month
 * has a *set* of targets rather than one named finish cell, and that is the
 * whole of the new thinking — the learner has to notice that the wave answers
 * it the moment it first touches the edge, because the first edge cell it takes
 * out of the queue is the nearest one. Which is, word for word, the argument
 * `b3` then asks them to write down. The statement is short and the maps are
 * small, because a grid problem is slower to read than a list problem and the
 * clock does not care whose fault that is.
 *
 * The brief's five required boundaries are read onto this problem's own edges:
 * an unreachable finish is a start sealed inside walls (case 2); a start
 * adjacent to the finish is a start one step from the edge (case 3); the 1×1
 * map is case 4; all walls except the start is case 5; and a maze with more
 * than one shortest route is case 6, where two routes of length three leave in
 * opposite directions.
 *
 * ## The degenerate programs, and the case that kills each
 *
 * Every one of these was written out and executed against the full case set
 * before this file was written. None survives:
 *
 *   · `min(r, c, n - 1 - r, m - 1 - c)` — the straight-line distance to the
 *     edge with the walls ignored. Dies on the VISIBLE case (says 1, answer 4),
 *     which is deliberate: a learner who guesses the geometry finds out on
 *     screen and not on a hidden case.
 *   · counting cells instead of steps — dies on cases 1, 3, 4, 6, 7, 8, 9.
 *   · a depth-first walk that returns the first way out it finds — dies on
 *     case 8, where the corridor upwards is explored first and reaches the edge
 *     after four steps while the way out to the right takes two.
 *   · diagonal neighbours — dies on cases 1, 6 and 9.
 *   · the FARTHEST edge cell instead of the nearest — dies on cases 1, 7, 8.
 *   · forgetting that the start itself can be on the edge — dies on cases 4
 *     and 7.
 *   · looking for a way out only in the top row — dies on cases 1, 8, 9.
 *   · no bounds check at all — crashes on cases 1, 4, 6 and 8.
 *
 * ## What the cases cannot see, and where it is asked instead
 *
 * Two things, and both are sent to a human deliberately.
 *
 * **The method.** Output comparison sees a number. A learner who reaches the
 * right number by hand-tracing a small map prints the same digits as one who
 * wrote the wave, and a prompt claiming otherwise would be the authoring
 * contract's fourth defect class — a rule the product does not enforce. Of the
 * three honest options this check takes **option 3, send it to a human**: `b1`
 * states the problem and nothing about how to solve it, and `b3` — which a
 * teacher reads — asks for the argument that only holds if the learner knows
 * what their own program did. Option 1 is unavailable (no case set separates
 * two correct methods) and option 2 would be weaker here than option 3, since
 * the programme itself asks for this explanation by hand.
 *
 * **The cell queued twice.** Both re-queueing variants — the mark set when a
 * cell is taken out instead of when it is put in, and the distance rewritten on
 * every arrival — were run against all nine cases and passed all nine. That is
 * not a gap in the case set, it is the fact `b4` exists to name: the defect is
 * invisible in the output, which is why it survives, and the only place to
 * catch it is a person asking. `m7.l5` teaches it; the check asks for it aloud.
 *
 * ## Programs
 *
 * Two programs appear here — `b1`'s reference solution and `b2`'s traced
 * program — and they were compared, byte for byte and by script, against each
 * other and against every program in `m7/l1`–`l5` and `m7/practice`. No
 * duplicate. `b2` embeds its map as a literal and prints a distance to one
 * named cell plus the number of free cells the wave never reached, which is a
 * question no block in the month asks; it is not, and must not be, a program
 * that can be handed in as an answer to `b1`.
 *
 * ## Provenance
 *
 * `b1`, `b2` and `b4` implement three of the programme's five general
 * verification methods (p.6: «Бейтаныс есептер · Кодты қолмен орындау ·
 * Ауызша түсіндіру») and cite that page. `b3` carries March's own assessment
 * sentence and cites p.9. No `diagnosticMapping` anywhere: a wrong number on a
 * grid task is reachable from a missing bounds check, a mark set on exit,
 * diagonal neighbours or a misread input format, and four causes behind one
 * answer is precisely when the mapping must be left out.
 *
 * ## Deliberately left out
 *
 * `find_bug` and `delayed_resolve`, the two verification methods this check
 * does not use — the first because `m7.l5` is eleven cards of it, the second
 * because it is a re-solve weeks later and belongs to the year's later months.
 * And the route itself: `m7.l4` prints paths, this check prints a number, and
 * adding «жолды да шығар» would have bought a second coding task on a clock
 * that is already two minutes over.
 */
export const M7_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Бейтаныс есеп» (p.6), and March's own «картаға арналған бейтаныс есеп».
     *
     * Blank editor, no starter, no method named. The one thing the statement
     * does spell out is what counts as a way out and what happens when the
     * start is already standing on one, because that is a definition and not a
     * hint: a learner who has to guess whether the answer is 0 or 1 for a start
     * on the edge is being marked on reading the author's mind.
     *
     * The reference stops at the first edge cell it takes out of the queue.
     * That is the shortest way out precisely because the queue never holds a
     * larger number before a smaller one, and writing the reference this way is
     * an author's promise: the argument `b3` asks for is the argument the
     * reference itself depends on. A full wave followed by a minimum over the
     * edge cells is just as correct and passes every case below.
     *
     * The four-part bounds check is kept even though this control flow can
     * never violate it — an edge cell is answered and never expanded, so every
     * cell whose neighbours are read is interior. A reference that stayed in
     * range only by an argument the reader has to reconstruct is not the
     * program to put in front of a school director, and the check is the
     * month's convention besides (`m7.l1`).
     *
     * Nine cases, one visible. The visible one is the case that kills the
     * straight-line guess: the start at (1, 1) is one step from the edge in
     * geometry and four steps from a way out in the maze.
     */
    id: "m7.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["graph.shortest_path", "graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда бастау ұяшығының r мен c координаталары беріледі; жол мен баған нөмірлері 0-ден басталады. Бастау ұяшығының бос екеніне кепілдік беріледі. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң; бұрыштап жүруге болмайды. " +
        "Шығу ұяшығы деп картаның шетінде тұрған кез келген бос ұяшықты айтамыз: ең үстіңгі жолда, ең астыңғы жолда, ең сол жақ бағанда немесе ең оң жақ бағанда тұрған бос ұяшық. Картадан аттап шығудың қажеті жоқ — сондай ұяшыққа жету жеткілікті. " +
        "Бастаудан ең жақын шығу ұяшығына дейінгі ең қысқа жолда неше қадам бар екенін шығар. " +
        "Бастаудың өзі картаның шетінде тұрса, жауап 0. Бірде-бір шығу ұяшығына жету мүмкін болмаса, -1 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны координаты r и c стартовой клетки; нумерация строк и столбцов начинается с нуля. Гарантируется, что стартовая клетка свободна. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо; по диагонали ходить нельзя. " +
        "Клеткой-выходом называем любую свободную клетку на краю карты: в самой верхней строке, в самой нижней строке, в самом левом столбце или в самом правом столбце. Выходить за пределы карты не нужно — достаточно попасть в такую клетку. " +
        "Выведи, сколько шагов в кратчайшем пути от старта до ближайшей клетки-выхода. " +
        "Если сам старт стоит на краю карты, ответ 0. Если ни до одной клетки-выхода добраться нельзя, выведи -1.",
    },
    referenceSolution:
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
      "answer = -1\n" +
      "while head < len(qr):\n" +
      "    r = qr[head]\n" +
      "    c = qc[head]\n" +
      "    head += 1\n" +
      "    if r == 0 or r == n - 1 or c == 0 or c == m - 1:\n" +
      "        answer = dist[r][c]\n" +
      "        break\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "print(answer)",
    cases: [
      /* Kills a depth-first fill that reports its own recursion depth: it answers 2 here. Nine
         cases accepted that program, in the check for the month whose whole subject is that a
         wave measures distance and a walk does not. */
      { input: "4 4\n#..#\n....\n#...\n.#..\n2 2", expectedOutput: "1", hidden: true },
      /* Visible. The start is one step from the edge in a straight line and
         four steps from a way out through the maze, so `min(r, c, n - 1 - r,
         m - 1 - c)` answers 1 and fails in front of the learner. Diagonal
         neighbours answer 3 here, and counting cells instead of steps 5. */
      { input: "4 5\n#####\n#...#\n#.#.#\n##..#\n1 1", expectedOutput: "4" },
      /* Sealed: a free 2×2 room with a wall all the way round it. The queue
         empties without ever reaching the edge, which is what -1 means. */
      { input: "4 4\n####\n#..#\n#..#\n####\n1 1", expectedOutput: "-1", hidden: true },
      /* One step from a way out — the smallest positive answer there is. */
      { input: "3 4\n#.##\n#..#\n####\n1 1", expectedOutput: "1", hidden: true },
      /* The 1×1 map. Its only cell is on all four edges at once, so the answer
         is 0 before the wave moves anywhere; a program that counts cells says
         1 and one that starts its search after the first step says -1. */
      { input: "1 1\n.\n0 0", expectedOutput: "0", hidden: true },
      /* Everything is a wall except the start, and the start is interior: the
         queue holds one cell, no neighbour is free, and the answer is -1. */
      { input: "3 3\n###\n#.#\n###\n1 1", expectedOutput: "-1", hidden: true },
      /* Two shortest routes of three steps, upwards and downwards, to two
         different ways out. A wave that stops at the first edge cell it takes
         out of the queue must still answer 3, whichever half of the map it
         happens to walk first. The straight-line guess says 1. */
      { input: "5 5\n##.##\n#...#\n#.#.#\n#...#\n##.##\n2 1", expectedOutput: "3", hidden: true },
      /* The start is already standing on the edge: zero steps. Kills counting
         cells, and kills a search that only looks at the cells it moved to. */
      { input: "3 3\n...\n.#.\n...\n0 0", expectedOutput: "0", hidden: true },
      /* The depth-first trap. Neighbours walked up-first lead into a four-cell
         corridor that reaches the top edge after four steps, while the way out
         to the right is two. A walk that returns the first route it finds
         answers 4; the wave answers 2. */
      { input: "6 5\n##.##\n##.##\n##.##\n##.##\n##...\n#####\n4 2", expectedOutput: "2", hidden: true },
      /* The only way out is in the leftmost COLUMN, so a program that checks
         the top and bottom rows and forgets the sides prints -1. */
      { input: "4 5\n#####\n...##\n##.##\n#####\n2 2", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * «Кодты қолмен орындау» (p.6). The program is on the block, in `code`:
     * `m1.as.b3` shipped this mode without it and rendered as a prompt about
     * "this program" above an empty box, which is why the field is now
     * required.
     *
     * The map is embedded as a list of four strings, so the block reads no
     * input and cannot be turned into an answer for `b1`; and what it prints —
     * the distance to one named cell, and how many free cells the wave never
     * reached — is a question no card in March asks, so there is nothing here
     * to transcribe forwards either.
     *
     * The maze is chosen so that stepping honestly and guessing disagree. The
     * cell (1, 2) sits three squares from the start if you measure across the
     * picture and five if you walk it, because the wall at (1, 1) turns the
     * route round through the bottom of the map. And (0, 3) is free, in plain
     * sight, and unreachable: it keeps −1, which is the second number the
     * program prints.
     *
     * Nine cells, distances 0 to 5, one unreached — about three minutes with a
     * pencil. Settles as `unknown`; a teacher reads the marking points.
     */
    id: "m7.as.b2",
    type: "verify",
    mode: "manual_trace",
    skillRefs: ["graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бұл бағдарламаны бұрын көрген жоқсың. Оны компьютерсіз, қағазда орында. " +
        "Дәптеріңе 4×4 картаны сызып ал: толқын бір ұяшыққа жеткен сәтте сол ұяшыққа оның қашықтығын жаз, ал толқын жетпеген бос ұяшықты бос қалдыр. " +
        "Соңында бағдарлама экранға шығаратын екі жолды жаз.",
      ru:
        "Эту программу ты раньше не видел. Выполни её на бумаге, без компьютера. " +
        "Начерти в тетради карту 4×4: как только волна доходит до клетки, записывай в неё расстояние, а свободную клетку, до которой волна не дошла, оставь пустой. " +
        "В конце запиши две строки, которые программа выведет на экран.",
    },
    code:
      'g = ["..#.", ".#.#", "...#", "#..#"]\n' +
      "n = 4\n" +
      "m = 4\n" +
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
      "    head += 1\n" +
      "    for k in range(4):\n" +
      "        nr = r + dr[k]\n" +
      "        nc = c + dc[k]\n" +
      "        if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '            if g[nr][nc] == "." and dist[nr][nc] == -1:\n' +
      "                dist[nr][nc] = dist[r][c] + 1\n" +
      "                qr.append(nr)\n" +
      "                qc.append(nc)\n" +
      "left = 0\n" +
      "for r in range(n):\n" +
      "    for c in range(m):\n" +
      '        if g[r][c] == "." and dist[r][c] == -1:\n' +
      "            left += 1\n" +
      "print(dist[1][2])\n" +
      "print(left)",
    expectedPoints: [
      {
        kk: "Қашықтықтар кестесі дұрыс толтырылған. Жоғарғы жол: (0,0) — 0, (0,1) — 1, (0,2) — қабырға, (0,3) — бос қалады. Екінші жол: (1,0) — 1, (1,1) — қабырға, (1,2) — 5, (1,3) — қабырға. Үшінші жол: (2,0) — 2, (2,1) — 3, (2,2) — 4, (2,3) — қабырға. Төртінші жол: (3,0) — қабырға, (3,1) — 4, (3,2) — 5, (3,3) — қабырға.",
        ru: "Таблица расстояний заполнена верно. Верхняя строка: (0,0) — 0, (0,1) — 1, (0,2) — стена, (0,3) — остаётся пустой. Вторая строка: (1,0) — 1, (1,1) — стена, (1,2) — 5, (1,3) — стена. Третья строка: (2,0) — 2, (2,1) — 3, (2,2) — 4, (2,3) — стена. Четвёртая строка: (3,0) — стена, (3,1) — 4, (3,2) — 5, (3,3) — стена.",
      },
      {
        kk: "Ұяшықтар кезектен қашықтығы кемімейтін ретпен алынады: алдымен 0 қашықтықтағы (0,0), сосын 1 қашықтықтағы (1,0) мен (0,1), сосын 2 қашықтықтағы (2,0), сосын 3 қашықтықтағы (2,1), содан кейін 4 қашықтықтағы (3,1) мен (2,2), ең соңында 5 қашықтықтағы (3,2) мен (1,2). Толқын осылай қабат-қабат таралады, ал `head` тек алға жылжиды.",
        ru: "Клетки достаются из очереди в порядке неубывания расстояния: сначала (0,0) с расстоянием 0, затем (1,0) и (0,1) с расстоянием 1, затем (2,0) с расстоянием 2, затем (2,1) с расстоянием 3, после них (3,1) и (2,2) с расстоянием 4 и в самом конце (3,2) и (1,2) с расстоянием 5. Волна расходится слоями, а `head` только движется вперёд.",
      },
      {
        kk: "Суретте (1,2) ұяшығы бастаудан үш қадамдай көрінеді, ал оның шын қашықтығы — 5. Оған тура жол жоқ: (1,1) қабырға болғандықтан толқын төменнен, (2,0) — (2,1) — (2,2) арқылы айналып келеді. Кестеге 3 деп жазған оқушы картаның үстінен санаған, лабиринтпен жүрмеген.",
        ru: "Расстояние до клетки (1,2) равно 5, хотя на картинке она кажется в трёх шагах от старта. Прямого пути туда нет: из-за стены в (1,1) волна обходит снизу, через (2,0) — (2,1) — (2,2). Тот, кто записал 3, считал по картинке, а не шёл по лабиринту.",
      },
      {
        kk: "Экранға екі жол шығады: алдымен 5, содан кейін 1. Екінші сан — (0,3) ұяшығы: ол бос, бірақ айналасы түгел қабырға, сондықтан толқын оған жетпейді және оның `dist` мәні -1 күйінде қалады.",
        ru: "На экран выводятся две строки: сначала 5, потом 1. Второе число — это клетка (0,3): она свободна, но со всех сторон окружена стенами, поэтому волна до неё не доходит и её значение в `dist` остаётся равным -1.",
      },
    ],
  },
  {
    /*
     * March's own assessment sentence, and the reason this check exists in the
     * shape it does: «табылған жолдың неге шынымен ең қысқа екенін түсіндіреді».
     * Cites p.9 rather than p.6 — the general method is written work, but this
     * particular question is the month's.
     *
     * Asked about the learner's OWN program from b1, which is the version of
     * the question that cannot be recited: «толқын неге ең қысқа жолды табады»
     * has a memorised answer and «сенің бағдарламаң шығарған сан неге ең қысқа»
     * does not. It is also where the method lands on a person — a learner who
     * traced a small map by hand instead of writing the wave has to say so
     * here, and says what they trust instead.
     *
     * One question, deliberately. The four marking points below are the four
     * claims a complete answer makes, not four things to be asked for
     * separately: every numbered sub-question in this slot in September,
     * November and December bought another two minutes the check did not have.
     *
     * Never machine-scored. Settles as `unknown`; a teacher reads it.
     */
    id: "m7.as.b3",
    type: "explain",
    skillRefs: ["graph.shortest_path", "graph.bfs"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Жазбаша жауап бер. Бірінші тапсырмада бағдарламаң бір сан шығарды. " +
        "Сол сан шынымен ең қысқа жолдың ұзындығы екенін дәлелдеп жаз: ұяшықтардың қандай ретпен өңделетінін, әр ұяшыққа нөмірдің қай сәтте жазылатынын және сол нөмірдің неге кейін өзгермейтінін түсіндір. " +
        "Жауабың -1 болатын карта үшін де бір сөйлем қос: ол сан іздеу сәтсіз аяқталғанын емес, шығу ұяшығына жол жоқ екенін қалай дәлелдейді?",
      ru:
        "Ответь письменно. В первом задании твоя программа вывела число. " +
        "Докажи, что это число — действительно длина кратчайшего пути: объясни, в каком порядке обрабатываются клетки, в какой момент клетке записывается её номер и почему этот номер потом не меняется. " +
        "Добавь одно предложение про карту, на которой ответ равен -1: почему это число доказывает, что до клетки-выхода пути нет, а не то, что поиск просто не удался?",
    },
    expectedPoints: [
      {
        kk: "Кезектегі сандар ешқашан кемімейді. Жаңа ұяшық кезекке тек k қашықтықтағы ұяшық өңделіп жатқанда қосылады, ал оның нөмірі k + 1 болады. Сондықтан k қашықтықтағы ұяшықтардың бәрі k + 1 қашықтықтағы кез келген ұяшықтан бұрын кезектен алынады. `head` тек алға жылжитындықтан, бұл рет бұзылмайды.",
        ru: "Числа в очереди никогда не убывают. Новая клетка попадает в очередь только тогда, когда обрабатывается клетка с расстоянием k, и её номер равен k + 1. Поэтому все клетки с расстоянием k достаются из очереди раньше любой клетки с расстоянием k + 1. Поскольку `head` только движется вперёд, этот порядок не нарушается.",
      },
      {
        kk: "Ұяшыққа нөмір бір-ақ рет жазылады — толқын оған алғаш жеткенде. Мұны `dist[nr][nc] == -1` шарты қамтамасыз етеді: нөмір жазылған ұяшық енді ешқашан кезекке түспейді, демек оның саны — сол ұяшыққа жеткен ЕҢ БІРІНШІ жолдың ұзындығы. Ал бірінші жол — ең қысқа жол, өйткені одан қысқа жол болса, толқын оған ертерек жеткен болар еді.",
        ru: "Номер записывается клетке ровно один раз — когда волна доходит до неё впервые. Это обеспечивает условие `dist[nr][nc] == -1`: клетка с уже записанным номером больше никогда не попадает в очередь, значит её число — длина САМОГО ПЕРВОГО пути, которым до неё добрались. А первый путь и есть кратчайший: будь путь короче, волна пришла бы по нему раньше.",
      },
      {
        kk: "Осы екеуінен есептің жауабы шығады: кезектен алынған бірінші шеткі ұяшық — ең жақын шығу. Одан жақынырақ шығу болса, оның нөмірі кіші болар еді, ал кіші нөмірлі ұяшық кезектен бұрын алынады — яғни ол бірінші болып шығар еді. (Толқынды толық жүргізіп, барлық шеткі ұяшықтың ішінен ең кішісін таңдаған оқушының дәлелі де осы: әр нөмір — сол ұяшыққа дейінгі ең қысқа жол, ал ең кішісін таңдау — солардың ішіндегі ең жақынын таңдау.)",
        ru: "Из этих двух утверждений следует ответ задачи: первая же краевая клетка, вынутая из очереди, и есть ближайший выход. Если бы существовал выход поближе, его номер был бы меньше, а клетка с меньшим номером достаётся из очереди раньше — то есть первой оказалась бы она. (У того, кто прогнал волну целиком и взял наименьшее число среди краевых клеток, доказательство то же самое: каждое число — кратчайший путь до своей клетки, а выбор наименьшего — выбор ближайшей из них.)",
      },
      {
        kk: "-1 — іздеудің сәтсіздігі емес, дәлел. Кезек босады деген сөз — бастаудан жетуге болатын әрбір ұяшық кезекте болып, өңделіп шықты дегені; олардың ешқайсысы картаның шетінде тұрған жоқ. Одан әрі қарайтын ұяшық қалмағандықтан, шығуға жол мүлде жоқ. (Толқынды жазбай, кішкентай картаны қолмен жүріп шыққан оқушы да осыны дәлелдеуі керек: неге барлық мүмкін жолды қарап шыққанына сенеді.)",
        ru: "-1 — это не неудача поиска, а доказательство. Опустевшая очередь означает, что каждая достижимая из старта клетка успела в ней побывать и была обработана, и ни одна из них не стоит на краю карты. Смотреть больше нечего, значит пути к выходу нет вовсе. (Тому, кто не писал волну, а прошёл маленькую карту вручную, нужно доказать то же самое: почему он уверен, что перебрал все возможные пути.)",
      },
    ],
  },
  {
    /*
     * «Ауызша түсіндіру» (p.6), pointed at the one defect in this month that no
     * checker can see.
     *
     * Both re-queueing variants were written out and run against all nine of
     * b1's cases: the mark set when a cell is taken OUT of the queue instead of
     * when it is put in, and the distance rewritten on every arrival. Both
     * printed the right answer on all nine. So this block is not asking the
     * learner to find a wrong answer — it is asking them to explain a fault
     * that leaves the output untouched, which is the only honest way to grade
     * it and the reason `m7.l5` exists.
     *
     * One question. The marking points deliberately do NOT claim the answer
     * becomes wrong: on maps this size it does not, and telling a fourteen-
     * year-old otherwise would be inventing a symptom. What breaks is the
     * amount of work, and the argument they wrote in b3.
     *
     * Settles as `unknown`. The teacher hears it and reads these points.
     */
    id: "m7.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["graph.bfs", "perf.compare_solutions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Мұғалімге ауызша жауап бер. Бір ұяшық кезекке екі рет түсе алатын болса, толқынмен не болады — және мұны экрандағы жауапқа қарап байқауға бола ма?",
      ru:
        "Ответь учителю устно. Что произойдёт с волной, если одна и та же клетка сможет попасть в очередь дважды, — и можно ли это заметить по ответу на экране?",
    },
    expectedPoints: [
      {
        kk: "Экрандағы жауап әдетте дұрыс болып қала береді: ұяшыққа нөмір алғаш жеткенде жазылады, ал қайта түскен көшірме бұрынғы санды кішірейтпейді. Дәл сондықтан бұл қате қауіпті: бірде-бір тест құламайды, сондықтан оны тек кодты оқып отырып табуға болады.",
        ru: "Ответ на экране обычно остаётся правильным: номер записывается клетке при первом попадании, и повторная копия в очереди не делает это число меньше. Именно поэтому ошибка опасна: ни один тест не падает, и найти её можно только читая код.",
      },
      {
        kk: "Өзгеретіні — жұмыс көлемі. Ұяшық әр бос көршісі үшін бір реттен кезекке түсе алады, сондықтан кезек ұяшық санынан бірнеше есе ұзарады, ал әр көшірме кезектен қайта алынып, оның төрт көршісі қайта қаралады. 20×20 картада бұл жүздеген артық қадам; карта үлкейген сайын айырма өседі.",
        ru: "Меняется объём работы. Клетка может попасть в очередь по одному разу за каждого свободного соседа, поэтому очередь становится в несколько раз длиннее числа клеток, и каждая копия снова достаётся из очереди, а её четыре соседа снова просматриваются. На карте 20×20 это сотни лишних шагов, и чем больше карта, тем больше разрыв.",
      },
      {
        kk: "Ең бастысы — үшінші тапсырмадағы дәлел құлайды. Ол дәлел «әр ұяшыққа нөмір бір-ақ рет, алғаш жеткенде жазылады» дегенге сүйенеді. Ұяшық екі рет өңделсе және екінші рет оның нөмірі қайта жазылса, ол сан енді бірінші жолдың ұзындығы емес, сондықтан жауап дұрыс шыққан күнде де оның неге ең қысқа екенін дәлелдеу мүмкін емес.",
        ru: "Главное — рушится доказательство из третьего задания. Оно опирается на то, что номер записывается клетке ровно один раз, при первом попадании. Если клетка обрабатывается дважды и на втором заходе её номер переписывается, это число больше не длина первого пути, и тогда, даже когда ответ выходит верным, доказать, что он кратчайший, уже нельзя.",
      },
      {
        kk: "Түзету — бір жол, әрі ол «қашан» деген сұрақтың жауабы: `dist[nr][nc]`-ге сан жазу мен ұяшықты кезекке қосу бір қадамда, ұяшық алғаш көрінген сәтте болуы керек. Сонда `dist[nr][nc] == -1` шарты дәл «бұл ұяшық әлі кезекте болған жоқ» дегенді білдіреді. Белгіні ұяшық кезектен алынған кезде қою — дұрыс көрінетін, бірақ дұрыс емес нұсқа.",
        ru: "Исправление — одна строка, и это ответ на вопрос «когда»: записать число в `dist[nr][nc]` и добавить клетку в очередь нужно одним шагом, в момент, когда клетку увидели впервые. Тогда условие `dist[nr][nc] == -1` означает ровно «эта клетка ещё не была в очереди». А ставить отметку тогда, когда клетку достают из очереди, — это вариант, который выглядит правильным и таковым не является.",
      },
    ],
  },
];
