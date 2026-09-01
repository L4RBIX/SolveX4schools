import type { LessonBlock } from "../../types";

/**
 * Lesson m9.l3 · «Жарыстан кейінгі талдау» — upsolving, and the error journal
 * that turns into a checklist. PDF p.10, May. Skill: `contest.upsolving`.
 *
 * Four clauses of the programme drive every block below, and all four are on
 * p.10.
 *
 *   «әр жарыстан кейін барлық есепті ҮШ КҮН ІШІНДЕ толық шешу» — the practice
 *   paragraph. Not «understand the analysis»: solve, submit, get it accepted.
 *   `b1` states the rule with the programme's own three days, and `b6` and `b7`
 *   are the two problems from yesterday's contest that are being finished.
 *
 *   «тек дұрыс жол ғана емес, тұйыққа тірелу мен кері қайтулар да көрсетіледі»
 *   — the format of the teacher's analysis. This is unusual enough to honour
 *   literally, so `b2` walks into TWO dead ends before it reaches the answer,
 *   and says out loud why each was abandoned. Its first wrong idea fails on the
 *   worked example's own sample, which is the cheapest possible place for a
 *   learner to watch an idea die.
 *
 *   «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер
 *   алдындағы тексеру тізіміне айналады» — the journal. `b1` gives the three
 *   fields of an entry, `b4` makes the learner tell a usable entry from three
 *   unusable ones, `b5` has them write one, and `b8` collects them into the
 *   checklist the sentence promises.
 *
 *   «апта сайын ескі есептерді көмексіз қайта орындау» — the weekly unaided
 *   re-solve, which is `VerifyBlock.mode: "delayed_resolve"`, the fifth of the
 *   five verification methods (p.6). `b3` is it, and May is the only month
 *   where it belongs.
 *
 * ## What this lesson does NOT do
 *
 * It does not build an error dictionary. `schools/learning/error-dictionary.ts`
 * already does that, and it does it by *reading*: it offers the mistakes the
 * ledger recorded, shows the author's own `diagnosticMapping.justification`
 * verbatim, and never composes a sentence about a learner. So the content's
 * part is the half no module can do — teaching a fourteen-year-old to write the
 * words. `b1` says exactly this, in the same division of labour the module
 * enforces: the platform offers the mistake, the learner writes the entry.
 *
 * ## The spine: yesterday's contest
 *
 * C is analysed (`b2`), D is finished from the wreckage the clock left (`b6`),
 * E is solved from scratch (`b7`). Three problems, three months of the year —
 * C is October's single traversal with two accumulators, D is January's two
 * borders, E is February's «барлық нұсқаны тексеру». «Бұл айда жаңа тақырып
 * жоқ», so each block's comment names the month and the technique, and a
 * problem that needed anything else would be out of scope however good it was.
 *
 * ## Every input carries its own count, and that is a C++ decision
 *
 * The Python originals read a bare line of numbers, because `input().split()`
 * makes the count free. In C++ reading a line whose length is not given needs
 * `while (cin >> x)`, which is an idiom the year has never shown, and this month
 * may not introduce one. So each problem here states n on its own first line and
 * the learner writes the `for` loop the year has taught since October. The
 * exception is `m9.l2.b6`, where the learner only READS the program and the
 * answer format is the four numbers themselves.
 *
 * ## `long long`, worked out rather than assumed
 *
 * Both written problems here were checked against `int` by arithmetic, not by
 * habit, because a comment that guesses is worse than no comment.
 *
 *   `b6`: the running total is bounded by S + max a[i] — the window shrinks the
 *   moment it passes S — so it never exceeds 2 · 10⁹, which fits `int` by seven
 *   per cent. `long long` there is prudence, not necessity, and the block does
 *   not punish an `int`.
 *
 *   `b7`: 1000 houses at up to 2 · 10⁹ apart is 2 · 10¹², eighty times past what
 *   `int` holds, and nothing in the prompt says so — the stated bounds are the
 *   only warning, exactly as they are in a real contest, and `m9.l2.b1` is where
 *   the learner was told to read them for that. `M9_L3_B7_WIDE_INPUT` is the
 *   hidden case that charges for it: a thousand coordinates at the two ends of
 *   the range, whose answer is 10¹². A learner who writes `int` gets a right
 *   algorithm and a wrong answer there, which is the failure this month exists
 *   to make familiar.
 *
 * ## The structural requirement, and which of the three honest options
 *
 * `b6` and `b7` both have a shape in mind — a window whose left border moves,
 * and a candidate loop over the houses. Output comparison sees neither: a
 * program that recomputes every window from scratch prints the same numbers, and
 * so does one that sorts and takes the median. Both prompts therefore take
 * **option 2 of the authoring contract — guidance, graded on the answer**, and
 * both say so in the prompt itself. Option 1 was genuinely unavailable at these
 * input sizes — see the note on `M9_L3_B6_LARGE_INPUT`, which used to be a
 * complexity guard and, under C++, is not one any more — and option 3 would have
 * spent the lesson's one written block on complexity instead of on the journal
 * entry, which is the objective the month names. `b7`'s «n ≤ 1000, демек
 * 1 000 000 қадам» is a statement that the straightforward method FITS, not a
 * rule that it must be used.
 *
 * ## Two defects the October review found, and where they were avoided here
 *
 * The support twin `b7s` reorders a program that appears on no other card the
 * support route receives: `b7` is core+advanced, and support meets this problem
 * for the first and only time at `b7s`. Nothing is transcribed.
 *
 * Its lines cannot be ordered by looking at the braces alone. The two braces
 * that ARE on their own cards fix the outer loop's extent and nothing else;
 * inside it three cards sit at the same indent and their order is the whole
 * exercise — putting the `if` before the inner loop compiles, runs, and answers
 * wrongly, and so does hoisting `total = 0` out of the outer loop.
 *
 * ## Where a diagnostic mapping is deliberately absent
 *
 * Only `b4`'s option o4 carries one, and the comment on that block argues why
 * the other two wrong options get none. A lesson about an error journal is the
 * last place to file a guess about a child's mind as a fact — the justification
 * on o4 is the text the dictionary will show them, verbatim, months later.
 */

const P = 10; // PDF page for all of May

/**
 * A large input for `m9.l3.b6`, and an honest note about what it no longer does.
 *
 * Under Python this was a complexity guard and the file said so: 8 000 ones with
 * S = 7 999 makes the window never shrink, so the two-pointer reference did one
 * pass in 0.09 s while the all-subarrays scan did ~3.2 · 10⁷ steps and took
 * 12.37 s against a 5 s budget.
 *
 * Re-measured under C++17 the same two programs on the same input take, as
 * medians of nine runs, **0.012 s and 0.071 s at -O2** — and, at the -O0 Judge0
 * actually grades at, **0.015 s and 0.158 s.** The quadratic scan is 78 times
 * faster than CPython managed at -O0 and 174 times at -O2, so 3.2 · 10⁷ steps is
 * a rounding error against a 5 s limit even unoptimised: the naive sits a factor
 * of thirty-one inside the budget on the engine that grades a child.
 *
 * There is no way to restore the guard through stdin: at two bytes a
 * value `EXECUTION_LIMITS.maxStdinBytes` (16 KiB) caps a case at about 8 190
 * numbers, so ~3 · 10⁷ operations is the most a naive solution can be made to do
 * here, and in C++ that is fast. Restoring it would mean generating the data
 * inside the program from a seed, which is what `m9.c1.p4` and `m9.c4.p3` now
 * do — and doing it here would rewrite the partial program this block hands the
 * learner, which is the block's whole point.
 *
 * So the case stays, and its job is stated correctly: it is the stated ceiling
 * actually exercised — 8 000 values read, a window that spans almost the whole
 * input, and an answer of 7 999 that no small case reaches. It does not
 * distinguish the two-pointer solution from the quadratic one, and the prompt
 * never claimed it did: the shape is guidance there, graded on the answer.
 *
 * `tests/school/may-complexity-guards.test.ts` is where that is held to. It
 * used to assert the separation; it now asserts its absence — that the
 * quadratic scan answers this very case correctly — so the retraction above is
 * executable rather than a comment nobody re-runs.
 *
 * 16 010 bytes with the newline `runCases` appends — inside
 * `EXECUTION_LIMITS.maxStdinBytes` (16 384).
 */
const M9_L3_B6_LARGE_INPUT = `8000 7999\n${"1 ".repeat(7999)}1`;

/**
 * The case that makes `m9.l3.b7` need `long long`, and the only one that can.
 *
 * A thousand houses, five hundred at each end of the stated coordinate range.
 * Wherever the stop is put, five hundred students walk 2 · 10⁹ each, so the
 * answer is 10¹² — four hundred and sixty times what `int` holds. Every other
 * case in that block fits `int` comfortably, including
 * "2 / -1000000000 1000000000", whose answer of 2 · 10⁹ lands seven per cent
 * inside the ceiling; without this one the block would state a bound it never
 * charged anybody for.
 *
 * 11 505 bytes, well inside `EXECUTION_LIMITS.maxStdinBytes` (16 384).
 */
const M9_L3_B7_WIDE_INPUT = `1000\n${"-1000000000 1000000000 ".repeat(499)}-1000000000 1000000000`;

export const M9_L3: LessonBlock[] = [
  {
    id: "m9.l3.b1",
    type: "concept",
    skillRefs: ["contest.upsolving"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Үш күн және үш жол",
      ru: "Три дня и три строки",
    },
    /* The three days and the journal are both the programme's, quoted on p.10.
       The three FIELDS of an entry are ours: the PDF says the journal becomes a
       pre-submission checklist and says nothing about what a line looks like,
       and «мұқият боламын» is what an entry becomes when nobody says. */
    body: {
      kk: "Жарыс бітті. Шықпаған есеп — жоғалған ұпай емес, әлі алынбаған ұпай.\n\nЖарыс кезінде сен уақыт қысымымен ойлайсың: сағат жүріп тұр, әр минут басқа есептен ұрланады. Талдаудан кейін сол есеп мүлде басқа жағдайға түседі — қай жерде тұрып қалғаның белгілі, уақыт тапшы емес, ал шешім жолы дауыстап талданды. Сондықтан жарыстан кейінгі есеп жарыс үстіндегіден көбірек үйретеді: жарыста сен білетініңді ғана қолданасың, ал талдаудан кейін білмегеніңді меңгересің.\n\nЕреже қысқа: әр жарыстан кейін барлық есепті үш күн ішінде толық шешіп шығу. «Түсіндім» жеткіліксіз — код жазылып, жіберіліп, қабылдануы керек. «Түсінемін» мен «жаза аламын» арасындағы қашықтық — жарыста жоғалтқан ұпайдың дәл өзі.\n\nЕкінші бөлігі — қателер журналы. Әр жазба үш жолдан тұрады:\n\n1. Не істедім? Қандай әдісті таңдадым, кодта нақты не жаздым.\n2. Не дұрыс болмады? Қай жерде және қандай кірісте бұзылды.\n3. Келесіде нені тексеремін? Жіберер алдында өзіме қоятын бір нақты сұрақ.\n\nҮшінші жол — ең маңыздысы, өйткені журнал есте сақтау үшін емес, тексеру үшін жазылады. Жыл соңында сол үшінші жолдардың жиынтығы сенің жеке тексеру тізімің болады.\n\nПлатформа сенің қателеріңді жинап отырады және журналға қосуға болатындарын ұсынады. Бірақ сөзді сен жазасың: не істегеніңді сенен басқа ешкім білмейді.",
      ru: "Соревнование закончилось. Нерешённая задача — это не потерянные очки, а очки, которые ты ещё не взял.\n\nВо время соревнования ты думаешь под давлением времени: часы идут, каждая минута отнята у другой задачи. После разбора та же задача попадает совсем в другие условия — известно, где именно ты застрял, время не давит, а путь к решению проговорили вслух. Поэтому задача после соревнования учит большему, чем во время него: на соревновании ты применяешь то, что уже знаешь, а после разбора осваиваешь то, чего не знал.\n\nПравило короткое: после каждого соревнования дорешать все задачи в течение трёх дней. «Я понял» — недостаточно: код должен быть написан, отправлен и принят. Расстояние между «понимаю» и «умею написать» — это ровно те очки, которые ты потерял на соревновании.\n\nВторая часть — журнал ошибок. Каждая запись состоит из трёх строк:\n\n1. Что я сделал? Какой метод выбрал, что именно написал в коде.\n2. Что пошло не так? В каком месте и на каком входе сломалось.\n3. Что я проверю в следующий раз? Один конкретный вопрос к себе перед отправкой.\n\nТретья строка — самая важная, потому что журнал пишется не для памяти, а для проверки. К концу года набор таких третьих строк и становится твоим личным списком проверок.\n\nПлатформа собирает твои ошибки и предлагает те, которые можно добавить в журнал. Но слова пишешь ты: что именно ты делал, кроме тебя, не знает никто.",
    },
  },
  {
    /*
     * C from yesterday's contest, reasoned through the way the teacher does it
     * out loud — «тек дұрыс жол ғана емес, тұйыққа тірелу мен кері қайтулар да
     * көрсетіледі» (p.10), so there are two wrong turns here and both are
     * named, refuted and abandoned in the steps.
     *
     * OCTOBER, and only October: one left-to-right traversal carrying two
     * accumulators — «осы сәтке дейінгі ең төмен баға» and «ең үлкен пайда»
     * (m2.l5, «жинақтаушы айнымалы»). No new technique, which is May's rule.
     *
     * The first dead end — max minus min — is chosen because it FAILS ON THE
     * SAMPLE PRINTED IN THE PROBLEM: `7 2 8 1 5` gives 7 by that rule and 6 by
     * the truth. A wrong idea that survives the sample teaches a learner to
     * trust samples; one that dies on it teaches them to test.
     *
     * The order of the two `if`s in the code is the point of step 6 and is the
     * kind of thing an analysis exists to say out loud: update `best` first,
     * then `low`, or the program sells on the same day it buys.
     *
     * Prices are bounded at 10⁹ and the answer is a DIFFERENCE of two of them,
     * so everything here fits in `int` — the one problem in this lesson where it
     * does, and step 4's arithmetic says so rather than leaving it to luck.
     */
    id: "m9.l3.b2",
    type: "worked_example",
    skillRefs: ["contest.upsolving", "loops.accumulator", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Кеше шықпаған есеп: C",
      ru: "Задача C, которая вчера не вышла",
    },
    problem: {
      kk: "C. Ең үлкен пайда.\n\nБірінші жолда n саны беріледі (2 ≤ n ≤ 200 000), екінші жолда бос орынмен бөлінген n бүтін сан — тауардың n күндегі бағасы (1 ≤ a[i] ≤ 1 000 000 000). Тауарды бір күні сатып алып, кейінгі бір күні сатасың: сату күні сатып алу күнінен кейін болуы міндетті. Пайда — сату бағасы мен сатып алу бағасының айырмасы.\n\nЕң үлкен пайданы шығар. Бағалар күн сайын түсіп отырса, ең үлкен пайда теріс болады — сонда да сол теріс санды шығар.\n\nМысал: `5` және `7 2 8 1 5` үшін жауап 6.",
      ru: "C. Наибольшая прибыль.\n\nВ первой строке дано число n (2 ≤ n ≤ 200 000), во второй — n целых чисел через пробел, цена товара в каждый из n дней (1 ≤ a[i] ≤ 1 000 000 000). Ты покупаешь товар в один день и продаёшь в один из следующих: день продажи обязан быть позже дня покупки. Прибыль — это разность между ценой продажи и ценой покупки.\n\nВыведи наибольшую прибыль. Если цена падает каждый день, наибольшая прибыль окажется отрицательной — тогда выведи это отрицательное число.\n\nПример: для `5` и `7 2 8 1 5` ответ 6.",
    },
    steps: [
      {
        kk: "Сұрақты дәл тұжырымдаймыз. Бізге a[j] − a[i] айырмасының ең үлкені керек, әрі міндетті түрде i < j. Реті — есептің өзегі, оны ұмытсақ басқа есеп шығарамыз.",
        ru: "Сформулируем вопрос точно. Нужна наибольшая разность a[j] − a[i], причём обязательно i < j. Порядок дней — это и есть суть задачи; забыв о нём, мы решим другую задачу.",
      },
      {
        kk: "Бірінші ой: ең үлкен баға мен ең кіші бағаны тауып, айырмасын алу. Мысалда ең үлкені 8, ең кішісі 1, айырмасы 7.",
        ru: "Первая мысль: найти самую большую и самую маленькую цену и взять их разность. В примере это 8 и 1, разность равна 7.",
      },
      {
        kk: "Тұйық. Мысалдағы 1 саны 8-ден кейін тұр, яғни бұл ереже әлі сатып алынбаған тауарды сатады. Дұрыс жауап 6 еді, ал ереже 7 берді — идея өзінің үлгі-мысалында құлады. Бас тартамыз.",
        ru: "Тупик. Единица в примере стоит после восьмёрки, то есть это правило продаёт товар, который ещё не куплен. Верный ответ 6, а правило дало 7 — идея сломалась на собственном примере задачи. Отказываемся от неё.",
      },
      {
        kk: "Екінші ой: тізімді реттеп алсақ, ең кіші мен ең үлкенді табу оңай болады. Бұл да жарамайды — реттеу күндердің ретін жойып жібереді, ал есеп дәл сол ретке сүйенеді. Кері қайтамыз.",
        ru: "Вторая мысль: если отсортировать список, найти минимум и максимум станет легко. Тоже не годится — сортировка уничтожает порядок дней, а задача держится именно на нём. Возвращаемся назад.",
      },
      {
        kk: "Дұрыс жол. Сату күнін j деп бекітейік. Сонда ең тиімді сатып алу күні — j-ден бұрынғы күндердің ішіндегі ең арзаны. Демек векторды солдан оңға бір рет жүріп өтіп, «осы сәтке дейінгі ең төмен баға» деген бір айнымалыны ұстап отырсақ жеткілікті. Бұл — қазандағы жинақтаушы айнымалы, жаңа тәсіл емес.",
        ru: "Верный путь. Зафиксируем день продажи j. Тогда самый выгодный день покупки — самый дешёвый из дней до j. Значит, достаточно один раз пройти вектор слева направо, храня одну переменную: «самая низкая цена на этот момент». Это октябрьский накопитель, а не новый приём.",
      },
      {
        kk: "Реті маңызды. Әр қадамда алдымен бүгінгі бағамен сатамыз, содан кейін ғана ең төмен бағаны жаңартамыз. Керісінше жасасақ, тауарды сатып алған күні бірден сатып жіберер едік, ал шарт бойынша сату кейінгі күні болуы керек. Жауаптың бастапқы мәні де 0 емес: бағалар түсіп отырса дұрыс жауап теріс, сондықтан `best` бірінші мүмкін мәміледен, яғни a[1] − a[0]-ден басталады.",
        ru: "Порядок важен. На каждом шаге сначала продаём по сегодняшней цене и только потом обновляем самую низкую. Сделав наоборот, мы продали бы товар в тот же день, когда купили, а по условию продажа должна быть позже. Начальное значение ответа тоже не 0: при падающих ценах верный ответ отрицателен, поэтому `best` начинается с первой возможной сделки, то есть с a[1] − a[0].",
      },
      {
        kk: "Түрі туралы бір сөз. Бағалар миллиардқа дейін жетеді, ал жауап — екі бағаның айырмасы, сондықтан ол да миллиардтан аспайды және `int` ішіне еркін сыяды. Мұнда `long long` керек емес — бірақ бұл тексерілген факт, болжам емес: шектеулерді осылай оқу керек.",
        ru: "Одно слово о типе. Цены доходят до миллиарда, а ответ — это разность двух цен, поэтому он тоже не больше миллиарда и свободно помещается в `int`. `long long` здесь не нужен — но это проверенный факт, а не догадка: именно так и читают ограничения.",
      },
    ],
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int low = a[0];\n" +
      "    int best = a[1] - a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] - low > best) best = a[i] - low;\n" +
      "        if (a[i] < low) low = a[i];\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    stdin: "5\n7 2 8 1 5",
    result: {
      kk: "`7 2 8 1 5` кірісінде бағдарлама 6 шығарады: 2-ге сатып алып, 8-ге сату. Бірінші ой 7 берер еді — айырмашылық дәл сол жерде.",
      ru: "На входе `7 2 8 1 5` программа выводит 6: купить по 2, продать по 8. Первая мысль дала бы 7 — вот в чём была разница.",
    },
  },
  {
    /*
     * The weekly unaided re-solve — «апта сайын ескі есептерді көмексіз қайта
     * орындау» (p.10), which is `delayed_resolve`, the fifth verification method
     * (p.6). The page cited is 10 rather than 6 on purpose: p.6 lists the mode,
     * but the sentence that makes this a WEEKLY habit belonging to May is on
     * p.10, and that is the sentence this block implements.
     *
     * DECEMBER: «сандарды реттеу» (m4, `sort.basic`) followed by October's
     * single traversal. Nothing else.
     *
     * ## Why the problem is new and the SHAPE is old
     *
     * «Көмексіз» is the whole point, and re-issuing a problem the learner
     * submitted in December invites them to open their own December submission
     * — which is help, and which no checker can see. A different question in the
     * same shape is the only version of «unaided» this platform can actually
     * honour, and the prompt says which month the shape comes from so the
     * learner knows where to look in their own head rather than in their own
     * history.
     *
     * The forgettable parts are duplicates and non-positive values, and both are
     * hidden cases.
     *
     * The degenerate programs, and the case that kills each:
     *   n + 1 without looking       → "2\n2 3" expects 1, it prints 3.
     *   the walk without sorting    → "4\n3 1 2 6" expects 4, it prints 3, and
     *                                 "6\n2 1 3 5 4 7" expects 6, it prints 3.
     *   `<=` instead of `==`, so a
     *   duplicate advances the answer → "3\n1 1 2" expects 3, it prints 4.
     *   the answer started at 0     → every case with a 1 in it.
     *   a loop one element short    → "5\n1 2 3 4 5" expects 6, it prints 5.
     */
    id: "m9.l3.b3",
    type: "verify",
    mode: "delayed_resolve",
    skillRefs: ["contest.upsolving", "sort.basic", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Апта сайынғы қайта шешу. Бұл есептің тәсілі — желтоқсаннан: алдымен ретте, содан кейін векторды басынан бір рет жүріп өт. Сұрақ жаңа, тәсіл ескі. Көмек сұрама және ескі шешімдеріңді ашпа — өз бетіңше жаз.\n\nБірінші жолда n саны беріледі (1 ≤ n ≤ 100 000), екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1 000 000 000-нан аспайды. Тізімде кездеспейтін ең кіші оң бүтін санды шығар. Оң сандар 1-ден басталады.\n\nМысал: `4` және `3 1 2 6` үшін жауап 4, ал `2` және `2 3` үшін жауап 1.\n\nТізімде бірдей сандар да, теріс сандар да, нөл де кездесуі мүмкін. Реттеу үшін `sort(a.begin(), a.end())` жеткілікті — оны желтоқсанда қолдандың.",
      ru: "Еженедельное повторное решение. Приём в этой задаче — декабрьский: сначала отсортируй, потом пройди вектор от начала ровно один раз. Вопрос новый, приём старый. Не проси помощи и не открывай свои старые решения — напиши сам.\n\nВ первой строке дано число n (1 ≤ n ≤ 100 000), во второй — n целых чисел через пробел, каждое по модулю не больше 1 000 000 000. Выведи наименьшее целое положительное число, которого нет в списке. Положительные числа начинаются с единицы.\n\nПример: для `4` и `3 1 2 6` ответ 4, а для `2` и `2 3` ответ 1.\n\nВ списке могут встретиться одинаковые числа, отрицательные числа и ноль. Для сортировки достаточно `sort(a.begin(), a.end())` — ты пользовался этим в декабре.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int ans = 1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] == ans) ans = ans + 1;\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 1 2 6", expectedOutput: "4" },
      { input: "2\n2 3", expectedOutput: "1" },
      /* Duplicates: a walk that advances on every element that is not larger
         than the answer counts the repeated 1 twice and reports 4. */
      { input: "3\n1 1 2", expectedOutput: "3", hidden: true },
      /* Zero and negatives, and 1 itself missing. */
      { input: "3\n-5 0 2", expectedOutput: "1", hidden: true },
      { input: "3\n-3 -2 -1", expectedOutput: "1", hidden: true },
      /* One number, twice: with 1 present and with 1 absent. */
      { input: "1\n1", expectedOutput: "2", hidden: true },
      { input: "1\n1000000000", expectedOutput: "1", hidden: true },
      /* No gap at all — the answer really is one past the end. */
      { input: "5\n1 2 3 4 5", expectedOutput: "6", hidden: true },
      /* Unsorted input where the gap is at the end, and where it is early. */
      { input: "6\n2 1 3 5 4 7", expectedOutput: "6", hidden: true },
      { input: "5\n1 3 3 3 4", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * Four entries about one and the same mistake — the one m9.l3.b6 is about,
     * so the card sits directly on the work the learner is about to do.
     *
     * o3 is the entry: method, symptom, and a question that can be asked in a
     * minute before the next submission.
     *
     * o4 CARRIES THE ONLY MAPPING, and it is the only one that can carry one.
     * o3 contains everything o4 contains and a check besides, so preferring o4
     * establishes exactly one thing: the learner believes the check is not part
     * of the entry. There is no second reading, because there is no other
     * respect in which o4 differs from the right answer.
     *
     * o1 gets none. «Мұқият болмағанмын» is chosen both by a learner who thinks
     * the journal records effort and by one who genuinely cannot reconstruct
     * what they did — the second is a memory problem, the first a
     * misunderstanding, and the answer alone does not say which.
     *
     * o2 gets none either. It is picked both by a learner who thinks an entry
     * names a topic rather than an action, and by one who reads «повторить тему»
     * as the concrete next step, which is a plan — just not a check. Two causes.
     *
     * o2 is also the longest option on the card, deliberately: the correct
     * answer must not be findable by counting words.
     */
    id: "m9.l3.b4",
    type: "multiple_choice",
    skillRefs: ["contest.upsolving"],
    sourceType: "product-authored",
    prompt: {
      kk: "Кешегі жарыстың D есебінде терезенің сол шекарасын жылжытуды ұмытып кеттің: қосынды шектен асып кетсе де терезе қысқармады, сондықтан бағдарлама қандай кіріс берсең де n шығарды. Осы қате туралы журналға жазба жазу керек. Төмендегі төртеуінің қайсысы жазба ретінде пайдалы — яғни келесі жолы шешімді жіберер алдында соған қарап нақты бір нәрсені тексере аласың?",
      ru: "Во вчерашней задаче D ты забыл двигать левую границу окна: сумма выходила за предел, а окно не сокращалось, поэтому программа на любом входе выводила n. Про эту ошибку нужно сделать запись в журнале. Какая из четырёх записей полезна именно как запись — то есть по ней перед следующей отправкой действительно можно проверить что-то конкретное?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "D шықпады. Мұқият болмағанмын, келесіде зейін қойып істеймін.",
          ru: "D не получилась. Я был невнимателен, в следующий раз буду сосредоточеннее.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Жіберген шешімім қабылданбады. Мұндай есептер маған бұрын да қиын тиетін еді, шамасы терезе тақырыбын әлі жетік білмеймін; жазғы демалысқа дейін сол тақырыпты басынан бастап түгел қайталап шығуым керек.",
          ru: "Отправленное решение не приняли. Такие задачи мне и раньше давались тяжело, видимо, тему окна я знаю ещё нетвёрдо; надо будет до каникул повторить эту тему целиком, с самого начала.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Терезе есебінде оң шекараны жылжытып, қосындыны жинадым, ал қосынды шектен асқанда сол шекараны жылжытпадым — сондықтан жауап әрқашан n болып шықты. Келесіде: терезе есебін жіберер алдында «сол шекара қай жерде және қандай шартпен жылжиды?» деген сұраққа жауап беремін.",
          ru: "В задаче на окно я двигал правую границу и копил сумму, а когда сумма выходила за предел, левую границу не двигал — поэтому ответ всегда получался равным n. В следующий раз: перед отправкой задачи на окно отвечаю на вопрос «где и по какому условию сдвигается левая граница?».",
        },
      },
      {
        id: "o4",
        label: {
          kk: "D есебінде `left` айнымалысы орнында қалып қойған, терезе қысқармаған. Қате сол.",
          ru: "В задаче D переменная `left` осталась на месте, окно не сокращалось. Вот в чём была ошибка.",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      o4: {
        failureClass: "log_entry_without_check",
        justification:
          "o4 жазбасы қатенің себебін дұрыс атайды, бірақ онда келесі жолы орындалатын әрекет жоқ. o3-те дәл сол себеп бар және үстіне жіберер алдында қойылатын нақты сұрақ бар, яғни o4 — o3-тің тексерусіз қалған бөлігі. Сондықтан o4-ті таңдау журнал өткенді түсіндіру үшін жазылады деп ұғынуды көрсетеді, ал ол алдағы тексеру үшін жазылады.",
      },
    },
  },
  {
    /*
     * The lesson objective as a written piece, and it goes to all three routes:
     * «Қатенің себебін жазып қалдыру» is the objective, not an advanced extra.
     *
     * Three sub-answers, matching the three fields b1 states, and no more —
     * counted against the clock the way the authoring contract requires. The
     * marking points are what a teacher reads; nothing here is machine-scored,
     * and `explain` settles as `unknown` by design.
     */
    id: "m9.l3.b5",
    type: "explain",
    skillRefs: ["contest.upsolving"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Осы аптада өзің жіберген, бірақ қабылданбаған бір шешімді ал — жарыстан да, сабақтан да болуы мүмкін. Сол қате туралы журнал жазбасын жаз. Үш жол: (1) не істедім, (2) не дұрыс болмады және қандай кірісте, (3) келесі жолы жіберер алдында нені тексеремін. Үшінші жолды сұрақ түрінде жаз. Жауабыңды мұғалім оқиды.",
      ru: "Возьми одно своё решение за эту неделю, которое было отправлено, но не принято, — с соревнования или с урока. Напиши про эту ошибку запись в журнал. Три строки: (1) что я сделал, (2) что пошло не так и на каком входе, (3) что я проверю перед отправкой в следующий раз. Третью строку сформулируй вопросом. Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "Бірінші жол нақты әрекетті атайды: қандай әдіс таңдалды және кодта не жазылды. «Есепті шығардым» жеткіліксіз; «терезенің оң шекарасын жылжытып, қосындыны жинадым» — жеткілікті.",
        ru: "Первая строка называет конкретное действие: какой метод был выбран и что написано в коде. «Решал задачу» — недостаточно; «двигал правую границу окна и копил сумму» — достаточно.",
      },
      {
        kk: "Екінші жол қатенің қай жерде және неден көрінгенін көрсетеді: тексеру жүйесінен қандай хабар келді немесе қандай кірісте жауап бұзылды. Мүмкіндігінше нақты кіріс не нақты сан аталады.",
        ru: "Вторая строка показывает, где и на чём ошибка проявилась: какое сообщение пришло от проверяющей системы или на каком входе ответ сломался. По возможности назван конкретный вход или конкретное число.",
      },
      {
        kk: "Үшінші жол — жіберер алдында бір минутта орындауға болатын сұрақ. «Мұқият боламын» өлшенбейді; «бір элементті тізімде не шығады?», «шекарада `<` па, әлде `<=` ме?» немесе «қосындым `int`-ке сыя ма?» өлшенеді.",
        ru: "Третья строка — вопрос, на который перед отправкой можно ответить за минуту. «Буду внимательнее» неизмеримо; «что выведет программа на списке из одного элемента?», «на границе `<` или `<=`?» или «помещается ли моя сумма в `int`?» измеримо.",
      },
      {
        kk: "Жазба өзі туралы емес, істелген жұмыс туралы жазылған: «мен мұндайды түсінбеймін» емес, «мен мынаны жаздым, ол мынада бұзылды». Бұл — журналдың басты айырмашылығы.",
        ru: "Запись сделана не про себя, а про выполненную работу: не «я такое не понимаю», а «я написал вот это, и оно сломалось вот здесь». В этом главное отличие журнала.",
      },
    ],
  },
  {
    /*
     * D from yesterday's contest, finished from what the clock left behind.
     * «әр жарыстан кейін барлық есепті үш күн ішінде толық шешу» (p.10) — this
     * is that sentence as a task.
     *
     * JANUARY: «екі шекара әдісі» (m5.l5, `twopointers.core`), over October's
     * accumulator. No new technique.
     *
     * The starting program is genuinely partial, not a program with a bug
     * planted in it: it reads the input, walks the right border and accumulates
     * the sum, and stops there. It compiles, it runs, and it prints 0 on every
     * input — which is exactly what a half-written contest solution does, and
     * the prompt says so rather than pretending the learner has to discover it.
     *
     * The starting program appears on no other card in this month; it is not a
     * shortened copy of the reference solution but the reference solution's
     * first statements, which is what "the clock ran out" means.
     *
     * `total` is `long long` in the program the learner is handed, and that is
     * prudence rather than necessity: the window shrinks the moment the sum
     * passes S, so the total never exceeds S + max a[i] = 2 · 10⁹, which fits
     * `int` by seven per cent. The block does not punish an `int` and no comment
     * here pretends it does — the problem in this lesson that genuinely needs
     * `long long` is b7, and it has a case that says so.
     *
     * The degenerate programs, and the case that kills each:
     *   the left border never moves → "5 6 / 1 2 3 4 5" expects 3, it prints 5.
     *   `>=` where `>` belongs, so a
     *   window summing exactly to S
     *   is thrown away              → "3 6 / 1 2 3" expects 3, it prints 2.
     *   `right - left` without the
     *   +1                          → "1 1 / 1" expects 1, it prints 0.
     *   the shrink placed before the
     *   new element is added        → "5 6 / 1 2 3 4 5" expects 3, it prints 4.
     * The shortcut table's two window cases are both here: the answer being the
     * whole list ("4 10 / 1 2 3 4") and the answer being a single element
     * ("4 3 / 3 9 9 9", and again with that element last).
     *
     * One thing that is NOT a defect and is therefore not punished: writing
     * `if` instead of `while` for the shrink. A window that never shrinks is a
     * correct O(n) method for a longest-window question, and it answers every
     * case here correctly. Marking it wrong would be marking a good idea wrong.
     *
     * m9.l3.b4, four cards earlier, names this same missing shrink as the
     * mistake being journalled. That is not an answer left on screen: b4 shows
     * no program and this prompt states the method in its own words anyway. What
     * b4 cannot give away is the work — the `+ 1` in the length, and the
     * comparison that has to let a window summing to exactly S stand.
     */
    id: "m9.l3.b6",
    type: "modify_code",
    skillRefs: ["contest.upsolving", "twopointers.core", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "D. Ең ұзын бөлік.\n\nКеше жарыс аяқталғанда D есебінде сенде тек осы қалды. Бағдарлама кірісті оқиды, терезенің оң шекарасын жылжытады және қосындыны жинайды — бірақ сол шекара әлі мүлде қозғалмайды, жауап та жаңартылмайды, сондықтан ол қазір кез келген кіріске 0 шығарады. Аяқта.\n\nЕсеп шарты. Кіріс. Бірінші жолда бос орынмен бөлінген n мен S сандары (1 ≤ n ≤ 200 000, 1 ≤ S ≤ 1 000 000 000). Екінші жолда n оң бүтін сан, әрқайсысы 1-ден 1 000 000 000-ға дейін.\n\nШығыс. Бір бүтін сан: қосындысы S-тен аспайтын, қатар тұрған сандардың ең ұзын бөлігінің ұзындығы. Қосынды дәл S-ке тең болса, бөлік жарамды. Ондай бөлік мүлде болмаса, яғни әр сан жеке-жеке S-тен үлкен болса, 0 шығар.\n\nМысал. n = 5, S = 6 және `1 2 3 4 5` болғанда жауап 3 — бұл `1 2 3` бөлігі.\n\nӘдіс қаңтардан таныс: екі шекара. Оң шекара әр қадамда бір орынға жылжиды, ал қосынды S-тен асып кетсе, сол шекара қосынды қайта сыйғанша алға тартылады. Бұл — кеңес, талап емес: тапсырма шыққан сан бойынша тексеріледі.",
      ru: "D. Самый длинный участок.\n\nВчера, когда соревнование закончилось, от задачи D у тебя осталось только это. Программа читает вход, двигает правую границу окна и копит сумму — но левая граница пока не двигается вообще, и ответ не обновляется, поэтому сейчас она на любом входе выводит 0. Доделай её.\n\nУсловие. Вход. В первой строке через пробел даны n и S (1 ≤ n ≤ 200 000, 1 ≤ S ≤ 1 000 000 000). Во второй строке n целых положительных чисел, каждое от 1 до 1 000 000 000.\n\nВыход. Одно целое число: длина самого длинного участка из подряд идущих чисел, сумма которого не превышает S. Если сумма равна ровно S, участок годится. Если такого участка нет вовсе, то есть каждое число по отдельности больше S, выведи 0.\n\nПример. При n = 5, S = 6 и `1 2 3 4 5` ответ 3 — это участок `1 2 3`.\n\nПриём знаком с января: две границы. Правая граница на каждом шаге сдвигается на одну позицию, а если сумма вышла за S, левая подтягивается вперёд, пока сумма снова не поместится. Это совет, а не требование: задание проверяется по выведенному числу.",
    },
    code:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    long long limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int left = 0;\n" +
      "    long long total = 0;\n" +
      "    int best = 0;\n" +
      "    for (int right = 0; right < n; right++) {\n" +
      "        total = total + a[right];\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    long long limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int left = 0;\n" +
      "    long long total = 0;\n" +
      "    int best = 0;\n" +
      "    for (int right = 0; right < n; right++) {\n" +
      "        total = total + a[right];\n" +
      "        while (total > limit) {\n" +
      "            total = total - a[left];\n" +
      "            left = left + 1;\n" +
      "        }\n" +
      "        if (right - left + 1 > best) best = right - left + 1;\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 6\n1 2 3 4 5", expectedOutput: "3" },
      { input: "3 1\n5 5 5", expectedOutput: "0" },
      /* The answer is the whole list. */
      { input: "4 10\n1 2 3 4", expectedOutput: "4", hidden: true },
      /* The answer is a single element — first, then last. */
      { input: "4 3\n3 9 9 9", expectedOutput: "1", hidden: true },
      { input: "4 3\n9 9 9 3", expectedOutput: "1", hidden: true },
      /* Exactly on the boundary, and one step either side of it. */
      { input: "3 6\n1 2 3", expectedOutput: "3", hidden: true },
      { input: "3 5\n1 2 3", expectedOutput: "2", hidden: true },
      /* The smallest legal input, with the single number fitting and not. */
      { input: "1 1\n1", expectedOutput: "1", hidden: true },
      { input: "1 1\n2", expectedOutput: "0", hidden: true },
      /* One huge number in the middle: the window has to be emptied completely
         and rebuilt, which one subtraction per step will not do. */
      { input: "6 3\n1 1 1 10 1 1", expectedOutput: "3", hidden: true },
      /* The top of the stated range: every element is exactly S, so the window
         is emptied and refilled on every step and the running total reaches its
         own ceiling of 2 · 10⁹. */
      {
        input: "5 1000000000\n1000000000 1000000000 1000000000 1000000000 1000000000",
        expectedOutput: "1",
        hidden: true,
      },
      /* The stated ceiling, actually exercised: 8 000 values and a window that
         spans almost all of them. See M9_L3_B6_LARGE_INPUT — under C++ this no
         longer separates the quadratic solution from the two-pointer one, and
         the note says so rather than the comment claiming otherwise. */
      { input: M9_L3_B6_LARGE_INPUT, expectedOutput: "7999", hidden: true },
    ],
  },
  {
    /*
     * E — the problem nobody solved yesterday, stated the way a contest states
     * one: name, story, Кіріс, Шығыс, Мысал, and no hint about which month it
     * comes from beyond the sentence that says the straightforward method fits.
     *
     * FEBRUARY: «барлық нұсқаны тексеру» (m6, `enumerate.all`). The stop may
     * only stand at a house, so there are exactly n candidates; each costs n
     * distances; n ≤ 1000 makes that 1 000 000 steps, which at C++'s ~10⁸
     * operations a second is a hundredth of a second. Sorting and taking the
     * middle house is equally correct and equally taught, and both pass.
     *
     * THE STRUCTURAL REQUIREMENT: none is stated, because none could be
     * enforced. The prompt says the double loop fits; it does not say it is
     * required, and the block is graded on the printed number. Option 2 of the
     * authoring contract, argued in the file header.
     *
     * `long long` IS required and the bounds are the only warning: 1000 houses
     * at up to 2 · 10⁹ apiece is 2 · 10¹². Every small case here fits `int` —
     * "2 / -1000000000 1000000000" answers 2 · 10⁹, which lands seven per cent
     * inside the ceiling — so `M9_L3_B7_WIDE_INPUT` is the case that charges for
     * it, and it is the only one that does.
     *
     * The degenerate programs, and the case that kills each:
     *   the average instead of a house
     *   as the stop                  → "4 / 1 2 3 10" expects 10, it prints 12,
     *                                  and "4 / 1 1 1 100" expects 99, it prints
     *                                  148.
     *   always the smallest house    → "4 / 1 2 3 10" expects 10, it prints 12.
     *   always the largest house     → the same case, it prints 24.
     *   a candidate loop that misses
     *   the last house               → "3 / 1 9 5" expects 8, it prints 12.
     *   a candidate loop that misses
     *   the first house              → "3 / 5 1 9" expects 8, it prints 12.
     *   an inner loop that misses the
     *   last student                 → "4 / 1 1 1 100" expects 99, it prints 0.
     *   the distance without `abs`   → "4 / 1 2 3 10" prints −24.
     *   `best` started at 0          → every case with a non-zero answer.
     * Both ends of the shortcut table are covered: the answer sits at the last
     * position in "3 / 1 9 5" and at the first in "3 / 5 1 9".
     *
     * Support meets the same problem at m9.l3.b7s and never sees this card.
     */
    id: "m9.l3.b7",
    type: "write_code",
    skillRefs: ["contest.upsolving", "enumerate.all", "perf.time_estimate", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "E. Автобус аялдамасы.\n\nБір түзу көшенің бойында n оқушының үйі тұр. Мектеп сол көшеге бір автобус аялдамасын қояды, бірақ аялдама міндетті түрде оқушылардың біреуінің үйінің дәл тұсында болуы керек — басқа орынға қоюға болмайды. Әр оқушы үйінен аялдамаға дейін көше бойымен жүреді, оның жүретін жолы — үйі мен аялдаманың арақашықтығы.\n\nАялдаманы барлық оқушының жүретін жолының қосындысы ең аз болатындай орналастыр.\n\nКіріс. Бірінші жолда n саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан — үйлердің координаталары, әрқайсысының модулі 1 000 000 000-нан аспайды. Екі үй бір координатада тұруы мүмкін.\n\nШығыс. Бір бүтін сан: жолдардың ең аз қосындысы.\n\nМысал. n = 4 және `1 2 3 10` болғанда жауап 10: аялдама 2 координатасында тұрса, жолдар 1 + 0 + 1 + 8 = 10 болады. Ал 1 координатасында 0 + 1 + 2 + 9 = 12 шығады.\n\nn ең үлкені 1000 болғандықтан, әр үйді аялдама орны ретінде кезекпен сынап көру 1000 · 1000 = 1 000 000 қадам ғана алады, ал C++ бір секундта шамамен 100 000 000 қадам жасайды. Есеп шыққан сан бойынша тексеріледі: қай жолмен шығарғаныңды тексеру жүйесі көрмейді.",
      ru: "E. Автобусная остановка.\n\nВдоль одной прямой улицы стоят дома n учеников. Школа ставит на этой улице одну автобусную остановку, но остановка обязана находиться ровно напротив дома одного из учеников — в другом месте её поставить нельзя. Каждый ученик идёт от своего дома до остановки вдоль улицы, и его путь равен расстоянию между домом и остановкой.\n\nПоставь остановку так, чтобы сумма путей всех учеников была наименьшей.\n\nВход. В первой строке число n (1 ≤ n ≤ 1000). Во второй строке n целых чисел через пробел — координаты домов, каждая по модулю не больше 1 000 000 000. Два дома могут стоять в одной координате.\n\nВыход. Одно целое число: наименьшая сумма путей.\n\nПример. При n = 4 и `1 2 3 10` ответ равен 10: если остановка стоит в координате 2, пути дают 1 + 0 + 1 + 8 = 10. А в координате 1 получилось бы 0 + 1 + 2 + 9 = 12.\n\nПоскольку n не больше 1000, перебор всех домов как места остановки занимает всего 1000 · 1000 = 1 000 000 шагов, а C++ успевает около 100 000 000 шагов в секунду. Задача проверяется по выведенному числу: каким путём ты его получил, проверяющая система не видит.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    long long best = -1;\n" +
      "    for (int j = 0; j < n; j++) {\n" +
      "        long long total = 0;\n" +
      "        for (int i = 0; i < n; i++) total = total + abs(a[i] - a[j]);\n" +
      "        if (best == -1 || total < best) best = total;\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n1 2 3 10", expectedOutput: "10" },
      { input: "1\n7", expectedOutput: "0" },
      /* The best house is the LAST one, then the FIRST one. */
      { input: "3\n1 9 5", expectedOutput: "8", hidden: true },
      { input: "3\n5 1 9", expectedOutput: "8", hidden: true },
      /* One far-away student: an inner loop that stops short reports 0. */
      { input: "4\n1 1 1 100", expectedOutput: "99", hidden: true },
      { input: "5\n2 2 2 2 100", expectedOutput: "98", hidden: true },
      /* Every house in the same place — the answer is 0 and not a fallback. */
      { input: "5\n7 7 7 7 7", expectedOutput: "0", hidden: true },
      /* Duplicates in two clusters, and negative coordinates. */
      { input: "4\n-5 -5 5 5", expectedOutput: "20", hidden: true },
      { input: "1\n-1000000000", expectedOutput: "0", hidden: true },
      /* The two ends of the stated range at once. */
      { input: "2\n-1000000000 1000000000", expectedOutput: "2000000000", hidden: true },
      { input: "6\n1 2 3 4 5 6", expectedOutput: "9", hidden: true },
      /* The stated bound, actually charged for: 10¹² does not fit `int`.
         See M9_L3_B7_WIDE_INPUT. */
      { input: M9_L3_B7_WIDE_INPUT, expectedOutput: "1000000000000", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m9.l3.b7 — «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6). Same problem, same sample, same
     * numbers; assembled instead of written from an empty editor.
     *
     * The support route never receives m9.l3.b7, so this program is on no card
     * this learner has seen, and the prompt restates the whole problem rather
     * than pointing at «the task above», which on this route is the journal
     * entry and not a problem at all.
     *
     * ## What the braces give away, and what they do not
     *
     * In Python the argument was about indentation; in C++ it is about braces,
     * and the honest version is shorter. The frame — the includes, `main`, and
     * the reading loop — is one card, because reordering `#include` against
     * `int main()` is not a decision about this problem. `r3` opens the outer
     * loop and `r7` closes it, so the extent of that loop is given; everything
     * else is not.
     *
     * The three cards inside the loop (`r4`, `r5`, `r6`) sit at the same indent
     * and their order is the exercise: hoisting `total = 0` out of the loop
     * compiles and answers wrongly, and putting the `if` before the inner loop
     * compiles and answers wrongly. Six orderings, one correct.
     */
    id: "m9.l3.b7s",
    type: "reorder_code",
    skillRefs: ["contest.upsolving", "enumerate.all", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Жолдарды дұрыс ретке қой.\n\nБір түзу көшенің бойында n оқушының үйі тұр; координаталары екінші жолда беріледі. Автобус аялдамасы міндетті түрде осы үйлердің біреуінің тұсында тұруы керек. Бағдарлама әр үйді аялдама орны ретінде кезекпен сынап көріп, барлық оқушының жүретін жолының қосындысын есептеуі және сол қосындылардың ең кішісін шығаруы керек. `1 2 3 10` үшін жауап 10 — аялдама 2 координатасында.\n\n`abs(a[i] - a[j])` — i-үй мен j-үйдің арақашықтығы. `best = -1` дегені «әзірге бірде-бір нұсқа қаралған жоқ»: сондықтан бірінші есептелген қосынды `best`-ке сөзсіз жазылады. Бірінші карта дайын: онда жақтау мен кірісті оқу тұр.",
      ru: "Расставь строки по порядку.\n\nВдоль одной прямой улицы стоят дома n учеников; их координаты даны во второй строке. Автобусная остановка обязана стоять напротив одного из этих домов. Программа должна по очереди примерить каждый дом как место остановки, посчитать сумму путей всех учеников и вывести наименьшую из этих сумм. Для `1 2 3 10` ответ равен 10 — остановка в координате 2.\n\n`abs(a[i] - a[j])` — это расстояние между домом i и домом j. Значение `best = -1` означает «пока не рассмотрен ни один вариант»: поэтому первая же посчитанная сумма записывается в `best` без сравнения. Первая карточка готова: в ней рамка и чтение ввода.",
    },
    lines: [
      {
        id: "r1",
        code:
          "#include <bits/stdc++.h>\n" +
          "using namespace std;\n" +
          "\n" +
          "int main() {\n" +
          "    int n;\n" +
          "    cin >> n;\n" +
          "    vector<long long> a(n);\n" +
          "    for (int i = 0; i < n; i++) cin >> a[i];",
      },
      { id: "r2", code: "    long long best = -1;" },
      { id: "r3", code: "    for (int j = 0; j < n; j++) {" },
      { id: "r4", code: "        long long total = 0;" },
      { id: "r5", code: "        for (int i = 0; i < n; i++) total = total + abs(a[i] - a[j]);" },
      { id: "r6", code: "        if (best == -1 || total < best) best = total;" },
      { id: "r7", code: "    }" },
      { id: "r8", code: "    cout << best;\n    return 0;\n}" },
    ],
    correctOrder: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"],
  },
  {
    /*
     * «Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді жіберер
     * алдындағы тексеру тізіміне айналады» (p.10). This block is the sentence's
     * second half: the journal already exists by now, and what the programme
     * asks for is the step that turns it into something used before a submission
     * rather than read after one.
     *
     * Not an attempt block, and deliberately not graded — three checks a learner
     * chose themselves are worth more than three a teacher assigned, and the
     * only honest way to find out whether they are used is to watch the next
     * contest.
     */
    id: "m9.l3.b8",
    type: "reflection",
    skillRefs: ["contest.upsolving"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Жыл бойы жіберген қателеріңді еске түсір. Солардың ішінен өзің ең жиі қайталайтын үшеуін таңда да, әрқайсысын жіберер алдында бір минутта орындауға болатын сұраққа айналдыр — мысалы, «бір элементті тізімде не шығады?», «шекарада `<` па, әлде `<=` ме?» немесе «қосындым `int`-ке сыя ма, әлде `long long` керек пе?». Осы үшеуі — сенің жеке тексеру тізімің. Оны қайда сақтайсың, және «жіберу» түймесін баспас бұрын оған қарауды қалай ұмытпайсың?",
      ru: "Вспомни ошибки, которые ты делал в течение года. Выбери три, которые повторяются у тебя чаще всего, и преврати каждую в вопрос, на который перед отправкой можно ответить за минуту, — например, «что выведет программа на списке из одного элемента?», «на границе `<` или `<=`?» или «помещается ли моя сумма в `int` или нужен `long long`?». Эти три вопроса и есть твой личный список проверок. Где ты будешь его хранить и как не забудешь заглянуть в него, прежде чем нажать «отправить»?",
    },
  },
];
