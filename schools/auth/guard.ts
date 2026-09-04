import "server-only";
import { getStore } from "@schools/store";
import { currentUser } from "./session";
import type { SchoolRole, SessionUser } from "./types";

/**
 * Authorisation.
 *
 * One module, because the alternative is each route inventing its own idea of
 * "may this person see this" and one of them getting it wrong. The teacher
 * endpoint that returns every child in a class with the misconceptions the
 * system believes it can name is the specific thing these guards exist for.
 *
 * ## The shape of every guard here
 *
 * They return a discriminated result rather than throwing, so a route handler
 * turns a denial into a status code explicitly and cannot accidentally let one
 * fall through a `catch`. `deny()` builds the response, so every refusal in the
 * product looks the same to a caller — including that it never says WHICH of
 * "not logged in" and "not allowed" applies where that itself would be a
 * disclosure.
 */

export type GuardResult<T> = { ok: true; value: T } | { ok: false; status: number; reason: string };

export function deny(status: number, reason: string): Response {
  return Response.json({ error: reason }, { status });
}

/**
 * The refusal a first-login session gets from everything except the two routes
 * it is allowed to use.
 *
 * ## Why this exists
 *
 * `must_change_password` is the whole of the one-time-credential model: a
 * teacher hands out a printed code, the child signs in with it once, and the
 * account is theirs from the moment they choose a password. Until then the
 * credential is on a slip of paper that has been through a classroom.
 *
 * That model was enforced in **page guards only**. `src/app/teacher/*.tsx` and
 * `page-guard.ts` redirect to `/account/password`; not one API route looked at
 * the flag. Measured against a real deployment with a teacher's one-time
 * session: `GET /api/teacher/class/9i/students` answered 200 with the roster of
 * a class of children, and `GET /api/learning/state/me` answered 200 for a
 * learner. Anyone holding the paper slip — or standing behind the teacher when
 * it was read out — had the API.
 *
 * A redirect is navigation. It is not a control, and the thing behind it is
 * named minors.
 *
 * ## The rule
 *
 * Every guard in this file refuses a session whose password change is still
 * outstanding, with **403 `password_change_required`**. Two routes opt out by
 * name, because they are the only two such a session can legitimately reach:
 *
 *   - `POST /api/auth/password` — the way out. It passes
 *     `{ allowPasswordChange: true }` to `requireUser`.
 *   - `POST /api/auth/logout` — reads `currentUser()` directly and never asks a
 *     guard, so it is unaffected. Deliberate: signing out must work from any
 *     state whatsoever.
 *
 * 403 rather than 401, and a distinct reason rather than `forbidden`: the
 * caller IS authenticated, and a client that cannot tell "sign in again" from
 * "finish signing in" sends the learner back to a login page that will hand
 * them the same session.
 */
export const PASSWORD_CHANGE_REQUIRED = "password_change_required";

export interface GuardOptions {
  /**
   * Let a session through that still owes a password change.
   *
   * Exactly one route sets it. If you are reaching for it, the question to
   * answer first is why a person who has not finished signing in needs what is
   * behind your route.
   */
  allowPasswordChange?: boolean;
}

function passwordChangeOutstanding(
  user: SessionUser,
  options: GuardOptions | undefined,
): GuardResult<never> | null {
  if (options?.allowPasswordChange) return null;
  if (!user.mustChangePassword) return null;
  return { ok: false, status: 403, reason: PASSWORD_CHANGE_REQUIRED };
}

/** Signed in, any role. */
export async function requireUser(options?: GuardOptions): Promise<GuardResult<SessionUser>> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, reason: "not_authenticated" };
  const outstanding = passwordChangeOutstanding(user, options);
  if (outstanding) return outstanding;
  return { ok: true, value: user };
}

/**
 * Signed in with one of these roles.
 *
 * 403 rather than 404 for a wrong role: the route's existence is not the
 * secret, the data behind it is. Where the existence IS the secret — a specific
 * class id — `requireClassAccess` answers 404 instead, see below.
 */
export async function requireRole(...roles: SchoolRole[]): Promise<GuardResult<SessionUser>> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, reason: "not_authenticated" };
  const outstanding = passwordChangeOutstanding(user, undefined);
  if (outstanding) return outstanding;
  if (!roles.includes(user.role)) return { ok: false, status: 403, reason: "forbidden" };
  return { ok: true, value: user };
}

/**
 * A teacher, and this class specifically.
 *
 * Authority comes from `class_teachers` — not from the role alone, and not from
 * a class id in the URL. "Teacher" is not a key to every class in the school.
 *
 * A teacher asking about a class they do not teach gets **404, not 403**, and
 * the difference matters: 403 confirms the class exists, which turns the
 * endpoint into an oracle for enumerating a school's classes. An admin is
 * allowed through for their own school only.
 */
export async function requireClassAccess(
  classId: string,
): Promise<GuardResult<{ user: SessionUser; schoolId: string; classId: string }>> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, reason: "not_authenticated" };
  /* Before the role check and before the store: a teacher who has not finished
     signing in must not be able to reach a roster, and must not be able to
     learn whether a class id exists by the shape of the refusal either. */
  const outstanding = passwordChangeOutstanding(user, undefined);
  if (outstanding) return outstanding;
  if (user.role === "student") return { ok: false, status: 403, reason: "forbidden" };

  const store = await getStore();

  if (user.role === "admin") {
    /*
     * Scoped to their own school — and now actually checked.
     *
     * This branch used to be `return { ok: true, ... }` with no lookup at all:
     * ANY string in the URL was accepted, and the caller's own `schoolId` was
     * stamped onto the result. The comment claimed the scoping the code did not
     * do. That was survivable only by accident — no shipped tool can create an
     * admin, because `scripts/provision-class.ts` types the role as
     * `"student" | "teacher"` — and "the role is unreachable" is not a control.
     *
     * It mattered because the class-keyed store queries downstream
     * (`subjectsInClass`, `isInClass`, `lastActivityForClass`) filter on
     * `class_id` ALONE, so an accepted foreign class id would have read another
     * school's children. `classExists` closes it at the guard; the teacher
     * analytics in `schools/teacher/queries.ts` close it again at the query, by
     * sourcing every population from `class_enrolments`, which is keyed on the
     * school.
     *
     * 404 rather than 403 here for the same reason as the teacher branch below:
     * the two answers must be indistinguishable or the endpoint enumerates a
     * school's classes.
     */
    const exists = await store.classExists(user.schoolId, classId);
    if (!exists) return { ok: false, status: 404, reason: "not_found" };
    return { ok: true, value: { user, schoolId: user.schoolId, classId } };
  }

  const teaches = await store.teachesClass(user.userId, user.schoolId, classId);
  if (!teaches) return { ok: false, status: 404, reason: "not_found" };

  return { ok: true, value: { user, schoolId: user.schoolId, classId } };
}

/**
 * A student, and the learning subject behind them.
 *
 * Every learning route resolves the subject from the SESSION, never from
 * anything the browser supplies. That is the property that makes "student A
 * cannot read student B" true by construction rather than by a check somebody
 * has to remember to write: there is no parameter to tamper with.
 */
export async function requireLearner(): Promise<
  GuardResult<{ user: SessionUser; subjectId: string; classId: string }>
> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, reason: "not_authenticated" };
  const outstanding = passwordChangeOutstanding(user, undefined);
  if (outstanding) return outstanding;

  const store = await getStore();
  const classes = await store.classesForLearner(user.userId);
  const enrolled = classes[0];
  if (!enrolled) return { ok: false, status: 403, reason: "not_enrolled" };

  const subjectId = await store.resolveSubjectForUser(user.userId, {
    schoolId: enrolled.schoolId,
    classId: enrolled.classId,
  });

  return { ok: true, value: { user, subjectId, classId: enrolled.classId } };
}
