import { describe, expect, it } from "vitest";
import {
  CONSTRUCTS,
  extractConstructs,
  shownCode,
  teachingOrder,
} from "@schools/curriculum/capability";
import type { ConstructId } from "@schools/curriculum/capability";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * No task may need Python the learner has never been shown.
 *
 * ## The defect, and why every other gate missed it
 *
 * `m2.l7.b7` asks a learner to print a multiplication table. Its reference
 * solution used `str()`, `.append()` and `.join()`, and that block was the
 * **first appearance of all three anywhere in the programme** — `str()` was not
 * shown until two lessons later at `m2.l8.b2`, and `.append()` and `.join()`
 * not until `m3.l8.b8`, a month afterwards. A fourteen-year-old reached a graded
 * task needing three things nobody had introduced.
 *
 * Everything passed. `check-blocks` passed it because a construct BUDGET says
 * what a month is ALLOWED to use, not what it has TAUGHT, and October is
 * genuinely allowed all three. `curriculum:validate` does not read Python.
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
 */

const LABEL = new Map(CONSTRUCTS.map((c) => [c.id, c.label]));

/**
 * Code the learner reads in PROSE, not only in a code panel.
 *
 * `capability.ts` extracts from `code` fields, which is right for the question
 * it answers — what Python has the curriculum put on screen as a program. But a
 * concept body that says «`min(a)` тізімнің ең кіші элементін береді» has
 * introduced `min()` just as surely as a snippet would, and the whole of
 * December's announcement that `sorted`, `min`, `max` and `sum` have arrived is
 * written that way. Reading only `code` would call four correctly-taught
 * builtins untaught, and a check that cries wolf is one nobody runs.
 *
 * Only backticked spans count. Prose that says "the maximum" in Kazakh has not
 * shown anybody `max()`; prose that writes `max()` has.
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

/** The Python a block's ANSWER needs, which the learner never sees. */
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
 * There used to be a `SEPTEMBER_INHERITED` exemption here, holding `cmp.ne`,
 * `builtin.abs` and `literal.float` — three constructs September required
 * before anything showed them. It said they were "genuinely small" and left
 * them to whoever owned the month, and the reverse assertion below existed so
 * that closing one would fail this test and ask for the entry to be deleted.
 *
 * That is what happened, and a fourth turned up on the way. All four are now
 * shown before they are required:
 *
 *   `!=`            m1.l6.b1 — the lesson that already teaches and/or/not.
 *                   Needed by m1.l6.b3 AND m1.l6.b3s, i.e. every route, not
 *                   just support as the original note assumed.
 *   `<=`            m1.l6.b1 — needed by m1.l8.b2 and by `m1.as.b1`,
 *                   SEPTEMBER'S OWN MONTHLY CHECK. First written in October
 *                   until now: the month's check asked for an operator the
 *                   month never wrote.
 *   a float literal m1.l10.b1 — the lesson whose whole subject is int versus
 *                   float, which printed `3.5` in a comment and never wrote a
 *                   fraction. Nothing in the nine-month programme did.
 *   `abs()`         NOT taught. `m1.p8` now takes the absolute value with the
 *                   `if`/`else` its own skillRefs already name, because
 *                   September has no skill for `abs()` and adding one would
 *                   hand a shortcut to the month whose point is the long way
 *                   round. Verified identical on all 720 clock positions.
 *
 * So the exemption is gone rather than emptied. An empty set with a paragraph
 * about what used to be in it is an invitation to put something back.
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
