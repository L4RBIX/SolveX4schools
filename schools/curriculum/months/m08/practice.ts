import type { LessonBlock } from "../../types";

/**
 * m8.l6 · Өз бетіңмен шығар / Реши сам — April's independent practice set.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * April's practice paragraph (p.10) names six families by hand: «уақыттары
 * қабаттаспайтын сабақтардың максимумын таңдау», «соманы ең аз монетамен
 * жинап көріп оның қай кезде қателесетінін табу», «баспалдақпен неше тәсілмен
 * көтерілу», «тізімнің ең үлкен қосындысы бар бөлігін табу», «көрші екі санды
 * қатар алмау шартымен таңдау», «тордағы жолдар санын есептеу».
 *
 * Five of them are set here unscaffolded and carry `curriculum-derived` for
 * that reason: the coin family across `m8.p2` and `m8.p3`, the staircase at
 * `m8.p4`, the largest segment sum at `m8.p5`, the no-two-adjacent choice at
 * `m8.p6` and the grid path count at `m8.p7`. `m8.p1`, `m8.p8`, `m8.p9` and
 * `m8.p10` are `product-authored`.
 *
 * The sixth family — the maximum number of non-overlapping classes — is NOT
 * set here, and that is a decision rather than an omission. `m8.l1.b8` already
 * asks for it from an empty screen, with the same statement, the same
 * touching rule and nearly the case list this file would have used; a second
 * copy under a practice id would have been one problem shipped twice and
 * counted twice toward the month's promised total, which is exactly the defect
 * the first adversarial review found most often. `m8.p1` takes the other
 * question the same timetable answers — how many rooms the school needs —
 * which needs a different program. The staircase is in the same position:
 * `m8.l3.b9` sets it for 1 or 2 steps and `m8.l3.b8` fills in its three-step
 * form, so `m8.p4` adds broken boards, which changes what every cell of the
 * table means.
 *
 * Two sentences of the month decide the shape of every prompt below.
 *
 * **«Мұнда маңыздысы - дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы».**
 * So a plausible greedy rule is stated ON THE CARD in four of the ten
 * (`m8.p3`, `m8.p6`, `m8.p8`, `m8.p10`) and the learner is asked to decide
 * whether it holds. The rule is never labelled right or wrong in the prompt
 * except where the programme's own family says it is right — `m8.p2`, where
 * the coin set really is one the greedy rule solves, stated out loud so that
 * `m8.p3` on the very next card can break the same rule on a different set.
 * That pairing is the PDF's sentence read literally: try the fewest-coins rule
 * AND find when it errs.
 *
 * **«Кодқа отырмас бұрын әр аралық нәтиженің нені білдіретінін сөзбен
 * тұжырымдайды».** So every task whose method is a table says what the cell
 * MEANS — `dp[i]`, `dp[i][j]`, `dp[i][c]` — in both languages, before any
 * mention of how it is filled. The meaning is the month's assessment
 * criterion; the recurrence is the work and is never on the card.
 *
 * ## The C++17 migration: everything it touched, named
 *
 * 1. **`m8.p3`'s input gained a count.** Its second line was «a line of coin
 *    denominations» whose length was implied by the line break, which C++ has
 *    no beginner-safe way to read. The first line is now `n k` — the sum and
 *    how many denominations follow — and every case carries it. No other task
 *    needed changing: the rest already declared their counts.
 *
 * 2. **Two tables had to widen to `long long`, and one of them silently.**
 *    `m8.p7` counts routes on a grid up to 20×20, where the wall-free answer is
 *    35 345 263 800 — sixteen times past `int`'s 2 147 483 647. In Python that
 *    was simply the answer; in C++ an `int` table compiles, runs and prints a
 *    plausible wrong number. The 20×20 case at the end of `m8.p7`'s list is new
 *    and exists to make that failure impossible to ship. `m8.p4` is `long long`
 *    for the same family reason although its own ceiling, 165 580 141 at
 *    n = 40, would have fitted: the type belongs to the question, not to the
 *    largest case somebody happened to write down.
 *
 *    Everything else is honestly `int` and was checked rather than assumed:
 *    `m8.p5` and `m8.p6` top out near 10^6, `m8.p8` at 9 900, `m8.p9` counts to
 *    500, `m8.p10` to 50 000, `m8.p2` to 100 coins, `m8.p1` to 100 rooms.
 *
 * 3. **`m8.p3` keeps a NAMED sentinel and the prompt now says why.** The table
 *    starts at `big = n + 1` — one more than any real answer can be — and not
 *    at the largest `int` there is, because the loop computes `dp[x - c] + 1`
 *    and adding one to the largest `int` overflows into a negative number that
 *    then wins every comparison. That is a C++ fact with no Python counterpart
 *    and it is worth the two sentences it costs.
 *
 * 4. **One complexity bound was re-derived and moved.** `m8.p10`'s last case
 *    had 25 items, chosen so that Python could not walk 2^25 subsets. C++ does
 *    about 10^9 simple operations a second even at the judge's -O0
 *    (`docs/cpp17/CPP17_JUDGE_PARITY.md` measured 10^9 additions in 0.775 s),
 *    and 2^25 · 25 is about 8·10^8 operations — a second or two, which is not
 *    a refusal. The case is now 45 items:
 *    2^45 is 3.5·10^13 and finishes on no machine, while the table is 46 × 501
 *    cells and finishes instantly. `m8.p9`'s 60-number case needed no change
 *    (2^60 was never in reach) and neither did anything else in the file.
 *
 * ## Decisions taken once, so no block below re-litigates them
 *
 * 1. **The meaning of the cell is given; the recurrence never is.** Stating
 *    «dp[i] — жерден дәл i-сатыға көтерілу тәсілдерінің саны» is what the
 *    programme demands before code. Writing the rule that fills it would be
 *    the answer printed on the learner's own screen. Nothing here does the
 *    second thing.
 *
 * 2. **No structural requirement is stated anywhere.** Output comparison
 *    cannot see a function, cannot see a table, cannot see whether a greedy
 *    loop or a table produced the number. So where a shortcut had to be ruled
 *    out, it is ruled out by **option 1 of the authoring contract's three** —
 *    the case makes the output impossible to reach the wrong way. `m8.p3`'s
 *    visible `6 3 / 1 3 4` and its four hidden relatives kill greedy-largest-
 *    first; `m8.p6`'s `2 3 2` and `4 5 4` kill take-the-biggest-and-cross-out-
 *    its-neighbours; `m8.p8`'s `0 1 50 / 3 50 50 / 3 0 0` kills the
 *    cheapest-neighbour walk; `m8.p10`'s two hidden cases kill both greedy
 *    orderings, by value and by value-per-weight. Where a limit is stated in
 *    prose — `m8.p9`'s «барлық ішкі тізбекті түгел қарау ешқашан үлгермейді» —
 *    a case big enough to make that true on a C++ machine is in the set, so
 *    the clock enforces what the sentence claims. Option 2 (guidance, graded on
 *    the answer) and option 3 (send it to a human) were not needed: there is no
 *    place in this file where the intended method leaves the output unchanged.
 *
 * 3. **`m8.p2` and `m8.p3` are one family, split across two cards.** They are
 *    not the same task twice: `m8.p2` has a fixed, real tenge coin set on
 *    which the greedy rule is right and the program is a single loop; `m8.p3`
 *    reads the coin set from input, has to answer -1 when the sum is
 *    unreachable, and asks for the TRUE minimum on a set where the same rule
 *    loses. The two programs share no line beyond reading a number.
 *
 * 4. **No `diagnosticMapping` in this file.** A mapping may be declared only
 *    when one wrong answer has exactly one cause, and on these tasks a wrong
 *    number is reachable from the wrong initial cell, an off-by-one in the
 *    table length, a greedy shortcut, or a mis-read of the input format. Four
 *    causes, one number. `unattributed_failure` and the engine asking the
 *    learner is the correct outcome.
 *
 * 5. **The checker stays `token` throughout.** Every task prints one number
 *    and every prompt asks for one number. No layout is claimed anywhere, so
 *    none is enforced anywhere.
 *
 * 6. **Everything is C++ the year has already shown.** `vector`, `for`,
 *    indexing, `/`, `%`, `cin >>`, `cout <<`, `string` rows for the grid,
 *    `vector<vector<...>>` from March. `vector<T> dp(n + 1, 0)` is the only
 *    writing that could be new to a reader; `m8.l3.b1` and `m8.l4.b1` name it
 *    in prose when the month first uses it, and `m8.p4` says what it produces
 *    in one clause because this set is worked independently and may be reached
 *    days later. No `map`, no `set`, no lambda, no recursion with memoisation:
 *    every table in this file is a `vector` the learner fills by hand.
 *
 * ## The wrong programs these cases are built to fail
 *
 * Named per block in the comments, and every one of them was run against the
 * real thing before this file was written. Across the ten: a busiest-moment
 * count that reads a class as still running at its own finishing time, and one
 * that only compares neighbouring classes; the greedy coin rule on the three
 * sets that defeat it, and the coin sum that cannot be assembled at all;
 * `dp[0] = 0` where a count of ways needs 1; the staircase that stops at the
 * first broken board instead of stepping over it; the maximum segment
 * initialised to 0 on an all-negative list, and the segment scan that stops
 * one element short; the sum of every second element standing in for the
 * no-two-adjacent choice; a grid path count that ignores the blocked cells,
 * one that never checks whether the start or the finish is blocked, and one
 * whose table is `int` and overflows on the 20×20 grid; the cheapest-neighbour
 * walk; the longest increasing RUN standing in for the longest increasing
 * subsequence, and the non-strict comparison on a list of equal values; and
 * the one-dimensional knapsack table walked forwards, which lets one item be
 * taken twice.
 *
 * ## Tracks
 *
 * `m8.p1`–`m8.p8` go to all three routes: a support learner still has to
 * finish something alone, and the first rungs are short enough that they can.
 * `m8.p9` adds the strictness rule and a size that rules out enumeration
 * (core + advanced). `m8.p10` is the two-parameter table (advanced only).
 */

const P = 10;

export const M8_PRACTICE: LessonBlock[] = [
  {
    /* Rung 1, and NOT the PDF's «уақыттары қабаттаспайтын сабақтардың
       максимумын таңдау» — that question is set from scratch at `m8.l1.b8`,
       with the same statement, the same touching rule and nearly this case
       list, and setting it again here would ship one problem twice under two
       ids. This is the other question the same timetable asks, and the school
       actually asks it: not how many classes fit in one room, but how many
       rooms the timetable needs. The picture is familiar, the program shares
       no line with `m8.l1.b8`'s, and the greedy instinct — sort and sweep —
       is still what a learner reaches for.

       `int` everywhere: the answer is a count of at most 100 classes. */
    id: "m8.p1",
    type: "write_code",
    skillRefs: ["greedy.core", "loops.nested", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі — сабақтардың саны (1 ≤ n ≤ 100). " +
        "Келесі n жолдың әрқайсысында екі бүтін сан тұрады: сабақтың басталу уақыты s және аяқталу уақыты e (0 ≤ s < e ≤ 100). " +
        "Сабақтар кез келген ретпен берілуі мүмкін, реттелген деп сенуге болмайды. " +
        "Бір сәтте қатар жүріп жатқан сабақтардың ең үлкен санын шығар — мектепке дәл сонша бөлме керек болады. " +
        "Сабақ өз аяқталу уақытында енді жүріп жатқан жоқ деп саналады: сондықтан бірі дәл e уақытында бітіп, екіншісі дәл сол уақытта басталса, олар бір бөлмеде өте береді. " +
        "Мысалдағы `0 5`, `1 6`, `2 7`, `8 9` сабақтары үшін жауап 3: 2-ден 5-ке дейінгі кез келген сәтте алғашқы үшеуі қатар жүріп тұр.",
      ru:
        "В первой строке дано число n — количество занятий (1 ≤ n ≤ 100). " +
        "В каждой из следующих n строк заданы два целых числа: время начала занятия s и время его конца e (0 ≤ s < e ≤ 100). " +
        "Занятия могут идти в любом порядке, считать их упорядоченными нельзя. " +
        "Выведи наибольшее количество занятий, которые идут одновременно в один и тот же момент, — ровно столько кабинетов и понадобится школе. " +
        "Считается, что в момент своего окончания занятие уже не идёт: поэтому если одно кончается ровно в момент e, а другое ровно тогда же начинается, они помещаются в один кабинет. " +
        "Для занятий из примера — `0 5`, `1 6`, `2 7`, `8 9` — ответ 3: в любой момент от 2 до 5 первые три идут одновременно.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> s(n, 0);\n" +
      "    vector<int> e(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> s[i] >> e[i];\n" +
      "    }\n" +
      "    int best = 0;\n" +
      "    for (int t = 0; t < 100; t++) {\n" +
      "        int now = 0;\n" +
      "        for (int i = 0; i < n; i++) {\n" +
      "            if (s[i] <= t && t < e[i]) {\n" +
      "                now = now + 1;\n" +
      "            }\n" +
      "        }\n" +
      "        if (now > best) {\n" +
      "            best = now;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* An interval alive only at t = 0. A sweep starting at t = 1 answers 0 and passed every
         other case. */
      { input: "1\n0 1", expectedOutput: "1", hidden: true },
      { input: "4\n0 5\n1 6\n2 7\n8 9", expectedOutput: "3" },
      /* Three classes meeting end to end. A program that counts a class as
         still running at its own finishing time answers 2; the prompt says
         out loud that it is not. */
      { input: "3\n0 2\n2 4\n4 6", expectedOutput: "1", hidden: true },
      /* The same boundary with only two classes and the shortest possible
         gap. */
      { input: "2\n0 1\n1 2", expectedOutput: "1", hidden: true },
      /* One class. */
      { input: "1\n0 100", expectedOutput: "1", hidden: true },
      /* Three identical classes: the answer is 3, and a program that counts
         DISTINCT time ranges answers 1. */
      { input: "3\n2 5\n2 5\n2 5", expectedOutput: "3", hidden: true },
      /* Nothing ever overlaps: the answer is 1, not n. */
      { input: "5\n0 1\n2 3\n4 5\n6 7\n8 9", expectedOutput: "1", hidden: true },
      /* The busiest moment is inside a long class that started before the
         other two: comparing only NEIGHBOURING classes after sorting by start
         never sees three at once. */
      { input: "5\n0 100\n10 20\n11 21\n50 60\n51 61", expectedOutput: "3", hidden: true },
      /* The peak is at the very end of the day, and the first class is long
         over by then. */
      { input: "4\n0 1\n5 9\n6 9\n7 9", expectedOutput: "3", hidden: true },
      /* The peak is at the very first moment, time 0. */
      { input: "4\n0 3\n0 3\n0 3\n4 5", expectedOutput: "3", hidden: true },
      /* Both classes occupy the single last minute the statement allows, so a
         sweep that stops at t = 98 misses them. */
      { input: "2\n99 100\n99 100", expectedOutput: "2", hidden: true },
      /* One class swallows the other two, which do not touch each other. */
      { input: "3\n0 10\n1 2\n3 4", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* Rung 2. PDF p.10 family «соманы ең аз монетамен жинау», first half: a
       coin set on which the greedy rule is genuinely optimal, and the prompt
       says so. It is the only card in the month that certifies a greedy rule,
       and it exists so that m8.p3 can break the same rule one card later on a
       set the learner will not see coming. The tenge denominations are real.

       `int` throughout: at most 10000 tenge, so at most 100 coins. */
    id: "m8.p2",
    type: "write_code",
    skillRefs: ["greedy.core", "arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Кассада 1, 2, 5, 10, 20, 50 және 100 теңгелік монеталар шексіз көп. " +
        "Бір жолда n саны беріледі — жинау керек сома (0 ≤ n ≤ 10000). " +
        "Осы соманы дәл жинауға керек монеталардың ең аз санын шығар. n = 0 болса жауап 0. " +
        "Дәл осы монета жиынында «сыятын ең үлкен монетаны ал да, қалған сомамен солай жалғастыр» ережесі әрқашан ең аз санды береді, сондықтан оны еркін қолдана бер. " +
        "Келесі есепте дәл осы ереже бұзылатын жиын кездеседі.",
      ru:
        "В кассе неограниченно много монет по 1, 2, 5, 10, 20, 50 и 100 тенге. " +
        "В одной строке дано число n — сумма, которую надо набрать (0 ≤ n ≤ 10000). " +
        "Выведи наименьшее количество монет, которым эту сумму можно набрать точно. При n = 0 ответ 0. " +
        "Именно для этого набора монет правило «бери самую крупную монету, которая помещается, и продолжай так же с остатком» всегда даёт наименьшее количество, так что им можно спокойно пользоваться. " +
        "В следующей задаче встретится набор, на котором это самое правило ломается.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> coins;\n" +
      "    coins.push_back(100);\n" +
      "    coins.push_back(50);\n" +
      "    coins.push_back(20);\n" +
      "    coins.push_back(10);\n" +
      "    coins.push_back(5);\n" +
      "    coins.push_back(2);\n" +
      "    coins.push_back(1);\n" +
      "    int count = 0;\n" +
      "    for (int i = 0; i < 7; i++) {\n" +
      "        count = count + n / coins[i];\n" +
      "        n = n % coins[i];\n" +
      "    }\n" +
      "    cout << count;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The only case that needs the 10-tenge coin. Without it a program answers 2. */
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "99", expectedOutput: "6" },
      /* Zero: a loop that takes a coin before testing prints 1. */
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "1", expectedOutput: "1", hidden: true },
      /* 4 = 2 + 2. A solution that only knows 1, 5, 10, 50, 100 prints 4. */
      { input: "4", expectedOutput: "2", hidden: true },
      /* 3 = 2 + 1, for the same reason with an odd remainder. */
      { input: "3", expectedOutput: "2", hidden: true },
      /* 8 = 5 + 2 + 1: all three of the small coins in one answer. */
      { input: "8", expectedOutput: "3", hidden: true },
      /* Exactly one coin, and exactly two of the same coin: the boundaries of
         the division that does the work. */
      { input: "50", expectedOutput: "1", hidden: true },
      { input: "40", expectedOutput: "2", hidden: true },
      /* The largest sum the statement allows. */
      { input: "10000", expectedOutput: "100", hidden: true },
      { input: "173", expectedOutput: "5", hidden: true },
    ],
  },
  {
    /* Rung 3, and the card the month exists for. PDF p.10: «соманы ең аз
       монетамен жинап көріп ОНЫҢ ҚАЙ КЕЗДЕ ҚАТЕЛЕСЕТІНІН табу». The visible
       case is the counterexample itself — 6 from {1, 3, 4} is 3 + 3, while the
       rule certified one card earlier answers 4 + 1 + 1 — so the learner meets
       the failure before writing a line. The task is then the true minimum,
       which no greedy produces, and the table is the only way to it.

       Two C++ things live here and both are stated in the prompt rather than
       sprung on a hidden case: the denomination count `k` on the first line,
       because `cin >>` cannot find the end of a line; and the sentinel
       `big = n + 1`, because the loop computes `dp[x - c] + 1` and adding one
       to the largest `int` overflows into a negative that then wins every
       comparison. A named bound one past the real maximum is the honest
       replacement for an infinity `int` does not have. */
    id: "m8.p3",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "greedy.counterexample"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Бірінші жолда екі сан беріледі: n — жинау керек сома (0 ≤ n ≤ 200) және k — монета номиналдарының саны (1 ≤ k ≤ 10). " +
        "Екінші жолда бос орынмен бөлініп k номинал тұрады, әрқайсысы 1-ден 200-ге дейін. " +
        "Номиналдар кез келген ретпен тұруы және қайталануы мүмкін; әр номиналдан қалағанша алуға болады. " +
        "Соманы дәл жинауға керек монеталардың ең аз санын шығар. Берілген монеталармен соманы мүлде жинау мүмкін болмаса, -1 шығар. n = 0 болса жауап 0. " +
        "Алдыңғы есепте расталған «ең үлкен монетадан баста» ережесін мысалдағы n = 6 мен 1, 3, 4 монеталарына өз қолыңмен қолданып көр де, шыққан санды дұрыс жауаппен салыстыр. " +
        "Бағдарлама сол ереже беретін санды емес, шын мәніндегі ең аз санды шығаруға тиіс. Аралық нәтиженің мағынасы: dp[x] — дәл x сомасын жинауға керек монеталардың ең аз саны.\n\n" +
        "Кестенің әлі табылмаған ұяшықтарын «шексіздікпен» толтыру керек, ал `int`-те шексіздік жоқ. Ең үлкен `int`-ті алма: кесте `dp[x - c] + 1` деп есептейді, ал ең үлкен `int`-ке 1 қосқанда сан теріс болып кетеді де, кез келген салыстыруда жеңіп шығады. Оның орнына шын жауаптан бір ғана артық шекара ал — мысалы `n + 1`: нақты жауап ешқашан n монетадан аспайды, сондықтан кестеде `n + 1` тұрса, ол «мұндай сома жиналмайды» дегенді білдіреді.",
      ru:
        "В первой строке даны два числа: n — сумма, которую надо набрать (0 ≤ n ≤ 200), и k — количество номиналов монет (1 ≤ k ≤ 10). " +
        "Во второй строке через пробел даны k номиналов, каждый от 1 до 200. " +
        "Номиналы могут идти в любом порядке и повторяться; монет каждого номинала можно брать сколько угодно. " +
        "Выведи наименьшее количество монет, которым сумму можно набрать точно. Если данными монетами сумму набрать нельзя вообще, выведи -1. При n = 0 ответ 0. " +
        "Возьми правило «начинай с самой крупной монеты», подтверждённое в прошлой задаче, применни его вручную к примеру с n = 6 и монетами 1, 3, 4 и сравни полученное число с верным ответом. " +
        "Программа должна выводить не то число, которое даёт правило, а настоящий минимум. Смысл промежуточного результата: dp[x] — наименьшее количество монет, которым набирается ровно сумма x.\n\n" +
        "Ещё не найденные ячейки таблицы надо заполнить «бесконечностью», а в `int` бесконечности нет. Не бери самое большое `int`: таблица считает `dp[x - c] + 1`, а прибавление единицы к самому большому `int` делает число отрицательным, и оно выигрывает любое сравнение. Возьми вместо этого границу на единицу больше настоящего ответа — например `n + 1`: реального ответа больше чем в n монет не бывает, поэтому `n + 1` в ячейке означает «такая сумма не собирается».",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, k;\n" +
      "    cin >> n >> k;\n" +
      "    vector<int> coins(k, 0);\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        cin >> coins[i];\n" +
      "    }\n" +
      "    int big = n + 1;\n" +
      "    vector<int> dp(n + 1, big);\n" +
      "    dp[0] = 0;\n" +
      "    for (int x = 1; x <= n; x++) {\n" +
      "        for (int i = 0; i < k; i++) {\n" +
      "            int c = coins[i];\n" +
      "            if (c <= x && dp[x - c] + 1 < dp[x]) {\n" +
      "                dp[x] = dp[x - c] + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    if (dp[n] > n) {\n" +
      "        cout << -1;\n" +
      "    } else {\n" +
      "        cout << dp[n];\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The counterexample the month is built on: greedy says 4 + 1 + 1, the
         answer is 3 + 3. */
      { input: "6 3\n1 3 4", expectedOutput: "2" },
      /* dp[0]. Anything but 0 in the first cell poisons the whole table. */
      { input: "0 3\n1 3 4", expectedOutput: "0", hidden: true },
      /* Unreachable: 7 is not a sum of 3s and 5s. */
      { input: "7 2\n3 5", expectedOutput: "-1", hidden: true },
      /* Reachable one step further along the same set. */
      { input: "8 2\n3 5", expectedOutput: "2", hidden: true },
      /* The smallest unreachable sum there is. */
      { input: "1 1\n2", expectedOutput: "-1", hidden: true },
      /* The largest sum, with the table at full length: a program whose table
         is `vector<int> dp(n, big)` never reaches index n. */
      { input: "200 1\n1", expectedOutput: "200", hidden: true },
      /* One coin, exactly. */
      { input: "5 1\n5", expectedOutput: "1", hidden: true },
      /* A second greedy failure with a longer set: 5 + 6, not 9 + 1 + 1. */
      { input: "11 4\n1 5 6 9", expectedOutput: "2", hidden: true },
      /* Greedy takes 11 eighteen times and stalls on a remainder of 2; the
         true answer is fifteen 11s and five 7s. */
      { input: "200 2\n7 11", expectedOutput: "20", hidden: true },
      /* Unsorted, with a repeated denomination. */
      { input: "12 4\n4 1 4 3", expectedOutput: "3", hidden: true },
      /* Greedy takes 25 and needs five 1s after it; 10 + 10 + 10 is three. */
      { input: "30 3\n25 10 1", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* Rung 4. PDF p.10 family «баспалдақпен неше тәсілмен көтерілу» — with the
       constraint that makes it a new program rather than a second copy of one.
       The plain staircase is `m8.l3.b9` (1 or 2 steps) and its three-step form
       is filled in at `m8.l3.b8` and edited at `m8.l3.b9s`, so a learner
       arriving here has that table on screen behind them; asking for it again
       would be transcription. Broken steps change what the table means at every
       cell — a cell can now be zero for a reason that has nothing to do with
       the recurrence — and that is the step this card is for.

       `vector<long long> dp(n + 1, 0)` was named in prose at `m8.l3.b1`; it is
       repeated here in one clause because this set is worked independently and
       may be reached days later. `long long` although n ≤ 40 tops out at
       165 580 141: the type belongs to the question. */
    id: "m8.p4",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Баспалдақта n саты бар, олар 1-ден n-ге дейін нөмірленген (1 ≤ n ≤ 40). Сен жерде, яғни 0-сатыда тұрсың. " +
        "Бір аттағанда 1 немесе 2 сатыға көтерілуге болады. " +
        "Екінші жолда бос орынмен бөлінген n сан беріледі: i-шісі 1 болса, i-сатының тақтайы сынған және оған аяқ басуға болмайды; 0 болса, саты дұрыс. Жер (0-саты) ешқашан сынбайды. " +
        "Дәл n-сатыға көтерілудің неше түрлі тәсілі бар екенін шығар; сынған сатыға тұруға болмайды, бірақ оның үстінен аттап өтуге болады. " +
        "Ешқандай тәсіл болмаса, 0 шығар. " +
        "Аралық нәтиженің мағынасын кодқа отырмас бұрын айт: dp[i] — жерден дәл i-сатыға көтерілу тәсілдерінің саны. " +
        "Кестені `vector<long long> dp(n + 1, 0);` деп бастауға болады: жақшадағы бірінші сан — ұяшық саны, екіншісі — әрқайсысына бірден жазылатын мән. Түрі `long long`, өйткені баспалдақ есептерінде жауап тез өседі.",
      ru:
        "На лестнице n ступенек, они пронумерованы от 1 до n (1 ≤ n ≤ 40). Ты стоишь на земле, то есть на ступеньке 0. " +
        "За один шаг можно подняться на 1 или на 2 ступеньки. " +
        "Во второй строке через пробел даны n чисел: если i-е равно 1, то доска ступеньки i сломана и наступать на неё нельзя; если 0, ступенька целая. Земля (ступенька 0) не ломается никогда. " +
        "Выведи, сколькими разными способами можно подняться ровно на ступеньку n; на сломанную ступеньку вставать нельзя, но перешагнуть через неё можно. " +
        "Если ни одного способа нет, выведи 0. " +
        "Смысл промежуточного результата сформулируй до кода: dp[i] — количество способов подняться с земли ровно на ступеньку i. " +
        "Таблицу удобно завести так: `vector<long long> dp(n + 1, 0);` — первое число в скобках это количество ячеек, второе — значение, которое сразу пишется в каждую. Тип `long long`, потому что в задачах про лестницу ответ растёт быстро.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> b(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> b[i];\n" +
      "    }\n" +
      "    vector<long long> dp(n + 1, 0);\n" +
      "    dp[0] = 1;\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        if (b[i - 1] == 1) {\n" +
      "            dp[i] = 0;\n" +
      "        } else {\n" +
      "            dp[i] = dp[i - 1];\n" +
      "            if (i >= 2) {\n" +
      "                dp[i] = dp[i] + dp[i - 2];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n0 1 0 0 0", expectedOutput: "2" },
      /* No broken step at all: the familiar staircase, six steps, thirteen
         ways. A program that reads the second line but never uses it passes
         this one and fails everything else — which is why it is here and why
         it is not alone. */
      { input: "6\n0 0 0 0 0 0", expectedOutput: "13", hidden: true },
      /* dp[0]. The ground is where the count starts and it starts at 1: any
         other value makes the whole table zero. */
      { input: "2\n0 0", expectedOutput: "2", hidden: true },
      /* One step, sound and broken. The second is the case where the finish
         itself cannot be stood on. */
      { input: "1\n0", expectedOutput: "1", hidden: true },
      { input: "1\n1", expectedOutput: "0", hidden: true },
      /* The FIRST step is broken, and the answer is not 0 — it is stepped
         over. A program that stops at the first broken board prints 0. */
      { input: "2\n1 0", expectedOutput: "1", hidden: true },
      { input: "3\n1 0 0", expectedOutput: "1", hidden: true },
      /* The finish is broken while everything below it is sound. */
      { input: "3\n0 1 1", expectedOutput: "0", hidden: true },
      /* Two broken boards in a row cannot be crossed by a two-step jump, so
         the staircase is cut even though the top is sound. */
      { input: "4\n1 1 0 0", expectedOutput: "0", hidden: true },
      /* Every third board is broken: exactly two routes survive to the top. */
      { input: "10\n0 0 1 0 0 1 0 0 1 0", expectedOutput: "2", hidden: true },
      /* The full staircase at the top of the stated range. */
      {
        input: "40\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
        expectedOutput: "165580141",
        hidden: true,
      },
      /* Forty boards with a two-board gap in the middle: the answer is 0 and
         a program that only checks the last board says otherwise. */
      {
        input: "40\n0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
        expectedOutput: "0",
        hidden: true,
      },
    ],
  },
  {
    /* Rung 5. PDF p.10 family «тізімнің ең үлкен қосындысы бар бөлігін табу».
       The all-negative rule is stated in the prompt because it is a DECISION
       about the problem, not a hint about the method: without it the task has
       two defensible answers and the hidden case would be a trap. With it
       stated, `best = 0` is simply wrong, and the case that says so is there.

       `int`: n ≤ 1000 numbers of at most 1000 each puts the largest possible
       answer at 10^6. */
    id: "m8.p5",
    type: "write_code",
    skillRefs: ["dp.core", "lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 1000). " +
        "Екінші жолда бос орынмен бөлінген n бүтін сан тұрады, әрқайсысының модулі 1000-нан аспайды. " +
        "Тізбектен қатар тұрған сандардан құралған бір бөлікті таңдап ал — бөлік бос бола алмайды, оған кемінде бір сан кіруге тиіс — және сол бөліктің қосындысы ең үлкен болатындай ет. Осы ең үлкен қосындыны шығар. " +
        "Барлық сан теріс болса, ең жақсы бөлік бір ғана саннан тұрады, сондықтан жауап тізбектегі ең үлкен сан болады, 0 емес. " +
        "Аралық нәтиженің мағынасын алдымен айт: әр i үшін дәл i-ші санмен аяқталатын бөліктердің ең үлкен қосындысын біліп отыру жеткілікті.",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 1000). " +
        "Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000. " +
        "Выбери из последовательности один участок из подряд идущих чисел — участок не может быть пустым, в него должно войти хотя бы одно число — так, чтобы его сумма была наибольшей. Выведи эту наибольшую сумму. " +
        "Если все числа отрицательные, лучший участок состоит из одного числа, поэтому ответом будет наибольшее число последовательности, а не 0. " +
        "Сначала сформулируй смысл промежуточного результата: для каждого i достаточно знать наибольшую сумму среди участков, которые заканчиваются ровно на i-м числе.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = a[0];\n" +
      "    int cur = a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (cur < 0) {\n" +
      "            cur = a[i];\n" +
      "        } else {\n" +
      "            cur = cur + a[i];\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" },
      /* Every number negative: `best = 0` prints 0, and the prompt says out
         loud that 0 is not an allowed answer. */
      { input: "4\n-5 -2 -9 -3", expectedOutput: "-2", hidden: true },
      { input: "6\n-1 -2 -3 -4 -5 -6", expectedOutput: "-1", hidden: true },
      /* One number, on both signs. */
      { input: "1\n-7", expectedOutput: "-7", hidden: true },
      { input: "1\n5", expectedOutput: "5", hidden: true },
      /* The best segment is the whole list. */
      { input: "3\n1 2 3", expectedOutput: "6", hidden: true },
      /* The best segment is the LAST element alone: a loop that stops one
         short prints -5. */
      { input: "3\n-5 -5 10", expectedOutput: "10", hidden: true },
      /* And the first element alone, for the loop that starts one late. */
      { input: "3\n10 -5 -5", expectedOutput: "10", hidden: true },
      /* Zeros only: the answer is 0 and it is a real answer, not the absence
         of one. */
      { input: "3\n0 0 0", expectedOutput: "0", hidden: true },
      /* A negative in the middle that is worth crossing: 4 - 2 + 4 beats
         either 4 alone. */
      { input: "5\n-1 4 -2 4 -1", expectedOutput: "6", hidden: true },
      /* A zero between two negatives: the empty segment is not allowed, so
         the answer is that zero. */
      { input: "3\n-3 0 -3", expectedOutput: "0", hidden: true },
      { input: "5\n2 -1 2 -1 2", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /* Rung 6. PDF p.10 family «көрші екі санды қатар алмау шартымен таңдау».
       The greedy rule here is the one everybody proposes — take the biggest
       number, cross out its two neighbours, repeat — and it fails on three
       numbers. The prompt names a list to test it on (`2 3 2`) and does NOT
       say what happens, because the arithmetic is four seconds of work and
       doing it is the month's stated skill.

       `int`: at most 1000 numbers of at most 1000, so the answer cannot pass
       500 000. */
    id: "m8.p6",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "greedy.counterexample", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 1000). " +
        "Екінші жолда бос орынмен бөлінген n теріс емес бүтін сан тұрады (әрқайсысы 0-ден 1000-ға дейін). " +
        "Сандардың бірнешеуін таңдап ал, бірақ тізбекте қатар тұрған екі санды бірге алуға болмайды. Таңдалғандардың қосындысы ең үлкен болғандағы қосындыны шығар. " +
        "Ештеңе алмауға да болады, сондықтан жауап ешқашан теріс болмайды. " +
        "Аралық нәтиженің мағынасы: dp[i] — тізбектің тек алғашқы i санын қарағандағы ең үлкен қосынды; сонда жауап dp[n] болады. " +
        "«Ең үлкен санды ал да, оның екі көршісін сыз, сосын қайтала» ережесін `2 3 2` тізбегінде тексеріп көр: ол қандай сан береді, ал дұрыс жауап қандай?",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 1000). " +
        "Во второй строке через пробел даны n целых неотрицательных чисел (каждое от 0 до 1000). " +
        "Выбери несколько чисел, но два соседних в последовательности числа брать вместе нельзя. Выведи наибольшую сумму выбранных. " +
        "Не брать ничего тоже разрешено, поэтому ответ никогда не бывает отрицательным. " +
        "Смысл промежуточного результата: dp[i] — наибольшая сумма, если смотреть только на первые i чисел последовательности; тогда ответ — это dp[n]. " +
        "Проверь правило «возьми самое большое число, вычеркни двух его соседей и повтори» на последовательности `2 3 2`: какое число даёт правило и каков верный ответ?",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> dp(n + 1, 0);\n" +
      "    dp[1] = a[0];\n" +
      "    for (int i = 2; i <= n; i++) {\n" +
      "        int take = dp[i - 2] + a[i - 1];\n" +
      "        int skip = dp[i - 1];\n" +
      "        if (take > skip) {\n" +
      "            dp[i] = take;\n" +
      "        } else {\n" +
      "            dp[i] = skip;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n3 2 7 10 12", expectedOutput: "22" },
      /* The list the prompt sends the learner to check by hand: the rule
         answers 3, the truth is 4. */
      { input: "3\n2 3 2", expectedOutput: "4", hidden: true },
      /* The same shape with a wider gap, so a program that only beat `2 3 2`
         by luck still fails: the rule answers 5, the truth is 8. */
      { input: "3\n4 5 4", expectedOutput: "8", hidden: true },
      /* One number: the table has to have a first cell before the loop runs
         at all. */
      { input: "1\n9", expectedOutput: "9", hidden: true },
      /* Two numbers, both orders. Summing every second element from index 0
         prints 4 on the first and is right by accident on the second, which
         is why both are here. */
      { input: "2\n4 9", expectedOutput: "9", hidden: true },
      { input: "2\n9 4", expectedOutput: "9", hidden: true },
      /* Five equal numbers: the answer takes three of them, positions 1, 3, 5.
         Every-second-from-the-second-element prints 2. */
      { input: "5\n1 1 1 1 1", expectedOutput: "3", hidden: true },
      /* The ends beat the middle. */
      { input: "4\n5 1 1 5", expectedOutput: "10", hidden: true },
      /* All zeros: 0 is the answer, not an empty output. */
      { input: "3\n0 0 0", expectedOutput: "0", hidden: true },
      /* Two different selections tie at 6, and both are legal. */
      { input: "7\n2 1 1 2 1 1 2", expectedOutput: "6", hidden: true },
      /* The answer must skip TWO numbers in a row somewhere: 1 + 9 + 5. */
      { input: "6\n1 2 9 4 5 0", expectedOutput: "15", hidden: true },
      /* Everything worth taking is in the last position. */
      { input: "4\n0 0 0 7", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /* Rung 7. PDF p.10 family «тордағы жолдар санын есептеу». March spent a
       month on grids with a queue; this is the same picture and a different
       machine — the cells are filled in reading order and nothing is ever
       revisited, because moving only right and down means a cell's answer is
       finished before it is needed. The blocked cell is the whole reason the
       formula from combinatorics does not apply.

       THE OVERFLOW TASK OF THE PRACTICE SET. At 20×20 with no walls the answer
       is 35 345 263 800 and an `int` table prints a plausible wrong number with
       nothing to see. The prompt says so, and the last case — a free 20×20 grid
       — is the one that refuses an `int` solution. It is a NEW case: the Python
       set topped out at 3×7, where the question never arose. */
    id: "m8.p7",
    type: "write_code",
    skillRefs: ["dp.table", "grid.cells", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — тордың жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында дәл m таңба тұрады: `.` — бос ұяшық, `#` — жабық ұяшық. " +
        "Робот сол жақ жоғарғы ұяшықтан (0-жол, 0-баған) оң жақ төменгі ұяшыққа (n − 1 жол, m − 1 баған) жүреді. Жол мен баған нөмірлері 0-ден басталады. " +
        "Бір қадамда тек бір ұяшық оңға немесе бір ұяшық төмен жүруге болады; жабық ұяшыққа түсуге болмайды. " +
        "Осындай әртүрлі маршруттардың санын шығар. Бастау ұяшығы немесе финиш ұяшығы жабық болса, жауап 0. " +
        "Аралық нәтиженің мағынасын алдымен айт: dp[i][j] — бастаудан (i, j) ұяшығына жетудің маршруттар саны. " +
        "Кестені `long long` етіп ал: қабырғасыз 20×20 торда жауап 35 345 263 800 болады, ал `int` 2 147 483 647-ден асқанда үнсіз бөтен сан береді.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20) — количество строк и количество столбцов сетки. " +
        "В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — закрытая клетка. " +
        "Робот идёт из левой верхней клетки (строка 0, столбец 0) в правую нижнюю (строка n − 1, столбец m − 1). Нумерация строк и столбцов начинается с нуля. " +
        "За один шаг можно сдвинуться только на одну клетку вправо или на одну клетку вниз; вставать на закрытую клетку нельзя. " +
        "Выведи количество различных таких маршрутов. Если закрыта стартовая клетка или финишная, ответ 0. " +
        "Сначала сформулируй смысл промежуточного результата: dp[i][j] — количество маршрутов от старта до клетки (i, j). " +
        "Таблицу бери из `long long`: на сетке 20×20 без стен ответ равен 35 345 263 800, а `int` после 2 147 483 647 молча выдаёт постороннее число.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string row;\n" +
      "        cin >> row;\n" +
      "        g.push_back(row);\n" +
      "    }\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (g[i][j] == '#') {\n" +
      "                dp[i][j] = 0;\n" +
      "            } else if (i == 0 && j == 0) {\n" +
      "                dp[i][j] = 1;\n" +
      "            } else {\n" +
      "                long long total = 0;\n" +
      "                if (i > 0) {\n" +
      "                    total = total + dp[i - 1][j];\n" +
      "                }\n" +
      "                if (j > 0) {\n" +
      "                    total = total + dp[i][j - 1];\n" +
      "                }\n" +
      "                dp[i][j] = total;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 3\n...\n...\n...", expectedOutput: "6" },
      /* One cell, free and closed. The start is also the finish. */
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* The start is closed, then the finish is closed. A program that writes
         1 into dp[0][0] before testing the character prints 1 on the first. */
      { input: "2 2\n#.\n..", expectedOutput: "0", hidden: true },
      { input: "2 2\n..\n.#", expectedOutput: "0", hidden: true },
      /* One closed cell in the middle: ignoring the walls prints 6. */
      { input: "3 3\n...\n.#.\n...", expectedOutput: "2", hidden: true },
      /* A single row: exactly one path when it is open, none when it is cut. */
      { input: "1 5\n.....", expectedOutput: "1", hidden: true },
      { input: "1 5\n..#..", expectedOutput: "0", hidden: true },
      /* The top row is blocked immediately, so every path goes down first. */
      { input: "2 3\n.#.\n...", expectedOutput: "1", hidden: true },
      /* No walls, rectangular: 28 is the count a correct table produces and a
         program that stops at the last ROW instead of the last cell does not. */
      { input: "3 7\n.......\n.......\n.......", expectedOutput: "28", hidden: true },
      /* A block in the middle wide enough that only the two rims survive. */
      { input: "4 4\n....\n.##.\n.##.\n....", expectedOutput: "2", hidden: true },
      /* A staircase of walls: exactly one way through. */
      { input: "3 3\n..#\n.#.\n...", expectedOutput: "1", hidden: true },
      /* The biggest grid the statement allows, with nothing in the way. An
         `int` table answers 985 525 432 here — a plausible number, silently
         wrong — so this case is what makes the type requirement real. */
      {
        input:
          "20 20\n" +
          "....................\n".repeat(19) +
          "....................",
        expectedOutput: "35345263800",
        hidden: true,
      },
    ],
  },
  {
    /* Rung 8. Not a PDF family — it is m8.p7's grid with the question changed
       from "how many" to "how cheap", which is where the greedy rule of the
       month meets the table of the month on one picture. The cheapest next
       step is a real strategy and a fourteen-year-old will propose it; the
       hidden 3×3 below is built so that the cheap first step costs 45 more by
       the end.

       `int`: 50 × 50 cells at 100 each is at most 9 900 along any single
       route, so nothing here goes near the ceiling. */
    id: "m8.p8",
    type: "write_code",
    skillRefs: ["dp.table", "grid.cells", "greedy.counterexample"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Бірінші жолда n мен m сандары беріледі (1 ≤ n ≤ 50, 1 ≤ m ≤ 50) — тордың жол саны мен баған саны. " +
        "Келесі n жолдың әрқайсысында бос орынмен бөлінген m бүтін сан тұрады — сол жолдағы ұяшықтардың бағасы (әр баға 0-ден 100-ге дейін). " +
        "Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа жету керек; бір қадамда тек бір ұяшық оңға немесе бір ұяшық төмен жүруге болады. " +
        "Маршруттың құны — оның бойында тұрылған барлық ұяшықтың бағасының қосындысы, бастау мен финиш те кіреді. Ең арзан маршруттың құнын шығар. " +
        "«Әр қадамда бағасы арзанырақ көршіге жүр» деген ереже мұнда әрқашан ең арзан маршрутты таппайды — оны шағын торда бұзып көр. " +
        "Аралық нәтиженің мағынасы: dp[i][j] — бастаудан (i, j) ұяшығына жетудің ең арзан құны.",
      ru:
        "В первой строке даны числа n и m (1 ≤ n ≤ 50, 1 ≤ m ≤ 50) — количество строк и количество столбцов сетки. " +
        "В каждой из следующих n строк через пробел даны m целых чисел — цены клеток этой строки (каждая цена от 0 до 100). " +
        "Надо попасть из левой верхней клетки в правую нижнюю; за один шаг можно сдвинуться только на одну клетку вправо или на одну клетку вниз. " +
        "Стоимость маршрута — сумма цен всех клеток, на которых он побывал, включая стартовую и финишную. Выведи стоимость самого дешёвого маршрута. " +
        "Правило «на каждом шаге иди в того соседа, который дешевле» не всегда находит здесь самый дешёвый маршрут — сломай его на небольшой сетке. " +
        "Смысл промежуточного результата: dp[i][j] — наименьшая стоимость маршрута от старта до клетки (i, j).",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<vector<int>> g(n, vector<int>(m, 0));\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            cin >> g[i][j];\n" +
      "        }\n" +
      "    }\n" +
      "    vector<vector<int>> dp(n, vector<int>(m, 0));\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (i == 0 && j == 0) {\n" +
      "                dp[i][j] = g[0][0];\n" +
      "            } else if (i == 0) {\n" +
      "                dp[i][j] = dp[i][j - 1] + g[i][j];\n" +
      "            } else if (j == 0) {\n" +
      "                dp[i][j] = dp[i - 1][j] + g[i][j];\n" +
      "            } else {\n" +
      "                int up = dp[i - 1][j];\n" +
      "                int left = dp[i][j - 1];\n" +
      "                if (up < left) {\n" +
      "                    dp[i][j] = up + g[i][j];\n" +
      "                } else {\n" +
      "                    dp[i][j] = left + g[i][j];\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 3\n1 3 1\n1 5 1\n4 2 1", expectedOutput: "7" },
      /* The cheapest-neighbour walk: the step right costs 1 and the step down
         costs 3, and taking the 1 lands in a row of 50s. Down-down-right-right
         costs 6; every route the greedy walk can produce costs at least 51. */
      { input: "3 3\n0 1 50\n3 50 50\n3 0 0", expectedOutput: "6", hidden: true },
      /* One cell: the answer is its own price, and the start counts. */
      { input: "1 1\n5", expectedOutput: "5", hidden: true },
      /* A single row and a single column: the two degenerate shapes where one
         of the two neighbours does not exist. Reading dp[i - 1][j] without a
         guard is a read from outside the table, which C++ does not report. */
      { input: "1 4\n1 2 3 4", expectedOutput: "10", hidden: true },
      { input: "4 1\n1\n2\n3\n4", expectedOutput: "10", hidden: true },
      /* All zeros: 0 is a real cost. */
      { input: "2 2\n0 0\n0 0", expectedOutput: "0", hidden: true },
      /* Here the greedy walk happens to be right — a case that a program
         which is wrong for the greedy reason still passes, kept so the set
         does not accidentally teach that any detour is always better. */
      { input: "2 3\n1 1 100\n9 1 1", expectedOutput: "4", hidden: true },
      /* Every route costs something different and the cheapest hugs the top
         row: 1 + 2 + 3 + 6 + 9. */
      { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "21", hidden: true },
    ],
  },
  {
    /* Rung 9, core and advanced. The first task in the set where the choice at
       step i depends on EVERY earlier step rather than on one or two, which is
       why it is late and why the table is two loops deep. Strictness is stated
       because it changes the answer on a list of equal numbers, and the size
       is stated because it is the difference between a program that finishes
       and one that does not — the n = 60 case makes that claim true rather
       than decorative, and it survives the move to C++ unchanged: 2^60 is out
       of reach of every machine, while 500 × 500 comparisons are instant.

       `int`: the answer is a length, at most 500. */
    id: "m8.p9",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "lists.traverse", "perf.time_estimate"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 500). Екінші жолда бос орынмен бөлінген n бүтін сан тұрады, әрқайсысының модулі 10000-нан аспайды. " +
        "Тізбектен бірнеше санды таңдап ал: олар тізбектегі ретімен тұруға тиіс, бірақ қатар тұруы міндетті емес. Таңдалғандардың әрбір келесісі алдыңғысынан ҚАТАҢ үлкен болуға тиіс — тең сандар бір тізбекке кірмейді. " +
        "Осындай ең ұзын тізбектің ұзындығын шығар. Тізбекте кемінде бір сан бар, сондықтан жауап әрқашан 1-ден кем емес. " +
        "n ≤ 500 болғандықтан, әр i үшін одан бұрынғы барлық j-ді қарайтын екі цикл уақытқа сияды; ал сандардың барлық ішкі жиынын түгел қарау мүмкін емес, өйткені нұсқалар саны 2-нің n дәрежесі. " +
        "Аралық нәтиженің мағынасы: dp[i] — дәл i-ші санмен АЯҚТАЛАТЫН ең ұзын өспелі тізбектің ұзындығы.",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 500). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 10000. " +
        "Выбери из последовательности несколько чисел: они должны идти в том же порядке, что и в ней, но не обязаны стоять подряд. Каждое следующее выбранное число должно быть СТРОГО больше предыдущего — равные числа в одну последовательность не входят. " +
        "Выведи длину самой длинной такой последовательности. Чисел хотя бы одно, поэтому ответ всегда не меньше 1. " +
        "Так как n ≤ 500, два вложенных цикла — для каждого i просмотреть все более ранние j — укладываются по времени; а перебрать все подмножества чисел нельзя, потому что вариантов 2 в степени n. " +
        "Смысл промежуточного результата: dp[i] — длина самой длинной возрастающей последовательности, которая ЗАКАНЧИВАЕТСЯ ровно на i-м числе.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> dp(n, 1);\n" +
      "    int best = 1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < i; j++) {\n" +
      "            if (a[j] < a[i] && dp[j] + 1 > dp[i]) {\n" +
      "                dp[i] = dp[j] + 1;\n" +
      "            }\n" +
      "        }\n" +
      "        if (dp[i] > best) {\n" +
      "            best = dp[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "8\n3 1 4 1 5 9 2 6", expectedOutput: "4" },
      /* Four equal numbers. A `<=` comparison prints 4; the prompt says
         strictly increasing, and this is the case that means it. */
      { input: "4\n5 5 5 5", expectedOutput: "1", hidden: true },
      /* Equal numbers in the middle of a real sequence, so a program cannot
         pass by special-casing "all the same". */
      { input: "4\n1 3 3 4", expectedOutput: "3", hidden: true },
      { input: "6\n2 2 3 3 4 4", expectedOutput: "3", hidden: true },
      /* One number, and a list with nothing to build on: dp initialised to 0
         prints 0 on both. */
      { input: "1\n7", expectedOutput: "1", hidden: true },
      { input: "5\n9 7 5 3 1", expectedOutput: "1", hidden: true },
      /* Already increasing: the answer is the whole list. */
      { input: "5\n1 2 3 4 5", expectedOutput: "5", hidden: true },
      /* The longest increasing RUN of neighbours is 2 3 4, length 3; the
         answer is 1 2 3 4, length 4. This is the case that separates the
         subsequence from the segment. */
      { input: "5\n1 9 2 3 4", expectedOutput: "4", hidden: true },
      /* Two interleaved increasing chains of the same length. */
      { input: "7\n10 1 11 2 12 3 13", expectedOutput: "4", hidden: true },
      /* Negative numbers, so nothing may be initialised to 0 as a value. */
      { input: "4\n-5 -3 -4 -1", expectedOutput: "3", hidden: true },
      /* Sixty numbers with repeats: two nested loops finish instantly, and
         anything that walks subsets does not finish at all. */
      {
        input:
          "60\n-134 -134 -286 694 932 247 522 959 959 261 -448 -398 -864 -473 654 654 939 " +
          "912 728 937 457 430 430 -736 378 -294 -202 804 902 902 -483 14 -670 -984 238 890 " +
          "890 -936 -366 678 -90 -741 798 798 -941 940 827 699 354 242 242 -424 -634 -658 " +
          "-148 -220 -102 -102 317 -381",
        expectedOutput: "9",
        hidden: true,
      },
    ],
  },
  {
    /* Rung 10, advanced only. The first table in the year with TWO indices
       whose second one is not a position in the input — the remaining capacity
       — which is the step from "the table is the list again" to "the table is
       the state". Both natural greedy orderings are proposed in the prompt
       and both have a case that kills them; the one-item case with a capacity
       twice its weight kills the other classic error, a one-dimensional table
       walked forwards, which lets the same rucksack hold one thing twice.

       `int`: 50 items worth at most 1000 each caps the answer at 50 000.

       COMPLEXITY RE-CALIBRATED FOR C++. The last case used to carry 25 items,
       sized so that Python could not walk 2^25 subsets. C++ can: 2^25 · 25 is
       about 8·10^8 operations, perhaps two seconds, which is not a refusal. It
       now carries 45 items — 2^45 is 3.5·10^13 and finishes on no machine —
       while the table is 46 × 501 cells and finishes instantly. */
    id: "m8.p10",
    type: "write_code",
    skillRefs: ["dp.table", "dp.core", "greedy.counterexample"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk:
        "Бірінші жолда n мен W сандары беріледі (1 ≤ n ≤ 50, 0 ≤ W ≤ 500) — заттардың саны және рюкзак көтере алатын ең үлкен салмақ. " +
        "Келесі n жолдың әрқайсысында екі бүтін сан тұрады: заттың салмағы w және құндылығы v (1 ≤ w ≤ 100, 0 ≤ v ≤ 1000). " +
        "Әр зат бір-ақ дана: оны алуға немесе алмауға болады, екі рет алуға болмайды. " +
        "Жалпы салмағы W-дан аспайтындай етіп заттарды таңдап, олардың құндылықтарының қосындысын ең үлкен ет. Осы қосындыны шығар. Ештеңе алмауға да болады, сондықтан жауап ешқашан теріс емес. " +
        "«Ең құнды заттан баста» ережесі де, «құндылығын салмағына бөлгенде ең үлкен шығатын заттан баста» ережесі де әрқашан дұрыс жауап бермейді — екеуін де шағын мысалда бұзып көр. " +
        "Барлық ішкі жиынды түгел қарауға да болмайды: 45 зат үшін нұсқалар саны 2-нің 45-дәрежесіне тең, ал кестеде бар болғаны 46 × 501 ұяшық. " +
        "Аралық нәтиженің мағынасы: dp[i][c] — тек алғашқы i затты қарағанда, жалпы салмағы c-дан аспайтындай таңдағандағы ең үлкен құндылық.",
      ru:
        "В первой строке даны числа n и W (1 ≤ n ≤ 50, 0 ≤ W ≤ 500) — количество предметов и наибольший вес, который выдерживает рюкзак. " +
        "В каждой из следующих n строк заданы два целых числа: вес предмета w и его ценность v (1 ≤ w ≤ 100, 0 ≤ v ≤ 1000). " +
        "Каждый предмет существует в одном экземпляре: его можно взять или не взять, но нельзя взять дважды. " +
        "Выбери предметы так, чтобы их общий вес не превышал W, а сумма ценностей была наибольшей. Выведи эту сумму. Не брать ничего тоже разрешено, поэтому ответ никогда не бывает отрицательным. " +
        "Ни правило «начинай с самого ценного предмета», ни правило «начинай с того, у кого ценность, делённая на вес, наибольшая» не дают верного ответа всегда — сломай оба на небольшом примере. " +
        "Перебрать все подмножества тоже нельзя: для 45 предметов вариантов 2 в степени 45, а в таблице всего 46 × 501 ячейка. " +
        "Смысл промежуточного результата: dp[i][c] — наибольшая ценность, которую можно набрать, если смотреть только на первые i предметов и держать общий вес не больше c.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, cap;\n" +
      "    cin >> n >> cap;\n" +
      "    vector<int> w(n, 0);\n" +
      "    vector<int> v(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> w[i] >> v[i];\n" +
      "    }\n" +
      "    vector<vector<int>> dp(n + 1, vector<int>(cap + 1, 0));\n" +
      "    for (int i = 1; i <= n; i++) {\n" +
      "        for (int c = 0; c <= cap; c++) {\n" +
      "            dp[i][c] = dp[i - 1][c];\n" +
      "            if (w[i - 1] <= c && dp[i - 1][c - w[i - 1]] + v[i - 1] > dp[i][c]) {\n" +
      "                dp[i][c] = dp[i - 1][c - w[i - 1]] + v[i - 1];\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n][cap];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 5\n2 3\n3 4\n4 5", expectedOutput: "7" },
      /* Most-valuable-first takes the 3 kg item worth 5 and then nothing else
         fits: 5. Two items of 2 kg worth 3 each give 6. */
      { input: "3 4\n3 5\n2 3\n2 3", expectedOutput: "6", hidden: true },
      /* Best-value-per-kilogram first takes 10/6 and leaves 4 kg unusable: 10.
         The two 5 kg items give 16. */
      { input: "3 10\n6 10\n5 8\n5 8", expectedOutput: "16", hidden: true },
      /* One item and a capacity of twice its weight. A one-dimensional table
         walked from small capacity upwards takes the same item twice and
         prints 6. */
      { input: "1 4\n2 3", expectedOutput: "3", hidden: true },
      /* Two DIFFERENT items of the same weight and value, so a program that
         refused to take two things after the case above still has to. */
      { input: "2 4\n2 3\n2 3", expectedOutput: "6", hidden: true },
      /* Capacity 0: nothing fits, and the loop over c must still run. */
      { input: "1 0\n1 5", expectedOutput: "0", hidden: true },
      /* The single item is one kilogram too heavy, then exactly fits: the
         boundary itself and one step below it. */
      { input: "1 1\n5 10", expectedOutput: "0", hidden: true },
      { input: "1 5\n5 10", expectedOutput: "10", hidden: true },
      /* Everything fits: the answer is the total. */
      { input: "3 100\n1 1\n2 2\n3 3", expectedOutput: "6", hidden: true },
      /* Every item is worth nothing. */
      { input: "2 5\n1 0\n2 0", expectedOutput: "0", hidden: true },
      /* Forty-five items against a capacity of 500 while the total weight is
         2075: the table is 46 × 501 cells and finishes at once, and walking
         all 2^45 subsets finishes on no machine that exists. */
      {
        input:
          "45 500\n92 450\n34 964\n72 242\n75 584\n13 445\n65 259\n10 546\n98 469\n68 562\n" +
          "76 665\n14 776\n87 268\n36 718\n18 953\n77 937\n20 60\n27 181\n7 120\n62 52\n" +
          "82 226\n77 627\n40 543\n61 897\n53 488\n11 22\n3 271\n90 935\n9 740\n2 670\n" +
          "47 800\n51 280\n15 835\n67 250\n2 54\n80 152\n72 324\n89 21\n45 647\n69 718\n" +
          "4 380\n9 82\n100 133\n12 494\n12 844\n22 88",
        expectedOutput: "12897",
        hidden: true,
      },
    ],
  },
];
