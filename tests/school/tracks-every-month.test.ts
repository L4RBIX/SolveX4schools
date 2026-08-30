import { describe, it, expect } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { publicAssessment, publicLesson } from "@schools/curriculum/public";
import type { Lesson, Month, TrackLevel } from "@schools/curriculum/types";

/**
 * Differentiation, as an invariant over every authored month.
 *
 * ## Why this exists next to `tracks.test.ts` rather than inside it
 *
 * `tracks.test.ts` asserts September by id — which block goes to which route,
 * named one at a time — and that specificity is the point of it: a test on
 * counts alone would pass if the wrong five blocks were withheld. But it is
 * bound to `MONTH_01_SEPTEMBER` at the top of the file, so when October landed
 * with nine scaffolded twins and five withheld tasks, it kept passing and
 * asserted nothing about any of them. An October review found that: the `id +
 * "s"` convention the authoring contract calls "a failing test, not an opinion"
 * was, for October, enforced by zero lines of code.
 *
 * So this file takes the other half of the job. It knows no block ids at all.
 * It states the rules the programme actually gives (PDF p.6) as properties, and
 * runs them over every month that has content — which means a month authored
 * next week is covered the day it is written, without anybody remembering to
 * extend a list.
 *
 * ## The rules, and where each comes from
 *
 * > **Қолдау** — Тек негізгі есептер; дайын кодты құрастыру мен толықтыру
 * > **көбірек**, нөлден жазу азырақ.
 * > **Тереңдетілген** — … Көмек кешірек ашылады, **шешімді жазбаша қорғау
 * > міндетті**.
 *
 * Support gets MORE assembling and completing, not fewer tasks. Advanced owes a
 * written defence. Both are checked below as counts per route, through the
 * projection the browser is actually served — `publicLesson` / `publicAssessment`
 * — because the defect this whole area exists to prevent was a `tracks` field
 * that no runtime code read.
 */

const TRACKS = ["support", "core", "advanced"] as const satisfies readonly TrackLevel[];

/** Blocks that hand the learner an empty editor: the thing support gets LESS of. */
const BLANK_EDITOR = new Set(["write_code", "challenge"]);
/** Blocks that are assembling or completing existing code: the thing support gets MORE of. */
const ASSEMBLY = new Set(["fill_blank", "reorder_code", "modify_code", "trace_code", "find_bug"]);

/** Every block id this route receives from the month, lessons then assessment. */
function idsFor(month: Month, track: TrackLevel): string[] {
  const out = month.units
    .flatMap((u) => u.lessons)
    .flatMap((l) => publicLesson(l, track).blocks.map((b) => b.id));
  if (month.assessment) {
    out.push(...publicAssessment(month.assessment, month.index, track).blocks.map((b) => b.id));
  }
  return out;
}

function typedBlocks(month: Month, track: TrackLevel): { id: string; type: string }[] {
  const out = month.units
    .flatMap((u) => u.lessons)
    .flatMap((l) => publicLesson(l, track).blocks.map((b) => ({ id: b.id, type: b.type as string })));
  if (month.assessment) {
    out.push(
      ...publicAssessment(month.assessment, month.index, track).blocks.map((b) => ({
        id: b.id,
        type: b.type as string,
      })),
    );
  }
  return out;
}

function lessonsOf(month: Month): Lesson[] {
  return month.units.flatMap((u) => u.lessons);
}

/** The authored months. A `draft` month contributes nothing and is not asserted about. */
const AUTHORED = MONTHS.filter((m) => lessonsOf(m).some((l) => l.blocks.length > 0));

/**
 * Months that predate the written-defence rule being enforced.
 *
 * **Now empty, and the way it emptied is the point.** September's three
 * `explain` blocks all went to every route, so its Тереңдетілген learners were
 * asked for nothing in writing that Негізгі was not — a real contradiction with
 * PDF p.6, exempted here rather than silently edited, and asserted in REVERSE
 * so that the day someone closed the gap this test would fail and ask for the
 * line to be deleted.
 *
 * It failed. Closing the gap was not the goal of the change that closed it:
 * `m1.l8.b3` was scoped to `advanced` because the problem it asks about is
 * advanced-only, and September acquiring an advanced-only written defence was a
 * consequence. The exemption is deleted, and September is now held to the same
 * rule as every other month.
 */
const WRITTEN_DEFENCE_GAP = new Set<number>([]);

describe("every authored month is differentiated, not labelled", () => {
  it("has authored months to check", () => {
    // Guards the guard. If the curriculum stopped exporting content, every
    // property below would hold vacuously and this file would certify nothing.
    expect(AUTHORED.length).toBeGreaterThan(0);
    expect(AUTHORED.map((m) => m.index)).toContain(1);
  });

  for (const month of AUTHORED) {
    const name = `month ${month.index} (${month.monthName.kk})`;

    describe(name, () => {
      const support = idsFor(month, "support");
      const core = idsFor(month, "core");
      const advanced = idsFor(month, "advanced");
      const S = new Set(support);
      const A = new Set(advanced);

      it("gives no two routes the same month", () => {
        expect(support).not.toEqual(core);
        expect(core).not.toEqual(advanced);
        expect(support).not.toEqual(advanced);
      });

      it("opens every lesson on every route", () => {
        /* A route that silently loses a whole lesson breaks the board, which
           links all of them — the learner meets a dead card, not a shorter
           month. */
        for (const track of TRACKS) {
          for (const lesson of lessonsOf(month)) {
            expect(
              publicLesson(lesson, track).blocks.length,
              `${lesson.id} is empty on the ${track} route`,
            ).toBeGreaterThan(0);
          }
        }
      });

      it("names every support-only block as a substitution", () => {
        /* The convention: a block only support sees is a scaffolded twin of a
           harder one, and carries that one's id plus `s`. Anything else is a
           block that quietly exists for one route and nobody decided to. */
        const supportOnly = support.filter((id) => !A.has(id));
        expect(supportOnly.length, `${name} has no support substitutions at all`).toBeGreaterThan(0);
        for (const id of supportOnly) {
          expect(id.endsWith("s"), `${id} is support-only but is not named as a substitution`).toBe(
            true,
          );
          expect(
            A.has(id.slice(0, -1)),
            `${id} substitutes for ${id.slice(0, -1)}, which no other route has`,
          ).toBe(true);
        }
      });

      it("substitutes or justifies everything it withholds from support", () => {
        /*
         * The programme's rule is «тек негізгі есептер» — support does the core
         * problems — not "support does fewer things". So a task withheld from
         * support must be one of exactly three things, and the test says which:
         *
         *   · substituted, by a scaffolded twin on the same problem;
         *   · advanced-only, which is extra depth rather than a removal;
         *   · a `challenge`, the block type that exists for harder problems;
         *   · a top rung of the independent practice bank (`mN.pK`), whose last
         *     entries are deliberately beyond the month's core set.
         *
         * Anything else is a task that vanished from one route for no stated
         * reason, which is the failure this rule exists to make loud.
         */
        const advancedOnly = new Set(
          month.units
            .flatMap((u) => u.lessons)
            .flatMap((l) => l.blocks)
            .concat(month.assessment?.blocks ?? [])
            .filter((b) => b.tracks?.length === 1 && b.tracks[0] === "advanced")
            .map((b) => b.id),
        );
        const typeOf = new Map(typedBlocks(month, "advanced").map((b) => [b.id, b.type]));

        for (const id of advanced.filter((x) => !S.has(x))) {
          const reason =
            (S.has(`${id}s`) && "substituted") ||
            (advancedOnly.has(id) && "advanced-only") ||
            (typeOf.get(id) === "challenge" && "challenge") ||
            (/^m\d+\.p\d+$/.test(id) && "practice-bank top rung") ||
            null;
          expect(
            reason,
            `${id} vanished from the support route with no substitute and no reason`,
          ).not.toBeNull();
        }
      });

      it("gives support MORE assembling and completing than core", () => {
        /*
         * «дайын кодты құрастыру мен толықтыру КӨБІРЕК, нөлден жазу АЗЫРАҚ».
         *
         * This is the rule a purely subtractive route fails: withhold the hard
         * problems and support has FEWER blank editors and exactly as much
         * scaffolding, which reads as differentiation in a count of totals and
         * is not. The ratio is what the programme asks about, so the ratio is
         * what is asserted.
         */
        const ratio = (track: TrackLevel) => {
          const blocks = typedBlocks(month, track);
          const assembly = blocks.filter((b) => ASSEMBLY.has(b.type)).length;
          const blank = blocks.filter((b) => BLANK_EDITOR.has(b.type)).length;
          return { assembly, blank, ratio: assembly / Math.max(1, blank) };
        };
        const s = ratio("support");
        const c = ratio("core");
        expect(
          s.assembly >= c.assembly,
          `${name}: support has ${s.assembly} assembly blocks, core has ${c.assembly}`,
        ).toBe(true);
        expect(
          s.blank <= c.blank,
          `${name}: support has ${s.blank} blank editors, core has ${c.blank}`,
        ).toBe(true);
        expect(
          s.ratio > c.ratio,
          `${name}: support's assembly-to-blank-editor ratio (${s.ratio.toFixed(2)}) is not ` +
            `higher than core's (${c.ratio.toFixed(2)}) — the route is subtractive, not scaffolded`,
        ).toBe(true);
      });

      it("asks the advanced route for a written defence core is not asked for", () => {
        /* «шешімді жазбаша қорғау міндетті» — compulsory written defence. The
           only block type that carries marking points for prose is `explain`,
           so advanced must receive at least one core does not. */
        const explains = (track: TrackLevel) =>
          new Set(typedBlocks(month, track).filter((b) => b.type === "explain").map((b) => b.id));
        const extra = [...explains("advanced")].filter((id) => !explains("core").has(id));

        if (WRITTEN_DEFENCE_GAP.has(month.index)) {
          /* Asserted the other way round on purpose. September carries three
             `explain` blocks and gives all three to every route, so its
             Тереңдетілген learners are asked for no written defence that
             Негізгі is not — a real gap against PDF p.6, inherited rather than
             introduced here, and recorded in
             docs/curriculum/reviews/MONTH_02_AUTHORING_REPORT.md under
             "human review required". It is not fixed silently: this month is
             the quality baseline and re-cutting its differentiation is a
             curriculum decision, not a test's. When somebody makes it, this
             assertion fails and tells them to delete the exemption. */
          expect(
            extra.length,
            `month ${month.index} is listed as an inherited written-defence gap but now has ` +
              `advanced-only explain blocks (${extra.join(", ")}) — remove it from ` +
              `WRITTEN_DEFENCE_GAP so the real rule applies`,
          ).toBe(0);
          return;
        }

        expect(
          extra.length,
          `${name}: the advanced route gets no explain block that core does not — ` +
            `the programme makes written defence compulsory for Тереңдетілген`,
        ).toBeGreaterThan(0);
      });

      it("gives every route the same monthly check", () => {
        /* The month's own assessment measures the month, so it cannot be a
           different assessment per route — a support learner passing an easier
           check would produce evidence that reads identically to a core
           learner's and means something else. Differentiation is a route
           THROUGH the month, not a different exam at the end of it. */
        if (!month.assessment || month.assessment.blocks.length === 0) return;
        const forTrack = (t: TrackLevel) =>
          publicAssessment(month.assessment!, month.index, t).blocks.map((b) => b.id);
        expect(forTrack("support")).toEqual(forTrack("core"));
        expect(forTrack("core")).toEqual(forTrack("advanced"));
      });
    });
  }
});
