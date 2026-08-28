import { describe, it, expect } from "vitest";
import { grantHintLevel } from "@solvex/nova-core";
import { buildSystemPrompt } from "@schools/nova/prompt";
import {
  ARRIVES_LATER,
  CAPABILITY_PROMPT_HEADING,
  capabilityFor,
  capabilityPromptLines,
  extractConstructs,
  teachingOrder,
  untaughtConstructsIn,
  validateArrivalDeclarations,
  type CapabilityContext,
  type ConstructId,
} from "@schools/curriculum/capability";

/**
 * Which Python Nova is allowed to reach for.
 *
 * The defect: Nova was told the month, the lesson, the task and the task's
 * skills, and nothing about which constructs the learner has actually been
 * shown — so a level-4 hint on a September task could arrive as `abs()`, a
 * `for` loop or a list comprehension, all of which are correct Python and none
 * of which September teaches. Recorded open in
 * `docs/audits/SEPTEMBER_REMEDIATION_REPORT.md` §7 and §10.
 *
 * These tests are adversarial on purpose. The cheap way to make the feature
 * "work" is a hand-written list of September constructs, which would pass a
 * test that only checks the set is non-empty and would start lying the first
 * time the content changed. So the assertions below pin the set ITEM BY ITEM,
 * pin the things that must NOT be in it, and — the assertion a hardcoded list
 * cannot survive — require the set to GROW as the curriculum proceeds.
 */

/** A September task deep enough in the month to have met most of it. */
const LATE_SEPTEMBER = "m1.l7.b4";
/** The very first thing the learner ever sees. */
const FIRST_EVER = "m1.l1.b1";

function ctx(blockId: string): CapabilityContext {
  const c = capabilityFor(blockId);
  expect(c, `no capability context for ${blockId}`).not.toBeNull();
  return c!;
}

function ids(c: CapabilityContext): Set<string> {
  return new Set(c.available.map((s) => s.id));
}

describe("what September has actually taught", () => {
  it("contains every construct September's own programs are built from", () => {
    const available = ids(ctx(LATE_SEPTEMBER));

    /* Read this list against the month: `a, b = map(int, input().split())`,
       `print(n // k, n % k)`, `if b >= 85: ... elif ... else`, `x > 0 and
       x < 10`. Every entry is something a September program on screen contains,
       and nothing here is aspirational. */
    const expected: ConstructId[] = [
      "builtin.print",
      "builtin.input",
      "builtin.int",
      "builtin.map",
      "method.split",
      "stmt.assign",
      "stmt.assign_unpack",
      "op.add",
      "op.sub",
      "op.mul",
      "op.floordiv",
      "op.mod",
      "cmp.eq",
      "cmp.lt",
      "cmp.gt",
      "cmp.ge",
      "stmt.if",
      "stmt.elif",
      "stmt.else",
      "logic.and",
      "logic.or",
      "logic.not",
      "literal.int",
      "literal.str",
    ];
    for (const id of expected) {
      expect(available.has(id), `${id} should be available in September`).toBe(true);
    }
  });

  it("excludes loops, lists, functions, sorted() and comprehensions", () => {
    /* The five things the audit named, plus the two builtins that would wreck
       the tasks that exist to teach the long way round: `max()` would solve
       `m1.p1` (largest of three, taught with `if`) in one line. */
    const forbidden: ConstructId[] = [
      "stmt.for",
      "stmt.while",
      "builtin.range",
      "literal.list",
      "expr.subscript",
      "builtin.list",
      "builtin.len",
      "stmt.def",
      "stmt.return",
      "builtin.sorted",
      "method.sort",
      "expr.comprehension",
      "builtin.max",
      "builtin.min",
      "builtin.abs",
    ];

    /* Checked at the LAST block of the month, not the first. An empty set
       passes "excludes X" trivially; the end of September is the point at which
       availability is widest and the assertion is hardest. */
    const last = teachingOrder().filter((e) => e.monthIndex === 1).at(-1)!;
    const available = ids(ctx(last.block.id));

    for (const id of forbidden) {
      expect(available.has(id), `${id} must not be available anywhere in September`).toBe(false);
    }
  });

  it("names loops, lists and functions as arriving later, with the month", () => {
    const c = ctx(LATE_SEPTEMBER);
    const later = new Map(c.arrivesLater.map((a) => [a.spec.id, a.month]));

    /* The months come from `skills.ts`, which is derived from the programme
       PDF — not typed here a second time. October loops and lists, November
       functions, December sorting. */
    expect(later.get("stmt.for")).toBe(2);
    expect(later.get("literal.list")).toBe(2);
    expect(later.get("expr.comprehension")).toBe(2);
    expect(later.get("stmt.def")).toBe(3);
    expect(later.get("stmt.return")).toBe(3);
    expect(later.get("builtin.sorted")).toBe(4);
  });

  it("keeps every arrival declaration consistent with the curriculum", () => {
    /* The guard on the one hand-written thing in the module. It fails if a
       declaration names a skill that does not exist, has no justification, or
       claims a construct arrives in month N that the content already shows
       before month N. */
    expect(validateArrivalDeclarations()).toEqual([]);
    expect(ARRIVES_LATER.length).toBeGreaterThan(0);
    for (const d of ARRIVES_LATER) expect(d.why.trim().length).toBeGreaterThan(20);
  });
});

describe("the set is computed, not written down", () => {
  it("grows strictly as the curriculum proceeds", () => {
    /* THE test a hardcoded per-month list cannot pass. `m1.l1.b1` is
       `print("Сәлем!")` and two lines of arithmetic; by `m1.l7.b4` the learner
       has met input, int, map, split, //, %, if/elif/else and the boolean
       operators. A table keyed on "September" would return the same set for
       both. */
    const first = ids(ctx(FIRST_EVER));
    const late = ids(ctx(LATE_SEPTEMBER));

    expect(first.size).toBeLessThan(late.size);
    for (const id of first) {
      expect(late.has(id), `${id} was available and then stopped being`).toBe(true);
    }

    // And specifically: the first block cannot know about conditionals.
    expect(first.has("stmt.if")).toBe(false);
    expect(late.has("stmt.if")).toBe(true);
  });

  it("never shrinks, at any point in the whole programme", () => {
    let previous = new Set<string>();
    for (const entry of teachingOrder()) {
      const now = ids(ctx(entry.block.id));
      for (const id of previous) {
        expect(now.has(id), `${entry.block.id} lost ${id}`).toBe(true);
      }
      previous = now;
    }
  });

  it("introduces if/elif/else exactly where the curriculum does", () => {
    /* `if` first appears in `m1.l4.b1`; `elif` in `m1.l5.b1`, a lesson later.
       Derived: the block immediately before each must not have it. */
    const order = teachingOrder();
    const firstWith = (id: ConstructId) =>
      order.find((e) => ids(ctx(e.block.id)).has(id))!.block.id;

    expect(firstWith("stmt.if")).toBe("m1.l4.b1");
    expect(firstWith("stmt.elif")).toBe("m1.l5.b1");
    // The remainder operator lands in unit 2, before conditions.
    expect(firstWith("op.mod")).toBe("m1.l3.b1");
  });
});

describe("the extractor does not hallucinate", () => {
  it("reads nothing out of a comment", () => {
    /* `m1.l7.b1` is a concept block whose entire code field is a Kazakh
       comment. Without masking it would introduce `if` and `>=` a lesson early,
       from a line containing no Python at all. */
    expect([...extractConstructs("# if x >= 10  →  9, 10, 11 үшін тексер")]).toEqual([]);
  });

  it("reads nothing out of a string literal", () => {
    const found = extractConstructs('print("if x > 5 and y for z in w")');
    expect(found.has("stmt.if")).toBe(false);
    expect(found.has("stmt.for")).toBe(false);
    expect(found.has("logic.and")).toBe(false);
    expect(found.has("cmp.gt")).toBe(false);
    expect(found.has("builtin.print")).toBe(true);
    expect(found.has("literal.str")).toBe(true);
  });

  it("distinguishes <= from < and =", () => {
    const le = extractConstructs("if a <= b:\n    print(1)");
    expect(le.has("cmp.le")).toBe(true);
    expect(le.has("cmp.lt")).toBe(false);
    expect(le.has("stmt.assign")).toBe(false);
  });

  it("distinguishes a list literal from an index", () => {
    expect(extractConstructs("xs = [1, 2, 3]").has("literal.list")).toBe(true);
    expect(extractConstructs("xs = [1, 2, 3]").has("expr.subscript")).toBe(false);
    expect(extractConstructs("print(xs[0])").has("expr.subscript")).toBe(true);
    expect(extractConstructs("print(xs[0])").has("literal.list")).toBe(false);
    expect(extractConstructs("print(xs[1:3])").has("expr.slice")).toBe(true);
  });

  it("sees a comprehension even with a call nested inside it", () => {
    /* The most likely comprehension in this course is
       `[int(x) for x in input().split()]`, and a flat character-class regex
       stops at the inner `(` and misses it. */
    const found = extractConstructs("print(sum([int(x) for x in input().split()]))");
    expect(found.has("expr.comprehension")).toBe(true);
    expect(found.has("builtin.sum")).toBe(true);
  });

  it("does not call an if/else block a conditional expression", () => {
    const block = extractConstructs("if n > 0:\n    print(1)\nelse:\n    print(2)");
    expect(block.has("expr.ternary")).toBe(false);
    expect(extractConstructs("print(1 if n > 0 else 2)").has("expr.ternary")).toBe(true);
  });
});

describe("auditing a proposed solution against what was taught", () => {
  /* The runtime counterpart to the prompt constraints: the same extractor that
     decided what is available decides whether a snippet stays inside it, so the
     two cannot drift. */
  const p1 = ctx("m1.p1"); // largest of three numbers, taught with `if`

  it("flags a loop solution to a September task", () => {
    const flagged = untaughtConstructsIn(
      "n = int(input())\ntotal = 0\nfor i in range(n):\n    total += i\nprint(total)",
      p1,
    ).map((s) => s.id);
    expect(flagged).toContain("stmt.for");
    expect(flagged).toContain("builtin.range");
  });

  it("flags a list solution to a September task", () => {
    const flagged = untaughtConstructsIn(
      "xs = list(map(int, input().split()))\nprint(max(xs))",
      p1,
    ).map((s) => s.id);
    expect(flagged).toContain("builtin.list");
    expect(flagged).toContain("builtin.max");
  });

  it("flags a comprehension and a helper function", () => {
    expect(
      untaughtConstructsIn("print(sum([int(x) for x in input().split()]))", p1).map((s) => s.id),
    ).toContain("expr.comprehension");
    expect(
      untaughtConstructsIn("def big(a, b):\n    return a\nprint(big(1, 2))", p1).map((s) => s.id),
    ).toEqual(expect.arrayContaining(["stmt.def", "stmt.return"]));
  });

  it("passes the solution the curriculum actually intends", () => {
    expect(
      untaughtConstructsIn(
        "a, b, c = map(int, input().split())\nm = a\nif b > m:\n    m = b\nif c > m:\n    m = c\nprint(m)",
        p1,
      ),
    ).toEqual([]);
  });
});

describe("tasks whose own solution outruns the month", () => {
  it("surfaces abs() on m1.p8 rather than hiding it", () => {
    /* A finding, not a feature. `m1.p8` (clock hands) is solved with `abs()`
       and a decimal literal, and September puts neither on screen — so either
       Nova is forbidden from giving the level-4 fix to a task whose fix needs
       them, or the gap is stated. It is stated. */
    const gap = ctx("m1.p8").taskGap.map((s) => s.id);
    expect(gap).toContain("builtin.abs");
    expect(gap).toContain("literal.float");
  });

  it("leaves almost every other task with no gap at all", () => {
    /* If this number starts climbing, September's tasks have drifted away from
       what September teaches, which is the thing worth being told about. */
    const withGap = teachingOrder()
      .filter((e) => e.monthIndex === 1)
      .filter((e) => ctx(e.block.id).taskGap.length > 0)
      .map((e) => e.block.id);
    expect(withGap.sort()).toEqual(
      ["m1.as.b1", "m1.l6.b3", "m1.l6.b3s", "m1.l8.b2", "m1.p8"].sort(),
    );
  });
});

describe("the system prompt carries the constraint", () => {
  const base = {
    locale: "kk" as const,
    monthTitle: "Қыркүйек",
    lessonTitle: "Шарттар",
    blockPrompt: "Ең үлкен санды шығар",
    skills: ["cond.if_elif_else"],
    directive: null,
  };

  const grantAt = (level: number) =>
    grantHintLevel({
      requested: level,
      lastGranted: level - 1,
      hasAttemptSinceLastHint: true,
      hasAttempted: true,
      directive: null,
      learnerOverride: false,
    });

  it("states what is taught and forbids solving with anything else", () => {
    const prompt = buildSystemPrompt({
      ...base,
      grant: grantAt(4),
      capability: ctx("m1.p1"),
    });

    expect(prompt).toContain(CAPABILITY_PROMPT_HEADING);
    expect(prompt).toContain("print()");
    expect(prompt).toContain("// (integer division)");
    expect(prompt).toContain("The TAUGHT list is closed");
    expect(prompt).toContain("Solve, fix, correct and demonstrate using the TAUGHT list ONLY");
    // The named shortcuts, with the month they actually arrive in.
    expect(prompt).toContain("for loop (month 2)");
    expect(prompt).toContain("def (defining a function) (month 3)");
  });

  it("permits explaining an advanced construct while forbidding solving with it", () => {
    /* Both halves of the rule, in the same prompt. A blanket ban would make
       Nova refuse to answer "what is a loop?", which is a question a curious
       fourteen-year-old is entitled to ask. */
    const prompt = buildSystemPrompt({ ...base, grant: grantAt(4), capability: ctx("m1.p1") });
    expect(prompt).toContain("If the learner ASKS what a loop, a list or a function is");
    expect(prompt).toContain("Explaining is allowed. Solving this task with it is not.");
  });

  it("withholds the task-specific exception below level 3", () => {
    /* `taskGap` names what THIS task needs. On `m1.p8` that is `abs()`, and
       handing the name over at level 1 skips four rungs of the ladder. */
    const low = buildSystemPrompt({ ...base, grant: grantAt(1), capability: ctx("m1.p8") });
    expect(low).not.toContain("EXCEPTION, this task only");
    expect(low).not.toContain("its intended solution also needs");
    /* `abs()` is still NAMED at level 1 — in the never-shown list, as something
       Nova may not use. That is the opposite claim from "this task needs it",
       and the difference is the whole point of the gate. */
    expect(low).toContain("NEVER SHOWN");

    const high = buildSystemPrompt({ ...base, grant: grantAt(4), capability: ctx("m1.p8") });
    expect(high).toContain("EXCEPTION, this task only");
    expect(high).toContain("its intended solution also needs abs()");
  });

  it("builds the prompt unchanged when no capability context is available", () => {
    /* Degrade, never block. A block id outside the teaching walk must not stop
       a fourteen-year-old getting help. */
    const without = buildSystemPrompt({ ...base, grant: grantAt(0), capability: null });
    expect(without).not.toContain(CAPABILITY_PROMPT_HEADING);
    expect(without).toContain("You are Nova");
  });

  it("leaks no answer key through the capability section", () => {
    /* The section is built from construct LABELS, never from code. A regression
       that passed a reference solution through here would put the answer to
       every task in the prompt. */
    const lines = capabilityPromptLines(ctx("m1.p1"), { includeTaskGap: true }).join("\n");
    expect(lines).not.toContain("input().split()");
    expect(lines).not.toContain("m = a");
  });
});
