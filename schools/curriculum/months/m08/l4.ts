import type { LessonBlock } from "../../types";

/**
 * Lesson m8.l4 · «Кестені толтыру» — filling the table. PDF p.10, April.
 * 10 minutes. Skills: `dp.table`, `recursion.core`, `precompute.prefix`.
 *
 * ## The clauses that drive this file
 *
 * «Екінші тәсіл қадамдап толтырылатын кесте арқылы беріледі» — the second
 * approach is delivered through a table filled in step by step. And the
 * practice paragraph names «тордағы жолдар санын есептеу», counting the paths
 * in a grid, which is this lesson's family.
 *
 * That family is not new. February counted the same paths RECURSIVELY in
 * `m6.l6.b8`, and the comment on that block says out loud that April fills the
 * same recurrence in as a table and watches the repeated calls disappear. So
 * `m8.l4.b4` puts February's own program back on the screen with a call
 * counter attached: `paths(3, 4)` costs 19 calls where the table costs 12
 * cells, and `paths(8, 8)` costs 6863 calls where the table costs 64. Same
 * formula, three months apart, and the only thing that changed is the order in
 * which the work is done. The grid itself, its `n m` header and its `.`/`#`
 * rows, is March's format kept unchanged — so this lesson closes three months
 * at once, and it is deliberately the last teaching lesson of April.
 *
 * ## The new idea, and why the wrong order is the worst kind of bug
 *
 * A cell needs the cell above it and the cell to its left. That is the whole
 * lesson: the recurrence dictates the fill order, and the order is not a rule
 * to memorise. `m8.l4.b5` therefore asks which of four orders is WRONG rather
 * than which is right — three of them (row by row, column by column, diagonal
 * by diagonal) are all valid, so "which is valid" would have had three correct
 * answers. Only "top to bottom but right to left inside each row" breaks it.
 *
 * `m8.l4.b7` is the same mistake as a defect: the row loop runs bottom to top,
 * so every cell reads its upstairs neighbour before it has been written. The
 * table was created with `, 0`, so nothing crashes — adding a zero that means
 * "not computed yet" is perfectly legal arithmetic. The program prints a full,
 * plausible, wrong table. That is worth a whole block, and it is why `b1` ends
 * by saying the zeros are the dangerous part.
 *
 * ## The C++17 migration: what changed here
 *
 * **The table declaration is one line and it is new writing**, so `b1` names it
 * in prose: `vector<vector<long long>> dp(n, vector<long long>(m, 0));` — n rows,
 * each of them a row of m cells all set to 0. March built `vector<vector<int>>`
 * grids, so the shape is familiar; the fill value and the `long long` are what
 * this card adds.
 *
 * **Why `long long` for a 12×12 grid whose largest answer is 705 432.** The
 * type is chosen for the QUESTION, not for the case list. The same recurrence
 * on the 20×20 grid `m8.p7` states runs to 35 345 263 800, which is sixteen times
 * past `int`, and a learner who writes `int` here and carries it there gets a
 * silently wrong number with nothing to see. The two blocks are the same
 * program; giving them different types would be teaching the wrong lesson to
 * save four characters.
 *
 * **`b10` uses `min` and the prompt says the one thing about it that bites**:
 * both arguments must have the SAME type. `min(0, someLongLong)` does not
 * compile, and that is a real C++ error a fourteen-year-old meets the first
 * time they mix a literal with a wide accumulator. Here both sides are `int`
 * and the costs are small — 10 × 10 cells at 99 each is 1881 — so `int` is
 * honest and the sentence is a warning rather than a workaround.
 *
 * **Printing a whole table changed shape.** Python's `print(dp[r])` produced
 * `[1, 0, 1, 2]`; C++ prints the numbers separated by spaces. `b2`'s expected
 * answer, `b3`'s stated result, `b6`'s trace column and `b7`'s prompt all say
 * `1 0 1 2` now, because that is what the program on the screen prints.
 *
 * **`b7` gained a `symptomInput`.** Its program reads `n` and `m`; the
 * fallback probe feeds single numbers, and in C++ a failed `cin >>` leaves the
 * second variable at 0, so both halves would build a zero-sized table and both
 * would be undefined behaviour in the same way. The witness `3 3` is declared
 * so the defect is provoked rather than guessed at.
 *
 * **No number moved.** Every case in this file is unchanged: the walks are
 * counted the same way and every count fits comfortably in `long long`.
 *
 * ## «Жол» means two things in Kazakh, so one of them is renamed
 *
 * The grid's horizontal row is «жол» (March's own input spec: «тордың жол
 * саны мен баған саны»), and a path is also «жол» (February's «жолдардың саны
 * неше»). In April both appear in the same sentence. So every learner-facing
 * string here calls the grid's row «жол» and the walk «маршрут» — which is not
 * an invention: `graph.path_restore` is «Маршрутты қалпына келтіру» in the
 * taxonomy, from the programme's own March paragraph. `b1` states the choice
 * once, in the learner's own words, instead of leaving them to guess.
 *
 * ## Requirements a checker cannot see — option 3, deliberately
 *
 * Output comparison cannot see whether `m8.l4.b9` was solved with a table. Of
 * the authoring contract's three honest options this file takes **option 3,
 * send it to a human**: the prompt says the table is a кеңес / совет, states in
 * both languages that the checker compares only the printed number, and the
 * written defence lands on `b11` (advanced) and on the month's own assessment,
 * whose PDF sentence — «әр аралық нәтиженің нені білдіретінін сөзбен
 * тұжырымдайды» — is exactly this question. Option 1 was not available: the
 * grids are at most 12×12, so a slow enumeration of every route would also
 * finish, and pretending otherwise would be a second unenforceable rule. That
 * was already true under Python and is more true under C++: the judge compiles
 * at -O0 and still manages about 10^9 simple operations a second
 * (`docs/cpp17/CPP17_JUDGE_PARITY.md`), so a 12×12 enumeration is not slow
 * there either. The option was re-checked rather than assumed, and it did not
 * change.
 *
 * `b10` is the one place option 1 does bite, and only partly: the greedy walk
 * that this month spends two lessons breaking loses on the visible sample and
 * on two hidden cases, so "take the cheaper neighbour" cannot pass. That is
 * stated as a fact about the data, not as a rule about the code.
 *
 * ## Programs, and why no two of them are the same
 *
 * Eleven blocks, ten distinct programs, checked pairwise byte for byte:
 * the empty table (`b1`), the one-row table (`b2`), the hard-coded 3×4 table
 * (`b3`), February's recursion with a counter (`b4`), one row of a two-row
 * table (`b6`), the wall-free table with the reversed row loop and its repair
 * (`b7`), the bottom-left→top-right walk (`b8`, reused on purpose as the
 * starting point of `b9s`, which the support learner has just completed), the
 * top-left→bottom-right count (`b9`/`b9s`, a twin pair) and the cheapest route
 * (`b10`). `b7` reads no grid at all — it works on an empty rectangle — which
 * is what keeps its repaired program from being three quarters of `b9`'s
 * answer.
 */

const P = 10; // PDF page for all of April

export const M8_L4: LessonBlock[] = [
  {
    id: "m8.l4.b1",
    type: "concept",
    skillRefs: ["dp.table", "dp.core", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* The «жол» / «маршрут» split is stated here, in the learner's words, and
       every later prompt in the file obeys it. Naming it once beats hoping a
       fourteen-year-old works out which of two meanings a word carries in the
       middle of an input specification. */
    title: {
      kk: "Ұяшықты есептер алдында не дайын болуы керек",
      ru: "Что должно быть готово до того, как считать клетку",
    },
    body: {
      kk: "Торда сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін жүреміз: әр қадамда не бір ұяшық оңға, не бір ұяшық төмен. Әр ұяшық үшін бір сан сақтаймыз — `dp[r][c]`, яғни бастапқы ұяшықтан дәл сол ұяшыққа дейін неше түрлі жүру нұсқасы бар екені. Тордың көлденең қатарын «жол» дейміз, ал жүріп өткен жолды одан ажырату үшін «маршрут» дейміз.\n\n`dp[r][c]` мәні қайдан шығады? (r, c) ұяшығына кірер алдындағы соңғы қадам не жоғарыдан төмен, не солдан оңға жасалған — үшінші нұсқа жоқ. Сондықтан `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. Ұяшық қабырға болса, оған жетуге болмайды: `dp[r][c] = 0`. Бастапқы ұяшық бос болса, оған жету үшін бір ғана бос маршрут бар: `dp[0][0] = 1`.\n\nТолтыру реті осы формуладан шығады, оны жаттаудың қажеті жоқ: ұяшықты есептер алдында оның ЖОҒАРҒЫ көршісі мен СОЛ ЖАҚ көршісі есептеліп қойылуы керек. Жолдарды жоғарыдан төмен қарай, әр жолдың ішінде солдан оңға қарай жүрсек, екеуі де дайын болады.\n\nКестені былай құрамыз:\n\n```\nvector<vector<long long>> dp(n, vector<long long>(m, 0));\n```\n\nІшкі `vector<long long>(m, 0)` — m ұяшықтан тұратын, бәрі нөлге тең бір жол; сыртқы жақшадағы n — сондай жолдың саны. Наурызда `vector<vector<int>>` торларын жасағанбыз, жаңа нәрсе — толтыратын мән мен түр. Түр неге `long long`? Тор үлкейгенде маршруттар саны тез өседі: 20×20 торда ол 35 345 263 800 болады, ал `int` 2 147 483 647-де тоқтайды. Түрді нақты бір мысалға емес, сұрақтың өзіне қарап таңдаймыз.\n\nМұнда бір қауіп бар: барлық ұяшық басында нөлге тең, сондықтан әлі толтырылмаған ұяшықты оқысаң, бағдарлама қатемен тоқтамайды — ол жай ғана 0 оқиды да, дұрыс емес жауапты сабырмен шығарады.",
      ru: "В сетке мы идём из левой верхней клетки в правую нижнюю: на каждом шаге либо на одну клетку вправо, либо на одну клетку вниз. Для каждой клетки храним одно число — `dp[r][c]`, то есть сколько разных маршрутов ведёт из стартовой клетки именно в неё. Горизонтальный ряд сетки называем «строка», а пройденный путь, чтобы их не путать, — «маршрут».\n\nОткуда берётся значение `dp[r][c]`? Последний шаг перед входом в клетку (r, c) был сделан либо сверху вниз, либо слева направо — третьего варианта нет. Поэтому `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. Если клетка — стена, попасть в неё нельзя: `dp[r][c] = 0`. Если стартовая клетка свободна, в неё ведёт ровно один пустой маршрут: `dp[0][0] = 1`.\n\nПорядок заполнения вытекает из этой формулы, заучивать его не нужно: перед тем как считать клетку, уже должны быть посчитаны её ВЕРХНИЙ сосед и сосед СЛЕВА. Если идти по строкам сверху вниз, а внутри строки слева направо, оба соседа окажутся готовы.\n\nСаму таблицу строим так:\n\n```\nvector<vector<long long>> dp(n, vector<long long>(m, 0));\n```\n\nВнутреннее `vector<long long>(m, 0)` — одна строка из m клеток, все равны нулю; n во внешних скобках — сколько таких строк. Сетки `vector<vector<int>>` мы делали ещё в марте, новое здесь — значение заполнения и тип. Почему `long long`? Потому что с ростом сетки количество маршрутов растёт быстро: на сетке 20×20 оно равно 35 345 263 800, а `int` останавливается на 2 147 483 647. Тип выбирают не под конкретный пример, а под сам вопрос.\n\nЗдесь есть опасность: вначале все клетки равны нулю, поэтому при чтении ещё не заполненной клетки программа не остановится с ошибкой — она просто прочитает 0 и спокойно выведет неверный ответ.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n = 3;\n" +
      "    int m = 4;\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    dp[0][0] = 1;\n" +
      "    for (int c = 0; c < m; c++) {\n" +
      "        cout << dp[0][c] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    for (int c = 0; c < m; c++) {\n" +
      "        cout << dp[1][c] << \" \";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The one-dimensional case first, and it is also `precompute.prefix`: each
     * cell is the running answer of the cell before it. One row has only ONE
     * neighbour, so the fill order is forced and obvious — which is exactly why
     * it is worth two minutes before the two-dimensional table, where the order
     * is a decision.
     *
     * The wall matters here in a way it will not in `b6`: in a single row,
     * unreachability propagates forever, because there is no second dimension
     * to go round it. `b6` then shows the same wall being survived. The
     * contrast is the point, and it is why the same 5-wide shape is used twice.
     *
     * `int` and not `long long`: a single row of five cells can only ever hold
     * 0 or 1, and the type is not what this card is about.
     */
    id: "m8.l4.b2",
    type: "prediction",
    skillRefs: ["dp.table", "precompute.prefix", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір ғана жолдан тұратын тор берілген: `..#..` — үшінші ұяшық қабырға. Бағдарлама сол жақтағы ұяшықтан бастап әр ұяшыққа неше маршрутпен жетуге болатынын есептейді де, толған кестені бір жолға, сандарды бос орынмен бөліп шығарады. Экранға не шығады?",
      ru: "Дана сетка из одной строки: `..#..` — третья клетка стена. Программа считает, сколькими маршрутами можно попасть в каждую клетку, начиная с самой левой, и печатает заполненную таблицу одной строкой, разделяя числа пробелами. Что появится на экране?",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s = \"..#..\";\n" +
      "    int n = 5;\n" +
      "    vector<int> dp(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (s[i] == '#') {\n" +
      "            dp[i] = 0;\n" +
      "        } else {\n" +
      "            if (i == 0) {\n" +
      "                dp[i] = 1;\n" +
      "            } else {\n" +
      "                dp[i] = dp[i - 1];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << dp[i] << \" \";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    answer: "1 1 0 0 0",
    options: ["1 1 0 0 0", "1 1 0 1 1", "1 1 1 1 1", "1 2 0 0 0"],
    diagnosticMapping: {
      /* Only this one is mapped. `1 1 1 1 1` contradicts the `'#'` branch
         that is on the screen, so choosing it means the code was not read at
         all — several causes, no diagnosis. `1 2 0 0 0` is the addition
         from the two-dimensional formula misapplied to one dimension, which is
         also reachable by simple miscounting. */
      "1 1 0 1 1": {
        failureClass: "unreachability_not_propagated",
        justification:
          "Бұл жауапта қабырғадан кейінгі екі ұяшық қайтадан 1 болып тұр. Оны алу үшін бос ұяшыққа `dp[i - 1]` емес, тұрақты 1 жазу керек — яғни оқушы қабырғаны тек өз ұяшығын жабатын кедергі деп есептеген. Кестенің мәні дәл осында: жетуге болмайтындық солға қарай емес, ОҢҒА қарай таралады, сондықтан нөл әрі қарай көшеді.",
      },
    },
  },
  {
    id: "m8.l4.b3",
    type: "worked_example",
    skillRefs: ["dp.table", "dp.core", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: 3×4 тордың кестесі",
      ru: "Разобранный пример: таблица для сетки 3×4",
    },
    problem: {
      kk: "Тор 3 жол мен 4 бағаннан тұрады, екінші жолдағы бір ұяшық — қабырға:\n\n`....`\n`.#..`\n`....`\n\nСол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін тек оңға және төмен жүріп, неше түрлі маршрутпен жетуге болады? Кестені толық толтырып шығамыз.",
      ru: "Сетка состоит из 3 строк и 4 столбцов, одна клетка во второй строке — стена:\n\n`....`\n`.#..`\n`....`\n\nСколькими разными маршрутами можно добраться из левой верхней клетки в правую нижнюю, двигаясь только вправо и вниз? Заполним таблицу целиком.",
    },
    steps: [
      {
        kk: "Кестені құрамыз: 3 жол, 4 баған, барлық ұяшық нөл. `dp[r][c]` — бастаудан (r, c) ұяшығына дейінгі маршрут саны. Жолдар жоғарыдан 0-ден, бағандар солдан 0-ден саналады.",
        ru: "Строим таблицу: 3 строки, 4 столбца, все клетки нулевые. `dp[r][c]` — число маршрутов из старта в клетку (r, c). Строки нумеруются сверху с 0, столбцы слева с 0.",
      },
      {
        kk: "Бірінші жол. `dp[0][0] = 1` — бастапқы ұяшық. Қалған үш ұяшыққа тек солдан келуге болады (жоғарыда ештеңе жоқ), сондықтан әрқайсысы солындағыны қайталайды: жол «1 1 1 1» болады.",
        ru: "Первая строка. `dp[0][0] = 1` — стартовая клетка. В остальные три клетки можно попасть только слева (сверху ничего нет), поэтому каждая повторяет соседа слева: строка получается «1 1 1 1».",
      },
      {
        kk: "Екінші жол. `dp[1][0]` — тек жоғарыдан, 1. `dp[1][1]` — қабырға, 0. `dp[1][2] = dp[0][2] + dp[1][1] = 1 + 0 = 1`. `dp[1][3] = dp[0][3] + dp[1][2] = 1 + 1 = 2`. Жол: «1 0 1 2».",
        ru: "Вторая строка. `dp[1][0]` — только сверху, 1. `dp[1][1]` — стена, 0. `dp[1][2] = dp[0][2] + dp[1][1] = 1 + 0 = 1`. `dp[1][3] = dp[0][3] + dp[1][2] = 1 + 1 = 2`. Строка: «1 0 1 2».",
      },
      {
        kk: "Үшінші жол. `dp[2][0] = 1`. `dp[2][1] = dp[1][1] + dp[2][0] = 0 + 1 = 1` — қабырғаның астынан тек солдан айналып өтуге болады. `dp[2][2] = 1 + 1 = 2`, `dp[2][3] = 2 + 2 = 4`. Жол: «1 1 2 4».",
        ru: "Третья строка. `dp[2][0] = 1`. `dp[2][1] = dp[1][1] + dp[2][0] = 0 + 1 = 1` — под стену можно зайти только слева, в обход. `dp[2][2] = 1 + 1 = 2`, `dp[2][3] = 2 + 2 = 4`. Строка: «1 1 2 4».",
      },
      {
        kk: "Жауап — соңғы ұяшықтағы сан: 4. Қабырға болмағанда 10 болар еді, демек жалғыз ұяшық алты маршрутты жойған. Ең бастысы: 12 ұяшықтың әрқайсысын дәл бір рет есептедік, ешқайсысын екінші рет қарамадық.",
        ru: "Ответ — число в последней клетке: 4. Без стены было бы 10, значит одна-единственная клетка уничтожила шесть маршрутов. Самое важное: каждую из 12 клеток мы посчитали ровно один раз и ни к одной не возвращались.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<string> g;\n" +
      "    g.push_back(\"....\");\n" +
      "    g.push_back(\".#..\");\n" +
      "    g.push_back(\"....\");\n" +
      "    int n = 3;\n" +
      "    int m = 4;\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (g[r][c] == '#') {\n" +
      "                dp[r][c] = 0;\n" +
      "            } else if (r == 0 && c == 0) {\n" +
      "                dp[r][c] = 1;\n" +
      "            } else {\n" +
      "                long long up = 0;\n" +
      "                long long left = 0;\n" +
      "                if (r > 0) {\n" +
      "                    up = dp[r - 1][c];\n" +
      "                }\n" +
      "                if (c > 0) {\n" +
      "                    left = dp[r][c - 1];\n" +
      "                }\n" +
      "                dp[r][c] = up + left;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            cout << dp[r][c] << \" \";\n" +
      "        }\n" +
      "        cout << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Экранға үш жол шығады: `1 1 1 1`, содан кейін `1 0 1 2`, содан кейін `1 1 2 4`. Жауап — соңғы жолдың соңғы саны: 4.",
      ru: "На экран выйдут три строки: `1 1 1 1`, затем `1 0 1 2`, затем `1 1 2 4`. Ответ — последнее число последней строки: 4.",
    },
  },
  {
    /*
     * The block that closes February. The programme does not ask for it in so
     * many words, but `m6.l6.b8`'s own comment promised it — «April fills the
     * same recurrence in as a table and watches the repeated calls disappear» —
     * and the month's mastery sentence («кіші жағдайлар үшін табылған
     * жауаптарды пайдаланып») is the same claim from the other side.
     *
     * The counter travels as a REFERENCE parameter, which is November's `&`
     * used for exactly what November taught it for: a function that has to
     * change something belonging to its caller. A global would work and is not
     * used — nothing in Year 1 needs one, and the reference says what it means.
     *
     * Numbers verified by running the program: 19 calls for a 3×4 grid whose
     * table has 12 cells, and 6863 calls for 8×8 whose table has 64.
     */
    id: "m8.l4.b4",
    type: "concept",
    skillRefs: ["recursion.core", "dp.table", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Ақпандағы рекурсия және бүгінгі кесте — бір формула",
      ru: "Февральская рекурсия и сегодняшняя таблица — одна формула",
    },
    body: {
      kk: "Ақпанда сен дәл осы есепті рекурсиямен шығардың: `paths(r, c) = paths(r - 1, c) + paths(r, c - 1)`. Формула сол қалпында — бүгін өзгергені формула емес, ЖҰМЫСТЫҢ РЕТІ.\n\nТөмендегі бағдарлама — сол ақпандағы функцияң, оған бір ғана нәрсе қосылды: `cnt` айнымалысы шақырулардың санын жинайды. Ол функцияға `long long &cnt` деп, яғни сілтеме арқылы беріледі — қарашада көрсетілгендей, функция шақырушының айнымалысын өзгерте алуы үшін. 3×4 тор үшін бағдарлама екі сан шығарады: 10 — маршрут саны, 19 — функцияның шақырылу саны. Ал кестеде бар болғаны 12 ұяшық бар. 8×8 тор үшін айырма қорқынышты болады: кестеде 64 ұяшық, ал рекурсия 6863 рет шақырылады.\n\nСебебі қарапайым: рекурсия бір ұяшықтың жауабын бірнеше рет қайта есептейді, өйткені оған жоғарыдан да, солдан да қайта соғады. Кесте әр ұяшықты бір рет есептеп, жауабын жазып қояды — сол жазып қою ғана артық жұмысты жояды. Есеп те, формула да сол күйінде қалды.",
      ru: "В феврале ты решал ровно эту задачу рекурсией: `paths(r, c) = paths(r - 1, c) + paths(r, c - 1)`. Формула осталась той же — сегодня изменилась не формула, а ПОРЯДОК РАБОТЫ.\n\nПрограмма ниже — та самая февральская функция, к ней добавлено ровно одно: переменная `cnt` копит число вызовов. Она передаётся в функцию как `long long &cnt`, то есть по ссылке, — как показывали в ноябре, чтобы функция могла менять переменную вызывающего. Для сетки 3×4 программа печатает два числа: 10 — количество маршрутов и 19 — сколько раз вызвана функция. А в таблице всего 12 клеток. Для сетки 8×8 разрыв становится страшным: в таблице 64 клетки, а рекурсия вызывается 6863 раза.\n\nПричина простая: рекурсия пересчитывает ответ для одной и той же клетки по нескольку раз, потому что приходит в неё и сверху, и слева. Таблица считает каждую клетку один раз и записывает ответ — именно эта запись и убирает лишнюю работу. Ни задача, ни формула при этом не изменились.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long paths(int r, int c, long long &cnt) {\n" +
      "    cnt = cnt + 1;\n" +
      "    if (r == 1 || c == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return paths(r - 1, c, cnt) + paths(r, c - 1, cnt);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    long long cnt = 0;\n" +
      "    cout << paths(3, 4, cnt) << endl;\n" +
      "    cout << cnt;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * "Which order is valid" would have had THREE correct answers: row by row,
     * column by column and diagonal by diagonal all write both predecessors
     * before the cell that needs them. So the question is inverted, and the
     * three valid orders become the distractors — which is the stronger task
     * anyway, because a learner who has memorised «жолдар жоғарыдан төмен» as
     * a rule rather than derived it will reject the column order on sight.
     *
     * Verified by hand and by the same reasoning the block states: (r, c) needs
     * (r-1, c) and (r, c-1). Column order does both. Diagonal order does both
     * (each predecessor has r + c one smaller). Right-to-left inside a row
     * leaves (r, c-1) unwritten, so the cell adds a zero that means nothing.
     */
    id: "m8.l4.b5",
    type: "multiple_choice",
    skillRefs: ["dp.table", "dp.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Торда n жол мен m баған бар, әр ұяшық `dp[r-1][c]` (жоғарғы көрші) мен `dp[r][c-1]` (сол жақтағы көрші) мәндерін қосады. Кестені толтырудың төрт реті ұсынылған. Қайсысы ДҰРЫС ЕМЕС жауап береді?",
      ru: "В сетке n строк и m столбцов, каждая клетка складывает `dp[r-1][c]` (сосед сверху) и `dp[r][c-1]` (сосед слева). Предложены четыре порядка заполнения таблицы. Какой из них даст НЕВЕРНЫЙ ответ?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Жолдар жоғарыдан төмен, әр жолдың ішінде солдан оңға",
          ru: "Строки сверху вниз, внутри каждой строки слева направо",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Бағандар солдан оңға, әр бағанның ішінде жоғарыдан төмен",
          ru: "Столбцы слева направо, внутри каждого столбца сверху вниз",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Жолдар жоғарыдан төмен, әр жолдың ішінде оңнан солға",
          ru: "Строки сверху вниз, внутри каждой строки справа налево",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Диагональ бойынша: алдымен `r + c` қосындысы 0-ге тең ұяшық, сосын `r + c` 1-ге тең ұяшықтар, сосын 2-ге тең ұяшықтар және әрі қарай",
          ru: "По диагоналям: сначала клетка с суммой `r + c`, равной 0, потом клетки с `r + c`, равной 1, потом равной 2, и так далее",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      o2: {
        failureClass: "fill_order_memorised_not_derived",
        justification:
          "Бағандар бойынша толтырғанда да екі көрші дайын: `dp[r][c-1]` алдыңғы бағанда, `dp[r-1][c]` дәл сол бағанның жоғарғы жағында тұр. Демек бұл ретті қате деп таңдау ұяшыққа не керек екенін емес, сабақта көрсетілген циклдің сыртқы түрін ереже деп есте сақтағанды білдіреді.",
      },
    },
  },
  {
    /*
     * One row of a two-row table, with the wall inside the row being filled.
     * The first row is handed over already filled, so the learner is doing
     * exactly the work the fill order exists to make possible: reading the row
     * above and the cell to the left.
     *
     * It answers `b2` head on. In one dimension the wall zeroed everything
     * after it; here `row1[2]` recovers to 1 because the value comes down from
     * above. That is the second dimension doing something visible, and it is
     * the reason the same width and the same wall position are reused.
     */
    id: "m8.l4.b6",
    type: "trace_code",
    skillRefs: ["dp.table", "grid.cells", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Тордың екі жолы бар, әрқайсысында 5 ұяшық. Бірінші жол толтырылып қойған: `row0` — бесеуі де 1. Екінші жолдың ұяшықтары `.#...` — екінші ұяшық қабырға. Қағазға үш баған сыз: `c`, `row1[c]`, `row1`. Циклдің әр айналымында `row1[c]`-ға мән жазылған сәттегі күйді жаз (13-жол немесе 20-жол), ең соңғы жолға 23-жолдағы күйді жаз. `row1` бағанына бүкіл жолды бос орынмен бөліп жаз. Ескерт: `up` — үстіңгі жолдан, `left` — дәл осы жолдағы сол жақ көршіден.",
      ru: "В сетке две строки, в каждой по 5 клеток. Первая строка уже заполнена: в `row0` все пять чисел равны 1. Клетки второй строки — `.#...`, вторая клетка стена. Начерти на бумаге три столбца: `c`, `row1[c]`, `row1`. На каждом обороте цикла записывай состояние в момент, когда в `row1[c]` записано значение (строка 13 или строка 20), а в последнюю строку — состояние на строке 23. В столбце `row1` выписывай всю строку целиком, разделяя числа пробелами. Помни: `up` берётся из верхней строки, `left` — у соседа слева в этой же строке.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<long long> row0(5, 1);\n" +
      "    string g = \".#...\";\n" +
      "    int m = 5;\n" +
      "    vector<long long> row1(m, 0);\n" +
      "    for (int c = 0; c < m; c++) {\n" +
      "        if (g[c] == '#') {\n" +
      "            row1[c] = 0;\n" +
      "        } else {\n" +
      "            long long up = row0[c];\n" +
      "            long long left = 0;\n" +
      "            if (c > 0) {\n" +
      "                left = row1[c - 1];\n" +
      "            }\n" +
      "            row1[c] = up + left;\n" +
      "        }\n" +
      "    }\n" +
      "    for (int c = 0; c < m; c++) {\n" +
      "        cout << row1[c] << \" \";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 20, vars: { c: "0", "row1[c]": "1", row1: "1 0 0 0 0" } },
      { line: 13, vars: { c: "1", "row1[c]": "0", row1: "1 0 0 0 0" } },
      { line: 20, vars: { c: "2", "row1[c]": "1", row1: "1 0 1 0 0" } },
      { line: 20, vars: { c: "3", "row1[c]": "2", row1: "1 0 1 2 0" } },
      { line: 20, vars: { c: "4", "row1[c]": "3", row1: "1 0 1 2 3" } },
      { line: 23, vars: { c: "4", "row1[c]": "3", row1: "1 0 1 2 3" } },
    ],
  },
  {
    /*
     * The wrong fill order as a defect, and it is the worst kind: no crash, no
     * warning, a full and plausible table that is simply not the answer. The
     * table was created with `, 0`, so reading a cell that has not been written
     * is a legal read of a legal number.
     *
     * The program deliberately has NO grid: it counts routes on an empty n×m
     * rectangle and prints the whole table. That keeps the repaired program
     * from being three quarters of `b9`'s answer — `b9` still has to read the
     * `.`/`#` rows and handle the wall, which is the half this card never
     * shows. It also makes the symptom easier to read, because every number in
     * a correct table is non-zero.
     *
     * symptomInput "3 3" is REQUIRED and not a nicety. The fallback probe feeds
     * one number at a time; in C++ the second `cin >>` then fails and leaves
     * `m` at 0, so both halves would build a zero-sized table and write past
     * its end in exactly the same way — undefined behaviour twice over, and a
     * "these two behave identically" verdict on a real defect.
     *
     * On `3 3` the broken program prints 1 1 1 / 1 1 1 / 0 0 0 and the repaired
     * one prints 1 1 1 / 1 2 3 / 1 3 6. The bottom row is zero because it was
     * computed FIRST, when everything above it was still zero.
     */
    id: "m8.l4.b7",
    type: "find_bug",
    skillRefs: ["dp.table", "debug.boundary", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама қабырғасыз n×m торда әр ұяшыққа неше маршрутпен жетуге болатынын есептеп, кестені жол-жолымен шығаруы керек. Ол қатемен тоқтамайды, экранға толық кесте шығарады — бірақ сандар дұрыс емес. `3 3` берсең, ол `1 1 1`, `1 1 1`, `0 0 0` шығарады, ал дұрысы — `1 1 1`, `1 2 3`, `1 3 6`. Соңғы жол неге түгел нөл? Қай жол қате және неге бағдарлама бұл қатеге шағымданбайды?",
      ru: "Эта программа должна посчитать, сколькими маршрутами можно попасть в каждую клетку сетки n×m без стен, и вывести таблицу построчно. Она не падает с ошибкой и печатает полную таблицу — но числа неверные. Если дать ей `3 3`, она выведет `1 1 1`, `1 1 1`, `0 0 0`, а правильный ответ — `1 1 1`, `1 2 3`, `1 3 6`. Почему последняя строка сплошь нулевая? Какая строка кода неверна и почему программа никак не жалуется на эту ошибку?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    dp[0][0] = 1;\n" +
      "    for (int r = n - 1; r >= 0; r--) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (r > 0) {\n" +
      "                dp[r][c] = dp[r][c] + dp[r - 1][c];\n" +
      "            }\n" +
      "            if (c > 0) {\n" +
      "                dp[r][c] = dp[r][c] + dp[r][c - 1];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            cout << dp[r][c] << \" \";\n" +
      "        }\n" +
      "        cout << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 10,
    symptomInput: "3 3",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    dp[0][0] = 1;\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (r > 0) {\n" +
      "                dp[r][c] = dp[r][c] + dp[r - 1][c];\n" +
      "            }\n" +
      "            if (c > 0) {\n" +
      "                dp[r][c] = dp[r][c] + dp[r][c - 1];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            cout << dp[r][c] << \" \";\n" +
      "        }\n" +
      "        cout << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "9": {
        failureClass: "start_cell_blamed_for_a_fill_order_defect",
        justification:
          "9-жолдағы `dp[0][0] = 1` дұрыс: бастапқы ұяшыққа бір ғана бос маршрут апарады. Бұл жауап нөлдердің себебін бастапқы мәннен іздегенді көрсетеді, ал шын себеп — жолдардың толтырылу реті: төменгі жол бәрінен бұрын, әлі ештеңе жазылмай тұрып есептеледі.",
      },
    },
  },
  {
    /*
     * The recurrence and the blocked-cell case, but for the walk from the
     * BOTTOM-LEFT corner to the TOP-RIGHT one — right and up instead of right
     * and down.
     *
     * Written this way on purpose. A blank-filling exercise on the standard
     * orientation would have a completed template identical to `b9`'s answer,
     * which is the defect the first adversarial review found most often: the
     * task whose answer is already on screen. Turning the walk upside down
     * makes every blank a decision the learner has to derive rather than copy,
     * and the decision is precisely this lesson's objective — the fill order
     * follows the recurrence, and the recurrence follows the direction of the
     * walk. The row loop is given, running from the bottom, so the learner can
     * read the order off the code and then work out which neighbours it makes
     * available.
     *
     * The fourth blank is the one that catches a learner who filled the first
     * three by pattern-matching: which cell of the finished table is the
     * answer? Not the bottom right one any more.
     *
     * The first blank is a CHARACTER literal, `'#'`, not a string — the grid
     * row is a `string` and `g[r][c]` is one `char`. That distinction is C++'s
     * and it belongs in a blank rather than in a footnote.
     */
    id: "m8.l4.b8",
    type: "fill_blank",
    skillRefs: ["dp.table", "dp.core", "grid.cells"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл жолы маршрут СОЛ ЖАҚ ТӨМЕНГІ ұяшықтан басталып, ОҢ ЖАҚ ЖОҒАРҒЫ ұяшықта аяқталады, ал әр қадамда тек бір ұяшық оңға немесе бір ұяшық ЖОҒАРЫ жүруге болады. Бағдарламада төрт орын жоқ. Циклге қара: жолдар төменнен жоғары қарай толтырылады — демек ұяшықты есептер сәтте оның қай екі көршісі дайын болады? Соңғы бос орында жауап тұрған ұяшықты жаз. Бірінші бос орынға абайла: `g[r][c]` — бір ғана таңба, ал бір таңба C++-та қос тырнақшамен емес, жалғыз тырнақшамен жазылады. Кіріс: бірінші жолда n және m, келесі n жолда m таңба (`.` — бос, `#` — қабырға).",
      ru: "На этот раз маршрут начинается в ЛЕВОЙ НИЖНЕЙ клетке и заканчивается в ПРАВОЙ ВЕРХНЕЙ, а на каждом шаге разрешено идти только на одну клетку вправо или на одну клетку ВВЕРХ. В программе не хватает четырёх мест. Посмотри на цикл: строки заполняются снизу вверх — значит, какие два соседа готовы к моменту, когда считается клетка? В последнем пропуске укажи клетку, в которой стоит ответ. С первым пропуском будь внимателен: `g[r][c]` — это один символ, а одиночный символ в C++ пишется не в двойных кавычках, а в одинарных. Ввод: в первой строке n и m, в следующих n строках по m символов (`.` — свободно, `#` — стена).",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        g.push_back(row);\n" +
      "    }\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int r = n - 1; r >= 0; r--) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (g[r][c] == ___) {\n" +
      "                dp[r][c] = 0;\n" +
      "            } else if (r == n - 1 && c == 0) {\n" +
      "                dp[r][c] = 1;\n" +
      "            } else {\n" +
      "                long long down = 0;\n" +
      "                long long left = 0;\n" +
      "                if (r < n - 1) {\n" +
      "                    down = dp[___][c];\n" +
      "                }\n" +
      "                if (c > 0) {\n" +
      "                    left = dp[r][___];\n" +
      "                }\n" +
      "                dp[r][c] = down + left;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ___;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "'#'" },
      { id: "f2", answer: "r + 1", alternatives: ["r+1"] },
      { id: "f3", answer: "c - 1", alternatives: ["c-1"] },
      { id: "f4", answer: "dp[0][m - 1]", alternatives: ["dp[0][m-1]"] },
    ],
  },
  {
    /*
     * The PDF family: «тордағы жолдар санын есептеу».
     *
     * The method is stated as advice and the prompt says so in both languages —
     * option 3 of the authoring contract's three, with the written half sent to
     * `b11` and to the month's assessment. Twelve by twelve is small enough
     * that a slow enumeration would also pass, so claiming the table is
     * required would be a rule the product does not enforce.
     *
     * The degenerate programs, and the case that kills each. Every one of these
     * was written out and run against the case list:
     *   - walls ignored entirely (the plain binomial count) → "3 3 / .#. / ...
     *     / ..." gives 6 instead of 3, and seven other hidden cases
     *   - the whole first row and first column pre-seeded to 1 without looking
     *     at the walls in them → "1 5 / ..#.." gives 1 instead of 0, and
     *     "3 3 / .#. / ... / ..." gives 6 instead of 3
     *   - `dp[0][0] = 1` written unconditionally, so a blocked start is not
     *     noticed → "1 1 / #" gives 1 instead of 0, "2 2 / #. / .." gives 2
     *   - rows filled bottom to top (b7's bug) → any wall-free grid: "3 3"
     *     free gives 0 instead of 6
     *   - each row filled right to left (b5's wrong option) → the same
     *   - the answer printed from dp[0][0] or from the wrong corner → every
     *     case with n ≠ m
     * The first and last positions both carry a wall somewhere in the set, and
     * both one-row and one-column grids are present with and without a wall, so
     * a solution that special-cases a single row survives one and dies on the
     * other.
     */
    id: "m8.l4.b9",
    type: "write_code",
    skillRefs: ["dp.table", "dp.core", "grid.cells", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін неше түрлі маршрут бар екенін тап. Әр қадамда тек бір ұяшық оңға немесе бір ұяшық төмен жүруге болады, қабырғаға түсуге болмайды.\n\nКіріс: бірінші жолда бос орынмен бөлінген n және m — тордың жол саны мен баған саны (1 ≤ n ≤ 12, 1 ≤ m ≤ 12). Келесі n жолдың әрқайсысында m таңба: `.` — бос ұяшық, `#` — қабырға. Шығыс: бір бүтін сан.\n\nШекаралар: бастапқы немесе соңғы ұяшықтың өзі қабырға болуы мүмкін — ондай жағдайда жауап 0. Бір ғана бос ұяшықтан тұратын тор үшін жауап 1. Жол мүлдем болмаса, 0 шығар.\n\nБүгінгі әдіспен жаз: кесте құрып, жолдарды жоғарыдан төмен, әр жолдың ішінде солдан оңға толтыр. Кестені `long long` етіп ал: тор үлкейгенде маршруттар саны `int`-тен асып кетеді, ал дәл осы бағдарламаны кейін үлкенірек торға да қолданасың. Тексеруші тек шыққан санды салыстыратынын білесің — демек толтыру реті машина тексеретін ереже емес, кеңес; кестең туралы сұрақты мұғалім қояды.",
      ru: "Найди, сколько разных маршрутов ведёт из левой верхней клетки в правую нижнюю. На каждом шаге разрешено пройти только на одну клетку вправо или на одну клетку вниз, наступать на стену нельзя.\n\nВвод: в первой строке через пробел n и m — количество строк и столбцов сетки (1 ≤ n ≤ 12, 1 ≤ m ≤ 12). В следующих n строках по m символов: `.` — свободная клетка, `#` — стена. Вывод: одно целое число.\n\nГраницы: стартовая или конечная клетка сама может оказаться стеной — тогда ответ 0. Для сетки из одной свободной клетки ответ 1. Если пути нет вовсе, выведи 0.\n\nПиши сегодняшним способом: построй таблицу и заполняй строки сверху вниз, а внутри строки слева направо. Таблицу бери из `long long`: с ростом сетки количество маршрутов вылезает за `int`, а эту же программу ты потом применишь и к сетке побольше. Ты знаешь, что проверяющая программа сравнивает только выведенное число, — значит, порядок заполнения не правило, которое проверяет машина, а совет; про твою таблицу спросит учитель.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        g.push_back(row);\n" +
      "    }\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (g[r][c] == '#') {\n" +
      "                dp[r][c] = 0;\n" +
      "            } else if (r == 0 && c == 0) {\n" +
      "                dp[r][c] = 1;\n" +
      "            } else {\n" +
      "                long long up = 0;\n" +
      "                long long left = 0;\n" +
      "                if (r > 0) {\n" +
      "                    up = dp[r - 1][c];\n" +
      "                }\n" +
      "                if (c > 0) {\n" +
      "                    left = dp[r][c - 1];\n" +
      "                }\n" +
      "                dp[r][c] = up + left;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 3\n...\n.#.\n...", expectedOutput: "2" },
      { input: "3 3\n...\n...\n...", expectedOutput: "6", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      { input: "2 2\n#.\n..", expectedOutput: "0", hidden: true },
      { input: "2 2\n..\n.#", expectedOutput: "0", hidden: true },
      { input: "1 5\n..#..", expectedOutput: "0", hidden: true },
      { input: "1 6\n......", expectedOutput: "1", hidden: true },
      { input: "5 1\n.\n.\n#\n.\n.", expectedOutput: "0", hidden: true },
      { input: "3 3\n.#.\n...\n...", expectedOutput: "3", hidden: true },
      { input: "3 3\n...\n#..\n...", expectedOutput: "3", hidden: true },
      {
        input: "4 5\n.....\n.###.\n.....\n.....",
        expectedOutput: "6",
        hidden: true,
      },
      {
        input: "6 6\n......\n......\n......\n......\n......\n......",
        expectedOutput: "252",
        hidden: true,
      },
      {
        input:
          "12 12\n............\n............\n............\n............\n............\n............\n............\n............\n............\n............\n............\n............",
        expectedOutput: "705432",
        hidden: true,
      },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m8.l4.b9, not an extra block beside it. PDF p.6:
     * «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ».
     *
     * The starting program is the one this learner FINISHED on the previous
     * card — `b8`'s completed template, which is on every route. That is the
     * one legitimate direction for a modify_code: forwards, from work already
     * done, never from work about to be asked for. Nothing new appears on the
     * screen; what changes is the direction of the walk, and with it all four
     * decisions the lesson is about — which cell holds 1, which two neighbours
     * a cell adds, which way the rows are filled, and which cell is the answer.
     *
     * Same problem and the same case list as b9, minus the 12×12 grid, which on
     * this route measures patience rather than understanding.
     */
    id: "m8.l4.b9s",
    type: "modify_code",
    skillRefs: ["dp.table", "dp.core", "grid.cells"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Алдыңғы тапсырмада сен толықтырған бағдарлама алдыңда тұр: ол сол жақ ТӨМЕНГІ ұяшықтан оң жақ ЖОҒАРҒЫ ұяшыққа дейінгі маршруттарды санайды (оңға және жоғары жүріп). Оны әдеттегі бағытқа ауыстыр: маршрут сол жақ ЖОҒАРҒЫ ұяшықтан басталып, оң жақ ТӨМЕНГІ ұяшықта аяқталсын, ал қадамдар оңға және төмен болсын.\n\nТөрт жері өзгереді, оларды өзің тап: (1) қай ұяшыққа 1 жазылады, (2) ұяшық қай екі көршісін қосады, (3) жолдар қай бағытта толтырылады, (4) соңында қай ұяшық шығарылады. Кіріс пен шығыс сол күйінде: бірінші жолда n және m (1 ≤ n ≤ 12, 1 ≤ m ≤ 12), келесі n жолда m таңба (`.` — бос, `#` — қабырға), жауап — бір бүтін сан. Бастапқы немесе соңғы ұяшық қабырға болса, жауап 0.",
      ru: "Перед тобой программа, которую ты дополнил в прошлом задании: она считает маршруты из левой НИЖНЕЙ клетки в правую ВЕРХНЮЮ (шаги вправо и вверх). Переделай её на обычное направление: маршрут начинается в левой ВЕРХНЕЙ клетке и заканчивается в правой НИЖНЕЙ, а шаги — вправо и вниз.\n\nИзменятся четыре места, найди их сам: (1) в какую клетку записывается 1, (2) каких двух соседей складывает клетка, (3) в каком направлении заполняются строки, (4) какая клетка выводится в конце. Ввод и вывод те же: в первой строке n и m (1 ≤ n ≤ 12, 1 ≤ m ≤ 12), в следующих n строках по m символов (`.` — свободно, `#` — стена), ответ — одно целое число. Если стартовая или конечная клетка — стена, ответ 0.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        g.push_back(row);\n" +
      "    }\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int r = n - 1; r >= 0; r--) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (g[r][c] == '#') {\n" +
      "                dp[r][c] = 0;\n" +
      "            } else if (r == n - 1 && c == 0) {\n" +
      "                dp[r][c] = 1;\n" +
      "            } else {\n" +
      "                long long down = 0;\n" +
      "                long long left = 0;\n" +
      "                if (r < n - 1) {\n" +
      "                    down = dp[r + 1][c];\n" +
      "                }\n" +
      "                if (c > 0) {\n" +
      "                    left = dp[r][c - 1];\n" +
      "                }\n" +
      "                dp[r][c] = down + left;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[0][m - 1];\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        g.push_back(row);\n" +
      "    }\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (g[r][c] == '#') {\n" +
      "                dp[r][c] = 0;\n" +
      "            } else if (r == 0 && c == 0) {\n" +
      "                dp[r][c] = 1;\n" +
      "            } else {\n" +
      "                long long up = 0;\n" +
      "                long long left = 0;\n" +
      "                if (r > 0) {\n" +
      "                    up = dp[r - 1][c];\n" +
      "                }\n" +
      "                if (c > 0) {\n" +
      "                    left = dp[r][c - 1];\n" +
      "                }\n" +
      "                dp[r][c] = up + left;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Nine of the earlier cases are unchanged by flipping the grid vertically, so the
         UNMODIFIED program passed them. This one is not symmetric: the given program answers 0
         where the required one answers 2. */
      { input: "3 3\n...\n#..\n.#.", expectedOutput: "2", hidden: true },
      { input: "3 3\n...\n.#.\n...", expectedOutput: "2" },
      { input: "3 3\n...\n...\n...", expectedOutput: "6", hidden: true },
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      { input: "2 2\n#.\n..", expectedOutput: "0", hidden: true },
      { input: "2 2\n..\n.#", expectedOutput: "0", hidden: true },
      { input: "1 5\n..#..", expectedOutput: "0", hidden: true },
      { input: "5 1\n.\n.\n#\n.\n.", expectedOutput: "0", hidden: true },
      { input: "3 3\n.#.\n...\n...", expectedOutput: "3", hidden: true },
      { input: "2 3\n...\n...", expectedOutput: "3", hidden: true },
      {
        input: "4 5\n.....\n.###.\n.....\n.....",
        expectedOutput: "6",
        hidden: true,
      },
    ],
  },
  {
    /*
     * The harder problem for «Негізгі» («қалауы бойынша 1-2 күрделірек есеп»)
     * and for «Тереңдетілген» («күрделі есептер блогына көшу»). Not a PDF
     * family, so `product-authored` with no page: the tracks are the
     * programme's decision, the problem is ours.
     *
     * It also joins the month's two halves. The greedy walk — «әр қадамда
     * арзанырақ көршіні таңда» — is exactly the kind of plausible rule April
     * spends two lessons breaking, and here the data breaks it: on the visible
     * sample it answers 8 against a true 6, on "3 3 / 1 2 5 / 1 9 5 / 8 9 5" it
     * answers 24 against 18, and on "3 4 / 1 2 2 2 / 1 9 9 2 / 8 9 9 2" it
     * answers 30 against 11. This is the one place in the lesson where option 1
     * of the contract applies honestly: the wrong method cannot pass, because
     * of the cases and not because of a sentence in the prompt.
     *
     * The other degenerate programs and their killers, all executed:
     *   - the fixed path along the top row then down the last column → the
     *     diagonal grid "3 3 / 1 9 9 / 1 1 9 / 9 1 1" (29 against 5)
     *   - the fixed path down the first column then along the bottom row →
     *     "3 3 / 1 2 5 / 1 9 5 / 8 9 5" and three others
     *   - `max` where `min` belongs → the same case, and three others
     *   - the start cell's own cost forgotten → "1 1 / 7" prints 0, and eight
     *     other cases shift
     * A single row, a single column, a 1×1 grid and an all-zero grid are all
     * present: they are where a solution that assumes both neighbours exist
     * falls over.
     *
     * `int` throughout, and honestly: 10 × 10 cells at 99 each is at most 1881.
     * The prompt still warns about `min`'s one hard rule — both arguments must
     * be the same type — because that is the error a learner meets the moment
     * they mix a literal with a wider accumulator, and it is a compile error
     * rather than a wrong number.
     */
    id: "m8.l4.b10",
    type: "challenge",
    skillRefs: ["dp.table", "dp.core", "greedy.counterexample", "grid.cells"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Тордың әр ұяшығында сол ұяшыққа кірудің құны жазылған. Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін тек оңға және төмен жүресің. Маршруттың құны — сол маршрут өтетін барлық ұяшық құнының қосындысы, бастапқы және соңғы ұяшық та қосылады. Ең арзан маршруттың құнын шығар.\n\nКіріс: бірінші жолда бос орынмен бөлінген n және m (1 ≤ n ≤ 10, 1 ≤ m ≤ 10), келесі n жолдың әрқайсысында бос орынмен бөлінген m бүтін сан — ұяшықтардың құны (0 ≤ құн ≤ 99). Шығыс: бір сан.\n\nАбайла: «әр қадамда арзанырақ көршіні таңда» деген ашкөз ереже мұнда жұмыс істемейді. Көрсетілген мысалда ол 8 береді, ал шын жауап 6. Себебін ойлан: ұяшықта оның өз құны емес, сол ұяшыққа дейінгі ЕҢ АРЗАН маршруттың құны сақталуы керек.\n\nЕкі санның кішісін `min(a, b)` қайтарады, ол `#include <algorithm>` арқылы келеді. Бір ережесі бар: `min`-нің екі аргументі де БІР ТҮРДЕ болуға тиіс. `min(0, x)` дегенде `x` `long long` болса, бағдарлама тіпті компиляцияланбайды — қате жол нөмірімен бірге көрінеді. Мұндағы барлық сан `int`, ең үлкен жауап 1881-ден аспайды, сондықтан бәрін `int` етіп ұстасаң жеткілікті.",
      ru: "В каждой клетке сетки записана стоимость входа в эту клетку. Из левой верхней клетки в правую нижнюю ты идёшь только вправо и вниз. Стоимость маршрута — сумма стоимостей всех клеток, через которые он проходит, включая стартовую и конечную. Выведи стоимость самого дешёвого маршрута.\n\nВвод: в первой строке через пробел n и m (1 ≤ n ≤ 10, 1 ≤ m ≤ 10), в следующих n строках по m целых чисел через пробел — стоимости клеток (0 ≤ стоимость ≤ 99). Вывод: одно число.\n\nОсторожно: жадное правило «на каждом шаге выбирай соседа подешевле» здесь не работает. На показанном примере оно даёт 8, а верный ответ — 6. Подумай почему: в клетке нужно хранить не её собственную стоимость, а стоимость САМОГО ДЕШЁВОГО маршрута до неё.\n\nМеньшее из двух чисел возвращает `min(a, b)`, он приходит из `#include <algorithm>`. У него есть одно правило: оба аргумента `min` должны быть ОДНОГО типа. Если написать `min(0, x)`, где `x` типа `long long`, программа даже не скомпилируется — ошибка появится с номером строки. Здесь все числа `int`, а самый большой ответ не превышает 1881, так что достаточно держать всё в `int`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<vector<int>> cost(n, vector<int>(m, 0));\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            cin >> cost[r][c];\n" +
      "        }\n" +
      "    }\n" +
      "    vector<vector<int>> dp(n, vector<int>(m, 0));\n" +
      "    for (int r = 0; r < n; r++) {\n" +
      "        for (int c = 0; c < m; c++) {\n" +
      "            if (r == 0 && c == 0) {\n" +
      "                dp[r][c] = cost[r][c];\n" +
      "            } else if (r == 0) {\n" +
      "                dp[r][c] = dp[r][c - 1] + cost[r][c];\n" +
      "            } else if (c == 0) {\n" +
      "                dp[r][c] = dp[r - 1][c] + cost[r][c];\n" +
      "            } else {\n" +
      "                dp[r][c] = min(dp[r - 1][c], dp[r][c - 1]) + cost[r][c];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "2 3\n1 3 1\n1 5 1", expectedOutput: "6" },
      { input: "3 3\n1 2 5\n1 9 5\n8 9 5", expectedOutput: "18", hidden: true },
      {
        input: "3 4\n1 2 2 2\n1 9 9 2\n8 9 9 2",
        expectedOutput: "11",
        hidden: true,
      },
      { input: "3 3\n1 9 9\n1 1 9\n9 1 1", expectedOutput: "5", hidden: true },
      { input: "1 1\n7", expectedOutput: "7", hidden: true },
      { input: "1 4\n2 0 5 3", expectedOutput: "10", hidden: true },
      { input: "4 1\n2\n0\n5\n3", expectedOutput: "10", hidden: true },
      { input: "2 2\n0 0\n0 0", expectedOutput: "0", hidden: true },
      { input: "2 2\n5 1\n1 5", expectedOutput: "11", hidden: true },
      {
        input: "4 4\n1 1 9 9\n9 1 9 9\n9 1 1 9\n9 9 1 1",
        expectedOutput: "7",
        hidden: true,
      },
    ],
  },
  {
    /*
     * «Тереңдетілген … шешімді жазбаша қорғау міндетті» (p.6), and April's own
     * assessment sentence: «Кодқа отырмас бұрын әр аралық нәтиженің нені
     * білдіретінін сөзбен тұжырымдайды». So the first question is the
     * programme's own, asked here rather than for the first time in the check.
     *
     * The second question is the one no checker in this file can ask, and it is
     * the lesson's real subject: a wrong fill order does not fail, it lies. The
     * marking points below are what a teacher looks for; nothing here is
     * machine-scored and the block settles as `unknown`.
     *
     * Two questions, two written answers — which is what an advanced learner
     * can produce inside a ten-minute lesson that already carries a challenge.
     */
    id: "m8.l4.b11",
    type: "explain",
    skillRefs: ["dp.table", "dp.core", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Екі сұраққа жазбаша жауап бер. 1) Өз кестеңдегі `dp[r][c]` нені білдіреді — бір сөйлеммен айт, содан кейін сол сөйлемнен қабырға ұяшығына неге дәл 0 жазылатыны қалай шығатынын көрсет. 2) Толтыру ретін бұзсақ (мысалы, жолдарды төменнен жоғары толтырсақ), бағдарлама неге қатемен тоқтамайды, бірақ дұрыс емес жауап шығарады? Бұл қатені байқау үшін нені тексерер едің?",
      ru: "Ответь письменно на два вопроса. 1) Что означает `dp[r][c]` в твоей таблице — скажи это одним предложением, а затем покажи, как из этого же предложения следует, что в клетку-стену записывается именно 0. 2) Если нарушить порядок заполнения (например, заполнять строки снизу вверх), почему программа не остановится с ошибкой, но выведет неверный ответ? Что бы ты проверил, чтобы заметить такую ошибку?",
    },
    expectedPoints: [
      {
        kk: "`dp[r][c]` — бастапқы ұяшықтан (r, c) ұяшығына дейін, тек оңға және төмен жүріп жететін маршруттардың саны. Тұжырым дәл осы ұяшыққа дейінгі маршруттар туралы болуы керек, бүкіл тор туралы емес.",
        ru: "`dp[r][c]` — это количество маршрутов, ведущих из стартовой клетки в клетку (r, c) при движении только вправо и вниз. Формулировка должна быть про маршруты именно до этой клетки, а не про всю сетку.",
      },
      {
        kk: "Қабырғаға түсуге болмайды, демек оған дейін жететін маршрут біреу де жоқ — саны нөл. Нөл «белгісіз» дегенді емес, «мұндай маршрут жоқ» дегенді білдіреді, сондықтан оны көршілерге қосу да дұрыс: жоқ маршрут ештеңе қоспайды.",
        ru: "На стену наступать нельзя, значит до неё не ведёт ни один маршрут — их число равно нулю. Ноль здесь означает не «неизвестно», а «таких маршрутов нет», поэтому его законно прибавлять у соседей: несуществующие маршруты не добавляют ничего.",
      },
      {
        kk: "Кесте құрылған сәтте түгел нөлмен толтырылған, ал әлі есептелмеген ұяшық пен шын мәні 0 болатын ұяшық сырттай ажыратылмайды. Сондықтан ретті бұзғанда бағдарлама заңды санды заңды жерден оқиды: `dp[r - 1][c]` кестенің ішінде тұр, тілдің бірде-бір ережесі бұзылмайды, демек компиляторда да, орындалу кезінде де хабарлама беруге негіз жоқ.",
        ru: "В момент создания таблица заполнена нулями, и ещё не посчитанная клетка внешне неотличима от клетки, чей настоящий ответ равен 0. Поэтому при нарушенном порядке программа читает законное число из законного места: `dp[r - 1][c]` лежит внутри таблицы, ни одно правило языка не нарушено, а значит, ни у компилятора, ни у программы во время работы нет повода сообщить об ошибке.",
      },
      {
        kk: "Байқау жолы: кішкентай, қолмен санауға болатын торда тексеру. Мысалы, қабырғасыз 3×3 торда жауап 6 болуы керек; ретті бұзған бағдарлама 0 береді. Тағы бір белгі — соңғы жолдың немесе соңғы бағанның түгел нөл болып қалуы: бұл сол бөлік бәрінен бұрын, әлі ештеңе жазылмай тұрып есептелгенін көрсетеді.",
        ru: "Способ заметить: проверить на маленькой сетке, которую можно посчитать руками. Например, на сетке 3×3 без стен ответ должен быть 6, а программа с нарушенным порядком выдаёт 0. Ещё один признак — целиком нулевая последняя строка или последний столбец: это значит, что эта часть считалась раньше всех, когда ещё ничего не было записано.",
      },
    ],
  },
];
