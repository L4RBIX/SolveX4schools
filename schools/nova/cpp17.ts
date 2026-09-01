import { MONTHS } from "@schools/curriculum/months";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import type { Locale, SkillId } from "@schools/curriculum/types";

/**
 * The C++17 Nova is allowed to reach for, and the C++17 it must not.
 *
 * ## Why this file exists at all
 *
 * Year 1 is C++17 (`YEAR_ONE_LANGUAGE`), procedural, no OOP
 * (`YEAR_ONE_EXCLUDES_OOP`). The audience is 14–15 and «нөлден бастайды», so
 * the single most damaging thing this tutor can do is answer a September
 * question with a construct September has not taught. A `for` loop offered to a
 * learner six lessons in is not a hint — it is a demonstration that the tutor
 * is not in the same room.
 *
 * `@schools/curriculum/capability` answers a neighbouring question — what code
 * has the curriculum literally put on screen — by walking the content. That is
 * the right mechanism and it stays the primary one. It cannot answer THIS
 * question, for two reasons that are properties of C++ rather than of the
 * implementation:
 *
 *   1. **The frame is given, not taught.** Every September program on screen
 *      contains `#include <iostream>`, `int main()`, braces and `return 0;`
 *      from lesson one. An extractor that walks shown code therefore reports
 *      `return` as available in week one — and it does; see the report. But
 *      the pedagogy is explicit that the frame is *given as scaffold* and only
 *      *required of the learner at l7*. "Shown" and "taught" have come apart,
 *      and in C++ they come apart on the very first line.
 *
 *   2. **`/` is taught twice.** At l4 on `int` (truncating) and at l5 on
 *      `double`. They are different operations wearing the same symbol, and no
 *      token-level walk of the source can tell them apart.
 *
 * So the September sequence is DECLARED here, transcribed from the binding
 * prerequisite table in `docs/cpp17/CPP17_PEDAGOGY.md`, and it is declared as
 * two numbers per construct — when it is first taught, and when the learner is
 * first required to write it unaided — because that distinction is the whole
 * design of the month.
 *
 * Months 2–9 are NOT declared here. Their lesson bodies are unauthored, the
 * skill taxonomy already carries `introducedInMonth` derived from the
 * programme PDF, and a second table would agree with the first on the day it
 * was written and silently stop agreeing. `ARRIVES_LATER` below names only the
 * few constructs whose absence changes what a hint may say, and it names them
 * by the skill that introduces them so the month comes from `skills.ts`.
 *
 * ## What this file is not
 *
 * It does not decide how much help Nova may give — `grantHintLevel` does, on
 * the server, before a prompt exists. It makes no claim about the learner.
 * "The course has taught this by now" is a fact about the CONTENT; whether a
 * particular fourteen-year-old understood it is a different question that
 * nothing here answers or pretends to.
 */

/* -------------------------------------------------------------------------- */
/* The frame                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The four lines that do nothing the learner can see.
 *
 * Python's first line prints. C++'s first four lines are ceremony, and there
 * are five new ideas inside them — a preprocessor directive, a namespace, a
 * function, braces, semicolons — none of which can be taught before the first
 * program without turning lesson one into a vocabulary lecture.
 *
 * Stated to the model verbatim so that a hint which needs to point at the
 * frame points at the SAME frame the learner has on screen. A tutor that
 * writes `std::cout` at a learner whose editor says `using namespace std;`
 * has introduced a sixth idea to explain a typo.
 */
export const CPP17_FRAME = [
  "#include <iostream>",
  "using namespace std;",
  "int main() {",
  "    // ...",
  "    return 0;",
  "}",
].join("\n");

/* -------------------------------------------------------------------------- */
/* September, lesson by lesson                                                */
/* -------------------------------------------------------------------------- */

/**
 * One row of the prerequisite graph.
 *
 * `taughtAt` is the lesson at which the construct may first APPEAR in front of
 * the learner. `requiredAt` is the lesson at which they may first be asked to
 * write it themselves. They are equal for everything except the frame, and the
 * frame is the reason the two fields exist: from l1 to l6 it is on screen,
 * correct, and not the learner's problem.
 */
export interface Cpp17Construct {
  readonly id: string;
  /** How it is named to the model. English — it is C++, and `for` has no translation. */
  readonly label: string;
  readonly taughtAt: number;
  readonly requiredAt: number;
}

/**
 * September's twelve lessons, transcribed from the prerequisite table.
 *
 * Read as: nothing here may appear in work the learner WRITES until
 * `requiredAt`, and nothing may appear at all — even inside a scaffold they do
 * not have to write — until `taughtAt`.
 *
 * The order is the table's order, which is teaching order.
 */
export const SEPTEMBER_SEQUENCE: readonly Cpp17Construct[] = [
  { id: "out.cout", label: "cout <<, a string literal, and the ; that ends every statement", taughtAt: 1, requiredAt: 1 },
  { id: "frame", label: "the frame: #include, using namespace std, int main() {}, return 0", taughtAt: 1, requiredAt: 7 },
  { id: "out.expression", label: "cout of an arithmetic expression", taughtAt: 2, requiredAt: 2 },
  { id: "arith.basic", label: "+ - * on whole numbers", taughtAt: 2, requiredAt: 2 },
  { id: "var.int", label: "int declaration and assignment", taughtAt: 3, requiredAt: 3 },
  { id: "in.cin", label: "cin >>", taughtAt: 3, requiredAt: 3 },
  { id: "arith.int_div", label: "/ on int (truncates) and %", taughtAt: 4, requiredAt: 4 },
  { id: "var.double", label: "double, and / on double", taughtAt: 5, requiredAt: 5 },
  { id: "arith.mixed", label: "mixing int and double", taughtAt: 5, requiredAt: 5 },
  { id: "var.long_long", label: "long long, when int is not enough", taughtAt: 6, requiredAt: 6 },
  { id: "cmp.operators", label: "< <= > >= == !=", taughtAt: 8, requiredAt: 8 },
  { id: "cond.if_else", label: "if and else", taughtAt: 9, requiredAt: 9 },
  { id: "cond.else_if", label: "else if", taughtAt: 10, requiredAt: 10 },
  { id: "logic.ops", label: "&& || !", taughtAt: 11, requiredAt: 11 },
];

/** The last lesson of September. Practice and the monthly check sit after it. */
const SEPTEMBER_LAST_LESSON = 12;

/**
 * The month a later construct becomes available, read from the taxonomy.
 *
 * Not written down twice. `skills.ts` is derived from the programme PDF and
 * carries `introducedInMonth`; a number copied out of it here would agree on
 * the day it was copied and then stop agreeing with nothing to notice.
 *
 * `Infinity` when the skill cannot be resolved, which keeps the construct
 * withheld. Failing closed is the safe direction: the cost is one hint that
 * takes the long way round, against the alternative of a hint written in a
 * language the learner has not been taught.
 */
function arrivalMonth(arrival: Cpp17Arrival): number {
  return SKILL_BY_ID.get(arrival.skill)?.introducedInMonth ?? Number.POSITIVE_INFINITY;
}

/** The later constructs this position has not reached yet. */
export function arrivesAfter(month: number): readonly Cpp17Arrival[] {
  return ARRIVES_LATER.filter((a) => arrivalMonth(a) > month);
}

/**
 * The five scaffold stages, named so a hint can respect the one it is inside.
 *
 * A stage never goes backwards within a lesson, and a hint that tells a
 * stage-2 learner to "add a variable" has silently promoted them to stage 3.
 */
export const SCAFFOLD_STAGES: readonly string[] = [
  "1 — the whole program is on screen and correct; they predict it or change ONE expression",
  "2 — the frame is given and locked; they write the one body line",
  "3 — they add variables and cin inside the given frame",
  "4 — the frame and the reading are given; they write the if",
  "5 — from l7, they write the whole of main; from l12, the braces too",
];

/* -------------------------------------------------------------------------- */
/* After September                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Constructs that arrive in a later month, named by the skill that brings them.
 *
 * Deliberately short. This is not a second curriculum — it is the handful of
 * things a model reaches for by reflex when helping with an arithmetic or
 * conditional task, where reaching for them costs the learner the task. The
 * month is not written here; it is read from `skills.ts`, which is derived from
 * the programme PDF, so this table cannot drift away from the programme.
 *
 * `skill` is a real `SkillId`, so a skill renamed out from under this table is
 * a type error rather than a silently empty lookup.
 */
export interface Cpp17Arrival {
  readonly label: string;
  /** The skill whose `introducedInMonth` decides when this becomes available. */
  readonly skill: SkillId;
  readonly why: string;
}

export const ARRIVES_LATER: readonly Cpp17Arrival[] = [
  {
    label: "for loops",
    skill: "loops.for",
    why: "October's own subject. A September task that could be shortened with a loop is a task whose difficulty IS doing it the long way.",
  },
  {
    label: "while loops",
    skill: "loops.while",
    why: "Same month as for, and the same reason. September has no repetition of any kind.",
  },
  {
    label: "arrays and vector",
    skill: "lists.index",
    why: "October. September reads a fixed, named number of values with cin >> a >> b, never a collection.",
  },
  {
    label: "string as a sequence of characters",
    skill: "strings.sequence",
    why: "October. September's only text is a literal inside cout <<.",
  },
  {
    label: "their own functions",
    skill: "func.define",
    why: "November. Until then the only function that exists is main, and it is part of the given frame.",
  },
  {
    label: "sort and <algorithm>",
    skill: "sort.basic",
    why: "December. Offering sort to a learner who has not met a collection to sort is two untaught ideas at once.",
  },
  {
    label: "recursion",
    skill: "recursion.core",
    why: "February, and it depends on functions, which are November.",
  },
];

/**
 * Named so nobody adds them by accident.
 *
 * Year 1 is procedural. This list is the pedagogy document's own, and it is a
 * hard boundary rather than a sequence position: none of it arrives in month 9
 * either.
 */
export const NEVER_IN_YEAR_ONE: readonly string[] = [
  "classes, inheritance, any OOP",
  "templates the learner writes",
  "pointers, references, new/delete as a topic",
  "their own headers, const correctness, move semantics",
  "lambdas, auto beyond a range-for",
  "iterators as an abstraction",
]

/* -------------------------------------------------------------------------- */
/* The semantic traps                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The eight places where C++ produces a DIFFERENT ANSWER from the Python this
 * course used to teach.
 *
 * These are not syntax. Each one changes an expected output, which means a
 * tutor that carries a Python instinct into a C++ explanation is confidently
 * wrong about a number the learner can see on their own screen. Verified live
 * on both engines — Clang 8 in the browser and GCC 14 on the judge — not
 * assumed; see `docs/cpp17/CPP17_JUDGE_PARITY.md`.
 *
 * Stated at every position in the course, not gated by lesson, because being
 * wrong about `-7 / 2` is not less harmful in May.
 */
export const SEMANTIC_TRAPS: readonly string[] = [
  "7 / 2 is 3, not 3.5 (integer division truncates)",
  "-7 / 2 is -3 and -7 % 2 is -1 (C++ truncates toward zero, Python floors)",
  "int overflows SILENTLY past 2147483647 — a sum or product of inputs needs long long",
  "cin >> n on non-numeric text fails silently and leaves n unchanged",
  '"5" + 5 is NOT concatenation — it is arithmetic on the text\'s address; with std::string it does not compile at all',
  "if (x) needs a real comparison; there is no truthiness",
  "division by zero is undefined behaviour, not an exception — guard the divisor, never catch it",
  "a decorative cout prompt is a WRONG ANSWER; the judge compares bytes",
]

/* -------------------------------------------------------------------------- */
/* Where in the sequence this task sits                                       */
/* -------------------------------------------------------------------------- */

export interface Cpp17Position {
  readonly month: number;
  /** The lesson number within the month, or null for practice and the check. */
  readonly lesson: number | null;
  readonly kind: "lesson" | "practice" | "assessment";
}

/**
 * Read a position out of a block id.
 *
 * Ids are `m1.l7.b4` for a lesson block, `m1.p8` for practice and `m1.as.b1`
 * for the monthly check. Practice and the check sit AFTER the month's lessons,
 * so both resolve to the end of the month: a practice task in September may
 * legitimately use anything September taught.
 *
 * Returns null on anything it does not recognise, and null is a real answer
 * rather than an error — the caller degrades to the month-level rules, which
 * is exactly the behaviour before a position was available. Guessing a lesson
 * number from an id shape nobody has seen would be worse than not knowing.
 */
/**
 * Lesson ids are NOT the teaching order, in SEVEN of the nine months.
 *
 * September runs `l1, l11, l2, l10, l3, l4, l5, l12, l6, l7, l8, l9`; November
 * teaches `l8` fourth; December teaches `l7` fifth; January, February, March
 * and April all reorder too. Only October and May happen to be sequential. The
 * numbers are stable identifiers, not a sequence, and this map is derived from
 * the `Month` structure so it cannot drift from the content.
 *
 * Reading the number out of the id, which is what this file used to do, was
 * wrong in both directions and both were live in September:
 *
 *   - `m1.l11` is the SECOND lesson taught. It read as lesson 11, so a learner
 *     two lessons into the year was described to Nova as having finished
 *     eleven — and the tutor was free to reach for anything September teaches.
 *   - `m1.l4` is «if және else», taught SIXTH. It read as lesson 4, so
 *     `cond.if_else` came back as NOT TAUGHT YET in the very lesson that
 *     introduces it, and the tutor would withhold the lesson's own subject.
 *
 * ## Why this covers every month and not just the one that was broken
 *
 * `septemberTaughtBy` is the only CURRENT consumer of `lesson`, and it is
 * guarded by `month === 1`, so months 2–9 returned a wrong number that nobody
 * read. That is a trap, not a safety margin: the value is on a public function,
 * it looks authoritative, and the first person to use it for October would get
 * a silently wrong answer — which is precisely how this defect arrived in
 * September. Deriving all nine costs one loop and removes the trap.
 *
 * Found by the capability extractor's migration, which had just had the same
 * class of defect removed from it pointing the other way.
 */
const TEACHING_POSITION: ReadonlyMap<string, number> = (() => {
  const order = new Map<string, number>();
  for (const month of MONTHS) {
    let n = 0;
    for (const unit of month.units) {
      for (const lesson of unit.lessons) order.set(lesson.id, ++n);
    }
  }
  return order;
})();

export function cpp17PositionOf(blockId: string | undefined | null): Cpp17Position | null {
  if (typeof blockId !== "string") return null;
  /* `c` as well as `l`. May has no new topic — «төрт 45 минуттық жаттығу
     жарысы», PDF p.10 — so `m9.c1`..`m9.c4` are its four training contests, and
     they are lessons in every structural sense: they sit in a unit's `lessons`
     array, they route like one (`routes.test.ts` matches `^m\d+\.[lc]\d+$`),
     and they are taught in sequence. Omitting them here meant this function
     returned NULL for four of the programme's lessons, so Nova received no
     position at all for a third of May. */
  const m = /^m(\d+)\.([lc](\d+)|p\d+|as)\b/.exec(blockId.trim());
  if (!m) return null;
  const month = Number(m[1]);
  if (!Number.isFinite(month) || month < 1) return null;
  if (m[3]) {
    /* Position in the sequence, not the digits in the name. The fallback is for
       a block id naming a lesson the corpus does not contain — a typo or a
       deleted lesson — where the id's own number is the only thing left to say. */
    /* Look the id up as written — `m9.c1` is not `m9.l1`, and both may exist. */
    const taught = TEACHING_POSITION.get(`m${month}.${m[2]}`);
    return { month, lesson: taught ?? Number(m[3]), kind: "lesson" };
  }
  return {
    month,
    lesson: month === 1 ? SEPTEMBER_LAST_LESSON : null,
    kind: m[2] === "as" ? "assessment" : "practice",
  };
}

/**
 * What September has taught by a given lesson, split by whether the learner is
 * expected to write it.
 *
 * `given` is the load-bearing half. A learner at l3 has `int main()` in front
 * of them and cannot be asked to produce it — but a hint may absolutely point
 * at it, name it, and explain what it is for. Collapsing the two lists would
 * force a choice between a tutor that cannot mention the code on screen and one
 * that asks a fourteen-year-old for a function signature four lessons early.
 */
export function septemberTaughtBy(lesson: number): {
  readonly write: readonly Cpp17Construct[];
  readonly given: readonly Cpp17Construct[];
  readonly notYet: readonly Cpp17Construct[];
} {
  const write: Cpp17Construct[] = [];
  const given: Cpp17Construct[] = [];
  const notYet: Cpp17Construct[] = [];
  for (const c of SEPTEMBER_SEQUENCE) {
    if (c.taughtAt > lesson) notYet.push(c);
    else if (c.requiredAt > lesson) given.push(c);
    else write.push(c);
  }
  return { write, given, notYet };
}

/**
 * Is the frame on screen without being the learner's to write, at this position?
 *
 * The one fact in this file that the derived view gets WRONG rather than merely
 * misses, which is why it is exported rather than kept private to the renderer.
 * `frameBecomesTheirsAt()` in `@schools/curriculum/capability` infers the
 * cutover from the content — the first block whose hidden solution needs a
 * frame construct the learner has not been shown — and that proxy lands at
 * teaching lesson 4 (`m1.l10.b5`). The pedagogy document says lesson 7, and the
 * document is binding.
 *
 * So for lessons 5 and 6 the two views disagreed IN THE SAME PROMPT: the
 * derived list said `#include`, `int main() { }` and `return 0;` were theirs to
 * use freely while this file said they were on screen and not to be asked for.
 * `prompt.ts` now asks this question once and the capability block defers, so
 * the learner's scaffold state is stated once and from the binding source.
 *
 * False outside September and false when the position is unknown: after the
 * frame becomes theirs it never goes back, and an unrecognised block id is not
 * evidence that a learner is in week one. The withholding it would buy is not
 * worth telling a learner in March that `#include` is not theirs to write.
 */
export function frameIsStillScaffold(position: Cpp17Position | null): boolean {
  if (!position || position.month !== 1 || position.lesson === null) return false;
  return septemberTaughtBy(position.lesson).given.some((c) => c.id === "frame");
}

/* -------------------------------------------------------------------------- */
/* The bilingual vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The words for the things C++ adds, in the two languages the course is taught
 * in.
 *
 * The model writes the reply, so the reply's language is its choice — but the
 * vocabulary is not, and it is not derivable. C++ brings terms the Python
 * course never needed («компиляция», «нүктелі үтір», «айнымалы түрі») and a
 * model left to invent them produces a calque: a Kazakh sentence built out of
 * Russian technical nouns, which reads to a Kazakh fourteen-year-old as a
 * foreign language wearing Kazakh endings.
 *
 * Written per locale rather than translated — the Russian column is not the
 * source and the Kazakh column is not its rendering. They are the terms each
 * language actually uses.
 *
 * ## Open, and flagged rather than hidden
 *
 * `docs/cpp17/CPP17_PEDAGOGY.md` records that native Kazakh review of the
 * migrated content is NOT PERFORMED, and this table is exactly the sort of
 * thing that review is for. One collision is known and deliberate:
 * «жинақтаушы» is offered for *compiler* while `skills.ts` already uses
 * «Жинақтаушы айнымалы» for *accumulator variable* in October. Both are given
 * here, «компилятор» first, so a reviewer can choose rather than discover.
 */
export const CPP17_TERMS: Record<Locale, readonly string[]> = {
  kk: [
    "компиляция, компилятор (жинақтаушы), компиляция қатесі",
    "нүктелі үтір = semicolon; жүйелі жақша = braces; тақырыптық файл = header",
    "айнымалы түрі = variable type; жариялау = declare; асып кету = overflow",
  ],
  ru: [
    "компиляция, компилятор, ошибка компиляции",
    "точка с запятой = semicolon; фигурные скобки = braces; заголовочный файл = header",
    "тип переменной = variable type; объявить = declare; переполнение = overflow",
  ],
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

/** Header for the sequence section. Exported so `PROMPT_MARKERS` can reuse it. */
export const CPP17_PROMPT_HEADING = "THE LANGUAGE — C++17, AND HOW FAR IN THEY ARE";

/**
 * What the rest of the prompt is already saying, so this section can stop
 * saying it too.
 *
 * ## The duplication this exists to end
 *
 * Two sections were describing the same thing in two vocabularies. This file
 * DECLARES September's constructs from the pedagogy document; `capability.ts`
 * DERIVES them by walking the code the course puts on screen. Between them they
 * were 39.5% of the September system prompt, and the overlap was measured at
 * ~1.25 kB per request — a TAUGHT list twice, a not-yet list twice, a
 * later-months list twice, and the scaffold sentence twice, word for word.
 *
 * ## Which one is authoritative, and why it is the derived one
 *
 * `capability.ts` wins the INVENTORY — which constructs the learner has met.
 * It is computed from the content by a walk in teaching order, so it cannot
 * drift from the curriculum the way a hand-written table drifts; it is finer
 * (the extractor's alphabet, not fourteen pedagogy rows); and its closed-list
 * rule — "anything not on the TAUGHT list counts as not taught" — is a stronger
 * statement than any enumeration of what is missing.
 *
 * This file keeps only what a walk of the shown code cannot see, and each of
 * these is here because the derived view is structurally unable to state it:
 *
 *   - the language itself, and that Python is not it;
 *   - the frame VERBATIM, so a hint that points at "line 2" means their line 2;
 *   - given-vs-required — see `frameIsStillScaffold`, where the derived cutover
 *     is three lessons early and the pedagogy document is binding;
 *   - `NEVER_IN_YEAR_ONE`, which is a rule about the whole year. The derived
 *     view's nearest claim is "no code in this course shows it", and its own
 *     comment says that is deliberately weaker than "the course does not teach
 *     it";
 *   - the semantic traps, which are about what C++ ANSWERS, not what it shows;
 *   - the bilingual vocabulary, which is not in any code field.
 *
 * ## What the cut costs, stated rather than hidden
 *
 * One thing: `double`. September teaches the type at lesson 5 and the word
 * appears in eleven places in the month's PROSE — and in no `code` field
 * anywhere in the nine months, so the extractor never sees it and the derived
 * TAUGHT list cannot contain it. Under the closed-list rule Nova will avoid
 * writing `double` on the lesson about `double`, which is the over-RESTRICTING
 * direction and therefore the safe one to be wrong in. It is a content gap —
 * a September that teaches a type it never puts on screen — and papering over
 * it with a second, contradicting list is how it stayed invisible.
 *
 * Terse because the whole system prompt is under a measured ceiling that a test
 * enforces — input tokens are billed and eighteen learners share one monthly
 * cap. The reasoning behind every line above is worth writing down; it is not
 * worth paying for on every request, so it lives in these comments and the
 * model gets the rules.
 */
export interface Cpp17PromptOptions {
  /**
   * True when `capabilityPromptLines` is also being rendered into this prompt.
   *
   * A fact about the WHOLE prompt, which only its assembler knows, which is why
   * it is a parameter rather than something guessed here. False is the honest
   * default: the dev lab, `tests/nova/construct-context.test.ts` and any block
   * outside the capability walk build a prompt with no derived inventory in it,
   * and there the declared sequence is the only thing standing between a
   * fourteen-year-old and a `for` loop.
   */
  readonly derivedInventoryPresent: boolean;
}

export function cpp17PromptLines(
  position: Cpp17Position | null,
  locale: Locale,
  opts: Cpp17PromptOptions = { derivedInventoryPresent: false },
): string[] {
  const lines: string[] = [
    "",
    CPP17_PROMPT_HEADING,
    "- C++17, procedural. NO classes and no OOP anywhere in year 1. Never write Python at",
    "  them — no print(), input(), def, elif or colon-and-indent blocks. Every statement ends",
    "  in ';' and every variable has a declared type.",
    /* Multi-line, exactly as it sits in their editor. Flattening it onto one
       line saved a hundred characters and cost the thing the block is for: a
       tutor that points at "line 2" has to mean the line the learner's line 2
       actually is. */
    "- Their frame, GIVEN to them rather than invented — this is what is on screen:",
    "```cpp",
    CPP17_FRAME,
    "```",
  ];

  /* The inventory — WHICH constructs — only when nothing else is stating it.
     The position and the scaffold sentence are stated either way: neither is
     derivable, and both are what the rest of the section is read against. */
  const declared = !opts.derivedInventoryPresent;

  if (position && position.month === 1 && position.lesson !== null) {
    const { write, given, notYet } = septemberTaughtBy(position.lesson);
    lines.push(
      declared
        ? `- September, lesson ${position.lesson} of 12. TAUGHT: ${write.map((c) => c.label).join("; ")}`
        : `- September, lesson ${position.lesson} of 12.`,
    );
    if (given.length) {
      /* Stated here in BOTH modes, and the capability block defers to it — see
         `frameIsStillScaffold`. The derived cutover is three lessons early, so
         the two used to contradict each other on lessons 5 and 6. */
      lines.push(
        `- On screen but NOT yet theirs to write: ${given.map((c) => c.label).join("; ")}.`,
        "  Point at it and explain it; never ask them to produce it.",
      );
    }
    if (notYet.length) {
      /* Kept in both modes, and it is not the restatement it looks like. The
         derived view's arrivals are the constructs first shown in a LATER
         MONTH; one first shown later in THIS month is simply missing from its
         TAUGHT list, and the closed-list rule is all that withholds it. That is
         sound and it is silent, and September — twelve lessons with `if` at the
         ninth — is where within-month sequencing does the most work.
         It also costs nothing where the ceiling is set: at the assessment,
         which is the worst September prompt, the month is over and this list is
         empty. It is at its longest at lesson 1, where the prompt is smallest. */
      lines.push(
        `- NOT TAUGHT YET this month: ${notYet.map((c) => c.label).join("; ")}.`,
      );
    }
  } else if (position) {
    lines.push(`- Month ${position.month} of 9. Use only what the course has reached.`);
  }

  /* Withheld when the position is unknown, not permitted. A block id nobody
     recognises is not evidence that the learner has reached December.

     Dropped when the derived inventory is present, which says the same thing
     construct by construct and month by month — `m2: for, while, vector, …`
     against this list's `for loops (m2); while loops (m2); arrays and vector
     (m2)`. Every entry below appears in that one, in the same month, with more
     of the alphabet around it. */
  const later = declared ? arrivesAfter(position?.month ?? 1) : [];
  if (later.length) {
    lines.push(
      `- NOT UNTIL LATER: ${later.map((a) => `${a.label} (m${arrivalMonth(a)})`).join("; ")}.`,
    );
  }

  lines.push(
    `- NEVER in year 1: ${NEVER_IN_YEAR_ONE.join("; ")}.`,
    "- If the only fix you can see needs something untaught, you have the wrong fix. A longer",
    "  solution built from what they know is the CORRECT one. Explaining what a loop is, when",
    "  asked, is allowed; solving this task with one is not.",
    "- C++ IS NOT PYTHON — these change the ANSWER, not the syntax:",
    `  ${SEMANTIC_TRAPS.join(" · ")}.`,
    `- Words for the new ideas in ${locale === "kk" ? "Kazakh" : "Russian"}, use these rather than a calque:`,
    ...CPP17_TERMS[locale].map((t) => `  ${t}`),
  );

  return lines;
}
