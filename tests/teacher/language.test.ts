import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Localized } from "../../schools/curriculum/types";
import { TL } from "../../schools/teacher/labels";
import * as counted from "../../schools/teacher/labels";
import { blockKindLabel, attemptLevelLabel } from "../../schools/teacher/context";
import { LENS_EXPLANATION } from "../../schools/teacher/leaderboard";
import { EXTRA as EXTRA_SHELL } from "../../schools/teacher/labels-extra/shell";
import { EXTRA as EXTRA_OVERVIEW } from "../../schools/teacher/labels-extra/overview";
import { EXTRA as EXTRA_ROSTER } from "../../schools/teacher/labels-extra/roster";
import { EXTRA as EXTRA_STUDENT } from "../../schools/teacher/labels-extra/student";
import { EXTRA as EXTRA_SKILLS } from "../../schools/teacher/labels-extra/skills";
import { EXTRA as EXTRA_LESSONS } from "../../schools/teacher/labels-extra/lessons";
import { EXTRA as EXTRA_ASSESSMENTS } from "../../schools/teacher/labels-extra/assessments";
import { EXTRA as EXTRA_LEADERBOARD } from "../../schools/teacher/labels-extra/leaderboard";

/**
 * Every per-surface catalogue, held to exactly the same bar as `TL`.
 *
 * The `labels-extra` split exists because seven surfaces were built in parallel
 * against one shared file; it must not become a place where the language rules
 * are laxer. Each module is imported explicitly rather than globbed, so a new
 * one that nobody adds here fails the count assertion below rather than
 * silently shipping unchecked strings.
 */
const EXTRAS: Record<string, Record<string, unknown>> = {
  shell: EXTRA_SHELL,
  overview: EXTRA_OVERVIEW,
  roster: EXTRA_ROSTER,
  student: EXTRA_STUDENT,
  skills: EXTRA_SKILLS,
  lessons: EXTRA_LESSONS,
  assessments: EXTRA_ASSESSMENTS,
  leaderboard: EXTRA_LEADERBOARD,
};

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Nothing machine-shaped reaches a teacher, and nothing ships in one language.
 *
 * ## Why this file exists separately from `product-surface.test.ts`
 *
 * That test reflects over `Object.entries(L)` and is a good guard for the
 * strings that are IN `L`. The audit found that every visible string in the old
 * teacher panel was an inline `loc === "kk" ? … : …` ternary — the header, all
 * four stat labels, the empty state, every table heading, and the false
 * "no authorization yet" badge — so not one of them was covered. Fourteen
 * strings, invisible to the only test that could have caught them.
 *
 * So the rule for the rebuilt surface is that every string lives in `TL` (or a
 * `labels-extra` module), and this file both enforces the catalogue's quality
 * AND scans the components to make sure the catalogue is actually where the
 * strings are.
 */

/* -------------------------------------------------------------------------- */
/* Forbidden vocabulary                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Machine words that must never appear in a teacher-facing string.
 *
 * Two kinds. Ours — the field names and enum values the analytics compute in —
 * and the imported core's. Neither is secret; both are noise to someone
 * standing in front of eighteen students, and one English snake_case token in
 * the middle of a Kazakh sentence teaches a teacher to skim the whole panel.
 */
const FORBIDDEN = [
  "hintDependency",
  "hint_dependency",
  "source_trust",
  "independence_weight",
  "unattributed_failure",
  "unproductive_struggle",
  "productive_struggle",
  "REDUCE_ASSISTANCE",
  "tests_passed",
  "attempt_episodes",
  "learner_state",
  "task_ref",
  "episode_id",
  "subject_id",
  "not_authenticated",
  "provider_error",
  "provider_timeout",
  "null",
  "undefined",
  "NaN",
];

/** A snake_case or SCREAMING_CASE identifier of any kind. */
const IDENTIFIER = /[A-Za-z]+_[A-Za-z]+/;

/** Letters that exist in Kazakh and not in Russian. */
const KAZAKH_ONLY = /[әғқңөұүһі]/i;

function localizedEntries(): [string, Localized][] {
  const out: [string, Localized][] = [];
  for (const [key, value] of Object.entries(TL)) {
    out.push([`TL.${key}`, value as Localized]);
  }
  for (const [key, value] of Object.entries(LENS_EXPLANATION)) {
    out.push([`LENS_EXPLANATION.${key}`, value as Localized]);
  }
  for (const [surface, catalogue] of Object.entries(EXTRAS)) {
    for (const [key, value] of Object.entries(catalogue)) {
      if (isLocalized(value)) out.push([`${surface}.${key}`, value]);
    }
  }
  return out;
}

function isLocalized(v: unknown): v is Localized {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Localized).kk === "string" &&
    typeof (v as Localized).ru === "string"
  );
}

/**
 * Counted phrases, exercised at the numbers that actually change the wording.
 *
 * Russian needs three plural forms and the boundaries are 1, 2-4, 5-20, 21,
 * 22-24, 111-114. A helper tested only at n=3 passes while producing
 * «Ещё 1 скрытых теста» in production, which is the exact bug the shared
 * `pluralRu` was extracted to fix.
 */
const COUNTS = [0, 1, 2, 3, 4, 5, 11, 12, 14, 21, 22, 25, 100, 101, 111];

function countedPhrases(): [string, Localized][] {
  const out: [string, Localized][] = [];
  for (const n of COUNTS) {
    out.push([`daysAgo(${n})`, counted.daysAgo(n)]);
    out.push([`inEpisodes(${n})`, counted.inEpisodes(n)]);
    out.push([`stuckEpisodes(${n})`, counted.stuckEpisodes(n)]);
    out.push([`thrashEpisodes(${n})`, counted.thrashEpisodes(n)]);
    out.push([`unexplainedFailures(${n})`, counted.unexplainedFailures(n)]);
    out.push([`independentAcrossSkills(${n})`, counted.independentAcrossSkills(n)]);
    out.push([`daysWorked(${n})`, counted.daysWorked(n)]);
    out.push([`behindByLessons(${n},5)`, counted.behindByLessons(n, 5)]);
    out.push([`solvesNeededHelp(50,${n},10)`, counted.solvesNeededHelp(50, n, 10)]);
    out.push([`improvedBy(${n},1)`, counted.improvedBy(n, 1)]);
    out.push([`regressedBy(1,${n})`, counted.regressedBy(1, n)]);
    out.push([`revealedOften(${n},10)`, counted.revealedOften(n, 10)]);
    out.push([`assessmentIncomplete(${n},4)`, counted.assessmentIncomplete(n, 4)]);
  }
  return out;
}

/* -------------------------------------------------------------------------- */

describe("the teacher catalogue ships in both languages", () => {
  const entries = localizedEntries();

  it("covers every per-surface catalogue", () => {
    /* A `labels-extra` module nobody imports here is a module whose strings no
       test reads. Seven surfaces, seven catalogues. */
    const dir = join(ROOT, "schools/teacher/labels-extra");
    const onDisk = readdirSync(dir).filter((f) => f.endsWith(".ts")).length;
    expect(Object.keys(EXTRAS)).toHaveLength(onDisk);
  });

  it("has a substantial catalogue rather than a handful of keys", () => {
    /* The old surface had exactly ONE teacher UI string in `L`
       (`teacherNoClasses`); everything else was an inline ternary. */
    expect(entries.length).toBeGreaterThan(100);
  });

  it.each(entries)("%s is non-empty in both languages", (_key, value) => {
    expect(value.kk.trim().length).toBeGreaterThan(0);
    expect(value.ru.trim().length).toBeGreaterThan(0);
  });

  it("never ships the Russian as the Kazakh", () => {
    /* A short allowlist for strings that are genuinely identical in both —
       units and proper nouns. Everything else being identical means somebody
       pasted. */
    const ALLOWED = new Set([
      /* Units and loanwords that genuinely are the same word in both. */
      "TL.minutesShort",
      "TL.navLeaderboard",
    ]);
    for (const [key, value] of entries) {
      if (ALLOWED.has(key)) continue;
      expect(value.kk, `${key} is the same in both languages`).not.toBe(value.ru);
    }
  });

  it("actually uses Kazakh letters somewhere, so the kk arm is not transliterated Russian", () => {
    const withKazakh = entries.filter(([, v]) => KAZAKH_ONLY.test(v.kk));
    expect(withKazakh.length).toBeGreaterThan(entries.length / 3);
  });
});

describe("no machine vocabulary reaches a teacher", () => {
  const all = [...localizedEntries(), ...countedPhrases()];

  it.each(all)("%s contains no forbidden internal token", (key, value) => {
    for (const locale of ["kk", "ru"] as const) {
      for (const word of FORBIDDEN) {
        expect(value[locale].toLowerCase(), `${key}.${locale}`).not.toContain(
          word.toLowerCase(),
        );
      }
    }
  });

  it.each(all)("%s contains no snake_case identifier", (key, value) => {
    expect(value.kk, `${key}.kk`).not.toMatch(IDENTIFIER);
    expect(value.ru, `${key}.ru`).not.toMatch(IDENTIFIER);
  });

  it("names every block kind in both languages, exhaustively", () => {
    /* Total over `BlockType` with a `never` guard, for the same reason
       `teacherOutcome` is total over `ExecutionStatus`: a kind added to the
       curriculum must fail the BUILD rather than appear in a classroom as
       `reorder_code`. */
    const KINDS = [
      "concept", "worked_example", "prediction", "multiple_choice", "trace_code",
      "reorder_code", "fill_blank", "find_bug", "modify_code", "write_code",
      "test_case", "explain", "reflection", "arena_problem", "visual_simulation",
      "challenge", "verify",
    ] as const;
    for (const kind of KINDS) {
      const label = blockKindLabel(kind);
      expect(label.kk.length).toBeGreaterThan(0);
      expect(label.ru.length).toBeGreaterThan(0);
      expect(label.kk).not.toMatch(IDENTIFIER);
      expect(label.kk).not.toContain(kind);
    }
  });

  it("names every attempt rung in both languages", () => {
    for (const level of ["none", "attempted", "answered", "measured", "passed"] as const) {
      const label = attemptLevelLabel(level);
      expect(label.kk.length).toBeGreaterThan(0);
      expect(label.ru.length).toBeGreaterThan(0);
      expect(label.kk).not.toContain(level);
    }
  });
});

describe("Russian counts inflect correctly", () => {
  it.each([
    [1, "день"],
    [2, "дня"],
    [5, "дней"],
    [11, "дней"],
    [21, "день"],
    [22, "дня"],
    [25, "дней"],
    [111, "дней"],
  ])("daysAgo(%i) uses «%s»", (n, form) => {
    expect(counted.daysAgo(n).ru).toContain(form);
  });

  it("does not inflect the Kazakh noun after a numeral", () => {
    /* Kazakh takes the bare singular after a number — «3 күн», never
       «3 күндер». Sharing one plural helper across both languages is how that
       goes wrong. */
    for (const n of [1, 2, 5, 21]) {
      expect(counted.daysAgo(n).kk).toContain("күн");
      expect(counted.daysAgo(n).kk).not.toContain("күндер");
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The components themselves                                                  */
/* -------------------------------------------------------------------------- */

function teacherComponentSources(): { file: string; src: string }[] {
  const dirs = [join(ROOT, "src/components/teacher"), join(ROOT, "src/app/teacher")];
  const out: { file: string; src: string }[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        out.push({ file: p.slice(ROOT.length), src: readFileSync(p, "utf8") });
      }
    }
  };
  dirs.forEach(walk);
  return out;
}

/** Source with block and line comments removed. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("the teacher components", () => {
  const files = teacherComponentSources();

  it("exist", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [f.file, f.src]))(
    "%s formats dates through the product's own tables",
    (_file, src) => {
      /*
       * Chromium ships no CLDR for `kk`: it answers a `kk` request with
       * root-locale output instead of throwing, so «24 тамыз» silently becomes
       * «M08 24» and the weekday comes back in English. The only reliable guard
       * is to keep the request from being made.
       */
      expect(src).not.toMatch(/kk-KZ/);
      expect(src).not.toMatch(/Intl\.DateTimeFormat/);
      expect(src).not.toMatch(/toLocaleDateString|toLocaleTimeString|toLocaleString/);
    },
  );

  it.each(files.map((f) => [f.file, f.src]))(
    "%s never renders a raw error",
    (_file, src) => {
      /*
       * The old panel put `error.message` straight into the page. On an expired
       * session that is `not_authenticated`; on a class the teacher does not
       * teach, `not_found`; and behind a proxy that answers HTML on a 500, it is
       * the JSON parser's own `SyntaxError: Unexpected token '<'`.
       */
      expect(src).not.toMatch(/setError\((?:e|err|error)\.message\)/);
      expect(src).not.toMatch(/\{\s*error\s*\}/);
      expect(src).not.toMatch(/\{\s*err\.message\s*\}/);
    },
  );

  it("does not reintroduce the false development banner", () => {
    /* The badge read «Только в разработке — авторизации пока нет» while the page
       two files away redirected anonymous users to /login and the API answered
       401. It was a lie, and it was outside `L` so no test saw it. */
    for (const { file, src } of files) {
      expect(src, file).not.toContain("авторизации пока нет");
      expect(src, file).not.toContain("авторизация әлі жоқ");
    }
  });

  it("keeps every visible string out of inline locale ternaries", () => {
    /*
     * The specific defect: `loc === "kk" ? "Оқушы" : "Учеников"` in the markup.
     * Bilingual in practice, invisible to every language test, and impossible
     * to review as a catalogue. Strings belong in TL.
     */
    const TERNARY = /loc(?:ale)?\s*===\s*["']kk["']\s*\?\s*["'`]/;
    for (const { file, src } of files) {
      expect(src, `${file} builds a string from an inline locale ternary`).not.toMatch(
        TERNARY,
      );
    }
  });

  it("uses only tokens that exist in both themes", () => {
    /*
     * `text-white` and `bg-white` are flat values with no light arm. The global
     * theme test enforces this for `src/`, and it is repeated here because the
     * teacher surface is new and because `EVIDENCE_TONE` in `schools/` — which
     * this surface deliberately does NOT import — still carries
     * `text-white/30`, invisible on a white card.
     */
    for (const { file, src } of files) {
      /* Comments are stripped first. `ui.tsx` NAMES `text-white/30` in a doc
         comment explaining why it does not import `EVIDENCE_TONE`, and a guard
         that cannot tell a warning from a use is a guard people delete. */
      const code = stripComments(src);
      expect(code, file).not.toMatch(/\b(?:text|bg|border)-white\b/);
      expect(code, file).not.toMatch(/\bdark:/);
    }
  });
});
