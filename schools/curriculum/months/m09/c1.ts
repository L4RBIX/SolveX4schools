import type { LessonBlock } from "../../types";

/**
 * m9.c1 · «1-жаттығу жарысы» / «Тренировочное соревнование 1» — 45 minutes.
 *
 * The clauses that drive this lesson, all from PDF p.10:
 *
 * > «төрт 45 минуттық жаттығу жарысы»
 *
 * This is the first of the four. The 45 minutes and the contest format are the
 * programme's; the five problems are not — the PDF specifies the FORMAT and
 * never a problem list, so every block here is `product-authored` and none of
 * them cites a page. The page belongs to `month-09-may.ts`, which implements
 * the format itself.
 *
 * > «Бұл айда жаңа тақырып жоқ.»
 *
 * The rule that shapes every problem below. Not one of them needs a technique
 * the year has not already taught, and each block's comment names the month
 * that taught it and the technique it expects. A problem that needed something
 * new would be out of scope no matter how good it was, and a contest whose
 * problems need May would produce evidence about May — which is the opposite of
 * what this month is for.
 *
 * > «есептер арасында уақытты бөлу … уақытында басқа есепке ауысу»
 *
 * So the five are ordered by difficulty and the gaps between them are real:
 * roughly 5 · 7 · 10 · 10 · 13 minutes. A learner who spends twenty minutes on
 * C has already lost D and E, and that is the lesson `contest.time_split`
 * exists to teach — the ordering is the teaching device, not decoration.
 *
 * ## Which half of the year this contest draws on
 *
 * The first: September/October (A), October (B), November (C), December (D),
 * January (E). Contests 2–4 take the second half. Between them the four
 * contests are meant to touch the whole year, which is why the `skillRefs` here
 * name YEAR skills — `loops.accumulator`, `func.return`, `precompute.prefix`,
 * `bsearch.core` — and not the four `contest.*` skills. Solving problem D is
 * evidence about prefix sums; it is not evidence about how the learner split
 * their 45 minutes, and filing it as such would put a number on the one thing
 * this month actually wants a teacher to watch. The lesson declares the two
 * contest skills; the problems declare what they really measure.
 *
 * ## Why `challenge` and not `arena_problem`
 *
 * `ArenaProblemBlock` renders as a bare prompt: no editor, no submission, no
 * cases — see `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §2. A
 * contest problem the learner cannot submit is not a contest problem.
 * `challenge` renders through the same code-task surface as `write_code` and is
 * the taxonomy's block for a harder standalone problem, so all five are that.
 *
 * ## Every input carries its own count
 *
 * A, B and C used to open with a bare line of numbers, which `input().split()`
 * made free in Python. In C++ a line of unknown length needs `while (cin >> x)`,
 * an idiom the year has never shown, so each of them now states n first and the
 * learner writes October's `for`. The change is to the input format and to
 * nothing else: the questions, the bounds and the answers are what they were.
 *
 * ## Where `long long` is the whole difficulty, and where it is not
 *
 * B and D and E were re-checked against `int` by arithmetic rather than by
 * habit. B's water level plus a day's change reaches 2 · 10⁹ and overflows;
 * D's window sums reach 2 · 10⁹ likewise; E's `low + high + 1` reaches 2 · 10⁹
 * and its `got` reaches 2 · 10¹⁴. All three need `long long` and none of them
 * says so — the stated bounds are the only warning, which is what
 * `m9.l2.b1` spent a page teaching a learner to read. A and C are genuinely
 * `int` problems and are left that way, because a month where the answer is
 * always `long long` teaches a reflex rather than a check.
 *
 * ## What the constraints promise and what the cases can prove
 *
 * D was re-authored for C++ and now proves its own bound: its data is generated
 * inside the program from a three-number seed, so n reaches 2 000 000 through
 * 15 bytes of stdin and the O(n·k) solution needs 10¹² steps against C++'s ~10⁸
 * a second. Measured: the reference answers the largest case in 0.02 s and the
 * quadratic one is still running after twenty seconds. The block comment tells
 * the whole story, including what it used to be.
 *
 * E still states a bound — m ≤ 10⁹ — that rules out trying every m, and its
 * cases still cannot prove it: they are small, and a correct linear scan over m
 * would pass every one of them. That shortfall is the same one `m4.l6` carries
 * and it is recorded here rather than dressed up. Nothing in E's prompt claims
 * the checker times anything.
 */

/**
 * The seed for `m9.c1.p4`'s largest case, and why the problem generates its
 * data at all.
 *
 * The Python version of D handed the learner 200 000 numbers in the statement's
 * input and stated n ≤ 200 000. It could never test that: at two bytes a value
 * `EXECUTION_LIMITS.maxStdinBytes` (16 KiB) caps a case at about 8 190 numbers,
 * so the most work a naive O(n·k) solution could be made to do was ~3 · 10⁷
 * operations — which took the Python solution 4.5 s against a 5 s budget, close
 * enough to be unreliable, and which C++ finishes in about four hundredths of a
 * second. Under C++ the task could no longer tell a good solution from a bad one
 * at all.
 *
 * Generating the array from a seed removes the ceiling entirely: `2000000
 * 1000000 123` is fifteen bytes of stdin and two million days of data. The
 * sliding window does 2 · 10⁶ steps and finishes in 0.02 s; recomputing each
 * window from scratch does 10¹² and was killed at twenty seconds having printed
 * nothing. That is a constraint the other method cannot meet — option 1 of the
 * authoring contract — rather than a sentence in a prompt that nothing enforces.
 *
 * The recurrence is chosen so a learner's own `int` survives it: t stays below
 * 1 000 003 and t · 1103 is at most 1.1 · 10⁹, inside `int` by a factor of two.
 * The generator is not the trap; the sum of two million values of up to 1000 is.
 */
const M9_C1_P4_LARGE_CASE = "2000000 1000000 123";

export const M9_C1: LessonBlock[] = [
  {
    /*
     * A · five minutes, and it should be five minutes for anyone who has done
     * the year.
     *
     * Method: month 1 for reading three lines and a strict comparison, month 2
     * (m2.l1, m2.l5) for the single pass with a counter. Nothing else.
     *
     * The degenerate programs and the case that kills each:
     *   · `>=` instead of `>` — «4 / 4 4 4 4 / 4» answers 4 where the truth is
     *     0, and the visible sample already answers 5 instead of 3.
     *   · counting every throw — «3 / 1 1 1 / 5» answers 3, the truth is 0.
     *   · a loop that stops one element short — «4 / 1 1 1 9 / 5» answers 0.
     *   · a loop that starts one element late — «4 / 9 1 1 1 / 5» answers 0.
     * The last two are «соңғы элементті өткізіп жіберу», the error October's
     * page names by hand, and a contest's first problem is where it costs the
     * least to be caught by it.
     */
    id: "m9.c1.p1",
    type: "challenge",
    skillRefs: ["loops.for", "loops.counter", "compare.operators", "io.read"],
    sourceType: "product-authored",
    prompt: {
      kk: "A. Норманы асырған лақтырулар.\n\nЖаттықтырушы жаттығуда әр лақтырудың ұпайын жазып отырды. Ол норманы қатаң асырған лақтырулар нешеу екенін білгісі келеді.\n\nЕнгізу. Бірінші жолда n саны — лақтырулардың саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан — лақтырулардың ұпайлары, әрқайсысы 0-ден 1000-ға дейін. Үшінші жолда бір бүтін сан x — норма (0 ≤ x ≤ 1000).\n\nШығару. Бір бүтін сан: ұпайы x-тен ҚАТАҢ үлкен лақтырулардың саны. Ұпай дәл x-ке тең болса, ол лақтыру есептелмейді.\n\nМысал. n = 5, ұпайлар `7 3 9 3 5` және x = 3 болғанда жауап 3 — бұл 7, 9 және 5 ұпайлары.",
      ru: "A. Броски выше нормы.\n\nТренер записывал очки каждого броска на тренировке. Он хочет знать, сколько бросков строго превысили норму.\n\nВвод. В первой строке число n — количество бросков (1 ≤ n ≤ 1000). Во второй строке через пробел n целых чисел — очки бросков, каждое от 0 до 1000. В третьей строке одно целое число x — норма (0 ≤ x ≤ 1000).\n\nВывод. Одно целое число: количество бросков, очки которых СТРОГО больше x. Бросок ровно с x очками не засчитывается.\n\nПример. При n = 5, очках `7 3 9 3 5` и x = 3 ответ 3 — это 7, 9 и 5.",
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
      "    int x;\n" +
      "    cin >> x;\n" +
      "    int count = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > x) count = count + 1;\n" +
      "    }\n" +
      "    cout << count;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n7 3 9 3 5\n3", expectedOutput: "3" },
      { input: "3\n1 1 1\n5", expectedOutput: "0" },
      /* One throw, and it counts. */
      { input: "1\n10\n0", expectedOutput: "1", hidden: true },
      /* One throw, sitting exactly ON the boundary: strict means it does not. */
      { input: "1\n0\n0", expectedOutput: "0", hidden: true },
      /* Every throw exactly on the boundary — this is what `>=` dies on. */
      { input: "4\n4 4 4 4\n4", expectedOutput: "0", hidden: true },
      /* The only qualifying throw is first, then last. */
      { input: "4\n9 1 1 1\n5", expectedOutput: "1", hidden: true },
      { input: "4\n1 1 1 9\n5", expectedOutput: "1", hidden: true },
      /* Every throw qualifies, and the top of the stated range. */
      { input: "3\n6 7 8\n5", expectedOutput: "3", hidden: true },
      { input: "3\n1000 999 1000\n999", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * B · seven minutes. October, and only October: an accumulator walked
     * across a vector (m2.l5) with a condition applied at every step (m1.l4).
     *
     * The point of the problem is that the two clamps happen INSIDE the loop.
     * Every wrong program here is a program that moved them outside it:
     *   · no clamps at all — the plain sum answers -6 on the sample, not 4.
     *   · clamping once at the end — the sample again: 0, not 4.
     *   · clamping the top only — «10 2 / -4 6» answers 2, the truth is 6.
     *   · clamping the bottom only — «3 4 / 5 -1 -1 -1» answers 2, truth 0.
     * That last case is the one worth having: the tank overflows, then drains,
     * and the water that was spilled has to be gone by the time it drains.
     *
     * n = 1 is there twice, once over the top and once under the bottom,
     * because a single day is where a learner discovers the tank starts empty.
     *
     * `long long` is REQUIRED and nothing says so. `level` sits at up to c =
     * 10⁹ and a single day adds up to another 10⁹, so the intermediate value
     * before the clamp reaches 2 · 10⁹ — past `int` by seven per cent. The last
     * hidden case is exactly that: a full tank of a billion litres with one more
     * litre poured in. A learner whose `level` is an `int` gets a right method
     * and a wrong number on it, with no message of any kind, which is
     * m9.l2.b1's second point arriving in a contest.
     */
    id: "m9.c1.p2",
    type: "challenge",
    skillRefs: ["loops.accumulator", "lists.traverse", "cond.if_elif_else", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "B. Су багы.\n\nМектеп бақшасында сыйымдылығы c литр су багы тұр, басында ол бос. n күн бойы әр күні бір оқиға болады: бакқа су құйылады немесе бактан су алынады.\n\nЕнгізу. Бірінші жолда бос орынмен бөлінген c пен n сандары — бактың сыйымдылығы және күндер саны (1 ≤ c ≤ 1 000 000 000, 1 ≤ n ≤ 200 000). Екінші жолда n бүтін сан, әрқайсысының абсолют шамасы 1 000 000 000-нан аспайды: оң сан — сол күні құйылған литр, теріс сан — алынған литр.\n\nКүндер берілген ретпен өтеді. Егер бір күні су мөлшері c-дан асып кетсе, артық су төгіліп кетеді де, бакта дәл c литр қалады. Егер алынатын су бактағыдан көп болса, бак босап қалады да, 0 литр қалады: бак ешқашан теріс мәнге түспейді.\n\nШығару. Бір бүтін сан: соңғы күннен кейін бакта неше литр су бар.\n\nМысал. c = 10, n = 5 және `6 7 -3 -20 4` болғанда жауап 4. Күндер бойынша: 6, содан кейін 13 емес 10 (артығы төгілді), 7, содан кейін теріс емес 0, ақырында 4.",
      ru: "B. Бак с водой.\n\nВ школьном саду стоит бак вместимостью c литров, вначале он пуст. В течение n дней каждый день происходит одно событие: в бак наливают воду или из бака забирают воду.\n\nВвод. В первой строке через пробел числа c и n — вместимость бака и количество дней (1 ≤ c ≤ 1 000 000 000, 1 ≤ n ≤ 200 000). Во второй строке n целых чисел, каждое по модулю не больше 1 000 000 000: положительное число — сколько литров налили в этот день, отрицательное — сколько забрали.\n\nДни идут в том порядке, в каком даны. Если в какой-то день воды становится больше c, излишек выливается на землю и в баке остаётся ровно c литров. Если забирают больше, чем есть, бак опустошается и в нём остаётся 0 литров: бак никогда не уходит в минус.\n\nВывод. Одно целое число: сколько литров воды в баке после последнего дня.\n\nПример. При c = 10, n = 5 и `6 7 -3 -20 4` ответ 4. По дням: 6, затем не 13, а 10 (излишек вылился), 7, затем не минус, а 0, и в конце 4.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    long long c;\n" +
      "    int n;\n" +
      "    cin >> c >> n;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    long long level = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        level = level + a[i];\n" +
      "        if (level > c) level = c;\n" +
      "        if (level < 0) level = 0;\n" +
      "    }\n" +
      "    cout << level;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "10 5\n6 7 -3 -20 4", expectedOutput: "4" },
      { input: "5 3\n1 1 1", expectedOutput: "3" },
      /* One day, below the floor; one day, over the ceiling. */
      { input: "1 1\n-5", expectedOutput: "0", hidden: true },
      { input: "1 1\n5", expectedOutput: "1", hidden: true },
      /* Exactly full, then exactly empty, then exactly full again. */
      { input: "7 3\n7 -7 7", expectedOutput: "7", hidden: true },
      { input: "100 2\n50 50", expectedOutput: "100", hidden: true },
      /* Overflow first, drain after: the spilled water must not come back. */
      { input: "3 4\n5 -1 -1 -1", expectedOutput: "0", hidden: true },
      /* Empty tank taken from before anything is poured in. */
      { input: "10 2\n-4 6", expectedOutput: "6", hidden: true },
      /* The top of the stated range, and the case an `int` level fails: the
         value before the clamp is 2 · 10⁹. */
      { input: "1000000000 3\n1000000000 -1 1", expectedOutput: "1000000000", hidden: true },
      { input: "1000000000 2\n1000000000 1000000000", expectedOutput: "1000000000", hidden: true },
    ],
  },
  {
    /*
     * C · ten minutes. November: functions and `return` (m3.l1–l3), and a
     * helper applied to every element of a vector (m3.l5, m3.l8). The two
     * helpers themselves are October's — the divisor loop is m2.l2.b6 and the
     * digit peel with `% 10` and `/ 10` is m2.l3.b7 — so the new work is the
     * composition, not either piece.
     *
     * `x / 10` on a positive `int` is the same operation Python's `x // 10` was,
     * and the digit sum is therefore unchanged. The values are all positive, so
     * none of C++'s truncation-towards-zero behaviour is in play here; the
     * problem that would have had to be re-authored is one with a negative
     * numerator, and there is none in this contest.
     *
     * THE STRUCTURAL REQUIREMENT. The prompt asks for two functions as ADVICE
     * and says so: «кеңес … талап емес», «совет … не требование», plus a
     * sentence stating that the judge compares only the printed number. That is
     * option 2 of the authoring contract, chosen because no output here can be
     * made impossible without a helper, and because a 45-minute contest has no
     * room for the `explain` that option 3 would need. A learner who writes one
     * long loop is not lied to about having broken a rule.
     *
     * Everything is `int`: at most 200 numbers, each at most 10 000, so the
     * divisor loop runs 2 · 10⁶ times in total and the answer is at most 200.
     *
     * The degenerate programs:
     *   · counting only the PROPER divisors (dropping 1 and n) — «1 / 24»
     *     answers 0 where the truth is 1: 8 divisors against a digit sum of 6,
     *     but 6 against 6 is not strictly more. That case exists for this and
     *     only this.
     *   · `>=` instead of `>` — «1 / 36» answers 1, the truth is 0: nine
     *     divisors and a digit sum of nine. «1 / 1» is the same trap at the
     *     bottom.
     *   · counting every number — «4 / 7 9 5 3» answers 4, the truth is 0.
     *   · a loop that skips the first or the last element — «4 / 12 9 9 9» and
     *     «4 / 9 9 9 12» both answer 0 for it, and both are 1.
     */
    id: "m9.c1.p3",
    type: "challenge",
    skillRefs: ["func.define", "func.return", "func.reuse", "arith.remainder", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "C. Мықты сандар.\n\nСанды МЫҚТЫ деп атаймыз, егер оның бөлгіштерінің саны цифрларының қосындысынан қатаң көп болса. Бөлгіш — сан қалдықсыз бөлінетін оң сан; 1 де, санның өзі де бөлгіш болып саналады.\n\nЕнгізу. Бірінші жолда n саны (1 ≤ n ≤ 200). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысы 1-ден 10 000-ға дейін.\n\nШығару. Бір бүтін сан: тізімдегі мықты сандардың саны.\n\nМысал. n = 4 және `12 9 10 1` үшін жауап 2. 12-де 6 бөлгіш (1, 2, 3, 4, 6, 12), цифрлар қосындысы 3 — мықты. 10-да 4 бөлгіш, қосынды 1 — мықты. 9-да 3 бөлгіш, қосынды 9 — жоқ. 1-де 1 бөлгіш, қосынды да 1: тең, ал бізге қатаң көп керек — жоқ.\n\nКеңес. Есепті екі көмекші функцияға бөлген ыңғайлы: біреуі санның бөлгіштерін санайды, екіншісі цифрларының қосындысын қайтарады. Бұл — кеңес, талап емес: тексеру жүйесі тек шыққан санды салыстырады.",
      ru: "C. Сильные числа.\n\nНазовём число СИЛЬНЫМ, если количество его делителей строго больше суммы его цифр. Делитель — это положительное число, на которое данное число делится без остатка; единица и само число тоже считаются делителями.\n\nВвод. В первой строке число n (1 ≤ n ≤ 200). Во второй строке через пробел n целых чисел, каждое от 1 до 10 000.\n\nВывод. Одно целое число: сколько в списке сильных чисел.\n\nПример. При n = 4 и `12 9 10 1` ответ 2. У 12 шесть делителей (1, 2, 3, 4, 6, 12), сумма цифр 3 — сильное. У 10 четыре делителя, сумма цифр 1 — сильное. У 9 три делителя, сумма 9 — нет. У 1 один делитель и сумма цифр тоже 1: это равенство, а нужно строго больше — нет.\n\nСовет. Задачу удобно разбить на две вспомогательные функции: одна считает делители числа, другая возвращает сумму его цифр. Это совет, а не требование: проверяющая система сравнивает только выведенное число.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int x) {\n" +
      "    int s = 0;\n" +
      "    while (x > 0) {\n" +
      "        s = s + x % 10;\n" +
      "        x = x / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int divisor_count(int x) {\n" +
      "    int c = 0;\n" +
      "    for (int d = 1; d <= x; d++) {\n" +
      "        if (x % d == 0) c = c + 1;\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int total = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (divisor_count(a[i]) > digit_sum(a[i])) total = total + 1;\n" +
      "    }\n" +
      "    cout << total;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n12 9 10 1", expectedOutput: "2" },
      { input: "2\n36 24", expectedOutput: "1" },
      /* One number: the smallest allowed, where divisors and digit sum tie. */
      { input: "1\n1", expectedOutput: "0", hidden: true },
      { input: "1\n12", expectedOutput: "1", hidden: true },
      /* 24: eight divisors, digit sum six. Proper divisors give six — a tie. */
      { input: "1\n24", expectedOutput: "1", hidden: true },
      /* 36: nine and nine. This is what `>=` dies on. */
      { input: "1\n36", expectedOutput: "0", hidden: true },
      /* None strong, then all strong. */
      { input: "4\n7 9 5 3", expectedOutput: "0", hidden: true },
      { input: "4\n12 10 100 1000", expectedOutput: "4", hidden: true },
      /* The only strong number is last, then first. */
      { input: "4\n9 9 9 12", expectedOutput: "1", hidden: true },
      { input: "4\n12 9 9 9", expectedOutput: "1", hidden: true },
      /* The top of the stated range: 25 divisors against a digit sum of 1. */
      { input: "1\n10000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * D · ten minutes. December: the prefix table (m4.l5, m4.l6) and, just as
     * much, m4.l1's «уақытқа үлгеруді бағалау» — n up to 2 000 000 with a window
     * of up to n is what rules out recomputing each window from scratch. Same
     * table, new question: December asked it for a range the input names, this
     * asks it for the best range of a fixed length, which the learner has to
     * find. A running sum that adds one day and drops one day is equally
     * correct and equally December.
     *
     * ## The one problem in this contest that was re-authored rather than
     * ## translated, and why
     *
     * The Python version stated n ≤ 200 000 and read the days from stdin. It
     * could not test that bound — see `M9_C1_P4_LARGE_CASE` — and in C++ the
     * naive O(n·k) solution got roughly a hundred times faster, so the task
     * stopped separating a good solution from a bad one entirely. The question,
     * the skills and the shape of the answer are unchanged; what changed is that
     * the days are computed from a three-number seed instead of being listed, so
     * n reaches 2 000 000 through fifteen bytes of input and the bound the
     * prompt states is the bound the cases enforce.
     *
     * Generating the data is a contest convention rather than a new topic: the
     * recurrence is one `%` and one `*`, both September's, and the prompt prints
     * the first eight values so a learner can check their generator before they
     * trust it.
     *
     * `long long` is required twice over and the prompt does not say so: k days
     * of up to 1000 points is 2 · 10⁹ at the top, which `int` misses by seven
     * per cent, and the running window sum passes through the same range.
     *
     * The wrong programs:
     *   · `best = 0` before the loop — «4 2 6», whose eight values are all
     *     negative, answers 0 where the truth is −1036. That is why the
     *     statement says out loud that the answer may be negative.
     *   · the largest k values instead of k CONSECUTIVE ones — «8 3 42» answers
     *     904 + 871 + 734 = 2509 instead of 2025.
     *   · a window one element too long or too short — «5 5 31» is k = n, where
     *     a window of n + 1 has nowhere to sit at all.
     *   · a scan that never reaches the last window, or starts at the second —
     *     «6 3 0» has its best window at the very end and «6 3 45» at the very
     *     start.
     *   · a generator that advances t BEFORE storing a[0] — every case,
     *     starting with the sample, which is the point of printing it.
     * n = 1 with k = 1 is the smallest legal input and the one where an empty
     * loop range has to still produce an answer.
     */
    id: "m9.c1.p4",
    type: "challenge",
    skillRefs: ["precompute.prefix", "perf.time_estimate", "lists.index", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "D. Қатар келген k күн.\n\nКоманда n күн жаттықты. Әр күннің пайдасы бүтін санмен бағаланды: оң сан — пайда, теріс сан — шаршағаннан болған зиян. Жаттықтырушы қатар келген дәл k күнді таңдап, есебіне сол күндер бағаларының қосындысын жазады. Ол бұл қосынды барынша үлкен болғанын қалайды.\n\nЕнгізу. Бір жолда бос орынмен бөлінген үш бүтін сан: n, k және x (1 ≤ k ≤ n ≤ 2 000 000, 0 ≤ x ≤ 1 000 002).\n\nБағалар тізім түрінде берілмейді — оларды бағдарламаның өзі есептейді. Бұл жарыстарда жиі кездесетін тәсіл: екі миллион санды шартқа жазып қою мүмкін емес.\n\nt[0] = x, ал i ≥ 1 үшін t[i] = (t[i−1] · 1103 + 12345) mod 1000003.\ni-күннің бағасы a[i] = t[i] mod 2001 − 1000, яғни әр баға −1000 мен 1000 аралығында.\n\nШығару. Бір бүтін сан: қатар келген дәл k күннің ең үлкен қосындысы. Бағалар теріс болуы мүмкін, сондықтан жауап та теріс болуы мүмкін.\n\nМысал. n = 8, k = 3, x = 42 болғанда бағалар мынандай шығады:\n\n```\n-958 -358 904 300 734 871 420 88\n```\n\nЖауап: `2025` — бұл 734 + 871 + 420.\n\nn екі миллионға жететіндіктен, әр терезенің қосындысын басынан бастап қайта санауға уақыт жетпейді: ол 10¹² қадам болар еді, ал C++ бір секундта шамамен 100 000 000 қадам жасайды. Желтоқсанда жиналған кестені еске түсір.",
      ru: "D. k дней подряд.\n\nКоманда тренировалась n дней. Польза каждого дня оценена целым числом: положительное — польза, отрицательное — вред от усталости. Тренер выбирает ровно k идущих подряд дней и записывает в отчёт сумму их оценок. Он хочет, чтобы эта сумма была как можно больше.\n\nВвод. В одной строке через пробел даны три целых числа: n, k и x (1 ≤ k ≤ n ≤ 2 000 000, 0 ≤ x ≤ 1 000 002).\n\nСами оценки списком не даются — их вычисляет сама программа. Это обычный на соревнованиях приём: два миллиона чисел в условие не впишешь.\n\nt[0] = x, а при i ≥ 1 t[i] = (t[i−1] · 1103 + 12345) mod 1000003.\nОценка i-го дня равна a[i] = t[i] mod 2001 − 1000, то есть каждая оценка лежит между −1000 и 1000.\n\nВывод. Одно целое число: наибольшая сумма ровно k идущих подряд дней. Оценки бывают отрицательными, поэтому и ответ может быть отрицательным.\n\nПример. При n = 8, k = 3 и x = 42 оценки получаются такими:\n\n```\n-958 -358 904 300 734 871 420 88\n```\n\nОтвет: `2025` — это 734 + 871 + 420.\n\nПоскольку n доходит до двух миллионов, пересчитывать сумму каждого окна с нуля времени не хватит: это было бы 10¹² шагов, а C++ успевает около 100 000 000 шагов в секунду. Вспомни таблицу, которую вы заполняли в декабре.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    long long n, k, x;\n" +
      "    cin >> n >> k >> x;\n" +
      "    vector<long long> a(n);\n" +
      "    long long t = x;\n" +
      "    for (long long i = 0; i < n; i++) {\n" +
      "        a[i] = t % 2001 - 1000;\n" +
      "        t = (t * 1103 + 12345) % 1000003;\n" +
      "    }\n" +
      "    long long run = 0;\n" +
      "    for (long long i = 0; i < k; i++) run = run + a[i];\n" +
      "    long long best = run;\n" +
      "    for (long long i = k; i < n; i++) {\n" +
      "        run = run + a[i] - a[i - k];\n" +
      "        if (run > best) best = run;\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "8 3 42", expectedOutput: "2025" },
      { input: "6 3 0", expectedOutput: "1364" },
      /* The smallest legal input: one day, one-day window. */
      { input: "1 1 777", expectedOutput: "-223", hidden: true },
      /* Every value negative — `best = 0` answers 0 here. */
      { input: "4 2 6", expectedOutput: "-1036", hidden: true },
      /* The best window is the very first here; in the visible «6 3 0» it is
         the very last, so both ends of the scan are covered. */
      { input: "6 3 45", expectedOutput: "889", hidden: true },
      /* k = n: exactly one window, and it is the whole run of days. */
      { input: "5 5 31", expectedOutput: "-1864", hidden: true },
      /* k = 1 at the top of the range: the answer is the largest single day. */
      { input: "2000000 1 7", expectedOutput: "1000", hidden: true },
      /* k = n at the top of the range: two million values in one window. */
      { input: "2000000 2000000 5", expectedOutput: "-3075443", hidden: true },
      /* The stated bound, enforced. See M9_C1_P4_LARGE_CASE: the sliding window
         answers in 0.02 s and recomputing each window does not finish. */
      { input: M9_C1_P4_LARGE_CASE, expectedOutput: "-582562", hidden: true },
    ],
  },
  {
    /*
     * E · thirteen minutes, and the one problem of the five that is genuinely
     * hard. January: «жауап бойынша іздеу» / поиск по ответу, m5.l3 — binary
     * search over the ANSWER rather than over the list, with a check that is
     * itself only a month-2 loop with `/`. m is bounded by 10⁹, so trying
     * every m is out; that bound is the statement saying which method it wants.
     *
     * Support does not receive it. PDF p.6 gives Қолдау «тек негізгі есептер»
     * and the core route «қалауы бойынша 1-2 күрделірек есеп», and this is that
     * problem. It gets no scaffolded twin on purpose: inside a 45-minute
     * contest a scaffold is help, and «көмек … оқушы өзі бір әрекет жасап
     * көргеннен кейін ғана ашылады» is about a lesson, not about a contest.
     * The support route runs A–D, and `m9.c1` still opens for it.
     *
     * `long long` is required in two separate places and neither is signposted:
     * `low + high + 1` reaches 2 · 10⁹ when the search is near the top of the
     * range, and `got` reaches 2 · 10¹⁴ when n = 200 000 boxes of 10⁹ candies
     * are divided by m = 1. An `int` mid is a wrong answer on
     * «1 1 / 1000000000»; an `int` got is a wrong answer on any large case.
     *
     * `c[i] / mid` is C++'s integer division on two positive numbers, which is
     * Python's `//` unchanged — there is no negative value anywhere in this
     * problem, so the truncation difference never arises. `mid` is at least 1
     * whenever the loop body runs, because the body only runs while low < high
     * and high is at least 1, so there is no division by zero to guard.
     *
     * The wrong programs:
     *   · total / k, which ignores the one-box rule — the sample answers 4
     *     (21 / 5) where the truth is 3, and «5 1» / «3 1 4 1 5» answers 14
     *     where the truth is 5.
     *   · a search that cannot return 0 — «2 3» / «1 1», «1 1000000000» /
     *     «999999999» and «4 6» / «1 1 1 1» are all impossible, and the answer
     *     is the 0 the statement asks for.
     *   · an upper bound of max(c) − 1, or any off-by-one that cannot reach the
     *     top — «1 1» / «1000000000» and «3 3» / «5 5 5» both answer exactly
     *     max(c).
     *   · assuming the answer is one of the given c[i] — «3 2» / «1 1 1000000000»
     *     answers 500 000 000, which is in no box.
     * n = 1 appears three times, once feasible and twice not.
     */
    id: "m9.c1.p5",
    type: "challenge",
    skillRefs: ["bsearch.core", "bsearch.boundary", "perf.time_estimate", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "E. Кәмпит үлестіру.\n\nn қорап кәмпит бар, i-қорапта c[i] кәмпит жатыр. Сыныптағы k балаға кәмпит үлестіру керек, әрі әр балаға дәл m кәмпиттен тиуі тиіс. Бір бала кәмпитін тек бір қораптан алады: екі қораптан жинауға болмайды, ал бір қораптан бірнеше бала алса болады. Барлық кәмпитті таратудың қажеті жоқ — артығы қорапта қала береді.\n\nЕнгізу. Бірінші жолда бос орынмен бөлінген n мен k (1 ≤ n ≤ 200 000, 1 ≤ k ≤ 1 000 000 000). Екінші жолда n бүтін сан c[1] … c[n] (1 ≤ c[i] ≤ 1 000 000 000).\n\nШығару. Бір бүтін сан: m-нің ең үлкен мүмкін мәні. Егер әр балаға бір кәмпиттен де беру мүмкін болмаса, 0 шығар.\n\nМысал. n = 3, k = 5 және `10 4 7` болғанда жауап 3: 10-нан үштен алатын 3 бала, 4-тен 1 бала, 7-ден 2 бала шығады, барлығы 6 — бұл 5-тен кем емес. Ал m = 4 болса 2 + 1 + 1 = 4 бала ғана шығады, бұл 5-тен аз.\n\nm мәні 1 000 000 000-ға дейін жетуі мүмкін, сондықтан m-ді 1-ден бастап біртіндеп сынап шығуға уақыт жетпейді. Қаңтарда өткен «жауап бойынша іздеуді» еске түсір: m үлкейген сайын үлесі тиетін балалар саны кемиді, ешқашан өспейді.",
      ru: "E. Раздача конфет.\n\nЕсть n коробок конфет, в i-й коробке лежит c[i] конфет. Нужно раздать конфеты k детям так, чтобы каждому досталось ровно m конфет. Один ребёнок берёт конфеты только из одной коробки: собирать из двух нельзя, а вот из одной коробки могут взять несколько детей. Раздавать все конфеты не обязательно — остаток остаётся в коробке.\n\nВвод. В первой строке через пробел даны n и k (1 ≤ n ≤ 200 000, 1 ≤ k ≤ 1 000 000 000). Во второй строке n целых чисел c[1] … c[n] (1 ≤ c[i] ≤ 1 000 000 000).\n\nВывод. Одно целое число: наибольшее возможное значение m. Если нельзя выдать даже по одной конфете каждому, выведи 0.\n\nПример. При n = 3, k = 5 и `10 4 7` ответ 3: из 10 по три конфеты получат 3 ребёнка, из 4 — один, из 7 — двое, всего 6, а это не меньше 5. А при m = 4 выходит только 2 + 1 + 1 = 4 ребёнка, что меньше 5.\n\nЗначение m доходит до 1 000 000 000, поэтому перебирать m по одному, начиная с единицы, времени не хватит. Вспомни январский поиск по ответу: чем больше m, тем меньше детей получат свою долю, и никогда не наоборот.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    long long k;\n" +
      "    cin >> n >> k;\n" +
      "    vector<long long> c(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> c[i];\n" +
      "    long long low = 0;\n" +
      "    long long high = c[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (c[i] > high) high = c[i];\n" +
      "    }\n" +
      "    while (low < high) {\n" +
      "        long long mid = (low + high + 1) / 2;\n" +
      "        long long got = 0;\n" +
      "        for (int i = 0; i < n; i++) got = got + c[i] / mid;\n" +
      "        if (got >= k) low = mid;\n" +
      "        else high = mid - 1;\n" +
      "    }\n" +
      "    cout << low;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 5\n10 4 7", expectedOutput: "3" },
      { input: "2 3\n1 1", expectedOutput: "0" },
      /* One box, one child: the smallest legal input, answer 1. */
      { input: "1 1\n1", expectedOutput: "1", hidden: true },
      /* One box, far too many children: the answer the statement asks for is 0. */
      { input: "1 1000000000\n999999999", expectedOutput: "0", hidden: true },
      /* The answer sits exactly at max(c) — twice, once with n = 1. This is also
         where an `int` mid overflows: low + high + 1 is 2 · 10⁹. */
      { input: "1 1\n1000000000", expectedOutput: "1000000000", hidden: true },
      { input: "3 3\n5 5 5", expectedOutput: "5", hidden: true },
      /* More children than candies. */
      { input: "4 6\n1 1 1 1", expectedOutput: "0", hidden: true },
      /* Exactly enough, one candy each: the boundary between 1 and 0. */
      { input: "5 5\n1 1 1 1 1", expectedOutput: "1", hidden: true },
      /* Both boxes give two children each at m = 4 and one each at m = 5. */
      { input: "2 4\n8 9", expectedOutput: "4", hidden: true },
      /* The answer is in no box, and total / k would say 333333334. */
      { input: "3 2\n1 1 1000000000", expectedOutput: "500000000", hidden: true },
      /* k = 1: the answer is the largest box, not the total. */
      { input: "5 1\n3 1 4 1 5", expectedOutput: "5", hidden: true },
    ],
  },
];
