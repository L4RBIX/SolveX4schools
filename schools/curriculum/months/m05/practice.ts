import type { LessonBlock } from "../../types";

/**
 * m5.l8 · «Өз бетіңмен шығар» — January's independent practice bank.
 *
 * Ten `write_code` blocks. No starter, no scaffold, nothing on screen but the
 * statement. This is January's share of «шамамен 100 толық дербес шешім»
 * (p.11), and it is where the month's own families are met without a lesson
 * standing next to them.
 *
 * ## The clauses that drive the bank
 *
 * The practice paragraph of January (p.9) lists the families by hand:
 *
 *   > тізімде сан бар ма, оны қай орынға кірістіру керек, берілген аралыққа
 *   > қанша сан түседі, қажетті қосындысы бар жұпты табу, қайталанбайтын ең
 *   > ұзын бөлік, екі реттелген тізімді біріктіру. Қосымша - іздеу
 *   > шекараларындағы қателерді түзету.
 *
 * Five of the six are here, and the two absences are decisions rather than
 * gaps.
 *
 * - **Boundary repair** («іздеу шекараларындағы қателерді түзету») is `m5.l6`,
 *   ten cards of it, and a repair task needs a program on the screen — which is
 *   the one thing this bank refuses to have.
 * - **«Қайталанбайтын ең ұзын бөлік»** is `m5.l5.b6`, and every route writes it
 *   from a blank editor there. The questions that family still has left — its
 *   length, its starting index, how many such pieces there are — are all the
 *   same walk with a different accumulator, so a block here would be `m5.l5.b6`
 *   with two lines moved. p8 takes the other forward walk instead: two pointers
 *   through two sorted lists, looking for the closest pair rather than the
 *   common values p6 asks for.
 *
 * The mastery sentence has two halves and both are exercised: halving a range
 * of positions (p1–p4), halving a range of ANSWERS (p7, p10), and walking two
 * boundaries along a segment or along two lists (p5, p6, p8, p9).
 *
 * ## 1. Every block keeps its family and changes the question
 *
 * The lessons already own the families outright, and re-running a lesson task
 * with `n` moved onto its own line is a transcription exercise. So each block
 * below names, in its own comment, the lesson block it is standing apart from.
 * Three of those decisions are worth stating here, because they removed the
 * obvious task and put a harder one in its place.
 *
 * - **There is no «x қай орында тұр, әйтпесе -1» task.** `m5.l6.b4` prints TWO
 *   complete programs for it: its `code` reports the last occurrence and its
 *   `fixedCode` the first. Both are on screen for the whole month, so a block
 *   asking for either would be answered by copying. p2 asks the question those
 *   two programs cannot answer between them — how MANY times x occurs — and
 *   answers it in three words rather than an index.
 *
 * - **There is no «кірістіру орнын шығар» task either.** That program is
 *   printed at `m5.l6.b2`, at `m5.l6.b3`, at `m5.l6.b7` and as the starting
 *   code of `m5.l2.b9s`. So p3 keeps the search — the position of x is still
 *   the whole of the work — and asks for the list x has been inserted INTO,
 *   which no card prints and which a wrong position visibly scrambles.
 *
 * - **The merge itself is `m5.l7.b7`, and every route has already written it.**
 *   p6 takes the same forward walk over two sorted lists and asks the question
 *   a concatenation cannot answer: which numbers are in both. The move is the
 *   merge's; the ending is not (there is no tail to copy — when one list runs
 *   out, the answer is finished).
 *
 * ## 2. Requirements a checker cannot see — one choice per block, named
 *
 * Output comparison sees output. «Екіге бөліп ізде» is a claim about method and
 * a linear scan prints the same characters, so every block below takes one of
 * the contract's three honest options, deliberately:
 *
 * - **Option 1 (make the output impossible without it): p7 and p10.** p7's
 *   largest case answers 1999999999999 and p10's answers 3000000000, and both
 *   were run: counting the candidates one at a time is billions of steps and
 *   returns nothing at all inside any limit. The method is required by the
 *   clock, not by a sentence — and the inputs that do it are five numbers long.
 * - **Option 2 (state it as advice and grade the answer): p1–p6, p8, p9.** For
 *   these the fast and the slow program print identical characters and no case
 *   a source file can hold separates them, so the prompt says «кеңес» / «совет»,
 *   gives the reason, and p1 says out loud — once, as the bank's first block —
 *   that the checker compares only the printed words. No prompt anywhere below
 *   states a rule the product does not enforce.
 * - **Option 3 (send it to a human)** is not used here: this bank has no
 *   `explain` block by design, and January's written defence already exists at
 *   `m5.l7.b9` and in the monthly check's `m5.as.b2` and `m5.as.b4`.
 *
 * p4 is the one place where a structural requirement IS enforceable, and it is
 * enforced: its list arrives unsorted, and the hidden case `10 2 8 4 6 12` /
 * `5 11` answers 3 for a program that sorts first and 1 for a binary search run
 * on the raw input. That is why exactly one task in the bank arrives unsorted —
 * the prompt shouts it, and the case set backs the prompt up.
 *
 * ## 3. Output tokens
 *
 * `yes` / `no` (p1), `no` / `one` / `many` (p2), `none` (p5, p6). All English,
 * all named in BOTH prompts, so a learner on the Russian route reads the same
 * word the Kazakh one does instead of matching glyphs against a translation.
 * Everything else prints numbers.
 *
 * ## 4. Formatting, and where `exact` is declared
 *
 * p1 promises one answer per line and p3 and p6 promise one line of numbers
 * separated by single spaces. A prompt that states a layout gets a checker that
 * enforces it, so those three carry `{ kind: "exact" }`; every other block
 * prints one value and keeps the default `token`.
 *
 * ## 5. Tracks
 *
 * p1–p8 go to all three routes. Support has spent the month completing and
 * repairing at `m5.l1.b9s`, `m5.l2.b9s`, `m5.l3.b9s`, `m5.l4.b9s`, `m5.l5.b7s`,
 * `m5.l6.b7s` and `m5.l7.b7s`; a month that never once asks them to write alone
 * has not taught them to. p9 adds the counting walk for core and advanced, and p10 —
 * binary search on the answer with a check function — is advanced only.
 *
 * ## 6. No diagnostic mappings
 *
 * A `write_code` answer is a program, not one of a fixed set of strings, so
 * there is no wrong answer a mapping could name. The degenerate programs each
 * task is built against are named in its case comments instead, next to the
 * case that kills each one — every one of them executed, not argued.
 *
 * ## What is deliberately absent
 *
 * No `import`, here or anywhere in January — least of all `bisect`, which would
 * delete the month. No `set` and no `dict` anywhere in the year, so nothing
 * below leans on one. And no `in` on a list in any of the search tasks:
 * `x in a` answers «тізімде сан бар ма» in one token and would delete p1 and
 * p2, so their reference solutions write the loop. (The construct itself is
 * October's and stays reachable — that is what p1's advice paragraph is about.)
 */
export const M5_PRACTICE: LessonBlock[] = [
  {
    /*
     * PDF p.9, «тізімде сан бар ма». `m5.l1.b9` answers it for ONE x and prints
     * one token; here the same list is asked q times, so the search has to be
     * written as something that can be run again rather than as the whole
     * program. That is the smallest honest step up from the lesson task, which
     * is why it opens the bank.
     *
     * This is also the block that states, once for the whole bank, what the
     * checker actually compares. No later prompt repeats it.
     *
     * The wrong programs, and the case that kills each:
     *   prints `yes` always            → case 1 (the query 3 is absent);
     *   prints `no` always             → case 1 (9 and 20 are present);
     *   compares only the two ENDS     → case 1, where 9 sits strictly inside;
     *   `while left < right`, which never examines a one-wide range → case 1's
     *                                    query 20, reached only at left == right,
     *                                    and case 5's query 10;
     *   `right = n` instead of n - 1   → case 3's query 25, where a[mid] raises
     *                                    IndexError above the end of the list;
     *   `left = mid` with no + 1       → hangs on every case but case 2, whose
     *                                    list is one element long.
     * The one wrong program no case can kill is the linear scan — hence the
     * advice wording. Option 2, stated in the file header.
     */
    id: "m5.p1",
    type: "write_code",
    skillRefs: ["bsearch.core", "loops.for", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Бірінші жолда екі сан беріледі: n — тізімдегі сандар саны және q — сұрақтар саны (1 ≤ n ≤ 200000, 1 ≤ q ≤ 200000). Екінші жолда өспелі ретпен реттелген n бүтін сан тұр; бірдей сандар кездесуі мүмкін, ал реттеудің қажеті жоқ — тізім реттелген күйінде келеді. Үшінші жолда q сан тұр, әрқайсысы — бір сұрақ. Әр сұраққа жауапты бөлек жолға шығар: сұралған сан тізімде бар болса ағылшынша `yes` сөзін, жоқ болса `no` сөзін шығар, басқа ештеңе шығармау керек. Мысалы n = 5, q = 3, тізім `2 5 9 14 20`, сұрақтар `9 3 20` болса, экранға үш жол шығады: `yes`, `no`, `yes`.\n\nКеңес: тізім реттелген, сондықтан әр сұраққа іздеу аралығының жартысын тастай отырып жауап бер. Әр сұрақ үшін тізімді басынан аяғына дейін қарап шықсаң, ең үлкен енгізуде 200000 × 200000 салыстыру болар еді. Тексеру жүйесі тек шыққан сөздерді салыстырады, әдісіңді көрмейді — сондықтан бұл ереже емес, кеңес; бірақ нақты жарыста мұндай тізімді толық қарау уақытқа үлгермейді.",
      ru: "В первой строке даны два числа: n — количество чисел в списке и q — количество вопросов (1 ≤ n ≤ 200000, 1 ≤ q ≤ 200000). Во второй строке стоят n целых чисел, отсортированных по возрастанию; одинаковые числа встречаться могут, а сортировать ничего не нужно — список приходит уже упорядоченным. В третьей строке стоят q чисел, каждое из них — отдельный вопрос. На каждый вопрос выведи ответ в отдельной строке: английское слово `yes`, если такое число есть в списке, и `no`, если его нет; больше ничего выводить не нужно. Например, при n = 5, q = 3, списке `2 5 9 14 20` и вопросах `9 3 20` на экран выйдут три строки: `yes`, `no`, `yes`.\n\nСовет: список отсортирован, поэтому отвечай на каждый вопрос, отбрасывая половину интервала поиска. Если для каждого вопроса просматривать весь список подряд, на самом большом вводе получится 200000 × 200000 сравнений. Проверяющая система сравнивает только выведенные слова и метода не видит — так что это совет, а не правило; но на настоящем соревновании полный просмотр такого списка по времени не проходит.",
    },
    referenceSolution:
      "n, q = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "qs = list(map(int, input().split()))\n" +
      "for x in qs:\n" +
      "    left = 0\n" +
      "    right = n - 1\n" +
      '    ans = "no"\n' +
      "    while left <= right:\n" +
      "        mid = (left + right) // 2\n" +
      "        if a[mid] == x:\n" +
      '            ans = "yes"\n' +
      "            break\n" +
      "        elif a[mid] < x:\n" +
      "            left = mid + 1\n" +
      "        else:\n" +
      "            right = mid - 1\n" +
      "    print(ans)",
    /* The prompt promises one answer per line, so the comparison has to be the
       one the prompt promised. The first case is visible and carries the shape. */
    checker: { kind: "exact" },
    cases: [
      { input: "5 3\n2 5 9 14 20\n9 3 20", expectedOutput: "yes\nno\nyes" },
      /* n = 1: the loop body runs once and the interval is one wide from the
         start, which `while left < right` never enters. */
      { input: "1 2\n7\n7 3", expectedOutput: "yes\nno" },
      /* The first element, above everything, below everything, and an interior
         value — in one case, so a program that guards only one end still fails. */
      { input: "5 4\n2 5 9 14 20\n2 25 1 14", expectedOutput: "yes\nno\nno\nyes", hidden: true },
      /* All equal: every mid holds the same number. */
      { input: "6 3\n4 4 4 4 4 4\n4 5 3", expectedOutput: "yes\nno\nno", hidden: true },
      /* Duplicates, plus the first and the last position asked for by name. */
      {
        input: "7 5\n1 3 3 3 8 8 10\n3 8 1 10 2",
        expectedOutput: "yes\nyes\nyes\nyes\nno",
        hidden: true,
      },
      /* Two equal elements and queries on both sides of them. */
      { input: "2 3\n5 5\n5 4 6", expectedOutput: "yes\nno\nno", hidden: true },
      /* Negatives, and again both ends. */
      {
        input: "8 4\n-9 -4 -1 0 2 6 6 11\n-9 11 -5 0",
        expectedOutput: "yes\nyes\nno\nyes",
        hidden: true,
      },
    ],
  },
  {
    /*
     * The same family one step on, and the block that exists because the
     * obvious task — «x қай орында тұр, әйтпесе -1» — is already printed twice
     * in this month (`m5.l6.b4` shows the last-occurrence program as its `code`
     * and the first-occurrence program as its `fixedCode`).
     *
     * Neither of those programs answers this one. Knowing WHERE an occurrence
     * is says nothing about how many there are: the learner has to find the
     * first position of x and the first position after x, which is two searches
     * with different comparisons, and then read the gap between them.
     *
     * Three tokens rather than a number, so nothing on any card in January is
     * this program's output either.
     *
     * The wrong programs, and the case that kills each:
     *   any search that reports found-ness only → cases 1 and 5, where `many`
     *                                             and `one` both mean "found";
     *   the first occurrence found, then `one`  → case 1 (three 3s) and case 5;
     *   `many` whenever x is present            → case 3 (a lone 1 at the front)
     *                                             and case 4 (a lone 10 at the end);
     *   endpoints only                          → case 5, x = 8 strictly inside;
     *   prints `no` always                      → cases 1 and 3, and every other
     *                                             case whose answer is not `no`;
     *   a[left] read with no `left < n` guard   → case 10, where x is above
     *                                             everything and a[left] does
     *                                             not exist.
     */
    id: "m5.p2",
    type: "write_code",
    skillRefs: ["bsearch.boundary", "bsearch.core", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200000), екінші жолда өспелі ретпен реттелген n бүтін сан (бірдей сандар қатар тұруы мүмкін), үшінші жолда x саны беріледі. Тізім реттелген күйінде келеді, өзің реттемейсің. x-тің тізімде неше рет кездескеніне қарай бір ғана ағылшын сөзін шығар: мүлде кездеспесе `no`, дәл бір рет кездессе `one`, екі не одан көп рет кездессе `many`. Мысалы, тізім `1 3 3 3 8 8 10` болса, x = 5 үшін `no`, x = 10 үшін `one`, x = 3 үшін `many` шығады.\n\nКеңес: бірдей сандар қатар тұрғандықтан, x-тің алғашқы орнын да, одан кейінгі бірінші үлкен санның орнын да екіге бөліп іздеумен табуға болады — араларындағы қашықтық x-тің неше рет кездескенін айтады.",
      ru: "В первой строке дано n (1 ≤ n ≤ 200000), во второй — n целых чисел, отсортированных по возрастанию (одинаковые числа могут стоять рядом), в третьей — число x. Список приходит уже упорядоченным, сортировать его не нужно. В зависимости от того, сколько раз x встречается в списке, выведи ровно одно английское слово: `no`, если не встречается вовсе, `one`, если встречается ровно один раз, и `many`, если два раза или больше. Например, для списка `1 3 3 3 8 8 10` при x = 5 выйдет `no`, при x = 10 — `one`, при x = 3 — `many`.\n\nСовет: одинаковые числа стоят рядом, поэтому и позицию первого вхождения x, и позицию первого числа, большего x, можно найти делением интервала пополам — расстояние между ними и говорит, сколько раз встретился x.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "left = 0\n" +
      "right = n\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] < x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid\n" +
      "lo = left\n" +
      "left = 0\n" +
      "right = n\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] <= x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid\n" +
      "cnt = left - lo\n" +
      "if cnt == 0:\n" +
      '    print("no")\n' +
      "elif cnt == 1:\n" +
      '    print("one")\n' +
      "else:\n" +
      '    print("many")',
    cases: [
      { input: "7\n1 3 3 3 8 8 10\n3", expectedOutput: "many" },
      { input: "7\n1 3 3 3 8 8 10\n5", expectedOutput: "no" },
      /* A single occurrence at the very first position, and at the very last. */
      { input: "7\n1 3 3 3 8 8 10\n1", expectedOutput: "one", hidden: true },
      { input: "7\n1 3 3 3 8 8 10\n10", expectedOutput: "one", hidden: true },
      /* A repeated value strictly inside the list. */
      { input: "7\n1 3 3 3 8 8 10\n8", expectedOutput: "many", hidden: true },
      { input: "1\n5\n5", expectedOutput: "one", hidden: true },
      { input: "1\n5\n9", expectedOutput: "no", hidden: true },
      /* All equal, and x on either side of that single value. */
      { input: "4\n2 2 2 2\n2", expectedOutput: "many", hidden: true },
      { input: "4\n2 2 2 2\n1", expectedOutput: "no", hidden: true },
      { input: "4\n2 2 2 2\n3", expectedOutput: "no", hidden: true },
      /* Negatives, repeated at the front; and a lone value in the middle. */
      { input: "5\n-5 -5 0 3 3\n-5", expectedOutput: "many", hidden: true },
      { input: "5\n-5 -5 0 3 3\n0", expectedOutput: "one", hidden: true },
      { input: "6\n1 2 3 4 5 6\n6", expectedOutput: "one", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9, «оны қай орынға кірістіру керек» — and the insertion POSITION is
     * not what is printed, because that program is on screen four times over:
     * `m5.l6.b2` traces it, `m5.l6.b3` breaks it, `m5.l6.b7` hands it out as a
     * program to find a witness for, and `m5.l2.b9s` starts from it.
     *
     * So the search is unchanged and the answer is the list x has been put
     * into. A position that is off by one no longer hides inside a number: it
     * shows up as two numbers in the wrong order, on screen, on the first
     * visible case.
     *
     * Where x already occurs, both tie rules produce the SAME line, so the
     * task states no rule about it and none is needed — the ambiguity `m5.l2`
     * had to settle simply does not arise here.
     *
     * The wrong programs, and the case that kills each:
     *   prints the list unchanged        → every case;
     *   always appends x at the end      → case 2 (x below everything);
     *   always puts x at the front       → case 3 (x above everything);
     *   an off-by-one position           → case 1, which prints `1 3 5 4 7`;
     *   `right = n - 1` with `while left < right`, which cannot reach the end →
     *                                      cases 3 and 7, where the position is n.
     * Sorting the list with x appended is CORRECT and no case separates it, so
     * the prompt says so plainly instead of forbidding it — option 2.
     */
    id: "m5.p3",
    type: "write_code",
    skillRefs: ["bsearch.boundary", "lists.index", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200000), екінші жолда өспелі ретпен реттелген n бүтін сан (бірдей сандар кездесуі мүмкін), үшінші жолда x саны беріледі. x-ті тізімнің дұрыс орнына қойып, шыққан n + 1 санды бір жолға бос орынмен бөліп шығар: нәтиже де өспелі ретпен реттелген болуға тиіс. Мысалы, тізім `1 3 5 7` және x = 4 болса, жауап `1 3 4 5 7`. x барлық сандан кіші болса, ол ең алдында тұрады; барлығынан үлкен болса, ең соңында.\n\nЖаттығудың мәні — орынды екіге бөліп іздеу арқылы табу: x-тен қатаң кіші сандардың саны — оның дәл сол орны. x-ті тізімнің соңына қосып, бүкіл тізімді қайта реттесең де дұрыс жол шығады, ал тексеру жүйесі тек сол жолды салыстырады — бірақ сонда жаттығудың өзі жоғалады.",
      ru: "В первой строке дано n (1 ≤ n ≤ 200000), во второй — n целых чисел, отсортированных по возрастанию (одинаковые числа встречаться могут), в третьей — число x. Поставь x на своё место в списке и выведи получившиеся n + 1 чисел в одну строку через пробел: результат тоже должен идти по возрастанию. Например, для списка `1 3 5 7` и x = 4 ответ `1 3 4 5 7`. Если x меньше всех чисел, он встанет первым; если больше всех — последним.\n\nСмысл упражнения в том, чтобы найти место делением интервала пополам: количество чисел, строго меньших x, — это и есть его место. Если приписать x в конец списка и отсортировать всё заново, строка получится верной, а проверяющая система сравнивает только её, — но тогда исчезнет само упражнение.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "left = 0\n" +
      "right = n\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] < x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid\n" +
      "res = a[:left] + [x] + a[left:]\n" +
      'print(" ".join(map(str, res)))',
    /* The prompt promises one line with single spaces, so the checker enforces
       the layout the prompt promised. Both visible cases carry the shape. */
    checker: { kind: "exact" },
    cases: [
      { input: "4\n1 3 5 7\n4", expectedOutput: "1 3 4 5 7" },
      { input: "4\n1 3 5 7\n0", expectedOutput: "0 1 3 5 7" },
      { input: "4\n1 3 5 7\n9", expectedOutput: "1 3 5 7 9", hidden: true },
      /* Exactly equal to the first element, and to the last. */
      { input: "4\n1 3 5 7\n1", expectedOutput: "1 1 3 5 7", hidden: true },
      { input: "4\n1 3 5 7\n7", expectedOutput: "1 3 5 7 7", hidden: true },
      /* One element, x on either side of it, and x equal to it. */
      { input: "1\n5\n2", expectedOutput: "2 5", hidden: true },
      { input: "1\n5\n9", expectedOutput: "5 9", hidden: true },
      { input: "1\n5\n5", expectedOutput: "5 5", hidden: true },
      /* All equal, x inside the run and just below it. */
      { input: "5\n4 4 4 4 4\n4", expectedOutput: "4 4 4 4 4 4", hidden: true },
      { input: "5\n4 4 4 4 4\n3", expectedOutput: "3 4 4 4 4 4", hidden: true },
      /* Negatives, and x landing between two equal numbers. */
      { input: "6\n-9 -4 -4 0 2 8\n-4", expectedOutput: "-9 -4 -4 -4 0 2 8", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9, «берілген аралыққа қанша сан түседі». `m5.l3.b8` asks it of a
     * list that arrives sorted; here the numbers arrive in whatever order they
     * were written down, and sorting them is the learner's job.
     *
     * That single change is what makes this the one block in the bank whose
     * method IS enforced by its cases. A binary search run on the raw input is
     * not slow, it is wrong: on `10 2 8 4 6 12` with the range `5 11` it
     * answers 1 where the truth is 3. So the prompt states the requirement and
     * the case set backs it, instead of the prompt stating something the
     * checker cannot see.
     *
     * The wrong programs, and the case that kills each:
     *   searches without sorting          → cases 9 and 11, where it answers 1
     *                                       and 1 against 3 and 3;
     *   strict comparisons (> l, < r)     → case 3, where both endpoints are in
     *                                       the list, 3 instead of 5;
     *   forgets the + 1 and takes
     *   first(r) - first(l)               → case 5 (`7 7 7 7` over [7, 7]),
     *                                       0 instead of 4;
     *   prints n, or counts everything    → cases 2, 4, 6, 8, where nothing
     *                                       qualifies on either side;
     *   counts nothing                    → cases 3 and 5, where everything does.
     * Case 9 also carries the shape a search assuming its target is present
     * gets wrong: neither 5 nor 11 occurs in the list.
     */
    id: "m5.p4",
    type: "write_code",
    skillRefs: ["bsearch.core", "sort.basic", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200000), екінші жолда n бүтін сан беріледі. Абайла: бұл жолы сандар КЕЗ КЕЛГЕН ретпен келеді, реттелмеген — оларды алдымен өзің реттеуің керек, әйтпесе екіге бөліп іздеудің мәні болмайды. Үшінші жолда аралықтың екі шекарасы: l және r (l ≤ r). Мәні l-ден кем емес әрі r-ден артық емес, яғни [l, r] аралығына түсетін сандар нешеу — соны шығар. Шекараның дәл өзіне тең сандар да саналады. Мысалы, сандар `8 1 3 3 5`, ал l = 3, r = 5 болса, реттелген тізім `1 3 3 5 8` болады, аралыққа 3, 3 және 5 түседі, сондықтан жауап 3.\n\nКеңес: реттегеннен кейін жауапты екі іздеудің айырмасы ретінде табуға болады — r-ден үлкен бірінші санның орнынан l-ден кем емес бірінші санның орнын алып таста.",
      ru: "В первой строке дано n (1 ≤ n ≤ 200000), во второй — n целых чисел. Внимание: на этот раз числа идут в ПРОИЗВОЛЬНОМ порядке, они не отсортированы — сначала упорядочить их придётся самому, иначе деление интервала пополам не имеет смысла. В третьей строке даны две границы промежутка: l и r (l ≤ r). Выведи, сколько чисел попадает в промежуток [l, r], то есть не меньше l и не больше r. Числа, равные самим границам, тоже считаются. Например, если числа `8 1 3 3 5`, а l = 3 и r = 5, то отсортированный список — `1 3 3 5 8`, в промежуток попадают 3, 3 и 5, поэтому ответ 3.\n\nСовет: после сортировки ответ можно получить как разность двух поисков — из позиции первого числа, большего r, вычесть позицию первого числа, не меньшего l.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "l, r = map(int, input().split())\n" +
      "a.sort()\n" +
      "\n" +
      "def first_at_least(v):\n" +
      "    left = 0\n" +
      "    right = n\n" +
      "    while left < right:\n" +
      "        mid = (left + right) // 2\n" +
      "        if a[mid] < v:\n" +
      "            left = mid + 1\n" +
      "        else:\n" +
      "            right = mid\n" +
      "    return left\n" +
      "\n" +
      "print(first_at_least(r + 1) - first_at_least(l))",
    cases: [
      { input: "5\n8 1 3 3 5\n3 5", expectedOutput: "3" },
      { input: "5\n8 1 3 3 5\n9 100", expectedOutput: "0" },
      /* The range covers the whole list, endpoints included. */
      { input: "5\n8 1 3 3 5\n1 8", expectedOutput: "5", hidden: true },
      { input: "5\n8 1 3 3 5\n-5 0", expectedOutput: "0", hidden: true },
      /* All equal, and l == r sitting exactly on that value. */
      { input: "4\n7 7 7 7\n7 7", expectedOutput: "4", hidden: true },
      { input: "4\n7 7 7 7\n8 9", expectedOutput: "0", hidden: true },
      { input: "1\n5\n5 5", expectedOutput: "1", hidden: true },
      { input: "1\n5\n6 9", expectedOutput: "0", hidden: true },
      /* Unsorted input where searching the raw list answers 1, not 3, and
         where neither boundary is a member of the list. */
      { input: "6\n10 2 8 4 6 12\n5 11", expectedOutput: "3", hidden: true },
      { input: "7\n5 5 1 9 1 9 5\n2 8", expectedOutput: "3", hidden: true },
      { input: "5\n-3 -1 -7 4 0\n-3 0", expectedOutput: "3", hidden: true },
      { input: "3\n1 2 3\n2 2", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9, «қажетті қосындысы бар жұпты табу». `m5.l4.b8` asks whether a
     * pair with sum exactly s exists and `m5.l4.b9` counts such pairs; the
     * worked example at `m5.l4.b2` prints the pair itself. So this block asks
     * the version none of them answers: the best sum that does NOT exceed s.
     *
     * The move rule is the lesson's — too big, drop the right end; small
     * enough, this is the best partner the left end will ever get, record it
     * and move left — but the reason for the left step is new, and a learner
     * who moves the pointers by memory rather than by the argument records the
     * wrong sum.
     *
     * The wrong programs, and the case that kills each:
     *   takes the two largest numbers        → case 1, 13 exceeds s = 8;
     *   allows a number to pair with itself  → case 1 as well, 4 + 4 = 8;
     *   compares only the two ends           → case 1, 1 + 9 = 10, would say `none`;
     *   stops at the FIRST pair that fits    → case 9, which finds 5 before 6;
     *   `<` where `<=` was meant             → cases 3, 5, 7 and 9, sums exactly
     *                                          on s;
     *   `best = 0` with no "found" flag      → case 10, whose answer is -2, and
     *                                          case 14, whose answer is -16;
     *   never reports failure                → cases 2, 6, 8 and 13.
     * A nested loop over all pairs is correct and no case set this file can
     * hold makes it time out, so the pass is stated as advice — option 2.
     */
    id: "m5.p5",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.index", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны (2 ≤ n ≤ 200000), екінші жолда өспелі ретпен реттелген n бүтін сан (бірдей сандар кездесуі мүмкін), үшінші жолда s саны беріледі. Тізімнен әр түрлі екі орында тұрған екі сан таңдау керек, олардың қосындысы s-тен аспауға тиіс. Осындай қосындылардың ең үлкенін шығар. Егер бірде-бір жұптың қосындысы s-тен аспаса, ағылшынша `none` сөзін шығар. Бір орындағы санды екі рет алуға болмайды: жұп екі бөлек орыннан жиналады. Мысалы, тізім `1 3 4 9`, s = 8 болса, жауап 7, яғни 3 + 4: 4 + 9 = 13 тым үлкен, ал 4-ті өзімен қосуға болмайды.\n\nКеңес: тізім реттелген, сондықтан біреуі басынан, екіншісі соңынан жүретін екі көрсеткішпен бір өтуде шешуге болады. Қосынды үлкен болып кетсе, оң жақтағы сан ешқандай жұпқа жарамайды; сыйып тұрса, сол жақтағы сан үшін одан жақсы серік енді табылмайды.",
      ru: "В первой строке дано n (2 ≤ n ≤ 200000), во второй — n целых чисел, отсортированных по возрастанию (одинаковые числа встречаться могут), в третьей — число s. Нужно выбрать два числа, стоящие на разных позициях, так, чтобы их сумма не превышала s. Выведи наибольшую такую сумму. Если ни одна пара не укладывается в s, выведи английское слово `none`. Одно и то же число с одной позиции брать дважды нельзя: пара собирается с двух разных позиций. Например, для списка `1 3 4 9` и s = 8 ответ равен 7, то есть 3 + 4: сумма 4 + 9 = 13 слишком велика, а складывать 4 с самой собой нельзя.\n\nСовет: список отсортирован, поэтому задача решается за один проход двумя указателями — один идёт с начала, другой с конца. Если сумма превысила s, правое число не подойдёт ни к одной паре; если уложилась, лучшего партнёра для левого числа уже не найдётся.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = n - 1\n" +
      "best = 0\n" +
      "found = 0\n" +
      "while left < right:\n" +
      "    t = a[left] + a[right]\n" +
      "    if t <= s:\n" +
      "        if found == 0 or t > best:\n" +
      "            best = t\n" +
      "            found = 1\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "if found == 1:\n" +
      "    print(best)\n" +
      "else:\n" +
      '    print("none")',
    cases: [
      { input: "4\n1 3 4 9\n8", expectedOutput: "7" },
      { input: "2\n5 6\n3", expectedOutput: "none" },
      /* The sum exactly on the boundary, and one below it. */
      { input: "4\n1 3 4 9\n7", expectedOutput: "7", hidden: true },
      { input: "4\n1 3 4 9\n6", expectedOutput: "5", hidden: true },
      /* Two elements: the whole list is the only pair, both verdicts. */
      { input: "2\n5 6\n11", expectedOutput: "11", hidden: true },
      { input: "2\n5 6\n10", expectedOutput: "none", hidden: true },
      /* All equal, on and just below the boundary. */
      { input: "4\n4 4 4 4\n8", expectedOutput: "8", hidden: true },
      { input: "4\n4 4 4 4\n7", expectedOutput: "none", hidden: true },
      /* A later pair is better than the first one that fits. */
      { input: "4\n1 2 3 4\n6", expectedOutput: "6", hidden: true },
      /* Negatives: the answer is negative, so an accumulator starting at 0 lies. */
      { input: "4\n-5 -2 0 3\n-1", expectedOutput: "-2", hidden: true },
      /* Everything fits: the answer is the two largest numbers. */
      { input: "5\n1 2 3 4 5\n100", expectedOutput: "9", hidden: true },
      { input: "6\n1 1 1 1 1 1\n2", expectedOutput: "2", hidden: true },
      { input: "3\n-9 -8 -7\n-20", expectedOutput: "none", hidden: true },
      { input: "3\n-9 -8 -7\n-16", expectedOutput: "-16", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9, «екі реттелген тізімді біріктіру» — the walk, not the merge.
     * `m5.l7.b7` is the merge and every route has already produced it; asking
     * for it again would be the bank printing back a program the learner has
     * finished. So the two pointers move forward through two sorted lists
     * exactly as they do there, and the question is the one concatenation
     * cannot answer: which numbers stand in both lists.
     *
     * The ending is different too, which is why it is not `m5.l7.b7` with a
     * condition bolted on: when either list runs out the answer is complete, so
     * there is no tail to copy — the lesson's own hard idea does not apply, and
     * a learner who copies the tail loops in gets extra numbers.
     *
     * The wrong programs, and the case that kills each:
     *   prints the merged list             → every case;
     *   prints the whole of a, or of b     → cases 2, 5, 10, where nothing is
     *                                        common, and five others;
     *   stops as soon as one match is found → cases 1, 3, 9, which have two;
     *   copies the leftover of either list  → cases 2, 5 and 9, where numbers
     *                                        are left over that are in one list
     *                                        only;
     *   never reports the empty answer      → cases 2, 5, 10.
     * One variant that is NOT wrong, and was measured rather than assumed:
     * advancing only ONE pointer on a match still answers every case, because
     * each line is strictly increasing and the other pointer catches up on the
     * next comparison. It is a different program, not a broken one, so no case
     * is aimed at it.
     * Checking every number of a against every number of b is correct and no
     * case here separates it, so the single pass is advice — option 2.
     */
    id: "m5.p6",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.traverse", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Екі жол беріледі, әрқайсысында бос орынмен бөлінген бүтін сандар тұр (әр жолда кемінде бір, ең көбі 200000 сан). Екі жол да қатаң өсу ретімен реттелген: бір жолдың ішінде бірдей сан екі рет кездеспейді. Екі тізімде де бар сандарды өсу ретімен, бір жолға бос орынмен бөліп шығар. Ортақ сан мүлде болмаса, ағылшынша `none` сөзін шығар. Мысалы, `1 3 5 7 9` және `3 4 5 6` үшін жауап `3 5`.\n\nКеңес: екі тізімді де бір-ақ рет қарап шығуға болады. Әр тізімге бір көрсеткіш қой да, екеуін тек алға жылжыт: әр қадамда көрсеткіштер тұрған екі санды салыстырып, қайсысын жылжыту керегін шеш.",
      ru: "Даны две строки, в каждой — целые числа через пробел (не меньше одного и не больше 200000 чисел в строке). Обе строки отсортированы строго по возрастанию: внутри одной строки одинаковых чисел нет. Выведи в одну строку через пробел, по возрастанию, все числа, которые есть сразу в обоих списках. Если общих чисел нет вовсе, выведи английское слово `none`. Например, для `1 3 5 7 9` и `3 4 5 6` ответ `3 5`.\n\nСовет: оба списка достаточно просмотреть по одному разу. Поставь на каждый список свой указатель и двигай их только вперёд: на каждом шаге сравнивай два числа под указателями и решай, какой из них сдвинуть.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] == b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "        j += 1\n" +
      "    elif a[i] < b[j]:\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        j += 1\n" +
      "if len(res) == 0:\n" +
      '    print("none")\n' +
      "else:\n" +
      '    print(" ".join(map(str, res)))',
    /* The prompt promises one line with single spaces; both visible cases show
       the shape, including the `none` line. */
    checker: { kind: "exact" },
    cases: [
      { input: "1 3 5 7 9\n3 4 5 6", expectedOutput: "3 5" },
      { input: "1 2 3\n7 8 9", expectedOutput: "none" },
      /* Identical lists: the answer is the whole of both. */
      { input: "1 2 3\n1 2 3", expectedOutput: "1 2 3", hidden: true },
      /* One number in each list, equal and unequal. */
      { input: "5\n5", expectedOutput: "5", hidden: true },
      { input: "5\n6", expectedOutput: "none", hidden: true },
      /* The match is the LAST number of one list, in both directions. */
      { input: "1 2 3 4\n4", expectedOutput: "4", hidden: true },
      { input: "4\n1 2 3 4", expectedOutput: "4", hidden: true },
      /* The match is the first number of both. */
      { input: "1 5 9\n1 2 3", expectedOutput: "1", hidden: true },
      { input: "-9 -4 0 3\n-4 0 7", expectedOutput: "-4 0", hidden: true },
      /* Interleaved and disjoint: every step compares, nothing ever matches. */
      { input: "2 4 6 8 10\n1 3 5 7 9", expectedOutput: "none", hidden: true },
      { input: "1 2 3 4 5\n3", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * Searching the ANSWER rather than a list — `m5.l3`'s idea, with a check
     * this month has not written. `m5.l3.b7` is the integer square root and
     * `m5.l3.b9` counts copier output; here the check counts how many numbers
     * up to k survive a crossing-out, which is one `//` and a subtraction.
     *
     * OPTION 1 from the authoring contract, and it is the reason this block can
     * ask for the method at all: the last three cases put the answer past
     * 10⁹ and past 10¹², so a program that counts 1, 2, 3 … never prints
     * anything. The input that does it is two numbers long. Verified by running
     * both programs, not argued.
     *
     * The wrong programs, and the case that kills each:
     *   prints m                       → case 3, where m = 5 and the answer is 9;
     *   prints m + m // a              → case 3 again, 7 instead of 9;
     *   `>` where `>=` was meant       → every case: it returns the (m+1)-th
     *                                    number, e.g. 8 instead of 7 on case 1;
     *   right = m (too small a bound)  → case 3, whose answer is past m;
     *   `right = mid - 1` in this
     *   half-open loop                 → cases 4 and 7, where the interval
     *                                    shrinks past the answer;
     *   counts one number at a time    → cases 7 to 10, which never finish.
     */
    id: "m5.p7",
    type: "write_code",
    skillRefs: ["bsearch.core", "func.define", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "1, 2, 3, … деп қатарынан жазылған натурал сандардың ішінен a-ға бөлінетіндерінің бәрін сызып тастаймыз. Сызылмай қалғандарының қатарында m-ші тұрған сан қандай? Бір жолда бос орынмен бөлініп екі сан беріледі: a және m (2 ≤ a ≤ 1000000000, 1 ≤ m ≤ 1000000000000). Мысалы a = 3, m = 5 болса, сызылмай қалғандары 1, 2, 4, 5, 7, 8, … — олардың бесіншісі 7, сондықтан жауап 7.\n\nЖауап 1000000000000-нан да үлкен болуы мүмкін, сондықтан сандарды бірінен соң бірін санап шығу мүлде үлгермейді. «1-ден k-ға дейінгі сандардың ішінде сызылмай қалғаны m-нен кем емес пе?» деген тексеруді функция етіп жаз да, k-ны екіге бөліп ізде. 1-ден k-ға дейін a-ға бөлінетін сандардың саны — `k // a`. Жоғарғы шекара: a кемінде 2 болғандықтан, 1-ден 2m-ге дейінгі сандардың кемінде жартысы сызылмай қалады, сондықтан 2m әрқашан жетеді.",
      ru: "Из натурального ряда 1, 2, 3, … вычёркиваем все числа, которые делятся на a. Какое число стоит m-м среди оставшихся? В одной строке через пробел даны два числа: a и m (2 ≤ a ≤ 1000000000, 1 ≤ m ≤ 1000000000000). Например, при a = 3 и m = 5 невычеркнутыми остаются 1, 2, 4, 5, 7, 8, … — пятое из них равно 7, поэтому ответ 7.\n\nОтвет может оказаться больше 1000000000000, поэтому перебирать числа подряд заведомо не успеешь. Запиши функцией проверку «среди чисел от 1 до k осталось не меньше m невычеркнутых?» и ищи k делением пополам. Количество чисел от 1 до k, которые делятся на a, равно `k // a`. Верхняя граница: раз a не меньше 2, среди чисел от 1 до 2m невычеркнутой остаётся хотя бы половина, поэтому 2m годится всегда.",
    },
    referenceSolution:
      "a, m = map(int, input().split())\n" +
      "\n" +
      "def enough(k):\n" +
      "    return k - k // a >= m\n" +
      "\n" +
      "left = 1\n" +
      "right = 2 * m\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if enough(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    cases: [
      { input: "3 5", expectedOutput: "7" },
      /* The smallest possible answer: the loop must survive left == right at 1. */
      { input: "2 1", expectedOutput: "1" },
      { input: "2 5", expectedOutput: "9", hidden: true },
      /* The answer sits just before the first crossed-out number, and just after. */
      { input: "5 4", expectedOutput: "4", hidden: true },
      { input: "5 5", expectedOutput: "6", hidden: true },
      { input: "1000000000 1", expectedOutput: "1", hidden: true },
      /* The boundary where the first crossing-out finally shifts the answer. */
      { input: "1000000000 999999999", expectedOutput: "999999999", hidden: true },
      { input: "1000000000 1000000000", expectedOutput: "1000000001", hidden: true },
      /* Both of these need about 10¹² steps if counted one at a time. */
      { input: "2 1000000000000", expectedOutput: "1999999999999", hidden: true },
      { input: "7 1000000000000", expectedOutput: "1166666666666", hidden: true },
      { input: "10 10", expectedOutput: "11", hidden: true },
    ],
  },
  {
    /*
     * The second walk over two sorted lists, and the harder half of the pair
     * p6 opens. p6 asks which numbers stand in BOTH lists — an exact match, so
     * the walk can forget everything it has passed. Here nothing has to match:
     * the answer is the smallest distance between a number of the first list
     * and a number of the second, so the walk has to carry a best and to know
     * that stepping the pointer at the SMALLER number is the only step that can
     * ever shorten the distance.
     *
     * `m5.l7.b7` merges the two lists and `m5.l7.b8` takes the middle of the
     * merge; neither ever compares a number of one list with a number of the
     * other for anything but ordering, and no program in January carries a
     * running best across two lists. `abs()` is September's.
     *
     * Why this block and not «қайталанбайтын ең ұзын бөлік»: see the file
     * header. That family is `m5.l5.b6`, every route writes it there, and every
     * question left in it is that program with a different accumulator.
     *
     * The wrong programs, and the case that kills each:
     *   compares only the first numbers of each list → case 3, 9 instead of 7;
     *   compares only the two ends                   → case 1, where both ends
     *                                                  are 3 apart and the answer
     *                                                  is 1;
     *   steps the pointer at the LARGER number       → cases 1 and 3, where the
     *                                                  walk then leaves the two
     *                                                  closest numbers unpaired;
     *   answers 0 when a number is shared and the
     *   first distance otherwise                     → cases 1, 3, 4, 8, 9, 11;
     *   `best` never initialised from a real pair
     *   (starts at 0)                                → every case whose answer is
     *                                                  not 0, case 5 (one number
     *                                                  in each list) included;
     *   a walk that stops before the last number of
     *   either list                                  → case 12, whose answer is
     *                                                  the very last pair, and
     *                                                  case 3, whose answer is
     *                                                  the join between the two
     *                                                  lists.
     * Comparing every number of one list with every number of the other is
     * correct and no case here separates it, so the single pass is advice —
     * option 2, as in the file header.
     */
    id: "m5.p8",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.index", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Екі жол беріледі, әрқайсысында бос орынмен бөлінген бүтін сандар тұр (әр жолда кемінде бір, ең көбі 200000 сан). Екі жол да өспелі ретпен реттелген; бірдей сандар кездесуі мүмкін. Бірінші тізімнен бір сан, екінші тізімнен бір сан таңдап, олардың айырмасының модулін ең кіші ететін жұпты тап. Сол ең кіші айырманы шығар — жұптың өзін емес, тек санды. Екі тізімде де бар сан кездессе, жауап 0 болады. Мысалы, `1 5 9` және `4 12` үшін жауап 1, өйткені 5 пен 4-тің айырмасы 1, ал басқа жұптардың айырмасы одан үлкен.\n\nКеңес: екі көрсеткішті де тек алға жылжыт. Егер қазіргі екі санның кішісін бір қадам жылжытсаң, олардың арасы жақындауы мүмкін; үлкенін жылжытсаң, ешқашан жақындамайды.",
      ru: "Даны две строки, в каждой — целые числа через пробел (не меньше одного и не больше 200000 чисел в строке). Обе строки отсортированы по возрастанию; одинаковые числа встречаться могут. Выбери одно число из первого списка и одно из второго так, чтобы модуль их разности был наименьшим. Выведи эту наименьшую разность — не саму пару, а только число. Если какое-то число есть в обоих списках, ответом будет 0. Например, для `1 5 9` и `4 12` ответ равен 1, потому что разность 5 и 4 равна 1, а у всех остальных пар она больше.\n\nСовет: двигай оба указателя только вперёд. Если сдвинуть меньшее из двух текущих чисел, они могут сблизиться; если сдвинуть большее — не сблизятся никогда.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "best = abs(a[0] - b[0])\n" +
      "while i < len(a) and j < len(b):\n" +
      "    d = a[i] - b[j]\n" +
      "    if abs(d) < best:\n" +
      "        best = abs(d)\n" +
      "    if a[i] < b[j]:\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        j += 1\n" +
      "print(best)",
    cases: [
      { input: "1 5 9\n4 12", expectedOutput: "1" },
      { input: "2 4 6\n1 3 5", expectedOutput: "1" },
      /* Every number of one list is below every number of the other, both ways
         round: the answer is the join between them, not the first distance. */
      { input: "1 2 3\n10 11", expectedOutput: "7", hidden: true },
      { input: "10 11\n1 2 3", expectedOutput: "7", hidden: true },
      /* One number in each list. */
      { input: "5\n9", expectedOutput: "4", hidden: true },
      /* A shared number, and a shared number with repeats around it. */
      { input: "1 2 3\n3 4 5", expectedOutput: "0", hidden: true },
      { input: "2 2 2\n2", expectedOutput: "0", hidden: true },
      /* The closest pair is the LAST number of both lists. */
      { input: "1 2 3 100\n4 5 99", expectedOutput: "1", hidden: true },
      /* Negatives, and a gap that is wide on both sides of the answer. */
      { input: "-9 -4\n-6 3", expectedOutput: "2", hidden: true },
      { input: "1 100\n50 51", expectedOutput: "49", hidden: true },
      { input: "-5 -1 0\n7 8 9", expectedOutput: "7", hidden: true },
      /* The closest pair is the last number of BOTH lists and nothing before it
         comes near: a walk that stops one step short answers 47. */
      { input: "1 2 3 100\n50 99", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * The counting walk, for core and advanced, and January has two other
     * counting tasks it must not repeat.
     *
     * `m5.l4.b9` counts pairs that can be FORMED, so each position is used at
     * most once and a match moves both pointers; here every pair of positions
     * is counted separately, so a match moves one pointer and adds a whole
     * block of pairs at once. Same two pointers, opposite bookkeeping.
     *
     * `m5.l5.b8` counts pairs whose DIFFERENCE is at most k, and its walk is
     * the other one entirely: both pointers go forward through the sorted list
     * and `left` is dragged after `right`. A bound on a difference is a window;
     * a bound on a sum is two ends closing in, because raising the smaller
     * number and lowering the larger one both move the sum the same way. A
     * learner who carries `m5.l5.b8`'s loop over here counts the wrong pairs
     * on the very first case.
     *
     * The wrong programs, and the case that kills each:
     *   counts a position with itself   → case 2, 4 instead of 2;
     *   adds 1 instead of the whole
     *   block between the pointers      → case 1, 2 instead of 4;
     *   `<` where `<=` was meant        → case 1, where 1 + 4 and 2 + 3 are both
     *                                     exactly 5, and case 8;
     *   counts every pair               → cases 4, 7, 9, where the answer is 0;
     *   counts nothing                  → cases 3, 8, 12, where the answer is
     *                                     every pair there is;
     *   the sorted forward window of
     *   `m5.l5.b8`, carried over intact → case 1, straight away.
     * Cases 5, 6 and 7 are the smallest inputs there are: one element, so there
     * is no pair at all, and two, where the whole list is the only pair and the
     * answer is 1 on one side of the boundary and 0 on the other.
     * A nested loop over pairs is correct here and the cases cannot outrun it,
     * so the single pass is advice — option 2.
     */
    id: "m5.p9",
    type: "write_code",
    skillRefs: ["twopointers.core", "loops.counter", "perf.compare_solutions"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200000), екінші жолда өспелі ретпен реттелген n бүтін сан (бірдей сандар кездесуі мүмкін), үшінші жолда s саны беріледі. Қосындысы s-тен аспайтын жұптар нешеу — соны шығар. Жұп орындар бойынша саналады: екі бірдей сан әр түрлі орында тұрса, олар бөлек жұп құрайды, ал бір орындағы санды өзімен жұптауға болмайды. Мысалы, тізім `1 2 3 4`, s = 5 болса, жауап 4 — бұл (1, 2), (1, 3), (1, 4) және (2, 3) жұптары.\n\nКеңес: барлық жұпты бір-бірлеп тексерсең, 200000 сан үшін 20 миллиардтан астам жұп болар еді. Тізім реттелген, сондықтан екі көрсеткішпен бір өтуде санауға болады: сол шеттегі сан оң шеттегімен қосылып s-тен аспаса, олардың арасында тұрған сандардың бәрімен де аспайды.",
      ru: "В первой строке дано n (1 ≤ n ≤ 200000), во второй — n целых чисел, отсортированных по возрастанию (одинаковые числа встречаться могут), в третьей — число s. Выведи, сколько пар имеют сумму, не превышающую s. Пары считаются по позициям: два одинаковых числа на разных позициях образуют отдельную пару, а число с одной позиции нельзя соединить само с собой. Например, для списка `1 2 3 4` и s = 5 ответ равен 4 — это пары (1, 2), (1, 3), (1, 4) и (2, 3).\n\nСовет: если перебирать все пары по одной, для 200000 чисел их окажется больше 20 миллиардов. Список отсортирован, поэтому посчитать можно за один проход двумя указателями: если левое число вместе с правым укладывается в s, то со всеми числами между ними оно тем более укладывается.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = n - 1\n" +
      "cnt = 0\n" +
      "while left < right:\n" +
      "    if a[left] + a[right] <= s:\n" +
      "        cnt = cnt + (right - left)\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "print(cnt)",
    cases: [
      { input: "4\n1 2 3 4\n5", expectedOutput: "4" },
      { input: "3\n1 2 3\n4", expectedOutput: "2" },
      /* Every pair qualifies, and none does. */
      { input: "4\n1 2 3 4\n100", expectedOutput: "6", hidden: true },
      { input: "4\n1 2 3 4\n2", expectedOutput: "0", hidden: true },
      /* One element: there is no pair at all. */
      { input: "1\n5\n10", expectedOutput: "0", hidden: true },
      /* Two elements, on and just below the boundary. */
      { input: "2\n5 6\n11", expectedOutput: "1", hidden: true },
      { input: "2\n5 6\n10", expectedOutput: "0", hidden: true },
      /* All equal, exactly on s and one below it. */
      { input: "4\n2 2 2 2\n4", expectedOutput: "6", hidden: true },
      { input: "4\n2 2 2 2\n3", expectedOutput: "0", hidden: true },
      { input: "4\n-5 -3 0 2\n-1", expectedOutput: "5", hidden: true },
      /* Duplicates on both sides of the boundary sum. */
      { input: "6\n1 1 2 2 3 3\n4", expectedOutput: "10", hidden: true },
      /* A hundred zeros: the answer is 4950, which no accumulator reaches by
         adding one at a time per match. */
      {
        input:
          "100\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0",
        expectedOutput: "4950",
        hidden: true,
      },
    ],
  },
  {
    /*
     * ADVANCED ONLY — p.6's «Негізгі есептерді жедел қарқынмен өтіп, күрделі
     * есептер блогына көшу». The month's hardest shape: the answer is not
     * computed, it is searched, and the check is a whole greedy pass rather
     * than one comparison.
     *
     * `m5.l3` introduced the shape with checks that are one line (`k * k >= n`)
     * or one loop (`total += k // x`). This one needs the learner to write a
     * pass whose result is a COUNT of pieces, and to notice that the lower
     * boundary is not 1 but the longest single plank — the piece that plank
     * sits in can never be lighter than the plank itself.
     *
     * OPTION 1 again: case 9 has five planks of a billion each, so the answer is
     * 3000000000 and a program that tries every candidate weight upwards from
     * the largest plank makes two billion passes and returns nothing. Run, not
     * argued. Nothing in the prompt claims a rule the checker cannot see.
     *
     * The wrong programs, and the case that kills each:
     *   prints the total divided by k    → case 8, 103 // 2 = 51, where the
     *                                      answer is 100;
     *   starts the search below the
     *   largest plank and prints it      → case 8 as well;
     *   `parts < k` where `parts <= k`
     *   was meant                        → case 2, where exactly k pieces are
     *                                      needed, and case 6;
     *   `cur + x < cap`                  → case 5, where two planks fill a piece
     *                                      exactly;
     *   sorts the planks first           → cases 11 and 12, the only two whose
     *                                      answer changes when the row is
     *                                      reordered (8 becomes 7, 11 becomes
     *                                      10). Every other case here is
     *                                      order-blind, which is exactly why
     *                                      those two exist;
     *   prints the total, or the largest
     *   plank, without searching         → cases 1 and 5 disagree with both.
     */
    id: "m5.p10",
    type: "write_code",
    skillRefs: ["bsearch.core", "func.define", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бірінші жолда екі сан беріледі: n және k (1 ≤ k ≤ n ≤ 100000). Екінші жолда n бүтін оң сан — қатар тұрған тақтайлардың ұзындықтары (әрқайсысы 1-ден 1000000000-ға дейін). Тақтайлардың орнын ауыстыруға да, реттеуге де болмайды. Оларды қатарды бұзбай дәл k бөлікке бөлу керек: әр бөлік — қатар тұрған бір немесе бірнеше тақтай, әр тақтай дәл бір бөлікке кіреді. Бөліктің салмағы — ішіндегі ұзындықтардың қосындысы. Ең ауыр бөліктің салмағы мүмкіндігінше аз болатындай етіп бөл де, сол ең ауыр бөліктің салмағын шығар. Мысалы n = 5, k = 2, ұзындықтар `7 2 5 10 8` болса, ең жақсы бөлу — `7 2 5` (салмағы 14) және `10 8` (салмағы 18), сондықтан жауап 18.\n\nЖауапты тікелей есептеу қиын, ал «ең ауыр бөлік c-ден аспайтындай етіп бөлуге бола ма?» деген сұраққа жауап беру оңай: тақтайларды солдан оңға қарай жинай бер де, c-ден асып кетер алдында жаңа бөлік баста, ал бөліктің санын санап отыр. Осы тексеруді функция етіп жаз да, c-ны екіге бөліп ізде. Шекараларды ұмытпа: ең кіші c — ең ұзын тақтайдың өзі, себебі ол тұрған бөлік одан жеңіл бола алмайды; ең үлкені — барлық ұзындықтың қосындысы. Ол қосынды 100000000000000-ге жетуі мүмкін, сондықтан c-ны біртіндеп өсіріп көру мүлде үлгермейді.",
      ru: "В первой строке даны два числа: n и k (1 ≤ k ≤ n ≤ 100000). Во второй строке даны n целых положительных чисел — длины досок, стоящих в ряд (каждая от 1 до 1000000000). Менять доски местами и сортировать их нельзя. Нужно разрезать ряд ровно на k частей: каждая часть — это одна или несколько идущих подряд досок, и каждая доска попадает ровно в одну часть. Вес части — сумма длин досок в ней. Разрежь так, чтобы вес самой тяжёлой части был как можно меньше, и выведи вес этой самой тяжёлой части. Например, при n = 5, k = 2 и длинах `7 2 5 10 8` лучшее разрезание — `7 2 5` (вес 14) и `10 8` (вес 18), поэтому ответ 18.\n\nВычислить ответ напрямую трудно, зато на вопрос «можно ли разрезать так, чтобы самая тяжёлая часть не превышала c?» ответить легко: набирай доски слева направо, а перед тем как превысить c, начинай новую часть и считай части. Запиши эту проверку функцией и ищи c делением пополам. Не забудь про границы: наименьшее c — это самая длинная доска, ведь часть, в которой она стоит, легче неё быть не может; наибольшее — сумма всех длин. Эта сумма может доходить до 100000000000000, поэтому увеличивать c по одному заведомо не успеешь.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "\n" +
      "def enough(cap):\n" +
      "    parts = 1\n" +
      "    cur = 0\n" +
      "    for x in a:\n" +
      "        if cur + x <= cap:\n" +
      "            cur = cur + x\n" +
      "        else:\n" +
      "            parts = parts + 1\n" +
      "            cur = x\n" +
      "    return parts <= k\n" +
      "\n" +
      "left = max(a)\n" +
      "right = sum(a)\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if enough(mid):\n" +
      "        right = mid\n" +
      "    else:\n" +
      "        left = mid + 1\n" +
      "print(left)",
    cases: [
      { input: "5 2\n7 2 5 10 8", expectedOutput: "18" },
      /* k == n: every plank is its own piece, so the answer is the longest one. */
      { input: "3 3\n1 2 3", expectedOutput: "3" },
      /* k == 1: the answer is the whole sum. */
      { input: "3 1\n1 2 3", expectedOutput: "6", hidden: true },
      { input: "1 1\n5", expectedOutput: "5", hidden: true },
      /* Pieces that fill exactly, and the same list cut into single planks. */
      { input: "4 2\n1 1 1 1", expectedOutput: "2", hidden: true },
      { input: "4 4\n1 1 1 1", expectedOutput: "1", hidden: true },
      /* Equal planks that do not divide evenly among the pieces. */
      { input: "5 3\n5 5 5 5 5", expectedOutput: "10", hidden: true },
      /* One plank dominates: the answer is that plank, not the average. */
      { input: "4 2\n1 1 1 100", expectedOutput: "100", hidden: true },
      /* The answer is three billion; counting upwards never gets there. */
      {
        input: "5 2\n1000000000 1000000000 1000000000 1000000000 1000000000",
        expectedOutput: "3000000000",
        hidden: true,
      },
      { input: "2 2\n1000000000 1000000000", expectedOutput: "1000000000", hidden: true },
      /* The order of the planks decides the answer: sorting first gives 7. */
      { input: "6 3\n2 1 5 1 2 6", expectedOutput: "8", hidden: true },
      { input: "5 2\n5 1 5 1 5", expectedOutput: "11", hidden: true },
      { input: "7 3\n1 1 1 1 1 1 1", expectedOutput: "3", hidden: true },
    ],
  },
];
