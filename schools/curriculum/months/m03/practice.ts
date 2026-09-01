import type { LessonBlock } from "../../types";

/**
 * m3.l9 · Өз бетіңмен шығар — November's independent practice set.
 *
 * Ten `write_code` blocks, no starter, no scaffold, nothing on screen but a
 * statement. This is where November pays into «шамамен 100 толық дербес шешім»
 * (p.11), and where the month's own «Айлық сынақ» sentence — «кемінде 2-3
 * функциядан тұратын бағдарламаны өз бетінше жазу» (p.8) — is rehearsed before
 * it is graded.
 *
 * Five decisions taken once, so no block below re-argues them.
 *
 * 1. **Every task is solved WITH functions, and every prompt says so in both
 *    languages.** That is the only thing separating this bank from October's:
 *    p1, p4 and p9 would all be perfectly good October problems written as one
 *    flat loop. So each prompt states what the function takes, what it must
 *    RETURN, and that the returning is not optional — «нәтижені функцияның
 *    ішінде шығарма», «ответ печатает основная программа». The programme's
 *    mastery line for the month is «параметр беру және return арқылы нәтиже
 *    қайтару», and a task that accepts a helper which prints has not asked for
 *    it.
 *
 * 2. **An output test cannot see a function definition.** A learner who ignores
 *    the instruction and writes one flat loop inside `main` passes p1 on every
 *    case. This is a real and known limit, and it is not papered over: the
 *    structural checking of «функцияға бөлу» belongs to the lessons — l1's
 *    reorder, l2's fill-blank, l3's modify twin — and to the monthly check,
 *    where a teacher reads the program.
 *
 *    What the cases CAN see is the second half of the instruction, and in C++
 *    they see it harder than they did in Python. A helper declared `void` that
 *    prints instead of returning does not produce a wrong answer here: in p2,
 *    p3, p7, p8 and p10 the caller feeds the result into arithmetic or a
 *    comparison, and `void` in an expression is a COMPILE error. The learner
 *    finds out before any case runs, which is the right time.
 *
 * 3. **Not a rerun of the lessons.** m3.l3.b8 already owns the repeated digit
 *    sum and m3.l3.b9 the first/second/equal verdict, so p3 keeps the named
 *    family — «цифрлар қосындысын функциямен есептеу» — and changes what is
 *    done with what came back: the returned value is arithmetic here, not a
 *    thing to compare and describe. m3.l1.b7 prints its even/odd verdict, so
 *    p2 returns 1/0 and makes the caller add the returns up, which is the
 *    exact gap l3 opens between printing and returning. Each block's comment
 *    names the lesson task it is standing apart from.
 *
 * 4. **Every list states its own length.** Python read a countless line with
 *    `input().split()`; C++ has no equivalent inside November's vocabulary,
 *    because reading to end-of-file wants `while (cin >> x)` — a stream used as
 *    a truth value, which the September pedagogy explicitly rules out. So a
 *    list arrives as `n` and then `n` values, read into a `vector<int>` of that
 *    size, and every prompt says so. Words keep the shape they had: a count,
 *    then one word per line, because a word count is what makes «функцияны
 *    бірнеше рет шақыру» a loop instead of three copied calls. p3 and p10 read
 *    fixed numbers of values and need no count at all. Every prompt guarantees
 *    at least one element: `a[0]` on an empty vector is undefined behaviour,
 *    not a lesson.
 *
 * 5. **Nothing December owns.** No `<algorithm>`, no `sort`, no `max_element`,
 *    no `accumulate`. p4 asks the learner to WRITE the maximum and p8 to write
 *    both ends, which is the programme's «максимум мен минимум функциясы» — a
 *    library call here would delete the task, and the two prompts that could
 *    tempt one say so.
 *
 * ## Tracks
 *
 * p1–p8 are shown to every route, support included. The programme asks support
 * for «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ» across
 * the month, and November's lessons already carry that substitution at every
 * `s` id; a support learner who has assembled a dozen scaffolded twins still
 * has to write something alone by the end of the month, or the month never
 * asked them to. p9 adds a function that returns a NEW LIST (core and
 * advanced) and p10 is the only block where one helper calls another
 * (advanced).
 *
 * ## No diagnostic mappings
 *
 * A `write_code` answer is a program, not one of a fixed set of strings, so
 * there is no wrong answer here that a mapping could name — and inventing one
 * would be the exact thing `types.ts` argues against. The failure classes
 * these tasks are built to expose are named in the case comments instead,
 * where a human reviewer can check them against the cases that catch them.
 */
export const M3_PRACTICE: LessonBlock[] = [
  {
    /*
     * Rung 1, and deliberately the easiest problem in the bank: the whole
     * difficulty is structural. The learner already summed a list in October;
     * what is new is that the loop now lives behind a name, takes the list as a
     * `vector<int>` parameter and hands one number back. Called exactly once,
     * which is honest — this is the shape of every helper they will write for
     * the rest of the year.
     *
     * The family is p.8's «тізімді өңдейтін көмекші функциялар», stated plainly.
     */
    id: "m3.p1",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан. Олардың қосындысын шығар. Шешімде кемінде бір функция болуы керек: `vector<int>` тізімін параметр ретінде қабылдап, қосындыны `return` арқылы қайтаратын функция жаз. Функцияның ішінде ештеңе шығарма — жауапты `main` шығарады. Мысалы, n = 4 және `1 2 3 4` үшін жауап 10.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел. Выведи их сумму. В решении должна быть хотя бы одна функция: напиши функцию, которая принимает список `vector<int>` параметром и возвращает сумму через `return`. Внутри функции ничего не выводи — ответ печатает `main`. Например, при n = 4 и числах `1 2 3 4` ответ 10.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int list_sum(vector<int> a) {\n" +
      "    int s = 0;\n" +
      "    for (int x : a) {\n" +
      "        s = s + x;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << list_sum(a) << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n1 2 3 4", expectedOutput: "10" },
      /* One element: the loop body runs once and the accumulator must already
         exist. `s = a[0]` before a loop over all of `a` doubles it to 14. */
      { input: "1\n7", expectedOutput: "7", hidden: true },
      /* Every term negative, so "is the answer positive" tells the learner
         nothing and `s = 0` has to be reasoned about rather than checked. */
      { input: "3\n-5 -1 -3", expectedOutput: "-9", hidden: true },
      /* The sum is 0 while the list is not empty — a program that never
         entered the loop prints the same thing, so this case leans on the
         two around it rather than standing alone. */
      { input: "2\n5 -5", expectedOutput: "0", hidden: true },
      /* The last element carries the whole answer: a traversal written as
         `i < n - 1` prints 0. */
      { input: "4\n0 0 0 9", expectedOutput: "9", hidden: true },
      { input: "4\n-1 -2 -3 -4", expectedOutput: "-10", hidden: true },
    ],
  },
  {
    /*
     * Rung 2. PDF p.8 family «санның қасиетін тексеретін функция». m3.l1.b7
     * writes the same even/odd test as a `void` function that PRINTS its
     * verdict — that was l1's only option, since returning a value did not
     * exist yet. Here the function returns 1 or 0 and the caller adds the
     * returns up, which is the gap m3.l3 spends its concept block on: a printed
     * verdict cannot be counted, a returned one can.
     *
     * The 1/0 convention is stated in the prompt rather than left to the
     * learner, because the caller's `k = k + is_even(x);` only reads as obvious
     * once you know the function hands back a number. A learner who leaves the
     * helper `void` does not get a wrong count here — the program does not
     * compile, which is the loudest form this instruction can take.
     */
    id: "m3.p2",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "loops.counter", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан. Олардың ішінде неше жұп сан бар екенін шығар. Бір санды параметр ретінде қабылдайтын функция жаз: сан жұп болса 1, тақ болса 0 қайтарсын — дәл `return` арқылы, `cout` арқылы емес, сондықтан оның түрі `void` емес, `int` болады. `main` функцияны әр санға шақырып, қайтқан мәндерді қосады. Нөл жұп сан болып саналады, тізімде теріс сандар да кездеседі. Мысалы, n = 6 және `1 2 3 4 5 6` үшін жауап 3.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел. Выведи, сколько среди них чётных. Напиши функцию, которая принимает одно число параметром и возвращает 1, если оно чётное, и 0, если нечётное — именно через `return`, а не через `cout`, поэтому её тип не `void`, а `int`. `main` вызывает функцию для каждого числа и складывает возвращённые значения. Ноль считается чётным, в списке встречаются и отрицательные числа. Например, при n = 6 и числах `1 2 3 4 5 6` ответ 3.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int is_even(int n) {\n" +
      "    if (n % 2 == 0) {\n" +
      "        return 1;\n" +
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
      "    int k = 0;\n" +
      "    for (int x : a) {\n" +
      "        k = k + is_even(x);\n" +
      "    }\n" +
      "    cout << k << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "6\n1 2 3 4 5 6", expectedOutput: "3" },
      /* Nothing to count, and the counter must exist before the loop. */
      { input: "1\n7", expectedOutput: "0", hidden: true },
      /* Zero is even and −4 is even: a learner who reasoned "even means
         positive and divisible by two" answers 0 here. The negatives also
         carry the C++ remainder rule — `-3 % 2` is `-1`, not Python's `1` —
         so a test written as `n % 2 == 1` for odd calls -3 EVEN and answers 3. */
      { input: "4\n0 -4 -3 9", expectedOutput: "2", hidden: true },
      /* Every element qualifies — kills `k = is_even(x);`, which keeps only
         the last verdict and answers 1. */
      { input: "3\n2 4 6", expectedOutput: "3", hidden: true },
      /* Nothing qualifies — kills a function whose `return 0;` is unreachable
         because it sits inside the `if`. */
      { input: "3\n1 3 5", expectedOutput: "0", hidden: true },
      /* A single negative even number. */
      { input: "1\n-2", expectedOutput: "1", hidden: true },
      /* The only even number is the last one: kills a caller that stops one
         element short. */
      { input: "4\n1 3 5 8", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * Rung 3. PDF p.8 family «цифрлар қосындысын функциямен есептеу», called
     * twice. m3.l3.b9 also calls a digit-sum function on two numbers, and the
     * difference is deliberate: there the returned values are compared and the
     * program prints a WORD, here they are the answer itself and one of them
     * has to be chosen. That is the first place in the bank where what came
     * back out of a function is a number to compute with rather than a verdict
     * to describe.
     *
     * Two numbers on one line, so this block needs no count. The bound is
     * 1 000 000 000, which is inside `int` — checked rather than inherited,
     * because Python had no reason to care and the next power of ten would not
     * fit.
     *
     * `product-authored`, following m3.l3.b9's precedent: the programme names
     * the digit-sum function, not the two-number framing built on top of it.
     *
     * A learner who compares a and b instead of their digit sums is the
     * mutant worth killing, and `5 91` is chosen to make that shortcut look
     * right — b is larger AND has the larger digit sum — while
     * `999999999 1000000000` breaks it.
     */
    id: "m3.p3",
    bank: {
      role: "extra_practice",
      why:
        "The same digit-sum helper over the same two numbers from the same input line, on the same eight test inputs as m3.l3.b9. What changes is that the caller prints the larger sum instead of a verdict word, and m3.l3.b8 already establishes writing digit_sum from nothing on every route.",
    },
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "arith.remainder", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда екі бүтін сан a және b беріледі (0 ≤ a, b ≤ 1 000 000 000). Санның цифрлар қосындысын `return` арқылы қайтаратын функция жаз — нәтижені функцияның ішінде шығарма. Сол функцияны екі санға да шақырып, шыққан екі қосындының үлкенін шығар. Қосындылар тең болса, сол ортақ мәнді шығар. Мысалы, `407 23` үшін цифрлар қосындылары 11 мен 5, сондықтан жауап 11.",
      ru: "В одной строке даны два целых числа a и b (0 ≤ a, b ≤ 1 000 000 000). Напиши функцию, которая возвращает сумму цифр числа через `return` — внутри функции результат не выводи. Вызови её для обоих чисел и выведи большую из двух полученных сумм. Если суммы равны, выведи это общее значение. Например, для `407 23` суммы цифр равны 11 и 5, поэтому ответ 11.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    int s = 0;\n" +
      "    while (n > 0) {\n" +
      "        s = s + n % 10;\n" +
      "        n = n / 10;\n" +
      "    }\n" +
      "    return s;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    int x = digit_sum(a);\n" +
      "    int y = digit_sum(b);\n" +
      "    if (x > y) {\n" +
      "        cout << x << endl;\n" +
      "    } else {\n" +
      "        cout << y << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "407 23", expectedOutput: "11" },
      /* The larger sum belongs to the second number, and b is also the larger
         number — the case that makes "just compare a and b" look correct. */
      { input: "5 91", expectedOutput: "10", hidden: true },
      /* Same numbers, opposite direction: a is a billion and b is 100, and
         both digit sums are 1, so comparing the numbers still prints 1 while
         comparing the wrong thing on the next case does not. */
      { input: "1000000000 100", expectedOutput: "1", hidden: true },
      /* a < b but the digit sums go the other way: 81 against 1. This is the
         case the number-comparison shortcut cannot survive. */
      { input: "999999999 1000000000", expectedOutput: "81", hidden: true },
      /* Equal sums on different numbers — the branch that has to print a
         value rather than fall through and print nothing. */
      { input: "12 30", expectedOutput: "3", hidden: true },
      /* Both zero: `while (n > 0)` never runs, so the accumulator's initial
         value is the whole answer. A function starting at `s = 1` prints 1. */
      { input: "0 0", expectedOutput: "0", hidden: true },
      { input: "0 1", expectedOutput: "1", hidden: true },
      { input: "19 91", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * Rung 4. PDF p.8 family «максимум мен минимум функциясы» — the maximum
     * half. October wrote this as a bare traversal; the November version has to
     * hand the answer back, which is what makes it reusable and what p8 then
     * reuses.
     *
     * The library is named as forbidden in both prompts because `max_element`
     * is December's, and because a learner who reaches for it has skipped the
     * only part of the task that carries evidence.
     */
    id: "m3.p4",
    bank: {
      role: "extra_practice",
      why:
        "m3.l8.b6 is the programme's own «максимум мен минимум функциясы» and already asks every route to write largest(a) from nothing plus its mirror, over the same boundaries — singleton, all equal, all negative, extreme at each end — under the same ban on library calls. This asks for half of that program. m3.l8.b5 has already fixed the start value and the comparison direction.",
    },
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "lists.index", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан. Ең үлкенін шығар. Тізімді параметр ретінде қабылдап, ең үлкен элементті `return` арқылы қайтаратын функция жаз; шығаруды `main` істейді. `<algorithm>` кітапханасын және `max_element` сияқты дайын функцияларды қолдануға болмайды — элементтерді циклмен қарап шық. Сандар теріс те болуы мүмкін. Мысалы, n = 4 және `3 9 5 1` үшін жауап 9.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел. Выведи наибольшее из них. Напиши функцию, которая принимает список параметром и возвращает наибольший элемент через `return`; выводит ответ `main`. Библиотекой `<algorithm>` и готовыми функциями вроде `max_element` пользоваться нельзя — пройди по элементам циклом. Числа могут быть и отрицательными. Например, при n = 4 и числах `3 9 5 1` ответ 9.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int list_max(vector<int> a) {\n" +
      "    int m = a[0];\n" +
      "    int n = a.size();\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] > m) {\n" +
      "            m = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    return m;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << list_max(a) << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 9 5 1", expectedOutput: "9" },
      /* One element: the loop never turns, so the answer is entirely the
         initial value. */
      { input: "1\n7", expectedOutput: "7", hidden: true },
      /* All negative. `m = 0` returns a number that is not in the list, which
         is p.7's «жинақтаушы айнымалыға қате бастапқы мән беру» surviving
         into November. */
      { input: "3\n-9 -3 -7", expectedOutput: "-3", hidden: true },
      /* Every element equal: nothing is ever strictly greater, so the initial
         value has to be right on its own. */
      { input: "4\n4 4 4 4", expectedOutput: "4", hidden: true },
      /* The maximum sits at the last position — kills `i < n - 1`. */
      { input: "4\n2 3 4 10", expectedOutput: "10", hidden: true },
      /* And at the first — kills `m = a[1]` and a loop that starts at 2. */
      { input: "4\n10 2 3 4", expectedOutput: "10", hidden: true },
      { input: "3\n-1 -1 -1", expectedOutput: "-1", hidden: true },
    ],
  },
  {
    /*
     * Rung 5, the first string task. PDF p.8 family «мәтінге арналған
     * тексерулер», and October's «сөздегі дауыстылар саны» (p.7) written the
     * November way: the count comes back out of a function, and the function
     * is called once per word rather than once per program — «функцияны
     * бірнеше рет шақыру» from the mastery paragraph, driven by a loop.
     *
     * The n-then-n-lines format is what makes the repeated call a loop instead
     * of three copied calls, and it is stated exactly in both prompts.
     *
     * The vowel test is five `||` comparisons against `char` literals in single
     * quotes. C++ has no `in`, and `"aeiou"` in double quotes is a string, not
     * a letter — the distinction m3.l8.b1 introduced and this is where it is
     * first spent unaided.
     */
    id: "m3.p5",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "strings.sequence", "loops.counter"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 10). Келесі n жолдың әрқайсысында бір сөз: тек кіші латын әріптері, бос орынсыз. Әр сөзде неше дауысты әріп бар екенін жеке жолға шығар. Дауыстылар — `a`, `e`, `i`, `o`, `u`; бір әріпті `'a'` деп бір тырнақшамен салыстырады. `string` сөзді параметр ретінде қабылдап, дауыстылар санын `return` арқылы қайтаратын функция жаз және оны әр сөз үшін бір рет шақыр; санауды функцияның ішінде шығарма. Мысалы, `banana` үшін жауап 3, `sky` үшін 0.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 10). В каждой из следующих n строк дано одно слово: только строчные латинские буквы, без пробелов. Для каждого слова выведи на отдельной строке, сколько в нём гласных букв. Гласные — `a`, `e`, `i`, `o`, `u`; отдельная буква сравнивается в одинарных кавычках, как `'a'`. Напиши функцию, которая принимает слово (`string`) параметром и возвращает количество гласных через `return`, и вызови её по одному разу для каждого слова; внутри функции ничего не выводи. Например, для `banana` ответ 3, для `sky` — 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int vowel_count(string w) {\n" +
      "    int k = 0;\n" +
      "    for (char ch : w) {\n" +
      "        if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {\n" +
      "            k = k + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return k;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        string w;\n" +
      "        cin >> w;\n" +
      "        cout << vowel_count(w) << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\nbanana\nsky\nkazakhstan", expectedOutput: "3\n0\n3" },
      /* Every letter is a vowel, and the word is the last one read — kills a
         walk that stops one character short, which answers 4. */
      { input: "1\naeiou", expectedOutput: "5", hidden: true },
      /* A one-letter word with no vowel: the counter must exist and be
         returned even when the `if` never fires. */
      { input: "1\nz", expectedOutput: "0", hidden: true },
      /* Three identical one-letter words. A learner who kept the counter
         OUTSIDE the function — the scope error m3.l4 and m3.l5 are about —
         prints 1, 2, 3 instead of 1, 1, 1. */
      { input: "3\na\na\na", expectedOutput: "1\n1\n1", hidden: true },
      /* First and last letters are both vowels at once. */
      { input: "1\nalma", expectedOutput: "2", hidden: true },
      /* A word with no vowels followed by a word that is all vowels: the
         second call must not inherit anything from the first. */
      { input: "2\nrhythm\naaaa", expectedOutput: "0\n4", hidden: true },
      { input: "2\nabcdefghij\nastana", expectedOutput: "3\n3", hidden: true },
    ],
  },
  {
    /*
     * Rung 6. PDF p.8 family «мәтінге арналған тексерулер» again, and October's
     * «палиндромды тексеру» (p.7) with the division of labour November adds:
     * the function decides and returns 1 or 0, the main program turns that into
     * a word. Keeping `yes`/`no` OUT of the function is the instruction that
     * matters — a helper that prints the verdict itself cannot be called from
     * a loop that also has to count, and l3 already made that argument.
     *
     * The `return 0;` inside the `while` is the month's «return-тен кейін код
     * орындалмайды» doing real work: the walk stops at the first mismatch.
     *
     * Output tokens are English and both prompts name both, because a
     * program's output is one string for both language tracks.
     */
    id: "m3.p6",
    bank: {
      role: "extra_practice",
      why:
        "m3.l8.b7 already requires is_palindrome(word) returning 1/0 with the caller owning yes/no, across the same boundaries: the one-letter word whose loop never runs, even and odd lengths, ends matching where the middle does not. m3.p5 already establishes calling a returning helper once per line of input and already catches state leaking between calls. This is the two of them together.",
    },
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "strings.sequence", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 10). Келесі n жолдың әрқайсысында бір сөз: тек кіші латын әріптері, бос орынсыз. Әр сөз палиндром ба, яғни басынан оқығанда да, соңынан оқығанда да бірдей ме? Палиндром болса `yes`, болмаса `no` деген ағылшын сөзін жеке жолға шығар. `string` сөзді қабылдап, палиндром болса 1, болмаса 0 қайтаратын функция жаз — функцияның өзі ештеңе шығармайды, `yes` бен `no` сөздерін `main` жазады. Бір әріптен тұратын сөз әрқашан палиндром. Мысалы, `level` үшін `yes`, `asel` үшін `no`.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 10). В каждой из следующих n строк дано одно слово: только строчные латинские буквы, без пробелов. Является ли слово палиндромом, то есть читается ли оно одинаково с начала и с конца? Для каждого слова выведи на отдельной строке английское слово `yes` или `no`. Напиши функцию, которая принимает слово (`string`) и возвращает 1, если это палиндром, и 0, если нет — сама функция ничего не выводит, слова `yes` и `no` печатает `main`. Слово из одной буквы всегда палиндром. Например, для `level` — `yes`, для `asel` — `no`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int is_palindrome(string w) {\n" +
      "    int i = 0;\n" +
      "    int j = w.size() - 1;\n" +
      "    while (i < j) {\n" +
      "        if (w[i] != w[j]) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "        i = i + 1;\n" +
      "        j = j - 1;\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    for (int k = 0; k < n; k++) {\n" +
      "        string w;\n" +
      "        cin >> w;\n" +
      "        if (is_palindrome(w) == 1) {\n" +
      '            cout << "yes" << endl;\n' +
      "        } else {\n" +
      '            cout << "no" << endl;\n' +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\nlevel\nasel\nabba", expectedOutput: "yes\nno\nyes" },
      /* One letter: `j` starts at 0, the loop never runs, and the answer is
         the value returned after it. A function that returns 0 by default and
         only sets 1 inside the loop answers no. */
      { input: "1\na", expectedOutput: "yes", hidden: true },
      /* Two letters, the smallest real comparison, both ways. */
      { input: "2\naa\nab", expectedOutput: "yes\nno", hidden: true },
      /* `abca` matches at the ends and fails one step in — kills a function
         that compares only the first and last letters. `abcba` is the odd
         length that must survive the middle character. */
      { input: "2\nabca\nabcba", expectedOutput: "no\nyes", hidden: true },
      /* A `no` before a `yes`. A learner who kept the flag outside the
         function, or who never reset it, answers no twice. */
      { input: "2\nabc\naba", expectedOutput: "no\nyes", hidden: true },
      /* The mismatch is at the very last pair — kills a walk that stops one
         step early. */
      { input: "1\nabcdcbx", expectedOutput: "no", hidden: true },
      { input: "3\nnoon\nastana\nz", expectedOutput: "yes\nno\nyes", hidden: true },
    ],
  },
  {
    /*
     * Rung 7, and the first task where a helper is called from inside a search.
     * October's «бөлгіштер саны» (p.7) is the sub-problem; the November work is
     * that the count is computed by a function and the main program ranks a
     * list by calling it repeatedly — «функцияны бірнеше рет шақыру» with a
     * different argument each time.
     *
     * `product-authored`: the divisor count is October's named family and the
     * ranking framing is invented to give the helper somewhere to be used.
     *
     * The output is the VALUE and its divisor count, two tokens, and that is a
     * deliberate strengthening rather than decoration. Printing only the value
     * makes the helper untestable: a loop from 1 to n-1 and one from 2 to n
     * both undercount every number by exactly one, the ranking is unchanged,
     * and no case could ever catch either. Printing the count as well kills
     * both on the first case.
     */
    id: "m3.p7",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "arith.remainder", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан, әрқайсысы 1-ден 1000-ға дейін. Бөлгіштері ең көп санды тап. Жауапты бір жолға шығар: алдымен сол санның өзі, содан кейін оның бөлгіштерінің саны, арасы бос орын. Бөлгіштерінің саны бірдей бірнеше сан болса, тізімде ең сол жақта тұрғанын ал. Санды параметр ретінде қабылдап, оның бөлгіштерінің санын `return` арқылы қайтаратын функция жаз және оны әр элемент үшін шақыр; 1 де, санның өзі де бөлгіш болып саналады. Мысалы, n = 4 және `6 7 12 5` үшін жауап `12 6`.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел, каждое от 1 до 1000. Найди число с наибольшим количеством делителей. Ответ выведи в одну строку: сначала само число, затем количество его делителей, через пробел. Если таких чисел несколько, возьми самое левое в списке. Напиши функцию, которая принимает число параметром и возвращает количество его делителей через `return`, и вызывай её для каждого элемента; 1 и само число тоже считаются делителями. Например, при n = 4 и числах `6 7 12 5` ответ `12 6`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int divisor_count(int n) {\n" +
      "    int c = 0;\n" +
      "    for (int d = 1; d <= n; d++) {\n" +
      "        if (n % d == 0) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = a[0];\n" +
      "    int bc = divisor_count(a[0]);\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        int c = divisor_count(a[i]);\n" +
      "        if (c > bc) {\n" +
      "            bc = c;\n" +
      "            best = a[i];\n" +
      "        }\n" +
      "    }\n" +
      '    cout << best << " " << bc << endl;\n' +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n6 7 12 5", expectedOutput: "12 6" },
      /* One element, the number 1. Both off-by-one bounds in the helper die
         here: a loop from 1 to n-1 is empty and prints `1 0`, and one from 2
         to n misses the only divisor and prints `1 0` too. */
      { input: "1\n1", expectedOutput: "1 1", hidden: true },
      /* Three primes, all tied at two divisors. `>=` in the comparison takes
         the last one and answers `3 2`. */
      { input: "3\n7 5 3", expectedOutput: "7 2", hidden: true },
      /* Every element equal — the tie rule again, with nothing to distinguish
         the candidates. 4 is a perfect square, so 2 must be counted once. */
      { input: "3\n4 4 4", expectedOutput: "4 3", hidden: true },
      /* The winner is the last element: kills `i < n - 1`. */
      { input: "2\n5 12", expectedOutput: "12 6", hidden: true },
      /* And the first: kills a search that starts from `best = a[1]`. */
      { input: "2\n12 5", expectedOutput: "12 6", hidden: true },
      /* The stated maximum, and the two are close enough that a wrong helper
         cannot bluff: 1000 has 16 divisors, 999 has 8. */
      { input: "2\n1000 999", expectedOutput: "1000 16", hidden: true },
      { input: "4\n1 2 3 4", expectedOutput: "4 3", hidden: true },
    ],
  },
  {
    /*
     * Rung 8, and the rehearsal for the monthly check: PDF p.8 asks the
     * learner to write «кемінде 2-3 функциядан тұратын бағдарлама», and this is
     * the first block in the bank where two functions live in one program.
     * It is also the programme's «максимум мен минимум функциясы» stated in
     * full, with the two halves as two separate helpers rather than one
     * two-answer traversal — which is exactly what October's version was, and
     * what makes this the November one.
     *
     * The subtraction is what forces both returns to be used at once, and in
     * C++ it is also what makes a `void` helper impossible: `list_max(a) -
     * list_min(a)` with either function declared `void` does not compile.
     */
    id: "m3.p8",
    bank: {
      role: "extra_practice",
      why:
        "The same two helpers over the same one-line list, the same forbidden library calls, the same boundary families as m3.l8.b6. Only the caller's last line differs — a subtraction rather than the two returned values printed side by side — and m3.l8.b6 already requires both returns to be consumed in a single expression.",
    },
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан. Ең үлкен және ең кіші элементтердің айырмасын шығар. Екі функция жаз: біреуі тізімнің ең кішісін, екіншісі ең үлкенін `return` арқылы қайтарсын. Айырманы `main` екі функция қайтарған мәндерден есептейді — функциялардың ішінде ештеңе шығарылмайды. `<algorithm>` мен дайын `min_element`/`max_element` қолдануға болмайды. Мысалы, n = 4 және `3 9 5 1` үшін жауап 8, ал n = 1 және `7` үшін жауап 0.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел. Выведи разность между наибольшим и наименьшим элементами. Напиши две функции: одна возвращает наименьший элемент списка, другая — наибольший, обе через `return`. Разность `main` считает из значений, которые вернули функции — внутри функций ничего не выводится. Пользоваться `<algorithm>` и готовыми `min_element`/`max_element` нельзя. Например, при n = 4 и числах `3 9 5 1` ответ 8, а при n = 1 и числе `7` ответ 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int list_min(vector<int> a) {\n" +
      "    int m = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x < m) {\n" +
      "            m = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return m;\n" +
      "}\n" +
      "\n" +
      "int list_max(vector<int> a) {\n" +
      "    int m = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x > m) {\n" +
      "            m = x;\n" +
      "        }\n" +
      "    }\n" +
      "    return m;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    cout << list_max(a) - list_min(a) << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 9 5 1", expectedOutput: "8" },
      /* One element is both ends at once, so the answer is 0. */
      { input: "1\n7", expectedOutput: "0", hidden: true },
      /* All negative: `m = 0` in either helper produces a difference that is
         not the width of the data. */
      { input: "3\n-9 -3 -7", expectedOutput: "6", hidden: true },
      /* Every element equal — both helpers must return the same value and the
         difference must be exactly 0, not 1 and not the element itself. */
      { input: "4\n4 4 4 4", expectedOutput: "0", hidden: true },
      /* The maximum is last and the minimum first. */
      { input: "4\n1 2 3 100", expectedOutput: "99", hidden: true },
      /* And now the other way round — between them these two kill a traversal
         that skips either end. */
      { input: "4\n100 3 2 1", expectedOutput: "99", hidden: true },
      /* The two ends straddle zero: swapping the subtraction prints -10. */
      { input: "2\n-5 5", expectedOutput: "10", hidden: true },
      { input: "2\n0 0", expectedOutput: "0", hidden: true },
    ],
  },
  {
    /*
     * Rung 9. CORE AND ADVANCED. Every function in the bank so far returned one
     * number; this one returns a `vector<int>`, which is the shape the rest of
     * the year leans on and the plainest reading of p.8's «тізімді өңдейтін
     * көмекші функциялар». `product-authored` all the same: the family is
     * named, the predicate is not.
     *
     * The predicate is «кем дегенде бір саннан кіші», not «көршісінен кіші»,
     * and the difference is the whole difficulty — a running maximum has to be
     * carried along, and the obvious misreading (compare with the neighbour on
     * the left) is a different program. `9 1 2 3` separates them: the correct
     * answer is `1 2 3`, the neighbour reading answers `1` alone. Both prompts
     * carry that example for exactly this reason.
     *
     * The empty answer prints the English token `none`, named in both prompts:
     * a task whose correct output is an empty line teaches a learner to
     * distrust their own program.
     */
    id: "m3.p9",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "lists.index"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан. Өзінен бұрын тұрған кем дегенде бір саннан ҚАТАҢ кіші болатын барлық элементті тап. Оларды тізімдегі ретімен, бір жолға бос орынмен бөліп шығар. Ондай элемент болмаса, `none` деген ағылшын сөзін шығар. Тізімді параметр ретінде қабылдап, осындай элементтерден тұратын ЖАҢА тізім (`vector<int>`) қайтаратын функция жаз; шығаруды `main` істейді. Мысалы, n = 8 және `3 1 4 1 5 9 2 6` үшін жауап `1 1 2 6`. Ал n = 4 және `9 1 2 3` үшін жауап `1 2 3`, өйткені 1, 2 және 3-тің әрқайсысынан бұрын 9 тұр — тек сол жақтағы көршімен ғана емес, бұрынғы кез келген санмен салыстыру керек.",
      ru: "В первой строке дано n (1 ≤ n ≤ 100), во второй — n целых чисел через пробел. Найди все элементы, которые СТРОГО меньше хотя бы одного числа, стоящего раньше них. Выведи их в одну строку через пробел в том же порядке, в каком они идут в списке. Если таких элементов нет, выведи английское слово `none`. Напиши функцию, которая принимает список параметром и возвращает НОВЫЙ список (`vector<int>`) из таких элементов; выводит ответ `main`. Например, при n = 8 и числах `3 1 4 1 5 9 2 6` ответ `1 1 2 6`. А при n = 4 и числах `9 1 2 3` ответ `1 2 3`, потому что перед каждым из 1, 2 и 3 стоит 9 — сравнивать нужно не только с левым соседом, а с любым из предыдущих чисел.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "vector<int> smaller_than_earlier(vector<int> a) {\n" +
      "    vector<int> res;\n" +
      "    int big = a[0];\n" +
      "    int n = a.size();\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] < big) {\n" +
      "            res.push_back(a[i]);\n" +
      "        }\n" +
      "        if (a[i] > big) {\n" +
      "            big = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    return res;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> r = smaller_than_earlier(a);\n" +
      "    int m = r.size();\n" +
      "    if (m == 0) {\n" +
      '        cout << "none" << endl;\n' +
      "    } else {\n" +
      "        for (int i = 0; i < m; i++) {\n" +
      "            if (i > 0) {\n" +
      '                cout << " ";\n' +
      "            }\n" +
      "            cout << r[i];\n" +
      "        }\n" +
      "        cout << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "8\n3 1 4 1 5 9 2 6", expectedOutput: "1 1 2 6" },
      /* The discriminating case: the neighbour misreading answers `1`. */
      { input: "4\n9 1 2 3", expectedOutput: "1 2 3", hidden: true },
      /* One element: the loop never runs, the list comes back empty, and the
         caller must still print something. */
      { input: "1\n5", expectedOutput: "none", hidden: true },
      /* Strictly increasing: nothing qualifies. */
      { input: "4\n1 2 3 4", expectedOutput: "none", hidden: true },
      /* All equal — equal is not smaller, so `<=` answers `4 4` here. */
      { input: "3\n4 4 4", expectedOutput: "none", hidden: true },
      /* Strictly decreasing: everything after the first qualifies. */
      { input: "4\n4 3 2 1", expectedOutput: "3 2 1", hidden: true },
      /* Only the last element qualifies — kills a loop that stops one step
         short, which answers `none`. */
      { input: "4\n1 2 3 0", expectedOutput: "0", hidden: true },
      /* The shortest pair in each direction. */
      { input: "2\n2 1", expectedOutput: "1", hidden: true },
      { input: "2\n1 2", expectedOutput: "none", hidden: true },
      /* A dip that recovers without exceeding the running maximum: 7 is
         smaller than the earlier 8 even though it is larger than the 2 just
         before it, so a program tracking the previous element misses it. */
      { input: "4\n8 2 7 9", expectedOutput: "2 7", hidden: true },
    ],
  },
  {
    /*
     * Rung 10. ADVANCED ONLY. The only block in the bank where one function
     * calls another, which is the PDF's «бірнеше функциядан тұратын шағын
     * бағдарлама» and the shape the monthly check asks for. `is_prime` is
     * p.8's «санның қасиетін тексеретін функция»; `count_primes_below` is the
     * program that uses it and never repeats its reasoning.
     *
     * n is bounded at 1000 on purpose. The primality test this month has
     * actually taught is trial division over every candidate divisor, and at
     * n = 1000 that is well under a second — a bound that forced the learner
     * to discover `d * d <= n` would be setting a task the month has not
     * taught and failing them on the timer for it.
     *
     * The boundary is stated twice, in both prompts: primes STRICTLY below n,
     * and 1 is not prime. Both are places a correct-looking program is wrong
     * by exactly one, and n = 2 and n = 3 are the hidden cases that say so.
     */
    id: "m3.p10",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "loops.while", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бүтін сан n беріледі (1 ≤ n ≤ 1000). n-нен ҚАТАҢ кіші неше жай сан бар екенін шығар. Екі функция жаз: біріншісі бір санды қабылдап, ол жай сан болса 1, болмаса 0 қайтарсын; екіншісі n-ді қабылдап, бірінші функцияны шақыра отырып, жай сандардың санын қайтарсын. Екеуінің де түрі `int`, екеуі де нәтижені `return` арқылы қайтарады және ішінде `cout` жоқ. Жай сан деп 1-ден үлкен, әрі 1-ден және өзінен басқа бөлгіші жоқ санды айтамыз; 1 жай сан емес. Мысалы, n = 10 үшін жауап 4 — бұл 2, 3, 5 және 7.",
      ru: "Дано целое число n (1 ≤ n ≤ 1000). Выведи, сколько простых чисел СТРОГО меньше n. Напиши две функции: первая принимает число и возвращает 1, если оно простое, и 0, если нет; вторая принимает n и, вызывая первую, возвращает количество простых чисел. У обеих тип `int`, обе возвращают результат через `return` и внутри не используют `cout`. Простое число — это число больше 1, у которого нет делителей, кроме 1 и самого себя; 1 простым не считается. Например, при n = 10 ответ 4 — это 2, 3, 5 и 7.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int is_prime(int n) {\n" +
      "    if (n < 2) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int d = 2;\n" +
      "    while (d < n) {\n" +
      "        if (n % d == 0) {\n" +
      "            return 0;\n" +
      "        }\n" +
      "        d = d + 1;\n" +
      "    }\n" +
      "    return 1;\n" +
      "}\n" +
      "\n" +
      "int count_primes_below(int n) {\n" +
      "    int c = 0;\n" +
      "    for (int x = 2; x < n; x++) {\n" +
      "        c = c + is_prime(x);\n" +
      "    }\n" +
      "    return c;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    cout << count_primes_below(n) << endl;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "10", expectedOutput: "4" },
      /* n = 1: the counting loop is empty and the answer is the initial 0.
         This case passes for a program that never calls the inner function at
         all, which is why n = 3 is here too. */
      { input: "1", expectedOutput: "0", hidden: true },
      /* The boundary. 2 is prime but it is not STRICTLY below 2, so an
         inclusive loop answers 1. */
      { input: "2", expectedOutput: "0", hidden: true },
      /* One prime below 3, and the first case where the inner function is
         actually called: an inclusive loop answers 2, and a program that
         counts 1 as prime answers 2 as well. */
      { input: "3", expectedOutput: "1", hidden: true },
      { input: "4", expectedOutput: "2", hidden: true },
      /* 9 is below 11, so a primality test that only rejects even numbers
         counts 9 and answers 5; and 11 is itself prime, so a solution that
         loops to n inclusive answers 5 as well. */
      { input: "11", expectedOutput: "4", hidden: true },
      { input: "100", expectedOutput: "25", hidden: true },
      /* The stated maximum, and the case that fails a solution too slow to
         finish. */
      { input: "1000", expectedOutput: "168", hidden: true },
    ],
  },
];
