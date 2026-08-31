import type { LessonBlock } from "../../types";

/**
 * Month 4 · Желтоқсан — lesson 7, «Реттелген тізімді санап шығу» (9 minutes).
 * Taught fifth, after `m4.l4`. The id is the next free number, not the
 * teaching position — the same convention September set with m1.l10–m1.l12.
 *
 * PDF p.8. Three clauses of December drive this lesson:
 *
 *   «Бағдарламаның берілген уақытқа үлгеретінін бағалау… дұрыс жауап тым кеш
 *    шықса, қабылданбайды.»
 *   «…тізімдегі әртүрлі мәндер саны, ең жиі кездесетін сан…»
 *   «…медиананы табу.»
 *
 * The first two families are what this lesson owns and what its two `write_code`
 * blocks are. The third is present as a **rule stated, not a task set**: `b1`
 * says where the middle element of a sorted list lives and what happens when
 * the count is even, because that is the lesson's second objective, and the
 * median problem itself belongs to the month's practice set where it has room
 * for its own cases.
 *
 * ## Why this is a sorting lesson and not a one-liner
 *
 * Both families are a single line with `set()` or a `dict`, and that is exactly
 * why the programme files them under sorting. Neither is available in this
 * course — `scripts/check-blocks.ts` refuses them — and the reason is not
 * squeamishness about builtins: after `a.sort()` equal values are ADJACENT, so
 *
 *   · «неше түрлі мән бар» becomes «неше жерде a[i] өзінің a[i - 1] көршісінен
 *     өзгеше», and
 *   · «ең жиі кездесетін сан» becomes one walk over the runs.
 *
 * That equivalence is the idea of the lesson. A learner who reaches for a set
 * has skipped it; a learner who sorts first has understood why December moved
 * `sorted()`/`.sort()` here in the first place.
 *
 * ## The decision every block obeys
 *
 * **The tie in «ең жиі кездесетін сан» goes to the SMALLEST such value.** The
 * programme does not settle it, so the content must, and on a sorted list the
 * smallest is the natural one: the runs arrive in increasing order, so `>`
 * keeps the first winner and `>=` keeps the last. One character. Both prompts
 * state the rule with a worked example of a tie, `b8`'s hidden cases fail the
 * `>=` mutant, and `b8s` is built out of exactly that character.
 *
 * ## Input shape, unchanged from October
 *
 * One line of space-separated integers, `a = list(map(int, input().split()))`,
 * with the count taken from `len(a)`. Every prompt guarantees at least one
 * number — `a[0]` on an empty list is a crash, not a lesson — and nothing here
 * tests the empty line.
 *
 * Python used: September's, October's and November's, plus this month's
 * `.sort()`. No `set`, no `dict`, no `enumerate`, no comprehension, no import.
 * Every program prints numbers only, so no learner is matching glyphs of a
 * language they do not read.
 */
export const M4_L7: LessonBlock[] = [
  {
    id: "m4.l7.b1",
    type: "concept",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Реттеуден кейін бірдей сандар көрші болып тұрады",
      ru: "После сортировки одинаковые числа становятся соседями",
    },
    /* Two ideas, and they are one idea: sorting turns POSITION into
       information. Neighbours carry equality (the run), and absolute position
       carries rank (a[0], the middle, the last). The median rule is stated
       here — with the even-count caveat spelled out — because the lesson's
       second objective is to state it, not to code it. */
    body: {
      kk: "Қазанда сен тізімнің ең үлкенін циклмен өзің іздедің. Желтоқсанда `.sort()` пайда болды: ол тізімді орнында өсу ретімен қайта тізеді. Реттеудің ең пайдалы салдары — бірдей мәндер енді бір-бірінің қасында, тұтас топ болып тұрады. Осындай топты серия деп атаймыз. Сондықтан «мұндай сан бұрын кездесті ме?» деген сұраққа жауап беру үшін бүкіл тізімді қайта қарап шығудың қажеті жоқ: жалғыз сол жақ көршісін, яғни `a[i - 1]`-ді тексерсең жеткілікті. Реттелген тізімде орынның өзі де мағынаға ие болады: `a[0]` — ең кішісі, `a[len(a) - 1]` — ең үлкені, ал дәл ортасында тұрғаны — `a[len(a) // 2]`. Элемент саны тақ болса, ортаңғы элемент біреу және оның индексі дәл осы. Жұп болса, орта екі элементтің арасына түседі, сондықтан қайсысын алу керегін есеп шартының өзі айтуға тиіс — бағдарлама оны өз бетінше шеше алмайды.",
      ru: "В октябре ты искал максимум списка циклом вручную. В декабре появился `.sort()`: он переставляет список по возрастанию прямо на месте. Самое полезное следствие сортировки — одинаковые значения теперь стоят вплотную друг к другу, одной сплошной группой. Такую группу будем называть серией. Поэтому на вопрос «встречалось ли уже такое число?» больше не нужно заново просматривать весь список: достаточно проверить единственного левого соседа — `a[i - 1]`. В отсортированном списке и сама позиция начинает что-то значить: `a[0]` — наименьший элемент, `a[len(a) - 1]` — наибольший, а ровно посередине стоит `a[len(a) // 2]`. Если количество элементов нечётное, средний элемент один и его индекс именно такой. Если чётное, середина попадает между двумя элементами, и тогда условие задачи обязано само сказать, какой из них брать, — программа не решит это за тебя.",
    },
    code: "a = [7, 3, 7, 1, 3, 7, 5]\na.sort()\nprint(a)\nprint(a[0], a[len(a) // 2], a[len(a) - 1])",
  },
  {
    id: "m4.l7.b2",
    type: "worked_example",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: неше түрлі мән бар",
      ru: "Разобранный пример: сколько различных значений",
    },
    problem: {
      kk: "Алты оқушының бақылау жұмысына алған бағалары берілген: 4, 5, 4, 3, 5, 4. Сыныпта неше түрлі баға кездескенін тап.",
      ru: "Даны оценки шести учеников за контрольную: 4, 5, 4, 3, 5, 4. Найди, сколько различных оценок встретилось в классе.",
    },
    /* Step 1 is the December step and it is deliberately first: the slow
       solution is stated, priced, and only then replaced. Step 4 is the one
       the find_bug and the fill_blank both come back to. */
    steps: [
      {
        kk: "Реттелмеген тізімде бірдей бағалар шашырап жатыр. «Мұндай баға бұрын болды ма?» деп сұрау үшін әр элемент бойынша артқа қарай бүкіл тізімді қарап шығуға тура келеді. Алты элемент үшін бұл он бес шақты салыстыру, ал он мың элемент үшін елу миллионға жуық. Желтоқсанның басты ойы дәл осы жерде көрінеді: жауап дұрыс, бірақ кеш.",
        ru: "В неотсортированном списке одинаковые оценки разбросаны. Чтобы спросить «была ли уже такая оценка?», для каждого элемента приходится просматривать назад весь список. Для шести элементов это около пятнадцати сравнений, а для десяти тысяч — уже около пятидесяти миллионов. Здесь и видна главная мысль декабря: ответ верный, но поздний.",
      },
      {
        kk: "Сондықтан алдымен реттейміз: 3, 4, 4, 4, 5, 5. Енді бірдей бағалардың бәрі қатар тұр, ал тізім бір рет қана қаралады.",
        ru: "Поэтому сначала сортируем: 3, 4, 4, 4, 5, 5. Теперь все одинаковые оценки стоят рядом, а список просматривается всего один раз.",
      },
      {
        kk: "Жаңа мән дәл сол жерде басталады, онда `a[i]` өзінің сол жақ көршісі `a[i - 1]`-ден өзгеше болады. Демек, әртүрлі мәндер саны — осындай орындардың саны.",
        ru: "Новое значение начинается ровно там, где `a[i]` отличается от своего левого соседа `a[i - 1]`. Значит, количество различных значений — это количество таких мест.",
      },
      {
        kk: "Бірінші элементтің сол жақ көршісі жоқ, бірақ ол бірінші топты сөзсіз ашады. Сондықтан есептегіш нөлден емес, бірден басталады, ал цикл `i = 0` емес, `i = 1`-ден жүреді. `count = 0` деп бастасаң, бір ғана элементтен тұратын тізім үшін нөл шығады — ал бос емес тізімде нөл түрлі мән болуы мүмкін емес.",
        ru: "У первого элемента левого соседа нет, но первую группу он открывает в любом случае. Поэтому счётчик начинается не с нуля, а с единицы, а цикл идёт не с `i = 0`, а с `i = 1`. Если начать с `count = 0`, то для списка из одного элемента получится ноль — а в непустом списке нуля различных значений быть не может.",
      },
      {
        kk: "Қадамдар: i = 1 → 4 ≠ 3, count = 2; i = 2 → 4 = 4, өзгермейді; i = 3 → 4 = 4, өзгермейді; i = 4 → 5 ≠ 4, count = 3; i = 5 → 5 = 5, өзгермейді.",
        ru: "Шаги: i = 1 → 4 ≠ 3, count = 2; i = 2 → 4 = 4, не меняем; i = 3 → 4 = 4, не меняем; i = 4 → 5 ≠ 4, count = 3; i = 5 → 5 = 5, не меняем.",
      },
    ],
    code:
      "a = [4, 5, 4, 3, 5, 4]\n" +
      "a.sort()\n" +
      "count = 1\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] != a[i - 1]:\n" +
      "        count = count + 1\n" +
      "print(count)",
    result: { kk: "Экранға: 3", ru: "На экран: 3" },
  },
  {
    id: "m4.l7.b3",
    type: "prediction",
    skillRefs: ["sort.basic", "lists.traverse"],
    sourceType: "product-authored",
    /*
     * The one block that makes the sort load-bearing instead of decorative.
     *
     * The prompt states the author's INTENTION and states the true answer to
     * the underlying question (two distinct values), then asks what the code
     * on screen prints. A learner who answers 2 has read the intention; a
     * learner who answers 4 has read the code. There is no way to arrive at 4
     * by accident here, which is why the two wrong answers below are worth
     * attributing and «1» is not.
     */
    prompt: {
      kk: "Бұл бағдарламаны әртүрлі мәндер санын табу үшін жазған. Тізімде шынымен екі-ақ түрлі сан бар. Бағдарлама экранға нені шығарады?",
      ru: "Эту программу написали, чтобы найти количество различных значений. Различных чисел в списке действительно всего два. Что программа выведет на экран?",
    },
    code:
      "a = [5, 2, 5, 2]\n" +
      "count = 1\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] != a[i - 1]:\n" +
      "        count = count + 1\n" +
      "print(count)",
    answer: "4",
    options: ["1", "2", "3", "4"],
    diagnosticMapping: {
      "2": {
        failureClass: "unsorted_neighbour_scan",
        justification:
          "2 — сұрақтың шын жауабы, бірақ экрандағы код оны шығармайды: мұнда `a.sort()` жоқ. Бұл жауапты таңдау кодты емес, ниетті оқығанды білдіреді — реттелмеген тізімде бірдей мәндер көрші болып тұрмайды, сондықтан көршімен салыстыру ештеңе дәлелдемейді.",
      },
      "3": {
        failureClass: "first_group_not_counted",
        justification:
          "Бұл тізімде `a[i] != a[i - 1]` шарты дәл үш рет ақиқат болады. 3 деген жауап тек ауысу орындарын санап, `count` неге бірден басталатынын ескермегенде шығады: `a[0]` бірінші топты өзі ашады.",
      },
    },
  },
  {
    id: "m4.l7.b4",
    type: "trace_code",
    skillRefs: ["lists.traverse", "loops.counter", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* The list is written already sorted, on purpose: this block is about the
       run counter, and re-litigating the sort here would put two ideas on one
       card. Values are recorded at the loop header — the values CARRIED INTO
       the iteration — the convention m2.l5.b4 established. Naming lines 6 or 8
       instead would say out loud how many times the run was reset, which is
       the entire question. */
    prompt: {
      kk: "Тізім әдейі реттеліп жазылған. Бағдарламаны қағазда қадамдап орында: цикл тақырыбына оралған сайын сол сәттегі `i`, `run` және `best` мәндерін жаз. `run` — қазіргі серияның ұзындығы, `best` — осы уақытқа дейін кездескен ең ұзын серия.",
      ru: "Список записан уже отсортированным. Выполни программу по шагам на бумаге: каждый раз при возврате к заголовку цикла записывай текущие значения `i`, `run` и `best`. `run` — длина текущей серии, `best` — самая длинная серия из встреченных до сих пор.",
    },
    code:
      "a = [2, 2, 5, 5, 5, 9]\n" +
      "run = 1\n" +
      "best = 1\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = 1\n" +
      "    if run > best:\n" +
      "        best = run\n" +
      "print(best)",
    steps: [
      { line: 3, vars: { run: "1", best: "1" } },
      { line: 4, vars: { i: "1", run: "1", best: "1" } },
      { line: 4, vars: { i: "2", run: "2", best: "2" } },
      { line: 4, vars: { i: "3", run: "1", best: "2" } },
      { line: 4, vars: { i: "4", run: "2", best: "2" } },
      { line: 4, vars: { i: "5", run: "3", best: "3" } },
      { line: 11, vars: { run: "1", best: "3" } },
    ],
  },
  {
    id: "m4.l7.b5",
    type: "find_bug",
    skillRefs: ["debug.boundary", "lists.traverse", "sort.basic"],
    sourceType: "product-authored",
    /*
     * The forward-looking twin of the same boundary. b2 and b3 look BACK at
     * a[i - 1] and must therefore start at i = 1; this one looks FORWARD at
     * a[i + 1] and must therefore stop one early. Both spellings are correct
     * Python and both appear in this lesson deliberately — the rule the learner
     * needs is "the loop's range is decided by which neighbour you read", not
     * "always write minus one".
     *
     * The prompt vouches for line 5 explicitly. Without that, a learner could
     * defensibly blame the comparison instead, and a find_bug with two
     * defensible answers grades understanding as error. Vouching for it costs
     * nothing: the fix is still a range the learner has to get right, and the
     * off-by-one is still theirs to find.
     *
     * No diagnosticMapping. Blaming line 5 anyway, or line 2, has more than one
     * possible cause each — misreading the prompt, or believing the neighbour
     * index is what must change — so the engine should ask rather than tell.
     */
    prompt: {
      kk: "Бұл бағдарлама тізімдегі әртүрлі мәндер санын шығаруы керек. `1 4 4 9` енгізгенде ол ешнәрсе шығармай, IndexError қатесімен тоқтап қалады. Салыстыру жолы дұрыс жазылған: әр элемент өзінен КЕЙІНГІ көршісімен салыстырылады, солай қалуы керек. Ендеше қай жол кінәлі?",
      ru: "Эта программа должна выводить количество различных значений в списке. При вводе `1 4 4 9` она ничего не выводит и падает с ошибкой IndexError. Строка сравнения написана правильно: каждый элемент сравнивается со СЛЕДУЮЩИМ соседом, и так и должно остаться. Тогда какая строка виновата?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "count = 1\n" +
      "for i in range(len(a)):\n" +
      "    if a[i] != a[i + 1]:\n" +
      "        count = count + 1\n" +
      "print(count)",
    buggyLine: 4,
    symptomInput: "1 4 4 9",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "count = 1\n" +
      "for i in range(len(a) - 1):\n" +
      "    if a[i] != a[i + 1]:\n" +
      "        count = count + 1\n" +
      "print(count)",
  },
  {
    id: "m4.l7.b6",
    type: "fill_blank",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    /*
     * Three blanks, and none of them can be copied off an earlier card.
     *
     * `sort` — b4's traced program had its list written already sorted, so
     *   nothing on the previous cards tells the learner that this machine needs
     *   ordering. b3 is what tells them, and this is where they act on it.
     * `1` in range — the same boundary as b2 step 4, and the quiet one:
     *   `range(0, len(a))` does not crash, because Python reads `a[-1]` as the
     *   LAST element, so the first comparison silently runs against the largest
     *   value instead of against nothing. On an all-equal list that phantom
     *   match opens the run at 2 and the printed answer comes out one too big.
     * `1` in the reset — not 0. The element that broke the run is already the
     *   first member of the new one.
     *
     * The program prints the COUNT, not the value. b8 asks for the value, so
     * this is the rung below it and not its answer; the prompt says which is
     * which in both languages.
     */
    prompt: {
      kk: "Бағдарлама ең жиі кездесетін сан НЕШЕ РЕТ кездескенін шығаруы керек — санның өзін емес, тек қайталану санын. Мысалы, `2 5 2 5 5` үшін жауап 3. Үш орынды толтыр.",
      ru: "Программа должна вывести, СКОЛЬКО РАЗ встречается самое частое число, — не само число, а только количество повторов. Например, для `2 5 2 5 5` ответ 3. Заполни три пропуска.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "a.___()\n" +
      "run = 1\n" +
      "best = 1\n" +
      "for i in range(___, len(a)):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = ___\n" +
      "    if run > best:\n" +
      "        best = run\n" +
      "print(best)",
    blanks: [
      { id: "f1", answer: "sort" },
      { id: "f2", answer: "1" },
      { id: "f3", answer: "1" },
    ],
  },
  {
    id: "m4.l7.b7",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    /* PDF p.8, «тізімдегі әртүрлі мәндер саны». Available to all three tracks:
       support has now seen it worked (b2), predicted (b3) and repaired (b5),
       and the harder family below is the one they get scaffolded instead. */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі, кемінде біреу. Тізімде неше түрлі мән бар екенін шығар. Мысалы, `5 2 5 2` үшін жауап 2: тізімде төрт сан бар, бірақ түрі екеу ғана.",
      ru: "В одной строке через пробел даны целые числа, хотя бы одно. Выведи, сколько в списке различных значений. Например, для `5 2 5 2` ответ 2: чисел четыре, но различных всего два.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "count = 1\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] != a[i - 1]:\n" +
      "        count = count + 1\n" +
      "print(count)",
    /* The cases are chosen against the four solutions that almost work:
       no sort (case 1 and the last), `count = 0` (the all-equal case and the
       single element), `range(0, len(a))` reading a[-1] (the reversed case,
       where a[0] and a[-1] differ), and counting elements instead of groups
       (any case with a repeat). */
    cases: [
      { input: "5 2 5 2", expectedOutput: "2" },
      { input: "4 5 4 3 5 4", expectedOutput: "3" },
      { input: "7", expectedOutput: "1", hidden: true },
      { input: "6 6 6 6", expectedOutput: "1", hidden: true },
      { input: "1 2 3 4 5", expectedOutput: "5", hidden: true },
      { input: "10 9 8 7", expectedOutput: "4", hidden: true },
      { input: "-2 -2 0 3 3 3", expectedOutput: "3", hidden: true },
    ],
  },
  {
    id: "m4.l7.b8",
    type: "write_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    /* PDF p.8, «ең жиі кездесетін сан». The tie rule is stated in the prompt
       with a worked tie, because the programme does not state one and a hidden
       case that punishes an unstated rule is a trap, not a check. */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі, кемінде біреу. Ең жиі кездесетін санды шығар. Егер бірнеше сан бірдей ең көп рет кездессе, солардың ішіндегі ЕҢ КІШІСІН шығар. Мысалы, `8 8 2 2 5` тізімінде 8 де, 2 де екі реттен кездеседі, сондықтан жауап 2. Шығатын нәтиже — бір ғана сан: мәннің өзі, оның қайталану саны емес.",
      ru: "В одной строке через пробел даны целые числа, хотя бы одно. Выведи число, которое встречается чаще всех. Если таких чисел несколько, выведи НАИМЕНЬШЕЕ из них. Например, в списке `8 8 2 2 5` и 8, и 2 встречаются по два раза, поэтому ответ 2. Вывести нужно одно число — само значение, а не количество его повторов.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "run = 1\n" +
      "best = 1\n" +
      "ans = a[0]\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = 1\n" +
      "    if run > best:\n" +
      "        best = run\n" +
      "        ans = a[i]\n" +
      "print(ans)",
    /* Every case kills something specific:
       `8 8 2 2 5` and `5 2 5 2 9` — the `>=` tie, which answers 8 and 5.
       `3 1 1 3 3`  — no sort at all, which answers 1.
       `7 7 7`      — printing `best` instead of `ans`, which answers 3.
       `3 5 7`      — all runs of length 1: the answer must still be the
                      smallest, which only `ans = a[0]` before the loop gives.
       `4`          — one element, where the loop never runs at all.
       `-3 -3 4 4`  — negatives, and a tie won by the negative value. */
    cases: [
      { input: "8 8 2 2 5", expectedOutput: "2" },
      { input: "5 2 5 2 9", expectedOutput: "2" },
      { input: "7 7 7", expectedOutput: "7" },
      { input: "4", expectedOutput: "4", hidden: true },
      { input: "3 5 7", expectedOutput: "3", hidden: true },
      { input: "3 1 1 3 3", expectedOutput: "3", hidden: true },
      { input: "-3 -3 4 4", expectedOutput: "-3", hidden: true },
      { input: "9 9 3 3 3 1 1", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m4.l7.b8 — same problem, repaired instead of
     * written. PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден
     * жазу азырақ».
     *
     * The starting program appears on no other card in this lesson, which is
     * the point. b6's filled template prints `best` and has no `ans` at all;
     * this one tracks the value, keeps the tie the WRONG way round with `>=`,
     * and prints two numbers. So there is nothing to transcribe: the learner
     * has to find the one character that decides the tie, and the print.
     *
     * `>=` versus `>` is the whole of the tie rule, and it is only decidable by
     * knowing that a sorted list delivers its runs in increasing order — which
     * is what b1 said and what b3 made them prove. A support learner who only
     * fixes the print passes the two visible cases and fails the tie cases,
     * which is the correct outcome: the prompt states the rule.
     */
    id: "m4.l7.b8s",
    type: "modify_code",
    skillRefs: ["sort.basic", "lists.traverse", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Төмендегі бағдарлама екі санды шығарады: ең жиі кездесетін мән және оның неше рет кездескені. Оның үстіне тең жағдайда ол қате таңдау жасайды — бірдей ең көп рет кездесетін мәндердің ЕҢ ҮЛКЕНІН алады. Бағдарламаны өзгерт: экранға бір ғана сан — ең жиі кездесетін мәннің өзі — шықсын, ал тең жағдайда солардың ЕҢ КІШІСІ шықсын. Мысалы, `8 8 2 2 5` үшін жауап 2, себебі 8 де, 2 де екі реттен кездеседі. Кіріс — бір жолдағы бүтін сандар, кемінде біреу.",
      ru: "Программа ниже выводит два числа: самое частое значение и то, сколько раз оно встретилось. Вдобавок при равенстве она выбирает неправильно — берёт НАИБОЛЬШЕЕ из значений с одинаковым числом повторов. Измени программу так, чтобы на экран выходило одно число — само самое частое значение, — а при равенстве выводилось НАИМЕНЬШЕЕ из них. Например, для `8 8 2 2 5` ответ 2, потому что и 8, и 2 встречаются по два раза. На входе — целые числа в одной строке, хотя бы одно.",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "run = 1\n" +
      "best = 1\n" +
      "ans = a[0]\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = 1\n" +
      "    if run >= best:\n" +
      "        best = run\n" +
      "        ans = a[i]\n" +
      "print(ans, best)",
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "run = 1\n" +
      "best = 1\n" +
      "ans = a[0]\n" +
      "for i in range(1, len(a)):\n" +
      "    if a[i] == a[i - 1]:\n" +
      "        run = run + 1\n" +
      "    else:\n" +
      "        run = 1\n" +
      "    if run > best:\n" +
      "        best = run\n" +
      "        ans = a[i]\n" +
      "print(ans)",
    cases: [
      { input: "7 7 7", expectedOutput: "7" },
      { input: "9 9 3 3 3 1 1", expectedOutput: "3" },
      { input: "8 8 2 2 5", expectedOutput: "2", hidden: true },
      { input: "5 2 5 2 9", expectedOutput: "2", hidden: true },
      { input: "4", expectedOutput: "4", hidden: true },
      { input: "3 5 7", expectedOutput: "3", hidden: true },
      { input: "-3 -3 4 4", expectedOutput: "-3", hidden: true },
    ],
  },
];
