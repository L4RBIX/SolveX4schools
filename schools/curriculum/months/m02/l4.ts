import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан — lesson 4, «Тізім және индекс» (8 minutes).
 *
 * PDF p.7. Two clauses of October drive this lesson and neither is optional:
 *
 *   «…тізімге мәндер жинау, элементті индекс арқылы алу…»
 *   «Бөлек тренажер индекстерді көзге көрінетін етеді.»
 *
 * The second is a *separate trainer*, so `m2.l4.b2` is a `visual_simulation`
 * and not a task — the learner looks at the boxes and their numbers before
 * anybody asks them to compute with them. The programme also names
 * «индекстің шекарадан шығуы» among October's four typical errors, which is
 * what `m2.l4.b5` puts on screen as a program that really does stop.
 *
 * ## The C++ list is `vector<int>`, and the input format changed with it
 *
 * Python read a whole line and split it, and the length came from `len(a)`.
 * C++ has no split, and a beginner's first list has to arrive by a route they
 * can read: `cin >> n`, then `vector<int> a(n)`, then one `cin >> a[i]` per
 * pass. So EVERY task in October that used to take one line of numbers now
 * takes the count on the first line and the numbers on the second, and every
 * prompt says so in both languages. Nothing else about the tasks moved.
 *
 * ## Why `at()` appears here, and only where an error is the subject
 *
 * Python answered an out-of-range index with `IndexError` — loud, immediate,
 * and the reason a boundary bug was worth putting on screen. C++'s `a[i]` does
 * NOT check: past the end it reads whatever happens to be next in memory, and
 * the program keeps going with a number nobody chose. That is undefined
 * behaviour, this course does not teach it as a concept, and shipping a task
 * whose answer depends on it would be worse than teaching nothing.
 *
 * `a.at(i)` is the checked form: it stops the program with an `out of range`
 * error. It traps identically on both engines — measured, see
 * docs/cpp17/CPP17_BROWSER_RUNTIME.md — so a boundary error can be shown
 * honestly and graded reproducibly. The rule the concept card gives is exactly
 * that: write `a[i]` in your own programs, and reach for `a.at(i)` when you
 * are hunting an index bug and want the computer to point at it. `m2.l4.b5`
 * and `m2.l9.b4` are the two blocks that use it, and both are about the error.
 *
 * No `sort`, and no negative index anywhere in a solution — `-1` appears once,
 * as a wrong answer to a question about counting from the start.
 */
export const M2_L4: LessonBlock[] = [
  {
    id: "m2.l4.b1",
    type: "concept",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Тізім — нөмірленген қораптар қатары",
      ru: "Список — ряд пронумерованных ячеек",
    },
    body: {
      kk: "Тізім — бір атпен сақталған қораптар қатары. C++-та ол `vector<int>` деп аталады, ал оны қолдану үшін жоғарыға `#include <vector>` деген жол қосылады. Әр қорапта бір бүтін сан жатыр, ал әр қораптың өз нөмірі (индексі) бар. Санау бірден емес, нөлден басталады: бірінші қорап — 0, екіншісі — 1, үшіншісі — 2. `a[i]` жазуы i нөмірлі қораптағы мәнді береді.\n\n`a.size()` — қораптардың саны. Санау нөлден басталғандықтан соңғы қораптың нөмірі `a.size()` емес, `a.size() - 1` болады.\n\nТізімді қалай оқимыз? Алдымен қанша сан келетінін оқып аламыз, содан кейін дәл сонша қорабы бар тізім жасаймыз да, циклмен толтырамыз:\n\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n\nЕкі ескерту. Біріншісі: `a.size()` — теріс бола алмайтын ерекше сан, сондықтан бос тізімде `a.size() - 1` деген −1 емес, өте үлкен сан болып шығады. Сол себепті бұл курста ұзындықты бірден `int n = a.size();` деп жазып алып, циклде `i < n` деп салыстырамыз. Екіншісі: `a[i]` индекстің дұрыстығын ТЕКСЕРМЕЙДІ — шекарадан шығып кетсең, бағдарлама құламайды да, бөтен жердегі кездейсоқ санды алып, жұмысын жалғастыра береді. Ал `a.at(i)` тексереді және қате индексте бағдарламаны `out of range` деген хабармен тоқтатады. Өз шешіміңде `a[i]` жаз, ал индекс қатесін іздеп жүргенде `a.at(i)` — сенің көмекшің.",
      ru: "Список — это ряд ячеек, которые хранятся под одним именем. В C++ он называется `vector<int>`, а чтобы им пользоваться, сверху добавляется строка `#include <vector>`. В каждой ячейке лежит одно целое число, и у каждой ячейки есть свой номер — индекс. Счёт идёт не с единицы, а с нуля: первая ячейка — 0, вторая — 1, третья — 2. Запись `a[i]` даёт значение из ячейки с номером i.\n\n`a.size()` — это количество ячеек. Так как счёт начинается с нуля, номер последней ячейки равен не `a.size()`, а `a.size() - 1`.\n\nКак прочитать список? Сначала читаем, сколько будет чисел, затем создаём список ровно с таким числом ячеек и заполняем его циклом:\n\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n\nДва предупреждения. Первое: `a.size()` — особое число, которое не бывает отрицательным, поэтому у пустого списка `a.size() - 1` — это не −1, а очень большое число. Поэтому в этом курсе мы сразу пишем `int n = a.size();` и сравниваем в цикле `i < n`. Второе: `a[i]` НЕ проверяет, правильный ли индекс, — выйдя за границу, программа не падает, а берёт случайное число из чужого места и спокойно работает дальше. А `a.at(i)` проверяет и на неверном индексе останавливает программу с сообщением `out of range`. В своём решении пиши `a[i]`, а `a.at(i)` — твой помощник, когда ищешь ошибку в индексах.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {7, 3, 9, 5};\n" +
      "    int n = a.size();\n" +
      "    cout << a[0] << endl;       // 7\n" +
      "    cout << a[2] << endl;       // 9\n" +
      "    cout << n << endl;          // 4\n" +
      "    cout << a[n - 1] << endl;   // 5\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The trainer the programme asks for by name. It is deliberately NOT an
     * attempt block: «көзге көрінетін етеді» is about seeing the numbering, and
     * scoring a learner for looking at it would produce evidence about nothing.
     * The list here is the same four values as the concept block above, so the
     * boxes on screen are the boxes they have just read about.
     */
    id: "m2.l4.b2",
    type: "visual_simulation",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    simulation: "loop_trace",
    prompt: {
      kk: "Қораптарды бірінен соң бірін ашып көр. Жоғарыда — мән, төменде — сол қораптың индексі. Индекс 0-ден `a.size() - 1`-ге дейін жүреді: соңғы қорапта тоқта да, оның нөмірін дауыстап айт.",
      ru: "Открывай ячейки одну за другой. Сверху — значение, снизу — индекс этой ячейки. Индекс идёт от 0 до `a.size() - 1`: остановись на последней ячейке и назови её номер вслух.",
    },
    config: { list: [7, 3, 9, 5], highlight: "index", showLength: true },
  },
  {
    id: "m2.l4.b3",
    type: "prediction",
    skillRefs: ["lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама нені шығарады? Қораптардың нөмірін нөлден бастап санап шық.",
      ru: "Что выведет программа? Посчитай номера ячеек, начиная с нуля.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {4, 8, 15, 16};\n" +
      "    int n = a.size();\n" +
      "    cout << a[0] << \" \" << a[2] << \" \" << a[n - 1];\n" +
      "    return 0;\n" +
      "}",
    answer: "4 15 16",
    options: ["4 15 16", "4 8 15", "4 8 16", "8 15 16"],
    diagnosticMapping: {
      /*
       * «4 8 15» is the whole triple shifted one box to the left: a[2] read as
       * "the second element" and a[3] as "the third". Nothing else lands on
       * exactly that combination, so the attribution is safe. «4 8 16» is left
       * unmapped on purpose — it can come from the same shift applied to one
       * term only, or from a plain miscount, and two causes means the engine
       * should ask instead of tell.
       */
      "4 8 15": {
        failureClass: "one_based_index_assumption",
        justification:
          "Бұл жауап әр индексті бірден бастап санағанда ғана шығады: a[2] — екінші элемент, a[3] — үшінші элемент деп оқылған. Үш мәннің үшеуі де бір қорапқа солға жылжыған.",
      },
    },
  },
  {
    id: "m2.l4.b4",
    type: "multiple_choice",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`a` тізімінде `a.size()` элемент бар. Индекстер басынан бастап 0, 1, 2, … деп саналады. Соңғы элементтің индексі неге тең?",
      ru: "В списке `a` ровно `a.size()` элементов. Индексы считаются от начала: 0, 1, 2, … Чему равен индекс последнего элемента?",
    },
    options: [
      { id: "o1", label: { kk: "a.size()", ru: "a.size()" } },
      { id: "o2", label: { kk: "a.size() - 1", ru: "a.size() - 1" } },
      { id: "o3", label: { kk: "a.size() + 1", ru: "a.size() + 1" } },
      { id: "o4", label: { kk: "-1", ru: "-1" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      /*
       * o4 (`-1`) gets no mapping, and the reason changed with the language. In
       * Python `a[-1]` really did reach the last element, so the option was
       * defensible; in C++ it is simply out of range. It stays unmapped anyway,
       * because two different things bring a learner to it — counting from the
       * end, or reading the question as "which index is invalid" — and a
       * distractor with two causes gets no attribution.
       */
      o1: {
        failureClass: "off_by_one_last_index",
        justification:
          "`a.size()` — элементтердің саны, ал нөлден санағанда соңғы нөмір одан бір кем. Дәл осы бір қадам асып кету `a.at(a.size())` жазылғанда бағдарламаны `out of range` қатесімен тоқтатады, ал `a[a.size()]` жазылса — тіпті тоқтатпай, бөтен санды алып береді. Сондықтан бұл таңдау шекарадан шығу қатесін көрсетеді.",
      },
    },
  },
  {
    /*
     * «индекстің шекарадан шығуы» — one of October's four named typical errors
     * (PDF p.7), and the block the file header's `at()` decision exists for.
     *
     * The program is written with `a.at(...)` throughout, so the wrong index
     * announces itself: the buggy half stops with `out of range` and prints
     * nothing, the fixed half prints 30. With `a[...]` the same defect would be
     * undefined behaviour — no crash, an unpredictable number, and a task whose
     * answer key could not be trusted on either engine.
     *
     * symptomInput is declared because the fallback probe feeds a single
     * number, and a single number is not the list the lesson is about.
     *
     * No diagnosticMapping: with two candidate lines the choice of the reading
     * loop could mean "I think the reading line is wrong" or "I think the list
     * came out one element short". Two causes, so the engine asks.
     */
    id: "m2.l4.b5",
    type: "find_bug",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бағдарлама тізімнің соңғы элементін шығаруы керек. Индекстер `at()` арқылы жазылған, сондықтан қате индекс бірден көрінеді: `3` және `10 20 30` енгізгенде бағдарлама ештеңе шығармай, `out of range` деген қатемен тоқтап қалады. Қай жол кінәлі және неге?",
      ru: "Программа должна выводить последний элемент списка. Индексы записаны через `at()`, поэтому неверный индекс виден сразу: при вводе `3` и `10 20 30` программа ничего не выводит и останавливается с ошибкой `out of range`. Какая строка виновата и почему?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a.at(i);\n" +
      "    }\n" +
      "    cout << a.at(n);\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 12,
    symptomInput: "3\n10 20 30",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a.at(i);\n" +
      "    }\n" +
      "    cout << a.at(n - 1);\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m2.l4.b6",
    type: "fill_blank",
    skillRefs: ["lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі, ол әрқашан тақ. Екінші жолда сол n бүтін сан бос орынмен жазылады. Дәл ортадағы элементті шығаратындай толықтыр. Мысалы n = 3 және `2 7 4` үшін жауап 7, ал n = 5 және `1 2 3 4 5` үшін 3.",
      ru: "В первой строке дано количество чисел n, оно всегда нечётное. Во второй строке через пробел записаны эти n целых чисел. Дополни программу так, чтобы она вывела элемент ровно из середины. Например, для n = 3 и `2 7 4` ответ 7, а для n = 5 и `1 2 3 4 5` — 3.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int m = n ___ 2;\n" +
      "    cout << a[___];\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "/" },
      { id: "f2", answer: "m", alternatives: ["n / 2"] },
    ],
  },
  {
    id: "m2.l4.b7",
    type: "write_code",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Үшінші жолда бір ғана бүтін сан k беріледі. Индекстер нөлден басталатынын ескеріп, k индексіндегі элементті шығар. k әрқашан дұрыс мән: ол 0-ден бастап n − 1-ге дейін болады.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. В третьей строке — одно целое число k. Помня, что индексы начинаются с нуля, выведи элемент с индексом k. Число k всегда корректно: от 0 до n − 1.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    cout << a[k];\n" +
      "    return 0;\n" +
      "}",
    /*
     * k = 0 and k = n−1 are both here because they are the two ends the lesson
     * is about: `a[k - 1]` survives every middle case and goes wrong at k = 0,
     * and `a[k + 1]` survives every middle case and reads past the end at
     * k = n−1. The single-element list is both ends at once. «9 9 9 2 9» has
     * duplicates but a distinct target, so a solution that returns any old
     * matching value fails it.
     */
    cases: [
      { input: "4\n5 8 13 21\n1", expectedOutput: "8" },
      { input: "4\n5 8 13 21\n0", expectedOutput: "5" },
      { input: "4\n5 8 13 21\n3", expectedOutput: "21", hidden: true },
      { input: "1\n7\n0", expectedOutput: "7", hidden: true },
      { input: "5\n9 9 9 2 9\n3", expectedOutput: "2", hidden: true },
      { input: "4\n-3 10 0 6\n2", expectedOutput: "0", hidden: true },
      { input: "10\n1 2 3 4 5 6 7 8 9 10\n9", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m2.l4.b8, not an extra block on top of it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same problem, same input format, same output — the two indices
     * are the only thing left to think about, and they are exactly what the
     * lesson teaches.
     */
    id: "m2.l4.b8s",
    type: "fill_blank",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n (кемінде біреу), екінші жолда сол n бүтін сан беріледі. Бірінші және соңғы элементті бос орынмен бөліп, бір жолға шығару керек. Код дайын — тек екі орынды толтыр.",
      ru: "В первой строке дано количество чисел n (хотя бы одно), во второй — эти n целых чисел. Нужно вывести в одну строку первый и последний элементы, разделив их пробелом. Код готов — заполни только два места.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << a[___] << \" \" << a[n ___ 1];\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "-" },
    ],
  },
  {
    id: "m2.l4.b8",
    type: "write_code",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Тізімнің бірінші және соңғы элементін бос орынмен бөліп, бір жолға шығар.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи в одну строку первый и последний элементы списка, разделив их пробелом.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << a[0] << \" \" << a[n - 1];\n" +
      "    return 0;\n" +
      "}",
    /*
     * The single-element list is hidden on purpose: it is the case where first
     * and last are the same box, and a learner who wrote `a[1]` discovers it
     * there rather than on the visible sample.
     */
    cases: [
      { input: "4\n5 8 13 21", expectedOutput: "5 21" },
      { input: "2\n10 20", expectedOutput: "10 20" },
      { input: "1\n7", expectedOutput: "7 7", hidden: true },
      { input: "4\n-4 0 9 -1", expectedOutput: "-4 -1", hidden: true },
      { input: "3\n3 3 3", expectedOutput: "3 3", hidden: true },
      { input: "6\n1 2 3 4 5 6", expectedOutput: "1 6", hidden: true },
    ],
  },
];
