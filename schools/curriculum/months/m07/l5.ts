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
 * ## The queue, and the C++ trap that comes with it
 *
 * This lesson is taught before `m7.l3`, so this is where `std::queue` arrives
 * and it is introduced here in full: `#include <queue>`, `queue<pair<int,int>>
 * q;`, `q.push({r, c})`, `q.front()`, `q.pop()`, `q.empty()`. The coordinates
 * travel as one `pair` and are taken apart with `auto [r, c] = q.front();`,
 * which is C++17 and works on both engines — it is taught as a recipe with the
 * two words named, not as a language feature.
 *
 * And the trap, which is the reason the queue is introduced in the lesson about
 * a cell processed twice rather than in a lesson about distances:
 *
 *     **`q.pop()` returns NOTHING.**
 *
 * It removes the front element and hands back no value. So the value has to be
 * read from `q.front()` FIRST and popped SECOND, and writing the two the other
 * way round — or trying to catch what `pop()` "returns" — is the most common
 * first-BFS bug there is. `b1` teaches it, and `b5` is a `find_bug` on exactly
 * that line: `auto [r, c] = q.pop();` does not compile, which is the honest and
 * bounded symptom. The other spelling of the same mistake, popping before
 * reading, is undefined behaviour once the queue empties, so it is named in
 * `b1` and never shipped as a program.
 *
 * ## Seven decisions, taken once, so no block re-litigates them
 *
 * 1. **Everything follows the month's own conventions**, because a learner
 *    reaching this card has already read `m7.l1` and `m7.l2`: the map is a
 *    `vector<string>` read with `cin >> g[i]`, `.` is free and `#` is a wall,
 *    the marks table is `vector<vector<int>> vis(n, vector<int>(m, 0))`, and the
 *    four neighbours come from `dr`/`dc`. Nothing here is a private dialect.
 *
 * 2. **`(int)q.size()` wherever a size is compared or printed**, because
 *    `size()` is unsigned and this is the month where a learner first meets it.
 *    `b2`'s trace records it under a name, so it is a value they compute rather
 *    than a cast they copy.
 *
 * 3. **Three ways a cell is processed twice or read wrongly, one card each, in
 *    the order a person meets them.** The mark set at the pop instead of the
 *    push (`b4`); the value taken from `pop()` instead of from `front()`
 *    (`b5`); the guard that checks the map boundary but not the mark (`b6`).
 *    `b8` then makes the learner apply the first and the missing start mark at
 *    once, to a program that is not visibly broken at all.
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
 * 5. **`b6`'s four guards are written as ONE merged condition, and three of the
 *    four contain three checks.** The correct guard for a grid traversal is not
 *    a secret — `m7.l2` writes it in the same merged form — so the card cannot
 *    be made hard by hiding it. It is made hard by option `c`, which checks the
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
 * `b4` declares `symptomInput`: its bug needs a whole map on stdin, and the
 * checker's fallback probe is a spread of single numbers — it would report «the
 * two programs behave identically». `b5` needs none in principle, because its
 * broken program does not compile at all, but declares one anyway so the block
 * carries the input its own prompt talks about.
 */

const P = 9;

export const M7_L5: LessonBlock[] = [
  {
    /*
     * The rule, the machine it runs on, and the price of getting it wrong.
     *
     * The queue is the one thing here the learner has not met in `m7.l1`–`l2`,
     * so it is the one thing spelled out in full — including the two lines that
     * take a cell out, and why they are two lines and not one. This lesson is
     * taught third, before `m7.l3`, so this really is the first queue the
     * learner meets and it cannot be left to a later card.
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
      kk: "Карта мен белгілер кестесі бұрынғыдай: `g[r][c]` — таңба, `.` бос ұяшық, `#` қабырға, ал `vis` — `vector<vector<int>> vis(n, vector<int>(m, 0));` деп құрылған нөлдер торы.\n\nЖаңасы — **кезек**. Оны қосу үшін `#include <queue>` және `#include <utility>` жазамыз, содан кейін `queue<pair<int, int>> q;` деп жариялаймыз: ішінде екі санның жұбы жататын кезек. Ұяшықты кезекке салу — `q.push({r, c});`. Кезекте әлі ұяшық бар ма деген сұрақ — `!q.empty()`. Ал кезектегі бірінші ұяшықты алу ЕКІ жолмен жазылады:\n\n`auto [r, c] = q.front();`\n`q.pop();`\n\nБіріншісі — кезектің басындағы жұпты алып, оны бірден `r` мен `c`-ға жайып береді (мұны есте сақтайтын дайын жазба деп ал). Екіншісі — сол ұяшықты кезектен өшіреді. **Реті маңызды: `q.pop()` ЕШТЕҢЕ қайтармайды.** Ол тек өшіреді. Сондықтан `auto [r, c] = q.pop();` деп жазсаң, бағдарлама компиляциядан өтпейді, ал алдымен `pop`, сосын `front` деп жазсаң — одан да жаман: кезек босаған сәтте бағдарлама анықталмаған әрекетке ұрынады. Әрқашан алдымен оқы, содан кейін өшір.\n\nКезектің ұзындығы `q.size()` арқылы алынады, бірақ ол таңбасыз сан қайтарады, сондықтан оны басқа сандармен салыстырғанда немесе шығарғанда `(int)q.size()` деп жазамыз.\n\nЕнді осы айдың басты ережесі. **Ұяшық кезекке САЛЫНҒАН сәтте белгіленуі керек, кезектен ШЫҚҚАН сәтте емес.** Себебі ұяшық кезекке түскеннен кейін өз кезегі келгенше сонда жатады, ал сол уақытта өңделген әрбір көрші оны «әлі белгіленбеген» деп көреді де, кезекке тағы бір рет қосады. Бастапқы ұяшық та осы ережеге бағынады: оны кезекке салған жолда бірден белгілеу керек, әйтпесе оны өзінің көршісі кері әкеледі.\n\nБелгі кеш қойылса, бағдарлама көбінесе дұрыс жауап береді — бірақ жұмысы еселеп артады. 3×3 бос алаңда цикл денесі 9 рет емес, 19 рет орындалады. Жауаптың дұрыс болуы қатені байқауды қиындатады, сондықтан оны өлшеу керек: цикл денесі неше рет орындалғанын санап, аймақтағы ұяшық санымен салыстыр. Дұрыс жазылған өтуде бұл екі сан тең болады.",
      ru: "Карта и таблица отметок прежние: `g[r][c]` — символ, `.` — свободная клетка, `#` — стена, а `vis` — сетка нулей, созданная как `vector<vector<int>> vis(n, vector<int>(m, 0));`.\n\nНовое здесь — **очередь**. Чтобы её подключить, пишем `#include <queue>` и `#include <utility>`, а потом объявляем `queue<pair<int, int>> q;`: очередь, внутри которой лежат пары из двух чисел. Положить клетку в очередь — `q.push({r, c});`. Спросить, осталось ли в очереди хоть что-то, — `!q.empty()`. А взять первую клетку из очереди записывается ДВУМЯ строками:\n\n`auto [r, c] = q.front();`\n`q.pop();`\n\nПервая берёт пару из начала очереди и сразу раскладывает её по `r` и `c` (прими эту запись как готовый рецепт). Вторая удаляет эту клетку из очереди. **Порядок важен: `q.pop()` НИЧЕГО не возвращает.** Он только удаляет. Поэтому запись `auto [r, c] = q.pop();` не пройдёт компиляцию, а если сначала написать `pop`, а потом `front` — будет ещё хуже: в момент, когда очередь опустеет, программа уйдёт в неопределённое поведение. Всегда сначала читай, потом удаляй.\n\nДлину очереди даёт `q.size()`, но она возвращает беззнаковое число, поэтому при сравнении с другими числами и при выводе мы пишем `(int)q.size()`.\n\nТеперь главное правило этого месяца. **Клетку нужно отмечать в тот момент, когда её КЛАДУТ в очередь, а не когда её оттуда БЕРУТ.** Ведь, попав в очередь, клетка ждёт там своего хода, и всё это время каждый обработанный сосед видит её как «ещё не отмеченную» и кладёт в очередь ещё раз. Стартовая клетка подчиняется тому же правилу: её надо отметить прямо в той строке, где её кладут в очередь, иначе её вернёт обратно её же сосед.\n\nЕсли отметка поставлена поздно, программа чаще всего выдаёт верный ответ — но работы делает в разы больше. На пустом поле 3×3 тело цикла выполняется не 9 раз, а 19. Верный ответ как раз и мешает заметить ошибку, поэтому её надо измерять: посчитай, сколько раз выполнилось тело цикла, и сравни с числом клеток в области. В правильном обходе эти два числа равны.",
    },
    code:
      "#include <iostream>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({0, 0});\n" +
      "    int taken = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        taken = taken + 1;\n" +
      "        if (r == 0 && c == 0) {\n" +
      "            q.push({1, 0});\n" +
      "            q.push({0, 1});\n" +
      "        }\n" +
      "    }\n" +
      "    cout << taken;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The trace comes before every repair card on purpose: the tool has to be
     * in hand before it is used on something broken.
     *
     * 2×2 is the smallest map on which this bug can appear at all — a cell is
     * queued twice only when two of its neighbours are processed before its own
     * turn comes, and that needs a cycle. Four cells, five entries into the
     * body; the learner writes (1, 1) on rows 4 AND 5 and that repetition IS
     * the discovery, exactly as in `m2.l9.b7`.
     *
     * `waiting` is `(int)q.size()` under a name, so the trace records how many
     * cells are still queued at the moment the current one has been taken out —
     * which is the column that makes the double entry visible before the
     * repetition does.
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
      kk: "Бұл бағдарлама 2×2 бос алаңды сол жақ жоғарғы ұяшықтан бастап толқынмен айналып өтеді, бірақ ұяшықты кезектен ШЫҚҚАНДА ғана белгілейді. Оны қағазда қадамдап орында: 22-жолға (ұяшық жаңа ғана белгіленген сәт) әр келген сайын `r`, `c`, `runs` және `waiting` мәндерін жаз. `waiting` — сол сәтте кезекте әлі неше ұяшық қалғаны. Соңғы жолға 34-жолдағы `runs` пен `pushed` мәндерін жаз да, өзіңе сұрақ қой: алаңда неше ұяшық бар еді?",
      ru: "Эта программа обходит волной пустое поле 2×2, начиная с левой верхней клетки, но отмечает клетку только тогда, когда БЕРЁТ её из очереди. Выполни её по шагам на бумаге: каждый раз при заходе на строку 22 (момент, когда клетка только что отмечена) записывай значения `r`, `c`, `runs` и `waiting`. `waiting` — сколько клеток осталось в очереди в этот момент. В последнюю строку запиши значения `runs` и `pushed` на строке 34 и ответь себе: а сколько клеток было на поле?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<string> g = {\"..\", \"..\"};\n" +
      "    vector<vector<int>> vis(2, vector<int>(2, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({0, 0});\n" +
      "    int runs = 0;\n" +
      "    int pushed = 1;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        int waiting = (int)q.size();\n" +
      "        runs = runs + 1;\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < 2 && nc >= 0 && nc < 2) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                    pushed = pushed + 1;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << runs << endl;\n" +
      "    cout << pushed << endl;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 22, vars: { r: "0", c: "0", runs: "1", waiting: "0" } },
      { line: 22, vars: { r: "1", c: "0", runs: "2", waiting: "1" } },
      { line: 22, vars: { r: "0", c: "1", runs: "3", waiting: "1" } },
      { line: 22, vars: { r: "1", c: "1", runs: "4", waiting: "1" } },
      { line: 22, vars: { r: "1", c: "1", runs: "5", waiting: "0" } },
      { line: 34, vars: { runs: "5", pushed: "5" } },
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
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<string> g = {\"...\", \"...\"};\n" +
      "    vector<vector<int>> vis(2, vector<int>(3, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({0, 0});\n" +
      "    int runs = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        runs = runs + 1;\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < 2 && nc >= 0 && nc < 3) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << runs;\n" +
      "    return 0;\n" +
      "}",
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
     * one answer.
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    vis[0][0] = 1;\n" +
      "    q.push({0, 0});\n" +
      "    int size = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        size = size + 1;\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << size;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 26,
    symptomInput: "3 4\n..#.\n..#.\n....",
    fixedCode:
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    vis[0][0] = 1;\n" +
      "    q.push({0, 0});\n" +
      "    int size = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        size = size + 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    vis[nr][nc] = 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << size;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "25": {
        failureClass: "blamed_the_counter_not_the_repeat",
        justification:
          "25-жол — `size = size + 1;` — әр ұяшық кезектен бір-ақ рет шыққанда мүлдем дұрыс жол. Оны таңдау оқушының белгіні емес, санауды түзетуге кіріскенін көрсетеді: сан үлкен шыққан соң қосуды азайтқысы келеді, ал сұрақ бір ұяшықтың кезекке қайдан екі рет түскенінде.",
      },
    },
  },
  {
    /*
     * RE-AUTHORED for C++17. The Python original's bug was a start cell that
     * was never marked — `vis[0][0] = 1` where `vis[sr][sc] = 1` was meant —
     * and that failure mode has not been dropped: `b8` is exactly the repair
     * that has to supply it, on a program that has neither the start mark nor
     * the mark at the push.
     *
     * What this card carries instead is the C++ trap that has no Python
     * counterpart and that every first BFS in this language meets:
     *
     *     auto [r, c] = q.pop();
     *
     * `pop()` removes the front element and returns NOTHING, so this line does
     * not compile. It is the honest and bounded symptom — the other spelling of
     * the same mistake, `q.pop()` followed by `q.front()`, is undefined
     * behaviour on the last cell and may not be shipped as a program.
     *
     * The rest of the program is correct and is the pattern the lesson teaches:
     * the start is marked where it is pushed, and every neighbour is marked
     * where it is pushed. So the repair is one line becoming two, in the right
     * order, and nothing else moves.
     *
     * No diagnosticMapping: a compiler message names one line, and a learner may
     * point at the `while`, at the push or at the declaration for reasons that
     * are not distinguishable from the answer alone.
     */
    id: "m7.l5.b5",
    type: "find_bug",
    skillRefs: ["graph.bfs", "graph.regions", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама берілген нүктеден бастап аймақты бояп, ондағы ұяшық санын шығаруы керек. Кіріс: бірінші жолда n мен m, келесі n жолда карта (`.` — бос, `#` — қабырға), соңғы жолда бастапқы ұяшықтың жол және баған нөмірі; бастапқы ұяшық әрқашан бос. Мысалы, мына кіріс үшін жауап 9 болуы керек еді:\n\n`4 4`\n`##..`\n`#..#`\n`..##`\n`...#`\n`3 0`\n\nБірақ бағдарлама тіпті іске қосылмайды: компилятор `q.pop()` мәнінен ештеңе алуға болмайды дейді. C++-те `pop()` кезектің басындағы элементті ӨШІРЕДІ және ешқандай мән қайтармайды — мәнді бұрын `q.front()` арқылы оқып алу керек. Қай жолда қате бар?",
      ru: "Программа должна закрасить область, начиная с заданной точки, и вывести число клеток в ней. Ввод: в первой строке n и m, в следующих n строках карта (`.` — свободно, `#` — стена), в последней строке номер строки и номер столбца стартовой клетки; стартовая клетка всегда свободна. Например, для этого ввода ответ должен был быть 9:\n\n`4 4`\n`##..`\n`#..#`\n`..##`\n`...#`\n`3 0`\n\nНо программа даже не запускается: компилятор говорит, что из `q.pop()` нельзя взять значение. В C++ `pop()` УДАЛЯЕТ первый элемент очереди и не возвращает ничего — значение нужно прочитать раньше, через `q.front()`. В какой строке ошибка?",
    },
    code:
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    vis[sr][sc] = 1;\n" +
      "    q.push({sr, sc});\n" +
      "    int size = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.pop();\n" +
      "        size = size + 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    vis[nr][nc] = 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << size;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 25,
    symptomInput: "4 4\n##..\n#..#\n..##\n...#\n3 0",
    fixedCode:
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    vis[sr][sc] = 1;\n" +
      "    q.push({sr, sc});\n" +
      "    int size = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        size = size + 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    vis[nr][nc] = 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << size;\n" +
      "    return 0;\n" +
      "}",
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
     * The hole is a `bool` the program then tests, rather than a gap in the
     * `if` itself: an `if` with nothing in its brackets is not C++ and would not
     * compile, and every snippet in this curriculum compiles. `bool` is glossed
     * in the prompt in one clause and is never asked of the learner elsewhere.
     */
    id: "m7.l5.b6",
    type: "multiple_choice",
    skillRefs: ["graph.bfs", "debug.boundary", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Төмендегі үзіндіде көрші ұяшық кезекке салынар алдында бір тексеруден өтуі керек. Тексерудің нәтижесі `canPush` айнымалысында сақталады (`bool` — тек «иә» немесе «жоқ» ұстайтын түр), ал қазір оның орнында `false` тұр. Тексеру үш нәрсені бірдей қамтуы тиіс: ұяшық картадан шықпасын, қабырға болмасын, әрі кезекке бұрын салынып қойылмаған болсын. Төрт нұсқаның қайсысын `false` орнына жазу керек?",
      ru: "В приведённом фрагменте соседняя клетка перед попаданием в очередь должна пройти проверку. Результат проверки хранится в переменной `canPush` (`bool` — тип, который держит только «да» или «нет»), а сейчас там стоит `false`. Проверка обязана охватывать сразу три вещи: клетка не выходит за пределы карты, она не стена и она ещё не была положена в очередь. Какой из четырёх вариантов нужно написать вместо `false`?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "#include <queue>\n" +
      "#include <utility>\n" +
      "using namespace std;\n" +
      "\n" +
      "int n, m;\n" +
      "vector<string> g;\n" +
      "vector<vector<int>> vis;\n" +
      "int dr[4] = {-1, 1, 0, 0};\n" +
      "int dc[4] = {0, 0, -1, 1};\n" +
      "queue<pair<int, int>> q;\n" +
      "\n" +
      "void step(int r, int c) {\n" +
      "    for (int k = 0; k < 4; k++) {\n" +
      "        int nr = r + dr[k];\n" +
      "        int nc = c + dc[k];\n" +
      "        bool canPush = false;\n" +
      "        if (canPush) {\n" +
      "            vis[nr][nc] = 1;\n" +
      "            q.push({nr, nc});\n" +
      "        }\n" +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    return 0;\n" +
      "}",
    options: [
      {
        id: "a",
        label: {
          kk: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.' && vis[nr][nc] == 0`",
          ru: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.' && vis[nr][nc] == 0`",
        },
      },
      {
        id: "b",
        label: {
          kk: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.'`",
          ru: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.'`",
        },
      },
      {
        id: "c",
        label: {
          kk: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.' && vis[r][c] == 0`",
          ru: "`nr >= 0 && nr < n && nc >= 0 && nc < m && g[nr][nc] == '.' && vis[r][c] == 0`",
        },
      },
      {
        id: "d",
        label: {
          kk: "`g[nr][nc] == '.' && vis[nr][nc] == 0`",
          ru: "`g[nr][nc] == '.' && vis[nr][nc] == 0`",
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
      kk: "Бұл бағдарлама картадағы аралдар санын шығарады: әлі белгіленбеген әрбір бос ұяшықтан жаңа толқын жіберіп, неше рет жіберуге тура келгенін санайды. Барлығы дайын, тек көрші ұяшықты тексеретін төрт орын бос қалған. Оларды толтыр: екеуі ұяшықтың картадан шықпағанын, біреуі оның қабырға емес екенін, біреуі оның әлі кезекке салынбағанын тексеруі керек (`.` — бос ұяшық, `#` — қабырға; бір таңба бір тырнақшамен жазылады).",
      ru: "Эта программа выводит количество островов на карте: из каждой ещё не отмеченной свободной клетки она запускает новую волну и считает, сколько раз пришлось её запускать. Готово всё, кроме четырёх мест в проверке соседней клетки. Заполни их: два места должны проверять, что клетка не вышла за пределы карты, одно — что это не стена, и одно — что она ещё не попала в очередь (`.` — свободная клетка, `#` — стена; одиночный символ пишется в одинарных кавычках).",
    },
    template:
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    int islands = 0;\n" +
      "    for (int sr = 0; sr < n; sr++) {\n" +
      "        for (int sc = 0; sc < m; sc++) {\n" +
      "            if (g[sr][sc] == '.' && vis[sr][sc] == 0) {\n" +
      "                islands = islands + 1;\n" +
      "                vis[sr][sc] = 1;\n" +
      "                queue<pair<int, int>> q;\n" +
      "                q.push({sr, sc});\n" +
      "                while (!q.empty()) {\n" +
      "                    auto [r, c] = q.front();\n" +
      "                    q.pop();\n" +
      "                    for (int k = 0; k < 4; k++) {\n" +
      "                        int nr = r + dr[k];\n" +
      "                        int nc = c + dc[k];\n" +
      "                        if (nr >= 0 && ___ && nc >= 0 && ___) {\n" +
      "                            if (___ && ___) {\n" +
      "                                vis[nr][nc] = 1;\n" +
      "                                q.push({nr, nc});\n" +
      "                            }\n" +
      "                        }\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << islands;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "nr < n", alternatives: ["nr <= n - 1", "n > nr"] },
      { id: "f2", answer: "nc < m", alternatives: ["nc <= m - 1", "m > nc"] },
      { id: "f3", answer: "g[nr][nc] == '.'", alternatives: ["g[nr][nc] != '#'", "'.' == g[nr][nc]"] },
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
     * Two edits are needed and only both together pass: the mark moves to the
     * push, AND the starting cell gets its own mark on the line where it is
     * pushed. That second half is the failure mode the Python `b5` used to
     * carry on its own.
     *
     * The wrong repairs, and the case that kills each:
     *   - mark the start and leave the rest at the pop → the queue is still
     *     bloated; the visible case demands 10 and gets 21;
     *   - move the mark to the push and forget the start → every case with a
     *     reachable neighbour is one too big (visible case: 11), and `1 1 / .`
     *     goes further — the target IS the start, so it answers `no`;
     *   - count the free cells on the map instead of the pushes → `3 3 / ..# /
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
      kk: "Бұл бағдарлама сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа жетуге бола ма деген сұраққа жауап беріп, екі жол шығарады: біріншісінде `yes` немесе `no` (ағылшын белгілері), екіншісінде кезекке барлығы неше ұяшық түскені (`pushed`). Жауабы дұрыс, бірақ жұмысы артық: белгі ұяшық кезектен шыққанда қойылады. Оны түзет — `yes`/`no` жауабы сол күйінде қалып, `pushed` саны жетуге болатын ұяшықтардың нақ санына тең болсын. Бастапқы ұяшықты да ұмытпа. Бұрыштағы екі ұяшық әрқашан бос.",
      ru: "Эта программа отвечает на вопрос, можно ли добраться из левой верхней клетки в правую нижнюю, и печатает две строки: в первой `yes` или `no` (английские слова), во второй — сколько всего клеток попало в очередь (`pushed`). Ответ она даёт верный, но работы делает лишнюю: отметка ставится в тот момент, когда клетку берут из очереди. Исправь это так, чтобы ответ `yes`/`no` остался прежним, а `pushed` стало ровно числом достижимых клеток. Не забудь и про стартовую клетку. Обе угловые клетки всегда свободны.",
    },
    code:
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({0, 0});\n" +
      "    int pushed = 1;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                    pushed = pushed + 1;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    if (vis[n - 1][m - 1] == 1) {\n" +
      "        cout << \"yes\" << endl;\n" +
      "    } else {\n" +
      "        cout << \"no\" << endl;\n" +
      "    }\n" +
      "    cout << pushed << endl;\n" +
      "    return 0;\n" +
      "}",
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    vis[0][0] = 1;\n" +
      "    q.push({0, 0});\n" +
      "    int pushed = 1;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    vis[nr][nc] = 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                    pushed = pushed + 1;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    if (vis[n - 1][m - 1] == 1) {\n" +
      "        cout << \"yes\" << endl;\n" +
      "    } else {\n" +
      "        cout << \"no\" << endl;\n" +
      "    }\n" +
      "    cout << pushed << endl;\n" +
      "    return 0;\n" +
      "}",
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    int runs = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        runs = runs + 1;\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << runs;\n" +
      "    return 0;\n" +
      "}",
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
      "    vector<vector<int>> vis(n, vector<int>(m, 0));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    int runs = 0;\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        runs = runs + 1;\n" +
      "        vis[r][c] = 1;\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && vis[nr][nc] == 0) {\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << runs;\n" +
      "    return 0;\n" +
      "}",
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
        kk: "Байқаудың жолы — өлшеу: цикл денесі неше рет орындалғанын (немесе кезекке неше ұяшық салынғанын) санап, аймақтағы ұяшық санымен салыстыру керек. Дұрыс өтуде бұл екі сан тең, тең болмаса — ұяшықтар қайта өңделіп жатыр.",
        ru: "Способ заметить — измерить: посчитать, сколько раз выполнилось тело цикла (или сколько клеток положили в очередь), и сравнить с числом клеток в области. В правильном обходе эти числа равны, а если они не равны — клетки обрабатываются повторно.",
      },
      {
        kk: "Тексеретін карта да маңызды: ені бір ұяшық болатын дәлізде әр ұяшықты бір ғана көрші ашады, сондықтан қате мүлде көрінбейді. Тексеру үшін ішінде бос ұяшықтардан құралған 2×2 шаршысы бар карта немесе кең бос алаң керек; үлкен картада бұл қате уақыт шегінен шығып кетуге әкеледі.",
        ru: "Важна и карта для проверки: в коридоре шириной в одну клетку каждую клетку открывает ровно один сосед, поэтому ошибка не проявляется совсем. Нужна карта с квадратом 2×2 из свободных клеток или широкое открытое поле; на большой карте такая ошибка приводит к превышению лимита времени.",
      },
    ],
  },
];
