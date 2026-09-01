import type { LessonBlock } from "../../types";

/**
 * Lesson m9.l2 · «Вердиктті оқу» — what the checking system said, and what to do
 * about it. PDF p.10, May. Skills: `contest.verdict_reading`, `debug.boundary`.
 *
 * Three clauses of the programme drive every block below.
 *
 *   «тексеру жүйесінің хабарламаларына дұрыс жауап беру» (p.10, «Оқушы нені
 *   меңгереді») — the objective is not "understand the verdict" but RESPOND to
 *   it. So every card ends in an action: run the sample yourself, invent an edge
 *   case, reread the input format, put the problem down.
 *
 *   «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер
 *   алдындағы тексеру тізіміне айналады» (p.10) — the checklist is the
 *   programme's own object, and `b8` is where the learner writes theirs. It is
 *   the one block here a teacher reads.
 *
 *   «Бұл айда жаңа тақырып жоқ» (p.10) — nothing new. Every program on these
 *   cards is October's single traversal with an accumulator or a counter
 *   (`lists.traverse`, `loops.counter`, `loops.accumulator`), and the one thing
 *   the lesson actually teaches about programs — that `<` and `<=` are different
 *   answers to the same sentence — is September's `debug.boundary`.
 *
 * ## The verdicts are this product's, and C++ adds four events under them
 *
 * This platform shows a learner exactly four outcomes, and their strings are in
 * `schools/presentation/labels.ts`: «Дұрыс», «Бір бөлігі дұрыс», «Әзірге дұрыс
 * емес», «Әлі өлшенбеген». There is no `WA on test 3`, no `TLE`, no test index.
 * Teaching Codeforces vocabulary here would hand a fourteen-year-old a word they
 * will never see on the screen in front of them, so the lesson is built on the
 * four strings the product actually renders.
 *
 * What C++ changed is the layer UNDERNEATH those four, and `b1` is re-authored
 * rather than translated because of it. In Python a submission that reached the
 * judge had already parsed and the only two things that could happen were a
 * wrong answer and a traceback. In C++ there are four distinct events, three of
 * which Python effectively did not have, and every one of them can arrive
 * wearing the same «Әзірге дұрыс емес»:
 *
 *   1. **A compile error.** Common, and a first-class outcome rather than a
 *      curiosity: the program never ran, so nothing about the learner's thinking
 *      has been measured. `runStderrIsCompiler` in `labels.ts` exists for this
 *      moment. The judge's and the browser's wording differ (GCC 14 against
 *      Clang 8, `CPP17_JUDGE_PARITY.md`) and both name a line and a cause.
 *   2. **A wrong answer from a silent `int` overflow.** The algorithm is right,
 *      the arithmetic is right, and the answer is wrong because the type was too
 *      small. Python had no analogue at all — its integers do not overflow — and
 *      this is the single most valuable thing C++ adds to this month, because it
 *      is the one failure a learner cannot find by re-reading their logic.
 *   3. **A runtime error with NO message.** Out of bounds in C++ does not raise
 *      `IndexError`; it either stops the program with nothing readable attached
 *      or lets it continue and print a meaningless number. The absence of a
 *      traceback is the normal case and is taught as such.
 *   4. **A time limit**, against 3 s in the browser and 5 s on the judge, at
 *      roughly 10⁸ operations a second — an order of magnitude more than the
 *      Python figure this month's estimates were originally written against, so
 *      every one of them was re-derived. `ios_base::sync_with_stdio(false)` and
 *      `cin.tie(nullptr)` are taught here, with the rule that comes with them.
 *
 * The four product verdicts still carry the distinctions the lesson needs:
 *
 *   - «Бір бөлігі дұрыс» can only mean the visible sample passed and something
 *     hidden did not — a thinking problem, and almost always an edge case or an
 *     overflow.
 *   - «Әзірге дұрыс емес» means not one check passed, INCLUDING the sample
 *     printed in the statement, which the learner can run and read. A debugging
 *     problem, and in a contest the cheapest one there is.
 *   - «Әлі өлшенбеген» is not a verdict at all. `b2`'s fourth option exists to
 *     make a learner who believes an outage looks like a partial pass say so out
 *     loud, because the product keeps those two apart on purpose and a learner
 *     who conflates them will resubmit instead of debug.
 *
 * ## Crash versus wrong answer
 *
 * `b4` and `b5` are the pair. `b4`'s program compiles, finishes and prints 0 on
 * every input, because the read loop stores into a scratch variable instead of
 * into the vector — the C++ shape of the input misread, the five-second fix, and
 * the most common contest loss. `b5`'s program is right on the sample and wrong
 * the moment the maximum sits at position 0, which is what a hidden case is for.
 * One is found by running the sample; the other is found by inventing an input.
 * That is the whole lesson.
 *
 * `b4` is the one block where the defect is genuinely a different mistake from
 * the Python original's. There, the program read the wrong LINE; in C++ `cin >>`
 * names the variable it fills, so the same misreading of the input shape becomes
 * naming the wrong variable, and the symptom — a program that prints 0 whatever
 * you feed it — is identical. The repaired program is deterministic on every
 * input, which matters: a version of this bug that walked off the end of the
 * vector would be undefined behaviour, and «prints 0 on any input» would then be
 * a claim nobody could make.
 *
 * ## The structural requirement, and which of the three options this lesson took
 *
 * `b7` asks for a repair, and the natural sentence — "change one line, do not
 * rewrite the program" — is a rule output comparison cannot see: a learner who
 * deletes everything and writes a correct program from scratch passes, as they
 * should. So the prompt takes **option 2 from the authoring contract: guidance,
 * not a rule.** It says «Кеңес: түзетілетін жер — бір жол» and then says in the
 * same breath that the task is graded on the answer. Option 1 was unavailable
 * (no output distinguishes a repair from a rewrite) and option 3 would have
 * spent the lesson's one written block on program shape instead of on the
 * checklist, which is the clause the programme names.
 *
 * ## Where a diagnostic mapping is deliberately absent
 *
 * Only `b2`'s "the system is broken" and `b3`'s "think about the hidden edge
 * cases" carry one, and both are mapped because the card's own text rules out
 * the second reading: `b2` states a measured, partial verdict, and `b3` states
 * that the visible sample failed. Every other wrong answer here has at least two
 * honest causes and the per-block comments say which — the engine asking a
 * fourteen-year-old why they chose it beats the engine telling them something
 * false about themselves.
 */

const P = 10; // PDF page for all of May

export const M9_L2: LessonBlock[] = [
  {
    id: "m9.l2.b1",
    type: "concept",
    skillRefs: ["contest.verdict_reading"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Вердикт нені айтады",
      ru: "Что говорит вердикт",
    },
    /* Four verdicts, then the four C++ events under them, then five actions.
       The actions are the reason the block exists: «хабарламаларына дұрыс жауап
       беру» is a response, and a lesson that only named the four strings would
       have taught a vocabulary instead of a decision.

       The snippet is an illustration and nothing else — a program that asks for
       `a[n]` in a vector of length n. It is deliberately the WEAKEST kind of
       failure to reason about, because in C++ it has two possible outcomes and
       the body says both: the program stops with nothing readable, or it keeps
       going and prints a meaningless number. Nothing later in the lesson asks
       the learner to reproduce it. */
    body: {
      kk: "«Тексеру» түймесін басқанда жүйе алдымен бағдарламаңды компиляциялайды, содан кейін оны бірнеше кіріске жібереді: шартта басылып тұрған мысалдарға да, сен көрмейтін жасырын тексерулерге де. Содан кейін ол төрт жауаптың бірін береді, әрі әрқайсысының өз мағынасы бар.\n\n**Дұрыс.** Тексерулердің бәрі өтті — көрінетіні де, жасырыны да. Есеп жабылды.\n\n**Бір бөлігі дұрыс.** Тексерулердің бір бөлігі өтті, бір бөлігі өтпеді. Демек бағдарлама компиляциядан өтіп, іске қосылды және жауап шығарды, бірақ кейбір кірісте оның жауабы басқа болды.\n\n**Әзірге дұрыс емес.** Бірде-бір тексеру өтпеді — шартта басылып тұрған мысал да. Бір қарағанда жаман көрінгенімен, бұл ең қолайлы жағдай: сол мысалды өз браузеріңде «Іске қосу» арқылы жіберіп, шыққан нәтижені шарттағы жауаппен қатар қоя аласың.\n\n**Әлі өлшенбеген.** Ештеңе өлшенген жоқ. Бұл вердикт емес: не жүйе жауап бермеді, не тапсырманы адам оқиды. Мұнда ешкімге қате қойылмайды.\n\nЕнді ең маңыздысы. Осы төрт сөздің астында C++-та төрт мүлде бөлек оқиға жатыр, ал экранда олар ұқсас көрінуі мүмкін.\n\n**1. Компиляция қатесі.** Бағдарлама мүлде іске қосылмады. Компилятор ағылшынша хабарлама береді, онда жол мен баған нөмірі тұрады. Бұл — ең арзан қате: ойлауыңда қате бар деген сөз емес, әлі ештеңе өлшенген жоқ. Ең жиі кездесетіні — нүктелі үтірдің жоқтығы, ал компилятор ол туралы көбіне КЕЛЕСІ жолда шағымданады, сондықтан аталған жолдан бір жол жоғары қарау керек. Браузердегі және тексеру жүйесіндегі компиляторлар әртүрлі, сөзі де сәл өзгеше — екеуі де жол мен себепті атайды.\n\n**2. Қате жауап: түр тым кіші болды.** `int` ең үлкені 2 147 483 647 санын ұстайды. Одан асып кетсең, ешқандай хабарлама шықпайды — бағдарлама жұмысын жалғастыра береді, ал сан теріске айналып кетуі мүмкін. Мысалы 200 000 санның әрқайсысы 1 000 000 000-ға дейін болса, олардың қосындысы 2 · 10¹⁴ шамасында, ал бұл `int` сыйдыратыннан жүз мың есе үлкен. Мұнда алгоритм дұрыс, арифметика дұрыс, ал жауап қате — себебі бір сөзде: түр. Емі де бір сөз: қосындыны, көбейтіндіні және аралық нәтижелерді `long long` етіп ал. Бұл — C++ қосатын, Python-да мүлде болмаған жағдай, әрі оны кодқа қарап табу қиын: жол дұрыс жазылған, тек түрі кішкентай.\n\n**3. Орындалу қатесі — түсіндірмесіз.** Векторда жоқ орынға жүгінсең, C++ саған ештеңе айтпайды. Екеуінің бірі болады: бағдарлама кенет тоқтайды (ешқандай хабарламасыз) немесе жұмысын жалғастырып, мағынасыз санды шығарады. Түсіндірменің болмауы — қалыпты жағдай, оны күт. Сондықтан индексті өзің тексересің: `i` 0-ден n − 1-ге дейін ғана болуы тиіс. Төмендегі бағдарлама n элементтен тұратын вектордан a[n] элементін сұрайды, ал ондай орын жоқ.\n\n**4. Уақыт шегі.** Браузердегі «Іске қосу» 3 секунд, тексеру жүйесі 5 секунд береді. Есептеу үшін бір санды жаттап ал: C++ бір секундта шамамен 10⁸, яғни жүз миллион қарапайым әрекет жасайды. Демек n = 200 000 болғанда n² = 4 · 10¹⁰ — үлгермейді, ал n·log n ≈ 3,5 миллион — бірден бітеді. Кіріс өте үлкен болғанда (жүз мыңдаған сан) `cin`-нің өзі баяу болып қалады. Оның емі — `main`-нің ең басына қойылатын екі жол:\n\n```\nios_base::sync_with_stdio(false);\ncin.tie(nullptr);\n```\n\nБірінші жол `cin` мен `cout`-ты C тіліндегі `scanf`/`printf`-пен үнемі үндестіріп отыруды өшіреді, екіншісі әр оқу алдында шығысты мәжбүрлеп босатуды тоқтатады. Бір ғана ереже: осыдан кейін бір бағдарламада `scanf`/`printf`-ті `cin`/`cout`-пен араластыруға болмайды. Бұл екі жол алгоритмді тездетпейді — тек оқу мен жазуды тездетеді, сондықтан n² есебін құтқармайды.\n\n**Бөлшек сан туралы бір ескерту.** `cout << 1.0 / 3` әдепкі күйде `0.333333` деп қана шығарады — алты мәнді цифр, одан әрі кесіледі. Шартта одан дәлірек жауап сұралса, бұл — қате жауап. Емі: `#include <iomanip>` және `cout << fixed << setprecision(6) << x;`, мұндағы цифр санын шарттың өзі айтады.\n\nВердикт бойынша келесі қадам:\n\n1. Компиляция қатесі — компилятордың өз сөзін оқы, аталған жолдан бір жол ЖОҒАРЫ қара. Бұл бірнеше минуттық жұмыс.\n2. «Әзірге дұрыс емес» — алдымен шарттағы мысалды өзің жіберіп, кірістің неше жолдан тұратынын қайта оқы. Бұл — түзету жұмысы, көбіне бірер минут алады.\n3. «Бір бөлігі дұрыс» — шеткі кірістерді өзің құрастырып, браузерде жіберіп көр; сонымен қатар жауабың `int`-ке сыя ма деп тексер. Бұл — ойлау жұмысы.\n4. Бағдарлама тоқтап қалса немесе мағынасыз сан шығарса — индекстерді тексер: ең кіші және ең үлкен орын дұрыс па.\n5. «Әлі өлшенбеген» — біраз күтіп, қайта жібер. Бұл сенің қатең емес.\n\nСоңғы ескерту: бұл курстағы тапсырмалардың басым бөлігінде тексеру бос орындар мен жол ауысуларына қарамайды, ол шыққан сандар мен сөздердің өзін салыстырады. Пішімнің шынымен маңызы бар сирек жағдай шартта бөлек айтылады. Сондықтан «бос орынды артық қойдым» деген «Бір бөлігі дұрыс» вердиктінің себебі бола алмайды.",
      ru: "Когда ты нажимаешь «Проверить», система сначала компилирует твою программу, а потом прогоняет её на нескольких вводах: и на примерах, напечатанных в условии, и на скрытых проверках, которых ты не видишь. После этого она даёт один из четырёх ответов, и у каждого свой смысл.\n\n**Верно.** Прошли все проверки — и видимые, и скрытые. Задача закрыта.\n\n**Часть верна.** Часть проверок прошла, часть — нет. Значит, программа скомпилировалась, запустилась и выдала ответ, но на некоторых вводах её ответ оказался другим.\n\n**Пока неверно.** Не прошла ни одна проверка — в том числе пример, напечатанный в условии. На первый взгляд это выглядит хуже, но на деле это самый удобный случай: этот пример можно запустить у себя в браузере кнопкой «Запустить» и положить свой вывод рядом с ответом из условия.\n\n**Ещё не измерено.** Ничего не измерено. Это не вердикт: либо система не ответила, либо задание читает человек. Ошибка при этом никому не поставлена.\n\nА теперь самое главное. Под этими четырьмя словами в C++ прячутся четыре совершенно разных события, и на экране они выглядят похоже.\n\n**1. Ошибка компиляции.** Программа вообще не запустилась. Компилятор выдаёт сообщение по-английски, с номером строки и столбца. Это самая дешёвая ошибка: она не означает, что ты неправильно думал, — просто ещё ничего не измерено. Чаще всего это пропущенная точка с запятой, и жалуется на неё компилятор обычно уже в СЛЕДУЮЩЕЙ строке, так что смотреть надо на строку выше названной. В браузере и в проверяющей системе компиляторы разные, слова у них немного отличаются — но и тот и другой называют строку и причину.\n\n**2. Неверный ответ: тип оказался мал.** Наибольшее число, которое держит `int`, — это 2 147 483 647. Если выйти за него, никакого сообщения не будет: программа спокойно продолжит работать, а число может стать отрицательным. Например, сумма 200 000 чисел, каждое из которых доходит до 1 000 000 000, — это порядка 2 · 10¹⁴, в сто тысяч раз больше того, что помещается в `int`. Здесь алгоритм верен, арифметика верна, а ответ неверен — и причина в одном слове: тип. Лечение тоже в одном слове: суммы, произведения и промежуточные результаты бери как `long long`. Такого случая в Python не было вовсе, и глазами по коду его найти трудно: строка написана правильно, просто тип маленький.\n\n**3. Ошибка во время выполнения — без объяснения.** Если обратиться к позиции, которой в векторе нет, C++ ничего тебе не скажет. Произойдёт одно из двух: программа внезапно остановится (без всякого сообщения) или продолжит работу и напечатает бессмысленное число. Отсутствие объяснения — это норма, к ней надо быть готовым. Значит, индексы проверяешь ты сам: `i` должен идти только от 0 до n − 1. Программа ниже обращается к элементу a[n] вектора из n элементов, а такой позиции нет.\n\n**4. Предел по времени.** Кнопка «Запустить» в браузере даёт 3 секунды, проверяющая система — 5 секунд. Для прикидки запомни одно число: C++ успевает примерно 10⁸, то есть сто миллионов простых действий в секунду. Значит, при n = 200 000 величина n² = 4 · 10¹⁰ не уложится, а n·log n ≈ 3,5 миллиона закончится мгновенно. Когда ввод очень большой (сотни тысяч чисел), медленным становится и сам `cin`. Лечение — две строки в самом начале `main`:\n\n```\nios_base::sync_with_stdio(false);\ncin.tie(nullptr);\n```\n\nПервая отключает постоянную синхронизацию `cin` и `cout` с сишными `scanf`/`printf`, вторая перестаёт принудительно сбрасывать вывод перед каждым чтением. Правило при этом одно: после них нельзя в одной программе смешивать `scanf`/`printf` с `cin`/`cout`. Эти две строки не ускоряют алгоритм — они ускоряют только чтение и вывод, поэтому решение за n² они не спасут.\n\n**Одно замечание про дробные числа.** `cout << 1.0 / 3` по умолчанию печатает всего `0.333333` — шесть значащих цифр, дальше обрезается. Если в условии просят ответ точнее, это неверный ответ. Лечение: `#include <iomanip>` и `cout << fixed << setprecision(6) << x;`, где число цифр называет само условие.\n\nЧто делать после вердикта:\n\n1. Ошибка компиляции — прочитай собственные слова компилятора и посмотри на строку ВЫШЕ названной. Это работа на пару минут.\n2. «Пока неверно» — сначала запусти пример из условия и перечитай, из скольких строк состоит ввод. Это отладка, и чаще всего она занимает пару минут.\n3. «Часть верна» — придумай крайние вводы сам и прогони их в браузере, а заодно проверь, помещается ли твой ответ в `int`. Это работа мысли.\n4. Если программа останавливается или печатает бессмыслицу — проверь индексы: верны ли самая первая и самая последняя позиция.\n5. «Ещё не измерено» — подожди немного и отправь снова. Это не твоя ошибка.\n\nИ последнее замечание: в большинстве заданий этого курса проверка не смотрит на пробелы и переводы строк, она сравнивает сами выведенные числа и слова. Редкий случай, когда формат действительно важен, оговаривается в условии отдельно. Поэтому «поставил лишний пробел» не может быть причиной вердикта «Часть верна».",
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
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    cout << a[n];\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The scenario's constraints are what make exactly one option best, and they
     * were written for that job:
     *
     *   n ≤ 1000 kills o1 — a single traversal of a thousand numbers is nowhere
     *   near a time limit, and even further from one in C++ at 10⁸ operations a
     *   second than it was in Python;
     *   "one integer" plus b1's closing paragraph kills o2 — the checker
     *   compares values, not spacing;
     *   |a[i]| ≤ 1000 kills the overflow reading — the answer is one of the
     *   input numbers and cannot leave `int`, which is stated so that a learner
     *   who has just met b1's second point does not answer with it;
     *   the verdict itself kills o4 — an outage settles as «Әлі өлшенбеген»,
     *   never as a partial pass.
     *
     * o1 and o2 carry no mapping. o1 is produced both by having no sense of what
     * a thousand steps costs and by a belief that "part correct" always means a
     * timeout on the big hidden cases; o2 both by not knowing what the checker
     * compares and by a general habit of blaming output format first. Two causes
     * each, so the engine asks.
     */
    id: "m9.l2.b2",
    type: "multiple_choice",
    skillRefs: ["contest.verdict_reading", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жарыстағы есеп: бірінші жолда n саны (1 ≤ n ≤ 1000), екінші жолда n бүтін сан (әрқайсысының абсолют шамасы 1000-нан аспайды), солардың ең үлкенін шығару керек. Шығару — бір ғана бүтін сан. Шартта басылып тұрған мысалды бағдарламаң дұрыс шығарды, ал «Тексеру» түймесінен кейін «Бір бөлігі дұрыс» деген жауап келді. Ең ықтимал себебі қайсысы?",
      ru: "Задача на соревновании: в первой строке дано число n (1 ≤ n ≤ 1000), во второй — n целых чисел (каждое по модулю не больше 1000), нужно вывести наибольшее из них. Вывод — одно целое число. На примере из условия твоя программа отвечает верно, а после кнопки «Проверить» пришёл ответ «Часть верна». Какая причина наиболее вероятна?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Бағдарлама тым баяу: n 1000-ға дейін жетеді, сондықтан уақыт шегінен асып кеткен.",
          ru: "Программа слишком медленная: n доходит до 1000, поэтому превышено время.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Шығару пішімі дұрыс емес: санның алдында немесе артында артық бос орын қалып қойған.",
          ru: "Неверный формат вывода: перед числом или после него остался лишний пробел.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Мысалда жоқ шеткі жағдай бар — барлық сан бірдей, немесе n = 1, немесе барлығы теріс — және дәл сол жерде бағдарлама басқа жауап береді.",
          ru: "Есть крайний случай, которого нет в примере, — все числа одинаковые, или n = 1, или все отрицательные, — и именно на нём программа даёт другой ответ.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Тексеру жүйесі бұзылған: ештеңе өлшенбеген, сондықтан жай ғана қайта жіберу керек.",
          ru: "Проверяющая система сломалась: ничего не измерено, поэтому надо просто отправить ещё раз.",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      o4: {
        failureClass: "measured_verdict_read_as_outage",
        justification:
          "«Бір бөлігі дұрыс» — өлшенген вердикт: ол бір тексерудің өтіп, екіншісінің өтпегенін білдіреді, яғни бағдарлама компиляциядан өтіп, шынымен іске қосылған. Жүйе жауап бермеген жағдайда экранда мүлде басқа сөз тұрар еді — «Әлі өлшенбеген». Осы нұсқаны таңдау сол екеуін бір-бірінен ажыратпағанды көрсетеді.",
      },
    },
  },
  {
    /*
     * The mirror of b2, and the card the month's «уақытында басқа есепке ауысу»
     * quietly depends on: a learner who answers a visible failure with hidden-
     * case reasoning spends ten minutes on a two-minute problem.
     *
     * The prompt now rules out TWO other screens rather than one. «Бағдарлама
     * компиляциядан өтті» is there because in C++ a failed submission is a
     * compile error often enough that "read what the compiler said" is a
     * defensible first move — b1 lists it first — and a card with two defensible
     * answers measures nothing. «Құламады» rules out the runtime-error screen
     * the same way it used to rule out a traceback.
     *
     * o1 and o4 carry no mapping. o1 comes both from panic and from a genuine
     * belief that a failure on every case means the method is wrong; o4 both
     * from distrusting the judge and from the (real, and elsewhere sensible)
     * tactic of resubmitting to see what changes. Two causes each.
     */
    id: "m9.l2.b3",
    type: "multiple_choice",
    skillRefs: ["contest.verdict_reading"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жарыс жүріп жатыр. Бағдарламаңды жібердің, «Әзірге дұрыс емес» деген жауап келді: бірде-бір тексеру өтпеген, шартта басылып тұрған мысал да өтпеген. Бағдарлама компиляциядан өтті — компилятор ешқандай қате көрсеткен жоқ — және орындалу кезінде де тоқтап қалмады: ол әр кіріске сан шығарды. Ең алдымен не істейсің?",
      ru: "Идёт соревнование. Ты отправил программу и получил ответ «Пока неверно»: не прошла ни одна проверка, в том числе пример, напечатанный в условии. Программа скомпилировалась — компилятор не выдал ни одной ошибки — и во время работы не остановилась: на каждом вводе она напечатала число. Что сделаешь в первую очередь?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Алгоритмді басынан ойлаймын: бірде-бір тексеру өтпесе, әдістің өзі түбегейлі дұрыс емес деген сөз.",
          ru: "Продумаю алгоритм заново: если не прошла ни одна проверка, значит, сам метод в корне неверен.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Шарттағы мысалды браузерде «Іске қосу» арқылы жіберіп, шыққан нәтижемді шарттағы жауаппен қатар қоямын, әрі кірістің неше жолдан тұратынын қайта оқимын.",
          ru: "Запущу пример из условия у себя кнопкой «Запустить», положу свой вывод рядом с ответом из условия и заново прочитаю, из скольких строк состоит ввод.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Шеткі жағдайларды ойлаймын: n = 1, барлық сан бірдей, теріс сандар — солардың біреуі жасырын тексеруде тұрған шығар.",
          ru: "Подумаю о крайних случаях: n = 1, все числа одинаковые, отрицательные числа — наверное, один из них и стоит в скрытой проверке.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Ештеңе өзгертпей тағы бірнеше рет жіберемін: мүмкін жүйе қателескен шығар.",
          ru: "Отправлю ещё несколько раз, ничего не меняя: возможно, система ошиблась.",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o3: {
        failureClass: "visible_failure_treated_as_hidden",
        justification:
          "Бұл вердиктте шартта басылып тұрған мысал да өтпеген, ал сол мысалды оқушы өз браузерінде жіберіп, бағдарламасының жауабын көзімен көре алады. Шеткі жағдайларды ойлау — «Бір бөлігі дұрыс» вердиктіне берілетін жауап, ал мұнда өтпеген тексеру көрініп тұр. Осы нұсқаны таңдау келесі қадамды вердиктке қарап таңдамағанды білдіреді.",
      },
    },
  },
  {
    /*
     * The input misread, and the symptom is a WRONG ANSWER rather than a crash:
     * the program compiles, finishes, prints 0, and prints 0 on every input in
     * the world, because nothing was ever stored in `a`.
     *
     * Chosen over a crashing version deliberately. A crash in C++ names nothing
     * at all — b1's third point — so a card built on one would teach "look at
     * the message" and there is no message; a silent 0 is found by running the
     * statement's own sample and comparing two numbers. That is the five-second
     * fix the brief calls the most common contest loss.
     *
     * The Python original's bug was reading the wrong LINE. In C++ `cin >>`
     * names the variable it fills, so the same class of mistake takes the shape
     * of naming the wrong one: the loop consumes exactly the right numbers off
     * the input and drops each of them into a scratch variable. Every input is
     * read, `a` stays all zeros, and `big - small` is 0 forever — with no
     * undefined behaviour anywhere, which is what lets the prompt say "0 on any
     * input" and mean it.
     *
     * No diagnosticMapping. Line 9 (`int big = a[0];`) is the plausible wrong
     * answer and it has two causes — reading the initialisation as October's
     * named accumulator error, or believing `a[0]` cannot be both the maximum
     * and the minimum — so the engine asks.
     */
    id: "m9.l2.b4",
    type: "find_bug",
    skillRefs: ["contest.verdict_reading", "io.read", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Есеп шарты: бірінші жолда n саны, екінші жолда n бүтін сан — бір аптадағы түнгі температура. Ең жоғары мен ең төмен температураның айырмасын шығару керек. `5` және `3 9 1 7 4` кірісі үшін дұрыс жауап — 8.\n\nБағдарлама компиляциядан өтті және құлаған жоқ: ол аяғына дейін орындалып, сан шығарды. Бірақ ол сан 0 болып шықты, әрі қандай кіріс берсең де 0 шығады. Қате қай жолда?",
      ru: "Условие задачи: в первой строке дано число n, во второй — n целых чисел, ночные температуры за неделю. Нужно вывести разность между самой высокой и самой низкой температурой. Для ввода `5` и `3 9 1 7 4` верный ответ — 8.\n\nПрограмма скомпилировалась и не упала: она доработала до конца и вывела число. Но этим числом оказался ноль, и ноль получается на любом вводе. В какой строке ошибка?",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, x;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> x;\n" +
      "    int big = a[0];\n" +
      "    int small = a[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > big) big = a[i];\n" +
      "        if (a[i] < small) small = a[i];\n" +
      "    }\n" +
      "    cout << big - small;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 8,
    fixedCode:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int big = a[0];\n" +
      "    int small = a[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > big) big = a[i];\n" +
      "        if (a[i] < small) small = a[i];\n" +
      "    }\n" +
      "    cout << big - small;\n" +
      "    return 0;\n" +
      "}",
    /* Buggy: `a` is never filled, so it prints 0. Fixed: prints 8. */
    symptomInput: "5\n3 9 1 7 4",
  },
  {
    /*
     * The other half of the pair: right on the visible sample, wrong on a hidden
     * case. The counting loop starts at index 1, so the maximum is never counted
     * when it sits at position 0 — and with n = 1 the answer collapses to 0.
     *
     * The card states the verdict («Бір бөлігі дұрыс») rather than the failing
     * input, which is what a contest actually gives you. The sample in the
     * prompt is `3 9 1 9 4`, where the program is right, so the learner cannot
     * find the defect by running what is on screen; they have to ask which
     * inputs the second loop treats differently from the first.
     *
     * No diagnosticMapping. Line 10 (the maximum loop) is the plausible wrong
     * answer and has two causes: a learner may believe the two loops must have
     * the same bounds and pick the wrong one of the pair, or may think a maximum
     * search should skip the element it started from. Two causes, so no claim.
     */
    id: "m9.l2.b5",
    type: "find_bug",
    skillRefs: ["contest.verdict_reading", "debug.boundary", "loops.counter", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Есеп шарты: бірінші жолда n, екінші жолда n бүтін сан. Тізімдегі ең үлкен сан НЕШЕ РЕТ кездесетінін шығару керек. Шартта басылып тұрған мысал — `5` және `3 9 1 9 4`, оның жауабы 2, әрі бағдарлама дәл сол 2-ні шығарады. Ал «Тексеру» түймесінен кейін «Бір бөлігі дұрыс» деген жауап келді: жасырын тексерулердің бір бөлігі өтпеген. Қате қай жолда?",
      ru: "Условие задачи: в первой строке n, во второй — n целых чисел. Нужно вывести, СКОЛЬКО РАЗ в списке встречается наибольшее число. Пример из условия — `5` и `3 9 1 9 4`, его ответ 2, и программа выводит именно 2. А после кнопки «Проверить» пришёл ответ «Часть верна»: часть скрытых проверок не прошла. В какой строке ошибка?",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int best = a[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > best) best = a[i];\n" +
      "    }\n" +
      "    int cnt = 0;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] == best) cnt = cnt + 1;\n" +
      "    }\n" +
      "    cout << cnt;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 14,
    fixedCode:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int best = a[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > best) best = a[i];\n" +
      "    }\n" +
      "    int cnt = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] == best) cnt = cnt + 1;\n" +
      "    }\n" +
      "    cout << cnt;\n" +
      "    return 0;\n" +
      "}",
    /* The smallest input that exposes it: one number, so the maximum IS a[0].
       Buggy prints 0, fixed prints 1. */
    symptomInput: "1\n5",
  },
  {
    /*
     * The palindrome that compares only the endpoints — the exact shortcut the
     * first adversarial review found passing seven cases of `m2.p6` and again in
     * `m3.l7.b7`. Here it is not a defect to be avoided; it is the subject, and
     * the learner is asked to be the reviewer.
     *
     * The answer space is closed on purpose. "Four numbers, each 1 or 2" leaves
     * exactly four inputs on which the program is wrong: it answers `yes`
     * whenever `a[0] == a[3]`, the true answer is `yes` only when `a[1] == a[2]`
     * as well, and no input in the constraint makes it answer `no` wrongly. All
     * four are enumerated in `breakingInputs`, so a learner who reasons it out
     * is graded correct rather than settled as unmeasured. The constraint is
     * narrow enough to be checkable and still leaves the whole insight — the
     * ends must match and the middle must not — to the learner.
     *
     * The prompt asks for the input alone, with nothing else typed, because the
     * comparison is exact string equality against those four.
     *
     * `while (cin >> x)` — reading to the end of the input — is the one idiom on
     * this card the year has not shown, and it is here because the problem's own
     * input shape carries no count. It costs nothing: this is a `test_case`
     * block, so the learner reads the program and invents an input, and is never
     * asked to write the loop. Adding a count line to the statement would have
     * been the alternative, and it would have made the learner's answer two
     * lines instead of the four numbers the block compares.
     */
    id: "m9.l2.b6",
    type: "test_case",
    skillRefs: ["contest.verdict_reading", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Есеп шарты: бір жолда бос орынмен бөлінген бүтін сандар беріледі. Тізім екі жағынан бірдей оқылса, яғни палиндром болса, `yes` сөзін, әйтпесе `no` сөзін шығару керек. Шартта екі мысал бар: `1 2 3 2 1` үшін `yes`, `1 2 3` үшін `no`. Төмендегі бағдарлама екі мысалды да дұрыс шығарады, сол күйінде жарыста жіберілді.\n\nОны сындыратын кірісті тап: бағдарлама қате жауап беретін кіріс жаз. Шектеу — дәл төрт сан, әр саны 1 немесе 2 болсын. Жауап ретінде тек сол төрт санды бір жолға бос орынмен бөліп жаз, басқа ештеңе жазба.",
      ru: "Условие задачи: в одной строке даны целые числа через пробел. Если список читается одинаково с обеих сторон, то есть является палиндромом, надо вывести слово `yes`, иначе — слово `no`. В условии два примера: для `1 2 3 2 1` — `yes`, для `1 2 3` — `no`. Программа ниже отвечает верно на обоих примерах, в таком виде её и отправили на соревновании.\n\nНайди ввод, который её ломает: напиши ввод, на котором программа даёт неверный ответ. Ограничение — ровно четыре числа, каждое равно 1 или 2. В ответ впиши только эти четыре числа в одну строку через пробел, больше ничего.",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) a.push_back(x);\n" +
      "    int n = a.size();\n" +
      '    if (a[0] == a[n - 1]) cout << "yes";\n' +
      '    else cout << "no";\n' +
      "    return 0;\n" +
      "}",
    /* The complete set under the stated constraint: a[0] == a[3] and
       a[1] != a[2]. Verified by enumeration — there are no others. */
    breakingInputs: ["1 1 2 1", "1 2 1 1", "2 1 2 2", "2 2 1 2"],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m9.l2.b6 — «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6). Inventing a breaking input from
     * nothing is the one genuinely from-scratch act in this lesson, so support
     * meets the same program and the same shortcut and chooses the breaking
     * input from four candidates instead.
     *
     * Every option was run against the program:
     *   o1 `3 1 3`    — palindrome, program says yes, correct.
     *   o2 `2 2 1 2`  — NOT a palindrome, program says yes. The answer.
     *   o3 `1 2 3 4`  — not a palindrome, program says no, correct.
     *   o4 `7`        — one element, a palindrome, program says yes, correct.
     * o4 is the near miss on purpose: a single element looks like the kind of
     * edge case that breaks things, and here it is the one input the shortcut
     * handles perfectly.
     *
     * The prompt restates the whole problem instead of pointing at the previous
     * card, because on the support route m9.l2.b6 is not on the screen at all.
     *
     * No diagnosticMapping. o3 is reachable both from reading "breaks it" as
     * "makes it answer no" and from not knowing what a palindrome is; o1 and o4
     * are reachable from either of those too. Nothing here has one cause.
     */
    id: "m9.l2.b6s",
    type: "multiple_choice",
    skillRefs: ["contest.verdict_reading", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Есеп шарты: бір жолда бос орынмен бөлінген бүтін сандар беріледі. Тізім екі жағынан бірдей оқылса, яғни палиндром болса, `yes` сөзін, әйтпесе `no` сөзін шығару керек. Төмендегі бағдарлама шарттағы екі мысалды да дұрыс шығарады: `1 2 3 2 1` үшін `yes`, `1 2 3` үшін `no`. Бірақ төрт кірістің біреуінде ол қате жауап береді. Қайсысында?",
      ru: "Условие задачи: в одной строке даны целые числа через пробел. Если список читается одинаково с обеих сторон, то есть является палиндромом, надо вывести слово `yes`, иначе — слово `no`. Программа ниже отвечает верно на обоих примерах из условия: для `1 2 3 2 1` — `yes`, для `1 2 3` — `no`. Но на одном из четырёх вводов она даёт неверный ответ. На каком?",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) a.push_back(x);\n" +
      "    int n = a.size();\n" +
      '    if (a[0] == a[n - 1]) cout << "yes";\n' +
      '    else cout << "no";\n' +
      "    return 0;\n" +
      "}",
    options: [
      {
        id: "o1",
        label: {
          kk: "`3 1 3` — үш саннан тұратын тізім",
          ru: "`3 1 3` — список из трёх чисел",
        },
      },
      {
        id: "o2",
        label: {
          kk: "`2 2 1 2` — төрт саннан тұратын тізім",
          ru: "`2 2 1 2` — список из четырёх чисел",
        },
      },
      {
        id: "o3",
        label: {
          kk: "`1 2 3 4` — өсу ретімен жазылған төрт сан",
          ru: "`1 2 3 4` — четыре числа по возрастанию",
        },
      },
      {
        id: "o4",
        label: {
          kk: "`7` — бір ғана саннан тұратын тізім",
          ru: "`7` — список из одного числа",
        },
      },
    ],
    correctOptionId: "o2",
  },
  {
    /*
     * Repair from the verdict alone. The learner is told four things and no
     * more: the program compiled, it did not stop during the run, it was right
     * on the visible sample, and the verdict is «Бір бөлігі дұрыс». Those four
     * facts point at exactly one kind of defect — a boundary — and the statement
     * says «шеттері де кіреді» in both languages while the program says `<`.
     *
     * The stated bounds keep every intermediate value inside `int` on purpose.
     * b1 has just taught that a partial pass in C++ is often an overflow, so a
     * card whose answer is a boundary has to close that door in its own text, or
     * it has two defensible answers and measures nothing.
     *
     * The visible sample is chosen so the BROKEN program passes it: no element
     * in `7 15 25 12 19 30` equals 10 or 20. Without that the story on the card
     * would be false, and a learner who ran the sample would meet a failure the
     * prompt says did not happen.
     *
     * The single-line repair is stated as ADVICE and the block is graded on
     * output — option 2 of the authoring contract, argued in the file header. A
     * learner who deletes the program and writes their own passes, correctly.
     *
     * The degenerate programs, and the case that kills each:
     *   both bounds strict (the defect
     *   itself)                        → "5 10 20\n10 20 9 21 15" wants 3, it prints 1.
     *   one bound repaired, the other
     *   left strict                    → the same case: it prints 2.
     *   a loop starting at 1, first
     *   element skipped                → "4 1 10\n1 2 3 10" wants 4, it prints 3.
     *   a loop stopping at n - 1, last
     *   element skipped                → "4 1 10\n1 2 3 10" wants 4, it prints 3.
     *   counting what falls OUTSIDE
     *   the range                      → "3 100 200\n50 60 70" wants 0, it prints 3.
     *   printing n and ignoring the
     *   condition                      → the same case: it prints 3.
     * "1 5 5\n5" is the degenerate range l = r with n = 1, where every off-by-one
     * in either direction answers 0 instead of 1.
     */
    id: "m9.l2.b7",
    type: "modify_code",
    skillRefs: ["contest.verdict_reading", "debug.boundary", "loops.counter", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Мына бағдарламаны жарыста жібердің. Есеп шарты: бірінші жолда n, l және r бос орынмен бөлініп берілген (1 ≤ n ≤ 1000, әрі l мен r-дің абсолют шамасы 1 000 000-нан аспайды), екінші жолда n бүтін сан, олардың да абсолют шамасы 1 000 000-нан аспайды. l мен r аралығына түсетін сандардың санын шығару керек, әрі шеттері де кіреді: `l ≤ a[i] ≤ r` шарты орындалса, сан есептеледі. Шартта басылып тұрған мысал — `6 10 20` және `7 15 25 12 19 30`, жауабы 3.\n\nЖүйе «Бір бөлігі дұрыс» деді. Бағдарлама компиляциядан өтті, орындалу кезінде тоқтаған жоқ және мысалды дұрыс шығарды; жауап та `int`-ке еркін сыяды. Осы деректерге сүйеніп қатені тауып, түзет. Кеңес: түзетілетін жер — бір жол. Бұл кеңес қана: тапсырма шыққан жауап бойынша тексеріледі.",
      ru: "Эту программу ты отправил на соревновании. Условие задачи: в первой строке через пробел даны n, l и r (1 ≤ n ≤ 1000, а l и r по модулю не больше 1 000 000), во второй — n целых чисел, тоже по модулю не больше 1 000 000. Нужно вывести, сколько чисел попадает в промежуток от l до r, причём границы входят: число засчитывается, если выполняется `l ≤ a[i] ≤ r`. Пример из условия — `6 10 20` и `7 15 25 12 19 30`, ответ 3.\n\nСистема ответила «Часть верна». Программа скомпилировалась, во время работы не остановилась и на примере ответила верно; ответ свободно помещается в `int`. Опираясь на эти факты, найди ошибку и исправь её. Совет: исправлять нужно одну строку. Это только совет: задание проверяется по выведенному ответу.",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, l, r;\n" +
      "    cin >> n >> l >> r;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (l < a[i] && a[i] < r) c = c + 1;\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, l, r;\n" +
      "    cin >> n >> l >> r;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (l <= a[i] && a[i] <= r) c = c + 1;\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "6 10 20\n7 15 25 12 19 30", expectedOutput: "3" },
      { input: "3 100 200\n50 60 70", expectedOutput: "0" },
      { input: "5 10 20\n10 20 9 21 15", expectedOutput: "3", hidden: true },
      { input: "1 5 5\n5", expectedOutput: "1", hidden: true },
      { input: "3 0 0\n0 0 0", expectedOutput: "3", hidden: true },
      { input: "4 1 10\n1 2 3 10", expectedOutput: "4", hidden: true },
      { input: "5 -5 5\n-6 -5 0 5 6", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер
     * алдындағы тексеру тізіміне айналады» (p.10). This is that checklist, and
     * it goes to all three routes because it is the lesson objective.
     *
     * Three questions, not five: the month's long written defence is m9.l4, and
     * a checklist nobody can write in three minutes is not usable at minute 33
     * of a contest — which is exactly where the prompt places the learner.
     *
     * The twelve minutes are in the prompt so question (3) has a real answer.
     * A checklist with no exit rule is the sunk-cost trap m9.l1.b2 already
     * charges the learner for, arriving here from the other direction.
     */
    id: "m9.l2.b8",
    type: "explain",
    skillRefs: ["contest.verdict_reading", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Жарыста есепті жібердің де, «Бір бөлігі дұрыс» деген жауап алдың: көрінетін мысал өтті, жасырын тексерулердің бірі өтпеді. Жарыстың соңына 12 минут қалды. Осы жағдайда өзің өтетін тексеру тізімін жаз. Үш сұраққа қысқа жауап бер. (1) Қандай үш шеткі кірісті бірінші құрастырып, браузерде жіберіп көресің және неге дәл соларды? (2) Ол үш кіріске бағдарламаң дұрыс жауап берсе, шарттан нені қайта оқисың? (3) Он минут ішінде себебі табылмаса не істейсің? Жауабыңды мұғалім оқиды.",
      ru: "На соревновании ты отправил задачу и получил ответ «Часть верна»: пример из условия прошёл, одна из скрытых проверок — нет. До конца соревнования осталось 12 минут. Напиши свой список проверок для этой ситуации. Ответь коротко на три вопроса. (1) Какие три крайних ввода ты придумаешь и прогонишь в браузере первыми и почему именно их? (2) Если на этих трёх программа отвечает верно, что ты перечитаешь в условии? (3) Что сделаешь, если за десять минут причина не нашлась? Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "Үш шеткі кіріс нақты аталады, жалпы «көбірек тест» деп емес: n = 1, барлық сан бірдей, мән дәл шекарада, барлығы теріс, жауап тізімнің бірінші не соңғы орнында. Әр кірістің нені тексеретіні бір сөйлеммен айтылады.",
        ru: "Три крайних ввода названы конкретно, а не как «побольше тестов»: n = 1, все числа одинаковые, значение ровно на границе, все отрицательные, ответ на первой или на последней позиции списка. Про каждый ввод одним предложением сказано, что именно он проверяет.",
      },
      {
        kk: "Тексеру тәсілі айтылады: кіріс браузерде «Іске қосу» арқылы жіберіліп, шыққан нәтиже қолмен есептелген күтілетін жауаппен қатар қойылады. «Кодқа қарап шығамын» деген тексеру емес.",
        ru: "Назван способ проверки: ввод прогоняется в браузере кнопкой «Запустить», а полученный вывод кладётся рядом с ответом, посчитанным вручную. «Просмотрю код глазами» проверкой не считается.",
      },
      {
        kk: "Шарттан қайта оқылатын нәрсе аталады: салыстыру қатаң ба, әлде «кем емес» пе; аралықтың шеттері кіре ме; сәйкес элемент мүлде болмаса не шығару керек; кірістің неше жолдан тұратыны; шектеулердегі ең үлкен сан қандай және жауап `int`-ке сыя ма.",
        ru: "Названо, что перечитывается в условии: сравнение строгое или «не меньше»; входят ли границы промежутка; что выводить, если подходящих элементов нет вовсе; из скольких строк состоит ввод; каковы наибольшие числа в ограничениях и помещается ли ответ в `int`.",
      },
      {
        kk: "Өлшенетін шығу ережесі бар: шамамен он минуттан кейін есеп қалдырылады, жазылған код өшірілмейді, ал қалған уақыт оқылмаған есепке беріледі. Жарыстан кейін бұл есеп толық шешіліп, себебі қателер журналына жазылады.",
        ru: "Есть измеримое правило выхода: примерно через десять минут задача откладывается, написанный код не удаляется, а оставшееся время отдаётся непрочитанной задаче. После соревнования эта задача дорешивается до конца, а причина записывается в журнал ошибок.",
      },
    ],
  },
];
