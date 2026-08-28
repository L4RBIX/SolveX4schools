# October and November — adversarial review

Six independent reviewers, one per dimension, over `m02/` and `m03/` after both
months had passed every automated gate: `check-blocks`, `curriculum:validate`,
`content-execution`, `construct-context`, `tracks-every-month`, `payload-privacy`.

Every finding was then handed to a separate agent whose instructions were to
**refute** it — default refuted unless independently reproduced. That second
pass matters: it removed eight claims, and it corrected three of the ones it
confirmed (a count, an anchor block, and a proposed fix that would not have
worked).

**33 claims · 25 confirmed · 8 refuted · 39 agents.**

The confirmed findings are grouped below by what they say about the content, not
by who found them. Where a finding named a defect class rather than a single
block, the class is what got fixed — several are now enforced mechanically, so
the five remaining months cannot repeat them. See the closing section of
`docs/curriculum/AUTHORING_CONTRACT.md`.

---

## Confirmed (25)

### MAJOR · `m2.l7.b9` · l7.ts · *technical*

**Claim.** Sixteen prompts in October and November embed newlines and ASCII layout, but `BlockPrompt` renders the prompt into a bare `<p>` with no whitespace class, so every newline and every run of spaces collapses to one space — the centred-triangle picture that `{kind:"exact"}` demands becomes an unreadable blob, and `m2.l7.b8s` (a reorder_code, which has no case table to fall back on) loses its only rendering of the required shape.

**Evidence.**

```
Renderer: `src/components/brilliant/lesson/blocks/primitives.tsx:97-99` — `export function BlockPrompt({children}) { return <p className="w-full text-[16px] leading-6">{children}</p>; }`. No `whitespace-pre-line`/`pre-wrap`, and `grep -rn "white-space" src/app/globals.css src/app/solvex.css src/components/brilliant/lesson/blocks/primitives.tsx` returns nothing, so the CSS initial value `white-space: normal` applies. Contrast `ConceptView` (index.tsx:186-191), which explicitly does `t(block.body).split("\n").filter(Boolean).map(...)` — concept bodies handle newlines, prompts do not. All 13 BlockPrompt call sites pass the raw string. Simulating the collapse (`re.sub(r'\s+',' ',prompt)`) on m2.l7.b9's ru prompt yields: `... При n = 4 должно вывестись в точности так: * *** ***** *******` — the leading spaces the exact checker requires byte-for-byte are gone. m2.l7.b8s yields `... При n = 3 выводится так: * ** ***`. m2.l7.b7 yields `... в точности так: 1 2 3 2 4 6 3 6 9`. m3.as.b3's four numbered questions run together into one paragraph. Enumerating multi-line strings across months 1-3 via `npx tsx` over `MONTHS`: September has **zero** multi-line prompts; October/November have 16 (m2.l7.b7, m2.l7.b8, m2.l7.b8s, m2.l7.b9, m3.l8.b6, m3.l8.b7, m3.l8.b8, m3.l8.b8s, m3.l8.b9, m3.l6.b7, m3.l7.b6, m3.l7.b6s, m3.l7.b7, m3.as.b1, m3.as.b2, m3.as.b3, m3.as.b4).
```

**Proposed fix.** Either give `BlockPrompt` `className="... whitespace-pre-line"` (and wrap the ASCII pictures so they render in the mono face), or split the prompt on `\n` into paragraphs the way `ConceptView` already splits `body`. Until one of those lands, the three m2.l7 prompts should not claim «должно вывестись в точности так:» / «дәл былай шығуы керек:» above a picture the learner cannot see.

**Verification.** Confirmed independently. SSR-rendering the real block gives `<p class="w-full text-[16px] leading-6">…в точности так:\n   *\n  ***\n *****\n*******</p>` — a bare <p> with no white-space handling. `grep -n "white-space" node_modules/tailwindcss/preflight.css` exits 1, no CSS in src/app/*.css touches it, and the only whitespace-* classes in src/ sit on mono spans that are not ancestors of BlockPrompt, so `white-space: normal` collapses every newline and space run. All 13 BlockPrompt call sites pass the raw string. This hits the real learner routes (lesson-route.tsx, assessment-route.tsx) and the teacher review view, not a dev lab.

Three corrections to the claim. (1) The count is 19 multi-line prompts in Oct+Nov (6 in M2, 13 in M3), not 16; their list misses m2.l3.b8 and m2.l3.b8s, both also {kind:"exact"} with a three-line picture. September is indeed zero, but December adds 9 more, so it is not an Oct/Nov-only condition. (2) The anchor block m2.l7.b9 is largely mitigated: CodeTaskView renders CaseTable immediately below the editor in `font-b-mono … whitespace-pre` (index.tsx:837-841), and b9's visible cases include `4 -> "   *\n  ***\n *****\n*******"`, so the centred triangle IS r
… (truncated)

---

### MINOR · `m3.l8.b4` · l8.ts · *technical*

**Claim.** The trace grid renders a name omitted from a step's `vars` as an em-dash, i.e. "this name does not exist here" — but `m3.l8.b4` omits `nums` from the five rows inside `largest`, so the table asserts that a module-level global blinks out of existence during the call and reappears afterwards. This is the opposite of what the block's own prompt asks the learner to think about.

**Evidence.**

```
Renderer: `src/components/brilliant/lesson/blocks/index.tsx:556-558` — `if (!step.vars.includes(name)) { return <td key={name} className="px-3 py-1.5 text-b-fg/25">—</td>; }`, with columns taken from the union of all steps' vars (line 522). The dash carries exactly that meaning elsewhere in the month: `m3.l4.b4`'s prompt instructs «Ат әлі пайда болмаған немесе жойылып кеткен сәтте `-` таңбасын қой». In m3.l8.b4 the steps are line 8 `{nums}`, line 2 `{nums,a,best}`, four rows at line 3 `{a,x,best}`, line 6 `{a,x,best}`, line 9 `{nums}` — so `nums` is filled at line 2 (inside the function) and dashed at lines 3 and 6 (also inside the function). Instrumenting the program confirms `nums` is bound throughout: `python3 tracer.py` on the block's code shows the module frame holding `nums = [4, 9, 9, 2]` for the whole call. The prompt then says «Ең соңғы қатар — ... сол сәтте қай аттар әлі бар, соны ойлан», making the dash column load-bearing. Same pattern in `m3.l7.b3` (`nums` dashed at lines 6 and 10) and `m2.l5.b4`, whose final row at line 6 omits `i` although `i` is still 4 after the loop — while `m2.l1.b3` in the same month correctly keeps `i: "5"` on its post-loop row.
```

**Proposed fix.** Carry `nums` (value unchanged) on every row of m3.l8.b4 and m3.l7.b3 that is inside the function, and add `i` to m2.l5.b4's final row, so the dash only ever appears where the name genuinely does not exist.

**Verification.** CONFIRMED — I reproduced it independently and could not refute it.

FACT 1 (runtime). sys.settrace on m3.l8.b4's exact program shows `nums` bound in module globals for every line of the call: `line 2`, `line 3`, `line 6` all report `global nums bound=True value=[4, 9, 9, 2]`. The five dashes in the nums column are factually false about the program.

FACT 2 (renderer). blocks/index.tsx:523 builds columns from the union of all steps' vars; :556-558 renders a name absent from a step's vars as a static, non-editable "—" at text-b-fg/25. No legend defines that symbol anywhere in src/components/brilliant/lesson/ or src/app (grepped).

FACT 3 (the "dash = merely not asked" defence fails on the block's own prompt). The prompt says «Ең соңғы қатар — ... сол сәтте қай аттар әлі бар, соны ойлан» / «какие имена в этот момент ещё существуют». In that last row (line 9) the only fillable cell is `nums`; a/best/x are dashes. The answer to the question the prompt poses is read off the dash pattern, so the block itself teaches dash = "does not exist here". The author's comment confirms: "`a`, `x` and `best` are gone there — that is a scope observation the learner makes for themselves."

FACT 4 (the 
… (truncated)

---

### MINOR · `m2.l7.b6` · l7.ts · *kk*

**Claim.** The fill_blank prompt uses the substantive interrogative «нешеу» attributively before a noun, twice — a grammatical error no Kazakh teacher would leave standing.

**Evidence.**

```
`grep -o "сыртқы цикл нешеу жол жасайды[^\"]*" schools/curriculum/months/m02/l7.ts` → «сыртқы цикл нешеу жол жасайды, әр жол неден басталады және ішкі цикл нешеу жұлдызша қосады?» (l7.ts:229). Kazakh distinguishes «неше» (attributive, before a noun: «неше рет», «неше жол») from «нешеу» (substantive predicate: «олар нешеу?»). The same corpus uses both correctly elsewhere — m02/l1.ts:104 «Бұл циклдің денесі неше рет орындалады?» and m02/l2.ts:75 «10-нан үлкендері нешеу екенін шығар» — so this block is the outlier, not the convention.
```

**Proposed fix.** «…сыртқы цикл неше жол жасайды, әр жол неден басталады және ішкі цикл неше жұлдызша қосады?»

**Verification.** Reproduced at schools/curriculum/months/m02/l7.ts:229 (block m2.l7.b6): «сыртқы цикл нешеу жол жасайды … ішкі цикл нешеу жұлдызша қосады». «Нешеу» is the interrogative of the collective-numeral class (біреу/екеу/үшеу, -ау/-еу), which is substantive/predicative only and never premodifies its noun — «нешеу жол» is structurally «*үшеу жол»; the attributive form is «неше жол». Corpus confirms the convention rather than contradicting it: all other «нешеу» uses are substantive («нешеу екенін» at m02/l2.ts:75, m02/l9.ts:163 and :232, m03/l2.ts:305, m04/l5.ts:362; «нешеуі» at m03/l7.ts:503; «кемінде нешеу отырады?» at month-01:1135), while 20 attributive counts across Sept–Nov are all spelled «неше» («неше рет» x10, «неше сан», «неше жұп/тақ сан», «неше жай сан», «неше дауысты әріп», «неше рейс», «неше градус», «неше жаста»). The authors state the distinction themselves in the note at m02/l2.ts:80 («Сұрақ «нешеу?» деп қойылған»). Impact: nothing executes wrong — the three prompt clauses still map 1:1 to the blanks n / "" / m — but this sentence is the sole instruction telling a Kazakh-medium Grade 9 learner which decision goes in which blank, so the error sits in the line the class parses 
… (truncated)

---

### MINOR · `m3.l1.b8s` · l1.ts · *kk*

**Claim.** Same «нешеу»-for-«неше» error, compounded by a dropped «рет», in the support-track fill_blank prompt.

**Evidence.**

```
`grep -o "цикл нешеу қайталанатыны" schools/curriculum/months/m03/l1.ts` → «цикл нешеу қайталанатыны» (l1.ts:285, block m3.l1.b8s). The Russian twin reads «сколько раз повторяется цикл», i.e. it carries the «рет»/«раз» that the Kazakh drops; without it the Kazakh literally says «how-many the loop repeats», which is not a sentence.
```

**Proposed fix.** «…функцияны жариялайтын сөз, циклдің неше рет қайталанатыны және цикл ішінде шақырылатын функцияның аты.»

**Verification.** CONFIRMED, with one correction to the claim's framing. m03/l1.ts:285 (block m3.l1.b8s, tracks:["support"]) reads «цикл нешеу қайталанатыны»; the ru twin at :286 reads «сколько раз повторяется цикл». «нешеу» is «неше»+collective ‑еу (біреу/екеу/үшеу), a substantival pronoun for a countable set, and in this clause it has no grammatical role: it cannot be subject («цикл» already is, bare nominative), cannot be attributive (no noun follows), cannot be a frequency adverbial (that requires «неше рет»); the scramble reading «циклдің қайталанатыны нешеу» is blocked by case, since «цикл» is nominative not genitive. Corpus proof from the content itself: all eleven other «нешеу» in months 1-4 occupy one of two legal slots — predicative (нешеу екенін ×5, нешеу болса ×2) or subject-of-verb for a set (нешеу отырады/тиеді/сыйды) — and line 285 is one of only two outliers (the other, m02/l7.ts:229 «нешеу жол/жұлдызша», is a different, attributive failure). Meanwhile «неше рет» appears 30 times across the months, including the identical clause at m02/l3.ts:45 («`for` циклі неше рет қайталанатынын») and in this same lesson's own explain block at m03/l1.ts:69 («Атын неше рет жазсақ»). Impact: b8s is 
… (truncated)

---

### MINOR · `m3.l6.b7` · l6.ts · *kk*

**Claim.** The write_code prompt opens with «жік», which is not a verb form in Kazakh — the imperative of «жіктеу» is «жікте», and «жік» is a noun (seam / category).

**Evidence.**

```
`grep -o "Есепті екі бөлікке жік\." schools/curriculum/months/m03/l6.ts` → «Есепті екі бөлікке жік.» (l6.ts:472). The same file uses the correct stem in a participle at l6.ts:283 («Есеп екі бөлікке жіктелген»), and the parallel task in m03/l7.ts:361 uses the natural verb outright: «Есепті екі функцияға бөл.» So this is a broken form, not a dialect choice.
```

**Proposed fix.** Write «Есепті екі бөлікке бөл.» — and prefer «бөлу» over «жіктеу» for decomposition throughout the lesson (the lesson title at month-03-november.ts:177, «Есепті бөліктерге жіктеу», renders Russian «Разбиение задачи на части» with a verb that means "to classify/categorise", not "to split"; «Есепті бөліктерге бөлу» is what a Kazakh informatics teacher would say).

**Verification.** CONFIRMED — I reproduced it independently and the "dialect choice" defence does not survive the file's own usage.

Evidence:

1. The literal string. `/Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m03/l6.ts:472`, inside `prompt.kk` of block `m3.l6.b7`:
   «Есепті екі бөлікке жік. `is_high(x)` функциясы …»
   A byte-level dump of the word gives exactly U+0436 U+0456 U+043A followed by U+002E — «жік» + full stop. No truncated suffix, no zero-width character, no encoding artifact. The suffix is genuinely absent from the source, not from the rendering.

2. It occupies a slot that only a verb can fill. The sentence has an accusative object («Есепті») and a dative complement («екі бөлікке») and then ends. That frame demands a transitive imperative. «жік» is a noun (seam/joint; social stratum; grammatical person, as in «жіктік жалғау»). Kazakh has no verb «жігу», so «жік» is not the imperative of anything. The verb the sentence wants is «жіктеу», a denominal -те verb whose 2sg imperative is the full stem «жікте» — the -те never drops.

3. The file's own norm proves the author knows this, so it is a slip, not a register choice. `grep
… (truncated)

---

### MINOR · `m2.l7.b8` · l7.ts · *kk*

**Claim.** The Kazakh geometry term for a right triangle is written as two words, «тік бұрышты үшбұрыш», instead of the textbook form «тікбұрышты үшбұрыш».

**Evidence.**

```
`grep -o "тік бұрышты үшбұрыш" schools/curriculum/months/m02/l7.ts` returns two hits: l7.ts:343 (block m2.l7.b8s, the support reorder_code) and l7.ts:376 (block m2.l7.b8, the core/advanced write_code). Kazakh compound adjectives of this shape are written solid — «тікбұрышты», «теңбүйірлі», «теңқабырғалы» — and the same file already writes the analogous compound solid at l7.ts:229: «жұлдызшадан тіктөртбұрыш салуы керек».
```

**Proposed fix.** «Жұлдызшадан тікбұрышты үшбұрыш сал.» in both blocks.

**Verification.** CONFIRMED, with one correction to their reasoning. Reproduced: /Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m02/l7.ts line 343 (block m2.l7.b8s, support reorder_code) and line 376 (block m2.l7.b8, core/advanced write_code) both read «тік бұрышты үшбұрыш». Both blocks carry ru «прямоугольный треугольник», so the referent is unambiguously the standardised geometry term, not a loose description — the fourteen-year-olds reading it met that exact term in Grade 7 geometry.

The norm is the solid form. kk.wikipedia's article is titled «Тікбұрышты үшбұрыш» and uses it solid in every section heading, reserving spaced «тік бұрыш» only for the angle itself («бір бұрышы тік»); the NIS Grade-7 geometry textbook section heading is «3.15. Тікбұрышты үшбұрыштың қасиеттері». The spaced form does appear in teacher-uploaded lesson plans (infourok, multiurok, stud.kz), so it is a widespread slip rather than a permitted variant — a Kazakh teacher would probably read past it, which caps the severity at low, but the school-facing Kazakh is wrong against the textbook the students own.

Correction to their evidence: the L229 «тіктөртбұрыш» analogy 
… (truncated)

---

### MINOR · `m3.l1.b1` · l1.ts · *kk*

**Claim.** The month's opening concept sentence turns the Russian restrictive relative clause into a coordinate clause, so the Kazakh asserts outright that `def` is "the first line of the year" — a claim that is false and puzzling on its own.

**Evidence.**

```
`grep -o "жылдағы бірінші жол, ол өзі ешнәрсе істемейді" schools/curriculum/months/m03/l1.ts` → l1.ts:69: «`def` — жылдағы бірінші жол, ол өзі ешнәрсе істемейді: компьютер оны оқығанда ешқандай сан оқылмайды…». The Russian twin on the next line keeps the restriction inside a relative clause — «`def` — первая строка в году, которая сама по себе не делает ничего» — so "first" scopes over "lines that do nothing". In Kazakh the comma splice breaks that scope: a reader gets "def is the year's first line" as a standalone predication and has to guess what the year has to do with it.
```

**Proposed fix.** Fold the restriction into a participle, e.g. «`def` — осы оқу жылында алғаш кездескен, өзі ешнәрсе істемейтін жол: компьютер оны оқығанда ешқандай сан оқылмайды…» (or simply drop the year framing: «`def` — өзі ешнәрсе істемейтін алғашқы жол: …»).

**Verification.** CONFIRMED — I tried to refute this and could not.

WHAT I VERIFIED

1. The text is as quoted. schools/curriculum/months/m03/l1.ts:69 (kk) reads «Осы кезге дейін бағдарлама жоғарыдан төменге қарай бір рет орындалып шығатын. `def` — жылдағы бірінші жол, ол өзі ешнәрсе істемейді: компьютер оны оқығанда ешқандай сан оқылмайды, экранға да ештеңе шықпайды.» Line 70 (ru) reads «`def` — первая строка в году, которая сама по себе не делает ничего: …». The Russian «которая» puts the property inside the NP, so «первая» scopes over "lines that do nothing by themselves". The Kazakh does not.

2. Kazakh has no postposed restrictive relative. Restriction is carried prenominally by a participle. The corpus proves this is the author's own normal device on this exact head noun: «Индексті өсіретін жол» (m02/assessment.ts), «оны өзгертетін жол» (m02/l9.ts:«цикл ішінде оны өзгертетін жол жоқ»), plus «қайтаратын функция» ×10, «қасиетін тексеретін функция» ×5 in m02/m03. So the in-house form for "the line that does X" exists and was used two months earlier — this block is the outlier.

3. The strongest evidence is house usage of the pattern itself. I enumerated every «, ол …» in schools/curriculum (12 in
… (truncated)

---

### MINOR · `m3.l4.b1` · l4.ts · *ru*

**Claim.** The Russian body of the scope concept block contains an ungrammatical clause, «но ячейки это разные», where the Kazakh reads cleanly — a bare plural noun followed by an unpunctuated «это» + adjective, which a native writes the other way round.

**Evidence.**

```
l4.ts:52, ru: «На двух листах может стоять одна и та же буква, но ячейки это разные: тронешь одну — вторая не изменится.»  ·  l4.ts:51, kk (same sentence, grammatical): «Екі бетте бір әріп жазылуы мүмкін, бірақ бұл — екі бөлек қорап: біріне тиген екіншісіне тимейді.» The Kazakh has the copula dash («бұл — екі бөлек қорап»); the Russian dropped it and inverted the order, leaving «ячейки это разные», which reads as a missing word rather than as emphasis. Standard forms are «но это разные ячейки» or «но ячейки — разные».
```

**Proposed fix.** Replace «но ячейки это разные» with «но это разные ячейки» (mirrors the Kazakh «бұл — екі бөлек қорап» exactly and keeps the rest of the sentence untouched).

**Verification.** CONFIRMED — I could not refute it. Reproduced verbatim at /Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m03/l4.ts:52, inside the `ru` body of the concept block `m3.l4.b1`: «На двух листах может стоять одна и та же буква, но ячейки это разные: тронешь одну — вторая не изменится.»

Why it is a defect and not taste:

1. The grammar is broken, not merely unidiomatic. Russian «это» as a copula requires a NOMINAL predicate («X — это Y-noun»), and it takes the dash. Here the predicate is a bare adjective («разные») with no noun, and no dash, in an order («ячейки это разные») that leaves the sentence reading as a missing word. The emphatic particle that WOULD license this word order is «-то» («ячейки-то разные»), which is not what is written. The reviewer's proposed forms — «но это разные ячейки» or «но ячейки — разные» — are the standard ones.

2. The same author writes it correctly twice in the same file, which kills the "deliberate colloquial register" defence. l4.ts:154 (the b4 prompt, same metaphor, same lesson): «В программе они записаны одной буквой, но ячейки разные.» l4.ts:299 (b8 prompt): «Два `n` — это две разные ячейки» 
… (truncated)

---

### MAJOR · `m2.p6` · practice.ts · *edgecases*

**Claim.** A "palindrome" solution that compares only the first and last element — never entering the two-pointer loop the task exists to teach — passes all 7 cases, because every `no` case in the set has differing endpoints.

**Evidence.**

```
Mutant `a=input().split(); print('yes' if a[0]==a[len(a)-1] else 'no')` run against the block's own cases: PASSES all 7. The three `no` cases are `1 2 3 4` (ends 1/4), `4 7` (4/7), `1 2 3 2 9` (1/9) — no `no` case has equal endpoints. On the killing input `1 2 3 4 1` the mutant prints `yes`, the reference prints `no`. Note the case comment on line ~236 claims `1 2 3 2 9` covers "the mismatch is at the very last position", but that case only kills a short walk, not a walk that never happens. m2.l6.b7 (the string palindrome) does have the needed case (`abca` → `no`); m2.p6 is the one that lost it.
```

**Proposed fix.** Add a hidden case whose outer pair matches but whose interior does not: `{ input: "1 2 3 4 1", expectedOutput: "no", hidden: true }` — the numeric twin of `abca` that m2.l6.b7 already carries.

**Verification.** CONFIRMED — reproduced independently with real Python. The mutant `a=input().split(); print('yes' if a[0]==a[len(a)-1] else 'no')` passes all 7 cases of m2.p6 (schools/curriculum/months/m02/practice.ts:215, cases at lines 226-240). All three `no` cases have differing endpoints (`1 2 3 4` → 1/4, `4 7` → 4/7, `1 2 3 2 9` → 1/9), so nothing in the set requires the two-pointer loop to execute even once. On `1 2 3 4 1` the reference prints `no` and the mutant prints `yes`.

Two independent checks strengthen the claim. (1) The author explicitly defended the sibling task against this exact shortcut — m02/l6.ts:194 comments "`abca` kills the solution that only compares the first and last characters and stops", and m2.l6.b7 carries `abca` → `no`. m2.p6 has no analogue, and unlike l6.b7 (tracks core+advanced) it has no `tracks` field, so every route receives the undefended one. (2) The case comment at practice.ts:237-238 is factually wrong: it claims `1 2 3 2 9` exists because "a walk that stops one step early reports yes", but I ran the short-walk mutant (`while i < j - 1`) and it is killed by `4 7`, while it answers `1 2 3 2 9` correctly (endpoints 1/9 differ, caught on the first compariso
… (truncated)

---

### MAJOR · `m2.l8.b8` · l8.ts · *edgecases*

**Claim.** The exact misreading the prompt is written to forbid — "the second largest must be strictly smaller than the largest" — passes all 8 cases, because both duplicate-maximum cases put the duplicate in the first two positions where the initialisation already seeds `second` with the maximum.

**Evidence.**

```
Mutant = reference with `elif a[i] > second` changed to `elif a[i] > second and a[i] < best`: PASSES all 8 cases. The only cases with a repeated maximum are `7 7` and `2 2 2`, and in both the repeat is at index ≤ 1, so `second = a[1]` already holds the max before the loop starts. On `1 5 5` the mutant prints `5 1`; the reference prints `5 5`. The prompt states this rule explicitly («ең үлкен мәннің БІР данасын алып тастағаннан кейін» / «убран ОДИН экземпляр максимума»), so the one rule the task most wants to check is the one no case checks.
```

**Proposed fix.** Add a hidden case where the duplicated maximum first appears at index ≥ 2: `{ input: "1 5 5", expectedOutput: "5 5", hidden: true }` (or `3 1 4 5 5`).

**Verification.** CONFIRMED — reproduced independently with real Python. Block `m2.l8.b8` (challenge, tracks core+advanced, /Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m02/l8.ts:467).

WHAT I RAN. Reference solution vs. three separate programs implementing the "second largest must be strictly smaller than the largest" reading, against all 8 declared cases:
  (1) their mutant, `elif a[i] > second and a[i] < best` — 8/8 PASS
  (2) the more natural learner spelling, `elif a[i] > second and a[i] != best` — 8/8 PASS
  (3) a program I wrote from scratch with a different structure (two passes: find max, then scan again taking the largest value != max) — 8/8 PASS
Reference: 8/8 PASS. So the gap is not an artifact of the reviewer's particular mutation; three structurally different wrong programs all pass.

NOTE: in the `elif` branch `a[i] > best` is already false, so `a[i] < best` is exactly `a[i] != best`. The mutant is not a contrived condition — it is literally the rule the prompt forbids.

WHY NO CASE CATCHES IT. I instrumented the trace: divergence requires a case containing a maximum value at index i >= 2 at a moment when `second < best`. I ch
… (truncated)

---

### MAJOR · `m3.l7.b7` · l7.ts · *edgecases*

**Claim.** A palindrome-number counter that compares only the first and last digit — writing neither `reverse_num` nor any real check — passes all 8 cases, because no case contains a non-palindrome whose first and last digits are equal.

**Evidence.**

```
Mutant `def ip(n): s=str(n); return 1 if s[0]==s[len(s)-1] else 0` (plus the required `count_pal` loop): PASSES all 8 cases. Every non-palindrome in the set differs at the ends — `45`, `54`, `10`, `1234`, `1000000`, `12`. On `1231 121` the mutant prints `2`, the reference prints `1`. This is the same defect family as m2.p6, one month later.
```

**Proposed fix.** Add a hidden case containing a number whose outer digits agree but whose interior does not: `{ input: "1231 121", expectedOutput: "1", hidden: true }` (or `1021`, `12341`).

**Verification.** CONFIRMED — I reproduced it and could not refute it.

**1. The mutant passes.** Ran `is_pal(n) = 1 if str(n)[0]==str(n)[len(str(n))-1] else 0` with the required `count_pal` loop against all 8 declared cases of `m3.l7.b7` (/Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m03/l7.ts:534-543). 8/8 PASS. Reference and mutant diverge on `1231 121` (ref 1, mutant 2), exactly as claimed.

**2. Root cause, established by exhaustion, not by eyeballing.** The case set uses 17 distinct numbers: 0, 1, 5, 7, 10, 11, 12, 22, 33, 45, 54, 100, 121, 1221, 1234, 12321, 1000000. Zero of them are non-palindromes with equal first and last digits. That is structural: every 1-3 digit number whose outer digits match IS a palindrome, so the kill case must have ≥4 digits — and the only ≥4-digit non-palindromes present are `1234` and `1000000`, both with distinct ends. The set cannot kill this mutant.

**3. What actually breaks, and for whom.** /Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/src/app/api/learning/submit/route.ts:278-330 lists `challenge` among the executable block types, runs every case through `runCases`, and
… (truncated)

---

### MAJOR · `m3.l8.b6` · l8.ts · *edgecases*

**Claim.** No case in this block has its maximum at the final position, so a `largest()` that stops one element short — «соңғы элементті өткізіп жіберу», the error the October programme names by hand — passes all 7 cases.

**Evidence.**

```
Argmax per case: `4 9 9 2`→1, `7`→0, `-4 -9 -2 -7 -6`→2, `5 5 5`→0, `10 8 6 4`→0, `8 1 6`→0, `-1000 1000 0`→1. None is the last index. Mutant with `for i in range(1, len(a)-1)` in `largest` (and a correct `smallest`): PASSES all 7. On `1 3 8` the mutant prints `3 1`, the reference `8 1`. The mirror case for `smallest` IS covered (`10 8 6 4` has its minimum last), and m2.l5.b6 and m3.p4 both carry a max-last case — this block is the gap.
```

**Proposed fix.** Add `{ input: "1 3 8", expectedOutput: "8 1", hidden: true }`, an ascending list whose maximum is the final element.

**Verification.** CONFIRMED — I reproduced it independently and my three refutation attempts all failed.

REPRODUCTION. I ran the reference solution and three natural forms of the skip-last mutant in `largest` (`for i in range(len(a)-1)`, `for i in range(1, len(a)-1)`, `for x in a[:-1]`), each paired with a CORRECT `smallest`, against all 7 declared cases of m3.l8.b6. Reference: 7/7 pass. All three mutants: 7/7 pass. On `1 3 8` every mutant prints `3 1` where the reference prints `8 1`. Argmax per case is 1, 0, 2, 0, 0, 0, 1 — never the last index, and the one case where it nominally is (`7`) is degenerate because `best = a[0]` returns before the loop body ever runs, so it cannot discriminate.

REFUTATIONS I TRIED AND FAILED:
1. "The lesson only teaches `for x in a`, so a skip-last loop is implausible here." Fails. m2.l9.b3 puts `best = a[0]` / `for i in range(len(a) - 1)` on screen as the canonical max-finding program, and m2.l9.b1's concept block names the error in both languages («`range(len(a) - 1)` немесе `range(1, len(a))`… соңғы элемент ең үлкені болғанда ғана бұзылады»). This cohort has written that exact loop by hand. The slice form also works and slicing is October-available.
2. "A learner
… (truncated)

---

### MAJOR · `m3.l2.b7` · l2.ts · *edgecases*

**Claim.** The obvious beginner reading of "two-digit" — `len(str(x)) == 2` — passes all 6 cases even though it answers `yes` for every negative single-digit number, which the prompt defines as `no` (two-digit means 10..99 inclusive).

**Evidence.**

```
Mutant `def check(x): print('yes' if len(str(x))==2 else 'no')`: PASSES all 6 cases. The only negative in the set is `-15`, whose string is 3 characters long, so the mutant is right there by accident; there is no negative single-digit input anywhere. On `-5 0 5` the mutant prints `yes no no`, the reference `no no no`. Negatives are clearly in scope — the prompt sets no bounds and the hidden case `-15 0 5` deliberately uses one.
```

**Proposed fix.** Change or extend the negative case so it contains a single-digit negative: `{ input: "-5 0 5", expectedOutput: "no\nno\nno", hidden: true }` alongside the existing `-15 0 5`.

**Verification.** CONFIRMED — reproduced independently with real Python. The mutant `def check(x): print('yes' if len(str(x))==2 else 'no')` passes all six declared cases of m3.l2.b7 (schools/curriculum/months/m03/l2.ts:277-284). A scan over -200..200 shows it diverges from the referenceSolution on exactly {-9..-1}; on `-5 0 5` it prints `yes no no` where the reference prints `no no no`.

Three refutation attempts, all failed:

(1) "Negatives aren't in scope" — they are, by the author's own design. The prompt states no bounds ("үш бүтін сан" / "три целых числа") and the hidden case `-15 0 5` exists to probe the sign. Worse, the block's own authoring comment (l2.ts:255-256) claims "a solution that counts characters or ignores the sign dies on -15". I verified only half of that: `len(str(abs(x)))==2` and `abs(x)>=10 and abs(x)<=99` do die on -15, but plain `len(str(x))==2` does not, because "-15" is 3 characters. The file documents a mutant-kill it does not perform.

(2) "The mutant isn't plausible for a Grade 9 beginner" — the course itself taught both halves, weeks earlier. October m2.l6.ts:39-42 teaches `len()` on a STRING verbatim («`len(s)` даёт количество символов», with code `s = "code"; print(
… (truncated)

---

### MAJOR · `m3.as.b1` · assessment.ts · *edgecases*

**Claim.** November's monthly assessment — and 14 more graded November tasks — accept a submission with no functions at all, or with functions that `print` instead of `return`, which is precisely what each prompt forbids and what the month exists to teach.

**Evidence.**

```
Two mutants run against every November task that demands `return`. (a) Functions print their result and the main program just calls them: PASSES on m3.as.b1, m3.l5.b8, m3.l6.b7, m3.l7.b6, m3.l8.b6, m3.l8.b7, m3.l8.b9, m3.p1, m3.p2, m3.p4, m3.p5, m3.p6, m3.p7, m3.p9, m3.p10. (b) A single flat October-style program with zero `def`: PASSES on m3.as.b1, m3.l1.b8, m3.l6.b7, m3.l7.b6, m3.l7.b7, m3.l8.b6, m3.p1–p8, m3.p10. m3.as.b1's prompt says «Функциялар экранға ештеңе шығармайды … `input()` пен `print()` тек негізгі бағдарламада болады» and the PDF's own test is «Кемінде 2-3 функциядан тұратын бағдарламаны жазу» (p.8) — neither is checked by anything. The tasks that DO kill both mutants are exactly the ones where the main program must consume returned values: m3.p3, m3.p8 (prints max−min), m3.l3.b9 (compares two returns), m3.l8.b8 (returns a list). Same class, different mechanism: m3.l4.b7's «убери обращение к внешней n» is satisfied by a solution that keeps the global and reassigns it before each call — that passes all 5 cases too.
```

**Proposed fix.** Where the output can be restructured, make the main program combine what the functions return, the way m3.p8 and m3.l3.b9 already do — e.g. for m3.as.b1 require count and position on ONE line with `checker: {kind:"exact"}`, which turns a function that prints its own value (two lines) into a failure. m3.l8.b6 needs only the checker: its prompt already demands one line `9 2`, and a printing pair emits `9\n2`, which `{kind:"exact"}` rejects and the current `token` default accepts. For the rest, state in the block that the `return` requirement is teacher-verified via the paired `explain` / `oral_explanation`, rather than implying the judge checks it.

**Verification.** CONFIRMED — I reproduced both mutants myself, and the defect is *wider* than the claim states.

**Grading path (read, not assumed).** `src/app/api/learning/submit/route.ts:277-283` makes `verify` blocks with cases executable alongside `write_code`/`modify_code`/`challenge`. Line 301 calls `runCases`, which at `schools/exec/index.ts:155` sets `passed = r.status === "ok" && checkOutput(...)`. `checkOutput` in `schools/exec/checker.ts` is a pure stdout comparison (`token` by default — every November block declares no checker, so all 29 are `token`). Nothing anywhere inspects submitted source. I grepped for any structural gate (`requiredConstruct`, `mustDefine`, `forbidden`, `staticCheck`) across `schools/` and `tests/` — zero hits. There is no mechanism by which "must define a function" or "must `return`, not `print`" can be seen.

**Mutants run.** Harness in `/tmp/nov/` (token comparison, `python3 -I -S`, real block cases dumped from `MONTH_03_NOVEMBER`).

Flat, zero `def`, October-style — PASSES ALL cases on: `m3.as.b1` (8/8), `m3.l1.b8`, `m3.l6.b7`, `m3.l7.b6`, `m3.l7.b7`, `m3.l8.b6`, `m3.l8.b7`, `m3.p1`–`m3.p8`, `m3.p10`.

Functions that `print` instead of `return` — PASSES ALL on
… (truncated)

---

### MINOR · `m2.l3.b8` · l3.ts · *edgecases*

**Claim.** The prompt requires one digit per line and shows a three-line sample, but the default `token` checker accepts all the digits on a single line, so a program that ignores the stated output format is graded correct.

**Evidence.**

```
Mutant that collects digits and prints `' '.join(out)` produces `'7 0 4\n'` for input `407`; against the expected `'7\n0\n4'` the token comparison returns True and exact returns False (checked with the repo's own `checkOutput` semantics). The prompt says «әрқайсысын жаңа жолға» / «каждую с новой строки … в трёх строках». The same applies to the support twin m2.l3.b8s. m2.l7.b7/b8/b9 already use `{kind:"exact"}` where line shape matters.
```

**Proposed fix.** Set `checker: { kind: "exact" }` on m2.l3.b8 and m2.l3.b8s (the reference solution still passes — trailing newlines are stripped — and there is no intra-line whitespace for a learner to get wrong), or drop the per-line requirement from both prompts.

**Verification.** Reproduced independently against the committed content. At HEAD, schools/curriculum/months/m02/l3.ts declares no `checker` on m2.l3.b8 or its support twin m2.l3.b8s, so runCases (schools/exec/index.ts:138) grades them with DEFAULT_CHECKER = {kind:"token"} while both prompts state «әрқайсысын жаңа жолға» / «каждую с новой строки … в трёх строках». Running three format-violating programs through the repo's own checkOutput over all six cases (visible + hidden): `print(' '.join(out))`, `print(n % 10, end=' ')`, and a string accumulator `s = s + str(n%10) + ' '` each pass 6/6 under token and fail under exact; the reference passes under both. The accumulator mutant is b7's pattern carried across with a separator — precisely the transfer b8's own comment says the task exists to rule out ("print INSIDE the loop… the whole difference between it and b7's accumulator"), so the one requirement the block is for was invisible to the judge, for core, advanced and support alike. Not taste and not a contract violation to fix: the AUTHORING_CONTRACT at HEAD already required exact when formatting is the exercise, and the same author had already declared {kind:"exact"} on m2.l7.b7/b8/b9 at HEAD for th
… (truncated)

---

### BLOCKER · `m2.l7.b7` · l7.ts · *solvability*

**Claim.** The multiplication-table task cannot be solved with anything October has taught by that point: its reference solution needs str(), .append() and .join(), none of which the curriculum has shown yet, and the exact checker forbids the only route the lesson's own taught technique can produce.

**Evidence.**

```
capabilityFor("m2.l7.b7").taskGap = "str(), .join(), .append()" and available does not contain str(). Scanning every block in teachingOrder() for first appearance in SHOWN code: {"str()":"m2.l8.b2", ".append()":"m3.l8.b8", ".join()":"m3.l8.b8"} — i.e. str() arrives one lesson later and .append()/.join() arrive a full month later, in November. The lesson's own taught technique is string concatenation (m2.l7.b6 template: `line = ___` / `line = line + "*"`, m2.l7.b8 ref: `line = line + "*"`). Extending it gives `line = line + str(i*j) + " "` — which still needs the untaught str(), and its output for n=3 is "1 2 3 \n2 4 6 \n3 6 9 \n"; checkOutput(that, "1 2 3\n2 4 6\n3 6 9", {kind:"exact"}) returns false (token returns true). The prompt itself bans the workaround: «Жолдың соңында бос орын БОЛМАЙДЫ». No `end=` appears anywhere in schools/curriculum/months/ (grep -rn "end=" → 0 hits), and the block has tracks:undefined, so support learners get this as a bare blank editor with no scaffolded twin (b7 has no b7s; only b8 does).
```

**Proposed fix.** Either move the task after list-building is actually taught, or rewrite it for October's real vocabulary: drop checker:{kind:"exact"} to the default token checker and let `line = line + str(i * j) + " "` pass — but str() must then be shown before m2.l7 (it currently first appears at m2.l8.b2). Cleanest: introduce str() in an m2.l7 concept/worked_example and set the checker to token, or replace the multiplication table with a star-pattern task that needs no int-to-text conversion.

**Verification.** Reproduced independently, with one component of the claim refuted.

CONFIRMED. `capabilityFor("m2.l7.b7")` returns taskGap = [builtin.str, method.join, method.append] and `available` contains no `builtin.str`. Walking teachingOrder() over shownCode() gives first appearances: builtin.str = m2.l8.b2 (order index 139 vs b7's 134 — five blocks later), method.append/method.join = m3.l8.b8 (index 207, November). Grep confirms the mechanism: in all of schools/curriculum/months/m02/, `.append`/`.join` appear only inside referenceSolution strings (l7.ts:283-284, l8.ts:440-441), which schools/curriculum/public.ts strips, so a learner sees neither anywhere in October; `str(` appears 0 times in month-01-september.ts and exactly once in October's shown code, at m2.l8.b2; `end=` is 0 hits across every month file.

The task is therefore unsolvable with what has been shown. Everything shown by b7 that puts numbers on one line is `print(x, y)` at fixed arity (m2.l2.b1, m2.l4.b3, m2.l7.b1) and `line = line + "<literal>"` (m2.l7.b6). Neither produces a variable-length row of numbers; int-to-text needs str() or end=, and neither has been shown.

Blast radius is concrete. capabilityPromptLines() only e
… (truncated)

---

### BLOCKER · `m2.l8.b6` · l8.ts · *solvability*

**Claim.** The "write a primality check" task is pure transcription: its reference solution is byte-identical to the program printed in full on the immediately preceding card, and the same program is on screen on four consecutive cards before it.

**Evidence.**

```
Byte comparison from a dump of the assembled month: `m2.l8.b5.code == m2.l8.b6.referenceSolution` → True; `m2.l8.b4.fixedCode == m2.l8.b5.code` → True; `m2.l8.b6s` filled template (blanks `<`, `==`, `break`) `== m2.l8.b5.code` → True. Block order in the lesson is [b1, b2, b3, b4, b5, b6, b6s, b7, b8, b9]. m2.l8.b5 is a modify_code, and publicBlock() ships `code` to the browser, so the whole 11-line program is visible one card earlier. m2.l8.b1 (worked_example) prints the same program with `n = 91` instead of `n = int(input())` (0.96 similarity) and m2.l8.b3 (multiple_choice) prints a 0.93-similar variant. revealFor() returns `{line, code: block.fixedCode}` on a CORRECT find_bug, so m2.l8.b4 hands the finished program back two cards before b6 as well. A learner scrolls up one card, copies, pastes, and passes all 10 of b6's cases.
```

**Proposed fix.** Change the problem, not the scaffold. b6 should ask for something the printed program does not already answer — e.g. print the smallest divisor of n (or `1` when n is prime), or count primes in a range different from b5's. If the intent is genuinely to rehearse primality, delete b6 and let b5's modify_code carry the load; support's b6s should likewise blank something b5 does not show.

**Verification.** CONFIRMED, though two of the reviewer's supporting facts are overstated and should not be repeated.

WHAT I REPRODUCED INDEPENDENTLY

Importing M2_L8 from /Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m02/l8.ts and comparing strings:

  m2.l8.b5.code === m2.l8.b6.referenceSolution   -> true (identical, 12 lines)
  m2.l8.b4.fixedCode === m2.l8.b5.code           -> true
  block order: b1(worked_example) b2(prediction) b3(multiple_choice) b4(find_bug) b5(modify_code) b6(write_code)[core,advanced] b6s(fill_blank)[support] b7 b8 b9

So b5 is the card immediately before b6, and b4 is two before it.

THE DELIVERY MECHANISM, VERIFIED IN THE RENDERER

- src/components/brilliant/lesson/blocks/index.tsx:904 — `const starter = block.starter ?? block.code ?? "";` — a modify_code's editor is SEEDED with block.code. So on b5 the finished 12-line primality program sits in a selectable, copyable textarea.
- schools/curriculum/public.ts:341-353 — publicBlock ships `code` for modify_code. The program reaches the browser.
- schools/learning/reveal.ts — `if (block.type === "find_bug") return { line: block.buggyLine, code: block.fixedCode };` on 
… (truncated)

---

### MAJOR · `m2.l6.b7` · l6.ts · *solvability*

**Claim.** The palindrome write_code (and its support twin) reproduces the exact program the find_bug two cards earlier repairs — the learner is retyping a program the platform already handed them.

**Evidence.**

```
`m2.l6.b5.fixedCode == m2.l6.b7.referenceSolution` → True (byte-identical). `m2.l6.b7s` filled template (blanks `//`, `1`) `== m2.l6.b5.fixedCode` → True. Block order: [b1..b5, b6, b7, b7s, b8]. m2.l6.b5's buggy `code` is printed to the learner and differs from the answer by one token (`s[n - i]` vs `s[n - 1 - i]`; normalized similarity 0.99). schools/learning/reveal.ts revealFor(): `if (verdict === "correct") { if (block.type === "find_bug") return { line: block.buggyLine, code: block.fixedCode }; }` — so anyone who answers b5 correctly is SHOWN the finished palindrome program, then asked to write it at b7 and to fill two blanks in it at b7s.
```

**Proposed fix.** Give b7/b7s a different program: e.g. check whether a word is a palindrome ignoring one allowed mismatch, or count how many of n words are palindromes, or compare two halves with a while/two-pointer loop instead of the `range(n // 2)` form b5 uses. Alternatively move the find_bug after the write_code so the repair lands on work the learner has already done.

**Verification.** CONFIRMED, and the mechanism is stronger than claimed. Verified with raw `===` (not normalized): m2.l6.b5.fixedCode === m2.l6.b7.referenceSolution, and m2.l6.b7s.template filled with its own blanks ("//", "1") === m2.l6.b5.fixedCode. Both true.

The reveal is unavoidable, not merely likely. school-lesson.tsx:687 renders one block per page; lesson-verdict.ts:117 footerMode gives an attempt block "check" when unchecked and "retry" when wrong — the only forward transition is correct -> "celebrate" -> advance(). So no learner can reach b7 without first settling b5 as correct, and reveal.ts:80 fires unconditionally on correct for find_bug (`return { line: block.buggyLine, code: block.fixedCode }`), which blocks/index.tsx:332 paints in a CodePanel labelled "Fixed version". Every single learner who arrives at b7 has been shown b7's reference solution verbatim. Pages are never unmounted and canPrev is live with per-block state retained, so it is also two clicks back and two forward with their draft intact.

Second, independently verified instance in the same lesson that the reviewer missed: m2.l6.b4.template filled with its blanks ("in", "+=") === m2.l6.b6.referenceSolution, exact. b4 and 
… (truncated)

---

### MAJOR · `m2.l6.b6` · l6.ts · *solvability*

**Claim.** The vowel-counting write_code's reference solution is byte-identical to the completed form of the fill_blank two cards earlier, whose template already shows five of the six lines.

**Evidence.**

```
Filling m2.l6.b4's template with its own blank answers (`in`, `+=`) yields exactly `s = input()\nn = 0\nfor c in s:\n    if c in "aeiou":\n        n += 1\nprint(n)`, which compares == m2.l6.b6.referenceSolution → True. b4's template ships verbatim to the browser via publicBlock() (PublicFillBlank keeps `template`), so the whole program minus two tokens is on screen two cards before b6 asks the learner to write it from a blank editor. b6 is tracks:undefined, so all three routes get it.
```

**Proposed fix.** Make b6 a genuinely different traversal — count consonants, count the vowels in only the second half of the word, or report the first vowel's index and -1 when there is none — so the b4 skeleton is a model rather than the answer.

**Verification.** CONFIRMED. I tried to knock this down as gradual-release pedagogy and it survived every angle.

1) Byte identity — reproduced. Filling `m2.l6.b4`'s template (l6.ts:112-117) with its own blank answers `in` and `+=`, using the same `template.replace(/___/g, ...)` the repo's own checker uses (scripts/check-blocks.ts:236), yields a string whose SHA-256 is 06056def3ff2a9244d780c18fa9c04c7da92fc0720ac936b690a86c2ae28de88 — identical to the hash of `m2.l6.b6.referenceSolution` (l6.ts:175-176). Not similar. The same six lines.

2) It ships. `PublicFillBlank` Picks `"prompt" | "template"` (schools/curriculum/public.ts:131-137) and `publicBlock`'s fill_blank arm passes `template: block.template` straight through (public.ts:302-309). Only `blanks[].answer` is stripped. So 5 of 6 lines are in the browser, and b4's own prompt names the two missing tokens in words ("операцию, увеличивающую счётчик на единицу" = `+=`).

3) Every learner gets both. Resolved tracks for l6: b4 = [support, core, advanced], b6 = [support, core, advanced]. No route escapes it.

4) The decisive evidence the claim did not have. I scanned all nine months (35 fill_blanks, 130 reference solutions) for filled-template == ref
… (truncated)

---

### MAJOR · `m3.l5.b5` · l5.ts · *solvability*

**Claim.** m3.l5.b5 is a byte-for-byte duplicate of m3.l3.b5 — same program, same bug, same repair, same buggy line — so for a learner working the month in order it is not a task at all, and it is counted twice toward November's promised 34.

**Evidence.**

```
From the assembled dump: `m3.l3.b5.code == m3.l5.b5.code` → True and `m3.l3.b5.fixedCode == m3.l5.b5.fixedCode` → True; both declare buggyLine 6. Both are the `digit_sum` function that ends `print(s)` instead of `return s`. Only the prose and the sample number differ: m3.l3.b5 «При вводе 407 … сначала 11, потом None», m3.l5.b5 «При вводе 482 … `14`, а затем `None`». Teaching order for November is u1(l1,l2,l3,l8) → u2(l4,l5) → …, so l3.b5 is met 29 cards before l5.b5. skillRefs also differ (l3.b5 declares four skills, l5.b5 one), so the same evidence is filed twice under different skills.
```

**Proposed fix.** Replace m3.l5.b5 with a different return-related defect that belongs to l5's «функциядағы қателер» theme — e.g. a `return` placed inside the loop so the function stops after the first element (the exact hazard m3.l8.b1's concept warns about), or a function that returns before its accumulator is updated.

**Verification.** CONFIRMED — I reproduced it independently, not by trusting the other reviewer's dump.

WHAT I RAN. Assembled `MONTH_03_NOVEMBER` in a scratch script (/tmp/dup_check.ts, /tmp/dup2.mts) and compared the two blocks as live objects:
  code equal: true
  fixedCode equal: true
  buggyLine: 6 / 6      type: find_bug / find_bug
  tracks: (all) / (all) — every route sees both
  teaching index 22 vs 51 → 29 cards apart, order u1(l1,l2,l3,l8) → u2(l4,l5)
A pairwise scan of every attempt-bearing block in November for identical [code, template, referenceSolution] returns exactly one hit in the whole month: `m3.l3.b5 == m3.l5.b5`. Nothing else in November collides.

Ran the Python (python3 -I -S): buggy on 407 → "11\nNone", on 482 → "14\nNone"; fixed → "11" / "14". Both prompts are numerically honest, which is precisely the problem — the only difference between the two cards is the sample number in the prose. The program on screen is byte-identical.

WHY IT IS NOT A TASK THE SECOND TIME. `checkBlock` grades `find_bug` on nothing but the clicked line (schools/learning/checking.ts:222-230: `const right = line === block.buggyLine`). There is no editing, no re-derivation. So the answer to m3.l5.b5 i
… (truncated)

---

### MAJOR · `m3.assessment` · assessment.ts · *solvability*

**Claim.** The 20-minute November check carries four graded tasks whose combined workload is a from-scratch three-function program plus about eighteen separate written or spoken sub-answers — the exact shape the authoring contract rules out.

**Evidence.**

```
AUTHORING_CONTRACT.md, §Assessment: «Fit the stated minutes. 20 minutes is one unseen problem plus a short written or oral piece, not four graded tasks.» m3.assessment declares minutes: 20 and contains four ATTEMPT_BLOCK_TYPES blocks: verify(unseen_problem) b1 — write a program split into «кемінде 2-3 функцияға» with is_prime plus two list-walking functions (reference solution is 20 lines, 8 cases); explain b2 — «Әр функцияң үшін үш нәрсені ата» over three functions (9 answers) plus two further questions (11 total); verify(manual_trace) b3 — four numbered questions including a three-line output trace and three scope explanations; verify(oral_explanation) b4 — three numbered questions. That is 1 program + 18 prose sub-answers in 20 minutes.
```

**Proposed fix.** Either raise `minutes` to something honest for the work (35-40), or cut to the contract's shape: keep b1 (unseen_problem) and b4 (oral_explanation, which the validator requires), and fold b2's function-by-function questions into b4's oral rather than running them as a separate written block — b3's scope trace is the PDF's «Қосымша сұрақ» and can become one question inside b4.

**Verification.** CONFIRMED, with one qualification. I reproduced every element independently.

Facts re-derived from the tree:
- month-03-november.ts:239 declares minutes: 20 on the assessment mounting M3_ASSESSMENT.
- m3/assessment.ts contains exactly four blocks, all members of ATTEMPT_BLOCK_TYPES (types.ts:126): b1 verify/unseen_problem, b2 explain, b3 verify/manual_trace, b4 verify/oral_explanation.
- b1 is a blank-editor three-function program. I ran the referenceSolution against all eight declared cases with python3 -I -S: 21 non-blank lines, all eight pass. It is genuinely hard (n<2 guard, 1-indexed position with a 0 "no answer" sentinel, the empty range(2,2) body at n=2).
- Sub-question count, extracted by script rather than by eye: b2 carries five numbered markers of which (1)(2)(3) are asked *per function* -> 9 + 2 = 11 answers for the three-function solution the block's own expectedPoints assume (point 2 says "функции, обрабатывающие список", plural; point 3 contrasts the two). b3 carries four numbered questions on top of a 13-line paper trace (I ran it; it prints 8/7/7 as documented). b4 carries three. 11 + 4 + 3 = 18. That figure is a floor, not an inflation: b3's (1) alone requires th
… (truncated)

---

### MINOR · `m2.l1.b8s` · l1.ts · *solvability*

**Claim.** The support-only twin opens by pointing at "the previous task", but the previous card on the support route is a different problem — the sum-of-squares problem it names is m2.l1.b8, which support learners never receive.

**Evidence.**

```
m2.l1.b8s carries tracks: ["support"] and its prompt begins «Алдыңғы есептің дәл өзі: квадраттардың қосындысы.» / «Та же задача, что и в предыдущем задании: сумма квадратов.» m2.l1.b8 (sum of squares) carries tracks: ["core", "advanced"], so blocksForTrack() strips it from the support payload. The block the support learner actually sees immediately before b8s is m2.l1.b7, a worked_example whose problem is «n беріледі. 1 + 2 + … + n қосындысын шығар» — the plain sum, not the sum of squares. This is the only such cross-track back-reference in either month (m2.l3.b8s's «сен оны жаңа ғана толықтырдың» correctly points at m2.l3.b6, which is on all tracks).
```

**Proposed fix.** Drop the first clause and state the problem outright, e.g. «1² + 2² + … + n² қосындысын есептейтін бағдарламаны толықтыр» / «Дополни программу, считающую 1² + 2² + … + n².» The rest of the prompt already restates the task well enough to stand alone.

**Verification.** CONFIRMED — I reproduced it independently rather than taking the reviewer's word.

What I ran: a tsx probe importing MONTH_02_OCTOBER and calling blocksForTrack() on m2.l1 for all three tracks. Delivered sequences:
  support  -> b1 b2 b3 b4 b5 b6 b7 b8s b9
  core     -> b1 b2 b3 b4 b5 b6 b7 b8  b9
  advanced -> b1 b2 b3 b4 b5 b6 b7 b8  b9
So b8s (tracks: ["support"], l1.ts:218) is delivered only to support, and the block immediately preceding it on that route is b7 — not b8. Note b8s also sits BEFORE b8 in the source array (l1.ts:218 vs :252), so there is no route on which "the previous task" could resolve to b8 even in principle.

The predecessor: m2.l1.b7 is a worked_example titled «Разобранный пример: сумма от 1 до n», problem «Дано n. Выведи сумму 1 + 2 + … + n. Например, при n = 5 ответ 15», printing in full `n = int(input()) / s = 0 / for i in range(1, n + 1): / s = s + i / print(s)`. The plain sum. Not the sum of squares.

The sentence: b8s opens «Алдыңғы есептің дәл өзі: квадраттардың қосындысы.» / «Та же задача, что и в предыдущем задании: сумма квадратов.» «дәл өзі» and «та же задача, что и в предыдущем задании» are unambiguous identity claims, not "same shape as". As del
… (truncated)

---

### MAJOR · `m3.as.b1` · assessment.ts · *assessment*

**Claim.** The monthly check's `unseen_problem` is not unseen for the advanced route: it is a re-dress of m3.p10, the immediately preceding block in the same month's own practice bank — same function name, same 1/0 contract, same `n < 2` guard, same trial division, same counting loop.

**Evidence.**

```
`teachingOrder()` ordinals: `256 m3.p10 [advanced]` then `257 m3.as.b1 all tracks` — back to back. m3.p10 (m03/practice.ts:628) prompt: «Напиши две функции: первая принимает число и возвращает 1, если оно простое, и 0, если нет; вторая принимает n и, вызывая первую, возвращает количество простых чисел». Its reference is `def is_prime(n): if n < 2: return 0; ... return 1` + `def count_primes_below(n): c = 0; for x in ...: c = c + is_prime(x); return c`. m3.as.b1's reference is `def is_prime(n): if n < 2: return 0; for d in range(2, n): ... return 1` + `def count_primes(a): c = 0; for x in a: if is_prime(x) == 1: c = c + 1; return c` — the identical function under the identical name, `while` swapped for `for`, plus one extra position function. The file's own justification for the choice (assessment.ts:31-44) enumerates what it avoided re-dressing — «digit_sum in l3 and again in l5, largest/smallest in l8, is_palindrome and only_even in l8, count_vowels + best_word in l8's advanced block» — and omits m3.p10 entirely, even though m03/l7.ts:55 already names «`is_prime` + `count_primes_below` (p10)». Its claim that «the unseen part is the decomposition» does not survive either: p10 dictates the same decomposition in its prompt.
```

**Proposed fix.** Replace the predicate. The month's untouched practice families on p.8 include «мәтінге арналған тексерулер» and «қайталанатын кодты функцияларға бөліп қайта жазу»; a predicate over a *pair* of values, or a string property, keeps the two-list-functions-sharing-one-predicate shape that b2 asks about without reusing p10's function verbatim. If primality stays, m3.p10 has to change instead — but then the check is still a re-dress of October's m2.l8.b5/b6.

**Verification.** CONFIRMED — I reproduced it independently, and it is worse than the claim states.

**1. Adjacency, verified by running the code.** `teachingOrder()` on month 3: `255 m3.l9 m3.p9 ["core","advanced"]` / `256 m3.l9 m3.p10 write_code ["advanced"]` / `257 m3.assessment m3.as.b1 verify unseen_problem all`. p10 is the last block of the last lesson (`m3.u4 › m3.l9 «Өз бетіңмен шығар»`) before the check. The advanced learner writes `is_prime` + a prime-counting function as the final thing they do, then sits the check.

**2. The predicate is the same function, not a cousin.** Normalised diff of the two `is_prime` bodies (m03/practice.ts:639 vs m03/assessment.ts:151) is three lines: `d = 2` / `while d < n:` / `d = d + 1` → `for d in range(2, n):`. Same name, same `if n < 2: return 0`, same `if n % d == 0: return 0`, same `return 1`.

**3. I ran the transport.** I pasted p10's `is_prime` **verbatim** (while-form, untouched), took p10's `count_primes_below` body and changed one token (`for x in range(2, n)` → `for x in a`), and added the one genuinely new function (`first_prime_pos`, 5 lines). That program passes **all 8** of m3.as.b1's cases — including `2`, `1`, `997 1000`, `9 9 9 9`. Of b1's
… (truncated)

---

### MAJOR · `m3.assessment` · assessment.ts · *assessment*

**Claim.** November's check does not fit its stated 20 minutes. It asks for a 21-line, three-function program from a blank editor plus roughly 21–24 separate written or spoken answers — 3.5× the code volume and ~4× the response count of September's post-audit 20-minute baseline, which this very file cites as the thing it is avoiding.

**Evidence.**

```
Counted off the built Month objects. September (calibrated after the 32-minute audit): b1 reference = 6 lines, prompt 117 chars; b2 = a 5-line retype; b3 explain = 4 numbered sub-questions, 4 marking points; b4 oral = 0 numbered sub-questions, 1 marking point. Total ≈ 11 lines of code and ~5 responses. November: b1 reference = 21 non-blank lines across three `def`s, prompt 733 chars (6.3× September's); b2 = 5 numbered items of which (1)(2)(3) are asked «для каждой своей функции» — 9 answers against the reference's three functions, plus (4) and (5) = 11; b3 = a 10-line program traced on paper plus 4 numbered questions of which (2) is «Имя `count` встречается в коде в трёх местах. Скажи про каждое» — ≈10 answers; b4 = 3 numbered questions. 12 marking points in total vs September's 5; 2070 prompt chars vs 722. The file's own arithmetic (assessment.ts:21-25) is «the unseen problem is ~11 minutes, the written contract answer ~4, the paper trace ~3, and the oral piece runs alongside» — that books 11 written answers at 4 minutes, a 10-line paper trace plus 10 answers at 3, and a three-question spoken interview at zero, in a month whose PDF sentence is the only place the programme names a lesson count and never mentions a time budget.
```

**Proposed fix.** Cut to September's shape: one unseen problem plus one written or oral piece. Concretely — drop b3 or b4 (they are two halves of one «қосымша сұрақ» in the PDF, not two graded tasks), reduce b1 to two functions rather than three-plus-main, and stop asking b2's three facts per function; asking them for one named function is the same evidence in a third of the writing. Or raise `minutes` in month-03-november.ts:239 to what it actually is and say so.

**Verification.** CONFIRMED. I tried to refute it and every leg reproduced.

MEASUREMENTS (recomputed independently off the built Month objects): Sept m1.assessment = 722 RU prompt chars, 5 marking points, 11 reference lines (6 from scratch + 5 retyped in the find_bug), 4 numbered sub-questions. Nov m3.assessment = 2070 chars, 12 marking points, 21 reference lines all from scratch, 12 numbered sub-questions. Hand-counted response items for November: b2 (3 questions x 3 functions + 2 essay = 11) + b3 (3 output lines + 3 `count` sites + 2 + 2 = 10) + b4 (3) = 24, vs September's 5. The claim's "21-24" and "~4x" are if anything conservative.

DECISIVE IN-REPO EVIDENCE, not my arithmetic:
1. schools/curriculum/validate.ts carries an assessment-minutes estimator (currently uncommitted in this worktree) that rates November at 34 min against a stated 20. The file header's own sum is 18. They disagree by 16 minutes and the header is the outlier on every single term: unseen problem 11 vs 12, the 5-question explain 4 vs 10, the paper trace 3 vs 6, the 3-question oral 0 vs 6. The estimator flat-rates unseen_problem at 12 regardless of size, charging November's 21-line three-function program exactly what it char
… (truncated)

---

### MAJOR · `m2.p6` · practice.ts · *assessment*

**Claim.** The list-palindrome task — one of the PDF's named October families, whose whole point is the two-pointer traversal — is deleted by a one-line slice, and it is the task that comes right after the block that tells every learner `a[::-1]` exists.

**Evidence.**

```
m2.p6 has no `tracks` (all routes) and its prompt in neither language forbids anything: «Осы тізім палиндром ба... Палиндром болса `yes`, болмаса `no` деген сөзді шығар.» Running `a = list(map(int, input().split()))` + `if a == a[::-1]: print("yes") else: print("no")` against all 7 of its cases (1 visible, 6 hidden) gives yes/no/yes/yes/no/yes/no — a clean pass, versus its 11-line two-pointer reference. `expr.slice` is declared to arrive in October with `strings.sequence` (capability.ts:812), nothing gates a learner's submission (`untaughtConstructsIn` is exported and called from nowhere in src/ or schools/), and `teachingOrder()` puts m2.p6 at ordinal 163 — after m2.l8.b7 at 145, whose prompt spells the token out loud: «`reversed()`, `sorted()` және `a[::-1]` қолдануға болмайды». Two more in the same class, both before that prompt so less exposed: m2.l6.b7 (l6.ts:197, palindrome of a word, core+advanced) passes all 7 cases with `if s == s[::-1]`, and m2.l6.b8 (l6.ts:257, reverse a word, all tracks) passes all 6 with `print(input()[::-1])`. AUTHORING_CONTRACT.md line 138: «тізімді кері аудару is written with a loop... that traversal IS the thing being taught.»
```

**Proposed fix.** Carry m2.l8.b7's prohibition sentence into m2.p6, m2.l6.b7 and m2.l6.b8 in both languages — it is already written and already reviewed. m2.l6.b8's «Жаңа жолды циклмен, таңбалап жинақта» and m2.l6.b7's «Таңбаларды жұптап салыстыр» are guidance a learner can ignore without failing anything.

**Verification.** CONFIRMED in substance, though several of the reviewer's supporting details are wrong and its framing is inflated. Correct those before acting on it.

WHAT I REPRODUCED (/tmp/run_slice.py, cases extracted from the real modules via tsx, not transcribed):
- m2.p6 has 9 cases (1 visible, 8 hidden), not 7. `a = list(map(int, input().split()))` + `if a == a[::-1]: print("yes") else: print("no")` passes 9/9. The authored 11-line two-pointer reference also passes 9/9. No test case can separate them — both are correct programs, so this is not fixable by adding cases.
- Same one-liner kill on the two siblings: m2.l6.b7 `s == s[::-1]` passes 7/7; m2.l6.b8 `print(input()[::-1])` passes 6/6; and m2.l8.b7 `print(" ".join(input().split()[::-1]))` passes 7/7 despite its prompt banning the token by name.

WHY IT IS A REAL DEFECT AND NOT TASTE:
1. `expr.slice` is genuinely open in October — capability.ts:812 unlocks it with `strings.sequence`, taught at m2.l6.b1. The learner smuggles nothing. So no construct gate can ever catch this, and `untaughtConstructsIn` (capability.ts:1029) is imported only by tests/nova/construct-context.test.ts — zero callers in src/ or schools/. Prompt text is the ONLY av
… (truncated)

---

## Refuted (8)

Each of these was reproduced by a second agent and did not hold. They are kept
because a refuted finding is evidence too — it says the content survived a
specific attack.

### `m2.l1.b1` · *technical*

**Claim.** The concept body states the count of `range(a, b)` as an unconditional rule — «сандардың саны дәл b − a болады» / «чисел получается ровно b − a» — which is false whenever b < a, where the count is 0 and b − a is negative. The same month then requires the learner to reason about exactly that case.

**Why it does not hold.** Refuted — the claim quotes the committed HEAD text, not the working tree under review, where the fix is already applied. `git diff HEAD -- schools/curriculum/months/m02/l1.ts` shows HEAD's body read «Себебі СОНДА сандардың саны дәл b − a болады» / «Потому что ТОГДА чисел получается ровно b − a», unconditional and with no empty-range sentence. The working-tree body reads «Себебі B ≥ A БОЛҒАНДА сандардың саны дәл b − a болады … Ал b ≤ a болса, сан мүлде шықпайды: range(5, 2) бірде-бір сан бермейді, сондықтан цикл денесі бір рет те орындалмайды» / «Потому что ПРИ B ≥ A чисел получается ровно b − a … А если b ≤ a, чисел нет вообще: range(5, 2) не даёт ни одного числа, и тело цикла не выполнится ни разу». The condition is named and the empty case is stated explicitly, with range(5, 2) — the reviewer's own counterexample family — as the worked instance. Verified in Python: range(2,5)=3 vs b−a=
… (truncated)

---

### `m3.l6.b3` · *kk*

**Claim.** The multiple_choice question re-uses «дұрыс» in a second sense two clauses after using it for output correctness, so the Kazakh question appears to contradict its own set-up; the Russian avoids this by switching to «хорошее».

**Why it does not hold.** REFUTED. The repetition is real; the contradiction is not. Four independent checks, all against the claim.

1. The disambiguator is inside the same sentence, and the reviewer quoted it. `/Users/kydyrbekbekarys/SolveX4schools/.claude/worktrees/curriculum-months-2-9/schools/curriculum/months/m03/l6.ts:202` reads «Төртеуі де қатесіз жұмыс істейді және дұрыс жауап шығарады — айырмасы тек әр функцияның нені міндетіне алғанында. Қайсысы — дұрыс бөлу?» The em-dash clause states that the ONLY axis of difference is what each function takes as its job. That clause makes the output-reading of «дұрыс бөлу» self-cancelling: a learner who parsed it as "the split that yields the correct answer" is told in the same breath that all four do, so the reading returns "all four", which is not an available option, and they re-read. Also, «дұрыс» here attaches to «бөлу» — a different head noun. Reading it as ou
… (truncated)

---

### `m3.l3.b2` · *ru*

**Claim.** Gender-agreement slip in a worked_example step: the Russian introduces the subject as «переменная» (feminine) and then refers back to it with «он» (masculine) in the very next clause. The Kazakh cannot have this fault because it has no grammatical gender, so this is an artefact of the translation only.

**Why it does not hold.** REFUTED. The claim misparses the Russian sentence. m3.l3.b2 step 2 (l3.ts:121) reads «Внутри функции есть НАКОПИТЕЛЬ `s`. Это её собственная переменная: после завершения `digit_sum(a)` ОН исчезает…». The subject introduced is «накопитель», which is masculine (soft-stem 2nd-declension, like учитель/двигатель). «переменная» is never the subject — it is a predicate nominative inside a «Это X» identifying clause whose grammatical subject is the invariant «Это». «он» therefore agrees with «накопитель», the noun that names and topicalises the referent. That is correct anaphora, not a gender slip. Three further reasons the finding does not stand: (1) The proposed fix is worse. The clause contains two salient feminine nouns before the pronoun — «функции» and the possessive «её» (both = функция) plus «переменная». «она исчезает» would be genuinely ambiguous as "the FUNCTION disappears after digit
… (truncated)

---

### `m2.assessment` · *solvability*

**Claim.** The 20-minute October check also runs four graded tasks, and its written block b3 asks two of the same questions the oral block b4 asks four cards later.

**Why it does not hold.** REFUTED as stated. Both conjuncts fail on the facts, and the second is a garbled echo of a rule rather than a reading of the file.

**1. "Four graded tasks" is wrong — exactly one block is graded.**
`checkBlock` (schools/learning/checking.ts:260-266) returns `{verdict:"unknown"}` for `explain` and for EVERY `verify`, and `gradeBlock` (schools/learning/grade.ts:108) drops unknown verdicts out of the skill model entirely. Only b2 ever produces a machine verdict, and only via `checkCodeResult` on its sandbox run. b1 (manual_trace), b3 (explain) and b4 (oral_explanation) are teacher-read paper/spoken work that settles unmeasured — which is the contract's own requirement ("Written and oral work stays unmeasured"), not a violation of it. Calling three unmeasured teacher-read pieces "graded tasks" inverts the rule they satisfy.

**2. The four-block shape is what the contract's own arithmetic pr
… (truncated)

---

### `m3.l8.b8` · *solvability*

**Claim.** `.append()` and `.join()` enter the course here as unexplained boilerplate inside a modify_code the learner is told not to touch, and are never named in any learner-facing prose in either month, yet building a list is what m3.p9 asks for.

**Why it does not hold.** REFUTED — both pillars of the claim's evidence fail against the tree under review; the reviewer measured a pre-fix version.

(1) The "zero hits" scan is wrong. I re-ran it over every localized kk/ru string at any depth in all 101 October and 89 November blocks as assembled by MONTHS. Eight hits, all in one block: m2.l7.b10, an October `concept` on ALL THREE tracks (schools/curriculum/months/m02/l7.ts:264-278). title.kk = «Жолды бөлшектеп жинау: str, append, join»; title.ru = «Собираем строку по частям: str, append, join»; body.kk and body.ru name and explain all three constructs — str(7) gives the text "7", make an empty list and gather parts with `.append()`, then `" ".join(...)` puts one space BETWEEN the parts — and explicitly argue why not `row = row + str(x) + " "` (trailing space). Its `code` demonstrates it and runs: `row = []` / three `row.append(str(...))` / `print(" ".join(row)
… (truncated)

---

### `m2.l7.b7` · *assessment*

**Claim.** The multiplication-table task is an all-tracks, no-starter, no-scaffold write_code with an `exact` checker whose reference solution needs three constructs the curriculum has never put on screen — `str()`, `.append()` and `.join()` — and every path to a passing answer needs at least one of them.

**Why it does not hold.** REFUTED — the claim reproduces only against the last commit, not against the tree under review, where it is already fixed.

The tree contains `m2.l7.b10`, a `concept` block with no `tracks` (so all three routes get it) placed immediately before `m2.l7.b7` in array order, which IS teaching order (capability.ts:630, `teachingOrder()` walks month → unit → lesson → `lesson.blocks` in array order). Its bilingual body introduces exactly the three constructs — `str(7)` as the inverse of September's `int()`, `.append()` into an empty list, `" ".join(...)` as the thing that puts the separator BETWEEN parts — and names the claim's own trap explicitly: «`row = row + str(x) + " "` десек, жолдың СОҢЫНДА артық бос орын қалады» / «в КОНЦЕ строки останется лишний пробел». Its `code` is `row = []` / three `row.append(str(...))` / `print(" ".join(row))` / `print("|" + " ".join(row) + "|")`.

Re-running th
… (truncated)

---

### `m2.assessment` · *assessment*

**Claim.** October's check overruns its stated 20 minutes: it carries the same code volume as September's calibrated baseline plus a genuine paper trace, and asks for 13 discrete written or spoken responses where September asks for about 5.

**Why it does not hold.** REFUTED — the claim was measured against the committed version of the file, not the content under review. Every figure in the evidence reproduces exactly against `git show HEAD:schools/curriculum/months/m02/assessment.ts` and none of it against the working tree.

HEAD had four blocks (b1, b2, b3, b4); the working tree has three (b1, b2, b4). `m2.as.b3` — the four-question written `explain` — has been deleted, and it is the source of 4 of the claimed 13 responses, 4 of the claimed 11 marking points, and the entire "4 minutes for four reasoned prose answers" line. Measured off the built Month objects: HEAD = 4 blocks / 11 marking points / 1309 ru prompt chars (the reviewer's exact "1309" and "11"); working tree = 3 blocks / 7 marking points / 1113 ru chars / 9 written-or-spoken items, not 13. The evidence also quotes assessment.ts as saying «the paper trace is ~5 minutes, the unseen proble
… (truncated)

---

### `m2.l8` · *assessment*

**Claim.** m2.l8's second declared objective, «Шешімді ауызша дәлелдеу» / «Обосновывать решение устно», is served by no block on any route: the only candidate is advanced-only and is explicitly written, not spoken.

**Why it does not hold.** Refuted. The observable half reproduces — month-02-october.ts:191 declares «Шешімді ауызша дәлелдеу», and m2.l8's only explain (m2.l8.b9) is tracks:['advanced'] and explicitly written («Письменно защити») — but the claim's two load-bearing premises are both false.

(1) "Served by no block on any route" is wrong at month scope. schools/curriculum/months/m02/assessment.ts:201-203 is m2.as.b4, type:"verify", mode:"oral_explanation", carrying NO tracks field, so support, core and advanced all receive it. Its prompt opens «Мұғалімге ауызша түсіндір» / «Объясни учителю устно» and its third question is precisely oral justification of the learner's own solution: «Теперь возьми программу, которую ты написал во втором задании: почему ты уверен, что она останавливается». That is «шешімді ауызша дәлелдеу» on every route, and it is exactly where MONTHS_2_9_AUTHORING_PLAN.md:144 assigns October's oral
… (truncated)

---

