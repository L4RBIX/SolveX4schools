import type { LessonBlock } from "../../types";

/**
 * Lesson m3.l6 · «Есепті бөліктерге жіктеу» (9 minutes).
 * PDF p.8, November. Skills: `func.define`, `func.parameters`, `func.return`.
 *
 * Three clauses of the programme drive every block below.
 *
 * «Қайталанатын кодты функцияларға бөліп қайта жазу» — the practice paragraph
 * names refactoring repeated code into functions as a family of its own, and
 * `m3.l6.b5` is that family stated literally: four lines written three times,
 * replaced by one function and three calls, with the printed output required to
 * come out unchanged. Nothing else in the month owns that family.
 *
 * «Сегіз қысқа сабақ және алты толық талданған мысал» — `m3.l6.b2` is the
 * SIXTH and last of the month's worked examples (l1, l2, l3, l5 and l8 carry
 * the first five; l4 carries none). It is the only one that starts from a
 * program which already works: twenty straight-line rows that produce the right
 * answer and are still the wrong shape. That is deliberate. The five earlier
 * examples each show a function being born out of a need; this one shows the
 * case a fourteen-year-old actually meets in a contest, where the code runs and
 * the reason to change it is not correctness.
 *
 * «Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу, әр функцияның
 * міндетін … түсіндіру» — November's own Айлық сынақ sentence asks for the job
 * of each function to be stated, so `m3.l6.b8` is an `explain` for EVERY track,
 * not the advanced-only written defence. A learner who meets that question for
 * the first time in the monthly check has been set up to fail it; this is the
 * lesson where it is taught, so it is the lesson where everyone answers it.
 *
 * ## The one idea
 *
 * A function is not a way to shorten repeated lines — it is a way to split the
 * problem, and one function does one job. The test the lesson hands over is
 * mechanical enough to use under time pressure: say the function's job in one
 * sentence, and if the sentence needs the word «және» / «и», that is two
 * functions.
 *
 * ## The distinction that had to be drawn out loud
 *
 * `read_group()` reads its own input and is a GOOD function here, while
 * `digit_sum()` reading its own input is the wrong answer in `m3.l6.b3`. Those
 * two are only consistent under the one-job rule, so `m3.l6.b1` states it
 * instead of leaving a learner to reconcile them: reading may be a whole job,
 * but a function that computes must not also read, because a function calling
 * `input` itself can never be tried on a value the learner chooses. Left
 * implicit, this reads as the lesson contradicting itself, and the learner who
 * notices is the one paying attention.
 *
 * ## Two failures this file is written against
 *
 * A support twin whose completed template is a program the learner can copy off
 * a nearby card teaches transcription. `m3.l6.b7s` therefore counts with an
 * explicit `if is_high(x) == 1:` where `m3.l6.b7` accumulates `c + is_high(x)`:
 * same problem, same two functions, same output, and no line of it is lifted
 * from anywhere. The five other programs in the lesson are pairwise distinct in
 * their data too — a rectangle, jumps, a digit sum, words, a purchase, a single
 * word — so no block's answer is sitting on the card above it.
 *
 * A reorder solvable by indentation alone is not a task. In `m3.l6.b4` five of
 * the eleven lines sit at one level of indentation and their order is decided by
 * what they say: `c = 0` before its loop, `return c` after it, `return 0` after
 * the `if` block it follows. Indentation narrows the choices; it does not make
 * them.
 *
 * ## Deliberately left for later
 *
 * `m3.l7` owns the larger multi-function solutions and testing a single
 * function in isolation; this lesson stops at planning the split and wiring
 * three parts together. Nothing here uses `global` — `m3.l5` owns it, as the
 * hazard the PDF asks to be analysed, and it is never a tool a decomposed
 * program reaches for.
 *
 * Python used: September's and October's, plus `def` and `return`. No `sorted`,
 * no `sum`, no `min`/`max` — November's own practice list asks the learner to
 * WRITE those functions, and December is where ordering arrives. Programs print
 * `big`, `small`, `ok`, `low`, `yes`, `no`, `many`, `few` and plain numbers; no
 * program prints a Kazakh or Russian word, and both prompts name every token.
 */
export const M3_L6: LessonBlock[] = [
  {
    id: "m3.l6.b1",
    type: "concept",
    skillRefs: ["func.define", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Алдымен бөліктердің атын айт, содан кейін кодын жаз",
      ru: "Сначала назови части, потом пиши код",
    },
    /* The body has to survive being read by someone who has already met five
       lessons of `def` and quietly concluded that a function is a way to avoid
       retyping. So it opens by denying exactly that, and the «және» test is
       given as a rule with a checkable failure, not as advice. */
    body: {
      kk: "Функция — қайталанған жолдарды қысқарту үшін ойлап табылған амал емес. Ол — есепті бөлікке бөлудің тәсілі. Сондықтан кодқа отырмас бұрын есепті сөйлеммен айтып шық: «екі қабырғаны оқимын», «периметрін есептеймін», «нәтижесіне қарап жауап шығарамын». Осындай әр сөйлем — бір функцияға үміткер. Тексерудің бір ғана ережесі бар: функцияның міндетін «және» деген сөзсіз бір сөйлеммен айта аласың ба? «Оқиды және есептейді» деп айтуға тура келсе, бұл бір емес, екі функция. Ат — сол сөйлемнің қысқаша түрі, параметрлер — сөйлемге керек дерек, ал `return` — сөйлемнің жауабы. Кірісті оқу да толыққанды міндет бола алады: жалғыз ісі оқу болса, функцияның ішінде `input` тұрғаны дұрыс. Ал есептейтін функция кіріс оқымауы керек. Себебі қарапайым: сан немесе тізім параметрмен келсе, функцияны өзің таңдаған мәнмен тексере аласың; ал ол `input`-ты өзі шақырса, әрқашан пернетақтадан не келсе, соны алады, оны бөлек тексеру мүмкін болмайды. Төмендегі бағдарламада `read_pair` тек оқиды, `perimeter` тек есептеп қайтарады, ал `report` тек `big` не `small` деген ағылшын сөзін шығарады.",
      ru: "Функция — это не приём для сокращения повторяющихся строк. Это способ разбить задачу на части. Поэтому, прежде чем садиться за код, проговори задачу предложениями: «читаю две стороны», «вычисляю периметр», «по результату вывожу ответ». Каждое такое предложение — кандидат в функции. Проверка ровно одна: можешь ли ты назвать задачу функции одним предложением без слова «и»? Если приходится говорить «читает и вычисляет», то это не одна функция, а две. Имя — короткая запись этого предложения, параметры — данные, которые предложению нужны, а `return` — его ответ. Чтение ввода тоже может быть полноценной задачей: если единственное дело функции — читать, то `input` внутри неё уместен. А вот вычисляющая функция читать ввод не должна. Причина простая: если число или список приходят параметром, ты можешь проверить функцию на любом значении, которое выберешь сам; а если она сама зовёт `input`, она всегда берёт то, что пришло с клавиатуры, и проверить её отдельно уже нельзя. В программе ниже `read_pair` только читает, `perimeter` только вычисляет и возвращает, а `report` только выводит английское слово `big` или `small`.",
    },
    code:
      "def read_pair():\n" +
      "    return list(map(int, input().split()))\n" +
      "\n" +
      "def perimeter(a, b):\n" +
      "    return 2 * (a + b)\n" +
      "\n" +
      "def report(p):\n" +
      "    if p > 100:\n" +
      '        print("big")\n' +
      "    else:\n" +
      '        print("small")\n' +
      "\n" +
      "sides = read_pair()\n" +
      "p = perimeter(sides[0], sides[1])\n" +
      "report(p)",
  },
  {
    /* WORKED EXAMPLE 6 of the month's six — the last one. «Сегіз қысқа сабақ
       және алты толық талданған мысал» (p.8).

       The twenty-line version is named stretch by stretch in step 1 rather than
       shown as a second program: `code` is one runnable program, and the
       renderer draws step text as inline prose, so a listing pasted into a step
       would arrive on screen with its newlines collapsed into one grey line. */
    id: "m3.l6.b2",
    type: "worked_example",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: жиырма жолды үш функцияға жіктеу",
      ru: "Разобранный пример: разбиваем двадцать строк на три функции",
    },
    problem: {
      kk: "Дене шынықтыру сабағында екі топ ұзындыққа секіреді. Әр топ үшін жеке жолда, бос орынмен бөлініп, оқушылардың нәтижелері сантиметрмен беріледі. Нәтижесі 150-ден кем болмаған оқушы нормативтен өтті деп саналады. Әр топ үшін екі жол шығару керек: алдымен өткендердің саны, содан кейін өткендер саны кемінде 3 болса `ok`, әйтпесе `low` деген ағылшын сөзі. Мысалы, бірінші топ «160 148 155 170», екінші топ «120 130 151» болса, экранға төрт жол шығуы тиіс.",
      ru: "На уроке физкультуры две группы прыгают в длину. Для каждой группы в отдельной строке через пробел даны результаты учеников в сантиметрах. Ученик считается выполнившим норматив, если его результат не меньше 150. Для каждой группы нужно вывести две строки: сначала количество выполнивших, затем английское слово `ok`, если их не меньше трёх, и `low` в противном случае. Например, если первая группа — «160 148 155 170», а вторая — «120 130 151», на экран должны выйти четыре строки.",
    },
    steps: [
      {
        kk: "Тура жолмен жазсақ, бір топқа он жол керек: бір жол — нәтижелерді оқу, төрт жол — 150-ден кем еместерді санау, бес жол — санды шығарып, `ok` не `low` деп қорытынды жазу. Екі топқа осы он жолды екі рет көшіреміз: жиыны жиырма жол, ал үш үзінді екі реттен қайталанады. Бағдарлама жұмыс істейді, жауабы да дұрыс — бірақ үшінші топ қосылса, отыз жол болады, ал шектегі 150 санын өзгерту керек болса, оны екі жерден іздеп табу керек.",
        ru: "Если писать напрямую, на одну группу уходит десять строк: одна строка — прочитать результаты, четыре — сосчитать тех, у кого не меньше 150, пять — вывести число и написать `ok` или `low`. Для двух групп мы копируем эти десять строк дважды: всего двадцать строк, и три куска повторяются по два раза. Программа работает и отвечает верно — но с третьей группой станет тридцать строк, а если понадобится поменять порог 150, искать его придётся в двух местах.",
      },
      {
        kk: "Көшірместен бұрын есепті сөйлеммен айтып шығамыз: «бір топтың нәтижелерін оқимын», «тізімдегі 150-ден кем емес нәтижелерді санаймын», «санына қарап екі жол шығарамын». Үш сөйлем, ешқайсысында «және» жоқ — демек үш функция.",
        ru: "Прежде чем копировать, проговорим задачу предложениями: «читаю результаты одной группы», «считаю в списке результаты не меньше 150», «по этому количеству вывожу две строки». Три предложения, и ни в одном нет слова «и» — значит, три функции.",
      },
      {
        kk: "Әр сөйлемге ат, параметр және қайтаратын мән табамыз. `read_group()` — параметрі жоқ, өйткені оның жалғыз міндеті — оқу; қайтаратыны сандар тізімі. `count_ok(a)` — параметрі тізім, қайтаратыны бір сан. `report(c)` — параметрі сан; ол ештеңе қайтармайды, тек екі жол шығарады.",
        ru: "Для каждого предложения находим имя, параметр и возвращаемое значение. `read_group()` — без параметров, потому что её единственное дело читать; возвращает список чисел. `count_ok(a)` — параметр список, возвращает одно число. `report(c)` — параметр число; она ничего не возвращает, а выводит две строки.",
      },
      {
        kk: "Шекараны бұзбау маңызды. `count_ok` ештеңе шығармайды — сондықтан оны пернетақтасыз, өзің ойлап тапқан тізіммен тексере аласың, ал шыққан санды кейін басқа есепте де пайдалана аласың. `report` ештеңе санамайды — сондықтан «кемінде 3» ережесі өзгерсе, бүкіл бағдарламада бір ғана функцияға қарайсың.",
        ru: "Важно не размывать границы. `count_ok` ничего не печатает — поэтому её можно проверить без клавиатуры, на списке, который ты придумал сам, а полученное число потом использовать и в другой задаче. `report` ничего не считает — поэтому, если правило «не меньше трёх» изменится, во всей программе смотреть придётся только на одну функцию.",
      },
      {
        kk: "Негізгі бағдарлама енді төрт-ақ жол: екі топты кезекпен алып, оқимыз, санаймыз, есеп береміз. Үшінші топ қосылса, `range(2)` ішіндегі 2 санын ғана өзгертеміз — қалған жолдардың бірде-бірі тимейді.",
        ru: "Основная программа теперь всего в четыре строки: по очереди берём две группы — читаем, считаем, отчитываемся. Появится третья группа — поменяем только двойку в `range(2)`, а остальные строки не тронем вовсе.",
      },
      {
        kk: "Тексерейік. Бірінші топта 160, 155 және 170 — үшеуі де 150-ден кем емес, демек 3; 3 кемінде 3 болғандықтан `ok`. Екінші топта тек 151 өтеді, демек 1; 1 үштен кем болғандықтан `low`.",
        ru: "Проверим. В первой группе 160, 155 и 170 — все три не меньше 150, значит 3; трёх достаточно, поэтому `ok`. Во второй проходит только 151, значит 1; единица меньше трёх, поэтому `low`.",
      },
    ],
    code:
      "def read_group():\n" +
      "    return list(map(int, input().split()))\n" +
      "\n" +
      "def count_ok(a):\n" +
      "    c = 0\n" +
      "    for x in a:\n" +
      "        if x >= 150:\n" +
      "            c = c + 1\n" +
      "    return c\n" +
      "\n" +
      "def report(c):\n" +
      "    print(c)\n" +
      "    if c >= 3:\n" +
      '        print("ok")\n' +
      "    else:\n" +
      '        print("low")\n' +
      "\n" +
      "for i in range(2):\n" +
      "    a = read_group()\n" +
      "    c = count_ok(a)\n" +
      "    report(c)",
    stdin: "160 148 155 170\n120 130 151",
    result: {
      kk: "«160 148 155 170» және «120 130 151» енгізілгенде экранға төрт жол шығады: 3, ok, 1, low.",
      ru: "При вводе «160 148 155 170» и «120 130 151» на экран выйдут четыре строки: 3, ok, 1, low.",
    },
  },
  {
    /* The four options differ ONLY in what each function is responsible for —
       every one of them is valid Python that prints the right answer, so a
       learner cannot arrive at o1 by spotting a syntax error. The algorithm is
       deliberately the digit sum of m3.l3 and m3.l5: reusing a computation they
       have already written three times leaves the whole of the learner's
       attention on the split, which is the only thing this block measures.

       The Kazakh question used to end «Қайсысы — дұрыс бөлу?», two clauses
       after the same prompt promised that all four options «дұрыс жауап
       шығарады». A fourteen-year-old does not read that as one word in two
       senses; they read the card contradicting itself, and the honest answer
       to «which one is correct» becomes «all four — you just said so». The
       Russian never had the collision because it changed adjective on the way
       («верный ответ» → «хорошее разбиение»), so the two prompts were not even
       asking the same question. «Сәтті бөлген» names the quality being judged
       and shares no word with the correctness claim above it. */
    id: "m3.l6.b3",
    type: "multiple_choice",
    skillRefs: ["func.define", "func.parameters", "func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама бір бүтін сан оқиды, оның цифрларының қосындысын табады және сол қосынды 3-ке бөлінсе `yes`, бөлінбесе `no` деген ағылшын сөзін шығарады. Оны функцияларға бөлудің төрт нұсқасы берілген. Төртеуі де қатесіз жұмыс істейді және дұрыс жауап шығарады — айырмасы тек әр функцияның нені міндетіне алғанында. Қай нұсқа есепті сәтті бөлген?",
      ru: "Эта программа читает одно целое число, находит сумму его цифр и выводит английское слово `yes`, если сумма делится на 3, и `no`, если нет. Даны четыре варианта разбиения её на функции. Все четыре работают без ошибок и дают верный ответ — разница только в том, что каждая функция берёт на себя. Какое разбиение хорошее?",
    },
    code:
      "n = int(input())\n" +
      "s = 0\n" +
      "while n > 0:\n" +
      "    s = s + n % 10\n" +
      "    n = n // 10\n" +
      "if s % 3 == 0:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    options: [
      {
        id: "o1",
        label: {
          kk: "Екі функция: `digit_sum(n)` — өзіне берілген санның цифрлар қосындысын қайтарады; `verdict(s)` — өзіне берілген санға қарап `yes` не `no` шығарады. Санды негізгі бағдарлама оқиды.",
          ru: "Две функции: `digit_sum(n)` возвращает сумму цифр переданного ей числа; `verdict(s)` по переданному числу выводит `yes` или `no`. Число читает основная программа.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Бір функция `solve()`: санды өзі оқиды, цифрларын қосады және жауабын өзі шығарады. Негізгі бағдарламада бір ғана жол қалады — `solve()`.",
          ru: "Одна функция `solve()`: сама читает число, складывает его цифры и сама выводит ответ. В основной программе остаётся одна строка — `solve()`.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Екі функция: `digit_sum()` — санды өзі оқып, цифрлар қосындысын қайтарады; `verdict(s)` — өзіне берілген санға қарап `yes` не `no` шығарады.",
          ru: "Две функции: `digit_sum()` сама читает число и возвращает сумму его цифр; `verdict(s)` по переданному числу выводит `yes` или `no`.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Бір функция `digit_sum(n)`: өзіне берілген санның цифрларын қосады және сол жерде `yes` не `no` шығарады. Санды негізгі бағдарлама оқиды.",
          ru: "Одна функция `digit_sum(n)`: складывает цифры переданного ей числа и тут же выводит `yes` или `no`. Число читает основная программа.",
        },
      },
    ],
    correctOptionId: "o1",
    /* o2 carries no mapping on purpose. Choosing it is compatible with at least
       two different beliefs — «бүкіл бағдарламаны функцияға орау деген бөлу»
       and «функция кірісті өзі оқуы керек» — and naming one of them would be
       telling a fourteen-year-old something about their own thinking that this
       answer does not establish. o3 and o4 each differ from o1 along exactly
       one axis, which is what makes them attributable. */
    diagnosticMapping: {
      o3: {
        failureClass: "helper_reads_its_own_input",
        justification:
          "o3 мен o1-дің жалғыз айырмасы — `input` қай жерде тұрғаны: o3-те есептейтін функция санды өзі оқиды. Демек бұл нұсқаны таңдау «функция қажет деректі өзі тауып алуы керек» деген әдетті ұстанғанды білдіреді. Ол әдет l1-де уақытша болған, ал l2-де параметрмен ауыстырылған: `input`-ты өзі шақыратын функцияны өзің таңдаған санмен тексеру мүмкін емес.",
      },
      o4: {
        failureClass: "two_jobs_in_one_function",
        justification:
          "o4 мен o1 нақ бір нәрседе ажырайды: o4-те `digit_sum` цифрларды қосады және сол жерде жауапты да шығарады. Бұл нұсқаны таңдау «бір функция екі міндетті қатар атқара берсін» дегенді қабылдағанды білдіреді, ал сабақтың ережесі дәл соған қарсы: міндетті «және» дегенсіз бір сөйлеммен айта алмасаң, ол екі функция.",
      },
    },
  },
  {
    /* Two levels of split — `count_short` calls `is_short` — because that is
       what «есепті бөліктерге жіктеу» looks like once a part is itself worth
       naming.

       The definition order is pinned by the prompt because it genuinely is not
       forced by Python: `count_short`'s block placed first runs exactly the
       same. Leaving it unpinned would mark a correct program wrong, so the
       prompt states it and the real work stays where it belongs. Five lines
       sit at one indentation level — `if len(w) <= 3:`, `return 0`, `c = 0`,
       `for w in words:`, `return c` — and nothing about their shape says which
       comes first: the accumulator before its loop, the `return` after it, and
       `return 0` only after the `if` block it follows. */
    id: "m3.l6.b4",
    type: "reorder_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "func.reuse", "strings.sequence"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Бағдарлама бір жолдағы бос орынмен бөлінген сөздерді оқып, олардың ішінде ұзындығы 3-тен аспайтын сөздер санын шығарады. Есеп екі бөлікке жіктелген: `is_short` бір сөзді тексеріп 1 не 0 қайтарады, ал `count_short` тізімді аралап, `is_short`-ты әр сөзге шақырады. Бағдарламада алдымен `is_short` жарияланады, содан кейін `count_short`, ал ең соңында негізгі бағдарламаның екі жолы тұрады.",
      ru: "Расставь строки по порядку. Программа читает слова, разделённые пробелами в одной строке, и выводит, сколько среди них слов длиной не больше 3. Задача разбита на две части: `is_short` проверяет одно слово и возвращает 1 или 0, а `count_short` проходит по списку и вызывает `is_short` для каждого слова. Сначала в программе объявляется `is_short`, затем `count_short`, а в самом конце идут две строки основной программы.",
    },
    lines: [
      { id: "q1", code: "def is_short(w):" },
      { id: "q2", code: "    if len(w) <= 3:" },
      { id: "q3", code: "        return 1" },
      { id: "q4", code: "    return 0" },
      { id: "q5", code: "def count_short(words):" },
      { id: "q6", code: "    c = 0" },
      { id: "q7", code: "    for w in words:" },
      { id: "q8", code: "        c = c + is_short(w)" },
      { id: "q9", code: "    return c" },
      { id: "q10", code: "words = input().split()" },
      { id: "q11", code: "print(count_short(words))" },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11"],
  },
  {
    /* «Қайталанатын кодты функцияларға бөліп қайта жазу» — p.8, verbatim, and
       this is the block that owns it. The four repeated lines compute and
       print; the three reading lines stay in the main program, because a
       function that also read would be the shape b1 and b3 rule out.

       The reference solution keeps three separate read/call pairs rather than a
       loop: the task is the extraction, and a learner who additionally wraps it
       in `range(3)` passes the same cases. Both are accepted by the checker,
       which compares output and not shape. */
    id: "m3.l6.b5",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "modify_code",
    skillRefs: ["func.define", "func.parameters", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бұл бағдарлама үш сатып алуды өңдейді. Әр сатып алу үшін жеке жолда, бос орынмен бөлініп, екі бүтін сан беріледі: дана саны (1 ≤ дана ≤ 100) және бір данасының бағасы (0 ≤ баға ≤ 1000). Жалпы құн 100-ден қатаң үлкен болса, одан 10 теңге жеңілдік алынады. Есептеп шығаратын дәл сол төрт жол бағдарламада үш рет жазылған. Сол төрт жолды бір функцияға шығар да, функцияны үш рет шақыр. Оқу жолдары негізгі бағдарламада қалады, ал шығатын нәтиже бұрынғыдай болуы керек: әр сатып алудың құны жеке жолда.",
      ru: "Эта программа обрабатывает три покупки. Для каждой покупки в отдельной строке через пробел даны два целых числа: количество штук (1 ≤ количество ≤ 100) и цена одной штуки (0 ≤ цена ≤ 1000). Если общая стоимость строго больше 100, из неё вычитается скидка в 10 тенге. Одни и те же четыре считающие строки написаны в программе трижды. Вынеси эти четыре строки в одну функцию и вызови её три раза. Строки чтения остаются в основной программе, а вывод должен остаться прежним: стоимость каждой покупки на отдельной строке.",
    },
    code:
      "q, p = map(int, input().split())\n" +
      "t = q * p\n" +
      "if t > 100:\n" +
      "    t = t - 10\n" +
      "print(t)\n" +
      "q, p = map(int, input().split())\n" +
      "t = q * p\n" +
      "if t > 100:\n" +
      "    t = t - 10\n" +
      "print(t)\n" +
      "q, p = map(int, input().split())\n" +
      "t = q * p\n" +
      "if t > 100:\n" +
      "    t = t - 10\n" +
      "print(t)",
    referenceSolution:
      "def bill(q, p):\n" +
      "    t = q * p\n" +
      "    if t > 100:\n" +
      "        t = t - 10\n" +
      "    print(t)\n" +
      "\n" +
      "q, p = map(int, input().split())\n" +
      "bill(q, p)\n" +
      "q, p = map(int, input().split())\n" +
      "bill(q, p)\n" +
      "q, p = map(int, input().split())\n" +
      "bill(q, p)",
    /* The discount boundary is the whole of the arithmetic risk here, so it is
       in three cases and on both sides of it: 100 exactly (no discount, twice),
       101 (discount, by one tenge of total). A learner who copies the four
       lines into the function but writes `>=` fails cases 2 and 5 at once.
       Case 3 keeps every total small, so a solution that discounts
       unconditionally dies there rather than only on a hidden case. */
    cases: [
      { input: "3 40\n2 10\n5 100", expectedOutput: "110\n20\n490" },
      { input: "10 10\n1 101\n1 0", expectedOutput: "100\n91\n0" },
      { input: "1 1\n2 2\n3 3", expectedOutput: "1\n4\n9", hidden: true },
      { input: "20 6\n7 15\n9 11", expectedOutput: "110\n95\n99", hidden: true },
      { input: "100 1000\n1 100\n100 1", expectedOutput: "99990\n100\n100", hidden: true },
    ],
  },
  {
    /* The three holes used to be the three calls in the main program, and the
       first of them wanted `read_word` — a name printed at the top of its own
       template, in the line `def read_word():`. The payload scanner named it
       and the scanner is right: a blank whose answer is already on the screen
       is not a decision, it is transcription with an extra step. The comment
       that used to stand here conceded as much about the other two — «knowing
       that `report` reports is easy» — so one hole out of three was doing the
       work. Shortening the name until it slipped under the scanner's length
       floor would have preserved exactly that task and only stopped it being
       reported.

       So the main program is given whole now, and it is given whole because it
       is the EVIDENCE. `k = count_char(w, "a")` is what proves the counting
       function has to hand its number back instead of printing it. The `"a"`
       standing in that call is what proves the comparison inside must be with
       `ch` and not with the letter today's task happens to ask for: write
       `x == "a"` and the function quietly stops working for any other letter,
       which is the parameter mistake this whole lesson exists to prevent, and
       it is the mistake a learner cannot even make while the answer is a name
       to be copied. The third hole is the rule itself — `report` is the only
       place «кемінде бір рет» is decided, exactly as b2's fourth step argued.
       None of the three answers appears anywhere in the template; a learner
       who wants them reads the wiring rather than the definitions.

       `c >= 1` and its siblings are listed as alternatives because they are the
       same condition on a count, and marking a correct program wrong is the one
       thing a fill_blank must not do. */
    id: "m3.l6.b6",
    type: "fill_blank",
    skillRefs: ["func.define", "func.parameters", "func.return", "strings.sequence"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда кіші латын әріптерінен тұратын бір сөз беріледі (ұзындығы 1-ден 30-ға дейін). Бағдарлама екі жол шығарады: бірінші жолда сөздегі `a` әрпінің саны, екінші жолда — кемінде бір `a` болса `yes`, мүлде болмаса `no` деген ағылшын сөзі. Есеп үш функцияға бөлінген, ал негізгі бағдарламаның үш жолы толық жазылған — жауап сол жолдарда, оларды мұқият оқы. Үш орынды толтыр. Біріншісі: `count_char` кез келген әріп үшін жұмыс істеуі керек, қай әріпті санайтынын негізгі бағдарлама шешіп, оны `ch` параметрімен береді — цикл ішінде кезектегі әріп немен салыстырылады? Екіншісі: `count_char` ештеңе шығармайды, оның нәтижесін негізгі бағдарлама `k`-ға жазады — демек функцияның соңғы жолы не істеуі керек? Үшіншісі: `yes` пен `no` тек `report` ішінде шешіледі — қандай шарт орындалғанда `yes` шығады?",
      ru: "В одной строке дано одно слово из строчных латинских букв (длиной от 1 до 30). Программа выводит две строки: в первой — сколько букв `a` в слове, во второй — английское слово `yes`, если буква `a` встречается хотя бы раз, и `no`, если её нет совсем. Задача разбита на три функции, а три строки основной программы написаны целиком — ответы там, прочитай их внимательно. Заполни три места. Первое: `count_char` должна работать с любой буквой, а какую именно считать, решает основная программа и передаёт её параметром `ch` — с чем тогда сравнивается очередная буква внутри цикла? Второе: `count_char` ничего не печатает, её результат основная программа кладёт в `k` — значит, что должна делать последняя строка функции? Третье: `yes` и `no` решаются только внутри `report` — при каком условии выводится `yes`?",
    },
    template:
      "def read_word():\n" +
      "    return input()\n" +
      "\n" +
      "def count_char(w, ch):\n" +
      "    c = 0\n" +
      "    for x in w:\n" +
      "        if ___:\n" +
      "            c = c + 1\n" +
      "    ___\n" +
      "\n" +
      "def report(c):\n" +
      "    print(c)\n" +
      "    if ___:\n" +
      '        print("yes")\n' +
      "    else:\n" +
      '        print("no")\n' +
      "\n" +
      "w = read_word()\n" +
      'k = count_char(w, "a")\n' +
      "report(k)",
    blanks: [
      { id: "f1", answer: "x == ch", alternatives: ["ch == x"] },
      { id: "f2", answer: "return c" },
      { id: "f3", answer: "c > 0", alternatives: ["c >= 1", "0 < c", "1 <= c", "c != 0"] },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m3.l6.b7 — the same problem and the same two
       functions, entered by completing instead of by writing. PDF p.6:
       «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ».

       What is given away is the shape of the split, which support learners have
       now assembled twice in this lesson. What is left is the three decisions
       the task is actually made of: where the threshold sits, which function
       decides, and which function reports. The counting loop is written with an
       explicit `if is_high(x) == 1:` — support reads a comparison more easily
       than an accumulated 1/0, and it also means the completed program is not a
       copy of any program in this lesson. The statement is repeated in full
       because this route never sees b7. */
    id: "m3.l6.b7s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 30) — оқушылар саны. Екінші жолда бос орынмен бөлінген n баға беріледі, әр баға 0 мен 100 аралығында. Баға 80-нен кем болмаса, ол жоғары деп саналады. Бағдарлама екі жол шығарады: бірінші жолда жоғары бағалардың саны, екінші жолда — жоғары бағалар барлық бағалардың кемінде жартысы болса `many`, әйтпесе `few` деген ағылшын сөзі. Құрылымы дайын: `is_high` бір бағаны тексереді, `report` жауапты шығарады. Үш орынды толтыр — шектегі сан, циклде қай функция шақырылады және соңында қай функция шақырылады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 30) — количество учеников. Во второй строке через пробел даны n оценок, каждая от 0 до 100. Оценка считается высокой, если она не меньше 80. Программа выводит две строки: в первой — количество высоких оценок, во второй — английское слово `many`, если высоких оценок не меньше половины от всех, и `few` иначе. Структура уже готова: `is_high` проверяет одну оценку, `report` выводит ответ. Заполни три места — число в пороге, какая функция вызывается в цикле и какая вызывается в конце.",
    },
    template:
      "def is_high(x):\n" +
      "    if x >= ___:\n" +
      "        return 1\n" +
      "    return 0\n" +
      "\n" +
      "def report(c, n):\n" +
      "    print(c)\n" +
      "    if 2 * c >= n:\n" +
      '        print("many")\n' +
      "    else:\n" +
      '        print("few")\n' +
      "\n" +
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "c = 0\n" +
      "for x in a:\n" +
      "    if ___(x) == 1:\n" +
      "        c = c + 1\n" +
      "___(c, n)",
    blanks: [
      { id: "f1", answer: "80" },
      { id: "f2", answer: "is_high" },
      { id: "f3", answer: "report" },
    ],
  },
  {
    /* «Бірнеше функциядан тұратын шағын бағдарлама» — p.8. The task is stated
       as two jobs and names both functions, because the lesson's objective is
       planning the split, not inventing an interface: a learner who has to
       guess what the helper should be called is being measured on something
       else. `is_high` returns 1 or 0 rather than a bare comparison, the shape
       `m3.l8.b7` uses for a property-checking function.

       Two boundaries carry all the risk and both are named by the prompt: 80
       itself is high, and «кемінде жартысы» includes exactly half.

       The Kazakh used to open «Есепті екі бөлікке жік.» — but «жік» is the
       noun (a seam, a category); the verb is «жіктеу» and its command form is
       «жікте». Every other instruction in the month is a bare verb stem — жаз,
       шығар, толтыр, шеш, бөл — so the one broken form sat in the sentence
       that tells the learner what the task even is. It now reads «бөл», which
       is what the parallel instruction in `m3.l7.b6` already says for the same
       demand, and it mirrors the Russian «раздели» word for word. */
    id: "m3.l6.b7",
    type: "write_code",
    skillRefs: ["func.define", "func.parameters", "func.return", "lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    tracks: ["core", "advanced"],
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 30) — оқушылар саны. Екінші жолда бос орынмен бөлінген n баға беріледі, әр баға 0 мен 100 аралығында. Баға 80-нен кем болмаса, ол жоғары деп саналады.\n" +
        "Есепті екі бөлікке бөл. `is_high(x)` функциясы бір бағаны қабылдап, ол жоғары болса 1, болмаса 0 қайтарады; функцияның ішінде `print` болмайды. `report(c, n)` функциясы жоғары бағалар санын және барлық бағалар санын қабылдап, екі жол шығарады: бірінші жолда жоғары бағалар саны, екінші жолда `many` (жоғары бағалар барлық бағалардың кемінде жартысы болса) немесе `few`.\n" +
        "Негізгі бағдарлама бағаларды оқып, `is_high` арқылы санайды да, `report`-ты бір рет шақырады.\n" +
        "Мысалы, n = 4 және бағалар «90 70 85 60» болса, жауап: 2, содан кейін many.",
      ru:
        "В первой строке дано число n (1 ≤ n ≤ 30) — количество учеников. Во второй строке через пробел даны n оценок, каждая от 0 до 100. Оценка считается высокой, если она не меньше 80.\n" +
        "Раздели задачу на две части. Функция `is_high(x)` принимает одну оценку и возвращает 1, если оценка высокая, и 0 иначе; внутри функции нет `print`. Функция `report(c, n)` принимает количество высоких оценок и общее количество оценок и выводит две строки: в первой — количество высоких оценок, во второй — `many`, если высоких оценок не меньше половины от всех, и `few` иначе.\n" +
        "Основная программа читает оценки, считает их с помощью `is_high` и один раз вызывает `report`.\n" +
        "Например, при n = 4 и оценках «90 70 85 60» ответ: 2, затем many.",
    },
    referenceSolution:
      "def is_high(x):\n" +
      "    if x >= 80:\n" +
      "        return 1\n" +
      "    return 0\n" +
      "\n" +
      "def report(c, n):\n" +
      "    print(c)\n" +
      "    if 2 * c >= n:\n" +
      '        print("many")\n' +
      "    else:\n" +
      '        print("few")\n' +
      "\n" +
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "c = 0\n" +
      "for x in a:\n" +
      "    c = c + is_high(x)\n" +
      "report(c, n)",
    /* What each case kills:
         4 / 90 70 85 60      exactly half → `many`, so `2 * c > n` dies in the open
         5 / 10 20 30 79 80   79 is not high and 80 is, so `x > 80` dies in the
                              open too, and the visible sample shows a `few`
         1 / 100              the single-element top of the range
         1 / 0                the single-element bottom: zero highs, and `2*0 >= 1`
                              is false, so a program that prints `many` on an
                              empty count fails here
         2 / 80 79            one of two — half again, at the smallest n where
                              half is meaningful
         6 / 80 80 79 …       a third, not a half → `few` with a real count
         3 / 0 0 0            no high scores at all, n odd
         4 / 100 …            everything high */
    cases: [
      { input: "4\n90 70 85 60", expectedOutput: "2\nmany" },
      { input: "5\n10 20 30 79 80", expectedOutput: "1\nfew" },
      { input: "1\n100", expectedOutput: "1\nmany", hidden: true },
      { input: "1\n0", expectedOutput: "0\nfew", hidden: true },
      { input: "2\n80 79", expectedOutput: "1\nmany", hidden: true },
      { input: "6\n80 80 79 79 79 79", expectedOutput: "2\nfew", hidden: true },
      { input: "3\n0 0 0", expectedOutput: "0\nfew", hidden: true },
      { input: "4\n100 100 100 100", expectedOutput: "4\nmany", hidden: true },
    ],
  },
  {
    /* For EVERY track, and that is the point rather than an oversight. The
       month's Айлық сынақ asks «әр функцияның міндетін … түсіндіру» of every
       learner who sits it, so every learner practises it here. Advanced's
       compulsory written defence is a separate obligation the month meets
       elsewhere; it is not a reason to withhold the lesson's own objective from
       the two other routes.

       The prompt restates the three functions because an `explain` block
       renders as a prompt and a text area with no program beside it — a
       question about «that program» with nothing on screen is unanswerable, and
       the same absence is what the validator refuses in a `verify`. */
    id: "m3.l6.b8",
    type: "explain",
    skillRefs: ["func.define", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Осы сабақтың толық талданған мысалында үш функция болды: `read_group` (параметрсіз), `count_ok(a)` және `report(c)`. Бағдарлама екі топтың секіру нәтижелерін оқып, әр топ бойынша 150-ден кем емес нәтижелердің санын және `ok` не `low` сөзін шығарады. Әр функцияның міндетін бір сөйлеммен жаз — сөйлемде «және» деген сөз болмауы керек. Содан кейін бір сұраққа жауап бер: осы үшеуінің қайсысын пернетақтасыз, өзің ойлап тапқан тізіммен тексеруге болады және неге?",
      ru: "В разобранном примере этого урока было три функции: `read_group` (без параметров), `count_ok(a)` и `report(c)`. Программа читает результаты прыжков двух групп и для каждой выводит количество результатов не меньше 150 и слово `ok` или `low`. Опиши задачу каждой функции одним предложением — в предложении не должно быть слова «и». Затем ответь на один вопрос: какую из этих трёх можно проверить без клавиатуры, на списке, который ты придумал сам, и почему?",
    },
    expectedPoints: [
      {
        kk: "`read_group` — бір топтың нәтижелерін оқып, тізім етіп қайтарады. Ол санамайды да, шығармайды да.",
        ru: "`read_group` — читает результаты одной группы и возвращает их списком. Она не считает и не выводит.",
      },
      {
        kk: "`count_ok` — өзіне берілген тізімдегі 150-ден кем емес нәтижелердің санын қайтарады. Ол оқымайды да, шығармайды да.",
        ru: "`count_ok` — возвращает количество результатов не меньше 150 в переданном ей списке. Она не читает и не выводит.",
      },
      {
        kk: "`report` — өзіне берілген санды және оған сәйкес `ok` не `low` сөзін экранға шығарады. Ол ештеңе санамайды.",
        ru: "`report` — выводит на экран переданное ей число и соответствующее ему слово `ok` или `low`. Она ничего не считает.",
      },
      {
        kk: "Пернетақтасыз тексеруге болатыны — `count_ok`: оған тізім параметрмен келеді, сондықтан кез келген тізімді өзің беріп, қайтқан санды көре аласың. `read_group` кіріске тәуелді, ал `report` жауапты тек экранға шығарады.",
        ru: "Без клавиатуры можно проверить `count_ok`: список приходит к ней параметром, поэтому можно подать любой свой список и посмотреть, какое число она вернёт. `read_group` зависит от ввода, а `report` только печатает ответ на экран.",
      },
    ],
  },
];
