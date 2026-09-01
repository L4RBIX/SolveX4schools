import type { LessonBlock } from "../../types";

/**
 * m7.l6 · Өз бетіңмен шығар / Реши сам — March's independent practice set.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * March's practice paragraph (p.9) names six families by hand: «картада қанша
 * арал бар», «берілген нүктеден аймақты бояу», «бір ұяшықтан екіншісіне жетуге
 * бола ма», «лабиринттегі ең қысқа жол», «ең үлкен аралдың өлшемі»,
 * «маршрутты қалпына келтіру». Every block below sits inside one of them, and
 * the month is «алғашқы танысу» — a first acquaintance — so the statements are
 * short and the maps small enough to draw on squared paper while thinking.
 * March also promises only about 26 tasks, the smallest month of the year, so
 * ten unscaffolded problems is a large share of it and none of them is long.
 *
 * ## The one decision that shaped every statement here
 *
 * The lessons got to the plain form of five of these families first, and a
 * practice set that restates a lesson task measures whether a learner
 * remembers the lesson, not whether they can solve. Concretely: `m7.l2.b8`
 * counts the islands, `m7.l2.b9` gives the size of the region round a named
 * cell, `m7.l2.b10` gives the size of the largest island, `m7.l3.b8` answers
 * yes/no reachability and `m7.l3.b9` gives the shortest-path length. Setting
 * any of those again here would be the same program under a second id — the
 * defect the first adversarial review found most often, in the form that is
 * hardest to see, because the two programs are in different files.
 *
 * So each block stays in its family and moves the question one step on, the
 * way October's practice set did (count → sum, word → list):
 *
 * | Family (p.9) | The lesson's question | The question here |
 * |---|---|---|
 * | how many islands | how many are there | how many reach the edge of the map (`m7.p3`) |
 * | paint the region from a point | how big is it | paint it and print the map back (`m7.p4`) |
 * | the largest island | how big is it | how many islands are that big (`m7.p5`) |
 * | can you get there | one finish, yes/no | two candidates, which ones (`m7.p6`) |
 * | the shortest path | to one named finish | to the nearest way out of the map (`m7.p7`) |
 *
 * `m7.p4` is the only one that is not a variation but the family's own words
 * read literally: «берілген нүктеден аймақты бояу» is *paint*, and nothing
 * else in March prints a map. `m7.p1` and `m7.p2` are the two rungs before any
 * traversal, `m7.p8` and `m7.p9` read the wave after it settles, and `m7.p10`
 * is the route family taken from the other side — `m7.l4` restores and prints
 * a path, so this one measures a route that is forced through a waypoint and
 * prints no path at all.
 *
 * ## Six decisions taken once, so no block below re-litigates them
 *
 * 1. **One input format, stated in full in every prompt, in both languages.**
 *    First line `n m`; then `n` lines of exactly `m` characters, `.` free and
 *    `#` wall; then, where the task needs them, the coordinates on **one**
 *    final line — which is the convention `m7.l2.b9` and `m7.l3.b8` already
 *    set, so a learner meets one input shape all month. Rows and columns are
 *    numbered from 0 and every prompt says so. `1 ≤ n ≤ 20` and `1 ≤ m ≤ 20`
 *    everywhere, so the largest map is 400 cells — well inside the 16 KiB the
 *    judge accepts on stdin, and shallow enough that a learner who reaches for
 *    recursion instead of the queue does not overflow the stack either.
 *
 * 2. **The map is a `vector<string>` and the queue is `std::queue`.** The map
 *    is read with `cin >> g[i]`, one row per line, which is `m7.l1`'s idiom;
 *    the queue is `queue<pair<int, int>>` with `q.push({r, c})` and the
 *    two-line take-out `auto [r, c] = q.front(); q.pop();` — `m7.l5`'s, and it
 *    is two lines because `pop()` returns nothing. Nothing in this file uses a
 *    construct the month has not already taught.
 *
 * 3. **`m7.p8` is not the brief's "how many cells are reachable from the
 *    start".** On a grid the cells reachable from a free cell ARE its region,
 *    so that statement is `m7.l2.b9` a third time. The rung is kept and the
 *    question moved on: how many cells lie within **k** moves. That needs the
 *    distance the wave carries, not just the fact of arriving, and it sets up
 *    `m7.p9`.
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
 *    wrong count is reachable from a mark set on exit, from diagonal
 *    neighbours, from a bounds test that is one too strict, or from a mis-read
 *    of the input format — four different misunderstandings landing on one
 *    number. The pipeline emitting `unattributed_failure` and asking the
 *    learner is the correct outcome.
 *
 * 6. **`m7.p4` is the only `exact` checker.** Its prompt states a layout — n
 *    lines of m characters — so `token`, which would accept the whole map on
 *    one line, would be a promise the grader does not keep. Every other block
 *    prints values whose arrangement nobody asked about, `m7.p9`'s two
 *    coordinates included, and stays on `token` as `m1.p4` does.
 *
 * ## The wrong programs these cases are built to fail
 *
 * Every block carries at least one hidden case chosen against a named
 * degenerate solution, and all of them were executed against these case sets;
 * every one fails at least one case. Across the ten: the visited mark set on
 * exit instead of on entry, which counts a cell twice and dies on any
 * two-by-two open block; a traversal that omits one of the four directions;
 * the start cell being a wall; an unreachable target; a 1×1 map; a map that is
 * entirely walls; a map that is entirely free; diagonal neighbours treated as
 * neighbours; straight-line distance substituted for a real shortest path; and
 * depth-first exploration returning the first route found rather than the
 * shortest.
 *
 * One class of wrong program is deliberately NOT in that list, and its absence
 * is a fact about C++ rather than a gap in the cases. In Python a missing
 * `r > 0` test does not crash: `g[r - 1]` with `r = 0` is the LAST row, so the
 * map wraps into a ring and prints a specific wrong number, which a case could
 * pin. In C++ reading out of range is **undefined behaviour** — it may print
 * rubbish, may crash, and may appear to work — so there is no expected output
 * to write down and no case that can honestly claim to catch it. The month
 * catches it where it is still a decision on the screen instead: `m7.l1.b5`,
 * `m7.l1.b6` and `m7.l1.b7` are all about that one test, and `m7.l1.b11` asks
 * the learner to say out loud what C++ does when it is missing.
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
       failure behind the other. Distinct from m7.l1.b9, which counts the free
       neighbours of ONE named cell, and from m7.l1.b10, which counts free
       cells that have a wall beside them; this one has no neighbour test in it
       at all. */
    id: "m7.p1",
    bank: {
      role: "extra_practice",
      why:
        "Reading n and m plus n rows in this format is written from nothing at m7.l1.b9, and the nested scan with the same test and counter is written from nothing at m7.l2.b8 — both earlier, both on every route. This is the union of the two with nothing added, and three of its cases are already m7.l2.b8's.",
    },
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
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    int total = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (row[j] == '.') {\n" +
      "                total = total + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << total;\n" +
      "    return 0;\n" +
      "}",
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
      /* Every free cell is in the LAST row: a loop written `i < n - 1` prints
         1, and a program that reads the map but only counts row 0 prints 0. */
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
       `debug.boundary` is the skill and this is what it looks like on a grid.
       It also sets up m7.p3 and m7.p7, which both ask about the edge again
       once a wave is involved. */
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
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int edge = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (g[i][j] == '.') {\n" +
      "                if (i == 0 || i == n - 1 || j == 0 || j == m - 1) {\n" +
      "                    edge = edge + 1;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << edge;\n" +
      "    return 0;\n" +
      "}",
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
         the top and bottom rows happens to be right here, which is why it is
         not alone in the set. */
      { input: "1 5\n.#.#.", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* Rung 3, and the first traversal. PDF p.9 family «картада қанша арал бар»
       — but m7.l2.b8 already asks for the count, so this asks which of them
       reach the edge. The wave now has to carry something with it: a flag
       raised by any cell of the island, not by the cell it started from. That
       is the smallest possible version of "the wave computes a property of the
       whole region", and it is why the answer cannot be assembled cell by cell
       the way m7.p2's could.
       The reference marks a cell by writing `#` into the map itself, which a
       `vector<string>` allows and which saves a second table; the mark still
       goes on at the push, which is m7.l5's rule. */
    id: "m7.p3",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "grid.cells", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Арал — бір-бірімен байланысқан бос ұяшықтардың тобы. " +
        "Екі ұяшық ортақ қабырғасы болса ғана көрші саналады: жоғары, төмен, солға, оңға. Тек бұрышы түйіскен ұяшықтар көрші емес. " +
        "Егер аралдың кемінде бір ұяшығы ең үстіңгі жолда, ең астыңғы жолда, ең сол жақ бағанда немесе ең оң жақ бағанда тұрса, ол арал картаның шетіне шығады деп саналады. Сондай аралдардың санын шығар. " +
        "Ондай арал болмаса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Остров — это группа свободных клеток, связанных друг с другом. " +
        "Соседними считаются только клетки с общей стороной: сверху, снизу, слева, справа. Клетки, соприкасающиеся лишь углом, соседями не считаются. " +
        "Выведи, сколько островов выходит на край карты. Остров выходит на край, если хотя бы одна его клетка стоит в самой верхней строке, в самой нижней строке, в самом левом столбце или в самом правом столбце. " +
        "Если таких островов нет, выведи 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    int coastal = 0;\n" +
      "    for (int sr = 0; sr < n; sr++) {\n" +
      "        for (int sc = 0; sc < m; sc++) {\n" +
      "            if (g[sr][sc] == '.') {\n" +
      "                g[sr][sc] = '#';\n" +
      "                queue<pair<int, int>> q;\n" +
      "                q.push({sr, sc});\n" +
      "                int touches = 0;\n" +
      "                while (!q.empty()) {\n" +
      "                    auto [r, c] = q.front();\n" +
      "                    q.pop();\n" +
      "                    if (r == 0 || r == n - 1 || c == 0 || c == m - 1) {\n" +
      "                        touches = 1;\n" +
      "                    }\n" +
      "                    for (int k = 0; k < 4; k++) {\n" +
      "                        int nr = r + dr[k];\n" +
      "                        int nc = c + dc[k];\n" +
      "                        if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                            if (g[nr][nc] == '.') {\n" +
      "                                g[nr][nc] = '#';\n" +
      "                                q.push({nr, nc});\n" +
      "                            }\n" +
      "                        }\n" +
      "                    }\n" +
      "                }\n" +
      "                if (touches == 1) {\n" +
      "                    coastal = coastal + 1;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << coastal;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The hook grid. Reaching the top-right cell needs an upward move, so this kills any
         traversal missing the up direction — which every earlier case in this block accepted. */
      { input: "2 3\n.#.\n...", expectedOutput: "1", hidden: true },
      /* Three islands of one cell each, two of them on the edge: a program
         that counts every island prints 3. */
      { input: "5 5\n.####\n#####\n##.##\n#####\n####.", expectedOutput: "2" },
      /* One island, entirely inland. The answer is 0 while the map is far from
         empty — the case for a program that assumes every island reaches out. */
      { input: "4 4\n####\n#..#\n#..#\n####", expectedOutput: "0", hidden: true },
      /* Four corner cells, each its own island, each on the edge. Also the
         case for a program that treats two cells meeting at a corner as one
         island: that reading fuses all four and prints 1. */
      { input: "3 3\n.#.\n###\n.#.", expectedOutput: "4", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* Entirely free: one island, which of course touches the edge. */
      { input: "3 3\n...\n...\n...", expectedOutput: "1", hidden: true },
      /* Entirely walls. */
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      /* The island reaches the edge at exactly one cell, (3,1), and the scan
         starts the wave at (1,1), which is inland. A program that tests the
         starting cell instead of carrying the flag through the wave prints 0. */
      { input: "4 4\n####\n#..#\n#..#\n#.##", expectedOutput: "1", hidden: true },
      /* Two cells touching only at a corner, both on the edge: eight-way
         neighbours merge them into one island and print 1. */
      { input: "2 2\n.#\n#.", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* Rung 4. PDF p.9 family «берілген нүктеден аймақты бояу», read literally:
       paint. m7.l2.b9 measures the region; this one shows it, which means the
       mark a learner has been setting to avoid revisiting a cell becomes the
       output itself — the same line of code doing both jobs at once, which is
       the clearest way to see what a visited mark actually is.
       The prompt states a layout, so the checker is `exact`; see decision 6.
       Printing a row is `cout << g[i]`, because a row of the map already IS a
       string — nothing has to be reassembled. */
    id: "m7.p4",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    checker: { kind: "exact" },
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда r мен c сандары беріледі — бір ұяшықтың координаталары; жол мен баған нөмірлері 0-ден басталады. " +
        "Аймақ — байланысқан бос ұяшықтардың тобы; ұяшықтар ортақ қабырғасы болғанда ғана көрші саналады, тек бұрышы түйіскендер емес. " +
        "Көрсетілген ұяшық жататын аймақтың әрбір ұяшығын `o` латын әрпіне ауыстыр да, картаны сол қалпында қайта шығар: n жол, әр жолда m таңба. Қалған таңбалар өзгермейді. " +
        "Егер көрсетілген ұяшықтың орнында қабырға тұрса, картаны еш өзгертпей шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны числа r и c — координаты одной клетки; нумерация строк и столбцов начинается с нуля. " +
        "Область — это группа связанных свободных клеток; соседними считаются только клетки с общей стороной, а не соприкасающиеся углом. " +
        "Замени каждую клетку области, которой принадлежит указанная клетка, на латинскую букву `o` и выведи карту обратно: n строк, по m символов в каждой. Остальные символы не меняются. " +
        "Если на месте указанной клетки стоит стена, выведи карту без изменений.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc;\n" +
      "    cin >> sr >> sc;\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    if (g[sr][sc] == '.') {\n" +
      "        g[sr][sc] = 'o';\n" +
      "        queue<pair<int, int>> q;\n" +
      "        q.push({sr, sc});\n" +
      "        while (!q.empty()) {\n" +
      "            auto [r, c] = q.front();\n" +
      "            q.pop();\n" +
      "            for (int k = 0; k < 4; k++) {\n" +
      "                int nr = r + dr[k];\n" +
      "                int nc = c + dc[k];\n" +
      "                if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                    if (g[nr][nc] == '.') {\n" +
      "                        g[nr][nc] = 'o';\n" +
      "                        q.push({nr, nc});\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << g[i] << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Two regions on the map and only the top-left one is painted, so
         painting every free cell is a visible failure. Printing the rows in
         the wrong order is too. */
      {
        input: "4 5\n..#..\n..#..\n#####\n.....\n0 0",
        expectedOutput: "oo#..\noo#..\n#####\n.....",
      },
      /* The named cell is a wall: the map comes back untouched, which is the
         case a program that starts the wave without looking fails. */
      {
        input: "4 5\n..#..\n..#..\n#####\n.....\n2 2",
        expectedOutput: "..#..\n..#..\n#####\n.....",
        hidden: true,
      },
      /* Entirely free: the whole map is one region. */
      { input: "3 3\n...\n...\n...\n1 1", expectedOutput: "ooo\nooo\nooo", hidden: true },
      { input: "1 1\n.\n0 0", expectedOutput: "o", hidden: true },
      { input: "1 1\n#\n0 0", expectedOutput: "#", hidden: true },
      /* The other free cell touches the named one only at a corner and must
         stay a dot: eight-way spreading paints it. */
      { input: "2 2\n.#\n#.\n0 0", expectedOutput: "o#\n#.", hidden: true },
      /* A snake that doubles back twice: nothing short of a real traversal
         reaches the last row from the first. */
      {
        input: "5 5\n.....\n####.\n.....\n.####\n.....\n0 0",
        expectedOutput: "ooooo\n####o\nooooo\no####\nooooo",
        hidden: true,
      },
      /* The named cell is alone in a region of one while a larger region sits
         below it untouched. */
      { input: "3 3\n.#.\n###\n...\n0 0", expectedOutput: "o#.\n###\n...", hidden: true },
    ],
  },
  {
    /* Rung 5. PDF p.9 family «ең үлкен аралдың өлшемі» — m7.l2.b10 owns the
       size, so this asks how many islands share it. That needs the sizes kept
       rather than folded away as they arrive, which is the first time this
       month a wave's results have to outlive the wave, and it turns a
       one-variable best-so-far into a maximum followed by a count. The
       one-pass shortcut with `>=` is the tempting wrong answer and it is
       killed on the visible sample. */
    id: "m7.p5",
    type: "write_code",
    skillRefs: ["graph.regions", "graph.bfs", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Арал — байланысқан бос ұяшықтардың тобы; ұяшықтар ортақ қабырғасы болғанда ғана көрші саналады, тек бұрышы түйіскендер емес. " +
        "Ең үлкен аралда неше ұяшық бар екенін тап та, дәл сондай өлшемдегі аралдардың санын шығар. " +
        "Мысалы, аралдардың өлшемдері 4, 5 және 5 болса, жауап 2. Картада бос ұяшық мүлде болмаса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "Остров — это группа связанных свободных клеток; соседними считаются только клетки с общей стороной, а не соприкасающиеся углом. " +
        "Найди, сколько клеток в самом большом острове, и выведи количество островов ровно такого размера. " +
        "Например, если размеры островов 4, 5 и 5, ответ 2. Если свободных клеток на карте нет совсем, выведи 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    vector<int> sizes;\n" +
      "    for (int sr = 0; sr < n; sr++) {\n" +
      "        for (int sc = 0; sc < m; sc++) {\n" +
      "            if (g[sr][sc] == '.') {\n" +
      "                g[sr][sc] = '#';\n" +
      "                queue<pair<int, int>> q;\n" +
      "                q.push({sr, sc});\n" +
      "                int size = 0;\n" +
      "                while (!q.empty()) {\n" +
      "                    auto [r, c] = q.front();\n" +
      "                    q.pop();\n" +
      "                    size = size + 1;\n" +
      "                    for (int k = 0; k < 4; k++) {\n" +
      "                        int nr = r + dr[k];\n" +
      "                        int nc = c + dc[k];\n" +
      "                        if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                            if (g[nr][nc] == '.') {\n" +
      "                                g[nr][nc] = '#';\n" +
      "                                q.push({nr, nc});\n" +
      "                            }\n" +
      "                        }\n" +
      "                    }\n" +
      "                }\n" +
      "                sizes.push_back(size);\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int best = 0;\n" +
      "    for (int i = 0; i < (int)sizes.size(); i++) {\n" +
      "        if (sizes[i] > best) {\n" +
      "            best = sizes[i];\n" +
      "        }\n" +
      "    }\n" +
      "    int same = 0;\n" +
      "    for (int i = 0; i < (int)sizes.size(); i++) {\n" +
      "        if (sizes[i] == best) {\n" +
      "            same = same + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << same;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Kills a traversal that never moves up: without it the region splits and the answer
         becomes 2. */
      { input: "6 6\n.#....\n....#.\n..##..\n###.##\n.##...\n..#..#", expectedOutput: "1", hidden: true },
      /* Three islands sized 4, 5 and 5. Printing the largest size gives 5,
         printing the number of islands gives 3, and the one-pass `>=` count
         gives 3 as well — all three wrong on the sample the learner can see. */
      { input: "5 5\n.#.#.\n.#.#.\n.#.#.\n.#.#.\n##.#.", expectedOutput: "2" },
      /* Every island is the same size, so the answer is every island. */
      { input: "3 3\n.#.\n###\n.#.", expectedOutput: "4", hidden: true },
      /* One clear winner, and it is found LAST. */
      { input: "3 5\n.#...\n.#...\n.#...", expectedOutput: "1", hidden: true },
      /* One clear winner, and it is found FIRST. */
      { input: "3 5\n...#.\n...#.\n...#.", expectedOutput: "1", hidden: true },
      /* Entirely walls: no island at all, and `best` must already be 0. */
      { input: "2 3\n###\n###", expectedOutput: "0", hidden: true },
      /* Entirely free: one island, so one island of the largest size. */
      { input: "3 3\n...\n...\n...", expectedOutput: "1", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      /* Sizes 1, 2, 3 in reading order: the `>=` one-pass count prints 3. */
      { input: "5 5\n.####\n#####\n..###\n#####\n...##", expectedOutput: "1", hidden: true },
      /* Sizes 3, 2, 1 — the same shapes met in the opposite order. */
      { input: "5 5\n...##\n#####\n..###\n#####\n.####", expectedOutput: "1", hidden: true },
      /* Two islands of four cells: a two-by-two block and a straight strip.
         Their true sizes are equal, so the answer is 2 — but a mark set when a
         cell leaves the queue instead of when it enters counts the block as
         five and the strip as four, and prints 1. Only a compact shape shows
         that bug; a strip alone hides it, which is why both are here. */
      { input: "5 5\n..###\n..###\n#####\n....#\n#####", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* Rung 6. PDF p.9 family «бір ұяшықтан екіншісіне жетуге бола ма».
       m7.l3.b8 asks it of one finish and answers yes/no; this asks it of two
       and answers with one of four words, which means the wave has to be run
       ONCE and read twice — a learner who reruns it per candidate gets the
       right answer and will notice the waste, which is m7.l5's whole subject.
       Four output tokens, all English, both prompts naming all four. */
    id: "m7.p6",
    type: "write_code",
    skillRefs: ["graph.bfs", "graph.regions", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда алты сан беріледі: бастау ұяшығының r мен c координаталары, бірінші тексерілетін ұяшықтың r мен c координаталары, содан кейін екінші тексерілетін ұяшықтың r мен c координаталары. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғарыға, төменге, солға немесе оңға; бұрыштап жүруге болмайды. " +
        "Бастаудан осы екі ұяшықтың қайсысына жетуге болатынын анықта да, дәл бір ағылшын сөзін шығар: екеуіне де жетсе `both`, тек біріншісіне жетсе `first`, тек екіншісіне жетсе `second`, ешқайсысына жетпесе `none`. " +
        "Бастау ұяшығының да, тексерілетін ұяшықтардың да орнында қабырға тұруы мүмкін; қабырғаға жету мүмкін емес. Тексерілетін ұяшық бастаудың өзі болса, оған жеткен болып саналады, және екі тексерілетін ұяшық бірдей болуы да мүмкін.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны шесть чисел: координаты r и c стартовой клетки, координаты r и c первой проверяемой клетки, затем координаты r и c второй проверяемой клетки. Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево или вправо; ходить по диагонали нельзя. " +
        "Определи, до каких из этих двух клеток можно добраться из старта, и выведи ровно одно английское слово: `both` — если до обеих, `first` — если только до первой, `second` — если только до второй, `none` — если ни до одной. " +
        "На месте стартовой клетки, как и на месте проверяемых, может стоять стена; до стены добраться нельзя. Если проверяемая клетка — это сам старт, считается, что до неё добрались; две проверяемые клетки тоже могут совпадать.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc, ar, ac, br, bc;\n" +
      "    cin >> sr >> sc >> ar >> ac >> br >> bc;\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    if (g[sr][sc] == '.') {\n" +
      "        g[sr][sc] = 'o';\n" +
      "        queue<pair<int, int>> q;\n" +
      "        q.push({sr, sc});\n" +
      "        while (!q.empty()) {\n" +
      "            auto [r, c] = q.front();\n" +
      "            q.pop();\n" +
      "            for (int k = 0; k < 4; k++) {\n" +
      "                int nr = r + dr[k];\n" +
      "                int nc = c + dc[k];\n" +
      "                if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                    if (g[nr][nc] == '.') {\n" +
      "                        g[nr][nc] = 'o';\n" +
      "                        q.push({nr, nc});\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int one = 0;\n" +
      "    int two = 0;\n" +
      "    if (g[ar][ac] == 'o') {\n" +
      "        one = 1;\n" +
      "    }\n" +
      "    if (g[br][bc] == 'o') {\n" +
      "        two = 1;\n" +
      "    }\n" +
      "    if (one == 1 && two == 1) {\n" +
      "        cout << \"both\";\n" +
      "    } else if (one == 1) {\n" +
      "        cout << \"first\";\n" +
      "    } else if (two == 1) {\n" +
      "        cout << \"second\";\n" +
      "    } else {\n" +
      "        cout << \"none\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The hook grid: (0,2) is reachable only by moving up, so a three-direction wave answers
         `second`. */
      { input: "2 3\n.#.\n...\n0 0 0 2 1 1", expectedOutput: "both", hidden: true },
      /* The map is two corridors either side of a wall column. Both candidates
         are free; only the first is on the start's side. A program that
         answers `both` whenever the two cells are free fails here, on the
         sample the learner can see. */
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 3 1 0 4", expectedOutput: "first" },
      /* The mirror, which is the case a program that only ever inspects the
         first candidate cannot pass. */
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 0 4 3 0", expectedOutput: "second", hidden: true },
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 3 1 1 0", expectedOutput: "both", hidden: true },
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 0 4 3 4", expectedOutput: "none", hidden: true },
      /* The start is a wall, and both candidates are free and would be
         reachable from anywhere else in their corridor. */
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 2 0 0 0 4", expectedOutput: "none", hidden: true },
      /* The first candidate is a wall, the second is one step away. */
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 0 2 1 1", expectedOutput: "second", hidden: true },
      /* One cell, and it is the start and both candidates at once. */
      { input: "1 1\n.\n0 0 0 0 0 0", expectedOutput: "both", hidden: true },
      /* The two candidates are the same cell. */
      { input: "4 5\n..#..\n..#..\n..#..\n..#..\n0 0 1 1 1 1", expectedOutput: "both", hidden: true },
      /* The first candidate touches the start only at a corner; the second IS
         the start. A diagonal step would answer `both`. */
      { input: "2 2\n.#\n#.\n0 0 1 1 0 0", expectedOutput: "second", hidden: true },
    ],
  },
  {
    /* Rung 7. PDF p.9 family «лабиринттегі ең қысқа жол» — the centre of the
       month. m7.l3.b9 measures the distance to one named finish, so this one
       has many finishes at once: get OUT of the map. Every cell on the frame
       is a target, and the answer is the nearest of them, which is what a wave
       is for and what a straight-line guess cannot do — the sample is a room
       whose only door is on the far side, one step from the top edge and five
       steps from the way out.
       `dist` starting at -1 does two jobs: it is the visited test and it is
       the "never reached" answer. */
    id: "m7.p7",
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда бастау ұяшығының r мен c координаталары беріледі; жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Картаның шетіне шығу үшін ең аз неше қадам керек екенін шығар. Ұяшық ең үстіңгі жолда, ең астыңғы жолда, ең сол жақ бағанда немесе ең оң жақ бағанда тұрса, ол шеткі ұяшық саналады. " +
        "Бастаудың өзі шеткі ұяшық болса, жауап 0. Бірде-бір шеткі бос ұяшыққа жету мүмкін болмаса немесе бастау ұяшығының орнында қабырға тұрса, -1 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны координаты r и c стартовой клетки; нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, за какое наименьшее число шагов можно выйти на край карты. Клетка считается краевой, если она в самой верхней строке, в самой нижней строке, в самом левом столбце или в самом правом столбце. " +
        "Если старт сам стоит на краю, ответ 0. Если ни до одной свободной краевой клетки не добраться или на месте стартовой клетки стоит стена, выведи -1.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc;\n" +
      "    cin >> sr >> sc;\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    if (g[sr][sc] == '.') {\n" +
      "        dist[sr][sc] = 0;\n" +
      "        queue<pair<int, int>> q;\n" +
      "        q.push({sr, sc});\n" +
      "        while (!q.empty()) {\n" +
      "            auto [r, c] = q.front();\n" +
      "            q.pop();\n" +
      "            for (int k = 0; k < 4; k++) {\n" +
      "                int nr = r + dr[k];\n" +
      "                int nc = c + dc[k];\n" +
      "                if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                    if (g[nr][nc] == '.' && dist[nr][nc] == -1) {\n" +
      "                        dist[nr][nc] = dist[r][c] + 1;\n" +
      "                        q.push({nr, nc});\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int out = -1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (dist[i][j] >= 0) {\n" +
      "                if (i == 0 || i == n - 1 || j == 0 || j == m - 1) {\n" +
      "                    if (out == -1 || dist[i][j] < out) {\n" +
      "                        out = dist[i][j];\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << out;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The exit above the start is reachable only upward; a three-direction wave answers -1. */
      { input: "4 3\n...\n#.#\n###\n###\n1 1", expectedOutput: "1", hidden: true },
      /* A room with one door. The start is one row below the top edge, so the
         straight-line distance to the frame is 1; the only free cell ON the
         frame is the door at the bottom, five steps away. Counting the cells
         stood on rather than the steps taken prints 6. */
      { input: "5 5\n#####\n#...#\n#.#.#\n#...#\n##.##\n1 2", expectedOutput: "5" },
      /* The start is already on the top row. */
      { input: "3 3\n...\n.#.\n...\n0 1", expectedOutput: "0", hidden: true },
      /* A sealed room: the region is large but no cell of it is on the frame. */
      { input: "5 5\n#####\n#...#\n#...#\n#...#\n#####\n2 2", expectedOutput: "-1", hidden: true },
      /* The start is a wall on a map that is otherwise wide open. */
      { input: "3 3\n#..\n...\n...\n0 0", expectedOutput: "-1", hidden: true },
      /* One cell, which is its own frame. */
      { input: "1 1\n.\n0 0", expectedOutput: "0", hidden: true },
      /* Entirely free: one step out from the middle. */
      { input: "3 3\n...\n...\n...\n1 1", expectedOutput: "1", hidden: true },
      /* A zig-zag corridor: six steps to the only way out, against a
         straight-line guess of one. */
      { input: "5 6\n######\n#....#\n####.#\n#....#\n####.#\n1 1", expectedOutput: "6", hidden: true },
      /* Four free cells sit on the frame at distances 1, 2, 2 and 3. The
         nearest is (1,0); the FIRST in reading order is (0,0), two steps away.
         A program that takes the first edge cell it meets in the scan rather
         than the smallest distance prints 2. */
      { input: "4 4\n.###\n....\n###.\n####\n1 1", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /* Rung 8. Not the brief's "how many cells are reachable" — see decision 3
       in the file comment; on a grid that question is m7.l2.b9 a third time.
       Here the wave has to be read AFTER it settles: the distance stops being
       a means to one cell's answer and becomes the thing every cell is judged
       on. The k boundary is the exercise, so `k = 0` and a k larger than any
       real distance are both in the set. */
    id: "m7.p8",
    type: "write_code",
    skillRefs: ["graph.bfs", "graph.shortest_path", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда үш сан беріледі: бастау ұяшығының r мен c координаталары және k саны (0 ≤ k ≤ 400). Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан ең көбі k қадам жасап жетуге болатын бос ұяшықтардың санын шығар. Бастаудың өзі де саналады — оған 0 қадам керек. " +
        "Бастау ұяшығының орнында қабырға тұрса, 0 шығар.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны три числа: координаты r и c стартовой клетки и число k (0 ≤ k ≤ 400). Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, сколько свободных клеток достижимо из старта не более чем за k шагов. Сам старт тоже считается — до него нужно 0 шагов. " +
        "Если на месте стартовой клетки стоит стена, выведи 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc, k;\n" +
      "    cin >> sr >> sc >> k;\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    if (g[sr][sc] == '.') {\n" +
      "        dist[sr][sc] = 0;\n" +
      "        queue<pair<int, int>> q;\n" +
      "        q.push({sr, sc});\n" +
      "        while (!q.empty()) {\n" +
      "            auto [r, c] = q.front();\n" +
      "            q.pop();\n" +
      "            for (int t = 0; t < 4; t++) {\n" +
      "                int nr = r + dr[t];\n" +
      "                int nc = c + dc[t];\n" +
      "                if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                    if (g[nr][nc] == '.' && dist[nr][nc] == -1) {\n" +
      "                        dist[nr][nc] = dist[r][c] + 1;\n" +
      "                        q.push({nr, nc});\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int near = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (dist[i][j] >= 0 && dist[i][j] <= k) {\n" +
      "                near = near + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << near;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Counts all five free cells only if the wave can move up; three directions reach four. */
      { input: "2 3\n.#.\n...\n0 0 100", expectedOutput: "5", hidden: true },
      /* Twelve cells are reachable in the end and only five are within two
         steps, so "count everything the wave touched" prints 12; `< k` where
         `<= k` was meant drops the second layer and prints 3. */
      { input: "3 5\n.....\n.###.\n.....\n0 0 2", expectedOutput: "5" },
      /* k = 0 — the boundary itself. The answer is the start alone. */
      { input: "3 5\n.....\n.###.\n.....\n0 0 0", expectedOutput: "1", hidden: true },
      /* The start is a wall, and k is large enough to reach everything if the
         wave were allowed to begin. */
      { input: "3 3\n#..\n...\n...\n0 0 5", expectedOutput: "0", hidden: true },
      /* k far beyond any real distance: the cap must not add cells that are
         walls or unreachable. Eight, not nine. */
      { input: "3 3\n...\n.#.\n...\n0 0 100", expectedOutput: "8", hidden: true },
      /* Walls stretch the real distances: six cells are within straight-line
         distance 3 of the start, only four are within three actual steps. */
      { input: "3 3\n...\n##.\n...\n0 0 3", expectedOutput: "4", hidden: true },
      /* A two-by-two open block: a mark set on exit counts a cell twice and
         prints 5. */
      { input: "2 2\n..\n..\n0 0 5", expectedOutput: "4", hidden: true },
      /* One cell and k = 0 together. */
      { input: "1 1\n.\n0 0 0", expectedOutput: "1", hidden: true },
      /* The start is free but boxed in; the far corner is free and would be a
         diagonal step away. */
      { input: "2 2\n.#\n#.\n0 0 10", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /* Rung 9, core and advanced. The first block in the set whose answer is a
       PLACE rather than a quantity, which is what makes the tie-break real: a
       maximum over cells has ties far more often than a maximum over a list of
       numbers, and the last cell the queue hands back is a perfectly good
       farthest cell that is usually the WRONG one to print. m7.l3.b9s shows a
       program that prints the largest DISTANCE; asking for the cell instead,
       with a stated rule for ties, is a different question and a harder one,
       and none of its hidden cases can be passed by reading that program off.
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
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc;\n" +
      "    cin >> sr >> sc;\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    dist[sr][sc] = 0;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && dist[nr][nc] == -1) {\n" +
      "                    dist[nr][nc] = dist[r][c] + 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int far = 0;\n" +
      "    int br = sr;\n" +
      "    int bc = sc;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (dist[i][j] > far) {\n" +
      "                far = dist[i][j];\n" +
      "                br = i;\n" +
      "                bc = j;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << br << \" \" << bc;\n" +
      "    return 0;\n" +
      "}",
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
       the month runs the wave twice from two different cells. m7.l4 owns
       restoring and printing the path; this owns measuring a route, and prints
       no path at all.
       Written with a helper it is a short program; written without one it is
       the same twenty lines twice, which is the argument the prompt makes as
       ADVICE — a checker cannot see a function, so the prompt says outright
       that the number is what gets graded. See decision 4 in the file comment.
       The helper needs the map, so `g`, `n` and `m` are declared before `main`,
       which is m7.l2's rule rather than a new one. */
    id: "m7.p10",
    bank: {
      role: "extra_practice",
      why:
        "The same problem as m7.l4.b9: a shortest route forced through a named cell, two waves from two starts, -1 when either leg fails. Every learner on this advanced route has already solved m7.l4.b9 from nothing. The only addition is a wall-cell guard, already forced by m7.p7 earlier in this same lesson.",
    },
    type: "write_code",
    skillRefs: ["graph.shortest_path", "graph.bfs", "func.define", "func.reuse"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — картаның жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — қабырға. " +
        "Соңғы жолда алты сан беріледі: бастау ұяшығының, аялдама ұяшығының және финиш ұяшығының r мен c координаталары, осы ретпен. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек көрші бос ұяшыққа жүруге болады: жоғары, төмен, сол, оң. " +
        "Бастаудан шығып, міндетті түрде аялдамаға соғып, содан кейін финишке жететін ең қысқа жолда неше қадам бар екенін шығар. Жол бір ұяшықтан бірнеше рет өтуі мүмкін. " +
        "Бастаудан аялдамаға немесе аялдамадан финишке жету мүмкін болмаса, -1 шығар; осы үш ұяшықтың біреуінің орнында қабырға тұрса, жауап та -1. " +
        "Кеңес: бір ұяшықтан барлық ұяшыққа дейінгі қашықтықты есептейтін функция жазып, оны екі рет шақырған ыңғайлы. Функцияға карта керек болғандықтан `g`, `n` және `m` айнымалылары `main`-нен бұрын тұрады. Бұл — талап емес, кеңес: жауап шыққан сан бойынша тексеріледі.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов карты. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — стена. " +
        "В последней строке даны шесть чисел: координаты r и c стартовой клетки, клетки-остановки и финишной клетки — именно в этом порядке. Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно перейти только в соседнюю свободную клетку: вверх, вниз, влево, вправо. " +
        "Выведи, сколько шагов в кратчайшем пути, который идёт из старта, обязательно заходит в клетку-остановку и только потом приходит на финиш. Путь может проходить через одну и ту же клетку несколько раз. " +
        "Если из старта не добраться до остановки или от остановки до финиша, выведи -1; если на месте одной из этих трёх клеток стоит стена, ответ тоже -1. " +
        "Совет: удобно написать функцию, которая считает расстояния от одной клетки до всех остальных, и вызвать её дважды. Функции нужна карта, поэтому `g`, `n` и `m` объявляются до `main`. Это совет, а не требование: ответ проверяется по выведенному числу.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int n, m;\n" +
      "vector<string> g;\n" +
      "int dr[4] = {-1, 1, 0, 0};\n" +
      "int dc[4] = {0, 0, -1, 1};\n" +
      "\n" +
      "vector<vector<int>> spread(int sr, int sc) {\n" +
      "    vector<vector<int>> d(n, vector<int>(m, -1));\n" +
      "    if (g[sr][sc] == '#') {\n" +
      "        return d;\n" +
      "    }\n" +
      "    d[sr][sc] = 0;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && d[nr][nc] == -1) {\n" +
      "                    d[nr][nc] = d[r][c] + 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    return d;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cin >> n >> m;\n" +
      "    g = vector<string>(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc, wr, wc, fr, fc;\n" +
      "    cin >> sr >> sc >> wr >> wc >> fr >> fc;\n" +
      "    vector<vector<int>> first = spread(sr, sc);\n" +
      "    vector<vector<int>> second = spread(wr, wc);\n" +
      "    int a = first[wr][wc];\n" +
      "    int b = second[fr][fc];\n" +
      "    if (a == -1 || b == -1) {\n" +
      "        cout << -1;\n" +
      "    } else {\n" +
      "        cout << a + b;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The route through (0,2) requires an upward step; without it there is no route and the
         answer becomes -1. */
      { input: "2 3\n.#.\n...\n0 0 0 2 1 0", expectedOutput: "7", hidden: true },
      /* The stop is in the opposite corner from the finish, so the detour
         costs 10 where the direct route costs 2. A submission that ignores the
         stop prints 2; one that measures both legs from the START rather than
         the second from the stop prints 6. Both fail in the editor. */
      { input: "3 5\n.....\n.###.\n.....\n0 0 0 4 2 0", expectedOutput: "10" },
      /* The stop is the start: the first leg is 0, not 1 and not skipped. */
      { input: "3 3\n...\n.#.\n...\n0 0 0 0 2 2", expectedOutput: "4", hidden: true },
      /* The stop is the finish: the second leg is 0. */
      { input: "3 3\n...\n.#.\n...\n0 0 2 2 2 2", expectedOutput: "4", hidden: true },
      /* All three are the same single cell. */
      { input: "1 1\n.\n0 0 0 0 0 0", expectedOutput: "0", hidden: true },
      /* The stop is free but sealed off in its own region while the finish is
         reachable, so a program that only checks the finish prints a number. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0 3 0 1 3", expectedOutput: "-1", hidden: true },
      /* The mirror: the stop is reachable and the finish is not. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0 1 3 3 3", expectedOutput: "-1", hidden: true },
      /* The stop is a wall. A wave started from a wall cell without checking
         it walks out into the free cells around it and reports a distance. */
      { input: "4 4\n....\n....\n####\n..#.\n0 0 2 0 1 3", expectedOutput: "-1", hidden: true },
      /* The stop lies ON the direct route, so the detour costs nothing: the
         answer is the plain distance, 4, and a program that always adds
         something for the visit gets it wrong. */
      { input: "1 5\n.....\n0 0 0 2 0 4", expectedOutput: "4", hidden: true },
      /* The start is a wall. */
      { input: "3 3\n#..\n...\n...\n0 0 1 1 2 2", expectedOutput: "-1", hidden: true },
    ],
  },
];
