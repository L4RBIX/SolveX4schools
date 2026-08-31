import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * XP is not evidence, and this suite is the fence around that.
 *
 * §4 of the brief states the rule and the architecture that enforces it:
 *
 *     trusted learning event
 *             │
 *             ├── Learning Intelligence   (pedagogical semantics)
 *             └── XP Engine               (gamification reward)
 *
 * A branch, never a chain. The two consume the same events and never each
 * other, and nothing in the left arm may ever read the right one.
 *
 * These are SOURCE SCANS, which is the mechanism this repository actually
 * maintains — `tests/teacher/visual-discipline.test.ts` and
 * `tests/school/theme.test.ts` both work this way, and `eslint.config.mjs` is
 * bare `eslint-config-next` with no import-boundary rule to extend. A
 * `no-restricted-imports` rule would be a new mechanism nobody here looks after.
 *
 * Comments are stripped before every check. A file explaining WHY it must not
 * import the XP policy would otherwise fail the test that forbids importing it —
 * a trap this repository has already hit once.
 */

const ROOT = join(import.meta.dirname, "..", "..");

/** Block comments, line comments and string bodies. */
function strip(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(full)) out.push(full);
    }
  };
  walk(join(ROOT, dir));
  return out;
}

const rel = (f: string) => f.slice(ROOT.length + 1);

/* -------------------------------------------------------------------------- */

describe("the Learning Intelligence never learns about XP", () => {
  /**
   * Everything on the pedagogical arm. If any of these can reach the league,
   * then a gamification number is one refactor away from becoming a belief
   * about a child.
   */
  const PEDAGOGICAL = [
    "packages/learning-intelligence-core/src",
    "packages/learning-contracts/src",
    "schools/reducer",
    "schools/learning",
    "schools/nova",
    "schools/teacher",
  ];

  it("no pedagogical module imports anything from schools/leagues", () => {
    const offenders: string[] = [];
    for (const dir of PEDAGOGICAL) {
      for (const f of filesUnder(dir)) {
        const src = strip(readFileSync(f, "utf8"));
        if (/from\s+["'][^"']*leagues?\//.test(src)) offenders.push(rel(f));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no pedagogical module mentions xp, league or a tier at all", () => {
    const offenders: string[] = [];
    for (const dir of PEDAGOGICAL) {
      for (const f of filesUnder(dir)) {
        const src = strip(readFileSync(f, "utf8"));
        /* Word-boundary `xp`, so `expires` and `experiment` do not trip it. */
        if (/\bxp\b/i.test(src) || /\bleague/i.test(src)) offenders.push(rel(f));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the learner-state contract has no field a gamification number could hide in", () => {
    const schema = readFileSync(join(ROOT, "contracts", "learner-state.schema.json"), "utf8");
    expect(/\bxp\b/i.test(schema)).toBe(false);
    expect(/league|tier|rank|points/i.test(schema)).toBe(false);
  });

  it("the event taxonomy has no XP event, so the reducer can never fold one", () => {
    /* This is the one that matters most. `reduceEpisode` derives event_count,
       active_seconds and struggle_class from the SHAPE of the event array, so an
       `xp_awarded` row in `learning_events` would silently move all three for a
       real episode without any branch reading the word "xp". */
    const events = readFileSync(
      join(ROOT, "packages", "learning-contracts", "src", "events.ts"),
      "utf8",
    );
    expect(/xp_awarded|league_/i.test(strip(events))).toBe(false);
  });

  it("the league writes no learning event, in any file", () => {
    const offenders: string[] = [];
    for (const f of filesUnder("schools/leagues")) {
      const src = strip(readFileSync(f, "utf8"));
      if (/insert\s+into\s+learning_events/i.test(src)) offenders.push(rel(f));
      if (/appendEvents\b/.test(src)) offenders.push(rel(f));
    }
    expect(offenders).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */

describe("there is exactly one XP policy", () => {
  it("no amount is written down outside xp-policy.ts", () => {
    /* The brief asks that `+10` / `+20` / `+5` never scatter through UI and API
       code. The mechanism is that `XP_AMOUNTS` is the only object holding a
       number, and every consumer reads it — including the React screen, which
       receives the amounts over the API rather than holding a copy. */
    const offenders: string[] = [];
    const scan = [...filesUnder("schools/leagues"), ...filesUnder("src/components/brilliant/app/league")];
    for (const f of scan) {
      if (rel(f).endsWith("xp-policy.ts")) continue;
      const src = strip(readFileSync(f, "utf8"));
      /* An achievement name adjacent to a bare integer is what a second policy
         looks like. */
      if (/(block_solved|challenge_solved|lesson_completed|assessment_completed)\s*:\s*\d+/.test(src)) {
        offenders.push(rel(f));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("only xp-policy.ts declares the achievement vocabulary", () => {
    const declarers = filesUnder("schools/leagues").filter((f) =>
      /XP_ACHIEVEMENTS\s*=/.test(strip(readFileSync(f, "utf8"))),
    );
    expect(declarers.map(rel)).toEqual(["schools/leagues/xp-policy.ts"]);
  });

  it("the database vocabulary and the TypeScript one are the same list", async () => {
    const { XP_ACHIEVEMENTS } = await import("@schools/leagues/xp-policy");
    const migration = readFileSync(
      join(ROOT, "database", "migrations", "0023_leagues.sql"),
      "utf8",
    );
    const check = migration.match(/achievement\s+text not null check \(achievement in \(([\s\S]*?)\)\)/);
    expect(check).toBeTruthy();
    const inSql = [...check![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(inSql).toEqual([...XP_ACHIEVEMENTS].sort());
  });
});

/* -------------------------------------------------------------------------- */

describe("the teacher surface never becomes an XP console", () => {
  it("no teacher file imports the league", () => {
    const offenders: string[] = [];
    for (const dir of ["src/components/teacher", "src/app/teacher", "schools/teacher"]) {
      for (const f of filesUnder(dir)) {
        const src = strip(readFileSync(f, "utf8"));
        if (/leagues?\//.test(src)) offenders.push(rel(f));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the teacher shell still passes no XP number to the header", () => {
    /* `AppHeader.xp` exists and every teacher surface passes `null`. A real
       number appearing there would put a student game mechanic on the console a
       teacher uses to read evidence. */
    const shell = readFileSync(join(ROOT, "src/components/teacher/shell.tsx"), "utf8");
    expect(/xp=\{null\}/.test(shell)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */

describe("the league API says nothing about a learner beyond a rank and a name", () => {
  it("the payload type has no field that could carry evidence", async () => {
    const src = strip(readFileSync(join(ROOT, "schools/leagues/queries.ts"), "utf8"));
    const rowType = src.match(/export interface LeagueRow \{([\s\S]*?)\}/)?.[1] ?? "";
    const fields = [...rowType.matchAll(/^\s*([a-zA-Z]+)[?]?:/gm)].map((m) => m[1]).sort();
    /* Exactly four. Adding one is a deliberate edit to this list. */
    expect(fields).toEqual(["isYou", "name", "rank", "weeklyXp", "zone"].sort());
  });

  it("never selects a column that identifies a learner to their classmates", () => {
    const src = strip(readFileSync(join(ROOT, "schools/leagues/queries.ts"), "utf8"));
    for (const forbidden of ["username", "password", "user_id as", "school_id,", "class_id,"]) {
      expect(src.includes(forbidden), forbidden).toBe(false);
    }
  });

  it("never reads a table that holds evidence about a learner", () => {
    const src = strip(readFileSync(join(ROOT, "schools/leagues/queries.ts"), "utf8"));
    for (const table of [
      "attempt_episodes",
      "learner_state",
      "learner_skill_state",
      "interventions",
      "human_reviews",
      "post_help_explanations",
      "learning_submissions",
    ]) {
      expect(src.includes(table), table).toBe(false);
    }
  });
});
