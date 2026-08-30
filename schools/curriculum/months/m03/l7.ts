import type { LessonBlock } from "../../types";

/**
 * Month 3 · Қараша · Lesson 7 — «Күрделірек есептер» / «Задачи посложнее».
 * 10 min. The month's LAST teaching lesson.
 *
 * ## Which clauses of the programme drive it
 *
 * One practice family, named verbatim on p.8: «бірнеше функциядан тұратын
 * шағын бағдарлама» — a small program made of several functions. b6 is that
 * program with two functions, b7 with three, and b7's middle function exists
 * only to call the first one.
 *
 * The mastery paragraph lands here because there is nowhere else left for it to
 * land: «Осы айдың соңында оқушы шарттар, циклдер, тізімдер, жолдар және
 * функцияларды біріктіріп, OOP-ке дейінгі процедуралық база толық
 * қалыптасады». So every program below is a combination — a condition inside a
 * loop inside a function that another function calls — and not one block
 * introduces a construct. November's two, `def` and `return`, are three lessons
 * old by now. What is new is only the wiring, which is exactly what the
 * sentence promises the month ends with.
 *
 * «Айлық сынақ» then asks for «кемінде 2-3 функциядан тұратын бағдарламаны өз
 * бетінше жазу» days after this lesson sits. b6 is two functions, b7 is three,
 * and b8 is the one-sentence-per-function account the same paragraph asks the
 * learner to give out loud.
 *
 * ## The second objective, which the PDF does not state, and why it is here
 *
 * «Функцияны бөлек тексеру» — test a function on its own. The programme never
 * says it, so b1 and b5 are `product-authored` and say so.
 *
 * It is in the lesson because this is the first week of the year when a wrong
 * answer has more than one place to live. Until now a broken program was
 * fifteen lines and the learner reread all fifteen; from b6 onwards the bug is
 * in a helper, or in the caller, or in the line that joins them, and rereading
 * everything stops working at precisely the moment the programme starts asking
 * for several functions. A function with a parameter can be run without the
 * rest of the program and without the keyboard — that is what a parameter IS —
 * and a fourteen-year-old who knows this can cut a search in half before the
 * teacher arrives.
 *
 * The idea is carried by the blocks and not only by b1's paragraph. b4's prompt
 * is written in the voice of somebody who has already tested both functions
 * alone and reports that both are right, which is what makes the wiring the
 * only place left to look. b5 hands over a helper that survives every test a
 * learner would think of and fails on the one class of input they would not,
 * and asks for that input by name. b8 asks for three test calls and the answer
 * expected from each, in writing.
 *
 * ## Not duplicated, deliberately
 *
 * `m3.l8` owns the maximum and minimum helpers, the vowel counter and the word
 * palindrome; `m3.l9`'s bank owns the ten independent tasks, including the
 * digit sum of two numbers (p3) and `is_prime` + `count_primes_below` (p10);
 * `m3.l6` owns `read_row` / `count_ok` / `report` and the `is_high` split;
 * `global` is `m3.l5`'s subject and appears nowhere here. The digit sum returns
 * in b6, and it returns as an ingredient: for the first time the value that
 * comes back out of it is fed to a comparison inside ANOTHER function's loop
 * rather than printed or compared at the call site.
 *
 * No `worked_example`. The month owes six and l1, l2, l3, l8, l5 and l6 carry
 * them; a seventh here would spend two of the ten minutes on reading.
 *
 * ## Track routing
 *
 * b6 (write) is core and advanced; support meets the same problem as b6s, a
 * fill-blank on a finished program — «дайын кодты құрастыру мен толықтыру
 * көбірек, нөлден жазу азырақ» (p.6). Its filled program is deliberately NOT
 * b6's reference solution: it counts with `range(len(a))` and an index, so a
 * support learner assembles a second correct shape rather than transcribing
 * the one the other route was asked to invent. b7 is the «күрделі есептер
 * блогы» for core and advanced, b8 the compulsory «жазбаша қорғау» for
 * advanced. Everything else is on all three routes.
 */
export const M3_L7: LessonBlock[] = [
  {
    /* The method, stated as a procedure rather than as advice, because advice
       («тексеріп отыр») is what a learner agrees with and does not do. The
       last sentence is the one that ties testing back to `return`: a helper
       that prints cannot be checked this way, which is the third time the
       month has cashed out the same distinction and the first time it costs
       something concrete. */
    id: "m3.l7.b1",
    type: "concept",
    skillRefs: ["func.define", "func.parameters", "func.return"],
    sourceType: "product-authored",
    title: {
      kk: "Әр функцияны бөлек тексер",
      ru: "Проверяй каждую функцию отдельно",
    },
    body: {
      kk: "Бірнеше функциядан тұратын бағдарлама қате жауап берсе, қатенің қай жерде екенін іздеу қиынға түседі: функциялардың өзі де, оларды байланыстырған жолдар да күдікті. Сондықтан тәртіп мынадай: алдымен әр функцияны ЖЕКЕ тексер, содан кейін ғана оларды бір бағдарламаға жина. Параметрі бар функцияны тексеру үшін пернетақта да, `input` да қажет емес — оны өзің таңдаған мәнмен шақырып, қайтқан нәтижесін `print` арқылы көресің. Жауабын алдын ала өзің білетін үш-төрт мән ал: бір қарапайымын, бір шекарадағысын және бір ыңғайсызын — нөлді, бір элементті тізімді, бос тізімді. Осы жолдардың бірі күткен нәтижені бермесе, қате сол функцияның ішінде: қалған бағдарламаны қарап әуре болудың қажеті жоқ. Ал функция нәтижені `return` етпей, өзі `print` етсе, оны бұлай тексере алмайсың — экранға қарап отырасың, бірақ қолыңда салыстыратын мән жоқ.",
      ru: "Когда программа состоит из нескольких функций и выдаёт неверный ответ, искать ошибку тяжело: подозрительны и сами функции, и строки, которые их соединяют. Поэтому порядок такой: сначала проверь каждую функцию ОТДЕЛЬНО и только потом собирай их в одну программу. Чтобы проверить функцию с параметром, не нужны ни клавиатура, ни `input`: вызови её со значением, которое выбрал сам, и напечатай возвращённый результат через `print`. Возьми три-четыре значения, ответ для которых знаешь заранее: одно обычное, одно на границе и одно неудобное — ноль, список из одного элемента, пустой список. Если хотя бы одна такая строка выдала не то, что ты ждал, ошибка внутри этой функции, и остальную программу можно не разглядывать. А если функция не возвращает результат через `return`, а печатает его сама, так проверить её не получится: ты смотришь на экран, но сравнивать тебе нечего.",
    },
    /* Three calls, and the third is the one worth showing: a learner who only
       ever tries `times_seen([4, 7, 4], 4)` has tested that the loop counts,
       not that the counter starts at zero. */
    code:
      "def times_seen(a, v):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if x == v:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "print(times_seen([4, 7, 4], 4))\n" +
      "print(times_seen([4, 7, 4], 9))\n" +
      "print(times_seen([], 4))\n" +
      "\n" +
      "# 2, 0, 0",
  },
  {
    /*
     * Order of calls, in the smallest program where it is visible. Both
     * functions are one idea each and both compositions are legal Python, so
     * nothing but the order can explain the two different numbers.
     *
     * 9 is chosen so the two answers are far apart: `steps(16)` is 5 and
     * `plus7(4)` is 11. A number where the two orders happened to agree would
     * have taught the opposite of the lesson.
     *
     * "4\n11" is deliberately left unmapped. It is reached both from ignoring
     * the inner call on the first line (answering `steps(9)`) and from
     * miscounting the halvings of 16 as 4, and two causes for one answer is
     * exactly the case `types.ts` says to leave alone.
     */
    id: "m3.l7.b2",
    type: "prediction",
    skillRefs: ["func.reuse", "func.return", "func.parameters", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарламада екі функция бар. `steps(n)` — n санын нөл болғанша неше рет екіге бөлуге болатынын қайтарады, `plus7(n)` — санға 7 қосып қайтарады. Соңғы екі жолда дәл сол екі функция шақырылады, айырмасы тек шақыру ретінде. Экранға не шығады?",
      ru: "В программе две функции. `steps(n)` возвращает, сколько раз число n можно поделить на 2, пока оно не станет нулём, а `plus7(n)` возвращает число, увеличенное на 7. В двух последних строках вызываются те же самые две функции, и различаются эти строки только порядком вызова. Что выведет программа?",
    },
    code:
      "def steps(n):\n" +
      "    c = 0\n" +
      "    while n > 0:\n" +
      "        n = n // 2\n" +
      "        c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "def plus7(n):\n" +
      "    return n + 7\n" +
      "\n" +
      "print(steps(plus7(9)))\n" +
      "print(plus7(steps(9)))",
    answer: "5\n11",
    options: ["5\n11", "11\n5", "5\n5", "4\n11"],
    diagnosticMapping: {
      "11\n5": {
        failureClass: "call_order_read_left_to_right",
        justification:
          "Бұл — дұрыс жауаптың орындары ауысқан түрі, ал екі жолды бірдей шатастырудың бір ғана жолы бар: `steps(plus7(9))` өрнегін «алдымен steps, содан кейін plus7» деп солдан оңға қарай оқу. Ішкі жақшадағы шақыру бірінші орындалатынын білген оқушы бір жолды дұрыс, екіншісін қате есептей алмайды — екеуі де бір ережеге сүйенеді.",
      },
      "5\n5": {
        failureClass: "call_order_ignored",
        justification:
          "Екі жолда бір сан тұруының жалғыз себебі — шақыру реті нәтижеге әсер етпейді деп ойлау. Дұрыс есептегенде жолдардың жауабы әрқашан бөлек шығады (5 және 11), сондықтан бірдей екі жауап есептеу қатесінен емес, ретті елемеуден туады.",
      },
    },
  },
  {
    /*
     * «Платформа функция шақырылғанда қандай параметр мәндері кіретінін,
     * қандай жергілікті айнымалылар пайда болатынын және return кезінде не
     * қайтатынын визуалды көрсетеді» (p.8) — done by hand, over a call that
     * happens inside another call: `count_lucky` runs `last_digit` once per
     * element.
     *
     * `d` exists so the inner function's return value has a name and therefore
     * a column. Without it the trace would show the outer loop only and the
     * nested call would be invisible, which is the one thing this block is for.
     *
     * The grid used to carry `nums` and `a` too, and both were free. Their
     * value is `[17, 4, 27, 30]`, written on line 12 of the program printed
     * directly above the table, so seven of the cells asked a learner to copy a
     * list already on their screen and then scored them for it. Free was the
     * smaller half of the damage. `nums` stood in the two call-site rows only,
     * so on the five rows inside the function the renderer supplied its own
     * em-dash — and an em-dash in this grid means «this name does not exist
     * here», which is false about a module-level name. `m3.l5.b1`'s second
     * failure is a function body reading exactly such a name instead of its
     * parameter, and that failure only bites because the name IS visible in
     * there; a table two lessons later saying it is not would undo it.
     *
     * So the columns are the four values the program does not state. `total` is
     * the new one and it is what the last row is for: the number `count_lucky`
     * hands back has to land somewhere, and giving it a name turns «return
     * кезінде не қайтады» into a question with an answer rather than something
     * that happens inside `print`'s brackets. It is also the shape `m3.l5.b2`
     * argued for when it took `global` away — the caller keeps the result.
     *
     * The parameter half of the p.8 clause did not leave with the `a` column,
     * it moved one function inwards. `x` is the value that goes in to
     * `last_digit` on this pass and `d` is what comes back, so every row holds
     * one argument beside its return; what `a` is worth saying about it — same
     * list as `nums`, unchanged for the whole call — the prompt says in a
     * sentence, which costs nothing and asks for no transcription.
     *
     * Every name is in every row, with `-` for «does not exist», the convention
     * `m3.l8.b4` set. That is the point of the last row: `x`, `d` and `c` being
     * gone by line 13 is the most interesting thing on it, and a name left out
     * of the row would have the grid answer that for free.
     *
     * The data is [17, 4, 27, 30]. 17 is first and counts, 30 is last and does
     * not, so neither "the first decides" nor "the last decides" survives. 30
     * is there for `d = 0`: a learner who reads `last_digit` as "the digit on
     * the left" gets 3 and the row disagrees. Rows are recorded at the `for`
     * line with the body already finished for that `x`, the convention
     * `m2.l5.b4` set.
     */
    id: "m3.l7.b3",
    type: "trace_code",
    skillRefs: ["func.reuse", "func.return", "func.parameters", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "`count_lucky` тізімді аралайды және әр сан үшін `last_digit` функциясын шақырады — бұл функцияның ішіндегі функция шақыруы. Кестеде төрт баған: `x` — цикл айнымалысы әрі `last_digit`-ке параметр болып кіретін мән, `d` — сол шақыру `return` еткен нәтиже, `c` — жауап жиналатын жергілікті айнымалы, `total` — функция қайтарған мән жазылатын, функциядан тыс жердегі ат. Ат сол сәтте әлі пайда болмаған немесе жойылып кеткен болса, `-` таңбасын қой. Алғашқы төрт қатар — цикл денесі сол `x` үшін толық орындалып болған сәт, бесінші қатар — `return c` жолына жеткен сәт, ал соңғы қатар — 13-жол толығымен орындалып біткен сәт. `a` параметрі — 12-жолдағы сол тізімнің өзі, тек екінші аты: шақыру басталғанда мәнді алады да, шақыру біткенше өзгермейді, сондықтан кестеде оның бағаны жоқ.",
      ru: "`count_lucky` проходит по списку и для каждого числа вызывает `last_digit` — это вызов функции внутри функции. В таблице четыре столбца: `x` — переменная цикла и одновременно значение, которое уходит параметром в `last_digit`; `d` — то, что этот вызов вернул; `c` — локальная переменная, в которой копится ответ; `total` — имя вне функции, куда записывается возвращённое значение. Если имя в этот момент ещё не появилось или уже исчезло, поставь знак `-`. Первые четыре строки — момент, когда тело цикла для этого `x` уже полностью выполнилось, пятая — момент, когда выполнение дошло до `return c`, а последняя — момент, когда строка 13 выполнилась целиком. Параметр `a` — это тот же список из строки 12 под вторым именем: он получает значение в начале вызова и до его конца не меняется, поэтому столбца для него нет.",
    },
    code:
      "def last_digit(n):\n" +
      "    return n % 10\n" +
      "\n" +
      "def count_lucky(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        d = last_digit(x)\n" +
      "        if d == 7:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "nums = [17, 4, 27, 30]\n" +
      "total = count_lucky(nums)\n" +
      "print(total)",
    steps: [
      { line: 6, vars: { x: "17", d: "7", c: "1", total: "-" } },
      { line: 6, vars: { x: "4", d: "4", c: "1", total: "-" } },
      { line: 6, vars: { x: "27", d: "7", c: "2", total: "-" } },
      { line: 6, vars: { x: "30", d: "0", c: "2", total: "-" } },
      { line: 10, vars: { x: "30", d: "0", c: "2", total: "-" } },
      { line: 13, vars: { x: "-", d: "-", c: "-", total: "2" } },
    ],
  },
  {
    /*
     * The discarded return, and the lesson's own method used to corner it. The
     * prompt reports that both functions were tested alone and both are right,
     * which is true and checkable — so the only place left is the line that
     * joins them. That framing is why this block is here rather than in l5,
     * where the bugs live inside functions.
     *
     * The prompt fixes both rules — the bonus is +5 and the pass mark is 60 —
     * so that lowering the threshold on line 10 is not a second defensible
     * repair. Line 15 is wrong on its own terms: it is a statement whose value
     * goes nowhere, and Python says nothing about it.
     *
     * `58 60 30 57` is chosen so the bonus changes three verdicts out of four:
     * 58 and 57 cross the line, 30 does not, and 60 was already over. A symptom
     * of 1 against an expected 3 is loud enough to be believed.
     */
    id: "m3.l7.b4",
    type: "find_bug",
    skillRefs: ["func.return", "func.reuse", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама әр бағаға 5 ұпай бонус қосып, содан кейін 60-тан кем емес бағалардың санын шығаруы керек. Екі функцияны да бөлек тексердім: `with_bonus([10, 20])` тізімді `[15, 25]` етіп қайтарады, `count_pass([59, 60])` бір санын қайтарады — екеуі де дұрыс. Сонда да `58 60 30 57` енгізгенде бағдарлама 3-тің орнына 1 шығарады. Қай жол кінәлі?",
      ru: "Программа должна прибавить каждой оценке бонус в 5 баллов и затем вывести, сколько оценок оказалось не меньше 60. Обе функции я проверил отдельно: `with_bonus([10, 20])` возвращает список `[15, 25]`, `count_pass([59, 60])` возвращает единицу — обе работают верно. И всё же при вводе `58 60 30 57` программа печатает 1 вместо 3. Какая строка виновата?",
    },
    code:
      "def with_bonus(a):\n" +
      "    b = []\n" +
      "    for x in a:\n" +
      "        b.append(x + 5)\n" +
      "    return b\n" +
      "\n" +
      "def count_pass(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if x >= 60:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "scores = list(map(int, input().split()))\n" +
      "with_bonus(scores)\n" +
      "print(count_pass(scores))",
    buggyLine: 15,
    fixedCode:
      "def with_bonus(a):\n" +
      "    b = []\n" +
      "    for x in a:\n" +
      "        b.append(x + 5)\n" +
      "    return b\n" +
      "\n" +
      "def count_pass(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if x >= 60:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "scores = list(map(int, input().split()))\n" +
      "scores = with_bonus(scores)\n" +
      "print(count_pass(scores))",
    symptomInput: "58 60 30 57",
  },
  {
    /*
     * A helper that passes every test a learner would think to write. It is
     * right about every list that contains the value, which is every list they
     * will try first, and it lies about the one case they will not: the answer
     * for "not here" collides with the answer for "here, at the very front".
     *
     * That collision is the point. Testing a function alone is only worth
     * anything if the values chosen include the ones you do not expect, and
     * this is the cheapest possible demonstration — the contract is two lines
     * long, the code is five, and the bug is invisible until somebody asks for
     * an input where the value is missing.
     *
     * Never executed by the checker: `test_case` is graded on the inputs the
     * learner names, so the program can be shown exactly as it is.
     */
    id: "m3.l7.b5",
    type: "test_case",
    skillRefs: ["func.return", "lists.index", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`find_pos(a, v)` функциясы тізімдегі `v` санының алғаш кездескен орнының индексін қайтаруы керек (индекс 0-ден басталады), ал тізімде ондай сан мүлде жоқ болса -1 қайтаруы керек. Бірінші жолда тізім, екінші жолда ізделетін сан беріледі. `4 7 9` мен `7` берілсе, дұрыс жауап 1. Функция дұрыс емес жауап беретін кірісті тап: кемінде екі мысал жаз және сол сан неге адастыратынын түсіндір.",
      ru: "Функция `find_pos(a, v)` должна возвращать индекс первого вхождения числа `v` в список (индексы с нуля), а если такого числа в списке вообще нет — возвращать -1. В первой строке дан список, во второй — искомое число. Для `4 7 9` и `7` верный ответ 1. Найди ввод, на котором функция отвечает неверно: приведи не меньше двух примеров и объясни, почему её ответ вводит в заблуждение.",
    },
    code:
      "def find_pos(a, v):\n" +
      "    for i in range(len(a)):\n" +
      "        if a[i] == v:\n" +
      "            return i\n" +
      "    return 0\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "target = int(input())\n" +
      "print(find_pos(nums, target))",
    /* Every one of these prints 0, and 0 is the answer this function also gives
       for a value sitting at the front — so the caller cannot tell the two
       apart. The third is the shortest possible witness. */
    breakingInputs: ["4 7 9\n5", "1 2 3\n9", "10\n7"],
  },
  {
    /*
     * «Бірнеше функциядан тұратын шағын бағдарлама» (p.8), with the two jobs
     * named so the split is the task and not a guessing game about names.
     *
     * The digit sum is November's headline family and the learner has written
     * it twice — m3.l3.b8 on one number, m3.p3 on two. What is new is where the
     * returned value goes: into a comparison inside ANOTHER function's loop.
     * The helper is called `len(a)` times by a function that never looks at a
     * digit, and that is the whole idea the month has been building towards.
     *
     * `k` is read separately so the counting function has two parameters. A
     * threshold baked in as a literal would let a learner write `count_above(a)`
     * and never meet the question of what a function needs to be told.
     *
     * What each case kills:
     *   5 / 34 7 90 12   the visible sample, three of four qualify
     *   3 / 30 3 12      every digit sum is exactly k, so `>=` answers 3 in the
     *                    open, where the learner can see it and reread the word
     *                    «қатаң» / «строго»
     *   0 / 0            the single zero: `while n > 0` never runs and the sum
     *                    must still come back as 0, and `0 > 0` is false
     *   9 / 999 100 45   one qualifier, one tie (45 → 9) and one number whose
     *                    zeros must not be skipped
     *   50 / …           the stated bounds, where 1000000 gives 1 and 999999
     *                    gives 54
     *   0 / 1 2 3        everything qualifies — a counter that returns too early
     *                    answers 1
     *   1 / 10 1 100     nothing qualifies, and all three sums are equal
     *   2 / 11 20 3      the middle element ties, so only 3 is counted
     */
    id: "m3.l7.b6",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse", "arith.remainder", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бірінші жолда k саны беріледі (0 ≤ k ≤ 50). Екінші жолда бос орынмен бөлінген бүтін сандар: саны 1-ден 100-ге дейін, әрқайсысы 0 мен 1 000 000 аралығында.\n" +
        "Есепті екі функцияға бөл. `digit_sum(n)` бір санның цифрларының қосындысын ҚАЙТАРАДЫ. `count_above(a, k)` тізім мен k-ны қабылдап, цифрлар қосындысы k-дан ҚАТАҢ үлкен элементтердің санын қайтарады; ол цифрларды өзі санамауы керек — әр элемент үшін `digit_sum`-ды шақырады.\n" +
        "Екі функцияның ішінде де `print` жоқ. Жауапты негізгі бағдарлама бір жолға шығарады.\n" +
        "`digit_sum`-ды бағдарламаға қоспас бұрын бөлек шақырып тексер: жауабын өзің білетін бірнеше санды бер.\n" +
        "k = 5 және сандар «34 7 90 12» болса, цифрлар қосындылары 7, 7, 9, 3 — 5-тен үлкені үшеу, сондықтан жауап 3.",
      ru:
        "В первой строке дано число k (0 ≤ k ≤ 50). Во второй строке через пробел даны целые числа: их от 1 до 100, каждое от 0 до 1 000 000.\n" +
        "Раздели задачу на две функции. `digit_sum(n)` ВОЗВРАЩАЕТ сумму цифр одного числа. `count_above(a, k)` принимает список и k и возвращает количество элементов, у которых сумма цифр СТРОГО больше k; сама она цифры не считает — для каждого элемента она вызывает `digit_sum`.\n" +
        "Внутри обеих функций нет `print`. Ответ печатает основная программа одной строкой.\n" +
        "Прежде чем вставлять `digit_sum` в программу, проверь её отдельно: вызови на нескольких числах, ответ для которых знаешь сам.\n" +
        "При k = 5 и числах «34 7 90 12» суммы цифр равны 7, 7, 9, 3 — больше 5 оказались три, поэтому ответ 3.",
    },
    referenceSolution:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "def count_above(a, k):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if digit_sum(x) > k:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "k = int(input())\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(count_above(nums, k))",
    cases: [
      { input: "5\n34 7 90 12", expectedOutput: "3" },
      { input: "3\n30 3 12", expectedOutput: "0" },
      { input: "0\n0", expectedOutput: "0", hidden: true },
      { input: "9\n999 100 45", expectedOutput: "1", hidden: true },
      { input: "50\n1000000 999999", expectedOutput: "1", hidden: true },
      { input: "0\n1 2 3", expectedOutput: "3", hidden: true },
      { input: "1\n10 1 100", expectedOutput: "0", hidden: true },
      { input: "2\n11 20 3", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m3.l7.b6 — the same problem, assembled instead
     * of written. «Дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ» (p.6).
     *
     * The finished program here is NOT b6's reference solution: the counting
     * function walks the list by index and gives the returned digit sum a name
     * of its own, so a support learner who later sees the other route's answer
     * meets a second correct shape rather than the sentence they already typed.
     * `digit_sum` is given whole, because on this route it is not what is being
     * asked. `d` is the name b3 used for the same thing an hour earlier — what
     * came back out of the inner call — and reusing it is free.
     *
     * The third blank was the function name in `print(___(nums, k))`, answer
     * `count_above`. That word is written in the `def` line of the same
     * template and twice more in the prompt above it, so whatever the blank was
     * testing, it could be filled by copying. The shape leaked the rest: of the
     * two functions on screen only one takes two arguments, so even a learner
     * who had never met the word could fill it by counting brackets. The call
     * at the bottom is now given whole.
     *
     * Its replacement is the one decision in this program that is nowhere on
     * screen: what `digit_sum` is handed. The loop walks positions, so
     * `digit_sum(i)` compiles, runs, and quietly totals the digits of 0, 1,
     * 2 … — the index-for-element slip, and the reason this block claims
     * `lists.index` at all. `a[i]` versus `i` is the entire difference between
     * delegating over a list and delegating over its subscripts, and it is the
     * delegation that the whole lesson is about.
     *
     * The three blanks, none fillable from the shape of its line:
     *   1. `a[i]` and not `i` — the helper receives the element, not the place
     *      the element sits in;
     *   2. `>` and not `>=` — the word «қатаң» / «строго» is in the statement
     *      and this is where it is spent;
     *   3. `c` and not `i` — what leaves a counting function is the count, and
     *      `return i` compiles and prints the last index.
     */
    id: "m3.l7.b6s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.return", "func.reuse", "lists.index", "compare.operators"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk:
        "Бірінші жолда k саны беріледі (0 ≤ k ≤ 50), екінші жолда бос орынмен бөлінген бүтін сандар. Бағдарлама цифрлар қосындысы k-дан ҚАТАҢ үлкен сандардың санын шығаруы керек. Құрылымы дайын: `digit_sum` бір санның цифрларының қосындысын қайтарады, `count_above` сол функцияны әр элемент үшін шақырып, қайтқан мәнді `d`-ға жазады да, санайды.\n" +
        "Үш орынды толтыр: `digit_sum` қандай мәнмен шақырылады, `d` мен k-ны қалай салыстырамыз және `count_above` нені қайтарады?\n" +
        "k = 5 және сандар «34 7 90 12» болса, жауап 3.",
      ru:
        "В первой строке дано число k (0 ≤ k ≤ 50), во второй — целые числа через пробел. Программа должна вывести количество чисел, у которых сумма цифр СТРОГО больше k. Структура уже готова: `digit_sum` возвращает сумму цифр одного числа, а `count_above` вызывает её для каждого элемента, кладёт возвращённое значение в `d` и считает.\n" +
        "Заполни три места: с каким значением вызывается `digit_sum`, как сравнить `d` с k и что возвращает `count_above`.\n" +
        "При k = 5 и числах «34 7 90 12» ответ равен 3.",
    },
    template:
      "def digit_sum(n):\n" +
      "    s = 0\n" +
      "    while n > 0:\n" +
      "        s = s + n % 10\n" +
      "        n = n // 10\n" +
      "    return s\n" +
      "\n" +
      "def count_above(a, k):\n" +
      "    c = 0\n" +
      "    for i in range(len(a)):\n" +
      "        d = digit_sum(___)\n" +
      "        if d ___ k:\n" +
      "            c = c + 1\n" +
      "    return ___\n" +
      "\n" +
      "k = int(input())\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(count_above(nums, k))",
    blanks: [
      { id: "f1", answer: "a[i]" },
      { id: "f2", answer: ">" },
      { id: "f3", answer: "c" },
    ],
  },
  {
    /*
     * CORE AND ADVANCED. «Негізгі есептер … және қалауы бойынша 1-2 күрделірек
     * есеп» (p.6), and the fullest form of «бірнеше функциядан тұратын шағын
     * бағдарлама»: three functions, where the middle one exists only to call
     * the first and the last one exists only to call the middle.
     *
     * A number palindrome and not a word one. `m3.l8.b7` and `m3.p6` both own
     * the word version, and the difference is not cosmetic — reversing a number
     * has to be built with `% 10` and `// 10` and `r * 10 + …`, which is the
     * digit loop turned inside out, and it gives `is_pal` something to call.
     * A word palindrome compares characters in place and would leave the middle
     * function with nothing to delegate.
     *
     * `is_pal` returning 1 or 0 rather than printing is what lets `count_pal`
     * add it up in one line, the shape `m3.l8.b7` and `m3.p10` established.
     *
     * What each case kills:
     *   121 45 7 33 100  the sample: single digits count, and 100 does not —
     *                    a reversal that drops trailing zeros answers 4
     *   45 54            visible on purpose: the same digits in both numbers
     *                    and neither is a palindrome, so "the digits match"
     *                    dies where the learner can see it
     *   0                `while n > 0` never runs, the reversal is 0, and 0 is
     *                    its own mirror — the statement says so and this checks
     *                    that the helper was not special-cased into returning 0
     *   10               the shortest non-palindrome
     *   1221 12321 1234  even length, odd length, neither
     *   5 5 5            duplicates all count, so a counter that stops early
     *                    answers 1
     *   1000000 1        the stated maximum against the shortest number
     *   11 22 33 12      three of four, so an answer that is right by counting
     *                    the list length is wrong here
     *   1231 121 123421  the endpoint shortcut, and the next rung of it
     *
     * That last case is a repair, and the eight above it were the defect. Every
     * non-palindrome they carried disagreed on its outermost digits — 45, 54,
     * 100, 10, 1234, 1000000, 12 — so `s = str(n)` followed by the single
     * comparison `s[0] == s[len(s) - 1]`, with no reversal anywhere in it and
     * no `reverse_num` to call, counted correctly on all eight. The middle
     * function then had nothing to delegate and the task's entire subject, the
     * `% 10` / `// 10` loop, was optional. It is the hole m2.p6 had one month
     * ago, in the same family.
     *
     * One number does not close it, because the shortcut has rungs: a learner
     * who writes two comparisons out by hand instead of one is still not
     * looping, and up to 1 000 000 two comparisons decide every input of five
     * digits or fewer — 12321 and 12021 and 12921 are all palindromes, so the
     * middle digit of a five-digit number never has to be looked at. So the
     * case pairs 1231, whose ends agree and whose middle pair does not, with
     * the six-digit 123421, whose outer TWO pairs agree and whose third does
     * not. 121 is in there so that answering "all of them" or "none of them"
     * is wrong too. Any program that stops after a fixed number of comparisons
     * answers 2 or 3 where the reversal answers 1.
     */
    id: "m3.l7.b7",
    type: "challenge",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "lists.traverse", "loops.while", "arith.remainder", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген бүтін сандар беріледі: саны 1-ден 50-ге дейін, әрқайсысы 0 мен 1 000 000 аралығында. Олардың нешеуі палиндром екенін шығар.\n" +
        "Сан палиндром деп аталады, егер оның цифрларын кері ретпен жазғанда дәл сол сан шықса: 121 және 7 — палиндром, 100 палиндром емес (кері жазылуы 1). 0 да палиндром деп саналады.\n" +
        "Үш функция жаз. `reverse_num(n)` цифрлары кері ретпен жазылған санды қайтарады. `is_pal(n)` `reverse_num`-ды шақырып, сан палиндром болса 1, болмаса 0 қайтарады. `count_pal(a)` тізімді қабылдап, әр элемент үшін `is_pal`-ды шақырады да, палиндромдардың санын қайтарады. Үшеуінің де ішінде `print` жоқ — жауапты негізгі бағдарлама шығарады.\n" +
        "`121 45 7 33 100` берілсе, жауап 3.",
      ru:
        "В одной строке через пробел даны целые числа: их от 1 до 50, каждое от 0 до 1 000 000. Выведи, сколько из них являются палиндромами.\n" +
        "Число называется палиндромом, если при записи его цифр в обратном порядке получается то же самое число: 121 и 7 — палиндромы, а 100 — нет (в обратном порядке это 1). Ноль тоже считается палиндромом.\n" +
        "Напиши три функции. `reverse_num(n)` возвращает число, записанное цифрами в обратном порядке. `is_pal(n)` вызывает `reverse_num` и возвращает 1, если число — палиндром, и 0 иначе. `count_pal(a)` принимает список, вызывает `is_pal` для каждого элемента и возвращает количество палиндромов. Ни в одной из трёх нет `print` — ответ печатает основная программа.\n" +
        "При вводе `121 45 7 33 100` ответ равен 3.",
    },
    referenceSolution:
      "def reverse_num(n):\n" +
      "    r = 0\n" +
      "    while n > 0:\n" +
      "        r = r * 10 + n % 10\n" +
      "        n = n // 10\n" +
      "    return r\n" +
      "\n" +
      "def is_pal(n):\n" +
      "    if reverse_num(n) == n:\n" +
      "        return 1\n" +
      "    return 0\n" +
      "\n" +
      "def count_pal(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        c = c + is_pal(x)\n" +
      "    return c\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(count_pal(nums))",
    cases: [
      { input: "121 45 7 33 100", expectedOutput: "3" },
      { input: "45 54", expectedOutput: "0" },
      { input: "0", expectedOutput: "1", hidden: true },
      { input: "10", expectedOutput: "0", hidden: true },
      { input: "1221 12321 1234", expectedOutput: "2", hidden: true },
      { input: "5 5 5", expectedOutput: "3", hidden: true },
      { input: "1000000 1", expectedOutput: "1", hidden: true },
      { input: "11 22 33 12", expectedOutput: "3", hidden: true },
      { input: "1231 121 123421", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY — «шешімді жазбаша қорғау міндетті» (p.6), and the written
     * half of the month's own check: «әр функцияның міндетін және параметр мен
     * return байланысын түсіндіру» (p.8).
     *
     * It is asked about the learner's OWN b6 solution rather than about a
     * program on the card, because a defence of somebody else's code is a
     * reading comprehension exercise. The second half — name three calls and
     * the answer expected from each — is the lesson's other objective in the
     * only form that can be marked: a test you cannot state the expected answer
     * for is not a test, it is running the program again.
     *
     * `m3.l6.b8` asks which of three functions can be tested without a
     * keyboard; this asks what those tests would actually be. The marking
     * points below name three inputs that between them cover the loop running
     * many times, once, and never, but any three defended values earn the
     * point — the criterion is that the expected answer was known in advance.
     *
     * Never machine-scored. Settles as `unknown` and is read by a teacher.
     */
    id: "m3.l7.b8",
    type: "explain",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["advanced"],
    prompt: {
      kk: "Өзің жазған шешімді қорғап жаз. Бірінші: `digit_sum` пен `count_above` функцияларының әрқайсысы нені қабылдайды және нені қайтарады — әрқайсысы туралы бір сөйлем. Екінші: есепті неге дәл осылай екіге бөлу дұрыс, бір ғана функциямен жазса не жоғалады? Үшінші: `digit_sum`-ды бағдарламадан бөлек тексеру үшін қандай үш шақыруды жазар едің және әрқайсысынан қандай жауап күтесің — жауаптарды шақырумен бірге жаз.",
      ru: "Защити своё решение письменно. Первое: что принимает и что возвращает каждая из функций `digit_sum` и `count_above` — по одному предложению на каждую. Второе: почему разделить задачу именно так правильно и что потеряется, если написать всё одной функцией? Третье: какие три вызова ты написал бы, чтобы проверить `digit_sum` отдельно от программы, и какой ответ ждёшь от каждого — напиши ожидаемый ответ рядом с вызовом.",
    },
    expectedPoints: [
      {
        kk: "`digit_sum` бір бүтін санды қабылдайды және бір сан қайтарады — сол санның цифрларының қосындысын. Ол ештеңе оқымайды және ештеңе шығармайды.",
        ru: "`digit_sum` принимает одно целое число и возвращает одно число — сумму его цифр. Она ничего не читает и ничего не выводит.",
      },
      {
        kk: "`count_above` екі нәрсені қабылдайды — тізімді және k шегін — және бір сан қайтарады: цифрлар қосындысы k-дан үлкен элементтердің саны. Ол цифрларды өзі санамайды, `digit_sum`-ды шақырады.",
        ru: "`count_above` принимает две вещи — список и порог k — и возвращает одно число: сколько элементов имеют сумму цифр больше k. Сама она цифры не считает, а вызывает `digit_sum`.",
      },
      {
        kk: "Бөлудің дұрыстығы — екі жұмыстың бір-бірінен тәуелсіз өзгеретінінде: шартты «цифрлар қосындысы» орнына басқа қасиетке ауыстырсаң, тек бір функция өзгереді, санау сол күйінде қалады. Бәрін бір функцияға жазсаң, цифр циклі мен санау циклі араласып, біреуін бөлек тексеру мүмкін болмай қалады.",
        ru: "Разделение верно потому, что две работы меняются независимо: если заменить «сумму цифр» на другое свойство, изменится только одна функция, а подсчёт останется прежним. Если написать всё в одной функции, цикл по цифрам и цикл подсчёта перемешаются и проверить что-то одно отдельно станет невозможно.",
      },
      {
        kk: "Үш шақыру мен күтілетін жауап бірге жазылған, мысалы: `digit_sum(34)` → 7 (қарапайым жағдай), `digit_sum(7)` → 7 (бір ғана цифр), `digit_sum(0)` → 0 (цикл бір рет те орындалмайды). Мәні — жауап шақыруды жазбас бұрын белгілі болуы: жауабы алдын ала белгісіз шақыру тексеру емес, жай ғана бағдарламаны қайта жіберу.",
        ru: "Три вызова записаны вместе с ожидаемым ответом, например: `digit_sum(34)` → 7 (обычный случай), `digit_sum(7)` → 7 (одна цифра), `digit_sum(0)` → 0 (цикл не выполняется ни разу). Важно, что ответ известен до того, как вызов написан: вызов, ответ которого заранее неизвестен, — это не проверка, а повторный запуск программы.",
      },
      {
        kk: "`digit_sum`-ды бөлек тексеруге болатын себебі — саны оған параметр арқылы келеді, сондықтан пернетақта да, бүкіл бағдарлама да қажет емес. Егер ол нәтижені `return` етпей, өзі шығарса, оны басқа функцияның ішінде салыстыруға да, бөлек тексеруге де болмас еді.",
        ru: "Проверить `digit_sum` отдельно можно потому, что число приходит к ней параметром — не нужны ни клавиатура, ни остальная программа. Если бы она не возвращала результат через `return`, а печатала его сама, её нельзя было бы ни сравнить внутри другой функции, ни проверить отдельно.",
      },
    ],
  },
];
