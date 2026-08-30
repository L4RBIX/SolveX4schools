/**
 * Whether leagues are on, for this deployment and this school.
 *
 * ## Pure, and taking its inputs
 *
 * No `import "server-only"` and no read of `config` inside. `schools/config.ts`
 * resolves `process.env` ONCE at module import, so anything that inspects it
 * directly can only ever be tested against whatever environment the runner
 * happens to be in — `executionProviderProblems` in that same file is written
 * this way for exactly this reason, and says so.
 *
 * A gate that cannot be tested in the off state is a gate nobody has seen
 * behave, which is the one thing a kill switch must not be.
 *
 * ## Default OFF, and why the spelling matters
 *
 * Two opposite boolean conventions live in `config.ts`: `!== "false"` for
 * things that should default on (the sweep, Nova), and `=== "true"` for things
 * that should default off. A league is the second kind. Spelling it the first
 * way would turn the competition on for every existing deployment at the next
 * deploy — including any school that has not agreed to one — which for a
 * product used by minors is not a defensible default.
 */

export interface LeagueGateInput {
  /** `LEAGUES_ENABLED`. Absent or anything but `"true"` means off. */
  enabled: boolean;
  /**
   * `LEAGUES_SCHOOLS`, parsed. Empty means "every school, once enabled".
   *
   * An allowlist rather than a hardcoded school name in business logic. There
   * is no `schools` table to hang a column on — `school_id` is unregistered
   * `text` denormalised across five tables — so a list of ids in configuration
   * is the mechanism the product actually has. When a schools table exists,
   * this function is the one place that changes.
   */
  schools: readonly string[];
}

/** Is the subsystem on at all? Gates the routes and the nav entry. */
export function leaguesEnabled(gate: LeagueGateInput): boolean {
  return gate.enabled;
}

/**
 * Is it on for this school?
 *
 * An empty allowlist means every school. That is the right default for a flag
 * whose outer switch is already off: an operator who turns leagues on without
 * naming schools means "on", and forcing them to also enumerate schools would
 * produce a deployment that is enabled and silently does nothing.
 */
export function leaguesEnabledForSchool(gate: LeagueGateInput, schoolId: string): boolean {
  if (!gate.enabled) return false;
  if (gate.schools.length === 0) return true;
  return gate.schools.includes(schoolId);
}

/**
 * Parse the comma-separated allowlist.
 *
 * Trims and drops empties, so `"a, ,b,"` is `["a","b"]` rather than a list with
 * a school called the empty string in it — which would match nothing and be
 * invisible in a config dump.
 */
export function parseSchoolAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
