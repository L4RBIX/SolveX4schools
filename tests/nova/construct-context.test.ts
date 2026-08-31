import { describe, it, expect } from "vitest";
import { grantHintLevel } from "@solvex/nova-core";
import {
  CAPABILITY_VOCABULARY_IS_PYTHON,
  buildSystemPrompt,
} from "@schools/nova/prompt";
import {
  CAPABILITY_PROMPT_HEADING,
  CONSTRUCTS,
  capabilityFor,
  extractConstructs,
} from "@schools/curriculum/capability";
import {
  YEAR_ONE_EXCLUDES_OOP,
  YEAR_ONE_LANGUAGE,
} from "@schools/curriculum/source-of-truth";
import {
  ARRIVES_LATER,
  CPP17_FRAME,
  CPP17_PROMPT_HEADING,
  CPP17_TERMS,
  NEVER_IN_YEAR_ONE,
  SCAFFOLD_STAGES,
  SEMANTIC_TRAPS,
  SEPTEMBER_SEQUENCE,
  arrivesAfter,
  cpp17PositionOf,
  cpp17PromptLines,
  septemberTaughtBy,
} from "@schools/nova/cpp17";

/**
 * Which C++17 Nova is allowed to reach for.
 *
 * The defect this guards is unchanged from the Python course and the stakes
 * went up: Nova is told the month, the lesson, the task and the task's skills,
 * and nothing about which constructs the learner has actually met. A level-4
 * hint on a September task that arrives as a `for` loop, a `vector` or a
 * function of the learner's own is not a hint — it is a demonstration that the
 * tutor is not in the same room. `docs/cpp17/CPP17_PEDAGOGY.md` makes the
 * prerequisite table binding; this file is what holds Nova to it.
 *
 * ## Why this file no longer tests the curriculum's extractor
 *
 * It used to assert the availability sets that `@schools/curriculum/capability`
 * derives by walking the code the course shows. That module's alphabet is
 * Python's — `builtin.print`, `stmt.elif`, `expr.comprehension` — and the
 * curriculum is now C++17, so its answers about this course are not merely
 * stale, they are confidently wrong in the over-permitting direction. The
 * evidence is pinned below rather than described, and the seam that keeps it
 * out of the prompt is tested in both directions so the mitigation cannot
 * outlive the problem.
 *
 * Extractor hygiene itself — masking comments and string literals, telling `<=`
 * from `<` — is the curriculum's own property and is covered by its own suite
 * at `tests/school/constructs-are-taught.test.ts`. Asserting it from here would
 * put a second owner on a file the Nova phase does not read.
 *
 * The assertions below are deliberately adversarial in the same way the
 * originals were. The cheap way to make a sequence gate "work" is a list that
 * is never checked against the document it came from, so the table is pinned
 * ITEM BY ITEM, the things that must be ABSENT are pinned, and the set is
 * required to GROW as the month proceeds.
 */

const grantAt = (level: number) =>
  grantHintLevel({
    requested: level,
    lastGranted: level - 1,
    hasAttemptSinceLastHint: true,
    hasAttempted: true,
    directive: null,
    learnerOverride: false,
  });

const base = {
  locale: "kk" as const,
  monthTitle: "Қыркүйек",
  lessonTitle: "Шарттар",
  blockPrompt: "Ең үлкен санды шығар",
  skills: ["cond.if_elif_else"],
  directive: null,
};

const promptAt = (blockId: string | undefined, level = 4, locale: "kk" | "ru" = "kk") =>
  buildSystemPrompt({ ...base, locale, blockId, grant: grantAt(level) });

/* ========================================================================== */
/* The programme's own statement of what year one is                          */
/* ========================================================================== */

describe("the course this gate is written for", () => {
  it("is C++17 and excludes OOP, as the source of truth says", () => {
    /* Read rather than assumed. If year one ever stops being C++17 this file is
       the wrong shape and should fail loudly rather than keep asserting a
       September that no longer exists. */
    expect(YEAR_ONE_LANGUAGE).toBe("cpp17");
    expect(YEAR_ONE_EXCLUDES_OOP).toBe(true);
  });

  it("never offers anything the programme rules out for the whole year", () => {
    const never = NEVER_IN_YEAR_ONE.join(" ").toLowerCase();
    for (const forbidden of ["classes", "oop", "templates", "pointers", "lambdas"]) {
      expect(never, `year 1 must exclude ${forbidden}`).toContain(forbidden);
    }
  });
});

/* ========================================================================== */
/* The September prerequisite graph                                           */
/* ========================================================================== */

describe("September's prerequisite table, as the pedagogy document states it", () => {
  const taughtAt = (id: string) => SEPTEMBER_SEQUENCE.find((c) => c.id === id)?.taughtAt;
  const requiredAt = (id: string) => SEPTEMBER_SEQUENCE.find((c) => c.id === id)?.requiredAt;

  it("puts every construct at the lesson the table puts it at", () => {
    /* Transcribed from the table in `docs/cpp17/CPP17_PEDAGOGY.md`, item by
       item. A test that only checked the set was non-empty would pass against
       any list at all, which is exactly how a sequence gate starts lying. */
    expect(taughtAt("out.cout")).toBe(1);
    expect(taughtAt("frame")).toBe(1);
    expect(taughtAt("out.expression")).toBe(2);
    expect(taughtAt("arith.basic")).toBe(2);
    expect(taughtAt("var.int")).toBe(3);
    expect(taughtAt("in.cin")).toBe(3);
    expect(taughtAt("arith.int_div")).toBe(4);
    expect(taughtAt("var.double")).toBe(5);
    expect(taughtAt("arith.mixed")).toBe(5);
    expect(taughtAt("var.long_long")).toBe(6);
    expect(taughtAt("cmp.operators")).toBe(8);
    expect(taughtAt("cond.if_else")).toBe(9);
    expect(taughtAt("cond.else_if")).toBe(10);
    expect(taughtAt("logic.ops")).toBe(11);
  });

  it("separates given from required, and only for the frame", () => {
    /* The distinction the whole month is built on, and the one thing a walk of
       the shown code cannot see: `#include <iostream>`, `int main()` and
       `return 0;` are on screen from lesson one and are not the learner's to
       write until lesson seven. Everything else is required the moment it is
       taught. */
    expect(requiredAt("frame")).toBe(7);
    for (const c of SEPTEMBER_SEQUENCE) {
      expect(c.requiredAt, `${c.id} cannot be required before it is taught`).toBeGreaterThanOrEqual(
        c.taughtAt,
      );
      if (c.id !== "frame") {
        expect(c.requiredAt, `${c.id} is required the lesson it is taught`).toBe(c.taughtAt);
      }
    }
  });

  it("agrees with the scaffold stages about when main becomes theirs", () => {
    /* Stage 5 is "from l7, they write the whole of main". The frame's
       `requiredAt` is the same fact stated as a number, and the two must not be
       free to drift — a stage list that said 7 beside a table that said 5 would
       leave nothing to notice. */
    const stage5 = SCAFFOLD_STAGES.find((s) => s.startsWith("5 —"));
    expect(stage5).toBeDefined();
    expect(stage5).toContain(`l${requiredAt("frame")}`);
    expect(SCAFFOLD_STAGES).toHaveLength(5);
  });

  it("teaches division twice, on int and then on double", () => {
    /* Not a duplicate entry to be tidied away. `7 / 2` is `3` and `7.0 / 2` is
       `3.5`; they are different operations wearing the same symbol, and a
       learner who meets that as a surprise has been failed by the sequence. */
    expect(taughtAt("arith.int_div")).toBe(4);
    expect(taughtAt("var.double")).toBe(5);
    expect(taughtAt("arith.int_div")!).toBeLessThan(taughtAt("var.double")!);
  });

  it("grows strictly as the month proceeds and never shrinks", () => {
    /* THE assertion a per-month table cannot pass. At l1 the learner has met
       `cout` and a string literal; by l11 they have met input, types, both
       divisions, comparison, if/else and the boolean operators. */
    let previous = new Set<string>();
    let grew = 0;
    for (let lesson = 1; lesson <= 12; lesson += 1) {
      const now = new Set(septemberTaughtBy(lesson).write.map((c) => c.id));
      for (const id of previous) {
        expect(now.has(id), `lesson ${lesson} lost ${id}`).toBe(true);
      }
      if (now.size > previous.size) grew += 1;
      previous = now;
    }
    expect(grew, "the set must actually widen across the month").toBeGreaterThan(6);
  });

  it("knows nothing about conditions, comparison or input at lesson one", () => {
    const first = septemberTaughtBy(1);
    const write = new Set(first.write.map((c) => c.id));
    for (const id of ["cond.if_else", "cond.else_if", "cmp.operators", "logic.ops", "in.cin", "var.int"]) {
      expect(write.has(id), `${id} must not be writable at lesson 1`).toBe(false);
    }
    // And the frame is present, on screen, and not theirs.
    expect(first.given.map((c) => c.id)).toContain("frame");
    expect(write.has("out.cout")).toBe(true);
  });

  it("has every September construct available by the last lesson", () => {
    const last = septemberTaughtBy(12);
    expect(last.notYet).toEqual([]);
    expect(last.given).toEqual([]);
    expect(last.write).toHaveLength(SEPTEMBER_SEQUENCE.length);
  });
});

/* ========================================================================== */
/* Where in the nine months a block sits                                      */
/* ========================================================================== */

describe("reading a position out of a block id", () => {
  it("reads the TEACHING position, which is not the number in the id", () => {
    /* September's ids are not its order. The month runs
       l1, l11, l2, l10, l3, l4, l5, l12, l6, l7, l8, l9 — the numbers are
       stable identifiers, not a sequence.

       This used to parse the digits out of the id, and it was wrong in both
       directions at once:
         `m1.l11` is the SECOND lesson taught and read as the eleventh, so a
           learner two lessons in was described to Nova as nearly finished with
           September and the tutor could reach for anything the month teaches;
         `m1.l4` is «if және else», taught SIXTH, and read as the fourth — so
           `cond.if_else` came back NOT TAUGHT YET during the lesson that
           introduces it, and the tutor would withhold its own subject.

       Outside September ids and order coincide, and m4 pins that. */
    expect(cpp17PositionOf("m1.l7.b4")).toEqual({ month: 1, lesson: 10, kind: "lesson" });
    expect(cpp17PositionOf("m1.l11.b1")).toEqual({ month: 1, lesson: 2, kind: "lesson" });
    expect(cpp17PositionOf("m1.l4.b1")).toEqual({ month: 1, lesson: 6, kind: "lesson" });
    expect(cpp17PositionOf("m4.l1.b8")).toEqual({ month: 4, lesson: 1, kind: "lesson" });
  });

  it("puts practice and the monthly check after the month's lessons", () => {
    /* A September practice task follows the twelve lessons, so it may
       legitimately use anything September taught. Treating it as lesson zero
       would have Nova refuse to mention `if` on a task about `if`. */
    expect(cpp17PositionOf("m1.p8")).toEqual({ month: 1, lesson: 12, kind: "practice" });
    expect(cpp17PositionOf("m1.as.b1")).toEqual({ month: 1, lesson: 12, kind: "assessment" });
  });

  it("returns null for anything it does not recognise, and null is not permission", () => {
    for (const id of ["", "nonsense", "lesson-3", "x1.l2.b3", undefined, null]) {
      expect(cpp17PositionOf(id as string)).toBeNull();
    }
    /* The consequence, which is the part that matters: an unrecognised id must
       not read as "they have reached December". The later-months list is still
       withheld in full. */
    const unknown = promptAt("nonsense");
    expect(unknown).toContain("NOT UNTIL LATER");
    expect(unknown).toContain("for loops");
  });
});

/* ========================================================================== */
/* The later months come from the taxonomy, not from a second table           */
/* ========================================================================== */

describe("what arrives later, and when", () => {
  it("takes the month from skills.ts rather than writing it down twice", () => {
    /* The months come from the programme PDF by way of `skills.ts`. A number
       typed here would agree on the day it was typed and then stop agreeing
       with nothing to notice, which is the failure mode this whole gate exists
       to avoid. */
    const rendered = promptAt("m1.l7.b4");
    expect(rendered).toContain("for loops (m2)");
    expect(rendered).toContain("their own functions (m3)");
    expect(rendered).toContain("sort and <algorithm> (m4)");
    expect(rendered).toContain("recursion (m6)");
  });

  it("stops withholding a construct once its month has arrived", () => {
    /* The assertion that a hardcoded "not in year one" list cannot pass. A
       learner in December has met loops, arrays and functions, and a tutor that
       still refuses them in December has stopped being useful. */
    const september = new Set(arrivesAfter(1).map((a) => a.label));
    const december = new Set(arrivesAfter(4).map((a) => a.label));
    expect(september.has("for loops")).toBe(true);
    expect(december.has("for loops")).toBe(false);
    expect(december.size).toBeLessThan(september.size);
    // Recursion is February, so December still withholds it.
    expect(december.has("recursion")).toBe(true);
  });

  it("gives every declaration a written justification", () => {
    expect(ARRIVES_LATER.length).toBeGreaterThan(0);
    for (const a of ARRIVES_LATER) {
      expect(a.why.trim().length, `${a.label} needs a justification`).toBeGreaterThan(20);
    }
  });
});

/* ========================================================================== */
/* The system prompt carries the constraint                                   */
/* ========================================================================== */

describe("the system prompt carries the constraint", () => {
  it("states the language, the frame, and that Python is not it", () => {
    const prompt = promptAt("m1.l3.b1");
    expect(prompt).toContain(CPP17_PROMPT_HEADING);
    expect(prompt).toContain("C++17, procedural");
    expect(prompt).toContain("NO classes and no OOP");
    /* The frame, verbatim from the module rather than retyped here — a frame
       that changes shape must change in both places at once. */
    for (const line of CPP17_FRAME.split("\n").map((l) => l.trim()).filter(Boolean)) {
      expect(prompt, `the frame line ${line}`).toContain(line);
    }
    for (const python of ["print()", "input()", "def", "elif"]) {
      expect(prompt, `${python} must be named as forbidden`).toContain(python);
    }
  });

  it("names what this lesson has not reached, and what is on screen but not theirs", () => {
    /* `m1.l3` is «Целочисленное деление и остаток», the FIFTH lesson taught,
       not the third — see the position test above. They have met cout,
       arithmetic, int and cin; they have NOT met comparison, if, else if or the
       boolean operators, and the frame is on screen without being theirs to
       write. */
    const prompt = promptAt("m1.l3.b1");
    expect(prompt).toContain("September, lesson 5 of 12");
    expect(prompt).toMatch(/TAUGHT:.*cin >>/);
    expect(prompt).toContain("NOT TAUGHT YET this month");
    expect(prompt).toMatch(/NOT TAUGHT YET this month:.*if and else/);
    expect(prompt).toMatch(/NOT TAUGHT YET this month:.*&& \|\| !/);
    expect(prompt).toContain("On screen but NOT yet theirs to write");
    expect(prompt).toContain("never ask them to produce it");
  });

  it("stops calling the frame untouchable once the learner owns it", () => {
    const late = promptAt("m1.l7.b4");
    expect(late).not.toContain("On screen but NOT yet theirs to write");
    expect(late).toMatch(/TAUGHT:.*the frame/);
  });

  it("permits explaining an untaught construct while forbidding solving with it", () => {
    /* Both halves of the rule, in the same prompt. A blanket ban would make
       Nova refuse "what is a loop?", which a curious fourteen-year-old is
       entitled to ask. */
    const prompt = promptAt("m1.l3.b1");
    expect(prompt).toContain("Explaining what a loop is, when");
    expect(prompt).toContain("asked, is allowed; solving this task with one is not");
    expect(prompt).toContain("A longer");
    expect(prompt).toContain("solution built from what they know is the CORRECT one");
  });

  it("carries every semantic trap at every rung and in both languages", () => {
    /* These change the ANSWER, not the syntax. A tutor carrying a Python
       instinct into a C++ explanation is confidently wrong about a number the
       learner can see on their own screen, and being wrong about `-7 / 2` is no
       less harmful at level 0 than at level 4. */
    for (const locale of ["kk", "ru"] as const) {
      for (const level of [0, 1, 2, 3, 4]) {
        const prompt = promptAt("m1.p8", level, locale);
        for (const trap of SEMANTIC_TRAPS) {
          expect(prompt, `${locale} L${level}: ${trap}`).toContain(trap);
        }
      }
    }
  });

  it("names the traps that actually differ from Python", () => {
    const traps = SEMANTIC_TRAPS.join(" ");
    expect(traps).toContain("7 / 2 is 3");
    expect(traps).toContain("-7 / 2 is -3 and -7 % 2 is -1");
    expect(traps).toContain("long long");
    expect(traps).toContain("undefined behaviour");
    expect(traps).toContain("there is no truthiness");
  });

  it("gives the vocabulary in the learner's own language, and the two differ", () => {
    /* C++ brings words the Python course never needed. A model left to invent
       them produces a calque — a Kazakh sentence built out of Russian technical
       nouns — so both columns are stated, and they must genuinely differ. */
    const kk = promptAt("m1.l3.b1", 2, "kk");
    const ru = promptAt("m1.l3.b1", 2, "ru");

    expect(kk).toContain("нүктелі үтір");
    expect(kk).toContain("айнымалы түрі");
    expect(kk).toContain("компилятор");
    expect(ru).toContain("точка с запятой");
    expect(ru).toContain("тип переменной");
    expect(ru).toContain("компилятор");

    // Not a translation of one list: neither locale carries the other's terms.
    expect(kk).not.toContain("точка с запятой");
    expect(ru).not.toContain("нүктелі үтір");
    expect(CPP17_TERMS.kk).not.toEqual(CPP17_TERMS.ru);
    expect(CPP17_TERMS.kk.length).toBe(CPP17_TERMS.ru.length);
  });

  it("still states the language when the position is unknown", () => {
    /* Degrade, never block. A block id outside the walk must not stop a
       fourteen-year-old getting help, and it must not stop Nova knowing which
       language the course is in — the second is what makes it answer a
       September arithmetic question in Python. */
    const without = buildSystemPrompt({ ...base, grant: grantAt(0) });
    expect(without).toContain(CPP17_PROMPT_HEADING);
    expect(without).toContain("C++17, procedural");
    expect(without).not.toContain("September, lesson");
    expect(without).toContain("You are Nova");
  });

  it("leaks no answer key through the sequence section", () => {
    /* The section is built from construct LABELS and constants, never from
       code. A regression that passed a task's own solution through here would
       put the answer to every task in the prompt. */
    const lines = cpp17PromptLines(cpp17PositionOf("m1.p1"), "kk").join("\n");
    expect(lines).not.toContain("cin >> a >> b >> c");
    expect(lines).not.toContain("referenceSolution");
  });
});

/* ========================================================================== */
/* The curriculum extractor, and why Nova is not currently reading it         */
/* ========================================================================== */

describe("the construct extractor speaks C++, and the gate lifted itself", () => {
  /* This block used to assert the opposite, and that was the point.
   *
   * While the extractor was still a Python token matcher, `prompt.ts` withheld
   * its output — and the withholding was DETECTED from the alphabet rather than
   * set by a boolean someone would have to remember to clear. The tripwire
   * below said so: "this assertion is what fails on that day, in the file whose
   * author needs to look."
   *
   * That day happened. The alphabet is C++ (107 constructs), the predicate went
   * false on its own, the capability block returned to Nova's prompt with no
   * edit to `prompt.ts`, and these tests are inverted to pin the new truth. The
   * old expectations are kept in the comments as the record of what was wrong,
   * because the specific false permissions are the reason any of this exists.
   */
  it("no longer speaks Python, so the gate is off without anyone clearing a flag", () => {
    const alphabet = new Set(CONSTRUCTS.map((c) => c.id));
    expect(alphabet.has("builtin.print"), "the Python alphabet is still present").toBe(false);
    expect(alphabet.has("stmt.elif"), "the Python alphabet is still present").toBe(false);
    expect(CAPABILITY_VOCABULARY_IS_PYTHON).toBe(false);
    /* And it is a real alphabet, not an empty one that would satisfy the above
       vacuously — the failure mode this whole file is about. */
    expect(alphabet.size).toBeGreaterThan(60);
    expect(alphabet.has("io.cout")).toBe(true);
  });

  it("reads the first program a learner ever sees correctly — the same evidence, inverted", () => {
    /* The three false permissions this file was written to document, now
       asserted absent. On `cout << "Сәлем!";`, the Python matcher reported:
         cmp.lt        — the `<<` of cout read as a comparison. September
                         teaches comparison at lesson 8; this offered it at 1.
         literal.dict  — the braces of `int main() { }` read as a set literal.
         stmt.return   — the frame's `return 0;`, which is GIVEN as scaffold and
                         not required of the learner for several lessons, read
                         as something they had been taught to write. */
    const firstEverProgram = '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Сәлем!";\n    return 0;\n}';
    const found = extractConstructs(firstEverProgram);
    for (const gone of ["cmp.lt", "cmp.gt", "cmp.chained", "literal.dict", "stmt.return"]) {
      expect(found.has(gone as never), `${gone} is still read out of C++ that does not contain it`).toBe(false);
    }
    /* What it SHOULD find, so this cannot pass by extracting nothing. */
    expect(found.has("io.cout"), "the one construct this program actually shows").toBe(true);

    /* And the harder case: a `<` that really is inside a string literal. */
    const withStringComparison = 'int main() { cout << "a < b" << endl; }';
    const s2 = extractConstructs(withStringComparison);
    expect(s2.has("cmp.lt"), "a < inside a string literal was read as an operator").toBe(false);
  });

  it("keeps that list out of the prompt for exactly as long as it is wrong", () => {
    const prompt = buildSystemPrompt({
      ...base,
      blockId: "m1.l1.b1",
      grant: grantAt(4),
      capability: capabilityFor("m1.l1.b1"),
    });

    /* Both directions, in one assertion, so the mitigation cannot outlive the
       problem and cannot be quietly dropped while the problem remains. */
    if (CAPABILITY_VOCABULARY_IS_PYTHON) {
      expect(prompt).not.toContain(CAPABILITY_PROMPT_HEADING);
      expect(prompt).not.toContain("chained comparison");
      expect(prompt).not.toContain("a dict or set");
      // And the thing that replaced it is present.
      expect(prompt).toContain(CPP17_PROMPT_HEADING);
    } else {
      expect(prompt).toContain(CAPABILITY_PROMPT_HEADING);
      expect(prompt).toContain("The TAUGHT list is closed");
    }
  });

  it("still accepts a capability context, so re-enabling it is one predicate", () => {
    /* The field is deliberately still plumbed through by the route. Nothing but
       the predicate above has to change on the day the extractor speaks C++. */
    const c = capabilityFor("m1.l1.b1");
    expect(c, "the extractor still resolves September blocks").not.toBeNull();
    expect(() =>
      buildSystemPrompt({ ...base, blockId: "m1.l1.b1", grant: grantAt(4), capability: c }),
    ).not.toThrow();
  });
});
