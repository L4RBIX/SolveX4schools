import "server-only";
import { deny, requireClassAccess } from "@schools/auth/guard";
import { getStoreHandle } from "@schools/store";
import type { LearningStore } from "@schools/store/learning-store";
import type { SqlExecutor } from "@schools/store/sql";
import { isTeacherPeriod, type PeriodDescriptor, type TeacherPeriod } from "./contracts";
import { resolvePeriod } from "./period";
import { loadClassBundle, requestedMonth, type ClassBundle } from "./context";

/**
 * The opening five lines of every teacher route, written once.
 *
 * ## Why a helper rather than a pattern to remember
 *
 * There are now eight teacher endpoints where there was one. A guard that has
 * to be re-typed eight times is a guard that will be missing from the ninth,
 * and the thing behind it is a list of named children with the misconceptions
 * the system believes it can name. `store.isInClass`'s own doc comment calls
 * itself "the single check every teacher route makes before returning
 * anything"; this makes that structurally true instead of aspirational.
 *
 * ## What it enforces
 *
 * - Authenticated, via `requireClassAccess` -> `currentUser()`.
 * - Not a student (403).
 * - Teaches THIS class, from `class_teachers` — not from the role. 404, never
 *   403, for a class not taught, so the endpoint cannot be used to enumerate a
 *   school's classes.
 * - Admins are checked against `school_classes` for their own school, which
 *   they were not before this rebuild.
 *
 * Cross-school isolation is enforced a second time one layer down: every
 * population in `schools/teacher/queries.ts` comes from `class_enrolments`,
 * which is keyed `(school_id, class_id)`. Two independent mechanisms, because
 * the store's own class-keyed queries filter on `class_id` alone and a future
 * caller reaching for one of those would otherwise reopen the hole.
 */

export interface TeacherRequest {
  sql: SqlExecutor;
  store: LearningStore;
  schoolId: string;
  classId: string;
  userId: string;
  period: PeriodDescriptor;
  bundle: ClassBundle;
  now: number;
}

export type TeacherRouteResult =
  | { ok: true; value: TeacherRequest }
  | { ok: false; response: Response };

/**
 * Guard, resolve the period, and load the class bundle.
 *
 * `now` is taken once and threaded everywhere. A route that calls `Date.now()`
 * in three places can classify the same learner as active in one panel and
 * inactive in another on the same screen.
 */
export async function openTeacherRequest(
  request: Request,
  classId: string,
): Promise<TeacherRouteResult> {
  const guard = await requireClassAccess(classId);
  if (!guard.ok) return { ok: false, response: deny(guard.status, guard.reason) };

  const { sql, store } = await getStoreHandle();
  const now = Date.now();
  const period = resolvePeriod(periodOf(request), new Date(now));
  /*
   * The month, resolved ONCE for the whole request and threaded from here.
   *
   * Every teacher endpoint goes through this function, so the month a screen
   * describes is decided in one place. That is the point rather than a
   * convenience: the defect this replaces was a single global "current month"
   * that every screen computed the same wrong way, and the failure mode of
   * fixing it per screen would be worse — an overview describing September
   * beside a lesson table describing May, with nothing saying which is which.
   *
   * `requestedMonth` returns null for anything not servable, including a stale
   * bookmark to a month since withdrawn, and the bundle then derives the
   * class's own. A teacher is never shown a 400 for asking about a month.
   */
  const requested = await requestedMonth(monthOf(request));
  const bundle = await loadClassBundle(
    sql,
    store,
    guard.value.schoolId,
    classId,
    now,
    requested,
  );

  return {
    ok: true,
    value: {
      sql,
      store,
      schoolId: guard.value.schoolId,
      classId,
      userId: guard.value.user.userId,
      period,
      bundle,
      now,
    },
  };
}

/**
 * The requested window, defaulting to the week.
 *
 * An unrecognised value takes the default rather than 400ing: a bookmarked URL
 * with a stale period is a teacher's bookmark, not an attack, and refusing it
 * mid-lesson is worse than showing them this week.
 */
export function periodOf(request: Request): TeacherPeriod {
  const raw = new URL(request.url).searchParams.get("period");
  return isTeacherPeriod(raw) ? raw : "week";
}

/**
 * A learner in THIS class, or nothing.
 *
 * The membership check for every per-learner drill-down. It deliberately reads
 * the bundle's own roster rather than calling `store.isInClass`, because that
 * method filters on `class_id` alone with no school predicate — see the module
 * comment in `queries.ts`. The roster came from `class_enrolments`, so
 * membership here means membership in this school's class.
 *
 * Returns null for an unknown subject, and the caller answers 404 — the same
 * shape as a class not taught, for the same reason.
 */
export function memberBySubject(bundle: ClassBundle, subjectId: string) {
  return bundle.members.find((m) => m.subjectId === subjectId) ?? null;
}

/** Standard cache headers: never. Teacher data is per-request and per-teacher. */
export function teacherJson(body: unknown): Response {
  return Response.json(body, {
    headers: {
      "cache-control": "private, no-store",
    },
  });
}

/**
 * The `?month=` a teacher asked for, as a raw string.
 *
 * Parsing and validation live in `requestedMonth`, beside the list of months
 * the deployment actually serves — this only reads the query string, for the
 * same reason `periodOf` does: one place knows how a teacher request is
 * shaped.
 */
function monthOf(request: Request): string | null {
  try {
    return new URL(request.url).searchParams.get("month");
  } catch {
    return null;
  }
}
