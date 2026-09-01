import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша — the monthly check. Twenty minutes. PDF p.8.
 *
 * November's «Айлық сынақ» sentence is two sentences, and both are commands:
 *
 *   > Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу, әр
 *   > функцияның міндетін және параметр мен return байланысын түсіндіру.
 *   > Қосымша сұрақта жергілікті және жаһандық айнымалының қай жерде
 *   > қолжетімді екенін көрсетіп, жаһандық айнымалыны қолданудың бір тәуекелін
 *   > атайды.
 *
 * Three things are named, so the check is three blocks and the contract says
 * which is which: one of them is the coding task and the other two are short.
 * Write a program of at least two or three functions alone (`unseen_problem`);
 * say what a function takes and gives back (`explain`); then the additional
 * question, whose two halves — SHOW where a local and a global are visible, and
 * NAME one risk of a global — are one question in the PDF and are one block
 * here (`oral_explanation`, with the program on the card).
 *
 * ## Why there is no fourth graded task, and what used to be one
 *
 * This file shipped with four, and the arithmetic in this very header claimed
 * they summed to eighteen minutes: «the unseen problem is ~11, the written
 * contract answer ~4, the paper trace ~3, and the oral piece runs alongside».
 * Two of those four terms were fiction. The written block asked three things
 * «әр функцияң үшін» over a three-function program plus two essay questions —
 * eleven answers, not one four-minute answer — and the paper trace asked four
 * numbered questions. Twenty-four separate written or spoken responses were
 * booked at seven minutes because nobody added them up.
 *
 * `validate.ts` now adds them up, and it rated this check at 34 against a
 * stated 20. It rates the three blocks below at exactly 20. The cut is not a
 * trim of the estimator's inputs: the questions that went are the ones that
 * asked for the same fact three times over three functions, and the marking
 * points went with them rather than leaving a teacher scoring answers nobody
 * was asked for. October made the same cut one commit earlier and left the
 * same hole in its numbering — `m2.as.b3` is gone there, `m3.as.b3` is gone
 * here, and in both cases the surviving idea moved into the oral block.
 *
 * What is NOT lost: every one of the PDF's three commands still has a block,
 * and the paper trace's program is still on screen. It is now read aloud
 * against the teacher rather than written out, which is «көрсету» either way
 * and is the mode p.6 names.
 *
 * ## Why counting primes, when the month has already written eight functions
 *
 * The check has to be unseen, and November's authored tasks have taken most of
 * the obvious ground: `digit_sum` in l3 and again in l5, `largest`/`smallest`
 * in l8, `is_palindrome` and `only_even` in l8, `count_vowels` + `best_word` in
 * l8's advanced block.
 *
 * KNOWN DEFECT, recorded rather than quietly left: the October/November review
 * confirmed that this list omits `m3.p10`, the advanced-only practice rung that
 * sits immediately before this check and asks for `is_prime` plus a function
 * that calls it. For the advanced route the predicate here is not unseen — it
 * is p10's `is_prime` with `while` swapped for `for`. Fixing it means either a
 * different predicate here or a different task at p10, which is a decision
 * across two files and was not this pass's assignment. Everything below is
 * written so it survives that change: the defect is in WHICH property is
 * tested, not in the shape, the cases or the output contract.
 *
 * What is genuinely new here is the SHAPE. One predicate over a single number,
 * and then TWO different list functions that both call it and return two
 * different KINDS of thing — a count, and a position. That is the first time
 * this month a learner has to notice that `first_prime_pos` returning 0 is not
 * "zero primes" but "no answer", and that the two functions differ in their
 * contract, not in their loop. It is exactly what b2 then asks them to write
 * down, so the two blocks are one question asked twice, once in code and once
 * in words.
 *
 * `<algorithm>` does not arrive until December, which costs this problem
 * nothing: none of the three functions wants it.
 *
 * ## The input carries its own length
 *
 * Every list in November states `n` first and then `n` values, because C++ has
 * no equivalent of `input().split()` inside this month's vocabulary — see
 * `m3.l8`'s header for the argument. The check follows the month rather than
 * inventing a format the learner has never met.
 *
 * ## One line of output, and why an assessment gets `exact` here
 *
 * `VerifyBlock.checker` carries a warning against `exact` in a monthly check,
 * and it is a good warning: the cases are hidden, so a learner marked wrong on
 * a space cannot find out why. It is overridden here for one reason, and the
 * reason is not formatting.
 *
 * This block used to ask for the count and the position on two lines under the
 * default `token` checker. Under that contract a program whose functions print
 * their own answer instead of returning it — the exact thing the prompt
 * forbids, and the thing November exists to teach — produces byte-identical
 * output to the reference and passes all eight cases. So does a flat program
 * with no functions at all.
 *
 * Putting the two numbers on ONE line makes the main program combine two
 * returned values, which is the mechanism `m3.p8` and `m3.l3.b9` already use.
 * A printing pair emits `2\n2` where the answer is `2 2`, and `exact` is what
 * sees the difference — `token` throws the line break away. So the layout is
 * not decoration here; it is the only lever output comparison has on the
 * month's central rule, and the visible sample shows the exact bytes.
 *
 * C++ adds a second, blunter lever the Python version did not have: a helper
 * declared `void` cannot be fed to `cout` at all, so the most common form of
 * "my function printed it itself" is a compile error before any case runs. The
 * `exact` checker still earns its place — a helper that returns AND prints
 * compiles perfectly, and only the line break catches it.
 *
 * The other half of the requirement — that there be two or three functions at
 * all — no checker can see, and the prompt says so out loud instead of implying
 * a machine is watching. That is the contract's third option: send it to a
 * human. b2 is that human, and it asks about the learner's own program, which
 * is why it cannot be recited.
 *
 * ## The scope question carries its program
 *
 * b4 has a `code` field. `m1.as.b3` shipped without one and rendered as a
 * prompt about "this program" above an empty box, which is why the validator
 * refuses `manual_trace` and `find_bug` without it — and why the program stayed
 * on the card when the trace merged into the oral question.
 *
 * The program never writes to the namespace-scope variable, and that is the
 * honest way to ask the PDF's question. «Қай жерде қолжетімді екенін көрсету»
 * is about VISIBILITY: a parameter named `score` that shadows a namespace-scope
 * `score`, a local `bonus` that does not exist outside the call, and a second
 * function that reads the outer name because it has no local one. All three
 * facts are readable off eight lines. Mutating shared state belongs to
 * `m3.l5`, where the programme asks for «неге global күтпеген нәтиже берді?» to
 * be analysed as a failure — and a reference program in an assessment is not
 * the place to model a technique the month spends a lesson warning about.
 *
 * The marking points say one thing the Python version got backwards, and it is
 * the month's own C++ divergence: writing `score = ...` inside `report` would
 * NOT create a local, it would change the outer variable, because C++ needs no
 * keyword for that. Only a declaration — `int score = ...;` — makes a new box.
 * That is precisely why m3.l5 exists.
 *
 * The output is 8 / 7 / 7, which is the whole trap: the learner who thinks
 * `step` "changed score" says 8 / 8 / 8 and finds out in front of a teacher
 * rather than in a contest.
 *
 * ## Provenance and tracks
 *
 * September's convention, kept: `verify` blocks implement the five general
 * verification methods of p.6 and cite page 6; the `explain` block asks
 * November's own question in November's own words and cites page 8.
 *
 * Two of the five p.6 methods are carried here and not three, and that is a
 * loss taken on purpose. The third was `manual_trace`, and it was this file's
 * own idea of how to render «көрсету» — November's «Айлық сынақ» paragraph does
 * not name a paper trace, and the authoring plan is explicit that the month's
 * own paragraph decides which methods a check carries. Trading the mode for the
 * sentence's own second command — explain what each function takes and gives
 * back — is what the sentence asks for. December's check, cut in the same
 * review pass, ended at the same two modes.
 *
 * No block carries `tracks`. The monthly check is the same twenty minutes for
 * every route — differentiation is in how the month was taught and how early
 * help opened, not in whether a learner is assessed. Advanced's compulsory
 * written defence («шешімді жазбаша қорғау міндетті») is satisfied by the
 * month's lessons, which carry advanced-only blocks; b2 is written work for
 * everyone and is not a substitute for it.
 *
 * Nothing here is machine-scored except b1's cases. b2 and b4 settle as
 * `unknown` and are read by a teacher against the points on the block.
 */
export const M3_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу» — blank
     * editor, no starter.
     *
     * The prompt states the function requirement, because the programme states
     * it, and then states who checks it. It used to say «Функциялар экранға
     * ештеңе шығармайды … `input()` пен `print()` тек негізгі бағдарламада
     * болады» and stop there, next to eight cases that could not see either
     * clause: a flat program passed 8/8, and so did one whose functions
     * printed. A rule a fourteen-year-old is told they must follow, on a card
     * that then marks them correct for ignoring it, teaches that the rule was
     * decoration.
     *
     * So the requirement is split into the part a machine can judge and the
     * part it cannot, and each is attributed. The one-line answer makes
     * `return` graded — a function that prints its own number puts the answer
     * on two lines and fails, on the visible sample, before submission. The
     * split into functions is marked by a teacher off b2, which asks about the
     * program the learner actually wrote, and the prompt says so rather than
     * letting the silence imply a judge.
     *
     * The reference is written the way a learner is expected to write it, not
     * the way an adult would: `is_prime` returns 1 or 0 rather than a `bool`,
     * because `if (is_prime(x) == 1)` is the form l8 established and `bool` is
     * not a November idea. `d * d <= n` would be faster and is accepted by
     * every case; the plain loop to `n` is what is defended here, because the
     * numbers stop at 1000 and the simpler loop is the one whose empty body at
     * n = 2 the learner can reason about.
     *
     * Two list functions and not one on purpose. They share the predicate and
     * differ in everything else — what they accumulate, what they return, and
     * what they return when nothing matches — which is the distinction b2 is
     * about.
     */
    id: "m3.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 50) — сандар саны. Екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысы 1-ден 1000-ға дейін.\n" +
        "Жауапты БІР жолға шығар: алдымен тізімдегі жай сандардың саны, содан кейін бос орын арқылы бірінші жай санның орны. Орындар бірден нөмірленеді; тізімде бірде-бір жай сан болмаса, орынның орнына 0 шығар.\n" +
        "Бағдарламаңды кемінде 2-3 функцияға бөл: біреуі бір ғана санның жай екенін тексерсін, қалғандары тізімді аралап сол функцияны шақырсын — жай санды тексеру логикасы бір жерде ғана жазылады. Функциялар `main`-нен жоғары жазылады.\n" +
        "Функциялар экранға ештеңе шығармайды: жауапты `return` арқылы қайтарады, ал жалғыз `cout` — `main`-дегі сол бір жол. Функцияң өз санын өзі басып шығарса, жауап екі жолға түсіп кетеді де, тексеруден өтпейді.\n" +
        "Ал функцияларға дұрыс бөлгеніңді машина емес, мұғалім тексереді: ол туралы келесі тапсырмада жазасың.\n" +
        "Есіңде болсын: 1 жай сан емес, ең кіші жай сан — 2.\n" +
        "n = 5 және сандар `4 7 9 11 12` болса, жауап бір жол: `2 2`.",
      ru:
        "В первой строке дано n (1 ≤ n ≤ 50) — количество чисел. Во второй строке через пробел даны n целых чисел, каждое от 1 до 1000.\n" +
        "Ответ выведи в ОДНУ строку: сначала количество простых чисел в списке, затем через пробел позицию первого простого числа. Позиции нумеруются с единицы; если простых чисел в списке нет, вместо позиции выведи 0.\n" +
        "Раздели программу минимум на 2–3 функции: одна проверяет, простое ли отдельное число, остальные проходят по списку и вызывают её — логика проверки на простоту записана только в одном месте. Функции пишутся выше `main`.\n" +
        "Функции ничего не печатают: они возвращают ответ через `return`, а единственный `cout` — та самая строка в `main`. Если функция напечатает своё число сама, ответ окажется на двух строках и проверку не пройдёт.\n" +
        "А то, верно ли ты разделил программу на функции, проверяет не машина, а учитель: об этом ты напишешь в следующем задании.\n" +
        "Помни: 1 не является простым числом, наименьшее простое число — 2.\n" +
        "При n = 5 и числах `4 7 9 11 12` ответ — одна строка: `2 2`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int is_prime(int n) {\n" +
      "    if (n < 2) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    for (int d = 2; d < n; d++) {\n" +
      "        if (n % d == 0) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "int count_primes(vector<int> a) {\n" +
      "    int c = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (is_prime(x) == 1) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int first_prime_pos(vector<int> a) {\n" +
      "    int n = a.size();\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (is_prime(a[i]) == 1) {\n" +
      "            return i + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      '    cout << count_primes(a) << " " << first_prime_pos(a) << endl;\n' +
      "    return 0;\n" +
      "}",
    /* The layout IS the answer, and the file header argues why an assessment
       is allowed to say so here: one line is what separates a function that
       returns from a function that prints, and `token` cannot see it. */
    checker: { kind: "exact" },
    cases: [
      /* The visible sample, and it is doing real work. 4 is at position 1, so a
         divisor loop that stops at `n / 2` calls it prime and answers `3 1`
         here rather than on a hidden case. The first prime is in the middle, so
         "last prime" answers 4 and "print the index" answers 1. Three mutants
         die before the learner ever submits, and a fourth — functions that
         print — dies on the line break. */
      { input: "5\n4 7 9 11 12", expectedOutput: "2 2" },
      /* One element, and it is the smallest prime: the divisor loop never
         turns, so the function returns 1 without executing its body. */
      { input: "1\n2", expectedOutput: "1 1", hidden: true },
      /* One element, and it is 1. Kills a missing `n < 2` guard, and is the
         shortest input on which "no prime found" has to produce 0 rather than
         fall off the end of the function — which in C++ is not a printed word
         but undefined behaviour, so the guard matters more here than it did. */
      { input: "1\n1", expectedOutput: "0 0", hidden: true },
      /* All equal, all prime: a `return` placed inside the counting loop
         answers `1 1` instead of `3 1`. */
      { input: "3\n5 5 5", expectedOutput: "3 1", hidden: true },
      /* All equal, none prime. 9 = 3 × 3, so "odd means prime" answers `4 1`
         instead of `0 0`, and this is the second witness for the missing-return
         path on the position function. */
      { input: "4\n9 9 9 9", expectedOutput: "0 0", hidden: true },
      /* The answer is at the last position: a traversal over `i < n - 1`
         reports 0. */
      { input: "4\n8 9 10 11", expectedOutput: "1 4", hidden: true },
      /* 1 sits in front of two primes. Counting 1 as prime answers `3 1`; the
         correct answer needs the guard AND the position of a prime that is not
         the first element. */
      { input: "4\n1 2 3 4", expectedOutput: "2 2", hidden: true },
      /* The top of the stated range, both ways: 997 is prime, 1000 is not.
         Also the only case that runs the divisor loop to any depth. */
      { input: "2\n997 1000", expectedOutput: "1 1", hidden: true },
    ],
  },
  {
    /*
     * «Әр функцияның міндетін және параметр мен return байланысын түсіндіру»,
     * from p.8, asked about the learner's OWN program — the only way the answer
     * can be theirs rather than recalled from l6.
     *
     * It asked five numbered things, and (1)(2)(3) were asked «әр функцияң
     * үшін», which against a three-function reference is nine answers plus two
     * essays. Eleven written answers is not the short half of a twenty-minute
     * check; it is a second coding task made of prose.
     *
     * Two questions now, and they still reach all three functions. (1) is the
     * parameter-and-return contract of the predicate — one function, one
     * sentence, which is the same evidence nine repetitions were buying, and in
     * C++ it now also asks for the declared TYPES, which are written on the
     * first line of the function and are what the contract actually is. (2) is
     * the one that cannot be answered by naming types: the two list functions
     * take the SAME parameter and call the SAME predicate on every element, and
     * still mean different things by the number they hand back. A learner who
     * has not noticed that says "both return an `int`" and is visibly stuck.
     *
     * The question that went — «жай санды тексеруді бөлек функцияға шығарудың
     * пайдасы неде?» — is a good question and it is not a check question: it is
     * about maintenance, it can be answered from l6 without having written
     * anything, and it belongs in a lesson. Its marking point went with it,
     * because a criterion with no question is a teacher scoring silence.
     *
     * Written, stored, read by a teacher. `explain` settles as `unknown` and
     * nothing about it is graded 0/1.
     */
    id: "m3.as.b2",
    type: "explain",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бірінші тапсырмада өзің жазған бағдарлама туралы жаз.\n" +
        "(1) Жай санды тексеретін функцияң қандай түрдегі қандай параметр қабылдайды, қандай түрдегі нені `return` арқылы қайтарады және оның міндеті не? Бір сөйлеммен жаз.\n" +
        "(2) Тізімді өңдейтін екі функцияң бір-бірінен несімен ерекшеленеді — олар қайтаратын сандар нені білдіреді?",
      ru:
        "Напиши про программу, которую ты написал в первом задании.\n" +
        "(1) Какой параметр и какого типа принимает твоя функция проверки на простоту, что и какого типа она возвращает через `return` и в чём её задача? Ответь одним предложением.\n" +
        "(2) Чем отличаются друг от друга две твои функции, обрабатывающие список, — что означают возвращаемые ими числа?",
    },
    expectedPoints: [
      {
        kk: "Жай санды тексеретін функция бір бүтін санды (`int`) параметр ретінде қабылдайды және сол сан туралы жауапты — 1 немесе 0 — `int` түрінде қайтарады. Оның міндеті бір ғана нәрсе: бір санның қасиетін анықтау. Ол тізім туралы да, экран туралы да ештеңе білмейді, сондықтан оның түрі `void` емес.",
        ru: "Функция проверки простоты принимает параметром одно целое число (`int`) и возвращает ответ про это число — 1 или 0 — типа `int`. Её задача ровно одна: определить свойство одного числа. Она ничего не знает ни про список, ни про экран, поэтому её тип не `void`.",
      },
      {
        kk: "Екі функцияның да параметрі — бүкіл тізім (`vector<int>`), екеуі де жай санды өзі тексермейді, әр элемент үшін бірінші функцияны шақырады. Айырмашылығы — қайтаратын санның мағынасында: санағыш жай сандардың САНЫН қайтарады, ал екіншісі ОРЫНДЫ қайтарады. Сондықтан олардың нөлі де әртүрлі: санағыштың 0-і «жай сан жоқ» дегенді, ал орынды табатын функцияның 0-і «жауап жоқ» дегенді білдіреді — нағыз орындар 1-ден басталады, сондықтан 0 ешқандай элементті көрсетпейді.",
        ru: "У обеих функций параметр — весь список (`vector<int>`), и ни одна из них не проверяет простоту сама: для каждого элемента она вызывает первую функцию. Отличаются они смыслом возвращаемого числа: считающая возвращает КОЛИЧЕСТВО простых чисел, а вторая — ПОЗИЦИЮ. Поэтому и ноль у них разный: у счётчика 0 означает «простых чисел нет», а у функции поиска 0 означает «ответа нет» — настоящие позиции начинаются с единицы, поэтому 0 не указывает ни на один элемент.",
      },
    ],
  },
  {
    /*
     * «Қосымша сұрақ» — the whole of it, in one block, because in the PDF it is
     * one question: «жергілікті және жаһандық айнымалының қай жерде қолжетімді
     * екенін КӨРСЕТІП, жаһандық айнымалыны қолданудың бір тәуекелін АТАЙДЫ».
     * One sentence, one conjunction, two halves.
     *
     * It used to be two graded blocks. The paper trace at `m3.as.b3` asked four
     * numbered questions and this block asked three more out loud, on ground
     * the trace had already covered in writing. Ten written answers followed by
     * three spoken ones is not the additional question; it is an interview.
     *
     * So the program stays on the card and the showing happens against it,
     * aloud. Nothing about visibility is lost: the three printed values are
     * still the evidence, and a learner who says 8 / 8 / 8 has said the wrong
     * thing to a teacher who is standing there, which is faster and kinder than
     * discovering it from a mark. What is gone is asking the same fact twice in
     * two modes.
     *
     * The variable is `score` and not `count`, which is not a style choice: with
     * `using namespace std;` in force, an unqualified `count` at namespace scope
     * collides with `std::count` and the program stops compiling on the first
     * standard library that makes it visible. The card has to build on both
     * engines.
     *
     * The marking points cover the answers a Grade 9 can genuinely give, and
     * the second half's are the ones `m3.l5` sets up. Settles as `unknown`.
     */
    id: "m3.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["scope.local_global", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Мұғалімге ауызша жауап бер — экрандағы бағдарламаға қарап көрсет.\n" +
        "(1) Бағдарлама үш жол шығарады: қандай сандар және неге? Жауабыңда мынаны көрсет: `step` ішіндегі `score` пен файлдың басындағы `score` — бір айнымалы ма, әлде екі бөлек айнымалы ма, және `bonus` қай жерде ғана бар.\n" +
        "(2) Функция деректі параметр арқылы емес, осындай жаһандық айнымалы арқылы алса, бұның бір нақты тәуекелін ата; сол тәуекел іске асқанда бағдарламада не бұзылатынын мысалмен айт.",
      ru:
        "Ответь учителю устно, глядя на программу на экране.\n" +
        "(1) Программа выведет три строки: какие это числа и почему? В ответе покажи: `score` внутри `step` и `score` в начале файла — это одна переменная или две разных, и где именно существует `bonus`.\n" +
        "(2) Назови один конкретный риск того, что функция получает данные не через параметр, а через такую глобальную переменную; на примере скажи, что именно сломается в программе, если этот риск сработает.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int score = 7;\n" +
      "\n" +
      "int step(int score) {\n" +
      "    int bonus = 1;\n" +
      "    score = score + bonus;\n" +
      "    return score;\n" +
      "}\n" +
      "\n" +
      "void report() {\n" +
      "    cout << score << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << step(score) << endl;\n" +
      "    report();\n" +
      "    cout << score << endl;\n" +
      "    return 0;\n" +
      "}",
    expectedPoints: [
      {
        kk: "Үш жол дұрыс аталған: 8, содан кейін 7, содан кейін тағы 7. `step` ішіндегі `score` — параметр, яғни шақыру кезінде пайда болатын жаңа жергілікті айнымалы, ол сырттағы `score`-ды уақытша жауып тұрады; оған 8 меншіктелгенде тек сол көшірме өзгереді, файлдың басындағы `score` 7 күйінде қалады. Аты бірдей екі айнымалы — бір айнымалы емес.",
        ru: "Три строки названы верно: 8, затем 7, затем снова 7. `score` внутри `step` — это параметр, то есть новая локальная переменная, возникающая при вызове и временно закрывающая собой внешнюю; присваивание ей значения 8 меняет только эту копию, а `score` из начала файла остаётся равным 7. Две переменные с одинаковым именем — это не одна переменная.",
      },
      {
        kk: "`bonus` тек `step` жұмыс істеп тұрғанда және тек соның `{ }` жақшаларының ішінде бар — функция аяқталған соң ол жойылады. Ал `report` ішінде `score` деген жергілікті айнымалы жарияланбаған, сондықтан ол файлдың басындағысын оқиды. C++-та мұнда бір нәрсені шатастыруға болмайды: `report` ішінде `score = 100;` деп жазса, ол ЖАҢА айнымалы жасамайды, сырттағының өзін өзгертеді — жаңа қорап тек `int score = 100;` деп ЖАРИЯЛАҒАНДА ғана пайда болады.",
        ru: "`bonus` существует только во время работы `step` и только внутри её скобок `{ }` — после выхода из функции переменная исчезает. А внутри `report` локальная переменная `score` не объявлена, поэтому она читает ту, что в начале файла. И здесь в C++ нельзя ошибиться: если внутри `report` написать `score = 100;`, это НЕ создаст новую переменную, а изменит внешнюю — новая ячейка появляется только при ОБЪЯВЛЕНИИ `int score = 100;`.",
      },
      {
        kk: "Нақты тәуекел аталған: жаһандық айнымалыға сүйенген функцияның нәтижесі оның параметрлеріне ғана емес, оған дейін не орындалғанына да байланысты болады. Бірдей шақыру бағдарламаның әр жерінде әртүрлі жауап беруі мүмкін, сондықтан оны жеке сынап көру де қиын. C++-та бұл әсіресе қауіпті: сырттағы айнымалыны өзгерту үшін ешқандай ерекше сөз жазылмайды, сондықтан кодқа қарап оны бірден байқау мүмкін емес.",
        ru: "Назван конкретный риск: результат функции, опирающейся на глобальную переменную, зависит не только от её параметров, но и от того, что выполнялось до неё. Один и тот же вызов в разных местах программы может дать разный ответ, поэтому и испытать такую функцию отдельно трудно. В C++ это особенно опасно: чтобы изменить внешнюю переменную, не нужно никакого особого слова, поэтому по коду это не бросается в глаза.",
      },
      {
        kk: "Нақты мысал келтірілген. Мысалы, жинақтаушы жаһандық айнымалыда сақталып, шақырудан кейін нөлге қайтарылмаса: бірінші шақыру дұрыс қосындыны береді, ал екінші шақыру оның үстіне қосып, қате жауап шығарады. Қате екінші рет қана көрінеді, сондықтан оны табу қиын.",
        ru: "Приведён конкретный пример. Скажем, накопитель хранится в глобальной переменной и после вызова не обнуляется: первый вызов даёт верную сумму, а второй прибавляет к ней и выдаёт неверный ответ. Ошибка проявляется только со второго раза, поэтому её трудно найти.",
      },
    ],
  },
];
