import type { LessonBlock } from "../../types";

/**
 * m4.l2 · «Екі шешімді салыстыру» / «Сравнение двух решений» — 8 minutes.
 *
 * Skills: `perf.compare_solutions`, `perf.time_estimate`.
 *
 * PDF p.8 names this lesson's device as the month's own: «Айдың басты тәсілі -
 * бір есептің екі шешімін салыстыру. Платформа баяу және жылдам шешімді үлкен
 * деректерде қатар іске қосып, айырманы оқушыға көзбен көрсетеді.» The first
 * sentence is the lesson. The second is a promise the runtime cannot keep yet —
 * the side-by-side race is one of the eight placeholder visualisers listed in
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1, and §3 records that
 * no task carries a per-task time limit.
 *
 * So the comparison is made where it can be made honestly: both programs sit on
 * the same card, both are correct, and the difference is a step count the
 * learner can arrive at by counting rather than by watching an animation. Every
 * pair in this file agrees on every small input on purpose — that is the point
 * being taught, and it is why testing on small data cannot separate them.
 *
 * ## Every bound in this file was re-calibrated for C++
 *
 * The Python original reasoned with «он миллион амал/секунд» — 10⁷, a CPython
 * figure — and three of its tasks had bounds chosen to make a program miss a
 * one-second budget at that rate. C++ is one to two orders of magnitude faster,
 * so those same programs now finish comfortably and the lessons built on them
 * would have taught the opposite of the truth. What changed, and to what:
 *
 *   · the per-second figure, everywhere: 10⁷ → **10⁸** (`b2`, `b4`, `b5`, `b8`);
 *   · `b4`'s prime, 1 000 000 007 → **1 000 000 000 039**, so the slow check is
 *     10¹² divisions rather than 10⁹ — hopeless at either end of the range,
 *     where 10⁹ sat exactly on the boundary. `long long` is now required, which
 *     is honest rather than incidental: the constant does not fit in `int`;
 *   · `b5`'s target, «more than ten million comparisons» → **more than a
 *     billion**, and the accepted sizes drop `n = 20000` (2 · 10⁸ comparisons,
 *     which a C++ program really does finish inside a second);
 *   · `b6`'s bound, n ≤ 10⁹ → **n ≤ 10¹²**, because a C++ loop over a billion
 *     iterations takes about a second and the task claims it cannot finish. At
 *     10¹² the claim is true by three orders of magnitude, and `long long`
 *     becomes part of the exercise.
 *
 * `b7` needed no recalibration: 2 · 10¹⁰ comparisons is out of reach at any
 * plausible rate.
 *
 * ## The one place a clock actually exists, and why it is used exactly once
 *
 * `EXECUTION_LIMITS.timeLimitMs` is 5 seconds and `time_limit_exceeded` is a
 * first-class status the provider treats as evidence about the learner's
 * algorithm, not as infrastructure noise. That only bites when the input is
 * tiny and the work is enormous, which is true of exactly one shape of task:
 * a single number in, a loop over 1..n inside. `b6` is that shape. Its hidden
 * case is n = 10¹², where the loop the learner is handed needs hours and the
 * formula they are asked for needs no loop at all. Every other task in the file
 * states its constraint in the prompt and grades correctness only, because a
 * quadratic pair loop cannot be made to time out without a megabyte of case
 * data in the source file, and faking the clock would be worse than admitting
 * it is missing.
 *
 * ## Three authoring decisions worth stating
 *
 * 1. **`b5` and `b7` are the same shape on purpose.** `b5` shows a quadratic
 *    pair loop and asks for the size at which it stops finishing; `b7` then
 *    asks for a pair-counting problem solved in one pass. `b5` never shows a
 *    fast form, so nothing is transcribed — the learner has to invent the
 *    counting list, which is this month's «алдын ала есептеу» in its smallest
 *    honest form.
 *
 * 2. **The support twin `b7s` is a `fill_blank`, not a `modify_code`.** The
 *    obvious scaffold — hand support the slow program and ask them to speed it
 *    up — is graded by running it, and the slow program passes every case a
 *    source file can hold. A learner who changes nothing goes green. The blanks
 *    are graded on the structure instead, and the first of them (`1001`, not
 *    `1000`) is the boundary the task actually has.
 *
 * 3. **There is no whole-list `max` to announce.** The Python original used
 *    `max()` in `b3` and introduced it there. C++ has no equivalent that stays
 *    inside Year 1's vocabulary — `*max_element(v.begin(), v.end())` needs an
 *    iterator and a dereference, both explicitly out of scope — so the fast
 *    function in `b3` finds the maximum with the one-pass loop October taught.
 *    The comparison the block is about is unaffected: one pass against n passes.
 */

const P = 8;

export const M4_L2: LessonBlock[] = [
  {
    id: "m4.l2.b1",
    type: "concept",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Бірдей жауап, әртүрлі баға",
      ru: "Одинаковый ответ, разная цена",
    },
    body: {
      kk: "Төмендегі екі функция да дұрыс: 1-ден n-ге дейінгі сандардың ішінде 3-ке бөлінетіндерінің санын табады. Кіші n-де олардың айырмасын байқау мүмкін емес — n = 30 болғанда екеуі де 10 шығарады, n = 7 болғанда екеуі де 2 шығарады. Айырма жауапта емес, амалдардың санында.\n\nБірінші функция циклмен n рет айналады: n = 1 000 болса мың рет, n = 1 000 000 000 болса бір миллиард рет. Екіншісі бір ғана бөлу жасайды, ал ол бөлудің саны n-ге тәуелді емес: n қандай болса да, біреу. Мұндағы `n / 3` — бүтін сандардың бөлінуі, яғни қалдық лақтырылады: қыркүйекте көргеніңдей, `7 / 2` C++-та 3 болады.\n\nСпорттық бағдарламалауда шешетін нәрсе дәл осы: дұрыс жауап тым кеш шықса, қабылданбайды. Сондықтан бұл айда әр есепті екі рет қараймыз — жауабы бірдей екі шешімді қатар қойып, олардың қадам санын салыстырамыз. Кіші деректе сынау бұл екеуін ажыратпайды, сондықтан оларды сынау емес, санау ажыратады.",
      ru: "Обе функции ниже верны: они находят количество чисел от 1 до n, которые делятся на 3. На маленьком n разницу заметить невозможно — при n = 30 обе выводят 10, при n = 7 обе выводят 2. Разница не в ответе, а в количестве операций.\n\nПервая функция делает циклом n оборотов: при n = 1 000 — тысячу, при n = 1 000 000 000 — миллиард. Вторая делает одно-единственное деление, и число этих делений от n не зависит: каким бы ни было n, оно равно одному. Здесь `n / 3` — деление целых чисел, то есть остаток отбрасывается: как ты видел в сентябре, `7 / 2` в C++ равно 3.\n\nВ спортивном программировании решает именно это: правильный ответ, полученный слишком поздно, не принимается. Поэтому в этом месяце мы смотрим на каждую задачу дважды — ставим рядом два решения с одинаковым ответом и сравниваем число их шагов. Проверка на маленьких данных этих двоих не различает, так что различает не проверка, а подсчёт.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int count3_slow(int n) {\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        if (i % 3 == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int count3_fast(int n) {\n" +
      "    return n / 3;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << count3_slow(30) << \" \" << count3_fast(30);\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /* «толық талданған мысал» — the pairing argument is written out because the
       formula without it is a rule to memorise, and a memorised formula does
       not transfer to b6, where the learner has to build a different one. */
    id: "m4.l2.b2",
    type: "worked_example",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: 1-ден n-ге дейінгі қосынды екі жолмен",
      ru: "Разобранный пример: сумма от 1 до n двумя способами",
    },
    problem: {
      kk: "1-ден n-ге дейінгі бүтін сандардың қосындысын табу керек. n = 100 үшін жауапты екі түрлі шешіммен есептейміз және әрқайсысы қанша амал жасайтынын санаймыз.",
      ru: "Нужно найти сумму целых чисел от 1 до n. Для n = 100 посчитаем ответ двумя разными решениями и сосчитаем, сколько операций делает каждое.",
    },
    steps: [
      {
        kk: "Бірінші шешім — қазанда жазғанымыздың дәл өзі: жинақтауыш `s` нөлден басталады, цикл 1-ден n-ге дейінгі әр санды бір рет қосады. n = 100 болса, цикл денесі 100 рет орындалады.",
        ru: "Первое решение — ровно то, что мы писали в октябре: накопитель `s` начинается с нуля, цикл по одному разу прибавляет каждое число от 1 до n. При n = 100 тело цикла выполняется 100 раз.",
      },
      {
        kk: "Екінші шешім қосындыны жұптап қарайды. Ең кішісі мен ең үлкенін қосамыз: 1 + 100 = 101. Келесі шеткі екеуін: 2 + 99 = 101. Одан кейінгісін: 3 + 98 = 101. Әр жұптың қосындысы бірдей.",
        ru: "Второе решение смотрит на сумму парами. Складываем самое маленькое с самым большим: 1 + 100 = 101. Следующие два с краёв: 2 + 99 = 101. Потом: 3 + 98 = 101. Сумма каждой пары одна и та же.",
      },
      {
        kk: "100 санды жұптарға бөлгенде 50 жұп шығады, әр жұп 101 береді. Демек қосынды 101 · 50 = 5050. Жалпы жағдайда жұптың қосындысы n + 1, жұптың саны n / 2, сондықтан формула `n * (n + 1) / 2`. Бүтін бөлу қауіпсіз: n мен n + 1-дің біреуі міндетті түрде жұп, сондықтан қалдық қалмайды. Екі функцияның да түрі `long long`: n = 1 000 000 000 болғанда жауап 5 · 10^17-ге жуық, ал `int` мұндай санды ұстай алмайды.",
        ru: "Если разбить 100 чисел на пары, получится 50 пар, каждая даёт 101. Значит, сумма равна 101 · 50 = 5050. В общем случае сумма пары равна n + 1, число пар равно n / 2, поэтому формула — `n * (n + 1) / 2`. Целочисленное деление здесь безопасно: одно из чисел n и n + 1 обязательно чётное, поэтому остатка не будет. Тип у обеих функций — `long long`: при n = 1 000 000 000 ответ близок к 5 · 10^17, а `int` такое число не удержит.",
      },
      {
        kk: "Амалдарды санаймыз. Бірінші шешім n қосу жасайды: n = 100 үшін жүз, n = 1 000 000 үшін миллион, n = 1 000 000 000 үшін миллиард. Екінші шешім үш амал жасайды: бір қосу, бір көбейту, бір бөлу — n қандай болса да, дәл үшеу.",
        ru: "Считаем операции. Первое решение делает n сложений: для n = 100 — сто, для n = 1 000 000 — миллион, для n = 1 000 000 000 — миллиард. Второе делает три операции: одно сложение, одно умножение, одно деление — сколько бы ни было n, ровно три.",
      },
      {
        kk: "Бағалау үшін бір ғана өлшемді ұстанамыз: C++ бағдарламасы бір секундта шамамен жүз миллион қарапайым амал орындайды деп есептейміз. Сонда n = 1 000 000 болғанда бірінші шешім секундтың жүзден біріне үлгереді, ал n = 1 000 000 000 болғанда оған секундтар қатары керек — ол уақыт шегінің дәл жиегінде немесе одан асып тұр, сондықтан мұндай шешімге сүйенуге болмайды. Екінші шешім кез келген n үшін бірдей жылдам.",
        ru: "Для оценки держимся одной мерки: считаем, что программа на C++ выполняет около ста миллионов простых операций в секунду. Тогда при n = 1 000 000 первое решение укладывается в сотую долю секунды, а при n = 1 000 000 000 ему нужны уже секунды — это ровно на краю ограничения или за ним, и полагаться на такое решение нельзя. Второе решение одинаково быстро при любом n.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long sum_slow(long long n) {\n" +
      "    long long s = 0;\n" +
      "    for (long long i = 1; i <= n; i++) {\n" +
      "        s = s + i;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "long long sum_fast(long long n) {\n" +
      "    return n * (n + 1) / 2;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << sum_slow(100) << \" \" << sum_fast(100);\n" +
      "    return 0;\n" +
      "}",
    result: {
      kk: "Экранға бір жолда `5050 5050` шығады. Екі шешімнің жауабы бірдей, бағасы бірдей емес: біреуі жүз қадам жасады, екіншісі үш.",
      ru: "На экран в одной строке выйдет `5050 5050`. Ответ у двух решений одинаковый, а цена разная: одно сделало сто шагов, другое — три.",
    },
  },
  {
    /*
     * The point of this prediction is that it is UNINTERESTING: both halves
     * print the same number, and the learner cannot tell the two programs apart
     * by running them. That is the argument for counting steps, made by
     * experiment rather than by assertion.
     *
     * `5 5` is mapped because it has one reading — the maximum counted as
     * smaller than itself. `4 5` and `3 3` are left unmapped: a miscount of the
     * list and a misread of either function both reach them.
     */
    id: "m4.l2.b3",
    type: "prediction",
    skillRefs: ["perf.compare_solutions", "lists.traverse", "loops.nested"],
    sourceType: "product-authored",
    prompt: {
      kk: "Екі функция да бір нәрсені санайды: тізімдегі ең үлкен саннан КІШІ элементтердің саны. Біріншісі әр элементті бүкіл тізіммен салыстырады, екіншісі ең үлкенін бір рет тауып алады — қазанда жазған сол цикл. Жаңа жазба: `vector<int> a = {3, 1, 4, 1, 5};` — тізімді бірден мәндерімен құру. Бағдарлама нені шығарады?",
      ru: "Обе функции считают одно и то же: количество элементов, которые МЕНЬШЕ самого большого числа в списке. Первая сравнивает каждый элемент со всем списком, вторая один раз находит наибольший — тем самым циклом, который ты писал в октябре. Новая запись: `vector<int> a = {3, 1, 4, 1, 5};` — создать список сразу со значениями. Что выведет программа?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int below_top_slow(vector<int> a) {\n" +
      "    int n = a.size();\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int bigger = 0;\n" +
      "        for (int j = 0; j < n; j++) {\n" +
      "            if (a[j] > a[i]) {\n" +
      "                bigger = 1;\n" +
      "            }\n" +
      "        }\n" +
      "        c = c + bigger;\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int below_top_fast(vector<int> a) {\n" +
      "    int n = a.size();\n" +
      "    int m = a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] > m) {\n" +
      "            m = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] < m) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {3, 1, 4, 1, 5};\n" +
      "    cout << below_top_slow(a) << \" \" << below_top_fast(a);\n" +
      "    return 0;\n" +
      "}",
    answer: "4 4",
    options: ["4 4", "5 5", "4 5", "3 3"],
    diagnosticMapping: {
      "5 5": {
        failureClass: "maximum_counted_as_below_itself",
        justification:
          "5 — тізімдегі барлық элементтің саны, яғни ең үлкен сан да есепке кірген. Екі функцияда да теңсіздік қатаң (`>` және `<`), сондықтан 5 саны өзінен кіші бола алмайды: бұл жауап дәл сол шекараны елемегенді көрсетеді.",
      },
    },
  },
  {
    /* The PDF's «осы бағдарлама үлгере ме?» task type, on a pair October
       already wrote: both are correct primality checks. The number is prime on
       purpose — for a composite n the slow check leaves early, so the question
       "which one finishes" only has a stable answer at the worst case.

       Re-calibrated for C++: the Python original used 1 000 000 007, whose slow
       check is about 10⁹ divisions — roughly a second in C++, which is exactly
       the boundary and therefore exactly the wrong place to set a question. The
       prime is now 1 000 000 000 039, so the slow check is 10¹² divisions and
       the fast one about 10⁶. That also makes `long long` genuinely necessary:
       the constant does not fit in `int`. */
    id: "m4.l2.b4",
    type: "multiple_choice",
    skillRefs: ["perf.time_estimate", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Екі функция да n санының жай екенін дұрыс анықтайды: жай болса 1, болмаса 0 қайтарады. n = 1 000 000 000 039 берілді, ал бұл — жай сан, сондықтан екеуі де циклден ерте шыға алмайды. Сан `int`-ке сыймайтындықтан бәрі `long long` түрінде. Компьютер бір секундта шамамен жүз миллион амал орындайды деп есептесек, қайсысы жауапты бір секундте береді? (1 000 000 000 039-дың квадрат түбірі шамамен 1 000 000.)",
      ru: "Обе функции правильно определяют, простое ли число n: возвращают 1, если простое, и 0 иначе. Дано n = 1 000 000 000 039, а это простое число, поэтому досрочно выйти не сможет ни одна. Число не помещается в `int`, поэтому всё объявлено как `long long`. Если считать, что компьютер выполняет около ста миллионов операций в секунду, какая из них даст ответ за секунду? (Корень из 1 000 000 000 039 — примерно 1 000 000.)",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "// A\n" +
      "int is_prime_a(long long n) {\n" +
      "    if (n < 2) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    for (long long d = 2; d < n; d++) {\n" +
      "        if (n % d == 0) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "// B\n" +
      "int is_prime_b(long long n) {\n" +
      "    if (n < 2) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    long long d = 2;\n" +
      "    while (d * d <= n) {\n" +
      "        if (n % d == 0) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "        d = d + 1;\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << is_prime_a(97) << \" \" << is_prime_b(97);\n" +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "Тек A үлгереді", ru: "Успеет только A" } },
      { id: "o2", label: { kk: "Тек B үлгереді", ru: "Успеет только B" } },
      { id: "o3", label: { kk: "Екеуі де үлгереді", ru: "Успеют обе" } },
      { id: "o4", label: { kk: "Екеуі де үлгермейді", ru: "Не успеет ни одна" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      /* o3 and o4 each have two readings — o3 can come from "a trillion is not
         that many" or from not counting the loop at all, o4 from thinking a
         while loop is unbounded — so neither is attributed. o1 has one: the two
         loop bounds read in the wrong order. */
      o1: {
        failureClass: "loop_bounds_compared_in_the_wrong_direction",
        justification:
          "A циклі d-ны 2-ден n-ге дейін, яғни триллион рет жүргізеді; B циклі d · d ≤ n болғанша ғана, яғни шамамен миллион рет жүреді. «Тек A» жауабы осы екі шектің қайсысы ұзын екенін керісінше оқығанды білдіреді — басқа себебі жоқ, өйткені екі функцияның жауабы бірдей.",
      },
    },
  },
  {
    /*
     * «үлгермейтін мысал ойлап тап», PDF p.8, and the honest form of it: the
     * answer is a SIZE, not a crash. The program below is correct for every
     * input it is given and never raises.
     *
     * RE-CALIBRATED. In Python, at 10⁷ operations a second, n = 20 000 was
     * already too slow; in C++ two hundred million comparisons finish inside a
     * second, so that answer would have been marked correct while being false.
     * The prompt now asks for a size at which the comparison count reaches a
     * BILLION, which is ten seconds at the stated rate and still several seconds
     * at the most optimistic one — and the accepted sizes start at n = 50 000
     * (1.25 · 10⁹ comparisons) instead of n = 20 000.
     *
     * `breakingInputs` are written as `n = ...` rather than as literal stdin,
     * and the prompt says so, for two reasons. The learner's answer is compared
     * by exact string match, so the format has to be stated; and
     * `content-execution.test.ts` feeds every breaking input to the program as
     * real stdin — a literal `200000` would send the suite into a twenty-billion
     * step nested loop, while `n = 200000` makes `cin >> n` fail, leaving `n` at
     * the zero it was initialised to, and the program finishes at once.
     *
     * The format example in the prompt is `n = 1000`, which the same prompt has
     * already established as the size that is comfortably FAST ENOUGH: it
     * demonstrates the format and rules itself out as an answer in the same
     * breath. (A `payload-privacy` review caught the first version, where the
     * example was also one of the accepted answers.)
     */
    id: "m4.l2.b5",
    type: "test_case",
    skillRefs: ["perf.time_estimate", "loops.nested", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама тізімдегі мәндері тең жұптардың санын дұрыс есептейді: i < j болатын әрбір (i, j) жұбы үшін a[i] мен a[j]-ді бір рет салыстырады. Шартта 2 ≤ n ≤ 200 000 деп жазылған, уақыт шектеуі — бір секунд, ал C++ бағдарламасы бір секундта шамамен жүз миллион қарапайым қадам жасайды.\n\nБағдарлама АНЫҚ үлгермейтін енгізудің КӨЛЕМІН тап. Санап көр: n = 1 000 болғанда салыстырулар саны шамамен n · n / 2, яғни жарты миллион — бұл секундтың жүзден бірі, әлі тым аз. Салыстырулар саны кемінде бір миллиардқа жететіндей n тап: бір миллиард қадам жүз миллион қадам/секунд жылдамдықпен он секундқа жуық уақыт алады. Жауабыңды `n = 1000` дегендегідей түрде, тек көлемін көрсетіп жаз (1 000 — жоғарыда айтылған, әлі аз мысал; сен одан әлдеқайда үлкен санды табуың керек).",
      ru: "Эта программа правильно считает количество пар с равными значениями: для каждой пары (i, j) с i < j она один раз сравнивает a[i] и a[j]. В условии написано 2 ≤ n ≤ 200 000, ограничение по времени — одна секунда, а программа на C++ выполняет около ста миллионов простых шагов в секунду.\n\nНайди РАЗМЕР ввода, на котором программа заведомо не уложится. Посчитай: при n = 1 000 сравнений примерно n · n / 2, то есть полмиллиона — это сотая доля секунды, ещё слишком мало. Найди такое n, при котором сравнений станет не меньше миллиарда: миллиард шагов на скорости сто миллионов шагов в секунду занимает около десяти секунд. Ответ запиши в такой же форме, как `n = 1000`, указав только размер (1 000 — это упомянутый выше пример, которого ещё мало; тебе нужно число заметно больше).",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n = 0;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    long long c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if (a[i] == a[j]) {\n" +
      "                c = c + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    breakingInputs: ["n = 200000", "n = 100000", "n = 50000"],
  },
  {
    /*
     * The only enforceable clock in the lesson, and RE-CALIBRATED for C++: the
     * Python bound of 10⁹ was chosen because CPython needs about ninety seconds
     * there, and a C++ loop over a billion iterations takes roughly a second —
     * inside the 5-second judge limit, so the task's central claim would have
     * been false. The bound is now 10¹², where the given loop needs hours and
     * the formula needs no loop at all. `long long` comes with the bound and is
     * stated in the prompt rather than left as a trap.
     *
     * The overlap term is the whole exercise. b1 hands the learner the
     * single-divisor count; nothing on any card this month does the subtraction
     * for them.
     */
    id: "m4.l2.b6",
    type: "modify_code",
    skillRefs: ["perf.compare_solutions", "arith.integer_division", "logic.and_or_not"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама 1-ден n-ге дейінгі сандардың ішінде 3-ке НЕМЕСЕ 5-ке бөлінетіндерінің санын дұрыс есептейді, бірақ ол n рет айналады. Шартта 1 ≤ n ≤ 1 000 000 000 000 деп жазылған (бір триллион, сондықтан `long long`), ал әр санды бөлек тексеретін шешім бұл шекте сағаттап жұмыс істер еді — тексеру оны уақыт бойынша қабылдамайды.\n\nЖауабын өзгертпей, циклі мүлде қалмайтындай етіп қайта жаз. Ескерту: 15-ке бөлінетін сандар екі шартқа да сай келеді, сондықтан оларды екі рет санауға болмайды. n = 15 үшін дұрыс жауап 7 (3, 5, 6, 9, 10, 12, 15).",
      ru: "Эта программа правильно считает, сколько чисел от 1 до n делятся на 3 ИЛИ на 5, но делает n оборотов. В условии написано 1 ≤ n ≤ 1 000 000 000 000 (один триллион, поэтому `long long`), а решение, проверяющее каждое число по отдельности, работало бы на таком пределе часами — проверка не примет его по времени.\n\nПерепиши её так, чтобы цикла не осталось вовсе, а ответ не изменился. Внимание: числа, делящиеся на 15, подходят под оба условия, поэтому считать их дважды нельзя. Для n = 15 правильный ответ — 7 (3, 5, 6, 9, 10, 12, 15).",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    long long n;\n" +
      "    cin >> n;\n" +
      "    long long c = 0;\n" +
      "    for (long long i = 1; i <= n; i++) {\n" +
      "        if (i % 3 == 0 || i % 5 == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    long long n;\n" +
      "    cin >> n;\n" +
      "    cout << n / 3 + n / 5 - n / 15;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "10", expectedOutput: "5" },
      { input: "15", expectedOutput: "7" },
      /* 1 and 2 kill a formula with a stray + 1; 14 and 30 kill both the
         missing overlap term (14 has none, 30 has two) and an overlap
         subtracted twice; the billion and the two trillions are the cases the
         given loop cannot survive at all, and the last two also kill an `int`
         that was never widened. */
      { input: "1", expectedOutput: "0", hidden: true },
      { input: "2", expectedOutput: "0", hidden: true },
      { input: "14", expectedOutput: "6", hidden: true },
      { input: "30", expectedOutput: "14", hidden: true },
      { input: "1000000000", expectedOutput: "466666667", hidden: true },
      { input: "999999999999", expectedOutput: "466666666666", hidden: true },
      { input: "1000000000000", expectedOutput: "466666666667", hidden: true },
    ],
  },
  {
    /*
     * The month's «алдын ала есептеу» in its smallest form: one pass, one
     * counting list, and the answer for each x read out of work already done.
     * The naive form is the nested loop the learner has just condemned in b5,
     * which is why the two sit in this order.
     *
     * Cases are chosen against the four mutants this task actually attracts:
     * counting AFTER incrementing (self-pairs, killed by `3 6`), no bounds
     * check on s - x (in C++ `cnt[s - x]` with a negative or oversized index is
     * undefined behaviour rather than a wrong answer, which is worse — killed
     * by `4 2`), a list of 1000 slots instead of 1001 (killed by `2 2000`), and
     * counting each pair twice (killed by `4 4`, where doubling gives 12).
     */
    id: "m4.l2.b7",
    type: "write_code",
    skillRefs: ["perf.compare_solutions", "precompute.prefix", "lists.index", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n және s сандары беріледі (2 ≤ n ≤ 200 000, 2 ≤ s ≤ 2000). Екінші жолда n сан: әрқайсысы 1-ден 1000-ға дейін. a[i] + a[j] = s болатын және i < j болатын жұптардың санын шығар.\n\nБарлық жұпты қарап шығу n · n / 2-ге жуық салыстыру береді, ал n = 200 000 болғанда бұл жиырма миллиард амал — үлгермейді. Тізімді бір рет қана өтетін шешім керек.\n\nКеңес: 1000 мәннің әрқайсысы осы сәтке дейін неше рет кездескенін бөлек тізімде санап отыр. `vector<int> cnt(1001, 0);` деп жазсаң, 1001 нөлден тұратын тізім шығады. Сонда кезекті x саны үшін оған жұп болатын s − x мәнінің неше рет кездескені дайын тұрады — оны қосасың да, содан кейін ғана x-тің өз санағышын арттырасың. Реті маңызды: солай жасағанда әр жұп дәл бір рет және тек i < j болғанда есептеледі. s − x мәні 1 мен 1000 аралығында екенін тексеруді ұмытпа: тізімнен шектен тыс индексті сұрау C++-та бағдарламаны бұзады.",
      ru: "В первой строке даны числа n и s (2 ≤ n ≤ 200 000, 2 ≤ s ≤ 2000). Во второй строке — n чисел, каждое от 1 до 1000. Выведи количество пар с i < j, для которых a[i] + a[j] = s.\n\nПеребор всех пар даёт примерно n · n / 2 сравнений, а при n = 200 000 это двадцать миллиардов операций — не уложится. Нужно решение, которое проходит по списку один раз.\n\nПодсказка: веди отдельный список, в котором для каждого из 1000 значений записано, сколько раз оно встретилось до этого момента. Запись `vector<int> cnt(1001, 0);` создаёт список из 1001 нуля. Тогда для очередного числа x уже готово, сколько раз встречалось парное к нему значение s − x — его и прибавляешь, и только после этого увеличиваешь счётчик самого x. Порядок важен: именно так каждая пара засчитывается ровно один раз и только при i < j. И не забудь проверить, что s − x лежит между 1 и 1000: обращение к списку по индексу за его границами в C++ ломает программу.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, s;\n" +
      "    cin >> n >> s;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> cnt(1001, 0);\n" +
      "    long long total = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x = a[i];\n" +
      "        int y = s - x;\n" +
      "        if (y >= 1 && y <= 1000) {\n" +
      "            total = total + cnt[y];\n" +
      "        }\n" +
      "        cnt[x] = cnt[x] + 1;\n" +
      "    }\n" +
      "    cout << total;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 6\n1 5 3 3 2", expectedOutput: "2" },
      { input: "2 2\n1 1", expectedOutput: "1" },
      { input: "4 4\n2 2 2 2", expectedOutput: "6", hidden: true },
      { input: "3 6\n3 3 3", expectedOutput: "3", hidden: true },
      { input: "4 2\n3 3 1 1000", expectedOutput: "0", hidden: true },
      { input: "2 2000\n1000 1000", expectedOutput: "1", hidden: true },
      { input: "3 1001\n1 1000 1000", expectedOutput: "2", hidden: true },
      { input: "6 7\n1 2 3 4 5 6", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b7 — same problem, same constraints, same idea.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ».
     *
     * Nothing visible on any nearby card contains this program: b5 shows the
     * quadratic pair loop and no fast form, b6's reference is a formula with no
     * list in it, and b1/b2 are single-number arithmetic. The support learner
     * reconstructs three decisions rather than transcribing one program — the
     * size of the counting list (the boundary the task has: values run to 1000
     * inclusive, so 1001 slots), the partner value, and what is actually added
     * to the running total.
     */
    id: "m4.l2.b7s",
    type: "fill_blank",
    skillRefs: ["perf.compare_solutions", "precompute.prefix", "lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n және s беріледі (2 ≤ n ≤ 200 000, 2 ≤ s ≤ 2000), екінші жолда n сан, әрқайсысы 1-ден 1000-ға дейін. a[i] + a[j] = s болатын және i < j болатын жұптардың саны керек. Барлық жұпты қарап шығу тым баяу, сондықтан бағдарлама тізімді бір-ақ рет өтеді: `cnt` тізімінде әр мәннің осы сәтке дейін неше рет кездескені сақталады.\n\nҮш орынды толтыр. (1) `cnt` тізімінде неше орын болуы керек — мәндер 1-ден 1000-ға дейін, ал `cnt[1000]` деп жазу үшін орын жетуі керек. (2) x санына жұп болу үшін екінші санның мәні қандай болуы тиіс. (3) `total`-ға нақты не қосылады.",
      ru: "В первой строке даны n и s (2 ≤ n ≤ 200 000, 2 ≤ s ≤ 2000), во второй — n чисел, каждое от 1 до 1000. Нужно количество пар с i < j, для которых a[i] + a[j] = s. Перебор всех пар слишком медленный, поэтому программа проходит по списку ровно один раз: в списке `cnt` хранится, сколько раз каждое значение встретилось до этого момента.\n\nЗаполни три места. (1) Сколько ячеек должно быть в списке `cnt` — значения идут от 1 до 1000, а обращение `cnt[1000]` должно быть допустимым. (2) Каким должно быть значение второго числа, чтобы оно составило пару числу x. (3) Что именно прибавляется к `total`.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, s;\n" +
      "    cin >> n >> s;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> cnt(___, 0);\n" +
      "    long long total = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x = a[i];\n" +
      "        int y = ___;\n" +
      "        if (y >= 1 && y <= 1000) {\n" +
      "            total = total + ___;\n" +
      "        }\n" +
      "        cnt[x] = cnt[x] + 1;\n" +
      "    }\n" +
      "    cout << total;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "1001" },
      { id: "f2", answer: "s - x", alternatives: ["s-x"] },
      { id: "f3", answer: "cnt[y]" },
    ],
  },
  {
    /*
     * PDF p.6: «Тереңдетілген … шешімді жазбаша қорғау міндетті». The ban on
     * notation is deliberate — «O(n)» is a phrase a learner can produce without
     * having counted anything, and counting is the objective. The marking
     * points therefore cover all three pairs offered, because the answer is
     * graded on whether the arithmetic is there, not on which task was picked.
     *
     * Every figure here is the re-calibrated one: a hundred million steps a
     * second, so the boundary for an n-step solution sits at n ≈ 10⁸ rather
     * than at 10⁷.
     */
    id: "m4.l2.b8",
    type: "explain",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Бүгін екі шешімі бар үш есеп болды: 1-ден n-ге дейінгі қосынды, санның жай екенін тексеру, 3-ке не 5-ке бөлінетін сандарды санау. Біреуін таңда және жылдам шешімнің неге жылдам екенін жазбаша түсіндір.\n\nТалап: `O(n)` сияқты белгілеуді қолданба — қадаммен сөйле. Жауабыңда төрт нәрсе болсын: (1) баяу шешім n үшін шамамен неше қадам жасайды, (2) жылдам шешім неше қадам жасайды және ол n-ге тәуелді ме, (3) осы екеуін n = 1 000 және n = 1 000 000 000 үшін нақты санмен есепте, (4) бір секундта жүз миллион амал орындалады десек, баяу шешім n-нің қай шамасынан бастап үлгермей қалады — есептеуіңді көрсет.",
      ru: "Сегодня было три задачи с двумя решениями: сумма от 1 до n, проверка числа на простоту, подсчёт чисел, делящихся на 3 или на 5. Выбери одну и объясни письменно, почему быстрое решение быстрее.\n\nТребование: не пользуйся обозначениями вроде `O(n)` — говори шагами. В ответе должно быть четыре вещи: (1) сколько примерно шагов делает медленное решение при данном n, (2) сколько шагов делает быстрое и зависит ли это число от n, (3) посчитай оба числа конкретно для n = 1 000 и n = 1 000 000 000, (4) если считать, что за секунду выполняется сто миллионов операций, то с какого примерно n медленное решение перестаёт укладываться — покажи расчёт.",
    },
    expectedPoints: [
      {
        kk: "Баяу шешімнің қадам саны n арқылы нақты айтылған, «көп» деген сөзбен емес: қосындыда n қосу, бөлінгіштерді санауда n тексеру, жай санды тексеруде n − 2-ге жуық бөлу.",
        ru: "Число шагов медленного решения названо через n конкретно, а не словом «много»: в сумме — n сложений, в подсчёте делящихся — n проверок, в проверке простоты — около n − 2 делений.",
      },
      {
        kk: "Жылдам шешімнің қадам саны да айтылған және оның n-ге тәуелділігі дұрыс сипатталған: формулада қадам саны тұрақты (үш-төрт амал, n-ге тәуелсіз), ал квадрат түбірге дейінгі тексеруде ол n-мен бірге өседі, бірақ әлдеқайда баяу — n = 1 000 000 000 039 үшін шамамен 1 000 000 қадам.",
        ru: "Число шагов быстрого решения тоже названо, и его зависимость от n описана верно: у формулы число шагов постоянно (три-четыре операции, от n не зависит), а у проверки до квадратного корня оно растёт вместе с n, но гораздо медленнее — для n = 1 000 000 000 039 это примерно 1 000 000 шагов.",
      },
      {
        kk: "Екі нақты n үшін екі сан да есептелген, мысалы қосынды үшін: n = 1 000 болғанда мың қадамға қарсы үш қадам, n = 1 000 000 000 болғанда бір миллиард қадамға қарсы сол үш қадам. Салыстыру сөзбен емес, сандармен жасалған.",
        ru: "Для двух конкретных n посчитаны оба числа, например для суммы: при n = 1 000 — тысяча шагов против трёх, при n = 1 000 000 000 — миллиард шагов против тех же трёх. Сравнение сделано числами, а не словами.",
      },
      {
        kk: "Шекара есептелген: секундына жүз миллион амал болса, n қадам жасайтын шешім n жүз миллионнан асқанда үлгермей қалады, яғни шамамен n = 100 000 000-нан бастап. Есептеу көрсетілген, жауап жай ғана айтылмаған.",
        ru: "Граница посчитана: при ста миллионах операций в секунду решение, делающее n шагов, перестаёт укладываться, когда n превышает сто миллионов, то есть примерно с n = 100 000 000. Расчёт показан, а не просто назван ответ.",
      },
      {
        kk: "Түсіндірмеде екі шешімнің де ДҰРЫС екені айтылған: айырма жауапта емес, оның қашан келетінінде. Бұл айдың негізгі ойы — дұрыс жауап тым кеш шықса, қабылданбайды.",
        ru: "В объяснении сказано, что оба решения ВЕРНЫ: разница не в ответе, а в том, когда он появляется. Это и есть главная мысль месяца — правильный ответ, полученный слишком поздно, не принимается.",
      },
    ],
  },
];
