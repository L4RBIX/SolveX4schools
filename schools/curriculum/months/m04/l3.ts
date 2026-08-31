import type { LessonBlock } from "../../types";

/**
 * m4.l3 · «Реттеу не береді» / «Что даёт сортировка» — 8 minutes.
 *
 * Skills: `sort.basic`, `lists.traverse`. PDF p.8.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * December's theme is «Бағдарламаның жылдамдығы: сұрыптау және алдын ала
 * есептеу», and two of the month's six named practice families are this
 * lesson's entire job: «сандарды реттеу» (b6) and «көлемі бойынша үшінші мәнді
 * табу» (b7). They are cited as curriculum-derived; everything else here —
 * the numbers, the distractors, the cases — is authored to serve them.
 *
 * The month's own sentence is «дұрыс жауап тым кеш шықса, қабылданбайды», and
 * ordering is the first tool it hands over. But the honest claim at this point
 * is not "sorting is fast" — it is that an ordered list answers a whole family
 * of questions by index instead of by search, which is what m4.l4 and m4.l7
 * then build on. So the concept block argues from the index, not from a
 * complexity class the learner has no way to check.
 *
 * ## What arrives here, and why it was withheld
 *
 * `sort` from `<algorithm>` becomes available this month and not earlier. In
 * October «тізімдегі максимум мен минимум» IS the traversal being taught, and
 * in November the same maximum is written as a function — a library call in
 * either month deletes the exercise. b1 says this to the learner in one
 * sentence: you already wrote the maximum by hand, twice; ordering the whole
 * list is the general form of that move.
 *
 * `a.begin()` and `a.end()` are presented as ONE phrase — "from the start of a
 * to the end of a", the words `sort` needs — and nothing is said about
 * iterators. `docs/cpp17/CPP17_PEDAGOGY.md` puts iterators-as-an-abstraction
 * outside Year 1 explicitly, and a fourteen-year-old who is told `a.begin()`
 * "returns an iterator" has been handed a second lesson in the middle of this
 * one.
 *
 * ## What the C++ migration changed, and it is not a syntax change
 *
 * Python has two sorts and the lesson was built on the difference between them:
 * `sorted(a)` returns a new list, `a.sort()` reorders in place and returns
 * `None`, and `b = a.sort()` is the first mistake every learner makes.
 *
 * **C++ has only the in-place one.** `sort(a.begin(), a.end())` reorders `a`
 * and returns nothing, and there is no standard call that hands back a sorted
 * copy. So the pair of ideas becomes: sorting DESTROYS the original order, and
 * if you need it you copy the vector first — `vector<int> b = a;`. That is the
 * genuine C++ trap and it is the one this lesson now teaches. b2 checks that a
 * copy really is a copy; b3 is the bug that follows — `sort` pointed at the
 * wrong vector, so both printed lines come out in the wrong order.
 *
 * The Python bug (`b = a.sort()` printing `None`) has no C++ equivalent: it is
 * not a wrong answer, it does not compile at all, so there would be nothing to
 * find.
 *
 * ## Reading a line of unknown length
 *
 * Five blocks here take «бір жолда бос орынмен бөлінген сандар» with no count
 * in front of them, which in C++ needs a recipe the learner has not met:
 * `while (cin >> x) { a.push_back(x); }` — read until the numbers run out. It
 * is introduced in b1 as exactly that, a recipe, with `push_back` being
 * October's own.
 *
 * `m4.l3.b5` is the one block whose input format had to change: it wanted a
 * line of numbers FOLLOWED by k, and "read to the end of the line, then read
 * one more thing" is not expressible with the tools this course has. k now
 * comes first. Nothing else about the block moved.
 *
 * ## Repeats: a decision, stated and then enforced
 *
 * «Үшінші мән» with repeats is ambiguous, so b7 fixes it BY POSITION IN THE
 * SORTED LIST — `5 5 5` has third largest `5` — says so in both prompts, and
 * the hidden case `10 10 9 8 → 9` fails any solution that quietly answered the
 * distinct-value question instead. b8, advanced only, then asks that other
 * question on the SAME input and gets 8. It is not a harder version of b7; it
 * is a different problem, and its prompt says so. Without `set` — which this
 * course never teaches — it is solved by walking the sorted list from the top
 * and counting the places where a neighbour differs, which is exactly the move
 * m4.l7 generalises.
 *
 * ## Tracks
 *
 * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ».
 * b7 is withheld from support and replaced at b7s by a `modify_code` on the
 * same problem with the same cases. Its starting program prints the SMALLEST
 * element after sorting — a program that appears on no other card in this
 * lesson, so the edit is a decision about which end of the list and by how
 * much, not a transcription of something visible two screens up.
 */

const P = 8;

export const M4_L3: LessonBlock[] = [
  {
    id: "m4.l3.b1",
    type: "concept",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "sort: тізімді орнында реттеу",
      ru: "sort: сортировка списка на месте",
    },
    body: {
      kk:
        "Қазанда тізімнің ең үлкен элементін циклмен өзің іздедің, қарашада сол іздеуді функцияға шығардың. Бүкіл тізімді реттеу — сол әрекеттің жалпы түрі: бір рет реттесең, ең кішісі де, ең үлкені де, шеттегі бірнеше мән де іздеусіз, тек индекс арқылы алынады.\n\n" +
        "Реттеу үшін жаңа тақырып қосамыз: `#include <algorithm>`. Содан кейін `sort(a.begin(), a.end());` деп жазамыз. `a.begin(), a.end()` — бұл `sort`-қа керек тіркес, «a-ның басынан a-ның соңына дейін» дегені; әзірге оны бір бөлінбейтін жазба ретінде қабылда.\n\n" +
        "Ең маңыздысы: `sort` тізімді ОРНЫНДА реттейді және ешқандай мән қайтармайды. `b = sort(...)` деп жазуға болмайды — ол тіпті компиляцияланбайды. Реттегеннен кейін бастапқы рет мүлде жоғалады. Егер бастапқы рет саған әлі керек болса, алдымен көшірме жаса: `vector<int> b = a;` — енді `b`-ны реттесең, `a` бұрынғы күйінде қалады.\n\n" +
        "`sort` әдепкі бойынша ӨСУ ретімен реттейді. Демек реттелген тізімде ең кіші сан — `a[0]`, ең үлкені — `a[n - 1]`, ал ең үлкен үш сан — тізімнің соңындағы үш элемент. Кему ретімен керек болса, `sort(a.rbegin(), a.rend());` деп жаз — сол тіркестің кері оқылатын түрі.\n\n" +
        "Тағы бір рецепт: бір жолда неше сан бар екені алдын ала белгісіз болса, `while (cin >> x) { a.push_back(x); }` деп оқы — сандар біткенде цикл өзі тоқтайды.",
      ru:
        "В октябре ты искал наибольший элемент списка циклом, а в ноябре оформил этот же поиск функцией. Сортировка всего списка — общая форма того же приёма: один раз упорядочил — и наименьшее, и наибольшее, и несколько крайних значений берутся уже без поиска, по индексу.\n\n" +
        "Для сортировки добавляем новый заголовок: `#include <algorithm>`. Дальше пишем `sort(a.begin(), a.end());`. Запись `a.begin(), a.end()` — это то, что нужно `sort`, и читается она как «от начала a до конца a»; пока принимай её как единое неделимое выражение.\n\n" +
        "Самое важное: `sort` упорядочивает список НА МЕСТЕ и не возвращает никакого значения. Написать `b = sort(...)` нельзя — это даже не скомпилируется. После сортировки исходный порядок пропадает совсем. Если исходный порядок тебе ещё нужен, сначала сделай копию: `vector<int> b = a;` — теперь сортировка `b` оставит `a` нетронутым.\n\n" +
        "По умолчанию `sort` упорядочивает ПО ВОЗРАСТАНИЮ. Значит, в отсортированном списке наименьшее число — это `a[0]`, наибольшее — `a[n - 1]`, а три наибольших — три последних элемента. Если нужно по убыванию, пиши `sort(a.rbegin(), a.rend());` — то же выражение, прочитанное с конца.\n\n" +
        "И ещё один рецепт: если заранее неизвестно, сколько чисел в строке, читай их так — `while (cin >> x) { a.push_back(x); }`; когда числа кончатся, цикл остановится сам.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {5, 2, 9, 1};\n" +
      "    int n = a.size();\n" +
      "\n" +
      "    vector<int> b = a;\n" +
      "    sort(b.begin(), b.end());\n" +
      "\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << b[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << a[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "\n" +
      "    sort(a.begin(), a.end());\n" +
      "    cout << a[0] << \" \" << a[n - 1] << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /* The indices are the point. A learner who only remembers «sort reorders
       something» still has to say WHICH vector each line reads, and the second
       line is where the "the copy is a real copy" claim is actually tested. */
    id: "m4.l3.b2",
    type: "prediction",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама екі жол шығарады. Әр жолды жазар алдында қай тізімнен оқып тұрғанын өзіңе айт. Нәтиже қандай болады?",
      ru: "Программа выводит две строки. Прежде чем записать каждую, скажи себе, из какого списка она читает. Что будет выведено?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {7, 3, 9, 1};\n" +
      "    vector<int> b = a;\n" +
      "    sort(b.begin(), b.end());\n" +
      "    cout << b[0] << \" \" << b[3] << endl;\n" +
      "    cout << a[0] << \" \" << a[3] << endl;\n" +
      "    return 0;\n" +
      "}",
    answer: "1 9\n7 1",
    options: ["1 9\n7 1", "1 9\n1 9", "9 1\n7 1", "7 1\n1 9"],
    diagnosticMapping: {
      "1 9\n1 9": {
        failureClass: "sorted_mistaken_for_in_place",
        justification:
          "Екінші жолда 1 9 шығуының жалғыз жолы бар: `vector<int> b = a;` жазбасы жаңа тізім жасамайды, тек `a`-ға басқа ат береді деп ойлау. Шын мәнінде бұл толық көшірме, сондықтан `b`-ны реттеу `a`-ны мүлде өзгертпейді.",
      },
      "9 1\n7 1": {
        failureClass: "sort_order_assumed_descending",
        justification:
          "b[0] орнында 9 тұруы тек реттеу кему ретімен жүреді деп ойлағанда шығады. Екінші жол дұрыс жазылған, демек қате `a` мен `b`-ны шатастыруда емес, реттеу бағытында.",
      },
    },
  },
  {
    /* RE-AUTHORED for C++. The Python bug was `b = a.sort()` printing `None`;
       in C++ that does not compile, so there is no wrong ANSWER to find.
       The C++ bug is the one the language actually produces: `sort` aimed at
       the original vector instead of at the copy. Both printed lines then come
       out swapped — the first shows the untouched order, the second the sorted
       one — and exactly one line has to change. */
    id: "m4.l3.b3",
    type: "find_bug",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама алдымен сандарды өсу ретімен, содан кейін бастапқы тізімді өзгеріссіз шығаруы керек. Бірақ `5 2 9 1` енгізгенде бірінші жолда `5 2 9 1`, ал екінші жолда `1 2 5 9` шығады — жолдар орнымен ауысқандай. Көшірме дұрыс жасалған, `b` — шын көшірме. Ендеше қате қай жолда?",
      ru: "Программа должна сначала вывести числа по возрастанию, а потом исходный список без изменений. Но при вводе `5 2 9 1` в первой строке печатается `5 2 9 1`, а во второй `1 2 5 9` — как будто строки поменялись местами. Копия сделана правильно, `b` — настоящая копия. Тогда в какой строке ошибка?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    int n = a.size();\n" +
      "    vector<int> b = a;\n" +
      "    sort(a.begin(), a.end());\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << b[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << a[i] << \" \";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 14,
    symptomInput: "5 2 9 1",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    int n = a.size();\n" +
      "    vector<int> b = a;\n" +
      "    sort(b.begin(), b.end());\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << b[i] << \" \";\n" +
      "    }\n" +
      "    cout << endl;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << a[i] << \" \";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "16": {
        failureClass: "symptom_location_mistaken_for_defect",
        justification:
          "16-жол `b`-ны дұрыс шығарады — реттелмеген тізім сол жерде КӨРІНЕДІ, бірақ сол жерде ПАЙДА БОЛМАЙДЫ. Бұл жауап оқушының қатені мән бұзылған жерден емес, ол экранға шыққан жерден іздегенін көрсетеді: `sort` шақырылған кезде-ақ дұрыс емес тізім реттеліп қойған.",
      },
    },
  },
  {
    /* n - 3 and 2 are not the same mistake and must not be the same option:
       with n = 6 the correct index is 3, so `a[3]` is deliberately absent from
       the list — offering it would make two options correct. */
    id: "m4.l3.b4",
    type: "multiple_choice",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "`a` тізімі өсу ретімен реттелген, ұзындығы n. Көлемі бойынша ҮШІНШІ мәнді (мұнда ол 7) қай өрнек шығарады?",
      ru: "Список `a` отсортирован по возрастанию, его длина n. Какое выражение выведет ТРЕТЬЕ по величине значение (здесь это 7)?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {2, 3, 5, 7, 11, 13};\n" +
      "    int n = a.size();\n" +
      "    cout << n;\n" +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "a[n - 3] өрнегі", ru: "Выражение a[n - 3]" } },
      { id: "o2", label: { kk: "a[n - 2] өрнегі", ru: "Выражение a[n - 2]" } },
      { id: "o3", label: { kk: "a[n - 1] өрнегі", ru: "Выражение a[n - 1]" } },
      { id: "o4", label: { kk: "a[2] өрнегі", ru: "Выражение a[2]" } },
    ],
    correctOptionId: "o1",
    /* o3 (a[n - 1]) carries no mapping: it is reached both by "the largest is
       the answer" and by a plain miscount, and o4 (a[2]) both by counting from
       the small end and by assuming a descending order — two beliefs each. */
    diagnosticMapping: {
      o2: {
        failureClass: "index_counted_from_one",
        justification:
          "n - 2 — бұл екінші үлкен мән. Оны таңдаудың жалғыз себебі: соңғы элементтің индексі n деп саналған. Шын мәнінде соңғысы n - 1, содан кейін n - 2, содан кейін n - 3, сондықтан үшіншісі n - 3-те тұр.",
      },
    },
  },
  {
    /* The input order is k FIRST, then the numbers — see the head comment. In
       C++ "read a line of unknown length, then read one more value" is not
       expressible with the tools this course has, and inventing `getline` plus
       a string stream for one fill-in-the-blank would cost more than it
       teaches. The two blanks are unchanged: which call orders the list, and
       how far in from the top the answer sits. */
    id: "m4.l3.b5",
    type: "fill_blank",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда k саны, екінші жолда бос орынмен бөлінген сандар беріледі (1 ≤ k ≤ сандар саны). Бағдарлама көлемі бойынша k-шы мәнді шығаруы керек, яғни k = 1 болғанда ең үлкенін. Тізімді реттейтін амалдың атын және индекс өрнегін толықтыр.",
      ru: "В первой строке дано число k, во второй — числа через пробел (1 ≤ k ≤ количеству чисел). Программа должна вывести k-е по величине значение, то есть при k = 1 — наибольшее. Дополни имя операции, которая упорядочивает список, и выражение индекса.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    int n = a.size();\n" +
      "    ___(a.begin(), a.end());\n" +
      "    cout << a[n - ___];\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "k" },
    ],
  },
  {
    /* PDF p.8, verbatim family: «сандарды реттеу». Kept for all three tracks —
       it is the month's smallest possible use of the new tool, and the support
       route needs to write it once before b7s asks it to be changed. */
    id: "m4.l3.b6",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде бір сан, әрқайсысы -1 000 000 000 мен 1 000 000 000 аралығында). Сол сандарды өсу ретімен, бос орынмен бөліп, бір жолға шығар. Сандардың саны алдын ала берілмейді — оларды `while (cin >> x)` рецептімен оқы.",
      ru: "В одной строке даны целые числа через пробел (не меньше одного числа, каждое от -1 000 000 000 до 1 000 000 000). Выведи эти числа по возрастанию, в одну строку, через пробел. Количество чисел заранее не дано — читай их рецептом `while (cin >> x)`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int n = a.size();\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cout << a[i];\n" +
      "        if (i + 1 < n) {\n" +
      "            cout << \" \";\n" +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 2 9 1 3", expectedOutput: "1 2 3 5 9" },
      { input: "42", expectedOutput: "42" },
      /* `10 9 2` and the −10^9 case kill a hand-written comparison that only
         ever looks at the first digit, and a solution that stops reading at the
         first number it cannot place. */
      { input: "10 9 2", expectedOutput: "2 9 10", hidden: true },
      { input: "-3 10 0 -7 2", expectedOutput: "-7 -3 0 2 10", hidden: true },
      /* Duplicates must survive: a solution that drops them prints six numbers
         as three. Already-sorted and fully reversed inputs are the two shapes
         where a half-written manual swap looks correct on one and not the other. */
      { input: "4 4 2 7 2 4", expectedOutput: "2 2 4 4 4 7", hidden: true },
      { input: "1 2 3 4", expectedOutput: "1 2 3 4", hidden: true },
      { input: "4 3 2 1", expectedOutput: "1 2 3 4", hidden: true },
      {
        input: "1000000000 -1000000000 0 5 5 -5 7 -7",
        expectedOutput: "-1000000000 -7 -5 0 5 5 7 1000000000",
        hidden: true,
      },
    ],
  },
  {
    /* PDF p.8, verbatim family: «көлемі бойынша үшінші мәнді табу». The repeats
       rule is stated in both prompts and enforced by `10 10 9 8 → 9`. */
    id: "m4.l3.b7",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген кемінде үш бүтін сан беріледі. Көлемі бойынша үшінші мәнді шығар. Қайталанатын сандар бөлек-бөлек саналады: реттелген тізімдегі орны бойынша аламыз, сондықтан `5 5 5` үшін жауап 5, ал `10 10 9 8` үшін жауап 9.",
      ru: "В одной строке даны не меньше трёх целых чисел через пробел. Выведи третье по величине значение. Повторы считаются по отдельности: берём по месту в отсортированном списке, поэтому для `5 5 5` ответ 5, а для `10 10 9 8` ответ 9.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int n = a.size();\n" +
      "    cout << a[n - 3];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 2 9 1 3 8", expectedOutput: "5" },
      { input: "5 5 5", expectedOutput: "5" },
      /* The mutant killers, one each: `10 10 9 8` kills the distinct-value
         reading (it answers 8), `1 2 3 4 5 6` kills a[2] (third SMALLEST, 3)
         and a[n - 2] (second largest, 5), the negatives kill a solution
         that only works while everything is positive, and `7 7 7 7 1 2 3`
         kills a walk that skips over equal neighbours. */
      { input: "10 10 9 8", expectedOutput: "9", hidden: true },
      { input: "1 2 3 4 5 6", expectedOutput: "4", hidden: true },
      { input: "-5 -1 -3", expectedOutput: "-5", hidden: true },
      { input: "7 7 7 7 1 2 3", expectedOutput: "7", hidden: true },
      { input: "1 1 2 2 3", expectedOutput: "2", hidden: true },
      { input: "1000000000 -1000000000 0", expectedOutput: "-1000000000", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for b7 — same problem, same cases, same rule about
       repeats. The starting program is the sorted MINIMUM, which is not the
       reference solution of any other block here and is not printed on any
       card: b1 ends with both extremes at once, b5 indexes with k, b6 prints
       the whole list. So the learner has to decide which end of the ordered
       list the answer lives at and how far in — the same decision b7 asks for,
       with the reading and the sorting already assembled. */
    id: "m4.l3.b7s",
    type: "modify_code",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама сандарды реттеп, ЕҢ КІШІ санды шығарады. Оны көлемі бойынша ҮШІНШІ мәнді шығаратындай өзгерт. Кемінде үш сан беріледі. Қайталанатын сандар бөлек-бөлек саналады: `5 5 5` үшін жауап 5, ал `10 10 9 8` үшін жауап 9.",
      ru: "Эта программа сортирует числа и выводит НАИМЕНЬШЕЕ. Измени её так, чтобы она выводила ТРЕТЬЕ по величине значение. Чисел не меньше трёх. Повторы считаются по отдельности: для `5 5 5` ответ 5, а для `10 10 9 8` ответ 9.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int n = a.size();\n" +
      "    cout << a[0];\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int n = a.size();\n" +
      "    cout << a[n - 3];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 2 9 1 3 8", expectedOutput: "5" },
      { input: "5 5 5", expectedOutput: "5" },
      { input: "10 10 9 8", expectedOutput: "9", hidden: true },
      { input: "1 2 3 4 5 6", expectedOutput: "4", hidden: true },
      { input: "-5 -1 -3", expectedOutput: "-5", hidden: true },
      { input: "7 7 7 7 1 2 3", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /* ADVANCED ONLY. PDF p.6: «Негізгі есептерді жедел қарқынмен өтіп, күрделі
       есептер блогына көшу». Deliberately the SAME input shape as b7 and a
       different answer on `10 10 9 8`, because the distinction between "third
       by position" and "third distinct" is the thing being taught and it only
       becomes visible when both questions are asked of one list.
       No `set` anywhere in this course: the sorted list already puts equal
       values side by side, so counting distinct values is one walk from the
       top, and that walk is what m4.l7 reuses. */
    id: "m4.l3.b8",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бұл — алдыңғы есеп емес, басқа есеп. Бір жолда бос орынмен бөлінген кемінде бір бүтін сан беріледі. Көлемі бойынша үшінші ӘРТҮРЛІ мәнді шығар: бірдей сандар қанша рет кездессе де, бір мән болып саналады. Мысалы `10 10 9 8` үшін әртүрлі мәндер 10, 9, 8 — жауап 8 (ал орны бойынша үшінші мән 9 еді). Егер әртүрлі мәндер үштен аз болса, `none` деген сөзді шығар. Реттелген тізімде бірдей сандар қатар тұратынын пайдалан.",
      ru: "Это не предыдущая задача, а другая. В одной строке дано не меньше одного целого числа через пробел. Выведи третье по величине РАЗЛИЧНОЕ значение: сколько бы раз число ни повторялось, оно считается одним значением. Например, для `10 10 9 8` различные значения — 10, 9, 8, и ответ 8 (а третьим по месту было 9). Если различных значений меньше трёх, выведи слово `none`. Используй то, что в отсортированном списке одинаковые числа стоят рядом.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    int x;\n" +
      "    while (cin >> x) {\n" +
      "        a.push_back(x);\n" +
      "    }\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int n = a.size();\n" +
      "    int i = n - 1;\n" +
      "    int ans = a[i];\n" +
      "    int count = 1;\n" +
      "    while (i > 0) {\n" +
      "        if (a[i - 1] != a[i]) {\n" +
      "            count = count + 1;\n" +
      "            ans = a[i - 1];\n" +
      "            if (count == 3) {\n" +
      "                break;\n" +
      "            }\n" +
      "        }\n" +
      "        i = i - 1;\n" +
      "    }\n" +
      "    if (count < 3) {\n" +
      "        cout << \"none\";\n" +
      "    } else {\n" +
      "        cout << ans;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "10 10 9 8", expectedOutput: "8" },
      { input: "5 5 5", expectedOutput: "none" },
      /* `7 7 7 7 1 2 3` kills a walk that stops at the first repeated block;
         `4 4 9` and `8 8` and the single number kill a solution that indexes
         a[n - 3] blindly, which in C++ is not a crash but undefined behaviour —
         a number that is not there;
         `3 3 3 2 2 1 1` has every value repeated, so the count must come from
         the neighbour comparison and not from the positions. */
      { input: "7 7 7 7 1 2 3", expectedOutput: "2", hidden: true },
      { input: "4 4 9", expectedOutput: "none", hidden: true },
      { input: "8 8", expectedOutput: "none", hidden: true },
      { input: "5", expectedOutput: "none", hidden: true },
      { input: "3 3 3 2 2 1 1", expectedOutput: "1", hidden: true },
      { input: "1 2 3 4 5 6", expectedOutput: "4", hidden: true },
      { input: "-5 -1 -3", expectedOutput: "-5", hidden: true },
      { input: "1000000000 1000000000 5 5 -7", expectedOutput: "-7", hidden: true },
    ],
  },
];
