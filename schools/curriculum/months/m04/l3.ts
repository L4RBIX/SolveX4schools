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
 * `sorted()` and `.sort()` become available this month and not earlier. In
 * October «тізімдегі максимум мен минимум» IS the traversal being taught, and
 * in November the same maximum is written as a function — a builtin in either
 * month deletes the exercise. b1 says this to the learner in one sentence:
 * you already wrote the maximum by hand, twice; ordering the whole list is the
 * general form of that move. That is the only place in the lesson where the
 * arrival is announced.
 *
 * ## The two forms, and the bug that follows from confusing them
 *
 * `sorted(a)` returns a NEW list and leaves `a` alone; `a.sort()` reorders `a`
 * in place and returns `None`. b2 checks the first half (the prediction prints
 * `a` after `sorted()` and it is unchanged), b3 the second: `b = a.sort()`
 * followed by `print(b)`, which prints `None`. b3's program prints the ordered
 * list AND the original one, so `print(a)` is not a second valid repair and
 * line 2 is genuinely the only line at fault.
 *
 * ## Repeats: a decision, stated and then enforced
 *
 * «Үшінші мән» with repeats is ambiguous, so b7 fixes it BY POSITION IN THE
 * SORTED LIST — `5 5 5` has third largest `5` — says so in both prompts, and
 * the hidden case `10 10 9 8 → 9` fails any solution that quietly answered the
 * distinct-value question instead. b8, advanced only, then asks that other
 * question on the SAME input and gets 8. It is not a harder version of b7; it
 * is a different problem, and its prompt says so. Without `set()` — which this
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
      kk: "sorted() және .sort(): реттеудің екі түрі",
      ru: "sorted() и .sort(): две формы сортировки",
    },
    body: {
      kk:
        "Қазанда тізімнің ең үлкен элементін циклмен өзің іздедің, қарашада сол іздеуді функцияға шығардың. Бүкіл тізімді реттеу — сол әрекеттің жалпы түрі: бір рет реттесең, ең кішісі де, ең үлкені де, шеттегі бірнеше мән де іздеусіз, тек индекс арқылы алынады.\n\n" +
        "Реттеудің екі жазылу түрі бар, оларды шатастыруға болмайды. `sorted(a)` — ЖАҢА тізім қайтарады, ал `a` бұрынғы күйінде қалады. `a.sort()` — керісінше, `a` тізімінің өзін орнында реттейді және ешқандай мән қайтармайды. Сондықтан `b = a.sort()` деп жазуға болмайды: `b` бос мән (`None`) болып қалады.\n\n" +
        "Екеуі де әдепкі бойынша ӨСУ ретімен реттейді. Демек реттелген тізімде ең кіші сан — `a[0]`, ең үлкені — `a[len(a) - 1]`, ал ең үлкен үш сан — тізімнің соңындағы үш элемент.",
      ru:
        "В октябре ты искал наибольший элемент списка циклом, а в ноябре оформил этот же поиск функцией. Сортировка всего списка — общая форма того же приёма: один раз упорядочил — и наименьшее, и наибольшее, и несколько крайних значений берутся уже без поиска, по индексу.\n\n" +
        "У сортировки две записи, и путать их нельзя. `sorted(a)` возвращает НОВЫЙ список, а сам `a` остаётся прежним. `a.sort()` наоборот: переставляет элементы в самом списке `a` и не возвращает никакого значения. Поэтому писать `b = a.sort()` нельзя — в `b` окажется пустое значение `None`.\n\n" +
        "Обе формы по умолчанию упорядочивают ПО ВОЗРАСТАНИЮ. Значит, в отсортированном списке наименьшее число — это `a[0]`, наибольшее — `a[len(a) - 1]`, а три наибольших — три последних элемента.",
    },
    code:
      "a = [5, 2, 9, 1]\n" +
      "b = sorted(a)\n" +
      "print(b)\n" +
      "print(a)\n" +
      "a.sort()\n" +
      "print(a)\n" +
      "print(a[0], a[len(a) - 1])",
  },
  {
    /* The indices are the point. A learner who only remembers «sorted() reorders
       something» still has to say WHICH list each print reads, and the second
       line is where the "sorted() leaves a alone" claim is actually tested. */
    id: "m4.l3.b2",
    type: "prediction",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама екі жол шығарады. Әр жолды жазар алдында қай тізімнен оқып тұрғанын өзіңе айт. Нәтиже қандай болады?",
      ru: "Программа выводит две строки. Прежде чем записать каждую, скажи себе, из какого списка она читает. Что будет выведено?",
    },
    code:
      "a = [7, 3, 9, 1]\n" +
      "b = sorted(a)\n" +
      "print(b[0], b[3])\n" +
      "print(a[0], a[3])",
    answer: "1 9\n7 1",
    options: ["1 9\n7 1", "1 9\n1 9", "9 1\n7 1", "7 1\n1 9"],
    diagnosticMapping: {
      "1 9\n1 9": {
        failureClass: "sorted_mistaken_for_in_place",
        justification:
          "Екінші жолда 1 9 шығуының жалғыз жолы бар: `sorted(a)` `a` тізімінің өзін де реттеді деп ойлау. Ал `sorted` тек жаңа тізім жасайды, `a` мүлде өзгермейді.",
      },
      "9 1\n7 1": {
        failureClass: "sort_order_assumed_descending",
        justification:
          "b[0] орнында 9 тұруы тек реттеу кему ретімен жүреді деп ойлағанда шығады. Екінші жол дұрыс жазылған, демек қате `a` мен `b`-ны шатастыруда емес, реттеу бағытында.",
      },
    },
  },
  {
    /* «b = a.sort()» is the first error every learner makes with the in-place
       form, and the symptom is not a crash: it is the word None under a program
       that looks finished. The program prints the ordered list AND the original
       one, so swapping line 3 to `print(a)` fixes nothing — line 4 would then
       print the same ordered list twice. Line 2 is the only repair. */
    id: "m4.l3.b3",
    type: "find_bug",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама алдымен сандарды өсу ретімен, содан кейін бастапқы тізімді өзгеріссіз шығаруы керек. Бірақ `5 2 9 1` енгізгенде бірінші жолда `None` шығады, ал екінші жолдағы тізім де бастапқы емес. Қате қай жолда?",
      ru: "Программа должна сначала вывести числа по возрастанию, а потом исходный список без изменений. Но при вводе `5 2 9 1` в первой строке печатается `None`, да и во второй строке список уже не исходный. В какой строке ошибка?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "b = a.sort()\n" +
      "print(b)\n" +
      "print(a)",
    buggyLine: 2,
    symptomInput: "5 2 9 1",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "b = sorted(a)\n" +
      "print(b)\n" +
      "print(a)",
    diagnosticMapping: {
      "3": {
        failureClass: "symptom_location_mistaken_for_defect",
        justification:
          "Үшінші жол `b`-ны дұрыс шығарады — `None` сол жерде КӨРІНЕДІ, бірақ сол жерде ПАЙДА БОЛМАЙДЫ. Бұл жауап оқушының қатені мән бұзылған жерден емес, ол экранға шыққан жерден іздегенін көрсетеді.",
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
    code: "a = [2, 3, 5, 7, 11, 13]\nn = len(a)",
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
    id: "m4.l3.b5",
    type: "fill_blank",
    skillRefs: ["sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда сандар, екінші жолда k саны беріледі (1 ≤ k ≤ сандар саны). Бағдарлама көлемі бойынша k-шы мәнді шығаруы керек, яғни k = 1 болғанда ең үлкенін. Тізімді орнында реттейтін әдісті және индекс өрнегін толықтыр.",
      ru: "В первой строке даны числа, во второй — число k (1 ≤ k ≤ количеству чисел). Программа должна вывести k-е по величине значение, то есть при k = 1 — наибольшее. Дополни метод, сортирующий список на месте, и выражение индекса.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "k = int(input())\n" +
      "a.___()\n" +
      "print(a[len(a) - ___])",
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
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде бір сан, әрқайсысы -10^9 мен 10^9 аралығында). Сол сандарды өсу ретімен, бос орынмен бөліп, бір жолға шығар.",
      ru: "В одной строке даны целые числа через пробел (не меньше одного числа, каждое от -10^9 до 10^9). Выведи эти числа по возрастанию, в одну строку, через пробел.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      'print(" ".join(map(str, a)))',
    cases: [
      { input: "5 2 9 1 3", expectedOutput: "1 2 3 5 9" },
      { input: "42", expectedOutput: "42" },
      /* `10 9 2` and the −10^9 case both kill a solution that forgot
         `map(int, ...)` and sorted the pieces as text: "10" < "2" as strings,
         and "-1000000000" would land in the middle. */
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
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(a[len(a) - 3])",
    cases: [
      { input: "5 2 9 1 3 8", expectedOutput: "5" },
      { input: "5 5 5", expectedOutput: "5" },
      /* The mutant killers, one each: `10 10 9 8` kills the distinct-value
         reading (it answers 8), `1 2 3 4 5 6` kills a[2] (third SMALLEST, 3)
         and a[len(a) - 2] (second largest, 5), the negatives kill a solution
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
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(a[0])",
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "print(a[len(a) - 3])",
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
       No `set()` anywhere in this course: the sorted list already puts equal
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
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "i = len(a) - 1\n" +
      "ans = a[i]\n" +
      "count = 1\n" +
      "while i > 0:\n" +
      "    if a[i - 1] != a[i]:\n" +
      "        count = count + 1\n" +
      "        ans = a[i - 1]\n" +
      "        if count == 3:\n" +
      "            break\n" +
      "    i = i - 1\n" +
      "if count < 3:\n" +
      '    print("none")\n' +
      "else:\n" +
      "    print(ans)",
    cases: [
      { input: "10 10 9 8", expectedOutput: "8" },
      { input: "5 5 5", expectedOutput: "none" },
      /* `7 7 7 7 1 2 3` kills a walk that stops at the first repeated block;
         `4 4 9` and `8 8` and the single number kill a solution that indexes
         a[len(a) - 3] blindly and crashes or prints a number that is not there;
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
