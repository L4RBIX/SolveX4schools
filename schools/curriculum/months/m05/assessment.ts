import type { LessonBlock } from "../../types";

/**
 * Month 5 · Қаңтар — the monthly check. Twenty minutes. PDF p.9.
 *
 * January's «Айлық сынақ» sentence is one line and it names exactly two things:
 *
 *   > Бағдарлама шеткі жағдайлардың тексеруінен өтеді, ал оқушы екіге бөлу
 *   > кезінде жауаптың неге жоғалып кетпейтінін сөзбен түсіндіреді.
 *
 * A program that survives a check on the EDGE cases, and the learner saying in
 * words why the halving never throws the answer away. The second clause is the
 * loop invariant asked in a fourteen-year-old's vocabulary, and it is the most
 * specific oral question in the whole programme — so it is not softened into
 * «шешіміңді түсіндір». It is asked twice, about two different moments, and the
 * split between them is the design decision this file is mostly about.
 *
 * ## The four blocks and the clock
 *
 * The contract's own warning about assessments is that both twenty-minute
 * checks written before it carried four graded tasks and timed at thirty-plus.
 * This one carries four blocks and still fits, because three of them are short
 * by construction and one of them is not written down at all:
 *
 *   b1  unseen problem, blank editor              ~10 min
 *   b2  written explanation, three sub-questions   ~4 min
 *   b3  paper trace of a search that runs THREE    ~3 min
 *       iterations over a seven-element list
 *   b4  oral, three short questions                 — runs alongside, while
 *                                                     the teacher circulates
 *
 * Seventeen written minutes. The paper trace is deliberately three passes and
 * not seven: the check is on whether the learner can say what the collapsed
 * interval means, not on their stamina. If b3 had been a twelve-element list
 * the block would have been cut.
 *
 * ## Why the invariant is asked twice without being asked twice
 *
 * October's check asked two of its written questions again out loud four cards
 * later, and bought a second copy of an answer the learner had already written
 * down. The two blocks here are pointed at different moments of the same loop:
 *
 *   b2 (written) is about ONE STEP. `a[mid] < x`, the program writes
 *      `left = mid + 1`, and the questions are: how do we know `x` is not in
 *      the part just discarded, why is `mid` itself discarded too, and what
 *      breaks with `mid + 2`. The answer is a claim about sortedness.
 *
 *   b4 (oral) is about the END. The trace in b3 stops with `left = 4`,
 *      `right = 3` — an empty interval — and the question is why an empty
 *      interval is not a lost answer, what the two numbers on either side of
 *      the collapse point tell you, and what stayed true of `left` and `right`
 *      the whole way. That last one is the invariant stated, not justified.
 *
 * A learner who has written b2 cannot read b4 off their own sheet: b2 never
 * mentions the end of the loop, and b4 never asks why a half may be dropped.
 * b4's middle question is also the one nobody can recite, because it is about
 * the program the learner personally submitted in b1 — the same argument
 * October's deleted `m2.as.b3` was making, kept and moved into the mode the
 * programme names.
 *
 * ## The structural requirement, and which of the three honest options this is
 *
 * "Solve it with binary search" is a requirement output comparison cannot see:
 * a linear scan over the list with `abs()` answers b1 correctly and passes
 * every case, and it always will — the cases are small, and inventing a
 * 100 000-element case to time it out would be a lie of a different shape (the
 * runner has no time limit the learner can see). Verified rather than assumed:
 * the honest linear scan was run against all thirteen cases and passes them.
 *
 * So this file takes **option 3 — send it to a human**, and words the prompt
 * with option 2's discipline. b1's prompt gives the method as advice, says out
 * loud that only the produced answer is graded, and names where the method
 * actually gets checked: b4, where the learner explains their own boundaries to
 * a teacher who is holding the marking points. Nothing in this check tells a
 * fourteen-year-old that a rule was enforced when it was not.
 *
 * ## Why «ең жақын сан» and not one of the six practice families
 *
 * «Бейтаныс есеп» means unseen, and the six families the PDF lists for January
 * («тізімде сан бар ма», insertion position, count in a range, pair with a
 * given sum, longest repeat-free stretch, merging two sorted lists) are all
 * taught in `m5.l1`–`m5.l7` and all drilled in `m5.l8`. Nearest value is in
 * none of them, and it is the one search problem whose whole difficulty lives
 * where January's assessment sentence points: after the loop ends. The boundary
 * lands on the first number ≥ x, and the answer is either that number or the
 * one before it — so the program has to survive `left == len(a)` (x above
 * everything), `left == 0` (x below everything), a one-element list, an
 * all-equal list, and a tie. Those are not extra cases bolted on to reach a
 * count; they are the problem.
 *
 * The degenerate programs, and the case that kills each — every one of them
 * executed, not argued:
 *
 *   prints `a[left]` and nothing else       → crashes on «4 9 15 / 100»
 *   the same, clamped to the last index     → «1 5 9 14 20 / 6» answers 9
 *   prints `a[left - 1]`                    → «4 9 15 / 1» answers 15
 *   ties broken toward the LARGER           → «10 20 / 15» answers 20
 *   compares only the two ENDS of the list  → the visible sample answers 2
 *   a walk stopping one element short       → «4 9 15 / 100» answers 9
 *   an exact search that gives up when
 *   `x` is absent                           → the visible sample answers -1
 *
 * ## No diagnostic mappings here
 *
 * Every block in this file is either graded by running a program or read by a
 * person. A wrong number printed by b1 has several possible causes — the wrong
 * neighbour, the wrong tie rule, an unguarded end — and the contract is
 * explicit that an answer with more than one cause gets no mapping, so the
 * pipeline emits `unattributed_failure` and the engine asks instead of telling
 * a fourteen-year-old something false about their own mind.
 *
 * Provenance follows September and October: the three `verify` blocks implement
 * the programme's five general verification methods and cite p.6; the written
 * `explain` implements January's own sentence and cites p.9. And nothing here
 * imports anything — least of all `bisect`, which would delete the month.
 */
export const M5_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Бейтаныс есептер» (p.6), and the edge-case half of January's own
     * sentence (p.9). Blank editor, no starter — the input shape is two lines
     * and every task in `m5.l1`–`m5.l7` used exactly that shape, so a starter
     * would only be removing the one part of the work that is not being
     * measured either way.
     *
     * Thirteen cases, twelve hidden. The visible one is a middle case on
     * purpose: it is enough to check the input format and it kills the two
     * shortcuts that need killing in public — the endpoints-only answer and the
     * exact-match search that gives up when `x` is absent — while telling the
     * learner nothing about where the boundaries end up.
     *
     * The reference is the half-open form (`right = len(a)`, `while left <
     * right`) taught in `m5.l2` and `m5.l6`, because that is the form whose
     * exit value is a POSITION rather than a verdict, and this problem needs
     * the position. Its tail is where the marks are: `left` is the first index
     * with `a[left] >= x`, so the answer is `a[left]` or `a[left - 1]`, and
     * both reads have to be guarded before they happen. `x - a[left - 1] <=
     * abs(best - x)` breaks a tie toward the smaller number, which is what the
     * prompt promises in both languages.
     */
    id: "m5.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["bsearch.core", "bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген, өспелі ретпен реттелген бүтін сандар беріледі: кемінде біреу, ең көбі 100 000 сан, бірдей сандар кездесуі мүмкін. Екінші жолда бір бүтін сан `x` беріледі. Тізімнен `x`-ке ең жақын санды тап: `x` пен сол санның айырмасының модулі ең кіші болуы керек. Сол санның өзін шығар, орнын емес. Егер `x`-ке бірдей жақын екі сан табылса (бірі одан кіші, бірі үлкен), кішісін шығар. `x` тізімде кездесуі де, мүлде болмауы да мүмкін. Кеңес: тізім реттелген, сондықтан аралықтың жартысын тастай отырып ізде — бірақ баға тек шыққан жауап бойынша қойылады, ал әдісіңді 4-тапсырмада мұғалімге өзің ауызша түсіндіресің.",
      ru: "В первой строке через пробел даны целые числа, отсортированные по возрастанию: хотя бы одно, не больше 100 000 чисел, одинаковые числа встречаться могут. Во второй строке дано одно целое число `x`. Найди в списке число, ближайшее к `x`: модуль разности между `x` и этим числом должен быть наименьшим. Выведи само это число, а не его позицию. Если одинаково близких чисел оказалось два (одно меньше `x`, другое больше), выведи меньшее. Число `x` может как встречаться в списке, так и отсутствовать в нём. Совет: список отсортирован, поэтому ищи, отбрасывая половину интервала, — но оценивается только полученный ответ, а свой метод ты сам объяснишь учителю вслух в задании 4.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "x = int(input())\n" +
      "left = 0\n" +
      "right = len(a)\n" +
      "while left < right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] < x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid\n" +
      "best = a[0]\n" +
      "if left < len(a):\n" +
      "    best = a[left]\n" +
      "if left > 0 and x - a[left - 1] <= abs(best - x):\n" +
      "    best = a[left - 1]\n" +
      "print(best)",
    cases: [
      /* The only visible case. `x` sits between two numbers, nearer the right
         one — so «тек екі шетін салыстыру» answers 2 and an exact search that
         gives up on a miss answers -1. Both die in public, before a hidden case
         is ever reached. */
      { input: "2 5 8 12 20\n11", expectedOutput: "12" },
      /* x below everything: the boundary never moves, left = 0, and a program
         that reaches for `a[left - 1]` reads the LAST element instead. */
      { input: "4 9 15\n1", expectedOutput: "4", hidden: true },
      /* x above everything: the boundary walks off the end, left = len(a).
         `a[left]` is an IndexError and a scan that stops one short says 9. */
      { input: "4 9 15\n100", expectedOutput: "15", hidden: true },
      /* x exactly ON the first element, and on the last. */
      { input: "4 9 15\n4", expectedOutput: "4", hidden: true },
      { input: "4 9 15\n15", expectedOutput: "15", hidden: true },
      /* One element, both ways: present, and far away. The loop body may run
         zero times and the answer still has to come out. */
      { input: "7\n7", expectedOutput: "7", hidden: true },
      { input: "7\n100", expectedOutput: "7", hidden: true },
      /* All equal — the halving finds nothing to distinguish, and both
         neighbours of the collapse point hold the same number. */
      { input: "6 6 6 6\n2", expectedOutput: "6", hidden: true },
      { input: "6 6 6 6\n6", expectedOutput: "6", hidden: true },
      /* The tie, and the whole reason the prompt states a rule for it:
         15 - 10 = 20 - 15, so the answer is the smaller number. */
      { input: "10 20\n15", expectedOutput: "10", hidden: true },
      /* x absent with near neighbours on BOTH sides — once nearer the left
         neighbour, once nearer the right. A program that always prints the
         first number ≥ x passes the second and fails the first. */
      { input: "1 5 9 14 20\n6", expectedOutput: "5", hidden: true },
      { input: "1 5 9 14 20\n8", expectedOutput: "9", hidden: true },
      /* Repeats around the answer, and negatives: -5 is nearer -3 than -8. */
      { input: "3 3 7 7 9\n7", expectedOutput: "7", hidden: true },
      { input: "-8 -3 2\n-5", expectedOutput: "-3", hidden: true },
    ],
  },
  {
    /*
     * January's own sentence, written down: «жауаптың неге жоғалып кетпейтінін
     * сөзбен түсіндіреді» (p.9).
     *
     * It is asked about ONE step and with a list on the page, because "explain
     * why binary search is correct" is a question a learner answers by
     * repeating the lesson. Three sub-questions, and the third is the one that
     * makes the first two worth asking: `mid + 2` is a rule that still shrinks
     * the interval, still terminates, still looks like a search — and it loses
     * the answer. A learner who can say WHERE 25 went in that list understands
     * the invariant; one who has only memorised «mid + 1» does not.
     *
     * `ExplainBlock` has no `code` field, so the list is written into the
     * prompt in both languages. That is deliberate rather than a workaround: it
     * keeps the block readable on its own and stops it depending on which card
     * happens to be on screen.
     *
     * Never machine-scored. Settles as `unknown`; a teacher reads it against
     * these four points.
     */
    id: "m5.as.b2",
    type: "explain",
    skillRefs: ["bsearch.core", "bsearch.boundary", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Жазбаша жауап бер. `a = [3, 8, 12, 19, 25, 31, 40]` тізімінен `x` санын екіге бөліп іздеп отырмыз. Кезекті қадамда `mid = 3` шықты, `a[mid] = 19`, ал `a[mid] < x` болып шықты. Бағдарлама содан кейін `left = mid + 1` деп жазады, яғни 0-ден 3-ке дейінгі орындарды түгел тастайды. (1) Тасталған бөлікте `x` жоқ екенін қайдан білеміз — бұл тұжырым тізімнің қандай қасиетіне сүйенеді? (2) Неге `mid`-тің өзі де тасталады, яғни неге `left = mid` емес, `left = mid + 1`? (3) Ал біреу `left = mid + 2` деп жазса, не бұзылады? Сол тізімнен `x = 25`-ті іздеп көр де, нақты не болатынын жаз.",
      ru: "Ответь письменно. В списке `a = [3, 8, 12, 19, 25, 31, 40]` мы ищем число `x` делением пополам. На очередном шаге получилось `mid = 3`, `a[mid] = 19`, и оказалось, что `a[mid] < x`. После этого программа пишет `left = mid + 1`, то есть выбрасывает разом все позиции с 0-й по 3-ю. (1) Откуда мы знаем, что `x` нет в выброшенной части — на каком свойстве списка держится это рассуждение? (2) Почему выбрасывается и сам `mid`, то есть почему `left = mid + 1`, а не `left = mid`? (3) А что сломается, если кто-то напишет `left = mid + 2`? Поищи в этом же списке `x = 25` и запиши, что именно произойдёт.",
    },
    expectedPoints: [
      {
        kk: "Тізім өспелі ретпен реттелген, сондықтан 0-ден mid-ке дейінгі әр сан `a[mid]`-тен аспайды, ал `a[mid] < x`. Демек ол бөліктегі сандардың бәрі `x`-тен кіші және олардың ешқайсысы `x`-ке тең бола алмайды — жоғалатын ештеңе жоқ. Реттелмеген тізімде бұл пайымның күші жоқ: онда `a[mid]`-тің сол жағында қандай сан жатқаны белгісіз.",
        ru: "Список отсортирован по возрастанию, поэтому каждое число с позиций от 0 до mid не превышает `a[mid]`, а `a[mid] < x`. Значит, все числа в этой части меньше `x` и ни одно из них не может быть равно `x` — терять там нечего. Для неотсортированного списка это рассуждение не работает: там неизвестно, какие числа лежат слева от `a[mid]`.",
      },
      {
        kk: "`a[mid] < x` салыстыруы `mid`-тің өзі туралы да жауап берді: `a[mid]` `x`-ке тең емес. Сондықтан оны аралықта қалдырудың қажеті жоқ. Оның үстіне `left = mid` жазылса, аралық қысқармай қалуы мүмкін: `right = left + 1` болғанда `mid` дәл `left`-ке тең шығады да, `left` өз орнында тұрып қалады — цикл мәңгі айналады. Мысалы, сол тізімнен 40-ты іздегенде бағдарлама `left = 5`, `right = 6` күйінде тұрып қалады.",
        ru: "Сравнение `a[mid] < x` дало ответ и про сам `mid`: `a[mid]` не равен `x`. Поэтому оставлять его в интервале незачем. К тому же, если написать `left = mid`, интервал может перестать сокращаться: при `right = left + 1` середина `mid` совпадает с `left`, и `left` остаётся на месте — цикл крутится вечно. Например, при поиске 40 в этом списке программа зависнет в состоянии `left = 5`, `right = 6`.",
      },
      {
        kk: "`left = mid + 2` mid-тен кейінгі орынды `x`-пен бірде-бір рет салыстырмай тастап кетеді. `x = 25` үшін дәл солай болады: бірінші қадамда `mid = 3`, `a[3] = 19 < 25`, сондықтан `left` 0-ден бірден 5-ке секіреді де, 4-орындағы 25 мүлде қаралмайды. Одан әрі `mid = 5`, `a[5] = 31 > 25`, `right` 4-ке түседі, цикл тоқтайды — бағдарлама 25 жоқ дегендей жауап береді. Жауап дәл осылай жоғалады.",
        ru: "`left = mid + 2` выбрасывает позицию сразу за mid, ни разу не сравнив её с `x`. Для `x = 25` так и выходит: на первом шаге `mid = 3`, `a[3] = 19 < 25`, поэтому `left` прыгает с 0 сразу на 5, и число 25 на 4-й позиции не рассматривается вообще. Дальше `mid = 5`, `a[5] = 31 > 25`, `right` опускается до 4, цикл останавливается — и программа отвечает так, будто числа 25 нет. Вот так ответ и теряется.",
      },
      {
        kk: "Демек әр қадамның екі міндеті бар және екеуі де орындалуы керек: аралық міндетті түрде қысқаруы тиіс (әйтпесе цикл тоқтамайды) және аралықтан тек салыстыру жаңа ғана жоққа шығарған орындар ғана алынып тасталуы тиіс (әйтпесе жауап жоғалады). `mid + 1` — осы екеуін бірдей қанағаттандыратын жалғыз қадам: `mid`-ті алып тастауға құқығымыз бар, ал одан кейінгі орындарға ондай құқық жоқ.",
        ru: "Значит, у каждого шага две обязанности, и выполнить нужно обе: интервал обязан сократиться (иначе цикл не остановится) и из интервала можно убирать только те позиции, которые сравнение прямо сейчас исключило (иначе ответ потеряется). `mid + 1` — единственный шаг, который выполняет обе: убрать `mid` мы имеем право, а убирать позиции после него — уже нет.",
      },
    ],
  },
  {
    /*
     * «Кодты қолмен орындау» (p.6). The program is on the block, in `code` —
     * `m1.as.b3` shipped without it and rendered as a prompt about "this
     * program" above an empty box, which is why the field is now required.
     *
     * Seven elements and a target that is absent, so the loop runs three passes
     * and then collapses: `left = 4`, `right = 3`. Three passes is the whole
     * budget this block gets, and three passes is enough — the interesting
     * moment is the collapse, not the fourth halving. 20 is chosen because it
     * falls in the gap between 19 and 25, which is what makes `left` land on
     * the position where 20 WOULD go. b4 then asks about exactly those two
     * numbers.
     *
     * The program prints the English token `no` (or `yes`), and both prompts
     * name it, so a learner reading the Russian is not matching glyphs.
     *
     * Read by a teacher, like every trace: nothing here is graded 0/1.
     */
    id: "m5.as.b3",
    type: "verify",
    mode: "manual_trace",
    skillRefs: ["bsearch.core", "bsearch.boundary", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бұл бағдарламаны бұрын көрген жоқсың. Оны компьютерсіз, қағазда орында. Цикл денесі әр рет орындалғанда сол қадамдағы `left`, `right`, `mid` мәндерін жаз, қасына `a[mid]` нешеге тең екенін де қой. Содан кейін бағдарлама шығаратын екі жолды жаз: бірінші жолда ағылшынша `yes` немесе `no` деген сөз, екінші жолда екі сан. Соңында бір сөйлеммен жауап бер: цикл тоқтағанда `left` пен `right` қандай мәнде қалды және 20 саны тізімде болса, қай орында тұрар еді?",
      ru: "Эту программу ты раньше не видел. Выполни её на бумаге, без компьютера. Каждый раз, когда выполняется тело цикла, выписывай значения `left`, `right` и `mid` на этом шаге, а рядом — чему равно `a[mid]`. Затем запиши две строки, которые выведет программа: в первой строке английское слово `yes` или `no`, во второй — два числа. В конце одним предложением ответь: какими остались `left` и `right` после остановки цикла и на каком месте стояло бы число 20, если бы оно было в списке?",
    },
    code:
      "a = [3, 8, 12, 19, 25, 31, 40]\n" +
      "x = 20\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      'found = "no"\n' +
      "while left <= right:\n" +
      "    mid = (left + right) // 2\n" +
      "    if a[mid] == x:\n" +
      '        found = "yes"\n' +
      "        break\n" +
      "    if a[mid] < x:\n" +
      "        left = mid + 1\n" +
      "    else:\n" +
      "        right = mid - 1\n" +
      "print(found)\n" +
      "print(left, right)",
    expectedPoints: [
      {
        kk: "Цикл денесі үш рет орындалады: (left = 0, right = 6, mid = 3, a[mid] = 19), сосын (left = 4, right = 6, mid = 5, a[mid] = 31), сосын (left = 4, right = 4, mid = 4, a[mid] = 25).",
        ru: "Тело цикла выполняется три раза: (left = 0, right = 6, mid = 3, a[mid] = 19), затем (left = 4, right = 6, mid = 5, a[mid] = 31), затем (left = 4, right = 4, mid = 4, a[mid] = 25).",
      },
      {
        kk: "Әр салыстыру бірден бір топ орынды алып тастайды: 19 < 20 болғандықтан 0–3 орындары кетеді, 31 > 20 болғандықтан 5–6 кетеді, 25 > 20 болғандықтан 4-орын да кетеді. Содан кейін тексерілмеген бірде-бір орын қалмайды.",
        ru: "Каждое сравнение убирает сразу целую группу позиций: 19 < 20 — уходят позиции 0–3, 31 > 20 — уходят 5–6, 25 > 20 — уходит и позиция 4. После этого не остаётся ни одной непроверенной позиции.",
      },
      {
        kk: "Бағдарлама екі жол шығарады: алдымен `no`, содан кейін `4 3`.",
        ru: "Программа выводит две строки: сначала `no`, потом `4 3`.",
      },
      {
        kk: "Цикл `left = 4`, `right = 3` болғанда тоқтады: `left <= right` шарты бұзылды, яғни аралық бос қалды. Бұл 4-орын — 20 саны тізімде болса, дәл тұратын орны: оның сол жағында 19 (3-орын), оң жағында 25 (4-орын) тұр.",
        ru: "Цикл остановился при `left = 4`, `right = 3`: условие `left <= right` нарушилось, то есть интервал стал пустым. Позиция 4 — это ровно то место, где стояло бы число 20, если бы оно было в списке: слева от него 19 (позиция 3), справа 25 (позиция 4).",
      },
    ],
  },
  {
    /*
     * «Ауызша түсіндіру» (p.6), carrying the second half of January's own
     * sentence — «жауаптың неге жоғалып кетпейтінін сөзбен түсіндіреді» (p.9).
     *
     * Three questions and each answer is a different claim, none of which is
     * b2's. (1) is the one January is actually about: an empty interval looks
     * like failure and is in fact a proof — every position was ruled out by a
     * comparison that really happened. (2) is the question nobody can recite,
     * because only the learner knows what they submitted in b1, and it is where
     * the "must be a binary search" requirement is genuinely checked: a learner
     * who scanned the list linearly says so, and a learner who searched has to
     * name the two candidates and the two guards. (3) asks for the invariant as
     * a sentence — not the justification b2 collected, the statement itself.
     *
     * Settles as `unknown`. The teacher hears it and reads these points.
     */
    id: "m5.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["bsearch.core", "bsearch.boundary", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Мұғалімге ауызша түсіндір. (1) Үшінші тапсырмадағы бағдарламада цикл `left = 4`, `right = 3` болып тоқтады, ал 20 саны тізімде жоқ. Бос аралық жауаптың жоғалып кеткенін білдіре ме, әлде басқа нәрсені дәлелдей ме — 19 бен 25 осы жерде не айтып тұр? (2) Енді бірінші тапсырмада өзің жазған бағдарламаны ал: іздеу біткен соң жауапты таңдау үшін қандай сандарды салыстырдың және тізімнен шығып кетпейтініңе қалай көз жеткіздің? (3) Соңында бір сөйлеммен қорытындыла: іздеудің кез келген сәтінде `left` пен `right` туралы не рас болып қалады — жауап неге жоғалмайды?",
      ru: "Объясни учителю устно. (1) В программе из третьего задания цикл остановился при `left = 4`, `right = 3`, а числа 20 в списке нет. Пустой интервал означает, что ответ потерялся, или он доказывает что-то другое — о чём здесь говорят 19 и 25? (2) Теперь возьми программу, которую ты написал в первом задании: какие числа ты сравнивал после окончания поиска, чтобы выбрать ответ, и как ты убедился, что не выходишь за пределы списка? (3) В конце подведи итог одним предложением: что остаётся верным про `left` и `right` в любой момент поиска — почему ответ не теряется?",
    },
    expectedPoints: [
      {
        kk: "Бос аралық — жауаптың жоғалғаны емес, оның жоқтығының дәлелі. Үш салыстырудың әрқайсысы бір топ орынды шынымен тексеріп барып алып тастады, ал соңында тексерілмеген орын қалмады. Сондықтан `no` деген жауап тексерілмей айтылған болжам емес.",
        ru: "Пустой интервал — это не потерянный ответ, а доказательство отсутствия. Каждое из трёх сравнений действительно проверило и только после этого убрало целую группу позиций, а в конце непроверенных позиций не осталось. Поэтому ответ `no` — не догадка, а вывод.",
      },
      {
        kk: "19 (3-орын) мен 25 (4-орын) 20-ны қоршап тұр: 3-орынға дейінгінің бәрі 20-дан кіші, 4-орыннан бастап бәрі 20-дан үлкен, ал олардың арасында ешнәрсе жоқ. Сондықтан 20-ға ең жақын сан осы екеуінің біреуі ғана бола алады.",
        ru: "19 (позиция 3) и 25 (позиция 4) окружают 20: всё до позиции 3 меньше 20, всё начиная с позиции 4 больше 20, а между ними ничего нет. Поэтому ближайшим к 20 может быть только одно из этих двух чисел.",
      },
      {
        kk: "Өз бағдарламасы туралы: іздеу біткенде шекара `x`-тен кем емес бірінші санды көрсетеді, ал жауап не сол сан, не оның алдындағы сан. Оқушы екі шеткі жағдайды атайды: шекара тізімнің ұзындығына тең болса (`x` бәрінен үлкен), `a[left]` оқылмауы керек; шекара 0 болса (`x` бәрінен кіші), одан бұрынғы сан жоқ. Тізімді жай ғана бастан-аяқ қарап шыққан оқушы да соны ашық айтады — сонда әдіс туралы әңгіме нақты болады.",
        ru: "О собственной программе: когда поиск закончен, граница указывает на первое число, не меньшее `x`, а ответ — либо это число, либо стоящее перед ним. Ученик называет оба крайних случая: если граница равна длине списка (`x` больше всех), читать `a[left]` нельзя; если граница равна 0 (`x` меньше всех), числа перед ней не существует. Тот, кто просто прошёл список подряд, тоже говорит об этом прямо — тогда разговор о методе получается честным.",
      },
      {
        kk: "Инвариант бір сөйлеммен: іздеудің кез келген сәтінде жауап `left` пен `right` аралығының ішінде жатады, себебі одан тыс қалған әрбір орынды салыстыру нақты жоққа шығарған. Аралық қысқарады, бірақ ішіндегі жауап ешқашан сыртта қалмайды.",
        ru: "Инвариант одним предложением: в любой момент поиска ответ лежит внутри интервала от `left` до `right`, потому что каждая оставшаяся снаружи позиция была исключена конкретным сравнением. Интервал сокращается, но ответ внутри него наружу не выпадает.",
      },
    ],
  },
];
