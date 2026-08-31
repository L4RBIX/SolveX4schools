import type { LessonBlock } from "../../types";

/**
 * Lesson m9.l1 · «Уақытты бөлу» — how 45 minutes are spent across five problems.
 * PDF p.10, May. Skill: `contest.time_split`.
 *
 * Three clauses of the programme drive every block below.
 *
 *   «есептер арасында уақытты бөлу … уақытында басқа есепке ауысу» (p.10,
 *   «Оқушы нені меңгереді») — the subject of the lesson is a decision, not an
 *   algorithm: which problem to open, and when to put one down.
 *
 *   «төрт 45 минуттық жаттығу жарысы» (p.10, practice) — the 45 minutes and the
 *   five problems are the programme's own numbers, not a scenario invented to
 *   make the arithmetic tidy. Every situation on these cards uses them.
 *
 *   «Бұл айда жаңа тақырып жоқ» (p.10, «Түсіндіру қалай беріледі») — so the two
 *   coding tasks introduce nothing. `b7` is October's single traversal with a
 *   counter; `b8` is December's «алдын ала есептеу» — the total computed once —
 *   over October's accumulator. Each carries a comment naming its month, which
 *   is the whole point of a contest month: a problem you cannot place in a month
 *   of the year is a problem this course did not prepare you for.
 *
 * ## Judgement has to be graded like an algorithm or it is just advice
 *
 * A lesson about "manage your time" collapses into slogans unless the rule is
 * as concrete as `range(a, b)`. So `b1` states the plan as five numbered steps
 * with real minute figures, and `b2`–`b4` charge the learner against them: one
 * situation twenty minutes into a contest, one ranking decision at minute zero,
 * and one prediction where a stated pace is turned into an actual number by
 * actual Python. The prediction is a real program on purpose — the learner
 * should watch a plan produce a count rather than be told one.
 *
 * ## The structural requirement, and which of the three options this lesson took
 *
 * `b8` wants a single left-to-right pass with the total precomputed. Output
 * comparison cannot see a pass count: an O(n²) version that re-adds the prefix
 * for every k prints the same answers. So the prompt takes **option 2 from the
 * authoring contract — guidance, not a rule.** It says «Кеңес: … бір рет қана
 * жүріп өт», then says in the same breath that the task is graded on the answer.
 * Option 1 was unavailable (no output distinguishes the two shapes at these
 * sizes) and option 3 would have spent the lesson's one written block on
 * complexity instead of on the plan, which is the objective the month names.
 *
 * ## Where a diagnostic mapping is deliberately absent
 *
 * Only `b2`'s sunk-cost option and `b4`'s "ignored the condition" answer carry
 * one. Every other wrong answer here has at least two honest readings, and the
 * per-block comments say which two — the engine asking a fourteen-year-old why
 * they chose it beats the engine telling them something false about themselves.
 */

const P = 10; // PDF page for all of May

export const M9_L1: LessonBlock[] = [
  {
    id: "m9.l1.b1",
    type: "concept",
    skillRefs: ["contest.time_split"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "45 минут: жоспар",
      ru: "45 минут: план",
    },
    /* Steps 1 and 4 are the two the rest of the lesson charges against, so both
       carry a number a learner can look at a clock and check: five minutes of
       reading, ten minutes of no progress. «Жоспарлы бол» without a figure is
       not a rule, it is a mood. */
    body: {
      kk: "Жаттығу жарысы 45 минутқа созылады, есеп саны — бес. Тәртібі мынандай.\n\n1-қадам. Алғашқы 5 минутта бес есептің де шартын оқып шық. Бірде-бір жол код жазба — тек оқы.\n\n2-қадам. Есептерді өзің үшін ретте: қайсысының шешімін дәл қазір сөзбен айта аласың, қайсысы жыл бойы шығарған есепке ұқсайды, қайсысында n тым үлкен.\n\n3-қадам. Ең сенімді есептен баста — сырттай ең қысқа көрінгеннен емес, шешу жолын нақты білетініңнен.\n\n4-қадам. Бір есеппен шамамен 10 минут отырсаң да алға жылжу болмаса, оны қалдырып, келесісіне көш. Жазғаның ешқайда жоғалмайды: уақыт қалса, қайта ораласың.\n\n5-қадам. Соңғы 5 минутта жаңа есеп ашпа. Дайын тұрған шешімдерді жіберіп үлгер.\n\nТолық шешілген екі есеп — жартылай жазылған төрт есептен артық. Турнир кестесінде тек аяқталған шешім ғана есептеледі.",
      ru: "Тренировочное соревнование длится 45 минут, задач — пять. Порядок такой.\n\nШаг 1. Первые 5 минут прочитай условия всех пяти задач. Не пиши ни строчки кода — только читай.\n\nШаг 2. Расставь задачи для себя по порядку: какую ты уже сейчас можешь объяснить словами, какая похожа на решённое за год, у какой n слишком большое.\n\nШаг 3. Начинай с той, в которой уверен, — не с той, у которой условие короче, а с той, где ты знаешь путь к решению.\n\nШаг 4. Если сидишь над задачей около 10 минут и продвижения нет, оставь её и переходи к следующей. Написанное никуда не денется: вернёшься, если останется время.\n\nШаг 5. В последние 5 минут не открывай новую задачу. Успей отправить то, что уже готово.\n\nДве полностью решённые задачи лучше четырёх наполовину написанных. В таблице результатов считается только законченное решение.",
    },
  },
  {
    id: "m9.l1.b2",
    type: "multiple_choice",
    skillRefs: ["contest.time_split"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жарыс басталғанына 20 минут болды. B мен C есептерін жіберіп, «accepted» алдың. A есебімен 12 минуттан бері отырсың: коды жартылай жазылған, әлі жұмыс істемейді. D мен E есептерінің шартын әлі оқыған жоқсың. Қалғаны — 25 минут. Не істейсің?",
      ru: "С начала соревнования прошло 20 минут. Задачи B и C отправлены и получили «accepted». Над задачей A ты сидишь уже 12 минут: код написан наполовину и пока не работает. Условия задач D и E ты ещё не читал. Осталось 25 минут. Что делаешь?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "A-ны аяғына дейін жазамын: оған 12 минут кетті, енді тастау өкінішті.",
          ru: "Дописываю A: на неё уже ушло 12 минут, бросать жалко.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "D мен E-нің шартын 3 минут оқып шығамын, содан кейін қалған үш есептің қайсысы маған жеңіл екенін шешемін.",
          ru: "3 минуты читаю условия D и E, а потом решаю, какая из трёх оставшихся легче для меня.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "A-ны жабамын да, бірден D-ні жазуға кірісемін: 10 минут ережесі бойынша ауысатын кез келді.",
          ru: "Закрываю A и сразу берусь писать D: по правилу десяти минут пора переключаться.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "A-ны қазіргі күйінде жіберемін: мүмкін бірнеше тест өтіп, бірдеңе әкеледі.",
          ru: "Отправляю A как есть: вдруг часть тестов пройдёт и что-нибудь принесёт.",
        },
      },
    ],
    correctOptionId: "o2",
    /*
     * o2 wins for one stated reason: D and E are the only two problems whose
     * difficulty is still unknown, and three minutes buys that knowledge while
     * twenty-two minutes remain. A ranking made without reading is not a
     * ranking. Nothing about A is lost — b1 step 4 says the code stays.
     *
     * o3 carries no mapping although it is wrong: a learner picks it either
     * because they applied the switch rule and skipped the ranking step, or
     * because they think "switch" means "switch to the next letter". Two causes,
     * so the engine asks.
     *
     * o4 carries none for the same reason: it is produced both by believing a
     * half-written program earns partial points and by the genuine (and, in some
     * systems, sensible) tactic of submitting to see what the judge says — which
     * is m9.l2's subject, not this card's.
     */
    diagnosticMapping: {
      o1: {
        failureClass: "sunk_cost_persistence",
        justification:
          "Бұл нұсқаның өз тұжырымы «12 минут кетті, тастау өкінішті» дегенге ғана сүйенеді. Кеткен уақыт есептің шешілуге қаншалықты жақын екенін көрсетпейді, сондықтан оны таңдау — шешімді алдағы пайдамен емес, өткен шығынмен өлшеу.",
      },
    },
  },
  {
    id: "m9.l1.b3",
    type: "multiple_choice",
    skillRefs: ["contest.time_split", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жарыс жаңа басталды, бес есептің де шартын оқып шықтың. Әр есеп туралы білетінің: шарты неше жол, n қандай шамада және ол жыл бойы шығарған қай есепке ұқсайды. Қайсысын бірінші ашасың?",
      ru: "Соревнование только началось, ты прочитал условия всех пяти задач. Про каждую известно: сколько строк в условии, каков порядок n и на какую решённую за год задачу она похожа. Какую откроешь первой?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "A — шарты 15 жол, n ≤ 200 000, торда ең қысқа жол (наурыз, толқын әдісі)",
          ru: "A — условие на 15 строк, n ≤ 200 000, кратчайший путь в сетке (март, метод волны)",
        },
      },
      {
        id: "o2",
        label: {
          kk: "B — шарты 5 жол, n ≤ 100, тізімдегі жұп сандардың саны (қазан, бір рет қарап шығу)",
          ru: "B — условие на 5 строк, n ≤ 100, количество чётных чисел в списке (октябрь, один проход)",
        },
      },
      {
        id: "o3",
        label: {
          kk: "C — шарты 3 жол, ең қысқасы, бірақ n ≤ 1 000 000 000, n-ге дейінгі жай сандардың саны",
          ru: "C — условие на 3 строки, самое короткое, но n ≤ 1 000 000 000, количество простых чисел до n",
        },
      },
      {
        id: "o4",
        label: {
          kk: "D — шарты 20 жол, ұзақ әңгіме, n ≤ 50, жыл бойы кездеспеген тәсіл керек",
          ru: "D — условие на 20 строк, длинная история, n ≤ 50, нужен приём, не встречавшийся за год",
        },
      },
      {
        id: "o5",
        label: {
          kk: "E — шарты 8 жол, n ≤ 100 000, реттелген тізімнен санды табу (қаңтар, екіге бөліп іздеу)",
          ru: "E — условие на 8 строк, n ≤ 100 000, поиск числа в отсортированном списке (январь, бинарный поиск)",
        },
      },
    ],
    correctOptionId: "o2",
    /*
     * Three signals point the same way at B and only at B: the shortest
     * statement among the ones whose method is known, the smallest n, and a task
     * October ran a dozen times. E is the near miss and is meant to be — it is
     * familiar too, but binary search costs boundary care that counting evens
     * does not, so it is the second problem, not the first.
     *
     * No diagnosticMapping. C is the trap the card is built around, and it has
     * two causes that cannot be told apart from the answer alone: reading
     * "shortest statement" as "easiest", and not knowing that a loop to
     * 1 000 000 000 does not fit in the time limit — December's own topic. The
     * second is a gap in knowledge, the first is a habit of judgement, and
     * naming the wrong one to a learner is worse than asking.
     */
  },
  {
    id: "m9.l1.b4",
    type: "prediction",
    skillRefs: ["contest.time_split"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жоспарың осылай: 45 минуттың 5-і шарттарды оқуға кетеді, ал `plan` — бес есепті өзің таңдаған ретпен шығаруға қанша минут кетеді деген өз бағалауың. Бағдарлама тізімді реттеп аралайды: қалған уақытқа сыятын есепті шығарады, сыймайтынын аттап өтіп, келесісіне көшеді. Ол қандай сан шығарады?",
      ru: "Твой план такой: из 45 минут 5 уходит на чтение условий, а `plan` — это твоя собственная оценка, сколько минут займёт каждая из пяти задач в выбранном тобой порядке. Программа идёт по списку по порядку: задачу, которая укладывается в оставшееся время, решает, а ту, которая не укладывается, пропускает и переходит к следующей. Какое число она выведет?",
    },
    code:
      "left = 45\nleft = left - 5\nplan = [8, 12, 10, 20, 25]\ndone = 0\nfor t in plan:\n    if t <= left:\n        left = left - t\n        done = done + 1\nprint(done)",
    answer: "3",
    options: ["2", "3", "4", "5"],
    /*
     * 5 has exactly one route: reading the loop as if the `if` were not there
     * and counting the length of `plan`. Nothing else in this program produces
     * it — the body's only other statement subtracts time.
     *
     * 4 carries no mapping. It comes both from letting the 20 fit (10 minutes
     * remain, so it does not) and from the widespread habit of counting a list
     * of five as four when the last item is skipped. Two causes, so no claim.
     */
    diagnosticMapping: {
      "5": {
        failureClass: "condition_ignored",
        justification:
          "5 деген жауап тек `if t <= left` шартын мүлде ескермегенде шығады: ол `plan` тізімінің ұзындығы. Цикл денесінде санағышты өсіретін жол шарттың ішінде тұр, сондықтан бесеуін де санау шартты оқымағанды білдіреді.",
      },
    },
  },
  {
    id: "m9.l1.b5",
    type: "explain",
    skillRefs: ["contest.time_split"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* This is the lesson objective in one block, so it goes to all three routes.
       Three short questions, not four: the month's written defence lives in
       m9.l4, and a plan nobody can write in three minutes is not a plan. */
    prompt: {
      kk: "45 минут, бес есеп. Өз жоспарыңды жаз. Үш сұраққа қысқа жауап бер. (1) Алғашқы 5 минутта не істейсің? (2) Бірінші қай есепті ашасың және оны қандай белгілерге қарап таңдайсың? (3) Есепті қалдыруға қандай нақты белгі бойынша шешім қабылдайсың? Жауабыңды мұғалім оқиды.",
      ru: "45 минут, пять задач. Напиши свой план. Ответь коротко на три вопроса. (1) Что ты делаешь в первые 5 минут? (2) Какую задачу откроешь первой и по каким признакам её выберешь? (3) По какому конкретному признаку решишь оставить задачу? Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "Алғашқы минуттар оқуға кетеді: бес есептің де шарты қаралады, код жазылмайды. Себебі оқылмаған есепті реттеуге болмайды — қайсысы жеңіл екені белгісіз.",
        ru: "Первые минуты уходят на чтение: просматриваются условия всех пяти задач, код не пишется. Причина названа: непрочитанную задачу нельзя поставить в очередь — неизвестно, лёгкая ли она.",
      },
      {
        kk: "Бірінші есепті таңдау белгілермен негізделеді: n шамасы, шарттың ұзындығы және есептің жыл бойы шығарылған қай тәсілге ұқсайтыны. Жауапта кем дегенде бір нақты ай мен тәсіл аталады (мысалы, «қазандағы бір рет қарап шығу»).",
        ru: "Выбор первой задачи обоснован признаками: порядок n, длина условия и то, на какой изученный за год приём задача похожа. В ответе назван хотя бы один конкретный месяц и приём (например, «октябрьский один проход»).",
      },
      {
        kk: "Есепті қалдыру шарты өлшенетін түрде айтылады — уақыт бойынша (шамамен 10 минут) немесе алға жылжудың нақты белгісі бойынша (әдісті әлі айта алмаймын, бірінші тест те өтпейді). «Ұнамаса тастаймын» деген жауап өлшенбейді.",
        ru: "Условие отказа от задачи сформулировано измеримо — по времени (около 10 минут) или по конкретному признаку продвижения (метод до сих пор не назван, не проходит даже первый тест). Ответ «брошу, если не понравится» неизмерим.",
      },
      {
        kk: "Қалдырылған есеп өшірілмейді, жазылғаны сақталады және уақыт қалса қайта ашылады; соңғы минуттар жаңа есепке емес, дайын шешімдерді жіберуге бөлінеді.",
        ru: "Оставленная задача не удаляется, написанное сохраняется и при наличии времени к ней возвращаются; последние минуты отводятся не на новую задачу, а на отправку готовых решений.",
      },
    ],
  },
  {
    id: "m9.l1.b6",
    type: "reflection",
    skillRefs: ["contest.time_split"],
    /* «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін … тексеру тізіміне
       айналады» (p.10). The journal is the programme's, and a ranking of your
       own topics is what turns it into something usable at minute zero of a
       contest. */
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Жыл бойғы тақырыптарды есіңе түсір: циклдер, тізімдер, функциялар, реттеу, алдын ала есептеу, екіге бөліп іздеу, екі шекара әдісі, толық тексеру, рекурсия, тор мен толқын, ашкөз таңдау, кестемен шешу. Қай тәсілге бірінші қол созасың — қайсысы саған бірден түсінікті? Қайсысынан жалтарасың? Жарыста дәл сол тәсілді талап ететін есеп кездессе, не істейсің?",
      ru: "Вспомни темы года: циклы, списки, функции, сортировка, предварительные вычисления, бинарный поиск, метод двух указателей, полный перебор, рекурсия, сетка и волна, жадный выбор, решение через таблицу. К какому приёму ты тянешься первым — какой понятен тебе сразу? Какого избегаешь? Что сделаешь, если на соревновании попадётся задача, требующая именно его?",
    },
  },
  {
    /*
     * The problem you open first, and the month it comes from: ОКТЯБРЬ — one
     * traversal of a list with a counter (`loops.counter`, `lists.traverse`).
     * No new technique, which is the rule for May.
     *
     * The degenerate programs, and the case that kills each:
     *   `>=` instead of `>`            → "4\n2 2 2 2" expects 0, it prints 3.
     *   `range(1, n - 1)`, one short   → "3\n1 1 9" expects 1, it prints 0.
     *   `a[i] > a[i - 1]`, comparing to
     *   the previous element instead of
     *   to the first                   → "6\n10 1 2 3 4 5" expects 0, it prints 4.
     *   counting the complement        → "5\n1 2 3 4 5" expects 4, it prints 0.
     * `range(n)` instead of `range(1, n)` is NOT killed by any case and is not
     * meant to be: `a[0] > a[0]` is false, so it is the same program with one
     * wasted comparison, not a wrong one.
     */
    id: "m9.l1.b7",
    type: "write_code",
    skillRefs: ["contest.time_split", "lists.traverse", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда n бүтін сан беріледі. Бірінші саннан қатаң үлкен сандардың санын шығар. Бірінші санның өзі саналмайды. Мысалы `3 1 4 1 5` үшін жауап 2 — бұл 4 пен 5.",
      ru: "В первой строке дано число n, во второй — n целых чисел. Выведи, сколько из них строго больше первого числа. Само первое число не считается. Например, для `3 1 4 1 5` ответ 2 — это 4 и 5.",
    },
    referenceSolution:
      "n = int(input())\na = list(map(int, input().split()))\nc = 0\nfor i in range(1, n):\n    if a[i] > a[0]:\n        c = c + 1\nprint(c)",
    cases: [
      { input: "5\n3 1 4 1 5", expectedOutput: "2" },
      { input: "1\n7", expectedOutput: "0" },
      { input: "4\n2 2 2 2", expectedOutput: "0", hidden: true },
      { input: "3\n1 1 9", expectedOutput: "1", hidden: true },
      { input: "6\n10 1 2 3 4 5", expectedOutput: "0", hidden: true },
      { input: "5\n1 2 3 4 5", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * The contrast: a problem you open second or third. ДЕКАБРЬ — «алдын ала
     * есептеу» (`precompute.prefix`): the total is computed once and then a
     * single left-to-right accumulator (October's `loops.accumulator`) answers
     * the question. Still no new technique.
     *
     * The single-pass shape is stated as ADVICE in the prompt and the block is
     * graded on output — option 2 of the authoring contract, argued in the file
     * header. An O(n²) version that re-sums the prefix for every k prints the
     * same numbers on these cases and passes, and the prompt does not pretend
     * otherwise.
     *
     * The degenerate programs, and the case that kills each:
     *   `>` instead of `>=`, missing the
     *   exact-half boundary            → "4\n1 1 1 1" expects 2, it prints 3.
     *   `k = i`, off by one            → "5\n10 1 1 1 1" expects 1, it prints 0.
     *   comparing the running sum with
     *   itself (total not precomputed) → always 1; "4\n1 1 1 1" expects 2.
     *   a loop that stops before the
     *   last day                       → "5\n1 1 1 1 10" expects 5, it prints 0.
     * Support meets the same problem at m9.l1.b8s.
     */
    id: "m9.l1.b8",
    type: "write_code",
    skillRefs: ["contest.time_split", "precompute.prefix", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n күн саны, екінші жолда сол n күнде жиналған ұпай беріледі (әр ұпай 0-ден кем емес). Алғашқы k күннің қосындысы бүкіл n күннің қосындысының кемінде жартысына жететін ең кіші k санын шығар. Мысалы `1 2 3 4 5` үшін жалпы қосынды 15: алғашқы 3 күнде небәрі 6 жиналады, ал алғашқы 4 күнде 10 — бұл жартысынан көп, сондықтан жауап 4. Кеңес: жалпы қосындыны алдымен бір рет есептеп ал, содан кейін тізімді басынан бір-ақ рет жүріп өт. Бұл — кеңес, талап емес: тапсырма шыққан жауап бойынша тексеріледі.",
      ru: "В первой строке дано число дней n, во второй — очки за эти n дней (каждое не меньше 0). Выведи наименьшее k, при котором сумма первых k дней составляет не меньше половины суммы всех n дней. Например, для `1 2 3 4 5` общая сумма равна 15: за первые 3 дня набирается всего 6, а за первые 4 дня — 10, это больше половины, поэтому ответ 4. Совет: сначала посчитай общую сумму один раз, а потом пройди список слева направо ровно один раз. Это совет, а не требование: задание проверяется по выведенному ответу.",
    },
    referenceSolution:
      "n = int(input())\na = list(map(int, input().split()))\ntotal = 0\nfor i in range(n):\n    total = total + a[i]\nrun = 0\nk = 0\nfor i in range(n):\n    run = run + a[i]\n    if 2 * run >= total:\n        k = i + 1\n        break\nprint(k)",
    cases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "4" },
      { input: "1\n5", expectedOutput: "1" },
      { input: "4\n1 1 1 1", expectedOutput: "2", hidden: true },
      { input: "5\n10 1 1 1 1", expectedOutput: "1", hidden: true },
      { input: "5\n1 1 1 1 10", expectedOutput: "5", hidden: true },
      { input: "6\n2 2 2 2 2 2", expectedOutput: "3", hidden: true },
      { input: "3\n0 0 7", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The support twin of m9.l1.b8 — «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6). Same problem, same example, same
     * boundary; the scaffold hands over the two lines where the problem actually
     * lives and nothing else.
     *
     * The two blanks are the two decisions, and neither survives the other's
     * answer: `>=` is the exact-half boundary («кемінде жартысы» includes the
     * half), and `i + 1` is the step from a zero-based position to a count of
     * days. A support learner never sees m9.l1.b8 — the tracks arrays put them
     * on different routes — so the filled template is a reconstruction, not a
     * transcription of anything on their screen.
     *
     * The prompt restates the whole problem rather than pointing at "the task
     * above": on the support route there is no task above with these numbers.
     */
    id: "m9.l1.b8s",
    type: "fill_blank",
    skillRefs: ["contest.time_split", "precompute.prefix", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n күн саны, екінші жолда сол күндердегі ұпай беріледі. Бағдарлама алғашқы k күннің қосындысы бүкіл қосындының кемінде жартысына жететін ең кіші k-ны шығаруы керек: `1 2 3 4 5` үшін жауап 4. Екі орын бос. Біріншісіне салыстыру белгісі керек — «кемінде жартысы» дегенге дәл жартысы да кіретінін ұмытпа. Екіншісінде `i` — тізімдегі орын, ол 0-ден басталады, ал жауап күн саны болуы тиіс.",
      ru: "В первой строке дано число дней n, во второй — очки за эти дни. Программа должна вывести наименьшее k, при котором сумма первых k дней составляет не меньше половины всей суммы: для `1 2 3 4 5` ответ 4. Пропущены два места. В первом нужен знак сравнения — не забудь, что «не меньше половины» включает и ровно половину. Во втором `i` — это позиция в списке, она начинается с 0, а ответом должно быть количество дней.",
    },
    template:
      "n = int(input())\na = list(map(int, input().split()))\ntotal = 0\nfor i in range(n):\n    total = total + a[i]\nrun = 0\nk = 0\nfor i in range(n):\n    run = run + a[i]\n    if 2 * run ___ total:\n        k = i ___ 1\n        break\nprint(k)",
    blanks: [
      { id: "f1", answer: ">=" },
      { id: "f2", answer: "+" },
    ],
  },
];
