import { describe, it, expect } from "vitest";
import { MONTH_01_SEPTEMBER } from "@schools/curriculum/months/month-01-september";
import { blocksForTrack, publicAssessment, publicLesson } from "@schools/curriculum/public";
import type { Lesson, TrackLevel } from "@schools/curriculum/types";

/**
 * Differentiation, asserted on block ids rather than on intent.
 *
 * ## What this is guarding against
 *
 * `tracks` was declared on five September blocks and read by ZERO lines of
 * runtime code. `grep` for `.tracks` across `schools/`, `src/` and `packages/`
 * returned no runtime hits and `school-lesson.tsx` was literally
 * `const blocks = lesson.blocks`, so Қолдау, Негізгі and Тереңдетілген all
 * received byte-identical sequences. The three routes a school pays for were a
 * field in a content file.
 *
 * A test that asserted "the filter function filters" would not have caught
 * that, because the filter function was never wrong — it was never called. So
 * everything here goes through the projection the browser is actually served
 * (`publicLesson` / `publicAssessment`), and asserts the exact ids that come
 * out the other side. If someone deletes the `track` argument, or the page
 * stops passing one, or a `tracks` array is dropped from a block, the ids
 * change and this fails.
 *
 * ## Why the track strings are literals here
 *
 * `schools/learning/track.ts` is `server-only` — it reads cookies — and
 * importing it into a node test would mean stubbing the very module whose job
 * is to fail a client build. The projection takes a plain string, so the three
 * values are written out. `TrackLevel` still types them, so a fourth level
 * added to the union without being added here is a compile error, not a silent
 * gap.
 */

const TRACKS = ["support", "core", "advanced"] as const satisfies readonly TrackLevel[];

const SEPTEMBER = MONTH_01_SEPTEMBER;
const LESSONS: Lesson[] = SEPTEMBER.units.flatMap((u) => u.lessons);

/** Every block id this track receives from one lesson, in delivery order. */
function idsFor(lesson: Lesson, track: TrackLevel): string[] {
  return publicLesson(lesson, track).blocks.map((b) => b.id);
}

/** The whole month as one flat sequence — what a learner works through. */
function monthIds(track: TrackLevel): string[] {
  return LESSONS.flatMap((l) => idsFor(l, track));
}

/** Which tracks receive a given block id, across the whole month. */
function tracksReceiving(blockId: string): TrackLevel[] {
  return TRACKS.filter((t) => monthIds(t).includes(blockId));
}

describe("September delivers three different sequences", () => {
  it("has lessons to differentiate at all", () => {
    // Guards the guard: an empty month would make every assertion below pass.
    expect(LESSONS.length).toBeGreaterThan(0);
    expect(monthIds("core").length).toBeGreaterThan(20);
  });

  it("gives no two tracks the same month", () => {
    const support = monthIds("support");
    const core = monthIds("core");
    const advanced = monthIds("advanced");

    expect(support).not.toEqual(core);
    expect(core).not.toEqual(advanced);
    expect(support).not.toEqual(advanced);
  });

  it("substitutes rather than subtracts: support meets every idea, scaffolded", () => {
    /* Differentiation used to be purely subtractive — harder blocks withheld,
       nothing added — and that is exactly what the programme rules out: support
       is «дайын кодты құрастыру мен толықтыру КӨБІРЕК, нөлден жазу АЗЫРАҚ», not
       a shorter month. So four blank-editor tasks now have a support-only
       scaffolded twin, and the two sets are no longer nested.
       The invariant that replaces nesting: every task withheld from support is
       either a genuinely harder problem (the `m1.l8` challenges, the advanced
       practice) or has a support substitute covering the SAME problem. */
    const support = new Set(monthIds("support"));
    const advanced = new Set(monthIds("advanced"));

    const withheldFromSupport = [...advanced].filter((id) => !support.has(id));
    const supportOnly = [...support].filter((id) => !advanced.has(id));

    // Every support-only block is a scaffolded twin, named `<id>s`.
    for (const id of supportOnly) {
      expect(id.endsWith("s"), `${id} is support-only but is not a substitution`).toBe(true);
      expect(
        advanced.has(id.slice(0, -1)),
        `${id} substitutes for ${id.slice(0, -1)}, which no other track has`,
      ).toBe(true);
    }
    expect(supportOnly.length).toBeGreaterThan(0);

    // Everything withheld is either substituted, or a deliberately harder task.
    /* `m1.l8.b1` is no longer here: it gained the support twin `m1.l8.b1s` that
       the lesson should have had from the start, so it is substituted like
       everything else and needs no exemption.

       `m1.l8.b3` is here for a different reason from the rest. It is not a
       harder TASK — it is an explanation whose subject is `m1.l8.b2`, and a
       block cannot be offered to a route that cannot reach the thing it is
       about. It was withheld from nobody before this, which is how a core
       learner came to be asked why the wardrobe needed both orientations in a
       lesson where they had only seen the day-of-week problem. */
    const HARDER = new Set(["m1.l8.b2", "m1.l8.b3", "m1.p6", "m1.p7", "m1.p8"]);
    for (const id of withheldFromSupport) {
      const substituted = support.has(`${id}s`);
      expect(
        substituted || HARDER.has(id),
        `${id} vanished from the support route with no substitute and no reason`,
      ).toBe(true);
    }

    expect(support.size).toBeLessThan(advanced.size);
  });

  it("differentiates inside lessons, not by hiding whole lessons", () => {
    // Every track opens every lesson. A route that silently removed a lesson
    // from a learner's month would break the board, which links all of them.
    for (const track of TRACKS) {
      for (const lesson of LESSONS) {
        expect(idsFor(lesson, track).length, `${lesson.id} @ ${track}`).toBeGreaterThan(0);
      }
    }

    // …and exactly two of the nine actually differ. Named, so that a content
    // change which quietly flattens the month fails here rather than passing
    // as "still technically different somewhere".
    const differing = LESSONS.filter(
      (l) => idsFor(l, "support").join() !== idsFor(l, "advanced").join(),
    ).map((l) => l.id);
    /* Six of the twelve lessons now differ: four carry a scaffolded
       substitution for support, and two withhold genuinely harder problems.
       Named, so that a content change which quietly flattens the month fails
       here rather than passing as "still technically different somewhere". */
    expect(differing).toEqual(["m1.l2", "m1.l5", "m1.l6", "m1.l7", "m1.l8", "m1.l9"]);
  });
});

describe("the specific exclusions the curriculum declares", () => {
  /* Asserted by id, one per declared `tracks` array in
     `schools/curriculum/months/month-01-september.ts`. These ids ARE the
     differentiation; a test on counts alone would pass if the wrong five
     blocks were withheld. */

  it("withholds the day-of-week challenge from support", () => {
    expect(tracksReceiving("m1.l8.b1")).toEqual(["core", "advanced"]);
  });

  it("reserves the wardrobe-through-the-doorway challenge for advanced", () => {
    expect(tracksReceiving("m1.l8.b2")).toEqual(["advanced"]);
  });

  it("withholds the two harder practice tasks from support", () => {
    expect(tracksReceiving("m1.p6")).toEqual(["core", "advanced"]);
    expect(tracksReceiving("m1.p7")).toEqual(["core", "advanced"]);
  });

  it("reserves the clock-angle practice task for advanced", () => {
    expect(tracksReceiving("m1.p8")).toEqual(["advanced"]);
  });

  it("pairs each support substitution with the task it replaces", () => {
    /* The four scaffolded twins, by id. A substitution that loses its partner
       would silently give support learners a shorter month. */
    for (const [scaffolded, blank] of [
      ["m1.l2.b3s", "m1.l2.b3"],
      ["m1.l5.b3s", "m1.l5.b3"],
      ["m1.l6.b3s", "m1.l6.b3"],
      ["m1.l7.b4s", "m1.l7.b4"],
    ] as const) {
      expect(tracksReceiving(scaffolded)).toEqual(["support"]);
      expect(tracksReceiving(blank)).toEqual(["core", "advanced"]);
    }
  });

  it("leaves every other block on all three routes", () => {
    /* The complement. If a further block acquires a `tracks` array, this fails
       and someone has to decide deliberately whether a support learner should
       lose it — rather than finding out from a class. */
    const restricted = new Set([
      "m1.l8.b1", "m1.l8.b2", "m1.p6", "m1.p7", "m1.p8",
      "m1.l2.b3", "m1.l5.b3", "m1.l6.b3", "m1.l7.b4",
      /* `m1.l8.b3` asks about `m1.l8.b2`, which is advanced-only, so it is too.
         It carried no `tracks` at all and therefore rendered everywhere — the
         one block in September restricted by its SUBJECT rather than by its
         difficulty. */
      "m1.l8.b3",
    ]);
    const substitutions = new Set([
      "m1.l2.b3s", "m1.l5.b3s", "m1.l6.b3s", "m1.l7.b4s",
      /* The twin `m1.l8` never had. Every other September lesson that scopes a
         block pairs it with one; this lesson scoped two and paired neither, and
         the unscoped `b3` was standing in for the missing support path. */
      "m1.l8.b1s",
    ]);
    const shared = monthIds("advanced").filter((id) => !restricted.has(id));
    expect(monthIds("support").filter((id) => !substitutions.has(id))).toEqual(shared);
  });
});

describe("support is a lighter load, not a relabelled identical one", () => {
  /** A task that hands the learner an empty editor and nothing else. */
  function blankEditorTasks(track: TrackLevel): string[] {
    return LESSONS.flatMap((l) => publicLesson(l, track).blocks)
      .filter((b) => b.type === "write_code" || b.type === "challenge")
      .map((b) => b.id);
  }

  it("gives support MORE assembly and completion than core — the programme's actual rule", () => {
    /* The rule the audit found broken is not "support gets less". It is
       «дайын кодты құрастыру мен толықтыру көбірек» — support gets MORE
       assembling and completing. Before the substitutions this count was
       identical (3) on all three routes, which is how "core minus five
       problems" passed for differentiation. */
    const assembly = (track: TrackLevel) =>
      LESSONS.flatMap((l) => publicLesson(l, track).blocks).filter(
        (b) => b.type === "fill_blank" || b.type === "reorder_code" || b.type === "modify_code",
      ).length;

    expect(assembly("support")).toBeGreaterThan(assembly("core"));
    expect(assembly("support")).toBeGreaterThan(assembly("advanced"));
  });

  it("gives support strictly fewer blank-editor tasks than advanced", () => {
    const support = blankEditorTasks("support");
    const core = blankEditorTasks("core");
    const advanced = blankEditorTasks("advanced");

    /* The load that actually differs is the from-scratch writing. Concept and
       worked-example blocks are identical on all three routes on purpose — a
       support learner gets the same teaching, not a thinner explanation. */
    expect(support.length).toBeLessThan(advanced.length);
    expect(support.length).toBeLessThan(core.length);
    expect(core.length).toBeLessThan(advanced.length);
    expect(support.length).toBeGreaterThan(0);
  });
});

describe("the monthly check is delivered to everyone", () => {
  const assessment = SEPTEMBER.assessment;

  it("exists", () => {
    expect(assessment).not.toBeNull();
  });

  it("sends every block of it to all three tracks", () => {
    /* The independence check is the one mechanism that catches a learner who
       clicked their way through the month, so it is not differentiated: a
       support learner is measured against the same standard, on the same
       tasks. Differentiation is about the road, not the destination — and an
       assessment that silently shrank for the learners most at risk would
       make the evidence it produces worthless. */
    if (!assessment) throw new Error("September has no assessment");
    const full = assessment.blocks.map((b) => b.id);
    expect(full.length).toBeGreaterThan(0);

    for (const track of TRACKS) {
      const delivered = publicAssessment(assessment, SEPTEMBER.index, track).blocks.map(
        (b) => b.id,
      );
      expect(delivered, track).toEqual(full);
    }
  });
});

describe("blocksForTrack itself", () => {
  /* The projection is what the product uses; this covers the primitive's own
     edges, which no September block currently exercises. `Stub` is annotated
     rather than inferred: `blocksForTrack` is generic over its constraint, and
     an un-annotated literal makes TypeScript widen `T` to the constraint and
     then reject `id` as an excess property. */
  interface Stub {
    id: string;
    tracks?: readonly string[];
  }

  it("keeps a block that declares no tracks", () => {
    const blocks: Stub[] = [{ id: "a" }];
    expect(blocksForTrack(blocks, "support")).toEqual([{ id: "a" }]);
  });

  it("drops a block whose tracks exclude this one, and preserves order", () => {
    const blocks: Stub[] = [
      { id: "a" },
      { id: "b", tracks: ["advanced"] },
      { id: "c", tracks: ["support", "core", "advanced"] },
    ];
    expect(blocksForTrack(blocks, "support").map((b) => b.id)).toEqual(["a", "c"]);
    expect(blocksForTrack(blocks, "advanced").map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("delivers nothing extra to an unknown track rather than everything", () => {
    /* `resolveTrack` already rejects a junk cookie, but if a bad value ever
       reached here the safe failure is losing the optional blocks, not gaining
       the advanced ones. */
    const blocks: Stub[] = [{ id: "a" }, { id: "b", tracks: ["advanced"] }];
    expect(blocksForTrack(blocks, "nonsense").map((b) => b.id)).toEqual(["a"]);
  });
});
