# Months 2–9 — authoring plan

Extraction of the approved programme, month by month, before any content was
written. Everything in the **Source** column is quoted from the PDF; everything
else on this page is a decision *about how to implement it* and is labelled as
such.

## The source

| | |
|---|---|
| File | `9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf` |
| Pages | 12 |
| Issued | Тамыз 2026 |
| Language | Kazakh throughout — there is no Russian edition of the programme |
| Read via | `pdftotext -layout`, complete, all 12 pages |

`schools/curriculum/source-of-truth.ts` already carries the programme's own
figures with page citations, and it agrees with the PDF on every number checked
here. Nothing in it was changed.

### Page map

| Page | Contents |
|---|---|
| 2 | §1 parameters, the nine year-end outcomes |
| 3–4 | §2 the platform, child-safety, the AI rules |
| 5–6 | §3 the 70/30 split, the shape of a week, the three tracks, the five verification methods |
| 7 | §4 **September**, **October** |
| 8 | §4 **November**, **December** |
| 9 | §4 **January**, **February**, **March** |
| 10 | §4 **April**, **May** |
| 11 | §5 the year summary table |
| 12 | §6–8 teacher's role, school requirements, outcomes |

These are the pages `pdfPage` fields must cite, and they match what `skills.ts`
already declares.

## Programme-wide requirements that bind every month

Each is quoted, then given its implementation consequence.

### The three tracks (p.6)

> **Қолдау** — Тек негізгі есептер; дайын кодты құрастыру мен толықтыру
> көбірек, нөлден жазу азырақ. Көмек ертерек ашылады…
> **Негізгі** — Айдың толық тапсырма жиыны және қалауы бойынша 1-2 күрделірек есеп.
> **Тереңдетілген** — Негізгі есептерді жедел қарқынмен өтіп, күрделі есептер
> блогына көшу. Көмек кешірек ашылады, **шешімді жазбаша қорғау міндетті**.

Consequences, and they are not cosmetic:

- Support is **substitution, not subtraction.** «құрастыру мен толықтыру
  көбірек» means *more* reorder/fill-blank/modify, not *fewer* tasks. Every
  `write_code` withheld from support gets a scaffolded twin at the same id with
  an `s` suffix — the convention September already established and
  `tests/school/tracks.test.ts` already enforces.
- Advanced gets a **harder block**, plus at least one `explain` block per month,
  because «жазбаша қорғау міндетті» is a written defence and only `explain`
  carries expected marking points.
- A month with a `tracks` field that no route reads is the exact defect
  `tracks.test.ts` was written for. Track coverage is asserted per month, not
  assumed.

### The five verification methods (p.6)

> Бейтаныс есептер · Кодты қолмен орындау · Қатені табу · Ауызша түсіндіру ·
> Уақыт өте қайта шешу

These are `VerifyBlock.mode`: `unseen_problem`, `manual_trace`, `find_bug`,
`oral_explanation`, `delayed_resolve`. The validator already refuses a non-draft
assessment without `unseen_problem` **and** `oral_explanation`. Every monthly
assessment authored here carries at least three of the five, and the month's own
`Айлық сынақ` paragraph decides which — it is quoted per month below.

### The AI rules (p.4)

> Көмек оқушы өзі бір әрекет жасап көргеннен кейін ғана ашылады…
> ешқашан дайын кодтан басталмайды… оқушы шешімді өз сөзімен түсіндіруге…
> міндетті.

Content consequence only: every block a learner attempts must be an
`ATTEMPT_BLOCK_TYPES` member, or Nova's hint ladder never unlocks. This is the
documented `ATTEMPT_EVENTS` coupling in `types.ts`. Nothing in Nova is modified.

### Lesson length (p.3)

> Түсіндіру 5-8 минуттан, бір сабақта бір ғана идея.

The validator warns above 12 minutes. Lesson `estimatedMinutes` in the existing
stubs run 7–10 and are left alone; nothing is raised.

### The year total (p.11)

> Шамамен 250 оқу тапсырмасы, оның ішінде шамамен 100 толық дербес шешім. Бұл
> **минимум жиын**.

A floor, explicitly. The per-month figures sum to 254 for the eight months that
state one. «100 толық дербес шешім» — 100 fully independent solutions — is a
second, separate promise: it is a count of `write_code` / `challenge` /
`arena_problem` / `verify(unseen_problem)` blocks, not of tasks in general, and
it is tracked separately in the full-year audit.

---

## Month 2 · Қазан — Циклдер және тізімдер (p.7)

**Official theme.** «Қайталау және деректер жиыны: циклдер мен тізімдер (массивтер)»

**Оқушы нені меңгереді (verbatim).**
> for және while циклдерімен әрекетті бірнеше рет орындау; цикл санағышын
> басқару; тізімге мәндер жинау, элементті индекс арқылы алу және бүкіл тізімді
> бір рет қарап шығу. Жолды таңбалар тізбегі ретінде өңдеу, қарапайым ішкі
> циклдерді оқу және жазу.

**Түсіндіру қалай беріледі (verbatim).**
> Басты құрал - бағдарламаның қадамдық орындалуы: әр қадамда цикл айнымалысының,
> индекстің және тізім элементтерінің мәні көрсетіледі. **Бөлек тренажер
> индекстерді көзге көрінетін етеді.** Типтік қателер: шексіз цикл, соңғы
> элементті өткізіп жіберу, индекстің шекарадан шығуы, жинақтаушы айнымалыға
> қате бастапқы мән беру.

Two hard requirements here: a step-execution visualiser (`visual_simulation`,
`loop_trace`) and a **separate index trainer**. The four named typical errors
are the four `find_bug` / `test_case` subjects the month must actually contain —
they are curriculum-derived, not invented.

**Практика — шамамен 38 тапсырма (verbatim families).**
> 1-ден n-ге дейінгі қосынды, цифрлар қосындысы, бөлгіштер саны, жай санды
> тексеру, көбейту кестесі, символдардан өрнек; тізімдегі максимум мен минимум,
> қосынды және орташа мән, орташадан үлкен элементтер саны, тізімді кері аудару;
> сөздегі дауыстылар саны, палиндромды тексеру. Қосымша - цикл мен индекс
> қатесін табу және қолмен трассалау.

Thirteen named families. Each becomes at least one authored task; the
`Қосымша` clause names two more block types the month must carry
(`find_bug` on loops/indices, `trace_code` by hand).

**Айлық сынақ (verbatim).**
> Бейтаныс бағдарламадағы цикл мен тізімнің жұмысын қағазда дұрыс қадамдау және
> цикл мен тізім қолданылатын есепті өз бетінше шешу. Оқушы циклдің неге
> тоқтайтынын және индекстердің неге шекарадан шықпайтынын түсіндіреді.

→ `manual_trace` + `unseen_problem` + `oral_explanation`. Three modes, named by
the source itself.

**End-of-month capability (p.11).**
> for және while арқылы қайталайды, тізімдерді индекспен және толық өту арқылы өңдейді

**Constructs introduced:** `for`, `range`, `while`, `break`/`continue`, list
literal, subscript, `len`, slice, `in`, `+=`. All eleven are already declared in
`ARRIVES_LATER` against October skills — authoring October is what turns those
declarations from formalities into checked facts.

---

## Month 3 · Қараша — Функциялар (p.8)

**Official theme.** «Бағдарлама құрылымы: функциялар, параметрлер және айнымалылардың көріну аймағы»

**Оқушы нені меңгереді (verbatim).**
> Қайталанатын логиканы функцияға бөлу; параметр беру және return арқылы нәтиже
> қайтару; функцияны бірнеше рет шақыру; жергілікті және жаһандық
> айнымалылардың айырмасын, көріну аймағын (scope) және жаһандық күйді орынсыз
> қолданудың неге қауіпті екенін түсіну. Осы айдың соңында оқушы шарттар,
> циклдер, тізімдер, жолдар және функцияларды біріктіріп, **OOP-ке дейінгі
> процедуралық база толық қалыптасады**.

**Түсіндіру қалай беріледі — a countable structural requirement.**
> **Сегіз қысқа сабақ және алты толық талданған мысал.** Платформа функция
> шақырылғанда қандай параметр мәндері кіретінін, қандай жергілікті
> айнымалылар пайда болатынын және return кезінде не қайтатынын визуалды
> көрсетеді. Арнайы бөлімде «неге бұл айнымалы мұнда көрінбейді?» және «неге
> global күтпеген нәтиже берді?» деген қателер талданады.

**Eight short lessons and six fully worked examples** is the only place in the
whole programme that states a lesson count. The stub has **seven** lessons. It
gets an eighth, and six `worked_example` blocks — the PDF wins over the stub.
The two quoted questions are two required `explain`/`find_bug` subjects.

**Практика — шамамен 34 тапсырма (verbatim families).**
> цифрлар қосындысын функциямен есептеу, максимум мен минимум функциясы, санның
> қасиетін тексеретін функция, тізімді өңдейтін көмекші функциялар, мәтінге
> арналған тексерулер, қайталанатын кодты функцияларға бөліп қайта жазу,
> бірнеше функциядан тұратын шағын бағдарлама, жергілікті және жаһандық
> айнымалы қатесін тауып түзету.

**Айлық сынақ (verbatim).**
> Кемінде 2-3 функциядан тұратын бағдарламаны өз бетінше жазу, әр функцияның
> міндетін және параметр мен return байланысын түсіндіру. Қосымша сұрақта
> жергілікті және жаһандық айнымалының қай жерде қолжетімді екенін көрсетіп,
> жаһандық айнымалыны қолданудың бір тәуекелін атайды.

→ `unseen_problem` (≥2–3 functions) + `oral_explanation` + a scope question.

**Explicit prohibition.** «OOP-ке дейінгі» — *before* OOP. No `class`, no
methods-on-objects beyond the list/string methods October already introduced.

---

## Month 4 · Желтоқсан — Жылдамдық (p.8)

**Official theme.** «Бағдарламаның жылдамдығы: сұрыптау және алдын ала есептеу»

**Оқушы нені меңгереді (verbatim).**
> Бағдарламаның берілген уақытқа үлгеретінін бағалау. Бұл спорттық
> бағдарламалаудың негізгі идеясы: **дұрыс жауап тым кеш шықса, қабылданбайды**.

**Түсіндіру қалай беріледі (verbatim).**
> Айдың басты тәсілі - **бір есептің екі шешімін салыстыру**. Платформа баяу
> және жылдам шешімді үлкен деректерде қатар іске қосып, айырманы оқушыға көзбен
> көрсетеді.

The month's central device is a two-solution comparison, not a complexity
lecture. That is why `perf.compare_solutions` exists as a skill.

**Практика — шамамен 32 тапсырма (verbatim families).**
> сандарды реттеу, көлемі бойынша үшінші мәнді табу, тізімдегі әртүрлі мәндер
> саны, ең жиі кездесетін сан, тізім бөлігінің қосындысы туралы көп сұраққа тез
> жауап беру, медиананы табу. Оған қоса «осы бағдарлама үлгере ме?» және
> «үлгермейтін мысал ойлап тап» тапсырмалары.

The last two are named task *types*, and they map onto block types precisely:
«осы бағдарлама үлгере ме?» → `multiple_choice`/`prediction` over a program and
a constraint; «үлгермейтін мысал ойлап тап» → `test_case` (propose an input that
breaks it — here, breaks the *time limit*).

**Айлық сынақ (verbatim).**
> Шартты алған соң кодқа отырмас бұрын қай шешім уақыт бойынша үлгеретінін айтып,
> таңдауын негіздейді.

→ the assessment leads with reasoning *before* code: `oral_explanation` /
`multiple_choice` on feasibility, then `unseen_problem`.

**Prerequisite note.** Sorting arrives here (`sorted`, `.sort()` are declared in
`ARRIVES_LATER` against `sort.basic`, month 4). Nothing before December may use
them — including October's «тізімді кері аудару», which must therefore be
written with a loop, not `sorted`/`reversed`.

---

## Month 5 · Қаңтар — Екіге бөліп іздеу (p.9)

**Official theme.** «Жылдам іздеу: екіге бөлу және екі шекара әдісі»

**Оқушы нені меңгереді (verbatim).**
> Реттелген тізімнен керекті мәнді әр қадамда нұсқалардың жартысын алып тастау
> арқылы іздеу және тізімнің үздіксіз бөлігін екі шекараны жылжыта отырып өңдеу.

**Түсіндіру қалай беріледі — two hard requirements (verbatim).**
> **Міндетті визуалды анимация**: оқушы іздеу шекараларының қалай жақындағанын
> көріп, келесі қадамды алдын ала болжайды. Шекарада қателесу оңай
> болғандықтан, **алғашқы екі аптада дайын кодты оқу, түзету және толықтыру
> көбірек беріледі**.

«Міндетті» — mandatory — so `visual_simulation: "binary_search"` is not
optional, and the learner must *predict the next step*, which makes it a
`prediction` block beside it. And the first half of the month is explicitly
weighted towards read/fix/complete over blank-editor work — for **all three
tracks**, not just support. That is a measurable claim about block-type mix in
the month's first two units and is checked in the month report.

**Практика — шамамен 30 тапсырма (verbatim families).**
> тізімде сан бар ма, оны қай орынға кірістіру керек, берілген аралыққа қанша
> сан түседі, қажетті қосындысы бар жұпты табу, қайталанбайтын ең ұзын бөлік,
> екі реттелген тізімді біріктіру. Қосымша - іздеу шекараларындағы қателерді түзету.

**Айлық сынақ (verbatim).**
> Бағдарлама шеткі жағдайлардың тексеруінен өтеді, ал оқушы екіге бөлу кезінде
> **жауаптың неге жоғалып кетпейтінін** сөзбен түсіндіреді.

The oral question is specific: *why the answer is never discarded*. That is the
loop-invariant question, asked in a fourteen-year-old's vocabulary.

**Prohibition.** `bisect` is a construct the extractor knows and the programme
never teaches. A binary-search month whose tasks are solved by importing
`bisect` teaches nothing; reference solutions here write the loop.

---

## Month 6 · Ақпан — Толық іріктеу және рекурсия (p.9)

**Official theme.** «Нұсқаларды толық тексеру және рекурсия»

**Оқушы нені меңгереді (verbatim).**
> Нұсқалар аз болғанда барлық мүмкін нұсқаны жүйелі түрде тексеру және функция
> дәл сондай, бірақ кішірек есепті шешу үшін өзін-өзі шақыратын тәсілді түсіну.

**Түсіндіру қалай беріледі — and an explicit scope limit (verbatim).**
> Айдың орталық құралы - **шақырулар ағашы**. Оқушы бағдарламаның қалай
> тереңдеп, кейін қалай кері қайтатынын көреді. **Күрделі кері қайту тәсілі
> биыл бүкіл топқа нөлден жаздырылмайды, оқу және түсіндіру, толықтыру
> деңгейінде беріледі.**

Backtracking is deliberately **not** written from scratch by the whole group
this year — it is delivered at read / explain / complete level. Any month-6
content that puts a blank editor and "write a backtracking solution" in front of
the core track contradicts the programme. `fill_blank`, `modify_code`,
`trace_code` and `explain` are the sanctioned shapes.

**Практика — шамамен 30 тапсырма (verbatim families).**
> белгілі қасиеті бар барлық жұп пен үштікті табу, факториал мен дәрежені
> өзін-өзі шақыру арқылы есептеу, сөз симметриясын осы тәсілмен тексеру, 0 мен
> 1-ден тұратын барлық шағын тізбектерді шығару, шағын тордағы жолдар санын
> есептеу. **Мықты оқушыларға - шахмат тақтасына уәзірлерді орналастыру есебі.**

The queens problem is named as advanced-track only. That is the source
*specifying* differentiation, so `tracks: ["advanced"]` on it is
curriculum-derived, not a product decision.

**Айлық сынақ (verbatim).**
> Тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция жазу және салынған
> ағаш бойынша шақыру ретін түсіндіру.

---

## Month 7 · Наурыз — Жол іздеу (p.9)

**Official theme.** «Жол іздеу: карта мен лабиринтті айналып өту»

**Оқушы нені меңгереді (verbatim).**
> Лабиринттегі ең қысқа жолды табу және картадағы байланысқан аймақтарды
> анықтау. Бұл объектілер арасындағы байланыстар туралы есептермен **алғашқы
> танысу**.

First acquaintance with graphs — so this is an introduction, not a graph course.

**Түсіндіру қалай беріледі (verbatim).**
> Тақырып жалпы теориядан емес, **ұяшықты картадан басталады**: ұяшық - нүкте,
> көрші ұяшық - байланыс. Платформада **толқын түрінде боялатын анимация**
> көрсетіледі, оқушы келесі қандай ұяшықтар өңделетінін болжайды.

Explicitly forbidden opening: general graph theory. Required: the grid, and a
wave animation the learner predicts against — `visual_simulation: "bfs_wave"`
plus a `prediction` on which cells colour next.

**Практика — шамамен 26 тапсырма (verbatim families).**
> картада қанша арал бар, берілген нүктеден аймақты бояу, бір ұяшықтан
> екіншісіне жетуге бола ма, лабиринттегі ең қысқа жол, ең үлкен аралдың
> өлшемі, маршрутты қалпына келтіру. Қосымша - **бір ұяшықтың екі рет
> өңделуіне әкелетін қатені түзету**.

**Айлық сынақ (verbatim).**
> Картаға арналған бейтаныс есепті шешіп, **табылған жолдың неге шынымен ең
> қысқа екенін** түсіндіреді.

**Prerequisite hazard, named now.** BFS wants a queue. `collections.deque` is
never taught by this programme. Reference solutions use a list with a moving
head index — which is exactly January's two-pointer idea reused, and is
therefore *taught* rather than smuggled.

---

## Month 8 · Сәуір — Тиімді таңдау және динамика (p.10)

**Official theme.** «Тиімді таңдау және алдыңғы жауаптар арқылы шешу»

**Оқушы нені меңгереді (verbatim).**
> Ойлаудың екі тәсілі: әр қадамда ең тиімді нұсқаны таңдап, оның шынымен ең
> жақсы жауапқа жеткізетінін тексеру; екіншісі - кіші жағдайлар үшін табылған
> жауаптарды пайдаланып үлкен есепті шешу.

**Түсіндіру қалай беріледі (verbatim).**
> Мұнда маңыздысы - **дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы**.
> Платформа ықтимал стратегияны ұсынып, оқушыдан оны шағын мысалда бұзып көруді
> сұрайды. Екінші тәсіл **қадамдап толтырылатын кесте** арқылы беріледі.

The month's core skill is *breaking* a proposed strategy, so the platform must
propose plausible-but-wrong greedy rules on purpose. `test_case` — "name an
input where this rule loses" — is the natural block, and its `breakingInputs`
are checkable.

**Практика — шамамен 28 тапсырма (verbatim families).**
> уақыттары қабаттаспайтын сабақтардың максимумын таңдау, соманы ең аз
> монетамен жинап көріп оның қай кезде қателесетінін табу, баспалдақпен неше
> тәсілмен көтерілу, тізімнің ең үлкен қосындысы бар бөлігін табу, көрші екі
> санды қатар алмау шартымен таңдау, тордағы жолдар санын есептеу.

Six families, and note the second: coin change is set up *so that the greedy
rule fails* — the task is to find when. That is the source telling us the
counterexample is the point.

**Айлық сынақ (verbatim).**
> Кодқа отырмас бұрын **әр аралық нәтиженің нені білдіретінін** сөзбен
> тұжырымдайды; тиімді таңдау есебінде стратегияны не негіздейді, не оған қарсы
> мысал келтіреді.

"What does dp[i] mean" is asked by the programme itself, before code.

---

## Month 9 · Мамыр — Жарыстар (p.10)

**Official theme.** «Жарыстар, талдау және қорытынды турнир»

**Оқушы нені меңгереді (verbatim).**
> Жарыс форматында жұмыс істеу: есептер арасында уақытты бөлу, тексеру
> жүйесінің хабарламаларына дұрыс жауап беру, уақытында басқа есепке ауысу және
> талдаудан кейін міндетті түрде толық шешіп шығу.

**Түсіндіру қалай беріледі (verbatim).**
> **Бұл айда жаңа тақырып жоқ.** Негізгі формат - мұғалімнің бейтаныс есепті
> дауыстап талдауы: тек дұрыс жол ғана емес, **тұйыққа тірелу мен кері қайтулар
> да** көрсетіледі. Жыл бойы жиналған жеке қателер журналы әр оқушы үшін шешімді
> жіберер алдындағы тексеру тізіміне айналады.

No new topic — so May introduces no new construct and no new skill beyond the
four `contest.*` skills. The worked examples must show dead ends and
backtracking, not a clean path: that is stated, and it is unusual enough to be
worth honouring literally.

**Практика — the format, with exact counts (verbatim).**
> **төрт 45 минуттық жаттығу жарысы**, әр жарыстан кейін барлық есепті **үш күн
> ішінде** толық шешу, **апта сайын** ескі есептерді көмексіз қайта орындау,
> **бес бейтаныс есептен тұратын қорытынды турнир** және **екі шешімді ауызша
> қорғау**.

No task total is given. Four contests + a five-problem final is the only
countable structure, and `month-09-may.ts` already derives 25 from it and says
so in a comment. That derivation stands.

**Айлық сынақ (verbatim).**
> Қорытынды турнирде **бес есептің кемінде екеуін шешу** және өз шешімдерінің
> **екеуін түсінікті түрде қорғау**. **Бірі болмаса, екіншісі жеке есепке
> алынбайды.**

The last sentence is a grading rule and it is unusual: solving without defending
does not count, and defending without solving does not count. Implemented as
two `verify` blocks whose relationship is stated in the assessment description —
not as a fake conjunction the machine pretends to score.

**«апта сайын ескі есептерді көмексіз қайта орындау»** is `delayed_resolve`, the
fifth verification mode, and May is where it belongs.

---

## Volume targets

Promised counts are the PDF's. "Authored" is filled in as each month freezes.

| Month | PDF task count | Source |
|---|---|---|
| 2 Қазан | ~38 | p.7, «шамамен 38 тапсырма» |
| 3 Қараша | ~34 | p.8, «шамамен 34 тапсырма» |
| 4 Желтоқсан | ~32 | p.8, «шамамен 32 тапсырма» |
| 5 Қаңтар | ~30 | p.9, «шамамен 30 тапсырма» |
| 6 Ақпан | ~30 | p.9, «шамамен 30 тапсырма» |
| 7 Наурыз | ~26 | p.9, «шамамен 26 тапсырма» |
| 8 Сәуір | ~28 | p.10, «шамамен 28 тапсырма» |
| 9 Мамыр | — | **no figure printed.** 25 derived from the contest structure |

Each figure is «шамамен» — approximately — and p.11 calls the year total a
minimum. A month is not "wrong" for exceeding its number; September already
carries 54 tasks against 36. A month **is** wrong if a paragraph is counted as a
task to reach one, which is why `isTask` counts only `ATTEMPT_BLOCK_TYPES`.

## Authoring order and the freeze rule

October → November → December → January → February → March → April → May, one
month at a time. A month is **frozen** only when all of these pass:

1. `npm run curriculum:validate` — 0 errors
2. `npm run curriculum:test-content` — every reference solution executed against
   every one of its own cases by real Python, every prediction's stated answer
   confirmed by running it, every `find_bug` proven to differ from its fix
3. `npx vitest run tests/nova/construct-context.test.ts` — no construct used
   before the month the programme introduces it
4. `npm run check:bundle` — no reference solution, hidden case or answer key in
   a client bundle
5. adversarial review, by reviewers whose job is to break it, on: technical
   correctness · prerequisites · Kazakh · Russian · assessment · differentiation
   · edge cases · beginner solvability
6. a month report in `docs/curriculum/reviews/MONTH_0N_AUTHORING_REPORT.md`
   stating what is authored, what is not, and what a human still has to judge

Status reached is `implemented` → `validated`. **Not** `published`: publication
in this repository is a gate with an approval row and a content hash
(`schools/curriculum/gate.ts`, migration 0013), and automated validation is not
a human signing off on a fourteen-year-old's school year.

## Provenance rules applied here

- `sourceType: "curriculum-derived"` **only** where the PDF names the thing —
  a topic, a named problem family, a stated verification method, a stated count.
  It requires `pdfPage`, and the validator errors without one.
- `sourceType: "product-authored"` for everything written to *implement* those
  requirements: individual distractors, test cases, scaffolded twins, the
  specific numbers in a prompt, misconception mappings.
- `diagnosticMapping` only where a wrong answer has exactly one cause. This is
  the rule `types.ts` argues at length and the validator enforces with a
  minimum-length justification. Where two misunderstandings produce the same
  wrong answer, the mapping is **omitted** so the engine asks instead of
  telling a child something false about their own mind.
