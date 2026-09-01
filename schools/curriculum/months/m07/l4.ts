import type { LessonBlock } from "../../types";

/**
 * m7.l4 · «Маршрутты қалпына келтіру» / «Восстановление маршрута» — 10 minutes.
 *
 * Skills: `graph.path_restore`, `graph.bfs`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * March's practice paragraph names six families and this lesson owns the last
 * one by hand: «…лабиринттегі ең қысқа жол, ең үлкен аралдың өлшемі,
 * **маршрутты қалпына келтіру**». `m7.l3` produced a number — how far. This
 * lesson produces the route itself, which is a different object and a
 * different piece of bookkeeping.
 *
 * The month's «Айлық сынақ» sentence — «табылған жолдың неге шынымен ең қысқа
 * екенін түсіндіреді» — is why `b10` exists and why it is compulsory for the
 * advanced track (p.6: «шешімді жазбаша қорғау міндетті»).
 *
 * The opening clause still binds: «Тақырып жалпы теориядан емес, ұяшықты
 * картадан басталады». There is no `parent` array here and no word «граф»;
 * there are two grids of numbers that say which cell the wave came in from.
 *
 * ## Six decisions taken once, so no block re-litigates them
 *
 * 1. **The queue is `std::queue` and the recipe is `m7.l5`'s.** `q.push({r,
 *    c})`, then `auto [r, c] = q.front();` and `q.pop();` in that order, because
 *    `pop()` returns nothing. Introduced two lessons ago, used here unchanged,
 *    never re-explained.
 *
 * 2. **`fromr` doubles as the visited mark, and that forces the start's
 *    self-record.** Keeping one grid instead of two is not a saving, it is the
 *    argument: a record that IS the mark cannot be rewritten by a later, longer
 *    route, which is exactly the defect `b6` shows on a program that keeps them
 *    apart. The price is that the start needs a mark too, and the only honest
 *    thing to write there is the start itself — which then doubles again as the
 *    "stop here" signal for the walk back. Three jobs, one line, stated in `b1`.
 *
 * 3. **Two ways to reverse, both named, and different cards use different
 *    ones.** October's «тізімді кері аудару» becomes
 *    `for (int i = (int)pr.size() - 1; i >= 0; i--)`, and December's `sort(v.
 *    begin(), v.end())` has a sibling `reverse(v.begin(), v.end())` from the
 *    same `<algorithm>`. `b1` names both — `reverse` appears in this lesson's
 *    code and nothing earlier introduced it, so it gets its sentence. The worked
 *    example prints with the backwards index loop and `b5`'s repair uses
 *    `reverse`, deliberately: a learner who only pattern-matches the worked
 *    example does not get `b5` for free.
 *
 * 4. **`(int)` in front of every `size()`.** `pr.size()` is unsigned, so
 *    `pr.size() - 1` on an empty vector is not −1 but a colossal positive
 *    number, and a countdown loop written without the cast walks off the end of
 *    the vector. `b1` says it in one sentence and every loop below obeys it.
 *
 * 5. **The tie-break is stated, and it is stated in the visible cases too.**
 *    A maze usually has several shortest routes, so «print the shortest route»
 *    is not a well-posed question until the choice between them is pinned down.
 *    The rule is the lesson's own method — neighbours in the order
 *    `dr = {-1, 1, 0, 0}`, `dc = {0, 0, -1, 1}` (up, down, left, right), record
 *    written only at first arrival — and `b8`'s FIRST VISIBLE case is a 3×3 open
 *    room where that rule decides the answer. A learner who walked the
 *    neighbours right-before-down fails a case whose expected output is on the
 *    screen, not a hidden one.
 *
 * 6. **The bug p.9 implies could not be shipped as a runnable path walk, and
 *    was shipped as the record instead.** Writing the from-record on every
 *    visit instead of only the first does not merely give a longer route: in a
 *    grid, any two adjacent free cells end up pointing at each other, so the
 *    walk back cycles forever. A find_bug whose symptom is a hang teaches
 *    nothing and times out the runner. So `b6` keeps the defect exactly as it
 *    is — the record is rewritten on every visit — and observes it where it can
 *    be seen without walking: the program prints the distance to the finish and
 *    the cell recorded as the finish's predecessor. The distance is right in
 *    both versions; only the record differs, and the broken one names a cell
 *    farther from the start than the finish itself. Executed both ways before
 *    it was written down.
 *
 * ## What the C++ migration changed
 *
 * Only the spellings, and they are all listed above: `vector<vector<int>>` for
 * the two record grids, `std::queue` for the queue, `reverse` and the cast in
 * front of `size()`. Neither find_bug had to be re-authored — `b5`'s missing
 * reversal and `b6`'s rewritten record are both bounded, visible wrong answers
 * in C++ exactly as they were in Python, and neither program reads out of range
 * or fails to terminate. The one thing that did NOT survive is silent: the
 * Python original could rely on `pr[::-1]` and on `len(pr) - 1` being an honest
 * −1 on an empty list. Decision 4 is that difference written down.
 *
 * ## The structural requirement no checker can see
 *
 * `b9` wants the wave run twice, from the start and from the finish, and the
 * obvious way to write that is one function called twice. Output comparison
 * cannot see a function. Of the three honest options in the authoring contract
 * this lesson takes **option 2**: the prompt offers the helper as advice — «Бұл
 * кеңес, шарт емес» / «Это совет, а не требование» — and grades the number that
 * comes out. Option 1 does not apply (a copy-pasted second wave produces the
 * same answer, and pretending otherwise would be a lie), and option 3 is
 * already spent: `b10` is the written defence the advanced track owes, and
 * loading a second structural question onto it would make it two tasks.
 *
 * ## Programs, and why none of them is another one's answer
 *
 * Nine programs appear here and no two are byte-identical; the check was run as
 * a script, not by eye. The three that walk back over ready-made records
 * (`b2`, `b3`, `b4`) use three different mazes and three different shapes —
 * print-as-you-go, collect-and-reverse, collect-and-count — so none of them is
 * a template for the next. Neither find_bug repairs the program `b8` asks for:
 * `b5` works on records that are already filled in and never runs a wave, and
 * `b6` never walks a path. The one deliberate pair is `b8` and its support twin
 * `b8s`, which are the same problem on two routes and are never seen by the
 * same learner.
 */
export const M7_L4: LessonBlock[] = [
  {
    id: "m7.l4.b1",
    type: "concept",
    skillRefs: ["graph.path_restore", "graph.bfs"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Қайдан келдім?",
      ru: "Откуда я сюда пришёл?",
    },
    /* Everything the lesson leans on later is here and nowhere else: the two
       record grids, why the start points at itself, both ways of reversing —
       including `reverse`, which no earlier lesson introduces and which `b5`
       uses — and the cast in front of `size()`. */
    body: {
      kk:
        "Өткен сабақта толқын әр ұяшыққа дейінгі қашықтықты берді. Ол — сан. Ал маршруттың өзі, яғни қай ұяшықтардан өту керегі, жоғалып кетті. Оны сақтап қалу үшін толқынға тағы екі жол қосамыз.\n\n" +
        "Толқын жаңа ұяшыққа кірген сәтте біз оны қай ұяшықтан тапқанымызды жазып қоямыз. Жол нөмірі `fromr` торына, баған нөмірі `fromc` торына жазылады. Екеуі де өткен сабақтағы `dist` сияқты жасалады: `vector<vector<int>> fromr(n, vector<int>(m, -1));`. Мұндағы -1 — «бұл ұяшыққа әлі жеткен жоқпыз» дегені. Сондықтан `fromr` бір мезгілде «қаралды» белгісінің де қызметін атқарады: жазба бар болса, ұяшық қаралған. Бір нәрсенің екі жұмыс атқаруы — үнемдеу емес, дәлел: жазба мен белгі бір нәрсе болса, кейінірек келген ұзағырақ жол жазбаны қайта жаза алмайды.\n\n" +
        "Ал старт ұяшығы ше? Оған да белгі керек, әйтпесе толқын оны кейін «жаңа ұяшық» деп санап қалады. Оған жазуға болатын жалғыз адал мән — өзі: `fromr[sr][sc] = sr;`, `fromc[sr][sc] = sc;`. Дәл осы өзіне сілтейтін жазба артқа жүргенде «жеттік, тоқта» деген белгі болады.\n\n" +
        "Кезектің өзі жаңа емес: `queue<pair<int, int>> q;`, `q.push({r, c});`, ал алу — екі жол, `auto [r, c] = q.front();` содан кейін `q.pop();`, себебі `pop()` ештеңе қайтармайды.\n\n" +
        "Фиништен бастап жазбалар бойынша жүрсек, старт ұяшығына жетеміз. Ұяшықтарды `vector<int> pr;` пен `vector<int> pc;` тізімдеріне `push_back` арқылы жинаймыз. Бірақ жиналған тізім КЕРІ ретте болады: басында финиш, соңында старт. Сондықтан оны аудару керек, ал оның екі жолы бар. Біріншісі — соңғы индекстен 0-ге дейін кері жүретін цикл: `for (int i = (int)pr.size() - 1; i >= 0; i--)`. Екіншісі — `<algorithm>` ішіндегі `reverse(pr.begin(), pr.end());`: желтоқсанда `sort(v.begin(), v.end())` көрген едің, `reverse` дәл солай жазылады, тек реттемейді, ретті аударады. Екеуі де жарайды.\n\n" +
        "Бір ескерту: `pr.size()` таңбасыз сан қайтарады, сондықтан оның алдында `(int)` тұрады. Онсыз бос тізімде `pr.size() - 1` теріс сан емес, өте үлкен оң сан болып шығады да, цикл тізімнен шығып кетеді.",
      ru:
        "На прошлом уроке волна дала расстояние до каждой клетки. Это число. А сам маршрут — то есть через какие клетки надо идти — потерялся. Чтобы его сохранить, добавим к волне ещё две строки.\n\n" +
        "В момент, когда волна входит в новую клетку, мы записываем, из какой клетки мы её нашли. Номер строки идёт в таблицу `fromr`, номер столбца — в таблицу `fromc`. Обе делаются так же, как `dist` на прошлом уроке: `vector<vector<int>> fromr(n, vector<int>(m, -1));`. Здесь -1 означает «в эту клетку мы ещё не пришли». Поэтому `fromr` заодно работает и отметкой «посещено»: есть запись — значит, клетка уже пройдена. То, что одна вещь делает две работы, — это не экономия, а довод: если запись и отметка — одно и то же, то более длинный путь, пришедший позже, не сможет переписать запись.\n\n" +
        "А клетка старта? Ей отметка тоже нужна, иначе волна потом сочтёт её новой клеткой. Единственное честное значение, которое туда можно записать, — она сама: `fromr[sr][sc] = sr;`, `fromc[sr][sc] = sc;`. Именно эта ссылка на саму себя и служит сигналом «дошли, стоп», когда мы идём назад.\n\n" +
        "Сама очередь не новая: `queue<pair<int, int>> q;`, `q.push({r, c});`, а достать — две строки, `auto [r, c] = q.front();` и затем `q.pop();`, потому что `pop()` ничего не возвращает.\n\n" +
        "Если идти по записям от финиша, мы попадём в клетку старта. Клетки собираем в списки `vector<int> pr;` и `vector<int> pc;` через `push_back`. Но собранный список получится в ОБРАТНОМ порядке: сначала финиш, в конце старт. Значит, его надо развернуть, и способов два. Первый — цикл от последнего индекса до 0: `for (int i = (int)pr.size() - 1; i >= 0; i--)`. Второй — `reverse(pr.begin(), pr.end());` из `<algorithm>`: в декабре был `sort(v.begin(), v.end())`, а `reverse` пишется точно так же, только не сортирует, а переворачивает порядок. Годятся оба.\n\n" +
        "Одно предупреждение: `pr.size()` возвращает беззнаковое число, поэтому перед ним стоит `(int)`. Без этого на пустом списке `pr.size() - 1` окажется не отрицательным числом, а огромным положительным, и цикл уйдёт за пределы списка.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n = 2;\n" +
      "    int m = 3;\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
      "    int sr = 1;\n" +
      "    int sc = 0;\n" +
      "    fromr[sr][sc] = sr;\n" +
      "    fromc[sr][sc] = sc;\n" +
      "    fromr[0][0] = sr;\n" +
      "    fromc[0][0] = sc;\n" +
      "    cout << fromr[0][0] << \" \" << fromc[0][0] << endl;\n" +
      "    cout << fromr[1][2] << \" \" << fromc[1][2] << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m7.l4.b2",
    type: "worked_example",
    skillRefs: ["graph.path_restore", "graph.bfs", "graph.shortest_path"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Толық талданған мысал: 4×4 лабиринттегі маршрут",
      ru: "Разобранный пример: маршрут в лабиринте 4×4",
    },
    /* The maze is chosen because it has exactly TWO shortest routes of six
       moves — down the left column, or along the top — so the last step is not
       decoration: it is the only place in the lesson where the tie-break is
       shown deciding something, and `b8` then asks the learner to obey it. */
    problem: {
      kk:
        "4×4 лабиринт берілген (`.` — бос, `#` — қабырға):\n\n```\n....\n.##.\n.#..\n....\n```\n\n" +
        "Старт — (0, 0), финиш — (3, 3). Толқын өткен сабақтағыдай жүріп өтті және `fromr` мен `fromc` торларын толтырып кетті. Маршруттың өзін шығару керек: әр жолда бір ұяшықтың `r c` координаттары, старттан бастап финишпен қоса.",
      ru:
        "Дан лабиринт 4×4 (`.` — свободно, `#` — стена):\n\n```\n....\n.##.\n.#..\n....\n```\n\n" +
        "Старт — (0, 0), финиш — (3, 3). Волна прошла так же, как на прошлом уроке, и заполнила таблицы `fromr` и `fromc`. Нужно вывести сам маршрут: в каждой строке координаты `r c` одной клетки, от старта до финиша включительно.",
    },
    steps: [
      {
        kk:
          "Толқын қалдырған екі тор мынадай (қабырғалар мен жетпеген ұяшықтарда -1 тұр):\n\n```\nfromr            fromc\n0  0  0  0       0  0  1  2\n0 -1 -1  0       0 -1 -1  3\n1 -1  3  1       0 -1  2  3\n2  3  3  3       0  0  1  2\n```\n\n" +
          "Оқылуы: `fromr[2][2] = 3` және `fromc[2][2] = 2` дегеніміз — (2, 2) ұяшығына толқын (3, 2) ұяшығынан кірген. Жазба әрқашан көрші ұяшықты көрсетеді: бұрыштап жүрмейміз, сондықтан жол нөмірі де, баған нөмірі де бірден артық өзгере алмайды.",
        ru:
          "Вот две таблицы, которые оставила волна (в стенах и в непройденных клетках стоит -1):\n\n```\nfromr            fromc\n0  0  0  0       0  0  1  2\n0 -1 -1  0       0 -1 -1  3\n1 -1  3  1       0 -1  2  3\n2  3  3  3       0  0  1  2\n```\n\n" +
          "Читается так: `fromr[2][2] = 3` и `fromc[2][2] = 2` означают, что в клетку (2, 2) волна вошла из клетки (3, 2). Запись всегда указывает на соседнюю клетку: по диагонали мы не ходим, поэтому ни номер строки, ни номер столбца не могут измениться больше чем на единицу.",
      },
      {
        kk: "Фиништен бастаймыз: (3, 3). Оның жазбасы `fromr[3][3] = 3`, `fromc[3][3] = 2`, яғни толқын оған (3, 2) ұяшығынан кірген. Демек, маршрутта (3, 3)-тің алдында (3, 2) тұр.",
        ru: "Начинаем с финиша: (3, 3). Его запись — `fromr[3][3] = 3`, `fromc[3][3] = 2`, то есть волна вошла в него из клетки (3, 2). Значит, в маршруте перед (3, 3) стоит (3, 2).",
      },
      {
        kk: "Дәл солай әрі қарай: (3, 2) → (3, 1) → (3, 0) → (2, 0) → (1, 0) → (0, 0). Ал (0, 0)-дің жазбасы — өзі. Бұл «старт» деген белгі, сондықтан тоқтаймыз.",
        ru: "Дальше так же: (3, 2) → (3, 1) → (3, 0) → (2, 0) → (1, 0) → (0, 0). А запись клетки (0, 0) — она сама. Это признак старта, поэтому останавливаемся.",
      },
      {
        kk: "Жиналған тізім: 3 3, 3 2, 3 1, 3 0, 2 0, 1 0, 0 0. Бұл — дұрыс маршрут, бірақ фиништен старта қарай. Оны кері шығару керек: соңғы индекстен 0-ге дейін жүретін цикл — `for (int i = (int)pr.size() - 1; i >= 0; i--)`.",
        ru: "Собранный список: 3 3, 3 2, 3 1, 3 0, 2 0, 1 0, 0 0. Это верный маршрут, но от финиша к старту. Выводить его надо в обратную сторону: цикл от последнего индекса до 0 — `for (int i = (int)pr.size() - 1; i >= 0; i--)`.",
      },
      {
        kk:
          "Соңғы байқау. Мұнда ең қысқа маршрут біреу емес: сол жақ бағанмен төмен түсіп, төменгі жолмен оңға жүру де 6 қадам, жоғарғы жолмен оңға жүріп, оң жақ бағанмен төмен түсу де 6 қадам. Толқын бірінші нұсқаны таңдады, себебі көршілер `dr = {-1, 1, 0, 0}`, `dc = {0, 0, -1, 1}` ретімен қаралады: «төмен» «оңнан» бұрын тұр, сондықтан (3, 0) кезектен (0, 3)-тен ерте шықты. " +
          "Көршілердің ретін өзгертсең, маршрут та өзгереді — ол да ең қысқа болады, бірақ басқа болады.",
        ru:
          "Последнее наблюдение. Кратчайший маршрут здесь не один: спуститься по левому столбцу и пойти вправо по нижней строке — это 6 шагов, и пойти вправо по верхней строке, а потом вниз по правому столбцу — тоже 6 шагов. Волна выбрала первый вариант, потому что соседи перебираются в порядке `dr = {-1, 1, 0, 0}`, `dc = {0, 0, -1, 1}`: «вниз» стоит раньше «вправо», поэтому (3, 0) вышла из очереди раньше, чем (0, 3). " +
          "Если поменять порядок соседей, поменяется и маршрут — он тоже будет кратчайшим, но другим.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<vector<int>> fromr = {\n" +
      "        {0, 0, 0, 0},\n" +
      "        {0, -1, -1, 0},\n" +
      "        {1, -1, 3, 1},\n" +
      "        {2, 3, 3, 3},\n" +
      "    };\n" +
      "    vector<vector<int>> fromc = {\n" +
      "        {0, 0, 1, 2},\n" +
      "        {0, -1, -1, 3},\n" +
      "        {0, -1, 2, 3},\n" +
      "        {0, 0, 1, 2},\n" +
      "    };\n" +
      "    int sr = 0;\n" +
      "    int sc = 0;\n" +
      "    int fr = 3;\n" +
      "    int fc = 3;\n" +
      "    vector<int> pr;\n" +
      "    vector<int> pc;\n" +
      "    int r = fr;\n" +
      "    int c = fc;\n" +
      "    while (r != sr || c != sc) {\n" +
      "        pr.push_back(r);\n" +
      "        pc.push_back(c);\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "    }\n" +
      "    pr.push_back(sr);\n" +
      "    pc.push_back(sc);\n" +
      "    for (int i = (int)pr.size() - 1; i >= 0; i--) {\n" +
      "        cout << pr[i] << \" \" << pc[i] << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Экранға жеті жол шығады: `0 0`, `1 0`, `2 0`, `3 0`, `3 1`, `3 2`, `3 3`. Жеті ұяшық — алты қадам.",
      ru: "На экран выйдут семь строк: `0 0`, `1 0`, `2 0`, `3 0`, `3 1`, `3 2`, `3 3`. Семь клеток — шесть шагов.",
    },
  },
  {
    id: "m7.l4.b3",
    type: "prediction",
    skillRefs: ["graph.path_restore", "lists.index"],
    sourceType: "product-authored",
    /* No maze on screen on purpose. The learner cannot recognise the route from
       the picture and then pick the option that matches it; the only way to the
       answer is to chase the records themselves. */
    prompt: {
      kk: "Бұл бағдарламада тордың өзі жоқ — тек толқын толтырып кеткен екі жазба торы бар. Старт — (0, 0) ұяшығы, ал бағдарлама (0, 2) ұяшығынан бастап жазбалар бойынша артқа жүреді. Ол экранға нені шығарады? Әр жолда бір ұяшықтың жол және баған нөмірі.",
      ru: "В этой программе самой сетки нет — есть только две таблицы записей, оставленных волной. Старт — клетка (0, 0), а программа идёт назад по записям, начиная с клетки (0, 2). Что она выведет? В каждой строке номер строки и номер столбца одной клетки.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<vector<int>> fromr = {\n" +
      "        {0, -1, 1},\n" +
      "        {0, 1, 1},\n" +
      "        {1, -1, 1},\n" +
      "    };\n" +
      "    vector<vector<int>> fromc = {\n" +
      "        {0, -1, 2},\n" +
      "        {0, 0, 1},\n" +
      "        {0, -1, 2},\n" +
      "    };\n" +
      "    int r = 0;\n" +
      "    int c = 2;\n" +
      "    while (r != 0 || c != 0) {\n" +
      "        cout << r << \" \" << c << endl;\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "    }\n" +
      "    cout << r << \" \" << c << endl;\n" +
      "    return 0;\n" +
      "}",
    answer: "0 2\n1 2\n1 1\n1 0\n0 0",
    options: ["0 2\n1 2\n1 1\n1 0\n0 0", "0 0\n1 0\n1 1\n1 2\n0 2", "0 2\n1 2\n1 1\n1 0"],
    diagnosticMapping: {
      /* Only the forward order is mapped. The truncated option has two possible
         causes at once — «соңғы `cout` есепке алынбады» and «цикл старт
         ұяшығын да қамтиды деп ойлау» — so it is left for the engine to ask
         about rather than diagnosed wrongly. */
      "0 0\n1 0\n1 1\n1 2\n0 2": {
        failureClass: "restored_path_direction_not_understood",
        justification:
          "Бұл — тізбектің дұрыс ұяшықтары, бірақ старттан финишке қарай реттелген. Бағдарламада ешқандай аудару жоқ: ол әр қадамда тұрған ұяшығын бірден шығарады, ал жазбалар әрқашан артқа, старт жаққа сілтейді. Осы жауапты таңдау жазбалар бойынша жүру бағытын кері түсінгенді білдіреді.",
      },
    },
  },
  {
    id: "m7.l4.b4",
    type: "trace_code",
    skillRefs: ["graph.path_restore", "loops.while", "lists.index"],
    sourceType: "product-authored",
    /* The final row asks for both lists in full, not for a variable. That is
       where the lesson's point becomes visible: the collected lists really do
       start at the finish, and there is nothing in the program that turns them
       round. `b5` then breaks exactly that. */
    prompt: {
      kk: "Бағдарламаны қағазда қадамдап орында. 22-жолдағы `while` шартына оралған сайын `r` мен `c`-нің сол сәттегі мәнін жаз. Соңғы жолда, 32-жолда, `pr` мен `pc` тізімдерінің толық мазмұнын жаз. Старт — (0, 3), артқа жүру (2, 0) ұяшығынан басталады.",
      ru: "Выполни программу по шагам на бумаге. Каждый раз при возврате к условию `while` на строке 22 записывай текущие значения `r` и `c`. В последней строке, на строке 32, запиши полное содержимое списков `pr` и `pc`. Старт — (0, 3), обратный ход начинается с клетки (2, 0).",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<vector<int>> fromr = {\n" +
      "        {0, 0, 0, 0},\n" +
      "        {0, -1, -1, 0},\n" +
      "        {2, 2, 2, 1},\n" +
      "    };\n" +
      "    vector<vector<int>> fromc = {\n" +
      "        {1, 2, 3, 3},\n" +
      "        {0, -1, -1, 3},\n" +
      "        {1, 2, 3, 3},\n" +
      "    };\n" +
      "    int sr = 0;\n" +
      "    int sc = 3;\n" +
      "    vector<int> pr;\n" +
      "    vector<int> pc;\n" +
      "    int r = 2;\n" +
      "    int c = 0;\n" +
      "    while (r != sr || c != sc) {\n" +
      "        pr.push_back(r);\n" +
      "        pc.push_back(c);\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "    }\n" +
      "    pr.push_back(sr);\n" +
      "    pc.push_back(sc);\n" +
      "    cout << (int)pr.size();\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 22, vars: { r: "2", c: "0" } },
      { line: 22, vars: { r: "2", c: "1" } },
      { line: 22, vars: { r: "2", c: "2" } },
      { line: 22, vars: { r: "2", c: "3" } },
      { line: 22, vars: { r: "1", c: "3" } },
      { line: 22, vars: { r: "0", c: "3" } },
      { line: 32, vars: { pr: "[2, 2, 2, 2, 1, 0]", pc: "[0, 1, 2, 3, 3, 3]" } },
    ],
  },
  {
    id: "m7.l4.b5",
    type: "find_bug",
    skillRefs: ["graph.path_restore", "loops.for"],
    sourceType: "product-authored",
    /*
     * The lesson's own trap: the walk collects correctly and the program is
     * still wrong, because nothing turned the list round. The symptom is stated
     * as an observation — the first line printed is the finish — and the repair
     * uses `reverse` rather than the backwards index loop the worked example
     * shows, so recognising `b2` is not enough to answer this.
     *
     * symptomInput is required here even though the numeric probe would happen
     * to differ: the program reads which cell to walk back from, and `3 3` is
     * the cell the prompt talks about. A witness that matches the prompt is
     * worth more than one that merely works.
     */
    prompt: {
      kk:
        "Бұл лабиринт үшін толқын жазбаларды әлдеқашан толтырып қойған; олар бағдарламада дайын тұр. Старт — (0, 0), ал финиш ұяшығы енгізуден оқылады. `3 3` бергенде бағдарлама алдымен `3 3`, ең соңында `0 0` шығарады — яғни маршрут фиништен старта қарай жазылған, ал керісінше болуы керек еді. Ұяшықтардың өзі дұрыс. Қай жол кінәлі?",
      ru:
        "Для этого лабиринта волна давно заполнила записи; они уже готовы внутри программы. Старт — (0, 0), а клетку финиша программа читает со ввода. При вводе `3 3` она печатает сначала `3 3`, а в самом конце `0 0` — то есть маршрут выходит от финиша к старту, а нужно наоборот. Сами клетки при этом верные. Какая строка виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<vector<int>> fromr = {\n" +
      "        {0, 0, 0, 0},\n" +
      "        {-1, -1, 0, -1},\n" +
      "        {2, 2, 1, 2},\n" +
      "        {2, -1, 2, 3},\n" +
      "    };\n" +
      "    vector<vector<int>> fromc = {\n" +
      "        {0, 0, 1, 2},\n" +
      "        {-1, -1, 2, -1},\n" +
      "        {1, 2, 2, 2},\n" +
      "        {0, -1, 2, 2},\n" +
      "    };\n" +
      "    int sr = 0;\n" +
      "    int sc = 0;\n" +
      "    int fr, fc;\n" +
      "    cin >> fr >> fc;\n" +
      "    vector<int> pr;\n" +
      "    vector<int> pc;\n" +
      "    int r = fr;\n" +
      "    int c = fc;\n" +
      "    while (r != sr || c != sc) {\n" +
      "        pr.push_back(r);\n" +
      "        pc.push_back(c);\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "    }\n" +
      "    pr.push_back(sr);\n" +
      "    pc.push_back(sc);\n" +
      "    for (int i = 0; i < (int)pr.size(); i++) {\n" +
      "        cout << pr[i] << \" \" << pc[i] << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 36,
    symptomInput: "3 3",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<vector<int>> fromr = {\n" +
      "        {0, 0, 0, 0},\n" +
      "        {-1, -1, 0, -1},\n" +
      "        {2, 2, 1, 2},\n" +
      "        {2, -1, 2, 3},\n" +
      "    };\n" +
      "    vector<vector<int>> fromc = {\n" +
      "        {0, 0, 1, 2},\n" +
      "        {-1, -1, 2, -1},\n" +
      "        {1, 2, 2, 2},\n" +
      "        {0, -1, 2, 2},\n" +
      "    };\n" +
      "    int sr = 0;\n" +
      "    int sc = 0;\n" +
      "    int fr, fc;\n" +
      "    cin >> fr >> fc;\n" +
      "    vector<int> pr;\n" +
      "    vector<int> pc;\n" +
      "    int r = fr;\n" +
      "    int c = fc;\n" +
      "    while (r != sr || c != sc) {\n" +
      "        pr.push_back(r);\n" +
      "        pc.push_back(c);\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "    }\n" +
      "    pr.push_back(sr);\n" +
      "    pc.push_back(sc);\n" +
      "    reverse(pr.begin(), pr.end());\n" +
      "    reverse(pc.begin(), pc.end());\n" +
      "    for (int i = 0; i < (int)pr.size(); i++) {\n" +
      "        cout << pr[i] << \" \" << pc[i] << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m7.l4.b6",
    type: "find_bug",
    skillRefs: ["graph.path_restore", "graph.bfs", "debug.boundary"],
    sourceType: "product-authored",
    /*
     * The record written on every visit instead of only the first. See the file
     * header, decision 6, for why this program prints the record instead of
     * walking it: with the record rewritten, any two adjacent free cells end up
     * pointing at each other and the walk back never terminates.
     *
     * The program keeps `dist` as a separate visited mark, which is precisely
     * what makes the defect expressible — and is the contrast `b1` argues for.
     * The distance printed on the first line is correct in BOTH versions, so
     * the learner cannot blame the wave; only the record on the second line
     * moves.
     *
     * No diagnosticMapping. Naming the guard could mean «бұл шарт артық» or
     * «бұл шарт басқа жерде тұруы керек», and those are different
     * misunderstandings.
     */
    prompt: {
      kk:
        "Бұл бағдарлама 3×4 бос торда толқынды жүргізеді де, екі жол шығарады: біріншісінде финишке дейінгі қашықтық, екіншісінде толқын финишке қай ұяшықтан кірді деп жазып қойған жазба. Қашықтық дұрыс — 4. Ал жазба ретінде `2 3` шығады, ал ол ұяшық стартқа фиништің өзінен де алыс жатыр. Демек, осы жазбалармен жиналған маршрут ең қысқа болмайды. Ұяшықтың жазбасы бірінші реттен кейін де қайта жазылып кетуіне қай жол мүмкіндік беріп тұр?",
      ru:
        "Эта программа пускает волну по пустой сетке 3×4 и печатает две строки: в первой — расстояние до финиша, во второй — запись о том, из какой клетки волна вошла в финиш. Расстояние верное — 4. А в записи оказывается `2 3`, и эта клетка лежит от старта дальше, чем сам финиш. Значит, маршрут, собранный по таким записям, кратчайшим не будет. Какая строка позволяет записи клетки перезаписываться уже после первого раза?",
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
      "    int sr, sc, fr, fc;\n" +
      "    cin >> sr >> sc >> fr >> fc;\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
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
      "                if (g[nr][nc] == '.') {\n" +
      "                    fromr[nr][nc] = r;\n" +
      "                    fromc[nr][nc] = c;\n" +
      "                    if (dist[nr][nc] == -1) {\n" +
      "                        dist[nr][nc] = dist[r][c] + 1;\n" +
      "                        q.push({nr, nc});\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dist[fr][fc] << endl;\n" +
      "    cout << fromr[fr][fc] << \" \" << fromc[fr][fc] << endl;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 33,
    symptomInput: "3 4\n....\n....\n....\n0 0 1 3",
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
      "    int sr, sc, fr, fc;\n" +
      "    cin >> sr >> sc >> fr >> fc;\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
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
      "                    fromr[nr][nc] = r;\n" +
      "                    fromc[nr][nc] = c;\n" +
      "                    dist[nr][nc] = dist[r][c] + 1;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dist[fr][fc] << endl;\n" +
      "    cout << fromr[fr][fc] << \" \" << fromc[fr][fc] << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m7.l4.b7",
    type: "fill_blank",
    skillRefs: ["graph.path_restore", "graph.bfs", "grid.cells"],
    sourceType: "product-authored",
    /*
     * All four blanks are the record and nothing else: the start's self-mark,
     * and the two lines that say where a new cell was reached from. The maze is
     * fixed inside the program on purpose — reading the input format is `b8`'s
     * work, and putting it here would make this card a prefix of that answer.
     *
     * The program counts MOVES by walking the records back. A learner who fills
     * the record wrongly does not merely get a wrong number; the walk cannot
     * find its way home at all, which is the point being made.
     */
    prompt: {
      kk:
        "Бағдарлама 3×5 лабиринтте толқынды жүргізеді, содан кейін жазбалар бойынша фиништен старта қарай артқа жүріп, неше ҚАДАМ (көрші ұяшыққа бір өту) жасалғанын санайды да, сол санды шығарады. Толқынның ішінде төрт орын бос.\n\n" +
        "Алғашқы екеуі — старттың өзіне сілтейтін жазбасы: ол болмаса толқын старт ұяшығын кейін жаңа ұяшық деп санап қалады. Қалған екеуі — жаңа ұяшыққа қай ұяшықтан келгенімізді жазатын жолдар. Осы лабиринтте финишке жету мүмкін.",
      ru:
        "Программа пускает волну по лабиринту 3×5, а потом идёт назад по записям от финиша к старту, считает, сколько ШАГОВ (один переход в соседнюю клетку) было сделано, и печатает это число. Внутри волны четыре пропуска.\n\n" +
        "Первые два — запись старта, ссылающаяся на саму себя: без неё волна потом сочтёт клетку старта новой. Оставшиеся два — строки, где записывается, из какой клетки мы пришли в новую. В этом лабиринте финиш достижим.",
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
      "    vector<string> g = {\"..#..\", \".#...\", \".....\"};\n" +
      "    int n = 3;\n" +
      "    int m = 5;\n" +
      "    int sr = 0;\n" +
      "    int sc = 0;\n" +
      "    int fr = 0;\n" +
      "    int fc = 4;\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    fromr[sr][sc] = ___;\n" +
      "    fromc[sr][sc] = ___;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && fromr[nr][nc] == -1) {\n" +
      "                    fromr[nr][nc] = ___;\n" +
      "                    fromc[nr][nc] = ___;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    int steps = 0;\n" +
      "    int r = fr;\n" +
      "    int c = fc;\n" +
      "    while (r != sr || c != sc) {\n" +
      "        int nr = fromr[r][c];\n" +
      "        int nc = fromc[r][c];\n" +
      "        r = nr;\n" +
      "        c = nc;\n" +
      "        steps = steps + 1;\n" +
      "    }\n" +
      "    cout << steps;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "sr" },
      { id: "f2", answer: "sc" },
      { id: "f3", answer: "r" },
      { id: "f4", answer: "c" },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m7.l4.b8 — the same problem, completed instead of
     * written from scratch. PDF p.6: «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ».
     *
     * The wave is written out in full here because the support learner has
     * already completed exactly those lines at `b7`; the five blanks are all in
     * the part `b7` does not contain — the unreachable test, the stopping
     * condition of the walk, what goes into the list, which record is read, and
     * where the printing loop starts from. Four of the five are single tokens
     * and the fifth is the index the reversal turns on — the one place in the
     * lesson where `(int)` in front of `size()` is the learner's own decision.
     *
     * The prompt states the whole problem and never points at a neighbouring
     * card: the block `b8` it substitutes for is not on this route, so «previous
     * task» would name a screen this learner never sees.
     */
    id: "m7.l4.b8s",
    type: "fill_blank",
    skillRefs: ["graph.path_restore", "graph.bfs", "graph.shortest_path"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["support"],
    prompt: {
      kk:
        "Бағдарлама лабиринттегі ең қысқа маршрутты шығаруы керек: әр жолда бір ұяшықтың `r c` координаттары, старттан бастап финишпен қоса. Егер финишке жету мүмкін болмаса — бір жолда `-1`.\n\n" +
        "Толқын бөлігі толық жазылған. Бес орын бос: жол бар-жоғын тексеретін шарт, артқа жүру циклінің шарты (қай ұяшықта тоқтау керек), жүру кезінде тізімге не қосылатыны, жазба қай ұяшықтан оқылатыны және маршрутты кері ретпен шығаратын циклдің қай индекстен басталатыны. Соңғысында `size()` алдында `(int)` тұруы керегін ұмытпа.",
      ru:
        "Программа должна вывести кратчайший маршрут в лабиринте: в каждой строке координаты `r c` одной клетки, от старта до финиша включительно. Если добраться до финиша нельзя — одна строка `-1`.\n\n" +
        "Часть с волной уже написана. Пропусков пять: проверка того, есть ли путь; условие цикла обратного хода (в какой клетке остановиться); что добавляется в список во время хода; из какой клетки читается запись; и с какого индекса начинается цикл, выводящий маршрут в обратном порядке. В последнем не забудь про `(int)` перед `size()`.",
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
      "    int sr, sc, fr, fc;\n" +
      "    cin >> sr >> sc >> fr >> fc;\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    fromr[sr][sc] = sr;\n" +
      "    fromc[sr][sc] = sc;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && fromr[nr][nc] == -1) {\n" +
      "                    fromr[nr][nc] = r;\n" +
      "                    fromc[nr][nc] = c;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    if (fromr[fr][fc] == ___) {\n" +
      "        cout << -1;\n" +
      "    } else {\n" +
      "        vector<int> pr;\n" +
      "        vector<int> pc;\n" +
      "        int r = fr;\n" +
      "        int c = fc;\n" +
      "        while (r != sr ___ c != sc) {\n" +
      "            pr.push_back(___);\n" +
      "            pc.push_back(c);\n" +
      "            int nr = fromr[r][___];\n" +
      "            int nc = fromc[r][c];\n" +
      "            r = nr;\n" +
      "            c = nc;\n" +
      "        }\n" +
      "        pr.push_back(sr);\n" +
      "        pc.push_back(sc);\n" +
      "        for (int i = ___; i >= 0; i--) {\n" +
      "            cout << pr[i] << \" \" << pc[i] << endl;\n" +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "-1" },
      { id: "f2", answer: "||" },
      { id: "f3", answer: "r" },
      { id: "f4", answer: "c" },
      { id: "f5", answer: "(int)pr.size() - 1", alternatives: ["(int)pr.size()-1"] },
    ],
  },
  {
    id: "m7.l4.b8",
    type: "write_code",
    skillRefs: ["graph.path_restore", "graph.bfs", "graph.shortest_path", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["core", "advanced"],
    /*
     * The PDF family «маршрутты қалпына келтіру», written from scratch.
     *
     * The layout IS the answer here — one cell per line, row then column — so
     * the checker is `exact` and the prompt states the layout. `token` would
     * accept the whole route on one line against a prompt that forbids it,
     * which is the October defect this rule exists for.
     *
     * The tie-break is stated because a maze usually has several shortest
     * routes. Case 2 is VISIBLE and is decided by it: a learner who walks the
     * neighbours right-before-down prints `0 0 / 0 1 / 0 2 / 1 2 / 2 2` and sees
     * the expected answer next to it. Punishing that on a hidden case would be
     * marking a child wrong for a rule they had no way to check.
     *
     * The cases, each against a specific wrong program, each one executed:
     *   2x3 with a door       the only route to (0,2) ends with an upward move,
     *                         so a traversal missing `up` prints -1;
     *   3x3 open, (0,0)→(2,2) the tie-break itself, and the unreversed route;
     *   3x4 with one door     a real maze whose shortest route is unique;
     *   3x3 wall column       no route at all — a program with no `-1` branch
     *                         either crashes or walks off the records;
     *   3x3, (1,1)→(1,1)      start = finish, where the walk body never runs
     *                         and the answer is still one line;
     *   3x3 open, (0,0)→(0,2) a depth-first walk finds a route of 6 moves
     *                         instead of 2 — it is not the wave;
     *   1x5 corridor          one row, where `nr >= 0 && nr < n` is the only
     *                         thing standing between the program and row -1;
     *   2x2 adjacent          the shortest possible real route, two lines;
     *   5x5 zigzag            a longer maze with several shortest routes, so
     *                         the tie-break is checked away from the sample.
     */
    prompt: {
      kk:
        "Бірінші жолда екі бүтін сан: n және m (1 ≤ n ≤ 50, 1 ≤ m ≤ 50) — тордың жол саны мен баған саны. Келесі n жолда m таңбадан тұратын жолдар: `.` — бос ұяшық, `#` — қабырға. Соңғы жолда төрт бүтін сан: `sr sc fr fc` — старттың жолы мен бағаны, содан кейін фиништің жолы мен бағаны. Жолдар жоғарыдан төмен қарай 0-ден, бағандар солдан оңға қарай 0-ден нөмірленеді. Старт та, финиш те әрқашан бос ұяшық.\n\n" +
        "Старттан финишке дейінгі ЕҢ ҚЫСҚА маршрутты шығар: әр жолда бір ұяшық, алдымен жол нөмірі, содан кейін баған нөмірі, арасында бір бос орын. Старт пен финиш те шығады. Жүру тек көрші ұяшыққа: жоғары, төмен, солға, оңға; диагональ жоқ, қабырғаға басуға болмайды. Егер финишке жету мүмкін болмаса, бір жолда `-1` шығар.\n\n" +
        "Ең қысқа маршрут бірнешеу болуы мүмкін, сондықтан жауап біреу болатындай ереже: толқын көршілерді ЖОҒАРЫ, ТӨМЕН, СОЛҒА, ОҢҒА ретімен қарайды (`int dr[4] = {-1, 1, 0, 0};`, `int dc[4] = {0, 0, -1, 1};`), ал «қайдан келдім» жазбасы ұяшыққа БІРІНШІ рет жеткенде ғана жазылады. Тексеруші дәл осы ережемен шыққан маршрутты күтеді.",
      ru:
        "В первой строке два целых числа: n и m (1 ≤ n ≤ 50, 1 ≤ m ≤ 50) — количество строк и столбцов сетки. В следующих n строках по m символов: `.` — свободная клетка, `#` — стена. В последней строке четыре целых числа: `sr sc fr fc` — строка и столбец старта, затем строка и столбец финиша. Строки нумеруются сверху вниз с 0, столбцы — слева направо с 0. И старт, и финиш всегда свободные клетки.\n\n" +
        "Выведи КРАТЧАЙШИЙ маршрут от старта до финиша: в каждой строке одна клетка — сначала номер строки, потом номер столбца, между ними один пробел. Старт и финиш тоже выводятся. Ходить можно только в соседнюю клетку: вверх, вниз, влево, вправо; по диагонали нельзя, на стену вставать нельзя. Если добраться до финиша невозможно, выведи одну строку `-1`.\n\n" +
        "Кратчайших маршрутов может быть несколько, поэтому правило, делающее ответ единственным: волна перебирает соседей в порядке ВВЕРХ, ВНИЗ, ВЛЕВО, ВПРАВО (`int dr[4] = {-1, 1, 0, 0};`, `int dc[4] = {0, 0, -1, 1};`), а запись «откуда пришли» ставится в клетку только при ПЕРВОМ попадании в неё. Проверяющая система ждёт маршрут, полученный именно по этому правилу.",
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
      "    int sr, sc, fr, fc;\n" +
      "    cin >> sr >> sc >> fr >> fc;\n" +
      "    vector<vector<int>> fromr(n, vector<int>(m, -1));\n" +
      "    vector<vector<int>> fromc(n, vector<int>(m, -1));\n" +
      "    int dr[4] = {-1, 1, 0, 0};\n" +
      "    int dc[4] = {0, 0, -1, 1};\n" +
      "    fromr[sr][sc] = sr;\n" +
      "    fromc[sr][sc] = sc;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({sr, sc});\n" +
      "    while (!q.empty()) {\n" +
      "        auto [r, c] = q.front();\n" +
      "        q.pop();\n" +
      "        for (int k = 0; k < 4; k++) {\n" +
      "            int nr = r + dr[k];\n" +
      "            int nc = c + dc[k];\n" +
      "            if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n" +
      "                if (g[nr][nc] == '.' && fromr[nr][nc] == -1) {\n" +
      "                    fromr[nr][nc] = r;\n" +
      "                    fromc[nr][nc] = c;\n" +
      "                    q.push({nr, nc});\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    if (fromr[fr][fc] == -1) {\n" +
      "        cout << -1;\n" +
      "    } else {\n" +
      "        vector<int> pr;\n" +
      "        vector<int> pc;\n" +
      "        int r = fr;\n" +
      "        int c = fc;\n" +
      "        while (r != sr || c != sc) {\n" +
      "            pr.push_back(r);\n" +
      "            pc.push_back(c);\n" +
      "            int nr = fromr[r][c];\n" +
      "            int nc = fromc[r][c];\n" +
      "            r = nr;\n" +
      "            c = nc;\n" +
      "        }\n" +
      "        pr.push_back(sr);\n" +
      "        pc.push_back(sc);\n" +
      "        for (int i = (int)pr.size() - 1; i >= 0; i--) {\n" +
      "            cout << pr[i] << \" \" << pc[i] << endl;\n" +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    checker: { kind: "exact" },
    cases: [
      /* The only route to (0,2) ends with an upward move. A traversal missing the up direction
         prints -1. */
      { input: "2 3\n.#.\n...\n0 0 0 2", expectedOutput: "0 0\n1 0\n1 1\n1 2\n0 2", hidden: true },
      { input: "3 3\n...\n...\n...\n0 0 2 2", expectedOutput: "0 0\n1 0\n2 0\n2 1\n2 2" },
      { input: "3 4\n....\n##.#\n....\n0 0 2 0", expectedOutput: "0 0\n0 1\n0 2\n1 2\n2 2\n2 1\n2 0" },
      { input: "3 3\n.#.\n.#.\n.#.\n0 0 2 2", expectedOutput: "-1", hidden: true },
      { input: "3 3\n...\n...\n...\n1 1 1 1", expectedOutput: "1 1", hidden: true },
      { input: "3 3\n...\n...\n...\n0 0 0 2", expectedOutput: "0 0\n0 1\n0 2", hidden: true },
      { input: "1 5\n.....\n0 0 0 4", expectedOutput: "0 0\n0 1\n0 2\n0 3\n0 4", hidden: true },
      { input: "2 2\n..\n..\n0 0 0 1", expectedOutput: "0 0\n0 1", hidden: true },
      {
        input: "5 5\n.....\n.###.\n.....\n.###.\n.....\n0 0 4 4",
        expectedOutput: "0 0\n1 0\n2 0\n3 0\n4 0\n4 1\n4 2\n4 3\n4 4",
        hidden: true,
      },
    ],
  },
  {
    id: "m7.l4.b9",
    type: "challenge",
    skillRefs: ["graph.shortest_path", "graph.bfs", "func.define", "func.reuse"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    /*
     * Harder problem for the two upper routes (p.6: «Негізгі — … қалауы бойынша
     * 1-2 күрделірек есеп», «Тереңдетілген — … күрделі есептер блогына көшу»).
     *
     * The answer is a NUMBER, not a route, and that is deliberate: a route
     * through a named cell can be built in several equally short ways, and a
     * second tie-break rule on top of `b8`'s would be a rule the prompt could
     * not state honestly in two sentences. The length is canonical.
     *
     * The helper function is ADVICE and the prompt says so — option 2 of the
     * three honest options, because a copy-pasted second wave produces exactly
     * the same number and claiming otherwise would be a rule nothing enforces.
     * In C++ the helper needs the map, so `g`, `n` and `m` live before `main`,
     * which is m7.l2's rule reused rather than a new one.
     *
     * Cases against the wrong programs, each executed:
     *   mid (2,0)      the detour costs 7 where the direct route costs 3, so a
     *                  program that ignores the named cell fails on the sample;
     *   mid (1,3)      the named cell lies on a shortest route: 5, not 3;
     *   mid = start    and mid = finish, the two degenerate placements;
     *   isolated cell  the named cell is walled off — `-1`, which kills a
     *                  program that adds two distances without testing them;
     *   finish cut off the second wave never reaches the named cell — the other
     *                  half of the same test;
     *   5x5 zigzag     a maze where the two halves are 8 and 4, so doubling one
     *                  wave instead of running two gives the wrong number.
     */
    prompt: {
      kk:
        "Кіріс осы сабақтағы маршрут есебіндегідей, тек соңында тағы бір жол қосылған. Бірінші жолда n және m (1 ≤ n ≤ 50, 1 ≤ m ≤ 50). Келесі n жолда торлы карта: `.` — бос ұяшық, `#` — қабырға. Одан кейінгі жолда `sr sc fr fc` — старт пен фиништің координаттары. Ең соңғы жолда `mr mc` — МІНДЕТТІ ұяшықтың координаттары. Үш ұяшық та бос, бірақ олар беттесіп қалуы мүмкін.\n\n" +
        "Старттан финишке `mr mc` ұяшығы арқылы өтетін жолдың ең аз ҚАДАМ санын шығар. Бір қадам — көрші ұяшыққа (жоғары, төмен, солға, оңға) бір өту. Ұяшық бірнеше рет басылса да болады. Егер міндетті ұяшық арқылы жету мүмкін болмаса, `-1` шығар.\n\n" +
        "Кеңес: толқынды екі рет жүргізу керек — біреуін старттан, екіншісін фиништен. Оны қарашада үйренген функцияға шығарсаң, толқынды екі рет жазбайсың; ол функцияға карта керек болғандықтан `g`, `n` және `m` айнымалылары `main`-нен бұрын тұрады, дәл `m7.l2`-дегідей. Бұл кеңес, шарт емес: тексеруші тек шыққан санды қарайды.",
      ru:
        "Формат ввода такой же, как в задаче про маршрут на этом уроке, только в конце добавлена ещё одна строка. В первой строке n и m (1 ≤ n ≤ 50, 1 ≤ m ≤ 50). В следующих n строках карта: `.` — свободная клетка, `#` — стена. Дальше строка `sr sc fr fc` — координаты старта и финиша. В самой последней строке `mr mc` — координаты ОБЯЗАТЕЛЬНОЙ клетки. Все три клетки свободны, но могут совпадать.\n\n" +
        "Выведи наименьшее число ШАГОВ пути из старта в финиш, который проходит через клетку `mr mc`. Один шаг — это один переход в соседнюю клетку (вверх, вниз, влево, вправо). Наступать на одну и ту же клетку несколько раз разрешается. Если пройти через обязательную клетку невозможно, выведи `-1`.\n\n" +
        "Совет: волну придётся пустить дважды — один раз из старта, второй из финиша. Если вынести её в функцию, знакомую с ноября, писать волну дважды не придётся; функции нужна карта, поэтому `g`, `n` и `m` объявляются до `main`, как в `m7.l2`. Это совет, а не требование: проверяющая система смотрит только на выведенное число.",
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
      "vector<vector<int>> wave(int r0, int c0) {\n" +
      "    vector<vector<int>> dist(n, vector<int>(m, -1));\n" +
      "    dist[r0][c0] = 0;\n" +
      "    queue<pair<int, int>> q;\n" +
      "    q.push({r0, c0});\n" +
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
      "    return dist;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cin >> n >> m;\n" +
      "    g = vector<string>(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> g[i];\n" +
      "    }\n" +
      "    int sr, sc, fr, fc;\n" +
      "    cin >> sr >> sc >> fr >> fc;\n" +
      "    int mr, mc;\n" +
      "    cin >> mr >> mc;\n" +
      "    vector<vector<int>> a = wave(sr, sc);\n" +
      "    vector<vector<int>> b = wave(fr, fc);\n" +
      "    if (a[mr][mc] == -1 || b[mr][mc] == -1) {\n" +
      "        cout << -1;\n" +
      "    } else {\n" +
      "        cout << a[mr][mc] + b[mr][mc];\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Both legs need an upward step to reach (0,2); three directions answer -1. */
      { input: "2 3\n.#.\n...\n0 0 1 0\n0 2", expectedOutput: "7", hidden: true },
      { input: "3 4\n....\n.##.\n....\n0 0 0 3\n2 0", expectedOutput: "7" },
      { input: "3 4\n....\n.##.\n....\n0 0 0 3\n1 3", expectedOutput: "5" },
      { input: "3 4\n....\n.##.\n....\n0 0 0 3\n0 0", expectedOutput: "3", hidden: true },
      { input: "3 4\n....\n.##.\n....\n0 0 0 3\n0 3", expectedOutput: "3", hidden: true },
      { input: "3 4\n....\n###.\n.#..\n0 0 0 3\n2 0", expectedOutput: "-1", hidden: true },
      { input: "3 3\n.#.\n.#.\n.#.\n0 0 0 2\n1 0", expectedOutput: "-1", hidden: true },
      {
        input: "5 5\n.....\n.###.\n.....\n.###.\n.....\n0 0 0 4\n4 0",
        expectedOutput: "12",
        hidden: true,
      },
    ],
  },
  {
    id: "m7.l4.b10",
    type: "explain",
    skillRefs: ["graph.shortest_path", "graph.path_restore"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["advanced"],
    /*
     * The written defence the advanced route owes every month (p.6: «шешімді
     * жазбаша қорғау міндетті»), and it is March's own «Айлық сынақ» question
     * asked while the code is still warm: «табылған жолдың неге шынымен ең
     * қысқа екенін түсіндіреді».
     *
     * Two questions, not four: `explain` sub-questions are answers, and this
     * card shares ten minutes with a from-scratch task. Settles as `unknown`
     * and is read by a teacher — nothing here is auto-graded.
     */
    prompt: {
      kk:
        "Жазбаша жауап бер, екі сұрақ.\n\n" +
        "1. Бағдарламаң шығарған маршруттың шынымен ең қысқа екенін қалай дәлелдейсің? Толқынның қалай таралатынын және жазба ұяшыққа қай сәтте түсетінін пайдалан.\n\n" +
        "2. `dr` мен `dc`-дегі көршілердің ретін өзгертсең (мысалы, алдымен оңға, содан кейін төмен), не өзгереді және не өзгермейді? Мысал келтір.",
      ru:
        "Дай письменный ответ на два вопроса.\n\n" +
        "1. Как ты обоснуешь, что выведенный твоей программой маршрут действительно кратчайший? Используй то, как распространяется волна и в какой момент в клетку попадает запись.\n\n" +
        "2. Что изменится, а что не изменится, если поменять порядок соседей в `dr` и `dc` (например, сначала вправо, потом вниз)? Приведи пример.",
    },
    expectedPoints: [
      {
        kk: "Толқын қабаттап таралады: k қадамдағы барлық ұяшықтар кезекке k+1 қадамдағы бірде-бір ұяшықтан бұрын түседі. Сондықтан ұяшыққа бірінші рет жету — оған ең аз қадаммен жету.",
        ru: "Волна расходится слоями: все клетки на расстоянии k попадают в очередь раньше любой клетки на расстоянии k+1. Поэтому первое попадание в клетку — это попадание за наименьшее число шагов.",
      },
      {
        kk: "Жазба дәл сол бірінші жету сәтінде жазылады және қайта жазылмайды, себебі шартта `fromr[nr][nc] == -1` тұр. Демек, әр ұяшықтың жазбасы — оған ең қысқа жолмен келген ұяшық.",
        ru: "Запись ставится именно в момент первого попадания и больше не переписывается, потому что в условии стоит `fromr[nr][nc] == -1`. Значит, запись каждой клетки — это клетка, из которой в неё пришли кратчайшим путём.",
      },
      {
        kk: "Фиништен жазбалар бойынша артқа жүргенде әр қадамда қашықтық дәл 1-ге азаяды, сондықтан жиналған тізбектің ұзындығы — финишке дейінгі қашықтық, ал одан қысқа маршрут болуы мүмкін емес.",
        ru: "При обратном ходе от финиша по записям расстояние на каждом шаге уменьшается ровно на 1, поэтому длина собранной цепочки равна расстоянию до финиша, а более короткого маршрута быть не может.",
      },
      {
        kk: "Көршілердің реті ӨЗГЕРТКЕНДЕ маршруттың ҰЗЫНДЫҒЫ өзгермейді — ол әрқашан сол ең аз қадам саны. Өзгеретіні — бірдей ұзындықтағы бірнеше маршруттың қайсысы таңдалатыны.",
        ru: "При изменении порядка соседей ДЛИНА маршрута не меняется — она всегда равна тому же наименьшему числу шагов. Меняется лишь то, какой из нескольких маршрутов одинаковой длины будет выбран.",
      },
      {
        kk: "Нақты мысал: бос 3×3 тор, старт (0, 0), финиш (2, 2). «Төмен» бұрын тұрса, маршрут төменгі жолмен өтеді; «оңға» бұрын тұрса, жоғарғы жолмен өтеді. Екеуі де 4 қадам.",
        ru: "Конкретный пример: пустая сетка 3×3, старт (0, 0), финиш (2, 2). Если «вниз» стоит раньше, маршрут пойдёт по нижней строке; если раньше стоит «вправо» — по верхней. И там, и там 4 шага.",
      },
    ],
  },
];
