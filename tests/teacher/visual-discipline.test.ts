import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * The visual decisions, kept.
 *
 * ## Why a source scan rather than a rendered assertion
 *
 * There is no jsdom in this repo and no testing-library; `vitest.config.mts`
 * runs node-only. The house substitute is a `readFileSync` scan, and
 * `tests/school/theme.test.ts` and `dates.test.ts` both use it for exactly this
 * shape of rule. It cannot prove a page looks good. It can prove that the four
 * specific regressions the redesign fixed do not come back, which is the honest
 * scope of a lint.
 *
 * Each rule below corresponds to a numbered finding in
 * `docs/teacher/TEACHER_UX_HIERARCHY_AUDIT.md`.
 */

/** Files that DEFINE the scale, and so are allowed to contain raw values. */
const SCALE_FILES = new Set(["tokens.ts", "format.ts", "ui.tsx"]);

function componentSources(): { file: string; base: string; src: string }[] {
  const out: { file: string; base: string; src: string }[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry.name)) {
        out.push({ file: p.slice(ROOT.length), base: entry.name, src: readFileSync(p, "utf8") });
      }
    }
  };
  walk(join(ROOT, "src/components/teacher"));
  walk(join(ROOT, "src/app/teacher"));
  return out;
}

/** Comments name the things they forbid; a guard that cannot tell prose from code is one people delete. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const FILES = componentSources();

describe("the teacher surface keeps its type scale", () => {
  it("has files to check", () => {
    expect(FILES.length).toBeGreaterThan(8);
  });

  it.each(FILES.map((f) => [f.file, f.src, f.base] as const))(
    "%s does not shout",
    (_file, src, base) => {
      /*
       * F3 in the audit. `b-eyebrow` is 12px uppercase with letter-spacing, and
       * the first build put it on every metric label, every sub-heading and
       * every recommendation prefix. Caps at 12px in Cyrillic — with Kazakh's
       * ә ғ қ ң ө ұ ү һ і — is slower to read than sentence case, and when
       * everything shouts there is no hierarchy left to read.
       *
       * `TYPE.label` in tokens.ts is the one sanctioned small-caps, and it is
       * for naming a number.
       */
      if (SCALE_FILES.has(base)) return;
      const code = stripComments(src);
      expect(code).not.toContain("b-eyebrow");
      expect(code).not.toMatch(/\buppercase\b/);
    },
  );

  it.each(FILES.map((f) => [f.file, f.src, f.base] as const))(
    "%s keeps content above the contrast floor",
    (_file, src, base) => {
      /*
       * F4. `text-b-fg/40` over `--color-sx-page` (#f5f3f1) on the light theme
       * is about 2.6:1, and the first build used /40, /45 and /50 for window
       * labels, denominators and "last active" — content, at less than the
       * 4.5:1 it needs.
       *
       * The scale lives in `tokens.ts` as INK.primary / secondary / muted /
       * faint. A page reaching past it for a raw opacity is how forty slightly
       * different greys come back.
       */
      if (SCALE_FILES.has(base)) return;
      const code = stripComments(src);
      const offenders = code.match(/text-b-fg\/(?:5|10|15|20|25|30|35|40|45|50)\b/g);
      expect(offenders ?? []).toEqual([]);
    },
  );

  it.each(FILES.map((f) => [f.file, f.src] as const))(
    "%s uses tokens that exist in both themes",
    (_file, src) => {
      const code = stripComments(src);
      expect(code).not.toMatch(/\b(?:text|bg|border)-white\b/);
      /* There is no `dark:` custom variant registered; v4's default would key on
         prefers-color-scheme and ignore a viewer who chose light on a dark OS.
         The system is `light-dark()` throughout. */
      expect(code).not.toMatch(/\bdark:/);
      /* Flat sx-* surfaces have no light arm. `bg-sx-page` is the themed one. */
      expect(code).not.toMatch(/\bbg-sx-(?:bg|surface|raised)\b/);
    },
  );
});

describe("the teacher surface keeps its motion discipline", () => {
  it.each(FILES.map((f) => [f.file, f.src, f.base] as const))(
    "%s animates at the one duration, and respects reduced motion",
    (_file, src, base) => {
      /*
       * Everything on this surface is a state change on something already on
       * screen — a row highlighting, a tab moving, a disclosure opening. One
       * duration, one easing, defined as MOTION in tokens.ts, which carries
       * `motion-reduce:transition-none` on the token itself.
       *
       * That last part is not optional here: the global reduced-motion block in
       * `solvex.css` is scoped to `.sx-root`, and this surface is not under it.
       * A component that writes its own `transition` therefore opts out of the
       * only reduced-motion guarantee it had.
       */
      if (SCALE_FILES.has(base)) return;
      const code = stripComments(src);
      const durations = code.match(/duration-\d+/g) ?? [];
      for (const d of durations) expect(d).toBe("duration-140");
      /* `transition-colors` and friends without a duration inherit Tailwind's
         150ms default, which is close enough and carries no reduced-motion
         guarantee — so the token is required wherever a transition is written. */
      if (/\btransition(?:-|\b)/.test(code)) {
        expect(code, "writes a transition without MOTION").toMatch(/MOTION\./);
      }
    },
  );
});

describe("the honesty affordances survive the redesign", () => {
  const all = FILES.map((f) => f.src).join("\n");

  it("still renders a word for an unmeasured value", () => {
    /* The single rule the whole product rests on: `null` is an absence of
       measurement and never a zero. If a redesign ever drops this lookup the
       tiles start printing 0 for "nobody measured this". */
    expect(all).toContain("emptyNotMeasured");
  });

  it("still offers the evidence behind a misconception", () => {
    /* `MisconceptionObservation.episodeIds` is what makes a claim about a child
       checkable rather than an opinion, and the pre-rebuild panel dropped it. */
    expect(all).toMatch(/episodeIds|showEvidence/);
  });

  it("still states that the leaderboard is class-only", () => {
    expect(all).toContain("leaderboardClassOnly");
  });

  it("still states that Nova conversations are not shown", () => {
    expect(all).toContain("assistanceNoTranscripts");
  });

  it("tells written and oral apart, and never claims a recording", () => {
    /*
     * This used to assert `assessmentUnreadable` — the sentence saying written
     * AND oral answers were not stored. Migration 0021 made the first half
     * false, so the guard changed with the fact rather than outliving it.
     *
     * Two things must both be on screen: that written work is readable, and
     * that the oral defence happens in person with nothing recorded. Asserting
     * only the first would let the second quietly disappear, and a console
     * silent about the missing recording is one a teacher assumes has it.
     */
    expect(all).toContain("assessmentWrittenStored");
    expect(all).toContain("assessmentOralInPerson");
    /* The stale claim, gone for good. */
    expect(all).not.toContain("assessmentUnreadable\b");
  });

  it("offers exactly two review dispositions, and neither is a grade", () => {
    /*
     * This guard used to assert the OPPOSITE — that no marking control existed
     * — because until migration 0022 there was nowhere to record one. It moves
     * with the fact rather than outliving it, the way the
     * `assessmentUnreadable` guard above did when 0021 shipped.
     *
     * What has to stay true is the shape: two options, both meaning READ, and
     * no third that could be a mark. A third button is where a grade arrives.
     */
    expect(all).toContain("REVIEW.markReviewed");
    expect(all).toContain("REVIEW.markFollowUp");
    const code = stripComments(all);
    /* No score anywhere on the surface, under any of its usual names. */
    for (const banned of ["setGrade", "setScore", "grade:", "score:", "points:"]) {
      expect(code, `the review UI must not carry ${banned}`).not.toContain(banned);
    }
  });

  it("still says where a real mark goes, now that a button exists", () => {
    /* The most dangerous version of this change is the silent one: shipping the
       write and LEAVING the old «Платформа не хранит оценку: здесь вы только
       читаете» copy, so the product tells a teacher nothing was stored on a
       screen that just stored something. The sentence had to change, and it
       still has to be present. */
    expect(all).toContain("REVIEW.noRecord");
    const labels = readFileSync(
      join(ROOT, "schools/teacher/labels-extra/assessments.ts"),
      "utf8",
    );
    expect(labels).not.toContain("Платформа не хранит оценку");
    expect(labels).toContain("Платформа отмечает только то, что работу прочитали");
  });

  it("never shows a teacher's review decision to the learner", () => {
    /* A follow-up flag is a teacher's note about a conversation to have. A
       fourteen-year-old finding it on their own screen would turn it into the
       verdict it is careful not to be. Asserted where it can be: no learner
       component reads the review vocabulary. */
    const learner = join(ROOT, "src/components/brilliant");
    const seen: string[] = [];
    const walk = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(entry.name)) {
          const src = readFileSync(p, "utf8");
          if (/needs_followup|human_reviews|ReviewDisposition/.test(src)) seen.push(p);
        }
      }
    };
    walk(learner);
    expect(seen).toEqual([]);
  });

  it("still names the judge outage rather than scoring it as a failure", () => {
    expect(all).toContain("assessmentUnmeasured");
  });

  it("never renders a mastery percentage", () => {
    /* There is no mastery model. `learnerState.ts:206-215` refuses a 0-100
       score outright, and a UI that invented one would be claiming a
       measurement nothing in the pipeline took. */
    const code = stripComments(all).toLowerCase();
    expect(code).not.toContain("mastery");
    expect(code).not.toContain("освоение");
    expect(code).not.toContain("меңгеру");
  });
});

describe("the console fits a phone", () => {
  /**
   * Measured in Chromium at 375px, on the deployed console: `documentElement`
   * scrolled to **703px**. The cause was the month selector this pass added —
   * a native `<select>` sizes itself to its WIDEST option, and its options are
   * full month titles («Ай 3 · Функциялар және қайталанатын әрекеттер»), so the
   * chip measured 683px and pushed the whole document. Header, tables and tabs
   * drifted sideways on every teacher page.
   *
   * The tab bar beside it had already been fixed for exactly this — see the
   * `min-w-0` note on the nav — and the selector reintroduced it two elements
   * later, which is the argument for pinning it rather than trusting the
   * lesson to have been learnt.
   *
   * The browser assertion lives in `scripts/pilot-e2e.mjs`, which measures all
   * four teacher surfaces at 1440/1280/1024/768/375. This is the source lint
   * that fails in a second instead of in a browser run.
   */
  const shell = readFileSync(join(ROOT, "src/components/teacher/shell.tsx"), "utf8");
  const chip = shell.slice(shell.indexOf("function MonthChip("));

  it("bounds the month selector so it cannot set the page's width", () => {
    expect(chip).toMatch(/max-w-\[9rem\]/);
    expect(chip, "and it must be allowed to shrink inside the flex row").toContain("min-w-0");
    expect(chip, "a bounded select with no truncation clips mid-glyph").toContain("truncate");
  });

  it("lets the chip wrap rather than widen", () => {
    expect(chip).toContain('className="max-w-full flex-wrap"');
  });
});
