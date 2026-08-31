import { describe, expect, it } from "vitest";
import {
  CONSTRUCTS,
  capabilityFor,
  extractConstructs,
  frameBecomesTheirsAt,
  shownCode,
  teachingOrder,
  validateArrivalDeclarations,
} from "@schools/curriculum/capability";
import type { ConstructId } from "@schools/curriculum/capability";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * No task may need C++ the learner has never been shown.
 *
 * ## The defect, and why every other gate missed it
 *
 * `m2.l7.b7` asks a learner to print a multiplication table. In the Python
 * course this suite was written against, its reference solution used `str()`,
 * `.append()` and `.join()`, and that block was the **first appearance of all
 * three anywhere in the programme** — `str()` was not shown until two lessons
 * later at `m2.l8.b2`, and `.append()` and `.join()` not until `m3.l8.b8`, a
 * month afterwards. A fourteen-year-old reached a graded task needing three
 * things nobody had introduced.
 *
 * Everything passed. `check-blocks` passed it because a construct BUDGET says
 * what a month is ALLOWED to use, not what it has TAUGHT, and October is
 * genuinely allowed all three. `curriculum:validate` does not read code at all.
 * `content-execution.test.ts` ran the solution and it worked — it works
 * perfectly, that is the problem. `construct-context.test.ts` checks the
 * opposite direction: that nothing arrives EARLIER than its declaration.
 *
 * ## What this asserts
 *
 * The curriculum is walked in teaching order. A construct becomes **shown** the
 * first time it appears in code the learner can see — a `concept`, a
 * `worked_example`, a prediction's program, a trace, a `find_bug` (both halves),
 * a `fill_blank` filled in, a `modify_code`'s starting program, a `write_code`'s
 * starter. It becomes **required** the first time it appears in a reference
 * solution, which the learner never sees.
 *
 * Required strictly before shown is the defect. Required in the *same block*
 * that shows it is fine — a `modify_code` whose starting program already
 * contains the construct has introduced it by the time the answer needs it.
 *
 * ## Why this is a superset of "read the lesson"
 *
 * A human reviewer found this one by reading. They found it once, in one of
 * four months, and only because they were looking. The property is exact and
 * cheap, so it is checked for the whole year on every run.
 *
 * ## The extractor it depends on, which is now C++
 *
 * This suite is only as good as `extractConstructs`, and until the C++
 * migration that function was reading C++ source with a Python alphabet. It did
 * not fail quietly. On `m1.l1.b1` — the first program a fourteen-year-old ever
 * sees — it reported `<` and a chained comparison out of the `<<` in `cout <<`,
 * a dict-or-set literal out of the braces of `int main() { }`, and the frame's
 * own `return 0;` as the learner's `return`. So the extractor's own reading of
 * C++ is pinned below, adversarially, before anything is asserted about the
 * curriculum: a suite built on a scanner that invents constructs would be
 * asserting a fiction in both directions at once.
 */

const LABEL = new Map(CONSTRUCTS.map((c) => [c.id, c.label]));

/**
 * Code the learner reads in PROSE, not only in a code panel.
 *
 * `capability.ts` extracts from `code` fields, which is right for the question
 * it answers — what code the curriculum has put on screen as a program. But a
 * concept body that says «`max(a, b)` екеуінің үлкенін қайтарады» has
 * introduced `max()` just as surely as a snippet would, and a good deal of the
 * course announces a new construct in exactly that shape — `double` is taught
 * in September's own prose and never declared in any program the learner is
 * shown. Reading only `code` would call correctly-taught constructs untaught,
 * and a check that cries wolf is one nobody runs.
 *
 * Only backticked spans count. Prose that says "the maximum" in Kazakh has not
 * shown anybody `max()`; prose that writes `max()` has. That rule has teeth:
 * `m1.l1.b5` asks for the value of `7 * 8` in plain prose with no backticks,
 * and is therefore reported below as requiring a `*` the course has not shown
 * — see the failure list, which is a finding about the content rather than
 * about this rule.
 */
function inlineCode(block: LessonBlock): string[] {
  const text: string[] = [];
  const push = (v: unknown) => {
    if (v && typeof v === "object" && "kk" in (v as object)) {
      const l = v as { kk?: string; ru?: string };
      if (l.kk) text.push(l.kk);
      if (l.ru) text.push(l.ru);
    }
  };
  const any = block as unknown as Record<string, unknown>;
  push(any.body);
  push(any.title);
  push(any.prompt);
  push(any.problem);
  for (const key of ["steps", "expectedPoints"]) {
    const v = any[key];
    if (Array.isArray(v)) for (const s of v) push(s);
  }
  const spans: string[] = [];
  for (const t of text) {
    for (const m of t.matchAll(/`([^`\n]{1,80})`/g)) spans.push(m[1]);
  }
  return spans;
}

/** The C++ a block's ANSWER needs, which the learner never sees. */
function requiredCode(block: LessonBlock): string[] {
  switch (block.type) {
    case "write_code":
    case "modify_code":
    case "challenge":
      return [block.referenceSolution];
    case "find_bug":
      return [block.fixedCode];
    case "verify":
      return block.referenceSolution ? [block.referenceSolution] : [];
    default:
      return [];
  }
}

interface FirstUse {
  construct: ConstructId;
  blockId: string;
  monthIndex: number;
  lessonId: string;
  ordinal: number;
}

/*
 * There is no exemption list here, and there is not going to be one.
 *
 * There used to be a `SEPTEMBER_INHERITED` set holding three constructs the
 * month required before anything showed them. It was deleted rather than
 * emptied when the content closed them, because an empty set with a paragraph
 * about what used to be in it is an invitation to put something back.
 *
 * The same rule applies to what the C++ migration turned up. Re-derived against
 * the migrated content, the two Python-era failures this file used to carry —
 * `or` at `m5.p5` and `abs()` at `m5.p8` — are gone, and four findings replace
 * them. All four are CONTENT defects with content fixes, and none of them is
 * this suite being too strict:
 *
 *   `*`             required by `m1.l1.b5`, first shown at `m1.l2.b1b`. The
 *                   task's prompt does write `7 * 8`, but in plain prose
 *                   without backticks, and the pedagogy document puts `+ - *`
 *                   at the SECOND lesson. Backtick it, or move the task.
 *   `(int)x`        required by `m2.l5.b7`, first shown at `m5.l6.b1`. An
 *                   October reference solution averages with `(double)s / n`
 *                   and the cast is not shown until January.
 *   `abs()`         required by `m6.p1`, first shown at `m9.l3.b7s`. The same
 *                   defect the Python course had at `m5.p8`, carried across
 *                   into February practice with `<cstdlib>` included.
 *   `bits/stdc++.h` required by `m9.l1.b7`, first shown at `m9.l1.b8s` — one
 *                   block later in the same lesson. Swap the order.
 *
 * Fixing any of them is a one-line edit to a month file, and until then this
 * suite says so out loud rather than carrying a list that makes it quiet.
 */

const shownAt = new Map<ConstructId, FirstUse>();
const requiredAt = new Map<ConstructId, FirstUse>();

for (const entry of teachingOrder()) {
  const where = {
    blockId: entry.block.id,
    monthIndex: entry.monthIndex,
    lessonId: entry.lessonId,
    ordinal: entry.ordinal,
  };
  for (const code of [...shownCode(entry.block), ...inlineCode(entry.block)]) {
    for (const c of extractConstructs(code)) {
      if (!shownAt.has(c)) shownAt.set(c, { construct: c, ...where });
    }
  }
  for (const code of requiredCode(entry.block)) {
    for (const c of extractConstructs(code)) {
      if (!requiredAt.has(c)) requiredAt.set(c, { construct: c, ...where });
    }
  }
}

/* ========================================================================== */
/* The extractor reads C++, and the four things that means                    */
/* ========================================================================== */

/** The first program the course ever shows, verbatim from `m1.l1.b1`. */
const FIRST_PROGRAM =
  '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Сәлем!";\n    cout << 2 + 2;\n    return 0;\n}';

describe("the extractor reads C++, not Python", () => {
  it("reads cout << as output and NEVER as a comparison — the headline case", () => {
    /* THE test. `cout << "a < b" << endl;` has three traps in one line and the
       Python scanner fell into all of them: the `<<` scanned as two `<`, the
       two of them together scanned as a chained comparison, and the `<` inside
       the STRING scanned as a third. September teaches comparison at lesson
       eight; this line is lesson one.

       Reporting a comparison here is not a stale answer, it is a specific false
       permission handed to a tutor in the section of the prompt whose whole job
       is to withhold it. That is the difference between this module helping and
       actively lying, so it is asserted directly rather than inferred from a
       curriculum walk. */
    const found = extractConstructs('cout << "a < b" << endl;');

    expect([...found].sort()).toEqual(["io.cout", "io.endl", "literal.str"]);
    expect(found.has("cmp.lt"), "the << of cout is not a comparison").toBe(false);
    expect(found.has("cmp.gt")).toBe(false);
    expect(found.has("cmp.chained"), "two << are not a chained comparison").toBe(false);
    expect(found.has("cmp.le"), "the < inside the string is not an operator").toBe(false);
  });

  it("reads cin >> as input, and a nested template's >> as neither", () => {
    expect([...extractConstructs("cin >> a >> b;")].sort()).toEqual(["io.cin"]);
    /* `vector<vector<int>>` ends in the same two characters as `cin >>`. The
       template argument lists are matched and neutralised before any operator
       is read, so the grid declaration reports a grid. */
    const grid = extractConstructs("vector<vector<int>> g(n, vector<int>(m, 0));");
    expect(grid.has("cont.vector")).toBe(true);
    expect(grid.has("cont.vector_2d")).toBe(true);
    expect(grid.has("io.cin"), "the >> closing two templates is not input").toBe(false);
    expect(grid.has("cmp.lt")).toBe(false);
    expect(grid.has("cmp.gt")).toBe(false);
    expect(grid.has("cmp.chained")).toBe(false);
  });

  it("still reads a real comparison as a comparison", () => {
    /* The other direction, in the same file, so the fix above cannot be "stop
       reporting comparisons". */
    expect(extractConstructs("if (a < b) x = 1;").has("cmp.lt")).toBe(true);
    expect(extractConstructs("for (int i = 0; i < n; i++) s += i;").has("cmp.lt")).toBe(true);
    expect(extractConstructs("if (a <= b) x = 1;").has("cmp.le")).toBe(true);
    // `<=` is one token, not `<` and `=`, or it invents an assignment too.
    expect(extractConstructs("if (a <= b) ;").has("cmp.lt")).toBe(false);
    expect(extractConstructs("if (a <= b) ;").has("stmt.assign")).toBe(false);
    // And the chained form, which is legal C++ that means the wrong thing.
    expect(extractConstructs("if (10 <= x <= 20) ;").has("cmp.chained")).toBe(true);
  });

  it("keeps the angle brackets of an #include out of the comparison scan", () => {
    const found = extractConstructs("#include <iostream>\n#include <bits/stdc++.h>\n");
    expect(found.has("frame.include")).toBe(true);
    expect(found.has("lib.bits_stdc")).toBe(true);
    expect(found.has("cmp.lt")).toBe(false);
    expect(found.has("cmp.gt")).toBe(false);
  });

  it("treats braces as blocks, and only a brace-init as a literal", () => {
    /* `int main() { }` reported "a dict or set" for as long as the alphabet was
       Python's. In C++ a `{` after `)` opens a body. A `{` after `=` builds a
       value, and that IS a construct — a different one. */
    expect(extractConstructs("int main() {\n    return 0;\n}").has("expr.brace_init")).toBe(false);
    expect(extractConstructs("if (a) { b = 1; }").has("expr.brace_init")).toBe(false);
    expect(extractConstructs("vector<int> a = {1, 2, 3};").has("expr.brace_init")).toBe(true);
  });

  it("strips comments and literals before anything is read out of them", () => {
    /* A concept body whose only content is a Kazakh comment must not introduce
       a conditional, and a program that PRINTS the text of a comparison must
       not report one. Both spellings of a C++ comment, because `//` was floor
       division to the scanner this replaced. */
    expect([...extractConstructs("// егер a > b болса, a-ны шығар\n")]).toEqual([]);
    expect([...extractConstructs("/* if (a > b) return a; */\n")]).toEqual([]);
    expect(extractConstructs("int x = 1; // a / b\n").has("op.div")).toBe(false);
    const printed = extractConstructs('cout << "if (a > b) cout << a;";');
    expect([...printed].sort()).toEqual(["io.cout", "literal.str"]);
    // A char literal is not the start of a string, and does not swallow the line.
    const ch = extractConstructs("if (c == 'a') n = n + 1;");
    expect(ch.has("literal.char")).toBe(true);
    expect(ch.has("cmp.eq")).toBe(true);
    expect(ch.has("op.add")).toBe(true);
  });

  it("tells else if from else, and reports both when both are there", () => {
    const elseIf = extractConstructs("if (a) ; else if (b) ; else ;");
    expect(elseIf.has("stmt.if")).toBe(true);
    expect(elseIf.has("stmt.else_if")).toBe(true);
    expect(elseIf.has("stmt.else")).toBe(true);
    const plain = extractConstructs("if (a) ; else ;");
    expect(plain.has("stmt.else_if"), "a plain else is not an else if").toBe(false);
    expect(plain.has("stmt.else")).toBe(true);
  });

  it("tells a range-for from a classic for", () => {
    const range = extractConstructs("for (int x : a) s = s + x;");
    expect(range.has("expr.range_for")).toBe(true);
    expect(range.has("stmt.for")).toBe(true);
    const classic = extractConstructs("for (int i = 0; i < n; i++) s = s + i;");
    expect(classic.has("stmt.for")).toBe(true);
    expect(classic.has("expr.range_for")).toBe(false);
    /* `auto` is permitted as a range-for's loop variable and nowhere else in
       year one, so the two readings are kept apart. */
    expect(extractConstructs("for (auto x : a) ;").has("type.auto")).toBe(false);
    expect(extractConstructs("auto n = a.size();").has("type.auto")).toBe(true);
  });
});

/* ========================================================================== */
/* The frame is GIVEN, not taught                                             */
/* ========================================================================== */

describe("the frame is given as scaffold and is not the learner's yet", () => {
  it("reports main's return as the frame's, and a function's as their own", () => {
    /* The third false permission the Python alphabet produced: `return 0;` sits
       in every starter from lesson one, and reporting it as `return` told Nova
       a week-one learner could be asked for one. */
    const frame = extractConstructs(FIRST_PROGRAM);
    expect(frame.has("frame.return")).toBe(true);
    expect(frame.has("func.return"), "the frame's return is not theirs").toBe(false);

    const own = extractConstructs("int twice(int x) {\n    return x * 2;\n}");
    expect(own.has("func.define")).toBe(true);
    expect(own.has("func.return")).toBe(true);
    expect(own.has("frame.return")).toBe(false);
  });

  it("does not read int main() as a function the learner defined, or as a type", () => {
    const frame = extractConstructs(FIRST_PROGRAM);
    expect(frame.has("frame.main")).toBe(true);
    expect(frame.has("func.define"), "main is given, not written").toBe(false);
    /* The `int` of `int main()` is the frame's, not a declared type. September
       does not teach `int` until the lesson that reads input. */
    expect(extractConstructs("int main() {\n    return 0;\n}").has("type.int")).toBe(false);
    expect(extractConstructs("int main() {\n    int n;\n    cin >> n;\n    return 0;\n}").has("type.int")).toBe(true);
  });

  it("reports the whole frame and nothing else for the four ceremony lines", () => {
    /* Every construct in the empty frame must be a scaffold one. A frame that
       leaks a single construct is a frame that will leak another the next time
       somebody edits a starter — the `0` of `return 0;` was the last one. */
    const empty = extractConstructs(
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
    );
    expect([...empty].sort()).toEqual([
      "frame.include",
      "frame.main",
      "frame.return",
      "frame.using_namespace",
    ]);
  });

  it("holds the frame out of the taught set until the course asks for it", () => {
    /* `available` is what a hint may use freely. At `m1.l1.b1` the frame is on
       screen and is NOT on that list; it is reported separately so Nova can
       point at it and explain it without ever asking a fourteen-year-old in
       week one to produce it. */
    const first = capabilityFor("m1.l1.b1");
    expect(first).not.toBeNull();
    const scaffold = first!.givenAsScaffold.map((s) => s.id).sort();
    expect(scaffold).toEqual([
      "frame.include",
      "frame.main",
      "frame.return",
      "frame.using_namespace",
    ]);
    for (const id of scaffold) {
      expect(first!.available.map((s) => s.id)).not.toContain(id);
    }

    /* And the three false permissions the Python alphabet produced are gone
       from the same block. Pinned by NAME rather than by count, because the
       count would pass against any alphabet at all. */
    const available = new Set(first!.available.map((s) => s.id));
    expect(available.has("cmp.lt")).toBe(false);
    expect(available.has("cmp.chained")).toBe(false);
    expect(available.has("func.return")).toBe(false);
    expect(available.has("expr.brace_init")).toBe(false);
    // What lesson one DOES teach: printing, a string, and the arithmetic in b1.
    expect(available.has("io.cout")).toBe(true);
    expect(available.has("literal.str")).toBe(true);
  });

  it("hands the frame over exactly once, and never takes it back", () => {
    const at = frameBecomesTheirsAt();
    const order = teachingOrder();
    expect(at, "the course must ask for the frame somewhere").toBeLessThan(order.length);

    /* Monotonic. `available` is a running set, so a construct that has become
       theirs cannot stop being theirs — and the block where the hand-over
       happens is a `write_code` with no starter, i.e. an empty editor. */
    let handedOver = false;
    for (const entry of order) {
      const ctx = capabilityFor(entry.block.id);
      if (!ctx) continue;
      const scaffoldNow = ctx.givenAsScaffold.length > 0;
      if (!scaffoldNow) handedOver = true;
      if (handedOver) {
        expect(scaffoldNow, `${entry.block.id} put the frame back into scaffold`).toBe(false);
      }
    }
    expect(handedOver, "the frame never became the learner's").toBe(true);
  });
});

/* ========================================================================== */
/* What is declared rather than derived                                       */
/* ========================================================================== */

describe("the arrival declarations", () => {
  it("contradict nothing the curriculum shows", () => {
    /* The check that makes a hand-maintained table survivable: a construct
       declared to arrive in month N that the content already shows in month N-1
       is Nova being told the learner has not met something they have been
       staring at for a month. */
    expect(validateArrivalDeclarations()).toEqual([]);
  });

  it("says when a construct arrives without anybody writing the month down", () => {
    /* The months are read off the tree now that all nine are authored, which is
       why the declaration list is empty. `for` is October's subject and the
       walk finds it there; `sort()` is December's and the walk finds it there.
       A table saying so would agree on the day it was typed. */
    const september = capabilityFor("m1.l1.b1");
    expect(september).not.toBeNull();
    const arrival = (id: string) =>
      september!.arrivesLater.find((a) => a.spec.id === id)?.month;
    expect(arrival("stmt.for")).toBe(2);
    expect(arrival("stmt.while")).toBe(2);
    expect(arrival("cont.vector")).toBe(2);
    expect(arrival("func.define")).toBe(3);
    expect(arrival("lib.sort")).toBe(4);
    expect(arrival("func.recursion")).toBe(6);
  });

  it("keeps year one's exclusions out of every month", () => {
    /* `docs/cpp17/CPP17_PEDAGOGY.md` rules these out for the whole year, not
       for a while. If any of them ever turns up in shown code, it stops being
       in `neverShown` and this fails — which is the point. */
    const last = capabilityFor(teachingOrder()[teachingOrder().length - 1].block.id);
    expect(last).not.toBeNull();
    const never = new Set(last!.neverShown.map((s) => s.id));
    for (const id of ["excl.class", "excl.template", "excl.new_delete", "excl.pointer", "excl.lambda"]) {
      expect(never.has(id), `${id} must never be shown in year one`).toBe(true);
    }
  });
});

describe("every construct a task needs has been shown to the learner first", () => {
  it("has content to check", () => {
    // Guards the guard: an empty programme would make the assertion vacuous.
    expect(shownAt.size).toBeGreaterThan(20);
    expect(requiredAt.size).toBeGreaterThan(10);
  });

  it("introduces nothing for the first time inside an answer", () => {
    const unshown: string[] = [];
    const late: string[] = [];

    for (const [construct, required] of requiredAt) {
      const shown = shownAt.get(construct);
      if (!shown) {
        unshown.push(
          `${LABEL.get(construct) ?? construct} is required by ${required.blockId} ` +
            `(${required.lessonId}, month ${required.monthIndex}) and is never shown to a learner anywhere`,
        );
        continue;
      }
      /* Strictly before. Equal ordinals mean the same block both shows and
         needs it, which is how `modify_code` legitimately works. */
      if (shown.ordinal > required.ordinal) {
        late.push(
          `${LABEL.get(construct) ?? construct} is first REQUIRED at ${required.blockId} ` +
            `(${required.lessonId}, month ${required.monthIndex}) but first SHOWN at ` +
            `${shown.blockId} (${shown.lessonId}, month ${shown.monthIndex}) — the learner ` +
            `meets it as an answer before they meet it as an example`,
        );
      }
    }

    expect(
      [...unshown, ...late],
      `\n${[...unshown, ...late].map((l) => `  · ${l}`).join("\n")}\n`,
    ).toEqual([]);

  });
});
