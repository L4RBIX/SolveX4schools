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
  if (user) return { ok: true, status: 200, reason: "session" };
  if (anonymousLearningAllowed()) return { ok: true, status: 200, reason: "anonymous_development" };
  return { ok: false, status: 401, reason: "not_authenticated" };
}
