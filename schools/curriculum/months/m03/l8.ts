import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша · Lesson 8 — «Тізім мен мәтінге арналған функциялар» /
 * «Функции для списков и строк». 9 min. Taught FOURTH, straight after `return`.
 *
 * ## Which clauses of the programme drive it
 *
 * Three of November's eight practice families live in this one lesson, and the
 * PDF (p.8) names all three in its own words:
 *
 *   «максимум мен минимум функциясы»        → b5, b6
 *   «тізімді өңдейтін көмекші функциялар»   → b8, b8s
 *   «мәтінге арналған тексерулер»           → b7, and b9 for advanced
 *
 * A fourth clause decides the shape of every block: «параметр беру және return
 * арқылы нәтиже қайтару». And b9 is where «бірнеше функциядан тұратын шағын
 * бағдарлама» first appears — one helper calling another — which is the idea
 * l6 and l7 then build a whole decomposition on.
 *
 * Worked example #4 of the month's six is b2. The other five are in l1, l2, l3,
 * l5 and l6; see the month file's opening comment for the count.
 *
 * ## The two types this lesson introduces, and why they arrive together
 *
 * `vector<int>` as a PARAMETER and `string` at all. October gave the learner
 * `vector<int>` as a variable — `push_back`, `size`, `v[i]`, range-`for` — and
 * September gave them string LITERALS inside `cout`. Neither has ever crossed a
 * function boundary, and `string` has never been a variable they could read
 * into or index.
 *
 * Both arrive in b1's body because the lesson's title asks for both, and
 * because the shape is identical: a whole collection goes in as one parameter,
 * one value comes back out. The three C++ facts that go with them are stated
 * there and nowhere else in the month:
 *
 * - **A parameter is a copy, and that includes a `vector`.** Nothing a function
 *   does to `a` can reach the caller's list. Python is confusingly split on
 *   this — ints are copied, lists are not — and C++ is uniform, which is a
 *   genuine simplification and worth saying out loud. No task in November needs
 *   `&`, so no task in November has one.
 * - **`s[i]` on a `string` is a `char`, written with single quotes.** `'a'` and
 *   `"a"` are different things, and b7 and b9 both depend on the difference.
 * - **`a.size()` is the length of either.** The same call for both types, which
 *   is most of why they can share one paragraph.
 *
 * ## Why this lesson exists at all, given October already found a maximum
 *
 * October's `m2.l5.b2` walked a list and kept a best-so-far, and it argued
 * `best = a[0]` from a list of negative temperatures. November's contribution
 * is not the loop. It is that the data is no longer in front of you: the caller
 * hands the list in, and the function has to be right for lists its author
 * never saw. So b2 makes the same argument in the form that only a function can
 * carry — ONE `largest` called on TWO lists, where `best = 0` gets the right
 * answer on the first one by luck and returns a number that is not in the
 * second one at all. A rule that survives one dataset by accident is not a rule
 * a fourteen-year-old has any reason to believe; a rule that visibly breaks the
 * second call is.
 *
 * The same discipline picks the text task. October's `m2.l6.b4` already counts
 * vowels and `m2.l6.b7` already prints `yes`/`no` for a palindrome, so
 * repeating either as a function would be a wrapper exercise. b7 instead splits
 * the decision from the printing: `is_palindrome(word)` RETURNS 1 or 0 and
 * prints nothing, and the caller turns that number into `yes` or `no`. That is
 * the November idea — return is not print — stated as a task rather than as a
 * sentence. `count_vowels` comes back at b9, but only as the inner half of a
 * larger question no October block asked.
 *
 * ## The library is absent, and that is the exercise
 *
 * `max_element`, `min_element`, `accumulate` and `sort` are not November's, and
 * the programme asks the learner to WRITE the max/min function this month — so
 * a reference solution calling a library algorithm would not be a shortcut, it
 * would be the deleted task. Everything here is a function, a `return`, a loop
 * and a comparison. `<algorithm>` is not included anywhere in the month.
 *
 * ## Input carries its own count now, and that is a real change
 *
 * Python read a whole line of unknown length with `input().split()`. C++ has no
 * equivalent inside November's vocabulary: reading to end-of-file wants
 * `while (cin >> x)`, which is a stream used as a truth value, and the
 * September pedagogy is explicit that a condition needs a real comparison. So
 * every list task in this month states its length first — `n`, then `n` values
 * — which is the ordinary competitive format and needs nothing the learner has
 * not met. The cases carry the count; the answers did not otherwise change.
 *
 * ## The one-element list, and why it recurs
 *
 * b3, b4 and b7 all put a call with nothing to iterate over in front of the
 * learner: `smallest` on a one-element list, whose index loop from 1 never
 * runs, and `is_palindrome("a")`, whose `n / 2` is 0 so its loop never runs. A
 * helper is a contract, and a contract that only holds when the loop turns at
 * least once is the bug that will cost this cohort its first contest points.
 * Meeting it three times in nine minutes, in two different problems, is
 * deliberate.
 *
 * ## Track routing
 *
 * b8 (modify) is core and advanced; support meets the same list helper as b8s,
 * a fill-blank on the finished program — «дайын кодты құрастыру мен толықтыру
 * көбірек, нөлден жазу азырақ» (p.6). b9 is advanced only: two functions where
 * one calls the other, plus a tie rule that a `>=` gets wrong. Every other
 * block is on all three routes.
 */
export const M3_L8: LessonBlock[] = [
  {
    id: "m3.l8.b1",
    type: "concept",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Тізімді қабылдап, бір мән қайтаратын функция",
      ru: "Функция, которая принимает список и возвращает одно значение",
    },
    /* The body states the SHAPE, because the shape is what transfers: parameter
       is the whole vector, one local holds the answer, one traversal, and the
       `return` after the loop. It also has to pay for two new types and the
       copy rule, because b7 and b8 both spend them and nothing else in the
       month introduces either. The last sentence is the November boundary the
       rest of the lesson is graded on — the function does not print, the caller
       decides what to do with the value. */
    body: {
      kk: "Функцияға бір ғана сан емес, тізімнің өзін де беруге болады: параметрдің түрі `vector<int>` болады. Осындай көмекші функцияның пішіні әрқашан бірдей: параметр — бүкіл тізім, ішінде жауап жиналатын жергілікті айнымалы, содан кейін тізімді бір рет аралайтын цикл, ал ең соңында сол жауапты қайтаратын `return`. `return` циклдің ішінде емес, циклден КЕЙІН тұрады: цикл денесіне қойсаң, функция бірінші элементті көрген бойда тоқтап қалады.\n\nМаңызды ереже: параметр — әрқашан КӨШІРМЕ. Функция `a`-ны қанша өзгертсе де, шақырған жердегі тізім сол күйінде қалады. Бұл `int` үшін де, `vector<int>` үшін де бірдей жұмыс істейді — C++-та бұл жерде ерекшелік жоқ.\n\nМәтін де осылай беріледі, тек түрі `string` болады: `int count(string w)`. Мәтінді `cin >> w;` деп оқимыз (ол бір сөзді, бос орынға дейін оқиды), ұзындығын `w.size()` береді — тізімдегідей, `a.size()` сияқты. `w[i]` — сөздің i-нші ӘРПІ, оның түрі `char`, ал бір әріп бір тырнақшамен жазылады: `w[i] == 'a'`. Қос тырнақшадағы `\"a\"` — бұл әріп емес, мәтін; оларды шатастыруға болмайды.\n\nЕң бастысы — функция ештеңе шығармайды. Ол мәнді қайтарады, ал оны экранға шығару керек пе, жоқ па, оны шақырған жер шешеді.",
      ru: "В функцию можно передать не только одно число, но и целый список: тип параметра тогда — `vector<int>`. У такой вспомогательной функции всегда одна и та же форма: параметр — весь список, внутри локальная переменная, в которой копится ответ, затем цикл, один раз проходящий по списку, и в самом конце `return`, возвращающий этот ответ. `return` стоит не внутри цикла, а ПОСЛЕ него: если поставить его в тело цикла, функция остановится сразу на первом элементе.\n\nВажное правило: параметр — это всегда КОПИЯ. Сколько бы функция ни меняла `a`, список в месте вызова останется прежним. Для `int` и для `vector<int>` это работает одинаково — в C++ здесь нет исключений.\n\nТекст передаётся так же, только тип у него `string`: `int count(string w)`. Читаем текст через `cin >> w;` (читается одно слово, до пробела), длину даёт `w.size()` — как и у списка, `a.size()`. А `w[i]` — это i-я БУКВА слова, её тип `char`, и одна буква пишется в одинарных кавычках: `w[i] == 'a'`. Запись `\"a\"` в двойных кавычках — это не буква, а текст; путать их нельзя.\n\nИ самое главное — функция ничего не печатает. Она возвращает значение, а печатать его или нет, решает то место, откуда её вызвали.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int total(vector<int> a) {\n" +
      "    int s = 0;\n" +
      "    for (int x : a) {\n" +
      "        s = s + x;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> nums = {4, 7, 2};\n" +
      "    vector<int> tens = {10, 10};\n" +
      "    cout << total(nums) << endl;   // 13\n" +
      "    cout << total(tens) << endl;   // 20\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * WORKED EXAMPLE #4 of the month's six. «Алты толық талданған мысал» (p.8).
     *
     * The two lists are the whole argument. On `box` the wrong initialisation
     * `best = 0` returns 20, which is correct — so a learner who only ever sees
     * that call has been given a rule with no evidence behind it. On `night`
     * the same initialisation returns 0, a number that appears nowhere in the
     * data. That is what a function does to you: it is called on inputs its
     * author did not choose, and "it worked on my example" stops being an
     * argument. Step 3 says exactly that in one sentence.
     *
     * Step 5 exists because the same file's b1 has just claimed `return` goes
     * after the loop; here the claim is cashed out — inside the loop it would
     * return `a[0]` every time, which for `night` is the answer -4 rather
     * than -2 and looks almost right.
     */
    id: "m3.l8.b2",
    type: "worked_example",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: ең үлкенін қайтаратын функция",
      ru: "Разобранный пример: функция, возвращающая наибольшее",
    },
    problem: {
      kk: "Екі тізім бар. Біріншісі — сынып қорына бір апта бойы салынған сомалар: 12, 5, 9, 20, 3. Екіншісі — қарашадағы бес түннің температурасы: -4, -9, -2, -7, -6. Екеуінің де ең үлкен мәнін тап. Бірдей циклді екі рет жазба: бір функция жаз да, оны екі рет шақыр.",
      ru: "Есть два списка. Первый — суммы, которые за неделю положили в классную копилку: 12, 5, 9, 20, 3. Второй — температуры пяти ноябрьских ночей: -4, -9, -2, -7, -6. Найди наибольшее значение в каждом. Не пиши один и тот же цикл дважды: напиши одну функцию и вызови её два раза.",
    },
    steps: [
      {
        kk: "Екі есептің сұрағы бір, тек деректері бөлек. Демек өзгеретін нәрсе — тізімнің өзі, ал өзгеретін нәрсе параметрге айналады: `int largest(vector<int> a)`. Бірінші `int` — қайтаратын мәннің түрі, `vector<int>` — параметрдің түрі. Функцияның ішінде тізім `a` деп аталады, ал шақырған жерде оның аты мүлде басқа болуы мүмкін.",
        ru: "Вопрос в обеих задачах один и тот же, разные только данные. Значит, меняется сам список — а то, что меняется, становится параметром: `int largest(vector<int> a)`. Первый `int` — тип возвращаемого значения, `vector<int>` — тип параметра. Внутри функции список зовут `a`, а в месте вызова у него может быть совсем другое имя.",
      },
      {
        kk: "Ең үлкенді табу үшін бір ғана мәнді есте ұстау жеткілікті: осы уақытқа дейін кездескендердің ең үлкені. Оны `best` деп атаймыз. Ол — жергілікті айнымалы, функция аяқталған соң жоғалады.",
        ru: "Чтобы найти наибольшее, достаточно помнить одно значение: самое большое из уже просмотренных. Назовём его `best`. Это локальная переменная — когда функция закончится, она исчезнет.",
      },
      {
        kk: "`best = 0` деп бастауға болмайды. Бірінші тізімде ол жауапты кездейсоқ дұрыс береді — 20. Ал екіншісінде сандардың бәрі теріс, сондықтан цикл `best`-ті бір рет те өзгертпейді және функция тізімде мүлде жоқ 0 санын қайтарады. Функцияны сен көрмеген деректермен де шақыратынын ұмытпа.",
        ru: "Начинать с `best = 0` нельзя. На первом списке ответ случайно окажется верным — 20. А на втором все числа отрицательные, поэтому цикл ни разу не изменит `best`, и функция вернёт 0 — число, которого в списке вообще нет. Помни: функцию вызовут и на тех данных, которых ты не видел.",
      },
      {
        kk: "Сондықтан бастапқы мән тізімнің өзінен алынады: `int best = a[0];`. Енді жауап әрқашан берілген сандардың бірі болады, қандай тізім келсе де. `a[0]`-ді өзімен салыстыру зиянсыз, себебі `12 > 12` жалған.",
        ru: "Поэтому начальное значение берётся из самого списка: `int best = a[0];`. Теперь ответ всегда будет одним из данных чисел, какой бы список ни пришёл. Сравнение `a[0]` с самим собой безвредно: `12 > 12` — ложь.",
      },
      {
        kk: "`return best;` циклден кейін тұрады. Егер ол цикл денесіне түссе, функция бірінші элементті көрген бойда тоқтап, әрқашан `a[0]`-ді қайтарар еді: екінші тізімде бұл -2 емес, -4 болып шығады — қатесі байқалмай қалуы да мүмкін.",
        ru: "`return best;` стоит после цикла. Если он попадёт в тело цикла, функция остановится на первом же элементе и всегда будет возвращать `a[0]`: на втором списке это даст -4 вместо -2 — ошибка, которую легко не заметить.",
      },
      {
        kk: "Шақырулар: `largest(box)` → `best` 12, 12, 12, 20, 20 болып өзгереді, жауабы 20. `largest(night)` → -4, -4, -2, -2, -2, жауабы -2. Бір функция, екі түрлі жауап.",
        ru: "Вызовы: `largest(box)` → `best` меняется как 12, 12, 12, 20, 20, ответ 20. `largest(night)` → -4, -4, -2, -2, -2, ответ -2. Одна функция — два разных ответа.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int largest(vector<int> a) {\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> box = {12, 5, 9, 20, 3};\n" +
      "    vector<int> night = {-4, -9, -2, -7, -6};\n" +
      "    cout << largest(box) << endl;\n" +
      "    cout << largest(night) << endl;\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Экранға екі жол шығады: алдымен 20, содан кейін -2.",
      ru: "На экран выйдут две строки: сначала 20, затем -2.",
    },
  },
  {
    /*
     * The one-element call, in the version where it actually bites. Written as
     * a range-`for` the body still runs once and nothing is at stake; written
     * as an index loop from 1 — the perfectly ordinary "start from the second
     * element" variant — the body never runs at all, and the function has to be
     * correct anyway. `best = a[0]` is what makes it correct, which is the same
     * sentence b2 argued from the other direction.
     *
     * `int n = a.size();` is written out rather than comparing `i` against
     * `a.size()` directly: `size()` is unsigned, and a signed/unsigned
     * comparison is a warning the learner has no way to interpret and no reason
     * to meet in November. The habit shown here is the one every list task in
     * the month uses.
     *
     * The prompt is neutral on purpose. "What happens when the loop does not
     * run?" would answer the question in the asking; the distractors carry the
     * diagnosis instead.
     *
     * Two of the three wrong options are left unmapped, and deliberately.
     * "3" is reached both from "a call whose loop never runs prints nothing"
     * and from "the first call is an error", and "5" both from "only the first
     * line appears" and from reading the loop as running up to and including
     * `n`, which would read past the end of a two-element list. Neither answer
     * establishes one cause, so the engine asks.
     */
    id: "m3.l8.b3",
    type: "prediction",
    skillRefs: ["func.return", "func.parameters", "lists.index", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады? Функция екі рет шақырылады, әр шақыру өз жолын шығарады. Тізімдердің ұзындығына назар аудар.",
      ru: "Что выведет эта программа? Функция вызывается дважды, каждый вызов печатает свою строку. Обрати внимание на длину списков.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int smallest(vector<int> a) {\n" +
      "    int best = a[0];\n" +
      "    int n = a.size();\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] < best) {\n" +
      "            best = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> one = {5};\n" +
      "    vector<int> two = {8, 3};\n" +
      "    cout << smallest(one) << endl;\n" +
      "    cout << smallest(two) << endl;\n" +
      "    return 0;\n" +
      "}",
    answer: "5\n3",
    options: ["5\n3", "5\n8", "3", "5"],
    diagnosticMapping: {
      "5\n8": {
        failureClass: "comparison_direction_misread",
        justification:
          "8 — бұл {8, 3} тізіміндегі ең ҮЛКЕН сан, ал функция ең кішісін іздейді. Бұл жауапқа жетудің жалғыз жолы бар: `a[i] < best` шартын «үлкен болса» деп оқу. Бірінші жолдың 5 болып қалуы да соны растайды — бір элементті тізімде цикл мүлде жүрмейді, сондықтан салыстыру бағыты тек екінші шақыруда көрінеді.",
      },
    },
  },
  {
    /*
     * «Платформа функция шақырылғанда қандай параметр мәндері кіретінін,
     * қандай жергілікті айнымалылар пайда болатынын және return кезінде не
     * қайтатынын визуалды көрсетеді» (p.8). This is that trace done by hand,
     * and the three columns are the three things that sentence names, in its
     * order: the locals `x` and `best` that the call brings into existence, and
     * `top` — the caller's name for what `return` handed back.
     *
     * The data is {4, 9, 9, 2}. `4` is first and is not the answer, `2` is last
     * and is not the answer, so "returns the first" and "returns the last" both
     * die in the table. The repeated 9 buys the row that matters most: `9 > 9`
     * is false, so `best` does not move, and a learner who expected an update
     * on every element sees it not happen.
     *
     * ## The row the language changed
     *
     * In Python `x` outlived its loop, so the `return` row still held 2. In C++
     * `x` is declared by the range-`for` itself and dies with the loop's closing
     * brace, so the row at line 12 says `-`. That is not a detail smuggled in:
     * it is block scope, this month's own subject, and it is the one cell in the
     * table that a learner cannot fill by carrying a Python habit across. The
     * prompt states the rule rather than springing it, because `m3.l4` is where
     * it is taught and this lesson is taught before it.
     *
     * ## Why the list has no column
     *
     * It had two: `nums` beside `a`, on all eight rows, to show that one list
     * can wear two names. What it actually showed was how to copy. The value of
     * both columns is printed in the program the learner is looking at, so
     * fourteen of the thirty-two cells were transcription — and the grid marks
     * a cell by exact string equality, so a list typed without the spaces lost
     * all fourteen while proving nothing whatever about scope. The privacy
     * scanner reported the same fact from the other side: a cell whose answer
     * can be read off the screen is a cell whose answer the page has to ship.
     * Hiding it was never available — it IS the program.
     *
     * Dropping the two names does not drop the parameter. Nobody fills the `x`
     * column, or the 4 that starts `best`, without having understood that `a`
     * is the caller's list: every value in the table is read out of it. So the
     * parameter is now used instead of copied, which tests the same idea harder
     * and costs no cells. That `nums` and `a` are one list under two names — and
     * that in C++ `a` is a COPY of it — is said in the prompt, where a claim is
     * free.
     */
    id: "m3.l8.b4",
    type: "trace_code",
    skillRefs: ["func.parameters", "func.return", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Функция шақырылғанда ішінде қандай айнымалылар пайда болатынын, шақыру біткен соң олардың қайсысы қалатынын қадамдап жаз. Кестеде үш баған: `x` — цикл айнымалысы, `best` — жауап жиналатын жергілікті айнымалы, `top` — функциядан тыс жердегі, қайтқан мән жазылатын айнымалы. `nums` тізімі функцияға `a` параметрі арқылы беріледі — бұл сол тізімнің көшірмесі, сондықтан `x` пен `best`-тің мәндерін дәл сол сандардан оқисың. Цикл қатарлары — цикл денесі сол `x` үшін толық орындалып болғандағы күй. Ат сол сәтте әлі пайда болмаған немесе жойылып кеткен болса, `-` таңбасын қой. Есіңде болсын: `x` циклдің `{ }` жақшаларының ішінде ғана өмір сүреді — цикл біткенде ол да жоғалады. Бірінші қатар — шақыруға дейінгі сәт, ең соңғысы — 18-жол орындалып, қайтқан мән `top`-қа жазылған сәт: сол сәтте қай аттар әлі бар, соны ойлан.",
      ru: "Пройди по шагам и запиши, какие переменные появляются внутри функции при вызове и какие из них остаются, когда вызов закончился. В таблице три столбца: `x` — переменная цикла, `best` — локальная переменная, в которой копится ответ, `top` — переменная вне функции, куда попадает возвращённое значение. Список `nums` приходит в функцию через параметр `a` — это копия того же списка, поэтому значения `x` и `best` ты читаешь именно из этих чисел. Строки цикла — это состояние в тот момент, когда тело цикла для этого `x` уже полностью выполнилось. Если имя в этот момент ещё не появилось или уже исчезло, поставь знак `-`. Помни: `x` живёт только внутри скобок `{ }` цикла — когда цикл кончается, исчезает и она. Первая строка — момент до вызова, последняя — момент, когда строка 18 выполнилась и возвращённое значение уже записано в `top`: подумай, какие имена в этот момент ещё существуют.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int largest(vector<int> a) {\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> nums = {4, 9, 9, 2};\n" +
      "    int top = largest(nums);\n" +
      "    cout << top << endl;\n" +
      "    return 0;\n" +
      "}",
    /* One row per pass of the loop body, recorded at the header line with the
       body already finished for that `x` — the convention `m2.l5.b4` set and
       `m3.l7.b3` also keeps — plus the call site before and after. The row at
       line 12 is the one to read twice: the loop has ended, so `x` is gone
       while `best` is still there, and the last row is where both die and `top`
       is born. */
    steps: [
      { line: 17, vars: { x: "-", best: "-", top: "-" } },
      { line: 6, vars: { x: "-", best: "4", top: "-" } },
      { line: 7, vars: { x: "4", best: "4", top: "-" } },
      { line: 7, vars: { x: "9", best: "9", top: "-" } },
      { line: 7, vars: { x: "9", best: "9", top: "-" } },
      { line: 7, vars: { x: "2", best: "9", top: "-" } },
      { line: 12, vars: { x: "-", best: "9", top: "-" } },
      { line: 18, vars: { x: "-", best: "-", top: "9" } },
    ],
  },
  {
    /*
     * The minimum half of «максимум мен минимум функциясы», scaffolded down to
     * the three decisions that separate a working helper from a broken one: the
     * start value, the direction of the comparison, and what leaves the
     * function. The traversal itself is handed over, because b2 and b4 have
     * just spent five minutes on it.
     *
     * The third blank is `best`, not `x`. A learner who writes `return x` does
     * not merely get the wrong number in C++ — `x` does not exist after the
     * loop's closing brace, so the program does not compile at all, and the
     * blank is worth having for both reasons at once.
     */
    id: "m3.l8.b5",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "lists.traverse", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізімнің ең кіші элементін ҚАЙТАРАТЫН функцияны толықтыр. Үш орын бар: `best` қай мәннен басталады, элементті `best`-пен қалай салыстырамыз және функция нені қайтарады? Функцияның ішінде `cout` жоқ — ол мәнді қайтарады, шығаруды `main` жасайды.",
      ru: "Дополни функцию, которая ВОЗВРАЩАЕТ наименьший элемент списка. Три пропуска: с какого значения начинается `best`, как сравнить элемент с `best` и что функция возвращает? Внутри функции нет `cout` — она возвращает значение, а печатает `main`.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int smallest(vector<int> a) {\n" +
      "    int best = ___;\n" +
      "    for (int x : a) {\n" +
      "        if (x ___ best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return ___;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> v = {6, 2, 9};\n" +
      "    cout << smallest(v) << endl;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "a[0]" },
      { id: "f2", answer: "<" },
      { id: "f3", answer: "best" },
    ],
  },
  {
    /*
     * PDF family, verbatim: «максимум мен минимум функциясы». Two helpers, one
     * caller, and the caller is where the list is read — the division of labour
     * the whole month is about.
     *
     * The input now states its length first; see the file header for why C++
     * cannot keep Python's countless line inside November's vocabulary. Nothing
     * else about the task moved, and no expected answer changed.
     *
     * The case set is built against the mutants this task actually attracts:
     *   1 / "7"              — one element, so `best = a[1]` reads past the end
     *                          and a loop starting at index 1 has nothing to do;
     *   5 / "-4 -9 -2 -7 -6" — all negative, so `best = 0` returns 0 for the
     *                          maximum, exactly the b2 argument as a test;
     *   4 / "10 8 6 4"       — descending, which kills "the maximum is the last
     *                          element"; "8 1 6" puts the minimum in the middle
     *                          and kills "the minimum is the first";
     *   3 / "5 5 5"          — all equal, where a `>` written as `>=` and a `<`
     *                          written as `<=` both still have to give 5;
     *   3 / "-1000 1000 0"   — both stated bounds in one line;
     *   3 / "1 3 8"          — ascending: the maximum IS the last element.
     *
     * That last line closes a hole from both ends at once: written with an
     * index loop, `i < n - 1` stops one element short, and every other case
     * hides it — the maximum sat at position 0 in "10 8 6 4" and "8 1 6", at 1
     * in "-1000 1000 0", at 2 in "-4 -9 -2 -7 -6", and "5 5 5" and "7" cannot
     * tell a short loop from a complete one at all. In "1 3 8" the maximum is
     * last, so a loop that drops the tail returns 3; the minimum is first, so a
     * loop that starts its search at index 1 with `best = a[1]` returns 3 as
     * well. The truncated `largest` prints `3 1` where the answer is `8 1`.
     */
    id: "m3.l8.b6",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100) — сандар саны. Екінші жолда бос орынмен бөлінген n бүтін сан беріледі, әрқайсысы -1000 мен 1000 аралығында.\n" +
        "Екі функция жаз. `largest(a)` тізімнің ең үлкен элементін қайтарады, `smallest(a)` ең кішісін қайтарады. Екеуінің де параметрі — `vector<int>`, екеуі де нәтижені `return` арқылы қайтарады: функцияның ішінде `cout` болмауы керек.\n" +
        "Негізгі бағдарлама тізімді оқиды да, бір жолда алдымен ең үлкен, содан кейін ең кіші санды бос орынмен бөліп шығарады.\n" +
        "n = 4 және сандар `4 9 9 2` болса, жауап: `9 2`.",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 100) — количество чисел. Во второй строке через пробел даны n целых чисел, каждое от -1000 до 1000.\n" +
        "Напиши две функции. `largest(a)` возвращает наибольший элемент списка, `smallest(a)` — наименьший. У обеих параметр имеет тип `vector<int>`, обе возвращают результат через `return`: внутри функции не должно быть `cout`.\n" +
        "Основная программа читает список и выводит в одной строке сначала наибольшее число, потом наименьшее, разделив их пробелом.\n" +
        "При n = 4 и числах `4 9 9 2` ответ: `9 2`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int largest(vector<int> a) {\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int smallest(vector<int> a) {\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x < best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> nums[i];\n" +
      "    }\n" +
      "    cout << largest(nums) << \" \" << smallest(nums) << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n4 9 9 2", expectedOutput: "9 2" },
      { input: "1\n7", expectedOutput: "7 7" },
      { input: "5\n-4 -9 -2 -7 -6", expectedOutput: "-2 -9", hidden: true },
      { input: "3\n5 5 5", expectedOutput: "5 5", hidden: true },
      { input: "4\n10 8 6 4", expectedOutput: "10 4", hidden: true },
      { input: "3\n8 1 6", expectedOutput: "8 1", hidden: true },
      { input: "3\n-1000 1000 0", expectedOutput: "1000 -1000", hidden: true },
      { input: "3\n1 3 8", expectedOutput: "8 1", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «мәтінге арналған тексерулер». October already printed
     * `yes`/`no` for a palindrome at `m2.l6.b7`, so this is not that task again
     * with a header around it. The function returns 1 or 0 and prints NOTHING;
     * the caller owns the two tokens. Deciding and reporting are separated,
     * which is the only reason a check is worth being a function.
     *
     * 1 and 0 rather than `true` and `false`: `if (is_palindrome(w) == 1)` is
     * the form the whole month uses, and `bool` is not a November idea. Nothing
     * is lost — the value is a number that comes back, which is the point.
     *
     * Both prompts name `yes` and `no`, per the output-token rule: a program
     * that printed a Kazakh word would let a Russian-track learner match glyphs
     * instead of reasoning.
     *
     * "a" is the case that carries the lesson's recurring point: `n / 2` is 0,
     * the loop body never runs, and the function still has to return 1. "ab" is
     * the smallest word that is not a palindrome, and dies for any solution
     * whose loop is `i < n / 2 - 1`. "abca" kills the solution that compares
     * only the first and last characters. "abba" is the even length that a
     * solution written around a middle character gets wrong.
     */
    id: "m3.l8.b7",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "strings.sequence", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ, ұзындығы 1-ден 100-ге дейін.\n" +
        "`is_palindrome(word)` функциясын жаз; параметрдің түрі — `string`. Сөз палиндром болса ол 1 санын, болмаса 0 санын ҚАЙТАРСЫН. Функция экранға ештеңе шығармайды.\n" +
        "Негізгі бағдарлама сөзді `cin >> w;` арқылы оқып, функцияны шақырады: қайтқан мән 1 болса `yes`, 0 болса `no` деген сөзді шығарады.\n" +
        "Палиндром — алдынан оқығанда да, артынан оқығанда да бірдей сөз. `level` → `yes`, `world` → `no`.",
      ru:
        "В одной строке дано слово: только строчные латинские буквы, без пробелов, длина от 1 до 100.\n" +
        "Напиши функцию `is_palindrome(word)`; тип параметра — `string`. Если слово — палиндром, она ВОЗВРАЩАЕТ число 1, иначе 0. Сама функция ничего не печатает.\n" +
        "Основная программа читает слово через `cin >> w;` и вызывает функцию: если вернулась 1, она выводит слово `yes`, если 0 — слово `no`.\n" +
        "Палиндром читается одинаково слева направо и справа налево. `level` → `yes`, `world` → `no`.",
    },
    /* The early `return 0;` is deliberate and is l3's material one lesson on:
       once the answer is known, nothing after it needs to run. A learner who
       writes the `ok = 1` flag version instead passes every case — the checker
       judges the output, not the route. */
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int is_palindrome(string word) {\n" +
      "    int n = word.size();\n" +
      "    for (int i = 0; i < n / 2; i++) {\n" +
      "        if (word[i] != word[n - 1 - i]) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string w;\n" +
      "    cin >> w;\n" +
      "    if (is_palindrome(w) == 1) {\n" +
      '        cout << "yes" << endl;\n' +
      "    } else {\n" +
      '        cout << "no" << endl;\n' +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "level", expectedOutput: "yes" },
      { input: "world", expectedOutput: "no" },
      { input: "a", expectedOutput: "yes", hidden: true },
      { input: "ab", expectedOutput: "no", hidden: true },
      { input: "abba", expectedOutput: "yes", hidden: true },
      { input: "abca", expectedOutput: "no", hidden: true },
      { input: "kayak", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * PDF family: «тізімді өңдейтін көмекші функциялар». The helper here
     * returns a `vector<int>`, not a number, which is the third shape of
     * `return` this lesson shows after a number (b2, b6) and a flag (b7). A
     * function may return a whole vector by value and it costs the learner no
     * new syntax — no `&`, no pointer, nothing this month has not taught.
     *
     * It is a modify and not a write for two reasons. The lesson's repair slot
     * belongs somewhere, and the printing scaffold — walk the result and put a
     * space between the elements — is not what is being assessed. What the
     * learner changes is the body of the helper: from "put something in for
     * every element" to "put something in only for some elements", with the
     * `vector<int> b;` … `return b;` frame left standing so the shape survives
     * the edit.
     *
     * The starting program's output differs from the target's on every single
     * case — `doubled` and `only_even` never agree on any of the seven inputs —
     * so no half-edit slips through a token comparison.
     *
     * "at least one even number" is guaranteed in both prompts. Without it the
     * task would smuggle in an empty-result branch, which is a different idea
     * and belongs where it can be taught rather than sprung.
     */
    id: "m3.l8.b8",
    type: "modify_code",
    skillRefs: ["func.define", "func.return", "lists.traverse", "loops.for", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бұл бағдарламадағы `doubled(a)` функциясы жаңа тізім жасап, ондағы әр санды екі есе етіп қайтарады, ал негізгі бағдарлама сол тізімді бір жолда бос орынмен бөліп шығарады. Бірінші жолда n саны (1 ≤ n ≤ 100), екінші жолда n бүтін сан беріледі.\n" +
        "Функцияны өзгерт: ол енді `a` тізімінің ЖҰП сандарын ғана, бастапқы ретін сақтап, жаңа тізім етіп қайтарсын. Функция ішінде `cout` болмайды және шығару бөлігін өзгертудің қажеті жоқ.\n" +
        "Кірісте кемінде бір жұп сан бар екеніне кепілдік беріледі. n = 4 және сандар `4 7 10 3` болса, жауап: `4 10`.",
      ru:
        "В этой программе функция `doubled(a)` строит новый список, удваивая каждое число, а основная программа печатает его в одной строке через пробел. В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел.\n" +
        "Измени функцию так, чтобы она возвращала новым списком только ЧЁТНЫЕ числа из `a`, сохраняя их исходный порядок. Внутри функции нет `cout`, и часть с выводом менять не нужно.\n" +
        "Гарантируется, что во входных данных есть хотя бы одно чётное число. При n = 4 и числах `4 7 10 3` ответ: `4 10`.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "vector<int> doubled(vector<int> a) {\n" +
      "    vector<int> b;\n" +
      "    for (int x : a) {\n" +
      "        b.push_back(x * 2);\n" +
      "    }\n" +
      "    return b;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> nums[i];\n" +
      "    }\n" +
      "    vector<int> res = doubled(nums);\n" +
      "    int m = res.size();\n" +
      "    for (int i = 0; i < m; i++) {\n" +
      "        if (i > 0) {\n" +
      '            cout << " ";\n' +
      "        }\n" +
      "        cout << res[i];\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "vector<int> only_even(vector<int> a) {\n" +
      "    vector<int> b;\n" +
      "    for (int x : a) {\n" +
      "        if (x % 2 == 0) {\n" +
      "            b.push_back(x);\n" +
      "        }\n" +
      "    }\n" +
      "    return b;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> nums[i];\n" +
      "    }\n" +
      "    vector<int> res = only_even(nums);\n" +
      "    int m = res.size();\n" +
      "    for (int i = 0; i < m; i++) {\n" +
      "        if (i > 0) {\n" +
      '            cout << " ";\n' +
      "        }\n" +
      "        cout << res[i];\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    return 0;\n" +
      "}",
    /* "0 5 6" is in the set because 0 is even, and a filter written as
       `x % 2 == 0 && x > 0` passes everything else here. "-4 -7 -2" is the case
       the language change made SHARPER rather than weaker: in C++ the remainder
       takes the sign of the dividend, so `-7 % 2` is `-1`, not Python's `1`. A
       learner who decides oddness with `x % 2 == 1` therefore calls -7 EVEN and
       keeps it, printing `-4 -7 -2`; the same mistake was invisible in Python,
       where that test happened to be right. "9 9 4" leaves the only even number
       last, which kills a helper that returns as soon as it finds one. "8 8 8"
       proves duplicates are kept. */
    cases: [
      { input: "4\n4 7 10 3", expectedOutput: "4 10" },
      { input: "3\n1 2 3", expectedOutput: "2" },
      { input: "3\n0 5 6", expectedOutput: "0 6", hidden: true },
      { input: "3\n-4 -7 -2", expectedOutput: "-4 -2", hidden: true },
      { input: "3\n8 8 8", expectedOutput: "8 8 8", hidden: true },
      { input: "4\n2 4 6 8", expectedOutput: "2 4 6 8", hidden: true },
      { input: "3\n9 9 4", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m3.l8.b8 — the same list helper, completed
     * rather than rewritten. «Дайын кодты құрастыру мен толықтыру көбірек,
     * нөлден жазу азырақ» (p.6).
     *
     * The three blanks are the three parts of the shape b1 described, and the
     * first of them is the most C++-specific decision in the lesson: this
     * function does not hand back a number, so its declared type is not `int`.
     * A learner who writes `int` there gets a compile error at the `return`,
     * which is the same lesson m3.l3.b5 taught from the other side.
     *
     * `return x;` in the third blank would compile and return the last even
     * number, which is precisely the confusion this route needs to meet
     * somewhere it can be corrected in one move.
     */
    id: "m3.l8.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "lists.traverse", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk:
        "Тізімнің ЖҰП сандарын ғана жинап, оларды ЖАҢА тізім етіп қайтаратын функцияны толықтыр. Үш орын бар: функцияның қайтаратын мәнінің түрі (ол бір сан емес, тізім қайтарады), «жұп» дегенді қалдық арқылы қалай тексереміз және функция нені қайтарады?\n" +
        "Бірінші жолда n саны, екінші жолда n бүтін сан беріледі. Негізгі бағдарлама қайтқан тізімді бір жолда бос орынмен бөліп шығарады. Кірісте кемінде бір жұп сан бар. n = 4 және `4 7 10 3` берілсе, `4 10` шығады.",
      ru:
        "Дополни функцию, которая собирает только ЧЁТНЫЕ числа списка и возвращает их НОВЫМ списком. Три пропуска: тип возвращаемого значения функции (она возвращает не одно число, а список), как проверить «чётное» через остаток и что функция возвращает?\n" +
        "В первой строке дано n, во второй — n целых чисел. Основная программа печатает возвращённый список в одной строке через пробел. Во входных данных есть хотя бы одно чётное число. При n = 4 и `4 7 10 3` выведется `4 10`.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "___ only_even(vector<int> a) {\n" +
      "    vector<int> b;\n" +
      "    for (int x : a) {\n" +
      "        if (x % 2 == ___) {\n" +
      "            b.push_back(x);\n" +
      "        }\n" +
      "    }\n" +
      "    return ___;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> nums[i];\n" +
      "    }\n" +
      "    vector<int> res = only_even(nums);\n" +
      "    int m = res.size();\n" +
      "    for (int i = 0; i < m; i++) {\n" +
      "        if (i > 0) {\n" +
      '            cout << " ";\n' +
      "        }\n" +
      "        cout << res[i];\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      /* `shown`: the template's own `only_even(vector<int> a)` displays this
         type, so naming it is a reading task, not a recall task. The template
         has to ship whole — it is the question — so the projection could not
         withhold the token even if it wanted to. */
      { id: "f1", answer: "vector<int>", shown: true },
      { id: "f2", answer: "0" },
      { id: "f3", answer: "b" },
    ],
  },
  {
    /*
     * ADVANCED ONLY. «Негізгі есептерді жедел қарқынмен өтіп, күрделі есептер
     * блогына көшу» (p.6), and the first appearance of the PDF's «бірнеше
     * функциядан тұратын шағын бағдарлама» — one helper calling another.
     *
     * `best_word` is `largest` with the comparison replaced by a call. That is
     * the whole point: the best-so-far pattern does not change when the thing
     * being compared stops being the element itself, and a learner who has
     * understood b2 should recognise the skeleton immediately. What is new is
     * that `best_word` must not count vowels itself — the counting already has
     * a name and a return value — and that both the parameter and the returned
     * value are now `string` and `vector<string>` rather than numbers.
     *
     * The vowel test is five comparisons joined by `||`, which is September's
     * material: `ch == 'a' || ch == 'e' || …`. There is no `in` in C++ and
     * nothing in November's vocabulary replaces it, so the check is written out,
     * and single quotes are the point b1 made — `'a'` is a `char`, `"a"` is not.
     *
     * The tie rule is the trap and it is stated in both prompts: `>=` returns
     * the LAST of the tied words, `>` the first. "sky dry" is a visible case
     * for exactly that reason — both words have zero vowels, so a learner who
     * gets it wrong sees it immediately instead of on a hidden case.
     */
    id: "m3.l8.b9",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "strings.sequence", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["advanced"],
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 50) — сөздер саны. Екінші жолда бос орынмен бөлінген n сөз: әрқайсысы тек кіші латын әріптерінен тұрады.\n" +
        "Екі функция жаз. `count_vowels(word)` сөздегі дауысты әріптердің санын қайтарады; дауыстылар — a, e, i, o, u, ал бір әріпті `'a'` деп бір тырнақшамен салыстырады. `best_word(words)` сөздер тізімін (`vector<string>`) қабылдап, дауыстысы ең көп сөзді қайтарады; оның қайтаратын түрі — `string`. `best_word` дауыстыны өзі санамауы керек: ол әр сөз үшін `count_vowels`-ты шақырады.\n" +
        "Дауысты саны бірдей сөз бірнешеу болса, олардың ең сол жақтағысын қайтар. Негізгі бағдарлама сол сөзді бір жолға шығарады.\n" +
        "n = 4 және сөздер `apple kiwi banana plum` болса, жауап: `banana`.",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 50) — количество слов. Во второй строке через пробел даны n слов: каждое состоит только из строчных латинских букв.\n" +
        "Напиши две функции. `count_vowels(word)` возвращает количество гласных в слове; гласные — a, e, i, o, u, а отдельная буква сравнивается в одинарных кавычках, как `'a'`. `best_word(words)` принимает список слов (`vector<string>`) и возвращает слово с наибольшим числом гласных; тип возвращаемого значения — `string`. Считать гласные сама `best_word` не должна: для каждого слова она вызывает `count_vowels`.\n" +
        "Если слов с одинаковым числом гласных несколько, верни самое левое из них. Основная программа выводит это слово одной строкой.\n" +
        "При n = 4 и словах `apple kiwi banana plum` ответ: `banana`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int count_vowels(string word) {\n" +
      "    int c = 0;\n" +
      "    for (char ch : word) {\n" +
      "        if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "string best_word(vector<string> words) {\n" +
      "    string best = words[0];\n" +
      "    for (string w : words) {\n" +
      "        if (count_vowels(w) > count_vowels(best)) {\n" +
      "            best = w;\n" +
      "        }\n" +
      "    }\n" +
      "    return best;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<string> words(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> words[i];\n" +
      "    }\n" +
      "    cout << best_word(words) << endl;\n" +
      "    return 0;\n" +
      "}",
    /* "sky dry" and "rhythm myth" are two different tie shapes at zero vowels,
       and both fail a `>=`. "aei bcd" and "bcd aei" are the same pair in both
       orders, so a solution that returns the first word regardless dies on one
       of them and a solution that returns the last dies on the other. "one" is
       the single-word list, where the loop compares the word with itself. */
    cases: [
      { input: "4\napple kiwi banana plum", expectedOutput: "banana" },
      { input: "2\nsky dry", expectedOutput: "sky" },
      { input: "1\none", expectedOutput: "one", hidden: true },
      { input: "2\naei bcd", expectedOutput: "aei", hidden: true },
      { input: "2\nbcd aei", expectedOutput: "aei", hidden: true },
      { input: "2\nrhythm myth", expectedOutput: "rhythm", hidden: true },
      { input: "2\nqueue io", expectedOutput: "queue", hidden: true },
    ],
  },
];
