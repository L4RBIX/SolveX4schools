import { describe, it, expect } from "vitest";
import { grantHintLevel } from "@solvex/nova-core";
import { MONTHS } from "@schools/curriculum/months";
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
  septemberArrivals,
  septemberTaughtBy,
} from "@schools/nova/cpp17";
import {
  frameBecomesTheirsAt,
  frameHandoverLesson,
  teachingOrder,
} from "@schools/curriculum/capability";

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

/** Where a September lesson sits in TEACHING order, read from the month. */
function lessonPosition(lessonId: string): number {
  const september = MONTHS.find((m) => m.index === 1)!;
  const ids = september.units.flatMap((u) => u.lessons).map((l) => l.id);
  const i = ids.indexOf(lessonId);
  expect(i, `${lessonId} must be taught in September`).toBeGreaterThanOrEqual(0);
  return i + 1;
}

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

describe("September's prerequisite graph, derived from the content", () => {
  const arrival = (id: string) => septemberArrivals().find((a) => a.construct.id === id);
  const taughtAt = (id: string) => arrival(id)?.firstShownAt;
  const requiredAt = (id: string) => arrival(id)?.requiredAt;

  it("puts every construct at the position the CONTENT puts it at", () => {
    /*
     * These numbers were transcribed by hand from the table in
     * `docs/cpp17/CPP17_PEDAGOGY.md`, and that table numbers lessons the way
     * the DOCUMENT does — l1 is 1, l4 is 4. The course is not taught in that
     * order: September's units were re-sequenced and the ids kept, so teaching
     * order is l1, l11, l2, l10, l3, l4, l5, l12, l6, l7, l8, l9.
     *
     * `cpp17PositionOf` returns the TEACHING position and the table was read
     * with document numbers, so on `m1.l4.b4` — the lesson that teaches `if`
     * and `else`, at teaching position 6 — `taughtAt: 9` made Nova say the
     * lesson's own topic was NOT TAUGHT YET, in the same prompt as a derived
     * TAUGHT list containing it. Eight of twelve positions contradicted.
     *
     * So the numbers are derived now, and these are what the curriculum's own
     * code actually shows. Seven of the fourteen moved. A change here is a
     * change to the CONTENT, and that is the point: the number cannot drift
     * from the month files any more, because it is read out of them.
     */
    /*
     * Written as LESSONS, not as numbers.
     *
     * The list below used to be twelve integers, and inserting September's two
     * beginner lessons at the front moved every one of them — failing this file
     * for a change that was entirely correct, which is a fixture pretending to
     * be a rule. What the rule actually says is "this construct is first shown
     * on THIS lesson", so that is what it says.
     */
    expect(taughtAt("out.cout")).toBe(lessonPosition("m1.l0"));
    expect(taughtAt("frame")).toBe(lessonPosition("m1.l0"));
    expect(taughtAt("out.expression")).toBe(lessonPosition("m1.l0"));
    expect(taughtAt("arith.basic")).toBe(lessonPosition("m1.l1"));
    /* The variables lesson: `int age = 14;` on screen before anything reads. */
    expect(taughtAt("var.int")).toBe(lessonPosition("m1.l13"));
    expect(taughtAt("in.cin")).toBe(lessonPosition("m1.l11"));
    expect(taughtAt("arith.int_div")).toBe(lessonPosition("m1.l10"));
    expect(taughtAt("var.long_long")).toBe(lessonPosition("m1.l10"));
    expect(taughtAt("cmp.operators")).toBe(lessonPosition("m1.l4"));
    expect(taughtAt("cond.if_else")).toBe(lessonPosition("m1.l4"));
    expect(taughtAt("cond.else_if")).toBe(lessonPosition("m1.l5"));
    expect(taughtAt("logic.ops")).toBe(lessonPosition("m1.l6"));
  });

  it("claims nothing about a construct the content never puts on screen", () => {
    /*
     * `double` is taught in September's PROSE — the word appears eleven times —
     * and in no `code` field anywhere in the nine months. The walk cannot see
     * it, so neither list may claim it: not "taught", which would invite Nova
     * to write it, and not "NOT TAUGHT YET" on the lesson that teaches it.
     *
     * This is a CONTENT gap, recorded here rather than papered over with a
     * declared number, which is how it stayed invisible the first time.
     */
    expect(taughtAt("var.double")).toBeNull();
    expect(taughtAt("arith.mixed")).toBeNull();
    for (let lesson = 1; lesson <= 12; lesson += 1) {
      const r = septemberTaughtBy(lesson);
      for (const list of [r.write, r.given, r.notYet]) {
        expect(list.map((c) => c.id)).not.toContain("var.double");
      }
    }
  });

  it("separates given from required, and only for the frame", () => {
    /* The distinction the whole month is built on, and the one thing a walk of
       the shown code cannot see: `#include <iostream>`, `int main()` and
       `return 0;` are on screen from the first lesson and are not the learner's
       to write until the seventh. */
    expect(requiredAt("frame")).toBe(lessonPosition("m1.l7"));
    for (const a of septemberArrivals()) {
      if (a.firstShownAt === null) continue;
      expect(
        a.requiredAt,
        `${a.construct.id} cannot be required before it is shown`,
      ).toBeGreaterThanOrEqual(a.firstShownAt);
      if (a.construct.id !== "frame") {
        expect(
          a.requiredAt,
          `${a.construct.id} is required once the whole of it has been shown`,
        ).toBe(a.fullyShownAt);
      }
    }
  });

  it("no longer opens a blank editor before the frame is handed over", () => {
    /*
     * This test used to pin a DISAGREEMENT.
     *
     * `frameBecomesTheirsAt()` derives a proxy from the content — the first
     * task whose hidden solution needs a frame construct the learner has not
     * been shown — and it landed on `m1.l10.b5`, three lessons before the
     * hand-over the pedagogy document described. The number Nova used was
     * transcribed from that document, and the gap between the two was recorded
     * here as a curriculum finding: `m1.l10.b5` wanted the starter its siblings
     * had.
     *
     * It has one. Every core code task before `m1.l7` now ships the frame, the
     * lesson announces the hand-over in its own words, and the number Nova uses
     * is read from the content instead of declared. So this test asserts the
     * finding is CLOSED, in both directions.
     */
    const handover = frameHandoverLesson();
    expect(handover, "the hand-over is the graduation lesson").toBe(lessonPosition("m1.l7"));
    expect(requiredAt("frame")).toBe(handover);

    /* And no task before it opens an empty editor. The derived proxy is a
       block ordinal over the whole programme, so it is compared as one: the
       first task that needs an unshown frame construct must not be earlier than
       the first block of the graduation lesson. */
    const order = teachingOrder();
    const firstOfHandover = order.findIndex((e) => e.lessonId === "m1.l7");
    expect(firstOfHandover, "m1.l7 must be in the teaching order").toBeGreaterThan(0);
    expect(frameBecomesTheirsAt()).toBeGreaterThanOrEqual(firstOfHandover);
  });

  it("teaches division twice, on int and then on double", () => {
    /* Not a duplicate entry to be tidied away. `7 / 2` is `3` and `7.0 / 2` is
       `3.5`; they are different operations wearing the same symbol, and a
       learner who meets that as a surprise has been failed by the sequence.
       The `double` half is the content gap above — the sequence declares it and
       the code never shows it. */
    expect(taughtAt("arith.int_div")).toBe(lessonPosition("m1.l10"));
    expect(SEPTEMBER_SEQUENCE.map((c) => c.id).indexOf("arith.int_div")).toBeLessThan(
      SEPTEMBER_SEQUENCE.map((c) => c.id).indexOf("var.double"),
    );
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

  it("has every construct the content SHOWS available by the last lesson", () => {
    /* Everything the walk can see is theirs by the end of the month, nothing is
       still withheld, and nothing is still on-screen-but-not-theirs.

       The count is against what the content shows rather than against the whole
       declared list, because two rows — `var.double` and `arith.mixed` — are
       taught in prose and never in a code field. Asserting fourteen here would
       be asserting the content gap away. */
    const visible = septemberArrivals().filter((a) => a.firstShownAt !== null);
    expect(visible.length, "the walk sees almost all of the month").toBeGreaterThanOrEqual(12);

    const last = septemberTaughtBy(12);
    expect(last.notYet).toEqual([]);
    expect(last.given).toEqual([]);
    expect(last.write).toHaveLength(visible.length);
  });

  it("never says a construct is both taught and not taught", () => {
    /*
     * THE assertion this whole change exists for.
     *
     * On `m1.l4.b4` — «if и else», teaching position 6 — the rendered prompt
     * carried "TAUGHT, use freely: … if, else, ==, >" and "NOT TAUGHT YET this
     * month: … if and else; …" in the same message, plus "if the only fix needs
     * something untaught, you have the wrong fix". Eight of September's twelve
     * positions contradicted themselves that way.
     *
     * Checked at every position, on all three lists, because the two that used
     * to disagree were built from different sources: one derived from the
     * content, one transcribed by hand. They are now one walk.
     */
    for (let lesson = 1; lesson <= 12; lesson += 1) {
      const { write, given, notYet } = septemberTaughtBy(lesson);
      const w = new Set(write.map((c) => c.id));
      const g = new Set(given.map((c) => c.id));
      for (const c of notYet) {
        expect(w.has(c.id), `lesson ${lesson}: ${c.id} is TAUGHT and NOT TAUGHT YET`).toBe(false);
        expect(g.has(c.id), `lesson ${lesson}: ${c.id} is on screen and NOT TAUGHT YET`).toBe(false);
      }
      for (const c of write) {
        expect(g.has(c.id), `lesson ${lesson}: ${c.id} is both theirs and not theirs`).toBe(false);
      }
    }
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

       Outside September ids and order coincide, and m4 pins that.

       The expected numbers are read from the month rather than written here:
       September gained two beginner lessons at the front and every one of them
       moved, which would have failed this file for a change that was entirely
       correct. What it checks is that the position is the ORDER and not the
       digits in the id, and that is what it now says. */
    expect(cpp17PositionOf("m1.l7.b4")).toEqual({ month: 1, lesson: lessonPosition("m1.l7"), kind: "lesson" });
    expect(cpp17PositionOf("m1.l11.b1")).toEqual({ month: 1, lesson: lessonPosition("m1.l11"), kind: "lesson" });
    expect(cpp17PositionOf("m1.l4.b1")).toEqual({ month: 1, lesson: lessonPosition("m1.l4"), kind: "lesson" });
    /* And the two that the id would get wrong are still wrong the same way. */
    expect(lessonPosition("m1.l11")).not.toBe(11);
    expect(lessonPosition("m1.l4")).not.toBe(4);
    expect(cpp17PositionOf("m4.l1.b8")).toEqual({ month: 4, lesson: 1, kind: "lesson" });
  });

  it("puts practice and the monthly check after the month's lessons", () => {
    /* A September practice task follows the twelve lessons, so it may
       legitimately use anything September taught. Treating it as lesson zero
       would have Nova refuse to mention `if` on a task about `if`. */
    const lastLesson = MONTHS.find((m) => m.index === 1)!.units.flatMap((u) => u.lessons).length;
    expect(cpp17PositionOf("m1.p8")).toEqual({ month: 1, lesson: lastLesson, kind: "practice" });
    expect(cpp17PositionOf("m1.as.b1")).toEqual({ month: 1, lesson: lastLesson, kind: "assessment" });
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
    /* `m1.l3` is «Целочисленное деление и остаток», taught well after its id
       suggests — see the position test above. They have met cout, arithmetic,
       int and cin; they have NOT met comparison, if, else if or the boolean
       operators, and the frame is on screen without being theirs to write.

       Both numbers are read from the month: the position and the length of
       September both moved when the beginner lessons were added, and a literal
       here would have made this assert the old month. */
    const prompt = promptAt("m1.l3.b1");
    const septemberLength = MONTHS.find((m) => m.index === 1)!.units.flatMap((u) => u.lessons).length;
    expect(prompt).toContain(`September, lesson ${lessonPosition("m1.l3")} of ${septemberLength}`);
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
  });

  it("does not state a false fact about C++ in the list whose job is facts", () => {
    /*
     * Four of these were wrong, and each was compiled before it was rewritten.
     * A list that exists to stop a tutor being confidently wrong cannot itself
     * be confidently wrong — a wrong entry here is a wrong sentence delivered
     * to a fourteen-year-old with the platform's authority behind it.
     *
     * Asserted as ABSENCE of the exact old phrasings, because that is what the
     * defect was. Each `not.toContain` names something measured false:
     */
    const traps = SEMANTIC_TRAPS.join(" ");

    /* `cin >> n` on text leaves n = 0 with failbit, not unchanged; on a
       too-large number it leaves INT_MAX. Measured on GCC and Clang. */
    expect(traps).not.toContain("leaves n unchanged");
    expect(traps).toContain("sets n to 0");

    /* `s + 5` does not compile; `s += 5` does, and appends the byte 5. */
    expect(traps).not.toContain("with std::string it does not compile at all");
    expect(traps).toContain("s += 5 appends the BYTE 5");

    /* `if (x)` on an int is a contextual conversion to bool and is ordinary
       C++. It is a house style rule and must be stated as one, or a tutor
       "corrects" working code. */
    expect(traps).not.toContain("there is no truthiness");
    expect(traps).toContain("legal C++");

    /* Signed overflow is undefined, not a defined wrap — at -O2 the compiler
       may assume it does not happen. The advice is unchanged; the mechanism
       was wrong, and the mechanism is what a tutor reasons from. */
    expect(traps).not.toContain("overflows SILENTLY");
    expect(traps).toContain("is UNDEFINED, not a wrap");
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

describe("teaching position is derived from the corpus, in every month", () => {
  /**
   * The generalisation of the September defect.
   *
   * SEVEN of the nine months have lesson ids that are not their teaching order
   * — only October and May happen to be sequential. `septemberTaughtBy` is
   * guarded by `month === 1`, so months 2–9 returned a wrong number nobody
   * read; that is a trap rather than a safety margin, and it is exactly how the
   * defect reached September in the first place.
   *
   * This asserts the property against the corpus rather than against a table,
   * so re-ordering a month cannot silently invalidate it.
   */
  it("agrees with the Month structure for every lesson in the programme", () => {
    const wrong: string[] = [];
    for (const month of MONTHS) {
      let n = 0;
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          n += 1;
          const got = cpp17PositionOf(`${lesson.id}.b1`);
          if (got?.lesson !== n) {
            wrong.push(`${lesson.id}: taught #${n}, reported #${got?.lesson}`);
          }
        }
      }
    }
    expect(wrong, `\n${wrong.join("\n")}\n`).toEqual([]);
  });

  it("finds months whose ids genuinely disagree with their order, so this is not vacuous", () => {
    /* If every month were sequential the test above would pass under the old
       id-parsing implementation too. It is not: this counts the months where
       the two genuinely differ, and there are seven. */
    let reordered = 0;
    for (const month of MONTHS) {
      const nums: number[] = [];
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          const m = /\.l(\d+)$/.exec(lesson.id);
          if (m) nums.push(Number(m[1]));
        }
      }
      const sorted = [...nums].sort((a, b) => a - b);
      if (JSON.stringify(nums) !== JSON.stringify(sorted)) reordered += 1;
    }
    expect(reordered, "no month reorders its lessons — the test above proves nothing").toBeGreaterThanOrEqual(6);
  });
});
