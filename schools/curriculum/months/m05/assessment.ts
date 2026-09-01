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
 * a linear scan over the list answers b1 correctly and passes
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
 * one before it — so the program has to survive `left == n` (x above
 * everything), `left == 0` (x below everything), a one-element list, an
 * all-equal list, and a tie. Those are not extra cases bolted on to reach a
 * count; they are the problem.
 *
 * The degenerate programs, and the case that kills each — every one of them
 * executed, not argued:
 *
 *   prints `a[left]` and nothing else       → reads past the end on «4 9 15 / 100»
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
 * reaches for `<algorithm>` — least of all `lower_bound`, which would delete
 * the month.
 */
export const M5_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Бейтаныс есептер» (p.6), and the edge-case half of January's own
     * sentence (p.9). Blank editor, no starter — the input shape is a count and
     * then the numbers, which is the shape every task in `m5.l1`–`m5.l7` reads,
     * so a starter would only be removing the one part of the work that is not
     * being measured either way.
     *
     * Thirteen cases, twelve hidden. The visible one is a middle case on
     * purpose: it is enough to check the input format and it kills the two
     * shortcuts that need killing in public — the endpoints-only answer and the
     * exact-match search that gives up when `x` is absent — while telling the
     * learner nothing about where the boundaries end up.
     *
     * The reference is the half-open form (`right = n`, `while (left < right)`)
     * taught in `m5.l2` and `m5.l6`, because that is the form whose exit value
     * is a POSITION rather than a verdict, and this problem needs the position.
     * Its tail is where the marks are: `left` is the first index with
     * `a[left] >= x`, so the answer is `a[left]` or `a[left - 1]`, and both
     * reads have to be guarded before they happen. `x - a[left - 1] <= far`,
     * with `far` the distance from `best` written out by hand rather than taken
     * from `abs()` (the programme never teaches it), breaks a tie toward the
     * smaller number, which is what the prompt promises in both languages.
     */
    id: "m5.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["bsearch.core", "bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100 000), екінші жолда бос орынмен бөлінген, өспелі ретпен реттелген n бүтін сан (бірдей сандар кездесуі мүмкін, әрқайсысы модулі бойынша 10⁸-ден аспайды). Үшінші жолда бір бүтін сан `x` беріледі (|x| ≤ 10⁸). Тізімнен `x`-ке ең жақын санды тап: `x` пен сол санның айырмасының модулі ең кіші болуы керек. Сол санның өзін шығар, орнын емес. Егер `x`-ке бірдей жақын екі сан табылса (бірі одан кіші, бірі үлкен), кішісін шығар. `x` тізімде кездесуі де, мүлде болмауы да мүмкін. Кеңес: тізім реттелген, сондықтан аралықтың жартысын тастай отырып ізде — бірақ баға тек шыққан жауап бойынша қойылады, ал әдісіңді 4-тапсырмада мұғалімге өзің ауызша түсіндіресің.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100 000), во второй — n целых чисел через пробел, отсортированных по возрастанию (одинаковые числа встречаться могут, каждое по модулю не больше 10⁸). В третьей строке дано одно целое число `x` (|x| ≤ 10⁸). Найди в списке число, ближайшее к `x`: модуль разности между `x` и этим числом должен быть наименьшим. Выведи само это число, а не его позицию. Если одинаково близких чисел оказалось два (одно меньше `x`, другое больше), выведи меньшее. Число `x` может как встречаться в списке, так и отсутствовать в нём. Совет: список отсортирован, поэтому ищи, отбрасывая половину интервала, — но оценивается только полученный ответ, а свой метод ты сам объяснишь учителю вслух в задании 4.",
    },
    referenceSolution:
"#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid;\n        }\n    }\n    int best = a[0];\n    if (left < n) {\n        best = a[left];\n    }\n    if (left > 0) {\n        int far = best - x;\n        if (far < 0) {\n            far = -far;\n        }\n        if (x - a[left - 1] <= far) {\n            best = a[left - 1];\n        }\n    }\n    cout << best;\n    return 0;\n}",
    cases: [
      /* Four guard cases against three wrong programs that scored 14/14.
      
         The prompt says that on a tie the SMALLER number wins, and the only
         non-degenerate tie in the fourteen was `10 20` / `15` — a two-element
         list, where `mid = 0 + (1 - 0) / 2 = 0` necessarily lands on the
         smaller candidate first. So "keep the first equally-good candidate" and "keep
         the smaller" agreed there, and every program that breaks the tie
         INSIDE the search loop passed for free. A tie needs a list of three or
         more where `mid` reaches the larger candidate first.
      
         And nothing paired a negative x with a list straddling zero, so a
         program comparing |value| against |x| instead of |value − x| was never
         asked a question it could get wrong; the one negative case answered
         correctly by luck. Nothing put x above every element of an
         all-negative list either, which is where a `best = 0` sentinel shows. */
      { input: "3\n1 5 9\n3", expectedOutput: "1", hidden: true },
      { input: "4\n1 5 9 9\n7", expectedOutput: "5", hidden: true },
      { input: "2\n-5 1\n-2", expectedOutput: "-5", hidden: true },
      { input: "3\n-9 -5 -1\n100", expectedOutput: "-1", hidden: true },

      /* The only visible case. `x` sits between two numbers, nearer the right
         one — so «тек екі шетін салыстыру» answers 2 and an exact search that
         gives up on a miss answers -1. Both die in public, before a hidden case
         is ever reached. */
      { input: "5\n2 5 8 12 20\n11", expectedOutput: "12" },
      /* x below everything: the boundary never moves, left = 0, and a program
         that reaches for `a[left - 1]` reads the LAST element instead. */
      { input: "3\n4 9 15\n1", expectedOutput: "4", hidden: true },
      /* x above everything: the boundary walks off the end, left = n.
         `a[left]` is past the end of the vector and a scan that stops one short
         says 9. */
      { input: "3\n4 9 15\n100", expectedOutput: "15", hidden: true },
      /* x exactly ON the first element, and on the last. */
      { input: "3\n4 9 15\n4", expectedOutput: "4", hidden: true },
      { input: "3\n4 9 15\n15", expectedOutput: "15", hidden: true },
      /* One element, both ways: present, and far away. The loop body may run
         zero times and the answer still has to come out. */
      { input: "1\n7\n7", expectedOutput: "7", hidden: true },
      { input: "1\n7\n100", expectedOutput: "7", hidden: true },
      /* All equal — the halving finds nothing to distinguish, and both
         neighbours of the collapse point hold the same number. */
      { input: "4\n6 6 6 6\n2", expectedOutput: "6", hidden: true },
      { input: "4\n6 6 6 6\n6", expectedOutput: "6", hidden: true },
      /* The tie, and the whole reason the prompt states a rule for it:
         15 - 10 = 20 - 15, so the answer is the smaller number. */
      { input: "2\n10 20\n15", expectedOutput: "10", hidden: true },
      /* x absent with near neighbours on BOTH sides — once nearer the left
         neighbour, once nearer the right. A program that always prints the
         first number ≥ x passes the second and fails the first. */
      { input: "5\n1 5 9 14 20\n6", expectedOutput: "5", hidden: true },
      { input: "5\n1 5 9 14 20\n8", expectedOutput: "9", hidden: true },
      /* Repeats around the answer, and negatives: -5 is nearer -3 than -8. */
      { input: "5\n3 3 7 7 9\n7", expectedOutput: "7", hidden: true },
      { input: "3\n-8 -3 2\n-5", expectedOutput: "-3", hidden: true },
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
"#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {3, 8, 12, 19, 25, 31, 40};\n    int x = 20;\n    int n = (int)a.size();\n    int left = 0;\n    int right = n - 1;\n    int found = 0;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes\" << endl;\n    } else {\n        cout << \"no\" << endl;\n    }\n    cout << left << \" \" << right;\n    return 0;\n}",
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
      kk: "Мұғалімге ауызша түсіндір. (1) Бірінші тапсырмада өзің жазған бағдарламаны ал: іздеу біткен соң жауапты таңдау үшін қандай сандарды салыстырдың және тізімнен шығып кетпейтініңе қалай көз жеткіздің? (2) Содан кейін бір сөйлеммен қорытындыла: іздеудің кез келген сәтінде `left` пен `right` туралы не рас болып қалады — жауап неге жоғалмайды?",
      ru: "Объясни учителю устно. (1) Возьми программу, которую ты написал в первом задании: какие числа ты сравнивал после окончания поиска, чтобы выбрать ответ, и как ты убедился, что не выходишь за пределы списка? (2) Затем подведи итог одним предложением: что остаётся верным про `left` и `right` в любой момент поиска — почему ответ не теряется?",
    },
    expectedPoints: [
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
