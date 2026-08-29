import type { LessonBlock } from "../../types";

/**
 * Month 9 · Мамыр — the final tournament. Ninety minutes. PDF p.10.
 *
 * ## The clauses that build this file
 *
 * > «бес бейтаныс есептен тұратын қорытынды турнир және екі шешімді ауызша
 * > қорғау»
 *
 * Five unseen problems and two oral defences. That is the whole structure, and
 * it is quoted rather than designed: `b1`–`b5` are the five, `b6` and `b7` are
 * the two. There is no sixth kind of block here, because the programme names no
 * sixth thing.
 *
 * > «Қорытынды турнирде бес есептің кемінде екеуін шешу және өз шешімдерінің
 * > екеуін түсінікті түрде қорғау. Бірі болмаса, екіншісі жеке есепке
 * > алынбайды.»
 *
 * The pass mark is two of five, and the two halves are scored together or not
 * at all. That relationship lives in the assessment's `description` in
 * `month-09-may.ts` and in `b6`'s prompt, where the learner is told who applies
 * it — the teacher. It is deliberately NOT encoded as a conjunction the machine
 * pretends to score: no block type can express «бірі болмаса, екіншісі
 * есепке алынбайды» honestly, and faking it would put a computed verdict on a
 * rule that a person has to apply.
 *
 * > «Бұл айда жаңа тақырып жоқ.»
 *
 * Holds here too, and harder than anywhere else in the year, because a final
 * measurement that needed an unseen technique would be measuring the ninety
 * minutes rather than the nine months. Every problem below names, in its
 * comment, the month that taught its method and the technique it expects.
 *
 * ## The five, and the year they walk
 *
 *   A · Қазан      — one traversal, a maximum and a count over it  (m2)
 *   B · Желтоқсан  — ordering, then a boundary read off the order  (m4)
 *   C · Қаңтар     — binary search over the ANSWER                 (m5)
 *   D · Наурыз     — flood fill over a grid, queue with a head     (m7)
 *   E · Сәуір      — a one-dimensional table, filled in order      (m8)
 *
 * September is in all five: every one of them reads two lines and prints one
 * number. October is in all five for the same reason. The brief's five families
 * — first half, sorting or precomputation, a search, a grid or recursion,
 * greedy or DP — are A, B, C, D, E in that order.
 *
 * November's functions and February's recursion are the two months not given a
 * problem of their own, and both were left out on purpose. «Шешім функция
 * болуы керек» is a requirement output comparison cannot see (the authoring
 * contract's defect class 4), so a November problem would either state a rule
 * nobody enforces or be a November problem in name only. A February problem
 * would want a recursive flood fill, and D's grid reaches 100 × 100 = 10 000
 * cells — a recursion that deep ends in `RecursionError`, and this month may
 * not `import sys` to raise the limit. March's queue is the taught way to walk
 * that grid, so D is March's. Both months still get defended: `b6` and `b7` are
 * about the learner's own code, whatever shape it has.
 *
 * ## Nothing here repeats a practice contest — and the methods deliberately do
 *
 * `m9.c1` and `m9.c3` were read before these five were written. C uses January
 * the way `m9.c1.p5` does — binary search over an answer — and that is the one
 * overlap worth stating out loud rather than hiding: `c1.p5` sums `c[i] // m`,
 * C sums `h[i] - H` over the trees that clear the blade and skips the rest, and
 * the two checks fail in different ways (C's is the one that goes wrong by
 * adding a negative). A tournament that avoided every method the four practice
 * contests used would be a tournament on the material nobody practised. What
 * must not repeat is a PROBLEM, and none does: no window sums (`c1.p4`), no
 * candy split (`c1.p5`), no streak (`c3.p1`), no change (`c3.p2`), no
 * rest-day table (`c3.p3`), no boats (`c3.p4`), no path counting (`c3.p5`), and
 * neither of `m9.l1`'s two coding tasks. Every program in this file was
 * compared byte for byte against every program in the month.
 *
 * ## Ninety minutes, and why the five do not fit into them
 *
 * Ninety is the programme's figure for the tournament, so the 20-minute rule
 * the monthly checks are held to does not apply. The five are roughly 8, 12,
 * 18, 22 and 25 minutes of work; the two defences are three or four minutes
 * each, heard while the rest of the room is still coding, exactly as
 * `m6.as.b4` is heard. Eighty-five minutes of problems in eighty minutes of
 * coding time is not an accident and not an oversight: «кемінде екеуін шешу»
 * is the bar, and a tournament everyone can finish measures nothing about
 * choosing what to open next. A learner who spends forty minutes on C has lost
 * D and E, and that is the year's own `contest.time_split` being examined.
 *
 * A is genuinely easy and stays easy. A final tournament where nobody solves
 * anything measures a year's work as zero, which is a claim about the class
 * rather than about the learners.
 *
 * ## The structural requirement, and which honest option each block took
 *
 * Nowhere below does a prompt say the solution must define a function, must
 * return rather than print, or must use a particular method. Output comparison
 * sees none of that.
 *
 *   · C takes **option 1 — make the output impossible without it.** Its H runs
 *     to 10⁹ and one hidden case, «2 1500000000 / 1000000000 1000000000», needs
 *     750 million steps from a solution that tries every H in turn: that case
 *     was run against a descending linear scan and the scan hit the executor's
 *     ten-second limit. The statement says the bound and says a step-by-step
 *     trial will not finish. It names no method — this is an unseen problem,
 *     not a lesson — and the constraint does the work the sentence would have
 *     lied about.
 *   · A, B, D and E take **option 2 — say nothing structural and grade the
 *     answer.** Their prompts state the problem, the bounds and the output, and
 *     the judge compares the number. A learner who reaches the right answer by
 *     a route the comment did not predict is right.
 *   · The tournament as a whole takes **option 3 — send it to a human.** That
 *     is what `b6` and `b7` are, and it is the programme's own arrangement:
 *     «оқушы шешімді өз сөзімен түсіндіруге ... міндетті» (p.4). The defence is
 *     not a consolation for a missing checker, it is half the mark.
 *
 * ## Cases
 *
 * One visible case per problem — the sample the statement already prints — and
 * every other case hidden. «Бейтаныс есеп» that can be passed by echoing the
 * sample measures nothing, and this is the year's last measurement. Each
 * block's comment lists the degenerate programs by name with the case that
 * kills each; all of them were written out and executed against the full case
 * set before the cases were frozen, not argued about.
 *
 * ## Provenance
 *
 * `b1`–`b5` cite p.6: «Бейтаныс есептер» is the first of the programme's five
 * general verification methods and is what `mode: "unseen_problem"` implements.
 * `b6` and `b7` cite p.10, because the clause that makes them compulsory, fixes
 * their number at two and ties them to the solved problems is May's own
 * sentence and appears nowhere else. The claim in both cases is about the
 * block's mode and its place in the tournament, not about the invented
 * scenarios — the same reading the other eight monthly checks use.
 *
 * ## No `tracks`
 *
 * All seven blocks go to all three routes. A final tournament whose support
 * route is four problems produces a result that cannot be compared across a
 * class, and «Қолдау» is a route through the same material, not a shorter year.
 * The differentiation p.6 asks for is already carried by the month's lessons —
 * `m9.l1.b8s` is a support twin, and the advanced route's written defence lives
 * in the lessons. Here everyone gets the same five problems and the same two
 * defences.
 *
 * Python: `input`, `int`, `map`, `split`, `list`, `for`, `while`, `range`,
 * `len`, `.append`, `.sort`, `max`, `//`, `%`, subscripting a list and a
 * string. No import of any kind, no `set`, no `dict`, no comprehension — the
 * whole year, and nothing after it.
 */
export const M9_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * A · ~8 minutes. OCTOBER: «тізімді бір рет қарап шығу» and «жинақтаушы
     * айнымалы» (m2.l5), used twice — once to find the maximum, once to count
     * how many elements equal it. September reads the two lines. Nothing else.
     *
     * The scores may be NEGATIVE, and that is the only interesting decision in
     * the statement. It exists so that `best = 0` is a wrong program rather
     * than a lucky one: with non-negative scores a zero-initialised maximum is
     * correct on every input, and the commonest first-week error of the year
     * would go unmeasured in the year's last measurement.
     *
     * The degenerate programs, and the case that kills each:
     *   · `best = 0` instead of `best = a[0]`   → «-5 -3 -9» answers 0, «-2 -2
     *     -7 -2» answers 0; both are wrong, the truths are 1 and 3.
     *   · printing the maximum, not the count   → the visible sample answers 9
     *     against a truth of 3. Public, and deliberately so: the misread is
     *     worth killing before a hidden case is reached, and the prompt says
     *     out loud which of the two numbers is wanted.
     *   · a maximum loop that stops one short   → «2 3 3 3 9» answers 3 and
     *     «4 4 4 4 4 5» answers 5; both truths are 1. This is «соңғы элементті
     *     өткізіп жіберу», the error October's page names by hand.
     *   · a maximum loop that starts one late   → «9 2 3 3 3» answers 3, truth 1.
     *   · counting inside the single pass without resetting when a new maximum
     *     arrives                               → «1 3 3 5 5» answers 5, truth
     *     2, and the visible sample answers 4.
     * n = 1 is there because a single student is still a first place, and
     * «1000000000 1000000000» is the top of the range with a tie on it.
     */
    id: "m9.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["lists.traverse", "loops.counter", "compare.operators", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**A. Бірінші орын.** Мектеп олимпиадасына n оқушы қатысты. Әрқайсысының ұпайы белгілі: дұрыс шешім ұпай қосады, ал дөрекі қате ұпай шегереді, сондықтан ұпай теріс те болуы мүмкін.\n\nЕң жоғары ұпайды неше оқушы жинағанын тап — бірінші орынды бірнеше оқушы бөлісуі мүмкін.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100000). Екінші жолда бос орынмен бөлінген n бүтін сан — оқушылардың ұпайлары, әрқайсысының абсолют шамасы 1 000 000 000-нан аспайды.\n\n**Шығыс.** Бір бүтін сан: ең жоғары ұпайы бар оқушылардың саны. Ең жоғары ұпайдың өзін емес, дәл сол ұпайы барлардың САНЫН шығар.\n\n**Мысал.**\n\n```\n6\n5 9 9 2 9 4\n```\n\nЖауап: `3` — ең жоғары ұпай 9, оны үш оқушы жинаған.",
      ru: "**A. Первое место.** В школьной олимпиаде участвовали n учеников. Очки каждого известны: верное решение приносит очки, а грубая ошибка их отнимает, поэтому очки могут быть и отрицательными.\n\nНайди, сколько учеников набрали наибольшее число очков, — первое место могут разделить несколько человек.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100000). Во второй строке n целых чисел через пробел — очки учеников, каждое по модулю не больше 1 000 000 000.\n\n**Выход.** Одно целое число: сколько учеников имеют наибольшее число очков. Выводить нужно не сами наибольшие очки, а КОЛИЧЕСТВО тех, у кого их ровно столько.\n\n**Пример.**\n\n```\n6\n5 9 9 2 9 4\n```\n\nОтвет: `3` — наибольшее число очков равно 9, его набрали трое.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "best = a[0]\n" +
      "for i in range(1, n):\n" +
      "    if a[i] > best:\n" +
      "        best = a[i]\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    if a[i] == best:\n" +
      "        count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "6\n5 9 9 2 9 4", expectedOutput: "3" },
      /* One student: the smallest legal input, and still a first place. */
      { input: "1\n7", expectedOutput: "1", hidden: true },
      /* Everyone tied: the answer is n, not 1. */
      { input: "5\n3 3 3 3 3", expectedOutput: "5", hidden: true },
      /* The maximum sits in the last position, then in the first. */
      { input: "5\n2 3 3 3 9", expectedOutput: "1", hidden: true },
      { input: "5\n9 2 3 3 3", expectedOutput: "1", hidden: true },
      /* Every score negative — this is what `best = 0` dies on, twice. */
      { input: "3\n-5 -3 -9", expectedOutput: "1", hidden: true },
      { input: "4\n-2 -2 -7 -2", expectedOutput: "3", hidden: true },
      /* A long plateau and a single winner above it. */
      { input: "6\n4 4 4 4 4 5", expectedOutput: "1", hidden: true },
      /* Two plateaus: the counter that never resets answers 5 here. */
      { input: "5\n1 3 3 5 5", expectedOutput: "2", hidden: true },
      /* The top of the stated range, tied. */
      { input: "2\n1000000000 1000000000", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * B · ~12 minutes. DECEMBER: «сандарды реттеу» (m4.l3, m4.l4). The scores
     * arrive unordered, so the k-th place cannot be read without ordering them
     * first — and once they are ordered the whole problem is one index and one
     * counting pass, which is October's.
     *
     * Two conditions have to survive together and each is a separate reading of
     * the statement: a score at least as large as the k-th best, AND strictly
     * positive. Either one alone is a wrong program.
     *
     * The degenerate programs, and the case that kills each:
     *   · printing k                            → the visible sample answers 5
     *     against a truth of 6, and «3 3 / 0 0 0» answers 3 against 0.
     *   · not sorting                           → «5 1 / 5 4 3 2 1» reads the
     *     last element as the cut-off and answers 5, truth 1; «4 4 / 3 0 2 0»
     *     answers 1, truth 2.
     *   · dropping the strictly-positive rule   → «3 3 / 0 0 0» answers 3,
     *     «5 3 / 5 0 0 0 0» answers 5, «1 1 / 0» answers 1; all three truths
     *     are the other number.
     *   · the cut-off index off by one          → «5 2 / 1 2 3 4 5» answers 3
     *     one way and 1 the other, truth 2; on «1 1 / 0» the high version
     *     crashes with IndexError.
     *   · ignoring ties                         → «6 3 / 4 4 4 4 1 1» is four
     *     people for three places, and «7 4 / 9 9 9 9 9 9 9» is seven for four.
     * n = 1 appears twice, once with a zero and once without, because a single
     * participant is the input where both conditions are alone on the card.
     */
    id: "m9.as.b2",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["sort.basic", "lists.index", "loops.counter", "logic.and_or_not", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**B. Келесі кезең.** Іріктеу турына n қатысушы қатысты, келесі кезеңге k орын бөлінген. Ереже мынадай: қатысушы келесі кезеңге өтеді, егер оның ұпайы k-орындағы қатысушының ұпайынан кем болмаса ЖӘНЕ ұпайы нөлден қатаң үлкен болса. Сондықтан өтетіндер саны k-дан көп те, аз да болуы мүмкін: бірдей ұпай жинағандар бірге өтеді, ал бірде-бір есеп шығармағандар өтпейді.\n\nҰпайлар тізімде реттелмеген күйде берілген.\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен k (1 ≤ k ≤ n ≤ 100000). Екінші жолда n бүтін сан — қатысушылардың ұпайлары (0 ≤ a[i] ≤ 1000).\n\n**Шығыс.** Бір бүтін сан: келесі кезеңге өтетін қатысушылардың саны.\n\n**Мысал.**\n\n```\n8 5\n10 9 8 7 7 7 5 5\n```\n\nЖауап: `6`. Бесінші орындағы ұпай — 7. Ұпайы 7-ден кем емес қатысушылар: 10, 9, 8 және үш жетілік, барлығы алтау.",
      ru: "**B. Следующий тур.** В отборочном туре участвовали n человек, в следующий тур проходят k мест. Правило такое: участник проходит дальше, если его очки не меньше очков участника на k-м месте И при этом строго больше нуля. Поэтому прошедших может оказаться и больше k, и меньше: набравшие поровну проходят вместе, а не решившие ни одной задачи не проходят вовсе.\n\nОчки даны в списке в произвольном порядке.\n\n**Вход.** В первой строке через пробел даны n и k (1 ≤ k ≤ n ≤ 100000). Во второй строке n целых чисел — очки участников (0 ≤ a[i] ≤ 1000).\n\n**Выход.** Одно целое число: сколько участников проходят в следующий тур.\n\n**Пример.**\n\n```\n8 5\n10 9 8 7 7 7 5 5\n```\n\nОтвет: `6`. На пятом месте стоит результат 7. Очки не меньше семи у 10, 9, 8 и у трёх семёрок — всего шестеро.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "limit = a[n - k]\n" +
      "count = 0\n" +
      "for i in range(n):\n" +
      "    if a[i] >= limit and a[i] > 0:\n" +
      "        count = count + 1\n" +
      "print(count)",
    cases: [
      { input: "8 5\n10 9 8 7 7 7 5 5", expectedOutput: "6" },
      /* Nobody scored: the answer is 0, however many places are open. */
      { input: "3 3\n0 0 0", expectedOutput: "0", hidden: true },
      /* One real score among zeros, with three places open. */
      { input: "5 3\n5 0 0 0 0", expectedOutput: "1", hidden: true },
      /* Descending input, one place: a solution that never sorts answers 5. */
      { input: "5 1\n5 4 3 2 1", expectedOutput: "1", hidden: true },
      /* Ascending input, two places: the cut-off index, off by one either way. */
      { input: "5 2\n1 2 3 4 5", expectedOutput: "2", hidden: true },
      /* Four tied people for three places. */
      { input: "6 3\n4 4 4 4 1 1", expectedOutput: "4", hidden: true },
      /* One participant, twice: with a zero and with a score. */
      { input: "1 1\n0", expectedOutput: "0", hidden: true },
      { input: "1 1\n7", expectedOutput: "1", hidden: true },
      /* k = n, and the zeros still do not pass. */
      { input: "4 4\n3 0 2 0", expectedOutput: "2", hidden: true },
      /* Everyone tied above zero: all seven pass four places. */
      { input: "7 4\n9 9 9 9 9 9 9", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /*
     * C · ~18 minutes. JANUARY: «жауап бойынша іздеу» (m5.l3) — the search runs
     * over the answer H, not over the list, and the check inside it is a
     * month-2 accumulator with a month-1 condition. The monotonicity a learner
     * has to see is that raising the blade never yields more wood.
     *
     * THE CONSTRAINT IS THE REQUIREMENT. H reaches 10⁹, and the hidden case
     * «2 1500000000 / 1000000000 1000000000» needs 750 million steps from a
     * program that tries every H in turn: that program was written and run, and
     * it hit the executor's ten-second limit on exactly that case while every
     * other case passed. This is option 1 of the authoring contract — the
     * output is not reachable by the other method — and it is why the prompt
     * can say «біртіндеп сынап көруге уақыт жетпейді» without naming a method.
     * Naming one would make the problem seen, and «бейтаныс есеп» is the point.
     *
     * The relationship to `m9.c1.p5` is stated in the file header: same month,
     * same technique, a different check that fails in a different way.
     *
     * The degenerate programs, and the case that kills each:
     *   · summing `h[i] - H` without skipping the short trees, so that a tree
     *     below the blade subtracts wood → «3 5 / 10 1 1» answers 2 (truth 5),
     *     «5 3 / 100 1 1 1 1» answers 20 (truth 97), «2 1 / 1 1000000000»
     *     answers 500000000 (truth 999999999), and even the visible sample
     *     answers 9 instead of 11.
     *   · `got > m` where the statement says «кем болмаса», so an exact fit is
     *     rejected → «3 5 / 10 1 1» answers 4, «4 4 / 10 10 10 10» answers 8,
     *     «1 1 / 1000000000» answers 999999998.
     *   · a search that cannot return 0 → «3 6 / 1 2 3» and «1 5 / 5» are both
     *     0, and a low bound of 1 answers 1 on each.
     *   · trying every H downwards from the tallest tree → the two-billion case
     *     does not finish.
     * The answer is not one of the given heights in three of the cases, which
     * is the other thing a learner can get wrong here: «жауап ағаштардың
     * бірінің биіктігі болуы керек» is false.
     */
    id: "m9.as.b3",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["bsearch.core", "bsearch.boundary", "perf.time_estimate", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**C. Отын дайындау.** Мектепке қысқа дәл m метр отын керек. Орманшы n ағашты кесуге рұқсат берді: i-ағаштың биіктігі h[i] метр. Аралайтын машинаның пышағы H биіктігіне бір рет қойылады да, барлық ағаш сол биіктікте кесіледі. Биіктігі H-тан үлкен ағаштан h[i] − H метр отын түседі; биіктігі H-тан аспайтын ағаш мүлде кесілмейді және ештеңе бермейді.\n\nМектеп ағаштарды барынша аз зақымдағысы келеді, сондықтан H-ты барынша жоғары қойғысы келеді. Жиналатын отын m метрден кем болмайтындай ең үлкен бүтін H-ты тап.\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен m (1 ≤ n ≤ 200000, 1 ≤ m ≤ 1 000 000 000 000). Екінші жолда n бүтін сан h[1] … h[n] (1 ≤ h[i] ≤ 1 000 000 000). H = 0 болғанда жиналатын отын m метрден кем болмайтыны кепілдендірілген, сондықтан жауап әрқашан бар.\n\n**Шығыс.** Бір бүтін сан: H-тың ең үлкен мүмкін мәні. Жауап 0 болуы да мүмкін.\n\n**Мысал.**\n\n```\n4 9\n12 8 20 5\n```\n\nЖауап: `11`. H = 11 болғанда 12-ден 1 метр, 20-дан 9 метр, барлығы 10 метр түседі — бұл 9-дан кем емес. Ал H = 12 болғанда небәрі 8 метр түседі, бұл жетпейді.\n\nH мәні миллиардқа дейін жетеді, сондықтан оны 0-ден бастап біртіндеп сынап көруге уақыт жетпейді.",
      ru: "**C. Заготовка дров.** Школе нужно ровно m метров дров на зиму. Лесник разрешил спилить n деревьев: высота i-го дерева равна h[i] метров. Нож пилорамы один раз выставляют на высоту H, и все деревья срезаются на этой высоте. С дерева выше H получается h[i] − H метров дров; дерево, высота которого не превышает H, вообще не режут, и оно ничего не даёт.\n\nШкола хочет повредить деревья как можно меньше, поэтому хочет выставить H как можно выше. Найди наибольшее целое H, при котором дров получится не меньше m метров.\n\n**Вход.** В первой строке через пробел даны n и m (1 ≤ n ≤ 200000, 1 ≤ m ≤ 1 000 000 000 000). Во второй строке n целых чисел h[1] … h[n] (1 ≤ h[i] ≤ 1 000 000 000). Гарантируется, что при H = 0 дров получается не меньше m, поэтому ответ существует всегда.\n\n**Выход.** Одно целое число: наибольшее возможное значение H. Ответ может быть равен и нулю.\n\n**Пример.**\n\n```\n4 9\n12 8 20 5\n```\n\nОтвет: `11`. При H = 11 с дерева высотой 12 получится 1 метр, с дерева высотой 20 — 9 метров, всего 10 метров, а это не меньше девяти. При H = 12 выйдет только 8 метров, и этого мало.\n\nЗначение H доходит до миллиарда, поэтому перебирать его по одному начиная с нуля времени не хватит.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "h = list(map(int, input().split()))\n" +
      "low = 0\n" +
      "high = max(h)\n" +
      "while low < high:\n" +
      "    mid = (low + high + 1) // 2\n" +
      "    got = 0\n" +
      "    for i in range(n):\n" +
      "        if h[i] > mid:\n" +
      "            got = got + h[i] - mid\n" +
      "    if got >= m:\n" +
      "        low = mid\n" +
      "    else:\n" +
      "        high = mid - 1\n" +
      "print(low)",
    cases: [
      { input: "4 9\n12 8 20 5", expectedOutput: "11" },
      /* Every metre is needed: the blade goes to the ground and the answer is 0. */
      { input: "3 6\n1 2 3", expectedOutput: "0", hidden: true },
      { input: "1 5\n5", expectedOutput: "0", hidden: true },
      /* One tree, one metre: the answer is one below the top of the range. */
      { input: "1 1\n1000000000", expectedOutput: "999999999", hidden: true },
      /* All trees equal: an exact fit at H = 9, which `>` rejects. */
      { input: "4 4\n10 10 10 10", expectedOutput: "9", hidden: true },
      /* One tall tree over two short ones: the short trees must contribute
         nothing rather than subtract, and the fit at H = 5 is exact. */
      { input: "3 5\n10 1 1", expectedOutput: "5", hidden: true },
      /* The same shape, further apart: the answer is no tree's height. */
      { input: "5 3\n100 1 1 1 1", expectedOutput: "97", hidden: true },
      /* Two billion metres of wood: a scan over every H does not finish. */
      { input: "2 1500000000\n1000000000 1000000000", expectedOutput: "250000000", hidden: true },
      /* A metre from a forest of two, one of which is a sapling. */
      { input: "2 1\n1 1000000000", expectedOutput: "999999999", hidden: true },
    ],
  },
  {
    /*
     * D · ~22 minutes. MARCH: «ұяшық және көрші ұяшық» and the wave over a grid
     * (m7.l2, m7.l4) — a flood fill that measures each region and keeps the
     * largest. The queue is a list with a head index, which is March's own
     * device and January's two-pointer idea reused; nothing is imported.
     *
     * Cells are stored in the queue as the single number `r * m + c` rather
     * than as a pair, which is the month's arithmetic and avoids a construct
     * the year never taught.
     *
     * A recursive fill is the other natural solution and is out of reach here
     * on purpose: 100 × 100 is 10 000 cells, a solid grid recurses that deep,
     * and this month may not `import sys` to raise the limit. The bound is in
     * the statement; the reason is in this comment and in the file header.
     *
     * The degenerate programs, and the case that kills each:
     *   · counting every `#` on the map          → the visible sample answers 10
     *     against a truth of 4; the seven-row case answers 19 against 17.
     *   · counting the REGIONS, not their size   → the sample answers 3, and
     *     the solid 3 × 3 answers 1 against 9.
     *   · keeping the first region found instead of the largest → «1 7 /
     *     #.###.#» answers 1, truth 3; «4 1» answers 1, truth 2.
     *   · treating diagonal neighbours as joined → «2 2 / #. / .#» answers 2,
     *     truth 1, and the sample answers 7.
     *   · merging only along a row               → the sample answers 3, the
     *     solid 3 × 3 answers 3, and the one-column map answers 1.
     *   · marking a cell visited when it leaves the queue instead of when it
     *     enters → the solid 3 × 3 counts the same cells several times and
     *     answers 19 instead of 9. That case exists for this and only this: on
     *     every other map here the bug is invisible.
     * The one-cell maps are both ends of the smallest legal input, and the
     * seven-row map is a single lake that snakes through three rows plus two
     * lone cells, so a solution that is right about shape and wrong about
     * counting has nowhere to hide.
     */
    id: "m9.as.b4",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["graph.bfs", "graph.regions", "grid.cells", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**D. Ең үлкен көл.** Ауданның картасы n жол мен m бағаннан тұратын тор түрінде берілген: `#` — су, `.` — құрғақ жер.\n\nЕкі су ұяшығы бір көлге жатады, егер олар қабырғалас болса, яғни бірінің дәл үстінде, астында, сол жағында немесе оң жағында тұрса. Тек бұрышымен түйісетін ұяшықтар бір көлге жатпайды. Су ұяшықтарының тізбегі арқылы жалғасқан ұяшықтар да сол көлдің бөлігі саналады.\n\nЕң үлкен көлде неше ұяшық бар?\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен m (1 ≤ n ≤ 100, 1 ≤ m ≤ 100). Келесі n жолда картаның жолдары: әрқайсысында m таңба, әр таңба `#` не `.`.\n\n**Шығыс.** Бір бүтін сан: ең үлкен көлдің ұяшықтар саны. Картада су мүлде болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n4 5\n##..#\n#..##\n..#..\n.###.\n```\n\nЖауап: `4`. Картада үш көл бар: екеуінде үш ұяшықтан, ал ең үлкенінде — төменгі жолдағы үш ұяшық пен олардың үстіндегі бір ұяшық, барлығы төртеу.",
      ru: "**D. Самое большое озеро.** Карта района дана в виде таблицы из n строк и m столбцов: `#` — вода, `.` — суша.\n\nДве клетки воды принадлежат одному озеру, если они соседние по стороне, то есть одна стоит прямо над, под, слева или справа от другой. Клетки, соприкасающиеся только углом, к одному озеру не относятся. Клетки, связанные через цепочку клеток воды, тоже входят в это озеро.\n\nСколько клеток в самом большом озере?\n\n**Вход.** В первой строке через пробел даны n и m (1 ≤ n ≤ 100, 1 ≤ m ≤ 100). В следующих n строках — строки карты: в каждой m символов, каждый из них `#` или `.`.\n\n**Выход.** Одно целое число: количество клеток в самом большом озере. Если воды на карте нет вовсе, выведи 0.\n\n**Пример.**\n\n```\n4 5\n##..#\n#..##\n..#..\n.###.\n```\n\nОтвет: `4`. На карте три озера: в двух по три клетки, а в самом большом — три клетки нижней строки и одна клетка над ними, всего четыре.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "seen = []\n" +
      "for i in range(n):\n" +
      "    row = []\n" +
      "    for j in range(m):\n" +
      "        row.append(0)\n" +
      "    seen.append(row)\n" +
      "best = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "#" and seen[i][j] == 0:\n' +
      "            seen[i][j] = 1\n" +
      "            queue = [i * m + j]\n" +
      "            head = 0\n" +
      "            size = 0\n" +
      "            while head < len(queue):\n" +
      "                cell = queue[head]\n" +
      "                head = head + 1\n" +
      "                size = size + 1\n" +
      "                r = cell // m\n" +
      "                c = cell % m\n" +
      '                if r > 0 and g[r - 1][c] == "#" and seen[r - 1][c] == 0:\n' +
      "                    seen[r - 1][c] = 1\n" +
      "                    queue.append((r - 1) * m + c)\n" +
      '                if r < n - 1 and g[r + 1][c] == "#" and seen[r + 1][c] == 0:\n' +
      "                    seen[r + 1][c] = 1\n" +
      "                    queue.append((r + 1) * m + c)\n" +
      '                if c > 0 and g[r][c - 1] == "#" and seen[r][c - 1] == 0:\n' +
      "                    seen[r][c - 1] = 1\n" +
      "                    queue.append(r * m + c - 1)\n" +
      '                if c < m - 1 and g[r][c + 1] == "#" and seen[r][c + 1] == 0:\n' +
      "                    seen[r][c + 1] = 1\n" +
      "                    queue.append(r * m + c + 1)\n" +
      "            if size > best:\n" +
      "                best = size\n" +
      "print(best)",
    cases: [
      { input: "4 5\n##..#\n#..##\n..#..\n.###.", expectedOutput: "4" },
      /* No water at all. */
      { input: "2 3\n...\n...", expectedOutput: "0", hidden: true },
      /* Two cells touching only at a corner: two lakes, not one. */
      { input: "2 2\n#.\n.#", expectedOutput: "1", hidden: true },
      /* Solid map: the answer is every cell, and the visited mark has to be set
         on the way IN — set on the way out, this one answers 19. */
      { input: "3 3\n###\n###\n###", expectedOutput: "9", hidden: true },
      /* The smallest legal map, both ways round. */
      { input: "1 1\n#", expectedOutput: "1", hidden: true },
      { input: "1 1\n.", expectedOutput: "0", hidden: true },
      /* One row: the largest lake is in the middle, not the first one found. */
      { input: "1 7\n#.###.#", expectedOutput: "3", hidden: true },
      /* One column: a lake that only a vertical step can walk. */
      { input: "4 1\n#\n.\n#\n#", expectedOutput: "2", hidden: true },
      /* A U-shape touching three borders. */
      { input: "3 4\n#..#\n#..#\n####", expectedOutput: "8", hidden: true },
      /* One lake snaking through three rows, plus two lone cells: 19 cells of
         water on the map and 17 in the largest lake. */
      {
        input: "7 5\n#####\n....#\n#####\n#....\n#####\n.....\n.#.#.",
        expectedOutput: "17",
        hidden: true,
      },
    ],
  },
  {
    /*
     * E · ~25 minutes, and the one problem of the five that is meant to be
     * hard. APRIL: «алдыңғы жауаптар арқылы шешу» and «қадамдап толтырылатын
     * кесте» (m8.l3, m8.l4). dp[i] is the length of the longest strictly
     * increasing sequence that ENDS at position i; every earlier position that
     * holds a smaller number is a candidate to extend, and the answer is the
     * largest entry of the table, not its last one.
     *
     * n ≤ 1000, so the table costs at most a million comparisons and April's
     * «уақытқа үлгеруді бағалау» says out loud that this is fine. The bound is
     * chosen to permit the table a fourteen-year-old can actually write, not to
     * demand a cleverer one.
     *
     * THE SAMPLE DOES NOT WARN THAT THE NEIGHBOURS RULE FAILS, and that is the
     * same deliberate choice `m9.c3.p3` documents. On «2 4 6 1 3» the longest
     * run of ADJACENT increasing numbers is 2, 4, 6 — three numbers, which is
     * also the true answer. So nothing on screen tells the learner that deleting
     * from the middle is allowed; the statement says it in words, and the hidden
     * cases are where it costs.
     *
     * The degenerate programs, and the case that kills each:
     *   · the longest run of ADJACENT increasing numbers → «1 5 2 3 4» answers
     *     3, truth 4; «10 9 2 5 3 7 101 18» answers 3, truth 4; «3 1 4 1 5 9»
     *     answers 3, truth 4.
     *   · printing dp[n − 1] instead of the largest entry → «1 2 3 4 1 1 1»
     *     answers 1, truth 4, and the visible sample answers 2 instead of 3.
     *   · `<=` where the statement says «қатаң өседі» → «7 7 7 7» answers 4,
     *     truth 1.
     *   · counting how many different numbers there are → «5 4 3 2 1» answers
     *     5, truth 1, and the visible sample answers 5 instead of 3.
     * n = 1 is the input where the answer is 1 for a reason the statement gives
     * rather than for a reason the table computes, and a fully sorted list is
     * the case where the answer is the whole input.
     */
    id: "m9.as.b5",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["dp.core", "dp.table", "lists.index", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**E. Өспелі тізбек.** n сан берілген. Олардың кейбірін өшіріп тастап, қалғандарын бастапқы ретімен қалдыруға болады. Қалған сандар солдан оңға қарай ҚАТАҢ өсіп отыратындай етіп, мүмкіндігінше көп сан қалдыр.\n\nҚалдырылған сандардың бір-бірімен қатар тұруы міндетті емес: араларынан қанша сан өшірілсе де, қалғандарының реті бастапқыдай сақталса, жеткілікті.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Шығыс.** Бір бүтін сан: қалдыруға болатын сандардың ең үлкен саны. Бір санды әрқашан қалдыруға болады, сондықтан жауап кемінде 1.\n\n**Мысал.**\n\n```\n5\n2 4 6 1 3\n```\n\nЖауап: `3` — мысалы, 2, 4, 6.",
      ru: "**E. Возрастающая последовательность.** Дано n чисел. Часть из них можно вычеркнуть, а оставшиеся сохраняют исходный порядок. Оставь как можно больше чисел так, чтобы слева направо они СТРОГО возрастали.\n\nОставленные числа не обязаны стоять рядом: сколько бы чисел ни было вычеркнуто между ними, достаточно, чтобы порядок оставшихся был таким же, как в исходном списке.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 1000). Во второй строке n целых чисел через пробел (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Выход.** Одно целое число: наибольшее количество чисел, которые можно оставить. Одно число оставить можно всегда, поэтому ответ не меньше 1.\n\n**Пример.**\n\n```\n5\n2 4 6 1 3\n```\n\nОтвет: `3` — например, 2, 4, 6.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "dp = []\n" +
      "for i in range(n):\n" +
      "    dp.append(1)\n" +
      "for i in range(n):\n" +
      "    for j in range(i):\n" +
      "        if a[j] < a[i] and dp[j] + 1 > dp[i]:\n" +
      "            dp[i] = dp[j] + 1\n" +
      "best = 0\n" +
      "for i in range(n):\n" +
      "    if dp[i] > best:\n" +
      "        best = dp[i]\n" +
      "print(best)",
    cases: [
      { input: "5\n2 4 6 1 3", expectedOutput: "3" },
      /* The answer needs a number deleted from the middle: 1, 2, 3, 4. */
      { input: "5\n1 5 2 3 4", expectedOutput: "4", hidden: true },
      /* Strictly decreasing: nothing extends anything. */
      { input: "5\n5 4 3 2 1", expectedOutput: "1", hidden: true },
      /* All equal — «қатаң» means equal numbers do not continue a sequence. */
      { input: "4\n7 7 7 7", expectedOutput: "1", hidden: true },
      /* One number. */
      { input: "1\n42", expectedOutput: "1", hidden: true },
      /* Already increasing: the answer is the whole input. */
      { input: "6\n1 2 3 4 5 6", expectedOutput: "6", hidden: true },
      /* Two false starts before the real sequence: 2, 3, 7, 18. */
      { input: "8\n10 9 2 5 3 7 101 18", expectedOutput: "4", hidden: true },
      /* The best sequence ENDS in the middle: printing the last table entry
         answers 1 here. */
      { input: "7\n1 2 3 4 1 1 1", expectedOutput: "4", hidden: true },
      /* Repeats scattered through: 1, 4, 5, 9 or 3, 4, 5, 9. */
      { input: "6\n3 1 4 1 5 9", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * The first defence. «Ауызша түсіндіру» (p.6) carrying May's own clause
     * «екі шешімді ауызша қорғау» (p.10), which is the page cited: the mode
     * belongs to p.6 and appears in every monthly check, but the sentence that
     * makes TWO defences compulsory and ties them to the solved problems is
     * May's alone.
     *
     * The five marking points are the five parts `m9.l4` («Шешімді қорғау»)
     * teaches, named here so the teacher console shows the learner the same
     * five criteria the lesson set them: the method and why it was chosen, the
     * argument that it is correct, one input walked through by hand, the edge
     * cases and what the program does on each, and what breaks when a condition
     * changes. The last two are `m9.l4`'s own objectives verbatim.
     *
     * The learner chooses WHICH solved problem to defend, so the points are
     * written to be markable whatever they choose, with a concrete example from
     * A–E under each so a marker is not inventing a standard per learner.
     *
     * The grading rule is stated to the learner in the prompt and attributed to
     * the person who applies it. Nothing in this file scores the conjunction,
     * and the prompt does not imply that anything does.
     *
     * Settles as `unknown`. A teacher hears it, three or four minutes, while
     * the rest of the room is still coding — the arrangement `m6.as.b4` uses.
     */
    id: "m9.as.b6",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["contest.defend", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Шығарған есептеріңнің бірін таңдап, мұғалімге ауызша қорғап шық. Қорғау дегеніміз кодты жолма-жол оқып беру емес. Бес нәрсені осы ретпен айт. (1) Есеп нені сұрайды және сен қандай әдіс таңдадың, неге дәл соны? (2) Бұл әдіс неге дұрыс жауап береді — «жіберіп көрдім, өтті» емес, дәлел керек: не өзгермей сақталады, неге бірде-бір жағдай ескерусіз қалмайды? (3) Бір нақты кірісті ал да, бағдарламаңды қадам-қадам жүргізіп көрсет: әр қадамда айнымалыларыңда не тұр? (4) Қандай шеткі жағдайларды тексердің және бағдарламаң олардың әрқайсысында нені шығарады? (5) Шарттағы бір сан өзгерсе, шешіміңнің қай жері бұзылады? Ескерту: турнирдің ережесі бойынша шешілген есеп пен қорғау бірге қаралады — бірі болмаса, екіншісі жеке есепке алынбайды. Мұны машина емес, мұғалім шешеді.",
      ru: "Выбери одну из решённых задач и защити её устно перед учителем. Защита — это не чтение кода строка за строкой. Расскажи пять вещей в таком порядке. (1) Что требует задача и какой способ ты выбрал, почему именно его? (2) Почему этот способ даёт верный ответ — не «я отправил, и зашло», а доказательство: что остаётся неизменным, почему ни один случай не остаётся без внимания? (3) Возьми один конкретный вход и проведи по программе шаг за шагом: что лежит в переменных на каждом шаге? (4) Какие крайние случаи ты проверил и что твоя программа выводит на каждом из них? (5) Что в твоём решении сломается, если изменить одно из чисел в условии? Учти: по правилу турнира решённая задача и её защита рассматриваются вместе — одно без другого по отдельности не засчитывается. Решает это не машина, а учитель.",
    },
    expectedPoints: [
      {
        kk: "Әдісті атайды және таңдауын негіздейді. Оқушы есептің не сұрайтынын өз сөзімен қайталайды да, қолданған әдісін атайды: «тізімді бір рет қарап шығу», «алдымен реттеу», «жауап бойынша іздеу», «толқынмен жайылу», «кесте толтыру». Таңдаудың себебі шарттан шығуы керек — мысалы, B-де ұпайлар реттелмей берілгендіктен k-орындағы нәтижені реттемей табу мүмкін емес. «Осы тақырыпты соңғы өткенбіз» деген себеп емес.",
        ru: "Называет способ и обосновывает выбор. Ученик своими словами повторяет, что требует задача, и называет применённый способ: «один проход по списку», «сначала отсортировать», «поиск по ответу», «волна по клеткам», «заполнение таблицы». Причина выбора должна следовать из условия — например, в B очки даны в произвольном порядке, поэтому результат на k-м месте нельзя узнать без сортировки. «Мы это проходили последним» причиной не является.",
      },
      {
        kk: "Дұрыстығын дәлелдейді, тексерумен шатастырмайды. Күтетін жауап — қандай тұжырым әр қадамда сақталатыны: A-да «best айнымалысында қаралып өткен сандардың ең үлкені тұр», C-де «H өскен сайын жиналатын отын кемиді, сондықтан жарайтын H-тардың бәрі бір бөлікте жатыр», D-де «кезекке түскен ұяшық белгіленген, сондықтан ол екінші рет саналмайды», E-де «dp[i] — дәл i-орында аяқталатын ең ұзын тізбектің ұзындығы». «Барлық мысалда өтті» деген жауап бұл тармақты жаппайды.",
        ru: "Доказывает правильность, не подменяя её проверкой. Ожидается утверждение, которое сохраняется на каждом шаге: в A — «в переменной best лежит наибольшее из уже просмотренных чисел», в C — «чем выше H, тем меньше дров, поэтому все подходящие H идут подряд», в D — «клетка, попавшая в очередь, уже отмечена, поэтому второй раз не сосчитается», в E — «dp[i] — длина самой длинной последовательности, которая заканчивается ровно в позиции i». Ответ «все примеры прошли» этот пункт не закрывает.",
      },
      {
        kk: "Бір кірісте қадамдап жүргізіп көрсетеді. Оқушы шағын мысал алады (шарттағы мысал жарайды) және бағдарламаның айнымалыларының мәндерін ретімен атайды: цикл айнымалысы, жинақтаушы, кестенің толған бөлігі. Мұнда мұғалім оқушының шынымен өз кодын оқып отырғанын көреді: қате қадам емес, түсіндіре алмайтын қадам — қауіпті белгі.",
        ru: "Проводит один вход по шагам. Ученик берёт небольшой пример (пример из условия подходит) и по порядку называет значения переменных: счётчик цикла, накопитель, заполненная часть таблицы. Здесь учитель видит, что ученик действительно читает собственный код: тревожный признак — не ошибочный шаг, а шаг, который ученик не может объяснить.",
      },
      {
        kk: "Шеткі жағдайларды атайды және әрқайсысында не шығатынын біледі. Кемінде екеуі нақты аталуы керек, оның бірі есептің өз шекарасы болуы тиіс: A-да n = 1 және бәрінің ұпайы тең; B-де бірде-бір оқушы ұпай жинамаған жағдай; C-де жауаптың 0 болуы және дәл сәйкес келетін жағдай; D-де суы жоқ карта және тек бұрышымен түйісетін екі ұяшық; E-де барлық сан бірдей болғаны. Оқушы шеткі жағдайды атап қана қоймай, бағдарламасының сонда нақты нені шығаратынын айтады.",
        ru: "Называет крайние случаи и знает, что выводится на каждом. Нужно назвать хотя бы два, и один из них должен быть границей самой задачи: в A — n = 1 и все очки поровну; в B — никто не набрал очков; в C — ответ 0 и случай точного совпадения; в D — карта без воды и две клетки, соприкасающиеся только углом; в E — все числа одинаковы. Ученик не просто перечисляет крайние случаи, а говорит, что именно его программа выводит на каждом.",
      },
      {
        kk: "Шарт өзгергенде не бұзылатынын айтады. Мысалы: A-да ұпайлар теріс болмаса, `best` айнымалысын нөлден бастауға болар еді, ал теріс сандар бар болғандықтан болмайды; B-де «нөлден үлкен» шарты алынып тасталса, жауап қалай өзгереді; C-де m ағаштардың бәрінен жиналатын отыннан үлкен болса, жауап мүлде болмай қалады; D-де көршілікке бұрыштас ұяшықтар да кірсе, мысалдағы жауап 4 емес, 7 болады; E-де «қатаң өсу» талабы «кемімеу» болып өзгерсе, бірдей сандар да тізбекке кіре бастайды. Дәл сол өзгеріс кодтың қай жолын түзетуді талап ететінін көрсете алса, тармақ толық жабылады.",
        ru: "Говорит, что сломается при изменении условия. Например: в A, если бы очки не могли быть отрицательными, `best` можно было бы начинать с нуля, а при отрицательных — нельзя; в B — как изменится ответ, если убрать требование «строго больше нуля»; в C — если m больше, чем все дрова со всех деревьев, ответа не существует вовсе; в D — если считать соседями и диагональные клетки, ответ в примере станет 7, а не 4; в E — если заменить строгое возрастание на неубывание, в последовательность начнут входить и равные числа. Пункт закрыт полностью, если ученик показывает, какую именно строку кода пришлось бы из-за этого править.",
      },
    ],
  },
  {
    /*
     * The second defence, on a DIFFERENT problem — «екі шешімді ауызша қорғау»
     * (p.10) means two, and two of the same solution is one.
     *
     * It deliberately asks nothing `b6` asks. October's monthly check bought a
     * second copy of an answer its own written block had already taken, and the
     * fix here is that `b6` is about why the learner's solution is RIGHT and
     * this one is about why the obvious solution is WRONG or too slow. A
     * learner who defends A here and B in `b6` still meets two different sets
     * of questions.
     *
     * "Choose the hardest problem you solved" is guidance to the learner, not a
     * rule a marker enforces: whoever solved two problems defends the second of
     * their two, and the points below work for any of the five. The four points
     * are April's «қарсы мысал іздеу» and December's «уақытқа үлгеруді бағалау»
     * turned into questions about the learner's own code, which is the only
     * version of either question that cannot be answered from memory.
     *
     * Settles as `unknown`. Never machine-scored.
     */
    id: "m9.as.b7",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["contest.defend", "perf.time_estimate", "greedy.counterexample"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Екінші қорғау — БАСҚА есеп бойынша: біріншісінде айтқан есебіңді қайталама. Шешкендеріңнің ішіндегі ең қиынын таңдағаның дұрыс. Мұндағы сұрақ басқаша қойылады: «бағдарламаң қалай жұмыс істейді» емес, «неге ең қарапайым жол жарамайды». Төрт нәрсені айт. (1) Осы есепті оқығанда бірінші ойға келген қарапайым идея қандай еді және оны неге тастадың? (2) Сенің шешімің ең үлкен кірісте шамамен неше амал жасайды және бұл неге жеткілікті? (3) Тастаған идея дұрыс емес болса, оны жаңылыстыратын нақты кірісті айт; ал ол дұрыс, бірақ баяу болса, қай көлемнен бастап үлгермей қалатынын айт. (4) Шарттағы бір сан мың есе үлкейсе, шешіміңнің қай жері бірінші болып бұзылады?",
      ru: "Вторая защита — по ДРУГОЙ задаче: не повторяй ту, о которой рассказывал в первой. Разумно выбрать самую трудную из решённых. Вопрос здесь ставится иначе: не «как работает твоя программа», а «почему не годится самый простой путь». Расскажи четыре вещи. (1) Какая простая мысль пришла в голову первой, когда ты прочитал задачу, и почему ты от неё отказался? (2) Сколько примерно действий делает твоё решение на самом большом входе и почему этого достаточно? (3) Если отброшенная мысль просто неверна — назови конкретный вход, на котором она ошибается; если она верна, но медленна — скажи, начиная с какого размера она перестаёт укладываться. (4) Что в твоём решении сломается первым, если одно из чисел в условии увеличить в тысячу раз?",
    },
    expectedPoints: [
      {
        kk: "Тастаған идеяны нақты атайды. Күтілетіні — жалпы сөз емес, нақты бағдарлама: C-де «H-ты ең үлкен биіктіктен бастап бір-бірлеп кеміту», D-де «әр жолды бөлек санау» немесе «барлық су ұяшығын санау», E-де «қатар тұрған өспелі сандардың ең ұзын тізбегін алу», B-де «жауап әрқашан k» деген жорамал. Оқушы сол идеяны бір-екі сөйлеммен айтып бере алуы керек.",
        ru: "Точно называет отброшенную мысль. Ожидается не общая фраза, а конкретная программа: в C — «начать с самого высокого дерева и уменьшать H по единице», в D — «считать каждую строку отдельно» или «сосчитать все клетки воды», в E — «взять самую длинную цепочку возрастающих чисел, идущих подряд», в B — предположение «ответ всегда равен k». Ученик должен уметь изложить эту идею в одном-двух предложениях.",
      },
      {
        kk: "Өз шешімінің амал санын бағалайды. Дәл сан емес, шаманы айтады және ол шарттағы шектеулерден шығуы керек: E-де n = 1000 үшін кесте миллионға жуық салыстыру жасайды; D-де әр ұяшық кезекке бір-ақ рет түсетіндіктен, 100 × 100 картада он мыңдай қадам болады; C-де әр тексеру n амал, ал тексерулердің саны отыздан аспайды, өйткені әр қадамда іздеу аймағы екі есе қысқарады. Санды атаған соң, оны неге жеткілікті деп есептейтінін де айтады.",
        ru: "Оценивает число действий своего решения. Нужна не точная цифра, а порядок, и он должен следовать из ограничений: в E при n = 1000 таблица делает около миллиона сравнений; в D каждая клетка попадает в очередь ровно один раз, поэтому на карте 100 × 100 выходит порядка десяти тысяч шагов; в C каждая проверка стоит n действий, а самих проверок не больше тридцати, потому что на каждом шаге область поиска сокращается вдвое. Назвав число, ученик говорит и почему считает его достаточным.",
      },
      {
        kk: "Тастаған идеяны нақты кіріспен немесе нақты көлеммен жоққа шығарады. Егер идея дұрыс болмаса, қарсы мысал келтіреді: E-де «1 5 2 3 4» — қатар тұрғандар бойынша 3, ал дұрыс жауап 4; D-де диагональ бойынша қосылатын шешім үшін бұрышымен түйісетін екі ұяшық; B-де тең ұпай жинағандар k-дан асып кететін кіріс. Егер идея дұрыс, бірақ баяу болса, қай көлемнен бастап үлгермейтінін айтады: C-де H миллиардқа жететіндіктен, бір-бірлеп кемітетін шешім бір кірістің өзінде уақытқа сыймайды.",
        ru: "Опровергает отброшенную мысль конкретным входом или конкретным размером. Если мысль неверна, приводит контрпример: в E — «1 5 2 3 4», где по соседним числам выходит 3, а верный ответ 4; в D — две клетки, соприкасающиеся углом, для решения, склеивающего диагонали; в B — вход, где набравших поровну оказывается больше k. Если мысль верна, но медленна, называет размер, начиная с которого она не укладывается: в C значение H доходит до миллиарда, и уменьшение по единице не успевает уже на одном входе.",
      },
      {
        kk: "Шектеу мың есе үлкейгенде не бұзылатынын нақты көрсетеді. Жауап кодтың нақты жеріне тірелуі керек: E-де n = 1 000 000 болса, екі ішкі цикл миллион емес, триллион салыстыру жасайды да, кесте бұрынғыдай толса да, уақыт жетпейді; D-де карта 100 000 жол болса, кезектің өзі емес, барлық ұяшықты сақтайтын кесте жадыға сыймайды; C-де ағаштар биіктігі мың есе өссе, іздеу небәрі он қадамға ұзарады — яғни бұл жерде ештеңе бұзылмайды, және оны да айта білу керек. Соңғысы маңызды: «бәрі бұзылады» деген жауап та, «ештеңе бұзылмайды» деген жауап та дәлелденуі тиіс.",
        ru: "Показывает, что именно сломается, если ограничение вырастет в тысячу раз. Ответ должен упираться в конкретное место кода: в E при n = 1 000 000 два вложенных цикла сделают не миллион, а триллион сравнений, и таблица, заполняясь по-прежнему верно, просто не успеет; в D при карте в 100 000 строк в память не поместится не очередь, а таблица отметок для всех клеток; в C при увеличении высот в тысячу раз поиск удлинится всего на десяток шагов — то есть здесь не ломается ничего, и это тоже нужно уметь сказать. Последнее важно: и ответ «сломается всё», и ответ «не сломается ничего» требуют обоснования.",
      },
    ],
  },
];
