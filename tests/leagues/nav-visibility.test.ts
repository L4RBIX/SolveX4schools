import { describe, it, expect, beforeAll } from "vitest";

/**
 * Who gets a league, decided once.
 *
 * `leagueNavVisible` is the predicate the nav tab, the settings chrome and the
 * `/league` page all ask. Before it existed the page gated on the SCHOOL alone,
 * so a teacher at an enabled school could open `/league` — and then
 * `GET /api/league/me` refused them, because `requireLearner` 403s anybody who
 * is not an enrolled student, and the screen rendered its «не удалось
 * загрузить» failure. These pin the three answers that keep the tab, the page
 * and the API saying the same thing.
 */

/* Before any dynamic import: `config` reads `process.env` once at module load,
   which is exactly why `leaguesEnabledForSchool` takes its inputs rather than
   reading them — see `gate.ts`. */
process.env.LEAGUES_ENABLED = "true";
process.env.LEAGUES_SCHOOLS = "innovation-tech";

const PILOT = "innovation-tech";
const OTHER = "some-other-school";

let leagueNavVisible: typeof import("@schools/leagues/scope").leagueNavVisible;

beforeAll(async () => {
  ({ leagueNavVisible } = await import("@schools/leagues/scope"));
});

const user = (schoolId: string, role: string) => ({ schoolId, role });

describe("with leagues on and scoped to the pilot school", () => {
  it("shows a student at the pilot school their league", () => {
    expect(leagueNavVisible(user(PILOT, "student"))).toBe(true);
  });

  it("refuses a teacher, who would otherwise get a page the API 403s", () => {
    /* `leagueScopeForCurrentUser` has always refused a teacher — `resolveIdentity`
       mints a learning subject for ANY signed-in user, so without the role check
       a teacher checking a lesson could enter a competition beside the children. */
    expect(leagueNavVisible(user(PILOT, "teacher"))).toBe(false);
  });

  it("refuses an admin for the same reason", () => {
    expect(leagueNavVisible(user(PILOT, "admin"))).toBe(false);
  });

  it("refuses a student at a school that is not on the allowlist", () => {
    /* The whole point of scoping: a second school joining the deployment does
       not silently acquire peer ranking. */
    expect(leagueNavVisible(user(OTHER, "student"))).toBe(false);
  });

  it("refuses the anonymous development path, which has no school", () => {
    expect(leagueNavVisible(null)).toBe(false);
  });
});
