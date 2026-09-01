import type { LessonBlock } from "../../types";

/**
 * Lesson m6.l6 · «Рекурсиямен нұсқа құрастыру» — building the variants with
 * recursion. PDF p.9, February. 10 minutes. Skills: `recursion.core`,
 * `recursion.call_tree`, `enumerate.all`.
 *
 * ## The clause that decides every block type in this file
 *
 * «Күрделі кері қайту тәсілі биыл бүкіл топқа нөлден жаздырылмайды, оқу және
 * түсіндіру, толықтыру деңгейінде беріледі.»
 *
 * Backtracking is not written from scratch by the whole group this year. It is
 * delivered at the level of READING, EXPLAINING and COMPLETING. So there is no
 * `write_code` here for core or for support — the graded shapes are
 * `trace_code`, `multiple_choice`, `fill_blank`, `modify_code` and `explain`,
 * and the one blank editor in the file is `m6.l6.b10`, the queens problem,
 * which the PDF hands to «Мықты оқушыларға» by name. `tracks: ["advanced"]`
 * on it is the source specifying differentiation, not a product decision.
 *
 * ## The two families this lesson owns
 *
 * «0 мен 1-ден тұратын барлық шағын тізбектерді шығару» — print every short
 * 0/1 sequence — and «шағын тордағы жолдар санын есептеу» — count the paths in
 * a small grid. Neither is plain enumeration and neither is plain recursion;
 * they are the join, which is why they sit in their own lesson rather than
 * inside `m6.l3`.
 *
 * The grid count is `paths(r, c) = paths(r - 1, c) + paths(r, c - 1)` with the
 * base case on the edges, and it is written RECURSIVELY here on purpose. April
 * («Тиімді таңдау және динамика», p.10) fills the same recurrence in as a
 * table and watches the repeated calls disappear. Same formula, twice, three
 * months apart — that connection is the year's, not this lesson's, and it is
 * the reason `m6.l6.b8` must not be quietly rewritten as a loop.
 *
 * ## The undo line in C++, and why it is still a slice
 *
 * The month introduces no new construct here. `path` is a `string` PARAMETER
 * taken by value, so each call owns its own copy — the same behaviour Python's
 * strings had, and the reason the caller's `path` is never disturbed. The
 * choose / descend / undo triple is written with the two string operations
 * `m6.l4` already taught:
 *
 *     path = path + "0";                             // таңдау
 *     build(path, n);                                // тереңдеу
 *     path = path.substr(0, path.size() - 1);        // кері қайту
 *     path = path + "1";                             // басқа таңдау
 *
 * `path.pop_back()` would do the same job in one call and is deliberately NOT
 * used: it is a method nothing in this course has taught, and the point of the
 * card is that the undo is a visible statement rather than a spell. `substr`
 * arrived in `m6.l4` for the palindrome and is reused here on the other end of
 * the word, which is the whole difference `b5` asks about.
 *
 * That undo is real, not a decoration: delete the third line and `path` keeps
 * growing past `n`, the base case never fires, and the recursion does not stop.
 * `m6.l6.b9` asks the learner to say exactly that — and its marking points were
 * rewritten for C++, because what happens next is NOT Python's `RecursionError`.
 * C++ counts no depth and raises nothing: the call stack fills, the program
 * stops, and there is no message to read. That is stated as the reason to
 * reason about depth in advance, which is the habit `m6.l4.b1` sells.
 *
 * Because `path` is local, the caller's own `path` is never touched, so the
 * final choice in a call needs no erase after it. That asymmetry is stated in
 * the worked example rather than hidden behind a redundant symmetric line.
 *
 * ## Lengths are read into an `int` before they are compared
 *
 * `path.size()` is not an `int`, so every generator here writes
 * `int len = path.size();` on its own line and compares that. It is the same
 * recipe `m6.l3` and `m6.l5` use for `vector`, and it keeps the interesting
 * line — the base case — free of anything that is not the base case.
 *
 * ## A requirement no checker can see, and which of the three options was taken
 *
 * `m6.l6.b7` grades output. Output comparison cannot see whether the learner
 * kept the recursion — in principle a fixed set of nested loops could print the
 * same lines. The prompt therefore states the OUTPUT FORMAT and nothing about
 * method, and the structural half is sent to a human: `m6.l6.b9` asks what the
 * two parameters of `build` mean and what happens when the undo line is
 * removed, which a teacher reads and marks. That is option 3 of the three in
 * the authoring contract. Option 1 is partly true here as well — the length
 * comes from input, so no fixed number of nested loops produces it — but
 * "partly true" is not a guarantee, and no prompt in this file claims a rule
 * the product will not enforce.
 *
 * ## Output format
 *
 * Every sequence on its own line, digits with no separator, in increasing
 * order. Both prompts state it and `m6.l6.b7` declares `{ kind: "exact" }`,
 * because with the default `token` checker a program printing all sixteen
 * sequences on one line would be graded correct against a prompt that forbids
 * it. The grid count and the queens count are single integers and keep `token`.
 *
 * Programs print digits and integers only — no Kazakh or Russian word reaches
 * stdout anywhere in this lesson.
 *
 * ## Bounds
 *
 * `b7` caps n at 5, so 32 lines and a recursion 5 deep. `b8`'s grid is at most
 * 8 × 8, where the answer is 3432 and the tree holds a few thousand calls, at a
 * depth of at most 14. `b10`'s board is at most 8 × 8, which the whole search
 * covers in a small fraction of a second at a depth of 8. Every one of them is
 * far inside `int` and far inside any stack.
 */
export const M6_L6: LessonBlock[] = [
  {
    id: "m6.l6.b1",
    type: "concept",
    skillRefs: ["recursion.core", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Таңда, тереңде, кері қайт",
      ru: "Выбери, углубись, вернись",
    },
    /*
     * Straight-line code on purpose: the choose/undo mechanic is separated from
     * recursion and shown once on its own, so that when the generator appears
     * two cards later the only new thing in it is the self-call. `path` starts
     * at "01" rather than at "" so no line of the demonstration prints an empty
     * string — an empty output line teaches nothing here and looks like a bug.
     */
    body: {
      kk: "Барлық нұсқаны құрастыру тәсілі қарапайым: бір орынға бір мәнді таңдаймыз, сол таңдаумен бірге тереңірек кетеміз, содан кейін кері қайтып, дәл сол орынға екінші мәнді қоямыз. Жиналған бөлікті `path` айнымалысында `string` түрінде сақтаймыз. `path + \"0\"` соңына бір таңба қосады. `path.substr(0, path.size() - 1)` нөлінші таңбадан бастап `path.size() - 1` таңба алады, яғни соңғысынан басқасының бәрін — сол арқылы ең соңғы таңдау өшіріледі. `substr` жазуы өткен сабақтан таныс, тек ол жерде сөздің басынан кесіп алғанбыз, ал мұнда — соңынан. Төмендегі үш әрекетті мұқият қара: таңдау, кері қайту, басқа таңдау.",
      ru: "Приём для построения всех вариантов простой: выбираем одно значение для одной позиции, уходим с этим выбором вглубь, а потом возвращаемся и ставим на ту же позицию второе значение. Собранную часть храним в переменной `path` типа `string`. Запись `path + \"0\"` добавляет в конец один символ. Запись `path.substr(0, path.size() - 1)` берёт `path.size() - 1` символов начиная с нулевого, то есть всё, кроме последнего, — так стирается самый последний выбор. Сам `substr` знаком с прошлого урока, только там мы отрезали от начала слова, а здесь — с конца. Посмотри внимательно на три действия ниже: выбор, возврат, другой выбор.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string path = \"01\";\n" +
      "    path = path + \"0\";\n" +
      "    cout << path << endl;\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    cout << path << endl;\n" +
      "    path = path + \"1\";\n" +
      "    cout << path << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m6.l6.b2",
    type: "worked_example",
    skillRefs: ["recursion.core", "recursion.call_tree", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Ұзындығы 3 болатын барлық тізбек",
      ru: "Все последовательности длины 3",
    },
    problem: {
      kk: "0 мен 1-ден тұратын, ұзындығы 3 болатын барлық тізбекті шығару керек. Әр тізбек — бөлек жолда, таңбалардың арасында ешқандай ажыратқыш жоқ, реті өсу ретімен: бірінші жол 000, соңғы жол 111.",
      ru: "Нужно вывести все последовательности из 0 и 1 длины 3. Каждая последовательность — на отдельной строке, между символами нет никакого разделителя, порядок по возрастанию: первая строка 000, последняя 111.",
    },
    steps: [
      {
        kk: "Тізбекті бірден толық жазуға болмайды. Оны солдан оңға қарай, бір таңбадан құрастырамыз. `path` — әзірге жиналған бөлік, ал `n` — керекті ұзындық. Функция ешнәрсе қайтармайды, тек экранға шығарады, сондықтан оның түрі — `void`.",
        ru: "Последовательность нельзя написать целиком сразу. Мы строим её слева направо, по одному символу. `path` — уже собранная часть, а `n` — нужная длина. Функция ничего не возвращает, только печатает, поэтому её тип — `void`.",
      },
      {
        kk: "Ұзындықты бір рет `int len = path.size();` деп жазып аламыз. Егер `len` `n`-ге жетсе, тізбек дайын: оны шығарамыз да, `return;` арқылы осы шақырудан шығамыз. Бұл — тоқтату шарты, ол функцияның ең басында тұр.",
        ru: "Длину один раз записываем в `int len = path.size();`. Если `len` дошёл до `n`, последовательность готова: печатаем её и выходим из этого вызова через `return;`. Это базовый случай, и он стоит в самом начале функции.",
      },
      {
        kk: "Әйтпесе алдымен «0» таңдаймыз: соңына нөлді қосып, функцияны өзіне қайта шақырамыз. Терең шақыру қалған орындардың бәрін өзі толтырып шығады.",
        ru: "Иначе сначала выбираем «0»: добавляем ноль в конец и вызываем функцию саму себя. Более глубокий вызов сам заполнит все оставшиеся позиции.",
      },
      {
        kk: "Терең шақыру аяқталып, басқару келесі жолға оралғанда `path` әлі «0»-мен тұр. Сондықтан оны өшіреміз: `path = path.substr(0, path.size() - 1);`. Осыдан кейін ғана «1»-ді таңдай аламыз — әйтпесе екеуі бірге жиналып қалады.",
        ru: "Когда глубокий вызов закончился и управление вернулось на следующую строку, `path` всё ещё стоит с «0». Поэтому стираем его: `path = path.substr(0, path.size() - 1);`. Только после этого можно выбрать «1» — иначе оба символа накопятся вместе.",
      },
      {
        kk: "Екінші шақырудан кейін бұл шақыруда ешқандай әрекет қалмайды, сондықтан соңынан өшірудің қажеті жоқ. Әр шақырудың өз `path`-ы бар: параметр `string path` деп мән бойынша берілген, яғни әр шақыру көшірмесін алады, ал біздің өзгертулеріміз бізді шақырған жақтағы `path`-қа мүлде тимейді.",
        ru: "После второго вызова в этом вызове больше не остаётся действий, поэтому стирать в конце не нужно. У каждого вызова свой `path`: параметр `string path` передан по значению, то есть каждый вызов получает копию, и наши изменения никак не затрагивают `path` того вызова, который нас позвал.",
      },
      {
        kk: "Ағаш солдан оңға жүреді, ал әр шақыруда «0» әрқашан «1»-ден бұрын таңдалады. Сондықтан жолдар өсу ретімен шығады.",
        ru: "Дерево обходится слева направо, и в каждом вызове «0» всегда выбирается раньше «1». Поэтому строки выходят в порядке возрастания.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int n) {\n" +
      "    int len = path.size();\n" +
      "    if (len == n) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    build(path, n);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"1\";\n" +
      "    build(path, n);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    build(\"\", 3);\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Экранға сегіз жол шығады: 000, 001, 010, 011, 100, 101, 110, 111 — әрқайсысы бөлек жолда.",
      ru: "На экран выйдут восемь строк: 000, 001, 010, 011, 100, 101, 110, 111 — каждая на отдельной строке.",
    },
  },
  {
    id: "m6.l6.b3",
    type: "prediction",
    skillRefs: ["recursion.call_tree", "enumerate.all"],
    sourceType: "product-authored",
    /*
     * The same generator with the two choices swapped and the length cut to 2.
     * The whole question is which branch runs first, so the ascending answer —
     * the one a learner writes without reading the order of the calls — is a
     * distractor rather than the key.
     */
    prompt: {
      kk: "Бұл генератор алдымен «1»-ді, содан кейін «0»-ді таңдайды, ал ұзындығы 2. Ол экранға нені шығарады? Төрт жолды дұрыс ретімен таңда.",
      ru: "Этот генератор сначала выбирает «1», а потом «0», длина равна 2. Что он выведет на экран? Выбери четыре строки в правильном порядке.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int n) {\n" +
      "    int len = path.size();\n" +
      "    if (len == n) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"1\";\n" +
      "    build(path, n);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"0\";\n" +
      "    build(path, n);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    build(\"\", 2);\n" +
      "    return 0;\n" +
      "}",
    answer: "11\n10\n01\n00",
    options: ["11\n10\n01\n00", "00\n01\n10\n11", "11\n01\n10\n00", "10\n11\n00\n01"],
    diagnosticMapping: {
      /*
       * The ascending order is what the previous card's generator prints, and
       * it is the only thing this answer can come from: every digit is right,
       * every line is right, and only the order of the two branches is wrong.
       * The other two distractors get no mapping — «11 01 10 00» can come from
       * a mis-drawn tree or from reading the undo as a swap, and two causes
       * means the engine should ask instead of tell.
       */
      "00\n01\n10\n11": {
        failureClass: "branch_order_ignored",
        justification:
          "Тізбектердің өзі дұрыс, тек реті кері. Бұл жауап бағдарламадағы қай тармақ бұрын шақырылатынын оқымай, тізбектерді әдеттегідей өсу ретімен жазғанда ғана шығады.",
      },
    },
  },
  {
    id: "m6.l6.b4",
    type: "trace_code",
    skillRefs: ["recursion.call_tree", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /*
     * «Айдың орталық құралы - шақырулар ағашы». The `recursion_tree`
     * visualiser does not exist, so the tree is made visible two ways at once:
     * the program prints `path` at the START of every call (so the printed
     * output is the tree, not just its leaves), and the learner writes `path`
     * down for ten executed lines. Step 9 is the payoff — line 13 restores
     * `path` from "000" back to "00", which is the undo doing its work.
     */
    prompt: {
      kk: "Бұл — таныс генератор, бірақ әр шақырудың ең басында ағымдағы `path` мәнін шығарады, сондықтан экранда бүкіл шақырулар ағашы көрінеді. Бағдарламаны n = 3 үшін қадамдап орында. Әр қадамда сол жол орындалғаннан кейінгі, дәл сол шақырудағы `path` мәнін жаз. Ең бірінші шақыруда `path` бос мәтін, сондықтан бірінші басылған жол да бос болады.",
      ru: "Это знакомый генератор, но он печатает текущее значение `path` в самом начале каждого вызова, поэтому на экране видно всё дерево вызовов. Выполни программу пошагово при n = 3. На каждом шаге запиши значение `path` в том самом вызове, сразу после выполнения этой строки. В самом первом вызове `path` — пустой текст, поэтому и первая напечатанная строка пустая.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void show(string path, int n) {\n" +
      "    cout << path << endl;\n" +
      "    int len = path.size();\n" +
      "    if (len == n) {\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    show(path, n);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"1\";\n" +
      "    show(path, n);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    show(\"\", 3);\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 6, vars: { path: '""' } },
      { line: 11, vars: { path: '"0"' } },
      { line: 6, vars: { path: '"0"' } },
      { line: 11, vars: { path: '"00"' } },
      { line: 6, vars: { path: '"00"' } },
      { line: 11, vars: { path: '"000"' } },
      { line: 6, vars: { path: '"000"' } },
      { line: 9, vars: { path: '"000"' } },
      { line: 13, vars: { path: '"00"' } },
      { line: 14, vars: { path: '"001"' } },
    ],
  },
  {
    id: "m6.l6.b5",
    type: "multiple_choice",
    skillRefs: ["recursion.core", "enumerate.all"],
    sourceType: "product-authored",
    /*
     * The Python version of this card showed four unindented lines lifted out
     * of the generator. C++ cannot: every snippet in the curriculum is compiled
     * as a whole translation unit, and four statements with no `main` around
     * them are not a program. So the card shows the generator the worked
     * example already revealed in full — `build(path, n)` from `b2`, never the
     * `left` form, because that one is `b6`'s answer and `b6` comes next — and
     * points at the one line it asks about by number.
     *
     * Nothing is given away: the learner has seen this exact program, and the
     * question is about reading one line of it.
     */
    prompt: {
      kk: "Төменде саған таныс генератор тұр. 13-жолға қара — ол рекурсивті шақырудан кейін бірден тұрған жол. Ол не істейді?",
      ru: "Ниже — знакомый тебе генератор. Посмотри на строку 13 — она стоит сразу после рекурсивного вызова. Что она делает?",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int n) {\n" +
      "    int len = path.size();\n" +
      "    if (len == n) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    build(path, n);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"1\";\n" +
      "    build(path, n);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    build(\"\", 3);\n" +
      "    return 0;\n" +
      "}",
    options: [
      {
        id: "o1",
        label: {
          kk: "`path`-тың соңғы таңбасын алып тастайды — яғни жаңа ғана жасалған «0» таңдауын кері қайтарады.",
          ru: "Убирает последний символ `path` — то есть отменяет только что сделанный выбор «0».",
        },
      },
      {
        id: "o2",
        label: {
          kk: "`path`-тың бірінші таңбасын алып тастайды.",
          ru: "Убирает первый символ `path`.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Рекурсияны тоқтатып, функциядан шығады.",
          ru: "Останавливает рекурсию и выходит из функции.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "`path`-ты экранға шығарады.",
          ru: "Выводит `path` на экран.",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      /*
       * o3 and o4 stay unmapped: either can come from simply not reading the
       * line, and "did not read it" is not a named misconception. o2 is
       * different — every symbol has been read, and only the meaning of the two
       * `substr` arguments has been swapped.
       */
      o2: {
        failureClass: "slice_end_bound_misread",
        justification:
          "`path.substr(0, path.size() - 1)` жазуындағы бірінші сан — БАСТАЛАТЫН орын, ал екіншісі — АЛЫНАТЫН таңбалардың саны. Демек нөлінші таңбадан бастап, соңғысынан басқасының бәрі алынады. «Бірінші таңба алынып тасталды» деген жауап нөлді алынып тасталатын таңбаның нөмірі деп оқығанда ғана шығады.",
      },
    },
  },
  {
    id: "m6.l6.b6",
    type: "fill_blank",
    skillRefs: ["recursion.core", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /*
     * «толықтыру деңгейінде беріледі» — the completing level, delivered
     * literally. This generator counts DOWN the free positions instead of
     * comparing lengths, so the learner cannot copy `n` from the worked
     * example: the recursive call has to carry `left - 1`, which is the one
     * decision recursion actually asks for. Neither blanked call appears
     * anywhere else in the template, so no blank is answerable by transcription
     * from the card itself.
     */
    prompt: {
      kk: "Генератор дайын, бірақ үш жері жоқ. Мұнда `left` — әлі толтырылмаған орындардың саны, сондықтан ұзындықты өлшеудің де қажеті жоқ. Толықтыр: «0» таңдағаннан кейінгі рекурсивті шақыруды, таңдауды кері қайтаратын өрнекті және «1» таңдағаннан кейінгі рекурсивті шақыруды. Бағдарлама ұзындығы 3 болатын барлық тізбекті бөлек жолмен, өсу ретімен шығаруы керек.",
      ru: "Генератор готов, но в нём не хватает трёх мест. Здесь `left` — количество ещё не заполненных позиций, поэтому измерять длину уже не нужно. Дополни: рекурсивный вызов после выбора «0», выражение, отменяющее выбор, и рекурсивный вызов после выбора «1». Программа должна вывести все последовательности длины 3, каждую на отдельной строке, в порядке возрастания.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int left) {\n" +
      "    if (left == 0) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    build(path, ___);\n" +
      "    path = ___;\n" +
      "    path = path + \"1\";\n" +
      "    ___;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    build(\"\", 3);\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "left - 1", alternatives: ["left-1"] },
      {
        id: "f2",
        answer: "path.substr(0, path.size() - 1)",
        alternatives: ["path.substr(0, path.size()-1)"],
      },
      { id: "f3", answer: "build(path, left - 1)", alternatives: ["build(path, left-1)"] },
    ],
  },
  {
    id: "m6.l6.b7",
    type: "modify_code",
    skillRefs: ["recursion.core", "enumerate.all", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /*
     * The starting program is the one the learner COMPLETED on the previous
     * card, which is the only direction a modify_code may take: forwards, from
     * finished work, never from work they are about to be asked for. Both cards
     * are on all three routes, so "the generator you have just completed" is
     * true for every learner who reads it.
     *
     * checker: exact. The prompt states one sequence per line, no separator,
     * increasing order — under the default token checker a program printing all
     * thirty-two sequences on a single line would be graded correct against a
     * prompt that forbids exactly that.
     *
     * The degenerate programs and the case that kills each:
     *   - ignores n and always prints length 3   → n = 1, 2, 4, 5
     *   - prints "1" before "0"                  → every case, on the first line
     *   - drops the undo line                    → the recursion never stops,
     *                                              every case
     *   - prints n lines instead of 2^n          → n = 2 (visible) and up
     */
    prompt: {
      kk: "Сен жаңа ғана толықтырған генератор ұзындығы әрқашан 3 болатын тізбектерді шығарады. Оны өзгерт: алдымен бір бүтін сан n оқылады (1 ≤ n ≤ 5), содан кейін 0 мен 1-ден тұратын, ұзындығы n болатын барлық тізбек шығады. Әр тізбек — бөлек жолда, таңбалардың арасында ешқандай ажыратқыш жоқ, реті өсу ретімен: бірінші жол — тек нөлдерден, соңғы жол — тек бірлерден тұрады.",
      ru: "Генератор, который ты только что дополнил, выводит последовательности длины ровно 3. Измени его: сначала читается одно целое число n (1 ≤ n ≤ 5), затем выводятся все последовательности из 0 и 1 длины n. Каждая последовательность — на отдельной строке, между символами нет никакого разделителя, порядок по возрастанию: первая строка состоит только из нулей, последняя — только из единиц.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int left) {\n" +
      "    if (left == 0) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    build(path, left - 1);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"1\";\n" +
      "    build(path, left - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    build(\"\", 3);\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int left) {\n" +
      "    if (left == 0) {\n" +
      "        cout << path << endl;\n" +
      "        return;\n" +
      "    }\n" +
      "    path = path + \"0\";\n" +
      "    build(path, left - 1);\n" +
      "    path = path.substr(0, path.size() - 1);\n" +
      "    path = path + \"1\";\n" +
      "    build(path, left - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    build(\"\", n);\n" +
      "    return 0;\n" +
      "}",
    checker: { kind: "exact" },
    cases: [
      { input: "2", expectedOutput: "00\n01\n10\n11" },
      { input: "1", expectedOutput: "0\n1", hidden: true },
      {
        input: "3",
        expectedOutput: "000\n001\n010\n011\n100\n101\n110\n111",
        hidden: true,
      },
      {
        input: "4",
        expectedOutput:
          "0000\n0001\n0010\n0011\n0100\n0101\n0110\n0111\n1000\n1001\n1010\n1011\n1100\n1101\n1110\n1111",
        hidden: true,
      },
      {
        input: "5",
        expectedOutput:
          "00000\n00001\n00010\n00011\n00100\n00101\n00110\n00111\n" +
          "01000\n01001\n01010\n01011\n01100\n01101\n01110\n01111\n" +
          "10000\n10001\n10010\n10011\n10100\n10101\n10110\n10111\n" +
          "11000\n11001\n11010\n11011\n11100\n11101\n11110\n11111",
        hidden: true,
      },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m6.l6.b8, not an extra block on top of it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same grid, same input format, same output — three decisions are
     * left open, and they are the three the recursion is made of: which cells
     * are the base case, what the base case returns, and how the two smaller
     * answers combine. No learner sees both this and `m6.l6.b8`; the `tracks`
     * arrays put them on different routes.
     */
    id: "m6.l6.b8s",
    type: "fill_blank",
    skillRefs: ["recursion.core", "recursion.base_case", "func.return"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Тор r жол мен c бағаннан тұрады. Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін жүреміз, әр қадамда тек оңға немесе төмен жүруге болады. Осындай жолдардың саны неше? Код дайын, үш жері жоқ. Ойлан: егер тор бір ғана жолдан немесе бір ғана бағаннан тұрса, жол қанша? Ал соңғы ұяшыққа тек екі жақтан келуге болады — жоғарыдан және сол жақтан. Бірінші орынға логикалық амал керек — қыркүйекте `||` таңбасын көргенбіз.",
      ru: "Сетка состоит из r строк и c столбцов. Мы идём из левой верхней клетки в правую нижнюю, на каждом шаге разрешено двигаться только вправо или вниз. Сколько всего таких путей? Код готов, в нём не хватает трёх мест. Подумай: если сетка состоит всего из одной строки или из одного столбца, сколько путей? А в последнюю клетку можно прийти только с двух сторон — сверху и слева. На первое место нужна логическая операция — знак `||` мы видели в сентябре.",
    },
    template:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int paths(int r, int c) {\n" +
      "    if (r == 1 ___ c == 1) {\n" +
      "        return ___;\n" +
      "    }\n" +
      "    return paths(r - 1, c) ___ paths(r, c - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int r, c;\n" +
      "    cin >> r >> c;\n" +
      "    cout << paths(r, c);\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "||" },
      { id: "f2", answer: "1" },
      { id: "f3", answer: "+" },
    ],
  },
  {
    id: "m6.l6.b8",
    type: "modify_code",
    skillRefs: ["recursion.core", "recursion.call_tree", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["core", "advanced"],
    /*
     * «шағын тордағы жолдар санын есептеу», the second family this lesson owns.
     * Kept recursive on purpose: April rewrites the same recurrence as a table
     * and the repeated calls vanish. A loop here would delete that lesson three
     * months before it happens.
     *
     * The starting program counts only downward moves, so it returns 1 for
     * every grid — a symptom the learner can see on the visible sample before
     * changing a character.
     *
     * The degenerate programs and the case that kills each:
     *   - the given program, unchanged (always 1)   → "3 3" (visible), "3 7"
     *   - r * c                                     → "3 3": 9, not 6
     *   - r + c                                     → "3 3": 6 by accident, so
     *                                                 "2 3" (5, not 3) is here
     *   - base case on r == 0 or c == 0             → "1 1": returns 2, not 1
     *   - base case on r == 1 and c == 1            → "1 8": the recursion does
     *                                                 not stop
     *   - only one of the two moves recursed        → any non-edge grid
     * "1 8" and "8 1" are both present: a solution that special-cases only the
     * single row survives one of them and dies on the other.
     *
     * At the top of the range the answer is 3432 and the tree is a few thousand
     * calls at a depth of at most 14 — `int`, and nowhere near a stack limit.
     */
    prompt: {
      kk: "Тор r жол мен c бағаннан тұрады. Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін жүреміз, әр қадамда тек оңға немесе төмен жүруге болады. Осындай жолдардың саны неше? Мына бағдарлама тек төмен жүруді санайды, сондықтан ол әрқашан 1 шығарады. Оңға жүруді де қос. Бір жолда бос орынмен бөлінген r мен c беріледі (1 ≤ r ≤ 8, 1 ≤ c ≤ 8), жауап — жалғыз бүтін сан.",
      ru: "Сетка состоит из r строк и c столбцов. Мы идём из левой верхней клетки в правую нижнюю, на каждом шаге разрешено двигаться только вправо или вниз. Сколько всего таких путей? Эта программа считает только движение вниз, поэтому она всегда выводит 1. Добавь и движение вправо. В одной строке через пробел даны r и c (1 ≤ r ≤ 8, 1 ≤ c ≤ 8), ответ — одно целое число.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int paths(int r, int c) {\n" +
      "    if (r == 1 || c == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return paths(r - 1, c);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int r, c;\n" +
      "    cin >> r >> c;\n" +
      "    cout << paths(r, c);\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int paths(int r, int c) {\n" +
      "    if (r == 1 || c == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return paths(r - 1, c) + paths(r, c - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int r, c;\n" +
      "    cin >> r >> c;\n" +
      "    cout << paths(r, c);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 3", expectedOutput: "6" },
      { input: "2 3", expectedOutput: "3" },
      { input: "1 1", expectedOutput: "1", hidden: true },
      { input: "1 8", expectedOutput: "1", hidden: true },
      { input: "8 1", expectedOutput: "1", hidden: true },
      { input: "3 7", expectedOutput: "28", hidden: true },
      { input: "4 6", expectedOutput: "56", hidden: true },
      { input: "8 8", expectedOutput: "3432", hidden: true },
    ],
  },
  {
    id: "m6.l6.b9",
    type: "explain",
    skillRefs: ["recursion.core", "recursion.call_tree", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /*
     * «оқу және түсіндіру, толықтыру деңгейінде беріледі» — reading and
     * EXPLAINING, so this block is on all three routes, not only on advanced.
     * It also carries the half of `m6.l6.b7` that output comparison cannot see:
     * what the two parameters mean and what the undo line is for. A teacher
     * reads it; nothing here is machine-scored, and it settles as `unknown`.
     *
     * The fourth marking point is the one the C++ migration rewrote. In Python
     * the answer was «RecursionError», a named event with a message. In C++
     * there is no such event: the calls simply keep going until the stack is
     * gone, and then the program stops with nothing to read — or, if the
     * compiler has optimised the impossible recursion away, prints something
     * meaningless instead. Both are legal, and «нақты не болатынын алдын ала
     * айту мүмкін емес» is the honest teaching point, which is why the marking
     * point now ends on the habit rather than on an error name.
     */
    prompt: {
      kk: "Екі сұраққа жаз. 1) `build` функциясы қандай екі мәнді алады, әрқайсысы нені білдіреді және генератор жолдарды қандай ретпен шығарады — неге дәл сол ретпен? 2) Рекурсивті шақырудан кейінгі кері қайтару жолын («0» өшірілетін жолды) алып тастасақ, бағдарламамен не болады?",
      ru: "Ответь письменно на два вопроса. 1) Какие два значения принимает функция `build`, что означает каждое из них и в каком порядке генератор выводит строки — почему именно в таком? 2) Что произойдёт с программой, если убрать строку возврата после рекурсивного вызова (ту, где стирается «0»)?",
    },
    expectedPoints: [
      {
        kk: "`path` — әзірге жиналған тізбек, ал екінші мән — керекті ұзындық (немесе әлі толтырылмаған орындардың саны).",
        ru: "`path` — уже собранная последовательность, а второе значение — нужная длина (или количество ещё не заполненных позиций).",
      },
      {
        kk: "Әр шақыруда «0» «1»-ден бұрын таңдалады, сондықтан жолдар өсу ретімен шығады: бірінші жол — тек нөлдер, соңғы жол — тек бірлер.",
        ru: "В каждом вызове «0» выбирается раньше «1», поэтому строки выходят по возрастанию: первая строка — только нули, последняя — только единицы.",
      },
      {
        kk: "Ағаш тереңдігінен бастап солдан оңға жүреді: бір тармақ соңына дейін толық аяқталады, содан кейін ғана келесі тармақ басталады.",
        ru: "Дерево обходится в глубину слева направо: одна ветка доводится до конца, и только потом начинается следующая.",
      },
      {
        kk: "Кері қайтару жолы алынып тасталса, «0» `path`-та қалады да, оның үстіне «1» қосылады. `path` ұзындығы `n`-нен асып кетеді, тоқтату шарты ешқашан орындалмайды және шақырулар тоқтамайды. C++-та бұдан кейін не болатынын алдын ала айту мүмкін емес: көбіне шақыруларға арналған жад бітеді де, бағдарлама ешбір хабарсыз үзіліп қалады; кейде компилятор мұндай кодты басқаша аударып, мағынасыз бірдеңе шығарады. Түсінікті қате хабары мұнда мүлде болмайды — сондықтан тереңдікті іске қоспас бұрын өзің ойлап шығуың керек.",
        ru: "Если убрать строку возврата, «0» останется в `path`, и поверх него допишется «1». Длина `path` перескочит через `n`, базовый случай не сработает никогда, и вызовы не прекратятся. Что будет дальше в C++, заранее сказать нельзя: чаще всего кончается память под вызовы и программа обрывается без всякого сообщения; иногда компилятор переводит такой код иначе и печатает что-то бессмысленное. Никакого понятного сообщения об ошибке здесь не будет — поэтому о глубине нужно думать самому, до запуска.",
      },
      {
        kk: "Әр шақырудың өз `path`-ы болғандықтан (параметр мән бойынша берілген), кері қайтару тек осы шақырудың ішінде керек: шақырған жақтағы `path` бәрібір өзгермеген күйінде қалады.",
        ru: "Так как у каждого вызова свой `path` (параметр передан по значению), возврат нужен только внутри этого вызова: `path` вызывающей стороны и так остаётся нетронутым.",
      },
    ],
  },
  {
    id: "m6.l6.b10",
    type: "challenge",
    skillRefs: ["recursion.core", "recursion.call_tree", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["advanced"],
    /*
     * «Мықты оқушыларға - шахмат тақтасына уәзірлерді орналастыру есебі.» This
     * is the one blank editor the programme permits in this lesson, and only
     * for this route — the source is specifying the differentiation, so
     * `tracks: ["advanced"]` cites p.9 rather than a product decision.
     *
     * The reference solution builds a NEW list for the deeper call —
     * `vector<int> next = cols; next.push_back(c);` — instead of appending and
     * undoing, because `pop_back` is a method nothing in this course has taught
     * and because a fresh copy is what the Python `cols + [c]` meant. The board
     * is capped at 8, where the whole search runs in a small fraction of a
     * second at a depth of 8.
     *
     * The diagonal test is written as two comparisons rather than with `abs`,
     * so no header beyond `<iostream>` and `<vector>` is needed and nothing on
     * the card is a function the learner has not met: `row - i` is always
     * positive, so «сол диагональ» and «оң диагональ» are simply two cases.
     *
     * `ok` is an `int` holding 0 or 1 rather than a `bool`, matching the
     * convention every other decision recursion in this month uses.
     *
     * The degenerate programs and the case that kills each:
     *   - columns checked, diagonals forgotten → n = 4 (24, not 2), n = 6 (720)
     *   - diagonals checked, columns forgotten → n = 4, n = 5
     *   - prints n! or 2^n                     → n = 4, n = 6
     *   - a hardcoded table of small answers   → n = 7 and n = 8, both hidden
     * n = 2 and n = 3 are the boards with no arrangement at all, and a solution
     * that returns 1 for an unfinished board fails both.
     */
    prompt: {
      kk: "Мықты оқушыларға. n × n шахмат тақтасына n уәзірді бір-біріне тимейтіндей етіп қою керек: екі уәзір бір жолда, бір бағанда немесе бір диагональда тұрмауы тиіс. Бір бүтін сан n беріледі (1 ≤ n ≤ 8). Осындай орналастырулардың санын — жалғыз бүтін санды — шығар. Мысалы, n = 4 болғанда жауап 2, ал n = 3 болғанда жауап 0. Кеңес: әр жолға бір уәзірден қой да, сол жолдағы бағанды таңдағанда жоғарыдағы уәзірлердің бәрімен салыстыр. Тереңдігі n-нен аспайды, ал n ең көбі 8.",
      ru: "Для сильных учеников. На доске n × n нужно расставить n ферзей так, чтобы они не били друг друга: никакие два не стоят в одной строке, в одном столбце или на одной диагонали. Дано одно целое число n (1 ≤ n ≤ 8). Выведи количество таких расстановок — одно целое число. Например, при n = 4 ответ 2, а при n = 3 ответ 0. Подсказка: ставь по одному ферзю в каждую строку и, выбирая столбец в этой строке, сравнивай его со всеми ферзями выше. Глубина не превысит n, а n не больше 8.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int place(vector<int> cols, int row, int n) {\n" +
      "    if (row == n) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    int total = 0;\n" +
      "    for (int c = 0; c < n; c++) {\n" +
      "        int ok = 1;\n" +
      "        for (int i = 0; i < row; i++) {\n" +
      "            if (cols[i] == c) ok = 0;\n" +
      "            if (row - i == c - cols[i]) ok = 0;\n" +
      "            if (row - i == cols[i] - c) ok = 0;\n" +
      "        }\n" +
      "        if (ok == 1) {\n" +
      "            vector<int> next = cols;\n" +
      "            next.push_back(c);\n" +
      "            total = total + place(next, row + 1, n);\n" +
      "        }\n" +
      "    }\n" +
      "    return total;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> cols;\n" +
      "    cout << place(cols, 0, n);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4", expectedOutput: "2" },
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "0", hidden: true },
      { input: "3", expectedOutput: "0", hidden: true },
      { input: "5", expectedOutput: "10", hidden: true },
      { input: "6", expectedOutput: "4", hidden: true },
      { input: "7", expectedOutput: "40", hidden: true },
      { input: "8", expectedOutput: "92", hidden: true },
    ],
  },
];
