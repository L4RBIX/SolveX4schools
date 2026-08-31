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
 * ## The structural requirement in C, and which honest option it took
 *
 * Problem C wants two helper functions. Output comparison cannot see a function
 * — November's assessment and fourteen other November tasks said «must define a
 * function» and a submission with no functions at all passed. So C takes
 * **option 2 of the authoring contract: guidance, graded on the answer.** Its
 * prompt says the split is «кеңес … талап емес» / «совет … не требование» and
 * states out loud that the judge compares only the printed number. Option 1 is
 * unavailable here — no output makes a helper unavoidable — and option 3 would
 * mean an `explain` block, which is exactly what a 45-minute contest has no
 * room for and what `m9.l4` («Шешімді қорғау») is for.
 *
 * ## What the constraints promise and what the cases can prove
 *
 * D and E state bounds — n ≤ 200 000, k ≤ 10⁹ — that rule out the recount and
 * the linear scan. The bounds are the statement telling the learner which
 * method to write, and they are real contest constraints. What they are NOT is
 * a thing this judge measures: the cases below are small, and a correct but
 * quadratic solution passes them. That is the same shortfall `m4.l6` carries
 * and it is recorded here rather than dressed up. Nothing in either prompt
 * claims the checker times anything.
 */

export const M9_C1: LessonBlock[] = [
  {
    /*
     * A · five minutes, and it should be five minutes for anyone who has done
     * the year.
     *
     * Method: month 1 for reading two lines and a strict comparison, month 2
     * (m2.l1, m2.l5) for the single pass with a counter. Nothing else.
     *
     * The degenerate programs and the case that kills each:
     *   · `>=` instead of `>` — «4 4 4 4» / 4 answers 4 where the truth is 0,
     *     and the visible sample already answers 5 instead of 3.
     *   · counting every throw — «1 1 1» / 5 answers 3, the truth is 0.
     *   · a loop that stops one element short — «1 1 1 9» / 5 answers 0.
     *   · a loop that starts one element late — «9 1 1 1» / 5 answers 0.
     * The last two are «соңғы элементті өткізіп жіберу», the error October's
     * page names by hand, and a contest's first problem is where it costs the
     * least to be caught by it.
     */
    id: "m9.c1.p1",
    type: "challenge",
    skillRefs: ["loops.for", "loops.counter", "compare.operators", "io.read"],
    sourceType: "product-authored",
    prompt: {
      kk: "A. Норманы асырған лақтырулар.\n\nЖаттықтырушы жаттығуда әр лақтырудың ұпайын жазып отырды. Ол норманы қатаң асырған лақтырулар нешеу екенін білгісі келеді.\n\nЕнгізу. Бірінші жолда бос орынмен бөлінген бүтін сандар — лақтырулардың ұпайлары: кемінде бір ұпай, ең көбі 1000 ұпай, әрқайсысы 0-ден 1000-ға дейін. Екінші жолда бір бүтін сан x — норма (0 ≤ x ≤ 1000).\n\nШығару. Бір бүтін сан: ұпайы x-тен ҚАТАҢ үлкен лақтырулардың саны. Ұпай дәл x-ке тең болса, ол лақтыру есептелмейді.\n\nМысал. `7 3 9 3 5` және x = 3 болғанда жауап 3 — бұл 7, 9 және 5 ұпайлары.",
      ru: "A. Броски выше нормы.\n\nТренер записывал очки каждого броска на тренировке. Он хочет знать, сколько бросков строго превысили норму.\n\nВвод. В первой строке через пробел даны целые числа — очки бросков: не меньше одного и не больше 1000 чисел, каждое от 0 до 1000. Во второй строке одно целое число x — норма (0 ≤ x ≤ 1000).\n\nВывод. Одно целое число: количество бросков, очки которых СТРОГО больше x. Бросок ровно с x очками не засчитывается.\n\nПример. Для `7 3 9 3 5` и x = 3 ответ 3 — это 7, 9 и 5.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "count = 0\n" +
      "for v in a:\n" +
      "    if v > x:\n" +
      "        count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "7 3 9 3 5\n3", expectedOutput: "3" },
      { input: "1 1 1\n5", expectedOutput: "0" },
      /* One throw, and it counts. */
      { input: "10\n0", expectedOutput: "1", hidden: true },
      /* One throw, sitting exactly ON the boundary: strict means it does not. */
      { input: "0\n0", expectedOutput: "0", hidden: true },
      /* Every throw exactly on the boundary — this is what `>=` dies on. */
      { input: "4 4 4 4\n4", expectedOutput: "0", hidden: true },
      /* The only qualifying throw is first, then last. */
      { input: "9 1 1 1\n5", expectedOutput: "1", hidden: true },
      { input: "1 1 1 9\n5", expectedOutput: "1", hidden: true },
      /* Every throw qualifies, and the top of the stated range. */
      { input: "6 7 8\n5", expectedOutput: "3", hidden: true },
      { input: "1000 999 1000\n999", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * B · seven minutes. October, and only October: an accumulator walked
     * across a list (m2.l5) with a condition applied at every step (m1.l4).
     *
     * The point of the problem is that the two clamps happen INSIDE the loop.
     * Every wrong program here is a program that moved them outside it:
     *   · no clamps at all — the plain sum answers -6 on the sample, not 4.
     *   · clamping once at the end — the sample again: 0, not 4.
     *   · clamping the top only — «10» / «-4 6» answers 2, the truth is 6.
     *   · clamping the bottom only — «3» / «5 -1 -1 -1» answers 2, truth 0.
     * That last case is the one worth having: the tank overflows, then drains,
     * and the water that was spilled has to be gone by the time it drains.
     *
     * n = 1 is there twice, once over the top and once under the bottom,
     * because a single day is where a learner discovers the tank starts empty.
     */
    id: "m9.c1.p2",
    type: "challenge",
    skillRefs: ["loops.accumulator", "lists.traverse", "cond.if_elif_else", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "B. Су багы.\n\nМектеп бақшасында сыйымдылығы c литр су багы тұр, басында ол бос. n күн бойы әр күні бір оқиға болады: бакқа су құйылады немесе бактан су алынады.\n\nЕнгізу. Бірінші жолда бүтін сан c — бактың сыйымдылығы (1 ≤ c ≤ 1 000 000 000). Екінші жолда бос орынмен бөлінген n бүтін сан (1 ≤ n ≤ 200 000), әрқайсысының абсолют шамасы 1 000 000 000-нан аспайды: оң сан — сол күні құйылған литр, теріс сан — алынған литр.\n\nКүндер берілген ретпен өтеді. Егер бір күні су мөлшері c-дан асып кетсе, артық су төгіліп кетеді де, бакта дәл c литр қалады. Егер алынатын су бактағыдан көп болса, бак босап қалады да, 0 литр қалады: бак ешқашан теріс мәнге түспейді.\n\nШығару. Бір бүтін сан: соңғы күннен кейін бакта неше литр су бар.\n\nМысал. c = 10 және `6 7 -3 -20 4` болғанда жауап 4. Күндер бойынша: 6, содан кейін 13 емес 10 (артығы төгілді), 7, содан кейін теріс емес 0, ақырында 4.",
      ru: "B. Бак с водой.\n\nВ школьном саду стоит бак вместимостью c литров, вначале он пуст. В течение n дней каждый день происходит одно событие: в бак наливают воду или из бака забирают воду.\n\nВвод. В первой строке целое число c — вместимость бака (1 ≤ c ≤ 1 000 000 000). Во второй строке через пробел даны n целых чисел (1 ≤ n ≤ 200 000), каждое по модулю не больше 1 000 000 000: положительное число — сколько литров налили в этот день, отрицательное — сколько забрали.\n\nДни идут в том порядке, в каком даны. Если в какой-то день воды становится больше c, излишек выливается на землю и в баке остаётся ровно c литров. Если забирают больше, чем есть, бак опустошается и в нём остаётся 0 литров: бак никогда не уходит в минус.\n\nВывод. Одно целое число: сколько литров воды в баке после последнего дня.\n\nПример. При c = 10 и `6 7 -3 -20 4` ответ 4. По дням: 6, затем не 13, а 10 (излишек вылился), 7, затем не минус, а 0, и в конце 4.",
    },
    referenceSolution:
      "c = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "level = 0\n" +
      "for i in range(len(a)):\n" +
      "    level = level + a[i]\n" +
      "    if level > c:\n" +
      "        level = c\n" +
      "    if level < 0:\n" +
      "        level = 0\n" +
      "print(level)",
    cases: [
      { input: "10\n6 7 -3 -20 4", expectedOutput: "4" },
      { input: "5\n1 1 1", expectedOutput: "3" },
      /* One day, below the floor; one day, over the ceiling. */
      { input: "1\n-5", expectedOutput: "0", hidden: true },
      { input: "1\n5", expectedOutput: "1", hidden: true },
      /* Exactly full, then exactly empty, then exactly full again. */
      { input: "7\n7 -7 7", expectedOutput: "7", hidden: true },
      { input: "100\n50 50", expectedOutput: "100", hidden: true },
      /* Overflow first, drain after: the spilled water must not come back. */
      { input: "3\n5 -1 -1 -1", expectedOutput: "0", hidden: true },
      /* Empty tank taken from before anything is poured in. */
      { input: "10\n-4 6", expectedOutput: "6", hidden: true },
      /* The top of the stated range. */
      { input: "1000000000\n1000000000 -1 1", expectedOutput: "1000000000", hidden: true },
    ],
  },
  {
    /*
     * C · ten minutes. November: `def` and `return` (m3.l1–l3), and a helper
     * applied to every element of a list (m3.l5, m3.l8). The two helpers
     * themselves are October's — the divisor loop is m2.l2.b6 and the digit
     * peel with `% 10` and `// 10` is m2.l3.b7 — so the new work is the
     * composition, not either piece.
     *
     * THE STRUCTURAL REQUIREMENT. The prompt asks for two functions as ADVICE
     * and says so: «кеңес … талап емес», «совет … не требование», plus a
     * sentence stating that the judge compares only the printed number. That is
     * option 2 of the authoring contract, chosen because no output here can be
     * made impossible without a helper, and because a 45-minute contest has no
     * room for the `explain` that option 3 would need. A learner who writes one
     * long loop is not lied to about having broken a rule.
     *
     * The degenerate programs:
     *   · counting only the PROPER divisors (dropping 1 and n) — «24» answers 0
     *     where the truth is 1: 8 divisors against a digit sum of 6, but 6
     *     against 6 is not strictly more. That case exists for this and only
     *     this.
     *   · `>=` instead of `>` — «36» answers 1, the truth is 0: nine divisors
     *     and a digit sum of nine. «1» is the same trap at the bottom.
     *   · counting every number — «7 9 5 3» answers 4, the truth is 0.
     *   · a loop that skips the first or the last element — «12 9 9 9» and
     *     «9 9 9 12» both answer 0 for it, and both are 1.
     */
    id: "m9.c1.p3",
    type: "challenge",
    skillRefs: ["func.define", "func.return", "func.reuse", "arith.remainder", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "C. Мықты сандар.\n\nСанды МЫҚТЫ деп атаймыз, егер оның бөлгіштерінің саны цифрларының қосындысынан қатаң көп болса. Бөлгіш — сан қалдықсыз бөлінетін оң сан; 1 де, санның өзі де бөлгіш болып саналады.\n\nЕнгізу. Бір жолда бос орынмен бөлінген бүтін сандар: кемінде біреу, ең көбі 200 сан, әрқайсысы 1-ден 10 000-ға дейін.\n\nШығару. Бір бүтін сан: тізімдегі мықты сандардың саны.\n\nМысал. `12 9 10 1` үшін жауап 2. 12-де 6 бөлгіш (1, 2, 3, 4, 6, 12), цифрлар қосындысы 3 — мықты. 10-да 4 бөлгіш, қосынды 1 — мықты. 9-да 3 бөлгіш, қосынды 9 — жоқ. 1-де 1 бөлгіш, қосынды да 1: тең, ал бізге қатаң көп керек — жоқ.\n\nКеңес. Есепті екі көмекші функцияға бөлген ыңғайлы: біреуі санның бөлгіштерін санайды, екіншісі цифрларының қосындысын қайтарады. Бұл — кеңес, талап емес: тексеру жүйесі тек шыққан санды салыстырады.",
      ru: "C. Сильные числа.\n\nНазовём число СИЛЬНЫМ, если количество его делителей строго больше суммы его цифр. Делитель — это положительное число, на которое данное число делится без остатка; единица и само число тоже считаются делителями.\n\nВвод. В одной строке через пробел даны целые числа: не меньше одного и не больше 200 чисел, каждое от 1 до 10 000.\n\nВывод. Одно целое число: сколько в списке сильных чисел.\n\nПример. Для `12 9 10 1` ответ 2. У 12 шесть делителей (1, 2, 3, 4, 6, 12), сумма цифр 3 — сильное. У 10 четыре делителя, сумма цифр 1 — сильное. У 9 три делителя, сумма 9 — нет. У 1 один делитель и сумма цифр тоже 1: это равенство, а нужно строго больше — нет.\n\nСовет. Задачу удобно разбить на две вспомогательные функции: одна считает делители числа, другая возвращает сумму его цифр. Это совет, а не требование: проверяющая система сравнивает только выведенное число.",
    },
    referenceSolution:
      "def digit_sum(x):\n" +
      "    s = 0\n" +
      "    while x > 0:\n" +
      "        s = s + x % 10\n" +
      "        x = x // 10\n" +
      "    return s\n" +
      "\n" +
      "def divisor_count(x):\n" +
      "    c = 0\n" +
      "    for d in range(1, x + 1):\n" +
      "        if x % d == 0:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "a = list(map(int, input().split()))\n" +
      "total = 0\n" +
      "for i in range(len(a)):\n" +
      "    if divisor_count(a[i]) > digit_sum(a[i]):\n" +
      "        total = total + 1\n" +
      "print(total)",
    cases: [
      { input: "12 9 10 1", expectedOutput: "2" },
      { input: "36 24", expectedOutput: "1" },
      /* One number: the smallest allowed, where divisors and digit sum tie. */
      { input: "1", expectedOutput: "0", hidden: true },
      { input: "12", expectedOutput: "1", hidden: true },
      /* 24: eight divisors, digit sum six. Proper divisors give six — a tie. */
      { input: "24", expectedOutput: "1", hidden: true },
      /* 36: nine and nine. This is what `>=` dies on. */
      { input: "36", expectedOutput: "0", hidden: true },
      /* None strong, then all strong. */
      { input: "7 9 5 3", expectedOutput: "0", hidden: true },
      { input: "12 10 100 1000", expectedOutput: "4", hidden: true },
      /* The only strong number is last, then first. */
      { input: "9 9 9 12", expectedOutput: "1", hidden: true },
      { input: "12 9 9 9", expectedOutput: "1", hidden: true },
      /* The top of the stated range: 25 divisors against a digit sum of 1. */
      { input: "10000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * D · ten minutes. December: the prefix table (m4.l5, m4.l6) and, just as
     * much, m4.l1's «уақытқа үлгеруді бағалау» — n up to 200 000 with a window
     * of up to n is what rules out recomputing each window from scratch. Same
     * table, new question: December asked it for a range the input names, this
     * asks it for the best range of a fixed length, which the learner has to
     * find. A running sum that adds one day and drops one day is equally
     * correct and equally December.
     *
     * The wrong programs:
     *   · `best = 0` before the loop — «3 2» / «-5 -1 -7» answers 0, the truth
     *     is -6. Every value being negative is the shape that kills it, and it
     *     is why the statement says out loud that the answer may be negative.
     *   · the largest k values instead of k CONSECUTIVE ones — «5 2» /
     *     «5 1 5 1 5» answers 10, the truth is 6.
     *   · a window one element too long or too short — «3 3» / «1 2 3» and
     *     «4 1» / «-3 7 2 -8» pin both ends of that.
     *   · a scan that never reaches the last window, or starts at the second —
     *     the answer sits at the very end in one case and at the very start in
     *     another.
     * n = 1 with k = 1 is the smallest legal input and the one where an empty
     * loop range has to still produce an answer.
     */
    id: "m9.c1.p4",
    type: "challenge",
    skillRefs: ["precompute.prefix", "perf.time_estimate", "lists.index", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "D. Қатар келген k күн.\n\nКоманда n күн жаттықты. Әр күннің пайдасы бүтін санмен бағаланды: оң сан — пайда, теріс сан — шаршағаннан болған зиян. Жаттықтырушы қатар келген дәл k күнді таңдап, есебіне сол күндер бағаларының қосындысын жазады. Ол бұл қосынды барынша үлкен болғанын қалайды.\n\nЕнгізу. Бірінші жолда бос орынмен бөлінген n мен k (1 ≤ k ≤ n ≤ 200 000). Екінші жолда n бүтін сан, әрқайсысының абсолют шамасы 1 000 000 000-нан аспайды.\n\nШығару. Бір бүтін сан: қатар келген дәл k күннің ең үлкен қосындысы. Бағалар теріс болуы мүмкін, сондықтан жауап та теріс болуы мүмкін.\n\nМысал. n = 6, k = 3 және `1 -2 5 -1 3 -4` болғанда жауап 7 — бұл 5, -1 және 3 күндері.\n\nn 200 000-ға жететіндіктен, әр терезенің қосындысын басынан бастап қайта санауға уақыт жетпейді: желтоқсанда жиналған кестені еске түсір.",
      ru: "D. k дней подряд.\n\nКоманда тренировалась n дней. Польза каждого дня оценена целым числом: положительное — польза, отрицательное — вред от усталости. Тренер выбирает ровно k идущих подряд дней и записывает в отчёт сумму их оценок. Он хочет, чтобы эта сумма была как можно больше.\n\nВвод. В первой строке через пробел даны n и k (1 ≤ k ≤ n ≤ 200 000). Во второй строке n целых чисел, каждое по модулю не больше 1 000 000 000.\n\nВывод. Одно целое число: наибольшая сумма ровно k идущих подряд дней. Оценки бывают отрицательными, поэтому и ответ может быть отрицательным.\n\nПример. При n = 6, k = 3 и `1 -2 5 -1 3 -4` ответ 7 — это дни 5, -1 и 3.\n\nПоскольку n доходит до 200 000, пересчитывать сумму каждого окна с нуля времени не хватит: вспомни таблицу, которую вы заполняли в декабре.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "best = p[k] - p[0]\n" +
      "for i in range(1, n - k + 1):\n" +
      "    s = p[i + k] - p[i]\n" +
      "    if s > best:\n" +
      "        best = s\n" +
      "print(best)",
    cases: [
      { input: "6 3\n1 -2 5 -1 3 -4", expectedOutput: "7" },
      { input: "4 1\n-3 7 2 -8", expectedOutput: "7" },
      /* The smallest legal input: one day, one-day window. */
      { input: "1 1\n-4", expectedOutput: "-4", hidden: true },
      /* Everything negative — `best = 0` answers 0 here. */
      { input: "3 2\n-5 -1 -7", expectedOutput: "-6", hidden: true },
      /* The best window is the very first, then the very last. */
      { input: "4 2\n9 9 -5 -5", expectedOutput: "18", hidden: true },
      { input: "4 2\n-5 -5 9 9", expectedOutput: "18", hidden: true },
      /* k = n: exactly one window, and it is the whole list. */
      { input: "3 3\n1 2 3", expectedOutput: "6", hidden: true },
      /* Consecutive, not largest: the three fives are not neighbours. */
      { input: "5 2\n5 1 5 1 5", expectedOutput: "6", hidden: true },
      /* All equal, and the top of the value range. */
      { input: "6 2\n0 0 0 0 0 0", expectedOutput: "0", hidden: true },
      { input: "3 2\n1000000000 1000000000 -1000000000", expectedOutput: "2000000000", hidden: true },
    ],
  },
  {
    /*
     * E · thirteen minutes, and the one problem of the five that is genuinely
     * hard. January: «жауап бойынша іздеу» / поиск по ответу, m5.l3 — binary
     * search over the ANSWER rather than over the list, with a check that is
     * itself only a month-2 loop with `//`. m is bounded by 10⁹, so trying
     * every m is out; that bound is the statement saying which method it wants.
     *
     * Support does not receive it. PDF p.6 gives Қолдау «тек негізгі есептер»
     * and the core route «қалауы бойынша 1-2 күрделірек есеп», and this is that
     * problem. It gets no scaffolded twin on purpose: inside a 45-minute
     * contest a scaffold is help, and «көмек … оқушы өзі бір әрекет жасап
     * көргеннен кейін ғана ашылады» is about a lesson, not about a contest.
     * The support route runs A–D, and `m9.c1` still opens for it.
     *
     * The wrong programs:
     *   · total // k, which ignores the one-box rule — the sample answers 4
     *     (21 // 5) where the truth is 3, and «5 1» / «3 1 4 1 5» answers 14
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
      "n, k = map(int, input().split())\n" +
      "c = list(map(int, input().split()))\n" +
      "low = 0\n" +
      "high = max(c)\n" +
      "while low < high:\n" +
      "    mid = (low + high + 1) // 2\n" +
      "    got = 0\n" +
      "    for i in range(n):\n" +
      "        got = got + c[i] // mid\n" +
      "    if got >= k:\n" +
      "        low = mid\n" +
      "    else:\n" +
      "        high = mid - 1\n" +
      "print(low)",
    cases: [
      { input: "3 5\n10 4 7", expectedOutput: "3" },
      { input: "2 3\n1 1", expectedOutput: "0" },
      /* One box, one child: the smallest legal input, answer 1. */
      { input: "1 1\n1", expectedOutput: "1", hidden: true },
      /* One box, far too many children: the answer the statement asks for is 0. */
      { input: "1 1000000000\n999999999", expectedOutput: "0", hidden: true },
      /* The answer sits exactly at max(c) — twice, once with n = 1. */
      { input: "1 1\n1000000000", expectedOutput: "1000000000", hidden: true },
      { input: "3 3\n5 5 5", expectedOutput: "5", hidden: true },
      /* More children than candies. */
      { input: "4 6\n1 1 1 1", expectedOutput: "0", hidden: true },
      /* Exactly enough, one candy each: the boundary between 1 and 0. */
      { input: "5 5\n1 1 1 1 1", expectedOutput: "1", hidden: true },
      /* Both boxes give two children each at m = 4 and one each at m = 5. */
      { input: "2 4\n8 9", expectedOutput: "4", hidden: true },
      /* The answer is in no box, and total // k would say 333333334. */
      { input: "3 2\n1 1 1000000000", expectedOutput: "500000000", hidden: true },
      /* k = 1: the answer is the largest box, not the total. */
      { input: "5 1\n3 1 4 1 5", expectedOutput: "5", hidden: true },
    ],
  },
];
