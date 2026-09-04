import "server-only";
import { config } from "@schools/config";
import { currentUser } from "./session";

/**
 * When a learning route may serve an anonymous caller.
 *
 * ## The problem this names
 *
 * `resolveIdentity` falls back to an anonymous cookie when there is no session,
 * which was the whole identity model before migration 0012. That fallback is
 * useful in development — the clone's demo pages, a quick check of a lesson
 * without provisioning an account — and unacceptable in a school deployment,
 * where "anyone with the URL gets a learning subject" is not a feature.
 *
 * It is NOT a security hole in the "reads another child's data" sense: an
 * anonymous caller gets a fresh subject with an empty state, never someone
 * else's. It is a correctness and governance problem — unenrolled work
 * accumulating against subjects that belong to nobody, in a product whose whole
 * claim is that a teacher's class list is truthful.
 *
 * ## The rule
 *
 * Production and preview require a session. Development does not, and says so
 * out loud rather than differing silently. One function, so a route cannot
 * accidentally hold a different opinion from its neighbour.
 */
export function anonymousLearningAllowed(): boolean {
  return config.environment === "development";
}

export interface LearningAccess {
  ok: boolean;
  status: number;
  reason: string;
}

/**
 * May this request use a learning route at all?
 *
 * Deliberately separate from `requireLearner` in `guard.ts`: that one insists on
 * an enrolled learner and hands back their subject, which is right for routes
 * that write evidence. This is the softer gate for routes that only need to
 * know the caller is entitled to be here, and it is what keeps the development
 * flow working without putting a hole in the deployed product.
 */
export async function checkLearningAccess(): Promise<LearningAccess> {
  const user = await currentUser();
  if (user) {
    /*
     * A first-login session is not a session that may accumulate evidence.
     *
     * Same rule as every guard in `schools/auth/guard.ts`, stated here because
     * the learning routes come through this function rather than through those
     * — thirteen of them, including submit, events, complete and the Nova hint
     * ladder. Enforcing it in one place and not the other would have left the
     * hole exactly where it was: a one-time credential from a slip of paper
     * that has been round a classroom could write a child's ledger.
     *
     * The learner is still refused with 403 and a reason the player can act on,
     * rather than 401, which would bounce them to a login page that hands back
     * the same session.
     */
    if (user.mustChangePassword) {
      return { ok: false, status: 403, reason: "password_change_required" };
    }
    return { ok: true, status: 200, reason: "session" };
  }
  if (anonymousLearningAllowed()) return { ok: true, status: 200, reason: "anonymous_development" };
  return { ok: false, status: 401, reason: "not_authenticated" };
}
