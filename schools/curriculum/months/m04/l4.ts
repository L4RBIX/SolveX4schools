import type { LessonBlock } from "../../types";

/**
 * Month 4 · Желтоқсан — lesson 4, «Реттеумен есептер» (9 minutes).
 *
 * PDF p.8. Three clauses of December drive this lesson:
 *
 *   «сандарды реттеу … медиананы табу»            — the practice families
 *   «Айдың басты тәсілі - бір есептің екі шешімін салыстыру.»
 *   «дұрыс жауап тым кеш шықса, қабылданбайды»
 *
 * The middle clause is why `m4.l4.b2` puts BOTH programs on one card instead of
 * showing the fast one and asserting it is fast. The learner reads the pair
 * loop, counts the pairs, and only then meets the neighbour argument. That
 * argument is the lesson's one idea: if two values are the closest pair,
 * nothing can lie between them, so after sorting they stand next to each other
 * — a quadratic scan collapses into `n - 1` comparisons. It is the clearest
 * place in the whole month where ordering buys speed rather than tidiness.
 *
 * ## The median rule, decided once, here
 *
 * The programme names «медиананы табу» and stops there, so the even-n case is
 * the author's to settle. It is settled as **the lower of the two middles**:
 * index `(n - 1) / 2` of the sorted list. The alternative — the average of the
 * two middles — drags in floats, a tolerance and a formatting question into a
 * nine-minute lesson whose subject is neighbours, not division.
 *
 * `(n - 1) / 2` is integer division and n is at least 1, so both operands are
 * non-negative and C++'s truncation gives the same index Python's floor did.
 * The one place in this month where the two languages would disagree — a
 * negative numerator — cannot arise here.
 *
 * The rule is stated in the concept block, restated in every prompt that needs
 * it in BOTH languages, and enforced by cases: `m4.l4.b7` has n = 2, n = 4,
 * n = 6 and n = 8 cases where `n / 2` gives a different, wrong answer, so a
 * solution that quietly takes the upper middle fails rather than passes by luck.
 *
 * ## Why every card carries a different program
 *
 * An October review found tasks that could be passed by transcribing a program
 * from a neighbouring card. So the median appears three times and never in the
 * same shape: `b5` is a `median(vector<int> a)` helper reading one line of
 * numbers (its fixed version is on screen, so it must not be a runnable answer
 * to anything later), while `b7` and the support twin `b7s` take n on the first
 * line and the numbers on the second. Copying b5's repaired code into b7 fails
 * on the very first case. The same applies to the smallest difference: `b2`
 * works on a list literal, `b6` reads one line, `b8` reads the
 * competitive-programming two-line format and asks for the largest difference
 * as well — which is the sorted list's other gift, its two ends.
 *
 * ## C++ used
 *
 * Everything through November, plus this month's `sort` from `<algorithm>` and
 * the `while (cin >> x)` reading recipe introduced in `m4.l3.b1`. No `abs`:
 * the slow program in `b2` makes its difference non-negative with an explicit
 * `if (d < 0) { d = -d; }`, which is one line, needs no header, and makes step 5
 * land harder — after sorting, that line is not merely unnecessary, it is
 * visibly gone.
 *
 * ## Where `int` is not enough, and where it is
 *
 * `b8` reads into a `vector<long long>`, and its prompt says why: the values
 * reach 10⁹ in absolute value, so `a[n - 1] - a[0]` reaches 2 · 10⁹ and
 * overflows a 32-bit `int` silently. `b6` bounds its values at 10⁶ instead and
 * stays on `int`, because its blanks are about the walk and not about types.
 *
 * Programs print plain numbers only, so nothing here depends on the reader's
 * language.
 */
export const M4_L4: LessonBlock[] = [
  {
    id: "m4.l4.b1",
    type: "concept",
    skillRefs: ["sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Реттегеннен кейін мәні жақын сан көрші тұрады",
      ru: "После сортировки близкое по значению стоит рядом",
    },
    body: {
      kk: "Реттелген тізімде сандар кішіден үлкенге қарай тұрады. Осыдан қарапайым, бірақ күшті салдар шығады: мәні бойынша ең жақын екі сан орны бойынша да көрші болады. Себебі қарапайым — ең жақын екі санның арасында үшінші сан тұра алмайды. Тұрса, ол екеуінің біріне одан да жақын болар еді, ал біз ең жақын жұпты алғанбыз. Сондықтан тізімді екі-екіден түгел салыстырудың орнына тек көрші жұптарды қарау жеткілікті.\n\nC++-та реттеудің бір ғана жолы бар: `sort(a.begin(), a.end())` тізімнің өзін орнында қайта тізеді және ешнәрсе қайтармайды. Бастапқы рет саған әлі керек болса, алдымен көшірме жаса: `vector<int> b = a;`. Бұл құрал осы айда ғана ашылды: қазан айында максимумды да, минимумды да циклмен өз қолыңмен жазғанбыз, енді дайын жол бар.\n\nРеттелген тізімнің ортасындағы сан медиана деп аталады. Элемент саны тақ болса, орта біреу. Жұп болса, орта екеу — сондықтан ереже керек. Осы сабақта біз бір ережені бекітеміз: n жұп болғанда екі ортаңғының кішісі алынады, яғни реттелгеннен кейінгі `(n - 1) / 2` индексіндегі сан. Мұндағы `/` — бүтін бөлу, ал n кемінде 1 болғандықтан бөлінгіш теріс емес, сондықтан қалдық жай ғана лақтырылады. Тақ n үшін дәл сол формула да дұрыс жауап береді.",
      ru: "В отсортированном списке числа стоят от меньшего к большему. Отсюда следует простой, но сильный вывод: два ближайших по значению числа оказываются соседями и по месту. Причина простая — между двумя самыми близкими числами не может стоять третье. Если бы стояло, оно было бы ещё ближе к одному из них, а мы взяли самую близкую пару. Поэтому вместо перебора всех пар достаточно смотреть только соседние.\n\nВ C++ способ сортировки один: `sort(a.begin(), a.end())` переставляет сам список на месте и ничего не возвращает. Если исходный порядок ещё нужен, сначала сделай копию: `vector<int> b = a;`. Этот инструмент появился только в этом месяце: в октябре мы писали и максимум, и минимум циклом вручную, а теперь есть готовый способ.\n\nЧисло, стоящее посередине отсортированного списка, называется медианой. Если элементов нечётное количество, середина одна. Если чётное — середины две, и нужно правило. На этом уроке мы фиксируем одно правило: при чётном n берётся меньшее из двух средних, то есть число по индексу `(n - 1) / 2` после сортировки. Здесь `/` — целочисленное деление, а так как n не меньше 1, делимое неотрицательно, и остаток просто отбрасывается. Для нечётного n эта же формула даёт верный ответ.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {15, 4, 9, 22, 7};\n" +
      "    int n = a.size();\n" +
      "\n" +
      "    vector<int> b = a;\n" +
      "    sort(b.begin(), b.end());\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << b[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << a[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "\n" +
      "    sort(a.begin(), a.end());\n" +
      "    cout << a[(n - 1) / 2] << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The month's own device, applied literally: «бір есептің екі шешімін
     * салыстыру». Both programs are on the card, both print 2, and the steps
     * count what each of them actually did. Showing only the fast one would
     * make "sorting buys speed" a claim the learner has to take on trust.
     *
     * The list is the same five numbers as b1, so the ordering they just
     * watched happen is the ordering being reasoned about. Comments in the code
     * are numerals, not words: a Russian-track learner must not meet Kazakh
     * inside a program.
     */
    id: "m4.l4.b2",
    type: "worked_example",
    skillRefs: ["sort.basic", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: ең кіші айырма — екі жолмен",
      ru: "Разобранный пример: наименьшая разность — двумя способами",
    },
    problem: {
      kk: "Тізім берілген: 15, 4, 9, 22, 7. Осы сандардың кез келген екеуінің арасындағы ең кіші айырманы тап. Айырма теріс емес деп саналады.",
      ru: "Дан список: 15, 4, 9, 22, 7. Найди наименьшую разность между любыми двумя из этих чисел. Разность считается неотрицательной.",
    },
    steps: [
      {
        kk: "Тікелей жол — барлық жұпты қарап шығу. Бірінші нұсқа дәл соны істейді: сыртқы цикл бірінші санды таңдайды, ішкі цикл одан кейінгілерін таңдайды, ал `if (d < 0) { d = -d; }` жолы айырманы теріс емес етеді.",
        ru: "Прямой путь — перебрать все пары. Первый вариант делает именно это: внешний цикл выбирает первое число, внутренний — все следующие за ним, а строка `if (d < 0) { d = -d; }` делает разность неотрицательной.",
      },
      {
        kk: "Бес санда жұп саны бар болғаны 10. Бірақ жұптардың саны шамамен n·n/2 болып өседі: n = 2000 болса — екі миллионға жуық, n = 100000 болса — бес миллиард. Секундына жүз миллион қадам жасайтын компьютер үшін соңғысы елу секундқа жуық — бірнеше секундтық шектеуге ешқашан үлгермейді.",
        ru: "Для пяти чисел пар всего 10. Но количество пар растёт примерно как n·n/2: при n = 2000 это около двух миллионов, при n = 100000 — пять миллиардов. Для компьютера, делающего сто миллионов шагов в секунду, последнее — это около пятидесяти секунд: в ограничение в несколько секунд не уложится никогда.",
      },
      {
        kk: "Енді ойланайық. x пен y — ең жақын жұп болсын, x ≤ y. Олардың дәл арасында үшінші сан z тұра ала ма? Егер x < z < y болса, z − x айырмасы y − x-тен кіші болады, яғни x пен z одан да жақын жұп. Бұл қайшылық. Демек ең жақын жұптың арасында ешнәрсе жоқ.",
        ru: "Теперь подумаем. Пусть x и y — самая близкая пара, x ≤ y. Может ли строго между ними стоять третье число z? Если x < z < y, то разность z − x меньше, чем y − x, значит x и z — ещё более близкая пара. Противоречие. Выходит, между числами самой близкой пары нет ничего.",
      },
      {
        kk: "Арасында ешнәрсе болмаса, реттелген тізімде олар көрші тұрады. Сондықтан барлық жұпты емес, тек `n - 1` көрші жұпты қарау жеткілікті — екінші нұсқа осылай жазылған. Ол `a`-ның көшірмесі `b`-ны реттейді, сондықтан бірінші нұсқаның деректері бүлінбейді.",
        ru: "Если между ними ничего нет, то в отсортированном списке они стоят рядом. Поэтому достаточно посмотреть не все пары, а только `n - 1` соседних — так и написан второй вариант. Он сортирует копию `b`, а не сам `a`, поэтому данные первого варианта остаются нетронутыми.",
      },
      {
        kk: "Реттелген тізімде `b[i + 1]` ешқашан `b[i]`-ден кіші болмайды, сондықтан айырма теріс шықпайды және теріс белгіні түзететін жол мүлде керек емес — ол екінші нұсқада жоқ. Ал `best` бірінші көрші жұптан басталады: нөлден бастасақ, жауап әрқашан нөл болып қалар еді.",
        ru: "В отсортированном списке `b[i + 1]` никогда не меньше `b[i]`, поэтому разность не бывает отрицательной и строка, исправляющая знак, уже не нужна — во втором варианте её просто нет. А `best` начинается с первой соседней пары: если начать с нуля, ответ так нулём и останется.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {15, 4, 9, 22, 7};\n" +
      "    int n = a.size();\n" +
      "\n" +
      "    // 1\n" +
      "    int best = a[1] - a[0];\n" +
      "    if (best < 0) {\n" +
      "        best = -best;\n" +
      "    }\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            int d = a[j] - a[i];\n" +
      "            if (d < 0) {\n" +
      "                d = -d;\n" +
      "            }\n" +
      "            if (d < best) {\n" +
      "                best = d;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best << endl;\n" +
      "\n" +
      "    // 2\n" +
      "    vector<int> b = a;\n" +
      "    sort(b.begin(), b.end());\n" +
      "    int best2 = b[1] - b[0];\n" +
      "    for (int i = 0; i < n - 1; i++) {\n" +
      "        int d = b[i + 1] - b[i];\n" +
      "        if (d < best2) {\n" +
      "            best2 = d;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best2 << endl;\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Екі нұсқа да 2 шығарады. Реттелген тізім: 4 7 9 15 22, ең кіші айырма 9 − 7 = 2. Бірақ бірінші нұсқа 10 жұпты, екіншісі бар болғаны 4 көрші жұпты қарады.",
      ru: "Оба варианта выводят 2. Отсортированный список: 4 7 9 15 22, наименьшая разность 9 − 7 = 2. Но первый вариант проверил 10 пар, а второй — всего 4 соседние.",
    },
  },
  {
    /*
     * No diagnosticMapping, and the reason is the same for all three
     * distractors. «4 4» comes either from forgetting the `- 1` or from
     * believing `/` rounds to the nearest whole number; «3 4» comes either
     * from swapping the two expressions or from plain carelessness in reading
     * order. Two causes each, so the engine should ask rather than tell.
     */
    id: "m4.l4.b3",
    type: "prediction",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізім алдымен реттеледі, содан кейін екі «орта» индекстегі сан қатар шығарылады. Тізімде 6 элемент бар. Бағдарлама нені шығарады?",
      ru: "Список сначала сортируется, затем рядом выводятся числа по двум «средним» индексам. В списке 6 элементов. Что выведет программа?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {3, 1, 4, 1, 5, 9};\n" +
      "    int n = a.size();\n" +
      "    sort(a.begin(), a.end());\n" +
      "    cout << a[n / 2] << \" \" << a[(n - 1) / 2];\n" +
      "    return 0;\n" +
      "}",
    answer: "4 3",
    options: ["4 3", "3 4", "4 4", "3 3"],
  },
  {
    id: "m4.l4.b4",
    type: "multiple_choice",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Реттелген тізімде 6 сан бар. Осы сабақтың ережесі: элемент саны жұп болғанда екі ортаңғының кішісі алынады. Медиана қай индексте тұр? Индекстер нөлден басталады.",
      ru: "В отсортированном списке 6 чисел. Правило этого урока: если количество элементов чётное, берётся меньшее из двух средних. По какому индексу стоит медиана? Индексы начинаются с нуля.",
    },
    options: [
      { id: "o1", label: { kk: "2, өйткені (6 - 1) / 2 = 2", ru: "2, потому что (6 - 1) / 2 = 2" } },
      { id: "o2", label: { kk: "3, өйткені 6 / 2 = 3", ru: "3, потому что 6 / 2 = 3" } },
      { id: "o3", label: { kk: "2 мен 3-тің ортасы, яғни 2.5", ru: "середина между 2 и 3, то есть 2.5" } },
      { id: "o4", label: { kk: "4, өйткені 6 / 2 + 1 = 4", ru: "4, потому что 6 / 2 + 1 = 4" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      /*
       * o2 is the only option whose label states its own reasoning AND lands on
       * the upper middle. Choosing it means the standard-looking formula was
       * applied without reading the rule in the statement — one cause, so the
       * attribution is safe. o3 and o4 are left unmapped: a non-integer index
       * and a `+ 1` can each come from several different confusions.
       */
      o2: {
        failureClass: "median_upper_middle_chosen",
        justification:
          "6 / 2 = 3 — бұл екі ортаңғының үлкені. Оны таңдау шарттағы «кішісін ал» ережесін оқымай, әдеттегі формуланы автоматты түрде қолданғанды көрсетеді.",
      },
    },
  },
  {
    /*
     * symptomInput is declared because the bug needs a whole EVEN-length list
     * to appear: on an odd-length list `n / 2` and `(n - 1) / 2` are the same
     * index, and the fallback probe feeds single numbers, on which both
     * programs print the same thing and the defect would read as imaginary.
     *
     * The helper takes its vector BY VALUE — November's own distinction — so
     * sorting inside it leaves the caller's list alone. That is stated in the
     * prompt rather than left as a puzzle, because it is not what is being
     * hunted here.
     *
     * No diagnosticMapping. Choosing line 8 could mean "I think the sort should
     * not be here" or "I think the vector should have been sorted before the
     * call", and those are different repairs to make.
     */
    id: "m4.l4.b5",
    type: "find_bug",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама медиананы табуы керек. Ереже: сандардың саны жұп болғанда екі ортаңғының кішісі алынады. `median` функциясы тізімді КӨШІРМЕ ретінде алады, сондықтан ішіндегі реттеу шақырушының тізімін бүлдірмейді — бұл дұрыс жазылған. Бірақ `8 2 5 1` енгізгенде бағдарлама 2 емес, 5 шығарады. Қай жол кінәлі және неге?",
      ru: "Программа должна находить медиану. Правило: если чисел чётное количество, берётся меньшее из двух средних. Функция `median` получает список КОПИЕЙ, поэтому сортировка внутри неё не портит список вызывающего — это написано правильно. Но при вводе `8 2 5 1` она выводит 5 вместо 2. Какая строка виновата и почему?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int median(vector<int> a) {\n" +
      "    int n = a.size();\n" +
      "    sort(a.begin(), a.end());\n" +
      "    return a[n / 2];\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> nums;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        nums.push_back(x);\n" +
      "    }\n" +
      "    cout << median(nums);\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 9,
    symptomInput: "8 2 5 1",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int median(vector<int> a) {\n" +
      "    int n = a.size();\n" +
      "    sort(a.begin(), a.end());\n" +
      "    return a[(n - 1) / 2];\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> nums;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        nums.push_back(x);\n" +
      "    }\n" +
      "    cout << median(nums);\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Four blanks, and each one is a decision the lesson actually made:
     * whether to order at all, where the neighbour walk has to stop, which
     * element is the neighbour, and which direction the comparison runs. The
     * example list is deliberately NOT b2's five numbers — the answer there was
     * already printed on the card.
     *
     * Values are bounded at a million so `int` is safe: this block's subject is
     * the walk, and making its learner reason about overflow at the same time
     * would put two lessons on one card. b8 is where the wider bound lives.
     */
    id: "m4.l4.b6",
    type: "fill_blank",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген кемінде екі бүтін сан беріледі (әрқайсысының модулі 1 000 000-нан аспайды). Кез келген екі санның арасындағы ең кіші айырманы шығаратындай толықтыр. Тізімді реттеп, тек көрші жұптарды қара. Мысалы `12 3 7 20` үшін жауап 4.",
      ru: "В одной строке через пробел даны не меньше двух целых чисел (каждое по модулю не больше 1 000 000). Дополни программу так, чтобы она вывела наименьшую разность между любыми двумя из них. Отсортируй список и смотри только соседние пары. Например, для `12 3 7 20` ответ 4.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    int n = a.size();\n" +
      "    ___(a.begin(), a.end());\n" +
      "    int best = a[1] - a[0];\n" +
      "    for (int i = 0; i < ___; i++) {\n" +
      "        int d = a[___] - a[i];\n" +
      "        if (d ___ best) {\n" +
      "            best = d;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "n - 1", alternatives: ["n-1"] },
      { id: "f3", answer: "i + 1", alternatives: ["i+1"] },
      { id: "f4", answer: "<" },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m4.l4.b7, not an extra block beside it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same statement, same input format, same rule — the three blanks
     * are the ordering and the two halves of the index formula, which is
     * exactly what the lesson claims to teach. Nothing on a nearby card
     * contains this program: b5's median is a function over one line of input.
     */
    id: "m4.l4.b7s",
    type: "fill_blank",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны — сандардың саны, екінші жолда бос орынмен бөлінген n бүтін сан беріледі. Медиананы шығаратындай толықтыр. Ереже: n жұп болса, екі ортаңғының кішісі алынады. Мысалы `4` және `8 2 5 1` үшін жауап 2.",
      ru: "В первой строке дано число n — количество чисел, во второй строке через пробел даны n целых чисел. Дополни программу так, чтобы она вывела медиану. Правило: при чётном n берётся меньшее из двух средних. Например, для `4` и `8 2 5 1` ответ 2.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    ___(a.begin(), a.end());\n" +
      "    int m = (n ___ 1) ___ 2;\n" +
      "    cout << a[m];\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "-" },
      { id: "f3", answer: "/" },
    ],
  },
  {
    /*
     * «медиананы табу», PDF p.8. The cases are chosen against named wrong
     * solutions rather than for coverage:
     *   n / 2 instead of (n - 1) / 2   — dies on 4, 2, 6 and 8 element cases;
     *   no sorting at all              — dies on «9 1 2 3 4», which prints 2;
     *   a[n / 2 - 1] (also "lower")    — dies on every odd case, e.g. n = 5;
     *   reading past the end at n = 1  — dies on the single-element case, which
     *                                    in C++ is undefined behaviour rather
     *                                    than an exception, so it is worth a
     *                                    case of its own.
     * The all-equal and repeated-value cases are there because the objective
     * says «қайталанатын мәндерді дұрыс өңдеу»: a solution that tries to skip
     * duplicates before finding the middle gets a different answer on
     * «5 1 5 1 5 1».
     */
    id: "m4.l4.b7",
    type: "write_code",
    skillRefs: ["sort.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі — сандардың саны (n ≥ 1). Екінші жолда бос орынмен бөлінген n бүтін сан беріледі, әрқайсысының модулі 1 000 000 000-нан аспайды. Медиананы шығар. Медиана — реттелген тізімнің ортасындағы сан. n тақ болса, орта біреу. n жұп болса, екі ортаңғының кішісін ал, яғни реттеуден кейінгі `(n - 1) / 2` индексіндегі санды (мұндағы `/` — бүтін бөлу). Мысалы n = 4, сандар `8 2 5 1` болса, жауап 2; n = 5, сандар `7 1 9 3 5` болса, жауап 5.",
      ru: "В первой строке дано число n — количество чисел (n ≥ 1). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1 000 000 000. Выведи медиану. Медиана — число в середине отсортированного списка. Если n нечётное, середина одна. Если n чётное, бери меньшее из двух средних, то есть число по индексу `(n - 1) / 2` после сортировки (здесь `/` — целочисленное деление). Например, при n = 4 и числах `8 2 5 1` ответ 2; при n = 5 и числах `7 1 9 3 5` ответ 5.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    cout << a[(n - 1) / 2];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n7 1 9 3 5", expectedOutput: "5" },
      { input: "4\n8 2 5 1", expectedOutput: "2" },
      { input: "1\n42", expectedOutput: "42", hidden: true },
      { input: "2\n9 4", expectedOutput: "4", hidden: true },
      { input: "5\n6 6 6 6 6", expectedOutput: "6", hidden: true },
      { input: "6\n5 1 5 1 5 1", expectedOutput: "1", hidden: true },
      { input: "5\n9 1 2 3 4", expectedOutput: "3", hidden: true },
      { input: "4\n-3 -10 0 -1", expectedOutput: "-3", hidden: true },
      { input: "8\n2 2 3 3 4 4 5 5", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The lesson's independent task, and it is not b6 with a different input
     * format: the second number asks for the LARGEST difference, which after
     * sorting is `a[n - 1] - a[0]` and needs no loop at all. So the learner has
     * to use both things ordering gave them — the neighbours in the middle and
     * the two ends — in one program.
     *
     * The list is `vector<long long>` and the prompt says why: with values up
     * to 10⁹ in absolute value the widest difference reaches 2 · 10⁹, which
     * overflows a 32-bit `int` silently and prints a negative span. Reading
     * into `long long` from the start costs nothing and removes the trap.
     *
     * The cases hunt specific mutants:
     *   forgot to sort            → «5 1 6 2» answers 4 instead of 1;
     *   loop to n - 2             → «1 10 20 21» misses the last pair, gives 9;
     *   best assigned inside loop → «1 2 20 30» reports the last gap, 10;
     *   best = 0 initially        → «5 3» reports 0 instead of 2;
     *   sign not handled at all   → the negative case «-5 -1 -9 3 0».
     * All-equal gives «0 0», which is also the check that a zero difference is
     * a legal answer and not a signal to skip repeated values.
     */
    id: "m4.l4.b8",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (n ≥ 2). Екінші жолда бос орынмен бөлінген n бүтін сан беріледі, әрқайсысының модулі 1 000 000 000-нан аспайды. Бір жолға бос орынмен бөліп екі санды шығар: алдымен кез келген екі санның арасындағы ең кіші айырманы, содан кейін ең үлкен айырманы. Айырма әрқашан теріс емес деп саналады. Сандар қайталануы мүмкін — ондайда ең кіші айырма 0 болады. Мысалы n = 5, сандар `3 1 4 1 5` болса, жауап `0 4`. Ескерту: ең үлкен айырма 2 000 000 000-ға дейін жетеді, ал `int` ондай санды ұстай алмайды — сондықтан тізімді `vector<long long>` етіп оқы.",
      ru: "В первой строке дано число n (n ≥ 2). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1 000 000 000. Выведи в одну строку через пробел два числа: сначала наименьшую разность между любыми двумя из них, затем наибольшую. Разность всегда считается неотрицательной. Числа могут повторяться — тогда наименьшая разность равна 0. Например, при n = 5 и числах `3 1 4 1 5` ответ `0 4`. Внимание: наибольшая разность доходит до 2 000 000 000, а `int` такое число не удержит — поэтому читай список как `vector<long long>`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    long long best = a[1] - a[0];\n" +
      "    for (int i = 0; i < n - 1; i++) {\n" +
      "        long long d = a[i + 1] - a[i];\n" +
      "        if (d < best) {\n" +
      "            best = d;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best << \" \" << a[n - 1] - a[0];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n3 1 4 1 5", expectedOutput: "0 4" },
      { input: "2\n5 3", expectedOutput: "2 2" },
      { input: "4\n10 20 30 40", expectedOutput: "10 30", hidden: true },
      { input: "4\n40 30 20 10", expectedOutput: "10 30", hidden: true },
      { input: "3\n7 7 7", expectedOutput: "0 0", hidden: true },
      { input: "5\n-5 -1 -9 3 0", expectedOutput: "1 12", hidden: true },
      { input: "4\n5 1 6 2", expectedOutput: "1 5", hidden: true },
      { input: "4\n1 10 20 21", expectedOutput: "1 20", hidden: true },
      { input: "4\n1 2 20 30", expectedOutput: "1 29", hidden: true },
      { input: "6\n100 1 50 2 99 51", expectedOutput: "1 99", hidden: true },
      /* The overflow case: an `int` list answers -294967296 for the span here. */
      { input: "2\n-1000000000 1000000000", expectedOutput: "2000000000 2000000000", hidden: true },
    ],
  },
];
