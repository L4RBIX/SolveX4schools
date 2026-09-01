import type { LessonBlock } from "../../types";

/**
 * m2.l5 · Тізімді қарап шығу — walking a list once, and the maximum.
 *
 * PDF p.7 names three families this lesson owns: «тізімдегі максимум мен
 * минимум», «қосынды және орташа мән», «орташадан үлкен элементтер саны».
 * October may not reach for a ready-made maximum, minimum or sum — the
 * traversal IS the lesson, and `<algorithm>` is not in this month at all.
 *
 * Four decisions taken once here, so no block re-litigates them:
 *
 * 1. **Input shape.** The count on the first line, the numbers on the second,
 *    read as `cin >> n; vector<int> a(n);` and a filling loop. Python could
 *    split a line and take the length from `len(a)`; C++ cannot, and the
 *    honest beginner form is to be told how many numbers are coming. Every
 *    prompt says so in both languages, and every prompt guarantees n ≥ 1 —
 *    `a[0]` on an empty vector is not a lesson.
 *
 * 2. **The best-so-far starts at `a[0]`, and that is the whole point.** The
 *    tempting `int best = 0;` is the PDF's own named typical error
 *    («жинақтаушы айнымалыға қате бастапқы мән беру»), and it is invisible on
 *    the friendly data most courses use. So the worked example, the prediction
 *    and one hidden case in every max-shaped task all run on all-negative
 *    input, where `best = 0` prints a number that is not in the list at all.
 *
 * 3. **The average is a `double`, and the cast is the lesson.** `s / n` on two
 *    `int`s truncates — September taught that at l4 and it has not stopped
 *    being true — so the average of `1 2 3 4` would print 2 instead of 2.5.
 *    The reference writes `(double)s / n`, the prompt says the answer is a
 *    fractional number, and one hidden case (`10 3 3`) has a non-terminating
 *    decimal so that the difference cannot be passed by accident.
 *
 * 4. **The average's tolerance is 1e-4, not 1e-6.** `cout` prints a `double`
 *    to six significant digits by default: 16 / 3 comes out as `5.33333`,
 *    which is 3.3e-6 away from the true value. A 1e-6 tolerance would reject
 *    the language's own default formatting — the exact thing a beginner
 *    writes — while 1e-4 still rejects a two-decimal rounding (`5.33` is off
 *    by 0.0033). Absolute rather than relative because one case has an average
 *    of exactly 0, where a relative tolerance means nothing.
 */
export const M2_L5: LessonBlock[] = [
  {
    id: "m2.l5.b1",
    type: "concept",
    skillRefs: ["lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Тізімнің әр элементін бір рет қарау",
      ru: "Просмотр каждого элемента списка ровно один раз",
    },
    /* Both forms in one block, with the choice between them stated as a rule
       the learner can apply, not as "you may also write". A course that shows
       only the range-for leaves the learner stuck the first time a task needs a
       neighbour; a course that shows only the index form produces `a[i]`
       everywhere, including where the index is never used. */
    body: {
      kk: "Тізімді екі түрлі жолмен аралауға болады.\n\n`for (int x : a)` — әр элементтің МӘНІН кезекпен береді. Мәннен басқа ештеңе керек болмаса, осы қысқа әрі қауіпсіз: мұнда индексті шатастырып, шекарадан шығып кету мүмкін емес. Бір ескерту: `x` — элементтің көшірмесі, сондықтан `x`-ті өзгертсең, тізімдегі сан өзгермейді.\n\n`for (int i = 0; i < n; i++)` — элементтің ОРНЫН береді, ал мәнге `a[i]` арқылы жетесің. Орын мына жағдайларда керек: элементтің нөмірін шығару керек, көршісімен (`a[i - 1]`) салыстыру керек немесе екі тізімді бірдей орындарда салыстыру керек. Қалған жағдайдың бәрінде бірінші түрін таңда.\n\nЕкінші түрде `n` дегеніміз — `int n = a.size();`. Ұзындықты алдымен `int`-ке жазып алатынымыз жайдан-жай емес: `a.size()` теріс бола алмайтын ерекше сан, ал `int`-пен салыстыру әрқашан күткендей жұмыс істейді.\n\nТағы бір нәрсе бірден керек болады: тізімнің қосындысы — бүтін сан, оны санға бөлсең, бөлу де бүтін болып, бөлшек бөлігі жоғалады. Орташа мәнді алу үшін екі санның бірін уақытша бөлшек ету керек:\n\n```\nint s = 13;\nint n = 4;\ncout << s / n << endl;          // 3 — бүтін бөлу\ncout << (double)s / n << endl;  // 3.25 — керегі осы\n```\n\nСанның алдындағы `(double)` «мұны бөлшек деп есепте» дегенді білдіреді. `s` өзі өзгермейді.",
      ru: "Список можно обойти двумя способами.\n\n`for (int x : a)` — по очереди даёт ЗНАЧЕНИЕ каждого элемента. Если ничего, кроме значения, не нужно, этот способ короче и безопаснее: тут невозможно перепутать индекс и выйти за границу. Одно замечание: `x` — это копия элемента, поэтому, изменив `x`, ты не изменишь число в списке.\n\n`for (int i = 0; i < n; i++)` — даёт ПОЗИЦИЮ, а до значения ты добираешься через `a[i]`. Позиция нужна в таких случаях: надо вывести номер элемента, надо сравнить его с соседом (`a[i - 1]`) или надо сравнить два списка по одинаковым позициям. Во всех остальных случаях выбирай первый способ.\n\nВо втором способе `n` — это `int n = a.size();`. Записывать длину сначала в `int` мы договорились не случайно: `a.size()` — особое число, которое не бывает отрицательным, а сравнение с `int` всегда ведёт себя ожидаемо.\n\nЕщё одно, что понадобится сразу: сумма списка — целое число, и если поделить её на количество, деление тоже будет целым и дробная часть пропадёт. Чтобы получить среднее, одно из двух чисел нужно на время сделать дробным:\n\n```\nint s = 13;\nint n = 4;\ncout << s / n << endl;          // 3 — целое деление\ncout << (double)s / n << endl;  // 3.25 — то, что нужно\n```\n\n`(double)` перед числом означает «посчитай это как дробное». Само `s` при этом не меняется.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {4, 7, 2};\n" +
      "    int n = a.size();\n" +
      "\n" +
      "    for (int x : a) {\n" +
      "        cout << x << endl;\n" +
      "    }\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << i << \" \" << a[i] << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m2.l5.b2",
    type: "worked_example",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Толық талданған мысал: ең үлкен мәнді табу",
      ru: "Разобранный пример: находим максимум",
    },
    /* Deliberately all-negative data. On {3, 9, 2} the wrong initialisation
       `best = 0` gives the right answer, so the reasoning below would be a rule
       the learner has no reason to believe. Here it is the difference between
       -2 and a number that never appears in the list. */
    problem: {
      kk: "Астанадағы бес күннің түнгі температурасы берілген: -4, -9, -2, -7, -6. Ең жылы түнді тап, яғни осы бес санның ең үлкенін шығар.",
      ru: "Даны ночные температуры в Астане за пять дней: -4, -9, -2, -7, -6. Найди самую тёплую ночь, то есть выведи наибольшее из этих пяти чисел.",
    },
    steps: [
      {
        kk: "Компьютер бүкіл тізімді бірден «көрмейді». Ол бір ғана нәрсені есінде ұстай алады: осы сәтке дейін кездескен ең үлкен мән. Оны `best` деп атаймыз.",
        ru: "Компьютер не «видит» весь список сразу. Он умеет держать в памяти одно значение: самое большое из уже просмотренных. Назовём его `best`.",
      },
      {
        kk: "`best` қай мәннен басталады? `int best = 0;` деп жазғың келеді. Бірақ мұнда температураның бәрі теріс: бірде-бір элемент 0-ден үлкен емес, сондықтан цикл `best`-ті мүлде өзгертпейді де, бағдарлама тізімде жоқ 0 санын шығарады.",
        ru: "С какого значения начать `best`? Хочется написать `int best = 0;`. Но здесь все температуры отрицательные: ни один элемент не больше нуля, поэтому цикл вообще не изменит `best`, и программа выведет 0 — число, которого в списке нет.",
      },
      {
        kk: "Сондықтан бастапқы мәнді тізімнің өзінен аламыз: `int best = a[0];`. Енді жауап әрқашан берілген сандардың бірі болады — қандай сандар келсе де.",
        ru: "Поэтому начальное значение берём из самого списка: `int best = a[0];`. Теперь ответ всегда будет одним из данных чисел — какими бы они ни оказались.",
      },
      {
        kk: "Бізге элементтердің орны керек емес, тек мәні керек — сондықтан `for (int x : a)` жеткілікті. Цикл әр элементті `best`-пен салыстырады: үлкені шықса, `best` жаңарады. `a[0]` екінші рет тексерілуі зиян емес, себебі `-4 > -4` жалған.",
        ru: "Позиции элементов нам не нужны, нужны только значения — поэтому достаточно `for (int x : a)`. Цикл сравнивает каждый элемент с `best`: если элемент больше, `best` обновляется. Повторная проверка `a[0]` безвредна, ведь `-4 > -4` ложно.",
      },
      {
        kk: "Қадамдар: -4 (бастапқы) → -9 кіші, өзгермейді → -2 үлкен, `best = -2` → -7 кіші → -6 кіші. Жауап: -2.",
        ru: "Шаги: -4 (начало) → -9 меньше, не меняем → -2 больше, `best = -2` → -7 меньше → -6 меньше. Ответ: -2.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {-4, -9, -2, -7, -6};\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    result: { kk: "Экранға: -2", ru: "На экран: -2" },
  },
  {
    id: "m2.l5.b3",
    type: "prediction",
    skillRefs: ["loops.accumulator", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The prompt is deliberately neutral. "Are you sure it prints -2?" would
       answer the question in the asking; the distractor is what carries the
       diagnosis. */
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {-4, -9, -2, -7, -6};\n" +
      "    int best = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    answer: "0",
    options: ["0", "-2", "-9", "-4"],
    diagnosticMapping: {
      /* Only -2 is mapped. -9 is reachable from at least two different
         confusions (the comparison read backwards, or magnitudes compared
         instead of values) and -4 is barely reachable at all, so neither one
         proves anything and both are left for the engine to ask about. */
      "-2": {
        failureClass: "accumulator_initial_value_ignored",
        justification:
          "-2 — тізімдегі шын максимум, бірақ бұл бағдарлама оны шығармайды. Бұл жауапты таңдау экрандағы кодты емес, «максимум табатын код» деген жорамалды оқығанды білдіреді: `int best = 0;` болғандықтан бірде-бір теріс сан шартқа сай келмейді және цикл `best`-ті бір рет те өзгертпейді.",
      },
    },
  },
  {
    id: "m2.l5.b4",
    type: "trace_code",
    skillRefs: ["lists.traverse", "lists.index", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The step list names the loop header, not every executed line. Naming the
       `if` and the assignment would say out loud how many times the update
       fired — which is the entire question. Recording (i, best) at the moment
       control returns to the header keeps the semantics honest (`best` is the
       value carried into this iteration) and makes the single update at i = 2
       visible only to a learner who actually compared a[2] with -4. */
    prompt: {
      kk: "Бағдарламаны қағазда қадамдап орында. Цикл басына оралған сайын `i` мен `best`-тің сол сәттегі мәнін жаз.",
      ru: "Выполни программу по шагам на бумаге. Каждый раз, когда управление возвращается к заголовку цикла, записывай текущие значения `i` и `best`.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {-4, -9, -2, -7, -6};\n" +
      "    int n = a.size();\n" +
      "    int best = a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] > best) {\n" +
      "            best = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 8, vars: { best: "-4" } },
      { line: 9, vars: { i: "1", best: "-4" } },
      { line: 9, vars: { i: "2", best: "-4" } },
      { line: 9, vars: { i: "3", best: "-2" } },
      { line: 9, vars: { i: "4", best: "-2" } },
      { line: 14, vars: { best: "-2" } },
    ],
  },
  {
    id: "m2.l5.b5",
    type: "fill_blank",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* Two blanks, and both are the lesson: the initial value comes from the
       data, and the direction of the comparison is the only difference between
       a minimum and a maximum. A single-blank version would let a learner flip
       one character and never think about where `small` starts. */
    prompt: {
      kk: "Бірінші жолда сандардың саны n, екінші жолда сол n бүтін сан беріледі. Бағдарлама тізімдегі ең кіші мәнді табуы керек. Екі орынды толтыр: `small` қай элементтен басталады және салыстыру белгісі қандай болуы керек.",
      ru: "В первой строке дано количество чисел n, во второй — эти n целых чисел. Программа должна найти минимум списка. Заполни два пропуска: с какого элемента начинается `small` и какой знак сравнения здесь нужен.",
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
      "    int small = a[___];\n" +
      "    for (int x : a) {\n" +
      "        if (x ___ small) {\n" +
      "            small = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << small;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "<" },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m2.l5.b6 — the same problem, assembled instead
       of written. PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден
       жазу азырақ». Support meets the maximum, it just does not meet a blank
       editor. */
    id: "m2.l5.b6s",
    type: "reorder_code",
    skillRefs: ["lists.traverse", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    /*
     * Two decisions carry the task, and neither is readable off the shape of
     * the cards: whether `int best = a[0];` comes before or after the loop, and
     * which of the two `cout` lines comes first.
     *
     * The earlier Python version had seven one-line cards at three different
     * indents, and a deterministic shuffle that left the first three already in
     * place — so the rest could be ordered by counting leading spaces without
     * reading a word. C++ makes that worse, not better: braces are even louder
     * than indentation. So the frame and the reading loop arrive as whole
     * cards, the traversal arrives as one card, and what is left to order is
     * exactly the two decisions above. Neither is ambiguous — there is one
     * correct order — but neither is derivable from whitespace.
     */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Бірінші жолда сандардың саны, екінші жолда сандардың өзі оқылады, ең үлкені табылады, содан кейін АЛДЫМЕН ең үлкен сан, СОСЫН сандардың саны бөлек жолдарға шығады. Бастапқы мән тізімнің бірінші элементінен алынатынын ұмытпа.",
      ru: "Расставь строки по порядку. Сначала читается количество чисел, затем сами числа, находится наибольшее, а потом выводятся СНАЧАЛА наибольшее число, ПОТОМ количество чисел — каждое на своей строке. Помни, что начальное значение берётся из первого элемента списка.",
    },
    lines: [
      {
        id: "r1",
        code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {",
      },
      {
        id: "r2",
        code:
          "    int n;\n" +
          "    cin >> n;\n" +
          "    vector<int> a(n);\n" +
          "    for (int i = 0; i < n; i++) {\n" +
          "        cin >> a[i];\n" +
          "    }",
      },
      { id: "r3", code: "    int best = a[0];" },
      {
        id: "r4",
        code:
          "    for (int x : a) {\n" +
          "        if (x > best) {\n" +
          "            best = x;\n" +
          "        }\n" +
          "    }",
      },
      { id: "r5", code: "    cout << best << endl;" },
      { id: "r6", code: "    cout << n << endl;" },
      { id: "r7", code: "    return 0;\n}" },
    ],
    correctOrder: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"],
  },
  {
    id: "m2.l5.b6",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Солардың ең үлкенін шығар. Дайын максимум табатын құралдарды қолдануға болмайды — әр элементті бір рет қарап шығатын циклмен тап.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи наибольшее из них. Пользоваться готовыми средствами поиска максимума нельзя — найди его циклом, который просматривает каждый элемент один раз.",
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
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    /* Each case is aimed at a specific wrong program:
       "1 / 5"                → a solution that starts at a[1];
       "5 / -4 -9 -2 -7 -6"   → best = 0, which prints 0 on every other case in
                                this set and is only exposed by all-negative
                                data;
       "3 / 8 3 1"            → a loop that skips a[0] entirely (maximum first);
       "3 / 1 3 8"            → a loop that stops at n − 1, the missed last
                                element;
       "3 / 10 9 8"           → a strictly decreasing run, where nothing after
                                the first element ever updates `best`;
       "3 / 4 4 4"            → all equal, so nothing ever updates and the
                                answer still has to come out. */
    cases: [
      { input: "4\n3 9 2 7", expectedOutput: "9" },
      { input: "1\n5", expectedOutput: "5" },
      { input: "5\n-4 -9 -2 -7 -6", expectedOutput: "-2", hidden: true },
      { input: "3\n8 3 1", expectedOutput: "8", hidden: true },
      { input: "3\n1 3 8", expectedOutput: "8", hidden: true },
      { input: "3\n10 9 8", expectedOutput: "10", hidden: true },
      { input: "3\n4 4 4", expectedOutput: "4", hidden: true },
    ],
  },
  {
    id: "m2.l5.b7",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.accumulator", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Бірінші жолға олардың қосындысын, екінші жолға орташа мәнін шығар. Орташа мән — қосындыны сандар санына бөлген нәтиже, ал ол бөлшек сан болуы мүмкін: екі бүтін санды бөлсең, бөлшек бөлігі қиылып қалады, сондықтан бөлуден бұрын `(double)` деп түрлендір. Мысалы, n = 4 және `1 2 3 4` үшін жауап `10` және `2.5`. Дайын қосынды табатын құралдарды қолдануға болмайды.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. В первой строке выведи их сумму, во второй — среднее значение. Среднее — это сумма, делённая на количество чисел, и оно может быть дробным: при делении двух целых чисел дробная часть отбрасывается, поэтому перед делением приведи сумму к `(double)`. Например, для n = 4 и `1 2 3 4` ответ `10` и `2.5`. Пользоваться готовыми средствами суммирования нельзя.",
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
      "    int s = 0;\n" +
      "    for (int x : a) {\n" +
      "        s += x;\n" +
      "    }\n" +
      "    double avg = (double)s / n;\n" +
      "    cout << s << endl;\n" +
      "    cout << avg;\n" +
      "    return 0;\n" +
      "}",
    /* See the file header, decision 4: absolute, 1e-4, and no relative
       tolerance — the "-3 3" case has an average of exactly 0, where a
       relative tolerance is a tolerance of nothing. */
    checker: { kind: "numeric", absoluteTolerance: 1e-4 },
    cases: [
      { input: "3\n1 2 3", expectedOutput: "6\n2" },
      { input: "4\n1 2 3 4", expectedOutput: "10\n2.5" },
      /* One element: n is 1, and a solution that divides by n − 1 divides by
         zero here instead of quietly producing nonsense. */
      { input: "1\n5", expectedOutput: "5\n5", hidden: true },
      /* A non-terminating decimal — this is the case the tolerance exists for,
         and the case that fails an average computed with integer division: 16 / 3
         is 5, not 5.33333. */
      { input: "3\n10 3 3", expectedOutput: "16\n5.33333", hidden: true },
      /* Sum zero: kills `s = a[0]` before the loop, which double-counts. */
      { input: "2\n-3 3", expectedOutput: "0\n0", hidden: true },
      { input: "3\n-5 -5 -5", expectedOutput: "-15\n-5", hidden: true },
    ],
  },
  {
    id: "m2.l5.b8",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.counter", "loops.accumulator", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The two-pass structure is stated in the prompt on purpose. This is the
       first task in the course where one traversal is genuinely not enough,
       and a learner who does not see why will write the counter into the first
       loop and compare against a running sum. Naming the reason ("until the
       average is known there is nothing to count") is teaching, not giving the
       answer away — the code is still entirely theirs. */
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Орташа мәннен қатаң үлкен элементтердің санын шығар. Тізімді екі рет аралау керек: біріншісінде қосындыны жинайсың (орташа мән әлі белгісіз болғандықтан санауға ештеңе жоқ), екіншісінде санайсың. Орташа мән бөлшек сан болуы мүмкін, сондықтан оны `double` етіп есепте. Орташа мәнге тең элементтер саналмайды.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи, сколько элементов строго больше среднего значения. Список придётся пройти дважды: на первом проходе копится сумма (пока среднее неизвестно, считать нечего), на втором идёт подсчёт. Среднее может быть дробным, поэтому считай его как `double`. Элементы, равные среднему, не считаются.",
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
      "    int s = 0;\n" +
      "    for (int x : a) {\n" +
      "        s += x;\n" +
      "    }\n" +
      "    double avg = (double)s / n;\n" +
      "    int cnt = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x > avg) {\n" +
      "            cnt += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << cnt;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\n1 2 3", expectedOutput: "1" },
      /* All equal: the average equals every element, so `>=` in place of `>`
         answers 3 where the correct answer is 0. This case is what makes
         «қатаң үлкен» mean something, and it is visible on purpose — the
         learner should meet the boundary before the hidden cases judge it. */
      { input: "3\n4 4 4", expectedOutput: "0" },
      { input: "1\n5", expectedOutput: "0", hidden: true },
      { input: "5\n1 2 3 4 5", expectedOutput: "2", hidden: true },
      /* Negative data: an answer keyed off "greater than zero" scores 0 here.
         The average is -2, and only -1 is above it. */
      { input: "3\n-1 -2 -3", expectedOutput: "1", hidden: true },
      /* One outlier drags the average up: 14 / 5 = 2.8, so only 10 qualifies.
         Integer division would give 2 and count 10 only as well — but the next
         case separates the two. */
      { input: "5\n10 1 1 1 1", expectedOutput: "1", hidden: true },
      /* 10 / 4 is 2.5 as a double and 2 as an int: with integer division the
         element 3 would wrongly count and the answer would be 2 either way, so
         this case is paired with «1 2 3» above, where 6 / 3 is exact and the
         count is 1. */
      { input: "4\n1 2 3 4", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* ADVANCED ONLY. Chosen over "the second largest value" because it is the
       block that pays off m2.l5.b1: the comparison is with the PREVIOUS
       element, so `for (int x : a)` cannot express it and the index form stops
       being an alternative style and becomes the only way to write the program.
       Two accumulators (`cur`, `best`) with different reset rules is the second
       thing it teaches. */
    id: "m2.l5.b9",
    type: "write_code",
    skillRefs: ["lists.index", "loops.counter", "lists.traverse"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Қатар тұрған бірдей сандардың ең ұзын тізбегінің ұзындығын шығар. Мысалы, n = 6 және `4 4 4 1 4 4` үшін жауап 3. Мұнда әр элементті көршісімен салыстыру керек, сондықтан `for (int x : a)` жетпейді — индекс керек болады.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи длину самой длинной цепочки одинаковых чисел, идущих подряд. Например, для n = 6 и `4 4 4 1 4 4` ответ 3. Здесь каждый элемент надо сравнивать с соседом, поэтому `for (int x : a)` не хватит — понадобится индекс.",
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
      "    int best = 1;\n" +
      "    int cur = 1;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] == a[i - 1]) {\n" +
      "            cur += 1;\n" +
      "        } else {\n" +
      "            cur = 1;\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "6\n1 1 2 2 2 3", expectedOutput: "3" },
      { input: "2\n5 5", expectedOutput: "2" },
      /* One element: the loop from i = 1 never runs, so the answer is the
         initial 1. A solution that starts `best` at 0 answers 0 here. */
      { input: "1\n7", expectedOutput: "1", hidden: true },
      { input: "4\n1 2 3 4", expectedOutput: "1", hidden: true },
      /* The longest run is not the last one — this kills printing `cur`. */
      { input: "6\n4 4 4 1 4 4", expectedOutput: "3", hidden: true },
      /* The longest run IS the last one — this kills a program that only
         updates `best` at the moment the run breaks. */
      { input: "6\n1 2 2 3 3 3", expectedOutput: "3", hidden: true },
      { input: "4\n-2 -2 -2 -2", expectedOutput: "4", hidden: true },
    ],
  },
];
