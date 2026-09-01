import type { LessonBlock } from "../../types";

/**
 * m2.l10 · Өз бетіңмен шығар — October's independent practice set.
 *
 * These ten are where the programme's «шамамен 100 толық дербес шешім» (p.11)
 * is actually earned for this month. Every block is `write_code` with nothing
 * but a statement: no starter, no scaffold, no hint folded into the prompt. A
 * learner reads the problem and writes the whole program — `#include`,
 * `int main()`, `return 0;` and all — exactly as they will in the monthly check.
 *
 * Five decisions taken once, so no block below re-litigates them.
 *
 * 1. **Not a rerun of the lessons.** m2.l1–m2.l6 already own the concrete
 *    tasks the PDF's October practice paragraph names: the 1..n sum, modelled
 *    in m2.l1.b7 and practised unscaffolded at m2.p2 below (m2.l1.b8 sits in
 *    the same family on squares, so that the lesson task is not the worked
 *    example handed back), the divisor COUNT (m2.l2.b6), the digit sum
 *    (m2.l3.b7), the list maximum (m2.l5.b6), the count above the average
 *    (m2.l5.b8), the vowel count (m2.l6.b4), the palindrome (m2.l6.b7).
 *    Setting the same statements again here would test whether a learner
 *    remembers a lesson, not whether they can solve. So each block below stays
 *    inside a family the programme names and changes the question within it —
 *    count → sum, word → list, equal neighbours → increasing neighbours — and
 *    the comment on each says which lesson task it is deliberately standing
 *    apart from.
 *
 * 2. **Input shape follows m2.l4.** The count on the first line, the numbers on
 *    the second, read as `cin >> n; vector<int> a(n);` and a filling loop.
 *    Where a third value is needed it is on a third line and the prompt says so
 *    in both languages. Every prompt guarantees n ≥ 1: `a[0]` on an empty
 *    vector is not a lesson.
 *
 * 3. **The hidden cases are chosen to kill named wrong programs**, not to
 *    reach a count. The four errors PDF p.7 names for October — infinite
 *    loop, missing the last element, index out of range, wrong initial value
 *    for the accumulator — plus `>` where `>=` was meant, single-element
 *    input, all-equal input, all-negative input, and the answer sitting at
 *    the very last position. Each case below carries a comment naming the
 *    mutant it exists to fail.
 *
 * 4. **Tracks.** m2.p1–m2.p8 are the full core set and are shown to every
 *    route, support included: the programme asks support for *more*
 *    assembling and *less* writing from scratch across the month, and the
 *    month's lessons already carry that substitution at every `s` id — a
 *    support learner who has done the nine scaffolded twins still has to write
 *    something alone by the end of it. m2.p9 adds a second interacting
 *    accumulator (core + advanced) and m2.p10 is the nested loop
 *    (advanced only).
 *
 * 5. **Every bound was re-checked against `int`.** The largest answer any task
 *    here can produce is m2.p2's 500500 and m2.p3's 2340, both far inside
 *    2 147 483 647, so nothing needs `long long` and nothing gets it. That is
 *    the audit rule in docs/cpp17/CPP17_PEDAGOGY.md, applied rather than
 *    assumed — a stated bound that can overflow is a task that lies.
 */
export const M2_PRACTICE: LessonBlock[] = [
  {
    /* Rung 1: one pass, two counters, no ordering and no boundary. The only
       trap is that 0 is even, and one hidden case is built from it. Kept
       distinct from m2.l2.b5, which hands the learner the loop and asks for a
       modification — here there is nothing on the screen at all. */
    id: "m2.p1",
    bank: {
      role: "extra_practice",
      why:
        "Counting with a condition over a list is established by m2.l1.b9, which counts the multiples of k in a range, and exercised again by m2.l5.b8. This adds a second counter to the same loop and no new decision.",
    },
    type: "write_code",
    skillRefs: ["loops.for", "loops.counter", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Олардың ішінде неше жұп және неше тақ сан бар екенін тап. Жауапты бір жолға шығар: алдымен жұп сандардың саны, содан кейін тақ сандардың саны, арасы бос орын. Мысалы, n = 6 және `1 2 3 4 5 6` үшін жауап `3 3`. Нөл жұп сан болып саналады.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Определи, сколько среди них чётных и сколько нечётных. Ответ выведи в одну строку: сначала количество чётных, затем количество нечётных, через пробел. Например, для n = 6 и `1 2 3 4 5 6` ответ `3 3`. Ноль считается чётным.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int ev = 0;\n" +
      "    int od = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x % 2 == 0) {\n" +
      "            ev += 1;\n" +
      "        } else {\n" +
      "            od += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ev << \" \" << od;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "6\n1 2 3 4 5 6", expectedOutput: "3 3" },
      /* A single number, and it is odd: the even counter must still print 0
         rather than being left undefined or started at 1. */
      { input: "1\n7", expectedOutput: "0 1", hidden: true },
      /* Zero is even, and the negatives are the C++ trap: `-3 % 2` is `-1`, not
         `1` as in Python, so a learner who wrote `x % 2 == 1` to mean "odd"
         gets 2 4 here instead of 2 2. Testing `== 0` for even, as the reference
         does, is unaffected. */
      { input: "4\n-4 -3 0 9", expectedOutput: "2 2", hidden: true },
      /* Nothing on one side. Kills a program that declares a counter inside the
         loop — which in C++ does not even compile, the loudest failure there
         is. */
      { input: "5\n2 4 6 8 10", expectedOutput: "5 0", hidden: true },
      { input: "3\n11 13 15", expectedOutput: "0 3", hidden: true },
    ],
  },
  {
    /* Rung 2. PDF p.7 family «1-ден n-ге дейінгі қосынды», with both ends
       given instead of only the upper one — m2.l1.b8 already owns 1..n. Two
       bounds is the honest step up: `for (int i = a; i <= b; i++)` has to be
       reasoned about rather than copied, and a negative lower bound means the
       accumulator cannot be checked by "is the answer positive". */
    id: "m2.p2",
    type: "write_code",
    skillRefs: ["loops.for", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген екі бүтін сан a мен b беріледі (−1000 ≤ a ≤ b ≤ 1000). a-дан b-ге дейінгі барлық бүтін санның қосындысын шығар. a мен b-нің өзі де қосындыға кіреді. Мысалы, `1 5` үшін жауап 15, ал `7 7` үшін жауап 7.",
      ru: "В одной строке через пробел даны два целых числа a и b (−1000 ≤ a ≤ b ≤ 1000). Выведи сумму всех целых чисел от a до b. Сами a и b тоже входят в сумму. Например, для `1 5` ответ 15, а для `7 7` ответ 7.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    int s = 0;\n" +
      "    for (int i = a; i <= b; i++) {\n" +
      "        s += i;\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "1 5", expectedOutput: "15" },
      /* a == b. `i < b` runs zero times here, so the off-by-one at the upper
         bound prints 0 instead of 7 — the loudest possible failure. */
      { input: "7 7", expectedOutput: "7", hidden: true },
      /* The answer is 0 while the range is not empty. A program that never
         entered the loop also prints 0, so this case is paired with the two
         below rather than trusted alone. */
      { input: "-3 3", expectedOutput: "0", hidden: true },
      /* Every term negative: `s = 0` is right here, but a learner who
         initialised the accumulator to `a` double-counts the first term. */
      { input: "-5 -2", expectedOutput: "-14", hidden: true },
      { input: "1 1000", expectedOutput: "500500", hidden: true },
    ],
  },
  {
    /* Rung 3. PDF p.7 family «бөлгіштер саны». m2.l2.b6 counts the divisors,
       so this one adds them up: the same `n % d == 0` test drives an
       accumulator instead of a counter, which is exactly the distinction
       m2.l2 spends its concept block on. n = 1 is the case that decides
       whether the loop bounds were reasoned about or guessed. */
    id: "m2.p3",
    bank: {
      role: "extra_practice",
      why:
        "The divisor loop and its inclusive upper bound are established at m2.l2.b6, which counts divisors, and again at m2.l8.b6, which finds the smallest. Summing them instead of counting them is the accumulator-versus-counter distinction m2.l2 spends its concept block on — worth practising, not worth requiring a third divisor task.",
    },
    type: "write_code",
    skillRefs: ["loops.for", "loops.accumulator", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір бүтін сан n беріледі (1 ≤ n ≤ 1000). Оның барлық бөлгіштерінің қосындысын шығар. Бөлгіш — n-ді қалдықсыз бөлетін сан; 1 де, n-нің өзі де бөлгіш болып саналады. Мысалы, n = 6 болса, бөлгіштері 1, 2, 3, 6 және жауап 12.",
      ru: "Дано целое число n (1 ≤ n ≤ 1000). Выведи сумму всех его делителей. Делитель — число, на которое n делится без остатка; 1 и само n тоже считаются делителями. Например, при n = 6 делители 1, 2, 3, 6, а ответ 12.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int s = 0;\n" +
      "    for (int d = 1; d <= n; d++) {\n" +
      "        if (n % d == 0) {\n" +
      "            s += d;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << s;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "6", expectedOutput: "12" },
      /* n = 1. Both off-by-one bounds die here: `d < n` runs zero times and
         prints 0, and a loop starting at 2 misses the only divisor. */
      { input: "1", expectedOutput: "1", hidden: true },
      /* A prime: only 1 and n, so a loop that never reaches n prints 1. */
      { input: "13", expectedOutput: "14", hidden: true },
      /* A perfect square — 2 * 2 = 4, and 2 must be added once, not twice. */
      { input: "4", expectedOutput: "7", hidden: true },
      { input: "12", expectedOutput: "28", hidden: true },
      { input: "1000", expectedOutput: "2340", hidden: true },
    ],
  },
  {
    /* Rung 4. PDF p.7 names «тізімдегі максимум мен минимум» as one family;
       m2.l5 splits it, giving the maximum to m2.l5.b6 and the minimum to a
       fill-blank. This block is the family as the programme states it — both
       in one traversal, which means two best-so-far variables updated in the
       same pass and a stated output order. */
    id: "m2.p4",
    type: "write_code",
    skillRefs: ["lists.traverse", "lists.index", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Ең үлкенін және ең кішісін бір жолға, осы ретпен, бос орынмен бөліп шығар. Мысалы, n = 4 және `3 9 5 1` үшін жауап `9 1`. Дайын максимум-минимум табатын құралдарды қолдануға болмайды — әр элементті циклмен қарап шық.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи в одну строку сначала наибольшее, затем наименьшее, через пробел. Например, для n = 4 и `3 9 5 1` ответ `9 1`. Пользоваться готовыми средствами поиска максимума и минимума нельзя — пройди по каждому элементу циклом.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int big = a[0];\n" +
      "    int small = a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] > big) {\n" +
      "            big = a[i];\n" +
      "        }\n" +
      "        if (a[i] < small) {\n" +
      "            small = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << big << \" \" << small;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 9 5 1", expectedOutput: "9 1" },
      /* One element is both the largest and the smallest. The loop from i = 1
         never runs, so everything depends on the initial values being a[0]. */
      { input: "1\n7", expectedOutput: "7 7", hidden: true },
      /* All negative — the PDF's own «жинақтаушы айнымалыға қате бастапқы мән
         беру». `big = 0` prints a number that is not in the list. */
      { input: "3\n-9 -3 -7", expectedOutput: "-3 -9", hidden: true },
      { input: "4\n4 4 4 4", expectedOutput: "4 4", hidden: true },
      /* The maximum is the last element: kills `i < n - 1`. */
      { input: "4\n2 3 4 10", expectedOutput: "10 2", hidden: true },
      /* The minimum is the last element, for the same reason. */
      { input: "4\n6 4 9 1", expectedOutput: "9 1", hidden: true },
    ],
  },
  {
    /* Rung 5, the string walk. m2.l6.b4 counts vowels against a fixed set, so
       this counts a letter that is only known at run time: the comparison
       moves from a chain of `c == 'a' || …` to `ch == c`, and the letter to
       look for arrives on a second input line, which is a format the learner
       has to read rather than pattern-match. `cin >> c` into a `char` reads
       exactly one non-space character, which is the point of the second line. */
    id: "m2.p5",
    bank: {
      role: "extra_practice",
      why:
        "Walking a word and counting one character is m2.l6.b4, a fill_blank on the vowel count, and m2.l6.b6 asks for the last vowel's index. Counting an arbitrary given letter is the same traversal with the target read from input.",
    },
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ (ұзындығы 1-ден 100-ге дейін). Екінші жолда бір ғана әріп беріледі. Сол әріп сөзде неше рет кездесетінін шығар. Мысалы, `banana` сөзі мен `a` әрпі үшін жауап 3. Әріп мүлде кездеспесе, 0 шығар.",
      ru: "В первой строке дано слово: только строчные латинские буквы, без пробелов (длина от 1 до 100). Во второй строке дана одна буква. Выведи, сколько раз эта буква встречается в слове. Например, для слова `banana` и буквы `a` ответ 3. Если буква не встречается совсем, выведи 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    char c;\n" +
      "    cin >> c;\n" +
      "    int k = 0;\n" +
      "    for (char ch : s) {\n" +
      "        if (ch == c) {\n" +
      "            k += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << k;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "banana\na", expectedOutput: "3" },
      /* Absent letter: the counter has to exist before the loop, or nothing
         gets printed at all. */
      { input: "banana\nz", expectedOutput: "0", hidden: true },
      /* First and last character both match — kills a walk that starts at
         index 1 and a walk that stops at `n - 1` at once. */
      { input: "abcda\na", expectedOutput: "2", hidden: true },
      { input: "aaaa\na", expectedOutput: "4", hidden: true },
      /* A one-character word. */
      { input: "z\nz", expectedOutput: "1", hidden: true },
      { input: "hello\nl", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* Rung 6. PDF p.7 family «палиндромды тексеру», moved off the word and
       onto a list of numbers, because m2.l6.b7 already owns the words. The
       two-index walk is identical, but the learner has to read the list first
       and reason about `n - 1` instead of `t.size() - 1`, and the comparison
       is `!=` on integers rather than on characters.

       Output is the English pair yes/no, named in both prompts: a program
       that printed «иә» would let a Russian-track learner match glyphs
       instead of reasoning about the comparison.

       The case set is built against the shortcut this family is known for:
       every `no` whose ends already differ is answered by `a[0] == a[n - 1]`
       with no loop at all, on a task that is nothing but the loop. So
       `1 2 3 4 1` has equal ends and an unequal middle, and `1 2 3 4 5 2 1` is
       seven long with its outer two pairs agreeing — the only program that
       gets that one right is one that keeps going until the indices meet. */
    id: "m2.p6",
    type: "write_code",
    skillRefs: ["lists.index", "loops.while", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Осы тізім палиндром ба, яғни басынан оқығанда да, соңынан оқығанда да бірдей ме? Палиндром болса `yes`, болмаса `no` деген сөзді шығар. Мысалы, `1 2 3 2 1` үшін жауап `yes`, ал `1 2 3 4` үшін `no`. Бір ғана саннан тұратын тізім әрқашан палиндром.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Является ли этот список палиндромом, то есть читается ли он одинаково с начала и с конца? Если да, выведи слово `yes`, если нет — `no`. Например, для `1 2 3 2 1` ответ `yes`, а для `1 2 3 4` — `no`. Список из одного числа всегда палиндром.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int t = 0; t < n; t++) {\n" +
      "        cin >> a[t];\n" +
      "    }\n" +
      "    int i = 0;\n" +
      "    int j = n - 1;\n" +
      "    int ok = 1;\n" +
      "    while (i < j) {\n" +
      "        if (a[i] != a[j]) {\n" +
      "            ok = 0;\n" +
      "        }\n" +
      "        i += 1;\n" +
      "        j -= 1;\n" +
      "    }\n" +
      "    if (ok == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n1 2 3 2 1", expectedOutput: "yes" },
      { input: "4\n1 2 3 4", expectedOutput: "no", hidden: true },
      /* One element: `j` starts at 0, so `i < j` is false immediately and the
         answer is the initial `ok`. A learner who set `ok = 0` before the
         loop and only ever sets it to 1 inside answers no. */
      { input: "1\n5", expectedOutput: "yes", hidden: true },
      { input: "2\n4 4", expectedOutput: "yes", hidden: true },
      { input: "2\n4 7", expectedOutput: "no", hidden: true },
      /* Even length, so the two indices cross without ever meeting. */
      { input: "4\n1 2 2 1", expectedOutput: "yes", hidden: true },
      /* Ends equal, the pair one step inside them not: the input on which
         `a[0] == a[n - 1]` and the walk first disagree. */
      { input: "5\n1 2 3 4 1", expectedOutput: "no", hidden: true },
      /* Seven long, and its outer two pairs agree. Five numbers hold only two
         pairs, so every case above is answered by two comparisons written out
         by hand; this one is not answered by any fixed number of them. */
      { input: "7\n1 2 3 4 5 2 1", expectedOutput: "no", hidden: true },
      /* A near-palindrome that breaks on its outermost pair and then matches
         on the next one in. What this input fails is `ok` re-assigned on every
         iteration instead of only ever cleared — the flag forgets the mismatch
         it has already found and prints yes. */
      { input: "5\n1 2 3 2 9", expectedOutput: "no", hidden: true },
    ],
  },
  {
    /* Rung 7: a traversal with a sentinel. Two things have to be right at
       once — "strictly greater than x" and "smallest among those" — and the
       answer has no meaningful starting value, so the learner meets the
       problem that `best = 0` cannot solve no matter which way it is tuned.

       The statement bounds the numbers at 1..1000 on purpose: the "nothing
       found" answer is -1, and a list that could itself contain -1 would make
       two different situations print the same line. */
    id: "m2.p7",
    bank: {
      role: "extra_practice",
      why:
        "m2.l9.b9 asks for the POSITION of the first element greater than x, including the -1 case. This asks for the smallest such VALUE. Same scan, same boundary, same -1 convention.",
    },
    type: "write_code",
    skillRefs: ["lists.traverse", "compare.operators", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады, әрқайсысы 1-ден 1000-ға дейін. Үшінші жолда бүтін сан x беріледі (0 ≤ x ≤ 1000). Тізімдегі x-тен ҚАТАҢ үлкен сандардың ішіндегі ең кішісін шығар. Ондай сан болмаса, -1 шығар. x-ке тең сандар жарамайды. Мысалы, `3 9 5 1` тізімі мен x = 4 үшін жауап 5.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел, каждое от 1 до 1000. В третьей строке дано целое число x (0 ≤ x ≤ 1000). Выведи наименьшее из чисел списка, которые СТРОГО больше x. Если такого числа нет, выведи -1. Числа, равные x, не подходят. Например, для списка `3 9 5 1` и x = 4 ответ 5.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    int ans = -1;\n" +
      "    for (int v : a) {\n" +
      "        if (v > x) {\n" +
      "            if (ans == -1) {\n" +
      "                ans = v;\n" +
      "            } else if (v < ans) {\n" +
      "                ans = v;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 9 5 1\n4", expectedOutput: "5" },
      /* x equals the largest element. `>=` instead of `>` prints 9. */
      { input: "4\n3 9 5 1\n9", expectedOutput: "-1", hidden: true },
      /* Everything qualifies, so the answer is the list minimum. */
      { input: "4\n3 9 5 1\n0", expectedOutput: "1", hidden: true },
      /* The answer is the last element: kills a traversal that stops early. */
      { input: "4\n9 8 7 6\n5", expectedOutput: "6", hidden: true },
      /* Every element equal, and equal to x: strictness again, from the other
         side. */
      { input: "3\n5 5 5\n5", expectedOutput: "-1", hidden: true },
      { input: "3\n5 5 5\n4", expectedOutput: "5", hidden: true },
      /* A single element, and nothing to fall back on. */
      { input: "1\n10\n10", expectedOutput: "-1", hidden: true },
      { input: "1\n7\n3", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /* Rung 8, and the first task here that cannot be done in one pass: the
       average is not known until every element has been read, so nothing can be
       accumulated on the way. m2.l5.b8 counts the elements above the average;
       this one adds them, which keeps the two-pass structure and the
       strictness boundary while changing the answer being computed.

       The average is compared, never printed, so no formatting rule is
       attached to a task whose prompt does not state one — but it still has to
       be a `double`. With `s / n` on two `int`s the average of `1 2 3 4` is 2
       instead of 2.5 and the element 3 wrongly joins the sum, which is what the
       visible sample is for: it answers 7 correctly and 10 with the integer
       division, in the open. */
    id: "m2.p8",
    bank: {
      role: "extra_practice",
      why:
        "m2.l5.b8 counts the elements strictly above the average; this sums them. Identical two-pass structure and identical boundary decision (strictly greater), differing only in what the second pass accumulates.",
    },
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.accumulator", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Орташа мәннен ҚАТАҢ үлкен элементтердің қосындысын шығар. Орташа мән — барлық сандардың қосындысын олардың санына бөлгендегі нәтиже, ал ол бөлшек болуы мүмкін: сондықтан бөлер алдында `(double)` деп түрлендір. Ондай элемент болмаса, 0 шығар. Мысалы, `1 2 3 4` үшін орташа мән 2.5, одан үлкендері 3 пен 4, сондықтан жауап 7. Тізімді екі рет аралау керек: орташа мән белгілі болмайынша, қосатын ештеңе жоқ.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи сумму элементов, СТРОГО больших среднего значения. Среднее — сумма всех чисел, делённая на их количество, и она может быть дробной: поэтому перед делением приведи сумму к `(double)`. Если таких элементов нет, выведи 0. Например, для `1 2 3 4` среднее равно 2.5, больше него числа 3 и 4, поэтому ответ 7. Список придётся пройти дважды: пока среднее неизвестно, складывать нечего.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int s = 0;\n" +
      "    for (int x : a) {\n" +
      "        s += x;\n" +
      "    }\n" +
      "    double m = (double)s / n;\n" +
      "    int ans = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x > m) {\n" +
      "            ans += x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n1 2 3 4", expectedOutput: "7" },
      /* All equal: every element IS the average, so nothing is strictly
         greater. `>=` prints 20 here. */
      { input: "4\n5 5 5 5", expectedOutput: "0", hidden: true },
      /* One element, which is its own average. */
      { input: "1\n7", expectedOutput: "0", hidden: true },
      /* All negative, and the answer is negative: a program that only adds
         positive numbers, or that starts the sum at the first element,
         answers something else. */
      { input: "3\n-5 -1 -3", expectedOutput: "-1", hidden: true },
      /* The only qualifying element is the last one. */
      { input: "4\n1 1 1 10", expectedOutput: "10", hidden: true },
      /* And now the first one — kills a second pass that starts at index 1. */
      { input: "4\n10 1 1 1", expectedOutput: "10", hidden: true },
      { input: "2\n2 4", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /* Rung 9. CORE AND ADVANCED. Two accumulators with different reset rules,
       compared against the PREVIOUS element — so `for (int x : a)` cannot
       express it and the index form becomes the only way to write the program.

       m2.l5.b9 is the same shape on equal neighbours; this asks for strictly
       increasing ones, which moves the trap: a run of equal values is now a
       run of length 1, and the learner who wrote `>=` gets a longer answer on
       exactly the data that looks most innocent. */
    id: "m2.p9",
    bank: {
      role: "extra_practice",
      why:
        "m2.l5.b9 is the longest run of equal neighbours, on the advanced route. This is the longest strictly increasing run. The same neighbour comparison with the operator changed, and the core route already meets run-length reasoning at m2.l9.b6.",
    },
    type: "write_code",
    skillRefs: ["lists.index", "lists.traverse", "loops.counter"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Ішіндегі әрбір келесі сан алдыңғысынан ҚАТАҢ үлкен болатын ең ұзын үзіліссіз бөліктің ұзындығын шығар. Мысалы, `1 3 5 2 4 6 7` үшін жауап 4 — бұл `2 4 6 7` бөлігі. Бірдей көршілер өсу болып саналмайды, сондықтан `4 4 4` үшін жауап 1.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. Выведи длину самого длинного непрерывного участка, в котором каждое следующее число СТРОГО больше предыдущего. Например, для `1 3 5 2 4 6 7` ответ 4 — это участок `2 4 6 7`. Равные соседи возрастанием не считаются, поэтому для `4 4 4` ответ 1.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = 1;\n" +
      "    int cur = 1;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a[i] > a[i - 1]) {\n" +
      "            cur += 1;\n" +
      "        } else {\n" +
      "            cur = 1;\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "7\n1 3 5 2 4 6 7", expectedOutput: "4" },
      /* One element: the loop never runs, so the answer is the initial value.
         `best = 0` answers 0 for a list that plainly has a run of one. */
      { input: "1\n5", expectedOutput: "1", hidden: true },
      /* Equal neighbours are not increasing — `>=` answers 4 here. */
      { input: "4\n4 4 4 4", expectedOutput: "1", hidden: true },
      { input: "4\n9 7 5 3", expectedOutput: "1", hidden: true },
      /* The whole list is one run. */
      { input: "5\n1 2 3 4 5", expectedOutput: "5", hidden: true },
      /* The longest run ends at the last element: kills a program that only
         updates `best` at the moment a run breaks. */
      { input: "5\n5 4 1 2 3", expectedOutput: "3", hidden: true },
      /* The longest run is at the start: kills printing `cur`. */
      { input: "5\n1 2 3 1 2", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* Rung 10. ADVANCED ONLY. October's «қарапайым ішкі циклдерді оқу және
       жазу» (p.7 mastery paragraph) as an independent write: the inner loop
       must start at `i + 1`, which is the whole idea — each unordered pair is
       examined once, and no element is paired with itself.

       Two mutants are worth naming because both look right: an inner loop from
       `i` adds every self-pair, and one from 0 counts each pair twice AND adds
       the self-pairs. On `3 3 3` with k = 3 the correct answer is 3, the first
       mutant says 6 and the second says 9, so one hidden case fails both. */
    id: "m2.p10",
    bank: {
      role: "extension",
      why:
        "Counting pairs (i<j) whose sum is divisible by k needs a nested loop over pairs, which m2.l7 teaches and no core October task requires. Genuinely beyond the month rather than redundant with it — and October is already the year's heaviest month against the September calibration.",
    },
    type: "write_code",
    skillRefs: ["loops.nested", "lists.index", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 300). Екінші жолда сол n бүтін сан бос орынмен жазылады. Үшінші жолда бүтін сан k беріледі (1 ≤ k ≤ 100). Тізімнен екі санды таңдау тәсілдерінің санын шығар: таңдалған екі сан әртүрлі орындарда тұруы керек (i < j) және олардың қосындысы k-ға қалдықсыз бөлінуі тиіс. Әр таңдау бір-ақ рет саналады, ал бір элементті өзімен қосуға болмайды. Мысалы, `1 2 3 4 5` тізімі мен k = 3 үшін жауап 4: бұл (1,2), (1,5), (2,4), (4,5) таңдаулары.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 300). Во второй строке через пробел записаны эти n целых чисел. В третьей строке дано целое число k (1 ≤ k ≤ 100). Выведи, сколькими способами можно выбрать из списка два числа так, чтобы они стояли на разных позициях (i < j) и их сумма делилась на k без остатка. Каждый выбор считается ровно один раз, элемент нельзя складывать сам с собой. Например, для списка `1 2 3 4 5` и k = 3 ответ 4: это выборы (1,2), (1,5), (2,4), (4,5).",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if ((a[i] + a[j]) % k == 0) {\n" +
      "                c += 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n1 2 3 4 5\n3", expectedOutput: "4" },
      /* One element: there is no pair at all, and the inner loop must be
         empty rather than pairing a[0] with itself. */
      { input: "1\n5\n3", expectedOutput: "0", hidden: true },
      /* Three equal values whose doubled sum is also divisible by k. The
         correct answer is 3; an inner loop from `i` counts the self-pairs and
         says 6, and one from 0 counts every pair twice on top of that and
         says 9. */
      { input: "3\n3 3 3\n3", expectedOutput: "3", hidden: true },
      /* k = 1 divides everything, so the answer is every pair there is. */
      { input: "4\n1 1 1 1\n1", expectedOutput: "6", hidden: true },
      { input: "2\n1 2\n5", expectedOutput: "0", hidden: true },
      /* The only qualifying pair involves the first element — kills an outer
         loop that starts at 1. */
      { input: "3\n1 2 3\n4", expectedOutput: "1", hidden: true },
      /* Negative values, and the one place the C++/Python divergence was
         checked rather than assumed. C++ gives a NEGATIVE remainder for a
         negative sum where Python gives a positive one — `-2 % 3` is `-2`
         here and `1` there — but the test is `== 0`, and a sum is divisible in
         both languages or in neither. So the expected answer is unchanged, and
         it is 2: (-3, 3) and (1, 2). */
      { input: "4\n-3 3 1 2\n3", expectedOutput: "2", hidden: true },
      { input: "4\n2 4 6 8\n2", expectedOutput: "6", hidden: true },
    ],
  },
];
