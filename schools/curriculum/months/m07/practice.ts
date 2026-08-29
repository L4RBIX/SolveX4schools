import type { LessonBlock } from "../../types";

/**
 * m7.l6 · Өз бетіңмен шығар / Реши сам — March's independent practice set.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * March's practice paragraph (p.9) names six families by hand: «картада қанша
 * арал бар», «берілген нүктеден аймақты бояу», «бір ұяшықтан екіншісіне жетуге
 * бола ма», «лабиринттегі ең қысқа жол», «ең үлкен аралдың өлшемі»,
 * «маршрутты қалпына келтіру». Five of them are set here unscaffolded —
 * `m7.p3`, `m7.p4`, `m7.p5`, `m7.p6`, `m7.p7` — and carry `curriculum-derived`
 * for that reason. The route-restoration family belongs to `m7.l4`, which
 * teaches printing the path; repeating it here would be a second copy of a
 * lesson task rather than a new problem, so this set takes the other half of
 * that idea instead: `m7.p10` asks for the length of a route that is forced
 * through a stated waypoint, which needs two waves and no path printing.
 *
 * The month is «алғашқы танысу» — a first acquaintance — and it is the
 * smallest month in the year: p.9 promises about 26 tasks. Ten unscaffolded
 * problems is therefore a large share of it, so every statement here is short
 * and every map is small enough to draw on squared paper while thinking.
 *
 * ## Six decisions taken once, so no block below re-litigates them
 *
 * 1. **One input format, stated in full in every prompt, in both languages.**
 *    First line `n m`; then `n` lines of exactly `m` characters, `.` free and
 *    `#` wall; then, where the task needs them, further lines of coordinates.
 *    Rows and columns are numbered **from 0**, which every prompt says out
 *    loud: it is Python's own numbering, and asking a fourteen-year-old to
 *    subtract one before they have a working traversal is a second bug source
 *    bolted onto the first. `1 ≤ n ≤ 20` and `1 ≤ m ≤ 20` everywhere, so a
 *    learner who reaches for recursion instead of the queue is safe from
 *    Python's recursion limit — at most 400 cells deep.
 *
 * 2. **The queue is a list with a moving head index.** `collections.deque` is
 *    never taught by this programme and importing it would put an unexplained
 *    object at the centre of the month, so every reference solution here reads
 *    `qr = [sr]`, `qc = [sc]`, `head = 0`, `while head < len(qr):` — one index
 *    walking forward through a list that keeps growing behind it, which is
 *    January's two-pointer idea on a new problem. Two parallel lists rather
 *    than one list of pairs, so nothing here needs a tuple either. Nothing in
 *    this file uses a construct later than December.
 *
 * 3. **`m7.p8` is not the brief's "how many cells are reachable from the
 *    start".** In a grid the cells reachable from a free cell ARE its region,
 *    so that statement is `m7.p4` with different words and would have shipped
 *    the same program twice under two ids — the defect the first adversarial
 *    review found most often, in the form that is hardest to see. The rung is
 *    kept and the question moved one step on: how many cells are within **k**
 *    moves. That needs the distance the wave carries, not just the fact of
 *    reaching, so it is a genuinely different program and it sets up `m7.p9`.
 *
 * 4. **`m7.p10` asks for a helper function as advice, not as a rule.** Output
 *    comparison cannot see whether a submission defined `spread()`, and telling
 *    a learner a structural requirement was checked when it was not is the
 *    contract's fourth defect class. So the prompt says the helper is
 *    convenient and states plainly that the answer is graded on the number
 *    printed — option 2 of the three honest options. Option 1 was considered
 *    and rejected: two waves from two different cells is exactly what the task
 *    needs, but a learner who writes the wave out twice by hand produces the
 *    same output, and no case can tell the two apart.
 *
 * 5. **No `diagnosticMapping` anywhere in this file.** A mapping may only be
 *    declared when one wrong answer has exactly one cause. On a grid task a
 *    wrong count is reachable from a missing bounds check, a mark set on exit,
 *    diagonal neighbours, or a mis-read of the input format — four different
 *    misunderstandings landing on one number. The pipeline emitting
 *    `unattributed_failure` and asking the learner is the correct outcome.
 *
 * 6. **The checker stays `token` throughout.** No prompt here claims a layout.
 *    `m7.p9` prints two numbers and its prompt asks for two numbers, the way
 *    September's `m1.p4` does; the coordinates are the exercise, not the space
 *    between them.
 *
 * ## The wrong programs these cases are built to fail
 *
 * Every block carries at least one hidden case chosen against a named
 * degenerate solution, and all of them were executed against the real thing
 * before this file was written. Across the ten: the missing bounds check —
 * which in Python does not crash on `r - 1` but **wraps to the far edge**, so
 * `m7.p3` carries a map whose top and bottom rows fuse into one island under
 * it; the visited mark set on exit instead of on entry, which counts a cell
 * twice and dies on any two-by-two open block; the start cell being a wall; an
 * unreachable finish; a 1×1 map; a map that is entirely walls; a map that is
 * entirely free; diagonal neighbours treated as neighbours; Manhattan distance
 * substituted for a real shortest path; and depth-first exploration returning
 * the first route found rather than the shortest.
 *
 * ## Tracks
 *
 * `m7.p1`–`m7.p8` go to all three routes. The programme asks support for more
 * assembling and less writing from scratch **across the month**, and the five
 * lessons carry that substitution at their `s` ids; a support learner still
 * has to finish something alone, and the first rungs here are short enough
 * that they can. `m7.p9` adds a tie-break that has to be read carefully
 * (core + advanced) and `m7.p10` composes two waves (advanced only).
 */
export const M7_PRACTICE: LessonBlock[] = [
  {
    /* Rung 1: no traversal at all, just the input format. Before a learner can
       be wrong about neighbours they have to be right about reading n rows of
       m characters, and a first grid task that also demands a queue hides one
       failure behind the other. The only decision here is the `== "."` test. */
    id: "m7.p1",
    type: "write_code",
    skillRefs: ["grid.cells", "loops.nested", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадағы бос ұяшықтардың жалпы санын шығар. " +
        "Мысалы, `..#.`, `.##.`, `....` жолдарынан тұратын 3×4 карта үшін жауап 9.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Выведи общее количество свободных клеток на карте. " +
        "Например, для карты 3×4 из строк `..#.`, `.##.`, `....` ответ 9.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\nfree = 0\nfor i in range(n):\n    row = input()\n    for j in range(m):\n        if row[j] == \".\":\n            free += 1\nprint(free)",
    cases: [
      { input: "3 4\n..#.\n.##.\n....", expectedOutput: "9" },
      /* 1×1 free, then 1×1 wall. The smallest map the format allows, and the
         one a nested loop written for "at least a few rows" gets wrong. */
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* Entirely walls, then entirely free: the two ends of the count. The
         first kills an accumulator that never gets a chance to stay at 0, the
         second kills any program that mistakes `#` for the thing to count. */
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      { input: "2 3\n...\n...", expectedOutput: "6", hidden: true },
      /* Every free cell is in the LAST row: `range(n - 1)` prints 1, and a
         program that reads the map but only counts row 0 prints 0. */
      { input: "3 3\n###\n#.#\n...", expectedOutput: "4", hidden: true },
      /* Every free cell is in the LAST column, for the same reason on j. */
      { input: "3 4\n###.\n###.\n###.", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* Rung 2: still no traversal, but now the boundary of the map has to be
       named in code rather than seen. The trap is real and it is not the one a
       learner expects — the obvious four-loops-round-the-frame solution counts
       every corner twice, and on a 1×1 map counts the single cell four times.
       `debug.boundary` is the skill and this is what it looks like on a grid. */
    id: "m7.p2",
    type: "write_code",
    skillRefs: ["grid.cells", "debug.boundary", "loops.nested"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картаның шетінде тұрған бос ұяшықтардың санын шығар. " +
        "Ұяшық ең үстіңгі жолда, ең астыңғы жолда, ең сол жақ бағанда немесе ең оң жақ бағанда тұрса, шеткі саналады. " +
        "Бір ұяшық бірден екі шетке шықса да (мысалы, бұрыштағы ұяшық) ол бір-ақ рет саналады.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Выведи количество свободных клеток, стоящих на краю карты. " +
        "Клетка считается краевой, если она в самой верхней строке, в самой нижней строке, в самом левом столбце или в самом правом столбце. " +
        "Если клетка выходит сразу на два края (например, угловая), она всё равно считается один раз.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nedge = 0\nfor i in range(n):\n    for j in range(m):\n        if g[i][j] == \".\":\n            if i == 0 or i == n - 1 or j == 0 or j == m - 1:\n                edge += 1\nprint(edge)",
    cases: [
      { input: "3 4\n.#..\n#..#\n....", expectedOutput: "7" },
      /* The whole map is one cell, so it is simultaneously top row, bottom
         row, left column and right column. Four separate loops round the frame
         print 4 here. This is the case that decides whether the learner
         counted cells or counted sides. */
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      /* Four free corners, each on two edges: the frame-loop program prints 12
         instead of 8. */
      { input: "3 3\n...\n.#.\n...", expectedOutput: "8", hidden: true },
      /* The only free cell is in the middle: a program that forgot the edge
         test entirely prints 1 instead of 0. */
      { input: "3 3\n###\n#.#\n###", expectedOutput: "0", hidden: true },
      /* Every cell is a corner. */
      { input: "2 2\n..\n..", expectedOutput: "4", hidden: true },
      /* One column, so column 0 and column m - 1 are the same column, and
         every cell is on the edge. */
      { input: "4 1\n.\n#\n#\n.", expectedOutput: "2", hidden: true },
      /* One row, the mirror of the case above. A program that only inspects
         the top and bottom rows happens to be right here, which is why the
         next case is not this one. */
      { input: "1 5\n.#.#.", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* Rung 3, and the first traversal. PDF p.9 family «картада қанша арал бар».
       Counting regions is the cheapest possible use of a wave: the answer does
       not depend on the order cells come out of the queue, only on the mark
       being set. That is deliberate — the first task that needs a queue should
       fail for one reason at a time. */
    id: "m7.p3",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картада неше арал бар екенін шығар. Арал — бір-бірімен байланысқан бос ұяшықтардың тобы. " +
        "Екі ұяшық ортақ қабырғасы болса ғана көрші саналады: жоғары, төмен, солға, оңға. Тек бұрышы түйіскен ұяшықтар көрші емес. " +
        "Картада бос ұяшық мүлде болмаса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Выведи, сколько на карте островов. Остров — это группа свободных клеток, связанных друг с другом. " +
        "Соседними считаются только клетки с общей стороной: сверху, снизу, слева, справа. Клетки, соприкасающиеся лишь углом, соседями не считаются. " +
        "Если свободных клеток на карте нет совсем, выведи 0.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(list(input()))\nislands = 0\nfor sr in range(n):\n    for sc in range(m):\n        if g[sr][sc] == \".\":\n            islands += 1\n            g[sr][sc] = \"#\"\n            qr = [sr]\n            qc = [sc]\n            head = 0\n            while head < len(qr):\n                r = qr[head]\n                c = qc[head]\n                head += 1\n                if r > 0 and g[r - 1][c] == \".\":\n                    g[r - 1][c] = \"#\"\n                    qr.append(r - 1)\n                    qc.append(c)\n                if r < n - 1 and g[r + 1][c] == \".\":\n                    g[r + 1][c] = \"#\"\n                    qr.append(r + 1)\n                    qc.append(c)\n                if c > 0 and g[r][c - 1] == \".\":\n                    g[r][c - 1] = \"#\"\n                    qr.append(r)\n                    qc.append(c - 1)\n                if c < m - 1 and g[r][c + 1] == \".\":\n                    g[r][c + 1] = \"#\"\n                    qr.append(r)\n                    qc.append(c + 1)\nprint(islands)",
    cases: [
      { input: "4 5\n..#..\n..#..\n#####\n..#..", expectedOutput: "4" },
      /* Two cells that touch only at a corner. A solution that walks eight
         neighbours instead of four prints 1. The prompt says this in both
         languages, so the case is enforcing something the learner was told. */
      { input: "2 2\n.#\n#.", expectedOutput: "2", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* Entirely free — one island, not n × m of them. */
      { input: "3 3\n...\n...\n...", expectedOutput: "1", hidden: true },
      /* Entirely walls. */
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      /* A snake: every free cell belongs to one island, but reading only the
         cell above and the cell to the left cannot see it. The "count a cell
         as a new island when its up and left neighbours are walls" rule — the
         commonest way to answer this without a traversal at all — prints 3. */
      { input: "5 5\n.....\n####.\n.....\n.####\n.....", expectedOutput: "1", hidden: true },
      /* Four separate corners. This is the missing-bounds-check case, and in
         Python the missing check does not crash: `g[r - 1]` with r = 0 is
         `g[-1]`, the LAST row, and `g[r][c - 1]` with c = 0 is the last column.
         So a solution without `r > 0` and `c > 0` wraps the map into a ring
         and fuses all four corners into one island. It prints 1. */
      { input: "3 3\n.#.\n###\n.#.", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /* Rung 4. PDF p.9 family «берілген нүктеден аймақты бояу». Same wave as
       m7.p3, different question: one region rather than all of them, and the
       starting cell is now given rather than found. That moves the mark from
       "have I been here" to "is this cell part of the answer", and it is the
       first task where a cell counted twice is a wrong number rather than
       wasted time. */
    id: "m7.p4",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадан кейінгі жолда r мен c сандары беріледі — бір ұяшықтың координаталары; жол мен баған нөмірлері 0-ден басталады. " +
        "Сол ұяшық жататын аймақта неше ұяшық бар екенін шығар. Аймақ — байланысқан бос ұяшықтардың тобы, көрсетілген ұяшықтың өзі де саналады. " +
        "Екі ұяшық ортақ қабырғасы болса ғана көрші саналады; тек бұрышы түйіскен ұяшықтар көрші емес. " +
        "Егер көрсетілген ұяшықтың орнында қабырға тұрса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В строке после карты даны числа r и c — координаты одной клетки; нумерация строк и столбцов начинается с нуля. " +
        "Выведи, сколько клеток в области, которой принадлежит эта клетка. Область — это группа связанных свободных клеток, сама указанная клетка тоже считается. " +
        "Соседними считаются только клетки с общей стороной; клетки, соприкасающиеся лишь углом, соседями не являются. " +
        "Если на месте указанной клетки стоит стена, выведи 0.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(list(input()))\nsr, sc = map(int, input().split())\nsize = 0\nif g[sr][sc] == \".\":\n    g[sr][sc] = \"#\"\n    qr = [sr]\n    qc = [sc]\n    head = 0\n    while head < len(qr):\n        r = qr[head]\n        c = qc[head]\n        head += 1\n        size += 1\n        if r > 0 and g[r - 1][c] == \".\":\n            g[r - 1][c] = \"#\"\n            qr.append(r - 1)\n            qc.append(c)\n        if r < n - 1 and g[r + 1][c] == \".\":\n            g[r + 1][c] = \"#\"\n            qr.append(r + 1)\n            qc.append(c)\n        if c > 0 and g[r][c - 1] == \".\":\n            g[r][c - 1] = \"#\"\n            qr.append(r)\n            qc.append(c - 1)\n        if c < m - 1 and g[r][c + 1] == \".\":\n            g[r][c + 1] = \"#\"\n            qr.append(r)\n            qc.append(c + 1)\nprint(size)",
    cases: [
      /* The named region is a two-by-two block, which is the smallest shape in
         which a cell has two already-queued neighbours. A solution that sets
         the visited mark when a cell comes OUT of the queue instead of when it
         goes in pushes the fourth cell twice and prints 5. The visible sample
         catches it, so this mistake is found in the editor, not on a hidden
         case — it is the error PDF p.9 asks March to teach. */
      { input: "4 5\n..#..\n..#..\n#####\n.....\n0 0", expectedOutput: "4" },
      /* The named cell is a wall. */
      { input: "4 5\n..#..\n..#..\n#####\n.....\n2 2", expectedOutput: "0", hidden: true },
      /* Entirely free: one region covering the whole map. */
      { input: "3 3\n...\n...\n...\n1 1", expectedOutput: "9", hidden: true },
      /* A region of exactly one cell, with a much larger region elsewhere on
         the map: a program that counts every free cell prints 4. */
      { input: "3 3\n.#.\n###\n...\n0 0", expectedOutput: "1", hidden: true },
      { input: "1 1\n.\n0 0", expectedOutput: "1", hidden: true },
      /* The whole map is the two-by-two block, so the mark-on-exit bug prints
         5 with nothing else on the map to hide behind. */
      { input: "2 2\n..\n..\n0 0", expectedOutput: "4", hidden: true },
      /* The named cell is in the SMALLER region and the larger one comes
         first in reading order. Kills both "count every free cell" (prints 13)
         and "count the first region you find" (prints 10). */
      { input: "4 5\n.....\n.....\n#####\n....#\n3 0", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /* Rung 5. PDF p.9 family «ең үлкен аралдың өлшемі». The wave is now inside
       a scan and its result has to be compared, which is October's
       best-so-far over something that is not a number in a list. The empty map
       is the case that decides whether `best` was initialised honestly. */
    id: "m7.p5",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадағы ең үлкен аралда неше ұяшық бар екенін шығар. Арал — байланысқан бос ұяшықтардың тобы. " +
        "Екі ұяшық ортақ қабырғасы болса ғана көрші саналады; тек бұрышы түйіскен ұяшықтар көрші емес. " +
        "Картада бос ұяшық мүлде болмаса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Выведи, сколько клеток в самом большом острове карты. Остров — это группа связанных свободных клеток. " +
        "Соседними считаются только клетки с общей стороной; клетки, соприкасающиеся лишь углом, соседями не являются. " +
        "Если свободных клеток на карте нет совсем, выведи 0.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(list(input()))\nbest = 0\nfor sr in range(n):\n    for sc in range(m):\n        if g[sr][sc] == \".\":\n            g[sr][sc] = \"#\"\n            qr = [sr]\n            qc = [sc]\n            head = 0\n            size = 0\n            while head < len(qr):\n                r = qr[head]\n                c = qc[head]\n                head += 1\n                size += 1\n                if r > 0 and g[r - 1][c] == \".\":\n                    g[r - 1][c] = \"#\"\n                    qr.append(r - 1)\n                    qc.append(c)\n                if r < n - 1 and g[r + 1][c] == \".\":\n                    g[r + 1][c] = \"#\"\n                    qr.append(r + 1)\n                    qc.append(c)\n                if c > 0 and g[r][c - 1] == \".\":\n                    g[r][c - 1] = \"#\"\n                    qr.append(r)\n                    qc.append(c - 1)\n                if c < m - 1 and g[r][c + 1] == \".\":\n                    g[r][c + 1] = \"#\"\n                    qr.append(r)\n                    qc.append(c + 1)\n            if size > best:\n                best = size\nprint(best)",
    cases: [
      /* The largest island is found SECOND, so a program that reports the
         first one it meets prints 4. The right-hand island is also a block
         four cells wide, so a mark set on exit inflates it and prints 14. */
      { input: "4 4\n.#..\n.#..\n.#..\n.#..", expectedOutput: "8" },
      /* Largest island last in reading order — kills "keep the first". */
      { input: "3 5\n.#...\n.#...\n.#...", expectedOutput: "9", hidden: true },
      /* Largest island first in reading order — kills "keep the last", which
         is what dropping the `if size > best` comparison amounts to. */
      { input: "3 5\n...#.\n...#.\n...#.", expectedOutput: "9", hidden: true },
      /* Entirely walls: there is no island, and `best` must already be 0. */
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      /* Entirely free: one island of nine, not nine islands of one. */
      { input: "3 3\n...\n...\n...", expectedOutput: "9", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* A two-by-two block against a strip of two: under a mark set on exit
         the block reports 5 and still wins, so this case is here to make the
         printed number wrong, not just the ranking. */
      { input: "3 4\n..#.\n..#.\n####", expectedOutput: "4", hidden: true },
      /* Two islands of exactly the same size — the tie a `>` and a `>=` both
         survive, included so the answer does not depend on which was written. */
      { input: "2 3\n.#.\n.#.", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* Rung 6. PDF p.9 family «бір ұяшықтан екіншісіне жетуге бола ма». The
       output is a word, so the token is stated in both prompts and both
       prompts name the same two English words — a learner reading the Russian
       and a learner reading the Kazakh print the same thing. Two coordinate
       lines arrive here for the first time; every later block reuses the
       shape. */
    id: "m7.p6",
    type: "write_code",
    skillRefs: ["graph.bfs", "graph.regions", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадан кейін екі жол келеді: алдымен бастау ұяшығының r мен c координаталары, содан кейін финиш ұяшығының r мен c координаталары. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа — жоғарыға, төменге, солға немесе оңға — жүруге болады; бұрыштап жүруге болмайды. " +
        "Бастаудан финишке жетуге бола ма? Жетуге болса `yes`, болмаса `no` деген ағылшын сөзін шығар. " +
        "Бастау немесе финиш ұяшығының орнында қабырға тұруы мүмкін — ондай жағдайда жауап `no`.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "После карты идут две строки: сначала координаты r и c стартовой клетки, затем координаты r и c финишной клетки. Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку — вверх, вниз, влево или вправо; ходить по диагонали нельзя. " +
        "Можно ли добраться от старта до финиша? Выведи английское слово `yes`, если можно, и `no`, если нельзя. " +
        "На месте стартовой или финишной клетки может оказаться стена — тогда ответ `no`.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(list(input()))\nsr, sc = map(int, input().split())\nfr, fc = map(int, input().split())\nanswer = \"no\"\nif g[sr][sc] == \".\":\n    g[sr][sc] = \"#\"\n    qr = [sr]\n    qc = [sc]\n    head = 0\n    while head < len(qr):\n        r = qr[head]\n        c = qc[head]\n        head += 1\n        if r == fr and c == fc:\n            answer = \"yes\"\n        if r > 0 and g[r - 1][c] == \".\":\n            g[r - 1][c] = \"#\"\n            qr.append(r - 1)\n            qc.append(c)\n        if r < n - 1 and g[r + 1][c] == \".\":\n            g[r + 1][c] = \"#\"\n            qr.append(r + 1)\n            qc.append(c)\n        if c > 0 and g[r][c - 1] == \".\":\n            g[r][c - 1] = \"#\"\n            qr.append(r)\n            qc.append(c - 1)\n        if c < m - 1 and g[r][c + 1] == \".\":\n            g[r][c + 1] = \"#\"\n            qr.append(r)\n            qc.append(c + 1)\nprint(answer)",
    cases: [
      { input: "4 5\n.....\n.###.\n.....\n.....\n0 0\n3 4", expectedOutput: "yes" },
      /* Both ends free, in different regions. The whole task is this case: a
         program that answers `yes` whenever both cells are `.` — no traversal
         at all — passes everything else in the set and dies here. */
      { input: "3 3\n..#\n###\n#..\n0 0\n2 2", expectedOutput: "no", hidden: true },
      /* The start is a wall. A program that begins the wave without looking at
         the start cell walks out of it and answers `yes`. */
      { input: "3 3\n#..\n...\n...\n0 0\n2 2", expectedOutput: "no", hidden: true },
      /* The finish is a wall, on an otherwise open map. */
      { input: "3 3\n...\n...\n..#\n0 0\n2 2", expectedOutput: "no", hidden: true },
      /* Start and finish are the same free cell: zero steps still counts. */
      { input: "3 3\n...\n.#.\n...\n1 0\n1 0", expectedOutput: "yes", hidden: true },
      /* Start and finish are the same cell and it is a wall — the pair above
         and this one together forbid "if they are equal, print yes". */
      { input: "3 3\n...\n.#.\n...\n1 1\n1 1", expectedOutput: "no", hidden: true },
      { input: "1 1\n.\n0 0\n0 0", expectedOutput: "yes", hidden: true },
      /* The two cells touch at a corner and nowhere else: a diagonal step
         would answer `yes`, and the prompt forbids one. */
      { input: "2 2\n.#\n#.\n0 0\n1 1", expectedOutput: "no", hidden: true },
    ],
  },
  {
    /* Rung 7. PDF p.9 family «лабиринттегі ең қысқа жол» — the centre of the
       month. Everything before this counts cells; this one needs the wave to
       arrive in layers, and the mark now carries a number instead of a flag.
       `dist` starting at -1 does two jobs at once: it is the visited test and
       it is the answer for a finish that was never reached, which is why the
       program ends `print(dist[fr][fc])` with no special case for -1. */
    id: "m7.p7",
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадан кейін екі жол келеді: бастау ұяшығының r мен c координаталары, содан кейін финиш ұяшығының r мен c координаталары. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан финишке дейінгі ең қысқа жолда неше қадам бар екенін шығар. Бастау мен финиш бір ұяшық болса, жауап 0. " +
        "Финишке жету мүмкін болмаса немесе екеуінің біреуінің орнында қабырға тұрса, -1 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "После карты идут две строки: координаты r и c стартовой клетки, затем координаты r и c финишной клетки. Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, сколько шагов в кратчайшем пути от старта до финиша. Если старт и финиш — одна и та же клетка, ответ 0. " +
        "Если до финиша не добраться или на месте одной из этих двух клеток стоит стена, выведи -1.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nfr, fc = map(int, input().split())\ndist = []\nfor i in range(n):\n    line = []\n    for j in range(m):\n        line.append(-1)\n    dist.append(line)\nif g[sr][sc] == \".\":\n    dist[sr][sc] = 0\n    qr = [sr]\n    qc = [sc]\n    head = 0\n    while head < len(qr):\n        r = qr[head]\n        c = qc[head]\n        head += 1\n        if r > 0 and g[r - 1][c] == \".\" and dist[r - 1][c] == -1:\n            dist[r - 1][c] = dist[r][c] + 1\n            qr.append(r - 1)\n            qc.append(c)\n        if r < n - 1 and g[r + 1][c] == \".\" and dist[r + 1][c] == -1:\n            dist[r + 1][c] = dist[r][c] + 1\n            qr.append(r + 1)\n            qc.append(c)\n        if c > 0 and g[r][c - 1] == \".\" and dist[r][c - 1] == -1:\n            dist[r][c - 1] = dist[r][c] + 1\n            qr.append(r)\n            qc.append(c - 1)\n        if c < m - 1 and g[r][c + 1] == \".\" and dist[r][c + 1] == -1:\n            dist[r][c + 1] = dist[r][c] + 1\n            qr.append(r)\n            qc.append(c + 1)\nprint(dist[fr][fc])",
    cases: [
      /* Two steps down a clear left-hand column while the middle of the map
         is a wall. A depth-first walk that tries "right" first wanders the
         whole outer ring and prints 10; counting the CELLS on the path instead
         of the steps between them prints 3. Both are visible failures. */
      { input: "3 5\n.....\n.###.\n.....\n0 0\n2 0", expectedOutput: "2" },
      /* The wall makes the real path three times the straight-line guess:
         |0-2| + |0-0| is 2, the answer is 6. This is the case that kills a
         submission which computes a distance without ever walking. */
      { input: "3 3\n...\n##.\n...\n0 0\n2 0", expectedOutput: "6", hidden: true },
      /* The finish is free but cut off. */
      { input: "3 3\n..#\n###\n#..\n0 0\n2 2", expectedOutput: "-1", hidden: true },
      /* Start equals finish: zero steps, not one and not -1. */
      { input: "3 3\n...\n...\n...\n1 1\n1 1", expectedOutput: "0", hidden: true },
      /* The start is a wall. */
      { input: "3 3\n#..\n...\n...\n0 0\n2 2", expectedOutput: "-1", hidden: true },
      /* The finish is a wall on an otherwise open map, so a program that
         reaches every reachable cell and then reads the finish still has to
         have left -1 sitting there. */
      { input: "3 3\n...\n...\n..#\n0 0\n2 2", expectedOutput: "-1", hidden: true },
      { input: "1 1\n.\n0 0\n0 0", expectedOutput: "0", hidden: true },
      /* A maze with two routes of equal length round a blocked middle. A wave
         that forgets to check whether a cell already has a distance re-queues
         cells for ever and never prints anything. */
      { input: "5 5\n.....\n.###.\n.#...\n.#.#.\n.....\n0 0\n4 4", expectedOutput: "8", hidden: true },
    ],
  },
  {
    /* Rung 8. Not the brief's "how many cells are reachable" — see decision 3
       in the file comment; on a grid that question is m7.p4 with different
       words. Here the wave has to be read AFTER it settles: the distance is no
       longer a means to one cell's answer but the thing every cell is judged
       on. This is also the first block whose input has a value on its own
       line after the coordinates. */
    id: "m7.p8",
    type: "write_code",
    skillRefs: ["graph.bfs", "graph.shortest_path", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Одан кейінгі жолда бастау ұяшығының r мен c координаталары, ал ең соңғы жолда k саны беріледі (0 ≤ k ≤ 400). Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан ең көбі k қадам жасап жетуге болатын бос ұяшықтардың санын шығар. Бастаудың өзі де саналады — оған 0 қадам керек. " +
        "Бастау ұяшығының орнында қабырға тұрса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В следующей строке даны координаты r и c стартовой клетки, а в последней строке — число k (0 ≤ k ≤ 400). Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, сколько свободных клеток достижимо из старта не более чем за k шагов. Сам старт тоже считается — до него нужно 0 шагов. " +
        "Если на месте стартовой клетки стоит стена, выведи 0.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\nk = int(input())\ndist = []\nfor i in range(n):\n    line = []\n    for j in range(m):\n        line.append(-1)\n    dist.append(line)\nif g[sr][sc] == \".\":\n    dist[sr][sc] = 0\n    qr = [sr]\n    qc = [sc]\n    head = 0\n    while head < len(qr):\n        r = qr[head]\n        c = qc[head]\n        head += 1\n        if r > 0 and g[r - 1][c] == \".\" and dist[r - 1][c] == -1:\n            dist[r - 1][c] = dist[r][c] + 1\n            qr.append(r - 1)\n            qc.append(c)\n        if r < n - 1 and g[r + 1][c] == \".\" and dist[r + 1][c] == -1:\n            dist[r + 1][c] = dist[r][c] + 1\n            qr.append(r + 1)\n            qc.append(c)\n        if c > 0 and g[r][c - 1] == \".\" and dist[r][c - 1] == -1:\n            dist[r][c - 1] = dist[r][c] + 1\n            qr.append(r)\n            qc.append(c - 1)\n        if c < m - 1 and g[r][c + 1] == \".\" and dist[r][c + 1] == -1:\n            dist[r][c + 1] = dist[r][c] + 1\n            qr.append(r)\n            qc.append(c + 1)\nnear = 0\nfor i in range(n):\n    for j in range(m):\n        if dist[i][j] >= 0 and dist[i][j] <= k:\n            near += 1\nprint(near)",
    cases: [
      /* Twelve cells are reachable in the end and only five are within two
         steps, so "count everything the wave touched" prints 12; `< k` where
         `<= k` was meant drops the second layer and prints 3. */
      { input: "3 5\n.....\n.###.\n.....\n0 0\n2", expectedOutput: "5" },
      /* k = 0 — the boundary itself. The answer is the start alone. */
      { input: "3 5\n.....\n.###.\n.....\n0 0\n0", expectedOutput: "1", hidden: true },
      /* The start is a wall, and k is large enough to reach everything if the
         wave were allowed to begin. */
      { input: "3 3\n#..\n...\n...\n0 0\n5", expectedOutput: "0", hidden: true },
      /* k far beyond any real distance: the cap must not add cells that are
         walls or unreachable. Eight, not nine. */
      { input: "3 3\n...\n.#.\n...\n0 0\n100", expectedOutput: "8", hidden: true },
      /* Walls stretch the real distances: six cells are within Manhattan
         distance 3 of the start, only four are within three actual steps. */
      { input: "3 3\n...\n##.\n...\n0 0\n3", expectedOutput: "4", hidden: true },
      /* A two-by-two open block: a mark set on exit counts a cell twice and
         prints 5. */
      { input: "2 2\n..\n..\n0 0\n5", expectedOutput: "4", hidden: true },
      /* One cell and k = 0 together. */
      { input: "1 1\n.\n0 0\n0", expectedOutput: "1", hidden: true },
      /* The start is free but boxed in; the far corner is free and would be a
         diagonal step away. */
      { input: "2 2\n.#\n#.\n0 0\n10", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /* Rung 9, core and advanced. The first block in the set whose answer is a
       PLACE rather than a quantity, which is what makes the tie-break real: a
       maximum over cells has ties far more often than a maximum over a list of
       numbers, and the last cell the queue hands back is a perfectly good
       farthest cell that is usually the WRONG one to print. So the prompt
       states the rule — smallest row, then smallest column — and the hidden
       cases enforce it rather than trusting the wave's order.
       Two numbers on the output, and the prompt asks for two numbers rather
       than for a layout, so the checker stays `token` as it does at m1.p4. */
    id: "m7.p9",
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "compare.operators"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда бастау ұяшығының r мен c координаталары беріледі; жол мен баған нөмірлері 0-ден басталады. Бастау ұяшығының бос екеніне кепілдік беріледі. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан жетуге болатын ұяшықтардың ішінен ең алысын тап — ең қысқа жолы ең ұзын ұяшықты — және оның жол нөмірі мен баған нөмірін екі сан ретінде шығар. " +
        "Ондай ұяшық бірнешеу болса, жол нөмірі ең кіші ұяшықты таңда; ол да бірдей болса, баған нөмірі ең кішісін таңда. " +
        "Бастаудан ешбір ұяшыққа жүру мүмкін болмаса, жауап — бастаудың өз координаталары. " +
        "Мысалы, бір жолдан тұратын `.....` картасында бастау `0 0` болса, жауап `0 4`.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны координаты r и c стартовой клетки; нумерация строк и столбцов начинается с нуля. Гарантируется, что стартовая клетка свободна. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Среди клеток, достижимых из старта, найди самую далёкую — ту, у которой кратчайший путь самый длинный, — и выведи два числа: номер её строки и номер её столбца. " +
        "Если таких клеток несколько, возьми клетку с наименьшим номером строки; если и он совпадает, возьми наименьший номер столбца. " +
        "Если из старта никуда нельзя пойти, ответ — координаты самого старта. " +
        "Например, для карты из одной строки `.....` и старта `0 0` ответ `0 4`.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\nsr, sc = map(int, input().split())\ndist = []\nfor i in range(n):\n    line = []\n    for j in range(m):\n        line.append(-1)\n    dist.append(line)\ndist[sr][sc] = 0\nqr = [sr]\nqc = [sc]\nhead = 0\nwhile head < len(qr):\n    r = qr[head]\n    c = qc[head]\n    head += 1\n    if r > 0 and g[r - 1][c] == \".\" and dist[r - 1][c] == -1:\n        dist[r - 1][c] = dist[r][c] + 1\n        qr.append(r - 1)\n        qc.append(c)\n    if r < n - 1 and g[r + 1][c] == \".\" and dist[r + 1][c] == -1:\n        dist[r + 1][c] = dist[r][c] + 1\n        qr.append(r + 1)\n        qc.append(c)\n    if c > 0 and g[r][c - 1] == \".\" and dist[r][c - 1] == -1:\n        dist[r][c - 1] = dist[r][c] + 1\n        qr.append(r)\n        qc.append(c - 1)\n    if c < m - 1 and g[r][c + 1] == \".\" and dist[r][c + 1] == -1:\n        dist[r][c + 1] = dist[r][c] + 1\n        qr.append(r)\n        qc.append(c + 1)\nfar = 0\nbr = sr\nbc = sc\nfor i in range(n):\n    for j in range(m):\n        if dist[i][j] > far:\n            far = dist[i][j]\n            br = i\n            bc = j\nprint(br, bc)",
    cases: [
      { input: "1 5\n.....\n0 0", expectedOutput: "0 4" },
      /* Four cells tie at distance 2 and the tie-break picks the first of
         them in reading order. Printing the last cell the queue handed back
         gives `2 2`, and so does a scan written with `>=` instead of `>`. Both
         are farthest cells; neither is the answer the prompt asked for. */
      { input: "3 3\n.#.\n...\n.#.\n1 1", expectedOutput: "0 0", hidden: true },
      /* The tie is inside one row, so only the column rule separates them. */
      { input: "2 3\n...\n#.#\n1 1", expectedOutput: "0 0", hidden: true },
      /* The start is walled in, so the farthest reachable cell is the start
         itself at distance 0, while a bigger free region sits elsewhere on
         the map to tempt a program that never checked reachability. */
      { input: "3 3\n.##\n###\n...\n0 0", expectedOutput: "0 0", hidden: true },
      /* The same, with the start away from the origin: a program that
         initialised its answer to `0 0` rather than to the start prints a wall
         cell it never visited. */
      { input: "3 3\n...\n###\n#.#\n2 1", expectedOutput: "2 1", hidden: true },
      { input: "1 1\n.\n0 0", expectedOutput: "0 0", hidden: true },
      /* The straight-line farthest cell is the opposite corner, but the wall
         makes the far end of the bottom row the real answer: `2 0` is six
         steps away, `2 2` only four. */
      { input: "3 3\n...\n##.\n...\n0 0", expectedOutput: "2 0", hidden: true },
      /* A ring: the wave splits at the start and the two halves meet at the
         far corner. */
      { input: "4 4\n....\n.##.\n.##.\n....\n0 0", expectedOutput: "3 3", hidden: true },
    ],
  },
  {
    /* Rung 10, advanced only. The route family from p.9 read as a composition:
       the shortest way from A to C that is forced through B is the shortest
       way from A to B plus the shortest way from B to C, and nothing else in
       the month has asked a learner to run the wave twice from two different
       cells. Written with a helper it is a short program; written without one
       it is the same twenty lines twice, which is the argument the prompt
       makes as ADVICE — a checker cannot see a `def`, so the prompt says
       outright that the number is what gets graded. See decision 4 in the
       file comment. */
    id: "m7.p10",
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "func.define", "func.reuse"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Картадан кейін үш жол келеді: бастау ұяшығының, аялдама ұяшығының және финиш ұяшығының r мен c координаталары. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан шығып, міндетті түрде аялдамаға соғып, содан кейін финишке жететін ең қысқа жолда неше қадам бар екенін шығар. Жол бір ұяшықтан бірнеше рет өтуіне болады. " +
        "Бастаудан аялдамаға немесе аялдамадан финишке жету мүмкін болмаса, -1 шығар; үш ұяшықтың біреуінің орнында қабырға тұрса, жауап та -1. " +
        "Кеңес: бір ұяшықтан барлық ұяшыққа дейінгі қашықтықты есептейтін функция жазып, оны екі рет шақырған ыңғайлы. Бұл — талап емес, кеңес: жауап шығарылған сан бойынша тексеріледі.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "После карты идут три строки: координаты r и c стартовой клетки, клетки-остановки и финишной клетки. Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, сколько шагов в кратчайшем пути, который идёт из старта, обязательно заходит в клетку-остановку и только потом приходит на финиш. Путь может проходить через одну и ту же клетку несколько раз. " +
        "Если из старта не добраться до остановки или от остановки до финиша, выведи -1; если на месте одной из этих трёх клеток стоит стена, ответ тоже -1. " +
        "Совет: удобно написать функцию, которая считает расстояния от одной клетки до всех остальных, и вызвать её дважды. Это совет, а не требование: ответ проверяется по выведенному числу.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\ng = []\nfor i in range(n):\n    g.append(input())\n\n\ndef spread(sr, sc):\n    d = []\n    for i in range(n):\n        line = []\n        for j in range(m):\n            line.append(-1)\n        d.append(line)\n    if g[sr][sc] == \"#\":\n        return d\n    d[sr][sc] = 0\n    qr = [sr]\n    qc = [sc]\n    head = 0\n    while head < len(qr):\n        r = qr[head]\n        c = qc[head]\n        head += 1\n        if r > 0 and g[r - 1][c] == \".\" and d[r - 1][c] == -1:\n            d[r - 1][c] = d[r][c] + 1\n            qr.append(r - 1)\n            qc.append(c)\n        if r < n - 1 and g[r + 1][c] == \".\" and d[r + 1][c] == -1:\n            d[r + 1][c] = d[r][c] + 1\n            qr.append(r + 1)\n            qc.append(c)\n        if c > 0 and g[r][c - 1] == \".\" and d[r][c - 1] == -1:\n            d[r][c - 1] = d[r][c] + 1\n            qr.append(r)\n            qc.append(c - 1)\n        if c < m - 1 and g[r][c + 1] == \".\" and d[r][c + 1] == -1:\n            d[r][c + 1] = d[r][c] + 1\n            qr.append(r)\n            qc.append(c + 1)\n    return d\n\n\nsr, sc = map(int, input().split())\nwr, wc = map(int, input().split())\nfr, fc = map(int, input().split())\nfirst = spread(sr, sc)\nsecond = spread(wr, wc)\na = first[wr][wc]\nb = second[fr][fc]\nif a == -1 or b == -1:\n    print(-1)\nelse:\n    print(a + b)",
    cases: [
      /* The stop is in the opposite corner from the finish, so the detour
         costs 10 where the direct route costs 2. A submission that ignores the
         stop prints 2; one that measures both legs from the START rather than
         the second from the stop prints 6. Both fail in the editor. */
      { input: "3 5\n.....\n.###.\n.....\n0 0\n0 4\n2 0", expectedOutput: "10" },
      /* The stop is the start: the first leg is 0, not 1 and not skipped. */
      { input: "3 3\n...\n.#.\n...\n0 0\n0 0\n2 2", expectedOutput: "4", hidden: true },
      /* The stop is the finish: the second leg is 0. */
      { input: "3 3\n...\n.#.\n...\n0 0\n2 2\n2 2", expectedOutput: "4", hidden: true },
      /* All three are the same single cell. */
      { input: "1 1\n.\n0 0\n0 0\n0 0", expectedOutput: "0", hidden: true },
      /* The stop is free but sealed off in its own region while the finish is
         reachable, so a program that only checks the finish prints a number. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0\n3 0\n1 3", expectedOutput: "-1", hidden: true },
      /* The mirror: the stop is reachable and the finish is not. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0\n1 3\n3 3", expectedOutput: "-1", hidden: true },
      /* The stop is a wall. A wave started from a wall cell without checking
         it walks out into the free cells around it and reports a distance. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0\n2 0\n1 3", expectedOutput: "-1", hidden: true },
      /* The stop lies ON the direct route, so the detour costs nothing: the
         answer is the plain distance, 4, and a program that always adds
         something for the visit gets it wrong. */
      { input: "1 5\n.....\n0 0\n0 2\n0 4", expectedOutput: "4", hidden: true },
      /* The start is a wall. */
      { input: "3 3\n#..\n...\n...\n0 0\n1 1\n2 2", expectedOutput: "-1", hidden: true },
    ],
  },
];
