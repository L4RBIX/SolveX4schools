import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша · Lesson 3 — «return» / «return». 8 min.
 *
 * PDF p.8 names the mechanism in November's mastery paragraph — «параметр беру
 * және return арқылы нәтиже қайтару» — and then says what the platform owes the
 * learner about it: «Платформа функция шақырылғанда қандай параметр мәндері
 * кіретінін, қандай жергілікті айнымалылар пайда болатынын және **return
 * кезінде не қайтатынын** визуалды көрсетеді». This lesson is the one that
 * answers the third clause, and the practice family it owns is the first item
 * of November's list: «цифрлар қосындысын функциямен есептеу».
 *
 * ## The one idea
 *
 * `print` puts a value on the screen and hands nothing back. `return` hands the
 * value to whoever called the function. Only the second one can be used in an
 * expression — added, compared, fed back into the same function.
 *
 * That sentence is not hard to say and it is very hard to believe, because
 * October's programs ended in `print` and nothing went wrong. So the lesson
 * makes the belief cost something four times before anyone writes a function:
 * b3 makes the learner watch Python print `None`, b4 asks which of three
 * functions can have 1 added to its result, b5 shows the failure inside a
 * digit-sum function they already know, and b6 shows a function that returns
 * before the loop it needs has run at all.
 *
 * ## Why `None` is met here, deliberately, once
 *
 * A beginner who writes `print` inside a function and then assigns the call to
 * a variable meets `None` on their own, in a task they were trying to solve,
 * with no idea what the word means. Meeting it first in a four-line prediction
 * whose only job is that word turns the later encounter into recognition
 * instead of panic. `None` never appears in a snippet's SOURCE anywhere in this
 * lesson — it is only ever something Python prints — because the November
 * construct budget has not taught the literal and does not need to.
 *
 * ## The digit sum, four times, never twice the same way
 *
 * The lesson repeats one function on purpose — the PDF assigns it here — but
 * every appearance asks something the previous one did not: b2 puts two calls
 * in one expression, b5 breaks the return, b8 feeds the returned value back
 * into the same function until one digit is left, b9 puts it in a comparison.
 * b6 and b7 deliberately use different functions (a running total, a digit
 * COUNT) so that the two repair blocks are not one bug read twice.
 *
 * ## Left for later
 *
 * Nothing here says why `s` starts from 0 again on the second call — that is
 * `m3.l4`, and step 2 of the worked example states the fact without claiming to
 * explain it. `global` does not appear; the month's only sight of it is `m3.l5`.
 */

const P = 8; // PDF page for all of November

export const M3_L3: LessonBlock[] = [
  {
    id: "m3.l3.b1",
    type: "concept",
    skillRefs: ["func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "return — нәтижені қайтарады, print — экранға жазады",
      ru: "return — возвращает результат, print — пишет на экран",
    },
    /* The body has to make the difference OPERATIONAL, not verbal: "hands the
       value back" means nothing until the learner sees that one of the two
       calls below can have `+ 1` written after it and the other cannot. So the
       snippet defines both functions over the same arithmetic and the last
       line is the test. */
    body: {
      kk: "`print` мәнді экранға жазады және оны ешкімге бермейді: жазылып болған соң мән жоғалады. `return` басқаша істейді — мәнді функцияны ШАҚЫРҒАН жерге қайтарады. Сол жерде оны айнымалыға сақтауға, басқа санмен қосуға, салыстыруға болады. Демек айырмашылық сөзде емес: төмендегі `double(5)` шақыруының жанына `+ 1` жазуға болады, ал `show_double(5)` шақыруының жанына жазуға болмайды, өйткені ол ешқандай сан қайтармайды.",
      ru: "`print` пишет значение на экран и никому его не отдаёт: после вывода значение пропадает. `return` поступает иначе — он возвращает значение туда, где функцию ВЫЗВАЛИ. Там его можно сохранить в переменную, прибавить к другому числу, сравнить. Значит, разница не в словах: к вызову `double(5)` ниже можно приписать `+ 1`, а к вызову `show_double(5)` приписать нельзя, потому что он не возвращает никакого числа.",
    },
    code:
      "def show_double(x):\n" +
      "    print(x * 2)\n" +
      "\n" +
      "def double(x):\n" +
      "    return x * 2\n" +
      "\n" +
      "show_double(5)\n" +
      "print(double(5) + 1)\n" +
      "\n" +
      "# 10\n" +
      "# 11",
  },
  {
    /*
     * WORKED EXAMPLE #3 of the month's six (PDF p.8: «алты толық талданған
     * мысал»), and the November practice family «цифрлар қосындысын функциямен
     * есептеу».
     *
     * October already wrote this loop, twice — so the reasoning steps below
     * spend no time on `% 10` and `// 10` and all of their time on the three
     * decisions that are new: the result leaves through `return`, `return` is
     * the last thing the function does, and one expression may contain two
     * calls whose local variables never meet.
     *
     * Step 2's Russian introduced `s` as a «накопитель», called it a
     * «переменная» in the very next clause, and then referred back to it as
     * «он». Two nouns for one thing, of two different genders, and a pronoun
     * that agrees with the one further away — so the reader of a sentence whose
     * entire job is «this name belongs to the function and to nothing else»
     * first has to work out which name is being talked about. The Kazakh could
     * not have the fault and does not: it has no gender and simply drops the
     * subject («жоғалады»). The Russian now names the variable where the
     * pronoun stood, and the «она» that is left has «переменная» directly in
     * front of it with no masculine noun in between, so there is nothing to
     * resolve. Same claim, same two calls, same promise that l4 explains why.
     */
    id: "m3.l3.b2",
    type: "worked_example",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: цифрлар қосындысы — функция түрінде",
      ru: "Разобранный пример: сумма цифр как функция",
    },
    problem: {
      kk: "Бір жолда екі бүтін сан a және b беріледі (0 ≤ a, b ≤ 1 000 000 000). Олардың цифрлар қосындыларын өзара қосып, бір сан шығар. Мысалы, «407 23» берілсе, 11 + 5 = 16, жауап 16.",
      ru: "В одной строке даны два целых числа a и b (0 ≤ a, b ≤ 1 000 000 000). Сложи их суммы цифр между собой и выведи одно число. Например, для «407 23» получаем 11 + 5 = 16, ответ 16.",
    },
    steps: [
      {
        kk: "Цифрларды бір-бірлеп қосу циклін қазанда жазғанбыз. Мұндағы жаңа нәрсе — сол циклді екі рет көшіріп жазбау: бір рет функция етіп жазып, екі рет шақырамыз.",
        ru: "Цикл, который складывает цифры по одной, мы писали в октябре. Новое здесь другое — не переписывать этот цикл дважды: пишем его один раз как функцию и вызываем два раза.",
      },
      {
        kk: "Функцияның ішінде `s` жинақтаушысы бар. Ол — функцияның өз айнымалысы: `digit_sum(a)` аяқталған соң жоғалады, ал `digit_sum(b)` шақырылғанда `s` қайтадан 0-ден басталады. Сондықтан екі шақыру бір-біріне кедергі жасамайды. Мұның НЕГЕ солай екенін келесі сабақта талдаймыз.",
        ru: "Внутри функции есть накопитель `s`. Это её собственная переменная: после завершения `digit_sum(a)` переменная `s` исчезает, а при вызове `digit_sum(b)` она снова начинается с 0. Поэтому два вызова не мешают друг другу. ПОЧЕМУ это так — разберём на следующем уроке.",
      },
      {
        kk: "Циклден кейін `print(s)` жазсақ, сан экранға кетеді де, қосатын ештеңе қалмайды. Сондықтан `return s` жазамыз: сан функцияны шақырған жерге барады.",
        ru: "Если после цикла написать `print(s)`, число уйдёт на экран и складывать будет нечего. Поэтому пишем `return s`: число уходит туда, откуда функцию вызвали.",
      },
      {
        kk: "`return` — функцияның соңғы қадамы. Ол орындалған сәтте функция бірден тоқтайды, сондықтан `return`-ды цикл БІТКЕННЕН КЕЙІН жазамыз. Циклдің ішіне жазсақ, ол бірінші цифрдан кейін-ақ тоқтап қалады.",
        ru: "`return` — последний шаг функции. В момент его выполнения функция сразу останавливается, поэтому пишем `return` ПОСЛЕ того, как цикл закончился. Если написать его внутри цикла, функция остановится уже после первой цифры.",
      },
      {
        kk: "Соңғы жол екі шақыруды бір өрнекке қояды: `digit_sum(a) + digit_sum(b)`. Алдымен сол жақтағы шақыру орындалып 11 қайтарады, содан кейін оң жақтағысы орындалып 5 қайтарады, сосын осы екі сан қосылады. `print` бір-ақ рет, дайын нәтижеге жазылады.",
        ru: "Последняя строка ставит два вызова в одно выражение: `digit_sum(a) + digit_sum(b)`. Сначала выполняется левый вызов и возвращает 11, потом правый и возвращает 5, и уже эти два числа складываются. `print` пишется один раз — для готового результата.",
      },
    ],
    code:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "print(digit_sum(a) + digit_sum(b))",
    result: {
      kk: "«407 23» енгізгенде: 16",
      ru: "При вводе «407 23»: 16",
    },
  },
  {
    /*
     * The `None` block. Two lines of output where the learner expects one, and
     * the second line is a word they have never seen — which is exactly the
     * experience they would otherwise have alone, in a task they cared about.
     *
     * Only "25\n25" carries a mapping. "25" alone is left unmapped: it comes
     * from believing the assignment produces nothing AND from believing
     * `print(r)` prints nothing, and those are different beliefs. "None" alone
     * is unmapped for the same reason.
     */
    id: "m3.l3.b3",
    type: "prediction",
    skillRefs: ["func.return", "func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама нені шығарады? Функцияның ішінде `return` жоқ екеніне назар аудар. Әр шыққан мән жеке жолда.",
      ru: "Что выведет эта программа? Обрати внимание: внутри функции нет `return`. Каждое выведенное значение — на отдельной строке.",
    },
    code:
      "def show_square(x):\n" +
      "    print(x * x)\n" +
      "\n" +
      "r = show_square(5)\n" +
      "print(r)",
    answer: "25\nNone",
    options: ["25", "25\n25", "25\nNone", "None"],
    diagnosticMapping: {
      "25\n25": {
        failureClass: "print_mistaken_for_return",
        justification:
          "Екінші жолда 25 шығуының жалғыз жолы бар: `print` мәнді экранға жазумен қатар оны шақырған жерге де беріп жібереді деп ойлау. Шын мәнінде `r` айнымалысына ешқандай сан түспейді, өйткені функция ештеңе қайтармаған.",
      },
    },
  },
  {
    /*
     * The same idea as b3, asked from the other side: not "what comes out" but
     * "which one may be used in an expression". Three functions over identical
     * arithmetic, so the only thing separating them is the last line of each.
     *
     * `f3` is the version that computes the value and drops it — the belief
     * that the last expression comes back on its own, which a learner coming
     * from a calculator holds without ever having said it out loud.
     *
     * o4 ("all three") carries no mapping: a learner reaches it by not reading
     * the bodies at all, and also by thinking every call has SOME result, and
     * those are not the same mistake.
     */
    id: "m3.l3.b4",
    type: "multiple_choice",
    skillRefs: ["func.return", "func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Осы үш функцияның қайсысын `print(f(3) + 1)` деп жазуға болады — яғни қайсысының нәтижесіне 1 қосуға болады?",
      ru: "Какую из этих трёх функций можно записать как `print(f(3) + 1)` — то есть к результату какой из них можно прибавить 1?",
    },
    code:
      "def f1(x):\n" +
      "    print(x + 10)\n" +
      "\n" +
      "def f2(x):\n" +
      "    return x + 10\n" +
      "\n" +
      "def f3(x):\n" +
      "    x + 10",
    options: [
      { id: "o1", label: { kk: "f1 функциясы", ru: "Функция f1" } },
      { id: "o2", label: { kk: "f2 функциясы", ru: "Функция f2" } },
      { id: "o3", label: { kk: "f3 функциясы", ru: "Функция f3" } },
      { id: "o4", label: { kk: "Үшеуі де жарайды", ru: "Подходят все три" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "print_mistaken_for_return",
        justification:
          "f1-ді таңдау — экранға жазу мен шақырған жерге беруді бір нәрсе деп санау. f1 санды экранға шығарады, бірақ шақырған жерге ештеңе бермейді, сондықтан оның қасына `+ 1` жазуға болмайды.",
      },
      o3: {
        failureClass: "value_computed_but_not_returned",
        justification:
          "f3-те `x + 10` есептеледі, бірақ ешқайда жіберілмейді. Бұл жауап оқушының соңғы есептелген өрнек өздігінен қайтады деп ойлайтынын көрсетеді — Python-да олай емес, қайтару тек `return` арқылы болады.",
      },
    },
  },
  {
    /*
     * The universal bug, in a function the learner has now met twice. The
     * symptom is not a crash and not a silent wrong number: it is the word
     * `None` under a correct-looking answer, which is what they will actually
     * see on their own screen next week.
     *
     * symptomInput is declared because the numeric probe would show it too —
     * but the probe's first value is "0", where the buggy program prints
     * "0\nNone" and the fixed one prints "0", so the difference is real on any
     * input. 407 is declared anyway so the failure the prompt describes is the
     * failure the checker verifies.
     */
    id: "m3.l3.b5",
    type: "find_bug",
    skillRefs: ["func.return", "func.define", "loops.while", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "407 енгізгенде бұл бағдарлама екі жол шығарады: алдымен 11, содан кейін None. Тек 11 шығуы керек еді. Қате қай жолда?",
      ru: "При вводе 407 эта программа выводит две строки: сначала 11, потом None. А должна выводить только 11. В какой строке ошибка?",
    },
    code:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    print(s)\n" +
      "\n" +
      "x = int(input())\n" +
      "print(digit_sum(x))",
    buggyLine: 6,
    symptomInput: "407",
    fixedCode:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "x = int(input())\n" +
      "print(digit_sum(x))",
    diagnosticMapping: {
      "9": {
        failureClass: "print_mistaken_for_return",
        justification:
          "9-жолды кінәлау — 11 санын функцияның ішіндегі `print` дұрыс шығарды деп қабылдау. Артық жол сол емес: функция ештеңе қайтармағандықтан, дұрыс жауапты шығаратын жол ғана None жазуға мәжбүр болып тұр.",
      },
    },
  },
  {
    /*
     * The second half of the lesson's objective: code after `return` does not
     * run. Written as the mistake it actually is — the learner declares what
     * the function will return immediately after creating the accumulator,
     * because `return` reads like a promise rather than an exit.
     *
     * A different function from b5 on purpose: this is a running total, so the
     * two repair blocks are two bugs and not one bug read twice.
     *
     * No diagnostic mapping. Line 2 is reached both by "the accumulator should
     * start at 1" and by "the answer equals the starting value, so the starting
     * value is wrong", and line 4 is reached by any of the range off-by-one
     * hunts October drilled. Neither answer names one cause, so the engine asks
     * instead of telling.
     */
    id: "m3.l3.b6",
    type: "find_bug",
    skillRefs: ["func.return", "func.define", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция 1-ден n-ге дейінгі сандардың қосындысын қайтаруға тиіс. Бірақ n = 5 болғанда бағдарлама 15-тің орнына 0 шығарады. Қате қай жолда және неге циклдің мүлде орындалмағанын ойлан.",
      ru: "Функция должна возвращать сумму чисел от 1 до n. Но при n = 5 программа выводит 0 вместо 15. В какой строке ошибка и почему цикл вообще не выполнился?",
    },
    code:
      "def sum_to(n):\n" +
      "    s = 0\n" +
      "    return s\n" +
      "    for i in range(1, n + 1):\n" +
      "        s = s + i\n" +
      "\n" +
      "n = int(input())\n" +
      "print(sum_to(n))",
    buggyLine: 3,
    symptomInput: "5",
    fixedCode:
      "def sum_to(n):\n" +
      "    s = 0\n" +
      "    for i in range(1, n + 1):\n" +
      "        s = s + i\n" +
      "    return s\n" +
      "\n" +
      "n = int(input())\n" +
      "print(sum_to(n))",
  },
  {
    /*
     * Assembly, not authorship — and the third blank is the point. Two `return`
     * values are being added to each other on the last line, so the learner
     * cannot fill in `return` as a word they copied without also deciding what
     * the caller does with what came back.
     *
     * A digit COUNT rather than a digit sum, so the fill-blank is not the
     * worked example with holes punched in it.
     */
    id: "m3.l3.b7",
    type: "fill_blank",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция санның цифр САНЫН экранға шығармай, қайтаруға тиіс. Соңғы жол 407 және 25 сандарындағы цифрлардың ЖАЛПЫ санын шығарады. Үш бос орынды толтыр.",
      ru: "Функция должна не выводить, а ВОЗВРАЩАТЬ количество цифр числа. Последняя строка выводит ОБЩЕЕ количество цифр в числах 407 и 25. Заполни три пропуска.",
    },
    template:
      "def digit_count(n):\n" +
      "    c = 0\n" +
      "    while n > 0:\n" +
      "        c = c + 1\n" +
      "        n = n // 10\n" +
      "    ___ ___\n" +
      "\n" +
      "print(digit_count(407) ___ digit_count(25))",
    blanks: [
      { id: "f1", answer: "return" },
      { id: "f2", answer: "c" },
      { id: "f3", answer: "+" },
    ],
  },
  {
    /*
     * PDF p.8, first practice family: «цифрлар қосындысын функциямен есептеу».
     *
     * The loop that repeats the function is what makes this a `return` task and
     * not an October task: the value that comes back goes straight in as the
     * next argument, which is impossible for a function that prints. Two rounds
     * are genuinely needed — 19 → 10 → 1 — so a solution that applies the
     * function once is killed by a hidden case rather than by a warning.
     *
     * The cases, and what each kills:
     *   999   the prompt's own example, one round of work
     *   5     already a single digit, the loop body never runs
     *   0     kills a do-while shape: `while n > 0` here never terminates
     *   9     the exact boundary; `while n >= 9` hangs on it and times out
     *   19    kills "apply the function once" — 10 is not a single digit
     *   10    the smallest two-digit number
     *   999999999 / 1000000000  the stated maximum, both directions
     */
    id: "m3.l3.b8",
    type: "write_code",
    skillRefs: ["func.return", "func.define", "func.reuse", "loops.while", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бүтін сан n беріледі (0 ≤ n ≤ 1 000 000 000). Санның цифрлар қосындысын ҚАЙТАРАТЫН функция жаз. Сан 9-дан үлкен болса, сол функцияны шыққан нәтижеге қайта қолдана бер — бір таңбалы сан қалғанша. Сол таңбаны шығар. Мысалы: 999 → 27 → 9, жауап 9. n = 5 үшін жауап 5, n = 0 үшін жауап 0.",
      ru: "Дано целое число n (0 ≤ n ≤ 1 000 000 000). Напиши функцию, которая ВОЗВРАЩАЕТ сумму цифр числа. Пока число больше 9, применяй эту функцию к полученному результату снова — пока не останется одна цифра. Её и выведи. Например: 999 → 27 → 9, ответ 9. При n = 5 ответ 5, при n = 0 ответ 0.",
    },
    referenceSolution:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "n = int(input())\n" +
      "while n > 9:\n" +
      "    n = digit_sum(n)\n" +
      "print(n)",
    cases: [
      { input: "999", expectedOutput: "9" },
      { input: "5", expectedOutput: "5" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "9", expectedOutput: "9", hidden: true },
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "19", expectedOutput: "1", hidden: true },
      { input: "999999999", expectedOutput: "9", hidden: true },
      { input: "1000000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * The lesson's independent task: what came back out of the function goes
     * into a comparison. The numbers are chosen so that comparing a and b
     * themselves — the shortcut a learner reaches for when they have not
     * actually used the returned values — fails on visible case 2 and on two
     * hidden ones.
     *
     * Output tokens are English and both prompts name all three, because a
     * program's output is one string for both language tracks and a Kazakh word
     * on screen would let a Russian-track learner match glyphs instead of
     * reasoning.
     *
     * Cases, and what each kills:
     *   407 23         plain "first"
     *   12 30          3 vs 3 → equal, and 12 < 30 kills comparing the numbers
     *   5 91           5 vs 10 → second, while 5 < 91 agrees — the case that
     *                  makes the number-comparison shortcut look right
     *   999999999 1000000000  81 vs 1 → first, though a < b
     *   1000000000 100 1 vs 1 → equal, though a is a billion
     *   0 0            both zero, the loop never runs on either
     *   0 1            0 vs 1 → second, the smallest real difference
     *   19 91          10 vs 10 → equal on two different numbers
     *
     * `product-authored`, not `curriculum-derived`, and the distinction is not
     * a formality: p.8 names the digit-sum FUNCTION as a practice family, which
     * b8 is, but nothing in the programme asks for two numbers to be compared
     * by their digit sums. That framing is invented to serve this lesson's
     * objective, so the field says so and a later reader can check.
     */
    id: "m3.l3.b9",
    type: "write_code",
    skillRefs: ["func.return", "func.define", "func.reuse", "compare.operators", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда екі бүтін сан a және b беріледі (0 ≤ a, b ≤ 1 000 000 000). Санның цифрлар қосындысын қайтаратын функция жаз, оны екі санға да қолдан және цифрлар қосындысы қайсысында үлкен екенін анықта. a-да үлкен болса `first`, b-да үлкен болса `second`, тең болса `equal` деп шығар (тек осы үш ағылшын сөзінің бірі).",
      ru: "В одной строке даны два целых числа a и b (0 ≤ a, b ≤ 1 000 000 000). Напиши функцию, которая возвращает сумму цифр числа, примени её к обоим числам и определи, у какого из них сумма цифр больше. Выведи `first`, если больше у a, `second`, если больше у b, и `equal`, если суммы равны (ровно одно из этих трёх английских слов).",
    },
    referenceSolution:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "x = digit_sum(a)\n" +
      "y = digit_sum(b)\n" +
      "if x > y:\n" +
      '    print("first")\n' +
      "elif x < y:\n" +
      '    print("second")\n' +
      "else:\n" +
      '    print("equal")',
    cases: [
      { input: "407 23", expectedOutput: "first" },
      { input: "12 30", expectedOutput: "equal" },
      { input: "5 91", expectedOutput: "second", hidden: true },
      { input: "999999999 1000000000", expectedOutput: "first", hidden: true },
      { input: "1000000000 100", expectedOutput: "equal", hidden: true },
      { input: "0 0", expectedOutput: "equal", hidden: true },
      { input: "0 1", expectedOutput: "second", hidden: true },
      { input: "19 91", expectedOutput: "equal", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b9 — the same problem, the same cases, entered
     * through a different door. PDF p.6: «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ».
     *
     * What is given away is what b9 does not measure: the digit-sum function
     * and the reading line, both already written twice in this lesson. What is
     * left to do is the whole point of the block — take the two values that
     * came back out of the calls and put them into a comparison instead of into
     * two `print`s. A support learner meets the same idea, not a smaller one.
     */
    id: "m3.l3.b9s",
    type: "modify_code",
    skillRefs: ["func.return", "func.reuse", "compare.operators", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама екі санның цифрлар қосындысын екі жолға бөлек шығарады. Оны цифрлар қосындысы қайсысында үлкен екенін жазатындай өзгерт: a-да үлкен болса `first`, b-да үлкен болса `second`, тең болса `equal` (тек бір ағылшын сөзі). `digit_sum` функциясын өзгертудің қажеті жоқ — оның қайтарған мәндерін салыстыру керек.",
      ru: "Эта программа выводит суммы цифр двух чисел двумя отдельными строками. Измени её так, чтобы она писала, у какого числа сумма цифр больше: `first`, если у a, `second`, если у b, и `equal`, если суммы равны (ровно одно английское слово). Функцию `digit_sum` менять не нужно — нужно сравнить значения, которые она вернула.",
    },
    code:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "print(digit_sum(a))\n" +
      "print(digit_sum(b))",
    referenceSolution:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "x = digit_sum(a)\n" +
      "y = digit_sum(b)\n" +
      "if x > y:\n" +
      '    print("first")\n' +
      "elif x < y:\n" +
      '    print("second")\n' +
      "else:\n" +
      '    print("equal")',
    cases: [
      { input: "407 23", expectedOutput: "first" },
      { input: "12 30", expectedOutput: "equal" },
      { input: "5 91", expectedOutput: "second", hidden: true },
      { input: "1000000000 100", expectedOutput: "equal", hidden: true },
      { input: "0 0", expectedOutput: "equal", hidden: true },
      { input: "19 91", expectedOutput: "equal", hidden: true },
    ],
  },
];
