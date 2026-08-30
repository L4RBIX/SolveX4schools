import type { LessonBlock } from "../../types";

/**
 * m4.l8 · Өз бетіңмен шығар — December's independent practice set.
 *
 * Ten `write_code` blocks, no starter, no scaffold, nothing on screen but a
 * statement. This is where December pays into «шамамен 100 толық дербес шешім»
 * (p.11) and where the month's own «Айлық сынақ» sentence — «Шартты алған соң
 * кодқа отырмас бұрын қай шешім уақыт бойынша үлгеретінін айтып, таңдауын
 * негіздейді» (p.8) — is rehearsed before it is graded.
 *
 * Six decisions taken once, so no block below re-argues them.
 *
 * 1. **Every statement carries a real constraint.** The month's mastery line is
 *    «бағдарламаның берілген уақытқа үлгеретінін бағалау», and the product
 *    cannot enforce a time limit yet — see
 *    `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §3 and the month
 *    file's own note. So the part of that judgement the content CAN state
 *    honestly is stated: every prompt names the size of n, the size of q where
 *    there is one, and the range of the values. A learner who is never told
 *    that n reaches 200000 has never been asked the month's question. Where the
 *    bound is what rules a plan out — p8 and p10 — the prompt says which plan
 *    it rules out and roughly how many steps it would have cost, because
 *    «үлгермейді» with no number behind it is a rumour, not a reason.
 *
 * 2. **Nothing here is a lesson task with a new input format.** December's
 *    lessons already own the six named families outright: m4.l3.b6 sorts
 *    ascending, m4.l3.b7 takes the third by size, m4.l4.b7 is the median,
 *    m4.l4.b8 is the smallest and largest difference, m4.l5.b8 answers range
 *    sums from a prefix table, m4.l7.b7 counts distinct values and m4.l7.b8
 *    finds the most frequent one. Re-running any of those with `n` moved onto
 *    its own line would be a transcription exercise. So each block below keeps
 *    the PDF family and changes the question inside it, and its comment names
 *    the lesson block it is standing apart from. Two of them turn on reading
 *    the statement rather than recalling the lesson: p4 fixes the OPPOSITE
 *    median rule to the one m4.l4 taught and says so in capitals, and p6 asks
 *    for every most-frequent value instead of one.
 *
 * 3. **Sorting is the tool, `set` and `dict` are not available, and that is the
 *    point.** «Тізімдегі әртүрлі мәндер саны» and «ең жиі кездесетін сан» are
 *    one-liners with a set or a dict, which is exactly why the programme files
 *    them under sorting: after `a.sort()` equal values are adjacent, so both
 *    questions become one walk over the runs. p5 and p6 are that walk. No
 *    import anywhere, in any block.
 *
 * 4. **This month's builtins arrive, and the arrival is announced once.**
 *    `sorted()`, `.sort()`, `reversed()`, `min()`, `max()` and `sum()` became
 *    available in December and were withheld before it on purpose: October's
 *    «тізімдегі максимум мен минимум» and November's max/min FUNCTION are the
 *    exercises those builtins would delete. p1 is the first block of the bank
 *    and says so in one sentence, in both languages; no later prompt repeats it.
 *
 * 5. **Output is numbers only.** Not one program here prints a word, so there is
 *    no token for a Russian-track learner to match glyphs against instead of
 *    reasoning. Where "no answer exists" has to be representable — p10 — the
 *    answer is the number 0 and the prompt says so in both languages.
 *
 * 6. **Tracks follow September's and November's practice convention.** p1–p8
 *    are shown to every route, support included: support has spent the month
 *    assembling and repairing at m4.l3.b7s, m4.l4.b7s, m4.l5.b8s and m4.l7.b8s,
 *    and a month that never once asks them to write something alone has not
 *    taught them to. p9 (core and advanced) adds both ends of the sorted list
 *    in one answer, and p10 (advanced) is the only block where the constraint
 *    itself decides the algorithm.
 *
 * The two defects an October review caught do not have a foothold here: there
 * is no support twin to transcribe, since no block below is withheld from
 * support, and there is no `reorder_code`, so no line can be placed by its
 * indentation. What replaces them as the thing to watch is duplication with the
 * lessons, and that is what decision 2 is for.
 *
 * ## No diagnostic mappings
 *
 * A `write_code` answer is a program, not one of a fixed set of strings, so
 * there is no wrong answer here that a mapping could name — inventing one would
 * be the exact thing `types.ts` argues against. The failure classes these tasks
 * are built to expose are named in the case comments instead, where a reviewer
 * can check each one against the case that kills it.
 */
export const M4_PRACTICE: LessonBlock[] = [
  {
    /*
     * Rung 1, and the smallest possible use of the new tool — but not m4.l3.b6.
     * That block sorts one line of numbers ASCENDING and is on a card the whole
     * month can see; printing the same list the same way would be copying. Here
     * the order is reversed, which is a decision (which end does the walk start
     * from?) rather than a recall, and the count arrives on its own line, which
     * is the input shape the rest of this bank uses.
     *
     * This is also the one block that announces the month's new builtins. It is
     * first for that reason.
     */
    id: "m4.p1",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі — сандардың саны (1 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Сол сандарды КЕМУ ретімен, яғни үлкенінен кішісіне қарай, бір жолға бос орынмен бөліп шығар. Қайталанатын сандар қанша рет кездессе, сонша рет шығады. Мысалы n = 5, сандар `5 2 9 1 3` болса, жауап `9 5 3 2 1`. Осы айда `sorted()`, `.sort()`, `reversed()`, `min()`, `max()` және `sum()` ашылды: қазан мен қарашада бұл әрекеттерді циклмен өз қолыңмен жазғандықтан, олар әдейі кешіктірілген еді — енді дайын түрін қолдана бер.",
      ru: "В первой строке дано число n — количество чисел (1 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Выведи эти числа ПО УБЫВАНИЮ, то есть от большего к меньшему, в одну строку через пробел. Повторяющиеся числа выводятся столько раз, сколько раз встретились. Например, при n = 5 и числах `5 2 9 1 3` ответ `9 5 3 2 1`. В этом месяце открылись `sorted()`, `.sort()`, `reversed()`, `min()`, `max()` и `sum()`: их придерживали намеренно, потому что в октябре и ноябре ты писал всё это циклом вручную, — теперь можно пользоваться готовыми.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      'print(" ".join(map(str, reversed(a))))',
    cases: [
      { input: "5\n5 2 9 1 3", expectedOutput: "9 5 3 2 1" },
      { input: "1\n42", expectedOutput: "42" },
      /* Sorted as text, "100" would land before "9". Only `map(int, ...)`
         survives this one. */
      { input: "4\n10 9 2 100", expectedOutput: "100 10 9 2", hidden: true },
      /* Duplicates survive: a walk that skips equal neighbours prints three
         numbers where six were read. */
      { input: "6\n4 4 2 7 2 4", expectedOutput: "7 4 4 4 2 2", hidden: true },
      /* Already ascending — the case that kills "print what was read". */
      { input: "4\n1 2 3 4", expectedOutput: "4 3 2 1", hidden: true },
      /* Already descending, the mirror: a program that sorts and forgets to
         turn the list round passes the one above and fails this pair. */
      { input: "4\n4 3 2 1", expectedOutput: "4 3 2 1", hidden: true },
      { input: "5\n-3 10 0 -7 2", expectedOutput: "10 2 0 -3 -7", hidden: true },
      { input: "3\n6 6 6", expectedOutput: "6 6 6", hidden: true },
      {
        input: "8\n1000000000 -1000000000 0 5 5 -5 7 -7",
        expectedOutput: "1000000000 7 5 5 0 -5 -7 -1000000000",
        hidden: true,
      },
    ],
  },
  {
    /*
     * PDF p.8, «көлемі бойынша үшінші мәнді табу», with the constant turned
     * into a parameter and the direction turned round. m4.l3.b5 fills in
     * `a[len(a) - k]` for the k-th LARGEST and m4.l3.b7 takes the third
     * largest; here the count runs from the small end, so the index expression
     * the learner has seen is the wrong one and `a[k - 1]` has to be reasoned
     * out from where the ordering puts things.
     *
     * "Repeats count separately" is stated because it is a different question
     * from m4.l3.b8's third DISTINCT value, and a learner who met that block
     * has a live reason to expect the other rule.
     */
    id: "m4.p2",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.index", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда екі сан беріледі: n және k (1 ≤ k ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Сандарды өсу ретімен қойғанда k-шы орында тұратын мәнді шығар. Санау бірден басталады: k = 1 болғанда ең кіші сан, k = n болғанда ең үлкені. Қайталанатын сандар бөлек-бөлек саналады, яғни жауап — реттелген тізімнің дәл k-шы орнындағы сан. Мысалы n = 6, k = 3, сандар `5 2 9 1 3 8` болса, реттелген тізім `1 2 3 5 8 9`, жауап 3.",
      ru: "В первой строке даны два числа: n и k (1 ≤ k ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Выведи значение, которое окажется на k-м месте, если расставить числа по возрастанию. Счёт идёт с единицы: при k = 1 это самое маленькое число, при k = n — самое большое. Повторы считаются по отдельности, то есть ответ — число ровно на k-м месте отсортированного списка. Например, при n = 6, k = 3 и числах `5 2 9 1 3 8` отсортированный список `1 2 3 5 8 9`, ответ 3.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(a[k - 1])",
    cases: [
      /* Also the k-th-largest killer: a[n - k] here is 5, not 3. */
      { input: "6 3\n5 2 9 1 3 8", expectedOutput: "3" },
      /* k = 1 — the answer at the very first position of the sorted list. */
      { input: "5 1\n7 1 9 3 5", expectedOutput: "1" },
      /* k = n — the very last, and the case that punishes `a[k]`, which is
         out of range here and would crash rather than answer. */
      { input: "5 5\n7 1 9 3 5", expectedOutput: "9", hidden: true },
      { input: "1 1\n42", expectedOutput: "42", hidden: true },
      /* Repeats counted separately: reading the question as "k-th distinct"
         gives 4 here, not 2. */
      { input: "6 4\n1 1 1 2 3 4", expectedOutput: "2", hidden: true },
      { input: "3 2\n7 7 7", expectedOutput: "7", hidden: true },
      { input: "5 2\n-5 -1 -3 0 -9", expectedOutput: "-5", hidden: true },
      /* Not sorting at all: the raw list has 2 at index 2, the sorted one 3. */
      { input: "5 3\n9 1 2 3 4", expectedOutput: "3", hidden: true },
      { input: "4 4\n8 8 9 10", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * The extremes family, and deliberately not the half of m4.l4.b8 that
     * already prints `a[n - 1] - a[0]`. Removing one number first makes the
     * spread a CHOICE, and the choice is only between two candidates once the
     * list is ordered: drop the smallest or drop the largest, because dropping
     * anything in between leaves both ends where they were. That reasoning is
     * the task; the prompt gives an example of each direction winning and
     * stops there.
     *
     * `min(...)` is one of this month's arrivals and this is the first block
     * where it earns its place — two candidates, one line.
     */
    id: "m4.p3",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.index", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (2 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Тізімнен дәл БІР санды алып тастау керек. Қалған n − 1 санның ең үлкені мен ең кішісінің айырмасы мүмкіндігінше кіші болатындай етіп алып таста да, сол айырманы шығар. n = 2 болғанда бір ғана сан қалады, айырма 0. Мысалы n = 5, сандар `1 4 5 6 20` болса, 20-ны алып тастаған тиімді: қалғандарының айырмасы 6 − 1 = 5, ал 1-ді алып тастасақ 20 − 4 = 16 болар еді, сондықтан жауап 5.",
      ru: "В первой строке дано число n (2 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Нужно убрать ровно ОДНО число. Убери его так, чтобы разность между наибольшим и наименьшим из оставшихся n − 1 чисел получилась как можно меньше, и выведи эту разность. При n = 2 остаётся одно число, и разность равна 0. Например, при n = 5 и числах `1 4 5 6 20` выгоднее убрать 20: у оставшихся разность 6 − 1 = 5, а если убрать 1, получится 20 − 4 = 16, поэтому ответ 5.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(min(a[n - 2] - a[0], a[n - 1] - a[1]))",
    cases: [
      /* Removing nothing at all answers 19 here, so this kills the reading of
         the task as plain «ең үлкен мен ең кішінің айырмасы». */
      { input: "5\n1 4 5 6 20", expectedOutput: "5" },
      /* The mirror, and the case that kills "always drop the largest": here
         the outlier is at the small end and dropping the largest gives 103. */
      { input: "5\n-100 3 4 5 6", expectedOutput: "3" },
      /* n = 2: whichever number goes, one is left and the answer is 0. Both
         index expressions stay legal here — a[n - 2] is a[0] and a[n - 1] is
         a[1] — so the general solution needs no special case, and a solution
         that wrote one is being told the general one was enough. */
      { input: "2\n5 3", expectedOutput: "0", hidden: true },
      { input: "3\n7 7 7", expectedOutput: "0", hidden: true },
      /* Both directions tie at 2 — a solution that only ever checks one of
         them still passes, which is why the two cases above it exist. */
      { input: "4\n1 2 3 4", expectedOutput: "2", hidden: true },
      { input: "6\n10 10 10 10 10 100", expectedOutput: "0", hidden: true },
      { input: "6\n1 10 10 10 10 10", expectedOutput: "0", hidden: true },
      /* Unsorted, `a[n - 2] - a[0]` is 2 − 9 = −7 and the smaller of the two
         candidates is negative: forgetting to sort prints a negative spread. */
      { input: "4\n9 1 2 3", expectedOutput: "2", hidden: true },
      { input: "5\n-9 -1 -3 -7 -5", expectedOutput: "6", hidden: true },
    ],
  },
  {
    /*
     * PDF p.8, «медиананы табу» — and the rule is the OPPOSITE of the one
     * m4.l4 fixed. That is deliberate and it is announced in capitals in both
     * languages. m4.l4.b1 states «жұп болғанда екі ортаңғының кішісі», b4 makes
     * the learner choose the index and b7 has them write it, so a learner who
     * reproduces the lesson's `(n - 1) // 2` from memory here is doing exactly
     * what the month's assessment sentence warns against: acting before
     * reading the statement. Every even-length case below separates `n // 2`
     * from `(n - 1) // 2`, so the memory answer fails and the read answer
     * passes.
     *
     * A statement whose rule differs from the last one you saw is not a trick;
     * it is the ordinary condition of competitive programming, and this is the
     * first block in the year where the content says so out loud.
     */
    id: "m4.p4",
    type: "write_code",
    skillRefs: ["sort.basic", "debug.boundary", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Медиананы шығар. МЫНА ЕРЕЖЕНІ мұқият оқы, ол сабақтағыдан өзгеше: n тақ болса, орта біреу; n ЖҰП болса, екі ортаңғының ҮЛКЕНІ алынады. Мысалы n = 4, сандар `8 2 5 1` болса, реттелген тізім `1 2 5 8`, ортадағы екеуі 2 мен 5, ал жауап солардың үлкені, яғни 5. n = 5, сандар `7 1 9 3 5` болса, реттелген тізім `1 3 5 7 9`, жауап 5.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Выведи медиану. ВНИМАТЕЛЬНО прочитай правило, оно отличается от того, что было на уроке: если n нечётное, середина одна; если n ЧЁТНОЕ, берётся БОЛЬШЕЕ из двух средних. Например, при n = 4 и числах `8 2 5 1` отсортированный список `1 2 5 8`, два средних — 2 и 5, а ответ — большее из них, то есть 5. При n = 5 и числах `7 1 9 3 5` отсортированный список `1 3 5 7 9`, ответ 5.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(a[n // 2])",
    cases: [
      /* Even n, and the lesson's rule answers 2 instead of 5. */
      { input: "4\n8 2 5 1", expectedOutput: "5" },
      /* Odd n, where both rules agree — so passing this proves nothing on its
         own, which is precisely why it is the visible one. */
      { input: "5\n7 1 9 3 5", expectedOutput: "5" },
      { input: "1\n42", expectedOutput: "42", hidden: true },
      /* n = 2: the two middles are the whole list. */
      { input: "2\n9 4", expectedOutput: "9", hidden: true },
      { input: "6\n3 1 4 1 5 9", expectedOutput: "4", hidden: true },
      { input: "8\n2 2 3 3 4 4 5 5", expectedOutput: "4", hidden: true },
      { input: "5\n6 6 6 6 6", expectedOutput: "6", hidden: true },
      /* Not sorting at all: the raw list has 2 in the middle, the sorted one 3. */
      { input: "5\n9 1 2 3 4", expectedOutput: "3", hidden: true },
      { input: "4\n-3 -10 0 -1", expectedOutput: "-1", hidden: true },
      /* Every value repeated: a solution that removes repeats before looking
         for the middle answers 5 on a list of two distinct values by accident
         and 1 here, so this pins the "repeats are elements too" reading. */
      { input: "6\n5 1 5 1 5 1", expectedOutput: "5", hidden: true },
    ],
  },
  {
    /*
     * PDF p.8, «тізімдегі әртүрлі мәндер саны». m4.l7.b7 prints that count and
     * nothing else, so this block asks for it AND for a second number off the
     * same walk: how many of those values occur exactly once. The second number
     * is what makes the run length matter — b7's solution only ever compares a
     * value with its neighbour and never has to know how long a run was — and
     * it is what puts a boundary at BOTH ends of the list: the final run is
     * closed after the loop ends, or the last value is never judged at all.
     *
     * Still no `set` and no `dict`: sorting is what puts equal values side by
     * side, and one pass then answers both halves.
     */
    id: "m4.p5",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "loops.counter", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Бір жолға бос орынмен бөліп екі санды шығар: алдымен тізімде неше ТҮРЛІ мән бар екенін, содан кейін солардың нешеуі дәл бір рет кездесетінін. Мысалы n = 5, сандар `5 2 5 2 7` болса, түрлі мәндер үшеу — 2, 5 және 7, ал дәл бір рет кездесетіні тек 7, сондықтан жауап `3 1`. Реттелген тізімде бірдей сандар қатар тұрады, сондықтан екі санды да бір рет аралап шығып табуға болады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Выведи в одну строку через пробел два числа: сначала сколько в списке РАЗЛИЧНЫХ значений, затем сколько из них встречаются ровно один раз. Например, при n = 5 и числах `5 2 5 2 7` различных значений три — это 2, 5 и 7, — а ровно один раз встречается только 7, поэтому ответ `3 1`. В отсортированном списке одинаковые числа стоят рядом, так что оба числа находятся за один проход.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "diff = 1\n" +
      "once = 0\n" +
      "run = 1\n" +
      "for i in range(1, n):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        diff = diff + 1\n" +
      "        if run == 1:\n" +
      "            once = once + 1\n" +
      "        run = 1\n" +
      "if run == 1:\n" +
      "    once = once + 1\n" +
      "print(diff, once)",
    cases: [
      /* Without sorting every neighbour differs here and the answer becomes
         `5 5` — the whole family's standard killer. */
      { input: "5\n5 2 5 2 7", expectedOutput: "3 1" },
      /* n = 1: the first value is a group nobody opened, so `diff = 0` before
         the loop prints `0 1`, and a solution that never closes the final run
         prints `1 0`. Both die here. */
      { input: "1\n7", expectedOutput: "1 1", hidden: true },
      /* All equal: one group, none of them alone. `diff = 0` prints `0 0`. */
      { input: "4\n6 6 6 6", expectedOutput: "1 0", hidden: true },
      { input: "5\n1 2 3 4 5", expectedOutput: "5 5", hidden: true },
      { input: "4\n10 9 8 7", expectedOutput: "4 4", hidden: true },
      { input: "6\n-2 -2 0 3 3 3", expectedOutput: "3 1", hidden: true },
      /* The last value is alone: forgetting the check after the loop answers
         `5 3`. The answer sits at the very last position. */
      { input: "7\n4 1 4 2 4 3 5", expectedOutput: "5 4", hidden: true },
      /* The last value is NOT alone: closing the final run unconditionally
         answers `3 1` instead of `3 0`. */
      { input: "6\n8 8 1 1 9 9", expectedOutput: "3 0", hidden: true },
      /* The lone value is at the very first position instead, which is where a
         loop that starts at i = 2 loses it. */
      { input: "5\n1 4 4 5 5", expectedOutput: "3 1", hidden: true },
    ],
  },
  {
    /*
     * PDF p.8, «ең жиі кездесетін сан». m4.l7.b8 prints one value and settles
     * ties with a rule; this asks for the whole tied set in ascending order,
     * which is a different program: the maximum run length has to be known
     * BEFORE any value can be printed, so one walk no longer suffices and the
     * learner has to either walk twice or collect and filter. Ordering is what
     * makes the second walk emit them ascending for free — no comparison of
     * candidates is needed at all.
     *
     * m4.l7.b8s is a support-only block whose starting program prints a value
     * and its count with the tie decided the wrong way; nothing in it can be
     * transcribed into an answer here, because neither the two-number print nor
     * the single-winner logic is what this asks for.
     */
    id: "m4.p6",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "loops.counter", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Ең жиі кездесетін мәнді шығар. Егер бірнеше мән бірдей ең көп рет кездессе, солардың БӘРІН өсу ретімен, бір жолға бос орынмен бөліп шығар. Мысалы n = 5, сандар `8 8 2 2 5` болса, 8 де, 2 де екі реттен кездеседі, ал 5 бір-ақ рет, сондықтан жауап `2 8`. Барлық сан әртүрлі болса, әрқайсысы бір реттен кездеседі, демек бәрі де ең жиі болып саналады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Выведи значение, которое встречается чаще всех. Если таких значений несколько, выведи ВСЕ из них по возрастанию, в одну строку через пробел. Например, при n = 5 и числах `8 8 2 2 5` и 8, и 2 встречаются по два раза, а 5 — один раз, поэтому ответ `2 8`. Если все числа различны, каждое встречается по одному разу, значит самыми частыми считаются все.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "best = 1\n" +
      "run = 1\n" +
      "for i in range(1, n):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = 1\n" +
      "    if run > best:\n" +
      "        best = run\n" +
      "res = []\n" +
      "run = 1\n" +
      "for i in range(1, n):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        if run == best:\n" +
      "            res.append(str(a[i - 1]))\n" +
      "        run = 1\n" +
      "if run == best:\n" +
      "    res.append(str(a[n - 1]))\n" +
      'print(" ".join(res))',
    cases: [
      /* Two winners, and printing only one of them fails immediately. */
      { input: "5\n8 8 2 2 5", expectedOutput: "2 8" },
      { input: "3\n7 7 7", expectedOutput: "7" },
      /* Every value alone: the maximum run is 1 and every value ties, so the
         answer is the whole sorted list. A solution that assumes a winner must
         repeat prints nothing here. */
      { input: "4\n1 2 3 4", expectedOutput: "1 2 3 4", hidden: true },
      { input: "1\n4", expectedOutput: "4", hidden: true },
      { input: "7\n9 9 3 3 3 1 1", expectedOutput: "3", hidden: true },
      { input: "4\n-3 -3 4 4", expectedOutput: "-3 4", hidden: true },
      /* Not sorted, the runs are 3(1), 1(2), 3(2): the answer becomes `1 3`. */
      { input: "5\n3 1 1 3 3", expectedOutput: "3", hidden: true },
      { input: "6\n5 5 1 1 9 9", expectedOutput: "1 5 9", hidden: true },
      /* Ends with two runs of length 1: emitting the final value without
         checking its run length adds a 5 that does not belong. */
      { input: "6\n2 2 3 3 4 5", expectedOutput: "2 3", hidden: true },
      /* The only winner is the LAST run, which is the one a loop-only solution
         never closes: it prints an empty line. */
      { input: "5\n7 7 1 2 3", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /*
     * m4.l4 spends its worked example proving that the closest pair is a pair
     * of NEIGHBOURS after sorting, and m4.l4.b6 and b8 both print the size of
     * the smallest difference. Printing the pair itself is what those blocks do
     * not ask for, and it changes the program in two places: the two values
     * have to be carried alongside the best difference, and ties now need a
     * rule, because two pairs can be equally close while being different pairs.
     *
     * The tie goes to the smallest first number, and on a sorted list that is
     * one character: `<` keeps the earliest winner, `<=` keeps the last.
     * The prompt states the rule and two hidden cases enforce it.
     */
    id: "m4.p7",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "compare.operators", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (2 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Мәні бойынша бір-біріне ең жақын екі санды тауып, оларды бір жолға бос орынмен бөліп шығар: алдымен кішісін, содан кейін үлкенін. Егер айырмасы бірдей ең жақын бірнеше жұп болса, кіші саны ең кіші болатын жұпты шығар. Сандар қайталануы мүмкін — ондай жұптың айырмасы 0 болады. Мысалы n = 5, сандар `15 4 9 22 7` болса, реттелген тізім `4 7 9 15 22`, ең кіші айырма 9 − 7 = 2, жауап `7 9`.",
      ru: "В первой строке дано число n (2 ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. Найди два числа, ближайших друг к другу по значению, и выведи их в одну строку через пробел: сначала меньшее, потом большее. Если ближайших пар несколько и разность у них одинаковая, выведи ту, у которой меньшее число самое маленькое. Числа могут повторяться — у такой пары разность равна 0. Например, при n = 5 и числах `15 4 9 22 7` отсортированный список `4 7 9 15 22`, наименьшая разность 9 − 7 = 2, ответ `7 9`.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "best = a[1] - a[0]\n" +
      "x = a[0]\n" +
      "y = a[1]\n" +
      "for i in range(1, n - 1):\n" +
      "    d = a[i + 1] - a[i]\n" +
      "    if d < best:\n" +
      "        best = d\n" +
      "        x = a[i]\n" +
      "        y = a[i + 1]\n" +
      "print(x, y)",
    cases: [
      { input: "5\n15 4 9 22 7", expectedOutput: "7 9" },
      /* The winning pair is the very first one. A scan whose loop starts at
         i = 1 only answers this if x and y were seeded from a[0] and a[1]
         before it; seeded from the wrong pair, or from best = 0, it does not. */
      { input: "4\n12 3 7 20", expectedOutput: "3 7" },
      /* n = 2: the loop body never runs and the answer is the initial pair. A
         solution that starts from `best = 0` prints nothing sensible here. */
      { input: "2\n9 4", expectedOutput: "4 9", hidden: true },
      /* All equal: every gap is 0, so the tie rule alone decides. */
      { input: "3\n7 7 7", expectedOutput: "7 7", hidden: true },
      /* Two pairs at distance 1, one at each end: `<=` answers `20 21`. */
      { input: "5\n1 2 10 20 21", expectedOutput: "1 2", hidden: true },
      /* The winner is the LAST neighbouring pair: a loop that stops one step
         early never sees it and answers `1 10`. */
      { input: "5\n1 10 20 30 31", expectedOutput: "30 31", hidden: true },
      { input: "4\n5 1 6 2", expectedOutput: "1 2", hidden: true },
      { input: "5\n-5 -1 -9 3 0", expectedOutput: "-1 0", hidden: true },
      { input: "3\n1000000000 -1000000000 0", expectedOutput: "-1000000000 0", hidden: true },
    ],
  },
  {
    /*
     * The prefix family, «тізім бөлігі туралы көп сұраққа тез жауап беру», with
     * the aggregate changed — so the provenance claim stays product-authored:
     * the PDF names the SUM of a segment, and m4.l5.b8 is that task verbatim.
     *
     * Counting even values in a segment is the same idea one level up. The
     * table is no longer built from the numbers themselves but from a yes/no
     * question asked about each one, which is what makes a prefix table a
     * general tool rather than a trick about sums. The subtraction, and its
     * off-by-one, are identical — and this solution indexes with L and R
     * directly (`p[R] - p[L - 1]`) instead of m4.l5.b8's conversion to 0-based
     * `l` and `r`, so neither program can be copied into the other.
     *
     * The prompt states the arithmetic the constraint forces: n and q both
     * reach 100000, so re-walking a segment per query is about 10^10 steps.
     * That number is the whole month in one sentence.
     */
    id: "m4.p8",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: [
      "precompute.prefix",
      "loops.accumulator",
      "arith.remainder",
      "perf.time_estimate",
      "perf.compare_solutions",
      "io.read",
    ],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100000). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000000000-нан аспайды. Үшінші жолда сұраулар саны q (1 ≤ q ≤ 100000). Одан кейін q жол, әр жолда екі сан: L және R (1 ≤ L ≤ R ≤ n). Орындар 1-ден нөмірленеді, екі шеті де кіреді. Әр сұрау үшін L-ден R-ге дейінгі орындарда неше ЖҰП сан тұрғанын жеке жолға шығар. Теріс сандар да жұп бола алады: −4 жұп, −3 тақ. Мысалы n = 5, сандар `3 4 4 1 6`, ал сұрау `2 3` болса, жауап 2. Әр сұрауда бөлікті қайтадан аралауға болмайды: n де, q да 100000-ға дейін, ол шамамен он миллиард қадам, ондай шешім уақытқа үлгермейді. Алдымен «алғашқы i санның ішінде неше жұп бар» деген кестені бір рет толтыр, содан кейін әр жауапты бір азайтумен ал.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 100000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000000000. В третьей строке количество запросов q (1 ≤ q ≤ 100000). Далее q строк, в каждой два числа: L и R (1 ≤ L ≤ R ≤ n). Позиции нумеруются с 1, оба конца включаются. Для каждого запроса выведи на отдельной строке, сколько ЧЁТНЫХ чисел стоит на позициях с L-й по R-ю. Отрицательные тоже бывают чётными: −4 чётное, −3 нечётное. Например, при n = 5, числах `3 4 4 1 6` и запросе `2 3` ответ 2. Проходить участок заново на каждый запрос нельзя: и n, и q доходят до 100000, это около десяти миллиардов шагов, такое решение по времени не проходит. Сначала один раз заполни таблицу «сколько чётных среди первых i чисел», а потом получай каждый ответ одним вычитанием.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    if a[i - 1] % 2 == 0:\n" +
      "        p[i] = p[i - 1] + 1\n" +
      "    else:\n" +
      "        p[i] = p[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    L, R = map(int, input().split())\n" +
      "    print(p[R] - p[L - 1])",
    cases: [
      /* The whole array, an inner segment, and both single ends. */
      { input: "5\n3 4 4 1 6\n4\n1 5\n2 3\n1 1\n5 5", expectedOutput: "3\n2\n0\n1" },
      { input: "1\n8\n1\n1 1", expectedOutput: "1", hidden: true },
      /* The off-by-one hunt: with `p[R] - p[L]` the first query answers 0 and
         the third answers 1, and with `p[R + 1] - p[L]` the last one reads past
         the table. Neighbouring queries differ by exactly one position. */
      { input: "4\n2 1 2 1\n4\n1 1\n1 2\n2 2\n2 4", expectedOutput: "1\n1\n0\n1", hidden: true },
      /* Negative even numbers, and the reason the prompt spells out that −4 is
         even: in Python `-4 % 2` is 0 and `-3 % 2` is 1, so `x % 2 == 0` is
         simply right here. A learner who carried over the C rule and expected
         `-3 % 2` to be −1 would have written `x % 2 != 1`, which agrees on
         these values — the case is here so the statement and the language do
         not quietly disagree with each other. */
      { input: "6\n-2 -3 0 5 -4 7\n3\n1 6\n1 3\n4 6", expectedOutput: "3\n2\n1", hidden: true },
      { input: "4\n2 4 6 8\n2\n1 4\n2 3", expectedOutput: "4\n2", hidden: true },
      /* No even number anywhere: the table stays flat and every answer is 0. */
      { input: "3\n1 3 5\n2\n1 3\n2 2", expectedOutput: "0\n0", hidden: true },
      { input: "8\n1 2 3 4 5 6 7 8\n4\n1 8\n8 8\n1 1\n2 7", expectedOutput: "4\n1\n0\n3", hidden: true },
    ],
  },
  {
    /*
     * CORE AND ADVANCED. PDF p.6: «Негізгі есептерді жедел қарқынмен өтіп,
     * күрделі есептер блогына көшу».
     *
     * One ordering, two answers, taken from opposite ends of it — which is the
     * claim m4.l3.b1 makes in prose («ең кішісі де, ең үлкені де, шеттегі
     * бірнеше мән де іздеусіз алынады») and which no block has yet made a
     * learner act on twice in one program. The dearest half is where the index
     * arithmetic bites: the k most expensive items start at position n − k, and
     * every off-by-one there is a wrong total rather than a crash.
     */
    id: "m4.p9",
    bank: {
      role: "extra_practice",
      why:
        "Both quantities are produced from nothing earlier on this route and in a harder form: m4.l6.b6 totals the cheapest k from a sorted list, and m4.l6.b8 computes the cheapest k and the dearest k of one sorted list in a single program and then adds the 2k > n overlap boundary this task has no equivalent of. Dropping the query loop and the boundary leaves no decision this route has not already made.",
    },
    type: "write_code",
    skillRefs: ["sort.basic", "lists.index", "loops.accumulator", "perf.time_estimate"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Дүкенде n тауар бар, әрқайсысының бағасы белгілі, және дәл k тауар сатып алу керек. Бірінші жолда екі сан беріледі: n және k (1 ≤ k ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан — бағалар, әрқайсысы 1-ден 1000000000-ға дейін. Бір жолға бос орынмен бөліп екі санды шығар: алдымен дәл k тауар алудың ең арзан жалпы бағасын, содан кейін ең қымбат жалпы бағасын. Бағалары бірдей тауарлар бөлек тауар болып саналады. Мысалы n = 5, k = 2, бағалар `7 2 9 4 1` болса, ең арзаны 1 + 2 = 3, ең қымбаты 9 + 7 = 16, жауап `3 16`.",
      ru: "В магазине n товаров, у каждого известна цена, и нужно купить ровно k товаров. В первой строке даны два числа: n и k (1 ≤ k ≤ n ≤ 200000). Во второй строке через пробел даны n целых чисел — цены, каждая от 1 до 1000000000. Выведи в одну строку через пробел два числа: сначала наименьшую возможную стоимость ровно k товаров, затем наибольшую. Товары с одинаковой ценой считаются разными товарами. Например, при n = 5, k = 2 и ценах `7 2 9 4 1` самая дешёвая покупка стоит 1 + 2 = 3, самая дорогая 9 + 7 = 16, ответ `3 16`.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(sum(a[0:k]), sum(a[n - k:n]))",
    cases: [
      { input: "5 2\n7 2 9 4 1", expectedOutput: "3 16" },
      /* k = n: both answers are the whole basket, and `a[n - k:n]` has to
         start at position 0 rather than crash or come up one item short. */
      { input: "4 4\n5 5 5 5", expectedOutput: "20 20" },
      { input: "1 1\n1000000000", expectedOutput: "1000000000 1000000000", hidden: true },
      /* k = 1: the two answers are the extremes themselves, sitting at the very
         first and the very last position of the sorted list. */
      { input: "5 1\n7 2 9 4 1", expectedOutput: "1 9", hidden: true },
      { input: "6 3\n1 1 1 100 100 100", expectedOutput: "3 300", hidden: true },
      /* Already descending, then already ascending: a program that sorts and
         then reads the ends the wrong way round passes neither. */
      { input: "5 3\n5 4 3 2 1", expectedOutput: "6 12", hidden: true },
      { input: "5 3\n1 2 3 4 5", expectedOutput: "6 12", hidden: true },
      /* Duplicated top price: two separate items, so the dearest basket costs
         two billion and not one. */
      { input: "4 2\n1000000000 1000000000 1 1", expectedOutput: "2 2000000000", hidden: true },
      { input: "6 2\n3 1 4 1 5 9", expectedOutput: "2 14", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY, and the one block in the bank where the constraint chooses
     * the algorithm rather than merely describing it. n ≤ 2000 makes the
     * roughly two million (l, r) pairs affordable and a third loop over each
     * segment — four billion steps — not. That is the month's central sentence
     * applied to a plan the learner has to price before writing.
     *
     * m4.l5.b9 counts the segments whose sum is exactly s. This asks for the
     * longest whose sum is at most s, which is a different answer to keep (a
     * length, not a count), a different comparison (`<=`, not `==`) and a
     * different empty case — b9 can honestly print 0 for "none found" because 0
     * IS a count, whereas here 0 has to be declared to mean "no such segment",
     * and the prompt declares it.
     *
     * Negative values are allowed on purpose: with them, a longer segment can
     * have a SMALLER sum, so no shortcut that assumes sums only grow survives.
     * The two-pointer version of this problem belongs to January (p.9) and is
     * deliberately not asked for here.
     */
    id: "m4.p10",
    type: "write_code",
    skillRefs: ["precompute.prefix", "loops.nested", "perf.time_estimate", "perf.compare_solutions", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бірінші жолда екі сан беріледі: n және s (1 ≤ n ≤ 2000, s модулі 1000000-нан аспайды). Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысының модулі 1000-нан аспайды. Қосындысы s-тен аспайтын (яғни ≤ s) бос емес тұтас бөліктің ең үлкен ұзындығын шығар. Ондай бөлік мүлде болмаса, 0 шығар. Сандар теріс те бола алады, сондықтан бөлікті ұзартқанда қосынды кемуі де мүмкін. Мысалы n = 6, s = 7, сандар `2 1 5 1 1 3` болса, жауап 3: мысалы `5 1 1` бөлігінің қосындысы дәл 7, ал ұзындығы 4 болатын бөліктердің бәрінің қосындысы 7-ден асады. n ≤ 2000 болғандықтан барлық (l, r) жұбын қарап шығуға болады — бұл шамамен екі миллион жұп, ол уақытқа сыяды. Ал әр жұп үшін бөліктің қосындысын қайта санауға болмайды: ол үшінші цикл болар еді және үлгермес еді. Префикс кестені пайдалан.",
      ru: "В первой строке даны два числа: n и s (1 ≤ n ≤ 2000, s по модулю не больше 1000000). Во второй строке через пробел даны n целых чисел, каждое по модулю не больше 1000. Выведи наибольшую длину непустого непрерывного участка, сумма которого не превышает s (то есть ≤ s). Если такого участка нет вовсе, выведи 0. Числа могут быть отрицательными, поэтому при удлинении участка сумма может и уменьшаться. Например, при n = 6, s = 7 и числах `2 1 5 1 1 3` ответ 3: скажем, у участка `5 1 1` сумма ровно 7, а у любого участка длины 4 сумма больше 7. Так как n ≤ 2000, перебрать все пары (l, r) можно — это около двух миллионов пар, и по времени это проходит. А вот пересчитывать сумму участка для каждой пары нельзя: это был бы третий цикл, и он бы не уложился. Используй префиксную таблицу.",
    },
    referenceSolution:
      "n, s = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "best = 0\n" +
      "for l in range(n):\n" +
      "    for r in range(l, n):\n" +
      "        if p[r + 1] - p[l] <= s:\n" +
      "            if r - l + 1 > best:\n" +
      "                best = r - l + 1\n" +
      "print(best)",
    cases: [
      { input: "6 7\n2 1 5 1 1 3", expectedOutput: "3" },
      /* The sum equals s exactly, on a list of one. Two mutants die here and
         nowhere else in this set: `<` instead of `<=` answers 0, and an inner
         walk written `range(l + 1, n)` — one that only ever looks at segments
         of two or more — also answers 0. */
      { input: "1 5\n5", expectedOutput: "1" },
      /* No segment qualifies, so 0 is the answer rather than a failure. */
      { input: "1 5\n6", expectedOutput: "0", hidden: true },
      { input: "4 -1\n1 2 3 4", expectedOutput: "0", hidden: true },
      /* The whole array qualifies, so the answer is n itself and the inner walk
         has to reach the last position: written `range(l, n - 1)` it stops one
         short and answers 4. */
      { input: "5 100\n1 2 3 4 5", expectedOutput: "5", hidden: true },
      /* The winning segment sits at the very beginning, then at the very end. */
      { input: "5 3\n1 1 1 9 9", expectedOutput: "3", hidden: true },
      { input: "5 3\n9 9 1 1 1", expectedOutput: "3", hidden: true },
      /* Negatives, and the answer is the whole array: its sum is exactly 0
         even though the running total rises to 3 in the middle. A solution that
         abandons a starting position the moment the running sum exceeds s
         answers 3 here — which is the case for stating in the prompt that a
         longer segment can have a smaller sum. */
      { input: "6 0\n-1 -1 5 -1 -1 -1", expectedOutput: "6", hidden: true },
      { input: "4 4\n2 2 2 2", expectedOutput: "2", hidden: true },
      { input: "5 0\n0 0 0 0 0", expectedOutput: "5", hidden: true },
      { input: "6 5\n3 -2 4 -1 2 1", expectedOutput: "5", hidden: true },
    ],
  },
];
