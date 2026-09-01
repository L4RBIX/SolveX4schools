import type { LessonBlock } from "../../types";

/**
 * m9.c3 · 3-жаттығу жарысы — the third of May's four practice contests.
 *
 * PDF p.10 gives the format and nothing else: «төрт 45 минуттық жаттығу
 * жарысы». Five problems, forty-five minutes. The clause that governs every
 * line below is the one before it — «Бұл айда жаңа тақырып жоқ» — so no problem
 * here needs a method the year has not already taught, and each block's comment
 * names the month and the technique it draws on. That naming is not decoration:
 * it is the only way a later reader can check the claim.
 *
 * The problems are `product-authored`. The programme specifies the contest
 * FORMAT, not these five tasks, and claiming curriculum provenance for a
 * scenario about a training camp would put a page citation behind something the
 * PDF never says.
 *
 * ## Why the months are shuffled
 *
 * Contest 1 walks the year's first half, contest 2 its second. This one is
 * mixed: p1 is October, p2, p3 and p5 are April, p4 is December and January
 * used together. A learner cannot read the method off the problem's position,
 * which is most of the difference between a contest and an exercise set — and
 * it is what this lesson's own objective «жеке қателер тізімін қолдану» needs,
 * because a personal error checklist is only worth anything when nobody has
 * told you which page to open.
 *
 * ## p3 is a trap and the statement does not say so
 *
 * April's central skill is «қарсы мысал іздеу дағдысы» — breaking a proposed
 * strategy. p3 is the one problem here where the obvious greedy rule is WRONG:
 * take the largest number, then the largest still allowed, and so on. Its
 * sample, `2 7 9 3 1`, is deliberately one that greedy gets RIGHT, so nothing
 * on screen warns the learner. The counterexamples are hidden cases: `4 5 4`
 * (greedy takes 5 and scores 5, the answer is 8) and `1 9 1` (the
 * every-other-day rule scores 2, the answer is 9). Discovering that is the
 * exercise, so the prompt says nothing about it and the comment on p3 says
 * everything about it.
 *
 * ## The lesson's other objective decides the hidden cases
 *
 * «Шеткі жағдайды жіберер алдында тексеру» — check the edge case before you
 * submit. So every problem carries hidden cases at exactly the edges its own
 * shape has: n = 1, an answer of 0, the value sitting exactly ON a boundary,
 * the answer sitting at the LAST position, and for each problem the specific
 * degenerate program a learner in a hurry writes instead of the intended one.
 * Each block's comment lists those degenerate programs by name and points at
 * the case that kills each.
 *
 * ## Where the type boundary sits, worked out per problem
 *
 * p1's answer is at most n = 100 000. p2's is at most a million ones. p3's is at
 * most 100 000 days of 10 000 points taken every other day, which is 5 · 10⁸ —
 * inside `int` by a factor of four. p4's is at most n boats. All four are `int`
 * problems and their references say so by using `int`.
 *
 * **p5 is not**, and that is new. Its answer is a count of routes, and on an
 * open 18 × 18 map that count is 2 333 606 220 — past `int` by nine per cent.
 * The statement warns that the answer passes two billion, which is what a real
 * contest statement does, and the last hidden case is the map that charges for
 * it. A learner whose table is `int` gets a correct method and a wrong number,
 * with no message of any kind: m9.l2.b1's second point, arriving in a contest.
 *
 * ## Structural requirements
 *
 * Of the authoring contract's three honest options, this lesson takes **option
 * 2: guidance, not rules**. No prompt here tells the learner their solution
 * must define a function, must return rather than print, or must avoid a
 * builtin — output comparison cannot see any of that, and a rule the product
 * will not enforce is a lie told to a fourteen-year-old. p5 is the one place
 * where the shape of the solution is worth mentioning at all, and it is
 * mentioned as a free choice with the grading rule stated out loud.
 *
 * ## No `tracks`
 *
 * All five problems go to all three routes. A practice contest whose support
 * route is four problems is not the same event, and the differentiation the
 * programme asks for lives in when help opens and in the month's other lessons
 * — not in quietly handing one route a shorter contest. The written defence
 * that «тереңдетілген» owes is m9.l4's, not this lesson's.
 */

/**
 * A large input for `m9.c3.p4`, and an honest note about what it no longer does.
 *
 * Under Python this was a complexity guard and the file said so: two 4s among
 * 7 998 5s with L = 9 denies an early-exit pairing scan every partner, so the
 * quadratic solution took over 8 s against the reference's 0.10 s.
 *
 * **Re-measured under C++17, medians of nine runs: the reference takes 0.012 s
 * and the quadratic scan 0.046 s at -O2 — and at the -O0 Judge0 actually grades
 * at, 0.012 s and 0.661 s.** The quadratic scan is now some twelve times faster
 * than it was, and ~3 · 10⁷ operations is nothing against a 5 s budget: even
 * unoptimised the naive sits a factor of 7.6 inside the limit, which is the
 * smallest margin anywhere in this month and still far too large to grade on.
 *
 * The 14x spread between the two optimisation levels here — against 2x for
 * m9.l3.b6's naive — is the `vector<bool>` the scan marks passengers in: a
 * bit-packed proxy whose accessors disappear under inlining and do not at -O0.
 * Worth knowing before anyone quotes an -O2 number at a bound again.
 *
 * The guard cannot be restored through stdin: at two bytes a value
 * `EXECUTION_LIMITS.maxStdinBytes`
 * (16 KiB) caps a case at about 8 190 numbers, which caps the naive work at
 * ~3 · 10⁷ — and that is fast in C++. Restoring it would mean generating the
 * weights in-program from a seed, as `m9.c1.p4` and `m9.c4.p3` now do; it is not
 * done here because those two are the contest's own complexity lessons and a
 * third copy of the same device in the same month would teach the device rather
 * than the algorithm.
 *
 * So the case stays and its job is stated correctly: it is the stated ceiling
 * actually exercised — 8 000 weights read, a shape where almost nobody can share
 * a boat, and an answer of 7 998 that no small case reaches. It does not
 * separate the two-pointer solution from the quadratic one, and no prompt
 * claimed it did — this problem's statement names no method at all, which is
 * what makes it honest without needing a disclaimer.
 *
 * `tests/school/may-complexity-guards.test.ts` holds both halves of that: that
 * the quadratic scan answers this case correctly, and that the prompt has not
 * quietly grown a method it cannot enforce.
 *
 * 16 007 bytes with the appended newline, inside `EXECUTION_LIMITS.maxStdinBytes`.
 */
const M9_C3_P4_LARGE_INPUT = `8000 9\n4 4 ${"5 ".repeat(7997)}5`;

/**
 * The case that makes `m9.c3.p5` mean what its prompt says.
 *
 * An open 18 × 18 map: 2 333 606 220 routes, which is both the answer and the
 * reason the answer needs `long long`. It does two jobs that no smaller map can
 * do at once.
 *
 * **The complexity guard, re-derived.** The Python version used a 15 × 15 map
 * with 40 116 600 routes and said that walking them one at a time «does not
 * finish». Measured in C++ at -O2 that walk now takes **0.65 s** — it finishes
 * comfortably inside the 5 s budget, so the claim had become false and the bound
 * had stopped meaning anything. 17 × 17 takes 11.7 s, which clears the judge but
 * sits inside the harness's own 10 s only by luck; 18 × 18 was still running
 * after forty seconds. So the stated bound moved from 15 to 18, which is the
 * smallest change that makes the sentence true again, and the table still fills
 * 324 cells in well under a millisecond.
 *
 * **The type boundary.** `int` holds 2 147 483 647 and this answer is
 * 2 333 606 220. At 15 × 15 an `int` table was correct and the bound taught
 * nothing about types; at 18 × 18 it is a wrong answer with no message attached,
 * which is the failure m9.l2.b1 exists to make familiar. The statement says the
 * answer passes two billion, exactly as a real problem would.
 */
const M9_C3_P5_OPEN_18 = `18 18\n${(".".repeat(18) + "\n").repeat(17)}${".".repeat(18)}`;

export const M9_C3: LessonBlock[] = [
  {
    /*
     * p1 · OCTOBER — a single traversal with an accumulator and a reset
     * (m2.l5's «тізімді бір рет қарап шығу» plus «жинақтаушы айнымалы»).
     * The easy one: five minutes for anyone who has done the year.
     *
     * The degenerate programs, and what kills each:
     *  - counts every win instead of the longest run of them → the visible
     *    sample has six wins and an answer of 3;
     *  - updates `best` only when a loss ends a run, so a run that reaches the
     *    end of the list is never recorded → "1 1 1 1" (answer 4, it prints 0)
     *    and "0 1 1 0 1 1 1", where the longest run is the LAST one;
     *  - forgets to reset `cur` after a loss → same output as counting wins;
     *  - starts `best` at 1 or at a[0] instead of 0 → "0 0 0" and "1\n0".
     */
    id: "m9.c3.p1",
    type: "challenge",
    skillRefs: ["contest.time_split", "lists.traverse", "loops.accumulator", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "**A. Жеңіс сериясы.** Мектеп командасы n ойын өткізді. Нәтижелер ойналу ретімен берілген: 1 — жеңіс, 0 — жеңіліс.\n\nҚатарынан келген жеңістердің ең ұзын тізбегі неше ойыннан тұрады?\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100000). Екінші жолда бос орынмен бөлінген n сан, әрқайсысы 0 не 1.\n\n**Шығыс.** Бір бүтін сан — қатарынан келген жеңістердің ең үлкен саны. Команда бірде-бір ойында жеңбесе, 0 шығар.\n\n**Мысал.**\n\n```\n8\n1 1 0 1 1 1 0 1\n```\n\nЖауап: `3`.",
      ru: "**A. Серия побед.** Школьная команда сыграла n матчей. Результаты даны в том порядке, в котором матчи шли: 1 — победа, 0 — поражение.\n\nИз скольких матчей состоит самая длинная серия побед подряд?\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100000). Во второй строке n чисел через пробел, каждое равно 0 или 1.\n\n**Выход.** Одно целое число — наибольшее количество побед подряд. Если команда не выиграла ни одного матча, выведи 0.\n\n**Пример.**\n\n```\n8\n1 1 0 1 1 1 0 1\n```\n\nОтвет: `3`.",
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
      "    int best = 0;\n" +
      "    int cur = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] == 1) {\n" +
      "            cur = cur + 1;\n" +
      "            if (cur > best) best = cur;\n" +
      "        } else {\n" +
      "            cur = 0;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "8\n1 1 0 1 1 1 0 1", expectedOutput: "3" },
      /* The longest run is the whole list: a program that records `best` only
         when a loss arrives never records anything and prints 0. */
      { input: "4\n1 1 1 1", expectedOutput: "4", hidden: true },
      /* The longest run is the LAST one — the same defect, seen a second way. */
      { input: "7\n0 1 1 0 1 1 1", expectedOutput: "3", hidden: true },
      { input: "3\n0 0 0", expectedOutput: "0", hidden: true },
      { input: "1\n1", expectedOutput: "1", hidden: true },
      { input: "1\n0", expectedOutput: "0", hidden: true },
      { input: "6\n1 0 1 0 1 0", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * p2 · APRIL — a greedy whose rule really is correct («әр қадамда ең тиімді
     * нұсқаны таңдап, оның шынымен ең жақсы жауапқа жеткізетінін тексеру»),
     * carried out with September's `/` and `%`.
     *
     * The rule is safe here for a reason the learner can check: every
     * denomination divides the next one up (1|5, 5|10, 10|50, 50|100, 100|500,
     * 500|1000), so taking the largest note that still fits can never cost more
     * than a cleverer split would. April's coin problem where greedy FAILS
     * belongs to April's own lesson; putting both in one contest would tell the
     * learner which of the two they are looking at.
     *
     * S is at least 0 and never negative, so `s / notes[i]` and `s % notes[i]`
     * behave exactly as Python's `//` and `%` did and no expected output moved.
     * The Python-era degenerate «uses `/` instead of `//` and prints a float» is
     * simply impossible in C++: `/` on two `int`s already truncates. What
     * replaces it is the mirror-image mistake — declaring `s` as a `double`,
     * after which `s / 1000` is 1.234 and the program prints a decimal point the
     * checker does not expect.
     *
     * The degenerate programs, and what kills each:
     *  - keeps only the round denominations 1000/100/10/1 → "999" (answer 15,
     *    it prints 27) and "6" (answer 2, it prints 6);
     *  - `s` declared as a `double` → every case, on the decimal point;
     *  - never updates the remainder → "1234";
     *  - assumes at least one note is always needed → "0".
     */
    id: "m9.c3.p2",
    type: "challenge",
    skillRefs: ["contest.time_split", "greedy.core", "arith.integer_division", "arith.remainder"],
    sourceType: "product-authored",
    prompt: {
      kk: "**B. Кассадағы қайтарым.** Кассада 1000, 500, 100, 50, 10, 5 және 1 теңгелік купюралар мен монеталар шексіз көп. Сатып алушыға дәл S теңге қайтару керек, әрі мұны мүмкіндігінше аз купюрамен және монетамен істеу керек.\n\n**Кіріс.** Бір бүтін сан S (0 ≤ S ≤ 1000000).\n\n**Шығыс.** Бір бүтін сан — керек болатын купюралар мен монеталардың ең аз саны.\n\n**Мысал.** S = 1234 болғанда жауап `10`: бір 1000, екі 100, үш 10 және төрт 1.",
      ru: "**B. Сдача в кассе.** В кассе неограниченно много купюр и монет достоинством 1000, 500, 100, 50, 10, 5 и 1 тенге. Покупателю нужно выдать ровно S тенге, причём как можно меньшим количеством купюр и монет.\n\n**Вход.** Одно целое число S (0 ≤ S ≤ 1000000).\n\n**Выход.** Одно целое число — наименьшее количество купюр и монет.\n\n**Пример.** При S = 1234 ответ `10`: одна купюра 1000, две по 100, три по 10 и четыре монеты по 1.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    int notes[7] = {1000, 500, 100, 50, 10, 5, 1};\n" +
      "    int count = 0;\n" +
      "    for (int i = 0; i < 7; i++) {\n" +
      "        count = count + s / notes[i];\n" +
      "        s = s % notes[i];\n" +
      "    }\n" +
      "    cout << count;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "1234", expectedOutput: "10" },
      /* Zero notes is a real answer, and it is the one a `while` written the
         wrong way round gets wrong. */
      { input: "0", expectedOutput: "0", hidden: true },
      /* Every denomination is used exactly once or four times: the case that
         catches a solution missing 500, 50 or 5. */
      { input: "999", expectedOutput: "15", hidden: true },
      { input: "5", expectedOutput: "1", hidden: true },
      { input: "6", expectedOutput: "2", hidden: true },
      { input: "4", expectedOutput: "4", hidden: true },
      { input: "1000000", expectedOutput: "1000", hidden: true },
    ],
  },
  {
    /*
     * p3 · APRIL — one-dimensional dynamic programming over a list, and THE
     * trap of this contest. The family is the PDF's own «көрші екі санды қатар
     * алмау шартымен таңдау»; the table is «қадамдап толтырылатын кесте».
     *
     * dp[i] is the largest score obtainable from the first i + 1 days, and the
     * recurrence is the one April spends its month on: either day i is a rest
     * day and the answer is dp[i - 1], or it is a training day and the answer
     * is dp[i - 2] + a[i].
     *
     * `int` is enough and it was checked rather than assumed: 100 000 days at
     * 10 000 points, taken every other day, is 5 · 10⁸ — a quarter of what `int`
     * holds. p5 is where this contest's type boundary actually bites.
     *
     * THE STATEMENT DOES NOT WARN THAT GREEDY FAILS, and that is deliberate —
     * finding it out is the exercise. The sample was chosen because greedy gets
     * it right: on `2 7 9 3 1` both the largest-first rule and the table print
     * 12. The counterexamples are all hidden.
     *
     * The degenerate programs, and what kills each:
     *  - largest-first greedy (take the biggest number, cross out its
     *    neighbours, repeat) → "4 5 4" scores 5, the answer is 8;
     *  - every-other-day (take days 1, 3, 5, …) → "1 9 1" scores 2, the answer
     *    is 9;
     *  - the better of the two alternating sums (odd days vs even days) →
     *    "5 1 1 5" scores 6, the answer is 10;
     *  - dp[i] = max(dp[i-1], dp[i-2]) + a[i], the recurrence written with the
     *    `+ a[i]` outside the max → the visible sample already gives 20;
     *  - a table that never handles n = 1 or n = 2 → "7" and "3 8". In C++ the
     *    second of those is not an `IndexError` with a line number: `dp[1]` on a
     *    one-element vector is undefined behaviour, so the program either stops
     *    with nothing readable attached or prints a number that is not the
     *    answer. Both are caught by the case; only one of them looks like a bug.
     */
    id: "m9.c3.p3",
    type: "challenge",
    skillRefs: ["contest.upsolving", "dp.core", "dp.table", "greedy.counterexample"],
    sourceType: "product-authored",
    prompt: {
      kk: "**C. Жаттығу лагері.** Лагерь n күнге созылады. i-күні жаттыққан оқушы a[i] ұпай жинайды, бірақ жаттығудан кейінгі күні міндетті түрде демалады: сондықтан қатар тұрған екі күнді бірге таңдауға болмайды. Демалыс күні ұпай берілмейді, ал жаттығуды қай күндері өткізетінін оқушының өзі таңдайды.\n\nЕң көп дегенде неше ұпай жинауға болады?\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100000). Екінші жолда бос орынмен бөлінген n сан: a[1] … a[n] (0 ≤ a[i] ≤ 10000).\n\n**Шығыс.** Бір бүтін сан — жинауға болатын ең үлкен ұпай саны.\n\n**Мысал.**\n\n```\n5\n2 7 9 3 1\n```\n\nЖауап: `12` — 1-, 3- және 5-күндері жаттығу.",
      ru: "**C. Тренировочный лагерь.** Лагерь длится n дней. Если ученик тренируется в день i, он получает a[i] очков, но на следующий день обязан отдыхать: поэтому два подряд идущих дня выбрать нельзя. В день отдыха очки не начисляются, а дни тренировок ученик выбирает сам.\n\nСколько очков можно набрать самое большее?\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100000). Во второй строке n чисел через пробел: a[1] … a[n] (0 ≤ a[i] ≤ 10000).\n\n**Выход.** Одно целое число — наибольшее количество очков.\n\n**Пример.**\n\n```\n5\n2 7 9 3 1\n```\n\nОтвет: `12` — тренировки в 1-й, 3-й и 5-й дни.",
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
      "    vector<int> dp(n, 0);\n" +
      "    dp[0] = a[0];\n" +
      "    if (n > 1) dp[1] = max(a[0], a[1]);\n" +
      "    for (int i = 2; i < n; i++) {\n" +
      "        dp[i] = max(dp[i - 1], dp[i - 2] + a[i]);\n" +
      "    }\n" +
      "    cout << dp[n - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n2 7 9 3 1", expectedOutput: "12" },
      /* Largest-first greedy takes the 5 and stops. */
      { input: "3\n4 5 4", expectedOutput: "8", hidden: true },
      /* Every-other-day takes days 1 and 3 and scores 2. */
      { input: "3\n1 9 1", expectedOutput: "9", hidden: true },
      /* Both alternating sums are 6; the answer takes the two ends. */
      { input: "4\n5 1 1 5", expectedOutput: "10", hidden: true },
      { input: "1\n7", expectedOutput: "7", hidden: true },
      { input: "2\n3 8", expectedOutput: "8", hidden: true },
      /* Every day is worth nothing: the answer is 0, not "pick something". */
      { input: "4\n0 0 0 0", expectedOutput: "0", hidden: true },
      { input: "6\n6 1 1 6 1 6", expectedOutput: "18", hidden: true },
    ],
  },
  {
    /*
     * p4 · DECEMBER AND JANUARY TOGETHER — «сандарды реттеу» (m4, sorting) and
     * «екі шекара әдісі» (m5, two pointers) in one solution. The exchange
     * argument that makes the pairing rule safe is April's, and the problem is
     * placed fourth because the learner has to notice that all three months
     * are needed at once.
     *
     * Sort the weights, then walk one pointer from each end: if the lightest
     * and the heaviest fit together they share a boat, otherwise the heaviest
     * goes alone. Either way the heaviest is dealt with, so `hi` always moves
     * and the loop always ends.
     *
     * `hi` is an `int` index and goes to −1 when the two pointers cross, which
     * is why the loop condition is `lo <= hi` on `int`s and not on anything
     * unsigned — `w.size()` is unsigned and a `size_t hi` would wrap to a huge
     * number instead of going negative, hang the loop and read off the end of
     * the vector. That is a C++ hazard with no Python counterpart and it is the
     * reason both indices are declared `int` here rather than left to `auto`.
     *
     * The degenerate programs, and what kills each:
     *  - two pointers WITHOUT sorting first → "4 5 / 4 1 3 2" is the same
     *    multiset as the visible sample and gives 3 instead of 2;
     *  - pairing neighbours after sorting (1st with 2nd, 3rd with 4th, …) →
     *    the visible sample gives 3, and "6 10 / 1 2 3 7 8 9" gives 4 instead
     *    of 3;
     *  - `<` where `<=` belongs → "2 6 / 3 3", exactly on the limit, gives 2
     *    instead of 1;
     *  - "half the people, rounded up" → "3 5 / 4 4 4" gives 2 instead of 3;
     *  - a loop written `while (lo < hi)`, which loses the last passenger when
     *    the two pointers meet → "1 10 / 7" gives 0 instead of 1.
     */
    id: "m9.c3.p4",
    type: "challenge",
    skillRefs: ["contest.time_split", "sort.basic", "twopointers.core", "greedy.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "**D. Өзеннен өту.** Жазғы лагерьдің n оқушысы өзеннен өтуі керек. Бір қайыққа ең көбі екі оқушы отыра алады, әрі отырғандардың салмағының қосындысы L килограммнан аспауы керек. Әр оқушының салмағы жеке-жеке L-ден аспайды, сондықтан әркімді бөлек өткізуге әрқашан болады.\n\nБарлығын өткізу үшін ең аз дегенде неше қайық керек?\n\n**Кіріс.** Бірінші жолда n мен L сандары (1 ≤ n ≤ 100000, 1 ≤ L ≤ 1000). Екінші жолда бос орынмен бөлінген n сан — оқушылардың салмағы (1 ≤ w[i] ≤ L).\n\n**Шығыс.** Бір бүтін сан — қайықтардың ең аз саны.\n\n**Мысал.**\n\n```\n4 5\n1 2 3 4\n```\n\nЖауап: `2` — бір қайықта 1 мен 4, екіншісінде 2 мен 3 отырады.",
      ru: "**D. Переправа.** n учеников летнего лагеря должны переправиться через реку. В одну лодку садятся не больше двух учеников, и сумма их весов не должна превышать L килограммов. Вес каждого ученика по отдельности не превышает L, так что перевезти каждого отдельно можно всегда.\n\nСколько лодок нужно самое меньшее, чтобы переправить всех?\n\n**Вход.** В первой строке числа n и L (1 ≤ n ≤ 100000, 1 ≤ L ≤ 1000). Во второй строке n чисел через пробел — веса учеников (1 ≤ w[i] ≤ L).\n\n**Выход.** Одно целое число — наименьшее количество лодок.\n\n**Пример.**\n\n```\n4 5\n1 2 3 4\n```\n\nОтвет: `2` — в одной лодке 1 и 4, в другой 2 и 3.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    sort(w.begin(), w.end());\n" +
      "    int lo = 0;\n" +
      "    int hi = n - 1;\n" +
      "    int boats = 0;\n" +
      "    while (lo <= hi) {\n" +
      "        if (w[lo] + w[hi] <= limit) lo = lo + 1;\n" +
      "        hi = hi - 1;\n" +
      "        boats = boats + 1;\n" +
      "    }\n" +
      "    cout << boats;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4 5\n1 2 3 4", expectedOutput: "2" },
      /* One passenger: the pointers start on the same person. */
      { input: "1 10\n7", expectedOutput: "1", hidden: true },
      /* Nobody can share: the answer is n, not n rounded up over two. */
      { input: "3 5\n4 4 4", expectedOutput: "3", hidden: true },
      /* Exactly on the limit — 3 + 3 = 6 is allowed. */
      { input: "2 6\n3 3", expectedOutput: "1", hidden: true },
      { input: "6 10\n1 2 3 7 8 9", expectedOutput: "3", hidden: true },
      /* The visible sample's weights in a different order: a solution that
         forgot to sort gives 3 here and 2 on the sample. */
      { input: "4 5\n4 1 3 2", expectedOutput: "2", hidden: true },
      { input: "5 6\n1 1 5 5 6", expectedOutput: "3", hidden: true },
      /* The stated ceiling, actually exercised. See M9_C3_P4_LARGE_INPUT — it
         no longer separates the quadratic solution, and the note says so. */
      { input: M9_C3_P4_LARGE_INPUT, expectedOutput: "7998", hidden: true },
    ],
  },
  {
    /*
     * p5 · APRIL, on MARCH's map format — the dynamic-programming table the
     * PDF names by hand: «тордағы жолдар санын есептеу», filled «қадамдап».
     * The input shape (n m, then n lines of '.' and '#') is March's, so nothing
     * about reading the map is new either.
     *
     * dp[i][j] is the number of routes from the top-left cell to cell (i, j).
     * A blocked cell holds 0, the start holds 1, and every other free cell
     * holds the sum of the cell above and the cell to the left — the neighbours
     * a right-or-down walk can have arrived from.
     *
     * TWO THINGS CHANGED FOR C++, and both are in `M9_C3_P5_OPEN_18`. The bound
     * moved from 15 to 18 because a 15 × 15 route walk finishes in 0.65 s in C++
     * where it did not finish in Python, so the claim this block rests on had
     * gone false; and at 18 the answer is 2 333 606 220, which does not fit
     * `int`, so the table has to be `long long` and the statement says the answer
     * passes two billion. One case now carries both lessons.
     *
     * The degenerate programs, and what kills each:
     *  - counting routes as though the map were empty → "3 3" with a wall in
     *    the middle prints 6 instead of 2, and "2 2 / .# / #." prints 2
     *    instead of 0;
     *  - route-by-route enumeration → the 18 × 18 case does not finish;
     *  - an `int` table → the 18 × 18 case, silently, with no message;
     *  - a table that only starts at row 1 and column 1 and never fills the
     *    first row and first column → "1 5 / ..#.." and "5 1", the maps that
     *    are a single line, print the wrong answer;
     *  - "there is always at least one route" → "2 2 / .# / #." is 0.
     */
    id: "m9.c3.p5",
    type: "challenge",
    skillRefs: ["contest.upsolving", "dp.core", "dp.table", "grid.cells"],
    sourceType: "product-authored",
    prompt: {
      kk: "**E. Тордағы жолдар.** Курьер n жол мен m бағаннан тұратын тордың сол жақ жоғарғы ұяшығында тұр және оң жақ төменгі ұяшыққа жетуі керек. Бір қадамда ол тек оңға немесе төмен жүре алады. Кейбір ұяшықтарда жөндеу жүріп жатыр, оларға баспайды.\n\nСол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа неше түрлі жол бар? Екі жол кемінде бір қадамымен өзгеше болса, олар түрлі жол саналады.\n\n**Кіріс.** Бірінші жолда n мен m сандары (1 ≤ n, m ≤ 18). Келесі n жолда тор: әр жолда m таңба, `.` — бос ұяшық, `#` — жабық ұяшық. Сол жақ жоғарғы және оң жақ төменгі ұяшықтар әрқашан бос.\n\n**Шығыс.** Бір бүтін сан — жолдардың саны. Бірде-бір жол болмаса, 0 шығар.\n\n**Ескерту.** Жауап үлкен болуы мүмкін: 18 × 18 бос торда жолдар саны екі миллиардтан асады. Оның қандай сан түріне сыятынын өзің шеш.\n\n**Мысал.**\n\n```\n3 3\n...\n.#.\n...\n```\n\nЖауап: `2`.\n\nШешімнің құрылымын өзің таңдайсың: бөлек функция жазасың ба, бәрін бір бағдарламаға сыйдырасың ба — тексеруші тек шыққан санды салыстырады.",
      ru: "**E. Пути в таблице.** Курьер стоит в левой верхней клетке таблицы из n строк и m столбцов и должен добраться до правой нижней клетки. За один шаг он идёт только вправо или вниз. В некоторых клетках идёт ремонт, наступать на них нельзя.\n\nСколько существует различных путей из левой верхней клетки в правую нижнюю? Два пути считаются различными, если они отличаются хотя бы одним шагом.\n\n**Вход.** В первой строке числа n и m (1 ≤ n, m ≤ 18). В следующих n строках таблица: в каждой строке m символов, `.` — свободная клетка, `#` — закрытая клетка. Левая верхняя и правая нижняя клетки всегда свободны.\n\n**Выход.** Одно целое число — количество путей. Если пути нет ни одного, выведи 0.\n\n**Примечание.** Ответ может оказаться большим: на пустой таблице 18 × 18 путей больше двух миллиардов. Какой числовой тип для него подойдёт, реши сам.\n\n**Пример.**\n\n```\n3 3\n...\n.#.\n...\n```\n\nОтвет: `2`.\n\nСтруктуру решения выбираешь сам: писать ли отдельную функцию или уместить всё в одну программу — проверяющая система сравнивает только выведенное число.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<string> g(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> g[i];\n" +
      "    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            if (g[i][j] == '#') {\n" +
      "                dp[i][j] = 0;\n" +
      "            } else if (i == 0 && j == 0) {\n" +
      "                dp[i][j] = 1;\n" +
      "            } else {\n" +
      "                long long total = 0;\n" +
      "                if (i > 0) total = total + dp[i - 1][j];\n" +
      "                if (j > 0) total = total + dp[i][j - 1];\n" +
      "                dp[i][j] = total;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n - 1][m - 1];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 3\n...\n.#.\n...", expectedOutput: "2" },
      { input: "3 3\n...\n...\n...", expectedOutput: "6", hidden: true },
      /* The smallest map there is: the courier is already at the finish. */
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      /* Both ends free, no route between them. */
      { input: "2 2\n.#\n#.", expectedOutput: "0", hidden: true },
      /* One row and one column: the two maps where the table is a single line
         and a first-row-only solution has nowhere to hide. */
      { input: "1 5\n..#..", expectedOutput: "0", hidden: true },
      { input: "5 1\n.\n.\n#\n.\n.", expectedOutput: "0", hidden: true },
      { input: "4 4\n....\n.#..\n..#.\n....", expectedOutput: "4", hidden: true },
      /* Two billion routes: the table finishes instantly, walking them one by
         one does not finish, and an `int` answer is wrong. See
         M9_C3_P5_OPEN_18. */
      { input: M9_C3_P5_OPEN_18, expectedOutput: "2333606220", hidden: true },
    ],
  },
];
