import type { LessonBlock } from "../../types";

/**
 * Lesson m9.l4 · «Шешімді қорғау» / «Защита решения» — 10 minutes.
 * PDF p.10, May. Skill: `contest.defend`. The last teaching lesson of the year.
 *
 * Four clauses drive every block below.
 *
 *   «бес бейтаныс есептен тұратын қорытынды турнир және екі шешімді ауызша
 *   қорғау» (p.10, practice) — the tournament's second half is an oral defence
 *   of two solutions, so this lesson exists to say what a defence CONTAINS
 *   before a fourteen-year-old is asked to give one in front of a teacher.
 *
 *   «Шешімінің неге дұрыс екенін ауызша дәлелдейді» (p.2, year-end outcome 9) —
 *   the outcome this lesson closes. Note the verb: дәлелдейді, proves. Not
 *   «шешеді», not «көрсетеді». A defence is an argument, and the whole content
 *   of `b1` is the claim that an argument has parts you can count.
 *
 *   «Бірі болмаса, екіншісі жеке есепке алынбайды» (p.10, «Айлық сынақ») —
 *   solving without defending does not count. That grading rule is what makes
 *   this a lesson and not an afterword, and it is why `b6` (write the program)
 *   and `b7` (defend it out loud) are deliberately the same problem on two
 *   consecutive cards: the tournament will pair them the same way.
 *
 *   «Бұл айда жаңа тақырып жоқ» (p.10) — every program on these cards belongs
 *   to a month the learner has already finished, and each block's comment names
 *   which month and which technique. `b2` is January's binary search, `b3` is
 *   January's two pointers over October's string, `b4` is December's prefix
 *   table, `b5` is April's greedy, `b6` is February's exhaustive search written
 *   with October's nested loop. Nothing new is introduced anywhere, including in
 *   the prose: no construct appears here that some earlier month did not name.
 *
 * ## Why the subject needs four defences on screen and only one program written
 *
 * A defence is prose, so most of this lesson is prose — but prose the learner
 * PRODUCES, not prose they read. Exactly one card (`b2`) hands over a finished
 * defence; after that the learner writes one (`b4`), picks the complete one out
 * of four (`b3`), breaks one that sounds right (`b5`), and says one out loud
 * (`b7`). `b3` and `b5` are the two blocks where the object under inspection is
 * an ARGUMENT rather than a program, which is the skill `contest.defend`
 * actually names and the one nothing else in the year measures.
 *
 * ## The structural requirement, and which of the three honest options this took
 *
 * `b6` wants a solution the learner can defend in five parts. "Must be
 * defensible" is not something output comparison can see — a copied program
 * passes every case and defends nothing. So this lesson takes **option 3 of the
 * authoring contract: send it to a human.** `b6` states no structural rule at
 * all and is graded purely on the numbers it prints; `b7` is the paired
 * `verify(oral_explanation)` whose `expectedPoints` a teacher reads, and which
 * asks for exactly the five parts. Option 1 was unavailable (no output
 * distinguishes an understood program from a transcribed one) and option 2
 * would have meant writing "try to be able to explain it" into a prompt, which
 * is advice nobody acts on. The two blocks are adjacent so the pairing is
 * visible to the learner, and the month's own grading rule says out loud that
 * neither counts alone.
 *
 * ## Where a diagnostic mapping is present and where it is deliberately absent
 *
 * `b3` maps two of its three distractors, and only those two, because both
 * contain an explicit false INFERENCE in their own wording — "I tested three
 * examples, so it is right on the edges too" and "thirteen lines, so it runs
 * fast" —
 * and the justification argues from that sentence rather than from the
 * omission. The third distractor's substitute sentence is true and merely
 * irrelevant, so choosing it has two honest readings and it carries nothing.
 * Every other block here is written or spoken work: it settles as `unknown` and
 * a teacher reads it, which is what the contract requires and what a defence is
 * for in the first place.
 *
 * ## Track routing
 *
 * `b5` is the advanced-only written defence the programme makes compulsory for
 * that route (p.6, «шешімді жазбаша қорғау міндетті»). `b6`/`b6s` are the same
 * problem on two routes; `b6s` restates the whole statement rather than
 * pointing at a card above, because on the support route there is no card above
 * with these numbers. `b7` names the problem («жұптарды санайтын шешіміңді»)
 * instead of "the program you just wrote", so it reads correctly for a support
 * learner who completed a template and for a core learner who wrote from blank.
 */

const P = 10; // PDF page for all of May

export const M9_L4: LessonBlock[] = [
  {
    id: "m9.l4.b1",
    type: "concept",
    skillRefs: ["contest.defend"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Қорғаудың бес бөлігі",
      ru: "Пять частей защиты",
    },
    /* The checklist itself is product work; what the PDF names is that a
       solution must be defended and that the year's error journal becomes a
       pre-submit checklist. Parts 3, 4 and 5 are the three the rest of the
       lesson charges against, so each of them carries something countable — a
       named edge, a number of steps, a changed constraint. «Дұрыс екеніне
       сенімдімін» is not part of anything. */
    body: {
      kk: "Шешімді қорғау — «менде дұрыс шықты» деу емес. Ол — бағдарламаның неге дұрыс жауап беретінін өзің дәлелдеп беру. Қорғаудың бес бөлігі бар, реті осындай.\n\n1-бөлік. Бағдарлама не істейді — бір сөйлеммен. Мысалы: тізімді басынан аяғына дейін бір рет аралаймын да, шартқа сай элементтерді санаймын.\n\n2-бөлік. Неге дәл осы қойылған сұраққа жауап береді. Мұнда есеп шартындағы сөзді өз әрекетіңмен байланыстырасың: «нешеу» деп сұралған — демек санағыш дәл сол шарт орындалғанда ғана өседі.\n\n3-бөлік. Шеттерде неге дұрыс. Ең кіші енгізу (бір элемент, бір таңбалы сөз, нөл), шекарадағы дәл мән (шартта «қатаң үлкен» бе, әлде «кем емес» бе), барлық элементі бірдей жағдай. Осы үшеуін атап өт.\n\n4-бөлік. Неге уақытқа үлгереді — қадаммен. «Тез» деген сөз жеткіліксіз, сан керек: n қадам, n // 2 салыстыру, 18 қадамнан аспайтын екіге бөлу. n ең үлкен мәнінде қанша қадам болатынын айт.\n\n5-бөлік. Шарт өзгерсе не бұзылады. n 1000-ның орнына 200 000 болса; «қатаң үлкен» «кем емес» болса; тізім реттелмеген болып шықса. Ең әуелі қай жол бұзылады?\n\nҮш нәрсе қорғау емес: «мен үш мысалда тексердім», «код қысқа», «өткен жолы да осылай қабылданған». Тексеру — қатені табудың құралы, дұрыстықтың дәлелі емес: мысал қатенің бар екенін көрсете алады, жоқ екенін көрсете алмайды.\n\nЖыл бойы жинаған қателер журналың осы жерде керек болады. Ондағы әр жазба — 3-бөлікте тексеруге тұрарлық бір шет.",
      ru: "Защита решения — это не «у меня всё сошлось». Это твоё собственное доказательство того, почему программа отвечает верно. У защиты пять частей, и порядок такой.\n\nЧасть 1. Что делает программа — одним предложением. Например: прохожу по списку от начала до конца ровно один раз и считаю элементы, подходящие под условие.\n\nЧасть 2. Почему это отвечает именно на заданный вопрос. Здесь ты связываешь слова условия со своими действиями: спрашивают «сколько» — значит, счётчик растёт ровно тогда, когда условие выполнено.\n\nЧасть 3. Почему верно на краях. Самый маленький ввод (один элемент, слово из одной буквы, ноль), точное значение на границе (в условии «строго больше» или «не меньше»?), случай, когда все элементы равны. Назови все три.\n\nЧасть 4. Почему укладывается по времени — в шагах. Слова «быстро» мало, нужно число: n шагов, n // 2 сравнений, не больше 18 делений пополам. Скажи, сколько шагов получится при самом большом n.\n\nЧасть 5. Что сломается, если изменить условие. Если n станет 200 000 вместо 1000; если «строго больше» станет «не меньше»; если список окажется неотсортированным. Какая строка сломается первой?\n\nТри вещи, которые защитой не являются: «я проверил на трёх примерах», «код короткий», «в прошлый раз так приняли». Тесты — инструмент поиска ошибок, а не доказательство правильности: пример может показать, что ошибка есть, но не может показать, что её нет.\n\nЗдесь пригодится накопленный за год журнал ошибок. Каждая запись в нём — это ещё один край, который стоит проверить в части 3.",
    },
  },
  {
    /*
     * A defence carried out in full, on ЯНВАРЬ — binary search (`bsearch.core`,
     * `bsearch.boundary`, m5). The month is chosen on purpose: it is the one
     * technique of the year where part 4 has a real number to say (18 steps
     * against 200 000) and where part 5 has a real answer (unsorted input kills
     * the argument in part 2, not the code). A defence of a single loop would
     * make both parts sound like a formality.
     *
     * The five steps are the five parts, in order and labelled, so a learner
     * can hold this card next to b1 and see the checklist filled in. That is
     * what «толық талданған мысал» means here — the reasoning, not the answer.
     *
     * The program appears nowhere else in the month and is nobody's expected
     * answer: no block in this lesson asks for a binary search.
     */
    id: "m9.l4.b2",
    type: "worked_example",
    skillRefs: ["contest.defend", "bsearch.core", "bsearch.boundary"],
    sourceType: "product-authored",
    title: {
      kk: "Толық қорғау: реттелген тізімдегі санау",
      ru: "Полная защита: подсчёт в отсортированном списке",
    },
    problem: {
      kk: "Қаңтарда шығарылған есеп. Бірінші жолда n саны, екінші жолда өспелі ретпен реттелген n бүтін сан, үшінші жолда x саны беріледі. Тізімде x-тен аспайтын (яғни x-ке тең немесе одан кіші) элементтер нешеу екенін шығару керек. n 200 000-ға дейін жетеді. Мысал: `1 3 3 5 8` және x = 3 болғанда жауап 3.",
      ru: "Задача, решённая в январе. В первой строке дано n, во второй — n целых чисел, отсортированных по неубыванию, в третьей — число x. Нужно вывести, сколько элементов не превосходят x (то есть равны x или меньше). n доходит до 200 000. Пример: для `1 3 3 5 8` и x = 3 ответ 3.",
    },
    steps: [
      {
        kk: "1-бөлік. Не істейді. Бағдарлама lo мен hi аралығын ұстап отырады, ал ізделіп отырған орын әрқашан осы аралықтың ішінде. Әр қадамда ортадағы элементті қарап, аралықты екі есе қысқартады. lo мен hi түйіскенде іздеу бітті.",
        ru: "Часть 1. Что делает. Программа держит промежуток от lo до hi, и искомая позиция всегда внутри него. На каждом шаге она смотрит на средний элемент и укорачивает промежуток вдвое. Когда lo и hi сходятся, поиск закончен.",
      },
      {
        kk: "2-бөлік. Неге дәл осы сұраққа жауап береді. Тізім өспелі ретпен реттелген, сондықтан x-тен аспайтын элементтердің бәрі басында тұр, ал x-тен үлкендері — соңында. Демек x-тен үлкен БІРІНШІ элементтің индексі x-тен аспайтын элементтердің санына тең: индекс те нөлден саналады, сан да нөлден басталады. Бағдарлама дәл сол индексті іздейді, сол себепті lo-ны басып шығарады.",
        ru: "Часть 2. Почему это отвечает на заданный вопрос. Список отсортирован по неубыванию, поэтому все элементы, не превосходящие x, стоят в начале, а те, что больше x, — в конце. Значит, индекс ПЕРВОГО элемента, большего x, равен количеству элементов, не превосходящих x: индексы считаются с нуля, и счёт тоже начинается с нуля. Именно этот индекс программа и ищет, поэтому печатает lo.",
      },
      {
        kk: "3-бөлік. Шеттерде неге дұрыс. x бәрінен кіші болса, `a[mid] <= x` ешқашан орындалмайды, hi нөлге дейін түседі де, жауап 0 болады. x бәрінен үлкен болса, керісінше, lo n-ге дейін өседі, жауап n. x тізімде бірнеше рет кездессе, `<=` белгісі lo-ны сол қайталанулардың бәрінен өткізеді, сондықтан қайталанулардың бәрі есепке кіреді. n = 1 болғанда цикл бір-ақ рет айналады.",
        ru: "Часть 3. Почему верно на краях. Если x меньше всех, `a[mid] <= x` не выполнится ни разу, hi опустится до нуля и ответ будет 0. Если x больше всех — наоборот, lo дорастёт до n и ответ будет n. Если x встречается в списке несколько раз, знак `<=` проводит lo мимо всех повторов, поэтому в счёт попадают все повторы. При n = 1 цикл выполняется ровно один раз.",
      },
      {
        kk: "4-бөлік. Неге уақытқа үлгереді. Әр қадамда аралықтың ұзындығы кемінде екі есе кемиді: 200 000, 100 000, 50 000, 25 000, … — он сегіз қадамнан кейін аралықта бір ғана орын қалады. Яғни ең үлкен n үшін 18 салыстыру. Тізімді толық аралап санасақ, сол n үшін 200 000 салыстыру болар еді.",
        ru: "Часть 4. Почему укладывается по времени. На каждом шаге длина промежутка уменьшается минимум вдвое: 200 000, 100 000, 50 000, 25 000, … — через восемнадцать шагов в промежутке остаётся одна позиция. То есть при самом большом n это 18 сравнений. Если же просто пройти список целиком, для того же n получится 200 000 сравнений.",
      },
      {
        kk: "5-бөлік. Шарт өзгерсе не бұзылады. Тізім реттелмеген болса, 2-бөліктегі дәлел түгел құлайды: кішілері басында тұрады деу енді дұрыс емес, сондықтан екіге бөлу мүлде жарамайды — бір рет толық аралап санауға тура келеді. Сұрақ «x-тен қатаң кіші» болып өзгерсе, `a[mid] <= x` жолындағы белгі `<` болуы тиіс, басқа ештеңе өзгермейді. Ал x тізімде мүлде жоқ болса, ештеңе бұзылмайды: бағдарлама x-тің бар-жоғын емес, шекараны іздейді.",
        ru: "Часть 5. Что сломается при изменении условия. Если список не отсортирован, рушится вся часть 2: утверждение «меньшие стоят в начале» перестаёт быть верным, и деление пополам не годится вовсе — придётся считать одним полным проходом. Если вопрос сменится на «строго меньше x», знак в строке `a[mid] <= x` должен стать `<`, и больше ничего. А если x в списке вообще нет, не ломается ничего: программа ищет не сам x, а границу.",
      },
    ],
    code:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "lo = 0\n" +
      "hi = n\n" +
      "while lo < hi:\n" +
      "    mid = (lo + hi) // 2\n" +
      "    if a[mid] <= x:\n" +
      "        lo = mid + 1\n" +
      "    else:\n" +
      "        hi = mid\n" +
      "print(lo)",
    stdin: "5\n1 3 3 5 8\n3",
    result: {
      kk: "Бағдарлама 3 шығарады — бұл 1, 3 және 3 элементтері. lo мен hi 0 мен 5-тен басталып, үш қадамнан кейін екеуі де 3-ке келеді.",
      ru: "Программа выводит 3 — это элементы 1, 3 и 3. lo и hi начинают с 0 и 5 и через три шага оба приходят к 3.",
    },
  },
  {
    /*
     * ЯНВАРЬ over ОКТЯБРЬ — two indices walking towards each other
     * (`twopointers.core`, m5) across a string read by index
     * (`strings.sequence`, m2). October's own palindrome is written as a loop
     * over the first half; this one is the January shape, and it is chosen for
     * that reason: `m2.l6.b5` already puts the half-loop version on screen,
     * character for character, and a card that reprinted it would be showing a
     * fourteen-year-old a program they repaired in the autumn. The program is
     * on screen because the task is about the DEFENCE, not about the code —
     * hiding it would turn a reading task into a memory task.
     *
     * Each distractor drops exactly one of the five parts and puts a
     * plausible-sounding sentence in its place, so the four options are within a
     * line of each other in length. Without the substitutes the complete
     * defence would simply be the longest option and the card would be solvable
     * by counting characters — which is the same defect as an answer already on
     * screen, only cheaper to fall for.
     *
     *   o1 — no part 3, "tested three examples, so the edges are fine too"
     *   o2 — complete (correct)
     *   o3 — no part 5, "reads the input only once and uses no extra memory"
     *   o4 — no part 4, "thirteen lines and easy to read, so it runs fast"
     *
     * o3 is the one without a mapping, deliberately. Its substitute sentence is
     * TRUE — the program really does read the input once — so a learner picks
     * it either because they think that sentence is the "what changes" part or
     * because they read past the omission. Two causes, so the engine asks. o1
     * and o4 each state an inference in so many words, and the justification
     * argues against that sentence rather than against the omission.
     */
    id: "m9.l4.b3",
    type: "multiple_choice",
    skillRefs: ["contest.defend", "twopointers.core", "strings.sequence", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Төмендегі бағдарлама сөздің палиндром екенін тексереді: палиндром болса `yes`, болмаса `no` сөзін шығарады. Осы бір шешімді төрт оқушы төрт түрлі қорғады. Қорғау толық болу үшін бес бөліктің бесеуі де болуы керек еді: не істейді, неге қойылған сұраққа жауап береді, шеттерде неге дұрыс, неге уақытқа үлгереді, шарт өзгерсе не бұзылады. Қайсысы толық?",
      ru: "Программа ниже проверяет, является ли слово палиндромом: печатает `yes`, если да, и `no`, если нет. Одно и то же решение четверо учеников защитили по-разному. Чтобы защита была полной, в ней должны быть все пять частей: что делает, почему отвечает на заданный вопрос, почему верно на краях, почему укладывается по времени, что сломается при изменении условия. Какая из защит полная?",
    },
    code:
      "s = input()\n" +
      "lo = 0\n" +
      "hi = len(s) - 1\n" +
      "ok = 1\n" +
      "while lo < hi:\n" +
      "    if s[lo] != s[hi]:\n" +
      "        ok = 0\n" +
      "    lo = lo + 1\n" +
      "    hi = hi - 1\n" +
      "if ok == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    options: [
      {
        id: "o1",
        label: {
          kk: "(1) Бағдарлама сөздің екі шетінен бір-біріне қарай жылжитын lo мен hi орындарын ұстайды және әр қадамда s[lo] мен s[hi] таңбаларын салыстырады; бір жұп сәйкес келмесе, `ok` нөлге айналады. (2) Бұл қойылған сұраққа жауап береді, өйткені сөз палиндром болу үшін екі шеттен бірдей қашықтықта тұрған таңбалардың тең болуы қажет әрі жеткілікті, ал цикл дәл сол жұптарды түгел қарап шығады. (3) Мен оны үш мысалда тексердім — `aba`, `abba`, `abc` — үшеуінде де жауап дұрыс болды, сондықтан шеткі жағдайларда да дұрыс. (4) Уақыт бойынша: цикл сөз ұзындығының жартысындай айналады — 100 000 таңбалы сөз үшін 50 000 қадам. (5) Шарт өзгерсе: бас әріп пен кіші әріптің айырмасы ескерілмейтін болса, бұл салыстыру бұзылады — `Aba` адам үшін палиндром, ал `A` мен `a` тең емес.",
          ru: "(1) Программа держит две позиции, lo и hi, которые идут с двух концов слова навстречу друг другу, и на каждом шаге сравнивает символы s[lo] и s[hi]; если хоть одна пара не совпала, `ok` становится нулём. (2) Это отвечает на заданный вопрос, потому что для палиндрома равенство символов, стоящих на одинаковом расстоянии от двух концов, необходимо и достаточно, а цикл перебирает ровно эти пары. (3) Я проверил её на трёх примерах — `aba`, `abba`, `abc` — все три раза ответ был верным, значит, на краях она тоже верна. (4) По времени: цикл выполняется примерно половину длины слова — для слова из 100 000 символов это 50 000 шагов. (5) При изменении условия: если перестать различать заглавные и строчные буквы, сравнение сломается — `Aba` для человека палиндром, а `A` и `a` не равны.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "(1) Бағдарлама сөздің екі шетінен бір-біріне қарай жылжитын lo мен hi орындарын ұстайды және әр қадамда s[lo] мен s[hi] таңбаларын салыстырады; бір жұп сәйкес келмесе, `ok` нөлге айналады. (2) Бұл қойылған сұраққа жауап береді, өйткені сөз палиндром болу үшін екі шеттен бірдей қашықтықта тұрған таңбалардың тең болуы қажет әрі жеткілікті, ал цикл дәл сол жұптарды түгел қарап шығады. (3) Шеттерде дұрыс: ұзындығы 1 болса, lo мен hi бірден теңеседі де, цикл бірде-бір рет айналмайды, `yes` шығады; ұзындығы жұп болса, екеуі бір-бірінен аттап өтеді және жұптардың бәрі тексеріледі; тақ ұзындықта екеуі ортаңғы таңбада кездеседі, ал оның жұбы жоқ, салыстырудың қажеті де жоқ. (4) Уақыт бойынша: цикл сөз ұзындығының жартысындай айналады — 100 000 таңбалы сөз үшін 50 000 қадам. (5) Шарт өзгерсе: бас әріп пен кіші әріптің айырмасы ескерілмейтін болса, бұл салыстыру бұзылады — `Aba` адам үшін палиндром, ал `A` мен `a` тең емес.",
          ru: "(1) Программа держит две позиции, lo и hi, которые идут с двух концов слова навстречу друг другу, и на каждом шаге сравнивает символы s[lo] и s[hi]; если хоть одна пара не совпала, `ok` становится нулём. (2) Это отвечает на заданный вопрос, потому что для палиндрома равенство символов, стоящих на одинаковом расстоянии от двух концов, необходимо и достаточно, а цикл перебирает ровно эти пары. (3) На краях верно: при длине 1 lo и hi сразу равны и цикл не выполняется ни разу, печатается `yes`; при чётной длине они в какой-то момент проходят мимо друг друга, и к этому моменту проверены все пары; при нечётной длине они встречаются на среднем символе, а у него пары нет и сравнивать его не с чем. (4) По времени: цикл выполняется примерно половину длины слова — для слова из 100 000 символов это 50 000 шагов. (5) При изменении условия: если перестать различать заглавные и строчные буквы, сравнение сломается — `Aba` для человека палиндром, а `A` и `a` не равны.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "(1) Бағдарлама сөздің екі шетінен бір-біріне қарай жылжитын lo мен hi орындарын ұстайды және әр қадамда s[lo] мен s[hi] таңбаларын салыстырады; бір жұп сәйкес келмесе, `ok` нөлге айналады. (2) Бұл қойылған сұраққа жауап береді, өйткені сөз палиндром болу үшін екі шеттен бірдей қашықтықта тұрған таңбалардың тең болуы қажет әрі жеткілікті, ал цикл дәл сол жұптарды түгел қарап шығады. (3) Шеттерде дұрыс: ұзындығы 1 болса, lo мен hi бірден теңеседі де, цикл бірде-бір рет айналмайды, `yes` шығады; ұзындығы жұп болса, екеуі бір-бірінен аттап өтеді және жұптардың бәрі тексеріледі; тақ ұзындықта екеуі ортаңғы таңбада кездеседі, ал оның жұбы жоқ, салыстырудың қажеті де жоқ. (4) Уақыт бойынша: цикл сөз ұзындығының жартысындай айналады — 100 000 таңбалы сөз үшін 50 000 қадам. (5) Бағдарлама енгізуді бір-ақ рет оқиды және артық жад жұмсамайды: сөзді бір айнымалыда ұстайды, көшірме жасамайды.",
          ru: "(1) Программа держит две позиции, lo и hi, которые идут с двух концов слова навстречу друг другу, и на каждом шаге сравнивает символы s[lo] и s[hi]; если хоть одна пара не совпала, `ok` становится нулём. (2) Это отвечает на заданный вопрос, потому что для палиндрома равенство символов, стоящих на одинаковом расстоянии от двух концов, необходимо и достаточно, а цикл перебирает ровно эти пары. (3) На краях верно: при длине 1 lo и hi сразу равны и цикл не выполняется ни разу, печатается `yes`; при чётной длине они в какой-то момент проходят мимо друг друга, и к этому моменту проверены все пары; при нечётной длине они встречаются на среднем символе, а у него пары нет и сравнивать его не с чем. (4) По времени: цикл выполняется примерно половину длины слова — для слова из 100 000 символов это 50 000 шагов. (5) Программа читает ввод ровно один раз и не тратит лишней памяти: слово лежит в одной переменной, копия не создаётся.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "(1) Бағдарлама сөздің екі шетінен бір-біріне қарай жылжитын lo мен hi орындарын ұстайды және әр қадамда s[lo] мен s[hi] таңбаларын салыстырады; бір жұп сәйкес келмесе, `ok` нөлге айналады. (2) Бұл қойылған сұраққа жауап береді, өйткені сөз палиндром болу үшін екі шеттен бірдей қашықтықта тұрған таңбалардың тең болуы қажет әрі жеткілікті, ал цикл дәл сол жұптарды түгел қарап шығады. (3) Шеттерде дұрыс: ұзындығы 1 болса, lo мен hi бірден теңеседі де, цикл бірде-бір рет айналмайды, `yes` шығады; ұзындығы жұп болса, екеуі бір-бірінен аттап өтеді және жұптардың бәрі тексеріледі; тақ ұзындықта екеуі ортаңғы таңбада кездеседі, ал оның жұбы жоқ, салыстырудың қажеті де жоқ. (4) Код небәрі он үш жол және оқуға оңай, ішінде артық ештеңе жоқ, сондықтан ол тез жұмыс істейді. (5) Шарт өзгерсе: бас әріп пен кіші әріптің айырмасы ескерілмейтін болса, бұл салыстыру бұзылады — `Aba` адам үшін палиндром, ал `A` мен `a` тең емес.",
          ru: "(1) Программа держит две позиции, lo и hi, которые идут с двух концов слова навстречу друг другу, и на каждом шаге сравнивает символы s[lo] и s[hi]; если хоть одна пара не совпала, `ok` становится нулём. (2) Это отвечает на заданный вопрос, потому что для палиндрома равенство символов, стоящих на одинаковом расстоянии от двух концов, необходимо и достаточно, а цикл перебирает ровно эти пары. (3) На краях верно: при длине 1 lo и hi сразу равны и цикл не выполняется ни разу, печатается `yes`; при чётной длине они в какой-то момент проходят мимо друг друга, и к этому моменту проверены все пары; при нечётной длине они встречаются на среднем символе, а у него пары нет и сравнивать его не с чем. (4) В коде всего тринадцать строк, он легко читается и ничего лишнего в нём нет, поэтому он работает быстро. (5) При изменении условия: если перестать различать заглавные и строчные буквы, сравнение сломается — `Aba` для человека палиндром, а `A` и `a` не равны.",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "testing_taken_as_proof",
        justification:
          "Бұл нұсқа шеттерді талдаудың орнына «үш мысалда тексердім, сондықтан шеттерде де дұрыс» деген қорытындыны қояды, яғни тексеруді дәлел ретінде қабылдайды. Мысал қатенің бар екенін көрсете алады, бірақ жоқ екенін дәлелдей алмайды: тексерілмеген ұзындық әрқашан қалады, ал дәл сол ұзындық — 1 — мұнда тексерілмеген.",
      },
      o4: {
        failureClass: "code_length_taken_as_speed",
        justification:
          "Бұл нұсқаның өз сөйлемі жылдамдықты қадам санымен емес, жолдардың санымен өлшейді: «он үш жол, сондықтан тез». Бір ғана жолда тұрған цикл миллион қадам жасай алады, сондықтан кодтың ұзындығы мен жұмыс уақытының арасында байланыс жоқ.",
      },
    },
  },
  {
    /*
     * The lesson objective, written out, on ДЕКАБРЬ — the prefix table
     * (`precompute.prefix`, m4). All three routes get it: «шешімді жазбаша
     * қорғау» is compulsory only for advanced, but writing one at least once is
     * how everybody prepares for b7.
     *
     * The program is stated in the prompt rather than asked for: no block in
     * this month asks a learner to write a prefix table, and the three lines
     * that build it are December's own, so nothing here is an answer to
     * anything. It is the December problem where all five parts have a real
     * answer, and part 5 in particular — an element changing between queries
     * makes the table stale — is the argument that separates precomputation
     * from a loop.
     *
     * Five expectedPoints, one per part, in the order b1 states them, so a
     * teacher marks against the same checklist the learner was given.
     */
    id: "m9.l4.b4",
    type: "explain",
    skillRefs: ["contest.defend", "precompute.prefix"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Желтоқсанда шығарылған есеп. Бірінші жолда n мен q сандары, екінші жолда n бүтін сан, содан кейін q жол, әрқайсысында l мен r (1 ≤ l ≤ r ≤ n). Әр сұрау үшін l-ден r-ге дейінгі элементтердің қосындысын шығару керек. n мен q екеуі де 200 000-ға дейін жетеді.\n\nШешім:\n\nn, q = map(int, input().split())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nfor t in range(q):\n    l, r = map(int, input().split())\n    print(p[r] - p[l - 1])\n\nОсы шешімді қорға. Бес бөліктің бесеуін де жаз: (1) бағдарлама не істейді, (2) неге дәл осы сұраққа жауап береді, (3) шеттерде неге дұрыс, (4) неге уақытқа үлгереді — қадам санын атап, (5) шарт өзгерсе не бұзылады. Жауабыңды мұғалім оқиды.",
      ru: "Задача, решённая в декабре. В первой строке даны n и q, во второй — n целых чисел, затем q строк, в каждой l и r (1 ≤ l ≤ r ≤ n). Для каждого запроса нужно вывести сумму элементов с l-го по r-й. И n, и q доходят до 200 000.\n\nРешение:\n\nn, q = map(int, input().split())\na = list(map(int, input().split()))\np = [0] * (n + 1)\nfor i in range(1, n + 1):\n    p[i] = p[i - 1] + a[i - 1]\nfor t in range(q):\n    l, r = map(int, input().split())\n    print(p[r] - p[l - 1])\n\nЗащити это решение. Напиши все пять частей: (1) что делает программа, (2) почему это отвечает именно на заданный вопрос, (3) почему верно на краях, (4) почему укладывается по времени — с числом шагов, (5) что сломается при изменении условия. Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "1-бөлік: бағдарлама алдымен p кестесін толтырады, мұндағы p[i] — алғашқы i элементтің қосындысы, ал p[0] = 0. Содан кейін әр сұрауға p[r] − p[l−1] айырмасымен жауап береді. Бір сөйлемге сыятындай қысқа айтылған.",
        ru: "Часть 1: программа сначала заполняет таблицу p, где p[i] — сумма первых i элементов, а p[0] = 0. Затем на каждый запрос отвечает разностью p[r] − p[l−1]. Сказано коротко, в одно предложение.",
      },
      {
        kk: "2-бөлік: l-ден r-ге дейінгі қосынды — алғашқы r элементтің қосындысынан алғашқы l−1 элементтің қосындысын алып тастағанға тең, өйткені екеуінің ортақ басы қысқарады. Сондықтан айырма дәл сұралған кесіндінің қосындысын береді.",
        ru: "Часть 2: сумма с l-го по r-й элемент равна сумме первых r элементов минус сумма первых l−1 элементов, потому что общее начало сокращается. Поэтому разность даёт ровно сумму запрошенного отрезка.",
      },
      {
        kk: "3-бөлік: шеттер аталады. l = 1 болғанда p[0] = 0 қолданылады — кестенің нөлінші орны дәл сол үшін бар, ал кестенің ұзындығы n + 1 болатыны да содан. l = r болғанда бір ғана элемент қалады. r = n болғанда бүкіл тізімнің қосындысы шығады.",
        ru: "Часть 3: названы края. При l = 1 используется p[0] = 0 — нулевая ячейка таблицы существует именно для этого, отсюда же и длина таблицы n + 1. При l = r остаётся ровно один элемент. При r = n получается сумма всего списка.",
      },
      {
        kk: "4-бөлік: уақыт қадаммен айтылады. Кестені құруға n қадам, әр сұрауға бір азайту, барлығы шамамен n + q — ең үлкен мәндерде 400 000 қадам. Ал әр сұрауды бөлек санап шықса, n·q, яғни шамамен 40 миллиард қадам болар еді, бұл үлгермейді.",
        ru: "Часть 4: время названо в шагах. На построение таблицы n шагов, на каждый запрос одно вычитание, всего около n + q — при самых больших значениях это 400 000 шагов. Если же считать каждый запрос отдельным проходом, получится n·q, то есть около 40 миллиардов шагов, и это не уложится.",
      },
      {
        kk: "5-бөлік: өзгерістің салдары аталады. Сұраулардың арасында тізімнің бір элементі өзгеретін болса, дайын кесте ескіріп қалады да, оны қайта құруға тура келеді. Индекстер нөлден басталатын болса, p[r] − p[l−1] орнына p[r+1] − p[l] жазылуы тиіс.",
        ru: "Часть 5: названы последствия изменения. Если между запросами какой-нибудь элемент списка меняется, готовая таблица устаревает и её приходится строить заново. Если индексы начнутся с нуля, вместо p[r] − p[l−1] придётся писать p[r+1] − p[l].",
      },
    ],
  },
  {
    /*
     * The advanced-only written defence the programme makes compulsory (p.6,
     * «шешімді жазбаша қорғау міндетті»), and the one block in the lesson whose
     * object is an ARGUMENT with a hole rather than a program with a bug.
     *
     * СЕНТЯБРЬ… no: АПРЕЛЬ — greedy choice and the search for a counterexample
     * (`greedy.core`, `greedy.counterexample`, m8), and the very family the
     * month's practice paragraph names: «уақыттары қабаттаспайтын сабақтардың
     * максимумын таңдау». April taught the correct rule (order by END time), so
     * the repair is available to the learner and is not a demand for something
     * new.
     *
     * The hole is in part 2 — the JUSTIFICATION — and nowhere else. Parts 1, 3
     * and 4 are all true statements about the program, which is what makes the
     * defence sound solid: the code does exactly what it says, fast, and handles
     * n = 1. It just answers a different question than the one asked. A learner
     * who has spent April breaking greedy rules has the tool; a learner who
     * reads defences as a formality does not.
     *
     * The counterexample is checked by hand: sorted by start, (1,10) is taken
     * first and blocks both (2,3) and (4,5), so the program says 1 where the
     * truth is 2.
     */
    id: "m9.l4.b5",
    type: "explain",
    skillRefs: ["contest.defend", "greedy.core", "greedy.counterexample"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Сәуірде мынандай есеп болды: n сабақтың басталу және аяқталу уақыты берілген, олардың ең көбі нешеуін уақыттары қабаттаспайтындай етіп таңдауға болатынын табу керек. Бір сабақ екіншісі аяқталған сәтте басталса, олар қабаттаспайды деп саналады.\n\nБір оқушы былай шешті: сабақтарды БАСТАЛУ уақыты бойынша реттейді, тізім бойымен жүреді және соңғы алынған сабақтың аяқталуынан ерте басталмайтын әр сабақты алады.\n\nОның қорғауы:\n(1) Бағдарлама сабақтарды басталу уақыты бойынша реттейді, соңғы алынған сабақтың аяқталу уақытын `last` айнымалысында сақтайды және әр сабақты `last`-пен салыстырып, сыйса, алады.\n(2) Бұл дұрыс жауап береді, өйткені ең ерте басталатын бос сабақты алу күннің қалған бөлігін ең көп бос қалдырады.\n(3) Шеттерде дұрыс: n = 1 болса, жалғыз сабақ алынады; барлық сабақ бір-бірімен қабаттасса, жауап 1 болады.\n(4) Уақытқа үлгереді: реттеу, содан кейін тізімді бір рет аралау — n қадам.\n(5) Шарт өзгерсе: уақыттар өте үлкен сандар болса да ештеңе өзгермейді, өйткені тек салыстыру ғана жүреді.\n\nБұл қорғау сенімді естіледі, бірақ бір бөлігі жалған. Қай бөлігі және неге? Бағдарламаның жауабы шын жауаптан аз болатын нақты мысал келтір: сабақтардың уақыттарын жаз, бағдарламаның жауабын және шын жауапты екеуін де ата.",
      ru: "В апреле была такая задача: даны время начала и время конца n занятий, нужно найти, какое наибольшее их количество можно выбрать так, чтобы времена не пересекались. Если одно занятие начинается ровно в тот момент, когда заканчивается другое, они не пересекаются.\n\nОдин ученик решил так: сортирует занятия по времени НАЧАЛА, идёт по списку и берёт каждое занятие, которое начинается не раньше конца последнего взятого.\n\nЕго защита:\n(1) Программа сортирует занятия по времени начала, хранит время конца последнего взятого занятия в переменной `last` и берёт очередное занятие, если оно помещается после `last`.\n(2) Это даёт верный ответ, потому что взять самое рано начинающееся свободное занятие — значит оставить свободной наибольшую часть дня.\n(3) На краях верно: при n = 1 берётся единственное занятие; если все занятия пересекаются друг с другом, ответ равен 1.\n(4) По времени укладывается: сортировка, затем один проход по списку — n шагов.\n(5) При изменении условия: даже если времена станут очень большими числами, ничего не изменится, потому что выполняются только сравнения.\n\nЭта защита звучит убедительно, но одна её часть ложна. Какая и почему? Приведи конкретный пример, на котором ответ программы меньше настоящего: выпиши времена занятий и назови оба числа — ответ программы и верный ответ.",
    },
    expectedPoints: [
      {
        kk: "Жалған бөлік — екіншісі. «Ең ерте басталатын сабақты алу қалғанын ең көп бос қалдырады» деген тұжырым дәлелденбеген әрі дұрыс емес. Қалған бөліктер (1, 3, 4, 5) бағдарлама туралы шындықты айтады, бірақ олар қате ережені құтқармайды.",
        ru: "Ложная часть — вторая. Утверждение «взять самое рано начинающееся занятие — значит оставить свободной наибольшую часть дня» не доказано и неверно. Остальные части (1, 3, 4, 5) говорят о программе правду, но неверное правило они не спасают.",
      },
      {
        kk: "Нақты қарсы мысал сандармен келтірілген. Мысалы, үш сабақ: (1, 10), (2, 3), (4, 5). Бағдарлама басталуы ең ерте (1, 10) сабағын алады, содан кейін қалған екеуі де сыймайды — жауабы 1. Ал шын жауап 2: (2, 3) мен (4, 5) қатар өтеді.",
        ru: "Приведён конкретный контрпример с числами. Например, три занятия: (1, 10), (2, 3), (4, 5). Программа берёт занятие (1, 10), которое начинается раньше всех, после чего оба оставшихся не помещаются — её ответ 1. Верный же ответ 2: (2, 3) и (4, 5) идут одно за другим.",
      },
      {
        kk: "Механизмі түсіндірілген: ереже сабақтың ҰЗАҚТЫҒЫН мүлде қарамайды, тек басталуын қарайды. Сондықтан ерте басталатын бір ұзақ сабақ бірнеше қысқа сабақтың орнын алып қоя алады.",
        ru: "Объяснён механизм: правило вообще не смотрит на ДЛИТЕЛЬНОСТЬ занятия, только на его начало. Поэтому одно длинное занятие с ранним началом может занять место сразу нескольких коротких.",
      },
      {
        kk: "Түзету аталған: реттеу басталу уақыты бойынша емес, АЯҚТАЛУ уақыты бойынша жүруі керек, ал таңдау ережесі сол күйінде қалады — соңғы алынған сабақтың аяғынан ерте басталмайтын әр сабақ алынады. Бұл — сәуірде талданған ереже, жаңа әдіс емес.",
        ru: "Названо исправление: сортировать нужно не по времени начала, а по времени КОНЦА, а само правило выбора остаётся прежним — берётся каждое занятие, начинающееся не раньше конца последнего взятого. Это правило разбиралось в апреле, новым приёмом оно не является.",
      },
      {
        kk: "Тексеру мен дәлелдің айырмасы көрінеді: ереженің бірнеше мысалда дұрыс жұмыс істеуі оны дәлелдемейді, ал бір ғана қарсы мысал оны түгел жоққа шығарады. Дұрыс есептелген уақыт та қате әдісті ақтамайды.",
        ru: "Видна разница между проверкой и доказательством: если правило сработало на нескольких примерах, это его не доказывает, а один-единственный контрпример его полностью опровергает. Верно посчитанное время тоже не оправдывает неверный метод.",
      },
    ],
  },
  {
    /*
     * The lesson's one machine-checked task, and it is deliberately small: the
     * evidence this card produces is about the program, and the evidence about
     * the DEFENCE is produced by b7 on the same problem.
     *
     * ФЕВРАЛЬ — «барлық нұсқаны тексеру», exhaustive search (`enumerate.all`,
     * m6), written with ОКТЯБРЬ's nested loop (`loops.nested`, m2). Nothing
     * newer: the bound n ≤ 1000 is set precisely so that the pair-by-pair walk
     * is the intended method and not a fallback, which is also what makes part 4
     * of the defence a real calculation and part 5 a real threat.
     *
     * NO STRUCTURAL RULE IS STATED. The prompt asks for the number and nothing
     * else; a solution that counts pairs with a helper array of frequencies is
     * just as welcome and just as defensible. See the file header for why this
     * block took option 3 (pair it with a human-read oral block) rather than
     * writing an unenforceable sentence into the prompt.
     *
     * The degenerate programs, and the case that kills each:
     *   inner loop `range(n)` — every pair counted twice and every number
     *     paired with itself → "4 / 2 2 2 2 / 4" expects 6, it prints 16; and
     *     "1 / 5 / 10" expects 0, it prints 1.
     *   inner loop `range(i, n)` — a number paired with itself → "1 / 5 / 10"
     *     expects 0, it prints 1; "3 / 3 1 1 / 6" expects 0, it prints 1.
     *   inner loop `range(i + 1, n - 1)` — the last element never paired →
     *     "3 / 1 2 5 / 7" expects 1, it prints 0; "5 / 1 1 1 1 6 / 7" expects 4,
     *     it prints 0. This is «соңғы элементті өткізіп жіберу», the error
     *     October names by hand.
     *   outer loop `range(1, n)` — the first element never paired →
     *     "5 / 7 1 1 1 1 / 8" expects 4, it prints 0.
     *   counting NUMBERS instead of pairs (one tick per element whose partner
     *     exists) → "4 / 2 2 2 2 / 4" expects 6, it prints 4.
     */
    id: "m9.l4.b6",
    type: "write_code",
    skillRefs: ["contest.defend", "enumerate.all", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 1000), екінші жолда бос орынмен бөлінген n бүтін сан (әрқайсысы 1-ден 1000-ға дейін), үшінші жолда k саны беріледі. Қосындысы дәл k-ға тең (i, j) орын жұптарының санын шығар, мұндағы i < j. Сан өзімен жұп құрамайды, ал бір жұп екі рет саналмайды. Мысалы n = 4, тізім `1 3 3 5` және k = 6 болғанда жауап 2: бұл 1 + 5 және 3 + 3.",
      ru: "В первой строке дано n (1 ≤ n ≤ 1000), во второй — n целых чисел через пробел (каждое от 1 до 1000), в третьей — число k. Выведи количество пар позиций (i, j) с i < j, сумма которых равна ровно k. Число не образует пару само с собой, и одна и та же пара не считается дважды. Например, при n = 4, списке `1 3 3 5` и k = 6 ответ 2: это 1 + 5 и 3 + 3.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "k = int(input())\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        if a[i] + a[j] == k:\n" +
      "            count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "4\n1 3 3 5\n6", expectedOutput: "2" },
      { input: "3\n1 2 4\n10", expectedOutput: "0" },
      /* One number: there is no pair at all, so a program that pairs a number
         with itself dies here and nowhere else. */
      { input: "1\n5\n10", expectedOutput: "0", hidden: true },
      /* 3 + 3 would make k, but there is only one 3. */
      { input: "3\n3 1 1\n6", expectedOutput: "0", hidden: true },
      /* The only pair uses the last element. */
      { input: "3\n1 2 5\n7", expectedOutput: "1", hidden: true },
      /* Every pair qualifies: six of them, not twelve and not four. */
      { input: "4\n2 2 2 2\n4", expectedOutput: "6", hidden: true },
      /* The partner is the last element; then the first. */
      { input: "5\n1 1 1 1 6\n7", expectedOutput: "4", hidden: true },
      { input: "5\n7 1 1 1 1\n8", expectedOutput: "4", hidden: true },
      /* The top of the stated range, and three separate pairs in one list. */
      { input: "2\n1000 1000\n2000", expectedOutput: "1", hidden: true },
      { input: "6\n1 2 3 4 5 6\n7", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m9.l4.b6 — «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6). Same problem, same example, same
     * numbers; support then defends the same solution at b7 like everyone else.
     *
     * The two blanks are the two decisions the problem actually contains, and
     * neither can be derived from the other: where the inner loop STARTS (after
     * i, so no number meets itself and no pair is seen twice) and that the sum
     * must be exactly k. Everything else is bookkeeping and is handed over.
     *
     * The scaffold's outer loop is `range(n - 1)` rather than `range(n)`, so the
     * completed template is NOT byte-identical to b6's reference solution. The
     * last i has no partner to its right, so stopping one earlier is correct and
     * is itself worth reading: it is the same fact the first blank is about.
     * A support learner never meets b6 — the tracks arrays put them on separate
     * routes — but a program a learner completes should still be their own.
     *
     * The statement is repeated in full: on the support route there is no card
     * above carrying these numbers to point at.
     */
    id: "m9.l4.b6s",
    type: "fill_blank",
    skillRefs: ["contest.defend", "enumerate.all", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда n бүтін сан, үшінші жолда k саны беріледі. Бағдарлама қосындысы дәл k-ға тең орын жұптарының санын шығаруы керек: n = 4, тізім `1 3 3 5` және k = 6 болғанда жауап 2 — бұл 1 + 5 және 3 + 3. Екі орын бос. Біріншісінде ішкі цикл қай орыннан басталатынын жаз: j әрқашан i-ден кейін тұруы керек, әйтпесе сан өзімен жұп құрады да, әр жұп екі рет саналады. Екіншісінде салыстыру белгісі керек — қосынды k-дан үлкен де, кіші де емес, дәл сондай болуы тиіс.",
      ru: "В первой строке дано n, во второй — n целых чисел, в третьей — число k. Программа должна вывести количество пар позиций, сумма которых равна ровно k: при n = 4, списке `1 3 3 5` и k = 6 ответ 2 — это 1 + 5 и 3 + 3. Пропущено два места. В первом напиши, с какой позиции начинается внутренний цикл: позиция j всегда должна идти после i, иначе число составит пару само с собой, а каждая пара посчитается дважды. Во втором нужен знак сравнения — сумма должна быть не больше и не меньше k, а ровно такой.",
    },
    template:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "k = int(input())\n" +
      "count = 0\n" +
      "for i in range(n - 1):\n" +
      "    for j in range(___, n):\n" +
      "        if a[i] + a[j] ___ k:\n" +
      "            count = count + 1\n" +
      "print(count)",
    blanks: [
      { id: "f1", answer: "i + 1" },
      { id: "f2", answer: "==" },
    ],
  },
  {
    /*
     * «Ауызша түсіндіру» (p.6, the fourth of the five verification methods) put
     * where May's own paragraph puts it: «екі шешімді ауызша қорғау» (p.10).
     * This is the half of the tournament that the grading rule ties to the
     * other half — «Бірі болмаса, екіншісі жеке есепке алынбайды» — and it is
     * deliberately the card immediately after the program, on every route.
     *
     * The prompt names the PROBLEM rather than "the program you just wrote", so
     * it is true for a support learner who completed b6s and for a core learner
     * who wrote b6 from blank. Two minutes is stated because a defence nobody
     * has time to hear is not a defence; the five parts are one sentence each.
     *
     * Settles as `unknown` and is read by a teacher. No cases, no grade.
     */
    id: "m9.l4.b7",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["contest.defend"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Қосындысы k-ға тең жұптарды санайтын шешіміңді мұғалімге ауызша қорға. Бес бөлікті де айт: (1) бағдарламаң не істейді — бір сөйлеммен; (2) неге дәл сұралған нәрсені санайды — жұптың екі рет саналмайтынын қоса; (3) шеттерде неге дұрыс — n = 1 болғанда және тізімде бірдей сандар болғанда; (4) неше қадам жасайды және n = 1000 болғанда бұл қанша шығады; (5) n 200 000-ға дейін өссе, не бұзылады. Екі минут жеткілікті.",
      ru: "Устно защити учителю своё решение задачи о парах с суммой k. Расскажи все пять частей: (1) что делает твоя программа — одним предложением; (2) почему она считает именно то, о чём спрашивают, — включая то, что пара не считается дважды; (3) почему верно на краях — при n = 1 и когда в списке есть одинаковые числа; (4) сколько шагов она делает и сколько это при n = 1000; (5) что сломается, если n вырастет до 200 000. Двух минут достаточно.",
    },
    expectedPoints: [
      {
        kk: "1-бөлік бір сөйлеммен айтылады: барлық (i, j) орын жұптары бір рет қаралады да, қосындысы k-ға тең болғандары саналады.",
        ru: "Часть 1 сказана одним предложением: перебираются все пары позиций (i, j) по одному разу, и считаются те, у которых сумма равна k.",
      },
      {
        kk: "2-бөлікте әр жұптың дәл бір рет қаралатыны негізделеді: ішкі цикл әрқашан i-ден кейінгі орыннан басталады, сондықтан ешбір сан өзімен жұптаспайды және (i, j) мен (j, i) екі бөлек жұп болып саналмайды.",
        ru: "В части 2 обосновано, что каждая пара рассматривается ровно один раз: внутренний цикл всегда начинается с позиции после i, поэтому ни одно число не образует пару с самим собой и (i, j) и (j, i) не считаются двумя разными парами.",
      },
      {
        kk: "3-бөлікте шеттер аталады: n = 1 болғанда бірде-бір жұп жоқ, жауап 0; тізімде бірдей екі сан тұрса, олар бір ғана жұп құрайды; ал k-ның жартысына тең сан жалғыз болса, ол ешқандай жұп бермейді.",
        ru: "В части 3 названы края: при n = 1 пар нет вовсе и ответ 0; два одинаковых числа в списке дают одну пару, а не две; а одиночное число, равное половине k, не даёт пары вообще.",
      },
      {
        kk: "4-бөлікте қадам саны нақты аталады: жұптардың саны шамамен n·(n−1)/2, n = 1000 болғанда бұл шамамен 500 000 қадам, ол уақыт шегіне еркін сыяды.",
        ru: "В части 4 названо конкретное число шагов: пар примерно n·(n−1)/2, при n = 1000 это около 500 000 шагов, что свободно укладывается в ограничение по времени.",
      },
      {
        kk: "5-бөлікте шектеу өзгергенде не болатыны айтылады: n = 200 000 болса, жұптардың саны 20 миллиардқа жуықтайды да, қос цикл үлгермейді — басқа әдіс керек болады. Есеп орын жұптарының орнына мән жұптарын сұрайтын болса, бірдей сандарды санау ережесі де өзгеруі тиіс.",
        ru: "В части 5 сказано, что будет при изменении ограничения: при n = 200 000 пар получится около двадцати миллиардов и двойной цикл не уложится — понадобится другой метод. А если бы спрашивали про пары значений, а не позиций, изменилось бы и правило подсчёта одинаковых чисел.",
      },
    ],
  },
  {
    /*
     * «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер
     * алдындағы тексеру тізіміне айналады» (p.10). The journal is the
     * programme's; what this card does is join it to the five-part checklist —
     * almost every entry a learner made this year is an edge somebody did not
     * check, which is part 3. Asking which part is hardest, and then which of
     * your own past mistakes part 3 would have caught, turns a year of failed
     * submissions into something usable before the tournament.
     *
     * Not an attempt block: nobody is scored for saying which part they find
     * hard, and pretending otherwise would produce evidence about nothing.
     */
    id: "m9.l4.b8",
    type: "reflection",
    skillRefs: ["contest.defend"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Қорғаудың бес бөлігін қайта қара: не істейді, неге сұраққа жауап береді, шеттерде неге дұрыс, неге уақытқа үлгереді, шарт өзгерсе не бұзылады. Қайсысын айту саған ең қиын және неге қиын — сөз таппағаннан ба, әлде жауабын өзің де білмегеннен бе? Енді жыл бойғы қателер журналыңды аш: ондағы жазбалардың қайсысы 3-бөлікте, шеттерді тексергенде, ұсталар еді? Турнирге дейін сол бөлікті екі есе мұқият дайында.",
      ru: "Перечитай пять частей защиты: что делает, почему отвечает на вопрос, почему верно на краях, почему укладывается по времени, что сломается при изменении условия. Какую из них тебе труднее всего произнести и почему — потому что не находишь слов или потому что сам не знаешь ответа? Теперь открой свой журнал ошибок за год: какие записи в нём были бы пойманы частью 3, проверкой краёв? Именно эту часть готовь к турниру вдвое тщательнее.",
    },
  },
];
