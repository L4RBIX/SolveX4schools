import type { LessonBlock } from "../../types";

/**
 * m8.l1 · «Әр қадамда ең тиімдісі» / «Лучшее на каждом шаге» — 9 minutes.
 *
 * Skills: `greedy.core`, `sort.basic`. PDF p.10.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * April's explanation paragraph is a warning before it is a topic: «Мұнда
 * маңыздысы - **дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы**» — what
 * matters is not memorising a ready method, it is the skill of looking for a
 * counterexample. So this file never says "greedy means take the largest". It
 * says: a greedy rule is a PROPOSAL, and a proposal is something you test. The
 * word «ереже» appears next to the word «ұсыныс» in the very first sentence the
 * learner reads, and the worked example puts three proposals on the table
 * before it chooses between them.
 *
 * The problem family is the PDF's own: «уақыттары қабаттаспайтын сабақтардың
 * максимумын таңдау» — choose the maximum number of non-overlapping classes.
 * It is the right family to open the month with because the correct rule is not
 * the obvious one. Earliest start and shortest duration are both plausible,
 * both are what a fourteen-year-old proposes first, and both can be broken on
 * five intervals a learner can draw on paper. The month's skill is being
 * exercised on the very first card, which is what «қарсы мысал іздеу дағдысы»
 * asks for.
 *
 * The month's mastery sentence also names the second half of the work —
 * «оның шынымен ең жақсы жауапқа жеткізетінін тексеру», checking that the rule
 * really does reach the best answer. This lesson deliberately does NOT prove
 * that earliest-end is optimal. It breaks two rules with one example, says out
 * loud that breaking is not the same as proving, and leaves the proof-versus-
 * confidence distinction to m8.l2, whose objectives name it («Дәлел мен сенімді
 * ажырату»). Saying "and this one is correct" without saying why would teach
 * exactly the memorised method the programme forbids.
 *
 * `sort.basic` is the lesson's second skill and it is not decoration. Every
 * greedy rule here is the SAME loop; the only thing that differs is the order
 * the activities arrive in. Sorting is what decides which one is "first", and
 * that sentence is the lesson's other half.
 *
 * ## The input format, fixed here for the month's greedy half
 *
 *     first line: n              (number of classes)
 *     next n lines: s e          (start, then end)
 *
 * Stated in BOTH prompts of every block that reads it. `0 ≤ s < e ≤ 1000`, so
 * `last = 0` is a safe "nothing chosen yet" marker — no start is below it.
 *
 * **Touching is not overlapping.** A class may begin at the exact moment
 * another ends. This is a decision, not a fact, so it is stated in both
 * languages on every block where it can change an answer, and it is enforced by
 * the cases rather than trusted: `b8`/`b8s` case 2 is a chain of three touching
 * classes, where `>` in place of `>=` answers 1 instead of 3, and it is
 * VISIBLE, so the learner meets the boundary before a hidden case judges them
 * on it.
 *
 * ## The `[end, start]` trick, and why it is the lesson rather than a hack
 *
 * `sorted()` and `.sort()` arrived in December with no `key=`, and `lambda` is
 * not in this course at all. So sorting by finishing time is done by storing
 * the pair the other way round: `a.append([e, s])`, and `.sort()` — which
 * compares the first entries, then the second — orders by end. That is not a
 * workaround for a missing feature; it is the lesson's own claim made
 * executable. Reordering the pair changes what "first" means, which is exactly
 * what `b1` says in words and `b3` versus `b5` shows in two programs that
 * differ only in that.
 *
 * Constructs: nothing new arrives. A list whose elements are two-element lists
 * is October's list literal applied twice and October's `[i]` applied twice,
 * and `b1` names both out loud the first time they appear, per the authoring
 * contract's rule 6.
 *
 * ## Programs, and why no two of them are the same program
 *
 * Every program in a lesson about one greedy scan shares a skeleton — that IS
 * the lesson. What must not repeat is the JOB a program does, because a task
 * whose answer sits on a nearby card is transcription. So each job is spent
 * exactly once:
 *
 *   b1   sort three pairs, print the order            (no activities at all)
 *   b2   read nothing: order five classes by end, print them  (the WRONG-rule
 *        comparison happens in prose, by hand, not in code)
 *   b3   the EARLIEST-START rule, hard-coded, prints a count
 *   b5   the earliest-END rule, hard-coded and pre-sorted, prints the final
 *        `last` — no counter anywhere in it
 *   b6   reads pre-sorted input, prints `yes`/`no` per class — no list, no sort
 *   b7   reads input, sorts, prints the chosen classes' END times, one per line
 *   b8   reads input, sorts, prints ONE number — the count   ← learner writes it
 *   b8s  b8 from a starter that prints the earliest finishing time
 *   b9   a different problem entirely: books and a budget    ← learner writes it
 *
 * No two are byte-identical, and the pairwise comparison was run by script over
 * this file and every sibling in `m08/`, not by eye. In particular `b7`'s
 * repaired program is NOT `b8`'s answer: it prints a line per chosen class,
 * `b8` prints a single count, and the learner still has to write the counter
 * and decide what `last` starts at. `b8s`'s editable starter appears nowhere
 * else in the month — it is not the worked example's code and not anyone's
 * reference solution.
 *
 * ## The requirement that could not be enforced, and what was done instead
 *
 * Of the authoring contract's three honest options, this file takes
 * **option 2 — state it as guidance and grade the answer**. Nowhere does a
 * prompt say "you must sort by end time" or "you must use `.sort()`": output
 * comparison cannot see either, and `b8`'s answer is a single number that only
 * a correct choice produces, so any method that gets it right deserves to pass.
 * The `[end, start]` idea is offered as advice in `b1` and `b2` and is never
 * dressed up as a rule the machine is checking. `b9` goes further and does not
 * even name its rule — the learner is asked to propose one and to try to break
 * it, which is the month's whole point and is graded on the count it produces.
 *
 * ## What each graded task's cases are hunting
 *
 * `b8` / `b8s` (maximum non-overlapping classes), by degenerate program:
 *   · earliest START rule                — case 3 (1 vs 3), 7 (1 vs 5), 8 (2 vs 3);
 *   · shortest DURATION rule             — case 3 (2 vs 3), 9 (1 vs 2);
 *   · longest first                      — case 3 (1 vs 3), 7 (1 vs 5);
 *   · no sorting, input order            — case 3 (1 vs 3), 7 (1 vs 5), 8 (2 vs 3);
 *   · `>` instead of `>=`, i.e. touching read as overlap — case 2 (1 vs 3),
 *     and five more;
 *   · counting every class, condition ignored — cases 1, 3, 5, 7, 8, 9;
 *   · comparing the END against `last` instead of the start — same six;
 *   · a loop that stops one short — case 4 (0 vs 1), 2, 6, 8, 9.
 *   Case 4 (n = 1) and case 5 (three identical classes) exist so the two ends
 *   of the range are pinned; case 6 (five disjoint classes) is the one where
 *   the answer is every class, which is what kills the loop that stops early.
 *
 * `b9` (books within a budget):
 *   · not sorting at all                 — case 1 (1 vs 2), 8 (2 vs 4);
 *   · most expensive first               — case 1 (1 vs 2), 8 (2 vs 4);
 *   · `<` instead of `<=`, the exact-money boundary — cases 1, 2, 3, 5, 9;
 *   · counting every price that fits the ORIGINAL budget, i.e. never
 *     subtracting — case 6 (5 vs 3), 8 (6 vs 4), 9 (2 vs 1);
 *   · a loop that stops one short        — case 2 (3 vs 4), 3, 5.
 *   Case 4 (nothing affordable) and case 7 (zero money) are the empty answer;
 *   case 2 is the answer being every book, so "stops one short" cannot hide.
 *
 * ## Track routing
 *
 * `b8` is the from-scratch task the support route does not receive; `b8s` is
 * the same problem as a `modify_code`, starting from a program that prints the
 * earliest finishing time — a program that is nobody's answer. `b9` is written
 * from scratch by all three routes, deliberately: it is the easier of the two
 * and the support route must not leave April having assembled everything and
 * written nothing. `b10` is the advanced route's written defence («шешімді
 * жазбаша қорғау міндетті», p.6) and it asks the question this lesson can
 * otherwise be passed without answering — what `last` actually means, and why
 * finishing early is worth more than starting early.
 */

const P = 10; // PDF page for all of April

export const M8_L1: LessonBlock[] = [
  {
    id: "m8.l1.b1",
    type: "concept",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Ашкөз ереже — жауап емес, ұсыныс",
      ru: "Жадное правило — это не ответ, а предложение",
    },
    /* Two ideas, and the order matters: first that a rule is a claim to be
       tested (the month's own «қарсы мысал іздеу дағдысы»), then that sorting
       is what fixes the meaning of "first". The list-of-lists and the double
       index are named here because this is where they first appear, and
       `.sort()` is recalled from December rather than assumed. */
    body: {
      kk: "Кейбір есептерде шешім қадам-қадаммен жиналады, ал әр қадамда бірнеше нұсқа болады. Ең қарапайым идея — әр қадамда ең тиімді болып КӨРІНГЕН нұсқаны алу. Осындай ережені ашкөз ереже деп атайды.\n\nБірақ мұндай ереже — дайын жауап емес, ұсыныс. «Ең тиімдісі» деген сөздің өзі есепке байланысты: ең ертесі ме, ең қысқасы ма, ең арзаны ма? Әр ұсыныс шын мәнінде ең жақсы жауапқа жеткізеді ме — оны тексеру керек. Тексерудің ең қысқа жолы: ереже жаңылысатын шағын мысал іздеу.\n\n«Бірінші» деген сөздің нені білдіретінін реттеу шешеді. Желтоқсанда ашылған `sort()` тізімді реттейді, ал тізімнің элементтері өздері де тізім бола алады: `[[9, 1], [5, 2]]` — екі жұптан тұратын тізім. `sort()` алдымен әр жұптың БІРІНШІ санын салыстырады, олар тең болса ғана екіншісіне көшеді. Жұптың ішіндегі санға `b[0][0]` түрінде жетесің: бірінші индекс жұпты, екіншісі сол жұптағы санды таңдайды.\n\nОсыдан пайдалы амал шығады: жұпты қай ретпен жинасаң, `sort()` соны бірінші деп санайды. Аяқталу уақыты бойынша реттегің келсе, жұпты `[аяқталу, басталу]` түрінде жинайсың.",
      ru: "В некоторых задачах решение собирается шаг за шагом, и на каждом шаге есть несколько вариантов. Самая простая идея — брать на каждом шаге тот вариант, который КАЖЕТСЯ самым выгодным. Такое правило называют жадным.\n\nНо такое правило — не готовый ответ, а предложение. Само слово «самый выгодный» зависит от задачи: самый ранний? самый короткий? самый дешёвый? Приводит ли предложенное правило к действительно лучшему ответу — это нужно проверять. Самый короткий способ проверки: искать небольшой пример, на котором правило ошибается.\n\nЧто означает слово «первый», решает сортировка. Появившийся в декабре `sort()` упорядочивает список, а элементами списка могут быть сами списки: `[[9, 1], [5, 2]]` — это список из двух пар. `sort()` сравнивает сначала ПЕРВЫЕ числа пар и переходит ко вторым, только если первые равны. До числа внутри пары добираешься так: `b[0][0]` — первый индекс выбирает пару, второй выбирает число в ней.\n\nОтсюда следует полезный приём: в каком порядке ты сложишь пару, то `sort()` и будет считать первым. Хочешь упорядочить по времени окончания — складывай пару как `[окончание, начало]`.",
    },
    code: "b = [[9, 1], [5, 2], [7, 0]]\nb.sort()\nprint(b)\nprint(b[0][0])",
  },
  {
    id: "m8.l1.b2",
    type: "worked_example",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: үш ұсыныс, бір бөлме",
      ru: "Разобранный пример: три предложения, один кабинет",
    },
    /* The five intervals are built so that BOTH plausible wrong rules lose by
       exactly one, not by four. A strawman that answers 1 while the right rule
       answers 3 would let the learner conclude the wrong rules are silly; they
       are not silly, they are wrong, and the difference is the month's subject.
       The choosing is done here in prose, by hand — the code below stops at the
       ordering step on purpose, so that no card in this lesson prints the
       program b8 asks for. */
    problem: {
      kk: "Мектепте бір ғана бос бөлме бар, оған бес үйірме сабағы өтініш берді. Әр сабақтың басталу және аяқталу уақыты белгілі (уақыт — бүтін сандар): 0-6, 1-4, 4-8, 3-5, 8-12. Екі сабақтың уақыты қабаттасса, екеуін бірге өткізуге болмайды. Бір сабақ екіншісі аяқталған дәл сол сәтте бастала алады — мұндай екеуі қабаттаспайды деп саналады. Ең көп дегенде неше сабақ өткізуге болады?",
      ru: "В школе есть только один свободный кабинет, и на него подали заявку пять кружковых занятий. Для каждого известно время начала и окончания (время — целые числа): 0-6, 1-4, 4-8, 3-5, 8-12. Если время двух занятий пересекается, провести оба нельзя. Одно занятие может начаться ровно в тот момент, когда закончилось другое, — такие два не считаются пересекающимися. Сколько занятий можно провести максимум?",
    },
    steps: [
      {
        kk: "Үш ұсыныс бірдей орынды көрінеді: (1) ең ерте БАСТАЛАТЫНЫН ал; (2) ең ҚЫСҚАСЫН ал; (3) ең ерте АЯҚТАЛАТЫНЫН ал. Үшеуін де бір ғана мысалда тексеріп көрейік — соңынан біреуін таңдау үшін.",
        ru: "Три предложения выглядят одинаково разумными: (1) брать то, что начинается РАНЬШЕ всех; (2) брать самое КОРОТКОЕ; (3) брать то, что ЗАКАНЧИВАЕТСЯ раньше всех. Проверим все три на одном примере — чтобы потом выбрать одно.",
      },
      {
        kk: "Ұсыныс 1: ең ерте басталатыны. Бірінші — 0-6. Одан кейін 1-4, 3-5, 4-8 сыймайды (бәрі 6-дан бұрын басталады), ал 8-12 сыяды. Барлығы 2 сабақ: 0-6 және 8-12.",
        ru: "Предложение 1: самое раннее начало. Первым идёт 0-6. После него не помещаются ни 1-4, ни 3-5, ни 4-8 (все они начинаются раньше 6), а 8-12 помещается. Итого 2 занятия: 0-6 и 8-12.",
      },
      {
        kk: "Ұсыныс 2: ең қысқасы. Ең қысқа сабақ — 3-5 (ұзақтығы 2). Оны алсақ, 1-4 те, 4-8 те қабаттасады, 0-6 да қабаттасады. Қалғаны 8-12. Тағы да 2 сабақ: 3-5 және 8-12.",
        ru: "Предложение 2: самое короткое. Самое короткое занятие — 3-5 (длительность 2). Если взять его, то и 1-4, и 4-8 пересекаются, и 0-6 тоже. Остаётся 8-12. Снова 2 занятия: 3-5 и 8-12.",
      },
      {
        kk: "Ұсыныс 3: ең ерте аяқталатыны. Аяқталу уақыты бойынша реті: 1-4, 3-5, 0-6, 4-8, 8-12. Алдымен 1-4 — бөлме 4-те босайды. 3-5 сыймайды (3 < 4), 0-6 сыймайды. 4-8 дәл 4-те басталады, сондықтан сыяды — бөлме 8-де босайды. 8-12 дәл 8-де басталады, ол да сыяды. Барлығы 3 сабақ: 1-4, 4-8, 8-12.",
        ru: "Предложение 3: самое раннее окончание. Порядок по времени окончания: 1-4, 3-5, 0-6, 4-8, 8-12. Сначала берём 1-4 — кабинет освобождается в 4. Занятие 3-5 не помещается (3 < 4), 0-6 тоже. А 4-8 начинается ровно в 4, поэтому помещается — кабинет освобождается в 8. И 8-12 начинается ровно в 8, оно тоже помещается. Итого 3 занятия: 1-4, 4-8, 8-12.",
      },
      {
        kk: "Бір ғана мысал екі ұсынысты құлатты: 2 < 3, сондықтан бірінші де, екінші де ең жақсы жауапты бермейді. Мұны есте сақта: қарсы мысал ережені ЖОҚҚА ШЫҒАРА алады, бірақ бірде-бір мысал ережені дәлелдей алмайды. Үшінші ұсыныс осы мысалда ұтты — бұл әлі оның әрқашан дұрыс екенін білдірмейді. Дәлел мен сенімнің айырмасын келесі сабақта қараймыз.",
        ru: "Один пример обрушил два предложения: 2 < 3, значит ни первое, ни второе не дают лучшего ответа. Запомни: контрпример может ОПРОВЕРГНУТЬ правило, но ни один пример не может его доказать. Третье предложение выиграло на этом примере — это ещё не значит, что оно верно всегда. Разницу между доказательством и уверенностью разберём на следующем уроке.",
      },
      {
        kk: "Таңдауды біз қолмен жасадық. Бағдарламаға алдымен бір нәрсе керек: сабақтарды аяқталу уақыты бойынша қатарға тұрғызу. Ол үшін әр сабақты `[аяқталу, басталу]` жұбы етіп жинап, `sort()` шақырамыз — төмендегі код дәл осыны істейді, таңдау циклін өзің келесі карточкаларда жүргізесің.",
        ru: "Выбор мы сделали руками. Программе сначала нужно другое: выстроить занятия по времени окончания. Для этого складываем каждое занятие парой `[окончание, начало]` и вызываем `sort()` — код ниже делает ровно это, а цикл выбора ты проведёшь сам на следующих карточках.",
      },
    ],
    code: "a = [[6, 0], [4, 1], [8, 4], [5, 3], [12, 8]]\na.sort()\nfor p in a:\n    print(p[1], p[0])",
    result: {
      kk: "Экранға сабақтар аяқталу уақыты бойынша реттеліп шығады, әр жолда «басталу аяқталу»: 1 4 / 3 5 / 0 6 / 4 8 / 8 12. Ал қолмен табылған жауап — 3 сабақ.",
      ru: "На экран занятия выводятся упорядоченными по времени окончания, в каждой строке «начало окончание»: 1 4 / 3 5 / 0 6 / 4 8 / 8 12. А найденный вручную ответ — 3 занятия.",
    },
  },
  {
    id: "m8.l1.b3",
    type: "prediction",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "product-authored",
    /* The wrong rule, written out as a program, on data the learner has not
       seen. The point of the card is that a program does what it says and not
       what its author hoped, so the prompt states the rule neutrally and never
       hints that anything is amiss. */
    prompt: {
      kk: "Бұл бағдарлама «ең ерте басталатынын ал» ережесін орындайды. Тізімнің әр элементі — `[басталу, аяқталу]` жұбы, ал `last` — таңдалған соңғы сабақтың аяқталу уақыты. Сабақтар: 0-5, 1-3, 3-6, 6-9. Экранға не шығады?",
      ru: "Эта программа выполняет правило «бери то, что начинается раньше всех». Каждый элемент списка — пара `[начало, окончание]`, а `last` — время окончания последнего выбранного занятия. Занятия: 0-5, 1-3, 3-6, 6-9. Что появится на экране?",
    },
    code:
      "a = [[0, 5], [1, 3], [3, 6], [6, 9]]\n" +
      "a.sort()\n" +
      "last = 0\n" +
      "cnt = 0\n" +
      "for p in a:\n" +
      "    if p[0] >= last:\n" +
      "        cnt = cnt + 1\n" +
      "        last = p[1]\n" +
      "print(cnt)",
    answer: "2",
    options: ["1", "2", "3", "4"],
    diagnosticMapping: {
      /* Only 3 is mapped. 4 is reachable from at least two different
         confusions — the condition ignored altogether, or `last` believed never
         to change — and 1 is barely reachable at all, so neither proves
         anything and both are left for the engine to ask about. */
      "3": {
        failureClass: "greedy_rule_assumed_optimal",
        justification:
          "3 — осы төрт сабақтың шын максимумы (1-3, 3-6, 6-9), бірақ экрандағы бағдарлама оны шығармайды: ол алдымен 0-5 сабағын алады да, 1-3 пен 3-6 сабақтарын жауып тастайды. Бұл жауапты таңдау кодты емес, «ашкөз ереже әрқашан ең жақсы жауапты береді» деген жорамалды оқығанды білдіреді.",
      },
    },
  },
  {
    id: "m8.l1.b4",
    type: "multiple_choice",
    skillRefs: ["greedy.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір бөлмеде қабаттаспайтын сабақтардың ЕҢ КӨП САНЫН өткізу керек. Мына ережелердің қайсысы осы есепте әрқашан ең көп санды береді?",
      ru: "В одном кабинете нужно провести НАИБОЛЬШЕЕ ЧИСЛО непересекающихся занятий. Какое из этих правил всегда даёт наибольшее число в этой задаче?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Ең ерте басталатын сабақты ал",
          ru: "Брать занятие, которое начинается раньше всех",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Ең қысқа сабақты ал",
          ru: "Брать самое короткое занятие",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Ең ерте аяқталатын сабақты ал",
          ru: "Брать занятие, которое заканчивается раньше всех",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Ең ұзақ сабақты ал — ол бөлмені тиімдірек толтырады",
          ru: "Брать самое длинное занятие — оно заполняет кабинет выгоднее",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      /* o1 is left unmapped on purpose: the worked example and the prediction
         both showed it losing, so choosing it may be inattention rather than a
         belief, and two causes means no attribution. */
      o2: {
        failureClass: "duration_confused_with_finish_time",
        justification:
          "Қысқа сабақ аз орын алады деген ой дұрыс сияқты, бірақ есепте маңыздысы — ұзақтық емес, бөлменің қашан босайтыны. Ортада тұрған қысқа сабақ өзінен бұрынғысын да, кейінгісін де бірдей жауып тастайды. Бұл нұсқаны таңдау ұзақтық пен аяқталу сәтін бір нәрсе деп есептегенде ғана шығады.",
      },
      o4: {
        failureClass: "objective_swapped_for_occupied_time",
        justification:
          "Бұл нұсқа басқа есепті шешеді: бөлме бос тұрған уақытты азайтады. Ал сұрақ сабақтардың САНЫ туралы. Оны таңдау «ең көп сабақ» дегенді «ең көп уақыт» дегенмен алмастырғанды білдіреді, ал бұл нақты бір ғана шатасу.",
      },
    },
  },
  {
    id: "m8.l1.b5",
    type: "trace_code",
    skillRefs: ["greedy.core", "lists.index"],
    sourceType: "product-authored",
    /* No counter in this program at all: its only job is `last`, so that the
       count stays something the learner produces themselves in b8. The steps
       are recorded at the loop header, which means the value written on line i
       is the one carried INTO that iteration — the single update at i = 4 is
       then visible only to someone who actually compared a[3][1] with 4. Two of
       the six decisions are the touching boundary (4 >= 4 and 8 >= 8), which is
       the whole reason this data was chosen. */
    prompt: {
      kk: "Бағдарлама «ең ерте аяқталатынын ал» ережесін орындайды. Тізім аяқталу уақыты бойынша реттеліп қойылған, ал әр элемент — `[аяқталу, басталу]` жұбы: `a[i][0]` — аяқталу, `a[i][1]` — басталу. `last` — таңдалған соңғы сабақтың аяқталу уақыты, басында 0. Сабақ дәл `last` сәтінде бастала алады: бұл қабаттасу емес. Бағдарламаны қағазда қадамдап орында: цикл басына оралған сайын `i` мен `last`-тың сол сәттегі мәнін жаз.",
      ru: "Программа выполняет правило «бери то, что заканчивается раньше всех». Список уже упорядочен по времени окончания, а каждый элемент — пара `[окончание, начало]`: `a[i][0]` — окончание, `a[i][1]` — начало. `last` — время окончания последнего выбранного занятия, в начале 0. Занятие может начаться ровно в момент `last`: это не пересечение. Выполни программу по шагам на бумаге: каждый раз, когда управление возвращается к заголовку цикла, записывай текущие значения `i` и `last`.",
    },
    code:
      "a = [[4, 1], [5, 3], [6, 0], [8, 4], [9, 7], [12, 8]]\n" +
      "last = 0\n" +
      "for i in range(len(a)):\n" +
      "    if a[i][1] >= last:\n" +
      "        last = a[i][0]\n" +
      "print(last)",
    steps: [
      { line: 2, vars: { last: "0" } },
      { line: 3, vars: { i: "0", last: "0" } },
      { line: 3, vars: { i: "1", last: "4" } },
      { line: 3, vars: { i: "2", last: "4" } },
      { line: 3, vars: { i: "3", last: "4" } },
      { line: 3, vars: { i: "4", last: "8" } },
      { line: 3, vars: { i: "5", last: "8" } },
      { line: 6, vars: { last: "12" } },
    ],
  },
  {
    id: "m8.l1.b6",
    type: "fill_blank",
    skillRefs: ["greedy.core", "compare.operators"],
    sourceType: "product-authored",
    /* Two blanks, and both are the decision the lesson turns on: which
       comparison lets a class start at the exact moment the room frees up, and
       WHICH of the two times becomes the new `last`. A learner who writes `s`
       into the second blank gets a program that runs and lies, which is why the
       first blank alone would not be enough. There is no list and no sort here
       — the input is promised sorted — so the completed program is nobody
       else's answer. */
    prompt: {
      kk: "Бағдарлама әр сабақ туралы шешімді бірден шығарады: `yes` — сабақ өтеді, `no` — өтпейді (тек осы екі ағылшын сөзі шығады). Бірінші жолда n саны — сабақтар саны, келесі n жолда әр сабақтың басталу және аяқталу уақыты бос орынмен беріледі. Сабақтар аяқталу уақыты бойынша реттеліп берілген деп кепілдік беріледі, сондықтан тізім де, реттеу де керек емес. `last` — таңдалған соңғы сабақтың аяқталу уақыты. Сабақ дәл `last` сәтінде бастала алады: бұл қабаттасу емес. Екі орынды толтыр. Мысалы, 3 сабақ `1 4`, `3 5`, `4 8` берілсе, жауап `yes`, `no`, `yes` болады.",
      ru: "Программа сразу печатает решение по каждому занятию: `yes` — занятие проводится, `no` — не проводится (выводятся только эти два английских слова). В первой строке дано число n — количество занятий, в следующих n строках через пробел даны время начала и время окончания каждого занятия. Гарантируется, что занятия даны упорядоченными по времени окончания, поэтому ни список, ни сортировка не нужны. `last` — время окончания последнего выбранного занятия. Занятие может начаться ровно в момент `last`: это не пересечение. Заполни два пропуска. Например, для трёх занятий `1 4`, `3 5`, `4 8` ответ будет `yes`, `no`, `yes`.",
    },
    template:
      "n = int(input())\n" +
      "last = 0\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    if s ___ last:\n" +
      '        print("yes")\n' +
      "        last = ___\n" +
      "    else:\n" +
      '        print("no")',
    blanks: [
      { id: "f1", answer: ">=" },
      { id: "f2", answer: "e" },
    ],
  },
  {
    id: "m8.l1.b7",
    type: "find_bug",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "product-authored",
    /* The program prints the chosen classes' END times, one per line — not a
       count. That keeps the repaired program off b8's answer sheet: b8 asks for
       one number and the counter is still the learner's to write.

       The defect is one line, but repairing it is not one character, and the
       prompt says so: swapping the pair changes what every index in the loop
       means. Hiding that would teach that bugs are typos. */
    prompt: {
      kk: "Бағдарлама бір бөлмеде өтетін қабаттаспайтын сабақтарды таңдап, таңдалғандардың аяқталу уақытын әр жолға бір-бірден шығаруы керек. Ол «ең ерте аяқталатынын ал» ережесін орындайтын болып жазылған, бірақ шын мәнінде басқа ережені орындап тұр. Бірінші жолда n, келесі n жолда әр сабақтың басталу және аяқталу уақыты бос орынмен беріледі; сабақтар кез келген ретпен келуі мүмкін. Сабақ дәл алдыңғысы аяқталған сәтте бастала алады. `4 / 0 8 / 2 5 / 5 7 / 7 10` енгізуінде дұрыс жауап — 5, 7, 10, ал бағдарлама тек 8 шығарады. Қай жол кінәлі? Ескерту: сол жолды түзеткенде жұптағы екі санның орны ауысады, сондықтан циклдегі индекстерді де соған сай өзгерту керек.",
      ru: "Программа должна выбрать непересекающиеся занятия для одного кабинета и вывести время окончания каждого выбранного, по одному в строке. Она написана так, будто выполняет правило «бери то, что заканчивается раньше всех», но на деле выполняет другое правило. В первой строке дано n, в следующих n строках через пробел — время начала и окончания каждого занятия; занятия могут идти в любом порядке. Занятие может начаться ровно в момент окончания предыдущего. На вводе `4 / 0 8 / 2 5 / 5 7 / 7 10` правильный ответ — 5, 7, 10, а программа выводит только 8. Какая строка виновата? Учти: при исправлении этой строки два числа в паре меняются местами, поэтому индексы в цикле тоже нужно поправить.",
    },
    code:
      "n = int(input())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    a.append([s, e])\n" +
      "a.sort()\n" +
      "last = 0\n" +
      "for p in a:\n" +
      "    if p[0] >= last:\n" +
      "        print(p[1])\n" +
      "        last = p[1]",
    buggyLine: 5,
    symptomInput: "4\n0 8\n2 5\n5 7\n7 10",
    fixedCode:
      "n = int(input())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    a.append([e, s])\n" +
      "a.sort()\n" +
      "last = 0\n" +
      "for p in a:\n" +
      "    if p[1] >= last:\n" +
      "        print(p[0])\n" +
      "        last = p[0]",
    diagnosticMapping: {
      "6": {
        failureClass: "sort_blamed_instead_of_key",
        justification:
          "Алтыншы жолда `a.sort()` тұр, ал ол өз жұмысын дұрыс істейді: тізімді реттейді. Мәселе — нені реттейтінінде, ал оны бесінші жолда жиналған жұптың реті шешеді. Бұл жолды таңдау реттеу мен реттеу белгісін ажыратпағанды білдіреді.",
      },
    },
  },
  {
    id: "m8.l1.b8",
    type: "write_code",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Мектепте бір ғана бос бөлме бар. Бірінші жолда n саны — өтініш берген сабақтар саны (1 ≤ n ≤ 1000). Келесі n жолда әр сабақтың басталу және аяқталу уақыты бос орынмен беріледі: 0 ≤ басталу < аяқталу ≤ 1000. Сабақтар кез келген ретпен келеді. Уақыттары қабаттаспайтындай етіп ЕҢ КӨП дегенде неше сабақ өткізуге болатынын шығар — жауап бір ғана сан. Бір сабақ екіншісі аяқталған дәл сол сәтте бастала алады: мұндай екеуі қабаттаспайды деп саналады. Мысалы, `4` және `1 3`, `2 5`, `4 7`, `6 8` берілсе, жауап 2.",
      ru: "В школе всего один свободный кабинет. В первой строке дано число n — количество поданных заявок на занятия (1 ≤ n ≤ 1000). В следующих n строках через пробел даны время начала и окончания каждого занятия: 0 ≤ начало < окончание ≤ 1000. Занятия идут в произвольном порядке. Выведи, сколько занятий МАКСИМУМ можно провести так, чтобы их времена не пересекались — ответ одно число. Одно занятие может начаться ровно в тот момент, когда закончилось другое: такие два считаются непересекающимися. Например, при `4` и `1 3`, `2 5`, `4 7`, `6 8` ответ 2.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    a.append([e, s])\n" +
      "a.sort()\n" +
      "last = 0\n" +
      "cnt = 0\n" +
      "for p in a:\n" +
      "    if p[1] >= last:\n" +
      "        cnt = cnt + 1\n" +
      "        last = p[0]\n" +
      "print(cnt)",
    /* Every case was chosen against a named wrong program and every one of them
       was run against that program — see the file header for the full table.
       Case 2 is visible on purpose: it is the touching boundary, and the
       learner should meet it before a hidden case judges them on it. */
    cases: [
      { input: "4\n1 3\n2 5\n4 7\n6 8", expectedOutput: "2" },
      { input: "3\n0 4\n4 8\n8 12", expectedOutput: "3" },
      { input: "5\n0 9\n1 4\n4 8\n3 5\n8 12", expectedOutput: "3", hidden: true },
      { input: "1\n5 6", expectedOutput: "1", hidden: true },
      { input: "3\n2 7\n2 7\n2 7", expectedOutput: "1", hidden: true },
      { input: "5\n0 1\n2 3\n4 5\n6 7\n8 9", expectedOutput: "5", hidden: true },
      { input: "6\n0 20\n1 3\n3 5\n5 7\n7 9\n9 11", expectedOutput: "5", hidden: true },
      { input: "4\n1 5\n5 9\n2 3\n3 4", expectedOutput: "3", hidden: true },
      { input: "3\n0 5\n4 6\n5 10", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m8.l1.b8 — the same problem, modified instead of
       written. PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден
       жазу азырақ». The starter reads the classes and orders them by finishing
       time, which is the fiddly half; the greedy scan — the half this lesson is
       about — is still the learner's to write. The starter itself appears
       nowhere else in April: it is not the worked example's program and it is
       nobody's reference solution, so there is nothing on screen to transcribe. */
    id: "m8.l1.b8s",
    type: "modify_code",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Мектепте бір ғана бос бөлме бар. Бірінші жолда n саны — өтініш берген сабақтар саны (1 ≤ n ≤ 1000). Келесі n жолда әр сабақтың басталу және аяқталу уақыты бос орынмен беріледі: 0 ≤ басталу < аяқталу ≤ 1000. Сабақтар кез келген ретпен келеді. Төмендегі дайын бағдарлама сабақтарды аяқталу уақыты бойынша реттеп, ең ерте аяқталатынының уақытын шығарады. Оны өзгерт: уақыттары қабаттаспайтындай етіп ЕҢ КӨП дегенде неше сабақ өткізуге болатынын шығарсын — жауап бір ғана сан. Бір сабақ екіншісі аяқталған дәл сол сәтте бастала алады: мұндай екеуі қабаттаспайды. Жұптағы `p[0]` — аяқталу, `p[1]` — басталу уақыты. Мысалы, `4` және `1 3`, `2 5`, `4 7`, `6 8` берілсе, жауап 2.",
      ru: "В школе всего один свободный кабинет. В первой строке дано число n — количество поданных заявок (1 ≤ n ≤ 1000). В следующих n строках через пробел даны время начала и окончания каждого занятия: 0 ≤ начало < окончание ≤ 1000. Занятия идут в произвольном порядке. Готовая программа ниже упорядочивает занятия по времени окончания и выводит время того, которое заканчивается раньше всех. Измени её так, чтобы она выводила, сколько занятий МАКСИМУМ можно провести без пересечений по времени — ответ одно число. Одно занятие может начаться ровно в тот момент, когда закончилось другое: такие два не пересекаются. В паре `p[0]` — окончание, `p[1]` — начало. Например, при `4` и `1 3`, `2 5`, `4 7`, `6 8` ответ 2.",
    },
    code:
      "n = int(input())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    a.append([e, s])\n" +
      "a.sort()\n" +
      "print(a[0][0])",
    referenceSolution:
      "n = int(input())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    s, e = map(int, input().split())\n" +
      "    a.append([e, s])\n" +
      "a.sort()\n" +
      "last = 0\n" +
      "cnt = 0\n" +
      "for p in a:\n" +
      "    if p[1] >= last:\n" +
      "        cnt = cnt + 1\n" +
      "        last = p[0]\n" +
      "print(cnt)",
    cases: [
      { input: "4\n1 3\n2 5\n4 7\n6 8", expectedOutput: "2" },
      { input: "3\n0 4\n4 8\n8 12", expectedOutput: "3" },
      { input: "5\n0 9\n1 4\n4 8\n3 5\n8 12", expectedOutput: "3", hidden: true },
      { input: "1\n5 6", expectedOutput: "1", hidden: true },
      { input: "3\n2 7\n2 7\n2 7", expectedOutput: "1", hidden: true },
      { input: "5\n0 1\n2 3\n4 5\n6 7\n8 9", expectedOutput: "5", hidden: true },
      { input: "6\n0 20\n1 3\n3 5\n5 7\n7 9\n9 11", expectedOutput: "5", hidden: true },
      { input: "4\n1 5\n5 9\n2 3\n3 4", expectedOutput: "3", hidden: true },
      { input: "3\n0 5\n4 6\n5 10", expectedOutput: "2", hidden: true },
    ],
  },
  {
    id: "m8.l1.b9",
    type: "write_code",
    skillRefs: ["greedy.core", "sort.basic"],
    sourceType: "product-authored",
    /* The second greedy of the lesson, and the one where the obvious rule is
       simply right. Without it April teaches "greedy is a trap", which is as
       false as "greedy always works" and is not what the programme says: the
       mastery sentence asks the learner to CHECK whether the rule reaches the
       best answer, and sometimes the answer to that check is yes.

       The prompt does not name the rule. Handing over "cheapest first" would
       turn the one card where the learner gets to propose something into
       another exercise in following instructions. */
    prompt: {
      kk: "Мектеп жәрмеңкесінде n кітап сатылады, әр кітап бір-ақ дана. Бірінші жолда екі сан: n — кітап саны (1 ≤ n ≤ 1000) және s — қалтаңдағы ақша (0 ≤ s ≤ 1000000). Екінші жолда бос орынмен бөлініп n кітаптың бағасы беріледі, әр баға 1-ден 1000000-ға дейінгі бүтін сан. Ақшаң жеткенше кітап аласың. Ең көп дегенде неше кітап ала алатыныңды шығар — жауап бір ғана сан. Мысалы, `3 6` және `4 3 3` берілсе, жауап 2. Алдымен өзіңе бір ереже ұсын, сосын оны бұзатын шағын мысал табуға тырыс — таппасаң, ереже осы есепке жарайды.",
      ru: "На школьной ярмарке продаётся n книг, каждая в одном экземпляре. В первой строке два числа: n — количество книг (1 ≤ n ≤ 1000) и s — сколько у тебя денег (0 ≤ s ≤ 1000000). Во второй строке через пробел даны цены n книг, каждая цена — целое число от 1 до 1000000. Ты покупаешь книги, пока хватает денег. Выведи, сколько книг ты можешь купить максимум — ответ одно число. Например, при `3 6` и `4 3 3` ответ 2. Сначала предложи себе правило, а потом попробуй найти небольшой пример, который его ломает: если не найдёшь, правило для этой задачи годится.",
    },
    referenceSolution:
      "n, s = map(int, input().split())\n" +
      "p = list(map(int, input().split()))\n" +
      "p.sort()\n" +
      "cnt = 0\n" +
      "for x in p:\n" +
      "    if x <= s:\n" +
      "        s = s - x\n" +
      "        cnt = cnt + 1\n" +
      "print(cnt)",
    cases: [
      { input: "3 6\n4 3 3", expectedOutput: "2" },
      { input: "4 10\n1 2 3 4", expectedOutput: "4" },
      { input: "2 4\n2 2", expectedOutput: "2", hidden: true },
      { input: "3 1\n2 3 4", expectedOutput: "0", hidden: true },
      { input: "1 5\n5", expectedOutput: "1", hidden: true },
      { input: "5 7\n5 1 1 1 5", expectedOutput: "3", hidden: true },
      { input: "4 0\n3 1 2 4", expectedOutput: "0", hidden: true },
      { input: "6 12\n10 1 2 3 4 5", expectedOutput: "4", hidden: true },
      { input: "2 5\n5 5", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m8.l1.b10",
    type: "explain",
    skillRefs: ["greedy.core"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    tracks: ["advanced"],
    /* The written defence p.6 makes compulsory for Тереңдетілген, and April's
       own «Айлық сынақ» sentence in advance: «әр аралық нәтиженің нені
       білдіретінін сөзбен тұжырымдау». Two questions, not four — the meaning of
       `last`, and the exchange argument behind the rule. Both are read by a
       teacher and neither is scored by a machine. */
    prompt: {
      kk: "Ашкөз циклде `last` айнымалысы бар. (1) Циклдің кез келген қадамында `last` нақты нені білдіреді және неге ол дәл 0-ден басталады — сөзбен жаз. (2) Неге ең ерте АЯҚТАЛАТЫН сабақты алған дұрыс, ал ең ерте басталатынын алған дұрыс емес? Жауабыңда бір-бірімен қабаттасатын нақты екі сабақты алып, екеуінің қайсысын таңдағанда кейінгі сабақтарға көбірек орын қалатынын салыстыр.",
      ru: "В жадном цикле есть переменная `last`. (1) Что именно она означает на любом шаге цикла и почему она начинается именно с 0 — напиши словами. (2) Почему верно брать занятие, которое раньше ЗАКАНЧИВАЕТСЯ, а не то, которое раньше начинается? В ответе возьми два конкретных пересекающихся занятия и сравни, при каком из двух выборов для следующих занятий остаётся больше места.",
    },
    expectedPoints: [
      {
        kk: "`last` — таңдалып қойған соңғы сабақтың аяқталу уақыты, яғни бөлменің қай сәтте босағаны. Ол әр таңдау сайын ғана өзгереді, өткізілмеген сабақтан кейін өзгермейді.",
        ru: "`last` — это время окончания последнего уже выбранного занятия, то есть момент, когда освобождается кабинет. Она меняется только при выборе и не меняется после пропущенного занятия.",
      },
      {
        kk: "Басында ешбір сабақ таңдалмаған, ал уақыттар 0-ден кіші емес, сондықтан `last = 0` «бөлме әуел бастан бос» дегенді білдіреді және бірінші сабақ әрқашан шартқа сай келеді.",
        ru: "В начале ещё ничего не выбрано, а времена не меньше нуля, поэтому `last = 0` означает «кабинет свободен с самого начала», и первое занятие всегда проходит проверку.",
      },
      {
        kk: "Екі сабақ қабаттасса, ерте аяқталатынын алу қалған уақытты кеңірек қалдырады: кеш аяқталатынын алғанда кейін сыятын сабақтардың бәрі ерте аяқталатынын алғанда да сияды, ал керісінше емес. Сондықтан ерте аяқталатынын алудан жауап нашарлай алмайды. Ал басталу уақыты бөлменің қашан босайтыны туралы ештеңе айтпайды — ерте басталған сабақ кеш аяқталуы мүмкін.",
        ru: "Если два занятия пересекаются, выбор того, которое заканчивается раньше, оставляет больше свободного времени: всё, что помещалось после позже заканчивающегося, поместится и после раньше заканчивающегося, а наоборот — нет. Поэтому от такого выбора ответ хуже стать не может. А время начала ничего не говорит о том, когда освободится кабинет: рано начавшееся занятие может закончиться поздно.",
      },
    ],
  },
];
