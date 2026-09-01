import "server-only";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { config } from "@schools/config";
import { leaguesEnabledForSchool } from "./gate";

/**
 * Which competition a learner belongs to, and whether they have one at all.
 *
 * ## The population comes from enrolment, never from subject scope
 *
 * `store.classesForLearner` reads `class_enrolments`, keyed
 * `(school_id, class_id)` with real foreign keys to `school_classes`. The
 * tempting alternative — `school_subject_scope`, via `store.subjectsInClass` —
 * filters on `class_id` ALONE, has no foreign key and no cross-school
 * uniqueness, and `config.pilot.classId` ships defaulted to the literal
 * `"grade-9a"`. Two deployments on that default share the key, and one school's
 * children appear in the other's group. Two existing tests pin that defect as
 * still present; `schools/teacher/queries.ts` states the rule this follows.
 *
 * ## It also excludes the adults
 *
 * `resolveIdentity` mints a `learning_subject` for ANY signed-in user who opens
 * a lesson — including a teacher or an admin — with no role check. A league
 * built from subject scope would put the teacher on the leaderboard beside the
 * children. Enrolment cannot: a teacher is in `class_teachers`, not
 * `class_enrolments`, and the role check below refuses them regardless.
 *
 * Returns `null` for every reason a learner has no league — not signed in, not
 * a student, not enrolled, or leagues off for their school — because the caller
 * treats all four identically: no award, no page, no nav entry. Distinguishing
 * them would only be useful to something that wanted to say WHY, and "your
 * school has not enabled this" is not a sentence a fourteen-year-old needs.
 */
export interface LeagueScope {
  schoolId: string;
  classId: string;
}

export async function leagueScopeForCurrentUser(): Promise<LeagueScope | null> {
  if (!config.leagues.enabled) return null;

  const user = await currentUser();
  if (!user) return null;

  /* Students only. A teacher opening a lesson to check it must not enter a
     competition, and an admin must not either. */
  if (user.role !== "student") return null;

  if (!leaguesEnabledForSchool(config.leagues, user.schoolId)) return null;

  const store = await getStore();
  const classes = await store.classesForLearner(user.userId);
  const enrolled = classes[0];
  if (!enrolled) return null;

  /* `classesForLearner` returns an array and every caller in the product takes
     `[0]` — a learner in two classes has an ambiguous membership everywhere,
     not only here. Taking the same first element keeps the league in the same
     class the rest of the product already believes they are in, rather than
     inventing a second answer to a question the product has not settled. */
  return { schoolId: enrolled.schoolId, classId: enrolled.classId };
}

/**
 * Does this signed-in user get a league tab, and a league page?
 *
 * The one predicate every SURFACE asks, and it deliberately matches
 * `leagueScopeForCurrentUser` above rather than being a looser version of it:
 * enabled for the deployment, enabled for their school, and a student.
 *
 * ## The role check is not decoration
 *
 * Without it a teacher at an enabled school could open `/league`, because the
 * page gate only knew about the school. `GET /api/league/me` would then refuse
 * them — `requireLearner` 403s anybody who is not an enrolled student — and the
 * screen would render its "the board did not load" state. An adult would report
 * a bug; a head teacher would report it to a parent. Refusing at the page is the
 * same answer `leagueScopeForCurrentUser` already gives, in the same words.
 *
 * ## Synchronous, and takes the user
 *
 * It reads `config`, so it is server-only and a page calls it after
 * `requirePageSession()`. It does NOT touch the database — enrolment is checked
 * where a group is actually needed, and a nav tab must not cost a query on every
 * page render. A student enrolled in no class sees the tab and lands on a page
 * that renders its own empty state, which is the correct outcome for somebody
 * whose enrolment has not been recorded yet.
 *
 * `null` — the anonymous development path — is false. An anonymous subject has
 * no school and therefore no competition.
 */
export function leagueNavVisible(
  user: { schoolId: string; role: string } | null,
): boolean {
  if (!user) return false;
  if (user.role !== "student") return false;
  return leaguesEnabledForSchool(config.leagues, user.schoolId);
}
